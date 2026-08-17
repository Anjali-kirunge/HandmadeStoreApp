const db = require('../config/db');
const { bool } = require('../utils/mappers');

async function isTokenActive(token) {
  const row = await db.queryOne('SELECT * FROM jwt_tokens WHERE token = ?', [token]);
  if (!row) return false;
  return !bool(row.revoked) && !bool(row.expired) && row.expires_at && new Date(row.expires_at) > new Date();
}

async function isRefreshTokenActive(token) {
  const row = await db.queryOne('SELECT * FROM jwt_tokens WHERE token = ?', [token]);
  if (!row) return false;
  return row.token_type === 'REFRESH' && !bool(row.revoked) && !bool(row.expired) && row.expires_at && new Date(row.expires_at) > new Date();
}

async function saveAccessToken(userId, token, expiresAt) {
  await db.query('UPDATE jwt_tokens SET revoked = 1 WHERE user_id = ? AND token_type = ? AND revoked = 0', [userId, 'ACCESS']);
  await db.query(
    `INSERT INTO jwt_tokens (user_id, token, token_type, expires_at, revoked, expired, login_time, created_at)
     VALUES (?, ?, 'ACCESS', ?, 0, ?, ?, ?)`,
    [userId, token, expiresAt, new Date(expiresAt) <= new Date() ? 1 : 0, new Date(), new Date()]
  );
}

async function saveRefreshToken(userId, token, expiresAt) {
  const existing = await db.queryOne(
    'SELECT token_id FROM jwt_tokens WHERE user_id = ? AND token_type = ? AND revoked = 0 LIMIT 1',
    [userId, 'REFRESH']
  );
  if (existing) {
    await db.query('UPDATE jwt_tokens SET revoked = 1, logout_time = ? WHERE token_id = ?', [new Date(), existing.token_id]);
  }
  await db.query(
    `INSERT INTO jwt_tokens (user_id, token, token_type, expires_at, revoked, expired, login_time, created_at)
     VALUES (?, ?, 'REFRESH', ?, 0, ?, ?, ?)`,
    [userId, token, expiresAt, new Date(expiresAt) <= new Date() ? 1 : 0, new Date(), new Date()]
  );
}

async function revokeToken(token) {
  await db.query('UPDATE jwt_tokens SET revoked = 1, logout_time = ? WHERE token = ?', [new Date(), token]);
}

async function revokeAllForUser(userId) {
  await db.query(
    'UPDATE jwt_tokens SET revoked = 1, logout_time = ? WHERE user_id = ? AND revoked = 0',
    [new Date(), userId]
  );
}

module.exports = {
  isTokenActive,
  isRefreshTokenActive,
  saveAccessToken,
  saveRefreshToken,
  revokeToken,
  revokeAllForUser,
};
