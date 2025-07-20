# 🔍 Three-Tier Audit System Implementation Plan

## 📋 Overview

This document outlines the implementation plan for transitioning from the current basic audit system to a comprehensive three-tier audit architecture that separates:

1. **Platform Tier**: Internal operations by your team
2. **Customer Tier**: Organization-level operations by customers
3. **Application Tier**: End-user authentication events in customer apps

## 🏗️ **Implementation Status**

### ✅ **Phase 1: Enhanced Data Model (COMPLETED)**

**What's Done:**

- ✅ Enhanced `AuditLog` model with tier separation
- ✅ Added hierarchical identifiers (`customerId`, `applicationId`)
- ✅ Structured event categorization and actor types
- ✅ Database indexes for efficient tier-based querying
- ✅ Updated audit utilities with tier-specific methods
- ✅ Backward compatibility for existing code

**Key Features Added:**

```javascript
// New audit log structure
{
  logTier: 'PLATFORM' | 'CUSTOMER' | 'APPLICATION',
  customerId: ObjectId, // Organization ID
  applicationId: ObjectId, // App ID
  eventType: String, // Specific event
  eventCategory: 'AUTH' | 'ADMIN' | 'SECURITY' | ...,
  performedBy: ObjectId, // User ID
  actorType: 'PLATFORM_ADMIN' | 'CUSTOMER_ADMIN' | 'END_USER',
  // ... enhanced metadata
}
```

**New Audit Methods:**

```javascript
// Tier-specific logging
await auditPlatformLog("CUSTOMER_UPGRADED", adminId, { plan: "Enterprise" });
await auditCustomerLog("APP_CREATED", orgId, userId, { appName: "MyApp" });
await auditApplicationLog("USER_LOGIN", orgId, appId, userId, {
  method: "google",
});
```

---

## 🚀 **Phase 2: Backend Integration (NEXT - Week 1-2)**

### **2.1 Update GraphQL Schema**

**File:** `backend/src/graphql/schema/audit.schema.js`

```javascript
// Add tier-aware audit schema
const auditSchema = gql`
  extend type Query {
    # Tier-specific queries
    platformAuditLogs(
      limit: Int
      offset: Int
      filter: PlatformAuditFilter
    ): AuditLogConnection!
    customerAuditLogs(
      customerId: ID!
      limit: Int
      offset: Int
      filter: CustomerAuditFilter
    ): AuditLogConnection!
    applicationAuditLogs(
      appId: ID!
      limit: Int
      offset: Int
      filter: AppAuditFilter
    ): AuditLogConnection!

    # Tier-specific statistics
    platformAuditStats(filter: PlatformStatsFilter): PlatformAuditStats!
    customerAuditStats(
      customerId: ID!
      filter: CustomerStatsFilter
    ): CustomerAuditStats!
    appAuditStats(appId: ID!, filter: AppStatsFilter): AppAuditStats!
  }

  type AuditLog {
    id: ID!
    logTier: AuditTier!
    eventType: String!
    eventCategory: EventCategory!
    performedBy: User
    actorType: ActorType!
    customerId: ID
    customer: Organization
    applicationId: ID
    application: App
    metadata: JSON!
    ipAddress: String
    userAgent: String
    success: Boolean!
    timestamp: DateTime!
  }

  enum AuditTier {
    PLATFORM
    CUSTOMER
    APPLICATION
  }

  enum EventCategory {
    AUTH
    ADMIN
    SECURITY
    API
    SYSTEM
    USER_MANAGEMENT
    APP_MANAGEMENT
  }

  enum ActorType {
    PLATFORM_ADMIN
    CUSTOMER_ADMIN
    CUSTOMER_MEMBER
    END_USER
    SYSTEM
  }
`;
```

### **2.2 Update Resolvers with Access Controls**

**File:** `backend/src/graphql/resolvers/audit.resolvers.js`

```javascript
const auditResolvers = {
  Query: {
    // Platform admins only
    async platformAuditLogs(parent, args, context) {
      const { user } = context;
      if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
        throw new ForbiddenError("Platform access required");
      }
      return await getPlatformAuditLogs(args);
    },

    // Customer admins + organization members
    async customerAuditLogs(parent, { customerId, ...args }, context) {
      const { user } = context;
      await verifyCustomerAccess(user, customerId);
      return await getCustomerAuditLogs(customerId, args);
    },

    // App members + organization members
    async applicationAuditLogs(parent, { appId, ...args }, context) {
      const { user } = context;
      await verifyAppAccess(user, appId);
      return await getAppAuditLogs(appId, args);
    },
  },
};
```

