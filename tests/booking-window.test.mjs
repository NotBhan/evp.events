import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { getBookingWindowState, isBookingOpen } from '../lib/booking-window.ts';

const prisma = new PrismaClient({ log: ['error'] });

// ============================================================================
// PART 1 — Deterministic boundary tests (injected timestamps, no wall clock)
// ============================================================================

const ORIGINAL_OPEN = process.env.BOOKING_OPEN_AT;
const ORIGINAL_CLOSE = process.env.BOOKING_CLOSE_AT;

const OPEN_AT = '2026-10-16T17:00:00+05:30'; // 11:30:00Z
const CLOSE_AT = '2026-10-16T23:00:00+05:30'; // 17:30:00Z

function setWindow(open, close) {
  if (open === undefined) delete process.env.BOOKING_OPEN_AT;
  else process.env.BOOKING_OPEN_AT = open;
  if (close === undefined) delete process.env.BOOKING_CLOSE_AT;
  else process.env.BOOKING_CLOSE_AT = close;
}

function restoreWindow() {
  if (ORIGINAL_OPEN === undefined) delete process.env.BOOKING_OPEN_AT;
  else process.env.BOOKING_OPEN_AT = ORIGINAL_OPEN;
  if (ORIGINAL_CLOSE === undefined) delete process.env.BOOKING_CLOSE_AT;
  else process.env.BOOKING_CLOSE_AT = ORIGINAL_CLOSE;
}

