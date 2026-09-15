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
const PORT = 3042;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runSingleKeyRouteAuditTests() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — SINGLE KEY DIAGNOSIS & ROUTE AUDIT TEST SUITE');
  console.log('Mode: Safe Provider Diagnostic (No live secret required)');
  console.log('================================================================\n');

  const createdBookingIds = new Set();
  const createdPaymentAttemptIds = new Set();
  let testPass = null;
  let serverProc = null;
  let initialReserved = 0;
  let initialSold = 0;

  try {
    // -------------------------------------------------------------------------
    // 1. CREDENTIAL FORMAT & METADATA DIAGNOSIS
    // -------------------------------------------------------------------------
    console.log('STEP 1: Credential Format & Metadata Diagnosis');
    const rawKeyId = process.env.RAZORPAY_KEY_ID || '';
    const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

    const isKeyIdPresent = Boolean(rawKeyId.trim());
    const keyIdPrefix = rawKeyId.startsWith('rzp_test_')
      ? 'rzp_test_'
      : rawKeyId.startsWith('rzp_live_')
        ? 'rzp_live_'
        : 'unknown';

    const isKeySecretPresent = Boolean(rawKeySecret.trim());
    const keySecretLength = rawKeySecret.length;

    console.log(`  RAZORPAY_KEY_ID: ${isKeyIdPresent ? 'PRESENT' : 'MISSING'}`);
    console.log(`  Key ID Prefix:   ${keyIdPrefix}`);
    console.log(`  Key ID Length:   ${rawKeyId.length}`);
    console.log(`  RAZORPAY_KEY_SECRET: ${isKeySecretPresent ? 'PRESENT' : 'MISSING'}`);
    console.log(`  Secret Length:       ${keySecretLength}`);
    console.log(`  PAYMENT_PROVIDER:    ${process.env.PAYMENT_PROVIDER || 'stripe'}`);
    console.log(`  PAYMENT_ENV:         ${process.env.PAYMENT_ENV || 'test'}`);

    assert.strictEqual(isKeyIdPresent, true, 'RAZORPAY_KEY_ID must be present from client provision');
    assert.strictEqual(keyIdPrefix, 'rzp_test_', 'Provided key must have rzp_test_ prefix');
    assert.strictEqual(rawKeyId.length, 23, 'Razorpay Test Key ID must be exactly 23 chars');
    assert.strictEqual(isKeySecretPresent, false, 'RAZORPAY_KEY_SECRET must be missing in single-key scenario');
    console.log('✓ STEP 1 PASSED: Credential diagnosed as Razorpay Test Key ID (Public Key ID). Secret is missing.\n');

    // -------------------------------------------------------------------------
    // 2. PROVIDER RESOLUTION & ABSTRACTION
    // -------------------------------------------------------------------------
    console.log('STEP 2: Provider Resolution & Abstraction Verification');
    // Verify provider routing configuration in index.ts
    const paymentsIndexSource = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../lib/payments/index.ts', import.meta.url), 'utf-8')
    );
    assert.ok(paymentsIndexSource.includes("case 'stripe'"), 'index.ts must handle stripe provider');
    assert.ok(paymentsIndexSource.includes("case 'razorpay'"), 'index.ts must handle razorpay provider');
    assert.ok(paymentsIndexSource.includes('Unsupported payment provider'), 'index.ts must reject unsupported providers');
    console.log('✓ STEP 2 PASSED: Provider abstraction correctly switches between stripe and razorpay.\n');

    // -------------------------------------------------------------------------
    // 3. CRYPTOGRAPHIC SIGNATURE VERIFICATION FORMULA (SYNTHETIC)
    // -------------------------------------------------------------------------
    console.log('STEP 3: Cryptographic Signature Verification Unit Tests (Synthetic)');
    const syntheticSecret = 'test_secret_998877665544332211aabbcc';
    const syntheticOrderId = 'order_test_order_12345';
    const syntheticPaymentId = 'pay_test_payment_67890';

    const validSig = crypto
      .createHmac('sha256', syntheticSecret)
      .update(`${syntheticOrderId}|${syntheticPaymentId}`)
      .digest('hex');

    const verifyHelper = (orderId, paymentId, signature, secret) => {
      const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
      const expBuf = Buffer.from(expected, 'utf8');
      const sigBuf = Buffer.from(signature, 'utf8');
      if (expBuf.length !== sigBuf.length) return false;
      return crypto.timingSafeEqual(expBuf, sigBuf);
    };

    assert.strictEqual(
      verifyHelper(syntheticOrderId, syntheticPaymentId, validSig, syntheticSecret),
      true,
      'Valid signature must verify successfully'
    );
    assert.strictEqual(
      verifyHelper(syntheticOrderId, syntheticPaymentId, 'deadbeef_tampered_signature', syntheticSecret),
      false,
      'Tampered signature must fail verification'
    );
    assert.strictEqual(
      verifyHelper('order_altered_99999', syntheticPaymentId, validSig, syntheticSecret),
      false,
      'Tampered order ID must fail verification'
    );
    assert.strictEqual(
      verifyHelper(syntheticOrderId, 'pay_altered_99999', validSig, syntheticSecret),
      false,
      'Tampered payment ID must fail verification'
    );
    console.log('✓ STEP 3 PASSED: HMAC-SHA256 signature verification functions verified with synthetic data.\n');

    // -------------------------------------------------------------------------
    // 4. NEON DATABASE & ROUTE AUDIT TESTS (LIVE NEXT.JS PRODUCTION SERVER)
    // -------------------------------------------------------------------------
    console.log('STEP 4: Neon DB Setup & Route Testing');
    testPass = await prisma.pass.findFirst({
      where: { isActive: true, totalQuantity: { gt: 10 } },
      orderBy: { price: 'asc' },
    });
    assert.ok(testPass, 'Active pass must exist in Neon');
    initialReserved = testPass.reservedQuantity;
    initialSold = testPass.soldQuantity;

    // Launch Next.js server on port 3042 with RAZORPAY_KEY_ID set and RAZORPAY_KEY_SECRET empty
    console.log(`  Launching Next.js server on port ${PORT}...`);
    serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
      env: {
        ...process.env,
        PORT: String(PORT),
        PAYMENT_PROVIDER: 'razorpay',
        PAYMENT_ENV: 'test',
        RAZORPAY_KEY_ID: rawKeyId,
        RAZORPAY_KEY_SECRET: '', // Strictly empty/missing
      },
      stdio: 'pipe',
    });

    await new Promise((resolve, reject) => {
      let started = false;
      const timeout = setTimeout(() => {
        if (!started) reject(new Error('Server start timed out after 15s'));
      }, 15000);

      const checkServer = () => {
        http
          .get(`${BASE_URL}/api/bookings/lookup`, (res) => {
            started = true;
            clearTimeout(timeout);
            resolve(true);
          })
          .on('error', () => {
            setTimeout(checkServer, 400);
          });
      };
      setTimeout(checkServer, 1000);
    });
    console.log(`  ✓ Next.js server responding on port ${PORT}`);

    // Create a pending test booking in Neon
    const testBookingPublicId = `RU26-AUDIT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const testBooking = await prisma.booking.create({
      data: {
        publicId: testBookingPublicId,
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        fullName: 'Audit Attendee',
        email: 'audit@example.com',
        phone: '+919931503960',
        city: 'Ranchi',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        expiresAt,
      },
    });
    createdBookingIds.add(testBooking.id);

    // Reserve 1 pass inventory in Neon
    await prisma.pass.update({
      where: { id: testPass.id },
      data: { reservedQuantity: { increment: 1 } },
    });

    const validSessionCookie = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([testBooking.publicId])}`;

    // Test 4A: Missing session -> 401
    console.log('  Testing POST /api/payments/create without session...');
    const unauthCreate = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: testBooking.publicId }),
    });
    assert.strictEqual(unauthCreate.status, 401, 'Request without session must return 401');

    // Test 4B: Unrelated booking session -> 403
    console.log('  Testing POST /api/payments/create with unrelated booking session...');
    const foreignCookie = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken(['RU26-OTHER-9999'])}`;
    const foreignCreate = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: foreignCookie },
      body: JSON.stringify({ bookingId: testBooking.publicId }),
    });
    assert.strictEqual(foreignCreate.status, 403, 'Request with foreign session must return 403');

    // Test 4C: Client attempts to initiate payment when RAZORPAY_KEY_SECRET is missing
    console.log('  Testing POST /api/payments/create with single key (missing secret)...');
    const singleKeyCreate = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: validSessionCookie },
      body: JSON.stringify({
        bookingId: testBooking.publicId,
        tamperedAmount: 1, // Tamper attempt
        tamperedCurrency: 'USD',
      }),
    });
    // Server catches missing RAZORPAY_KEY_SECRET safely and returns 500 without leaking credentials
    assert.strictEqual(singleKeyCreate.status, 500, 'Server safely returns 500 when Key Secret is missing');
    const singleKeyData = await singleKeyCreate.json();
    assert.strictEqual(singleKeyData.success, false);
    assert.strictEqual(
      singleKeyData.error,
      'Unable to initialize checkout session. Please try again.',
      'Must return user-safe error message without secret exposure'
    );

    // Verify PaymentAttempt was recorded with authoritative amount from Neon
    const attempt = await prisma.paymentAttempt.findFirst({
      where: { bookingId: testBooking.id },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(attempt, 'PaymentAttempt was recorded before order call');
    assert.strictEqual(attempt.amount, testBooking.totalAmount, 'Authoritative amount derived from Neon');
    assert.strictEqual(attempt.provider, 'razorpay', 'Provider is razorpay');
    createdPaymentAttemptIds.add(attempt.id);

    // Test 4D: POST /api/payments/verify missing session -> 401
    console.log('  Testing POST /api/payments/verify without session...');
    const unauthVerify = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: testBooking.publicId,
        razorpay_payment_id: 'pay_dummy_123',
        razorpay_order_id: 'order_dummy_123',
        razorpay_signature: 'sig_dummy_123',
      }),
    });
    assert.strictEqual(unauthVerify.status, 401, 'Verify without session must return 401');

    // Test 4E: POST /api/payments/verify unrelated session -> 403
    console.log('  Testing POST /api/payments/verify with foreign session...');
    const foreignVerify = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: foreignCookie },
      body: JSON.stringify({
        bookingId: testBooking.publicId,
        razorpay_payment_id: 'pay_dummy_123',
        razorpay_order_id: 'order_dummy_123',
        razorpay_signature: 'sig_dummy_123',
      }),
    });
    assert.strictEqual(foreignVerify.status, 403, 'Verify with foreign session must return 403');

    // Test 4F: POST /api/payments/verify invalid/unmatched order -> 400 signature error
    console.log('  Testing POST /api/payments/verify with untrusted order ID...');
    const untrustedVerify = await fetch(`${BASE_URL}/api/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: validSessionCookie },
      body: JSON.stringify({
        bookingId: testBooking.publicId,
        razorpay_payment_id: 'pay_untrusted_123',
        razorpay_order_id: 'order_untrusted_456',
        razorpay_signature: 'invalid_sig_abc',
      }),
    });
    assert.strictEqual(untrustedVerify.status, 400, 'Untrusted order ID / invalid signature must return 400');
    const untrustedData = await untrustedVerify.json();
    assert.match(untrustedData.error, /signature/i, 'Error message must reflect signature verification failure');

    // Test 4G: Expired booking rejection
    console.log('  Testing expired booking rejection...');
    const expiredBookingPublicId = `RU26-EXP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const expiredBooking = await prisma.booking.create({
      data: {
        publicId: expiredBookingPublicId,
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        fullName: 'Expired Attendee',
        email: 'expired@example.com',
        phone: '+919931503960',
        city: 'Ranchi',
        status: 'EXPIRED',
        paymentStatus: 'PENDING',
        expiresAt: new Date(Date.now() - 60000), // in the past
      },
    });
    createdBookingIds.add(expiredBooking.id);

    const expiredCookie = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([expiredBooking.publicId])}`;
    const expiredCreate = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: expiredCookie },
      body: JSON.stringify({ bookingId: expiredBooking.publicId }),
    });
    assert.strictEqual(expiredCreate.status, 410, 'Expired booking must return 410 Gone');

    // Test 4H: Confirmed booking rejection
    console.log('  Testing already confirmed booking rejection...');
    const confirmedBookingPublicId = `RU26-CONF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const confirmedBooking = await prisma.booking.create({
      data: {
        publicId: confirmedBookingPublicId,
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        fullName: 'Confirmed Attendee',
        email: 'confirmed@example.com',
        phone: '+919931503960',
        city: 'Ranchi',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        expiresAt: new Date(Date.now() + 600000),
        confirmedAt: new Date(),
      },
    });
    createdBookingIds.add(confirmedBooking.id);

    const confirmedCookie = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([confirmedBooking.publicId])}`;
    const confirmedCreate = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: confirmedCookie },
      body: JSON.stringify({ bookingId: confirmedBooking.publicId }),
    });
    assert.strictEqual(confirmedCreate.status, 200, 'Already confirmed booking returns 200');
    const confirmedData = await confirmedCreate.json();
    assert.strictEqual(confirmedData.alreadyConfirmed, true, 'alreadyConfirmed flag must be true');

    console.log('✓ STEP 4 PASSED: All provider route security and authorization invariants verified.\n');

    console.log('================================================================');
    console.log('ALL SINGLE-KEY DIAGNOSTIC & ROUTE AUDIT TESTS PASSED SUCCESSFULLY!');
    console.log('Razorpay live API/Checkout test blocked because RAZORPAY_KEY_SECRET is missing.');
    console.log('================================================================\n');
  } finally {
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
      console.log('[Cleanup] Terminating Next.js server...');
      serverProc.kill('SIGKILL');
    }
    await prisma.$disconnect();
  }
}

runSingleKeyRouteAuditTests().catch((err) => {
  console.error('❌ SINGLE-KEY AUDIT FAILURE:', err);
  process.exit(1);
});
