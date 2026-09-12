import React from 'react';

interface ToranGarlandProps {
  className?: string;
}

export default function ToranGarland({ className = '' }: ToranGarlandProps) {
  return (
    <div className={`w-full overflow-hidden select-none pointer-events-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto min-w-[768px]"
        preserveAspectRatio="none"
      >
        {/* Layer 1: Topmost Intricate Border Frieze */}
        <rect x="0" y="0" width="1440" height="18" fill="#220D1A" />
        <line x1="0" y1="18" x2="1440" y2="18" stroke="#D4AF37" strokeWidth="2.5" />
        <line x1="0" y1="9" x2="1440" y2="9" stroke="#D92524" strokeWidth="1.5" strokeDasharray="6 6" />

        {/* Golden Diamond Jewels along top ribbon */}
        {Array.from({ length: 48 }).map((_, i) => (
          <polygon
            key={`top-diamond-${i}`}
            points={`${15 + i * 30},4 ${19 + i * 30},9 ${15 + i * 30},14 ${11 + i * 30},9`}
            fill="#F3C64C"
          />
        ))}

        {/* Layer 2: Secondary Decorative Hanging Chain */}
        <line x1="0" y1="24" x2="1440" y2="24" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 8" opacity="0.6" />

        {/* Layer 3: Grand Scalloped Toran Arches */}
        {Array.from({ length: 12 }).map((_, i) => {
          const startX = i * 120;
          const midX = startX + 60;
          const endX = startX + 120;

          return (
            <g key={`arch-${i}`}>
              {/* Double Festoon Garland Curves */}
              <path
                d={`M ${startX} 18 Q ${midX} 80 ${endX} 18`}
                stroke="#D4AF37"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d={`M ${startX} 18 Q ${midX} 65 ${endX} 18`}
                stroke="#D92524"
                strokeWidth="1.5"
                fill="none"
                opacity="0.85"
              />

              {/* Arch Center Pendant: Traditional Stylized Mango Leaf */}
              <path
                d={`M ${midX} 76 C ${midX - 18} 95 ${midX - 12} 118 ${midX} 128 C ${midX + 12} 118 ${midX + 18} 95 ${midX} 76 Z`}
                fill="#1B4332"
                stroke="#D4AF37"
                strokeWidth="1.5"
              />
              <line x1={midX} y1="80" x2={midX} y2="120" stroke="#FFF8EB" strokeWidth="1" opacity="0.7" />

              {/* Tiered Double Marigold Blossoms (Gold + Vermilion) */}
              <circle cx={midX} cy="72" r="10" fill="#F3C64C" stroke="#12080D" strokeWidth="1.2" />
              <circle cx={midX} cy="72" r="6" fill="#D92524" />
              <circle cx={midX} cy="72" r="2.5" fill="#FFF8EB" />

              {/* Hanging Brass Bell from Leaf Tip */}
              <line x1={midX} y1="128" x2={midX} y2="136" stroke="#D4AF37" strokeWidth="1.5" />
              <circle cx={midX} cy="138" r="3.5" fill="#F3C64C" stroke="#12080D" strokeWidth="0.8" />

              {/* Flanking Side Foliage */}
              <path
                d={`M ${startX + 30} 38 C ${startX + 20} 50 ${startX + 24} 68 ${startX + 32} 74 C ${startX + 38} 68 ${startX + 40} 50 ${startX + 30} 38 Z`}
                fill="#1B4332"
                stroke="#D4AF37"
                strokeWidth="0.8"
                opacity="0.9"
              />
              <circle cx={startX + 30} cy="42" r="4.5" fill="#F3C64C" />
              <circle cx={startX + 30} cy="42" r="2" fill="#D92524" />

              <path
                d={`M ${startX + 90} 38 C ${startX + 80} 50 ${startX + 84} 68 ${startX + 92} 74 C ${startX + 98} 68 ${startX + 100} 50 ${startX + 90} 38 Z`}
                fill="#1B4332"
                stroke="#D4AF37"
                strokeWidth="0.8"
                opacity="0.9"
              />
              <circle cx={startX + 90} cy="42" r="4.5" fill="#F3C64C" />
              <circle cx={startX + 90} cy="42" r="2" fill="#D92524" />

              {/* Hanging Pearls along curve */}
              <circle cx={startX + 48} cy="58" r="2.5" fill="#FFF8EB" />
              <circle cx={startX + 72} cy="58" r="2.5" fill="#FFF8EB" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
