# Handmade Store

A full-stack e-commerce platform for handmade and artisan products, built with React/Vite frontend and Node.js/Express backend.

## Live Links

| Component | URL |
|-----------|-----|
| Frontend | https://handmadestore-app.vercel.app |
| Backend API | https://handmadestore-nodejs.onrender.com/api/v1 |

## Tech Stack

### Frontend
- React 19 + Vite
- Redux Toolkit (state management)
- React Router v7
- React Bootstrap + Bootstrap 5
- Axios (HTTP client)
- Chart.js (analytics)

### Backend
- Node.js + Express
- MySQL 8.0 (Aiven cloud)
- Razorpay (payments)
- Nodemailer (email/OTP)
- JWT (authentication)
- Multer (file uploads)
- PDFKit (invoice generation)

## Project Structure

```
HandmadeStoreApp/
├── frontend/          # React/Vite frontend
│   ├── src/
│   │   ├── admin/     # Admin dashboard pages
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/     # Redux store & slices
│   │   └── services/  # API service layer
│   └── package.json
├── nodejs-backend/    # Express backend
│   ├── src/
│   │   ├── config/    # DB, env, seed
│   │   ├── middleware/ # Auth, error handler
│   │   ├── routes/    # API route modules
│   │   └── services/  # Business logic
│   ├── sql/           # Database schema
│   └── package.json
└── docs/              # API documentation
```

## Features

- **Customer**: Product browsing, cart, wishlist, Razorpay checkout, order tracking, OTP-based registration
- **Seller**: Product management, order fulfillment, earnings dashboard, inventory tracking
- **Admin**: Dashboard with analytics, user/category/coupon management, order administration, payment monitoring
- **AI Chatbot**: Product recommendations via Hugging Face API

## Getting Started

### Prerequisites
- Node.js >= 18
- MySQL 8.0

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # set VITE_API_URL=http://localhost:8080/api/v1
npm run dev
```

### Backend
```bash
cd nodejs-backend
npm install
cp .env.example .env               # configure DB, JWT, Razorpay, SMTP
npm run seed                        # create tables + seed data
npm run dev
```

## Environment Variables

See `nodejs-backend/.env.example` for all required backend variables (database, JWT secret, Razorpay keys, SMTP credentials).

Frontend only needs `VITE_API_URL` pointing to the backend API base URL.

## API

All endpoints are under `/api/v1`. See `docs/API_MAPPING.md` for the full API contract.
