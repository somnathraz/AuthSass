import { gql } from "@apollo/client";

/**
 * Organization Management Queries
 * 
 * All queries use the working backend resolvers from our comprehensive testing.
 * These are verified to work with the current backend implementation.
 */

// ========================================
// ORGANIZATION LIST & SEARCH
// ========================================

export const GET_ORGANIZATIONS = gql`
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
        settings
        owner {
          id
          username
          email
          firstName
          lastName
          profileImage
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

export const GET_MY_ORGANIZATIONS = gql`
  query GetMyOrganizations {
    myOrganizations {
      id
      name
      description
      type
      status
      imageUrl
      website
      settings
      owner {
        id
        username
        email
        firstName
        lastName
        profileImage
      }
      memberCount
      userRole
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_ORGANIZATIONS = gql`
  query GetAllOrganizations {
    allOrganizations {
      id
      name
      description
      type
      status
      imageUrl
      website
      settings
      owner {
        id
        username
        email
        firstName
        lastName
        profileImage
      }
      memberCount
      userRole
      createdAt
      updatedAt
    }
  }
`;

// ========================================
// ORGANIZATION MEMBERS
// ========================================

export const GET_ORGANIZATION_MEMBERS = gql`
  query GetOrganizationMembers($orgId: ID!) {
    organizationMembers(orgId: $orgId) {
      owner {
        id
        username
        email
        profileImage
        firstName
        lastName
        fullName
        role
        status
        lastLoginAt
        createdAt
      }
      members {
        user {
          id
          username
          email
          profileImage
          firstName
          lastName
          fullName
          role
          status
          lastLoginAt
          createdAt
        }
        role
        status
        joinedAt
      }
      total
    }
  }
`;

// ========================================
// USER ORGANIZATION ACCESS
// ========================================

export const GET_USER_ORG_ACCESS = gql`
  query GetUserOrgAccess($orgId: ID!) {
    userOrgAccess(orgId: $orgId) {
      hasAccess
      role
      accessType
      joinedAt
      permissions
      appPermissions {
        app {
          id
          name
          description
        }
        permissions
      }
    }
  }
`;

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface OrganizationsQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filter?: OrganizationFilter;
}

export interface OrganizationFilter {
  name?: string;
  type?: OrganizationType;
  status?: Status;
  search?: string;
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export enum OrganizationType {
  PERSONAL = "PERSONAL",
  TEAM = "TEAM",
  COMPANY = "COMPANY",
  ENTERPRISE = "ENTERPRISE",
}

export enum Status {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING",
}

export enum Role {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
  OWNER = "OWNER",
}

export interface OrganizationsResponse {
  organizations: {
    organizations: Organization[];
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface MyOrganizationsResponse {
  myOrganizations: Organization[];
}

export interface AllOrganizationsResponse {
  allOrganizations: Organization[];
}

export interface OrganizationMembersResponse {
  organizationMembers: {
    owner: User;
    members: OrganizationMember[];
    total: number;
  };
}

export interface UserOrgAccessResponse {
  userOrgAccess: {
    hasAccess: boolean;
    role: string;
    accessType: string;
    joinedAt: string;
    permissions: any;
    appPermissions: AppPermission[];
  };
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  type: OrganizationType;
  status: Status;
  imageUrl?: string;
  website?: string;
  settings?: any;
  owner: User;
  memberCount: number;
  userRole?: Role;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profileImage?: string;
  role?: string;
  status?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface OrganizationMember {
  user: User;
  role: Role;
  status: Status;
  joinedAt: string;
}

export interface AppPermission {
  app: {
    id: string;
    name: string;
    description?: string;
  };
  permissions: any;
} 