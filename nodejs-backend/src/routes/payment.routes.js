const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/payment.service');

const router = express.Router();

router.use(authenticate);

router.post(
  '/create-order',
  validate([
    body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    body('paymentMethod').optional({ nullable: true }).isIn(['RAZORPAY', 'STRIPE', 'COD']).withMessage('Invalid payment method'),
    body('couponCode').optional({ nullable: true }).isString(),
    body('notes').optional({ nullable: true }).isString(),
  ]),
  asyncHandler(async (req, res) => {
    const result = await paymentService.createOrder(req.user.id, req.body);
    res.status(201).json(result);
  })
);

router.post(
  '/verify',
  validate([
    body('razorpayOrderId').notEmpty().withMessage('razorpayOrderId is required'),
    body('razorpayPaymentId').notEmpty().withMessage('razorpayPaymentId is required'),
    body('razorpaySignature').notEmpty().withMessage('razorpaySignature is required'),
    body('orderRequest.shippingAddress').notEmpty().withMessage('Shipping address is required'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await paymentService.verify(req.user.id, req.body);
    res.status(201).json(result);
  })
);

router.post(
  '/create-checkout-session',
  validate([body('orderId').isInt().withMessage('orderId must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await paymentService.createCheckoutSession(req.user.id, Number(req.body.orderId));
    res.json(result);
  })
);

router.post('/webhook', asyncHandler(async (req, res) => {
  const result = await paymentService.webhook(req.body, req.headers['stripe-signature']);
  res.json(result);
}));

router.get('/', asyncHandler(async (req, res) => {
  res.json(await paymentService.listUserPayments(req.user.id));
}));

module.exports = router;
