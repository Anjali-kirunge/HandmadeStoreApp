const express = require('express');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { upload } = require('../middleware/upload');
const imageService = require('../services/image.service');

const router = express.Router();

router.post(
  '/upload',
  authenticate,
  upload.any(),
  asyncHandler(async (req, res) => {
    const file = Array.isArray(req.files) ? req.files[0] : null;
    const result = await imageService.handleUpload(file);
    res.status(200).json(result);
  })
);

module.exports = router;
