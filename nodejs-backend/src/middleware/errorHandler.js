const { AppError, BadRequestException } = require('../utils/errors');
const { formatFieldErrors } = require('./validate');

function buildErrorBody(status, message, path) {
  const names = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
  };
  return {
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    status,
    error: names[status] || 'Error',
    message,
    path: path || '',
  };
}

function notFoundHandler(req, res) {
  res.status(404).json(buildErrorBody(404, 'Endpoint not found', req.originalUrl));
}

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = buildErrorBody(err.status, err.message, req.originalUrl);
    return res.status(err.status).json(body);
  }

  if (Array.isArray(err) && err.length && err[0].path) {
    const body = buildErrorBody(400, 'Validation failed', req.originalUrl);
    body.fieldErrors = formatFieldErrors(err);
    return res.status(400).json(body);
  }

  if (err && err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File size exceeds the maximum allowed (5MB)'
        : 'File upload error: ' + err.message;
    return res.status(400).json(buildErrorBody(400, message, req.originalUrl));
  }

  if (err && err.code === 'ER_DUP_ENTRY') {
    return res
      .status(409)
      .json(buildErrorBody(409, 'Duplicate entry: ' + err.message, req.originalUrl));
  }

  if (err && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.sqlState)) {
    console.error('[ERROR-SQL]', err.code, err.sqlState, err.message);
    return res
      .status(500)
      .json(buildErrorBody(500, 'An unexpected error occurred. Please try again later.', req.originalUrl));
  }

  console.error('[ERROR]', err);
  return res
    .status(500)
    .json(buildErrorBody(500, 'An unexpected error occurred. Please try again later.', req.originalUrl));
}

module.exports = { errorHandler, notFoundHandler, buildErrorBody };
