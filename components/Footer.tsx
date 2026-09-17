import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { eventData } from '@/data/eventData';
import FolkBorder from './decorations/FolkBorder';
import {
  Ticket,
  MapPin,
  Calendar,
  Clock,
  ArrowUpRight,
  Phone,
  Mail,
  ShieldCheck,
  Search,
  Sparkles,
  Building2,
  ExternalLink,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-30 w-full bg-deep-plum text-warm-cream border-t-2 border-antique-gold/30 overflow-hidden">
      {/* Ambient Radial Golden & Maroon Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(197,160,89,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-royal-maroon/40 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-royal-maroon/30 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32" />

      {/* Grand Pre-Footer Interactive CTA Banner */}
      <div className="relative border-b border-antique-gold/20 bg-gradient-to-r from-royal-maroon/80 via-deep-plum to-royal-maroon/80 px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-royal-maroon border border-bright-gold/50 flex items-center justify-center shrink-0 shadow-lg shadow-bright-gold/10">
              <Sparkles className="w-6 h-6 text-bright-gold animate-pulse" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-[11px] font-body uppercase tracking-[0.2em] font-bold text-bright-gold">
                  {eventData.edition}
                </span>
                <span className="text-vermilion text-xs">♦</span>
                <span className="text-[11px] font-body text-warm-cream/80 font-medium">
                  {eventData.dateDisplay}
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-warm-cream tracking-wide">
                Join the Celebration of Devotion &amp; Dance
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-bright-gold text-deep-plum font-display text-sm font-bold tracking-wider uppercase border border-bright-gold shadow-lg shadow-vermilion/20 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <Ticket className="w-4 h-4 text-deep-plum" />
              <span>{eventData.ctas.primary}</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              href="/booking?tab=lookup"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-royal-maroon/60 hover:bg-royal-maroon text-warm-cream/90 hover:text-bright-gold border border-antique-gold/40 text-xs font-body font-medium tracking-wide transition-all"
            >
              <Search className="w-3.5 h-3.5 text-bright-gold" />
              <span>Find My Booking</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 relative z-10">
        {/* Top Decorative Folk Border */}
        <div className="w-full max-w-md mx-auto mb-12 opacity-80">
          <FolkBorder />
        </div>

        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-14">
          {/* Column 1: Brand & Verified Organizer (5 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col items-start text-left">
            <Link
              href="/"
              className="flex items-center gap-3.5 group mb-4 select-none"
              aria-label="Raas Utsav 2026 — Home"
            >
              <div className="relative w-12 h-12 shrink-0 rounded-lg p-1 bg-royal-maroon/60 border border-antique-gold/40">
                <Image
                  src="/images/client/raascdr/web/eventpoint-logo-nav.webp"
                  alt="Event Point Logo"
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-2xl text-warm-cream tracking-wide group-hover:text-bright-gold transition-colors font-semibold">
                    {eventData.eventName}
                  </span>
                  <span className="text-vermilion text-xs" aria-hidden="true">♦</span>
                  <span className="font-display text-sm text-bright-gold font-bold">
                    {eventData.year}
                  </span>
                </div>
                <span className="font-body text-[10px] text-antique-gold tracking-[0.14em] font-bold uppercase">
                  Presented by {eventData.organizer.name}
                </span>
              </div>
            </Link>

            <p className="font-body text-xs sm:text-sm text-warm-cream/75 leading-relaxed mb-5 max-w-sm">
              {eventData.tagline}. Jharkhand’s grandest traditional Garba &amp; Dandiya festival under starlit skies at the historic Upwan Lawn, Chanakya BNR Hotel, Ranchi.
            </p>

            {/* Verified Organizer Provenance Card */}
            <div className="w-full p-4 rounded-xl bg-royal-maroon/40 border border-antique-gold/30 backdrop-blur-sm shadow-md space-y-2.5">
              <div className="flex items-center gap-3 pb-2 border-b border-antique-gold/20">
                <div className="relative w-10 h-7 shrink-0">
                  <Image
                    src="/images/client/raascdr/web/eventpoint-logo.webp"
                    alt="Event Point Official Organizer Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-body text-bright-gold font-bold tracking-wider uppercase flex items-center gap-1.5">
                    <span>{eventData.organizer.name}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </span>
                  <span className="text-[9px] font-body text-warm-cream/70">
                    Official Presentation &amp; Event Solutions
                  </span>
                </div>
              </div>

              <div className="text-[10px] font-body text-warm-cream/75 space-y-1 leading-snug">
                <div>
                  <span className="text-bright-gold font-semibold uppercase">Business:</span>{' '}
                  {eventData.business.name}
                </div>
                <div>
                  <span className="text-bright-gold font-semibold uppercase">Proprietor:</span>{' '}
                  {eventData.business.legalName}
                </div>
                <div>
                  <span className="text-bright-gold font-semibold uppercase">GSTIN:</span>{' '}
                  <span className="font-mono text-warm-cream font-medium">{eventData.business.gstin}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Navigation Links (2 cols on lg) */}
          <div className="lg:col-span-2 sm:col-span-1 flex flex-col">
            <h3 className="font-display text-base text-bright-gold tracking-widest uppercase mb-4 pb-1.5 border-b border-antique-gold/20 flex items-center justify-between">
              <span>EXPLORE</span>
              <span className="text-vermilion text-xs">♦</span>
            </h3>
            <ul className="space-y-2.5 font-body text-xs sm:text-sm text-warm-cream/80">
              <li>
                <Link
                  href="/"
                  className="hover:text-bright-gold hover:translate-x-1 transition-all inline-flex items-center gap-2"
                >
                  <span className="text-vermilion text-[8px]">♦</span>
                  <span>Home Overview</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-bright-gold hover:translate-x-1 transition-all inline-flex items-center gap-2"
                >
                  <span className="text-vermilion text-[8px]">♦</span>
                  <span>About Festival</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-bright-gold hover:translate-x-1 transition-all inline-flex items-center gap-2"
                >
                  <span className="text-vermilion text-[8px]">♦</span>
                  <span>Offerings &amp; Stalls</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-bright-gold hover:translate-x-1 transition-all inline-flex items-center gap-2"
                >
                  <span className="text-vermilion text-[8px]">♦</span>
                  <span>Pass Tiers &amp; Pricing</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-bright-gold hover:translate-x-1 transition-all inline-flex items-center gap-2"
                >
                  <span className="text-vermilion text-[8px]">♦</span>
                  <span>Helpdesk &amp; Venue</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/booking"
                  className="text-bright-gold font-semibold hover:text-amber-glow hover:translate-x-1 transition-all inline-flex items-center gap-2 pt-1"
                >
                  <span className="text-vermilion text-[8px]">♦</span>
                  <span>Book Passes Online</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/find-pass"
                  className="text-bright-gold font-semibold hover:text-amber-glow hover:translate-x-1 transition-all inline-flex items-center gap-2 pt-1"
                >
                  <span className="text-vermilion text-[8px]">♦</span>
                  <span>Find Your Pass</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Mandatory Policies & Compliance (3 cols on lg) */}
          <div className="lg:col-span-3 sm:col-span-1 flex flex-col">
            <h3 className="font-display text-base text-bright-gold tracking-widest uppercase mb-4 pb-1.5 border-b border-antique-gold/20 flex items-center justify-between">
              <span>LEGAL &amp; POLICIES</span>
              <span className="text-vermilion text-xs">♦</span>
            </h3>
            <ul className="space-y-2.5 font-body text-xs sm:text-sm text-warm-cream/80">
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-bright-gold hover:translate-x-1 transition-all inline-flex items-center gap-2"
                >
                  <span className="text-bright-gold/70 text-[8px]">♦</span>
                  <span>Pricing &amp; Pass Details</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-and-conditions"
                  className="hover:text-bright-gold hover:translate-x-1 transition-all inline-flex items-center gap-2"
                >
                  <span className="text-bright-gold/70 text-[8px]">♦</span>
                  <span>Terms &amp; Conditions</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-bright-gold hover:translate-x-1 transition-all inline-flex items-center gap-2"
                >
                  <span className="text-bright-gold/70 text-[8px]">♦</span>
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-and-cancellation"
                  className="hover:text-bright-gold hover:translate-x-1 transition-all inline-flex items-center gap-2"
                >
                  <span className="text-bright-gold/70 text-[8px]">♦</span>
                  <span>Cancellation &amp; Refund Policy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-policy"
                  className="hover:text-bright-gold hover:translate-x-1 transition-all inline-flex items-center gap-2"
                >
                  <span className="text-bright-gold/70 text-[8px]">♦</span>
                  <span>Pass Delivery &amp; Fulfillment</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-bright-gold hover:translate-x-1 transition-all inline-flex items-center gap-2"
                >
                  <span className="text-bright-gold/70 text-[8px]">♦</span>
                  <span>FAQ — Payment, Refunds &amp; Entry</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/policies"
                  className="hover:text-bright-gold hover:translate-x-1 transition-all inline-flex items-center gap-2"
                >
                  <span className="text-bright-gold/70 text-[8px]">♦</span>
                  <span>All Policies &amp; Legal</span>
                </Link>
              </li>
            </ul>

            <div className="mt-4 p-2.5 rounded-lg bg-royal-maroon/30 border border-antique-gold/20 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[10px] font-body text-warm-cream/70 leading-tight">
                Secure 256-bit encrypted checkout with instant digital e-receipt issuance.
              </span>
            </div>
          </div>

          {/* Column 4: Festival Logistics & Direct Contact (3 cols on lg) */}
          <div className="lg:col-span-3 flex flex-col">
            <h3 className="font-display text-base text-bright-gold tracking-widest uppercase mb-4 pb-1.5 border-b border-antique-gold/20 flex items-center justify-between">
              <span>VENUE &amp; HELPDESK</span>
              <span className="text-vermilion text-xs">♦</span>
            </h3>

            <div className="space-y-3 font-body text-xs text-warm-cream/85">
              {/* Date & Time */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-royal-maroon/30 border border-antique-gold/20">
                <Calendar className="w-4 h-4 text-vermilion shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-warm-cream">{eventData.dateDisplay}</span>
                  <span className="text-[10px] text-warm-cream/70 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-bright-gold" />
                    <span>{eventData.timeDisplay}</span>
                  </span>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-royal-maroon/30 border border-antique-gold/20">
                <MapPin className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-warm-cream leading-tight">
                    {eventData.venue.name}
                  </span>
                  <span className="text-[10px] text-warm-cream/70 mt-0.5">
                    Station Road, Ranchi, Jharkhand
                  </span>
                </div>
              </div>

              {/* Contact Direct Links & Official Social */}
              <div className="pt-1 space-y-1.5 text-[11px]">
                <a
                  href={`tel:${eventData.contacts.phones[0].replace(/\s+/g, '')}`}
                  className="flex items-center gap-2 hover:text-bright-gold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-bright-gold shrink-0" />
                  <span>{eventData.contacts.phones[0]}</span>
                </a>
                <a
                  href={`mailto:${eventData.contacts.emails[0]}`}
                  className="flex items-center gap-2 hover:text-bright-gold transition-colors break-all"
                >
                  <Mail className="w-3.5 h-3.5 text-bright-gold shrink-0" />
                  <span>{eventData.contacts.emails[0]}</span>
                </a>
                {eventData.socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-bright-gold/90 hover:text-bright-gold transition-colors font-semibold"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-bright-gold shrink-0 fill-none stroke-current"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                    <span>Official {social.label}</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Regulatory Provenance & Copyright */}
        <div className="pt-8 border-t border-antique-gold/20 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs font-body text-warm-cream/60">
          <div className="flex flex-col gap-1">
            <p>
              © {eventData.year} {eventData.eventName}. Presented by {eventData.organizer.name}. Business Entity: {eventData.business.name}. All rights reserved.
            </p>
            <p className="text-[10px] text-warm-cream/50">
              {eventData.business.address.display} · GSTIN: {eventData.business.gstin}
            </p>
            <p className="text-[10px] text-warm-cream/50">
              By using this website or booking a pass you agree to our{' '}
              <Link href="/terms-and-conditions" className="hover:text-bright-gold transition-colors underline">
                Terms
              </Link>
              ,{' '}
              <Link href="/privacy-policy" className="hover:text-bright-gold transition-colors underline">
                Privacy Policy
              </Link>{' '}
              and all{' '}
              <Link href="/policies" className="hover:text-bright-gold transition-colors underline">
                Policies
              </Link>
              .
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-antique-gold/90 shrink-0">
            <Link href="/terms-and-conditions" className="hover:text-bright-gold transition-colors">
              Terms
            </Link>
            <span>·</span>
            <Link href="/privacy-policy" className="hover:text-bright-gold transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/refund-and-cancellation" className="hover:text-bright-gold transition-colors">
              Refunds
            </Link>
            <span>·</span>
            <Link href="/faq" className="hover:text-bright-gold transition-colors">
              FAQ
            </Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-bright-gold transition-colors">
              Helpline
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

