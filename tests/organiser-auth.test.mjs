import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import {
  hashCredential,
  verifyCredential,
  validatePassword,
  normalizeLoginId,
  normalizeGateId,
  isGateIdAllowed,
} from '../lib/organiser-credentials.ts';

const prisma = new PrismaClient({ log: ['error'] });

const PORT = 3057;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ORIGIN = BASE_URL;

function organiserSessionToken({ organiserId, role, gateId, expiresAt }) {
  const secret = crypto
    .createHash('sha256')
    .update(process.env.ORGANISER_SESSION_SECRET)
    .digest('hex');
  const payload = Buffer.from(
    JSON.stringify({
      organiserId,
      role,
      gateId,
      issuedAt: Date.now() - 1000,
      expiresAt,
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
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

async function runUnitTests() {
  console.log('----------------------------------------------------------------');
  console.log('PART 1: Credential hashing / identifier normalization (unit)');
  console.log('----------------------------------------------------------------');

  const hash = await hashCredential('CorrectHorse#2026');
  assert.match(hash, /^scrypt\$16384\$8\$1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
  assert.ok(!hash.includes('CorrectHorse#2026'), 'plaintext must never appear in the hash');
  console.log('  ✓ hashCredential produces scrypt$N$r$p$salt$hash format with no plaintext');

  assert.equal(await verifyCredential('CorrectHorse#2026', hash), true);
  assert.equal(await verifyCredential('wrong-password', hash), false);
  console.log('  ✓ verifyCredential accepts the correct password and rejects a wrong one');

  const hash2 = await hashCredential('CorrectHorse#2026');
  assert.notEqual(hash, hash2, 'per-user random salt must produce distinct hashes');
  assert.equal(await verifyCredential('CorrectHorse#2026', hash2), true);
  console.log('  ✓ identical passwords produce different hashes (random salt) yet both verify');

  assert.equal(await verifyCredential('x', null), false);
  assert.equal(await verifyCredential('x', ''), false);
  assert.equal(await verifyCredential('x', 'not-a-hash'), false);
  assert.equal(await verifyCredential('x', 'scrypt$bad$params$1$aaa$bbb'), false);
  console.log('  ✓ malformed / missing stored hashes fail closed');

  assert.equal(normalizeLoginId('  Rahul.K  '), 'rahul.k');
  assert.equal(normalizeLoginId('ab'), null);
  assert.equal(normalizeLoginId('has space'), null);
  assert.equal(normalizeLoginId('x'.repeat(65)), null);
  assert.equal(normalizeLoginId(42), null);
  console.log('  ✓ normalizeLoginId trims/lowercases and rejects unsafe identifiers');

  assert.equal(normalizeGateId(' gate 01 '), 'GATE-01');
  assert.equal(normalizeGateId('main-gate'), 'MAIN-GATE');
  assert.equal(normalizeGateId('bad gate!!'), null);
  assert.equal(normalizeGateId(''), null);
  assert.equal(normalizeGateId('x'.repeat(33)), null);
  console.log('  ✓ normalizeGateId normalizes valid gates and rejects invalid ones');

  assert.equal(isGateIdAllowed('GATE-03', ''), true, 'absent allowlist permits any valid gate');
  assert.equal(isGateIdAllowed('GATE-01', 'GATE-01,GATE-02'), true);
  assert.equal(isGateIdAllowed('GATE-03', 'GATE-01,GATE-02'), false);
  console.log('  ✓ ORGANISER_GATE_IDS allowlist is optional and enforced when present');

  assert.equal(validatePassword('short'), 'Password must be at least 8 characters.');
  assert.equal(validatePassword('x'.repeat(201)), 'Password must be at most 200 characters.');
  assert.equal(validatePassword('long-enough-1'), null);
  console.log('  ✓ password policy enforces minimum length');
}

async function runHttpTests() {
  console.log('\n----------------------------------------------------------------');
  console.log('PART 2: Organiser auth HTTP flows (real server + real Neon)');
  console.log('----------------------------------------------------------------');

  const serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'pipe',
  });
  serverProc.stdout.on('data', () => {});
  serverProc.stderr.on('data', () => {});

  const createdOrganiserIds = new Set();
  const createOrganiser = async (overrides) => {
    const loginId = overrides.loginId || `auth-test-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    const organiser = await prisma.organiser.create({
      data: {
        name: overrides.name || 'Auth Test Organiser',
        loginId,
        credentialHash: await hashCredential(overrides.password || 'AuthTest#2026'),
        role: overrides.role || 'ENTRY_SCANNER',
        gateId: overrides.gateId || 'GATE-01',
        active: overrides.active ?? true,
      },
    });
    createdOrganiserIds.add(organiser.id);
    return { organiser, password: overrides.password || 'AuthTest#2026' };
  };

  const login = (loginId, password, originHeader = ORIGIN, cookieHeader) =>
    fetch(`${BASE_URL}/api/organiser/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(originHeader ? { Origin: originHeader } : {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ loginId, password }),
    });

  try {
    await waitForServer(BASE_URL);
    console.log('  ✓ Production server ready\n');

    // --- 1. Origin/CSRF protection on mutations ---------------------------
    {
      const { organiser, password } = await createOrganiser({});
      const noOrigin = await login(organiser.loginId, password, null);
      assert.equal(noOrigin.status, 403, 'Login without Origin/Referer must be rejected');
      assert.equal((await noOrigin.json()).code, 'ORIGIN_REJECTED');

      const evilOrigin = await login(organiser.loginId, password, 'https://evil.example.com');
      assert.equal(evilOrigin.status, 403, 'Cross-origin login must be rejected');
      console.log('  ✓ TEST 1: origin validation rejects missing/mismatched Origin on login');
    }

    // --- 2. Invalid credentials are generic and leak nothing ---------------
    {
      const { organiser } = await createOrganiser({});
      const bad = await login(organiser.loginId, 'definitely-wrong');
      assert.equal(bad.status, 401);
      const body = await bad.json();
      assert.equal(body.code, 'INVALID_CREDENTIALS');
      assert.ok(!JSON.stringify(body).toLowerCase().includes('scrypt'), 'no hash material in response');

      const unknown = await login('no-such-organiser', 'whatever');
      assert.equal(unknown.status, 401, 'unknown login ids receive the same generic rejection');
      console.log('  ✓ TEST 2: invalid credentials → generic 401 (no account enumeration, no hash leakage)');
    }

    // --- 3. Successful login issues an HttpOnly scoped cookie --------------
    let sessionCookie = null;
    let loggedInOrganiser = null;
    {
      const { organiser, password } = await createOrganiser({ name: 'Rahul Gate One', role: 'ENTRY_SCANNER', gateId: 'GATE-01' });
      const res = await login(organiser.loginId, password);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.organiser.name, 'Rahul Gate One');
      assert.equal(body.organiser.role, 'ENTRY_SCANNER');
      assert.equal(body.organiser.gateId, 'GATE-01');
      assert.ok(!JSON.stringify(body).toLowerCase().includes('credential'), 'no credential fields in response');

      const setCookie = res.headers.get('set-cookie') || '';
      assert.match(setCookie, /ru26_organiser_session=/);
      assert.match(setCookie, /HttpOnly/i);
      assert.match(setCookie, /SameSite=lax/i);
      assert.match(setCookie, /Path=\//);
      sessionCookie = setCookie.split(';')[0];
      loggedInOrganiser = organiser;

      const dbAfter = await prisma.organiser.findUnique({ where: { id: organiser.id } });
      assert.ok(dbAfter.lastLoginAt, 'lastLoginAt must be recorded on success');
      console.log('  ✓ TEST 3: login issues HttpOnly SameSite=Lax organiser cookie + records lastLoginAt');
    }

    // --- 4. Session endpoint returns identity only with a valid session ----
    {
      const okRes = await fetch(`${BASE_URL}/api/organiser/session`, {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(okRes.status, 200);
      const body = await okRes.json();
      assert.equal(body.organiser.name, 'Rahul Gate One');
      assert.ok(!('credentialHash' in body.organiser));

      const noCookie = await fetch(`${BASE_URL}/api/organiser/session`);
      assert.equal(noCookie.status, 401);

      const tampered = `${sessionCookie.slice(0, -2)}xx`;
      const tamperedRes = await fetch(`${BASE_URL}/api/organiser/session`, {
        headers: { Cookie: tampered },
      });
      assert.equal(tamperedRes.status, 401, 'tampered cookie must fail signature verification');

      const expired = organiserSessionToken({
        organiserId: loggedInOrganiser.id,
        role: 'ENTRY_SCANNER',
        gateId: 'GATE-01',
        expiresAt: Date.now() - 1000,
      });
      const expiredRes = await fetch(`${BASE_URL}/api/organiser/session`, {
        headers: { Cookie: `ru26_organiser_session=${expired}` },
      });
      assert.equal(expiredRes.status, 401, 'expired session token must be rejected');
      console.log('  ✓ TEST 4: session endpoint honours valid/absent/tampered/expired cookies');
    }

    // --- 5. Logout clears the session -------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/organiser/logout`, {
        method: 'POST',
        headers: { Origin: ORIGIN, Cookie: sessionCookie },
      });
      assert.equal(res.status, 200);
      const setCookie = res.headers.get('set-cookie') || '';
      assert.match(setCookie, /Max-Age=0/i, 'logout must clear the cookie');

      const after = await fetch(`${BASE_URL}/api/organiser/session`, {
        headers: { Cookie: `${sessionCookie}; ${setCookie.split(';')[0]}` },
      });
      assert.equal(after.status, 401);

      const noOrigin = await fetch(`${BASE_URL}/api/organiser/logout`, {
        method: 'POST',
        headers: { Cookie: sessionCookie },
      });
      assert.equal(noOrigin.status, 403, 'logout requires origin validation too');
      console.log('  ✓ TEST 5: logout clears cookie, requires origin validation');
    }

    // --- 6. Deactivation invalidates an existing session -------------------
    {
      const { organiser, password } = await createOrganiser({ name: 'Deactivation Race' });
      const loginRes = await login(organiser.loginId, password);
      const cookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];

      const before = await fetch(`${BASE_URL}/api/organiser/session`, { headers: { Cookie: cookie } });
      assert.equal(before.status, 200);

      await prisma.organiser.update({ where: { id: organiser.id }, data: { active: false } });

      const after = await fetch(`${BASE_URL}/api/organiser/session`, { headers: { Cookie: cookie } });
      assert.equal(after.status, 401, 'deactivated organiser session must be rejected');
      console.log('  ✓ TEST 6: deactivation invalidates an existing session on the next request');
    }

    // --- 7. Inactive account cannot log in --------------------------------
    {
      const { organiser, password } = await createOrganiser({ active: false });
      const res = await login(organiser.loginId, password);
      assert.equal(res.status, 403);
      assert.equal((await res.json()).code, 'ACCOUNT_INACTIVE');
      console.log('  ✓ TEST 7: inactive account login rejected with ACCOUNT_INACTIVE');
    }

    // --- 8. DB-backed login throttling ------------------------------------
    {
      const { organiser, password } = await createOrganiser({ name: 'Throttle Target' });
      for (let i = 0; i < 5; i++) {
        const res = await login(organiser.loginId, 'wrong-password');
        assert.equal(res.status, 401, `attempt ${i + 1} must be a normal rejection`);
      }

      const lockedRow = await prisma.organiser.findUnique({ where: { id: organiser.id } });
      assert.ok(lockedRow.lockedUntil && lockedRow.lockedUntil.getTime() > Date.now(), 'account must be locked in the DB');

      const correctAttempt = await login(organiser.loginId, password);
      assert.equal(correctAttempt.status, 429, 'locked account rejects even the correct password');
      assert.equal((await correctAttempt.json()).code, 'ACCOUNT_LOCKED');
      console.log('  ✓ TEST 8: 5 failed attempts lock the account (DB-backed), correct password rejected while locked');

      // Cleanup for this test account
      await prisma.organiser.update({
        where: { id: organiser.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // --- 9. Customer session cannot authorize organiser routes ------------
    {
      const customerLikeToken = 'aaaa.bbbb';
      const res = await fetch(`${BASE_URL}/api/organiser/session`, {
        headers: { Cookie: `ru26_lookup_session=${customerLikeToken}` },
      });
      assert.equal(res.status, 401, 'customer/lookup cookie must not authorize organiser routes');
      console.log('  ✓ TEST 9: customer lookup session cannot authorize organiser endpoints');
    }

    // --- 10. Organiser session cannot authorize customer booking reads -----
    {
      const { organiser, password } = await createOrganiser({});
      const loginRes = await login(organiser.loginId, password);
      const cookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];

      const res = await fetch(`${BASE_URL}/api/bookings/RU26-REQ-1001`, {
        headers: { Cookie: cookie },
      });
      assert.equal(res.status, 401, 'organiser session must not authorize customer booking routes');
      console.log('  ✓ TEST 10: organiser session cannot authorize customer booking endpoints');
    }

    console.log('\n✓ ORGANISER AUTH SUITE PASSED\n');
  } finally {
    serverProc.kill('SIGTERM');

    if (createdOrganiserIds.size > 0) {
      await prisma.organiser.deleteMany({ where: { id: { in: Array.from(createdOrganiserIds) } } });
    }
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — ORGANISER AUTHENTICATION TEST SUITE');
  console.log('================================================================\n');

  await runUnitTests();
  await runHttpTests();

  console.log('================================================================');
  console.log('✓ ALL ORGANISER AUTH TESTS PASSED');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('\n✗ ORGANISER AUTH SUITE FAILED');
  console.error(err);
  process.exit(1);
});
