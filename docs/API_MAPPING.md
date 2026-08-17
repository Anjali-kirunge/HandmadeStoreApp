# Handmade Store - API Reference

REST API contract (`/api/v1`) for the Node.js/Express backend.
All endpoints return JSON responses compatible with the React/Vite frontend.

Base URL: `/api/v1`
Base URL on Render: `https://<new-node-backend>.onrender.com/api/v1`

---

## Global conventions

### Response envelope
Most endpoints return the resource object directly (e.g. `OrderResponse`).
Some endpoints return a simple map with `message` (and occasionally extra keys).

### Error responses
Error body shape (all error responses):
```json
{
  "timestamp": "2026-08-16T12:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Order not found with id: 1",
  "path": "/api/v1/orders/1"
}
```
Status codes:
- 400 BadRequestException / validation / malformed body / missing param / type mismatch / upload too large
- 404 ResourceNotFoundException
- 401 AuthenticationException (bad/expired token)
- 403 AccessDeniedException -> message "You do not have permission to perform this action"
- 409 DataIntegrityViolationException -> "The data you submitted conflicts with existing records. Please check and try again."
- 429 TooManyRequestsException (login lockout)
- 502 AiServiceException (chat)
- 500 generic -> "An unexpected error occurred. Please try again later."

Validation error shape (400):
```json
{
  "timestamp": "...",
  "status": 400,
  "error": "Validation Failed",
  "message": "Input validation failed",
  "path": "/api/v1/auth/register",
  "fieldErrors": { "email": "Please provide a valid email address" }
}
```

### Auth
- Header: `Authorization: Bearer <token>`
- Access token TTL 24h, refresh token TTL 7d. HS256/HS512 with base64 secret >= 32 bytes.
- JWT claims: `sub`=email, `tokenType`=ACCESS|REFRESH, `role` (access only: `ROLE_CUSTOMER`/`ROLE_SELLER`/`ROLE_ADMIN`), `iat`, `exp`, `jti`.
- Tokens are persisted in `jwt_tokens` table; refresh rotates (old refresh revoked on use). Logout revokes all user tokens.

### Public (no auth) endpoints
- `GET /` (message), `GET /health`
- `POST /api/v1/auth/**` (all auth endpoints public)
- `POST /api/v1/chat`
- `GET /api/v1/products/**`
- `GET /api/v1/categories/**`
- `GET /api/v1/reviews/product/**`
- `GET /uploads/**` (static images)
- `POST /api/v1/otp/**`

### Role-gated
- `/api/v1/admin/**` -> role ADMIN
- `/api/v1/seller/**` -> role SELLER
- everything else -> authenticated (any role)

### Pagination (PageResponse)
```json
{ "content": [], "pageNumber": 0, "pageSize": 10, "totalElements": 0, "totalPages": 0, "last": true }
```

### Enums (values, uppercase)
- Role: `ROLE_CUSTOMER`, `ROLE_SELLER`, `ROLE_ADMIN` (DB column stores `CUSTOMER/SELLER/ADMIN` in JPA but frontend uses `ROLE_*`; verify serialization: `UserResponse.role` is the enum name which is `ROLE_*`)
- OrderStatus: `PENDING, CONFIRMED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURNED, REFUNDED`
- PaymentMethod: `STRIPE, RAZORPAY, COD`
- PaymentStatus: `PENDING, COMPLETED, FAILED, REFUNDED`
- ProductStatus: `ACTIVE, INACTIVE, OUT_OF_STOCK, DISCONTINUED`
- OtpType: `REGISTRATION, PASSWORD_RESET, EMAIL_VERIFICATION`
- TokenType: `ACCESS, REFRESH`
- RazorpayPaymentStatus: `PENDING, COMPLETED, FAILED`

### Money
All money is decimal with 2 places (JSON numbers). Razorpay amount is in paise (Integer).

---

## Endpoint inventory

### Root / Health
| Method | Path | Public | Response |
|---|---|---|---|
| GET | `/` | yes | text `Handmade Store Backend Running` |
| GET | `/health` | yes | `{ "status": "UP" }` |

