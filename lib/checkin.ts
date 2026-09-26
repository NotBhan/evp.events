import 'server-only';
import { prisma } from './db';
import { syncBookingToSheets } from './sheets';
import { formatOrganiserDisplayIdentity, type OrganiserIdentity } from './organiser-auth';
import type { Booking, BookingStatus, CheckInStatus, PaymentStatus, Pass } from '@/lib/generated/prisma';

export type EntryFailureReason =
  | 'INVALID_QR'
  | 'BOOKING_NOT_FOUND'
  | 'BOOKING_EXPIRED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_NOT_CONFIRMED'
  | 'BOOKING_NOT_CONFIRMED'
  | 'ALREADY_CHECKED_IN'
  | 'UNKNOWN';

export interface EntryBookingView {
  bookingId: string;
  attendeeName: string;
  passType: string;
  quantity: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  entryStatus: CheckInStatus;
  checkedInAt: string | null;
  scannedBy: string | null;
}

export type EntryVerification =
  | { valid: true; booking: EntryBookingView }
  | { valid: false; reason: EntryFailureReason; booking: EntryBookingView | null };

export type EntryConfirmation =
  | { ok: true; booking: EntryBookingView }
  | { ok: false; reason: EntryFailureReason; booking: EntryBookingView | null };

type BookingWithPass = Booking & { pass: Pass };

function toView(booking: BookingWithPass): EntryBookingView {
  return {
    bookingId: booking.publicId,
    attendeeName: booking.fullName,
    passType: booking.pass.name,
    quantity: booking.quantity,
    bookingStatus: booking.status,
    paymentStatus: booking.paymentStatus,
    entryStatus: booking.checkInStatus,
    checkedInAt: booking.checkedInAt ? booking.checkedInAt.toISOString() : null,
    scannedBy: booking.checkedInBy ?? null,
  };
}

/**
 * Authoritative classification of whether a booking may be admitted.
 * Only CONFIRMED + PAID + NOT_CHECKED_IN is admissible.
 */
export function classifyEntryState(booking: BookingWithPass): {
  valid: boolean;
  reason: EntryFailureReason | null;
} {
  if (booking.status === 'EXPIRED') return { valid: false, reason: 'BOOKING_EXPIRED' };
  if (booking.status === 'CANCELLED') return { valid: false, reason: 'BOOKING_CANCELLED' };
  if (booking.status === 'PENDING') return { valid: false, reason: 'BOOKING_NOT_CONFIRMED' };
  if (booking.status !== 'CONFIRMED') return { valid: false, reason: 'UNKNOWN' };
  if (booking.paymentStatus !== 'PAID') return { valid: false, reason: 'PAYMENT_NOT_CONFIRMED' };
  if (booking.checkInStatus === 'CHECKED_IN') return { valid: false, reason: 'ALREADY_CHECKED_IN' };
  return { valid: true, reason: null };
}

async function loadBooking(publicId: string): Promise<BookingWithPass | null> {
  return prisma.booking.findUnique({
    where: { publicId },
    include: { pass: true },
  });
}

/**
 * Read-only verification. Never mutates admission state.
 */
export async function verifyEntry(publicId: string): Promise<EntryVerification> {
  const booking = await loadBooking(publicId);
  if (!booking) return { valid: false, reason: 'BOOKING_NOT_FOUND', booking: null };

  const view = toView(booking);
  const classification = classifyEntryState(booking);

  if (!classification.valid) {
    return { valid: false, reason: classification.reason ?? 'UNKNOWN', booking: view };
  }

  return { valid: true, booking: view };
}

/**
 * Atomic admission transition. The single conditional UPDATE is the admission
 * decision: exactly one concurrent confirmation can ever succeed.
 *
 * On success the Sheets mirror is attempted AFTER the database commit and can
 * never roll back or reject the successful entry.
 */
export async function confirmEntry(
  publicId: string,
  organiser: OrganiserIdentity
): Promise<EntryConfirmation> {
  const displayIdentity = formatOrganiserDisplayIdentity(organiser);

  const updatedRows = await prisma.$executeRaw`
    UPDATE bookings
    SET check_in_status = 'CHECKED_IN'::"CheckInStatus",
        checked_in_at   = NOW(),
        checked_in_by   = ${displayIdentity},
        checked_in_by_id= ${organiser.organiserId},
        sheet_sync_status = 'PENDING'::"SheetSyncStatus",
        sheet_last_error  = NULL,
        updated_at      = NOW()
    WHERE public_id = ${publicId}
      AND status = 'CONFIRMED'::"BookingStatus"
      AND payment_status = 'PAID'::"PaymentStatus"
      AND check_in_status = 'NOT_CHECKED_IN'::"CheckInStatus"
  `;

  if (updatedRows === 0) {
    // Classify from current authoritative state (duplicate entry, invalid state, or missing).
    const current = await loadBooking(publicId);
    if (!current) return { ok: false, reason: 'BOOKING_NOT_FOUND', booking: null };

    const classification = classifyEntryState(current);
    return {
      ok: false,
      reason: classification.reason ?? 'UNKNOWN',
      booking: toView(current),
    };
  }

  const booking = await loadBooking(publicId);
  if (!booking) return { ok: false, reason: 'UNKNOWN', booking: null };

  // Post-commit secondary mirror (never blocks or rolls back a successful entry).
  try {
    await syncBookingToSheets(booking.id);
  } catch (err) {
    console.error(
      '[Check-in] Sheets mirror attempt failed after committed entry:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }

  return { ok: true, booking: toView(booking) };
}
