import 'server-only';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/payments/stripe';
import { confirmBookingPayment, failBookingPayment } from '@/lib/payments/service';
import { BookingExpiredError, PaymentAttemptNotFoundError } from '@/lib/payments';

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Defensive failure if webhook secret is unconfigured
  if (!webhookSecret) {
    return Response.json(
      {
        success: false,
        error: 'Stripe webhook verification is not configured on this server.',
      },
      { status: 503 }
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return Response.json(
      { success: false, error: 'Missing stripe-signature header.' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Invalid webhook signature';
    return Response.json(
      { success: false, error: errorMsg },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Verify session is paid
        if (session.payment_status === 'paid') {
          const providerOrderId = session.id;
          const providerPaymentId =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : undefined;
          const expectedAmountPaise = session.amount_total ?? undefined;
          const bookingPublicId =
            (session.metadata?.bookingPublicId as string) ||
            session.client_reference_id ||
            undefined;
          const paymentAttemptId =
            (session.metadata?.paymentAttemptId as string) || undefined;

          try {
            await confirmBookingPayment({
              provider: 'stripe',
              providerOrderId,
              providerPaymentId,
              expectedAmountPaise,
              bookingPublicId,
              paymentAttemptId,
            });
          } catch (confirmErr: unknown) {
            if (confirmErr instanceof BookingExpiredError) {
              console.warn(
                `[Stripe Webhook] Payment received for expired booking: ${session.id}`
              );
              // Acknowledge receipt to avoid infinite Stripe retry on unrecoverable expired booking
              return Response.json({
                received: true,
                warning: 'Booking expired; payment not confirmed.',
              });
            }

            if (confirmErr instanceof PaymentAttemptNotFoundError) {
              console.warn(
                `[Stripe Webhook] Unrelated or missing PaymentAttempt: ${session.id}`
              );
              return Response.json({
                received: true,
                warning: 'Payment attempt not found.',
              });
            }

            throw confirmErr;
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const providerOrderId = session.id;
        const paymentAttemptId =
          (session.metadata?.paymentAttemptId as string) || undefined;

        await failBookingPayment({
          provider: 'stripe',
          providerOrderId,
          paymentAttemptId,
          errorReason: 'checkout_session_expired',
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const providerPaymentId = paymentIntent.id;

        await failBookingPayment({
          provider: 'stripe',
          providerOrderId: '',
          providerPaymentId,
          errorReason: paymentIntent.last_payment_error?.message || 'payment_failed',
        });
        break;
      }

      default:
        // Ignore unhandled event types safely
        break;
    }

    return Response.json({ received: true });
  } catch (err: unknown) {
    console.error(
      '[Stripe Webhook Processing Error]',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return Response.json(
      { success: false, error: 'Internal webhook processing failure.' },
      { status: 500 }
    );
  }
}
