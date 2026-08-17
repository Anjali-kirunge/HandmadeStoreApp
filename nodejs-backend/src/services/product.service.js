const db = require('../config/db');
const { mapProduct, mapCategory, mapUser, num, toIso, bool } = require('../utils/mappers');
const { pageResponse } = require('../utils/response');
const { ResourceNotFoundException, BadRequestException } = require('../utils/errors');
const { ProductStatus } = require('../utils/enums');
const { audit } = require('./audit.service');
const { buildCategoryWithChildren } = require('./category.service');

async function fullProduct(row) {
  if (!row) return null;
  const images = await db.query('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY id', [row.id]);
  let category = null;
  if (row.category_id) {
    const catRow = await db.queryOne('SELECT * FROM categories WHERE id = ?', [row.category_id]);
    if (catRow) category = await buildCategoryWithChildren(catRow);
  }
  const sellerRow = row.seller_id ? await db.queryOne('SELECT * FROM users WHERE id = ?', [row.seller_id]) : null;
  return mapProduct(row, images.map((r) => r.image_url), category, mapUser(sellerRow));
}

const SORT_MAP = {
  'price-asc': 'price ASC',
  'priceAsc': 'price ASC',
  'price_asc': 'price ASC',
  'price-desc': 'price DESC',
  'priceDesc': 'price DESC',
  'price_desc': 'price DESC',
  'rating': 'rating DESC',
  'rating-desc': 'rating DESC',
  'rating_desc': 'rating DESC',
  'newest': 'created_at DESC',
  'newest-desc': 'created_at DESC',
  'name-asc': 'name ASC',
  'nameAsc': 'name ASC',
  'popular': 'review_count DESC',
};

async function getAllProducts({ page = 0, size = 10 }) {
  const whereSql = "WHERE p.status = 'ACTIVE'";
  const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`);
  const totalElements = num(countRow.total);
  const rows = await db.query(
    `SELECT p.* FROM products p ${whereSql} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [size, page * size]
  );
  const content = [];
  for (const row of rows) content.push(await fullProduct(row));
  return pageResponse(content, page, size, totalElements);
}

async function searchProducts({ keyword, categoryId, minPrice, maxPrice, sortBy, page = 0, size = 10 }) {  const where = ["p.status = 'ACTIVE'"];
  const params = [];

  if (keyword) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
    const like = `%${keyword}%`;
    params.push(like, like, like);
  }
  if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
    const catId = num(categoryId);
    where.push(
      '(p.category_id = ? OR p.category_id IN (SELECT id FROM categories WHERE parent_id = ?))'
    );
    params.push(catId, catId);
  }
  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    where.push('p.price >= ?');
    params.push(num(minPrice));
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    where.push('p.price <= ?');
    params.push(num(maxPrice));
  }

  const orderBy = SORT_MAP[String(sortBy || 'newest')] || 'p.created_at DESC';
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  const totalElements = num(countRow.total);
  const rows = await db.query(
    `SELECT p.* FROM products p ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, size, page * size]
  );
  const content = [];
  for (const row of rows) content.push(await fullProduct(row));
  return pageResponse(content, page, size, totalElements);
}

async function listFeaturedProducts({ page = 0, size = 10 }) {
  const whereSql = "WHERE p.status = 'ACTIVE' AND p.is_featured = 1";
  const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`);
  const totalElements = num(countRow.total);
  const rows = await db.query(
    `SELECT p.* FROM products p ${whereSql} ORDER BY p.rating DESC, p.review_count DESC LIMIT ? OFFSET ?`,
    [size, page * size]
  );
  const content = [];
  for (const row of rows) content.push(await fullProduct(row));
  return pageResponse(content, page, size, totalElements);
}

async function getProduct(id) {
  const row = await db.queryOne('SELECT * FROM products WHERE id = ?', [id]);
  if (!row) throw new ResourceNotFoundException('Product', 'id', id);
  return fullProduct(row);
}

