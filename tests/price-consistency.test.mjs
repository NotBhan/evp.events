import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { eventData, passesByPrice } from '../data/eventData.ts';
import { calculateGstAndRefund } from '../lib/cancellation-constants.ts';

/**
 * Price consistency & Terms verification suite (READ-ONLY).
 *
 * The live `passes` table is the pricing source of truth. This suite asserts that:
 *   1. data/eventData.ts (the cached public pricing copy) matches the database exactly.
 *   2. Every public surface (pricing, booking desk, terms, refund table, FAQ + JSON-LD,
 *      homepage structured data) displays the current database prices and never a stale one.
 *   3. The refund table applies the authoritative GST-inclusive calculation per tier.
 *   4. All 22 official ticket terms & conditions clauses render verbatim, in order,
 *      exactly once each.
 *
 * No database writes, no payments. Run with:
 *   node --env-file=.env.local tests/price-consistency.test.mjs
 * (requires a production build: pnpm build)
 */

const PORT = 3069;
const BASE = `http://127.0.0.1:${PORT}`;

const PUBLIC_PRICING_ROUTES = ['/', '/pricing', '/booking', '/terms-and-conditions', '/refund-and-cancellation', '/faq', '/policies'];

/** Pass prices that must never appear again anywhere on the public site. */
const STALE_PRICE_STRINGS = ['₹1,999', '₹3,599', '₹4,999', '₹3,499', '₹7,999'];

/** Official Event Point ticket terms & conditions, clause 1–22 (verbatim source). */
const EVENT_TICKET_CLAUSES = [
  `By accepting, holding or using a ticket, you acknowledge that you have read, understood, accepted and agreed to the full terms and conditions.`,
  `The organizer reserves the right of admission.`,
  `The organizer may alter the event schedule without prior notice.`,
  `Entry is permitted only after a thorough security check and through designated entrances.`,
  `Re-entry is not permitted.`,
  `The venue does not allow food, beverages, liquids, bottles, cans, tins, bags, lighters, matchboxes, flammable items, or any illegal or hazardous substances inside the venue or seating area ("Prohibited Items"). Security personnel will search ticket holders' belongings at entry. If a ticket holder refuses a search and/or is found in possession of Prohibited Items, the organizer may deny entry without any refund or compensation.`,
  `This is a drug-free event. If any ticket holder uses, possesses, procures, supplies, or consumes drugs, narcotics, or psychotropic substances (as defined under the Narcotic Drugs and Psychotropic Substances Act, 1985), the organizer will immediately evict them from the venue without refund or compensation. The organizer also reserves the right to initiate legal action as permitted under applicable law.`,
  `The organizer reserves the right to refuse admission or eject any ticket holder who appears intoxicated, under the influence of drugs, behaves dangerously or inappropriately, or engages in conduct likely to cause harassment, damage, injury, or nuisance. The organizer's decision in this regard shall be final.`,
  `The use of audio or video recording equipment, including still cameras, is strictly prohibited.`,
  `The organizer issues this ticket in accordance with the rules and regulations of the event organizer and venue management.`,
  `The organizer does not accept responsibility for any injury to persons or for any loss or damage to personal property brought to the event.`,
  `In accordance with applicable law, persons below the legally permissible age may not purchase or consume alcoholic beverages.`,
  `The organizer and venue are not liable for any issues arising from unauthorized copies or reproductions of this ticket. Except as stated herein, the ticket is non-refundable and cannot be exchanged, cancelled, or returned once purchased.`,
  `If the organizer cancels the performance, the organizer will refund the ticket fee. All other charges, including parking fees, internet handling fees, and order processing fees, remain non-refundable.`,
  `The ticket is invalid if the security features affixed to it are tampered with.`,
  `You voluntarily assume all risks related to contracting COVID-19, H1N1, or any other communicable disease or illness, whether occurring before, during, or after the event, and waive all claims against the organizer arising from such risks.`,
  `The event is subject to force majeure conditions.`,
  `We request your cooperation at all times.`,
  `All disputes or claims shall be subject to the exclusive jurisdiction of the courts in Mumbai.`,
  `The organizer may modify these terms and conditions at its discretion from time to time.`,
  `All secondary performances (if any) and the event lineup are subject to the artist's discretion.`,
  `To ensure a high-quality user experience, the organizer may collect certain information (including personally identifiable information such as name, email address, or phone number) at the time of booking, registration, or payment, in accordance with its Terms and Conditions and Privacy Policy.`,
];

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function toVisibleText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count++;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

