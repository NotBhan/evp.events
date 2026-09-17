import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { eventData } from '@/data/eventData';
import { HelpCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: `FAQ — Payment, Cancellation, Refund & Entry | ${eventData.eventName} ${eventData.year}`,
  description: `Answers about Pay Now, Pay Later, the 24-hour payment deadline, booking expiry, cancellation, refunds, QR entry and support for ${eventData.eventName} ${eventData.year}.`,
};

const FAQ_SECTIONS = [
  {
    title: 'PAYMENT OPTIONS',
    items: [
      {
        q: 'What payment options are available?',
        a: (
          <>
            Every booking can be paid in one of two ways at the payment step: <strong>Pay Now</strong> (complete the
            payment immediately) or <strong>Pay Later</strong> (keep the booking pending and complete payment within
            24 hours). Both paths create the same booking record — only the timing of payment differs.
          </>
        ),
      },
      {
        q: 'How does Pay Now work?',
        a: (
          <>
            Pay Now opens the secure payment gateway immediately after you submit your booking. Once the payment is
            successfully completed and verified by our system, the booking becomes <code>CONFIRMED</code> and{' '}
            <code>PAID</code>, and your entry QR is issued on the booking receipt.
          </>
        ),
      },
      {
        q: 'How does Pay Later work?',
        a: (
          <>
            Pay Later creates your booking straight away and holds the requested pass for{' '}
            <strong>24 hours from the moment the booking is created</strong>. The booking stays pending, your
            booking ID and payment deadline are shown immediately, and you can return at any time within the window
            to complete the payment. No entry QR is issued while the booking is unpaid.
          </>
        ),
      },
      {
        q: 'How long do I have to pay, and where is the deadline shown?',
        a: (
          <>
            You have exactly <strong>24 hours from booking creation</strong>. The exact deadline (date and time in
            IST) is displayed on the booking confirmation, on the payment screen, and whenever you retrieve the
            booking. The deadline is fixed by our servers and <strong>does not restart</strong> if you revisit the
            page or retry a payment.
          </>
        ),
      },
      {
        q: 'What happens if I do not pay within 24 hours?',
        a: (
          <>
            The booking expires automatically. The reserved pass is released back to the event pool, the booking
            cannot be paid or revived after expiry, and <strong>no refund applies because no payment was
            collected</strong>. You are welcome to make a new booking if passes are still available.
          </>
        ),
      },
      {
        q: 'Can I pay for an expired booking?',
        a: (
          <>
            No. Once the 24-hour payment deadline has passed, the booking moves to <code>EXPIRED</code> and late
            payments are rejected by our system. Expired bookings do not hold a pass and cannot be confirmed.
          </>
        ),
      },
    ],
  },
  {
    title: 'CANCELLATION',
    items: [
      {
        q: 'Until when can I cancel a confirmed booking?',
        a: (
          <>
            Confirmed and paid bookings can be cancelled through the website until{' '}
            <strong>6 October 2026 (11:59:59 PM IST)</strong>. After that date the cancellation window is closed.
          </>
        ),
      },
      {
        q: 'How do I cancel?',
        a: (
          <>
            Open <Link href="/find-pass" className="text-bright-gold underline">Find / Recover Reservation</Link> on
            the Find Pass page, retrieve your booking with your Booking ID plus the email and mobile number you
            booked with, then choose <strong>Cancel Booking</strong>. The
            cancellation takes effect immediately in your booking record.
          </>
        ),
      },
      {
        q: 'What happens after I cancel?',
        a: (
          <>
            The booking state changes to <code>CANCELLED</code> immediately and the pass is returned to event
            inventory. The booking record and Booking ID are retained for reference — IDs are never reused — and a
            cancelled booking cannot be admitted and has no active entry QR.
          </>
        ),
      },
      {
        q: 'Can I cancel a booking that has already been used for entry?',
        a: (
          <>
            No. Once a pass has been checked in at the venue, the booking cannot be cancelled and cannot be
            refunded. Attempting to cancel returns the status <code>PASS_ALREADY_USED</code>.
          </>
        ),
      },
    ],
  },
  {
    title: 'REFUNDS',
    items: [
      {
        q: 'How do I request a refund?',
        a: (
          <>
            Cancellation and refund are separate steps. After cancelling an eligible paid booking, request your
            refund through our support channels with your Booking ID: WhatsApp{' '}
            <strong>{eventData.contacts.phones[0]}</strong> or email{' '}
            <strong>{eventData.contacts.emails[0]}</strong>.
          </>
        ),
      },
      {
        q: 'Where is the refund sent?',
        a: <>Approved refunds are returned to the original payment method used for the booking.</>,
      },
      {
        q: 'How is the refund amount calculated?',
        a: (
          <>
            Only the embedded GST component is deducted. Pass prices are GST-inclusive at 18%, so the refund is
            calculated as <strong>Gross Paid Amount × 100 / 118</strong> (equivalently, the GST component of
            18/118 is retained and the remainder is refunded). No other fees or deductions are applied.
          </>
        ),
      },
      {
        q: 'Does an unpaid Pay Later booking qualify for a refund?',
        a: (
          <>
            No. If a Pay Later booking expires without payment, no money was ever collected, so there is nothing to
            refund. Expiry is not a cancellation and not a refund event.
          </>
        ),
      },
      {
        q: 'What if I was charged twice or the payment failed but money left my account?',
        a: (
          <>
            Contact the support desk with your Booking ID and payment reference. Duplicate charges and failed
            payment reversals are handled by our coordination team through the payment provider.
          </>
        ),
      },
    ],
  },
  {
    title: 'ENTRY & QR CODE',
    items: [
      {
        q: 'When is my entry QR issued?',
        a: (
          <>
            Only when the booking is <code>CONFIRMED</code> and <code>PAID</code>. Pending, unpaid, expired and
            cancelled bookings never show an active entry QR.
          </>
        ),
      },
      {
        q: 'How does entry work at the venue?',
        a: (
          <>
            Present the QR from your digital or printed receipt at the gate. Event staff scan it with the official
            organiser app: the scan shows your booking details, and staff then confirm your entry as an explicit
            action. The QR alone does not admit anyone without the authenticated organiser app, and the QR stays
            valid on later retrievals of the same booking.
          </>
        ),
      },
      {
        q: 'What happens if my QR is scanned a second time?',
        a: (
          <>
            The second scan shows <code>ALREADY CHECKED IN</code> together with the original entry time and the
            organiser who admitted the pass. Each pass admits one entry.
          </>
        ),
      },
      {
        q: 'Can I use a cancelled booking QR at the gate?',
        a: (
          <>
            No. A cancelled booking shows as cancelled at the gate and cannot be admitted. Cancelled bookings also
            stop showing an active entry QR on the receipt.
          </>
        ),
      },
      {
        q: 'How do organisers check passes?',
        a: (
          <>
            Event staff sign in with individual organiser accounts on the private organiser panel. Each account has
            its own credentials, role and gate, and only authenticated staff can look up or confirm a pass. Entry is
            verified live against our booking database, so a connection is required at the gate.
          </>
        ),
      },
      {
        q: 'Do I need to carry anything else?',
        a: (
          <>
            Carry the booking QR (digital, or a printed copy of the digital receipt) and your booking ID. Passes are
            digital only — no physical ticket is issued. Pass validity is determined by the pass
            type, capacity and the validity of the booking/payment — the attendee name entered during booking does
            not by itself restrict who may use a valid pass.
          </>
        ),
      },
    ],
  },
  {
    title: 'BOOKING & PASSES',
    items: [
      {
        q: 'Are the passes digital only?',
        a: (
          <>
            <strong>Yes — every pass is digital only.</strong> Your pass is the official booking receipt with its
            entry QR, shown on screen once the booking is confirmed and paid and available any time through the{' '}
            <Link href="/find-pass" className="text-bright-gold underline">Find Pass page</Link>. No physical ticket
            is printed, posted, couriered or handed over at the venue, and nothing is held at a collection counter.
            You may print or screenshot the receipt for convenience, but that copy is just a copy of the same digital
            pass, not a separately issued ticket.
          </>
        ),
      },
      {
        q: 'How many passes can I book at once?',
        a: (
          <>
            One booking equals one purchased pass — each booking reserves exactly one pass, and the pass type
            (Solo Female, VIP, Couple, Family, Group) determines how many guests that pass admits. Need more
            passes? Complete another booking.
          </>
        ),
      },
      {
        q: 'Where can I see my booking and payment deadline again?',
        a: (
          <>
            Use <Link href="/find-pass" className="text-bright-gold underline">Find / Recover Reservation</Link> on
            the Find Pass page with
            your Booking ID and contact details. Your booking, its status and (for pending bookings) the exact
            payment deadline are shown there.
          </>
        ),
      },
      {
        q: 'What are the event details?',
        a: (
          <>
            <strong>{eventData.eventName} {eventData.year}</strong> — {eventData.dateDisplay}, {eventData.timeDisplay},
            at {eventData.venueDisplay}.
          </>
        ),
      },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      {
        q: 'How do I reach the support desk?',
        a: (
          <>
            WhatsApp or call <strong>{eventData.contacts.phones[0]}</strong>, or email{' '}
            <strong>{eventData.contacts.emails[0]}</strong>. Please include your Booking ID so we can look up your
            reservation quickly.
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />

      <div className="pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-royal-maroon/80 border border-antique-gold/40 text-bright-gold text-[11px] uppercase tracking-[0.14em] font-bold mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-bright-gold" />
            <span>HELP &amp; ANSWERS</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl text-warm-cream font-bold tracking-tight uppercase leading-tight">
            FREQUENTLY ASKED QUESTIONS
          </h1>

          <div className="h-0.5 max-w-xs mx-auto bg-gradient-to-r from-transparent via-bright-gold to-transparent my-4" />

          <p className="font-body text-xs sm:text-sm text-warm-cream/80 max-w-xl mx-auto leading-relaxed">
            Payment options, Pay Later and the 24-hour payment deadline, booking expiry, cancellation, refunds and
            QR entry for {eventData.eventName} {eventData.year}.
          </p>

          <span className="inline-block mt-3 text-[11px] font-body text-antique-gold/70">
            Last Updated: September 2026 · Effective for {eventData.year} Edition
          </span>
        </div>

        {/* FAQ Body */}
        <div className="space-y-10 font-body text-xs sm:text-sm text-warm-cream/90 leading-relaxed">
          {FAQ_SECTIONS.map((section) => (
            <section
              key={section.title}
              className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-5"
            >
              <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider">
                {section.title}
              </h2>

              <div className="space-y-4">
                {section.items.map((item) => (
                  <div key={item.q} className="p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/20 space-y-1.5">
                    <h3 className="font-bold text-warm-cream text-xs sm:text-sm">{item.q}</h3>
                    <p className="text-warm-cream/85 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Policy links */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider">
              FULL POLICIES
            </h2>
            <p>
              This FAQ summarises the rules. The complete terms are in our policies — read them together with this
              page.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
              <Link
                href="/policies"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-royal-maroon border border-antique-gold/40 text-warm-cream hover:text-bright-gold text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <span>All Policies</span>
                <ArrowRight className="w-3.5 h-3.5 text-bright-gold" />
              </Link>
              <Link
                href="/terms-and-conditions"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-royal-maroon border border-antique-gold/40 text-warm-cream hover:text-bright-gold text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <span>Terms &amp; Conditions</span>
                <ArrowRight className="w-3.5 h-3.5 text-bright-gold" />
              </Link>
              <Link
                href="/refund-and-cancellation"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-royal-maroon border border-antique-gold/40 text-warm-cream hover:text-bright-gold text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <span>Cancellation &amp; Refund</span>
                <ArrowRight className="w-3.5 h-3.5 text-bright-gold" />
              </Link>
              <Link
                href="/privacy-policy"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-royal-maroon border border-antique-gold/40 text-warm-cream hover:text-bright-gold text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <span>Privacy Policy</span>
                <ArrowRight className="w-3.5 h-3.5 text-bright-gold" />
              </Link>
            </div>
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
