import 'server-only';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { checkAndExpireBooking } from '@/lib/expiry';
import { setLookupSessionCookie } from '@/lib/session';
import {
  calculateGstAndRefund,
  isCancellationAllowed,
  CANCELLATION_DEADLINE_ISO,
  CANCELLATION_DEADLINE_DISPLAY,
} from '@/lib/cancellation';

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

  const rawBookingId = typeof body.bookingId === 'string' ? body.bookingId.trim() : '';
  const rawRecoveryToken = typeof body.recoveryToken === 'string' ? body.recoveryToken.trim() : '';

  if (!rawBookingId || !rawRecoveryToken) {
    return Response.json(
      { success: false, error: 'Both booking reference ID and recovery key are required.' },
      { status: 400 }
    );
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { publicId: rawBookingId },
      include: { pass: true },
    });

    // Generic error to prevent enumeration
    if (!booking || !booking.recoveryTokenHash) {
      return Response.json(
        { success: false, error: 'Invalid booking reference or recovery key.' },
        { status: 404 }
      );
    }

    // Cryptographic timing-safe verification
    const computedHash = crypto.createHash('sha256').update(rawRecoveryToken).digest('hex');
    const storedHashBuffer = Buffer.from(booking.recoveryTokenHash, 'hex');
    const computedHashBuffer = Buffer.from(computedHash, 'hex');

    if (
      storedHashBuffer.length !== computedHashBuffer.length ||
      !crypto.timingSafeEqual(storedHashBuffer, computedHashBuffer)
    ) {
      return Response.json(
        { success: false, error: 'Invalid booking reference or recovery key.' },
        { status: 404 }
      );
    }

    // Check if booking is stale/expired
    if (booking.status === 'EXPIRED') {
      return Response.json(
        {
          success: false,
          error: 'This booking reservation has expired and is no longer recoverable.',
        },
        { status: 410 }
      );
    }

    if (booking.status === 'PENDING' && booking.expiresAt <= new Date()) {
      await checkAndExpireBooking(booking.id);
      return Response.json(
        {
          success: false,
          error: 'This booking reservation has expired and is no longer recoverable.',
        },
        { status: 410 }
      );
    }

    // Authorize this specific booking in temporary lookup session
    await setLookupSessionCookie([booking.publicId]);

    const refundBreakdown = calculateGstAndRefund(booking.totalAmount);

    return Response.json({
      success: true,
      booking: {
        bookingId: booking.publicId,
        publicId: booking.publicId,
        passType: booking.pass.name,
        passId: booking.pass.passType,
        quantity: booking.quantity,
        unitPrice: booking.unitPrice,
        totalAmount: booking.totalAmount,
        total: booking.totalAmount,
        fullName: booking.fullName,
        phone: maskPhone(booking.phone),
        email: maskEmail(booking.email),
        city: booking.city || 'Ranchi',
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt.toISOString(),
        expiresAt: booking.expiresAt.toISOString(),
        confirmedAt: booking.confirmedAt ? booking.confirmedAt.toISOString() : null,
        cancelledAt: booking.status === 'CANCELLED' ? booking.updatedAt.toISOString() : null,
        cancellationAllowed: booking.status === 'CONFIRMED' && isCancellationAllowed(),
        cancellationDeadline: CANCELLATION_DEADLINE_ISO,
        cancellationDeadlineDisplay: CANCELLATION_DEADLINE_DISPLAY,
        refundBreakdown,
        refundStatus: booking.status === 'CANCELLED' ? 'Refund handled separately.' : null,
      },
    });
  } catch (err: unknown) {
    console.error(
      '[Booking Recovery Error]',
      err instanceof Error ? err.message : 'Database error'
    );
    return Response.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
