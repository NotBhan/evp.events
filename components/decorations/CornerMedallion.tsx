import React from 'react';

interface CornerMedallionProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  size?: number;
}

/**
 * CornerMedallion - Saturated Ornamental Corner Frame Bracket
 *
 * Echoes the rich outer decorative border seen in the Raas Utsav campaign:
 * - Quarter-mandala with radiant petals (antique gold, vermilion, deep emerald)
 * - Traditional mirror-work jewels and filigree beads
 * - Hanging ghunghroo bell tassel pulling toward the center
 */
export default function CornerMedallion({
  position = 'top-left',
  className = '',
  size = 240,
}: CornerMedallionProps) {
  const rotationClass = {
    'top-left': '',
    'top-right': 'scale-x-[-1]',
    'bottom-left': 'scale-y-[-1]',
    'bottom-right': 'scale-x-[-1] scale-y-[-1]',
  }[position];

  return (
    <div
      className={`select-none pointer-events-none overflow-hidden ${rotationClass} ${className}`}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`corner-glow-${position}`} cx="0%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#D92524" stopOpacity="0.35" />
            <stop offset="45%" stopColor="#220D1A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#12080D" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Corner Radiance */}
        <path d="M 0 0 L 240 0 C 240 135 135 240 0 240 Z" fill={`url(#corner-glow-${position})`} />

        {/* Outer Beaded Border Arc */}
        <path
          d="M 0 220 C 122 220 220 122 220 0"
          stroke="#D4AF37"
          strokeWidth="1.8"
          strokeDasharray="4 6"
        />

        {/* Outer Scalloped Lotus Petals (8 radiating petals) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = i * 12.8;
          const isEven = i % 2 === 0;

          return (
            <g key={`corner-petal-${i}`} transform={`rotate(${angle} 0 0)`}>
              <path
                d="M 0 185 C 16 195 28 208 24 224 C 10 226 0 212 0 185 Z"
                fill={isEven ? '#D92524' : '#1B4332'}
                stroke="#D4AF37"
                strokeWidth="1.2"
              />
              <circle cx="12" cy="210" r="3" fill="#FFF8EB" stroke="#12080D" strokeWidth="0.8" />
              <circle cx="12" cy="210" r="1.2" fill={isEven ? '#F3C64C' : '#D92524'} />
            </g>
          );
        })}

        {/* Mid Concentric Folk Ribbons */}
        <path
          d="M 0 165 C 92 165 165 92 165 0"
          stroke="#D92524"
          strokeWidth="2.5"
        />
        <path
          d="M 0 148 C 82 148 148 82 148 0"
          stroke="#D4AF37"
          strokeWidth="1.8"
          fill="none"
        />

        {/* Chevron Starburst Teeth */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = i * 7.5;
          return (
            <g key={`corner-chevron-${i}`} transform={`rotate(${angle} 0 0)`}>
              <polygon points="0,148 7,160 0,163" fill="#F3C64C" stroke="#12080D" strokeWidth="0.6" />
            </g>
          );
        })}

        {/* Inner Floral Quarter-Rosette */}
        <path
          d="M 0 105 C 58 105 105 58 105 0"
          stroke="#FFF8EB"
          strokeWidth="1.8"
          fill="#220D1A"
        />

        {Array.from({ length: 6 }).map((_, i) => {
          const angle = i * 18;
          return (
            <g key={`inner-rosette-${i}`} transform={`rotate(${angle} 0 0)`}>
              <path
                d="M 0 72 C 14 78 20 92 15 102 C 5 102 0 92 0 72 Z"
                fill="#D92524"
                stroke="#D4AF37"
                strokeWidth="1"
              />
              <circle cx="8" cy="88" r="2.5" fill="#FFF8EB" />
            </g>
          );
        })}

        {/* Center Corner Pivot Hub */}
        <path d="M 0 52 C 29 52 52 29 52 0 Z" fill="#D4AF37" stroke="#12080D" strokeWidth="2.2" />
        <path d="M 0 30 C 16 30 30 16 30 0 Z" fill="#D92524" />
        <circle cx="0" cy="0" r="12" fill="#FFF8EB" stroke="#12080D" strokeWidth="1" />

        {/* Hanging Corner Ghunghroo Bell Tassel */}
        <line x1="95" y1="95" x2="128" y2="128" stroke="#D4AF37" strokeWidth="1.8" strokeDasharray="3 3" />
        <circle cx="132" cy="132" r="5" fill="#F3C64C" stroke="#12080D" strokeWidth="1.2" />
        <circle cx="132" cy="132" r="2.2" fill="#D92524" />
      </svg>
    </div>
  );
}
