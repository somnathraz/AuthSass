const crypto = require('crypto');

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Hex encoded token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure random string with custom alphabet
 * @param {number} length - String length
 * @param {string} alphabet - Custom alphabet (default: alphanumeric)
 * @returns {string} - Random string
 */
const generateSecureString = (length = 16, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  let result = '';
  const alphabetLength = alphabet.length;
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, alphabetLength);
    result += alphabet[randomIndex];
  }
  
  return result;
};

/**
 * Generate a secure numeric code
 * @param {number} length - Code length (default: 6)
 * @returns {string} - Numeric code
 */
const generateNumericCode = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
};

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @param {string} salt - Optional salt
 * @returns {string} - Hex encoded hash
 */
const hashSHA256 = (data, salt = '') => {
  const hash = crypto.createHash('sha256');
  hash.update(data + salt);
  return hash.digest('hex');
};

/**
 * Create HMAC signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @param {string} algorithm - Hash algorithm (default: sha256)
 * @returns {string} - Hex encoded signature
 */
const createHMAC = (data, secret, algorithm = 'sha256') => {
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(data);
  return hmac.digest('hex');
};

/**
 * Verify HMAC signature
 * @param {string} data - Original data
 * @param {string} signature - Signature to verify
 * @param {string} secret - Secret key
 * @param {string} algorithm - Hash algorithm (default: sha256)
 * @returns {boolean} - Verification result
 */
const verifyHMAC = (data, signature, secret, algorithm = 'sha256') => {
  const expectedSignature = createHMAC(data, secret, algorithm);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

/**
 * Encrypt data using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @param {string} key - Encryption key (32 bytes)
 * @returns {Object} - Encrypted data with IV and auth tag
 */
const encrypt = (text, key) => {
  if (!key || key.length !== 64) { // 32 bytes = 64 hex chars
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  }
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-gcm', Buffer.from(key, 'hex'));
  cipher.setAAD(Buffer.from('auth-saas', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

/**
 * Decrypt data using AES-256-GCM
 * @param {Object} encryptedData - Encrypted data object
 * @param {string} key - Decryption key (32 bytes)
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedData, key) => {
  if (!key || key.length !== 64) { // 32 bytes = 64 hex chars
    throw new Error('Decryption key must be 32 bytes (64 hex characters)');
  }
  
  const { encrypted, iv, authTag } = encryptedData;
  
  const decipher = crypto.createDecipher('aes-256-gcm', Buffer.from(key, 'hex'));
  decipher.setAAD(Buffer.from('auth-saas', 'utf8'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Generate a cryptographically secure UUID v4
 * @returns {string} - UUID v4
 */
const generateUUID = () => {
  return crypto.randomUUID();
};

/**
 * Generate a secure API key
 * @param {string} prefix - Optional prefix (default: 'sk')
 * @returns {string} - API key
 */
const generateAPIKey = (prefix = 'sk') => {
  const randomPart = generateSecureString(32);
  return `${prefix}_${randomPart}`;
};

/**
 * Generate a secure session ID
 * @returns {string} - Session ID
 */
const generateSessionId = () => {
  return generateSecureToken(24); // 48 hex characters
};

/**
 * Constant-time string comparison
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - Comparison result
 */
const constantTimeCompare = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  );
};

/**
 * Generate a secure password with specified criteria
 * @param {Object} options - Password options
 * @returns {string} - Generated password
 */
const generateSecurePassword = (options = {}) => {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = true
  } = options;
  
  let charset = '';
  
  if (includeUppercase) {
    charset += excludeSimilar ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  
  if (includeLowercase) {
    charset += excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  }
  
  if (includeNumbers) {
    charset += excludeSimilar ? '23456789' : '0123456789';
  }
  
  if (includeSymbols) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  }
  
  if (!charset) {
    throw new Error('At least one character type must be included');
  }
  
  return generateSecureString(length, charset);
};

module.exports = {
  generateSecureToken,
  generateSecureString,
  generateNumericCode,
  hashSHA256,
  createHMAC,
  verifyHMAC,
  encrypt,
  decrypt,
  generateUUID,
  generateAPIKey,
  generateSessionId,
  constantTimeCompare,
  generateSecurePassword
}; 