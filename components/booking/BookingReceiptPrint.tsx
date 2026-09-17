'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { eventData } from '@/data/eventData';
import {
  calculateGstAndRefund,
  RefundCalculation,
  CANCELLATION_DEADLINE_DISPLAY,
} from '@/lib/cancellation-constants';

export interface SubmittedBookingRecord {
  bookingId: string;
  passId: string;
  passType: string;
  quantity: number;
  unitPrice: number;
  total: number;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  timestamp: string;
  status?: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
  paymentStatus?: 'NOT_STARTED' | 'PENDING' | 'FAILED' | 'PAID';
  expiresAt?: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  refundBreakdown?: RefundCalculation;
  entryToken?: string;
}

interface BookingReceiptPrintProps {
  record: SubmittedBookingRecord;
}

export default function BookingReceiptPrint({ record }: BookingReceiptPrintProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only mount flag gating print layout
    setMounted(true);
    document.body.classList.add('has-print-receipt');
    return () => {
      document.body.classList.remove('has-print-receipt');
    };
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  const formattedDate = record.timestamp
    ? new Date(record.timestamp).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  const refundCalc = record.status === 'CANCELLED' ? calculateGstAndRefund(record.total) : null;

  const printContent = (
    <div id="print-receipt-root" className="print-receipt-root" aria-hidden="true">
      <div className="print-card">
        {/* ============================================================== */}
        {/* DECORATIVE CORNER FLOURISHES & BACKGROUND WATERMARK           */}
        {/* ============================================================== */}
        <div className="print-corner print-corner-tl" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M0 0 L28 0 C14 0 0 14 0 28 Z" fill="#d4af37" />
            <circle cx="7" cy="7" r="3" fill="#220d1a" />
          </svg>
        </div>
        <div className="print-corner print-corner-tr" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M28 0 L0 0 C14 0 28 14 28 28 Z" fill="#d4af37" />
            <circle cx="21" cy="7" r="3" fill="#220d1a" />
          </svg>
        </div>
        <div className="print-corner print-corner-bl" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M0 28 L28 28 C14 28 0 14 0 0 Z" fill="#d4af37" />
            <circle cx="7" cy="21" r="3" fill="#220d1a" />
          </svg>
        </div>
        <div className="print-corner print-corner-br" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M28 28 L0 28 C14 28 28 14 28 0 Z" fill="#d4af37" />
            <circle cx="21" cy="21" r="3" fill="#220d1a" />
          </svg>
        </div>

        {/* High-Resolution Dancer Watermark Artwork across background */}
        <div className="print-watermark-dancers" aria-hidden="true">
          <Image
            src="/images/dancers/dancers-5-group.webp"
            alt="Garba & Dandiya Dancers Watermark"
            width={780}
            height={390}
            className="print-watermark-img"
            priority
            unoptimized
          />
        </div>

        {/* ============================================================== */}
        {/* 1. HEADER: FESTIVAL BRANDING & PASS BADGE                      */}
        {/* ============================================================== */}
        <header className="print-header">
          <div className="print-brand-row">
            <div className="print-logo-group">
              <div className="print-logo-box">
                <Image
                  src="/images/client/raascdr/web/eventpoint-logo.webp"
                  alt="Event Point Official Insignia"
                  width={76}
                  height={56}
                  className="print-logo-img"
                  priority
                  unoptimized
                />
              </div>
              <div className="print-brand-text">
                <span className="print-eyebrow">
                  ✦ {record.status === 'CONFIRMED' ? 'OFFICIAL FESTIVAL ADMISSION PASS' : 'OFFICIAL COORDINATION RECEIPT'} ✦
                </span>
                <h1 className="print-title">RAAS UTSAV 2026</h1>
                <span className="print-subtitle">
                  DANDIYA &amp; GARBA NIGHT · EVENT POINT AUTHORIZED ADMISSION
                </span>
              </div>
            </div>

            <div className="print-id-group">
              <div
                className={`print-badge ${
                  record.status === 'CONFIRMED'
                    ? 'print-badge-confirmed'
                    : record.status === 'CANCELLED'
                    ? 'print-badge-cancelled'
                    : record.status === 'EXPIRED'
                    ? 'print-badge-expired'
                    : 'print-badge-pending'
                }`}
              >
                {record.status === 'CANCELLED'
                  ? 'CANCELLED'
                  : record.status === 'CONFIRMED'
                  ? '✓ CONFIRMED PASS'
                  : record.status === 'EXPIRED'
                  ? 'EXPIRED'
                  : 'REQUEST SUBMITTED'}
              </div>
              <div className="print-req-id">{record.bookingId}</div>
              <div className="print-date">{formattedDate}</div>
            </div>
          </div>

          {/* Admission / Legal Callout Banner */}
          <div
            className={`print-disclaimer-callout ${
              record.status === 'CONFIRMED'
                ? 'print-callout-confirmed'
                : record.status === 'CANCELLED'
                ? 'print-callout-cancelled'
                : 'print-callout-pending'
            }`}
          >
            {record.status === 'CANCELLED' ? (
              <>
                <div className="print-disclaimer-title print-title-cancelled">
                  ✕ BOOKING CANCELLED — REFUND HANDLED SEPARATELY
                </div>
                <div className="print-disclaimer-body">
                  This booking has been cancelled on the website and festival pass allocation has been released back to event inventory. Refund requests and processing are handled separately via official support channels. The 18% GST included in the gross pass price is deducted from any approved refund.
                </div>
              </>
            ) : record.status === 'CONFIRMED' ? (
              <>
                <div className="print-disclaimer-title print-title-confirmed">
                  ✓ OFFICIAL CONFIRMED PASS ADMISSION STUB
                </div>
                <div className="print-disclaimer-body">
                  This receipt confirms verified payment and confirmed festival pass admission with Event Point. Present this receipt or your Request ID at the venue gate for admission.
                </div>
              </>
            ) : (
              <>
                <div className="print-disclaimer-title print-title-pending">
                  ✦ BOOKING REQUEST — NOT A CONFIRMED TICKET
                </div>
                <div className="print-disclaimer-body">
                  This receipt confirms submission of a booking request only. It is not a confirmed ticket or proof of payment. Final pass allocation and payment confirmation are handled directly through the Event Point booking system.
                </div>
              </>
            )}
          </div>
        </header>

        {/* ============================================================== */}
        {/* 2. TWO-COLUMN GRID: ATTENDEE DETAILS & PASS SPECIFICATION     */}
        {/* ============================================================== */}
        <div className="print-grid">
          {/* Column A: Attendee Details */}
          <div className="print-col print-card-box">
            <div className="print-box-header">
              <span>✦ ATTENDEE DETAILS</span>
            </div>
            <div className="print-box-content">
              <div className="print-field">
                <span className="print-label">FULL NAME</span>
                <span className="print-val-bold">{record.fullName}</span>
              </div>
              <div className="print-field">
                <span className="print-label">WHATSAPP / MOBILE</span>
                <span className="print-val-bold">{record.phone}</span>
              </div>
              <div className="print-field">
                <span className="print-label">EMAIL ADDRESS</span>
                <span className="print-val">{record.email || 'Not Provided'}</span>
              </div>
              <div className="print-field">
                <span className="print-label">CITY / LOCATION</span>
                <span className="print-val">{record.city || 'Ranchi'}</span>
              </div>
            </div>
          </div>

          {/* Column B: Pass Specification */}
          <div className="print-col print-card-box print-pass-box">
            <div className="print-box-header print-header-pass">
              <span>✦ PASS SPECIFICATION</span>
            </div>
            <div className="print-box-content">
              <div className="print-field print-pass-name-row">
                <div>
                  <span className="print-label">PASS CATEGORY</span>
                  <span className="print-val-bold print-pass-name">{record.passType}</span>
                </div>
                <div className="print-dandiya-badge">
                  <Image
                    src="/images/client/raascdr/web/dandiya-sticks.webp"
                    alt="Dandiya Sticks"
                    width={44}
                    height={44}
                    className="print-dandiya-img"
                    priority
                    unoptimized
                  />
                </div>
              </div>
              <div className="print-field-row">
                <div className="print-metric-box">
                  <span className="print-label">QUANTITY</span>
                  <span className="print-val-large">{record.quantity}</span>
                </div>
                <div className="print-metric-box">
                  <span className="print-label">UNIT PRICE</span>
                  <span className="print-val-price">₹{record.unitPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="print-total-box">
                <span className="print-total-label">
                  {record.status === 'CANCELLED' ? 'ORIGINAL AMOUNT PAID:' : 'REQUEST TOTAL:'}
                </span>
                <span className="print-total-val">₹{record.total.toLocaleString('en-IN')}</span>
              </div>
              {refundCalc && (
                <div className="print-refund-box">
                  <div>
                    <strong>GST Component (18% Deducted):</strong> -₹{refundCalc.gstFormatted}
                  </div>
                  <div className="print-refund-highlight">
                    <strong>Expected Refund Amount:</strong> ₹{refundCalc.refundFormatted}
                  </div>
                  <div className="print-refund-sub">
                    Status: Refund handled separately (not automatically credited).
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2B. ENTRY QR — CONFIRMED + PAID BOOKINGS ONLY                  */}
        {/* ============================================================== */}
        {record.status === 'CONFIRMED' && record.paymentStatus === 'PAID' && record.entryToken && (
          <div className="print-qr-block" id="print-entry-qr">
            <div className="print-qr-decor-left" aria-hidden="true" />
            <div className="print-qr-decor-right" aria-hidden="true" />
            <div className="print-qr-frame">
              <QRCodeSVG
                value={record.entryToken}
                size={116}
                level="M"
                marginSize={2}
                bgColor="#FFFFFF"
                fgColor="#220D1A"
              />
            </div>
            <div className="print-qr-text">
              <div className="print-qr-tag">✦ OFFICIAL GATE ADMISSION PASS ✦</div>
              <div className="print-qr-heading">PRESENT THIS QR CODE AT THE EVENT ENTRANCE.</div>
              <div className="print-qr-id">{record.bookingId}</div>
              <div className="print-qr-note">
                Entry is verified online at the gate by event staff. One scan admits this pass once.
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. EVENT LOGISTICS & COORDINATION CONTACTS                     */}
        {/* ============================================================== */}
        <div className="print-meta-grid">
          <div className="print-meta-col">
            <div className="print-section-title">
              <span className="print-section-bullet">✦</span> EVENT LOGISTICS
            </div>
            <div className="print-meta-item">
              <strong>DATE:</strong> 16 OCTOBER 2026
            </div>
            <div className="print-meta-item">
              <strong>TIME:</strong> 5:00 PM – 11:00 PM
            </div>
            <div className="print-meta-item">
              <strong>VENUE:</strong> UPWAN LAWN, CHANAKYA BNR HOTEL, RANCHI
            </div>
          </div>

          <div className="print-meta-col">
            <div className="print-section-title">
              <span className="print-section-bullet">✦</span> COORDINATION CONTACTS
            </div>
            <div className="print-meta-item">
              <strong>PHONE:</strong> {eventData.contacts.phones.join(' · ')}
            </div>
            <div className="print-meta-item">
              <strong>EMAIL:</strong> {eventData.contacts.emails.join(' · ')}
            </div>
            <div className="print-meta-item">
              <strong>ORGANIZER:</strong> {eventData.organizer.name} ({eventData.organizer.tagline})
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. POST-PURCHASE INSTRUCTIONS                                  */}
        {/* ============================================================== */}
        {record.status === 'CONFIRMED' && (
          <div className="print-instructions">
            <div className="print-section-title">
              <span className="print-section-bullet">✦</span> IMPORTANT INFORMATION
            </div>
            <div className="print-instruction">
              <strong>Retrieve Your Receipt:</strong> Use &ldquo;Find / Recover Reservation&rdquo; on the
              website&apos;s Find Pass page. Provide your Booking Reference ID ({record.bookingId}) with
              the email and mobile number you booked with.
            </div>
            <div className="print-instruction">
              <strong>Cancellation:</strong> Cancel through the website&apos;s booking recovery flow —
              open your confirmed booking and select &ldquo;Cancel Booking&rdquo;. Cancellation requests
              close on {CANCELLATION_DEADLINE_DISPLAY}.
            </div>
            <div className="print-instruction">
              <strong>Refund Request:</strong> Cancellation and refund are handled separately. After
              cancelling on the website, request your refund via the WhatsApp/email support contacts
              above. Approved refunds are returned to your original payment method, less the 18% GST
              included in the amount paid.
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. FORMAL FOOTER PROTOCOL                                      */}
        {/* ============================================================== */}
        <footer className="print-footer">
          <div className="print-footer-divider" />
          <p className="print-footer-text">
            Important Protocol: Pass validity is determined by the pass type, capacity, and validity of the booking/payment. The attendee name entered during booking does not by itself restrict who may use a valid pass. Cancellation is performed directly on the website; refund requests and disbursements are handled separately via official support channels.
          </p>
        </footer>
      </div>

      <style jsx global>{`
        #print-receipt-root {
          display: none;
        }

        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          #print-receipt-root {
            display: block !important;
            background: #ffffff !important;
            color: #220d1a !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: 281mm !important;
            max-height: 281mm !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            overflow: hidden !important;
          }

          .print-card {
            position: relative !important;
            width: 100% !important;
            height: 281mm !important;
            max-height: 281mm !important;
            border: 2.5pt solid #d4af37 !important;
            outline: 1pt solid #8c1d40 !important;
            outline-offset: -4pt !important;
            border-radius: 8pt !important;
            padding: 12pt 14pt !important;
            background: linear-gradient(135deg, #fffefb 0%, #fff9ee 45%, #fdf3df 100%) !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }

          /* Corner Decorative SVGs */
          .print-corner {
            position: absolute !important;
            width: 24pt !important;
            height: 24pt !important;
            z-index: 2 !important;
            pointer-events: none !important;
          }
          .print-corner-tl { top: 0; left: 0; }
          .print-corner-tr { top: 0; right: 0; }
          .print-corner-bl { bottom: 0; left: 0; }
          .print-corner-br { bottom: 0; right: 0; }

          /* Watermark Dancers Artwork */
          .print-watermark-dancers {
            position: absolute !important;
            bottom: 8pt !important;
            right: 8pt !important;
            width: 360pt !important;
            opacity: 0.16 !important;
            pointer-events: none !important;
            z-index: 0 !important;
            mix-blend-mode: multiply !important;
          }
          .print-watermark-img {
            width: 100% !important;
            height: auto !important;
            object-fit: contain !important;
            filter: saturate(1.4) sepia(0.2) !important;
          }

          /* Header Section */
          .print-header {
            position: relative !important;
            z-index: 1 !important;
            flex-shrink: 0 !important;
            display: block !important;
            background: linear-gradient(135deg, #220d1a 0%, #3a0d26 50%, #4a0e2e 100%) !important;
            border: 1.5pt solid #d4af37 !important;
            border-radius: 6pt !important;
            padding: 8pt 11pt !important;
            color: #ffffff !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            box-shadow: 0 1.5pt 3pt rgba(34, 13, 26, 0.2) !important;
          }

          .print-brand-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }

          .print-logo-group {
            display: flex !important;
            align-items: center !important;
            gap: 10pt !important;
          }

          .print-logo-box {
            width: 36pt !important;
            height: 36pt !important;
            border: 1.5pt solid #d4af37 !important;
            border-radius: 4pt !important;
            padding: 2pt !important;
            background: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .print-logo-img {
            object-fit: contain !important;
            width: 100% !important;
            height: 100% !important;
          }

          .print-brand-text {
            color: #ffffff !important;
          }

          .print-eyebrow {
            font-size: 7.5pt !important;
            font-weight: 800 !important;
            color: #f3c64c !important;
            letter-spacing: 0.12em !important;
            display: block !important;
            text-transform: uppercase !important;
            line-height: 1 !important;
          }

          .print-title {
            font-size: 19pt !important;
            font-weight: 900 !important;
            color: #fffdf8 !important;
            letter-spacing: 0.05em !important;
            margin: 1pt 0 0 0 !important;
            line-height: 1.05 !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5) !important;
          }

          .print-subtitle {
            font-size: 7.5pt !important;
            color: #f9eed3 !important;
            letter-spacing: 0.06em !important;
            display: block !important;
            margin-top: 1.5pt !important;
            line-height: 1 !important;
          }

          .print-id-group {
            text-align: right !important;
          }

          .print-badge {
            display: inline-block !important;
            padding: 3pt 8pt !important;
            font-size: 8pt !important;
            font-weight: 800 !important;
            border-radius: 3pt !important;
            letter-spacing: 0.05em !important;
            margin-bottom: 2pt !important;
            text-transform: uppercase !important;
            line-height: 1.1 !important;
          }

          .print-badge-confirmed {
            background: linear-gradient(135deg, #064e3b, #047857) !important;
            border: 1.2pt solid #34d399 !important;
            color: #ffffff !important;
          }

          .print-badge-cancelled {
            background: linear-gradient(135deg, #7f1d1d, #b91c1c) !important;
            border: 1.2pt solid #f87171 !important;
            color: #ffffff !important;
          }

          .print-badge-expired {
            background: linear-gradient(135deg, #78350f, #b45309) !important;
            border: 1.2pt solid #fbbf24 !important;
            color: #ffffff !important;
          }

          .print-badge-pending {
            background: linear-gradient(135deg, #4a0e2e, #6b1442) !important;
            border: 1.2pt solid #f3c64c !important;
            color: #f3c64c !important;
          }

          .print-req-id {
            font-family: monospace !important;
            font-size: 13pt !important;
            font-weight: 900 !important;
            color: #f3c64c !important;
            letter-spacing: 0.05em !important;
            line-height: 1.1 !important;
          }

          .print-date {
            font-size: 7.5pt !important;
            color: #e5d8b8 !important;
            line-height: 1 !important;
          }

          /* Disclaimer Callout */
          .print-disclaimer-callout {
            margin-top: 6pt !important;
            padding: 5pt 9pt !important;
            border-radius: 4pt !important;
            background: #ffffff !important;
          }

          .print-callout-confirmed {
            background: #ecfdf5 !important;
            border: 1pt solid #10b981 !important;
            border-left: 4pt solid #047857 !important;
          }

          .print-callout-cancelled {
            background: #fef2f2 !important;
            border: 1pt solid #ef4444 !important;
            border-left: 4pt solid #991b1b !important;
          }

          .print-callout-pending {
            background: #fffbeb !important;
            border: 1pt solid #f59e0b !important;
            border-left: 4pt solid #b45309 !important;
          }

          .print-disclaimer-title {
            font-size: 8.2pt !important;
            font-weight: 800 !important;
            letter-spacing: 0.04em !important;
            line-height: 1.1 !important;
          }

          .print-title-confirmed { color: #064e3b !important; }
          .print-title-cancelled { color: #7f1d1d !important; }
          .print-title-pending { color: #78350f !important; }

          .print-disclaimer-body {
            font-size: 7.2pt !important;
            color: #220d1a !important;
            line-height: 1.3 !important;
            margin-top: 1.5pt !important;
          }

          /* Two-Column Cards */
          .print-grid {
            position: relative !important;
            z-index: 1 !important;
            flex-shrink: 0 !important;
            display: flex !important;
            justify-content: space-between !important;
            gap: 12pt !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-col {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .print-card-box {
            background: #ffffff !important;
            border: 1.5pt solid #d4af37 !important;
            border-radius: 5pt !important;
            overflow: hidden !important;
            box-shadow: 0 1pt 3pt rgba(212, 175, 55, 0.15) !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .print-box-header {
            background: linear-gradient(135deg, #220d1a, #3e122b) !important;
            color: #f3c64c !important;
            font-size: 8pt !important;
            font-weight: 800 !important;
            letter-spacing: 0.1em !important;
            padding: 4pt 9pt !important;
            border-bottom: 1pt solid #d4af37 !important;
            text-transform: uppercase !important;
            flex-shrink: 0 !important;
          }

          .print-header-pass {
            background: linear-gradient(135deg, #3e122b, #5b143a) !important;
          }

          .print-box-content {
            padding: 7pt 9pt !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 4pt !important;
          }

          .print-field {
            margin-bottom: 0 !important;
          }

          .print-field-row {
            display: flex !important;
            gap: 8pt !important;
          }

          .print-metric-box {
            flex: 1 !important;
            background: #fffdf5 !important;
            border: 1pt solid #e5d8b8 !important;
            border-radius: 3.5pt !important;
            padding: 3.5pt 6pt !important;
          }

          .print-label {
            font-size: 6.8pt !important;
            color: #6b7280 !important;
            font-weight: 700 !important;
            letter-spacing: 0.06em !important;
            display: block !important;
            line-height: 1 !important;
          }

          .print-val {
            font-size: 8.8pt !important;
            color: #220d1a !important;
            line-height: 1.2 !important;
          }

          .print-val-bold {
            font-size: 9.8pt !important;
            font-weight: 800 !important;
            color: #220d1a !important;
            display: block !important;
            line-height: 1.2 !important;
          }

          .print-pass-name-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }

          .print-pass-name {
            color: #4a0e2e !important;
            font-size: 11pt !important;
            font-weight: 900 !important;
            line-height: 1.15 !important;
          }

          .print-dandiya-badge {
            width: 32pt !important;
            height: 32pt !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .print-dandiya-img {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
          }

          .print-val-large {
            font-size: 13pt !important;
            font-weight: 900 !important;
            color: #4a0e2e !important;
            line-height: 1.1 !important;
          }

          .print-val-price {
            font-size: 11pt !important;
            font-weight: 800 !important;
            color: #220d1a !important;
            line-height: 1.1 !important;
          }

          .print-total-box {
            margin-top: 2pt !important;
            padding: 5pt 8pt !important;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%) !important;
            border: 1.5pt solid #d97706 !important;
            border-radius: 4.5pt !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }

          .print-total-label {
            font-size: 8.5pt !important;
            font-weight: 800 !important;
            color: #451a03 !important;
            letter-spacing: 0.03em !important;
          }

          .print-total-val {
            font-size: 14pt !important;
            font-weight: 900 !important;
            color: #220d1a !important;
            line-height: 1 !important;
          }

          .print-refund-box {
            margin-top: 3pt !important;
            padding: 4pt 6pt !important;
            background: #fff8f8 !important;
            border: 1pt dashed #dc2626 !important;
            border-radius: 3.5pt !important;
            font-size: 7.2pt !important;
            line-height: 1.25 !important;
          }

          .print-refund-highlight {
            color: #7f1d1d !important;
            font-weight: bold !important;
          }

          .print-refund-sub {
            font-size: 6.5pt !important;
            color: #666666 !important;
            margin-top: 1pt !important;
          }

          /* QR Code VIP Admission Block */
          .print-qr-block {
            position: relative !important;
            z-index: 1 !important;
            flex-shrink: 0 !important;
            display: flex !important;
            align-items: center !important;
            gap: 14pt !important;
            padding: 8pt 14pt !important;
            border: 1.5pt dashed #d4af37 !important;
            border-radius: 6pt !important;
            background: linear-gradient(135deg, #fffdf5 0%, #fef8eb 100%) !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            box-shadow: 0 1pt 3pt rgba(212, 175, 55, 0.1) !important;
          }

          .print-qr-decor-left,
          .print-qr-decor-right {
            position: absolute !important;
            width: 12pt !important;
            height: 12pt !important;
            background: #ffffff !important;
            border: 1.5pt solid #d4af37 !important;
            border-radius: 50% !important;
            top: calc(50% - 6pt) !important;
          }
          .print-qr-decor-left { left: -7pt !important; }
          .print-qr-decor-right { right: -7pt !important; }

          .print-qr-frame {
            background: #ffffff !important;
            border: 1.5pt solid #d4af37 !important;
            border-radius: 5pt !important;
            padding: 3pt !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .print-qr-block svg {
            display: block !important;
            width: 30mm !important;
            height: 30mm !important;
          }

          .print-qr-text {
            flex: 1 !important;
          }

          .print-qr-tag {
            font-size: 7.2pt !important;
            font-weight: 800 !important;
            color: #8c1d40 !important;
            letter-spacing: 0.1em !important;
            text-transform: uppercase !important;
            line-height: 1 !important;
          }

          .print-qr-heading {
            font-size: 10pt !important;
            font-weight: 900 !important;
            color: #220d1a !important;
            letter-spacing: 0.02em !important;
            margin-top: 2pt !important;
            line-height: 1.2 !important;
          }

          .print-qr-id {
            font-family: monospace !important;
            font-size: 12pt !important;
            font-weight: 900 !important;
            color: #8c1d40 !important;
            margin-top: 1.5pt !important;
            line-height: 1.1 !important;
          }

          .print-qr-note {
            font-size: 7.5pt !important;
            color: #4b5563 !important;
            margin-top: 2.5pt !important;
            line-height: 1.3 !important;
          }

          /* Meta Grid: Logistics & Contacts */
          .print-meta-grid {
            position: relative !important;
            z-index: 1 !important;
            flex-shrink: 0 !important;
            display: flex !important;
            justify-content: space-between !important;
            gap: 12pt !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-meta-col {
            flex: 1 !important;
            background: rgba(255, 255, 255, 0.92) !important;
            border: 1pt solid #e5d8b8 !important;
            border-radius: 5pt !important;
            padding: 6pt 9pt !important;
          }

          .print-section-title {
            font-size: 8.2pt !important;
            font-weight: 800 !important;
            color: #4a0e2e !important;
            letter-spacing: 0.06em !important;
            border-bottom: 1pt solid #e5d8b8 !important;
            padding-bottom: 2pt !important;
            margin-bottom: 4pt !important;
            display: flex !important;
            align-items: center !important;
            gap: 2.5pt !important;
            text-transform: uppercase !important;
            line-height: 1.1 !important;
          }

          .print-section-bullet {
            color: #d4af37 !important;
            font-size: 7.2pt !important;
          }

          .print-meta-item {
            font-size: 7.5pt !important;
            color: #220d1a !important;
            margin-bottom: 2pt !important;
            line-height: 1.25 !important;
          }

          .print-meta-item:last-child {
            margin-bottom: 0 !important;
          }

          .print-meta-item strong {
            color: #4a0e2e !important;
            font-weight: 700 !important;
          }

          /* Post-Purchase Instructions */
          .print-instructions {
            position: relative !important;
            z-index: 1 !important;
            flex-shrink: 0 !important;
            background: #ffffff !important;
            border: 1.5pt solid #d4af37 !important;
            border-radius: 5pt !important;
            padding: 6pt 9pt !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-instruction {
            font-size: 7.2pt !important;
            color: #374151 !important;
            line-height: 1.3 !important;
            margin-bottom: 3pt !important;
          }

          .print-instruction:last-child {
            margin-bottom: 0 !important;
          }

          .print-instruction strong {
            color: #4a0e2e !important;
            font-weight: 800 !important;
          }

          /* Footer Protocol */
          .print-footer {
            position: relative !important;
            z-index: 1 !important;
            flex-shrink: 0 !important;
            text-align: center !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            padding-top: 2pt !important;
          }

          .print-footer-divider {
            height: 1.2pt !important;
            background: linear-gradient(90deg, transparent, #d4af37, #f3c64c, #d4af37, transparent) !important;
            margin-bottom: 3pt !important;
          }

          .print-footer-text {
            font-size: 6.2pt !important;
            color: #6b7280 !important;
            line-height: 1.25 !important;
            margin: 0 !important;
            font-style: italic !important;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(printContent, document.body);
}
