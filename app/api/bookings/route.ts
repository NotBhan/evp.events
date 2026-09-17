import 'server-only';
import { prisma } from '@/lib/db';
import { resolvePass } from '@/lib/passes';
import { setLookupSessionCookie, getAuthorizedBookingIdsFromCookie } from '@/lib/session';
import { getBookingWindowState } from '@/lib/booking-window';
import {
  withUniqueBookingId,
  BookingIdExhaustedError,
  MAX_COLLISION_RETRIES,
} from '@/lib/booking-id';
import { Prisma } from '@prisma/client';

export class InventoryUnavailableError extends Error {
  constructor(message = 'Pass inventory is currently not available or sold out.') {
    super(message);
    this.name = 'InventoryUnavailableError';
  }
}

export class PassNotFoundError extends Error {
  constructor(message = 'Requested pass tier was not found or is inactive.') {
    super(message);
    this.name = 'PassNotFoundError';
  }
}

/**
 * Validates and normalizes an Indian mobile phone number.
 * Accepts 10 digits directly, or prefixed with +91 or 0.
 * Returns formatted "+91 XXXXX XXXXX" string or null if invalid.
 */
function normalizeIndianPhone(phoneInput: unknown): string | null {
  if (typeof phoneInput !== 'string') return null;
  const digits = phoneInput.replace(/\D/g, '');

  let tenDigits = digits;
  if (digits.length === 12 && digits.startsWith('91')) {
    tenDigits = digits.substring(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    tenDigits = digits.substring(1);
  }

  if (tenDigits.length !== 10 || !/^[6-9]\d{9}$/.test(tenDigits)) {
    return null;
  }

  return `+91 ${tenDigits.substring(0, 5)} ${tenDigits.substring(5)}`;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  // 1. Booking Window Enforcement (server-authoritative, new bookings only)
  // Uses authoritative server time; the browser never provides "now".
  const windowState = getBookingWindowState();
  if (!windowState.isOpen) {
    if (windowState.status === 'INVALID') {
      console.error(
        '[Booking Window] New booking creation blocked: invalid booking window configuration.',
        { invalidVariables: windowState.invalidVariables }
      );
    }
    return Response.json(
      {
        success: false,
        code: windowState.reason,
        error:
          windowState.reason === 'BOOKING_NOT_OPEN'
            ? 'Bookings are not open yet. Please check back when the booking window opens.'
            : windowState.reason === 'BOOKING_CLOSED'
              ? 'The booking window has closed. New reservations are no longer accepted.'
              : 'Bookings are temporarily unavailable. Please try again later.',
      },
      { status: 403 }
    );
  }

  // 2. Anti-Spam Honeypot Check
  if (
    body.hp_company_field &&
    typeof body.hp_company_field === 'string' &&
    body.hp_company_field.trim().length > 0
  ) {
    return Response.json(
      { success: false, error: 'Anti-spam validation triggered.' },
      { status: 400 }
    );
  }

  // 3. Validate Attendee Fields
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  if (fullName.length < 2 || fullName.length > 80) {
    return Response.json(
      { success: false, error: 'Please provide a valid full name (2–80 characters).' },
      { status: 400 }
    );
  }

  const formattedPhone = normalizeIndianPhone(body.phone);
  if (!formattedPhone) {
    return Response.json(
      {
        success: false,
        error: 'Please provide a valid 10-digit Indian mobile number (e.g. +91 99315 03960).',
      },
      { status: 400 }
    );
  }

  // Email is required: it is the only lookup key for retrieving a booking later.
  const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
  if (!rawEmail) {
    return Response.json(
      { success: false, error: 'Please provide an email address so you can retrieve your pass later.' },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return Response.json(
      { success: false, error: 'Please provide a valid email address.' },
      { status: 400 }
    );
  }
  const email: string = rawEmail.toLowerCase();

  const city =
    typeof body.city === 'string' && body.city.trim().length > 0
      ? body.city.trim().substring(0, 80)
      : 'Ranchi';

  // 4. Pass Tier Selection (single pass per booking — client quantity/price/total are ignored)
  const passIdentifier = typeof body.passId === 'string' ? body.passId.trim() : '';
  if (!passIdentifier) {
    return Response.json(
      { success: false, error: 'Pass tier selection is required.' },
      { status: 400 }
    );
  }

  const quantity = 1;

  // 5. Authoritative Transaction with Unique Collision Retry Loop
  try {
    const result = await withUniqueBookingId(
      async (publicBookingId) =>
        prisma.$transaction(async (tx) => {
        // A. Resolve authoritative pass record
        const pass = await resolvePass(passIdentifier, tx);
        if (!pass || !pass.isActive) {
          throw new PassNotFoundError();
        }

        // B. Atomic conditional inventory reservation (exactly one pass per booking)
        // Guarantees zero overselling; backed by PostgreSQL CHECK constraint
        const updatedRows = await tx.$executeRaw`
          UPDATE passes
          SET reserved_quantity = reserved_quantity + ${quantity},
              updated_at = NOW()
          WHERE id = ${pass.id}
            AND is_active = true
            AND (total_quantity - reserved_quantity - sold_quantity) >= ${quantity}
        `;

        if (updatedRows === 0) {
          throw new InventoryUnavailableError(
            'Pass inventory is currently not available or sold out. Production inventory must be configured before bookings are enabled.'
          );
        }

        // C. Snapshot authoritative pricing and server expiry
        // One booking = one purchased pass; the pass tier alone determines admission capacity.
        const unitPrice = pass.price;
        const totalAmount = unitPrice;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from server time

        // D. Create Booking record
        const booking = await tx.booking.create({
          data: {
            publicId: publicBookingId,
            fullName,
            phone: formattedPhone,
            email,
            city,
            passId: pass.id,
            quantity,
            unitPrice,
            totalAmount,
            status: 'PENDING',
            paymentStatus: 'NOT_STARTED',
            expiresAt,
            source: 'web-booking-desk',
          },
        });

        return { booking, pass };
      }),
      {
        onCollision: (publicId, attempt) => {
          console.warn(
            `[Booking API] Public ID collision detected for "${publicId}". Retrying (${attempt}/${MAX_COLLISION_RETRIES})...`
          );
        },
      }
    );

    // Authorize newly created booking in the user's lookup session
    try {
      const existingAuthorized = await getAuthorizedBookingIdsFromCookie();
      await setLookupSessionCookie([...existingAuthorized, result.booking.publicId]);
    } catch (sessionErr) {
      console.warn('[Booking API] Failed to issue lookup session cookie:', sessionErr);
    }

    // Return sanitized public booking information
    return Response.json(
      {
        success: true,
        bookingId: result.booking.publicId,
        passId: result.pass.passType,
        passType: result.pass.name,
        quantity: result.booking.quantity,
        unitPrice: result.booking.unitPrice,
        totalAmount: result.booking.totalAmount,
        total: result.booking.totalAmount,
        customerName: result.booking.fullName,
        fullName: result.booking.fullName,
        phone: result.booking.phone,
        email: result.booking.email,
        city: result.booking.city,
        status: result.booking.status,
        paymentStatus: result.booking.paymentStatus,
        createdAt: result.booking.createdAt.toISOString(),
        expiresAt: result.booking.expiresAt.toISOString(),
        message: 'Booking request recorded successfully.',
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof PassNotFoundError) {
      return Response.json(
        { success: false, error: err.message },
        { status: 404 }
      );
    }

    if (err instanceof InventoryUnavailableError) {
      return Response.json(
        { success: false, error: err.message },
        { status: 409 }
      );
    }

    // Retry budget exhausted: never reuse or overwrite an existing booking id.
    if (err instanceof BookingIdExhaustedError) {
      console.error(
        `[Booking API] Unique booking reference could not be assigned after ${MAX_COLLISION_RETRIES} attempts.`
      );
      return Response.json(
        {
          success: false,
          error: 'Unable to assign a unique booking reference. Please try again.',
        },
        { status: 500 }
      );
    }

    // Server-side diagnostic capture: full stack trace for development
    console.error(
      '[Booking API Error]',
      err instanceof Error ? err.stack : err
    );

      if (err instanceof Prisma.PrismaClientInitializationError) {
        return Response.json(
          {
            success: false,
            error: 'The reservation database service is temporarily unavailable. Please try again shortly.',
          },
          { status: 503 }
        );
      }

      return Response.json(
        {
          success: false,
          error: 'An unexpected error occurred while processing your reservation request. Please try again.',
        },
        { status: 500 }
      );
  }
}

