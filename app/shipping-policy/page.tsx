import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { eventData } from '@/data/eventData';
import { Truck, CheckCircle2, Clock, FileText, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: `Shipping & Delivery Policy | ${eventData.eventName} ${eventData.year}`,
  description: `Official fulfillment and delivery policy for ${eventData.eventName} ${eventData.year}. Details instant digital pass confirmation receipt issuance and online retrieval.`,
};

export default function ShippingPolicyPage() {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />

      <div className="pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-royal-maroon/80 border border-antique-gold/40 text-bright-gold text-[11px] uppercase tracking-[0.14em] font-bold mb-4">
            <Truck className="w-3.5 h-3.5 text-bright-gold" />
            <span>DIGITAL PASS FULFILLMENT</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl text-warm-cream font-bold tracking-tight uppercase leading-tight">
            SHIPPING &amp; FULFILLMENT POLICY
          </h1>

          <div className="h-0.5 max-w-xs mx-auto bg-gradient-to-r from-transparent via-bright-gold to-transparent my-4" />

          <p className="font-body text-xs sm:text-sm text-warm-cream/80 max-w-xl mx-auto leading-relaxed">
            Information regarding electronic pass confirmation and digital delivery for {eventData.eventName} {eventData.year}.
          </p>

          <span className="inline-block mt-3 text-[11px] font-body text-antique-gold/70">
            Last Updated: September 2026 · Valid for {eventData.year} Edition
          </span>
        </div>

        {/* Nature of Service Notice */}
        <div className="p-4 sm:p-5 rounded-2xl bg-royal-maroon/60 border border-antique-gold/30 mb-10 text-xs font-body text-warm-cream/85">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-bright-gold uppercase tracking-wider block mb-1">
                Event Service Notice (Digital Fulfillment):
              </span>
              <p className="leading-relaxed">
                {eventData.eventName} is a live cultural festival event. All pass reservations and confirmations are fulfilled electronically through on-screen booking confirmation receipts. We do not dispatch physical items via courier or postal mail.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Body */}
        <div className="space-y-10 font-body text-xs sm:text-sm text-warm-cream/90 leading-relaxed">
          {/* 1. Digital Receipt Delivery */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-5 h-5 text-bright-gold shrink-0" />
              <span>1. DIGITAL PASS CONFIRMATION (INSTANT ELECTRONIC DELIVERY)</span>
            </h2>
            <p>
              Upon completing a reservation request and payment transaction, your official Booking Request Receipt is generated <strong>immediately on-screen</strong>.
            </p>
            <div className="p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/20 space-y-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs">
                  <strong>Delivery Timeline:</strong> Instantaneous (0 business days). Your receipt appears immediately upon submission.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs">
                  <strong>Delivery Charges:</strong> ₹0 (Free digital fulfillment). No shipping, courier, handling, or convenience delivery fees are charged.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs">
                  <strong>Printable / PDF Access:</strong> You can download or print your reservation receipt at any time directly from the receipt screen.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Booking Reference */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-bright-gold shrink-0" />
              <span>2. BOOKING REFERENCE &amp; RECEIPT RETENTION</span>
            </h2>
            <p>
              Each confirmed booking generates a unique Request ID displayed on the reservation receipt. Attendees should retain their digital receipt on their mobile device or keep a printed copy for booking reference and support inquiries.
            </p>
          </section>

          {/* 3. Lost Receipt Recovery */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-5 h-5 text-bright-gold shrink-0" />
              <span>3. LOST RECEIPT OR NON-DELIVERY RECOVERY</span>
            </h2>
            <p>
              If you accidentally close your browser window or misplace your printed receipt:
            </p>
            <p>
              You can instantly retrieve your reservation record at our{' '}
              <Link href="/booking" className="text-bright-gold underline hover:text-warm-cream font-bold">
                Booking Lookup Desk
              </Link>{' '}
              by entering your registered phone number and Request ID.
            </p>
            <p>
              Alternatively, our coordination desk is available on WhatsApp / Phone at <code>+91 94301 12440</code> (or <code>+91 99315 03960</code>) to resend your booking verification stub.
            </p>
          </section>

          {/* 4. Support Coordinates */}
          <section className="p-6 sm:p-8 rounded-3xl bg-card-surface border border-antique-gold/30 shadow-lg space-y-4">
            <h2 className="font-display text-lg sm:text-xl text-bright-gold uppercase tracking-wider flex items-center gap-2">
              <span>4. FULFILLMENT HELP &amp; COORDINATION</span>
            </h2>
            <p>
              For pass fulfillment inquiries, group bookings, or venue guidance:
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
