import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { OPEN_BOOKING_WINDOW_ENV } from './helpers/booking-window-env.mjs';
import { createEntryQrToken } from '../lib/entry-token.ts';

/**
 * LIVE QR entry verification against the deployed production configuration:
 * the real deployed Apps Script Sheets endpoint (no mocks) and real Neon.
 *
 * Verifies:
 * 1. Live Apps Script reports the 14-column schema.
 * 2. The hidden developer account can sign in, is absent from the organiser admin
 *    listing, and cannot be targeted from the panel.
 * 3. A pass QR verifies and confirms entry, the Neon state is CHECKED_IN, and the
 *    live Sheets mirror reports SYNCED (proving the deployed 14-column script
 *    accepted the entry fields).
 * 4. A rescan returns ALREADY_CHECKED_IN.
 *
 * Cleanup: the temporary pass and booking are deleted from Neon. The mirrored row
 * in the live spreadsheet is left in place as evidence (the Apps Script has no
 * delete path) and its attendee name is marked as safe to delete.
 */

const prisma = new PrismaClient({ log: ['error'] });

const APP_PORT = 3065;
const APP_BASE = `http://127.0.0.1:${APP_PORT}`;
const DEVELOPER_LOGIN = 'developer';

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

async function main() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — LIVE QR ENTRY VERIFICATION (deployed config)');
  console.log('================================================================\n');

  const endpoint = process.env.BOOKING_SHEETS_ENDPOINT;
  assert.ok(endpoint && endpoint.includes('script.google.com'), 'live Apps Script endpoint must be configured');
  assert.equal(
    process.env.ALLOW_LIVE_SHEETS_WRITE_TEST,
    '1',
    'this suite writes a real spreadsheet row; re-run with ALLOW_LIVE_SHEETS_WRITE_TEST=1 and delete the row afterwards'
  );

  // ---- 1. Deployed Apps Script schema ---------------------------------
  const probe = await fetch(endpoint, { method: 'GET' });
  const probeJson = await probe.json();
  console.log(`  ✓ Live Apps Script reachable: sheetStatus=${probeJson.sheetStatus}, sheetName=${probeJson.sheetName}`);
  assert.equal(probeJson.schemaColumns, 14, 'deployed Apps Script must expose the 14-column schema');
  console.log('  ✓ Deployed schema is 14 columns (A–N)');

  // ---- 2. Hidden developer account ------------------------------------
  const developer = await prisma.organiser.findUnique({ where: { loginId: DEVELOPER_LOGIN } });
  assert.ok(developer, `developer account "${DEVELOPER_LOGIN}" must exist`);
  assert.equal(developer.hidden, true, 'developer account must be flagged hidden');
  assert.equal(developer.active, true, 'developer account must be active');

  const developerPassword = process.env.DEVELOPER_ORGANISER_PASSWORD;
  assert.ok(developerPassword, 'DEVELOPER_ORGANISER_PASSWORD must be provided for this run (read from the credential file)');

  const appProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(APP_PORT)], {
    env: {
      ...process.env,
      ...OPEN_BOOKING_WINDOW_ENV,
      PORT: String(APP_PORT),
      NODE_ENV: 'production',
    },
    stdio: 'pipe',
  });
  appProc.stdout.on('data', () => {});
  appProc.stderr.on('data', () => {});

  let testPass = null;
  let booking = null;

  try {
    await waitForServer(APP_BASE);

    const loginRes = await fetch(`${APP_BASE}/api/organiser/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: APP_BASE },
      body: JSON.stringify({ loginId: DEVELOPER_LOGIN, password: developerPassword }),
    });
    const loginBody = await loginRes.json();
    assert.equal(loginRes.status, 200, `developer sign-in must succeed (got ${loginRes.status})`);
    assert.equal(loginBody.organiser.role, 'ADMIN');
    const developerCookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];
    console.log('  ✓ Hidden developer account signs in successfully (ADMIN)');

    const listRes = await fetch(`${APP_BASE}/api/organiser/admin/organisers`, {
      headers: { Cookie: developerCookie },
    });
    const listBody = await listRes.json();
    assert.equal(listRes.status, 200);
    assert.ok(
      !listBody.organisers.some((o) => o.loginId === DEVELOPER_LOGIN),
      'hidden developer account must NOT appear in the organiser admin listing'
    );
    console.log(`  ✓ Admin listing returns ${listBody.organisers.length} visible organiser(s); developer account is hidden`);

    const panelAction = await fetch(`${APP_BASE}/api/organiser/admin/organisers`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Origin: APP_BASE, Cookie: developerCookie },
      body: JSON.stringify({ loginId: DEVELOPER_LOGIN, action: 'deactivate' }),
    });
    assert.equal(panelAction.status, 404, 'hidden account must not be manageable from the panel');
    console.log('  ✓ Panel cannot see or modify the hidden account (PATCH → 404)');

    // ---- 3. QR verify + confirm with the live Sheets mirror ------------
    testPass = await prisma.pass.create({
      data: {
        passType: `live-qr-${Date.now()}`,
        name: 'Live QR Verification Tier',
        price: 999,
        totalQuantity: 2,
        reservedQuantity: 0,
        soldQuantity: 1,
        isActive: true,
      },
    });

    booking = await prisma.booking.create({
      data: {
        publicId: `RU26-REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: 'TEST — QR live verification (safe to delete this row)',
        phone: '+91 99315 03993',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        confirmedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        source: 'live-qr-verification',
      },
    });

    const token = createEntryQrToken(booking.publicId);

    const verifyRes = await fetch(`${APP_BASE}/api/entry/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: developerCookie },
      body: JSON.stringify({ qrToken: token }),
    });
    const verifyBody = await verifyRes.json();
    assert.equal(verifyBody.valid, true, 'QR must verify');
    assert.equal(verifyBody.booking.bookingId, booking.publicId);
    console.log(`  ✓ QR verify → VALID (${booking.publicId}, read-only)`);

    const confirmRes = await fetch(`${APP_BASE}/api/entry/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: APP_BASE, Cookie: developerCookie },
      body: JSON.stringify({ qrToken: token }),
    });
    const confirmBody = await confirmRes.json();
    assert.equal(confirmBody.success, true, 'entry confirmation must succeed');
    assert.equal(confirmBody.result, 'ENTRY_CONFIRMED');
    assert.match(confirmBody.booking.scannedBy, /^DEV-GATE \/ /);
    console.log(`  ✓ CONFIRM ENTRY → ENTRY_CONFIRMED at ${confirmBody.booking.checkedInAt} by ${confirmBody.booking.scannedBy}`);

    const dbBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
    assert.equal(dbBooking.checkInStatus, 'CHECKED_IN');
    assert.ok(dbBooking.checkedInAt);
    assert.equal(dbBooking.checkedInById, developer.id);
    assert.equal(
      dbBooking.sheetSyncStatus,
      'SYNCED',
      `live Sheets mirror must report SYNCED (got ${dbBooking.sheetSyncStatus}: ${dbBooking.sheetLastError || 'no error recorded'})`
    );
    assert.ok(dbBooking.sheetSyncedAt, 'sheetSyncedAt must be stamped');
    console.log('  ✓ Neon CHECKED_IN and the LIVE Sheets mirror reported SYNCED (14-column write accepted)');

    const rescan = await fetch(`${APP_BASE}/api/entry/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: developerCookie },
      body: JSON.stringify({ qrToken: token }),
    });
    const rescanBody = await rescan.json();
    assert.equal(rescanBody.valid, false);
    assert.equal(rescanBody.reason, 'ALREADY_CHECKED_IN');
    console.log('  ✓ Rescan → ALREADY_CHECKED_IN (single admission enforced)');
  } finally {
    appProc.kill('SIGTERM');
    if (booking) await prisma.booking.deleteMany({ where: { id: booking.id } });
    if (testPass) {
      await prisma.booking.deleteMany({ where: { passId: testPass.id } });
      await prisma.pass.delete({ where: { id: testPass.id } });
    }
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log('✓ LIVE QR ENTRY VERIFICATION PASSED');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('\n✗ LIVE QR VERIFICATION FAILED');
  console.error(err);
  process.exit(1);
});
