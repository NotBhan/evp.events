import React from 'react';

/**
 * InnerPosterCard - Notched Inner Poster Field Keyline
 *
 * Framed keyline reflecting the client's Raas Utsav poster artwork:
 * - Demarcates the outer festival frame from the inner devotional field
 * - Features traditional architectural gold keylines and corner diamond rivets
 * - Colors aligned with antique gold and vermilion
 */
function CornerBracket({ className = '' }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M 0 20 L 0 0 L 20 0" fill="none" stroke="#D4AF37" strokeWidth="2" />
      <circle cx="3" cy="3" r="2.5" fill="#D92524" />
      <polygon points="12,0 16,-3 20,0 16,3" fill="#F3C64C" />
      <polygon points="0,12 -3,16 0,20 3,16" fill="#F3C64C" />
    </svg>
  );
}

export default function InnerPosterCard() {
  return (
    <div
      className="absolute top-16 md:top-18 lg:top-20 bottom-2 sm:bottom-4 md:bottom-6 left-2 sm:left-4 md:left-6 right-2 sm:right-4 md:right-6 pointer-events-none select-none z-20 rounded-xl border border-[#D4AF37]/60 p-1.5"
      aria-hidden="true"
    >
      <div className="w-full h-full rounded-lg border border-dashed border-[#D92524]/45 relative">
        <CornerBracket className="absolute top-1.5 left-1.5" />
        <CornerBracket className="absolute top-1.5 right-1.5 scale-x-[-1]" />
        <CornerBracket className="absolute bottom-1.5 left-1.5 scale-y-[-1]" />
        <CornerBracket className="absolute bottom-1.5 right-1.5 scale-x-[-1] scale-y-[-1]" />
      </div>
    </div>
  );
}

