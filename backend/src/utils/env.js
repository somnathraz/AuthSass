const Joi = require('joi');

/**
 * Environment validation schema
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),
  
  // Database
  MONGODB_URI: Joi.string().required(),
  
  // JWT Secrets
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  
  // Email Configuration
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_USER: Joi.string().email().required(),
  EMAIL_PASS: Joi.string().required(),
  
  // Frontend URL
  FRONTEND_URL: Joi.string().uri().required(),
  
  // Optional OAuth
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  
  // Optional Redis (for production rate limiting)
  REDIS_URL: Joi.string().uri().optional(),
  
  // Optional Monitoring
  SENTRY_DSN: Joi.string().uri().optional(),
  
  // Security
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // File Upload (if needed)
  MAX_FILE_SIZE: Joi.number().default(5242880), // 5MB
  UPLOAD_DIR: Joi.string().default('./uploads'),
  
  // Database Connection Pool
  DB_POOL_SIZE: Joi.number().default(10),
  DB_TIMEOUT_MS: Joi.number().default(30000),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info')
}).unknown(); // Allow other environment variables

/**
 * Validate environment variables
 * @returns {Object} - Validated environment configuration
 */
const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    console.error('❌ Environment validation failed:');
    error.details.forEach(detail => {
      console.error(`  - ${detail.message}`);
    });
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
  return value;
};

/**
 * Get validated environment configuration
 */
const env = validateEnv();

/**
 * Check if running in production
 * @returns {boolean}
 */
const isProduction = () => env.NODE_ENV === 'production';

/**
 * Check if running in development
 * @returns {boolean}
 */
const isDevelopment = () => env.NODE_ENV === 'development';

/**
 * Check if running in test
 * @returns {boolean}
 */
const isTest = () => env.NODE_ENV === 'test';

/**
 * Get CORS origins as array
 * @returns {Array}
 */
const getCorsOrigins = () => {
  return env.CORS_ORIGINS.split(',').map(origin => origin.trim());
};

/**
 * Get database configuration
 * @returns {Object}
 */
const getDatabaseConfig = () => ({
  uri: env.MONGODB_URI,
  options: {
    maxPoolSize: env.DB_POOL_SIZE,
    serverSelectionTimeoutMS: env.DB_TIMEOUT_MS,
    socketTimeoutMS: env.DB_TIMEOUT_MS,
    family: 4, // Use IPv4, skip trying IPv6
    bufferCommands: false,
    bufferMaxEntries: 0
  }
});

/**
 * Get email configuration
 * @returns {Object}
 */
const getEmailConfig = () => ({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

/**
 * Get JWT configuration
 * @returns {Object}
 */
const getJWTConfig = () => ({
  secret: env.JWT_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  expiresIn: '15m',
  refreshExpiresIn: '30d',
  issuer: 'auth-saas',
  audience: 'auth-saas-client'
});

/**
 * Get rate limiting configuration
 * @returns {Object}
 */
const getRateLimitConfig = () => ({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Check required environment variables for specific features
 * @param {string} feature - Feature name
 * @returns {boolean}
 */
const hasFeatureConfig = (feature) => {
  switch (feature) {
    case 'google_oauth':
      return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
    case 'redis':
      return !!env.REDIS_URL;
    case 'sentry':
      return !!env.SENTRY_DSN;
    default:
      return false;
  }
};

/**
 * Log environment configuration (safe version)
 */
const logEnvironmentInfo = () => {
  console.log('🔧 Environment Configuration:');
  console.log(`  - Environment: ${env.NODE_ENV}`);
  console.log(`  - Port: ${env.PORT}`);
  console.log(`  - Database: ${env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`  - Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`  - Email Host: ${env.EMAIL_HOST}`);
  console.log(`  - CORS Origins: ${env.CORS_ORIGINS}`);
  console.log(`  - Google OAuth: ${hasFeatureConfig('google_oauth') ? 'Enabled' : 'Disabled'}`);
  console.log(`  - Redis: ${hasFeatureConfig('redis') ? 'Enabled' : 'Disabled'}`);
  console.log(`  - Sentry: ${hasFeatureConfig('sentry') ? 'Enabled' : 'Disabled'}`);
};

module.exports = {
  env,
  validateEnv,
  isProduction,
  isDevelopment,
  isTest,
  getCorsOrigins,
  getDatabaseConfig,
  getEmailConfig,
  getJWTConfig,
  getRateLimitConfig,
  hasFeatureConfig,
  logEnvironmentInfo
}; 