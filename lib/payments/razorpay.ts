import 'server-only';
import crypto from 'node:crypto';
import type {
  CreateCheckoutSessionParams,
  CreateCheckoutSessionResult,
  PaymentProvider,
} from './types';

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes?: Record<string, string>;
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string | null;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string | null;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  notes?: Record<string, string>;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  created_at: number;
}

export function getRazorpayKeyId(): string {
  const keyId =
    process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error('RAZORPAY_KEY_ID is not configured in the environment.');
  }
  return keyId;
}

export function getRazorpayKeySecret(): string {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error(
      'RAZORPAY_KEY_SECRET is not configured in the environment.'
    );
  }
  return keySecret;
}

export function getRazorpayWebhookSecret(): string {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error(
      'RAZORPAY_WEBHOOK_SECRET is not configured in the environment.'
    );
  }
  return webhookSecret;
}

function getBasicAuthHeader(): string {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

const RAZORPAY_API_BASE =
  process.env.RAZORPAY_API_BASE_URL || 'https://api.razorpay.com';

/**
 * Creates a server-authoritative Razorpay Order via REST API.
 * Never trust client amounts: amountPaise is derived directly from Neon booking.
 */
export async function createRazorpayOrder(params: {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const { amountPaise, currency = 'INR', receipt, notes } = params;

  const res = await fetch(`${RAZORPAY_API_BASE}/v1/orders`, {
    method: 'POST',
    headers: {
      Authorization: getBasicAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency,
      receipt,
      notes: notes || {},
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg =
      data?.error?.description || data?.message || 'Razorpay order creation failed';
    throw new Error(`Razorpay API Error (${res.status}): ${errorMsg}`);
  }

  return data as RazorpayOrder;
}

/**
 * Fetches verified payment details from Razorpay API.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  const res = await fetch(`${RAZORPAY_API_BASE}/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      Authorization: getBasicAuthHeader(),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg =
      data?.error?.description || data?.message || 'Razorpay payment retrieval failed';
    throw new Error(`Razorpay API Error (${res.status}): ${errorMsg}`);
  }

  return data as RazorpayPayment;
}

/**
 * Cryptographically verifies Razorpay Standard Checkout signature.
 * Expected: HMAC-SHA256(orderId + "|" + paymentId, RAZORPAY_KEY_SECRET) === signature
 */
export function verifyRazorpayCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { orderId, paymentId, signature } = params;
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  try {
    const keySecret = getRazorpayKeySecret();
    const dataToSign = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(dataToSign)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}

/**
 * Cryptographically verifies Razorpay webhook signature.
 * Expected: HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET) === signature
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string | Buffer,
  signature: string
): boolean {
  if (!rawBody || !signature) {
    return false;
  }

  try {
    const webhookSecret = getRazorpayWebhookSecret();
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}

export class RazorpayPaymentProvider implements PaymentProvider {
  name = 'razorpay';

  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CreateCheckoutSessionResult> {
    const { booking, paymentAttemptId } = params;

    // Convert authoritative totalAmount from Neon (whole INR) to minor subunit (paise)
    const amountPaise = booking.totalAmount * 100;

    const order = await createRazorpayOrder({
      amountPaise,
      currency: 'INR',
      receipt: booking.publicId,
      notes: {
        bookingId: booking.publicId,
        paymentAttemptId,
      },
    });

    return {
      provider: 'razorpay',
      sessionId: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      notes: {
        bookingId: booking.publicId,
        paymentAttemptId,
      },
    };
  }

  constructWebhookEvent(rawBody: string | Buffer, signature: string): unknown {
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new Error('Invalid Razorpay webhook signature.');
    }

    const bodyString =
      typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    return JSON.parse(bodyString);
  }
}

export const razorpayProvider = new RazorpayPaymentProvider();
