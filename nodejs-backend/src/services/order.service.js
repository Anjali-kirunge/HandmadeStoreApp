const db = require('../config/db');
const { transaction } = require('../config/db');
const { mapOrder, mapOrderItem, mapUser, num } = require('../utils/mappers');
const { pageResponse } = require('../utils/response');
const { ResourceNotFoundException, BadRequestException, AccessDeniedException } = require('../utils/errors');
const { OrderStatus, PaymentMethod } = require('../utils/enums');
const couponService = require('./coupon.service');
const notificationService = require('./notification.service');
const { audit } = require('./audit.service');
const { fullProduct } = require('./product.service');

async function orderResponse(row) {
  const itemsRows = await db.query(
    `SELECT oi.id, oi.quantity, oi.price, oi.created_at, p.*
     FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [row.id]
  );
  const items = [];
  for (const it of itemsRows) {
    items.push(mapOrderItem(
      { id: it.id, quantity: it.quantity, price: it.price },
      it.p_id ? await fullProduct(it) : null
    ));
  }
  return mapOrder(row, items);
}

async function orderResponseWithUser(row) {
  const base = await orderResponse(row);
  const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [row.user_id]);
  base.user = mapUser(user);
  return base;
}

async function getOwnOrder(userId, id) {
  const row = await db.queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId]);
  if (!row) throw new ResourceNotFoundException('Order', 'id', id);
  return orderResponse(row);
}

async function listUserOrders(userId, { page = 0, size = 10 }) {
  const [countRow] = await db.query('SELECT COUNT(*) AS total FROM orders WHERE user_id = ?', [userId]);
  const totalElements = num(countRow.total);
  const rows = await db.query(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [userId, size, page * size]
  );
  const content = [];
  for (const row of rows) content.push(await orderResponse(row));
  return pageResponse(content, page, size, totalElements);
}

async function placeOrder(userId, request, paymentInfo = null) {
  const orderRow = await transaction(async (tx) => {
    const cart = await tx.queryOne('SELECT * FROM carts WHERE user_id = ?', [userId]);
    if (!cart) throw new BadRequestException('Your cart is empty');
    const items = await tx.query('SELECT * FROM cart_items WHERE cart_id = ?', [cart.id]);
    if (!items.length) throw new BadRequestException('Your cart is empty');

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await tx.queryOne('SELECT * FROM products WHERE id = ?', [item.product_id]);
      if (!product) throw new ResourceNotFoundException('Product', 'id', item.product_id);
      if (item.quantity > product.stock_quantity) {
        throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
      }
      const price = product.discount_price !== null && product.discount_price !== undefined ? num(product.discount_price) : num(product.price);
      total += price * item.quantity;
      orderItems.push({ product, quantity: item.quantity, price });
    }

    let discount = 0;
    if (request.couponCode) {
      const coupon = await tx.queryOne('SELECT * FROM coupons WHERE code = ?', [String(request.couponCode).trim().toUpperCase()]);
      if (!coupon) throw new BadRequestException(`Invalid coupon code: ${request.couponCode}`);
      const result = couponService.evaluateCoupon(coupon, total);
      discount = result.discount;
      await tx.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id]);
    }

    const finalTotal = Math.round((total - discount) * 100) / 100;
    const paymentMethod = request.paymentMethod || 'COD';
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new BadRequestException('Invalid payment method');
    }

    const now = new Date();
    const shippingAddress = request.shippingAddress === null || request.shippingAddress === undefined
      ? null
      : typeof request.shippingAddress === 'object'
        ? JSON.stringify(request.shippingAddress)
        : String(request.shippingAddress);
    const orderResult = await tx.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, order_status, payment_method, payment_status, tracking_number, notes, created_at, updated_at)
       VALUES (?, ?, ?, 'PENDING', ?, 'PENDING', NULL, ?, ?, ?)`,
      [userId, finalTotal, shippingAddress, paymentMethod, request.notes || null, now, now]
    );
    const orderId = orderResult.insertId;

    for (const oi of orderItems) {
      await tx.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, created_at) VALUES (?, ?, ?, ?, ?)',
        [orderId, oi.product.id, oi.quantity, oi.price, now]
      );
      const newStock = oi.product.stock_quantity - oi.quantity;
      const newStatus = newStock === 0 ? 'OUT_OF_STOCK' : oi.product.status;
      await tx.query('UPDATE products SET stock_quantity = ?, status = ? WHERE id = ?', [newStock, newStatus, oi.product.id]);
    }

    await tx.query(
      'INSERT INTO payments (order_id, user_id, amount, payment_method, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, userId, finalTotal, paymentMethod, paymentInfo && paymentInfo.status ? paymentInfo.status : 'PENDING', now]
    );

    if (paymentInfo && paymentInfo.type === 'RAZORPAY') {
      const existing = await tx.queryOne(
        'SELECT id FROM razorpay_payments WHERE razorpay_order_id = ?',
        [paymentInfo.razorpayOrderId]
      );
      if (existing) {
        await tx.query(
          `UPDATE razorpay_payments
           SET razorpay_payment_id = ?, razorpay_signature = ?, amount = ?, status = 'COMPLETED', order_id = ?
           WHERE razorpay_order_id = ?`,
          [paymentInfo.razorpayPaymentId, paymentInfo.razorpaySignature, finalTotal, orderId, paymentInfo.razorpayOrderId]
        );
      } else {
        await tx.query(
          `INSERT INTO razorpay_payments (user_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, status, order_id, created_at)
           VALUES (?, ?, ?, ?, ?, 'INR', 'COMPLETED', ?, ?)`,
          [userId, paymentInfo.razorpayOrderId, paymentInfo.razorpayPaymentId, paymentInfo.razorpaySignature, finalTotal, orderId, now]
        );
      }
    }

    await tx.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);

    const created = await tx.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    await audit(userId, 'CREATE', 'ORDER', orderId, null, { totalAmount: finalTotal, paymentMethod }, null).catch(() => {});
    return created;
  });

  return orderResponse(orderRow);
}

