const env = require('../config/env');

function buildUrl(filename) {
  const base = env.upload.url.replace(/\/$/, '');
  return `${base}/${filename}`;
}

async function handleUpload(file) {
  if (!file) {
    const { BadRequestException } = require('../utils/errors');
    throw new BadRequestException('No image file provided');
  }
  return { url: buildUrl(file.filename) };
}

module.exports = { handleUpload, buildUrl };
