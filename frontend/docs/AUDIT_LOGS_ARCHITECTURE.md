# 🔍 Multi-Level Audit Logs Architecture

## 📋 Overview

This document explains how to architect audit logs for a multi-tenant authentication platform that provides SDKs to customers who integrate auth into their own applications.

## 🏗️ **Three-Tier Audit System**

### **Tier 1: Platform Audit Logs** (Your Internal Dashboard)

**Who sees it**: Your team, your platform administrators
**What it tracks**: Platform-level operations

```typescript
// Platform-level events
interface PlatformAuditLog {
  id: string;
  eventType: 'CUSTOMER_ONBOARDED' | 'BILLING_UPDATED' | 'FEATURE_ENABLED' | 'SUPPORT_ACCESS';
  customerId: string;
  performedBy: string; // Your team member
  timestamp: Date;
  metadata: {
    customerName: string;
    planType: string;
    billingAmount?: number;
    supportTicketId?: string;
  };
}

// Examples:
- Customer "AcmeCorp" upgraded to Enterprise plan
- Support engineer accessed AcmeCorp's audit logs
- Platform maintenance performed on AcmeCorp's tenant
- Billing invoice generated for AcmeCorp
- Feature flag enabled for AcmeCorp
```

### **Tier 2: Customer Audit Logs** (Customer's Dashboard)

**Who sees it**: Your customers (companies using your SDK)
**What it tracks**: Customer organization operations

```typescript
// Customer organization-level events
interface CustomerAuditLog {
  id: string;
  customerId: string; // AcmeCorp
  eventType: 'APP_CREATED' | 'TEAM_MEMBER_INVITED' | 'API_KEY_GENERATED' | 'SSO_CONFIGURED';
  performedBy: string; // Customer's team member
  timestamp: Date;
  metadata: {
    appId?: string;
    appName?: string;
    invitedEmail?: string;
    apiKeyName?: string;
    ssoProvider?: string;
  };
}

// Examples (AcmeCorp's dashboard shows):
- John (AcmeCorp admin) created "Social Media App"
- Sarah (AcmeCorp admin) invited new team member
- AcmeCorp generated API key for production
- AcmeCorp configured Google SSO
```

### **Tier 3: Application Audit Logs** (End-User Auth Events)

**Who sees it**: Your customers viewing their app's auth activity
**What it tracks**: End-user authentication events in customer's applications

```typescript
// Application-level events (what your SDK tracks)
interface ApplicationAuditLog {
  id: string;
  customerId: string; // AcmeCorp
  applicationId: string; // Social Media App
  eventType: 'USER_LOGIN' | 'USER_SIGNUP' | 'PASSWORD_RESET' | 'MFA_ENABLED';
  userId?: string; // End user of the social media app
  timestamp: Date;
  metadata: {
    ipAddress: string;
    userAgent: string;
    loginMethod: 'password' | 'google' | 'facebook';
    success: boolean;
    failureReason?: string;
    location?: string;
  };
}

// Examples (AcmeCorp's "Social Media App" logs show):
- User "jane@example.com" logged in via Google OAuth
- User "bob@example.com" failed login attempt (wrong password)
- User "alice@example.com" reset password successfully
- User "mike@example.com" enabled 2FA
```

## 🎛️ **Dashboard Separation Strategy**

### **1. Your Platform Dashboard** (`yourplatform.com/admin`)

```typescript
// Internal operations dashboard
const PlatformDashboard = {
  sections: {
    customers: "Manage customer accounts",
    billing: "Revenue and subscription tracking",
    support: "Customer support operations",
    systemHealth: "Platform performance metrics",
    platformAudit: "Platform-level audit logs",
  },

  auditLogFilters: {
    byCustomer: "Filter by customer organization",
    byEventType: "Platform events only",
    byTeamMember: "Actions by your team",
    byTimeRange: "Last 30 days, 90 days, etc.",
  },
};
```

### **2. Customer Dashboard** (`yourplatform.com/dashboard/[customerId]`)

```typescript
// Customer's organizational dashboard
const CustomerDashboard = {
  sections: {
    applications: "Customer's apps using your auth",
    teamMembers: "Customer's team management",
    apiKeys: "Customer's API keys",
    analytics: "Customer's auth usage analytics",
    organizationAudit: "Customer's org-level audit logs",
  },

  auditLogFilters: {
    byApplication: "Filter by specific app",
    byTeamMember: "Actions by customer's team",
    byEventType: "Org-level events only",
    byTimeRange: "Customer-defined ranges",
  },
};
```

