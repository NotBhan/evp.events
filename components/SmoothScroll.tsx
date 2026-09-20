'use client';

import React, { useEffect, useRef } from 'react';
import type Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { setLenisInstance } from '@/lib/lenis-instance';

interface SmoothScrollProps {
  children: React.ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Disable native browser scroll restoration so it does not fight Lenis
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Respect user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    let isCleanedUp = false;
    let updateTicker: ((time: number) => void) | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let gsapModule: any;

    Promise.all([
      import('lenis'),
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]).then(([lenisModule, gsapPkg, scrollTriggerPkg]) => {
      if (isCleanedUp) return;

      const LenisClass = lenisModule.default || lenisModule;
      const gsap = gsapPkg.default || gsapPkg;
      const { ScrollTrigger } = scrollTriggerPkg;
      gsapModule = gsap;

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new LenisClass({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      });

      lenisRef.current = lenis;
      if (typeof window !== 'undefined') {
        setLenisInstance(lenis);
        (window as unknown as { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger = ScrollTrigger;
      }

      // Synchronize Lenis with GSAP ScrollTrigger
      lenis.on('scroll', ScrollTrigger.update);

      updateTicker = (time: number) => {
        lenis.raf(time * 1000);
      };

      gsap.ticker.add(updateTicker);
      // Restore GSAP standard lag-smoothing behavior for gentle hitch absorption
      gsap.ticker.lagSmoothing(500, 33);

      // Support dev ?scroll= parameter for visual testing and timeline verification
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const scrollVal = params.get('scroll');
        if (scrollVal) {
          setTimeout(() => {
            lenis.scrollTo(parseInt(scrollVal, 10), { immediate: true });
            ScrollTrigger.update();
          }, 300);
        }
      }
    });

    return () => {
      isCleanedUp = true;
      if (updateTicker && gsapModule) {
        gsapModule.ticker.remove(updateTicker);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };
  }, []);

  // Reset scroll position to top whenever route pathname changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        if (lenisRef.current) {
          lenisRef.current.scrollTo(target as HTMLElement, { immediate: true });
        } else {
          target.scrollIntoView();
        }
        ScrollTrigger.refresh();
        return;
      }
    }

    // Immediately reset Lenis internal scroll position and window scroll
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Refresh ScrollTrigger so triggers recalculate for the new page geometry
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 60);

    return () => clearTimeout(timer);
  }, [pathname]);

  return <>{children}</>;
}
