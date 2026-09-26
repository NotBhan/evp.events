import 'server-only';
import type { PhonePeConfig, PhonePeOAuthTokenResponse, PhonePeEnv } from './types';

let cachedAccessToken: string | null = null;
let cachedExpiresAt = 0;

export function getPhonePeConfig(): PhonePeConfig {
  const rawEnv = (process.env.PHONEPE_ENV || 'sandbox').trim().toLowerCase();
  const env: PhonePeEnv = rawEnv === 'production' ? 'production' : 'sandbox';

  const clientId = (process.env.PHONEPE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.PHONEPE_CLIENT_SECRET || '').trim();
  const clientVersion = (process.env.PHONEPE_CLIENT_VERSION || '1').trim();
  const webhookSecret = (process.env.PHONEPE_WEBHOOK_SECRET || clientSecret).trim();
  const webhookKeyId = (process.env.PHONEPE_WEBHOOK_KEY_ID || clientVersion).trim();
  const merchantId = (process.env.PHONEPE_MERCHANT_ID || clientId).trim();

  // Official Sandbox endpoints:
  // Authorization: https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token
  // API base: https://api-preprod.phonepe.com/apis/pg-sandbox
  const defaultOAuthUrl = env === 'production'
    ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';

  const defaultApiBaseUrl = env === 'production'
    ? 'https://api.phonepe.com/apis/pg'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

  const oauthBaseUrl = process.env.PHONEPE_OAUTH_URL || defaultOAuthUrl;
  const apiBaseUrl = process.env.PHONEPE_API_BASE_URL || defaultApiBaseUrl;

  return {
    env,
    clientId,
    clientSecret,
    clientVersion,
    webhookSecret,
    webhookKeyId,
    merchantId,
    oauthBaseUrl,
    apiBaseUrl,
  };
}

/**
 * Retrieves a valid PhonePe OAuth 2.0 access token using client credentials.
 * Automatically caches token in memory and refreshes using expires_in with safety buffer.
 */
export async function getPhonePeAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  // 60-second safety buffer before expiry
  if (!forceRefresh && cachedAccessToken && now < cachedExpiresAt - 60000) {
    return cachedAccessToken;
  }

  const config = getPhonePeConfig();

  if (!config.clientId || !config.clientSecret) {
    throw new Error('PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET must be configured.');
  }

  const bodyParams = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.clientId,
    client_version: config.clientVersion,
    client_secret: config.clientSecret,
  });

  const res = await fetch(config.oauthBaseUrl!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`PhonePe OAuth token request failed (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as PhonePeOAuthTokenResponse;

  if (!data.access_token) {
    throw new Error('PhonePe OAuth response did not contain access_token.');
  }

  cachedAccessToken = data.access_token;
  let expiresInSeconds = 3600;
  if (typeof (data as unknown as Record<string, unknown>).expires_in === 'number') {
    expiresInSeconds = (data as unknown as Record<string, unknown>).expires_in as number;
  } else if (typeof (data as unknown as Record<string, unknown>).expires_at === 'number') {
    const rawExp = (data as unknown as Record<string, unknown>).expires_at as number;
    const expiresAtMs = rawExp > 1e11 ? rawExp : rawExp * 1000;
    expiresInSeconds = Math.max(60, Math.floor((expiresAtMs - now) / 1000));
  }
  cachedExpiresAt = now + expiresInSeconds * 1000;

  return cachedAccessToken;
}

/**
 * Resets the in-memory token cache (useful for tests or 401 recovery).
 */
export function clearPhonePeTokenCache(): void {
  cachedAccessToken = null;
  cachedExpiresAt = 0;
}
