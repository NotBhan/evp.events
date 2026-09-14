import 'server-only';
import dns from 'node:dns';
import { prisma } from '@/lib/db';
import type { Booking } from '@prisma/client';

// Prioritize IPv4 for DNS resolution in Node to prevent IPv6 socket hangs in serverless / container runtimes
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

export interface SheetsSyncResult {
  success: boolean;
  bookingId: string;
  action?: 'inserted' | 'updated' | 'already_synced';
  error?: string;
}

export interface BatchSyncResult {
  totalCandidates: number;
  syncedCount: number;
  failedCount: number;
  results: SheetsSyncResult[];
}

/**
 * Synchronizes an authoritative Neon confirmed booking to the secondary Google Sheets mirror.
 *
 * Invariants:
 * 1. Neon is authoritative. Google Sheets is strictly a secondary mirror.
 * 2. Only synchronizes bookings satisfying: status === CONFIRMED && paymentStatus === PAID.
 * 3. Never accepts browser-provided amounts, customer identity, or pass types.
 * 4. Communicates only server-to-server with BOOKING_SHEETS_ENDPOINT.
 * 5. Failure never throws or rolls back confirmed booking or payment.
 * 6. Updates persistent state on Booking (sheetSyncStatus, sheetSyncedAt, sheetSyncAttempts, sheetLastError).
 */
export async function syncBookingToSheets(
  bookingIdOrPublicId: string
): Promise<SheetsSyncResult> {
  const targetId = bookingIdOrPublicId.trim();
  if (!targetId) {
    return {
      success: false,
      bookingId: '',
      error: 'Booking ID is required for Sheets sync.',
    };
  }

  // 1. Resolve authoritative booking and pass from Neon
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ id: targetId }, { publicId: targetId }],
    },
    include: { pass: true },
  });

  if (!booking) {
    return {
      success: false,
      bookingId: targetId,
      error: `Booking "${targetId}" not found in database.`,
    };
  }

  // 2. Strict Invariant Guard: Only CONFIRMED + PAID bookings may ever sync to Google Sheets
  if (booking.status !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') {
    const refusalReason = `Booking ${booking.publicId} is not confirmed and paid (status: ${booking.status}, paymentStatus: ${booking.paymentStatus}). Refusing Sheets sync.`;
    console.warn(`[Sheets Sync Invariant Refusal] ${refusalReason}`);
    return {
      success: false,
      bookingId: booking.publicId,
      error: refusalReason,
    };
  }

  // 3. Resolve server-side endpoint (server-only; never use NEXT_PUBLIC_ variant)
  const endpoint = process.env.BOOKING_SHEETS_ENDPOINT;

  if (!endpoint) {
    const diagnostic =
      'BOOKING_SHEETS_ENDPOINT is not configured in server environment.';
    console.error(`[Sheets Sync Error] ${diagnostic}`);
    await recordSyncFailure(booking.id, diagnostic);
    return {
      success: false,
      bookingId: booking.publicId,
      error: diagnostic,
    };
  }

  // 4. Construct payload from authoritative Neon values
  const payload = {
    bookingId: booking.publicId,
    publicId: booking.publicId,
    passId: booking.pass.passType,
    passType: booking.pass.name,
    quantity: booking.quantity,
    unitPrice: booking.unitPrice,
    total: booking.totalAmount,
    fullName: booking.fullName,
    phone: booking.phone,
    email: booking.email || '',
    city: booking.city || 'Ranchi',
    status: booking.status,
    submissionStatus: 'CONFIRMED',
    source: booking.source || 'Web Booking Desk (/booking)',
    timestamp: booking.confirmedAt
      ? booking.confirmedAt.toISOString()
      : booking.createdAt.toISOString(),
  };

  // 5. Post to Apps Script Web App
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await res.text();
    let data: Record<string, unknown>;

    try {
      data = JSON.parse(rawText);
    } catch {
      const diagnostic = `Apps Script returned non-JSON response (status ${res.status}): ${rawText.slice(0, 160)}`;
      await recordSyncFailure(booking.id, diagnostic);
      return {
        success: false,
        bookingId: booking.publicId,
        error: diagnostic,
      };
    }

    if (data.status !== 'success') {
      const diagnostic = `Apps Script reported error: ${data.message || JSON.stringify(data)}`;
      await recordSyncFailure(booking.id, diagnostic);
      return {
        success: false,
        bookingId: booking.publicId,
        error: diagnostic,
      };
    }

    // 6. Record successful synchronization in Neon
    const action =
      data.action === 'updated'
        ? ('updated' as const)
        : ('inserted' as const);

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        sheetSyncStatus: 'SYNCED',
        sheetSyncedAt: new Date(),
        sheetLastError: null,
        sheetSyncAttempts: { increment: 1 },
      },
    });

    return {
      success: true,
      bookingId: booking.publicId,
      action,
    };
  } catch (err: unknown) {
    const diagnostic =
      err instanceof Error
        ? err.name === 'AbortError'
          ? 'Apps Script request timed out after 15 seconds'
          : err.message.slice(0, 300)
        : 'Unknown network failure during Sheets synchronization';

    console.error(`[Sheets Sync Failure] Booking ${booking.publicId}: ${diagnostic}`);
    await recordSyncFailure(booking.id, diagnostic);

    return {
      success: false,
      bookingId: booking.publicId,
      error: diagnostic,
    };
  }
}

/**
 * Persists failure evidence on the booking without touching booking or payment status.
 */
async function recordSyncFailure(bookingInternalId: string, diagnostic: string) {
  try {
    await prisma.booking.update({
      where: { id: bookingInternalId },
      data: {
        sheetSyncStatus: 'FAILED',
        sheetLastError: diagnostic.slice(0, 500),
        sheetSyncAttempts: { increment: 1 },
      },
    });
  } catch (updateErr) {
    console.error(
      `[Sheets Sync] Failed to record failure state for booking ${bookingInternalId}:`,
      updateErr
    );
  }
}

/**
 * Batch reconciliation utility for recovering un-synced or failed confirmed bookings.
 * Strictly queries bookings that are confirmed and paid.
 */
export async function syncAllUnsyncedBookings(
  batchLimit = 25
): Promise<BatchSyncResult> {
  const candidates = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      OR: [
        { sheetSyncStatus: 'PENDING' },
        { sheetSyncStatus: 'FAILED' },
        { sheetSyncStatus: null },
      ],
    },
    orderBy: { confirmedAt: 'asc' },
    take: batchLimit,
  });

  const results: SheetsSyncResult[] = [];
  let syncedCount = 0;
  let failedCount = 0;

  for (const candidate of candidates) {
    const res = await syncBookingToSheets(candidate.id);
    results.push(res);
    if (res.success) {
      syncedCount++;
    } else {
      failedCount++;
    }
  }

  return {
    totalCandidates: candidates.length,
    syncedCount,
    failedCount,
    results,
  };
}
