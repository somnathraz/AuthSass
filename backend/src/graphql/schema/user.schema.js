const { gql } = require('apollo-server-express');

module.exports = gql`
  # User type implementing common interfaces
  type User implements Node & Timestamped {
    id: ID!
    username: String!
    email: EmailAddress!
    role: Role!
    status: Status!
    accountType: AccountType!
    organizationId: ID
    organization: Organization
    requirePasswordReset: Boolean!
    isVerified: Boolean!
    lastLoginAt: DateTime
    profileImage: String
    firstName: String
    lastName: String
    bio: String
    location: String
    website: String
    fullName: String
    timezone: String
    locale: String
    preferences: UserPreferences
    tokenStats: TokenStats
    
    # Audit fields
    createdAt: DateTime!
    updatedAt: DateTime!
    createdBy: User
    
    # Computed fields
    isOnline: Boolean!
    displayName: String!
    
    # Permissions
    permissions: [Permission!]!
    canAccess(resource: String!, action: String!): Boolean!
    
    # Enhanced organization access for users
    personalOrganization: Organization
    organizations(filters: OrganizationFilters): [UserOrganization!]!
    apps(filters: AppFilters, pagination: PaginationInput): UserAppsResult!
  }

  # User preferences
  type UserPreferences {
    notifications: NotificationPreferences!
    privacy: PrivacyPreferences!
    appearance: AppearancePreferences!
  }

  type NotificationPreferences {
    email: Boolean!
    push: Boolean!
    sms: Boolean!
    inApp: Boolean!
    frequency: NotificationFrequency!
  }

  type PrivacyPreferences {
    profileVisibility: ProfileVisibility!
    dataSharing: Boolean!
    analyticsOptOut: Boolean!
  }

  type AppearancePreferences {
    theme: Theme!
    language: String!
    dateFormat: String!
    timeFormat: TimeFormat!
  }

  # Enums
  enum AccountType {
    PERSONAL
    BUSINESS
    ENTERPRISE
  }

  enum NotificationFrequency {
    IMMEDIATE
    HOURLY
    DAILY
    WEEKLY
    NEVER
  }

  enum ProfileVisibility {
    PUBLIC
    ORGANIZATION
    PRIVATE
  }

  enum Theme {
    LIGHT
    DARK
    AUTO
  }

  enum TimeFormat {
    FORMAT_12
    FORMAT_24
  }

  # Input types
  input UserUpdateInput {
    username: String
    firstName: String
    lastName: String
    timezone: String
    locale: String
    profileImage: String
  }

  input UserPreferencesInput {
    notifications: NotificationPreferencesInput
    privacy: PrivacyPreferencesInput
    appearance: AppearancePreferencesInput
  }

  input NotificationPreferencesInput {
    email: Boolean
    push: Boolean
    sms: Boolean
    inApp: Boolean
    frequency: NotificationFrequency
  }

  input PrivacyPreferencesInput {
    profileVisibility: ProfileVisibility
    dataSharing: Boolean
    analyticsOptOut: Boolean
  }

  input AppearancePreferencesInput {
    theme: Theme
    language: String
    dateFormat: String
    timeFormat: TimeFormat
  }

  input UserFilterInput {
    role: Role
    status: Status
    accountType: AccountType
    organizationId: ID
    search: String
    isVerified: Boolean
  }

  input UserSortInput {
    field: UserSortField!
    direction: SortDirection!
  }

  enum UserSortField {
    CREATED_AT
    USERNAME
    EMAIL
    LAST_LOGIN
    ROLE
  }

  enum SortDirection {
    ASC
    DESC
  }

  # Connection types for pagination
  type UserConnection {
    users: [User!]!
    total: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type UserEdge {
    cursor: String!
    node: User!
  }

  # Payload types
  type UserUpdatePayload {
    success: Boolean!
    user: User
    errors: [Error!]
  }

  type UserDeletePayload {
    success: Boolean!
    deletedUserId: ID
    errors: [Error!]
  }

  type Permission {
    id: ID!
    resource: String!
    actions: [String!]!
    scope: PermissionScope!
  }

  enum PermissionScope {
    GLOBAL
    ORGANIZATION
    APP
    SELF
  }

  # Enhanced organization access for users
  type UserOrganization {
    id: ID!
    name: String!
    type: OrganizationType!
    imageUrl: String
    description: String
    userRole: Role!
    accessType: AccessType!
    joinedAt: DateTime!
    appCount: Int!
    accessibleApps: [UserApp!]!
    permissions: OrganizationPermissions!
  }

  # Enhanced app access for users  
  type UserApp {
    id: ID!
    name: String!
    description: String
    organization: AppOrganization!
    userRole: Role!
    accessType: AccessType!
    grantedAt: DateTime
    grantedBy: User
    permissions: AppPermissions!
  }

  type AppOrganization {
    id: ID!
    name: String!
    type: OrganizationType!
  }

  type UserAppsResult {
    apps: [UserApp!]!
    total: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  # Permission types
  type OrganizationPermissions {
    canCreateApps: Boolean!
    canInviteMembers: Boolean!
    canManageSettings: Boolean!
  }

  type AppPermissions {
    canRead: Boolean!
    canWrite: Boolean!
    canDelete: Boolean!
    canInvite: Boolean!
    canManageSettings: Boolean!
  }

  # Access details
  type UserAppAccess {
    hasAccess: Boolean!
    accessType: AccessType!
    role: Role!
    permissions: AppPermissions!
  }

  type UserOrgAccess {
    hasAccess: Boolean!
    role: Role!
    accessType: AccessType!
    joinedAt: DateTime!
    permissions: OrganizationPermissions!
    appPermissions: [AppPermission!]!
  }

  type AppPermission {
    app: App!
    role: Role!
    grantedAt: DateTime!
    grantedBy: User!
    status: PermissionStatus!
  }

  # Enums
  enum UserStatus {
    ACTIVE
    INACTIVE
    PENDING
    SUSPENDED
  }

  enum AccessType {
    FULL
    SCOPED
    DIRECT
    ORGANIZATION
  }

  enum PermissionStatus {
    ACTIVE
    SUSPENDED
    REVOKED
  }

  # Input types for filtering
  input OrganizationFilters {
    type: OrganizationType
    accessType: AccessType
    role: Role
  }

  input AppFilters {
    organizationId: ID
    accessType: AccessType
    role: Role
  }

  input PaginationInput {
    offset: Int = 0
    limit: Int = 20
  }

  input UserOrganizationsInput {
    filters: OrganizationFilters
  }

  input UserAppsInput {
    filters: AppFilters
    pagination: PaginationInput
  }

  # Mutations
  input CreateUserInput {
    username: String!
    email: EmailAddress!
    firstName: String!
    lastName: String!
    password: String!
    role: Role = MEMBER
    accountType: AccountType = PERSONAL
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    profileImage: String
    preferences: JSON
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
    confirmPassword: String!
  }

  # Extend root types
  extend type Query {
    # Single user queries
    user(id: ID!): User
    userByEmail(email: EmailAddress!): User
    userByUsername(username: String!): User
    
    # User list queries with pagination and filtering
    users(
      limit: Int = 10
      offset: Int = 0
      sortBy: String = "createdAt"
      sortOrder: SortOrder = DESC
      filter: UserFilterInput
    ): UserConnection!
    
    # User analytics
    userAnalytics(userId: ID!, period: AnalyticsPeriod!): UserAnalytics!
    
    # User stats
    userStats: UserStats!
    
    # Current user queries
    currentUser: User
    userProfile: User
    
    # Organization and app access queries
    userOrganizations(input: UserOrganizationsInput): [UserOrganization!]!
    userApps(input: UserAppsInput): UserAppsResult!
    userAppAccess(appId: ID!): UserAppAccess!
    userOrgAccess(orgId: ID!): UserOrgAccess!
    
    # Search and discovery
    searchUsers(query: String!, filters: JSON): UsersResult!
  }

  extend type Mutation {
    # User management
    updateUser(id: ID!, input: UserUpdateInput!): UserUpdatePayload!
    updateUserPreferences(input: UserPreferencesInput!): UserUpdatePayload!
    updateUserRole(userId: ID!, role: Role!): UserUpdatePayload!
    updateUserStatus(userId: ID!, status: Status!): UserUpdatePayload!
    deleteUser(id: ID!): UserDeletePayload!
    
    # Bulk operations
    bulkUpdateUsers(userIds: [ID!]!, input: UserUpdateInput!): BulkUpdatePayload!
    bulkDeleteUsers(userIds: [ID!]!): BulkDeletePayload!
    
    # User verification
    verifyUser(userId: ID!): UserUpdatePayload!
    unverifyUser(userId: ID!): UserUpdatePayload!
    
    # Profile management
    updateProfile(
      firstName: String
      lastName: String
      bio: String
      location: String
      website: String
    ): User!
    updateAvatar(avatar: String!): User!
    updatePassword(currentPassword: String!, newPassword: String!): String!
    updateEmail(newEmail: String!, password: String!): User!
    
    # User Settings
    updateUserSettings(
      emailNotifications: Boolean
      securityAlerts: Boolean
      loginNotifications: Boolean
      marketingEmails: Boolean
    ): User!
    
    # Account Management
    deleteAccount(password: String!, confirmation: String!): String!
    exportUserData: String!
    
    # Account management (existing)
    deactivateAccount: SuccessPayload!
    reactivateAccount(password: String!): SuccessPayload!
  }

  extend type Subscription {
    # User events
    userUpdated: User!
    userStatusChanged: UserStatusEvent!
    userOnlineStatusChanged: UserOnlineEvent!
  }

  # Supporting types
  type UserAnalytics {
    totalLogins: Int!
    lastLoginAt: DateTime
    averageSessionDuration: Int!
    activityScore: Float!
    engagementMetrics: EngagementMetrics!
  }

  type EngagementMetrics {
    dailyActiveStreaks: Int!
    featuresUsed: [String!]!
    timeSpentByFeature: JSON!
  }

  type UserStatusEvent {
    userId: ID!
    oldStatus: Status!
    newStatus: Status!
    changedBy: User!
    reason: String
    timestamp: DateTime!
  }

  type UserOnlineEvent {
    userId: ID!
    isOnline: Boolean!
    lastSeen: DateTime!
  }

  type BulkUpdatePayload {
    success: Boolean!
    updatedCount: Int!
    errors: [Error!]
  }

  type BulkDeletePayload {
    success: Boolean!
    deletedCount: Int!
    errors: [Error!]
  }

  enum AnalyticsPeriod {
    DAY
    WEEK
    MONTH
    QUARTER
    YEAR
  }

  type UserStats {
    totalUsers: Int!
    activeUsers: Int!
    newUsersToday: Int!
    newUsersThisWeek: Int!
    newUsersThisMonth: Int!
    usersByRole: [RoleCount!]!
    usersByStatus: [StatusCount!]!
    usersByAccountType: [AccountTypeCount!]!
  }

  type RoleCount {
    role: Role!
    count: Int!
  }

  type StatusCount {
    status: Status!
    count: Int!
  }

  type AccountTypeCount {
    accountType: AccountType!
    count: Int!
  }

  type TokenStats {
    activeTokens: Int!
    totalTokens: Int!
    lastTokenCreated: DateTime
    lastTokenUsed: DateTime
  }

  type SuccessPayload {
    success: Boolean!
    message: String
  }

  type UsersResult {
    users: [User!]!
    total: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }
`; 