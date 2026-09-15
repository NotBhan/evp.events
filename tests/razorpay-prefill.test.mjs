import assert from 'node:assert/strict';
import { buildCheckoutPrefill, isMaskedContactValue } from '../lib/payments/razorpayClient.ts';

function run(name, fn) {
  fn();
  console.log('✓', name);
}

console.log('RAAS UTSAV 2026 — Razorpay Checkout Prefill Sanitization Tests\n');

// CASE 1 — Normal booking: genuine values are preserved.
run('normal booking prefill keeps genuine name/email/contact', () => {
  const prefill = buildCheckoutPrefill({
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    contact: '9931503960',
  });
  assert.deepStrictEqual(prefill, {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    contact: '9931503960',
  });
});

// CASE 2 — Recovered booking: masked values are dropped.
run('recovered booking prefill drops masked email/contact', () => {
  const prefill = buildCheckoutPrefill({
    name: 'Rahul Sharma',
    email: 'r•••••a@example.com',
    contact: '+91 ••••• •6510',
  });
  assert.deepStrictEqual(prefill, { name: 'Rahul Sharma' });
});

// CASE 3 — Partial data: only genuine fields are passed.
run('partial prefill passes only genuine fields', () => {
  assert.deepStrictEqual(
    buildCheckoutPrefill({ name: 'Rahul Sharma', email: '', contact: '+91 ••••• •6510' }),
    { name: 'Rahul Sharma' }
  );
  assert.deepStrictEqual(
    buildCheckoutPrefill({ name: 'Rahul Sharma', email: 'rahul@example.com', contact: '+91 ••••• •6510' }),
    { name: 'Rahul Sharma', email: 'rahul@example.com' }
  );
});

// CASE 4 — Masked-looking values are never treated as genuine.
run('masked-looking values are detected', () => {
  assert.strictEqual(isMaskedContactValue('ab****@gmail.com'), true);
  assert.strictEqual(isMaskedContactValue('+91 ••••• •6510'), true);
  assert.strictEqual(isMaskedContactValue('r•••••a@example.com'), true);
  assert.strictEqual(isMaskedContactValue('name…@example.com'), true);
  assert.strictEqual(isMaskedContactValue('rahul@example.com'), false);
  assert.strictEqual(isMaskedContactValue('9931503960'), false);
  assert.strictEqual(isMaskedContactValue(null), false);
  assert.strictEqual(isMaskedContactValue(undefined), false);
  assert.strictEqual(isMaskedContactValue(''), false);
});

// CASE 5 — No contact data: prefill collapses to an empty object (Checkout still opens).
run('no contact data yields empty prefill', () => {
  assert.deepStrictEqual(buildCheckoutPrefill(undefined), {});
  assert.deepStrictEqual(buildCheckoutPrefill({}), {});
  assert.deepStrictEqual(buildCheckoutPrefill({ name: '', email: '', contact: '' }), {});
  assert.deepStrictEqual(buildCheckoutPrefill({ name: 'Rahul Sharma' }), { name: 'Rahul Sharma' });
});

console.log('\nAll prefill sanitization tests passed.');
