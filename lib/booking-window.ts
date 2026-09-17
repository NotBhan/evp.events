/**
 * Centralized public booking-window logic — single source of truth.
 *
 * Scope: gates creation of NEW bookings only. It must never be applied to
 * existing-booking lifecycle operations (payment verification, lookup,
 * recovery, cancellation/refund) or to organiser entry/check-in.
 *
 * Runtime deployment configuration (NOT dates hardcoded in source):
 * - BOOKING_OPEN_AT  — ISO-8601 timestamp with an explicit timezone offset
 * - BOOKING_CLOSE_AT — ISO-8601 timestamp with an explicit timezone offset
 *
 * Boundary semantics (LOCKED):
 * - Open boundary is inclusive:  now >= openAt
 * - Close boundary is exclusive: now <  closeAt
 *
 * Fail-safe: missing / empty / unparsable / offset-less / reversed values yield
 * an explicit INVALID state (new bookings blocked) — never a silent fallback
 * to arbitrary dates and never a bypass flag.
 */

export type BookingWindowStatus = 'OPEN' | 'NOT_OPEN' | 'CLOSED' | 'INVALID';

export type BookingWindowReason =
  | 'BOOKING_NOT_OPEN'
  | 'BOOKING_CLOSED'
  | 'BOOKING_WINDOW_INVALID';

export interface BookingWindowState {
  status: BookingWindowStatus;
  isOpen: boolean;
  reason: BookingWindowReason | null;
  openAt: string | null;
  closeAt: string | null;
  checkedAt: string;
  invalidVariables: string[];
}

const ISO_OFFSET_SUFFIX = /(?:Z|[+-]\d{2}:\d{2})$/i;

function parseBoundary(rawValue: string | undefined): Date | null {
  if (typeof rawValue !== 'string') return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  if (!ISO_OFFSET_SUFFIX.test(trimmed)) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/**
 * Returns the authoritative booking-window state for the given instant
 * (defaults to server time). Accepts an injectable timestamp for deterministic
 * tests; the browser never provides authoritative "now".
 */
export function getBookingWindowState(now: Date = new Date()): BookingWindowState {
  const checkedAt = now.toISOString();
  const openAtRaw = process.env.BOOKING_OPEN_AT;
  const closeAtRaw = process.env.BOOKING_CLOSE_AT;

  const openAt = parseBoundary(openAtRaw);
  const closeAt = parseBoundary(closeAtRaw);

  const invalidVariables: string[] = [];
  if (!openAt) invalidVariables.push('BOOKING_OPEN_AT');
  if (!closeAt) invalidVariables.push('BOOKING_CLOSE_AT');

  if (
    !openAt ||
    !closeAt ||
    openAt.getTime() >= closeAt.getTime()
  ) {
    if (openAt && closeAt && openAt.getTime() >= closeAt.getTime()) {
      invalidVariables.push('BOOKING_OPEN_AT>=BOOKING_CLOSE_AT');
    }
    return {
      status: 'INVALID',
      isOpen: false,
      reason: 'BOOKING_WINDOW_INVALID',
      openAt: openAt ? openAt.toISOString() : null,
      closeAt: closeAt ? closeAt.toISOString() : null,
      checkedAt,
      invalidVariables,
    };
  }

  const nowMs = now.getTime();

  if (nowMs < openAt.getTime()) {
    return {
      status: 'NOT_OPEN',
      isOpen: false,
      reason: 'BOOKING_NOT_OPEN',
      openAt: openAt.toISOString(),
      closeAt: closeAt.toISOString(),
      checkedAt,
      invalidVariables: [],
    };
  }

  if (nowMs >= closeAt.getTime()) {
    return {
      status: 'CLOSED',
      isOpen: false,
      reason: 'BOOKING_CLOSED',
      openAt: openAt.toISOString(),
      closeAt: closeAt.toISOString(),
      checkedAt,
      invalidVariables: [],
    };
  }

  return {
    status: 'OPEN',
    isOpen: true,
    reason: null,
    openAt: openAt.toISOString(),
    closeAt: closeAt.toISOString(),
    checkedAt,
    invalidVariables: [],
  };
}

/**
 * Convenience boolean for the authoritative server-side gate.
 */
export function isBookingOpen(now?: Date): boolean {
  return getBookingWindowState(now).isOpen;
}
