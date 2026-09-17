import 'server-only';
import {
  authenticateOrganiser,
  registerClientAttempt,
  resetClientAttempts,
} from '@/lib/organiser-auth';
import { setOrganiserSessionCookie } from '@/lib/organiser-session';
import { isSameOriginRequest } from '@/lib/request-origin';

function getClientKey(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) {
    return Response.json(
      { success: false, code: 'ORIGIN_REJECTED', error: 'Request origin validation failed.' },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { success: false, code: 'INVALID_REQUEST', error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  // Secondary in-memory throttle (best-effort only; DB-backed per-organiser
  // throttling below is the authoritative protection).
  if (!registerClientAttempt(getClientKey(req))) {
    return Response.json(
      {
        success: false,
        code: 'TOO_MANY_ATTEMPTS',
        error: 'Too many login attempts. Please try again later.',
      },
      { status: 429 }
    );
  }

  const result = await authenticateOrganiser(body.loginId, body.password);

  if (!result.ok) {
    if (result.reason === 'ACCOUNT_LOCKED') {
      return Response.json(
        {
          success: false,
          code: 'ACCOUNT_LOCKED',
          error: 'Account temporarily locked after repeated failed attempts. Try again later.',
        },
        { status: 429 }
      );
    }

    if (result.reason === 'ACCOUNT_INACTIVE') {
      return Response.json(
        {
          success: false,
          code: 'ACCOUNT_INACTIVE',
          error: 'This organiser account is inactive. Contact an administrator.',
        },
        { status: 403 }
      );
    }

    return Response.json(
      {
        success: false,
        code: 'INVALID_CREDENTIALS',
        error: 'Invalid login credentials.',
      },
      { status: 401 }
    );
  }

  resetClientAttempts(getClientKey(req));

  try {
    await setOrganiserSessionCookie({
      organiserId: result.organiser.organiserId,
      role: result.organiser.role,
      gateId: result.organiser.gateId,
    });
  } catch (err) {
    console.error(
      '[Organiser Login] Failed to issue organiser session cookie:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return Response.json(
      {
        success: false,
        code: 'SESSION_UNAVAILABLE',
        error: 'Organiser sign-in is temporarily unavailable. Please try again later.',
      },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    organiser: {
      name: result.organiser.name,
      role: result.organiser.role,
      gateId: result.organiser.gateId,
    },
  });
}
