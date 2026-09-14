import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { eventData } from '@/data/eventData';
import { Lock, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: `Privacy Policy | ${eventData.eventName} ${eventData.year}`,
  description: `Official privacy policy for ${eventData.eventName} ${eventData.year}. Details data collected during pass booking, payment processing disclosures, and customer data protections.`,
};

export default function PrivacyPolicyPage() {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />

      <div className="pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-royal-maroon/80 border border-antique-gold/40 text-bright-gold text-[11px] uppercase tracking-[0.14em] font-bold mb-4">
            <Lock className="w-3.5 h-3.5 text-bright-gold" />
            <span>DATA &amp; PRIVACY DISCLOSURES</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl text-warm-cream font-bold tracking-tight uppercase leading-tight">
            PRIVACY POLICY
          </h1>

          <div className="h-0.5 max-w-xs mx-auto bg-gradient-to-r from-transparent via-bright-gold to-transparent my-4" />

          <p className="font-body text-xs sm:text-sm text-warm-cream/80 max-w-xl mx-auto leading-relaxed">
            How personal and booking information is handled for {eventData.eventName} {eventData.year}.
          </p>

          <span className="inline-block mt-3 text-[11px] font-body text-antique-gold/70">
            Last Updated: September 2026 · Valid for {eventData.year} Edition
          </span>
        </div>

        {/* Policy Body */}
        <div className="space-y-10 font-body text-xs sm:text-sm text-warm-cream/90 leading-relaxed">
          {/* 1. Introduction */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>1. INTRODUCTION</span>
            </h2>
            <p>
              This Privacy Policy describes how <strong>{eventData.business.name}</strong> (Legal Name / Proprietor: <strong>{eventData.business.legalName}</strong>, {eventData.business.constitution}, GSTIN: <strong>{eventData.business.gstin}</strong>), presenting <strong>{eventData.eventName} {eventData.year}</strong> under event brand <strong>{eventData.organizer.name}</strong>, collects, uses, and protects information when you use our website or submit a pass reservation.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>2. INFORMATION WE COLLECT</span>
            </h2>
            <p>
              We collect only the information necessary to process your pass reservation and support services:
            </p>
            <ul className="space-y-2 list-disc list-inside text-warm-cream/85">
              <li><strong>Contact Details:</strong> Primary attendee name, 10-digit mobile number, and optional email address.</li>
              <li><strong>Location:</strong> City of residence (e.g., Ranchi).</li>
              <li><strong>Pass Details:</strong> Selected pass tier, quantity, booking amount, and generated Request ID.</li>
              <li><strong>Session &amp; Lookup Data:</strong> Cryptographic SHA-256 hash of booking recovery tokens and HMAC-signed session cookies to allow reservation retrieval without a password.</li>
              <li><strong>Payment Identifiers:</strong> Gateway order identifiers, payment attempt IDs, and transaction statuses (such as <code>NOT_STARTED</code>, <code>PENDING</code>, <code>PAID</code>, <code>FAILED</code>).</li>
            </ul>
          </section>

          {/* 3. Payment Processing & Card Security */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>3. PAYMENT PROCESSING DISCLOSURES</span>
            </h2>
            <div className="p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/20 space-y-2">
              <span className="font-bold text-bright-gold block text-xs uppercase tracking-wider">
                Raw Card Details Not Stored:
              </span>
              <p className="text-xs text-warm-cream/80 leading-relaxed">
                Online payment transactions are processed directly by authorized third-party payment gateways. This application does not collect, receive, or store raw credit/debit card numbers, CVVs, netbanking passwords, or UPI PINs.
              </p>
            </div>
            <p>
              Payment identifiers and transaction statuses returned by the payment processor are retained to verify booking fulfillment and facilitate duplicate payment reconciliation.
            </p>
          </section>

          {/* 4. Purpose & Use of Information */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>4. PURPOSE OF USE</span>
            </h2>
            <p>Information collected is used for the following operational purposes:</p>
            <div className="space-y-2.5 text-warm-cream/85">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <p>Generating and managing temporary 24-hour pass reservation holds.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <p>Generating printable on-screen Booking Request Receipts.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <p>Reconciling payment status and confirming ticket allocations.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <p>Referencing booking Request IDs for customer coordination and support.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <p>Communicating important updates or responding to attendee inquiries.</p>
              </div>
            </div>
          </section>

          {/* 5. Information Sharing */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>5. DATA SHARING &amp; DISCLOSURE</span>
            </h2>
            <p>
              We do not sell, rent, or trade your personal information. Information is shared only with:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-warm-cream/80">
              <li><strong>Payment Processors:</strong> Necessary transaction amounts and booking identifiers to facilitate payment processing.</li>
              <li><strong>Operational Infrastructure:</strong> Secure database hosting infrastructure and authorized Event Point coordination personnel.</li>
              <li><strong>Legal Authorities:</strong> Where required under applicable law or valid legal process.</li>
            </ul>
          </section>

          {/* 6. Technical Security Safeguards */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>6. TECHNICAL SECURITY SAFEGUARDS</span>
            </h2>
            <p>
              We implement reasonable technical measures to protect attendee data:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-warm-cream/80">
              <li>HTTPS/TLS encryption for data transmission between the browser and our servers.</li>
              <li>Cryptographic one-way SHA-256 hashing for booking recovery tokens. Raw recovery tokens are never stored in the database.</li>
              <li>HMAC-SHA256 signed HTTP-only cookies for lookup session authorization.</li>
            </ul>
          </section>

          {/* 7. Contact for Privacy Inquiries */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>7. PRIVACY QUESTIONS &amp; CONTACT</span>
            </h2>
            <p>
              For questions regarding your reservation details or data privacy, please contact:
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
