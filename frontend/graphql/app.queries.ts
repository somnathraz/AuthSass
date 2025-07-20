import { gql } from "@apollo/client";

// ===== APPLICATION QUERY TYPES =====

export interface Application {
  id: string;
  name: string;
  description?: string;
  type: AppType;
  status: Status;
  settings?: any;
  organization: {
    id: string;
    name: string;
    type: string;
  };
  organizationId: string;
  owner: {
    id: string;
    username: string;
    email: string;
    profileImage?: string;
  };
  members?: AppMember[];
  apiKeys?: ApiKey[];
  memberCount: number;
  userRole?: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AppMember {
  user: {
    id: string;
    username: string;
    email: string;
    profileImage?: string;
  };
  role: Role;
  status: Status;
  joinedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key?: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAppAccess {
  hasAccess: boolean;
  accessType: AccessType;
  role?: Role;
  permissions: AppPermissions;
}

export interface AppPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageSettings: boolean;
}

export interface AppsResponse {
  apps: Application[];
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Update UserApp interface to match exact backend schema
export interface UserApp {
  id: string;
  name: string;
  description?: string;
  organization: {
    id: string;
    name: string;
    type: string;
  };
  userRole: Role;
  accessType: "FULL" | "SCOPED" | "DIRECT" | "ORGANIZATION";
  grantedAt?: string;
  grantedBy?: {
    id: string;
    username: string;
    email: string;
  };
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canInvite: boolean;
    canManageSettings: boolean;
  };
}

// ===== ENUMS =====

export enum AppType {
  WEB = "WEB",
  MOBILE = "MOBILE",
  API = "API",
  SERVICE = "SERVICE",
}

export enum Status {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
}

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
  OWNER = "OWNER",
}

export enum AccessType {
  FULL = "FULL",
  SCOPED = "SCOPED",
  DIRECT = "DIRECT",
  ORGANIZATION = "ORGANIZATION",
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

// ===== FILTER TYPES =====

export interface AppFilter {
  name?: string;
  type?: AppType;
  status?: Status;
  organizationId?: string;
  search?: string;
}

export interface AppsQueryOptions {
  filter?: AppFilter;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

// Add input types to match backend schema
export interface AppFilters {
  organizationId?: string;
  accessType?: "FULL" | "SCOPED" | "DIRECT" | "ORGANIZATION";
  role?: Role;
}

export interface PaginationInput {
  offset?: number;
  limit?: number;
}

// ===== QUERY FRAGMENTS =====

export const APP_BASIC_FRAGMENT = gql`
  fragment AppBasic on App {
    id
    name
    description
    type
    status
    settings
    memberCount
    userRole
    createdAt
    updatedAt
  }
`;

export const APP_ORGANIZATION_FRAGMENT = gql`
  fragment AppOrganization on App {
    organizationId
    organization {
      id
      name
      type
    }
  }
`;

export const APP_OWNER_FRAGMENT = gql`
  fragment AppOwner on App {
    owner {
      id
      username
      email
      profileImage
    }
  }
`;

export const APP_MEMBER_FRAGMENT = gql`
  fragment AppMember on AppMember {
    user {
      id
      username
      email
      profileImage
    }
    role
    status
    joinedAt
  }
`;

export const API_KEY_FRAGMENT = gql`
  fragment ApiKey on ApiKey {
    id
    name
    key
    permissions
    isActive
    lastUsedAt
    expiresAt
    createdAt
    updatedAt
  }
`;

export const APP_FULL_FRAGMENT = gql`
  fragment AppFull on App {
    ...AppBasic
    ...AppOrganization
    ...AppOwner
  }
  ${APP_BASIC_FRAGMENT}
  ${APP_ORGANIZATION_FRAGMENT}
  ${APP_OWNER_FRAGMENT}
`;

// Update UserApp fragment to match backend schema
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
      canRead
      canWrite
      canDelete
      canInvite
      canManageSettings
    }
  }
