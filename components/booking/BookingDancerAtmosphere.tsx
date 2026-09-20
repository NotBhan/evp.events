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
  name: string;
  src: string;
  webpSrc: string;
  webpMd: string;
  webpSm: string;
  pngMd: string;
  pngSm: string;
  alt: string;
  width: number;
  height: number;
  positionClass: string;
  sizeClass: string;
  sizes: string;
  auraGradient: string;
}

/** Full 5-Character Grand Panoramic Ensemble (The 1 group photo across full width) */
export const DANCERS_GROUP_PHOTO: DancerConfig = {
  id: 'dancers-group-photo',
  name: 'Raas Utsav Dandiya Group Photo',
  src: '/images/dancers/dancers-5-group.png',
  webpSrc: '/images/dancers/dancers-5-group.webp',
  webpMd: '/images/dancers/dancers-5-group-md.webp',
  webpSm: '/images/dancers/dancers-5-group-sm.webp',
  pngMd: '/images/dancers/dancers-5-group-md.png',
  pngSm: '/images/dancers/dancers-5-group-sm.png',
  alt: 'Raas Utsav Dandiya and Garba dancers celebrating together across the festival stage',
  width: 1018,
  height: 513,
  positionClass: 'inset-x-0 bottom-0 w-full origin-bottom',
  // Spread across whole width of the card
  sizeClass: 'w-full max-w-full',
  sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, (max-width: 1536px) 1400px, 1600px',
  auraGradient:
    'radial-gradient(ellipse 90% 70% at 50% 85%, rgba(243, 198, 76, 0.25) 0%, rgba(217, 37, 36, 0.14) 45%, transparent 80%)',
};

// Aliased for backward compatibility
export const DANCERS_5_GROUP = DANCERS_GROUP_PHOTO;

// ─── Stage Configuration: Single Group Photo Active Across All Stages ────────
export const STAGE_CONFIGS: Record<
  BookingVisualStage,
  {
    opacityClass: string;
    isSubtleWatermark?: boolean;
  }
> = {
  selectPass: {
    opacityClass: 'opacity-22 sm:opacity-25 md:opacity-28 lg:opacity-32',
  },
  attendee: {
    opacityClass: 'opacity-18 sm:opacity-20 md:opacity-24 lg:opacity-28',
  },
  review: {
    opacityClass: 'opacity-22 sm:opacity-25 md:opacity-28 lg:opacity-32',
  },
  payment: {
    opacityClass: 'opacity-18 sm:opacity-20 md:opacity-24 lg:opacity-28',
  },
  receipt: {
    opacityClass:
      'print:hidden opacity-10 sm:opacity-12 md:opacity-15 mix-blend-luminosity grayscale contrast-125',
    isSubtleWatermark: true,
  },
};

interface BookingDancerAtmosphereProps {
  visualStage: BookingVisualStage;
}

/**
 * BookingDancerAtmosphere renders the 1 replaced festival dancers group photo spread across the entire desk width.
 *
 * Architectural Guarantees:
 * 1. Spans the entire width of the booking desk for a grand panoramic festival backdrop.
 * 2. Preloads WebP assets so stage switching has zero layout shifts and instant GPU crossfades.
 * 3. pointer-events-none ensures zero interaction friction with inputs, buttons, or scrolling.
 * 4. Strictly deterministic: derived directly from (deskStage, currentStep).
 * 5. print:hidden guarantees receipts print cleanly with zero watermark ink clutter.
 */
export default function BookingDancerAtmosphere({
  visualStage,
}: BookingDancerAtmosphereProps) {
  const activeStageConfig = STAGE_CONFIGS[visualStage] || STAGE_CONFIGS.selectPass;

  return (
    <div
      id="booking-dancer-atmosphere"
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 print:hidden"
      aria-hidden="true"
    >
      {/* ── Full-Width Grand Panoramic Dancer Backdrop Layer ── */}
      <div
        data-dancer-layer="ensemble-group-photo-fullwidth"
        className={`absolute ${DANCERS_GROUP_PHOTO.positionClass} ${DANCERS_GROUP_PHOTO.sizeClass} transition-opacity duration-300 ease-out will-change-[opacity] motion-reduce:transition-opacity motion-reduce:duration-200 ${activeStageConfig.opacityClass} translate-y-0 visible flex justify-center items-end`}
      >
        {/* Radiant Ambient Festive Aura behind full-width group photo */}
        <div
          className="absolute inset-x-0 bottom-0 top-1/4 rounded-full pointer-events-none -z-10 blur-3xl opacity-60"
          style={{ background: DANCERS_GROUP_PHOTO.auraGradient }}
        />

        {/* The Image Container with Full-Width Feathering Mask & Tone Blending */}
        <div
          className="relative w-full max-w-full mx-auto h-auto flex justify-center"
          style={{
            maskImage:
              'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.3) 82%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.3) 82%, transparent 100%)',
          }}
        >
          <Image
            src={DANCERS_GROUP_PHOTO.webpSrc}
            alt={DANCERS_GROUP_PHOTO.alt}
            width={DANCERS_GROUP_PHOTO.width}
            height={DANCERS_GROUP_PHOTO.height}
            sizes={DANCERS_GROUP_PHOTO.sizes}
            className="w-full h-auto max-h-[380px] sm:max-h-[440px] md:max-h-[500px] object-contain object-bottom drop-shadow-[0_16px_36px_rgba(0,0,0,0.95)]"
            style={{
              filter: 'brightness(0.85) contrast(1.15) saturate(1.1) sepia(0.18)',
            }}
          />

          {/* Colorize Tint Overlay: Harmonizes with Deep Plum (#1C0D18), Royal Maroon (#220D1A) & Antique Gold */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-color opacity-60"
            style={{
              background:
                'linear-gradient(180deg, rgba(34, 13, 26, 0.4) 0%, rgba(212, 175, 55, 0.25) 50%, rgba(28, 13, 24, 0.7) 100%)',
            }}
          />

          {/* Soft Bottom-to-Top Vignette Gradient for Seamless Desk Surface Integration */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(28, 13, 24, 0.85) 0%, rgba(28, 13, 24, 0.2) 35%, transparent 70%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
