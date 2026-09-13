'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { eventData } from '@/data/eventData';
import { isReducedMotion } from '@/components/animations/interiorAnimations';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ContactContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const deskRef = useRef<HTMLElement>(null);
  const bookingSupportRef = useRef<HTMLElement>(null);
  const sponsorshipRef = useRef<HTMLElement>(null);
  const venueRef = useRef<HTMLElement>(null);
  const finalCtaRef = useRef<HTMLElement>(null);

  const primaryPhoneRaw = eventData.contacts.phones[0].replace(/\D/g, '');
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${primaryPhoneRaw}&text=${encodeURIComponent(
    'Hello Event Point! I would like to enquire about Raas Utsav 2026 at Chanakya BNR Hotel, Ranchi.'
  )}`;
  const sponsorMailto = `mailto:${eventData.contacts.emails[0]}?subject=${encodeURIComponent(
    'Raas Utsav 2026 — Sponsorship & Brand Partnership Enquiry'
  )}&body=${encodeURIComponent(
    'Hello Event Point Team,\n\nWe are interested in exploring sponsorship opportunities for Raas Utsav 2026 at Upwan Lawn, Chanakya BNR Hotel, Ranchi.\n\nOrganization / Brand:\nContact Person:\nContact Number:\nSpecific Interest (Title / Associate / Stall):\n\nRegards,'
  )}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isReducedMotion()) return;

    const ctx = gsap.context(() => {
      // 1. Hero Reveal
      if (heroRef.current) {
        const heroElements = heroRef.current.querySelectorAll('.animate-hero-item');
        gsap.fromTo(
          heroElements,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power2.out',
          }
        );
      }

      // 2. Coordination Desk Zones
      if (deskRef.current) {
        const zones = deskRef.current.querySelectorAll('.coordination-card');
        gsap.fromTo(
          zones,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: deskRef.current,
              start: 'top 82%',
              once: true,
            },
          }
        );
      }

      // 3. Booking Support
      if (bookingSupportRef.current) {
        const supportCard = bookingSupportRef.current.querySelector('.support-card');
        const steps = bookingSupportRef.current.querySelectorAll('.support-step');
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: bookingSupportRef.current,
            start: 'top 82%',
            once: true,
          },
        });

        if (supportCard) {
          tl.fromTo(
            supportCard,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
            0
          );
        }

        if (steps.length > 0) {
          tl.fromTo(
            steps,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
            0.2
          );
        }
      }

      // 4. Sponsorship Desk
      if (sponsorshipRef.current) {
        const sponsorCard = sponsorshipRef.current.querySelector('.sponsor-panel');
        const sponsorLine = sponsorshipRef.current.querySelector('.sponsor-line');
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sponsorshipRef.current,
            start: 'top 82%',
            once: true,
          },
        });

        if (sponsorLine) {
          tl.fromTo(
            sponsorLine,
            { scaleX: 0, transformOrigin: 'left center' },
            { scaleX: 1, duration: 0.8, ease: 'power2.inOut' },
            0
          );
        }

        if (sponsorCard) {
          tl.fromTo(
            sponsorCard,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' },
            0.15
          );
        }
      }

      // 5. Venue Section
      if (venueRef.current) {
        const venueImage = venueRef.current.querySelector('.venue-image-block');
        const venueInfo = venueRef.current.querySelector('.venue-info-block');
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: venueRef.current,
            start: 'top 80%',
            once: true,
          },
        });

        if (venueImage) {
          tl.fromTo(
            venueImage,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
            0
          );
        }

        if (venueInfo) {
          tl.fromTo(
            venueInfo,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
            0.15
          );
        }
      }

      // 6. Final CTA
      if (finalCtaRef.current) {
        const ctaCard = finalCtaRef.current.querySelector('.final-cta-card');
        if (ctaCard) {
          gsap.fromTo(
            ctaCard,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.75,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: finalCtaRef.current,
                start: 'top 85%',
                once: true,
              },
            }
          );
        }
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative z-10 w-full">
      {/* ====================================================================
          SECTION 1: CONTACT HERO ("LET'S TALK." + EVENT POINT BRANDING)
          ==================================================================== */}
      <section
        ref={heroRef}
        className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 lg:px-8 border-b border-antique-gold/25 overflow-hidden"
      >
        {/* Subtle royal glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-royal-maroon/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
            {/* Left: Headline & Description */}
            <div className="lg:col-span-7">
              <div className="animate-hero-item inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-royal-maroon/80 border border-antique-gold/40 text-bright-gold text-[11px] uppercase tracking-[0.25em] font-bold mb-6">
                <span>✦</span>
                <span>01 / OFFICIAL COORDINATION DESK</span>
              </div>

              <h1 className="animate-hero-item font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-bold tracking-tight uppercase leading-[0.92] mb-6">
                LET&apos;S<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-bright-gold via-warm-cream to-bright-gold">
                  TALK.
                </span>
              </h1>

              <p className="animate-hero-item font-body text-base sm:text-lg text-warm-cream/85 max-w-xl leading-relaxed mb-8">
                Bookings, sponsorship enquiries and event coordination. Direct, verified communication with the organizing team in Ranchi.
              </p>

              {/* Compact Date/Venue Strip */}
              <div className="animate-hero-item inline-flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5 px-4 rounded-xl bg-card-surface/70 border border-antique-gold/30 text-xs font-body text-warm-cream/90">
                <span className="text-bright-gold font-bold uppercase tracking-wider">16 OCT 2026</span>
                <span className="text-antique-gold/60">•</span>
                <span>5:00 PM – 11:00 PM</span>
                <span className="text-antique-gold/60">•</span>
                <span className="text-warm-cream">UPWAN LAWN, CHANAKYA BNR HOTEL</span>
              </div>
            </div>

            {/* Right: Authentic Event Point Branding Plaque */}
            <div className="lg:col-span-5 animate-hero-item">
              <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-royal-maroon/60 via-deep-plum/90 to-royal-maroon/40 border-2 border-antique-gold/45 shadow-2xl overflow-hidden">
                <div className="absolute inset-2 rounded-2xl border border-antique-gold/20 pointer-events-none" />
                <span className="absolute top-3 left-3 text-bright-gold text-[10px] select-none pointer-events-none">♦</span>
                <span className="absolute top-3 right-3 text-bright-gold text-[10px] select-none pointer-events-none">♦</span>
                <span className="absolute bottom-3 left-3 text-bright-gold text-[10px] select-none pointer-events-none">♦</span>
                <span className="absolute bottom-3 right-3 text-bright-gold text-[10px] select-none pointer-events-none">♦</span>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="relative w-44 h-32 sm:w-52 sm:h-38 mb-4">
                    <Image
                      src="/images/client/raascdr/web/eventpoint-logo.webp"
                      alt="Event Point Organizer Logo"
                      fill
                      priority
                      unoptimized
                      className="object-contain"
                    />
                  </div>

                  <span className="font-display text-sm sm:text-base text-bright-gold uppercase tracking-[0.2em] font-bold mb-1">
                    EVENT POINT
                  </span>
                  <p className="font-body text-xs text-warm-cream/75 italic mb-4">
                    {eventData.organizer.tagline || 'A Shop for complete Event Solution'}
                  </p>

                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-antique-gold/60 to-transparent mb-4" />

                  <span className="font-body text-[11px] text-warm-cream/80 uppercase tracking-wider">
                    Main Road, Ranchi, Jharkhand
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 2: OFFICIAL COORDINATION DESK (3 LARGE CONTACT ZONES)
          ==================================================================== */}
      <section
        ref={deskRef}
        className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-b border-antique-gold/25 bg-deep-plum/95"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-body text-xs text-bright-gold uppercase tracking-[0.25em] font-bold block mb-2">
              DIRECT COMMUNICATION
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-wide uppercase">
              OFFICIAL COORDINATION DESK
            </h2>
            <div className="h-0.5 max-w-xs mx-auto bg-gradient-to-r from-transparent via-antique-gold to-transparent mt-4 mb-3" />
            <p className="font-body text-sm text-warm-cream/80">
              Immediate, direct coordination for festival passes, guest hospitality, and event arrangements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Zone 1: WhatsApp */}
            <div className="coordination-card relative p-7 sm:p-8 rounded-3xl bg-card-surface border-2 border-antique-gold/40 hover:border-bright-gold transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div className="absolute inset-2 rounded-2xl border border-antique-gold/15 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-body text-[11px] text-bright-gold uppercase tracking-[0.2em] font-bold">
                    FASTEST RESPONSE
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] shadow-[0_0_8px_#25D366]" aria-hidden="true" />
                </div>

                <h3 className="font-display text-2xl sm:text-3xl text-warm-cream uppercase tracking-wide mb-1">
                  WHATSAPP
                </h3>
                <p className="font-body text-xs text-bright-gold uppercase tracking-widest font-semibold mb-4">
                  CHAT WITH EVENT POINT
                </p>

                <p className="font-body text-xs sm:text-sm text-warm-cream/80 leading-relaxed mb-6">
                  Direct WhatsApp messaging with festival coordinators for pass status, group counts, and fast query resolution.
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-antique-gold/20">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-deep-plum font-display text-sm tracking-wider uppercase font-bold shadow-lg transition-transform duration-150 active:scale-[0.98]"
                >
                  <span>CHAT ON WHATSAPP</span>
                  <span className="text-xs">→</span>
                </a>
                <span className="block text-center font-body text-[11px] text-warm-cream/65 mt-2">
                  +91 99315 03960
                </span>
              </div>
            </div>

            {/* Zone 2: Phone */}
            <div className="coordination-card relative p-7 sm:p-8 rounded-3xl bg-card-surface border-2 border-antique-gold/40 hover:border-bright-gold transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div className="absolute inset-2 rounded-2xl border border-antique-gold/15 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-body text-[11px] text-bright-gold uppercase tracking-[0.2em] font-bold">
                    VOICE HELPLINE
                  </span>
                  <span className="text-bright-gold text-xs">♦</span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl text-warm-cream uppercase tracking-wide mb-1">
                  PHONE
                </h3>
                <p className="font-body text-xs text-bright-gold uppercase tracking-widest font-semibold mb-4">
                  CALL THE BOX OFFICE
                </p>

                <p className="font-body text-xs sm:text-sm text-warm-cream/80 leading-relaxed mb-6">
                  Speak directly with festival managers regarding pass booking confirmations, bulk passes, or entry guidance.
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-antique-gold/20 space-y-2">
                {eventData.contacts.phones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="w-full inline-flex items-center justify-between py-2.5 px-3.5 rounded-lg bg-royal-maroon/70 hover:bg-royal-maroon text-warm-cream border border-antique-gold/30 hover:border-bright-gold text-xs sm:text-sm font-body font-semibold transition-colors"
                  >
                    <span>{phone}</span>
                    <span className="text-bright-gold text-xs uppercase font-bold tracking-wider">CALL</span>
                  </a>
                ))}
                <span className="block text-center font-body text-[11px] text-warm-cream/65 pt-1">
                  Daily: 10:00 AM – 9:00 PM IST
                </span>
              </div>
            </div>

            {/* Zone 3: Email */}
            <div className="coordination-card relative p-7 sm:p-8 rounded-3xl bg-card-surface border-2 border-antique-gold/40 hover:border-bright-gold transition-all duration-300 shadow-xl flex flex-col justify-between group">
              <div className="absolute inset-2 rounded-2xl border border-antique-gold/15 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-body text-[11px] text-bright-gold uppercase tracking-[0.2em] font-bold">
                    OFFICIAL CORRESPONDENCE
                  </span>
                  <span className="text-bright-gold text-xs">✦</span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl text-warm-cream uppercase tracking-wide mb-1">
                  EMAIL
                </h3>
                <p className="font-body text-xs text-bright-gold uppercase tracking-widest font-semibold mb-4">
                  EMAIL EVENT POINT
                </p>

                <p className="font-body text-xs sm:text-sm text-warm-cream/80 leading-relaxed mb-6">
                  Official correspondence for brand sponsorships, corporate pass allocations, vendor queries, and official receipts.
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-antique-gold/20 space-y-2">
                {eventData.contacts.emails.map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className="w-full inline-flex items-center justify-between py-2.5 px-3.5 rounded-lg bg-royal-maroon/70 hover:bg-royal-maroon text-warm-cream border border-antique-gold/30 hover:border-bright-gold text-xs font-body font-semibold transition-colors break-all"
                  >
                    <span className="truncate pr-2">{email}</span>
                    <span className="text-bright-gold text-xs uppercase font-bold tracking-wider shrink-0">EMAIL</span>
                  </a>
                ))}
                <span className="block text-center font-body text-[11px] text-warm-cream/65 pt-1">
                  Response within 24 festival hours
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 3: BOOKING SUPPORT & DISCLOSURE
          ==================================================================== */}
      <section
        ref={bookingSupportRef}
        className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-b border-antique-gold/25 bg-royal-maroon/20"
      >
        <div className="max-w-5xl mx-auto">
          <div className="support-card relative p-8 sm:p-12 md:p-14 rounded-3xl bg-card-surface border-2 border-antique-gold/45 shadow-2xl overflow-hidden">
            <div className="absolute inset-2 sm:inset-3 rounded-2xl border border-antique-gold/20 pointer-events-none" />
            <span className="absolute top-4 left-4 text-bright-gold text-[10px] select-none pointer-events-none">♦</span>
            <span className="absolute top-4 right-4 text-bright-gold text-[10px] select-none pointer-events-none">♦</span>
            <span className="absolute bottom-4 left-4 text-bright-gold text-[10px] select-none pointer-events-none">♦</span>
            <span className="absolute bottom-4 right-4 text-bright-gold text-[10px] select-none pointer-events-none">♦</span>

            <div className="relative z-10 text-center max-w-2xl mx-auto mb-12">
              <span className="font-body text-xs text-bright-gold uppercase tracking-[0.25em] font-bold block mb-2">
                TRANSPARENT PASS PROCESS
              </span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-wide uppercase">
                NEED HELP WITH YOUR PASS?
              </h2>
              <div className="h-0.5 max-w-xs mx-auto bg-gradient-to-r from-transparent via-antique-gold to-transparent mt-4 mb-4" />
              <p className="font-body text-sm sm:text-base text-warm-cream/85">
                Our pass booking desk operates with complete clarity. Here is how your booking request progresses from form to venue entry.
              </p>
            </div>

            {/* 4 Steps */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="support-step p-5 rounded-2xl bg-deep-plum/80 border border-antique-gold/30 flex flex-col">
                <span className="font-display text-2xl text-bright-gold font-bold mb-2">01</span>
                <h3 className="font-display text-base text-warm-cream uppercase tracking-wide mb-2">
                  SELECT A PASS
                </h3>
                <p className="font-body text-xs text-warm-cream/75 leading-relaxed">
                  Choose from Solo Female, Couple, Family, Group, or VIP access with authoritative transparent pricing.
                </p>
              </div>

              <div className="support-step p-5 rounded-2xl bg-deep-plum/80 border border-antique-gold/30 flex flex-col">
                <span className="font-display text-2xl text-bright-gold font-bold mb-2">02</span>
                <h3 className="font-display text-base text-warm-cream uppercase tracking-wide mb-2">
                  ENTER DETAILS
                </h3>
                <p className="font-body text-xs text-warm-cream/75 leading-relaxed">
                  Provide primary attendee name, WhatsApp phone number, email, and city of residence.
                </p>
              </div>

              <div className="support-step p-5 rounded-2xl bg-deep-plum/80 border border-antique-gold/30 flex flex-col">
                <span className="font-display text-2xl text-bright-gold font-bold mb-2">03</span>
                <h3 className="font-display text-base text-warm-cream uppercase tracking-wide mb-2">
                  SUBMIT REQUEST
                </h3>
                <p className="font-body text-xs text-warm-cream/75 leading-relaxed">
                  Generate your official Booking Request ID and instantly receive your printable receipt document.
                </p>
              </div>

              <div className="support-step p-5 rounded-2xl bg-deep-plum/80 border border-antique-gold/30 flex flex-col">
                <span className="font-display text-2xl text-bright-gold font-bold mb-2">04</span>
                <h3 className="font-display text-base text-warm-cream uppercase tracking-wide mb-2">
                  DESK REVIEWS
                </h3>
                <p className="font-body text-xs text-warm-cream/75 leading-relaxed">
                  The Event Point coordination desk reviews and connects with the attendee to finalize collection.
                </p>
              </div>
            </div>

            {/* Non-Ticket Disclaimer Callout */}
            <div className="relative z-10 p-5 rounded-xl bg-royal-maroon/80 border border-vermilion/50 text-center max-w-2xl mx-auto mb-8">
              <p className="font-body text-xs sm:text-sm text-warm-cream font-medium leading-relaxed">
                <span className="text-bright-gold font-bold uppercase tracking-wider block sm:inline mr-2">Notice:</span>
                Submitting a booking request does not constitute payment or final ticket confirmation. Final pass allocation and payment/collection details are handled by the Event Point team.
              </p>
            </div>

            {/* CTA to Booking Desk */}
            <div className="relative z-10 text-center">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-vermilion text-warm-cream font-display text-base tracking-wider uppercase font-bold border border-antique-gold/70 shadow-lg hover:scale-[1.02] transition-transform duration-150"
              >
                <span>OPEN BOOKING DESK</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 4: SPONSORSHIP DESK ("PARTNER WITH RAAS UTSAV.")
          ==================================================================== */}
      <section
        ref={sponsorshipRef}
        className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-b border-antique-gold/25 bg-deep-plum"
      >
        <div className="max-w-6xl mx-auto">
          <div className="sponsor-panel relative p-8 sm:p-12 md:p-14 rounded-3xl bg-card-surface border-2 border-bright-gold/50 shadow-2xl overflow-hidden">
            {/* Gold Drawing Keyline */}
            <div className="sponsor-line absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-antique-gold via-bright-gold to-antique-gold" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-maroon border border-bright-gold/40 text-bright-gold text-[11px] uppercase tracking-[0.2em] font-bold mb-4">
                  <span>✦</span>
                  <span>CORPORATE &amp; BRAND OPPORTUNITIES</span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-tight uppercase mb-4">
                  PARTNER WITH<br />
                  <span className="text-bright-gold">RAAS UTSAV.</span>
                </h2>

                <p className="font-body text-sm sm:text-base text-warm-cream/85 leading-relaxed mb-6 max-w-2xl">
                  Connect your brand with Jharkhand&apos;s most anticipated Dandiya festival. Opportunities include Title Partnership, Powered By branding, Associate Sponsorships, and Food &amp; Retail stall allocations at Chanakya BNR Hotel grounds.
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs font-body text-bright-gold font-semibold uppercase tracking-wider">
                  <span className="px-3 py-1.5 rounded-lg bg-deep-plum/80 border border-antique-gold/30">
                    Title &amp; Associate Partners
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-deep-plum/80 border border-antique-gold/30">
                    Food &amp; Beverage Stalls
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-deep-plum/80 border border-antique-gold/30">
                    Retail &amp; Experience Booths
                  </span>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3">
                <a
                  href={sponsorMailto}
                  className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-sm tracking-wider uppercase font-bold border border-antique-gold/70 shadow-lg hover:scale-[1.02] transition-transform duration-150 text-center"
                >
                  <span>SEND SPONSORSHIP ENQUIRY</span>
                  <span>→</span>
                </a>

                <a
                  href={`tel:${primaryPhoneRaw}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-royal-maroon hover:bg-royal-maroon/80 text-warm-cream font-display text-xs tracking-wider uppercase border border-antique-gold/40 hover:border-bright-gold transition-colors text-center font-semibold"
                >
                  <span>CALL SPONSORSHIP DESK (+91 99315 03960)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 5: VENUE SECTION ("MEET US AT UPWAN LAWN.")
          ==================================================================== */}
      <section
        ref={venueRef}
        className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-b border-antique-gold/25 bg-royal-maroon/15"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-body text-xs text-bright-gold uppercase tracking-[0.25em] font-bold block mb-2">
              FESTIVAL DESTINATION
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-wide uppercase">
              MEET US AT<br />
              <span className="text-bright-gold">UPWAN LAWN.</span>
            </h2>
            <div className="h-0.5 max-w-xs mx-auto bg-gradient-to-r from-transparent via-antique-gold to-transparent mt-4 mb-3" />
            <p className="font-body text-sm text-warm-cream/80">
              The grand celebration grounds at Chanakya BNR Hotel, Ranchi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Venue Image */}
            <div className="venue-image-block lg:col-span-7 relative min-h-[300px] sm:min-h-[400px] rounded-3xl overflow-hidden border-2 border-antique-gold/40 shadow-2xl">
              <Image
                src="/images/client/venue-bnr-chanakya.jpg"
                alt="Upwan Lawn at Chanakya BNR Hotel, Ranchi"
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-plum/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 px-4 py-2 rounded-xl bg-deep-plum/80 border border-antique-gold/40 text-xs font-body text-warm-cream">
                <span className="text-bright-gold font-bold uppercase tracking-wider block">OFFICIAL VENUE GROUNDS</span>
                <span>Upwan Lawn, Chanakya BNR Hotel, Ranchi</span>
              </div>
            </div>

            {/* Venue Metadata Box */}
            <div className="venue-info-block lg:col-span-5 p-8 sm:p-10 rounded-3xl bg-card-surface border-2 border-antique-gold/40 shadow-xl flex flex-col justify-between">
              <div>
                <span className="font-body text-xs text-bright-gold uppercase tracking-[0.2em] font-bold block mb-2">
                  EVENT DETAILS
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-warm-cream uppercase tracking-wide mb-6">
                  CHANAKYA BNR HOTEL
                </h3>

                <div className="space-y-4 font-body text-sm text-warm-cream/85">
                  <div className="p-3.5 rounded-xl bg-deep-plum/70 border border-antique-gold/25">
                    <span className="text-[11px] text-bright-gold uppercase tracking-wider font-bold block mb-0.5">
                      DATE
                    </span>
                    <span className="font-semibold text-warm-cream">16 OCTOBER 2026</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-deep-plum/70 border border-antique-gold/25">
                    <span className="text-[11px] text-bright-gold uppercase tracking-wider font-bold block mb-0.5">
                      HOURS
                    </span>
                    <span className="font-semibold text-warm-cream">5:00 PM – 11:00 PM</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-deep-plum/70 border border-antique-gold/25">
                    <span className="text-[11px] text-bright-gold uppercase tracking-wider font-bold block mb-0.5">
                      LOCATION
                    </span>
                    <span className="font-semibold text-warm-cream block">Upwan Lawn, Chanakya BNR Hotel</span>
                    <span className="text-xs text-warm-cream/70">Station Road, Ranchi, Jharkhand</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-antique-gold/20">
                <a
                  href="https://maps.google.com/?q=Chanakya+BNR+Hotel+Ranchi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-royal-maroon hover:bg-royal-maroon/80 text-warm-cream font-display text-xs tracking-wider uppercase border border-antique-gold/40 hover:border-bright-gold transition-colors font-bold text-center"
                >
                  <span>VIEW LOCATION ON GOOGLE MAPS</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 6: FINAL CTA ("READY TO MAKE IT A NIGHT?")
          ==================================================================== */}
      <section
        ref={finalCtaRef}
        className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-deep-plum text-center overflow-hidden"
      >
        <div className="max-w-4xl mx-auto">
          <div className="final-cta-card relative p-10 sm:p-14 md:p-16 rounded-3xl bg-card-surface border-2 border-antique-gold/45 shadow-2xl overflow-hidden">
            <div className="absolute inset-2 sm:inset-3 rounded-2xl border border-antique-gold/20 pointer-events-none" />
            <span className="absolute top-4 left-4 text-bright-gold text-[10px] select-none pointer-events-none">♦</span>
            <span className="absolute top-4 right-4 text-bright-gold text-[10px] select-none pointer-events-none">♦</span>
            <span className="absolute bottom-4 left-4 text-bright-gold text-[10px] select-none pointer-events-none">♦</span>
            <span className="absolute bottom-4 right-4 text-bright-gold text-[10px] select-none pointer-events-none">♦</span>

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="font-body text-xs text-bright-gold uppercase tracking-[0.25em] font-bold block mb-3">
                JOIN THE CELEBRATION
              </span>

              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-tight uppercase mb-4">
                READY TO MAKE IT A NIGHT?
              </h2>

              <p className="font-body text-sm sm:text-base text-warm-cream/85 leading-relaxed mb-8">
                Choose your pass or contact Event Point directly to confirm your group reservation for Raas Utsav 2026.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <Link
                  href="/booking"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-vermilion text-warm-cream font-display text-base tracking-wider uppercase font-bold border border-antique-gold/70 shadow-lg hover:scale-[1.02] transition-transform duration-150"
                >
                  <span>BOOK YOUR PASS</span>
                  <span>→</span>
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-royal-maroon hover:bg-royal-maroon/80 text-warm-cream font-display text-base tracking-wider uppercase font-bold border border-antique-gold/40 hover:border-bright-gold transition-colors"
                >
                  <span>WHATSAPP EVENT POINT</span>
                </a>
              </div>

              {/* Event Point Contacts Summary */}
              <div className="pt-6 border-t border-antique-gold/20 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-body text-warm-cream/75">
                <span>Phone: +91 99315 03960 / +91 85400 06033 / +91 94301 12440</span>
                <span>•</span>
                <span>Email: eventpoint42@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
