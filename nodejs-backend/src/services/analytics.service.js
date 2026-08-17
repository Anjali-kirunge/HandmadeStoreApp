const db = require('../config/db');
const { num, toIso } = require('../utils/mappers');
const { OrderStatus, PaymentStatus } = require('../utils/enums');

function isoDate(date) {
  if (!date) return new Date();
  return new Date(date);
}

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function monthKey(d) {
  return d.toISOString().slice(0, 7);
}

function fmtIso(dt) {
  if (!dt) return null;
  return toIso(dt);
}

function distribution(rows, values, col) {
  const map = {};
  for (const v of values) map[v] = 0;
  for (const row of rows) map[row[col]] = num(row.count);
  return map;
}

function joinedWhere(whereSql) {
  if (!whereSql) return '';
  return whereSql.replace(/\bcreated_at\b/g, 'o.created_at');
}

async function analytics({ from, to, topN = 5 }) {
  const fromDate = from ? isoDate(from) : null;
  const toDate = to ? isoDate(to) : null;
  const where = [];
  const params = [];
  if (fromDate) {
    where.push('created_at >= ?');
    params.push(fromDate);
  }
  if (toDate) {
    where.push('created_at <= ?');
    params.push(toDate);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const completedOrdersWhere = `${whereSql ? whereSql + ' AND' : 'WHERE'} payment_status = 'COMPLETED'`;

  const [
    revenue,
    orders,
    customers,
    sellers,
    products,
    todayRev,
    todayOrders,
    weekRev,
    weekOrders,
    monthRev,
    monthOrders,
    yearRev,
    yearOrders,
    dailyRows,
    monthlyRows,
    yearlyRows,
    topProducts,
    topCustomers,
    categoryBreakdown,
    orderStatusRows,
    paymentStatusRows,
  ] = await Promise.all([
    db.queryOne(`SELECT COALESCE(SUM(total_amount),0) AS total FROM orders ${completedOrdersWhere}`, params),
    db.queryOne(`SELECT COUNT(*) AS total FROM orders ${whereSql}`, params),
    db.queryOne(`SELECT COUNT(*) AS total FROM users WHERE role = 'ROLE_CUSTOMER'`),
    db.queryOne(`SELECT COUNT(*) AS total FROM users WHERE role = 'ROLE_SELLER'`),
    db.queryOne('SELECT COUNT(*) AS total FROM products'),
    db.queryOne("SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE payment_status = 'COMPLETED' AND DATE(created_at) = CURDATE()"),
    db.queryOne("SELECT COUNT(*) AS total FROM orders WHERE DATE(created_at) = CURDATE()"),
    db.queryOne("SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE payment_status = 'COMPLETED' AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)"),
    db.queryOne("SELECT COUNT(*) AS total FROM orders WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)"),
    db.queryOne("SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE payment_status = 'COMPLETED' AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())"),
    db.queryOne("SELECT COUNT(*) AS total FROM orders WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())"),
    db.queryOne("SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE payment_status = 'COMPLETED' AND YEAR(created_at) = YEAR(CURDATE())"),
    db.queryOne("SELECT COUNT(*) AS total FROM orders WHERE YEAR(created_at) = YEAR(CURDATE())"),
    db.query(`SELECT DATE(created_at) AS d, COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN total_amount ELSE 0 END),0) AS revenue, COUNT(*) AS cnt FROM orders ${whereSql} GROUP BY DATE(created_at) ORDER BY d DESC LIMIT 30`, params),
    db.query(`SELECT DATE_FORMAT(created_at, '%Y-%m') AS m, COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN total_amount ELSE 0 END),0) AS revenue, COUNT(*) AS cnt FROM orders ${whereSql} GROUP BY m ORDER BY m DESC LIMIT 24`, params),
    db.query(`SELECT YEAR(created_at) AS y, COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN total_amount ELSE 0 END),0) AS revenue, COUNT(*) AS cnt FROM orders ${whereSql} GROUP BY y ORDER BY y DESC`, params),
    db.query(
      `SELECT p.id, p.name, p.image_url, p.price, c.name AS category_name,
              SUM(oi.quantity) AS total_quantity_sold, SUM(oi.price * oi.quantity) AS revenue
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN categories c ON c.id = p.category_id
       ${joinedWhere(whereSql)}
       GROUP BY p.id ORDER BY total_quantity_sold DESC LIMIT ?`,
      [...params, topN]
    ),
    db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, COUNT(o.id) AS total_orders,
              COALESCE(SUM(o.total_amount),0) AS total_spent, MAX(o.created_at) AS last_order_at
       FROM users u
       JOIN orders o ON o.user_id = u.id
       ${joinedWhere(whereSql)}
       GROUP BY u.id ORDER BY total_spent DESC LIMIT ?`,
      [...params, topN]
    ),
    db.query(
      `SELECT c.id AS category_id, c.name, COUNT(DISTINCT p.id) AS product_count,
              COUNT(DISTINCT o.id) AS total_orders,
              COALESCE(SUM(CASE WHEN o.payment_status = 'COMPLETED' THEN oi.price * oi.quantity ELSE 0 END),0) AS revenue
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id
       GROUP BY c.id ORDER BY revenue DESC`
    ),
    db.query(`SELECT order_status, COUNT(*) AS count FROM orders ${whereSql} GROUP BY order_status`, params),
    db.query(`SELECT payment_status, COUNT(*) AS count FROM orders ${whereSql} GROUP BY payment_status`, params),
  ]);

  const orderStatusDistribution = distribution(orderStatusRows, Object.values(OrderStatus), 'order_status');
  const paymentStatusDistribution = distribution(paymentStatusRows, Object.values(PaymentStatus), 'payment_status');

  return {
    summary: {
      totalRevenue: Math.round(num(revenue.total) * 100) / 100,
      totalOrders: num(orders.total),
      totalCustomers: num(customers.total),
      totalSellers: num(sellers.total),
      totalProducts: num(products.total),
      todayRevenue: Math.round(num(todayRev.total) * 100) / 100,
      todayOrders: num(todayOrders.total),
      thisWeekRevenue: Math.round(num(weekRev.total) * 100) / 100,
      thisWeekOrders: num(weekOrders.total),
      thisMonthRevenue: Math.round(num(monthRev.total) * 100) / 100,
      thisMonthOrders: num(monthOrders.total),
      thisYearRevenue: Math.round(num(yearRev.total) * 100) / 100,
      thisYearOrders: num(yearOrders.total),
      averageOrderValue: num(orders.total) > 0 ? Math.round((num(revenue.total) / num(orders.total)) * 100) / 100 : 0,
    },
    dailyRevenue: dailyRows.reverse().map((r) => ({ label: r.d ? dateKey(new Date(r.d)) : null, revenue: num(r.revenue), orders: num(r.cnt) })),
    monthlyRevenue: monthlyRows.reverse().map((r) => ({ label: r.m, revenue: num(r.revenue), orders: num(r.cnt) })),
    yearlyRevenue: yearlyRows.map((r) => ({ label: String(r.y), revenue: num(r.revenue), orders: num(r.cnt) })),
    topProducts: topProducts.map((r) => ({
      id: num(r.id),
      name: r.name,
      imageUrl: r.image_url,
      price: num(r.price),
      categoryName: r.category_name,
      totalQuantitySold: num(r.total_quantity_sold),
      revenue: Math.round(num(r.revenue) * 100) / 100,
    })),
    topCustomers: topCustomers.map((r) => ({
      id: num(r.id),
      name: `${r.first_name} ${r.last_name}`.trim(),
      email: r.email,
      totalOrders: num(r.total_orders),
      totalSpent: Math.round(num(r.total_spent) * 100) / 100,
      lastOrderAt: fmtIso(r.last_order_at),
    })),
    categoryBreakdown: categoryBreakdown.map((r) => ({
      categoryId: num(r.category_id),
      name: r.name,
      productCount: num(r.product_count),
      totalOrders: num(r.total_orders),
      revenue: Math.round(num(r.revenue) * 100) / 100,
    })),
    orderStatusDistribution,
    paymentStatusDistribution,
  };
}

module.exports = { analytics };
