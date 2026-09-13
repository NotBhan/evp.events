'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { eventData } from '@/data/eventData';
import { Ticket, ArrowRight, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// PassPreview.tsx
export default function PassPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsWrapRef = useRef<HTMLDivElement>(null);
  const infoStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const mm = gsap.matchMedia();

    // 1. Reduced Motion Preference
    mm.add('(prefers-reduced-motion: reduce)', () => {
      const cards = cardsWrapRef.current?.querySelectorAll('.pass-ticket-card');
      gsap.set([headerRef.current, infoStripRef.current, ...(cards ? Array.from(cards) : [])], {
        opacity: 1,
        clearProps: 'all',
      });
    });

    // 2. Full Motion Pass: Horizontal Editorial Sequence Stagger
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (headerRef.current) gsap.set(headerRef.current, { opacity: 0, y: 20 });
      if (infoStripRef.current) gsap.set(infoStripRef.current, { opacity: 0, y: 25 });

      const cards = cardsWrapRef.current?.querySelectorAll('.pass-ticket-card');
      if (cards && cards.length) {
        cards.forEach((card, i) => {
          const customY = 20 + (i % 3) * 6;
          gsap.set(card, { opacity: 0, y: customY, scale: 0.97 });
        });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 88%',
          end: 'top 20%',
          toggleActions: 'play none none none',
        },
      });

      // Heading reveals
      if (headerRef.current) {
        tl.to(headerRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0);
      }

      // 5 Ticket cards stagger in
      if (cards && cards.length) {
        tl.to(
          cards,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            stagger: 0.05,
            ease: 'power3.out',
          },
          0.08
        );
      }

      // Booking strip & action reveals after cards
      if (infoStripRef.current) {
        tl.to(
          infoStripRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            ease: 'power2.out',
          },
          0.26
        );
      }
    });

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="passes-preview"
      className="relative z-20 w-full bg-deep-plum text-warm-cream py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 border-t border-antique-gold/25"
      aria-label="Festival Passes Preview"
    >
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 text-bright-gold text-xs sm:text-sm font-body tracking-[0.3em] uppercase font-bold">
              <span className="text-vermilion">♦</span>
              <span>05 / PASS CATEGORIES & ADMISSION</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white font-black tracking-tight uppercase leading-[1.05]">
              PREMIUM ACCESS. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bright-gold via-antique-gold to-bright-gold drop-shadow-[0_2px_18px_rgba(243,198,76,0.35)]">
                SIMPLE BOOKING.
              </span>
            </h2>
          </div>
          <p className="font-body text-sm sm:text-base text-warm-cream/80 max-w-md leading-relaxed font-light">
            Five confirmed pass categories tailored for solo attendees, couples, families, and student or corporate groups. All reservations handled directly with Event Point.
          </p>
        </div>

        {/* 5 Physical Ticket-Stub Cards Grid */}
        <div
          ref={cardsWrapRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5 mb-14"
        >
          {eventData.passes.map((pass, index) => {
            const isPopular = pass.badge === 'POPULAR' || pass.id === 'couple';

            return (
              <div
                key={pass.id}
                className={`pass-ticket-card relative rounded-2xl bg-gradient-to-b from-card-surface via-royal-maroon/30 to-card-surface border-2 p-6 flex flex-col justify-between overflow-hidden group transition-[border-color,box-shadow] duration-200 hover:border-bright-gold shadow-xl ${
                  isPopular
                    ? 'border-bright-gold/70 shadow-[0_8px_30px_rgba(243,198,76,0.2)] ring-1 ring-bright-gold/30'
                    : 'border-antique-gold/40'
                }`}
              >
                {/* Physical Ticket Notches (Cutouts on Left and Right) */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-deep-plum border border-antique-gold/50 pointer-events-none shadow-inner" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-deep-plum border border-antique-gold/50 pointer-events-none shadow-inner" />

                {/* Perforated Stub Divider Guideline */}
                <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-antique-gold/20 pointer-events-none" />

                {/* Top Section: Pass Category & Serial */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-royal-maroon border border-antique-gold/50 text-[10px] font-body font-bold text-bright-gold uppercase tracking-wider">
                      {pass.badge || pass.category}
                    </span>
                    <span className="font-mono text-[10px] text-antique-gold/60 tracking-wider">
                      RU26-0{index + 1}
                    </span>
                  </div>

                  <h3 className="font-display text-lg sm:text-xl text-warm-cream tracking-tight uppercase mb-1 font-bold group-hover:text-bright-gold transition-colors">
                    {pass.name}
                  </h3>
                  <p className="font-body text-xs text-warm-cream/70 mb-4">
                    {pass.description}
                  </p>
                </div>

                {/* Bottom Section: Verified Price & Booking Action */}
                <div className="relative z-10 pt-8 mt-2">
                  <div className="mb-4">
                    <span className="font-body text-[10px] uppercase tracking-widest text-antique-gold/80 block font-semibold">
                      OFFICIAL PRICE
                    </span>
                    <span className="font-display text-3xl sm:text-4xl text-bright-gold font-black tracking-tight drop-shadow-[0_2px_12px_rgba(243,198,76,0.3)]">
                      {pass.priceDisplay}
                    </span>
                  </div>

                  <Link
                    href={`/booking?pass=${pass.id}`}
                    className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-display text-xs tracking-wider uppercase font-bold transition-[transform,border-color,background-color] duration-200 ${
                      isPopular
                        ? 'bg-gradient-to-r from-vermilion to-amber-glow text-deep-plum font-black shadow-md hover:scale-[1.03]'
                        : 'bg-deep-plum/90 border border-antique-gold/50 text-bright-gold hover:bg-royal-maroon hover:border-bright-gold'
                    }`}
                  >
                    <span>SELECT PASS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Direct Organizer Coordination Banner */}
        <div
          ref={infoStripRef}
          className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-card-surface via-royal-maroon/40 to-card-surface border border-antique-gold/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-deep-plum border border-bright-gold/50 flex items-center justify-center shrink-0 text-bright-gold shadow-sm">
              <ShieldCheck className="w-6 h-6 text-bright-gold" />
            </div>
            <div>
              <span className="font-display text-base sm:text-lg text-warm-cream font-bold block">
                Direct Organizer Coordination
              </span>
              <p className="font-body text-xs sm:text-sm text-warm-cream/75">
                All reservations handled directly by {eventData.organizer.name} without third-party platform markups or convenience fees.
              </p>
            </div>
          </div>

          <Link
            href="/booking"
            className="shrink-0 inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-bright-gold text-deep-plum font-display text-sm tracking-wider uppercase shadow-[0_4px_20px_rgba(217,37,36,0.35)] hover:shadow-[0_6px_28px_rgba(243,198,76,0.5)] hover:scale-[1.03] transition-[transform,box-shadow] duration-200 font-black"
          >
            <Ticket className="w-4 h-4 text-deep-plum" />
            <span>VIEW PASSES & BOOK</span>
            <ArrowRight className="w-4 h-4 text-deep-plum stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
