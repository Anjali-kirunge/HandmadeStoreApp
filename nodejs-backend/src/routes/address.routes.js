const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const addressService = require('../services/address.service');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await addressService.listAddresses(req.user.id));
}));

router.post(
  '/',
  validate([
    body('street').notEmpty().withMessage('Street is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('zipCode').notEmpty().withMessage('Zip code is required'),
    body('country').notEmpty().withMessage('Country is required'),
    body('isDefault').optional().isBoolean(),
  ]),
  asyncHandler(async (req, res) => {
    const result = await addressService.createAddress(req.user.id, req.body, req.user.id);
    res.status(201).json(result);
  })
);

router.put(
  '/:id',
  validate([param('id').isInt().withMessage('Address id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await addressService.updateAddress(req.user.id, Number(req.params.id), req.body, req.user.id);
    res.json(result);
  })
);

router.delete(
  '/:id',
  validate([param('id').isInt().withMessage('Address id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await addressService.deleteAddress(req.user.id, Number(req.params.id), req.user.id);
    res.json(result);
  })
);

router.put(
  '/:id/default',
  validate([param('id').isInt().withMessage('Address id must be an integer')]),
  asyncHandler(async (req, res) => {
    const result = await addressService.setDefault(req.user.id, Number(req.params.id));
    res.json(result);
  })
);

module.exports = router;
