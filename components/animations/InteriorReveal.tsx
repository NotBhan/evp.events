'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isReducedMotion } from './interiorAnimations';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export type RevealVariant = 'up' | 'left' | 'right' | 'clip' | 'scale' | 'fade';

interface InteriorRevealProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  distance?: number;
  threshold?: string;
  className?: string;
  as?: React.ElementType;
}

/**
 * InteriorReveal - Reusable Editorial Entrance Animation Component
 *
 * Provides restrained, theatrical reveals for cards, text blocks, and images
 * across interior routes (/about, /services, /booking, /contact).
 *
 * - Zero layout property changes (only transform, opacity, clip-path)
 * - Auto-adapts distances on mobile (prevents horizontal overflow)
 * - Complete prefers-reduced-motion fallback
 * - once: true ScrollTrigger execution (zero scroll thrashing)
 */
export default function InteriorReveal({
  children,
  variant = 'up',
  delay = 0,
  duration = 0.75,
  distance = 32,
  threshold = 'top 88%',
  className = '',
  as: Component = 'div',
}: InteriorRevealProps) {
  const elRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el || typeof window === 'undefined') return;

    if (isReducedMotion()) {
      gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1, clipPath: 'none' });
      return;
    }

    const isMobile = window.innerWidth < 768;
    const mobileDist = Math.min(distance, 20);

    const ctx = gsap.context(() => {
      // Determine initial state based on variant
      let initialVars: gsap.TweenVars = { opacity: 0 };
      let toVars: gsap.TweenVars = {
        opacity: 1,
        duration,
        delay,
        ease: 'power2.out',
        clearProps: 'transform,clipPath',
      };

      switch (variant) {
        case 'up':
          initialVars = { opacity: 0, y: isMobile ? mobileDist : distance };
          toVars = { ...toVars, y: 0 };
          break;
        case 'left':
          // On mobile, convert horizontal slide to gentle vertical slide to avoid overflow
          initialVars = isMobile
            ? { opacity: 0, y: mobileDist }
            : { opacity: 0, x: -distance };
          toVars = isMobile ? { ...toVars, y: 0 } : { ...toVars, x: 0 };
          break;
        case 'right':
          initialVars = isMobile
            ? { opacity: 0, y: mobileDist }
            : { opacity: 0, x: distance };
          toVars = isMobile ? { ...toVars, y: 0 } : { ...toVars, x: 0 };
          break;
        case 'clip':
          initialVars = {
            opacity: 0,
            clipPath: 'inset(0 0 0 100%)',
            x: isMobile ? 0 : 25,
          };
          toVars = {
            ...toVars,
            clipPath: 'inset(0 0 0 0%)',
            x: 0,
            ease: 'power3.inOut',
          };
          break;
        case 'scale':
          initialVars = { opacity: 0, scale: 0.97 };
          toVars = { ...toVars, scale: 1 };
          break;
        case 'fade':
        default:
          initialVars = { opacity: 0 };
          toVars = { ...toVars };
          break;
      }

      gsap.fromTo(el, initialVars, {
        ...toVars,
        scrollTrigger: {
          trigger: el,
          start: threshold,
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [variant, delay, duration, distance, threshold]);

  return (
    <Component ref={elRef} className={className}>
      {children}
    </Component>
  );
}
