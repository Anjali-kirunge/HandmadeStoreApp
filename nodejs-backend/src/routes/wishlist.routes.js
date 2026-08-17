const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const wishlistService = require('../services/wishlist.service');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await wishlistService.getWishlist(req.user.id));
}));

router.post(
  '/',
  validate([body('productId').isInt().withMessage('productId must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await wishlistService.addProduct(req.user.id, Number(req.body.productId));
    res.status(200).json(result);
  })
);

router.delete(
  '/:productId',
  validate([param('productId').isInt().withMessage('productId must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await wishlistService.removeProduct(req.user.id, Number(req.params.productId));
    res.json(result);
  })
);

module.exports = router;