### Auth (`/api/v1/auth`)
| Method | Path | Request body | Response |
|---|---|---|---|
| POST | `/auth/register` (201) | `{firstName, lastName, email, password, phone?}` | `AuthResponse` (user null, otpRequired true, messageType) |
| POST | `/auth/login` | `{email, password}` | `AuthResponse` {token, refreshToken, user, messageType} |
| POST | `/auth/verify-registration-otp` | `{email, otp}` | `{message}` |
| POST | `/auth/resend-registration-otp` | `{email}` | `{message}` |
| POST | `/auth/logout` | empty (Authorization header) | `{message}` |
| POST | `/auth/forgot-password` | `{email}` | `{message}` |
| POST | `/auth/reset-password` | `{email, otp, newPassword}` | `{message}` |
| POST | `/auth/refresh-token` | `{refreshToken}` | `AuthResponse` |

AuthResponse:
```json
{ "token": "...", "refreshToken": "...", "user": {UserResponse}, "messageType": "Login successful", "otpRequired": false }
```
Register returns: `{ "user": null, "messageType": "Registration initiated. Please verify your email with the OTP sent to activate your account.", "otpRequired": true }`

Validation: password min 6 chars; email format. Login errors: disabled account -> "Your account is not verified yet..."; bad creds -> "Invalid email or password" (400). Login lockout after 5 fails for 15 min -> 429 "Too many failed login attempts. Please try again after 15 minutes."

### OTP (`/api/v1/otp`)
| Method | Path | Request body | Response |
|---|---|---|---|
| POST | `/otp/generate` | `{email, type}` | `ApiResponse.success` `{timestamp, message, success:true}` |
| POST | `/otp/verify` | `{email, otp, type}` | `ApiResponse.success` or 400 "Invalid or expired OTP" |

### Products (`/api/v1/products`)
| Method | Path | Params / body | Auth | Response |
|---|---|---|---|---|
| GET | `/products` | page=0, size=10 | public | `PageResponse<ProductResponse>` |
| GET | `/products/search` | query: keyword, categoryId?, minPrice?, maxPrice?, sortBy?, page=0, size=10 | public | `PageResponse<ProductResponse>` |
| GET | `/products/featured` | page=0, size=10 | public | `PageResponse<ProductResponse>` |
| GET | `/products/category/{categoryId}` | page=0, size=10 | public | `PageResponse<ProductResponse>` |
| GET | `/products/{id}` | - | public | `ProductResponse` |
| GET | `/products/seller` | page=0, size=10 | SELLER | `PageResponse<ProductResponse>` |
| POST | `/products` | `ProductRequest` | SELLER | `ProductResponse` |
| PUT | `/products/{id}` | `ProductRequest` | SELLER (own) | `ProductResponse` |
| DELETE | `/products/{id}` | - | SELLER (own) | `{message}` |
| PUT | `/products/{id}/stock` | `{quantity}` | SELLER (own) | `ProductResponse` |
| PUT | `/products/{id}/featured` | - | SELLER (own) | `ProductResponse` |

ProductRequest: `{name, description, price, discountPrice?, sku, stockQuantity, imageUrl?, images[]?, categoryId, isFeatured?}`
ProductResponse:
```json
{
  "id": 1, "name": "...", "description": "...", "sku": "HD-001",
  "price": 1299, "discountPrice": 999, "stockQuantity": 18,
  "imageUrl": "https://...", "images": ["..."],
  "category": {CategoryResponse} | null, "seller": {UserResponse} | null,
  "rating": 4.5, "reviewCount": 15, "status": "ACTIVE", "isFeatured": true,
  "createdAt": "2026-07-28T15:55:40"
}
```

### Categories (`/api/v1/categories`)
| Method | Path | Params / body | Auth | Response |
|---|---|---|---|---|
| GET | `/categories` | query: parentId? | public | `List<CategoryResponse>` (children nested) |
| GET | `/categories/root` | - | public | `List<CategoryResponse>` root-level only |
| GET | `/categories/parent/{parentId}` | - | public | `List<CategoryResponse>` children of parentId |
| GET | `/categories/{id}` | - | public | `CategoryResponse` with children |
| POST | `/categories` | `CategoryRequest` | ADMIN | `CategoryResponse` |
| PUT | `/categories/{id}` | `CategoryRequest` | ADMIN | `CategoryResponse` |
| DELETE | `/categories/{id}` | - | ADMIN | `{message}` |

