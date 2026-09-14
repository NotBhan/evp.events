'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { eventData } from '@/data/eventData';
import { isReducedMotion } from '@/components/animations/interiorAnimations';
import {
  Sparkles,
  Ticket,
  Music,
  Disc,
  Utensils,
  Landmark,
  Users,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ServicesContent() {
  // Section refs
  const heroRef = useRef<HTMLElement>(null);
  const heroLeftRef = useRef<HTMLDivElement>(null);
  const heroRightRef = useRef<HTMLDivElement>(null);

  const dimensionsRef = useRef<HTMLElement>(null);
  const dimCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const wordsSectionRef = useRef<HTMLElement>(null);
  const word1Ref = useRef<HTMLDivElement>(null);
  const word2Ref = useRef<HTMLDivElement>(null);
  const word3Ref = useRef<HTMLDivElement>(null);
  const wordLineRef = useRef<HTMLDivElement>(null);

  const passesRef = useRef<HTMLElement>(null);
  const passCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const bookingCtaRef = useRef<HTMLElement>(null);
  const ctaBoxRef = useRef<HTMLDivElement>(null);

  const venueStripRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isReducedMotion()) return;

    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      // 1. Hero Entrance
      if (heroRef.current) {
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (heroLeftRef.current) {
          heroTl.fromTo(
            heroLeftRef.current.children,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 },
            0.1
          );
        }

        if (heroRightRef.current) {
          heroTl.fromTo(
            heroRightRef.current,
            { opacity: 0, scale: 0.94, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 1 },
            0.2
          );
        }
      }

      // 2. Experience Dimensions Stagger
      if (dimensionsRef.current) {
        const validDimCards = dimCardsRef.current.filter(Boolean) as HTMLElement[];
        if (validDimCards.length > 0) {
          gsap.fromTo(
            validDimCards,
            { opacity: 0, y: 35 },
            {
              opacity: 1,
              y: 0,
              duration: 0.75,
              stagger: 0.12,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: dimensionsRef.current,
                start: 'top 82%',
                once: true,
              },
            }
          );
        }
      }

      // 3. Dance / Devotion / Celebration Independent Stagger
      if (wordsSectionRef.current) {
        const wordsTl = gsap.timeline({
          scrollTrigger: {
            trigger: wordsSectionRef.current,
            start: 'top 80%',
            once: true,
          },
        });

        if (wordLineRef.current) {
          wordsTl.fromTo(
            wordLineRef.current,
            { scaleX: 0, transformOrigin: 'center center' },
            { scaleX: 1, duration: 0.8, ease: 'power2.inOut' },
            0
          );
        }

        const words = [word1Ref.current, word2Ref.current, word3Ref.current].filter(Boolean);
        wordsTl.fromTo(
          words,
          { opacity: 0, y: 40, letterSpacing: '0.1em' },
          {
            opacity: 1,
            y: 0,
            letterSpacing: '0.25em',
            duration: 0.8,
            stagger: 0.2,
            ease: 'power2.out',
          },
          0.2
        );
      }

      // 4. Pass Cards Stagger
      if (passesRef.current) {
        const validPasses = passCardsRef.current.filter(Boolean) as HTMLElement[];
        if (validPasses.length > 0) {
          gsap.fromTo(
            validPasses,
            { opacity: 0, y: 30, scale: 0.98 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              stagger: 0.08,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: passesRef.current,
                start: 'top 82%',
                once: true,
              },
            }
          );
        }
      }

      // 5. Booking CTA Box Entrance
      if (bookingCtaRef.current && ctaBoxRef.current) {
        gsap.fromTo(
          ctaBoxRef.current,
          { opacity: 0, y: 30, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: bookingCtaRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }

      // 6. Venue Strip Reveal
      if (venueStripRef.current) {
        gsap.fromTo(
          venueStripRef.current,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: venueStripRef.current,
              start: 'top 90%',
              once: true,
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* ====================================================================
          SECTION 1: FESTIVAL EXPERIENCE HERO (ASYMMETRIC EDITORIAL MASTHEAD)
          ==================================================================== */}
      <section
        ref={heroRef}
        className="relative z-20 pt-28 sm:pt-32 md:pt-36 pb-20 md:pb-28 px-4 sm:px-6 lg:px-8 bg-deep-plum border-b border-antique-gold/25 overflow-hidden"
      >
        {/* Subtle Ambient Radial Lighting */}
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[500px] pointer-events-none -translate-x-1/2 opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(217,37,36,0.25) 0%, rgba(34,13,26,0) 70%)' }}
        />
        <div
          className="absolute top-1/3 right-10 w-[500px] h-[500px] pointer-events-none opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(243,198,76,0.3) 0%, rgba(34,13,26,0) 70%)' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Oversized Editorial Typography & Facts */}
            <div ref={heroLeftRef} className="lg:col-span-7 flex flex-col justify-center text-left">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-royal-maroon/90 border border-antique-gold/50 text-bright-gold text-xs uppercase font-bold tracking-[0.12em] w-fit mb-6 shadow-md">
                <span className="text-vermilion text-xs" aria-hidden="true">♦</span>
                <span>01 / THE FESTIVAL EXPERIENCE</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-bold tracking-tight leading-[0.92] uppercase mb-6">
                MORE THAN <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-bright-gold via-amber-glow to-vermilion">
                  A NIGHT OUT.
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="font-body text-base sm:text-lg text-warm-cream/85 leading-relaxed max-w-2xl mb-8">
                Raas Utsav 2026 brings together authentic folk percussion, concentric circular Garba arenas, festive courtyard dining, and themed royal heritage décor across the historic grounds of Chanakya BNR Hotel, Ranchi.
              </p>

              {/* Verified Event Metadata Pill Strip */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card-surface/90 border border-antique-gold/40 shadow-xl mb-8 max-w-xl">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-body">
                  <div className="border-r border-antique-gold/20 pr-2">
                    <span className="text-bright-gold uppercase text-[10px] font-bold block tracking-wider">
                      DATE
                    </span>
                    <span className="text-warm-cream font-semibold block mt-0.5">
                      16 OCT 2026
                    </span>
                  </div>
                  <div className="border-r border-antique-gold/20 pr-2">
                    <span className="text-bright-gold uppercase text-[10px] font-bold block tracking-wider">
                      TIMING
                    </span>
                    <span className="text-warm-cream font-semibold block mt-0.5">
                      5 PM – 11 PM
                    </span>
                  </div>
                  <div className="border-r border-antique-gold/20 pr-2">
                    <span className="text-bright-gold uppercase text-[10px] font-bold block tracking-wider">
                      VENUE
                    </span>
                    <span className="text-warm-cream font-semibold block mt-0.5 truncate" title="Upwan Lawn, BNR Chanakya">
                      Upwan Lawn
                    </span>
                  </div>
                  <div>
                    <span className="text-bright-gold uppercase text-[10px] font-bold block tracking-wider">
                      ORGANIZER
                    </span>
                    <span className="text-warm-cream font-semibold block mt-0.5">
                      Event Point
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <a
                  href="#experience-dimensions"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow hover:from-amber-glow hover:to-vermilion text-warm-cream font-display text-lg tracking-wider uppercase border-2 border-antique-gold/80 shadow-[0_4px_24px_rgba(217,37,36,0.45)] transition-all duration-200 font-bold hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>EXPLORE THE EXPERIENCE</span>
                  <ChevronDown className="w-4 h-4 text-bright-gold" />
                </a>
                <a
                  href="#passes"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-royal-maroon/90 hover:bg-royal-maroon border border-antique-gold/50 text-warm-cream hover:text-bright-gold font-display text-lg tracking-wider uppercase transition-colors"
                >
                  <Ticket className="w-4 h-4 text-bright-gold" />
                  <span>VIEW PASSES</span>
                </a>
              </div>
            </div>

            {/* Right Column: Framed Layered RAASCDR Artwork Composition */}
            <div ref={heroRightRef} className="lg:col-span-5 will-change-transform">
              <div className="relative mx-auto max-w-[420px] aspect-[4/5] rounded-3xl p-3 bg-gradient-to-b from-royal-maroon via-deep-plum to-card-surface border-2 border-antique-gold/60 shadow-[0_12px_48px_rgba(0,0,0,0.8)] overflow-hidden group">
                {/* Gold Inner Keyline with Corner Diamonds */}
                <div className="absolute inset-4 rounded-2xl border border-antique-gold/30 pointer-events-none z-20" />
                <span className="absolute top-5 left-5 text-bright-gold text-[10px] z-30 pointer-events-none select-none">♦</span>
                <span className="absolute top-5 right-5 text-bright-gold text-[10px] z-30 pointer-events-none select-none">♦</span>
                <span className="absolute bottom-5 left-5 text-bright-gold text-[10px] z-30 pointer-events-none select-none">♦</span>
                <span className="absolute bottom-5 right-5 text-bright-gold text-[10px] z-30 pointer-events-none select-none">♦</span>

                {/* Layer 1: Sunburst Aura Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-40">
                  <Image
                    src="/images/client/raascdr/web/sunburst-aura.webp"
                    alt=""
                    width={400}
                    height={400}
                    className="object-contain"
                  />
                </div>

                {/* Layer 2: Rotating Gold Chakri */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none z-10 opacity-30 animate-spin-slow">
                  <Image
                    src="/images/client/raascdr/web/chakri-gold.webp"
                    alt=""
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Layer 3: Maa Durga Centerpiece Artwork */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-56 sm:w-64 h-56 sm:h-64 z-10">
                  <Image
                    src="/images/client/raascdr/web/durga-centerpiece.webp"
                    alt="Maa Durga iconography for Raas Utsav 2026"
                    fill
                    priority
                    className="object-contain drop-shadow-[0_8px_24px_rgba(217,37,36,0.35)]"
                  />
                </div>

                {/* Layer 4: Crossing Dandiya Sticks Decoration */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 h-24 z-20 pointer-events-none opacity-90 drop-shadow-md">
                  <Image
                    src="/images/client/raascdr/web/dandiya-sticks.webp"
                    alt=""
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Layer 5: Bottom Plaque with Event Point Credential */}
                <div className="absolute bottom-5 left-6 right-6 z-30 bg-royal-maroon/95 border border-antique-gold/50 rounded-xl py-2.5 px-4 text-center shadow-lg backdrop-blur-sm">
                  <span className="font-body text-[10px] text-bright-gold uppercase font-bold tracking-[0.1em] block">
                    JHARKHAND&apos;S GRANDEST DANDIYA NIGHT
                  </span>
                  <span className="font-display text-sm text-warm-cream uppercase tracking-wider block mt-0.5">
                    UPWAN LAWN · CHANAKYA BNR HOTEL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 2: EXPERIENCE DIMENSIONS (ASYMMETRIC EDITORIAL GRID)
          ==================================================================== */}
      <section
        id="experience-dimensions"
        ref={dimensionsRef}
        className="relative z-20 py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-royal-maroon/15 border-b border-antique-gold/25 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-royal-maroon border border-antique-gold/40 text-bright-gold font-body text-xs uppercase tracking-widest mb-4 shadow-md">
              <span className="text-vermilion text-xs" aria-hidden="true">♦</span>
              <span>SIX SIGNATURE DIMENSIONS</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white font-bold tracking-wide uppercase leading-tight">
              WHAT THE FESTIVAL HOLDS
            </h2>
            <p className="font-body text-sm sm:text-base text-warm-cream/80 max-w-xl mx-auto mt-3 leading-relaxed">
              Curated folk percussion, themed heritage decor, expansive dance circles, and dedicated family hospitality at BNR Chanakya.
            </p>
          </div>

          {/* Asymmetric Editorial Grid (1 Dominant, 2 Medium, 2 Smaller, 1 Full Strip) */}
          <div className="space-y-6">
            {/* Top Row: 1 Dominant Feature + 2 Stacked Medium Features */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* 1. DOMINANT FEATURE: Heritage Royal Décor (Large Col-Span-7) */}
              <div
                ref={(el) => {
                  dimCardsRef.current[0] = el;
                }}
                className="lg:col-span-7 relative p-8 sm:p-10 md:p-12 rounded-3xl bg-card-surface border-2 border-antique-gold/50 shadow-2xl flex flex-col justify-between overflow-hidden group hover:border-bright-gold transition-colors"
              >
                {/* Decorative Inner Keyline */}
                <div className="absolute inset-3 rounded-2xl border border-antique-gold/20 pointer-events-none group-hover:border-bright-gold/30 transition-colors" />

                {/* Decorative Dandiya Sticks Watermark */}
                <div className="absolute -right-6 -bottom-6 w-48 h-48 opacity-15 pointer-events-none group-hover:opacity-25 transition-opacity">
                  <Image
                    src="/images/client/raascdr/web/dandiya-sticks.webp"
                    alt=""
                    fill
                    className="object-contain"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-deep-plum border border-bright-gold/60 text-bright-gold font-body text-xs font-semibold uppercase tracking-wider">
                      <Landmark className="w-4 h-4 text-bright-gold" />
                      <span>HERITAGE AMBIANCE</span>
                    </div>
                    <span className="font-display text-6xl text-bright-gold/80">01</span>
                  </div>

                  <span className="font-body text-xs text-bright-gold font-bold uppercase tracking-[0.1em] block mb-2">
                    VINTAGE ROYAL CHARM
                  </span>
                  <h3 className="font-display text-3xl sm:text-4xl md:text-5xl text-warm-cream uppercase tracking-wide mb-4 leading-tight">
                    HERITAGE ROYAL DÉCOR
                  </h3>
                  <p className="font-body text-sm sm:text-base text-warm-cream/85 leading-relaxed max-w-xl mb-6">
                    Themed architectural lighting, glowing traditional diyas, and authentic festive fabric drapes accenting the vintage heritage grounds of Chanakya BNR Hotel, creating an enchanting royal courtyard under the evening sky.
                  </p>
                </div>

                <div className="pt-6 border-t border-antique-gold/25 flex flex-wrap items-center gap-2 relative z-10">
                  {['Heritage Architecture Lighting', 'Traditional Diyas & Festive Drapes', 'Royal Photo Backdrops'].map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-royal-maroon/90 border border-antique-gold/35 text-warm-cream text-xs font-body shadow-sm"
                    >
                      <span className="text-bright-gold text-[10px]">✦</span>
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Stack of 2 Medium Features (Col-Span-5) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* 2. MEDIUM FEATURE 1: Live Music */}
                <div
                  ref={(el) => {
                    dimCardsRef.current[1] = el;
                  }}
                  className="flex-1 p-7 sm:p-8 rounded-3xl bg-card-surface border-2 border-antique-gold/40 shadow-xl flex flex-col justify-between overflow-hidden group hover:border-bright-gold transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deep-plum border border-vermilion/60 text-vermilion font-body text-xs font-semibold uppercase tracking-wider">
                        <Music className="w-3.5 h-3.5 text-vermilion" />
                        <span>FOLK PERCUSSION</span>
                      </div>
                      <span className="font-display text-4xl text-bright-gold/80">02</span>
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl text-warm-cream uppercase tracking-wide mb-2">
                      LIVE MUSIC &amp; DHOL FUSION
                    </h3>
                    <p className="font-body text-xs sm:text-sm text-warm-cream/80 leading-relaxed">
                      Master dhol percussionists delivering authentic Gujarati folk rhythms and high-energy festival beats that drive the circular dance floor.
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-antique-gold/20 flex items-center gap-2 text-xs text-bright-gold font-body">
                    <span>✦ Live Master Dhol Ensembles</span>
                    <span>·</span>
                    <span>Folk Rhythms</span>
                  </div>
                </div>

                {/* 3. MEDIUM FEATURE 2: DJ Performance */}
                <div
                  ref={(el) => {
                    dimCardsRef.current[2] = el;
                  }}
                  className="flex-1 p-7 sm:p-8 rounded-3xl bg-card-surface border-2 border-antique-gold/40 shadow-xl flex flex-col justify-between overflow-hidden group hover:border-bright-gold transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deep-plum border border-amber-glow/60 text-amber-glow font-body text-xs font-semibold uppercase tracking-wider">
                        <Disc className="w-3.5 h-3.5 text-amber-glow" />
                        <span>FESTIVAL ANTHEMS</span>
                      </div>
                      <span className="font-display text-4xl text-bright-gold/80">03</span>
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl text-warm-cream uppercase tracking-wide mb-2">
                      DJ PERFORMANCE
                    </h3>
                    <p className="font-body text-xs sm:text-sm text-warm-cream/80 leading-relaxed">
                      High-energy musical sets blending timeless traditional Garba melodies with upbeat Bollywood celebration anthems for non-stop dancing.
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-antique-gold/20 flex items-center gap-2 text-xs text-amber-glow font-body">
                    <span>✦ Bollywood Celebration Anthems</span>
                    <span>·</span>
                    <span>Stage Sound</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Row: 2 Balanced Supporting Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 4. SUPPORTING FEATURE 1: Dandiya Nights */}
              <div
                ref={(el) => {
                  dimCardsRef.current[3] = el;
                }}
                className="p-8 sm:p-9 rounded-3xl bg-card-surface border-2 border-antique-gold/40 shadow-xl flex flex-col justify-between overflow-hidden group hover:border-bright-gold transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deep-plum border border-bright-gold/60 text-bright-gold font-body text-xs font-semibold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-bright-gold" />
                      <span>CIRCULAR GARBA ARENA</span>
                    </div>
                    <span className="font-display text-4xl text-bright-gold/80">04</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl text-warm-cream uppercase tracking-wide mb-2">
                    DANDIYA NIGHTS
                  </h3>
                  <p className="font-body text-sm text-warm-cream/80 leading-relaxed mb-4">
                    Step into expansive concentric dance circles engineered for fluid movement, synchronized dandiya strikes, and celebratory unity under starlit skies.
                  </p>
                </div>

                <div className="pt-4 border-t border-antique-gold/20 flex flex-wrap gap-2 text-xs font-body">
                  <span className="text-bright-gold">✦ Concentric Garba Circles</span>
                  <span className="text-warm-cream/50">·</span>
                  <span className="text-warm-cream/80">Synchronised Dandiya Beats</span>
                </div>
              </div>

              {/* 5. SUPPORTING FEATURE 2: Food Court */}
              <div
                ref={(el) => {
                  dimCardsRef.current[4] = el;
                }}
                className="p-8 sm:p-9 rounded-3xl bg-card-surface border-2 border-antique-gold/40 shadow-xl flex flex-col justify-between overflow-hidden group hover:border-bright-gold transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deep-plum border border-vermilion/60 text-vermilion font-body text-xs font-semibold uppercase tracking-wider">
                      <Utensils className="w-3.5 h-3.5 text-vermilion" />
                      <span>FESTIVE FLAVOURS</span>
                    </div>
                    <span className="font-display text-4xl text-bright-gold/80">05</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl text-warm-cream uppercase tracking-wide mb-2">
                    FOOD COURT
                  </h3>
                  <p className="font-body text-sm text-warm-cream/80 leading-relaxed mb-4">
                    Savor delicious festive street food, regional delicacies, cooling refreshments, and hot masala chai in a dedicated courtyard under string lanterns.
                  </p>
                </div>

                <div className="pt-4 border-t border-antique-gold/20 flex flex-wrap gap-2 text-xs font-body">
                  <span className="text-vermilion">✦ Regional Delicacies &amp; Chaat</span>
                  <span className="text-warm-cream/50">·</span>
                  <span className="text-warm-cream/80">Hot Masala Chai &amp; Coolers</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Full-Width Closing Dimension Strip */}
            <div
              ref={(el) => {
                dimCardsRef.current[5] = el;
              }}
              className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-card-surface via-royal-maroon to-card-surface border-2 border-antique-gold/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-deep-plum border border-bright-gold/60 flex items-center justify-center text-bright-gold shrink-0 shadow-md">
                  <Users className="w-6 h-6 text-bright-gold" />
                </div>
                <div>
                  <span className="font-display text-sm text-bright-gold uppercase tracking-widest block">
                    DIMENSION 06 · INCLUSIVE CELEBRATION
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl text-warm-cream uppercase tracking-wide mt-0.5">
                    FUN FOR EVERYONE
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-warm-cream/80 max-w-xl mt-1">
                    An inclusive, secure, and family-friendly festival environment welcoming dance circles of all ages, couples, friend groups, and festive attendees.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <a
                  href="#passes"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-base tracking-wider uppercase border border-antique-gold/60 font-bold shadow-md hover:scale-105 transition-transform"
                >
                  CHOOSE YOUR PASS
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 3: "WHAT THE NIGHT HOLDS" (DANCE / DEVOTION / CELEBRATION)
          ==================================================================== */}
      <section
        ref={wordsSectionRef}
        className="relative z-20 py-28 md:py-36 px-4 sm:px-6 lg:px-8 bg-deep-plum text-center overflow-hidden border-b border-antique-gold/25"
      >
        <div className="max-w-5xl mx-auto">
          <span className="font-body text-xs text-bright-gold font-bold uppercase tracking-[0.15em] block mb-4">
            THE ESSENCE OF RAAS UTSAV 2026
          </span>

          <h2 className="font-display text-3xl sm:text-4xl text-white font-bold uppercase tracking-widest mb-10">
            WHAT THE NIGHT HOLDS
          </h2>

          {/* Thin Gold Decorative Keyline */}
          <div
            ref={wordLineRef}
            className="h-0.5 max-w-md mx-auto bg-gradient-to-r from-transparent via-antique-gold to-transparent mb-12 will-change-transform"
          />

          {/* Staggered Independent Reveal Words */}
          <div className="space-y-4 sm:space-y-6">
            <div
              ref={word1Ref}
              className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-warm-cream uppercase tracking-[0.12em] font-bold select-none will-change-transform drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
            >
              DANCE
            </div>
            <div
              ref={word2Ref}
              className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-r from-bright-gold via-amber-glow to-bright-gold uppercase tracking-[0.12em] font-bold select-none will-change-transform"
            >
              DEVOTION
            </div>
            <div
              ref={word3Ref}
              className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-warm-cream uppercase tracking-[0.12em] font-bold select-none will-change-transform drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
            >
              CELEBRATION
            </div>
          </div>

          <p className="font-body text-xs sm:text-sm text-warm-cream/70 max-w-md mx-auto mt-12 italic">
            Navratri celebration like never before · Upwan Lawn, Chanakya BNR Hotel, Ranchi
          </p>
        </div>
      </section>

      {/* ====================================================================
          SECTION 4: PASS ACCESS (PHYSICAL TICKET-STUB STYLING)
          ==================================================================== */}
      <section
        id="passes"
        ref={passesRef}
        className="relative z-20 py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-royal-maroon/20 border-b border-antique-gold/25"
      >
        <div className="max-w-7xl mx-auto">
          {/* Passes Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-royal-maroon border border-antique-gold/50 text-bright-gold font-body text-xs uppercase tracking-widest mb-4 shadow-md">
              <Ticket className="w-3.5 h-3.5 text-vermilion" />
              <span>OFFICIAL TICKET CATALOGUE</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white font-bold tracking-wide uppercase leading-tight">
              CHOOSE YOUR PASS.
            </h2>
            <p className="font-body text-sm sm:text-base text-warm-cream/80 max-w-xl mx-auto mt-3 leading-relaxed">
              Official pass pricing for {eventData.eventName} on {eventData.dateDisplay} at {eventData.venueDisplay}. Select your preferred category to record a booking request.
            </p>
          </div>

          {/* 5 Physical Ticket-Stub Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {eventData.passes.map((pass, idx) => (
              <div
                key={pass.id}
                ref={(el) => {
                  passCardsRef.current[idx] = el;
                }}
                className="relative rounded-3xl bg-card-surface border-2 border-antique-gold/45 shadow-2xl p-7 sm:p-8 flex flex-col justify-between overflow-hidden group hover:border-bright-gold transition-[border-color,box-shadow] duration-200 will-change-transform"
              >
                {/* Perforated Ticket Notches */}
                <div
                  className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-deep-plum border border-antique-gold/40"
                  aria-hidden="true"
                />
                <div
                  className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-deep-plum border border-antique-gold/40"
                  aria-hidden="true"
                />

                {/* Badge if present */}
                {pass.badge && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-antique-gold/60 shadow-md">
                    {pass.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-bright-gold font-bold">
                      0{idx + 1}
                    </span>
                    <span className="text-antique-gold/40 text-xs">/</span>
                    <span className="font-body text-[11px] text-warm-cream/60 uppercase tracking-widest">
                      {pass.category}
                    </span>
                  </div>

                  <h3 className="font-display text-2xl sm:text-3xl text-warm-cream uppercase tracking-wide mb-3">
                    {pass.name}
                  </h3>

                  <div className="pb-4 mb-4 border-b-2 border-dashed border-antique-gold/25 flex items-baseline gap-2">
                    <span className="font-display text-4xl sm:text-5xl text-bright-gold font-bold">
                      {pass.priceDisplay}
                    </span>
                    <span className="font-body text-xs text-warm-cream/60">
                      / {pass.admitCount === 1 ? '1 Attendee' : `${pass.admitCount} Attendees`}
                    </span>
                  </div>

                  <p className="font-body text-xs text-warm-cream/80 mb-6 leading-relaxed">
                    {pass.description}
                  </p>

                  {/* Feature Bullets */}
                  <div className="space-y-2 mb-6">
                    {pass.features?.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs font-body text-warm-cream/75">
                        <span className="text-bright-gold text-[10px] shrink-0 mt-0.5">✦</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Button routes to /booking?pass=<pass-id> */}
                <div className="pt-4 border-t border-antique-gold/20">
                  <Link
                    href={`/booking?pass=${pass.id}`}
                    className="w-full py-3.5 px-4 rounded-xl bg-royal-maroon hover:bg-gradient-to-r hover:from-vermilion hover:to-amber-glow text-warm-cream hover:text-warm-cream border border-antique-gold/50 hover:border-bright-gold font-display text-base tracking-wider uppercase font-bold flex items-center justify-center gap-2 transition-all shadow-md group-hover:scale-[1.02]"
                  >
                    <span>SELECT PASS</span>
                    <ArrowRight className="w-4 h-4 text-bright-gold group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 5: BOOKING TRANSITION (READY FOR RAAS?)
          ==================================================================== */}
      <section
        ref={bookingCtaRef}
        className="relative z-20 py-24 md:py-28 px-4 sm:px-6 lg:px-8 bg-deep-plum overflow-hidden border-b border-antique-gold/25"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div
            ref={ctaBoxRef}
            className="p-8 sm:p-12 md:p-16 rounded-3xl bg-gradient-to-br from-card-surface via-royal-maroon/80 to-card-surface border-2 border-antique-gold/50 shadow-2xl relative overflow-hidden will-change-transform"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-deep-plum border border-bright-gold/50 text-bright-gold font-body text-xs uppercase tracking-widest mb-6 shadow-md">
              <span className="text-vermilion text-xs" aria-hidden="true">♦</span>
              <span>OFFICIAL REGISTRATION TRANSITION</span>
            </div>

            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white font-bold tracking-wide uppercase mb-6 leading-tight">
              READY FOR RAAS?
            </h2>

            <p className="font-body text-base sm:text-lg text-warm-cream/85 max-w-2xl mx-auto leading-relaxed mb-10">
              Choose your pass, submit your details and send your booking request directly to the Event Point coordination desk.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/booking"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow hover:from-amber-glow hover:to-vermilion text-warm-cream font-display text-xl tracking-wider uppercase border-2 border-antique-gold/80 shadow-[0_4px_28px_rgba(217,37,36,0.5)] font-bold transition-all hover:scale-[1.02]"
              >
                <span>BOOK YOUR PASS</span>
                <ArrowRight className="w-5 h-5 text-bright-gold" />
              </Link>

              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-royal-maroon hover:bg-royal-maroon/80 border border-antique-gold/50 text-warm-cream font-display text-lg tracking-wider uppercase transition-colors hover:border-bright-gold"
              >
                <span>CONTACT EVENT POINT</span>
                <ArrowUpRight className="w-4 h-4 text-bright-gold" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 6: EVENT STRIP (RESTRAINED RAASCDR FRAME)
          ==================================================================== */}
      <section
        ref={venueStripRef}
        className="relative z-20 py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-royal-maroon/40 will-change-transform"
      >
        <div className="max-w-6xl mx-auto">
          <div className="relative p-6 sm:p-8 rounded-2xl bg-card-surface border border-antique-gold/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-12 rounded-xl bg-deep-plum border border-antique-gold/40 p-1 shrink-0 shadow-md">
                <Image
                  src="/images/client/raascdr/web/eventpoint-logo.webp"
                  alt="Event Point Organizer Logo"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-body text-[10px] text-bright-gold uppercase font-bold tracking-[0.12em] block">
                  OFFICIAL FESTIVAL COORDINATES
                </span>
                <h3 className="font-display text-2xl text-warm-cream uppercase tracking-wide mt-0.5">
                  16 OCTOBER 2026 · 5:00 PM – 11:00 PM
                </h3>
                <span className="font-body text-xs sm:text-sm text-warm-cream/80 block">
                  UPWAN LAWN · CHANAKYA BNR HOTEL, RANCHI
                </span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <Link
                href="/booking"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-base tracking-wider uppercase font-bold border border-antique-gold/60 shadow-md hover:scale-105 transition-transform"
              >
                RESERVE NOW
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
