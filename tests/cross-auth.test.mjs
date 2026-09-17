import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { OPEN_BOOKING_WINDOW_ENV } from './helpers/booking-window-env.mjs';
import { hashCredential } from '../lib/organiser-credentials.ts';

const prisma = new PrismaClient({ log: ['error'] });

const PORT = 3062;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ORIGIN = BASE_URL;

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
  console.log('RAAS UTSAV 2026 — CROSS-AUTH & ROLE ENFORCEMENT TEST SUITE');
  console.log('================================================================\n');

  const serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
    env: { ...process.env, ...OPEN_BOOKING_WINDOW_ENV, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'pipe',
  });
  serverProc.stdout.on('data', () => {});
  serverProc.stderr.on('data', () => {});

  const createdOrganiserIds = new Set();
  const createdBookingIds = new Set();
  let testPass = null;

  const makeOrganiser = async (name, role, gateId, password = 'CrossAuth#2026') => {
    const loginId = `cross-auth-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    const organiser = await prisma.organiser.create({
      data: { name, loginId, credentialHash: await hashCredential(password), role, gateId, active: true },
    });
    createdOrganiserIds.add(organiser.id);
    return { organiser, loginId, password };
  };

  const login = async (loginId, password) => {
    const res = await fetch(`${BASE_URL}/api/organiser/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({ loginId, password }),
    });
    assert.equal(res.status, 200, 'fixture organiser login must succeed');
    return (res.headers.get('set-cookie') || '').split(';')[0];
  };

  try {
    await waitForServer(BASE_URL);
    console.log('  ✓ Production server ready\n');

    testPass = await prisma.pass.create({
      data: {
        passType: `cross-auth-${Date.now()}`,
        name: 'Cross Auth Tier',
        price: 800,
        totalQuantity: 5,
        reservedQuantity: 0,
        soldQuantity: 0,
        isActive: true,
      },
    });

    const scanner = await makeOrganiser('Scanner Person', 'ENTRY_SCANNER', 'GATE-06');
    const admin = await makeOrganiser('Admin Person', 'ADMIN', 'MAIN-GATE');

    // --- 1. Unauthenticated protected pages redirect --------------------
    {
      const res = await fetch(`${BASE_URL}/organiser/scan`, { redirect: 'manual' });
      assert.equal(res.status, 307, 'unauthenticated protected page must redirect');
      assert.match(res.headers.get('location') || '', /\/organiser\/login/);
      console.log('  ✓ TEST 1: unauthenticated /organiser/scan redirects to the login page');
    }

    // --- 2. Role enforcement on the admin surface -----------------------
    {
      const scannerCookie = await login(scanner.loginId, scanner.password);

      const pageRes = await fetch(`${BASE_URL}/organiser/admin`, {
        headers: { Cookie: scannerCookie },
      });
      const html = await pageRes.text();
      assert.equal(pageRes.status, 200);
      assert.match(html, /Not permitted/i, 'ENTRY_SCANNER must not receive the admin panel UI');

      const apiRes = await fetch(`${BASE_URL}/api/organiser/admin/organisers`, {
        headers: { Cookie: scannerCookie },
      });
      assert.equal(apiRes.status, 403, 'ENTRY_SCANNER must be rejected by the admin API');
      assert.equal((await apiRes.json()).code, 'FORBIDDEN');

      const createAsScanner = await fetch(`${BASE_URL}/api/organiser/admin/organisers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: scannerCookie },
        body: JSON.stringify({
          name: 'Escalation Attempt',
          loginId: 'escalation-attempt',
          role: 'ADMIN',
          gateId: 'GATE-99',
          password: 'Escalate#2026',
        }),
      });
      assert.equal(createAsScanner.status, 403, 'ENTRY_SCANNER cannot create organisers');
      console.log('  ✓ TEST 2: ENTRY_SCANNER blocked from admin UI and admin API (403)');
    }

    // --- 3. ADMIN can manage organisers; hashes never exposed -----------
    {
      const adminCookie = await login(admin.loginId, admin.password);

      const listRes = await fetch(`${BASE_URL}/api/organiser/admin/organisers`, {
        headers: { Cookie: adminCookie },
      });
      assert.equal(listRes.status, 200);
      const listBody = await listRes.json();
      assert.ok(Array.isArray(listBody.organisers));
      assert.ok(!JSON.stringify(listBody).toLowerCase().includes('scrypt'), 'credential hashes must never be returned');

      const newLoginId = `admin-created-${Date.now()}`;
      const createRes = await fetch(`${BASE_URL}/api/organiser/admin/organisers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: adminCookie },
        body: JSON.stringify({
          name: 'Admin Created Scanner',
          loginId: newLoginId,
          role: 'ENTRY_SCANNER',
          gateId: 'GATE-07',
          password: 'CreatedByAdmin#2026',
        }),
      });
      const createBody = await createRes.json();
      assert.equal(createRes.status, 201, `ADMIN create must succeed (got ${createRes.status})`);
      assert.equal(createBody.organiser.loginId, newLoginId);
      createdOrganiserIds.add(
        (await prisma.organiser.findUnique({ where: { loginId: newLoginId } })).id
      );

      const newCookie = await login(newLoginId, 'CreatedByAdmin#2026');
      const deactivateRes = await fetch(`${BASE_URL}/api/organiser/admin/organisers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: adminCookie },
        body: JSON.stringify({ loginId: newLoginId, action: 'deactivate' }),
      });
      assert.equal(deactivateRes.status, 200);

      const afterDeactivate = await fetch(`${BASE_URL}/api/organiser/session`, {
        headers: { Cookie: newCookie },
      });
      assert.equal(afterDeactivate.status, 401, 'deactivation must invalidate the created organiser session');
      console.log('  ✓ TEST 3: ADMIN manages organisers end-to-end; hashes never exposed; deactivation kills sessions');
    }

    // --- 4. Organiser signed in can still act as an ordinary customer ---
    {
      const scannerCookie = await login(scanner.loginId, scanner.password);

      const createRes = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: scannerCookie },
        body: JSON.stringify({
          passId: testPass.passType,
          fullName: 'Organiser As Customer',
          email: 'organiser.as.customer@suitetest.example',
          phone: '9931503999',
        }),
      });
      const createBody = await createRes.json();
      assert.equal(createRes.status, 201, 'public booking creation must work while an organiser session is present');
      const publicId = createBody.bookingId;

      const dbBooking = await prisma.booking.findUnique({ where: { publicId } });
      createdBookingIds.add(dbBooking.id);

      const organiserOnly = await fetch(`${BASE_URL}/api/bookings/${publicId}`, {
        headers: { Cookie: scannerCookie },
      });
      assert.equal(organiserOnly.status, 401, 'organiser session must not authorize customer booking reads');

      const customerCookie = (createRes.headers.get('set-cookie') || '').match(
        /ru26_lookup_session=[^;]+/
      );
      assert.ok(customerCookie, 'booking creation must issue a customer lookup session');

      const customerRead = await fetch(`${BASE_URL}/api/bookings/${publicId}`, {
        headers: { Cookie: customerCookie[0] },
      });
      assert.equal(customerRead.status, 200, 'the customer session issued by creation must authorize the read');
      console.log('  ✓ TEST 4: organiser can use the public booking flow; no privilege leakage either way');
    }

    console.log('\n✓ CROSS-AUTH SUITE PASSED\n');
  } finally {
    serverProc.kill('SIGTERM');

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

  console.log('================================================================');
  console.log('✓ ALL CROSS-AUTH TESTS PASSED');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('\n✗ CROSS-AUTH SUITE FAILED');
  console.error(err);
  process.exit(1);
});
