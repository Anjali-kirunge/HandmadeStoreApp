class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

class BadRequestException extends AppError {
  constructor(message) {
    super(400, message || 'Bad request');
  }
}

class ResourceNotFoundException extends AppError {
  constructor(resource, field, value) {
    super(404, `${resource} not found with ${field}: ${value}`);
  }
}

class AuthenticationException extends AppError {
  constructor(message) {
    super(401, message || 'Unauthorized');
  }
}

class AccessDeniedException extends AppError {
  constructor(message) {
    super(403, message || 'You do not have permission to perform this action');
  }
}

class TooManyRequestsException extends AppError {
  constructor(message) {
    super(429, message || 'Too many requests');
  }
}

class AiServiceException extends AppError {
  constructor(message) {
    super(502, message || 'AI service error');
  }
}

module.exports = {
  AppError,
  BadRequestException,
  ResourceNotFoundException,
  AuthenticationException,
  AccessDeniedException,
  TooManyRequestsException,
  AiServiceException,
};