async function cancelOrder(userId, id) {
  const row = await db.queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId]);
  if (!row) throw new ResourceNotFoundException('Order', 'id', id);
  if (!['PENDING', 'CONFIRMED'].includes(row.order_status)) {
    throw new BadRequestException('Order can only be cancelled when it is PENDING or CONFIRMED');
  }
  const updated = await transaction(async (tx) => {
    const items = await tx.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      const product = await tx.queryOne('SELECT * FROM products WHERE id = ?', [item.product_id]);
      if (product) {
        const newStatus = product.stock_quantity === 0 && product.status === 'OUT_OF_STOCK' ? 'ACTIVE' : product.status;
        await tx.query('UPDATE products SET stock_quantity = stock_quantity + ?, status = ? WHERE id = ?', [item.quantity, newStatus, product.id]);
      }
    }
    const newPaymentStatus = row.payment_status === 'COMPLETED' ? 'REFUNDED' : row.payment_status;
    await tx.query(
      "UPDATE orders SET order_status = 'CANCELLED', payment_status = ?, updated_at = ? WHERE id = ?",
      [newPaymentStatus, new Date(), id]
    );
    await tx.query('UPDATE payments SET payment_status = ? WHERE order_id = ?', [newPaymentStatus, id]);
    await notificationService.notify(userId, `Order Cancelled: #${id}`, `Your order #${id} has been cancelled.`, `/orders/${id}`);
    return tx.queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  });
  return { message: 'Order cancelled successfully', order: orderResponse(updated) };
}