CategoryRequest: `{name, description?, imageUrl?, parentId?}`
CategoryResponse:
```json
{ "id": 1, "name": "...", "description": "...", "imageUrl": "...", "parentCategory": null | {CategoryResponse}, "children": [], "createdAt": "..." }
```
(Note: AdminSearchService serializes `parentCategory` as id Long; CategoryController/CategoryServiceImpl may serialize full object. Node impl: serialize full CategoryResponse object; the frontend categorySlice handles both.)

### Cart (`/api/v1/cart`)
All require auth (any role).
| Method | Path | Body / params | Response |
|---|---|---|---|
| GET | `/cart` | - | `CartResponse` |
| POST | `/cart` | `{productId, quantity}` | `CartResponse` |
| PUT | `/cart/{productId}` | query `quantity` | `CartResponse` |
| DELETE | `/cart/{productId}` | - | `{message}` |
| DELETE | `/cart` | - | `{message}` |

CartResponse:
```json
{
  "id": 1,
  "items": [{ "id": 1, "product": {ProductResponse}, "quantity": 2, "price": 999, "subtotal": 1998 }],
  "totalPrice": 1998,
  "totalItems": 2
}
```
Price per item = discountPrice ?? price. Add item: if exists, increase quantity. Quantity must be >= 1 and <= stock.

### Orders (`/api/v1/orders`)
| Method | Path | Params / body | Auth | Response |
|---|---|---|---|---|
| POST | `/orders` | `OrderRequest` | auth | `OrderResponse` |
| GET | `/orders` | page=0, size=10 | auth (own) | `PageResponse<OrderResponse>` |
| GET | `/orders/{id}` | - | auth (own) | `OrderResponse` |
| PUT | `/orders/{id}/cancel` | - | auth (own) | `{message, order}` |

OrderRequest: `{shippingAddress, paymentMethod?, couponCode?, notes?}` (paymentMethod default COD)
OrderResponse:
```json
{
  "id": 1, "items": [{ "id":1, "product": {ProductResponse}, "quantity":1, "price":999, "subtotal":999 }],
  "totalAmount": 999, "shippingAddress": "...", "orderStatus": "PENDING",
  "paymentStatus": "PENDING", "paymentMethod": "COD", "trackingNumber": null,
  "notes": null, "createdAt": "..."
}
```
Place order logic:
- cart must be non-empty; each item qty <= product stock else 400 `Insufficient stock for product: <name>`
- item price = discountPrice ?? price; item.subtotal = price*qty
- decrement stock; if stock hits 0 -> status OUT_OF_STOCK
- apply coupon (see CouponService rules) if couponCode present: discount = min(total * pct/100, maxDiscount); total -= discount
- create order (PENDING/PENDING), payment row (PENDING), clear cart
Cancel rules: only when PENDING or CONFIRMED; restores stock (OUT_OF_STOCK -> ACTIVE); sets CANCELLED / REFUNDED.

