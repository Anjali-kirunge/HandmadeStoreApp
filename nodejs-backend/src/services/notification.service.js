const db = require('../config/db');
const { mapNotification, num } = require('../utils/mappers');
const { ResourceNotFoundException, BadRequestException } = require('../utils/errors');
const { sendOrderStatusEmail } = require('./email.service');

async function listForUser(userId) {
  const rows = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows.map(mapNotification);
}

async function markRead(userId, id) {
  const row = await db.queryOne('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
  if (!row) throw new ResourceNotFoundException('Notification', 'id', id);
  await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  return { message: 'Notification marked as read' };
}

async function markAllRead(userId) {
  await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  return { message: 'All notifications marked as read' };
}

async function unreadCount(userId) {
  const row = await db.queryOne('SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0', [userId]);
  return { count: num(row.total) };
}

async function listByEmail(email) {
  const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) throw new BadRequestException('User not found with email: ' + email);
  return listForUser(user.id);
}

async function notify(userId, title, message, link) {
  await db.query(
    'INSERT INTO notifications (user_id, title, message, is_read, link, created_at) VALUES (?, ?, ?, 0, ?, ?)',
    [userId, title, message, link || null, new Date()]
  );
  const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
  if (user && user.email) {
    sendOrderStatusEmail(user.email, title, message).catch(() => {});
  }
}

module.exports = { listForUser, markRead, markAllRead, unreadCount, listByEmail, notify };
