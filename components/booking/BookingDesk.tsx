'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { eventData, PassTier } from '@/data/eventData';
import { isReducedMotion } from '@/components/animations/interiorAnimations';
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
} from 'lucide-react';
import BookingReceipt from './BookingReceipt';
import BookingReceiptPrint, { SubmittedBookingRecord } from './BookingReceiptPrint';

export type { SubmittedBookingRecord };

interface BookingDeskProps {
  initialPassId?: string;
}

type SubmissionState = 'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR';

export default function BookingDesk({ initialPassId }: BookingDeskProps = {}) {
  // Stage state: 1 = Select Pass, 2 = Attendee Info, 3 = Review & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Stable Component & Stage Shell Refs
  const bookingDeskRef = useRef<HTMLDivElement>(null);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const stageIndicatorRef = useRef<HTMLDivElement>(null);
  const stage1Ref = useRef<HTMLDivElement>(null);
  const stage2Ref = useRef<HTMLFormElement>(null);
  const stage3ActionsRef = useRef<HTMLDivElement>(null);
  const successBoxRef = useRef<HTMLDivElement>(null);

  // Submission State Machine
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionState>('IDLE');
  const [submissionResult, setSubmissionResult] = useState<BookingSubmissionResponse | null>(null);
  const [submissionError, setSubmissionError] = useState<string>('');
  const [submittedRecord, setSubmittedRecord] = useState<SubmittedBookingRecord | null>(null);
  const [sessionRequestId, setSessionRequestId] = useState<string>('');
  const [submittingElapsedSec, setSubmittingElapsedSec] = useState<number>(0);

  // Form selections
  const validInitialId = eventData.passes.some((p) => p.id === initialPassId)
    ? initialPassId!
    : eventData.passes[0].id;

  const [selectedPassId, setSelectedPassId] = useState<string>(validInitialId);
  const [quantity, setQuantity] = useState<number>(1);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [city, setCity] = useState<string>('Ranchi');
  const [honeypot, setHoneypot] = useState<string>('');
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string; email?: string }>({});

  const selectedPass: PassTier =
    eventData.passes.find((p) => p.id === selectedPassId) || eventData.passes[0];

  const totalAmount = selectedPass.price * quantity;

  // Controlled Stage Transition: preserves the booking desk's document-top anchor
  // and positions viewport naturally if the user was scrolled far past the desk
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

    // After DOM commit: compensate scroll position to keep booking desk anchored
    requestAnimationFrame(() => {
      if (!bookingDeskRef.current) return;
      const newRect = bookingDeskRef.current.getBoundingClientRect();
      const newDocTop = newRect.top + window.scrollY;
      const lenis = typeof window !== 'undefined' ? (window as any).lenis : null;

      // If user scrolled past the desk top (e.g. after scrolling through tall pass list in Stage 1)
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

  // Stage Indicator Entrance on initial mount
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

  // Stage Transitions (1 -> 2 -> 3): restrained in-place opacity transitions
  // NO translateY or scale shifts to prevent viewport jumping
  useEffect(() => {
    if (isReducedMotion()) return;

    if (currentStep === 1 && stage1Ref.current) {
      gsap.fromTo(
        stage1Ref.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power1.out' }
      );
    } else if (currentStep === 2 && stage2Ref.current) {
      gsap.fromTo(
        stage2Ref.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power1.out' }
      );
      // Programmatic keyboard focus: strictly preventScroll to avoid browser jump
      if (fullNameInputRef.current) {
        fullNameInputRef.current.focus({ preventScroll: true });
      }
    } else if (currentStep === 3 && stage3ActionsRef.current) {
      gsap.fromTo(
        stage3ActionsRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power1.out' }
      );
    }
  }, [currentStep]);

  // Success State In-Place Fade Reveal
  useEffect(() => {
    if (isReducedMotion()) return;
    if (submissionStatus === 'SUCCESS' && successBoxRef.current) {
      gsap.fromTo(
        successBoxRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: 'power1.out' }
      );
    }
  }, [submissionStatus]);

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

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
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

  // Track submission duration for progressive status feedback on slow networks (2G/3G)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (submissionStatus === 'SUBMITTING') {
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

  // Step 3 Submission Handler with Duplicate-Click Protection & Stable Request ID across Retries
  const handleSubmitBooking = async () => {
    if (submissionStatus === 'SUBMITTING') return; // Prevent duplicate clicks

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
      quantity,
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
      quantity,
      unitPrice: selectedPass.price,
      total: totalAmount,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || 'N/A',
      city: city.trim() || 'Ranchi',
      bookingId,
      timestamp,
      hp_company_field: honeypot, // Honeypot anti-spam
    };

    try {
      const response = await submitBookingRequest(payload);
      if (response.success) {
        const verifiedRecord: SubmittedBookingRecord = {
          ...record,
          bookingId: response.bookingId || bookingId,
          unitPrice: response.unitPrice ?? record.unitPrice,
          total: response.total ?? record.total,
        };
        setSubmittedRecord(verifiedRecord);
        setSubmissionResult(response);
        setSubmissionStatus('SUCCESS');

        // Natural viewport alignment to top of booking desk if desk was scrolled off-screen
        requestAnimationFrame(() => {
          if (!bookingDeskRef.current) return;
          const rect = bookingDeskRef.current.getBoundingClientRect();
          if (rect.top < 0) {
            const masthead = typeof document !== 'undefined' ? document.getElementById('main-masthead') : null;
            const mastheadHeight = masthead ? masthead.offsetHeight : 80;
            const targetY = Math.max(0, rect.top + window.scrollY - mastheadHeight - 16);
            const lenis = typeof window !== 'undefined' ? (window as any).lenis : null;
            if (lenis) {
              lenis.scrollTo(targetY, { immediate: true });
            } else {
              window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
            }
          }
        });
      } else {
        setSubmissionError(response.error || 'Unable to record your booking request in the reservation sheet.');
        setSubmissionStatus('ERROR');
      }
    } catch (err: unknown) {
      setSubmissionError(
        err instanceof Error ? err.message : 'Network error occurred while connecting to the reservation sheet.'
      );
      setSubmissionStatus('ERROR');
    }
  };

  // Standardized WhatsApp Message payload for both Fallback and Expedite actions
  const activeBookingId = submittedRecord?.bookingId || submissionResult?.bookingId || 'RU26-REQ-PENDING';
  const whatsappMessage = `*RAAS UTSAV 2026 — BOOKING REQUEST*\nRequest ID: ${activeBookingId}\nOrganizer: Event Point\nVenue: Upwan Lawn, Chanakya BNR Hotel, Ranchi\nDate: 16 October 2026 (5:00 PM – 11:00 PM)\n\n*BOOKING DETAILS:*\n• Pass Type: ${selectedPass.name}\n• Quantity: ${quantity}\n• Unit Price: ₹${selectedPass.price}\n• Total Amount: ₹${totalAmount.toLocaleString('en-IN')}\n\n*ATTENDEE DETAILS:*\n• Name: ${fullName}\n• Mobile / WhatsApp: ${phone}\n• Email: ${email || 'N/A'}\n• City: ${city || 'Ranchi'}\n\nPlease review my booking request and share pass confirmation instructions.`;

  const primaryPhone = eventData.contacts.phones[0].replace(/\D/g, '');
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${primaryPhone}&text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div
      id="booking-desk"
      ref={bookingDeskRef}
      style={{ overflowAnchor: 'none' }}
      className="relative w-full max-w-4xl mx-auto rounded-3xl bg-card-surface border-2 border-antique-gold/40 shadow-2xl p-6 sm:p-10 overflow-hidden"
    >
      {/* Devotional Ambient Radial Glow */}
      <div
        className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(217,37,36,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(243,198,76,0.10) 0%, transparent 70%)' }}
      />

      {/* Box Office Header */}
      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-royal-maroon/80 border border-antique-gold/40 text-bright-gold text-xs font-semibold tracking-widest uppercase mb-3 shadow-md">
          <span className="text-vermilion text-xs" aria-hidden="true">♦</span>
          <span>OFFICIAL FESTIVAL ENQUIRY DESK</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-warm-cream tracking-wide uppercase">
          RESERVE YOUR FESTIVAL PASS
        </h2>
        <p className="font-body text-xs sm:text-sm text-warm-cream/75 max-w-lg mx-auto mt-2">
          Direct desk reservation for {eventData.eventName} at {eventData.venueDisplay}. Follow the 3 quick steps below to record your pass enquiry.
        </p>

        {/* 3 Step Indicator */}
        <div ref={stageIndicatorRef} className="flex items-center justify-center gap-2 sm:gap-4 mt-6 max-w-md mx-auto">
          {[
            { step: 1, title: '1. Select Pass' },
            { step: 2, title: '2. Attendee Details' },
            { step: 3, title: '3. Submit Request' },
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;
            return (
              <div
                key={item.step}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center font-body text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream shadow-md'
                    : isCompleted
                    ? 'bg-royal-maroon/90 text-bright-gold border border-antique-gold/40'
                    : 'bg-deep-plum/60 text-warm-cream/40 border border-antique-gold/15'
                }`}
              >
                {item.title}
              </div>
            );
          })}
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
        {/* ====================================================================
            STAGE 1: SELECT PASS & QUANTITY
            ==================================================================== */}
        {currentStep === 1 && (
          <div ref={stage1Ref} className="relative z-10 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {eventData.passes.map((pass) => {
                const isSelected = selectedPassId === pass.id;
                return (
                  <div
                    key={pass.id}
                    onClick={() => setSelectedPassId(pass.id)}
                    className={`stage-1-pass-card relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-royal-maroon/90 border-bright-gold shadow-[0_4px_24px_rgba(243,198,76,0.3)] scale-[1.02]'
                        : 'bg-deep-plum/80 border-antique-gold/30 hover:border-antique-gold/60 hover:bg-deep-plum'
                    }`}
                  >
                    {pass.badge && (
                      <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-antique-gold/60 shadow-sm">
                        {pass.badge}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Ticket className={`w-4 h-4 ${isSelected ? 'text-bright-gold' : 'text-antique-gold/60'}`} />
                        <h3 className="font-display text-xl sm:text-2xl text-warm-cream uppercase tracking-wide">
                          {pass.name}
                        </h3>
                      </div>
                      <p className="font-body text-xs text-warm-cream/70 mb-4 line-clamp-2">
                        {pass.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-antique-gold/20 flex items-baseline justify-between">
                      <div>
                        <span className="font-display text-2xl text-bright-gold font-bold">
                          {pass.priceDisplay}
                        </span>
                        <span className="text-[10px] text-warm-cream/50 ml-1 font-body">/ pass</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-bright-gold bg-bright-gold text-deep-plum' : 'border-antique-gold/40'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quantity Selector */}
            <div className="p-4 sm:p-5 rounded-2xl bg-deep-plum/90 border border-antique-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="font-display text-lg text-warm-cream uppercase tracking-wide block">
                  Number of Attendees / Passes
                </span>
                <span className="font-body text-xs text-warm-cream/60">
                  Selected: {selectedPass.name} ({selectedPass.priceDisplay} each)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-xl bg-royal-maroon border border-antique-gold/40 text-warm-cream hover:text-bright-gold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg cursor-pointer"
                >
                  -
                </button>
                <span className="font-display text-2xl text-bright-gold w-8 text-center font-bold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  disabled={quantity >= 20}
                  className="w-10 h-10 rounded-xl bg-royal-maroon border border-antique-gold/40 text-warm-cream hover:text-bright-gold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total & Continue */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-antique-gold/20">
              <div>
                <span className="text-[11px] font-body text-warm-cream/60 uppercase tracking-widest block">
                  ESTIMATED PASS TOTAL:
                </span>
                <div className="font-display text-3xl text-bright-gold font-bold">
                  ₹{totalAmount.toLocaleString('en-IN')}
                  <span className="text-xs font-body font-normal text-warm-cream/60 ml-2">
                    ({quantity} {quantity === 1 ? 'pass' : 'passes'})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => transitionToStep(2)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-lg tracking-wider uppercase border border-antique-gold/70 shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-[transform,box-shadow] duration-200 cursor-pointer font-bold"
              >
                <span>ENTER ATTENDEE DETAILS</span>
                <ArrowRight className="w-5 h-5 text-bright-gold" />
              </button>
            </div>
          </div>
        )}

      {/* ====================================================================
          STAGE 2: ATTENDEE DETAILS
          ==================================================================== */}
      {currentStep === 2 && (
        <form ref={stage2Ref} onSubmit={handleValidateStep2} className="relative z-10 max-w-xl mx-auto space-y-4">
          {/* Honeypot anti-spam field (hidden from genuine users) */}
          <div className="hidden" aria-hidden="true">
            <input
              type="text"
              name="company_hp"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Pass Selection Summary Pill */}
          <div className="p-3.5 rounded-xl bg-royal-maroon/80 border border-antique-gold/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Ticket className="w-4 h-4 text-bright-gold shrink-0" />
              <div className="text-xs">
                <span className="text-warm-cream font-bold block">{selectedPass.name}</span>
                <span className="text-warm-cream/70 text-[11px]">Qty: {quantity} · ₹{selectedPass.price} each</span>
              </div>
            </div>
            <div className="font-display text-lg text-bright-gold font-bold">
              ₹{totalAmount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block font-body text-xs font-bold uppercase tracking-wider text-bright-gold mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-antique-gold/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={fullNameInputRef}
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-deep-plum/90 border text-warm-cream placeholder-warm-cream/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-bright-gold ${
                  errors.fullName ? 'border-vermilion' : 'border-antique-gold/30'
                }`}
              />
            </div>
            {errors.fullName && (
              <span className="text-vermilion text-[11px] font-body mt-1 block">
                {errors.fullName}
              </span>
            )}
          </div>

          {/* WhatsApp Phone */}
          <div>
            <label htmlFor="phone" className="block font-body text-xs font-bold uppercase tracking-wider text-bright-gold mb-1.5">
              WhatsApp Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-antique-gold/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9931503960"
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-deep-plum/90 border text-warm-cream placeholder-warm-cream/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-bright-gold ${
                  errors.phone ? 'border-vermilion' : 'border-antique-gold/30'
                }`}
              />
            </div>
            {errors.phone && (
              <span className="text-vermilion text-[11px] font-body mt-1 block">
                {errors.phone}
              </span>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block font-body text-xs font-bold uppercase tracking-wider text-bright-gold mb-1.5">
              Email Address (Optional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-antique-gold/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. priya@example.com"
                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-deep-plum/90 border text-warm-cream placeholder-warm-cream/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-bright-gold ${
                  errors.email ? 'border-vermilion' : 'border-antique-gold/30'
                }`}
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
            <label htmlFor="city" className="block font-body text-xs font-bold uppercase tracking-wider text-bright-gold mb-1.5">
              City / Location
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ranchi"
              className="w-full px-4 py-3 rounded-xl bg-deep-plum/90 border border-antique-gold/30 text-warm-cream placeholder-warm-cream/30 text-sm font-body focus:outline-none focus:ring-2 focus:ring-bright-gold"
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => transitionToStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-deep-plum border border-antique-gold/30 text-warm-cream/80 hover:text-bright-gold text-sm font-body font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              id="stage-2-submit-btn"
              type="submit"
              className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-vermilion to-amber-glow text-warm-cream font-display text-lg tracking-wider uppercase border border-antique-gold/70 shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-[transform,box-shadow] duration-200 cursor-pointer font-bold"
            >
              <span>REVIEW &amp; SUBMIT REQUEST</span>
              <ArrowRight className="w-5 h-5 text-bright-gold" />
            </button>
          </div>
        </form>
      )}

      {/* ====================================================================
          STAGE 3: REVIEW + SUBMIT BOOKING REQUEST (GOOGLE SHEETS WORKFLOW)
          ==================================================================== */}
      {currentStep === 3 && (
        <div className={`relative z-10 mx-auto space-y-6 ${submissionStatus === 'SUCCESS' ? 'max-w-3xl' : 'max-w-xl'}`}>
          {/* ================================================================
              SUCCESS STATE: OFFICIAL BOOKING REQUEST RECEIPT
              ================================================================ */}
          {submissionStatus === 'SUCCESS' && submittedRecord ? (
            <div ref={successBoxRef} className="animate-fade-in">
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
                onNewEnquiry={() => {
                  transitionToStep(1);
                  setSubmissionStatus('IDLE');
                  setSubmissionResult(null);
                  setSubmittedRecord(null);
                }}
              />
              <BookingReceiptPrint record={submittedRecord} />
            </div>
          ) : (
            /* ================================================================
               IDLE / SUBMITTING / ERROR STATES
               ================================================================ */
            <div className="space-y-6">
              {/* Review Placard Header */}
              <div className="p-4 rounded-2xl bg-royal-maroon/90 border-2 border-antique-gold/50 shadow-lg text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-deep-plum border border-bright-gold flex items-center justify-center text-bright-gold mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-display text-2xl text-bright-gold tracking-wider uppercase">
                  REVIEW BOOKING REQUEST
                </span>
                <p className="font-body text-xs text-warm-cream/80 max-w-md mt-1">
                  Please review your details below. Clicking submit will log your pass request directly into our event team&apos;s Google Sheets reservation desk.
                </p>
              </div>

              {/* Error Alert (if submission failed) */}
              {submissionStatus === 'ERROR' && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-5 rounded-2xl bg-vermilion/20 border-2 border-vermilion text-warm-cream font-body text-xs space-y-2.5 shadow-xl animate-fade-in"
                >
                  <div className="flex items-center gap-2 text-vermilion font-bold text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 text-bright-gold" />
                    <span className="uppercase tracking-wider">Submission Notice</span>
                  </div>
                  <p className="leading-relaxed text-warm-cream/95 font-medium">
                    {submissionError || 'The reservation sheet could not be reached right now.'}
                  </p>
                  <p className="text-[11px] text-warm-cream/80">
                    Your details and Request ID (<span className="font-mono text-bright-gold font-bold">{sessionRequestId || activeBookingId}</span>) are preserved. You can retry submission or continue directly on WhatsApp.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleSubmitBooking}
                      className="px-4 py-2 rounded-xl bg-royal-maroon hover:bg-royal-maroon/80 border border-antique-gold/60 text-bright-gold text-xs font-display font-bold tracking-wider uppercase transition-colors cursor-pointer"
                    >
                      RETRY SUBMISSION
                    </button>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-deep-plum text-xs font-display font-bold tracking-wider uppercase transition-colors inline-flex items-center gap-1.5 font-bold"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-deep-plum" />
                      <span>SEND VIA WHATSAPP</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Ticket Stub Summary */}
              <div className="p-6 rounded-2xl bg-deep-plum/95 border border-antique-gold/40 shadow-inner relative overflow-hidden font-body text-xs will-change-transform">
                {/* Cutout Notches */}
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
                      QUANTITY
                    </span>
                    <span className="font-display text-2xl text-bright-gold font-bold">
                      {quantity}
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
                  <span className="font-bold uppercase tracking-wider text-warm-cream/80">
                    ESTIMATED TOTAL:
                  </span>
                  <span className="font-display text-3xl text-bright-gold font-bold">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div ref={stage3ActionsRef} className="space-y-3">
                {/* 1. Primary Action: Submit to Google Sheet */}
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
                          ? 'RECORDING BOOKING REQUEST...'
                          : submittingElapsedSec < 10
                          ? 'CONNECTING ACROSS NETWORK... PLEASE WAIT'
                          : 'RECORDING ON SLOW NETWORK (2G/3G)... PLEASE WAIT'}
                      </span>
                    </>
                  ) : submissionStatus === 'ERROR' ? (
                    <>
                      <RefreshCw className="w-5 h-5 text-bright-gold" />
                      <span>TRY AGAIN</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-bright-gold" />
                      <span>SUBMIT BOOKING REQUEST</span>
                    </>
                  )}
                </button>

                {/* 2. WhatsApp Fallback */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#25D366]/90 hover:bg-[#25D366] text-white font-display text-base tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-colors font-bold"
                >
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span>{submissionStatus === 'ERROR' ? 'CONTINUE ON WHATSAPP' : 'OR CONNECT VIA WHATSAPP'}</span>
                </a>

                {/* Back to Edit Button */}
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
                    Change Pass
                  </button>
                </div>
              </div>

              {/* Scope & Reassurance Disclaimer */}
              <div className="text-center pt-1">
                <p className="font-body text-[11px] text-warm-cream/60 leading-relaxed italic">
                  *Notice: Submitting records an enquiry request in the event team&apos;s reservation sheet. No payment was deducted. Pass confirmation and official wristband collection details will be coordinated directly by Event Point coordinators.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
