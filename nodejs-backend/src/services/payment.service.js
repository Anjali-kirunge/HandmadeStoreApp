const crypto = require('crypto');
const db = require('../config/db');
const env = require('../config/env');
const { mapPayment, mapUser, num } = require('../utils/mappers');
const { pageResponse } = require('../utils/response');
const { BadRequestException, ResourceNotFoundException } = require('../utils/errors');
const cartService = require('./cart.service');
const couponService = require('./coupon.service');
const orderService = require('./order.service');

let razorpay = null;
try {
  if (env.razorpay.keyId && env.razorpay.keySecret) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  }
} catch (err) {
  razorpay = null;
}

async function computeCartTotal(userId, couponCode) {
  const cart = await cartService.cartResponse(userId);
  if (!cart.items.length) throw new BadRequestException('Your cart is empty');
  let total = cart.totalPrice;
  let discount = 0;
  if (couponCode) {
    const result = await couponService.applyCoupon(couponCode, total);
    discount = result.discount;
  }
  return { total: Math.round((total - discount) * 100) / 100, discount };
}

async function createOrder(userId, request) {
  if (!razorpay) {
    throw new BadRequestException('Razorpay is not configured. Please use COD instead.');
  }
  const { total } = await computeCartTotal(userId, request.couponCode);
  const amountPaise = Math.round(total * 100);

  const existing = await db.queryOne(
    'SELECT * FROM razorpay_payments WHERE user_id = ? AND status = ? AND amount = ? ORDER BY created_at DESC',
    [userId, 'PENDING', total]
  );
  if (existing) {
    return {
      razorpayOrderId: existing.razorpay_order_id,
      amount: Math.round(existing.amount * 100),
      amountInRupees: existing.amount,
      currency: existing.currency,
      keyId: env.razorpay.keyId,
    };
  }

  let rzpOrder;
  try {
    rzpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });
  } catch (err) {
    console.error('[RAZORPAY ORDER ERROR]', err.message || err.description || err);
    throw new BadRequestException('Failed to create Razorpay order: ' + (err.message || err.description || 'unknown error'));
  }

  await db.query(
    `INSERT INTO razorpay_payments (user_id, razorpay_order_id, amount, currency, status, created_at)
     VALUES (?, ?, ?, 'INR', 'PENDING', ?)`,
    [userId, rzpOrder.id, total, new Date()]
  );

  return {
    razorpayOrderId: rzpOrder.id,
    amount: amountPaise,
    amountInRupees: total,
    currency: 'INR',
    keyId: env.razorpay.keyId,
  };
}

function verifySignature(orderId, paymentId, signature) {
  if (!razorpay) {
    throw new BadRequestException('Razorpay is not configured');
  }
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

async function verify(userId, request) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderRequest } = request;
  if (!verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    throw new BadRequestException('Invalid Razorpay signature');
  }
  const paymentInfo = {
    type: 'RAZORPAY',
    status: 'COMPLETED',
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  };
  return orderService.placeOrder(userId, orderRequest, paymentInfo);
}

async function createCheckoutSession(userId, orderId) {
  const order = await orderService.adminGetOrder(orderId).catch(() => null);
  if (!order) throw new ResourceNotFoundException('Order', 'id', orderId);
  return {
    sessionId: `demo_${Date.now()}`,
    url: null,
    message: 'Stripe is a demo in this app. Use Razorpay or COD.',
  };
}

async function webhook(body, signature) {
  return { message: 'Webhook received (demo mode, skipped processing)' };
}

async function listUserPayments(userId) {
  const rows = await db.query('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map((r) => mapPayment(r));
}

async function adminListPayments({ status, page = 0, size = 10 }) {
  const where = [];
  const params = [];
  if (status) {
    where.push('payment_status = ?');
    params.push(status);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM payments ${whereSql}`, params);
  const totalElements = num(countRow.total);
  const rows = await db.query(
    `SELECT * FROM payments ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, size, page * size]
  );
  const content = [];
  for (const row of rows) {
    const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [row.user_id]);
    content.push(mapPayment(row, mapUser(user)));
  }
  return pageResponse(content, page, size, totalElements);
}

module.exports = {
  createOrder,
  verify,
  createCheckoutSession,
  webhook,
  listUserPayments,
  adminListPayments,
};
