'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Mandala from '../decorations/Mandala';

gsap.registerPlugin(ScrollTrigger);

interface FolioRevealProps {
  src: string;
  alt: string;
  caption?: string;
  badge?: string;
  aspectRatio?: '16/9' | '4/3' | '3/2' | '3/4' | '1/1';
  priority?: boolean;
  className?: string;
}

/**
 * FolioReveal Component
 *
 * An illustrated festival photo folio opening for editorial celebration photography.
 * - Cover features the same festival campaign identity: deep plum, gold keylines,
 *   subtle folk borders, and an embossed archival seal.
 * - Reveal uses a restrained slide with a gentle 3-degree tilt (no exaggerated 3D)
 * - Remains strictly secondary to the story image beneath
 * - Full prefers-reduced-motion fallback
 */
export default function FolioReveal({
  src,
  alt,
  caption,
  badge,
  aspectRatio = '3/4',
  priority = false,
  className = '',
}: FolioRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const aspectClasses = {
    '16/9': 'aspect-[16/9]',
    '4/3': 'aspect-[4/3]',
    '3/2': 'aspect-[3/2]',
    '3/4': 'aspect-[3/4]',
    '1/1': 'aspect-square',
  }[aspectRatio];

  useEffect(() => {
    const container = containerRef.current;
    const cover = coverRef.current;
    const imgEl = imageRef.current;
    const captionEl = captionRef.current;
    const badgeEl = badgeRef.current;

    if (!container || !cover || !imgEl) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set(cover, { display: 'none' });
      gsap.set(imgEl, { scale: 1 });
      if (captionEl) gsap.set(captionEl, { opacity: 1, y: 0 });
      if (badgeEl) gsap.set(badgeEl, { opacity: 1, y: 0 });
      return;
    }

    let hasRevealed = false;

    // Initial States
    gsap.set(cover, { xPercent: 0, rotation: 0, opacity: 1 });
    gsap.set(imgEl, { scale: 1.04 });
    if (badgeEl) gsap.set(badgeEl, { opacity: 0, y: -6 });
    if (captionEl) gsap.set(captionEl, { opacity: 0, y: 6 });

    const playReveal = () => {
      if (hasRevealed) return;
      hasRevealed = true;

      const tl = gsap.timeline();

      // Subtle Folio Slide & Gentle Rotation (Snappy, non-gimmicky)
      tl.to(cover, {
        xPercent: -104,
        rotation: -3,
        opacity: 0,
        duration: 1.05,
        ease: 'power2.inOut',
      }, 0)
        .to(imgEl, {
          scale: 1,
          duration: 1.2,
          ease: 'power2.out',
        }, 0.1);

      if (badgeEl) {
        tl.to(badgeEl, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        }, 0.5);
      }

      if (captionEl) {
        tl.to(captionEl, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        }, 0.6);
      }
    };

    // 1. Native IntersectionObserver for reliable viewport intersection
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

    // 2. GSAP ScrollTrigger for Lenis scroll synchronization
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
      className={`relative group overflow-hidden rounded-3xl border-2 border-ochre-gold/50 shadow-2xl transition-[border-color,box-shadow] duration-200 hover:border-ochre-gold ${className}`}
      aria-label="Festival Celebration Archive Folio"
    >
      {/* Outer Keyline Double Border Frame */}
      <div className="absolute inset-1.5 rounded-2xl border border-ochre-gold/20 pointer-events-none z-30 transition-colors group-hover:border-ochre-gold/45" />

      {/* Decorative Corner Filigree Diamonds */}
      <span className="absolute top-2.5 left-2.5 text-ochre-gold text-xs z-30 pointer-events-none select-none drop-shadow">♦</span>
      <span className="absolute top-2.5 right-2.5 text-ochre-gold text-xs z-30 pointer-events-none select-none drop-shadow">♦</span>
      <span className="absolute bottom-2.5 left-2.5 text-ochre-gold text-xs z-30 pointer-events-none select-none drop-shadow">♦</span>
      <span className="absolute bottom-2.5 right-2.5 text-ochre-gold text-xs z-30 pointer-events-none select-none drop-shadow">♦</span>

      {/* Aspect Ratio Container (Strictly Overflow Hidden) */}
      <div className={`relative w-full ${aspectClasses} overflow-hidden bg-deep-plum`}>
        {/* 1. Underlying Photograph */}
        <div ref={imageRef} className="absolute inset-0 w-full h-full will-change-transform">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            className="object-cover object-center"
          />

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-deep-plum/90 via-deep-plum/20 to-transparent pointer-events-none z-10" />
        </div>

        {/* 2. Illustrated Folio Cover (Conceals image initially) */}
        <div
          ref={coverRef}
          className="absolute inset-0 z-20 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#24133d] via-[#1D1237] to-[#140a25] border-r-2 border-ochre-gold/60 will-change-transform"
          aria-hidden="true"
        >
          {/* Top Folio Ribbon Header */}
          <div className="w-full flex items-center justify-between border-b border-ochre-gold/30 pb-3">
            <span className="text-[10px] text-ochre-gold font-body tracking-[0.14em] uppercase font-bold">
              EST. 2026
            </span>
            <span className="text-festival-pink text-xs">✦ ✦ ✦</span>
            <span className="text-[10px] text-ochre-gold font-body tracking-[0.14em] uppercase font-bold">
              NAVRATRI FOLIO
            </span>
          </div>

          {/* Central Embossed Seal */}
          <div className="relative flex flex-col items-center text-center my-auto p-4">
            {/* Soft Ambient Mandala Watermark */}
            <div className="w-36 h-36 opacity-15 text-ochre-gold mb-2">
              <Mandala size={144} className="animate-spin-slower" />
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full border-2 border-ochre-gold/80 bg-royal-purple/60 flex items-center justify-center mb-2 shadow-lg">
                <span className="text-ochre-gold text-lg font-display">✦</span>
              </div>
              <h4 className="font-display text-2xl text-warm-cream tracking-wider uppercase mb-1">
                FESTIVAL ARCHIVES
              </h4>
              <span className="font-body text-[11px] text-ochre-gold tracking-[0.12em] uppercase font-semibold">
                GARBA RAAS • MOMENTS
              </span>
            </div>
          </div>

          {/* Bottom Folio Badge */}
          <div className="w-full border-t border-ochre-gold/30 pt-3 flex items-center justify-between">
            <span className="text-warm-cream/60 font-body text-[10px] uppercase tracking-wider">
              TAP OR SCROLL TO OPEN
            </span>
            <span className="w-2 h-2 rounded-full bg-festival-pink" />
          </div>
        </div>

        {/* 3. Campaign Badge (Top-Left) */}
        {badge && (
          <div ref={badgeRef} className="absolute top-4 left-4 z-25 will-change-transform">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-deep-plum border border-ochre-gold/60 text-ochre-gold font-body text-[10px] sm:text-xs font-bold tracking-widest uppercase shadow-lg">
              <span className="text-festival-pink">✦</span>
              <span>{badge}</span>
            </span>
          </div>
        )}

        {/* 4. Caption (Bottom-Center) */}
        {caption && (
          <figcaption
            ref={captionRef}
            className="absolute bottom-3 left-4 right-4 z-25 text-center will-change-transform"
          >
            <div className="inline-block px-4 py-1.5 rounded-lg bg-deep-plum/95 border border-ochre-gold/40 shadow-lg">
              <p className="font-body text-xs sm:text-sm text-warm-cream/95 font-medium drop-shadow-md">
                {caption}
              </p>
            </div>
          </figcaption>
        )}
      </div>
    </figure>
  );
}
