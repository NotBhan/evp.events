import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

const prisma = new PrismaClient({ log: ['error'] });
const PORT = 3045;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const COOKIE_NAME = 'ru26_lookup_session';
const OUT_DIR = 'scratch/diag-payment';

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.DATABASE_URL || 'ru26-default-dev-secret-salt-3981';
  return crypto.createHash('sha256').update(secret).digest('hex');
}
function makeToken(ids) {
  const payload = { sessionKey: crypto.randomBytes(16).toString('hex'), bookingIds: [...new Set(ids)], expiresAt: Date.now() + 30 * 60 * 1000 };
  const ser = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(ser).digest('base64url');
  return `${ser}.${sig}`;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('=== RECEIPT CONTENT + PRINT VERIFICATION ===\n');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pass = await prisma.pass.findFirst({ where: { isActive: true } });
  const publicId = `RU26-PRINT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const booking = await prisma.booking.create({
    data: {
      publicId, passId: pass.id, quantity: 2, unitPrice: pass.price, totalAmount: pass.price * 2,
      fullName: 'Print Test Attendee', email: 'print@example.com', phone: '+91 99315 03960',
      city: 'Ranchi', status: 'CONFIRMED', paymentStatus: 'PAID', confirmedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  let serverProc = null;
  let browser = null;
  try {
    serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production', PAYMENT_PROVIDER: 'razorpay' },
      stdio: 'pipe',
    });
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      try { const r = await fetch(`${BASE_URL}/api/bookings/lookup/clear`, { method: 'POST' }); if (r.status === 200) { ready = true; break; } } catch {}
    }
    assert(ready, 'server not ready');

    browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    await page.setCookie({ name: COOKIE_NAME, value: makeToken([publicId]), url: BASE_URL, httpOnly: true });
    await page.goto(`${BASE_URL}/booking?bookingId=${publicId}`, { waitUntil: 'networkidle2', timeout: 45000 });
    await page.waitForSelector('#booking-receipt-document', { timeout: 20000 });
    await page.waitForSelector('#print-receipt-root', { timeout: 20000 });

    // SCREEN checks
    const screenText = await page.$eval('#booking-receipt-document', (el) => el.innerText);
    console.log('SCREEN RECEIPT TEXT (first 600):\n' + screenText.slice(0, 600));
    const screenStatus = await page.evaluate(() => {
      const el = document.querySelector('#booking-receipt-document [class*="border"]');
      return null;
    });
    for (const kw of ['Retrieve Your Receipt', 'Cancellation', 'Refund Request', '6 October 2026', 'Find / Recover Reservation', 'Cancel Booking', 'Key Recovery']) {
      assert.ok(screenText.includes(kw), `screen receipt missing: ${kw}`);
    }
    const screenPrintRootDisplay = await page.$eval('#print-receipt-root', (el) => getComputedStyle(el).display);
    assert.strictEqual(screenPrintRootDisplay, 'none', 'print root must be hidden on screen');
    console.log('✓ Screen receipt contains recovery/cancellation/refund instructions; print root hidden on screen');

    // PRINT checks
    await page.emulateMediaType('print');
    const printState = await page.evaluate(() => {
      const root = document.getElementById('print-receipt-root');
      const main = document.querySelector('main');
      const btn = document.querySelector('button');
      const nav = document.querySelector('nav');
      return {
        bodyBg: getComputedStyle(document.body).backgroundColor,
        rootDisplay: root ? getComputedStyle(root).display : null,
        rootBg: root ? getComputedStyle(root).backgroundColor : null,
        mainDisplay: main ? getComputedStyle(main).display : null,
        btnDisplay: btn ? getComputedStyle(btn).display : null,
        navDisplay: nav ? getComputedStyle(nav).display : null,
        printText: root ? root.innerText : '',
      };
    });
    assert.match(printState.bodyBg, /255, 255, 255|#ffffff/i, 'body must be white in print');
    assert.strictEqual(printState.rootDisplay, 'block', 'print root must be visible in print');
    assert.strictEqual(printState.mainDisplay, 'none', 'main must be hidden in print');
    assert.strictEqual(printState.btnDisplay, 'none', 'buttons must be hidden in print');
    for (const kw of ['Retrieve Your Receipt', 'Cancellation', 'Refund Request', '6 October 2026', 'Find / Recover Reservation', 'Cancel Booking', 'Key Recovery']) {
      assert.ok(printState.printText.includes(kw), `print receipt missing: ${kw}`);
    }
    console.log('✓ Print mode: white body, isolated receipt root, app chrome hidden, instructions present');

    // Visual artifacts
    const el = await page.$('#print-receipt-root');
    await el.screenshot({ path: `${OUT_DIR}/print-receipt.png` });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    fs.writeFileSync(`${OUT_DIR}/receipt.pdf`, pdf);
    console.log('✓ Captured print-receipt.png and receipt.pdf');
    console.log(`  PDF bytes: ${pdf.length}`);
  } finally {
    if (browser) await browser.close();
    if (serverProc) serverProc.kill('SIGKILL');
    await prisma.paymentAttempt.deleteMany({ where: { bookingId: booking.id } });
    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.$disconnect();
    console.log('[cleanup] test booking removed');
  }
}

main().catch(async (e) => { console.error('RECEIPT/PRINT VERIFY FAILURE:', e); await prisma.$disconnect(); process.exit(1); });
