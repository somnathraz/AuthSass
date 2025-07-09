# 🏢 **PHASE 3: ORGANIZATION MANAGEMENT SYSTEM**

*Comprehensive implementation of all working backend organization management resolvers*

---

## 📊 **PHASE 3 SCOPE**

### **✅ Working Backend Resolvers to Implement**

Based on our backend testing, these organization management resolvers are working and ready for frontend implementation:

#### **Organization Queries**
- ✅ `organizations` - Get all organizations with pagination, sorting, and filtering (Admin)
- ✅ `myOrganizations` - Current user's organizations
- ✅ `allOrganizations` - All organizations (Admin)
- ✅ `organizationMembers` - Organization members with roles
- ✅ `userOrgAccess` - User's organization access details

#### **Organization Mutations**
- ✅ `createOrganization` - Create new organization
- ✅ `updateOrganization` - Update organization details
- ✅ `deleteOrganization` - Delete organization (Owner/Admin)
- ✅ `addOrganizationMember` - Add member to organization
- ✅ `removeOrganizationMember` - Remove member from organization
- ✅ `updateMemberRole` - Update member role
- ✅ `switchOrganization` - Switch current organization context

#### **Organization Field Resolvers**
- ✅ `Organization.members` - Organization members list
- ✅ `Organization.userRole` - Current user's role in organization
- ✅ `User.organizations` - User's organizations (already implemented in Phase 2)

---

## 🎯 **IMPLEMENTATION STRATEGY**

### **Phase 3.1: Organization CRUD Operations**
1. **Organization List & Search** - Implement organizations query with filtering
2. **Organization Creation** - Create new organizations
3. **Organization Management** - Update and delete organizations

### **Phase 3.2: Organization Member Management**
1. **Member List** - Display organization members with roles
2. **Add/Remove Members** - Member management operations
3. **Role Management** - Update member roles and permissions

### **Phase 3.3: Organization Context & Switching**
1. **Organization Switching** - Switch between organizations
2. **Context Management** - Maintain current organization state
3. **Multi-tenant UI** - Organization-aware interface

---

## 🔧 **DETAILED IMPLEMENTATION PLAN**

### **1. Organization Management GraphQL Operations**

#### **Organization Queries**
```typescript
// Organization List with Advanced Filtering (Admin)
GET_ORGANIZATIONS = gql`
  query GetOrganizations(
    $limit: Int = 10
    $offset: Int = 0
    $sortBy: String = "createdAt"
    $sortOrder: SortOrder = DESC
    $filter: OrganizationFilter
  ) {
    organizations(
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
      filter: $filter
    ) {
      organizations {
        id
        name
        description
        type
        status
        imageUrl
        website
        owner {
          id
          username
          email
        }
        memberCount
        userRole
        createdAt
        updatedAt
      }
      total
      hasNextPage
      hasPreviousPage
    }
  }
`;

// Current User's Organizations
GET_MY_ORGANIZATIONS = gql`
  query GetMyOrganizations {
    myOrganizations {
      id
      name
      description
      type
      status
      imageUrl
      website
      owner {
        id
        username
        email
      }
      memberCount
      userRole
      createdAt
      updatedAt
    }
  }
`;

// Organization Members
GET_ORGANIZATION_MEMBERS = gql`
  query GetOrganizationMembers($orgId: ID!) {
    organizationMembers(orgId: $orgId) {
      owner {
        id
        username
        email
        profileImage
        firstName
        lastName
      }
      members {
        user {
          id
          username
          email
          profileImage
          firstName
          lastName
        }
        role
        status
        joinedAt
      }
      total
    }
  }
`;
```

