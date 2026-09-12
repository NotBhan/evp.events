import React from 'react';

interface MandalaProps {
  className?: string;
  size?: number;
}

/**
 * Mandala - Grand Layered Indian Festival Halo
 *
 * Modeled after traditional devotional temple halos:
 * - Scalloped lotus petals with antique gold, vermilion, and royal maroon
 * - Traditional shisha (mirror-work) centers reflecting festival radiance
 * - Alternating sunburst spires, chevron bands, and filigree beadwork
 */
export default function Mandala({ className = '', size }: MandalaProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 760 760"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none max-w-full max-h-full ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Saturated Festival Glow Gradient */}
        <radialGradient id="folk-mandala-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D92524" stopOpacity="0.35" />
          <stop offset="35%" stopColor="#D4AF37" stopOpacity="0.25" />
          <stop offset="68%" stopColor="#FF9429" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#12080D" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="lotus-vermilion-grad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FF4D4D" />
          <stop offset="50%" stopColor="#D92524" />
          <stop offset="100%" stopColor="#6E1505" />
        </radialGradient>

        <radialGradient id="lotus-gold-grad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFF8EB" />
          <stop offset="50%" stopColor="#F3C64C" />
          <stop offset="100%" stopColor="#D4AF37" />
        </radialGradient>

        <radialGradient id="center-gold-radiance" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF8EB" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#F3C64C" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#D4AF37" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#220D1A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Radiant Background Aura Field */}
      <circle cx="380" cy="380" r="370" fill="url(#folk-mandala-glow)" />

      {/* Tier 1: Outermost Golden Sunburst Spire Ring */}
      <g className="mandala-tier-1" opacity="0.85">
        <circle cx="380" cy="380" r="352" stroke="#D4AF37" strokeWidth="1.6" strokeDasharray="3 7" />
        <circle cx="380" cy="380" r="338" stroke="#D92524" strokeWidth="1.2" opacity="0.75" />

        {Array.from({ length: 32 }).map((_, i) => {
          const angle = (i * 360) / 32;
          const isMajor = i % 2 === 0;

          return (
            <g key={`t1-spire-${i}`} transform={`rotate(${angle} 380 380)`}>
              <line
                x1="380"
                y1={isMajor ? '20' : '36'}
                x2="380"
                y2="70"
                stroke="#D4AF37"
                strokeWidth={isMajor ? '2' : '1.2'}
              />
              <circle cx="380" cy={isMajor ? '16' : '32'} r={isMajor ? '4.5' : '3'} fill="#F3C64C" />
              <circle cx="380" cy={isMajor ? '16' : '32'} r={isMajor ? '2' : '1.2'} fill="#FFF8EB" />
              <circle cx="370" cy="54" r="2.2" fill="#D92524" />
              <circle cx="390" cy="54" r="2.2" fill="#FF9429" />
            </g>
          );
        })}
      </g>

      {/* Tier 2: Grand Scalloped Lotus Petals with Mirror Work */}
      <g className="mandala-tier-2">
        <circle cx="380" cy="380" r="298" stroke="#D4AF37" strokeWidth="2.2" opacity="0.8" />

        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          const isEven = i % 2 === 0;

          return (
            <g key={`t2-lotus-${i}`} transform={`rotate(${angle} 380 380)`}>
              <path
                d="M 380 72 C 344 122 328 174 380 205 C 432 174 416 122 380 72 Z"
                fill="#220D1A"
                stroke="#D4AF37"
                strokeWidth="2"
              />
              <path
                d="M 380 88 C 356 126 348 162 380 186 C 412 162 404 126 380 88 Z"
                fill={isEven ? 'url(#lotus-vermilion-grad)' : 'url(#lotus-gold-grad)'}
                stroke="#FFF8EB"
                strokeWidth="0.8"
              />
              <circle cx="380" cy="116" r="5.5" fill="#FFF8EB" stroke="#12080D" strokeWidth="1.2" />
              <circle cx="380" cy="116" r="2.2" fill={isEven ? '#D92524' : '#D4AF37'} />
              <circle cx="380" cy="146" r="3.5" fill="#F3C64C" />
              <circle cx="380" cy="168" r="2.2" fill="#FFF8EB" />
            </g>
          );
        })}
      </g>

      {/* Tier 3: Chevron & Starburst Geometric Lattice */}
      <g className="mandala-tier-3">
        <circle cx="380" cy="380" r="230" stroke="#D4AF37" strokeWidth="2.8" />
        <circle cx="380" cy="380" r="210" stroke="#D92524" strokeWidth="1.8" strokeDasharray="5 5" />
        <circle cx="380" cy="380" r="192" stroke="#FF9429" strokeWidth="2" />

        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          return (
            <g key={`t3-star-${i}`} transform={`rotate(${angle} 380 380)`}>
              <polygon
                points="380,160 392,192 380,186 368,192"
                fill="#F3C64C"
                stroke="#12080D"
                strokeWidth="1"
              />
              <circle cx="380" cy="202" r="3" fill="#D92524" />
              <circle cx="380" cy="218" r="2.2" fill="#FFF8EB" />
            </g>
          );
        })}
      </g>

      {/* Tier 4: Traditional Jali Mirror Rosette Band */}
      <g className="mandala-tier-4">
        <circle cx="380" cy="380" r="154" fill="#220D1A" stroke="#D4AF37" strokeWidth="2.2" />
        <circle cx="380" cy="380" r="132" stroke="#D92524" strokeWidth="1.8" />

        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 360) / 12;
          return (
            <g key={`t4-jali-${i}`} transform={`rotate(${angle} 380 380)`}>
              <path
                d="M 380 232 C 360 258 364 286 380 298 C 396 286 400 258 380 232 Z"
                fill="#D92524"
                stroke="#D4AF37"
                strokeWidth="1.4"
              />
              <circle cx="380" cy="260" r="4.2" fill="#FFF8EB" stroke="#12080D" strokeWidth="1" />
              <circle cx="380" cy="280" r="2.5" fill="#F3C64C" />
            </g>
          );
        })}
      </g>

      {/* Tier 5: Central Solar Medallion */}
      <g className="mandala-center">
        <circle cx="380" cy="380" r="76" fill="url(#center-gold-radiance)" />
        <circle cx="380" cy="380" r="58" fill="#12080D" stroke="#D4AF37" strokeWidth="2.8" />
        <circle cx="380" cy="380" r="44" fill="#220D1A" stroke="#D92524" strokeWidth="1.8" />

        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          return (
            <g key={`center-star-${i}`} transform={`rotate(${angle} 380 380)`}>
              <polygon points="380,338 386,364 380,360 374,364" fill="#F3C64C" />
            </g>
          );
        })}

        <circle cx="380" cy="380" r="20" fill="#F3C64C" stroke="#FFF8EB" strokeWidth="1.8" />
        <circle cx="380" cy="380" r="10" fill="#D92524" />
        <circle cx="380" cy="380" r="4" fill="#FFF8EB" />
      </g>
    </svg>
  );
}
