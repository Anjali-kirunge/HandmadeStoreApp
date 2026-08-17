const test = require('node:test');
const assert = require('node:assert');
const { bool, num, toIso, mapUser, mapProduct } = require('../src/utils/mappers');

test('bool handles BIT column buffers', () => {
  assert.strictEqual(bool(Buffer.from([1])), true);
  assert.strictEqual(bool(Buffer.from([0])), false);
  assert.strictEqual(bool(1), true);
  assert.strictEqual(bool(0), false);
  assert.strictEqual(bool('1'), true);
  assert.strictEqual(bool('0'), false);
  assert.strictEqual(bool(true), true);
  assert.strictEqual(bool(false), false);
  assert.strictEqual(bool(null), false);
  assert.strictEqual(bool(undefined), false);
});

test('num coerces numeric values', () => {
  assert.strictEqual(num('12.50'), 12.5);
  assert.strictEqual(num(7), 7);
  assert.strictEqual(num('abc'), 0);
  assert.strictEqual(num(null), 0);
});

test('toIso formats dates as YYYY-MM-DD HH:mm:ss', () => {
  const d = new Date('2026-01-02T03:04:05Z');
  assert.strictEqual(toIso(d), '2026-01-02 03:04:05');
  assert.strictEqual(toIso(null), null);
  assert.strictEqual(toIso('garbage'), null);
});

test('mapUser maps BIT enabled correctly', () => {
  const row = { id: 1, first_name: 'A', last_name: 'B', email: 'a@b.c', phone: '123', avatar: null, role: 'ROLE_CUSTOMER', enabled: Buffer.from([1]), created_at: new Date('2026-01-02T03:04:05Z') };
  const u = mapUser(row);
  assert.strictEqual(u.enabled, true);
  assert.strictEqual(u.firstName, 'A');
  assert.strictEqual(u.role, 'ROLE_CUSTOMER');
});

test('mapProduct maps is_featured BIT buffer', () => {
  const row = { id: 1, name: 'P', description: 'D', sku: 'S', price: '10.00', discount_price: null, stock_quantity: 5, image_url: null, rating: 4.5, review_count: 3, status: 'ACTIVE', is_featured: Buffer.from([1]), created_at: new Date('2026-01-02T03:04:05Z') };
  const p = mapProduct(row);
  assert.strictEqual(p.isFeatured, true);
  assert.strictEqual(p.price, 10);
});
