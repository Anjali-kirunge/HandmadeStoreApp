const db = require('../config/db');
const { num, toIso, bool } = require('../utils/mappers');
const { BadRequestException } = require('../utils/errors');
const analyticsService = require('./analytics.service');

const FORMATS = ['csv', 'excel', 'pdf'];

function toCsv(headers, rows) {
  const escape = (value) => {
    if (value === null || value === undefined) return '';
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(','));
  return '\ufeff' + lines.join('\r\n');
}

function buildFilter({ from, to, keyword, status, role, lowStockOnly, paymentStatus, orderStatus }) {
  const where = [];
  const params = [];
  if (from) {
    where.push('created_at >= ?');
    params.push(new Date(from));
  }
  if (to) {
    where.push('created_at <= ?');
    params.push(new Date(to));
  }
  if (keyword) {
    where.push('(name LIKE ? OR sku LIKE ?)');
    const like = `%${keyword}%`;
    params.push(like, like);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  if (lowStockOnly) {
    where.push('stock_quantity <= 10');
  }
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  if (orderStatus) {
    where.push('order_status = ?');
    params.push(orderStatus);
  }
  if (paymentStatus) {
    where.push('payment_status = ?');
    params.push(paymentStatus);
  }
  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function ordersReport(query) {
  const { whereSql, params } = buildFilter({ from: query.from, to: query.to, orderStatus: query.status });
  const rows = await db.query(
    `SELECT o.*, u.email AS user_email FROM orders o JOIN users u ON u.id = o.user_id ${whereSql} ORDER BY o.created_at DESC`,
    params
  );
  return rows.map((r) => ({
    orderId: r.id,
    customerEmail: r.user_email,
    totalAmount: r.total_amount,
    orderStatus: r.order_status,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    trackingNumber: r.tracking_number,
    shippingAddress: r.shipping_address,
    createdAt: toIso(r.created_at),
  }));
}

async function productsReport(query) {
  const { whereSql, params } = buildFilter({ keyword: query.keyword, status: query.status, lowStockOnly: query.lowStockOnly === 'true' });
  const rows = await db.query(`SELECT * FROM products ${whereSql} ORDER BY created_at DESC`, params);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku,
    price: r.price,
    discountPrice: r.discount_price === null ? '' : r.discount_price,
    stockQuantity: r.stock_quantity,
    status: r.status,
    rating: r.rating,
    reviewCount: r.review_count,
    categoryId: r.category_id,
    sellerId: r.seller_id,
    isFeatured: bool(r.is_featured),
  }));
}

async function usersReport(query) {
  const { whereSql, params } = buildFilter({ keyword: query.keyword, role: query.role });
  const rows = await db.query(`SELECT * FROM users ${whereSql} ORDER BY created_at DESC`, params);
  return rows.map((r) => ({
    id: r.id,
    name: `${r.first_name} ${r.last_name}`.trim(),
    email: r.email,
    phone: r.phone,
    role: r.role,
    enabled: bool(r.enabled),
    createdAt: toIso(r.created_at),
  }));
}

async function paymentsReport(query) {
  const { whereSql, params } = buildFilter({ from: query.from, to: query.to, paymentStatus: query.status });
  const rows = await db.query(
    `SELECT p.*, u.email AS user_email FROM payments p JOIN users u ON u.id = p.user_id ${whereSql} ORDER BY p.created_at DESC`,
    params
  );
  return rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    userEmail: r.user_email,
    amount: r.amount,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    stripePaymentId: r.stripe_payment_id,
    createdAt: toIso(r.created_at),
  }));
}

