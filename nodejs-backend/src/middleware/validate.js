const { validationResult } = require('express-validator');
const { BadRequestException } = require('../utils/errors');

const DEFAULT_ERROR_MESSAGE = 'Validation failed';

function formatFieldErrors(errors) {
  return errors.map((e) => ({
    field: e.path || e.param,
    message: e.msg,
    rejectedValue: e.value,
  }));
}

function validate(schemas = []) {
  return async (req, res, next) => {
    if (schemas.length) {
      for (const schema of schemas) {
        if (typeof schema.run === 'function') {
          await schema.run(req);
        }
      }
    }
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    const message = errors.array().some((e) => e.msg === DEFAULT_ERROR_MESSAGE)
      ? DEFAULT_ERROR_MESSAGE
      : errors.array()[0].msg;
    next(new BadRequestException(message));
  };
}

module.exports = { validate, formatFieldErrors };
