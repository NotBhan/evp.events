import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runBrowserTest() {
  console.log('🧪 Starting Real Chromium UI Browser Submission Test...');

  // 1. Snapshot the live solo-female inventory, then open headroom for the test.
  // The snapshot is ALWAYS restored in the finally block so production counts
  // (total 50 / real reserved / real sold) are never left clobbered.
  const inventorySnapshot = await prisma.pass.findUnique({ where: { passType: 'solo-female' } });
  if (!inventorySnapshot) {
    throw new Error('solo-female pass tier not found — cannot run the browser flow');
  }
  console.log(
    `1. Snapshot: solo-female total=${inventorySnapshot.totalQuantity} reserved=${inventorySnapshot.reservedQuantity} sold=${inventorySnapshot.soldQuantity}; opening headroom for the test`
  );
  await prisma.pass.update({
    where: { passType: 'solo-female' },
    data: { totalQuantity: 10, reservedQuantity: 0, soldQuantity: 0 },
  });

  // Ensure no stale bookings for nehal
  await prisma.paymentAttempt.deleteMany({
    where: { booking: { fullName: 'nehal' } },
  });
  await prisma.booking.deleteMany({
    where: { fullName: 'nehal' },
  });

  // The booking window is enforced server-side. Fail fast with a clear message
  // if the externally started server on :3000 has a closed/invalid window.
  {
    const probe = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Window Probe',
        phone: 'invalid',
        passId: 'solo-female',
        quantity: 1,
      }),
    });
    const probeBody = await probe.json().catch(() => ({}));
    assert.notEqual(
      probe.status,
      403,
      `Server under test has a closed booking window (${probeBody.code || 'BOOKING_WINDOW'}). ` +
        'Start it with BOOKING_OPEN_AT/BOOKING_CLOSE_AT set to an open window; ' +
        'see tests/helpers/booking-window-env.mjs.'
    );
  }

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let capturedBookingResponse = null;
  let capturedPaymentResponse = null;

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/bookings') && res.request().method() === 'POST') {
      try {
        const body = await res.json();
        capturedBookingResponse = { status: res.status(), body };
        console.log(`  [Network] POST /api/bookings -> ${res.status()}:`, body);
      } catch (err) {
        console.error('Failed to parse booking response', err);
      }
    }
    if (url.includes('/api/payments/create') && res.request().method() === 'POST') {
      try {
        const body = await res.json();
        capturedPaymentResponse = { status: res.status(), body };
        console.log(`  [Network] POST /api/payments/create -> ${res.status()}:`, body);
      } catch (err) {
        console.error('Failed to parse payment response', err);
      }
    }
  });

  try {
    // Navigate to /booking
    console.log('2. Navigating to http://localhost:3000/booking...');
    await page.goto('http://localhost:3000/booking', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('  ✓ Loaded /booking page');

    // Step 1: Ensure solo-female selected and click ENTER ATTENDEE DETAILS
    console.log('3. Selecting Pass and proceeding to Step 2...');
    const enterDetailsBtn = await page.waitForSelector('#stage-1-continue-btn', {
      timeout: 10000,
    });
    assert(enterDetailsBtn, 'Could not find Enter Attendee Details button');
    await enterDetailsBtn.click();
    console.log('  ✓ Clicked Enter Attendee Details');

    // Step 2: Fill Name, Email and Phone
    console.log('4. Entering Name "nehal", Email and Phone "9874056123"...');
    await page.waitForSelector('#fullName', { timeout: 10000 });
    await page.type('#fullName', 'nehal');
    await page.type('#email', 'nehal.browserflow@example.com');
    await page.type('#phone', '9874056123');

    // Click Review & Submit
    const reviewBtn = await page.waitForSelector('#stage-2-submit-btn', { timeout: 10000 });
    await reviewBtn.click();
    console.log('  ✓ Clicked Review & Submit Request');

    // Step 3: Verify review summary and click Submit
    console.log('5. In Step 3: Verifying review and submitting...');
    const submitBtn = await page.waitForSelector('#stage-3-submit-btn', { timeout: 10000 });
    await submitBtn.click();
    console.log('  ✓ Clicked Stage 3 Submit button');

    // Wait for receipt
    console.log('6. Waiting for receipt to display...');
    await page.waitForSelector('#booking-receipt-document', { timeout: 15000 });
    console.log('  ✓ Booking receipt is displayed!');

    // Assert network response
    assert(capturedBookingResponse, 'No POST /api/bookings response captured');
    assert.equal(capturedBookingResponse.status, 201, 'Expected HTTP 201 from /api/bookings');
    assert.equal(capturedBookingResponse.body.success, true);
    const publicId = capturedBookingResponse.body.bookingId;
    console.log(`  ✓ Authoritative Booking ID returned by server: ${publicId}`);

    // Verify Neon database
    console.log('7. Verifying Neon database state...');
    const dbBooking = await prisma.booking.findUnique({
      where: { publicId },
    });
    assert(dbBooking, `Booking ${publicId} not found in Neon database`);
    assert.equal(dbBooking.fullName, 'nehal');
    assert.equal(dbBooking.phone, '+91 98740 56123');
    assert.equal(dbBooking.status, 'PENDING');
    assert.equal(dbBooking.paymentStatus, 'NOT_STARTED');
    assert.equal(dbBooking.unitPrice, 999);
    assert.equal(dbBooking.quantity, 1);
    assert.equal(dbBooking.totalAmount, 999);
    console.log('  ✓ Neon contains exact corresponding PENDING booking with total ₹999');

    const dbPass = await prisma.pass.findUnique({
      where: { passType: 'solo-female' },
    });
    assert.equal(dbPass.reservedQuantity, 1, 'Expected reservedQuantity to be 1 in Neon');
    console.log('  ✓ Correct pass reserved in Neon (reservedQuantity = 1)');

    // Verify PAY ONLINE button on receipt
    console.log('8. Verifying PAY ONLINE action on receipt...');
    const payOnlineBtn = await page.waitForSelector('#receipt-pay-online-btn', { timeout: 10000 });
    assert(payOnlineBtn, 'Pay Online button not found on receipt');
    const payBtnText = await page.evaluate((el) => el.textContent, payOnlineBtn);
    console.log(`  ✓ Found Pay Online Button: "${payBtnText}"`);

    // Click PAY ONLINE
    console.log('9. Clicking PAY ONLINE (STRIPE TEST)...');
    await payOnlineBtn.click();

    // Wait for payment request to fire
    let paymentWaitStart = Date.now();
    while (!capturedPaymentResponse && Date.now() - paymentWaitStart < 15000) {
      await new Promise((r) => setTimeout(r, 300));
    }

    assert(capturedPaymentResponse, 'No POST /api/payments/create response captured');
    assert.equal(capturedPaymentResponse.status, 200, 'Expected HTTP 200 from /api/payments/create');
    assert.equal(capturedPaymentResponse.body.success, true);
    assert(
      capturedPaymentResponse.body.checkoutUrl &&
        capturedPaymentResponse.body.checkoutUrl.startsWith('https://checkout.stripe.com/'),
      `Invalid Stripe checkout URL: ${capturedPaymentResponse.body.checkoutUrl}`
    );
    console.log(`  ✓ Stripe TEST Checkout URL received: ${capturedPaymentResponse.body.checkoutUrl}`);

    // Verify PaymentAttempt created in Neon
    const paymentAttempt = await prisma.paymentAttempt.findFirst({
      where: { bookingId: dbBooking.id },
    });
    assert(paymentAttempt, 'PaymentAttempt not found in Neon');
    assert.equal(paymentAttempt.status, 'INITIATED');
    assert.equal(paymentAttempt.amount, 999);
    console.log('  ✓ PaymentAttempt created in Neon with status INITIATED');

    console.log('\n🎉 FULL REAL BROWSER UI SUBMISSION + STRIPE PAYMENT INITIALIZATION SUCCEEDED!\n');

    // 10. Clean up test data and restore inventory
    console.log('10. Cleaning up test booking and restoring inventory...');
    await prisma.paymentAttempt.deleteMany({
      where: { bookingId: dbBooking.id },
    });
    await prisma.booking.delete({
      where: { id: dbBooking.id },
    });
    console.log('  ✓ Cleaned up test booking');
  } catch (err) {
    console.error('❌ BROWSER TEST FAILED:', err);
    throw err;
  } finally {
    await prisma.pass.update({
      where: { passType: 'solo-female' },
      data: {
        totalQuantity: inventorySnapshot.totalQuantity,
        reservedQuantity: inventorySnapshot.reservedQuantity,
        soldQuantity: inventorySnapshot.soldQuantity,
      },
    });
    console.log(
      `  ✓ Restored live solo-female inventory: total=${inventorySnapshot.totalQuantity} reserved=${inventorySnapshot.reservedQuantity} sold=${inventorySnapshot.soldQuantity}`
    );
    await browser.close();
    await prisma.$disconnect();
  }
}

runBrowserTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
