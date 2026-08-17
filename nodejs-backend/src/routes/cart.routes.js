const express = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const cartService = require('../services/cart.service');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await cartService.getCart(req.user.id));
}));

router.post(
  '/',
  validate([
    body('productId').isInt().withMessage('productId must be an integer'),
    body('quantity').isInt({ min: 1 }).withMessage('quantity must be at least 1'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await cartService.addItem(req.user.id, Number(req.body.productId), req.body.quantity);
    res.status(200).json(result);
  })
);

router.put(
  '/:productId',
  validate([
    param('productId').isInt().withMessage('productId must be an integer'),
    query('quantity').isInt().withMessage('quantity must be an integer'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await cartService.updateItemQuantity(req.user.id, Number(req.params.productId), req.query.quantity);
    res.json(result);
  })
);

router.delete(
  '/:productId',
  validate([param('productId').isInt().withMessage('productId must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await cartService.removeItem(req.user.id, Number(req.params.productId));
    res.json(result);
  })
);

router.delete('/', asyncHandler(async (req, res) => {
  res.json(await cartService.clearCart(req.user.id));
}));

module.exports = router;
