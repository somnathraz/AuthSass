const { gql } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { mergeResolvers } = require('@graphql-tools/merge');

// Import individual schema modules
const userSchema = require('./user.schema');
const organizationSchema = require('./organization.schema');
const appSchema = require('./app.schema');
const invitationSchema = require('./invitation.schema');
const authSchema = require('./auth.schema');
const auditSchema = require('./audit.schema');

// Base schema with shared types and scalars
const baseSchema = gql`
  scalar DateTime
  scalar JSON
  scalar EmailAddress
  scalar ObjectId

  # Common enums
  enum Role {
    SUPER_ADMIN
    ADMIN
    MEMBER
    VIEWER
    OWNER
  }

  enum Status {
    ACTIVE
    INACTIVE
    PENDING
    SUSPENDED
  }

  # Pagination types
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Common interfaces
  interface Node {
    id: ID!
  }

  interface Timestamped {
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Error handling
  type Error {
    message: String!
    code: String!
    field: String
  }

  type SuccessPayload {
    success: Boolean!
    message: String
    errors: [Error!]
  }

  # Root types (will be extended by modules)
  type Query
  type Mutation
  type Subscription
`;

// Import resolvers
const userResolvers = require('../resolvers/user.resolvers');
const organizationResolvers = require('../resolvers/organization.resolvers');
const appResolvers = require('../resolvers/app.resolvers');
const invitationResolvers = require('../resolvers/invitation.resolvers');
const authResolvers = require('../resolvers/auth.resolvers');
const auditResolvers = require('../resolvers/audit.resolvers');
const scalarResolvers = require('../resolvers/scalar.resolvers');

// Combine all schemas
const typeDefs = [
  baseSchema,
  authSchema,
  userSchema,
  organizationSchema,
  appSchema,
  invitationSchema,
  auditSchema,
];

// Properly merge all resolvers using @graphql-tools/merge
const resolvers = mergeResolvers([
  scalarResolvers,
  authResolvers,
  userResolvers,
  organizationResolvers,
  appResolvers,
  invitationResolvers,
  auditResolvers,
]);

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

module.exports = schema; 