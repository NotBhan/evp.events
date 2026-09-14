import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const LOOKUP_SESSION_COOKIE_NAME = 'ru26_lookup_session';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.DATABASE_URL || 'ru26-default-dev-secret-salt-3981';
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export interface LookupSessionPayload {
  sessionKey: string;
  bookingIds: string[]; // Public IDs authorized by this session (e.g. RU26-REQ-4819)
  expiresAt: number;   // Timestamp (ms)
}

/**
 * Creates a cryptographically signed HMAC-SHA256 lookup session token.
 */
export function createLookupSessionToken(bookingPublicIds: string[]): string {
  const payload: LookupSessionPayload = {
    sessionKey: crypto.randomBytes(16).toString('hex'),
    bookingIds: [...new Set(bookingPublicIds.map((id) => id.trim()))],
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(serialized)
    .digest('base64url');

  return `${serialized}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 lookup session token.
 * Returns valid status and authorized public booking IDs.
 */
export function verifyLookupSessionToken(token: string | null | undefined): {
  valid: boolean;
  bookingIds: string[];
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, bookingIds: [] };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, bookingIds: [] };
  }

  const [serialized, signature] = parts;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', getSessionSecret())
      .update(serialized)
      .digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return { valid: false, bookingIds: [] };
    }

    const payload: LookupSessionPayload = JSON.parse(
      Buffer.from(serialized, 'base64url').toString('utf8')
    );

    if (typeof payload.expiresAt !== 'number' || Date.now() > payload.expiresAt) {
      return { valid: false, bookingIds: [] };
    }

    if (!Array.isArray(payload.bookingIds)) {
      return { valid: false, bookingIds: [] };
    }

    return { valid: true, bookingIds: payload.bookingIds };
  } catch {
    return { valid: false, bookingIds: [] };
  }
}

/**
 * Helper to set the HTTP-only lookup session cookie in a Route Handler.
 */
export async function setLookupSessionCookie(bookingPublicIds: string[]): Promise<string> {
  const token = createLookupSessionToken(bookingPublicIds);
  const cookieStore = await cookies();

  cookieStore.set(LOOKUP_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  return token;
}

/**
 * Helper to get the authorized public booking IDs from the current request's session cookie.
 */
export async function getAuthorizedBookingIdsFromCookie(): Promise<string[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get(LOOKUP_SESSION_COOKIE_NAME)?.value;
  const verification = verifyLookupSessionToken(token);
  return verification.valid ? verification.bookingIds : [];
}

/**
 * Helper to clear the lookup session cookie in a Route Handler.
 */
export async function clearLookupSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOOKUP_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
