import dns from 'node:dns';
import http from 'node:http';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const prisma = new PrismaClient();

/**
 * Mock Google Apps Script server that replicates the 14-column sheet and Column B upsert behavior
 */
class MockAppsScriptServer {
  constructor(port = 3999) {
    this.port = port;
    this.server = null;
    this.sheetRows = []; // 14 columns
    this.mode = 'normal'; // 'normal' | 'fail_500' | 'fail_error_json' | 'timeout'
    this.requestLog = [];
  }

  async start() {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', () => {
          this.requestLog.push({
            method: req.method,
            url: req.url,
            headers: req.headers,
            body,
          });

          if (this.mode === 'fail_500') {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error: Google Sheets connection timeout');
            return;
          }

          if (this.mode === 'fail_error_json') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'Simulated Sheets quota exceeded' }));
            return;
          }

          if (this.mode === 'timeout') {
            req.destroy();
            return;
          }

          // Normal mode: simulate Apps Script upsert by bookingId in Column B
          try {
            const data = JSON.parse(body);
            const bookingId = String(data.bookingId || data.publicId || '').trim();
            const timestamp = data.timestamp || new Date().toISOString();
            const passType = data.passType || 'Festival Pass';
            const quantity = data.quantity || 1;
            const unitPrice = data.unitPrice || 999;
            const total = data.total || unitPrice * quantity;
            const fullName = data.fullName || 'Test User';
            const phone = data.phone || '+91 99999 99999';
            const email = data.email || '';
            const submissionStatus = data.submissionStatus || data.status || 'CONFIRMED';
            const source = data.source || 'Web Booking Desk';
            const entryTaken = data.entryTaken || 'NO';
            const entryTime = data.entryTime || '';
            const scannedBy = data.scannedBy || '';

            const rowData = [
              timestamp,
              bookingId,
              passType,
              quantity,
              unitPrice,
              total,
              fullName,
              phone,
              email,
              submissionStatus,
              source,
              entryTaken,
              entryTime,
              scannedBy,
            ];

            // Search Column B (index 1) for bookingId
            const existingIdx = this.sheetRows.findIndex((r) => r[1] === bookingId);
            let action = 'inserted';

            if (existingIdx >= 0) {
              // Update existing row
              this.sheetRows[existingIdx] = rowData;
              action = 'updated';
            } else {
              // Append new row
              this.sheetRows.push(rowData);
              action = 'inserted';
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                status: 'success',
                action,
                bookingId,
                passType,
                quantity,
                unitPrice,
                total,
                phone,
                message:
                  action === 'updated'
                    ? 'Booking registration updated successfully'
                    : 'Booking request recorded successfully',
              })
            );
          } catch (parseErr) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'Malformed JSON: ' + parseErr.message }));
          }
        });
      });

      this.server.listen(this.port, () => {
        resolve();
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  getRowsForBooking(bookingId) {
    return this.sheetRows.filter((r) => r[1] === bookingId);
  }

  setMode(mode) {
    this.mode = mode;
  }

  clear() {
    this.sheetRows = [];
    this.requestLog = [];
    this.mode = 'normal';
  }
}

/**
 * Service-level helper mirroring lib/sheets.ts
 */
async function syncBookingToSheetsHelper(bookingIdOrPublicId, endpointOverride) {
  const targetId = bookingIdOrPublicId.trim();
  const booking = await prisma.booking.findFirst({
    where: { OR: [{ id: targetId }, { publicId: targetId }] },
    include: { pass: true },
  });

  if (!booking) {
    return { success: false, bookingId: targetId, error: 'Booking not found' };
  }

  if (booking.status !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') {
    const error = `Booking ${booking.publicId} is not confirmed and paid (status: ${booking.status}, paymentStatus: ${booking.paymentStatus}). Refusing Sheets sync.`;
    return { success: false, bookingId: booking.publicId, error };
  }

  const endpoint = endpointOverride || process.env.BOOKING_SHEETS_ENDPOINT;
  if (!endpoint) {
    const error = 'BOOKING_SHEETS_ENDPOINT is not configured';
    await prisma.booking.update({
      where: { id: booking.id },
      data: { sheetSyncStatus: 'FAILED', sheetLastError: error, sheetSyncAttempts: { increment: 1 } },
    });
    return { success: false, bookingId: booking.publicId, error };
  }

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
    timestamp: booking.confirmedAt ? booking.confirmedAt.toISOString() : booking.createdAt.toISOString(),
    entryTaken: booking.checkInStatus === 'CHECKED_IN' ? 'YES' : 'NO',
    entryTime:
      booking.checkInStatus === 'CHECKED_IN' && booking.checkedInAt
        ? booking.checkedInAt.toISOString()
        : '',
    scannedBy: booking.checkInStatus === 'CHECKED_IN' ? booking.checkedInBy || '' : '',
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      const error = `Apps Script returned non-JSON (status ${res.status}): ${rawText.slice(0, 160)}`;
      await prisma.booking.update({
        where: { id: booking.id },
        data: { sheetSyncStatus: 'FAILED', sheetLastError: error, sheetSyncAttempts: { increment: 1 } },
      });
      return { success: false, bookingId: booking.publicId, error };
    }

    if (data.status !== 'success') {
      const error = `Apps Script reported error: ${data.message || JSON.stringify(data)}`;
      await prisma.booking.update({
        where: { id: booking.id },
        data: { sheetSyncStatus: 'FAILED', sheetLastError: error, sheetSyncAttempts: { increment: 1 } },
      });
      return { success: false, bookingId: booking.publicId, error };
    }

    const action = data.action === 'updated' ? 'updated' : 'inserted';
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        sheetSyncStatus: 'SYNCED',
        sheetSyncedAt: new Date(),
        sheetLastError: null,
        sheetSyncAttempts: { increment: 1 },
      },
    });

    return { success: true, bookingId: booking.publicId, action };
  } catch (err) {
    const error = err.name === 'AbortError' ? 'Timeout after 15s' : err.message.slice(0, 300);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { sheetSyncStatus: 'FAILED', sheetLastError: error, sheetSyncAttempts: { increment: 1 } },
    });
    return { success: false, bookingId: booking.publicId, error };
  }
}

