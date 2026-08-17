const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const toInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

const toBool = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true' || value === '1';
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 8080),

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: toInt(process.env.DB_PORT, 3306),
    name: process.env.DB_NAME || 'handmade_store_nodejs',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    poolSize: toInt(process.env.DB_POOL_SIZE, 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'Y2hhbmdlLW1lLXBsZWFzZS1hLTI0LWJ5dGUtc2VjcmV0LXN0cmluZw==',
    expiration: toInt(process.env.JWT_EXPIRATION, 86400000),
    refreshExpiration: toInt(process.env.JWT_REFRESH_EXPIRATION, 604800000),
  },

  cors: {
    allowedOrigins: (process.env.APP_CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: toInt(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || process.env.MAIL_USERNAME || '',
    pass: process.env.SMTP_PASS || process.env.MAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || process.env.MAIL_FROM || 'Handmade Store',
  },

  hf: {
    apiKey: process.env.HF_API_KEY || '',
    model: process.env.HF_MODEL || 'google/gemma-2-2b-it',
    fallbackModel: process.env.HF_FALLBACK_MODEL || 'google/gemma-3-4b-it',
  },

  login: {
    maxAttempts: toInt(process.env.LOGIN_MAX_ATTEMPTS, 5),
    lockMinutes: toInt(process.env.LOGIN_LOCK_MINUTES, 15),
  },

  otp: {
    expiryMinutes: toInt(process.env.OTP_EXPIRY_MINUTES, 10),
    resendCooldownSeconds: toInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
    exposeInLogs: toBool(process.env.OTP_EXPOSE_IN_LOGS, true),
  },

  upload: {
    dir: process.env.APP_UPLOAD_DIR || './uploads',
    url: process.env.APP_UPLOAD_URL || '/uploads',
  },
};

module.exports = env;
