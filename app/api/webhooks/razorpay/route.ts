import 'server-only';
import {
  confirmBookingPayment,
  failBookingPayment,
  verifyRazorpayWebhookSignature,
} from '@/lib/payments';

interface RazorpayWebhookEntity {
  id: string;
  order_id: string;
  amount: number;
  amount_paid: number;
  error_code?: string;
  error_description?: string;
  notes?: {
    bookingId?: string;
    paymentAttemptId?: string;
  };
}

interface RazorpayWebhookEvent {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayWebhookEntity };
    order?: { entity?: RazorpayWebhookEntity };
  };
}

export async function POST(req: Request) {
  const signature = req.headers.get('x-razorpay-signature');

  if (!signature) {
    return Response.json(
      { error: 'Missing required x-razorpay-signature header.' },
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

  // 1. Cryptographically verify webhook signature
  const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
  if (!isValid) {
    return Response.json(
      { error: 'Invalid Razorpay webhook signature.' },
      { status: 400 }
    );
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json(
      { error: 'Malformed JSON webhook payload.' },
      { status: 400 }
    );
  }

  const eventType = event.event;

  try {
    switch (eventType) {
      case 'payment.captured': {
        const payment = event?.payload?.payment?.entity;
        if (!payment) {
          return Response.json(
            { error: 'Missing payment entity in payload.' },
            { status: 400 }
          );
        }

        const orderId = payment.order_id;
        const paymentId = payment.id;
        const amountPaise = payment.amount;
        const bookingId = payment.notes?.bookingId;
        const paymentAttemptId = payment.notes?.paymentAttemptId;

        await confirmBookingPayment({
          provider: 'razorpay',
          providerOrderId: orderId,
          providerPaymentId: paymentId,
          expectedAmountPaise: amountPaise,
          bookingPublicId: bookingId,
          paymentAttemptId: paymentAttemptId,
        });
        break;
      }

      case 'order.paid': {
        const order = event?.payload?.order?.entity;
        if (!order) {
          return Response.json(
            { error: 'Missing order entity in payload.' },
            { status: 400 }
          );
        }

        const orderId = order.id;
        const amountPaidPaise = order.amount_paid;
        const bookingId = order.notes?.bookingId;
        const paymentAttemptId = order.notes?.paymentAttemptId;

        await confirmBookingPayment({
          provider: 'razorpay',
          providerOrderId: orderId,
          expectedAmountPaise: amountPaidPaise,
          bookingPublicId: bookingId,
          paymentAttemptId: paymentAttemptId,
        });
        break;
      }

      case 'payment.failed': {
        const payment = event?.payload?.payment?.entity;
        if (!payment) {
          return Response.json(
            { error: 'Missing payment entity in payload.' },
            { status: 400 }
          );
        }

        const orderId = payment.order_id;
        const paymentId = payment.id;
        const errorReason =
          payment.error_description || payment.error_code || 'Payment failed';
        const bookingId = payment.notes?.bookingId;
        const paymentAttemptId = payment.notes?.paymentAttemptId;

        await failBookingPayment({
          provider: 'razorpay',
          providerOrderId: orderId,
          providerPaymentId: paymentId,
          errorReason,
          bookingPublicId: bookingId,
          paymentAttemptId,
        });
        break;
      }

      default:
        // Ignore unhandled events and return 200 OK
        break;
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (err: unknown) {
    console.error(
      `[Razorpay Webhook Error: ${eventType}]`,
      err instanceof Error ? err.message : 'Unknown webhook processing error'
    );
    // Return 200 for idempotency / known errors unless transient infrastructure error
    return Response.json(
      {
        received: true,
        warning: err instanceof Error ? err.message : 'Processing error logged',
      },
      { status: 200 }
    );
  }
}
