# 🔄 **FRONTEND-BACKEND RESOLVER MIGRATION PLAN**

*Systematic Implementation of All Working Backend Resolvers*

---

## 📊 **CURRENT STATE ANALYSIS**

### **✅ Currently Working in Frontend**
Based on analysis of existing code:

#### **Authentication Flow (Partially Working)**
- ✅ `LOGIN_MUTATION` - Uses correct backend resolver
- ✅ `SIGNUP_MUTATION` - Uses correct backend resolver  
- ✅ `SOCIAL_LOGIN_MUTATION` - Uses correct backend resolver
- ⚠️ `CHANGE_PASSWORD` - Uses correct backend resolver
- ⚠️ `REQUEST_PASSWORD_RESET` - Uses correct backend resolver
- ⚠️ `RESET_PASSWORD_MUTATION` - Uses correct backend resolver

#### **Organization Management (Mixed)**
- ✅ `CREATE_ORGANIZATION` - Uses correct backend resolver
- ❌ `GET_ORG_MEMBERS` - Uses deprecated `orgMembers` query
- ⚠️ Organization member mutations need verification

#### **App Management (Mixed)**
- ✅ `CREATE_APP` - Uses correct backend resolver
- ❌ `GET_MY_APPS` - Uses deprecated `myApps` query
- ⚠️ App member management needs verification

#### **Invitation System (Mixed)**
- ⚠️ Invitation queries and mutations need verification

---

## 🎯 **MIGRATION STRATEGY**

### **Phase 1: Authentication System (Priority 1)**
Ensure all auth flows work with backend resolvers:

1. **Login & Signup** ✅ (Already working)
2. **Password Management** ⚠️ (Verify and fix)
3. **Email Verification** ❌ (Implement)
4. **Token Management** ❌ (Implement)

### **Phase 2: User Management (Priority 2)**
Implement user-related resolvers:

1. **User Profile** ⚠️ (Verify `me` query)
2. **User Stats** ❌ (Implement)
3. **User Search** ❌ (Implement)
4. **User CRUD** ❌ (Implement admin features)

### **Phase 3: Organization Management (Priority 3)**
Fix and implement organization features:

1. **Organization CRUD** ⚠️ (Verify existing)
2. **Member Management** ❌ (Fix deprecated queries)
3. **Organization Switching** ❌ (Implement)
4. **Organization Stats** ❌ (Implement)

### **Phase 4: Application Management (Priority 4)**
Fix and implement app features:

1. **App CRUD** ⚠️ (Verify existing)
2. **App Member Management** ❌ (Fix deprecated queries)
3. **API Key Management** ❌ (Implement)
4. **App Stats** ❌ (Implement)

### **Phase 5: Invitation System (Priority 5)**
Implement complete invitation flow:

1. **Create Invitations** ⚠️ (Verify existing)
2. **Accept/Decline** ⚠️ (Verify existing)
3. **Invitation Management** ❌ (Implement)
4. **Email Integration** ❌ (Verify)

---

## 🔧 **DETAILED IMPLEMENTATION PLAN**

### **PHASE 1: AUTHENTICATION SYSTEM**

#### **1.1 Login & Signup (✅ Working)**
Current implementation is correct, no changes needed.

#### **1.2 Password Management**
**Current Issues:**
- Frontend uses correct resolvers but may have parameter issues

**Required Updates:**
```typescript
// ✅ CORRECT - Already implemented
export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
      errors { field message }
    }
  }
`;

// ✅ CORRECT - Already implemented  
export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($input: PasswordResetRequestInput!) {
    requestPasswordReset(input: $input) {
      success
      message
      errors { field message }
    }
  }
`;
```

#### **1.3 Email Verification (❌ Missing)**
**Need to Add:**
```typescript
export const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      success
      message
      errors { field message }
    }
  }
`;

export const RESEND_VERIFICATION_EMAIL_MUTATION = gql`
  mutation ResendVerificationEmail {
    resendVerificationEmail {
      success
      message
      errors { field message }
    }
  }
`;
```

#### **1.4 Token Management (❌ Missing)**
**Need to Add:**
```typescript
export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String) {
    refreshToken(refreshToken: $refreshToken) {
      success
      accessToken
      expiresIn
      errors { field message }
    }
  }
`;

export const REVOKE_ALL_TOKENS_MUTATION = gql`
  mutation RevokeAllTokens {
    revokeAllTokens {
      success
      message
      errors { field message }
    }
  }
`;

export const VALIDATE_TOKEN_QUERY = gql`
  query ValidateToken($token: String!) {
    validateToken(token: $token) {
      valid
      user { id username email }
      expiresAt
      error
    }
  }
`;
```

### **PHASE 2: USER MANAGEMENT**

#### **2.1 User Profile (⚠️ Verify)**
**Current Implementation:**
```typescript
// ✅ CORRECT - Already working
export const GET_ME = gql`
  query GetMe {
    me {
      ...UserWithOrgFields
    }
  }
`;
```

#### **2.2 User Stats (❌ Missing)**
**Need to Add:**
```typescript
export const GET_USER_STATS = gql`
  query GetUserStats {
    userStats {
      totalUsers
      activeUsers
      newUsersToday
      newUsersThisWeek
      newUsersThisMonth
      usersByRole { role count }
      usersByStatus { status count }
      usersByAccountType { accountType count }
    }
  }
`;
```

