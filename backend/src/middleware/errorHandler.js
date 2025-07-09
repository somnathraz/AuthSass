const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');
const { auditLog } = require('../utils/audit');

/**
 * Format GraphQL errors
 */
const formatGraphQLError = (error, context = {}) => {
  const { req } = context;
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log error for debugging
  console.error(`Error ID: ${errorId}`, {
    message: error.message,
    stack: error.stack,
    userId: req?.userId,
    ip: req?.ip
  });

  // Handle different error types
  if (error instanceof AuthenticationError) {
    return {
      message: 'Authentication failed',
      code: 'UNAUTHENTICATED',
      errorId
    };
  }

  if (error instanceof ForbiddenError) {
    return {
      message: 'Access denied',
      code: 'FORBIDDEN',
      errorId
    };
  }

  if (error instanceof UserInputError) {
    return {
      message: error.message,
      code: 'BAD_USER_INPUT',
      errorId
    };
  }

  // Generic internal server error
  return {
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    code: 'INTERNAL_ERROR',
    errorId
  };
};

/**
 * Express error handler middleware
 */
const expressErrorHandler = (error, req, res, next) => {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.error(`Express Error ID: ${errorId}`, {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    errorId
  });
};

module.exports = {
  formatGraphQLError,
  expressErrorHandler
}; 