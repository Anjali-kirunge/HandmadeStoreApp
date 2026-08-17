// Manual database setup + seed for the NEW Handmade Store database.
// Usage:  npm run seed
// Requires DB_* env vars pointing at the new empty database.
// Creates tables from sql/schema.sql and inserts seed users/products/reviews/coupons.

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const env = require('./env');

function sslConfig() {
  if (process.env.DB_SSL !== 'true') return undefined;
  if (process.env.DB_CA_CERT) {
    return { ca: fs.readFileSync(process.env.DB_CA_CERT, 'utf8') };
  }
  return {};
}

async function main() {
  const schemaSql = fs.readFileSync(path.join(__dirname, '..', '..', 'sql', 'schema.sql'), 'utf8');

  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
    ssl: sslConfig(),
  });

  console.log('Creating tables...');
  await conn.query(schemaSql);
  console.log('Tables ready.');

  const now = new Date();
  const hash = (pwd) => bcrypt.hashSync(pwd, 10);

  const users = [
    ['Admin', 'User', 'admin@handmade.com', hash('admin123'), '9999900000', 'ROLE_ADMIN'],
    ['Priya', 'Sharma', 'seller1@handmade.com', hash('seller123'), '9999911111', 'ROLE_SELLER'],
    ['Rahul', 'Verma', 'seller2@handmade.com', hash('seller123'), '9999922222', 'ROLE_SELLER'],
    ['Anita', 'Patel', 'customer1@handmade.com', hash('customer123'), '9999933333', 'ROLE_CUSTOMER'],
    ['Vikram', 'Singh', 'customer2@handmade.com', hash('customer123'), '9999944444', 'ROLE_CUSTOMER'],
  ];

  const userIds = [];
  for (const [fn, ln, email, pwd, phone, role] of users) {
    const [r] = await conn.query(
      'INSERT INTO users (first_name, last_name, email, password, phone, role, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, b\'1\', ?, ?)',
      [fn, ln, email, pwd, phone, role, now, now]
    );
    userIds.push(r.insertId);
    console.log(`Seeded user: ${email}`);
  }

  const [adminId, seller1Id, seller2Id, customer1Id, customer2Id] = userIds;

  const categories = [
    ['Home Decor', 'Beautiful handcrafted home decor items', 1],
    ['Handmade Jewelry', 'Exquisite handcrafted jewelry pieces', 2],
    ['Bags & Accessories', 'Handcrafted bags and stylish accessories', 3],
    ['Gifts & Crafts', 'Unique handmade gifts and craft items', 4],
    ['Pottery & Ceramics', 'Handmade pottery and ceramic items', 5],
    ['Wooden Crafts', 'Handcarved wooden crafts and decor', 6],
  ];
  const categoryIds = {};
  for (const [name, desc, catId] of categories) {
    const [r] = await conn.query(
      'INSERT INTO categories (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [name, desc, now, now]
    );
    categoryIds[catId] = r.insertId;
    console.log(`Seeded category: ${name}`);
  }

  const products = [
    ['Handcrafted Wall Clock', 'Rustic handcrafted wooden wall clock with silent quartz movement.', 'HB-001', 1299.0, 999.0, 18, 1, seller1Id, 1],
    ['Hand-Painted Flower Pots', 'Set of 2 ceramic flower pots with hand-painted floral designs.', 'HB-002', 599.0, 449.0, 35, 2, seller2Id, 0],
    ['Festive String Lamp', 'Handwoven festive string lamp with warm LED glow.', 'HB-003', 350.0, 280.0, 40, 3, seller2Id, 1],
    ['Table Lamp with Jute Base', 'Handcrafted table lamp with natural jute base and fabric shade.', 'HB-004', 750.0, 599.0, 22, 4, seller1Id, 1],
    ['Beaded Jewelry Set', 'Vibrant handcrafted beaded necklace and earring set.', 'JW-001', 699.0, 499.0, 30, 5, seller1Id, 0],
    ['Handmade Earrings', 'Elegant handcrafted earrings for every occasion.', 'JW-002', 299.0, null, 50, 6, seller2Id, 0],
    ['Leather Tote Bag', 'Spacious handcrafted leather tote bag for everyday use.', 'PA-001', 1499.0, 1199.0, 15, 7, seller1Id, 1],
    ['Embroidered Clutch', 'Hand-embroidered clutch with traditional patterns.', 'PA-002', 799.0, 649.0, 25, 8, seller2Id, 0],
    ['Resin Coaster Set', 'Set of 4 unique resin coasters, each one handmade.', 'GC-001', 599.0, 450.0, 20, 9, seller1Id, 0],
    ['Personalized Name Plate', 'Hand-painted wooden name plate for your home.', 'GC-002', 899.0, null, 12, 10, seller2Id, 0],
    ['Ceramic Vase Set', 'Set of 3 handcrafted ceramic vases in earthy tones.', 'PT-001', 499.0, null, 28, 11, seller1Id, 0],
    ['Handcarved Wooden Bowl', 'Beautifully handcarved wooden serving bowl.', 'WC-001', 999.0, 799.0, 18, 12, seller2Id, 1],
  ];
  const productIds = {};
  for (const [name, desc, sku, price, disc, stock, idx, sellerId, featured] of products) {
    const [r] = await conn.query(
      `INSERT INTO products (name, description, sku, price, discount_price, stock_quantity, category_id, seller_id, is_featured, status, rating, review_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, 0, ?, ?)`,
      [name, desc, sku, price, disc, stock, categoryIds[idx], sellerId, featured ? 1 : 0, now, now]
    );
    productIds[sku] = r.insertId;
    console.log(`Seeded product: ${name}`);
  }

  for (const uid of userIds) {
    await conn.query('INSERT INTO carts (user_id, created_at, updated_at) VALUES (?, ?, ?)', [uid, now, now]);
  }
  console.log('Seeded carts.');

  const reviews = [
    [customer1Id, productIds['HB-001'], 5, 'Beautiful clock! The craftsmanship is excellent and it looks stunning on my wall.'],
    [customer2Id, productIds['HB-001'], 4, 'Great quality clock. Silent movement works perfectly.'],
    [customer1Id, productIds['JW-001'], 5, 'The jewelry set is gorgeous! Very vibrant colors and comfortable to wear.'],
    [customer2Id, productIds['PA-001'], 5, 'Perfect everyday tote bag. Spacious and well-made.'],
    [customer1Id, productIds['GC-001'], 4, 'Love the resin coasters! Each one is unique and beautiful.'],
    [customer2Id, productIds['PT-001'], 5, 'The planter is gorgeous. Makes a wonderful gift.'],
    [customer1Id, productIds['HB-004'], 5, 'This lamp creates such a warm ambiance. Love the jute base!'],
    [customer2Id, productIds['PA-001'], 4, 'Excellent bag. Great quality for the price.'],
  ];
  for (const [uid, pid, rating, comment] of reviews) {
    await conn.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [uid, pid, rating, comment, now, now]
    );
  }
  await conn.query(
    'UPDATE products p SET rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.product_id = p.id), review_count = (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id)'
  );
  console.log('Seeded reviews.');

  const validFrom = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const validUntil = new Date(Date.now() + 120 * 24 * 3600 * 1000);
  await conn.query(
    'INSERT INTO coupons (code, discount_percentage, max_discount, min_purchase, usage_limit, used_count, valid_from, valid_until, active, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?, b\'1\', ?)',
    ['WELCOME10', 10.0, 200.0, 500.0, 100, validFrom, validUntil, now]
  );
  await conn.query(
    'INSERT INTO coupons (code, discount_percentage, max_discount, min_purchase, usage_limit, used_count, valid_from, valid_until, active, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?, b\'1\', ?)',
    ['FLAT200', 20.0, 200.0, 1000.0, 50, validFrom, validUntil, now]
  );
  console.log('Seeded coupons.');

  console.log('\nSeed complete.');
  console.log('Login accounts:');
  console.log('  admin@handmade.com / admin123   (ADMIN)');
  console.log('  seller1@handmade.com / seller123 (SELLER)');
  console.log('  seller2@handmade.com / seller123 (SELLER)');
  console.log('  customer1@handmade.com / customer123 (CUSTOMER)');
  console.log('  customer2@handmade.com / customer123 (CUSTOMER)');

  await conn.end();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
