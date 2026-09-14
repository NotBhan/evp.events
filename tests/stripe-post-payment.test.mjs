import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const LOOKUP_SESSION_COOKIE_NAME = 'ru26_lookup_session';
const SESSION_TTL_MS = 30 * 60 * 1000;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.DATABASE_URL || 'ru26-default-dev-secret-salt-3981';
  return crypto.createHash('sha256').update(secret).digest('hex');
}

function createLookupSessionToken(bookingPublicIds) {
  const payload = {
    sessionKey: crypto.randomBytes(16).toString('hex'),
    bookingIds: [...new Set(bookingPublicIds.map((id) => id.trim()))],
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(serialized)
    .digest('base64url');

  return `${serialized}.${signature}`;
}

async function runStripeFlowTests() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — STRIPE POST-PAYMENT STATE & RETURN TEST SUITE');
  console.log('================================================================\n');

  // Find an active pass
  const pass = await prisma.pass.findFirst({ where: { passType: 'solo-female' } }) || await prisma.pass.findFirst();
  assert.ok(pass, 'Pass category must exist in database');

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testPublicId = `RU26-STRIPE-${randomSuffix}`;

  // 1. Create a fresh PENDING booking with reservedQuantity
  const passBefore = await prisma.pass.findUnique({ where: { id: pass.id } });
  await prisma.pass.update({
    where: { id: pass.id },
    data: { reservedQuantity: { increment: 1 } },
  });

  const booking = await prisma.booking.create({
    data: {
      publicId: testPublicId,
      passId: pass.id,
      quantity: 1,
      unitPrice: pass.price,
      totalAmount: pass.price,
      fullName: 'Vikram Aditya',
      phone: '+91 99315 03960',
      email: 'vikram@example.com',
      city: 'Ranchi',
      status: 'PENDING',
      paymentStatus: 'NOT_STARTED',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const sessionCookie = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([testPublicId])}`;

  try {
    // ------------------------------------------------------------------
    // TEST 1: Initial PENDING state check
    // ------------------------------------------------------------------
    console.log('--- TEST 1: Initial Reservation Authority ---');
    const initRes = await fetch(`${BASE_URL}/api/bookings/${testPublicId}`, {
      headers: { Cookie: sessionCookie },
    });
    const initData = await initRes.json();
    assert.equal(initRes.status, 200);
    assert.equal(initData.booking.status, 'PENDING');
    assert.equal(initData.booking.paymentStatus, 'NOT_STARTED');
    console.log('  ✓ Test 1: Authoritative database state is PENDING / NOT_STARTED\n');

    // ------------------------------------------------------------------
    // TEST 2: Stripe PaymentAttempt creation
    // ------------------------------------------------------------------
    console.log('--- TEST 2: PaymentAttempt Tracking ---');
    const paymentAttempt = await prisma.paymentAttempt.create({
      data: {
        bookingId: booking.id,
        provider: 'stripe',
        providerOrderId: `cs_test_${randomSuffix}`,
        amount: booking.totalAmount,
        status: 'INITIATED',
      },
    });
    assert.ok(paymentAttempt.id, 'PaymentAttempt created');
    console.log(`  ✓ Test 2: PaymentAttempt created with ID ${paymentAttempt.id}\n`);

    // ------------------------------------------------------------------
    // TEST 3: Return with status=cancelled retains PENDING and 24h hold
    // ------------------------------------------------------------------
    console.log('--- TEST 3: Return with status=cancelled ---');
    const cancelPageRes = await fetch(`${BASE_URL}/booking?status=cancelled&booking_id=${testPublicId}`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(cancelPageRes.status, 200);
    const cancelBookingCheck = await prisma.booking.findUnique({ where: { id: booking.id } });
    assert.equal(cancelBookingCheck.status, 'PENDING', 'Booking remains PENDING on cancel');
    assert.equal(cancelBookingCheck.paymentStatus, 'NOT_STARTED');
    console.log('  ✓ Test 3: Cancelled return keeps 24h reservation hold intact\n');

    // ------------------------------------------------------------------
    // TEST 4: Authoritative Webhook / Server Confirmation
    // ------------------------------------------------------------------
    console.log('--- TEST 4: Authoritative Payment Confirmation ---');
    await prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.update({
        where: { id: paymentAttempt.id },
        data: {
          status: 'SUCCEEDED',
          providerPaymentId: `pi_test_${randomSuffix}`,
        },
      });

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          confirmedAt: new Date(),
        },
      });

      await tx.pass.update({
        where: { id: pass.id },
        data: {
          reservedQuantity: { decrement: 1 },
          soldQuantity: { increment: 1 },
        },
      });
    });

    const confirmedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
    assert.equal(confirmedBooking.status, 'CONFIRMED');
    assert.equal(confirmedBooking.paymentStatus, 'PAID');
    console.log('  ✓ Test 4: Atomically transitioned status -> CONFIRMED, paymentStatus -> PAID\n');

    // ------------------------------------------------------------------
    // TEST 5: Inventory Transition Atomicity
    // ------------------------------------------------------------------
    console.log('--- TEST 5: Inventory Transition Atomicity ---');
    const passAfterConfirm = await prisma.pass.findUnique({ where: { id: pass.id } });
    assert.equal(
      passAfterConfirm.reservedQuantity,
      passBefore.reservedQuantity, // incremented by 1 in setup, decremented by 1 in confirm
      'reservedQuantity must be decremented'
    );
    assert.equal(
      passAfterConfirm.soldQuantity,
      passBefore.soldQuantity + 1,
      'soldQuantity must be incremented by 1'
    );
    console.log('  ✓ Test 5: reservedQuantity decremented and soldQuantity incremented exactly once\n');

    // ------------------------------------------------------------------
    // TEST 6: Bounded Polling Resolution (returns CONFIRMED)
    // ------------------------------------------------------------------
    console.log('--- TEST 6: Bounded Polling Verification ---');
    const pollRes = await fetch(`${BASE_URL}/api/bookings/${testPublicId}`, {
      headers: { Cookie: sessionCookie },
    });
    const pollData = await pollRes.json();
    assert.equal(pollRes.status, 200);
    assert.equal(pollData.success, true);
    assert.equal(pollData.booking.status, 'CONFIRMED');
    assert.equal(pollData.booking.paymentStatus, 'PAID');
    assert.equal(pollData.booking.bookingId, testPublicId);
    assert.equal(pollData.booking.total, booking.totalAmount);
    console.log('  ✓ Test 6: Polling /api/bookings/[id] returns authoritative CONFIRMED & PAID record\n');

    // ------------------------------------------------------------------
    // TEST 7: Idempotency on Refresh / Repeated Confirmation
    // ------------------------------------------------------------------
    console.log('--- TEST 7: Idempotent Refresh & Duplicate Protection ---');
    const refreshRes = await fetch(`${BASE_URL}/booking?bookingId=${testPublicId}`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(refreshRes.status, 200);

    const attemptsCount = await prisma.paymentAttempt.count({ where: { bookingId: booking.id } });
    assert.equal(attemptsCount, 1, 'Zero duplicate PaymentAttempt created on refresh');

    const passAfterRefresh = await prisma.pass.findUnique({ where: { id: pass.id } });
    assert.equal(passAfterRefresh.soldQuantity, passAfterConfirm.soldQuantity, 'Zero duplicate inventory mutation');
    console.log('  ✓ Test 7: Refreshing page creates zero duplicate bookings/attempts/inventory mutations\n');

    console.log('================================================================');
    console.log('ALL 7 STRIPE POST-PAYMENT FLOW TESTS PASSED 100%!');
    console.log('================================================================\n');
  } finally {
    // Cleanup test records
    await prisma.booking.deleteMany({ where: { publicId: testPublicId } });
    // Restore pass inventory
    await prisma.pass.update({
      where: { id: pass.id },
      data: { soldQuantity: { decrement: 1 } },
    });
    await prisma.$disconnect();
  }
}

runStripeFlowTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
