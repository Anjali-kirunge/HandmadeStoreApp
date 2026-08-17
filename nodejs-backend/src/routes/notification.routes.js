const express = require('express');
const { param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notification.service');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await notificationService.listForUser(req.user.id));
}));

router.put(
  '/:id/read',
  validate([param('id').isInt().withMessage('Notification id must be an integer')]),
  asyncHandler(async (req, res) => {
    res.json(await notificationService.markRead(req.user.id, Number(req.params.id)));
  })
);

router.put('/read-all', asyncHandler(async (req, res) => {
  res.json(await notificationService.markAllRead(req.user.id));
}));

router.get('/unread-count', asyncHandler(async (req, res) => {
  res.json(await notificationService.unreadCount(req.user.id));
}));

module.exports = router;
