'use client';

import React, { useState } from 'react';
import { eventData } from '@/data/eventData';
import { X, MessageCircle, PhoneCall, ShieldCheck, Clock, AlertCircle, CreditCard, Loader2 } from 'lucide-react';

interface PaymentPlaceholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  passType: string;
  quantity: number;
  total: number;
  fullName: string;
  phone: string;
  expiresAt: string;
}

export default function PaymentPlaceholderModal({
  isOpen,
  onClose,
  bookingId,
  passType,
  quantity,
  total,
  fullName,
  phone,
  expiresAt,
}: PaymentPlaceholderModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!isOpen) return null;

  const formattedExpiry = new Date(expiresAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const primaryPhone = eventData.contacts.phones[0].replace(/\D/g, '');
  const whatsappMessage = `*RAAS UTSAV 2026 — PASS PAYMENT ENQUIRY*\nBooking ID: ${bookingId}\nAttendee: ${fullName}\nPass: ${passType} (Qty: ${quantity})\nTotal: ₹${total.toLocaleString('en-IN')}\nPhone: ${phone}\n\nI have an active pass reservation. Please assist me with payment completion and pass confirmation.`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${primaryPhone}&text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const handleOnlineCheckout = async () => {
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-card-surface border-2 border-bright-gold shadow-2xl p-6 sm:p-8 text-warm-cream overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-deep-plum/80 border border-antique-gold/40 text-warm-cream hover:text-bright-gold transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-royal-maroon border border-bright-gold flex items-center justify-center text-bright-gold mx-auto mb-3 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-mono text-bright-gold uppercase tracking-widest block font-bold">
            RESERVATION ID: {bookingId}
          </span>
          <h3
            id="payment-modal-title"
            className="font-display text-2xl sm:text-3xl text-warm-cream uppercase tracking-wide mt-1"
          >
            COMPLETE PASS PAYMENT
          </h3>
        </div>

        {/* Reservation Summary Box */}
        <div className="p-4 rounded-2xl bg-deep-plum/90 border border-antique-gold/30 space-y-2 mb-6 text-xs font-body">
          <div className="flex justify-between items-center text-warm-cream/70">
            <span>Pass Selection:</span>
            <span className="font-bold text-warm-cream">{passType} × {quantity}</span>
          </div>
          <div className="flex justify-between items-center text-warm-cream/70">
            <span>Payable Amount:</span>
            <span className="font-display text-lg text-bright-gold font-bold">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between items-center text-warm-cream/70 pt-2 border-t border-antique-gold/20">
            <span className="flex items-center gap-1 text-amber-glow">
              <Clock className="w-3.5 h-3.5" />
              <span>Reservation Valid Until:</span>
            </span>
            <span className="font-mono text-warm-cream font-medium">{formattedExpiry}</span>
          </div>
        </div>

        {/* Informational Guidance Notice */}
        <div className="p-4 rounded-xl bg-royal-maroon/70 border border-antique-gold/40 text-left space-y-2 mb-6">
          <div className="flex items-center gap-2 text-bright-gold font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Online Gateway Update</span>
          </div>
          <p className="font-body text-xs text-warm-cream/90 leading-relaxed">
            Your pass reservation is securely held for 24 hours. Automated card/UPI checkout is scheduled to go live in the upcoming release.
          </p>
          <p className="font-body text-xs text-warm-cream/90 leading-relaxed">
            To complete your reservation immediately, connect directly with our Ranchi event coordination desk below.
          </p>
        </div>

        {/* Payment Error Alert */}
        {paymentError && (
          <div className="p-3.5 rounded-xl bg-vermilion/20 border border-vermilion/60 text-xs text-warm-cream mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-vermilion shrink-0" />
            <span>{paymentError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Action: Stripe Online Checkout */}
          <button
            type="button"
            onClick={handleOnlineCheckout}
            disabled={isRedirecting}
            className="w-full py-4 px-5 rounded-xl bg-gradient-to-r from-amber-glow via-bright-gold to-amber-glow hover:brightness-110 text-deep-plum font-display text-lg tracking-wider uppercase shadow-xl flex items-center justify-center gap-2.5 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-deep-plum" />
                <span>REDIRECTING TO STRIPE...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 text-deep-plum" />
                <span>PAY ₹{total.toLocaleString('en-IN')} ONLINE NOW</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-[1px] flex-1 bg-antique-gold/20" />
            <span className="text-[10px] font-mono text-warm-cream/50 uppercase tracking-widest">
              OR COORDINATE WITH BOX OFFICE
            </span>
            <div className="h-[1px] flex-1 bg-antique-gold/20" />
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#25D366]/90 to-[#1EBE5D]/90 hover:from-[#25D366] hover:to-[#1EBE5D] text-white font-body text-xs font-bold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>CONFIRM VIA WHATSAPP</span>
          </a>

          <a
            href={`tel:${eventData.contacts.phones[0].replace(/\s+/g, '')}`}
            className="w-full py-2.5 px-5 rounded-xl bg-royal-maroon/80 hover:bg-royal-maroon border border-antique-gold/40 text-warm-cream hover:text-bright-gold font-body text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-bright-gold" />
            <span>CALL BOX OFFICE ({eventData.contacts.phones[0]})</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            disabled={isRedirecting}
            className="w-full py-2 text-center text-xs text-warm-cream/60 hover:text-warm-cream font-body underline cursor-pointer transition-colors"
          >
            Return to Booking Details
          </button>
        </div>
      </div>
    </div>
  );
}
