const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { apiSuccess } = require('../utils/response');
const otpService = require('../services/otp.service');
const { BadRequestException } = require('../utils/errors');

const router = express.Router();

router.post(
  '/generate',
  validate([
    body('email').trim().toLowerCase().isEmail().withMessage('Please provide a valid email address'),
    body('type')
      .isIn(['REGISTRATION', 'PASSWORD_RESET', 'EMAIL_VERIFICATION'])
      .withMessage('Invalid OTP type'),
  ]),
  asyncHandler(async (req, res) => {
    await otpService.generateOtp(req.body.email, req.body.type);
    res.json(apiSuccess('OTP sent successfully'));
  })
);

router.post(
  '/verify',
  validate([
    body('email').trim().toLowerCase().isEmail().withMessage('Please provide a valid email address'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('type')
      .isIn(['REGISTRATION', 'PASSWORD_RESET', 'EMAIL_VERIFICATION'])
      .withMessage('Invalid OTP type'),
  ]),
  asyncHandler(async (req, res) => {
    const valid = await otpService.verifyOtp(req.body.email, req.body.otp, req.body.type);
    if (!valid) throw new BadRequestException('Invalid or expired OTP');
    res.json(apiSuccess('OTP verified successfully'));
  })
);

module.exports = router;
