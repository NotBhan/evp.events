/**
 * Organiser credential hashing + identifier normalization.
 *
 * Pure server-side cryptography/validation with no request or session state, so it
 * can be shared by the bootstrap CLI and automated tests as well as the app.
 *
 * Hashing: Node's built-in scrypt (no new dependency) with a per-user random salt.
 * Stored format: scrypt$N$r$p$<salt-base64url>$<hash-base64url>
 */

import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt) as (
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number,
  options: crypto.ScryptOptions
) => Promise<Buffer>;

export const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 } as const;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string') return 'Password is required.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export async function hashCredential(password: string): Promise<string> {
  const { N, r, p, keylen } = SCRYPT_PARAMS;
  const salt = crypto.randomBytes(16);
  const derived = await scryptAsync(password, salt, keylen, { N, r, p });
  return [
    'scrypt',
    String(N),
    String(r),
    String(p),
    salt.toString('base64url'),
    derived.toString('base64url'),
  ].join('$');
}

export async function verifyCredential(
  password: string,
  storedHash: string | null | undefined
): Promise<boolean> {
  if (typeof password !== 'string' || typeof storedHash !== 'string') return false;

  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  if (N <= 0 || r <= 0 || p <= 0 || N > 1 << 20) return false;

  try {
    const salt = Buffer.from(parts[4], 'base64url');
    const expected = Buffer.from(parts[5], 'base64url');
    if (salt.length === 0 || expected.length === 0) return false;

    const actual = await scryptAsync(password, salt, expected.length, { N, r, p });
    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * Normalizes an organiser login id: trim -> lowercase -> allow [a-z0-9._-], max 64.
 * Returns null when the value cannot be normalized to a safe identifier.
 */
export function normalizeLoginId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,64}$/.test(normalized)) return null;
  return normalized;
}

/**
 * Normalizes a gate id: trim -> uppercase -> internal whitespace to "-", max 32.
 * Valid examples: GATE-01, GATE-02, MAIN-GATE, VIP-GATE.
 * Returns null for invalid input (never silently coerced beyond this normalization).
 */
export function normalizeGateId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  if (!/^[A-Z0-9-]{1,32}$/.test(normalized)) return null;
  return normalized;
}

/**
 * Validates a gate id against the optional ORGANISER_GATE_IDS allowlist.
 * Absent/empty allowlist => any valid normalized gate id is permitted.
 */
export function isGateIdAllowed(gateId: string, allowlistRaw?: string): boolean {
  const raw = allowlistRaw ?? process.env.ORGANISER_GATE_IDS ?? '';
  const allowed = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => normalizeGateId(entry))
    .filter((entry): entry is string => entry !== null);

  if (allowed.length === 0) return true;
  return allowed.includes(gateId);
}