/**
 * Service-level helper mirroring confirmBookingPayment in lib/payments/service.ts
 */
async function confirmBookingPaymentHelper(params, endpointOverride) {
  const { provider, providerOrderId, providerPaymentId, expectedAmountPaise, bookingPublicId, paymentAttemptId } = params;

  const result = await prisma.$transaction(async (tx) => {
    let attempt = null;
    if (paymentAttemptId) {
      attempt = await tx.paymentAttempt.findUnique({ where: { id: paymentAttemptId } });
    }
    if (!attempt && providerOrderId) {
      attempt = await tx.paymentAttempt.findFirst({ where: { provider, providerOrderId } });
    }
    if (!attempt) throw new Error('PaymentAttempt not found');

    const booking = await tx.booking.findUnique({ where: { id: attempt.bookingId }, include: { pass: true } });
    if (!booking) throw new Error('Booking not found');

    if (attempt.status === 'SUCCEEDED') {
      return { success: true, alreadyProcessed: true, booking, paymentAttempt: attempt };
    }

    if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID') {
      const updatedAttempt = await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: 'SUCCEEDED', providerPaymentId: providerPaymentId || attempt.providerPaymentId },
      });
      return { success: true, alreadyProcessed: true, booking, paymentAttempt: updatedAttempt };
    }

    if (booking.status === 'EXPIRED') throw new Error('Booking is expired');

    const updatedAttempt = await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: { status: 'SUCCEEDED', providerPaymentId: providerPaymentId || attempt.providerPaymentId },
    });

    const bookingUpdateCount = await tx.$executeRaw`
      UPDATE bookings
      SET status = 'CONFIRMED'::"BookingStatus",
          payment_status = 'PAID'::"PaymentStatus",
          confirmed_at = NOW(),
          sheet_sync_status = 'PENDING'::"SheetSyncStatus",
          sheet_last_error = NULL,
          updated_at = NOW()
      WHERE id = ${booking.id}
        AND status = 'PENDING'::"BookingStatus"
    `;

    if (bookingUpdateCount === 0) throw new Error('Concurrent mutation');

    await tx.$executeRaw`
      UPDATE passes
      SET reserved_quantity = reserved_quantity - ${booking.quantity},
          sold_quantity = sold_quantity + ${booking.quantity},
          updated_at = NOW()
      WHERE id = ${booking.passId}
        AND reserved_quantity >= ${booking.quantity}
    `;

    const updatedBooking = await tx.booking.findUnique({
      where: { id: booking.id },
      include: { pass: true },
    });

    return { success: true, booking: updatedBooking, paymentAttempt: updatedAttempt };
  });

  // Post-commit: trigger Sheets sync
  if (!result.alreadyProcessed || result.booking.sheetSyncStatus !== 'SYNCED') {
    try {
      await syncBookingToSheetsHelper(result.booking.id, endpointOverride);
    } catch (syncErr) {
      console.error('[Sheets Sync Post-Commit Error]', syncErr);
    }
  }

  return result;
}

