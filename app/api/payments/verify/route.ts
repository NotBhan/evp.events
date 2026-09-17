import 'server-only';
import { prisma } from '@/lib/db';
import { checkAndExpireBooking } from '@/lib/expiry';
import { getAuthorizedBookingIdsFromCookie } from '@/lib/session';
import {
  confirmBookingPayment,
  verifyRazorpayCheckoutSignature,
  fetchRazorpayPayment,
  BookingExpiredError,
  AmountMismatchError,
} from '@/lib/payments';
import { createEntryTokenForBooking } from '@/lib/entry-token';

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
  const razorpayPaymentId =
    typeof body.razorpay_payment_id === 'string'
      ? body.razorpay_payment_id.trim()
      : '';
  const razorpayOrderId =
    typeof body.razorpay_order_id === 'string'
      ? body.razorpay_order_id.trim()
      : '';
  const razorpaySignature =
    typeof body.razorpay_signature === 'string'
      ? body.razorpay_signature.trim()
      : '';

  if (
    !rawBookingId ||
    !razorpayPaymentId ||
    !razorpayOrderId ||
    !razorpaySignature
  ) {
    return Response.json(
      {
        success: false,
        error:
          'Missing required verification parameters (bookingId, razorpay_payment_id, razorpay_order_id, razorpay_signature).',
      },
      { status: 400 }
    );
  }

  // 1. Session Authorization Guard
  const authorizedIds = await getAuthorizedBookingIdsFromCookie();
  if (!authorizedIds || authorizedIds.length === 0) {
    return Response.json(
      {
        success: false,
        error: 'Unauthorized: Lookup session required to verify payment.',
      },
      { status: 401 }
    );
  }

  // 2. Resolve booking from Neon
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

  // Verify session belongs to this booking
  if (!authorizedIds.includes(booking.publicId)) {
    return Response.json(
      {
        success: false,
        error: 'Forbidden: You do not have permission to verify this booking.',
      },
      { status: 403 }
    );
  }

  // 3. Expiry Check
  if (booking.status === 'EXPIRED') {
    return Response.json(
      {
        success: false,
        error: 'This booking reservation has expired. Cannot confirm payment.',
      },
      { status: 410 }
    );
  }

  if (booking.status === 'PENDING' && booking.expiresAt <= new Date()) {
    await checkAndExpireBooking(booking.id);
    return Response.json(
      {
        success: false,
        error: 'This booking reservation window has elapsed. Pass hold released.',
      },
      { status: 410 }
    );
  }

  // 4. Idempotency Check
  if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID') {
    return Response.json({
      success: true,
      alreadyConfirmed: true,
      booking: {
        bookingId: booking.publicId,
        publicId: booking.publicId,
        passType: booking.pass.name,
        quantity: booking.quantity,
        unitPrice: booking.unitPrice,
        total: booking.totalAmount,
        fullName: booking.fullName,
        phone: booking.phone,
        email: booking.email,
        city: booking.city,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt.toISOString(),
        expiresAt: booking.expiresAt.toISOString(),
        confirmedAt: booking.confirmedAt?.toISOString() || null,
        entryToken: createEntryTokenForBooking(booking),
      },
    });
  }

  // 5. Resolve Authoritative Order ID from Neon & Cryptographic Signature Verification
  const paymentAttempt = await prisma.paymentAttempt.findFirst({
    where: {
      bookingId: booking.id,
      provider: 'razorpay',
      providerOrderId: razorpayOrderId,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!paymentAttempt || !paymentAttempt.providerOrderId) {
    return Response.json(
      {
        success: false,
        error: 'Cryptographic signature verification failed. Payment cannot be confirmed.',
      },
      { status: 400 }
    );
  }

  const authoritativeOrderId = paymentAttempt.providerOrderId;

  const isSignatureValid = verifyRazorpayCheckoutSignature({
    orderId: authoritativeOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isSignatureValid) {
    return Response.json(
      {
        success: false,
        error: 'Cryptographic signature verification failed. Payment cannot be confirmed.',
      },
      { status: 400 }
    );
  }

  // 6. Server-Side Payment Status Verification via Razorpay API
  try {
    const payment = await fetchRazorpayPayment(razorpayPaymentId);

    // Verify order ID alignment with database authoritative order ID
    if (payment.order_id !== authoritativeOrderId) {
      return Response.json(
        {
          success: false,
          error: `Payment order ID mismatch. Expected "${authoritativeOrderId}", received "${payment.order_id}".`,
        },
        { status: 400 }
      );
    }

    // Verify payment is captured
    if (payment.status !== 'captured') {
      return Response.json(
        {
          success: false,
          error: `Payment is in state "${payment.status}". Only captured payments confirm bookings.`,
        },
        { status: 400 }
      );
    }

    // Verify authoritative amount matches Neon (in paise)
    const authoritativePaise = booking.totalAmount * 100;
    if (payment.amount !== authoritativePaise) {
      return Response.json(
        {
          success: false,
          error: `Payment amount (${payment.amount} paise) does not match authoritative booking total (${authoritativePaise} paise).`,
        },
        { status: 400 }
      );
    }

    // 7. Atomic Interactive Transactional Fulfillment
    const result = await confirmBookingPayment({
      provider: 'razorpay',
      providerOrderId: authoritativeOrderId,
      providerPaymentId: razorpayPaymentId,
      expectedAmountPaise: payment.amount,
      bookingPublicId: booking.publicId,
      paymentAttemptId: paymentAttempt.id,
    });

    return Response.json({
      success: true,
      booking: {
        bookingId: result.booking.publicId,
        publicId: result.booking.publicId,
        passType: booking.pass.name,
        quantity: result.booking.quantity,
        unitPrice: result.booking.unitPrice,
        total: result.booking.totalAmount,
        fullName: result.booking.fullName,
        phone: result.booking.phone,
        email: result.booking.email,
        city: result.booking.city,
        status: result.booking.status,
        paymentStatus: result.booking.paymentStatus,
        createdAt: result.booking.createdAt.toISOString(),
        expiresAt: result.booking.expiresAt.toISOString(),
        confirmedAt: result.booking.confirmedAt?.toISOString() || null,
        entryToken: createEntryTokenForBooking(result.booking),
      },
      paymentAttempt: {
        id: result.paymentAttempt.id,
        status: result.paymentAttempt.status,
        provider: result.paymentAttempt.provider,
        providerOrderId: result.paymentAttempt.providerOrderId,
        providerPaymentId: result.paymentAttempt.providerPaymentId,
      },
    });
  } catch (err: unknown) {
    if (err instanceof BookingExpiredError) {
      return Response.json(
        { success: false, error: err.message },
        { status: 410 }
      );
    }
    if (err instanceof AmountMismatchError) {
      return Response.json(
        { success: false, error: err.message },
        { status: 400 }
      );
    }

    console.error(
      '[Razorpay Verification Error]',
      err instanceof Error ? err.message : 'Unknown verification error'
    );
    return Response.json(
      {
        success: false,
        error:
          'Payment verification failed. Please refresh or contact event support.',
      },
      { status: 500 }
    );
  }
}
