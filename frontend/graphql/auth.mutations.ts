import { gql } from "@apollo/client";

/**
 * Authentication Mutations
 * 
 * All mutations use the working backend resolvers from our comprehensive testing.
 * These are verified to work with the current backend implementation.
 */

// ========================================
// CORE AUTHENTICATION
// ========================================

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      accessToken
      refreshToken
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
        createdAt
        updatedAt
      }
      requirePasswordReset
      expiresIn
      tokenType
      errors {
        message
        code
        field
      }
    }
  }
`;

export const SIGNUP_MUTATION = gql`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      success
      accessToken
      refreshToken
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
        profileImage
        firstName
        lastName
        fullName
        createdAt
        updatedAt
      }
      requiresEmailVerification
      errors {
        message
        code
        field
      }
    }
  }
`;

export const SOCIAL_LOGIN_MUTATION = gql`
  mutation SocialLogin($input: SocialLoginInput!) {
    socialLogin(input: $input) {
      success
      accessToken
      refreshToken
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
        createdAt
        updatedAt
      }
      requirePasswordReset
      expiresIn
      tokenType
      errors {
        message
        code
        field
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
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

// ========================================
// PASSWORD MANAGEMENT
// ========================================

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
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

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($input: PasswordResetRequestInput!) {
    requestPasswordReset(input: $input) {
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

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: PasswordResetInput!) {
    resetPassword(input: $input) {
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

// ========================================
// EMAIL VERIFICATION
// ========================================

export const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
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

export const RESEND_VERIFICATION_EMAIL_MUTATION = gql`
  mutation ResendVerificationEmail {
    resendVerificationEmail {
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

// ========================================
// TOKEN MANAGEMENT
// ========================================

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String) {
    refreshToken(refreshToken: $refreshToken) {
      success
      accessToken
      expiresIn
      errors {
        message
        code
        field
      }
    }
  }
`;

export const REVOKE_ALL_TOKENS_MUTATION = gql`
  mutation RevokeAllTokens {
    revokeAllTokens {
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

// ========================================
// INPUT TYPE DEFINITIONS
// ========================================

/**
 * TypeScript interfaces for input types
 * These match the backend schema definitions
 */

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupInput {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface SocialLoginInput {
  provider: string;
  token: string;
  redirectUri?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetRequestInput {
  email: string;
  redirectUri?: string;
}

export interface PasswordResetInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// ========================================
// RESPONSE TYPE DEFINITIONS
// ========================================

export interface AuthPayload {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  requirePasswordReset: boolean;
  expiresIn?: number;
  tokenType: string;
  errors?: Error[];
}

export interface SignupPayload {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresEmailVerification: boolean;
  errors?: Error[];
}

export interface PasswordResetPayload {
  success: boolean;
  message: string;
  errors?: Error[];
}

export interface RefreshTokenPayload {
  success: boolean;
  accessToken: string;
  expiresIn: number;
  errors?: Error[];
}

export interface SuccessPayload {
  success: boolean;
  message?: string;
  errors?: Error[];
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
  createdAt: string;
  updatedAt: string;
}

export interface Error {
  message: string;
  code?: string;
  field?: string;
} 