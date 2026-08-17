const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const categoryService = require('../services/category.service');
const { Role } = require('../utils/enums');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const result = await categoryService.listCategories(req.query.parentId);
  res.json(result);
}));

router.get('/root', asyncHandler(async (req, res) => {
  const result = await categoryService.listRootCategories();
  res.json(result);
}));

router.get(
  '/parent/:parentId',
  validate([param('parentId').isInt().withMessage('parentId must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await categoryService.listCategories(Number(req.params.parentId));
    res.json(result);
  })
);

router.get(
  '/:id',
  validate([param('id').isInt().withMessage('Category id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await categoryService.getCategory(Number(req.params.id));
    res.json(result);
  })
);

router.post(
  '/',
  authenticate,
  requireRole(Role.ROLE_ADMIN),
  validate([body('name').notEmpty().withMessage('Category name is required')]),
  asyncHandler(async (req, res) => {
    const result = await categoryService.createCategory(req.body, req.user.id);
    res.status(201).json(result);
  })
);

router.put(
  '/:id',
  authenticate,
  requireRole(Role.ROLE_ADMIN),
  validate([param('id').isInt().withMessage('Category id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await categoryService.updateCategory(Number(req.params.id), req.body, req.user.id);
    res.json(result);
  })
);

router.delete(
  '/:id',
  authenticate,
  requireRole(Role.ROLE_ADMIN),
  validate([param('id').isInt().withMessage('Category id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await categoryService.deleteCategory(Number(req.params.id), req.user.id);
    res.json(result);
  })
);

module.exports = router;
