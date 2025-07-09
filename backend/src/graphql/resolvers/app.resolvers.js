const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');
const { withFilter } = require('graphql-subscriptions');

// Models (since we don't have an AppService yet)
const App = require('../../models/App');
const AppMembership = require('../../models/AppMembership');
const Organization = require('../../models/Organization');
const OrgMembership = require('../../models/OrgMembership');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const ApiKey = require('../../models/ApiKey');

// Services
const UserService = require('../../services/user.service');
const OrganizationService = require('../../services/organization.service');
const PermissionService = require('../../services/permission.service');
const ApiKeyService = require('../../services/apikey.service');

// Utils
const { validateInput } = require('../../utils/validation');
const { rateLimitCheck } = require('../../middleware/rateLimiter');
const { auditLog } = require('../../utils/audit');
const { toGraphQLId, sanitizeObjectIds, sanitizeArrayIds } = require('../../utils/idHelpers');
const { USER_REQUIRED_FIELDS, USER_BASIC_FIELDS } = require('../../utils/userFields');

const appResolvers = {
  Query: {
    async app(parent, { id }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const app = await App.findById(id)
        .populate('organizationId')
        .populate('owner', USER_BASIC_FIELDS);

      if (!app) {
        throw new UserInputError('Application not found');
      }

      // Check if user has access to this app
      const hasOrgAccess = await OrganizationService.checkUserPermission(user.id, app.organizationId);
      const membership = await AppMembership.findOne({
        user: user.id,
        app: id,
        status: 'ACTIVE'
      });

      const hasAppAccess = !!membership;
      const isOwner = app.owner.toString() === user.id;
      const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

      if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
        throw new ForbiddenError('Access denied to this application');
      }

      return app;
    },

    async apps(parent, { limit = 10, offset = 0, sortBy = 'createdAt', sortOrder = 'desc', filter }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Build query criteria with null safety
        const criteria = {
          status: { $ne: 'DELETED' },
          _id: { $ne: null },
          name: { $ne: null, $exists: true },
          organizationId: { $ne: null, $exists: true } // Ensure organizationId is not null
        };

        // Handle organization filtering - this is critical for multi-tenant isolation
        let organizationIdFilter = null;

        if (filter) {
          if (filter.search) {
            criteria.$or = [
              { name: new RegExp(filter.search, 'i') },
              { description: new RegExp(filter.search, 'i') }
            ];
          }
          if (filter.type) criteria.type = filter.type;
          if (filter.status) criteria.status = filter.status;

          // CRITICAL FIX: If specific organizationId is requested, use ONLY that
          if (filter.organizationId) {
            organizationIdFilter = filter.organizationId;
            console.log(`🎯 Filtering apps for specific organization: ${organizationIdFilter}`);
          }
        }

        // Only system admins can see all apps across all organizations
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          // If no specific organization was requested, show apps from all user's organizations
          if (!organizationIdFilter) {
            console.log('📁 No specific org filter - getting all user organizations');
            const userOrgs = await OrganizationService.getUserOrganizations(user.id);
            const orgIds = userOrgs.map(org => org.id).filter(id => id); // Filter out null IDs

            if (orgIds.length > 0) {
              organizationIdFilter = { $in: orgIds };
              console.log(`📂 User has access to ${orgIds.length} organizations:`, orgIds);
            } else {
              // User has no organizations, return empty result
              console.log('❌ User has no organizations');
              return {
                apps: [],
                total: 0,
                hasNextPage: false,
                hasPreviousPage: false
              };
            }
          } else {
            // Verify user has access to the requested organization
            console.log(`🔐 Verifying user access to organization: ${organizationIdFilter}`);
            const userOrgs = await OrganizationService.getUserOrganizations(user.id);
            const hasAccess = userOrgs.some(org => org.id === organizationIdFilter);

            if (!hasAccess) {
              console.log(`❌ User does not have access to organization: ${organizationIdFilter}`);
              throw new ForbiddenError('Access denied to this organization');
            }
            console.log(`✅ User has access to organization: ${organizationIdFilter}`);
          }
        } else {
          // System admin - if specific org requested, use it; otherwise show all
          if (organizationIdFilter) {
            console.log(`👑 Admin filtering for specific organization: ${organizationIdFilter}`);
          } else {
            console.log('👑 Admin viewing all organizations');
          }
        }

        // Apply the organization filter
        if (organizationIdFilter) {
          criteria.organizationId = organizationIdFilter;
        }

        console.log('🔍 Final query criteria:', JSON.stringify(criteria, null, 2));

        const [rawApps, total] = await Promise.all([
          App.find(criteria)
            .populate('owner', USER_BASIC_FIELDS)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(offset)
            .limit(limit)
            .lean(),
          App.countDocuments(criteria)
        ]);

        console.log(`✅ Found ${rawApps.length} apps from database (total: ${total})`);
        if (rawApps.length > 0) {
          console.log('📋 Apps found:');
          rawApps.forEach((app, index) => {
            console.log(`  ${index + 1}. "${app.name}" in org ${app.organizationId}`);
          });
        }

        // Sanitize and filter out any null/invalid apps
        const apps = rawApps
          .filter(app => {
            // Strict validation
            if (!app || !app._id || !app.name) {
              console.warn('Filtering out invalid app:', app);
              return false;
            }
            return true;
          })
          .map(app => {
            try {
              console.log('Processing app:', {
                id: app._id,
                name: app.name,
                organizationId: app.organizationId,
                organizationIdType: typeof app.organizationId
              });

              // CRITICAL FIX: Ensure ID is always a valid string BEFORE sanitization
              const appId = app._id?.toString();
              if (!appId) {
                console.error('App has invalid _id:', app);
                return null;
              }

              const sanitizedApp = sanitizeObjectIds(app, ['organizationId']); // Don't sanitize id here

              // Manually set the ID to ensure it's never null
              sanitizedApp.id = appId;

              console.log('After sanitization:', {
                id: sanitizedApp.id,
                name: sanitizedApp.name,
                organizationId: sanitizedApp.organizationId,
                organizationIdType: typeof sanitizedApp.organizationId
              });

              // Ensure required fields exist with defaults
              sanitizedApp.name = sanitizedApp.name || 'Unnamed App';
              sanitizedApp.description = sanitizedApp.description || '';
              sanitizedApp.status = sanitizedApp.status || 'ACTIVE';
              sanitizedApp.type = sanitizedApp.type || 'WEB';

              // DON'T manually handle owner here - let the field resolver handle it
              // Just ensure the owner field exists as a reference
              if (!sanitizedApp.owner) {
                console.warn('App missing owner field, using unknown ID:', {
                  appId: app._id,
                  appName: app.name
                });
                sanitizedApp.owner = 'unknown';
              } else if (sanitizedApp.owner._id) {
                // If owner is populated, keep just the ID for the field resolver
                sanitizedApp.owner = sanitizedApp.owner._id.toString();
              } else if (typeof sanitizedApp.owner === 'object') {
                // If it's an ObjectId, convert to string
                sanitizedApp.owner = sanitizedApp.owner.toString();
              }
              // If it's already a string ID, leave it as is

              // Keep organizationId for field resolver - DON'T populate organization here
              // CRITICAL: Ensure organizationId is never null since it's non-nullable in schema
              if (!sanitizedApp.organizationId) {
                console.warn('App missing organizationId, using fallback:', {
                  appId: app._id,
                  appName: app.name,
                  originalOrgId: app.organizationId
                });
                sanitizedApp.organizationId = 'unknown';
              } else {
                // Ensure organizationId is a string
                sanitizedApp.organizationId = sanitizedApp.organizationId.toString();
              }

              // Final validation: Ensure all required non-nullable fields are present
              if (!sanitizedApp.id || !sanitizedApp.name || !sanitizedApp.organizationId) {
                console.error('App still missing required fields after sanitization:', {
                  id: sanitizedApp.id,
                  name: sanitizedApp.name,
                  organizationId: sanitizedApp.organizationId,
                  original: app
                });
                return null;
              }

              return sanitizedApp;
            } catch (error) {
              console.error('Error sanitizing app:', error, app);
              return null;
            }
          })
          .filter(app => app !== null); // Remove any null apps

        return {
          apps,
          total,
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0
        };

      } catch (error) {
        console.error('Error fetching apps:', error);
        throw new Error('Failed to fetch applications');
      }
    },

    async myApps(parent, args, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Get apps where user is a member or owner - DON'T populate owner here
        const memberships = await AppMembership.find({
          user: user.id,
          status: 'ACTIVE'
        }).populate('app'); // Just populate the app, not the owner

        return memberships.map(membership => {
          const app = membership.app.toObject();

          // CRITICAL FIX: Ensure ID is always a valid string
          const appId = app._id?.toString();
          if (!appId) {
            console.error('App in membership has invalid _id:', app);
            return null;
          }

          const sanitizedApp = sanitizeObjectIds(app, ['organizationId']); // Don't sanitize id here

          // Manually set the ID to ensure it's never null
          sanitizedApp.id = appId;

          // Ensure owner field is just an ID reference for the field resolver
          if (!sanitizedApp.owner) {
            console.warn('App missing owner field in myApps:', {
              appId: app._id,
              appName: app.name
            });
            sanitizedApp.owner = 'unknown';
          } else if (typeof sanitizedApp.owner === 'object') {
            // If it's an ObjectId, convert to string
            sanitizedApp.owner = sanitizedApp.owner.toString();
          }

          return {
            ...sanitizedApp,
            userRole: membership.role
          };
        }).filter(app => app !== null); // Remove any null apps
      } catch (error) {
        console.error('Error fetching myApps:', error);
        throw new Error('Failed to fetch user applications');
      }
    },

    async appMembers(parent, { appId }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Check if user has access to this app
      const app = await App.findById(appId).populate('owner');
      if (!app) {
        throw new UserInputError('Application not found');
      }

      const hasOrgAccess = await OrganizationService.checkUserPermission(user.id, app.organizationId);
      const membership = await AppMembership.findOne({
        user: user.id,
        app: appId,
        status: 'ACTIVE'
      });

      const hasAppAccess = !!membership;
      const isOwner = app.owner._id.toString() === user.id;
      const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

      if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
        throw new ForbiddenError('Access denied to this application');
      }

      const memberships = await AppMembership.find({
        app: appId,
        status: 'ACTIVE'
      }).populate('user', USER_BASIC_FIELDS);

      const members = memberships
        .filter(membership => membership.user._id.toString() !== app.owner._id.toString())
        .map(membership => ({
          user: membership.user,
          role: membership.role,
          joinedAt: membership.joinedAt
        }));

      return {
        owner: app.owner,
        members,
        total: members.length + 1
      };
    },

    async appApiKeys(parent, { appId }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const app = await App.findById(appId);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions - must be app member or system admin
        const membership = await AppMembership.findOne({
          user: user.id,
          app: appId,
          status: 'ACTIVE'
        });

        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!membership && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to view API keys for this application');
        }

        const apiKeys = await ApiKeyService.listApiKeys(appId, user.id);

        return {
          apiKeys,
          total: apiKeys.length
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Error fetching API keys:', error);
        throw new Error('Failed to fetch API keys');
      }
    },

    // App Logs Query - moved from Mutation to Query section
    async appLogs(parent, { appId, limit = 50, offset = 0, eventType, dateFrom, dateTo }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const app = await App.findById(appId);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          app.organizationId,
          ['MEMBER', 'ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: appId,
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to view app logs');
        }

        // Build query filter
        const filter = { appId };

        if (eventType) {
          filter.eventType = eventType;
        }

        if (dateFrom || dateTo) {
          filter.timestamp = {};
          if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
          if (dateTo) filter.timestamp.$lte = new Date(dateTo);
        }

        // Get logs from AuditLog collection or dedicated AppLog collection
        const logs = await AuditLog.find(filter)
          .populate('userId', USER_BASIC_FIELDS)
          .sort({ timestamp: -1 })
          .limit(limit)
          .skip(offset);

        const total = await AuditLog.countDocuments(filter);

        return {
          logs: logs.map(log => ({
            id: log._id,
            appId: log.appId,
            eventType: log.event,
            eventCategory: getEventCategory(log.event),
            severity: getSeverity(log.event),
            message: log.details?.message || log.event,
            metadata: log.details,
            userId: log.userId,
            user: log.userId,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            location: log.location,
            timestamp: log.createdAt
          })),
          total,
          hasNextPage: offset + limit < total,
          hasPreviousPage: offset > 0
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('App logs fetch error:', error);
        throw new Error('Failed to fetch app logs');
      }
    }
  },

  Mutation: {
    async createApp(parent, { input }, context) {
      const { user, req } = context;

      console.log('createApp called with:', { input, user: user ? { id: user.id, email: user.email } : null });

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const { organizationId } = input;

        // Check permissions - INDUSTRY STANDARD: Only organization admins can create apps
        const hasPermission = await OrganizationService.checkUserPermission(
          user.id,
          organizationId,
          ['ADMIN'] // REMOVED 'MEMBER' - only admins can create apps
        );

        if (!hasPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Insufficient permissions to create app in this organization. Only organization administrators can create applications.');
        }

        // Rate limiting
        await rateLimitCheck(req, 'create_app', 10, 3600); // 10 per hour

        const appData = {
          name: input.name,
          description: input.description,
          type: input.type,
          organizationId: input.organizationId,
          owner: user.id,
          members: [user.id],
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const app = await App.create(appData);

        // Create owner membership
        await AppMembership.create({
          user: user.id,
          app: app._id,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date()
        });

        await auditLog('APP_CREATED', user.id, {
          appId: app._id,
          appName: app.name,
          organizationId
        });

        // Get the app with its owner, but not populating organizationId
        const populatedApp = await App.findById(app._id)
          .lean(); // Don't populate owner here, let field resolver handle it

        // CRITICAL FIX: Ensure ID is always a valid string BEFORE sanitization
        const appId = populatedApp._id?.toString();
        if (!appId) {
          console.error('Created app has invalid _id:', populatedApp);
          throw new Error('Failed to create application - invalid ID generated');
        }

        const sanitizedApp = sanitizeObjectIds(populatedApp, ['organizationId']); // Don't sanitize id here

        // Manually set the ID to ensure it's never null
        sanitizedApp.id = appId;

        // Ensure owner field is just an ID reference for the field resolver
        if (!sanitizedApp.owner) {
          console.warn('Created app missing owner field:', {
            appId: app._id,
            appName: app.name
          });
          sanitizedApp.owner = user.id; // Use the creating user's ID
        } else if (typeof sanitizedApp.owner === 'object') {
          // If it's an ObjectId, convert to string
          sanitizedApp.owner = sanitizedApp.owner.toString();
        }

        return {
          success: true,
          app: sanitizedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('App creation error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          input: input,
          userId: user.id
        });
        throw new Error(`Failed to create application: ${error.message}`);
      }
    },

    async updateApp(parent, { id, input }, context) {
      const { user, req } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const app = await App.findById(id);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          app.organizationId,
          ['ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: id,
          role: 'ADMIN',
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to update this application');
        }

        // Rate limiting
        await rateLimitCheck(req, 'update_app', 20, 3600); // 20 per hour

        const allowedFields = ['name', 'description', 'status', 'settings'];
        const updateData = {};
        Object.keys(input).forEach(key => {
          if (allowedFields.includes(key)) {
            updateData[key] = input[key];
          }
        });

        updateData.updatedAt = new Date();

        const updatedApp = await App.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        ).populate('organizationId').populate('owner', USER_BASIC_FIELDS);

        await auditLog('APP_UPDATED', user.id, {
          appId: id,
          updatedFields: Object.keys(updateData)
        });

        return {
          success: true,
          app: updatedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('App update error:', error);
        throw new Error('Failed to update application');
      }
    },

    async deleteApp(parent, { id }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const app = await App.findById(id);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions - only app owner or system admin
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Only application owner or system admin can delete application');
        }

        // Soft delete
        await App.findByIdAndUpdate(id, {
          status: 'DELETED',
          deletedAt: new Date(),
          deletedBy: user.id,
          updatedAt: new Date()
        });

        // Remove all memberships
        await AppMembership.updateMany(
          { app: id, status: 'ACTIVE' },
          {
            status: 'REMOVED',
            removedAt: new Date(),
            removedBy: user.id
          }
        );

        await auditLog('APP_DELETED', user.id, { appId: id });

        return {
          success: true,
          message: 'Application deleted successfully',
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('App deletion error:', error);
        throw new Error('Failed to delete application');
      }
    },

    async addAppMember(parent, { input }, context) {
      const { user, req } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const { appId, userId, role } = input;

        const app = await App.findById(appId);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          app.organizationId,
          ['ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: appId,
          role: 'ADMIN',
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to add members to this application');
        }

        // Rate limiting
        await rateLimitCheck(req, 'add_app_member', 30, 3600); // 30 per hour

        // Check if user is already a member
        const existingMembership = await AppMembership.findOne({
          app: appId,
          user: userId
        });

        if (existingMembership) {
          if (existingMembership.status === 'ACTIVE') {
            throw new UserInputError('User is already a member of this application');
          } else {
            // Reactivate membership
            existingMembership.status = 'ACTIVE';
            existingMembership.role = role;
            existingMembership.joinedAt = new Date();
            await existingMembership.save();
          }
        } else {
          // Create new membership
          await AppMembership.create({
            user: userId,
            app: appId,
            role,
            status: 'ACTIVE',
            joinedAt: new Date()
          });
        }

        // Add user to app members array
        await App.findByIdAndUpdate(
          appId,
          {
            $addToSet: { members: userId },
            updatedAt: new Date()
          }
        );

        await auditLog('APP_MEMBER_ADDED', user.id, {
          appId,
          addedUserId: userId,
          role
        });

        const updatedApp = await App.findById(appId)
          .populate('organizationId')
          .populate('owner', USER_BASIC_FIELDS);

        return {
          success: true,
          app: updatedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Add app member error:', error);
        throw new Error('Failed to add application member');
      }
    },

    async removeAppMember(parent, { input }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const { appId, userId } = input;

        const app = await App.findById(appId);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Cannot remove owner
        if (app.owner.toString() === userId) {
          throw new UserInputError('Cannot remove application owner');
        }

        // Check permissions
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          app.organizationId,
          ['ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: appId,
          role: 'ADMIN',
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to remove members from this application');
        }

        // Update membership status
        await AppMembership.findOneAndUpdate(
          { app: appId, user: userId },
          {
            status: 'REMOVED',
            removedAt: new Date(),
            removedBy: user.id
          }
        );

        // Remove user from app members array
        await App.findByIdAndUpdate(
          appId,
          {
            $pull: { members: userId },
            updatedAt: new Date()
          }
        );

        await auditLog('APP_MEMBER_REMOVED', user.id, {
          appId,
          removedUserId: userId
        });

        const updatedApp = await App.findById(appId)
          .populate('organizationId')
          .populate('owner', USER_BASIC_FIELDS);

        return {
          success: true,
          app: updatedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Remove app member error:', error);
        throw new Error('Failed to remove application member');
      }
    },

    async updateAppMemberRole(parent, { input }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const { appId, userId, role } = input;

        const app = await App.findById(appId);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          app.organizationId,
          ['ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: appId,
          role: 'ADMIN',
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to update member roles in this application');
        }

        const targetMembership = await AppMembership.findOne({
          app: appId,
          user: userId,
          status: 'ACTIVE'
        });

        if (!targetMembership) {
          throw new UserInputError('User is not a member of this application');
        }

        const oldRole = targetMembership.role;
        targetMembership.role = role;
        targetMembership.updatedAt = new Date();
        await targetMembership.save();

        await auditLog('APP_MEMBER_ROLE_UPDATED', user.id, {
          appId,
          userId,
          oldRole,
          newRole: role
        });

        const updatedApp = await App.findById(appId)
          .populate('organizationId')
          .populate('owner', USER_BASIC_FIELDS);

        return {
          success: true,
          app: updatedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Update app member role error:', error);
        throw new Error('Failed to update application member role');
      }
    },

    // API Key Management
    async createApiKey(parent, { input }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const { appId, name, permissions, expiresAt } = input;

        const app = await App.findById(appId);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions - must be app owner or admin
        const membership = await AppMembership.findOne({
          user: user.id,
          app: appId,
          role: { $in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE'
        });

        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!membership && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to create API keys for this application');
        }

        const apiKey = await ApiKeyService.createApiKey(appId, user.id, {
          name,
          permissions,
          expiresAt
        });

        return {
          success: true,
          apiKey,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Create API key error:', error);
        throw new Error('Failed to create API key');
      }
    },

    async revokeApiKey(parent, { id }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const success = await ApiKeyService.revokeApiKey(id, user.id);

        return {
          success,
          message: success ? 'API key revoked successfully' : 'Failed to revoke API key',
          errors: []
        };

      } catch (error) {
        console.error('Revoke API key error:', error);
        throw new Error('Failed to revoke API key');
      }
    },

    async updateApiKey(parent, { id, input }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const apiKey = await ApiKeyService.updateApiKey(id, user.id, input);

        return {
          success: true,
          apiKey,
          errors: []
        };

      } catch (error) {
        console.error('Update API key error:', error);
        throw new Error('Failed to update API key');
      }
    },

    async archiveApp(parent, { appId }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const app = await App.findById(appId);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions - only app admin or system admin
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          app.organizationId,
          ['ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: appId,
          role: 'ADMIN',
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to archive this application');
        }

        const updatedApp = await App.findByIdAndUpdate(
          appId,
          {
            status: 'SUSPENDED',
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        ).populate('organizationId').populate('owner', USER_BASIC_FIELDS);

        await auditLog('APP_ARCHIVED', user.id, { appId });

        return {
          success: true,
          app: updatedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Archive app error:', error);
        throw new Error('Failed to archive application');
      }
    },

    async unarchiveApp(parent, { appId }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const app = await App.findById(appId);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions - only app admin or system admin
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          app.organizationId,
          ['ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: appId,
          role: 'ADMIN',
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to unarchive this application');
        }

        const updatedApp = await App.findByIdAndUpdate(
          appId,
          {
            status: 'ACTIVE',
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        ).populate('organizationId').populate('owner', USER_BASIC_FIELDS);

        await auditLog('APP_UNARCHIVED', user.id, { appId });

        return {
          success: true,
          app: updatedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Unarchive app error:', error);
        throw new Error('Failed to unarchive application');
      }
    },

    async bulkUpdateAppStatus(parent, { appIds, status }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Only system admins can perform bulk operations
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Only system administrators can perform bulk operations');
        }

        const result = await App.updateMany(
          { _id: { $in: appIds }, status: { $ne: 'DELETED' } },
          {
            status,
            updatedAt: new Date()
          }
        );

        await auditLog('BULK_APP_STATUS_UPDATE', user.id, {
          appIds,
          status,
          updatedCount: result.modifiedCount
        });

        return {
          success: true,
          message: `Successfully updated ${result.modifiedCount} applications`,
          updatedCount: result.modifiedCount,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Bulk update app status error:', error);
        throw new Error('Failed to bulk update application status');
      }
    },

    async bulkDeleteApps(parent, { appIds }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Only system admins can perform bulk operations
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Only system administrators can perform bulk operations');
        }

        const result = await App.updateMany(
          { _id: { $in: appIds }, status: { $ne: 'DELETED' } },
          {
            status: 'DELETED',
            deletedAt: new Date(),
            deletedBy: user.id,
            updatedAt: new Date()
          }
        );

        // Remove all memberships for deleted apps
        await AppMembership.updateMany(
          { app: { $in: appIds }, status: 'ACTIVE' },
          {
            status: 'REMOVED',
            removedAt: new Date(),
            removedBy: user.id
          }
        );

        await auditLog('BULK_APP_DELETE', user.id, {
          appIds,
          deletedCount: result.modifiedCount
        });

        return {
          success: true,
          message: `Successfully deleted ${result.modifiedCount} applications`,
          deletedCount: result.modifiedCount,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw error;
        }
        console.error('Bulk delete apps error:', error);
        throw new Error('Failed to bulk delete applications');
      }
    },

    async transferAppOwnership(parent, { appId, newOwnerId }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const app = await App.findById(appId);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Only current owner or system admin can transfer ownership
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Only application owner or system admin can transfer ownership');
        }

        // Verify new owner exists
        const newOwner = await UserService.getUserById(newOwnerId);
        if (!newOwner) {
          throw new UserInputError('New owner not found');
        }

        const oldOwnerId = app.owner;

        // Update app ownership
        const updatedApp = await App.findByIdAndUpdate(
          appId,
          {
            owner: newOwnerId,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        ).populate('organizationId').populate('owner', USER_BASIC_FIELDS);

        // Update memberships
        // Remove old owner's membership if they have one
        await AppMembership.findOneAndUpdate(
          { app: appId, user: oldOwnerId },
          {
            role: 'MEMBER',
            updatedAt: new Date()
          }
        );

        // Create or update new owner's membership
        await AppMembership.findOneAndUpdate(
          { app: appId, user: newOwnerId },
          {
            role: 'OWNER',
            status: 'ACTIVE',
            joinedAt: new Date(),
            updatedAt: new Date()
          },
          { upsert: true }
        );

        await auditLog('APP_OWNERSHIP_TRANSFERRED', user.id, {
          appId,
          oldOwnerId,
          newOwnerId
        });

        return {
          success: true,
          app: updatedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Transfer app ownership error:', error);
        throw new Error('Failed to transfer application ownership');
      }
    },

    async cloneApp(parent, { appId, name, organizationId }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const originalApp = await App.findById(appId);
        if (!originalApp) {
          throw new UserInputError('Application not found');
        }

        // Check if user has access to the original app
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          originalApp.organizationId,
          ['MEMBER', 'ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: appId,
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = originalApp.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to clone this application');
        }

        // Use provided organizationId or default to user's current organization
        const targetOrgId = organizationId || originalApp.organizationId;

        // Check permissions for target organization
        const hasTargetOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          targetOrgId,
          ['ADMIN']
        );

        if (!hasTargetOrgAccess && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
          throw new ForbiddenError('Insufficient permissions to create app in target organization');
        }

        // Create cloned app
        const clonedAppData = {
          name,
          description: `Clone of ${originalApp.name}`,
          type: originalApp.type,
          organizationId: targetOrgId,
          owner: user.id,
          members: [user.id],
          status: 'ACTIVE',
          settings: originalApp.settings,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const clonedApp = await App.create(clonedAppData);

        // Create owner membership
        await AppMembership.create({
          user: user.id,
          app: clonedApp._id,
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date()
        });

        await auditLog('APP_CLONED', user.id, {
          originalAppId: appId,
          clonedAppId: clonedApp._id,
          targetOrgId
        });

        const populatedApp = await App.findById(clonedApp._id)
          .populate('organizationId')
          .populate('owner', USER_BASIC_FIELDS);

        return {
          success: true,
          app: populatedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Clone app error:', error);
        throw new Error('Failed to clone application');
      }
    },

    async regenerateApiKey(parent, { input }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const { appId, keyId } = input;

        const app = await App.findById(appId);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          app.organizationId,
          ['ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: appId,
          role: { $in: ['ADMIN'] },
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to regenerate API keys');
        }

        const apiKey = await ApiKey.findById(keyId);
        if (!apiKey || apiKey.appId.toString() !== appId) {
          throw new UserInputError('API key not found');
        }

        // Generate new key
        const newKey = generateApiKey();
        apiKey.key = newKey;
        apiKey.updatedAt = new Date();
        await apiKey.save();

        await auditLog('API_KEY_REGENERATED', user.id, {
          appId,
          keyId,
          keyName: apiKey.name
        });

        return {
          success: true,
          apiKey,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('API key regeneration error:', error);
        throw new Error('Failed to regenerate API key');
      }
    },

    // New App Settings Mutations
    async updateAppGeneralSettings(parent, { id, input }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const app = await App.findById(id);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          app.organizationId,
          ['ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: id,
          role: { $in: ['ADMIN'] },
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to update app settings');
        }

        // Update general settings
        const settings = app.settings || {};
        settings.general = {
          ...settings.general,
          ...input
        };

        const updatedApp = await App.findByIdAndUpdate(
          id,
          {
            settings,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        ).populate('organizationId').populate('owner', USER_BASIC_FIELDS);

        await auditLog('APP_GENERAL_SETTINGS_UPDATED', user.id, {
          appId: id,
          updatedFields: Object.keys(input)
        });

        return {
          success: true,
          app: updatedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('App general settings update error:', error);
        throw new Error('Failed to update app general settings');
      }
    },

    async updateAppAuthSettings(parent, { id, input }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const app = await App.findById(id);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          app.organizationId,
          ['ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: id,
          role: { $in: ['ADMIN'] },
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to update app auth settings');
        }

        // Update auth settings
        const settings = app.settings || {};
        settings.auth = {
          ...settings.auth,
          ...input
        };

        const updatedApp = await App.findByIdAndUpdate(
          id,
          {
            settings,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        ).populate('organizationId').populate('owner', USER_BASIC_FIELDS);

        await auditLog('APP_AUTH_SETTINGS_UPDATED', user.id, {
          appId: id,
          updatedFields: Object.keys(input)
        });

        return {
          success: true,
          app: updatedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('App auth settings update error:', error);
        throw new Error('Failed to update app auth settings');
      }
    },

    async updateAppSecuritySettings(parent, { id, input }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const app = await App.findById(id);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          app.organizationId,
          ['ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: id,
          role: { $in: ['ADMIN'] },
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to update app security settings');
        }

        // Update security settings
        const settings = app.settings || {};
        settings.security = {
          ...settings.security,
          ...input
        };

        const updatedApp = await App.findByIdAndUpdate(
          id,
          {
            settings,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        ).populate('organizationId').populate('owner', USER_BASIC_FIELDS);

        await auditLog('APP_SECURITY_SETTINGS_UPDATED', user.id, {
          appId: id,
          updatedFields: Object.keys(input)
        });

        return {
          success: true,
          app: updatedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('App security settings update error:', error);
        throw new Error('Failed to update app security settings');
      }
    },

    async updateAppBrandingSettings(parent, { id, input }, context) {
      const { user } = context;

      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const app = await App.findById(id);
        if (!app) {
          throw new UserInputError('Application not found');
        }

        // Check permissions
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          app.organizationId,
          ['ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: id,
          role: { $in: ['ADMIN'] },
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = app.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          throw new ForbiddenError('Insufficient permissions to update app branding settings');
        }

        // Update branding settings
        const settings = app.settings || {};
        settings.branding = {
          ...settings.branding,
          ...input
        };

        const updatedApp = await App.findByIdAndUpdate(
          id,
          {
            settings,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        ).populate('organizationId').populate('owner', USER_BASIC_FIELDS);

        await auditLog('APP_BRANDING_SETTINGS_UPDATED', user.id, {
          appId: id,
          updatedFields: Object.keys(input)
        });

        return {
          success: true,
          app: updatedApp,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('App branding settings update error:', error);
        throw new Error('Failed to update app branding settings');
      }
    }
  },

  Subscription: {
    appUpdated: {
      subscribe: withFilter(
        (parent, args, context) => context.pubsub.asyncIterator(['APP_UPDATED']),
        async (payload, variables, context) => {
          if (!context.user) return false;

          // Check if user has access to this app
          const membership = await AppMembership.findOne({
            user: context.user.id,
            app: variables.appId,
            status: 'ACTIVE'
          });

          return !!membership || context.user.role === 'ADMIN' || context.user.role === 'SUPER_ADMIN';
        }
      )
    },

    appMembershipChanged: {
      subscribe: withFilter(
        (parent, args, context) => context.pubsub.asyncIterator(['APP_MEMBERSHIP_CHANGED']),
        async (payload, variables, context) => {
          if (!context.user) return false;

          // Check if user has access to this app
          const membership = await AppMembership.findOne({
            user: context.user.id,
            app: variables.appId,
            status: 'ACTIVE'
          });

          return !!membership || context.user.role === 'ADMIN' || context.user.role === 'SUPER_ADMIN';
        }
      )
    }
  },

  // Field resolvers
  App: {
    id(parent) {
      // Ensure ID is always a string, never a MongoDB ObjectId
      if (parent.id) {
        return parent.id.toString();
      }
      if (parent._id) {
        return parent._id.toString();
      }
      console.error('App object missing both id and _id fields:', parent);
      return 'unknown';
    },

    organizationId(parent) {
      return parent.organizationId;
    },

    async organization(parent, args, context) {
      const { dataLoader } = context;

      try {
        if (dataLoader?.organizationLoader) {
          return await dataLoader.organizationLoader.load(parent.organizationId);
        }

        return await Organization.findById(parent.organizationId);
      } catch (error) {
        console.error('Error loading organization:', error);
        return null;
      }
    },

    async owner(parent, args, context) {
      const { dataLoader } = context;

      try {
        let ownerId = parent.owner;

        // Ensure ownerId is a string if it's an ObjectId
        if (ownerId && typeof ownerId === 'object' && ownerId.toString) {
          ownerId = ownerId.toString();
        }

        if (!ownerId) {
          console.error('App has no owner ID:', { appId: parent._id || parent.id });
          // Return a placeholder user instead of null to satisfy non-nullable requirement
          return {
            id: 'unknown',
            username: 'Unknown User',
            email: 'unknown@example.com',
            role: 'USER'
          };
        }

        let ownerUser = null;

        if (dataLoader?.userLoader) {
          ownerUser = await dataLoader.userLoader.load(ownerId);
        } else {
          ownerUser = await User.findById(ownerId).select(USER_BASIC_FIELDS);
        }

        if (!ownerUser) {
          console.error('App owner user not found:', {
            appId: parent._id || parent.id,
            ownerId: ownerId
          });
          // Return a placeholder user instead of null to satisfy non-nullable requirement
          return {
            id: ownerId,
            username: 'Deleted User',
            email: 'deleted@example.com',
            role: 'USER'
          };
        }

        // Ensure the user object has an id field
        if (!ownerUser.id && ownerUser._id) {
          ownerUser.id = ownerUser._id.toString();
        }

        return ownerUser;
      } catch (error) {
        console.error('Error loading app owner:', error, {
          appId: parent._id || parent.id,
          ownerId: parent.owner
        });
        // Return a placeholder user instead of null to satisfy non-nullable requirement
        return {
          id: parent.owner?.toString() || 'unknown',
          username: 'Error Loading User',
          email: 'error@example.com',
          role: 'USER'
        };
      }
    },

    async memberCount(parent, args, context) {
      try {
        return await AppMembership.countDocuments({
          app: parent._id,
          status: 'ACTIVE'
        });
      } catch (error) {
        console.error('Error counting app members:', error);
        return 0;
      }
    },

    async members(parent, args, context) {
      try {
        const memberships = await AppMembership.find({
          app: parent._id,
          status: 'ACTIVE'
        }).populate('user', USER_BASIC_FIELDS);

        return memberships.map(m => m.user);
      } catch (error) {
        console.error('Error loading app members:', error);
        return [];
      }
    },

    async userRole(parent, args, context) {
      const { user } = context;

      if (!user) return null;

      try {
        // Check if user is the owner
        if (parent.owner.toString() === user.id) {
          return 'OWNER';
        }

        // Check membership
        const membership = await AppMembership.findOne({
          app: parent._id,
          user: user.id,
          status: 'ACTIVE'
        });

        return membership ? membership.role : null;
      } catch (error) {
        console.error('Error determining user role:', error);
        return null;
      }
    },

    async apiKeys(parent, args, context) {
      const { user } = context;

      if (!user) return [];

      try {
        // Check permissions
        const hasOrgAccess = await OrganizationService.checkUserPermission(
          user.id,
          parent.organizationId,
          ['ADMIN']
        );
        const membership = await AppMembership.findOne({
          user: user.id,
          app: parent._id,
          role: { $in: ['ADMIN'] },
          status: 'ACTIVE'
        });

        const hasAppAccess = !!membership;
        const isOwner = parent.owner.toString() === user.id;
        const isSystemAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

        if (!hasOrgAccess && !hasAppAccess && !isOwner && !isSystemAdmin) {
          return [];
        }

        return await ApiKey.find({
          appId: parent._id,
          isActive: true
        }).sort({ createdAt: -1 });
      } catch (error) {
        console.error('Error loading API keys:', error);
        return [];
      }
    },

    // New field resolvers for app settings
    generalSettings(parent) {
      const settings = parent.settings || {};
      return {
        website: settings.general?.website || '',
        description: settings.general?.description || parent.description || '',
        logoUrl: settings.general?.logoUrl || '',
        allowedOrigins: settings.general?.allowedOrigins || [],
        allowedCallbacks: settings.general?.allowedCallbacks || [],
        allowedLogouts: settings.general?.allowedLogouts || []
      };
    },

    authSettings(parent) {
      const settings = parent.settings || {};
      return {
        enableSignUp: settings.auth?.enableSignUp ?? true,
        requireEmailVerification: settings.auth?.requireEmailVerification ?? true,
        allowSocialLogins: settings.auth?.allowSocialLogins ?? false,
        socialProviders: settings.auth?.socialProviders || [],
        sessionTimeout: settings.auth?.sessionTimeout || 24,
        enablePasswordless: settings.auth?.enablePasswordless ?? false,
        jwtAlgorithm: settings.auth?.jwtAlgorithm || 'RS256',
        jwtExpiration: settings.auth?.jwtExpiration || 24
      };
    },

    securitySettings(parent) {
      const settings = parent.settings || {};
      return {
        enableMFA: settings.security?.enableMFA ?? false,
        enableRateLimit: settings.security?.enableRateLimit ?? true,
        rateLimitRequests: settings.security?.rateLimitRequests || 100,
        rateLimitWindow: settings.security?.rateLimitWindow || 15,
        enableBruteForceProtection: settings.security?.enableBruteForceProtection ?? true,
        maxLoginAttempts: settings.security?.maxLoginAttempts || 5,
        lockoutDuration: settings.security?.lockoutDuration || 30,
        enableAnomalyDetection: settings.security?.enableAnomalyDetection ?? false
      };
    },

    brandingSettings(parent) {
      const settings = parent.settings || {};
      return {
        primaryColor: settings.branding?.primaryColor || '#4F46E5',
        secondaryColor: settings.branding?.secondaryColor || '#6B7280',
        customCss: settings.branding?.customCss || '',
        customLogo: settings.branding?.customLogo || '',
        customFavicon: settings.branding?.customFavicon || ''
      };
    }
  }
};

// Helper functions for log processing
function getEventCategory(eventType) {
  const categoryMap = {
    LOGIN_SUCCESS: 'AUTHENTICATION',
    LOGIN_FAILED: 'AUTHENTICATION',
    LOGOUT: 'AUTHENTICATION',
    PASSWORD_RESET_REQUEST: 'AUTHENTICATION',
    PASSWORD_RESET_SUCCESS: 'AUTHENTICATION',
    EMAIL_VERIFICATION: 'AUTHENTICATION',
    MFA_CHALLENGE: 'AUTHENTICATION',
    MFA_SUCCESS: 'AUTHENTICATION',
    MFA_FAILED: 'AUTHENTICATION',
    SIGNUP_SUCCESS: 'AUTHENTICATION',
    SIGNUP_FAILED: 'AUTHENTICATION',

    APP_UPDATED: 'ADMIN',
    APP_MEMBER_ADDED: 'ADMIN',
    APP_MEMBER_REMOVED: 'ADMIN',
    APP_MEMBER_ROLE_UPDATED: 'ADMIN',
    API_KEY_CREATED: 'ADMIN',
    API_KEY_REVOKED: 'ADMIN',
    SETTINGS_UPDATED: 'ADMIN',
    APP_GENERAL_SETTINGS_UPDATED: 'ADMIN',
    APP_AUTH_SETTINGS_UPDATED: 'ADMIN',
    APP_SECURITY_SETTINGS_UPDATED: 'ADMIN',
    APP_BRANDING_SETTINGS_UPDATED: 'ADMIN',

    RATE_LIMIT_EXCEEDED: 'SECURITY',
    BRUTE_FORCE_DETECTED: 'SECURITY',
    SUSPICIOUS_LOGIN: 'SECURITY',
    ACCOUNT_LOCKED: 'SECURITY',
    ACCOUNT_UNLOCKED: 'SECURITY',

    API_REQUEST: 'API',
    API_ERROR: 'API',
    WEBHOOK_SENT: 'API',
    WEBHOOK_FAILED: 'API'
  };

  return categoryMap[eventType] || 'SYSTEM';
}

function getSeverity(eventType) {
  const severityMap = {
    LOGIN_SUCCESS: 'INFO',
    LOGOUT: 'INFO',
    SIGNUP_SUCCESS: 'INFO',
    EMAIL_VERIFICATION: 'INFO',
    MFA_SUCCESS: 'INFO',
    PASSWORD_RESET_SUCCESS: 'INFO',
    APP_UPDATED: 'INFO',
    SETTINGS_UPDATED: 'INFO',
    API_REQUEST: 'INFO',

    LOGIN_FAILED: 'WARNING',
    SIGNUP_FAILED: 'WARNING',
    MFA_FAILED: 'WARNING',
    PASSWORD_RESET_REQUEST: 'WARNING',
    API_ERROR: 'WARNING',
    WEBHOOK_FAILED: 'WARNING',

    RATE_LIMIT_EXCEEDED: 'ERROR',
    BRUTE_FORCE_DETECTED: 'ERROR',
    SUSPICIOUS_LOGIN: 'ERROR',
    ACCOUNT_LOCKED: 'ERROR',

    // Add any critical events here
    ACCOUNT_COMPROMISED: 'CRITICAL',
    DATA_BREACH: 'CRITICAL'
  };

  return severityMap[eventType] || 'INFO';
}

// Utility function to generate API keys
function generateApiKey() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

module.exports = appResolvers; 