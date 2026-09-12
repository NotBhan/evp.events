'use client';

import React from 'react';
import Image from 'next/image';
import { eventData } from '@/data/eventData';
import {
  Printer,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Clock,
  MapPin,
  Calendar,
  ShieldAlert,
  FileText,
} from 'lucide-react';

export interface BookingReceiptProps {
  bookingId: string;
  passType: string;
  quantity: number;
  unitPrice: number;
  total: number;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  timestamp?: string;
  onNewEnquiry?: () => void;
}

export default function BookingReceipt({
  bookingId,
  passType,
  quantity,
  unitPrice,
  total,
  fullName,
  phone,
  email,
  city,
  timestamp,
  onNewEnquiry,
}: BookingReceiptProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleScrollToReceipt = () => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('booking-receipt-document');
      if (el) {
        const lenis = typeof window !== 'undefined' ? (window as any).lenis : null;
        if (lenis) {
          lenis.scrollTo(el, { offset: -80 });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const primaryPhone = eventData.contacts.phones[0].replace(/\D/g, '');
  const whatsappMessage = `*RAAS UTSAV 2026 — BOOKING REQUEST RECEIPT*\nRequest ID: ${bookingId}\nStatus: Request Submitted\nOrganizer: Event Point\nVenue: Upwan Lawn, Chanakya BNR Hotel, Ranchi\nDate: 16 October 2026 (5:00 PM – 11:00 PM)\n\n*REQUEST DETAILS:*\n• Pass: ${passType}\n• Quantity: ${quantity}\n• Unit Price: ₹${unitPrice.toLocaleString('en-IN')}\n• Total: ₹${total.toLocaleString('en-IN')}\n\n*ATTENDEE:*\n• Name: ${fullName}\n• Phone: ${phone}\n• Email: ${email || 'N/A'}\n• City: ${city || 'Ranchi'}\n\nPlease review my booking request and provide pass allocation instructions.`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${primaryPhone}&text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const formattedDate = timestamp
    ? new Date(timestamp).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  return (
    <div className="w-full space-y-6">
      {/* ====================================================================
          TOP CONTEXT BANNER (ON SCREEN ONLY)
          ==================================================================== */}
      <div className="no-print p-5 rounded-2xl bg-royal-maroon/90 border-2 border-bright-gold text-center flex flex-col items-center shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-deep-plum/90 border border-antique-gold/50 text-bright-gold text-xs font-mono tracking-widest uppercase mb-2">
          <span>REQUEST ID:</span>
          <span className="font-bold text-warm-cream">{bookingId}</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl text-warm-cream tracking-wide uppercase">
          BOOKING REQUEST SUBMITTED
        </h2>
        <p className="font-body text-xs sm:text-sm text-warm-cream/80 max-w-lg mt-1 leading-relaxed">
          Your request has been securely recorded with the {eventData.organizer.name} coordination desk. Review your official booking request receipt below.
        </p>

        {/* Quick Receipt Action Bar in Banner */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
          <button
            type="button"
            onClick={handleScrollToReceipt}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-deep-plum border border-antique-gold/40 text-warm-cream text-xs font-body uppercase font-bold tracking-wider hover:border-bright-gold cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-bright-gold" />
            <span>VIEW RECEIPT</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-bright-gold text-deep-plum text-xs font-body uppercase font-bold tracking-wider hover:bg-amber-glow cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-deep-plum" />
            <span>PRINT / SAVE PDF</span>
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#25D366] text-deep-plum text-xs font-body uppercase font-bold tracking-wider hover:bg-[#20ba59]"
          >
            <MessageCircle className="w-3.5 h-3.5 text-deep-plum" />
            <span>EXPEDITE VIA WHATSAPP</span>
          </a>
          <a
            href={`tel:${eventData.contacts.phones[0].replace(/\s+/g, '')}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-royal-maroon border border-antique-gold/40 text-warm-cream text-xs font-body uppercase font-bold tracking-wider hover:border-bright-gold"
          >
            <PhoneCall className="w-3.5 h-3.5 text-bright-gold" />
            <span>CALL BOX OFFICE</span>
          </a>
        </div>
      </div>

      {/* ====================================================================
          OFFICIAL BOOKING REQUEST RECEIPT (PRINTABLE STUB)
          ==================================================================== */}
      <article
        id="booking-receipt-document"
        className="booking-receipt-printable relative rounded-3xl bg-card-surface border-2 border-antique-gold/50 shadow-2xl p-6 sm:p-10 overflow-hidden text-warm-cream"
      >
        {/* Perforated Ticket Notches (Decorative on screen, suppressed in print) */}
        <div
          className="no-print absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-deep-plum border border-antique-gold/40"
          aria-hidden="true"
        />
        <div
          className="no-print absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-deep-plum border border-antique-gold/40"
          aria-hidden="true"
        />

        {/* Decorative Corner Diamonds */}
        <span className="no-print absolute top-3.5 left-3.5 text-bright-gold text-[10px] pointer-events-none select-none">♦</span>
        <span className="no-print absolute top-3.5 right-3.5 text-bright-gold text-[10px] pointer-events-none select-none">♦</span>
        <span className="no-print absolute bottom-3.5 left-3.5 text-bright-gold text-[10px] pointer-events-none select-none">♦</span>
        <span className="no-print absolute bottom-3.5 right-3.5 text-bright-gold text-[10px] pointer-events-none select-none">♦</span>

        {/* ------------------------------------------------------------------
            RECEIPT HEADER
            ------------------------------------------------------------------ */}
        <header className="border-b-2 border-dashed border-antique-gold/30 pb-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl bg-deep-plum border border-antique-gold/50 p-1 shrink-0 shadow-md">
                <Image
                  src="/images/client/raascdr/web/eventpoint-logo.webp"
                  alt="Event Point Official Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-body text-[10px] text-bright-gold uppercase tracking-[0.25em] font-bold block">
                  OFFICIAL COORDINATION RECEIPT
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-warm-cream tracking-wider uppercase leading-none">
                  RAAS UTSAV 2026
                </h3>
                <span className="font-body text-[11px] text-warm-cream/70 uppercase tracking-widest block mt-0.5">
                  BOOKING REQUEST RECEIPT
                </span>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-deep-plum/90 border border-bright-gold/60 text-bright-gold text-[11px] font-bold tracking-wider uppercase mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>REQUEST SUBMITTED</span>
              </div>
              <div className="font-mono text-sm sm:text-base text-bright-gold font-bold tracking-wider">
                {bookingId}
              </div>
              <div className="text-[11px] text-warm-cream/60 font-body">
                {formattedDate}
              </div>
            </div>
          </div>

          {/* Prominent Formal Distinction Callout */}
          <div className="mt-5 p-3.5 rounded-xl bg-royal-maroon/70 border border-vermilion/60 flex items-start gap-3 text-left">
            <ShieldAlert className="w-5 h-5 text-bright-gold shrink-0 mt-0.5" />
            <div>
              <span className="font-display text-xs sm:text-sm text-bright-gold uppercase tracking-wider font-bold block">
                BOOKING REQUEST — NOT A CONFIRMED TICKET
              </span>
              <p className="font-body text-[11px] sm:text-xs text-warm-cream/90 leading-relaxed mt-0.5">
                Your request has been recorded and sent to the Event Point team. Final pass allocation, payment and collection details are handled directly by the event team.
              </p>
            </div>
          </div>
        </header>

        {/* ------------------------------------------------------------------
            RECEIPT BODY: 2-COLUMN GRID (ATTENDEE & PASS SPECIFICATION)
            ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pb-6 mb-6 border-b-2 border-dashed border-antique-gold/30">
          {/* Attendee Details */}
          <div className="space-y-3 font-body text-xs">
            <span className="text-bright-gold font-bold uppercase tracking-wider text-[11px] block border-b border-antique-gold/20 pb-1">
              ATTENDEE DETAILS
            </span>

            <div>
              <span className="text-warm-cream/60 text-[10px] uppercase tracking-wider block">
                FULL NAME
              </span>
              <span className="text-warm-cream font-bold text-sm sm:text-base">
                {fullName}
              </span>
            </div>

            <div>
              <span className="text-warm-cream/60 text-[10px] uppercase tracking-wider block">
                WHATSAPP / MOBILE
              </span>
              <span className="text-warm-cream font-semibold text-sm">
                {phone}
              </span>
            </div>

            <div>
              <span className="text-warm-cream/60 text-[10px] uppercase tracking-wider block">
                EMAIL ADDRESS
              </span>
              <span className="text-warm-cream text-xs break-all">
                {email || 'Not Provided'}
              </span>
            </div>

            <div>
              <span className="text-warm-cream/60 text-[10px] uppercase tracking-wider block">
                CITY / LOCATION
              </span>
              <span className="text-warm-cream text-xs">
                {city || 'Ranchi'}
              </span>
            </div>
          </div>

          {/* Pass Request Specification */}
          <div className="space-y-3 font-body text-xs flex flex-col justify-between">
            <div>
              <span className="text-bright-gold font-bold uppercase tracking-wider text-[11px] block border-b border-antique-gold/20 pb-1 mb-3">
                PASS SPECIFICATION
              </span>

              <div>
                <span className="text-warm-cream/60 text-[10px] uppercase tracking-wider block">
                  PASS CATEGORY
                </span>
                <span className="font-display text-xl sm:text-2xl text-warm-cream uppercase tracking-wide">
                  {passType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <span className="text-warm-cream/60 text-[10px] uppercase tracking-wider block">
                    QUANTITY
                  </span>
                  <span className="font-display text-2xl text-bright-gold font-bold">
                    {quantity}
                  </span>
                </div>
                <div>
                  <span className="text-warm-cream/60 text-[10px] uppercase tracking-wider block">
                    UNIT PRICE
                  </span>
                  <span className="font-display text-xl text-warm-cream font-semibold">
                    ₹{unitPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className="p-3.5 rounded-xl bg-deep-plum/80 border border-antique-gold/30 mt-4 flex items-center justify-between">
              <span className="font-body text-xs font-bold uppercase tracking-wider text-warm-cream/80">
                REQUEST TOTAL:
              </span>
              <span className="font-display text-2xl sm:text-3xl text-bright-gold font-bold">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            EVENT & ORGANIZER METADATA
            ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-body">
          {/* Event Logistics */}
          <div className="space-y-2">
            <span className="text-bright-gold font-bold uppercase tracking-wider text-[11px] block">
              EVENT LOGISTICS
            </span>
            <div className="flex items-center gap-2 text-warm-cream/90">
              <Calendar className="w-3.5 h-3.5 text-vermilion shrink-0" />
              <span>{eventData.dateDisplay}</span>
            </div>
            <div className="flex items-center gap-2 text-warm-cream/90">
              <Clock className="w-3.5 h-3.5 text-amber-glow shrink-0" />
              <span>{eventData.timeDisplay}</span>
            </div>
            <div className="flex items-start gap-2 text-warm-cream/90">
              <MapPin className="w-3.5 h-3.5 text-bright-gold shrink-0 mt-0.5" />
              <span>{eventData.venueDisplay}</span>
            </div>
          </div>

          {/* Organizer Coordinates */}
          <div className="space-y-2">
            <span className="text-bright-gold font-bold uppercase tracking-wider text-[11px] block">
              COORDINATION CONTACTS
            </span>
            <div className="text-warm-cream/90 space-y-1">
              <div>
                <strong>Phone:</strong> {eventData.contacts.phones.join(' · ')}
              </div>
              <div className="break-all">
                <strong>Email:</strong> {eventData.contacts.emails.join(' · ')}
              </div>
              <div className="text-[10px] text-warm-cream/60">
                Organizer: {eventData.organizer.name} ({eventData.organizer.tagline})
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            MANDATORY FORMAL NOTICE
            ------------------------------------------------------------------ */}
        <footer className="mt-6 pt-4 border-t border-antique-gold/20 text-center">
          <p className="font-body text-[10px] sm:text-[11px] text-warm-cream/70 leading-relaxed italic max-w-xl mx-auto">
            This receipt confirms submission of a booking request only. It is not a confirmed ticket and is not proof of payment. Final pass allocation and payment/collection details are handled by the Event Point team.
          </p>
        </footer>
      </article>

      {/* ====================================================================
          RECEIPT ACTIONS BAR (ON SCREEN ONLY)
          ==================================================================== */}
      <div className="no-print space-y-3 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-glow to-bright-gold hover:from-bright-gold hover:to-amber-glow text-deep-plum font-display text-lg tracking-wider uppercase shadow-lg flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98] font-bold cursor-pointer"
          >
            <Printer className="w-5 h-5 text-deep-plum" />
            <span>PRINT / SAVE PDF</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#1EBE5D] hover:from-[#1EBE5D] hover:to-[#169C4B] text-white font-display text-lg tracking-wider uppercase shadow-lg flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98] font-bold"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>EXPEDITE VIA WHATSAPP</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={`tel:${eventData.contacts.phones[0].replace(/\s+/g, '')}`}
            className="py-3 px-4 rounded-xl bg-royal-maroon/90 hover:bg-royal-maroon border border-antique-gold/40 text-warm-cream hover:text-bright-gold font-body text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-bright-gold" />
            <span>CALL BOX OFFICE</span>
          </a>

          {onNewEnquiry && (
            <button
              type="button"
              onClick={onNewEnquiry}
              className="py-3 px-4 rounded-xl bg-deep-plum/90 hover:bg-deep-plum border border-antique-gold/30 text-warm-cream hover:text-bright-gold font-body text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-bright-gold" />
              <span>SUBMIT ANOTHER REQUEST</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