#### **2.3 User CRUD (❌ Missing)**
**Need to Add:**
```typescript
export const GET_USERS = gql`
  query GetUsers(
    $limit: Int = 10
    $offset: Int = 0
    $sortBy: String = "createdAt"
    $sortOrder: SortOrder = DESC
    $filter: UserFilterInput
  ) {
    users(
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
      filter: $filter
    ) {
      users { ...UserFields }
      total
      hasNextPage
      hasPreviousPage
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
    updateUser(id: $id, input: $input) {
      success
      user { ...UserFields }
      errors { field message }
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      deletedUserId
      errors { field message }
    }
  }
`;
```

### **PHASE 3: ORGANIZATION MANAGEMENT**

#### **3.1 Fix Deprecated Queries (❌ Critical)**
**Current Issue:**
```typescript
// ❌ DEPRECATED - Uses old resolver
export const GET_ORG_MEMBERS = gql`
  query GetOrgMembers($orgId: ID!) {
    orgMembers(orgId: $orgId) {
      owner { id username email }
      members { user { id username email } role }
    }
  }
`;
```

**Fix Required:**
```typescript
// ✅ CORRECT - Use working resolver
export const GET_ORGANIZATION_MEMBERS = gql`
  query GetOrganizationMembers($orgId: ID!) {
    organizationMembers(orgId: $orgId) {
      owner { id username email }
      members { user { id username email } role status }
      total
    }
  }
`;
```

#### **3.2 Organization Member Management (❌ Fix Required)**
**Need to Update:**
```typescript
export const ADD_ORGANIZATION_MEMBER_MUTATION = gql`
  mutation AddOrganizationMember($input: AddMemberInput!) {
    addOrganizationMember(input: $input) {
      success
      organization { id name }
      errors { field message }
    }
  }
`;

export const REMOVE_ORGANIZATION_MEMBER_MUTATION = gql`
  mutation RemoveOrganizationMember($input: RemoveMemberInput!) {
    removeOrganizationMember(input: $input) {
      success
      organization { id name }
      errors { field message }
    }
  }
`;

export const UPDATE_MEMBER_ROLE_MUTATION = gql`
  mutation UpdateMemberRole($input: UpdateMemberRoleInput!) {
    updateMemberRole(input: $input) {
      success
      organization { id name }
      errors { field message }
    }
  }
`;
```

### **PHASE 4: APPLICATION MANAGEMENT**

#### **4.1 Fix App Queries (❌ Critical)**
**Current Issue:**
```typescript
// ❌ DEPRECATED - Uses old resolver
export const GET_MY_APPS = gql`
  query GetMyApps {
    myApps {
      ...AppWithMembersFields
    }
  }
`;
```

**Fix Required:**
```typescript
// ✅ CORRECT - Use User.apps field resolver
export const GET_USER_APPS = gql`
  query GetUserApps($input: UserAppsInput) {
    me {
      apps(input: $input) {
        apps {
          id
          name
          description
          organization { id name }
          userRole
          accessType
          grantedAt
          permissions {
            canRead canWrite canDelete
            canInvite canManageSettings
          }
        }
        total
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;
```

#### **4.2 App Management (❌ Update Required)**
**Need to Update:**
```typescript
export const GET_APPS = gql`
  query GetApps(
    $limit: Int = 10
    $offset: Int = 0
    $sortBy: String = "createdAt"
    $sortOrder: SortOrder = DESC
    $filter: AppFilterInput
  ) {
    apps(
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
      filter: $filter
    ) {
      apps { ...AppFields }
      total
      hasNextPage
      hasPreviousPage
    }
  }
`;

export const UPDATE_APP_MUTATION = gql`
  mutation UpdateApp($id: ID!, $input: UpdateAppInput!) {
    updateApp(id: $id, input: $input) {
      success
      app { ...AppFields }
      errors { field message }
    }
  }
`;
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Authentication ✅**
- [ ] Verify login/signup (should work)
- [ ] Test password reset flow
- [ ] Add email verification
- [ ] Add token management
- [ ] Add health check integration

### **Phase 2: User Management**
- [ ] Verify `me` query
- [ ] Add user stats query
- [ ] Add user search
- [ ] Add user CRUD (admin)
- [ ] Add user analytics

### **Phase 3: Organization Management**
- [ ] Fix `orgMembers` → `organizationMembers`
- [ ] Update member management mutations
- [ ] Add organization switching
- [ ] Add organization stats
- [ ] Test all organization flows

### **Phase 4: Application Management**
- [ ] Fix `myApps` → `User.apps`
- [ ] Update app management mutations
- [ ] Add API key management
- [ ] Add app stats
- [ ] Test all app flows

### **Phase 5: Invitation System**
- [ ] Verify invitation creation
- [ ] Test accept/decline flow
- [ ] Add invitation management
- [ ] Test email integration
- [ ] Add invitation analytics

---

## 🎯 **SUCCESS CRITERIA**

### **For Each Phase:**
1. ✅ All GraphQL operations use working backend resolvers
2. ✅ No deprecated resolver usage
3. ✅ Proper error handling
4. ✅ Type safety maintained
5. ✅ Existing UI flow preserved
6. ✅ Comprehensive testing

### **Overall Success:**
- **100% backend resolver coverage** in frontend
- **Zero deprecated resolver usage**
- **Maintained user experience**
- **Improved performance and reliability**
- **Complete feature parity**

---

## 📝 **NEXT STEPS**

1. **Start with Phase 1** - Authentication system verification
2. **Create updated GraphQL files** for each phase
3. **Update service hooks** to use new resolvers
4. **Test each phase thoroughly** before moving to next
5. **Update documentation** as we progress
6. **Create migration guide** for any breaking changes

**Let's begin with Phase 1: Authentication System! 🚀** 