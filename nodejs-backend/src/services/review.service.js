const db = require('../config/db');
const { mapReview, mapUser, num, toIso } = require('../utils/mappers');
const { pageResponse } = require('../utils/response');
const { ResourceNotFoundException, BadRequestException } = require('../utils/errors');
const { audit } = require('./audit.service');
const { fullProduct } = require('./product.service');

async function reviewResponse(row) {
  const userRow = await db.queryOne('SELECT * FROM users WHERE id = ?', [row.user_id]);
  const productRow = await db.queryOne('SELECT * FROM products WHERE id = ?', [row.product_id]);
  const images = await db.query('SELECT image_url FROM review_images WHERE review_id = ?', [row.id]);
  return mapReview(row, mapUser(userRow), productRow ? await fullProduct(productRow) : null, images.map((r) => r.image_url));
}

async function listProductReviews(productId, { page = 0, size = 10 }) {
  const [countRow] = await db.query('SELECT COUNT(*) AS total FROM reviews WHERE product_id = ?', [productId]);
  const totalElements = num(countRow.total);
  const rows = await db.query(
    'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [productId, size, page * size]
  );
  const content = [];
  for (const row of rows) content.push(await reviewResponse(row));
  return pageResponse(content, page, size, totalElements);
}

async function hasPurchased(userId, productId) {
  const row = await db.queryOne(
    `SELECT oi.id FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.product_id = ? AND o.user_id = ? AND o.order_status IN ('DELIVERED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'CONFIRMED')
     LIMIT 1`,
    [productId, userId]
  );
  return !!row;
}

async function hasReviewed(userId, productId) {
  const row = await db.queryOne('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?', [userId, productId]);
  return !!row;
}

async function canReview(userId, productId) {
  const purchased = await hasPurchased(userId, productId);
  const reviewed = await hasReviewed(userId, productId);
  return { canReview: purchased && !reviewed };
}

async function recomputeProductRating(productId) {
  const row = await db.queryOne(
    'SELECT AVG(rating) AS avgRating, COUNT(*) AS cnt FROM reviews WHERE product_id = ?',
    [productId]
  );
  const rating = Math.round((num(row.avgRating) + Number.EPSILON) * 10) / 10;
  await db.query('UPDATE products SET rating = ?, review_count = ? WHERE id = ?', [rating, num(row.cnt), productId]);
}

async function createReview(userId, productId, body, actor) {
  const rating = num(body.rating);
  if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be between 1 and 5');

  const product = await db.queryOne('SELECT * FROM products WHERE id = ?', [productId]);
  if (!product) throw new ResourceNotFoundException('Product', 'id', productId);

  if (!(await hasPurchased(userId, productId))) {
    throw new BadRequestException('You can only review products you have purchased');
  }
  if (await hasReviewed(userId, productId)) {
    throw new BadRequestException('You have already reviewed this product');
  }

  const result = await db.query(
    'INSERT INTO reviews (user_id, product_id, rating, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, productId, rating, body.comment || null, new Date(), new Date()]
  );
  const images = Array.isArray(body.images) ? body.images.filter((img) => img) : [];
  for (const img of images) {
    await db.query('INSERT INTO review_images (review_id, image_url) VALUES (?, ?)', [result.insertId, img]);
  }
  await recomputeProductRating(productId);
  await audit(actor, 'CREATE', 'REVIEW', result.insertId, null, { rating, productId }, null);
  const row = await db.queryOne('SELECT * FROM reviews WHERE id = ?', [result.insertId]);
  return reviewResponse(row);
}

async function updateReview(userId, id, body, actor) {
  const existing = await db.queryOne('SELECT * FROM reviews WHERE id = ?', [id]);
  if (!existing) throw new ResourceNotFoundException('Review', 'id', id);
  if (existing.user_id !== num(userId)) {
    throw new BadRequestException('You can only update your own reviews');
  }
  const rating = body.rating !== undefined ? num(body.rating) : existing.rating;
  if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be between 1 and 5');

  await db.query(
    'UPDATE reviews SET rating = ?, comment = ?, updated_at = ? WHERE id = ?',
    [rating, body.comment !== undefined ? body.comment : existing.comment, new Date(), id]
  );
  if (Array.isArray(body.images)) {
    await db.query('DELETE FROM review_images WHERE review_id = ?', [id]);
    for (const img of body.images.filter((i) => i)) {
      await db.query('INSERT INTO review_images (review_id, image_url) VALUES (?, ?)', [id, img]);
    }
  }
  await recomputeProductRating(existing.product_id);
  await audit(actor, 'UPDATE', 'REVIEW', id, { rating: existing.rating }, { rating }, null);
  const row = await db.queryOne('SELECT * FROM reviews WHERE id = ?', [id]);
  return reviewResponse(row);
}

async function deleteReview(userId, id, actor) {
  const existing = await db.queryOne('SELECT * FROM reviews WHERE id = ?', [id]);
  if (!existing) throw new ResourceNotFoundException('Review', 'id', id);
  if (existing.user_id !== num(userId)) {
    throw new BadRequestException('You can only delete your own reviews');
  }
  await db.query('DELETE FROM review_images WHERE review_id = ?', [id]);
  await db.query('DELETE FROM reviews WHERE id = ?', [id]);
  await recomputeProductRating(existing.product_id);
  await audit(actor, 'DELETE', 'REVIEW', id, { productId: existing.product_id }, null, null);
  return { message: 'Review deleted successfully' };
}

async function listAllReviews({ page = 0, size = 10 }) {
  const [countRow] = await db.query('SELECT COUNT(*) AS total FROM reviews');
  const totalElements = num(countRow.total);
  const rows = await db.query(
    'SELECT * FROM reviews ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [size, page * size]
  );
  const content = [];
  for (const row of rows) content.push(await reviewResponse(row));
  return pageResponse(content, page, size, totalElements);
}

async function adminDeleteReview(reviewId, actor) {
  const existing = await db.queryOne('SELECT * FROM reviews WHERE id = ?', [reviewId]);
  if (!existing) throw new ResourceNotFoundException('Review', 'id', reviewId);
  await db.query('DELETE FROM review_images WHERE review_id = ?', [reviewId]);
  await db.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
  await recomputeProductRating(existing.product_id);
  await audit(actor, 'DELETE', 'REVIEW', reviewId, { productId: existing.product_id }, null, null);
  return { message: 'Review deleted successfully' };
}

module.exports = { listProductReviews, canReview, createReview, updateReview, deleteReview, reviewResponse, listAllReviews, adminDeleteReview };
