const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');

// Models
const User = require('../models/User');
const Organization = require('../models/Organization');
const OrgMembership = require('../models/OrgMembership');
const RefreshToken = require('../models/RefreshToken');

// Services
const OrganizationService = require('./organization.service');
const TokenService = require('./token.service');

// Utils
const { generateSecureToken } = require('../utils/crypto');
const { auditLog } = require('../utils/audit');

class AuthService {
  constructor() {
    // We'll initialize the Google client lazily when first needed
    this.googleClient = null;
    this.saltRounds = 12;
  }

  /**
   * Get or initialize Google OAuth client
   * @returns {OAuth2Client} - Google OAuth client
   */
  getGoogleClient() {
    if (!this.googleClient) {
      if (!process.env.GOOGLE_CLIENT_ID) {
        throw new Error('GOOGLE_CLIENT_ID environment variable is not set');
      }
      this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      console.log('✅ AuthService: Google OAuth client initialized');
    }
    return this.googleClient;
  }

  /**
   * Hash a password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  async hashPassword(password) {
    if (!password) {
      throw new UserInputError('Password is required');
    }
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} - Match result
   */
  async comparePassword(password, hash) {
    if (!password || !hash) {
      return false;
    }
    return await bcrypt.compare(password, hash);
  }

  /**
   * Create a new user with personal organization
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  async createUserWithOrganization(userData) {
    const session = await User.startSession();
    
    try {
      const user = await session.withTransaction(async () => {
        // Hash password if provided
        if (userData.password) {
          userData.passwordHash = await this.hashPassword(userData.password);
          delete userData.password;
        }

        // Set default values
        const userDefaults = {
          status: 'ACTIVE',
          role: 'MEMBER',
          accountType: 'personal',
          isVerified: false,
          requirePasswordReset: false,
          failedLoginAttempts: 0,
          preferences: this.getDefaultUserPreferences(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const finalUserData = { ...userDefaults, ...userData };

        // Create user
        const [user] = await User.create([finalUserData], { session });

        // Create personal organization
        const orgData = {
          name: `${user.username}'s Personal Workspace`,
          type: 'PERSONAL',
          owner: user._id,
          members: [user._id],
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const [organization] = await Organization.create([orgData], { session });

        // Create organization membership
        const membershipData = {
          user: user._id,
          org: organization._id,
          role: 'ADMIN',
          status: 'ACTIVE',
          joinedAt: new Date()
        };

        await OrgMembership.create([membershipData], { session });

        // Update user with organization reference
        user.organizationId = organization._id;
        await user.save({ session });

        return user;
      });

      // Ensure we return a document with id field properly defined
      const populatedUser = await User.findById(user._id);
      
      // Convert _id to id for GraphQL compatibility
      const userObj = populatedUser.toObject();
      userObj.id = userObj._id.toString();
      
      // Ensure organizationId is a string, not a populated object
      if (userObj.organizationId) {
        userObj.organizationId = userObj.organizationId.toString();
      }
      
      return userObj;

    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Authentication result
   */
  async authenticateUser(email, password) {
    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+passwordHash');

    if (!user) {
      await auditLog('LOGIN_FAILED', null, { email, reason: 'USER_NOT_FOUND' });
      throw new AuthenticationError('Invalid credentials');
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      await auditLog('LOGIN_FAILED', user._id, { reason: 'ACCOUNT_INACTIVE' });
      throw new ForbiddenError('Account is not active');
    }

    // Check for account lockout
    if (user.isLockedOut()) {
      throw new ForbiddenError('Account temporarily locked due to too many failed attempts');
    }

    // Verify password
    const isValid = await this.comparePassword(password, user.passwordHash);
    if (!isValid) {
      await this.handleFailedLogin(user);
      throw new AuthenticationError('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await this.handleSuccessfulLogin(user);

    return user;
  }

  /**
   * Handle failed login attempt
   * @param {Object} user - User object
   */
  async handleFailedLogin(user) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    
    // Lock account after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
      user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }

    await user.save();
    await auditLog('LOGIN_FAILED', user._id, { 
      reason: 'INVALID_PASSWORD',
      failedAttempts: user.failedLoginAttempts 
    });
  }

  /**
   * Handle successful login
   * @param {Object} user - User object
   * @param {string} ip - IP address
   * @param {string} userAgent - User agent
   */
  async handleSuccessfulLogin(user, ip, userAgent) {
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    user.lastLoginAt = new Date();
    user.lastLoginIP = ip;
    user.lastLoginUserAgent = userAgent;
    
    await user.save();
  }

