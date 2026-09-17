import 'server-only';
import { prisma } from './db';
import { normalizeLoginId, verifyCredential } from './organiser-credentials';
import {
  getOrganiserSessionToken,
  verifyOrganiserSessionToken,
} from './organiser-session';
import type { OrganiserRole } from '@prisma/client';

export type { OrganiserRole };

export interface OrganiserIdentity {
  organiserId: string;
  name: string;
  loginId: string;
  role: OrganiserRole;
  gateId: string;
}

export type AuthenticationFailure =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_INACTIVE';

export type AuthenticationResult =
  | { ok: true; organiser: OrganiserIdentity }
  | { ok: false; reason: AuthenticationFailure };

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

/**
 * Best-effort secondary throttle for unknown/abused login ids, kept in process
 * memory ONLY as a secondary layer. The authoritative protection is the DB-backed
 * per-organiser `failedLoginAttempts` / `lockedUntil` state (survives serverless).
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 20;
const MAX_TRACKED_CLIENTS = 1000;
const clientAttempts = new Map<string, { count: number; windowStart: number }>();

export function registerClientAttempt(clientKey: string, now: number = Date.now()): boolean {
  const entry = clientAttempts.get(clientKey);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    if (clientAttempts.size >= MAX_TRACKED_CLIENTS) clientAttempts.clear();
    clientAttempts.set(clientKey, { count: 1, windowStart: now });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS_PER_WINDOW;
}

export function resetClientAttempts(clientKey: string): void {
  clientAttempts.delete(clientKey);
}

/** Test/diagnostic helper: clears the secondary in-memory throttle. */
export function clearClientAttempts(): void {
  clientAttempts.clear();
}

export async function authenticateOrganiser(
  loginIdInput: unknown,
  passwordInput: unknown
): Promise<AuthenticationResult> {
  const loginId = normalizeLoginId(loginIdInput);
  const password = typeof passwordInput === 'string' ? passwordInput : '';
  if (!loginId) return { ok: false, reason: 'INVALID_CREDENTIALS' };

  const organiser = await prisma.organiser.findUnique({ where: { loginId } });
  if (!organiser) return { ok: false, reason: 'INVALID_CREDENTIALS' };

  const now = Date.now();

  // Locked accounts reject before any credential comparison.
  if (organiser.lockedUntil && organiser.lockedUntil.getTime() > now) {
    return { ok: false, reason: 'ACCOUNT_LOCKED' };
  }

  const passwordValid = await verifyCredential(password, organiser.credentialHash);
  if (!passwordValid) {
    await registerFailedLogin(organiser.id, organiser.failedLoginAttempts, now);
    return { ok: false, reason: 'INVALID_CREDENTIALS' };
  }

  if (!organiser.active) {
    return { ok: false, reason: 'ACCOUNT_INACTIVE' };
  }

  await prisma.organiser.update({
    where: { id: organiser.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(now),
    },
  });

  return {
    ok: true,
    organiser: {
      organiserId: organiser.id,
      name: organiser.name,
      loginId: organiser.loginId,
      role: organiser.role as OrganiserRole,
      gateId: organiser.gateId,
    },
  };
}

async function registerFailedLogin(
  organiserId: string,
  currentAttempts: number,
  now: number
): Promise<void> {
  const attempts = currentAttempts + 1;
  const shouldLock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;

  await prisma.organiser.update({
    where: { id: organiserId },
    data: shouldLock
      ? { failedLoginAttempts: 0, lockedUntil: new Date(now + LOGIN_LOCK_DURATION_MS) }
      : { failedLoginAttempts: attempts },
  });
}

/**
 * Authoritative organiser identity for the current request.
 *
 * Verifies the signed cookie AND re-loads the organiser row so that deactivation
 * takes effect on the next authenticated request (and role/gate changes are picked
 * up immediately instead of being trusted from the cookie).
 */
export async function getActiveOrganiserFromRequest(): Promise<OrganiserIdentity | null> {
  const token = await getOrganiserSessionToken();
  const payload = verifyOrganiserSessionToken(token);
  if (!payload) return null;

  const organiser = await prisma.organiser.findUnique({ where: { id: payload.organiserId } });
  if (!organiser || !organiser.active) return null;

  return {
    organiserId: organiser.id,
    name: organiser.name,
    loginId: organiser.loginId,
    role: organiser.role as OrganiserRole,
    gateId: organiser.gateId,
  };
}

/** Server-derived display identity persisted on check-in (e.g. "GATE-01 / Rahul"). */
export function formatOrganiserDisplayIdentity(organiser: OrganiserIdentity): string {
  return `${organiser.gateId} / ${organiser.name}`;
}
