import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const routes = [
    '/pricing',
    '/terms-and-conditions',
    '/privacy-policy',
    '/refund-and-cancellation',
    '/shipping-policy',
    '/policies',
    '/faq',
    '/contact',
  ];

  console.log('--- TESTING DESKTOP VIEWPORT ---');
  await page.setViewport({ width: 1280, height: 800 });

  for (const route of routes) {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const res = await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded' });
    const status = res.status();
    const title = await page.title();
    console.log(`Route: ${route} | Status: ${status} | Title: ${title}`);

    // Verify no prohibited terms in the rendered text
    const text = await page.evaluate(() => document.body.innerText);
    const prohibited = [
      'wristband',
      'CLIENT DECISION REQUIRED',
      'photo ID',
      '5 to 7 business days',
      '5–7 working days',
      'Ranchi court',
      'exclusive jurisdiction',
      'GST excluded',
      'taxes extra',
      'Daily 10:00 AM',
      'GDPR',
      'DPDP',
      'rzp_',
      'Pvt Ltd',
      'Private Limited',
      'LLP',
      'CIN:',
      'Registered Business Office',
      'Registered Business Address',
      'Registered Office',
      'Authorized Representative',
      'Authorized Signatory',
      'admission verification',
      'entry verification',
    ];

    for (const term of prohibited) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        throw new Error(`FOUND PROHIBITED TERM "${term}" on ${route}`);
      }
    }

    // Verify business identity presence
    if (!text.includes('PUJA TENT AGENCY')) {
      throw new Error(`MISSING "PUJA TENT AGENCY" on ${route}`);
    }
    if (!text.includes('834002')) {
      throw new Error(`MISSING "834002" (Argora PIN) on ${route}`);
    }
    if (!text.includes('Argora')) {
      throw new Error(`MISSING "Argora" on ${route}`);
    }
    if (!text.includes('KUMARI PUJA VISHWAKARMA')) {
      throw new Error(`MISSING "KUMARI PUJA VISHWAKARMA" on ${route}`);
    }
    if (route === '/pricing') {
      if (!text.includes('All listed pass prices are inclusive of applicable GST.')) {
        throw new Error(`MISSING exact GST-inclusive statement on /pricing`);
      }
      if (!text.includes('20ARLPV7298K1ZZ')) {
        throw new Error(`MISSING GSTIN "20ARLPV7298K1ZZ" on /pricing`);
      }
    }
    if (!text.includes('Upwan Lawn') && !text.includes('Chanakya BNR')) {
      throw new Error(`MISSING event venue on ${route}`);
    }

    // Verify the footer exposes direct links to every policy page (presence, not an
    // exact global count: the same hrefs also appear in the explore column and the
    // bottom bar by design) plus the Phase 3 FAQ / policies landing page.
    const footerLinkPresence = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return null;
      const hrefs = [
        '/pricing',
        '/terms-and-conditions',
        '/privacy-policy',
        '/refund-and-cancellation',
        '/shipping-policy',
        '/faq',
        '/policies',
      ];
      return Object.fromEntries(
        hrefs.map((href) => [href, footer.querySelectorAll(`a[href="${href}"]`).length])
      );
    });

    if (!footerLinkPresence) {
      throw new Error(`Footer not found on ${route}`);
    }
    for (const [href, count] of Object.entries(footerLinkPresence)) {
      if (count < 1) {
        throw new Error(`Footer is missing a link to ${href} on ${route}`);
      }
    }
  }

  console.log('--- TESTING MOBILE VIEWPORT ---');
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

  for (const route of routes) {
    const res = await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded' });
    const status = res.status();
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`Mobile Route: ${route} | Status: ${status} | Horizontal Overflow: ${hasHorizontalOverflow}`);
    if (hasHorizontalOverflow) {
      throw new Error(`Horizontal overflow detected on mobile for ${route}`);
    }
  }

  console.log('ALL COMPLIANCE PAGE TESTS PASSED CLEANLY!');
  await browser.close();
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
