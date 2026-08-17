const express = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const orderService = require('../services/order.service');
const { paymentMethodValues } = require('../utils/enums');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  validate([
    body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    body('paymentMethod').optional({ nullable: true }).isIn(paymentMethodValues).withMessage('Invalid payment method'),
    body('couponCode').optional({ nullable: true }).isString(),
    body('notes').optional({ nullable: true }).isString(),
  ]),
  asyncHandler(async (req, res) => {
    const result = await orderService.placeOrder(req.user.id, req.body);
    res.status(201).json(result);
  })
);

router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 0 }).withMessage('page must be a non-negative integer'),
    query('size').optional().isInt({ min: 1, max: 100 }).withMessage('size must be between 1 and 100'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await orderService.listUserOrders(req.user.id, {
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.get(
  '/:id',
  validate([param('id').isInt().withMessage('Order id must be an integer')]),
  asyncHandler(async (req, res) => {
    res.json(await orderService.getOwnOrder(req.user.id, Number(req.params.id)));
  })
);

router.put(
  '/:id/cancel',
  validate([param('id').isInt().withMessage('Order id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await orderService.cancelOrder(req.user.id, Number(req.params.id));
    res.json(result);
  })
);

module.exports = router;
