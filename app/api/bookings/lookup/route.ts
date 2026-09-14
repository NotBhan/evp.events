import 'server-only';
import { prisma } from '@/lib/db';
import { expireStaleBookingsForQuery } from '@/lib/expiry';
import { setLookupSessionCookie } from '@/lib/session';
import {
  calculateGstAndRefund,
  isCancellationAllowed,
  CANCELLATION_DEADLINE_ISO,
  CANCELLATION_DEADLINE_DISPLAY,
} from '@/lib/cancellation';

/**
 * Validates and normalizes an Indian mobile phone number.
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

function maskEmail(emailStr: string | null): string | null {
  if (!emailStr) return null;
  const parts = emailStr.split('@');
  if (parts.length !== 2) return emailStr;
  const [user, domain] = parts;
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${'•'.repeat(Math.min(user.length - 2, 5))}${user[user.length - 1]}@${domain}`;
}

function maskPhone(phoneStr: string): string {
  const digits = phoneStr.replace(/\D/g, '');
  if (digits.length < 10) return phoneStr;
  const last4 = digits.slice(-4);
  return `+91 ••••• •${last4.slice(1)}`;
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

  // 1. Mandatory Input Validation: BOTH Email and Phone required
  const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
  const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : '';

  if (!rawEmail) {
    return Response.json(
      { success: false, error: 'Email address is required for booking lookup.' },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return Response.json(
      { success: false, error: 'Please provide a valid email address.' },
      { status: 400 }
    );
  }

  const normalizedPhone = normalizeIndianPhone(rawPhone);
  if (!normalizedPhone) {
    return Response.json(
      { success: false, error: 'Please provide a valid 10-digit Indian mobile number.' },
      { status: 400 }
    );
  }

  const normalizedEmail = rawEmail.toLowerCase();

  try {
    // 2. Passive Expiry: Transition any stale matching pending bookings before returning results
    await expireStaleBookingsForQuery({
      phone: normalizedPhone,
      email: normalizedEmail,
    });

    // 3. Query all bookings matching BOTH email and phone
    const bookings = await prisma.booking.findMany({
      where: {
        phone: normalizedPhone,
        email: normalizedEmail,
      },
      include: { pass: true },
      orderBy: { createdAt: 'desc' },
    });

    if (bookings.length === 0) {
      return Response.json(
        {
          success: false,
          error: 'No bookings found matching both this email address and phone number.',
        },
        { status: 404 }
      );
    }

    // 4. Issue temporary HTTP-only lookup session cookie authorizing these specific booking IDs
    const publicIds = bookings.map((b) => b.publicId);
    await setLookupSessionCookie(publicIds);

    const cancellationAllowed = isCancellationAllowed();

    // 5. Return sanitized booking details
    const sanitizedBookings = bookings.map((b) => {
      const refundBreakdown = calculateGstAndRefund(b.totalAmount);
      return {
        bookingId: b.publicId,
        publicId: b.publicId,
        passType: b.pass.name,
        passId: b.pass.passType,
        quantity: b.quantity,
        unitPrice: b.unitPrice,
        totalAmount: b.totalAmount,
        total: b.totalAmount,
        fullName: b.fullName,
        phone: maskPhone(b.phone),
        email: maskEmail(b.email),
        city: b.city || 'Ranchi',
        status: b.status,
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt.toISOString(),
        expiresAt: b.expiresAt.toISOString(),
        confirmedAt: b.confirmedAt ? b.confirmedAt.toISOString() : null,
        cancelledAt: b.status === 'CANCELLED' ? b.updatedAt.toISOString() : null,
        cancellationAllowed: b.status === 'CONFIRMED' && cancellationAllowed,
        cancellationDeadline: CANCELLATION_DEADLINE_ISO,
        cancellationDeadlineDisplay: CANCELLATION_DEADLINE_DISPLAY,
        refundBreakdown,
        refundStatus: b.status === 'CANCELLED' ? 'Refund handled separately.' : null,
      };
    });

    return Response.json({
      success: true,
      count: sanitizedBookings.length,
      bookings: sanitizedBookings,
    });
  } catch (err: unknown) {
    console.error(
      '[Booking Lookup Error]',
      err instanceof Error ? err.message : 'Database query failure'
    );
    return Response.json(
      {
        success: false,
        error: 'An unexpected error occurred while looking up your reservations. Please try again.',
      },
      { status: 500 }
    );
  }
}
