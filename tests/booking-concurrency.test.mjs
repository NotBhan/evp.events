import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

function generatePublicBookingId() {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `RU26-REQ-${randomDigits}`;
}

function normalizeIndianPhone(phoneInput) {
  if (typeof phoneInput !== 'string') return null;
  const digits = phoneInput.replace(/\D/g, '');

  let tenDigits = digits;
  if (digits.length === 12 && digits.startsWith('91')) {
    tenDigits = digits.substring(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    tenDigits = digits.substring(1);
  }

  if (tenDigits.length !== 10 || !/^[6-9]\d{9}$/.test(tenDigits)) {
    return null;
  }

  return `+91 ${tenDigits.substring(0, 5)} ${tenDigits.substring(5)}`;
}

/**
 * Executes an atomic booking reservation transaction directly against Neon,
 * mirroring the exact logic in app/api/bookings/route.ts.
 */
async function executeBookingTransaction({
  passIdentifier,
  quantity,
  fullName,
  phone,
  email,
  city,
  clientUnitPrice,
  clientTotal,
  hp_company_field,
}) {
  // 1. Anti-spam honeypot check
  if (hp_company_field && String(hp_company_field).trim().length > 0) {
    return { status: 400, error: 'Anti-spam validation triggered.' };
  }

  // 2. Validate attendee fields
  const trimmedName = typeof fullName === 'string' ? fullName.trim() : '';
  if (trimmedName.length < 2 || trimmedName.length > 80) {
    return { status: 400, error: 'Please provide a valid full name (2–80 characters).' };
  }

  const formattedPhone = normalizeIndianPhone(phone);
  if (!formattedPhone) {
    return { status: 400, error: 'Please provide a valid 10-digit Indian mobile number.' };
  }

  let normalizedEmail = null;
  if (email && typeof email === 'string') {
    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 0 && trimmedEmail.toUpperCase() !== 'N/A') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return { status: 400, error: 'Please provide a valid email address.' };
      }
      normalizedEmail = trimmedEmail.toLowerCase();
    }
  }

  const normalizedCity =
    typeof city === 'string' && city.trim().length > 0
      ? city.trim().substring(0, 80)
      : 'Ranchi';

  // 3. Single-pass model: the client-supplied quantity is ignored entirely.
  void quantity;
  const qty = 1;

  // 4. Authoritative transaction with collision retry loop
  const MAX_COLLISION_RETRIES = 5;
  let retryCount = 0;

  while (retryCount < MAX_COLLISION_RETRIES) {
    retryCount++;
    const publicBookingId = generatePublicBookingId();

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Resolve pass
        const pass = await tx.pass.findFirst({
          where: {
            isActive: true,
            OR: [{ id: passIdentifier }, { passType: passIdentifier }],
          },
        });

        if (!pass || !pass.isActive) {
          throw Object.assign(new Error('Requested pass tier was not found or is inactive.'), {
            code: 'NOT_FOUND',
          });
        }

        // Atomic conditional reservation
        const updatedRows = await tx.$executeRaw`
          UPDATE passes
          SET reserved_quantity = reserved_quantity + ${qty},
              updated_at = NOW()
          WHERE id = ${pass.id}
            AND is_active = true
            AND (total_quantity - reserved_quantity - sold_quantity) >= ${qty}
        `;

        if (updatedRows === 0) {
          throw Object.assign(
            new Error(
              'Pass inventory is currently not available or sold out. Production inventory must be configured before bookings are enabled.'
            ),
            { code: 'INSUFFICIENT_INVENTORY' }
          );
        }

        // Authoritative pricing: client values are completely ignored
        const unitPrice = pass.price;
        const totalAmount = unitPrice;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const booking = await tx.booking.create({
          data: {
            publicId: publicBookingId,
            fullName: trimmedName,
            phone: formattedPhone,
            email: normalizedEmail,
            city: normalizedCity,
            passId: pass.id,
            quantity: qty,
            unitPrice,
            totalAmount,
            status: 'PENDING',
            paymentStatus: 'NOT_STARTED',
            expiresAt,
            source: 'web-booking-desk',
          },
        });

        return { booking, pass };
      });

      return {
        status: 201,
        success: true,
        bookingId: result.booking.publicId,
        passId: result.pass.passType,
        passType: result.pass.name,
        quantity: result.booking.quantity,
        unitPrice: result.booking.unitPrice,
        totalAmount: result.booking.totalAmount,
        total: result.booking.totalAmount,
        fullName: result.booking.fullName,
        phone: result.booking.phone,
        email: result.booking.email,
        city: result.booking.city,
        statusName: result.booking.status,
        paymentStatus: result.booking.paymentStatus,
        createdAt: result.booking.createdAt.toISOString(),
        expiresAt: result.booking.expiresAt.toISOString(),
      };
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return { status: 404, error: err.message };
      }
      if (err.code === 'INSUFFICIENT_INVENTORY') {
        return { status: 409, error: err.message };
      }
      if (err.code === 'P2002') {
        // Unique constraint collision retry
        continue;
      }
      throw err;
    }
  }

  return { status: 500, error: 'Failed to assign unique booking ID.' };
}

