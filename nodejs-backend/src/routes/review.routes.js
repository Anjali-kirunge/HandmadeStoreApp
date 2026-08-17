const express = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, optionalAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const reviewService = require('../services/review.service');

const router = express.Router();

router.get(
  '/product/:productId',
  validate([
    param('productId').isInt().withMessage('Product id must be an integer'),
    query('page').optional().isInt({ min: 0 }).withMessage('page must be a non-negative integer'),
    query('size').optional().isInt({ min: 1, max: 100 }).withMessage('size must be between 1 and 100'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await reviewService.listProductReviews(Number(req.params.productId), {
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.get(
  '/product/:productId/can-review',
  authenticate,
  validate([param('productId').isInt().withMessage('Product id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await reviewService.canReview(req.user.id, Number(req.params.productId));
    res.json(result);
  })
);

router.post(
  '/product/:productId',
  authenticate,
  validate([
    param('productId').isInt().withMessage('Product id must be an integer'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString(),
    body('images').optional().isArray(),
  ]),
  asyncHandler(async (req, res) => {
    const result = await reviewService.createReview(req.user.id, Number(req.params.productId), req.body, req.user.id);
    res.status(201).json(result);
  })
);

router.put(
  '/:id',
  authenticate,
  validate([
    param('id').isInt().withMessage('Review id must be an integer'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString(),
    body('images').optional().isArray(),
  ]),
  asyncHandler(async (req, res) => {
    const result = await reviewService.updateReview(req.user.id, Number(req.params.id), req.body, req.user.id);
    res.json(result);
  })
);

router.delete(
  '/:id',
  authenticate,
  validate([param('id').isInt().withMessage('Review id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await reviewService.deleteReview(req.user.id, Number(req.params.id), req.user.id);
    res.json(result);
  })
);

module.exports = router;