  /**
   * Validate social authentication token
   * @param {string} provider - Social provider (google, github, etc.)
   * @param {string} token - Provider token
   * @returns {Promise<Object>} - User info from provider
   */
  async validateSocialToken(provider, token) {
    switch (provider.toLowerCase()) {
      case 'google':
        return await this.validateGoogleToken(token);
      case 'github':
        return await this.validateGithubToken(token);
      default:
        throw new UserInputError(`Unsupported social provider: ${provider}`);
    }
  }

  /**
   * Validate Google OAuth token
   * @param {string} token - Google ID token
   * @returns {Promise<Object>} - User info
   */
  async validateGoogleToken(token) {
    try {
      console.log('Validating Google token...');
      
      const googleClient = this.getGoogleClient();

      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      console.log('Google token validated successfully for:', payload.email);
      
      if (!payload.email) {
        throw new Error('No email found in Google token payload');
      }

      return {
        email: payload.email,
        username: payload.name || payload.email.split('@')[0],
        firstName: payload.given_name,
        lastName: payload.family_name,
        picture: payload.picture,
        isVerified: payload.email_verified
      };
    } catch (error) {
      console.error('Google token validation failed:', {
        message: error.message,
        name: error.name,
        tokenLength: token ? token.length : 'undefined'
      });
      throw new AuthenticationError(`Invalid Google token: ${error.message}`);
    }
  }

  /**
   * Validate GitHub OAuth token
   * @param {string} token - GitHub access token
   * @returns {Promise<Object>} - User info
   */
  async validateGithubToken(token) {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'YourApp'
        }
      });

      if (!response.ok) {
        throw new AuthenticationError('Invalid GitHub token');
      }

      const userData = await response.json();
      
      // Get user email (might be private)
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'YourApp'
        }
      });

      const emails = await emailResponse.json();
      const primaryEmail = emails.find(email => email.primary && email.verified);

      return {
        email: primaryEmail?.email || userData.email,
        username: userData.login,
        firstName: userData.name?.split(' ')[0],
        lastName: userData.name?.split(' ').slice(1).join(' '),
        picture: userData.avatar_url,
        isVerified: true
      };
    } catch (error) {
      throw new AuthenticationError('Invalid GitHub token');
    }
  }

  /**
   * Generate password reset token
   * @param {string} userId - User ID
   * @returns {Promise<string>} - Reset token
   */
  async generatePasswordResetToken(userId) {
    const token = generateSecureToken(32);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await User.findByIdAndUpdate(userId, {
      passwordResetToken: token,
      passwordResetExpires: expires
    });

    return token;
  }

  /**
   * Reset password using token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Result
   */
  async resetPassword(token, newPassword) {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new UserInputError('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update user
    user.passwordHash = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.requirePasswordReset = false;
    user.updatedAt = new Date();

    await user.save();

    // Audit log
    await auditLog('PASSWORD_RESET', user._id);

    return { success: true, message: 'Password reset successfully' };
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Result
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash');

    if (!user) {
      throw new UserInputError('User not found');
    }

    // Verify current password
    const isValid = await this.comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update user
    user.passwordHash = passwordHash;
    user.requirePasswordReset = false;
    user.updatedAt = new Date();

    await user.save();

    // Audit log
    await auditLog('PASSWORD_CHANGED', user._id);

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Get default user preferences
   * @returns {Object} - Default preferences
   */
  getDefaultUserPreferences() {
    return {
      notifications: {
        email: true,
        push: true,
        sms: false,
        inApp: true,
        frequency: 'IMMEDIATE'
      },
      privacy: {
        profileVisibility: 'ORGANIZATION',
        dataSharing: false,
        analyticsOptOut: false
      },
      appearance: {
        theme: 'AUTO',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: 'FORMAT_12'
      }
    };
  }

  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<Object>} - Result
   */
  async verifyEmail(token) {
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      throw new UserInputError('Invalid verification token');
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.status = 'ACTIVE';
    user.updatedAt = new Date();

    await user.save();

    // Audit log
    await auditLog('EMAIL_VERIFIED', user._id);

    return { success: true, message: 'Email verified successfully' };
  }

  /**
   * Revoke all user tokens
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async revokeAllUserTokens(userId) {
    await RefreshToken.deleteMany({ userId });
    await auditLog('ALL_TOKENS_REVOKED', userId);
  }

  /**
   * Check if user has permission
   * @param {Object} user - User object
   * @param {string} resource - Resource name
   * @param {string} action - Action name
   * @returns {boolean} - Permission result
   */
  async checkPermission(user, resource, action) {
    // Implementation depends on your permission system
    // This is a simplified example
    
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Check user permissions based on role and organization
    // This would typically query a permissions table
    return false;
  }
}

module.exports = new AuthService(); 