import React from 'react';
import { eventData } from '@/data/eventData';

/**
 * HeroTitle - Official Raas Utsav 2026 Client Campaign Title Lockup
 *
 * Implements the authoritative visual hierarchy:
 * 1. Semantic <h1> for SEO & screen reader accessibility
 * 2. Eyebrow: "EVENT POINT PRESENTS" (small, restrained)
 * 3. Primary Title: "RAAS UTSAV 2026" (dominant focal point, foreground)
 *    backed by a subtle static deep-plum atmospheric safe zone
 * 4. Subtitle: "JHARKHAND'S GRANDEST DANDIYA NIGHT" (secondary)
 * 5. Campaign Motto: "DANCE • DEVOTION • CELEBRATION" (tertiary)
 * 6. Metadata Ribbon: Date, Time, Venue (opaque surface, high contrast)
 */
export default function HeroTitle() {
  return (
    <div className="relative z-30 flex flex-col items-center text-center px-3 sm:px-4 max-w-5xl mx-auto select-none">
      {/* 1. Accessible Semantic Heading (SEO & Screen Readers) */}
      <h1 className="sr-only">
        {eventData.eventName} {eventData.year} — {eventData.edition}
      </h1>

      {/* 2. Eyebrow: EVENT POINT PRESENTS (small, restrained above the title) */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-2.5 max-w-full">
        <div className="h-[1px] w-6 sm:w-10 md:w-14 bg-gradient-to-r from-transparent via-antique-gold/80 to-antique-gold/80" />
        <span className="text-antique-gold text-[9px] sm:text-[11px]">✦</span>
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-0.5 rounded-full bg-deep-plum/95 border border-antique-gold/60 shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
          <span className="text-vermilion text-[8px] sm:text-[9px]">♦</span>
          <span className="font-avenir text-[9px] sm:text-xs tracking-[0.25em] text-warm-cream uppercase font-semibold">
            {eventData.organizer.name} PRESENTS
          </span>
          <span className="text-vermilion text-[8px] sm:text-[9px]">♦</span>
        </div>
        <span className="text-antique-gold text-[9px] sm:text-[11px]">✦</span>
        <div className="h-[1px] w-6 sm:w-10 md:w-14 bg-gradient-to-l from-transparent via-antique-gold/80 to-antique-gold/80" />
      </div>

      {/* 3. Primary Monumental Title: "RAAS UTSAV 2026"
          Dominant visual anchor, foreground layer resting over the Central Typographic Safe Zone. */}
      <div className="relative my-1 sm:my-1.5 max-w-full">
        {/* Central Typographic Safe Zone:
            Subtle static deep-plum atmospheric radial lighting underlay (no backdrop-filter, no blur).
            Dampens background Durga/mandala contrast directly behind text glyphs. */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] max-w-[960px] h-[170%] max-h-[360px] pointer-events-none -z-10 rounded-full"
          style={{
            background:
              'radial-gradient(ellipse 75% 60% at 50% 50%, rgba(18, 8, 13, 0.68) 0%, rgba(18, 8, 13, 0.45) 45%, rgba(18, 8, 13, 0) 80%)',
          }}
          aria-hidden="true"
        />

        <div
          className="flex flex-wrap items-baseline justify-center gap-x-2 sm:gap-x-3.5 md:gap-x-4 leading-[0.9] tracking-[0.04em] sm:tracking-[0.06em] uppercase font-display select-none opacity-100"
          style={{
            filter: 'drop-shadow(0 3px 12px rgba(0,0,0,0.95))',
          }}
        >
          <span className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] xl:text-[6.2rem] 2xl:text-[6.8rem] font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#FFF6CC] via-[#FADB5F] to-[#E5A823]">
            RAAS
          </span>
          <span className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] xl:text-[6.2rem] 2xl:text-[6.8rem] font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#FFF6CC] via-[#FADB5F] to-[#E5A823]">
            UTSAV
          </span>
          <span className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] xl:text-[6.2rem] 2xl:text-[6.8rem] font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#FFF8D6] via-[#F3C64C] to-[#E5A823]">
            2026
          </span>
        </div>
      </div>

      {/* 4. Subtitle: JHARKHAND'S GRANDEST DANDIYA NIGHT (secondary level, directly beneath title) */}
      <div className="flex flex-col items-center mt-2 sm:mt-2.5 mb-1.5 sm:mb-2">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="text-bright-gold text-[10px] sm:text-xs">✦</span>
          <h2 className="font-antiqua text-lg sm:text-2xl md:text-3xl text-bright-gold tracking-[0.08em] uppercase leading-tight font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            JHARKHAND&apos;S GRANDEST DANDIYA NIGHT
          </h2>
          <span className="text-bright-gold text-[10px] sm:text-xs">✦</span>
        </div>
      </div>

      {/* 5. Campaign Motto: DANCE • DEVOTION • CELEBRATION (tertiary level) */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 text-[10px] sm:text-xs md:text-sm text-warm-cream font-bangle tracking-[0.22em] uppercase font-semibold mb-3 sm:mb-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
        <span>DANCE</span>
        <span className="text-antique-gold/80">❖</span>
        <span>DEVOTION</span>
        <span className="text-antique-gold/80">❖</span>
        <span>CELEBRATION</span>
      </div>

      {/* 6. Standardized Date, Time, Venue Details Ribbon (opaque surface, zero blur, high contrast) */}
      <div className="inline-flex flex-wrap items-center justify-center gap-x-2.5 sm:gap-x-4 gap-y-1.5 text-[11px] sm:text-xs md:text-sm text-warm-cream font-lucida border border-antique-gold/60 py-1.5 sm:py-2 px-3.5 sm:px-6 bg-[#220D1A] rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.7)] mt-1.5 sm:mt-2">
        <span className="text-bright-gold font-bold tracking-wider flex items-center gap-1.5">
          <span className="text-vermilion text-[10px]">♦</span> {eventData.dateDisplay}
        </span>
        <span className="text-antique-gold/60 hidden sm:inline">|</span>
        <span className="font-medium tracking-wide flex items-center gap-1.5 text-warm-cream">
          <span className="text-vermilion text-[10px]">♦</span> {eventData.timeDisplay}
        </span>
        <span className="text-antique-gold/60 hidden sm:inline">|</span>
        <span className="text-warm-cream font-semibold tracking-wide flex items-center gap-1.5">
          <span className="text-vermilion text-[10px]">♦</span> {eventData.venueDisplay}
        </span>
      </div>
    </div>
  );
}
