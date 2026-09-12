import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactContent from '@/components/contact/ContactContent';
import { eventData } from '@/data/eventData';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Contact & Helpdesk | ${eventData.eventName} ${eventData.year}`,
  description: `Official coordination desk for Raas Utsav 2026. Direct contacts for pass reservations, group bookings, sponsorship, and festival inquiries at Chanakya BNR Hotel, Ranchi.`,
};

export default function ContactPage() {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />
      <ContactContent />
      <Footer />
    </main>
  );
}
