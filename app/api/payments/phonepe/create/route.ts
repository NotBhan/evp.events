import 'server-only';
import { prisma } from '@/lib/db';
import { checkAndExpireBooking } from '@/lib/expiry';
import { getAuthorizedBookingIdsFromCookie } from '@/lib/session';
import {
  createPhonePePaymentOrder,
  validateMerchantOrderId,
  resolveSafeBaseUrl,
} from '@/lib/payments';

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

  // 2. Fetch authoritative booking record from DB
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

  // 3. Status and eligibility checks
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

  // Authoritative server-side 24-hour reservation expiry evaluation
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
    // 4. Derive payment amount ONLY from authoritative DB record (never trust client)
    const amountPaise = booking.totalAmount * 100;

    // 5. Generate unique merchantOrderId (<= 63 chars, valid chars)
    // Format: "ru26_" + publicId + "_" + timestamp (typically ~32 chars)
    const merchantOrderId = `ru26_${booking.publicId}_${Date.now()}`;
    if (!validateMerchantOrderId(merchantOrderId)) {
      return Response.json(
        { success: false, error: 'Failed to generate a valid merchant order ID.' },
        { status: 500 }
      );
    }

    // 6. Create PaymentAttempt record in DB with provider = "phonepe"
    const attempt = await prisma.paymentAttempt.create({
      data: {
        bookingId: booking.id,
        provider: 'phonepe',
        amount: booking.totalAmount,
        status: 'INITIATED',
        providerOrderId: merchantOrderId,
      },
    });

    // 7. Resolve redirect URL for return fallback
    const baseUrl = resolveSafeBaseUrl(req);
    const redirectUrl = `${baseUrl}/booking/payment/phonepe?merchantOrderId=${encodeURIComponent(merchantOrderId)}`;

    // 8. Call PhonePe Standard Checkout v2 Create Payment API
    // Payment session expiry: 1200 seconds (20 mins), completely independent of booking's 24-hour hold
    const phonePeOrder = await createPhonePePaymentOrder({
      merchantOrderId,
      amountPaise,
      expireAfterSeconds: 1200,
      redirectUrl,
      metaData: {
        bookingPublicId: booking.publicId,
        paymentAttemptId: attempt.id,
      },
    });

    // 9. Update PaymentAttempt if PhonePe returned an explicit provider orderId
    if (phonePeOrder.orderId && phonePeOrder.orderId !== merchantOrderId) {
      await prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: { providerOrderId: merchantOrderId },
      });
    }

    // 10. Return redirectUrl directly to frontend along with non-sensitive details
    return Response.json({
      success: true,
      provider: 'phonepe',
      redirectUrl: phonePeOrder.redirectUrl,
      merchantOrderId,
      orderId: phonePeOrder.orderId,
      amount: amountPaise,
      currency: 'INR',
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
      '[PhonePe Payment Creation Error]',
      err instanceof Error ? err.message : 'Unknown payment error'
    );
    return Response.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : 'Unable to initialize PhonePe checkout session. Please try again.',
      },
      { status: 500 }
    );
  }
}
