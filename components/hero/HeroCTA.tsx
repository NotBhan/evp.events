import React from 'react';
import Link from 'next/link';
import { eventData } from '@/data/eventData';
import { Ticket, ArrowRight } from 'lucide-react';

interface HeroCTAProps {
  className?: string;
}

/**
 * HeroCTA - Poster Campaign Ticket Badges
 *
 * Designed to feel like authentic printed festival campaign tickets/badges
 * rather than generic web SaaS buttons:
 * - Primary "BOOK A PASS": Bold festival badge with ticket-stub styling,
 *   gold border keyline, and radiant festive gradient.
 * - Secondary "EXPLORE EVENT": Visually quieter editorial frame button.
 */
export default function HeroCTA({ className = '' }: HeroCTAProps) {
  return (
    <div
      className={`relative z-30 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-xl mx-auto px-4 ${className}`}
    >
      {/* Primary CTA: Festival Ticket Campaign Badge */}
      <Link
        href="/booking"
        id="hero-primary-cta"
        className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 sm:gap-3 px-6 sm:px-8 py-3 sm:py-3.5 min-h-[46px] sm:min-h-[48px] whitespace-nowrap shrink-0 rounded-lg bg-gradient-to-r from-vermilion via-amber-glow to-vermilion bg-[length:200%_auto] hover:bg-right text-warm-cream font-display text-base sm:text-lg tracking-wider uppercase shadow-[0_4px_24px_rgba(217,37,36,0.45)] border-2 border-antique-gold/80 transition-[border-color,box-shadow,background-position] duration-300 hover:border-bright-gold hover:shadow-[0_6px_32px_rgba(255,148,41,0.6)] focus:outline-none focus:ring-2 focus:ring-bright-gold focus:ring-offset-2 focus:ring-offset-deep-plum cursor-pointer"
        aria-label="Book passes for Raas Utsav 2026"
      >
        {/* Decorative Ticket Perforation Dots on Left & Right */}
        <span className="w-1.5 h-1.5 rounded-full bg-deep-plum border border-antique-gold/60 shrink-0" />
        <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-bright-gold transition-transform duration-300 group-hover:rotate-12 shrink-0" />
        <span className="drop-shadow-sm whitespace-nowrap font-bold">{eventData.ctas.primary}</span>
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 shrink-0" />
        <span className="w-1.5 h-1.5 rounded-full bg-deep-plum border border-antique-gold/60 shrink-0" />
      </Link>

      {/* Secondary CTA: Opaque Festival Editorial Action (zero text transparency, isolated) */}
      <Link
        href="/services"
        id="hero-secondary-cta"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3.5 min-h-[44px] sm:min-h-[48px] whitespace-nowrap shrink-0 rounded-lg bg-[#220D1A] hover:bg-royal-maroon text-warm-cream hover:text-bright-gold font-display text-sm sm:text-base tracking-widest uppercase border border-antique-gold/60 hover:border-bright-gold shadow-[0_2px_12px_rgba(0,0,0,0.6)] transition-[background-color,border-color,color] duration-200 focus:outline-none focus:ring-2 focus:ring-warm-cream focus:ring-offset-2 focus:ring-offset-deep-plum cursor-pointer"
        aria-label="Explore festival experience"
      >
        <span className="whitespace-nowrap font-medium">{eventData.ctas.secondary}</span>
      </Link>
    </div>
  );
}
