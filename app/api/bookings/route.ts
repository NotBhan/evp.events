import 'server-only';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { resolvePass } from '@/lib/passes';
import { setLookupSessionCookie, getAuthorizedBookingIdsFromCookie } from '@/lib/session';
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

/**
 * Generates a collision-resistant public booking reference in the existing
 * RU26-REQ-XXXX format (e.g. RU26-REQ-4819).
 */
function generatePublicBookingId(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `RU26-REQ-${randomDigits}`;
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

  // 1. Anti-Spam Honeypot Check
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

  // 2. Validate Attendee Fields
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

  let email: string | null = null;
  if (body.email && typeof body.email === 'string') {
    const trimmedEmail = body.email.trim();
    if (trimmedEmail.length > 0 && trimmedEmail.toUpperCase() !== 'N/A') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return Response.json(
          { success: false, error: 'Please provide a valid email address.' },
          { status: 400 }
        );
      }
      email = trimmedEmail.toLowerCase();
    }
  }

  const city =
    typeof body.city === 'string' && body.city.trim().length > 0
      ? body.city.trim().substring(0, 80)
      : 'Ranchi';

  // 3. Validate Pass Tier and Quantity
  const passIdentifier = typeof body.passId === 'string' ? body.passId.trim() : '';
  if (!passIdentifier) {
    return Response.json(
      { success: false, error: 'Pass tier selection is required.' },
      { status: 400 }
    );
  }

  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return Response.json(
      { success: false, error: 'Quantity must be an integer between 1 and 20.' },
      { status: 400 }
    );
  }

  // 4. Authoritative Transaction with Unique Collision Retry Loop
  const MAX_COLLISION_RETRIES = 5;
  let retryCount = 0;

  while (retryCount < MAX_COLLISION_RETRIES) {
    retryCount++;
    const publicBookingId = generatePublicBookingId();

    try {
      const result = await prisma.$transaction(async (tx) => {
        // A. Resolve authoritative pass record
        const pass = await resolvePass(passIdentifier, tx);
        if (!pass || !pass.isActive) {
          throw new PassNotFoundError();
        }

        // B. Atomic conditional inventory reservation
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
        const unitPrice = pass.price;
        const totalAmount = unitPrice * quantity;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from server time

        // D. Cryptographic recovery token generation for email-less bookings (atomic with booking creation)
        let rawRecoveryToken: string | null = null;
        let recoveryTokenHash: string | null = null;
        if (!email) {
          rawRecoveryToken = crypto.randomBytes(24).toString('base64url');
          recoveryTokenHash = crypto.createHash('sha256').update(rawRecoveryToken).digest('hex');
        }

        // E. Create Booking record
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
            recoveryTokenHash,
            source: 'web-booking-desk',
          },
        });

        return { booking, pass, rawRecoveryToken };
      });

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
          ...(result.rawRecoveryToken ? { recoveryToken: result.rawRecoveryToken } : {}),
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

      // Check for Prisma unique constraint collision on public_id
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        (Array.isArray(err.meta?.target)
          ? err.meta.target.includes('public_id')
          : String(err.meta?.target || '').includes('public_id'))
      ) {
        console.warn(
          `[Booking API] Public ID collision detected for "${publicBookingId}". Retrying (${retryCount}/${MAX_COLLISION_RETRIES})...`
        );
        continue;
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

  // If retries exhausted
  return Response.json(
    {
      success: false,
      error: 'Unable to assign a unique booking reference. Please try again.',
    },
    { status: 500 }
  );
}

