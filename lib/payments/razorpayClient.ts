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

/**
 * Dynamically loads the official Razorpay Standard Checkout script.
 */
export function loadRazorpayCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(false);
    }

    if ((window as any).Razorpay) {
      return resolve(true);
    }

    const scriptId = 'razorpay-checkout-js';
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Initializes and displays the official Razorpay Standard Checkout modal.
 */
export async function launchRazorpayCheckout(
  params: LaunchRazorpayCheckoutParams
): Promise<boolean> {
  const isLoaded = await loadRazorpayCheckoutScript();
  if (!isLoaded || typeof window === 'undefined' || !(window as any).Razorpay) {
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

  const options: Record<string, any> = {
    key: keyId,
    amount: amountPaise,
    currency,
    name: eventName,
    description,
    order_id: orderId,
    prefill: {
      name: prefill?.name || '',
      email: prefill?.email || '',
      contact: prefill?.contact || '',
    },
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

  const rzp = new (window as any).Razorpay(options);

  if (onFailure) {
    rzp.on('payment.failed', function (response: RazorpayFailureResponse) {
      onFailure(response);
    });
  }

  rzp.open();
  return true;
}
