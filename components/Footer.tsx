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
                <span className="block font-body text-[10px] text-antique-gold tracking-[0.22em] font-bold uppercase -mt-0.5">
                  {eventData.year} · {eventData.organizer.name}
                </span>
              </div>
            </Link>

            <p className="font-body text-sm text-warm-cream/80 max-w-sm leading-relaxed mb-4">
              {eventData.tagline}. An authentic grand festival of devotion, live rhythm, circular Garba, and celebration under starlit skies at the historic BNR Chanakya, Ranchi.
            </p>

            {/* Official Organizer Provenance with Event Point Logo from RAASCDR */}
            <div className="flex items-center gap-3 px-3.5 py-2 rounded-lg bg-royal-maroon/70 border border-antique-gold/40 shadow-sm">
              <div className="relative w-8 h-8 shrink-0">
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
          </div>

          {/* Quick Page Links */}
          <div className="md:col-span-3 flex flex-col">
            <h3 className="font-display text-xl text-bright-gold tracking-wider uppercase mb-4 flex items-center gap-2">
              <span>EXPLORE</span>
              <span className="text-vermilion text-xs">♦</span>
            </h3>
            <ul className="space-y-2.5 font-body text-sm text-warm-cream/80">
              <li>
                <Link href="/" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-vermilion text-[10px]">♦</span>
                  <span>Home (The Festival)</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-vermilion text-[10px]">♦</span>
                  <span>About (Heritage & Setting)</span>
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-vermilion text-[10px]">♦</span>
                  <span>Services (Experience & Passes)</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-bright-gold transition-colors inline-flex items-center gap-1.5">
                  <span className="text-vermilion text-[10px]">♦</span>
                  <span>Contact (Enquiries & Venue)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Event Logistics & Quick Booking */}
          <div className="md:col-span-4 flex flex-col">
            <h3 className="font-display text-xl text-bright-gold tracking-wider uppercase mb-4 flex items-center gap-2">
              <span>FESTIVAL DETAILS</span>
              <span className="text-vermilion text-xs">♦</span>
            </h3>
            <div className="space-y-3 font-body text-xs text-warm-cream/90">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-vermilion shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-warm-cream block">{eventData.dateDisplay}</span>
                  <span className="text-[11px] text-warm-cream/70">Navratri Dandiya Night</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-glow shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-warm-cream block">{eventData.timeDisplay}</span>
                  <span className="text-[11px] text-warm-cream/70">Evening Celebration</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-warm-cream block">{eventData.venueDisplay}</span>
                  <span className="text-[11px] text-warm-cream/70">Ranchi, Jharkhand</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <Phone className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <div className="flex flex-col text-[11px]">
                  <span>{eventData.contacts.phones.join(' / ')}</span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-sm tracking-wider uppercase border border-antique-gold/70 shadow-md hover:scale-105 transition-transform font-bold"
              >
                <Ticket className="w-4 h-4 text-bright-gold" />
                <span>{eventData.ctas.primary}</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Note & Copyright */}
        <div className="pt-8 border-t border-antique-gold/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs font-body text-warm-cream/60">
          <p>
            © {eventData.year} {eventData.eventName}. Organized by {eventData.organizer.name}. All rights reserved.
          </p>
          <p className="text-[11px] text-antique-gold/80 italic">
            *Pass booking requests are processed directly via official Event Point contact desks.
          </p>
        </div>
      </div>
    </footer>
  );
}
