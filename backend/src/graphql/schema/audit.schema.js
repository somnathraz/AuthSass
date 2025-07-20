const { gql } = require("apollo-server-express");

const auditTypeDefs = gql`
  # Enum for audit log tiers
  enum AuditLogTier {
    PLATFORM
    CUSTOMER
    APPLICATION
  }

  # Enum for event categories
  enum EventCategory {
    AUTHENTICATION
    AUTHORIZATION
    ORGANIZATION
    APPLICATION
    USER_MANAGEMENT
    API_KEY
    SETTINGS
    BILLING
    SECURITY
    INTEGRATION
    SYSTEM
  }

  # Enum for actor types
  enum ActorType {
    USER
    ADMIN
    SYSTEM
    API_KEY
    WEBHOOK
  }

  # Actor information
  type AuditActor {
    id: ID
    type: ActorType!
    email: String
    name: String
    ip: String
    userAgent: String
    location: String
  }

  # Event metadata
  type AuditMetadata {
    organizationName: String
    applicationName: String
    targetUserId: String
    targetUserEmail: String
    changes: String # JSON string of before/after changes
    apiKeyId: String
    sessionId: String
    requestId: String
    platform: String
    customData: String # JSON string for additional data
  }

  # Main audit log type
  type AuditLog {
    id: ID!
    logTier: AuditLogTier!

    # Hierarchical identifiers
    customerId: ID
    applicationId: ID

    # Event details
    eventType: String!
    eventCategory: EventCategory!
    description: String!

    # Actor information
    actor: AuditActor!

    # Metadata
    metadata: AuditMetadata

    # Timestamps
    timestamp: String!
    createdAt: String!

    # Status
    severity: String # LOW, MEDIUM, HIGH, CRITICAL
    success: Boolean!
  }

  # Input types for filtering
  input AuditLogFilter {
    logTier: AuditLogTier
    customerId: ID
    applicationId: ID
    eventCategory: EventCategory
    actorType: ActorType
    severity: String
    success: Boolean
    startDate: String
    endDate: String
    searchTerm: String # Search in eventType, description
  }

  # Pagination input
  input PaginationInput {
    page: Int = 1
    limit: Int = 20
    sortBy: String = "timestamp"
    sortOrder: String = "DESC"
  }

  # Paginated audit logs response
  type PaginatedAuditLogs {
    logs: [AuditLog!]!
    pagination: Pagination!
  }

  type Pagination {
    page: Int!
    limit: Int!
    totalCount: Int!
    totalPages: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  # Analytics aggregation types
  type AuditAnalytics {
    totalEvents: Int!
    eventsByCategory: [CategoryCount!]!
    eventsByTier: [TierCount!]!
    recentActivity: [AuditLog!]!
    topActors: [ActorActivity!]!
    successRate: Float!
    timelineData: [TimelinePoint!]!
  }

  type CategoryCount {
    category: EventCategory!
    count: Int!
  }

  type TierCount {
    tier: AuditLogTier!
    count: Int!
  }

  type ActorActivity {
    actorId: String!
    actorEmail: String
    eventCount: Int!
    lastActivity: String!
  }

  type TimelinePoint {
    date: String!
    count: Int!
    successCount: Int!
    failureCount: Int!
  }

  # Queries
  type Query {
    # Get audit logs with filtering and pagination
    auditLogs(
      filter: AuditLogFilter
      pagination: PaginationInput
    ): PaginatedAuditLogs!

    # Get specific audit log by ID
    auditLog(id: ID!): AuditLog

    # Get platform-tier logs (admin only)
    platformAuditLogs(
      filter: AuditLogFilter
      pagination: PaginationInput
    ): PaginatedAuditLogs!

    # Get customer-tier logs for specific organization
    customerAuditLogs(
      customerId: ID!
      filter: AuditLogFilter
      pagination: PaginationInput
    ): PaginatedAuditLogs!

    # Get application-tier logs for specific app
    applicationAuditLogs(
      applicationId: ID!
      filter: AuditLogFilter
      pagination: PaginationInput
    ): PaginatedAuditLogs!

    # Get audit analytics for dashboard
    auditAnalytics(
      customerId: ID
      applicationId: ID
      timeRange: String = "7d" # 1d, 7d, 30d, 90d
    ): AuditAnalytics!

    # Export audit logs (returns download URL)
    exportAuditLogs(
      filter: AuditLogFilter
      format: String = "JSON" # JSON, CSV
    ): String!
  }

  # Mutations
  type Mutation {
    # Manual audit log creation (for testing/admin)
    createAuditLog(
      logTier: AuditLogTier!
      customerId: ID
      applicationId: ID
      eventType: String!
      eventCategory: EventCategory!
      description: String!
      actorId: ID
      actorType: ActorType!
      metadata: String # JSON string
      severity: String = "LOW"
    ): AuditLog!

    # Bulk delete old audit logs (admin only)
    cleanupAuditLogs(
      olderThanDays: Int!
      logTier: AuditLogTier
      dryRun: Boolean = true
    ): Int! # Returns count of logs that would be/were deleted
  }
`;

module.exports = auditTypeDefs;
