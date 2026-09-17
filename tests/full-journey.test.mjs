import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { OPEN_BOOKING_WINDOW_ENV } from './helpers/booking-window-env.mjs';
import { hashCredential } from '../lib/organiser-credentials.ts';
import { createEntryQrToken, verifyEntryQrToken } from '../lib/entry-token.ts';

/**
 * Full journey (plan §39): fresh one-pass booking → Razorpay test payment (mock
 * gateway, test-mode credentials) → receipt entry QR → organiser login → scan →
 * VERIFY → CONFIRM ENTRY → Neon CHECKED_IN + Sheets mirror → rescan →
 * ALREADY_CHECKED_IN → cancelled booking's QR → BOOKING_CANCELLED.
 */

const prisma = new PrismaClient({ log: ['error'] });

const APP_PORT = 3063;
const APP_BASE = `http://127.0.0.1:${APP_PORT}`;
const RZP_MOCK_PORT = 3044;
const RZP_MOCK_URL = `http://127.0.0.1:${RZP_MOCK_PORT}`;
const SHEETS_MOCK_PORT = 3996;
const SHEETS_MOCK_URL = `http://127.0.0.1:${SHEETS_MOCK_PORT}/exec`;

const TEST_KEY_ID = 'rzp_test_journey_123';
const TEST_KEY_SECRET = 'rzp_test_journey_secret_456';

const mockOrders = new Map();

