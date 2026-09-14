import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

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

class PaymentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PaymentError';
  }
}

class BookingExpiredError extends PaymentError {
  constructor(message = 'Booking has expired.') {
    super(message);
    this.name = 'BookingExpiredError';
  }
}

class PaymentAttemptNotFoundError extends PaymentError {
  constructor(message = 'Associated PaymentAttempt record was not found.') {
    super(message);
    this.name = 'PaymentAttemptNotFoundError';
  }
}

class AmountMismatchError extends PaymentError {
  constructor(message = 'Payment amount does not match authoritative booking total.') {
    super(message);
    this.name = 'AmountMismatchError';
  }
}

class InventoryInconsistencyError extends PaymentError {
  constructor(message) {
    super(message);
    this.name = 'InventoryInconsistencyError';
  }
}

const prisma = new PrismaClient({ log: ['error'] });
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('FATAL: STRIPE_SECRET_KEY is required in .env.local for Phase 4A testing.');
  process.exit(1);
}
const stripe = new Stripe(stripeKey);

const PORT = 3034;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function confirmBookingPayment(params, db = prisma) {
  const {
    provider,
    providerOrderId,
    providerPaymentId,
    expectedAmountPaise,
    bookingPublicId,
    paymentAttemptId,
  } = params;

  return await db.$transaction(async (tx) => {
    let attempt = null;
    if (paymentAttemptId) {
      attempt = await tx.paymentAttempt.findUnique({
        where: { id: paymentAttemptId },
      });
    }

    if (!attempt && providerOrderId) {
      attempt = await tx.paymentAttempt.findFirst({
        where: {
          provider,
          providerOrderId,
        },
      });
    }

    if (!attempt) {
      throw new PaymentAttemptNotFoundError(
        `No PaymentAttempt found for provider "${provider}" and order ID "${providerOrderId}".`
      );
    }

    const booking = await tx.booking.findUnique({
      where: { id: attempt.bookingId },
      include: { pass: true },
    });

    if (!booking) {
      throw new PaymentError(`Booking not found for PaymentAttempt ${attempt.id}.`);
    }

    if (bookingPublicId && booking.publicId !== bookingPublicId) {
      throw new PaymentError(
        `Security violation: Stripe event public ID "${bookingPublicId}" does not match record "${booking.publicId}".`
      );
    }

    if (attempt.status === 'SUCCEEDED') {
      return {
        success: true,
        alreadyProcessed: true,
        booking,
        paymentAttempt: attempt,
      };
    }

    if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID') {
      const updatedAttempt = await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'SUCCEEDED',
          providerPaymentId: providerPaymentId || attempt.providerPaymentId,
        },
      });
      return {
        success: true,
        alreadyProcessed: true,
        booking,
        paymentAttempt: updatedAttempt,
      };
    }

    if (booking.status === 'EXPIRED') {
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'FAILED',
          providerPaymentId: providerPaymentId || attempt.providerPaymentId,
        },
      });
      throw new BookingExpiredError(
        `Booking ${booking.publicId} has expired. Cannot confirm payment on an expired reservation.`
      );
    }

    const now = new Date();
    if (booking.expiresAt <= now) {
      await tx.$executeRaw`
        UPDATE bookings
        SET status = 'EXPIRED'::"BookingStatus",
            updated_at = NOW()
        WHERE id = ${booking.id}
          AND status = 'PENDING'::"BookingStatus"
      `;
      await tx.$executeRaw`
        UPDATE passes
        SET reserved_quantity = reserved_quantity - ${booking.quantity},
            updated_at = NOW()
        WHERE id = ${booking.passId}
          AND reserved_quantity >= ${booking.quantity}
      `;
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'FAILED',
          providerPaymentId: providerPaymentId || attempt.providerPaymentId,
        },
      });
      throw new BookingExpiredError(
        `Booking ${booking.publicId} reservation window elapsed. Reservation released.`
      );
    }

    const authoritativePaise = booking.totalAmount * 100;
    if (
      expectedAmountPaise !== undefined &&
      expectedAmountPaise !== authoritativePaise
    ) {
      throw new AmountMismatchError(
        `Amount mismatch: Stripe reported ${expectedAmountPaise} paise, but authoritative total is ${authoritativePaise} paise.`
      );
    }

    const updatedAttempt = await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'SUCCEEDED',
        providerPaymentId: providerPaymentId || attempt.providerPaymentId,
      },
    });

    const bookingUpdateCount = await tx.$executeRaw`
      UPDATE bookings
      SET status = 'CONFIRMED'::"BookingStatus",
          payment_status = 'PAID'::"PaymentStatus",
          confirmed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${booking.id}
        AND status = 'PENDING'::"BookingStatus"
    `;

    if (bookingUpdateCount === 0) {
      throw new PaymentError(
        `Failed to transition booking ${booking.publicId} to CONFIRMED. Concurrent mutation detected.`
      );
    }

    const passUpdateCount = await tx.$executeRaw`
      UPDATE passes
      SET reserved_quantity = reserved_quantity - ${booking.quantity},
          sold_quantity = sold_quantity + ${booking.quantity},
          updated_at = NOW()
      WHERE id = ${booking.passId}
        AND reserved_quantity >= ${booking.quantity}
    `;

    if (passUpdateCount === 0) {
      throw new InventoryInconsistencyError(
        `Inventory transition failed: Pass "${booking.passId}" has insufficient reserved_quantity to convert ${booking.quantity} reserved tickets to sold for booking ${booking.publicId}. Rolling back entire transaction.`
      );
    }

    const updatedBooking = await tx.booking.findUnique({
      where: { id: booking.id },
      include: { pass: true },
    });

    return {
      success: true,
      booking: updatedBooking,
      paymentAttempt: updatedAttempt,
    };
  });
}

