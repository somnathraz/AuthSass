const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');
const { withFilter } = require('graphql-subscriptions');
const bcrypt = require('bcryptjs');

// Services
const UserService = require('../../services/user.service');
const TokenService = require('../../services/token.service');
const EmailService = require('../../services/email.service');
const OrganizationService = require('../../services/organization.service');
const PermissionService = require('../../services/permission.service');
const OrgMembership = require('../../models/OrgMembership');

// Models
const User = require('../../models/User');

// Utils
const { validateInput } = require('../../utils/validation');
const { rateLimitCheck } = require('../../middleware/rateLimiter');
const { auditLog } = require('../../utils/audit');
const { toGraphQLId } = require('../../utils/idHelpers');

const userResolvers = {
  Query: {
    async user(parent, { id }, context) {
      const { user: currentUser } = context;
      
      if (!currentUser) {
        throw new AuthenticationError('Not authenticated');
      }

      // Users can only view their own profile or if they have permission
      if (currentUser.id !== id && currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Cannot access this user');
      }

      return await UserService.findById(id);
    },

    async users(parent, { limit, offset, sortBy, sortOrder, filter }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Only admins can search users
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Insufficient permissions');
      }

      const criteria = {};
      if (filter) {
        if (filter.search) {
          criteria.$or = [
            { username: new RegExp(filter.search, 'i') },
            { email: new RegExp(filter.search, 'i') },
            { firstName: new RegExp(filter.search, 'i') },
            { lastName: new RegExp(filter.search, 'i') }
          ];
        }
        if (filter.status) criteria.status = filter.status;
        if (filter.role) criteria.role = filter.role;
        if (filter.organizationId) criteria.organizationId = filter.organizationId;
      }

      return await UserService.searchUsers(criteria, {
        limit,
        offset,
        sortBy,
        sortOrder
      });
    },

    async userStats(parent, args, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Insufficient permissions');
      }

      // Return user statistics
      const stats = await UserService.getUserStats();
      return stats;
    },

    /**
     * Get user's organizations with detailed access information
     */
    async userOrganizations(parent, { input = {} }, context) {
      const { user } = context;
      if (!user) throw new AuthenticationError('Not authenticated');

      try {
        const { filters = {} } = input;
        const organizations = await PermissionService.getUserOrganizations(user.id);

        // Apply filters
        let filteredOrgs = organizations;
        
        if (filters.type) {
          filteredOrgs = filteredOrgs.filter(org => org.type === filters.type);
        }
        
        if (filters.accessType) {
          filteredOrgs = filteredOrgs.filter(org => org.accessType === filters.accessType);
        }
        
        if (filters.role) {
          filteredOrgs = filteredOrgs.filter(org => org.userRole === filters.role);
        }

        return filteredOrgs;

      } catch (error) {
        console.error('Error fetching user organizations:', error);
        throw new Error('Failed to fetch organizations');
      }
    },

    /**
     * Get user's accessible apps across all organizations
     */
    async userApps(parent, { input = {} }, context) {
      const { user } = context;
      if (!user) throw new AuthenticationError('Not authenticated');

      try {
        const { filters = {}, pagination = {} } = input;
        const apps = await PermissionService.getUserApps(user.id, filters);

        // Apply pagination
        const { offset = 0, limit = 20 } = pagination;
        const paginatedApps = apps.slice(offset, offset + limit);

        return {
          apps: paginatedApps,
          total: apps.length,
          hasNextPage: offset + limit < apps.length,
          hasPreviousPage: offset > 0
        };

      } catch (error) {
        console.error('Error fetching user apps:', error);
        throw new Error('Failed to fetch apps');
      }
    },

    /**
     * Get user's app access details for a specific app
     */
    async userAppAccess(parent, { appId }, context) {
      const { user } = context;
      if (!user) throw new AuthenticationError('Not authenticated');

      try {
        const access = await PermissionService.hasAppAccess(user.id, appId);
        
        if (!access.hasAccess) {
          return {
            hasAccess: false,
            accessType: null,
            role: null,
            permissions: {
              canRead: false,
              canWrite: false,
              canDelete: false,
              canInvite: false,
              canManageSettings: false
            }
          };
        }

        // Get permissions based on role
        let permissions = {
          canRead: false,
          canWrite: false,
          canDelete: false,
          canInvite: false,
          canManageSettings: false
        };

        switch (access.role) {
          case 'ADMIN':
          case 'OWNER':
            permissions = {
              canRead: true,
              canWrite: true,
              canDelete: true,
              canInvite: true,
              canManageSettings: true
            };
            break;
          case 'MEMBER':
            permissions = {
              canRead: true,
              canWrite: true,
              canDelete: false,
              canInvite: false,
              canManageSettings: false
            };
            break;
          case 'VIEWER':
            permissions = {
              canRead: true,
              canWrite: false,
              canDelete: false,
              canInvite: false,
              canManageSettings: false
            };
            break;
        }

        return {
          hasAccess: access.hasAccess,
          accessType: access.accessType,
          role: access.role,
          permissions
        };

      } catch (error) {
        console.error('Error checking app access:', error);
        throw new Error('Failed to check app access');
      }
    },

    /**
     * Get user's organization access details
     */
    async userOrgAccess(parent, { orgId }, context) {
      const { user } = context;
      if (!user) throw new AuthenticationError('Not authenticated');

      try {
        const access = await PermissionService.hasOrgAccess(user.id, orgId);
        
        if (!access.hasAccess) {
          return {
            hasAccess: false,
            role: null,
            accessType: null,
            joinedAt: null,
            permissions: {
              canCreateApps: false,
              canInviteMembers: false,
              canManageSettings: false
            },
            appPermissions: []
          };
        }

        return access;

      } catch (error) {
        console.error('Error checking org access:', error);
        throw new Error('Failed to check organization access');
      }
    }
  },

  Mutation: {
    /**
     * Update user profile information
     */
    async updateProfile(parent, { firstName, lastName, bio, location, website }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Rate limiting
        await rateLimitCheck(req, 'profile_update', 10, 3600); // 10 per hour

        const updateData = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (bio !== undefined) updateData.bio = bio;
        if (location !== undefined) updateData.location = location;
        if (website !== undefined) updateData.website = website;

        const updatedUser = await User.findByIdAndUpdate(
          user.id,
          { ...updateData, updatedAt: new Date() },
          { new: true, runValidators: true }
        ).select('-passwordHash');

        await auditLog('PROFILE_UPDATED', user.id, {
          fields: Object.keys(updateData),
          ip: req.ip
        });

        return updatedUser;

      } catch (error) {
        console.error('Profile update error:', error);
        throw new Error('Failed to update profile');
      }
    },

    /**
     * Update user avatar
     */
    async updateAvatar(parent, { avatar }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Rate limiting
        await rateLimitCheck(req, 'avatar_update', 10, 3600); // 10 per hour

        const updatedUser = await User.findByIdAndUpdate(
          user.id,
          { 
            profileImage: avatar,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        ).select('-passwordHash');

        await auditLog('AVATAR_UPDATED', user.id, {
          ip: req.ip
        });

        return updatedUser;

      } catch (error) {
        console.error('Avatar update error:', error);
        throw new Error('Failed to update avatar');
      }
    },

    /**
     * Update user password
     */
    async updatePassword(parent, { currentPassword, newPassword }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Rate limiting
        await rateLimitCheck(req, 'password_change', 5, 3600); // 5 per hour

        // Get current user with password
        const currentUser = await User.findById(user.id);
        if (!currentUser) {
          throw new Error('User not found');
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, currentUser.passwordHash);
        if (!isValidPassword) {
          throw new UserInputError('Current password is incorrect');
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 12);
        
        // Update password
        await User.findByIdAndUpdate(user.id, {
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        });

        // Revoke all existing tokens
        await TokenService.revokeUserTokens(user.id);

        await auditLog('PASSWORD_CHANGED', user.id, {
          ip: req.ip
        });

        return 'Password updated successfully';

      } catch (error) {
        console.error('Password update error:', error);
        if (error instanceof UserInputError) {
          throw error;
        }
        throw new Error('Failed to update password');
      }
    },

    /**
     * Update user email
     */
    async updateEmail(parent, { newEmail, password }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Rate limiting
        await rateLimitCheck(req, 'email_change', 3, 3600); // 3 per hour

        // Get current user with password
        const currentUser = await User.findById(user.id);
        if (!currentUser) {
          throw new Error('User not found');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, currentUser.passwordHash);
        if (!isValidPassword) {
          throw new UserInputError('Password is incorrect');
        }

        // Check if email is already taken
        const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
        if (existingUser) {
          throw new UserInputError('Email address is already in use');
        }

        // Update email and mark as unverified
        const updatedUser = await User.findByIdAndUpdate(
          user.id,
          { 
            email: newEmail.toLowerCase(),
            isVerified: false,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        ).select('-passwordHash');

        // TODO: Send email verification to new email
        // await EmailService.sendVerificationEmail(newEmail, user.username);

        await auditLog('EMAIL_CHANGED', user.id, {
          oldEmail: currentUser.email,
          newEmail: newEmail.toLowerCase(),
          ip: req.ip
        });

        return updatedUser;

      } catch (error) {
        console.error('Email update error:', error);
        if (error instanceof UserInputError) {
          throw error;
        }
        throw new Error('Failed to update email');
      }
    },

    /**
     * Update user notification and privacy settings
     */
    async updateUserSettings(parent, { emailNotifications, securityAlerts, loginNotifications, marketingEmails }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Rate limiting
        await rateLimitCheck(req, 'settings_update', 20, 3600); // 20 per hour

        const updateData = { updatedAt: new Date() };
        
        // Update notification preferences if provided
        if (emailNotifications !== undefined || securityAlerts !== undefined || 
            loginNotifications !== undefined || marketingEmails !== undefined) {
          
          const currentUser = await User.findById(user.id);
          const currentPrefs = currentUser.preferences || {};
          const currentNotifications = currentPrefs.notifications || {};

          updateData.preferences = {
            ...currentPrefs,
            notifications: {
              ...currentNotifications,
              ...(emailNotifications !== undefined && { email: emailNotifications }),
              ...(securityAlerts !== undefined && { email: securityAlerts }), // Using email field for now
              ...(loginNotifications !== undefined && { email: loginNotifications }),
              ...(marketingEmails !== undefined && { email: marketingEmails })
            }
          };
        }

        const updatedUser = await User.findByIdAndUpdate(
          user.id,
          updateData,
          { new: true, runValidators: true }
        ).select('-passwordHash');

        await auditLog('USER_SETTINGS_UPDATED', user.id, {
          ip: req.ip
        });

        return updatedUser;

      } catch (error) {
        console.error('Settings update error:', error);
        throw new Error('Failed to update settings');
      }
    },

    /**
     * Delete user account with confirmation
     */
    async deleteAccount(parent, { password, confirmation }, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Rate limiting
        await rateLimitCheck(req, 'account_deletion', 3, 86400); // 3 per day

        // Get current user with password
        const currentUser = await User.findById(user.id);
        if (!currentUser) {
          throw new Error('User not found');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, currentUser.passwordHash);
        if (!isValidPassword) {
          throw new UserInputError('Password is incorrect');
        }

        // Verify confirmation matches username
        if (confirmation !== currentUser.username) {
          throw new UserInputError('Confirmation does not match username');
        }

        // Soft delete the user account
        await User.findByIdAndUpdate(user.id, {
          deletedAt: new Date(),
          deletedBy: user.id,
          status: 'INACTIVE',
          updatedAt: new Date()
        });

        // Revoke all tokens
        await TokenService.revokeUserTokens(user.id);

        await auditLog('ACCOUNT_DELETED', user.id, {
          ip: req.ip,
          selfDeleted: true
        });

        return 'Account deleted successfully';

      } catch (error) {
        console.error('Account deletion error:', error);
        if (error instanceof UserInputError) {
          throw error;
        }
        throw new Error('Failed to delete account');
      }
    },

    /**
     * Export user data for GDPR compliance
     */
    async exportUserData(parent, args, context) {
      const { user, req } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      try {
        // Rate limiting
        await rateLimitCheck(req, 'data_export', 1, 86400); // 1 per day

        // Get complete user data
        const userData = await User.findById(user.id).select('-passwordHash');
        
        // Get user's organizations
        const organizations = await PermissionService.getUserOrganizations(user.id);
        
        // Get user's apps
        const apps = await PermissionService.getUserApps(user.id);

        // Compile export data
        const exportData = {
          profile: userData,
          organizations,
          apps,
          exportedAt: new Date().toISOString(),
          exportRequestedBy: user.id
        };

        await auditLog('DATA_EXPORTED', user.id, {
          ip: req.ip
        });

        return JSON.stringify(exportData, null, 2);

      } catch (error) {
        console.error('Data export error:', error);
        throw new Error('Failed to export user data');
      }
    },

    async updateUserStatus(parent, { userId, status }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Insufficient permissions');
      }

      try {
        await UserService.updateStatus(userId, status);

        return {
          success: true,
          message: 'User status updated successfully',
          errors: []
        };

      } catch (error) {
        console.error('Status update error:', error);
        throw new Error('Failed to update user status');
      }
    },

    async deleteUser(parent, { userId }, context) {
      const { user } = context;
      
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Users can delete their own account or admins can delete any account
      if (user.id !== userId && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Insufficient permissions');
      }

      try {
        await UserService.deleteUser(userId, user.id);

        return {
          success: true,
          message: 'User deleted successfully',
          errors: []
        };

      } catch (error) {
        console.error('User deletion error:', error);
        throw new Error('Failed to delete user');
      }
    },

    async requestPasswordReset(parent, { email }, context) {
      const { req } = context;

      try {
        // Rate limiting
        await rateLimitCheck(req, 'password_reset', 3, 3600); // 3 per hour

        const user = await UserService.findByEmail(email);
        if (!user) {
          // Don't reveal if email exists
          return {
            success: true,
            message: 'If an account with that email exists, a reset link has been sent',
            errors: []
          };
        }

        // Generate reset token
        const resetToken = await TokenService.generatePasswordResetToken(user.id);

        // Send reset email
        await EmailService.sendPasswordResetEmail(user.email, resetToken, user.username);

        await auditLog('PASSWORD_RESET_REQUESTED', user.id, {
          ip: req.ip
        });

        return {
          success: true,
          message: 'Password reset email sent',
          errors: []
        };

      } catch (error) {
        console.error('Password reset request error:', error);
        return {
          success: false,
          message: 'Failed to request password reset',
          errors: [{
            field: 'email',
            message: 'Failed to send reset email',
            code: 'RESET_REQUEST_FAILED'
          }]
        };
      }
    },

    async resetPassword(parent, { token, newPassword }, context) {
      const { req } = context;

      try {
        // Rate limiting
        await rateLimitCheck(req, 'password_reset_confirm', 5, 3600); // 5 per hour

        // Verify token and get user
        const user = await TokenService.verifyPasswordResetToken(token);
        if (!user) {
          throw new UserInputError('Invalid or expired reset token');
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update password and clear reset token
        await User.findByIdAndUpdate(user.id, {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: new Date()
        });

        // Revoke all existing tokens
        await TokenService.revokeUserTokens(user.id);

        await auditLog('PASSWORD_RESET_COMPLETED', user.id, {
          ip: req.ip
        });

        return {
          success: true,
          message: 'Password reset successfully',
          errors: []
        };

      } catch (error) {
        console.error('Password reset error:', error);
        return {
          success: false,
          message: 'Failed to reset password',
          errors: [{
            field: 'token',
            message: error.message,
            code: 'RESET_FAILED'
          }]
        };
      }
    },

    async verifyEmail(parent, { token }, context) {
      const { req } = context;

      try {
        // Rate limiting
        await rateLimitCheck(req, 'email_verification', 10, 3600); // 10 per hour

        // Find user by verification token
        const user = await User.findOne({ 
          emailVerificationToken: token,
          isVerified: false
        });

        if (!user) {
          throw new UserInputError('Invalid or expired verification token');
        }

        // Mark as verified
        await User.findByIdAndUpdate(user.id, {
          isVerified: true,
          emailVerificationToken: null,
          status: 'ACTIVE',
          updatedAt: new Date()
        });

        await auditLog('EMAIL_VERIFIED', user.id, {
          ip: req.ip
        });

        return {
          success: true,
          message: 'Email verified successfully',
          errors: []
        };

      } catch (error) {
        console.error('Email verification error:', error);
        return {
          success: false,
          message: 'Failed to verify email',
          errors: [{
            field: 'token',
            message: error.message,
            code: 'VERIFICATION_FAILED'
          }]
        };
      }
    }
  },

  Subscription: {
    userUpdated: {
      subscribe: withFilter(
        (parent, args, context) => context.pubsub.asyncIterator(['USER_UPDATED']),
        (payload, variables, context) => {
          // Only send to authenticated users
          return !!context.user;
        }
      )
    },

    userStatusChanged: {
      subscribe: withFilter(
        (parent, args, context) => context.pubsub.asyncIterator(['USER_STATUS_CHANGED']),
        (payload, variables, context) => {
          // Only send to admins or the user themselves
          return context.user && (
            context.user.role === 'ADMIN' || 
            context.user.role === 'SUPER_ADMIN' ||
            context.user.id === payload.userStatusChanged.userId
          );
        }
      )
    }
  },

  // Field resolvers
  User: {
    id(parent) {
      return toGraphQLId('User', parent._id || parent.id);
    },

    accountType(parent) {
      // Convert to uppercase for GraphQL enum
      return parent.accountType ? parent.accountType.toUpperCase() : 'PERSONAL';
    },

    organization(parent, args, context) {
      if (!parent.organizationId) return null;
      return OrganizationService.findById(parent.organizationId);
    },

    displayName(parent) {
      if (parent.firstName && parent.lastName) {
        return `${parent.firstName} ${parent.lastName}`;
      }
      return parent.username;
    },

    fullName(parent) {
      if (parent.firstName && parent.lastName) {
        return `${parent.firstName} ${parent.lastName}`;
      }
      return parent.username;
    },

    isOnline(parent) {
      // Simple online check - last seen within 5 minutes
      if (!parent.lastSeenAt) return false;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return new Date(parent.lastSeenAt) > fiveMinutesAgo;
    },

    async permissions(parent, args, context) {
      // This would return user's global permissions
      // For now, return based on role
      const isAdmin = parent.role === 'ADMIN' || parent.role === 'SUPER_ADMIN';
      return {
        canCreateOrganizations: true,
        canCreateApps: true,
        canInviteUsers: isAdmin,
        canManageUsers: isAdmin,
        canViewAuditLogs: isAdmin,
        canManageSystem: parent.role === 'SUPER_ADMIN'
      };
    },

    async canAccess(parent, { resource, action }, context) {
      // This would check if user can perform action on resource
      // Implementation depends on your permission system
      return PermissionService.canAccess(parent.id, resource, action);
    },

    async organizations(parent, args, context) {
      return PermissionService.getUserOrganizations(parent.id);
    },

    async apps(parent, args, context) {
      return PermissionService.getUserApps(parent.id);
    },

    async tokenStats(parent, args, context) {
      return TokenService.getUserTokenStats(parent.id);
    }
  }
};

module.exports = userResolvers; 