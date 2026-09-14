import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PORT = 3038;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const MOCK_RZP_PORT = 3040;
const MOCK_RZP_URL = `http://127.0.0.1:${MOCK_RZP_PORT}`;

const testKeyId = 'rzp_test_browser_key_999';
const testKeySecret = 'rzp_test_browser_secret_888';
const testWebhookSecret = 'rzp_test_browser_webhook_777';

const mockOrders = new Map();
const mockPayments = new Map();

function generateRazorpayCheckoutSignature(orderId, paymentId, keySecret) {
  return crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

function startMockRazorpayServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Basic ')) {
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

          // Pre-register captured payment for this order
          const payId = `pay_succ_${orderId}`;
          mockPayments.set(payId, {
            id: payId,
            entity: 'payment',
            amount: parsed.amount,
            currency: parsed.currency || 'INR',
            status: 'captured',
            order_id: orderId,
            invoice_id: null,
            international: false,
            method: 'upi',
            amount_refunded: 0,
            refund_status: null,
            captured: true,
            description: null,
            card_id: null,
            bank: null,
            wallet: null,
            vpa: 'success@razorpay',
            email: 'ananya.test@example.com',
            contact: '+919430112440',
            fee: 0,
            tax: 0,
            error_code: null,
            error_description: null,
            created_at: Math.floor(Date.now() / 1000),
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(order));
        }

        if (req.method === 'GET' && req.url?.startsWith('/v1/payments/')) {
          const paymentId = req.url.replace('/v1/payments/', '').split('?')[0];
          const payment = mockPayments.get(paymentId);
          if (payment) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(payment));
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              id: paymentId,
              entity: 'payment',
              amount: 149900,
              currency: 'INR',
              status: 'captured',
              order_id: null,
              invoice_id: null,
              international: false,
              method: 'upi',
              amount_refunded: 0,
              refund_status: null,
              captured: true,
              description: null,
              card_id: null,
              bank: null,
              wallet: null,
              vpa: 'success@razorpay',
              email: 'ananya.test@example.com',
              contact: '+919430112440',
              fee: 0,
              tax: 0,
              error_code: null,
              error_description: null,
              created_at: Math.floor(Date.now() / 1000),
            })
          );
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { description: 'Not Found' } }));
      });
    });

    server.listen(MOCK_RZP_PORT, '127.0.0.1', () => {
      resolve(server);
    });
    server.on('error', reject);
  });
}

