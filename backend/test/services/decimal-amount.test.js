const test = require('node:test');
const assert = require('node:assert/strict');

const {
  add,
  divide,
  DecimalAmount,
  formatHalfUp,
  normalizeDecimal,
} = require('../../src/services/decimal-amount.js');

test('decimal addition and division avoid IEEE float drift', () => {
  assert.equal(add(0.1, 0.2), 0.3);
  assert.equal(divide(0.1, 0.2), 0.5);
});

test('half-up formatting keeps one decimal place and preserves the exact value', () => {
  assert.equal(formatHalfUp(100, 1), '100.0');
  assert.equal(formatHalfUp(0, 1), '0.0');

  const justAboveFifteen = 15.000000000000004;
  const amount = DecimalAmount.from(justAboveFifteen);

  assert.equal(amount.toDisplay(1), '15.0');
  assert.equal(amount.toNumber(), justAboveFifteen);
});

test('decimal normalization preserves integer zeros and supports equivalent decimal notation', () => {
  assert.deepEqual(normalizeDecimal(10), { coefficient: 10n, scale: 0 });
  assert.deepEqual(normalizeDecimal('1.20'), { coefficient: 12n, scale: 1 });
  assert.deepEqual(normalizeDecimal('1e-7'), { coefficient: 1n, scale: 7 });
  assert.equal(add('1.20', 8.8), 10);
});
