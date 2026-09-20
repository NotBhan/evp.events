'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { eventData } from '@/data/eventData';
import { getLenisInstance } from '@/lib/lenis-instance';
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
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Loader2,
  XCircle,
} from 'lucide-react';
import {
  calculateGstAndRefund,
  RefundCalculation,
  CANCELLATION_DEADLINE_DISPLAY,
} from '@/lib/cancellation-constants';

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
  status?: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
  paymentStatus?: 'NOT_STARTED' | 'PENDING' | 'FAILED' | 'PAID';
  expiresAt?: string;
  cancelledAt?: string | null;
  refundBreakdown?: RefundCalculation;
  entryToken?: string;
  onNewEnquiry?: () => void;
  onProceedToPayment?: () => void;
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
  status = 'PENDING',
  paymentStatus = 'NOT_STARTED',
  expiresAt,
  cancelledAt,
  refundBreakdown,
  entryToken,
  onNewEnquiry,
  onProceedToPayment,
}: BookingReceiptProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleOnlineCheckout = async () => {
    if (onProceedToPayment) {
      onProceedToPayment();
      return;
    }
    setIsRedirecting(true);
    setPaymentError(null);

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment session.');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received from payment server.');
      }
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'Payment initialization failed.');
      setIsRedirecting(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleScrollToReceipt = () => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('booking-receipt-document');
      if (el) {
        const lenis = getLenisInstance();
        if (lenis) {
          lenis.scrollTo(el, { offset: -80 });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const refundCalc = (status === 'CANCELLED' || refundBreakdown) ? calculateGstAndRefund(total) : null;

  const primaryPhone = eventData.contacts.phones[0].replace(/\D/g, '');
  const whatsappMessage = status === 'CANCELLED'
    ? `*RAAS UTSAV 2026 — CANCELLED BOOKING / REFUND ASSISTANCE*\nRequest ID: ${bookingId}\nStatus: CANCELLED\nPass: ${passType} (Qty: ${quantity})\nOriginal Paid: ₹${total.toLocaleString('en-IN')}\nExpected Refund: ₹${refundCalc ? refundCalc.refundFormatted : 'N/A'}\n\nMy booking has been cancelled on the website. Please assist with my refund processing.`
    : `*RAAS UTSAV 2026 — BOOKING REQUEST RECEIPT*\nRequest ID: ${bookingId}\nStatus: ${status === 'CONFIRMED' ? 'Confirmed & Paid' : 'Request Submitted'}\nOrganizer: Event Point\nVenue: Upwan Lawn, Chanakya BNR Hotel, Ranchi\nDate: 16 October 2026 (5:00 PM – 11:00 PM)\n\n*REQUEST DETAILS:*\n• Pass: ${passType}\n• Quantity: ${quantity}\n• Unit Price: ₹${unitPrice.toLocaleString('en-IN')}\n• Total: ₹${total.toLocaleString('en-IN')}\n\n*ATTENDEE:*\n• Name: ${fullName}\n• Phone: ${phone}\n• Email: ${email || 'N/A'}\n• City: ${city || 'Ranchi'}\n\nPlease review my booking request and provide pass allocation instructions.`;
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
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-6 items-start">
      {/* ======================================================================
          THE PASS DOCUMENT — section order mirrors the printed pass one-to-one.
          Capped width so the action sidebar fits beside it on large screens.
          ====================================================================== */}
      <article
        id="booking-receipt-document"
        className="booking-receipt-printable relative w-full xl:col-span-8 xl:col-start-1 xl:max-w-[860px] rounded-3xl bg-card-surface border-2 border-antique-gold/50 shadow-2xl p-5 sm:p-6 md:p-8 overflow-hidden text-warm-cream"
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
        <header className="border-b-2 border-dashed border-antique-gold/30 pb-4 mb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-12 rounded-xl bg-deep-plum border border-antique-gold/50 p-1 shrink-0 shadow-md">
                <Image
                  src="/images/client/raascdr/web/eventpoint-logo.webp"
                  alt="Event Point Official Logo"
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-body text-[10px] text-bright-gold uppercase tracking-[0.14em] font-bold block">
                  {status === 'CONFIRMED' ? 'OFFICIAL PASS ADMISSION STUB' : 'OFFICIAL COORDINATION RECEIPT'}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-warm-cream tracking-wider uppercase leading-none">
                  RAAS UTSAV 2026
                </h3>
                <span className="font-body text-[11px] text-warm-cream/70 uppercase tracking-widest block mt-0.5">
                  {status === 'CONFIRMED'
                    ? 'CONFIRMED PASS RECEIPT'
                    : status === 'EXPIRED'
                    ? 'EXPIRED RESERVATION STUB'
                    : 'BOOKING REQUEST RECEIPT'}
                </span>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold tracking-wider uppercase mb-1 ${
                status === 'CONFIRMED'
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                  : status === 'CANCELLED'
                  ? 'bg-vermilion/25 border-vermilion text-vermilion'
                  : status === 'EXPIRED'
                  ? 'bg-vermilion/30 border-vermilion text-vermilion'
                  : 'bg-deep-plum/90 border-bright-gold/60 text-bright-gold'
              }`}>
                {status === 'CONFIRMED' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CONFIRMED &amp; PAID</span>
                  </>
                ) : status === 'CANCELLED' ? (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-vermilion" />
                    <span>BOOKING CANCELLED</span>
                  </>
                ) : status === 'EXPIRED' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-vermilion" />
                    <span>BOOKING EXPIRED</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>REQUEST SUBMITTED · PAYMENT PENDING</span>
                  </>
                )}
              </div>
              <div className="font-mono text-sm sm:text-base text-bright-gold font-bold tracking-wider">
                {bookingId}
              </div>
              <div className="text-[11px] text-warm-cream/60 font-body">
                {formattedDate}
              </div>
            </div>
          </div>

          {/* Status-Specific Distinction Callout */}
          {status === 'CANCELLED' ? (
            <div className="mt-5 p-3.5 rounded-xl bg-vermilion/20 border border-vermilion/60 flex items-start gap-3 text-left">
              <XCircle className="w-5 h-5 text-vermilion shrink-0 mt-0.5" />
              <div>
                <span className="font-display text-xs sm:text-sm text-vermilion uppercase tracking-wider font-bold block">
                  BOOKING CANCELLED — REFUND HANDLED SEPARATELY
                </span>
                <p className="font-body text-[11px] sm:text-xs text-warm-cream/90 leading-relaxed mt-0.5">
                  This booking has been cancelled and festival pass allocation has been released back to event inventory. <strong>Refund requests and processing are handled separately.</strong> In accordance with client and statutory tax policy, the 18% GST component included in the gross pass price is deducted.
                </p>
              </div>
            </div>
          ) : status === 'EXPIRED' ? (
            <div className="mt-5 p-3.5 rounded-xl bg-vermilion/20 border border-vermilion/60 flex items-start gap-3 text-left">
              <AlertTriangle className="w-5 h-5 text-vermilion shrink-0 mt-0.5" />
              <div>
                <span className="font-display text-xs sm:text-sm text-vermilion uppercase tracking-wider font-bold block">
                  BOOKING EXPIRED — RESERVATION WINDOW ELAPSED
                </span>
                <p className="font-body text-[11px] sm:text-xs text-warm-cream/90 leading-relaxed mt-0.5">
                  This 24-hour pass reservation window has passed without payment completion. The reserved passes have been automatically released back to the general inventory. Please create a new booking request if passes remain available.
                </p>
              </div>
            </div>
          ) : status === 'CONFIRMED' ? (
            <div className="mt-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/60 flex items-start gap-3 text-left">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-display text-xs sm:text-sm text-emerald-300 uppercase tracking-wider font-bold block">
                  CONFIRMED PASS RECEIPT — PROOF OF ADMISSION
                </span>
                <p className="font-body text-[11px] sm:text-xs text-warm-cream/90 leading-relaxed mt-0.5">
                  Your festival pass reservation is officially confirmed and paid. Keep this verified digital booking receipt for event entry on 16 October 2026.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 p-3.5 rounded-xl bg-royal-maroon/70 border border-vermilion/60 flex items-start gap-3 text-left">
              <ShieldAlert className="w-5 h-5 text-bright-gold shrink-0 mt-0.5" />
              <div>
                <span className="font-display text-xs sm:text-sm text-bright-gold uppercase tracking-wider font-bold block">
                  BOOKING REQUEST — PAYMENT PENDING
                </span>
                <p className="font-body text-[11px] sm:text-xs text-warm-cream/90 leading-relaxed mt-0.5">
                  Your reservation is held for 24 hours. Pass allocation is finalized upon payment completion with our coordination team.
                </p>
              </div>
            </div>
          )}

        </header>

        {/* ------------------------------------------------------------------
            RECEIPT BODY: 2-COLUMN GRID (ATTENDEE & PASS SPECIFICATION)
            ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-4 mb-4 border-b-2 border-dashed border-antique-gold/30">
          {/* Attendee Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 font-body text-xs">
            <span className="sm:col-span-2 text-bright-gold font-bold uppercase tracking-wider text-[11px] block border-b border-antique-gold/20 pb-1">
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
            <div className="p-3.5 rounded-xl bg-deep-plum/80 border border-antique-gold/30 mt-3 flex items-center justify-between">
              <span className="font-body text-xs font-bold uppercase tracking-wider text-warm-cream/80">
                {status === 'CANCELLED' ? 'ORIGINAL AMOUNT PAID:' : 'REQUEST TOTAL:'}
              </span>
              <span className="font-display text-2xl sm:text-3xl text-bright-gold font-bold">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>

            {status === 'CANCELLED' && refundCalc && (
              <div className="p-3.5 rounded-xl bg-royal-maroon/70 border border-antique-gold/30 mt-2 text-xs font-body space-y-1.5">
                <div className="flex justify-between text-warm-cream/80">
                  <span>Gross Paid Amount (GST-inclusive):</span>
                  <span className="font-mono">₹{refundCalc.grossFormatted}</span>
                </div>
                <div className="flex justify-between text-warm-cream/80">
                  <span>GST Component Deducted (18%):</span>
                  <span className="font-mono text-vermilion">-₹{refundCalc.gstFormatted}</span>
                </div>
                <div className="flex justify-between font-bold text-bright-gold pt-1 border-t border-antique-gold/20 text-sm">
                  <span>Expected Refund Amount:</span>
                  <span className="font-mono text-base">₹{refundCalc.refundFormatted}</span>
                </div>
                <p className="text-[10px] text-warm-cream/70 italic pt-0.5">
                  * Refund status: Refund handled separately. For assistance with refund disbursement to your original payment method, contact our coordination desk.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------
            ENTRY QR — mirrors the printed pass: full-width gate admission band
            ------------------------------------------------------------------ */}
        {status === 'CONFIRMED' && paymentStatus === 'PAID' && entryToken && (
          <div
            id="receipt-entry-qr"
            className="mb-4 p-4 rounded-2xl bg-warm-cream border-2 border-antique-gold/50 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
          >
            <div className="p-2 bg-white rounded-xl border border-deep-plum/15 shrink-0">
              <QRCodeSVG
                value={entryToken}
                size={124}
                level="M"
                marginSize={2}
                bgColor="#FFFFFF"
                fgColor="#220D1A"
              />
            </div>
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-glow block">
                ✦ Official Gate Admission Pass ✦
              </span>
              <span className="font-display text-lg sm:text-xl text-deep-plum uppercase tracking-wide block mt-0.5">
                Present this QR code at the event entrance.
              </span>
              <span className="font-mono text-sm font-bold text-deep-plum block mt-1">{bookingId}</span>
              <span className="text-[10px] font-body text-deep-plum/70 block mt-1">
                Entry is verified online at the gate by event staff. One scan admits this pass once.
              </span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            EVENT & ORGANIZER METADATA
            ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-body">
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
            POST-PURCHASE INSTRUCTIONS (CONFIRMED RECEIPTS ONLY)
            ------------------------------------------------------------------ */}
        {status === 'CONFIRMED' && (
          <section className="mt-4 pt-4 border-t border-antique-gold/20 text-left">
            <span className="text-bright-gold font-bold uppercase tracking-wider text-[11px] block mb-2">
              ✦ IMPORTANT INFORMATION
            </span>
            <div className="space-y-2 font-body text-[11px] leading-relaxed text-warm-cream/85">
              <p>
                <strong className="text-warm-cream">Retrieve Your Receipt:</strong> Use &ldquo;Find / Recover
                Reservation&rdquo; on the website&apos;s Find Pass page with your Booking Reference ID (
                <span className="font-mono text-bright-gold">{bookingId}</span>) together with the email address
                and mobile number you booked with.
              </p>
              <p>
                <strong className="text-warm-cream">Cancellation:</strong> Cancel through the website&apos;s
                booking recovery flow — open your confirmed booking on the Find Pass page and select
                &ldquo;Cancel Booking&rdquo;. Cancellation requests close on{' '}
                <strong className="text-warm-cream">{CANCELLATION_DEADLINE_DISPLAY}</strong>, and a pass already
                used for entry cannot be cancelled or refunded.
              </p>
              <p>
                <strong className="text-warm-cream">Refund Request:</strong> Cancellation and refund are handled
                separately. After cancelling on the website, request your refund via our support channels.
                Approved refunds return to your original payment method, less the 18% GST included in the amount
                paid.
              </p>
              <p>
                <strong className="text-warm-cream">Entry Protocol:</strong> Entry is digital only — present the
                entry QR from this receipt, on your phone or as a printed copy. Gates open at{' '}
                {eventData.timeDisplay} on {eventData.dateDisplay}.
              </p>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------------
            MANDATORY FORMAL NOTICE
            ------------------------------------------------------------------ */}
        <footer className="mt-4 pt-3 border-t border-antique-gold/20 text-center space-y-2">
          {status === 'CANCELLED' ? (
            <p className="font-body text-[10px] sm:text-[11px] text-vermilion leading-relaxed max-w-xl mx-auto">
              Your booking has been cancelled. Pass validity is determined by the pass type, capacity, and validity of the booking/payment. The attendee name entered during booking does not by itself restrict who may use a valid pass. Refund requests and processing are handled separately.
            </p>
          ) : status === 'CONFIRMED' ? (
            <p className="font-body text-[10px] sm:text-[11px] text-emerald-300 font-medium leading-relaxed max-w-xl mx-auto">
              ✓ Verified Confirmed Pass Receipt. Pass validity is determined by the pass type, capacity, and validity of the booking/payment. The attendee name entered during booking does not by itself restrict who may use a valid pass. Retain this digital receipt for festival entry.
            </p>
          ) : status === 'EXPIRED' ? (
            <p className="font-body text-[10px] sm:text-[11px] text-vermilion leading-relaxed max-w-xl mx-auto">
              Reservation expired. The 24-hour payment hold has elapsed and the passes have returned to the general inventory.
            </p>
          ) : (
            <p className="font-body text-[10px] sm:text-[11px] text-warm-cream/70 leading-relaxed italic max-w-xl mx-auto">
              24-Hour Temporary Hold: This receipt records a pending pass reservation. Complete online payment or coordinate with the Event Point team to confirm your booking.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-body text-antique-gold/70 pt-1">
            <Link href="/terms-and-conditions" className="hover:underline hover:text-bright-gold">Terms &amp; Conditions</Link>
            <span>•</span>
            <Link href="/refund-and-cancellation" className="hover:underline hover:text-bright-gold">Cancellation Policy</Link>
            <span>•</span>
            <Link href="/shipping-policy" className="hover:underline hover:text-bright-gold">Fulfillment Policy</Link>
          </div>
        </footer>
      </article>

        {/* ====================================================================
            ACTION CONTROL DESK — first on small screens (print/contact buttons
            before the pass), right-hand sidebar on large screens
            ==================================================================== */}
        <div className="no-print order-first xl:order-none xl:col-span-4 xl:col-start-9 space-y-3">
          {/* Status Summary Placard */}
          <div className={`p-5 rounded-2xl border-2 text-center flex flex-col items-center shadow-xl ${
            status === 'CANCELLED'
              ? 'bg-deep-plum/95 border-vermilion/80'
              : status === 'EXPIRED'
              ? 'bg-deep-plum/95 border-vermilion'
              : status === 'CONFIRMED'
              ? 'bg-royal-maroon/95 border-emerald-400'
              : 'bg-royal-maroon/95 border-bright-gold'
          }`}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-deep-plum/90 border border-antique-gold/50 text-bright-gold text-xs font-mono tracking-widest uppercase mb-2">
              <span>BOOKING ID:</span>
              <span className="font-bold text-warm-cream">{bookingId}</span>
            </div>
            <h3 className="font-display text-2xl text-warm-cream tracking-wide uppercase">
              {status === 'CANCELLED'
                ? 'BOOKING CANCELLED'
                : status === 'EXPIRED'
                ? 'RESERVATION EXPIRED'
                : status === 'CONFIRMED'
                ? 'PASS CONFIRMED & PAID'
                : 'RESERVATION HELD'}
            </h3>
            <p className="font-body text-xs text-warm-cream/80 mt-1 leading-relaxed">
              {status === 'CANCELLED'
                ? 'Your reservation has been cancelled. For refund questions, contact support.'
                : status === 'EXPIRED'
                ? 'The 24-hour hold deadline has elapsed. Please start a new reservation.'
                : status === 'CONFIRMED'
                ? 'Your admission is officially locked in Neon. Download or print your pass stub.'
                : 'Your booking is held for 24 hours. Complete payment to secure your QR entry pass.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 items-stretch">
            {/* Primary Action 1: Pay Online (If Pending) */}
            {status === 'PENDING' && (
              <div className="space-y-2 sm:col-span-2 xl:col-span-1">
              <button
                id="receipt-pay-online-btn"
                type="button"
                onClick={handleOnlineCheckout}
                disabled={isRedirecting}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-vermilion hover:brightness-110 text-warm-cream font-display text-lg sm:text-xl tracking-wider uppercase shadow-2xl flex items-center justify-center gap-3 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer border border-bright-gold"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-bright-gold" />
                    <span>OPENING PAYMENT DESK...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6 text-bright-gold" />
                    <span>PAY NOW ₹{total.toLocaleString('en-IN')} WITH RAZORPAY</span>
                  </>
                )}
              </button>

              {paymentError && (
                <div className="p-3 rounded-xl bg-vermilion/20 border border-vermilion text-xs text-warm-cream flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-vermilion shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}
              </div>
            )}

            {/* Primary Action 2: Download / Print PDF Receipt */}
            <button
              type="button"
              onClick={handlePrint}
            className="w-full py-4 px-5 rounded-xl bg-gradient-to-r from-amber-glow to-bright-gold hover:from-bright-gold hover:to-amber-glow text-deep-plum font-display text-lg tracking-wider uppercase shadow-lg flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98] font-bold cursor-pointer border border-bright-gold/80"
          >
            <Printer className="w-5 h-5 text-deep-plum" />
            <span>DOWNLOAD / PRINT RECEIPT PDF</span>
          </button>

          {/* WhatsApp Support & Expedite Action */}
          {status !== 'EXPIRED' && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-deep-plum font-display text-base tracking-wider uppercase shadow-md flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98] font-bold"
            >
              <MessageCircle className="w-5 h-5 fill-deep-plum" />
              <span>{status === 'CANCELLED' ? 'REFUND ASSISTANCE VIA WHATSAPP' : 'EXPEDITE PASS VIA WHATSAPP'}</span>
            </a>
          )}

          {/* Call Box Office Action */}
          <a
            href={`tel:${eventData.contacts.phones[0].replace(/\s+/g, '')}`}
            className="w-full py-3 px-4 rounded-xl bg-royal-maroon/90 hover:bg-royal-maroon border border-antique-gold/40 text-warm-cream hover:text-bright-gold font-body text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-bright-gold" />
            <span>CALL BOX OFFICE ({eventData.contacts.phones[0]})</span>
          </a>

          {/* Submit Another Request Action */}
          {onNewEnquiry && (
            <button
              type="button"
              onClick={onNewEnquiry}
              className="w-full py-3 px-4 rounded-xl bg-deep-plum/90 hover:bg-deep-plum border border-antique-gold/30 text-warm-cream hover:text-bright-gold font-body text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-bright-gold" />
              <span>BOOK ANOTHER FESTIVAL PASS</span>
            </button>
          )}

          </div>

          {/* Fast Policy Links */}
          <div className="p-4 rounded-xl bg-deep-plum/60 border border-antique-gold/20 text-center space-y-1 text-[11px] text-warm-cream/60">
            <span className="block font-bold uppercase tracking-wider text-bright-gold text-[10px]">
              Official Policy Guarantee
            </span>
            <p>100% verified entry passes issued directly by Event Point.</p>
          </div>
        </div>
    </div>
  );
}