async function listSellerProducts(sellerId, { page = 0, size = 10 }) {
  const whereSql = 'WHERE p.seller_id = ?';
  const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, [sellerId]);
  const totalElements = num(countRow.total);
  const rows = await db.query(
    `SELECT p.* FROM products p ${whereSql} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [sellerId, size, page * size]
  );
  const content = [];
  for (const row of rows) content.push(await fullProduct(row));
  return pageResponse(content, page, size, totalElements);
}

async function createProduct(body, sellerId, actor) {
  const required = ['name', 'price', 'sku', 'stockQuantity'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw new BadRequestException(`${field} is required`);
    }
  }
  const category = await db.queryOne('SELECT id FROM categories WHERE id = ?', [num(body.categoryId)]);
  if (!category) throw new ResourceNotFoundException('Category', 'id', body.categoryId);

  const price = num(body.price);
  const discountPrice = body.discountPrice === undefined || body.discountPrice === null ? null : num(body.discountPrice);
  const stock = num(body.stockQuantity);
  const isFeatured = body.isFeatured ? 1 : 0;

  const result = await db.query(
    `INSERT INTO products (name, description, sku, price, discount_price, stock_quantity, image_url, is_featured, status, rating, review_count, category_id, seller_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, 0, ?, ?, ?, ?)`,
    [
      body.name,
      body.description || null,
      body.sku,
      price,
      discountPrice,
      stock,
      body.imageUrl || null,
      isFeatured,
      num(body.categoryId),
      sellerId,
      new Date(),
      new Date(),
    ]
  );

  const images = Array.isArray(body.images) ? body.images : [];
  const allImages = [];
  if (body.imageUrl) allImages.push(body.imageUrl);
  allImages.push(...images.filter((img) => img && !allImages.includes(img)));
  for (const img of allImages) {
    await db.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [result.insertId, img]);
  }

  await audit(actor, 'CREATE', 'PRODUCT', result.insertId, null, { name: body.name, sku: body.sku }, null);
  return getProduct(result.insertId);
}

async function assertSellerOwns(productId, sellerId) {
  const row = await db.queryOne('SELECT * FROM products WHERE id = ?', [productId]);
  if (!row) throw new ResourceNotFoundException('Product', 'id', productId);
  if (row.seller_id !== num(sellerId)) {
    throw new BadRequestException('You can only manage your own products');
  }
  return row;
}

async function updateProduct(id, body, sellerId, actor) {
  const existing = sellerId !== undefined && sellerId !== null
    ? await assertSellerOwns(id, sellerId)
    : (await db.queryOne('SELECT * FROM products WHERE id = ?', [id]) || (() => { throw new ResourceNotFoundException('Product', 'id', id); })());

  if (body.name !== undefined && body.name !== existing.name) {
    const dup = await db.queryOne('SELECT id FROM products WHERE sku = ? AND id != ?', [body.sku ?? existing.sku, id]);
    if (dup) throw new BadRequestException('Product with this SKU already exists');
  }

  const newCategoryId = body.categoryId !== undefined && body.categoryId !== null ? num(body.categoryId) : existing.category_id;
  if (body.categoryId !== undefined && body.categoryId !== null) {
    const category = await db.queryOne('SELECT id FROM categories WHERE id = ?', [newCategoryId]);
    if (!category) throw new ResourceNotFoundException('Category', 'id', body.categoryId);
  }

  await db.query(
    `UPDATE products SET
       name = ?, description = ?, sku = ?, price = ?, discount_price = ?,
       stock_quantity = ?, image_url = ?, is_featured = ?, category_id = ?, updated_at = ?
     WHERE id = ?`,
    [
      body.name !== undefined ? body.name : existing.name,
      body.description !== undefined ? body.description : existing.description,
      body.sku !== undefined ? body.sku : existing.sku,
      body.price !== undefined ? num(body.price) : existing.price,
      body.discountPrice !== undefined && body.discountPrice !== null ? num(body.discountPrice) : existing.discount_price,
      body.stockQuantity !== undefined ? num(body.stockQuantity) : existing.stock_quantity,
      body.imageUrl !== undefined ? body.imageUrl : existing.image_url,
      body.isFeatured !== undefined ? (body.isFeatured ? 1 : 0) : bool(existing.is_featured) ? 1 : 0,
      newCategoryId,
      new Date(),
      id,
    ]
  );

  if (Array.isArray(body.images)) {
    await db.query('DELETE FROM product_images WHERE product_id = ?', [id]);
    const images = body.images.filter((img) => img);
    if (body.imageUrl) images.unshift(body.imageUrl);
    for (const img of images) {
      await db.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [id, img]);
    }
  }

  await audit(actor, 'UPDATE', 'PRODUCT', id, { name: existing.name }, { name: body.name ?? existing.name }, null);
  return getProduct(id);
}

async function deleteProduct(id, sellerId, actor) {
  const existing = sellerId !== undefined && sellerId !== null
    ? await assertSellerOwns(id, sellerId)
    : (await db.queryOne('SELECT * FROM products WHERE id = ?', [id]) || (() => { throw new ResourceNotFoundException('Product', 'id', id); })());
  await db.query('DELETE FROM product_images WHERE product_id = ?', [id]);
  await db.query('DELETE FROM products WHERE id = ?', [id]);
  await audit(actor, 'DELETE', 'PRODUCT', id, { name: existing.name, sku: existing.sku }, null, null);
  return { message: 'Product deleted successfully' };
}

async function updateStock(id, quantity, sellerId, actor) {
  const existing = sellerId !== undefined && sellerId !== null
    ? await assertSellerOwns(id, sellerId)
    : (await db.queryOne('SELECT * FROM products WHERE id = ?', [id]) || (() => { throw new ResourceNotFoundException('Product', 'id', id); })());
  const qty = num(quantity);
  if (qty < 0) throw new BadRequestException('Quantity cannot be negative');
  const newStatus = qty === 0 ? 'OUT_OF_STOCK' : (existing.status === 'OUT_OF_STOCK' ? 'ACTIVE' : existing.status);
  await db.query('UPDATE products SET stock_quantity = ?, status = ?, updated_at = ? WHERE id = ?', [qty, newStatus, new Date(), id]);
  await audit(actor, 'UPDATE', 'PRODUCT', id, { stock_quantity: existing.stock_quantity }, { stock_quantity: qty }, null);
  return getProduct(id);
}

async function toggleFeatured(id, sellerId, actor) {
  const existing = sellerId !== undefined && sellerId !== null
    ? await assertSellerOwns(id, sellerId)
    : (await db.queryOne('SELECT * FROM products WHERE id = ?', [id]) || (() => { throw new ResourceNotFoundException('Product', 'id', id); })());
  const isFeatured = bool(existing.is_featured) ? 0 : 1;
  await db.query('UPDATE products SET is_featured = ?, updated_at = ? WHERE id = ?', [isFeatured, new Date(), id]);
  await audit(actor, 'UPDATE', 'PRODUCT', id, { is_featured: existing.is_featured }, { is_featured: isFeatured }, null);
  return getProduct(id);
}

async function adminListProducts({ keyword, status, page = 0, size = 10 }) {
  const where = [];
  const params = [];
  if (keyword) {
    where.push('(name LIKE ? OR description LIKE ? OR sku LIKE ?)');
    const like = `%${keyword}%`;
    params.push(like, like, like);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM products ${whereSql}`, params);
  const totalElements = num(countRow.total);
  const rows = await db.query(
    `SELECT * FROM products ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, size, page * size]
  );
  const content = [];
  for (const row of rows) content.push(await fullProduct(row));
  return pageResponse(content, page, size, totalElements);
}

async function adminUpdateProductStatus(id, status, actor) {
  const existing = await db.queryOne('SELECT * FROM products WHERE id = ?', [id]);
  if (!existing) throw new ResourceNotFoundException('Product', 'id', id);
  if (!['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'].includes(status)) {
    throw new BadRequestException('Invalid product status');
  }
  await db.query('UPDATE products SET status = ?, updated_at = ? WHERE id = ?', [status, new Date(), id]);
  await audit(actor, 'UPDATE', 'PRODUCT', id, { status: existing.status }, { status }, null);
  return getProduct(id);
}

async function listLowStock() {
  const rows = await db.query(
    "SELECT * FROM products WHERE stock_quantity <= 10 AND status = 'ACTIVE' ORDER BY stock_quantity ASC LIMIT 50"
  );
  const content = [];
  for (const row of rows) content.push(await fullProduct(row));
  return content;
}

module.exports = {
  searchProducts,
  getAllProducts,
  listFeaturedProducts,
  getProduct,
  listSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  toggleFeatured,
  adminListProducts,
  adminUpdateProductStatus,
  listLowStock,
  fullProduct,
};
