import React from 'react';
import Image from 'next/image';
import Mandala from './Mandala';

interface DurgaAuraProps {
  size?: number;
  className?: string;
  rotateDeg?: number;
}

/**
 * DurgaAura - Devotional Centerpiece Artwork & Multi-Ring Mechanical Chakri
 *
 * Implements:
 * 1. Continuous ambient rotational motion across multiple independent rings
 * 2. Additional scroll-linked scrub rotation with distinct rates & counter-rotation
 * 3. 3-ring system: Outer Lotus Mandala + Inner Sunburst Mandorla + Radial Light Shafts
 * 4. Scale/depth response to scroll
 * 5. Dynamic light/glow pulsation
 * 6. Authoritative devotional Maa Durga portrait
 */
export default function DurgaAura({
  size = 480,
  className = '',
  rotateDeg = 0,
}: DurgaAuraProps) {
  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Ambient Warm Pulsating Red/Gold Glow Field (Restrained devotional halo) */}
      <div
        data-glow
        className="absolute inset-0 rounded-full pointer-events-none animate-aura-pulse"
        style={{
          background:
            'radial-gradient(circle, rgba(217, 37, 36, 0.48) 0%, rgba(243, 198, 76, 0.32) 35%, rgba(255, 148, 41, 0.18) 55%, rgba(18, 8, 13, 0) 75%)',
          transform: 'scale(1.15)',
        }}
      />

      {/* 2. Layer A: Radial Celestial Aura Rays (GSAP Rotation Controlled) */}
      <div
        data-aura-rays
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `rotate(${rotateDeg * 0.4}deg)`,
        }}
      >
        <div className="w-full h-full opacity-70">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="celestial-ray-gold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F3C64C" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#D92524" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#12080D" stopOpacity="0" />
              </linearGradient>
            </defs>
            {Array.from({ length: 36 }).map((_, i) => (
              <line
                key={`cray-${i}`}
                x1="200"
                y1="20"
                x2="200"
                y2="100"
                stroke="url(#celestial-ray-gold)"
                strokeWidth={i % 2 === 0 ? '2.2' : '1.2'}
                transform={`rotate(${i * 10} 200 200)`}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* 3. Layer B: Outer Chakri Ring — Traditional Festival Lotus Mandala (GSAP Rotation Controlled) */}
      <div
        data-mandala
        data-chakri-outer
        className="absolute inset-0 w-full h-full pointer-events-none [will-change:transform]"
        style={{
          transform: `rotate(${rotateDeg * 0.8}deg)`,
        }}
      >
        <div className="w-full h-full">
          <Mandala
            size={size}
            className="w-full h-full opacity-90"
          />
        </div>
      </div>

      {/* 4. Layer C: Inner Chakri Ring — 24-Ray Golden Spearhead Mandorla (GSAP Rotation Controlled) */}
      <div
        data-halo
        data-chakri-inner
        className="absolute inset-0 w-full h-full pointer-events-none [will-change:transform]"
        style={{
          transform: `rotate(${rotateDeg}deg)`,
        }}
      >
        <div className="w-full h-full">
          <svg
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="durga-halo-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF8EB" />
                <stop offset="30%" stopColor="#F3C64C" />
                <stop offset="70%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#997528" />
              </linearGradient>
              <linearGradient id="durga-halo-red" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF4D4D" />
                <stop offset="50%" stopColor="#D92524" />
                <stop offset="100%" stopColor="#6E1505" />
              </linearGradient>
            </defs>

            {/* Outer Fine Keyline Circle */}
            <circle
              cx="200"
              cy="200"
              r="192"
              stroke="url(#durga-halo-gold)"
              strokeWidth="1.8"
              strokeDasharray="6 4"
              opacity="0.8"
            />
            <circle
              cx="200"
              cy="200"
              r="178"
              stroke="url(#durga-halo-gold)"
              strokeWidth="1.2"
              opacity="0.55"
            />

            {/* Radiating 24-Ray Golden Spearhead Mandorla */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              return (
                <g key={`ray-${i}`} transform={`rotate(${angle} 200 200)`}>
                  {/* Flame-tip Petal */}
                  <path
                    d="M 200 10 C 195 28 193 50 200 68 C 207 50 205 28 200 10 Z"
                    fill="url(#durga-halo-gold)"
                  />
                  <circle cx="200" cy="6" r="2.8" fill="#FFF8EB" />
                  {/* Midpoint Diamond Jewel */}
                  <polygon points="200,70 204,75 200,80 196,75" fill="url(#durga-halo-gold)" />
                  {/* Secondary fine radiating ray */}
                  <line
                    x1="200"
                    y1="82"
                    x2="200"
                    y2="120"
                    stroke="url(#durga-halo-gold)"
                    strokeWidth="1.4"
                    strokeOpacity="0.6"
                  />
                </g>
              );
            })}

            {/* Inner Scalloped Ring */}
            <circle cx="200" cy="200" r="122" stroke="url(#durga-halo-gold)" strokeWidth="2.5" />
            <circle cx="200" cy="200" r="116" stroke="url(#durga-halo-red)" strokeWidth="1.5" opacity="0.85" />

            {/* Inner Beaded Rosette */}
            {Array.from({ length: 36 }).map((_, i) => {
              const rad = (i * 10 * Math.PI) / 180;
              const cx = Number((200 + Math.cos(rad) * 119).toFixed(2));
              const cy = Number((200 + Math.sin(rad) * 119).toFixed(2));
              return (
                <circle
                  key={`bead-${i}`}
                  cx={cx}
                  cy={cy}
                  r="2.2"
                  fill="#F3C64C"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* 5. Official Client Durga Centerpiece Portrait (Master 1024x1024 from RAASCDR) */}
      <div data-portrait className="relative z-10 w-[84%] h-[84%] flex items-center justify-center p-0">
        <div className="relative w-full h-full">
          {/* Hardware-accelerated radial warm glow underlay replacing dynamic Gaussian filter */}
          <div
            className="absolute inset-[6%] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(255, 148, 41, 0.42) 0%, rgba(243, 198, 76, 0.22) 48%, transparent 72%)',
            }}
          />
          <Image
            src="/images/client/raascdr/web/durga-centerpiece.webp"
            alt="Maa Durga Devotional Centerpiece Artwork - Raas Utsav 2026"
            fill
            sizes="(max-width: 640px) 260px, (max-width: 1024px) 410px, 430px"
            className="object-contain object-center pointer-events-none"
            priority
          />
        </div>
      </div>
    </div>
  );
}
