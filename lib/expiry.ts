import 'server-only';
import { prisma } from './db';
import type { Booking, PrismaClient } from '@prisma/client';

type DbClient = PrismaClient | Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export interface ExpiryResult {
  expired: boolean;
  booking: Booking | null;
}

export class InventoryInconsistencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryInconsistencyError';
  }
}

/**
 * Server-authoritative check and expiry transition for a single booking.
 *
 * Invariant:
 * 1. PENDING -> EXPIRED transition and the exact reserved inventory decrement
 *    MUST occur inside the SAME database transaction.
 * 2. If inventory update cannot release exact reservation amount (reserved_quantity >= quantity),
 *    the entire transaction rolls back.
 * 3. Booking must remain PENDING if inventory release fails.
 * 4. Repeated calls produce zero duplicate inventory releases.
 */
export async function checkAndExpireBooking(
  bookingIdOrPublicId: string,
  customClient?: DbClient
): Promise<ExpiryResult> {
  const db = (customClient || prisma) as PrismaClient;

  // Execute in an interactive transaction
  return await db.$transaction(async (tx) => {
    // 1. Fetch current booking record
    const booking = await tx.booking.findFirst({
      where: {
        OR: [{ id: bookingIdOrPublicId }, { publicId: bookingIdOrPublicId }],
      },
    });

    if (!booking) {
      return { expired: false, booking: null };
    }

    // If not PENDING, booking cannot be expired by this lifecycle transition
    if (booking.status !== 'PENDING') {
      return { expired: booking.status === 'EXPIRED', booking };
    }

    // Check if server expiry time has passed
    const now = new Date();
    if (booking.expiresAt > now) {
      return { expired: false, booking };
    }

    // 2. Conditional transition PENDING -> EXPIRED
    const bookingUpdateCount = await tx.$executeRaw`
      UPDATE bookings
      SET status = 'EXPIRED'::"BookingStatus",
          updated_at = NOW()
      WHERE id = ${booking.id}
        AND status = 'PENDING'::"BookingStatus"
        AND expires_at <= NOW()
    `;

    // If 0 rows updated, a concurrent transaction already transitioned this booking
    if (bookingUpdateCount === 0) {
      const current = await tx.booking.findUnique({ where: { id: booking.id } });
      return { expired: current?.status === 'EXPIRED', booking: current };
    }

    // 3. Exact reserved inventory release
    // Invariant: reserved_quantity >= booking.quantity. No clamping to zero!
    // If not enough reserved quantity, throw to roll back the entire transaction.
    const passUpdateCount = await tx.$executeRaw`
      UPDATE passes
      SET reserved_quantity = reserved_quantity - ${booking.quantity},
          updated_at = NOW()
      WHERE id = ${booking.passId}
        AND reserved_quantity >= ${booking.quantity}
    `;

    if (passUpdateCount === 0) {
      throw new InventoryInconsistencyError(
        `Inventory release failed: Pass "${booking.passId}" has insufficient reserved_quantity to release exact ${booking.quantity} passes for booking ${booking.publicId}. Rolling back entire transaction.`
      );
    }

    // 4. Fetch and return authoritative post-expiry booking
    const updatedBooking = await tx.booking.findUnique({
      where: { id: booking.id },
    });

    return { expired: true, booking: updatedBooking };
  });
}

/**
 * Passively expires stale pending bookings matching a specific query filter (e.g. phone/email).
 * Guarantees that any booking list returned to a customer reflects the post-expiry state.
 */
export async function expireStaleBookingsForQuery(whereFilter: {
  phone?: string;
  email?: string | null;
}): Promise<number> {
  const staleBookings = await prisma.booking.findMany({
    where: {
      ...whereFilter,
      status: 'PENDING',
      expiresAt: { lte: new Date() },
    },
    select: { id: true },
  });

  let expiredCount = 0;
  for (const item of staleBookings) {
    try {
      const res = await checkAndExpireBooking(item.id);
      if (res.expired) expiredCount++;
    } catch (err) {
      console.error(`[Expiry] Failed to expire stale booking ${item.id}:`, err);
    }
  }

  return expiredCount;
}

/**
 * Batch maintenance helper to expire stale pending bookings across the system.
 */
export async function expireAllStaleBookings(limit = 50): Promise<number> {
  const staleBookings = await prisma.booking.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lte: new Date() },
    },
    take: limit,
    select: { id: true },
    orderBy: { expiresAt: 'asc' },
  });

  let expiredCount = 0;
  for (const item of staleBookings) {
    try {
      const res = await checkAndExpireBooking(item.id);
      if (res.expired) expiredCount++;
    } catch (err) {
      console.error(`[Batch Expiry] Failed to expire booking ${item.id}:`, err);
    }
  }

  return expiredCount;
}
