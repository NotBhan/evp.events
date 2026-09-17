import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { eventData } from '@/data/eventData';
import { RotateCcw, AlertTriangle, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: `Cancellation & Refund Policy | ${eventData.eventName} ${eventData.year}`,
  description: `Official cancellation and refund policy for ${eventData.eventName} ${eventData.year}. Details the 24-hour reservation hold, technical payment failure reversals, duplicate charge reconciliation, and commercial cancellation terms.`,
};

export default function RefundAndCancellationPage() {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />

      <div className="pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-royal-maroon/80 border border-antique-gold/40 text-bright-gold text-[11px] uppercase tracking-[0.14em] font-bold mb-4">
            <RotateCcw className="w-3.5 h-3.5 text-bright-gold" />
            <span>TRANSPARENT POLICY</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl text-warm-cream font-bold tracking-tight uppercase leading-tight">
            CANCELLATION &amp; REFUND POLICY
          </h1>

          <div className="h-0.5 max-w-xs mx-auto bg-gradient-to-r from-transparent via-bright-gold to-transparent my-4" />

          <p className="font-body text-xs sm:text-sm text-warm-cream/80 max-w-xl mx-auto leading-relaxed">
            Clear guidelines explaining reservation expirations, technical payment reversals, duplicate charge resolutions, and pass cancellation terms for {eventData.eventName} {eventData.year}.
          </p>

          <span className="inline-block mt-3 text-[11px] font-body text-antique-gold/70">
            Last Updated: September 2026 · Valid for {eventData.year} Edition
          </span>
        </div>

        {/* Policy Body */}
        <div className="space-y-10 font-body text-xs sm:text-sm text-warm-cream/90 leading-relaxed">
          {/* 1. Reservation Lifecycle & 24-Hour Expiry */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-5 h-5 text-bright-gold shrink-0" />
              <span>1. 24-HOUR RESERVATION HOLD (UNPAID REQUESTS)</span>
            </h2>
            <p>
              When an attendee initiates a booking request on our website, the requested passes are placed in a <code>PENDING</code> reservation state for up to <strong>24 hours</strong>. This is the same window used by the <strong>Pay Later</strong> option at checkout, which lets you complete payment after booking instead of paying immediately.
            </p>
            <div className="p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/20 space-y-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs">
                  <strong>Zero Obligation &amp; No Automatic Charges:</strong> Submitting an online reservation request does not automatically debit your account. If you choose not to proceed with payment, no action is required; the reservation will automatically expire after 24 hours.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs">
                  <strong>Automatic Inventory Release:</strong> Once expired, held pass allocations return to the festival pool without any penalty or cancellation fee.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <p className="text-xs">
                  <strong>Expiry Is Not a Refund:</strong> The 24-hour payment deadline is fixed at booking and is shown on your booking. If payment is not completed before the deadline, the booking expires and the pass is released — expiry is an unpaid hold ending, not a cancellation and not a refund. Because no payment was collected, no refund applies and no refund request is required.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Technical Payment Failures & Banking Reversals */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-bright-gold shrink-0" />
              <span>2. TECHNICAL PAYMENT FAILURES</span>
            </h2>
            <p>
              If a payment transaction fails during checkout due to network disconnection, bank server timeouts, or incorrect authorization credentials:
            </p>
            <ul className="space-y-2 list-disc list-inside text-warm-cream/80">
              <li>No confirmed pass booking is generated for a failed transaction attempt.</li>
              <li>Your reservation remains in <code>PENDING</code> status, enabling you to retry payment within your remaining 24-hour reservation window.</li>
              <li>If your account or card is debited during a failed gateway attempt, the amount is held by the banking network and is processed for reversal to your original source of payment according to standard banking settlement cycles.</li>
            </ul>
          </section>

          {/* 3. Duplicate Payment Resolution */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-bright-gold shrink-0" />
              <span>3. DUPLICATE CHARGES</span>
            </h2>
            <p>
              In rare situations where an attendee experiences duplicate debits for the same booking request due to multiple submission attempts or gateway latency:
            </p>
            <p>
              Please notify our coordination desk at <code>eventpointranchi18@gmail.com</code> (or <code>eventpoint42@gmail.com</code>) with your Request ID and payment transaction references. Following technical verification with the payment gateway, duplicate charges are reconciled and processed for refund to the original payment source.
            </p>
          </section>

          {/* 4. Confirmed Passes & Voluntary Attendee Cancellations */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-bright-gold shrink-0" />
              <span>4. PASS CANCELLATION &amp; STATUTORY GST REFUND TERMS</span>
            </h2>
            <p>
              When pass payment is confirmed, the reservation transitions to <code>CONFIRMED</code>, and admission quota is allocated to the booking. Attendees may cancel a confirmed booking directly through our website subject to the confirmed client policies below:
            </p>

            <div className="p-4 sm:p-5 rounded-2xl bg-deep-plum/80 border border-antique-gold/25 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <div>
                  <strong>Website Self-Service Cancellation:</strong> Confirmed bookings can be cancelled directly through the existing <strong>Booking Lookup / Find Reservation</strong> interface on the website until the official cancellation cutoff.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <div>
                  <strong>Strict Cancellation Deadline:</strong> Cancellation is permitted only until <strong>6 October 2026, 11:59:59 PM IST</strong>. After 6 October 2026, website cancellation is permanently closed and bookings cannot be cancelled.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <div>
                  <strong>Immediate Server-Side Cancellation:</strong> Cancellation takes effect immediately upon submission. Pass allocations are atomically released back to the general festival pool.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <div>
                  <strong>Refund Process Handled Separately:</strong> Website cancellation and refund processing are distinct operations. Cancelling a booking immediately marks the reservation as <code>CANCELLED</code>. Refund requests and disbursements are handled separately by our accounts desk. Initial support handling is typically acknowledged within 6 business hours.
                </div>
              </div>
            </div>

            {/* Checked-in lock & cancelled-pass rules */}
            <div className="p-4 sm:p-5 rounded-2xl bg-deep-plum/80 border border-antique-gold/25 space-y-2 text-xs">
              <h3 className="font-display text-sm sm:text-base text-bright-gold uppercase tracking-wider">
                CHECKED-IN BOOKINGS &amp; CANCELLED PASSES
              </h3>
              <ul className="space-y-1.5 list-disc list-inside text-warm-cream/85">
                <li>
                  Once a pass has been admitted at the venue, the booking <strong>cannot be cancelled and cannot be
                  refunded</strong>. Attempting to cancel returns <code>PASS_ALREADY_USED</code>.
                </li>
                <li>
                  Cancellation does not delete the booking: the booking record and Booking ID are retained (Booking
                  IDs are never reused) and the cancelled state is permanent — a cancelled booking cannot be
                  reinstated.
                </li>
                <li>
                  A cancelled booking cannot be admitted, and its receipt no longer shows an active entry QR.
                </li>
                <li>
                  Refunds are only available for bookings that were paid <em>and</em> cancelled within the
                  cancellation window. An unpaid Pay Later hold that expires is not eligible because no payment was
                  collected.
                </li>
              </ul>
            </div>

            {/* GST Deduction & Refund Calculation Formula */}
            <div className="p-4 sm:p-5 rounded-2xl bg-royal-maroon/60 border border-antique-gold/30 space-y-3 text-xs">
              <h3 className="font-display text-sm sm:text-base text-bright-gold uppercase tracking-wider">
                18% GST DEDUCTION &amp; REFUND CALCULATION
              </h3>
              <p className="text-warm-cream/90 leading-relaxed">
                All advertised pass prices are <strong>GST-inclusive at the applicable statutory rate of 18%</strong>. Because customer payments include this statutory tax, the non-refundable GST component is extracted from the gross paid amount before calculating any approved refund.
              </p>

              <div className="p-3 rounded-xl bg-deep-plum/90 border border-antique-gold/30 font-mono text-[11px] sm:text-xs text-bright-gold space-y-1">
                <div>GST Component = Gross Paid Amount × 18 / 118</div>
                <div>Net Refund Amount = Gross Paid Amount - GST Component = Gross Paid Amount × 100 / 118</div>
              </div>

              {/* Exact Tier Breakdown Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse font-body text-xs">
                  <thead>
                    <tr className="border-b border-antique-gold/30 text-bright-gold text-[10px] sm:text-xs uppercase tracking-wider">
                      <th className="py-2 pr-3">Pass Category</th>
                      <th className="py-2 px-3 text-right">Gross Paid (Incl. GST)</th>
                      <th className="py-2 px-3 text-right text-vermilion">18% GST Deducted</th>
                      <th className="py-2 pl-3 text-right text-emerald-300">Expected Net Refund</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-antique-gold/15 font-mono text-[11px] sm:text-xs text-warm-cream/90">
                    <tr>
                      <td className="py-2 pr-3 font-body font-medium">Solo Pass – Female</td>
                      <td className="py-2 px-3 text-right">₹999.00</td>
                      <td className="py-2 px-3 text-right text-vermilion">₹152.39</td>
                      <td className="py-2 pl-3 text-right font-bold text-emerald-300">₹846.61</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-body font-medium">VIP Pass</td>
                      <td className="py-2 px-3 text-right">₹1,499.00</td>
                      <td className="py-2 px-3 text-right text-vermilion">₹228.66</td>
                      <td className="py-2 pl-3 text-right font-bold text-emerald-300">₹1,270.34</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-body font-medium">Couple Pass</td>
                      <td className="py-2 px-3 text-right">₹1,999.00</td>
                      <td className="py-2 px-3 text-right text-vermilion">₹304.93</td>
                      <td className="py-2 pl-3 text-right font-bold text-emerald-300">₹1,694.07</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-body font-medium">Family Pass</td>
                      <td className="py-2 px-3 text-right">₹3,599.00</td>
                      <td className="py-2 px-3 text-right text-vermilion">₹549.00</td>
                      <td className="py-2 pl-3 text-right font-bold text-emerald-300">₹3,050.00</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-body font-medium">Group Pass</td>
                      <td className="py-2 px-3 text-right">₹4,999.00</td>
                      <td className="py-2 px-3 text-right text-vermilion">₹762.56</td>
                      <td className="py-2 pl-3 text-right font-bold text-emerald-300">₹4,236.44</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transfer-by-Possession Notice */}
            <div className="p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/20 space-y-1.5 text-xs">
              <h3 className="font-display text-xs sm:text-sm text-bright-gold uppercase tracking-wider">
                PASS VALIDITY &amp; TRANSFER-BY-POSSESSION
              </h3>
              <p className="text-warm-cream/85 leading-relaxed">
                Pass validity is determined by the pass type, capacity, and validity of the booking/payment. The attendee name entered during booking does not by itself restrict who may use a valid pass. There is no separate ticket transfer feature or attendee re-assignment workflow; admission is granted upon presentation of a valid, uncancelled pass up to the defined category capacity.
              </p>
            </div>
          </section>

          {/* 5. Refund Method */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>5. REFUND METHOD &amp; DISBURSEMENT</span>
            </h2>
            <p>
              All approved refunds, duplicate payment reversals, and technical settlement adjustments are returned directly to the original payment method (Credit Card, Debit Card, Netbanking, or UPI). Cash refunds are not provided under any circumstances.
            </p>
          </section>

          {/* 6. Support Contact */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>6. REFUND &amp; BILLING ASSISTANCE</span>
            </h2>
            <p>
              For inquiries regarding pass cancellations, refund status, pending transactions, or duplicate charges:
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
