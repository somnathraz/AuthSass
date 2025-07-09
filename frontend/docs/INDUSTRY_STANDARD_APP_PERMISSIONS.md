# Industry Standard Application Permissions Model

## Overview
This document outlines the multi-tenant application permission model that follows industry best practices for SaaS platforms. Our implementation provides granular access control while maintaining usability and security.

## 🚨 **CRITICAL SECURITY UPDATE: Application Creation Restrictions**

### **Industry Standard: Only Organization Admins Can Create Applications**

Following enterprise SaaS security best practices, we have implemented the industry-standard restriction that **only organization administrators can create applications**.

#### **Why This Matters:**
- **Security Governance**: Prevents unauthorized application sprawl
- **Resource Control**: Maintains oversight of organizational resources
- **Compliance**: Meets enterprise audit and regulatory requirements
- **Cost Management**: Prevents uncontrolled resource creation
- **Data Governance**: Ensures proper data classification and handling

#### **Permission Matrix for Application Creation:**
| Role | Can Create Apps | Rationale |
|------|----------------|-----------|
| **System Admin** | ✅ | Platform-level administrative access |
| **Organization Super Admin** | ✅ | Full organizational control |
| **Organization Admin** | ✅ | Administrative privileges within organization |
| **Organization Member** | ❌ | **RESTRICTED** - Read/use access only |
| **Organization Guest** | ❌ | Limited scoped access only |

#### **Industry References:**
- **NIST RBAC Model**: Principle of least privilege
- **Enterprise SaaS Standards**: Administrative control over resource creation
- **SOC 2 Compliance**: Segregation of duties and access controls
- **GDPR/Privacy**: Data governance and classification requirements

## Permission Hierarchy

### 1. **System Level (Platform Admin)**
- **SUPER_ADMIN**: Full platform access, can manage any organization/application
- **ADMIN**: Platform administrative access, can view and manage most resources

### 2. **Organization Level**
- **SUPER_ADMIN**: Full organization control (create/delete org, manage all apps)
- **ADMIN**: Organization administrative access (manage org apps, invite members)
- **MEMBER**: Standard organization membership (create apps, manage own apps)
- **GUEST**: Limited access (specific app access only)

### 3. **Application Level**
- **OWNER**: Full application control (only one per app, can transfer ownership)
- **ADMIN**: Application administrative access (manage members, settings, API keys)
- **MEMBER**: Standard application access (view, edit, generate API keys)
- **VIEWER**: Read-only access (view only, no modifications)

## Access Resolution Algorithm

### Priority Order (Highest to Lowest):
1. **Direct App Membership** - Explicit app role assignment
2. **App Ownership** - User is the application owner
3. **Organization Membership** - Inherited from organization role
4. **System Admin** - Platform-level administrative access

### Implementation Logic:
```typescript
function resolveUserAppRole(user, app) {
  // 1. Check direct app membership
  const appMembership = getAppMembership(user.id, app.id);
  if (appMembership && appMembership.status === 'ACTIVE') {
    return appMembership.role;
  }
  
  // 2. Check app ownership
  if (app.owner.id === user.id) {
    return 'OWNER';
  }
  
  // 3. Check organization membership
  const orgMembership = getOrgMembership(user.id, app.organizationId);
  if (orgMembership && orgMembership.status === 'ACTIVE') {
    if (['SUPER_ADMIN', 'ADMIN'].includes(orgMembership.role)) {
      return 'ADMIN';
    }
    if (orgMembership.role === 'MEMBER') {
      return 'MEMBER';
    }
  }
  
  // 4. Check system admin
  if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return 'ADMIN';
  }
  
  return null; // No access
}
```

## Action Permissions Matrix

| Action | Owner | App Admin | App Member | App Viewer | Org Admin | Org Member | System Admin |
|--------|-------|-----------|------------|------------|-----------|------------|--------------|
| **Create Application** | N/A | N/A | N/A | N/A | ✅ | ❌ | ✅ |
| **View Details** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit Application** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Manage Members** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Manage API Keys** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Activate/Deactivate** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Archive/Unarchive** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Delete Application** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Transfer Ownership** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## Use Cases & Scenarios

### **Scenario 1: Organization Member Creates App**
- User has MEMBER role in organization
- Creates application → Automatically becomes OWNER of the app
- Other organization members get MEMBER access to the app via organization membership
- Organization admins get ADMIN access to the app

### **Scenario 2: Invite External User to Specific App**
- External user receives app invitation
- Gets added to organization as GUEST with scoped app access
- Direct app membership created with specified role (MEMBER/VIEWER)
- No access to other organization applications

