const rateLimit = require("express-rate-limit");

// In-memory store for rate limiting (for production, use Redis)
const rateLimitStore = new Map();

// Limit login attempts (5 per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: "Too many login attempts. Try again later.",
});

// Limit password reset requests (3 per hour)
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: "Too many password reset requests. Try again later.",
});

/**
 * Rate limit check function for GraphQL resolvers
 * @param {Object} req - Request object
 * @param {string} operation - Operation name (login, signup, etc.)
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<void>} - Throws error if rate limit exceeded
 */
const rateLimitCheck = async (req, operation, maxAttempts, windowMs) => {
  const clientKey = `${req.ip}-${operation}`;
  const now = Date.now();
  
  // Get or create client data
  if (!rateLimitStore.has(clientKey)) {
    rateLimitStore.set(clientKey, {
      attempts: [],
      firstAttempt: now
    });
  }

  const clientData = rateLimitStore.get(clientKey);
  
  // Remove expired attempts
  clientData.attempts = clientData.attempts.filter(
    attemptTime => now - attemptTime < windowMs
  );

  // Check if rate limit exceeded
  if (clientData.attempts.length >= maxAttempts) {
    const oldestAttempt = Math.min(...clientData.attempts);
    const resetTime = new Date(oldestAttempt + windowMs);
    
    throw new Error(`Rate limit exceeded for ${operation}. Try again after ${resetTime.toISOString()}`);
  }

  // Add current attempt
  clientData.attempts.push(now);
  
  // Update store
  rateLimitStore.set(clientKey, clientData);
};

/**
 * Clean up expired rate limit entries
 */
const cleanupRateLimitStore = () => {
  const now = Date.now();
  const maxWindowMs = 24 * 60 * 60 * 1000; // 24 hours - max window size

  for (const [key, data] of rateLimitStore.entries()) {
    // Remove entries older than 24 hours
    if (now - data.firstAttempt > maxWindowMs) {
      rateLimitStore.delete(key);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupRateLimitStore, 60 * 60 * 1000);

/**
 * Get rate limit status for a client
 * @param {string} ip - Client IP
 * @param {string} operation - Operation name
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} - Rate limit status
 */
const getRateLimitStatus = (ip, operation, maxAttempts, windowMs) => {
  const clientKey = `${ip}-${operation}`;
  const now = Date.now();
  
  if (!rateLimitStore.has(clientKey)) {
    return {
      attempts: 0,
      remaining: maxAttempts,
      resetTime: null,
      isBlocked: false
    };
  }

  const clientData = rateLimitStore.get(clientKey);
  
  // Filter valid attempts
  const validAttempts = clientData.attempts.filter(
    attemptTime => now - attemptTime < windowMs
  );

  const remaining = Math.max(0, maxAttempts - validAttempts.length);
  const isBlocked = validAttempts.length >= maxAttempts;
  
  let resetTime = null;
  if (isBlocked && validAttempts.length > 0) {
    const oldestAttempt = Math.min(...validAttempts);
    resetTime = new Date(oldestAttempt + windowMs);
  }

  return {
    attempts: validAttempts.length,
    remaining,
    resetTime,
    isBlocked
  };
};

module.exports = { 
  loginLimiter, 
  resetPasswordLimiter, 
  rateLimitCheck,
  getRateLimitStatus,
  cleanupRateLimitStore
};
