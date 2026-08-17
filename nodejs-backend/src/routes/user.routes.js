const express = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user.service');
const { Role } = require('../utils/enums');

const router = express.Router();

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json(await userService.getProfile(req.user.id));
}));

router.put(
  '/me',
  authenticate,
  validate([
    body('firstName').optional().isString(),
    body('lastName').optional().isString(),
    body('phone').optional().isString(),
    body('avatar').optional().isString(),
  ]),
  asyncHandler(async (req, res) => {
    const result = await userService.updateProfile(req.user.id, req.body);
    res.json(result);
  })
);

router.put(
  '/me/change-password',
  authenticate,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await userService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.json(result);
  })
);

router.get(
  '/',
  authenticate,
  requireRole(Role.ROLE_ADMIN),
  validate([
    query('page').optional().isInt({ min: 0 }).withMessage('page must be a non-negative integer'),
    query('size').optional().isInt({ min: 1, max: 100 }).withMessage('size must be between 1 and 100'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await userService.adminListUsers({
      keyword: req.query.keyword,
      page: parseInt(req.query.page, 10) || 0,
      size: parseInt(req.query.size, 10) || 10,
    });
    res.json(result);
  })
);

module.exports = router;
