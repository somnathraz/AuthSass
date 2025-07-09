const ApiKey = require('../models/ApiKey');
const App = require('../models/App');
const { generateAPIKey } = require('../utils/crypto');
const { auditLog } = require('../utils/audit');

class ApiKeyService {
  
  /**
   * Create a new API key for an app
   * @param {string} appId - App ID
   * @param {string} userId - User creating the key
   * @param {Object} options - Key options
   * @returns {Promise<Object>} - Created API key
   */
  static async createApiKey(appId, userId, options = {}) {
    try {
      // Verify app exists and user has permission
      const app = await App.findById(appId);
      if (!app) {
        throw new Error('App not found');
      }

      // Generate secure API key
      const key = generateAPIKey('sk');
      
      const apiKeyData = {
        key,
        appId,
        name: options.name || 'API Key',
        permissions: options.permissions || ['read'],
        expiresAt: options.expiresAt,
        createdBy: userId,
        isActive: true
      };

      const apiKey = await ApiKey.create(apiKeyData);

      await auditLog('API_KEY_CREATED', userId, {
        apiKeyId: apiKey._id,
        appId,
        keyName: apiKey.name
      });

      return apiKey;

    } catch (error) {
      throw new Error(`Failed to create API key: ${error.message}`);
    }
  }

  /**
   * List API keys for an app
   * @param {string} appId - App ID
   * @param {string} userId - User requesting keys
   * @returns {Promise<Array>} - API keys
   */
  static async listApiKeys(appId, userId) {
    try {
      // Verify app access
      const app = await App.findById(appId);
      if (!app) {
        throw new Error('App not found');
      }

      const apiKeys = await ApiKey.find({ 
        appId,
        isActive: true 
      }).select('-key'); // Don't return the actual key

      return apiKeys;

    } catch (error) {
      throw new Error(`Failed to list API keys: ${error.message}`);
    }
  }

  /**
   * Revoke an API key
   * @param {string} apiKeyId - API Key ID
   * @param {string} userId - User revoking the key
   * @returns {Promise<boolean>} - Success status
   */
  static async revokeApiKey(apiKeyId, userId) {
    try {
      const apiKey = await ApiKey.findById(apiKeyId);
      if (!apiKey) {
        throw new Error('API key not found');
      }

      // Verify app access
      const app = await App.findById(apiKey.appId);
      if (!app) {
        throw new Error('Associated app not found');
      }

      apiKey.isActive = false;
      apiKey.revokedAt = new Date();
      apiKey.revokedBy = userId;
      await apiKey.save();

      await auditLog('API_KEY_REVOKED', userId, {
        apiKeyId: apiKey._id,
        appId: apiKey.appId,
        keyName: apiKey.name
      });

      return true;

    } catch (error) {
      throw new Error(`Failed to revoke API key: ${error.message}`);
    }
  }

  /**
   * Validate an API key
   * @param {string} key - API key to validate
   * @returns {Promise<Object>} - Validation result
   */
  static async validateApiKey(key) {
    try {
      const apiKey = await ApiKey.findOne({ 
        key,
        isActive: true,
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null }
        ]
      }).populate('appId');

      if (!apiKey) {
        return { valid: false, reason: 'Invalid or expired API key' };
      }

      // Update last used
      apiKey.lastUsedAt = new Date();
      await apiKey.save();

      return {
        valid: true,
        apiKey: {
          id: apiKey._id,
          appId: apiKey.appId,
          permissions: apiKey.permissions,
          name: apiKey.name
        }
      };

    } catch (error) {
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Update API key
   * @param {string} apiKeyId - API Key ID
   * @param {string} userId - User updating the key
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated API key
   */
  static async updateApiKey(apiKeyId, userId, updates) {
    try {
      const apiKey = await ApiKey.findById(apiKeyId);
      if (!apiKey) {
        throw new Error('API key not found');
      }

      // Apply allowed updates
      if (updates.name) apiKey.name = updates.name;
      if (updates.permissions) apiKey.permissions = updates.permissions;
      if (updates.expiresAt !== undefined) apiKey.expiresAt = updates.expiresAt;

      apiKey.updatedAt = new Date();
      await apiKey.save();

      await auditLog('API_KEY_UPDATED', userId, {
        apiKeyId: apiKey._id,
        appId: apiKey.appId,
        updates
      });

      return apiKey;

    } catch (error) {
      throw new Error(`Failed to update API key: ${error.message}`);
    }
  }
}

module.exports = ApiKeyService; 