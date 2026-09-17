import type { ScrollTrigger } from 'gsap/ScrollTrigger';

export interface RazorpayCheckoutInstance {
  on<T = unknown>(event: string, handler: (response: T) => void): void;
  open(): void;
}

export type RazorpayCheckoutConstructor = new (
  options: Record<string, unknown>
) => RazorpayCheckoutInstance;

declare global {
  interface Window {
    /** Shared GSAP ScrollTrigger handle for scroll-geometry refreshes. */
    ScrollTrigger?: typeof ScrollTrigger;
    /** Injected by the dynamically loaded Razorpay Standard Checkout script. */
    Razorpay?: RazorpayCheckoutConstructor;
  }
}
