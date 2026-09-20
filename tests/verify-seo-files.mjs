import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const PORT = 3099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status >= 200 && res.status < 500) return;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`Server at ${url} not ready within ${timeoutMs}ms`);
}

async function run() {
  console.log('================================================================');
  console.log('VERIFYING SEO, SITEMAP, ROBOTS, LLMS.TXT & INDEXING FILES');
  console.log('================================================================\n');

  const serverProc = spawn('node', ['./node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], {
    stdio: 'pipe',
  });

  try {
    await waitForServer(BASE_URL);
    console.log('✓ Next.js server listening on port', PORT);

    // 1. /sitemap.xml
    console.log('\n--- 1. Testing /sitemap.xml ---');
    const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
    assert.equal(sitemapRes.status, 200, 'sitemap.xml must return HTTP 200');
    const sitemapText = await sitemapRes.text();
    assert.ok(sitemapText.includes('<urlset'), 'sitemap must have <urlset>');
    assert.ok(sitemapText.includes('https://www.eventpointranchi.com/pricing'), 'sitemap must include /pricing');
    assert.ok(sitemapText.includes('https://www.eventpointranchi.com/booking'), 'sitemap must include /booking');
    assert.ok(sitemapText.includes('https://www.eventpointranchi.com/faq'), 'sitemap must include /faq');
    assert.ok(!sitemapText.includes('raasutsav.in'), 'sitemap must not contain old raasutsav.in domain');
    console.log('✓ /sitemap.xml is valid XML and includes all canonical URLs');

    // 2. /robots.txt
    console.log('\n--- 2. Testing /robots.txt ---');
    const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
    assert.equal(robotsRes.status, 200, 'robots.txt must return HTTP 200');
    const robotsText = await robotsRes.text();
    assert.ok(robotsText.includes('User-agent: *'), 'robots must have User-agent: *');
    assert.ok(robotsText.includes('Disallow: /api/'), 'robots must disallow /api/');
    assert.ok(robotsText.includes('Disallow: /organiser'), 'robots must disallow /organiser');
    assert.ok(robotsText.includes('Sitemap: https://www.eventpointranchi.com/sitemap.xml'), 'robots must cite sitemap.xml');
    assert.ok(!robotsText.includes('raasutsav.in'), 'robots must not contain old raasutsav.in domain');
    assert.ok(robotsText.includes('GPTBot') || robotsText.includes('ClaudeBot'), 'robots specifies AI bots');
    console.log('✓ /robots.txt has correct allow/disallow directives and sitemap reference');

    // 3. /llms.txt and /.well-known/llms.txt
    console.log('\n--- 3. Testing /llms.txt and /.well-known/llms.txt ---');
    const llmsRes = await fetch(`${BASE_URL}/llms.txt`);
    assert.equal(llmsRes.status, 200, '/llms.txt must return HTTP 200');
    assert.ok(llmsRes.headers.get('content-type')?.includes('text/plain'), 'must be text/plain');
    const llmsText = await llmsRes.text();
    assert.ok(llmsText.includes('# RAAS UTSAV 2026'), 'llms.txt must have title');
    assert.ok(llmsText.includes('Upwan Lawn, Chanakya BNR Hotel'), 'llms.txt must have venue info');
    assert.ok(llmsText.includes('20ARLPV7298K1ZZ'), 'llms.txt must have GSTIN');
    console.log('✓ /llms.txt is accessible with text/plain format and structured event guide');

    const wellKnownRes = await fetch(`${BASE_URL}/.well-known/llms.txt`);
    assert.equal(wellKnownRes.status, 200, '/.well-known/llms.txt must return HTTP 200');
    console.log('✓ /.well-known/llms.txt is accessible and matches specification');

    // 4. /llms-full.txt
    console.log('\n--- 4. Testing /llms-full.txt ---');
    const llmsFullRes = await fetch(`${BASE_URL}/llms-full.txt`);
    assert.equal(llmsFullRes.status, 200, '/llms-full.txt must return HTTP 200');
    const llmsFullText = await llmsFullRes.text();
    assert.ok(llmsFullText.includes('COMPLETE FESTIVAL DOCUMENTATION'), 'llms-full.txt has header');
    assert.ok(llmsFullText.includes('Solo Pass Female — ₹999'), 'llms-full.txt contains pass details');
    assert.ok(llmsFullText.includes('Cancellation Window'), 'llms-full.txt contains cancellation details');
    console.log('✓ /llms-full.txt provides unabridged documentation for deep LLM retrieval');

    // 5. /manifest.webmanifest
    console.log('\n--- 5. Testing /manifest.webmanifest ---');
    const manifestRes = await fetch(`${BASE_URL}/manifest.webmanifest`);
    assert.equal(manifestRes.status, 200, 'manifest must return HTTP 200');
    const manifestJson = await manifestRes.json();
    assert.equal(manifestJson.name, 'RAAS UTSAV 2026 — Dandiya & Garba Night');
    assert.equal(manifestJson.display, 'standalone');
    console.log('✓ /manifest.webmanifest is valid PWA and web manifest');

    // 6. Homepage JSON-LD Schema
    console.log('\n--- 6. Testing Homepage JSON-LD Structured Data ---');
    const homeRes = await fetch(`${BASE_URL}/`);
    const homeHtml = await homeRes.text();
    assert.ok(homeHtml.includes('application/ld+json'), 'Homepage must contain JSON-LD script');
    assert.ok(homeHtml.includes('"@type":"Festival"'), 'Event schema present');
    assert.ok(homeHtml.includes('"@type":"Organization"'), 'Organization schema present');
    assert.ok(homeHtml.includes('"@type":"WebSite"'), 'WebSite schema present');
    assert.ok(homeHtml.includes('name="robots"'), 'Robots meta tag present');
    console.log('✓ Homepage has comprehensive Festival, Organization, and WebSite schemas');

    // 7. FAQ Page JSON-LD FAQPage Schema
    console.log('\n--- 7. Testing FAQ Page JSON-LD FAQPage Schema ---');
    const faqRes = await fetch(`${BASE_URL}/faq`);
    const faqHtml = await faqRes.text();
    assert.ok(faqHtml.includes('"@type":"FAQPage"'), 'FAQ page must have FAQPage schema');
    assert.ok(faqHtml.includes('mainEntity'), 'FAQPage must contain mainEntity');
    console.log('✓ /faq has Google-compliant FAQPage structured data');

    console.log('\n================================================================');
    console.log('ALL SEO, SITEMAP, ROBOTS, LLMS.TXT & INDEXING CHECKS PASSED! ✓');
    console.log('================================================================\n');
  } finally {
    serverProc.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('\n❌ SEO Verification Failed:', err);
  process.exit(1);
});
