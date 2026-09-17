import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { OPEN_BOOKING_WINDOW_ENV } from './helpers/booking-window-env.mjs';
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

function verifyLookupSessionToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, bookingIds: [] };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, bookingIds: [] };
  }

  const [serialized, signature] = parts;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', getSessionSecret())
      .update(serialized)
      .digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return { valid: false, bookingIds: [] };
    }

    const payload = JSON.parse(
      Buffer.from(serialized, 'base64url').toString('utf8')
    );

    if (typeof payload.expiresAt !== 'number' || Date.now() > payload.expiresAt) {
      return { valid: false, bookingIds: [] };
    }

    if (!Array.isArray(payload.bookingIds)) {
      return { valid: false, bookingIds: [] };
    }

    return { valid: true, bookingIds: payload.bookingIds };
  } catch {
    return { valid: false, bookingIds: [] };
  }
}

const PORT = 3031;
const BASE_URL = `http://127.0.0.1:${PORT}`;

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

async function runTests() {
  console.log('🚀 STARTING PHASE 3 AUTOMATED LIFECYCLE & SECURITY TEST SUITE\n');

  // =========================================================================
  // SUITE 1: CRYPTOGRAPHIC SESSION TOKEN & TAMPER RESISTANCE
  // =========================================================================
  console.log('--- SUITE 1: Session Security & Tamper Resistance ---');
  {
    const authorizedIds = ['RU26-REQ-1001', 'RU26-REQ-1002'];
    const token = createLookupSessionToken(authorizedIds);
    assert.ok(token, 'Session token should be generated');

    // 1. Valid token verification
    const verified = verifyLookupSessionToken(token);
    assert.equal(verified.valid, true, 'Valid token should be verified');
    assert.deepEqual(verified.bookingIds, authorizedIds, 'Authorized IDs must match');

    // 2. Tampered payload rejection
    const [payload, sig] = token.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sessionKey: 'fake', bookingIds: ['RU26-REQ-9999'], expiresAt: Date.now() + 100000 })
    ).toString('base64url');
    const tamperedToken = `${tamperedPayload}.${sig}`;
    const tamperedVerified = verifyLookupSessionToken(tamperedToken);
    assert.equal(tamperedVerified.valid, false, 'Tampered token must be rejected');

    // 3. Expired token rejection
    const expiredPayload = Buffer.from(
      JSON.stringify({ sessionKey: 'old', bookingIds: authorizedIds, expiresAt: Date.now() - 1000 })
    ).toString('base64url');
    const expiredSig = crypto
      .createHmac('sha256', crypto.createHash('sha256').update(process.env.SESSION_SECRET || process.env.DATABASE_URL || 'ru26-default-dev-secret-salt-3981').digest('hex'))
      .update(expiredPayload)
      .digest('base64url');
    const expiredToken = `${expiredPayload}.${expiredSig}`;
    const expiredVerified = verifyLookupSessionToken(expiredToken);
    assert.equal(expiredVerified.valid, false, 'Expired session token must be rejected');

    console.log('  ✓ Valid session token verified successfully');
    console.log('  ✓ Tampered session signature rejected');
    console.log('  ✓ Expired session token rejected');
  }

  // =========================================================================
  // SUITE 2: NEXT.JS SERVER INTEGRATION TESTS
  // =========================================================================
  console.log('\n--- SUITE 2: HTTP Route Integration Tests ---');
  const serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
    stdio: 'pipe',
    env: {
      ...process.env,
      ...OPEN_BOOKING_WINDOW_ENV,
      CRON_SECRET: 'test-cron-secret-3981',
    },
  });

  serverProc.stderr.on('data', (d) => console.error(String(d)));

  try {
    await waitForServer(`${BASE_URL}/`, 15000);
    console.log('  ✓ Next.js server listening on port 3031');

    // 1. Validation: Lookup requires BOTH email and phone
    console.log('\n--- TEST 2.1: Lookup Credential Enforcement ---');
    {
      // A. Phone only (missing email)
      const phoneOnlyRes = await fetch(`${BASE_URL}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+91 99315 03960' }),
      });
      assert.equal(phoneOnlyRes.status, 400, 'Lookup without email must return 400');
      const phoneOnlyData = await phoneOnlyRes.json();
      assert.match(phoneOnlyData.error, /email/i);

      // B. Email only (missing phone)
      const emailOnlyRes = await fetch(`${BASE_URL}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'priya@example.com' }),
      });
      assert.equal(emailOnlyRes.status, 400, 'Lookup without phone must return 400');
      const emailOnlyData = await emailOnlyRes.json();
      assert.match(emailOnlyData.error, /mobile|phone/i);

      // C. Booking ID alone to lookup
      const idOnlyRes = await fetch(`${BASE_URL}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: 'RU26-REQ-1234' }),
      });
      assert.equal(idOnlyRes.status, 400, 'Booking ID alone to lookup must return 400');

      console.log('  ✓ Phone-only lookup rejected with 400');
      console.log('  ✓ Email-only lookup rejected with 400');
      console.log('  ✓ Booking-ID-only lookup rejected with 400');
    }

    // 2. Key-recovery endpoint is retired
    console.log('\n--- TEST 2.2: Key Recovery Endpoint Retired ---');
    {
      const res = await fetch(`${BASE_URL}/api/bookings/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: 'RU26-REQ-4819', recoveryToken: 'anything' }),
      });
      assert.ok(res.status === 404 || res.status === 405, `retired recover endpoint must not process requests (got ${res.status})`);
      console.log('  ✓ /api/bookings/recover no longer exists');
    }

    // 3. GET /api/bookings/[id] Authorization Guard
    console.log('\n--- TEST 2.3: Booking Detail Authorization Guard ---');
    {
      // A. Public ID alone without cookie
      const unauthRes = await fetch(`${BASE_URL}/api/bookings/RU26-REQ-1001`);
      assert.equal(unauthRes.status, 401, 'Detail request without session must return 401');
      const unauthData = await unauthRes.json();
      assert.match(unauthData.error, /unauthorized|lookup session required/i);

      // B. Public ID with session that does NOT authorize that booking ID
      const otherToken = createLookupSessionToken(['RU26-REQ-2002']);
      const forbiddenRes = await fetch(`${BASE_URL}/api/bookings/RU26-REQ-1001`, {
        headers: {
          Cookie: `${LOOKUP_SESSION_COOKIE_NAME}=${otherToken}`,
        },
      });
      assert.equal(forbiddenRes.status, 403, 'Unrelated booking request must return 403');
      const forbiddenData = await forbiddenRes.json();
      assert.match(forbiddenData.error, /forbidden|permission/i);

      console.log('  ✓ Public ID alone cannot retrieve booking details (401 Unauthorized)');
      console.log('  ✓ Accessing unauthorized booking returns 403 Forbidden');
    }

    // 4. Session Clear Endpoint
    console.log('\n--- TEST 2.4: Session Clear Endpoint ---');
    {
      const clearRes = await fetch(`${BASE_URL}/api/bookings/lookup/clear`, {
        method: 'POST',
      });
      assert.equal(clearRes.status, 200, 'Clear endpoint should return 200');
      const setCookieHeader = clearRes.headers.get('set-cookie') || '';
      assert.match(setCookieHeader, new RegExp(LOOKUP_SESSION_COOKIE_NAME));
      assert.match(setCookieHeader, /Max-Age=0/i);
      console.log('  ✓ Session clear endpoint revokes session cookie with Max-Age=0');
    }

    // 5. Maintenance Endpoint CRON_SECRET Protection
    console.log('\n--- TEST 2.5: Maintenance Endpoint Security ---');
    {
      // Unauthenticated
      const noAuthRes = await fetch(`${BASE_URL}/api/bookings/expire-stale`, {
        method: 'POST',
      });
      assert.equal(noAuthRes.status, 401, 'Maintenance request without secret must return 401');

      // Wrong secret
      const wrongAuthRes = await fetch(`${BASE_URL}/api/bookings/expire-stale`, {
        method: 'POST',
        headers: { Authorization: 'Bearer wrong-secret' },
      });
      assert.equal(wrongAuthRes.status, 401, 'Maintenance request with wrong secret must return 401');

      console.log('  ✓ Maintenance endpoint rejects unauthenticated requests with 401');
      console.log('  ✓ Maintenance endpoint rejects invalid secrets with 401');
    }

    // 6. Booking Creation Endpoint Validation & Spam Protection
    console.log('\n--- TEST 2.6: Booking Creation Validation & Anti-Spam ---');
    {
      // A. Spam Honeypot check
      const honeypotRes = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Bot User',
          phone: '+91 99315 03960',
          passId: 'solo-female',
          quantity: 1,
          hp_company_field: 'Spam Corp',
        }),
      });
      assert.equal(honeypotRes.status, 400, 'Honeypot submission must return HTTP 400');
      const honeypotData = await honeypotRes.json();
      assert.match(honeypotData.error, /anti-spam/i);

      // B. Missing attendee name
      const noNameRes = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+91 99315 03960',
          passId: 'solo-female',
          quantity: 1,
        }),
      });
      assert.equal(noNameRes.status, 400, 'Missing name must return HTTP 400');
      const noNameData = await noNameRes.json();
      assert.match(noNameData.error, /full name/i);

      // C. Invalid phone
      const badPhoneRes = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Priya Sharma',
          phone: '12345',
          passId: 'solo-female',
          quantity: 1,
        }),
      });
      assert.equal(badPhoneRes.status, 400, 'Invalid phone must return HTTP 400');
      const badPhoneData = await badPhoneRes.json();
      assert.match(badPhoneData.error, /mobile number/i);

      console.log('  ✓ Honeypot spam submission rejected (HTTP 400)');
      console.log('  ✓ Missing attendee name rejected (HTTP 400)');
      console.log('  ✓ Invalid phone format rejected (HTTP 400)');
    }

  } finally {
    serverProc.kill('SIGTERM');
  }

  console.log('\n🎉 ALL PHASE 3 AUTOMATED TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
