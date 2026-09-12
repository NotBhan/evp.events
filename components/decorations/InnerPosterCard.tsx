import React from 'react';

/**
 * InnerPosterCard - Notched Inner Poster Field Keyline
 *
 * Framed keyline reflecting the client's Raas Utsav poster artwork:
 * - Demarcates the outer festival frame from the inner devotional field
 * - Features traditional architectural gold keylines and corner diamond rivets
 * - Colors aligned with antique gold and vermilion
 */
export default function InnerPosterCard() {
  return (
    <div
      className="absolute top-16 md:top-18 lg:top-20 bottom-2 sm:bottom-4 md:bottom-6 left-2 sm:left-4 md:left-6 right-2 sm:right-4 md:right-6 pointer-events-none select-none z-20"
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="inner-card-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#FFF8EB" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Outer Inset Border */}
        <rect
          x="6"
          y="6"
          width="calc(100% - 12px)"
          height="calc(100% - 12px)"
          rx="12"
          fill="none"
          stroke="url(#inner-card-gold-grad)"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Inner Secondary Fine Hairline */}
        <rect
          x="12"
          y="12"
          width="calc(100% - 24px)"
          height="calc(100% - 24px)"
          rx="8"
          fill="none"
          stroke="#D92524"
          strokeWidth="1"
          strokeDasharray="8 6"
          opacity="0.45"
        />

        {/* 4 Corner Ornamental Poster Brackets */}
        {/* Top-Left Corner Bracket */}
        <g transform="translate(18, 18)">
          <path d="M 0 20 L 0 0 L 20 0" fill="none" stroke="#D4AF37" strokeWidth="2" />
          <circle cx="3" cy="3" r="2.5" fill="#D92524" />
          <polygon points="12,0 16,-3 20,0 16,3" fill="#F3C64C" />
          <polygon points="0,12 -3,16 0,20 3,16" fill="#F3C64C" />
        </g>

        {/* Top-Right Corner Bracket */}
        <g transform="translate(calc(100% - 18px), 18) scale(-1, 1)">
          <path d="M 0 20 L 0 0 L 20 0" fill="none" stroke="#D4AF37" strokeWidth="2" />
          <circle cx="3" cy="3" r="2.5" fill="#D92524" />
          <polygon points="12,0 16,-3 20,0 16,3" fill="#F3C64C" />
          <polygon points="0,12 -3,16 0,20 3,16" fill="#F3C64C" />
        </g>

        {/* Bottom-Left Corner Bracket */}
        <g transform="translate(18, calc(100% - 18px)) scale(1, -1)">
          <path d="M 0 20 L 0 0 L 20 0" fill="none" stroke="#D4AF37" strokeWidth="2" />
          <circle cx="3" cy="3" r="2.5" fill="#D92524" />
          <polygon points="12,0 16,-3 20,0 16,3" fill="#F3C64C" />
          <polygon points="0,12 -3,16 0,20 3,16" fill="#F3C64C" />
        </g>

        {/* Bottom-Right Corner Bracket */}
        <g transform="translate(calc(100% - 18px), calc(100% - 18px)) scale(-1, -1)">
          <path d="M 0 20 L 0 0 L 20 0" fill="none" stroke="#D4AF37" strokeWidth="2" />
          <circle cx="3" cy="3" r="2.5" fill="#D92524" />
          <polygon points="12,0 16,-3 20,0 16,3" fill="#F3C64C" />
          <polygon points="0,12 -3,16 0,20 3,16" fill="#F3C64C" />
        </g>
      </svg>
    </div>
  );
}
