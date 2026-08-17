const Role = Object.freeze({
  ROLE_CUSTOMER: 'ROLE_CUSTOMER',
  ROLE_SELLER: 'ROLE_SELLER',
  ROLE_ADMIN: 'ROLE_ADMIN',
});

const OrderStatus = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
  REFUNDED: 'REFUNDED',
});

const PaymentMethod = Object.freeze({
  STRIPE: 'STRIPE',
  RAZORPAY: 'RAZORPAY',
  COD: 'COD',
});

const PaymentStatus = Object.freeze({
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

const ProductStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DISCONTINUED: 'DISCONTINUED',
});

const OtpType = Object.freeze({
  REGISTRATION: 'REGISTRATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
});

const ReportType = Object.freeze({
  ORDERS: 'orders',
  PRODUCTS: 'products',
  USERS: 'users',
  PAYMENTS: 'payments',
  ANALYTICS: 'analytics',
});

const AuditActionType = Object.freeze({
  LOGIN: 'LOGIN',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  OTHER: 'OTHER',
});

const orderStatusValues = Object.values(OrderStatus);
const paymentMethodValues = Object.values(PaymentMethod);
const paymentStatusValues = Object.values(PaymentStatus);
const productStatusValues = Object.values(ProductStatus);
const otpTypeValues = Object.values(OtpType);
const roleValues = Object.values(Role);

module.exports = {
  Role,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  OtpType,
  ReportType,
  AuditActionType,
  orderStatusValues,
  paymentMethodValues,
  paymentStatusValues,
  productStatusValues,
  otpTypeValues,
  roleValues,
};
