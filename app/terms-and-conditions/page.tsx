import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { eventData, passesByPrice } from '@/data/eventData';
import { FileText, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: `Terms & Conditions | ${eventData.eventName} ${eventData.year}`,
  description: `Official terms of service, pass reservation rules, and event details for ${eventData.eventName} ${eventData.year} at Chanakya BNR Hotel, Ranchi.`,
};

/**
 * Official Event Point ticket terms & conditions, clause 1–22.
 * Source of truth: the organiser's issued ticket terms. Do not reword, reorder,
 * merge or omit any clause.
 */
const EVENT_TICKET_CLAUSES: string[] = [
  `By accepting, holding or using a ticket, you acknowledge that you have read, understood, accepted and agreed to the full terms and conditions.`,
  `The organizer reserves the right of admission.`,
  `The organizer may alter the event schedule without prior notice.`,
  `Entry is permitted only after a thorough security check and through designated entrances.`,
  `Re-entry is not permitted.`,
  `The venue does not allow food, beverages, liquids, bottles, cans, tins, bags, lighters, matchboxes, flammable items, or any illegal or hazardous substances inside the venue or seating area ("Prohibited Items"). Security personnel will search ticket holders' belongings at entry. If a ticket holder refuses a search and/or is found in possession of Prohibited Items, the organizer may deny entry without any refund or compensation.`,
  `This is a drug-free event. If any ticket holder uses, possesses, procures, supplies, or consumes drugs, narcotics, or psychotropic substances (as defined under the Narcotic Drugs and Psychotropic Substances Act, 1985), the organizer will immediately evict them from the venue without refund or compensation. The organizer also reserves the right to initiate legal action as permitted under applicable law.`,
  `The organizer reserves the right to refuse admission or eject any ticket holder who appears intoxicated, under the influence of drugs, behaves dangerously or inappropriately, or engages in conduct likely to cause harassment, damage, injury, or nuisance. The organizer's decision in such cases shall be final.`,
  `The use of audio or video recording equipment, including still cameras, is strictly prohibited.`,
  `The organizer issues this ticket in accordance with the rules and regulations of the event organizer and venue management.`,
  `The organizer does not accept responsibility for any injury to persons or for any loss or damage to personal property brought to the event.`,
  `In accordance with applicable law, persons below the legally permissible age may not purchase or consume alcoholic beverages.`,
  `The organizer and venue are not liable for any issues arising from unauthorized copies or reproductions of this ticket. Except as stated herein, the ticket is non-refundable and cannot be exchanged, cancelled, or returned once purchased.`,
  `If the organizer cancels the performance, the organizer will refund the ticket fee. All other charges, including parking fees, internet handling fees, and order processing fees, remain non-refundable.`,
  `The ticket is invalid if the security features affixed to it are tampered with.`,
  `You voluntarily assume all risks related to contracting COVID-19, H1N1, or any other communicable disease or illness, whether occurring before, during, or after the event, and waive all claims against the organizer arising from such risks.`,
  `The event is subject to force majeure conditions.`,
  `We request your cooperation at all times.`,
  `All disputes or claims shall be subject to the exclusive jurisdiction of the courts in Mumbai.`,
  `The organizer may modify these terms and conditions at its discretion from time to time.`,
  `All secondary performances (if any) and the event lineup are subject to the artist's discretion.`,
  `To ensure a high-quality user experience, the organizer may collect certain information (including personally identifiable information such as name, email address, or phone number) at the time of booking, registration, or payment, in accordance with its Terms and Conditions and Privacy Policy.`,
];

