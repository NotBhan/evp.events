import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { eventData } from '@/data/eventData';
import FolkBorder from './decorations/FolkBorder';
import { Ticket, MapPin, Calendar, Clock, ArrowUpRight, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-30 w-full bg-deep-plum border-t-2 border-antique-gold/30 text-warm-cream pt-16 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Subtle Radial Devotional Maroon Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-royal-maroon/50 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Decorative Folk Border */}
        <div className="w-full max-w-md mx-auto mb-12 opacity-80">
          <FolkBorder />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 mb-14">
          {/* Brand & Organizer Summary */}
          <div className="md:col-span-5 flex flex-col items-start text-left">
            <Link href="/" className="flex items-center gap-3 group mb-4 select-none" aria-label="Raas Utsav 2026 — Home">
              <div className="relative w-10 h-10 shrink-0">
                <Image
                  src="/images/client/raascdr/web/eventpoint-logo-nav.webp"
                  alt="Event Point Logo"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <span className="h-8 w-[1px] bg-antique-gold/40 shrink-0" aria-hidden="true" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-2xl text-warm-cream tracking-wide group-hover:text-bright-gold transition-colors">
                    {eventData.eventName}
                  </span>
                  <span className="text-vermilion text-xs" aria-hidden="true">♦</span>
                </div>
                <span className="block font-body text-[10px] text-antique-gold tracking-[0.1em] font-bold uppercase -mt-0.5">
                  {eventData.year} · {eventData.organizer.name}
                </span>
              </div>
            </Link>

            <p className="font-body text-sm text-warm-cream/80 max-w-sm leading-relaxed mb-4">
              {eventData.tagline}. An authentic grand festival of devotion, live rhythm, circular Garba, and celebration under starlit skies at the historic BNR Chanakya, Ranchi.
            </p>

            {/* Official Organizer Provenance with Event Point Logo from RAASCDR */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-royal-maroon/70 border border-antique-gold/40 shadow-sm max-w-sm">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-8 shrink-0">
                  <Image
                    src="/images/client/raascdr/web/eventpoint-logo.webp"
                    alt="Event Point Official Organizer Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-body text-bright-gold font-bold tracking-wider uppercase">
                    {eventData.organizer.name}
                  </span>
                  <span className="text-[9px] font-body text-warm-cream/70">
                    Official Presentation &amp; Event Solutions
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-antique-gold/20 text-[10px] text-warm-cream/70 leading-tight">
                <span className="text-bright-gold font-semibold uppercase">Business:</span> {eventData.business.name} (Individual Name: {eventData.business.individualName}) · Harmu Road, Argoa, Ranchi 834002
              </div>
            </div>
          </div>

            {/* Navigation Links */}
          <div className="md:col-span-2 flex flex-col">
            <h3 className="font-display text-lg text-bright-gold tracking-wider uppercase mb-4 flex items-center gap-2">
              <span>EXPLORE</span>
              <span className="text-vermilion text-xs">♦</span>
            </h3>
            <ul className="space-y-2 font-body text-xs sm:text-sm text-warm-cream/80">
              <li>
                <Link href="/" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-vermilion text-[8px]">♦</span>
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-vermilion text-[8px]">♦</span>
                  <span>About</span>
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-vermilion text-[8px]">♦</span>
                  <span>Services</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-vermilion text-[8px]">♦</span>
                  <span>Contact</span>
                </Link>
              </li>
              <li>
                <Link href="/booking" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-vermilion text-[8px]">♦</span>
                  <span>Pass Booking</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Mandatory Compliance Policies */}
          <div className="md:col-span-3 flex flex-col">
            <h3 className="font-display text-lg text-bright-gold tracking-wider uppercase mb-4 flex items-center gap-2">
              <span>POLICIES</span>
              <span className="text-vermilion text-xs">♦</span>
            </h3>
            <ul className="space-y-2 font-body text-xs sm:text-sm text-warm-cream/80">
              <li>
                <Link href="/pricing" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-bright-gold text-[8px]">♦</span>
                  <span>Pricing Details</span>
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-bright-gold text-[8px]">♦</span>
                  <span>Terms &amp; Conditions</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-bright-gold text-[8px]">♦</span>
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/refund-and-cancellation" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-bright-gold text-[8px]">♦</span>
                  <span>Cancellation &amp; Refund</span>
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-bright-gold text-[8px]">♦</span>
                  <span>Shipping &amp; Fulfillment</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Event Logistics & Quick Booking */}
          <div className="md:col-span-3 flex flex-col">
            <h3 className="font-display text-lg text-bright-gold tracking-wider uppercase mb-4 flex items-center gap-2">
              <span>FESTIVAL DETAILS</span>
              <span className="text-vermilion text-xs">♦</span>
            </h3>
            <div className="space-y-2.5 font-body text-xs text-warm-cream/90">
              <div className="flex items-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-vermilion shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-warm-cream block">{eventData.dateDisplay}</span>
                  <span className="text-[10px] text-warm-cream/70">5:00 PM – 11:00 PM</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-bright-gold shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-warm-cream block">Upwan Lawn, Chanakya BNR</span>
                  <span className="text-[10px] text-warm-cream/70">Station Road, Ranchi</span>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-0.5">
                <Phone className="w-3.5 h-3.5 text-bright-gold shrink-0 mt-0.5" />
                <div className="flex flex-col text-[10px]">
                  <span>{eventData.contacts.phones[0]}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-bright-gold shrink-0 mt-0.5" />
                <span className="text-[10px] break-all">{eventData.contacts.emails[0]}</span>
              </div>
            </div>

            <div className="mt-4">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-xs tracking-wider uppercase border border-antique-gold/70 shadow-md hover:scale-105 transition-transform font-bold"
              >
                <Ticket className="w-3.5 h-3.5 text-bright-gold" />
                <span>{eventData.ctas.primary}</span>
                <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Note & Copyright */}
        <div className="pt-8 border-t border-antique-gold/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs font-body text-warm-cream/60">
          <p>
            © {eventData.year} {eventData.eventName}. Presented by {eventData.organizer.name}. Business Name: {eventData.business.name}. All rights reserved.
          </p>
          <p className="text-[11px] text-antique-gold/80 italic">
            Business Helpline: {eventData.business.phone} · {eventData.business.email}
          </p>
        </div>
      </div>
    </footer>
  );
}
