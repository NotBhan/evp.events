'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { eventData } from '@/data/eventData';
import { ArrowUpRight, Calendar, Clock, MapPin } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function EditorialStatement() {
  const sectionRef = useRef<HTMLElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const goldRuleRef = useRef<HTMLDivElement>(null);
  const narrativeRef = useRef<HTMLDivElement>(null);
  const metadataCardRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const mm = gsap.matchMedia();

    // 1. Reduced Motion Preference
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(
        [
          ribbonRef.current,
          eyebrowRef.current,
          headlineRef.current,
          goldRuleRef.current,
          narrativeRef.current,
          metadataCardRef.current,
          actionsRef.current,
        ],
        { opacity: 1, clearProps: 'all' }
      );
    });

    // 2. Full Motion pass (Desktop & Mobile)
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Set initial states
      if (ribbonRef.current) {
        gsap.set(ribbonRef.current, { opacity: 0.9 });
      }
      if (eyebrowRef.current) {
        gsap.set(eyebrowRef.current, { opacity: 0, y: 16 });
      }
      if (headlineRef.current) {
        const lines = headlineRef.current.querySelectorAll('.headline-line');
        gsap.set(lines, { opacity: 0, y: 35 });
      }
      if (goldRuleRef.current) {
        gsap.set(goldRuleRef.current, { scaleX: 0, transformOrigin: 'left center', opacity: 0 });
      }
      if (narrativeRef.current) {
        gsap.set(narrativeRef.current, { opacity: 0, y: 25 });
      }
      if (metadataCardRef.current) {
        const items = metadataCardRef.current.querySelectorAll('.metadata-item');
        gsap.set(metadataCardRef.current, { opacity: 0, y: 25, scale: 0.98 });
        gsap.set(items, { opacity: 0, x: -12 });
      }
      if (actionsRef.current) {
        gsap.set(actionsRef.current, { opacity: 0, y: 16 });
      }

      // Master Section Timeline deterministically synchronized to Hero 70% progress
      const heroEl = document.getElementById('hero');
      const stageEl = heroEl?.querySelector('.hero-stage-sticky') as HTMLElement | null;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroEl || sectionRef.current,
          start: () => {
            if (heroEl && stageEl) {
              const maxScroll = heroEl.offsetHeight - stageEl.offsetHeight;
              return `top+=${Math.round(maxScroll * 0.70)} top`;
            }
            return 'top 65%';
          },
          toggleActions: 'play none none none',
          invalidateOnRefresh: true,
        },
      });

      // Ribbon enters via compositor opacity
      if (ribbonRef.current) {
        tl.to(ribbonRef.current, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 0);
      }

      // Eyebrow reveals via compositor opacity and y
      if (eyebrowRef.current) {
        tl.to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.04);
      }

      // Headline lines reveal sequentially
      if (headlineRef.current) {
        const lines = headlineRef.current.querySelectorAll('.headline-line');
        tl.to(
          lines,
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.08,
            ease: 'power2.out',
          },
          0.08
        );
      }

      // Gold rule draws into place via transform scaleX
      if (goldRuleRef.current) {
        tl.to(
          goldRuleRef.current,
          {
            scaleX: 1,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out',
          },
          0.2
        );
      }

      // Narrative column enters via compositor opacity and y
      if (narrativeRef.current) {
        tl.to(
          narrativeRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power2.out',
          },
          0.22
        );
      }

      // Metadata card & items reveal cleanly without heavy back.out easing
      if (metadataCardRef.current) {
        tl.to(
          metadataCardRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            ease: 'power2.out',
          },
          0.26
        );

        const items = metadataCardRef.current.querySelectorAll('.metadata-item');
        tl.to(
          items,
          {
            opacity: 1,
            x: 0,
            duration: 0.35,
            stagger: 0.06,
            ease: 'power2.out',
          },
          0.3
        );
      }

      // Actions button reveal
      if (actionsRef.current) {
        tl.to(
          actionsRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: 'power2.out',
          },
          0.38
        );
      }
    });

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="statement"
      className="relative z-30 -mt-[55vh] md:-mt-[65vh] bg-deep-plum border-t border-antique-gold/30 shadow-[0_-24px_60px_rgba(0,0,0,0.85)]"
      aria-label="Festival Editorial Statement"
    >
      {/* 1. Golden Connecting Festival Continuous Marquee Ribbon */}
      <div
        ref={ribbonRef}
        className="w-full bg-gradient-to-r from-royal-maroon via-deep-plum to-royal-maroon border-y border-antique-gold/40 py-3 overflow-hidden select-none pointer-events-none relative z-30"
        aria-label="Festival Announcements Marquee"
      >
        <div className="animate-marquee flex items-center whitespace-nowrap">
          {/* Track 1 */}
          <div className="flex items-center gap-6 sm:gap-8 shrink-0 font-display text-xs sm:text-sm tracking-[0.1em] uppercase text-bright-gold pr-6 sm:pr-8">
            <span className="text-vermilion animate-pulse">✦</span>
            <span className="text-bright-gold font-bold">{eventData.eventName} 2026</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-warm-cream">JHARKHAND&apos;S GRANDEST DANDIYA NIGHT</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-bright-gold font-semibold">{eventData.dateDisplay}</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-warm-cream/90">{eventData.timeDisplay}</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-warm-cream">{eventData.venueDisplay}</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-bright-gold">{eventData.organizer.name} PRESENTS</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-warm-cream/90">DANCE · DEVOTION · CELEBRATION</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-bright-gold">AUTHENTIC GUJARATI GARBA &amp; DANDIYA</span>
          </div>

          {/* Track 2 (Identical duplicate for seamless 0-gap infinite loop) */}
          <div className="flex items-center gap-6 sm:gap-8 shrink-0 font-display text-xs sm:text-sm tracking-[0.1em] uppercase text-bright-gold pr-6 sm:pr-8" aria-hidden="true">
            <span className="text-vermilion animate-pulse">✦</span>
            <span className="text-bright-gold font-bold">{eventData.eventName} 2026</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-warm-cream">JHARKHAND&apos;S GRANDEST DANDIYA NIGHT</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-bright-gold font-semibold">{eventData.dateDisplay}</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-warm-cream/90">{eventData.timeDisplay}</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-warm-cream">{eventData.venueDisplay}</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-bright-gold">{eventData.organizer.name} PRESENTS</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-warm-cream/90">DANCE · DEVOTION · CELEBRATION</span>
            <span className="text-antique-gold/50">♦</span>
            <span className="text-bright-gold">AUTHENTIC GUJARATI GARBA &amp; DANDIYA</span>
          </div>
        </div>
      </div>

      {/* 2. Main Editorial Statement Body: Grand Magazine / Poster Spread */}
      <div className="max-w-[1400px] mx-auto py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Column: Monumental Staggered Display Typography */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-start">
            <div
              ref={eyebrowRef}
              className="inline-flex items-center gap-2 mb-5 text-bright-gold text-xs sm:text-sm font-body tracking-[0.15em] uppercase font-bold"
            >
              <span className="text-vermilion">♦</span>
              <span>01 / THE FESTIVAL STATEMENT</span>
              <span className="hidden sm:inline text-antique-gold/40">|</span>
              <span className="hidden sm:inline text-warm-cream/70 tracking-widest text-xs font-normal">
                RAAS UTSAV 2026
              </span>
            </div>

            <h2
              ref={headlineRef}
              className="font-display text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl xl:text-[6.2rem] leading-[0.96] tracking-tight uppercase text-white font-bold"
            >
              <span className="headline-line block">
                WHERE{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-bright-gold via-antique-gold to-bright-gold drop-shadow-[0_2px_24px_rgba(243,198,76,0.5)]">
                  HERITAGE
                </span>
              </span>
              <span className="headline-line block text-white">MEETS</span>
              <span className="headline-line block text-transparent bg-clip-text bg-gradient-to-r from-vermilion via-amber-glow to-vermilion drop-shadow-[0_2px_20px_rgba(217,37,36,0.45)]">
                HIGH-ENERGY
              </span>
              <span className="headline-line block text-white">CELEBRATION</span>
            </h2>

            {/* Substantial Gold Filigree Dividing Rule */}
            <div ref={goldRuleRef} className="flex items-center gap-4 mt-10 mb-8 max-w-xl">
              <div className="h-[2px] flex-1 bg-gradient-to-r from-antique-gold via-bright-gold to-transparent" />
              <span className="text-bright-gold text-sm animate-pulse">✦</span>
              <span className="font-body text-xs uppercase tracking-[0.15em] text-bright-gold font-bold">
                RANCHI · 16 OCTOBER 2026
              </span>
              <div className="h-[1px] w-12 bg-gradient-to-l from-antique-gold to-transparent hidden sm:block" />
            </div>

            {/* Editorial Standfirst Paragraph */}
            <p className="font-body text-lg sm:text-xl md:text-2xl text-warm-cream/90 font-light leading-relaxed max-w-2xl">
              On 16 October 2026, the historic open-air grounds of Chanakya BNR Hotel transform into Jharkhand&apos;s grandest celebration of Navratri.
            </p>
          </div>

          {/* Right Column: Narrative Column & Authoritative Event Metadata Card */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between pt-2 lg:pt-8 space-y-8">
            <div ref={narrativeRef} className="space-y-5">
              <p className="font-body text-sm sm:text-base text-warm-cream/80 leading-relaxed">
                Organized by Event Point, Raas Utsav unites authentic devotional Gujarati Garba rhythms, thunderous live folk percussion, and vibrant Dandiya circles beneath illuminated festival lanterns.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-body uppercase tracking-wider text-bright-gold/90 font-medium">
                <span className="text-vermilion text-xs">✦</span>
                <span>5:00 PM TILL 11:00 PM · UPWAN LAWN, RANCHI</span>
              </div>
            </div>

            {/* Authoritative Event Metadata Card with Richer Presence */}
            <div
              ref={metadataCardRef}
              className="p-7 sm:p-8 rounded-2xl bg-gradient-to-br from-card-surface via-royal-maroon/25 to-card-surface border-2 border-antique-gold/40 shadow-[0_16px_48px_rgba(0,0,0,0.6)] space-y-5"
            >
              <div className="metadata-item flex items-start gap-4 pb-4 border-b border-antique-gold/20">
                <div className="p-2.5 rounded-lg bg-vermilion/20 border border-vermilion/40 text-vermilion shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-body text-[11px] text-bright-gold uppercase tracking-widest font-bold">
                    OFFICIAL FESTIVAL DATE
                  </span>
                  <span className="font-display text-lg font-bold text-warm-cream">
                    {eventData.dateDisplay}
                  </span>
                  <span className="block font-body text-xs text-warm-cream/60">
                    Friday Evening · Navratri Utsav
                  </span>
                </div>
              </div>

              <div className="metadata-item flex items-start gap-4 pb-4 border-b border-antique-gold/20">
                <div className="p-2.5 rounded-lg bg-amber-glow/20 border border-amber-glow/40 text-bright-gold shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-body text-[11px] text-bright-gold uppercase tracking-widest font-bold">
                    CONFIRMED PROGRAMME HOURS
                  </span>
                  <span className="font-display text-lg font-bold text-warm-cream">
                    {eventData.timeDisplay}
                  </span>
                  <span className="block font-body text-xs text-warm-cream/60">
                    Gates open at 5:00 PM dusk
                  </span>
                </div>
              </div>

              <div className="metadata-item flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-antique-gold/20 border border-antique-gold/40 text-bright-gold shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-body text-[11px] text-bright-gold uppercase tracking-widest font-bold">
                    HERITAGE VENUE
                  </span>
                  <span className="font-display text-lg font-bold text-warm-cream">
                    {eventData.venueDisplay}
                  </span>
                  <span className="block font-body text-xs text-warm-cream/60">
                    Historic Open-Air Grounds
                  </span>
                </div>
              </div>
            </div>

            {/* Editorial Quick Actions */}
            <div ref={actionsRef} className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-bright-gold text-deep-plum font-display text-sm tracking-wider uppercase shadow-[0_4px_24px_rgba(217,37,36,0.4)] hover:shadow-[0_6px_32px_rgba(243,198,76,0.6)] hover:scale-105 transition-[transform,box-shadow] duration-200 font-black"
              >
                <span>BOOK YOUR PASS</span>
                <ArrowUpRight className="w-4 h-4 text-deep-plum stroke-[2.5]" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-5 py-4 text-xs text-bright-gold font-body font-bold uppercase tracking-widest hover:text-warm-cream transition-colors"
              >
                <span>READ THE STORY</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