function startRazorpayMock() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        if (!req.headers.authorization?.startsWith('Basic ')) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: { description: 'Unauthorized' } }));
        }

        if (req.method === 'POST' && req.url === '/v1/orders') {
          const parsed = JSON.parse(body || '{}');
          const orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
          const order = {
            id: orderId,
            entity: 'order',
            amount: parsed.amount,
            amount_paid: 0,
            amount_due: parsed.amount,
            currency: parsed.currency || 'INR',
            receipt: parsed.receipt,
            status: 'created',
            attempts: 0,
            notes: parsed.notes || {},
            created_at: Math.floor(Date.now() / 1000),
          };
          mockOrders.set(orderId, order);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(order));
        }

        if (req.method === 'GET' && req.url?.startsWith('/v1/payments/')) {
          const paymentId = req.url.replace('/v1/payments/', '').split('?')[0];
          const order = [...mockOrders.values()].pop();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              id: paymentId,
              entity: 'payment',
              amount: order ? order.amount : 0,
              currency: 'INR',
              status: 'captured',
              order_id: order ? order.id : null,
              method: 'upi',
              amount_refunded: 0,
              refund_status: null,
              captured: true,
              vpa: 'success@razorpay',
              created_at: Math.floor(Date.now() / 1000),
            })
          );
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { description: 'Not Found' } }));
      });
    });
    server.listen(RZP_MOCK_PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

function startSheetsMock(rows) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const bookingId = data.bookingId || data.publicId;
          const row = {
            bookingId,
            entryTaken: data.entryTaken || 'NO',
            entryTime: data.entryTime || '',
            scannedBy: data.scannedBy || '',
          };
          const idx = rows.findIndex((r) => r.bookingId === bookingId);
          if (idx >= 0) rows[idx] = row;
          else rows.push(row);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'success', action: idx >= 0 ? 'updated' : 'inserted', bookingId }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', message: String(err) }));
        }
      });
    });
    server.listen(SHEETS_MOCK_PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function waitForServer(baseUrl, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/`, { method: 'GET' });
      if (res.status >= 200 && res.status < 500) return;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`Server at ${baseUrl} did not become ready within ${timeoutMs}ms`);
}

async function main() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — FULL JOURNEY: PAYMENT → QR → SCAN → ENTRY');
  console.log('================================================================\n');

  const sheetRows = [];
  const rzpServer = await startRazorpayMock();
  const sheetsServer = await startSheetsMock(sheetRows);

  const appProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(APP_PORT)], {
    env: {
      ...process.env,
      ...OPEN_BOOKING_WINDOW_ENV,
      PORT: String(APP_PORT),
      NODE_ENV: 'production',
      PAYMENT_PROVIDER: 'razorpay',
      RAZORPAY_KEY_ID: TEST_KEY_ID,
      RAZORPAY_KEY_SECRET: TEST_KEY_SECRET,
      RAZORPAY_API_BASE_URL: RZP_MOCK_URL,
      BOOKING_SHEETS_ENDPOINT: SHEETS_MOCK_URL,
    },
    stdio: 'pipe',
  });
  appProc.stdout.on('data', () => {});
  appProc.stderr.on('data', () => {});

  const createdOrganiserIds = new Set();
  const createdBookingIds = new Set();
  let testPass = null;

  try {
    await waitForServer(APP_BASE);

    testPass = await prisma.pass.create({
      data: {
        passType: `journey-${Date.now()}`,
        name: 'Journey Pass',
        price: 1499,
        totalQuantity: 5,
        reservedQuantity: 0,
        soldQuantity: 0,
        isActive: true,
      },
    });

    // ---- 1. Fresh single-pass booking -----------------------------------
    console.log('--- 1. Fresh one-pass booking (real API) ---');
    const createRes = await fetch(`${APP_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passId: testPass.passType,
        fullName: 'Journey Attendee',
        phone: '9931503977',
        email: 'journey@example.com',
        quantity: 9, // must be ignored
        unitPrice: 1,
        total: 1,
      }),
    });
    const createBody = await createRes.json();
    assert.equal(createRes.status, 201);
    assert.equal(createBody.quantity, 1, 'booking must be single-pass');
    assert.equal(createBody.totalAmount, 1499, 'authoritative price must be used');
    const publicId = createBody.bookingId;
    const customerCookieHeader = createRes.headers.get('set-cookie') || '';
    const customerCookie = (customerCookieHeader.match(/ru26_lookup_session=[^;]+/) || [])[0];
    assert.ok(customerCookie, 'customer session cookie must be issued');
    createdBookingIds.add((await prisma.booking.findUnique({ where: { publicId } })).id);
    console.log(`  ✓ Booking ${publicId} created as a single pass at ₹1499 (client tamper ignored)`);

    // ---- 2. Razorpay test payment (mock gateway) ------------------------
    console.log('\n--- 2. Razorpay test payment (mock gateway, test-mode creds) ---');
    const payCreateRes = await fetch(`${APP_BASE}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
      body: JSON.stringify({ bookingId: publicId }),
    });
    const payCreateBody = await payCreateRes.json();
    assert.equal(payCreateRes.status, 200, `payment create must succeed (${payCreateRes.status})`);
    assert.equal(payCreateBody.provider, 'razorpay');
    assert.equal(payCreateBody.amount, 1499 * 100, 'order amount must be the authoritative paise amount');
    const orderId = payCreateBody.orderId;
    console.log(`  ✓ Razorpay test order created (${orderId}) for ₹1499`);

    const paymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
    const signature = crypto
      .createHmac('sha256', TEST_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const verifyRes = await fetch(`${APP_BASE}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: customerCookie },
      body: JSON.stringify({
        bookingId: publicId,
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      }),
    });
    const verifyBody = await verifyRes.json();
    assert.equal(verifyRes.status, 200, `payment verification must succeed (${verifyRes.status})`);
    assert.equal(verifyBody.success, true);
    assert.equal(verifyBody.booking.status, 'CONFIRMED');
    assert.equal(verifyBody.booking.paymentStatus, 'PAID');
    assert.ok(verifyBody.booking.entryToken, 'payment confirmation must return the entry token for the receipt');
    console.log('  ✓ Payment verified → CONFIRMED + PAID with an entry QR token in the response');

    // ---- 3. Receipt token is deterministic and singular -----------------
    console.log('\n--- 3. Receipt QR (deterministic, exactly one) ---');
    const detailRes = await fetch(`${APP_BASE}/api/bookings/${publicId}`, {
      headers: { Cookie: customerCookie },
    });
    const detailBody = await detailRes.json();
    const entryToken = detailBody.booking.entryToken;
    assert.equal(entryToken, verifyBody.booking.entryToken, 'token must be identical on every retrieval');
    assert.equal(entryToken, createEntryQrToken(publicId));
    assert.deepEqual(verifyEntryQrToken(entryToken), { publicId });
    console.log('  ✓ Receipt exposes exactly one deterministic, verifiable entry QR');

    // ---- 4. Organiser scan → confirm entry ------------------------------
    console.log('\n--- 4. Organiser scan → CONFIRM ENTRY ---');
    const organiserLoginId = `journey-${Date.now()}`;
    const organiserPassword = 'JourneyGate#2026';
    const organiser = await prisma.organiser.create({
      data: {
        name: 'Journey Gate',
        loginId: organiserLoginId,
        credentialHash: await hashCredential(organiserPassword),
        role: 'ENTRY_SCANNER',
        gateId: 'GATE-08',
        active: true,
      },
    });
    createdOrganiserIds.add(organiser.id);

    const loginRes = await fetch(`${APP_BASE}/api/organiser/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: APP_BASE },
      body: JSON.stringify({ loginId: organiserLoginId, password: organiserPassword }),
    });
    assert.equal(loginRes.status, 200);
    const organiserCookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];

    const verifyScan = await fetch(`${APP_BASE}/api/entry/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: organiserCookie },
      body: JSON.stringify({ qrToken: entryToken }),
    });
    const verifyScanBody = await verifyScan.json();
    assert.equal(verifyScanBody.valid, true);
    assert.equal(verifyScanBody.booking.bookingId, publicId);
    console.log('  ✓ Scanner VERIFY shows the pass details (read-only)');

    const confirmRes = await fetch(`${APP_BASE}/api/entry/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: APP_BASE, Cookie: organiserCookie },
      body: JSON.stringify({ qrToken: entryToken }),
    });
    const confirmBody = await confirmRes.json();
    assert.equal(confirmBody.success, true);
    assert.equal(confirmBody.result, 'ENTRY_CONFIRMED');
    assert.equal(confirmBody.booking.scannedBy, 'GATE-08 / Journey Gate');

    const dbBooking = await prisma.booking.findUnique({ where: { publicId } });
    assert.equal(dbBooking.checkInStatus, 'CHECKED_IN');
    assert.ok(dbBooking.checkedInAt);
    assert.equal(dbBooking.checkedInById, organiser.id);

    const sheetRow = sheetRows.find((r) => r.bookingId === publicId);
    assert.ok(sheetRow, 'Sheets mirror must have received the booking');
    assert.equal(sheetRow.entryTaken, 'YES');
    assert.ok(sheetRow.entryTime);
    assert.equal(sheetRow.scannedBy, 'GATE-08 / Journey Gate');
    console.log('  ✓ ENTRY CONFIRMED in Neon + Sheets mirror (YES + entry time + organiser identity)');

    // ---- 5. Rescan → ALREADY_CHECKED_IN ---------------------------------
    console.log('\n--- 5. Rescan the same QR ---');
    const rescan = await fetch(`${APP_BASE}/api/entry/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: organiserCookie },
      body: JSON.stringify({ qrToken: entryToken }),
    });
    const rescanBody = await rescan.json();
    assert.equal(rescanBody.valid, false);
    assert.equal(rescanBody.reason, 'ALREADY_CHECKED_IN');
    assert.equal(rescanBody.booking.scannedBy, 'GATE-08 / Journey Gate');
    console.log('  ✓ Rescan → ALREADY_CHECKED_IN with the original entry record');

    // ---- 6. Cancelled booking's old QR → BOOKING_CANCELLED --------------
    console.log('\n--- 6. Cancelled booking QR at the gate ---');
    const cancelTargetRes = await fetch(`${APP_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passId: testPass.passType,
        fullName: 'Cancelled Journey Attendee',
        phone: '9931503978',
        email: 'cancel-journey@example.com',
      }),
    });
    const cancelTargetBody = await cancelTargetRes.json();
    const cancelPublicId = cancelTargetBody.bookingId;
    const cancelCookie = (cancelTargetRes.headers.get('set-cookie') || '').match(
      /ru26_lookup_session=[^;]+/
    )[0];
    const cancelTargetDb = await prisma.booking.findUnique({ where: { publicId: cancelPublicId } });
    createdBookingIds.add(cancelTargetDb.id);

    // The booking must be confirmed+paid before cancellation; do that directly
    // (the payment leg is already proven above) and sell the inventory unit.
    await prisma.booking.update({
      where: { id: cancelTargetDb.id },
      data: { status: 'CONFIRMED', paymentStatus: 'PAID', confirmedAt: new Date() },
    });
    await prisma.pass.update({
      where: { id: testPass.id },
      data: { reservedQuantity: { decrement: 1 }, soldQuantity: { increment: 1 } },
    });

    const oldQrToken = createEntryQrToken(cancelPublicId);

    const cancelRes = await fetch(`${APP_BASE}/api/bookings/${cancelPublicId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: APP_BASE, Cookie: cancelCookie },
    });
    assert.equal(cancelRes.status, 200, 'eligible booking must cancel');

    const scanCancelled = await fetch(`${APP_BASE}/api/entry/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: organiserCookie },
      body: JSON.stringify({ qrToken: oldQrToken }),
    });
    const scanCancelledBody = await scanCancelled.json();
    assert.equal(scanCancelledBody.valid, false);
    assert.equal(scanCancelledBody.reason, 'BOOKING_CANCELLED');

    const cancelledDetail = await fetch(`${APP_BASE}/api/bookings/${cancelPublicId}`, {
      headers: { Cookie: cancelCookie },
    });
    const cancelledDetailBody = await cancelledDetail.json();
    assert.equal(cancelledDetailBody.booking.entryToken, undefined, 'cancelled bookings expose no active QR');
    console.log("  ✓ Cancelled booking's old QR → BOOKING_CANCELLED; receipt exposes no active QR");

    console.log('\n================================================================');
    console.log('✓ FULL JOURNEY PASSED');
    console.log('================================================================');
  } finally {
    appProc.kill('SIGTERM');
    rzpServer.close();
    sheetsServer.close();

    if (createdBookingIds.size > 0) {
      await prisma.booking.deleteMany({ where: { id: { in: Array.from(createdBookingIds) } } });
    }
    if (testPass) {
      await prisma.booking.deleteMany({ where: { passId: testPass.id } });
      await prisma.pass.delete({ where: { id: testPass.id } });
    }
    if (createdOrganiserIds.size > 0) {
      await prisma.organiser.deleteMany({ where: { id: { in: Array.from(createdOrganiserIds) } } });
    }
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('\n✗ FULL JOURNEY FAILED');
  console.error(err);
  process.exit(1);
});
