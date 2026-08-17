const express = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { Role, roleValues, productStatusValues, orderStatusValues } = require('../utils/enums');
const dashboardService = require('../services/dashboard.service');
const orderService = require('../services/order.service');
const userService = require('../services/user.service');
const productService = require('../services/product.service');
const paymentService = require('../services/payment.service');
const searchService = require('../services/search.service');
const couponService = require('../services/coupon.service');
const reviewService = require('../services/review.service');
const notificationService = require('../services/notification.service');
const analyticsService = require('../services/analytics.service');
const reportService = require('../services/report.service');
const invoiceService = require('../services/invoice.service');

const router = express.Router();

router.use(authenticate, requireRole(Role.ROLE_ADMIN));

const pageRules = [
  query('page').optional().isInt({ min: 0 }).withMessage('page must be a non-negative integer'),
  query('size').optional().isInt({ min: 1, max: 100 }).withMessage('size must be between 1 and 100'),
];

router.get('/dashboard', asyncHandler(async (req, res) => {
  res.json(await dashboardService.adminDashboard());
}));

router.get(
  '/orders',
  validate(pageRules),
  asyncHandler(async (req, res) => {
    const result = await orderService.adminListOrders({
      keyword: req.query.keyword,
      status: req.query.status,
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.get(
  '/orders/status/:status',
  validate([
    param('status').isIn(orderStatusValues).withMessage('Invalid order status'),
    ...pageRules,
  ]),
  asyncHandler(async (req, res) => {
    const result = await orderService.adminListOrdersByStatus(req.params.status, {
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
    res.json(await orderService.adminGetOrder(Number(req.params.id)));
  })
);

router.get(
  '/orders/:id/invoice',
  validate([param('id').isInt().withMessage('Order id must be an integer')]),
  asyncHandler(async (req, res) => {
    const buffer = await invoiceService.buildInvoicePdf(Number(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-order-${req.params.id}.pdf"`);
    res.send(buffer);
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
    const result = await orderService.updateOrderStatus(req.user.id, Number(req.params.id), req.body, true);
    res.json(result);
  })
);

router.get(
  '/users',
  validate(pageRules),
  asyncHandler(async (req, res) => {
    const result = await userService.adminListUsers({
      keyword: req.query.keyword,
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.get(
  '/users/:id',
  validate([param('id').isInt().withMessage('User id must be an integer')]),
  asyncHandler(async (req, res) => {
    res.json(await userService.adminGetUser(Number(req.params.id)));
  })
);

router.get(
  '/users/:id/orders',
  validate([param('id').isInt().withMessage('User id must be an integer'), ...pageRules]),
  asyncHandler(async (req, res) => {
    const result = await userService.adminGetUserOrders(Number(req.params.id), {
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.put(
  '/users/:id/role',
  validate([
    param('id').isInt().withMessage('User id must be an integer'),
    body('role').isIn(roleValues).withMessage('Invalid role'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await userService.adminUpdateUserRole(Number(req.params.id), req.body.role, req.user.id);
    res.json(result);
  })
);

router.put(
  '/users/:id',
  validate([
    param('id').isInt().withMessage('User id must be an integer'),
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('phone').optional().isString(),
  ]),
  asyncHandler(async (req, res) => {
    const result = await userService.adminUpdateUser(Number(req.params.id), req.body, req.user.id);
    res.json(result);
  })
);

router.put(
  '/users/:id/toggle',
  validate([param('id').isInt().withMessage('User id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await userService.adminToggleUser(Number(req.params.id), req.user.id);
    res.json(result);
  })
);

router.delete(
  '/users/:id',
  validate([param('id').isInt().withMessage('User id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await userService.adminDeleteUser(Number(req.params.id), req.user.id);
    res.json(result);
  })
);

router.get(
  '/products',
  validate(pageRules),
  asyncHandler(async (req, res) => {
    const result = await productService.adminListProducts({
      keyword: req.query.keyword,
      status: req.query.status,
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.post('/products', asyncHandler(async (req, res) => {
  const result = await productService.createProduct(req.body, req.user.id, req.user.id);
  res.status(201).json(result);
}));

router.put(
  '/products/:id',
  validate([param('id').isInt().withMessage('Product id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await productService.updateProduct(Number(req.params.id), req.body, null, req.user.id);
    res.json(result);
  })
);

router.delete(
  '/products/:id',
  validate([param('id').isInt().withMessage('Product id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await productService.deleteProduct(Number(req.params.id), null, req.user.id);
    res.json(result);
  })
);

router.put(
  '/products/:id/stock',
  validate([
    param('id').isInt().withMessage('Product id must be an integer'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await productService.updateStock(Number(req.params.id), req.body.quantity, null, req.user.id);
    res.json(result);
  })
);

router.put(
  '/products/:id/status',
  validate([
    param('id').isInt().withMessage('Product id must be an integer'),
    body('status').isIn(productStatusValues).withMessage('Invalid product status'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await productService.adminUpdateProductStatus(Number(req.params.id), req.body.status, req.user.id);
    res.json(result);
  })
);

router.put(
  '/products/:id/featured',
  validate([param('id').isInt().withMessage('Product id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await productService.toggleFeatured(Number(req.params.id), null, req.user.id);
    res.json(result);
  })
);

router.get('/inventory/low-stock', asyncHandler(async (req, res) => {
  res.json(await productService.listLowStock());
}));

router.get(
  '/payments',
  validate(pageRules),
  asyncHandler(async (req, res) => {
    const result = await paymentService.adminListPayments({
      status: req.query.status,
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.get('/search', asyncHandler(async (req, res) => {
  const result = await searchService.globalSearch(req.query.q, req.query.limit);
  res.json(result);
}));

router.get('/coupons', asyncHandler(async (req, res) => {
  res.json(await couponService.listCoupons());
}));

router.post('/coupons', asyncHandler(async (req, res) => {
  const result = await couponService.createCoupon(req.body, req.user.id);
  res.status(201).json(result);
}));

router.put(
  '/coupons/:id',
  validate([param('id').isInt().withMessage('Coupon id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await couponService.updateCoupon(Number(req.params.id), req.body, req.user.id);
    res.json(result);
  })
);

router.put(
  '/coupons/:id/toggle',
  validate([param('id').isInt().withMessage('Coupon id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await couponService.toggleCoupon(Number(req.params.id), req.user.id);
    res.json(result);
  })
);

router.delete(
  '/coupons/:id',
  validate([param('id').isInt().withMessage('Coupon id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await couponService.deleteCoupon(Number(req.params.id), req.user.id);
    res.json(result);
  })
);

router.get(
  '/reviews',
  validate(pageRules),
  asyncHandler(async (req, res) => {
    const result = await reviewService.listAllReviews({
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

router.delete(
  '/reviews/:id',
  validate([param('id').isInt().withMessage('Review id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await reviewService.adminDeleteReview(Number(req.params.id), req.user.id);
    res.json(result);
  })
);

router.get(
  '/notifications',
  validate([query('email').notEmpty().withMessage('email is required')]),
  asyncHandler(async (req, res) => {
    res.json(await notificationService.listByEmail(req.query.email));
  })
);

router.get('/analytics', asyncHandler(async (req, res) => {
  const result = await analyticsService.analytics({
    from: req.query.from,
    to: req.query.to,
    topN: parseInt(req.query.topN, 10) || 5,
  });
  res.json(result);
}));

router.get(
  '/reports/:type',
  validate([
    param('type').isIn(['orders', 'products', 'users', 'payments', 'analytics']).withMessage('Invalid report type'),
    query('format').isIn(['csv', 'excel', 'pdf']).withMessage('Invalid format'),
  ]),
  asyncHandler(async (req, res) => {
    const { content, filename, contentType } = await reportService.generateReport(req.params.type, req.query.format, req.query);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  })
);

module.exports = router;
