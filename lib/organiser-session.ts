import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const ORGANISER_SESSION_COOKIE_NAME = 'ru26_organiser_session';
const ORGANISER_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const MIN_SECRET_LENGTH = 32;

export type OrganiserRole = 'ENTRY_SCANNER' | 'ADMIN';

export interface OrganiserSessionPayload {
  organiserId: string;
  role: OrganiserRole;
  gateId: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Dedicated organiser session secret. Separate from SESSION_SECRET, ENTRY_QR_SECRET
 * and payment secrets (blast-radius isolation). Fails closed when missing/short.
 */
function getOrganiserSessionSecret(): string {
  const secret = process.env.ORGANISER_SESSION_SECRET;
  if (typeof secret !== 'string' || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `ORGANISER_SESSION_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters.`
    );
  }
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export function createOrganiserSessionToken(payload: {
  organiserId: string;
  role: OrganiserRole;
  gateId: string;
}): string {
  const now = Date.now();
  const session: OrganiserSessionPayload = {
    organiserId: payload.organiserId,
    role: payload.role,
    gateId: payload.gateId,
    issuedAt: now,
    expiresAt: now + ORGANISER_SESSION_TTL_MS,
  };

  const serialized = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getOrganiserSessionSecret())
    .update(serialized)
    .digest('base64url');

  return `${serialized}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 organiser session token. Returns the payload or null.
 * The signature covers organiserId/role/gateId/issuedAt/expiresAt; the role here is
 * only informational — authorization always re-reads the authoritative DB row.
 */
export function verifyOrganiserSessionToken(
  token: string | null | undefined
): OrganiserSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  if (token.length > 4096) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [serialized, signature] = parts;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', getOrganiserSessionSecret())
      .update(serialized)
      .digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(serialized, 'base64url').toString('utf8')
    ) as OrganiserSessionPayload;

    if (
      typeof payload.organiserId !== 'string' ||
      typeof payload.expiresAt !== 'number' ||
      typeof payload.issuedAt !== 'number'
    ) {
      return null;
    }
    if (Date.now() > payload.expiresAt) return null;
    if (payload.role !== 'ENTRY_SCANNER' && payload.role !== 'ADMIN') return null;
    if (typeof payload.gateId !== 'string') return null;

    return payload;
  } catch {
    return null;
  }
}

export async function setOrganiserSessionCookie(payload: {
  organiserId: string;
  role: OrganiserRole;
  gateId: string;
}): Promise<string> {
  const token = createOrganiserSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(ORGANISER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(ORGANISER_SESSION_TTL_MS / 1000),
  });

  return token;
}

export async function clearOrganiserSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ORGANISER_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getOrganiserSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ORGANISER_SESSION_COOKIE_NAME)?.value ?? null;
}
