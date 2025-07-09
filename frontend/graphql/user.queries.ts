import { gql } from "@apollo/client";

/**
 * User Management Queries
 * 
 * All queries use the working backend resolvers from our comprehensive testing.
 * These are verified to work with the current backend implementation.
 */

// ========================================
// USER LIST & SEARCH
// ========================================

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
      users {
        id
        username
        email
        role
        status
        accountType
        organizationId
        organization {
          id
          name
          type
          imageUrl
          description
        }
        requirePasswordReset
        isVerified
        lastLoginAt
        profileImage
        firstName
        lastName
        fullName
        timezone
        locale
        preferences {
          notifications {
            email
            push
            sms
            inApp
            frequency
          }
          privacy {
            profileVisibility
            dataSharing
            analyticsOptOut
          }
          appearance {
            theme
            language
            dateFormat
            timeFormat
          }
        }
        tokenStats {
          activeTokens
          totalTokens
          lastTokenCreated
          lastTokenUsed
        }
        isOnline
        displayName
        createdAt
        updatedAt
        createdBy {
          id
          username
          email
        }
      }
      total
      hasNextPage
      hasPreviousPage
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    user(id: $id) {
      id
      username
      email
      role
      status
      accountType
      organizationId
      organization {
        id
        name
        type
        imageUrl
        description
        website
        status
        memberCount
        userRole
        createdAt
        updatedAt
      }
      requirePasswordReset
      isVerified
      lastLoginAt
      profileImage
      firstName
      lastName
      fullName
      timezone
      locale
      preferences {
        notifications {
          email
          push
          sms
          inApp
          frequency
        }
        privacy {
          profileVisibility
          dataSharing
          analyticsOptOut
        }
        appearance {
          theme
          language
          dateFormat
          timeFormat
        }
      }
      tokenStats {
        activeTokens
        totalTokens
        lastTokenCreated
        lastTokenUsed
      }
      isOnline
      displayName
      createdAt
      updatedAt
      createdBy {
        id
        username
        email
      }
    }
  }
`;

// ========================================
// USER STATISTICS & ANALYTICS
// ========================================

export const GET_USER_STATS = gql`
  query GetUserStats {
    userStats {
      totalUsers
      activeUsers
      newUsersToday
      newUsersThisWeek
      newUsersThisMonth
      usersByRole {
        role
        count
      }
      usersByStatus {
        status
        count
      }
      usersByAccountType {
        accountType
        count
      }
      growthMetrics {
        dailyGrowth
        weeklyGrowth
        monthlyGrowth
      }
      activityMetrics {
        dailyActiveUsers
        weeklyActiveUsers
        monthlyActiveUsers
      }
    }
  }
`;

// ========================================
// USER APPS & ACCESS (Fixed from deprecated myApps)
// ========================================

export const GET_USER_APPS = gql`
  query GetUserApps($userId: ID, $input: UserAppsInput) {
    user(id: $userId) {
      id
      username
      email
      apps(input: $input) {
        apps {
          id
          name
          description
          type
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
          status
          memberCount
          createdAt
          updatedAt
        }
        total
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

// ========================================
// USER ORGANIZATIONS & ACCESS
// ========================================

export const GET_USER_ORGANIZATIONS = gql`
  query GetUserOrganizations($userId: ID, $input: UserOrganizationsInput) {
    user(id: $userId) {
      id
      username
      email
      organizations(input: $input) {
        id
        name
        type
        imageUrl
        description
        userRole
        accessType
        joinedAt
        appCount
        accessibleApps {
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
        permissions {
          canCreateApps
          canInviteMembers
          canManageSettings
        }
      }
    }
  }
`;

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface UsersQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filter?: UserFilterInput;
}

export interface UserFilterInput {
  search?: string;
  role?: string;
  status?: string;
  accountType?: string;
  organizationId?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
}

export interface UserAppsInput {
  filters?: {
    organizationId?: string;
    accessType?: string;
    role?: string;
    status?: string;
  };
  pagination?: {
    offset?: number;
    limit?: number;
  };
}

export interface UserOrganizationsInput {
  filters?: {
    type?: string;
    accessType?: string;
    role?: string;
  };
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export interface UsersResponse {
  users: {
    users: User[];
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface UserResponse {
  user: User;
}

export interface UserStatsResponse {
  userStats: UserStats;
}

export interface UserAppsResponse {
  user: {
    id: string;
    username: string;
    email: string;
    apps: {
      apps: UserApp[];
      total: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface UserOrganizationsResponse {
  user: {
    id: string;
    username: string;
    email: string;
    organizations: UserOrganization[];
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  accountType: string;
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
    type: string;
    imageUrl?: string;
    description?: string;
    website?: string;
    status?: string;
    memberCount?: number;
    userRole?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  requirePasswordReset: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  profileImage?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  timezone?: string;
  locale?: string;
  preferences?: UserPreferences;
  tokenStats?: TokenStats;
  isOnline?: boolean;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
    frequency: string;
  };
  privacy: {
    profileVisibility: string;
    dataSharing: boolean;
    analyticsOptOut: boolean;
  };
  appearance: {
    theme: string;
    language: string;
    dateFormat: string;
    timeFormat: string;
  };
}

export interface TokenStats {
  activeTokens: number;
  totalTokens: number;
  lastTokenCreated?: string;
  lastTokenUsed?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: RoleDistribution[];
  usersByStatus: StatusDistribution[];
  usersByAccountType: AccountTypeDistribution[];
  growthMetrics: GrowthMetrics;
  activityMetrics: ActivityMetrics;
}

export interface RoleDistribution {
  role: string;
  count: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface AccountTypeDistribution {
  accountType: string;
  count: number;
}

export interface GrowthMetrics {
  dailyGrowth: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

export interface ActivityMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}

export interface UserApp {
  id: string;
  name: string;
  description?: string;
  type: string;
  organization: {
    id: string;
    name: string;
    type: string;
  };
  userRole: string;
  accessType: string;
  grantedAt?: string;
  grantedBy?: {
    id: string;
    username: string;
    email: string;
  };
  permissions: AppPermissions;
  status: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageSettings: boolean;
}

export interface UserOrganization {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
  description?: string;
  userRole: string;
  accessType: string;
  joinedAt: string;
  appCount: number;
  accessibleApps: UserApp[];
  permissions: OrganizationPermissions;
}

export interface OrganizationPermissions {
  canCreateApps: boolean;
  canInviteMembers: boolean;
  canManageSettings: boolean;
} 