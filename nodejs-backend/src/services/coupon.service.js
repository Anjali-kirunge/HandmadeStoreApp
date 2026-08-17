const db = require('../config/db');
const { mapCoupon, num, toIso, bool } = require('../utils/mappers');
const { ResourceNotFoundException, BadRequestException } = require('../utils/errors');
const { audit } = require('./audit.service');

function evaluateCoupon(coupon, orderTotal) {
  const now = new Date();
  if (!bool(coupon.active)) throw new BadRequestException(`Coupon ${coupon.code} is not active`);
  if (coupon.used_count >= coupon.usage_limit) {
    throw new BadRequestException(`Coupon ${coupon.code} has reached its usage limit`);
  }
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    throw new BadRequestException(`Coupon ${coupon.code} is not valid yet`);
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    throw new BadRequestException(`Coupon ${coupon.code} has expired`);
  }
  if (num(orderTotal) < num(coupon.min_purchase)) {
    throw new BadRequestException(`Minimum purchase amount for this coupon is ${coupon.min_purchase}`);
  }
  const discount = Math.min((num(orderTotal) * num(coupon.discount_percentage)) / 100, num(coupon.max_discount));
  return { discount: Math.round(discount * 100) / 100, finalTotal: Math.round((num(orderTotal) - discount) * 100) / 100 };
}

async function findCoupon(code) {
  const row = await db.queryOne('SELECT * FROM coupons WHERE code = ?', [String(code).trim().toUpperCase()]);
  return row;
}

async function applyCoupon(code, orderTotal) {
  const coupon = await findCoupon(code);
  if (!coupon) throw new BadRequestException(`Invalid coupon code: ${code}`);
  const { discount, finalTotal } = evaluateCoupon(coupon, orderTotal);
  return {
    message: `Coupon ${coupon.code} applied successfully`,
    discount,
    finalTotal,
    couponCode: coupon.code,
  };
}

async function validateCoupon(code, orderTotal) {
  const coupon = await findCoupon(code);
  if (!coupon) {
    return { valid: false, message: `Invalid coupon code: ${code}`, discountPercentage: 0, maxDiscount: 0, discount: 0, finalTotal: num(orderTotal) };
  }
  try {
    const { discount, finalTotal } = evaluateCoupon(coupon, orderTotal);
    return {
      valid: true,
      discountPercentage: num(coupon.discount_percentage),
      maxDiscount: num(coupon.max_discount),
      discount,
      finalTotal,
    };
  } catch (err) {
    return { valid: false, message: err.message, discountPercentage: num(coupon.discount_percentage), maxDiscount: num(coupon.max_discount), discount: 0, finalTotal: num(orderTotal) };
  }
}

async function listCoupons() {
  const rows = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
  return rows.map(mapCoupon);
}

async function getCoupon(id) {
  const row = await db.queryOne('SELECT * FROM coupons WHERE id = ?', [id]);
  if (!row) throw new ResourceNotFoundException('Coupon', 'id', id);
  return mapCoupon(row);
}

async function createCoupon(body, actor) {
  if (!body.code) throw new BadRequestException('Coupon code is required');
  const dup = await db.queryOne('SELECT id FROM coupons WHERE code = ?', [String(body.code).trim().toUpperCase()]);
  if (dup) throw new BadRequestException(`Coupon with code ${body.code} already exists`);
  const result = await db.query(
    `INSERT INTO coupons (code, discount_percentage, max_discount, min_purchase, usage_limit, used_count, valid_from, valid_until, active, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    [
      String(body.code).trim().toUpperCase(),
      num(body.discountPercentage),
      num(body.maxDiscount),
      num(body.minPurchase),
      body.usageLimit !== undefined ? num(body.usageLimit) : 100,
      body.validFrom ? new Date(body.validFrom) : new Date(),
      body.validUntil ? new Date(body.validUntil) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      body.active !== undefined ? (body.active ? 1 : 0) : 1,
      new Date(),
    ]
  );
  await audit(actor, 'CREATE', 'COUPON', result.insertId, null, { code: body.code }, null);
  return getCoupon(result.insertId);
}

async function updateCoupon(id, body, actor) {
  const existing = await db.queryOne('SELECT * FROM coupons WHERE id = ?', [id]);
  if (!existing) throw new ResourceNotFoundException('Coupon', 'id', id);
  const newCode = body.code !== undefined ? String(body.code).trim().toUpperCase() : existing.code;
  const dup = await db.queryOne('SELECT id FROM coupons WHERE code = ? AND id != ?', [newCode, id]);
  if (dup) throw new BadRequestException(`Coupon with code ${body.code} already exists`);
  await db.query(
    `UPDATE coupons SET
       code = ?, discount_percentage = ?, max_discount = ?, min_purchase = ?,
       usage_limit = ?, valid_from = ?, valid_until = ?, active = ? WHERE id = ?`,
    [
      newCode,
      body.discountPercentage !== undefined ? num(body.discountPercentage) : existing.discount_percentage,
      body.maxDiscount !== undefined ? num(body.maxDiscount) : existing.max_discount,
      body.minPurchase !== undefined ? num(body.minPurchase) : existing.min_purchase,
      body.usageLimit !== undefined ? num(body.usageLimit) : existing.usage_limit,
      body.validFrom !== undefined ? new Date(body.validFrom) : existing.valid_from,
      body.validUntil !== undefined ? new Date(body.validUntil) : existing.valid_until,
      body.active !== undefined ? (body.active ? 1 : 0) : bool(existing.active) ? 1 : 0,
      id,
    ]
  );
  await audit(actor, 'UPDATE', 'COUPON', id, { code: existing.code }, { code: newCode }, null);
  return getCoupon(id);
}

async function toggleCoupon(id, actor) {
  const existing = await db.queryOne('SELECT * FROM coupons WHERE id = ?', [id]);
  if (!existing) throw new ResourceNotFoundException('Coupon', 'id', id);
  const active = bool(existing.active) ? 0 : 1;
  await db.query('UPDATE coupons SET active = ? WHERE id = ?', [active, id]);
  await audit(actor, 'UPDATE', 'COUPON', id, { active: existing.active }, { active }, null);
  return getCoupon(id);
}

async function deleteCoupon(id, actor) {
  const existing = await db.queryOne('SELECT * FROM coupons WHERE id = ?', [id]);
  if (!existing) throw new ResourceNotFoundException('Coupon', 'id', id);
  await db.query('DELETE FROM coupons WHERE id = ?', [id]);
  await audit(actor, 'DELETE', 'COUPON', id, { code: existing.code }, null, null);
  return { message: 'Coupon deleted successfully' };
}

module.exports = { applyCoupon, validateCoupon, evaluateCoupon, listCoupons, getCoupon, createCoupon, updateCoupon, toggleCoupon, deleteCoupon };
