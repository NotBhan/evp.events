import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { OPEN_BOOKING_WINDOW_ENV } from './helpers/booking-window-env.mjs';
import { hashCredential } from '../lib/organiser-credentials.ts';
import { createEntryQrToken } from '../lib/entry-token.ts';

/**
 * Verifies that a gate check-in UPDATES the existing Google Sheets row in place
 * (Entry Taken: NO -> YES, with Entry Time + Scanned By) instead of appending a
 * second row, and that a duplicate scan writes nothing.
 *
 * The app under test runs its REAL lib/sheets.ts mirror path; the endpoint is a mock
 * that reproduces the deployed Code.gs behaviour: 14 columns A–N, full-row upsert
 * keyed on Column B (Booking ID), entry columns written only when Entry Taken = YES.
 */

const prisma = new PrismaClient({ log: ['error'] });
const APP_PORT = 3070;
const APP_BASE = `http://127.0.0.1:${APP_PORT}`;
const RZP_PORT = 3047;
const RZP_URL = `http://127.0.0.1:${RZP_PORT}`;
const SHEETS_PORT = 3992;
const SHEETS_URL = `http://127.0.0.1:${SHEETS_PORT}/exec`;
const KEY_SECRET = 'rzp_test_sheet_update_secret';

const HEADERS = [
  'Timestamp', 'Booking ID', 'Pass Type', 'Quantity', 'Unit Price', 'Total', 'Full Name',
  'WhatsApp / Mobile', 'Email', 'Submission Status', 'Source', 'Entry Taken', 'Entry Time', 'Scanned By',
];

const mockOrders = new Map();
const sheet = { rows: [], writes: [], actions: [] };

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
          mockOrders.set(orderId, { id: orderId, amount: parsed.amount, currency: 'INR' });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ id: orderId, entity: 'order', amount: parsed.amount, amount_due: parsed.amount, currency: 'INR', status: 'created', created_at: Math.floor(Date.now() / 1000) }));
        }
        if (req.method === 'GET' && req.url?.startsWith('/v1/payments/')) {
          const paymentId = req.url.replace('/v1/payments/', '').split('?')[0];
          const order = [...mockOrders.values()].pop();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ id: paymentId, entity: 'payment', amount: order?.amount ?? 0, currency: 'INR', status: 'captured', order_id: order?.id ?? null, amount_refunded: 0, captured: true, created_at: Math.floor(Date.now() / 1000) }));
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { description: 'Not Found' } }));
      });
    });
    server.listen(RZP_PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

/** Faithful mock of the deployed Apps Script: 14-column full-row upsert by Column B. */
function startSheetsMock() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const data = JSON.parse(body || '{}');
        const isCheckedIn = data.entryTaken === 'YES';
        const row = [
          data.timestamp, data.bookingId, data.passType, data.quantity, data.unitPrice, data.total,
          data.fullName, data.phone, data.email, data.submissionStatus, data.source,
          isCheckedIn ? 'YES' : 'NO',
          isCheckedIn ? data.entryTime || '' : '',
          isCheckedIn ? data.scannedBy || '' : '',
        ];
        const existing = sheet.rows.findIndex((r) => r[1] === data.bookingId);
        const action = existing >= 0 ? 'updated' : 'inserted';
        if (existing >= 0) sheet.rows[existing] = row;
        else sheet.rows.push(row);

        sheet.writes.push({ bookingId: data.bookingId, entryTaken: row[11], entryTime: row[12], scannedBy: row[13] });
        sheet.actions.push(action);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', action, bookingId: data.bookingId }));
      });
    });
    server.listen(SHEETS_PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function waitForServer(base, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${base}/`, { method: 'GET' });
      if (res.status >= 200 && res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${base} not ready`);
}

