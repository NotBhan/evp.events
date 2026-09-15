import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

const APP_PORT = 3043;
const BASE_URL = `http://127.0.0.1:${APP_PORT}`;
const MOCK_RZP_PORT = 3044;
const MOCK_RZP_URL = `http://127.0.0.1:${MOCK_RZP_PORT}`;
const COOKIE_NAME = 'ru26_lookup_session';

const testKeyId = 'rzp_test_prefill_key';
const testKeySecret = 'rzp_test_prefill_secret';

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.DATABASE_URL || 'ru26-default-dev-secret-salt-3981';
  return crypto.createHash('sha256').update(secret).digest('hex');
}
function makeToken(ids) {
  const payload = {
    sessionKey: crypto.randomBytes(16).toString('hex'),
    bookingIds: [...new Set(ids)],
    expiresAt: Date.now() + 30 * 60 * 1000,
  };
  const ser = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(ser).digest('base64url');
  return `${ser}.${sig}`;
}

function startMockRazorpayServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        if (req.method === 'POST' && req.url === '/v1/orders') {
          const parsed = JSON.parse(body || '{}');
          const orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
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
            })
          );
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { description: 'Not Found' } }));
      });
    });
    server.listen(MOCK_RZP_PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForRazorpayOpen(page, timeoutMs = 20000) {
  await page.waitForFunction('window.__razorpayOpened === true', { timeout: timeoutMs });
  return page.evaluate(() => window.__lastOptions);
}

async function main() {
  console.log('RAAS UTSAV 2026 — Razorpay Prefill Browser Regression\n');

  const testPass = await prisma.pass.findFirst({
    where: { isActive: true, totalQuantity: { gt: 10 } },
    orderBy: { price: 'asc' },
  });
  assert(testPass, 'Active pass must exist');
  const initialReserved = testPass.reservedQuantity;
  const initialSold = testPass.soldQuantity;

  let mockServer = null;
  let serverProc = null;
  let browser = null;
  const createdBookings = [];

  try {
    mockServer = await startMockRazorpayServer();
    console.log('✓ Mock Razorpay server started');

    serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(APP_PORT)], {
      env: {
        ...process.env,
        PORT: String(APP_PORT),
        NODE_ENV: 'production',
        PAYMENT_PROVIDER: 'razorpay',
        RAZORPAY_KEY_ID: testKeyId,
        RAZORPAY_KEY_SECRET: testKeySecret,
        RAZORPAY_API_BASE_URL: MOCK_RZP_URL,
      },
      stdio: 'pipe',
    });

    let ready = false;
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      try {
        const r = await fetch(`${BASE_URL}/api/bookings/lookup/clear`, { method: 'POST' });
        if (r.status === 200) { ready = true; break; }
      } catch {}
    }
    assert(ready, 'Next.js server failed to launch');
    console.log('✓ Next.js production server ready');

    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
    });

    // -----------------------------------------------------------------
    // TEST A — Recovered booking must NOT send masked prefill to Razorpay
    // -----------------------------------------------------------------
    console.log('\n[A] Recovered booking: masked email/phone must be dropped');
    const recPublicId = `RU26-PREF-REC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const recBooking = await prisma.booking.create({
      data: {
        publicId: recPublicId,
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        fullName: 'Recovery User',
        email: 'recovery@example.com',
        phone: '+91 99315 03960',
        city: 'Ranchi',
        status: 'PENDING',
        paymentStatus: 'NOT_STARTED',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    createdBookings.push(recBooking.id);
    await prisma.pass.update({ where: { id: testPass.id }, data: { reservedQuantity: { increment: 1 } } });

    const recPage = await browser.newPage();
    await recPage.setViewport({ width: 1280, height: 900 });
    await recPage.evaluateOnNewDocument(() => {
      window.Razorpay = function (options) {
        this.options = options;
        this.on = function () {};
        this.open = function () {
          window.__lastOptions = options;
          window.__razorpayOpened = true;
        };
      };
    });
    await recPage.setCookie({ name: COOKIE_NAME, value: makeToken([recPublicId]), url: BASE_URL, httpOnly: true });
    await recPage.goto(`${BASE_URL}/booking?bookingId=${recPublicId}`, { waitUntil: 'networkidle2', timeout: 45000 });
    await recPage.waitForSelector('#payment-stage-pay-btn', { timeout: 20000 });
    await recPage.click('#payment-stage-pay-btn');

    const recOptions = await waitForRazorpayOpen(recPage);
    console.log('  recovered prefill:', JSON.stringify(recOptions.prefill));
    assert.strictEqual(recOptions.prefill.name, 'Recovery User', 'name must remain genuine');
    assert.strictEqual(recOptions.prefill.email, undefined, 'masked email must not be sent');
    assert.strictEqual(recOptions.prefill.contact, undefined, 'masked phone must not be sent');
    assert.ok(!/•|\*|…/.test(JSON.stringify(recOptions.prefill)), 'no mask characters may reach prefill');
    console.log('✓ [A] Masked recovery data never reaches Razorpay prefill');
    await recPage.close();

    // -----------------------------------------------------------------
    // TEST B — Normal booking must send genuine prefill
    // -----------------------------------------------------------------
    console.log('\n[B] Normal booking: genuine email/phone must be prefilled');
    const normPage = await browser.newPage();
    await normPage.setViewport({ width: 1280, height: 900 });
    await normPage.evaluateOnNewDocument(() => {
      window.Razorpay = function (options) {
        this.options = options;
        this.on = function () {};
        this.open = function () {
          window.__lastOptions = options;
          window.__razorpayOpened = true;
        };
      };
    });
    await normPage.goto(`${BASE_URL}/booking`, { waitUntil: 'networkidle2', timeout: 45000 });

    await normPage.waitForSelector(`[data-pass-id="${testPass.passType}"]`, { timeout: 10000 });
    await normPage.click(`[data-pass-id="${testPass.passType}"]`);
    await normPage.click('#stage-1-next-btn');

    await normPage.waitForSelector('#fullName', { timeout: 10000 });
    await normPage.type('#fullName', 'Ananya Sengupta');
    await normPage.type('#phone', '9430112440');
    await normPage.type('#email', 'ananya.test@example.com');
    await normPage.click('#stage-2-submit-btn');

    await normPage.waitForSelector('#stage-3-submit-btn', { timeout: 10000 });
    await normPage.click('#stage-3-submit-btn');

    await normPage.waitForSelector('#payment-stage-pay-btn', { timeout: 20000 });
    // capture the real booking id created by the UI for cleanup
    const normPublicId = await normPage.evaluate(() => {
      const card = document.getElementById('payment-stage-card');
      const m = card ? card.innerText.match(/RU26-REQ-[A-Z0-9]+/) : null;
      return m ? m[0] : null;
    });
    if (normPublicId) {
      const b = await prisma.booking.findUnique({ where: { publicId: normPublicId } });
      if (b) createdBookings.push(b.id);
    }

    await normPage.click('#payment-stage-pay-btn');
    const normOptions = await waitForRazorpayOpen(normPage);
    console.log('  normal prefill:', JSON.stringify(normOptions.prefill));
    assert.strictEqual(normOptions.prefill.name, 'Ananya Sengupta');
    assert.strictEqual(normOptions.prefill.email, 'ananya.test@example.com');
    assert.strictEqual(normOptions.prefill.contact, '9430112440');
    console.log('✓ [B] Genuine contact data is prefilled');
    await normPage.close();

    console.log('\nAll Razorpay prefill browser regressions passed.');
  } finally {
    console.log('[Cleanup]');
    if (browser) await browser.close();
    if (createdBookings.length) {
      await prisma.paymentAttempt.deleteMany({ where: { bookingId: { in: createdBookings } } });
      await prisma.booking.deleteMany({ where: { id: { in: createdBookings } } });
    }
    await prisma.pass.update({
      where: { id: testPass.id },
      data: { reservedQuantity: initialReserved, soldQuantity: initialSold },
    });
    console.log('  restored inventory:', initialReserved, 'reserved /', initialSold, 'sold');
    if (serverProc) serverProc.kill('SIGKILL');
    if (mockServer) mockServer.close();
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error('PREFILL BROWSER TEST FAILURE:', e);
  await prisma.$disconnect();
  process.exit(1);
});
