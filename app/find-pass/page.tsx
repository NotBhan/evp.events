import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/pages/PageHero';
import FindPassDesk from '@/components/booking/FindPassDesk';
import { eventData } from '@/data/eventData';

export const metadata: Metadata = {
  title: `Find Your Pass | ${eventData.eventName} ${eventData.year}`,
  description: `Recover your ${eventData.eventName} ${eventData.year} booking, view or print your pass receipt, complete a pending payment or cancel an eligible booking.`,
};

export default function FindPassPage() {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />

      <PageHero
        eyebrow="PASS RECOVERY DESK"
        title="FIND YOUR PASS"
        subtitle={`Recover your ${eventData.eventName} booking with the details you used at booking, then view or print your receipt, complete a pending payment, or cancel an eligible booking.`}
        badge="LOOKUP · RETRIEVE RECEIPT · COMPLETE PAYMENT · CANCEL"
      />

      <section
        id="find-pass-stage"
        className="relative z-20 py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-deep-plum border-b border-antique-gold/25"
      >
        <div className="relative z-10 max-w-6xl mx-auto">
          <FindPassDesk />
        </div>
      </section>

      <Footer />
    </main>
  );
}
