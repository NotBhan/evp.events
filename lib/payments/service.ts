import 'server-only';
import { prisma } from '@/lib/db';
import { checkAndExpireBooking } from '@/lib/expiry';
import {
  type ConfirmPaymentParams,
  type FailPaymentParams,
  BookingExpiredError,
  PaymentAttemptNotFoundError,
  AmountMismatchError,
  PaymentError,
} from './types';
import type { Booking, PaymentAttempt } from '@prisma/client';

export class InventoryInconsistencyError extends PaymentError {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryInconsistencyError';
  }
}

export interface ConfirmPaymentResult {
  success: boolean;
  alreadyProcessed?: boolean;
  booking: Booking;
  paymentAttempt: PaymentAttempt;
}

/**
 * Atomically confirms a booking upon verified payment success.
 *
 * Invariants:
 * 1. Resolves and locks to the specific PaymentAttempt and Booking.
 * 2. If PaymentAttempt already SUCCEEDED -> idempotent no-op, returns existing state.
 * 3. If Booking is EXPIRED -> throws BookingExpiredError, refuses confirmation, preserves inventory.
 * 4. Verifies authoritative amount: expectedAmountPaise must equal booking.totalAmount * 100.
 * 5. Atomically commits:
 *    - PaymentAttempt -> SUCCEEDED
 *    - Booking.status -> CONFIRMED, payment_status -> PAID, confirmed_at -> NOW()
 *    - Pass.reserved_quantity -= booking.quantity
 *    - Pass.sold_quantity += booking.quantity
 *    (Condition: reserved_quantity >= booking.quantity)
 * 6. If any step fails, interactive transaction rolls back completely.
 */
export async function confirmBookingPayment(
  params: ConfirmPaymentParams
): Promise<ConfirmPaymentResult> {
  const {
    provider,
    providerOrderId,
    providerPaymentId,
    expectedAmountPaise,
    bookingPublicId,
    paymentAttemptId,
  } = params;

  return await prisma.$transaction(async (tx) => {
    // 1. Resolve target PaymentAttempt
    let attempt: PaymentAttempt | null = null;
    if (paymentAttemptId) {
      attempt = await tx.paymentAttempt.findUnique({
        where: { id: paymentAttemptId },
      });
    }

    if (!attempt && providerOrderId) {
      attempt = await tx.paymentAttempt.findFirst({
        where: {
          provider,
          providerOrderId,
        },
      });
    }

    if (!attempt) {
      throw new PaymentAttemptNotFoundError(
        `No PaymentAttempt found for provider "${provider}" and order ID "${providerOrderId}".`
      );
    }

    // 2. Resolve associated Booking
    const booking = await tx.booking.findUnique({
      where: { id: attempt.bookingId },
      include: { pass: true },
    });

    if (!booking) {
      throw new PaymentError(`Booking not found for PaymentAttempt ${attempt.id}.`);
    }

    // Guard against cross-booking collision / mismatch
    if (bookingPublicId && booking.publicId !== bookingPublicId) {
      throw new PaymentError(
        `Security violation: Stripe event public ID "${bookingPublicId}" does not match record "${booking.publicId}".`
      );
    }

    // 3. Idempotency Check on specific PaymentAttempt
    if (attempt.status === 'SUCCEEDED') {
      return {
        success: true,
        alreadyProcessed: true,
        booking,
        paymentAttempt: attempt,
      };
    }

    // 4. Check if booking already confirmed via another attempt
    if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID') {
      // Mark this attempt SUCCEEDED, but DO NOT touch pass inventory again
      const updatedAttempt = await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'SUCCEEDED',
          providerPaymentId: providerPaymentId || attempt.providerPaymentId,
        },
      });
      return {
        success: true,
        alreadyProcessed: true,
        booking,
        paymentAttempt: updatedAttempt,
      };
    }

    // 5. Expiry Protection Guard
    // Invariant: An EXPIRED booking must NEVER transition to CONFIRMED through late payment.
    if (booking.status === 'EXPIRED') {
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'FAILED',
          providerPaymentId: providerPaymentId || attempt.providerPaymentId,
        },
      });
      throw new BookingExpiredError(
        `Booking ${booking.publicId} has expired. Cannot confirm payment on an expired reservation.`
      );
    }

    // Check if reservation time has elapsed
    const now = new Date();
    if (booking.expiresAt <= now) {
      // Transition to expired and reject
      await tx.$executeRaw`
        UPDATE bookings
        SET status = 'EXPIRED'::"BookingStatus",
            updated_at = NOW()
        WHERE id = ${booking.id}
          AND status = 'PENDING'::"BookingStatus"
      `;
      await tx.$executeRaw`
        UPDATE passes
        SET reserved_quantity = reserved_quantity - ${booking.quantity},
            updated_at = NOW()
        WHERE id = ${booking.passId}
          AND reserved_quantity >= ${booking.quantity}
      `;
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'FAILED',
          providerPaymentId: providerPaymentId || attempt.providerPaymentId,
        },
      });
      throw new BookingExpiredError(
        `Booking ${booking.publicId} reservation window elapsed. Reservation released.`
      );
    }

    // 6. Authoritative Amount Verification
    const authoritativePaise = booking.totalAmount * 100;
    if (
      expectedAmountPaise !== undefined &&
      expectedAmountPaise !== authoritativePaise
    ) {
      throw new AmountMismatchError(
        `Amount mismatch: Stripe reported ${expectedAmountPaise} paise, but authoritative total is ${authoritativePaise} paise.`
      );
    }

    // 7. Atomic Interactive Commit
    // A. Update PaymentAttempt -> SUCCEEDED
    const updatedAttempt = await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'SUCCEEDED',
        providerPaymentId: providerPaymentId || attempt.providerPaymentId,
      },
    });

    // B. Update Booking -> CONFIRMED, PAID
    const bookingUpdateCount = await tx.$executeRaw`
      UPDATE bookings
      SET status = 'CONFIRMED'::"BookingStatus",
          payment_status = 'PAID'::"PaymentStatus",
          confirmed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${booking.id}
        AND status = 'PENDING'::"BookingStatus"
    `;

    if (bookingUpdateCount === 0) {
      throw new PaymentError(
        `Failed to transition booking ${booking.publicId} to CONFIRMED. Concurrent mutation detected.`
      );
    }

    // C. Atomic Inventory Transition: reserved -> sold
    // Must release from reserved and add to sold in same atomic query
    const passUpdateCount = await tx.$executeRaw`
      UPDATE passes
      SET reserved_quantity = reserved_quantity - ${booking.quantity},
          sold_quantity = sold_quantity + ${booking.quantity},
          updated_at = NOW()
      WHERE id = ${booking.passId}
        AND reserved_quantity >= ${booking.quantity}
    `;

    if (passUpdateCount === 0) {
      throw new InventoryInconsistencyError(
        `Inventory transition failed: Pass "${booking.passId}" has insufficient reserved_quantity (${booking.pass.reservedQuantity}) to convert ${booking.quantity} reserved tickets to sold for booking ${booking.publicId}. Rolling back entire transaction.`
      );
    }

    const updatedBooking = await tx.booking.findUnique({
      where: { id: booking.id },
      include: { pass: true },
    });

    return {
      success: true,
      booking: updatedBooking!,
      paymentAttempt: updatedAttempt,
    };
  });
}

