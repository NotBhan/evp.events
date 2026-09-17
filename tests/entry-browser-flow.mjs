import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { PrismaClient } from '@prisma/client';
import { OPEN_BOOKING_WINDOW_ENV } from './helpers/booking-window-env.mjs';
import { hashCredential } from '../lib/organiser-credentials.ts';
import { createEntryQrToken } from '../lib/entry-token.ts';

const prisma = new PrismaClient({ log: ['error'] });

const APP_PORT = 3060;
const APP_BASE = `http://127.0.0.1:${APP_PORT}`;
const SHEETS_MOCK_PORT = 3998;
const SHEETS_MOCK_URL = `http://127.0.0.1:${SHEETS_MOCK_PORT}/exec`;
const LOOKUP_COOKIE_NAME = 'ru26_lookup_session';
const CHROMIUM = '/usr/bin/chromium';
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'raas-entry-e2e-'));

class SheetsMock {
  constructor(port) {
    this.rows = [];
    this.server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const bookingId = data.bookingId || data.publicId;
          const row = {
            bookingId,
            entryTaken: data.entryTaken || 'NO',
            entryTime: data.entryTime || '',
            scannedBy: data.scannedBy || '',
            submissionStatus: data.submissionStatus || 'CONFIRMED',
          };
          const idx = this.rows.findIndex((r) => r.bookingId === bookingId);
          if (idx >= 0) this.rows[idx] = row;
          else this.rows.push(row);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'success', action: idx >= 0 ? 'updated' : 'inserted', bookingId }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', message: String(err) }));
        }
      });
    });
    this.port = port;
  }
  start() {
    return new Promise((resolve) => this.server.listen(this.port, resolve));
  }
  stop() {
    return new Promise((resolve) => this.server.close(resolve));
  }
  rowFor(bookingId) {
    return this.rows.find((r) => r.bookingId === bookingId) || null;
  }
}

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
  console.log('RAAS UTSAV 2026 — ENTRY BROWSER E2E (real UI + fake camera)');
  console.log('================================================================\n');

  const sheetsMock = new SheetsMock(SHEETS_MOCK_PORT);
  await sheetsMock.start();

  let appProc = null;
  const createdBookingIds = [];
  const createdOrganiserIds = [];
  let testPass = null;
  let organiserLoginId = null;
  const organiserPassword = 'BrowserE2E#2026';
  let publicId = null;

  try {
    appProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(APP_PORT)], {
      env: {
        ...process.env,
        ...OPEN_BOOKING_WINDOW_ENV,
        PORT: String(APP_PORT),
        NODE_ENV: 'production',
        BOOKING_SHEETS_ENDPOINT: SHEETS_MOCK_URL,
      },
      stdio: 'pipe',
    });
    appProc.stdout.on('data', () => {});
    appProc.stderr.on('data', () => {});

    await waitForServer(APP_BASE);
    console.log('  ✓ Production server ready (Sheets pointed at a local 14-column mock)\n');

    // ---------------- Fixtures ----------------
    testPass = await prisma.pass.create({
      data: {
        passType: `browser-e2e-${Date.now()}`,
        name: 'Browser E2E Tier',
        price: 1100,
        totalQuantity: 10,
        reservedQuantity: 0,
        soldQuantity: 1,
        isActive: true,
      },
    });

    const organiser = await prisma.organiser.create({
      data: {
        name: 'Browser Gate Organiser',
        loginId: `browser-e2e-${Date.now()}`,
        credentialHash: await hashCredential(organiserPassword),
        role: 'ENTRY_SCANNER',
        gateId: 'GATE-05',
        active: true,
      },
    });
    createdOrganiserIds.push(organiser.id);
    organiserLoginId = organiser.loginId;

    const booking = await prisma.booking.create({
      data: {
        publicId: `RU26-REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: 'Browser E2E Attendee',
        phone: '+91 99315 03995',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        confirmedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        source: 'browser-e2e',
      },
    });
    createdBookingIds.push(booking.id);
    publicId = booking.publicId;

    // ---------------- 1. Receipt shows a single active QR ----------------
    console.log('--- 1. Customer receipt renders exactly one entry QR ---');
    const customerBrowser = await puppeteer.launch({
      executablePath: CHROMIUM,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
    });

    let qrPngPath = null;
    try {
      const page = await customerBrowser.newPage();
      await page.setCookie({
        name: LOOKUP_COOKIE_NAME,
        value: lookupSessionTokenFor(publicId),
        domain: '127.0.0.1',
        path: '/',
      });
      await page.goto(`${APP_BASE}/booking?bookingId=${encodeURIComponent(publicId)}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await page.waitForSelector('#receipt-entry-qr', { timeout: 20000 });

      const qrCount = await page.$$eval('#receipt-entry-qr svg', (els) => els.length);
      assert.equal(qrCount, 1, 'exactly one entry QR must be rendered');
      const noteText = await page.$eval('#receipt-entry-qr', (el) => el.textContent || '');
      assert.match(noteText, /Present this QR code at the event entrance/i);

      const svgHandle = await page.$('#receipt-entry-qr svg');
      qrPngPath = path.join(TMP_DIR, 'entry-qr.png');
      await svgHandle.screenshot({ path: qrPngPath });
      console.log('  ✓ Receipt renders exactly one entry QR with the entrance notice');
    } finally {
      await customerBrowser.close();
    }

    // ---------------- 2. Build a fake-camera video from the QR ----------
    console.log('\n--- 2. Fake camera video from the receipt QR ---');
    const y4mPath = path.join(TMP_DIR, 'entry-qr.y4m');
    execFileSync('ffmpeg', [
      '-y',
      '-loop', '1',
      '-i', qrPngPath,
      '-t', '3',
      '-r', '10',
      // QR at ~67% of the frame so it comfortably fills the scanner's adaptive
      // scan box (70%) — a smaller QR makes decoding marginal and flaky.
      '-vf', 'scale=320:320:flags=neighbor,pad=480:480:(ow-iw)/2:(oh-ih)/2:white',
      '-pix_fmt', 'yuv420p',
      y4mPath,
    ]);
    assert.ok(fs.existsSync(y4mPath), 'y4m fixture must be created');
    console.log('  ✓ Generated Y4M fake-camera feed from the rendered QR\n');

    // ---------------- 3. Organiser scanner: scan → confirm → rescan ----
    console.log('--- 3. Organiser scanner flow (login → scan → confirm → rescan) ---');
    const scannerBrowser = await puppeteer.launch({
      executablePath: CHROMIUM,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1280,900',
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        `--use-file-for-fake-video-capture=${y4mPath}`,
        '--autoplay-policy=no-user-gesture-required',
      ],
    });

    try {
      const page = await scannerBrowser.newPage();
      await page.setViewport({ width: 412, height: 915 }); // mobile-sized gate device

      const verifyRequests = [];
      const confirmRequests = [];
      page.on('request', (req) => {
        if (req.url().includes('/api/entry/verify')) verifyRequests.push(Date.now());
        if (req.url().includes('/api/entry/confirm')) confirmRequests.push(Date.now());
      });

      // Unauthenticated access must redirect to the login page.
      await page.goto(`${APP_BASE}/organiser/scan`, { waitUntil: 'networkidle2', timeout: 30000 });
      assert.ok(page.url().includes('/organiser/login'), 'unauthenticated scanner access must redirect to login');
      console.log('  ✓ Unauthenticated /organiser/scan redirects to the login page');

      await page.waitForSelector('#organiser-login-id', { timeout: 15000 });
      await page.type('#organiser-login-id', organiserLoginId);
      await page.type('#organiser-password', organiserPassword);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
        page.click('#organiser-login-submit'),
      ]);
      await page.waitForFunction(() => location.pathname.startsWith('/organiser'), { timeout: 30000 });
      console.log('  ✓ Organiser signed in through the real login form');

      await page.goto(`${APP_BASE}/organiser/scan`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(
        () => document.querySelector('#verify-result') !== null,
        { timeout: 45000, polling: 500 }
      );

      const firstResult = await page.$eval('#verify-result', (el) => el.getAttribute('data-result'));
      assert.equal(firstResult, 'VALID', `scanner must verify the fake-camera QR (got ${firstResult})`);
      const shownBookingId = await page.$eval('#verify-booking-id', (el) => el.textContent.trim());
      assert.equal(shownBookingId, publicId);
      assert.equal(verifyRequests.length, 1, 'a continuously visible QR must not trigger duplicate verify calls');
      console.log('  ✓ VALID pass displayed with booking details (single verify call — no duplicate callbacks)');

      // Confirm entry
      await page.click('#confirm-entry-btn');
      await page.waitForFunction(
        () => document.querySelector('#verify-result')?.getAttribute('data-result') === 'CONFIRMED',
        { timeout: 30000, polling: 500 }
      );
      const scannedBy = await page.$eval('#confirmed-scanned-by', (el) => el.textContent.trim());
      assert.match(scannedBy, /GATE-05 \/ Browser Gate Organiser/);
      console.log('  ✓ CONFIRM ENTRY → ENTRY CONFIRMED with server-derived organiser identity');

      const dbAfter = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert.equal(dbAfter.checkInStatus, 'CHECKED_IN');
      assert.ok(dbAfter.checkedInAt);
      assert.equal(dbAfter.checkedInById, organiser.id);

      const sheetRow = sheetsMock.rowFor(publicId);
      assert.ok(sheetRow, 'check-in must mirror to the Sheets mock');
      assert.equal(sheetRow.entryTaken, 'YES');
      assert.ok(sheetRow.entryTime, 'Entry Time must be mirrored');
      assert.match(sheetRow.scannedBy, /GATE-05 \/ Browser Gate Organiser/);
      console.log('  ✓ Neon CHECKED_IN and Sheets mirror Entry Taken=YES + time + organiser identity');

      // Scan-next must be a large button detached from the pass details, anchored
      // to the bottom of the screen so it stays thumb-reachable at the gate.
      const scanNextLayout = await page.evaluate(() => {
        const btn = document.querySelector('#scan-next-btn');
        const result = document.querySelector('#verify-result');
        if (!btn || !result) return null;
        const r = btn.getBoundingClientRect();
        return {
          insideResultCard: result.contains(btn),
          bottom: Math.round(r.bottom),
          top: Math.round(r.top),
          width: Math.round(r.width),
          viewportH: window.innerHeight,
          viewportW: window.innerWidth,
        };
      });
      assert.ok(scanNextLayout, 'scan-next button must exist in the confirmed state');
      assert.equal(scanNextLayout.insideResultCard, false, 'scan-next must be detached from the pass details card');
      assert.ok(
        scanNextLayout.top > scanNextLayout.viewportH * 0.5,
        `scan-next must sit in the bottom half of the screen (top ${scanNextLayout.top} of ${scanNextLayout.viewportH})`
      );
      assert.ok(
        scanNextLayout.bottom <= scanNextLayout.viewportH + 1,
        'scan-next must stay inside the viewport'
      );
      assert.ok(
        scanNextLayout.width > scanNextLayout.viewportW * 0.6,
        `scan-next must be a large full-width action (width ${scanNextLayout.width} of ${scanNextLayout.viewportW})`
      );
      console.log('  ✓ Scan-next is a large bottom-anchored button, separate from the pass details');

      if (process.env.SHOT_DIR) {
        await page.screenshot({ path: `${process.env.SHOT_DIR}/scan-confirmed-mobile.png` });
      }

      // Rescan the same QR -> ALREADY_CHECKED_IN
      await page.click('#scan-next-btn');
      await page.waitForFunction(
        () => document.querySelector('#verify-result')?.getAttribute('data-reason') === 'ALREADY_CHECKED_IN',
        { timeout: 45000, polling: 500 }
      );
      const reasonText = await page.$eval('#scan-reason', (el) => el.textContent || '');
      assert.match(reasonText, /ALREADY CHECKED IN/i);
      const dbFinal = await prisma.booking.findUnique({ where: { id: booking.id } });
      assert.equal(dbFinal.checkedInById, organiser.id, 'original scanner must be preserved on rescan');
      console.log('  ✓ Rescan → ALREADY CHECKED IN with the original entry record intact');

      // Client-side navigation away must release the camera (component unmount).
      await page.click('a[href="/organiser"]');
      await page.waitForFunction(() => location.pathname === '/organiser', { timeout: 20000 });
      const videosAfterNav = await page.$$eval('video', (els) => els.length);
      assert.equal(videosAfterNav, 0, 'leaving the scanner must release/stop the camera');
      console.log('  ✓ Leaving the scanner page released the camera (no video element left)');
    } finally {
      await scannerBrowser.close();
    }

    // ---------------- 4. Camera denied → useful UI state ---------------
    console.log('\n--- 4. Camera permission denied produces a clear UI state ---');
    const deniedBrowser = await puppeteer.launch({
      executablePath: CHROMIUM,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-device-for-media-stream'],
    });
    try {
      const context = deniedBrowser.defaultBrowserContext();
      await context.overridePermissions(APP_BASE, []); // camera NOT granted

      const page = await deniedBrowser.newPage();
      await page.goto(`${APP_BASE}/organiser/login`, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('#organiser-login-id', { timeout: 15000 });
      await page.type('#organiser-login-id', organiserLoginId);
      await page.type('#organiser-password', organiserPassword);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
        page.click('#organiser-login-submit'),
      ]);
      await page.goto(`${APP_BASE}/organiser/scan`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('#camera-error', { timeout: 30000 });
      const cameraState = await page.$eval('#camera-error', (el) => el.getAttribute('data-state'));
      assert.ok(
        ['CAMERA_DENIED', 'CAMERA_UNAVAILABLE', 'UNSUPPORTED'].includes(cameraState),
        `camera failure must surface a clear state (got ${cameraState})`
      );
      console.log(`  ✓ Camera failure surfaced as ${cameraState} with a retry action`);
    } finally {
      await deniedBrowser.close();
    }

    console.log('\n================================================================');
    console.log('✓ ENTRY BROWSER E2E PASSED');
    console.log('================================================================');
  } finally {
    if (appProc) appProc.kill('SIGTERM');
    await sheetsMock.stop();

    if (createdBookingIds.length > 0) {
      await prisma.booking.deleteMany({ where: { id: { in: createdBookingIds } } });
    }
    if (testPass) {
      await prisma.booking.deleteMany({ where: { passId: testPass.id } });
      await prisma.pass.delete({ where: { id: testPass.id } });
    }
    if (createdOrganiserIds.length > 0) {
      await prisma.organiser.deleteMany({ where: { id: { in: createdOrganiserIds } } });
    }
    await prisma.$disconnect();

    try {
      fs.rmSync(TMP_DIR, { recursive: true, force: true });
    } catch {
      // temp cleanup is best-effort
    }
  }
}

main().catch((err) => {
  console.error('\n✗ ENTRY BROWSER E2E FAILED');
  console.error(err);
  process.exit(1);
});
