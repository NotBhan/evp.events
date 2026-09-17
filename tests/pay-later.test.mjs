import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { PrismaClient } from '@prisma/client';
import { OPEN_BOOKING_WINDOW_ENV } from './helpers/booking-window-env.mjs';
import { createEntryQrToken, verifyEntryQrToken } from '../lib/entry-token.ts';

/**
 * Pay Later test suite.
 *
 * API/lifecycle half (real HTTP + real Neon, temporary pass, mock gateway, mock Sheets):
 *  A. a booking created without payment stays PENDING with a fixed 24-hour expiresAt
 *  B. retrieving the booking repeatedly does not restart or move the deadline
 *  C. no entry QR/token exists while unpaid; paying inside the window confirms it and
 *     the QR then appears (deterministic)
 *  D. paying after the deadline is rejected and cannot revive the booking; the expiry
 *     lifecycle then releases the reservation
 *  E. payment-versus-expiry race: never a mixed state
 *
 * UI half (real Chromium): the payment stage offers Pay Now + Pay Later, shows the exact
 * IST deadline, Pay Later switches to the pending state with continue-payment, and the
 * policy/legal links are discoverable before payment.
 *
 * All fixtures are temporary and are deleted in teardown (temporary pass + bookings);
 * no production booking, payment or sheet row is created.
 */

const prisma = new PrismaClient({ log: ['error'] });

const APP_PORT = 3067;
const APP_BASE = `http://127.0.0.1:${APP_PORT}`;
const RZP_MOCK_PORT = 3046;
const RZP_MOCK_URL = `http://127.0.0.1:${RZP_MOCK_PORT}`;
const SHEETS_MOCK_PORT = 3993;
const SHEETS_MOCK_URL = `http://127.0.0.1:${SHEETS_MOCK_PORT}/exec`;
const TEST_KEY_SECRET = 'rzp_test_paylater_secret_789';

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

