const db = require('../config/db');
const { mapCartItem, mapProduct, num, toIso } = require('../utils/mappers');
const { BadRequestException, ResourceNotFoundException } = require('../utils/errors');

async function getOrCreateCart(userId) {
  let cart = await db.queryOne('SELECT * FROM carts WHERE user_id = ?', [userId]);
  if (!cart) {
    const result = await db.query('INSERT INTO carts (user_id, created_at, updated_at) VALUES (?, ?, ?)', [userId, new Date(), new Date()]);
    cart = { id: result.insertId, user_id: userId };
  }
  return cart;
}

async function cartResponse(userId) {
  const cart = await getOrCreateCart(userId);
  const rows = await db.query(
    `SELECT ci.id, ci.quantity, ci.price, ci.product_id, ci.created_at,
            p.id AS p_id, p.name, p.description, p.sku, p.price AS p_price, p.discount_price,
            p.stock_quantity, p.image_url, p.rating, p.review_count, p.status
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ?
     ORDER BY ci.created_at ASC`,
    [cart.id]
  );
  const items = rows.map((r) =>
    mapCartItem(
      { id: r.id, quantity: r.quantity, price: r.price, created_at: r.created_at },
      mapProduct({
        id: r.p_id,
        name: r.name,
        description: r.description,
        sku: r.sku,
        price: r.p_price,
        discount_price: r.discount_price,
        stock_quantity: r.stock_quantity,
        image_url: r.image_url,
        rating: r.rating,
        review_count: r.review_count,
        status: r.status,
      })
    )
  );
  const totalPrice = items.reduce((sum, it) => sum + it.subtotal, 0);
  const totalItems = items.reduce((sum, it) => sum + it.quantity, 0);
  return { id: num(cart.id), items, totalPrice: Math.round(totalPrice * 100) / 100, totalItems };
}

async function getCart(userId) {
  return cartResponse(userId);
}

async function addItem(userId, productId, quantity) {
  const qty = num(quantity);
  if (qty < 1) throw new BadRequestException('Quantity must be at least 1');

  const product = await db.queryOne('SELECT * FROM products WHERE id = ?', [productId]);
  if (!product) throw new ResourceNotFoundException('Product', 'id', productId);
  if (product.status !== 'ACTIVE') throw new BadRequestException(`Product ${product.name} is not available`);

  const cart = await getOrCreateCart(userId);
  const existing = await db.queryOne('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?', [cart.id, productId]);

  const price = product.discount_price !== null && product.discount_price !== undefined ? num(product.discount_price) : num(product.price);
  const newQty = existing ? num(existing.quantity) + qty : qty;

  if (newQty > num(product.stock_quantity)) {
    throw new BadRequestException(`Only ${product.stock_quantity} units available for ${product.name}`);
  }

  if (existing) {
    await db.query('UPDATE cart_items SET quantity = ?, price = ? WHERE id = ?', [newQty, price, existing.id]);
  } else {
    await db.query(
      'INSERT INTO cart_items (cart_id, product_id, quantity, price, created_at) VALUES (?, ?, ?, ?, ?)',
      [cart.id, productId, qty, price, new Date()]
    );
  }
  return cartResponse(userId);
}

async function updateItemQuantity(userId, productId, quantity) {
  const qty = num(quantity);

  const cart = await getOrCreateCart(userId);
  const existing = await db.queryOne('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?', [cart.id, productId]);
  if (!existing) throw new ResourceNotFoundException('CartItem', 'productId', productId);

  if (qty <= 0) {
    await db.query('DELETE FROM cart_items WHERE id = ?', [existing.id]);
    return cartResponse(userId);
  }

  const product = await db.queryOne('SELECT * FROM products WHERE id = ?', [productId]);
  if (qty > num(product.stock_quantity)) {
    throw new BadRequestException(`Only ${product.stock_quantity} units available for ${product.name}`);
  }

  await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [qty, existing.id]);
  return cartResponse(userId);
}

async function removeItem(userId, productId) {
  const cart = await getOrCreateCart(userId);
  await db.query('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cart.id, productId]);
  return { message: 'Product removed from cart' };
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
  return { message: 'Cart cleared successfully' };
}

module.exports = { getCart, addItem, updateItemQuantity, removeItem, clearCart, getOrCreateCart, cartResponse };
