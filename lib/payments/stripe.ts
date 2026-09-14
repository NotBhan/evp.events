import 'server-only';
import Stripe from 'stripe';
import type {
  CreateCheckoutSessionParams,
  CreateCheckoutSessionResult,
  PaymentProvider,
} from './types';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured in environment.');
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export class StripePaymentProvider implements PaymentProvider {
  name = 'stripe';

  /**
   * Creates a Stripe Checkout Session using dynamic price_data derived
   * 100% authoritatively from the Neon booking record.
   *
   * Requirement:
   * unitPrice in INR is converted to minor units (paise) exactly once:
   * unit_amount = booking.unitPrice * 100
   * Zero static Stripe Catalog Products or Prices created.
   */
  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CreateCheckoutSessionResult> {
    const stripe = getStripeClient();
    const { booking, paymentAttemptId, baseUrl } = params;

    // Convert whole INR amount from Neon into minor unit (paise) exactly once
    const unitAmountPaise = booking.unitPrice * 100;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      billing_address_collection: 'required',
      client_reference_id: booking.publicId,
      customer_email: booking.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `RAAS UTSAV 2026 — ${booking.pass.name}`,
              description: `Booking Reference: ${booking.publicId} · Quantity: ${booking.quantity}`,
            },
            unit_amount: unitAmountPaise,
          },
          quantity: booking.quantity,
        },
      ],
      metadata: {
        bookingId: booking.id,
        bookingPublicId: booking.publicId,
        paymentAttemptId: paymentAttemptId,
      },
      success_url: `${baseUrl}/booking?status=success&session_id={CHECKOUT_SESSION_ID}&booking_id=${encodeURIComponent(
        booking.publicId
      )}`,
      cancel_url: `${baseUrl}/booking?status=cancelled&booking_id=${encodeURIComponent(
        booking.publicId
      )}`,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a valid checkout session URL.');
    }

    return {
      provider: 'stripe',
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  }

  /**
   * Constructs and verifies a Stripe webhook event from raw payload buffer and signature.
   * Fails defensively if STRIPE_WEBHOOK_SECRET is not configured in the environment.
   */
  constructWebhookEvent(rawBody: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET is not configured in the environment. Webhooks cannot be verified.'
      );
    }

    const stripe = getStripeClient();
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }
}

export const stripeProvider = new StripePaymentProvider();
