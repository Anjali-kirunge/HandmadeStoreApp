const PDFDocument = require('pdfkit');
const db = require('../config/db');
const { num } = require('../utils/mappers');
const { ResourceNotFoundException } = require('../utils/errors');

async function buildInvoicePdf(orderId) {
  const order = await db.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) throw new ResourceNotFoundException('Order', 'id', orderId);

  const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [order.user_id]);
  const items = await db.query(
    `SELECT oi.quantity, oi.price, p.name FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`,
    [orderId]
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).fillColor('#0d9488').text('Handmade Store', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor('#111').text(`Invoice #${order.id}`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#333');
    doc.text(`Order Date: ${order.created_at ? new Date(order.created_at).toLocaleString() : '-'}`);
    doc.text(`Customer: ${user ? `${user.first_name} ${user.last_name} (${user.email})` : '-'}`);
    doc.text(`Shipping Address: ${order.shipping_address || '-'}`);
    doc.text(`Payment Method: ${order.payment_method || '-'}  |  Status: ${order.order_status || '-'}`);
    doc.moveDown(1);

    const startX = 50;
    const startY = doc.y;
    const colWidth = [70, 300, 80, 80, 90];
    const headers = ['Qty', 'Product', 'Unit Price', 'Subtotal', ''];

    doc.fontSize(10).fillColor('#0d9488');
    let x = startX;
    headers.forEach((h, i) => {
      if (h) doc.text(h, x, startY, { width: colWidth[i] });
      x += colWidth[i];
    });
    doc.moveTo(startX, startY + 14).lineTo(startX + colWidth.reduce((a, b) => a + b, 0), startY + 14).strokeColor('#ddd').stroke();

    let y = startY + 24;
    doc.fontSize(10).fillColor('#222');
    for (const item of items) {
      const subtotal = num(item.price) * num(item.quantity);
      x = startX;
      doc.text(String(item.quantity), x, y, { width: colWidth[0] }); x += colWidth[0];
      doc.text(item.name || '-', x, y, { width: colWidth[1] }); x += colWidth[1];
      doc.text('₹' + num(item.price).toFixed(2), x, y, { width: colWidth[2] }); x += colWidth[2];
      doc.text('₹' + subtotal.toFixed(2), x, y, { width: colWidth[3] });
      y += 18;
    }

    doc.moveDown(1);
    doc.fontSize(12).fillColor('#111').text(`Total Amount: ₹${num(order.total_amount).toFixed(2)}`, startX, y + 10);

    doc.end();
  });
}

module.exports = { buildInvoicePdf };
