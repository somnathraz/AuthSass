import { gql } from "@apollo/client";

// User fragments
export const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    username
    email
    role
    organizationId
    createdAt
  }
`;

export const USER_WITH_ORG_FRAGMENT = gql`
  fragment UserWithOrgFields on User {
    ...UserFields
    requirePasswordReset
  }
  ${USER_FRAGMENT}
`;

// UserOrganization fragments (for the new schema)
export const USER_ORGANIZATION_FRAGMENT = gql`
  fragment UserOrganizationFields on UserOrganization {
    id
    name
    type
    imageUrl
    description
    userRole
    accessType
    joinedAt
    appCount
  }
`;

// Organization fragments (for backward compatibility)
export const ORGANIZATION_FRAGMENT = gql`
  fragment OrganizationFields on Organization {
    id
    name
    type
    createdAt
    imageUrl
  }
`;

export const ORGANIZATION_WITH_OWNER_FRAGMENT = gql`
  fragment OrganizationWithOwnerFields on Organization {
    ...OrganizationFields
    owner {
      ...UserFields
    }
  }
  ${ORGANIZATION_FRAGMENT}
  ${USER_FRAGMENT}
`;

export const ORGANIZATION_WITH_MEMBERS_FRAGMENT = gql`
  fragment OrganizationWithMembersFields on Organization {
    ...OrganizationWithOwnerFields
    members {
      user {
        ...UserFields
      }
      role
    }
  }
  ${ORGANIZATION_WITH_OWNER_FRAGMENT}
`;

// App fragments
export const APP_FRAGMENT = gql`
  fragment AppFields on App {
    id
    name
    description
    organizationId
    createdAt
  }
`;

export const APP_WITH_OWNER_FRAGMENT = gql`
  fragment AppWithOwnerFields on App {
    ...AppFields
    owner {
      ...UserFields
    }
  }
  ${APP_FRAGMENT}
  ${USER_FRAGMENT}
`;

export const APP_WITH_MEMBERS_FRAGMENT = gql`
  fragment AppWithMembersFields on App {
    ...AppWithOwnerFields
    members {
      ...UserFields
    }
    memberCount
    userRole
  }
  ${APP_WITH_OWNER_FRAGMENT}
`;

// Invitation fragments
export const INVITATION_FRAGMENT = gql`
  fragment InvitationFields on Invitation {
    id
    email
    role
    status
    createdAt
    expiresAt
  }
`;

export const INVITATION_WITH_APP_FRAGMENT = gql`
  fragment InvitationWithAppFields on Invitation {
    ...InvitationFields
    app {
      ...AppFields
    }
  }
  ${INVITATION_FRAGMENT}
  ${APP_FRAGMENT}
`;

// Organization invitation fragments
export const ORG_INVITATION_FRAGMENT = gql`
  fragment OrgInvitationFields on Invitation {
    id
    email
    role
    status
    type
    createdAt
    expiresAt
    invitedBy {
      id
      username
      email
    }
    organization {
      id
      name
    }
  }
`;

// Auth fragments
export const AUTH_PAYLOAD_FRAGMENT = gql`
  fragment AuthPayloadFields on AuthPayload {
    accessToken
    refreshToken
    requirePasswordReset
    user {
      ...UserWithOrgFields
    }
  }
  ${USER_WITH_ORG_FRAGMENT}
`;

export const SIGNUP_RESPONSE_FRAGMENT = gql`
  fragment SignupResponseFields on SignupResponse {
    accessToken
    refreshToken
    user {
      ...UserFields
    }
  }
  ${USER_FRAGMENT}
`;

// Audit log fragments
export const AUDIT_LOG_FRAGMENT = gql`
  fragment AuditLogFields on AuditLog {
    id
    action
    userId
    metadata
    timestamp
  }
`;

// API Key fragments
export const API_KEY_FRAGMENT = gql`
  fragment ApiKeyFields on ApiKey {
    id
    name
    key
    appId
    createdBy
    createdAt
    lastUsedAt
    expiresAt
    isActive
    permissions
  }
`;

export const API_KEYS_RESPONSE_FRAGMENT = gql`
  fragment ApiKeysResponseFields on ApiKeysResponse {
    apiKeys {
      ...ApiKeyFields
    }
    total
  }
  ${API_KEY_FRAGMENT}
