import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

/**
 * Policies, FAQ and navigation verification.
 *
 * Checks that every required route renders, that policy/legal links are discoverable
 * from the header, footer, homepage and policies landing page, that the new FAQ
 * covers every required topic, and that no page states a contradictory date or an
 * unsupported refund promise. Read-only: no database writes, no payments.
 */

const PORT = 3068;
const BASE = `http://127.0.0.1:${PORT}`;

const ROUTES = [
  '/',
  '/faq',
  '/policies',
  '/terms-and-conditions',
  '/privacy-policy',
  '/refund-and-cancellation',
  '/shipping-policy',
  '/booking',
  '/find-pass',
  '/pricing',
];

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

async function fetchPage(route) {
  const res = await fetch(`${BASE}${route}`);
  const html = await res.text();
  return { status: res.status, html, text: html.replace(/<[^>]+>/g, ' ') };
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ldquo;|&rdquo;/g, '"');
}

async function main() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — POLICIES / FAQ / NAVIGATION TEST SUITE');
  console.log('================================================================\n');

  const serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'pipe',
  });
  serverProc.stdout.on('data', () => {});
  serverProc.stderr.on('data', () => {});

  try {
    await waitForServer(BASE);
    console.log('  ✓ Production server ready\n');

    // ---- 1. Every required route renders ------------------------------------
    console.log('--- 1. Required routes render ---');
    const pages = {};
    for (const route of ROUTES) {
      const page = await fetchPage(route);
      assert.equal(page.status, 200, `${route} must return 200 (got ${page.status})`);
      pages[route] = page;
    }
    console.log(`  ✓ ${ROUTES.length} routes returned 200 (incl. /faq and /policies)`);

    // ---- 2. Header Policies link on every page ------------------------------
    console.log('\n--- 2. Global header exposes Policies ---');
    for (const route of ROUTES) {
      assert.match(
        pages[route].html,
        /href="\/policies"/,
        `header must link /policies on ${route}`
      );
      assert.match(pages[route].text, /Policies/, `header must show a Policies label on ${route}`);
    }
    console.log('  ✓ /policies is linked from the header on every route (desktop + mobile use the same links)');

    // ---- 3. Footer links ----------------------------------------------------
    console.log('\n--- 3. Footer keeps individual policy links and adds FAQ/Policies ---');
    for (const route of ROUTES) {
      const html = pages[route].html;
      for (const href of [
        '/terms-and-conditions',
        '/privacy-policy',
        '/refund-and-cancellation',
        '/shipping-policy',
        '/faq',
        '/policies',
      ]) {
        assert.match(html, new RegExp(`href="${href}"`), `footer must link ${href} on ${route}`);
      }
    }
    console.log('  ✓ footer links all individual policies plus FAQ and the policies landing page');

    // ---- 4. Policies landing page ------------------------------------------
    console.log('\n--- 4. /policies links every policy ---');
    const policiesHtml = pages['/policies'].html;
    for (const href of [
      '/terms-and-conditions',
      '/privacy-policy',
      '/refund-and-cancellation',
      '/shipping-policy',
      '/faq',
    ]) {
      assert.match(policiesHtml, new RegExp(`href="${href}"`), `/policies must link ${href}`);
    }
    console.log('  ✓ /policies links Terms, Privacy, Cancellation & Refund, Shipping and FAQ');

    // ---- 5. Homepage summaries + deep links --------------------------------
    console.log('\n--- 5. Homepage payment/cancellation/refund/entry summary ---');
    const home = pages['/'].text.replace(/\s+/g, ' ');
    assert.match(home, /PAY NOW OR PAY LATER/i, 'homepage must summarise payment options');
    assert.match(home, /24-HOUR PAYMENT DEADLINE/i, 'homepage must summarise the 24-hour deadline');
    assert.match(home, /6 October 2026/, 'homepage must state the cancellation deadline');
    assert.match(home, /100 \/ 118/, 'homepage must state the refund calculation');
    assert.match(home, /QR ENTRY AT THE GATE/i, 'homepage must summarise QR entry');
    assert.match(home, /FAQ/i, 'homepage must link the FAQ');
    assert.match(home, /Policies/i, 'homepage must link the policies centre');
    assert.match(home, /94301 12440/, 'homepage must show the support helpline');
    assert.match(home, /eventpointranchi18@gmail\.com/, 'homepage must show the support email');
    console.log('  ✓ homepage summarises payments, deadline, cancellation, refunds and entry with support contacts');

    // ---- 6. FAQ topic coverage ---------------------------------------------
    console.log('\n--- 6. FAQ topics ---');
    const faq = pages['/faq'].text.replace(/\s+/g, ' ');
    const requiredTopics = [
      [/Pay Now/i, 'Pay Now'],
      [/Pay Later/i, 'Pay Later'],
      [/24 hours/i, '24-hour payment deadline'],
      [/expires/i, 'booking expiry'],
      [/no refund applies because no payment was collected/i, 'expiry is not a refund'],
      [/6 October 2026/, 'cancellation deadline'],
      [/Cancel Booking/i, 'how to cancel'],
      [/request your refund through our support channels/i, 'how to request a refund'],
      [/original payment method/i, 'refund destination'],
      [/Gross Paid Amount × 100 \/ 118/, 'refund calculation'],
      [/PASS_ALREADY_USED/, 'checked-in bookings cannot be cancelled/refunded'],
      [/ALREADY CHECKED IN/i, 'duplicate scan behaviour'],
      [/Only when the booking is/i, 'when the QR is issued'],
      [/authenticated organiser/i, 'how organisers check passes'],
      [/94301 12440/, 'WhatsApp support'],
      [/eventpointranchi18@gmail\.com/, 'email support'],
    ];
    for (const [pattern, label] of requiredTopics) {
      assert.match(faq, pattern, `FAQ must cover: ${label}`);
    }
    console.log(`  ✓ FAQ covers all ${requiredTopics.length} required topics`);

    // ---- 7. No contradictory dates or unsupported promises ------------------
    console.log('\n--- 7. Date/consistency checks ---');
    const dateCheckedRoutes = ['/terms-and-conditions', '/refund-and-cancellation', '/faq', '/policies'];
    for (const route of dateCheckedRoutes) {
      const text = pages[route].text.replace(/\s+/g, ' ');
      assert.match(text, /6 October 2026/, `${route} must state the 6 October 2026 cancellation deadline`);
      for (const wrongDate of ['5 October 2026', '7 October 2026', '9 October 2026', '31 October 2026']) {
        assert.ok(!text.includes(wrongDate), `${route} must not state the contradictory date ${wrongDate}`);
      }
      assert.ok(!/unlimited reservation/i.test(text), `${route} must not describe Pay Later as an unlimited reservation`);
      assert.ok(!/processing timeline of/i.test(text), `${route} must not invent a refund processing timeline`);
    }
    console.log('  ✓ cancellation date consistent, no contradictory dates, no invented timelines, no "unlimited" Pay Later');

    // ---- 8. Booking page is reachable and references the policies ----------
    console.log('\n--- 8. Checkout route reachable ---');
    assert.match(pages['/booking'].html, /BAAS|Booking Desk|booking-desk|BOOK PASS/i, '/booking must render the desk');
    console.log('  ✓ /booking renders (client-side payment-stage policy links are asserted in the Pay Later suite)');

    // ---- 9. Find Pass is decoupled from the booking page --------------------
    console.log('\n--- 9. Find Pass decoupling ---');
    const bookingHtml = pages['/booking'].html;
    assert.ok(
      !/New Pass Reservation/.test(bookingHtml),
      '/booking must no longer host the reserve/lookup view toggle (decoupled)'
    );
    assert.match(
      bookingHtml,
      /href="\/find-pass"/,
      '/booking must link to the dedicated Find Pass page'
    );
    assert.match(
      pages['/'].html,
      /href="\/find-pass"/,
      'the navbar (rendered on the homepage) must link to /find-pass'
    );
    assert.match(
      pages['/'].html,
      /id="navbar-find-pass-cta"/,
      'the navbar must expose Find Your Pass as a button beside the booking CTA'
    );
    assert.match(
      pages['/find-pass'].html,
      /href="\/find-pass"/,
      'the footer must link to /find-pass'
    );
    const findPassText = pages['/find-pass'].text.replace(/\s+/g, ' ');
    assert.match(findPassText, /FIND YOUR PASS/i, '/find-pass must render its own hero');
    assert.match(
      findPassText,
      /Email Address/i,
      '/find-pass must render the email + mobile recovery form'
    );
    console.log('  ✓ /booking is booking-only, /find-pass is linked from the navbar and footer');

    // ---- 10. Ownership/sharing disclaimer and terms acceptance --------------
    console.log('\n--- 10. Disclaimer & terms acceptance ---');
    const disclaimerText = [
      /Pass ownership & sharing/i,
      /registered to the name provided at booking/i,
      /one entry/i,
      /anyone you share them with can open your receipt and take entry with your pass/i,
      /cannot take responsibility for entry taken using details you shared/i,
    ];
    for (const route of ['/booking', '/find-pass']) {
      const html = pages[route].html;
      assert.match(html, /data-disclaimer="pass-ownership"/, `${route} must render the pass ownership disclaimer`);
      const text = decodeEntities(pages[route].text).replace(/\s+/g, ' ');
      for (const pattern of disclaimerText) {
        assert.match(text, pattern, `${route} disclaimer must state: ${pattern}`);
      }
    }

    const termsText = decodeEntities(pages['/terms-and-conditions'].text).replace(/\s+/g, ' ');
    assert.match(termsText, /Acceptance of Terms & Policies/i, 'Terms must state acceptance of terms');
    assert.match(
      termsText,
      /By accessing or using this website, submitting a booking enquiry, or reserving a pass, you agree to be bound/i,
      'Terms must state that using the website or booking a pass binds the user to the terms'
    );
    assert.match(termsText, /Privacy Policy/i, 'Terms acceptance must reference the Privacy Policy');
    assert.match(termsText, /all other policies published on this website/i, 'Terms acceptance must cover all policies');
    assert.match(termsText, /Pass Ownership & Sharing/i, 'Terms must carry the ownership/sharing clause');
    assert.match(
      termsText,
      /does not restrict who may use a valid pass under Transfer by Possession/i,
      'the ownership clause must not contradict Transfer by Possession'
    );

    const footerText = decodeEntities(pages['/'].text).replace(/\s+/g, ' ');
    assert.match(
      footerText,
      /By using this website or booking a pass you agree to our/i,
      'the footer must carry the site-wide acceptance statement'
    );
    console.log('  ✓ ownership/sharing disclaimer on booking + find-pass, site-wide terms acceptance in footer and Terms');

    // ---- 11. Digital-only pass fulfilment is stated explicitly --------------
    console.log('\n--- 11. Digital-only passes ---');
    const digitalOnlyRoutes = {
      '/shipping-policy': [/digital only/i, /exclusively in digital form/i, /no physical ticket/i],
      '/terms-and-conditions': [/Digital Pass Only/i, /no physical tickets/i, /collection or will-call counter/i],
      '/pricing': [/digitally only/i, /no physical ticket is printed/i],
      '/faq': [/digital only/i, /no physical ticket/i],
      '/booking': [/digital only/i, /no physical ticket/i],
    };
    for (const [route, patterns] of Object.entries(digitalOnlyRoutes)) {
      const text = decodeEntities(pages[route].text).replace(/\s+/g, ' ');
      for (const pattern of patterns) {
        assert.match(text, pattern, `${route} must state that passes are digital only (${pattern})`);
      }
    }
    assert.match(
      decodeEntities(pages['/faq'].text).replace(/\s+/g, ' '),
      /Are the passes digital only\?/i,
      'the FAQ must answer whether passes are digital only'
    );
    assert.match(
      decodeEntities(pages['/faq'].text).replace(/\s+/g, ' '),
      /every pass is digital only/i,
      'the FAQ answer must state plainly that every pass is digital only'
    );
    console.log('  ✓ digital-only fulfilment stated on shipping policy, terms, pricing, FAQ and booking');

    console.log('\n================================================================');
    console.log('✓ POLICIES / FAQ / NAVIGATION SUITE PASSED');
    console.log('================================================================');
  } finally {
    serverProc.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('\n✗ POLICIES / FAQ / NAVIGATION SUITE FAILED');
  console.error(err);
  process.exit(1);
});
