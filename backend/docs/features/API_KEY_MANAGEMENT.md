# 🔑 API Key Management - Backend Implementation

## 📋 **Overview**

The API Key Management system is a critical security feature of our multi-tenant authentication SaaS platform. It provides secure, role-based API key generation, management, and revocation capabilities for applications within organizations.

### **Key Features**
- ✅ **Secure Key Generation**: Cryptographically secure API key generation
- ✅ **Permission-Based Access**: Role-based permissions for key operations
- ✅ **Audit Trail**: Complete audit logging for all key operations
- ✅ **Scope Management**: Granular permission scopes for API keys
- ✅ **Automatic Expiration**: Configurable key expiration policies
- ✅ **Rate Limiting**: Built-in rate limiting for API key operations

---

## 🏗️ **Architecture**

### **GraphQL Schema**

```graphql
# API Key Types
type ApiKey {
  id: ID!
  name: String!
  key: String!          # Only returned on creation
  keyHash: String!      # Stored hash, never returned
  lastFourChars: String!
  permissions: [Permission!]!
  scopes: [String!]!
  expiresAt: DateTime
  isActive: Boolean!
  lastUsedAt: DateTime
  usageCount: Int!
  application: Application!
  createdBy: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum Permission {
  READ
  WRITE
  DELETE
  ADMIN
}

# Input Types
input GenerateApiKeyInput {
  applicationId: ID!
  name: String!
  permissions: [Permission!]!
  scopes: [String!]
  expiresAt: DateTime
  description: String
}

input UpdateApiKeyInput {
  name: String
  permissions: [Permission!]
  scopes: [String!]
  isActive: Boolean
}

# Query Operations
type Query {
  appApiKeys(applicationId: ID!): [ApiKey!]!
  apiKey(id: ID!): ApiKey
  validateApiKey(key: String!): ApiKeyValidation
}

# Mutation Operations
type Mutation {
  generateApiKey(input: GenerateApiKeyInput!): ApiKeyResponse!
  updateApiKey(id: ID!, input: UpdateApiKeyInput!): ApiKeyResponse!
  revokeApiKey(id: ID!): ApiKeyResponse!
  rotateApiKey(id: ID!): ApiKeyResponse!
}

# Response Types
type ApiKeyResponse {
  success: Boolean!
  apiKey: ApiKey
  errors: [Error!]
}

type ApiKeyValidation {
  isValid: Boolean!
  permissions: [Permission!]
  scopes: [String!]
  application: Application
  rateLimitRemaining: Int
}
```

### **Database Schema (MongoDB)**

```javascript
// ApiKey Model
const apiKeySchema = new Schema({
  _id: ObjectId,
  name: { type: String, required: true, maxLength: 100 },
  keyHash: { type: String, required: true, unique: true }, // bcrypt hash
  lastFourChars: { type: String, required: true, length: 4 },
  permissions: [{ 
    type: String, 
    enum: ['READ', 'WRITE', 'DELETE', 'ADMIN'],
    required: true 
  }],
  scopes: [{ type: String, maxLength: 50 }],
  expiresAt: Date,
  isActive: { type: Boolean, default: true },
  lastUsedAt: Date,
  usageCount: { type: Number, default: 0 },
  
  // Relationships
  applicationId: { type: ObjectId, ref: 'Application', required: true },
  createdBy: { type: ObjectId, ref: 'User', required: true },
  
  // Audit fields
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  revokedAt: Date,
  revokedBy: { type: ObjectId, ref: 'User' }
});

// Indexes for performance
apiKeySchema.index({ keyHash: 1 });
apiKeySchema.index({ applicationId: 1, isActive: 1 });
apiKeySchema.index({ expiresAt: 1 });
apiKeySchema.index({ createdBy: 1 });
```

---

## 🔧 **Implementation Details**

### **1. API Key Generation**

