import React from 'react';

interface BackgroundPatternProps {
  className?: string;
  opacity?: number;
}

export default function BackgroundPattern({
  className = '',
  opacity = 0.04,
}: BackgroundPatternProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="folk-lattice"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            {/* Diamond Outline */}
            <polygon
              points="30,0 60,30 30,60 0,30"
              fill="none"
              stroke="#FFF4D8"
              strokeWidth="1"
            />
            {/* Inner Floral Cross */}
            <circle cx="30" cy="30" r="4" fill="#D9A72E" />
            <circle cx="0" cy="30" r="2" fill="#E91E73" />
            <circle cx="60" cy="30" r="2" fill="#E91E73" />
            <circle cx="30" cy="0" r="2" fill="#E91E73" />
            <circle cx="30" cy="60" r="2" fill="#E91E73" />
            
            {/* Subtle Diagonal Hash Marks */}
            <line x1="15" y1="15" x2="45" y2="45" stroke="#D9A72E" strokeWidth="0.5" strokeDasharray="2 4" />
            <line x1="45" y1="15" x2="15" y2="45" stroke="#D9A72E" strokeWidth="0.5" strokeDasharray="2 4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#folk-lattice)" />
      </svg>
    </div>
  );
}
