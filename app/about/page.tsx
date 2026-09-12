import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AboutContent from '@/components/about/AboutContent';
import { eventData } from '@/data/eventData';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `About Raas Utsav | ${eventData.eventName} ${eventData.year}`,
  description: 'The royal heritage setting, cultural roots, and devotional spirit behind Raas Utsav 2026 at Chanakya BNR Hotel, Ranchi.',
};

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />
      <AboutContent />
      <Footer />
    </main>
  );
}
