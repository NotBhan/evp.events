import React from 'react';
import Image from 'next/image';

export interface HeroDancerProps {
  src?: string;
  alt?: string;
  placement: 'left' | 'right';
  className?: string;
}

export default function HeroDancer({
  src,
  alt = 'Dandiya Garba Performer',
  placement,
  className = '',
}: HeroDancerProps) {
  const isLeft = placement === 'left';

  return (
    <div
      data-dancer-placement={placement}
      className={`relative select-none flex items-end justify-center [will-change:transform] ${className}`}
    >
      {/* Soft ambient dancer halo (hardware-accelerated, replaces dynamic SVG Gaussian filter) */}
      <div
        className="absolute inset-x-6 bottom-4 top-1/4 rounded-full pointer-events-none -z-10"
        style={{
          background: isLeft
            ? 'radial-gradient(ellipse at 50% 60%, rgba(217, 37, 36, 0.35) 0%, rgba(217, 37, 36, 0.1) 50%, transparent 75%)'
            : 'radial-gradient(ellipse at 50% 60%, rgba(217, 175, 55, 0.32) 0%, rgba(217, 175, 55, 0.08) 50%, transparent 75%)',
        }}
      />

      {src ? (
        <div className="relative w-full h-full">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 50vw, 38vw"
            className="object-contain object-bottom pointer-events-none"
            priority
          />
        </div>
      ) : isLeft ? (
        <FemaleDancerSilhouette />
      ) : (
        <MaleDancerSilhouette />
      )}
    </div>
  );
}

