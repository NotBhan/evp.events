'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { eventData } from '@/data/eventData';

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
  recoveryToken?: string;
}

interface BookingReceiptPrintProps {
  record: SubmittedBookingRecord;
}

export default function BookingReceiptPrint({ record }: BookingReceiptPrintProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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

  const printContent = (
    <div id="print-receipt-root" className="print-receipt-root" aria-hidden="true">
      <div className="print-card">
        {/* ============================================================== */}
        {/* 1. HEADER: BRANDING & REQUEST ID                               */}
        {/* ============================================================== */}
        <header className="print-header">
          <div className="print-brand-row">
            <div className="print-logo-group">
              <div className="print-logo-box">
                <Image
                  src="/images/client/raascdr/web/eventpoint-logo.webp"
                  alt="Event Point Official Insignia"
                  width={64}
                  height={48}
                  className="print-logo-img"
                  priority
                  unoptimized
                />
              </div>
              <div>
                <span className="print-eyebrow">OFFICIAL COORDINATION RECEIPT</span>
                <h1 className="print-title">RAAS UTSAV 2026</h1>
                <span className="print-subtitle">BOOKING REQUEST RECEIPT · EVENT POINT</span>
              </div>
            </div>

            <div className="print-id-group">
              <div className="print-badge">REQUEST SUBMITTED</div>
              <div className="print-req-id">{record.bookingId}</div>
              <div className="print-date">{formattedDate}</div>
            </div>
          </div>

          {/* Non-Ticket Legal Callout Banner */}
          <div className="print-disclaimer-callout">
            <div className="print-disclaimer-title">BOOKING REQUEST — NOT A CONFIRMED TICKET</div>
            <div className="print-disclaimer-body">
              This receipt confirms submission of a booking request only. It is not a confirmed ticket or proof of payment. Final pass allocation and payment confirmation are handled directly through the Event Point booking system.
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 2. TWO-COLUMN GRID: ATTENDEE DETAILS & PASS SPECIFICATION     */}
        {/* ============================================================== */}
        <div className="print-grid">
          {/* Column A: Attendee Details */}
          <div className="print-col">
            <div className="print-section-title">ATTENDEE DETAILS</div>
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

          {/* Column B: Pass Specification */}
          <div className="print-col">
            <div className="print-section-title">PASS SPECIFICATION</div>
            <div className="print-field">
              <span className="print-label">PASS CATEGORY</span>
              <span className="print-val-bold print-pass-name">{record.passType}</span>
            </div>
            <div className="print-field-row">
              <div>
                <span className="print-label">QUANTITY</span>
                <span className="print-val-large">{record.quantity}</span>
              </div>
              <div>
                <span className="print-label">UNIT PRICE</span>
                <span className="print-val">₹{record.unitPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="print-total-box">
              <span className="print-total-label">REQUEST TOTAL:</span>
              <span className="print-total-val">₹{record.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. EVENT LOGISTICS & COORDINATION CONTACTS                     */}
        {/* ============================================================== */}
        <div className="print-meta-grid">
          <div className="print-meta-col">
            <div className="print-section-title">EVENT LOGISTICS</div>
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
            <div className="print-section-title">COORDINATION CONTACTS</div>
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
        {/* 4. FORMAL FOOTER PROTOCOL                                      */}
        {/* ============================================================== */}
        <footer className="print-footer">
          <p className="print-footer-text">
            Important Protocol: Submitting this form records an official pass reservation with Event Point. No online payment was deducted yet. Pass allocation and booking confirmation will be verified directly by the Event Point coordination team. For expedited assistance, contact the coordination desk via phone or WhatsApp.
          </p>
        </footer>
      </div>

      <style jsx global>{`
        #print-receipt-root {
          display: none;
        }

        @media print {
          #print-receipt-root {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            padding: 8mm 12mm !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            color: #12080d !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-card {
            border: 2pt solid #b38f24 !important;
            border-radius: 6pt !important;
            padding: 14pt 18pt !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }

          .print-header {
            display: block !important;
            border-bottom: 1.5pt dashed #b38f24 !important;
            padding-bottom: 10pt !important;
            margin-bottom: 10pt !important;
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
            border: 1pt solid #b38f24 !important;
            border-radius: 4pt !important;
            padding: 2pt !important;
            background: #fffdf5 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .print-logo-img {
            object-fit: contain !important;
            width: 100% !important;
            height: 100% !important;
          }

          .print-eyebrow {
            font-size: 8pt !important;
            font-weight: bold !important;
            color: #8c1d40 !important;
            letter-spacing: 0.15em !important;
            display: block !important;
          }

          .print-title {
            font-size: 20pt !important;
            font-weight: 900 !important;
            color: #4a0e2e !important;
            letter-spacing: 0.05em !important;
            margin: 1pt 0 !important;
            line-height: 1.1 !important;
          }

          .print-subtitle {
            font-size: 8.5pt !important;
            color: #555555 !important;
            letter-spacing: 0.08em !important;
            display: block !important;
          }

          .print-id-group {
            text-align: right !important;
          }

          .print-badge {
            display: inline-block !important;
            padding: 2pt 6pt !important;
            background: #e6f7ec !important;
            border: 1pt solid #28a745 !important;
            color: #1e7e34 !important;
            font-size: 7.5pt !important;
            font-weight: bold !important;
            border-radius: 3pt !important;
            letter-spacing: 0.05em !important;
            margin-bottom: 2pt !important;
          }

          .print-req-id {
            font-family: monospace !important;
            font-size: 13pt !important;
            font-weight: bold !important;
            color: #8c1d40 !important;
            letter-spacing: 0.05em !important;
          }

          .print-date {
            font-size: 8pt !important;
            color: #666666 !important;
          }

          .print-disclaimer-callout {
            margin-top: 8pt !important;
            padding: 6pt 10pt !important;
            background: #fff8eb !important;
            border: 1pt solid #d92524 !important;
            border-radius: 4pt !important;
          }

          .print-disclaimer-title {
            font-size: 8.5pt !important;
            font-weight: bold !important;
            color: #b50d00 !important;
            letter-spacing: 0.05em !important;
          }

          .print-disclaimer-body {
            font-size: 7.5pt !important;
            color: #333333 !important;
            line-height: 1.3 !important;
            margin-top: 1pt !important;
          }

          .print-grid {
            display: flex !important;
            justify-content: space-between !important;
            gap: 16pt !important;
            border-bottom: 1.5pt dashed #b38f24 !important;
            padding-bottom: 10pt !important;
            margin-bottom: 10pt !important;
          }

          .print-col {
            flex: 1 !important;
          }

          .print-section-title {
            font-size: 9pt !important;
            font-weight: bold !important;
            color: #8c1d40 !important;
            letter-spacing: 0.1em !important;
            border-bottom: 1pt solid #e5d8b8 !important;
            padding-bottom: 2pt !important;
            margin-bottom: 6pt !important;
          }

          .print-field {
            margin-bottom: 5pt !important;
          }

          .print-field-row {
            display: flex !important;
            gap: 16pt !important;
            margin-bottom: 5pt !important;
          }

          .print-label {
            font-size: 7pt !important;
            color: #777777 !important;
            letter-spacing: 0.08em !important;
            display: block !important;
          }

          .print-val {
            font-size: 9pt !important;
            color: #12080d !important;
          }

          .print-val-bold {
            font-size: 10pt !important;
            font-weight: bold !important;
            color: #12080d !important;
            display: block !important;
          }

          .print-pass-name {
            color: #4a0e2e !important;
            font-size: 11pt !important;
          }

          .print-val-large {
            font-size: 14pt !important;
            font-weight: bold !important;
            color: #8c1d40 !important;
          }

          .print-total-box {
            margin-top: 6pt !important;
            padding: 5pt 8pt !important;
            background: #fffdf5 !important;
            border: 1pt solid #b38f24 !important;
            border-radius: 4pt !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }

          .print-total-label {
            font-size: 8.5pt !important;
            font-weight: bold !important;
            color: #555555 !important;
          }

          .print-total-val {
            font-size: 14pt !important;
            font-weight: 900 !important;
            color: #8c1d40 !important;
          }

          .print-meta-grid {
            display: flex !important;
            justify-content: space-between !important;
            gap: 16pt !important;
            margin-bottom: 8pt !important;
          }

          .print-meta-col {
            flex: 1 !important;
          }

          .print-meta-item {
            font-size: 7.5pt !important;
            color: #333333 !important;
            margin-bottom: 2pt !important;
            line-height: 1.3 !important;
          }

          .print-meta-item strong {
            color: #8c1d40 !important;
          }

          .print-footer {
            border-top: 1pt solid #e5d8b8 !important;
            padding-top: 6pt !important;
            text-align: center !important;
          }

          .print-footer-text {
            font-size: 6.5pt !important;
            color: #777777 !important;
            line-height: 1.35 !important;
            margin: 0 !important;
            font-style: italic !important;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(printContent, document.body);
}
