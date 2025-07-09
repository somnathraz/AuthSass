const { gql } = require('apollo-server-express');

module.exports = gql`
  # Input types for auth operations
  input LoginInput {
    email: EmailAddress!
    password: String!
    rememberMe: Boolean = false
  }

  input SignupInput {
    username: String!
    email: EmailAddress!
    password: String!
    confirmPassword: String!
    acceptTerms: Boolean!
  }

  input SocialLoginInput {
    provider: String!
    token: String!
    redirectUri: String
  }

  input PasswordResetRequestInput {
    email: EmailAddress!
    redirectUri: String
  }

  input PasswordResetInput {
    token: String!
    newPassword: String!
    confirmPassword: String!
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
    confirmPassword: String!
  }

  # Auth payload types
  type AuthPayload {
    success: Boolean!
    accessToken: String
    refreshToken: String
    user: User
    requirePasswordReset: Boolean!
    expiresIn: Int
    tokenType: String!
    errors: [Error!]
  }

  type SignupPayload {
    success: Boolean!
    accessToken: String!
    refreshToken: String!
    user: User!
    requiresEmailVerification: Boolean!
    errors: [Error!]
  }

  type RefreshTokenPayload {
    success: Boolean!
    accessToken: String!
    expiresIn: Int!
    errors: [Error!]
  }

  type PasswordResetPayload {
    success: Boolean!
    message: String!
    errors: [Error!]
  }

  # Social auth providers
  enum SocialProvider {
    GOOGLE
    GITHUB
    LINKEDIN
    MICROSOFT
  }

  extend type Query {
    # Check auth status
    me: User
    
    # Health check
    healthCheck: HealthCheck!
    
    # Validate tokens
    validateToken(token: String!): TokenValidationResult!
    
    # Check password strength
    checkPasswordStrength(password: String!): PasswordStrengthResult!
  }

  extend type Mutation {
    # Authentication
    login(input: LoginInput!): AuthPayload!
    signup(input: SignupInput!): SignupPayload!
    socialLogin(input: SocialLoginInput!): AuthPayload!
    logout: SuccessPayload!
    
    # Password management
    requestPasswordReset(input: PasswordResetRequestInput!): PasswordResetPayload!
    resetPassword(input: PasswordResetInput!): PasswordResetPayload!
    changePassword(input: ChangePasswordInput!): PasswordResetPayload!
    
    # Token management
    refreshToken(refreshToken: String): RefreshTokenPayload!
    revokeAllTokens: SuccessPayload!
    
    # Email verification
    resendVerificationEmail: SuccessPayload!
    verifyEmail(token: String!): SuccessPayload!
  }

  extend type Subscription {
    # Auth events
    authStatusChanged: AuthStatusEvent!
  }

  # Supporting types
  type PasswordStrengthResult {
    score: Int!
    feedback: String!
    isValid: Boolean!
    requirements: [PasswordRequirement!]!
  }

  type PasswordRequirement {
    rule: String!
    satisfied: Boolean!
    message: String!
  }

  type TokenValidationResult {
    valid: Boolean!
    user: User
    expiresAt: DateTime
    error: String
  }

  type HealthCheck {
    status: String!
    timestamp: String!
    googleClientConfigured: Boolean!
    message: String!
  }

  type AuthStatusEvent {
    userId: ID!
    action: String!
    timestamp: DateTime!
    metadata: JSON
  }
`; 