import 'server-only';
import { prisma } from '@/lib/db';
import { checkAndExpireBooking } from '@/lib/expiry';
import { getAuthorizedBookingIdsFromCookie } from '@/lib/session';

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const requestedId = resolvedParams.id?.trim();

  if (!requestedId) {
    return Response.json(
      { success: false, error: 'Booking ID parameter is required.' },
      { status: 400 }
    );
  }

  // 1. Validate temporary lookup session from HTTP-only cookie
  const authorizedIds = await getAuthorizedBookingIdsFromCookie();
  if (!authorizedIds || authorizedIds.length === 0) {
    return Response.json(
      {
        success: false,
        error: 'Unauthorized: Lookup session required to view booking details.',
      },
      { status: 401 }
    );
  }

  // 2. Strict authorization check: requested ID must be authorized by this session
  if (!authorizedIds.includes(requestedId)) {
    return Response.json(
      {
        success: false,
        error: 'Forbidden: You do not have permission to view this reservation.',
      },
      { status: 403 }
    );
  }

  try {
    // 3. Check server-authoritative expiry
    await checkAndExpireBooking(requestedId);

    // 4. Fetch updated booking
    const booking = await prisma.booking.findUnique({
      where: { publicId: requestedId },
      include: { pass: true },
    });

    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found.' },
        { status: 404 }
      );
    }

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
      },
    });
  } catch (err: unknown) {
    console.error(
      '[Booking Detail Error]',
      err instanceof Error ? err.message : 'Database error'
    );
    return Response.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
