const Joi = require('joi');

/**
 * Validate input against a Joi schema
 * @param {Object} schema - Joi schema
 * @param {Object} data - Data to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
const validateInput = (schema, data, options = {}) => {
  const defaultOptions = {
    abortEarly: false, // Return all errors, not just the first one
    stripUnknown: true, // Remove unknown properties
    allowUnknown: false, // Don't allow unknown properties
    ...options
  };

  return schema.validate(data, defaultOptions);
};

/**
 * Custom Joi validators
 */
const customValidators = {
  /**
   * Password strength validator
   * @param {string} value - Password value
   * @param {Object} helpers - Joi helpers
   * @returns {string|Object} - Password or error
   */
  passwordStrength: (value, helpers) => {
    if (!value) {
      return helpers.error('password.required');
    }

    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (value.length < minLength) {
      return helpers.error('password.minLength', { minLength });
    }

    if (!hasUpperCase) {
      return helpers.error('password.uppercase');
    }

    if (!hasLowerCase) {
      return helpers.error('password.lowercase');
    }

    if (!hasNumbers) {
      return helpers.error('password.number');
    }

    if (!hasSpecialChar) {
      return helpers.error('password.specialChar');
    }

    return value;
  },

  /**
   * Username validator
   * @param {string} value - Username value
   * @param {Object} helpers - Joi helpers
   * @returns {string|Object} - Username or error
   */
  username: (value, helpers) => {
    if (!value) {
      return helpers.error('username.required');
    }

    // Username should be 3-30 characters, alphanumeric with underscores and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    
    if (!usernameRegex.test(value)) {
      return helpers.error('username.invalid');
    }

    // Check for reserved usernames
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'user',
      'api', 'support', 'help', 'info', 'contact',
      'www', 'mail', 'email', 'ftp', 'test'
    ];

    if (reservedUsernames.includes(value.toLowerCase())) {
      return helpers.error('username.reserved');
    }

    return value;
  },

  /**
   * Organization name validator
   * @param {string} value - Organization name
   * @param {Object} helpers - Joi helpers
   * @returns {string|Object} - Organization name or error
   */
  organizationName: (value, helpers) => {
    if (!value) {
      return helpers.error('organization.required');
    }

    // Organization name should be 2-100 characters
    if (value.length < 2 || value.length > 100) {
      return helpers.error('organization.length');
    }

    // Only allow letters, numbers, spaces, hyphens, and underscores
    const orgNameRegex = /^[a-zA-Z0-9\s_-]+$/;
    
    if (!orgNameRegex.test(value)) {
      return helpers.error('organization.invalid');
    }

    return value.trim();
  }
};

// Extend Joi with custom validators
const extendedJoi = Joi.extend({
  type: 'password',
  base: Joi.string(),
  messages: {
    'password.required': 'Password is required',
    'password.minLength': 'Password must be at least {{#minLength}} characters long',
    'password.uppercase': 'Password must contain at least one uppercase letter',
    'password.lowercase': 'Password must contain at least one lowercase letter',
    'password.number': 'Password must contain at least one number',
    'password.specialChar': 'Password must contain at least one special character'
  },
  rules: {
    strength: {
      method() {
        return this.$_addRule('strength');
      },
      validate: customValidators.passwordStrength
    }
  }
}, {
  type: 'username',
  base: Joi.string(),
  messages: {
    'username.required': 'Username is required',
    'username.invalid': 'Username must be 3-30 characters long and contain only letters, numbers, underscores, and hyphens',
    'username.reserved': 'This username is reserved and cannot be used'
  },
  rules: {
    usernameValid: {
      method() {
        return this.$_addRule('usernameValid');
      },
      validate: customValidators.username
    }
  }
}, {
  type: 'organization',
  base: Joi.string(),
  messages: {
    'organization.required': 'Organization name is required',
    'organization.length': 'Organization name must be between 2 and 100 characters',
    'organization.invalid': 'Organization name can only contain letters, numbers, spaces, hyphens, and underscores'
  },
  rules: {
    name: {
      method() {
        return this.$_addRule('name');
      },
      validate: customValidators.organizationName
    }
  }
});

/**
 * Common validation schemas
 */
const commonSchemas = {
  email: extendedJoi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),

  password: extendedJoi.password().strength().required(),

  username: extendedJoi.username().usernameValid().required(),

  id: extendedJoi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid ID format'
  }),

  organizationName: extendedJoi.organization().name().required(),

  role: extendedJoi.string().valid('SUPER_ADMIN', 'ADMIN', 'MEMBER', 'VIEWER').required(),

  pagination: extendedJoi.object({
    limit: extendedJoi.number().integer().min(1).max(100).default(10),
    offset: extendedJoi.number().integer().min(0).default(0),
    sortBy: extendedJoi.string().default('createdAt'),
    sortOrder: extendedJoi.string().valid('asc', 'desc').default('desc')
  })
};

/**
 * Sanitize input data
 * @param {Object} data - Input data
 * @returns {Object} - Sanitized data
 */
const sanitizeInput = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    if (typeof value === 'string') {
      // Trim whitespace and convert to appropriate case
      sanitized[key] = value.trim();
      
      // Convert email to lowercase
      if (key === 'email') {
        sanitized[key] = sanitized[key].toLowerCase();
      }
      
      // Convert username to lowercase
      if (key === 'username') {
        sanitized[key] = sanitized[key].toLowerCase();
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
};

/**
 * Create a validation middleware for GraphQL resolvers
 * @param {Object} schema - Joi schema
 * @returns {Function} - Validation middleware
 */
const createValidationMiddleware = (schema) => {
  return (resolver) => {
    return async (parent, args, context, info) => {
      // Sanitize input
      const sanitizedArgs = sanitizeInput(args);
      
      // Validate input
      const { error, value } = validateInput(schema, sanitizedArgs);
      
      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          code: 'VALIDATION_ERROR'
        }));

        throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }

      // Call the original resolver with validated data
      return resolver(parent, value, context, info);
    };
  };
};

/**
 * Batch validate multiple inputs
 * @param {Array} validations - Array of {schema, data} objects
 * @returns {Object} - Batch validation result
 */
const batchValidate = (validations) => {
  const results = [];
  let hasErrors = false;

  validations.forEach(({ schema, data, label }, index) => {
    const { error, value } = validateInput(schema, data);
    
    const result = {
      index,
      label: label || `validation_${index}`,
      isValid: !error,
      value,
      errors: error ? error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })) : []
    };

    if (error) {
      hasErrors = true;
    }

    results.push(result);
  });

  return {
    isValid: !hasErrors,
    results
  };
};

module.exports = {
  validateInput,
  sanitizeInput,
  createValidationMiddleware,
  batchValidate,
  customValidators,
  commonSchemas,
  Joi: extendedJoi
}; 