### **3. Application Analytics Dashboard** (`yourplatform.com/dashboard/[customerId]/apps/[appId]`)

```typescript
// Individual application's auth analytics
const ApplicationDashboard = {
  sections: {
    userActivity: "Login/signup trends",
    securityEvents: "Failed logins, suspicious activity",
    authMethods: "Social vs password usage",
    userJourney: "Registration to activation flow",
    applicationAudit: "End-user auth events",
  },

  auditLogFilters: {
    byUser: "Filter by specific end user",
    byAuthMethod: "Google, Facebook, password, etc.",
    byEventType: "Login, signup, password reset, etc.",
    bySuccess: "Successful vs failed attempts",
    byLocation: "Geographic filtering",
  },
};
```

## 🗄️ **Database Schema Design**

### **Unified Audit Log Table**

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,

  -- Tier identification
  log_tier ENUM('PLATFORM', 'CUSTOMER', 'APPLICATION') NOT NULL,

  -- Hierarchical identifiers
  customer_id UUID NULL, -- NULL for platform-tier logs
  application_id UUID NULL, -- NULL for platform/customer-tier logs

  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_category ENUM('AUTH', 'ADMIN', 'SECURITY', 'API', 'SYSTEM') NOT NULL,

  -- Actor information
  performed_by UUID NULL, -- User who performed the action
  actor_type ENUM('PLATFORM_ADMIN', 'CUSTOMER_ADMIN', 'END_USER') NOT NULL,

  -- Event data
  metadata JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for efficient querying
  INDEX idx_customer_tier (customer_id, log_tier, timestamp),
  INDEX idx_application_tier (application_id, log_tier, timestamp),
  INDEX idx_event_type (event_type, timestamp),
  INDEX idx_actor (performed_by, actor_type, timestamp)
);
```

### **Query Examples**

```sql
-- Platform Dashboard: All platform operations
SELECT * FROM audit_logs
WHERE log_tier = 'PLATFORM'
ORDER BY timestamp DESC;

-- Customer Dashboard: AcmeCorp's organizational events
SELECT * FROM audit_logs
WHERE customer_id = 'acmecorp-uuid'
AND log_tier IN ('CUSTOMER', 'APPLICATION')
ORDER BY timestamp DESC;

-- Application Dashboard: Social Media App auth events
SELECT * FROM audit_logs
WHERE application_id = 'social-media-app-uuid'
AND log_tier = 'APPLICATION'
ORDER BY timestamp DESC;
```

## 🔐 **Access Control & Security**

### **Role-Based Access Matrix**

```typescript
const AuditAccessControl = {
  PLATFORM_ADMIN: {
    canView: ["PLATFORM", "CUSTOMER", "APPLICATION"],
    scope: "ALL_CUSTOMERS",
  },

  CUSTOMER_ADMIN: {
    canView: ["CUSTOMER", "APPLICATION"],
    scope: "OWN_ORGANIZATION_ONLY",
  },

  CUSTOMER_MEMBER: {
    canView: ["APPLICATION"],
    scope: "OWN_ORGANIZATION_APPS_ONLY",
  },

  END_USER: {
    canView: [],
    scope: "NONE", // End users don't see audit logs
  },
};
```

### **Data Isolation Strategy**

```typescript
// GraphQL resolver with proper access control
const auditLogsResolver = async (_, { filters }, { user }) => {
  if (user.role === "PLATFORM_ADMIN") {
    // Can see all logs
    return getAuditLogs(filters);
  }

  if (user.role === "CUSTOMER_ADMIN") {
    // Can only see their organization's logs
    return getAuditLogs({
      ...filters,
      customerId: user.customerId,
      logTier: ["CUSTOMER", "APPLICATION"],
    });
  }

  if (user.role === "CUSTOMER_MEMBER") {
    // Can only see application logs for their org
    return getAuditLogs({
      ...filters,
      customerId: user.customerId,
      logTier: ["APPLICATION"],
    });
  }

  throw new Error("Insufficient permissions");
};
```

## 📡 **SDK Integration Points**

### **How Your SDK Reports to Audit System**

```javascript
// In your React/Next.js/Angular SDK
class AuthSDK {
  constructor(apiKey, applicationId) {
    this.apiKey = apiKey;
    this.applicationId = applicationId;
  }

