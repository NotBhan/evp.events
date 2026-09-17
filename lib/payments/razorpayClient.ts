'use client';

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

export interface LaunchRazorpayCheckoutParams {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency?: string;
  eventName?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onFailure?: (response: RazorpayFailureResponse) => void;
  onDismiss?: () => void;
}

let checkoutScriptPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the official Razorpay Standard Checkout script.
 *
 * The load is memoized so repeated calls (preload on mount + checkout launch)
 * share a single in-flight attempt instead of stacking duplicate listeners or
 * creating a duplicate script element. On failure the cached promise is reset
 * and the failed element removed so a later click can retry cleanly.
 */
export function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (!checkoutScriptPromise) {
    checkoutScriptPromise = new Promise<boolean>((resolve) => {
      const scriptId = 'razorpay-checkout-js';
      const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

      const handleError = () => {
        checkoutScriptPromise = null;
        resolve(false);
      };

      if (existing) {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener(
          'error',
          () => {
            existing.remove();
            handleError();
          },
          { once: true }
        );
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        script.remove();
        handleError();
      };
      document.body.appendChild(script);
    });
  }

  return checkoutScriptPromise;
}

const MASK_CHARACTER_PATTERN = /[\u2022\u2026*]/;

/**
 * Returns true when a value looks like masked/redacted contact data
 * (e.g. "r•••••a@gmail.com", "+91 ••••• •6510", "ab****@gmail.com").
 */
export function isMaskedContactValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && MASK_CHARACTER_PATTERN.test(value);
}

/**
 * Builds a Razorpay Checkout prefill object containing only genuine,
 * non-masked values. Masked recovery data is omitted rather than forwarded.
 */
export function buildCheckoutPrefill(prefill?: {
  name?: string;
  email?: string;
  contact?: string;
}): { name?: string; email?: string; contact?: string } {
  const result: { name?: string; email?: string; contact?: string } = {};

  const name = (prefill?.name || '').trim();
  if (name && !isMaskedContactValue(name)) {
    result.name = name;
  }

  const email = (prefill?.email || '').trim();
  if (email && !isMaskedContactValue(email)) {
    result.email = email;
  }

  const contact = (prefill?.contact || '').trim();
  if (contact && !isMaskedContactValue(contact)) {
    result.contact = contact;
  }

  return result;
}

/**
 * Initializes and displays the official Razorpay Standard Checkout modal.
 */
export async function launchRazorpayCheckout(
  params: LaunchRazorpayCheckoutParams
): Promise<boolean> {
  const isLoaded = await loadRazorpayCheckoutScript();
  const RazorpayCtor = typeof window !== 'undefined' ? window.Razorpay : undefined;
  if (!isLoaded || !RazorpayCtor) {
    throw new Error(
      'Failed to load Razorpay payment checkout script. Please check your network connection.'
    );
  }

  const {
    keyId,
    orderId,
    amountPaise,
    currency = 'INR',
    eventName = 'RAAS UTSAV 2026',
    description = 'Official Festival Pass Reservation',
    prefill,
    onSuccess,
    onFailure,
    onDismiss,
  } = params;

  const options: Record<string, unknown> = {
    key: keyId,
    amount: amountPaise,
    currency,
    name: eventName,
    description,
    order_id: orderId,
    prefill: buildCheckoutPrefill(prefill),
    theme: {
      color: '#7E121D', // Royal Maroon matching festival palette
    },
    handler: function (response: RazorpaySuccessResponse) {
      onSuccess(response);
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) {
          onDismiss();
        }
      },
    },
  };

  const rzp = new RazorpayCtor(options);

  if (onFailure) {
    rzp.on('payment.failed', function (response: RazorpayFailureResponse) {
      onFailure(response);
    });
  }

  rzp.open();
  return true;
}
