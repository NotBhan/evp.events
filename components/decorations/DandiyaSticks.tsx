import React from 'react';

interface DandiyaSticksProps {
  className?: string;
  size?: number;
}

export default function DandiyaSticks({ className = '', size = 160 }: DandiyaSticksProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Central Radiance Glow */}
      <circle cx="80" cy="80" r="40" fill="#D92524" opacity="0.15" />

      {/* Dandiya Stick 1 (Diagonal Left-to-Right: -35 deg) */}
      <g transform="rotate(-35 80 80)">
        {/* Main Shaft */}
        <rect x="74" y="10" width="12" height="140" rx="6" fill="#D4AF37" stroke="#12080D" strokeWidth="1.5" />

        {/* Decorative Tape Spirals / Bands */}
        <rect x="74" y="25" width="12" height="10" fill="#D92524" />
        <rect x="74" y="45" width="12" height="6" fill="#F3C64C" />
        <rect x="74" y="60" width="12" height="12" fill="#FFF8EB" />
        <rect x="74" y="85" width="12" height="10" fill="#D92524" />
        <rect x="74" y="105" width="12" height="8" fill="#F3C64C" />
        <rect x="74" y="125" width="12" height="12" fill="#FFF8EB" />

        {/* Tip Golden Pom-pom / Bell */}
        <circle cx="80" cy="10" r="5" fill="#F3C64C" stroke="#FFF8EB" strokeWidth="1" />
        {/* Base Hanging Ghunghroo Bell */}
        <circle cx="80" cy="150" r="5" fill="#F3C64C" stroke="#FFF8EB" strokeWidth="1" />
        <line x1="80" y1="155" x2="80" y2="162" stroke="#D92524" strokeWidth="1" />
        <circle cx="80" cy="162" r="2.5" fill="#D92524" />
      </g>

      {/* Dandiya Stick 2 (Diagonal Right-to-Left: +35 deg) */}
      <g transform="rotate(35 80 80)">
        {/* Main Shaft */}
        <rect x="74" y="10" width="12" height="140" rx="6" fill="#D4AF37" stroke="#12080D" strokeWidth="1.5" />

        {/* Decorative Tape Spirals / Bands */}
        <rect x="74" y="25" width="12" height="10" fill="#D92524" />
        <rect x="74" y="45" width="12" height="6" fill="#F3C64C" />
        <rect x="74" y="60" width="12" height="12" fill="#FFF8EB" />
        <rect x="74" y="85" width="12" height="10" fill="#D92524" />
        <rect x="74" y="105" width="12" height="8" fill="#F3C64C" />
        <rect x="74" y="125" width="12" height="12" fill="#FFF8EB" />

        {/* Tip Golden Pom-pom */}
        <circle cx="80" cy="10" r="5" fill="#F3C64C" stroke="#FFF8EB" strokeWidth="1" />
        {/* Base Hanging Ghunghroo Bell */}
        <circle cx="80" cy="150" r="5" fill="#F3C64C" stroke="#FFF8EB" strokeWidth="1" />
        <line x1="80" y1="155" x2="80" y2="162" stroke="#D92524" strokeWidth="1" />
        <circle cx="80" cy="162" r="2.5" fill="#D92524" />
      </g>

      {/* Central Crossed Node Rosette */}
      <circle cx="80" cy="80" r="10" fill="#220D1A" stroke="#D4AF37" strokeWidth="2" />
      <circle cx="80" cy="80" r="5" fill="#D92524" />
      <circle cx="80" cy="80" r="2" fill="#FFF8EB" />
    </svg>
  );
}
