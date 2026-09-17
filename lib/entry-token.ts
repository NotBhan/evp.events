/**
 * Deterministic signed QR entry credential (crypto/token validation ONLY — no DB).
 *
 * Payload format (LOCKED):
 *   canonical = RAAS26.ENTRY.v1.<publicId>
 *   signature = base64url( HMAC_SHA256( ENTRY_QR_SECRET, canonical ) )
 *   QR        = RAAS26.ENTRY.v1.<publicId>.<signature>
 *
 * Properties:
 * - Deterministic: the same booking re-renders the identical QR on every retrieval.
 * - PII-free: contains no email/phone/payment data.
 * - Stateless: no QR token column is required.
 * - Unforgeable without the server-only ENTRY_QR_SECRET.
 *
 * Business-state validation (confirmed/paid/not-checked-in) happens separately in
 * lib/checkin.ts after the publicId is extracted here.
 */

import crypto from 'node:crypto';

const EVENT_ID = 'RAAS26';
const PURPOSE = 'ENTRY';
const VERSION = 'v1';
const MAX_TOKEN_LENGTH = 512;
const MAX_PUBLIC_ID_LENGTH = 32;
const MIN_SECRET_LENGTH = 32;

export const ENTRY_QR_PREFIX = `${EVENT_ID}.${PURPOSE}.${VERSION}.`;

function getEntryQrSecret(): string {
  const secret = process.env.ENTRY_QR_SECRET;
  if (typeof secret !== 'string' || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `ENTRY_QR_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters.`
    );
  }
  return secret;
}

function computeSignature(canonical: string): string {
  return crypto
    .createHmac('sha256', getEntryQrSecret())
    .update(canonical)
    .digest('base64url');
}

/**
 * Creates the deterministic entry QR token for a public booking id.
 * Throws when ENTRY_QR_SECRET is not configured (callers must fail closed).
 */
export function createEntryQrToken(publicId: string): string {
  if (typeof publicId !== 'string' || publicId.length === 0 || publicId.length > MAX_PUBLIC_ID_LENGTH) {
    throw new Error('A valid public booking id is required to create an entry QR token.');
  }
  const canonical = `${ENTRY_QR_PREFIX}${publicId}`;
  return `${canonical}.${computeSignature(canonical)}`;
}

/**
 * Entry QR token for receipt/view-model boundaries: only a CONFIRMED + PAID booking
 * has an active entry QR. Returns undefined for every other state (no active QR for
 * pending/expired/cancelled/unpaid bookings) and fails closed if the secret is absent.
 */
export function createEntryTokenForBooking(booking: {
  publicId: string;
  status: string;
  paymentStatus: string;
}): string | undefined {
  if (booking.status !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') return undefined;

  try {
    return createEntryQrToken(booking.publicId);
  } catch (err) {
    console.error(
      '[Entry Token] Unable to create entry QR token:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return undefined;
  }
}

/**
 * Verifies a QR token's structure and signature. Returns the extracted publicId
 * or null. Rejects malformed/oversized input up front without normalizing it.
 */
export function verifyEntryQrToken(qrToken: unknown): { publicId: string } | null {
  if (typeof qrToken !== 'string') return null;
  if (qrToken.length === 0 || qrToken.length > MAX_TOKEN_LENGTH) return null;

  const parts = qrToken.split('.');
  if (parts.length !== 5) return null;

  const [eventId, purpose, version, publicId, signature] = parts;
  if (eventId !== EVENT_ID || purpose !== PURPOSE || version !== VERSION) return null;
  if (!publicId || publicId.length > MAX_PUBLIC_ID_LENGTH) return null;
  if (!/^[A-Za-z0-9-]+$/.test(publicId)) return null;
  if (!signature) return null;

  try {
    const canonical = `${ENTRY_QR_PREFIX}${publicId}`;
    const expected = Buffer.from(computeSignature(canonical));
    const provided = Buffer.from(signature);

    if (provided.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(provided, expected)) return null;

    return { publicId };
  } catch {
    // Missing/invalid secret => fail closed.
    return null;
  }
}