### **2.3 Integrate Audit Logging into Existing Operations**

**Update these files to use new audit methods:**

1. **Organization Operations** (`backend/src/services/organization.service.js`):

```javascript
// Replace existing audit calls
await auditCustomerLog("ORGANIZATION_CREATED", orgId, userId, {
  category: "ADMIN",
  orgType: data.type,
});
```

2. **App Operations** (`backend/src/services/app.service.js`):

```javascript
await auditCustomerLog("APP_CREATED", orgId, userId, {
  category: "APP_MANAGEMENT",
  appName: data.name,
  appType: data.type,
});
```

3. **Authentication Operations** (`backend/src/services/auth.service.js`):

```javascript
await auditApplicationLog("USER_LOGIN", orgId, appId, userId, {
  category: "AUTH",
  method: "password",
  success: true,
  sessionId: session.id,
});
```

---

## 🖥️ **Phase 3: Frontend Dashboard Updates (Week 3-4)**

### **3.1 Create Audit Components**

**New Files to Create:**

1. **`frontend/components/audit/AuditLogViewer.tsx`**
2. **`frontend/components/audit/TierSelector.tsx`**
3. **`frontend/components/audit/AuditStatsCards.tsx`**
4. **`frontend/components/audit/AuditFilters.tsx`**

### **3.2 Add Audit Pages to Dashboard**

**Organization Audit Page:** `frontend/app/(admin)/dashboard/[orgId]/audit/page.tsx`

```tsx
export default function OrganizationAuditPage() {
  return (
    <div className="space-y-6">
      <TierSelector
        availableTiers={["CUSTOMER", "APPLICATION"]}
        onTierChange={setSelectedTier}
      />
      <AuditLogViewer tier={selectedTier} organizationId={orgId} />
    </div>
  );
}
```

**Application Audit Page:** `frontend/app/(admin)/dashboard/[orgId]/app/[appId]/audit/page.tsx`

```tsx
export default function ApplicationAuditPage() {
  return (
    <div className="space-y-6">
      <AuditStatsCards appId={appId} />
      <AuditLogViewer tier="APPLICATION" applicationId={appId} />
    </div>
  );
}
```

### **3.3 Update Navigation**

Add audit links to:

- Organization sidebar navigation
- Application detail pages
- Dashboard overview cards

---

## 📡 **Phase 4: SDK Integration (Week 5-6)**

### **4.1 Create SDK Audit API Endpoint**

**File:** `backend/src/routes/sdk/audit.js`

```javascript
// Public endpoint for SDKs to report auth events
router.post("/audit", authenticateSDK, async (req, res) => {
  const { appId, customerId } = req.sdk; // From SDK authentication
  const { eventType, userId, metadata } = req.body;

  await auditApplicationLog(eventType, customerId, appId, userId, {
    ...metadata,
    category: "AUTH",
    actorType: "END_USER",
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.json({ success: true });
});
```

### **4.2 Update SDKs to Report Events**

**React SDK Integration:**

```javascript
// In your React/Next.js SDK
class AuthSDK {
  async login(email, password) {
    try {
      const result = await this.apiCall('/auth/login', { email, password });

      // Report successful login to audit system
      await this.reportAuditEvent('USER_LOGIN', result.user.id, {
        method: 'password',
        success: true
      });

      return result;
    } catch (error) {
      // Report failed login attempt
      await this.reportAuditEvent('USER_LOGIN_FAILED', null, {
        method: 'password',
        success: false,
        error: error.message,
        attemptedEmail: email
      });

      throw error;
    }
  }

  private async reportAuditEvent(eventType, userId, metadata) {
    try {
      await fetch(`${this.apiUrl}/sdk/audit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType,
          userId,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            sdkVersion: this.version
          }
        })
      });
    } catch (error) {
      console.warn('Failed to report audit event:', error);
      // Don't throw - audit logging shouldn't break user flow
    }
  }
}
```

---

## 🎯 **Phase 4.5: Advanced Features (Week 7-8)**

### **4.1 Real-time Audit Streaming**

```javascript
// WebSocket endpoint for real-time audit logs
const auditSocket = io("/audit");