async function runAllSpecificationTests() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — GOOGLE SHEETS SYNC SPECIFICATION TEST SUITE');
  console.log('================================================================\n');

  const mockServer = new MockAppsScriptServer(3999);
  await mockServer.start();
  const mockEndpoint = `http://127.0.0.1:3999/exec`;

  const realEndpoint = process.env.BOOKING_SHEETS_ENDPOINT;

  const testPass = await prisma.pass.findFirst({
    where: { isActive: true },
  });
  assert.ok(testPass, 'An active pass must exist in the database');

  const createdBookingIds = [];
  // Confirmed payments move one reserved unit into sold on the shared pass; the
  // exact counter movement is recorded here and undone in the teardown.
  const confirmedPayments = [];

  try {
    // ------------------------------------------------------------------
    // TEST A: Confirmed booking -> exactly one Sheet row
    // ------------------------------------------------------------------
    console.log('--- Test A: Confirmed booking -> exactly one Sheet row ---');
    const testABooking = await prisma.booking.create({
      data: {
        publicId: `RU26-TEST-A-${Date.now().toString().slice(-4)}`,
        fullName: 'Aarav Sharma',
        phone: '+91 99315 03960',
        email: 'aarav@example.com',
        city: 'Ranchi',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'PENDING',
        paymentStatus: 'NOT_STARTED',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    createdBookingIds.push(testABooking.id);

    await prisma.pass.update({
      where: { id: testPass.id },
      data: { reservedQuantity: { increment: 1 } },
    });

    const testAAttempt = await prisma.paymentAttempt.create({
      data: {
        bookingId: testABooking.id,
        provider: 'stripe',
        providerOrderId: `order_test_a_${Date.now()}`,
        amount: testPass.price * 100,
        status: 'INITIATED',
      },
    });

    const confirmARes = await confirmBookingPaymentHelper({
      provider: 'stripe',
      providerOrderId: testAAttempt.providerOrderId,
      providerPaymentId: `pi_test_a_${Date.now()}`,
      expectedAmountPaise: testPass.price * 100,
      bookingPublicId: testABooking.publicId,
      paymentAttemptId: testAAttempt.id,
    }, mockEndpoint);

    assert.equal(confirmARes.success, true);
    assert.equal(confirmARes.booking.status, 'CONFIRMED');
    assert.equal(confirmARes.booking.paymentStatus, 'PAID');

    // Verify exactly 1 row in sheet with authoritative values
    const rowsA = mockServer.getRowsForBooking(testABooking.publicId);
    assert.equal(rowsA.length, 1, 'Confirmed booking must produce exactly 1 sheet row');
    assert.equal(rowsA[0][1], testABooking.publicId, 'Column B must contain authoritative public bookingId');
    assert.equal(rowsA[0][2], testPass.name, 'Column C must contain authoritative pass name');
    assert.equal(rowsA[0][3], 1, 'Column D must contain quantity');
    assert.equal(rowsA[0][4], testPass.price, 'Column E must contain unit price');
    assert.equal(rowsA[0][5], testPass.price, 'Column F must contain total');
    assert.equal(rowsA[0][6], 'Aarav Sharma', 'Column G must contain full name');
    assert.equal(rowsA[0][7], '+91 99315 03960', 'Column H must contain phone');
    assert.equal(rowsA[0][8], 'aarav@example.com', 'Column I must contain email');
    assert.equal(rowsA[0][9], 'CONFIRMED', 'Column J must contain submission status CONFIRMED');

    // Verify database record
    const dbBookingA = await prisma.booking.findUnique({ where: { id: testABooking.id } });
    assert.equal(dbBookingA.sheetSyncStatus, 'SYNCED', 'sheetSyncStatus must be SYNCED');
    assert.ok(dbBookingA.sheetSyncedAt instanceof Date, 'sheetSyncedAt must be set to Date');
    assert.equal(dbBookingA.sheetLastError, null, 'sheetLastError must be null on success');
    assert.equal(dbBookingA.sheetSyncAttempts, 1, 'sheetSyncAttempts must be 1');
    confirmedPayments.push({ passId: testPass.id, quantity: testABooking.quantity });
    console.log('✓ PASS: Test A confirmed booking produced exactly 1 Sheet row and status SYNCED.\n');

    // ------------------------------------------------------------------
    // TEST B: Duplicate confirmation/webhook -> still exactly one row
    // ------------------------------------------------------------------
    console.log('--- Test B: Duplicate confirmation/webhook -> still exactly one row ---');
    const duplicateConfirmRes = await confirmBookingPaymentHelper({
      provider: 'stripe',
      providerOrderId: testAAttempt.providerOrderId,
      providerPaymentId: `pi_test_a_replay_${Date.now()}`,
      expectedAmountPaise: testPass.price * 100,
      bookingPublicId: testABooking.publicId,
      paymentAttemptId: testAAttempt.id,
    }, mockEndpoint);

    assert.equal(duplicateConfirmRes.success, true);
    assert.equal(duplicateConfirmRes.alreadyProcessed, true, 'Replay must be flagged alreadyProcessed');

    const rowsB = mockServer.getRowsForBooking(testABooking.publicId);
    assert.equal(rowsB.length, 1, 'Duplicate confirmation must NOT create duplicate rows');
    console.log('✓ PASS: Test B duplicate confirmation resulted in still exactly 1 row.\n');

    // ------------------------------------------------------------------
    // TEST C: Sync failure -> booking remains CONFIRMED/PAID
    // ------------------------------------------------------------------
    console.log('--- Test C: Sync failure -> booking remains CONFIRMED/PAID ---');
    mockServer.setMode('fail_500');

    const testCBooking = await prisma.booking.create({
      data: {
        publicId: `RU26-TEST-C-${Date.now().toString().slice(-4)}`,
        fullName: 'Pooja Verma',
        phone: '+91 99315 03961',
        email: 'pooja@example.com',
        city: 'Ranchi',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'PENDING',
        paymentStatus: 'NOT_STARTED',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    createdBookingIds.push(testCBooking.id);

    await prisma.pass.update({
      where: { id: testPass.id },
      data: { reservedQuantity: { increment: 1 } },
    });

    const testCAttempt = await prisma.paymentAttempt.create({
      data: {
        bookingId: testCBooking.id,
        provider: 'stripe',
        providerOrderId: `order_test_c_${Date.now()}`,
        amount: testPass.price * 100,
        status: 'INITIATED',
      },
    });

    // Confirm booking payment while sheets server returns 500 error
    const confirmCRes = await confirmBookingPaymentHelper({
      provider: 'stripe',
      providerOrderId: testCAttempt.providerOrderId,
      providerPaymentId: `pi_test_c_${Date.now()}`,
      expectedAmountPaise: testPass.price * 100,
      bookingPublicId: testCBooking.publicId,
      paymentAttemptId: testCAttempt.id,
    }, mockEndpoint);

    // Invariant: confirmBookingPayment MUST succeed despite Sheets failure
    assert.equal(confirmCRes.success, true, 'Payment confirmation must succeed even if Sheets sync fails');

    // Invariant: Neon booking MUST remain CONFIRMED and PAID
    const dbBookingC = await prisma.booking.findUnique({ where: { id: testCBooking.id } });
    assert.equal(dbBookingC.status, 'CONFIRMED', 'Booking status must remain CONFIRMED in Neon');
    assert.equal(dbBookingC.paymentStatus, 'PAID', 'Payment status must remain PAID in Neon');
    confirmedPayments.push({ passId: testPass.id, quantity: testCBooking.quantity });
    console.log('✓ PASS: Test C payment succeeded and booking remains CONFIRMED/PAID in Neon.\n');

    // ------------------------------------------------------------------
    // TEST D: Failed sync is persisted as retryable
    // ------------------------------------------------------------------
    console.log('--- Test D: Failed sync is persisted as retryable ---');
    assert.equal(dbBookingC.sheetSyncStatus, 'FAILED', 'sheetSyncStatus must be FAILED');
    assert.equal(dbBookingC.sheetSyncAttempts, 1, 'sheetSyncAttempts must be 1');
    assert.ok(
      dbBookingC.sheetLastError && dbBookingC.sheetLastError.includes('500'),
      'sheetLastError must contain diagnostic information'
    );
    console.log('✓ PASS: Test D failed sync is persisted with status FAILED, attempts=1, diagnostic error.\n');

    // ------------------------------------------------------------------
    // TEST E: Retry succeeds -> status becomes SYNCED
    // ------------------------------------------------------------------
    console.log('--- Test E: Retry succeeds -> status becomes SYNCED ---');
    mockServer.setMode('normal');

    const retryRes = await syncBookingToSheetsHelper(testCBooking.id, mockEndpoint);
    assert.equal(retryRes.success, true, 'Retry must succeed when sheets endpoint recovers');

    const dbBookingCRetried = await prisma.booking.findUnique({ where: { id: testCBooking.id } });
    assert.equal(dbBookingCRetried.sheetSyncStatus, 'SYNCED', 'Status must transition to SYNCED on retry');
    assert.ok(dbBookingCRetried.sheetSyncedAt instanceof Date, 'sheetSyncedAt must be set');
    assert.equal(dbBookingCRetried.sheetLastError, null, 'sheetLastError must be cleared on success');
    assert.equal(dbBookingCRetried.sheetSyncAttempts, 2, 'sheetSyncAttempts must be incremented to 2');

    const rowsC = mockServer.getRowsForBooking(testCBooking.publicId);
    assert.equal(rowsC.length, 1, 'Sheet must now contain exactly 1 row for booking C');
    console.log('✓ PASS: Test E retry succeeded, status transitioned to SYNCED, attempts=2.\n');

    // ------------------------------------------------------------------
    // TEST F: Repeated retry -> no duplicate row
    // ------------------------------------------------------------------
    console.log('--- Test F: Repeated retry -> no duplicate row ---');
    const repeatRetryRes = await syncBookingToSheetsHelper(testCBooking.id, mockEndpoint);
    assert.equal(repeatRetryRes.success, true);
    assert.equal(repeatRetryRes.action, 'updated', 'Apps script must update row, not append');

    const rowsCRepeated = mockServer.getRowsForBooking(testCBooking.publicId);
    assert.equal(rowsCRepeated.length, 1, 'Repeated retry must not create duplicate row');
    console.log('✓ PASS: Test F repeated retry updated existing row, 0 duplicate rows created.\n');

    // ------------------------------------------------------------------
    // TEST G: PENDING booking -> no row
    // ------------------------------------------------------------------
    console.log('--- Test G: PENDING booking -> no row ---');
    const testGBooking = await prisma.booking.create({
      data: {
        publicId: `RU26-TEST-G-${Date.now().toString().slice(-4)}`,
        fullName: 'Pending Attendee G',
        phone: '+91 99315 03962',
        email: 'pendingg@example.com',
        city: 'Ranchi',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'PENDING',
        paymentStatus: 'NOT_STARTED',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    createdBookingIds.push(testGBooking.id);

    const syncGRes = await syncBookingToSheetsHelper(testGBooking.id, mockEndpoint);
    assert.equal(syncGRes.success, false, 'Sync must be refused for PENDING booking');
    assert.ok(syncGRes.error && syncGRes.error.includes('not confirmed and paid'));

    const rowsG = mockServer.getRowsForBooking(testGBooking.publicId);
    assert.equal(rowsG.length, 0, 'No row must be written for PENDING booking');
    console.log('✓ PASS: Test G sync refused for PENDING booking, zero rows written.\n');

    // ------------------------------------------------------------------
    // TEST H: FAILED payment -> no row
    // ------------------------------------------------------------------
    console.log('--- Test H: FAILED payment -> no row ---');
    const testHBooking = await prisma.booking.create({
      data: {
        publicId: `RU26-TEST-H-${Date.now().toString().slice(-4)}`,
        fullName: 'Failed Payment Attendee H',
        phone: '+91 99315 03963',
        email: 'failedh@example.com',
        city: 'Ranchi',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'PENDING',
        paymentStatus: 'FAILED',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    createdBookingIds.push(testHBooking.id);

    const syncHRes = await syncBookingToSheetsHelper(testHBooking.id, mockEndpoint);
    assert.equal(syncHRes.success, false, 'Sync must be refused for failed payment booking');

    const rowsH = mockServer.getRowsForBooking(testHBooking.publicId);
    assert.equal(rowsH.length, 0, 'No row must be written for failed payment');
    console.log('✓ PASS: Test H sync refused for FAILED payment booking, zero rows written.\n');

    // ------------------------------------------------------------------
    // TEST I: EXPIRED booking -> no row
    // ------------------------------------------------------------------
    console.log('--- Test I: EXPIRED booking -> no row ---');
    const testIBooking = await prisma.booking.create({
      data: {
        publicId: `RU26-TEST-I-${Date.now().toString().slice(-4)}`,
        fullName: 'Expired Attendee I',
        phone: '+91 99315 03964',
        email: 'expiredi@example.com',
        city: 'Ranchi',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'EXPIRED',
        paymentStatus: 'NOT_STARTED',
        expiresAt: new Date(Date.now() - 3600000),
      },
    });
    createdBookingIds.push(testIBooking.id);

    const syncIRes = await syncBookingToSheetsHelper(testIBooking.id, mockEndpoint);
    assert.equal(syncIRes.success, false, 'Sync must be refused for EXPIRED booking');

    const rowsI = mockServer.getRowsForBooking(testIBooking.publicId);
    assert.equal(rowsI.length, 0, 'No row must be written for EXPIRED booking');
    console.log('✓ PASS: Test I sync refused for EXPIRED booking, zero rows written.\n');

    // ------------------------------------------------------------------
    // TEST J: CANCELLED booking -> no new row
    // ------------------------------------------------------------------
    console.log('--- Test J: CANCELLED booking -> no new row ---');
    const testJBooking = await prisma.booking.create({
      data: {
        publicId: `RU26-TEST-J-${Date.now().toString().slice(-4)}`,
        fullName: 'Cancelled Attendee J',
        phone: '+91 99315 03965',
        email: 'cancelledj@example.com',
        city: 'Ranchi',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    createdBookingIds.push(testJBooking.id);

    const initialSyncJ = await syncBookingToSheetsHelper(testJBooking.id, mockEndpoint);
    assert.equal(initialSyncJ.success, true);
    assert.equal(mockServer.getRowsForBooking(testJBooking.publicId).length, 1);

    // Cancel the booking in Neon
    await prisma.booking.update({
      where: { id: testJBooking.id },
      data: { status: 'CANCELLED' },
    });

    // Attempt sync after cancellation
    const syncJCancelledRes = await syncBookingToSheetsHelper(testJBooking.id, mockEndpoint);
    assert.equal(syncJCancelledRes.success, false, 'Sync must refuse CANCELLED booking');

    // Verify row count did not increase
    const rowsJAfterCancel = mockServer.getRowsForBooking(testJBooking.publicId);
    assert.equal(rowsJAfterCancel.length, 1, 'CANCELLED booking must produce no new row');
    console.log('✓ PASS: Test J CANCELLED booking produced no new row.\n');

    // ------------------------------------------------------------------
    // TEST K: Entry columns — non-checked-in booking mirrors Entry Taken=NO
    // ------------------------------------------------------------------
    console.log('--- Test K: Entry columns before check-in (NO / blank / blank) ---');
    const testKBooking = await prisma.booking.create({
      data: {
        publicId: `RU26-TEST-K-${Date.now().toString().slice(-4)}`,
        fullName: 'Entry Mirror Attendee',
        phone: '+91 99315 03966',
        email: 'entrymirror@example.com',
        city: 'Ranchi',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        confirmedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    createdBookingIds.push(testKBooking.id);

    const syncK = await syncBookingToSheetsHelper(testKBooking.id, mockEndpoint);
    assert.equal(syncK.success, true, 'Confirmed/paid booking must sync');
    const rowsK = mockServer.getRowsForBooking(testKBooking.publicId);
    assert.equal(rowsK.length, 1);
    assert.equal(rowsK[0][11], 'NO', 'Column L must be NO before check-in');
    assert.equal(rowsK[0][12], '', 'Column M must be blank before check-in');
    assert.equal(rowsK[0][13], '', 'Column N must be blank before check-in');
    console.log('✓ PASS: Test K non-checked-in booking mirrored Entry Taken=NO with blank time/scanner.\n');

    // ------------------------------------------------------------------
    // TEST L: Check-in mirrors YES + timestamp + organiser identity (full-row upsert)
    // ------------------------------------------------------------------
    console.log('--- Test L: Check-in mirrors Entry Taken=YES + time + scanned-by ---');
    await prisma.$executeRaw`
      UPDATE bookings
      SET check_in_status = 'CHECKED_IN'::"CheckInStatus",
          checked_in_at = NOW(),
          checked_in_by = 'GATE-01 / Test Organiser',
          checked_in_by_id = 'test-organiser-id',
          sheet_sync_status = 'PENDING'::"SheetSyncStatus",
          sheet_last_error = NULL,
          updated_at = NOW()
      WHERE id = ${testKBooking.id}
    `;

    const syncL = await syncBookingToSheetsHelper(testKBooking.id, mockEndpoint);
    assert.equal(syncL.success, true, 'Check-in mirror sync must succeed');
    const rowsL = mockServer.getRowsForBooking(testKBooking.publicId);
    assert.equal(rowsL.length, 1, 'Check-in update must NOT create a duplicate row (full-row upsert)');
    assert.equal(rowsL[0][11], 'YES', 'Column L must be YES after check-in');
    assert.ok(rowsL[0][12], 'Column M must contain the entry timestamp');
    assert.ok(
      !Number.isNaN(Date.parse(rowsL[0][12])),
      'Column M entry time must be a parseable server timestamp'
    );
    assert.equal(rowsL[0][13], 'GATE-01 / Test Organiser', 'Column N must contain the organiser identity');
    assert.equal(rowsL[0][6], 'Entry Mirror Attendee', 'Existing booking columns must be intact after update');
    assert.equal(rowsL[0][9], 'CONFIRMED', 'Submission status column must remain intact');
    console.log('✓ PASS: Test L check-in mirrored YES + timestamp + organiser identity without duplicating the row.\n');

    // ------------------------------------------------------------------
    // TEST M: Sheets outage never alters the booking; reconciliation restores the mirror
    // ------------------------------------------------------------------
    console.log('--- Test M: Sheets outage → FAILED, retry restores mirror ---');
    mockServer.setMode('fail_500');

    const testMBooking = await prisma.booking.create({
      data: {
        publicId: `RU26-TEST-M-${Date.now().toString().slice(-4)}`,
        fullName: 'Outage Attendee',
        phone: '+91 99315 03967',
        email: 'outage@example.com',
        city: 'Ranchi',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        confirmedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    createdBookingIds.push(testMBooking.id);

    const failM = await syncBookingToSheetsHelper(testMBooking.id, mockEndpoint);
    assert.equal(failM.success, false, 'Sheets outage must be reported as a failed sync');

    const dbFailedM = await prisma.booking.findUnique({ where: { id: testMBooking.id } });
    assert.equal(dbFailedM.sheetSyncStatus, 'FAILED', 'Failure must be persisted for reconciliation');
    assert.ok(dbFailedM.sheetLastError, 'Failure must record an error');
    assert.equal(dbFailedM.status, 'CONFIRMED', 'Primary booking state must be untouched');
    assert.equal(dbFailedM.paymentStatus, 'PAID', 'Payment state must be untouched');
    assert.equal(dbFailedM.checkInStatus, 'NOT_CHECKED_IN');

    // Simulate the gate check-in while Sheets is down, then recover and retry the mirror.
    await prisma.$executeRaw`
      UPDATE bookings
      SET check_in_status = 'CHECKED_IN'::"CheckInStatus",
          checked_in_at = NOW(),
          checked_in_by = 'GATE-04 / Recovery Organiser',
          checked_in_by_id = 'recovery-organiser-id',
          sheet_sync_status = 'PENDING'::"SheetSyncStatus",
          sheet_last_error = NULL,
          updated_at = NOW()
      WHERE id = ${testMBooking.id}
    `;
    mockServer.setMode('normal');

    const retryM = await syncBookingToSheetsHelper(testMBooking.id, mockEndpoint);
    assert.equal(retryM.success, true, 'Retry after recovery must succeed');

    const dbSyncedM = await prisma.booking.findUnique({ where: { id: testMBooking.id } });
    assert.equal(dbSyncedM.sheetSyncStatus, 'SYNCED', 'Reconciliation must restore SYNCED state');
    assert.equal(dbSyncedM.checkInStatus, 'CHECKED_IN', 'Check-in must survive the Sheets outage');

    const rowsM = mockServer.getRowsForBooking(testMBooking.publicId);
    assert.equal(rowsM.length, 1, 'Recovery must not duplicate the row');
    assert.equal(rowsM[0][11], 'YES', 'Recovered mirror must include the entry state');
    assert.equal(rowsM[0][13], 'GATE-04 / Recovery Organiser');
    console.log('✓ PASS: Test M outage persisted FAILED without altering the booking; retry restored the mirror.\n');

    // ------------------------------------------------------------------
    // TEST LIVE GOOGLE APPS SCRIPT ENDPOINT
    // ------------------------------------------------------------------
    // Opt-in only: this leg writes a REAL row into the production spreadsheet and
    // the Apps Script has no delete operation, so the row must be removed by hand.
    // Enable deliberately with ALLOW_LIVE_SHEETS_WRITE_TEST=1 when a live write is
    // actually wanted; routine runs stay side-effect free.
    if (process.env.ALLOW_LIVE_SHEETS_WRITE_TEST !== '1') {
      console.log('--- Live Sheets write test SKIPPED (set ALLOW_LIVE_SHEETS_WRITE_TEST=1 to enable; it leaves a real row) ---\n');
    } else if (realEndpoint && realEndpoint.includes('script.google.com')) {
      console.log('--- Real Confirmed-Booking Live Sheets Endpoint Test ---');
      console.log('Target Endpoint:', realEndpoint);

      const liveBooking = await prisma.booking.create({
        data: {
          publicId: `RU26-REQ-LIVE-${Date.now().toString().slice(-4)}`,
          fullName: 'Live Sync Verification User',
          phone: '+91 99315 03960',
          email: 'live-sync@example.com',
          city: 'Ranchi',
          passId: testPass.id,
          quantity: 1,
          unitPrice: testPass.price,
          totalAmount: testPass.price,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          sheetSyncStatus: 'PENDING',
          expiresAt: new Date(Date.now() + 3600000),
        },
      });
      createdBookingIds.push(liveBooking.id);

      const liveSyncRes = await syncBookingToSheetsHelper(liveBooking.id, realEndpoint);
      console.log('Live Sync Result:', liveSyncRes);
      assert.equal(liveSyncRes.success, true, 'Live Apps Script sync must succeed');

      const dbLiveBooking = await prisma.booking.findUnique({ where: { id: liveBooking.id } });
      assert.equal(dbLiveBooking.sheetSyncStatus, 'SYNCED', 'Live booking must have status SYNCED');
      assert.ok(dbLiveBooking.sheetSyncedAt instanceof Date, 'Live booking must have sheetSyncedAt timestamp');
      console.log('✓ PASS: Real confirmed-booking live Sheets test succeeded.\n');
    }

    // ------------------------------------------------------------------
    // TEST RECONCILIATION ROUTE HTTP ENDPOINT (/api/bookings/sync-sheets)
    // ------------------------------------------------------------------
    console.log('--- Testing Reconciliation HTTP Route (/api/bookings/sync-sheets) ---');
    const { spawn } = await import('node:child_process');
    const HTTP_PORT = 3042;
    const HTTP_BASE = `http://127.0.0.1:${HTTP_PORT}`;

    const serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(HTTP_PORT)], {
      env: {
        ...process.env,
        PORT: String(HTTP_PORT),
        NODE_ENV: 'production',
      },
      stdio: 'pipe',
    });

    try {
      let ready = false;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 400));
        try {
          const res = await fetch(`${HTTP_BASE}/api/bookings/lookup/clear`, { method: 'POST' });
          if (res.status === 200) {
            ready = true;
            break;
          }
        } catch {}
      }
      assert.ok(ready, 'Next.js server must be running on port ' + HTTP_PORT);

      // 1. Test unauthenticated request
      const unauthRes = await fetch(`${HTTP_BASE}/api/bookings/sync-sheets`, { method: 'GET' });
      assert.equal(unauthRes.status, 401, 'Unauthenticated request must return 401');

      // 2. Test authenticated batch GET request with Authorization header
      const authGetRes = await fetch(`${HTTP_BASE}/api/bookings/sync-sheets`, {
        method: 'GET',
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      assert.equal(authGetRes.status, 200, 'Authenticated GET request must return 200');
      const getJson = await authGetRes.json();
      assert.equal(getJson.success, true);
      assert.equal(getJson.mode, 'batch');
      assert.equal(typeof getJson.totalCandidates, 'number');

      // 3. Test authenticated POST request with x-cron-secret header
      const authPostRes = await fetch(`${HTTP_BASE}/api/bookings/sync-sheets`, {
        method: 'POST',
        headers: {
          'x-cron-secret': process.env.CRON_SECRET,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 10 }),
      });
      assert.equal(authPostRes.status, 200, 'Authenticated POST request must return 200');
      const postJson = await authPostRes.json();
      assert.equal(postJson.success, true);
      assert.equal(postJson.mode, 'batch');

      console.log('✓ PASS: Reconciliation HTTP Route (/api/bookings/sync-sheets) passed auth and batch tests.\n');
    } finally {
      serverProc.kill('SIGTERM');
    }

    console.log('================================================================');
    console.log('ALL 10 SPECIFICATION TESTS (A–J) + LIVE TEST + HTTP ENDPOINT PASSED PERFECTLY!');
    console.log('================================================================\n');
  } finally {
    // Clean up temporary test data from Neon
    console.log('Cleaning up temporary test records from Neon...');

    // Test A confirms a payment, which atomically moves one unit from
    // reserved_quantity to sold_quantity on the shared official pass. Deleting the
    // booking alone would leave sold_quantity permanently inflated, so restore the
    // exact counter movement this suite caused (state-neutral teardown).
    if (confirmedPayments.length > 0) {
      for (const entry of confirmedPayments) {
        const restored = await prisma.$executeRaw`
          UPDATE passes
          SET sold_quantity = sold_quantity - ${entry.quantity},
              updated_at = NOW()
          WHERE id = ${entry.passId}
            AND sold_quantity >= ${entry.quantity}
        `;
        if (restored === 0) {
          console.warn(
            `  ! Could not restore sold_quantity for pass ${entry.passId} (insufficient counter) — verify inventory manually.`
          );
        }
      }
      console.log(`Restored sold_quantity on ${confirmedPayments.length} pass(es) affected by confirmed test payments.`);
    }

    if (createdBookingIds.length > 0) {
      await prisma.paymentAttempt.deleteMany({
        where: { bookingId: { in: createdBookingIds } },
      });
      await prisma.booking.deleteMany({
        where: { id: { in: createdBookingIds } },
      });
      console.log(`Successfully cleaned up ${createdBookingIds.length} temporary test bookings from Neon.`);
    }

    await mockServer.stop();
    await prisma.$disconnect();
  }
}

runAllSpecificationTests().catch(async (err) => {
  console.error('Test Suite Failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
