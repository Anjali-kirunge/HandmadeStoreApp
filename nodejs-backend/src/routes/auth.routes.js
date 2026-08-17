const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const router = express.Router();

const emailRule = body('email')
  .trim()
  .toLowerCase()
  .isEmail()
  .withMessage('Please provide a valid email address');
const passwordRule = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters long');

router.post(
  '/register',
  validate([
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    emailRule,
    passwordRule,
    body('phone').optional({ checkFalsy: true }).isLength({ max: 15 }).withMessage('Phone number is too long'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  })
);

router.post(
  '/login',
  validate([emailRule, body('password').notEmpty().withMessage('Password is required')]),
  asyncHandler(async (req, res) => {
    const result = await authService.login({ email: req.body.email, password: req.body.password, ip: req.ip });
    res.json(result);
  })
);

router.post(
  '/verify-registration-otp',
  validate([
    emailRule,
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await authService.verifyRegistrationOtp(req.body.email, req.body.otp);
    res.json(result);
  })
);

router.post(
  '/resend-registration-otp',
  validate([emailRule]),
  asyncHandler(async (req, res) => {
    const result = await authService.resendRegistrationOtp(req.body.email);
    res.json(result);
  })
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const result = await authService.logout(token);
    res.json(result);
  })
);

router.post(
  '/forgot-password',
  validate([emailRule]),
  asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body);
    res.json(result);
  })
);

router.post(
  '/reset-password',
  validate([
    emailRule,
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    passwordRule,
  ]),
  asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  })
);

router.post(
  '/refresh-token',
  validate([body('refreshToken').notEmpty().withMessage('refreshToken is required')]),
  asyncHandler(async (req, res) => {
    const result = await authService.refreshToken(req.body.refreshToken);
    res.json(result);
  })
);

module.exports = router;
