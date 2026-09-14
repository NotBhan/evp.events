import 'server-only';
import { prisma } from '@/lib/db';
import { checkAndExpireBooking } from '@/lib/expiry';
import { getAuthorizedBookingIdsFromCookie } from '@/lib/session';
import { getPaymentProvider, resolveSafeBaseUrl } from '@/lib/payments';

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

  const rawBookingId =
    typeof body.bookingId === 'string' ? body.bookingId.trim() : '';

  if (!rawBookingId) {
    return Response.json(
      { success: false, error: 'Booking identifier is required.' },
      { status: 400 }
    );
  }

  // 1. Session Authorization Guard
  const authorizedIds = await getAuthorizedBookingIdsFromCookie();
  if (!authorizedIds || authorizedIds.length === 0) {
    return Response.json(
      {
        success: false,
        error: 'Unauthorized: Lookup session required to initiate payment.',
      },
      { status: 401 }
    );
  }

  // 2. Fetch authoritative booking record from Neon
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ id: rawBookingId }, { publicId: rawBookingId }],
    },
    include: { pass: true },
  });

  if (!booking) {
    return Response.json(
      { success: false, error: 'Booking reservation not found.' },
      { status: 404 }
    );
  }

  // Check that this session authorizes this specific booking
  if (!authorizedIds.includes(booking.publicId)) {
    return Response.json(
      {
        success: false,
        error: 'Forbidden: You do not have permission to pay for this reservation.',
      },
      { status: 403 }
    );
  }

  // 3. Status checks
  if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID') {
    return Response.json(
      {
        success: true,
        alreadyConfirmed: true,
        message: 'This booking reservation is already confirmed and paid.',
      },
      { status: 200 }
    );
  }

  if (booking.status === 'EXPIRED') {
    return Response.json(
      {
        success: false,
        error: 'This booking reservation has expired and is no longer payable.',
      },
      { status: 410 }
    );
  }

  // Authoritative server-side expiry evaluation
  if (booking.status === 'PENDING' && booking.expiresAt <= new Date()) {
    await checkAndExpireBooking(booking.id);
    return Response.json(
      {
        success: false,
        error: 'This booking reservation has expired and is no longer payable.',
      },
      { status: 410 }
    );
  }

  try {
    // 4. Resolve configured PaymentProvider ('stripe' or 'razorpay')
    const provider = getPaymentProvider();

    // 5. Create PaymentAttempt record in Neon
    const attempt = await prisma.paymentAttempt.create({
      data: {
        bookingId: booking.id,
        provider: provider.name,
        amount: booking.totalAmount,
        status: 'INITIATED',
      },
    });

    // 6. Resolve safe base URL for redirect callbacks (Origin protection)
    const baseUrl = resolveSafeBaseUrl(req);

    // 7. Invoke PaymentProvider to create checkout session/order
    const session = await provider.createCheckoutSession({
      booking,
      paymentAttemptId: attempt.id,
      baseUrl,
    });

    // 8. Store providerOrderId (Stripe Checkout Session ID or Razorpay Order ID)
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: { providerOrderId: session.sessionId },
    });

    return Response.json({
      success: true,
      provider: session.provider,
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId,
      orderId: session.orderId || session.sessionId,
      amount: session.amount,
      currency: session.currency,
      keyId: session.keyId,
      paymentAttemptId: attempt.id,
      booking: {
        publicId: booking.publicId,
        totalAmount: booking.totalAmount,
        fullName: booking.fullName,
        phone: booking.phone,
        email: booking.email,
        passType: booking.pass.name,
        quantity: booking.quantity,
        expiresAt: booking.expiresAt.toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error(
      '[Payment Creation Error]',
      err instanceof Error ? err.message : 'Unknown payment error'
    );
    return Response.json(
      {
        success: false,
        error: 'Unable to initialize checkout session. Please try again.',
      },
      { status: 500 }
    );
  }
}
