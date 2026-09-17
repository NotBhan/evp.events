import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { OPEN_BOOKING_WINDOW_ENV } from './helpers/booking-window-env.mjs';

const prisma = new PrismaClient({ log: ['error'] });

const PORT = 3055;
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

async function runSinglePassTests() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — SINGLE-PASS BOOKING MODEL TEST SUITE');
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
  let legacyPassId = null;
  const createdBookingIds = new Set();

  try {
    await waitForServer(BASE_URL);
    console.log('  ✓ Production server ready\n');

    testPass = await prisma.pass.create({
      data: {
        passType: `single-pass-test-${Date.now()}`,
        name: 'Single Pass Test Tier',
        price: 900,
        totalQuantity: 5,
        reservedQuantity: 0,
        soldQuantity: 0,
        isActive: true,
      },
    });

    // ------------------------------------------------------------------
    // TEST 1: Booking desk UI no longer offers a quantity selector
    // ------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/booking`);
      assert.equal(res.status, 200, 'Booking page must render');
      const html = await res.text();
      assert.ok(html.includes('ONE PASS PER BOOKING'), 'Single-pass notice must be rendered');
      assert.ok(!html.includes('NUMBER OF PASSES'), 'Quantity selector must be removed');
      assert.ok(!html.includes('stage-1-quantity'), 'No quantity stepper container in markup');
      console.log('  ✓ TEST 1: Booking desk renders single-pass notice, no quantity selector');
    }

    // ------------------------------------------------------------------
    // TEST 2: Client quantity/unitPrice/total cannot alter stored values
    // ------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passId: testPass.passType,
          quantity: 25, // tampered
          unitPrice: 1, // tampered
          total: 1, // tampered
          totalAmount: 1, // tampered
          fullName: 'Tamper Attempt',
          email: 'tamper@suitetest.example',
          phone: '9931503970',
        }),
      });
      const body = await res.json();
      assert.equal(res.status, 201, `Expected 201, got ${res.status}`);
      assert.equal(body.quantity, 1, 'Response quantity must be forced to 1');
      assert.equal(body.unitPrice, testPass.price, 'Response unit price must be authoritative');
      assert.equal(body.totalAmount, testPass.price, 'Response total must be authoritative');
      assert.equal(body.total, testPass.price, 'Response total (legacy field) must be authoritative');

      const dbBooking = await prisma.booking.findUnique({ where: { publicId: body.bookingId } });
      createdBookingIds.add(dbBooking.id);
      assert.equal(dbBooking.quantity, 1, 'DB quantity must be 1');
      assert.equal(dbBooking.unitPrice, 900, 'DB unit price must be authoritative');
      assert.equal(dbBooking.totalAmount, 900, 'DB total must be authoritative');

      const pass = await prisma.pass.findUnique({ where: { id: testPass.id } });
      assert.equal(pass.reservedQuantity, 1, 'Exactly one pass must be reserved per booking');
      console.log('  ✓ TEST 2: quantity=25 / unitPrice=1 / total=1 ignored — stored quantity=1, total=₹900');
    }

    // ------------------------------------------------------------------
    // TEST 3: Garbage / missing client quantity cannot 400 or alter data
    // ------------------------------------------------------------------
    {
      const attempts = ['abc', 0, -5, null, undefined, 1.5];
      let accepted = 0;
      for (const quantity of attempts) {
        const res = await fetch(`${BASE_URL}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passId: testPass.passType,
            quantity,
            fullName: 'Quantity Edge',
            email: 'quantity.edge@suitetest.example',
            phone: '9931503971',
          }),
        });

        if (res.status === 409) continue; // capacity exhausted — legitimate rejection

        assert.equal(res.status, 201, `quantity=${String(quantity)} must be ignored (got ${res.status})`);
        const body = await res.json();
        assert.equal(body.quantity, 1);
        assert.equal(body.totalAmount, 900);
        const dbBooking = await prisma.booking.findUnique({ where: { publicId: body.bookingId } });
        createdBookingIds.add(dbBooking.id);
        accepted++;
      }

      assert.ok(accepted >= 1, 'At least one garbage-quantity attempt must be accepted with quantity=1');

      const pass = await prisma.pass.findUnique({ where: { id: testPass.id } });
      assert.equal(pass.reservedQuantity, 5, 'All 5 available passes must be reserved exactly once each');
      console.log(`  ✓ TEST 3: garbage quantities ignored (${accepted} accepted, rest correctly 409); reserved=5/5 exactly`);
    }

    // ------------------------------------------------------------------
    // TEST 4: Historical multi-quantity rows remain readable (legacy)
    // ------------------------------------------------------------------
    {
      const legacyPass = await prisma.pass.create({
        data: {
          passType: `single-pass-legacy-${Date.now()}`,
          name: 'Legacy Multi-Pass Tier',
          price: 900,
          totalQuantity: 10,
          reservedQuantity: 0,
          soldQuantity: 3,
          isActive: true,
        },
      });
      legacyPassId = legacyPass.id;

      const legacyPublicId = `RU26-REQ-${Math.floor(1000 + Math.random() * 9000)}`;
      const legacy = await prisma.booking.create({
        data: {
          publicId: legacyPublicId,
          fullName: 'Legacy Family Booking',
          phone: '+91 99315 03999',
          passId: legacyPass.id,
          quantity: 3, // historical multi-pass row
          unitPrice: 900,
          totalAmount: 2700,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          expiresAt: new Date(Date.now() + 3600000),
          source: 'legacy-row-test',
        },
      });
      createdBookingIds.add(legacy.id);

      const cookie = `${LOOKUP_SESSION_COOKIE_NAME}=${createLookupSessionToken([legacyPublicId])}`;
      const res = await fetch(`${BASE_URL}/api/bookings/${legacyPublicId}`, {
        headers: { Cookie: cookie },
      });
      assert.equal(res.status, 200, 'Legacy booking must remain retrievable');
      const body = await res.json();
      assert.equal(body.booking.quantity, 3, 'Legacy row quantity must remain readable and unmodified');
      assert.equal(body.booking.totalAmount, 2700, 'Legacy row total must remain unmodified');

      const dbLegacy = await prisma.booking.findUnique({ where: { publicId: legacyPublicId } });
      assert.equal(dbLegacy.quantity, 3, 'Legacy row must not be rewritten');
      console.log('  ✓ TEST 4: historical quantity=3 row readable and unmodified');
    }

    console.log('\n✓ SINGLE-PASS SUITE PASSED\n');
  } finally {
    serverProc.kill('SIGTERM');

    if (createdBookingIds.size > 0) {
      await prisma.booking.deleteMany({ where: { id: { in: Array.from(createdBookingIds) } } });
    }
    if (testPass) {
      await prisma.booking.deleteMany({ where: { passId: testPass.id } });
      await prisma.pass.delete({ where: { id: testPass.id } });
    }
    if (legacyPassId) {
      await prisma.booking.deleteMany({ where: { passId: legacyPassId } });
      await prisma.pass.delete({ where: { id: legacyPassId } });
    }
    await prisma.$disconnect();
  }

  console.log('================================================================');
  console.log('✓ ALL SINGLE-PASS TESTS PASSED');
  console.log('================================================================');
}

runSinglePassTests().catch((err) => {
  console.error('\n✗ SINGLE-PASS TEST SUITE FAILED');
  console.error(err);
  process.exit(1);
});
