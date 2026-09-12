import React from 'react';

interface HangingDiyaProps {
  side?: 'left' | 'right';
  size?: number;
  className?: string;
}

/**
 * HangingDiya - Decorative Hanging Brass Oil Lamp with Glowing Flame
 *
 * Modeled after the traditional hanging lamps in the client's Raas Utsav poster and hoarding:
 * - Hanging brass link chain
 * - Ornate bell-shaped canopy and brass suspension ring
 * - Deep flared oil diya bowl in antique and bright gold tones
 * - Radiant amber flame with pulsating warm light flare
 * - CSS ambient sway keyframe animation
 */
export default function HangingDiya({
  side = 'left',
  size = 64,
  className = '',
}: HangingDiyaProps) {
  const isLeft = side === 'left';
  const animationClass = isLeft ? 'animate-diya-left' : 'animate-diya-right';

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none pointer-events-none ${animationClass} ${className}`}
      style={{ width: `${size}px` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-[0_8px_20px_rgba(255,148,41,0.45)]"
      >
        <defs>
          {/* Antique Gold Metallic Gradient */}
          <linearGradient id={`diya-gold-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF4DB" />
            <stop offset="30%" stopColor="#F3C64C" />
            <stop offset="70%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8A6010" />
          </linearGradient>

          {/* Glowing Flame Radial Gradient */}
          <radialGradient id={`flame-glow-${side}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#FFE066" />
            <stop offset="70%" stopColor="#FF9429" />
            <stop offset="100%" stopColor="#D92524" stopOpacity="0" />
          </radialGradient>

          {/* Diya Bowl Inner Shadow */}
          <linearGradient id={`diya-bowl-inner-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6E1505" />
            <stop offset="60%" stopColor="#B50D00" />
            <stop offset="100%" stopColor="#3B0800" />
          </linearGradient>
        </defs>

        {/* 1. Suspension Chain (Fine brass interlocking links) */}
        <g stroke={`url(#diya-gold-${side})`} strokeWidth="1.8" strokeLinecap="round">
          <line x1="50" y1="0" x2="50" y2="120" strokeDasharray="6 4" />
          {/* Chain Link Rings */}
          <circle cx="50" cy="18" r="2.8" fill="#12080D" />
          <circle cx="50" cy="38" r="2.8" fill="#12080D" />
          <circle cx="50" cy="58" r="2.8" fill="#12080D" />
          <circle cx="50" cy="78" r="2.8" fill="#12080D" />
          <circle cx="50" cy="98" r="2.8" fill="#12080D" />
          <circle cx="50" cy="116" r="3.5" fill="#D4AF37" />
        </g>

        {/* 2. Top Canopy / Suspension Bell Hood */}
        <path
          d="M 40 126 C 40 120 46 118 50 118 C 54 118 60 120 60 126 L 63 134 C 63 136 37 136 37 134 Z"
          fill={`url(#diya-gold-${side})`}
          stroke="#12080D"
          strokeWidth="1"
        />

        {/* 3. Small Hanging Bead Tassels */}
        <circle cx="42" cy="138" r="1.8" fill="#F3C64C" />
        <circle cx="50" cy="140" r="2.2" fill="#FFE066" />
        <circle cx="58" cy="138" r="1.8" fill="#F3C64C" />

        {/* 4. Glowing Radiant Ambient Aura Behind Flame */}
        <circle
          cx="50"
          cy="165"
          r="32"
          fill={`url(#flame-glow-${side})`}
          opacity="0.5"
          className="animate-flame"
        />

        {/* 5. The Diya Bowl (Ornate Curved Brass Vessel) */}
        <g transform="translate(0, 15)">
          {/* Outer Vessel Body */}
          <path
            d="M 18 160 C 24 185 76 185 82 160 C 72 165 28 165 18 160 Z"
            fill={`url(#diya-gold-${side})`}
            stroke="#684507"
            strokeWidth="1.2"
          />
          {/* Inner Oil Basin */}
          <ellipse
            cx="50"
            cy="160"
            rx="32"
            ry="7"
            fill={`url(#diya-bowl-inner-${side})`}
            stroke="#D4AF37"
            strokeWidth="1"
          />
          {/* Brass Decorative Base Stem & Finial */}
          <path
            d="M 46 178 L 44 190 C 44 193 56 193 56 190 L 54 178 Z"
            fill={`url(#diya-gold-${side})`}
          />
          <circle cx="50" cy="195" r="3" fill="#F3C64C" />

          {/* 6. Glowing Flame in the Center (Animated) */}
          <g className="animate-flame" style={{ transformOrigin: '50px 156px' }}>
            {/* Outer Flame (Orange / Red) */}
            <path
              d="M 50 134 C 44 144 43 152 46 157 C 48 159 52 159 54 157 C 57 152 56 144 50 134 Z"
              fill="#FF7A00"
            />
            {/* Inner Flame (Vibrant Golden Yellow) */}
            <path
              d="M 50 139 C 46 147 46 153 48 156 C 49 157 51 157 52 156 C 54 153 54 147 50 139 Z"
              fill="#FFD233"
            />
            {/* Flame Core (White Hot Tip) */}
            <path
              d="M 50 144 C 48 149 48 153 49 155 C 50 156 50 156 51 155 C 52 153 52 149 50 144 Z"
              fill="#FFFFFF"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
