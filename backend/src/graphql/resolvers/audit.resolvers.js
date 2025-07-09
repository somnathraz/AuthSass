const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');

// Utils
const { 
  getAuditLogs, 
  getUserAuditLogs, 
  getOrgAuditLogs, 
  getAppAuditLogs, 
  getAuditStats 
} = require('../../utils/audit');

// Models
const AuditLog = require('../../models/AuditLog');

const auditResolvers = {
  Query: {
    async auditLogs(parent, { limit, offset, sortBy, sortOrder, filter }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Only admins can view all audit logs
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Insufficient permissions to view audit logs');
      }

      try {
        const filters = {};
        if (filter) {
          if (filter.action) filters.action = filter.action;
          if (filter.userId) filters.userId = filter.userId;
          if (filter.ip) filters['metadata.ip'] = filter.ip;
          if (filter.search) {
            filters.$or = [
              { action: new RegExp(filter.search, 'i') },
              { 'metadata.ip': new RegExp(filter.search, 'i') }
            ];
          }
        }

        const options = {
          limit,
          offset,
          sortBy,
          sortOrder,
          startDate: filter?.startDate,
          endDate: filter?.endDate
        };

        return await getAuditLogs(filters, options);

      } catch (error) {
        console.error('Get audit logs error:', error);
        throw new Error('Failed to retrieve audit logs');
      }
    },

    async auditLog(parent, { id }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Only admins can view individual audit logs
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Insufficient permissions to view audit logs');
      }

      try {
        const auditLog = await AuditLog.findById(id)
          .populate('userId', 'username email firstName lastName');

        if (!auditLog) {
          throw new UserInputError('Audit log not found');
        }

        return auditLog;

      } catch (error) {
        console.error('Get audit log error:', error);
        throw new Error('Failed to retrieve audit log');
      }
    },

    async userAuditLogs(parent, { userId, limit, offset }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Users can only view their own audit logs, admins can view any
      const canView = (
        user.id === userId ||
        user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN'
      );

      if (!canView) {
        throw new ForbiddenError('Insufficient permissions to view these audit logs');
      }

      try {
        return await getUserAuditLogs(userId, { limit, offset });

      } catch (error) {
        console.error('Get user audit logs error:', error);
        throw new Error('Failed to retrieve user audit logs');
      }
    },

    async organizationAuditLogs(parent, { orgId, limit, offset }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Check if user has access to this organization or is admin
      const OrganizationService = require('../../services/organization.service');
      const hasAccess = await OrganizationService.checkUserPermission(user.id, orgId, ['ADMIN']);
      
      if (!hasAccess && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Insufficient permissions to view organization audit logs');
      }

      try {
        return await getOrgAuditLogs(orgId, { limit, offset });

      } catch (error) {
        console.error('Get organization audit logs error:', error);
        throw new Error('Failed to retrieve organization audit logs');
      }
    },

    async appAuditLogs(parent, { appId, limit, offset }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Check if user has access to this app or is admin
      const App = require('../../models/App');
      const Organization = require('../../models/Organization');
      const AppMembership = require('../../models/AppMembership');
      
      const app = await App.findById(appId);
      if (!app) {
        throw new UserInputError('Application not found');
      }

      // Check multiple access levels:
      // 1. Global admin access
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        try {
          return await getAppAuditLogs(appId, { limit, offset });
        } catch (error) {
          console.error('Get app audit logs error:', error);
          throw new Error('Failed to retrieve application audit logs');
        }
      }

      // 2. App owner access
      if (app.owner && app.owner.toString() === user.id) {
        try {
          return await getAppAuditLogs(appId, { limit, offset });
        } catch (error) {
          console.error('Get app audit logs error:', error);
          throw new Error('Failed to retrieve application audit logs');
        }
      }

      // 3. Organization owner access
      const organization = await Organization.findById(app.organizationId);
      if (organization && organization.owner && organization.owner.toString() === user.id) {
        try {
          return await getAppAuditLogs(appId, { limit, offset });
        } catch (error) {
          console.error('Get app audit logs error:', error);
          throw new Error('Failed to retrieve application audit logs');
        }
      }

      // 4. App membership with ADMIN role
      const membership = await AppMembership.findOne({
        user: user.id,
        app: appId,
        role: 'ADMIN',
        status: 'ACTIVE'
      });

      if (membership) {
        try {
          return await getAppAuditLogs(appId, { limit, offset });
        } catch (error) {
          console.error('Get app audit logs error:', error);
          throw new Error('Failed to retrieve application audit logs');
        }
      }

      // 5. Organization membership with sufficient permissions
      const OrganizationService = require('../../services/organization.service');
      const hasOrgAccess = await OrganizationService.checkUserPermission(user.id, app.organizationId, ['ADMIN']);
      
      if (hasOrgAccess) {
        try {
          return await getAppAuditLogs(appId, { limit, offset });
        } catch (error) {
          console.error('Get app audit logs error:', error);
          throw new Error('Failed to retrieve application audit logs');
        }
      }

      throw new ForbiddenError('Insufficient permissions to view application audit logs');
    },

    async auditStats(parent, { filter }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Only admins can view audit statistics
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Insufficient permissions to view audit statistics');
      }

      try {
        const filters = {};
        let timeframe = 'day';

        if (filter) {
          if (filter.timeframe) timeframe = filter.timeframe.toLowerCase();
          if (filter.userId) filters.userId = filter.userId;
          if (filter.orgId) filters['metadata.orgId'] = filter.orgId;
          if (filter.appId) filters['metadata.appId'] = filter.appId;
          
          // Custom date range
          if (filter.startDate && filter.endDate) {
            filters.timestamp = {
              $gte: new Date(filter.startDate),
              $lte: new Date(filter.endDate)
            };
            timeframe = 'custom';
          }
        }

        return await getAuditStats(filters, timeframe);

      } catch (error) {
        console.error('Get audit stats error:', error);
        throw new Error('Failed to retrieve audit statistics');
      }
    }
  },

  // Field resolvers
  AuditLog: {
    async user(parent, args, context) {
      if (!parent.userId) return null;
      
      const User = require('../../models/User');
      return await User.findById(parent.userId)
        .select('username email firstName lastName')
        .lean();
    },

    async ip(parent, args, context) {
      return parent.metadata?.ip || null;
    },

    async userAgent(parent, args, context) {
      return parent.metadata?.userAgent || null;
    }
  }
};

module.exports = auditResolvers; 