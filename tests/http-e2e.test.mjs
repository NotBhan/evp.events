import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { OPEN_BOOKING_WINDOW_ENV } from './helpers/booking-window-env.mjs';

const PORT = 3030;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const prisma = new PrismaClient({ log: ['error'] });

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.status >= 200 && res.status < 500) return;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function runHttpTests() {
  console.log('🚀 Launching Next.js production server on port 3030 for end-to-end API testing...');

  const serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
    stdio: 'pipe',
    env: { ...process.env, ...OPEN_BOOKING_WINDOW_ENV },
  });

  serverProc.stdout.on('data', (data) => {
    // console.log(`[Next.js stdout]: ${data}`);
  });
  serverProc.stderr.on('data', (data) => {
    // console.error(`[Next.js stderr]: ${data}`);
  });

  let testPass = null;
  let emptyPass = null;

  try {
    await waitForServer(`${BASE_URL}/`, 15000);
    console.log('  ✓ Next.js server is listening and ready on port 3030\n');

    // TEST A: Invalid Mobile
    console.log('--- HTTP TEST 1: Validation via Real HTTP POST ---');
    const badPhoneRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passId: 'solo-female',
        quantity: 1,
        fullName: 'Jane Doe',
        phone: 'invalid-phone',
      }),
    });
    const badPhoneData = await badPhoneRes.json();
    assert.equal(badPhoneRes.status, 400);
    assert.equal(badPhoneData.success, false);
    assert.match(badPhoneData.error, /10-digit/i);
    console.log('  ✓ Invalid phone rejected with HTTP 400');

    // TEST B: Anti-Spam Honeypot
    const honeypotRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passId: 'solo-female',
        quantity: 1,
        fullName: 'Jane Doe',
        phone: '9876543210',
        hp_company_field: 'Spammer Bot',
      }),
    });
    const honeypotData = await honeypotRes.json();
    assert.equal(honeypotRes.status, 400);
    assert.equal(honeypotData.success, false);
    assert.match(honeypotData.error, /anti-spam/i);
    console.log('  ✓ Honeypot spam submission rejected with HTTP 400');

    // TEST C: Zero Inventory Pass (isolated tier — production inventory is not assumed empty)
    console.log('\n--- HTTP TEST 2: Zero-Inventory Guard ---');
    const emptyPassType = `http-test-empty-${Date.now()}`;
    emptyPass = await prisma.pass.create({
      data: {
        passType: emptyPassType,
        name: 'Zero Inventory Test Tier',
        price: 999,
        totalQuantity: 0,
        reservedQuantity: 0,
        soldQuantity: 0,
        isActive: true,
      },
    });
    const prodRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passId: emptyPassType,
        fullName: 'Jane Doe',
        email: 'zero.inventory@suitetest.example',
        phone: '9876543210',
      }),
    });
    const prodData = await prodRes.json();
    assert.equal(prodRes.status, 409);
    assert.equal(prodData.success, false);
    assert.match(prodData.error, /not available or sold out/i);
    const emptyPassBookings = await prisma.booking.count({ where: { passId: emptyPass.id } });
    assert.equal(emptyPassBookings, 0, 'No booking rows may be created for the zero-inventory tier');
    console.log('  ✓ Zero-inventory pass rejected with HTTP 409 and zero booking rows created');

    // TEST D: Controlled Test Pass with Capacity
    console.log('\n--- HTTP TEST 3: Successful Booking & Price Protection ---');
    const testPassType = `http-test-${Date.now()}`;
    testPass = await prisma.pass.create({
      data: {
        passType: testPassType,
        name: 'HTTP E2E Test Pass',
        price: 1200,
        totalQuantity: 2,
        reservedQuantity: 0,
        soldQuantity: 0,
        isActive: true,
      },
    });
    console.log(`  ✓ Created test pass "${testPassType}" (₹1200, total: 2)`);

    // Submit booking with tampered client price
    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passId: testPassType,
        quantity: 1,
        fullName: 'Anita Sharma',
        phone: '9931503960',
        email: 'anita@example.com',
        city: 'Ranchi',
        unitPrice: 1, // Tampered client price
        total: 1, // Tampered client total
      }),
    });
    const bookData = await bookRes.json();
    assert.equal(bookRes.status, 201, `Expected HTTP 201, got ${bookRes.status}`);
    assert.equal(bookData.success, true);
    assert.match(bookData.bookingId, /^RU26-REQ-\d{4}$/);
    assert.equal(bookData.unitPrice, 1200, 'Server must enforce authoritative ₹1200');
    assert.equal(bookData.totalAmount, 1200, 'Server must enforce authoritative total ₹1200');
    assert.equal(bookData.status, 'PENDING');
    assert.equal(bookData.paymentStatus, 'NOT_STARTED');
    console.log(`  ✓ Booking 1 created via HTTP: ${bookData.bookingId}, ₹${bookData.totalAmount}, PENDING`);

    // Second booking consumes the remaining 1 ticket
    const bookRes2 = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passId: testPassType,
        quantity: 1,
        fullName: 'Rahul Verma',
        email: 'rahul.verma@suitetest.example',
        phone: '9931503961',
      }),
    });
    const bookData2 = await bookRes2.json();
    assert.equal(bookRes2.status, 201);
    assert.notEqual(bookData2.bookingId, bookData.bookingId);
    console.log(`  ✓ Booking 2 created via HTTP: ${bookData2.bookingId}, capacity now exhausted`);

    // Third booking must be rejected with 409
    const bookRes3 = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passId: testPassType,
        quantity: 1,
        fullName: 'Extra Attendee',
        email: 'extra.attendee@suitetest.example',
        phone: '9931503962',
      }),
    });
    const bookData3 = await bookRes3.json();
    assert.equal(bookRes3.status, 409);
    assert.equal(bookData3.success, false);
    console.log('  ✓ 3rd booking rejected with HTTP 409 (capacity strictly enforced)');

    // Verify DB state
    const dbPass = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.equal(dbPass.reservedQuantity, 2);
    assert.equal(dbPass.soldQuantity, 0);
    assert.equal(dbPass.totalQuantity, 2);
    console.log('  ✓ Neon DB state verified: reserved=2, sold=0, total=2');
  } finally {
    if (testPass) {
      console.log('\n--- CLEANUP & TEARDOWN ---');
      await prisma.booking.deleteMany({ where: { passId: testPass.id } });
      await prisma.pass.delete({ where: { id: testPass.id } });
      console.log('  ✓ Cleaned up HTTP test bookings and test pass from Neon');
    }

    if (emptyPass) {
      await prisma.booking.deleteMany({ where: { passId: emptyPass.id } });
      await prisma.pass.delete({ where: { id: emptyPass.id } });
      console.log('  ✓ Cleaned up zero-inventory test pass from Neon');
    }

    serverProc.kill('SIGKILL');
    await prisma.$disconnect();
    console.log('  ✓ Next.js server terminated cleanly');
  }

  console.log('\n🎉 HTTP END-TO-END VERIFICATION COMPLETED SUCCESSFULLY!\n');
  process.exit(0);
}

runHttpTests().catch((err) => {
  console.error('\n❌ HTTP TEST FAILURE:', err);
  process.exit(1);
});
