const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');
const { withFilter } = require('graphql-subscriptions');

// Services
const OrganizationService = require('../../services/organization.service');
const UserService = require('../../services/user.service');
const PermissionService = require('../../services/permission.service');

// Utils
const { validateInput } = require('../../utils/validation');
const { rateLimitCheck } = require('../../middleware/rateLimiter');
const { auditLog } = require('../../utils/audit');
const { toGraphQLId, sanitizeObjectIds } = require('../../utils/idHelpers');
const { USER_REQUIRED_FIELDS, USER_BASIC_FIELDS } = require('../../utils/userFields');

const organizationResolvers = {
  Query: {
    async organization(parent, { id }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const organization = await OrganizationService.findById(id);
      if (!organization) {
        throw new UserInputError('Organization not found');
      }

      // Check if user has access to this organization
      const hasAccess = await OrganizationService.checkUserPermission(user.id, id);
      if (!hasAccess && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Access denied to this organization');
      }

      return organization;
    },

    async organizations(parent, { limit, offset, sortBy, sortOrder, filter }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Only admins can search all organizations
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Insufficient permissions');
      }

      const criteria = {};
      if (filter) {
        if (filter.search) {
          criteria.$or = [
            { name: new RegExp(filter.search, 'i') },
            { description: new RegExp(filter.search, 'i') }
          ];
        }
        if (filter.type) criteria.type = filter.type;
        if (filter.status) criteria.status = filter.status;
        if (filter.name) criteria.name = new RegExp(filter.name, 'i');
      }

      return await OrganizationService.searchOrganizations(criteria, {
        limit,
        offset,
        sortBy,
        sortOrder
      });
    },

    async myOrganizations(parent, args, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      return await OrganizationService.getUserOrganizations(user.id);
    },

    async organizationMembers(parent, { orgId }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Check if user has access to this organization
      const hasAccess = await OrganizationService.checkUserPermission(user.id, orgId);
      if (!hasAccess && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Access denied to this organization');
      }

      return await OrganizationService.getOrganizationMembers(orgId);
    },

    async allOrganizations(parent, args, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Only admins can search all organizations
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Insufficient permissions');
      }

      return await OrganizationService.getAllOrganizations();
    }
  },

  Mutation: {
    async createOrganization(parent, { input }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Rate limiting
        await rateLimitCheck(req, 'create_organization', 5, 3600); // 5 per hour

        const organization = await OrganizationService.createOrganization(input, user.id);

        return {
          success: true,
          organization,
          errors: []
        };

      } catch (error) {
        console.error('Organization creation error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          input: input,
          userId: user.id
        });
        throw new Error(`Failed to create organization: ${error.message}`);
      }
    },

    async updateOrganization(parent, { id, input }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Check permissions - only org admin/owner or system admin
        const hasPermission = await OrganizationService.checkUserPermission(
          user.id, 
          id, 
          ['ADMIN']
        );
        
        if (!hasPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Insufficient permissions to update this organization');
        }

        // Rate limiting
        await rateLimitCheck(req, 'update_organization', 10, 3600); // 10 per hour

        const organization = await OrganizationService.updateOrganization(id, input, user.id);

        return {
          success: true,
          organization,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Organization update error:', error);
        throw new Error('Failed to update organization');
      }
    },

    async deleteOrganization(parent, { id }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Check permissions - only org owner or system admin
        const organization = await OrganizationService.findById(id);
        if (!organization) {
          throw new UserInputError('Organization not found');
        }

        const isOwner = organization.owner.id === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Only organization owner or system admin can delete organization');
        }

        await OrganizationService.deleteOrganization(id, user.id);

        return {
          success: true,
          message: 'Organization deleted successfully',
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Organization deletion error:', error);
        throw new Error('Failed to delete organization');
      }
    },

    async addOrganizationMember(parent, { input }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const { orgId, userId, role } = input;

        // Check permissions - only org admin or system admin
        const hasPermission = await OrganizationService.checkUserPermission(
          user.id, 
          orgId, 
          ['ADMIN']
        );
        
        if (!hasPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Insufficient permissions to add members');
        }

        // Rate limiting
        await rateLimitCheck(req, 'add_org_member', 20, 3600); // 20 per hour

        const organization = await OrganizationService.addMember(orgId, userId, role, user.id);

        return {
          success: true,
          organization,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Add member error:', error);
        throw new Error('Failed to add organization member');
      }
    },

    async removeOrganizationMember(parent, { input }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const { orgId, userId } = input;

        // Check permissions - only org admin or system admin
        const hasPermission = await OrganizationService.checkUserPermission(
          user.id, 
          orgId, 
          ['ADMIN']
        );
        
        if (!hasPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Insufficient permissions to remove members');
        }

        const organization = await OrganizationService.removeMember(orgId, userId, user.id);

        return {
          success: true,
          organization,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Remove member error:', error);
        throw new Error('Failed to remove organization member');
      }
    },

    async updateMemberRole(parent, { input }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const { orgId, userId, role } = input;

        // Check permissions - only org admin or system admin
        const hasPermission = await OrganizationService.checkUserPermission(
          user.id, 
          orgId, 
          ['ADMIN']
        );
        
        if (!hasPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Insufficient permissions to update member roles');
        }

        const organization = await OrganizationService.updateMemberRole(orgId, userId, role, user.id);

        return {
          success: true,
          organization,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Update member role error:', error);
        throw new Error('Failed to update member role');
      }
    },

    async switchOrganization(parent, { orgId }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const organization = await OrganizationService.findById(orgId);
        if (!organization) {
          throw new UserInputError('Organization not found');
        }

        // Check if user has access to this organization
        const hasAccess = await PermissionService.checkUserOrgAccess(user.id, orgId);
        
        if (!hasAccess) {
          throw new ForbiddenError('You do not have access to this organization');
        }

        // Update user's current organization
        await UserService.updateCurrentOrganization(user.id, orgId);

        await auditLog('ORGANIZATION_SWITCHED', user.id, {
          fromOrgId: user.organizationId,
          toOrgId: orgId,
          orgName: organization.name
        });

        return organization;

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Switch organization error:', error);
        throw new Error('Failed to switch organization');
      }
    },

    async updateOrganizationSettings(parent, { id, input }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Check permissions - only org admin/owner or system admin
        const hasPermission = await OrganizationService.checkUserPermission(
          user.id, 
          id, 
          ['ADMIN']
        );
        
        if (!hasPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Insufficient permissions to update organization settings');
        }

        // Rate limiting
        await rateLimitCheck(req, 'update_org_settings', 10, 3600); // 10 per hour

        const organization = await OrganizationService.updateOrganizationSettings(id, input, user.id);

        await auditLog('ORGANIZATION_SETTINGS_UPDATED', user.id, {
          organizationId: id,
          updatedFields: Object.keys(input),
          values: input
        });

        return {
          success: true,
          organization,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Update organization settings error:', error);
        throw new Error('Failed to update organization settings');
      }
    },

    async updatePasswordPolicy(parent, { id, input }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Check permissions - only org admin/owner or system admin
        const hasPermission = await OrganizationService.checkUserPermission(
          user.id, 
          id, 
          ['ADMIN']
        );
        
        if (!hasPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Insufficient permissions to update password policy');
        }

        // Rate limiting
        await rateLimitCheck(req, 'update_password_policy', 5, 3600); // 5 per hour

        const organization = await OrganizationService.updatePasswordPolicy(id, input, user.id);

        await auditLog('PASSWORD_POLICY_UPDATED', user.id, {
          organizationId: id,
          updatedFields: Object.keys(input),
          values: input
        });

        return {
          success: true,
          organization,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Update password policy error:', error);
        throw new Error('Failed to update password policy');
      }
    },

    async updateDomainSettings(parent, { id, input }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Check permissions - only org admin/owner or system admin
        const hasPermission = await OrganizationService.checkUserPermission(
          user.id, 
          id, 
          ['ADMIN']
        );
        
        if (!hasPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Insufficient permissions to update domain settings');
        }

        // Rate limiting
        await rateLimitCheck(req, 'update_domain_settings', 10, 3600); // 10 per hour

        const organization = await OrganizationService.updateDomainSettings(id, input, user.id);

        await auditLog('DOMAIN_SETTINGS_UPDATED', user.id, {
          organizationId: id,
          updatedFields: Object.keys(input),
          values: input
        });

        return {
          success: true,
          organization,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Update domain settings error:', error);
        throw new Error('Failed to update domain settings');
      }
    },

    async updateBrandingSettings(parent, { id, input }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Check permissions - only org admin/owner or system admin
        const hasPermission = await OrganizationService.checkUserPermission(
          user.id, 
          id, 
          ['ADMIN']
        );
        
        if (!hasPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Insufficient permissions to update branding settings');
        }

        // Rate limiting
        await rateLimitCheck(req, 'update_branding_settings', 15, 3600); // 15 per hour

        const organization = await OrganizationService.updateBrandingSettings(id, input, user.id);

        await auditLog('BRANDING_SETTINGS_UPDATED', user.id, {
          organizationId: id,
          updatedFields: Object.keys(input),
          values: input
        });

        return {
          success: true,
          organization,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Update branding settings error:', error);
        throw new Error('Failed to update branding settings');
      }
    },

    async updateNotificationSettings(parent, { id, input }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Check permissions - only org admin/owner or system admin
        const hasPermission = await OrganizationService.checkUserPermission(
          user.id, 
          id, 
          ['ADMIN']
        );
        
        if (!hasPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Insufficient permissions to update notification settings');
        }

        // Rate limiting
        await rateLimitCheck(req, 'update_notification_settings', 20, 3600); // 20 per hour

        const organization = await OrganizationService.updateNotificationSettings(id, input, user.id);

        await auditLog('NOTIFICATION_SETTINGS_UPDATED', user.id, {
          organizationId: id,
          updatedFields: Object.keys(input),
          values: input
        });

        return {
          success: true,
          organization,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Update notification settings error:', error);
        throw new Error('Failed to update notification settings');
      }
    },

    async updateAnalyticsSettings(parent, { id, input }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Check permissions - only org admin/owner or system admin
        const hasPermission = await OrganizationService.checkUserPermission(
          user.id, 
          id, 
          ['ADMIN']
        );
        
        if (!hasPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Insufficient permissions to update analytics settings');
        }

        // Rate limiting
        await rateLimitCheck(req, 'update_analytics_settings', 10, 3600); // 10 per hour

        const organization = await OrganizationService.updateAnalyticsSettings(id, input, user.id);

        await auditLog('ANALYTICS_SETTINGS_UPDATED', user.id, {
          organizationId: id,
          updatedFields: Object.keys(input),
          values: input
        });

        return {
          success: true,
          organization,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Update analytics settings error:', error);
        throw new Error('Failed to update analytics settings');
      }
    }
  },

  Subscription: {
    organizationUpdated: {
      subscribe: withFilter(
        (parent, args, context) => context.pubsub.asyncIterator(['ORGANIZATION_UPDATED']),
        async (payload, variables, context) => {
          if (!context.user) return false;
          
          // Check if user has access to this organization
          const hasAccess = await OrganizationService.checkUserPermission(
            context.user.id, 
            variables.orgId
          );
          
          return hasAccess || context.user.role === 'ADMIN' || context.user.role === 'SUPER_ADMIN';
        }
      )
    },

    organizationMembershipChanged: {
      subscribe: withFilter(
        (parent, args, context) => context.pubsub.asyncIterator(['ORGANIZATION_MEMBERSHIP_CHANGED']),
        async (payload, variables, context) => {
          if (!context.user) return false;
          
          // Check if user has access to this organization
          const hasAccess = await OrganizationService.checkUserPermission(
            context.user.id, 
            variables.orgId
          );
          
          return hasAccess || context.user.role === 'ADMIN' || context.user.role === 'SUPER_ADMIN';
        }
      )
    }
  },

  // Field resolvers
  Organization: {
    id(parent) {
      return toGraphQLId(parent);
    },

    async memberCount(parent, args, context) {
      return parent.members ? parent.members.length : 0;
    },

    async userRole(parent, args, context) {
      const { user } = context;
      if (!user) return null;

      // Get user's role in this organization
      const OrgMembership = require('../../models/OrgMembership');
      const membership = await OrgMembership.findOne({
        user: user.id,
        org: parent.id,
        status: 'ACTIVE'
      });

      return membership ? membership.role : null;
    },

    // Ensure timezone is never null - provide default 'UTC'
    timezone(parent) {
      return parent.timezone || 'UTC';
    },

    // Ensure nested objects have default values
    passwordPolicy(parent) {
      return parent.passwordPolicy || {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        passwordHistory: 5,
        passwordExpiration: 90,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        enableMFA: false,
        sessionTimeout: 15,
        allowPasswordReset: true,
        enforcePasswordComplexity: false
      };
    },

    domainSettings(parent) {
      return parent.domainSettings || {
        allowedCallbackUrls: [],
        allowedLogoutUrls: [],
        allowedWebOrigins: [],
        customDomain: null,
        sdkAllowedDomains: [],
        enableCORS: true,
        corsMaxAge: 86400
      };
    },

    branding(parent) {
      return parent.branding || {
        primaryColor: '#4F46E5',
        secondaryColor: '#6B7280',
        logoUrl: null,
        faviconUrl: null,
        customCss: null
      };
    },

    notifications(parent) {
      return parent.notifications || {
        emailNotifications: true,
        securityAlerts: true,
        marketingEmails: false,
        weeklyReports: true,
        systemUpdates: true
      };
    },

    analytics(parent) {
      return parent.analytics || {
        enableTracking: true,
        retentionPeriod: 90,
        exportFormat: 'JSON'
      };
    }
  }
};

module.exports = organizationResolvers; 