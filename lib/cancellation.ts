import 'server-only';
import { prisma } from '@/lib/db';
import {
  CANCELLATION_DEADLINE_ISO,
  CANCELLATION_DEADLINE_DISPLAY,
  isCancellationAllowed,
  calculateGstAndRefund,
  RefundCalculation,
} from './cancellation-constants';

export * from './cancellation-constants';

export class CancellationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'CancellationError';
    this.statusCode = statusCode;
  }
}

export interface CancelBookingResult {
  alreadyCancelled: boolean;
  booking: {
    id: string;
    publicId: string;
    passId: string;
    passType: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    cancelledAt: string;
  };
  refund: RefundCalculation;
  message: string;
}

/**
 * Server-authoritative cancellation of a confirmed booking.
 * Requirements:
 * 1. Must be authorized by active lookup session (authorizedPublicIds).
 * 2. Must be on or before 6 October 2026 23:59:59 IST.
 * 3. Atomic transaction:
 *    - Booking: CONFIRMED -> CANCELLED
 *    - Pass: soldQuantity -= quantity (strictly checking soldQuantity >= quantity)
 * 4. Idempotent: repeated cancellations return existing state without duplicate inventory refund.
 * 5. PENDING & EXPIRED bookings rejected.
 */
export async function cancelConfirmedBooking(
  publicId: string,
  authorizedPublicIds: string[]
): Promise<CancelBookingResult> {
  const cleanId = publicId.trim();

  // 1. Fetch booking record by publicId or id
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ id: cleanId }, { publicId: cleanId }],
    },
    include: { pass: true },
  });

  if (!booking) {
    throw new CancellationError('Booking not found.', 404);
  }

  // 2. Strict authorization check: booking.publicId must be in authorizedPublicIds
  if (!authorizedPublicIds || !authorizedPublicIds.includes(booking.publicId)) {
    throw new CancellationError(
      'Forbidden: You do not have permission to cancel this reservation.',
      403
    );
  }

  // 3. Idempotent short-circuit if already cancelled
  if (booking.status === 'CANCELLED') {
    const refund = calculateGstAndRefund(booking.totalAmount);
    return {
      alreadyCancelled: true,
      booking: {
        id: booking.id,
        publicId: booking.publicId,
        passId: booking.pass.passType,
        passType: booking.pass.name,
        quantity: booking.quantity,
        unitPrice: booking.unitPrice,
        totalAmount: booking.totalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        cancelledAt: booking.updatedAt.toISOString(),
      },
      refund,
      message: 'Booking is already cancelled. Refund is handled separately.',
    };
  }

  // 4. Reject invalid booking statuses
  if (booking.status === 'EXPIRED') {
    throw new CancellationError('Expired reservations cannot be cancelled.', 400);
  }

  if (booking.status === 'PENDING') {
    throw new CancellationError(
      'Pending unpaid reservations cannot be cancelled via this flow. Unpaid requests automatically expire after 24 hours without penalty.',
      400
    );
  }

  if (booking.status !== 'CONFIRMED') {
    throw new CancellationError(
      `Bookings with status "${booking.status}" cannot be cancelled.`,
      400
    );
  }

  // 5. Server-authoritative cancellation cutoff check
  if (!isCancellationAllowed()) {
    throw new CancellationError(
      `Cancellation deadline has passed (${CANCELLATION_DEADLINE_DISPLAY}). Cancellations are closed.`,
      400
    );
  }

  // 6. Atomic Database Transaction
  // A. Booking CONFIRMED -> CANCELLED
  // B. Pass soldQuantity -= booking.quantity
  const updatedBooking = await prisma.$transaction(async (tx) => {
    // A. Update booking status
    const bookingUpdateCount = await tx.$executeRaw`
      UPDATE bookings
      SET status = 'CANCELLED'::"BookingStatus",
          updated_at = NOW()
      WHERE id = ${booking.id}
        AND status = 'CONFIRMED'::"BookingStatus"
    `;

    if (bookingUpdateCount === 0) {
      throw new CancellationError(
        `Failed to cancel booking ${cleanId}. Concurrent modification detected.`,
        409
      );
    }

    // B. Decrement sold_quantity atomically, guarded by sold_quantity >= booking.quantity
    const passUpdateCount = await tx.$executeRaw`
      UPDATE passes
      SET sold_quantity = sold_quantity - ${booking.quantity},
          updated_at = NOW()
      WHERE id = ${booking.passId}
        AND sold_quantity >= ${booking.quantity}
    `;

    if (passUpdateCount === 0) {
      throw new CancellationError(
        `Inventory rollback failed: Pass "${booking.pass.name}" has insufficient sold_quantity to restore ${booking.quantity} ticket(s). Transaction rolled back.`,
        409
      );
    }

    const reloaded = await tx.booking.findUnique({
      where: { id: booking.id },
      include: { pass: true },
    });

    return reloaded!;
  });

  const refund = calculateGstAndRefund(updatedBooking.totalAmount);

  return {
    alreadyCancelled: false,
    booking: {
      id: updatedBooking.id,
      publicId: updatedBooking.publicId,
      passId: updatedBooking.pass.passType,
      passType: updatedBooking.pass.name,
      quantity: updatedBooking.quantity,
      unitPrice: updatedBooking.unitPrice,
      totalAmount: updatedBooking.totalAmount,
      status: updatedBooking.status,
      paymentStatus: updatedBooking.paymentStatus,
      cancelledAt: updatedBooking.updatedAt.toISOString(),
    },
    refund,
    message:
      'Your booking has been cancelled. Refund requests/processing are handled separately.',
  };
}
