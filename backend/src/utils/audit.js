const AuditLog = require("../models/AuditLog");

/**
 * Enhanced audit logging for three-tier system
 * @param {string} eventType - Event type/action performed
 * @param {string} userId - User ID who performed the action (optional)
 * @param {Object} metadata - Additional context data
 * @param {string} ip - IP address (optional)
 * @param {string} userAgent - User agent (optional)
 * @param {string} tier - Override tier detection ('PLATFORM', 'CUSTOMER', 'APPLICATION')
 */
const auditLog = async (
  eventType,
  userId = null,
  metadata = {},
  ip = null,
  userAgent = null,
  tier = null
) => {
  try {
    // Determine tier if not explicitly provided
    let logTier = tier;
    if (!logTier) {
      if (metadata.applicationId && metadata.customerId) {
        logTier = "APPLICATION";
      } else if (metadata.customerId && !metadata.applicationId) {
        logTier = "CUSTOMER";
      } else {
        logTier = "PLATFORM";
      }
    }

    const logEntry = {
      logTier,
      eventType,
      eventCategory: metadata.category || "AUTH",
      performedBy: userId,
      actorType: metadata.actorType || "END_USER",
      customerId: metadata.customerId || metadata.orgId,
      applicationId: metadata.applicationId || metadata.appId,
      metadata: {
        ...metadata,
        ...(ip && { ip }),
        ...(userAgent && { userAgent }),
        timestamp: new Date().toISOString(),
      },
      ipAddress: ip,
      userAgent,
      success: metadata.success !== undefined ? metadata.success : true,
      errorCode: metadata.errorCode,
      errorMessage: metadata.errorMessage,
      sessionId: metadata.sessionId,
      timestamp: new Date(),
    };

    await AuditLog.create(logEntry);

    // Log to console for development/debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`🔍 [${logTier}] Audit Log: ${eventType}`, {
        userId,
        metadata,
      });
    }
  } catch (error) {
    // Don't let audit logging failures break the main flow
    console.error("Failed to create audit log:", error);
  }
};

/**
 * Platform-level audit logging
 * @param {string} eventType - Platform event type
 * @param {string} adminUserId - Platform admin user ID
 * @param {Object} metadata - Additional context
 */
const auditPlatformLog = async (eventType, adminUserId, metadata = {}) => {
  try {
    await AuditLog.createPlatformLog(eventType, adminUserId, {
      ...metadata,
      category: "SYSTEM",
      actorType: "PLATFORM_ADMIN",
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`🏢 [PLATFORM] ${eventType}`, { adminUserId, metadata });
    }
  } catch (error) {
    console.error("Failed to create platform audit log:", error);
  }
};

/**
 * Customer/Organization-level audit logging
 * @param {string} eventType - Customer event type
 * @param {string} customerId - Organization ID
 * @param {string} userId - User ID who performed the action
 * @param {Object} metadata - Additional context
 */
const auditCustomerLog = async (
  eventType,
  customerId,
  userId,
  metadata = {}
) => {
  try {
    await AuditLog.createCustomerLog(eventType, customerId, userId, {
      ...metadata,
      category: metadata.category || "ADMIN",
      actorType: metadata.actorType || "CUSTOMER_ADMIN",
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`🏛️ [CUSTOMER] ${eventType}`, {
        customerId,
        userId,
        metadata,
      });
    }
  } catch (error) {
    console.error("Failed to create customer audit log:", error);
  }
};

/**
 * Application-level audit logging
 * @param {string} eventType - Application event type
 * @param {string} customerId - Organization ID
 * @param {string} applicationId - Application ID
 * @param {string} userId - End user ID (optional)
 * @param {Object} metadata - Additional context
 */
const auditApplicationLog = async (
  eventType,
  customerId,
  applicationId,
  userId = null,
  metadata = {}
) => {
  try {
    await AuditLog.createApplicationLog(
      eventType,
      customerId,
      applicationId,
      userId,
      {
        ...metadata,
        category: metadata.category || "AUTH",
        actorType: metadata.actorType || "END_USER",
      }
    );

    if (process.env.NODE_ENV === "development") {
      console.log(`📱 [APPLICATION] ${eventType}`, {
        customerId,
        applicationId,
        userId,
        metadata,
      });
    }
  } catch (error) {
    console.error("Failed to create application audit log:", error);
  }
};

