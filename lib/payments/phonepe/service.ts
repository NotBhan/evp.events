import 'server-only';
import type {
  CreateCheckoutSessionParams,
  CreateCheckoutSessionResult,
  PaymentProvider,
} from '../types';
import {
  createPhonePePaymentOrder,
  verifyPhonePeWebhookSignature,
} from './client';

export class PhonePePaymentProvider implements PaymentProvider {
  name = 'phonepe';

  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CreateCheckoutSessionResult> {
    const { booking, paymentAttemptId, baseUrl } = params;

    // Strict 1 booking = 1 pass: authoritative amount in paise
    const amountPaise = booking.totalAmount * 100;

    // Unique merchantOrderId under 63 chars
    // Format: "ru26_" (5) + publicId (12-16) + "_" (1) + timestamp (13) = ~33 chars
    const merchantOrderId = `ru26_${booking.publicId}_${Date.now()}`;

    const redirectUrl = `${baseUrl}/booking/payment/phonepe?merchantOrderId=${encodeURIComponent(merchantOrderId)}`;

    const order = await createPhonePePaymentOrder({
      merchantOrderId,
      amountPaise,
      expireAfterSeconds: 1200, // 20 minutes (within required 300-3600s range)
      redirectUrl,
      metaData: {
        bookingId: booking.publicId,
        paymentAttemptId,
      },
    });

    return {
      provider: 'phonepe',
      sessionId: order.orderId,
      orderId: order.orderId,
      checkoutUrl: order.redirectUrl,
      amount: amountPaise,
      currency: 'INR',
      notes: {
        bookingId: booking.publicId,
        paymentAttemptId,
        merchantOrderId,
      },
    };
  }

  constructWebhookEvent(rawBody: string | Buffer, signature: string): unknown {
    const isValid = verifyPhonePeWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new Error('Invalid PhonePe webhook signature.');
    }

    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    return JSON.parse(bodyString);
  }
}

export const phonepeProvider = new PhonePePaymentProvider();
