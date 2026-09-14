'use client';

import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Key,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Loader2,
  Ticket,
  Printer,
  CreditCard,
  XCircle,
} from 'lucide-react';
import BookingCountdown from './BookingCountdown';
import PaymentPlaceholderModal from './PaymentPlaceholderModal';
import { SubmittedBookingRecord } from './BookingReceiptPrint';

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
}

interface BookingLookupDeskProps {
  onViewReceipt: (record: SubmittedBookingRecord) => void;
  onExitLookup: () => void;
}

export default function BookingLookupDesk({
  onViewReceipt,
  onExitLookup,
}: BookingLookupDeskProps) {
  const [tab, setTab] = useState<'email' | 'key'>('email');

  // Form states
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');

  // Status & Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<RecoveredBooking[]>([]);

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

  // 2. Direct Key Recovery (for email-less bookings)
  const handleKeyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId.trim() || !recoveryToken.trim()) {
      setError('Please provide both your Request ID and recovery key.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/bookings/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId.trim(),
          recoveryToken: recoveryToken.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid booking reference or recovery key.');
        setBookings([]);
      } else {
        setBookings([data.booking]);
      }
    } catch {
      setError('Network connection error. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Revalidate single booking upon countdown expiry
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
    onExitLookup();
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

          {/* Sub-Tab Selector */}
          <div className="flex rounded-xl bg-deep-plum/90 border border-antique-gold/30 p-1">
            <button
              type="button"
              onClick={() => {
                setTab('email');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-body font-bold uppercase tracking-wider transition-all cursor-pointer ${
                tab === 'email'
                  ? 'bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream shadow-md'
                  : 'text-warm-cream/60 hover:text-bright-gold'
              }`}
            >
              Email &amp; Mobile Lookup
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('key');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-body font-bold uppercase tracking-wider transition-all cursor-pointer ${
                tab === 'key'
                  ? 'bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream shadow-md'
                  : 'text-warm-cream/60 hover:text-bright-gold'
              }`}
            >
              Key Recovery (No Email)
            </button>
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

          {/* Tab 1: Email + Phone */}
          {tab === 'email' && (
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
          )}

          {/* Tab 2: Key Recovery */}
          {tab === 'key' && (
            <form onSubmit={handleKeyRecovery} className="space-y-4">
              <div>
                <label className="block font-body text-xs font-bold uppercase tracking-wider text-bright-gold mb-1.5">
                  Booking Reference ID *
                </label>
                <div className="relative">
                  <Ticket className="w-4 h-4 text-antique-gold/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g. RU26-REQ-4819"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-deep-plum/90 border border-antique-gold/30 text-warm-cream placeholder-warm-cream/30 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-bright-gold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-body text-xs font-bold uppercase tracking-wider text-bright-gold mb-1.5">
                  Recovery Key *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-antique-gold/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={recoveryToken}
                    onChange={(e) => setRecoveryToken(e.target.value)}
                    placeholder="Paste your 32-character recovery key"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-deep-plum/90 border border-antique-gold/30 text-warm-cream placeholder-warm-cream/30 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-bright-gold"
                  />
                </div>
                <span className="text-[11px] text-warm-cream/60 font-body mt-1 block">
                  Issued on receipt screen if you booked without providing an email address.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow hover:from-amber-glow hover:to-vermilion text-warm-cream font-display text-base tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 font-bold cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-bright-gold" />
                    <span>Verifying Recovery Key...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 text-bright-gold" />
                    <span>Recover Reservation</span>
                  </>
                )}
              </button>
            </form>
          )}
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
              }}
              className="text-xs text-bright-gold underline font-body hover:text-warm-cream cursor-pointer"
            >
              Search Different Details
            </button>
          </div>

          <div className="space-y-4">
            {bookings.map((b) => (
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
                {b.status === 'EXPIRED' ? (
                  <div className="p-3 rounded-xl bg-vermilion/15 border border-vermilion/40 text-[11px] font-body text-warm-cream/90 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-vermilion shrink-0 mt-0.5" />
                    <span>
                      The 24-hour reservation window for this booking has closed. Reserved inventory was safely released back to the event pool.
                    </span>
                  </div>
                ) : b.status === 'PENDING' ? (
                  <div className="p-3 rounded-xl bg-royal-maroon/60 border border-antique-gold/30 text-[11px] font-body text-warm-cream/90 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-bright-gold shrink-0 mt-0.5" />
                    <span>
                      Pass reservation is active. Payment completion is required before the timer expires to confirm admission.
                    </span>
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
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-royal-maroon border border-antique-gold/40 text-warm-cream hover:text-bright-gold text-xs font-body uppercase font-semibold tracking-wider transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-bright-gold" />
                    <span>
                      {b.status === 'CONFIRMED'
                        ? 'OFFICIAL RECEIPT'
                        : b.status === 'EXPIRED'
                        ? 'EXPIRED STUB'
                        : 'VIEW RESERVATION STUB'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
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