```javascript
// services/apiKeyService.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');

class ApiKeyService {
  
  /**
   * Generate a new API key
   */
  static generateApiKey() {
    // Generate cryptographically secure random key
    const keyBytes = crypto.randomBytes(32);
    const key = `ak_${keyBytes.toString('hex')}`;
    return key;
  }

  /**
   * Hash API key for secure storage
   */
  static async hashApiKey(key) {
    const saltRounds = 12;
    return await bcrypt.hash(key, saltRounds);
  }

  /**
   * Get last 4 characters for display
   */
  static getLastFourChars(key) {
    return key.slice(-4);
  }

  /**
   * Create API key with full validation
   */
  static async createApiKey(applicationId, input, createdBy) {
    // 1. Validate permissions
    await this.validateCreatePermissions(applicationId, createdBy);
    
    // 2. Check rate limits
    await this.checkRateLimit(applicationId, createdBy);
    
    // 3. Generate secure key
    const key = this.generateApiKey();
    const keyHash = await this.hashApiKey(key);
    const lastFourChars = this.getLastFourChars(key);
    
    // 4. Create in database
    const apiKey = await ApiKey.create({
      name: input.name,
      keyHash,
      lastFourChars,
      permissions: input.permissions,
      scopes: input.scopes || [],
      expiresAt: input.expiresAt,
      applicationId,
      createdBy: createdBy.id
    });
    
    // 5. Log audit event
    await AuditService.log({
      action: 'API_KEY_CREATED',
      entityType: 'ApiKey',
      entityId: apiKey.id,
      userId: createdBy.id,
      metadata: {
        applicationId,
        permissions: input.permissions,
        scopes: input.scopes
      }
    });
    
    // 6. Return key only once (never stored again)
    return {
      ...apiKey.toObject(),
      key, // Only returned on creation
    };
  }
}
```

### **2. Permission Validation**

```javascript
// services/apiKeyPermissionService.js
class ApiKeyPermissionService {
  
  /**
   * Check if user can generate API keys for application
   */
  static async canGenerateApiKeys(application, user) {
    // Check user role in application
    const userRole = await this.getUserRoleInApp(application.id, user.id);
    
    // Only ADMIN and OWNER can generate API keys
    return ['ADMIN', 'OWNER'].includes(userRole);
  }

  /**
   * Check if user can manage API keys
   */
  static async canManageApiKeys(application, user) {
    const userRole = await this.getUserRoleInApp(application.id, user.id);
    
    // ADMIN, OWNER can manage all keys
    // MEMBER can only view keys they created
    return {
      canCreate: ['ADMIN', 'OWNER'].includes(userRole),
      canUpdate: ['ADMIN', 'OWNER'].includes(userRole),
      canDelete: ['ADMIN', 'OWNER'].includes(userRole),
      canView: ['ADMIN', 'OWNER', 'MEMBER'].includes(userRole)
    };
  }

  /**
   * Validate API key permissions against requested action
   */
  static validateKeyPermissions(apiKey, requiredPermission, scope = null) {
    // Check if key is active and not expired
    if (!apiKey.isActive || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
      return false;
    }

    // Check permission level
    if (!apiKey.permissions.includes(requiredPermission)) {
      return false;
    }

    // Check scope if specified
    if (scope && apiKey.scopes.length > 0) {
      return apiKey.scopes.includes(scope);
    }

    return true;
  }
}
```

### **3. GraphQL Resolvers**

