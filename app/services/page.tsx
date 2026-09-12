import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServicesContent from '@/components/services/ServicesContent';
import { eventData } from '@/data/eventData';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `The Festival Experience & Passes | ${eventData.eventName} ${eventData.year}`,
  description: `Explore authentic folk rhythms, circular Garba arena, themed royal décor, and official pass categories for ${eventData.eventName} on ${eventData.dateDisplay} at ${eventData.venueDisplay}.`,
};

export default function ServicesPage() {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />
      <ServicesContent />
      <Footer />
    </main>
  );
}