  async login(email, password) {
    try {
      const result = await this.apiCall('/auth/login', { email, password });

      // SDK automatically logs to APPLICATION tier
      await this.logEvent({
        eventType: 'USER_LOGIN',
        userId: result.user.id,
        metadata: {
          loginMethod: 'password',
          success: true,
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent
        }
      });

      return result;
    } catch (error) {
      // Log failed attempt
      await this.logEvent({
        eventType: 'USER_LOGIN',
        metadata: {
          loginMethod: 'password',
          success: false,
          failureReason: error.message,
          attemptedEmail: email
        }
      });

      throw error;
    }
  }

  private async logEvent(eventData) {
    // Send to your platform's audit API
    await fetch('https://yourplatform.com/api/audit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        logTier: 'APPLICATION',
        applicationId: this.applicationId,
        ...eventData
      })
    });
  }
}
```

## 🎨 **UI/UX Design Patterns**

### **Dashboard Navigation Structure**

```typescript
// Customer sees this navigation
const CustomerNavigation = {
  Organization: {
    Overview: "Org stats and recent activity",
    Team: "Member management",
    Settings: "Org configuration",
    Audit: "Organization-level audit logs", // CUSTOMER tier
  },

  Applications: [
    {
      name: "Social Media App",
      sections: {
        Analytics: "Auth usage metrics",
        Users: "End user management",
        Events: "Application audit logs", // APPLICATION tier
      },
    },
  ],
};

// You (platform) see this navigation
const PlatformNavigation = {
  Customers: "Customer management",
  Support: "Customer support tools",
  Analytics: "Platform-wide metrics",
  System: "Platform health",
  Audit: "Platform-level audit logs", // PLATFORM tier
};
```

## 🚀 **Implementation Phases**

### **Phase 1: Basic Separation** (Week 1-2)

1. Add `log_tier` column to existing audit table
2. Update audit logging to specify tier
3. Create basic filtering in existing dashboard

### **Phase 2: Customer Dashboard** (Week 3-4)

1. Build customer-specific audit views
2. Implement access controls
3. Add application-level filtering

### **Phase 3: SDK Integration** (Week 5-6)

1. Update SDKs to report application events
2. Build application analytics dashboard
3. Add real-time event streaming

### **Phase 4: Advanced Features** (Week 7-8)

1. Add audit log export functionality
2. Implement retention policies
3. Add compliance reporting

## 📊 **Example Customer Experience**

### **AcmeCorp's Perspective**

```
AcmeCorp Dashboard:
├── Organization Audit (CUSTOMER tier)
│   ├── "John created Social Media App"
│   ├── "Sarah invited new team member"
│   └── "Generated production API key"
│
└── Applications
    ├── Social Media App Events (APPLICATION tier)
    │   ├── "User jane@example.com logged in via Google"
    │   ├── "User bob@example.com failed login (wrong password)"
    │   └── "User alice@example.com enabled 2FA"
    │
    └── E-commerce App Events (APPLICATION tier)
        ├── "User mike@shop.com signed up via Facebook"
        └── "User sara@shop.com reset password"
```

### **Your Platform Perspective**

```
Platform Dashboard:
├── Platform Audit (PLATFORM tier)
│   ├── "AcmeCorp upgraded to Enterprise plan"
│   ├── "Support accessed AcmeCorp's logs"
│   └── "Feature flag enabled for AcmeCorp"
│
└── Customer Details
    └── AcmeCorp
        ├── Can view their CUSTOMER tier logs
        └── Can view their APPLICATION tier logs
```

## 🔄 **Data Flow Summary**

```
1. End User Action (in customer's app)
   ↓
2. Your SDK captures event
   ↓
3. SDK sends to your audit API
   ↓
4. Stored as APPLICATION tier log
   ↓
5. Customer sees in their app's dashboard

Meanwhile:

1. Customer Admin Action (in your dashboard)
   ↓
2. Your platform captures event
   ↓
3. Stored as CUSTOMER tier log
   ↓
4. Customer sees in org audit section

And:

1. Your Team Action (platform operations)
   ↓
2. Your platform captures event
   ↓
3. Stored as PLATFORM tier log
   ↓
4. Only your team sees in platform dashboard
```

This architecture gives you clean separation while maintaining the flexibility to provide comprehensive audit trails to your customers without exposing your internal operations.
