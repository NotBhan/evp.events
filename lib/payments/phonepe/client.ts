import 'server-only';
import crypto from 'node:crypto';
import { getPhonePeConfig, getPhonePeAccessToken, clearPhonePeTokenCache } from './auth';
import type {
  PhonePeCreatePaymentParams,
  PhonePeCreatePaymentResponse,
  PhonePeOrderStatusResponse,
} from './types';

/**
 * Validates merchantOrderId against PhonePe specification:
 * - <= 63 characters
 * - Only permitted alphanumeric characters, underscores and hyphens
 */
export function validateMerchantOrderId(orderId: string): boolean {
  if (!orderId || orderId.length > 63) {
    return false;
  }
  return /^[a-zA-Z0-9_-]+$/.test(orderId);
}

/**
 * Creates a PhonePe Standard Checkout v2 payment order.
 * Uses official PG_CHECKOUT paymentFlow structure and O-Bearer authorization.
 * Returns redirectUrl directly from PhonePe response.
 */
export async function createPhonePePaymentOrder(
  params: PhonePeCreatePaymentParams
): Promise<PhonePeCreatePaymentResponse> {
  const {
    merchantOrderId,
    amountPaise,
    expireAfterSeconds = 1200,
    redirectUrl,
    metaData = {},
  } = params;

  if (!validateMerchantOrderId(merchantOrderId)) {
    throw new Error(
      `Invalid merchantOrderId "${merchantOrderId}". Must be <= 63 chars containing only [a-zA-Z0-9_-].`
    );
  }

  // Ensure expireAfter is strictly clamped to PhonePe's allowed range 300 - 3600 seconds
  const clampedExpireAfter = Math.min(Math.max(expireAfterSeconds, 300), 3600);

  const config = getPhonePeConfig();
  const token = await getPhonePeAccessToken();

  const payload: Record<string, unknown> = {
    merchantOrderId,
    amount: amountPaise,
    expireAfter: clampedExpireAfter,
    paymentFlow: {
      type: 'PG_CHECKOUT',
      merchantUrls: {
        redirectUrl,
      },
    },
  };

  if (metaData && Object.keys(metaData).length > 0) {
    payload.metaInfo = metaData;
  }

  const url = `${config.apiBaseUrl}/checkout/v2/pay`;

  let res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `O-Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // If 401 unauthorized, clear token and retry once
  if (res.status === 401) {
    clearPhonePeTokenCache();
    const freshToken = await getPhonePeAccessToken(true);
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `O-Bearer ${freshToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  const rawJson = await res.json().catch(() => null);

  if (!res.ok || !rawJson) {
    const errorMsg =
      rawJson?.message || rawJson?.error || rawJson?.description || `PhonePe order creation failed (status ${res.status})`;
    throw new Error(`PhonePe API Error (${res.status}): ${errorMsg}`);
  }

  // Standard Checkout v2 can return at root level, data wrapper, or paymentFlow
  const data = (rawJson.data || rawJson.payload || rawJson) as Record<string, unknown>;

  const orderId = (data.orderId || data.merchantOrderId || rawJson.orderId || merchantOrderId) as string;
  const redirectUrlResult = (
    data.redirectUrl ||
    data.checkoutUrl ||
    (data.paymentFlow as Record<string, unknown>)?.merchantUrls &&
      ((data.paymentFlow as Record<string, unknown>).merchantUrls as Record<string, unknown>)?.redirectUrl ||
    (data.paymentFlow as Record<string, unknown>)?.redirectUrl ||
    (data.instrumentResponse as Record<string, unknown>)?.redirectInfo &&
      ((data.instrumentResponse as Record<string, unknown>).redirectInfo as Record<string, unknown>)?.url ||
    rawJson.redirectUrl
  ) as string | undefined;
  const state = ((data.state || rawJson.state || 'CREATED') as string).toUpperCase();

  if (!redirectUrlResult) {
    throw new Error('PhonePe did not return a valid redirectUrl in create payment response.');
  }

  return {
    orderId,
    state,
    redirectUrl: redirectUrlResult,
    expireAt: (data.expireAt || rawJson.expireAt) as string | undefined,
  };
}

/**
 * Fetches authoritative order status from PhonePe Order Status API.
 * Uses root-level order state / payload.state as the authoritative order state.
 */
export async function fetchPhonePeOrderStatus(
  merchantOrderId: string
): Promise<PhonePeOrderStatusResponse> {
  if (!validateMerchantOrderId(merchantOrderId)) {
    throw new Error(`Invalid merchantOrderId "${merchantOrderId}".`);
  }

  const config = getPhonePeConfig();
  const token = await getPhonePeAccessToken();

  const url = `${config.apiBaseUrl}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status`;

  let res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `O-Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // 401 recovery
  if (res.status === 401) {
    clearPhonePeTokenCache();
    const freshToken = await getPhonePeAccessToken(true);
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `O-Bearer ${freshToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  const rawJson = await res.json().catch(() => null);

  if (!res.ok || !rawJson) {
    const errorMsg =
      rawJson?.message || rawJson?.error || `PhonePe order status retrieval failed (status ${res.status})`;
    throw new Error(`PhonePe Status API Error (${res.status}): ${errorMsg}`);
  }

  // Authoritative state is read from payload, data wrapper, or root-level state
  const data = (rawJson.data || rawJson.payload || rawJson) as Record<string, unknown>;
  const rawPayload = (rawJson.payload || data.payload || {}) as Record<string, unknown>;

  const state = (
    (rawPayload.state as string) ||
    (data.state as string) ||
    (rawJson.state as string) ||
    'PENDING'
  ).toUpperCase();

  const amount =
    typeof rawPayload.amount === 'number'
      ? rawPayload.amount
      : typeof data.amount === 'number'
      ? data.amount
      : typeof rawJson.amount === 'number'
      ? rawJson.amount
      : 0;

  return {
    orderId: (data.orderId || rawJson.orderId || rawPayload.orderId || merchantOrderId) as string,
    merchantOrderId: (data.merchantOrderId || rawJson.merchantOrderId || rawPayload.merchantOrderId || merchantOrderId) as string,
    state,
    amount,
    expireAt: (data.expireAt || rawJson.expireAt || rawPayload.expireAt) as string | undefined,
    paymentDetails: (data.paymentDetails || rawJson.paymentDetails || rawPayload.paymentDetails || []) as PhonePeOrderStatusResponse['paymentDetails'],
    metaData: (data.metaData || data.metaInfo || rawJson.metaData || rawJson.metaInfo || rawPayload.metaData || rawPayload.metaInfo) as Record<string, string> | undefined,
  };
}

/**
 * Cryptographically verifies PhonePe HMAC webhook signature using the configured webhook secret.
 *
 * Supports PhonePe's HMAC-SHA256 signature scheme:
 * - Expected: HMAC_SHA256(rawBody, webhookSecret)
 * - Header format: `<signature>` or `<signature>###<keyIndex>`
 * - Optional key ID header: `x-phonepe-checksum-key-id`
 */
export function verifyPhonePeWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  keyIdHeader?: string | null | undefined
): boolean {
  if (!rawBody || !signatureHeader) {
    return false;
  }

  try {
    const config = getPhonePeConfig();
    const secret = config.webhookSecret;
    if (!secret) {
      console.warn('[PhonePe Webhook] PHONEPE_WEBHOOK_SECRET is not configured.');
      return false;
    }

    // If header has keyIndex separator "###<keyIndex>", split it
    let providedSignature = signatureHeader.trim();
    let keyId = keyIdHeader?.trim();

    if (providedSignature.includes('###')) {
      const parts = providedSignature.split('###');
      providedSignature = parts[0].trim();
      if (!keyId && parts[1]) {
        keyId = parts[1].trim();
      }
    }

    // If keyId is provided, verify against configured webhookKeyId or clientVersion
    if (keyId) {
      const expectedKeyId = config.webhookKeyId || config.clientVersion;
      if (expectedKeyId && keyId !== expectedKeyId) {
        console.warn(`[PhonePe Webhook] Key ID mismatch: expected "${expectedKeyId}", got "${keyId}".`);
        return false;
      }
    }

    const payloadBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;

    const expectedHex = crypto
      .createHmac('sha256', secret)
      .update(payloadBuffer)
      .digest('hex');

    const expectedBase64 = crypto
      .createHmac('sha256', secret)
      .update(payloadBuffer)
      .digest('base64');

    const providedBuf = Buffer.from(providedSignature, 'utf8');

    // Check hex match (case-insensitive timing safe compare)
    const expectedHexBuf = Buffer.from(expectedHex.toLowerCase(), 'utf8');
    const providedHexBuf = Buffer.from(providedSignature.toLowerCase(), 'utf8');

    if (expectedHexBuf.length === providedHexBuf.length && crypto.timingSafeEqual(expectedHexBuf, providedHexBuf)) {
      return true;
    }

    // Check base64 match
    const expectedBase64Buf = Buffer.from(expectedBase64, 'utf8');
    if (expectedBase64Buf.length === providedBuf.length && crypto.timingSafeEqual(expectedBase64Buf, providedBuf)) {
      return true;
    }

    return false;
  } catch (err) {
    console.error('[PhonePe Webhook Verification Error]', err);
    return false;
  }
}