/**
 * Get audit logs with filtering and pagination - Enhanced for three-tier system
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Paginated audit logs
 */
const getAuditLogs = async (filters = {}, options = {}) => {
  const {
    limit = 50,
    offset = 0,
    sortBy = "timestamp",
    sortOrder = "desc",
    startDate,
    endDate,
  } = options;

  // Build query with tier-aware filtering
  const query = { ...filters };

  // Add date range filter if provided
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  try {
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("performedBy", "username email firstName lastName")
        .populate("customerId", "name type")
        .populate("applicationId", "name type")
        .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      total,
      hasNextPage: offset + limit < total,
      hasPreviousPage: offset > 0,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Failed to retrieve audit logs:", error);
    throw new Error("Failed to retrieve audit logs");
  }
};

/**
 * Get platform-only audit logs
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Platform audit logs
 */
const getPlatformAuditLogs = async (options = {}) => {
  return await getAuditLogs({ logTier: "PLATFORM" }, options);
};

/**
 * Get customer/organization audit logs
 * @param {string} customerId - Organization ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Customer audit logs
 */
const getCustomerAuditLogs = async (customerId, options = {}) => {
  return await getAuditLogs(
    {
      customerId,
      logTier: { $in: ["CUSTOMER", "APPLICATION"] },
    },
    options
  );
};

/**
 * Get organization-only audit logs (exclude application logs)
 * @param {string} orgId - Organization ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Organization audit logs only
 */
const getOrgAuditLogs = async (orgId, options = {}) => {
  return await getAuditLogs(
    {
      customerId: orgId,
      logTier: "CUSTOMER",
    },
    options
  );
};

/**
 * Get application audit logs
 * @param {string} appId - Application ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Application audit logs
 */
const getAppAuditLogs = async (appId, options = {}) => {
  return await getAuditLogs(
    {
      applicationId: appId,
      logTier: "APPLICATION",
    },
    options
  );
};

/**
 * Get audit logs for a specific user across all tiers
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - User's audit logs
 */
const getUserAuditLogs = async (userId, options = {}) => {
  return await getAuditLogs({ performedBy: userId }, options);
};

/**
 * Get tier-specific audit statistics
 * @param {Object} filters - Filter criteria
 * @param {string} timeframe - Timeframe for stats
 * @returns {Promise<Object>} - Enhanced audit statistics
 */
