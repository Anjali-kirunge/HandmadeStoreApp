const express = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const couponService = require('../services/coupon.service');

const router = express.Router();

router.use(authenticate);

router.post(
  '/apply',
  validate([
    body('code').notEmpty().withMessage('Coupon code is required'),
    body('orderTotal').isFloat({ min: 0 }).withMessage('orderTotal must be a non-negative number'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await couponService.applyCoupon(req.body.code, req.body.orderTotal);
    res.json(result);
  })
);

router.get(
  '/:code/validate',
  validate([query('orderTotal').isFloat({ min: 0 }).withMessage('orderTotal must be a non-negative number')]),
  asyncHandler(async (req, res) => {
    const result = await couponService.validateCoupon(req.params.code, req.query.orderTotal);
    res.json(result);
  })
);

module.exports = router;
