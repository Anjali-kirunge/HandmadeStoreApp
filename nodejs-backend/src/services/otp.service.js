const crypto = require('crypto');
const db = require('../config/db');
const env = require('../config/env');
const { BadRequestException } = require('../utils/errors');
const { sendOtpEmail } = require('./email.service');
const { bool } = require('../utils/mappers');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = /^\d{6}$/;

function normalizeEmail(email) {
  return email === undefined || email === null ? null : String(email).trim().toLowerCase();
}

function typeName(type) {
  switch (type) {
    case 'PASSWORD_RESET':
      return 'Password Reset';
    case 'EMAIL_VERIFICATION':
      return 'Email Verification';
    case 'REGISTRATION':
    default:
      return 'Registration';
  }
}

async function generateOtp(email, type) {
  if (!type) {
    throw new BadRequestException('OTP type is required');
  }
  email = normalizeEmail(email);
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new BadRequestException('A valid email address is required');
  }

  const existing = await db.queryOne(
    'SELECT * FROM otp_verifications WHERE email = ? AND type = ? AND used = 0 ORDER BY created_at DESC LIMIT 1',
    [email, type]
  );

  if (existing && existing.created_at) {
    const elapsed = Math.floor((Date.now() - new Date(existing.created_at).getTime()) / 1000);
    if (elapsed < env.otp.resendCooldownSeconds) {
      throw new BadRequestException(
        'A verification code was recently sent. Please wait before requesting a new OTP.'
      );
    }
    await db.query('UPDATE otp_verifications SET used = 1 WHERE id = ?', [existing.id]);
  }

  const otp = String(crypto.randomInt(100000, 1000000)).padStart(6, '0');
  const expiryTime = new Date(Date.now() + env.otp.expiryMinutes * 60 * 1000);

  await db.query(
    'INSERT INTO otp_verifications (email, otp, type, expiry_time, used, created_at) VALUES (?, ?, ?, ?, 0, ?)',
    [email, otp, type, expiryTime, new Date()]
  );

  if (env.otp.exposeInLogs) {
    console.log(`DEV_OTP [${otp}] for ${email} - expires in ${env.otp.expiryMinutes} minutes`);
  }

  try {
    await sendOtpEmail(email, otp, typeName(type), env.otp.expiryMinutes);
  } catch (err) {
    console.warn(`Failed to send OTP email to ${email}: ${err.message}`);
  }
}

async function verifyOtp(email, otp, type) {
  if (!type || !OTP_PATTERN.test(String(otp || ''))) return false;
  email = normalizeEmail(email);
  if (!email || !EMAIL_PATTERN.test(email)) return false;

  const row = await db.queryOne(
    'SELECT * FROM otp_verifications WHERE email = ? AND type = ? AND used = 0 ORDER BY created_at DESC LIMIT 1',
    [email, type]
  );
  if (!row) return false;
  if (bool(row.used)) return false;
  if (new Date(row.expiry_time) < new Date()) return false;
  if (row.otp !== String(otp)) return false;

  await db.query('UPDATE otp_verifications SET used = 1 WHERE id = ?', [row.id]);
  return true;
}

module.exports = { generateOtp, verifyOtp };
