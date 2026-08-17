const db = require('../config/db');
const { num, mapUser, mapCategory, mapCoupon, mapProduct } = require('../utils/mappers');
const { fullProduct } = require('./product.service');

async function globalSearch(q, limit = 10) {
  const keyword = String(q || '').trim();
  const like = `%${keyword}%`;
  const l = num(limit) > 0 ? Math.min(num(limit), 20) : 10;

  const productRows = keyword
    ? await db.query(
        'SELECT * FROM products WHERE name LIKE ? OR description LIKE ? OR sku LIKE ? LIMIT ?',
        [like, like, like, l]
      )
    : [];
  const userRows = keyword
    ? await db.query('SELECT * FROM users WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ? LIMIT ?', [like, like, like, l])
    : [];
  const orderRows = keyword
    ? await db.query('SELECT * FROM orders WHERE id = ? OR shipping_address LIKE ? LIMIT ?', [Number(keyword) || -1, like, l])
    : [];
  const categoryRows = keyword
    ? await db.query('SELECT * FROM categories WHERE name LIKE ? OR description LIKE ? LIMIT ?', [like, like, l])
    : [];
  const couponRows = keyword
    ? await db.query('SELECT * FROM coupons WHERE code LIKE ? LIMIT ?', [like, l])
    : [];

  const products = [];
  for (const row of productRows) products.push(await fullProduct(row));

  const totalResults =
    products.length + userRows.length + orderRows.length + categoryRows.length + couponRows.length;

  return {
    products,
    users: userRows.map(mapUser),
    orders: orderRows.map((r) => ({ id: num(r.id), totalAmount: num(r.total_amount), orderStatus: r.order_status, paymentStatus: r.payment_status, createdAt: r.created_at })),
    categories: categoryRows.map((r) => mapCategory(r)),
    coupons: couponRows.map(mapCoupon),
    totalResults,
  };
}

module.exports = { globalSearch };
