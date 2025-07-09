import { gql } from '@apollo/client';

// Fragment for organization permissions
export const ORGANIZATION_PERMISSIONS_FRAGMENT = gql`
  fragment OrganizationPermissions on OrganizationPermissions {
    canCreateApps
    canInviteMembers
    canManageSettings
  }
`;

// Fragment for app permissions
export const APP_PERMISSIONS_FRAGMENT = gql`
  fragment AppPermissions on AppPermissions {
    canRead
    canWrite
    canDelete
    canInvite
    canManageSettings
  }
`;

// Fragment for user app
export const USER_APP_FRAGMENT = gql`
  fragment UserApp on UserApp {
    id
    name
    description
    organization {
      id
      name
      type
    }
    userRole
    accessType
    grantedAt
    grantedBy {
      id
      username
      email
    }
    permissions {
      ...AppPermissions
    }
  }
  ${APP_PERMISSIONS_FRAGMENT}
`;

// Fragment for user organization
export const USER_ORGANIZATION_FRAGMENT = gql`
  fragment UserOrganization on UserOrganization {
    id
    name
    type
    imageUrl
    description
    userRole
    accessType
    joinedAt
    appCount
    permissions {
      ...OrganizationPermissions
    }
    accessibleApps {
      ...UserApp
    }
  }
  ${ORGANIZATION_PERMISSIONS_FRAGMENT}
  ${USER_APP_FRAGMENT}
`;

// Query to get user's organizations
export const GET_USER_ORGANIZATIONS = gql`
  query GetUserOrganizations($input: UserOrganizationsInput) {
    userOrganizations(input: $input) {
      ...UserOrganization
    }
  }
  ${USER_ORGANIZATION_FRAGMENT}
`;

// Query to get user's apps
export const GET_USER_APPS = gql`
  query GetUserApps($input: UserAppsInput) {
    userApps(input: $input) {
      apps {
        ...UserApp
      }
      total
      hasNextPage
      hasPreviousPage
    }
  }
  ${USER_APP_FRAGMENT}
`;

// Query to get user's app access
export const GET_USER_APP_ACCESS = gql`
  query GetUserAppAccess($appId: ID!) {
    userAppAccess(appId: $appId) {
      hasAccess
      accessType
      role
      permissions {
        ...AppPermissions
      }
    }
  }
  ${APP_PERMISSIONS_FRAGMENT}
`;

// Query to get user's organization access
export const GET_USER_ORG_ACCESS = gql`
  query GetUserOrgAccess($orgId: ID!) {
    userOrgAccess(orgId: $orgId) {
      hasAccess
      role
      accessType
      joinedAt
      permissions {
        ...OrganizationPermissions
      }
      appPermissions {
        app {
          id
          name
          description
        }
        role
        grantedAt
        grantedBy {
          id
          username
          email
        }
        status
      }
    }
  }
  ${ORGANIZATION_PERMISSIONS_FRAGMENT}
`;

// Query to get organization details
export const GET_ORGANIZATION = gql`
  query GetOrganization($id: ID!) {
    organization(id: $id) {
      id
      name
      type
      description
      imageUrl
      owner {
        id
        username
        email
        firstName
        lastName
      }
      createdAt
      updatedAt
      
      # User-specific context
      userRole
      userAccess {
        role
        accessType
        joinedAt
        permissions {
          ...OrganizationPermissions
        }
      }
    }
  }
  ${ORGANIZATION_PERMISSIONS_FRAGMENT}
`;

// Query to get organization members
export const GET_ORGANIZATION_MEMBERS = gql`
  query GetOrganizationMembers($orgId: ID!) {
    organizationMembers(orgId: $orgId) {
      owner {
        id
        username
        email
        firstName
        lastName
        profileImage
      }
      members {
        user {
          id
          username
          email
          firstName
          lastName
          profileImage
          lastSeenAt
        }
        role
        accessType
        joinedAt
        invitedBy {
          id
          username
          email
        }
        appPermissions {
          app {
            id
            name
          }
          role
          grantedAt
          grantedBy {
            id
            username
            email
          }
          status
        }
        permissions {
          ...OrganizationPermissions
        }
      }
      total
    }
  }
  ${ORGANIZATION_PERMISSIONS_FRAGMENT}
`;

