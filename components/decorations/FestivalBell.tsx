import React from 'react';

interface FestivalBellProps {
  className?: string;
  size?: number;
}

export default function FestivalBell({ className = '', size = 80 }: FestivalBellProps) {
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 80 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Hanging Chain Links */}
      <line x1="40" y1="0" x2="40" y2="35" stroke="#D9A72E" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="40" cy="35" r="4" fill="#30265D" stroke="#D9A72E" strokeWidth="1.5" />

      {/* Bell Crown Loop */}
      <path
        d="M 32 42 C 32 38 48 38 48 42"
        stroke="#D9A72E"
        strokeWidth="2"
        fill="none"
      />

      {/* Bell Body / Dome */}
      <path
        d="M 40 42 C 28 44 22 55 20 75 C 18 88 12 94 8 96 L 72 96 C 68 94 62 88 60 75 C 58 55 52 44 40 42 Z"
        fill="#30265D"
        stroke="#D9A72E"
        strokeWidth="2"
      />

      {/* Decorative Bell Bands */}
      <path
        d="M 23 70 Q 40 73 57 70"
        stroke="#E91E73"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M 18 84 Q 40 88 62 84"
        stroke="#D9A72E"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Bell Rim Bottom Flange */}
      <ellipse cx="40" cy="96" rx="32" ry="6" fill="#D9A72E" stroke="#1D1237" strokeWidth="1" />
      <ellipse cx="40" cy="96" rx="26" ry="4" fill="#1D1237" />

      {/* Bell Clapper hanging from bottom */}
      <line x1="40" y1="98" x2="40" y2="112" stroke="#D9A72E" strokeWidth="2" />
      <circle cx="40" cy="114" r="5" fill="#E91E73" stroke="#D9A72E" strokeWidth="1.5" />
    </svg>
  );
}