```javascript
// resolvers/apiKeyResolvers.js
const apiKeyResolvers = {
  Query: {
    appApiKeys: async (_, { applicationId }, { user }) => {
      // Validate user has access to application
      const application = await Application.findById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Check permissions
      const permissions = await ApiKeyPermissionService.canManageApiKeys(application, user);
      if (!permissions.canView) {
        throw new Error('Insufficient permissions to view API keys');
      }

      // Return API keys (without actual key values)
      return await ApiKey.find({ 
        applicationId,
        revokedAt: { $exists: false }
      }).populate('createdBy', 'username email');
    },

    validateApiKey: async (_, { key }) => {
      try {
        // Find key by hash
        const keyHash = await ApiKeyService.hashApiKey(key);
        const apiKey = await ApiKey.findOne({ keyHash, isActive: true })
          .populate('application');

        if (!apiKey) {
          return { isValid: false };
        }

        // Check expiration
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
          return { isValid: false };
        }

        // Update usage statistics
        await ApiKey.findByIdAndUpdate(apiKey.id, {
          lastUsedAt: new Date(),
          $inc: { usageCount: 1 }
        });

        return {
          isValid: true,
          permissions: apiKey.permissions,
          scopes: apiKey.scopes,
          application: apiKey.application,
          rateLimitRemaining: await RateLimitService.getRemainingCalls(apiKey.id)
        };

      } catch (error) {
        console.error('API key validation error:', error);
        return { isValid: false };
      }
    }
  },

  Mutation: {
    generateApiKey: async (_, { input }, { user }) => {
      try {
        // Validate application exists
        const application = await Application.findById(input.applicationId);
        if (!application) {
          return {
            success: false,
            errors: [{ message: 'Application not found', code: 'APP_NOT_FOUND' }]
          };
        }

        // Check permissions
        const canGenerate = await ApiKeyPermissionService.canGenerateApiKeys(application, user);
        if (!canGenerate) {
          return {
            success: false,
            errors: [{ message: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' }]
          };
        }

        // Generate API key
        const apiKey = await ApiKeyService.createApiKey(input.applicationId, input, user);

        return {
          success: true,
          apiKey
        };

      } catch (error) {
        console.error('Generate API key error:', error);
        return {
          success: false,
          errors: [{ message: error.message, code: 'GENERATION_FAILED' }]
        };
      }
    },

    revokeApiKey: async (_, { id }, { user }) => {
      try {
        const apiKey = await ApiKey.findById(id).populate('application');
        if (!apiKey) {
          return {
            success: false,
            errors: [{ message: 'API key not found', code: 'KEY_NOT_FOUND' }]
          };
        }

        // Check permissions
        const permissions = await ApiKeyPermissionService.canManageApiKeys(apiKey.application, user);
        if (!permissions.canDelete) {
          return {
            success: false,
            errors: [{ message: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' }]
          };
        }

        // Revoke key
        await ApiKey.findByIdAndUpdate(id, {
          isActive: false,
          revokedAt: new Date(),
          revokedBy: user.id
        });

        // Log audit event
        await AuditService.log({
          action: 'API_KEY_REVOKED',
          entityType: 'ApiKey',
          entityId: id,
          userId: user.id
        });

        return { success: true };

      } catch (error) {
        console.error('Revoke API key error:', error);
        return {
          success: false,
          errors: [{ message: error.message, code: 'REVOCATION_FAILED' }]
        };
      }
    }
  },

  // Field resolvers
  ApiKey: {
    key: () => null, // Never return actual key after creation
    application: async (apiKey) => {
      return await Application.findById(apiKey.applicationId);
    },
    createdBy: async (apiKey) => {
      return await User.findById(apiKey.createdBy);
    }
  }
};
```

---

## 🔒 **Security Features**

### **1. Key Storage Security**
- **Never store plaintext keys**: Only bcrypt hashes stored in database
- **One-time display**: API keys shown only once during creation
- **Secure generation**: Cryptographically secure random generation
- **Key rotation**: Support for key rotation without service interruption

### **2. Access Control**
- **Role-based permissions**: OWNER/ADMIN can manage, MEMBER can view own
- **Application-scoped**: Keys tied to specific applications
- **Granular permissions**: READ, WRITE, DELETE, ADMIN levels
- **Scope restrictions**: Optional scope limitations for keys

### **3. Audit & Monitoring**
- **Complete audit trail**: All key operations logged
- **Usage tracking**: Last used time and usage count
- **Rate limiting**: Configurable rate limits per key
- **Anomaly detection**: Unusual usage pattern alerts

---

## 📊 **Rate Limiting**

