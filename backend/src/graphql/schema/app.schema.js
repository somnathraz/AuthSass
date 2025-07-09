const { gql } = require('apollo-server-express');

const appSchema = gql`
  extend type Query {
    app(id: ID!): App
    apps(
      limit: Int = 10
      offset: Int = 0
      sortBy: String = "createdAt"
      sortOrder: SortOrder = DESC
      filter: AppFilter
    ): AppConnection!
    myApps: [App!]!
    appMembers(appId: ID!): AppMembersResponse!
    appApiKeys(appId: ID!): ApiKeysResponse!
    appLogs(
      appId: ID!
      limit: Int = 50
      offset: Int = 0
      eventType: String
      dateFrom: DateTime
      dateTo: DateTime
    ): AppLogsResponse!
  }

  extend type Mutation {
    createApp(input: CreateAppInput!): AppResponse!
    updateApp(id: ID!, input: UpdateAppInput!): AppResponse!
    deleteApp(id: ID!): SuccessPayload!
    addAppMember(input: AddAppMemberInput!): AppResponse!
    removeAppMember(input: RemoveAppMemberInput!): AppResponse!
    updateAppMemberRole(input: UpdateAppMemberRoleInput!): AppResponse!
    createApiKey(input: CreateApiKeyInput!): ApiKeyResponse!
    revokeApiKey(id: ID!): SuccessPayload!
    updateApiKey(id: ID!, input: UpdateApiKeyInput!): ApiKeyResponse!
    archiveApp(appId: ID!): AppResponse!
    unarchiveApp(appId: ID!): AppResponse!
    bulkUpdateAppStatus(appIds: [ID!]!, status: Status!): BulkUpdateResponse!
    bulkDeleteApps(appIds: [ID!]!): BulkDeleteResponse!
    transferAppOwnership(appId: ID!, newOwnerId: ID!): AppResponse!
    cloneApp(appId: ID!, name: String!, organizationId: ID): AppResponse!
    regenerateApiKey(input: RevokeApiKeyInput!): ApiKeyResponse!
    
    # App Settings Mutations
    updateAppGeneralSettings(id: ID!, input: AppGeneralSettingsInput!): AppResponse!
    updateAppAuthSettings(id: ID!, input: AppAuthSettingsInput!): AppResponse!
    updateAppSecuritySettings(id: ID!, input: AppSecuritySettingsInput!): AppResponse!
    updateAppBrandingSettings(id: ID!, input: AppBrandingSettingsInput!): AppResponse!
  }

  extend type Subscription {
    appUpdated(appId: ID!): App!
    appMembershipChanged(appId: ID!): AppMembershipEvent!
  }

  type App implements Node & Timestamped {
    id: ID!
    name: String!
    description: String
    status: Status!
    type: AppType!
    settings: JSON
    organizationId: ID!
    organization: Organization!
    owner: User!
    members: [User!]!
    memberCount: Int!
    apiKeys: [ApiKey!]!
    userRole: Role # Role of current user in this app
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Settings fields
    generalSettings: AppGeneralSettings
    authSettings: AppAuthSettings
    securitySettings: AppSecuritySettings
    brandingSettings: AppBrandingSettings
  }

  type AppMember {
    user: User!
    role: Role!
    status: Status!
    joinedAt: DateTime!
  }

  type AppMembersResponse {
    owner: User!
    members: [AppMember!]!
    total: Int!
  }

  type AppConnection {
    apps: [App!]!
    total: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type AppResponse {
    success: Boolean!
    app: App
    errors: [Error!]
  }

  type AppMembershipEvent {
    app: App!
    member: User!
    action: MembershipAction!
    role: Role
    timestamp: DateTime!
  }

  type ApiKey implements Node & Timestamped {
    id: ID!
    name: String!
    key: String!
    permissions: [String!]!
    isActive: Boolean!
    lastUsedAt: DateTime
    expiresAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ApiKeysResponse {
    apiKeys: [ApiKey!]!
    total: Int!
  }

  type ApiKeyResponse {
    success: Boolean!
    apiKey: ApiKey
    errors: [Error!]
  }

  type BulkUpdateResponse {
    success: Boolean!
    message: String!
    updatedCount: Int!
    errors: [Error!]
  }

  type BulkDeleteResponse {
    success: Boolean!
    message: String!
    deletedCount: Int!
    errors: [Error!]
  }

  # App Logs Types (Industry Standard)
  type AppLog {
    id: ID!
    appId: ID!
    eventType: LogEventType!
    eventCategory: LogEventCategory!
    severity: LogSeverity!
    message: String!
    metadata: JSON
    userId: ID
    user: User
    ipAddress: String
    userAgent: String
    location: LogLocation
    timestamp: DateTime!
  }

  type AppLogsResponse {
    logs: [AppLog!]!
    total: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type LogLocation {
    country: String
    region: String
    city: String
    latitude: Float
    longitude: Float
  }

  # App Settings Types
  type AppGeneralSettings {
    website: String
    description: String
    logoUrl: String
    allowedOrigins: [String!]!
    allowedCallbacks: [String!]!
    allowedLogouts: [String!]!
  }

  type AppAuthSettings {
    enableSignUp: Boolean!
    requireEmailVerification: Boolean!
    allowSocialLogins: Boolean!
    socialProviders: [SocialProvider!]!
    sessionTimeout: Int! # in hours
    enablePasswordless: Boolean!
    jwtAlgorithm: JWTAlgorithm!
    jwtExpiration: Int! # in hours
  }

  type AppSecuritySettings {
    enableMFA: Boolean!
    enableRateLimit: Boolean!
    rateLimitRequests: Int!
    rateLimitWindow: Int! # in minutes
    enableBruteForceProtection: Boolean!
    maxLoginAttempts: Int!
    lockoutDuration: Int! # in minutes
    enableAnomalyDetection: Boolean!
  }

  type AppBrandingSettings {
    primaryColor: String!
    secondaryColor: String!
    customCss: String
    customLogo: String
    customFavicon: String
  }

  enum AppType {
    WEB
    MOBILE
    API
    SERVICE
  }

  enum LogEventType {
    # Authentication Events
    LOGIN_SUCCESS
    LOGIN_FAILED
    LOGOUT
    PASSWORD_RESET_REQUEST
    PASSWORD_RESET_SUCCESS
    EMAIL_VERIFICATION
    MFA_CHALLENGE
    MFA_SUCCESS
    MFA_FAILED
    
    # Registration Events
    SIGNUP_SUCCESS
    SIGNUP_FAILED
    
    # Admin Actions
    APP_UPDATED
    APP_MEMBER_ADDED
    APP_MEMBER_REMOVED
    APP_MEMBER_ROLE_UPDATED
    API_KEY_CREATED
    API_KEY_REVOKED
    SETTINGS_UPDATED
    
    # Security Events
    RATE_LIMIT_EXCEEDED
    BRUTE_FORCE_DETECTED
    SUSPICIOUS_LOGIN
    ACCOUNT_LOCKED
    ACCOUNT_UNLOCKED
    
    # API Events
    API_REQUEST
    API_ERROR
    WEBHOOK_SENT
    WEBHOOK_FAILED
  }

  enum LogEventCategory {
    AUTHENTICATION
    AUTHORIZATION
    ADMIN
    SECURITY
    API
    SYSTEM
  }

  enum LogSeverity {
    INFO
    WARNING
    ERROR
    CRITICAL
  }

  enum SocialProvider {
    GOOGLE
    FACEBOOK
    TWITTER
    GITHUB
    LINKEDIN
    MICROSOFT
  }

  enum JWTAlgorithm {
    HS256
    HS384
    HS512
    RS256
    RS384
    RS512
    ES256
    ES384
    ES512
  }

  input CreateAppInput {
    name: String!
    description: String
    type: AppType!
    organizationId: ID!
    settings: JSON
  }

  input UpdateAppInput {
    name: String
    description: String
    status: Status
    settings: JSON
  }

  input AddAppMemberInput {
    appId: ID!
    userId: ID!
    role: Role!
  }

  input RemoveAppMemberInput {
    appId: ID!
    userId: ID!
  }

  input UpdateAppMemberRoleInput {
    appId: ID!
    userId: ID!
    role: Role!
  }

  input AppFilter {
    name: String
    type: AppType
    status: Status
    organizationId: ID
    search: String
  }

  input CreateApiKeyInput {
    appId: ID!
    name: String!
    permissions: [String!] = ["read"]
    expiresAt: DateTime
  }

  input UpdateApiKeyInput {
    name: String
    permissions: [String!]
    expiresAt: DateTime
  }

  input RevokeApiKeyInput {
    appId: ID!
    keyId: ID!
  }

  # App Settings Input Types
  input AppGeneralSettingsInput {
    website: String
    description: String
    logoUrl: String
    allowedOrigins: [String!]
    allowedCallbacks: [String!]
    allowedLogouts: [String!]
  }

  input AppAuthSettingsInput {
    enableSignUp: Boolean
    requireEmailVerification: Boolean
    allowSocialLogins: Boolean
    socialProviders: [SocialProvider!]
    sessionTimeout: Int
    enablePasswordless: Boolean
    jwtAlgorithm: JWTAlgorithm
    jwtExpiration: Int
  }

  input AppSecuritySettingsInput {
    enableMFA: Boolean
    enableRateLimit: Boolean
    rateLimitRequests: Int
    rateLimitWindow: Int
    enableBruteForceProtection: Boolean
    maxLoginAttempts: Int
    lockoutDuration: Int
    enableAnomalyDetection: Boolean
  }

  input AppBrandingSettingsInput {
    primaryColor: String
    secondaryColor: String
    customCss: String
    customLogo: String
    customFavicon: String
  }
`;

module.exports = appSchema; 