auditSocket.on("new-audit-log", (log) => {
  if (log.customerId === currentOrgId) {
    updateAuditDashboard(log);
  }
});
```

### **4.2 Audit Export Functionality**

```javascript
// Export audit logs in different formats
const exportAuditLogs = async (filters, format = "CSV") => {
  const response = await fetch("/api/audit/export", {
    method: "POST",
    body: JSON.stringify({ filters, format }),
  });

  const blob = await response.blob();
  downloadFile(blob, `audit-logs-${Date.now()}.${format.toLowerCase()}`);
};
```

### **4.3 Compliance Reporting**

```javascript
// Generate compliance reports
const generateComplianceReport = async (orgId, timeframe) => {
  return await fetch(`/api/audit/compliance-report`, {
    method: "POST",
    body: JSON.stringify({ orgId, timeframe }),
  });
};
```

---

## 🗄️ **Database Migration Strategy**

### **Migration Script** (`backend/src/scripts/migrate-audit-logs.js`)

```javascript
// Migrate existing audit logs to new format
const migrateAuditLogs = async () => {
  console.log("🔄 Starting audit log migration...");

  const oldLogs = await AuditLog.find({ logTier: { $exists: false } });

  for (const log of oldLogs) {
    // Determine tier based on existing metadata
    let logTier = "APPLICATION";
    let customerId = null;
    let applicationId = null;

    if (log.metadata?.orgId) {
      customerId = log.metadata.orgId;
      logTier = log.metadata.appId ? "APPLICATION" : "CUSTOMER";
      applicationId = log.metadata.appId;
    }

    await AuditLog.updateOne(
      { _id: log._id },
      {
        $set: {
          logTier,
          customerId,
          applicationId,
          eventType: log.action,
          eventCategory: determineCategory(log.action),
          performedBy: log.userId,
          actorType: "END_USER",
        },
      }
    );
  }

  console.log(`✅ Migrated ${oldLogs.length} audit logs`);
};
```

---

## 🔐 **Access Control Matrix**

| User Role       | Platform Logs | Customer Logs | Application Logs |
| --------------- | ------------- | ------------- | ---------------- |
| Platform Admin  | ✅ All        | ✅ All        | ✅ All           |
| Customer Admin  | ❌ None       | ✅ Own Org    | ✅ Own Org Apps  |
| Customer Member | ❌ None       | ✅ Limited    | ✅ Assigned Apps |
| End User        | ❌ None       | ❌ None       | ❌ None          |

---

## 📊 **Success Metrics**

1. **Data Separation**: 100% of logs properly categorized by tier
2. **Performance**: Audit queries under 200ms with proper indexing
3. **Security**: Zero unauthorized access to cross-tier data
4. **Adoption**: Customer dashboard shows audit activity within 1 week
5. **SDK Integration**: Real-time auth events from customer applications

---

## 🔄 **Migration Timeline**

| Week | Phase               | Deliverables                               |
| ---- | ------------------- | ------------------------------------------ |
| 1-2  | Backend Integration | GraphQL schema, resolvers, access controls |
| 3-4  | Frontend Dashboard  | Audit components, organization/app pages   |
| 5-6  | SDK Integration     | API endpoints, SDK updates, testing        |
| 7-8  | Advanced Features   | Real-time streaming, exports, compliance   |

---

## 🚨 **Important Considerations**

1. **Backward Compatibility**: All existing audit log queries continue to work
2. **Performance**: New indexes added for tier-based querying
3. **Privacy**: Customer data isolated by organization boundaries
4. **Scaling**: Tier-specific retention policies for data management
5. **Testing**: Each phase requires thorough testing before proceeding

---

## 🎯 **Next Steps**

1. **Review Phase 1 Implementation** ✅ (Done)
2. **Start Phase 2**: Update GraphQL schema and resolvers
3. **Database Migration**: Run migration script on existing data
4. **Testing**: Verify tier separation works correctly
5. **Proceed to Phase 3**: Frontend dashboard updates

Would you like me to proceed with Phase 2 (Backend Integration) or would you prefer to review and test Phase 1 first?
