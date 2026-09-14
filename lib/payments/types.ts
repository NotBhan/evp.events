import type { Booking, Pass, PaymentAttempt } from '@prisma/client';

export type BookingWithPass = Booking & { pass: Pass };

export interface CreateCheckoutSessionParams {
  booking: BookingWithPass;
  paymentAttemptId: string;
  baseUrl: string;
}

export interface CreateCheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

export interface PaymentProvider {
  name: string;
  createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<CreateCheckoutSessionResult>;
  constructWebhookEvent(rawBody: string | Buffer, signature: string): unknown;
}

export interface ConfirmPaymentParams {
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  expectedAmountPaise?: number;
  bookingPublicId?: string;
  paymentAttemptId?: string;
}

export interface FailPaymentParams {
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  errorReason?: string;
  bookingPublicId?: string;
  paymentAttemptId?: string;
}

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class BookingExpiredError extends PaymentError {
  constructor(message = 'Booking has expired. Cannot confirm payment on an expired reservation.') {
    super(message);
    this.name = 'BookingExpiredError';
  }
}

export class PaymentAttemptNotFoundError extends PaymentError {
  constructor(message = 'Associated PaymentAttempt record was not found.') {
    super(message);
    this.name = 'PaymentAttemptNotFoundError';
  }
}

export class AmountMismatchError extends PaymentError {
  constructor(message = 'Payment amount does not match authoritative booking total.') {
    super(message);
    this.name = 'AmountMismatchError';
  }
}