#### **Organization Mutations**
```typescript
// Create Organization
CREATE_ORGANIZATION_MUTATION = gql`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      success
      organization {
        id
        name
        description
        type
        status
        imageUrl
        website
        owner {
          id
          username
          email
        }
        memberCount
        userRole
        createdAt
        updatedAt
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

// Update Organization
UPDATE_ORGANIZATION_MUTATION = gql`
  mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
    updateOrganization(id: $id, input: $input) {
      success
      organization {
        id
        name
        description
        type
        status
        imageUrl
        website
        owner {
          id
          username
          email
        }
        memberCount
        userRole
        createdAt
        updatedAt
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

// Delete Organization
DELETE_ORGANIZATION_MUTATION = gql`
  mutation DeleteOrganization($id: ID!) {
    deleteOrganization(id: $id) {
      success
      message
      errors {
        message
        code
        field
      }
    }
  }
`;

// Add Organization Member
ADD_ORGANIZATION_MEMBER_MUTATION = gql`
  mutation AddOrganizationMember($input: AddMemberInput!) {
    addOrganizationMember(input: $input) {
      success
      organization {
        id
        name
        memberCount
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

// Remove Organization Member
REMOVE_ORGANIZATION_MEMBER_MUTATION = gql`
  mutation RemoveOrganizationMember($input: RemoveMemberInput!) {
    removeOrganizationMember(input: $input) {
      success
      organization {
        id
        name
        memberCount
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

// Update Member Role
UPDATE_MEMBER_ROLE_MUTATION = gql`
  mutation UpdateMemberRole($input: UpdateMemberRoleInput!) {
    updateMemberRole(input: $input) {
      success
      organization {
        id
        name
        memberCount
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

// Switch Organization
SWITCH_ORGANIZATION_MUTATION = gql`
  mutation SwitchOrganization($orgId: ID!) {
    switchOrganization(orgId: $orgId) {
      id
      name
      type
      userRole
    }
  }
`;
```

### **2. Service Hooks Implementation**

#### **Organization Management Hooks**
```typescript
// Get Organizations (Admin)
export const useOrganizations = (options?: OrganizationsQueryOptions) => {
  return useQuery<OrganizationsResponse>(GET_ORGANIZATIONS, {
    variables: options,
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });
};

// Get Current User's Organizations
export const useMyOrganizations = () => {
  return useQuery<MyOrganizationsResponse>(GET_MY_ORGANIZATIONS, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });
};

// Get Organization Members
export const useOrganizationMembers = (orgId: string) => {
  return useQuery<OrganizationMembersResponse>(GET_ORGANIZATION_MEMBERS, {
    variables: { orgId },
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    skip: !orgId,
  });
};

// Create Organization
export const useCreateOrganization = () => {
  const [createOrganizationMutation, { loading, error }] = useMutation<CreateOrganizationResponse>(CREATE_ORGANIZATION_MUTATION);

  const createOrganization = async (input: CreateOrganizationInput) => {
    try {
      const response = await createOrganizationMutation({
        variables: { input },
        refetchQueries: ["GetMyOrganizations"],
      });

      if (response.data?.createOrganization.success) {
        return response;
      } else {
        throw new Error(response.data?.createOrganization.errors?.[0]?.message || "Organization creation failed");
      }
    } catch (err) {
      console.error("Create organization error:", err);
      throw err;
    }
  };

  return { createOrganization, loading, error };
};

// Update Organization
export const useUpdateOrganization = () => {
  const [updateOrganizationMutation, { loading, error }] = useMutation<UpdateOrganizationResponse>(UPDATE_ORGANIZATION_MUTATION);

  const updateOrganization = async (id: string, input: UpdateOrganizationInput) => {
    try {
      const response = await updateOrganizationMutation({
        variables: { id, input },
        refetchQueries: ["GetMyOrganizations", "GetOrganizations"],
      });

      if (response.data?.updateOrganization.success) {
        return response;
      } else {
        throw new Error(response.data?.updateOrganization.errors?.[0]?.message || "Organization update failed");
      }
    } catch (err) {
      console.error("Update organization error:", err);
      throw err;
    }
  };

  return { updateOrganization, loading, error };
};

// Delete Organization
export const useDeleteOrganization = () => {
  const [deleteOrganizationMutation, { loading, error }] = useMutation<DeleteOrganizationResponse>(DELETE_ORGANIZATION_MUTATION);

  const deleteOrganization = async (id: string) => {
    try {
      const response = await deleteOrganizationMutation({
        variables: { id },
        refetchQueries: ["GetMyOrganizations", "GetOrganizations"],
      });

      if (response.data?.deleteOrganization.success) {
        return response;
      } else {
        throw new Error(response.data?.deleteOrganization.errors?.[0]?.message || "Organization deletion failed");
      }
    } catch (err) {
      console.error("Delete organization error:", err);
      throw err;
    }
  };

  return { deleteOrganization, loading, error };
};

// Switch Organization
export const useSwitchOrganization = () => {
  const [switchOrganizationMutation, { loading, error }] = useMutation<SwitchOrganizationResponse>(SWITCH_ORGANIZATION_MUTATION);
  const setCurrentOrganization = useAppStore((state) => state.setCurrentOrganization);

  const switchOrganization = async (orgId: string) => {
    try {
      const response = await switchOrganizationMutation({
        variables: { orgId },
        refetchQueries: ["GetMe", "GetMyOrganizations"],
      });

      if (response.data?.switchOrganization) {
        const org = response.data.switchOrganization;
        
        // Update app store
        setCurrentOrganization({
          id: org.id,
          name: org.name,
          type: org.type,
          userRole: org.userRole,
        });

        return response;
      } else {
        throw new Error("Organization switch failed");
      }
    } catch (err) {
      console.error("Switch organization error:", err);
      throw err;
    }
  };

  return { switchOrganization, loading, error };
};
```

### **3. UI Components to Create**

#### **Organization Management Components**
- `OrganizationList.tsx` - List of organizations with search and filters
- `OrganizationCard.tsx` - Individual organization display component
- `CreateOrganizationForm.tsx` - Organization creation form
- `EditOrganizationForm.tsx` - Organization editing form
- `OrganizationMembers.tsx` - Organization members management
- `OrganizationSwitcher.tsx` - Organization context switcher

#### **Member Management Components**
- `MemberList.tsx` - Organization members list
- `AddMemberForm.tsx` - Add member to organization
- `MemberActions.tsx` - Member role management actions
- `InviteMemberForm.tsx` - Invite new members

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Phase 3.1: Organization CRUD Operations**
- [ ] Create `organization.queries.ts` with all organization queries
- [ ] Create `organization.mutations.ts` with all organization mutations
- [ ] Create `organization.service.ts` with service hooks
- [ ] Create `OrganizationList.tsx` component
- [ ] Create `CreateOrganizationForm.tsx` component
- [ ] Create `EditOrganizationForm.tsx` component
- [ ] Implement organization search and filtering
- [ ] Add organization deletion workflow

### **Phase 3.2: Organization Member Management**
- [ ] Implement `organizationMembers` query
- [ ] Create `OrganizationMembers.tsx` component
- [ ] Create `AddMemberForm.tsx` component
- [ ] Create `MemberActions.tsx` component
- [ ] Implement member role management
- [ ] Add member removal workflow
- [ ] Create member invitation system

### **Phase 3.3: Organization Context & Switching**
- [ ] Implement `switchOrganization` mutation
- [ ] Create `OrganizationSwitcher.tsx` component
- [ ] Update app store for organization context
- [ ] Implement organization-aware navigation
- [ ] Add organization context to all relevant components
- [ ] Create multi-tenant UI patterns

### **Phase 3.4: Organization Analytics**
- [ ] Create organization statistics dashboard
- [ ] Implement organization activity tracking
- [ ] Add organization growth metrics
- [ ] Create organization usage analytics

---

## 🎯 **SUCCESS CRITERIA**

### **Functionality**
- ✅ All organization CRUD operations working
- ✅ Organization member management complete
- ✅ Organization switching functional
- ✅ Organization search and filtering working
- ✅ Multi-tenant context management

### **User Experience**
- ✅ Intuitive organization management interface
- ✅ Seamless organization switching
- ✅ Clear member role management
- ✅ Responsive design on all devices
- ✅ Proper loading states and error handling

### **Technical Quality**
- ✅ 100% TypeScript coverage
- ✅ Comprehensive error handling
- ✅ Optimized GraphQL queries
- ✅ Proper state management
- ✅ Performance optimizations

---

## 🚀 **READY TO START PHASE 3**

**Current Status:** Ready to implement comprehensive organization management system

**Next Steps:**
1. Create organization management GraphQL operations
2. Implement service hooks
3. Build UI components
4. Add member management features
5. Implement organization switching

**Estimated Completion:** Phase 3 will provide complete organization management capabilities with multi-tenant support.

Let's begin with Phase 3.1: Organization CRUD Operations! 🚀 