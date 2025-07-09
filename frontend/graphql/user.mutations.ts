import { gql } from "@apollo/client";

/**
 * User Management Mutations
 * 
 * All mutations use the working backend resolvers from our comprehensive testing.
 * These are verified to work with the current backend implementation.
 */

// ========================================
// USER PROFILE MANAGEMENT
// ========================================

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
    updateUser(id: $id, input: $input) {
      success
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
        isOnline
        displayName
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

export const UPDATE_CURRENT_USER_MUTATION = gql`
  mutation UpdateCurrentUser($input: UserUpdateInput!) {
    updateUser(input: $input) {
      success
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
        isOnline
        displayName
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

// ========================================
// ADMIN USER MANAGEMENT
// ========================================

export const UPDATE_USER_STATUS_MUTATION = gql`
  mutation UpdateUserStatus($id: ID!, $status: UserStatus!) {
    updateUserStatus(id: $id, status: $status) {
      success
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
        isVerified
        lastLoginAt
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

export const UPDATE_USER_ROLE_MUTATION = gql`
  mutation UpdateUserRole($id: ID!, $role: UserRole!) {
    updateUserRole(id: $id, role: $role) {
      success
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
        isVerified
        lastLoginAt
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

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      deletedUserId
      errors {
        message
        code
        field
      }
    }
  }
`;

// ========================================
// BULK USER OPERATIONS
// ========================================

export const BULK_UPDATE_USER_STATUS_MUTATION = gql`
  mutation BulkUpdateUserStatus($userIds: [ID!]!, $status: UserStatus!) {
    bulkUpdateUserStatus(userIds: $userIds, status: $status) {
      success
      updatedCount
      failedCount
      errors {
        message
        code
        field
        userId
      }
    }
  }
`;

export const BULK_DELETE_USERS_MUTATION = gql`
  mutation BulkDeleteUsers($userIds: [ID!]!) {
    bulkDeleteUsers(userIds: $userIds) {
      success
      deletedCount
      failedCount
      deletedUserIds
      errors {
        message
        code
        field
        userId
      }
    }
  }
`;

// ========================================
// USER PREFERENCES & SETTINGS
// ========================================

export const UPDATE_USER_PREFERENCES_MUTATION = gql`
  mutation UpdateUserPreferences($input: UserPreferencesInput!) {
    updateUserPreferences(input: $input) {
      success
      user {
        id
        username
        email
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

export const UPDATE_USER_PROFILE_IMAGE_MUTATION = gql`
  mutation UpdateUserProfileImage($input: ProfileImageInput!) {
    updateUserProfileImage(input: $input) {
      success
      user {
        id
        username
        email
        profileImage
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

// ========================================
// INPUT TYPE DEFINITIONS
// ========================================

export interface UserUpdateInput {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  timezone?: string;
  locale?: string;
  preferences?: UserPreferencesInput;
}

export interface UserPreferencesInput {
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    inApp?: boolean;
    frequency?: string;
  };
  privacy?: {
    profileVisibility?: string;
    dataSharing?: boolean;
    analyticsOptOut?: boolean;
  };
  appearance?: {
    theme?: string;
    language?: string;
    dateFormat?: string;
    timeFormat?: string;
  };
}

export interface ProfileImageInput {
  imageUrl?: string;
  imageFile?: File;
  removeImage?: boolean;
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING",
  BANNED = "BANNED",
}

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
  MODERATOR = "MODERATOR",
  VIEWER = "VIEWER",
}

// ========================================
// RESPONSE TYPE DEFINITIONS
// ========================================

export interface UpdateUserResponse {
  updateUser: {
    success: boolean;
    user?: User;
    errors?: Error[];
  };
}

export interface UpdateUserStatusResponse {
  updateUserStatus: {
    success: boolean;
    user?: User;
    errors?: Error[];
  };
}

export interface UpdateUserRoleResponse {
  updateUserRole: {
    success: boolean;
    user?: User;
    errors?: Error[];
  };
}

export interface DeleteUserResponse {
  deleteUser: {
    success: boolean;
    deletedUserId?: string;
    errors?: Error[];
  };
}

export interface BulkUpdateUserStatusResponse {
  bulkUpdateUserStatus: {
    success: boolean;
    updatedCount: number;
    failedCount: number;
    errors?: BulkError[];
  };
}

export interface BulkDeleteUsersResponse {
  bulkDeleteUsers: {
    success: boolean;
    deletedCount: number;
    failedCount: number;
    deletedUserIds: string[];
    errors?: BulkError[];
  };
}

export interface UpdateUserPreferencesResponse {
  updateUserPreferences: {
    success: boolean;
    user?: User;
    errors?: Error[];
  };
}

export interface UpdateUserProfileImageResponse {
  updateUserProfileImage: {
    success: boolean;
    user?: User;
    errors?: Error[];
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
  isOnline?: boolean;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
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

export interface Error {
  message: string;
  code?: string;
  field?: string;
}

export interface BulkError {
  message: string;
  code?: string;
  field?: string;
  userId?: string;
} 