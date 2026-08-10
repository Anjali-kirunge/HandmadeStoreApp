export const API_BASE_URL = '/api/v1';

export const ROLES = {
  CUSTOMER: 'ROLE_CUSTOMER',
  SELLER: 'ROLE_SELLER',
  ADMIN: 'ROLE_ADMIN',
};

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
  'REFUNDED',
];

export const PAYMENT_METHODS = ['STRIPE', 'RAZORPAY', 'COD'];

export const PRODUCT_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'OUT_OF_STOCK',
  'DISCONTINUED',
];

export const ITEMS_PER_PAGE = 12;

export const CLOUDINARY_UPLOAD_PRESET = 'handmade_store';

export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
