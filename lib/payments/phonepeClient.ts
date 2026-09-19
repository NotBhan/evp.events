'use client';

declare global {
  interface Window {
    PhonePeCheckout?: {
      transact: (opts: {
        tokenUrl: string;
        type?: 'IFRAME' | 'REDIRECT';
        callback?: (response: string) => void;
      }) => void;
    };
  }
}

export interface LaunchPhonePeCheckoutParams {
  redirectUrl: string;
  merchantOrderId: string;
  onCallback: (responseState: string) => void;
  onFallbackRedirect?: () => void;
  env?: 'sandbox' | 'production';
}

let phonePeScriptPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the official PhonePe Standard Checkout script bundle.
 * Memoized to prevent duplicate script inclusions.
 */
export function loadPhonePeCheckoutScript(
  env: 'sandbox' | 'production' = (process.env.NEXT_PUBLIC_PHONEPE_ENV as 'sandbox' | 'production') || 'sandbox'
): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if (window.PhonePeCheckout) {
    return Promise.resolve(true);
  }

  if (!phonePeScriptPromise) {
    phonePeScriptPromise = new Promise<boolean>((resolve) => {
      const scriptId = 'phonepe-checkout-js';
      const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

      const handleError = () => {
        phonePeScriptPromise = null;
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

      const scriptUrl =
        env === 'production'
          ? 'https://mercury.phonepe.com/web/bundle/checkout.js'
          : 'https://mercury-uat.phonepe.com/web/bundle/checkout.js';

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        script.remove();
        handleError();
      };
      document.body.appendChild(script);
    });
  }

  return phonePeScriptPromise;
}

/**
 * Launches PhonePe Standard Checkout via IFRAME (preferred) with automatic REDIRECT fallback.
 */
export async function launchPhonePeCheckout(
  params: LaunchPhonePeCheckoutParams
): Promise<boolean> {
  const { redirectUrl, onCallback, onFallbackRedirect, env } = params;

  try {
    const isLoaded = await loadPhonePeCheckoutScript(env);
    if (isLoaded && window.PhonePeCheckout?.transact) {
      window.PhonePeCheckout.transact({
        tokenUrl: redirectUrl,
        type: 'IFRAME',
        callback: (response: string) => {
          onCallback(response);
        },
      });
      return true;
    }
  } catch (err) {
    console.warn('[PhonePe Checkout] IFrame mode unavailable, falling back to direct redirect:', err);
  }

  // Fallback to direct redirect if script load fails or iframe not supported
  if (onFallbackRedirect) {
    onFallbackRedirect();
  }
  window.location.href = redirectUrl;
  return true;
}
