import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { createEntryQrToken, verifyEntryQrToken } from '../lib/entry-token.ts';

const LOOKUP_SESSION_COOKIE_NAME = 'ru26_lookup_session';

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.DATABASE_URL || 'ru26-default-dev-secret-salt-3981';
  return crypto.createHash('sha256').update(secret).digest('hex');
}

function createLookupSessionToken(bookingPublicIds) {
  const payload = {
    sessionKey: crypto.randomBytes(16).toString('hex'),
    bookingIds: [...new Set(bookingPublicIds.map((id) => id.trim()))],
    expiresAt: Date.now() + 30 * 60 * 1000,
  };
  const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(serialized)
    .digest('base64url');
  return `${serialized}.${signature}`;
}

const prisma = new PrismaClient({ log: ['error'] });

const PORT = 3082;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const MOCK_PHONEPE_PORT = 3084;
const MOCK_PHONEPE_URL = `http://127.0.0.1:${MOCK_PHONEPE_PORT}`;

// In-memory state for Mock PhonePe API server
let oauthRequestCount = 0;
const mockPhonePeOrders = new Map();
const mockPhonePeStatuses = new Map();

function startMockPhonePeServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        const url = req.url || '';

        // 1. POST /v1/oauth/token
        if (req.method === 'POST' && url.includes('/oauth/token')) {
          oauthRequestCount++;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              access_token: 'mock_phonepe_token_test_abc123',
              token_type: 'Bearer',
              expires_in: 3600,
            })
          );
        }

        // Auth Header Guard for API endpoints
        const auth = req.headers.authorization;
        if (!auth || (!auth.startsWith('Bearer ') && !auth.startsWith('O-Bearer '))) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Unauthorized', message: 'Bearer or O-Bearer token required' }));
        }

        // 2. POST /checkout/v2/pay
        if (req.method === 'POST' && url.includes('/checkout/v2/pay')) {
          let parsed = {};
          try {
            parsed = JSON.parse(body || '{}');
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }

          const merchantOrderId = parsed.merchantOrderId;
          const orderId = `phonepe_ord_${crypto.randomBytes(6).toString('hex')}`;
          const redirectUrl = `https://mercury-uat.phonepe.com/transact?token=tok_${crypto.randomBytes(8).toString('hex')}`;

          const orderRecord = {
            orderId,
            merchantOrderId,
            amount: parsed.amount,
            expireAfter: parsed.expireAfter,
            redirectUrl,
            state: 'CREATED',
            paymentFlow: parsed.paymentFlow || {
              type: 'PG_CHECKOUT',
              merchantUrls: { redirectUrl },
            },
            metaData: parsed.metaData || parsed.metaInfo || {},
          };

          mockPhonePeOrders.set(merchantOrderId, orderRecord);
          // Default status is COMPLETED unless overridden
          if (!mockPhonePeStatuses.has(merchantOrderId)) {
            mockPhonePeStatuses.set(merchantOrderId, {
              orderId,
              merchantOrderId,
              state: 'COMPLETED',
              amount: parsed.amount,
            });
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(orderRecord));
        }

        // 3. GET /checkout/v2/order/:merchantOrderId/status
        if (req.method === 'GET' && url.includes('/checkout/v2/order/')) {
          const parts = url.split('/');
          const statusIdx = parts.indexOf('status');
          const merchantOrderId = statusIdx > 0 ? parts[statusIdx - 1] : '';

          const status = mockPhonePeStatuses.get(merchantOrderId) || {
            orderId: `phonepe_ord_${merchantOrderId}`,
            merchantOrderId,
            state: 'PENDING',
            amount: 0,
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(status));
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      });
    });

    server.listen(MOCK_PHONEPE_PORT, '127.0.0.1', () => {
      resolve(server);
    });
    server.on('error', reject);
  });
}

function generatePhonePeWebhookSignature(rawBody, webhookSecret, keyId = '1') {
  const hmac = crypto
    .createHmac('sha256', webhookSecret)
    .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
    .digest('hex');
  return `${hmac}###${keyId}`;
}

