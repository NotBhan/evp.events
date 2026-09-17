import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { eventData } from '@/data/eventData';
import { Scale, FileText, ShieldCheck, RefreshCw, Truck, HelpCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: `Policies & Legal Centre | ${eventData.eventName} ${eventData.year}`,
  description: `Central policies for ${eventData.eventName} ${eventData.year}: terms & conditions, privacy, cancellation & refunds, digital pass fulfillment, and FAQ.`,
};

const POLICY_CARDS = [
  {
    href: '/terms-and-conditions',
    title: 'Terms & Conditions',
    icon: FileText,
    description:
      'Booking rules, Pay Now and Pay Later, the 24-hour payment deadline, booking expiry, pass validity and event guidelines.',
  },
  {
    href: '/privacy-policy',
    title: 'Privacy Policy',
    icon: ShieldCheck,
    description:
      'What customer data we collect, why we collect it, how booking and payment data is used, and how it is safeguarded.',
  },
  {
    href: '/refund-and-cancellation',
    title: 'Cancellation & Refund Policy',
    icon: RefreshCw,
    description:
      'Cancellation deadline (6 October 2026), how to cancel, how to request a refund, the GST-inclusive refund calculation, and checked-in booking rules.',
  },
  {
    href: '/shipping-policy',
    title: 'Pass Delivery & Fulfillment',
    icon: Truck,
    description:
      'Why passes are digital only: instant electronic confirmation, receipt recovery, and the fact that no physical ticket is printed, posted or couriered.',
  },
  {
    href: '/faq',
    title: 'FAQ',
    icon: HelpCircle,
    description:
      'Quick answers on payment options, Pay Later expiry, cancellation, refunds, QR entry, duplicate scans and support contacts.',
  },
];

export default function PoliciesPage() {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />

      <div className="pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-royal-maroon/80 border border-antique-gold/40 text-bright-gold text-[11px] uppercase tracking-[0.14em] font-bold mb-4">
            <Scale className="w-3.5 h-3.5 text-bright-gold" />
            <span>POLICIES &amp; LEGAL</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl text-warm-cream font-bold tracking-tight uppercase leading-tight">
            POLICIES CENTRE
          </h1>

          <div className="h-0.5 max-w-xs mx-auto bg-gradient-to-r from-transparent via-bright-gold to-transparent my-4" />

          <p className="font-body text-xs sm:text-sm text-warm-cream/80 max-w-xl mx-auto leading-relaxed">
            Every policy that applies to booking a pass for {eventData.eventName} {eventData.year} — payments,
            cancellation, refunds, privacy and pass delivery — in one place.
          </p>

          <span className="inline-block mt-3 text-[11px] font-body text-antique-gold/70">
            Last Updated: September 2026 · Effective for {eventData.year} Edition
          </span>
        </div>

        {/* Policy cards */}
        <div className="space-y-10 font-body text-xs sm:text-sm text-warm-cream/90 leading-relaxed">
          <section className="grid gap-4 sm:grid-cols-2">
            {POLICY_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group p-5 sm:p-6 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-2.5 transition-colors hover:border-bright-gold/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-bright-gold"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-5 h-5 text-bright-gold shrink-0" />
                    <h2 className="font-display text-base sm:text-lg text-bright-gold uppercase tracking-wider">
                      {card.title}
                    </h2>
                  </div>
                  <p className="text-warm-cream/85 leading-relaxed">{card.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-warm-cream/70 group-hover:text-bright-gold">
                    <span>Read policy</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              );
            })}
          </section>

          {/* Summary of key rules */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider">
              KEY RULES AT A GLANCE
            </h2>
            <ul className="space-y-2 list-disc list-inside text-warm-cream/85">
              <li>
                <strong>Pay Now or Pay Later:</strong> you may pay immediately, or keep the booking pending and
                complete payment within 24 hours of booking.
              </li>
              <li>
                <strong>24-hour payment deadline:</strong> fixed at booking, shown on your booking, and it never
                restarts if you revisit or retry. Unpaid bookings expire and the reserved pass is released.
              </li>
              <li>
                <strong>Cancellation deadline:</strong> confirmed and paid bookings can be cancelled until
                6 October 2026 (11:59:59 PM IST).
              </li>
              <li>
                <strong>Refunds:</strong> requested separately through support after cancellation, returned to the
                original payment method, with only the embedded 18% GST component deducted
                (Gross Paid Amount × 100 / 118).
              </li>
              <li>
                <strong>Checked-in bookings:</strong> once a pass is admitted at the venue it cannot be cancelled
                or refunded.
              </li>
              <li>
                <strong>Entry QR:</strong> issued only for confirmed and paid bookings, and admission requires the
                QR plus an authenticated organiser check at the gate.
              </li>
            </ul>
          </section>

          {/* Official contact block */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider">
              OFFICIAL CONTACT
            </h2>
            <div className="p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/20 text-xs space-y-1.5">
              <p><strong>Trade Name:</strong> {eventData.business.name}</p>
              <p><strong>Legal Name / Proprietor:</strong> {eventData.business.legalName} ({eventData.business.constitution})</p>
              <p><strong>GSTIN:</strong> {eventData.business.gstin}</p>
              <p><strong>Event Presentation:</strong> {eventData.organizer.name}</p>
              <p><strong>Principal Place of Business:</strong> {eventData.business.address.display}</p>
              <p><strong>Helpline:</strong> {eventData.contacts.phones.join(' / ')}</p>
              <p><strong>Email:</strong> {eventData.contacts.emails.join(' / ')}</p>
              <p><strong>Event Celebration Grounds:</strong> Upwan Lawn, Chanakya BNR Hotel, Station Road, Ranchi, Jharkhand 834001 (Distinct from business address)</p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
