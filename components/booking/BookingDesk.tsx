'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { eventData, PassTier } from '@/data/eventData';
import { isReducedMotion } from '@/components/animations/interiorAnimations';
import { getLenisInstance } from '@/lib/lenis-instance';
import {
  submitBookingRequest,
  generateBookingRequestId,
  BookingSubmissionResponse,
} from './bookingSubmission';
import {
  Ticket,
  User,
  Phone,
  Mail,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  Lock,
  CreditCard,
  Copy,
  Check,
  AlertTriangle,
  Calendar,
  MapPin,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { SubmittedBookingRecord } from './BookingReceiptPrint';

const BookingReceipt = dynamic(() => import('./BookingReceipt'), {
  loading: () => (
    <div className="p-8 text-center text-bright-gold font-body">
      <div className="w-8 h-8 mx-auto mb-3 border-2 border-antique-gold border-t-bright-gold rounded-full animate-spin" />
      <span>Loading Admission Pass Receipt...</span>
    </div>
  ),
  ssr: false,
});

const BookingReceiptPrint = dynamic(() => import('./BookingReceiptPrint'), {
  ssr: false,
});

import BookingDancerAtmosphere, {
  getBookingVisualStage,
} from './BookingDancerAtmosphere';
import PassOwnershipDisclaimer from './PassOwnershipDisclaimer';
import { launchRazorpayCheckout } from '@/lib/payments/razorpayClient';
import { launchPhonePeCheckout } from '@/lib/payments/phonepeClient';

export type { SubmittedBookingRecord };

interface BookingDeskProps {
  initialPassId?: string;
  initialBookingId?: string;
  initialStatus?: string;
  initialSessionId?: string;
}

export type BookingDeskStage =
  | 'RESERVE'
  | 'PAYMENT'
  | 'CONFIRMING'
  | 'SUCCESS'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_FAILED';

type SubmissionState = 'IDLE' | 'SUBMITTING' | 'ERROR';

export default function BookingDesk({
  initialPassId,
  initialBookingId,
  initialStatus,
  initialSessionId,
}: BookingDeskProps = {}) {
  // 'RESERVE' = standard booking flow. Pass recovery lives on /find-pass.

  // Overall Desk Stage
  const [deskStage, setDeskStage] = useState<BookingDeskStage>('RESERVE');

  // Reserve sub-steps: 1 = Select Pass, 2 = Attendee Info, 3 = Review & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Stable Component & Stage Shell Refs
  const bookingDeskRef = useRef<HTMLDivElement>(null);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const stageIndicatorRef = useRef<HTMLDivElement>(null);
  const stage1Ref = useRef<HTMLDivElement>(null);
  const stage2Ref = useRef<HTMLFormElement>(null);
  const stage3ActionsRef = useRef<HTMLDivElement>(null);
  const paymentStageRef = useRef<HTMLDivElement>(null);
  const confirmingRef = useRef<HTMLDivElement>(null);
  const successBoxRef = useRef<HTMLDivElement>(null);

  // Reservation Creation & Authoritative State
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionState>('IDLE');
  const [submissionError, setSubmissionError] = useState<string>('');
  const [submittedRecord, setSubmittedRecord] = useState<SubmittedBookingRecord | null>(null);
  const [sessionRequestId, setSessionRequestId] = useState<string>('');
  const [submittingElapsedSec, setSubmittingElapsedSec] = useState<number>(0);

  // Payment Execution State
  const [isInitiatingPayment, setIsInitiatingPayment] = useState<boolean>(false);
  const [initiatingGateway, setInitiatingGateway] = useState<'razorpay' | 'phonepe' | null>(null);
  const [paymentError, setPaymentError] = useState<string>('');
  const [copiedBookingId, setCopiedBookingId] = useState<boolean>(false);

  // Bounded Polling State for Return & Confirmation (Max 10 attempts @ 1.5s)
  const [isPollingConfirmation, setIsPollingConfirmation] = useState<boolean>(false);
  const [pollingAttempts, setPollingAttempts] = useState<number>(0);
  const [pollingTimedOut, setPollingTimedOut] = useState<boolean>(false);

  // Countdown timer for 24-hour reservation hold
  const [remainingTime, setRemainingTime] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ hours: 24, minutes: 0, seconds: 0, isExpired: false });

  // Form selections
  const validInitialId = eventData.passes.some((p) => p.id === initialPassId)
    ? initialPassId!
    : eventData.passes[0].id;

  const [selectedPassId, setSelectedPassId] = useState<string>(validInitialId);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string; email?: string }>({});

  const selectedPass: PassTier =
    eventData.passes.find((p) => p.id === selectedPassId) || eventData.passes[0];

  // One booking = one purchased pass; the pass tier alone determines admission capacity.
  const totalAmount = selectedPass.price;

  // Exact payment deadline — rendered from the authoritative server expiresAt (IST),
  // so it never restarts when the customer revisits or retries payment.
  const paymentDeadlineDisplay = submittedRecord?.expiresAt
    ? `${new Date(submittedRecord.expiresAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      })} IST`
    : null;

  // Note: Checkout scripts (Razorpay / PhonePe) are loaded on-demand when user clicks to pay


  // Bounded Polling for Authoritative Booking Confirmation (Max 10 retries at 1.5s intervals)
  const pollBookingConfirmation = useCallback(async (targetId: string, maxAttempts = 10) => {
    setDeskStage('CONFIRMING');
    setIsPollingConfirmation(true);
    setPollingTimedOut(false);
    setPollingAttempts(0);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      setPollingAttempts(attempt);
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(targetId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data.booking) {
            const b = data.booking;
            const record: SubmittedBookingRecord = {
              bookingId: b.publicId || b.bookingId,
              passId: b.passId,
              passType: b.passType,
              quantity: b.quantity,
              unitPrice: b.unitPrice,
              total: b.total || b.totalAmount,
              fullName: b.fullName,
              phone: b.phone,
              email: b.email || '',
              city: b.city || 'Ranchi',
              timestamp: b.createdAt,
              status: b.status,
              paymentStatus: b.paymentStatus,
              expiresAt: b.expiresAt,
              confirmedAt: b.confirmedAt,
              cancelledAt: b.cancelledAt,
              refundBreakdown: b.refundBreakdown,
              entryToken: b.entryToken,
            };
            setSubmittedRecord(record);

            if (b.status === 'CONFIRMED' && b.paymentStatus === 'PAID') {
              setDeskStage('SUCCESS');
              setIsPollingConfirmation(false);
              setPollingTimedOut(false);
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', `?bookingId=${encodeURIComponent(record.bookingId)}`);
              }
              return;
            }

            if (b.status === 'EXPIRED' || b.status === 'CANCELLED') {
              setDeskStage('SUCCESS');
              setIsPollingConfirmation(false);
              setPollingTimedOut(false);
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', `?bookingId=${encodeURIComponent(record.bookingId)}`);
              }
              return;
            }
          }
        }
      } catch (err) {
        console.warn(`[Polling confirmation attempt ${attempt} failed]`, err);
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    // Polling window elapsed without confirmation -> Show non-error pending state
    setIsPollingConfirmation(false);
    setPollingTimedOut(true);
  }, []);

  // Handle URL parameters, Stripe return redirect, and reservation recovery
  useEffect(() => {
    let targetBookingId = initialBookingId;
    let targetStatus = initialStatus;
    let targetSessionId = initialSessionId;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (!targetBookingId) {
        targetBookingId = params.get('booking_id') || params.get('bookingId') || undefined;
      }
      if (!targetStatus) {
        targetStatus = params.get('status') || undefined;
      }
      if (!targetSessionId) {
        targetSessionId = params.get('session_id') || undefined;
      }
    }

    if (!targetBookingId) return;

    if (targetStatus === 'success') {
      // Return from Stripe with status=success -> Bounded server-authoritative polling
      // eslint-disable-next-line react-hooks/set-state-in-effect -- bounded post-payment poll must start as soon as the redirect is processed
      pollBookingConfirmation(targetBookingId, 10);
    } else if (targetStatus === 'cancelled') {
      // Return from Stripe with status=cancelled -> Fetch record and enter PAYMENT_PENDING
      fetch(`/api/bookings/${encodeURIComponent(targetBookingId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.booking) {
            const b = data.booking;
            const record: SubmittedBookingRecord = {
              bookingId: b.publicId || b.bookingId,
              passId: b.passId,
              passType: b.passType,
              quantity: b.quantity,
              unitPrice: b.unitPrice,
              total: b.total || b.totalAmount,
              fullName: b.fullName,
              phone: b.phone,
              email: b.email || '',
              city: b.city || 'Ranchi',
              timestamp: b.createdAt,
              status: b.status,
              paymentStatus: b.paymentStatus,
              expiresAt: b.expiresAt,
              confirmedAt: b.confirmedAt,
              cancelledAt: b.cancelledAt,
              refundBreakdown: b.refundBreakdown,
              entryToken: b.entryToken,
            };
            setSubmittedRecord(record);
            if (b.status === 'CONFIRMED' && b.paymentStatus === 'PAID') {
              setDeskStage('SUCCESS');
            } else if (b.status === 'PENDING') {
              setDeskStage('PAYMENT_PENDING');
              setPaymentError('Checkout was cancelled or dismissed. Your 24-hour pass reservation is still safely held.');
            } else {
              setDeskStage('SUCCESS');
            }
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', `?bookingId=${encodeURIComponent(targetBookingId!)}`);
            }
          }
        })
        .catch(() => {});
    } else {
      // Normal booking recovery / browser refresh
      fetch(`/api/bookings/${encodeURIComponent(targetBookingId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.booking) {
            const b = data.booking;
            const record: SubmittedBookingRecord = {
              bookingId: b.publicId || b.bookingId,
              passId: b.passId,
              passType: b.passType,
              quantity: b.quantity,
              unitPrice: b.unitPrice,
              total: b.total || b.totalAmount,
              fullName: b.fullName,
              phone: b.phone,
              email: b.email || '',
              city: b.city || 'Ranchi',
              timestamp: b.createdAt,
              status: b.status,
              paymentStatus: b.paymentStatus,
              expiresAt: b.expiresAt,
              confirmedAt: b.confirmedAt,
              cancelledAt: b.cancelledAt,
              refundBreakdown: b.refundBreakdown,
              entryToken: b.entryToken,
            };
            setSubmittedRecord(record);
            if (b.status === 'CONFIRMED' && b.paymentStatus === 'PAID') {
              setDeskStage('SUCCESS');
            } else if (b.status === 'PENDING') {
              // Recovered Pay Later booking: pending state with the original fixed
              // deadline, continue-payment action and the expiry warning.
              setDeskStage('PAYMENT_PENDING');
            } else {
              setDeskStage('SUCCESS');
            }
          }
        })
        .catch(() => {});
    }
  }, [initialBookingId, initialStatus, initialSessionId, pollBookingConfirmation]);

  // Remaining Hold Countdown Ticker
  useEffect(() => {
    if (!submittedRecord?.expiresAt) return;

    const updateTimer = () => {
      const diff = new Date(submittedRecord.expiresAt!).getTime() - Date.now();
      if (diff <= 0) {
        setRemainingTime({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setRemainingTime({ hours, minutes, seconds, isExpired: false });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [submittedRecord?.expiresAt]);

  // Controlled Stage Transition: anchors viewport smoothly
  const transitionToStep = (targetStep: 1 | 2 | 3) => {
    if (!bookingDeskRef.current) {
      setCurrentStep(targetStep);
      return;
    }

    const deskRect = bookingDeskRef.current.getBoundingClientRect();
    const deskDocTop = deskRect.top + window.scrollY;
    const masthead = typeof document !== 'undefined' ? document.getElementById('main-masthead') : null;
    const mastheadHeight = masthead ? masthead.offsetHeight : 80;

    setCurrentStep(targetStep);

    requestAnimationFrame(() => {
      if (!bookingDeskRef.current) return;
      const newRect = bookingDeskRef.current.getBoundingClientRect();
      const newDocTop = newRect.top + window.scrollY;
      const lenis = getLenisInstance();

      if (deskRect.top < 0) {
        const targetY = Math.max(0, newDocTop - mastheadHeight - 16);
        if (lenis) {
          lenis.scrollTo(targetY, { immediate: true });
        } else {
          window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
        }
      } else {
        const delta = newDocTop - deskDocTop;
        if (Math.abs(delta) > 1) {
          const targetY = window.scrollY + delta;
          if (lenis) {
            lenis.scrollTo(targetY, { immediate: true });
          } else {
            window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
          }
        }
      }
    });
  };

  // Stage Indicator Entrance
  useEffect(() => {
    if (isReducedMotion()) return;
    if (stageIndicatorRef.current) {
      gsap.fromTo(
        stageIndicatorRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, []);

  // GSAP Fade Transitions for Steps and Stages
  useEffect(() => {
    if (isReducedMotion()) return;

    if (deskStage === 'RESERVE') {
      if (currentStep === 1 && stage1Ref.current) {
        gsap.fromTo(stage1Ref.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' });
      } else if (currentStep === 2 && stage2Ref.current) {
        gsap.fromTo(stage2Ref.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' });
        if (fullNameInputRef.current) {
          fullNameInputRef.current.focus({ preventScroll: true });
        }
      } else if (currentStep === 3 && stage3ActionsRef.current) {
        gsap.fromTo(stage3ActionsRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' });
      }
    } else if (deskStage === 'PAYMENT' && paymentStageRef.current) {
      gsap.fromTo(paymentStageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' });
    } else if (deskStage === 'CONFIRMING' && confirmingRef.current) {
      gsap.fromTo(confirmingRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' });
    } else if (deskStage === 'SUCCESS' && successBoxRef.current) {
      gsap.fromTo(successBoxRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' });
    }
  }, [deskStage, currentStep]);

  // Validation before step 2 -> 3
  const handleValidateStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { fullName?: string; phone?: string; email?: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Please enter your full name';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = email.trim()
        ? 'Please enter a valid email address'
        : 'Please enter your email address — it is how you retrieve your pass later';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (!sessionRequestId) {
      setSessionRequestId(generateBookingRequestId());
    }
    transitionToStep(3);
    setSubmissionStatus('IDLE');
    setSubmissionError('');
  };

  // Track submission duration for slow networks
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (submissionStatus === 'SUBMITTING') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the elapsed counter when a submission begins
      setSubmittingElapsedSec(0);
      timer = setInterval(() => {
        setSubmittingElapsedSec((prev) => prev + 1);
      }, 1000);
    } else {
      setSubmittingElapsedSec(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [submissionStatus]);

  // Step 3 Submission Handler: Creates Authoritative Neon Reservation and Transitions to PAYMENT Stage
  const handleSubmitBooking = async () => {
    if (submissionStatus === 'SUBMITTING') return;

    setSubmissionStatus('SUBMITTING');
    setSubmissionError('');

    const bookingId = sessionRequestId || generateBookingRequestId();
    if (!sessionRequestId) {
      setSessionRequestId(bookingId);
    }
    const timestamp = new Date().toISOString();

    const record: SubmittedBookingRecord = {
      bookingId,
      passId: selectedPass.id,
      passType: selectedPass.name,
      quantity: 1,
      unitPrice: selectedPass.price,
      total: totalAmount,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim() || 'Ranchi',
      timestamp,
    };

    const payload = {
      passId: selectedPass.id,
      passType: selectedPass.name,
      unitPrice: selectedPass.price,
      total: totalAmount,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || 'N/A',
      city: city.trim() || 'Ranchi',
      bookingId,
      timestamp,
      hp_company_field: honeypot,
    };

    try {
      const response = await submitBookingRequest(payload);
      if (response.success) {
        const verifiedRecord: SubmittedBookingRecord = {
          ...record,
          bookingId: response.bookingId || bookingId,
          unitPrice: response.unitPrice ?? record.unitPrice,
          total: response.total ?? record.total,
          status: response.status || 'PENDING',
          paymentStatus: response.paymentStatus || 'NOT_STARTED',
          expiresAt: response.expiresAt,
        };
        setSubmittedRecord(verifiedRecord);
        setSubmissionStatus('IDLE');

        // Transition directly to dedicated PAYMENT stage
        setDeskStage('PAYMENT');

        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `?bookingId=${encodeURIComponent(verifiedRecord.bookingId)}`);
        }

        // Anchor scroll to top of booking desk
        requestAnimationFrame(() => {
          if (!bookingDeskRef.current) return;
          const rect = bookingDeskRef.current.getBoundingClientRect();
          if (rect.top < 0) {
            const masthead = typeof document !== 'undefined' ? document.getElementById('main-masthead') : null;
            const mastheadHeight = masthead ? masthead.offsetHeight : 80;
            const targetY = Math.max(0, rect.top + window.scrollY - mastheadHeight - 16);
            const lenis = getLenisInstance();
            if (lenis) {
              lenis.scrollTo(targetY, { immediate: true });
            } else {
              window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
            }
          }
        });
      } else {
        setSubmissionError(response.error || 'Unable to record your booking request in the reservation system. Please try again.');
        setSubmissionStatus('ERROR');
      }
    } catch (err: unknown) {
      setSubmissionError(
        err instanceof Error ? err.message : 'Network error occurred while connecting to the reservation system.'
      );
      setSubmissionStatus('ERROR');
    }
  };

  const handleStartNewReservation = () => {
    setDeskStage('RESERVE');
    setCurrentStep(1);
    setSubmittedRecord(null);
    setSubmissionStatus('IDLE');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  // Trigger Online Payment (Razorpay Standard Checkout or Stripe)
  const handlePayNow = async () => {
    if (!submittedRecord || isInitiatingPayment) return;

    setIsInitiatingPayment(true);
    setInitiatingGateway('razorpay');
    setPaymentError('');

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: submittedRecord.bookingId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unable to initialize checkout session. Please try again.');
      }

      if (data.provider === 'razorpay') {
        await launchRazorpayCheckout({
          keyId: data.keyId,
          orderId: data.orderId,
          amountPaise: data.amount,
          currency: data.currency || 'INR',
          eventName: 'RAAS UTSAV 2026',
          description: `${submittedRecord.passType} (1 Pass)`,
          prefill: {
            name: submittedRecord.fullName,
            email: submittedRecord.email,
            contact: submittedRecord.phone,
          },
          onSuccess: async (response) => {
            // Intermediate state: "Confirming your payment..."
            setDeskStage('CONFIRMING');

            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookingId: submittedRecord.bookingId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();

              if (verifyRes.ok && verifyData.success) {
                const confirmedRecord: SubmittedBookingRecord = {
                  ...submittedRecord,
                  status: 'CONFIRMED',
                  paymentStatus: 'PAID',
                  bookingId: verifyData.booking.bookingId,
                  unitPrice: verifyData.booking.unitPrice,
                  total: verifyData.booking.total,
                  confirmedAt: verifyData.booking.confirmedAt,
                  entryToken: verifyData.booking.entryToken,
                };
                setSubmittedRecord(confirmedRecord);
                setDeskStage('SUCCESS');
              } else {
                setPaymentError(
                  verifyData.error ||
                    'Payment verification is taking longer than expected. Please check your reservation status.'
                );
                setDeskStage('PAYMENT_PENDING');
              }
            } catch {
              setPaymentError(
                'Network interrupted while verifying payment. Your transaction was processed — please check reservation.'
              );
              setDeskStage('PAYMENT_PENDING');
            }
          },
          onFailure: (failureResponse) => {
            const description =
              failureResponse.error?.description ||
              failureResponse.error?.reason ||
              'Payment was not completed.';
            setPaymentError(description);
            setDeskStage('PAYMENT_FAILED');
          },
          onDismiss: () => {
            setDeskStage('PAYMENT_PENDING');
          },
        });
        setIsInitiatingPayment(false);
        setInitiatingGateway(null);
      } else if (data.checkoutUrl) {
        // Stripe redirect flow
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL or order parameters received from payment server.');
      }
    } catch (err: unknown) {
      setIsInitiatingPayment(false);
      setInitiatingGateway(null);
      setPaymentError(
        err instanceof Error ? err.message : 'Unable to initialize checkout. Please try again.'
      );
      setDeskStage('PAYMENT_FAILED');
    }
  };

  // Trigger Online Payment via PhonePe Standard Checkout
  const handlePayPhonePe = async () => {
    if (!submittedRecord || isInitiatingPayment) return;

    setIsInitiatingPayment(true);
    setInitiatingGateway('phonepe');
    setPaymentError('');

    try {
      const res = await fetch('/api/payments/phonepe/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: submittedRecord.bookingId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unable to initialize PhonePe checkout session. Please try again.');
      }

      const { redirectUrl, merchantOrderId } = data;

      await launchPhonePeCheckout({
        redirectUrl,
        merchantOrderId,
        onCallback: async () => {
          // Response state from PhonePe callback is just a UI signal (e.g. CONCLUDED, USER_CANCEL)
          // NEVER trust it as payment proof. Authoritatively query backend status!
          setDeskStage('CONFIRMING');

          try {
            const statusRes = await fetch(
              `/api/payments/phonepe/status/${encodeURIComponent(merchantOrderId)}`
            );
            const statusData = await statusRes.json();

            if (statusRes.ok && statusData.success && statusData.state === 'COMPLETED') {
              const confirmedRecord: SubmittedBookingRecord = {
                ...submittedRecord,
                status: 'CONFIRMED',
                paymentStatus: 'PAID',
                bookingId: statusData.booking.bookingId,
                unitPrice: statusData.booking.unitPrice,
                total: statusData.booking.total,
                confirmedAt: statusData.booking.confirmedAt,
                entryToken: statusData.booking.entryToken,
              };
              setSubmittedRecord(confirmedRecord);
              setDeskStage('SUCCESS');
            } else if (statusData.state === 'FAILED') {
              setPaymentError(
                statusData.message || 'PhonePe payment was cancelled or declined. You may retry.'
              );
              setDeskStage('PAYMENT_FAILED');
            } else {
              setPaymentError(
                'Payment is being processed by PhonePe. Please check reservation status.'
              );
              setDeskStage('PAYMENT_PENDING');
            }
          } catch {
            setPaymentError(
              'Network interrupted while verifying PhonePe payment. Please check your reservation status.'
            );
            setDeskStage('PAYMENT_PENDING');
          }
        },
        onFallbackRedirect: () => {
          setDeskStage('CONFIRMING');
        },
      });
      setIsInitiatingPayment(false);
      setInitiatingGateway(null);
    } catch (err: unknown) {
      setIsInitiatingPayment(false);
      setInitiatingGateway(null);
      setPaymentError(
        err instanceof Error ? err.message : 'Unable to initialize PhonePe checkout. Please try again.'
      );
      setDeskStage('PAYMENT_FAILED');
    }
  };

  const handleCopyBookingId = (id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id).then(() => {
        setCopiedBookingId(true);
        setTimeout(() => setCopiedBookingId(false), 2500);
      });
    }
  };

  // WhatsApp coordinator URL
  const activeBookingId =
    submittedRecord?.bookingId || sessionRequestId || 'RU26-REQ-PENDING';
  const primaryPhone = eventData.contacts.phones[0].replace(/\D/g, '');
  const whatsappMessage = `*RAAS UTSAV 2026 — PASS RESERVATION*\nBooking Reference: ${activeBookingId}\nPass: ${
    submittedRecord?.passType || selectedPass.name
  }\nAmount: ₹${(
    submittedRecord?.total || totalAmount
  ).toLocaleString('en-IN')}\nAttendee: ${
    submittedRecord?.fullName || fullName
  }\nPhone: ${submittedRecord?.phone || phone}\n\nPlease assist me with payment confirmation for my reservation hold.`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${primaryPhone}&text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div
      id="booking-desk"
      ref={bookingDeskRef}
      style={{ overflowAnchor: 'none' }}
      className="relative w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto rounded-3xl bg-card-surface border-2 border-antique-gold/40 shadow-2xl p-6 sm:p-8 lg:p-10 xl:p-12 overflow-hidden"
    >
      {/* Ambient Radial Glow */}
      <div
        className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(217,37,36,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(243,198,76,0.10) 0%, transparent 70%)' }}
      />

      {/* Dancer Atmosphere — deterministic, stage-driven artwork */}
      <BookingDancerAtmosphere
        visualStage={getBookingVisualStage(deskStage, currentStep)}
      />

      {/* Box Office Header */}
      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-royal-maroon/80 border border-antique-gold/40 text-bright-gold text-xs font-semibold tracking-widest uppercase mb-3 shadow-md">
          <span className="text-vermilion text-xs" aria-hidden="true">♦</span>
          <span>OFFICIAL FESTIVAL BOX OFFICE</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-wide uppercase">
          {deskStage === 'SUCCESS'
            ? 'PASS BOOKING CONFIRMED'
            : deskStage === 'CONFIRMING'
            ? 'CONFIRMING PAYMENT'
            : deskStage === 'PAYMENT' || deskStage === 'PAYMENT_PENDING' || deskStage === 'PAYMENT_FAILED'
            ? 'COMPLETE PASS PAYMENT'
            : 'RESERVE YOUR FESTIVAL PASS'}
        </h2>
        <p className="font-body text-xs sm:text-sm text-warm-cream/75 max-w-lg mx-auto mt-2">
          {deskStage === 'SUCCESS'
            ? `Your admission passes for ${eventData.eventName} are officially confirmed. Download or print your admission stub below.`
            : deskStage === 'CONFIRMING'
            ? 'Verifying transaction authorization with banking gateway. Please keep this window open.'
            : deskStage === 'PAYMENT' || deskStage === 'PAYMENT_PENDING' || deskStage === 'PAYMENT_FAILED'
            ? `Your passes are held on a 24-hour reservation hold. Complete online payment to receive your confirmed ticket receipt.`
            : `Direct desk reservation for ${eventData.eventName} at ${eventData.venueDisplay}. Follow the simple steps below.`}
        </p>

        {/* Find Pass lives on its own page; the desk keeps a quiet link to it. */}
        {deskStage === 'RESERVE' && (
          <div className="flex items-center justify-center mt-4">
            <Link
              href="/find-pass"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-deep-plum/80 text-warm-cream/60 hover:text-bright-gold border border-antique-gold/20 text-xs font-body font-bold uppercase tracking-wider transition-colors"
            >
              <span>Already booked? Find your pass</span>
              <ArrowRight className="w-3.5 h-3.5 text-bright-gold" />
            </Link>
          </div>
        )}

        {/* Flow Stage Indicator */}
        <div ref={stageIndicatorRef} className="grid grid-cols-5 items-stretch gap-1.5 sm:gap-2.5 md:gap-3 mt-6 max-w-xl mx-auto">
            {[
              { id: '1', title: '1. Select Pass', active: deskStage === 'RESERVE' && currentStep === 1, done: deskStage !== 'RESERVE' || currentStep > 1 },
              { id: '2', title: '2. Attendee', active: deskStage === 'RESERVE' && currentStep === 2, done: deskStage !== 'RESERVE' || currentStep > 2 },
              { id: '3', title: '3. Review', active: deskStage === 'RESERVE' && currentStep === 3, done: deskStage !== 'RESERVE' },
              { id: '4', title: '4. Payment', active: deskStage === 'PAYMENT' || deskStage === 'CONFIRMING' || deskStage === 'PAYMENT_PENDING' || deskStage === 'PAYMENT_FAILED', done: deskStage === 'SUCCESS' },
              { id: '5', title: '5. Receipt', active: deskStage === 'SUCCESS', done: deskStage === 'SUCCESS' },
            ].map((item) => (
              <div
                key={item.id}
                className={`min-h-[42px] sm:min-h-[38px] flex items-center justify-center py-1.5 px-1 sm:px-2 rounded-lg text-center font-body text-[10px] sm:text-xs font-semibold uppercase tracking-wider leading-snug transition-all ${
                  item.active
                    ? 'bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream shadow-md'
                    : item.done
                    ? 'bg-royal-maroon/90 text-bright-gold border border-antique-gold/40'
                    : 'bg-deep-plum/60 text-warm-cream/40 border border-antique-gold/15'
                }`}
              >
                <span>{item.title}</span>
              </div>
            ))}
        </div>
      </div>

      {/* ====================================================================
          STAGE SHELL: STABLE INNER CONTAINER PREVENTING LAYOUT JANK
          ==================================================================== */}
      <div
        id="booking-stage-shell"
        ref={stageShellRef}
        style={{ overflowAnchor: 'none' }}
        className="relative z-10 min-h-[520px]"
      >
        {/* RESERVE FLOW (Find Pass lives on /find-pass) */}
        {/* ================================================================
            STAGE 1: SELECT PASS & QUANTITY (2-Column on large screens)
            ================================================================ */}
            {deskStage === 'RESERVE' && currentStep === 1 && (
              <div ref={stage1Ref} className="relative z-10 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  {/* Left Column: Pass Selection Cards */}
                  <div className="lg:col-span-7 xl:col-span-8 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {eventData.passes.map((pass) => {
                        const isSelected = selectedPassId === pass.id;
                        return (
                          <div
                            key={pass.id}
                            id={`pass-card-${pass.id}`}
                            data-pass-id={pass.id}
                            onClick={() => setSelectedPassId(pass.id)}
                            className={`stage-1-pass-card relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-royal-maroon/95 border-bright-gold shadow-lg ring-2 ring-bright-gold/40'
                                : 'bg-deep-plum/80 border-antique-gold/25 hover:border-antique-gold/50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-bold tracking-widest text-bright-gold uppercase">
                                  {pass.category}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-bright-gold shrink-0" />
                                )}
                              </div>
                              <h3 className="font-display text-xl text-warm-cream uppercase tracking-wide mb-1">
                                {pass.name}
                              </h3>
                              <p className="font-body text-xs text-warm-cream/70 mb-3">
                                {pass.description}
                              </p>
                            </div>
                            <div className="pt-3 border-t border-antique-gold/20 flex items-baseline justify-between">
                              <span className="text-xs text-warm-cream/50 uppercase font-body">Price</span>
                              <span className="font-display text-2xl font-bold text-bright-gold">
                                ₹{pass.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Selected Pass Summary & Continue Button */}
                  <div className="lg:col-span-5 xl:col-span-4 space-y-4 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-antique-gold/30 lg:pl-6 xl:pl-8 lg:self-stretch">
                    {/* Selected Pass Review & Summary Ledger Card */}
                    <div className="rounded-2xl bg-royal-maroon/95 border-2 border-antique-gold/50 shadow-2xl overflow-hidden text-warm-cream">
                      {/* Review Card Header */}
                      <div className="px-5 py-3.5 bg-deep-plum/90 border-b border-antique-gold/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-bright-gold" />
                          <span className="text-[11px] font-bold tracking-widest text-bright-gold uppercase font-body">
                            PASS REVIEW &amp; SUMMARY
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-royal-maroon border border-bright-gold/40 text-[10px] font-mono text-bright-gold font-bold">
                          {selectedPass.admitCount || 1} ADMIT
                        </span>
                      </div>

                      {/* Pass Identification Block */}
                      <div className="p-5 space-y-4">
                        <div className="border-b border-antique-gold/20 pb-3.5">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold tracking-widest text-bright-gold uppercase">
                              {selectedPass.category}
                            </span>
                            <span className="text-[11px] text-warm-cream/60 font-body">
                              1 Pass Selected
                            </span>
                          </div>
                          <h4 className="font-display text-2xl text-white uppercase tracking-wide">
                            {selectedPass.name}
                          </h4>
                          <p className="font-body text-xs text-warm-cream/75 mt-1 leading-relaxed">
                            {selectedPass.description}
                          </p>
                        </div>

                        {/* Specification / Review Metadata Ledger */}
                        <div className="space-y-2.5 text-xs font-body">
                          <div className="flex items-center justify-between py-1 border-b border-dashed border-antique-gold/20">
                            <span className="text-warm-cream/60 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-amber-glow" />
                              <span>Festival Date:</span>
                            </span>
                            <span className="font-semibold text-warm-cream">16 October 2026</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-dashed border-antique-gold/20">
                            <span className="text-warm-cream/60 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-glow" />
                              <span>Time &amp; Entry:</span>
                            </span>
                            <span className="font-semibold text-warm-cream">5:00 PM Onwards</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-dashed border-antique-gold/20">
                            <span className="text-warm-cream/60 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-glow" />
                              <span>Venue:</span>
                            </span>
                            <span className="font-semibold text-warm-cream text-right">Upwan Lawn, BNR Chanakya</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-dashed border-antique-gold/20">
                            <span className="text-warm-cream/60 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-amber-glow" />
                              <span>Capacity:</span>
                            </span>
                            <span className="font-semibold text-bright-gold">
                              {selectedPass.admitCount || 1} Person{((selectedPass.admitCount || 1) > 1) ? 's' : ''} Entry
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-warm-cream/60 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-glow" />
                              <span>Taxes &amp; GST:</span>
                            </span>
                            <span className="font-semibold text-emerald-300">Included in Price</span>
                          </div>
                        </div>

                        {/* Total Financial Summary Box */}
                        <div className="p-3.5 rounded-xl bg-deep-plum/90 border border-antique-gold/40 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-warm-cream/60 uppercase font-body font-bold block tracking-wider">
                              TOTAL AMOUNT PAYABLE
                            </span>
                            <span className="text-[10px] text-warm-cream/40">Zero additional booking fees</span>
                          </div>
                          <span className="font-display text-3xl font-bold text-bright-gold">
                            ₹{selectedPass.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Single-Pass Booking Model Note */}
                    <div className="p-4 rounded-xl bg-deep-plum/90 border border-antique-gold/30 space-y-1">
                      <span className="font-display text-sm text-warm-cream uppercase tracking-wide block">
                        ONE PASS PER BOOKING
                      </span>
                      <span className="font-body text-[11px] text-warm-cream/60 leading-relaxed block">
                        Each booking reserves exactly one pass tier. The selected pass tier alone determines admission capacity.
                      </span>
                    </div>

                    {/* Next Step Action Button */}
                    <button
                      id="stage-1-next-btn"
                      type="button"
                      onClick={() => transitionToStep(2)}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-lg tracking-wider uppercase border border-antique-gold/70 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer font-bold"
                    >
                      <span>CONTINUE TO ATTENDEE DETAILS</span>
                      <ArrowRight className="w-5 h-5 text-bright-gold" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================
                STAGE 2: ATTENDEE DETAILS (2-Column on large screens)
                ================================================================ */}
            {deskStage === 'RESERVE' && currentStep === 2 && (
              <form
                ref={stage2Ref}
                onSubmit={handleValidateStep2}
                className="relative z-10"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  {/* Left Column: Attendee Form Inputs (Fill Details) */}
                  <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                    {/* Honeypot anti-spam field (hidden) */}
                    <input
                      type="text"
                      name="hp_company_field"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      className="hidden"
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block font-body text-xs font-bold uppercase tracking-wider text-bright-gold mb-1.5"
                        >
                          Full Name (Primary Attendee) *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-bright-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            id="fullName"
                            ref={fullNameInputRef}
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Ramesh Sharma"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-deep-plum/90 border border-antique-gold/30 text-warm-cream placeholder-warm-cream/30 text-base sm:text-sm font-body focus:outline-none focus:ring-2 focus:ring-bright-gold"
                          />
                        </div>
                        {errors.fullName && (
                          <span className="text-vermilion text-[11px] font-body mt-1 block">
                            {errors.fullName}
                          </span>
                        )}
                      </div>

                      {/* Mobile Phone */}
                      <div>
                        <label
                          htmlFor="phone"
                          className="block font-body text-xs font-bold uppercase tracking-wider text-bright-gold mb-1.5"
                        >
                          10-Digit Mobile Number (WhatsApp Updates) *
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-bright-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. 99315 03960"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-deep-plum/90 border border-antique-gold/30 text-warm-cream placeholder-warm-cream/30 text-base sm:text-sm font-body focus:outline-none focus:ring-2 focus:ring-bright-gold"
                          />
                        </div>
                        {errors.phone && (
                          <span className="text-vermilion text-[11px] font-body mt-1 block">
                            {errors.phone}
                          </span>
                        )}
                      </div>

                      {/* Email Address */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block font-body text-xs font-bold uppercase tracking-wider text-bright-gold mb-1.5"
                        >
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-bright-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. attendee@example.com"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-deep-plum/90 border border-antique-gold/30 text-warm-cream placeholder-warm-cream/30 text-base sm:text-sm font-body focus:outline-none focus:ring-2 focus:ring-bright-gold"
                          />
                        </div>
                        {errors.email && (
                          <span className="text-vermilion text-[11px] font-body mt-1 block">
                            {errors.email}
                          </span>
                        )}
                      </div>

                      {/* City */}
                      <div>
                        <label
                          htmlFor="city"
                          className="block font-body text-xs font-bold uppercase tracking-wider text-bright-gold mb-1.5"
                        >
                          City / Location
                        </label>
                        <input
                          id="city"
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Ranchi"
                          className="w-full px-4 py-3 rounded-xl bg-deep-plum/90 border border-antique-gold/30 text-warm-cream placeholder-warm-cream/30 text-base sm:text-sm font-body focus:outline-none focus:ring-2 focus:ring-bright-gold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Selected Pass Recap, Hold Info & Next/Continue Action */}
                  <div className="lg:col-span-5 xl:col-span-4 space-y-4 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-antique-gold/30 lg:pl-6 xl:pl-8 lg:self-stretch">
                    {/* Selected Pass Review & Summary Ledger Card */}
                    <div className="rounded-2xl bg-royal-maroon/95 border-2 border-antique-gold/50 shadow-2xl overflow-hidden text-warm-cream">
                      {/* Review Card Header with Change Tier Action */}
                      <div className="px-5 py-3.5 bg-deep-plum/90 border-b border-antique-gold/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-bright-gold" />
                          <span className="text-[11px] font-bold tracking-widest text-bright-gold uppercase font-body">
                            PASS REVIEW &amp; SUMMARY
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => transitionToStep(1)}
                          className="text-[10px] text-bright-gold/90 hover:text-white underline cursor-pointer font-body uppercase tracking-wider font-bold"
                        >
                          Change Tier
                        </button>
                      </div>

                      {/* Pass Identification Block */}
                      <div className="p-5 space-y-4">
                        <div className="border-b border-antique-gold/20 pb-3.5">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold tracking-widest text-bright-gold uppercase">
                              {selectedPass.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-deep-plum border border-antique-gold/30 text-[10px] font-mono text-bright-gold">
                              {selectedPass.admitCount || 1} ADMIT
                            </span>
                          </div>
                          <h4 className="font-display text-2xl text-white uppercase tracking-wide">
                            {selectedPass.name}
                          </h4>
                          <p className="font-body text-xs text-warm-cream/75 mt-1 leading-relaxed">
                            {selectedPass.description}
                          </p>
                        </div>

                        {/* Specification / Review Metadata Ledger */}
                        <div className="space-y-2.5 text-xs font-body">
                          <div className="flex items-center justify-between py-1 border-b border-dashed border-antique-gold/20">
                            <span className="text-warm-cream/60 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-amber-glow" />
                              <span>Festival Date:</span>
                            </span>
                            <span className="font-semibold text-warm-cream">16 October 2026</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-dashed border-antique-gold/20">
                            <span className="text-warm-cream/60 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-glow" />
                              <span>Time &amp; Entry:</span>
                            </span>
                            <span className="font-semibold text-warm-cream">5:00 PM Onwards</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-dashed border-antique-gold/20">
                            <span className="text-warm-cream/60 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-glow" />
                              <span>Venue:</span>
                            </span>
                            <span className="font-semibold text-warm-cream text-right">Upwan Lawn, BNR Chanakya</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-dashed border-antique-gold/20">
                            <span className="text-warm-cream/60 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-amber-glow" />
                              <span>Capacity:</span>
                            </span>
                            <span className="font-semibold text-bright-gold">
                              {selectedPass.admitCount || 1} Person{((selectedPass.admitCount || 1) > 1) ? 's' : ''} Entry
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-warm-cream/60 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-glow" />
                              <span>Taxes &amp; GST:</span>
                            </span>
                            <span className="font-semibold text-emerald-300">Included in Price</span>
                          </div>
                        </div>

                        {/* Total Financial Summary Box */}
                        <div className="p-3.5 rounded-xl bg-deep-plum/90 border border-antique-gold/40 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-warm-cream/60 uppercase font-body font-bold block tracking-wider">
                              TOTAL AMOUNT PAYABLE
                            </span>
                            <span className="text-[10px] text-warm-cream/40">Zero additional booking fees</span>
                          </div>
                          <span className="font-display text-3xl font-bold text-bright-gold">
                            ₹{selectedPass.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-deep-plum/90 border border-antique-gold/30 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-bright-gold font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>24-Hour Pass Hold</span>
                      </div>
                      <p className="text-warm-cream/70 text-[11px] leading-relaxed">
                        Your booking hold begins immediately once reserved. Complete payment at checkout or within 24 hours.
                      </p>
                    </div>

                    {/* Next Step & Back Action Buttons */}
                    <div className="space-y-2.5 pt-1">
                      <button
                        id="stage-2-submit-btn"
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-lg tracking-wider uppercase border border-antique-gold/70 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-[transform,box-shadow] duration-200 cursor-pointer font-bold"
                      >
                        <span>REVIEW RESERVATION</span>
                        <ArrowRight className="w-5 h-5 text-bright-gold" />
                      </button>

                      <button
                        type="button"
                        onClick={() => transitionToStep(1)}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-deep-plum/80 border border-antique-gold/25 text-warm-cream/80 hover:text-bright-gold text-xs font-body font-medium transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Pass Selection</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* ================================================================
                STAGE 3: REVIEW RESERVATION (2-Column on large screens)
                ================================================================ */}
            {deskStage === 'RESERVE' && currentStep === 3 && (
              <div className="relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  {/* Left Column: Ticket Summary Stub & Disclaimer */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Ticket Stub Summary */}
                    <div className="p-6 rounded-2xl bg-deep-plum/95 border border-antique-gold/40 shadow-inner relative overflow-hidden font-body text-xs">
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card-surface border border-antique-gold/40" />
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card-surface border border-antique-gold/40" />

                      <div className="border-b border-dashed border-antique-gold/30 pb-4 mb-4 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-bright-gold uppercase tracking-widest font-bold block">
                            FESTIVAL PASS
                          </span>
                          <span className="font-display text-2xl text-warm-cream tracking-wide uppercase">
                            {selectedPass.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-warm-cream/60 uppercase tracking-widest block">
                            PASSES
                          </span>
                          <span className="font-display text-2xl text-bright-gold font-bold">
                            1
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <span className="text-warm-cream/50 block text-[10px] uppercase">PRIMARY ATTENDEE</span>
                          <span className="text-warm-cream font-bold text-sm">{fullName}</span>
                        </div>
                        <div>
                          <span className="text-warm-cream/50 block text-[10px] uppercase">PHONE</span>
                          <span className="text-warm-cream font-bold text-sm">{phone}</span>
                        </div>
                        <div>
                          <span className="text-warm-cream/50 block text-[10px] uppercase">DATE &amp; TIME</span>
                          <span className="text-warm-cream font-medium">16 Oct 2026 · 5:00 PM</span>
                        </div>
                        <div>
                          <span className="text-warm-cream/50 block text-[10px] uppercase">VENUE</span>
                          <span className="text-warm-cream font-medium">Upwan Lawn, BNR Chanakya</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-dashed border-antique-gold/30 flex items-center justify-between">
                        <div>
                          <span className="font-bold uppercase tracking-wider text-warm-cream/80 block">
                            TOTAL AMOUNT:
                          </span>
                          <span className="text-[10px] text-warm-cream/60">Inclusive of applicable GST</span>
                        </div>
                        <span className="font-display text-3xl text-bright-gold font-bold">
                          ₹{totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <PassOwnershipDisclaimer className="text-left w-full" />
                  </div>

                  {/* Right Column: Verification, Policy & Submit Action */}
                  <div className="lg:col-span-6 space-y-4 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-antique-gold/30 lg:pl-6 xl:pl-8 lg:self-stretch">
                    {/* Review Header Banner */}
                    <div className="p-5 rounded-2xl bg-royal-maroon/90 border-2 border-antique-gold/50 shadow-lg text-center flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-deep-plum border border-bright-gold flex items-center justify-center text-bright-gold mb-2">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className="font-display text-2xl text-bright-gold tracking-wider uppercase">
                        REVIEW PASS RESERVATION
                      </span>
                      <p className="font-body text-xs text-warm-cream/80 max-w-md mt-1 leading-relaxed">
                        Please review your pass details. Submitting will lock your requested passes on a{' '}
                        <strong>24-hour hold</strong> and advance to the secure payment desk, where you can{' '}
                        <strong>pay now</strong> or choose <strong>Pay Later</strong> and complete payment within
                        the 24-hour deadline.
                      </p>
                      <p className="text-[11px] font-body text-antique-gold/90 mt-2">
                        By reserving this pass you agree to our{' '}
                        <Link
                          href="/terms-and-conditions"
                          target="_blank"
                          className="underline hover:text-warm-cream font-semibold"
                        >
                          Terms &amp; Conditions
                        </Link>
                        ,{' '}
                        <Link
                          href="/privacy-policy"
                          target="_blank"
                          className="underline hover:text-warm-cream font-semibold"
                        >
                          Privacy Policy
                        </Link>
                        ,{' '}
                        <Link
                          href="/refund-and-cancellation"
                          target="_blank"
                          className="underline hover:text-warm-cream font-semibold"
                        >
                          Cancellation Policy
                        </Link>{' '}
                        and all other{' '}
                        <Link href="/policies" target="_blank" className="underline hover:text-warm-cream font-semibold">
                          Policies
                        </Link>
                        .
                      </p>
                    </div>

                    {/* Submission Error Alert */}
                    {submissionStatus === 'ERROR' && (
                      <div
                        role="alert"
                        aria-live="polite"
                        className="p-5 rounded-2xl bg-vermilion/20 border-2 border-vermilion text-warm-cream font-body text-xs space-y-2.5 shadow-xl animate-fade-in"
                      >
                        <div className="flex items-center gap-2 text-vermilion font-bold text-sm">
                          <AlertCircle className="w-5 h-5 shrink-0 text-bright-gold" />
                          <span className="uppercase tracking-wider">Reservation Notice</span>
                        </div>
                        <p className="leading-relaxed text-warm-cream/95 font-medium">
                          {submissionError || 'The reservation system could not be reached right now.'}
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleSubmitBooking}
                            className="px-4 py-2 rounded-xl bg-royal-maroon hover:bg-royal-maroon/80 border border-antique-gold/60 text-bright-gold text-xs font-display font-bold tracking-wider uppercase transition-colors cursor-pointer"
                          >
                            RETRY RESERVATION
                          </button>
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-deep-plum text-xs font-display font-bold tracking-wider uppercase transition-colors inline-flex items-center gap-1.5 font-bold"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-deep-plum" />
                            <span>CONNECT ON WHATSAPP</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div ref={stage3ActionsRef} className="space-y-3">
                      <button
                        id="stage-3-submit-btn"
                        type="button"
                        onClick={handleSubmitBooking}
                        disabled={submissionStatus === 'SUBMITTING'}
                        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-vermilion text-warm-cream font-display text-xl tracking-wider uppercase border-2 border-antique-gold/80 shadow-[0_4px_24px_rgba(217,37,36,0.45)] flex items-center justify-center gap-3 transition-[transform,box-shadow] duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold"
                      >
                        {submissionStatus === 'SUBMITTING' ? (
                          <>
                            <Loader2 className="w-6 h-6 animate-spin text-bright-gold shrink-0" />
                            <span className="text-base sm:text-lg">
                              {submittingElapsedSec < 4
                                ? 'HOLDING RESERVATION IN NEON...'
                                : 'CONNECTING ACROSS NETWORK... PLEASE WAIT'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 text-bright-gold" />
                            <span>RESERVE PASS &amp; PROCEED TO PAYMENT</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => transitionToStep(2)}
                          disabled={submissionStatus === 'SUBMITTING'}
                          className="inline-flex items-center gap-2 text-xs text-bright-gold/80 hover:text-bright-gold underline cursor-pointer font-body disabled:opacity-50"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Edit Attendee Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => transitionToStep(1)}
                          disabled={submissionStatus === 'SUBMITTING'}
                          className="text-xs text-warm-cream/60 hover:text-bright-gold cursor-pointer font-body disabled:opacity-50"
                        >
                          Change Pass Tier
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================
                DEDICATED PAYMENT STAGE (2-Column on large screens)
                ================================================================ */}
            {(deskStage === 'PAYMENT' || deskStage === 'PAYMENT_PENDING' || deskStage === 'PAYMENT_FAILED') && submittedRecord && (
              <div id="payment-stage-card" ref={paymentStageRef} className="relative z-10 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  {/* Left Column: Expiry & Hold Status Placard & Breakdown */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className={`p-5 rounded-2xl border-2 shadow-xl ${
                      deskStage === 'PAYMENT_FAILED'
                        ? 'bg-vermilion/20 border-vermilion text-warm-cream'
                        : deskStage === 'PAYMENT_PENDING'
                        ? 'bg-royal-maroon/90 border-amber-glow text-warm-cream'
                        : 'bg-royal-maroon/95 border-antique-gold/60 text-warm-cream'
                    }`}>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-antique-gold/30 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 rounded-full bg-deep-plum border border-bright-gold/50 font-mono text-xs text-bright-gold font-bold flex items-center gap-1.5">
                            <span>ID: {submittedRecord.bookingId}</span>
                            <button
                              id="copy-booking-id-btn"
                              type="button"
                              onClick={() => handleCopyBookingId(submittedRecord.bookingId)}
                              className="hover:text-white cursor-pointer ml-1"
                              title="Copy Booking ID"
                            >
                              {copiedBookingId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-bright-gold">
                          <Clock className="w-4 h-4 text-bright-gold animate-pulse" />
                          <span>
                            {remainingTime.isExpired
                              ? 'RESERVATION EXPIRED'
                              : `HELD FOR ${remainingTime.hours}h ${remainingTime.minutes}m ${remainingTime.seconds}s`}
                          </span>
                        </div>
                      </div>

                      {/* Exact 24-hour payment deadline */}
                      {paymentDeadlineDisplay && (
                        <div
                          id="payment-deadline"
                          className="mb-3 p-3 rounded-xl bg-deep-plum/80 border border-antique-gold/40 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                        >
                          <span className="text-warm-cream/70 uppercase tracking-wider text-[10px] font-bold">
                            Payment deadline (24-hour hold)
                          </span>
                          <span className="font-mono font-bold text-bright-gold">{paymentDeadlineDisplay}</span>
                        </div>
                      )}

                      {deskStage === 'PAYMENT_FAILED' && (
                        <div id="payment-failed-banner" className="mb-3 p-3 rounded-xl bg-vermilion/30 border border-vermilion text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-bright-gold">
                            <AlertTriangle className="w-4 h-4 text-bright-gold" />
                            <span>PAYMENT ATTEMPT NOT COMPLETED</span>
                          </div>
                          <p className="text-warm-cream/90">
                            {paymentError || 'Your payment attempt was declined or cancelled. Your reservation is still held — you can retry before the deadline above.'}
                          </p>
                        </div>
                      )}

                      {deskStage === 'PAYMENT_PENDING' && !remainingTime.isExpired && (
                        <div id="payment-pending-banner" className="mb-3 p-3 rounded-xl bg-deep-plum/80 border border-antique-gold/40 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-bright-gold">
                            <Clock className="w-4 h-4 text-bright-gold" />
                            <span>PAYMENT PENDING — PAY LATER ACTIVE</span>
                          </div>
                          <p className="text-warm-cream/80">
                            Your booking is reserved but not yet paid. Payment must be completed within 24 hours of
                            booking (deadline above). If payment is not completed before the deadline, the booking
                            expires and the reserved pass is released.
                          </p>
                        </div>
                      )}

                      {remainingTime.isExpired && (
                        <div id="payment-expired-banner" className="mb-3 p-3 rounded-xl bg-vermilion/25 border border-vermilion text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-bright-gold">
                            <AlertTriangle className="w-4 h-4 text-bright-gold" />
                            <span>BOOKING EXPIRED</span>
                          </div>
                          <p className="text-warm-cream/90">
                            This booking expired because payment was not completed within 24 hours. The reserved pass
                            has been released and this booking cannot be paid or revived.
                          </p>
                          <p className="text-warm-cream/80">
                            No refund applies because no payment was collected. You can start a new reservation below.
                          </p>
                        </div>
                      )}

                      {/* Pass & Attendee Breakdown */}
                      <div className="space-y-2 text-xs font-body">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-warm-cream/60 uppercase">PASS TIER:</span>
                          <span className="font-bold text-warm-cream uppercase">{submittedRecord.passType}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-warm-cream/60 uppercase">QUANTITY:</span>
                          <span className="font-bold text-bright-gold">{submittedRecord.quantity} Pass{submittedRecord.quantity > 1 ? 'es' : ''}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-warm-cream/60 uppercase">ATTENDEE:</span>
                          <span className="font-medium text-warm-cream/90">{submittedRecord.fullName} ({submittedRecord.phone})</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-warm-cream/60 uppercase">PAYMENT STATUS:</span>
                          <span className={`font-bold uppercase ${
                            deskStage === 'PAYMENT_FAILED'
                              ? 'text-vermilion'
                              : deskStage === 'PAYMENT_PENDING'
                              ? 'text-amber-glow'
                              : 'text-warm-cream/80'
                          }`}>
                            {deskStage === 'PAYMENT_FAILED'
                              ? 'FAILED (RETRY AVAILABLE)'
                              : deskStage === 'PAYMENT_PENDING'
                              ? 'PENDING (HOLD ACTIVE)'
                              : submittedRecord.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Authoritative Server Total Display */}
                      <div className="mt-4 pt-4 border-t-2 border-dashed border-antique-gold/40 flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-bright-gold tracking-wider">
                            AMOUNT PAYABLE (AUTHORITATIVE)
                          </span>
                          <span className="text-[11px] text-warm-cream/60">
                            Zero extra convenience fees
                          </span>
                        </div>
                        <span className="font-display text-3xl sm:text-4xl text-bright-gold font-bold">
                          ₹{submittedRecord.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="p-4 rounded-xl bg-deep-plum/70 border border-antique-gold/25 text-[11px] text-warm-cream/70 text-center space-y-1">
                      <div className="flex items-center justify-center gap-2 text-bright-gold font-bold">
                        <ShieldCheck className="w-4 h-4 text-bright-gold" />
                        <span>256-BIT SSL SECURE CHECKOUT</span>
                      </div>
                      <p>All payments are securely handled via Razorpay or PhonePe with instant ticket issuance.</p>
                    </div>
                  </div>

                  {/* Right Column: Payment Actions, Pay Later, WhatsApp Helpline */}
                  <div className="lg:col-span-6 space-y-3 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-antique-gold/30 lg:pl-6 xl:pl-8 lg:self-stretch">
                    {!remainingTime.isExpired && (
                      <div className="space-y-3">
                        <button
                          id={deskStage === 'PAYMENT_PENDING' || deskStage === 'PAYMENT_FAILED' ? 'payment-retry-btn' : 'payment-stage-pay-btn'}
                          data-testid="payment-stage-pay-btn"
                          type="button"
                          onClick={handlePayNow}
                          disabled={isInitiatingPayment}
                          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-vermilion text-warm-cream font-display text-xl tracking-wider uppercase border-2 border-antique-gold/80 shadow-[0_4px_24px_rgba(217,37,36,0.5)] flex items-center justify-center gap-3 transition-[transform,box-shadow] duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold"
                        >
                          {isInitiatingPayment && initiatingGateway === 'razorpay' ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin text-bright-gold shrink-0" />
                              <span>OPENING SECURE CHECKOUT...</span>
                            </>
                          ) : deskStage === 'PAYMENT_PENDING' ? (
                            <>
                              <Lock className="w-5 h-5 text-bright-gold" />
                              <span>PAY WITH RAZORPAY (₹{submittedRecord.total.toLocaleString('en-IN')})</span>
                            </>
                          ) : deskStage === 'PAYMENT_FAILED' ? (
                            <>
                              <Lock className="w-5 h-5 text-bright-gold" />
                              <span>TRY WITH RAZORPAY (₹{submittedRecord.total.toLocaleString('en-IN')})</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-5 h-5 text-bright-gold" />
                              <span>PAY NOW ₹{submittedRecord.total.toLocaleString('en-IN')} WITH RAZORPAY</span>
                            </>
                          )}
                        </button>

                        <button
                          id="phonepe-pay-btn"
                          data-testid="phonepe-pay-btn"
                          type="button"
                          onClick={handlePayPhonePe}
                          disabled={isInitiatingPayment}
                          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#5f259f] via-[#7b2cbf] to-[#5f259f] text-warm-cream font-display text-xl tracking-wider uppercase border-2 border-antique-gold/80 shadow-[0_4px_24px_rgba(95,37,159,0.5)] flex items-center justify-center gap-3 transition-[transform,box-shadow] duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold"
                        >
                          {isInitiatingPayment && initiatingGateway === 'phonepe' ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin text-bright-gold shrink-0" />
                              <span>OPENING PHONEPE CHECKOUT...</span>
                            </>
                          ) : deskStage === 'PAYMENT_PENDING' || deskStage === 'PAYMENT_FAILED' ? (
                            <>
                              <Lock className="w-5 h-5 text-bright-gold" />
                              <span>PAY WITH PHONEPE (₹{submittedRecord.total.toLocaleString('en-IN')})</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-5 h-5 text-bright-gold" />
                              <span>PAY NOW ₹{submittedRecord.total.toLocaleString('en-IN')} WITH PHONEPE</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Pay Later — keep the booking pending and pay within 24 hours */}
                    {deskStage === 'PAYMENT' && !remainingTime.isExpired && (
                      <>
                        <button
                          id="pay-later-btn"
                          type="button"
                          onClick={() => setDeskStage('PAYMENT_PENDING')}
                          className="w-full py-3.5 px-6 rounded-xl bg-deep-plum border-2 border-antique-gold/60 text-warm-cream font-display text-base tracking-wider uppercase flex items-center justify-center gap-2 transition-colors hover:border-bright-gold cursor-pointer font-bold"
                        >
                          <Clock className="w-5 h-5 text-bright-gold shrink-0" />
                          <span>PAY LATER — COMPLETE WITHIN 24 HOURS</span>
                        </button>
                        <p className="text-[11px] text-warm-cream/70 text-center font-body leading-relaxed">
                          Pay Later keeps this booking pending (no entry QR is issued until payment is confirmed).
                          Your payment deadline is fixed at booking and does not restart if you revisit or retry.
                        </p>
                      </>
                    )}

                    {remainingTime.isExpired && (
                      <button
                        id="start-new-reservation-btn"
                        type="button"
                        onClick={handleStartNewReservation}
                        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-lg tracking-wider uppercase border border-antique-gold/70 cursor-pointer font-bold"
                      >
                        <span>START A NEW RESERVATION</span>
                      </button>
                    )}

                    {/* Policy links */}
                    <p
                      id="payment-policy-links"
                      className="text-[11px] text-warm-cream/70 text-center font-body leading-relaxed"
                    >
                      By paying you agree to the{' '}
                      <Link href="/terms-and-conditions" target="_blank" className="text-bright-gold underline hover:text-warm-cream">
                        Terms &amp; Conditions
                      </Link>,{' '}
                      <Link href="/refund-and-cancellation" target="_blank" className="text-bright-gold underline hover:text-warm-cream">
                        Cancellation &amp; Refund Policy
                      </Link>,{' '}
                      <Link href="/faq" target="_blank" className="text-bright-gold underline hover:text-warm-cream">
                        FAQ
                      </Link>{' '}
                      and{' '}
                      <Link href="/policies" target="_blank" className="text-bright-gold underline hover:text-warm-cream">
                        Policies
                      </Link>.
                    </p>

                    {/* Secondary Coordinator Assistance */}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-6 rounded-xl bg-[#25D366]/90 hover:bg-[#25D366] text-deep-plum font-display text-sm tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-colors font-bold"
                    >
                      <MessageCircle className="w-4 h-4 fill-deep-plum" />
                      <span>NEED ASSISTANCE? CONNECT ON WHATSAPP</span>
                    </a>

                    {/* Reset / Change Pass Option */}
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={handleStartNewReservation}
                        className="text-xs text-warm-cream/50 hover:text-bright-gold underline cursor-pointer font-body"
                      >
                        Cancel hold &amp; start new reservation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================
                INTERMEDIATE CONFIRMING / PROCESSING STATE
                ================================================================ */}
            {deskStage === 'CONFIRMING' && (
              <div
                ref={confirmingRef}
                className="relative z-10 max-w-lg mx-auto p-6 sm:p-8 rounded-3xl bg-royal-maroon/95 border-2 border-bright-gold shadow-2xl text-center space-y-5 animate-fade-in"
              >
                {!pollingTimedOut ? (
                  <>
                    <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-antique-gold/30 animate-ping opacity-30" />
                      <Loader2 className="w-12 h-12 animate-spin text-bright-gold" />
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-deep-plum border border-bright-gold/40 text-bright-gold font-body text-[11px] font-bold uppercase tracking-wider mb-2">
                        <Clock className="w-3.5 h-3.5 text-bright-gold" />
                        <span>PAYMENT VERIFICATION IN PROGRESS</span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl text-warm-cream tracking-wider uppercase mb-1">
                        CONFIRMING YOUR PAYMENT...
                      </h3>
                      <p className="font-body text-xs sm:text-sm text-warm-cream/80 leading-relaxed">
                        Verifying transaction authorization with banking gateway and locking your official festival admission passes in Neon.
                      </p>
                    </div>

                    {(submittedRecord || initialBookingId) && (
                      <div className="p-4 rounded-xl bg-deep-plum/90 border border-antique-gold/40 text-xs font-mono text-bright-gold space-y-1">
                        <div>BOOKING ID: {submittedRecord?.bookingId || initialBookingId}</div>
                        {submittedRecord?.total ? (
                          <div>AMOUNT: ₹{submittedRecord.total.toLocaleString('en-IN')}</div>
                        ) : null}
                        {pollingAttempts > 0 && (
                          <div className="text-[11px] text-warm-cream/60 font-body">
                            Verifying status (Attempt {pollingAttempts} of 10)...
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-[11px] font-body text-warm-cream/60 italic">
                      *Please do not close or refresh this browser window while verification is in progress.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-amber-glow/20 border-2 border-bright-gold flex items-center justify-center mx-auto text-bright-gold">
                      <Clock className="w-8 h-8 text-bright-gold" />
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-deep-plum border border-bright-gold/40 text-bright-gold font-body text-[11px] font-bold uppercase tracking-wider mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-bright-gold" />
                        <span>PAYMENT PROCESSING</span>
                      </div>
                      <h3 className="font-display text-2xl sm:text-3xl text-warm-cream tracking-wider uppercase mb-1">
                        CONFIRMATION STILL IN PROGRESS
                      </h3>
                      <p className="font-body text-xs sm:text-sm text-warm-cream/80 leading-relaxed">
                        Your payment was submitted online, but banking confirmation is taking a few moments to sync with our database. Your 24-hour pass reservation remains safely active.
                      </p>
                    </div>

                    {(submittedRecord || initialBookingId) && (
                      <div className="p-4 rounded-xl bg-deep-plum/90 border border-antique-gold/40 text-xs font-mono text-bright-gold space-y-1 text-left">
                        <div className="flex justify-between">
                          <span className="text-warm-cream/60 font-body">BOOKING ID:</span>
                          <span>{submittedRecord?.bookingId || initialBookingId}</span>
                        </div>
                        {submittedRecord?.passType && (
                          <div className="flex justify-between">
                            <span className="text-warm-cream/60 font-body">PASS:</span>
                            <span>{submittedRecord.passType} ({submittedRecord.quantity})</span>
                          </div>
                        )}
                        {submittedRecord?.total && (
                          <div className="flex justify-between">
                            <span className="text-warm-cream/60 font-body">AMOUNT:</span>
                            <span>₹{submittedRecord.total.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const target = submittedRecord?.bookingId || initialBookingId;
                          if (target) pollBookingConfirmation(target, 5);
                        }}
                        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-vermilion via-amber-glow to-vermilion text-warm-cream font-display text-base tracking-wider uppercase border border-antique-gold/80 shadow-lg flex items-center justify-center gap-2 cursor-pointer font-bold hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <RefreshCw className="w-4 h-4 text-bright-gold" />
                        <span>CHECK CONFIRMATION STATUS</span>
                      </button>

                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-6 rounded-xl bg-[#25D366]/90 hover:bg-[#25D366] text-deep-plum font-display text-xs sm:text-sm tracking-wider uppercase shadow-md flex items-center justify-center gap-2 font-bold"
                      >
                        <MessageCircle className="w-4 h-4 fill-deep-plum" />
                        <span>CONFIRM VIA WHATSAPP WITH EVENT DESK</span>
                      </a>

                      {submittedRecord && (
                        <button
                          type="button"
                          onClick={() => setDeskStage('PAYMENT_PENDING')}
                          className="text-xs text-warm-cream/60 hover:text-bright-gold underline cursor-pointer font-body pt-1"
                        >
                          View 24-hour reservation hold details
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ================================================================
                SUCCESS STATE: CONFIRMED BOOKING RECEIPT (2-Column on large screens)
                ================================================================ */}
            {deskStage === 'SUCCESS' && submittedRecord && (
              <div id="confirmed-receipt-document" ref={successBoxRef} className="relative z-10 w-full animate-fade-in">
                <BookingReceipt
                  bookingId={submittedRecord.bookingId}
                  passType={submittedRecord.passType}
                  quantity={submittedRecord.quantity}
                  unitPrice={submittedRecord.unitPrice}
                  total={submittedRecord.total}
                  fullName={submittedRecord.fullName}
                  phone={submittedRecord.phone}
                  email={submittedRecord.email}
                  city={submittedRecord.city}
                  timestamp={submittedRecord.timestamp}
                  status={submittedRecord.status}
                  paymentStatus={submittedRecord.paymentStatus}
                  expiresAt={submittedRecord.expiresAt}
                  cancelledAt={submittedRecord.cancelledAt}
                  refundBreakdown={submittedRecord.refundBreakdown}
                  entryToken={submittedRecord.entryToken}
                  onNewEnquiry={() => {
                    setDeskStage('RESERVE');
                    setCurrentStep(1);
                    setSubmittedRecord(null);
                    setSubmissionStatus('IDLE');
                    if (typeof window !== 'undefined') {
                      window.history.replaceState(null, '', window.location.pathname);
                    }
                  }}
                  onProceedToPayment={() => {
                    setDeskStage('PAYMENT');
                  }}
                />
                <BookingReceiptPrint record={submittedRecord} />
              </div>
            )}
      </div>
    </div>
  );
}
