'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Music, Disc, Utensils, Heart, Flame } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function ExperienceMosaic() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const mosaicFrameRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLElement>(null);
  const card2Ref = useRef<HTMLElement>(null);
  const card3Ref = useRef<HTMLElement>(null);
  const card4Ref = useRef<HTMLElement>(null);
  const card5Ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const mm = gsap.matchMedia();

    // 1. Reduced Motion Preference
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(
        [
          headerRef.current,
          mosaicFrameRef.current,
          card1Ref.current,
          card2Ref.current,
          card3Ref.current,
          card4Ref.current,
          card5Ref.current,
        ],
        { opacity: 1, clearProps: 'all' }
      );
    });

    // 2. Full Motion Pass: Unified Composition Reveal
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Set initial states
      if (headerRef.current) {
        gsap.set(headerRef.current, { opacity: 0, y: 20 });
      }
      if (mosaicFrameRef.current) {
        gsap.set(mosaicFrameRef.current, { opacity: 0, scale: 0.98 });
      }

      if (card1Ref.current) gsap.set(card1Ref.current, { opacity: 0, y: 20 });
      if (card2Ref.current) gsap.set(card2Ref.current, { opacity: 0, y: 26 });
      if (card3Ref.current) gsap.set(card3Ref.current, { opacity: 0, y: 22 });
      if (card4Ref.current) gsap.set(card4Ref.current, { opacity: 0, y: 26 });
      if (card5Ref.current) gsap.set(card5Ref.current, { opacity: 0, y: 22 });

      const indices = sectionRef.current?.querySelectorAll('.card-index');
      if (indices && indices.length) {
        gsap.set(indices, { opacity: 0, y: -6 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 88%',
          end: 'top 20%',
          toggleActions: 'play none none none',
        },
      });

      // Header reveals
      if (headerRef.current) {
        tl.to(headerRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0);
      }

      // Framing container reveals
      if (mosaicFrameRef.current) {
        tl.to(mosaicFrameRef.current, { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }, 0.04);
      }

      // Feature Panel 01 establishes composition anchor
      if (card1Ref.current) {
        tl.to(
          card1Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            ease: 'power3.out',
          },
          0.08
        );
      }

      // Panel 02 arrives
      if (card2Ref.current) {
        tl.to(
          card2Ref.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            ease: 'power3.out',
          },
          0.12
        );
      }

      // Base Trio (03, 04, 05) arrive together as a foundation
      const bottomCards = [card3Ref.current, card4Ref.current, card5Ref.current].filter(Boolean) as HTMLElement[];
      if (bottomCards.length) {
        tl.to(
          bottomCards,
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.06,
            ease: 'power2.out',
          },
          0.16
        );
      }

      // Internal numerals animate into place
      if (indices && indices.length) {
        tl.to(
          indices,
          {
            opacity: 0.85,
            y: 0,
            duration: 0.35,
            stagger: 0.04,
            ease: 'power1.out',
          },
          0.2
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
      id="mosaic"
      className="relative z-20 bg-deep-plum py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 border-t border-antique-gold/20"
      aria-label="Planned Festival Attractions & Dimensions"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 text-bright-gold text-xs sm:text-sm font-body tracking-[0.12em] uppercase font-bold">
              <span className="text-vermilion">♦</span>
              <span>02 / PLANNED ATTRACTIONS & EXPERIENCES</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white font-bold tracking-tight uppercase">
              CURATED <span className="text-bright-gold drop-shadow-[0_2px_18px_rgba(243,198,76,0.35)]">FESTIVAL</span>{' '}
              DIMENSIONS
            </h2>
          </div>
          <p className="font-body text-sm sm:text-base text-warm-cream/80 max-w-md">
            Indicative highlights and planned attractions designed to create an immersive, devotional, and high-energy festival atmosphere.
          </p>
        </div>

        {/* ONE UNIFIED FESTIVAL COMPOSITION: Shared Architectural Frame */}
        <div
          ref={mosaicFrameRef}
          className="relative p-3 sm:p-4 rounded-3xl bg-gradient-to-br from-royal-maroon/30 via-deep-plum/80 to-royal-maroon/20 border-2 border-antique-gold/40 shadow-[0_24px_70px_rgba(0,0,0,0.7)]"
        >
          {/* Ornamental Outer Corner Brackets */}
          <span className="absolute top-2 left-2 text-bright-gold text-xs pointer-events-none select-none">♦</span>
          <span className="absolute top-2 right-2 text-bright-gold text-xs pointer-events-none select-none">♦</span>
          <span className="absolute bottom-2 left-2 text-bright-gold text-xs pointer-events-none select-none">♦</span>
          <span className="absolute bottom-2 right-2 text-bright-gold text-xs pointer-events-none select-none">♦</span>

          {/* Unified Mosaic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
            {/* ============================================================== */}
            {/* PANEL 01: HERITAGE ROYAL DÉCOR (Grand Dominant Anchor, Col 7)   */}
            {/* ============================================================== */}
            <article
              ref={card1Ref}
              className="md:col-span-7 relative rounded-2xl bg-gradient-to-br from-royal-maroon/80 via-card-surface to-royal-maroon/50 border border-antique-gold/50 p-7 sm:p-10 flex flex-col justify-between overflow-hidden group hover:border-bright-gold transition-[border-color,box-shadow] duration-200 shadow-xl min-h-[360px] sm:min-h-[420px]"
            >
              {/* Grand Numeral Watermark in Background */}
              <span className="card-index absolute -bottom-6 right-2 font-display text-[11rem] sm:text-[14rem] text-antique-gold/10 leading-none select-none pointer-events-none font-black">
                01
              </span>

              {/* Ambient Radial Lighting Accent */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-vermilion/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-deep-plum/90 border border-antique-gold/60 text-bright-gold text-xs font-body font-bold uppercase tracking-wider shadow-sm">
                    <Flame className="w-3.5 h-3.5 text-vermilion" />
                    <span>GRAND ANCHOR ATTRACTION</span>
                  </div>
                  <span className="font-display text-4xl sm:text-5xl text-bright-gold/90 font-bold">
                    01
                  </span>
                </div>

                <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl text-warm-cream tracking-tight uppercase mb-4 leading-[1.05] font-black">
                  HERITAGE ROYAL DÉCOR & AMBIENCE
                </h3>
                <p className="font-body text-base sm:text-lg text-warm-cream/90 leading-relaxed max-w-xl font-light">
                  Open-air heritage lawns accented with traditional glowing brass diyas, authentic floral torans, and royal atmospheric lighting honoring the vintage elegance of BNR Chanakya.
                </p>
              </div>

              <div className="relative z-10 pt-6 mt-6 border-t border-antique-gold/30 flex flex-wrap gap-2 text-xs font-body text-warm-cream/90 font-medium">
                <span className="px-3 py-1.5 rounded-lg bg-deep-plum/90 border border-antique-gold/40">✦ Glowing Hanging Diyas</span>
                <span className="px-3 py-1.5 rounded-lg bg-deep-plum/90 border border-antique-gold/40">✦ Royal Jharokha Accents</span>
                <span className="px-3 py-1.5 rounded-lg bg-deep-plum/90 border border-antique-gold/40">✦ Starlit Festival Lawn</span>
              </div>
            </article>

            {/* ============================================================== */}
            {/* PANEL 02: TRADITIONAL & FUSION BEATS (Col 5)                    */}
            {/* ============================================================== */}
            <article
              ref={card2Ref}
              className="md:col-span-5 relative rounded-2xl bg-card-surface/95 border border-antique-gold/40 p-7 sm:p-9 flex flex-col justify-between overflow-hidden group hover:border-bright-gold transition-[border-color,box-shadow] duration-200 shadow-xl min-h-[360px] sm:min-h-[420px]"
            >
              {/* Background Numeral Watermark */}
              <span className="card-index absolute -bottom-6 right-2 font-display text-[9rem] sm:text-[11rem] text-antique-gold/10 leading-none select-none pointer-events-none font-black">
                02
              </span>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deep-plum border border-vermilion/60 text-vermilion text-xs font-body font-bold uppercase tracking-wider">
                    <Music className="w-3.5 h-3.5 text-vermilion" />
                    <span>PLANNED ATTRACTION · 02</span>
                  </div>
                  <span className="font-display text-3xl sm:text-4xl text-bright-gold/85 font-bold">
                    02
                  </span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl text-warm-cream tracking-tight uppercase mb-3 leading-tight font-black">
                  TRADITIONAL & FUSION BEATS
                </h3>
                <p className="font-body text-sm sm:text-base text-warm-cream/80 leading-relaxed font-light">
                  Pulsating master folk percussion, energetic Dhol ensembles, and high-tempo festive rhythms powering nonstop Garba swirls across the lawns.
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-antique-gold/25 flex flex-wrap gap-2 text-xs font-body text-warm-cream/85">
                <span className="px-2.5 py-1 rounded-md bg-royal-maroon/70 border border-antique-gold/30">✦ Master Dhol Ensembles</span>
                <span className="px-2.5 py-1 rounded-md bg-royal-maroon/70 border border-antique-gold/30">✦ High-Energy Folk Rhythms</span>
              </div>
            </article>

            {/* ============================================================== */}
            {/* PANEL 03: DANDIYA & RAAS EXPERIENCE (Col 4)                     */}
            {/* ============================================================== */}
            <article
              ref={card3Ref}
              className="md:col-span-4 relative rounded-2xl bg-card-surface/90 border border-antique-gold/35 p-6 sm:p-7 flex flex-col justify-between overflow-hidden group hover:border-bright-gold transition-[border-color,box-shadow] duration-200 shadow-md min-h-[290px]"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-deep-plum border border-bright-gold/50 text-bright-gold text-[11px] font-body uppercase tracking-wider font-semibold">
                    <Disc className="w-3 h-3 text-bright-gold" />
                    <span>PLANNED · 03</span>
                  </div>
                  <span className="font-display text-2xl sm:text-3xl text-bright-gold/75 font-bold">
                    03
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl text-warm-cream tracking-wide uppercase mb-2 font-bold">
                  DANDIYA / RAAS EXPERIENCE
                </h3>
                <p className="font-body text-xs sm:text-sm text-warm-cream/75 leading-relaxed font-light">
                  Concentric Garba circles and synchronized Dandiya strikes welcoming families, beginners, and seasoned dancers in unity.
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-antique-gold/20 text-xs font-body text-bright-gold flex items-center gap-1.5">
                <span className="text-vermilion text-xs">♦</span>
                <span>Concentric Circular Arenas</span>
              </div>
            </article>

            {/* ============================================================== */}
            {/* PANEL 04: PLANNED ENTERTAINMENT (Col 4)                          */}
            {/* ============================================================== */}
            <article
              ref={card4Ref}
              className="md:col-span-4 relative rounded-2xl bg-card-surface/90 border border-antique-gold/35 p-6 sm:p-7 flex flex-col justify-between overflow-hidden group hover:border-bright-gold transition-[border-color,box-shadow] duration-200 shadow-md min-h-[290px]"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-deep-plum border border-vermilion/50 text-vermilion text-[11px] font-body uppercase tracking-wider font-semibold">
                    <Heart className="w-3 h-3 text-vermilion" />
                    <span>PLANNED · 04</span>
                  </div>
                  <span className="font-display text-2xl sm:text-3xl text-bright-gold/75 font-bold">
                    04
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl text-warm-cream tracking-wide uppercase mb-2 font-bold">
                  PLANNED ENTERTAINMENT
                </h3>
                <p className="font-body text-xs sm:text-sm text-warm-cream/75 leading-relaxed font-light">
                  Theatrical stage lighting, celebratory community interactions, and festive energy planned to keep the celebration alive till late evening.
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-antique-gold/20 text-xs font-body text-bright-gold flex items-center gap-1.5">
                <span className="text-vermilion text-xs">✦</span>
                <span>Multi-Generational Celebration</span>
              </div>
            </article>

            {/* ============================================================== */}
            {/* PANEL 05: FOOD & FESTIVE REFRESHMENTS (Col 4)                   */}
            {/* ============================================================== */}
            <article
              ref={card5Ref}
              className="md:col-span-4 relative rounded-2xl bg-card-surface/90 border border-antique-gold/35 p-6 sm:p-7 flex flex-col justify-between overflow-hidden group hover:border-bright-gold transition-[border-color,box-shadow] duration-200 shadow-md min-h-[290px]"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-deep-plum border border-amber-glow/60 text-amber-glow text-[11px] font-body uppercase tracking-wider font-semibold">
                    <Utensils className="w-3 h-3 text-amber-glow" />
                    <span>PLANNED · 05</span>
                  </div>
                  <span className="font-display text-2xl sm:text-3xl text-bright-gold/75 font-bold">
                    05
                  </span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl text-warm-cream tracking-wide uppercase mb-2 font-bold">
                  FOOD & FESTIVE REFRESHMENTS
                </h3>
                <p className="font-body text-xs sm:text-sm text-warm-cream/75 leading-relaxed font-light">
                  Curated festive food zone featuring traditional regional snacks, hot tea, and cooling beverages in comfortable lawn seating.
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-antique-gold/20 text-xs font-body text-bright-gold flex items-center gap-1.5">
                <span className="text-bright-gold text-xs">♦</span>
                <span>Festive Courtyard Flavours</span>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
