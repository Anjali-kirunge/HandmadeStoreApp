# Running and Testing the Handmade Store

## Prerequisites
- Java 21+
- Node.js 20+
- MySQL 8.0+
- Docker (Optional)

## Running the Project

### 1. Database (MySQL)
Ensure MySQL is running with the following credentials (or use Docker):
- **Host**: localhost
- **Port**: 3306
- **Database**: handmade_store
- **Username**: root
- **Password**: root

The database is auto-created by Hibernate.

### 2. Backend (Spring Boot)
Open a terminal in the `backend` directory and run:
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
The backend API will start at **http://localhost:8080**.

### 3. Frontend (React)
Open a terminal in the `frontend` directory and run:
```bash
cd frontend
npm install
npm run dev
```
The frontend application will start at **http://localhost:5173**.

### 4. Admin App (React)
The project also contains an `admin-app` directory. Open a terminal in the `admin-app` directory and run:
```bash
cd admin-app
npm install
npm run dev
```
The admin application will start (check the terminal for the port, usually `5174` or `5173` if the main frontend is not running).

### 5. Docker (Full Stack Alternative)
Alternatively, you can run the backend, frontend, and MySQL using Docker Compose from the root directory:
```bash
docker-compose up --build
```

---

## Testing Admin and Every Pages

### 1. Default Test Credentials
The backend automatically seeds the database with the following default users upon first run. Use these to test different access levels across pages:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@handmade.com | admin123 |
| Seller | seller1@handmade.com | seller123 |
| Customer | customer1@handmade.com | customer123 |

### 2. Testing the Admin Pages
To test the admin functionalities:
1. Make sure the backend and frontend (or `admin-app`) are running.
2. Navigate to the login page (e.g., http://localhost:5173/login).
3. Log in using the **Admin** credentials (`admin@handmade.com` / `admin123`).
4. **Pages to test:**
   - **Dashboard:** Check if statistics and charts load correctly.
   - **Users:** Verify you can view all users, change roles, and enable/disable accounts.
   - **Products/Categories:** Test managing platform products and categories.
   - **Orders:** Verify you can view all platform orders and update their statuses.
   - **Coupons:** Test creating and managing discount coupons (e.g., test the default seeded `WELCOME10` or `FLAT200`).
   - **Reviews:** Check review moderation (ability to delete inappropriate reviews).

### 3. Testing Every Other Page (Customer & Seller)
To test the full user flow across all pages:

**Customer Pages:**
1. Log in as `customer1@handmade.com` / `customer123`.
2. **Pages to test:**
   - **Home & Shop:** Browse products, use search, and category filters.
   - **Product Details:** Open a product to check details, image zoom, and read/write reviews.
   - **Cart:** Add items, update quantities, and apply a coupon (e.g., `WELCOME10`).
   - **Checkout:** Proceed to checkout, test Cash on Delivery or Stripe payment flows (if Stripe is configured).
   - **Orders & Profile:** Check order history, status timeline, and update profile/address details.
   - **Wishlist:** Add/remove items from the wishlist.

**Seller Pages:**
1. Log in as `seller1@handmade.com` / `seller123`.
2. **Pages to test:**
   - **Seller Dashboard:** Check revenue analytics and order overview.
   - **My Products:** Test creating a new product (with Cloudinary image upload if configured), editing, and deleting.
   - **My Orders:** View orders placed for your products and update their fulfillment statuses.
   - **Earnings:** Verify earnings overview with charts.

### 4. API Testing via Swagger/Postman
If you want to test the backend endpoints directly without the UI:
- Open the Swagger UI at http://localhost:8080/swagger-ui.html
- Or import the `HandmadeStore.postman_collection.json` file (found in the root directory) into Postman.
- Use the `/api/v1/auth/login` endpoint to get a JWT token, and use it as a Bearer token for authorized requests.
