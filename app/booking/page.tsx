import React, { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PageHero from '@/components/pages/PageHero';
import Footer from '@/components/Footer';
import BookingDesk from '@/components/booking/BookingDesk';
import DandiyaSticks from '@/components/decorations/DandiyaSticks';
import InteriorReveal from '@/components/animations/InteriorReveal';
import { eventData } from '@/data/eventData';
import { ShieldCheck, Phone, CheckCircle2, Ticket } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Book Passes | ${eventData.eventName} ${eventData.year}`,
  description: `Submit pass booking enquiries for ${eventData.eventName} on ${eventData.dateDisplay} at ${eventData.venueDisplay}. Direct coordination via ${eventData.organizer.name}.`,
};

interface BookingPageProps {
  searchParams: Promise<{ pass?: string; bookingId?: string }>;
}

async function BookingDeskWrapper({ searchParams }: { searchParams: Promise<{ pass?: string; bookingId?: string }> }) {
  const resolvedParams = await searchParams;
  return <BookingDesk initialPassId={resolvedParams.pass} initialBookingId={resolvedParams.bookingId} />;
}

export default function BookingPage({ searchParams }: BookingPageProps) {
  return (
    <main className="relative min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream overflow-x-clip">
      <Navbar />

      {/* ====================================================================
          SECTION 1: PAGE HERO (Official Box Office Header with Intro Animation)
          ==================================================================== */}
      <PageHero
        eyebrow="OFFICIAL FESTIVAL BOX OFFICE"
        title="RESERVE YOUR PASS"
        subtitle={`Direct pass booking enquiry desk for ${eventData.eventName} on ${eventData.dateDisplay} at ${eventData.venueDisplay}. Follow the 3 simple steps below to record your pass request directly with our event team.`}
        badge="DIRECT EVENT DESK · ZERO CONVENIENCE FEES"
      />

      {/* ====================================================================
          SECTION 2: DEDICATED 3-STAGE INTERACTIVE BOOKING DESK
          ==================================================================== */}
      <section id="booking-stage" className="relative z-20 py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-deep-plum overflow-hidden border-b border-antique-gold/25">
        {/* Full-Section Atmospheric Background Image Layer */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <Image
            src={eventData.gallery.crowdCelebration.src}
            alt="Festival crowd celebrating under the evening sky"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-45 scale-105 transition-transform duration-1000"
          />
          {/* Deep Plum Overlay for Legibility */}
          <div className="absolute inset-0 bg-deep-plum/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-plum/95 via-transparent via-30% to-deep-plum/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-deep-plum/50 via-transparent to-deep-plum/50" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <Suspense fallback={<div className="p-12 text-center text-bright-gold font-body">Loading Festival Box Office...</div>}>
            <BookingDeskWrapper searchParams={searchParams} />
          </Suspense>
        </div>
      </section>

      {/* ====================================================================
          SECTION 3: BOOKING REASSURANCE & EVENT DESK GUIDANCE
          ==================================================================== */}
      <section className="relative z-20 py-20 px-4 sm:px-6 lg:px-8 bg-royal-maroon/25 border-b border-antique-gold/20">
        <div className="max-w-6xl mx-auto">
          <InteriorReveal variant="up" className="text-center max-w-2xl mx-auto mb-14">
            <div className="flex items-center justify-center mb-3">
              <DandiyaSticks size={48} className="text-bright-gold" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-royal-maroon/80 border border-antique-gold/50 text-bright-gold font-body text-xs uppercase tracking-widest mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-vermilion" />
              <span>OFFICIAL TICKET PROTOCOL</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-warm-cream tracking-wide uppercase">
              PASS RESERVATION INFORMATION
            </h2>
          </InteriorReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
            <InteriorReveal variant="up" delay={0.05} className="h-full">
              <div className="rounded-2xl bg-card-surface border border-antique-gold/30 p-6 sm:p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 rounded-full bg-vermilion/20 border border-vermilion/60 flex items-center justify-center text-vermilion mb-4">
                    <CheckCircle2 className="w-5 h-5 text-bright-gold" />
                  </div>
                  <h3 className="font-display text-2xl text-warm-cream uppercase tracking-wide mb-2">
                    Direct Organizer Booking
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-warm-cream/80 leading-relaxed">
                    All pass reservations are processed directly through {eventData.organizer.name} coordinators. No third-party ticketing markups or platform booking charges.
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-antique-gold/20 text-xs text-bright-gold font-body font-semibold">
                  Official Event Point Guarantee
                </div>
              </div>
            </InteriorReveal>

            <InteriorReveal variant="up" delay={0.15} className="h-full">
              <div className="rounded-2xl bg-card-surface border border-antique-gold/30 p-6 sm:p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 rounded-full bg-amber-glow/20 border border-amber-glow/60 flex items-center justify-center text-amber-glow mb-4">
                    <Ticket className="w-5 h-5 text-bright-gold" />
                  </div>
                  <h3 className="font-display text-2xl text-warm-cream uppercase tracking-wide mb-2">
                    Digital Pass Confirmation
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-warm-cream/80 leading-relaxed">
                    Upon completing your booking and payment, your official digital booking receipt is generated immediately on-screen with zero delivery charges.
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-antique-gold/20 text-xs text-bright-gold font-body font-semibold">
                  Instant Electronic Fulfillment
                </div>
              </div>
            </InteriorReveal>

            <InteriorReveal variant="up" delay={0.25} className="h-full">
              <div className="rounded-2xl bg-card-surface border border-antique-gold/30 p-6 sm:p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="w-10 h-10 rounded-full bg-bright-gold/20 border border-bright-gold/60 flex items-center justify-center text-bright-gold mb-4">
                    <Phone className="w-5 h-5 text-bright-gold" />
                  </div>
                  <h3 className="font-display text-2xl text-warm-cream uppercase tracking-wide mb-2">
                    Instant WhatsApp Desk
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-warm-cream/80 leading-relaxed">
                    Have questions regarding bulk group passes or corporate reservations? Chat directly with our Ranchi coordinators for immediate assistance.
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-antique-gold/20 text-xs text-bright-gold font-body font-semibold">
                  Call: {eventData.contacts.phones[0]}
                </div>
              </div>
            </InteriorReveal>
          </div>

          {/* Quick Help Strip */}
          <InteriorReveal variant="up" delay={0.3}>
            <div className="rounded-xl bg-deep-plum border border-antique-gold/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <span className="text-bright-gold text-base shrink-0" aria-hidden="true">✦</span>
                <span className="font-body text-xs sm:text-sm text-warm-cream">
                  Looking for festival sponsorship or stall allocations? Visit our dedicated enquiry channel.
                </span>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-royal-maroon hover:bg-royal-maroon/80 border border-antique-gold/60 text-bright-gold font-display text-sm tracking-wider uppercase whitespace-nowrap transition-colors"
              >
                <span>Contact Organizers</span>
                <span>→</span>
              </Link>
            </div>
          </InteriorReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
