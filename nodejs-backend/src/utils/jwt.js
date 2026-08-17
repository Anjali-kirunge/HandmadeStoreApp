const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

function signingKey() {
  let secret = env.jwt.secret;
  if (!/^[A-Za-z0-9+/=]+$/.test(secret)) {
    return crypto.createHash('sha256').update(secret).digest();
  }
  try {
    const decoded = Buffer.from(secret, 'base64');
    if (decoded.length >= 32) return decoded;
  } catch (err) {
    /* fall through */
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function generateToken(email, role, tokenType) {
  const expiration =
    tokenType === 'REFRESH' ? env.jwt.refreshExpiration : env.jwt.expiration;
  const payload = {
    sub: email,
    tokenType,
    jti: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + expiration) / 1000),
  };
  if (tokenType === 'ACCESS') payload.role = role;
  return jwt.sign(payload, signingKey(), { algorithm: 'HS256' });
}

function generateAccessToken(email, role) {
  return generateToken(email, role, 'ACCESS');
}

function generateRefreshToken(email) {
  return generateToken(email, null, 'REFRESH');
}

function decodeToken(token) {
  return jwt.verify(token, signingKey(), { algorithms: ['HS256'] });
}

function getEmailFromToken(token) {
  return decodeToken(token).sub;
}

function getExpirationDate(token) {
  return new Date(decodeToken(token).exp * 1000);
}

function validateToken(token) {
  try {
    decodeToken(token);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  getEmailFromToken,
  getExpirationDate,
  validateToken,
  decodeToken,
};
