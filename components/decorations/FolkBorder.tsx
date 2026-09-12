import React from 'react';

interface FolkBorderProps {
  className?: string;
}

export default function FolkBorder({ className = '' }: FolkBorderProps) {
  return (
    <div className={`w-full h-4 overflow-hidden select-none pointer-events-none ${className}`} aria-hidden="true">
      <svg
        width="100%"
        height="16"
        viewBox="0 0 480 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <line x1="0" y1="2" x2="480" y2="2" stroke="#D4AF37" strokeWidth="1" />
        <line x1="0" y1="14" x2="480" y2="14" stroke="#D4AF37" strokeWidth="1" />

        {/* Repeating Triangles / Chevrons */}
        {Array.from({ length: 24 }).map((_, i) => {
          const x = i * 20;
          return (
            <g key={`folk-triangle-${i}`}>
              <polygon points={`${x},2 ${x + 10},14 ${x + 20},2`} fill="#220D1A" />
              <polygon points={`${x + 5},2 ${x + 10},9 ${x + 15},2`} fill="#D92524" />
              <circle cx={x + 10} cy="11" r="1.5" fill="#FFF8EB" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