async function waitForServer(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/`, { method: 'GET' });
      if (res.status < 500) return;
    } catch {
      // keep waiting
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Production server at ${BASE} did not become ready within ${timeoutMs}ms`);
}

async function main() {
  console.log('================================================================');
  console.log('RAAS UTSAV 2026 — PRICE CONSISTENCY & TERMS VERIFICATION (READ-ONLY)');
  console.log('================================================================\n');

  const prisma = new PrismaClient({ log: ['error'] });
  let serverProc = null;

  try {
    // ------------------------------------------------------------------
    // 1. DATABASE IS THE SOURCE OF TRUTH — compare with the cached public copy
    // ------------------------------------------------------------------
    console.log('--- 1. Database ↔ data/eventData.ts price parity ---');
    const dbPasses = await prisma.pass.findMany({ orderBy: { price: 'asc' } });
    assert.ok(dbPasses.length > 0, 'Database must contain pass records');

    const dbPriceBySlug = new Map(dbPasses.map((p) => [p.passType, p.price]));

    assert.equal(
      eventData.passes.length,
      dbPasses.length,
      `Catalog size mismatch: eventData has ${eventData.passes.length} tiers, database has ${dbPasses.length}`
    );

    for (const tier of eventData.passes) {
      assert.ok(dbPriceBySlug.has(tier.id), `Database is missing pass tier "${tier.id}"`);
      assert.equal(
        tier.price,
        dbPriceBySlug.get(tier.id),
        `Stale price for "${tier.id}": eventData has ₹${tier.price}, database has ₹${dbPriceBySlug.get(tier.id)}`
      );
      assert.equal(
        tier.priceDisplay,
        `₹${tier.price.toLocaleString('en-IN')}`,
        `priceDisplay for "${tier.id}" (${tier.priceDisplay}) must match its price`
      );
      console.log(`  ✓ ${tier.id.padEnd(12)} database ₹${dbPriceBySlug.get(tier.id)} = eventData ${tier.priceDisplay}`);
    }

    // ------------------------------------------------------------------
    // 2. PUBLIC PRICING SURFACES
    // ------------------------------------------------------------------
    console.log('\n--- 2. Public surfaces display database prices ---');
    serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
      stdio: 'pipe',
    });
    serverProc.stdout.on('data', () => {});
    serverProc.stderr.on('data', () => {});

    await waitForServer();
    console.log(`  ✓ Production server ready on port ${PORT}`);

    const pages = {};
    for (const route of PUBLIC_PRICING_ROUTES) {
      const res = await fetch(`${BASE}${route}`);
      assert.equal(res.status, 200, `${route} must return HTTP 200`);
      // React SSR inserts `<!-- -->` separators between adjacent text/expression
      // nodes (e.g. `₹<!-- -->999`); strip them so amounts read continuously.
      pages[route] = (await res.text()).replace(/<!--.*?-->/g, '');
    }

    // Every price-bearing surface must display all five current pass prices.
    const priceDisplayRoutes = ['/', '/pricing', '/booking', '/terms-and-conditions', '/refund-and-cancellation', '/faq'];
    for (const route of priceDisplayRoutes) {
      for (const tier of passesByPrice) {
        assert.ok(
          pages[route].includes(tier.priceDisplay),
          `${route} must display the current ${tier.id} price ${tier.priceDisplay}`
        );
      }
      console.log(`  ✓ ${route.padEnd(26)} shows all ${passesByPrice.length} current pass prices`);
    }

    // ------------------------------------------------------------------
    // 3. NO STALE PRICES ANYWHERE (rendered text + embedded structured data)
    // ------------------------------------------------------------------
    console.log('\n--- 3. Zero stale prices on public routes (including JSON-LD) ---');
    for (const route of PUBLIC_PRICING_ROUTES) {
      for (const stale of STALE_PRICE_STRINGS) {
        assert.ok(
          !pages[route].includes(stale),
          `${route} still exposes stale price ${stale}`
        );
      }
    }
    console.log(`  ✓ No ${STALE_PRICE_STRINGS.join(', ')} found on any public route`);

    // Structured data holds only current prices
    for (const tier of passesByPrice) {
      assert.ok(
        pages['/'].includes(`"price":${tier.price}`),
        `Homepage Festival JSON-LD must offer ${tier.id} at ${tier.price}`
      );
      assert.ok(
        pages['/faq'].includes(tier.priceDisplay),
        `FAQ structured data must state the current price for ${tier.id} (${tier.priceDisplay})`
      );
    }
    console.log('  ✓ Festival offer schema and FAQ structured data carry only current prices');

    // ------------------------------------------------------------------
    // 4. REFUND TABLE USES THE AUTHORITATIVE GST-INCLUSIVE CALCULATION
    // ------------------------------------------------------------------
    console.log('\n--- 4. Refund table matches calculateGstAndRefund per tier ---');
    const refundText = toVisibleText(pages['/refund-and-cancellation']);
    for (const tier of passesByPrice) {
      const refund = calculateGstAndRefund(tier.price);
      const formatAmount = (value) =>
        value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      for (const amount of [formatAmount(refund.grossRupees), formatAmount(refund.gstRupees), formatAmount(refund.refundRupees)]) {
        assert.ok(
          refundText.includes(amount),
          `Refund table must show ${tier.shortLabel} amount ₹${amount}`
        );
      }
    }
    console.log(`  ✓ Refund table computed correctly for all ${passesByPrice.length} tiers (Gross × 100 / 118)`);

    // ------------------------------------------------------------------
    // 5. ALL 22 TICKET TERMS CLAUSES — VERBATIM, IN ORDER, EXACTLY ONCE
    // ------------------------------------------------------------------
    console.log('\n--- 5. Terms & Conditions: 22 official clauses ---');
    const termsHtml = pages['/terms-and-conditions'];
    const termsText = toVisibleText(termsHtml);

    const olMatch = termsHtml.match(/<ol[^>]*>([\s\S]*?)<\/ol>/);
    assert.ok(olMatch, 'Terms page must render the clauses as an ordered list');
    const renderedClauseCount = (olMatch[1].match(/<li/g) || []).length;
    assert.equal(renderedClauseCount, 22, `Terms ordered list must contain exactly 22 clauses (found ${renderedClauseCount})`);

    let previousIndex = -1;
    EVENT_TICKET_CLAUSES.forEach((clause, i) => {
      const normalizedClause = clause.replace(/\s+/g, ' ').trim();
      const occurrences = countOccurrences(termsText, normalizedClause);
      assert.equal(occurrences, 1, `Clause ${i + 1} must appear exactly once (found ${occurrences})`);

      const index = termsText.indexOf(normalizedClause);
      assert.ok(index > previousIndex, `Clause ${i + 1} is out of order in the rendered terms`);
      previousIndex = index;
    });
    console.log(`  ✓ All ${EVENT_TICKET_CLAUSES.length} clauses render verbatim, in order, with no duplicates`);

    for (const stale of ['₹1,999', '₹3,599', '₹4,999']) {
      assert.ok(!termsText.includes(stale), `Terms page must not list the stale pass price ${stale}`);
    }
    console.log('  ✓ Terms pass-catalog section shows only current database prices');

    console.log('\n================================================================');
    console.log('✓ PRICE CONSISTENCY & TERMS VERIFICATION PASSED');
    console.log('================================================================\n');
  } finally {
    if (serverProc) serverProc.kill('SIGTERM');
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('\n✗ PRICE CONSISTENCY VERIFICATION FAILED');
  console.error(err);
  process.exit(1);
});