// Query to get organization apps
export const GET_ORGANIZATION_APPS = gql`
  query GetOrganizationApps($orgId: ID!, $filters: JSON, $pagination: PaginationInput) {
    organizationApps(orgId: $orgId, filters: $filters, pagination: $pagination) {
      apps {
        id
        name
        description
        owner {
          id
          username
          email
        }
        createdAt
        updatedAt
        
        # User-specific access
        userRole
        userAccess {
          role
          accessType
          permissions {
            ...AppPermissions
          }
        }
        
        # App statistics
        memberCount
        isActive
      }
      total
      hasNextPage
      hasPreviousPage
    }
  }
  ${APP_PERMISSIONS_FRAGMENT}
`;

// Mutation to create organization
export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      success
      organization {
        ...UserOrganization
      }
      errors {
        message
        code
        field
      }
    }
  }
  ${USER_ORGANIZATION_FRAGMENT}
`;

// Mutation to update organization
export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
    updateOrganization(id: $id, input: $input) {
      success
      organization {
        ...UserOrganization
      }
      errors {
        message
        code
        field
      }
    }
  }
  ${USER_ORGANIZATION_FRAGMENT}
`;

// Mutation to add organization member
export const ADD_ORGANIZATION_MEMBER = gql`
  mutation AddOrganizationMember($input: AddOrganizationMemberInput!) {
    addOrganizationMember(input: $input) {
      success
      member {
        user {
          id
          username
          email
          firstName
          lastName
        }
        role
        accessType
        joinedAt
        permissions {
          ...OrganizationPermissions
        }
      }
      errors {
        message
        code
        field
      }
    }
  }
  ${ORGANIZATION_PERMISSIONS_FRAGMENT}
`;

// Mutation to update member role
export const UPDATE_MEMBER_ROLE = gql`
  mutation UpdateMemberRole($input: UpdateMemberRoleInput!) {
    updateMemberRole(input: $input) {
      success
      member {
        user {
          id
          username
          email
        }
        role
        accessType
        permissions {
          ...OrganizationPermissions
        }
      }
      errors {
        message
        code
        field
      }
    }
  }
  ${ORGANIZATION_PERMISSIONS_FRAGMENT}
`;

// Mutation to remove organization member
export const REMOVE_ORGANIZATION_MEMBER = gql`
  mutation RemoveOrganizationMember($input: RemoveOrganizationMemberInput!) {
    removeOrganizationMember(input: $input) {
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

// Mutation to add app permission to member
export const ADD_APP_PERMISSION = gql`
  mutation AddAppPermission($input: AddAppPermissionInput!) {
    addAppPermission(input: $input) {
      success
      permission {
        app {
          id
          name
        }
        role
        grantedAt
        grantedBy {
          id
          username
          email
        }
        status
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

// Mutation to revoke app permission
export const REVOKE_APP_PERMISSION = gql`
  mutation RevokeAppPermission($input: RevokeAppPermissionInput!) {
    revokeAppPermission(input: $input) {
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

// Subscription for organization updates
export const ORGANIZATION_UPDATED = gql`
  subscription OrganizationUpdated($orgId: ID) {
    organizationUpdated(orgId: $orgId) {
      ...UserOrganization
    }
  }
  ${USER_ORGANIZATION_FRAGMENT}
`;

// Subscription for organization membership changes
export const ORGANIZATION_MEMBERSHIP_CHANGED = gql`
  subscription OrganizationMembershipChanged($orgId: ID!) {
    organizationMembershipChanged(orgId: $orgId) {
      type
      member {
        user {
          id
          username
          email
        }
        role
        accessType
        joinedAt
      }
      organization {
        id
        name
      }
    }
  }
`;

export default {
  GET_USER_ORGANIZATIONS,
  GET_USER_APPS,
  GET_USER_APP_ACCESS,
  GET_USER_ORG_ACCESS,
  GET_ORGANIZATION,
  GET_ORGANIZATION_MEMBERS,
  GET_ORGANIZATION_APPS,
  CREATE_ORGANIZATION,
  UPDATE_ORGANIZATION,
  ADD_ORGANIZATION_MEMBER,
  UPDATE_MEMBER_ROLE,
  REMOVE_ORGANIZATION_MEMBER,
  ADD_APP_PERMISSION,
  REVOKE_APP_PERMISSION,
  ORGANIZATION_UPDATED,
  ORGANIZATION_MEMBERSHIP_CHANGED,
}; 