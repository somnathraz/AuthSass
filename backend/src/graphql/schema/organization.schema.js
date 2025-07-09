const { gql } = require('apollo-server-express');

const organizationSchema = gql`
  extend type Query {
    organization(id: ID!): Organization
    organizations(
      limit: Int = 10
      offset: Int = 0
      sortBy: String = "createdAt"
      sortOrder: SortOrder = DESC
      filter: OrganizationFilter
    ): OrganizationConnection!
    myOrganizations: [Organization!]!
    organizationMembers(orgId: ID!): OrganizationMembersResponse!
    allOrganizations: [Organization!]!
  }

  extend type Mutation {
    createOrganization(input: CreateOrganizationInput!): OrganizationResponse!
    updateOrganization(id: ID!, input: UpdateOrganizationInput!): OrganizationResponse!
    updateOrganizationSettings(id: ID!, input: UpdateOrganizationSettingsInput!): OrganizationResponse!
    updatePasswordPolicy(id: ID!, input: PasswordPolicyInput!): OrganizationResponse!
    updateDomainSettings(id: ID!, input: DomainSettingsInput!): OrganizationResponse!
    updateBrandingSettings(id: ID!, input: BrandingSettingsInput!): OrganizationResponse!
    updateNotificationSettings(id: ID!, input: NotificationSettingsInput!): OrganizationResponse!
    updateAnalyticsSettings(id: ID!, input: AnalyticsSettingsInput!): OrganizationResponse!
    deleteOrganization(id: ID!): SuccessPayload!
    addOrganizationMember(input: AddMemberInput!): OrganizationResponse!
    removeOrganizationMember(input: RemoveMemberInput!): OrganizationResponse!
    updateMemberRole(input: UpdateMemberRoleInput!): OrganizationResponse!
    switchOrganization(orgId: ID!): Organization!
  }

  extend type Subscription {
    organizationUpdated(orgId: ID!): Organization!
    organizationMembershipChanged(orgId: ID!): OrganizationMembershipEvent!
  }

  type Organization implements Node & Timestamped {
    id: ID!
    name: String!
    description: String
    type: OrganizationType!
    status: Status!
    imageUrl: String
    website: String
    slug: String
    supportEmail: String
    timezone: String!
    contactName: String
    contactEmail: String
    contactPhone: String
    passwordPolicy: PasswordPolicy!
    domainSettings: DomainSettings!
    branding: BrandingSettings!
    notifications: NotificationSettings!
    analytics: AnalyticsSettings!
    settings: JSON
    owner: User!
    members: [User!]!
    memberCount: Int!
    userRole: Role # Role of current user in this organization
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PasswordPolicy {
    minLength: Int!
    requireUppercase: Boolean!
    requireLowercase: Boolean!
    requireNumbers: Boolean!
    requireSpecialChars: Boolean!
    passwordHistory: Int!
    passwordExpiration: Int!
    maxLoginAttempts: Int!
    lockoutDuration: Int!
    enableMFA: Boolean!
    sessionTimeout: Int!
    allowPasswordReset: Boolean!
    enforcePasswordComplexity: Boolean!
  }

  type DomainSettings {
    allowedCallbackUrls: [String!]!
    allowedLogoutUrls: [String!]!
    allowedWebOrigins: [String!]!
    customDomain: String
    sdkAllowedDomains: [String!]!
    enableCORS: Boolean!
    corsMaxAge: Int!
  }

  type BrandingSettings {
    primaryColor: String!
    secondaryColor: String!
    logoUrl: String
    faviconUrl: String
    customCss: String
  }

  type NotificationSettings {
    emailNotifications: Boolean!
    securityAlerts: Boolean!
    marketingEmails: Boolean!
    weeklyReports: Boolean!
    systemUpdates: Boolean!
  }

  type AnalyticsSettings {
    enableTracking: Boolean!
    retentionPeriod: Int!
    exportFormat: ExportFormat!
  }

  type OrganizationMember {
    user: User!
    role: Role!
    status: Status!
    joinedAt: DateTime!
  }

  type OrganizationMembersResponse {
    owner: User!
    members: [OrganizationMember!]!
    total: Int!
  }

  type OrganizationConnection {
    organizations: [Organization!]!
    total: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type OrganizationResponse {
    success: Boolean!
    organization: Organization
    errors: [Error!]
  }

  type OrganizationMembershipEvent {
    organization: Organization!
    member: User!
    action: MembershipAction!
    role: Role
    timestamp: DateTime!
  }

  enum OrganizationType {
    PERSONAL
    TEAM
    COMPANY
    ENTERPRISE
  }

  enum MembershipAction {
    ADDED
    REMOVED
    ROLE_UPDATED
    STATUS_CHANGED
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum ExportFormat {
    JSON
    CSV
  }

  input CreateOrganizationInput {
    name: String!
    description: String
    type: OrganizationType!
    imageUrl: String
    website: String
    settings: JSON
  }

  input UpdateOrganizationInput {
    name: String
    description: String
    imageUrl: String
    website: String
    settings: JSON
  }

  input UpdateOrganizationSettingsInput {
    name: String
    slug: String
    description: String
    website: String
    supportEmail: String
    timezone: String
    contactName: String
    contactEmail: String
    contactPhone: String
    imageUrl: String
  }

  input PasswordPolicyInput {
    minLength: Int
    requireUppercase: Boolean
    requireLowercase: Boolean
    requireNumbers: Boolean
    requireSpecialChars: Boolean
    passwordHistory: Int
    passwordExpiration: Int
    maxLoginAttempts: Int
    lockoutDuration: Int
    enableMFA: Boolean
    sessionTimeout: Int
    allowPasswordReset: Boolean
    enforcePasswordComplexity: Boolean
  }

  input DomainSettingsInput {
    allowedCallbackUrls: [String!]
    allowedLogoutUrls: [String!]
    allowedWebOrigins: [String!]
    customDomain: String
    sdkAllowedDomains: [String!]
    enableCORS: Boolean
    corsMaxAge: Int
  }

  input BrandingSettingsInput {
    primaryColor: String
    secondaryColor: String
    logoUrl: String
    faviconUrl: String
    customCss: String
  }

  input NotificationSettingsInput {
    emailNotifications: Boolean
    securityAlerts: Boolean
    marketingEmails: Boolean
    weeklyReports: Boolean
    systemUpdates: Boolean
  }

  input AnalyticsSettingsInput {
    enableTracking: Boolean
    retentionPeriod: Int
    exportFormat: ExportFormat
  }

  input AddMemberInput {
    orgId: ID!
    userId: ID!
    role: Role!
  }

  input RemoveMemberInput {
    orgId: ID!
    userId: ID!
  }

  input UpdateMemberRoleInput {
    orgId: ID!
    userId: ID!
    role: Role!
  }

  input OrganizationFilter {
    name: String
    type: OrganizationType
    status: Status
    search: String
  }
`;

module.exports = organizationSchema; 