```javascript
// services/rateLimitService.js
class RateLimitService {
  
  static async checkRateLimit(apiKeyId, action = 'API_CALL') {
    const key = `rate_limit:${apiKeyId}:${action}`;
    const window = 3600; // 1 hour
    const limit = 1000; // 1000 calls per hour
    
    const current = await Redis.incr(key);
    if (current === 1) {
      await Redis.expire(key, window);
    }
    
    if (current > limit) {
      throw new Error('Rate limit exceeded');
    }
    
    return {
      current,
      limit,
      remaining: limit - current,
      resetTime: await Redis.ttl(key)
    };
  }
}
```

---

## 🧪 **Testing Strategy**

### **Test Categories**

1. **Unit Tests** (`tests/api-keys/unit/`)
   - Key generation algorithms
   - Permission validation logic
   - Hashing and security functions

2. **Integration Tests** (`tests/api-keys/integration/`)
   - GraphQL resolver functionality
   - Database operations
   - Authentication flows

3. **Security Tests** (`tests/api-keys/security/`)
   - Permission bypass attempts
   - Rate limiting validation
   - Key enumeration protection

### **Test Files Organization**
```
backend/tests/api-keys/
├── unit/
│   ├── test-key-generation.js
│   ├── test-permission-validation.js
│   └── test-security-functions.js
├── integration/
│   ├── test-generate-api-key.js
│   ├── test-revoke-api-key.js
│   └── test-validate-api-key.js
└── security/
    ├── test-permission-bypass.js
    ├── test-rate-limiting.js
    └── test-key-enumeration.js
```

---

## 🚀 **Deployment Considerations**

### **Environment Variables**
```bash
# Required environment variables
API_KEY_SALT_ROUNDS=12
API_KEY_RATE_LIMIT_PER_HOUR=1000
API_KEY_DEFAULT_EXPIRY_DAYS=365
API_KEY_MAX_KEYS_PER_APP=50

# Optional security enhancements
API_KEY_REQUIRE_2FA=true
API_KEY_IP_WHITELIST_ENABLED=false
API_KEY_AUDIT_WEBHOOK_URL=
```

### **Database Indexes**
Ensure these indexes exist for optimal performance:
```javascript
// Performance-critical indexes
db.apikeys.createIndex({ "keyHash": 1 }, { unique: true });
db.apikeys.createIndex({ "applicationId": 1, "isActive": 1 });
db.apikeys.createIndex({ "expiresAt": 1 });
db.apikeys.createIndex({ "createdBy": 1 });

// Compound indexes for common queries
db.apikeys.createIndex({ "applicationId": 1, "isActive": 1, "expiresAt": 1 });
```

---

## 📈 **Monitoring & Analytics**

### **Key Metrics to Track**
- API key generation rate
- Key usage patterns
- Permission distribution
- Expiration and renewal rates
- Security incidents (failed validations)

### **Alerts to Configure**
- Unusual key generation spikes
- High rate limit violations
- Expired key usage attempts
- Permission escalation attempts

---

## 🔄 **Migration & Upgrades**

### **Schema Migrations**
Document any schema changes and provide migration scripts:

```javascript
// Example migration for adding scopes
const migrationV2 = {
  version: '2.0.0',
  description: 'Add scopes field to API keys',
  up: async () => {
    await ApiKey.updateMany(
      { scopes: { $exists: false } },
      { $set: { scopes: [] } }
    );
  },
  down: async () => {
    await ApiKey.updateMany(
      {},
      { $unset: { scopes: 1 } }
    );
  }
};
```

---

## 🔗 **Related Documentation**

- [Frontend API Key Management](../../frontend/docs/features/API_KEY_MANAGEMENT.md)
- [Authentication System](./AUTHENTICATION_SYSTEM.md)
- [Audit Logging](./AUDIT_LOGGING.md)
- [Rate Limiting](./RATE_LIMITING.md)
- [Multi-Tenant Architecture](../architecture/MULTI_TENANT_DESIGN.md)

---

*Last updated: [Current Date]*  
*Next review: [Review Date]* 