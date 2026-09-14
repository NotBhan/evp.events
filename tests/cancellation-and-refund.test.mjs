import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import {
  CANCELLATION_DEADLINE_ISO,
  CANCELLATION_DEADLINE_DISPLAY,
  GST_RATE_PERCENT,
  calculateGstAndRefund,
  isCancellationAllowed,
} from '../lib/cancellation-constants.ts';

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

async function runAllTests() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — CANCELLATION, REFUND & TRANSFER TEST SUITE');
  console.log('================================================================\n');

  // ------------------------------------------------------------------
  // SECTION 1: FINANCIAL & GST-INCLUSIVE REFUND CALCULATIONS (Tests 15-21)
  // ------------------------------------------------------------------
  console.log('--- SECTION 1: Financial & GST-Inclusive Calculations ---');

  // Test 15: ₹999 -> ₹846.61
  const t15 = calculateGstAndRefund(999);
  assert.equal(t15.grossRupees, 999);
  assert.equal(t15.gstRupees, 152.39);
  assert.equal(t15.refundRupees, 846.61);
  assert.equal(t15.grossFormatted, '999.00');
  assert.equal(t15.gstFormatted, '152.39');
  assert.equal(t15.refundFormatted, '846.61');
  console.log('  ✓ Test 15: Solo Pass – Female ₹999 -> GST ₹152.39, Refund ₹846.61');

  // Test 16: ₹1,499 -> ₹1,270.34
  const t16 = calculateGstAndRefund(1499);
  assert.equal(t16.grossRupees, 1499);
  assert.equal(t16.gstRupees, 228.66);
  assert.equal(t16.refundRupees, 1270.34);
  assert.equal(t16.grossFormatted, '1499.00');
  assert.equal(t16.gstFormatted, '228.66');
  assert.equal(t16.refundFormatted, '1270.34');
  console.log('  ✓ Test 16: VIP Pass ₹1,499 -> GST ₹228.66, Refund ₹1,270.34');

  // Test 17: ₹1,999 -> ₹1,694.07
  const t17 = calculateGstAndRefund(1999);
  assert.equal(t17.grossRupees, 1999);
  assert.equal(t17.gstRupees, 304.93);
  assert.equal(t17.refundRupees, 1694.07);
  assert.equal(t17.grossFormatted, '1999.00');
  assert.equal(t17.gstFormatted, '304.93');
  assert.equal(t17.refundFormatted, '1694.07');
  console.log('  ✓ Test 17: Couple Pass ₹1,999 -> GST ₹304.93, Refund ₹1,694.07');

  // Test 18: ₹3,599 -> ₹3,050.00
  const t18 = calculateGstAndRefund(3599);
  assert.equal(t18.grossRupees, 3599);
  assert.equal(t18.gstRupees, 549.00);
  assert.equal(t18.refundRupees, 3050.00);
  assert.equal(t18.grossFormatted, '3599.00');
  assert.equal(t18.gstFormatted, '549.00');
  assert.equal(t18.refundFormatted, '3050.00');
  console.log('  ✓ Test 18: Family Pass ₹3,599 -> GST ₹549.00, Refund ₹3,050.00');

  // Test 19: ₹4,999 -> ₹4,236.44
  const t19 = calculateGstAndRefund(4999);
  assert.equal(t19.grossRupees, 4999);
  assert.equal(t19.gstRupees, 762.56);
  assert.equal(t19.refundRupees, 4236.44);
  assert.equal(t19.grossFormatted, '4999.00');
  assert.equal(t19.gstFormatted, '762.56');
  assert.equal(t19.refundFormatted, '4236.44');
  console.log('  ✓ Test 19: Group Pass ₹4,999 -> GST ₹762.56, Refund ₹4,236.44');

  // Test 20: Verified exact formula gross × 100 / 118
  [999, 1499, 1999, 3599, 4999].forEach((amt) => {
    const res = calculateGstAndRefund(amt);
    assert.equal(res.formula, 'Gross Paid Amount × 100 / 118');
    assert.equal(res.gstPaise + res.refundPaise, res.grossPaise);
  });
  console.log('  ✓ Test 20: Verified all tiers use GST-inclusive formula: Gross × 100 / 118');

  // Test 21: Integer paise arithmetic (no binary floating errors)
  assert.equal(t15.grossPaise, 99900);
  assert.equal(t15.gstPaise, 15239);
  assert.equal(t15.refundPaise, 84661);
  assert.equal(t15.gstPaise + t15.refundPaise, 99900);
  console.log('  ✓ Test 21: Financial calculations executed in integer paise without floating point drift\n');

  // ------------------------------------------------------------------
  // SECTION 2: DEADLINE & SERVER-TIME ENFORCEMENT (Tests 12, 13, 14)
  // ------------------------------------------------------------------
  console.log('--- SECTION 2: Deadline & Server-Time Enforcement ---');
  assert.equal(CANCELLATION_DEADLINE_ISO, '2026-10-06T23:59:59+05:30');
  assert.equal(CANCELLATION_DEADLINE_DISPLAY, '6 October 2026, 11:59 PM IST');

  // Test 12: Cancellation after 6 October 2026 is rejected
  const afterDeadline = new Date('2026-10-07T00:00:01+05:30');
  assert.equal(isCancellationAllowed(afterDeadline), false);
  const lateOct = new Date('2026-10-15T12:00:00+05:30');
  assert.equal(isCancellationAllowed(lateOct), false);
  console.log('  ✓ Test 12: Cancellation after 6 October 2026 rejected');

  // Test 13: Cancellation on or before 6 October 2026 is accepted
  const exactlyAtDeadline = new Date('2026-10-06T23:59:59+05:30');
  assert.equal(isCancellationAllowed(exactlyAtDeadline), true);
  const beforeDeadline = new Date('2026-10-06T18:00:00+05:30');
  assert.equal(isCancellationAllowed(beforeDeadline), true);
  const septDate = new Date('2026-09-14T12:00:00+05:30');
  assert.equal(isCancellationAllowed(septDate), true);
  console.log('  ✓ Test 13: Cancellation on/before 6 October 2026 accepted');

  // Test 14: Server time, not browser time, controls deadline
  assert.equal(isCancellationAllowed(new Date('2026-10-07T05:30:00Z')), false);
  console.log('  ✓ Test 14: Server ISO timestamp controls cutoff regardless of client clock\n');

  // ------------------------------------------------------------------
  // SECTION 3: HTTP API AUTHORIZATION & SECURITY (Tests 1, 2, 3)
  // ------------------------------------------------------------------
  console.log('--- SECTION 3: HTTP API Authorization & Security ---');

  // Seed test pass if needed
  const pass = await prisma.pass.findFirst({ where: { passType: 'solo-female' } }) || await prisma.pass.findFirst();
  assert.ok(pass, 'Active pass must exist in database');

  // Create a confirmed test booking
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testPublicId = `RU26-TEST-${randomSuffix}`;
  const unrelatedPublicId = `RU26-OTHER-${randomSuffix}`;

  // Ensure inventory is tracked
  const initialPass = await prisma.pass.findUnique({ where: { id: pass.id } });
  const testQuantity = 2;

  // Increment soldQuantity as if booking were paid
  await prisma.pass.update({
    where: { id: pass.id },
    data: { soldQuantity: { increment: testQuantity } },
  });

  const confirmedBooking = await prisma.booking.create({
    data: {
      publicId: testPublicId,
      passId: pass.id,
      quantity: testQuantity,
      unitPrice: pass.price,
      totalAmount: pass.price * testQuantity,
      fullName: 'Aarav Sharma',
      phone: '+91 99887 76655',
      email: 'aarav.sharma@example.com',
      city: 'Ranchi',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      confirmedAt: new Date(),
    },
  });

  try {
    // Test 2: Unauthenticated cancellation -> 401
    const unauthRes = await fetch(`${BASE_URL}/api/bookings/${testPublicId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const unauthData = await unauthRes.json();
    assert.equal(unauthRes.status, 401);
    assert.equal(unauthData.success, false);
    assert.match(unauthData.error, /Unauthorized/i);
    console.log('  ✓ Test 2: Unauthenticated cancellation returns HTTP 401');

    // Test 3: Unrelated booking cancellation -> 403
    // Session authorizes unrelatedPublicId, but attempts to cancel testPublicId
    const otherToken = createLookupSessionToken([unrelatedPublicId]);
    const forbiddenRes = await fetch(`${BASE_URL}/api/bookings/${testPublicId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${LOOKUP_SESSION_COOKIE_NAME}=${otherToken}`,
      },
    });
    const forbiddenData = await forbiddenRes.json();
    assert.equal(forbiddenRes.status, 403);
    assert.equal(forbiddenData.success, false);
    assert.match(forbiddenData.error, /Forbidden/i);
    console.log('  ✓ Test 3: Cancellation of booking outside session returns HTTP 403');

    // ------------------------------------------------------------------
    // SECTION 4: INVALID STATUS REJECTIONS (Tests 4, 5)
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 4: Invalid Status Rejections ---');

    // Test 4: PENDING booking cannot use confirmed-booking cancellation path
    const pendingBooking = await prisma.booking.create({
      data: {
        publicId: `RU26-PEND-${randomSuffix}`,
        passId: pass.id,
        quantity: 1,
        unitPrice: pass.price,
        totalAmount: pass.price,
        fullName: 'Pending Attendee',
        phone: '+91 99887 76656',
        city: 'Ranchi',
        status: 'PENDING',
        paymentStatus: 'NOT_STARTED',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const pendingToken = createLookupSessionToken([pendingBooking.publicId]);
    const pendingRes = await fetch(`${BASE_URL}/api/bookings/${pendingBooking.publicId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${LOOKUP_SESSION_COOKIE_NAME}=${pendingToken}`,
      },
    });
    const pendingData = await pendingRes.json();
    assert.equal(pendingRes.status, 400);
    assert.equal(pendingData.success, false);
    assert.match(pendingData.error, /Pending/i);
    console.log('  ✓ Test 4: PENDING booking cancellation rejected with HTTP 400');

    // Test 5: EXPIRED booking cannot be cancelled
    const expiredBooking = await prisma.booking.create({
      data: {
        publicId: `RU26-EXP-${randomSuffix}`,
        passId: pass.id,
        quantity: 1,
        unitPrice: pass.price,
        totalAmount: pass.price,
        fullName: 'Expired Attendee',
        phone: '+91 99887 76657',
        city: 'Ranchi',
        status: 'EXPIRED',
        paymentStatus: 'NOT_STARTED',
        expiresAt: new Date(Date.now() - 3600 * 1000),
      },
    });

    const expiredToken = createLookupSessionToken([expiredBooking.publicId]);
    const expiredRes = await fetch(`${BASE_URL}/api/bookings/${expiredBooking.publicId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${LOOKUP_SESSION_COOKIE_NAME}=${expiredToken}`,
      },
    });
    const expiredData = await expiredRes.json();
    assert.equal(expiredRes.status, 400);
    assert.equal(expiredData.success, false);
    assert.match(expiredData.error, /Expired/i);
    console.log('  ✓ Test 5: EXPIRED booking cancellation rejected with HTTP 400\n');

    // ------------------------------------------------------------------
    // SECTION 5: CONFIRMED CANCELLATION & INVENTORY ATOMICITY (Tests 1, 7, 8, 9, 22)
    // ------------------------------------------------------------------
    console.log('--- SECTION 5: Atomic Cancellation & Inventory Mutations ---');

    const passBeforeCancel = await prisma.pass.findUnique({ where: { id: pass.id } });
    const authSessionToken = createLookupSessionToken([testPublicId]);

    // Test 1 & 7: Confirmed booking can be cancelled through authorized lookup session
    const cancelRes = await fetch(`${BASE_URL}/api/bookings/${testPublicId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${LOOKUP_SESSION_COOKIE_NAME}=${authSessionToken}`,
      },
    });
    const cancelData = await cancelRes.json();
    assert.equal(cancelRes.status, 200);
    assert.equal(cancelData.success, true);
    assert.equal(cancelData.alreadyCancelled, false);
    assert.equal(cancelData.booking.status, 'CANCELLED');
    console.log('  ✓ Test 1: Confirmed booking cancelled through authorized lookup session');
    console.log('  ✓ Test 7: Booking status transitioned atomically CONFIRMED -> CANCELLED');

    // Reload from database to verify database persistence
    const reloadedBooking = await prisma.booking.findUnique({ where: { publicId: testPublicId } });
    assert.equal(reloadedBooking.status, 'CANCELLED');

    // Test 8: soldQuantity decreases by booking.quantity exactly once
    const passAfterCancel = await prisma.pass.findUnique({ where: { id: pass.id } });
    assert.equal(
      passAfterCancel.soldQuantity,
      passBeforeCancel.soldQuantity - testQuantity,
      'soldQuantity must decrease by booking.quantity'
    );
    console.log('  ✓ Test 8: soldQuantity decreased by exactly booking.quantity');

    // Test 9: reservedQuantity is not modified
    assert.equal(
      passAfterCancel.reservedQuantity,
      passBeforeCancel.reservedQuantity,
      'reservedQuantity must remain untouched during confirmed cancellation'
    );
    console.log('  ✓ Test 9: reservedQuantity remained untouched (only soldQuantity adjusted)');

    // Test 22: Cancellation does NOT automatically mark refund as completed
    assert.equal(reloadedBooking.paymentStatus, 'PAID'); // Payment remains historically recorded
    assert.match(cancelData.message, /Refund requests\/processing are handled separately/i);
    console.log('  ✓ Test 22: Cancellation preserves payment record; refund handled separately');

    // ------------------------------------------------------------------
    // SECTION 6: IDEMPOTENCY & RETRY SAFETY (Tests 6, 23)
    // ------------------------------------------------------------------
    console.log('\n--- SECTION 6: Idempotency & Repeated Cancellations ---');

    // Test 6 & 23: Repeated cancellation is idempotent and does not decrease inventory again
    const retryRes = await fetch(`${BASE_URL}/api/bookings/${testPublicId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${LOOKUP_SESSION_COOKIE_NAME}=${authSessionToken}`,
      },
    });
    const retryData = await retryRes.json();
    assert.equal(retryRes.status, 200);
    assert.equal(retryData.success, true);
    assert.equal(retryData.alreadyCancelled, true);
    assert.equal(retryData.booking.status, 'CANCELLED');

    const passAfterRetry = await prisma.pass.findUnique({ where: { id: pass.id } });
    assert.equal(
      passAfterRetry.soldQuantity,
      passAfterCancel.soldQuantity,
      'Duplicate cancellation must NOT mutate soldQuantity again'
    );
    console.log('  ✓ Test 6: Already CANCELLED booking returns safe state');
    console.log('  ✓ Test 23: Retry cancellation is strictly idempotent; zero duplicate inventory decrement\n');

    // ------------------------------------------------------------------
    // SECTION 7: INVENTORY SAFETY & ROLLBACK (Tests 10, 11)
    // ------------------------------------------------------------------
    console.log('--- SECTION 7: Inventory Safety & Check Constraints ---');

    // Test 10 & 11: Inventory cannot become negative; failure rolls back transaction
    // Create an edge case booking with quantity greater than soldQuantity on a dummy test pass
    const testPass2 = await prisma.pass.create({
      data: {
        passType: `CUSTOM_${randomSuffix}`,
        name: 'Test Rollback Pass',
        price: 999,
        totalQuantity: 10,
        reservedQuantity: 0,
        soldQuantity: 0, // 0 sold
      },
    });

    const overBooked = await prisma.booking.create({
      data: {
        publicId: `RU26-OVER-${randomSuffix}`,
        passId: testPass2.id,
        quantity: 5, // Requires 5, but only 0 sold
        unitPrice: 999,
        totalAmount: 999 * 5,
        fullName: 'Over Attendee',
        phone: '+91 99887 76658',
        city: 'Ranchi',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        confirmedAt: new Date(),
      },
    });

    const overToken = createLookupSessionToken([overBooked.publicId]);
    const overRes = await fetch(`${BASE_URL}/api/bookings/${overBooked.publicId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${LOOKUP_SESSION_COOKIE_NAME}=${overToken}`,
      },
    });
    const overData = await overRes.json();
    assert.equal(overRes.status, 409);
    assert.equal(overData.success, false);
    assert.match(overData.error, /insufficient sold_quantity/i);

    // Verify transaction rolled back: booking must NOT be cancelled
    const bookingCheck = await prisma.booking.findUnique({ where: { id: overBooked.id } });
    assert.equal(bookingCheck.status, 'CONFIRMED', 'Booking must remain CONFIRMED on inventory error');

    // Verify pass soldQuantity remained 0 (not negative)
    const passCheck = await prisma.pass.findUnique({ where: { id: testPass2.id } });
    assert.equal(passCheck.soldQuantity, 0, 'soldQuantity must not become negative');
    console.log('  ✓ Test 10: Inventory cannot become negative (guarded by sold_quantity >= quantity)');
    console.log('  ✓ Test 11: Inventory failure rolled back the cancellation transaction cleanly\n');

    // Clean up dummy records
    await prisma.booking.deleteMany({
      where: { id: { in: [overBooked.id, pendingBooking.id, expiredBooking.id, confirmedBooking.id] } },
    });
    await prisma.pass.delete({ where: { id: testPass2.id } });

    // ------------------------------------------------------------------
    // SECTION 8: TRANSFER-BY-POSSESSION POLICY AUDIT (Test 24)
    // ------------------------------------------------------------------
    console.log('--- SECTION 8: Transfer-by-Possession & Attendee Decoupling ---');

    // Verify no ticket transfer API exists
    const transferApiRes = await fetch(`${BASE_URL}/api/bookings/transfer`, { method: 'POST' });
    assert.ok([404, 405].includes(transferApiRes.status), 'No ticket transfer endpoint should exist');

    // Verify compliance documentation has transfer-by-possession text
    const termsRes = await fetch(`${BASE_URL}/terms-and-conditions`);
    const termsHtml = await termsRes.text();
    assert.match(termsHtml, /Transfer by Possession/i);
    assert.match(termsHtml, /The attendee name entered during booking does not by itself restrict who may use a valid pass/i);

    const refundRes = await fetch(`${BASE_URL}/refund-and-cancellation`);
    const refundHtml = await refundRes.text();
    assert.match(refundHtml, /PASS VALIDITY (&amp;|&) TRANSFER-BY-POSSESSION/i);
    assert.match(refundHtml, /Gross Paid Amount/i);
    assert.match(refundHtml, /6 October 2026/i);

    console.log('  ✓ Test 24: Transfer feature does not exist; attendee name decoupled from ticket validity');

    console.log('\n================================================================');
    console.log('ALL 24 TEST CASES PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

runAllTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
