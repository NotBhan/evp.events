import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { PrismaClient } from '@prisma/client';
import { OPEN_BOOKING_WINDOW_ENV } from './helpers/booking-window-env.mjs';
import { createEntryQrToken, verifyEntryQrToken } from '../lib/entry-token.ts';

/**
 * Print-QR validation: renders the real print receipt to a PDF (A4, Chrome print
 * engine), rasterizes the pages at print resolution and DECODES the QR with a real
 * QR decoder (zbarimg). This validates that the printed QR actually scans — not
 * merely that some CSS pixel size was applied.
 */

const prisma = new PrismaClient({ log: ['error'] });
const APP_PORT = 3064;
const APP_BASE = `http://127.0.0.1:${APP_PORT}`;
const CHROMIUM = '/usr/bin/chromium';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'raas-print-qr-'));

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
      if (res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('server not ready');
}

function decodeQrFromPdf(pdfPath, dpi, outPrefix) {
  execFileSync('pdftoppm', ['-r', String(dpi), '-png', pdfPath, outPrefix]);
  const pages = fs.readdirSync(TMP).filter((f) => f.startsWith(path.basename(outPrefix)) && f.endsWith('.png'));
  assert.ok(pages.length > 0, 'PDF must rasterize to at least one page');

  const decoded = [];
  for (const page of pages.sort()) {
    try {
      const out = execFileSync('zbarimg', ['--raw', '-q', path.join(TMP, page)], { encoding: 'utf8' });
      decoded.push(...out.split('\n').map((s) => s.trim()).filter(Boolean));
    } catch (err) {
      // zbarimg exits 4 when no symbol is found on a page
      if (err.status !== 4) throw err;
    }
  }
  return decoded;
}

async function main() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — PRINTED RECEIPT QR SCAN VALIDATION');
  console.log('================================================================\n');

  const appProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(APP_PORT)], {
    env: {
      ...process.env,
      ...OPEN_BOOKING_WINDOW_ENV,
      PORT: String(APP_PORT),
      NODE_ENV: 'production',
      BOOKING_SHEETS_ENDPOINT: 'http://127.0.0.1:3995/exec',
    },
    stdio: 'pipe',
  });
  appProc.stdout.on('data', () => {});
  appProc.stderr.on('data', () => {});

  let testPass = null;
  let bookingId = null;

  try {
    await waitForServer(APP_BASE);

    testPass = await prisma.pass.create({
      data: {
        passType: `print-qr-${Date.now()}`,
        name: 'Print QR Tier',
        price: 1999,
        totalQuantity: 5,
        reservedQuantity: 0,
        soldQuantity: 1,
        isActive: true,
      },
    });

    const booking = await prisma.booking.create({
      data: {
        publicId: `RU26-REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: 'Print Attendee',
        phone: '+91 99315 03994',
        passId: testPass.id,
        quantity: 1,
        unitPrice: testPass.price,
        totalAmount: testPass.price,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        confirmedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        source: 'print-qr-test',
      },
    });
    bookingId = booking.id;
    const expectedToken = createEntryQrToken(booking.publicId);

    const browser = await puppeteer.launch({
      executablePath: CHROMIUM,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.setCookie({
        name: 'ru26_lookup_session',
        value: lookupSessionTokenFor(booking.publicId),
        domain: '127.0.0.1',
        path: '/',
      });

      await page.goto(`${APP_BASE}/booking?bookingId=${encodeURIComponent(booking.publicId)}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await page.waitForSelector('#receipt-entry-qr', { timeout: 20000 });
      console.log('  ✓ On-screen receipt rendered its entry QR');

      const pdfPath = path.join(TMP, 'receipt.pdf');
      await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
      assert.ok(fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 5000, 'PDF must be generated');
      console.log('  ✓ Print receipt rendered to PDF through the browser print engine');
    } finally {
      await browser.close();
    }

    for (const dpi of [200, 150]) {
      const decoded = decodeQrFromPdf(path.join(TMP, 'receipt.pdf'), dpi, path.join(TMP, `page-${dpi}`));
      assert.ok(decoded.length >= 1, `printed QR must be scannable at ${dpi} DPI`);
      assert.equal(new Set(decoded).size, 1, `exactly one distinct QR must appear in the print output at ${dpi} DPI`);
      assert.equal(decoded[0], expectedToken, `decoded printed token must equal the receipt token at ${dpi} DPI`);
      assert.deepEqual(verifyEntryQrToken(decoded[0]), { publicId: booking.publicId });
      console.log(`  ✓ Printed QR decoded at ${dpi} DPI → correct booking token`);
    }

    console.log('\n================================================================');
    console.log('✓ PRINTED RECEIPT QR VALIDATED (real PDF rasterization + QR decode)');
    console.log('================================================================');
  } finally {
    appProc.kill('SIGTERM');

    if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
    if (testPass) {
      await prisma.booking.deleteMany({ where: { passId: testPass.id } });
      await prisma.pass.delete({ where: { id: testPass.id } });
    }
    await prisma.$disconnect();
    fs.rmSync(TMP, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('\n✗ PRINT QR VALIDATION FAILED');
  console.error(err);
  process.exit(1);
});
