const db = require('../config/db');
const { mapProduct, mapCategory, mapUser, num } = require('../utils/mappers');
const { ResourceNotFoundException, BadRequestException } = require('../utils/errors');
const { fullProduct } = require('./product.service');

async function getOrCreateWishlist(userId) {
  let wishlist = await db.queryOne('SELECT * FROM wishlists WHERE user_id = ?', [userId]);
  if (!wishlist) {
    const result = await db.query('INSERT INTO wishlists (user_id, created_at, updated_at) VALUES (?, ?, ?)', [userId, new Date(), new Date()]);
    wishlist = { id: result.insertId };
  }
  return wishlist;
}

async function wishlistResponse(userId) {
  const wishlist = await getOrCreateWishlist(userId);
  const rows = await db.query(
    `SELECT p.* FROM wishlist_products wp JOIN products p ON p.id = wp.product_id
     WHERE wp.wishlist_id = ? ORDER BY wp.product_id DESC`,
    [wishlist.id]
  );
  const products = [];
  for (const row of rows) products.push(await fullProduct(row));
  return { id: num(wishlist.id), products };
}

async function getWishlist(userId) {
  return wishlistResponse(userId);
}

async function addProduct(userId, productId) {
  const product = await db.queryOne('SELECT * FROM products WHERE id = ?', [productId]);
  if (!product) throw new ResourceNotFoundException('Product', 'id', productId);
  const wishlist = await getOrCreateWishlist(userId);
  const existing = await db.queryOne(
    'SELECT * FROM wishlist_products WHERE wishlist_id = ? AND product_id = ?',
    [wishlist.id, productId]
  );
  if (!existing) {
    await db.query('INSERT INTO wishlist_products (wishlist_id, product_id) VALUES (?, ?)', [wishlist.id, productId]);
  }
  return wishlistResponse(userId);
}

async function removeProduct(userId, productId) {
  const wishlist = await getOrCreateWishlist(userId);
  await db.query('DELETE FROM wishlist_products WHERE wishlist_id = ? AND product_id = ?', [wishlist.id, productId]);
  return { message: 'Product removed from wishlist' };
}

module.exports = { getWishlist, addProduct, removeProduct };
