'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function GrandestNightBanner() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const durgaRef = useRef<HTMLDivElement>(null);
  const titleGroupRef = useRef<HTMLDivElement>(null);
  const plaqueRef = useRef<HTMLDivElement>(null);
  const dancersRef = useRef<HTMLDivElement>(null);
  const dateStripRef = useRef<HTMLDivElement>(null);
  const sponsorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !frameRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Subtle continuous aura rotation
      if (auraRef.current) {
        gsap.to(auraRef.current, {
          rotation: 360,
          duration: 60,
          repeat: -1,
          ease: 'none',
        });
      }

      // 2. Layered curtain & entrance timeline following Reference B hierarchy
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'top 35%',
          toggleActions: 'play none none none',
          once: true,
        },
      });

      // 1. Outer frame reveal
      tl.fromTo(
        frameRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' },
        0
      );

      // 2. Background aura & mandala settle
      if (auraRef.current) {
        tl.fromTo(
          auraRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 0.55, scale: 1, duration: 0.85, ease: 'power2.out' },
          0.1
        );
      }

      // 3. Durga centerpiece resolves
      if (durgaRef.current) {
        tl.fromTo(
          durgaRef.current,
          { opacity: 0, scale: 0.9, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' },
          0.2
        );
      }

      // 4. Title group enters from left
      if (titleGroupRef.current) {
        tl.fromTo(
          titleGroupRef.current,
          { opacity: 0, x: -35 },
          { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' },
          0.25
        );
      }

      // 5. Feature plaque arrives from right
      if (plaqueRef.current) {
        tl.fromTo(
          plaqueRef.current,
          { opacity: 0, scale: 0.88, y: -10 },
          { opacity: 1, scale: 1, y: 0, duration: 0.75, ease: 'back.out(1.15)' },
          0.35
        );
      }

      // 6. Dancers settle from right
      if (dancersRef.current) {
        tl.fromTo(
          dancersRef.current,
          { opacity: 0, x: 35, y: 10 },
          { opacity: 1, x: 0, y: 0, duration: 0.85, ease: 'power2.out' },
          0.4
        );
      }

      // 7. Date / Venue strip appears
      if (dateStripRef.current) {
        tl.fromTo(
          dateStripRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' },
          0.5
        );
      }

      // 8. Sponsorship footer resolves
      if (sponsorRef.current) {
        tl.fromTo(
          sponsorRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
          0.6
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="grandest-night-banner"
      className="relative w-full py-12 sm:py-16 md:py-24 bg-deep-plum text-warm-cream overflow-hidden border-y border-antique-gold/30"
      aria-label="Jharkhand's Grandest Dandiya Night Panoramic Campaign Banner"
    >
      {/* Background Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(217, 37, 36, 0.14) 0%, rgba(34, 13, 26, 0.85) 60%, #12080D 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1560px] mx-auto px-3 sm:px-6 lg:px-8">
        {/* Section Editorial Header Tag */}
        <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6 px-1">
          <div className="inline-flex items-center gap-2 text-bright-gold text-xs sm:text-sm font-body tracking-[0.12em] uppercase font-bold">
            <span className="text-vermilion">♦</span>
            <span>02 / OFFICIAL PANORAMIC CAMPAIGN BANNER</span>
          </div>
          <span className="text-warm-cream/50 text-[11px] font-body tracking-wider hidden sm:inline uppercase">
            REFERENCE B • 1600 × 639
          </span>
        </div>

        {/* ==================================================================== */}
        {/* DESKTOP & TABLET VIEW: TRUE 2.50:1 PANORAMIC COMPOSITION (>= 768px)  */}
        {/* ==================================================================== */}
        <div
          ref={frameRef}
          className="hidden md:block relative w-full aspect-[1600/639] rounded-2xl overflow-hidden border-2 border-antique-gold/50 shadow-[0_20px_60px_rgba(0,0,0,0.85)] bg-[#14060E] select-none"
        >
          {/* Layer 0: Background Gradient & Atmospheric Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 48% 45%, rgba(68, 14, 38, 0.95) 0%, rgba(34, 8, 22, 0.98) 45%, #10050B 100%)',
            }}
          />

          {/* Layer 0b: Subtle Mandala Background Pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen bg-repeat bg-center"
            style={{
              backgroundImage: 'radial-gradient(circle, #F3C64C 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Layer 1: Festive Hanging String Lights Along Top Border */}
          <div className="absolute -top-1 left-0 right-0 h-[18%] pointer-events-none z-20 overflow-hidden">
            <Image
              src="/images/client/raascdr/web/string-lights.webp"
              alt=""
              fill
              className="object-cover object-top opacity-95"
              unoptimized
            />
          </div>

          {/* Layer 2: Hanging Brass Diyas on Left & Right Borders */}
          <div className="absolute top-0 left-[1%] w-[6.5%] h-[42%] pointer-events-none z-20 opacity-90">
            <Image
              src="/images/client/raascdr/web/hanging-diyas.webp"
              alt=""
              fill
              className="object-contain object-top"
              unoptimized
            />
          </div>
          <div className="absolute top-0 right-[1%] w-[6.5%] h-[42%] pointer-events-none z-20 opacity-90 scale-x-[-1]">
            <Image
              src="/images/client/raascdr/web/hanging-diyas.webp"
              alt=""
              fill
              className="object-contain object-top"
              unoptimized
            />
          </div>

          {/* Layer 3: Festive Fireworks Bursts */}
          <div className="absolute top-[8%] left-[23%] w-[16%] h-[32%] pointer-events-none opacity-30 mix-blend-screen">
            <Image
              src="/images/client/raascdr/web/fireworks-burst.webp"
              alt=""
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="absolute top-[10%] right-[22%] w-[16%] h-[32%] pointer-events-none opacity-30 mix-blend-screen scale-x-[-1]">
            <Image
              src="/images/client/raascdr/web/fireworks-burst.webp"
              alt=""
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Layer 4: Top-Left Event Point Branding — Elevated higher & borderless with internal black stroke */}
          <div className="absolute top-[2.2%] left-[8.5%] lg:left-[9%] z-30 flex items-center">
            <div className="relative w-[100px] h-[75px] lg:w-[120px] lg:h-[90px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              <Image
                src="/images/client/raascdr/web/eventpoint-badge.webp"
                alt="Event Point Official Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          {/* Layer 5: CENTER DEVOTIONAL CENTERPIECE — Maa Durga + Sunburst Aura + Golden Chakri */}
          <div className="absolute left-[38%] lg:left-[40%] top-[4%] w-[23%] h-[68%] flex items-center justify-center z-20 pointer-events-none">
            {/* Rotating Chakri & Sunburst Aura */}
            <div
              ref={auraRef}
              className="absolute w-[145%] h-[145%] pointer-events-none opacity-50"
            >
              <Image
                src="/images/client/raascdr/web/chakri-gold.webp"
                alt=""
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Durga Centerpiece */}
            <div
              ref={durgaRef}
              className="relative w-full h-full drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]"
            >
              <Image
                src="/images/client/raascdr/web/durga-centerpiece.webp"
                alt="Goddess Durga Devotional Focal Centerpiece"
                fill
                className="object-contain object-center"
                sizes="(max-width: 1024px) 240px, 340px"
                priority
              />
            </div>
          </div>

          {/* Layer 6: LEFT REGION — "रास Utsav 2026" Title & Grandest Dandiya Night Lockup */}
          <div
            ref={titleGroupRef}
            className="absolute left-[3.5%] top-[21.5%] w-[36%] z-30 flex flex-col items-start"
          >
            {/* Authentic CorelDRAW Title Artwork — 4× upscaled for crisp rendering */}
            <div className="relative w-full h-[100px] lg:h-[145px] xl:h-[175px] drop-shadow-[0_6px_20px_rgba(0,0,0,0.85)]">
              <Image
                src="/images/client/raascdr/web/title-raas-utsav-4x.webp"
                alt="रास Utsav 2026"
                fill
                className="object-contain object-left"
                
                sizes="(max-width: 1024px) 450px, 650px"
                priority
                unoptimized
              />
            </div>

            {/* Monumental Headline Lockup matching Reference B */}
            <div className="mt-1 lg:mt-2 w-full">
              <span className="block font-antiqua text-[9px] lg:text-[11px] xl:text-xs text-warm-cream/90 tracking-[0.14em] uppercase font-bold">
                JHARKHAND&apos;S GRANDEST
              </span>
              <div className="flex items-center gap-1.5 lg:gap-2 text-bright-gold">
                <span className="text-bright-gold text-xs lg:text-sm select-none" aria-hidden="true">❧</span>
                <h2 className="font-antiqua text-2xl lg:text-3xl xl:text-4xl text-bright-gold tracking-[0.06em] uppercase drop-shadow-[0_2px_12px_rgba(243,198,76,0.35)] leading-none font-bold">
                  DANDIYA NIGHT
                </h2>
                <span className="text-bright-gold text-xs lg:text-sm select-none scale-x-[-1]" aria-hidden="true">❧</span>
              </div>
            </div>

            {/* Tagline & Pillars */}
            <p className="font-bangle text-[10px] lg:text-xs xl:text-sm text-warm-cream font-medium italic tracking-wide mt-0.5 lg:mt-1">
              Navratri Celebration like never before
            </p>
            <div className="flex items-center gap-2 text-[8px] lg:text-[10px] xl:text-[11px] text-amber-glow font-bangle tracking-[0.1em] uppercase font-semibold mt-0.5">
              <span>Dance</span>
              <span className="text-antique-gold/60">|</span>
              <span>Devotion</span>
              <span className="text-antique-gold/60">|</span>
              <span>Celebration</span>
            </div>
          </div>

          {/* Layer 7: RIGHT REGION — Feature Plaque & Dancing Couple */}
          {/* Feature Plaque (Upper Right) */}
          <div
            ref={plaqueRef}
            className="absolute right-[22%] lg:right-[23%] top-[9%] w-[14%] h-[40%] z-20"
          >
            <div className="relative w-full h-full flex items-center justify-center drop-shadow-[0_6px_20px_rgba(0,0,0,0.8)]">
              <Image
                src="/images/client/raascdr/web/plaque-maroon-3x.webp"
                alt="Event Features"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 160px, 230px"
                unoptimized
              />
              {/* Plaque Text Content */}
              <div className="relative z-10 flex flex-col items-start justify-center pl-3 pr-2 text-left font-futura">
                <span className="text-bright-gold font-futura text-[10px] lg:text-xs xl:text-sm tracking-wider font-bold mb-0.5">
                  FEATURES :
                </span>
                {[
                  'DANDIYA NIGHTS',
                  'LIVE MUSIC',
                  'DJ PERFORMANCE',
                  'FOOD COURT',
                  'FUN FOR EVERYONE',
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-1 leading-tight my-[1px]">
                    <span className="text-bright-gold text-[7px] lg:text-[8px]">★</span>
                    <span className="text-warm-cream text-[7px] lg:text-[8px] xl:text-[9.5px] font-bold tracking-tight font-futura">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dancing Couple (Right & Lower-Right) */}
          <div
            ref={dancersRef}
            className="absolute right-[0.5%] bottom-[2%] w-[33%] h-[74%] z-25 pointer-events-none"
          >
            <div className="relative w-full h-full drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
              <Image
                src="/images/client/raascdr/web/dancers-composite.webp"
                alt="Female and Male Dandiya Dancers in Festive Attire"
                fill
                className="object-contain object-right-bottom"
                
                sizes="(max-width: 1024px) 400px, 600px"
                quality={100}
              />
            </div>
          </div>

          {/* Layer 8: LOWER-MIDDLE — Date / Time / Venue Golden Pill Strip */}
          <div
            ref={dateStripRef}
            className="absolute left-[3.5%] bottom-[9%] w-[58%] lg:w-[56%] z-30"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-[#F7C647] via-[#E4A936] to-[#F7C647] text-[#19060F] px-3 lg:px-4 py-1.5 rounded-full border border-antique-gold shadow-[0_4px_16px_rgba(0,0,0,0.6)] font-lucida text-[9px] lg:text-[11px] xl:text-xs font-bold">
              {/* Date */}
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none" aria-hidden="true">📅</span>
                <div>
                  <span className="block text-[7px] lg:text-[8px] uppercase tracking-wider text-[#3D1400]">Date:</span>
                  <span className="font-extrabold tracking-tight">16 October 2026</span>
                </div>
              </div>
              <div className="w-[1px] h-6 bg-[#3D1400]/25" />
              {/* Time */}
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none" aria-hidden="true">🕒</span>
                <div>
                  <span className="block text-[7px] lg:text-[8px] uppercase tracking-wider text-[#3D1400]">Time:</span>
                  <span className="font-extrabold tracking-tight">5:00pm - 11:00pm</span>
                </div>
              </div>
              <div className="w-[1px] h-6 bg-[#3D1400]/25" />
              {/* Venue */}
              <div className="flex items-center gap-1.5 max-w-[40%]">
                <span className="text-base leading-none" aria-hidden="true">📍</span>
                <div className="truncate">
                  <span className="block text-[7px] lg:text-[8px] uppercase tracking-wider text-[#3D1400]">Venue:</span>
                  <span className="font-extrabold tracking-tight truncate block">Upwan Lawn, Chanakya BNR Hotel, Ranchi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Layer 9: BOTTOM — Sponsorship & Contact Information */}
          <div
            ref={sponsorRef}
            className="absolute left-[3.5%] bottom-[2%] w-[58%] lg:w-[56%] z-30 flex items-center justify-between text-[8px] lg:text-[9.5px] xl:text-[10.5px] text-warm-cream/90 font-avenir"
          >
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-royal-maroon/90 border border-antique-gold/60 text-bright-gold font-bold tracking-wider uppercase text-[7px] lg:text-[8px] font-serif">
                FOR SPONSORSHIP CONTACT
              </span>
              <span className="font-semibold text-warm-cream font-avenir">
                📞 9931503960 | 8540006033 | 9430112440
              </span>
            </div>
            <div className="hidden xl:flex items-center gap-1 text-warm-cream/80 text-[9px] font-avenir">
              <span>✉</span>
              <span>eventpoint42@gmail.com</span>
            </div>
          </div>

          {/* Direct Pass Booking CTA Ribbon */}
          <div className="absolute right-[2.5%] bottom-[2.5%] z-30">
            <Link
              href="/booking"
              className="inline-flex items-center gap-1.5 px-3 lg:px-4 py-1 rounded-md bg-gradient-to-r from-royal-maroon via-vermilion to-royal-maroon text-warm-cream font-body text-[9px] lg:text-[11px] font-bold tracking-[0.15em] uppercase border border-antique-gold/90 shadow-[0_2px_12px_rgba(217,37,36,0.4)] hover:shadow-[0_3px_18px_rgba(243,198,76,0.6)] transition-all"
            >
              <span>CLAIM PASS</span>
              <span className="text-bright-gold">→</span>
            </Link>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* MOBILE RECOMPOSITION VIEW (< 768px): ADAPTIVE CONTROLLED STACK CARD  */}
        {/* ==================================================================== */}
        <div className="block md:hidden relative w-full rounded-2xl overflow-hidden border-2 border-antique-gold/50 shadow-[0_16px_40px_rgba(0,0,0,0.85)] bg-[#14060E] p-4 sm:p-6">
          {/* Mobile String Lights along top */}
          <div className="absolute top-0 left-0 right-0 h-10 pointer-events-none opacity-80">
            <Image
              src="/images/client/raascdr/web/string-lights.webp"
              alt=""
              fill
              className="object-cover object-top"
              unoptimized
            />
          </div>

          {/* Top Row: Event Point Branding + Eyebrow — Elevated higher & borderless */}
          <div className="relative z-20 flex items-center justify-between mb-3 pt-3 px-1">
            <div className="relative w-[96px] h-[64px] drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)]">
              <Image
                src="/images/client/raascdr/web/eventpoint-badge.webp"
                alt="Event Point Logo"
                fill
                className="object-contain object-left"
                unoptimized
              />
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-royal-maroon/90 border border-antique-gold/50 text-[9px] font-bold text-bright-gold uppercase tracking-wider shadow-md">
              <span>✦</span>
              <span>16 OCT 2026</span>
            </div>
          </div>

          {/* Center Devotional Focal: Maa Durga & Chakri */}
          <div className="relative z-10 w-full flex justify-center items-center my-2">
            <div className="relative w-[180px] h-[180px]">
              {/* Rotating Chakri */}
              <div className="absolute inset-0 opacity-40 animate-[spin_60s_linear_infinite]">
                <Image
                  src="/images/client/raascdr/web/chakri-gold.webp"
                  alt=""
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              {/* Durga Centerpiece */}
              <div className="relative w-full h-full drop-shadow-[0_6px_20px_rgba(0,0,0,0.9)]">
                <Image
                  src="/images/client/raascdr/web/durga-centerpiece.webp"
                  alt="Goddess Durga Centerpiece"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Authentic Title Artwork — 4× upscaled */}
          <div className="relative z-20 w-full flex flex-col items-center text-center mt-1 mb-3">
            <div className="relative w-full max-w-[320px] h-[100px] sm:h-[120px] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              <Image
                src="/images/client/raascdr/web/title-raas-utsav-4x.webp"
                alt="रास Utsav 2026"
                fill
                className="object-contain"
                
                sizes="320px"
                priority
                unoptimized
              />
            </div>
            <span className="block font-antiqua text-[10px] text-warm-cream/90 tracking-[0.12em] uppercase font-bold mt-1">
              JHARKHAND&apos;S GRANDEST
            </span>
            <div className="flex items-center justify-center gap-1.5 text-bright-gold">
              <span className="text-bright-gold text-xs">❧</span>
              <h2 className="font-antiqua text-2xl sm:text-3xl text-bright-gold tracking-[0.06em] uppercase font-bold">
                DANDIYA NIGHT
              </h2>
              <span className="text-bright-gold text-xs scale-x-[-1]">❧</span>
            </div>
            <p className="font-bangle text-xs text-warm-cream font-medium italic mt-0.5">
              Navratri Celebration like never before
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] text-amber-glow font-bangle tracking-wider uppercase font-semibold mt-1">
              <span>Dance</span>
              <span className="text-antique-gold/60">|</span>
              <span>Devotion</span>
              <span className="text-antique-gold/60">|</span>
              <span>Celebration</span>
            </div>
          </div>

          {/* Dancers Presentation */}
          <div className="relative z-10 w-full h-[180px] my-2">
            <Image
              src="/images/client/raascdr/web/dancers-composite.webp"
              alt="Dandiya Dancers"
              fill
              className="object-contain"
            />
          </div>

          {/* Feature Badge Pills */}
          <div className="relative z-20 flex flex-wrap justify-center gap-1.5 mb-4">
            {[
              'DANDIYA NIGHTS',
              'LIVE MUSIC',
              'DJ PERFORMANCE',
              'FOOD COURT',
              'FUN FOR EVERYONE',
            ].map((feat) => (
              <span
                key={feat}
                className="px-2.5 py-1 rounded-full bg-deep-plum/90 border border-antique-gold/40 text-[9px] font-bold text-warm-cream tracking-wider"
              >
                ★ {feat}
              </span>
            ))}
          </div>

          {/* Date / Time / Venue Pill Strip */}
          <div className="relative z-20 w-full bg-gradient-to-r from-[#F7C647] via-[#E4A936] to-[#F7C647] text-[#19060F] p-3 rounded-xl border border-antique-gold shadow-md font-body text-xs mb-3">
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#3D1400]/20">
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-[#3D1400] font-bold">Date:</span>
                <span className="font-extrabold text-xs">16 October 2026</span>
              </div>
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-[#3D1400] font-bold">Time:</span>
                <span className="font-extrabold text-xs">5:00pm - 11:00pm</span>
              </div>
            </div>
            <div className="pt-2">
              <span className="block text-[8px] uppercase tracking-wider text-[#3D1400] font-bold">Venue:</span>
              <span className="font-extrabold text-xs block">Upwan Lawn, Chanakya BNR Hotel, Ranchi</span>
            </div>
          </div>

          {/* Mobile Booking CTA */}
          <div className="relative z-20 mb-3">
            <Link
              href="/booking"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-royal-maroon via-vermilion to-royal-maroon text-warm-cream font-body text-xs font-bold tracking-widest uppercase border border-antique-gold shadow-lg"
            >
              <span>CLAIM YOUR FESTIVAL PASS</span>
              <span className="text-bright-gold">→</span>
            </Link>
          </div>

          {/* Mobile Sponsorship Contacts */}
          <div className="relative z-20 text-center font-body text-[10px] text-warm-cream/80 pt-2 border-t border-antique-gold/25">
            <span className="block text-bright-gold font-bold uppercase tracking-wider mb-0.5">
              FOR SPONSORSHIP CONTACT
            </span>
            <span className="block font-semibold">📞 9931503960 | 8540006033 | 9430112440</span>
            <span className="block text-[9px] text-warm-cream/60 mt-0.5">✉ eventpoint42@gmail.com</span>
          </div>
        </div>
      </div>
    </section>
  );
}

