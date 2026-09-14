import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { eventData } from '@/data/eventData';
import { FileText, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: `Terms & Conditions | ${eventData.eventName} ${eventData.year}`,
  description: `Official terms of service, pass reservation rules, and event details for ${eventData.eventName} ${eventData.year} at Chanakya BNR Hotel, Ranchi.`,
};

export default function TermsAndConditionsPage() {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />

      <div className="pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-royal-maroon/80 border border-antique-gold/40 text-bright-gold text-[11px] uppercase tracking-[0.14em] font-bold mb-4">
            <FileText className="w-3.5 h-3.5 text-bright-gold" />
            <span>EVENT GUIDELINES &amp; POLICIES</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl text-warm-cream font-bold tracking-tight uppercase leading-tight">
            TERMS &amp; CONDITIONS
          </h1>

          <div className="h-0.5 max-w-xs mx-auto bg-gradient-to-r from-transparent via-bright-gold to-transparent my-4" />

          <p className="font-body text-xs sm:text-sm text-warm-cream/80 max-w-xl mx-auto leading-relaxed">
            Please read these terms and conditions carefully before reserving festival passes for {eventData.eventName} {eventData.year}.
          </p>

          <span className="inline-block mt-3 text-[11px] font-body text-antique-gold/70">
            Last Updated: September 2026 · Effective for {eventData.year} Edition
          </span>
        </div>

        {/* Policy Body */}
        <div className="space-y-10 font-body text-xs sm:text-sm text-warm-cream/90 leading-relaxed">
          {/* 1. Definitions & Event Scope */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>1. DEFINITIONS &amp; EVENT SCOPE</span>
            </h2>
            <p>
              &ldquo;Event&rdquo; refers to <strong>{eventData.eventName} {eventData.year}</strong> scheduled to take place on <strong>{eventData.dateDisplay}</strong> from <strong>{eventData.timeDisplay}</strong> at <strong>{eventData.venueDisplay}</strong>.
            </p>
            <p>
              &ldquo;Business&rdquo; or &ldquo;Organizer&rdquo; refers to <strong>{eventData.business.name}</strong> (Individual Name: <strong>{eventData.business.individualName}</strong>) for event <strong>{eventData.eventName} {eventData.year}</strong> presented by <strong>{eventData.organizer.name}</strong> (&ldquo;{eventData.organizer.tagline}&rdquo;), with business address at {eventData.business.address.plot}, {eventData.business.address.street}, {eventData.business.address.area}, Ranchi, Jharkhand {eventData.business.address.pincode}.
            </p>
            <p>
              &ldquo;Attendee&rdquo; or &ldquo;Customer&rdquo; refers to any person who reserves, purchases, or holds an entry pass for the Event.
            </p>
          </section>

          {/* 2. Pass Tiers & Validity */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>2. PASS CATEGORIES &amp; VALIDITY</span>
            </h2>
            <ul className="space-y-2 list-disc list-inside text-warm-cream/85">
              <li><strong>Solo Pass – Female (₹999):</strong> Grants entry for one female attendee.</li>
              <li><strong>VIP Pass (₹1,499):</strong> Grants entry for one attendee with VIP lounge access.</li>
              <li><strong>Couple Pass (₹1,999):</strong> Grants entry for two attendees (one male and one female, or two female attendees).</li>
              <li><strong>Family Pass (₹3,599):</strong> Grants entry for up to four family members.</li>
              <li><strong>Group Pass (₹4,999):</strong> Grants entry for up to six attendees.</li>
            </ul>
            <p className="pt-2">
              All passes are valid for the designated event date on 16 October 2026.
            </p>
          </section>

          {/* 3. Booking Lifecycle & 24-Hour Reservation */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>3. BOOKING PROCESS &amp; 24-HOUR RESERVATION HOLD</span>
            </h2>
            <p>
              Submitting an online booking form creates a temporary reservation in status <code>PENDING</code>.
            </p>
            <div className="p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/20 space-y-2">
              <span className="font-bold text-bright-gold block text-xs uppercase tracking-wider">
                Temporary Reservation Window:
              </span>
              <p className="text-xs text-warm-cream/80 leading-relaxed">
                The requested passes are held for up to <strong>24 hours</strong> from creation. If payment is completed within 24 hours, the booking transitions to <code>CONFIRMED</code>. If payment is not completed within 24 hours, the reservation transitions to <code>EXPIRED</code> and the inventory is returned to the public pool.
              </p>
            </div>
            <p>
              Prices displayed on the website are server-authoritative. In the event of any technical display discrepancy, the authoritative server rate shall prevail.
            </p>
          </section>

          {/* 4. Payment Terms */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>4. PAYMENT TERMS</span>
            </h2>
            <p>
              Payments for passes are handled online via authorized payment gateways or coordinated directly with the official Event Point team.
            </p>
            <p>
              Passes are considered confirmed only when the payment transaction is successfully completed and verified by the booking system. For detailed cancellation, failed payment reversal, and duplicate payment resolution guidelines, refer to our dedicated{' '}
              <Link href="/refund-and-cancellation" className="text-bright-gold underline hover:text-warm-cream font-semibold">
                Cancellation &amp; Refund Policy
              </Link>.
            </p>
          </section>

          {/* 5. Booking Reference & Receipt */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>5. BOOKING REFERENCE &amp; RECEIPT</span>
            </h2>
            <p>
              Each reservation request generates a unique Request ID displayed on the booking receipt. Attendees should retain their digital or printed receipt for booking reference and coordination with our support desk.
            </p>
            <div className="flex items-start gap-2.5 text-xs text-warm-cream/85">
              <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
              <p>
                The Request ID serves as the unique reference for your reservation record.
              </p>
            </div>
          </section>

          {/* 6. Event Decorum & Coordination */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>6. EVENT DECORUM &amp; VENUE GUIDANCE</span>
            </h2>
            <p>
              Attendees are requested to maintain festival decorum and follow guidance provided by Event Point coordinators and venue staff to ensure a safe, celebratory, and family-friendly cultural celebration.
            </p>
          </section>

          {/* 7. Contact for Inquiries */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>7. QUESTIONS &amp; OFFICIAL CONTACT</span>
            </h2>
            <p>
              For questions regarding these Terms &amp; Conditions or pass reservations, please contact:
            </p>
            <div className="p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/20 text-xs space-y-1.5">
              <p><strong>Business Name:</strong> {eventData.business.name} (Individual Name: {eventData.business.individualName})</p>
              <p><strong>Event Presentation:</strong> {eventData.organizer.name}</p>
              <p><strong>Business Address:</strong> {eventData.business.address.display}</p>
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
