import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { OPEN_BOOKING_WINDOW_ENV } from './helpers/booking-window-env.mjs';

const prisma = new PrismaClient({ log: ['error'] });

const PORT = 3056;
const BASE_URL = `http://127.0.0.1:${PORT}`;
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

async function runCancellationLockTests() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — CHECKED-IN CANCELLATION LOCK TEST SUITE');
  console.log('Mode: real HTTP + real Neon (production server)');
  console.log('================================================================\n');

  const serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
    env: {
      ...process.env,
      ...OPEN_BOOKING_WINDOW_ENV,
      PORT: String(PORT),
      NODE_ENV: 'production',
    },
    stdio: 'pipe',
  });
  serverProc.stdout.on('data', () => {});
  serverProc.stderr.on('data', () => {});

  let testPass = null;
  const createdBookingIds = new Set();

  const makeBooking = async (overrides) => {
    const publicId = `RU26-REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const booking = await prisma.booking.create({
      data: {
        publicId,
        fullName: 'Cancel Lock Test',
        phone: '+91 99315 03980',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        confirmedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        source: 'cancel-lock-test',
        ...overrides,
      },
    });
    createdBookingIds.add(booking.id);
    return booking;
  };

  try {
    await waitForServer(BASE_URL);
    console.log('  ✓ Production server ready\n');

    testPass = await prisma.pass.create({
      data: {
        passType: `cancel-lock-test-${Date.now()}`,
        name: 'Cancel Lock Test Tier',
        price: 1000,
        totalQuantity: 5,
        reservedQuantity: 0,
        soldQuantity: 3,
        isActive: true,
      },
    });

    // ------------------------------------------------------------------
    // TEST 1: CHECKED_IN booking cannot be cancelled or refunded
    // ------------------------------------------------------------------
    {
      const booking = await makeBooking({
        checkInStatus: 'CHECKED_IN',
        checkedInAt: new Date(),
        checkedInBy: 'GATE-01 / Test Organiser',
        checkedInById: 'test-organiser-id',
      });

      const cookie = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([booking.publicId])}`;
      const res = await fetch(`${BASE_URL}/api/bookings/${booking.publicId}/cancel`, {
        method: 'POST',
        headers: { Cookie: cookie },
      });
      const body = await res.json();

      assert.equal(res.status, 409, 'Checked-in cancellation must be rejected');
      assert.equal(body.success, false);
      assert.equal(body.code, 'PASS_ALREADY_USED', 'Failure code must be PASS_ALREADY_USED');
      assert.match(body.error, /already been used for entry/i);
      assert.equal(body.refund, undefined, 'No refund quote may be issued for a checked-in pass');

      const dbAfter = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert.equal(dbAfter.status, 'CONFIRMED', 'Status must remain CONFIRMED');
      assert.equal(dbAfter.checkInStatus, 'CHECKED_IN', 'Check-in state must not be reverted');
      assert.equal(dbAfter.checkedInById, 'test-organiser-id', 'Audit identity must be preserved');

      const passAfter = await prisma.pass.findUnique({ where: { id: testPass.id } });
      assert.equal(passAfter.soldQuantity, 3, 'Sold inventory must not be refunded');
      console.log('  ✓ TEST 1: CHECKED_IN booking rejected with PASS_ALREADY_USED; state + inventory untouched');
    }

    // ------------------------------------------------------------------
    // TEST 2: NOT_CHECKED_IN cancellation still works (no regression)
    // ------------------------------------------------------------------
    {
      const booking = await makeBooking({ checkInStatus: 'NOT_CHECKED_IN' });

      const cookie = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([booking.publicId])}`;
      const res = await fetch(`${BASE_URL}/api/bookings/${booking.publicId}/cancel`, {
        method: 'POST',
        headers: { Cookie: cookie },
      });
      const body = await res.json();

      assert.equal(res.status, 200, 'Eligible cancellation must still succeed');
      assert.equal(body.success, true);
      assert.ok(body.refund, 'Refund calculation must still be returned');

      const dbAfter = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert.equal(dbAfter.status, 'CANCELLED');
      assert.equal(dbAfter.checkInStatus, 'NOT_CHECKED_IN');

      const passAfter = await prisma.pass.findUnique({ where: { id: testPass.id } });
      assert.equal(passAfter.soldQuantity, 2, 'Sold inventory must be restored by exactly 1');
      console.log('  ✓ TEST 2: eligible NOT_CHECKED_IN cancellation unaffected (200, inventory restored)');
    }

    // ------------------------------------------------------------------
    // TEST 3: Repeated checked-in attempts remain rejected (no state drift)
    // ------------------------------------------------------------------
    {
      const booking = await makeBooking({
        checkInStatus: 'CHECKED_IN',
        checkedInAt: new Date(Date.now() - 60000),
        checkedInBy: 'MAIN-GATE / Another Organiser',
        checkedInById: 'test-organiser-2',
      });
      const cookie = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([booking.publicId])}`;

      for (let i = 0; i < 2; i++) {
        const res = await fetch(`${BASE_URL}/api/bookings/${booking.publicId}/cancel`, {
          method: 'POST',
          headers: { Cookie: cookie },
        });
        assert.equal(res.status, 409, `Attempt ${i + 1} must be rejected`);
        const body = await res.json();
        assert.equal(body.code, 'PASS_ALREADY_USED');
      }

      const dbAfter = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert.equal(dbAfter.status, 'CONFIRMED');
      assert.equal(dbAfter.checkInStatus, 'CHECKED_IN');
      console.log('  ✓ TEST 3: repeated checked-in cancellation attempts rejected with zero state drift');
    }

    console.log('\n✓ CANCELLATION LOCK SUITE PASSED\n');
  } finally {
    serverProc.kill('SIGTERM');

    if (createdBookingIds.size > 0) {
      await prisma.booking.deleteMany({ where: { id: { in: Array.from(createdBookingIds) } } });
    }
    if (testPass) {
      await prisma.booking.deleteMany({ where: { passId: testPass.id } });
      await prisma.pass.delete({ where: { id: testPass.id } });
    }
    await prisma.$disconnect();
  }

  console.log('================================================================');
  console.log('✓ ALL CANCELLATION LOCK TESTS PASSED');
  console.log('================================================================');
}

runCancellationLockTests().catch((err) => {
  console.error('\n✗ CANCELLATION LOCK SUITE FAILED');
  console.error(err);
  process.exit(1);
});
