const AuditLog = require("../../models/AuditLog");
const {
  auditPlatformLog,
  auditCustomerLog,
  auditApplicationLog,
  queryAuditLogs,
  queryPlatformLogs,
  queryCustomerLogs,
  queryApplicationLogs,
} = require("../../utils/audit");
const {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} = require("apollo-server-express");

const auditResolvers = {
  Query: {
    // Get audit logs with filtering and pagination
    auditLogs: async (_, { filter = {}, pagination = {} }, { user }) => {
      if (!user) throw new AuthenticationError("Authentication required");

      try {
        return await queryAuditLogs(filter, pagination, user);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        throw new Error("Failed to fetch audit logs");
      }
    },

    // Get specific audit log by ID
    auditLog: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError("Authentication required");

      try {
        const log = await AuditLog.findById(id);
        if (!log) return null;

        // Check access permissions
        if (log.logTier === "PLATFORM" && user.role !== "ADMIN") {
          throw new ForbiddenError(
            "Insufficient permissions for platform logs"
          );
        }

        if (
          log.customerId &&
          log.customerId.toString() !== user.organizationId
        ) {
          throw new ForbiddenError("Access denied to this audit log");
        }

        return log;
      } catch (error) {
        console.error("Error fetching audit log:", error);
        throw new Error("Failed to fetch audit log");
      }
    },

    // Get platform-tier logs (admin only)
    platformAuditLogs: async (
      _,
      { filter = {}, pagination = {} },
      { user }
    ) => {
      if (!user || user.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required for platform logs");
      }

      try {
        return await queryPlatformLogs(filter, pagination);
      } catch (error) {
        console.error("Error fetching platform logs:", error);
        throw new Error("Failed to fetch platform logs");
      }
    },

    // Get customer-tier logs for specific organization
    customerAuditLogs: async (
      _,
      { customerId, filter = {}, pagination = {} },
      { user }
    ) => {
      if (!user) throw new AuthenticationError("Authentication required");

      // Users can only access their own organization's logs unless they're admin
      if (user.role !== "ADMIN" && customerId !== user.organizationId) {
        throw new ForbiddenError("Access denied to this organization's logs");
      }

      try {
        return await queryCustomerLogs(customerId, filter, pagination);
      } catch (error) {
        console.error("Error fetching customer logs:", error);
        throw new Error("Failed to fetch customer logs");
      }
    },

    // Get application-tier logs for specific app
    applicationAuditLogs: async (
      _,
      { applicationId, filter = {}, pagination = {} },
      { user }
    ) => {
      if (!user) throw new AuthenticationError("Authentication required");

      try {
        // TODO: Verify user has access to this application
        return await queryApplicationLogs(
          applicationId,
          filter,
          pagination,
          user
        );
      } catch (error) {
        console.error("Error fetching application logs:", error);
        throw new Error("Failed to fetch application logs");
      }
    },

    // Get audit analytics for dashboard
    auditAnalytics: async (
      _,
      { customerId, applicationId, timeRange = "7d" },
      { user }
    ) => {
      if (!user) throw new AuthenticationError("Authentication required");

      try {
        // Determine time range
        const now = new Date();
        const timeRanges = {
          "1d": new Date(now.getTime() - 24 * 60 * 60 * 1000),
          "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          "30d": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          "90d": new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        };

        const startDate = timeRanges[timeRange] || timeRanges["7d"];

        // Build query filter
        const baseFilter = {
          timestamp: { $gte: startDate },
        };

        // Add access control
        if (user.role !== "ADMIN") {
          if (customerId && customerId !== user.organizationId) {
            throw new ForbiddenError(
              "Access denied to this organization's analytics"
            );
          }
          baseFilter.customerId = user.organizationId;
        } else if (customerId) {
          baseFilter.customerId = customerId;
        }

        if (applicationId) {
          baseFilter.applicationId = applicationId;
        }

        // Execute analytics queries
        const [
          totalEvents,
          eventsByCategory,
          eventsByTier,
          recentActivity,
          successFailure,
          timelineData,
          topActors,
        ] = await Promise.all([
          // Total events count
          AuditLog.countDocuments(baseFilter),

          // Events by category
          AuditLog.aggregate([
            { $match: baseFilter },
            { $group: { _id: "$eventCategory", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ]),

          // Events by tier
          AuditLog.aggregate([
            { $match: baseFilter },
            { $group: { _id: "$logTier", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ]),

          // Recent activity (last 10 events)
          AuditLog.find(baseFilter).sort({ timestamp: -1 }).limit(10),

          // Success/failure rates
          AuditLog.aggregate([
            { $match: baseFilter },
            {
              $group: {
                _id: "$success",
                count: { $sum: 1 },
              },
            },
          ]),

          // Timeline data (daily aggregation)
          AuditLog.aggregate([
            { $match: baseFilter },
            {
              $group: {
                _id: {
                  date: {
                    $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
                  },
                },
                count: { $sum: 1 },
                successCount: { $sum: { $cond: ["$success", 1, 0] } },
                failureCount: { $sum: { $cond: ["$success", 0, 1] } },
              },
            },
            { $sort: { "_id.date": 1 } },
          ]),

          // Top actors
          AuditLog.aggregate([
            { $match: baseFilter },
            {
              $group: {
                _id: {
                  actorId: "$actor.id",
                  actorEmail: "$actor.email",
                },
                eventCount: { $sum: 1 },
                lastActivity: { $max: "$timestamp" },
              },
            },
            { $sort: { eventCount: -1 } },
            { $limit: 10 },
          ]),
        ]);

        // Calculate success rate
        const totalSuccess =
          successFailure.find((s) => s._id === true)?.count || 0;
        const totalFailure =
          successFailure.find((s) => s._id === false)?.count || 0;
        const successRate =
          totalEvents > 0 ? (totalSuccess / totalEvents) * 100 : 0;

        return {
          totalEvents,
          eventsByCategory: eventsByCategory.map((e) => ({
            category: e._id,
            count: e.count,
          })),
          eventsByTier: eventsByTier.map((e) => ({
            tier: e._id,
            count: e.count,
          })),
          recentActivity,
          topActors: topActors.map((a) => ({
            actorId: a._id.actorId || "system",
            actorEmail: a._id.actorEmail,
            eventCount: a.eventCount,
            lastActivity: a.lastActivity.toISOString(),
          })),
          successRate: Math.round(successRate * 100) / 100,
          timelineData: timelineData.map((t) => ({
            date: t._id.date,
            count: t.count,
            successCount: t.successCount,
            failureCount: t.failureCount,
          })),
        };
      } catch (error) {
        console.error("Error fetching audit analytics:", error);
        throw new Error("Failed to fetch audit analytics");
      }
    },

    // Export audit logs (returns download URL)
    exportAuditLogs: async (_, { filter = {}, format = "JSON" }, { user }) => {
      if (!user) throw new AuthenticationError("Authentication required");

      try {
        // TODO: Implement audit log export functionality
        // This would typically generate a file and return a download URL
        throw new Error("Export functionality coming soon");
      } catch (error) {
        console.error("Error exporting audit logs:", error);
        throw new Error("Failed to export audit logs");
      }
    },
  },

  Mutation: {
    // Manual audit log creation (for testing/admin)
    createAuditLog: async (_, args, { user }) => {
      if (!user || user.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required to create audit logs");
      }

      try {
        const {
          logTier,
          customerId,
          applicationId,
          eventType,
          eventCategory,
          description,
          actorId,
          actorType,
          metadata,
          severity,
        } = args;

        // Create audit log based on tier
        let result;
        const parsedMetadata = metadata ? JSON.parse(metadata) : {};

        if (logTier === "PLATFORM") {
          result = await auditPlatformLog(
            eventType,
            actorId || user.id,
            parsedMetadata,
            null, // ip
            null, // userAgent
            severity
          );
        } else if (logTier === "CUSTOMER") {
          result = await auditCustomerLog(
            eventType,
            customerId,
            actorId || user.id,
            parsedMetadata,
            null, // ip
            null, // userAgent
            severity
          );
        } else if (logTier === "APPLICATION") {
          result = await auditApplicationLog(
            eventType,
            customerId,
            applicationId,
            actorId || user.id,
            parsedMetadata,
            null, // ip
            null, // userAgent
            severity
          );
        }

        return result;
      } catch (error) {
        console.error("Error creating audit log:", error);
        throw new Error("Failed to create audit log");
      }
    },

    // Bulk delete old audit logs (admin only)
    cleanupAuditLogs: async (
      _,
      { olderThanDays, logTier, dryRun = true },
      { user }
    ) => {
      if (!user || user.role !== "ADMIN") {
        throw new ForbiddenError(
          "Admin access required for cleanup operations"
        );
      }

      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const filter = {
          timestamp: { $lt: cutoffDate },
        };

        if (logTier) {
          filter.logTier = logTier;
        }

        if (dryRun) {
          // Just count how many would be deleted
          return await AuditLog.countDocuments(filter);
        } else {
          // Actually delete the logs
          const result = await AuditLog.deleteMany(filter);

          // Log the cleanup action
          await auditPlatformLog("AUDIT_CLEANUP", user.id, {
            deletedCount: result.deletedCount,
            cutoffDate: cutoffDate.toISOString(),
            logTier: logTier || "ALL",
          });

          return result.deletedCount;
        }
      } catch (error) {
        console.error("Error cleaning up audit logs:", error);
        throw new Error("Failed to cleanup audit logs");
      }
    },
  },

  // Resolvers for complex types
  AuditLog: {
    timestamp: (auditLog) => auditLog.timestamp.toISOString(),
    createdAt: (auditLog) => auditLog.createdAt.toISOString(),
  },
};

module.exports = auditResolvers;
