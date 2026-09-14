'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface CurtainRevealProps {
  src: string;
  alt: string;
  caption?: string;
  badge?: string;
  aspectRatio?: '16/9' | '4/3' | '3/2' | '3/4' | '1/1' | '21/9';
  priority?: boolean;
  className?: string;
}

/**
 * CurtainSVGPanel - Authentic Stage Curtain Vector Panel
 *
 * Renders an illustrated theatrical stage curtain panel with:
 * - Broad, irregular velvet drapery pleats/folds (crests & shadowed troughs)
 * - Deep plum & royal purple fabric with ambient warm gold lighting
 * - Weighted bottom hem with scalloped gold cord fringe
 * - Ornate vertical inner brocade trim with ochre-gold chevron embroidery
 *   and restrained festival-pink accents
 * - Hanging festival brass bell & tassel at the inner meeting edge
 */
function CurtainSVGPanel({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';

  return (
    <div
      className="absolute inset-y-0 w-full h-full pointer-events-none select-none"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 500 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={`w-full h-full ${!isLeft ? 'scale-x-[-1]' : ''}`}
      >
        <defs>
          {/* Deep Velvet Shadow & Highlight Gradients for Natural Pleats */}
          <linearGradient id={`curtain-base-${side}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#150B28" />
            <stop offset="18%" stopColor="#2A174A" />
            <stop offset="28%" stopColor="#190D30" />
            <stop offset="42%" stopColor="#351C5E" />
            <stop offset="56%" stopColor="#1D0E35" />
            <stop offset="72%" stopColor="#3A1D66" />
            <stop offset="88%" stopColor="#200F3C" />
            <stop offset="97%" stopColor="#301655" />
            <stop offset="100%" stopColor="#140827" />
          </linearGradient>

          {/* Vertical Ambient Shimmer on Crests */}
          <linearGradient id={`curtain-glow-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D9A72E" stopOpacity="0.18" />
            <stop offset="35%" stopColor="#E91E73" stopOpacity="0.08" />
            <stop offset="70%" stopColor="#1D1237" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0B0515" stopOpacity="0.5" />
          </linearGradient>

          {/* Gold Brocade Inner Border Gradient */}
          <linearGradient id={`gold-trim-${side}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D9A72E" />
            <stop offset="50%" stopColor="#FFF4D8" />
            <stop offset="100%" stopColor="#B38217" />
          </linearGradient>
        </defs>

        {/* 1. Main Fabric Body with Irregular Draped Folds */}
        <rect x="0" y="0" width="500" height="700" fill={`url(#curtain-base-${side})`} />
        <rect x="0" y="0" width="500" height="700" fill={`url(#curtain-glow-${side})`} />

        {/* 2. Three-Dimensional Flute Shadow Overlays (Broad Pleat Troughs) */}
        <path
          d="M 120 0 L 145 700 L 115 700 L 95 0 Z"
          fill="#0C0518"
          opacity="0.65"
        />
        <path
          d="M 260 0 L 290 700 L 255 700 L 230 0 Z"
          fill="#0C0518"
          opacity="0.6"
        />
        <path
          d="M 410 0 L 440 700 L 410 700 L 385 0 Z"
          fill="#0C0518"
          opacity="0.75"
        />

        {/* 3. Subtle Satin Highlights on Pleat Crests */}
        <path
          d="M 60 0 L 75 700 L 65 700 L 52 0 Z"
          fill="#FFF4D8"
          opacity="0.07"
        />
        <path
          d="M 200 0 L 215 700 L 205 700 L 192 0 Z"
          fill="#FFF4D8"
          opacity="0.08"
        />
        <path
          d="M 350 0 L 365 700 L 355 700 L 342 0 Z"
          fill="#FFF4D8"
          opacity="0.09"
        />

        {/* 4. Weighted Scalloped Bottom Hem with Gold Cord */}
        <g opacity="0.95">
          <path
            d="M 0 680 Q 30 670 60 680 Q 90 690 120 680 Q 150 670 180 680 Q 210 690 240 680 Q 270 670 300 680 Q 330 690 360 680 Q 390 670 420 680 Q 450 690 480 680 L 500 680 L 500 700 L 0 700 Z"
            fill="#140827"
          />
          <path
            d="M 0 680 Q 30 670 60 680 Q 90 690 120 680 Q 150 670 180 680 Q 210 690 240 680 Q 270 670 300 680 Q 330 690 360 680 Q 390 670 420 680 Q 450 690 480 680 L 500 680"
            stroke={`url(#gold-trim-${side})`}
            strokeWidth="3.5"
            fill="none"
          />
          {/* Subtle Fringe Tassels along Bottom Edge */}
          {Array.from({ length: 16 }).map((_, i) => (
            <line
              key={`fringe-${i}`}
              x1={15 + i * 30}
              y1="682"
              x2={15 + i * 30}
              y2="695"
              stroke="#D9A72E"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.75"
            />
          ))}
        </g>

        {/* 5. Ornate Vertical Inner Brocade Trim (Center-Meeting Edge) */}
        {/* Occupies x = 466 to 500 (34px wide band) */}
        <rect x="466" y="0" width="34" height="700" fill="#180A2D" />
        <line x1="466" y1="0" x2="466" y2="700" stroke={`url(#gold-trim-${side})`} strokeWidth="3" />
        <line x1="472" y1="0" x2="472" y2="700" stroke="#E91E73" strokeWidth="1.5" strokeDasharray="6 6" />
        <line x1="498" y1="0" x2="498" y2="700" stroke={`url(#gold-trim-${side})`} strokeWidth="2.5" />

        {/* Folk Diamonds along Inner Trim */}
        {Array.from({ length: 28 }).map((_, i) => (
          <polygon
            key={`trim-diamond-${i}`}
            points={`484,${12 + i * 25} 490,${18 + i * 25} 484,${24 + i * 25} 478,${18 + i * 25}`}
            fill="#D9A72E"
          />
        ))}

        {/* 6. Hanging Festival Brass Bell & Tassel at Inner Meeting Edge */}
        <g transform="translate(470, 320)">
          {/* Gold Cord Tie */}
          <line x1="14" y1="-30" x2="14" y2="0" stroke="#D9A72E" strokeWidth="2" />
          {/* Rosette Medallion */}
          <circle cx="14" cy="4" r="8" fill="#D9A72E" stroke="#140827" strokeWidth="1.5" />
          <circle cx="14" cy="4" r="4" fill="#E91E73" />
          <circle cx="14" cy="4" r="1.5" fill="#FFF4D8" />
          {/* Traditional Bell Profile */}
          <path
            d="M 6 12 C 7 7 21 7 22 12 L 25 24 C 26 27 2 27 3 24 Z"
            fill={`url(#gold-trim-${side})`}
            stroke="#1D1237"
            strokeWidth="1.2"
          />
          {/* Bell Clapper */}
          <circle cx="14" cy="27" r="2.5" fill="#D9A72E" />
          {/* Hanging Silk Tassel Strands */}
          <path
            d="M 10 28 L 6 48 L 22 48 L 18 28 Z"
            fill="#E91E73"
            opacity="0.9"
          />
          <line x1="14" y1="28" x2="14" y2="52" stroke="#FFF4D8" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

/**
 * CurtainReveal Component
 *
 * Theatrical two-panel festival curtain reveal for major event photography.
 * - Closed curtain meets precisely down the center
 * - When entering the viewport, panels part cleanly (left -> left, right -> right)
 * - Underlying photograph smoothly scales 1.04 -> 1.0
 * - Atmospheric caption & festival campaign badge fade in
 * - Lightweight, transform-based, GPU-accelerated GSAP ScrollTrigger
 * - Strict prefers-reduced-motion fallback
 */
export default function CurtainReveal({
  src,
  alt,
  caption,
  badge,
  aspectRatio = '16/9',
  priority = false,
  className = '',
}: CurtainRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLElement>(null);
  const centerSeamRef = useRef<HTMLDivElement>(null);

  const aspectClasses = {
    '16/9': 'aspect-[16/9]',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    '3/4': 'aspect-[3/4]',
    '1/1': 'aspect-square',
    '21/9': 'aspect-[21/9]',
  }[aspectRatio];

  useEffect(() => {
    const container = containerRef.current;
    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;
    const imgEl = imageRef.current;
    const badgeEl = badgeRef.current;
    const captionEl = captionRef.current;
    const centerSeam = centerSeamRef.current;

    if (!container || !leftPanel || !rightPanel || !imgEl) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set([leftPanel, rightPanel], { display: 'none' });
      if (centerSeam) gsap.set(centerSeam, { display: 'none' });
      gsap.set(imgEl, { scale: 1 });
      if (badgeEl) gsap.set(badgeEl, { opacity: 1, y: 0 });
      if (captionEl) gsap.set(captionEl, { opacity: 1, y: 0 });
      return;
    }

    let hasRevealed = false;

    // Initial Static Preparation
    gsap.set(leftPanel, { xPercent: 0, opacity: 1 });
    gsap.set(rightPanel, { xPercent: 0, opacity: 1 });
    if (centerSeam) gsap.set(centerSeam, { opacity: 1, scaleY: 1 });
    gsap.set(imgEl, { scale: 1.04 });
    if (badgeEl) gsap.set(badgeEl, { opacity: 0, y: -8 });
    if (captionEl) gsap.set(captionEl, { opacity: 0, y: 8 });

    const playReveal = () => {
      if (hasRevealed) return;
      hasRevealed = true;

      const tl = gsap.timeline();

      // Theatrical Curtain Split Animation (snappy ~1.1s total)
      if (centerSeam) {
        tl.to(centerSeam, {
          opacity: 0,
          scaleY: 0.8,
          duration: 0.25,
          ease: 'power1.out',
        }, 0);
      }

      tl.to(leftPanel, {
        xPercent: -102,
        duration: 1.1,
        ease: 'power2.inOut',
      }, 0.05)
        .to(rightPanel, {
          xPercent: 102,
          duration: 1.1,
          ease: 'power2.inOut',
        }, 0.05)
        .to(imgEl, {
          scale: 1,
          duration: 1.3,
          ease: 'power2.out',
        }, 0.1);

      if (badgeEl) {
        tl.to(badgeEl, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        }, 0.55);
      }

      if (captionEl) {
        tl.to(captionEl, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        }, 0.65);
      }
    };

    // 1. Native IntersectionObserver for 100% reliable viewport detection
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          playReveal();
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '50px 0px 50px 0px' }
    );
    observer.observe(container);

    // 2. GSAP ScrollTrigger for scroll synchronization with Lenis
    const st = ScrollTrigger.create({
      trigger: container,
      start: 'top 85%',
      once: true,
      onEnter: playReveal,
    });

    // 3. User interaction click-to-open fallback
    const handleClick = () => playReveal();
    container.addEventListener('click', handleClick);

    return () => {
      observer.disconnect();
      st.kill();
      container.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <figure
      ref={containerRef}
      className={`relative group overflow-hidden rounded-3xl border-2 border-ochre-gold/60 shadow-[0_8px_36px_rgba(29,18,55,0.6)] transition-all duration-300 hover:border-ochre-gold ${className}`}
      aria-label="Theatrical Festival Photograph"
    >
      {/* Outer Keyline Double-Border Frame */}
      <div className="absolute inset-2 rounded-2xl border border-ochre-gold/25 pointer-events-none z-30 transition-colors group-hover:border-ochre-gold/50" />

      {/* Decorative Corner Filigree Diamonds */}
      <span className="absolute top-2.5 left-2.5 text-ochre-gold text-xs z-30 pointer-events-none select-none drop-shadow">♦</span>
      <span className="absolute top-2.5 right-2.5 text-ochre-gold text-xs z-30 pointer-events-none select-none drop-shadow">♦</span>
      <span className="absolute bottom-2.5 left-2.5 text-ochre-gold text-xs z-30 pointer-events-none select-none drop-shadow">♦</span>
      <span className="absolute bottom-2.5 right-2.5 text-ochre-gold text-xs z-30 pointer-events-none select-none drop-shadow">♦</span>

      {/* Top Decorative Festoon Pelmet / Stage Arch Valance */}
      <div className="absolute top-0 inset-x-0 h-6 z-25 pointer-events-none select-none overflow-hidden flex justify-center">
        <div className="w-full h-full bg-gradient-to-b from-deep-plum via-deep-plum/90 to-transparent border-b border-ochre-gold/40 flex items-center justify-between px-6">
          <span className="text-ochre-gold text-[10px] tracking-wider font-display">✦ ✦ ✦</span>
          <span className="text-ochre-gold text-[10px] uppercase font-display tracking-[0.14em] drop-shadow-sm">FESTIVAL STAGE ARENA</span>
          <span className="text-ochre-gold text-[10px] tracking-wider font-display">✦ ✦ ✦</span>
        </div>
      </div>

      {/* Aspect Ratio Container (Strictly Overflow Hidden) */}
      <div className={`relative w-full ${aspectClasses} overflow-hidden bg-deep-plum`}>
        {/* 1. Underlying Real Festival Photograph */}
        <div ref={imageRef} className="absolute inset-0 w-full h-full will-change-transform">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1400px) 90vw, 1200px"
            className="object-cover object-center"
          />

          {/* Atmospheric Festival Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-deep-plum/95 via-deep-plum/25 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(29,18,55,0.6)_100%)] pointer-events-none z-10" />
        </div>

        {/* 2. Left Curtain Panel (covers 0 to 50.5% with 0.5% center overlap) */}
        <div
          ref={leftPanelRef}
          className="absolute inset-y-0 left-0 w-[50.5%] z-20 overflow-hidden will-change-transform origin-left"
          style={{ willChange: 'transform' }}
        >
          <CurtainSVGPanel side="left" />
        </div>

        {/* 3. Right Curtain Panel (covers 49.5% to 100% with 0.5% center overlap) */}
        <div
          ref={rightPanelRef}
          className="absolute inset-y-0 right-0 w-[50.5%] z-20 overflow-hidden will-change-transform origin-right"
          style={{ willChange: 'transform' }}
        >
          <CurtainSVGPanel side="right" />
        </div>

        {/* 4. Center Meeting Seam Gold Medallion Clasp */}
        <div
          ref={centerSeamRef}
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 z-22 pointer-events-none flex flex-col items-center justify-center will-change-transform"
        >
          <div className="w-8 h-8 rounded-full bg-deep-plum border-2 border-ochre-gold shadow-[0_0_16px_rgba(217,167,46,0.6)] flex items-center justify-center">
            <span className="text-festival-pink text-xs select-none">✦</span>
          </div>
        </div>

        {/* 5. Campaign Badge (Top-Left) */}
        {badge && (
          <div ref={badgeRef} className="absolute top-8 left-6 z-25 will-change-transform">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-deep-plum/90 border border-ochre-gold/70 text-ochre-gold font-body text-xs font-bold tracking-widest uppercase shadow-xl backdrop-blur-md">
              <span className="text-festival-pink">✦</span>
              <span>{badge}</span>
            </span>
          </div>
        )}

        {/* 6. Subtle Atmospheric Caption (Bottom-Center) */}
        {caption && (
          <figcaption
            ref={captionRef}
            className="absolute bottom-5 left-6 right-6 z-25 text-center will-change-transform"
          >
            <div className="inline-block max-w-2xl px-6 py-2 rounded-xl bg-deep-plum/85 border border-ochre-gold/30 backdrop-blur-md shadow-lg">
              <p className="font-body text-xs sm:text-sm md:text-base text-warm-cream/95 font-medium tracking-wide drop-shadow-md">
                {caption}
              </p>
            </div>
          </figcaption>
        )}
      </div>
    </figure>
  );
}