/* ========================================================================== */
/* Female Garba Performer Silhouette                                          */
/* Styled after the client poster: flared yellow/red lehenga, gold jewelry,   */
/* mirrorwork, and raised dandiya sticks                                      */
/* ========================================================================== */
function FemaleDancerSilhouette() {
  return (
    <svg
      viewBox="0 0 460 680"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-h-[78vh] sm:max-h-[82vh] md:max-h-[86vh] max-w-[420px] sm:max-w-[480px] md:max-w-[540px]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dancer-female-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D92524" />
          <stop offset="35%" stopColor="#B50D00" />
          <stop offset="75%" stopColor="#6E1505" />
          <stop offset="100%" stopColor="#12080D" />
        </linearGradient>
        <linearGradient id="dancer-skirt-flare" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF9429" />
          <stop offset="30%" stopColor="#F3C64C" />
          <stop offset="65%" stopColor="#D92524" />
          <stop offset="100%" stopColor="#6E1505" />
        </linearGradient>
      </defs>

      {/* Radiant Halo / Mirror Mandala Behind Head */}
      <circle cx="240" cy="100" r="54" stroke="#D4AF37" strokeWidth="1.8" strokeDasharray="4 4" opacity="0.75" />
      <circle cx="240" cy="100" r="42" stroke="#D92524" strokeWidth="1.2" opacity="0.6" />
      {Array.from({ length: 12 }).map((_, i) => (
        <circle
          key={`f-aura-${i}`}
          cx={240 + Math.cos((i * 30 * Math.PI) / 180) * 54}
          cy={100 + Math.sin((i * 30 * Math.PI) / 180) * 54}
          r="2.2"
          fill="#FFF8EB"
        />
      ))}

      {/* Raised Left Arm with Dandiya Stick (Striking inward) */}
      <path
        d="M 215 155 C 180 120 145 95 105 75 C 92 68 88 80 98 90 C 130 115 165 148 190 180 Z"
        fill="url(#dancer-female-body)"
      />
      {/* Hand Bangles */}
      <circle cx="108" cy="80" r="6" fill="#D4AF37" />
      <circle cx="114" cy="85" r="5" fill="#D92524" />
      <circle cx="120" cy="90" r="5" fill="#D4AF37" />

      {/* Raised Dandiya Stick */}
      <g transform="rotate(-38 102 78)">
        <rect x="96" y="2" width="10" height="130" rx="5" fill="#D4AF37" stroke="#12080D" strokeWidth="1.5" />
        <rect x="96" y="22" width="10" height="10" fill="#D92524" />
        <rect x="96" y="48" width="10" height="10" fill="#FFF8EB" />
        <rect x="96" y="80" width="10" height="10" fill="#D92524" />
        <rect x="96" y="105" width="10" height="10" fill="#FFF8EB" />
        <circle cx="101" cy="132" r="4.5" fill="#D92524" stroke="#D4AF37" strokeWidth="1" />
      </g>

      {/* Head and Braided Hair */}
      <circle cx="240" cy="100" r="25" fill="#12080D" stroke="#D4AF37" strokeWidth="2" />
      {/* Hair Bun / Floral Gajra */}
      <path d="M 240 75 C 220 72 215 88 222 98" stroke="#FFF8EB" strokeWidth="4" strokeDasharray="3 4" fill="none" />
      {/* Maang Tikka */}
      <circle cx="240" cy="78" r="4" fill="#D4AF37" />
      <line x1="240" y1="78" x2="240" y2="92" stroke="#D4AF37" strokeWidth="1.5" />
      <circle cx="240" cy="92" r="3.5" fill="#D92524" />
      {/* Large Jhumka Earring */}
      <polygon points="218,110 210,122 226,122" fill="#D4AF37" />
      <circle cx="218" cy="125" r="2" fill="#FFF8EB" />

      {/* Expansive Flying Dupatta / Odhani Drape */}
      <path
        d="M 225 125 C 270 95 345 85 410 110 C 455 128 440 162 390 175 C 340 188 280 170 245 155 Z"
        fill="#D92524"
        opacity="0.9"
      />
      <path
        d="M 245 155 C 310 190 405 220 445 290 C 458 315 425 322 405 298 C 365 250 290 215 235 195 Z"
        fill="#F3C64C"
        opacity="0.85"
      />
      <path
        d="M 225 125 C 270 95 345 85 410 110"
        stroke="#FFF8EB"
        strokeWidth="2"
        strokeDasharray="4 6"
        fill="none"
      />

      {/* Torso & Embroidered Choli */}
      <path
        d="M 205 150 C 220 142 260 142 278 152 C 272 198 266 235 272 268 C 248 274 225 274 208 268 C 202 230 198 190 205 150 Z"
        fill="url(#dancer-female-body)"
        stroke="#D4AF37"
        strokeWidth="1.5"
      />
      {/* Choli Mirrorwork Accents */}
      <circle cx="228" cy="188" r="4.5" fill="#FFF8EB" />
      <circle cx="252" cy="188" r="4.5" fill="#FFF8EB" />
      <circle cx="240" cy="210" r="5.5" fill="#D4AF37" />
      <circle cx="240" cy="238" r="4.5" fill="#FFF8EB" />

      {/* Right Forward Arm with Second Dandiya Stick */}
      <path
        d="M 272 172 C 310 190 350 215 375 238 C 382 248 372 258 360 250 C 338 232 300 210 268 195 Z"
        fill="url(#dancer-female-body)"
      />
      <circle cx="368" cy="245" r="6" fill="#D4AF37" />
      <g transform="rotate(32 368 245)">
        <rect x="363" y="175" width="10" height="120" rx="5" fill="#D4AF37" stroke="#12080D" strokeWidth="1.5" />
        <rect x="363" y="195" width="10" height="10" fill="#D92524" />
        <rect x="363" y="222" width="10" height="10" fill="#FFF8EB" />
        <rect x="363" y="255" width="10" height="10" fill="#D92524" />
        <circle cx="368" cy="295" r="4.5" fill="#D92524" stroke="#D4AF37" strokeWidth="1" />
      </g>

      {/* Flaring Ghagra Skirt (Yellow/Orange & Red Banded Flare) */}
      <path
        d="M 208 268 C 225 272 248 272 272 268 C 322 330 405 410 450 520 C 462 550 454 585 422 596 C 355 618 215 624 95 590 C 60 578 52 544 70 515 C 125 420 175 330 208 268 Z"
        fill="url(#dancer-skirt-flare)"
        stroke="#D4AF37"
        strokeWidth="2"
      />

      {/* Skirt Pleat Flow Lines */}
      <path d="M 225 272 Q 235 430 160 595" stroke="#D4AF37" strokeWidth="1.5" opacity="0.7" fill="none" />
      <path d="M 240 272 Q 275 430 265 610" stroke="#FFF8EB" strokeWidth="1.8" opacity="0.8" fill="none" />
      <path d="M 258 272 Q 330 430 375 600" stroke="#D4AF37" strokeWidth="1.5" opacity="0.7" fill="none" />

      {/* Decorative Border at Hem of Skirt */}
      <path
        d="M 82 550 C 130 575 250 615 430 550 L 422 596 C 355 618 215 624 95 590 Z"
        fill="#12080D"
        stroke="#D4AF37"
        strokeWidth="1.8"
      />
      {/* Mirrorwork Border Studs */}
      {Array.from({ length: 14 }).map((_, i) => (
        <circle
          key={`mirror-${i}`}
          cx={115 + i * 22}
          cy={576 + Math.sin((i / 13) * Math.PI) * 12}
          r="3"
          fill="#FFF8EB"
          stroke="#D4AF37"
          strokeWidth="1"
        />
      ))}

      {/* Dancer Anklets & Feet */}
      <ellipse cx="220" cy="625" rx="16" ry="8" fill="#12080D" stroke="#D4AF37" strokeWidth="1.2" />
      <ellipse cx="290" cy="628" rx="16" ry="8" fill="#12080D" stroke="#D4AF37" strokeWidth="1.2" />
      <circle cx="220" cy="618" r="3.5" fill="#D4AF37" />
      <circle cx="290" cy="621" r="3.5" fill="#D4AF37" />
    </svg>
  );
}

