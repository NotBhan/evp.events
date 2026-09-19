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

  const payload = {
    merchantOrderId,
    amount: amountPaise,
    expireAfter: clampedExpireAfter,
    redirectUrl,
    metaData,
  };

  const url = `${config.apiBaseUrl}/checkout/v2/pay`;

  let res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
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
        Authorization: `Bearer ${freshToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  const rawJson = await res.json().catch(() => null);

  if (!res.ok || !rawJson) {
    const errorMsg =
      rawJson?.message || rawJson?.error || rawJson?.description || 'PhonePe order creation failed';
    throw new Error(`PhonePe API Error (${res.status}): ${errorMsg}`);
  }

  // Standard Checkout v2 can return at root level or within a data wrapper
  const data = rawJson.data || rawJson;

  const orderId = data.orderId || data.merchantOrderId || merchantOrderId;
  const redirectUrlResult = data.redirectUrl || data.checkoutUrl;
  const state = data.state || 'CREATED';

  if (!redirectUrlResult) {
    throw new Error('PhonePe did not return a valid redirectUrl in create payment response.');
  }

  return {
    orderId,
    state,
    redirectUrl: redirectUrlResult,
    expireAt: data.expireAt,
  };
}

/**
 * Fetches authoritative order status from PhonePe Order Status API.
 * Uses root-level order state as the authoritative order state.
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
      Authorization: `Bearer ${token}`,
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
        Authorization: `Bearer ${freshToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  const rawJson = await res.json().catch(() => null);

  if (!res.ok || !rawJson) {
    const errorMsg =
      rawJson?.message || rawJson?.error || 'PhonePe order status retrieval failed';
    throw new Error(`PhonePe Status API Error (${res.status}): ${errorMsg}`);
  }

  // Authoritative state is read from root-level state or data wrapper
  const data = rawJson.data || rawJson;

  return {
    orderId: data.orderId || rawJson.orderId || merchantOrderId,
    merchantOrderId: data.merchantOrderId || rawJson.merchantOrderId || merchantOrderId,
    state: (data.state || rawJson.state || 'PENDING').toUpperCase(),
    amount: typeof data.amount === 'number' ? data.amount : (rawJson.amount || 0),
    expireAt: data.expireAt || rawJson.expireAt,
    paymentDetails: data.paymentDetails || rawJson.paymentDetails || [],
    metaData: data.metaData || rawJson.metaData,
  };
}

/**
 * Cryptographically verifies PhonePe HMAC webhook signature using the configured webhook secret.
 *
 * Supports PhonePe's HMAC-SHA256 signature scheme:
 * - Expected: HMAC_SHA256(rawBody, webhookSecret)
 * - Header format: `<signature>` or `<signature>###<keyIndex>`
 */
export function verifyPhonePeWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined
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
    const [providedSignature, keyIndex] = signatureHeader.split('###');

    if (config.webhookKeyId && keyIndex && keyIndex !== config.webhookKeyId) {
      console.warn(`[PhonePe Webhook] Key index mismatch: expected "${config.webhookKeyId}", got "${keyIndex}".`);
      return false;
    }

    const payloadBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadBuffer)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const providedBuf = Buffer.from(providedSignature.trim(), 'utf8');

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch (err) {
    console.error('[PhonePe Webhook Verification Error]', err);
    return false;
  }
}
