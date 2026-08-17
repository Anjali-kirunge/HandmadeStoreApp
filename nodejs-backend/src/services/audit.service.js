const db = require('../config/db');

async function audit(userId, action, entity, entityId, oldValues, newValues, ipAddress) {
  await db.query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, old_values, new_values, ip_address, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId || null,
      action,
      entity,
      entityId || null,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress || null,
      new Date(),
    ]
  );
}

module.exports = { audit };
