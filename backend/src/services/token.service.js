const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const { auditLog } = require('../utils/audit');

class TokenService {
  constructor() {
    this.accessTokenExpiry = '15m'; // 15 minutes
    this.refreshTokenExpiry = '30d'; // 30 days
  }

  /**
   * Get JWT secret, ensuring it's available
   * @returns {string} - JWT secret
   */
  getAccessTokenSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return secret;
  }

  /**
   * Get JWT refresh secret (falls back to JWT_SECRET if not set)
   * @returns {string} - JWT refresh secret
   */
  getRefreshTokenSecret() {
    return process.env.JWT_REFRESH_SECRET || this.getAccessTokenSecret();
  }

  /**
   * Generate access and refresh tokens
   * @param {Object} user - User object
   * @param {Object} options - Token options
   * @returns {Promise<Object>} - Token data
   */
  async generateTokens(user, options = {}) {
    const { expiresIn = this.accessTokenExpiry } = options;

    // Create access token payload
    const accessTokenPayload = {
      userId: user._id || user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      type: 'access'
    };

    // Generate access token
    const accessToken = jwt.sign(
      accessTokenPayload,
      this.getAccessTokenSecret(),
      { 
        expiresIn,
        issuer: 'auth-saas',
        audience: 'auth-saas-client'
      }
    );

    // Generate refresh token
    const refreshTokenData = await this.generateRefreshToken(user._id || user.id);

    // Calculate expiry time in seconds
    const expiresInSeconds = this.parseExpiryToSeconds(expiresIn);

    return {
      accessToken,
      refreshToken: refreshTokenData.token,
      expiresIn: expiresInSeconds,
      tokenType: 'Bearer'
    };
  }

  /**
   * Generate refresh token
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Refresh token data
   */
  async generateRefreshToken(userId) {
    // Revoke existing refresh tokens for user
    await RefreshToken.updateMany(
      { userId, isActive: true },
      { isActive: false, revokedAt: new Date() }
    );

    // Generate new refresh token
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const refreshTokenData = {
      token,
      userId,
      expiresAt,
      isActive: true,
      createdAt: new Date()
    };

    const savedToken = await RefreshToken.create(refreshTokenData);
    return savedToken;
  }

  /**
   * Verify access token
   * @param {string} token - Access token
   * @returns {Promise<Object>} - Decoded token
   */
  async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.getAccessTokenSecret(), {
        issuer: 'auth-saas',
        audience: 'auth-saas-client'
      });

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('ACCESS_TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_ACCESS_TOKEN');
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - New access token
   */
  async refreshAccessToken(refreshToken) {
    // Find and validate refresh token
    const tokenDoc = await RefreshToken.findOne({
      token: refreshToken,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!tokenDoc) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    // Generate new access token
    const user = tokenDoc.userId;
    const { accessToken, expiresIn } = await this.generateTokens(user, {
      expiresIn: this.accessTokenExpiry
    });

    // Update refresh token last used
    tokenDoc.lastUsedAt = new Date();
    await tokenDoc.save();

    await auditLog('TOKEN_REFRESHED', user._id);

    return {
      accessToken,
      expiresIn,
      tokenType: 'Bearer'
    };
  }

  /**
   * Revoke refresh token
   * @param {string} refreshToken - Refresh token to revoke
   */
  async revokeRefreshToken(refreshToken) {
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken, isActive: true },
      { 
        isActive: false, 
        revokedAt: new Date() 
      }
    );
  }

  /**
   * Revoke all user tokens
   * @param {string} userId - User ID
   */
  async revokeUserTokens(userId) {
    await RefreshToken.updateMany(
      { userId, isActive: true },
      { 
        isActive: false, 
        revokedAt: new Date() 
      }
    );

    await auditLog('ALL_TOKENS_REVOKED', userId);
  }

  /**
   * Generate email verification token
   * @param {string} userId - User ID
   * @returns {Promise<string>} - Verification token
   */
  async generateVerificationToken(userId) {
    const payload = {
      userId,
      type: 'email_verification',
      purpose: 'VERIFY_EMAIL'
    };

    return jwt.sign(
      payload,
      this.getAccessTokenSecret(),
      { 
        expiresIn: '24h',
        issuer: 'auth-saas',
        audience: 'auth-saas-client'
      }
    );
  }

  /**
   * Generate password reset token
   * @param {string} userId - User ID
   * @returns {Promise<string>} - Reset token
   */
  async generatePasswordResetToken(userId) {
    const payload = {
      userId,
      type: 'password_reset',
      purpose: 'RESET_PASSWORD'
    };

    return jwt.sign(
      payload,
      this.getAccessTokenSecret(),
      { 
        expiresIn: '1h',
        issuer: 'auth-saas',
        audience: 'auth-saas-client'
      }
    );
  }

  /**
   * Generate invitation token
   * @param {string} invitationId - Invitation ID
   * @returns {Promise<string>} - Invitation token
   */
  async generateInvitationToken(invitationId) {
    const payload = {
      invitationId,
      type: 'invitation',
      purpose: 'ACCEPT_INVITATION'
    };

    return jwt.sign(
      payload,
      this.getAccessTokenSecret(),
      { 
        expiresIn: '7d', // 7 days to accept invitation
        issuer: 'auth-saas',
        audience: 'auth-saas-client'
      }
    );
  }

  /**
   * Generate magic link login token
   * @param {string} userId - User ID
   * @returns {Promise<string>} - Magic link token
   */
  async generateMagicLinkToken(userId) {
    const payload = {
      userId,
      type: 'magic_link',
      purpose: 'MAGIC_LINK_LOGIN'
    };

    return jwt.sign(
      payload,
      this.getAccessTokenSecret(),
      {
        expiresIn: '15m',
        issuer: 'auth-saas',
        audience: 'auth-saas-client'
      }
    );
  }

  /**
   * Verify magic link token
   * @param {string} token - Token to verify
   * @returns {Promise<Object>} - Decoded token
   */
  async verifyMagicLinkToken(token) {
    return this.verifySpecialToken(token, 'magic_link');
  }

  /**
   * Verify special purpose token (verification, reset, etc.)
   * @param {string} token - Token to verify
   * @param {string} expectedType - Expected token type
   * @returns {Promise<Object>} - Decoded token
   */
  async verifySpecialToken(token, expectedType) {
    try {
      const decoded = jwt.verify(token, this.getAccessTokenSecret(), {
        issuer: 'auth-saas',
        audience: 'auth-saas-client'
      });

      if (decoded.type !== expectedType) {
        throw new Error(`Invalid token type. Expected ${expectedType}`);
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_TOKEN');
      }
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    const result = await RefreshToken.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isActive: false, revokedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Remove revoked tokens older than 7 days
      ]
    });

    console.log(`Cleaned up ${result.deletedCount} expired tokens`);
    return result.deletedCount;
  }

  /**
   * Get token statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Token statistics
   */
  async getUserTokenStats(userId) {
    const stats = await RefreshToken.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: 1 },
          activeTokens: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$isActive', true] }, { $gt: ['$expiresAt', new Date()] }] },
                1,
                0
              ]
            }
          },
          expiredTokens: {
            $sum: {
              $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0]
            }
          },
          revokedTokens: {
            $sum: {
              $cond: [{ $eq: ['$isActive', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      totalTokens: 0,
      activeTokens: 0,
      expiredTokens: 0,
      revokedTokens: 0
    };
  }

  /**
   * Parse expiry string to seconds
   * @param {string} expiry - Expiry string (e.g., '15m', '1h', '7d')
   * @returns {number} - Expiry in seconds
   */
  parseExpiryToSeconds(expiry) {
    const units = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60
    };

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 15 * 60; // Default to 15 minutes
    }

    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
  }
}

module.exports = new TokenService(); 