'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface EventImageProps {
  src: string;
  alt: string;
  aspectRatio?: '16/9' | '4/3' | '3/2' | '3/4' | '1/1';
  className?: string;
  badge?: string;
  caption?: string;
  priority?: boolean;
  isDecorative?: boolean;
  revealOnScroll?: boolean;
}

/**
 * EventImage - Contemporary Poster-Framed Festival Photography Component
 *
 * Integrates authentic festival photography as a secondary realism layer
 * without overpowering the primary poster visual language:
 * - Double keyline gold & plum poster border
 * - Corner decorative diamond accents
 * - Warm ambient festival vignette/glow that blends naturally into deep plum
 * - Optional campaign stamp/badge
 * - Accessible alt tags & easily replaceable src
 * - Optional subtle scroll reveal for secondary cards (no heavy curtain)
 */
export default function EventImage({
  src,
  alt,
  aspectRatio = '16/9',
  className = '',
  badge,
  caption,
  priority = false,
  isDecorative = false,
  revealOnScroll = false,
}: EventImageProps) {
  const figureRef = useRef<HTMLElement>(null);

  const aspectClasses = {
    '16/9': 'aspect-[16/9]',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    '3/4': 'aspect-[3/4]',
    '1/1': 'aspect-square',
  }[aspectRatio];

  useEffect(() => {
    if (!revealOnScroll || !figureRef.current) return;

    const el = figureRef.current;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
            toggleActions: 'play none none none',
          },
        }
      );
    }, el);

    return () => {
      ctx.revert();
    };
  }, [revealOnScroll]);

  return (
    <figure
      ref={figureRef}
      className={`relative group overflow-hidden rounded-2xl border-2 border-ochre-gold/40 shadow-2xl transition-all duration-300 hover:border-ochre-gold ${className}`}
    >
      {/* Outer Keyline Border Frame */}
      <div className="absolute inset-1.5 rounded-xl border border-ochre-gold/20 pointer-events-none z-20 transition-colors group-hover:border-ochre-gold/50" />

      {/* Corner Decorative Diamond Accents */}
      <span className="absolute top-2 left-2 text-ochre-gold text-[10px] z-20 pointer-events-none select-none drop-shadow">♦</span>
      <span className="absolute top-2 right-2 text-ochre-gold text-[10px] z-20 pointer-events-none select-none drop-shadow">♦</span>
      <span className="absolute bottom-2 left-2 text-ochre-gold text-[10px] z-20 pointer-events-none select-none drop-shadow">♦</span>
      <span className="absolute bottom-2 right-2 text-ochre-gold text-[10px] z-20 pointer-events-none select-none drop-shadow">♦</span>

      {/* Image Container with Aspect Ratio */}
      <div className={`relative w-full ${aspectClasses} overflow-hidden bg-deep-plum`}>
        <Image
          src={src}
          alt={isDecorative ? '' : alt}
          aria-hidden={isDecorative ? true : undefined}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Ambient Festival Vignette & Color Grading Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep-plum/60 via-transparent to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(29,18,55,0.35)_100%)] pointer-events-none z-10" />

        {/* Optional Festival Campaign Badge */}
        {badge && (
          <div className="absolute top-4 left-4 z-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-deep-plum/80 border border-ochre-gold/60 text-ochre-gold font-body text-[10px] sm:text-xs font-bold tracking-widest uppercase shadow-lg backdrop-blur-md">
              <span className="text-festival-pink">✦</span>
              <span>{badge}</span>
            </span>
          </div>
        )}

        {/* Optional Caption Overlay */}
        {caption && (
          <figcaption className="absolute bottom-3 left-4 right-4 z-20 text-center">
            <p className="font-body text-xs sm:text-sm text-warm-cream/95 font-medium drop-shadow-md">
              {caption}
            </p>
          </figcaption>
        )}
      </div>
    </figure>
  );
}