`;

// Enhanced User fragments
export const USER_STATS_FRAGMENT = gql`
  fragment UserStatsFields on UserStats {
    totalUsers
    activeUsers
    inactiveUsers
    newUsersToday
    newUsersThisWeek
    newUsersThisMonth
  }
`;

export const USER_WITH_STATS_FRAGMENT = gql`
  fragment UserWithStatsFields on User {
    ...UserFields
    lastSeenAt
    status
    failedLoginAttempts
    lockoutUntil
    profileImage
    firstName
    lastName
    isVerified
    accountType
    preferences
  }
  ${USER_FRAGMENT}
`;

// App Members Response fragment
export const APP_MEMBERS_RESPONSE_FRAGMENT = gql`
  fragment AppMembersResponseFields on AppMembersResponse {
    owner {
      ...UserFields
    }
    members {
      user {
        ...UserFields
      }
      role
      joinedAt
    }
    total
  }
  ${USER_FRAGMENT}
`;

// Apps List Response fragment
export const APPS_RESPONSE_FRAGMENT = gql`
  fragment AppsResponseFields on AppsResponse {
    apps {
      ...AppWithMembersFields
    }
    total
    hasNextPage
    hasPreviousPage
  }
  ${APP_WITH_MEMBERS_FRAGMENT}
`;

// Organizations Response fragment
export const ORGANIZATIONS_RESPONSE_FRAGMENT = gql`
  fragment OrganizationsResponseFields on OrganizationsResponse {
    organizations {
      ...OrganizationWithMembersFields
    }
    total
    hasNextPage
    hasPreviousPage
  }
  ${ORGANIZATION_WITH_MEMBERS_FRAGMENT}
`;

// App Settings fragments
export const APP_GENERAL_SETTINGS_FRAGMENT = gql`
  fragment AppGeneralSettingsFields on AppGeneralSettings {
    website
    description
    logoUrl
    allowedOrigins
    allowedCallbacks
    allowedLogouts
  }
`;

export const APP_AUTH_SETTINGS_FRAGMENT = gql`
  fragment AppAuthSettingsFields on AppAuthSettings {
    enableSignUp
    requireEmailVerification
    allowSocialLogins
    socialProviders
    sessionTimeout
    enablePasswordless
    jwtAlgorithm
    jwtExpiration
  }
`;

export const APP_SECURITY_SETTINGS_FRAGMENT = gql`
  fragment AppSecuritySettingsFields on AppSecuritySettings {
    enableMFA
    enableRateLimit
    rateLimitRequests
    rateLimitWindow
    enableBruteForceProtection
    maxLoginAttempts
    lockoutDuration
    enableAnomalyDetection
  }
`;

export const APP_BRANDING_SETTINGS_FRAGMENT = gql`
  fragment AppBrandingSettingsFields on AppBrandingSettings {
    primaryColor
    secondaryColor
    customCss
    customLogo
    customFavicon
  }
`;

export const APP_WITH_SETTINGS_FRAGMENT = gql`
  fragment AppWithSettingsFields on App {
    ...AppWithOwnerFields
    type
    status
    generalSettings {
      ...AppGeneralSettingsFields
    }
    authSettings {
      ...AppAuthSettingsFields
    }
    securitySettings {
      ...AppSecuritySettingsFields
    }
    brandingSettings {
      ...AppBrandingSettingsFields
    }
    memberCount
    userRole
  }
  ${APP_WITH_OWNER_FRAGMENT}
  ${APP_GENERAL_SETTINGS_FRAGMENT}
  ${APP_AUTH_SETTINGS_FRAGMENT}
  ${APP_SECURITY_SETTINGS_FRAGMENT}
  ${APP_BRANDING_SETTINGS_FRAGMENT}
`;

// Invitation Response fragments
export const SENT_INVITATIONS_FRAGMENT = gql`
  fragment SentInvitationsFields on SentInvitationsResponse {
    invitations {
      ...InvitationWithAppFields
    }
    total
  }
  ${INVITATION_WITH_APP_FRAGMENT}
`;

export const PENDING_INVITATIONS_FRAGMENT = gql`
  fragment PendingInvitationsFields on PendingInvitationsResponse {
    invitations {
      ...InvitationWithAppFields
    }
    total
  }
  ${INVITATION_WITH_APP_FRAGMENT}
`;
