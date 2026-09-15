'use client';

import React from 'react';
import Image from 'next/image';
import type { BookingDeskStage } from './BookingDesk';

export type BookingVisualStage =
  | 'selectPass'
  | 'attendee'
  | 'review'
  | 'payment'
  | 'receipt';

/**
 * Pure, deterministic mapping from canonical booking stage to visual stage key.
 * Strictly guarantees that non-stage state changes (quantity, form inputs, validation,
 * re-renders, remounts) CANNOT alter the active dancer visual.
 */
export function getBookingVisualStage(
  deskStage: BookingDeskStage,
  currentStep: 1 | 2 | 3
): BookingVisualStage {
  if (deskStage === 'SUCCESS') {
    return 'receipt';
  }
  if (
    deskStage === 'PAYMENT' ||
    deskStage === 'CONFIRMING' ||
    deskStage === 'PAYMENT_PENDING' ||
    deskStage === 'PAYMENT_FAILED'
  ) {
    return 'payment';
  }
  // deskStage === 'RESERVE'
  switch (currentStep) {
    case 1:
      return 'selectPass';
    case 2:
      return 'attendee';
    case 3:
      return 'review';
    default:
      return 'selectPass';
  }
}

export interface DancerConfig {
  id: string;
  /** Full-resolution PNG (RGBA transparent) */
  src: string;
  /** Full WebP */
  webpSrc: string;
  /** Medium WebP (≈700px tall) */
  webpMd: string;
  /** Small WebP (≈400px tall) */
  webpSm: string;
  /** Medium PNG fallback */
  pngMd: string;
  /** Small PNG fallback */
  pngSm: string;
  alt: string;
  width: number;
  height: number;
  positionClass: string;
  sizeStyle: React.CSSProperties;
  auraGradient: string;
}

// ─── Real Raas Utsav 2026 poster-extracted dancers ──────────────────────────

/** MALE dancer — Dandiya pose, left flank */
const DANCER_MALE: DancerConfig = {
  id: 'dancer-male',
  src: '/images/dancers/dancer-male.png',
  webpSrc: '/images/dancers/dancer-male.webp',
  webpMd: '/images/dancers/dancer-male-md.webp',
  webpSm: '/images/dancers/dancer-male-sm.webp',
  pngMd: '/images/dancers/dancer-male-md.png',
  pngSm: '/images/dancers/dancer-male-sm.png',
  alt: 'Male Dandiya dancer in colorful traditional Gujarati attire',
  width: 346,
  height: 991,
  positionClass:
    'left-[-20px] sm:left-[-10px] md:left-[-40px] lg:left-[-60px] xl:left-[-80px] bottom-0 origin-bottom-left',
  sizeStyle: { maxWidth: '360px', width: '32vw' },
  auraGradient:
    'radial-gradient(ellipse at 45% 65%, rgba(217, 175, 55, 0.30) 0%, rgba(217, 37, 36, 0.14) 50%, transparent 75%)',
};

/** FEMALE dancer — swirling lehenga, right flank */
const DANCER_FEMALE: DancerConfig = {
  id: 'dancer-female',
  src: '/images/dancers/dancer-female.png',
  webpSrc: '/images/dancers/dancer-female.webp',
  webpMd: '/images/dancers/dancer-female-md.webp',
  webpSm: '/images/dancers/dancer-female-sm.webp',
  pngMd: '/images/dancers/dancer-female-md.png',
  pngSm: '/images/dancers/dancer-female-sm.png',
  alt: 'Female Dandiya dancer in vibrant Gujarati lehenga with swirling skirt',
  width: 426,
  height: 888,
  positionClass:
    'right-[-20px] sm:right-[-10px] md:right-[-40px] lg:right-[-60px] xl:right-[-80px] bottom-0 origin-bottom-right',
  sizeStyle: { maxWidth: '420px', width: '38vw' },
  auraGradient:
    'radial-gradient(ellipse at 55% 65%, rgba(220, 20, 120, 0.28) 0%, rgba(255, 127, 0, 0.14) 50%, transparent 75%)',
};

/** COMPOSITE — both dancers together, centered for review step */
const DANCER_COMPOSITE: DancerConfig = {
  id: 'dancer-composite',
  src: '/images/dancers/dancer-composite.png',
  webpSrc: '/images/dancers/dancer-composite.webp',
  webpMd: '/images/dancers/dancer-composite-md.webp',
  webpSm: '/images/dancers/dancer-composite-md.webp', // reuse md for small
  pngMd: '/images/dancers/dancer-composite-md.png',
  pngSm: '/images/dancers/dancer-composite-md.png',
  alt: 'Male and female Dandiya dancers together in festive Gujarati attire',
  width: 668,
  height: 1000,
  positionClass: 'left-1/2 -translate-x-1/2 bottom-0 origin-bottom',
  sizeStyle: { maxWidth: '620px', width: '65vw' },
  auraGradient:
    'radial-gradient(ellipse at 50% 75%, rgba(217, 175, 55, 0.22) 0%, rgba(217, 37, 36, 0.12) 55%, transparent 80%)',
};

// ─── Stage → Dancer mapping ──────────────────────────────────────────────────
/**
 * 1. selectPass  → Male dancer (left)
 * 2. attendee    → Female dancer (right)
 * 3. review      → BOTH dancers simultaneously (left + right), mirrors poster layout
 * 4. payment     → Male dancer (left)
 * 5. receipt     → Female dancer (right) — subtle grayscale watermark
 */