/** Admission validity note per pass tier (prices come from the canonical catalog). */
const PASS_VALIDITY_NOTES: Record<string, string> = {
  'solo-female': 'Grants entry for one female attendee.',
  vip: 'Grants entry for one attendee with VIP lounge access.',
  couple: 'Grants entry for two attendees (one male and one female, or two female attendees).',
  family: 'Grants entry for up to four family members.',
  group: 'Grants entry for up to six attendees.',
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
          {/* Official Ticket Terms & Conditions — Clauses 1 to 22 */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>EVENT TICKET TERMS &amp; CONDITIONS</span>
            </h2>
            <p className="text-warm-cream/85">
              These clauses apply to every ticket holder for {eventData.eventName} {eventData.year}. By accepting,
              holding or using a ticket you agree to each of the following clauses.
            </p>
            <ol className="space-y-3 list-decimal pl-5 sm:pl-6 marker:text-bright-gold marker:font-bold text-warm-cream/90">
              {EVENT_TICKET_CLAUSES.map((clause, index) => (
                <li key={index} className="leading-relaxed pl-1">
                  {clause}
                </li>
              ))}
            </ol>
          </section>

          {/* Supplementary policy heading */}
          <div className="text-center pt-2">
            <h2 className="font-display text-xl sm:text-2xl text-warm-cream uppercase tracking-wide">
              ADDITIONAL EVENT &amp; BOOKING POLICIES
            </h2>
            <div className="h-0.5 max-w-xs mx-auto bg-gradient-to-r from-transparent via-bright-gold to-transparent my-4" />
            <p className="text-warm-cream/80 max-w-2xl mx-auto">
              The sections below supplement the ticket terms above with the booking, payment, receipt, entry and
              support rules for this website.
            </p>
          </div>

          {/* A. Definitions & Event Scope */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>A. DEFINITIONS &amp; EVENT SCOPE</span>
            </h2>
            <p>
              &ldquo;Event&rdquo; refers to <strong>{eventData.eventName} {eventData.year}</strong> scheduled to take place on <strong>{eventData.dateDisplay}</strong> from <strong>{eventData.timeDisplay}</strong> at <strong>{eventData.venueDisplay}</strong>.
            </p>
            <p>
              &ldquo;Business&rdquo; or &ldquo;Organizer&rdquo; refers to <strong>{eventData.business.name}</strong> (Legal Name / Proprietor: <strong>{eventData.business.legalName}</strong>, {eventData.business.constitution}, GSTIN: <strong>{eventData.business.gstin}</strong>) for event <strong>{eventData.eventName} {eventData.year}</strong> presented by <strong>{eventData.organizer.name}</strong> (&ldquo;{eventData.organizer.tagline}&rdquo;), with principal place of business at {eventData.business.address.display}.
            </p>
            <p>
              &ldquo;Attendee&rdquo; or &ldquo;Customer&rdquo; refers to any person who reserves, purchases, or holds an entry pass for the Event.
            </p>
            <div className="p-3.5 rounded-xl bg-deep-plum/80 border border-antique-gold/20 text-xs text-warm-cream/90 space-y-1">
              <span className="font-bold text-bright-gold uppercase tracking-wider block">
                Acceptance of Terms &amp; Policies:
              </span>
              <p className="leading-relaxed">
                By accessing or using this website, submitting a booking enquiry, or reserving a pass, you agree to be
                bound by these{' '}
                <Link href="/terms-and-conditions" className="text-bright-gold underline hover:text-warm-cream">
                  Terms &amp; Conditions
                </Link>{' '}
                together with our{' '}
                <Link href="/privacy-policy" className="text-bright-gold underline hover:text-warm-cream">
                  Privacy Policy
                </Link>
                ,{' '}
                <Link href="/refund-and-cancellation" className="text-bright-gold underline hover:text-warm-cream">
                  Refund &amp; Cancellation Policy
                </Link>
                ,{' '}
                <Link href="/shipping-policy" className="text-bright-gold underline hover:text-warm-cream">
                  Shipping Policy
                </Link>{' '}
                and all other policies published on this website. If you do not agree with any of them, please do not
                use the website or reserve a pass.
              </p>
            </div>
          </section>

          {/* B. Pass Tiers & Validity */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>B. PASS CATEGORIES &amp; VALIDITY</span>
            </h2>
            <ul className="space-y-2 list-disc list-inside text-warm-cream/85">
              {passesByPrice.map((tier) => (
                <li key={tier.id}>
                  <strong>{tier.shortLabel} ({tier.priceDisplay}):</strong>{' '}
                  {PASS_VALIDITY_NOTES[tier.id] ?? tier.description}
                </li>
              ))}
            </ul>
            <div className="p-3.5 rounded-xl bg-deep-plum/80 border border-antique-gold/20 text-xs text-warm-cream/90 space-y-1 mt-2">
              <span className="font-bold text-bright-gold uppercase tracking-wider block">
                Transfer by Possession (Pass Validity):
              </span>
              <p className="leading-relaxed">
                Pass validity is determined by the pass type, capacity, and validity of the booking/payment. The attendee name entered during booking does not by itself restrict who may use a valid pass. No separate ticket transfer feature or attendee re-assignment is required or provided; presentation of an active, confirmed pass grants admission up to the pass&apos;s specified capacity.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-deep-plum/80 border border-antique-gold/20 text-xs text-warm-cream/90 space-y-1 mt-2">
              <span className="font-bold text-bright-gold uppercase tracking-wider block">
                Pass Ownership &amp; Sharing (Receipt Access):
              </span>
              <p className="leading-relaxed">
                Every pass is registered to the name provided at booking and admits one entry. Your Booking ID,
                email address, mobile number and entry QR are the credentials for your booking: anyone you share them
                with can open your receipt and take entry with your pass. Once a pass has been used for entry, that
                entry is
                final and cannot be reversed, replaced or refunded, and the organisers are not responsible for entry
                taken using details shared by the booker. This clause governs receipt and QR credentials only — it
                does not restrict who may use a valid pass under Transfer by Possession above.
              </p>
            </div>
          </section>

          {/* C. Booking Lifecycle, Pay Now / Pay Later & 24-Hour Deadline */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>C. BOOKING PROCESS, PAY NOW &amp; PAY LATER (24-HOUR PAYMENT DEADLINE)</span>
            </h2>
            <p>
              Submitting an online booking form creates a booking in status <code>PENDING</code> and reserves exactly
              one pass. At the payment step you may choose either:
            </p>
            <ul className="space-y-2 list-disc list-inside text-warm-cream/85">
              <li>
                <strong>Pay Now:</strong> complete payment immediately through the payment gateway. Once the payment
                is verified, the booking becomes <code>CONFIRMED</code> and <code>PAID</code> and the entry QR is
                issued on the booking receipt.
              </li>
              <li>
                <strong>Pay Later:</strong> keep the booking pending and complete payment later within the payment
                deadline. Your booking ID and the exact payment deadline are shown at booking time, and you can
                return through the Find Pass page to complete payment before the deadline.
              </li>
            </ul>
            <div className="p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/20 space-y-2">
              <span className="font-bold text-bright-gold block text-xs uppercase tracking-wider">
                Temporary Reservation Window:
              </span>
              <p className="text-xs text-warm-cream/80 leading-relaxed">
                The requested passes are held for up to <strong>24 hours</strong> from creation. If payment is completed within 24 hours, the booking transitions to <code>CONFIRMED</code>. If payment is not completed within 24 hours, the reservation transitions to <code>EXPIRED</code> and the inventory is returned to the public pool.
              </p>
              <p className="text-xs text-warm-cream/80 leading-relaxed">
                The payment deadline is set by our servers when the booking is created. It is <strong>fixed</strong>:
                it does not restart if you revisit the booking or retry a payment, and it is displayed with the exact
                date and time. An expired booking cannot be paid or revived, and no refund applies to an expired
                booking because no payment was collected. No entry QR is issued while a booking remains unpaid.
              </p>
            </div>
            <p>
              Prices displayed on the website are server-authoritative. In the event of any technical display discrepancy, the authoritative server rate shall prevail.
            </p>
          </section>

          {/* D. Payment Terms */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>D. PAYMENT TERMS &amp; PRICING TRANSPARENCY</span>
            </h2>
            <p>
              Payments for passes are handled online via authorized payment gateways or coordinated directly with the official Event Point team.
            </p>
            <p>
              All listed pass prices are inclusive of applicable GST at 18%. Pass rates displayed represent the final customer payable rate; no additional tax is charged at checkout.
            </p>
            <p>
              Passes are considered confirmed only when the payment transaction is successfully completed and verified by the booking system. Confirmed bookings can be cancelled through the website Booking Lookup flow until <strong>6 October 2026 (11:59:59 PM IST)</strong>. After 6 October 2026, cancellation is closed. When cancelled, the 18% GST component included in the gross ticket price is deducted (Refund = Gross Paid × 100 / 118). Refund processing is handled separately from cancellation. For complete terms, view our{' '}
              <Link href="/refund-and-cancellation" className="text-bright-gold underline hover:text-warm-cream font-semibold">
                Cancellation &amp; Refund Policy
              </Link>.
            </p>
          </section>

          {/* E. Booking Reference, Receipt & Entry QR */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>E. BOOKING REFERENCE, RECEIPT &amp; ENTRY QR</span>
            </h2>
            <p>
              Each reservation request generates a unique Request ID displayed on the booking receipt. Attendees should retain their digital receipt (or a printed copy of it) for booking reference and coordination with our support desk.
            </p>
            <div className="p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/20 space-y-2 text-xs text-warm-cream/85 leading-relaxed">
              <span className="font-bold text-bright-gold block uppercase tracking-wider">
                Digital Pass Only — No Physical Tickets:
              </span>
              <p>
                All passes for {eventData.eventName} {eventData.year} are issued{' '}
                <strong>exclusively in digital form</strong> — the official booking receipt and its entry QR, shown on
                this website. No paper, printed, plastic or collectible ticket is issued, posted, couriered or handed
                over at the venue, and nothing is held at a collection or will-call counter. A printout, screenshot or
                PDF of your digital receipt is only a copy of that same digital pass, not a separately issued ticket,
                and it carries no validity of its own.
              </p>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-warm-cream/85">
              <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
              <p>
                The Request ID serves as the unique reference for your reservation record.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/20 space-y-2 text-xs text-warm-cream/85 leading-relaxed">
              <span className="font-bold text-bright-gold block uppercase tracking-wider">
                Entry QR Rules:
              </span>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>
                  An entry QR is issued only for bookings that are both <code>CONFIRMED</code> and{' '}
                  <code>PAID</code>. Pending, unpaid, expired and cancelled bookings do not carry an active entry QR.
                </li>
                <li>
                  The QR is deterministic for a booking: retrieving or re-printing your receipt shows the same QR,
                  and it remains valid while the booking remains valid.
                </li>
                <li>
                  The QR alone does not grant admission. Venue staff scan and confirm entry using authenticated
                  organiser accounts, and each pass admits one entry.
                </li>
                <li>
                  A second scan of the same pass shows that entry was already recorded, including the original entry
                  time and the organiser who admitted it.
                </li>
                <li>Cancelled or expired bookings cannot be admitted and show no active entry QR.</li>
              </ul>
            </div>
          </section>

          {/* F. Event Decorum & Coordination */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>F. EVENT DECORUM &amp; VENUE GUIDANCE</span>
            </h2>
            <p>
              Attendees are requested to maintain festival decorum and follow guidance provided by Event Point coordinators and venue staff to ensure a safe, celebratory, and family-friendly cultural celebration.
            </p>
          </section>

          {/* G. Contact for Inquiries */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>G. QUESTIONS &amp; OFFICIAL CONTACT</span>
            </h2>
            <p>
              For questions regarding these Terms &amp; Conditions or pass reservations, please contact:
            </p>
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
