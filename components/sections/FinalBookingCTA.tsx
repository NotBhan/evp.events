'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { eventData } from '@/data/eventData';
import { Ticket, Phone, Mail, MessageSquare, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function FinalBookingCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaButtonsRef = useRef<HTMLDivElement>(null);
  const helplineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const mm = gsap.matchMedia();

    // 1. Reduced Motion Preference
    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(
        [
          glowRef.current,
          cardRef.current,
          eyebrowRef.current,
          headlineRef.current,
          subtitleRef.current,
          ctaButtonsRef.current,
          helplineRef.current,
        ],
        { opacity: 1, clearProps: 'all' }
      );
    });

    // 2. Full Motion Pass: Culmination Reveal
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (cardRef.current) gsap.set(cardRef.current, { opacity: 0, y: 35, scale: 0.97 });
      if (glowRef.current) gsap.set(glowRef.current, { opacity: 0, scale: 0.8 });
      if (eyebrowRef.current) gsap.set(eyebrowRef.current, { opacity: 0, y: 15 });
      if (headlineRef.current) gsap.set(headlineRef.current, { opacity: 0, y: 25 });
      if (subtitleRef.current) gsap.set(subtitleRef.current, { opacity: 0, y: 15 });
      if (ctaButtonsRef.current) gsap.set(ctaButtonsRef.current, { opacity: 0, scale: 0.95 });
      if (helplineRef.current) gsap.set(helplineRef.current, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 88%',
          end: 'top 20%',
          toggleActions: 'play none none none',
        },
      });

      // Card emerges
      if (cardRef.current) {
        tl.to(
          cardRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.75,
            ease: 'power3.out',
          },
          0
        );
      }

      // Glow expands softly
      if (glowRef.current) {
        tl.to(
          glowRef.current,
          {
            opacity: 0.65,
            scale: 1.2,
            duration: 1,
            ease: 'power2.out',
          },
          0
        );
      }

      // Eyebrow
      if (eyebrowRef.current) {
        tl.to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.5 }, 0.15);
      }

      // Monumental headline
      if (headlineRef.current) {
        tl.to(
          headlineRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: 'power2.out',
          },
          0.25
        );
      }

      // Subtitle
      if (subtitleRef.current) {
        tl.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.5 }, 0.35);
      }

      // CTA Buttons
      if (ctaButtonsRef.current) {
        tl.to(
          ctaButtonsRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.55,
            ease: 'back.out(1.4)',
          },
          0.45
        );
      }

      // Helpline info
      if (helplineRef.current) {
        tl.to(helplineRef.current, { opacity: 1, duration: 0.5 }, 0.55);
      }
    });

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="final-cta"
      className="relative z-20 w-full bg-deep-plum text-warm-cream py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 border-t border-antique-gold/30 overflow-hidden"
      aria-label="Final Booking Callout"
    >
      <div className="max-w-6xl mx-auto text-center relative">
        {/* Ambient Radial Festive Glow Field */}
        <div
          ref={glowRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(217,37,36,0.18) 0%, transparent 70%)' }}
        />

        <div
          ref={cardRef}
          className="relative z-10 p-10 sm:p-16 md:p-20 rounded-3xl bg-gradient-to-br from-royal-maroon via-deep-plum to-card-surface border-2 border-antique-gold/50 shadow-2xl overflow-hidden"
        >
          {/* Corner Diamonds */}
          <span className="absolute top-4 left-4 text-bright-gold text-xs select-none">♦</span>
          <span className="absolute top-4 right-4 text-bright-gold text-xs select-none">♦</span>
          <span className="absolute bottom-4 left-4 text-bright-gold text-xs select-none">♦</span>
          <span className="absolute bottom-4 right-4 text-bright-gold text-xs select-none">♦</span>

          {/* Eyebrow */}
            <div
              ref={eyebrowRef}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-deep-plum border border-bright-gold/50 text-bright-gold text-xs font-body uppercase tracking-[0.25em] font-semibold mb-8 shadow-md"
            >
              <span className="text-vermilion text-xs" aria-hidden="true">♦</span>
              <span>JHARKHAND&apos;S GRANDEST DANDIYA NIGHT</span>
            </div>

          {/* Monumental Concluding Typography */}
          <h2
            ref={headlineRef}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-bold tracking-tight uppercase mb-6 leading-none"
          >
            LET&apos;S <span className="text-bright-gold drop-shadow-[0_2px_20px_rgba(243,198,76,0.4)]">CELEBRATE.</span>
          </h2>

          <p
            ref={subtitleRef}
            className="font-body text-base sm:text-lg text-warm-cream/85 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Five confirmed pass categories starting at ₹999. Reserve your spot for 16 October 2026 at Upwan Lawn, Chanakya BNR Hotel, Ranchi.
          </p>

          {/* Primary Action Button */}
          <div
            ref={ctaButtonsRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link
              href="/booking"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-vermilion bg-[length:200%_auto] hover:bg-right text-warm-cream font-display text-xl tracking-wider uppercase shadow-[0_4px_30px_rgba(217,37,36,0.55)] border-2 border-antique-gold/80 hover:scale-[1.03] transition-[transform,box-shadow,background-position] duration-200 font-bold"
            >
              <Ticket className="w-5 h-5 text-bright-gold" />
              <span>RESERVE YOUR PASS</span>
              <ArrowRight className="w-5 h-5 text-bright-gold" />
            </Link>

            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-deep-plum/90 hover:bg-deep-plum text-warm-cream border border-antique-gold/50 hover:border-bright-gold font-display text-lg tracking-wider uppercase transition-colors"
            >
              <span>Contact Organizers</span>
            </Link>
          </div>

          {/* Quick Helplines & Attributions */}
          <div
            ref={helplineRef}
            className="pt-8 border-t border-antique-gold/25 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-body text-warm-cream/80"
          >
            <div className="flex items-center justify-center gap-2">
              <Phone className="w-4 h-4 text-bright-gold" />
              <span>Call: {eventData.contacts.phones[0]}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-400" />
              <span>WhatsApp Helpline Available</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4 text-amber-glow" />
              <span>{eventData.contact.enquiryEmail}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