const getAuditStats = async (filters = {}, timeframe = "day") => {
  try {
    const timeframes = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };

    const startDate = new Date(Date.now() - timeframes[timeframe]);

    const query = {
      ...filters,
      timestamp: { $gte: startDate },
    };

    const [
      totalCount,
      tierStats,
      eventStats,
      categoryStats,
      userStats,
      recentLogs,
    ] = await Promise.all([
      AuditLog.countDocuments(query),

      // Tier distribution
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: "$logTier", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Event type distribution
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Category distribution
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: "$eventCategory", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // User activity
      AuditLog.aggregate([
        { $match: { ...query, performedBy: { $ne: null } } },
        { $group: { _id: "$performedBy", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $project: {
            userId: "$_id",
            count: 1,
            username: { $arrayElemAt: ["$user.username", 0] },
            email: { $arrayElemAt: ["$user.email", 0] },
          },
        },
      ]),

      // Recent logs
      AuditLog.find(query)
        .populate("performedBy", "username email")
        .populate("customerId", "name")
        .populate("applicationId", "name")
        .sort({ timestamp: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      timeframe,
      totalCount,
      tierDistribution: tierStats,
      topEvents: eventStats,
      categoryDistribution: categoryStats,
      topUsers: userStats,
      recentLogs,
    };
  } catch (error) {
    console.error("Failed to get audit statistics:", error);
    throw new Error("Failed to get audit statistics");
  }
};

/**
 * Clean up old audit logs with tier-specific retention
 * @param {Object} retentionPolicies - Retention policies by tier
 * @returns {Promise<Object>} - Cleanup results
 */
const cleanupOldLogs = async (retentionPolicies = {}) => {
  try {
    const defaultRetention = {
      PLATFORM: 365, // 1 year for platform logs
      CUSTOMER: 180, // 6 months for customer logs
      APPLICATION: 90, // 3 months for application logs
    };

    const policies = { ...defaultRetention, ...retentionPolicies };
    const results = {};

    for (const [tier, days] of Object.entries(policies)) {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const result = await AuditLog.deleteMany({
        logTier: tier,
        timestamp: { $lt: cutoffDate },
      });

      results[tier] = result.deletedCount;
      console.log(`Cleaned up ${result.deletedCount} old ${tier} audit logs`);
    }

    return results;
  } catch (error) {
    console.error("Failed to cleanup old audit logs:", error);
    throw error;
  }
};

/**
 * Query audit logs with tier-based filtering and pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} pagination - Pagination options
 * @param {Object} user - Current user for access control
 */
const queryAuditLogs = async (filter = {}, pagination = {}, user = null) => {
  try {
    // Build MongoDB query
    const query = {};

    // Apply tier filtering
    if (filter.logTier) {
      query.logTier = filter.logTier;
    }

    // Apply hierarchical filtering based on user permissions
    if (user && user.role !== "ADMIN") {
      // Regular users can only see their organization's logs
      query.$or = [
        { customerId: user.organizationId },
        { logTier: "APPLICATION", customerId: user.organizationId },
      ];
    }

    // Apply other filters
    if (filter.customerId) query.customerId = filter.customerId;
    if (filter.applicationId) query.applicationId = filter.applicationId;
    if (filter.eventCategory) query.eventCategory = filter.eventCategory;
    if (filter.actorType) query["actor.type"] = filter.actorType;
    if (filter.severity) query.severity = filter.severity;
    if (filter.success !== undefined) query.success = filter.success;

    // Date range filtering
    if (filter.startDate || filter.endDate) {
      query.timestamp = {};
      if (filter.startDate) query.timestamp.$gte = new Date(filter.startDate);
      if (filter.endDate) query.timestamp.$lte = new Date(filter.endDate);
    }

    // Search functionality
    if (filter.searchTerm) {
      query.$or = [
        { eventType: new RegExp(filter.searchTerm, "i") },
        { description: new RegExp(filter.searchTerm, "i") },
        { "actor.email": new RegExp(filter.searchTerm, "i") },
      ];
    }

    // Pagination
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 100); // Cap at 100
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || "timestamp";
    const sortOrder = pagination.sortOrder === "ASC" ? 1 : -1;

    // Execute query with pagination
    const [logs, totalCount] = await Promise.all([
      AuditLog.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  } catch (error) {
    console.error("Error querying audit logs:", error);
    throw error;
  }
};

/**
 * Query platform-tier audit logs (admin only)
 */
const queryPlatformLogs = async (filter = {}, pagination = {}) => {
  return await queryAuditLogs(
    { ...filter, logTier: "PLATFORM" },
    pagination,
    { role: "ADMIN" } // Bypass access control for platform logs
  );
};

/**
 * Query customer-tier audit logs for specific organization
 */
const queryCustomerLogs = async (customerId, filter = {}, pagination = {}) => {
  return await queryAuditLogs(
    { ...filter, logTier: "CUSTOMER", customerId },
    pagination,
    { role: "ADMIN" } // Bypass access control since customerId is already specified
  );
};

/**
 * Query application-tier audit logs for specific app
 */
const queryApplicationLogs = async (
  applicationId,
  filter = {},
  pagination = {},
  user = null
) => {
  return await queryAuditLogs(
    { ...filter, logTier: "APPLICATION", applicationId },
    pagination,
    user
  );
};

// Backward compatibility wrapper
const legacyAuditLog = auditLog;

module.exports = {
  // New three-tier methods
  auditLog,
  auditPlatformLog,
  auditCustomerLog,
  auditApplicationLog,

  // Enhanced query methods
  getAuditLogs,
  getPlatformAuditLogs,
  getCustomerAuditLogs,
  getOrgAuditLogs,
  getAppAuditLogs,
  getUserAuditLogs,
  getAuditStats,
  cleanupOldLogs,

  // New three-tier query methods
  queryAuditLogs,
  queryPlatformLogs,
  queryCustomerLogs,
  queryApplicationLogs,

  // Backward compatibility
  legacyAuditLog,
};
