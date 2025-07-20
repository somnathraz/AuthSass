import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CUSTOMER_AUDIT_LOGS,
  GET_APPLICATION_AUDIT_LOGS,
  GET_AUDIT_ANALYTICS,
  GET_AUDIT_LOGS,
  GET_AUDIT_LOG,
  GET_PLATFORM_AUDIT_LOGS,
} from "@/graphql/audit.queries";

// Types
export interface AuditActor {
  id: string;
  type: "USER" | "ADMIN" | "SYSTEM" | "API_KEY" | "WEBHOOK";
  email?: string;
  name?: string;
  ip?: string;
  userAgent?: string;
  location?: string;
}

export interface AuditMetadata {
  organizationName?: string;
  applicationName?: string;
  targetUserId?: string;
  targetUserEmail?: string;
  changes?: string;
  apiKeyId?: string;
  sessionId?: string;
  requestId?: string;
  platform?: string;
  customData?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  logTier: "PLATFORM" | "CUSTOMER" | "APPLICATION";
  customerId?: string;
  applicationId?: string;
  eventType: string;
  eventCategory:
    | "AUTHENTICATION"
    | "AUTHORIZATION"
    | "ORGANIZATION"
    | "APPLICATION"
    | "USER_MANAGEMENT"
    | "API_KEY"
    | "SETTINGS"
    | "BILLING"
    | "SECURITY"
    | "INTEGRATION"
    | "SYSTEM";
  description: string;
  actor: AuditActor;
  metadata: AuditMetadata;
  timestamp: string;
  createdAt: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  success: boolean;
}

export interface AuditPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: AuditPagination;
}

export interface AuditFilter {
  eventTypes?: string[];
  eventCategories?: string[];
  severity?: string[];
  dateFrom?: string;
  dateTo?: string;
  actorTypes?: string[];
  success?: boolean;
  search?: string;
  logTier?: string;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface AuditAnalytics {
  totalEvents: number;
  eventsByCategory: { category: string; count: number }[];
  eventsByTier: { tier: string; count: number }[];
  recentActivity: Array<{
    id: string;
    eventType: string;
    eventCategory: string;
    description: string;
    actor: { email?: string; type: string };
    timestamp: string;
    success: boolean;
  }>;
  topActors: Array<{
    actorId: string;
    actorEmail?: string;
    eventCount: number;
    lastActivity: string;
  }>;
  successRate: number;
  timelineData: Array<{
    date: string;
    count: number;
    successCount: number;
    failureCount: number;
  }>;
}

// Service hooks
export const useCustomerAuditLogs = (
  customerId: string,
  filter?: AuditFilter,
  pagination?: PaginationInput
) => {
  return useQuery<{ customerAuditLogs: AuditLogsResponse }>(
    GET_CUSTOMER_AUDIT_LOGS,
    {
      variables: { customerId, filter, pagination },
      skip: !customerId,
      errorPolicy: "all",
    }
  );
};

export const useApplicationAuditLogs = (
  applicationId: string,
  filter?: AuditFilter,
  pagination?: PaginationInput
) => {
  return useQuery<{ applicationAuditLogs: AuditLogsResponse }>(
    GET_APPLICATION_AUDIT_LOGS,
    {
      variables: { applicationId, filter, pagination },
      skip: !applicationId,
      errorPolicy: "all",
    }
  );
};

export const useAuditAnalytics = (
  customerId?: string,
  applicationId?: string,
  timeRange: string = "7d"
) => {
  return useQuery<{ auditAnalytics: AuditAnalytics }>(GET_AUDIT_ANALYTICS, {
    variables: { customerId, applicationId, timeRange },
    errorPolicy: "all",
  });
};

export const useAuditLogs = (
  filter?: AuditFilter,
  pagination?: PaginationInput
) => {
  return useQuery<{ auditLogs: AuditLogsResponse }>(GET_AUDIT_LOGS, {
    variables: { filter, pagination },
    errorPolicy: "all",
  });
};

export const useAuditLog = (id: string) => {
  return useQuery<{ auditLog: AuditLog }>(GET_AUDIT_LOG, {
    variables: { id },
    skip: !id,
    errorPolicy: "all",
  });
};

export const usePlatformAuditLogs = (
  filter?: AuditFilter,
  pagination?: PaginationInput
) => {
  return useQuery<{ platformAuditLogs: AuditLogsResponse }>(
    GET_PLATFORM_AUDIT_LOGS,
    {
      variables: { filter, pagination },
      errorPolicy: "all",
    }
  );
};

// Utility functions
export const formatEventType = (eventType: string): string => {
  return eventType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export const getEventTypeIcon = (eventType: string): string => {
  const iconMap: Record<string, string> = {
    ORGANIZATION_CREATED: "🏢",
    ORGANIZATION_UPDATED: "✏️",
    ORGANIZATION_DELETED: "🗑️",
    APP_CREATED: "📱",
    APP_UPDATED: "🔧",
    APP_DELETED: "❌",
    USER_LOGIN: "🔑",
    USER_LOGOUT: "🚪",
    USER_SIGNUP: "📝",
    API_KEY_CREATED: "🔐",
    API_KEY_REVOKED: "🚫",
    SETTINGS_UPDATED: "⚙️",
    MEMBER_ADDED: "👥",
    MEMBER_REMOVED: "👤",
  };
  return iconMap[eventType] || "📋";
};

export const getSeverityColor = (severity: string): string => {
  const colorMap: Record<string, string> = {
    LOW: "text-green-600 bg-green-50",
    MEDIUM: "text-yellow-600 bg-yellow-50",
    HIGH: "text-orange-600 bg-orange-50",
    CRITICAL: "text-red-600 bg-red-50",
  };
  return colorMap[severity] || "text-gray-600 bg-gray-50";
};

export const getActorTypeIcon = (actorType: string): string => {
  const iconMap: Record<string, string> = {
    USER: "👤",
    ADMIN: "👑",
    SYSTEM: "🤖",
    API_KEY: "🔑",
    WEBHOOK: "🔗",
  };
  return iconMap[actorType] || "❓";
};

export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
};