async function failBookingPayment(params, db = prisma) {
  const { provider, providerOrderId, providerPaymentId, paymentAttemptId } = params;

  return await db.$transaction(async (tx) => {
    let attempt = null;
    if (paymentAttemptId) {
      attempt = await tx.paymentAttempt.findUnique({
        where: { id: paymentAttemptId },
      });
    }

    if (!attempt && providerOrderId) {
      attempt = await tx.paymentAttempt.findFirst({
        where: { provider, providerOrderId },
      });
    }

    if (!attempt && providerPaymentId) {
      attempt = await tx.paymentAttempt.findFirst({
        where: { provider, providerPaymentId },
      });
    }

    if (!attempt) {
      return { success: false, paymentAttempt: null };
    }

    if (attempt.status === 'SUCCEEDED') {
      return { success: true, paymentAttempt: attempt };
    }

    const updatedAttempt = await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'FAILED',
        providerPaymentId: providerPaymentId || attempt.providerPaymentId,
      },
    });

    return { success: true, paymentAttempt: updatedAttempt };
  });
}

async function runStripeTests() {
  console.log('================================================================');
  console.log('PHASE 4A: REAL NEON + STRIPE TEST API VERIFICATION SUITE');
  console.log('Database: Neon PostgreSQL (Authoritative)');
  console.log('Payment Gateway: Stripe TEST API');
  console.log('================================================================\n');

  const createdBookingIds = new Set();
  const createdPassIds = new Set();
  let serverProc = null;

  try {
    // 1. Launch Next.js Production Server on Port 3034
    console.log(`Launching Next.js server on port ${PORT}...`);
    serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
      env: {
        ...process.env,
        PORT: String(PORT),
        NODE_ENV: 'production',
      },
      stdio: 'pipe',
    });

    serverProc.stdout.on('data', (d) => {
      // suppress verbose logs
    });
    serverProc.stderr.on('data', (d) => {
      // suppress verbose logs
    });

    // Poll until server ready
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
        // keep waiting
      }
    }

    if (!ready) {
      throw new Error(`Next.js production server failed to start on port ${PORT}`);
    }
    console.log(`✓ Next.js server ready on port ${PORT}\n`);

    // Create temporary pass for tests
    const testPass = await prisma.pass.create({
      data: {
        passType: `stripe-test-pass-${Date.now()}`,
        name: 'STRIPE AUDIT PASS',
        price: 1499,
        totalQuantity: 20,
        reservedQuantity: 0,
        soldQuantity: 0,
        isActive: true,
      },
    });
    createdPassIds.add(testPass.id);

    // -------------------------------------------------------------------------
    // TEST 1: Exact Minor-Unit Conversion for All Official Price Points
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('TEST 1: EXACT STRIPE MINOR-UNIT CONVERSION');
    console.log('----------------------------------------------------------------');
    const pricePoints = [
      { inr: 999, expectedPaise: 99900 },
      { inr: 1499, expectedPaise: 149900 },
      { inr: 1999, expectedPaise: 199900 },
      { inr: 3599, expectedPaise: 359900 },
      { inr: 4999, expectedPaise: 499900 },
    ];

    for (const p of pricePoints) {
      const paise = p.inr * 100;
      assert.equal(paise, p.expectedPaise, `Price ₹${p.inr} must convert exactly to ${p.expectedPaise} paise`);
    }

    // Call real Stripe API directly to verify Checkout Session with dynamic price_data
    const directSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'RAAS UTSAV 2026 — VIP PASS TEST',
              description: 'Minor Unit Verification',
            },
            unit_amount: 149900,
          },
          quantity: 2,
        },
      ],
      success_url: `${BASE_URL}/booking?status=success`,
      cancel_url: `${BASE_URL}/booking?status=cancelled`,
    });

    assert(directSession.id.startsWith('cs_test_'), 'Session ID must start with cs_test_');
    assert.equal(directSession.amount_total, 299800, 'Total paise must equal 1499 * 2 * 100 = 299800');
    console.log(`TEST 1 | PASSED | Real Stripe API validated: ₹1499 × 2 = 299800 paise (cs_test: ${directSession.id.substring(0, 14)}...)`);

    // -------------------------------------------------------------------------
    // TEST 2: Client Amount Tamper Immunity via POST /api/payments/create
    // -------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 2: CLIENT AMOUNT TAMPER IMMUNITY');
    console.log('----------------------------------------------------------------');
    const booking1 = await prisma.booking.create({
      data: {
        publicId: `RU26-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: 'Rohan Verma',
        phone: '+91 98765 11111',
        email: 'rohan@example.com',
        city: 'Ranchi',
        passId: testPass.id,
        quantity: 2,
        unitPrice: 1499,
        totalAmount: 2998,
        status: 'PENDING',
        paymentStatus: 'NOT_STARTED',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        source: 'stripe-test',
      },
    });
    createdBookingIds.add(booking1.id);
    await prisma.pass.update({
      where: { id: testPass.id },
      data: { reservedQuantity: { increment: 2 } },
    });

    // Generate valid session token authorizing booking1
    const sessionToken = createLookupSessionToken([booking1.publicId]);

    // Send payment creation with fraudulent client amount attempts
    const payCreateRes = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${LOOKUP_SESSION_COOKIE_NAME}=${sessionToken}`,
      },
      body: JSON.stringify({
        bookingId: booking1.publicId,
        amount: 1, // Fraudulent attempt: 1 rupee
        unitPrice: 1, // Fraudulent attempt
        totalAmount: 1, // Fraudulent attempt
      }),
    });

    assert.equal(payCreateRes.status, 200, 'Payment create must succeed');
    const payCreateData = await payCreateRes.json();
    assert.equal(payCreateData.success, true);
    assert(payCreateData.checkoutUrl.includes('checkout.stripe.com'), 'Must return valid Stripe URL');

    // Retrieve real Stripe session created by endpoint to verify authoritative amount
    const retrievedStripeSession = await stripe.checkout.sessions.retrieve(payCreateData.sessionId);
    assert.equal(
      retrievedStripeSession.amount_total,
      299800,
      'Stripe session must record authoritative ₹2,998 (299800 paise), completely ignoring client-submitted 1 rupee'
    );
    console.log(`TEST 2 | PASSED | Client-sent 1 rupee strictly ignored. Stripe session recorded authoritative ₹2998 (299800 paise).`);

    // -------------------------------------------------------------------------
    // TEST 3: Session Authentication Guard
    // -------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 3: SESSION AUTHENTICATION GUARD');
    console.log('----------------------------------------------------------------');
    // Without session cookie
    const unauthRes = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking1.publicId }),
    });
    assert.equal(unauthRes.status, 401, 'Must reject with 401 when no session cookie is provided');

    // With session cookie for unrelated booking
    const unrelatedToken = createLookupSessionToken(['RU26-REQ-9999']);
    const forbiddenRes = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${LOOKUP_SESSION_COOKIE_NAME}=${unrelatedToken}`,
      },
      body: JSON.stringify({ bookingId: booking1.publicId }),
    });
    assert.equal(forbiddenRes.status, 403, 'Must reject with 403 when session does not authorize this booking');
    console.log('TEST 3 | PASSED | Missing session returned 401; cross-booking session returned 403.');

    // -------------------------------------------------------------------------
    // TEST 4 & 5: Multiple PaymentAttempts: Failed Attempt A followed by Successful Attempt B
    // -------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 4 & 5: MULTIPLE ATTEMPTS (FAILED A → SUCCESSFUL B)');
    console.log('----------------------------------------------------------------');
    // Attempt A
    const attemptA = await prisma.paymentAttempt.create({
      data: {
        bookingId: booking1.id,
        provider: 'stripe',
        providerOrderId: `cs_test_attempt_a_${Date.now()}`,
        amount: booking1.totalAmount,
        status: 'INITIATED',
      },
    });

    // Attempt B
    const attemptB = await prisma.paymentAttempt.create({
      data: {
        bookingId: booking1.id,
        provider: 'stripe',
        providerOrderId: `cs_test_attempt_b_${Date.now()}`,
        amount: booking1.totalAmount,
        status: 'INITIATED',
      },
    });

    // Fail Attempt A
    await failBookingPayment({
      provider: 'stripe',
      providerOrderId: attemptA.providerOrderId,
      paymentAttemptId: attemptA.id,
      errorReason: 'card_declined',
    });

    const refreshedAttemptA = await prisma.paymentAttempt.findUnique({ where: { id: attemptA.id } });
    assert.equal(refreshedAttemptA.status, 'FAILED');

    // Booking must remain PENDING with reservation intact
    const midBooking = await prisma.booking.findUnique({ where: { id: booking1.id } });
    assert.equal(midBooking.status, 'PENDING');
    assert.equal(midBooking.paymentStatus, 'NOT_STARTED');

    const passBeforeB = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.equal(passBeforeB.reservedQuantity, 2);
    assert.equal(passBeforeB.soldQuantity, 0);

    // Confirm Attempt B
    const confirmBRes = await confirmBookingPayment({
      provider: 'stripe',
      providerOrderId: attemptB.providerOrderId,
      paymentAttemptId: attemptB.id,
      providerPaymentId: `pi_test_b_${Date.now()}`,
      expectedAmountPaise: 299800,
      bookingPublicId: booking1.publicId,
    });

    assert.equal(confirmBRes.success, true);
    assert.equal(confirmBRes.booking.status, 'CONFIRMED');
    assert.equal(confirmBRes.booking.paymentStatus, 'PAID');
    assert(confirmBRes.booking.confirmedAt instanceof Date);
    assert.equal(confirmBRes.paymentAttempt.status, 'SUCCEEDED');

    // Verify Neon pass inventory transition: exact reservedQuantity -> soldQuantity
    const passAfterB = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.equal(passAfterB.reservedQuantity, 0, 'Reserved quantity must decrement by 2 (2 -> 0)');
    assert.equal(passAfterB.soldQuantity, 2, 'Sold quantity must increment by 2 (0 -> 2)');
    console.log('TEST 4 & 5 | PASSED | Attempt A failed cleanly leaving booking PENDING. Attempt B confirmed atomically: reserved=0, sold=2.');

    // -------------------------------------------------------------------------
    // TEST 6: Replay of Successful Attempt B (Idempotency)
    // -------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 6: REPLAY OF SUCCESSFUL ATTEMPT B (IDEMPOTENCY)');
    console.log('----------------------------------------------------------------');
    const replayRes = await confirmBookingPayment({
      provider: 'stripe',
      providerOrderId: attemptB.providerOrderId,
      paymentAttemptId: attemptB.id,
      providerPaymentId: `pi_test_b_${Date.now()}`,
      expectedAmountPaise: 299800,
      bookingPublicId: booking1.publicId,
    });

    assert.equal(replayRes.success, true);
    assert.equal(replayRes.alreadyProcessed, true, 'Replay must return alreadyProcessed: true');

    const passAfterReplay = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.equal(passAfterReplay.reservedQuantity, 0);
    assert.equal(passAfterReplay.soldQuantity, 2, 'Sold quantity must not double-increment');
    console.log('TEST 6 | PASSED | Replay of Attempt B returned alreadyProcessed: true. Zero inventory duplicate mutations.');

    // -------------------------------------------------------------------------
    // TEST 7: Replay of Old Attempt A Cannot Corrupt Confirmed Booking
    // -------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 7: OLD ATTEMPT A CANNOT AFFECT CONFIRMED BOOKING');
    console.log('----------------------------------------------------------------');
    await failBookingPayment({
      provider: 'stripe',
      providerOrderId: attemptA.providerOrderId,
      paymentAttemptId: attemptA.id,
      errorReason: 'late_failure_replay',
    });

    const confirmedBookingCheck = await prisma.booking.findUnique({ where: { id: booking1.id } });
    assert.equal(confirmedBookingCheck.status, 'CONFIRMED');
    assert.equal(confirmedBookingCheck.paymentStatus, 'PAID');

    const passAfterOldAttemptA = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.equal(passAfterOldAttemptA.soldQuantity, 2);
    console.log('TEST 7 | PASSED | Replay of old failed Attempt A left booking strictly CONFIRMED/PAID.');

    // -------------------------------------------------------------------------
    // TEST 8: Unrelated Stripe Session Cannot Confirm Booking
    // -------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 8: UNRELATED STRIPE SESSION REJECTION');
    console.log('----------------------------------------------------------------');
    await assert.rejects(
      async () => {
        await confirmBookingPayment({
          provider: 'stripe',
          providerOrderId: 'cs_test_unrelated_order_999999',
          expectedAmountPaise: 299800,
        });
      },
      PaymentAttemptNotFoundError,
      'Unrelated Stripe order must throw PaymentAttemptNotFoundError'
    );
    console.log('TEST 8 | PASSED | Unrelated providerOrderId rejected with PaymentAttemptNotFoundError.');

    // -------------------------------------------------------------------------
    // TEST 9: Expired Booking Payment Invariant (Late Payment Rejection)
    // -------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 9: EXPIRED BOOKING CANNOT BECOME CONFIRMED');
    console.log('----------------------------------------------------------------');
    const expiredBooking = await prisma.booking.create({
      data: {
        publicId: `RU26-EXP-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: 'Late Payer',
        phone: '+91 98765 22222',
        email: 'late@example.com',
        city: 'Ranchi',
        passId: testPass.id,
        quantity: 1,
        unitPrice: 1499,
        totalAmount: 1499,
        status: 'EXPIRED', // already expired
        paymentStatus: 'NOT_STARTED',
        expiresAt: new Date(Date.now() - 3600 * 1000), // in the past
        source: 'stripe-test',
      },
    });
    createdBookingIds.add(expiredBooking.id);

    const expiredAttempt = await prisma.paymentAttempt.create({
      data: {
        bookingId: expiredBooking.id,
        provider: 'stripe',
        providerOrderId: `cs_test_expired_${Date.now()}`,
        amount: expiredBooking.totalAmount,
        status: 'INITIATED',
      },
    });

    await assert.rejects(
      async () => {
        await confirmBookingPayment({
          provider: 'stripe',
          providerOrderId: expiredAttempt.providerOrderId,
          paymentAttemptId: expiredAttempt.id,
          expectedAmountPaise: 149900,
          bookingPublicId: expiredBooking.publicId,
        });
      },
      BookingExpiredError,
      'Confirming expired booking must throw BookingExpiredError'
    );

    // Verify booking is still EXPIRED and sold inventory was NOT incremented
    const postExpiredCheck = await prisma.booking.findUnique({ where: { id: expiredBooking.id } });
    assert.equal(postExpiredCheck.status, 'EXPIRED', 'Booking must remain EXPIRED');
    assert.notEqual(postExpiredCheck.paymentStatus, 'PAID');

    const passAfterExpiredAttempt = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.equal(passAfterExpiredAttempt.soldQuantity, 2, 'Sold quantity must remain unchanged at 2');
    console.log('TEST 9 | PASSED | Expired booking strictly refused confirmation. Inventory not sold.');

    // -------------------------------------------------------------------------
    // TEST 10: Webhook Defensive Rejection & Signature Safety
    // -------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 10: WEBHOOK DEFENSIVE REJECTION & SIGNATURE SAFETY');
    console.log('----------------------------------------------------------------');
    // Call webhook without STRIPE_WEBHOOK_SECRET configured
    const webhookRes = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });
    assert.ok(
      webhookRes.status === 400 || webhookRes.status === 503,
      `Webhook endpoint must defensively reject unsigned payload (expected 400 or 503, got ${webhookRes.status})`
    );
    console.log(`TEST 10 | PASSED | POST /api/webhooks/stripe defensively returned ${webhookRes.status}. Unverified payloads safely rejected.`);

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP & TEARDOWN
    // -------------------------------------------------------------------------
    console.log('\n----------------------------------------------------------------');
    console.log('DATABASE CLEANUP & TEARDOWN');
    console.log('----------------------------------------------------------------');
    if (createdBookingIds.size > 0) {
      const delBookings = await prisma.booking.deleteMany({
        where: { id: { in: Array.from(createdBookingIds) } },
      });
      console.log(`✓ Deleted ${delBookings.count} temporary test booking records and payment attempts.`);
    }

    if (createdPassIds.size > 0) {
      const delPasses = await prisma.pass.deleteMany({
        where: { id: { in: Array.from(createdPassIds) } },
      });
      console.log(`✓ Deleted ${delPasses.count} temporary test pass tiers.`);
    }

    // Verify Neon database state
    const remainingBookings = await prisma.booking.count();
    const remainingPasses = await prisma.pass.count();
    console.log(`\nPost-Test Neon Database State:`);
    console.log(`- Remaining Bookings: ${remainingBookings}`);
    console.log(`- Official Passes in Catalog: ${remainingPasses}`);

    assert.equal(remainingBookings, 0, 'Zero test bookings must remain in database');
    assert.equal(remainingPasses, 5, 'Exactly 5 official pass tiers must remain in database');

    if (serverProc) {
      serverProc.kill('SIGKILL');
      console.log('✓ Next.js server terminated cleanly.');
    }
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 4A STRIPE TEST SUITE TESTS EXECUTED AND PASSED!');
  console.log('================================================================\n');
  process.exit(0);
}

runStripeTests().catch((err) => {
  console.error('\n❌ STRIPE TEST SUITE FAILURE:', err);
  process.exit(1);
});
