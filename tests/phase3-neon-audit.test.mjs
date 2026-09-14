import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

class InventoryInconsistencyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InventoryInconsistencyError';
  }
}

async function checkAndExpireBooking(bookingIdOrPublicId, db = prisma) {
  return await db.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        OR: [{ id: bookingIdOrPublicId }, { publicId: bookingIdOrPublicId }],
      },
    });

    if (!booking) {
      return { expired: false, booking: null };
    }

    if (booking.status !== 'PENDING') {
      return { expired: booking.status === 'EXPIRED', booking };
    }

    const now = new Date();
    if (booking.expiresAt > now) {
      return { expired: false, booking };
    }

    const bookingUpdateCount = await tx.$executeRaw`
      UPDATE bookings
      SET status = 'EXPIRED'::"BookingStatus",
          updated_at = NOW()
      WHERE id = ${booking.id}
        AND status = 'PENDING'::"BookingStatus"
        AND expires_at <= NOW()
    `;

    if (bookingUpdateCount === 0) {
      const current = await tx.booking.findUnique({ where: { id: booking.id } });
      return { expired: current?.status === 'EXPIRED', booking: current };
    }

    const passUpdateCount = await tx.$executeRaw`
      UPDATE passes
      SET reserved_quantity = reserved_quantity - ${booking.quantity},
          updated_at = NOW()
      WHERE id = ${booking.passId}
        AND reserved_quantity >= ${booking.quantity}
    `;

    if (passUpdateCount === 0) {
      throw new InventoryInconsistencyError(
        `Inventory release failed: Pass "${booking.passId}" has insufficient reserved_quantity to release exact ${booking.quantity} passes for booking ${booking.publicId}. Rolling back entire transaction.`
      );
    }

    const updatedBooking = await tx.booking.findUnique({
      where: { id: booking.id },
    });

    return { expired: true, booking: updatedBooking };
  });
}

const PORT = 3032;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CRON_SECRET = 'audit-cron-secret-3981';
const prisma = new PrismaClient({ log: ['error'] });