`;

// ===== QUERIES =====

// Get paginated list of applications with filtering
export const GET_APPS = gql`
  query GetApps(
    $filter: AppFilter
    $limit: Int
    $offset: Int
    $sortBy: String
    $sortOrder: SortOrder
  ) {
    apps(
      filter: $filter
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      apps {
        ...AppFull
      }
      total
      hasNextPage
      hasPreviousPage
    }
  }
  ${APP_FULL_FRAGMENT}
`;

// Get single application with full details
export const GET_APP = gql`
  query GetApp($id: ID!) {
    app(id: $id) {
      ...AppFull
      members {
        id
        username
        email
        profileImage
      }
      apiKeys {
        ...ApiKey
      }
    }
  }
  ${APP_FULL_FRAGMENT}
  ${API_KEY_FRAGMENT}
`;

// Update user apps queries to match backend schema
export const GET_USER_APPS = gql`
  query GetUserApps {
    myApps {
      id
      name
      description
      type
      organizationId
      owner {
        id
        username
        email
      }
      members {
        id
        username
        email
      }
      memberCount
      userRole
      createdAt
      brandingSettings {
        customLogo
      }
      generalSettings {
        logoUrl
      }
    }
  }
`;

// Get user's access to specific application
export const GET_USER_APP_ACCESS = gql`
  query GetUserAppAccess($appId: ID!) {
    userAppAccess(appId: $appId) {
      hasAccess
      accessType
      role
      permissions
    }
  }
`;

// Get application members (lazy loading) - Use appMembers query for AppMember data
export const GET_APP_MEMBERS = gql`
  query GetAppMembers($appId: ID!) {
    appMembers(appId: $appId) {
      owner {
        id
        username
        email
        profileImage
      }
      members {
        ...AppMember
      }
      total
    }
  }
  ${APP_MEMBER_FRAGMENT}
`;

// Get application API keys (lazy loading)
export const GET_APP_API_KEYS = gql`
  query GetAppApiKeys($appId: ID!) {
    app(id: $appId) {
      id
      name
      apiKeys {
        ...ApiKey
      }
    }
  }
  ${API_KEY_FRAGMENT}
`;

// Get applications by organization
export const GET_ORGANIZATION_APPS = gql`
  query GetOrganizationApps(
    $organizationId: ID!
    $limit: Int
    $offset: Int
    $search: String
    $type: AppType
    $status: Status
  ) {
    apps(
      filter: {
        organizationId: $organizationId
        search: $search
        type: $type
        status: $status
      }
      limit: $limit
      offset: $offset
    ) {
      apps {
        ...AppFull
      }
      total
      hasNextPage
      hasPreviousPage
    }
  }
  ${APP_FULL_FRAGMENT}
`;

// Search applications (for admin)
export const SEARCH_APPS = gql`
  query SearchApps($search: String!, $limit: Int, $organizationId: ID) {
    apps(
      filter: { search: $search, organizationId: $organizationId }
      limit: $limit
    ) {
      apps {
        ...AppBasic
        ...AppOrganization
        ...AppOwner
      }
      total
    }
  }
  ${APP_BASIC_FRAGMENT}
  ${APP_ORGANIZATION_FRAGMENT}
  ${APP_OWNER_FRAGMENT}
`;

// Get application statistics (if available)
export const GET_APP_STATS = gql`
  query GetAppStats($appId: ID!) {
    app(id: $appId) {
      id
      name
      memberCount
      apiKeys {
        id
        isActive
        lastUsed
      }
      createdAt
      updatedAt
    }
  }
`;

export default {
  GET_APPS,
  GET_APP,
  GET_USER_APPS,
  GET_USER_APP_ACCESS,
  GET_APP_MEMBERS,
  GET_APP_API_KEYS,
  GET_ORGANIZATION_APPS,
  SEARCH_APPS,
  GET_APP_STATS,
};
