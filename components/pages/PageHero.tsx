'use client';

import React, { useEffect, useRef } from 'react';
import Mandala from '../decorations/Mandala';
import DandiyaSticks from '../decorations/DandiyaSticks';
import { animatePageHero } from '../animations/interiorAnimations';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: string;
}

/**
 * PageHero - Compact Poster-Style Header for Internal Routes
 *
 * Implements theatrical curtain-opening entrance choreography:
 * 1. Decorative gold divider lines draw from center
 * 2. Dandiya sticks badge flourishes
 * 3. Eyebrow badge enters (y: 18px -> 0)
 * 4. Main display title rises (y: 36px -> 0)
 * 5. Narrative subtitle follows (y: 20px -> 0)
 * 6. Badge / metadata pill settles (y: 15px -> 0)
 */
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  badge,
}: PageHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const lineLeftRef = useRef<HTMLSpanElement>(null);
  const lineRightRef = useRef<HTMLSpanElement>(null);
  const sticksIconRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cleanup = animatePageHero({
      container: containerRef.current,
      eyebrow: eyebrowRef.current,
      title: titleRef.current,
      subtitle: subtitleRef.current,
      dividerLines: [lineLeftRef.current, lineRightRef.current],
      sticksIcon: sticksIconRef.current,
      badge: badgeRef.current,
    });

    return cleanup;
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative z-20 w-full pt-28 pb-16 md:pt-36 md:pb-20 px-4 sm:px-6 lg:px-8 bg-deep-plum border-b border-antique-gold/25 overflow-hidden text-center"
      aria-label="Interior Page Header"
    >
      {/* Background Decorative Mandala Halo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[340px] md:w-[540px] h-[280px] sm:h-[340px] md:h-[540px] pointer-events-none opacity-20 transition-opacity overflow-hidden flex items-center justify-center">
        <Mandala className="w-full h-full text-bright-gold animate-spin-slower" />
      </div>

      {/* Radiant Devotional Color Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[480px] h-[280px] sm:h-[480px] rounded-full bg-[radial-gradient(circle,_rgba(217,37,36,0.3)_0%,_rgba(255,148,41,0.18)_45%,_transparent_70%)] blur-2xl pointer-events-none" />

      {/* Foreground Content */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        {/* Eyebrow Festival Badge */}
        <div
          ref={eyebrowRef}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-royal-maroon/90 border border-antique-gold/50 text-bright-gold font-body text-xs md:text-sm font-semibold tracking-widest uppercase mb-4 shadow-md"
        >
          <span className="text-vermilion text-xs" aria-hidden="true">♦</span>
          <span>{eyebrow}</span>
          {badge && (
            <>
              <span className="text-antique-gold/40">♦</span>
              <span ref={badgeRef} className="text-vermilion font-bold">{badge}</span>
            </>
          )}
        </div>

        {/* Display Title */}
        <h1
          ref={titleRef}
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-bold tracking-wider uppercase leading-none mb-4 drop-shadow-[0_4px_16px_rgba(217,37,36,0.4)]"
        >
          {title}
        </h1>

        {/* Narrative Subtitle */}
        <p
          ref={subtitleRef}
          className="font-body text-sm sm:text-base md:text-lg text-warm-cream/85 max-w-2xl mx-auto leading-relaxed font-normal mb-6"
        >
          {subtitle}
        </p>

        {/* Divider with Dandiya Icon */}
        <div className="flex items-center justify-center gap-3 w-full max-w-xs opacity-85">
          <span
            ref={lineLeftRef}
            className="h-px flex-1 bg-gradient-to-r from-transparent via-antique-gold to-transparent"
            aria-hidden="true"
          />
          <div ref={sticksIconRef} className="shrink-0">
            <DandiyaSticks size={28} className="text-bright-gold" />
          </div>
          <span
            ref={lineRightRef}
            className="h-px flex-1 bg-gradient-to-r from-transparent via-antique-gold to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
