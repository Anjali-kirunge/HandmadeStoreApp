const db = require('../config/db');
const { mapCategory, mapProduct, mapUser, num } = require('../utils/mappers');
const { ResourceNotFoundException, BadRequestException } = require('../utils/errors');
const { audit } = require('./audit.service');

async function buildCategoryWithChildren(row, conn = db) {
  const childrenRows = await conn.query('SELECT * FROM categories WHERE parent_id = ? ORDER BY name', [row.id]);
  const children = [];
  for (const child of childrenRows) {
    const grandChildren = await conn.query('SELECT * FROM categories WHERE parent_id = ? ORDER BY name', [child.id]);
    children.push(mapCategory(child, grandChildren.map((gc) => mapCategory(gc))));
  }
  return mapCategory(row, children);
}

async function listCategories(parentId) {
  const where = parentId === undefined || parentId === null ? '' : 'WHERE parent_id = ?';
  const params = parentId === undefined || parentId === null ? [] : [parentId];
  const rows = await db.query(`SELECT * FROM categories ${where} ORDER BY name`, params);
  const result = [];
  for (const row of rows) {
    result.push(await buildCategoryWithChildren(row));
  }
  return result;
}

async function listRootCategories() {
  const rows = await db.query('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY name');
  const result = [];
  for (const row of rows) {
    result.push(await buildCategoryWithChildren(row));
  }
  return result;
}

async function getCategory(id) {
  const row = await db.queryOne('SELECT * FROM categories WHERE id = ?', [id]);
  if (!row) throw new ResourceNotFoundException('Category', 'id', id);
  return buildCategoryWithChildren(row);
}

async function createCategory(body, actor) {
  if (!body.name) throw new BadRequestException('Category name is required');
  const parentId = body.parentId ? num(body.parentId) : null;
  const result = await db.query(
    `INSERT INTO categories (name, description, image_url, parent_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [body.name, body.description || null, body.imageUrl || null, parentId, new Date(), new Date()]
  );
  const row = await db.queryOne('SELECT * FROM categories WHERE id = ?', [result.insertId]);
  await audit(actor, 'CREATE', 'CATEGORY', row.id, null, { name: row.name }, null);
  return buildCategoryWithChildren(row);
}

async function updateCategory(id, body, actor) {
  const existing = await db.queryOne('SELECT * FROM categories WHERE id = ?', [id]);
  if (!existing) throw new ResourceNotFoundException('Category', 'id', id);
  if (body.name !== undefined && body.name !== existing.name) {
    const dup = await db.queryOne('SELECT id FROM categories WHERE name = ? AND id != ?', [body.name, id]);
    if (dup) throw new BadRequestException('Category with this name already exists');
  }
  const parentId = body.parentId !== undefined ? (body.parentId ? num(body.parentId) : null) : existing.parent_id;
  if (parentId === id) {
    throw new BadRequestException('A category cannot be its own parent');
  }
  await db.query(
    'UPDATE categories SET name = ?, description = ?, image_url = ?, parent_id = ?, updated_at = ? WHERE id = ?',
    [
      body.name !== undefined ? body.name : existing.name,
      body.description !== undefined ? body.description : existing.description,
      body.imageUrl !== undefined ? body.imageUrl : existing.image_url,
      parentId,
      new Date(),
      id,
    ]
  );
  const row = await db.queryOne('SELECT * FROM categories WHERE id = ?', [id]);
  await audit(actor, 'UPDATE', 'CATEGORY', id, { name: existing.name }, { name: row.name }, null);
  return buildCategoryWithChildren(row);
}

async function deleteCategory(id, actor) {
  const existing = await db.queryOne('SELECT * FROM categories WHERE id = ?', [id]);
  if (!existing) throw new ResourceNotFoundException('Category', 'id', id);
  await db.query('DELETE FROM categories WHERE id = ?', [id]);
  await audit(actor, 'DELETE', 'CATEGORY', id, { name: existing.name }, null, null);
  return { message: 'Category deleted successfully' };
}

module.exports = {
  listCategories,
  listRootCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  buildCategoryWithChildren,
};
