import 'server-only';
import { stripeProvider } from './stripe';
import type { PaymentProvider } from './types';

export * from './types';
export * from './utils';

/**
 * Resolves the configured payment provider based on PAYMENT_PROVIDER env var.
 * Currently supports 'stripe' for Phase 4A.
 */
export function getPaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER || 'stripe').toLowerCase();

  switch (provider) {
    case 'stripe':
      return stripeProvider;
    case 'razorpay':
      throw new Error(
        'Razorpay payment provider is not yet activated in Phase 4A.'
      );
    default:
      throw new Error(`Unsupported payment provider configured: "${provider}"`);
  }
}