/* ========================================================================== */
/* Male Dandiya Performer Silhouette                                          */
/* Styled after the client poster: pristine white kediyu/dhoti with red/gold  */
/* embroidered vest, kalgi plume, and dual dandiya sticks                     */
/* ========================================================================== */
function MaleDancerSilhouette() {
  return (
    <svg
      viewBox="0 0 460 680"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto max-h-[78vh] sm:max-h-[82vh] md:max-h-[86vh] max-w-[420px] sm:max-w-[480px] md:max-w-[540px]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dancer-male-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D92524" />
          <stop offset="45%" stopColor="#B50D00" />
          <stop offset="100%" stopColor="#6E1505" />
        </linearGradient>
        <linearGradient id="dancer-white-dhoti" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#FFF8EB" />
          <stop offset="100%" stopColor="#EADBC6" />
        </linearGradient>
      </defs>

      {/* Radiant Aura Behind Head */}
      <circle cx="230" cy="95" r="50" stroke="#D92524" strokeWidth="1.8" strokeDasharray="4 5" opacity="0.75" />
      <circle cx="230" cy="95" r="38" stroke="#D4AF37" strokeWidth="1.2" opacity="0.6" />
      {Array.from({ length: 12 }).map((_, i) => (
        <circle
          key={`m-aura-${i}`}
          cx={230 + Math.cos((i * 30 * Math.PI) / 180) * 50}
          cy={95 + Math.sin((i * 30 * Math.PI) / 180) * 50}
          r="2.2"
          fill="#FFF8EB"
        />
      ))}

      {/* Turban / Paghadi Headpiece with Kalgi Plume */}
      <ellipse cx="230" cy="90" rx="32" ry="22" fill="#D92524" stroke="#D4AF37" strokeWidth="2" />
      <path d="M 205 86 C 220 72 250 72 265 86" stroke="#D4AF37" strokeWidth="2.5" fill="none" />
      <polygon points="228,68 235,46 240,68" fill="#D4AF37" />
      <circle cx="234" cy="68" r="3.5" fill="#FFF8EB" />
      <circle cx="230" cy="106" r="19" fill="#12080D" />

      {/* Left Raised Arm striking Dandiya Stick (Inward Reach) */}
      <path
        d="M 200 150 C 165 118 128 90 92 72 C 84 82 92 92 104 100 C 132 122 162 150 182 180 Z"
        fill="#FFF8EB"
        stroke="#D4AF37"
        strokeWidth="1.2"
      />
      <circle cx="98" cy="84" r="7" fill="#D4AF37" />

      {/* Left Dandiya Stick */}
      <g transform="rotate(42 96 82)">
        <rect x="91" y="8" width="10" height="130" rx="5" fill="#D92524" stroke="#D4AF37" strokeWidth="1.5" />
        <rect x="91" y="28" width="10" height="12" fill="#D4AF37" />
        <rect x="91" y="62" width="10" height="10" fill="#FFF8EB" />
        <rect x="91" y="92" width="10" height="12" fill="#D4AF37" />
        <circle cx="96" cy="138" r="4.5" fill="#D4AF37" stroke="#12080D" strokeWidth="1" />
      </g>

      {/* Right Raised Arm striking Dandiya Stick */}
      <path
        d="M 268 150 C 305 118 340 90 375 72 C 384 82 375 92 364 100 C 335 122 305 150 284 180 Z"
        fill="#FFF8EB"
        stroke="#D4AF37"
        strokeWidth="1.2"
      />
      <circle cx="370" cy="84" r="7" fill="#D4AF37" />

      {/* Right Dandiya Stick */}
      <g transform="rotate(-42 370 82)">
        <rect x="365" y="8" width="10" height="130" rx="5" fill="#D92524" stroke="#D4AF37" strokeWidth="1.5" />
        <rect x="365" y="28" width="10" height="12" fill="#D4AF37" />
        <rect x="365" y="62" width="10" height="10" fill="#FFF8EB" />
        <rect x="365" y="92" width="10" height="12" fill="#D4AF37" />
        <circle cx="370" cy="138" r="4.5" fill="#D4AF37" stroke="#12080D" strokeWidth="1" />
      </g>

      {/* Torso with Festive Embroidered Red Vest over White Kediyu */}
      <path
        d="M 188 150 C 212 140 248 140 272 150 L 285 242 C 248 252 212 252 175 242 Z"
        fill="url(#dancer-male-jacket)"
        stroke="#D4AF37"
        strokeWidth="1.5"
      />
      {/* Kediyu Front Chest V-Yoke Embroidery */}
      <polygon points="200,152 260,152 230,202" fill="#F3C64C" stroke="#D92524" strokeWidth="1.2" />
      <circle cx="230" cy="172" r="3.5" fill="#FFF8EB" />
      <circle cx="230" cy="225" r="4.5" fill="#D4AF37" />

      {/* Flared White Kediyu Frock Skirt */}
      <path
        d="M 175 242 C 212 252 248 252 285 242 C 330 288 385 348 410 435 C 355 458 235 466 120 435 C 145 348 165 288 175 242 Z"
        fill="url(#dancer-white-dhoti)"
        stroke="#D4AF37"
        strokeWidth="2"
      />
      {/* Frill Flow & Red Pompom Mirror Detailing */}
      <path d="M 132 418 Q 230 448 398 418" stroke="#D4AF37" strokeWidth="1.8" fill="none" strokeDasharray="5 7" />
      {Array.from({ length: 9 }).map((_, i) => (
        <circle
          key={`kediyu-pompom-${i}`}
          cx={160 + i * 32}
          cy={412 - Math.sin((i / 8) * Math.PI) * 10}
          r="4"
          fill="#D92524"
        />
      ))}

      {/* Pristine White Dhoti Pants with Dynamic Stride */}
      <path
        d="M 170 425 C 182 470 165 540 152 618 L 202 618 C 215 550 225 490 230 440"
        fill="url(#dancer-white-dhoti)"
        stroke="#D4AF37"
        strokeWidth="1.5"
      />
      <path
        d="M 290 425 C 278 470 295 540 308 618 L 258 618 C 245 550 235 490 230 440"
        fill="url(#dancer-white-dhoti)"
        stroke="#D4AF37"
        strokeWidth="1.5"
      />

      {/* Traditional Mojari Footwear */}
      <path d="M 142 624 C 154 618 184 618 196 628 C 202 636 148 640 136 632 Z" fill="#D92524" stroke="#D4AF37" strokeWidth="1.2" />
      <path d="M 318 624 C 306 618 276 618 264 628 C 258 636 312 640 324 632 Z" fill="#D92524" stroke="#D4AF37" strokeWidth="1.2" />
    </svg>
  );
}
