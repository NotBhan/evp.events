'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { loadGsap } from '@/lib/gsap-loader';
import { MapPin, ArrowRight } from 'lucide-react';

export default function VenueFeature() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const overlayTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    let isCleanedUp = false;
    let cleanupFn: (() => void) | undefined;

    const initAnimation = () => {
      loadGsap().then(({ gsap }) => {
        if (isCleanedUp || !sectionRef.current) return;

        const mm = gsap.matchMedia();

        // 1. Reduced Motion Preference
        mm.add('(prefers-reduced-motion: reduce)', () => {
          gsap.set(
            [
              headerRef.current,
              frameRef.current,
              imgWrapRef.current,
              overlayTextRef.current,
            ],
            { opacity: 1, clearProps: 'all' }
          );
        });

        // 2. Full Motion Pass: Masked Reveal + Vertical Parallax
        mm.add('(prefers-reduced-motion: no-preference)', () => {
          if (headerRef.current) gsap.set(headerRef.current, { opacity: 0, y: 20 });
          if (frameRef.current) {
            gsap.set(frameRef.current, {
              clipPath: 'inset(6% 0% 6% 0%)',
              opacity: 0.85,
            });
          }
          if (overlayTextRef.current) {
            gsap.set(overlayTextRef.current, { opacity: 0, y: 25 });
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 88%',
              end: 'top 20%',
              toggleActions: 'play none none none',
            },
          });

          // Header reveals
          if (headerRef.current) {
            tl.to(headerRef.current, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 0);
          }

          // Frame masked reveal
          if (frameRef.current) {
            tl.to(
              frameRef.current,
              {
                clipPath: 'inset(0% 0% 0% 0%)',
                opacity: 1,
                duration: 0.75,
                ease: 'power3.inOut',
              },
              0.08
            );
          }

          // Overlay text slides up cleanly
          if (overlayTextRef.current) {
            tl.to(
              overlayTextRef.current,
              {
                opacity: 1,
                y: 0,
                duration: 0.55,
                ease: 'power2.out',
              },
              0.3
            );
          }

          // Continuous vertical parallax on the authentic venue photo
          if (imgWrapRef.current) {
            gsap.fromTo(
              imgWrapRef.current,
              { yPercent: -4 },
              {
                yPercent: 4,
                ease: 'none',
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1.2,
                },
              }
            );
          }
        });

        cleanupFn = () => mm.revert();
      });
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const handle = window.requestIdleCallback(initAnimation, { timeout: 2000 });
        return () => {
          isCleanedUp = true;
          window.cancelIdleCallback(handle);
          if (cleanupFn) cleanupFn();
        };
      } else {
        const timer = setTimeout(initAnimation, 150);
        return () => {
          isCleanedUp = true;
          clearTimeout(timer);
          if (cleanupFn) cleanupFn();
        };
      }
    }

    return () => {
      isCleanedUp = true;
      if (cleanupFn) cleanupFn();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="venue-feature"
      className="relative z-20 w-full bg-deep-plum text-warm-cream py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 border-t border-antique-gold/25 overflow-hidden"
      aria-label="Official Venue Feature - Chanakya BNR Hotel, Ranchi"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="flex flex-col lg:flex-row lg:items-end justify-between mb-14 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 text-bright-gold text-xs sm:text-sm font-body tracking-[0.15em] uppercase font-bold">
              <span className="text-vermilion">♦</span>
              <span>06 / THE FESTIVAL SETTING</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-black tracking-tight uppercase leading-[1.02]">
              ROYAL SETTING. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bright-gold via-antique-gold to-bright-gold drop-shadow-[0_2px_18px_rgba(243,198,76,0.35)]">
                RANCHI&apos;S NIGHT.
              </span>
            </h2>
          </div>

          <div className="max-w-lg space-y-2 font-body text-sm sm:text-base text-warm-cream/80 leading-relaxed font-light">
            <p>
              Upwan Lawn at Chanakya BNR Hotel provides the expansive open-air backdrop for Raas Utsav 2026, combining natural greenery with illuminated festival grandeur.
            </p>
          </div>
        </div>

        {/* Visually Dominant Panoramic Venue Showcase Frame */}
        <div
          ref={frameRef}
          className="relative w-full h-[460px] sm:h-[560px] md:h-[660px] lg:h-[720px] rounded-3xl overflow-hidden border-2 border-antique-gold/50 shadow-[0_24px_70px_rgba(0,0,0,0.85)] group"
        >
          {/* Authentic Client-Supplied Venue Photograph with Vertical Parallax */}
          <div ref={imgWrapRef} className="relative w-full h-[116%] -top-[8%]">
            <Image
              src="/images/client/venue-bnr-chanakya.jpg"
              alt="Upwan Lawn at Chanakya BNR Hotel, Ranchi - Official Venue for Raas Utsav 2026"
              fill
              sizes="(max-width: 1400px) 100vw, 1400px"
              className="object-cover object-center filter brightness-[0.88] contrast-[1.06]"
            />
          </div>

          {/* Saturated Ambient Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-deep-plum via-deep-plum/30 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-royal-maroon/40 via-transparent to-transparent pointer-events-none" />

          {/* Ornamental Inner Keyline & Corner Jewels */}
          <div className="absolute inset-3 sm:inset-4 rounded-2xl border border-antique-gold/30 pointer-events-none" />
          <span className="absolute top-5 left-5 text-bright-gold text-xs pointer-events-none select-none">♦</span>
          <span className="absolute top-5 right-5 text-bright-gold text-xs pointer-events-none select-none">♦</span>

          {/* Overlay Venue Typography & Action */}
          <div
            ref={overlayTextRef}
            className="absolute bottom-0 inset-x-0 p-6 sm:p-10 lg:p-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 z-10"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-deep-plum border border-antique-gold/50 text-bright-gold text-xs font-body font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-vermilion" />
                <span>OFFICIAL FESTIVAL GROUNDS</span>
              </div>
              <h3 className="font-display text-3xl sm:text-4xl md:text-5xl text-warm-cream tracking-tight uppercase leading-tight font-black drop-shadow-md">
                UPWAN LAWN · CHANAKYA BNR HOTEL
              </h3>
              <p className="font-body text-xs sm:text-sm text-warm-cream/80 max-w-xl">
                Historic hotel gardens hosting Jharkhand&apos;s grandest Dandiya night on 16 October 2026.
              </p>
            </div>

            <Link
              href="/about#venue"
              className="shrink-0 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-deep-plum border border-bright-gold/60 text-bright-gold font-display text-xs tracking-wider uppercase hover:bg-royal-maroon hover:border-bright-gold hover:scale-[1.03] transition-[transform,border-color,background-color] duration-200 font-bold shadow-lg"
            >
              <span>VENUE & CONTACT INFO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
