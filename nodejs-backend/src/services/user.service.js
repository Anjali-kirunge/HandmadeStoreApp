const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { mapUser, mapOrder, mapProduct, num, bool } = require('../utils/mappers');
const { pageResponse } = require('../utils/response');
const { BadRequestException, ResourceNotFoundException, AccessDeniedException } = require('../utils/errors');
const { roleValues } = require('../utils/enums');
const { audit } = require('./audit.service');

async function getProfile(userId) {
  const row = await db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
  return mapUser(row);
}

async function updateProfile(userId, body) {
  const fields = [];
  const params = [];
  if (body.firstName !== undefined) {
    fields.push('first_name = ?');
    params.push(body.firstName);
  }
  if (body.lastName !== undefined) {
    fields.push('last_name = ?');
    params.push(body.lastName);
  }
  if (body.phone !== undefined) {
    fields.push('phone = ?');
    params.push(body.phone);
  }
  if (body.avatar !== undefined) {
    fields.push('avatar = ?');
    params.push(body.avatar);
  }
  if (fields.length === 0) return getProfile(userId);
  fields.push('updated_at = ?');
  params.push(new Date());
  params.push(userId);
  await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
  return getProfile(userId);
}

async function changePassword(userId, currentPassword, newPassword) {
  const row = await db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
  const ok = await bcrypt.compare(currentPassword, row.password);
  if (!ok) {
    throw new BadRequestException('Current password is incorrect');
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', [hash, new Date(), userId]);
  return { message: 'Password changed successfully' };
}

async function adminListUsers({ keyword, page = 0, size = 10 }) {
  const where = [];
  const params = [];
  if (keyword) {
    where.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
    const like = `%${keyword}%`;
    params.push(like, like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [countRow] = await db.query(`SELECT COUNT(*) AS total FROM users ${whereSql}`, params);
  const totalElements = num(countRow.total);
  const rows = await db.query(
    `SELECT * FROM users ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, size, page * size]
  );
  return pageResponse(rows.map(mapUser), page, size, totalElements);
}

async function adminGetUser(userId) {
  const row = await db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
  if (!row) throw new ResourceNotFoundException('User', 'id', userId);
  return mapUser(row);
}

async function adminGetUserOrders(userId, { page = 0, size = 10 }) {
  const user = await adminGetUser(userId);
  const [countRow] = await db.query('SELECT COUNT(*) AS total FROM orders WHERE user_id = ?', [userId]);
  const totalElements = num(countRow.total);
  const rows = await db.query(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [userId, size, page * size]
  );
  const orders = [];
  for (const row of rows) {
    const items = await db.query(
      `SELECT oi.*, p.* FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [row.id]
    );
    orders.push(mapOrder(row, items.map((it) => ({ id: it.id, quantity: it.quantity, price: it.price, subtotal: it.price * it.quantity, product: mapProduct(it) })), user));
  }
  return pageResponse(orders, page, size, totalElements);
}

async function adminUpdateUserRole(userId, role, actor) {
  if (!roleValues.includes(role)) {
    throw new BadRequestException('Invalid role. Must be one of: ' + roleValues.join(', '));
  }
  const user = await adminGetUser(userId);
  if (userId === actor) {
    throw new BadRequestException('You cannot change your own role');
  }
  await db.query('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [role, new Date(), userId]);
  await audit(actor, 'UPDATE', 'USER', userId, { role: user.role }, { role }, null);
  return adminGetUser(userId);
}

async function adminUpdateUser(userId, body, actor) {
  const user = await adminGetUser(userId);
  await db.query(
    'UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = ? WHERE id = ?',
    [body.firstName ?? user.firstName, body.lastName ?? user.lastName, body.phone ?? user.phone, new Date(), userId]
  );
  await audit(actor, 'UPDATE', 'USER', userId, { firstName: user.firstName, lastName: user.lastName }, { firstName: body.firstName, lastName: body.lastName }, null);
  return adminGetUser(userId);
}

async function adminToggleUser(userId, actor) {
  const user = await adminGetUser(userId);
  if (userId === actor) {
    throw new BadRequestException('You cannot disable your own account');
  }
  const enabled = bool(user.enabled) ? 0 : 1;
  await db.query('UPDATE users SET enabled = ?, updated_at = ? WHERE id = ?', [enabled, new Date(), userId]);
  await audit(actor, 'UPDATE', 'USER', userId, { enabled: user.enabled }, { enabled: !!enabled }, null);
  return adminGetUser(userId);
}

async function adminDeleteUser(userId, actor) {
  const user = await adminGetUser(userId);
  if (userId === actor) {
    throw new BadRequestException('You cannot delete your own account');
  }
  await db.query('DELETE FROM users WHERE id = ?', [userId]);
  await audit(actor, 'DELETE', 'USER', userId, { email: user.email }, null, null);
  return { message: 'User deleted successfully' };
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  adminListUsers,
  adminGetUser,
  adminGetUserOrders,
  adminUpdateUserRole,
  adminUpdateUser,
  adminToggleUser,
  adminDeleteUser,
};
