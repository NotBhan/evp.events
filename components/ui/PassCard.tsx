import React from 'react';
import Link from 'next/link';
import { PassTier } from '@/data/eventData';
import { Ticket, Check } from 'lucide-react';

interface PassCardProps {
  pass: PassTier;
}

/**
 * PassCard - Festival Ticket-Stub Component
 *
 * Implements ticket-inspired visual styling:
 * - Scalloped edge notches
 * - Deep plum / royal maroon card body with gold keylines
 * - Exact client pass prices and admit categories
 * - Action button scrolling to /services#booking
 */
export default function PassCard({ pass }: PassCardProps) {
  const isHighlighted = !!pass.badge;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl bg-card-surface border transition-[transform,border-color,box-shadow] duration-200 p-6 sm:p-8 hover:-translate-y-1 ${
        isHighlighted
          ? 'border-bright-gold shadow-[0_4px_30px_rgba(243,198,76,0.25)]'
          : 'border-antique-gold/30 hover:border-antique-gold/70'
      }`}
    >
      {/* Decorative Top Perforation Notch */}
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-2.5 bg-deep-plum rounded-b-full border-b border-l border-r border-antique-gold/40" />

      <div>
        {/* Tier Header & Optional Badge */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-vermilion/20 border border-vermilion flex items-center justify-center text-vermilion">
            <Ticket className="w-5 h-5 text-bright-gold" />
          </div>
          {pass.badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-body text-[11px] font-bold tracking-widest uppercase shadow-sm">
              <span className="text-bright-gold text-[10px]" aria-hidden="true">✦</span>
              <span>{pass.badge}</span>
            </span>
          )}
        </div>

        <div className="text-[10px] tracking-widest text-bright-gold uppercase font-bold mb-1">
          {pass.category} · ADMIT {pass.admitCount}
        </div>

        <h3 className="font-display text-3xl sm:text-4xl text-warm-cream tracking-wide mb-2 uppercase">
          {pass.name}
        </h3>

        <div className="font-display text-4xl text-bright-gold mb-3 font-bold">
          {pass.priceDisplay}
        </div>

        <p className="font-body text-xs sm:text-sm text-warm-cream/75 mb-6 leading-relaxed">
          {pass.description}
        </p>

        {/* Decorative Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-antique-gold/40 to-transparent mb-6" />

        {/* Feature List */}
        <div className="mb-8">
          <span className="font-body text-[10px] text-bright-gold uppercase tracking-[0.2em] font-bold block mb-3">
            PASS DETAILS
          </span>
          <ul className="space-y-3">
            {pass.inclusions.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-body text-warm-cream/90">
                <span className="text-bright-gold text-xs shrink-0 mt-0.5">♦</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-antique-gold/20">
        <Link
          href={`/booking?pass=${pass.id}`}
          className="w-full py-3 px-5 rounded-lg bg-gradient-to-r from-vermilion via-amber-glow to-vermilion bg-[length:200%_auto] hover:bg-right text-warm-cream font-display text-base tracking-wider uppercase border border-antique-gold/70 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-[transform,box-shadow,background-position] duration-200 text-center flex items-center justify-center gap-2 font-bold"
        >
          <span>BOOK THIS PASS</span>
          <span className="text-bright-gold">→</span>
        </Link>
        <span className="block text-center text-[10px] text-warm-cream/50 mt-2 italic font-body">
          Direct desk reservation • Zero extra convenience fees
        </span>
      </div>
    </div>
  );
}
