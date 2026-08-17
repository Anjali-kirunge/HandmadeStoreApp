function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toIso(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function bool(value) {
  if (Buffer.isBuffer(value)) return value.length > 0 && value[0] === 1;
  return value === 1 || value === true || value === '1';
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: num(row.id),
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    avatar: row.avatar,
    role: row.role,
    enabled: bool(row.enabled),
    createdAt: toIso(row.created_at),
  };
}

function mapCategory(row, children = []) {
  if (!row) return null;
  return {
    id: num(row.id),
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    parentCategory: row.parent_id ? { id: num(row.parent_id) } : null,
    children,
    createdAt: toIso(row.created_at),
  };
}

async function loadProductImages(productId, conn) {
  const rows = await conn.query(
    'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY id',
    [productId]
  );
  return rows.map((r) => r.image_url);
}

function mapProduct(row, images = [], category = null, seller = null) {
  if (!row) return null;
  return {
    id: num(row.id),
    name: row.name,
    description: row.description,
    sku: row.sku,
    price: num(row.price),
    discountPrice: row.discount_price === null || row.discount_price === undefined ? null : num(row.discount_price),
    stockQuantity: num(row.stock_quantity),
    imageUrl: row.image_url,
    images,
    category,
    seller,
    rating: num(row.rating),
    reviewCount: num(row.review_count),
    status: row.status,
    isFeatured: bool(row.is_featured),
    createdAt: toIso(row.created_at),
  };
}

function mapCartItem(row, product = null) {
  if (!row) return null;
  const subtotal = num(row.price) * num(row.quantity);
  return {
    id: num(row.id),
    product,
    quantity: num(row.quantity),
    price: num(row.price),
    subtotal,
  };
}

function mapOrderItem(row, product = null) {
  if (!row) return null;
  const subtotal = num(row.price) * num(row.quantity);
  return {
    id: num(row.id),
    product,
    quantity: num(row.quantity),
    price: num(row.price),
    subtotal,
  };
}

function mapOrder(row, items = [], user = null) {
  if (!row) return null;
  return {
    id: num(row.id),
    items,
    user,
    totalAmount: num(row.total_amount),
    shippingAddress: row.shipping_address,
    orderStatus: row.order_status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    trackingNumber: row.tracking_number,
    notes: row.notes,
    createdAt: toIso(row.created_at),
  };
}

function mapCoupon(row) {
  if (!row) return null;
  return {
    id: num(row.id),
    code: row.code,
    discountPercentage: num(row.discount_percentage),
    maxDiscount: num(row.max_discount),
    minPurchase: num(row.min_purchase),
    usageLimit: num(row.usage_limit),
    usedCount: num(row.used_count),
    validFrom: toIso(row.valid_from),
    validUntil: toIso(row.valid_until),
    active: bool(row.active),
  };
}

function mapAddress(row) {
  if (!row) return null;
  return {
    id: num(row.id),
    street: row.street,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    country: row.country,
    isDefault: bool(row.is_default),
    createdAt: toIso(row.created_at),
  };
}

function mapReview(row, user = null, product = null, images = []) {
  if (!row) return null;
  return {
    id: num(row.id),
    user,
    product,
    rating: num(row.rating),
    comment: row.comment,
    images,
    createdAt: toIso(row.created_at),
  };
}

function mapNotification(row) {
  if (!row) return null;
  return {
    id: num(row.id),
    title: row.title,
    message: row.message,
    isRead: bool(row.is_read),
    link: row.link,
    createdAt: toIso(row.created_at),
  };
}

function mapPayment(row, user = null) {
  if (!row) return null;
  return {
    id: num(row.id),
    user,
    orderId: num(row.order_id),
    amount: num(row.amount),
    stripePaymentId: row.stripe_payment_id,
    stripeSessionId: row.stripe_session_id,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    createdAt: toIso(row.created_at),
  };
}

module.exports = {
  num,
  toIso,
  bool,
  mapUser,
  mapCategory,
  loadProductImages,
  mapProduct,
  mapCartItem,
  mapOrderItem,
  mapOrder,
  mapCoupon,
  mapAddress,
  mapReview,
  mapNotification,
  mapPayment,
};
