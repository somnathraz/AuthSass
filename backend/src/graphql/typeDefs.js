const { gql } = require("apollo-server-express");

module.exports = gql`
  scalar JSON

  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    accountType: String!
    organizationId: ID
    requirePasswordReset: Boolean!
    createdAt: String!
  }
  type OrgInvitation {
    id: ID!
    email: String!
    orgId: ID!
    role: String!
    token: String!
    used: Boolean!
    createdAt: String!
    expiresAt: String!
  }
  type Invitation {
    id: ID!
    email: String!
    appId: ID!
    role: String!
    token: String!
    used: Boolean!
    app: App!
    createdAt: String
    expiresAt: String!
  }
  enum OrgType {
    PERSONAL
    ORGANIZATION
  }

  type Organization {
    id: ID!
    name: String!
    type: OrgType!
    owner: User!
    members: [OrgMember!]!
    createdAt: String!
    imageUrl: String
    type: OrgType!
  }

  type AppMember {
    user: User!
    role: String!
  }

  type App {
    id: ID!
    name: String!
    description: String
    owner: User!
    organizationId: ID!
    members: [AppMember!]!
    createdAt: String!
  }

  type ApiKey {
    id: ID!
    key: String!
    createdAt: String!
    revoked: Boolean!
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String
    user: User!
    requirePasswordReset: Boolean!
  }

  type RefreshResponse {
    accessToken: String!
  }

  type SignupResponse {
    accessToken: String!
    refreshToken: String!
    user: User!
  }
  type OrgMember {
    user: User!
    role: String!
  }

  type OrgMemberResponse {
    owner: User!
    members: [OrgMember!]!
  }

  type AuditLog {
    id: ID!
    action: String!
    userId: ID
    metadata: JSON
    timestamp: String!
  }
  type AcceptInvitePayload {
    accessToken: String!
    refreshToken: String!
    user: User!
    appId: ID!
    organizationId: ID!
  }

  type Query {
    me: User
    listUsers: [User!]!
    auditLogs(appId: ID!): [AuditLog!]!
    allAuditLogs: [AuditLog!]!
    myApps(orgId: ID): [App!]!
    listApiKeys(appId: ID!): [ApiKey!]!
    allOrganizations: [Organization!]!
    userOrganizations: [Organization!]!
    orgMembers(orgId: ID!): OrgMemberResponse!
    invitations(appId: ID!): [Invitation!]!
    myInvitations: [Invitation!]!
    orgInvitations(orgId: ID!): [OrgInvitation!]!
    myOrgInvitations: [OrgInvitation!]!
    organization: Organization # fetch the organization of the logged in user
  }

  type Mutation {
    signup(
      username: String!
      email: String!
      password: String!
    ): SignupResponse!
    login(email: String!, password: String!): AuthPayload!
    inviteUser(appId: ID!, email: String!, role: String!): Invitation!
    cancelInvitation(inviteId: ID!): String!
    # Invitee follows the link and finishes signup (or just “join” if already registered)
    acceptInvite(
      token: String!
      username: String # now optional
      password: String # now optional
    ): AcceptInvitePayload!
    refreshToken(refreshToken: String!): RefreshResponse!
    verifyEmail(token: String!): String
    requestPasswordReset(email: String!): String
    adminCreateUser(appId: ID!, email: String!, role: String!): User!
    # After login, user uses this to set their own password
    changePassword(newPassword: String!): String!
    resetPassword(token: String!, newPassword: String!): String
    updateUserRole(userId: ID!, role: String!): User!
    deleteUser(userId: ID!): String!
    socialLogin(provider: String!, token: String!): AuthPayload!
    createOrganization(name: String!): Organization!
    removeOrganizationMember(orgId: ID!, userId: ID!): Organization!
    inviteOrganizationMember(
      orgId: ID!
      email: String!
      role: String!
    ): OrgInvitation!
    cancelOrgInvitation(inviteId: ID!): String!
    acceptOrganizationInvite(
      token: String!
      username: String # optional for existing users
      password: String # optional for existing users
    ): AuthPayload!
    switchOrganization(orgId: ID!): Organization!
    createApp(name: String!, description: String, orgId: ID!): App!
    updateApp(appId: ID!, name: String, description: String): App!
    deleteApp(appId: ID!): String!
    addAppMember(appId: ID!, email: String!, role: String!): App!
    removeAppMember(appId: ID!, userId: ID!): App!
    updateAppMemberRole(appId: ID!, userId: ID!, role: String!): App!
    createApiKey(appId: ID!): ApiKey!
    revokeApiKey(apiKeyId: ID!): String!
  }
`;
