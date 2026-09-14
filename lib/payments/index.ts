import 'server-only';
import { stripeProvider } from './stripe';
import { razorpayProvider } from './razorpay';
import type { PaymentProvider } from './types';

export * from './types';
export * from './utils';
export * from './service';
export * from './razorpay';

/**
 * Resolves the configured payment provider based on PAYMENT_PROVIDER env var.
 * Supports 'stripe' and 'razorpay'.
 */
export function getPaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER || 'stripe').toLowerCase();

  switch (provider) {
    case 'stripe':
      return stripeProvider;
    case 'razorpay':
      return razorpayProvider;
    default:
      throw new Error(`Unsupported payment provider configured: "${provider}"`);
  }
}