### **Scenario 3: Organization Admin Management**
- Organization admin can manage ALL organization applications
- Inherits ADMIN role on all org apps (even if not explicitly added)
- Can add/remove members from any org application
- Cannot delete applications (only owners can delete)

### **Scenario 4: Application Ownership Transfer**
- Only current owner or system admin can transfer ownership
- Transfer changes app ownership and creates new OWNER membership
- Previous owner retains access based on organization membership
- All other permissions remain unchanged

## Security Best Practices

### **1. Principle of Least Privilege**
- Users get minimal necessary permissions
- Explicit role assignments override inherited permissions
- Regular permission audits and cleanup

### **2. Organizational Isolation**
- Cross-organization access requires explicit permissions
- Organization-level roles don't grant access to other organizations
- Guest users have scoped access only

### **3. Audit Trail**
- All permission changes logged
- Member additions/removals tracked
- Ownership transfers recorded with timestamps

### **4. Permission Validation**
- Frontend and backend permission validation
- API endpoint protection with role verification
- GraphQL resolver-level access control

## Frontend Implementation

### **Permission Hooks**
```typescript
// Core permission checks
const canManage = useCanManageApp(app);
const isAppAdmin = useIsAppAdmin(app);
const canGenerateApiKeys = useCanGenerateApiKeys(app);
const canPerformDestructiveActions = useCanPerformDestructiveActions(app);
const canInviteMembers = useCanInviteMembers(app);
const canTransferOwnership = useCanTransferOwnership(app);

// Usage in components
{canManage && (
  <DropdownMenuItem onClick={() => onEditApp(app)}>
    Edit Application
  </DropdownMenuItem>
)}

{canPerformDestructiveActions && (
  <DropdownMenuItem onClick={() => onDeleteApp(app.id, app.name)}>
    Delete Application
  </DropdownMenuItem>
)}
```

### **Action Visibility Rules**
- **Always Show**: View Details, Visit Website, View Repository
- **Basic Management**: Edit, Manage Members, Manage API Keys (requires canManage)
- **Administrative**: Activate/Deactivate, Archive/Unarchive (requires isAppAdmin)
- **Destructive**: Delete Application (requires canPerformDestructiveActions)
- **Ownership**: Transfer Ownership (requires canTransferOwnership)

## Backend Implementation

### **GraphQL Resolver Protection**
```javascript
// App mutation with permission check
async updateApp(parent, { id, input }, context) {
  const { user } = context;
  if (!user) throw new AuthenticationError('Not authenticated');
  
  const app = await App.findById(id);
  const userRole = await resolveUserAppRole(user, app);
  
  if (!['OWNER', 'ADMIN', 'MEMBER'].includes(userRole)) {
    throw new ForbiddenError('Insufficient permissions');
  }
  
  // Continue with update...
}
```

### **Permission Service**
```javascript
class PermissionService {
  static async hasAppAccess(userId, appId, requiredRoles = []) {
    // Implementation with caching and comprehensive checks
  }
  
  static async hasOrgAccess(userId, orgId, requiredRoles = []) {
    // Organization-level permission validation
  }
}
```

## Migration Strategy

### **Phase 1: Core Permission Model** ✅
- Fix userRole resolver in GraphQL
- Implement organization-level access inheritance
- Update frontend permission logic

### **Phase 2: Enhanced UI Controls** 🔄
- Granular action visibility based on roles
- Permission-aware component rendering
- Improved error handling for permission denials

### **Phase 3: Advanced Features** 🔮
- Permission delegation (sub-admin roles)
- Time-limited access grants
- Permission templates for common scenarios

## Testing Strategy

### **Backend Testing**
- Unit tests for permission resolution logic
- Integration tests for GraphQL resolver access control
- End-to-end tests for complex permission scenarios

### **Frontend Testing**
- Component tests with different permission states
- User journey tests for role-based workflows
- Accessibility tests for permission-aware UI

## Compliance & Audit

### **SOC 2 Compliance**
- Comprehensive access logging
- Regular permission reviews
- Principle of least privilege enforcement

### **GDPR Compliance**
- Data access controls based on legitimate interest
- User consent for cross-organizational access
- Right to access personal data and permissions

## Common Issues & Solutions

### **Issue**: User sees "null" role in dashboard
**Solution**: Fixed userRole GraphQL resolver to use correct MongoDB field

### **Issue**: Organization members can't see org applications
**Solution**: Implemented organization-level access inheritance

### **Issue**: Too restrictive permissions preventing legitimate access
**Solution**: Added multiple permission check layers with fallbacks

### **Issue**: Performance problems with permission checks
**Solution**: Implemented caching and optimized database queries

---

*This permission model balances security, usability, and industry best practices for multi-tenant SaaS applications.* 