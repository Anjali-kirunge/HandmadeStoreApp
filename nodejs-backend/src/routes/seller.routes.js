const express = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { Role, orderStatusValues } = require('../utils/enums');
const dashboardService = require('../services/dashboard.service');
const orderService = require('../services/order.service');

const router = express.Router();

router.use(authenticate, requireRole(Role.ROLE_SELLER));

router.get('/dashboard', asyncHandler(async (req, res) => {
  res.json(await dashboardService.sellerDashboard(req.user.id));
}));

router.get(
  '/orders',
  validate([
    query('page').optional().isInt({ min: 0 }).withMessage('page must be a non-negative integer'),
    query('size').optional().isInt({ min: 1, max: 100 }).withMessage('size must be between 1 and 100'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await orderService.sellerListOrders(req.user.id, {
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.get(
  '/orders/:id',
  validate([param('id').isInt().withMessage('Order id must be an integer')]),
  asyncHandler(async (req, res) => {
    res.json(await orderService.sellerGetOrder(req.user.id, Number(req.params.id)));
  })
);

router.put(
  '/orders/:id/status',
  validate([
    param('id').isInt().withMessage('Order id must be an integer'),
    body('orderStatus').isIn(orderStatusValues).withMessage('Invalid order status'),
    body('trackingNumber').optional().isString(),
  ]),
  asyncHandler(async (req, res) => {
    const result = await orderService.updateOrderStatus(req.user.id, Number(req.params.id), req.body, false);
    res.json(result);
  })
);

module.exports = router;
