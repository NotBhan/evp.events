import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { OPEN_BOOKING_WINDOW_ENV } from './helpers/booking-window-env.mjs';
import { createEntryQrToken, verifyEntryQrToken, ENTRY_QR_PREFIX } from '../lib/entry-token.ts';
import { hashCredential } from '../lib/organiser-credentials.ts';

const prisma = new PrismaClient({ log: ['error'] });

const PORT = 3058;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ORIGIN = BASE_URL;

function lookupSessionTokenFor(publicId) {
  const secret = process.env.SESSION_SECRET || process.env.DATABASE_URL || 'ru26-default-dev-secret-salt-3981';
  const hashed = crypto.createHash('sha256').update(secret).digest('hex');
  const payload = Buffer.from(
    JSON.stringify({
      sessionKey: crypto.randomBytes(16).toString('hex'),
      bookingIds: [publicId],
      expiresAt: Date.now() + 30 * 60 * 1000,
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', hashed).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function runQrUnitTests() {
  console.log('----------------------------------------------------------------');
  console.log('PART 1: QR credential (crypto-only, deterministic)');
  console.log('----------------------------------------------------------------');

  const tokenA = createEntryQrToken('RU26-REQ-1234');
  const tokenA2 = createEntryQrToken('RU26-REQ-1234');
  const tokenB = createEntryQrToken('RU26-REQ-4321');

  assert.equal(tokenA, tokenA2, 'the same booking must always produce the identical QR token');
  assert.notEqual(tokenA, tokenB, 'different bookings must produce different QR tokens');
  assert.ok(tokenA.startsWith(`${ENTRY_QR_PREFIX}RU26-REQ-1234.`), 'token must use the locked format');
  console.log('  ✓ deterministic per booking, distinct across bookings, locked RAAS26.ENTRY.v1 format');

  assert.deepEqual(verifyEntryQrToken(tokenA), { publicId: 'RU26-REQ-1234' });
  console.log('  ✓ valid token verifies and yields the public booking id');

  const parts = tokenA.split('.');
  const tamperedSignature = `${parts.slice(0, 4).join('.')}.${'A'.repeat(parts[4].length)}`;
  assert.equal(verifyEntryQrToken(tamperedSignature), null, 'tampered signature must fail');
  assert.equal(
    verifyEntryQrToken(`RAAS26.ENTRY.v1.RU26-REQ-9999.${parts[4]}`),
    null,
    'publicId swap with a valid-looking signature must fail (signature covers publicId)'
  );
  console.log('  ✓ tampered signature and swapped publicId are rejected');

  assert.equal(verifyEntryQrToken('RAAS27.ENTRY.v1.RU26-REQ-1234.sig'), null, 'wrong event rejected');
  assert.equal(verifyEntryQrToken('RAAS26.ADMISSION.v1.RU26-REQ-1234.sig'), null, 'wrong purpose rejected');
  assert.equal(verifyEntryQrToken('RAAS26.ENTRY.v2.RU26-REQ-1234.sig'), null, 'wrong version rejected');
  console.log('  ✓ wrong event / purpose / version rejected');

  assert.equal(verifyEntryQrToken('RAAS26.ENTRY.v1.RU26-REQ-1234'), null, 'too few segments rejected');
  assert.equal(verifyEntryQrToken(''), null);
  assert.equal(verifyEntryQrToken(null), null);
  assert.equal(verifyEntryQrToken(12345), null);
  assert.equal(verifyEntryQrToken(`RAAS26.ENTRY.v1.${'X'.repeat(400)}.sig`), null);
  assert.equal(verifyEntryQrToken(`${tokenA}${'X'.repeat(600)}`), null, 'oversized token rejected');
  console.log('  ✓ malformed / non-string / oversized inputs rejected without normalization');

  assert.ok(!tokenA.includes('@'), 'no email-like content in token');
  assert.equal(tokenA.includes('+91'), false, 'no phone content in token');
  console.log('  ✓ token carries no PII beyond the public booking id');

  const originalSecret = process.env.ENTRY_QR_SECRET;
  delete process.env.ENTRY_QR_SECRET;
  assert.equal(verifyEntryQrToken(tokenA), null, 'missing secret must fail closed');
  assert.throws(() => createEntryQrToken('RU26-REQ-1234'), /ENTRY_QR_SECRET/);
  process.env.ENTRY_QR_SECRET = originalSecret;
  console.log('  ✓ missing ENTRY_QR_SECRET fails closed (verify null, create throws)');
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

async function runEntryHttpTests() {
  console.log('\n----------------------------------------------------------------');
  console.log('PART 2: Entry verify/confirm over real HTTP + real Neon');
  console.log('----------------------------------------------------------------');

  // Check-in triggers a Sheets mirror attempt. Point it at a local mock so this
  // suite never writes permanent rows into the production spreadsheet (the real
  // mirror behaviour is covered by the opt-in live suites).
  const sheetsMockPort = 3994;
  const sheetsMock = http.createServer((req, res) => {
    req.on('data', () => {});
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', action: 'inserted' }));
    });
  });
  await new Promise((resolve) => sheetsMock.listen(sheetsMockPort, '127.0.0.1', resolve));

  const serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
    env: {
      ...process.env,
      ...OPEN_BOOKING_WINDOW_ENV,
      PORT: String(PORT),
      NODE_ENV: 'production',
      BOOKING_SHEETS_ENDPOINT: `http://127.0.0.1:${sheetsMockPort}/exec`,
    },
    stdio: 'pipe',
  });
  serverProc.stdout.on('data', () => {});
  serverProc.stderr.on('data', () => {});

  const createdOrganiserIds = new Set();
  const createdBookingIds = new Set();
  let testPass = null;

  const createOrganiser = async (name, gateId) => {
    const loginId = `entry-test-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    const password = 'EntryTest#2026';
    const organiser = await prisma.organiser.create({
      data: {
        name,
        loginId,
        credentialHash: await hashCredential(password),
        role: 'ENTRY_SCANNER',
        gateId,
        active: true,
      },
    });
    createdOrganiserIds.add(organiser.id);
    return { organiser, loginId, password };
  };

  const loginOrganiser = async (loginId, password) => {
    const res = await fetch(`${BASE_URL}/api/organiser/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({ loginId, password }),
    });
    assert.equal(res.status, 200, 'organiser login must succeed for test fixtures');
    return (res.headers.get('set-cookie') || '').split(';')[0];
  };

  const makeBooking = async (overrides) => {
    let booking = null;
    for (let attempt = 0; attempt < 10 && !booking; attempt++) {
      const publicId = `RU26-REQ-${Math.floor(1000 + Math.random() * 9000)}`;
      try {
        booking = await prisma.booking.create({
          data: {
            publicId,
            fullName: 'Entry Test Attendee',
            phone: '+91 99315 03990',
            passId: testPass.id,
            quantity: 1,
            unitPrice: testPass.price,
            totalAmount: testPass.price,
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            confirmedAt: new Date(),
            expiresAt: new Date(Date.now() + 3600000),
            source: 'entry-test',
            ...overrides,
          },
        });
      } catch (err) {
        if (err?.code !== 'P2002') throw err;
      }
    }
    assert.ok(booking, 'test booking fixture must be created within the retry budget');
    createdBookingIds.add(booking.id);
    return booking;
  };

  const verify = (qrToken, cookie) =>
    fetch(`${BASE_URL}/api/entry/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify({ qrToken }),
    });

  const confirm = (body, cookie = null, extraHeaders = {}) =>
    fetch(`${BASE_URL}/api/entry/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN,
        ...(cookie ? { Cookie: cookie } : {}),
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });

  try {
    await waitForServer(BASE_URL);
    console.log('  ✓ Production server ready\n');

    testPass = await prisma.pass.create({
      data: {
        passType: `entry-test-${Date.now()}`,
        name: 'Entry Test Tier',
        price: 1200,
        totalQuantity: 50,
        reservedQuantity: 0,
        soldQuantity: 50,
        isActive: true,
      },
    });

    const { organiser: scannerOrganiser, loginId, password } = await createOrganiser('Entry Test Scanner', 'GATE-02');
    const sessionCookie = await loginOrganiser(loginId, password);

    // --- 1. Session + cross-auth guards ------------------------------------
    {
      const noSession = await verify('anything');
      assert.equal(noSession.status, 401, 'entry verify requires an organiser session');

      const customerCookie = 'ru26_lookup_session=aaaa.bbbb';
      const crossAuth = await verify('anything', customerCookie);
      assert.equal(crossAuth.status, 401, 'customer session must not authorize entry APIs');

      const confirmNoSession = await confirm({ qrToken: 'anything' });
      assert.equal(confirmNoSession.status, 401, 'entry confirm requires an organiser session');

      const confirmCrossAuth = await confirm({ qrToken: 'anything' }, customerCookie);
      assert.equal(confirmCrossAuth.status, 401, 'customer session must not confirm entry');
      console.log('  ✓ TEST 1: no-session and cross-domain (customer) access rejected with 401');
    }

    // --- 2. Origin protection on confirm -----------------------------------
    {
      const booking = await makeBooking({});
      const token = createEntryQrToken(booking.publicId);
      const res = await confirm({ qrToken: token }, sessionCookie, { Origin: 'https://evil.example.com' });
      assert.equal(res.status, 403, 'cross-origin confirm must be rejected');
      const dbAfter = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert.equal(dbAfter.checkInStatus, 'NOT_CHECKED_IN');
      console.log('  ✓ TEST 2: confirm rejects mismatched Origin (CSRF) with zero state change');
    }

    // --- 3. Verify valid pass is read-only ---------------------------------
    {
      const booking = await makeBooking({});
      const token = createEntryQrToken(booking.publicId);
      const res = await verify(token, sessionCookie);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.valid, true);
      assert.equal(data.entryStatus, 'NOT_CHECKED_IN');
      assert.equal(data.booking.bookingId, booking.publicId);
      assert.equal(data.booking.attendeeName, 'Entry Test Attendee');
      assert.equal(data.booking.passType, 'Entry Test Tier');
      assert.equal(data.booking.quantity, 1);
      assert.equal(data.booking.paymentStatus, 'PAID');
      assert.equal(data.booking.bookingStatus, 'CONFIRMED');

      const dbAfter = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert.equal(dbAfter.checkInStatus, 'NOT_CHECKED_IN', 'verify must not mutate admission state');
      assert.equal(dbAfter.checkedInAt, null, 'verify must not stamp entry time');
      console.log('  ✓ TEST 3: verify returns details and performs ZERO mutations');
    }

    // --- 4. Verify classification for every invalid state ------------------
    {
      const pending = await makeBooking({ status: 'PENDING', paymentStatus: 'NOT_STARTED', confirmedAt: null });
      const unpaid = await makeBooking({ paymentStatus: 'PENDING' });
      const cancelled = await makeBooking({ status: 'CANCELLED' });
      const expired = await makeBooking({ status: 'EXPIRED' });
      const checkedIn = await makeBooking({
        checkInStatus: 'CHECKED_IN',
        checkedInAt: new Date('2026-09-16T10:00:00Z'),
        checkedInBy: 'GATE-01 / First Scanner',
        checkedInById: 'first-scanner-id',
      });

      const expectations = [
        [pending, 'BOOKING_NOT_CONFIRMED'],
        [unpaid, 'PAYMENT_NOT_CONFIRMED'],
        [cancelled, 'BOOKING_CANCELLED'],
        [expired, 'BOOKING_EXPIRED'],
        [checkedIn, 'ALREADY_CHECKED_IN'],
      ];

      for (const [booking, expected] of expectations) {
        const res = await verify(createEntryQrToken(booking.publicId), sessionCookie);
        const data = await res.json();
        assert.equal(data.valid, false, `${booking.publicId} must not verify as valid`);
        assert.equal(data.reason, expected, `${booking.publicId} must classify as ${expected}`);
      }

      const checkedInRes = await verify(createEntryQrToken(checkedIn.publicId), sessionCookie);
      const checkedInData = await checkedInRes.json();
      assert.equal(checkedInData.booking.scannedBy, 'GATE-01 / First Scanner');
      assert.equal(checkedInData.booking.checkedInAt, new Date('2026-09-16T10:00:00Z').toISOString());
      console.log('  ✓ TEST 4: all invalid states classify correctly (not-confirmed, unpaid, cancelled, expired, already-in)');
    }

    // --- 5. Invalid QR cannot verify or confirm ----------------------------
    {
      const res = await verify('RAAS26.ENTRY.v1.RU26-REQ-1111.forged', sessionCookie);
      const data = await res.json();
      assert.equal(data.valid, false);
      assert.equal(data.reason, 'INVALID_QR');

      const confirmRes = await confirm({ qrToken: 'RAAS26.ENTRY.v1.RU26-REQ-1111.forged' }, sessionCookie);
      const confirmData = await confirmRes.json();
      assert.equal(confirmData.success, false);
      assert.equal(confirmData.result, 'INVALID_QR');
      console.log('  ✓ TEST 5: forged QR rejected by both verify and confirm');
    }

    // --- 6. Confirm entry is the only mutation + server-derived identity ---
    {
      const booking = await makeBooking({});
      const token = createEntryQrToken(booking.publicId);

      const res = await confirm(
        {
          qrToken: token,
          // Spoofed authoritative fields — must be ignored entirely.
          checkedInBy: 'HACKER / Fake Gate',
          checkedInById: 'fake-id',
          gateId: 'VIP-GATE',
          entryStatus: 'CHECKED_IN',
          bookingStatus: 'CANCELLED',
        },
        sessionCookie
      );
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.equal(data.result, 'ENTRY_CONFIRMED');
      assert.equal(data.booking.entryStatus, 'CHECKED_IN');

      const dbAfter = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert.equal(dbAfter.checkInStatus, 'CHECKED_IN');
      assert.ok(dbAfter.checkedInAt, 'checked_in_at must be stamped');
      assert.equal(dbAfter.checkedInBy, 'GATE-02 / Entry Test Scanner', 'display identity must be server-derived');
      assert.equal(dbAfter.checkedInById, scannerOrganiser.id, 'audit identity must be the authenticated organiser');
      assert.notEqual(dbAfter.checkedInBy, 'HACKER / Fake Gate');
      assert.notEqual(dbAfter.checkedInById, 'fake-id');
      assert.equal(dbAfter.status, 'CONFIRMED', 'booking status must not be spoofable');
      console.log('  ✓ TEST 6: confirm succeeds, spoofed identity/status fields ignored, identity server-derived');
    }

    // --- 7. Duplicate confirm returns the ORIGINAL entry record ------------
    {
      const booking = await makeBooking({
        checkInStatus: 'CHECKED_IN',
        checkedInAt: new Date('2026-09-16T09:30:00Z'),
        checkedInBy: 'GATE-01 / Original Scanner',
        checkedInById: 'original-scanner-id',
      });
      const token = createEntryQrToken(booking.publicId);

      const res = await confirm({ qrToken: token }, sessionCookie);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.result, 'ALREADY_CHECKED_IN');
      assert.equal(data.booking.scannedBy, 'GATE-01 / Original Scanner');
      assert.equal(data.booking.checkedInAt, new Date('2026-09-16T09:30:00Z').toISOString());

      const dbAfter = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert.equal(dbAfter.checkedInBy, 'GATE-01 / Original Scanner', 'original scanner must be preserved');
      assert.equal(dbAfter.checkedInById, 'original-scanner-id');
      console.log('  ✓ TEST 7: second confirm → ALREADY_CHECKED_IN with original time/scanner preserved');
    }

    // --- 8. Invalid states cannot be confirmed -----------------------------
    {
      const ineligible = [
        await makeBooking({ status: 'PENDING', paymentStatus: 'NOT_STARTED', confirmedAt: null }),
        await makeBooking({ paymentStatus: 'PENDING' }),
        await makeBooking({ status: 'CANCELLED' }),
        await makeBooking({ status: 'EXPIRED' }),
      ];

      for (const booking of ineligible) {
        const res = await confirm({ qrToken: createEntryQrToken(booking.publicId) }, sessionCookie);
        const data = await res.json();
        assert.equal(data.success, false, `${booking.publicId} must not be admitted`);
        const dbAfter = await prisma.booking.findUnique({ where: { id: booking.id } });
        assert.equal(dbAfter.checkInStatus, 'NOT_CHECKED_IN');
      }
      console.log('  ✓ TEST 8: pending/unpaid/cancelled/expired bookings cannot be admitted');
    }

    // --- 9. Two independent organisers confirm the same QR concurrently ----
    {
      const booking = await makeBooking({});
      const token = createEntryQrToken(booking.publicId);

      const { organiser: secondOrganiser, loginId: login2, password: password2 } = await createOrganiser('Second Scanner', 'GATE-03');
      const secondCookie = await loginOrganiser(login2, password2);

      const [resA, resB] = await Promise.all([
        confirm({ qrToken: token }, sessionCookie),
        confirm({ qrToken: token }, secondCookie),
      ]);
      const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);

      const results = [dataA, dataB].map((d) => d.result).sort();
      assert.deepEqual(results, ['ALREADY_CHECKED_IN', 'ENTRY_CONFIRMED'], 'exactly one confirmation must win');

      const dbAfter = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert.equal(dbAfter.checkInStatus, 'CHECKED_IN');
      assert.ok(
        [scannerOrganiser.id, secondOrganiser.id].includes(dbAfter.checkedInById),
        'stored audit identity must belong to one of the two authenticated organisers'
      );
      const expectedDisplay =
        dbAfter.checkedInById === scannerOrganiser.id
          ? 'GATE-02 / Entry Test Scanner'
          : 'GATE-03 / Second Scanner';
      assert.equal(dbAfter.checkedInBy, expectedDisplay, 'display identity must match the winning organiser');
      console.log('  ✓ TEST 9: concurrent confirmation → exactly one ENTRY_CONFIRMED, one ALREADY_CHECKED_IN, one CHECKED_IN state');
    }

    // --- 10. Cancellation / check-in race orderings ------------------------
    {
      // 10A: cancellation commits first → confirmation rejects
      const cancelledFirst = await makeBooking({});
      const cancelRes = await fetch(
        `${BASE_URL}/api/bookings/${cancelledFirst.publicId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: ORIGIN,
            Cookie: `ru26_lookup_session=${lookupSessionTokenFor(cancelledFirst.publicId)}`,
          },
        }
      );
      assert.equal(cancelRes.status, 200, 'eligible booking must cancel successfully');
      const confirmAfterCancel = await confirm(
        { qrToken: createEntryQrToken(cancelledFirst.publicId) },
        sessionCookie
      );
      const confirmAfterCancelData = await confirmAfterCancel.json();
      assert.equal(confirmAfterCancelData.success, false);
      assert.equal(confirmAfterCancelData.result, 'BOOKING_CANCELLED');

      // 10B: confirmation commits first → cancellation rejects with PASS_ALREADY_USED
      const confirmedFirst = await makeBooking({});
      const confirmRes = await confirm(
        { qrToken: createEntryQrToken(confirmedFirst.publicId) },
        sessionCookie
      );
      assert.equal((await confirmRes.json()).result, 'ENTRY_CONFIRMED');

      const cancelAfterConfirm = await fetch(
        `${BASE_URL}/api/bookings/${confirmedFirst.publicId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: ORIGIN,
            Cookie: `ru26_lookup_session=${lookupSessionTokenFor(confirmedFirst.publicId)}`,
          },
        }
      );
      const cancelAfterConfirmData = await cancelAfterConfirm.json();
      assert.equal(cancelAfterConfirm.status, 409);
      assert.equal(cancelAfterConfirmData.code, 'PASS_ALREADY_USED');

      const dbAfter = await prisma.booking.findUnique({ where: { id: confirmedFirst.id } });
      assert.equal(dbAfter.status, 'CONFIRMED', 'checked-in booking must never be cancelled');
      assert.equal(dbAfter.checkInStatus, 'CHECKED_IN');
      console.log('  ✓ TEST 10: cancel-first → confirm rejects; confirm-first → cancel rejects with PASS_ALREADY_USED');
    }

    // --- 11. Entry token exposure boundary (receipt/view-model only) -------
    {
      const confirmedPaid = await makeBooking({});
      const pendingBooking = await makeBooking({
        status: 'PENDING',
        paymentStatus: 'NOT_STARTED',
        confirmedAt: null,
      });
      const cancelledBooking = await makeBooking({ status: 'CANCELLED' });
      const unpaidBooking = await makeBooking({ paymentStatus: 'PENDING' });

      const fetchDetail = async (publicId) => {
        const res = await fetch(`${BASE_URL}/api/bookings/${publicId}`, {
          headers: { Cookie: `ru26_lookup_session=${lookupSessionTokenFor(publicId)}` },
        });
        assert.equal(res.status, 200, `authorized detail fetch for ${publicId} must succeed`);
        return (await res.json()).booking;
      };

      const confirmedDetail = await fetchDetail(confirmedPaid.publicId);
      assert.ok(confirmedDetail.entryToken, 'CONFIRMED + PAID booking must expose an entryToken');
      assert.deepEqual(
        verifyEntryQrToken(confirmedDetail.entryToken),
        { publicId: confirmedPaid.publicId },
        'exposed entryToken must verify to the same booking'
      );
      assert.equal(
        confirmedDetail.entryToken,
        createEntryQrToken(confirmedPaid.publicId),
        'token must be deterministic across retrievals'
      );

      const pendingDetail = await fetchDetail(pendingBooking.publicId);
      const cancelledDetail = await fetchDetail(cancelledBooking.publicId);
      const unpaidDetail = await fetchDetail(unpaidBooking.publicId);
      assert.equal(pendingDetail.entryToken, undefined, 'PENDING booking must not expose an entryToken');
      assert.equal(cancelledDetail.entryToken, undefined, 'CANCELLED booking must not expose an entryToken');
      assert.equal(unpaidDetail.entryToken, undefined, 'unpaid booking must not expose an entryToken');
      console.log('  ✓ TEST 11: entryToken exposed only for CONFIRMED + PAID receipts, deterministic, absent otherwise');
    }

    // --- 12. A Sheets outage can never block or revoke an admission -------
    {
      const deadSheetsPort = 3059;
      const outageProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(deadSheetsPort)], {
        env: {
          ...process.env,
          ...OPEN_BOOKING_WINDOW_ENV,
          PORT: String(deadSheetsPort),
          NODE_ENV: 'production',
          BOOKING_SHEETS_ENDPOINT: 'http://127.0.0.1:3999/exec', // nothing listens here
        },
        stdio: 'pipe',
      });
      outageProc.stdout.on('data', () => {});
      outageProc.stderr.on('data', () => {});

      try {
        const outageBase = `http://127.0.0.1:${deadSheetsPort}`;
        await waitForServer(outageBase);

        const booking = await makeBooking({});
        const token = createEntryQrToken(booking.publicId);

        const res = await fetch(`${outageBase}/api/entry/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Origin: outageBase, Cookie: sessionCookie },
          body: JSON.stringify({ qrToken: token }),
        });
        const data = await res.json();

        assert.equal(res.status, 200, 'admission must succeed while Sheets is unreachable');
        assert.equal(data.success, true, 'Sheets outage must not reject a valid entry');
        assert.equal(data.result, 'ENTRY_CONFIRMED');

        const dbAfter = await prisma.booking.findUnique({ where: { id: booking.id } });
        assert.equal(dbAfter.checkInStatus, 'CHECKED_IN', 'Neon check-in must be committed');
        assert.ok(dbAfter.checkedInAt, 'entry time must be recorded');
        assert.ok(
          ['FAILED', 'PENDING', 'SYNCED'].includes(dbAfter.sheetSyncStatus),
          `mirror state must be recorded for reconciliation (got ${dbAfter.sheetSyncStatus})`
        );
        console.log('  ✓ TEST 12: Sheets outage did not block admission; mirror failure left for reconciliation');
      } finally {
        outageProc.kill('SIGTERM');
      }
    }

    console.log('\n✓ ENTRY / CHECK-IN SUITE PASSED\n');
  } finally {
    serverProc.kill('SIGTERM');
    await new Promise((resolve) => sheetsMock.close(resolve));

    if (createdBookingIds.size > 0) {
      await prisma.booking.deleteMany({ where: { id: { in: Array.from(createdBookingIds) } } });
    }
    if (testPass) {
      await prisma.booking.deleteMany({ where: { passId: testPass.id } });
      await prisma.pass.delete({ where: { id: testPass.id } });
    }
    if (createdOrganiserIds.size > 0) {
      await prisma.organiser.deleteMany({ where: { id: { in: Array.from(createdOrganiserIds) } } });
    }
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — QR ENTRY / CHECK-IN TEST SUITE');
  console.log('================================================================\n');

  runQrUnitTests();
  await runEntryHttpTests();

  console.log('================================================================');
  console.log('✓ ALL QR ENTRY / CHECK-IN TESTS PASSED');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('\n✗ ENTRY / CHECK-IN SUITE FAILED');
  console.error(err);
  process.exit(1);
});