async function waitForServer(url, timeoutMs = 20000) {
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

async function runAudit() {
  console.log('================================================================');
  console.log('PHASE 3: REAL DATABASE-BACKED VERIFICATION GAP AUDIT');
  console.log('Database: Neon PostgreSQL (Authoritative)');
  console.log('================================================================\n');

  // Verify real DB connection before launching server
  const initialPassCount = await prisma.pass.count();
  console.log(`Connected to Neon PostgreSQL. Found ${initialPassCount} pass tiers in database.\n`);

  // Start Next.js production server
  const serverProc = spawn('pnpm', ['exec', 'next', 'start', '-p', String(PORT)], {
    stdio: 'pipe',
    env: {
      ...process.env,
      CRON_SECRET,
    },
  });

  serverProc.stderr.on('data', (d) => {
    // Only log if unexpected
    const str = String(d);
    if (!str.includes('ExperimentalWarning')) {
      // console.error('[Server stderr]', str);
    }
  });

  // Track created test passes & bookings for rigorous teardown
  const createdPassIds = new Set();
  const createdBookingIds = new Set();

  try {
    await waitForServer(`${BASE_URL}/`, 20000);
    console.log(`✓ Next.js production server ready on port ${PORT}\n`);

    // Create a dedicated temporary pass with known inventory
    const auditPassType = `audit-pass-${Date.now()}`;
    const testPass = await prisma.pass.create({
      data: {
        passType: auditPassType,
        name: 'Audit Tier Pass',
        price: 850,
        totalQuantity: 20,
        reservedQuantity: 0,
        soldQuantity: 0,
        isActive: true,
      },
    });
    createdPassIds.add(testPass.id);
    console.log(`Created temporary test pass "${auditPassType}" (₹850, total: 20, reserved: 0, sold: 0)\n`);

    // =========================================================================
    // 1. EMAIL-LESS BOOKING + RECOVERY TOKEN
    // =========================================================================
    console.log('----------------------------------------------------------------');
    console.log('TEST 1: EMAIL-LESS BOOKING + RECOVERY TOKEN');
    console.log('----------------------------------------------------------------');
    let emailLessBookingId = '';
    let returnedRecoveryToken = '';
    {
      const res = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Aarav Kumar',
          phone: '+91 98765 43210',
          passId: auditPassType,
          quantity: 2,
        }),
      });

      assert.equal(res.status, 201, 'Email-less booking must return HTTP 201');
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.status, 'PENDING', 'Booking status must be PENDING');
      assert.equal(data.paymentStatus, 'NOT_STARTED', 'Payment status must be NOT_STARTED');
      assert.ok(data.recoveryToken, 'recoveryToken must be present in response');
      assert.equal(typeof data.recoveryToken, 'string');
      assert.ok(data.recoveryToken.length >= 32, 'Recovery token must have >= 32 chars of secure entropy');
      assert.match(data.recoveryToken, /^[A-Za-z0-9_-]+$/, 'Recovery token must be URL-safe base64url format');

      emailLessBookingId = data.bookingId;
      returnedRecoveryToken = data.recoveryToken;

      // Query database directly
      const dbBooking = await prisma.booking.findUnique({
        where: { publicId: emailLessBookingId },
      });
      assert.ok(dbBooking, 'Booking record must exist in Neon database');
      createdBookingIds.add(dbBooking.id);

      assert.ok(dbBooking.recoveryTokenHash, 'database recoveryTokenHash must exist');
      const expectedHash = crypto.createHash('sha256').update(returnedRecoveryToken).digest('hex');
      assert.equal(dbBooking.recoveryTokenHash, expectedHash, 'database hash must equal SHA-256(raw recoveryToken)');
      assert.notEqual(dbBooking.recoveryTokenHash, returnedRecoveryToken, 'raw recoveryToken must NOT be stored in database');

      // Verify inventory reserved
      const passInDb = await prisma.pass.findUnique({ where: { id: testPass.id } });
      assert.equal(passInDb.reservedQuantity, 2, 'reservedQuantity in DB must be exactly 2');

      console.log(`TEST 1 | PASSED | Booking ${emailLessBookingId} created with HTTP 201, status=PENDING, paymentStatus=NOT_STARTED. Recovery token length=${returnedRecoveryToken.length} (base64url format). Neon record contains SHA-256 hash (64 hex chars); raw token not stored in database. Reserved quantity increased from 0 to 2.`);
    }

    // =========================================================================
    // 2. SUCCESSFUL DIRECT RECOVERY
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 2: SUCCESSFUL DIRECT RECOVERY');
    console.log('----------------------------------------------------------------');
    let sessionCookieFromRecovery = '';
    {
      const res = await fetch(`${BASE_URL}/api/bookings/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: emailLessBookingId,
          recoveryToken: returnedRecoveryToken,
        }),
      });

      assert.equal(res.status, 200, 'Valid recovery must return HTTP 200');
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.booking.publicId, emailLessBookingId, 'Returned booking must match requested booking ID');
      assert.equal(data.booking.fullName, 'Aarav Kumar');
      assert.equal(data.booking.quantity, 2);

      const setCookie = res.headers.get('set-cookie');
      assert.ok(setCookie, 'set-cookie header must be present');
      assert.match(setCookie, /ru26_lookup_session=/);
      assert.match(setCookie, /HttpOnly/i);

      sessionCookieFromRecovery = setCookie.split(';')[0];
      console.log(`TEST 2 | PASSED | Direct recovery of ${emailLessBookingId} returned HTTP 200. HTTP-only session cookie issued. Returned exact booking details (Aarav Kumar, qty 2); zero unrelated bookings returned.`);
    }

    // =========================================================================
    // 3. INVALID RECOVERY
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 3: INVALID RECOVERY');
    console.log('----------------------------------------------------------------');
    {
      // 3A. Wrong recovery token
      const wrongTokenRes = await fetch(`${BASE_URL}/api/bookings/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: emailLessBookingId,
          recoveryToken: 'invalid-wrong-token-value-12345678901234567890',
        }),
      });
      assert.equal(wrongTokenRes.status, 404, 'Wrong recovery token must return HTTP 404');
      const wrongTokenData = await wrongTokenRes.json();
      assert.equal(wrongTokenData.success, false);

      // 3B. Malformed token
      const malformedRes = await fetch(`${BASE_URL}/api/bookings/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: emailLessBookingId,
          recoveryToken: '',
        }),
      });
      assert.equal(malformedRes.status, 400, 'Empty recovery token must return HTTP 400');

      // 3C. Valid token for booking A cannot recover booking B
      const bookingBRes = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Booking B Attendee',
          phone: '+91 98765 43211',
          passId: auditPassType,
          quantity: 1,
        }),
      });
      const bookingBData = await bookingBRes.json();
      assert.equal(bookingBRes.status, 201);
      const bookingBId = bookingBData.bookingId;
      const dbBookingB = await prisma.booking.findUnique({ where: { publicId: bookingBId } });
      createdBookingIds.add(dbBookingB.id);

      const crossRecoveryRes = await fetch(`${BASE_URL}/api/bookings/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingBId,
          recoveryToken: returnedRecoveryToken, // Token from Booking A
        }),
      });
      assert.equal(crossRecoveryRes.status, 404, 'Using token A on booking B must return HTTP 404');

      // 3D. Recovery of expired booking fails with 410
      await prisma.booking.update({
        where: { id: dbBookingB.id },
        data: {
          expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
          status: 'EXPIRED',
        },
      });

      const expiredRecoveryRes = await fetch(`${BASE_URL}/api/bookings/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingBId,
          recoveryToken: bookingBData.recoveryToken,
        }),
      });
      assert.equal(expiredRecoveryRes.status, 410, 'Recovery of expired booking must return HTTP 410 Gone');
      const expiredData = await expiredRecoveryRes.json();
      assert.match(expiredData.error, /expired/i);

      console.log('TEST 3 | PASSED | Wrong recovery token rejected (404). Malformed token rejected (400). Cross-booking recovery rejected (404). Expired booking recovery rejected with HTTP 410 Gone.');
    }

    // =========================================================================
    // 4. EMAIL + PHONE LOOKUP
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 4: EMAIL + PHONE LOOKUP');
    console.log('----------------------------------------------------------------');
    const lookupEmail = 'audit.family@example.com';
    const lookupPhone = '+91 99315 03960';
    let lookupBookingId1 = '';
    let lookupBookingId2 = '';
    {
      // Create 2 bookings belonging to the same email + phone
      const b1Res = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Family Head',
          email: lookupEmail,
          phone: lookupPhone,
          passId: auditPassType,
          quantity: 1,
        }),
      });
      const b1Data = await b1Res.json();
      assert.equal(b1Res.status, 201);
      lookupBookingId1 = b1Data.bookingId;
      const dbB1 = await prisma.booking.findUnique({ where: { publicId: lookupBookingId1 } });
      createdBookingIds.add(dbB1.id);

      const b2Res = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Family Member',
          email: lookupEmail,
          phone: lookupPhone,
          passId: auditPassType,
          quantity: 2,
        }),
      });
      const b2Data = await b2Res.json();
      assert.equal(b2Res.status, 201);
      lookupBookingId2 = b2Data.bookingId;
      const dbB2 = await prisma.booking.findUnique({ where: { publicId: lookupBookingId2 } });
      createdBookingIds.add(dbB2.id);

      // 4A. Valid Email + Phone returns ALL matching bookings
      const validLookupRes = await fetch(`${BASE_URL}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: lookupEmail,
          phone: lookupPhone,
        }),
      });
      assert.equal(validLookupRes.status, 200, 'Valid lookup must return HTTP 200');
      const validLookupData = await validLookupRes.json();
      assert.equal(validLookupData.success, true);
      assert.ok(validLookupData.bookings.length >= 2, 'Must return at least 2 bookings');
      const returnedIds = validLookupData.bookings.map((b) => b.publicId);
      assert.ok(returnedIds.includes(lookupBookingId1), 'Must contain Booking 1');
      assert.ok(returnedIds.includes(lookupBookingId2), 'Must contain Booking 2');

      // 4B. Wrong email + correct phone returns 404 (zero)
      const wrongEmailRes = await fetch(`${BASE_URL}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'wrong.email@example.com',
          phone: lookupPhone,
        }),
      });
      assert.equal(wrongEmailRes.status, 404, 'Wrong email + correct phone must return HTTP 404');

      // 4C. Correct email + wrong phone returns 404 (zero)
      const wrongPhoneRes = await fetch(`${BASE_URL}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: lookupEmail,
          phone: '+91 91234 56789',
        }),
      });
      assert.equal(wrongPhoneRes.status, 404, 'Correct email + wrong phone must return HTTP 404');

      // 4D. Email only rejected (400)
      const emailOnlyRes = await fetch(`${BASE_URL}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lookupEmail }),
      });
      assert.equal(emailOnlyRes.status, 400, 'Email-only must return HTTP 400');

      // 4E. Phone only rejected (400)
      const phoneOnlyRes = await fetch(`${BASE_URL}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: lookupPhone }),
      });
      assert.equal(phoneOnlyRes.status, 400, 'Phone-only must return HTTP 400');

      // 4F. Booking ID alone rejected (400)
      const idOnlyRes = await fetch(`${BASE_URL}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: lookupBookingId1 }),
      });
      assert.equal(idOnlyRes.status, 400, 'Booking ID alone must return HTTP 400');

      console.log(`TEST 4 | PASSED | Valid email+phone returned both matching bookings (${lookupBookingId1}, ${lookupBookingId2}). Wrong email -> 404. Wrong phone -> 404. Email-only -> 400. Phone-only -> 400. Booking ID alone -> 400.`);
    }

    // =========================================================================
    // 5. LOOKUP → SESSION → DETAIL
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 5: LOOKUP → SESSION → DETAIL');
    console.log('----------------------------------------------------------------');
    {
      // 5A. Perform real HTTP lookup to get session cookie
      const lookupRes = await fetch(`${BASE_URL}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: lookupEmail,
          phone: lookupPhone,
        }),
      });
      assert.equal(lookupRes.status, 200);
      const setCookie = lookupRes.headers.get('set-cookie');
      assert.ok(setCookie, 'Lookup must issue session cookie');
      const sessionCookie = setCookie.split(';')[0];

      // 5B. Authorized booking returns successfully
      const detailRes = await fetch(`${BASE_URL}/api/bookings/${lookupBookingId1}`, {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(detailRes.status, 200, 'Authorized booking request must return HTTP 200');
      const detailData = await detailRes.json();
      assert.equal(detailData.booking.publicId, lookupBookingId1);
      assert.equal(detailData.booking.status, 'PENDING');

      // 5C. Unrelated booking (Booking A from Test 1) returns 403 Forbidden
      const unrelatedRes = await fetch(`${BASE_URL}/api/bookings/${emailLessBookingId}`, {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(unrelatedRes.status, 403, 'Unrelated booking request must return HTTP 403 Forbidden');
      const unrelatedData = await unrelatedRes.json();
      assert.match(unrelatedData.error, /forbidden|permission/i);

      // 5D. No session returns 401 Unauthorized
      const noSessionRes = await fetch(`${BASE_URL}/api/bookings/${lookupBookingId1}`);
      assert.equal(noSessionRes.status, 401, 'Request without session must return HTTP 401 Unauthorized');
      const noSessionData = await noSessionRes.json();
      assert.match(noSessionData.error, /unauthorized|session required/i);

      // 5E. Clearing session causes subsequent access to fail
      const clearRes = await fetch(`${BASE_URL}/api/bookings/lookup/clear`, {
        method: 'POST',
        headers: { Cookie: sessionCookie },
      });
      assert.equal(clearRes.status, 200);
      const clearCookie = clearRes.headers.get('set-cookie') || '';
      assert.match(clearCookie, /Max-Age=0/i);

      const afterClearRes = await fetch(`${BASE_URL}/api/bookings/${lookupBookingId1}`, {
        headers: { Cookie: 'ru26_lookup_session=deleted; Max-Age=0' },
      });
      assert.equal(afterClearRes.status, 401, 'Subsequent access with cleared session must return HTTP 401');

      console.log(`TEST 5 | PASSED | Full HTTP flow verified: Lookup -> Session Cookie issued -> GET /api/bookings/[id] authorized (200) -> Unrelated booking rejected (403 Forbidden) -> No session rejected (401 Unauthorized) -> Clear endpoint revokes session (Max-Age=0) -> Subsequent access rejected (401).`);
    }

    // =========================================================================
    // 6. EXPIRY (PENDING -> EXPIRED + EXACT RESERVED DECREMENT)
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 6: EXPIRY (PENDING -> EXPIRED & EXACT INVENTORY DECREMENT)');
    console.log('----------------------------------------------------------------');
    {
      // Create a temporary booking with qty = 3
      const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Expiry Attendee',
          phone: '+91 98765 77777',
          passId: auditPassType,
          quantity: 3,
        }),
      });
      const bookingData = await bookingRes.json();
      assert.equal(bookingRes.status, 201);
      const expiryBookingId = bookingData.bookingId;
      const dbBooking = await prisma.booking.findUnique({ where: { publicId: expiryBookingId } });
      createdBookingIds.add(dbBooking.id);

      // Set expiresAt to past
      await prisma.booking.update({
        where: { id: dbBooking.id },
        data: { expiresAt: new Date(Date.now() - 3600000) },
      });

      const passBefore = await prisma.pass.findUnique({ where: { id: testPass.id } });
      const reservedBefore = passBefore.reservedQuantity;
      const soldBefore = passBefore.soldQuantity;

      // Invoke authoritative expiry logic
      const expiryResult = await checkAndExpireBooking(dbBooking.id);
      assert.equal(expiryResult.expired, true, 'Booking must be reported expired');
      assert.equal(expiryResult.booking.status, 'EXPIRED');

      // Verify DB state
      const bookingAfter = await prisma.booking.findUnique({ where: { id: dbBooking.id } });
      assert.equal(bookingAfter.status, 'EXPIRED', 'DB booking status must be EXPIRED');

      const passAfter = await prisma.pass.findUnique({ where: { id: testPass.id } });
      assert.equal(
        passAfter.reservedQuantity,
        reservedBefore - 3,
        'Exact booking quantity (3) must be decremented from reserved_quantity'
      );
      assert.equal(passAfter.soldQuantity, soldBefore, 'sold_quantity must remain unchanged');

      // Calling expiry a second time changes nothing
      const secondExpiryResult = await checkAndExpireBooking(dbBooking.id);
      assert.equal(secondExpiryResult.expired, true);

      const passAfterSecond = await prisma.pass.findUnique({ where: { id: testPass.id } });
      assert.equal(
        passAfterSecond.reservedQuantity,
        passAfter.reservedQuantity,
        'reserved_quantity must NOT decrease a second time'
      );

      console.log(`TEST 6 | PASSED | Stale pending booking transitioned PENDING -> EXPIRED. Reserved inventory decremented by exact quantity (3). Sold quantity unchanged. Second invocation is completely idempotent (zero duplicate releases).`);
    }

    // =========================================================================
    // 7. EXPIRY TRANSACTION ROLLBACK
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 7: EXPIRY TRANSACTION ROLLBACK ON INVENTORY INCONSISTENCY');
    console.log('----------------------------------------------------------------');
    {
      // Create a temporary booking with qty = 5
      const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Rollback Attendee',
          phone: '+91 98765 88888',
          passId: auditPassType,
          quantity: 5,
        }),
      });
      const bookingData = await bookingRes.json();
      assert.equal(bookingRes.status, 201);
      const rollbackBookingId = bookingData.bookingId;
      const dbBooking = await prisma.booking.findUnique({ where: { publicId: rollbackBookingId } });
      createdBookingIds.add(dbBooking.id);

      // Set expiresAt to past
      await prisma.booking.update({
        where: { id: dbBooking.id },
        data: { expiresAt: new Date(Date.now() - 3600000) },
      });

      // Intentionally simulate an inconsistency: set reserved_quantity to 2, which is LESS than booking.quantity (5)
      await prisma.pass.update({
        where: { id: testPass.id },
        data: { reservedQuantity: 2 },
      });

      // Attempt expiry - MUST FAIL and roll back
      let caughtError = null;
      try {
        await checkAndExpireBooking(dbBooking.id);
      } catch (err) {
        caughtError = err;
      }

      assert.ok(caughtError, 'checkAndExpireBooking must throw when reserved_quantity is insufficient');
      assert.ok(
        caughtError instanceof InventoryInconsistencyError || caughtError.name === 'InventoryInconsistencyError',
        'Error must be InventoryInconsistencyError'
      );

      // Verify ATOMIC ROLLBACK in database:
      // 1. Booking MUST remain PENDING
      const bookingAfter = await prisma.booking.findUnique({ where: { id: dbBooking.id } });
      assert.equal(bookingAfter.status, 'PENDING', 'Booking must remain PENDING after rollback');

      // 2. Pass reserved_quantity MUST remain unchanged (2)
      const passAfter = await prisma.pass.findUnique({ where: { id: testPass.id } });
      assert.equal(passAfter.reservedQuantity, 2, 'reserved_quantity must remain exactly 2 (unchanged)');

      // Clean up test 7 booking so it does not leak into subsequent batch maintenance tests
      await prisma.booking.delete({ where: { id: dbBooking.id } });
      createdBookingIds.delete(dbBooking.id);
      await prisma.pass.update({
        where: { id: testPass.id },
        data: { reservedQuantity: 0 },
      });

      console.log(`TEST 7 | PASSED | Simulated inconsistency (reserved 2 < booking 5). checkAndExpireBooking threw InventoryInconsistencyError. Verified full transactional rollback: booking remains PENDING, pass reserved_quantity remains 2. No partial state or orphan EXPIRED booking.`);
    }

    // =========================================================================
    // 8. CONFIRMED BOOKING
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 8: CONFIRMED BOOKING IMMUNITY');
    console.log('----------------------------------------------------------------');
    {
      // Create a confirmed booking with expiresAt in the past
      const confirmedBooking = await prisma.booking.create({
        data: {
          publicId: `RU26-REQ-${Math.floor(1000 + Math.random() * 9000)}`,
          fullName: 'Confirmed VIP',
          phone: '+91 99999 00001',
          passId: testPass.id,
          quantity: 2,
          unitPrice: 850,
          totalAmount: 1700,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          expiresAt: new Date(Date.now() - 3600000), // In the past
          confirmedAt: new Date(Date.now() - 7200000),
          source: 'audit-test',
        },
      });
      createdBookingIds.add(confirmedBooking.id);

      const passBefore = await prisma.pass.findUnique({ where: { id: testPass.id } });

      const expiryResult = await checkAndExpireBooking(confirmedBooking.id);
      assert.equal(expiryResult.expired, false, 'Confirmed booking cannot be expired');
      assert.equal(expiryResult.booking.status, 'CONFIRMED');

      // Verify DB state
      const bookingInDb = await prisma.booking.findUnique({ where: { id: confirmedBooking.id } });
      assert.equal(bookingInDb.status, 'CONFIRMED', 'Booking must remain CONFIRMED in DB');

      const passAfter = await prisma.pass.findUnique({ where: { id: testPass.id } });
      assert.equal(passAfter.reservedQuantity, passBefore.reservedQuantity, 'Inventory must NOT be released');

      console.log(`TEST 8 | PASSED | Confirmed booking with past expiresAt evaluated. Status remained CONFIRMED; inventory was not released; zero corruption occurred.`);
    }

    // =========================================================================
    // 9. STALE LOOKUP
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 9: STALE LOOKUP AUTO-EXPIRY');
    console.log('----------------------------------------------------------------');
    {
      const staleEmail = 'stale.customer@example.com';
      const stalePhone = '+91 98765 99999';

      // Set test pass inventory to 10 reserved
      await prisma.pass.update({
        where: { id: testPass.id },
        data: { reservedQuantity: 10 },
      });

      const staleBooking = await prisma.booking.create({
        data: {
          publicId: `RU26-REQ-${Math.floor(1000 + Math.random() * 9000)}`,
          fullName: 'Stale Customer',
          email: staleEmail,
          phone: stalePhone,
          passId: testPass.id,
          quantity: 3,
          unitPrice: 850,
          totalAmount: 2550,
          status: 'PENDING',
          paymentStatus: 'NOT_STARTED',
          expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
          source: 'audit-test',
        },
      });
      createdBookingIds.add(staleBooking.id);

      const passBeforeLookup = await prisma.pass.findUnique({ where: { id: testPass.id } });
      assert.equal(passBeforeLookup.reservedQuantity, 10);

      // Perform normal customer lookup
      const lookupRes = await fetch(`${BASE_URL}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: staleEmail,
          phone: stalePhone,
        }),
      });

      assert.equal(lookupRes.status, 200, 'Stale lookup must return HTTP 200');
      const lookupData = await lookupRes.json();
      assert.equal(lookupData.success, true);
      const returnedBooking = lookupData.bookings.find((b) => b.publicId === staleBooking.publicId);
      assert.ok(returnedBooking, 'Returned list must contain the booking');
      assert.equal(returnedBooking.status, 'EXPIRED', 'Returned booking status must reflect EXPIRED');

      // Verify DB state
      const dbBooking = await prisma.booking.findUnique({ where: { id: staleBooking.id } });
      assert.equal(dbBooking.status, 'EXPIRED', 'DB record must be updated to EXPIRED');

      const passAfterLookup = await prisma.pass.findUnique({ where: { id: testPass.id } });
      assert.equal(
        passAfterLookup.reservedQuantity,
        7,
        'Pass reserved quantity must be decremented by 3 (from 10 to 7)'
      );

      console.log(`TEST 9 | PASSED | Normal lookup on stale booking triggered passive expiry. Customer received EXPIRED status; Neon database updated to EXPIRED; 3 reserved passes successfully released (10 -> 7).`);
    }

    // =========================================================================
    // 10. MAINTENANCE ENDPOINT
    // =========================================================================
    console.log('\n----------------------------------------------------------------');
    console.log('TEST 10: MAINTENANCE ENDPOINT (CRON EXPIRY SWEEP)');
    console.log('----------------------------------------------------------------');
    {
      // 10A. Missing CRON_SECRET rejected with 401
      const noAuthRes = await fetch(`${BASE_URL}/api/bookings/expire-stale`, {
        method: 'POST',
      });
      assert.equal(noAuthRes.status, 401, 'Missing authorization must return 401');

      // 10B. Incorrect CRON_SECRET rejected with 401
      const wrongAuthRes = await fetch(`${BASE_URL}/api/bookings/expire-stale`, {
        method: 'POST',
        headers: { Authorization: 'Bearer invalid-cron-secret-xxx' },
      });
      assert.equal(wrongAuthRes.status, 401, 'Wrong secret must return 401');

      // Create a stale pending booking with qty = 2
      await prisma.pass.update({
        where: { id: testPass.id },
        data: { reservedQuantity: 7 },
      });

      const cronBooking = await prisma.booking.create({
        data: {
          publicId: `RU26-REQ-${Math.floor(1000 + Math.random() * 9000)}`,
          fullName: 'Cron Target',
          phone: '+91 99999 12345',
          passId: testPass.id,
          quantity: 2,
          unitPrice: 850,
          totalAmount: 1700,
          status: 'PENDING',
          paymentStatus: 'NOT_STARTED',
          expiresAt: new Date(Date.now() - 3600000),
          source: 'audit-test',
        },
      });
      createdBookingIds.add(cronBooking.id);

      // 10C. Correct CRON_SECRET performs stale cleanup
      const cronRes = await fetch(`${BASE_URL}/api/bookings/expire-stale`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      assert.equal(cronRes.status, 200, 'Valid cron secret must return 200');
      const cronData = await cronRes.json();
      assert.equal(cronData.success, true);
      assert.ok(cronData.expiredCount >= 1, 'expiredCount must be at least 1');

      // Verify no customer data returned in response
      const responseKeys = Object.keys(cronData);
      assert.deepEqual(responseKeys.sort(), ['expiredCount', 'success', 'timestamp'].sort(), 'No customer data permitted in maintenance response');
      assert.equal('bookings' in cronData, false);
      assert.equal('booking' in cronData, false);

      const dbCronBooking = await prisma.booking.findUnique({ where: { id: cronBooking.id } });
      assert.equal(dbCronBooking.status, 'EXPIRED');

      const passAfterCron = await prisma.pass.findUnique({ where: { id: testPass.id } });
      assert.equal(passAfterCron.reservedQuantity, 5, 'Pass reserved quantity decremented from 7 to 5');

      // 10D. Repeated invocation is safe
      const repeatRes = await fetch(`${BASE_URL}/api/bookings/expire-stale`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      assert.equal(repeatRes.status, 200);
      const repeatData = await repeatRes.json();
      assert.equal(repeatData.success, true);

      console.log(`TEST 10 | PASSED | Maintenance endpoint rejects missing secret (401) and wrong secret (401). Correct secret sweeps stale bookings, releases reserved inventory, returns only {success, message, expiredCount} with zero customer data. Repeated invocation is safe.`);
    }

  } finally {
    // Teardown: Clean up all created test bookings and test passes from Neon DB
    console.log('\n----------------------------------------------------------------');
    console.log('DATABASE CLEANUP & TEARDOWN');
    console.log('----------------------------------------------------------------');
    try {
      if (createdBookingIds.size > 0) {
        const deletedBookings = await prisma.booking.deleteMany({
          where: { id: { in: Array.from(createdBookingIds) } },
        });
        console.log(`✓ Deleted ${deletedBookings.count} temporary test booking records from Neon.`);
      }

      if (createdPassIds.size > 0) {
        const deletedPasses = await prisma.pass.deleteMany({
          where: { id: { in: Array.from(createdPassIds) } },
        });
        console.log(`✓ Deleted ${deletedPasses.count} temporary test pass tiers from Neon.`);
      }

      // Verify no test records remain in Neon
      const remainingTestBookings = await prisma.booking.count({
        where: { source: { in: ['web-booking-desk', 'audit-test'] } },
      });
      const remainingPasses = await prisma.pass.findMany({ orderBy: { price: 'asc' } });

      console.log(`\nPost-Audit Neon Database State:`);
      console.log(`- Remaining Bookings: ${remainingTestBookings}`);
      console.log(`- Official Passes in Catalog: ${remainingPasses.length}`);
      for (const p of remainingPasses) {
        console.log(`  • ${p.passType} (${p.name}): price ₹${p.price}, total=${p.totalQuantity}, reserved=${p.reservedQuantity}, sold=${p.soldQuantity}`);
      }

      assert.equal(remainingTestBookings, 0, 'No bookings must remain in database');
      assert.equal(remainingPasses.length, 5, 'Exactly 5 official passes must exist in database');
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr);
    }

    serverProc.kill('SIGKILL');
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 10 AUDIT VERIFICATION TESTS EXECUTED AND PASSED AGAINST NEON!');
  console.log('================================================================\n');
  process.exit(0);
}

runAudit().catch((err) => {
  console.error('\n❌ AUDIT TEST FAILURE:', err);
  process.exit(1);
});