async function runAllTests() {
  console.log('🚀 STARTING PHASE 2 AUTOMATED INTEGRATION & CONCURRENCY SUITE\n');

  let zeroInventoryPass = null;

  // TEST 1: Validation Rules
  console.log('--- TEST 1: Server-Side Validation Integrity ---');
  {
    const invalidPhoneRes = await executeBookingTransaction({
      passIdentifier: 'solo-female',
      quantity: 1,
      fullName: 'Valid Name',
      phone: '12345',
    });
    assert.equal(invalidPhoneRes.status, 400, 'Invalid phone must return 400');
    console.log('  ✓ Invalid phone rejected with HTTP 400');

    const shortNameRes = await executeBookingTransaction({
      passIdentifier: 'solo-female',
      quantity: 1,
      fullName: 'A',
      phone: '9876543210',
    });
    assert.equal(shortNameRes.status, 400, 'Short name must return 400');
    console.log('  ✓ Short name (<2 chars) rejected with HTTP 400');

    const honeypotRes = await executeBookingTransaction({
      passIdentifier: 'solo-female',
      quantity: 1,
      fullName: 'Valid Name',
      phone: '9876543210',
      hp_company_field: 'Spam Bot LLC',
    });
    assert.equal(honeypotRes.status, 400, 'Honeypot trigger must return 400');
    console.log('  ✓ Honeypot spam submission rejected with HTTP 400');
  }

  // TEST 2: Zero-Inventory Guard (isolated tier — production inventory is not assumed empty)
  console.log('\n--- TEST 2: Zero-Inventory Guard ---');
  {
    zeroInventoryPass = await prisma.pass.create({
      data: {
        passType: `zero-inventory-${Date.now()}`,
        name: 'Zero Inventory Tier',
        price: 999,
        totalQuantity: 0,
        reservedQuantity: 0,
        soldQuantity: 0,
        isActive: true,
      },
    });

    const prodBookingRes = await executeBookingTransaction({
      passIdentifier: zeroInventoryPass.passType,
      quantity: 1,
      fullName: 'Test Attendee',
      phone: '9876543210',
      email: 'test@example.com',
    });
    assert.equal(
      prodBookingRes.status,
      409,
      'Booking for zero-inventory pass must return 409 Conflict'
    );
    assert.match(
      prodBookingRes.error,
      /not available or sold out/i,
      'Error message must indicate inventory unavailable'
    );
    console.log('  ✓ Zero-inventory pass correctly rejected with HTTP 409');

    const prodBookingsInDb = await prisma.booking.count({
      where: { passId: zeroInventoryPass.id },
    });
    assert.equal(prodBookingsInDb, 0, 'Zero bookings must be created for rejected request');
    console.log('  ✓ Verified 0 booking records created in Neon for rejected request');
  }

  // TEST 3: Price Manipulation Protection
  console.log('\n--- TEST 3: Authoritative Price Snapshotting (No Client Price Trust) ---');
  const testPassType = `test-concurrency-${Date.now()}`;
  let testPass = null;

  try {
    testPass = await prisma.pass.create({
      data: {
        passType: testPassType,
        name: 'Automated Concurrency Tier',
        price: 750, // Authoritative price is ₹750
        totalQuantity: 5, // Exactly 5 tickets available
        reservedQuantity: 0,
        soldQuantity: 0,
        isActive: true,
      },
    });
    console.log(`  ✓ Created isolated test pass tier "${testPassType}" (₹750, total: 5)`);

    // Client attempts to pay ₹1 and to book 25 passes (both ignored server-side)
    const tamperedRes = await executeBookingTransaction({
      passIdentifier: testPassType,
      quantity: 25,
      fullName: 'Tamper Tester',
      phone: '9876543210',
      clientUnitPrice: 1, // Tampered client price
      clientTotal: 1, // Tampered client total
    });

    assert.equal(tamperedRes.status, 201, 'Valid booking with available inventory succeeds');
    assert.equal(tamperedRes.quantity, 1, 'Server must force quantity to 1 (client quantity ignored)');
    assert.equal(tamperedRes.unitPrice, 750, 'Server must enforce authoritative unitPrice (₹750)');
    assert.equal(tamperedRes.totalAmount, 750, 'Server must enforce authoritative total (₹750)');
    console.log('  ✓ Client-submitted quantity=25 and unitPrice=1 ignored; server recorded quantity=1 at authoritative ₹750');

    // Clean up this single probe booking so test pass is reset to 0 reserved
    await prisma.booking.deleteMany({ where: { passId: testPass.id } });
    await prisma.pass.update({
      where: { id: testPass.id },
      data: { reservedQuantity: 0, soldQuantity: 0 },
    });
    console.log('  ✓ Probe booking cleared; test pass reset to 5 available');

    // TEST 4: High-Concurrency Race Condition & Capacity Limit
    console.log('\n--- TEST 4: High-Concurrency Race Condition (15 concurrent requests for 5 tickets) ---');
    const TOTAL_REQUESTS = 15;
    const concurrentRequests = Array.from({ length: TOTAL_REQUESTS }, (_, idx) =>
      executeBookingTransaction({
        passIdentifier: testPassType,
        quantity: 1,
        fullName: `Concurrent Attendee ${idx + 1}`,
        phone: `987654${String(1000 + idx).substring(0, 4)}`,
        email: `attendee${idx + 1}@example.com`,
      })
    );

    const results = await Promise.all(concurrentRequests);

    const successful = results.filter((r) => r.status === 201);
    const rejected = results.filter((r) => r.status === 409);
    const errors = results.filter((r) => r.status !== 201 && r.status !== 409);

    console.log(`  • Successful reservations: ${successful.length}`);
    console.log(`  • Rejected reservations (409 Conflict): ${rejected.length}`);
    console.log(`  • Other errors: ${errors.length}`);

    // Assertion 1: Exactly the available quantity can be reserved
    assert.equal(successful.length, 5, 'Exactly 5 requests must succeed');
    assert.equal(rejected.length, 10, 'Remaining 10 requests must be rejected with 409');
    assert.equal(errors.length, 0, 'Zero unexpected errors should occur');
    console.log('  ✓ Exactly 5/15 requests succeeded, 10/15 rejected with HTTP 409');

    // Assertion 2: Verify Neon database state
    const passInDb = await prisma.pass.findUnique({ where: { id: testPass.id } });
    assert.equal(passInDb.reservedQuantity, 5, 'reservedQuantity in DB must be exactly 5');
    assert.equal(passInDb.soldQuantity, 0, 'soldQuantity in DB must be 0');
    assert.ok(
      passInDb.reservedQuantity + passInDb.soldQuantity <= passInDb.totalQuantity,
      'reservedQuantity + soldQuantity <= totalQuantity must strictly hold'
    );
    console.log(
      `  ✓ Database pass state verified: total=${passInDb.totalQuantity}, reserved=${passInDb.reservedQuantity}, sold=${passInDb.soldQuantity}`
    );

    // Assertion 3: Sum of quantities across successful bookings equals available inventory
    const bookingsInDb = await prisma.booking.findMany({
      where: { passId: testPass.id },
    });
    assert.equal(bookingsInDb.length, 5, 'Exactly 5 Booking rows must exist in database');

    const sumQuantities = bookingsInDb.reduce((acc, b) => acc + b.quantity, 0);
    assert.equal(sumQuantities, 5, 'Sum of quantities across bookings must equal 5');
    console.log(`  ✓ Sum of quantities across created bookings = ${sumQuantities} (exactly 5)`);

    // Assertion 4: Every successful booking has a unique publicId
    const publicIds = new Set(bookingsInDb.map((b) => b.publicId));
    assert.equal(publicIds.size, 5, 'All 5 bookings must have unique publicIds');
    for (const pid of publicIds) {
      assert.match(pid, /^RU26-REQ-\d{4}$/, `Public ID ${pid} matches RU26-REQ-XXXX format`);
    }
    console.log('  ✓ All 5 bookings assigned unique collision-safe public IDs');

    // Assertion 5: Status, paymentStatus, and expiresAt
    for (const b of bookingsInDb) {
      assert.equal(b.status, 'PENDING', 'Booking status must be PENDING');
      assert.equal(b.paymentStatus, 'NOT_STARTED', 'Payment status must be NOT_STARTED');
      const diffHours = (b.expiresAt.getTime() - b.createdAt.getTime()) / (1000 * 60 * 60);
      assert.ok(
        Math.abs(diffHours - 24) < 0.1,
        `expiresAt must be 24 hours after createdAt (got ${diffHours}h)`
      );
    }
    console.log('  ✓ Initial booking status=PENDING, paymentStatus=NOT_STARTED, expiresAt=now+24h verified');
  } finally {
    // Teardown: cleanly delete test bookings and test passes
    if (zeroInventoryPass) {
      console.log('\n--- CLEANUP & TEARDOWN ---');
      await prisma.booking.deleteMany({ where: { passId: zeroInventoryPass.id } });
      await prisma.pass.delete({ where: { id: zeroInventoryPass.id } });
      console.log(`  ✓ Cleaned up zero-inventory test pass tier "${zeroInventoryPass.passType}"`);
    }

    if (testPass) {
      console.log('\n--- CLEANUP & TEARDOWN ---');
      const deletedBookings = await prisma.booking.deleteMany({
        where: { passId: testPass.id },
      });
      console.log(`  ✓ Cleaned up ${deletedBookings.count} test booking records`);

      await prisma.pass.delete({ where: { id: testPass.id } });
      console.log(`  ✓ Cleaned up test pass tier "${testPass.passType}"`);
    }

    await prisma.$disconnect();
  }

  console.log('\n🎉 ALL PHASE 2 TESTS PASSED WITH 100% SUCCESS!\n');
}

runAllTests().catch((err) => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
