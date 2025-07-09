import { gql } from "@apollo/client";

/**
 * Authentication Queries
 * 
 * All queries use the working backend resolvers from our comprehensive testing.
 * These are verified to work with the current backend implementation.
 */

// ========================================
// USER PROFILE & STATUS
// ========================================

export const GET_ME = gql`
  query GetMe {
    me {
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
        description
        imageUrl
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
      bio
      location
      website
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

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
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
      }
      requirePasswordReset
      isVerified
      profileImage
      firstName
      lastName
      bio
      location
      website
      fullName
      createdAt
      updatedAt
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUserProfile {
    userProfile {
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
      createdAt
      updatedAt
    }
  }
`;

// ========================================
// SYSTEM HEALTH & VALIDATION
// ========================================

export const HEALTH_CHECK = gql`
  query HealthCheck {
    healthCheck {
      status
      timestamp
      googleClientConfigured
      message
    }
  }
`;

export const VALIDATE_TOKEN = gql`
  query ValidateToken($token: String!) {
    validateToken(token: $token) {
      valid
      user {
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
        }
      }
      expiresAt
      error
    }
  }
`;

export const CHECK_PASSWORD_STRENGTH = gql`
  query CheckPasswordStrength($password: String!) {
    checkPasswordStrength(password: $password) {
      score
      feedback
      isValid
      requirements {
        rule
        satisfied
        message
      }
    }
  }
`;

// ========================================
// USER ORGANIZATIONS & ACCESS
// ========================================

export const GET_USER_ORGANIZATIONS = gql`
  query GetUserOrganizations($input: UserOrganizationsInput) {
    userOrganizations(input: $input) {
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
`;

export const GET_USER_ORG_ACCESS = gql`
  query GetUserOrgAccess($orgId: ID!) {
    userOrgAccess(orgId: $orgId) {
      hasAccess
      role
      accessType
      joinedAt
      permissions {
        canCreateApps
        canInviteMembers
        canManageSettings
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
`;

export const GET_USER_APP_ACCESS = gql`
  query GetUserAppAccess($appId: ID!) {
    userAppAccess(appId: $appId) {
      hasAccess
      accessType
      role
      permissions {
        canRead
        canWrite
        canDelete
        canInvite
        canManageSettings
      }
    }
  }
`;

// ========================================
// USER APPS
// ========================================

export const GET_USER_APPS = gql`
  query GetUserApps($input: UserAppsInput) {
    me {
      apps(input: $input) {
        apps {
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
        total
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface UserOrganizationsInput {
  filters?: {
    type?: string;
    accessType?: string;
    role?: string;
  };
}

export interface UserAppsInput {
  filters?: {
    organizationId?: string;
    accessType?: string;
    role?: string;
  };
  pagination?: {
    offset?: number;
    limit?: number;
  };
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  googleClientConfigured: boolean;
  message: string;
}

export interface TokenValidationResult {
  valid: boolean;
  user?: User;
  expiresAt?: string;
  error?: string;
}

export interface PasswordStrengthResult {
  score: number;
  feedback: string;
  isValid: boolean;
  requirements: PasswordRequirement[];
}

export interface PasswordRequirement {
  rule: string;
  satisfied: boolean;
  message: string;
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

export interface UserApp {
  id: string;
  name: string;
  description?: string;
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
}

export interface OrganizationPermissions {
  canCreateApps: boolean;
  canInviteMembers: boolean;
  canManageSettings: boolean;
}

export interface AppPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageSettings: boolean;
}

export interface UserOrgAccess {
  hasAccess: boolean;
  role: string;
  accessType: string;
  joinedAt: string;
  permissions: OrganizationPermissions;
  appPermissions: AppPermission[];
}

export interface AppPermission {
  app: {
    id: string;
    name: string;
    description?: string;
  };
  role: string;
  grantedAt: string;
  grantedBy: {
    id: string;
    username: string;
    email: string;
  };
  status: string;
}

export interface UserAppAccess {
  hasAccess: boolean;
  accessType: string;
  role: string;
  permissions: AppPermissions;
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
    description?: string;
    imageUrl?: string;
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
  bio?: string;
  location?: string;
  website?: string;
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