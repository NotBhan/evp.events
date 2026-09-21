/**
 * Lazy GSAP + ScrollTrigger loader
 *
 * Provides a shared, cached dynamic import for GSAP and ScrollTrigger.
 * Prevents GSAP from being included in the critical initial JS bundle
 * and ensures animations attach asynchronously post-paint.
 */
let gsapPromise: Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gsap: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ScrollTrigger: any;
}> | null = null;

export function loadGsap() {
  if (!gsapPromise) {
    gsapPromise = Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]).then(([gsapModule, scrollTriggerModule]) => {
      const gsap = gsapModule.default || gsapModule;
      const { ScrollTrigger } = scrollTriggerModule;
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger };
    });
  }
  return gsapPromise;
}