async function adminListOrders({ keyword, status, page = 0, size = 10 }) {
  const where = [];
  const params = [];
  if (keyword) {
    where.push('(o.id = ? OR u.email LIKE ? OR o.shipping_address LIKE ?)');
    const like = `%${keyword}%`;
    params.push(Number(keyword) || -1, like, like);
  }
  if (status) {
    where.push('o.order_status = ?');
    params.push(status);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [countRow] = await db.query(
    `SELECT COUNT(*) AS total FROM orders o JOIN users u ON u.id = o.user_id ${whereSql}`,
    params
  );
  const totalElements = num(countRow.total);
  const rows = await db.query(
    `SELECT o.* FROM orders o JOIN users u ON u.id = o.user_id ${whereSql} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    [...params, size, page * size]
  );
  const content = [];
  for (const row of rows) content.push(await orderResponseWithUser(row));
  return pageResponse(content, page, size, totalElements);
}

async function adminGetOrder(id) {
  const row = await db.queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  if (!row) throw new ResourceNotFoundException('Order', 'id', id);
  return orderResponseWithUser(row);
}

async function adminListOrdersByStatus(status, { page = 0, size = 10 }) {
  const [countRow] = await db.query('SELECT COUNT(*) AS total FROM orders WHERE order_status = ?', [status]);
  const totalElements = num(countRow.total);
  const rows = await db.query(
    'SELECT * FROM orders WHERE order_status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [status, size, page * size]
  );
  const content = [];
  for (const row of rows) content.push(await orderResponseWithUser(row));
  return pageResponse(content, page, size, totalElements);
}

async function updateOrderStatus(actorId, orderId, { orderStatus, trackingNumber }, isAdmin) {
  const row = await db.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!row) throw new ResourceNotFoundException('Order', 'id', orderId);
  if (!Object.values(OrderStatus).includes(orderStatus)) {
    throw new BadRequestException('Invalid order status');
  }
  const updated = await transaction(async (tx) => {
    await tx.query(
      'UPDATE orders SET order_status = ?, tracking_number = ?, updated_at = ? WHERE id = ?',
      [orderStatus, trackingNumber !== undefined ? trackingNumber : row.tracking_number, new Date(), orderId]
    );
    if (orderStatus === 'DELIVERED') {
      await tx.query(
        "UPDATE orders SET payment_status = 'COMPLETED' WHERE id = ? AND payment_status = 'PENDING'",
        [orderId]
      );
      await tx.query(
        "UPDATE payments SET payment_status = 'COMPLETED' WHERE order_id = ? AND payment_status = 'PENDING'",
        [orderId]
      );
    }
    const updatedRow = await tx.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    const title = `Order Update: #${orderId}`;
    const message = `Your order status has been updated to ${orderStatus}.`;
    await notificationService.notify(row.user_id, title, message, `/orders/${orderId}`);
    await audit(actorId, 'UPDATE', 'ORDER', orderId, { order_status: row.order_status }, { order_status: orderStatus }, null).catch(() => {});
    return updatedRow;
  });
  return orderResponse(updated);
}

async function sellerListOrders(sellerId, { page = 0, size = 10 }) {
  const whereSql = `WHERE o.id IN (
    SELECT DISTINCT oi.order_id FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE p.seller_id = ?
  )`;
  const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`, [sellerId]);
  const totalElements = num(countRow.total);
  const rows = await db.query(
    `SELECT o.* FROM orders o ${whereSql} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    [sellerId, size, page * size]
  );
  const content = [];
  for (const row of rows) content.push(await orderResponseWithUser(row));
  return pageResponse(content, page, size, totalElements);
}

async function sellerGetOrder(sellerId, id) {
  const row = await db.queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  if (!row) throw new ResourceNotFoundException('Order', 'id', id);
  const hasProduct = await db.queryOne(
    'SELECT 1 FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ? AND p.seller_id = ? LIMIT 1',
    [id, sellerId]
  );
  if (!hasProduct) throw new AccessDeniedException();
  return orderResponseWithUser(row);
}

module.exports = {
  placeOrder,
  getOwnOrder,
  listUserOrders,
  cancelOrder,
  adminListOrders,
  adminGetOrder,
  adminListOrdersByStatus,
  updateOrderStatus,
  sellerListOrders,
  sellerGetOrder,
  orderResponse,
  orderResponseWithUser,
};
