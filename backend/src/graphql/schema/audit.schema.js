const { gql } = require('apollo-server-express');

const auditSchema = gql`
  extend type Query {
    auditLogs(
      limit: Int = 50
      offset: Int = 0
      sortBy: String = "timestamp"
      sortOrder: SortOrder = DESC
      filter: AuditLogFilter
    ): AuditLogConnection!
    auditLog(id: ID!): AuditLog
    userAuditLogs(userId: ID!, limit: Int = 20, offset: Int = 0): AuditLogConnection!
    organizationAuditLogs(orgId: ID!, limit: Int = 20, offset: Int = 0): AuditLogConnection!
    appAuditLogs(appId: ID!, limit: Int = 20, offset: Int = 0): AuditLogConnection!
    auditStats(filter: AuditStatsFilter): AuditStats!
  }

  type AuditLog implements Node & Timestamped {
    id: ID!
    action: String!
    userId: ID
    user: User
    metadata: JSON!
    ip: String
    userAgent: String
    timestamp: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuditLogConnection {
    logs: [AuditLog!]!
    total: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    currentPage: Int!
    totalPages: Int!
  }

  type AuditStats {
    timeframe: String!
    totalCount: Int!
    topActions: [ActionStat!]!
    topUsers: [UserStat!]!
    recentLogs: [AuditLog!]!
  }

  type ActionStat {
    action: String!
    count: Int!
  }

  type UserStat {
    userId: ID!
    username: String
    email: String
    count: Int!
  }

  input AuditLogFilter {
    action: String
    userId: ID
    startDate: DateTime
    endDate: DateTime
    ip: String
    search: String
  }

  input AuditStatsFilter {
    timeframe: AuditTimeframe = DAY
    startDate: DateTime
    endDate: DateTime
    userId: ID
    orgId: ID
    appId: ID
  }

  enum AuditTimeframe {
    DAY
    WEEK
    MONTH
    YEAR
  }
`;

module.exports = auditSchema; 