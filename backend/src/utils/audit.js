const AuditLog = require('../models/AuditLog');

/**
 * Log an audit event
 * @param {string} action - Action performed
 * @param {string} userId - User ID who performed the action
 * @param {Object} metadata - Additional context data
 * @param {string} ip - IP address (optional)
 * @param {string} userAgent - User agent (optional)
 */
const auditLog = async (action, userId = null, metadata = {}, ip = null, userAgent = null) => {
  try {
    const logEntry = {
      action,
      userId,
      metadata: {
        ...metadata,
        ...(ip && { ip }),
        ...(userAgent && { userAgent }),
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };

    await AuditLog.create(logEntry);
    
    // Log to console for development/debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Audit Log: ${action}`, { userId, metadata });
    }
    
  } catch (error) {
    // Don't let audit logging failures break the main flow
    console.error('Failed to create audit log:', error);
  }
};

/**
 * Get audit logs with filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Paginated audit logs
 */
const getAuditLogs = async (filters = {}, options = {}) => {
  const {
    limit = 50,
    offset = 0,
    sortBy = 'timestamp',
    sortOrder = 'desc',
    startDate,
    endDate
  } = options;

  // Build query
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
        .populate('userId', 'username email')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      total,
      hasNextPage: offset + limit < total,
      hasPreviousPage: offset > 0,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error);
    throw new Error('Failed to retrieve audit logs');
  }
};

/**
 * Get audit logs for a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - User's audit logs
 */
const getUserAuditLogs = async (userId, options = {}) => {
  return await getAuditLogs({ userId }, options);
};

/**
 * Get audit logs for a specific application
 * @param {string} appId - Application ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Application's audit logs
 */
const getAppAuditLogs = async (appId, options = {}) => {
  return await getAuditLogs({ 'metadata.appId': appId }, options);
};

/**
 * Get audit logs for a specific organization
 * @param {string} orgId - Organization ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Organization's audit logs
 */
const getOrgAuditLogs = async (orgId, options = {}) => {
  return await getAuditLogs({ 'metadata.orgId': orgId }, options);
};

/**
 * Clean up old audit logs
 * @param {number} daysToKeep - Number of days to keep logs (default: 90)
 * @returns {Promise<number>} - Number of deleted logs
 */
const cleanupOldLogs = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    console.log(`Cleaned up ${result.deletedCount} old audit logs`);
    return result.deletedCount;
  } catch (error) {
    console.error('Failed to cleanup old audit logs:', error);
    throw error;
  }
};

/**
 * Get audit log statistics
 * @param {Object} filters - Filter criteria
 * @param {string} timeframe - Timeframe for stats (day, week, month)
 * @returns {Promise<Object>} - Audit log statistics
 */
const getAuditStats = async (filters = {}, timeframe = 'day') => {
  try {
    const timeframes = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const startDate = new Date(Date.now() - timeframes[timeframe]);
    
    const query = {
      ...filters,
      timestamp: { $gte: startDate }
    };

    const [
      totalCount,
      actionStats,
      userStats,
      recentLogs
    ] = await Promise.all([
      AuditLog.countDocuments(query),
      
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      AuditLog.aggregate([
        { $match: { ...query, userId: { $ne: null } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $project: {
            userId: '$_id',
            count: 1,
            username: { $arrayElemAt: ['$user.username', 0] },
            email: { $arrayElemAt: ['$user.email', 0] }
          }
        }
      ]),
      
      AuditLog.find(query)
        .populate('userId', 'username email')
        .sort({ timestamp: -1 })
        .limit(5)
        .lean()
    ]);

    return {
      timeframe,
      totalCount,
      topActions: actionStats,
      topUsers: userStats,
      recentLogs
    };
  } catch (error) {
    console.error('Failed to get audit statistics:', error);
    throw new Error('Failed to get audit statistics');
  }
};

module.exports = {
  auditLog,
  getAuditLogs,
  getUserAuditLogs,
  getAppAuditLogs,
  getOrgAuditLogs,
  cleanupOldLogs,
  getAuditStats
}; 