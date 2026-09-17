/**
 * CSRF / origin protection for cookie-authenticated state-changing endpoints.
 *
 * Retains SameSite=Lax (set on the cookies themselves) and additionally requires
 * the browser-supplied Origin (or Referer) to match the request host. No external
 * CSRF framework is introduced.
 *
 * Note: non-browser clients (tests, server-to-server) do not send Origin/Referer by
 * default and MUST send an explicit matching Origin header for state-changing calls.
 */

export function isSameOriginRequest(req: Request): boolean {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!host) return false;

  const originHeader = req.headers.get('origin');
  let candidate = originHeader;

  if (!candidate) {
    const referer = req.headers.get('referer');
    if (!referer) return false;
    try {
      candidate = new URL(referer).origin;
    } catch {
      return false;
    }
  }

  // "null" origin (sandboxed iframe / opaque origin) is never acceptable.
  if (!candidate || candidate === 'null') return false;

  try {
    return new URL(candidate).host === host;
  } catch {
    return false;
  }
}
