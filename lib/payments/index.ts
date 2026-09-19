import 'server-only';
import { stripeProvider } from './stripe';
import { razorpayProvider } from './razorpay';
import { phonepeProvider } from './phonepe/service';
import type { PaymentProvider } from './types';

export * from './types';
export * from './utils';
export * from './service';
export * from './razorpay';
export * from './phonepe/service';
export * from './phonepe/client';
export * from './phonepe/auth';
export * from './phonepe/types';

/**
 * Resolves the configured payment provider based on PAYMENT_PROVIDER env var or explicit provider parameter.
 * Supports 'stripe', 'razorpay', and 'phonepe'.
 */
export function getPaymentProvider(overrideProvider?: string): PaymentProvider {
  const provider = (overrideProvider || process.env.PAYMENT_PROVIDER || 'stripe').toLowerCase();

  switch (provider) {
    case 'stripe':
      return stripeProvider;
    case 'razorpay':
      return razorpayProvider;
    case 'phonepe':
      return phonepeProvider;
    default:
      throw new Error(`Unsupported payment provider configured: "${provider}"`);
  }
}