export const STAGE_CONFIGS: Record<
  BookingVisualStage,
  {
    /** Primary dancer to show. For 'review' this is ignored — both are shown. */
    dancer: DancerConfig;
    /** If set, show this dancer simultaneously alongside the primary. */
    secondDancer?: DancerConfig;
    opacityClass: string;
    scaleClass: string;
    isSubtleWatermark?: boolean;
  }
> = {
  selectPass: {
    dancer: DANCER_MALE,
    opacityClass: 'opacity-30 sm:opacity-45 md:opacity-70 lg:opacity-90',
    scaleClass: 'scale-90 sm:scale-95 md:scale-100',
  },
  attendee: {
    dancer: DANCER_FEMALE,
    opacityClass: 'opacity-30 sm:opacity-45 md:opacity-70 lg:opacity-90',
    scaleClass: 'scale-90 sm:scale-95 md:scale-100',
  },
  review: {
    dancer: DANCER_MALE,
    secondDancer: DANCER_FEMALE,
    opacityClass: 'opacity-25 sm:opacity-38 md:opacity-62 lg:opacity-82',
    scaleClass: 'scale-90 sm:scale-95 md:scale-100',
  },
  payment: {
    dancer: DANCER_MALE,
    opacityClass: 'opacity-28 sm:opacity-40 md:opacity-65 lg:opacity-85',
    scaleClass: 'scale-90 sm:scale-95 md:scale-100',
  },
  receipt: {
    dancer: DANCER_FEMALE,
    opacityClass:
      'print:hidden opacity-12 sm:opacity-18 md:opacity-28 mix-blend-luminosity grayscale contrast-125',
    scaleClass: 'scale-85 sm:scale-90 md:scale-95',
    isSubtleWatermark: true,
  },
};

interface BookingDancerAtmosphereProps {
  visualStage: BookingVisualStage;
}

/**
 * BookingDancerAtmosphere renders the fixed, state-driven dancer artwork behind the booking UI.
 *
 * Architectural Invariants:
 * 1. Preloads all assets so switching steps is instant with ZERO network lag or layout shift.
 * 2. Pure CSS crossfades (opacity + transform) with prefers-reduced-motion safety.
 * 3. pointer-events-none ensures zero interaction interference with form elements.
 * 4. Strictly deterministic: derived directly from (deskStage, currentStep).
 * 5. print:hidden ensures zero interference with receipt printing and PDF downloads.
 * 6. Uses real Raas Utsav 2026 poster-extracted dancers (not generated placeholders).
 */
export default function BookingDancerAtmosphere({
  visualStage,
}: BookingDancerAtmosphereProps) {
  const activeConfig = STAGE_CONFIGS[visualStage];
  const activeDancerId = activeConfig.dancer.id;

  return (
    <div
      id="booking-dancer-atmosphere"
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 print:hidden"
      aria-hidden="true"
    >
      {/* Male dancer — left flank */}
      <DancerLayer
        dancer={DANCER_MALE}
        isActive={activeDancerId === DANCER_MALE.id || activeConfig.secondDancer?.id === DANCER_MALE.id}
        stageConfig={activeConfig}
      />

      {/* Female dancer — right flank */}
      <DancerLayer
        dancer={DANCER_FEMALE}
        isActive={activeDancerId === DANCER_FEMALE.id || activeConfig.secondDancer?.id === DANCER_FEMALE.id}
        stageConfig={activeConfig}
      />
    </div>
  );
}

interface DancerLayerProps {
  dancer: DancerConfig;
  isActive: boolean;
  stageConfig: (typeof STAGE_CONFIGS)[BookingVisualStage];
}

function DancerLayer({ dancer, isActive, stageConfig }: DancerLayerProps) {
  return (
    <div
      data-dancer-id={dancer.id}
      data-active={isActive ? 'true' : 'false'}
      className={`absolute ${dancer.positionClass} transition-all duration-500 ease-out will-change-[opacity,transform] motion-reduce:transition-opacity motion-reduce:duration-200 ${
        isActive
          ? `${stageConfig.opacityClass} ${stageConfig.scaleClass} translate-y-0 visible`
          : 'opacity-0 translate-y-3 pointer-events-none invisible scale-95'
      }`}
      style={dancer.sizeStyle}
    >
      {/* Soft ambient festive halo behind dancer */}
      <div
        className="absolute inset-x-8 bottom-0 top-1/4 rounded-full pointer-events-none -z-10 blur-xl opacity-55"
        style={{ background: dancer.auraGradient }}
      />

      {/* Responsive picture with optimized WebP srcSet + PNG fallback */}
      <picture>
        <source
          type="image/webp"
          srcSet={`${dancer.webpSm} 400w, ${dancer.webpMd} 700w, ${dancer.webpSrc} 1200w`}
          sizes={
            dancer.id === 'dancer-composite'
              ? '(max-width: 640px) 80vw, (max-width: 1024px) 70vw, 860px'
              : '(max-width: 640px) 40vw, (max-width: 1024px) 36vw, 460px'
          }
        />
        <Image
          src={dancer.src}
          alt={dancer.alt}
          width={dancer.width}
          height={dancer.height}
          priority
          sizes={
            dancer.id === 'dancer-composite'
              ? '(max-width: 640px) 80vw, (max-width: 1024px) 70vw, 860px'
              : '(max-width: 640px) 40vw, (max-width: 1024px) 36vw, 460px'
          }
          className="w-full h-auto object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.80)]"
        />
      </picture>
    </div>
  );
}