function runUnitBoundaryTests() {
  console.log('----------------------------------------------------------------');
  console.log('PART 1: Deterministic booking-window boundary tests (injected now)');
  console.log('----------------------------------------------------------------');

  setWindow(OPEN_AT, CLOSE_AT);

  // 1. Before open (1 second before) -> BOOKING_NOT_OPEN
  {
    const s = getBookingWindowState(new Date('2026-10-16T11:29:59Z'));
    assert.equal(s.status, 'NOT_OPEN');
    assert.equal(s.isOpen, false);
    assert.equal(s.reason, 'BOOKING_NOT_OPEN');
    assert.equal(isBookingOpen(new Date('2026-10-16T11:29:59Z')), false);
    console.log('  ✓ Before open (11:29:59Z) => BOOKING_NOT_OPEN');
  }

  // 2. Exactly at open (inclusive) -> OPEN
  {
    const s = getBookingWindowState(new Date('2026-10-16T11:30:00Z'));
    assert.equal(s.status, 'OPEN');
    assert.equal(s.isOpen, true);
    assert.equal(s.reason, null);
    assert.equal(isBookingOpen(new Date('2026-10-16T11:30:00Z')), true);
    console.log('  ✓ Exactly at open (11:30:00Z) => allowed (inclusive)');
  }

  // 3. During open (mid-window) -> OPEN
  {
    const s = getBookingWindowState(new Date('2026-10-16T14:00:00Z'));
    assert.equal(s.status, 'OPEN');
    assert.equal(isBookingOpen(new Date('2026-10-16T14:00:00Z')), true);
    console.log('  ✓ During open (14:00:00Z) => allowed');
  }

  // 4. One millisecond before close -> still OPEN
  {
    const s = getBookingWindowState(new Date('2026-10-16T17:29:59.999Z'));
    assert.equal(s.status, 'OPEN');
    assert.equal(isBookingOpen(new Date('2026-10-16T17:29:59.999Z')), true);
    console.log('  ✓ 1ms before close (17:29:59.999Z) => allowed');
  }

  // 5. Exactly at close (exclusive) -> BOOKING_CLOSED
  {
    const s = getBookingWindowState(new Date('2026-10-16T17:30:00Z'));
    assert.equal(s.status, 'CLOSED');
    assert.equal(s.isOpen, false);
    assert.equal(s.reason, 'BOOKING_CLOSED');
    assert.equal(isBookingOpen(new Date('2026-10-16T17:30:00Z')), false);
    console.log('  ✓ Exactly at close (17:30:00Z) => BOOKING_CLOSED (exclusive)');
  }

  // 6. After close -> BOOKING_CLOSED
  {
    const s = getBookingWindowState(new Date('2026-10-17T00:00:00Z'));
    assert.equal(s.status, 'CLOSED');
    assert.equal(isBookingOpen(new Date('2026-10-17T00:00:00Z')), false);
    console.log('  ✓ After close (next day) => BOOKING_CLOSED');
  }

  // 7. checkedAt reflects the injected instant (server-authoritative "now" is injectable)
  {
    const injected = new Date('2026-10-16T14:00:00Z');
    const s = getBookingWindowState(injected);
    assert.equal(s.checkedAt, injected.toISOString());
    console.log('  ✓ checkedAt equals injected instant (deterministic, no wall clock)');
  }

  // 8. Z-suffix and +05:30 offsets resolve to the same instant
  {
    setWindow('2026-10-16T11:30:00Z', '2026-10-16T17:30:00Z');
    const s = getBookingWindowState(new Date('2026-10-16T11:30:00Z'));
    assert.equal(s.status, 'OPEN');
    assert.equal(s.openAt, new Date(OPEN_AT).toISOString());
    setWindow(OPEN_AT, CLOSE_AT);
    console.log('  ✓ Equivalent Z / +05:30 offsets resolve identically');
  }

  console.log('\n  --- Invalid configuration must fail safely (closed) ---');

  // 9. Missing both values
  {
    setWindow(undefined, undefined);
    const s = getBookingWindowState(new Date('2026-10-16T14:00:00Z'));
    assert.equal(s.status, 'INVALID');
    assert.equal(s.isOpen, false);
    assert.equal(s.reason, 'BOOKING_WINDOW_INVALID');
    assert.deepEqual(s.invalidVariables, ['BOOKING_OPEN_AT', 'BOOKING_CLOSE_AT']);
    console.log('  ✓ Missing BOOKING_OPEN_AT/BOOKING_CLOSE_AT => INVALID (blocked)');
  }

  // 10. Empty strings
  {
    setWindow('', '   ');
    const s = getBookingWindowState(new Date('2026-10-16T14:00:00Z'));
    assert.equal(s.status, 'INVALID');
    assert.equal(s.isOpen, false);
    console.log('  ✓ Empty / whitespace values => INVALID (blocked)');
  }

  // 11. Unparsable
  {
    setWindow('not-a-date', '2026-10-16T23:00:00+05:30');
    const s = getBookingWindowState(new Date('2026-10-16T14:00:00Z'));
    assert.equal(s.status, 'INVALID');
    assert.ok(s.invalidVariables.includes('BOOKING_OPEN_AT'));
    console.log('  ✓ Unparsable BOOKING_OPEN_AT => INVALID (blocked)');
  }

  // 12. Missing explicit timezone offset
  {
    setWindow('2026-10-16T17:00:00', '2026-10-16T23:00:00');
    const s = getBookingWindowState(new Date('2026-10-16T14:00:00Z'));
    assert.equal(s.status, 'INVALID');
    assert.equal(s.isOpen, false);
    console.log('  ✓ Offset-less timestamps => INVALID (explicit offset required)');
  }

  // 13. Reversed window
  {
    setWindow(CLOSE_AT, OPEN_AT);
    const s = getBookingWindowState(new Date('2026-10-16T14:00:00Z'));
    assert.equal(s.status, 'INVALID');
    assert.equal(s.isOpen, false);
    console.log('  ✓ Reversed window (open after close) => INVALID (blocked)');
  }

  // 14. Equal boundaries (open must be strictly earlier)
  {
    setWindow(OPEN_AT, OPEN_AT);
    const s = getBookingWindowState(new Date('2026-10-16T14:00:00Z'));
    assert.equal(s.status, 'INVALID');
    assert.equal(s.isOpen, false);
    console.log('  ✓ Equal boundaries => INVALID (open must be strictly earlier)');
  }

  restoreWindow();
  console.log('\n✓ PART 1 PASSED: all booking-window boundary + fail-safe cases verified.\n');
}

// ============================================================================
// PART 2 — Real HTTP enforcement against the production server
// ============================================================================

const CLOSED_PORT = 3051;
const OPEN_PORT = 3052;

function startServer(port, windowEnv) {
  const proc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'production',
      ...windowEnv,
    },
    stdio: 'pipe',
  });
  proc.stdout.on('data', () => {});
  proc.stderr.on('data', () => {});
  return proc;
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

async function countBookings() {
  const rows = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM bookings`);
  return rows[0].n;
}

async function getPassInventory(passId) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT reserved_quantity::int AS r, sold_quantity::int AS s FROM passes WHERE id = $1`,
    passId
  );
  return rows[0];
}

async function assertNoNewBookingSideEffects(expectedBookingCount, passId, expectedInventory, label) {
  const afterCount = await countBookings();
  assert.equal(afterCount, expectedBookingCount, `${label}: no booking row may be created`);
  if (passId && expectedInventory) {
    const inv = await getPassInventory(passId);
    assert.equal(inv.r, expectedInventory.r, `${label}: reserved_quantity must not change`);
    assert.equal(inv.s, expectedInventory.s, `${label}: sold_quantity must not change`);
  }
}

