import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

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

const PORT = 3037;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const MOCK_RZP_PORT = 3039;
const MOCK_RZP_URL = `http://127.0.0.1:${MOCK_RZP_PORT}`;

// In-memory state for Mock Razorpay API server
const mockOrders = new Map();
const mockPayments = new Map();

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

        // POST /v1/orders
        if (req.method === 'POST' && req.url === '/v1/orders') {
          let parsed = {};
          try {
            parsed = JSON.parse(body || '{}');
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: { description: 'Invalid JSON' } }));
          }

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

        // GET /v1/payments/:id
        if (req.method === 'GET' && req.url?.startsWith('/v1/payments/')) {
          const paymentId = req.url.replace('/v1/payments/', '').split('?')[0];
          const payment = mockPayments.get(paymentId);
          if (payment) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(payment));
          }

          // Default fallback mock payment if not explicitly overridden
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              id: paymentId,
              entity: 'payment',
              amount: 100000,
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
              email: 'attendee@example.com',
              contact: '+919931503960',
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

// Cryptographic test helpers
function generateRazorpayCheckoutSignature(orderId, paymentId, keySecret) {
  return crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

function generateRazorpayWebhookSignature(rawBody, webhookSecret) {
  return crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
}

async function runRazorpayFlowTests() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — RAZORPAY PAYMENT FLOW AUTOMATED TEST SUITE');
  console.log('Database: Neon PostgreSQL (Authoritative)');
  console.log('Provider: Razorpay Standard Architecture');
  console.log('================================================================\n');

  const createdBookingIds = new Set();
  const createdPaymentAttemptIds = new Set();
  let testPass = null;
  let serverProc = null;
  let mockRzpServer = null;

  // Track initial inventory to restore exactly
  let initialReserved = 0;
  let initialSold = 0;

  try {
    // 0. Locate a test pass in Neon
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

    // Ensure Razorpay test environment variables are set for testing
    const testKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_flow_dummy_key_123';
    const testKeySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_flow_dummy_secret_456';
    const testWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_flow_webhook_secret_789';

    // Start mock Razorpay API server
    console.log(`[Setup] Starting Mock Razorpay API server on port ${MOCK_RZP_PORT}...`);
    mockRzpServer = await startMockRazorpayServer();
    console.log('✓ Mock Razorpay API server listening\n');

    // 1. Launch Next.js Production Server on Port 3037
    console.log(`[Setup] Launching Next.js production server on port ${PORT}...`);
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
      } catch {
        // server starting
      }
    }

    if (!ready) {
      throw new Error(`Next.js server failed to respond on port ${PORT}`);
    }
    console.log('✓ Next.js production server ready with PAYMENT_PROVIDER=razorpay\n');

    // =========================================================================
    // TEST 1: Razorpay Order Creation & Server-Side Amount Verification
    // =========================================================================
    console.log('TEST 1: Razorpay Order Creation & Server-Side Amount Enforcement');
    const test1PublicId = `RU26-TEST-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const booking1 = await prisma.booking.create({
      data: {
        publicId: test1PublicId,
        fullName: 'Aarav Kumar',
        phone: '+91 99315 03960',
        email: 'aarav.test@example.com',
        passId: testPass.id,
        quantity: 2,
        unitPrice: testPass.price,
        totalAmount: testPass.price * 2,
        status: 'PENDING',
        paymentStatus: 'NOT_STARTED',
        expiresAt,
      },
    });
    createdBookingIds.add(booking1.id);

    // Reserve inventory
    await prisma.pass.update({
      where: { id: testPass.id },
      data: { reservedQuantity: { increment: 2 } },
    });

    const sessionCookie1 = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([booking1.publicId])}`;

    // Try client tampering: client passes tampered price and currency
    const createRes1 = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie1,
      },
      body: JSON.stringify({
        bookingId: booking1.publicId,
        tamperedAmount: 1, // Malicious client attempt
        tamperedCurrency: 'USD',
      }),
    });

    const createData1 = await createRes1.json();
    assert.strictEqual(createRes1.status, 200, 'Order creation endpoint should succeed');
    assert.strictEqual(createData1.success, true, 'Response must indicate success');
    assert.strictEqual(createData1.provider, 'razorpay', 'Provider must be razorpay');
    assert.strictEqual(createData1.currency, 'INR', 'Currency must be server-enforced INR');
    assert.strictEqual(
      createData1.amount,
      booking1.totalAmount * 100,
      'Amount must strictly match server-authoritative total in paise'
    );
    assert.ok(createData1.paymentAttemptId, 'Must return paymentAttemptId');
    assert.ok(createData1.orderId, 'Must return Razorpay orderId');
    assert.strictEqual(createData1.keyId, testKeyId, 'Must return public Razorpay keyId');
    createdPaymentAttemptIds.add(createData1.paymentAttemptId);

    // Verify PaymentAttempt in Neon
    const attempt1 = await prisma.paymentAttempt.findUnique({
      where: { id: createData1.paymentAttemptId },
    });
    assert.ok(attempt1, 'PaymentAttempt record must exist in Neon');
    assert.strictEqual(attempt1.provider, 'razorpay', 'PaymentAttempt provider must be razorpay');
    assert.strictEqual(attempt1.providerOrderId, createData1.orderId, 'PaymentAttempt providerOrderId must match orderId');
    assert.strictEqual(attempt1.amount, booking1.totalAmount, 'PaymentAttempt amount must match booking total');
    assert.strictEqual(attempt1.status, 'INITIATED', 'PaymentAttempt initial status must be INITIATED');
    console.log('✓ TEST 1 PASSED: Server derived amount in paise enforced; client tampering ignored.\n');

    // =========================================================================
    // TEST 2: Authorization Guards
    // =========================================================================
    console.log('TEST 2: Authorization Guards');
    // A. Unauthenticated request without session cookie
    const unauthRes = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking1.publicId }),
    });
    assert.strictEqual(unauthRes.status, 401, 'Request without cookie must be rejected with 401');

    // B. Unrelated booking session
    const otherSessionCookie = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken(['RU26-REQ-9999'])}`;
    const forbiddenRes = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: otherSessionCookie,
      },
      body: JSON.stringify({ bookingId: booking1.publicId }),
    });
    assert.strictEqual(forbiddenRes.status, 403, 'Request with session for different booking must return 403');
    console.log('✓ TEST 2 PASSED: 401 Unauthorized and 403 Forbidden strictly enforced.\n');

    // =========================================================================
    // TEST 3: Cryptographic Signature Verification & Direct Checkout Verify
    // =========================================================================
    console.log('TEST 3: Cryptographic Signature Verification & Direct Checkout Verify');
    const fakeOrderId = `order_test_${Date.now()}`;
    const fakePaymentId = `pay_test_${Date.now()}`;
    const invalidSignature = 'tampered_invalid_signature_hex_1234567890abcdef';

    // A. Test verify endpoint with invalid signature
    const invalidSigRes = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie1,
      },
      body: JSON.stringify({
        bookingId: booking1.publicId,
        razorpay_payment_id: fakePaymentId,
        razorpay_order_id: fakeOrderId,
        razorpay_signature: invalidSignature,
      }),
    });
    assert.strictEqual(invalidSigRes.status, 400, 'Tampered signature must return 400');
    const invalidSigData = await invalidSigRes.json();
    assert.match(invalidSigData.error, /signature/i, 'Error message must specify signature verification');

    // B. Test webhook signature verification with tampered header
    const samplePayload = JSON.stringify({ event: 'payment.captured', entity: {} });
    const invalidWebhookRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_webhook_sig_hex_9999',
      },
      body: samplePayload,
    });
    assert.strictEqual(invalidWebhookRes.status, 400, 'Unsigned / tampered webhook must return 400');

    // C. Test VALID checkout signature & status verification on booking1
    const validPaymentId1 = `pay_valid_${Date.now()}`;
    mockPayments.set(validPaymentId1, {
      id: validPaymentId1,
      entity: 'payment',
      amount: booking1.totalAmount * 100, // paise
      currency: 'INR',
      status: 'captured',
      order_id: createData1.orderId,
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
      vpa: 'user@okhdfcbank',
      email: 'aarav.test@example.com',
      contact: '+919931503960',
      fee: 0,
      tax: 0,
      error_code: null,
      error_description: null,
      created_at: Math.floor(Date.now() / 1000),
    });

    const validSignature1 = generateRazorpayCheckoutSignature(
      createData1.orderId,
      validPaymentId1,
      testKeySecret
    );

    const validVerifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie1,
      },
      body: JSON.stringify({
        bookingId: booking1.publicId,
        razorpay_payment_id: validPaymentId1,
        razorpay_order_id: createData1.orderId,
        razorpay_signature: validSignature1,
      }),
    });

    assert.strictEqual(validVerifyRes.status, 200, 'Valid verification must return 200 OK');
    const validVerifyData = await validVerifyRes.json();
    assert.strictEqual(validVerifyData.success, true);
    assert.strictEqual(validVerifyData.booking.status, 'CONFIRMED');
    assert.strictEqual(validVerifyData.booking.paymentStatus, 'PAID');
    assert.strictEqual(validVerifyData.paymentAttempt.status, 'SUCCEEDED');

    // Verify Neon database states for booking1
    const updatedBooking1 = await prisma.booking.findUnique({ where: { id: booking1.id } });
    assert.strictEqual(updatedBooking1.status, 'CONFIRMED');
    assert.strictEqual(updatedBooking1.paymentStatus, 'PAID');
    assert.ok(updatedBooking1.confirmedAt);

    console.log('✓ TEST 3 PASSED: Invalid signatures rejected; valid signature confirms booking via /api/payments/verify.\n');

    // =========================================================================
    // TEST 4: Asynchronous Webhook Delivery & Atomic Inventory Transition
    // =========================================================================
    console.log('TEST 4: Asynchronous Webhook Delivery & Atomic Inventory Transition');
    const test4PublicId = `RU26-TEST-SUCC-${Math.floor(1000 + Math.random() * 9000)}`;
    const booking4 = await prisma.booking.create({
      data: {
        publicId: test4PublicId,
        fullName: 'Priya Sharma',
        phone: '+91 94301 12440',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'PENDING',
        paymentStatus: 'NOT_STARTED',
        expiresAt,
      },
    });
    createdBookingIds.add(booking4.id);

    // Reserve 1 ticket
    await prisma.pass.update({
      where: { id: testPass.id },
      data: { reservedQuantity: { increment: 1 } },
    });

    const attempt4 = await prisma.paymentAttempt.create({
      data: {
        bookingId: booking4.id,
        provider: 'razorpay',
        providerOrderId: `order_succ_${Date.now()}`,
        amount: booking4.totalAmount,
        status: 'INITIATED',
      },
    });
    createdPaymentAttemptIds.add(attempt4.id);

    const passBeforeWebhook = await prisma.pass.findUnique({ where: { id: testPass.id } });

    // Trigger webhook: payment.captured
    const webhookPayload4 = {
      entity: 'event',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_succ_${Date.now()}`,
            order_id: attempt4.providerOrderId,
            amount: booking4.totalAmount * 100, // in paise
            status: 'captured',
            notes: {
              bookingId: booking4.publicId,
              paymentAttemptId: attempt4.id,
            },
          },
        },
      },
    };

    const webhookBody4 = JSON.stringify(webhookPayload4);
    const webhookSig4 = generateRazorpayWebhookSignature(webhookBody4, testWebhookSecret);

    const webhookRes4 = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': webhookSig4,
      },
      body: webhookBody4,
    });
    assert.strictEqual(webhookRes4.status, 200, 'Webhook delivery must return 200');

    // Verify Neon database states
    const updatedBooking4 = await prisma.booking.findUnique({
      where: { id: booking4.id },
    });
    assert.strictEqual(updatedBooking4.status, 'CONFIRMED', 'Booking status must transition to CONFIRMED');
    assert.strictEqual(updatedBooking4.paymentStatus, 'PAID', 'Booking paymentStatus must transition to PAID');
    assert.ok(updatedBooking4.confirmedAt, 'confirmedAt must be recorded');

    const updatedAttempt4 = await prisma.paymentAttempt.findUnique({
      where: { id: attempt4.id },
    });
    assert.strictEqual(updatedAttempt4.status, 'SUCCEEDED', 'PaymentAttempt status must transition to SUCCEEDED');

    // Check pass inventory transition: reserved decremented by 1, sold incremented by 1
    const passAfterSuccess = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.strictEqual(
      passAfterSuccess.soldQuantity,
      passBeforeWebhook.soldQuantity + 1,
      'Pass sold_quantity must increment by exactly 1'
    );
    assert.strictEqual(
      passAfterSuccess.reservedQuantity,
      passBeforeWebhook.reservedQuantity - 1,
      'Pass reserved_quantity must decrement by exactly 1'
    );
    console.log('✓ TEST 4 PASSED: Atomic transition: Booking CONFIRMED, PaymentAttempt SUCCEEDED, inventory moved.\n');

    // =========================================================================
    // TEST 5: Failed Payment (Preserves Reservation & Inventory)
    // =========================================================================
    console.log('TEST 5: Failed Payment (Preserves Booking & Inventory)');
    const test5PublicId = `RU26-TEST-FAIL-${Math.floor(1000 + Math.random() * 9000)}`;
    const booking5 = await prisma.booking.create({
      data: {
        publicId: test5PublicId,
        fullName: 'Vikram Singh',
        phone: '+91 85400 06033',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'PENDING',
        paymentStatus: 'NOT_STARTED',
        expiresAt,
      },
    });
    createdBookingIds.add(booking5.id);

    await prisma.pass.update({
      where: { id: testPass.id },
      data: { reservedQuantity: { increment: 1 } },
    });

    const attempt5 = await prisma.paymentAttempt.create({
      data: {
        bookingId: booking5.id,
        provider: 'razorpay',
        providerOrderId: `order_fail_${Date.now()}`,
        amount: booking5.totalAmount,
        status: 'INITIATED',
      },
    });
    createdPaymentAttemptIds.add(attempt5.id);

    const passBeforeFail = await prisma.pass.findUnique({ where: { id: testPass.id } });

    // Webhook: payment.failed
    const webhookPayload5 = {
      entity: 'event',
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: `pay_fail_${Date.now()}`,
            order_id: attempt5.providerOrderId,
            amount: booking5.totalAmount * 100,
            status: 'failed',
            error_description: 'Card declined by issuing bank',
            notes: {
              bookingId: booking5.publicId,
              paymentAttemptId: attempt5.id,
            },
          },
        },
      },
    };

    const webhookBody5 = JSON.stringify(webhookPayload5);
    const webhookSig5 = generateRazorpayWebhookSignature(webhookBody5, testWebhookSecret);

    const webhookRes5 = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': webhookSig5,
      },
      body: webhookBody5,
    });
    assert.strictEqual(webhookRes5.status, 200);

    const updatedBooking5 = await prisma.booking.findUnique({ where: { id: booking5.id } });
    assert.strictEqual(updatedBooking5.status, 'PENDING', 'Booking must remain PENDING on payment failure');

    const updatedAttempt5 = await prisma.paymentAttempt.findUnique({ where: { id: attempt5.id } });
    assert.strictEqual(updatedAttempt5.status, 'FAILED', 'PaymentAttempt must be marked FAILED');

    const passAfterFail = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.strictEqual(passAfterFail.reservedQuantity, passBeforeFail.reservedQuantity, 'Reserved inventory untouched');
    assert.strictEqual(passAfterFail.soldQuantity, passBeforeFail.soldQuantity, 'Sold inventory untouched');
    console.log('✓ TEST 5 PASSED: Failed attempt marked FAILED; booking remains PENDING; inventory preserved.\n');

    // =========================================================================
    // TEST 6: Payment Retry against Same Booking
    // =========================================================================
    console.log('TEST 6: Payment Retry against Same Booking');
    // Create attempt 2 against booking 5
    const attempt5_retry = await prisma.paymentAttempt.create({
      data: {
        bookingId: booking5.id,
        provider: 'razorpay',
        providerOrderId: `order_retry_${Date.now()}`,
        amount: booking5.totalAmount,
        status: 'INITIATED',
      },
    });
    createdPaymentAttemptIds.add(attempt5_retry.id);

    // Attempt 2 succeeds via order.paid webhook
    const webhookPayload6 = {
      entity: 'event',
      event: 'order.paid',
      payload: {
        order: {
          entity: {
            id: attempt5_retry.providerOrderId,
            amount_paid: booking5.totalAmount * 100,
            status: 'paid',
            notes: {
              bookingId: booking5.publicId,
              paymentAttemptId: attempt5_retry.id,
            },
          },
        },
      },
    };

    const webhookBody6 = JSON.stringify(webhookPayload6);
    const webhookSig6 = generateRazorpayWebhookSignature(webhookBody6, testWebhookSecret);

    const webhookRes6 = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': webhookSig6,
      },
      body: webhookBody6,
    });
    assert.strictEqual(webhookRes6.status, 200);

    const retriedBooking = await prisma.booking.findUnique({ where: { id: booking5.id } });
    assert.strictEqual(retriedBooking.status, 'CONFIRMED', 'Booking confirmed on retry attempt');
    assert.strictEqual(retriedBooking.paymentStatus, 'PAID', 'PaymentStatus is PAID on retry attempt');

    const retriedAttempt = await prisma.paymentAttempt.findUnique({ where: { id: attempt5_retry.id } });
    assert.strictEqual(retriedAttempt.status, 'SUCCEEDED', 'Retry attempt marked SUCCEEDED');

    // First attempt must still remain FAILED
    const firstAttempt = await prisma.paymentAttempt.findUnique({ where: { id: attempt5.id } });
    assert.strictEqual(firstAttempt.status, 'FAILED', 'Initial attempt history remains FAILED');
    console.log('✓ TEST 6 PASSED: Retry creates new PaymentAttempt on same booking and confirms successfully.\n');

    // =========================================================================
    // TEST 7: Webhook Replay Idempotency
    // =========================================================================
    console.log('TEST 7: Webhook Replay Idempotency');
    const passBeforeReplay = await prisma.pass.findUnique({ where: { id: testPass.id } });

    // Replay the exact same successful webhook payload 6
    const replayRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': webhookSig6,
      },
      body: webhookBody6,
    });
    assert.strictEqual(replayRes.status, 200, 'Replayed webhook must return 200');

    const passAfterReplay = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.strictEqual(
      passAfterReplay.soldQuantity,
      passBeforeReplay.soldQuantity,
      'Zero duplicate increment in sold_quantity on webhook replay'
    );
    assert.strictEqual(
      passAfterReplay.reservedQuantity,
      passBeforeReplay.reservedQuantity,
      'Zero duplicate decrement in reserved_quantity on webhook replay'
    );
    console.log('✓ TEST 7 PASSED: Webhook replay is completely idempotent; no double inventory mutations.\n');

    // =========================================================================
    // TEST 8: Expired Booking Protection
    // =========================================================================
    console.log('TEST 8: Expired Booking Protection');
    const test8PublicId = `RU26-TEST-EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    const booking8 = await prisma.booking.create({
      data: {
        publicId: test8PublicId,
        fullName: 'Neha Verma',
        phone: '+91 99315 03960',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'EXPIRED', // Pre-expired
        paymentStatus: 'NOT_STARTED',
        expiresAt: new Date(Date.now() - 10000), // Past
      },
    });
    createdBookingIds.add(booking8.id);

    const sessionCookie8 = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([booking8.publicId])}`;

    // Attempting to create payment on expired booking
    const expCreateRes = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie8,
      },
      body: JSON.stringify({ bookingId: booking8.publicId }),
    });
    assert.strictEqual(expCreateRes.status, 410, 'Expired booking payment creation must return 410 Gone');

    // Attempting late webhook confirmation on expired booking
    const expAttempt = await prisma.paymentAttempt.create({
      data: {
        bookingId: booking8.id,
        provider: 'razorpay',
        providerOrderId: `order_exp_${Date.now()}`,
        amount: booking8.totalAmount,
        status: 'INITIATED',
      },
    });
    createdPaymentAttemptIds.add(expAttempt.id);

    const expWebhookPayload = {
      entity: 'event',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_exp_${Date.now()}`,
            order_id: expAttempt.providerOrderId,
            amount: booking8.totalAmount * 100,
            status: 'captured',
            notes: {
              bookingId: booking8.publicId,
              paymentAttemptId: expAttempt.id,
            },
          },
        },
      },
    };

    const expWebhookBody = JSON.stringify(expWebhookPayload);
    const expWebhookSig = generateRazorpayWebhookSignature(expWebhookBody, testWebhookSecret);

    await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': expWebhookSig,
      },
      body: expWebhookBody,
    });

    const booking8After = await prisma.booking.findUnique({ where: { id: booking8.id } });
    assert.strictEqual(booking8After.status, 'EXPIRED', 'Late payment must NEVER confirm an expired booking');
    console.log('✓ TEST 8 PASSED: Expired booking rejected; late payment confirmation refused.\n');

    // =========================================================================
    // TEST 9: UI & API Refresh / State Contract
    // =========================================================================
    console.log('TEST 9: Booking Detail / Refresh Contract');
    const detailRes = await fetch(`${BASE_URL}/api/bookings/${retriedBooking.publicId}`, {
      headers: {
        Cookie: `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([retriedBooking.publicId])}`,
      },
    });
    assert.strictEqual(detailRes.status, 200, 'Booking detail endpoint must succeed');
    const detailData = await detailRes.json();
    assert.strictEqual(detailData.booking.status, 'CONFIRMED', 'Authoritative status is CONFIRMED');
    assert.strictEqual(detailData.booking.paymentStatus, 'PAID', 'Authoritative paymentStatus is PAID');
    console.log('✓ TEST 9 PASSED: Authoritative status queried safely without creating duplicate attempt.\n');

    console.log('================================================================');
    console.log('ALL 9 RAZORPAY TEST SUITE SCENARIOS PASSED WITH ZERO FAILURES!');
    console.log('================================================================\n');
  } finally {
    // Clean up test records and restore pass inventory
    console.log('[Cleanup] Cleaning up test records in Neon...');
    if (createdPaymentAttemptIds.size > 0) {
      await prisma.paymentAttempt.deleteMany({
        where: { id: { in: Array.from(createdPaymentAttemptIds) } },
      });
    }

    if (createdBookingIds.size > 0) {
      await prisma.booking.deleteMany({
        where: { id: { in: Array.from(createdBookingIds) } },
      });
    }

    // Restore pass inventory to exact original state
    if (testPass) {
      await prisma.pass.update({
        where: { id: testPass.id },
        data: {
          reservedQuantity: initialReserved,
          soldQuantity: initialSold,
        },
      });
      console.log(`[Cleanup] Restored pass inventory: reservedQuantity=${initialReserved}, soldQuantity=${initialSold}`);
    }

    if (serverProc) {
      console.log('[Cleanup] Terminating Next.js test server...');
      serverProc.kill('SIGTERM');
    }

    if (mockRzpServer) {
      console.log('[Cleanup] Closing Mock Razorpay API server...');
      mockRzpServer.close();
    }

    await prisma.$disconnect();
  }
}

runRazorpayFlowTests().catch((err) => {
  console.error('\n❌ FATAL TEST FAILURE:', err);
  process.exit(1);
});
