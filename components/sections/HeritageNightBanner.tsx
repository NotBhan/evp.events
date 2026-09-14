'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { eventData } from '@/data/eventData';

gsap.registerPlugin(ScrollTrigger);

export default function HeritageNightBanner() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const plaqueRef = useRef<HTMLDivElement>(null);
  const lightsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !cardRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          end: 'top 50%',
          toggleActions: 'play none none reverse',
        },
      });

      // Subtle string lights illumination
      if (lightsRef.current) {
        tl.fromTo(
          lightsRef.current,
          { opacity: 0.3, y: -6 },
          { opacity: 0.95, y: 0, duration: 0.8, ease: 'power2.out' },
          0
        );
      }

      // Card border & elevation entrance
      tl.fromTo(
        cardRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
        0.1
      );

      // Plaque badge settle
      if (plaqueRef.current) {
        tl.fromTo(
          plaqueRef.current,
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.2)' },
          0.2
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="heritage-night-banner"
      className="relative w-full py-10 sm:py-14 md:py-16 bg-deep-plum text-warm-cream overflow-hidden border-b border-antique-gold/25"
      aria-label="Heritage Festival Transition Banner"
    >
      {/* Festoon String Lights from RAASCDR along the top edge */}
      <div
        ref={lightsRef}
        className="absolute -top-3 left-0 right-0 h-16 sm:h-20 pointer-events-none opacity-80 z-20 overflow-hidden"
        aria-hidden="true"
      >
        <div className="relative w-full h-full">
          <Image
            src="/images/client/raascdr/web/string-lights.webp"
            alt=""
            fill
            className="object-cover object-top opacity-90"
            unoptimized
          />
        </div>
      </div>

      {/* Atmospheric Background Gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 85% 65% at 50% 50%, rgba(42, 8, 24, 0.9) 0%, rgba(18, 8, 13, 0.98) 75%, #12080D 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10 pt-4">
        <div
          ref={cardRef}
          className="relative rounded-xl bg-gradient-to-b from-royal-maroon/80 to-deep-plum/90 border border-antique-gold/45 p-6 sm:p-8 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        >
          {/* Inner Decorative Corner Filigree */}
          <div className="absolute top-2 left-2 text-antique-gold/60 text-xs select-none">❖</div>
          <div className="absolute top-2 right-2 text-antique-gold/60 text-xs select-none">❖</div>
          <div className="absolute bottom-2 left-2 text-antique-gold/60 text-xs select-none">❖</div>
          <div className="absolute bottom-2 right-2 text-antique-gold/60 text-xs select-none">❖</div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
            {/* Left Col: Plaque Badge from RAASCDR (4 cols) */}
            <div
              ref={plaqueRef}
              className="md:col-span-4 flex flex-col items-center justify-center text-center"
            >
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                {/* Plaque Background Artwork */}
                <Image
                  src="/images/client/raascdr/web/plaque-maroon.webp"
                  alt=""
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 192px, 224px"
                  unoptimized
                />
                {/* Plaque Text Overlay */}
                <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-1">
                  <span className="text-bright-gold text-xs">✦</span>
                  <span className="font-display text-2xl sm:text-3xl text-bright-gold tracking-wider leading-none mt-1">
                    16 OCT
                  </span>
                  <span className="font-body text-[11px] sm:text-xs text-warm-cream font-bold tracking-[0.18em] uppercase mt-0.5">
                    2026
                  </span>
                  <div className="w-12 h-[1px] bg-antique-gold/60 my-1" />
                  <span className="font-body text-[10px] sm:text-[11px] text-amber-glow font-semibold tracking-wider">
                    5:00 PM – 11:00 PM
                  </span>
                </div>
              </div>
            </div>

            {/* Right Col: Heritage & Booking Content (8 cols) */}
            <div className="md:col-span-8 flex flex-col items-start text-left">
              <span className="font-body text-[11px] sm:text-xs text-antique-gold tracking-[0.12em] uppercase font-bold mb-2">
                HERITAGE • DEVOTION • GRANDEUR
              </span>

              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl text-warm-cream tracking-wide leading-tight mb-2">
                AN UNFORGETTABLE CELEBRATION UNDER THE AUTUMN SKY
              </h3>

              <p className="font-body text-xs sm:text-sm text-warm-cream/80 max-w-2xl mb-4 leading-relaxed">
                Join thousands of devotees and revellers at the historic{' '}
                <strong className="text-bright-gold font-semibold">
                  {eventData.venueDisplay}
                </strong>
                . Immerse yourself in authentic Gujarati folk melodies, rhythmic dhol beats, vibrant attire, and grand festive fellowship.
              </p>

              {/* Timing & Venue Confirmation Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm font-body text-warm-cream/90 bg-deep-plum/90 border border-antique-gold/40 px-4 py-2 rounded-md mb-6 w-full max-w-2xl">
                <div className="flex items-center gap-1.5 text-bright-gold font-semibold">
                  <span>⏰</span>
                  <span>{eventData.timeDisplay}</span>
                </div>
                <span className="text-antique-gold/50 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5 text-warm-cream font-medium">
                  <span>📍</span>
                  <span>{eventData.venueDisplay}</span>
                </div>
              </div>

              {/* Action Button to /booking */}
              <Link
                href="/booking"
                className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 rounded-md bg-gradient-to-r from-royal-maroon via-vermilion to-royal-maroon text-warm-cream font-body text-xs sm:text-sm font-bold tracking-[0.1em] uppercase border border-antique-gold/80 shadow-[0_4px_16px_rgba(217,37,36,0.35)] hover:shadow-[0_4px_24px_rgba(243,198,76,0.45)] transition-[border-color,box-shadow] duration-200"
              >
                <span>RESERVE YOUR PASS</span>
                <span className="text-bright-gold">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