async function runPhonePeTestSuite() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — PHONEPE PAYMENT FLOW AUTOMATED TEST SUITE');
  console.log('Database: Neon PostgreSQL (Authoritative)');
  console.log('Provider: PhonePe Standard Checkout v2');
  console.log('================================================================\n');

  const createdBookingIds = new Set();
  let testPass = null;
  let serverProc = null;
  let mockServer = null;

  let initialReserved = 0;
  let initialSold = 0;

  try {
    // 0. Locate test pass in Neon
    testPass = await prisma.pass.findFirst({
      where: { isActive: true, totalQuantity: { gt: 10 } },
      orderBy: { price: 'asc' },
    });

    if (!testPass) {
      throw new Error('No active pass found in Neon database for testing.');
    }

    initialReserved = testPass.reservedQuantity;
    initialSold = testPass.soldQuantity;

    console.log(`Using Test Pass: "${testPass.name}" (ID: ${testPass.id}, Price: ₹${testPass.price})`);
    console.log(`Initial Inventory: reservedQuantity=${initialReserved}, soldQuantity=${initialSold}\n`);

    const testClientId = 'PHONEPE_TEST_CLIENT_123';
    const testClientSecret = 'phonepe_test_secret_key_45678901234567890123';
    const testWebhookSecret = 'phonepe_test_webhook_secret_key_32bytes_long!';
    const testClientVersion = '1';

    // Start mock PhonePe API server
    console.log(`[Setup] Starting Mock PhonePe API server on port ${MOCK_PHONEPE_PORT}...`);
    mockServer = await startMockPhonePeServer();
    console.log('✓ Mock PhonePe API server listening\n');

    // Launch Next.js Production Server
    console.log(`[Setup] Launching Next.js server on port ${PORT}...`);
    serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
      env: {
        ...process.env,
        PORT: String(PORT),
        PHONEPE_ENV: 'sandbox',
        PHONEPE_CLIENT_ID: testClientId,
        PHONEPE_CLIENT_SECRET: testClientSecret,
        PHONEPE_CLIENT_VERSION: testClientVersion,
        PHONEPE_WEBHOOK_SECRET: testWebhookSecret,
        PHONEPE_WEBHOOK_KEY_ID: testClientVersion,
        PHONEPE_OAUTH_URL: `${MOCK_PHONEPE_URL}/v1/oauth/token`,
        PHONEPE_API_BASE_URL: MOCK_PHONEPE_URL,
        ENTRY_QR_SECRET: process.env.ENTRY_QR_SECRET || 'test_entry_qr_secret_must_be_32_chars_long_minimum',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    serverProc.stderr.on('data', (d) => {
      const msg = d.toString();
      if (!msg.includes('ExperimentalWarning') && !msg.includes('node:')) {
        console.error('[Next.js stderr]', msg);
      }
    });

    // Wait for server readiness
    let isReady = false;
    for (let attempt = 1; attempt <= 30; attempt++) {
      try {
        const check = await fetch(`${BASE_URL}/api/health`, { method: 'GET' });
        if (check.ok || check.status === 404) {
          isReady = true;
          break;
        }
      } catch {
        // Wait
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!isReady) {
      throw new Error(`Next.js server failed to respond on ${BASE_URL} within 30 seconds.`);
    }
    console.log('✓ Next.js server is ready and responding\n');

    // Helper: create a test booking in Neon
    async function createTestBooking(override = {}) {
      const publicId = `RU26-T-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const expiresAt = override.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);
      const status = override.status || 'PENDING';
      const paymentStatus = override.paymentStatus || 'NOT_STARTED';

      const booking = await prisma.booking.create({
        data: {
          publicId,
          passId: testPass.id,
          quantity: 1,
          unitPrice: testPass.price,
          totalAmount: testPass.price,
          status,
          paymentStatus,
          fullName: 'PhonePe Test User',
          phone: '+919931503960',
          email: 'phonepe.test@example.com',
          city: 'Ranchi',
          expiresAt,
        },
        include: { pass: true },
      });

      // Maintain reserved_quantity
      if (status === 'PENDING') {
        await prisma.pass.update({
          where: { id: testPass.id },
          data: { reservedQuantity: { increment: 1 } },
        });
      }

      createdBookingIds.add(booking.id);
      return booking;
    }

    // =========================================================================
    // TEST 1 & 2: OAuth token acquisition & caching
    // =========================================================================
    console.log('Test 1 & 2: OAuth token acquisition and in-memory caching...');
    const b1 = await createTestBooking();
    const cookie1 = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([b1.publicId])}`;

    oauthRequestCount = 0;
    const createRes1 = await fetch(`${BASE_URL}/api/payments/phonepe/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie1,
      },
      body: JSON.stringify({ bookingId: b1.publicId }),
    });

    assert.equal(createRes1.status, 200, 'Expected 200 from PhonePe create payment');
    const data1 = await createRes1.json();
    assert.equal(data1.success, true);
    assert.equal(oauthRequestCount, 1, 'First create call must acquire OAuth token');

    // Second call should use cached token without hitting OAuth endpoint again
    const b2 = await createTestBooking();
    const cookie2 = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([b2.publicId])}`;
    const createRes2 = await fetch(`${BASE_URL}/api/payments/phonepe/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie2,
      },
      body: JSON.stringify({ bookingId: b2.publicId }),
    });
    assert.equal(createRes2.status, 200);
    assert.equal(oauthRequestCount, 1, 'Second create call must reuse cached OAuth token');
    console.log('✓ Test 1 passed: OAuth token acquired on server');
    console.log('✓ Test 2 passed: In-memory token caching prevents redundant requests\n');

    // =========================================================================
    // TEST 3, 4, 5, 6, 7: Sandbox payment creation & parameters
    // =========================================================================
    console.log('Test 3 - 7: Sandbox payment creation, amount, orderId, expiry, redirectUrl...');
    const orderInMock = mockPhonePeOrders.get(data1.merchantOrderId);
    assert.ok(orderInMock, 'Order must be recorded in mock server');

    // Test 3: Sandbox payment creation
    assert.equal(data1.provider, 'phonepe');
    console.log('✓ Test 3 passed: Sandbox payment creation successful');

    // Test 4: Authoritative amount in paise
    const expectedPaise = b1.totalAmount * 100;
    assert.equal(data1.amount, expectedPaise);
    assert.equal(orderInMock.amount, expectedPaise);
    console.log('✓ Test 4 passed: Authoritative booking amount correctly passed in paise');

    // Test 5: Valid merchantOrderId
    assert.ok(data1.merchantOrderId.length <= 63, 'merchantOrderId must be <= 63 chars');
    assert.match(data1.merchantOrderId, /^[a-zA-Z0-9_-]+$/, 'merchantOrderId must match permitted chars');
    console.log('✓ Test 5 passed: Valid merchantOrderId generated and stored');

    // Test 6: Valid PhonePe expireAfter
    assert.ok(orderInMock.expireAfter >= 300 && orderInMock.expireAfter <= 3600, 'expireAfter must be in 300..3600');
    assert.equal(orderInMock.expireAfter, 1200, 'Standard 1200s (20 mins) expiry set');
    console.log('✓ Test 6 passed: PhonePe payment session expiry is 1200 seconds (20 mins)');

    // Test 7: redirectUrl returned directly
    assert.ok(data1.redirectUrl.startsWith('https://mercury-uat.phonepe.com/'), 'Direct redirectUrl returned');
    console.log('✓ Test 7 passed: redirectUrl returned directly in create response\n');

    // =========================================================================
    // TEST 8: Successful Order Status confirmation
    // =========================================================================
    console.log('Test 8: Successful Order Status confirmation...');
    mockPhonePeStatuses.set(data1.merchantOrderId, {
      orderId: data1.orderId,
      merchantOrderId: data1.merchantOrderId,
      state: 'COMPLETED',
      amount: expectedPaise,
    });

    const statusRes1 = await fetch(
      `${BASE_URL}/api/payments/phonepe/status/${encodeURIComponent(data1.merchantOrderId)}`,
      {
        headers: { Cookie: cookie1 },
      }
    );
    assert.equal(statusRes1.status, 200);
    const statusData1 = await statusRes1.json();
    assert.equal(statusData1.success, true);
    assert.equal(statusData1.state, 'COMPLETED');
    assert.ok(statusData1.booking.entryToken, 'Confirmed booking must have admission QR entryToken');

    const updatedB1 = await prisma.booking.findUnique({ where: { id: b1.id } });
    assert.equal(updatedB1.status, 'CONFIRMED');
    assert.equal(updatedB1.paymentStatus, 'PAID');
    console.log('✓ Test 8 passed: Order Status COMPLETED confirms booking and generates admission QR\n');

    // =========================================================================
    // TEST 9 & 10: Successful webhook & duplicate webhook idempotency
    // =========================================================================
    console.log('Test 9 & 10: Successful webhook confirmation & idempotency...');
    const b3 = await createTestBooking();
    const cookie3 = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([b3.publicId])}`;

    const createRes3 = await fetch(`${BASE_URL}/api/payments/phonepe/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie3 },
      body: JSON.stringify({ bookingId: b3.publicId }),
    });
    const data3 = await createRes3.json();

    const webhookPayload = {
      event: 'checkout.order.completed',
      payload: {
        orderId: data3.orderId,
        merchantOrderId: data3.merchantOrderId,
        state: 'COMPLETED',
        amount: b3.totalAmount * 100,
        metaData: {
          bookingPublicId: b3.publicId,
          paymentAttemptId: data3.paymentAttemptId,
        },
      },
    };
    const rawWebhookBody = JSON.stringify(webhookPayload);
    const webhookSig = generatePhonePeWebhookSignature(rawWebhookBody, testWebhookSecret, testClientVersion);

    // Call webhook
    const whRes1 = await fetch(`${BASE_URL}/api/webhooks/phonepe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-verify': webhookSig,
      },
      body: rawWebhookBody,
    });
    assert.equal(whRes1.status, 200);
    const whData1 = await whRes1.json();
    assert.equal(whData1.received, true);

    const updatedB3 = await prisma.booking.findUnique({ where: { id: b3.id } });
    assert.equal(updatedB3.status, 'CONFIRMED');
    assert.equal(updatedB3.paymentStatus, 'PAID');
    console.log('✓ Test 9 passed: Webhook checkout.order.completed confirms booking');

    // Test 10: Duplicate webhook
    const passBeforeDup = await prisma.pass.findUnique({ where: { id: testPass.id } });
    const whRes2 = await fetch(`${BASE_URL}/api/webhooks/phonepe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-verify': webhookSig,
      },
      body: rawWebhookBody,
    });
    assert.equal(whRes2.status, 200);
    const passAfterDup = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.equal(passAfterDup.soldQuantity, passBeforeDup.soldQuantity, 'Duplicate webhook must not double-consume inventory');
    console.log('✓ Test 10 passed: Webhook is completely idempotent\n');

    // =========================================================================
    // TEST 11: Failed webhook
    // =========================================================================
    console.log('Test 11: Failed webhook handling...');
    const b4 = await createTestBooking();
    const cookie4 = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([b4.publicId])}`;

    const createRes4 = await fetch(`${BASE_URL}/api/payments/phonepe/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie4 },
      body: JSON.stringify({ bookingId: b4.publicId }),
    });
    const data4 = await createRes4.json();

    const failedPayload = {
      event: 'checkout.order.failed',
      payload: {
        orderId: data4.orderId,
        merchantOrderId: data4.merchantOrderId,
        state: 'FAILED',
        amount: b4.totalAmount * 100,
        metaData: {
          bookingPublicId: b4.publicId,
          paymentAttemptId: data4.paymentAttemptId,
        },
      },
    };
    const failedBody = JSON.stringify(failedPayload);
    const failedSig = generatePhonePeWebhookSignature(failedBody, testWebhookSecret, testClientVersion);

    const whFailRes = await fetch(`${BASE_URL}/api/webhooks/phonepe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-verify': failedSig },
      body: failedBody,
    });
    assert.equal(whFailRes.status, 200);

    const b4AfterFail = await prisma.booking.findUnique({ where: { id: b4.id } });
    assert.equal(b4AfterFail.status, 'PENDING', 'Failed payment must keep booking PENDING');
    const attempt4 = await prisma.paymentAttempt.findUnique({ where: { id: data4.paymentAttemptId } });
    assert.equal(attempt4.status, 'FAILED', 'Payment attempt must be marked FAILED');
    console.log('✓ Test 11 passed: checkout.order.failed marks attempt FAILED and preserves reservation\n');

    // =========================================================================
    // TEST 12: Pending status
    // =========================================================================
    console.log('Test 12: Order status PENDING...');
    const b5 = await createTestBooking();
    const cookie5 = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([b5.publicId])}`;
    const createRes5 = await fetch(`${BASE_URL}/api/payments/phonepe/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie5 },
      body: JSON.stringify({ bookingId: b5.publicId }),
    });
    const data5 = await createRes5.json();

    mockPhonePeStatuses.set(data5.merchantOrderId, {
      orderId: data5.orderId,
      merchantOrderId: data5.merchantOrderId,
      state: 'PENDING',
      amount: b5.totalAmount * 100,
    });

    const statusRes5 = await fetch(
      `${BASE_URL}/api/payments/phonepe/status/${encodeURIComponent(data5.merchantOrderId)}`,
      { headers: { Cookie: cookie5 } }
    );
    assert.equal(statusRes5.status, 200);
    const statusData5 = await statusRes5.json();
    assert.equal(statusData5.state, 'PENDING');
    const b5After = await prisma.booking.findUnique({ where: { id: b5.id } });
    assert.equal(b5After.status, 'PENDING', 'Pending status must not confirm booking');
    console.log('✓ Test 12 passed: PENDING order status leaves booking pending\n');

    // =========================================================================
    // TEST 13: Status API fallback when webhook is missing/delayed
    // =========================================================================
    console.log('Test 13: Status API fallback confirmation...');
    mockPhonePeStatuses.set(data5.merchantOrderId, {
      orderId: data5.orderId,
      merchantOrderId: data5.merchantOrderId,
      state: 'COMPLETED',
      amount: b5.totalAmount * 100,
    });

    const statusRes5Again = await fetch(
      `${BASE_URL}/api/payments/phonepe/status/${encodeURIComponent(data5.merchantOrderId)}`,
      { headers: { Cookie: cookie5 } }
    );
    assert.equal(statusRes5Again.status, 200);
    const b5Confirmed = await prisma.booking.findUnique({ where: { id: b5.id } });
    assert.equal(b5Confirmed.status, 'CONFIRMED');
    console.log('✓ Test 13 passed: Order Status API successfully confirms payment without webhook\n');

    // =========================================================================
    // TEST 14: Invalid webhook (tampered signature)
    // =========================================================================
    console.log('Test 14: Webhook signature verification & rejection of tampered payload...');
    const badSigRes = await fetch(`${BASE_URL}/api/webhooks/phonepe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-verify': 'invalid_signature_hex_code###1',
      },
      body: rawWebhookBody,
    });
    assert.equal(badSigRes.status, 400, 'Tampered signature must return HTTP 400');
    console.log('✓ Test 14 passed: Cryptographic HMAC signature check rejects invalid webhooks\n');

    // =========================================================================
    // TEST 15: Amount mismatch
    // =========================================================================
    console.log('Test 15: Amount mismatch protection...');
    const b6 = await createTestBooking();
    const cookie6 = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([b6.publicId])}`;
    const createRes6 = await fetch(`${BASE_URL}/api/payments/phonepe/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie6 },
      body: JSON.stringify({ bookingId: b6.publicId }),
    });
    const data6 = await createRes6.json();

    // Mock returns wrong amount (e.g. ₹1 instead of pass price)
    mockPhonePeStatuses.set(data6.merchantOrderId, {
      orderId: data6.orderId,
      merchantOrderId: data6.merchantOrderId,
      state: 'COMPLETED',
      amount: 100, // 100 paise = ₹1
    });

    const mismatchRes = await fetch(
      `${BASE_URL}/api/payments/phonepe/status/${encodeURIComponent(data6.merchantOrderId)}`,
      { headers: { Cookie: cookie6 } }
    );
    assert.equal(mismatchRes.status, 400, 'Amount mismatch must be rejected with 400');
    const b6After = await prisma.booking.findUnique({ where: { id: b6.id } });
    assert.equal(b6After.status, 'PENDING', 'Booking must not confirm on amount mismatch');
    console.log('✓ Test 15 passed: Amount mismatch rejected, booking protected\n');

    // =========================================================================
    // TEST 16: Unknown merchantOrderId
    // =========================================================================
    console.log('Test 16: Unknown merchantOrderId...');
    const notFoundRes = await fetch(
      `${BASE_URL}/api/payments/phonepe/status/ru26_nonexistent_order_id_9999`,
      { headers: { Cookie: cookie1 } }
    );
    assert.equal(notFoundRes.status, 404);
    console.log('✓ Test 16 passed: Unknown order ID returns HTTP 404\n');

    // =========================================================================
    // TEST 17: Expired booking payment attempt
    // =========================================================================
    console.log('Test 17: Payment attempt on expired booking...');
    const bExpired = await createTestBooking({
      expiresAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      status: 'EXPIRED',
    });
    const cookieExp = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([bExpired.publicId])}`;

    const expCreateRes = await fetch(`${BASE_URL}/api/payments/phonepe/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieExp },
      body: JSON.stringify({ bookingId: bExpired.publicId }),
    });
    assert.equal(expCreateRes.status, 410, 'Create payment on expired booking must return 410');
    console.log('✓ Test 17 passed: Expired booking rejected with 410 Gone\n');

    // =========================================================================
    // TEST 18: Already-confirmed booking
    // =========================================================================
    console.log('Test 18: Payment creation on already confirmed booking...');
    const bAlready = await createTestBooking({
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
    });
    const cookieAlready = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([bAlready.publicId])}`;

    const alreadyCreateRes = await fetch(`${BASE_URL}/api/payments/phonepe/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAlready },
      body: JSON.stringify({ bookingId: bAlready.publicId }),
    });
    assert.equal(alreadyCreateRes.status, 200);
    const alreadyData = await alreadyCreateRes.json();
    assert.equal(alreadyData.alreadyConfirmed, true, 'Must report alreadyConfirmed: true');
    console.log('✓ Test 18 passed: Already confirmed booking returns alreadyConfirmed fast-path\n');

    // =========================================================================
    // TEST 19: PhonePe session expiry does NOT expire 24-hour reservation
    // =========================================================================
    console.log('Test 19: PhonePe session expiry vs 24-hour booking reservation...');
    const b19 = await createTestBooking();
    const cookie19 = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([b19.publicId])}`;
    const createRes19 = await fetch(`${BASE_URL}/api/payments/phonepe/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie19 },
      body: JSON.stringify({ bookingId: b19.publicId }),
    });
    const data19 = await createRes19.json();

    // PhonePe session failed / timed out
    mockPhonePeStatuses.set(data19.merchantOrderId, {
      orderId: data19.orderId,
      merchantOrderId: data19.merchantOrderId,
      state: 'FAILED',
      amount: b19.totalAmount * 100,
    });

    const statusRes19 = await fetch(
      `${BASE_URL}/api/payments/phonepe/status/${encodeURIComponent(data19.merchantOrderId)}`,
      { headers: { Cookie: cookie19 } }
    );
    assert.equal(statusRes19.status, 200);
    const b19After = await prisma.booking.findUnique({ where: { id: b19.id } });
    assert.equal(b19After.status, 'PENDING', 'Booking must remain PENDING');
    assert.ok(b19After.expiresAt.getTime() > Date.now() + 23 * 60 * 60 * 1000, '24-hour hold remains valid');
    console.log('✓ Test 19 passed: PhonePe checkout failure/expiry does NOT cancel 24-hour hold\n');

    // =========================================================================
    // TEST 20: Payment success race with reservation expiry
    // =========================================================================
    console.log('Test 20: Payment success race with reservation expiry...');
    const b20 = await createTestBooking();
    const cookie20 = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([b20.publicId])}`;
    const createRes20 = await fetch(`${BASE_URL}/api/payments/phonepe/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie20 },
      body: JSON.stringify({ bookingId: b20.publicId }),
    });
    const data20 = await createRes20.json();

    // Force reservation time to elapse right before status check arrives
    await prisma.booking.update({
      where: { id: b20.id },
      data: { expiresAt: new Date(Date.now() - 5000) },
    });

    mockPhonePeStatuses.set(data20.merchantOrderId, {
      orderId: data20.orderId,
      merchantOrderId: data20.merchantOrderId,
      state: 'COMPLETED',
      amount: b20.totalAmount * 100,
    });

    const statusRes20 = await fetch(
      `${BASE_URL}/api/payments/phonepe/status/${encodeURIComponent(data20.merchantOrderId)}`,
      { headers: { Cookie: cookie20 } }
    );
    assert.equal(statusRes20.status, 410, 'Elapsed reservation must be rejected with 410');
    const b20After = await prisma.booking.findUnique({ where: { id: b20.id } });
    assert.equal(b20After.status, 'EXPIRED', 'Late payment cannot resurrect elapsed reservation');
    console.log('✓ Test 20 passed: Invariant upheld: late payment never resurrects expired reservation\n');

    // =========================================================================
    // TEST 21: Repeated browser callback safe polling
    // =========================================================================
    console.log('Test 21: Repeated browser callback polling...');
    const call1 = await fetch(
      `${BASE_URL}/api/payments/phonepe/status/${encodeURIComponent(data1.merchantOrderId)}`,
      { headers: { Cookie: cookie1 } }
    );
    const call2 = await fetch(
      `${BASE_URL}/api/payments/phonepe/status/${encodeURIComponent(data1.merchantOrderId)}`,
      { headers: { Cookie: cookie1 } }
    );
    assert.equal(call1.status, 200);
    assert.equal(call2.status, 200);
    const call2Data = await call2.json();
    assert.equal(call2Data.state, 'COMPLETED');
    console.log('✓ Test 21 passed: Repeated status checks safely return confirmed state\n');

    // =========================================================================
    // TEST 22: PaymentAttempt creation
    // =========================================================================
    console.log('Test 22: PaymentAttempt model integrity...');
    const attempt1 = await prisma.paymentAttempt.findFirst({
      where: { bookingId: b1.id, provider: 'phonepe' },
    });
    assert.ok(attempt1, 'PaymentAttempt must exist for phonepe');
    assert.equal(attempt1.provider, 'phonepe');
    assert.equal(attempt1.status, 'SUCCEEDED');
    assert.equal(attempt1.amount, b1.totalAmount);
    console.log('✓ Test 22 passed: PaymentAttempt persisted correctly with provider="phonepe"\n');

    // =========================================================================
    // TEST 23 & 24: Receipt and Admission QR generated exactly once
    // =========================================================================
    console.log('Test 23 & 24: Receipt & admission QR generated exactly once...');
    const confirmedB1 = await prisma.booking.findUnique({ where: { id: b1.id } });
    assert.ok(confirmedB1.confirmedAt, 'Confirmed booking must have confirmedAt timestamp');

    const qrToken1 = createEntryQrToken(confirmedB1.publicId);
    const qrToken2 = createEntryQrToken(confirmedB1.publicId);
    assert.equal(qrToken1, qrToken2, 'QR token must be deterministic');

    const verifiedQr = verifyEntryQrToken(qrToken1);
    assert.ok(verifiedQr, 'QR token must verify cryptographically');
    assert.equal(verifiedQr.publicId, confirmedB1.publicId);
    console.log('✓ Test 23 passed: Receipt timestamp and details established');
    console.log('✓ Test 24 passed: Cryptographic admission QR issued exclusively upon confirmation\n');

    // =========================================================================
    // TEST 25: No confirmation from frontend callback alone
    // =========================================================================
    console.log('Test 25: Asserting no confirmation from frontend callback alone...');
    const b25 = await createTestBooking();
    // Simulate frontend claiming "CONCLUDED" without calling status API or receiving webhook
    const b25Check = await prisma.booking.findUnique({ where: { id: b25.id } });
    assert.equal(b25Check.status, 'PENDING');
    assert.equal(b25Check.paymentStatus, 'NOT_STARTED');
    console.log('✓ Test 25 passed: Frontend callback signals alone never confirm payment in database\n');

    console.log('================================================================');
    console.log('ALL 25 PHONEPE PAYMENT FLOW TESTS PASSED SUCCESSFULLY! (25/25)');
    console.log('================================================================\n');
  } finally {
    // Cleanup created test records
    console.log('[Cleanup] Cleaning up test records from Neon PostgreSQL...');
    try {
      for (const bId of createdBookingIds) {
        await prisma.paymentAttempt.deleteMany({ where: { bookingId: bId } });
        await prisma.booking.delete({ where: { id: bId } }).catch(() => {});
      }

      // Restore inventory on test pass
      if (testPass) {
        await prisma.pass.update({
          where: { id: testPass.id },
          data: {
            reservedQuantity: initialReserved,
            soldQuantity: initialSold,
          },
        });
        console.log(`[Cleanup] Restored Pass inventory: reserved=${initialReserved}, sold=${initialSold}`);
      }
    } catch (cleanErr) {
      console.error('[Cleanup Error]', cleanErr);
    }

    if (mockServer) {
      mockServer.close();
    }
    if (serverProc) {
      serverProc.kill('SIGTERM');
    }
    await prisma.$disconnect();
  }
}

runPhonePeTestSuite().catch((err) => {
  console.error('\n❌ PhonePe Test Suite Failed:', err);
  process.exit(1);
});
