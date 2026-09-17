'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BookingLookupDesk from './BookingLookupDesk';
import BookingReceipt from './BookingReceipt';
import BookingReceiptPrint from './BookingReceiptPrint';
import PassOwnershipDisclaimer from './PassOwnershipDisclaimer';
import type { SubmittedBookingRecord } from './BookingReceiptPrint';

/**
 * Standalone Find Pass desk: recovers a booking and shows its receipt without the
 * booking/reserve flow. Decoupled from the booking page, which now handles new
 * bookings only.
 */
export default function FindPassDesk() {
  const router = useRouter();
  const [receiptRecord, setReceiptRecord] = useState<SubmittedBookingRecord | null>(null);

  if (receiptRecord) {
    return (
      <div className="w-full space-y-6">
        <div className="flex justify-center">
          <button
            id="find-pass-back-btn"
            type="button"
            onClick={() => setReceiptRecord(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-deep-plum border border-antique-gold/40 text-warm-cream text-xs font-body font-bold uppercase tracking-wider hover:text-bright-gold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-bright-gold" />
            <span>Go Back</span>
          </button>
        </div>

        <div className="mx-auto w-full max-w-6xl">
          <BookingReceipt
            bookingId={receiptRecord.bookingId}
            passType={receiptRecord.passType}
            quantity={receiptRecord.quantity}
            unitPrice={receiptRecord.unitPrice}
            total={receiptRecord.total}
            fullName={receiptRecord.fullName}
            phone={receiptRecord.phone}
            email={receiptRecord.email}
            city={receiptRecord.city}
            timestamp={receiptRecord.timestamp}
            status={receiptRecord.status}
            paymentStatus={receiptRecord.paymentStatus}
            expiresAt={receiptRecord.expiresAt}
            cancelledAt={receiptRecord.cancelledAt}
            refundBreakdown={receiptRecord.refundBreakdown}
            entryToken={receiptRecord.entryToken}
            onNewEnquiry={() => router.push('/booking')}
            onProceedToPayment={() =>
              router.push(`/booking?bookingId=${encodeURIComponent(receiptRecord.bookingId)}`)
            }
          />
        </div>

        {/* Dedicated print root (portals to <body>): without it, printing a recovered
            pass would hide the whole app and print nothing. */}
        <BookingReceiptPrint record={receiptRecord} />

        <PassOwnershipDisclaimer />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-3xl">
        <BookingLookupDesk
          onViewReceipt={(record) => setReceiptRecord(record)}
          onExitLookup={() => router.push('/booking')}
        />
      </div>
      <PassOwnershipDisclaimer />
    </div>
  );
}
