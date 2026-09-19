import 'server-only';
import {
  confirmBookingPayment,
  failBookingPayment,
  verifyPhonePeWebhookSignature,
  type PhonePeWebhookPayload,
} from '@/lib/payments';

export async function POST(req: Request) {
  // Support standard PhonePe signature headers (x-verify, x-signature, authorization)
  const signature =
    req.headers.get('x-verify') ||
    req.headers.get('x-signature') ||
    req.headers.get('authorization');

  if (!signature) {
    return Response.json(
      { error: 'Missing required PhonePe signature header.' },
      { status: 400 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return Response.json(
      { error: 'Unable to read request payload.' },
      { status: 400 }
    );
  }

  // 1. Cryptographically verify PhonePe webhook signature (HMAC-SHA256)
  const isValid = verifyPhonePeWebhookSignature(rawBody, signature);
  if (!isValid) {
    return Response.json(
      { error: 'Invalid PhonePe webhook signature.' },
      { status: 400 }
    );
  }

  let event: PhonePeWebhookPayload;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json(
      { error: 'Malformed JSON webhook payload.' },
      { status: 400 }
    );
  }

  const eventType = (event.event || '').toLowerCase();
  // Standard Checkout v2 can place payload in payload or data object
  const orderData = (event.payload || event.data || {}) as Record<string, unknown>;
  const merchantOrderId =
    (orderData.merchantOrderId as string) || (orderData.orderId as string);

  if (!merchantOrderId) {
    return Response.json(
      { error: 'Webhook payload missing order identification.' },
      { status: 400 }
    );
  }

  const orderState = typeof orderData.state === 'string' ? orderData.state.toUpperCase() : '';
  const amountPaise = typeof orderData.amount === 'number' ? orderData.amount : undefined;
  const metaData = (orderData.metaData as Record<string, string>) || {};
  const bookingPublicId = metaData.bookingPublicId;
  const paymentAttemptId = metaData.paymentAttemptId;

  try {
    if (eventType === 'checkout.order.completed' || eventType === 'order.completed' || orderState === 'COMPLETED') {
      await confirmBookingPayment({
        provider: 'phonepe',
        providerOrderId: merchantOrderId,
        providerPaymentId: (orderData.orderId as string) || merchantOrderId,
        expectedAmountPaise: amountPaise,
        bookingPublicId,
        paymentAttemptId,
      });
    } else if (eventType === 'checkout.order.failed' || eventType === 'order.failed' || orderState === 'FAILED') {
      await failBookingPayment({
        provider: 'phonepe',
        providerOrderId: merchantOrderId,
        paymentAttemptId,
      });
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (err: unknown) {
    console.error(
      `[PhonePe Webhook Error: ${eventType || orderState}]`,
      err instanceof Error ? err.message : 'Unknown processing error'
    );
    // Return 200 with received: true for idempotent handling so PhonePe does not storm retries on business rejections
    return Response.json(
      {
        received: true,
        warning: err instanceof Error ? err.message : 'Processing error logged',
      },
      { status: 200 }
    );
  }
}
