-- Handmade Store - Node.js backend schema
-- Sanitized for a NEW database. NO `DROP TABLE`, NO `USE`.
-- Compatible with MySQL 8.0 (Aiven MySQL).

CREATE TABLE IF NOT EXISTS users (
  id bigint NOT NULL AUTO_INCREMENT,
  first_name varchar(255) NOT NULL,
  last_name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  phone varchar(255) DEFAULT NULL,
  avatar varchar(255) DEFAULT NULL,
  role enum('ROLE_ADMIN','ROLE_CUSTOMER','ROLE_SELLER') NOT NULL,
  enabled bit(1) NOT NULL DEFAULT b'0',
  created_at datetime(6) DEFAULT NULL,
  updated_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UK_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS addresses (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  street varchar(255) NOT NULL,
  city varchar(255) NOT NULL,
  state varchar(255) NOT NULL,
  zip_code varchar(255) NOT NULL,
  country varchar(255) NOT NULL,
  is_default bit(1) NOT NULL DEFAULT b'0',
  created_at datetime(6) DEFAULT NULL,
  updated_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY FK_addresses_user (user_id),
  CONSTRAINT FK_addresses_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS categories (
  id bigint NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  description varchar(255) DEFAULT NULL,
  image_url varchar(255) DEFAULT NULL,
  parent_id bigint DEFAULT NULL,
  created_at datetime(6) DEFAULT NULL,
  updated_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UK_categories_name (name),
  KEY FK_categories_parent (parent_id),
  CONSTRAINT FK_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS products (
  id bigint NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  description varchar(255) DEFAULT NULL,
  sku varchar(255) NOT NULL,
  price decimal(10,2) NOT NULL,
  discount_price decimal(10,2) DEFAULT NULL,
  stock_quantity int NOT NULL,
  image_url text,
  is_featured bit(1) NOT NULL DEFAULT b'0',
  rating double NOT NULL DEFAULT 0,
  review_count int NOT NULL DEFAULT 0,
  status enum('ACTIVE','INACTIVE','OUT_OF_STOCK','DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
  category_id bigint DEFAULT NULL,
  seller_id bigint NOT NULL,
  created_at datetime(6) DEFAULT NULL,
  updated_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UK_products_sku (sku),
  KEY FK_products_category (category_id),
  KEY FK_products_seller (seller_id),
  CONSTRAINT FK_products_category FOREIGN KEY (category_id) REFERENCES categories (id),
  CONSTRAINT FK_products_seller FOREIGN KEY (seller_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id bigint NOT NULL AUTO_INCREMENT,
  product_id bigint NOT NULL,
  image_url text,
  PRIMARY KEY (id),
  KEY FK_product_images_product (product_id),
  CONSTRAINT FK_product_images_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS carts (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  created_at datetime(6) DEFAULT NULL,
  updated_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UK_carts_user (user_id),
  CONSTRAINT FK_carts_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id bigint NOT NULL AUTO_INCREMENT,
  cart_id bigint NOT NULL,
  product_id bigint NOT NULL,
  quantity int NOT NULL,
  price decimal(10,2) NOT NULL,
  created_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY FK_cart_items_cart (cart_id),
  KEY FK_cart_items_product (product_id),
  CONSTRAINT FK_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts (id),
  CONSTRAINT FK_cart_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS orders (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  shipping_address varchar(255) DEFAULT NULL,
  order_status enum('CANCELLED','CONFIRMED','DELIVERED','OUT_FOR_DELIVERY','PENDING','REFUNDED','RETURNED','SHIPPED') NOT NULL DEFAULT 'PENDING',
  payment_method enum('COD','RAZORPAY','STRIPE') DEFAULT NULL,
  payment_status enum('COMPLETED','FAILED','PENDING','REFUNDED') NOT NULL DEFAULT 'PENDING',
  tracking_number varchar(255) DEFAULT NULL,
  notes varchar(255) DEFAULT NULL,
  created_at datetime(6) DEFAULT NULL,
  updated_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY FK_orders_user (user_id),
  CONSTRAINT FK_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id bigint NOT NULL AUTO_INCREMENT,
  order_id bigint NOT NULL,
  product_id bigint NOT NULL,
  quantity int NOT NULL,
  price decimal(10,2) NOT NULL,
  created_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY FK_order_items_order (order_id),
  KEY FK_order_items_product (product_id),
  CONSTRAINT FK_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT FK_order_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS payments (
  id bigint NOT NULL AUTO_INCREMENT,
  order_id bigint NOT NULL,
  user_id bigint NOT NULL,
  amount decimal(10,2) NOT NULL,
  payment_method enum('COD','RAZORPAY','STRIPE') NOT NULL,
  payment_status enum('COMPLETED','FAILED','PENDING','REFUNDED') NOT NULL,
  stripe_payment_id varchar(255) DEFAULT NULL,
  stripe_session_id varchar(255) DEFAULT NULL,
  created_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY FK_payments_order (order_id),
  KEY FK_payments_user (user_id),
  CONSTRAINT FK_payments_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT FK_payments_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS razorpay_payments (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  razorpay_order_id varchar(255) NOT NULL,
  razorpay_payment_id varchar(255) DEFAULT NULL,
  razorpay_signature varchar(255) DEFAULT NULL,
  amount decimal(10,2) NOT NULL,
  currency varchar(3) NOT NULL,
  status enum('COMPLETED','FAILED','PENDING') NOT NULL DEFAULT 'PENDING',
  order_id bigint DEFAULT NULL,
  created_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UK_razorpay_payments_order (razorpay_order_id),
  KEY FK_razorpay_payments_user (user_id),
  KEY FK_razorpay_payments_order (order_id),
  CONSTRAINT FK_razorpay_payments_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT FK_razorpay_payments_order FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  product_id bigint NOT NULL,
  rating int NOT NULL,
  comment varchar(255) DEFAULT NULL,
  created_at datetime(6) DEFAULT NULL,
  updated_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY FK_reviews_product (product_id),
  KEY FK_reviews_user (user_id),
  CONSTRAINT FK_reviews_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT FK_reviews_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS review_images (
  id bigint NOT NULL AUTO_INCREMENT,
  review_id bigint NOT NULL,
  image_url varchar(255) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY FK_review_images_review (review_id),
  CONSTRAINT FK_review_images_review FOREIGN KEY (review_id) REFERENCES reviews (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS coupons (
  id bigint NOT NULL AUTO_INCREMENT,
  code varchar(255) NOT NULL,
  discount_percentage decimal(5,2) NOT NULL,
  max_discount decimal(10,2) NOT NULL,
  min_purchase decimal(10,2) NOT NULL,
  usage_limit int NOT NULL DEFAULT 100,
  used_count int NOT NULL DEFAULT 0,
  valid_from datetime(6) NOT NULL,
  valid_until datetime(6) NOT NULL,
  active bit(1) NOT NULL DEFAULT b'1',
  created_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UK_coupons_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  title varchar(255) NOT NULL,
  message varchar(255) NOT NULL,
  is_read bit(1) NOT NULL DEFAULT b'0',
  link varchar(255) DEFAULT NULL,
  created_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY FK_notifications_user (user_id),
  CONSTRAINT FK_notifications_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS otp_verifications (
  id bigint NOT NULL AUTO_INCREMENT,
  email varchar(255) NOT NULL,
  otp varchar(255) NOT NULL,
  type enum('EMAIL_VERIFICATION','PASSWORD_RESET','REGISTRATION') NOT NULL,
  expiry_time datetime(6) NOT NULL,
  used bit(1) NOT NULL DEFAULT b'0',
  created_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS jwt_tokens (
  token_id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  token varchar(512) NOT NULL,
  token_type enum('ACCESS','REFRESH') NOT NULL,
  expires_at datetime(6) NOT NULL,
  revoked bit(1) NOT NULL DEFAULT b'0',
  expired bit(1) NOT NULL DEFAULT b'0',
  login_time datetime(6) DEFAULT NULL,
  logout_time datetime(6) DEFAULT NULL,
  created_at datetime(6) DEFAULT NULL,
  updated_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (token_id),
  KEY FK_jwt_tokens_user (user_id),
  CONSTRAINT FK_jwt_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS wishlists (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  created_at datetime(6) DEFAULT NULL,
  updated_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UK_wishlists_user (user_id),
  CONSTRAINT FK_wishlists_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS wishlist_products (
  wishlist_id bigint NOT NULL,
  product_id bigint NOT NULL,
  PRIMARY KEY (wishlist_id, product_id),
  KEY FK_wishlist_products_product (product_id),
  CONSTRAINT FK_wishlist_products_wishlist FOREIGN KEY (wishlist_id) REFERENCES wishlists (id),
  CONSTRAINT FK_wishlist_products_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint DEFAULT NULL,
  action varchar(255) NOT NULL,
  entity varchar(255) NOT NULL,
  entity_id bigint DEFAULT NULL,
  old_values text,
  new_values text,
  ip_address varchar(255) DEFAULT NULL,
  created_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
