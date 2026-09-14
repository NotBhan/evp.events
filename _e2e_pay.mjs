import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const url = fs.readFileSync('/tmp/_checkout_url.txt', 'utf8').trim();
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

async function typeSel(sels, text) {
  for (const s of sels) {
    const el = await page.$(s);
    if (el) { await el.click({ clickCount: 3 }); await el.type(text); return s; }
  }
  return null;
}

// Card info
await typeSel(['#cardNumber'], '4242424242424242');
await typeSel(['#cardExpiry'], '1234');
await typeSel(['#cardCvc'], '123');
await typeSel(['#billingName'], 'E2E Test User');

// Billing address (manual)
await typeSel(['#billingAddressLine1'], '123 Test Street');
await typeSel(['#billingLocality'], 'Ranchi');
await typeSel(['#billingPostalCode'], '834001');

await page.keyboard.press('Escape');

// Country -> India
try { await page.select('#billingCountry', 'IN'); } catch {}

// State -> Jharkhand or first available
const stateVal = await page.evaluate(() => {
  const sel = document.querySelector('#billingAdministrativeArea');
  if (!sel) return '';
  const opts = Array.from(sel.options).map((o) => o.value).filter((v) => v);
  const jh = opts.find((v) => /JH|Jhar/i.test(v));
  return jh || opts[0] || '';
});
console.log('STATE_VALUE:', stateVal);
if (stateVal) { try { await page.select('#billingAdministrativeArea', stateVal); } catch (e) { console.log('state select err', e.message); } }

await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: '/tmp/_checkout_before_pay.png' });

const payClicked = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const pay = btns.find((b) => /pay/i.test(b.textContent));
  if (pay) { pay.click(); return true; }
  return false;
});
console.log('payClicked:', payClicked);

try {
  await page.waitForFunction(() => /booking\?status=success/.test(location.href), { timeout: 120000 });
  console.log('REDIRECT_SUCCESS:', page.url());
} catch (e) {
  console.log('NO_REDIRECT url:', page.url());
  console.log('BODY:', (await page.evaluate(() => document.body.innerText)).slice(0, 600));
  await page.screenshot({ path: '/tmp/_checkout_fail2.png' });
}

await browser.close();