### Admin (`/api/v1/admin`) - role ADMIN
| Method | Path | Params / body | Response |
|---|---|---|---|
| GET | `/admin/dashboard` | - | `AdminDashboardResponse` |
| GET | `/admin/orders` | keyword?, status?, page=0, size=10 | `PageResponse<AdminOrderResponse>` |
| GET | `/admin/orders/{id}` | - | `AdminOrderResponse` |
| GET | `/admin/orders/{id}/invoice` | - | PDF bytes (content-disposition attachment `invoice-order-{id}.pdf`) |
| PUT | `/admin/orders/{id}/status` | `{orderStatus, trackingNumber?}` | `OrderResponse` |
| GET | `/admin/orders/status/{status}` | page=0, size=10 | `PageResponse<AdminOrderResponse>` |
| GET | `/admin/users` | keyword?, page=0, size=10 | `PageResponse<UserResponse>` |
| GET | `/admin/users/{id}` | - | `UserResponse` |
| GET | `/admin/users/{id}/orders` | page=0, size=10 | `PageResponse<OrderResponse>` |
| PUT | `/admin/users/{id}/role` | `{role}` | `UserResponse` |
| PUT | `/admin/users/{id}` | `{firstName, lastName, phone}` | `UserResponse` |
| PUT | `/admin/users/{id}/toggle` | - | `UserResponse` |
| DELETE | `/admin/users/{id}` | - | `{message}` |
| GET | `/admin/products` | keyword?, status?, page=0, size=10 | `PageResponse<ProductResponse>` |
| POST | `/admin/products` | `ProductRequest` | `ProductResponse` |
| PUT | `/admin/products/{id}` | `ProductRequest` | `ProductResponse` |
| DELETE | `/admin/products/{id}` | - | `{message: "Product deleted successfully"}` |
| PUT | `/admin/products/{id}/stock` | `{quantity}` | `ProductResponse` |
| PUT | `/admin/products/{id}/status` | `{status}` | `ProductResponse` |
| PUT | `/admin/products/{id}/featured` | - | `ProductResponse` |
| GET | `/admin/inventory/low-stock` | - | `List<ProductResponse>` |
| GET | `/admin/payments` | status?, page=0, size=10 | `PageResponse<PaymentAdminResponse>` |
| GET | `/admin/search` | q, limit=10 | `GlobalSearchResponse` |
| GET | `/admin/coupons` | - | `List<CouponResponse>` |
| POST | `/admin/coupons` | `CouponRequest` | `CouponResponse` |
| PUT | `/admin/coupons/{id}` | `CouponRequest` | `CouponResponse` |
| PUT | `/admin/coupons/{id}/toggle` | - | `CouponResponse` |
| DELETE | `/admin/coupons/{id}` | - | `{message}` |
| GET | `/admin/reviews` | page=0, size=10 | `PageResponse<ReviewResponse>` |
| DELETE | `/admin/reviews/{id}` | - | `{message}` |
| GET | `/admin/notifications` | email (required) | `List<NotificationResponse>` |
| GET | `/admin/analytics` | from?, to?, topN=5 | `AnalyticsResponse` |

AdminOrderResponse = OrderResponse + `user` (UserResponse).
AdminDashboardResponse:
```json
{
  "totalUsers": 10, "totalSellers": 2, "totalProducts": 84, "totalOrders": 4,
  "totalRevenue": 3278,
  "recentOrders": [OrderResponse],
  "monthlySales": [0.0, ...12],
  "orderStatusCounts": { "PENDING": 2, "CONFIRMED": 0, ... all statuses }
}
```
PaymentAdminResponse:
```json
{ "id":1, "user": {UserResponse}, "orderId": 1, "amount": 999, "stripePaymentId": null, "stripeSessionId": null, "paymentMethod": "RAZORPAY", "paymentStatus": "COMPLETED", "createdAt": "..." }
```
GlobalSearchResponse: `{ products: [], users: [], orders: [], categories: [], coupons: [], totalResults: 0 }`
AnalyticsResponse:
```json
{
  "summary": { "totalRevenue":0, "totalOrders":0, "totalCustomers":0, "totalSellers":0, "totalProducts":0, "todayRevenue":0, "todayOrders":0, "thisWeekRevenue":0, "thisWeekOrders":0, "thisMonthRevenue":0, "thisMonthOrders":0, "thisYearRevenue":0, "thisYearOrders":0, "averageOrderValue":0 },
  "dailyRevenue": [ { "label":"2026-08-16", "revenue":0, "orders":0 } ],
  "monthlyRevenue": [ { "label":"2026-07", "revenue":0, "orders":0 } ],
  "yearlyRevenue": [ { "label":"2026", "revenue":0, "orders":0 } ],
  "topProducts": [ { "id":1,"name":"","imageUrl":"","price":0,"categoryName":"","totalQuantitySold":0,"revenue":0 } ],
  "topCustomers": [ { "id":1,"name":"","email":"","totalOrders":0,"totalSpent":0,"lastOrderAt":"..." } ],
  "categoryBreakdown": [ { "categoryId":1,"name":"","productCount":0,"totalOrders":0,"revenue":0 } ],
  "orderStatusDistribution": { "PENDING":0, ... },
  "paymentStatusDistribution": { "PENDING":0, "COMPLETED":0, "FAILED":0, "REFUNDED":0 }
}
```

