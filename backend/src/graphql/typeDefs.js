const { gql } = require("apollo-server-express");

module.exports = gql`
  scalar JSON

  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    createdAt: String!
  }

  type App {
    id: ID!
    name: String!
    description: String
    owner: User!
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
  }

  type RefreshResponse {
    accessToken: String!
  }

  type SignupResponse {
    message: String!
  }

  type AuditLog {
    id: ID!
    action: String!
    userId: ID
    metadata: JSON
    timestamp: String!
  }

  type Query {
    me: User
    listUsers: [User!]!
    auditLogs: [AuditLog!]!
    myApps: [App!]! # List all apps for the authenticated user
    listApiKeys(appId: ID!): [ApiKey!]! # List API keys for a specific app
  }

  type Mutation {
    signup(
      username: String!
      email: String!
      password: String!
    ): SignupResponse!
    login(email: String!, password: String!): AuthPayload!
    refreshToken(refreshToken: String!): RefreshResponse!
    verifyEmail(token: String!): String
    requestPasswordReset(email: String!): String
    resetPassword(token: String!, newPassword: String!): String
    updateUserRole(userId: ID!, role: String!): User!
    deleteUser(userId: ID!): String!
    socialLogin(provider: String!, token: String!): AuthPayload!
    createApp(name: String!, description: String): App!
    updateApp(appId: ID!, name: String, description: String): App!
    deleteApp(appId: ID!): String!
    createApiKey(appId: ID!): ApiKey!
    revokeApiKey(apiKeyId: ID!): String!
  }
`;