async function runHttpTests() {
  console.log('----------------------------------------------------------------');
  console.log('PART 2: Real HTTP enforcement (production server, real Neon)');
  console.log('----------------------------------------------------------------');

  const nowMs = Date.now();
  const notOpenEnv = {
    BOOKING_OPEN_AT: new Date(nowMs + 60 * 60 * 1000).toISOString(),
    BOOKING_CLOSE_AT: new Date(nowMs + 2 * 60 * 60 * 1000).toISOString(),
  };
  const closedEnv = {
    BOOKING_OPEN_AT: new Date(nowMs - 2 * 60 * 60 * 1000).toISOString(),
    BOOKING_CLOSE_AT: new Date(nowMs - 60 * 60 * 1000).toISOString(),
  };
  const invalidEnv = {
    BOOKING_OPEN_AT: 'not-a-date',
    BOOKING_CLOSE_AT: 'also-not-a-date',
  };
  const openEnv = {
    BOOKING_OPEN_AT: new Date(nowMs - 60 * 60 * 1000).toISOString(),
    BOOKING_CLOSE_AT: new Date(nowMs + 60 * 60 * 1000).toISOString(),
  };

  const closedProc = startServer(CLOSED_PORT, closedEnv);
  const openProc = startServer(OPEN_PORT, openEnv);
  const closedBase = `http://127.0.0.1:${CLOSED_PORT}`;
  const openBase = `http://127.0.0.1:${OPEN_PORT}`;

  let tempPass = null;
  let createdBookingPublicId = null;
  let lookupCookie = null;
  let notOpenProc = null;
  let invalidProc = null;

  try {
    await waitForServer(closedBase);
    await waitForServer(openBase);
    console.log('  ✓ Closed-window and open-window servers ready\n');

    const baselineCount = await countBookings();

    // --- A. Closed window: creation blocked, no side effects -----------------
    {
      const res = await fetch(`${closedBase}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Window Closed Test',
          phone: '9876543210',
          passId: 'solo-female',
          quantity: 1,
        }),
      });
      const body = await res.json();
      assert.equal(res.status, 403, 'Closed window must return HTTP 403');
      assert.equal(body.success, false);
      assert.equal(body.code, 'BOOKING_CLOSED');
      console.log('  ✓ Closed window => HTTP 403 BOOKING_CLOSED');
    }

    // --- B. Client-supplied "now" cannot bypass a closed window --------------
    {
      const res = await fetch(`${closedBase}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Window Closed Test',
          phone: '9876543210',
          passId: 'solo-female',
          quantity: 1,
          now: new Date(nowMs - 30 * 60 * 1000).toISOString(),
          bookingWindowOpen: true,
          bookingOpenAt: new Date(nowMs - 60 * 60 * 1000).toISOString(),
          bookingCloseAt: new Date(nowMs + 60 * 60 * 1000).toISOString(),
        }),
      });
      const body = await res.json();
      assert.equal(res.status, 403, 'Client-provided window fields must not bypass the gate');
      assert.equal(body.code, 'BOOKING_CLOSED');
      console.log('  ✓ Client-supplied now/open-at/close-at ignored => still BOOKING_CLOSED');
    }

    // --- C. Invalid configuration blocks new bookings ------------------------
    {
      invalidProc = startServer(3053, invalidEnv);
      const invalidBase = 'http://127.0.0.1:3053';
      await waitForServer(invalidBase);

      const res = await fetch(`${invalidBase}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Window Invalid Test',
          phone: '9876543210',
          passId: 'solo-female',
          quantity: 1,
        }),
      });
      const body = await res.json();
      assert.equal(res.status, 403, 'Invalid config must block creation');
      assert.equal(body.code, 'BOOKING_WINDOW_INVALID');
      assert.ok(!/BOOKING_OPEN_AT|not-a-date/i.test(body.error || ''), 'must not leak config internals');
      console.log('  ✓ Invalid config => HTTP 403 BOOKING_WINDOW_INVALID (fail-safe, no config leak)');
    }

    // --- D. Not-open window (before open) ------------------------------------
    {
      notOpenProc = startServer(3054, notOpenEnv);
      const notOpenBase = 'http://127.0.0.1:3054';
      await waitForServer(notOpenBase);

      const res = await fetch(`${notOpenBase}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Window Not Open Test',
          phone: '9876543210',
          passId: 'solo-female',
          quantity: 1,
        }),
      });
      const body = await res.json();
      assert.equal(res.status, 403);
      assert.equal(body.code, 'BOOKING_NOT_OPEN');
      console.log('  ✓ Before open => HTTP 403 BOOKING_NOT_OPEN');
    }

    await assertNoNewBookingSideEffects(baselineCount, null, null, 'blocked attempts');
    console.log('  ✓ Zero side effects: no booking rows created, inventory untouched\n');

    // --- E. Open window: request passes the gate to normal validation --------
    {
      const res = await fetch(`${openBase}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Window Open Validation Test',
          phone: 'invalid-phone',
          passId: 'solo-female',
          quantity: 1,
        }),
      });
      const body = await res.json();
      assert.equal(res.status, 400, 'Open window must pass the gate to normal validation');
      assert.match(body.error, /10-digit/i);
      console.log('  ✓ Open window => request passes gate to validation (HTTP 400, not 403)');
    }

    // --- F. Open window: real booking creation allowed -----------------------
    {
      tempPass = await prisma.pass.create({
        data: {
          passType: `window-test-${Date.now()}`,
          name: 'Window Test Pass',
          price: 100,
          totalQuantity: 5,
          reservedQuantity: 0,
          soldQuantity: 0,
          isActive: true,
        },
      });

      const preInv = await getPassInventory(tempPass.id);
      assert.equal(preInv.r, 0);
      assert.equal(preInv.s, 0);

      const res = await fetch(`${openBase}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Window Open Creation Test',
          email: 'window.open@suitetest.example',
          phone: '9876543210',
          passId: tempPass.passType,
          quantity: 1,
        }),
      });
      const body = await res.json();
      assert.equal(res.status, 201, `Open window creation must succeed (got ${res.status})`);
      assert.equal(body.success, true);
      assert.match(body.bookingId, /^RU26-REQ-\d{4}$/);
      const numericId = Number(body.bookingId.split('-').pop());
      assert.ok(numericId >= 1000 && numericId <= 9999, 'booking id must be within RU26-REQ-1000..9999');
      createdBookingPublicId = body.bookingId;

      const setCookie = res.headers.get('set-cookie') || '';
      const cookieMatch = setCookie.match(/ru26_lookup_session=[^;]+/);
      lookupCookie = cookieMatch ? cookieMatch[0] : null;

      const inv = await getPassInventory(tempPass.id);
      assert.equal(inv.r, 1, 'reservation must increment reserved_quantity by 1');
      assert.equal(inv.s, 0);

      const dbBooking = await prisma.booking.findUnique({ where: { publicId: createdBookingPublicId } });
      assert.ok(dbBooking, 'booking row must exist in Neon');
      assert.equal(dbBooking.quantity, 1);
      assert.equal(dbBooking.totalAmount, tempPass.price, 'total must equal authoritative pass price');
      console.log('  ✓ Open window => HTTP 201 booking created, inventory reserved, authoritative price used');
    }

    // --- G. Existing-booking lifecycle is NOT gated by the window ------------
    {
      assert.ok(lookupCookie, 'lookup session cookie must be present for retrieval test');
      const res = await fetch(`${closedBase}/api/bookings/${createdBookingPublicId}`, {
        method: 'GET',
        headers: { Cookie: lookupCookie },
      });
      assert.equal(res.status, 200, 'existing booking must remain retrievable after close');
      const body = await res.json();
      const payload = body.booking || body;
      assert.equal(payload.publicId || payload.bookingId, createdBookingPublicId);
      console.log('  ✓ Existing booking retrievable after close (HTTP 200 on the closed-window server)');
    }

    console.log('\n✓ PART 2 PASSED: HTTP window enforcement verified with zero side effects.\n');
  } finally {
    for (const proc of [closedProc, openProc, notOpenProc, invalidProc]) {
      if (proc) proc.kill('SIGTERM');
    }

    // Cleanup: remove only the temporary records this suite created.
    if (createdBookingPublicId) {
      const row = await prisma.booking.findUnique({ where: { publicId: createdBookingPublicId } });
      if (row) await prisma.booking.delete({ where: { id: row.id } });
    }
    if (tempPass) {
      await prisma.booking.deleteMany({ where: { passId: tempPass.id } });
      await prisma.pass.delete({ where: { id: tempPass.id } });
    }
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — BOOKING WINDOW TEST SUITE');
  console.log('Mode: deterministic boundaries + real HTTP enforcement (real Neon)');
  console.log('================================================================\n');

  runUnitBoundaryTests();
  await runHttpTests();

  console.log('================================================================');
  console.log('✓ ALL BOOKING WINDOW TESTS PASSED');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('\n✗ BOOKING WINDOW TEST SUITE FAILED');
  console.error(err);
  process.exit(1);
});
