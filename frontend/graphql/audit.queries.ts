import { gql } from "@apollo/client";

// Get customer audit logs for organization
export const GET_CUSTOMER_AUDIT_LOGS = gql`
  query GetCustomerAuditLogs(
    $customerId: ID!
    $filter: AuditLogFilter
    $pagination: PaginationInput
  ) {
    customerAuditLogs(
      customerId: $customerId
      filter: $filter
      pagination: $pagination
    ) {
      logs {
        id
        logTier
        eventType
        eventCategory
        description
        actor {
          id
          type
          email
          name
          ip
          userAgent
        }
        metadata {
          organizationName
          applicationName
          targetUserId
          targetUserEmail
          changes
          apiKeyId
          sessionId
          customData
        }
        timestamp
        createdAt
        severity
        success
      }
      pagination {
        page
        limit
        totalCount
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

// Get application audit logs for specific app
export const GET_APPLICATION_AUDIT_LOGS = gql`
  query GetApplicationAuditLogs(
    $applicationId: ID!
    $filter: AuditLogFilter
    $pagination: PaginationInput
  ) {
    applicationAuditLogs(
      applicationId: $applicationId
      filter: $filter
      pagination: $pagination
    ) {
      logs {
        id
        logTier
        eventType
        eventCategory
        description
        actor {
          id
          type
          email
          name
          ip
          userAgent
        }
        metadata {
          organizationName
          applicationName
          targetUserId
          targetUserEmail
          changes
          apiKeyId
          sessionId
          customData
        }
        timestamp
        createdAt
        severity
        success
      }
      pagination {
        page
        limit
        totalCount
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

// Get audit analytics for dashboard
export const GET_AUDIT_ANALYTICS = gql`
  query GetAuditAnalytics(
    $customerId: ID
    $applicationId: ID
    $timeRange: String
  ) {
    auditAnalytics(
      customerId: $customerId
      applicationId: $applicationId
      timeRange: $timeRange
    ) {
      totalEvents
      eventsByCategory {
        category
        count
      }
      eventsByTier {
        tier
        count
      }
      recentActivity {
        id
        eventType
        eventCategory
        description
        actor {
          email
          type
        }
        timestamp
        success
      }
      topActors {
        actorId
        actorEmail
        eventCount
        lastActivity
      }
      successRate
      timelineData {
        date
        count
        successCount
        failureCount
      }
    }
  }
`;

// Get general audit logs (with access control)
export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($filter: AuditLogFilter, $pagination: PaginationInput) {
    auditLogs(filter: $filter, pagination: $pagination) {
      logs {
        id
        logTier
        customerId
        applicationId
        eventType
        eventCategory
        description
        actor {
          id
          type
          email
          name
          ip
          userAgent
        }
        metadata {
          organizationName
          applicationName
          targetUserId
          targetUserEmail
          changes
          apiKeyId
          sessionId
          customData
        }
        timestamp
        createdAt
        severity
        success
      }
      pagination {
        page
        limit
        totalCount
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

// Get specific audit log by ID
export const GET_AUDIT_LOG = gql`
  query GetAuditLog($id: ID!) {
    auditLog(id: $id) {
      id
      logTier
      customerId
      applicationId
      eventType
      eventCategory
      description
      actor {
        id
        type
        email
        name
        ip
        userAgent
        location
      }
      metadata {
        organizationName
        applicationName
        targetUserId
        targetUserEmail
        changes
        apiKeyId
        sessionId
        requestId
        platform
        customData
      }
      timestamp
      createdAt
      severity
      success
    }
  }
`;

// Platform logs (admin only)
export const GET_PLATFORM_AUDIT_LOGS = gql`
  query GetPlatformAuditLogs(
    $filter: AuditLogFilter
    $pagination: PaginationInput
  ) {
    platformAuditLogs(filter: $filter, pagination: $pagination) {
      logs {
        id
        logTier
        eventType
        eventCategory
        description
        actor {
          id
          type
          email
          name
          ip
          userAgent
        }
        metadata {
          organizationName
          applicationName
          changes
          customData
        }
        timestamp
        createdAt
        severity
        success
      }
      pagination {
        page
        limit
        totalCount
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;
