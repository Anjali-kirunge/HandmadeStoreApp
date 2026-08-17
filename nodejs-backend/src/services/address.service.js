const db = require('../config/db');
const { mapAddress, num, bool } = require('../utils/mappers');
const { ResourceNotFoundException, BadRequestException } = require('../utils/errors');
const { audit } = require('./audit.service');

async function listAddresses(userId) {
  const rows = await db.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at ASC', [userId]);
  return rows.map(mapAddress);
}

async function getAddress(userId, id) {
  const row = await db.queryOne('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
  if (!row) throw new ResourceNotFoundException('Address', 'id', id);
  return mapAddress(row);
}

async function createAddress(userId, body, actor) {
  const required = ['street', 'city', 'state', 'zipCode', 'country'];
  for (const field of required) {
    if (!body[field]) throw new BadRequestException(`${field} is required`);
  }
  const isDefault = body.isDefault ? 1 : 0;
  if (isDefault) {
    await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
  }
  const result = await db.query(
    `INSERT INTO addresses (user_id, street, city, state, zip_code, country, is_default, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, body.street, body.city, body.state, body.zipCode, body.country, isDefault, new Date(), new Date()]
  );
  await audit(actor, 'CREATE', 'ADDRESS', result.insertId, null, { street: body.street }, null);
  return getAddress(userId, result.insertId);
}

async function updateAddress(userId, id, body, actor) {
  const existing = await db.queryOne('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
  if (!existing) throw new ResourceNotFoundException('Address', 'id', id);

  let isDefault = bool(existing.is_default) ? 1 : 0;
  if (body.isDefault !== undefined) {
    isDefault = body.isDefault ? 1 : 0;
    if (isDefault) {
      await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?', [userId, id]);
    }
  }

  await db.query(
    `UPDATE addresses SET street = ?, city = ?, state = ?, zip_code = ?, country = ?, is_default = ?, updated_at = ? WHERE id = ?`,
    [
      body.street !== undefined ? body.street : existing.street,
      body.city !== undefined ? body.city : existing.city,
      body.state !== undefined ? body.state : existing.state,
      body.zipCode !== undefined ? body.zipCode : existing.zip_code,
      body.country !== undefined ? body.country : existing.country,
      isDefault,
      new Date(),
      id,
    ]
  );
  await audit(actor, 'UPDATE', 'ADDRESS', id, { street: existing.street }, { street: body.street ?? existing.street }, null);
  return getAddress(userId, id);
}

async function deleteAddress(userId, id, actor) {
  const existing = await db.queryOne('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
  if (!existing) throw new ResourceNotFoundException('Address', 'id', id);
  await db.query('DELETE FROM addresses WHERE id = ?', [id]);
  await audit(actor, 'DELETE', 'ADDRESS', id, { street: existing.street }, null, null);
  return { message: 'Address deleted successfully' };
}

async function setDefault(userId, id) {
  const existing = await db.queryOne('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
  if (!existing) throw new ResourceNotFoundException('Address', 'id', id);
  await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
  await db.query('UPDATE addresses SET is_default = 1 WHERE id = ?', [id]);
  return getAddress(userId, id);
}

module.exports = { listAddresses, getAddress, createAddress, updateAddress, deleteAddress, setDefault };
