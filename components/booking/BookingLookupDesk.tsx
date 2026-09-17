'use client';

import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Loader2,
  Printer,
  CreditCard,
  XCircle,
} from 'lucide-react';
import BookingCountdown from './BookingCountdown';
import PaymentPlaceholderModal from './PaymentPlaceholderModal';
import { SubmittedBookingRecord } from './BookingReceiptPrint';
import {
  calculateGstAndRefund,
  CANCELLATION_DEADLINE_DISPLAY,
  isCancellationAllowed,
  RefundCalculation,
} from '@/lib/cancellation-constants';

export interface RecoveredBooking {
  bookingId: string;
  publicId: string;
  passType: string;
  passId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  total: number;
  fullName: string;
  phone: string;
  email: string | null;
  city: string;
  status: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
  paymentStatus: 'NOT_STARTED' | 'PENDING' | 'FAILED' | 'PAID';
  createdAt: string;
  expiresAt: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancellationAllowed?: boolean;
  cancellationDeadline?: string;
  refundBreakdown?: RefundCalculation;
  refundStatus?: string;
  entryToken?: string;
}

interface BookingLookupDeskProps {
  onViewReceipt: (record: SubmittedBookingRecord) => void;
  onExitLookup: () => void;
}

export default function BookingLookupDesk({
  onViewReceipt,
  onExitLookup,
}: BookingLookupDeskProps) {
  // Form states
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Status & Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<RecoveredBooking[]>([]);

  // Cancellation modal state
  const [cancellingBooking, setCancellingBooking] = useState<RecoveredBooking | null>(null);
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState<boolean>(false);
  const [cancellationModalError, setCancellationModalError] = useState<string | null>(null);
  const [cancellationSuccessMsg, setCancellationSuccessMsg] = useState<string | null>(null);

  // Payment placeholder modal state
  const [selectedPaymentBooking, setSelectedPaymentBooking] = useState<RecoveredBooking | null>(null);

  // 1. Email + Phone Lookup
  const handleEmailPhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !phone.trim()) {
      setError('Please provide both your email address and WhatsApp mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'No bookings found matching the provided details.');
        setBookings([]);
      } else {
        setBookings(data.bookings || []);
      }
    } catch {
      setError('Network connection error. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Revalidate single booking upon countdown expiry
  const handleRevalidateBooking = async (bId: string) => {
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bId)}`);
      const data = await res.json();
      if (res.ok && data.success && data.booking) {
        setBookings((prev) =>
          prev.map((b) => (b.publicId === bId ? { ...b, ...data.booking } : b))
        );
      }
    } catch (err) {
      console.error('Failed to revalidate booking:', err);
    }
  };

  // 4. Exit / Clear Session
  const handleClearSession = async () => {
    try {
      await fetch('/api/bookings/lookup/clear', { method: 'POST' });
    } catch {
      // Ignore network errors on session clear
    }
    setBookings([]);
    setError('');
    setCancellationSuccessMsg(null);
    onExitLookup();
  };

  // 5. Booking Cancellation Handlers
  const handleInitiateCancellation = (b: RecoveredBooking) => {
    setCancellationModalError(null);
    setCancellingBooking(b);
  };

  const handleConfirmCancellation = async () => {
    if (!cancellingBooking) return;
    setIsSubmittingCancellation(true);
    setCancellationModalError(null);

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(cancellingBooking.bookingId)}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel reservation.');
      }

      const updatedBooking = data.booking;
      const updatedRefundBreakdown = data.refundBreakdown;

      setBookings((prev) =>
        prev.map((b) =>
          b.bookingId === cancellingBooking.bookingId
            ? {
                ...b,
                status: 'CANCELLED',
                cancelledAt: updatedBooking?.cancelledAt || new Date().toISOString(),
                refundBreakdown: updatedRefundBreakdown || b.refundBreakdown,
                refundStatus: updatedBooking?.refundStatus || 'SEPARATE_PROCESSING_REQUIRED',
                cancellationAllowed: false,
              }
            : b
        )
      );

      setCancellationSuccessMsg(
        `Booking ${cancellingBooking.publicId} has been successfully cancelled. Pass allocation was released back to inventory.`
      );
      setCancellingBooking(null);
    } catch (err: unknown) {
      setCancellationModalError(
        err instanceof Error ? err.message : 'An error occurred during booking cancellation.'
      );
    } finally {
      setIsSubmittingCancellation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-antique-gold/20 pb-4">
        <button
          type="button"
          onClick={handleClearSession}
          className="inline-flex items-center gap-2 text-xs text-bright-gold hover:text-warm-cream font-body uppercase font-bold tracking-wider cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to New Booking</span>
        </button>

        {bookings.length > 0 && (
          <button
            type="button"
            onClick={handleClearSession}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-deep-plum border border-antique-gold/40 text-warm-cream/80 hover:text-bright-gold text-xs font-body uppercase font-semibold cursor-pointer transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Clear Lookup Session</span>
          </button>
        )}
      </div>

      {/* Lookup Form (Shown if no bookings yet loaded) */}
      {bookings.length === 0 ? (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-royal-maroon border border-antique-gold/50 text-bright-gold text-xs font-mono tracking-widest uppercase mb-2">
              <span>RESERVATION RECOVERY</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl text-warm-cream tracking-wide uppercase">
              FIND YOUR FESTIVAL BOOKING
            </h3>
            <p className="font-body text-xs sm:text-sm text-warm-cream/70 max-w-md mx-auto mt-1">
              Recover your active pass enquiry, check your 24-hour reservation window, or view your official receipt.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-vermilion/20 border border-vermilion text-warm-cream text-xs font-body flex items-start gap-2.5 shadow-md animate-fade-in"
            >
              <AlertTriangle className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email + Mobile Lookup */}
          <form onSubmit={handleEmailPhoneLookup} className="space-y-4">
              <div>
                <label className="block font-body text-xs font-bold uppercase tracking-wider text-bright-gold mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-antique-gold/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. priya@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-deep-plum/90 border border-antique-gold/30 text-warm-cream placeholder-warm-cream/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-bright-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-body text-xs font-bold uppercase tracking-wider text-bright-gold mb-1.5">
                  WhatsApp Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-antique-gold/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9931503960"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-deep-plum/90 border border-antique-gold/30 text-warm-cream placeholder-warm-cream/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-bright-gold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow hover:from-amber-glow hover:to-vermilion text-warm-cream font-display text-base tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 font-bold cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-bright-gold" />
                    <span>Searching Reservations...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-bright-gold" />
                    <span>Search Bookings</span>
                  </>
                )}
              </button>
            </form>
        </div>
      ) : (
        /* Recovered Bookings List */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-bright-gold uppercase font-mono tracking-widest block font-bold">
                TEMPORARY LOOKUP SESSION
              </span>
              <h3 className="font-display text-2xl text-warm-cream uppercase tracking-wide">
                Your Reservations ({bookings.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setBookings([]);
                setError('');
                setCancellationSuccessMsg(null);
              }}
              className="text-xs text-bright-gold underline font-body hover:text-warm-cream cursor-pointer"
            >
              Search Different Details
            </button>
          </div>

          {/* Cancellation Success Notification */}
          {cancellationSuccessMsg && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-400 text-warm-cream text-xs font-body flex items-start gap-2.5 shadow-md animate-fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-emerald-300 block">Booking Cancelled Successfully</span>
                <span>{cancellationSuccessMsg}</span>
                <span className="block text-[11px] text-warm-cream/80">
                  Refund requests/processing are handled separately. Contact support via WhatsApp or email with your Request ID for refund assistance.
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {bookings.map((b) => {
              const refundCalc =
                b.refundBreakdown || (b.totalAmount ? calculateGstAndRefund(b.totalAmount) : null);
              const canCancel =
                b.status === 'CONFIRMED' && b.cancellationAllowed !== false && isCancellationAllowed();

              return (
                <div
                  key={b.publicId}
                  className="p-5 sm:p-6 rounded-2xl bg-deep-plum/90 border border-antique-gold/40 shadow-xl space-y-4"
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-antique-gold/20 pb-3">
                    <div>
                      <span className="font-mono text-xs text-bright-gold font-bold">
                        {b.publicId}
                      </span>
                      <h4 className="font-display text-xl sm:text-2xl text-warm-cream uppercase tracking-wide">
                        {b.passType}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {b.status === 'PENDING' ? (
                        <BookingCountdown
                          expiresAt={b.expiresAt}
                          onExpired={() => handleRevalidateBooking(b.publicId)}
                        />
                      ) : b.status === 'CONFIRMED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmed &amp; Paid</span>
                        </span>
                      ) : b.status === 'CANCELLED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vermilion/25 border border-vermilion text-vermilion text-xs font-bold uppercase tracking-wider">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancelled</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vermilion/30 border border-vermilion text-vermilion text-xs font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Expired</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-body">
                    <div>
                      <span className="text-warm-cream/50 block text-[10px] uppercase">QUANTITY</span>
                      <span className="font-bold text-warm-cream text-sm">{b.quantity} pass(es)</span>
                    </div>
                    <div>
                      <span className="text-warm-cream/50 block text-[10px] uppercase">TOTAL AMOUNT</span>
                      <span className="font-display text-base text-bright-gold font-bold">
                        ₹{b.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-warm-cream/50 block text-[10px] uppercase">ATTENDEE</span>
                      <span className="text-warm-cream font-medium truncate block">{b.fullName}</span>
                    </div>
                    <div>
                      <span className="text-warm-cream/50 block text-[10px] uppercase">CREATED ON</span>
                      <span className="text-warm-cream font-medium">
                        {new Date(b.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Status Notice / Explanation */}
                  {b.status === 'CANCELLED' ? (
                    <div className="p-3.5 rounded-xl bg-vermilion/15 border border-vermilion/40 text-xs font-body text-warm-cream/90 space-y-2">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-vermilion shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-vermilion block">Booking Cancelled</span>
                          <span>
                            This booking was cancelled and tickets returned to event inventory. Refund requests and disbursements are handled separately.
                          </span>
                        </div>
                      </div>
                      {refundCalc && (
                        <div className="p-3 rounded-lg bg-deep-plum/80 border border-antique-gold/25 text-[11px] grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <span className="text-warm-cream/60 block text-[10px] uppercase">ORIGINAL PAID</span>
                            <span className="font-semibold text-warm-cream font-mono">₹{refundCalc.grossFormatted}</span>
                          </div>
                          <div>
                            <span className="text-warm-cream/60 block text-[10px] uppercase">18% GST DEDUCTED</span>
                            <span className="font-semibold text-vermilion font-mono">-₹{refundCalc.gstFormatted}</span>
                          </div>
                          <div>
                            <span className="text-warm-cream/60 block text-[10px] uppercase">EXPECTED REFUND</span>
                            <span className="font-bold text-bright-gold font-mono">₹{refundCalc.refundFormatted}</span>
                          </div>
                        </div>
                      )}
                      <p className="text-[11px] text-warm-cream/70 italic">
                        * Refund status: Refund handled separately. For assistance with refund processing, contact our coordination desk with your Request ID {b.publicId}.
                      </p>
                    </div>
                  ) : b.status === 'EXPIRED' ? (
                    <div className="p-3 rounded-xl bg-vermilion/15 border border-vermilion/40 text-[11px] font-body text-warm-cream/90 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-vermilion shrink-0 mt-0.5" />
                      <span>
                        This booking expired because payment was not completed within 24 hours. Reserved
                        inventory was safely released back to the event pool, and no refund applies because no
                        payment was collected.
                      </span>
                    </div>
                  ) : b.status === 'PENDING' ? (
                    <div className="p-3 rounded-xl bg-royal-maroon/60 border border-antique-gold/30 text-[11px] font-body text-warm-cream/90 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                        <span>
                          Pay Later is active for this booking: payment must be completed within 24 hours of
                          booking. If payment is not completed before the deadline, the booking expires and the
                          reserved pass is released. No entry QR is issued until payment is confirmed.
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-warm-cream/60 uppercase tracking-wider text-[10px] font-bold">
                          Payment deadline:
                        </span>
                        <span
                          className="font-mono font-bold text-bright-gold"
                          data-payment-deadline={b.publicId}
                        >
                          {new Date(b.expiresAt).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}{' '}
                          IST
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-antique-gold/15">
                    {b.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentBooking(b)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream text-xs font-display uppercase font-bold tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer shadow-md"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-bright-gold" />
                        <span>COMPLETE PAYMENT</span>
                      </button>
                    )}

                    {b.status === 'CONFIRMED' && (
                      canCancel ? (
                        <button
                          type="button"
                          onClick={() => handleInitiateCancellation(b)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-deep-plum/90 border border-vermilion/80 hover:bg-vermilion/20 text-warm-cream text-xs font-body uppercase font-bold tracking-wider transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-vermilion" />
                          <span>CANCEL BOOKING</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-warm-cream/50 italic px-2 py-1">
                          Cancellation closed ({CANCELLATION_DEADLINE_DISPLAY})
                        </span>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        onViewReceipt({
                          bookingId: b.publicId,
                          passId: b.passId,
                          passType: b.passType,
                          quantity: b.quantity,
                          unitPrice: b.unitPrice,
                          total: b.totalAmount,
                          fullName: b.fullName,
                          phone: b.phone,
                          email: b.email || undefined,
                          city: b.city,
                          timestamp: b.createdAt,
                          status: b.status,
                          paymentStatus: b.paymentStatus,
                          expiresAt: b.expiresAt,
                          cancelledAt: b.cancelledAt,
                          refundBreakdown: b.refundBreakdown,
                          entryToken: b.entryToken,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-royal-maroon border border-antique-gold/40 text-warm-cream hover:text-bright-gold text-xs font-body uppercase font-semibold tracking-wider transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-bright-gold" />
                      <span>
                        {b.status === 'CONFIRMED'
                          ? 'OFFICIAL RECEIPT'
                          : b.status === 'CANCELLED'
                          ? 'CANCELLED STUB'
                          : b.status === 'EXPIRED'
                          ? 'EXPIRED STUB'
                          : 'VIEW RESERVATION STUB'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Dialog */}
      {cancellingBooking && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-plum/85 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-card-surface border-2 border-vermilion/60 shadow-2xl p-6 sm:p-8 space-y-5 text-warm-cream">
            {/* Header */}
            <div className="border-b border-antique-gold/20 pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vermilion/20 border border-vermilion text-vermilion text-[11px] font-bold uppercase tracking-wider mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>CONFIRM BOOKING CANCELLATION</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl text-warm-cream uppercase tracking-wide">
                CANCEL RESERVATION
              </h3>
              <p className="font-mono text-xs text-bright-gold mt-1">
                Booking ID: {cancellingBooking.publicId}
              </p>
            </div>

            {/* Error Banner */}
            {cancellationModalError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-vermilion/25 border border-vermilion text-xs text-warm-cream flex items-start gap-2 animate-fade-in"
              >
                <AlertTriangle className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                <span>{cancellationModalError}</span>
              </div>
            )}

            {/* Booking Details Preview */}
            <div className="p-4 rounded-xl bg-deep-plum/80 border border-antique-gold/25 space-y-2 text-xs font-body">
              <div className="flex justify-between">
                <span className="text-warm-cream/60">Pass Category:</span>
                <span className="font-bold text-warm-cream uppercase">{cancellingBooking.passType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-cream/60">Quantity:</span>
                <span className="font-bold text-warm-cream">{cancellingBooking.quantity} pass(es)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-cream/60">Originally Paid:</span>
                <span className="font-display text-sm font-bold text-bright-gold">
                  ₹{cancellingBooking.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-cream/60">Cancellation Deadline:</span>
                <span className="text-warm-cream font-medium">{CANCELLATION_DEADLINE_DISPLAY}</span>
              </div>
            </div>

            {/* Calculated Refund Breakdown Box */}
            {(() => {
              const calc =
                cancellingBooking.refundBreakdown || calculateGstAndRefund(cancellingBooking.totalAmount);
              return (
                <div className="p-4 rounded-xl bg-royal-maroon/70 border border-antique-gold/30 space-y-2 text-xs font-body">
                  <span className="text-[10px] text-bright-gold font-bold uppercase tracking-wider block">
                    STATUTORY GST REFUND BREAKDOWN
                  </span>
                  <div className="flex justify-between text-warm-cream/80">
                    <span>Original Gross Paid (GST-inclusive):</span>
                    <span className="font-mono">₹{calc.grossFormatted}</span>
                  </div>
                  <div className="flex justify-between text-warm-cream/80">
                    <span>GST Deducted (18% inclusive):</span>
                    <span className="font-mono text-vermilion">-₹{calc.gstFormatted}</span>
                  </div>
                  <div className="flex justify-between font-bold text-bright-gold pt-1.5 border-t border-antique-gold/20 text-sm">
                    <span>Expected Refund Amount:</span>
                    <span className="font-mono text-base">₹{calc.refundFormatted}</span>
                  </div>
                </div>
              );
            })()}

            {/* Important Explanatory Statements */}
            <div className="space-y-1.5 text-[11px] text-warm-cream/80 font-body bg-deep-plum/60 p-3.5 rounded-xl border border-antique-gold/15 leading-relaxed">
              <p>
                • <strong>Immediate Cancellation:</strong> Confirming this action immediately cancels your booking and releases your ticket quota back to the festival pool.
              </p>
              <p>
                • <strong>Refund Handled Separately:</strong> Cancellation takes effect immediately; refund processing is handled separately and returned to the original payment source.
              </p>
              <p>
                • <strong>18% GST Deduction:</strong> In accordance with client tax rules, the 18% GST component included in the gross pass price is deducted (Refund = Gross × 100 / 118).
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmittingCancellation}
                onClick={handleConfirmCancellation}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-vermilion to-royal-maroon hover:from-royal-maroon hover:to-vermilion text-warm-cream font-display text-sm tracking-wider uppercase font-bold shadow-lg border border-vermilion flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmittingCancellation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-bright-gold" />
                    <span>Cancelling Booking...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-warm-cream" />
                    <span>Confirm Cancellation</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmittingCancellation}
                onClick={() => setCancellingBooking(null)}
                className="py-3 px-5 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream hover:text-bright-gold font-body text-xs uppercase font-bold tracking-wider cursor-pointer transition-colors text-center"
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Placeholder Modal */}
      {selectedPaymentBooking && (
        <PaymentPlaceholderModal
          isOpen={Boolean(selectedPaymentBooking)}
          onClose={() => setSelectedPaymentBooking(null)}
          bookingId={selectedPaymentBooking.publicId}
          passType={selectedPaymentBooking.passType}
          quantity={selectedPaymentBooking.quantity}
          total={selectedPaymentBooking.totalAmount}
          fullName={selectedPaymentBooking.fullName}
          phone={selectedPaymentBooking.phone}
          expiresAt={selectedPaymentBooking.expiresAt}
        />
      )}
    </div>
  );
}
