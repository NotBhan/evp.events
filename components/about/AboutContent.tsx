'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FolkBorder from '@/components/decorations/FolkBorder';
import DandiyaSticks from '@/components/decorations/DandiyaSticks';
import { eventData } from '@/data/eventData';
import {
  Ticket,
  ArrowRight,
  Heart,
  Music,
  Users,
  Calendar,
  Clock,
  MapPin,
  Landmark,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AboutContent() {
  // Section 1: Poster & Top Editorial Refs
  const posterSectionRef = useRef<HTMLElement>(null);
  const posterFrameRef = useRef<HTMLDivElement>(null);
  const lightsRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const durgaRef = useRef<HTMLDivElement>(null);
  const titleLockupRef = useRef<HTMLDivElement>(null);
  const plaqueRef = useRef<HTMLDivElement>(null);
  const dateStripRef = useRef<HTMLDivElement>(null);
  const dancersRef = useRef<HTMLDivElement>(null);
  const sponsorRef = useRef<HTMLDivElement>(null);
  const editorialColRef = useRef<HTMLDivElement>(null);

  // Section 2: Story Section Refs
  const storySectionRef = useRef<HTMLElement>(null);
  const storyQuoteRef = useRef<HTMLDivElement>(null);
  const storyChaptersRef = useRef<HTMLDivElement>(null);

  // Section 3: Pillars Section Refs
  const pillarsSectionRef = useRef<HTMLElement>(null);
  const anchorPillarRef = useRef<HTMLDivElement>(null);
  const otherPillarsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Section 4: Venue Section Refs
  const venueSectionRef = useRef<HTMLElement>(null);
  const venueImageRef = useRef<HTMLImageElement>(null);
  const venueImageContainerRef = useRef<HTMLDivElement>(null);
  const venueGoldLineRef = useRef<HTMLDivElement>(null);
  const venueTextRef = useRef<HTMLDivElement>(null);

  // Section 5: CTA Section Refs
  const ctaSectionRef = useRef<HTMLElement>(null);
  const ctaCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Subtle continuous rotation of the gold Chakri mandala
      if (auraRef.current) {
        gsap.to(auraRef.current, {
          rotation: 360,
          duration: 65,
          repeat: -1,
          ease: 'none',
        });
      }

      // ================================================================
      // SECTION 1: PRIMARY ABOUT POSTER ENTRANCE TIMELINE
      // ================================================================
      if (posterSectionRef.current && posterFrameRef.current) {
        const posterTl = gsap.timeline({
          scrollTrigger: {
            trigger: posterSectionRef.current,
            start: 'top 85%',
            end: 'top 30%',
            toggleActions: 'play none none none',
            once: true,
          },
        });

        // Step 1: Outer gold frame draws in
        posterTl.fromTo(
          posterFrameRef.current,
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
          0
        );

        // Step 2: Decorative string lights enter
        if (lightsRef.current) {
          posterTl.fromTo(
            lightsRef.current,
            { opacity: 0, y: -10 },
            { opacity: 0.95, y: 0, duration: 0.7, ease: 'power2.out' },
            0.1
          );
        }

        // Step 3: Background Chakri / Aura settles
        if (auraRef.current) {
          posterTl.fromTo(
            auraRef.current,
            { opacity: 0, scale: 0.85 },
            { opacity: 0.55, scale: 1, duration: 0.8, ease: 'power2.out' },
            0.15
          );
        }

        // Step 4: Maa Durga centerpiece resolves
        if (durgaRef.current) {
          posterTl.fromTo(
            durgaRef.current,
            { opacity: 0, scale: 0.9, y: 12 },
            { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' },
            0.22
          );
        }

        // Step 5: Title lockup settles
        if (titleLockupRef.current) {
          posterTl.fromTo(
            titleLockupRef.current,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' },
            0.28
          );
        }

        // Step 6: Feature plaque arrives
        if (plaqueRef.current) {
          posterTl.fromTo(
            plaqueRef.current,
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.15)' },
            0.34
          );
        }

        // Step 7: Metadata strip settles
        if (dateStripRef.current) {
          posterTl.fromTo(
            dateStripRef.current,
            { opacity: 0, scale: 0.95 },
            { opacity: 1, scale: 1, duration: 0.65, ease: 'power2.out' },
            0.4
          );
        }

        // Step 8: Dancers appear
        if (dancersRef.current) {
          posterTl.fromTo(
            dancersRef.current,
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
            0.46
          );
        }

        // Step 9: Sponsorship footer
        if (sponsorRef.current) {
          posterTl.fromTo(
            sponsorRef.current,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
            0.52
          );
        }

        // Step 10: Editorial column enters smoothly
        if (editorialColRef.current) {
          posterTl.fromTo(
            editorialColRef.current.children,
            { opacity: 0, x: 30 },
            { opacity: 1, x: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out' },
            0.2
          );
        }
      }

      // ================================================================
      // SECTION 2: THE STORY REVEAL
      // ================================================================
      if (storySectionRef.current) {
        const storyTl = gsap.timeline({
          scrollTrigger: {
            trigger: storySectionRef.current,
            start: 'top 82%',
            once: true,
          },
        });

        if (storyQuoteRef.current) {
          storyTl.fromTo(
            storyQuoteRef.current,
            { opacity: 0, y: 35 },
            { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' },
            0
          );
        }

        if (storyChaptersRef.current) {
          storyTl.fromTo(
            storyChaptersRef.current.children,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.75, stagger: 0.15, ease: 'power2.out' },
            0.15
          );
        }
      }

      // ================================================================
      // SECTION 3: FESTIVAL PILLARS (Anchor First, Then Staggered)
      // ================================================================
      if (pillarsSectionRef.current) {
        const pillarsTl = gsap.timeline({
          scrollTrigger: {
            trigger: pillarsSectionRef.current,
            start: 'top 80%',
            once: true,
          },
        });

        // 1. Reveal the major anchor pillar (01) first
        if (anchorPillarRef.current) {
          pillarsTl.fromTo(
            anchorPillarRef.current,
            { opacity: 0, y: 35 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
            0
          );
        }

        // 2. Remaining pillars follow with stagger
        const validOtherPillars = otherPillarsRef.current.filter(Boolean) as HTMLDivElement[];
        if (validOtherPillars.length > 0) {
          pillarsTl.fromTo(
            validOtherPillars,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out' },
            0.2
          );
        }
      }

      // ================================================================
      // SECTION 4: PANORAMIC VENUE FEATURE (Parallax + Gold Line Draw)
      // ================================================================
      if (venueSectionRef.current) {
        if (venueTextRef.current) {
          gsap.fromTo(
            venueTextRef.current,
            { opacity: 0, y: 25 },
            {
              opacity: 1,
              y: 0,
              duration: 0.75,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: venueSectionRef.current,
                start: 'top 85%',
                once: true,
              },
            }
          );
        }

        if (venueGoldLineRef.current) {
          gsap.fromTo(
            venueGoldLineRef.current,
            { scaleX: 0, transformOrigin: 'left center' },
            {
              scaleX: 1,
              duration: 0.9,
              ease: 'power2.inOut',
              scrollTrigger: {
                trigger: venueGoldLineRef.current,
                start: 'top 88%',
                once: true,
              },
            }
          );
        }

        if (venueImageRef.current && venueImageContainerRef.current) {
          gsap.fromTo(
            venueImageRef.current,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: 'none',
              scrollTrigger: {
                trigger: venueImageContainerRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2,
              },
            }
          );
        }
      }

      // ================================================================
      // SECTION 5: FINAL CTA CARD REVEAL
      // ================================================================
      if (ctaSectionRef.current && ctaCardRef.current) {
        gsap.fromTo(
          ctaCardRef.current,
          { opacity: 0, y: 30, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: ctaSectionRef.current,
              start: 'top 85%',
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
      {/* ==================================================================== */}
      {/* SECTION 1: PRIMARY ABOUT CAMPAIGN POSTER + EDITORIAL SPREAD          */}
      {/* ==================================================================== */}
      <section
        ref={posterSectionRef}
        id="about-poster"
        className="relative z-20 w-full bg-deep-plum text-warm-cream pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-12 border-b border-antique-gold/25 overflow-hidden"
        aria-label="About Raas Utsav — Campaign Poster and Editorial Cultural Story"
      >
        {/* Background Atmospheric Radial Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 85% 65% at 30% 40%, rgba(217, 37, 36, 0.12) 0%, rgba(26, 8, 18, 0.9) 60%, #12080D 100%)',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-[1440px] mx-auto">
          {/* Section Eyebrow Header Tag */}
          <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 text-bright-gold text-xs sm:text-sm font-body tracking-[0.15em] uppercase font-bold">
              <span className="text-vermilion">♦</span>
              <span>ABOUT RAAS UTSAV • 01 / THE STORY</span>
            </div>
            <span className="text-warm-cream/50 text-[11px] font-body tracking-wider hidden sm:inline uppercase">
              PORTRAIT CAMPAIGN ARTWORK • 1086 × 1448
            </span>
          </div>

          {/* Dual-Column Editorial Spread: 3:4 Portrait Poster + Wrapped Storytelling */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
            {/* ================================================================= */}
            {/* LEFT / PRIMARY: LARGE 3:4 CLIENT PORTRAIT CAMPAIGN POSTER         */}
            {/* ================================================================= */}
            <div className="lg:col-span-6 xl:col-span-6 flex justify-center w-full">
              <div
                ref={posterFrameRef}
                className="relative w-full max-w-[530px] aspect-[1086/1448] rounded-2xl overflow-hidden border-2 border-antique-gold/60 shadow-[0_24px_70px_rgba(0,0,0,0.92)] bg-[#14060E] select-none"
              >
                {/* Layer 0: Radial Background Atmosphere */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 28%, rgba(85, 14, 44, 0.95) 0%, rgba(38, 8, 24, 0.98) 45%, #10050B 100%)',
                  }}
                />

                {/* Layer 0b: Physical Double-Keyline Border Inset & Corner Filigrees */}
                <div className="absolute inset-2 sm:inset-2.5 rounded-xl border border-antique-gold/25 pointer-events-none z-30" />
                <div className="absolute top-2 left-2 text-antique-gold/70 text-xs select-none z-30">❖</div>
                <div className="absolute top-2 right-2 text-antique-gold/70 text-xs select-none z-30">❖</div>
                <div className="absolute bottom-2 left-2 text-antique-gold/70 text-xs select-none z-30">❖</div>
                <div className="absolute bottom-2 right-2 text-antique-gold/70 text-xs select-none z-30">❖</div>

                {/* Layer 1: Festive String Lights Along Top Border */}
                <div
                  ref={lightsRef}
                  className="absolute top-0 left-0 right-0 h-[10%] pointer-events-none z-20 overflow-hidden"
                >
                  <Image
                    src="/images/client/raascdr/web/string-lights.webp"
                    alt=""
                    fill
                    className="object-cover object-top opacity-95"
                    unoptimized
                  />
                </div>

                {/* Layer 2: Hanging Brass Diyas on Left & Right Borders */}
                <div className="absolute top-0 left-[1.5%] w-[8%] sm:w-[8.5%] h-[32%] pointer-events-none z-20 opacity-90">
                  <Image
                    src="/images/client/raascdr/web/hanging-diyas.webp"
                    alt=""
                    fill
                    className="object-contain object-top"
                    unoptimized
                  />
                </div>
                <div className="absolute top-0 right-[1.5%] w-[8%] sm:w-[8.5%] h-[32%] pointer-events-none z-20 opacity-90 scale-x-[-1]">
                  <Image
                    src="/images/client/raascdr/web/hanging-diyas.webp"
                    alt=""
                    fill
                    className="object-contain object-top"
                    unoptimized
                  />
                </div>

                {/* Layer 3: Fireworks Bursts Flanking Durga */}
                <div className="absolute top-[12%] left-[4%] w-[24%] h-[20%] pointer-events-none opacity-35 mix-blend-screen">
                  <Image
                    src="/images/client/raascdr/web/fireworks-burst.webp"
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="absolute top-[12%] right-[4%] w-[24%] h-[20%] pointer-events-none opacity-35 mix-blend-screen scale-x-[-1]">
                  <Image
                    src="/images/client/raascdr/web/fireworks-burst.webp"
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>

                {/* Layer 4: Top-Left Authentic Event Point Branding — Shifted top & borderless with internal black stroke */}
                <div className="absolute top-[2.5%] left-[11.5%] sm:left-[12%] z-30">
                  <div className="relative w-[96px] h-[72px] sm:w-[115px] sm:h-[86px] drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)]">
                    <Image
                      src="/images/client/raascdr/web/eventpoint-badge.webp"
                      alt="Event Point Official Logo"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Layer 5: Top-Right Feature Plaque Derived from Client Artwork */}
                <div
                  ref={plaqueRef}
                  className="absolute top-[3.5%] right-[4.5%] w-[32%] h-[18%] z-30"
                >
                  <div className="relative w-full h-full flex items-center justify-center drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                    <Image
                      src="/images/client/raascdr/web/plaque-maroon.webp"
                      alt="Official Event Features"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                    <div className="relative z-10 flex flex-col items-start justify-center pl-2 pr-1 text-left font-body">
                      <span className="text-bright-gold font-display text-[9px] sm:text-[11px] tracking-wider font-bold mb-0.5">
                        FEATURES :
                      </span>
                      {[
                        'DANDIYA NIGHTS',
                        'LIVE MUSIC',
                        'DJ PERFORMANCE',
                        'FOOD COURT',
                        'FUN FOR EVERYONE',
                      ].map((feat) => (
                        <div key={feat} className="flex items-center gap-1 leading-tight my-[0.5px]">
                          <span className="text-bright-gold text-[6px] sm:text-[7.5px]">★</span>
                          <span className="text-warm-cream text-[6px] sm:text-[7.5px] font-bold tracking-tight">
                            {feat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Layer 6: CENTRAL FOCAL AXIS — Maa Durga Centerpiece with Chakri Aura */}
                <div className="absolute left-[26%] top-[5%] sm:top-[7%] w-[48%] h-[24%] sm:h-[26%] flex items-center justify-center z-20 pointer-events-none">
                  {/* Rotating Chakri & Sunburst Aura */}
                  <div
                    ref={auraRef}
                    className="absolute w-[130%] h-[130%] pointer-events-none opacity-50"
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
                    className="relative w-full h-full drop-shadow-[0_8px_25px_rgba(0,0,0,0.9)]"
                  >
                    <Image
                      src="/images/client/raascdr/web/durga-centerpiece.webp"
                      alt="Goddess Durga Centerpiece — Raas Utsav 2026"
                      fill
                      className="object-contain object-center"
                      sizes="(max-width: 640px) 200px, 280px"
                      priority
                    />
                  </div>
                </div>

                {/* Layer 7: CENTER BODY — Authentic Title Artwork & Dandiya Night Lockup */}
                <div
                  ref={titleLockupRef}
                  className="absolute left-0 right-0 top-[27.5%] sm:top-[29%] z-30 flex flex-col items-center text-center px-3 sm:px-4 pointer-events-none"
                >
                  {/* Authentic Title Artwork — 4× upscaled */}
                  <div className="relative w-[64%] sm:w-[68%] h-[46px] sm:h-[64px] md:h-[76px] drop-shadow-[0_6px_18px_rgba(0,0,0,0.9)]">
                    <Image
                      src="/images/client/raascdr/web/title-raas-utsav-4x.webp"
                      alt="रास Utsav 2026 Title Artwork"
                      fill
                      className="object-contain object-center"
                      
                      sizes="(max-width: 640px) 260px, (max-width: 1024px) 380px, 500px"
                      priority
                      unoptimized
                    />
                  </div>

                  {/* Monumental Headline Lockup matching Reference A */}
                  <span className="block font-antiqua text-[6px] sm:text-[8.5px] text-warm-cream/90 tracking-[0.14em] uppercase font-bold mt-0.5">
                    JHARKHAND&apos;S GRANDEST
                  </span>
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-bright-gold mt-0.5">
                    <span className="text-bright-gold text-[8px] sm:text-xs select-none" aria-hidden="true">❧</span>
                    <h2 className="font-antiqua text-xs sm:text-lg md:text-[22px] text-bright-gold tracking-[0.06em] uppercase drop-shadow-[0_2px_12px_rgba(243,198,76,0.35)] leading-none font-bold">
                      DANDIYA NIGHT
                    </h2>
                    <span className="text-bright-gold text-[8px] sm:text-xs select-none scale-x-[-1]" aria-hidden="true">❧</span>
                  </div>

                  <p className="font-bangle text-[6.5px] sm:text-[9.5px] text-warm-cream font-medium italic mt-0.5">
                    Navratri Celebration like never before
                  </p>

                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[5.5px] sm:text-[8px] text-amber-glow font-bangle tracking-[0.16em] uppercase font-semibold mt-0.5">
                    <span>Dance</span>
                    <span className="text-antique-gold/60">•</span>
                    <span>Devotion</span>
                    <span className="text-antique-gold/60">•</span>
                    <span>Celebration</span>
                  </div>
                </div>

                {/* Layer 8: MIDDLE — Golden Date / Time / Venue Pill Strip */}
                <div
                  ref={dateStripRef}
                  className="absolute left-[4.5%] right-[4.5%] sm:left-[6%] sm:right-[6%] top-[51%] sm:top-[51.5%] z-30"
                >
                  <div className="flex items-center justify-between bg-gradient-to-r from-[#F7C647] via-[#E4A936] to-[#F7C647] text-[#19060F] px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full border border-antique-gold shadow-[0_4px_14px_rgba(0,0,0,0.6)] font-body text-[6.5px] sm:text-[9px] font-bold">
                    {/* Date */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Calendar className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#3D1400] shrink-0" aria-hidden="true" />
                      <div>
                        <span className="block text-[4.5px] sm:text-[6.5px] uppercase tracking-wider text-[#3D1400]">Date:</span>
                        <span className="font-extrabold tracking-tight">16 Oct 2026</span>
                      </div>
                    </div>
                    <div className="w-[1px] h-3.5 sm:h-5 bg-[#3D1400]/25" />
                    {/* Time */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Clock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#3D1400] shrink-0" aria-hidden="true" />
                      <div>
                        <span className="block text-[4.5px] sm:text-[6.5px] uppercase tracking-wider text-[#3D1400]">Time:</span>
                        <span className="font-extrabold tracking-tight">5:00 - 11:00pm</span>
                      </div>
                    </div>
                    <div className="w-[1px] h-3.5 sm:h-5 bg-[#3D1400]/25" />
                    {/* Venue */}
                    <div className="flex items-center gap-1 sm:gap-1.5 max-w-[42%]">
                      <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#3D1400] shrink-0" aria-hidden="true" />
                      <div className="truncate">
                        <span className="block text-[4.5px] sm:text-[6.5px] uppercase tracking-wider text-[#3D1400]">Venue:</span>
                        <span className="font-extrabold tracking-tight truncate block">Upwan Lawn, BNR Chanakya</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Layer 9: LOWER HALF — Dancing Couple & Corner Dandiya Diya Artwork */}
                <div
                  ref={dancersRef}
                  className="absolute left-[5%] right-[5%] sm:left-[6%] sm:right-[6%] top-[57.5%] bottom-[8%] z-25 pointer-events-none"
                >
                  <div className="relative w-full h-full drop-shadow-[0_10px_35px_rgba(0,0,0,0.92)]">
                    <Image
                      src="/images/client/raascdr/web/dancers-composite.webp"
                      alt="Female and Male Dandiya Dancers"
                      fill
                      className="object-contain object-bottom"
                      sizes="(max-width: 640px) 300px, 420px"
                    />
                  </div>
                </div>

                {/* Bottom Corners: Dandiya Sticks with Bells & Diyas */}
                <div className="absolute bottom-[4.5%] left-[2%] w-[22%] h-[18%] pointer-events-none z-20 opacity-85">
                  <Image
                    src="/images/client/raascdr/web/dandiya-sticks.webp"
                    alt=""
                    fill
                    className="object-contain object-bottom-left"
                    unoptimized
                  />
                </div>
                <div className="absolute bottom-[4.5%] right-[2%] w-[22%] h-[18%] pointer-events-none z-20 opacity-85 scale-x-[-1]">
                  <Image
                    src="/images/client/raascdr/web/dandiya-sticks.webp"
                    alt=""
                    fill
                    className="object-contain object-bottom-left"
                    unoptimized
                  />
                </div>

                {/* Layer 10: BOTTOM STRIP — Sponsorship Contact Info */}
                <div
                  ref={sponsorRef}
                  className="absolute left-[3%] right-[3%] bottom-[1.8%] z-30 text-center font-body text-warm-cream/90"
                >
                  <div className="inline-flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full bg-royal-maroon/90 border border-antique-gold/60 text-bright-gold font-bold tracking-wider uppercase text-[7px] sm:text-[8px] mb-0.5">
                    <span>FOR SPONSORSHIP CONTACT</span>
                  </div>
                  <div className="text-[7.5px] sm:text-[9px] font-bold text-warm-cream tracking-tight">
                    📞 9931503960 | 8540006033 | 9430112440
                  </div>
                  <div className="text-[6.5px] sm:text-[8px] text-warm-cream/70">
                    ✉ eventpoint42@gmail.com | eventpointranchi18@gmail.com
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* RIGHT / EDITORIAL: MAGAZINE SPREAD WRAPPED AROUND THE CAMPAIGN    */}
            {/* ================================================================= */}
            <div
              ref={editorialColRef}
              className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center py-2 lg:py-4"
            >
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-maroon border border-bright-gold/40 text-bright-gold text-[11px] font-body font-bold uppercase tracking-[0.12em] mb-3.5 shadow-sm w-fit">
                <span className="text-bright-gold text-xs" aria-hidden="true">✦</span>
                <span>JHARKHAND&apos;S GRANDEST CULTURAL GATHERING</span>
              </div>

              {/* Primary Semantic H1 */}
              <h1 className="font-display text-3xl sm:text-4xl lg:text-4xl xl:text-5xl text-white tracking-tight uppercase leading-[1.08] mb-3.5 font-black">
                WHERE HERITAGE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-bright-gold via-antique-gold to-bright-gold drop-shadow-[0_2px_14px_rgba(243,198,76,0.35)]">
                  MEETS HIGH-ENERGY
                </span>{' '}
                <br />
                CELEBRATION.
              </h1>

              {/* Compacted Cultural Narrative Lead */}
              <p className="font-body text-sm sm:text-base text-warm-cream/90 leading-relaxed mb-4 font-light max-w-xl">
                Organized by <strong className="text-bright-gold font-semibold">{eventData.organizer.name}</strong> at the historic Upwan Lawn of Chanakya BNR Hotel, Raas Utsav 2026 unites ancient Gujarati folk traditions, live master dhol percussion, ceremonial Durga Aarti, and concentric circular Dandiya fellowship under Ranchi&apos;s autumn skies.
              </p>

              {/* Compact 4-Feature Micro-Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-4 max-w-xl">
                {[
                  { title: 'Devotional Roots', desc: 'Maa Durga worship & Aarti', icon: Heart, color: 'text-vermilion' },
                  { title: 'Live Folk Dhol', desc: 'Master dhol percussionists', icon: Music, color: 'text-bright-gold' },
                  { title: 'Concentric Circles', desc: 'Multi-generational fellowship', icon: Users, color: 'text-amber-glow' },
                  { title: 'Royal Venue', desc: 'Historic Upwan Lawn, BNR', icon: Landmark, color: 'text-bright-gold' },
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="px-3 py-2 rounded-lg bg-royal-maroon/50 border border-antique-gold/30 flex items-center gap-2.5 shadow-sm"
                    >
                      <div className="w-6 h-6 rounded-md bg-deep-plum/90 border border-antique-gold/40 flex items-center justify-center shrink-0">
                        <IconComp className={`w-3 h-3 ${item.color}`} />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-display text-xs text-bright-gold uppercase tracking-wider font-bold truncate">
                          {item.title}
                        </span>
                        <span className="block font-body text-[10.5px] text-warm-cream/70 leading-none truncate mt-0.5">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sleek Event Metadata Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-2 px-3.5 rounded-lg bg-royal-maroon/70 border border-antique-gold/40 text-xs font-body text-warm-cream/90 mb-5 max-w-xl">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-bright-gold shrink-0" aria-hidden="true" />
                  <span className="font-bold text-warm-cream">16 October 2026</span>
                </div>
                <span className="text-antique-gold/40 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-bright-gold shrink-0" aria-hidden="true" />
                  <span>5:00 PM – 11:00 PM</span>
                </div>
                <span className="text-antique-gold/40 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-bright-gold shrink-0" aria-hidden="true" />
                  <span className="truncate">Upwan Lawn, Chanakya BNR</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-vermilion via-[#D92524] to-amber-glow text-warm-cream font-display text-sm tracking-wider uppercase border border-antique-gold/70 shadow-[0_4px_14px_rgba(217,37,36,0.35)] hover:shadow-[0_4px_20px_rgba(243,198,76,0.5)] transition-all font-bold"
                >
                  <Ticket className="w-4 h-4 text-bright-gold" />
                  <span>VIEW FESTIVAL PASSES</span>
                  <ArrowRight className="w-4 h-4 text-bright-gold" />
                </Link>

                <a
                  href="#the-story"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 sm:py-3 rounded-lg bg-royal-maroon/70 hover:bg-royal-maroon text-warm-cream font-display text-xs tracking-wider uppercase border border-antique-gold/40 hover:border-bright-gold transition-colors font-semibold"
                >
                  <span>EXPLORE STORY</span>
                  <span className="text-bright-gold">↓</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 2: THE STORY (CULTURAL FOUNDATION & ASYMMETRIC TYPOGRAPHY)   */}
      {/* ==================================================================== */}
      <section
        ref={storySectionRef}
        id="the-story"
        className="relative z-20 py-14 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-12 border-b border-antique-gold/25 overflow-hidden bg-royal-maroon/15"
      >
        <div className="max-w-6xl mx-auto">
          {/* Eyebrow */}
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-royal-maroon/80 border border-antique-gold/50 text-bright-gold font-body text-xs uppercase tracking-widest mb-3 shadow-sm">
              <span className="text-vermilion text-xs" aria-hidden="true">♦</span>
              <span>02 / THE CULTURAL FOUNDATION</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-wide uppercase leading-tight">
              THE SPIRIT OF RAAS &amp; DEVOTIONAL ROOTS
            </h2>
          </div>

          {/* Asymmetric 12-Column Magazine Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Col (5 cols): Monumental Editorial Devotional Statement */}
            <div
              ref={storyQuoteRef}
              className="lg:col-span-5 relative p-8 sm:p-10 rounded-2xl bg-[#17060F] border-2 border-antique-gold/50 shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-2 rounded-xl border border-antique-gold/20 pointer-events-none" />
              <span className="absolute top-2.5 left-2.5 text-bright-gold text-[10px] pointer-events-none select-none">❖</span>
              <span className="absolute top-2.5 right-2.5 text-bright-gold text-[10px] pointer-events-none select-none">❖</span>
              <span className="absolute bottom-2.5 left-2.5 text-bright-gold text-[10px] pointer-events-none select-none">❖</span>
              <span className="absolute bottom-2.5 right-2.5 text-bright-gold text-[10px] pointer-events-none select-none">❖</span>

              <div className="relative z-10">
                <div className="w-28 mb-5 opacity-80">
                  <FolkBorder />
                </div>

                <span className="font-body text-[11px] text-bright-gold uppercase tracking-[0.12em] font-bold block mb-3">
                  SACRED TRADITION • COSMIC HARMONY
                </span>

                <blockquote className="font-display text-xl sm:text-2xl text-warm-cream leading-snug mb-6 italic">
                  &ldquo;In the sacred circle of Raas, every dancer is equal, every step is an offering, and every clashing dandiya stick echoes the cosmic triumph of divine righteousness.&rdquo;
                </blockquote>

                <div className="pt-4 border-t border-antique-gold/30 flex items-center justify-between text-xs font-body text-warm-cream/80">
                  <span className="font-bold text-bright-gold">RAAS UTSAV 2026</span>
                  <span>RANCHI, JHARKHAND</span>
                </div>

                {/* Highlight Stats Strip */}
                <div className="mt-6 pt-4 border-t border-antique-gold/20 grid grid-cols-3 gap-2 text-center font-body">
                  <div>
                    <span className="font-display text-2xl text-bright-gold block">6 HRS</span>
                    <span className="text-[10px] text-warm-cream/70 uppercase">Non-Stop</span>
                  </div>
                  <div>
                    <span className="font-display text-2xl text-bright-gold block">16 OCT</span>
                    <span className="text-[10px] text-warm-cream/70 uppercase">Friday</span>
                  </div>
                  <div>
                    <span className="font-display text-2xl text-bright-gold block">1 LAWN</span>
                    <span className="text-[10px] text-warm-cream/70 uppercase">Upwan Lawn</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col (7 cols): In-depth Narrative Chapters */}
            <div ref={storyChaptersRef} className="lg:col-span-7 space-y-6">
              {/* Chapter 1 */}
              <div className="p-6 rounded-xl bg-card-surface/80 border border-antique-gold/35 shadow-md">
                <div className="flex items-center gap-2 mb-2 text-bright-gold text-xs font-body font-bold uppercase tracking-wider">
                  <span>01</span>
                  <span className="text-antique-gold/50">•</span>
                  <span>THE DIVINE MEANING OF CIRCULAR RAAS</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl text-warm-cream uppercase mb-2">
                  THE MANDALA OF CREATION
                </h3>
                <p className="font-body text-sm sm:text-base text-warm-cream/85 leading-relaxed font-light">
                  Navratri celebrates the divine shakti of Goddess Durga and the universal victory of light over ignorance. The circular concentric dance of Garba and Dandiya Raas symbolizes the eternal wheel of time, where community circles revolve harmoniously around the divine center.
                </p>
              </div>

              {/* Chapter 2 */}
              <div className="p-6 rounded-xl bg-card-surface/80 border border-antique-gold/35 shadow-md">
                <div className="flex items-center gap-2 mb-2 text-bright-gold text-xs font-body font-bold uppercase tracking-wider">
                  <span>02</span>
                  <span className="text-antique-gold/50">•</span>
                  <span>ACOUSTIC ENERGY &amp; FOLK PERCUSSION</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl text-warm-cream uppercase mb-2">
                  THE THUNDER OF AUTHENTIC DHOL
                </h3>
                <p className="font-body text-sm sm:text-base text-warm-cream/85 leading-relaxed font-light">
                  Master dhol percussionists, traditional Gujarati beats, and celebratory Sanedo rhythms form the acoustic heartbeat of Raas Utsav. As the tempo accelerates from rhythmic circular Garba into high-energy Dandiya strikes, the entire arena resonates with infectious festive joy.
                </p>
              </div>

              {/* Chapter 3 */}
              <div className="p-6 rounded-xl bg-card-surface/80 border border-antique-gold/35 shadow-md">
                <div className="flex items-center gap-2 mb-2 text-bright-gold text-xs font-body font-bold uppercase tracking-wider">
                  <span>03</span>
                  <span className="text-antique-gold/50">•</span>
                  <span>ROYAL HERITAGE &amp; COMMUNITY SAFETY</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl text-warm-cream uppercase mb-2">
                  AN INCLUSIVE CELEBRATION FOR ALL
                </h3>
                <p className="font-body text-sm sm:text-base text-warm-cream/85 leading-relaxed font-light">
                  Hosted at the historic Chanakya BNR Hotel, Raas Utsav couples grand festive production with disciplined safety, dedicated family corridors, authentic pure vegetarian food stalls, and an open-air natural environment where friends and families celebrate with total peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 3: THE FESTIVAL PILLARS (VARIED PROPORTIONS / ASYMMETRIC)    */}
      {/* ==================================================================== */}
      <section
        ref={pillarsSectionRef}
        id="festival-pillars"
        className="relative z-20 py-14 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-12 bg-deep-plum border-b border-antique-gold/25"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="flex items-center justify-center mb-3">
              <DandiyaSticks size={50} className="text-bright-gold" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-royal-maroon/80 border border-antique-gold/50 text-bright-gold font-body text-xs uppercase tracking-widest mb-3 shadow-md">
              <span className="text-vermilion text-xs" aria-hidden="true">♦</span>
              <span>03 / THE FESTIVAL SPIRIT</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-wide mb-3 uppercase">
              PILLARS OF OUR CELEBRATION
            </h2>
            <p className="font-body text-sm sm:text-base text-warm-cream/80 max-w-xl mx-auto leading-relaxed font-light">
              The four guiding cornerstones that make Raas Utsav heartfelt, authentic, and unforgettable.
            </p>
          </div>

          {/* Asymmetric Varied Proportions Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
            {/* ANCHOR PILLAR (01): Royal Heritage (Large 8-col span) */}
            <div
              ref={anchorPillarRef}
              className="md:col-span-12 lg:col-span-8 relative p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-royal-maroon/80 to-deep-plum/95 border-2 border-antique-gold/50 shadow-xl overflow-hidden flex flex-col justify-between min-h-[320px]"
            >
              <div className="absolute inset-2 rounded-xl border border-antique-gold/20 pointer-events-none" />
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-deep-plum/80 border border-antique-gold/40 text-bright-gold font-body text-[10px] uppercase tracking-wider font-bold mb-2">
                    ANCHOR PILLAR
                  </span>
                  <span className="font-body text-xs text-bright-gold uppercase tracking-[0.12em] font-bold block">
                    VINTAGE COLONIAL CHARM
                  </span>
                  <h3 className="font-display text-3xl sm:text-4xl text-warm-cream tracking-wide uppercase leading-tight mt-1">
                    01 / ROYAL HERITAGE &amp; GRANDEUR
                  </h3>
                </div>
                <span className="font-display text-6xl sm:text-7xl text-bright-gold/30 leading-none">
                  01
                </span>
              </div>

              <p className="font-body text-base sm:text-lg text-warm-cream/90 leading-relaxed max-w-2xl font-light mb-6">
                Hosted at the historic Chanakya BNR Hotel, Ranchi&apos;s most distinguished heritage property. Features expansive open emerald lawns, vintage architectural elegance, and a dignified festival setting fit for a royal Navratri celebration.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-antique-gold/25 text-xs font-body text-bright-gold font-medium">
                <span className="px-2.5 py-1 rounded-full bg-deep-plum/90 border border-antique-gold/30">✦ Historic Railway Legacy</span>
                <span className="px-2.5 py-1 rounded-full bg-deep-plum/90 border border-antique-gold/30">✦ Expansive Open Lawn</span>
                <span className="px-2.5 py-1 rounded-full bg-deep-plum/90 border border-antique-gold/30">✦ Royal Festive Lighting</span>
              </div>
            </div>

            {/* PILLAR 02: Cultural Authenticity (4-col span) */}
            <div
              ref={(el) => {
                otherPillarsRef.current[0] = el;
              }}
              className="md:col-span-6 lg:col-span-4 relative p-8 rounded-2xl bg-card-surface/90 border-2 border-antique-gold/40 shadow-xl flex flex-col justify-between min-h-[320px]"
            >
              <div className="absolute inset-2 rounded-xl border border-antique-gold/20 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-deep-plum border border-antique-gold/40 flex items-center justify-center">
                    <Music className="w-5 h-5 text-bright-gold" />
                  </div>
                  <span className="font-display text-4xl text-bright-gold/40">02</span>
                </div>
                <span className="font-body text-xs text-bright-gold uppercase tracking-[0.12em] font-bold block mb-1">
                  FOLK RHYTHM &amp; DHOL
                </span>
                <h3 className="font-display text-2xl text-warm-cream tracking-wide uppercase mb-3 leading-tight">
                  CULTURAL AUTHENTICITY
                </h3>
                <p className="font-body text-sm text-warm-cream/85 leading-relaxed font-light">
                  Pure traditional folk rhythms, genuine Gujarati beats, ceremonial Sanedo, and master dhol percussion that stay faithful to the centuries-old spirit of Dandiya Raas.
                </p>
              </div>

              <div className="pt-4 border-t border-antique-gold/20 text-xs text-bright-gold font-body font-semibold">
                Master Dhol Ensemble • Folk Rhythms
              </div>
            </div>

            {/* PILLAR 03: Devotional Fervour (4-col span) */}
            <div
              ref={(el) => {
                otherPillarsRef.current[1] = el;
              }}
              className="md:col-span-6 lg:col-span-4 relative p-8 rounded-2xl bg-card-surface/90 border-2 border-antique-gold/40 shadow-xl flex flex-col justify-between min-h-[300px]"
            >
              <div className="absolute inset-2 rounded-xl border border-antique-gold/20 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-deep-plum border border-antique-gold/40 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-vermilion" />
                  </div>
                  <span className="font-display text-4xl text-bright-gold/40">03</span>
                </div>
                <span className="font-body text-xs text-bright-gold uppercase tracking-[0.12em] font-bold block mb-1">
                  HONORING MAA DURGA
                </span>
                <h3 className="font-display text-2xl text-warm-cream tracking-wide uppercase mb-3 leading-tight">
                  DEVOTIONAL FERVOUR
                </h3>
                <p className="font-body text-sm text-warm-cream/85 leading-relaxed font-light">
                  Rooted in sacred reverence for Maa Durga. Every circular step begins with devotion, culminating in a ceremonial evening Aarti that fills the arena with spiritual energy.
                </p>
              </div>

              <div className="pt-4 border-t border-antique-gold/20 text-xs text-bright-gold font-body font-semibold">
                Maa Durga Puja • Ceremonial Aarti
              </div>
            </div>

            {/* PILLAR 04: Festive Unity (Large 8-col span) */}
            <div
              ref={(el) => {
                otherPillarsRef.current[2] = el;
              }}
              className="md:col-span-12 lg:col-span-8 relative p-8 sm:p-10 rounded-2xl bg-gradient-to-tr from-deep-plum/95 to-royal-maroon/75 border-2 border-antique-gold/40 shadow-xl flex flex-col justify-between min-h-[300px]"
            >
              <div className="absolute inset-2 rounded-xl border border-antique-gold/20 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-deep-plum border border-antique-gold/40 flex items-center justify-center">
                    <Users className="w-5 h-5 text-amber-glow" />
                  </div>
                  <span className="font-display text-4xl text-bright-gold/40">04</span>
                </div>
                <span className="font-body text-xs text-bright-gold uppercase tracking-[0.12em] font-bold block mb-1">
                  CONCENTRIC DANCE CIRCLES
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-warm-cream tracking-wide uppercase mb-3 leading-tight">
                  FESTIVE UNITY &amp; CELEBRATION
                </h3>
                <p className="font-body text-sm sm:text-base text-warm-cream/85 leading-relaxed font-light max-w-xl">
                  A celebration engineered for families, youth, and elders alike. Multi-generational concentric dance rings ensure everyone—from seasoned Garba dancers to first-time participants—shares in the collective festive euphoria.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-antique-gold/20 text-xs font-body text-bright-gold">
                <span className="px-2.5 py-1 rounded-full bg-deep-plum/90 border border-antique-gold/30">✦ Multi-Generational Fellowship</span>
                <span className="px-2.5 py-1 rounded-full bg-deep-plum/90 border border-antique-gold/30">✦ Pure Veg Food Stalls</span>
                <span className="px-2.5 py-1 rounded-full bg-deep-plum/90 border border-antique-gold/30">✦ Family-Friendly Security</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 4: HERITAGE VENUE (PANORAMIC UPWAN LAWN EDITORIAL FEATURE)   */}
      {/* ==================================================================== */}
      <section
        ref={venueSectionRef}
        id="heritage-venue"
        className="relative z-20 py-14 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-12 bg-royal-maroon/20 border-b border-antique-gold/25"
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div ref={venueTextRef} className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-3 text-bright-gold text-xs font-body tracking-[0.15em] uppercase font-bold">
                <span className="text-vermilion">♦</span>
                <span>04 / HISTORIC FESTIVAL GROUNDS</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-tight uppercase leading-tight">
                THE ICONIC GROUNDS OF <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-bright-gold via-antique-gold to-bright-gold">
                  UPWAN LAWN
                </span>
              </h2>
            </div>
            <p className="font-body text-xs sm:text-sm text-warm-cream/80 max-w-md leading-relaxed font-light">
              Situated in Ranchi at the historic Chanakya BNR Hotel, Upwan Lawn provides the spacious open lawn setting required for concentric dance rings, authentic food stalls, and full-scale festival production.
            </p>
          </div>

          {/* Large Panoramic Photograph Container */}
          <div
            ref={venueImageContainerRef}
            className="relative rounded-2xl bg-black border-2 border-antique-gold/50 shadow-2xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] max-h-[500px]"
          >
            {/* Animated Gold Keyline Draw Along Top Edge */}
            <div
              ref={venueGoldLineRef}
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-antique-gold via-bright-gold to-antique-gold z-20"
            />

            {/* Corner Filigree Markers */}
            <div className="absolute top-2 left-2 text-antique-gold text-xs z-20 pointer-events-none select-none">❖</div>
            <div className="absolute top-2 right-2 text-antique-gold text-xs z-20 pointer-events-none select-none">❖</div>

            {/* Parallax-Scrubbed Authentic Venue Image */}
            <div className="relative w-full h-[114%] -top-[7%] overflow-hidden">
              <Image
                ref={venueImageRef}
                src="/images/client/venue-bnr-chanakya.jpg"
                alt="Upwan Lawn at Chanakya BNR Hotel, Ranchi — Official Grounds for Raas Utsav 2026"
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                priority
                className="object-cover object-center"
              />
            </div>

            {/* Atmosphere Vignette & Factual Caption Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-deep-plum/95 via-deep-plum/35 to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-10 z-10 space-y-1">
              <span className="text-bright-gold text-[10px] sm:text-xs font-body uppercase tracking-widest font-bold block">
                OFFICIAL FESTIVAL GROUNDS
              </span>
              <h3 className="font-display text-xl sm:text-2xl md:text-3xl text-warm-cream uppercase">
                UPWAN LAWN, CHANAKYA BNR HOTEL, RANCHI
              </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-warm-cream/90 text-xs font-body pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-bright-gold" aria-hidden="true" />
                  16 October 2026
                </span>
                <span className="text-antique-gold/50">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-bright-gold" aria-hidden="true" />
                  5:00 PM – 11:00 PM
                </span>
                <span className="text-antique-gold/50">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-bright-gold" aria-hidden="true" />
                  Station Road, Ranchi
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 5: FINAL ACTION CALLOUT ("STEP INTO THE CELEBRATION")         */}
      {/* ==================================================================== */}
      <section
        ref={ctaSectionRef}
        id="about-cta"
        className="relative z-20 py-14 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-12 text-center bg-deep-plum overflow-hidden border-t border-antique-gold/25"
      >
        {/* Ambient Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(217, 37, 36, 0.15) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div
          ref={ctaCardRef}
          className="relative z-10 max-w-3xl mx-auto p-8 sm:p-12 md:p-14 rounded-3xl bg-card-surface border-2 border-antique-gold/50 shadow-2xl overflow-hidden"
        >
          <div className="w-28 mx-auto mb-5 opacity-85">
            <FolkBorder />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-maroon border border-antique-gold/40 text-bright-gold text-xs font-body font-bold uppercase tracking-wider mb-4">
            <span>✦</span>
            <span>05 / YOUR INVITATION</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-wide mb-4 leading-tight uppercase">
            STEP INTO THE CELEBRATION
          </h2>

          <p className="font-body text-base sm:text-lg text-warm-cream/85 max-w-xl mx-auto mb-4 leading-relaxed font-light">
            Join thousands of devotees, families, and folk dancers on 16 October 2026 for Jharkhand&apos;s grandest Dandiya night at Chanakya BNR Hotel, Ranchi.
          </p>

          <p className="font-body text-xs sm:text-sm text-bright-gold font-medium mb-8">
            Passes starting from ₹999 • All passes include a pair of Dandiya sticks &amp; complimentary food coupon
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/booking"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-gradient-to-r from-vermilion via-[#D92524] to-amber-glow text-warm-cream font-display text-base tracking-wider uppercase border border-antique-gold/70 shadow-lg hover:border-bright-gold transition-all font-bold"
            >
              <Ticket className="w-4 h-4 text-bright-gold" />
              <span>CLAIM YOUR FESTIVAL PASS</span>
              <ArrowRight className="w-4 h-4 text-bright-gold" />
            </Link>
            <Link
              href="/services"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-royal-maroon hover:bg-royal-maroon/80 text-warm-cream font-display text-sm tracking-wider uppercase border border-antique-gold/40 hover:border-bright-gold transition-colors font-semibold"
            >
              <span>EXPLORE EXPERIENCES</span>
            </Link>
          </div>

          <div className="pt-6 border-t border-antique-gold/25 text-center font-body text-xs text-warm-cream/80">
            <span className="block text-bright-gold font-bold uppercase tracking-wider mb-1">
              FOR SPONSORSHIP &amp; VIP INQUIRIES
            </span>
            <span>📞 9931503960 | 8540006033 | 9430112440</span>
            <span className="block text-[11px] text-warm-cream/60 mt-0.5">✉ eventpoint42@gmail.com</span>
          </div>
        </div>
      </section>
    </>
  );
}