### Reports (`/api/v1/admin/reports`) - role ADMIN
| Method | Path | Params | Response |
|---|---|---|---|
| GET | `/admin/reports/orders` | format (csv|excel|pdf), keyword?, status?, from?, to? | binary file `handmade-orders-report.{csv,xlsx,pdf}` |
| GET | `/admin/reports/products` | format, keyword?, status?, lowStockOnly=false | binary |
| GET | `/admin/reports/users` | format, keyword?, role? | binary |
| GET | `/admin/reports/payments` | format, status?, from?, to? | binary |
| GET | `/admin/reports/analytics` | format, from?, to? | binary |
CSV is a simple UTF-8 text/csv; Excel is xlsx; PDF is application/pdf. `Content-Disposition: attachment; filename="handmade-<type>-report.<ext>"`. Node MVP: implement CSV fully; excel/pdf can use libraries (e.g. `xlsx`, `pdfkit`) or a stub returning CSV for those formats (documented).

### Seller (`/api/v1/seller`) - role SELLER
| Method | Path | Params / body | Response |
|---|---|---|---|
| GET | `/seller/dashboard` | - | `SellerDashboardResponse` |
| GET | `/seller/orders` | page=0, size=10 | `PageResponse<OrderResponse>` |
| PUT | `/seller/orders/{id}/status` | `{orderStatus, trackingNumber?}` | `OrderResponse` |

SellerDashboardResponse:
```json
{ "totalProducts":0, "totalOrders":0, "totalRevenue":0, "pendingOrders":0, "recentOrders":[OrderResponse], "monthlyEarnings":[0.0,...12], "topProducts":[ProductResponse] }
```

### Reviews (`/api/v1/reviews`)
| Method | Path | Params / body | Auth | Response |
|---|---|---|---|---|
| GET | `/reviews/product/{productId}` | page=0, size=10 | public | `PageResponse<ReviewResponse>` |
| GET | `/reviews/product/{productId}/can-review` | - | auth | `{canReview: true}` (or map) |
| POST | `/reviews/product/{productId}` | `{rating, comment?, images[]?}` | auth (must have purchased; 1 per user/product) | `ReviewResponse` |
| PUT | `/reviews/{id}` | `{rating, comment?, images[]?}` | auth (own) | `ReviewResponse` |
| DELETE | `/reviews/{id}` | - | auth (own) | `{message}` |

ReviewResponse:
```json
{ "id":1, "user": {UserResponse}, "product": {ProductResponse}, "rating":5, "comment":"...", "images":[], "createdAt":"..." }
```
Rating must be 1..5. Submitting review updates product.rating/reviewCount (average).

### Users (`/api/v1/users`)
| Method | Path | Body | Auth | Response |
|---|---|---|---|---|
| GET | `/users/me` | - | auth | `UserResponse` |
| PUT | `/users/me` | `{firstName?, lastName?, phone?, avatar?}` | auth | `UserResponse` |
| PUT | `/users/me/change-password` | `{currentPassword, newPassword}` | auth | `{message}` |
| GET | `/users` | keyword?, page=0, size=10 | ADMIN | `PageResponse<UserResponse>` |

UserResponse:
```json
{ "id":1, "firstName":"A", "lastName":"B", "email":"a@b.com", "phone":"123", "avatar":null, "role":"ROLE_CUSTOMER", "enabled":true, "createdAt":"..." }
```
Change password: verify currentPassword (bcrypt) else 400; newPassword min 6.

