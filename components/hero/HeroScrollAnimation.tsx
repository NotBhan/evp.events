'use client';

import { useEffect } from 'react';

/**
 * HeroScrollAnimation - Isolated Leaf Client Island
 *
 * Owns strictly the client-side GSAP ScrollTrigger timeline orchestration.
 * Loaded only after the browser has completed its initial paint and SSR render.
 * Does NOT set opacity: 0, visibility: hidden, or hide any element before hydration.
 */
export default function HeroScrollAnimation() {
  useEffect(() => {
    let isCleanedUp = false;
    let cleanupFn: (() => void) | undefined;

    const initAnimation = () => {
      import('./heroAnimations').then(({ initHeroScrollAnimation }) => {
        if (isCleanedUp) return;

        const heroContainer = document.getElementById('hero');
        const heroStage = document.getElementById('hero-stage');
        const leftDancer = document.getElementById('hero-left-dancer');
        const rightDancer = document.getElementById('hero-right-dancer');
        const durgaAura = document.getElementById('hero-durga-aura');
        const heroTitle = document.getElementById('hero-title');
        const heroCTA = document.getElementById('hero-cta');

        if (
          !heroContainer ||
          !heroStage ||
          !leftDancer ||
          !rightDancer ||
          !durgaAura ||
          !heroTitle ||
          !heroCTA
        ) {
          return;
        }

        cleanupFn = initHeroScrollAnimation({
          heroContainer,
          heroStage,
          leftDancer,
          rightDancer,
          durgaAura,
          leftDiya: document.getElementById('hero-left-diya'),
          rightDiya: document.getElementById('hero-right-diya'),
          leftPillar: document.getElementById('hero-left-pillar'),
          rightPillar: document.getElementById('hero-right-pillar'),
          topFrame: document.getElementById('hero-top-frame'),
          cornerMedallions: [
            document.getElementById('hero-corner-tl'),
            document.getElementById('hero-corner-tr'),
          ],
          foregroundSticks: [
            document.getElementById('hero-foreground-stick-left'),
            document.getElementById('hero-foreground-stick-right'),
          ],
          heroTitle,
          heroCTA,
        });
      });
    };

    // Ensure animation attaches strictly after initial paint
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const handle = window.requestIdleCallback(() => initAnimation(), { timeout: 1500 });
        return () => {
          isCleanedUp = true;
          window.cancelIdleCallback(handle);
          if (cleanupFn) cleanupFn();
        };
      } else {
        const timer = setTimeout(initAnimation, 100);
        return () => {
          isCleanedUp = true;
          clearTimeout(timer);
          if (cleanupFn) cleanupFn();
        };
      }
    }

    return () => {
      isCleanedUp = true;
      if (cleanupFn) cleanupFn();
    };
  }, []);

  return null;
}
