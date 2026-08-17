const db = require('../config/db');
const { num, mapProduct, mapUser } = require('../utils/mappers');
const { OrderStatus } = require('../utils/enums');
const { orderResponse } = require('./order.service');
const { fullProduct } = require('./product.service');

const MONTHS = 12;

async function monthlySeries(salesRows) {
  const series = new Array(MONTHS).fill(0);
  for (const row of salesRows) {
    const monthIdx = row.m - 1;
    if (monthIdx >= 0 && monthIdx < MONTHS) series[monthIdx] = num(row.total);
  }
  return series;
}

async function orderStatusCounts() {
  const rows = await db.query('SELECT order_status, COUNT(*) AS total FROM orders GROUP BY order_status');
  const map = {};
  for (const s of Object.values(OrderStatus)) map[s] = 0;
  for (const row of rows) map[row.order_status] = num(row.total);
  return map;
}

async function adminDashboard() {
  const [
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    revenueRow,
    recentOrders,
    monthlyRows,
    counts,
  ] = await Promise.all([
    db.queryOne('SELECT COUNT(*) AS total FROM users'),
    db.queryOne("SELECT COUNT(*) AS total FROM users WHERE role = 'ROLE_SELLER'"),
    db.queryOne('SELECT COUNT(*) AS total FROM products'),
    db.queryOne('SELECT COUNT(*) AS total FROM orders'),
    db.queryOne("SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE payment_status = 'COMPLETED'"),
    db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5'),
    db.query('SELECT MONTH(created_at) AS m, SUM(total_amount) AS total FROM orders WHERE YEAR(created_at) = YEAR(NOW()) AND payment_status = \'COMPLETED\' GROUP BY MONTH(created_at)'),
    orderStatusCounts(),
  ]);

  const recent = [];
  for (const row of recentOrders) recent.push(await orderResponse(row));

  return {
    totalUsers: num(totalUsers.total),
    totalSellers: num(totalSellers.total),
    totalProducts: num(totalProducts.total),
    totalOrders: num(totalOrders.total),
    totalRevenue: Math.round(num(revenueRow.total) * 100) / 100,
    recentOrders: recent,
    monthlySales: await monthlySeries(monthlyRows),
    orderStatusCounts: counts,
  };
}

async function sellerDashboard(sellerId) {
  const productCount = await db.queryOne('SELECT COUNT(*) AS total FROM products WHERE seller_id = ?', [sellerId]);
  const ordersCount = await db.queryOne(
    `SELECT COUNT(*) AS total FROM orders WHERE id IN (
      SELECT DISTINCT oi.order_id FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE p.seller_id = ?
    )`,
    [sellerId]
  );
  const revenueRow = await db.queryOne(
    `SELECT COALESCE(SUM(o.total_amount), 0) AS total FROM orders o WHERE o.payment_status = 'COMPLETED' AND o.id IN (
      SELECT DISTINCT oi.order_id FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE p.seller_id = ?
    )`,
    [sellerId]
  );
  const pendingOrders = await db.queryOne(
    `SELECT COUNT(*) AS total FROM orders WHERE order_status = 'PENDING' AND id IN (
      SELECT DISTINCT oi.order_id FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE p.seller_id = ?
    )`,
    [sellerId]
  );
  const recentOrders = await db.query(
    `SELECT o.* FROM orders o WHERE o.id IN (
      SELECT DISTINCT oi.order_id FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE p.seller_id = ?
    ) ORDER BY o.created_at DESC LIMIT 5`,
    [sellerId]
  );
  const monthlyRows = await db.query(
    `SELECT MONTH(o.created_at) AS m, SUM(o.total_amount) AS total FROM orders o
     WHERE o.payment_status = 'COMPLETED' AND YEAR(o.created_at) = YEAR(NOW()) AND o.id IN (
      SELECT DISTINCT oi.order_id FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE p.seller_id = ?
     ) GROUP BY MONTH(o.created_at)`,
    [sellerId]
  );
  const topProductsRows = await db.query(
    `SELECT p.*, SUM(oi.quantity) AS total_sold FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE p.seller_id = ?
     GROUP BY p.id ORDER BY total_sold DESC LIMIT 5`,
    [sellerId]
  );

  const recent = [];
  for (const row of recentOrders) recent.push(await orderResponse(row));
  const topProducts = [];
  for (const row of topProductsRows) topProducts.push(await fullProduct(row));

  return {
    totalProducts: num(productCount.total),
    totalOrders: num(ordersCount.total),
    totalRevenue: Math.round(num(revenueRow.total) * 100) / 100,
    pendingOrders: num(pendingOrders.total),
    recentOrders: recent,
    monthlyEarnings: await monthlySeries(monthlyRows),
    topProducts,
  };
}

module.exports = { adminDashboard, sellerDashboard };
