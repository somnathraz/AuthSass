const Joi = require('joi');

// Password validation schema
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  });

// Email validation schema
const emailSchema = Joi.string()
  .email({ minDomainSegments: 2, tlds: { allow: true } })
  .max(255)
  .lowercase()
  .trim()
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email cannot exceed 255 characters',
    'any.required': 'Email is required'
  });

// Username validation schema
const usernameSchema = Joi.string()
  .alphanum()
  .min(3)
  .max(30)
  .lowercase()
  .trim()
  .required()
  .messages({
    'string.alphanum': 'Username can only contain letters and numbers',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 30 characters',
    'any.required': 'Username is required'
  });

// Login validation schema
const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string()
    .min(1)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password is required',
      'string.max': 'Password cannot exceed 128 characters',
      'any.required': 'Password is required'
    }),
  rememberMe: Joi.boolean().default(false)
}).options({ stripUnknown: true });

// Signup validation schema
const signupSchema = Joi.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    }),
  acceptTerms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept the terms and conditions',
      'any.required': 'Terms acceptance is required'
    }),
  firstName: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .messages({
      'string.max': 'First name cannot exceed 50 characters'
    }),
  lastName: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .messages({
      'string.max': 'Last name cannot exceed 50 characters'
    })
}).options({ stripUnknown: true });

// Social login validation schema
const socialLoginSchema = Joi.object({
  provider: Joi.string()
    .valid('google', 'github', 'linkedin', 'microsoft')
    .required()
    .messages({
      'any.only': 'Invalid social provider',
      'any.required': 'Social provider is required'
    }),
  token: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Token is required',
      'any.required': 'Token is required'
    }),
  redirectUri: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Invalid redirect URI'
    })
}).options({ stripUnknown: true });

// Password reset request validation schema
const passwordResetRequestSchema = Joi.object({
  email: emailSchema,
  redirectUri: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Invalid redirect URI'
    })
}).options({ stripUnknown: true });

// Password reset validation schema
const passwordResetSchema = Joi.object({
  token: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Reset token is required',
      'any.required': 'Reset token is required'
    }),
  newPassword: passwordSchema.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
}).options({ stripUnknown: true });

// Change password validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Current password is required',
      'any.required': 'Current password is required'
    }),
  newPassword: passwordSchema.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
}).options({ stripUnknown: true });

// Email verification schema
const emailVerificationSchema = Joi.object({
  token: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Verification token is required',
      'any.required': 'Verification token is required'
    })
}).options({ stripUnknown: true });

// Token validation schema
const tokenValidationSchema = Joi.object({
  token: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Token is required',
      'any.required': 'Token is required'
    })
}).options({ stripUnknown: true });

// Refresh token schema
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .allow('')
    .messages({
      'string.base': 'Refresh token must be a string'
    })
}).options({ stripUnknown: true });

// User preferences validation schema
const userPreferencesSchema = Joi.object({
  notifications: Joi.object({
    email: Joi.boolean(),
    push: Joi.boolean(),
    sms: Joi.boolean(),
    inApp: Joi.boolean(),
    frequency: Joi.string().valid('IMMEDIATE', 'HOURLY', 'DAILY', 'WEEKLY', 'NEVER')
  }),
  privacy: Joi.object({
    profileVisibility: Joi.string().valid('PUBLIC', 'ORGANIZATION', 'PRIVATE'),
    dataSharing: Joi.boolean(),
    analyticsOptOut: Joi.boolean()
  }),
  appearance: Joi.object({
    theme: Joi.string().valid('LIGHT', 'DARK', 'AUTO'),
    language: Joi.string().max(10),
    dateFormat: Joi.string().max(20),
    timeFormat: Joi.string().valid('FORMAT_12', 'FORMAT_24')
  })
}).options({ stripUnknown: true });

// User update validation schema
const userUpdateSchema = Joi.object({
  username: usernameSchema.optional(),
  firstName: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .messages({
      'string.max': 'First name cannot exceed 50 characters'
    }),
  lastName: Joi.string()
    .max(50)
    .trim()
    .allow('')
    .messages({
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  timezone: Joi.string()
    .max(50)
    .allow('')
    .messages({
      'string.max': 'Timezone cannot exceed 50 characters'
    }),
  locale: Joi.string()
    .max(10)
    .allow('')
    .messages({
      'string.max': 'Locale cannot exceed 10 characters'
    }),
  profileImage: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Profile image must be a valid URL'
    })
}).options({ stripUnknown: true });

// Account security settings schema
const securitySettingsSchema = Joi.object({
  twoFactorEnabled: Joi.boolean(),
  sessionTimeout: Joi.number().min(5).max(1440), // 5 minutes to 24 hours
  trustedDevices: Joi.array().items(Joi.string()),
  lastPasswordChange: Joi.date(),
  securityQuestions: Joi.array().items(
    Joi.object({
      question: Joi.string().required(),
      answer: Joi.string().required()
    })
  ).max(3)
}).options({ stripUnknown: true });

// Device registration schema
const deviceRegistrationSchema = Joi.object({
  deviceName: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.max': 'Device name cannot exceed 100 characters',
      'any.required': 'Device name is required'
    }),
  deviceType: Joi.string()
    .valid('mobile', 'tablet', 'desktop', 'other')
    .required()
    .messages({
      'any.only': 'Invalid device type',
      'any.required': 'Device type is required'
    }),
  deviceId: Joi.string()
    .max(255)
    .required()
    .messages({
      'string.max': 'Device ID cannot exceed 255 characters',
      'any.required': 'Device ID is required'
    }),
  pushToken: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Push token cannot exceed 500 characters'
    })
}).options({ stripUnknown: true });

// Export all schemas
module.exports = {
  loginSchema,
  signupSchema,
  socialLoginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  emailVerificationSchema,
  tokenValidationSchema,
  refreshTokenSchema,
  userPreferencesSchema,
  userUpdateSchema,
  securitySettingsSchema,
  deviceRegistrationSchema,
  
  // Individual field schemas for reuse
  passwordSchema,
  emailSchema,
  usernameSchema
}; 