async function main() {
  console.log('================================================================');
  console.log('SHEETS CHECK-IN UPDATE VERIFICATION (Entry Taken NO -> YES, in place)');
  console.log('================================================================\n');

  const rzp = await startRazorpayMock();
  const sheets = await startSheetsMock();

  const app = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(APP_PORT)], {
    env: {
      ...process.env,
      ...OPEN_BOOKING_WINDOW_ENV,
      PORT: String(APP_PORT),
      NODE_ENV: 'production',
      PAYMENT_PROVIDER: 'razorpay',
      RAZORPAY_KEY_ID: 'rzp_test_sheet_update',
      RAZORPAY_KEY_SECRET: KEY_SECRET,
      RAZORPAY_API_BASE_URL: RZP_URL,
      BOOKING_SHEETS_ENDPOINT: SHEETS_URL,
    },
    stdio: 'pipe',
  });
  app.stdout.on('data', () => {});
  app.stderr.on('data', () => {});

  const createdBookingIds = new Set();
  const createdOrganiserIds = new Set();
  let testPass = null;

  try {
    await waitForServer(APP_BASE);

    testPass = await prisma.pass.create({
      data: { passType: `sheet-update-${Date.now()}`, name: 'Sheet Update Tier', price: 999, totalQuantity: 5, reservedQuantity: 0, soldQuantity: 0, isActive: true },
    });

    // 1. Book + pay -> the row is created with Entry Taken = NO and blank entry columns
    const createRes = await fetch(`${APP_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passId: testPass.passType, fullName: 'Sheet Update Attendee', phone: '9931503955', email: 'sheet-update@example.com' }),
    });
    const { bookingId: publicId } = await createRes.json();
    const cookie = ((createRes.headers.get('set-cookie') || '').match(/ru26_lookup_session=[^;]+/) || [])[0];
    const dbBooking = await prisma.booking.findUnique({ where: { publicId } });
    createdBookingIds.add(dbBooking.id);

    const orderRes = await fetch(`${APP_BASE}/api/payments/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ bookingId: publicId }),
    });
    const order = await orderRes.json();
    const paymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
    const signature = crypto.createHmac('sha256', KEY_SECRET).update(`${order.orderId}|${paymentId}`).digest('hex');
    const verifyRes = await fetch(`${APP_BASE}/api/payments/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ bookingId: publicId, razorpay_payment_id: paymentId, razorpay_order_id: order.orderId, razorpay_signature: signature }),
    });
    assert.equal(verifyRes.status, 200, 'payment verification must succeed');

    const rowAfterPayment = sheet.rows.find((r) => r[1] === publicId);
    assert.ok(rowAfterPayment, 'payment must create the sheet row');
    assert.equal(rowAfterPayment.length, 14, 'row must have all 14 columns');
    assert.equal(rowAfterPayment[11], 'NO', 'Entry Taken must be NO before check-in');
    assert.equal(rowAfterPayment[12], '', 'Entry Time must be blank before check-in');
    assert.equal(rowAfterPayment[13], '', 'Scanned By must be blank before check-in');
    assert.equal(sheet.actions[0], 'inserted');
    console.log('  ✓ after payment: 1 row, Entry Taken = NO, Entry Time / Scanned By blank');
    const rowBeforeCheckin = [...rowAfterPayment];
    const rowsBeforeCheckin = sheet.rows.length;

    // 2. Check in at the gate (real confirm path, organiser session + QR token)
    const organiser = await prisma.organiser.create({
      data: { name: 'Sheet Update Scanner', loginId: `sheet-update-${Date.now()}`, credentialHash: await hashCredential('SheetUpdate#2026'), role: 'ENTRY_SCANNER', gateId: 'GATE-11', active: true },
    });
    createdOrganiserIds.add(organiser.id);
    const loginRes = await fetch(`${APP_BASE}/api/organiser/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: APP_BASE },
      body: JSON.stringify({ loginId: organiser.loginId, password: 'SheetUpdate#2026' }),
    });
    const orgCookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];

    const confirmRes = await fetch(`${APP_BASE}/api/entry/confirm`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: APP_BASE, Cookie: orgCookie },
      body: JSON.stringify({ qrToken: createEntryQrToken(publicId) }),
    });
    const confirm = await confirmRes.json();
    assert.equal(confirm.result, 'ENTRY_CONFIRMED', `check-in must succeed (${confirm.result})`);

    const dbAfter = await prisma.booking.findUnique({ where: { publicId } });
    assert.equal(dbAfter.sheetSyncStatus, 'SYNCED', 'check-in mirror must succeed against the mock');

    assert.equal(sheet.rows.length, rowsBeforeCheckin, 'check-in must NOT append a second row');
    const rowAfterCheckin = sheet.rows.find((r) => r[1] === publicId);
    assert.equal(rowAfterCheckin[11], 'YES', 'Entry Taken must flip to YES');
    assert.ok(rowAfterCheckin[12], 'Entry Time must be populated on check-in');
    assert.equal(
      new Date(rowAfterCheckin[12]).toISOString(),
      dbAfter.checkedInAt.toISOString(),
      'Entry Time must equal the server entry timestamp'
    );
    assert.equal(rowAfterCheckin[13], 'GATE-11 / Sheet Update Scanner', 'Scanned By must be the organiser identity');

    // every non-entry column must be untouched by the update
    const changed = rowAfterCheckin
      .map((v, i) => (String(v) === String(rowBeforeCheckin[i]) ? null : i))
      .filter((i) => i !== null);
    assert.deepEqual(changed, [11, 12, 13], `only columns L/M/N may change (changed: ${JSON.stringify(changed)})`);
    assert.equal(sheet.actions[1], 'updated', 'the second write must be an UPDATE of the same row');
    console.log('  ✓ after check-in: same single row, Entry Taken = YES + Entry Time + Scanned By; other 11 columns untouched (action=updated)');

    // 3. Duplicate scan -> rejected, no sheet write
    const writesBeforeRescan = sheet.writes.length;
    const rescan = await fetch(`${APP_BASE}/api/entry/confirm`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: APP_BASE, Cookie: orgCookie },
      body: JSON.stringify({ qrToken: createEntryQrToken(publicId) }),
    });
    const rescanBody = await rescan.json();
    assert.equal(rescanBody.result, 'ALREADY_CHECKED_IN');
    assert.equal(sheet.writes.length, writesBeforeRescan, 'a duplicate scan must not write to the sheet again');
    assert.equal(sheet.rows.length, rowsBeforeCheckin, 'no row may be added by a duplicate scan');
    console.log('  ✓ duplicate scan: ALREADY_CHECKED_IN, no extra sheet write, still one row');

    console.log('\n  sheet writes observed:', JSON.stringify(sheet.writes));
    console.log('\n================================================================');
    console.log('✓ SHEETS CHECK-IN UPDATE VERIFIED');
    console.log('================================================================');
  } finally {
    app.kill('SIGTERM');
    rzp.close();
    sheets.close();
    if (createdBookingIds.size > 0) await prisma.booking.deleteMany({ where: { id: { in: Array.from(createdBookingIds) } } });
    if (testPass) {
      await prisma.booking.deleteMany({ where: { passId: testPass.id } });
      await prisma.pass.delete({ where: { id: testPass.id } });
    }
    if (createdOrganiserIds.size > 0) await prisma.organiser.deleteMany({ where: { id: { in: Array.from(createdOrganiserIds) } } });
    await prisma.$disconnect();
  }
}

console.log('headers expected in the live sheet:', HEADERS.join(' | '));
main().catch((err) => {
  console.error('\n✗ SHEETS CHECK-IN UPDATE VERIFICATION FAILED');
  console.error(err);
  process.exit(1);
});