### Addresses (`/api/v1/addresses`) - auth
| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/addresses` | - | `List<AddressResponse>` |
| POST | `/addresses` | `{street, city, state, zipCode, country, isDefault?}` | `AddressResponse` |
| PUT | `/addresses/{id}` | `AddressRequest` | `AddressResponse` |
| DELETE | `/addresses/{id}` | - | `{message}` |
| PUT | `/addresses/{id}/default` | - | `AddressResponse` |

AddressResponse:
```json
{ "id":1, "street":"", "city":"", "state":"", "zipCode":"", "country":"", "isDefault":false, "createdAt":"..." }
```
Only one default address per user.

### Coupons (`/api/v1/coupons`)
| Method | Path | Body/params | Auth | Response |
|---|---|---|---|---|
| POST | `/coupons/apply` | `{code, orderTotal}` | auth | `{message, discount, finalTotal, couponCode}` |
| GET | `/coupons/{code}/validate` | query `orderTotal` | auth | `{valid, discountPercentage, maxDiscount, discount, finalTotal}` |

Coupon validation rules (400 on failure): active, usedCount < usageLimit, now >= validFrom, now <= validUntil (if set), orderTotal >= minPurchase. Discount = min(orderTotal * discountPercentage/100, maxDiscount).
CouponResponse:
```json
{ "id":1, "code":"WELCOME10", "discountPercentage":10.0, "maxDiscount":200, "minPurchase":500, "usageLimit":100, "usedCount":0, "validFrom":"...", "validUntil":"...", "active":true }
```
CouponRequest (admin): `{code, discountPercentage, maxDiscount, minPurchase, usageLimit?, validFrom?, validUntil?}`

### Wishlist (`/api/v1/wishlist`) - auth
| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/wishlist` | - | `WishlistResponse` |
| POST | `/wishlist` | `{productId}` | `WishlistResponse` |
| DELETE | `/wishlist/{productId}` | - | `{message}` |

WishlistResponse: `{ "id":1, "products": [ProductResponse] }`

### Notifications (`/api/v1/notifications`) - auth
| Method | Path | Response |
|---|---|---|
| GET | `/notifications` | `List<NotificationResponse>` |
| PUT | `/notifications/{id}/read` | `{message}` |
| PUT | `/notifications/read-all` | `{message}` |
| GET | `/notifications/unread-count` | `{count: n}` |

NotificationResponse: `{ "id":1, "title":"Order Update: #1", "message":"...", "isRead":false, "link":"/orders/1", "createdAt":"..." }`

### Images (`/api/v1/images`)
| Method | Path | Body | Auth | Response |
|---|---|---|---|---|
| POST | `/images/upload` | multipart field `file` (Java) / `image` (frontend) | auth | `{ "url": "/uploads/<uuid>.<ext>" }` |
Allowed: jpeg/png/webp/gif, <= 5MB. Node: accept BOTH field names `file` and `image`; store under `backend/uploads`; serve statically at `/uploads`.

### Payments (`/api/v1/payments`) - auth
| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/payments/create-order` | `OrderRequest` | `RazorpayCreateOrderResponse` |
| POST | `/payments/verify` | `RazorpayVerifyRequest` | `OrderResponse` |
| POST | `/payments/create-checkout-session` | `{orderId}` | `{sessionId, url, message}` (demo) |
| POST | `/payments/webhook` | raw body + `Stripe-Signature` header | `{message}` (demo: skipped) |
| GET | `/payments` | - | `List<PaymentResponse>` |

RazorpayCreateOrderResponse:
```json
{ "razorpayOrderId": "order_xxx", "amount": 99900, "amountInRupees": 999, "currency": "INR", "keyId": "rzp_test_xxx" }
```
RazorpayVerifyRequest: `{razorpayOrderId, razorpayPaymentId, razorpaySignature, orderRequest: OrderRequest}`
Verify: validate signature over `razorpayOrderId|razorpayPaymentId` with key secret (HMAC-SHA256); then place order with paymentMethod=RAZORPAY, mark COMPLETED.
PaymentResponse: `{ id, amount, stripePaymentId, paymentMethod, paymentStatus, createdAt }`

### Chat (`/api/v1/chat`) - public
| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/chat` | `{message, history?: [{role, content}]}` | `{ reply: "..." }` |
Behavior: if message looks like a catalog question (keywords), answer from catalog data (DB search, no LLM). Otherwise call HuggingFace LLM (default model google/gemma-2-2b-it) with system prompt + last <=10 history messages. If HF key absent, return a friendly rule-based reply (must not error). Errors -> 502.

### Other admin endpoints from admin-app (frontend `admin/api/index.js`)
- `GET /admin/analytics` (covered above)
- `GET /admin/inventory/low-stock` (covered)
- Reports (covered)

