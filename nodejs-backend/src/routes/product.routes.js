const express = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/product.service');
const { Role } = require('../utils/enums');

const router = express.Router();

router.get(
  '/search',
  validate([
    query('page').optional().isInt({ min: 0 }).withMessage('page must be a non-negative integer'),
    query('size').optional().isInt({ min: 1, max: 100 }).withMessage('size must be between 1 and 100'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await productService.searchProducts({
      keyword: req.query.keyword,
      categoryId: req.query.categoryId,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      sortBy: req.query.sortBy,
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.get(
  '/featured',
  asyncHandler(async (req, res) => {
    const result = await productService.listFeaturedProducts({
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.get(
  '/category/:categoryId',
  validate([param('categoryId').isInt().withMessage('categoryId must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await productService.searchProducts({
      categoryId: req.params.categoryId,
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await productService.getAllProducts({
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.get(
  '/seller',
  authenticate,
  requireRole(Role.ROLE_SELLER),
  asyncHandler(async (req, res) => {
    const result = await productService.listSellerProducts(req.user.id, {
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.get(
  '/:id',
  validate([param('id').isInt().withMessage('Product id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await productService.getProduct(Number(req.params.id));
    res.json(result);
  })
);

router.post(
  '/',
  authenticate,
  requireRole(Role.ROLE_SELLER),
  asyncHandler(async (req, res) => {
    const result = await productService.createProduct(req.body, req.user.id, req.user.id);
    res.status(201).json(result);
  })
);

router.put(
  '/:id',
  authenticate,
  requireRole(Role.ROLE_SELLER),
  asyncHandler(async (req, res) => {
    const result = await productService.updateProduct(Number(req.params.id), req.body, req.user.id, req.user.id);
    res.json(result);
  })
);

router.delete(
  '/:id',
  authenticate,
  requireRole(Role.ROLE_SELLER),
  asyncHandler(async (req, res) => {
    const result = await productService.deleteProduct(Number(req.params.id), req.user.id, req.user.id);
    res.json(result);
  })
);

router.put(
  '/:id/stock',
  authenticate,
  requireRole(Role.ROLE_SELLER),
  validate([
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await productService.updateStock(Number(req.params.id), req.body.quantity, req.user.id, req.user.id);
    res.json(result);
  })
);

router.put(
  '/:id/featured',
  authenticate,
  requireRole(Role.ROLE_SELLER),
  asyncHandler(async (req, res) => {
    const result = await productService.toggleFeatured(Number(req.params.id), req.user.id, req.user.id);
    res.json(result);
  })
);

module.exports = router;
