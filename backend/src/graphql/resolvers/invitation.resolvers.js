const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');
const { withFilter } = require('graphql-subscriptions');
const mongoose = require('mongoose');

// Models
const Invitation = require('../../models/Invitation');
const OrgInvitation = require('../../models/OrgInvitation');
const Organization = require('../../models/Organization');
const App = require('../../models/App');

// Services
const UserService = require('../../services/user.service');
const TokenService = require('../../services/token.service');
const EmailService = require('../../services/email.service');
const OrganizationService = require('../../services/organization.service');
const PermissionService = require('../../services/permission.service');
const AuthService = require('../../services/auth.service');

// Utils
const { validateInput } = require('../../utils/validation');
const { rateLimitCheck } = require('../../middleware/rateLimiter');
const { auditLog } = require('../../utils/audit');

const invitationResolvers = {
  Query: {
    async invitation(parent, { id }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const invitation = await Invitation.findById(id)
        .populate('invitedBy', 'username email firstName lastName')
        .populate('invitedUser', 'username email firstName lastName')
        .populate('organization', 'name')
        .populate('app', 'name');

      if (!invitation) {
        throw new UserInputError('Invitation not found');
      }

      // Users can only view invitations they sent, received, or if they're admin
      const canView = (
        invitation.invitedBy._id.toString() === user.id ||
        invitation.email === user.email ||
        user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN'
      );

      if (!canView) {
        throw new ForbiddenError('Access denied to this invitation');
      }

      return invitation;
    },

    async invitations(parent, { limit, offset, sortBy, sortOrder, filter }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const criteria = {};
      
      // If user is not admin, restrict access to their own invitations or apps they manage
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        // Allow users to see invitations for apps they have access to
        if (filter && filter.appId) {
          // Check if user has access to this specific app
          const app = await App.findById(filter.appId);
          if (!app) {
            throw new UserInputError('Application not found');
          }
          
          // Check if user has permission to view this app's invitations
          // Allow both ADMIN and OWNER roles
          const hasAppAccess = await OrganizationService.checkUserPermission(
            user.id, 
            app.organizationId, 
            ['ADMIN', 'OWNER']
          );
          
          if (!hasAppAccess) {
            throw new ForbiddenError('Insufficient permissions to view these invitations');
          }
          
          criteria.app = filter.appId;
        } else {
          // If no specific app filter, only show invitations they sent or received
          criteria.$or = [
            { invitedBy: user.id },
            { email: user.email }
          ];
        }
      }

      // Apply other filters
      if (filter) {
        if (filter.email) criteria.email = new RegExp(filter.email, 'i');
        if (filter.status) criteria.status = filter.status;
        if (filter.type) criteria.type = filter.type;
        if (filter.organizationId) criteria.organization = filter.organizationId;
        if (filter.appId && !criteria.app) criteria.app = filter.appId; // Only if not already set above
        if (filter.invitedBy) criteria.invitedBy = filter.invitedBy;
        if (filter.search) {
          criteria.email = new RegExp(filter.search, 'i');
        }
      }

      const [invitations, total] = await Promise.all([
        Invitation.find(criteria)
          .populate('invitedBy', 'username email')
          .populate('invitedUser', 'username email')
          .populate('organization', 'name')
          .populate('app', 'name')
          .sort({ [sortBy || 'createdAt']: sortOrder === 'ASC' ? 1 : -1 })
          .skip(offset || 0)
          .limit(limit || 10)
          .lean(),
        Invitation.countDocuments(criteria)
      ]);

      return {
        invitations,
        total,
        hasNextPage: (offset || 0) + (limit || 10) < total,
        hasPreviousPage: (offset || 0) > 0
      };
    },

    async myInvitations(parent, args, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      return await Invitation.find({
        email: user.email,
        status: { $in: ['PENDING', 'ACCEPTED'] }
      })
      .populate('invitedBy', 'username email')
      .populate('organization', 'name')
      .populate('app', 'name')
      .sort({ createdAt: -1 });
    },

    async sentInvitations(parent, args, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      return await Invitation.find({
        invitedBy: user.id
      })
      .populate('invitedUser', 'username email')
      .populate('organization', 'name')
      .populate('app', 'name')
      .sort({ createdAt: -1 });
    },

    async pendingInvitations(parent, args, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const invitations = await Invitation.find({
          email: user.email,
          status: 'PENDING',
          expiresAt: { $gt: new Date() }
        })
        .populate('invitedBy', 'username email')
        .populate('organization', 'name')
        .populate('app', 'name')
        .sort({ createdAt: -1 });

        return invitations;
      } catch (error) {
        console.error('Error fetching pending invitations:', error);
        throw new Error('Failed to fetch pending invitations');
      }
    },

    async orgInvitations(parent, { orgId }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        console.log(`🔍 orgInvitations query - User: ${user.username}, OrgId: ${orgId}`);
        
        // Validate orgId format
        if (!orgId || typeof orgId !== 'string') {
          throw new UserInputError('Invalid organization ID format');
        }

        // Check if user has permission to view org invitations
        const organization = await Organization.findById(orgId);
        if (!organization) {
          console.log(`❌ Organization not found: ${orgId}`);
          throw new UserInputError('Organization not found');
        }

        console.log(`✅ Found organization: ${organization.name}`);

        const hasOrgAccess = await PermissionService.hasOrgAccess(user.id, orgId, ['ADMIN', 'OWNER']);
        
        if (!hasOrgAccess) {
          console.log(`❌ User ${user.username} lacks permission for org ${orgId}`);
          throw new ForbiddenError('Insufficient permissions to view organization invitations');
        }

        console.log(`✅ User has permission to view org invitations`);

        const invitations = await Invitation.find({
          organization: orgId,
          status: 'PENDING',
          type: 'ORGANIZATION'
        })
        .populate('invitedBy', 'username email')
        .populate('organization', 'name')
        .sort({ createdAt: -1 });

        console.log(`✅ Found ${invitations.length} pending invitations`);
        return invitations;

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Error fetching organization invitations:', {
          error: error.message,
          stack: error.stack,
          orgId,
          userId: user.id
        });
        throw new Error('Failed to fetch organization invitations');
      }
    }
  },

  Mutation: {
    async createInvitation(parent, { input }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      console.log('📨 Creating invitation:', {
        input,
        userId: user.id,
        userEmail: user.email
      });

      try {
        const { email, role, type, organizationId, appId, message } = input;

        // Rate limiting
        await rateLimitCheck(req, 'create_invitation', 20, 3600); // 20 per hour
        console.log('✅ Rate limit check passed');

        // Check if user already exists
        const existingUser = await UserService.findByEmail(email);
        console.log('👤 Existing user check:', existingUser ? 'Found' : 'Not found');
        
        // Check permissions based on invitation type
        if (type === 'ORGANIZATION' && organizationId) {
          console.log('🔒 Checking organization permissions');
          const hasPermission = await OrganizationService.checkUserPermission(
            user.id, 
            organizationId, 
            ['ADMIN']
          );
          
          if (!hasPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenError('Insufficient permissions to invite to this organization');
          }
          console.log('✅ Organization permissions verified');
        }

        if (type === 'APPLICATION' && appId) {
          const app = await App.findById(appId);
          if (!app) {
            throw new UserInputError('Application not found');
          }

          const hasOrgPermission = await OrganizationService.checkUserPermission(
            user.id, 
            app.organizationId, 
            ['ADMIN']
          );
          
          if (!hasOrgPermission && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenError('Insufficient permissions to invite to this application');
          }
        }

        // Check for existing pending invitation
        const existingInvitation = await Invitation.findOne({
          email,
          status: 'PENDING',
          type,
          ...(organizationId && { organization: organizationId }),
          ...(appId && { app: appId })
        });

        if (existingInvitation) {
          console.log('⚠️ Found existing pending invitation');
          throw new UserInputError('A pending invitation already exists for this email');
        }
        console.log('✅ No existing pending invitation found');

        // Generate invitation token
        const tempInvitationId = new mongoose.Types.ObjectId();
        const token = await TokenService.generateInvitationToken(tempInvitationId);
        console.log('✅ Generated invitation token');

        // Create invitation with token
        const invitationData = {
          _id: tempInvitationId,
          email,
          role,
          type,
          invitedBy: user.id,
          status: 'PENDING',
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ...(organizationId && { organization: organizationId }),
          ...(appId && { app: appId }),
          ...(existingUser && { invitedUser: existingUser.id })
        };

        console.log('📝 Creating invitation with data:', {
          email,
          role,
          type,
          organizationId,
          appId
        });

        const invitation = await Invitation.create(invitationData);
        console.log('✅ Invitation created:', invitation._id);

        // Send invitation email
        const inviteData = {
          inviterName: `${user.firstName || user.username}`,
          role,
          isOrgInvite: type === 'ORGANIZATION'
        };

        if (organizationId) {
          const org = await Organization.findById(organizationId);
          inviteData.organizationName = org.name;
          console.log('✅ Found organization:', org.name);
        }

        if (appId) {
          const app = await App.findById(appId);
          inviteData.organizationName = app.name;
        }

        // Try to send email
        try {
          console.log('📧 Attempting to send invitation email');
          await EmailService.sendInvitationEmail(email, token, inviteData);
          console.log('✅ Invitation email sent successfully');
        } catch (emailError) {
          console.error('⚠️ Failed to send invitation email:', {
            error: emailError.message,
            stack: emailError.stack
          });
          // Continue with invitation creation even if email fails
        }

        await auditLog('INVITATION_CREATED', user.id, {
          invitationId: invitation._id,
          email,
          type,
          role,
          organizationId,
          appId
        });
        console.log('✅ Audit log created');

        const populatedInvitation = await Invitation.findById(invitation._id)
          .populate('invitedBy', 'username email')
          .populate('organization', 'name')
          .populate('app', 'name');

        console.log('✅ Invitation process completed successfully');

        return {
          success: true,
          invitation: populatedInvitation,
          errors: []
        };

      } catch (error) {
        console.error('❌ Invitation creation failed:', {
          error: error.message,
          stack: error.stack,
          code: error.code,
          name: error.name
        });
        
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        throw new Error(`Failed to create invitation: ${error.message}`);
      }
    },

    async acceptInvite(parent, { token, username, password }, context) {
      const { req, res } = context;

      try {
        // Find invitation by token
        const invitation = await Invitation.findOne({
          token,
          status: 'PENDING',
          expiresAt: { $gt: new Date() }
        })
        .populate('organization')
        .populate('app');

        if (!invitation) {
          throw new UserInputError('Invalid or expired invitation');
        }

        // Check if user exists first
        const existingUser = await UserService.findByEmail(invitation.email);
        
        // If user doesn't exist and no credentials provided, return a special response
        if (!existingUser && (!username || !password)) {
          return {
            accessToken: null,
            refreshToken: null,
            user: null,
            appId: null,
            organizationId: null,
            requiresUserSetup: true,
            userExists: false,
            email: invitation.email
          };
        }

        // Helper function to find or create user
        const findOrCreateUserByEmail = async (email, credentials) => {
          let user = existingUser;
          let isNew = false;

          if (!user && credentials?.username && credentials?.password) {
            // Create new user
            const userData = {
              username: credentials.username,
              email,
              password: credentials.password,
              accountType: 'personal',
              role: 'MEMBER',
              status: 'ACTIVE',
              isVerified: true
            };

            user = await AuthService.createUserWithOrganization(userData);
            isNew = true;
          } else if (!user) {
            throw new UserInputError('Must supply username and password for new users');
          }

          return { user, isNew };
        };

        // Find or create the user
        const { user, isNew } = await findOrCreateUserByEmail(invitation.email, {
          username,
          password,
        });

        let appId = null;
        let organizationId = null;

        if (invitation.type === 'ORGANIZATION') {
          // Organization invitation - give full access to org and all apps
          await OrganizationService.addMember(
            invitation.organization._id,
            user.id,
            invitation.role,
            invitation.invitedBy
          );
          organizationId = invitation.organization._id.toString();
        } else if (invitation.type === 'APPLICATION' && invitation.app) {
          // App invitation - give scoped access only to the specific app
          const app = await App.findById(invitation.app._id);
          
          if (!app) {
            throw new Error('Application not found');
          }

          // Use the permission service to add user with scoped app access
          await PermissionService.addUserToOrgWithAppAccess(
            user.id,
            app.organizationId,
            'GUEST',  // Role in organization is GUEST
            invitation.app._id,  // Specific app ID
            invitation.role,     // Role within the app
            invitation.invitedBy
          );

          // Also create direct app membership for better tracking
          const AppMembership = require('../../models/AppMembership');
          await AppMembership.create({
            user: user.id,
            app: invitation.app._id,
            role: invitation.role,
            status: 'ACTIVE',
            joinedAt: new Date(),
            invitedBy: invitation.invitedBy,
            metadata: {
              invitationType: 'APPLICATION'
            }
          });

          appId = invitation.app._id.toString();
          organizationId = app.organizationId.toString();
        }

        // Generate tokens
        const { accessToken, refreshToken } = await TokenService.generateTokens(user);

        // Set secure cookies
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/'
        };
        res.cookie('token', accessToken, cookieOptions);
        res.cookie('refreshToken', refreshToken, cookieOptions);

        // Update invitation status
        invitation.status = 'ACCEPTED';
        invitation.acceptedAt = new Date();
        invitation.invitedUser = user.id;
        await invitation.save();

        await auditLog('INVITATION_ACCEPTED', user.id, {
          invitationId: invitation._id,
          type: invitation.type,
          role: invitation.role,
          appId,
          organizationId,
          isNewUser: isNew
        });

        return {
          accessToken,
          refreshToken,
          user,
          appId,
          organizationId,
          requiresUserSetup: isNew,
          userExists: true
        };

      } catch (error) {
        if (error instanceof UserInputError) {
          throw error;
        }
        console.error('Accept invite error:', error);
        throw new Error('Failed to accept invitation');
      }
    },

    async declineInvitation(parent, { token }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const invitation = await Invitation.findOne({
          token,
          status: 'PENDING'
        });

        if (!invitation) {
          throw new UserInputError('Invalid invitation');
        }

        // Verify invitation is for this user
        if (invitation.email !== user.email) {
          throw new ForbiddenError('This invitation is not for your email address');
        }

        // Update invitation status
        invitation.status = 'DECLINED';
        invitation.declinedAt = new Date();
        await invitation.save();

        await auditLog('INVITATION_DECLINED', user.id, {
          invitationId: invitation._id
        });

        return {
          success: true,
          message: 'Invitation declined',
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Decline invitation error:', error);
        throw new Error('Failed to decline invitation');
      }
    },

    async cancelInvitation(parent, { id }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        const invitation = await Invitation.findById(id);
        if (!invitation) {
          throw new UserInputError('Invitation not found');
        }

        // Only the person who sent the invitation or admin can cancel
        const canCancel = (
          invitation.invitedBy.toString() === user.id ||
          user.role === 'ADMIN' ||
          user.role === 'SUPER_ADMIN'
        );

        if (!canCancel) {
          throw new ForbiddenError('Insufficient permissions to cancel this invitation');
        }

        if (invitation.status !== 'PENDING') {
          throw new UserInputError('Only pending invitations can be canceled');
        }

        // Update invitation status
        invitation.status = 'CANCELED';
        invitation.canceledAt = new Date();
        await invitation.save();

        await auditLog('INVITATION_CANCELED', user.id, {
          invitationId: id
        });

        return {
          success: true,
          message: 'Invitation canceled',
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Cancel invitation error:', error);
        throw new Error('Failed to cancel invitation');
      }
    },

    async resendInvitation(parent, { id }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Rate limiting
        await rateLimitCheck(req, 'resend_invitation', 5, 3600); // 5 per hour

        const invitation = await Invitation.findById(id)
          .populate('organization')
          .populate('app');

        if (!invitation) {
          throw new UserInputError('Invitation not found');
        }

        // Only the person who sent the invitation or admin can resend
        const canResend = (
          invitation.invitedBy.toString() === user.id ||
          user.role === 'ADMIN' ||
          user.role === 'SUPER_ADMIN'
        );

        if (!canResend) {
          throw new ForbiddenError('Insufficient permissions to resend this invitation');
        }

        if (invitation.status !== 'PENDING') {
          throw new UserInputError('Only pending invitations can be resent');
        }

        // Generate new token and extend expiry
        const token = await TokenService.generateInvitationToken(invitation._id);
        invitation.token = token;
        invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await invitation.save();

        // Resend email
        const inviteData = {
          inviterName: `${user.firstName || user.username}`,
          role: invitation.role,
          isOrgInvite: invitation.type === 'ORGANIZATION'
        };

        if (invitation.organization) {
          inviteData.organizationName = invitation.organization.name;
        }

        if (invitation.app) {
          inviteData.organizationName = invitation.app.name;
        }

        // Try to send email, but don't fail if email service is down
        try {
          await EmailService.sendInvitationEmail(invitation.email, token, inviteData);
          console.log('✅ Invitation email sent successfully');
        } catch (emailError) {
          console.warn('⚠️ Failed to send invitation email:', emailError.message);
          // Continue with invitation creation even if email fails
        }

        await auditLog('INVITATION_RESENT', user.id, {
          invitationId: id
        });

        const populatedInvitation = await Invitation.findById(id)
          .populate('invitedBy', 'username email')
          .populate('organization', 'name')
          .populate('app', 'name');

        return {
          success: true,
          invitation: populatedInvitation,
          errors: []
        };

      } catch (error) {
        if (error instanceof ForbiddenError || error instanceof UserInputError) {
          throw error;
        }
        console.error('Resend invitation error:', error);
        throw new Error('Failed to resend invitation');
      }
    }
  },

  Subscription: {
    invitationCreated: {
      subscribe: withFilter(
        (parent, args, context) => context.pubsub.asyncIterator(['INVITATION_CREATED']),
        (payload, variables, context) => {
          // Send to the invited user
          return payload.invitationCreated.email === context.user?.email;
        }
      )
    },

    invitationUpdated: {
      subscribe: withFilter(
        (parent, args, context) => context.pubsub.asyncIterator(['INVITATION_UPDATED']),
        (payload, variables, context) => {
          // Send to involved users
          const invitation = payload.invitationUpdated;
          return (
            invitation.email === context.user?.email ||
            invitation.invitedBy.toString() === context.user?.id
          );
        }
      )
    }
  }
};

module.exports = invitationResolvers; 