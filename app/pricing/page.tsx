import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { eventData } from '@/data/eventData';
import { Ticket, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: `Official Pass Pricing & Tiers | ${eventData.eventName} ${eventData.year}`,
  description: `Transparent pricing and pass categories for ${eventData.eventName} ${eventData.year} on ${eventData.dateDisplay} at ${eventData.venueDisplay}. Solo, Couple, VIP, Family, and Group passes.`,
};

export default function PricingPage() {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />

      <div className="pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Page Breadcrumb / Eyebrow */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-royal-maroon/80 border border-antique-gold/40 text-bright-gold text-[11px] uppercase tracking-[0.14em] font-bold mb-4">
            <span>✦</span>
            <span>TRANSPARENT TICKET CATALOG</span>
            <span>✦</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-warm-cream font-bold tracking-tight uppercase leading-tight">
            OFFICIAL PASS PRICING
          </h1>

          <div className="h-0.5 max-w-xs mx-auto bg-gradient-to-r from-transparent via-bright-gold to-transparent my-4" />

          <p className="font-body text-sm sm:text-base text-warm-cream/80 max-w-2xl mx-auto leading-relaxed">
            Direct, server-authoritative rates for {eventData.eventName} {eventData.year}. Held at {eventData.venueDisplay} on {eventData.dateDisplay}.
          </p>

          <div className="mt-6 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-royal-maroon/80 border border-antique-gold/50 text-xs sm:text-sm font-body text-bright-gold font-semibold shadow-lg">
            <span>✦</span>
            <span>All listed pass prices are inclusive of applicable GST.</span>
            <span>✦</span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16 items-stretch">
          {eventData.passes.map((tier) => {
            const isVip = tier.id === 'vip';

            return (
              <div
                key={tier.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between border-2 transition-all duration-300 shadow-xl ${
                  isVip
                    ? 'bg-gradient-to-b from-royal-maroon/90 via-deep-plum to-card-surface border-bright-gold shadow-[0_4px_28px_rgba(255,183,3,0.15)]'
                    : 'bg-card-surface border-antique-gold/40 hover:border-antique-gold/80'
                }`}
              >
                {/* Badge if available */}
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream text-[10px] font-body font-bold uppercase tracking-wider border border-antique-gold shadow-md">
                    {tier.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-body text-bright-gold uppercase tracking-wider font-semibold">
                      {tier.category}
                    </span>
                    <span className="text-[11px] font-body text-warm-cream/60">
                      Admit: {tier.admitCount} {tier.admitCount === 1 ? 'person' : 'people'}
                    </span>
                  </div>

                  <h2 className="font-display text-2xl text-warm-cream uppercase tracking-wide mb-3">
                    {tier.name}
                  </h2>

                  <div className="flex items-baseline gap-1 mb-6 pb-4 border-b border-antique-gold/20">
                    <span className="text-2xl sm:text-3xl font-display text-bright-gold font-bold">
                      ₹{tier.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-warm-cream/60 font-body">/ pass</span>
                  </div>

                  {/* Inclusions list */}
                  <div className="space-y-2.5 mb-8">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-warm-cream/50 block">
                      WHAT&apos;S INCLUDED:
                    </span>
                    {tier.inclusions.map((inc, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs font-body text-warm-cream/85">
                        <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-antique-gold/20">
                  <Link
                    href={`/booking?pass=${tier.id}`}
                    className={`w-full py-3.5 px-4 rounded-xl font-display text-sm tracking-wider uppercase font-bold flex items-center justify-center gap-2 transition-all ${
                      isVip
                        ? 'bg-gradient-to-r from-vermilion via-amber-glow to-vermilion text-warm-cream shadow-lg hover:scale-[1.02] border border-antique-gold/70'
                        : 'bg-royal-maroon/90 hover:bg-royal-maroon text-warm-cream border border-antique-gold/50 hover:border-bright-gold'
                    }`}
                  >
                    <span>BOOK THIS PASS</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing Transparency & Booking Policy Notes */}
        <section className="rounded-3xl bg-card-surface border-2 border-antique-gold/30 p-6 sm:p-10 mb-12 shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-antique-gold/20 pb-4">
            <ShieldCheck className="w-6 h-6 text-bright-gold shrink-0" />
            <h2 className="font-display text-xl sm:text-2xl text-warm-cream uppercase tracking-wide">
              PRICING TRANSPARENCY &amp; DISCLOSURES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 font-body text-xs sm:text-sm text-warm-cream/80 leading-relaxed">
            <div className="space-y-3">
              <h3 className="font-bold text-bright-gold uppercase text-xs tracking-wider">
                Server-Authoritative Pricing
              </h3>
              <p>
                All pass amounts shown are in Indian Rupees (INR) and are strictly authoritative. The price selected at checkout is validated directly against the server inventory and cannot be altered on the client device.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-bright-gold uppercase text-xs tracking-wider">
                24-Hour Reservation Hold
              </h3>
              <p>
                Submitting a pass reservation reserves your slot for up to 24 hours. If payment is not completed within this reservation window, the held allocation automatically expires and returns to the general festival pool.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-bright-gold uppercase text-xs tracking-wider">
                Digital Pass Fulfillment
              </h3>
              <p>
                Passes are priced and fulfilled digitally only: each confirmed booking issues an instant booking confirmation receipt with its entry QR upon verified payment. No physical ticket is printed, posted or handed out, and there are zero shipping, courier or physical delivery fees.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-bright-gold uppercase text-xs tracking-wider">
                GST-Inclusive Ticket Rates
              </h3>
              <p>
                All listed pass prices are inclusive of applicable GST. Pass rates (Solo ₹999, VIP ₹1,499, Couple ₹1,999, Family ₹3,599, Group ₹4,999) represent the complete customer payable amount. No additional tax is charged at checkout.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-antique-gold/20 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-body text-warm-cream/70 text-center md:text-left">
            <span>
              Business: <strong className="text-warm-cream">{eventData.business.name}</strong> · Legal Name / Proprietor: <strong className="text-warm-cream">{eventData.business.legalName}</strong> ({eventData.business.constitution}) · GSTIN: <strong className="text-bright-gold">{eventData.business.gstin}</strong>
            </span>
            <span>Helpline: {eventData.business.phone}</span>
            <span>Venue: Upwan Lawn, Chanakya BNR Hotel, Ranchi</span>
          </div>
        </section>

        {/* Action Links */}
        <div className="text-center">
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-vermilion text-warm-cream font-display text-base tracking-wider uppercase font-bold border border-antique-gold/70 shadow-lg hover:scale-[1.02] transition-transform"
          >
            <Ticket className="w-5 h-5 text-bright-gold" />
            <span>PROCEED TO PASS BOOKING</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
