'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { loadGsap } from '@/lib/gsap-loader';
import { eventData } from '@/data/eventData';
import { Clock, MapPin, ArrowRight } from 'lucide-react';

export default function EventDateSchedule() {
  const sectionRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const dateMonumentRef = useRef<HTMLDivElement>(null);
  const num16Ref = useRef<HTMLSpanElement>(null);
  const monthBlockRef = useRef<HTMLDivElement>(null);
  const orbitingBadgesRef = useRef<HTMLDivElement>(null);
  const scheduleBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    let isCleanedUp = false;
    let cleanupFn: (() => void) | undefined;

    const initAnimation = () => {
      loadGsap().then(({ gsap }) => {
        if (isCleanedUp || !sectionRef.current) return;

        const mm = gsap.matchMedia();

        // 1. Reduced Motion Preference
        mm.add('(prefers-reduced-motion: reduce)', () => {
          gsap.set(
            [
              eyebrowRef.current,
              dateMonumentRef.current,
              num16Ref.current,
              monthBlockRef.current,
              orbitingBadgesRef.current,
              scheduleBlockRef.current,
            ],
            { opacity: 1, clearProps: 'all' }
          );
        });

        // 2. Full Motion Pass: Monumental Landmark Sequencing
        mm.add('(prefers-reduced-motion: no-preference)', () => {
          // Set initial states
          if (eyebrowRef.current) gsap.set(eyebrowRef.current, { opacity: 0, y: 15 });
          if (num16Ref.current) gsap.set(num16Ref.current, { opacity: 0, scale: 0.92, y: 30 });
          if (monthBlockRef.current) gsap.set(monthBlockRef.current, { opacity: 0, x: -20 });
          if (orbitingBadgesRef.current) {
            const badges = orbitingBadgesRef.current.querySelectorAll('.orbit-badge');
            gsap.set(badges, { opacity: 0, y: 20, scale: 0.95 });
          }
          if (scheduleBlockRef.current) {
            gsap.set(scheduleBlockRef.current, { opacity: 0, y: 25 });
            const items = scheduleBlockRef.current.querySelectorAll('.flow-item');
            gsap.set(items, { opacity: 0, x: -10 });
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 88%',
              end: 'top 20%',
              toggleActions: 'play none none none',
            },
          });

          // Eyebrow
          if (eyebrowRef.current) {
            tl.to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.4 }, 0);
          }

          // "16" Landmark lands first with monumental impact
          if (num16Ref.current) {
            tl.to(
              num16Ref.current,
              {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.65,
                ease: 'power3.out',
              },
              0.05
            );
          }

          // Month & Year lock in
          if (monthBlockRef.current) {
            tl.to(
              monthBlockRef.current,
              {
                opacity: 1,
                x: 0,
                duration: 0.5,
                ease: 'power2.out',
              },
              0.18
            );
          }

          // Orbiting Badges (Timing & Venue) reveal
          if (orbitingBadgesRef.current) {
            const badges = orbitingBadgesRef.current.querySelectorAll('.orbit-badge');
            tl.to(
              badges,
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.5,
                stagger: 0.1,
                ease: 'back.out(1.2)',
              },
              0.25
            );
          }

          // Schedule flow card arrives smoothly
          if (scheduleBlockRef.current) {
            tl.to(
              scheduleBlockRef.current,
              {
                opacity: 1,
                y: 0,
                duration: 0.55,
                ease: 'power2.out',
              },
              0.32
            );

            const items = scheduleBlockRef.current.querySelectorAll('.flow-item');
            tl.to(
              items,
              {
                opacity: 1,
                x: 0,
                duration: 0.35,
                stagger: 0.05,
                ease: 'power1.out',
              },
              0.4
            );
          }
        });

        cleanupFn = () => mm.revert();
      });
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const handle = window.requestIdleCallback(initAnimation, { timeout: 2000 });
        return () => {
          isCleanedUp = true;
          window.cancelIdleCallback(handle);
          if (cleanupFn) cleanupFn();
        };
      } else {
        const timer = setTimeout(initAnimation, 150);
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

  return (
    <section
      ref={sectionRef}
      id="schedule"
      className="relative z-20 w-full bg-deep-plum text-warm-cream py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 border-t border-antique-gold/25 overflow-hidden"
      aria-label="Event Date, Confirmed Hours & Venue Information"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Eyebrow */}
        <div
          ref={eyebrowRef}
          className="inline-flex items-center gap-2 mb-8 text-bright-gold text-xs sm:text-sm font-body tracking-[0.15em] uppercase font-bold"
        >
          <span className="text-vermilion">♦</span>
          <span>04 / EVENT DATE & VENUE SCHEDULE</span>
        </div>

        {/* Orbiting Date Monument Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Dominant Landmark "16" with Orbiting Month & Identity */}
          <div ref={dateMonumentRef} className="lg:col-span-7 flex flex-col justify-center relative">
            {/* Background Ambient Glow Behind 16 */}
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] bg-gradient-to-tr from-vermilion/20 via-amber-glow/15 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-baseline sm:items-center gap-4 sm:gap-8 relative z-10">
              {/* Monumental "16" */}
              <span
                ref={num16Ref}
                className="font-display text-[7rem] sm:text-[10rem] md:text-[13rem] lg:text-[15rem] xl:text-[18rem] 2xl:text-[20rem] leading-[0.82] text-transparent bg-clip-text bg-gradient-to-b from-bright-gold via-antique-gold to-vermilion tracking-tighter select-none drop-shadow-[0_8px_40px_rgba(243,198,76,0.45)] inline-block font-black"
              >
                16
              </span>

              {/* Orbiting Month, Year, and Festival Subtitle */}
              <div ref={monthBlockRef} className="space-y-2 sm:pl-2">
                <h3 className="font-display text-4xl sm:text-5xl md:text-6xl xl:text-7xl text-warm-cream tracking-[0.06em] uppercase leading-none font-black">
                  OCTOBER
                </h3>
                <div className="flex items-center gap-3">
                  <span className="font-display text-3xl sm:text-4xl text-vermilion tracking-[0.1em] font-bold">
                    2026
                  </span>
                  <div className="h-[2px] w-24 bg-gradient-to-r from-antique-gold via-bright-gold to-transparent" />
                </div>
                <p className="font-body text-xs sm:text-sm text-bright-gold uppercase tracking-[0.12em] font-bold pt-2">
                  FRIDAY CELEBRATION EVENING · NAVRATRI
                </p>
                <p className="font-body text-xs sm:text-sm text-warm-cream/70 max-w-sm leading-relaxed pt-1">
                  Jharkhand&apos;s grandest open-air Dandiya Raas festival gathers under the stars at BNR Chanakya.
                </p>
              </div>
            </div>

            {/* Orbiting Badges: Confirmed Timing & Confirmed Venue as architectural satellites */}
            <div ref={orbitingBadgesRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 relative z-10">
              {/* Timing Satellite Badge */}
              <div className="orbit-badge p-5 rounded-2xl bg-gradient-to-br from-card-surface via-royal-maroon/40 to-card-surface border-2 border-antique-gold/40 shadow-lg flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-deep-plum border border-amber-glow/60 flex items-center justify-center shrink-0 text-bright-gold shadow-sm">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-body text-[10px] text-bright-gold uppercase tracking-wide sm:tracking-widest font-bold block mb-0.5">
                    CONFIRMED TIMING
                  </span>
                  <span className="font-display text-2xl text-warm-cream tracking-wide block font-bold">
                    5:00 PM – 11:00 PM
                  </span>
                  <span className="font-body text-xs text-warm-cream/70 mt-0.5 block">
                    Gates open 5:00 PM dusk · Concludes 11:00 PM
                  </span>
                </div>
              </div>

              {/* Venue Satellite Badge */}
              <div className="orbit-badge p-5 rounded-2xl bg-gradient-to-br from-card-surface via-royal-maroon/40 to-card-surface border-2 border-antique-gold/40 shadow-lg flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-deep-plum border border-vermilion/60 flex items-center justify-center shrink-0 text-vermilion shadow-sm">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-body text-[10px] text-bright-gold uppercase tracking-wide sm:tracking-widest font-bold block mb-0.5">
                    CONFIRMED VENUE
                  </span>
                  <span className="font-display text-xl sm:text-2xl text-warm-cream tracking-wide uppercase block font-bold">
                    UPWAN LAWN
                  </span>
                  <span className="font-body text-xs text-warm-cream/80 font-semibold block truncate">
                    Chanakya BNR Hotel, Ranchi
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Planned Indicative Sequence & Direct Booking Gateway */}
          <div ref={scheduleBlockRef} className="lg:col-span-5 space-y-6">
            {/* Planned Evening Flow Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-royal-maroon/80 via-card-surface to-royal-maroon/50 border-2 border-antique-gold/45 shadow-2xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-deep-plum border border-bright-gold/50 text-bright-gold text-xs font-body font-bold uppercase tracking-wider shadow-sm">
                <span className="text-vermilion text-xs">♦</span>
                <span>PLANNED EVENING FLOW · INDICATIVE SEQUENCE</span>
              </div>

              <ul className="space-y-4 text-xs sm:text-sm font-body text-warm-cream/90">
                <li className="flow-item flex items-start gap-3 pb-3 border-b border-antique-gold/15">
                  <span className="text-bright-gold font-bold mt-0.5">✦</span>
                  <div>
                    <strong className="text-bright-gold font-display text-sm uppercase">5:00 PM</strong>
                    <p className="text-warm-cream/80 text-xs mt-0.5">Gates Open & Traditional Aarti Welcome</p>
                  </div>
                </li>
                <li className="flow-item flex items-start gap-3 pb-3 border-b border-antique-gold/15">
                  <span className="text-bright-gold font-bold mt-0.5">✦</span>
                  <div>
                    <strong className="text-warm-cream font-display text-sm uppercase">Ceremonial Invocations</strong>
                    <p className="text-warm-cream/80 text-xs mt-0.5">Maa Durga Devotional Aarti & Sacred Lighting</p>
                  </div>
                </li>
                <li className="flow-item flex items-start gap-3 pb-3 border-b border-antique-gold/15">
                  <span className="text-bright-gold font-bold mt-0.5">✦</span>
                  <div>
                    <strong className="text-warm-cream font-display text-sm uppercase">Concentric Circles</strong>
                    <p className="text-warm-cream/80 text-xs mt-0.5">Synchronised Traditional Garba & Dandiya Raas</p>
                  </div>
                </li>
                <li className="flow-item flex items-start gap-3 pb-3 border-b border-antique-gold/15">
                  <span className="text-bright-gold font-bold mt-0.5">✦</span>
                  <div>
                    <strong className="text-warm-cream font-display text-sm uppercase">Dhol Ensembles</strong>
                    <p className="text-warm-cream/80 text-xs mt-0.5">High-Energy Folk Percussion & Celebration Rhythms</p>
                  </div>
                </li>
                <li className="flow-item flex items-start gap-3">
                  <span className="text-bright-gold font-bold mt-0.5">✦</span>
                  <div>
                    <strong className="text-vermilion font-display text-sm uppercase">11:00 PM</strong>
                    <p className="text-warm-cream/80 text-xs mt-0.5">Grand Celebration Finale & Gates Conclude</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Direct Link to /booking */}
            <div className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-royal-maroon/60 via-deep-plum to-royal-maroon/60 border border-antique-gold/40 shadow-lg">
              <div>
                <span className="font-display text-sm text-bright-gold uppercase tracking-wider block font-bold">
                  PASSES STARTING AT ₹999
                </span>
                <span className="font-body text-xs text-warm-cream/70 block">
                  Limited capacity on open-air lawn
                </span>
              </div>
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-vermilion to-amber-glow text-deep-plum font-display text-xs tracking-wider uppercase font-black hover:scale-105 transition-transform shadow-md"
              >
                <span>RESERVE PASSES</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
