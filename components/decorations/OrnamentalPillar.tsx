import React from 'react';

interface OrnamentalPillarProps {
  placement?: 'left' | 'right';
  className?: string;
}

/**
 * OrnamentalPillar - Vertical Ornamental Festival Side Frame
 *
 * Rich vertical poster border panel framing the hero stage:
 * - Saturated client color palette (antique gold, vermilion, amber, royal maroon)
 * - Repeating floral medallions and filigree mirror-work rosettes
 * - Swirling paisley tendrils and hanging brass bells (jhumkas)
 */
export default function OrnamentalPillar({
  placement = 'left',
  className = '',
}: OrnamentalPillarProps) {
  const isRight = placement === 'right';

  return (
    <div
      className={`select-none pointer-events-none ${isRight ? 'scale-x-[-1]' : ''} ${className}`}
      aria-hidden="true"
    >
      <svg
        width="140"
        height="680"
        viewBox="0 0 140 680"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full max-h-[78vh] w-auto drop-shadow-[0_12px_32px_rgba(0,0,0,0.65)]"
      >
        <defs>
          <linearGradient id={`side-frame-bg-${placement}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#220D1A" />
            <stop offset="35%" stopColor="#2E1123" />
            <stop offset="70%" stopColor="#1C0D18" />
            <stop offset="100%" stopColor="#12080D" />
          </linearGradient>

          <linearGradient id={`rosette-vermilion-grad-${placement}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4D4D" />
            <stop offset="50%" stopColor="#D92524" />
            <stop offset="100%" stopColor="#6E1505" />
          </linearGradient>
        </defs>

        {/* Top Bracket: Lotus Finial & Hanging Bell */}
        <path
          d="M 65 6 C 50 18 35 28 20 32 C 35 42 55 42 65 38 C 75 42 95 42 110 32 C 95 28 80 18 65 6 Z"
          fill="#D4AF37"
          stroke="#12080D"
          strokeWidth="1.5"
        />
        <circle cx="65" cy="22" r="5" fill="#D92524" stroke="#FFF8EB" strokeWidth="1" />
        <circle cx="65" cy="22" r="2" fill="#FFF8EB" />

        <path
          d="M 12 36 C 30 26 100 26 118 36 L 112 56 L 18 56 Z"
          fill="#220D1A"
          stroke="#D4AF37"
          strokeWidth="2"
        />
        <circle cx="36" cy="46" r="3.5" fill="#F3C64C" />
        <circle cx="65" cy="46" r="4.5" fill="#D92524" stroke="#FFF8EB" strokeWidth="1" />
        <circle cx="94" cy="46" r="3.5" fill="#F3C64C" />

        {/* Hanging Festival Brass Bell from Outer Corner */}
        <line x1="18" y1="56" x2="18" y2="78" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="3 3" />
        <path
          d="M 12 78 C 12 74 24 74 24 78 L 26 88 C 26 91 10 91 10 88 Z"
          fill="#F3C64C"
          stroke="#12080D"
          strokeWidth="1"
        />
        <circle cx="18" cy="92" r="2.5" fill="#FFF8EB" />

        {/* Vertical Border Tapestry Strip */}
        <rect
          x="28"
          y="56"
          width="74"
          height="540"
          fill={`url(#side-frame-bg-${placement})`}
          stroke="#D4AF37"
          strokeWidth="2"
        />

        {/* Inner Colorful Guard Stripes */}
        <rect x="34" y="62" width="62" height="528" fill="#12080D" stroke="#D92524" strokeWidth="1.2" />
        <line x1="40" y1="62" x2="40" y2="590" stroke="#D4AF37" strokeWidth="1" strokeDasharray="5 7" opacity="0.8" />
        <line x1="90" y1="62" x2="90" y2="590" stroke="#D4AF37" strokeWidth="1" strokeDasharray="5 7" opacity="0.8" />

        {/* Repeating Floral Medallions */}
        {Array.from({ length: 8 }).map((_, i) => {
          const cy = 95 + i * 62;
          const isEven = i % 2 === 0;

          return (
            <g key={`tapestry-node-${i}`}>
              <circle
                cx="65"
                cy={cy}
                r="18"
                fill={isEven ? '#220D1A' : '#1C0D18'}
                stroke="#D4AF37"
                strokeWidth="1.4"
              />

              {/* Diamond Star Inset */}
              <polygon
                points={`65,${cy - 15} 77,${cy} 65,${cy + 15} 53,${cy}`}
                fill={`url(#rosette-vermilion-grad-${placement})`}
                stroke="#FFF8EB"
                strokeWidth="0.8"
              />

              <circle cx="65" cy={cy} r="4.5" fill="#FFF8EB" stroke="#12080D" strokeWidth="1" />
              <circle cx="65" cy={cy} r="1.8" fill="#D92524" />

              <circle cx="43" cy={cy} r="2" fill="#F3C64C" />
              <circle cx="87" cy={cy} r="2" fill="#F3C64C" />

              {i < 7 && (
                <g>
                  <circle cx="65" cy={cy + 31} r="3" fill="#F3C64C" stroke="#12080D" strokeWidth="0.8" />
                  <circle cx="65" cy={cy + 31} r="1.2" fill="#FFF8EB" />
                  <line x1="50" y1={cy + 31} x2="80" y2={cy + 31} stroke="#D92524" strokeWidth="1" opacity="0.7" />
                </g>
              )}
            </g>
          );
        })}

        {/* Outer Flanking Paisley Vine */}
        <path
          d="M 102 60 C 132 110 122 160 104 210 C 132 260 122 310 104 360 C 132 410 122 460 104 510 C 128 550 122 575 102 596"
          stroke="#D4AF37"
          strokeWidth="2"
          fill="none"
        />

        {/* Paisley Lotus Buds */}
        {Array.from({ length: 6 }).map((_, i) => {
          const by = 110 + i * 82;
          return (
            <g key={`paisley-bud-${i}`}>
              <path
                d={`M 112 ${by - 10} C 128 ${by - 12} 136 ${by} 128 ${by + 8} C 118 ${by + 6} 112 ${by} 112 ${by - 10} Z`}
                fill="#D92524"
                stroke="#D4AF37"
                strokeWidth="1"
              />
              <circle cx="124" cy={by - 1} r="2" fill="#FFF8EB" />
              <line x1="124" y1={by + 8} x2="124" y2={by + 16} stroke="#D4AF37" strokeWidth="1" />
              <circle cx="124" cy={by + 18} r="2.5" fill="#F3C64C" />
            </g>
          );
        })}

        {/* Bottom Bracket */}
        <path
          d="M 20 596 L 110 596 L 122 626 L 8 626 Z"
          fill="#220D1A"
          stroke="#D4AF37"
          strokeWidth="2"
        />
        <line x1="18" y1="611" x2="112" y2="611" stroke="#D92524" strokeWidth="1.5" strokeDasharray="5 5" />
        <circle cx="65" cy="611" r="5" fill="#F3C64C" stroke="#12080D" strokeWidth="1" />
        <circle cx="65" cy="611" r="2" fill="#FFF8EB" />

        {/* Sub-Plinth Base */}
        <rect x="0" y="626" width="130" height="26" rx="4" fill="#12080D" stroke="#D4AF37" strokeWidth="2" />
        <circle cx="30" cy="639" r="3.5" fill="#F3C64C" />
        <circle cx="65" cy="639" r="5" fill="#D92524" stroke="#FFF8EB" strokeWidth="1" />
        <circle cx="100" cy="639" r="3.5" fill="#F3C64C" />

        {/* Bottom Ghunghroo Bells */}
        <circle cx="35" cy="658" r="3" fill="#F3C64C" />
        <circle cx="65" cy="660" r="4" fill="#F3C64C" />
        <circle cx="95" cy="658" r="3" fill="#F3C64C" />
      </svg>
    </div>
  );
}