async function analyticsReport(query) {
  const data = await analyticsService.analytics({ from: query.from, to: query.to, topN: 5 });
  const summary = data.summary;
  return {
    totalRevenue: summary.totalRevenue,
    totalOrders: summary.totalOrders,
    totalCustomers: summary.totalCustomers,
    averageOrderValue: summary.averageOrderValue,
    todayRevenue: summary.todayRevenue,
    todayOrders: summary.todayOrders,
    thisMonthRevenue: summary.thisMonthRevenue,
    thisMonthOrders: summary.thisMonthOrders,
    thisYearRevenue: summary.thisYearRevenue,
    thisYearOrders: summary.thisYearOrders,
    topProducts: data.topProducts.map((p) => `${p.name} (${p.totalQuantitySold} sold, ₹${p.revenue})`).join(' | '),
    topCustomers: data.topCustomers.map((c) => `${c.name} (${c.email}) - ₹${c.totalSpent}`).join(' | '),
    orderStatus: JSON.stringify(data.orderStatusDistribution),
  };
}

async function buildWorkbook(sheetName, headers, rows) {
  const XLSX = require('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function buildPdf(title, headers, rows) {
  const PDFDocument = require('pdfkit');
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, autoFirstPage: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).fillColor('#0d9488').text(title, { align: 'center' });
    doc.moveDown(1);

    const colCount = headers.length;
    const pageWidth = doc.page.width - 80;
    const colWidth = pageWidth / colCount;
    const startX = 40;

    let y = doc.y;
    doc.fontSize(8).fillColor('#0d9488');
    headers.forEach((h, i) => doc.text(h, startX + i * colWidth, y, { width: colWidth }));
    doc.moveTo(startX, y + 12).lineTo(startX + pageWidth, y + 12).strokeColor('#ccc').stroke();
    y += 18;

    doc.fontSize(7).fillColor('#222');
    for (const row of rows) {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }
      headers.forEach((h, i) => {
        const text = String(row[h] ?? '');
        doc.text(text.length > 40 ? text.slice(0, 40) + '…' : text, startX + i * colWidth, y, { width: colWidth });
      });
      y += 14;
    }
    doc.end();
  });
}

async function generateReport(type, format, query) {
  if (!FORMATS.includes(format)) {
    throw new BadRequestException('Invalid format. Use csv, excel or pdf.');
  }
  const ext = format === 'excel' ? 'xlsx' : format;
  const filename = `handmade-${type}-report.${ext}`;

  let headers = [];
  let rows = [];
  let content;
  let contentType;

  switch (type) {
    case 'orders':
      headers = ['orderId', 'customerEmail', 'totalAmount', 'orderStatus', 'paymentMethod', 'paymentStatus', 'trackingNumber', 'shippingAddress', 'createdAt'];
      rows = await ordersReport(query);
      break;
    case 'products':
      headers = ['id', 'name', 'sku', 'price', 'discountPrice', 'stockQuantity', 'status', 'rating', 'reviewCount', 'categoryId', 'sellerId', 'isFeatured'];
      rows = await productsReport(query);
      break;
    case 'users':
      headers = ['id', 'name', 'email', 'phone', 'role', 'enabled', 'createdAt'];
      rows = await usersReport(query);
      break;
    case 'payments':
      headers = ['id', 'orderId', 'userEmail', 'amount', 'paymentMethod', 'paymentStatus', 'stripePaymentId', 'createdAt'];
      rows = await paymentsReport(query);
      break;
    case 'analytics':
      headers = ['totalRevenue', 'totalOrders', 'totalCustomers', 'averageOrderValue', 'todayRevenue', 'todayOrders', 'thisMonthRevenue', 'thisMonthOrders', 'thisYearRevenue', 'thisYearOrders', 'topProducts', 'topCustomers', 'orderStatus'];
      rows = [await analyticsReport(query)];
      break;
    default:
      throw new BadRequestException('Invalid report type');
  }

  if (format === 'csv') {
    content = Buffer.from(toCsv(headers, rows), 'utf8');
    contentType = 'text/csv; charset=utf-8';
  } else if (format === 'excel') {
    content = await buildWorkbook(type, headers, rows);
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else {
    content = await buildPdf(`Handmade Store - ${type} report`, headers, rows);
    contentType = 'application/pdf';
  }

  return { content, filename, contentType };
}

module.exports = { generateReport, toCsv };
