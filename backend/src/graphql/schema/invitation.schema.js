const { gql } = require('apollo-server-express');

const invitationSchema = gql`
  extend type Query {
    invitation(id: ID!): Invitation
    invitations(
      limit: Int = 10
      offset: Int = 0
      sortBy: String = "createdAt"
      sortOrder: SortOrder = DESC
      filter: InvitationFilter
    ): InvitationConnection!
    myInvitations: [Invitation!]!
    sentInvitations: [Invitation!]!
    pendingInvitations: [Invitation!]!
    orgInvitations(orgId: ID!): [Invitation!]!
  }

  extend type Mutation {
    createInvitation(input: CreateInvitationInput!): InvitationResponse!
    acceptInvitation(token: String!): AcceptInvitationResponse!
    acceptInvite(token: String!, username: String, password: String): AcceptInvitationResponse!
    declineInvitation(token: String!): SuccessPayload!
    cancelInvitation(id: ID!): SuccessPayload!
    resendInvitation(id: ID!): InvitationResponse!
  }

  extend type Subscription {
    invitationCreated(userId: ID!): Invitation!
    invitationUpdated(userId: ID!): Invitation!
  }

  type Invitation implements Node & Timestamped {
    id: ID!
    email: String!
    role: Role!
    status: InvitationStatus!
    type: InvitationType!
    token: String
    invitedBy: User!
    invitedUser: User
    organization: Organization
    app: App
    expiresAt: DateTime!
    acceptedAt: DateTime
    declinedAt: DateTime
    canceledAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type InvitationConnection {
    invitations: [Invitation!]!
    total: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type InvitationResponse {
    success: Boolean!
    invitation: Invitation
    user: User
    errors: [Error!]
  }

  type AcceptInvitationResponse {
    accessToken: String
    refreshToken: String
    user: User
    appId: String
    organizationId: String
    requiresUserSetup: Boolean!
    userExists: Boolean!
    email: String
  }

  enum InvitationType {
    ORGANIZATION
    APPLICATION
    GENERAL
  }

  enum InvitationStatus {
    PENDING
    ACCEPTED
    DECLINED
    EXPIRED
    CANCELED
  }

  input CreateInvitationInput {
    email: String!
    role: Role!
    type: InvitationType!
    organizationId: ID
    appId: ID
    message: String
  }

  input InvitationFilter {
    email: String
    status: InvitationStatus
    type: InvitationType
    organizationId: ID
    appId: ID
    invitedBy: ID
    search: String
  }
`;

module.exports = invitationSchema; 