/**
 * Handles payment failure by marking only the specific PaymentAttempt FAILED.
 *
 * Invariants:
 * 1. Resolves to the specific PaymentAttempt.
 * 2. Leaves the booking PENDING while reservation is still valid.
 * 3. Does NOT release inventory.
 * 4. Never overwrites a SUCCEEDED payment attempt.
 */
export async function failBookingPayment(
  params: FailPaymentParams
): Promise<{ success: boolean; paymentAttempt: PaymentAttempt | null }> {
  const {
    provider,
    providerOrderId,
    providerPaymentId,
    paymentAttemptId,
  } = params;

  return await prisma.$transaction(async (tx) => {
    let attempt: PaymentAttempt | null = null;
    if (paymentAttemptId) {
      attempt = await tx.paymentAttempt.findUnique({
        where: { id: paymentAttemptId },
      });
    }

    if (!attempt && providerOrderId) {
      attempt = await tx.paymentAttempt.findFirst({
        where: {
          provider,
          providerOrderId,
        },
      });
    }

    if (!attempt && providerPaymentId) {
      attempt = await tx.paymentAttempt.findFirst({
        where: {
          provider,
          providerPaymentId,
        },
      });
    }

    if (!attempt) {
      return { success: false, paymentAttempt: null };
    }

    // Never overwrite an already SUCCEEDED attempt
    if (attempt.status === 'SUCCEEDED') {
      return { success: true, paymentAttempt: attempt };
    }

    const updatedAttempt = await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'FAILED',
        providerPaymentId: providerPaymentId || attempt.providerPaymentId,
      },
    });

    return { success: true, paymentAttempt: updatedAttempt };
  });
}
