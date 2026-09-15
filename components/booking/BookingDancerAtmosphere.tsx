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
  src: string;
  webpSrc: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio: string;
  positionClass: string;
  auraGradient: string;
}

// Fixed dancer definitions matching the 3 supplied client assets
const DANCER_01: DancerConfig = {
  id: 'dancer-01',
  src: '/images/dancers/dancer-couple-01.png',
  webpSrc: '/images/dancers/dancer-couple-01.webp',
  alt: 'Garba Dandiya couple in red and royal blue festive attire',
  width: 682,
  height: 1024,
  aspectRatio: '682/1024',
  positionClass:
    'left-[-40px] sm:left-[-30px] md:left-[-70px] lg:left-[-120px] xl:left-[-160px] bottom-0 origin-bottom-left',
  auraGradient:
    'radial-gradient(ellipse at 40% 70%, rgba(217, 37, 36, 0.28) 0%, rgba(217, 175, 55, 0.12) 45%, transparent 70%)',
};

const DANCER_02: DancerConfig = {
  id: 'dancer-02',
  src: '/images/dancers/dancer-couple-02.png',
  webpSrc: '/images/dancers/dancer-couple-02.webp',
  alt: 'Garba Dandiya couple with flared circular embroidered skirt',
  width: 1024,
  height: 682,
  aspectRatio: '1024/682',
  positionClass:
    'left-1/2 -translate-x-1/2 bottom-0 origin-bottom',
  auraGradient:
    'radial-gradient(ellipse at 50% 80%, rgba(217, 175, 55, 0.24) 0%, rgba(217, 37, 36, 0.14) 50%, transparent 75%)',
};

const DANCER_03: DancerConfig = {
  id: 'dancer-03',
  src: '/images/dancers/dancer-couple-03.png',
  webpSrc: '/images/dancers/dancer-couple-03.webp',
  alt: 'Garba Dandiya couple in festive multicolored mirrorwork dress',
  width: 682,
  height: 1024,
  aspectRatio: '682/1024',
  positionClass:
    'right-[-40px] sm:right-[-30px] md:right-[-70px] lg:right-[-120px] xl:right-[-160px] bottom-0 origin-bottom-right',
  auraGradient:
    'radial-gradient(ellipse at 60% 70%, rgba(19, 126, 134, 0.26) 0%, rgba(217, 175, 55, 0.12) 45%, transparent 70%)',
};

/**
 * Deterministic Stage Visual Mapping
 * 1. SELECT PASS -> Asset 1 (left flank)
 * 2. ATTENDEE    -> Asset 3 (right flank)
 * 3. REVIEW      -> Asset 2 (centered horizontal couple with flared skirt)
 * 4. PAYMENT     -> Asset 1 (left flank celebratory stance)
 * 5. RECEIPT     -> Asset 3 (restrained subtle watermark, print:hidden)
 */
export const STAGE_CONFIGS: Record<
  BookingVisualStage,
  {
    dancer: DancerConfig;
    opacityClass: string;
    scaleClass: string;
    isSubtleWatermark?: boolean;
  }
> = {
  selectPass: {
    dancer: DANCER_01,
    opacityClass: 'opacity-25 sm:opacity-35 md:opacity-65 lg:opacity-85',
    scaleClass: 'scale-90 sm:scale-95 md:scale-100',
  },
  attendee: {
    dancer: DANCER_03,
    opacityClass: 'opacity-25 sm:opacity-35 md:opacity-65 lg:opacity-85',
    scaleClass: 'scale-90 sm:scale-95 md:scale-100',
  },
  review: {
    dancer: DANCER_02,
    opacityClass: 'opacity-20 sm:opacity-30 md:opacity-55 lg:opacity-75',
    scaleClass: 'scale-90 sm:scale-95 md:scale-100',
  },
  payment: {
    dancer: DANCER_01,
    opacityClass: 'opacity-25 sm:opacity-35 md:opacity-60 lg:opacity-80',
    scaleClass: 'scale-90 sm:scale-95 md:scale-100',
  },
  receipt: {
    dancer: DANCER_03,
    opacityClass: 'print:hidden opacity-15 sm:opacity-20 md:opacity-30 mix-blend-luminosity grayscale contrast-125',
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
 * 1. Preloads all 3 static assets so switching steps is instant with ZERO network lag or layout shift.
 * 2. Uses pure CSS crossfades (opacity + transform) with prefers-reduced-motion safety.
 * 3. pointer-events-none ensures zero interaction interference with form elements.
 * 4. Strictly deterministic: derived directly from (deskStage, currentStep).
 * 5. print:hidden ensures zero interference with receipt printing and PDF downloads.
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
      {/* Visual Layer: Dancer 1 (Asset 1 - Left Flank) */}
      <DancerLayer
        dancer={DANCER_01}
        isActive={activeDancerId === DANCER_01.id}
        stageConfig={activeConfig}
      />

      {/* Visual Layer: Dancer 2 (Asset 2 - Centered Horizontal Flared Skirt) */}
      <DancerLayer
        dancer={DANCER_02}
        isActive={activeDancerId === DANCER_02.id}
        stageConfig={activeConfig}
      />

      {/* Visual Layer: Dancer 3 (Asset 3 - Right Flank) */}
      <DancerLayer
        dancer={DANCER_03}
        isActive={activeDancerId === DANCER_03.id}
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
      style={{
        maxWidth: dancer.id === 'dancer-02' ? '820px' : '440px',
        width: dancer.id === 'dancer-02' ? '70vw' : '40vw',
      }}
    >
      {/* Soft Ambient Festive Halo behind dancer */}
      <div
        className="absolute inset-x-8 bottom-0 top-1/4 rounded-full pointer-events-none -z-10 blur-xl opacity-60"
        style={{ background: dancer.auraGradient }}
      />

      {/* Responsive Picture with optimized WebP and high-res fallbacks */}
      <picture>
        <source
          type="image/webp"
          srcSet={`${dancer.src.replace('.png', '-sm.webp')} 400w, ${dancer.src.replace(
            '.png',
            '-md.webp'
          )} 700w, ${dancer.webpSrc} 1024w`}
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 35vw, 440px"
        />
        <Image
          src={dancer.src}
          alt={dancer.alt}
          width={dancer.width}
          height={dancer.height}
          priority
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 35vw, 440px"
          className="w-full h-auto object-contain object-bottom drop-shadow-[0_16px_36px_rgba(0,0,0,0.85)]"
        />
      </picture>
    </div>
  );
}
