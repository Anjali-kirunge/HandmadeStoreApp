const bcrypt = require('bcryptjs');
const db = require('../config/db');
const env = require('../config/env');
const jwtUtils = require('../utils/jwt');
const { mapUser, bool } = require('../utils/mappers');
const { BadRequestException, TooManyRequestsException } = require('../utils/errors');
const otpService = require('./otp.service');
const loginAttemptService = require('./loginAttempt.service');
const jwtTokenService = require('./jwtToken.service');
const { audit } = require('./audit.service');

function normalizeEmail(email) {
  return email === undefined || email === null ? null : String(email).trim().toLowerCase();
}

async function register(request) {
  const email = normalizeEmail(request.email);
  const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);

  if (user && bool(user.enabled)) {
    throw new BadRequestException('An account with this email already exists. Please login.');
  }

  const hash = await bcrypt.hash(request.password, 10);

  if (user) {
    await db.query(
      'UPDATE users SET first_name = ?, last_name = ?, phone = ?, password = ?, updated_at = ? WHERE id = ?',
      [request.firstName, request.lastName, request.phone || null, hash, new Date(), user.id]
    );
  } else {
    await db.query(
      `INSERT INTO users (first_name, last_name, email, password, phone, role, enabled, avatar, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'ROLE_CUSTOMER', 0, NULL, ?, ?)`,
      [request.firstName, request.lastName, email, hash, request.phone || null, new Date(), new Date()]
    );
  }

  await otpService.generateOtp(email, 'REGISTRATION');

  return {
    user: null,
    messageType: 'Registration initiated. Please verify your email with the OTP sent to activate your account.',
    otpRequired: true,
  };
}

function buildAuthResponse(user, messageType) {
  const accessToken = jwtUtils.generateAccessToken(user.email, user.role);
  const refreshToken = jwtUtils.generateRefreshToken(user.email);
  const accessExpiry = new Date(Date.now() + env.jwt.expiration);
  const refreshExpiry = new Date(Date.now() + env.jwt.refreshExpiration);
  return jwtTokenService.saveAccessToken(user.id, accessToken, accessExpiry)
    .then(() => jwtTokenService.saveRefreshToken(user.id, refreshToken, refreshExpiry))
    .then(() => ({
      token: accessToken,
      refreshToken,
      user: mapUser(user),
      messageType,
      otpRequired: false,
    }));
}

async function login(request) {
  const email = normalizeEmail(request.email);

  if (loginAttemptService.isBlocked(email)) {
    throw new TooManyRequestsException(
      'Too many failed login attempts. Please try again after 15 minutes.'
    );
  }

  const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    loginAttemptService.recordFailure(email);
    throw new BadRequestException('Invalid email or password');
  }

  const passwordOk = await bcrypt.compare(request.password, user.password);
  if (!passwordOk) {
    loginAttemptService.recordFailure(email);
    throw new BadRequestException('Invalid email or password');
  }

  if (!bool(user.enabled)) {
    loginAttemptService.recordFailure(email);
    throw new BadRequestException(
      'Your account is not verified yet. Please enter the OTP sent to your email to activate your account.'
    );
  }

  loginAttemptService.reset(email);

  await jwtTokenService.revokeAllForUser(user.id);
  const response = await buildAuthResponse(user, 'Login successful');

  await audit(user.id, 'LOGIN', 'USER', user.id, null, null, request.ip).catch(() => {});
  return response;
}

async function forgotPassword(request) {
  const email = normalizeEmail(request.email);
  const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    throw new BadRequestException('Email not found');
  }
  await otpService.generateOtp(email, 'PASSWORD_RESET');
  return { message: 'Password reset OTP sent to your email successfully' };
}

async function resetPassword(request) {
  const email = normalizeEmail(request.email);
  const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    throw new BadRequestException('User not found');
  }

  const valid = await otpService.verifyOtp(email, request.otp, 'PASSWORD_RESET');
  if (!valid) {
    throw new BadRequestException('Invalid or expired OTP. Please try requesting a new one.');
  }

  const hash = await bcrypt.hash(request.newPassword, 10);
  await db.query('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', [hash, new Date(), user.id]);
  await jwtTokenService.revokeAllForUser(user.id);

  return { message: 'Password reset successfully' };
}

async function refreshToken(refreshToken) {
  if (!refreshToken || !jwtUtils.validateToken(refreshToken)) {
    throw new BadRequestException('Invalid or expired refresh token. Please login again.');
  }
  if (!(await jwtTokenService.isRefreshTokenActive(refreshToken))) {
    throw new BadRequestException('Invalid or expired refresh token. Please login again.');
  }

  const email = jwtUtils.getEmailFromToken(refreshToken);
  const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    throw new BadRequestException('User not found');
  }

  await jwtTokenService.revokeToken(refreshToken);
  return buildAuthResponse(user, 'Token refreshed successfully');
}

async function verifyRegistrationOtp(email, otp) {
  email = normalizeEmail(email);
  const existingUser = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);

  if (existingUser && bool(existingUser.enabled)) {
    throw new BadRequestException('Your account is already verified. Please login.');
  }

  if (!existingUser) {
    throw new BadRequestException('No pending registration found for this email. Please register again.');
  }

  const valid = await otpService.verifyOtp(email, otp, 'REGISTRATION');
  if (!valid) {
    throw new BadRequestException('Invalid or expired OTP. Please try again or request a new code.');
  }

  await db.query(
    'UPDATE users SET enabled = 1, updated_at = ? WHERE id = ?',
    [new Date(), existingUser.id]
  );

  const cart = await db.queryOne('SELECT id FROM carts WHERE user_id = ?', [existingUser.id]);
  if (!cart) {
    await db.query(
      'INSERT INTO carts (user_id, created_at, updated_at) VALUES (?, ?, ?)',
      [existingUser.id, new Date(), new Date()]
    );
  }

  return { message: 'Email verified successfully. You can now login.' };
}

async function resendRegistrationOtp(email) {
  email = normalizeEmail(email);
  const existingUser = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (existingUser && bool(existingUser.enabled)) {
    throw new BadRequestException('Your account is already verified. Please login.');
  }
  if (!existingUser) {
    throw new BadRequestException('No pending registration found for this email. Please register again.');
  }

  await otpService.generateOtp(email, 'REGISTRATION');
  return { message: 'A new OTP has been sent to your email.' };
}

async function logout(token) {
  if (token) {
    try {
      const email = jwtUtils.getEmailFromToken(token);
      const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
      if (user) {
        await jwtTokenService.revokeAllForUser(user.id);
      }
    } catch (err) {
      // Best-effort logout: never fail even if the token is already invalid.
    }
  }
  return { message: 'Logged out successfully' };
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  logout,
};
