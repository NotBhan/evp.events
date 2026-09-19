export type PhonePeEnv = 'sandbox' | 'production';

export interface PhonePeConfig {
  env: PhonePeEnv;
  clientId: string;
  clientSecret: string;
  clientVersion: string;
  webhookSecret?: string;
  webhookKeyId?: string;
  merchantId?: string;
  apiBaseUrl?: string;
  oauthBaseUrl?: string;
}

export interface PhonePeOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface PhonePeCreatePaymentParams {
  merchantOrderId: string;
  amountPaise: number;
  expireAfterSeconds?: number;
  redirectUrl: string;
  metaData?: Record<string, string>;
  message?: string;
}

export interface PhonePeCreatePaymentResponse {
  orderId: string;
  state: 'CREATED' | 'PENDING' | 'COMPLETED' | 'FAILED' | string;
  redirectUrl: string;
  expireAt?: string;
}

export interface PhonePePaymentDetail {
  transactionId?: string;
  paymentMode?: string;
  timestamp?: number;
  amount?: number;
  state?: string;
  utr?: string;
}

export interface PhonePeOrderStatusResponse {
  orderId: string;
  merchantOrderId: string;
  state: 'COMPLETED' | 'FAILED' | 'PENDING' | string;
  amount: number;
  expireAt?: string;
  paymentDetails?: PhonePePaymentDetail[];
  metaData?: Record<string, string>;
}

export interface PhonePeWebhookPayload {
  event: string;
  payload?: {
    orderId?: string;
    merchantOrderId?: string;
    state?: string;
    amount?: number;
    metaData?: Record<string, string>;
    paymentDetails?: PhonePePaymentDetail[];
    [key: string]: unknown;
  };
  data?: {
    orderId?: string;
    merchantOrderId?: string;
    state?: string;
    amount?: number;
    metaData?: Record<string, string>;
    paymentDetails?: PhonePePaymentDetail[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
