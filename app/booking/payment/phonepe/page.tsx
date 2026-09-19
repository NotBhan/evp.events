'use client';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowRight,
  Ticket,
} from 'lucide-react';

interface VerificationResult {
  success: boolean;
  state?: 'COMPLETED' | 'FAILED' | 'PENDING' | 'EXPIRED';
  message?: string;
  error?: string;
  booking?: {
    bookingId: string;
    publicId: string;
    passType: string;
    quantity: number;
    total: number;
    fullName: string;
    phone: string;
    email?: string;
    status: string;
    paymentStatus: string;
    entryToken?: string;
  };
}

function PhonePePaymentReturnContent() {
  const searchParams = useSearchParams();
  const merchantOrderId = searchParams.get('merchantOrderId');

  const initialError = !merchantOrderId
    ? {
        success: false,
        state: 'FAILED' as const,
        error: 'No merchant order ID was provided in the return URL.',
      }
    : null;

  const [loading, setLoading] = useState<boolean>(Boolean(merchantOrderId));
  const [result, setResult] = useState<VerificationResult | null>(initialError);

  const fetchStatus = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(
        `/api/payments/phonepe/status/${encodeURIComponent(orderId)}`
      );
      const data = (await res.json()) as VerificationResult;
      setResult(data);
    } catch {
      setResult({
        success: false,
        state: 'PENDING',
        error: 'Network connection issue while verifying payment status.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!merchantOrderId) {
      return;
    }

    let isCancelled = false;
    fetch(`/api/payments/phonepe/status/${encodeURIComponent(merchantOrderId)}`)
      .then((res) => res.json())
      .then((data: VerificationResult) => {
        if (!isCancelled) {
          setResult(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setResult({
            success: false,
            state: 'PENDING',
            error: 'Network connection issue while verifying payment status.',
          });
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [merchantOrderId]);

  const handleRecheck = () => {
    if (merchantOrderId) {
      setLoading(true);
      fetchStatus(merchantOrderId);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-12 p-6 sm:p-10 rounded-3xl bg-card-surface border-2 border-antique-gold/40 shadow-2xl text-warm-cream">
      {loading ? (
        <div className="py-16 text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin text-bright-gold mx-auto" />
          <h2 className="font-display text-2xl uppercase tracking-wider text-warm-cream">
            Verifying PhonePe Payment
          </h2>
          <p className="text-sm font-body text-warm-cream/70 max-w-md mx-auto">
            Authenticating transaction status directly with PhonePe. Please do not close or refresh this window.
          </p>
        </div>
      ) : result?.state === 'COMPLETED' ? (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              PAYMENT VERIFIED &amp; CONFIRMED
            </span>
            <h2 className="font-display text-3xl uppercase tracking-wider text-warm-cream">
              Pass Confirmed!
            </h2>
            <p className="text-sm font-body text-warm-cream/80 max-w-md mx-auto">
              Your PhonePe payment was verified successfully. Your official admission pass and receipt are ready.
            </p>
          </div>

          {result.booking && (
            <div className="p-5 rounded-xl bg-deep-plum/80 border border-antique-gold/30 text-left space-y-3 font-body text-sm">
              <div className="flex justify-between border-b border-antique-gold/20 pb-2">
                <span className="text-warm-cream/70">Booking Reference</span>
                <span className="font-mono text-bright-gold font-bold">
                  {result.booking.publicId}
                </span>
              </div>
              <div className="flex justify-between border-b border-antique-gold/20 pb-2">
                <span className="text-warm-cream/70">Pass Type</span>
                <span className="text-warm-cream font-medium">
                  {result.booking.passType} ({result.booking.quantity} Pass)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-cream/70">Amount Paid</span>
                <span className="font-bold text-bright-gold">
                  ₹{result.booking.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/booking?bookingId=${result.booking?.publicId || ''}&status=success`}
              className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-vermilion text-warm-cream font-display text-lg tracking-wider uppercase border-2 border-antique-gold/80 flex items-center justify-center gap-2 font-bold shadow-lg"
            >
              <Ticket className="w-5 h-5 text-bright-gold" />
              <span>VIEW OFFICIAL RECEIPT &amp; PASS</span>
            </Link>
          </div>
        </div>
      ) : result?.state === 'FAILED' ? (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-vermilion/20 border-2 border-vermilion flex items-center justify-center mx-auto text-vermilion">
            <AlertTriangle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-vermilion font-bold">
              PAYMENT UNCOMPLETED
            </span>
            <h2 className="font-display text-2xl uppercase tracking-wider text-warm-cream">
              Transaction Was Not Completed
            </h2>
            <p className="text-sm font-body text-warm-cream/70 max-w-md mx-auto">
              {result.message ||
                result.error ||
                'Your payment was cancelled or declined. Your 24-hour reservation hold remains active.'}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRecheck}
              className="py-3 px-6 rounded-xl bg-deep-plum border border-antique-gold/50 text-warm-cream font-display text-sm tracking-wider uppercase flex items-center justify-center gap-2 hover:border-bright-gold cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-bright-gold" />
              <span>RE-CHECK STATUS</span>
            </button>
            <Link
              href={
                result.booking?.publicId
                  ? `/booking?bookingId=${result.booking.publicId}`
                  : '/booking'
              }
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-sm tracking-wider uppercase border border-antique-gold/70 flex items-center justify-center gap-2 font-bold"
            >
              <span>RETRY PAYMENT</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-glow/20 border-2 border-amber-glow flex items-center justify-center mx-auto text-amber-glow">
            <Clock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-glow font-bold">
              PAYMENT PENDING
            </span>
            <h2 className="font-display text-2xl uppercase tracking-wider text-warm-cream">
              Waiting for Confirmation
            </h2>
            <p className="text-sm font-body text-warm-cream/70 max-w-md mx-auto">
              Your payment is being processed by PhonePe and your bank. You can refresh to check if status has updated.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRecheck}
              className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-base tracking-wider uppercase border-2 border-antique-gold/80 flex items-center justify-center gap-2 font-bold cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" />
              <span>CHECK PAYMENT STATUS AGAIN</span>
            </button>
            <Link
              href={
                result?.booking?.publicId
                  ? `/booking?bookingId=${result.booking.publicId}`
                  : '/booking'
              }
              className="py-3.5 px-6 rounded-xl bg-deep-plum border border-antique-gold/50 text-warm-cream font-display text-base tracking-wider uppercase flex items-center justify-center gap-2 hover:border-bright-gold"
            >
              <span>RETURN TO BOOKING</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PhonePePaymentReturnPage() {
  return (
    <main className="min-h-screen bg-deep-plum text-warm-cream selection:bg-vermilion selection:text-warm-cream">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="p-12 text-center text-bright-gold font-body">
              Loading payment status...
            </div>
          }
        >
          <PhonePePaymentReturnContent />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
