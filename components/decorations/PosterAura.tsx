import React from 'react';

interface PosterAuraProps {
  className?: string;
}

/**
 * PosterAura - Sweeping Folk Paisley & Floral Energy Aura
 *
 * Inspired by the colorful psychedelic floral burst erupting behind the
 * performer in the Ahmedabad Garba Princess poster:
 * - Sweeping organic paisley forms and floral petals flanking left & right dancers
 * - Saturated color accents (festival pink, peacock teal, ochre gold)
 * - Harmoniously connects the outer frame, performers, and central headline
 */
export default function PosterAura({ className = '' }: PosterAuraProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 850"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full min-w-[1024px] object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ============================================================== */}
        {/* Left Sweeping Folk Paisley Swirl & Floral Flourish             */}
        {/* Swirls energetically behind the Left Garba Dancer              */}
        {/* ============================================================== */}
        <g opacity="0.38">
          {/* Saturated Floral Swirl Flare 1 (Peacock Teal Core) */}
          <path
            d="M 120 720 C 190 600 240 450 220 330 C 200 220 280 180 380 230 C 450 270 470 380 390 440 C 330 480 270 420 290 350 C 310 300 380 320 360 370 C 350 400 310 390 310 360"
            stroke="#137E86"
            strokeWidth="3.5"
            fill="none"
          />

          {/* Saturated Floral Swirl Flare 2 (Festival Pink Offset) */}
          <path
            d="M 80 750 C 160 630 210 480 190 350 C 170 230 260 160 390 210 C 480 250 500 380 410 450 C 330 500 250 430 270 340 C 290 270 390 290 370 360"
            stroke="#E91E73"
            strokeWidth="2.5"
            strokeDasharray="12 6"
            fill="none"
          />

          {/* Golden Guiding Spiral Ribbon */}
          <path
            d="M 50 680 C 180 580 300 480 370 320 C 420 220 510 180 620 160"
            stroke="#D9A72E"
            strokeWidth="2"
            fill="none"
          />

          {/* Blooming Paisley Lotus Petals on Left */}
          {/* Petal 1 */}
          <path
            d="M 360 210 C 400 180 440 210 420 250 C 390 270 360 240 360 210 Z"
            fill="#E91E73"
            stroke="#D9A72E"
            strokeWidth="1.5"
          />
          <circle cx="395" cy="230" r="3.5" fill="#FFF4D8" />

          {/* Petal 2 */}
          <path
            d="M 430 260 C 470 240 500 280 470 320 C 440 330 420 290 430 260 Z"
            fill="#137E86"
            stroke="#D9A72E"
            strokeWidth="1.5"
          />
          <circle cx="465" cy="285" r="3.5" fill="#FFF4D8" />

          {/* Petal 3 */}
          <path
            d="M 410 360 C 450 360 460 410 420 440 C 380 440 380 380 410 360 Z"
            fill="#D9A72E"
            stroke="#1D1237"
            strokeWidth="1.5"
          />
          <circle cx="425" cy="400" r="3" fill="#E91E73" />

          {/* Radiating Spark Flares */}
          <line x1="380" y1="200" x2="440" y2="160" stroke="#D9A72E" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="445" cy="155" r="3.5" fill="#D9A72E" />
          <circle cx="485" cy="210" r="4.5" fill="#E91E73" />
          <circle cx="515" cy="310" r="4" fill="#137E86" />
          <circle cx="460" cy="460" r="3.5" fill="#FFF4D8" />
        </g>

        {/* ============================================================== */}
        {/* Right Sweeping Folk Paisley Swirl & Floral Flourish            */}
        {/* Swirls energetically behind the Right Dandiya Raas Dancer      */}
        {/* ============================================================== */}
        <g opacity="0.38">
          {/* Saturated Floral Swirl Flare 1 (Peacock Teal Core) */}
          <path
            d="M 1320 720 C 1250 600 1200 450 1220 330 C 1240 220 1160 180 1060 230 C 990 270 970 380 1050 440 C 1110 480 1170 420 1150 350 C 1130 300 1060 320 1080 370 C 1090 400 1130 390 1130 360"
            stroke="#137E86"
            strokeWidth="3.5"
            fill="none"
          />

          {/* Saturated Floral Swirl Flare 2 (Festival Pink Offset) */}
          <path
            d="M 1360 750 C 1280 630 1230 480 1250 350 C 1270 230 1180 160 1050 210 C 960 250 940 380 1030 450 C 1110 500 1190 430 1170 340 C 1150 270 1050 290 1070 360"
            stroke="#E91E73"
            strokeWidth="2.5"
            strokeDasharray="12 6"
            fill="none"
          />

          {/* Golden Guiding Spiral Ribbon */}
          <path
            d="M 1390 680 C 1260 580 1140 480 1070 320 C 1020 220 930 180 820 160"
            stroke="#D9A72E"
            strokeWidth="2"
            fill="none"
          />

          {/* Blooming Paisley Lotus Petals on Right */}
          {/* Petal 1 */}
          <path
            d="M 1080 210 C 1040 180 1000 210 1020 250 C 1050 270 1080 240 1080 210 Z"
            fill="#E91E73"
            stroke="#D9A72E"
            strokeWidth="1.5"
          />
          <circle cx="1045" cy="230" r="3.5" fill="#FFF4D8" />

          {/* Petal 2 */}
          <path
            d="M 1010 260 C 970 240 940 280 970 320 C 1000 330 1020 290 1010 260 Z"
            fill="#137E86"
            stroke="#D9A72E"
            strokeWidth="1.5"
          />
          <circle cx="975" cy="285" r="3.5" fill="#FFF4D8" />

          {/* Petal 3 */}
          <path
            d="M 1030 360 C 990 360 980 410 1020 440 C 1060 440 1060 380 1030 360 Z"
            fill="#D9A72E"
            stroke="#1D1237"
            strokeWidth="1.5"
          />
          <circle cx="1015" cy="400" r="3" fill="#E91E73" />

          {/* Radiating Spark Flares */}
          <line x1="1060" y1="200" x2="1000" y2="160" stroke="#D9A72E" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="995" cy="155" r="3.5" fill="#D9A72E" />
          <circle cx="955" cy="210" r="4.5" fill="#E91E73" />
          <circle cx="925" cy="310" r="4" fill="#137E86" />
          <circle cx="980" cy="460" r="3.5" fill="#FFF4D8" />
        </g>
      </svg>
    </div>
  );
}
