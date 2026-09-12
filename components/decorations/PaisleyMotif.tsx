import React from 'react';

interface PaisleyMotifProps {
  className?: string;
  size?: number;
  flip?: boolean;
}

export default function PaisleyMotif({
  className = '',
  size = 120,
  flip = false,
}: PaisleyMotifProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none ${flip ? 'scale-x-[-1]' : ''} ${className}`}
      aria-hidden="true"
    >
      {/* Outer Kalka Curve */}
      <path
        d="M 30 105 C 10 90 10 50 35 30 C 55 12 85 10 95 30 C 105 48 95 72 75 80 C 60 85 52 75 52 65 C 52 50 72 45 70 35 C 68 28 50 28 42 42 C 32 58 35 85 55 95 C 62 98 45 112 30 105 Z"
        fill="#30265D"
        stroke="#D9A72E"
        strokeWidth="1.5"
      />

      {/* Internal Filigree Line */}
      <path
        d="M 36 92 C 22 80 22 55 40 40 C 54 28 72 26 80 38 C 88 50 80 66 65 72 C 58 75 56 68 58 62 C 60 56 68 52 66 48 C 64 42 55 42 48 50 C 42 58 40 78 52 86"
        stroke="#E91E73"
        strokeWidth="1.2"
        strokeDasharray="3 3"
        fill="none"
      />

      {/* Decorative Floral Core */}
      <circle cx="58" cy="62" r="3" fill="#D9A72E" />
      <circle cx="48" cy="74" r="2" fill="#FFF4D8" />
      <circle cx="40" cy="55" r="2" fill="#FFF4D8" />
      <circle cx="70" cy="45" r="2" fill="#FFF4D8" />
    </svg>
  );
}