### Endpoints present in frontend but not in this table (verify)
- `PUT /products/{id}/stock` used by admin-api as `PUT /admin/products/{id}/stock` (covered)
- `GET /products/seller` (covered)

---

## Database schema (20 tables, snake_case)

Derived from `aiven_defaultdb_migration.sql`. New Node backend uses the same table
names and column names. Columns for every table include `created_at`/`updated_at`
as `datetime(6)` where present in the dump.

Tables:
1. `users` (id, first_name, last_name, email UNIQUE, password, phone, avatar, role enum('ROLE_ADMIN','ROLE_CUSTOMER','ROLE_SELLER'), enabled bit, created_at, updated_at)
2. `addresses` (id, user_id FK, street, city, state, zip_code, country, is_default bit, created_at, updated_at)
3. `categories` (id, name UNIQUE, description, image_url, parent_id FK self, created_at, updated_at)
4. `products` (id, name, description, sku UNIQUE, price decimal(10,2), discount_price decimal(10,2), stock_quantity, image_url text, is_featured bit, rating double, review_count, status enum('ACTIVE','INACTIVE','OUT_OF_STOCK','DISCONTINUED'), category_id FK, seller_id FK users, created_at, updated_at)
5. `product_images` (id, product_id FK, image_url text)
6. `carts` (id, user_id UNIQUE FK, created_at, updated_at)
7. `cart_items` (id, cart_id FK, product_id FK, quantity, price decimal(10,2), created_at)
8. `orders` (id, user_id FK, total_amount decimal(10,2), shipping_address, order_status enum(...), payment_method enum('STRIPE','RAZORPAY','COD'), payment_status enum('PENDING','COMPLETED','FAILED','REFUNDED'), tracking_number, notes, created_at, updated_at)
9. `order_items` (id, order_id FK, product_id FK, quantity, price decimal(10,2), created_at)
10. `payments` (id, order_id FK, user_id FK, amount decimal(10,2), payment_method enum, payment_status enum, stripe_payment_id, stripe_session_id, created_at)
11. `razorpay_payments` (id, user_id FK, razorpay_order_id UNIQUE, razorpay_payment_id, razorpay_signature, amount decimal(10,2), currency varchar(3), status enum('PENDING','COMPLETED','FAILED'), order_id FK, created_at)
12. `reviews` (id, user_id FK, product_id FK, rating int, comment, created_at, updated_at)
13. `review_images` (id, review_id FK, image_url)
14. `coupons` (id, code UNIQUE, discount_percentage decimal(5,2), max_discount decimal(10,2), min_purchase decimal(10,2), usage_limit, used_count, valid_from datetime, valid_until datetime, active bit, created_at)
15. `notifications` (id, user_id FK, title, message, is_read bit, link, created_at)
16. `otp_verifications` (id, email, otp, type enum('EMAIL_VERIFICATION','PASSWORD_RESET','REGISTRATION'), expiry_time datetime, used bit, created_at)
17. `jwt_tokens` (token_id, user_id FK, token varchar(512), token_type enum('ACCESS','REFRESH'), expires_at, revoked bit, expired bit, login_time, logout_time, created_at, updated_at)
18. `wishlists` (id, user_id UNIQUE FK, created_at, updated_at)
19. `wishlist_products` (wishlist_id FK, product_id FK, PK(wishlist_id, product_id))
20. `audit_logs` (id, user_id, action, entity, entity_id, old_values text, new_values text, ip_address, created_at)

Bit columns are `bit(1)` (0/1) in MySQL; in Node use TINYINT(1) or keep BIT and map 0/1.

---

## Seed data (for the NEW database only)
From `DataSeeder.java` (NOT the migration dump's live users - those contain real PII and must not be copied):
- Users (bcrypt): admin@handmade.com / admin123 (ADMIN), seller1@handmade.com / seller123, seller2@handmade.com / seller123 (SELLER), customer1@handmade.com / customer123, customer2@handmade.com / customer123 (CUSTOMER)
- 6 categories, 12 products (HB/PT/DC/JW/PA/WC series), carts for all 5 users, 8 reviews, 2 coupons (WELCOME10, FLAT200)
- Node: generate fresh bcrypt hashes at seed time (do not reuse hashes; passwords documented above).
