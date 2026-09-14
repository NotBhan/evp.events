import 'server-only';

/**
 * Resolves and validates the base application URL for Stripe redirect callbacks.
 * Protects against open-redirect and Host-header poisoning attacks.
 */
export function resolveSafeBaseUrl(req?: Request): string {
  // 1. Explicitly configured application URL in environment
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configuredAppUrl && configuredAppUrl.trim().length > 0) {
    try {
      const parsed = new URL(configuredAppUrl.trim());
      return parsed.origin;
    } catch {
      // Invalid URL format in env; continue to header validation
    }
  }

  // 2. Vercel deployment URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Fallback to request headers if provided and explicitly allowlisted
  if (req) {
    const originHeader = req.headers.get('origin');
    const hostHeader = req.headers.get('host') || req.headers.get('x-forwarded-host');

    const candidateUrl = originHeader || (hostHeader ? `http://${hostHeader}` : null);
    if (candidateUrl) {
      try {
        const parsed = new URL(candidateUrl);
        const hostname = parsed.hostname.toLowerCase();

        // Allowed hostnames:
        // - localhost or 127.0.0.1 (local dev / test runners)
        // - official domains or Vercel preview domains
        const isLocalhost =
          hostname === 'localhost' || hostname === '127.0.0.1';
        const isOfficialDomain =
          hostname === 'raasutsav.com' ||
          hostname.endsWith('.raasutsav.com') ||
          hostname === 'raasutsav.in' ||
          hostname.endsWith('.raasutsav.in');
        const isVercelDomain = hostname.endsWith('.vercel.app');

        if (isLocalhost || isOfficialDomain || isVercelDomain) {
          const protocol = isLocalhost && !candidateUrl.startsWith('https://') ? 'http:' : 'https:';
          const port = parsed.port ? `:${parsed.port}` : '';
          return `${protocol}//${parsed.hostname}${port}`;
        }
      } catch {
        // Invalid candidate
      }
    }
  }

  // Safe default
  return 'http://localhost:3000';
}
