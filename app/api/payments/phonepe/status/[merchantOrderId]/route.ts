import 'server-only';
import { prisma } from '@/lib/db';
import { checkAndExpireBooking } from '@/lib/expiry';
import { getAuthorizedBookingIdsFromCookie } from '@/lib/session';
import {
  confirmBookingPayment,
  failBookingPayment,
  fetchPhonePeOrderStatus,
  validateMerchantOrderId,
  BookingExpiredError,
  AmountMismatchError,
} from '@/lib/payments';
import { createEntryTokenForBooking } from '@/lib/entry-token';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ merchantOrderId: string }> }
) {
  const resolvedParams = await params;
  const merchantOrderId = resolvedParams.merchantOrderId?.trim();

  if (!merchantOrderId || !validateMerchantOrderId(merchantOrderId)) {
    return Response.json(
      { success: false, error: 'Invalid or missing merchantOrderId parameter.' },
      { status: 400 }
    );
  }

  // 1. Locate stored PaymentAttempt for this merchantOrderId
  const attempt = await prisma.paymentAttempt.findFirst({
    where: {
      provider: 'phonepe',
      providerOrderId: merchantOrderId,
    },
    include: {
      booking: {
        include: { pass: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!attempt || !attempt.booking) {
    return Response.json(
      {
        success: false,
        error: `No PhonePe payment attempt found for order "${merchantOrderId}".`,
      },
      { status: 404 }
    );
  }

  const { booking } = attempt;

  // 2. Authorization guard: if user has active lookup session cookies, verify ownership
  const authorizedIds = await getAuthorizedBookingIdsFromCookie();
  if (authorizedIds && authorizedIds.length > 0 && !authorizedIds.includes(booking.publicId)) {
    return Response.json(
      {
        success: false,
        error: 'Forbidden: You do not have permission to check status for this booking.',
      },
      { status: 403 }
    );
  }

  // 3. Fast-path idempotency: if booking is already CONFIRMED and PAID
  if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID') {
    return Response.json({
      success: true,
      state: 'COMPLETED',
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

  // 4. Check if 24-hour reservation hold has expired
  if (booking.status === 'EXPIRED') {
    return Response.json(
      {
        success: false,
        state: 'EXPIRED',
        error: 'This booking reservation has expired and is no longer payable.',
      },
      { status: 410 }
    );
  }

  if (booking.status === 'PENDING' && booking.expiresAt <= new Date()) {
    await checkAndExpireBooking(booking.id);
    return Response.json(
      {
        success: false,
        state: 'EXPIRED',
        error: 'This booking reservation has expired and is no longer payable.',
      },
      { status: 410 }
    );
  }

  // 5. Query PhonePe's Order Status API directly
  let phonePeStatus;
  try {
    phonePeStatus = await fetchPhonePeOrderStatus(merchantOrderId);
  } catch (apiErr) {
    console.error('[PhonePe Order Status API Error]', apiErr);
    return Response.json(
      {
        success: false,
        state: 'PENDING',
        error: 'Unable to reach PhonePe to verify payment status. Please retry.',
      },
      { status: 502 }
    );
  }

  const state = phonePeStatus.state.toUpperCase();
  const authoritativePaise = booking.totalAmount * 100;

  // 6. Handle authoritative PhonePe Order State
  if (state === 'COMPLETED') {
    // Validate amount where payment details are provided
    if (phonePeStatus.amount && phonePeStatus.amount !== authoritativePaise) {
      console.error(
        `[PhonePe Amount Mismatch] PhonePe reported ${phonePeStatus.amount} paise, expected ${authoritativePaise} paise.`
      );
      return Response.json(
        {
          success: false,
          error: `Payment amount (${phonePeStatus.amount} paise) does not match authoritative booking total (${authoritativePaise} paise).`,
        },
        { status: 400 }
      );
    }

    try {
      // Invoke common payment confirmation finalizer
      const confirmed = await confirmBookingPayment({
        provider: 'phonepe',
        providerOrderId: merchantOrderId,
        providerPaymentId: phonePeStatus.orderId || merchantOrderId,
        expectedAmountPaise: authoritativePaise,
        bookingPublicId: booking.publicId,
        paymentAttemptId: attempt.id,
      });

      return Response.json({
        success: true,
        state: 'COMPLETED',
        booking: {
          bookingId: confirmed.booking.publicId,
          publicId: confirmed.booking.publicId,
          passType: booking.pass.name,
          quantity: confirmed.booking.quantity,
          unitPrice: confirmed.booking.unitPrice,
          total: confirmed.booking.totalAmount,
          fullName: confirmed.booking.fullName,
          phone: confirmed.booking.phone,
          email: confirmed.booking.email,
          city: confirmed.booking.city,
          status: confirmed.booking.status,
          paymentStatus: confirmed.booking.paymentStatus,
          createdAt: confirmed.booking.createdAt.toISOString(),
          expiresAt: confirmed.booking.expiresAt.toISOString(),
          confirmedAt: confirmed.booking.confirmedAt?.toISOString() || null,
          entryToken: createEntryTokenForBooking(confirmed.booking),
        },
      });
    } catch (err: unknown) {
      if (err instanceof BookingExpiredError) {
        return Response.json(
          { success: false, state: 'EXPIRED', error: err.message },
          { status: 410 }
        );
      }
      if (err instanceof AmountMismatchError) {
        return Response.json(
          { success: false, state: 'FAILED', error: err.message },
          { status: 400 }
        );
      }
      console.error('[PhonePe Confirmation Finalizer Error]', err);
      return Response.json(
        { success: false, error: 'Internal error finalizing payment.' },
        { status: 500 }
      );
    }
  }

  if (state === 'FAILED') {
    await failBookingPayment({
      provider: 'phonepe',
      providerOrderId: merchantOrderId,
      paymentAttemptId: attempt.id,
    });

    return Response.json({
      success: false,
      state: 'FAILED',
      message: 'PhonePe payment failed or was cancelled by user.',
    });
  }

  // If state is PENDING or any other transitional state
  return Response.json({
    success: true,
    state: 'PENDING',
    message: 'Payment is pending. Please wait for completion.',
  });
}