async function runBrowserRazorpayTest() {
  console.log('================================================================');
  console.log('BROWSER TEST: REAL CHROMIUM E2E RAZORPAY PAYMENT & COMPLETION UX');
  console.log('================================================================\n');

  let mockServer = null;
  let serverProc = null;
  let browser = null;
  let testPass = null;
  let initialReserved = 0;
  let initialSold = 0;
  let createdBookingPublicId = null;

  try {
    // Locate VIP pass in Neon
    testPass = await prisma.pass.findFirst({
      where: { isActive: true, totalQuantity: { gt: 10 } },
      orderBy: { price: 'asc' },
    });
    assert(testPass, 'Test pass must exist');
    initialReserved = testPass.reservedQuantity;
    initialSold = testPass.soldQuantity;

    console.log(`[Setup] Using pass "${testPass.name}" (price: ₹${testPass.price})`);

    // Start mock server
    mockServer = await startMockRazorpayServer();
    console.log(`[Setup] Mock Razorpay server running on ${MOCK_RZP_URL}`);

    // Launch Next.js on port 3038
    console.log(`[Setup] Launching Next.js on port ${PORT}...`);
    serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
      env: {
        ...process.env,
        PORT: String(PORT),
        NODE_ENV: 'production',
        PAYMENT_PROVIDER: 'razorpay',
        RAZORPAY_KEY_ID: testKeyId,
        RAZORPAY_KEY_SECRET: testKeySecret,
        RAZORPAY_WEBHOOK_SECRET: testWebhookSecret,
        RAZORPAY_API_BASE_URL: MOCK_RZP_URL,
      },
      stdio: 'pipe',
    });

    let ready = false;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const res = await fetch(`${BASE_URL}/api/bookings/lookup/clear`, { method: 'POST' });
        if (res.status === 200) {
          ready = true;
          break;
        }
      } catch {}
    }
    assert(ready, 'Next.js server failed to launch');
    console.log('✓ Next.js server ready\n');

    // Launch Chromium
    console.log('[Browser] Launching Chromium...');
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    page.on('console', (msg) => {
      const text = msg.text();
      if (!text.includes('Download the React DevTools') && !text.includes('[Fast Refresh]')) {
        console.log('  [Browser Console]', text);
      }
    });
    page.on('pageerror', (err) => console.log('  [Browser Error]', err.message));
    page.on('response', async (res) => {
      if (res.request().method() === 'POST') {
        const text = await res.text().catch(() => '');
        console.log(`  [Network] POST ${res.url()} -> ${res.status()}: ${text.slice(0, 200)}`);
      }
    });

    // Inject mock window.Razorpay checkout client
    await page.evaluateOnNewDocument((secret) => {
      window.__validSecret = secret;

      async function computeHmacSha256(sec, data) {
        const enc = new TextEncoder();
        const key = await window.crypto.subtle.importKey(
          'raw',
          enc.encode(sec),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(data));
        return Array.from(new Uint8Array(signature))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }

      window.Razorpay = function (options) {
        this.options = options;
        this.on = function (event, handler) {
          this._eventHandlers = this._eventHandlers || {};
          this._eventHandlers[event] = handler;
        };
        this.open = async function () {
          window.__razorpayOpened = true;
          window.__lastOptions = options;

          const orderId = options.order_id;
          const paymentId = `pay_succ_${orderId}`;

          if (window.__triggerCheckoutSuccess) {
            const signature = await computeHmacSha256(window.__validSecret, `${orderId}|${paymentId}`);
            setTimeout(() => {
              if (typeof options.handler === 'function') {
                options.handler({
                  razorpay_payment_id: paymentId,
                  razorpay_order_id: orderId,
                  razorpay_signature: signature,
                });
              }
            }, 200);
          } else if (window.__triggerCheckoutDismiss) {
            setTimeout(() => {
              if (options.modal && typeof options.modal.ondismiss === 'function') {
                options.modal.ondismiss();
              }
            }, 200);
          }
        };
      };
    }, testKeySecret);

    // Navigate to /booking
    console.log('1. Navigating to /booking...');
    await page.goto(`${BASE_URL}/booking`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Step 1: Select pass & continue
    console.log(`2. Step 1: Selecting pass "${testPass.name}" and clicking Enter Attendee Details...`);
    const passCard = await page.waitForSelector(`[data-pass-id="${testPass.passType}"]`, { timeout: 10000 });
    await passCard.click();
    console.log(`  ✓ Selected pass card for "${testPass.name}"`);

    const step1Btn = await page.waitForSelector('#stage-1-next-btn', { timeout: 10000 });
    await step1Btn.click();

    // Step 2: Fill attendee details
    console.log('3. Step 2: Entering attendee details...');
    await page.waitForSelector('#fullName', { timeout: 10000 });
    await page.type('#fullName', 'Ananya Sengupta');
    await page.type('#phone', '9430112440');
    await page.type('#email', 'ananya.test@example.com');

    const step2Btn = await page.waitForSelector('#stage-2-submit-btn', { timeout: 10000 });
    await step2Btn.click();

    // Step 3: Review Reservation
    console.log('4. Step 3: Reviewing reservation and submitting...');
    const step3Btn = await page.waitForSelector('#stage-3-submit-btn', { timeout: 10000 });
    await step3Btn.click();

    // 5. Dedicated PAYMENT Stage UI (Direct transition from Step 3)
    console.log('5. Waiting for Dedicated PAYMENT Stage UI (#payment-stage-card)...');
    await page.waitForSelector('#payment-stage-card', { timeout: 15000 });
    console.log('  ✓ Dedicated payment stage card rendered (#payment-stage-card)');

    // Extract booking ID
    const bookingIdText = await page.evaluate(() => {
      const card = document.getElementById('payment-stage-card');
      const match = card ? card.innerText.match(/RU26-REQ-[A-Z0-9]+/) : null;
      return match ? match[0] : null;
    });
    assert(bookingIdText, 'Booking ID must be found on payment stage');
    createdBookingPublicId = bookingIdText;
    console.log(`  ✓ Authoritative Booking ID: ${createdBookingPublicId}`);

    // Verify displayed fields on payment stage card
    console.log('6. Verifying elements on Payment Stage card...');
    const paymentStageInfo = await page.evaluate(() => {
      const card = document.getElementById('payment-stage-card');
      const text = card ? card.innerText : '';
      return {
        hasBookingId: text.includes('RU26-REQ-'),
        hasAmount: text.includes('₹'),
        hasExpiry: text.includes('HELD FOR') || text.includes('EXPIRED') || text.includes('h '),
        hasStatus: text.includes('NOT_STARTED') || text.includes('PENDING') || text.includes('Pending'),
        hasPayButton: Boolean(document.getElementById('payment-stage-pay-btn')),
        buttonText: document.getElementById('payment-stage-pay-btn')?.innerText || '',
      };
    });

    assert(paymentStageInfo.hasBookingId, 'Payment stage must display Booking ID');
    assert(paymentStageInfo.hasAmount, 'Payment stage must display Amount Payable');
    assert(paymentStageInfo.hasExpiry, 'Payment stage must display Expiry / Remaining Time');
    assert(paymentStageInfo.hasPayButton, 'Payment stage must have Pay button');
    console.log(`  ✓ Payment Stage elements verified! Button: "${paymentStageInfo.buttonText}"`);

    // 7. Test Checkout Dismiss / Cancel flow
    console.log('\n7. Testing Checkout Dismiss / Cancel flow...');
    await page.evaluate(() => {
      window.__triggerCheckoutDismiss = true;
      window.__triggerCheckoutSuccess = false;
    });

    const payBtn = await page.waitForSelector('#payment-stage-pay-btn', { timeout: 10000 });
    await payBtn.click();

    // Wait for Payment Pending banner
    await page.waitForSelector('#payment-pending-banner', { timeout: 10000 });
    console.log('  ✓ Dismissed checkout displays "Payment Pending" banner (#payment-pending-banner)');
    const pendingText = await page.evaluate(() => document.getElementById('payment-pending-banner')?.innerText || '');
    assert(pendingText.includes('safely held') || pendingText.includes('held'), 'Pending banner must mention held reservation');

    // Verify Neon state: Booking remains PENDING
    const bookingAfterDismiss = await prisma.booking.findUnique({
      where: { publicId: createdBookingPublicId },
    });
    assert.strictEqual(bookingAfterDismiss.status, 'PENDING', 'Booking must remain PENDING on dismissal');
    console.log('  ✓ Booking remains PENDING in Neon database');

    // 8. Test Payment Success & Confirmation Flow
    console.log('\n8. Testing Payment Success & Confirmation Flow...');
    await page.evaluate(() => {
      window.__triggerCheckoutDismiss = false;
      window.__triggerCheckoutSuccess = true;
    });

    // Click retry/complete payment button
    const retryBtn = await page.waitForSelector('#payment-retry-btn', { timeout: 10000 });
    await retryBtn.click();

    console.log('  ✓ Clicked Complete Payment. Awaiting verification and confirmation...');

    // Wait for Confirmed Receipt
    await page.waitForSelector('#confirmed-receipt-document', { timeout: 15000 });
    console.log('  ✓ Confirmed Receipt document rendered (#confirmed-receipt-document)!');

    const confirmedReceiptText = await page.evaluate(() => {
      const doc = document.getElementById('confirmed-receipt-document');
      return doc ? doc.innerText : '';
    });

    assert(confirmedReceiptText.includes(createdBookingPublicId), 'Receipt must display Booking ID');
    assert(confirmedReceiptText.includes('PAID'), 'Receipt must display payment status PAID');
    console.log('  ✓ Confirmed Receipt contains authoritative Booking ID and "PAID" status');

    // 9. Verify Neon Database State
    console.log('\n9. Verifying Neon database final state...');
    const finalBooking = await prisma.booking.findUnique({
      where: { publicId: createdBookingPublicId },
      include: { paymentAttempts: true },
    });
    assert.strictEqual(finalBooking.status, 'CONFIRMED', 'Neon booking status must be CONFIRMED');
    assert.strictEqual(finalBooking.paymentStatus, 'PAID', 'Neon paymentStatus must be PAID');
    assert.ok(finalBooking.confirmedAt, 'Neon confirmedAt must be set');

    const successfulAttempt = finalBooking.paymentAttempts.find((a) => a.status === 'SUCCEEDED');
    assert(successfulAttempt, 'Neon must contain a SUCCEEDED PaymentAttempt');
    assert.strictEqual(successfulAttempt.provider, 'razorpay');
    console.log(`  ✓ Neon booking is CONFIRMED, PaymentAttempt SUCCEEDED (Attempts count: ${finalBooking.paymentAttempts.length})`);

    // Verify Inventory: exactly 1 ticket sold, 0 reserved
    const passAfterTest = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.strictEqual(
      passAfterTest.soldQuantity,
      initialSold + 1,
      'Pass soldQuantity must increment by 1'
    );
    assert.strictEqual(
      passAfterTest.reservedQuantity,
      initialReserved,
      'Pass reservedQuantity must return to original after sale'
    );
    console.log('  ✓ Neon inventory transition exact: reserved -1, sold +1');

    console.log('\n================================================================');
    console.log('🎉 FULL CHROMIUM E2E RAZORPAY BROWSER FLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ BROWSER TEST FAILURE:', err);
    throw err;
  } finally {
    console.log('[Cleanup] Cleaning up browser test resources...');
    if (browser) await browser.close();

    if (createdBookingPublicId) {
      await prisma.paymentAttempt.deleteMany({
        where: { booking: { publicId: createdBookingPublicId } },
      });
      await prisma.booking.deleteMany({
        where: { publicId: createdBookingPublicId },
      });
    }

    if (testPass) {
      await prisma.pass.update({
        where: { id: testPass.id },
        data: {
          reservedQuantity: initialReserved,
          soldQuantity: initialSold,
        },
      });
      console.log('[Cleanup] Restored Neon pass inventory');
    }

    if (serverProc) {
      serverProc.kill('SIGTERM');
    }

    if (mockServer) {
      mockServer.close();
    }

    await prisma.$disconnect();
  }
}

runBrowserRazorpayTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
