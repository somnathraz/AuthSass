import { gql } from "@apollo/client";

// Profile Management Mutations
export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile(
    $firstName: String
    $lastName: String
    $bio: String
    $location: String
    $website: String
  ) {
    updateProfile(
      firstName: $firstName
      lastName: $lastName
      bio: $bio
      location: $location
      website: $website
    ) {
      id
      username
      email
      firstName
      lastName
      bio
      location
      website
      profileImage
      role
      isVerified
      createdAt
      lastLoginAt
    }
  }
`;

export const UPDATE_AVATAR_MUTATION = gql`
  mutation UpdateAvatar($avatar: String!) {
    updateAvatar(avatar: $avatar) {
      id
      username
      email
      firstName
      lastName
      bio
      location
      website
      profileImage
      role
      isVerified
      createdAt
      lastLoginAt
    }
  }
`;

export const UPDATE_PASSWORD_MUTATION = gql`
  mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {
    updatePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

export const UPDATE_EMAIL_MUTATION = gql`
  mutation UpdateEmail($newEmail: String!, $password: String!) {
    updateEmail(newEmail: $newEmail, password: $password) {
      id
      username
      email
      firstName
      lastName
      profileImage
      role
      isVerified
      createdAt
      lastLoginAt
    }
  }
`;

export const UPDATE_USER_SETTINGS_MUTATION = gql`
  mutation UpdateUserSettings(
    $emailNotifications: Boolean
    $securityAlerts: Boolean
    $loginNotifications: Boolean
    $marketingEmails: Boolean
  ) {
    updateUserSettings(
      emailNotifications: $emailNotifications
      securityAlerts: $securityAlerts
      loginNotifications: $loginNotifications
      marketingEmails: $marketingEmails
    ) {
      id
      username
      email
      firstName
      lastName
      profileImage
      role
      isVerified
      createdAt
      lastLoginAt
    }
  }
`;

export const DELETE_ACCOUNT_MUTATION = gql`
  mutation DeleteAccount($password: String!, $confirmation: String!) {
    deleteAccount(password: $password, confirmation: $confirmation)
  }
`;

export const EXPORT_USER_DATA_MUTATION = gql`
  mutation ExportUserData {
    exportUserData
  }
`;

// Type definitions
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export interface UpdateAvatarInput {
  avatar: string;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateEmailInput {
  newEmail: string;
  password: string;
}

export interface UpdateUserSettingsInput {
  emailNotifications?: boolean;
  securityAlerts?: boolean;
  loginNotifications?: boolean;
  marketingEmails?: boolean;
}

export interface DeleteAccountInput {
  password: string;
  confirmation: string;
} 