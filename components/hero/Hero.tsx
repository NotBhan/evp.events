'use client';

import React, { useEffect, useRef } from 'react';
import HeroTitle from './HeroTitle';
import HeroCTA from './HeroCTA';
import HeroDancer from './HeroDancer';
import DurgaAura from '../decorations/DurgaAura';
import HangingDiya from '../decorations/HangingDiya';
import ToranGarland from '../decorations/ToranGarland';
import OrnamentalPillar from '../decorations/OrnamentalPillar';
import CornerMedallion from '../decorations/CornerMedallion';
import InnerPosterCard from '../decorations/InnerPosterCard';
import DandiyaSticks from '../decorations/DandiyaSticks';
import BackgroundPattern from '../decorations/BackgroundPattern';
import { initHeroScrollAnimation } from './heroAnimations';

export default function Hero() {
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const heroStageRef = useRef<HTMLDivElement>(null);
  const leftDancerRef = useRef<HTMLDivElement>(null);
  const rightDancerRef = useRef<HTMLDivElement>(null);
  const durgaAuraRef = useRef<HTMLDivElement>(null);
  const leftDiyaRef = useRef<HTMLDivElement>(null);
  const rightDiyaRef = useRef<HTMLDivElement>(null);
  const leftPillarRef = useRef<HTMLDivElement>(null);
  const rightPillarRef = useRef<HTMLDivElement>(null);
  const topFrameRef = useRef<HTMLDivElement>(null);
  const cornerMedallionTLRef = useRef<HTMLDivElement>(null);
  const cornerMedallionTRRef = useRef<HTMLDivElement>(null);
  const foregroundStickLeftRef = useRef<HTMLDivElement>(null);
  const foregroundStickRightRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLDivElement>(null);
  const heroCTARef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !heroContainerRef.current ||
      !heroStageRef.current ||
      !leftDancerRef.current ||
      !rightDancerRef.current ||
      !durgaAuraRef.current ||
      !heroTitleRef.current ||
      !heroCTARef.current
    ) {
      return;
    }

    const cleanup = initHeroScrollAnimation({
      heroContainer: heroContainerRef.current,
      heroStage: heroStageRef.current,
      leftDancer: leftDancerRef.current,
      rightDancer: rightDancerRef.current,
      durgaAura: durgaAuraRef.current,
      leftDiya: leftDiyaRef.current,
      rightDiya: rightDiyaRef.current,
      leftPillar: leftPillarRef.current,
      rightPillar: rightPillarRef.current,
      topFrame: topFrameRef.current,
      cornerMedallions: [cornerMedallionTLRef.current, cornerMedallionTRRef.current],
      foregroundSticks: [foregroundStickLeftRef.current, foregroundStickRightRef.current],
      heroTitle: heroTitleRef.current,
      heroCTA: heroCTARef.current,
    });

    return cleanup;
  }, []);

  return (
    <section
      ref={heroContainerRef}
      id="hero"
      className="relative w-full hero-wrapper-sticky bg-deep-plum text-warm-cream"
      aria-label="Hero Section - Raas Utsav 2026"
    >
      {/* 100svh CSS-Sticky Stage (Zero pin-spacer, zero layout jumps) */}
      <div
        ref={heroStageRef}
        className="hero-stage-sticky flex flex-col justify-between pt-16 md:pt-18 lg:pt-20 pb-4 sm:pb-6 px-3 sm:px-6"
      >
        {/* ============================================================== */}
        {/* Layer 1: Subtle Background Lattice Pattern                     */}
        {/* ============================================================== */}
        <BackgroundPattern opacity={0.04} />

        {/* ============================================================== */}
        {/* Layer 2: Deep Radial Atmosphere & Devotional Maroon Aura       */}
        {/* ============================================================== */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 70% at 50% 42%, rgba(34, 13, 26, 0.92) 0%, rgba(18, 8, 13, 0.98) 72%, #12080D 100%)',
          }}
          aria-hidden="true"
        />

        {/* ============================================================== */}
        {/* Layer 3: Inner Gold Keyline Poster Frame                       */}
        {/* ============================================================== */}
        <InnerPosterCard />

        {/* ============================================================== */}
        {/* Layer 4: Grand Durga Devotional Centerpiece & Rotating Halo    */}
        {/* Scaled to ~410-430px on desktop (45-50% usable canvas), framing above title */}
        {/* ============================================================== */}
        <div
          ref={durgaAuraRef}
          className="absolute top-[28%] sm:top-[29%] md:top-[30%] lg:top-[31%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
          aria-hidden="true"
        >
          <DurgaAura
            size={420}
            className="w-[70vw] max-w-[260px] sm:max-w-[320px] md:max-w-[370px] lg:max-w-[410px] xl:max-w-[430px] h-[70vw] max-h-[260px] sm:max-h-[320px] md:max-h-[370px] lg:max-h-[410px] xl:max-h-[430px]"
          />
        </div>

        {/* ============================================================== */}
        {/* Layer 5: Corner Medallions (Top-Left & Top-Right Brackets)     */}
        {/* Positioned below solid masthead                                */}
        {/* ============================================================== */}
        <div
          ref={cornerMedallionTLRef}
          className="absolute top-16 md:top-18 lg:top-20 left-0 z-25 hidden sm:block pointer-events-none"
        >
          <CornerMedallion position="top-left" size={180} />
        </div>
        <div
          ref={cornerMedallionTRRef}
          className="absolute top-16 md:top-18 lg:top-20 right-0 z-25 hidden sm:block pointer-events-none"
        >
          <CornerMedallion position="top-right" size={180} />
        </div>

        {/* ============================================================== */}
        {/* Layer 6: Stacked Top Toran Garland Frame (Architectural Proscenium) */}
        {/* ============================================================== */}
        <div ref={topFrameRef} className="relative z-30 w-full">
          <ToranGarland />
        </div>

        {/* ============================================================== */}
        {/* Layer 7: Authentic Hanging Brass Diyas (Asymmetric Sway)       */}
        {/* Fastened cleanly beneath masthead bottom rule                 */}
        {/* ============================================================== */}
        <div
          ref={leftDiyaRef}
          className="absolute top-16 md:top-18 lg:top-20 left-4 sm:left-12 md:left-24 z-25 pointer-events-none"
        >
          <HangingDiya side="left" size={60} className="w-[44px] sm:w-[56px] md:w-[68px]" />
        </div>
        <div
          ref={rightDiyaRef}
          className="absolute top-16 md:top-18 lg:top-20 right-4 sm:right-12 md:right-24 z-25 pointer-events-none"
        >
          <HangingDiya side="right" size={56} className="w-[40px] sm:w-[52px] md:w-[64px]" />
        </div>

        {/* ============================================================== */}
        {/* Layer 8: Ornamental Side Pillars (Border Framing Panels)       */}
        {/* ============================================================== */}
        <div
          ref={leftPillarRef}
          className="absolute left-0 bottom-0 top-16 md:top-18 lg:top-20 z-25 hidden md:flex items-end pointer-events-none pl-1 lg:pl-3"
        >
          <OrnamentalPillar placement="left" />
        </div>
        <div
          ref={rightPillarRef}
          className="absolute right-0 bottom-0 top-16 md:top-18 lg:top-20 z-25 hidden md:flex items-end pointer-events-none pr-1 lg:pr-3"
        >
          <OrnamentalPillar placement="right" />
        </div>

        {/* ============================================================== */}
        {/* Layer 9: Central Campaign Typography & Action Badges           */}
        {/* Positioned with top clearance to let Durga face be 100% visible */}
        {/* ============================================================== */}
        <div className="relative z-30 my-auto flex flex-col items-center justify-center pt-8 sm:pt-12 md:pt-14 lg:pt-16">
          <div ref={heroTitleRef}>
            <HeroTitle />
          </div>
          <div ref={heroCTARef} className="mt-4 sm:mt-5 md:mt-6">
            <HeroCTA />
          </div>
        </div>

        {/* ============================================================== */}
        {/* Layer 10: Dandiya Performers in Client Attire (Left & Right)   */}
        {/* Form dynamic visual triangle with central Durga & Title        */}
        {/* Positioned at z-20 to cleanly frame the typography from behind */}
        {/* ============================================================== */}
        {/* Left Dancer: Female Garba Performer (Twirling, reaching inward) */}
        <div
          ref={leftDancerRef}
          className="absolute -left-8 sm:-left-4 md:left-2 lg:left-8 xl:left-12 -bottom-2 sm:bottom-0 z-20 pointer-events-none w-[190px] sm:w-[270px] md:w-[360px] lg:w-[440px] xl:w-[490px]"
        >
          <HeroDancer placement="left" alt="Garba Performer Dancing with Dandiya" />
        </div>

        {/* Right Dancer: Male Dandiya Performer (Leaping, striking inward) */}
        <div
          ref={rightDancerRef}
          className="absolute -right-8 sm:-right-4 md:right-2 lg:right-8 xl:right-12 -bottom-2 sm:bottom-0 z-20 pointer-events-none w-[190px] sm:w-[270px] md:w-[360px] lg:w-[440px] xl:w-[490px]"
        >
          <HeroDancer placement="right" alt="Dandiya Raas Performer Striking Sticks" />
        </div>

        {/* ============================================================== */}
        {/* Layer 11: Foreground Dandiya Sticks Accents                    */}
        {/* ============================================================== */}
        <div
          ref={foregroundStickLeftRef}
          className="absolute -bottom-8 -left-8 z-20 hidden xl:block pointer-events-none opacity-60"
        >
          <DandiyaSticks size={200} className="rotate-12" />
        </div>
        <div
          ref={foregroundStickRightRef}
          className="absolute -bottom-8 -right-8 z-20 hidden xl:block pointer-events-none opacity-60"
        >
          <DandiyaSticks size={200} className="-rotate-12 scale-x-[-1]" />
        </div>

        {/* Bottom Stage Depth Shadow / Transition Vignette */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-deep-plum via-deep-plum/80 to-transparent z-40 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
