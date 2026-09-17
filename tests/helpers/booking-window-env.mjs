/**
 * Explicit OPEN booking window for test suites that create bookings through the
 * real HTTP API. Keeps suites independent of .env.local and of the wall clock /
 * 2026 event dates (BOOKING_OPEN_AT / BOOKING_CLOSE_AT are ISO-8601 with offset).
 *
 * Spawned servers inherit process.env first; Next.js does not override values
 * already present in the environment, so these win over .env.local.
 */
const now = Date.now();

export const OPEN_BOOKING_WINDOW_ENV = Object.freeze({
  BOOKING_OPEN_AT: new Date(now - 60 * 60 * 1000).toISOString(),
  BOOKING_CLOSE_AT: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
});
