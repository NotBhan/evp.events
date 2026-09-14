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
      'GST included',
      'GST excluded',
      'taxes included',
      'taxes extra',
      'Daily 10:00 AM',
      'GDPR',
      'DPDP',
      'rzp_',
      'Pvt Ltd',
      'Private Limited',
      'LLP',
      'Sole Proprietorship',
      'GSTIN',
      'CIN:',
      'Registered Business Office',
      'Registered Business Address',
      'Registered Office',
      'Authorized Representative',
      'Authorized Signatory',
      'Proprietor',
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
      throw new Error(`MISSING "834002" (Argoa PIN) on ${route}`);
    }
    if (!text.includes('KUMARI PUJA VISHWAKARMA')) {
      throw new Error(`MISSING "KUMARI PUJA VISHWAKARMA" on ${route}`);
    }
    if (!text.includes('Upwan Lawn') && !text.includes('Chanakya BNR')) {
      throw new Error(`MISSING event venue on ${route}`);
    }

    // Verify footer links exist
    const footerLinksCount = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return 0;
      return footer.querySelectorAll('a[href="/pricing"], a[href="/terms-and-conditions"], a[href="/privacy-policy"], a[href="/refund-and-cancellation"], a[href="/shipping-policy"]').length;
    });

    if (footerLinksCount !== 5) {
      throw new Error(`Expected 5 compliance footer links on ${route}, found ${footerLinksCount}`);
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