function startSheetsMock() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      req.on('data', () => {});
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', action: 'inserted' }));
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
  console.log('RAAS UTSAV 2026 — PAY LATER TEST SUITE');
  console.log('================================================================\n');

  const rzpServer = await startRazorpayMock();
  const sheetsServer = await startSheetsMock();

  const appProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(APP_PORT)], {
    env: {
      ...process.env,
      ...OPEN_BOOKING_WINDOW_ENV,
      PORT: String(APP_PORT),
      NODE_ENV: 'production',
      PAYMENT_PROVIDER: 'razorpay',
      RAZORPAY_KEY_ID: 'rzp_test_paylater_123',
      RAZORPAY_KEY_SECRET: TEST_KEY_SECRET,
      RAZORPAY_API_BASE_URL: RZP_MOCK_URL,
      BOOKING_SHEETS_ENDPOINT: SHEETS_MOCK_URL,
    },
    stdio: 'pipe',
  });
  appProc.stdout.on('data', () => {});
  appProc.stderr.on('data', () => {});

  const createdBookingIds = new Set();
  let testPass = null;

  const createBookingViaApi = async () => {
    const res = await fetch(`${APP_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passId: testPass.passType,
        fullName: 'Pay Later Tester',
        phone: '9931503961',
        email: 'paylater@example.com',
      }),
    });
    const body = await res.json();
    assert.equal(res.status, 201, `booking creation must succeed (${res.status})`);
    const dbBooking = await prisma.booking.findUnique({ where: { publicId: body.bookingId } });
    createdBookingIds.add(dbBooking.id);
    const cookie = (res.headers.get('set-cookie') || '').match(/ru26_lookup_session=[^;]+/);
    return { publicId: body.bookingId, dbBooking, cookie: cookie ? cookie[0] : null, body };
  };

  const payViaMockGateway = async (publicId, cookie) => {
    const createRes = await fetch(`${APP_BASE}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ bookingId: publicId }),
    });
    const createBody = await createRes.json();
    if (createRes.status !== 200) return { status: createRes.status, body: createBody };

    const paymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
    const signature = crypto
      .createHmac('sha256', TEST_KEY_SECRET)
      .update(`${createBody.orderId}|${paymentId}`)
      .digest('hex');

    const verifyRes = await fetch(`${APP_BASE}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        bookingId: publicId,
        razorpay_payment_id: paymentId,
        razorpay_order_id: createBody.orderId,
        razorpay_signature: signature,
      }),
    });
    return { status: verifyRes.status, body: await verifyRes.json() };
  };

  try {
    await waitForServer(APP_BASE);
    console.log('  ✓ Production server ready (mock gateway + mock Sheets)\n');

    testPass = await prisma.pass.create({
      data: {
        passType: `pay-later-${Date.now()}`,
        name: 'Pay Later Tier',
        price: 1299,
        totalQuantity: 10,
        reservedQuantity: 0,
        soldQuantity: 0,
        isActive: true,
      },
    });

    // ---- A. Pay Later creation keeps the booking pending with a 24h deadline ----
    console.log('--- A. Pay Later booking: pending with a fixed 24-hour deadline ---');
    const { publicId, dbBooking, cookie } = await createBookingViaApi();
    assert.equal(dbBooking.status, 'PENDING');
    assert.equal(dbBooking.paymentStatus, 'NOT_STARTED');
    const hoursUntilExpiry = (dbBooking.expiresAt.getTime() - dbBooking.createdAt.getTime()) / 3600000;
    assert.ok(
      Math.abs(hoursUntilExpiry - 24) < 0.05,
      `expiresAt must be 24h after creation (got ${hoursUntilExpiry.toFixed(3)}h)`
    );
    const passAfterCreate = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.equal(passAfterCreate.reservedQuantity, 1, 'pending booking must hold one reserved pass');
    console.log(`  ✓ booking ${publicId} is PENDING, reserved +1, deadline = creation + 24h`);

    // ---- B. Deadline does not restart on retrieval -----------------------------
    console.log('\n--- B. Retrieval does not restart or move the deadline ---');
    const firstDetail = await (
      await fetch(`${APP_BASE}/api/bookings/${publicId}`, { headers: { Cookie: cookie } })
    ).json();
    await new Promise((r) => setTimeout(r, 1500));
    const secondDetail = await (
      await fetch(`${APP_BASE}/api/bookings/${publicId}`, { headers: { Cookie: cookie } })
    ).json();
    assert.equal(firstDetail.booking.expiresAt, secondDetail.booking.expiresAt, 'deadline must not move');
    assert.equal(
      firstDetail.booking.expiresAt,
      dbBooking.expiresAt.toISOString(),
      'displayed deadline must equal the authoritative server deadline'
    );
    assert.equal(firstDetail.booking.status, 'PENDING');
    console.log('  ✓ repeated retrieval returns the identical authoritative deadline');

    // ---- C. No QR while unpaid; QR after payment -------------------------------
    console.log('\n--- C. No entry QR before payment; QR issued after payment ---');
    assert.equal(firstDetail.booking.entryToken, undefined, 'unpaid booking must not expose an entry QR');
    const dbUnpaid = await prisma.booking.findUnique({ where: { id: dbBooking.id } });
    assert.equal(dbUnpaid.checkInStatus, 'NOT_CHECKED_IN');

    const payment = await payViaMockGateway(publicId, cookie);
    assert.equal(payment.status, 200, `payment inside the window must succeed (${payment.status})`);
    assert.equal(payment.body.success, true);
    assert.equal(payment.body.booking.status, 'CONFIRMED');
    assert.equal(payment.body.booking.paymentStatus, 'PAID');

    const paidDetail = await (
      await fetch(`${APP_BASE}/api/bookings/${publicId}`, { headers: { Cookie: cookie } })
    ).json();
    assert.ok(paidDetail.booking.entryToken, 'paid booking must expose the entry QR token');
    assert.deepEqual(verifyEntryQrToken(paidDetail.booking.entryToken), { publicId });
    assert.equal(
      paidDetail.booking.entryToken,
      createEntryQrToken(publicId),
      'issued QR must be the deterministic token for this booking'
    );
    const passAfterPay = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.equal(passAfterPay.soldQuantity, 1, 'payment must move the reserved unit into sold');
    assert.equal(passAfterPay.reservedQuantity, 0);
    console.log('  ✓ unpaid → no QR; paid within the window → CONFIRMED + deterministic QR, inventory sold');

    // ---- D. Late payment cannot revive an expired booking ----------------------
    console.log('\n--- D. Payment after the deadline is rejected; expiry releases the hold ---');
    const late = await createBookingViaApi();
    await prisma.booking.update({
      where: { id: late.dbBooking.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const latePayment = await payViaMockGateway(late.publicId, late.cookie);
    assert.equal(latePayment.status, 410, `late payment must be rejected with 410 (got ${latePayment.status})`);
    const dbAfterLate = await prisma.booking.findUnique({ where: { id: late.dbBooking.id } });
    assert.notEqual(dbAfterLate.status, 'CONFIRMED', 'late payment must never confirm the booking');
    assert.notEqual(dbAfterLate.paymentStatus, 'PAID');

    const expireRes = await fetch(`${APP_BASE}/api/bookings/expire-stale`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    assert.equal(expireRes.status, 200);
    const dbExpired = await prisma.booking.findUnique({ where: { id: late.dbBooking.id } });
    assert.equal(dbExpired.status, 'EXPIRED', 'stale hold must expire through the existing lifecycle');
    const passAfterExpiry = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.equal(passAfterExpiry.reservedQuantity, 0, 'expiry must release the reservation');

    const expiredDetail = await (
      await fetch(`${APP_BASE}/api/bookings/${late.publicId}`, { headers: { Cookie: late.cookie } })
    ).json();
    assert.equal(expiredDetail.booking.entryToken, undefined, 'expired booking must have no active QR');
    console.log('  ✓ late payment 410 → booking never confirmed; expiry released the hold; no QR');

    // ---- E. Payment-versus-expiry race ----------------------------------------
    console.log('\n--- E. Payment-versus-expiry race never yields a mixed state ---');
    const raced = await createBookingViaApi();
    await prisma.booking.update({
      where: { id: raced.dbBooking.id },
      data: { expiresAt: new Date(Date.now() - 30_000) },
    });

    const [, raceExpiry] = await Promise.allSettled([
      payViaMockGateway(raced.publicId, raced.cookie),
      fetch(`${APP_BASE}/api/bookings/expire-stale`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      }),
    ]);
    assert.equal(raceExpiry.status, 'fulfilled');

    const dbRaced = await prisma.booking.findUnique({ where: { id: raced.dbBooking.id } });
    const passRaced = await prisma.pass.findUnique({ where: { id: testPass.id } });
    if (dbRaced.status === 'CONFIRMED') {
      assert.equal(dbRaced.paymentStatus, 'PAID', 'CONFIRMED race outcome must be PAID');
      assert.equal(passRaced.soldQuantity, 2, 'CONFIRMED race outcome must have the unit in sold');
      assert.equal(passRaced.reservedQuantity, 0);
      console.log('  ✓ race resolved as CONFIRMED+PAID with inventory moved to sold');
    } else {
      assert.equal(dbRaced.status, 'EXPIRED', 'the only non-confirmed race outcome is EXPIRED');
      assert.notEqual(dbRaced.paymentStatus, 'PAID');
      assert.equal(passRaced.reservedQuantity, 0, 'EXPIRED race outcome must release the hold');
      console.log('  ✓ race resolved as EXPIRED with the reservation released');
    }

    // ---- F. Customer-facing Pay Later UI ---------------------------------------
    // No production booking is created: the desk UI is driven through the booking
    // recovery path using a temporary-pass booking. The full "submit → choose Pay
    // Later" flow would require submitting against a catalogue pass (i.e. real
    // production data), so that path is opt-in via ALLOW_LIVE_BOOKING_UI_TEST=1.
    console.log('\n--- F. Booking desk: Pay Later pending state, deadline, legal links ---');
    const uiPending = await createBookingViaApi();
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
    });
    try {
      const page = await browser.newPage();
      await page.setCookie({
        name: 'ru26_lookup_session',
        value: (uiPending.cookie || '').replace('ru26_lookup_session=', ''),
        domain: '127.0.0.1',
        path: '/',
      });
      await page.goto(
        `${APP_BASE}/booking?bookingId=${encodeURIComponent(uiPending.publicId)}`,
        { waitUntil: 'networkidle2', timeout: 30000 }
      );

      await page.waitForSelector('#payment-deadline', { timeout: 25000 });
      const pendingBanner = await page.$eval('#payment-pending-banner', (el) => el.innerText);
      assert.match(pendingBanner, /PAY LATER ACTIVE/i, 'pending state must announce Pay Later');
      assert.match(pendingBanner, /24 hours/i);
      assert.match(pendingBanner, /expires and the reserved pass is released/i, 'expiry warning must be shown');

      const deadlineText = await page.$eval('#payment-deadline', (el) => el.innerText);
      assert.match(deadlineText, /Payment deadline/i);
      assert.match(deadlineText, /IST/, 'exact deadline must be shown with an explicit IST time');

      assert.ok(await page.$('#payment-retry-btn'), 'pending state must offer continue payment');
      assert.equal(await page.$('#receipt-entry-qr'), null, 'no entry QR may appear before payment');

      const policyLinks = await page.$$eval('#payment-policy-links a', (els) =>
        els.map((e) => e.getAttribute('href'))
      );
      for (const href of ['/terms-and-conditions', '/refund-and-cancellation', '/faq', '/policies']) {
        assert.ok(policyLinks.includes(href), `payment stage must link ${href} before payment`);
      }

      // Recovery must not restart the deadline.
      await page.reload({ waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('#payment-deadline', { timeout: 25000 });
      const deadlineAfterReload = await page.$eval('#payment-deadline', (el) => el.innerText);
      assert.equal(
        deadlineAfterReload.replace(/\s+/g, ' ').trim(),
        deadlineText.replace(/\s+/g, ' ').trim(),
        'reloading the booking must show the identical deadline'
      );
      console.log('  ✓ pending state shows IST deadline + continue payment + legal links, no QR, deadline unchanged on reload');

      // Review step (payment options summary + legal links) is reachable WITHOUT
      // submitting, so this creates no booking data at all.
      const reviewPage = await browser.newPage();
      try {
        await reviewPage.goto(`${APP_BASE}/booking`, { waitUntil: 'networkidle2', timeout: 30000 });
        await reviewPage.waitForSelector('#stage-1-next-btn', { timeout: 20000 });
        await reviewPage.click('#stage-1-next-btn');
        await reviewPage.waitForSelector('#fullName', { timeout: 20000 });
        await reviewPage.type('#fullName', 'Pay Later Review Tester');
        await reviewPage.type('#email', 'pay.later.review@example.com');
        await reviewPage.type('#phone', '9876543213');
        await reviewPage.click('#stage-2-submit-btn');
        await reviewPage.waitForSelector('#stage-3-submit-btn', { timeout: 20000 });

        const reviewText = await reviewPage.$eval('#booking-desk', (el) => el.innerText);
        assert.match(reviewText, /Pay Later/i, 'review step must summarise the Pay Later option');
        assert.match(reviewText, /pay\s*now/i, 'review step must mention paying now');
        assert.match(reviewText, /24-hour/i, 'review step must mention the 24-hour hold');

        const reviewLinks = await reviewPage.$$eval('#booking-desk a[href^="/"]', (els) =>
          els.map((e) => e.getAttribute('href'))
        );
        assert.ok(reviewLinks.includes('/terms-and-conditions'), 'review step must link Terms before payment');
        assert.ok(
          reviewLinks.includes('/refund-and-cancellation'),
          'review step must link Cancellation & Refund before payment'
        );
        console.log('  ✓ review step (pre-payment) shows payment options and legal links');
      } finally {
        await reviewPage.close();
      }

      if (process.env.ALLOW_LIVE_BOOKING_UI_TEST === '1') {
        // Opt-in only: this submits a booking against a catalogue pass, which creates
        // real production data for the duration of the test. Teardown removes it and
        // restores the pass counters exactly.
        console.log('  … running opt-in full submit flow (creates and removes production data)');
        const pass = await prisma.pass.findFirst({ where: { passType: 'solo-female' } });
        const before = await prisma.pass.findUnique({ where: { id: pass.id } });

        const submitPage = await browser.newPage();
        await submitPage.goto(`${APP_BASE}/booking`, { waitUntil: 'networkidle2', timeout: 30000 });
        await submitPage.waitForSelector('#stage-1-next-btn', { timeout: 20000 });
        await submitPage.click('#stage-1-next-btn');
        await submitPage.waitForSelector('#fullName', { timeout: 20000 });
        await submitPage.type('#fullName', 'Pay Later UI Submit Test');
        await submitPage.type('#email', 'pay.later.submit@example.com');
        await submitPage.type('#phone', '9876543212');
        await submitPage.click('#stage-2-submit-btn');
        await submitPage.waitForSelector('#stage-3-submit-btn', { timeout: 20000 });

        const reviewText = await submitPage.$eval('#booking-desk', (el) => el.innerText);
        assert.match(reviewText, /pay\s*now/i, 'review step must mention Pay Now');
        assert.match(reviewText, /Pay Later/i, 'review step must mention Pay Later');

        await submitPage.click('#stage-3-submit-btn');
        await submitPage.waitForSelector('#pay-later-btn', { timeout: 25000 });
        const payLaterText = await submitPage.$eval('#pay-later-btn', (el) => el.innerText);
        assert.match(payLaterText, /PAY LATER/i);
        assert.match(payLaterText, /24 HOURS/i);

        await submitPage.click('#pay-later-btn');
        await submitPage.waitForSelector('#payment-pending-banner', { timeout: 20000 });
        const submittedIds = await submitPage.$eval('#payment-stage-card', (el) => el.innerText);
        const idMatch = submittedIds.match(/RU26-REQ-\d{4}/);
        assert.ok(idMatch, 'submitted booking id must be shown');

        const created = await prisma.booking.findUnique({ where: { publicId: idMatch[0] } });
        assert.ok(created, 'opt-in UI booking must exist in Neon');
        await prisma.booking.delete({ where: { id: created.id } });
        await prisma.pass.update({
          where: { id: pass.id },
          data: {
            reservedQuantity: before.reservedQuantity,
            soldQuantity: before.soldQuantity,
          },
        });
        console.log('  ✓ opt-in submit flow verified Pay Now + Pay Later choice (production data removed)');
      } else {
        console.log('  • full submit flow skipped (set ALLOW_LIVE_BOOKING_UI_TEST=1 to run it)');
      }
    } finally {
      await browser.close();
    }

    console.log('\n================================================================');
    console.log('✓ PAY LATER SUITE PASSED');
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
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('\n✗ PAY LATER SUITE FAILED');
  console.error(err);
  process.exit(1);
});
