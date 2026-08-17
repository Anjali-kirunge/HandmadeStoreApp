const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const chatService = require('../services/chat.service');

const router = express.Router();

router.post(
  '/',
  validate([
    body('message').notEmpty().withMessage('Message is required'),
    body('history').optional().isArray(),
  ]),
  asyncHandler(async (req, res) => {
    const result = await chatService.chat(req.body.message, req.body.history);
    res.json(result);
  })
);

module.exports = router;
