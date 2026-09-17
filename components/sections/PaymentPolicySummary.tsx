import Link from 'next/link';
import { CreditCard, Clock, RefreshCw, QrCode, HelpCircle, ArrowRight } from 'lucide-react';
import { eventData } from '@/data/eventData';
import { CANCELLATION_DEADLINE_DISPLAY } from '@/lib/cancellation-constants';

/**
 * Homepage summary of payment options, Pay Later deadline, cancellation,
 * refunds and entry rules — concise, with deep links to the full pages.
 * Rules here mirror the authoritative implementation and the policy pages.
 */
export default function PaymentPolicySummary() {
  const cards = [
    {
      icon: CreditCard,
      title: 'PAY NOW OR PAY LATER',
      body: (
        <>
          Pay immediately at checkout, or choose <strong>Pay Later</strong> and complete payment within{' '}
          <strong>24 hours of booking</strong>. Your exact payment deadline is shown on your booking.
        </>
      ),
      href: '/terms-and-conditions',
      linkLabel: 'Payment terms',
    },
    {
      icon: Clock,
      title: '24-HOUR PAYMENT DEADLINE',
      body: (
        <>
          The deadline is fixed at booking — it does not restart if you revisit or retry. Unpaid bookings expire
          automatically and the reserved pass is released. No refund applies because no payment was collected.
        </>
      ),
      href: '/faq',
      linkLabel: 'Pay Later & expiry FAQ',
    },
    {
      icon: RefreshCw,
      title: 'CANCELLATION & REFUNDS',
      body: (
        <>
          Confirmed bookings can be cancelled until <strong>6 October 2026</strong>. Refunds are requested
          separately through support, returned to the original payment method, with only the embedded 18% GST
          component deducted (Gross × 100 / 118).
        </>
      ),
      href: '/refund-and-cancellation',
      linkLabel: 'Cancellation &amp; refund policy',
    },
    {
      icon: QrCode,
      title: 'QR ENTRY AT THE GATE',
      body: (
        <>
          Your entry QR is issued <strong>only when the booking is confirmed and paid</strong>. Staff verify and
          confirm entry with authenticated organiser accounts — each pass admits one entry, and a repeat scan shows
          the original entry record.
        </>
      ),
      href: '/policies',
      linkLabel: 'All policies',
    },
  ];

  return (
    <section
      id="payment-policy-summary"
      className="relative z-20 w-full bg-deep-plum text-warm-cream py-20 sm:py-24 px-4 sm:px-6 lg:px-12 border-t border-antique-gold/25"
      aria-label="Payment Options, Cancellation and Entry Summary"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 text-bright-gold text-xs sm:text-sm font-body tracking-[0.15em] uppercase font-bold">
              <span className="text-vermilion">♦</span>
              <span>PAYMENT, CANCELLATION &amp; ENTRY</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase leading-none">
              BEFORE YOU BOOK
            </h2>
          </div>
          <p className="font-body text-xs sm:text-sm text-warm-cream/75 max-w-md leading-relaxed">
            The essentials on paying now or later, the 24-hour payment deadline, cancellations, refunds and QR entry
            — with full details in our policies and FAQ.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="p-5 sm:p-6 rounded-2xl bg-card-surface border border-antique-gold/30 shadow-lg flex flex-col gap-3"
              >
                <Icon className="w-6 h-6 text-bright-gold" />
                <h3 className="font-display text-lg text-bright-gold uppercase tracking-wider">{card.title}</h3>
                <p className="font-body text-xs sm:text-sm text-warm-cream/85 leading-relaxed flex-1">{card.body}</p>
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-[11px] font-body font-bold uppercase tracking-wider text-warm-cream/80 hover:text-bright-gold transition-colors"
                >
                  <span>{card.linkLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-royal-maroon/40 border border-antique-gold/30">
          <div className="font-body text-xs sm:text-sm text-warm-cream/85">
            <strong className="text-bright-gold">Cancellation deadline:</strong> {CANCELLATION_DEADLINE_DISPLAY} ·
            <span className="mx-1.5">|</span>
            <strong className="text-bright-gold">Support:</strong> {eventData.contacts.phones[0]} ·{' '}
            {eventData.contacts.emails[0]}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream hover:text-bright-gold text-xs font-body font-bold uppercase tracking-wider transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-bright-gold" />
              <span>FAQ</span>
            </Link>
            <Link
              href="/policies"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream hover:text-bright-gold text-xs font-body font-bold uppercase tracking-wider transition-colors"
            >
              <span>Policies</span>
              <ArrowRight className="w-3.5 h-3.5 text-bright-gold" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
