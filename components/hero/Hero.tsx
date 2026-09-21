import React from 'react';
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
import HeroScrollAnimation from './HeroScrollAnimation';

/**
 * Hero - Pure React Server Component (RSC)
 *
 * Implements zero-client-overhead server rendering for the entire above-the-fold hero.
 * All static visual structures (backgrounds, Durga artwork, framing keylines,
 * typography, and critical LCP dancers) are paintable immediately from SSR HTML
 * with zero hydration blocking.
 *
 * Interactive GSAP scroll orchestration is isolated into the HeroScrollAnimation leaf island.
 */
export default function Hero() {
  return (
    <section
      id="hero"
      className="relative w-full hero-wrapper-sticky bg-deep-plum text-warm-cream"
      aria-label="Hero Section - Raas Utsav 2026"
    >
      {/* 100svh CSS-Sticky Stage (Zero pin-spacer, zero layout jumps) */}
      <div
        id="hero-stage"
        className="hero-stage-sticky flex flex-col justify-between pt-16 md:pt-[72px] lg:pt-20 pb-4 sm:pb-6 px-3 sm:px-6"
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
          id="hero-durga-aura"
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
          id="hero-corner-tl"
          className="absolute top-16 md:top-[72px] lg:top-20 left-0 z-25 hidden sm:block pointer-events-none"
        >
          <CornerMedallion position="top-left" size={180} />
        </div>
        <div
          id="hero-corner-tr"
          className="absolute top-16 md:top-[72px] lg:top-20 right-0 z-25 hidden sm:block pointer-events-none"
        >
          <CornerMedallion position="top-right" size={180} />
        </div>

        {/* ============================================================== */}
        {/* Layer 6: Stacked Top Toran Garland Frame (Architectural Proscenium) */}
        {/* ============================================================== */}
        <div id="hero-top-frame" className="relative z-30 w-full">
          <ToranGarland />
        </div>

        {/* ============================================================== */}
        {/* Layer 7: Authentic Hanging Brass Diyas (Asymmetric Sway)       */}
        {/* Fastened cleanly beneath masthead bottom rule                 */}
        {/* ============================================================== */}
        <div
          id="hero-left-diya"
          className="absolute top-16 md:top-[72px] lg:top-20 left-4 sm:left-12 md:left-24 z-25 pointer-events-none"
        >
          <HangingDiya side="left" size={60} className="w-[44px] sm:w-[56px] md:w-[68px]" />
        </div>
        <div
          id="hero-right-diya"
          className="absolute top-16 md:top-[72px] lg:top-20 right-4 sm:right-12 md:right-24 z-25 pointer-events-none"
        >
          <HangingDiya side="right" size={56} className="w-[40px] sm:w-[52px] md:w-[64px]" />
        </div>

        {/* ============================================================== */}
        {/* Layer 8: Ornamental Side Pillars (Border Framing Panels)       */}
        {/* ============================================================== */}
        <div
          id="hero-left-pillar"
          className="absolute left-0 bottom-0 top-16 md:top-[72px] lg:top-20 z-25 hidden md:flex items-end pointer-events-none pl-1 lg:pl-3"
        >
          <OrnamentalPillar placement="left" />
        </div>
        <div
          id="hero-right-pillar"
          className="absolute right-0 bottom-0 top-16 md:top-[72px] lg:top-20 z-25 hidden md:flex items-end pointer-events-none pr-1 lg:pr-3"
        >
          <OrnamentalPillar placement="right" />
        </div>

        {/* ============================================================== */}
        {/* Layer 9: Central Campaign Typography & Action Badges           */}
        {/* Positioned with top clearance to let Durga face be 100% visible */}
        {/* ============================================================== */}
        <div className="relative z-30 my-auto flex flex-col items-center justify-center pt-8 sm:pt-12 md:pt-14 lg:pt-16">
          <div id="hero-title">
            <HeroTitle />
          </div>
          <div id="hero-cta" className="mt-4 sm:mt-5 md:mt-6">
            <HeroCTA />
          </div>
        </div>

        {/* ============================================================== */}
        {/* Layer 10: Dandiya Performers in Client Attire (Left & Right)   */}
        {/* Visual relationship matches client poster: Female Left, Male Right */}
        {/* Positioned at z-25 to sit above stage floor and frame title    */}
        {/* Left Dancer: Male Dandiya Performer (Holding sticks, dancing inward) */}
        <div
          id="hero-left-dancer"
          className="absolute left-4 sm:left-10 md:left-16 lg:left-24 xl:left-32 bottom-0 z-25 pointer-events-none w-[100px] sm:w-[135px] md:w-[180px] lg:w-[230px] xl:w-[275px]"
        >
          <HeroDancer
            src="/images/client/raascdr/web/dancer-male-new.webp"
            placement="left"
            alt="Male Dandiya Performer with Dandiya Sticks"
          />
        </div>

        {/* Right Dancer: Female Garba Performer (Swirling lehenga, dancing inward) */}
        <div
          id="hero-right-dancer"
          className="absolute right-4 sm:right-10 md:right-16 lg:right-24 xl:right-32 bottom-0 z-25 pointer-events-none w-[130px] sm:w-[175px] md:w-[230px] lg:w-[295px] xl:w-[350px]"
        >
          <HeroDancer
            src="/images/client/raascdr/web/dancer-female-new.webp"
            placement="right"
            alt="Female Garba Performer in Festive Lehenga"
          />
        </div>

        {/* ============================================================== */}
        {/* Layer 11: Foreground Dandiya Sticks Accents                    */}
        {/* ============================================================== */}
        <div
          id="hero-foreground-stick-left"
          className="absolute -bottom-8 -left-8 z-20 hidden xl:block pointer-events-none opacity-60"
        >
          <DandiyaSticks size={200} className="rotate-12" />
        </div>
        <div
          id="hero-foreground-stick-right"
          className="absolute -bottom-8 -right-8 z-20 hidden xl:block pointer-events-none opacity-60"
        >
          <DandiyaSticks size={200} className="-rotate-12 scale-x-[-1]" />
        </div>

        {/* Bottom Stage Depth Shadow / Transition Vignette (behind dancers at z-15) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-deep-plum via-deep-plum/80 to-transparent z-15 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Client Island: Attached post-paint for GSAP ScrollTrigger enhancement */}
      <HeroScrollAnimation />
    </section>
  );
}
