'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { eventData } from '@/data/eventData';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function CampaignFeature() {
  const sectionRef = useRef<HTMLElement>(null);
  const portraitFrameRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);
  const durgaRef = useRef<HTMLDivElement>(null);
  const titleLockupRef = useRef<HTMLDivElement>(null);
  const dateStripRef = useRef<HTMLDivElement>(null);
  const dancersRef = useRef<HTMLDivElement>(null);
  const sponsorRef = useRef<HTMLDivElement>(null);
  const plaqueRef = useRef<HTMLDivElement>(null);
  const editorialColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !portraitFrameRef.current) return;

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

      // 2. Layered Scroll Entrance Timeline for Reference A (Portrait)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 82%',
          end: 'top 30%',
          toggleActions: 'play none none none',
          once: true,
        },
      });

      // Step 1: Outer portrait frame reveals
      tl.fromTo(
        portraitFrameRef.current,
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        0
      );

      // Step 2: Background aura settles
      if (auraRef.current) {
        tl.fromTo(
          auraRef.current,
          { opacity: 0, scale: 0.85 },
          { opacity: 0.55, scale: 1, duration: 0.8, ease: 'power2.out' },
          0.1
        );
      }

      // Step 3: Durga centerpiece reveals
      if (durgaRef.current) {
        tl.fromTo(
          durgaRef.current,
          { opacity: 0, scale: 0.9, y: 12 },
          { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' },
          0.18
        );
      }

      // Step 4: Title lockup settles
      if (titleLockupRef.current) {
        tl.fromTo(
          titleLockupRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' },
          0.26
        );
      }

      // Step 5: Feature plaque arrives
      if (plaqueRef.current) {
        tl.fromTo(
          plaqueRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.15)' },
          0.32
        );
      }

      // Step 6: Date strip appears
      if (dateStripRef.current) {
        tl.fromTo(
          dateStripRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.65, ease: 'power2.out' },
          0.38
        );
      }

      // Step 7: Dancers reveal
      if (dancersRef.current) {
        tl.fromTo(
          dancersRef.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
          0.44
        );
      }

      // Step 8: Sponsorship footer
      if (sponsorRef.current) {
        tl.fromTo(
          sponsorRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
          0.52
        );
      }

      // Step 9: Editorial column arrives smoothly
      if (editorialColRef.current) {
        tl.fromTo(
          editorialColRef.current.children,
          { opacity: 0, x: 30 },
          { opacity: 1, x: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out' },
          0.2
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="campaign-feature"
      className="relative z-20 w-full bg-deep-plum text-warm-cream py-16 sm:py-20 md:py-28 px-4 sm:px-6 lg:px-12 border-t border-antique-gold/25 overflow-hidden"
      aria-label="Official Campaign Feature — Portrait Campaign Artwork"
    >
      {/* Background Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 30% 50%, rgba(217, 37, 36, 0.12) 0%, rgba(26, 8, 18, 0.9) 60%, #12080D 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1440px] mx-auto">
        {/* Section Tagline */}
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 text-bright-gold text-xs sm:text-sm font-body tracking-[0.15em] uppercase font-bold">
            <span className="text-vermilion">♦</span>
            <span>03 / THE OFFICIAL CAMPAIGN</span>
          </div>
          <span className="text-warm-cream/50 text-[11px] font-body tracking-wider hidden sm:inline uppercase">
            REFERENCE A • 1086 × 1448 (3:4 PORTRAIT)
          </span>
        </div>

        {/* Grand Editorial Layout: Portrait Campaign Artwork + Editorial Storytelling */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* ================================================================= */}
          {/* LEFT: REFERENCE A — AUTHENTIC 3:4 PORTRAIT CAMPAIGN COMPOSITION   */}
          {/* ================================================================= */}
          <div className="lg:col-span-6 xl:col-span-6 flex justify-center w-full">
            <div
              ref={portraitFrameRef}
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

              {/* Layer 0b: Corner Filigree Accents */}
              <div className="absolute top-2 left-2 text-antique-gold/70 text-xs select-none z-30">❖</div>
              <div className="absolute top-2 right-2 text-antique-gold/70 text-xs select-none z-30">❖</div>
              <div className="absolute bottom-2 left-2 text-antique-gold/70 text-xs select-none z-30">❖</div>
              <div className="absolute bottom-2 right-2 text-antique-gold/70 text-xs select-none z-30">❖</div>

              {/* Layer 1: String Lights Along Top */}
              <div className="absolute top-0 left-0 right-0 h-[10%] pointer-events-none z-20 overflow-hidden">
                <Image
                  src="/images/client/raascdr/web/string-lights.webp"
                  alt=""
                  fill
                  className="object-cover object-top opacity-95"
                  unoptimized
                />
              </div>

              {/* Layer 2: Hanging Diyas on Left & Right Borders */}
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

              {/* Layer 4: Top Left Event Point Branding — Shifted top & borderless with internal black stroke */}
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

              {/* Layer 5: Top Right Feature Plaque */}
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
                {/* Rotating Chakri */}
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
                className="absolute left-0 right-0 top-[28%] sm:top-[31%] z-30 flex flex-col items-center text-center px-3 sm:px-4"
              >
                {/* Authentic Title Artwork — 4× upscaled */}
                <div className="relative w-[70%] sm:w-[72%] h-[56px] sm:h-[82px] md:h-[100px] drop-shadow-[0_6px_18px_rgba(0,0,0,0.9)]">
                  <Image
                    src="/images/client/raascdr/web/title-raas-utsav-4x.webp"
                    alt="रास Utsav 2026 Title Artwork"
                    fill
                    className="object-contain object-center"
                    
                    sizes="(max-width: 640px) 280px, (max-width: 1024px) 420px, 550px"
                    priority
                    unoptimized
                  />
                </div>

                {/* Monumental Headline */}
                <span className="block font-antiqua text-[7px] sm:text-[9.5px] text-warm-cream/90 tracking-[0.12em] uppercase font-bold mt-0.5">
                  JHARKHAND&apos;S GRANDEST
                </span>
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-bright-gold mt-0.5">
                  <span className="text-bright-gold text-[10px] sm:text-xs select-none" aria-hidden="true">❧</span>
                  <h3 className="font-antiqua text-base sm:text-2xl lg:text-[26px] text-bright-gold tracking-[0.06em] uppercase drop-shadow-[0_2px_12px_rgba(243,198,76,0.35)] leading-none font-bold">
                    DANDIYA NIGHT
                  </h3>
                  <span className="text-bright-gold text-[10px] sm:text-xs select-none scale-x-[-1]" aria-hidden="true">❧</span>
                </div>

                <p className="font-bangle text-[7.5px] sm:text-[11px] text-warm-cream font-medium italic mt-0.5">
                  Navratri Celebration like never before
                </p>

                <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[6.5px] sm:text-[9px] text-amber-glow font-bangle tracking-[0.1em] uppercase font-semibold mt-0.5">
                  <span>Dance</span>
                  <span className="text-antique-gold/60">|</span>
                  <span>Devotion</span>
                  <span className="text-antique-gold/60">|</span>
                  <span>Celebration</span>
                </div>
              </div>

              {/* Layer 8: MIDDLE — Golden Date / Time / Venue Pill Strip */}
              <div
                ref={dateStripRef}
                className="absolute left-[5%] right-[5%] sm:left-[6%] sm:right-[6%] top-[49.5%] z-30"
              >
                <div className="flex items-center justify-between bg-gradient-to-r from-[#F7C647] via-[#E4A936] to-[#F7C647] text-[#19060F] px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full border border-antique-gold shadow-[0_4px_14px_rgba(0,0,0,0.6)] font-body text-[6.5px] sm:text-[9.5px] font-bold">
                  {/* Date */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-sm leading-none" aria-hidden="true">📅</span>
                    <div>
                      <span className="block text-[5px] sm:text-[7px] uppercase tracking-wider text-[#3D1400]">Date:</span>
                      <span className="font-extrabold tracking-tight">16 Oct 2026</span>
                    </div>
                  </div>
                  <div className="w-[1px] h-3.5 sm:h-5 bg-[#3D1400]/25" />
                  {/* Time */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-sm leading-none" aria-hidden="true">🕒</span>
                    <div>
                      <span className="block text-[5px] sm:text-[7px] uppercase tracking-wider text-[#3D1400]">Time:</span>
                      <span className="font-extrabold tracking-tight">5:00 - 11:00pm</span>
                    </div>
                  </div>
                  <div className="w-[1px] h-3.5 sm:h-5 bg-[#3D1400]/25" />
                  {/* Venue */}
                  <div className="flex items-center gap-1 max-w-[42%]">
                    <span className="text-[10px] sm:text-sm leading-none" aria-hidden="true">📍</span>
                    <div className="truncate">
                      <span className="block text-[5px] sm:text-[7px] uppercase tracking-wider text-[#3D1400]">Venue:</span>
                      <span className="font-extrabold tracking-tight truncate block">Upwan Lawn, BNR Chanakya</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={dancersRef}
                className="absolute left-[4%] right-[4%] sm:left-[5%] sm:right-[5%] top-[54%] bottom-[7%] z-25 pointer-events-none"
              >
                <div className="relative w-full h-full drop-shadow-[0_10px_35px_rgba(0,0,0,0.92)]">
                  <Image
                    src="/images/client/raascdr/web/dancers-composite-new.webp"
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
          {/* RIGHT: EDITORIAL CONTEXT & STORYTELLING                           */}
          {/* ================================================================= */}
          <div
            ref={editorialColRef}
            className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between py-2 sm:py-6"
          >
            <div>
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-royal-maroon border border-bright-gold/50 text-bright-gold text-xs font-body font-bold uppercase tracking-wider mb-6 shadow-sm">
                <span className="text-bright-gold text-xs" aria-hidden="true">✦</span>
                <span>JHARKHAND&apos;S GRANDEST NIGHT</span>
              </div>

              {/* Headline */}
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white tracking-tighter uppercase leading-[1.02] mb-6 font-black">
                A NIGHT MADE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-bright-gold via-antique-gold to-bright-gold drop-shadow-[0_2px_16px_rgba(243,198,76,0.4)]">
                  TO BE
                </span>{' '}
                <br />
                REMEMBERED.
              </h2>

              {/* Narrative Copy */}
              <p className="font-body text-base sm:text-lg text-warm-cream/85 leading-relaxed mb-6 max-w-xl font-light">
                Organized by <strong className="text-bright-gold font-semibold">{eventData.organizer.name}</strong>, Raas Utsav 2026 brings together the devotional majesty of Maa Durga, live orchestral Garba rhythms, renowned DJ performances, and traditional circular Dandiya fellowship in Ranchi.
              </p>

              {/* Key Attractions Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8 max-w-lg">
                {[
                  { title: 'Dandiya Nights', desc: 'Synchronized circular folk dance' },
                  { title: 'Live Music & DJ', desc: 'Non-stop Garba beats and dhol' },
                  { title: 'Authentic Food Court', desc: 'Royal Navratri delicacies' },
                  { title: 'Family Friendly', desc: 'Secure festive celebration for all' },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-3 rounded-xl bg-royal-maroon/60 border border-antique-gold/30"
                  >
                    <div className="flex items-center gap-1.5 text-bright-gold text-xs font-bold font-body uppercase">
                      <span>✦</span>
                      <span>{item.title}</span>
                    </div>
                    <span className="text-warm-cream/70 text-xs font-body mt-0.5 block">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Metadata Ribbon & VIP Action */}
            <div className="pt-6 border-t border-antique-gold/25 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-body">
                <div>
                  <span className="block text-[10px] text-bright-gold uppercase tracking-wider font-bold">
                    DATE
                  </span>
                  <span className="text-warm-cream font-bold text-sm sm:text-base">{eventData.dateDisplay}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-bright-gold uppercase tracking-wider font-bold">
                    TIMING
                  </span>
                  <span className="text-warm-cream font-bold text-sm sm:text-base">{eventData.timeDisplay}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="block text-[10px] text-bright-gold uppercase tracking-wider font-bold">
                    VENUE
                  </span>
                  <span className="text-warm-cream font-bold text-sm sm:text-base truncate block">{eventData.venueDisplay}</span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-bright-gold text-deep-plum font-display text-base tracking-wider uppercase shadow-[0_4px_24px_rgba(217,37,36,0.4)] hover:shadow-[0_6px_32px_rgba(243,198,76,0.6)] hover:scale-105 transition-[transform,box-shadow] duration-200 font-black"
                >
                  <span>BOOK YOUR PASS</span>
                  <ArrowRight className="w-4 h-4 text-deep-plum stroke-[2.5]" />
                </Link>

                <div className="text-xs font-body text-warm-cream/70">
                  <span>Passes starting from </span>
                  <span className="text-bright-gold font-bold">{eventData.passes[0]?.priceDisplay || '₹999'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

