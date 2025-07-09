const Organization = require('../models/Organization');
const OrgMembership = require('../models/OrgMembership');
const OrgInvitation = require('../models/OrgInvitation');
const PermissionService = require('./permission.service');
const { auditLog } = require('../utils/audit');
const User = require('../models/User');

class OrganizationService {
  /**
   * Create a new organization
   * @param {Object} orgData - Organization data
   * @param {string} ownerId - Owner user ID
   * @returns {Promise<Object>} - Created organization
   */
  async createOrganization(orgData, ownerId) {
    const session = await Organization.startSession();
    
    try {
      let organization;
      
      await session.withTransaction(async () => {
        // Create organization
        const orgDefaults = {
          status: 'ACTIVE',
          members: [ownerId],
          createdAt: new Date(),
          updatedAt: new Date(),
          timezone: 'UTC', // Ensure timezone is set
          // Ensure passwordPolicy has all required fields
          passwordPolicy: {
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
          },
          // Ensure domainSettings has all required fields
          domainSettings: {
            allowedCallbackUrls: [],
            allowedLogoutUrls: [],
            allowedWebOrigins: [],
            customDomain: null,
            sdkAllowedDomains: [],
            enableCORS: true,
            corsMaxAge: 86400
          }
        };

        const finalOrgData = { ...orgDefaults, ...orgData, owner: ownerId };
        [organization] = await Organization.create([finalOrgData], { session });

        // Create owner membership with enhanced permissions
        const membershipData = {
          user: ownerId,
          org: organization._id,
          role: 'ADMIN',
          status: 'ACTIVE',
          joinedAt: new Date(),
          metadata: {
            invitationType: 'DIRECT',
            permissions: {
              canCreateApps: true,
              canInviteMembers: true,
              canManageSettings: true
            }
          }
        };

        await OrgMembership.create([membershipData], { session });

        await auditLog('ORGANIZATION_CREATED', ownerId, {
          orgId: organization._id,
          orgName: organization.name,
          orgType: organization.type
        });
      });

      // Clear permission caches
      PermissionService.clearUserCaches(ownerId);

      return await Organization.findById(organization._id)
        .populate('owner', 'username email')
        .populate('members', 'username email');

    } catch (error) {
      throw new Error(`Failed to create organization: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get organization by ID with user context
   * @param {string} orgId - Organization ID
   * @param {string} userId - Current user ID (optional)
   * @returns {Promise<Object>} - Organization object
   */
  async findById(orgId, userId = null) {
    const org = await Organization.findById(orgId)
      .populate('owner', '_id username email firstName lastName profileImage role status createdAt')
      .populate('members', '_id username email firstName lastName')
      .lean();

    if (!org) return null;

    // Add user-specific context if userId provided
    if (userId) {
      const membership = await OrgMembership.findOne({
        user: userId,
        org: orgId,
        status: 'ACTIVE'
      });

      org.userRole = membership?.role || null;
      org.userAccess = membership ? {
        role: membership.role,
        accessType: membership.hasFullOrgAccess ? 'FULL' : 'SCOPED',
        joinedAt: membership.joinedAt,
        permissions: membership.metadata?.permissions || {}
      } : null;
    }

    return org;
  }

  /**
   * Get organizations for a user using the new permission system
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - User's organizations
   */
  async getUserOrganizations(userId) {
    return await PermissionService.getUserOrganizations(userId);
  }

  /**
   * Get all organizations (admin only)
   * @returns {Promise<Array>} - All organizations
   */
  async getAllOrganizations() {
    try {
      const organizations = await Organization.find({ status: { $ne: 'DELETED' } })
        .populate('owner', 'username email firstName lastName')
        .sort({ createdAt: -1 })
        .lean();

      return organizations;
    } catch (error) {
      throw new Error(`Failed to fetch all organizations: ${error.message}`);
    }
  }

  /**
   * Get organization members with enhanced details
   * @param {string} orgId - Organization ID
   * @param {string} requesterId - ID of user requesting the data
   * @returns {Promise<Object>} - Organization members data
   */
  async getOrganizationMembers(orgId, requesterId = null) {
    try {
      console.log(`🔍 getOrganizationMembers - OrgId: ${orgId}, RequesterId: ${requesterId}`);
      
      // Check if requester has access to view members
      if (requesterId) {
        const hasAccess = await PermissionService.hasOrgAccess(requesterId, orgId);
        if (!hasAccess) {
          throw new Error('Insufficient permissions to view organization members');
        }
      }

      const org = await Organization.findById(orgId)
        .populate('owner', '_id username email firstName lastName profileImage role status createdAt')
        .lean();

      if (!org) {
        throw new Error('Organization not found');
      }

      console.log(`✅ Found organization: ${org.name}`);

      // Get memberships with better error handling for null references
      const memberships = await OrgMembership.find({ 
        org: orgId,
        status: 'ACTIVE',
        user: { $ne: null } // Exclude null user references
      })
      .populate({
        path: 'user',
        select: '_id username email firstName lastName profileImage role status lastSeenAt createdAt',
        match: { _id: { $ne: null } } // Additional safety check
      })
      .populate('appPermissions.app', 'name')
      .populate('appPermissions.grantedBy', 'username email')
      .lean();

      console.log(`📊 Found ${memberships.length} membership records`);

      // Filter out any memberships where user population failed (null users)
      const validMemberships = memberships.filter(membership => {
        if (!membership.user) {
          console.warn(`⚠️ Skipping membership ${membership._id} - user is null`);
          return false;
        }
        if (!membership.user._id) {
          console.warn(`⚠️ Skipping membership ${membership._id} - user._id is null`);
          return false;
        }
        return true;
      });

      console.log(`✅ ${validMemberships.length} valid memberships after filtering`);

      // CRITICAL FIX: Ensure organization owner has a valid role
      if (org.owner && (!org.owner.role || org.owner.role === null)) {
        console.warn(`⚠️ Organization owner ${org.owner._id} has null role, setting default`);
        // Update the owner record to have a role if missing
        await User.findByIdAndUpdate(org.owner._id, { 
          role: 'ADMIN', // Default role for organization owners
          status: org.owner.status || 'ACTIVE' // Ensure status is also set
        });
        
        // Refetch the owner with updated data
        org.owner.role = 'ADMIN';
        org.owner.status = org.owner.status || 'ACTIVE';
      }

      // Filter out owner from members list and map to response format
      const members = validMemberships
        .filter(membership => {
          if (!org.owner || !org.owner._id) {
            console.warn('⚠️ Organization owner is null');
            return true;
          }
          return membership.user._id.toString() !== org.owner._id.toString();
        })
        .map(membership => {
          // CRITICAL FIX: Ensure each member user has a valid role
          if (!membership.user.role || membership.user.role === null) {
            console.warn(`⚠️ Member ${membership.user._id} has null role, using membership role`);
            membership.user.role = membership.role || 'MEMBER'; // Fallback to membership role or default
          }
          
          // CRITICAL FIX: Ensure membership status is included for GraphQL schema compliance
          const memberStatus = membership.status || 'ACTIVE'; // Default to ACTIVE if missing
          
          return {
            user: membership.user,
            role: membership.role,
            status: memberStatus, // REQUIRED: Include status for GraphQL OrganizationMember.status!
            accessType: membership.hasFullOrgAccess ? 'FULL' : 'SCOPED',
            joinedAt: membership.joinedAt,
            invitedBy: membership.invitedBy,
            appPermissions: membership.appPermissions || [],
            permissions: membership.metadata?.permissions || {}
          };
        });

      console.log(`✅ Returning ${members.length} members + 1 owner = ${members.length + 1} total`);

      return {
        owner: org.owner,
        members,
        total: members.length + 1
      };

    } catch (error) {
      console.error('❌ getOrganizationMembers error:', {
        error: error.message,
        stack: error.stack,
        orgId,
        requesterId
      });
      throw error;
    }
  }

  /**
   * Add member to organization with enhanced role and permission handling
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID to add
   * @param {string} role - User role
   * @param {string} addedBy - ID of user adding the member
   * @param {Object} options - Additional options (appId for scoped access)
   * @returns {Promise<Object>} - Updated organization
   */
  async addMember(orgId, userId, role, addedBy, options = {}) {
    const session = await Organization.startSession();
    
    try {
      let membership;
      
      await session.withTransaction(async () => {
        // Use the permission service for proper role assignment
        if (options.appId) {
          // Adding user with scoped app access
          membership = await PermissionService.addUserToOrgWithAppAccess(
            userId, 
            orgId, 
            'GUEST', 
            options.appId, 
            role, 
            addedBy
          );
        } else {
          // Adding user with full org access
          membership = await PermissionService.addUserToOrgWithAppAccess(
            userId, 
            orgId, 
            role, 
            null, 
            null, 
            addedBy
          );
        }

        await auditLog('ORGANIZATION_MEMBER_ADDED', addedBy, {
          orgId,
          addedUserId: userId,
          role,
          accessType: options.appId ? 'SCOPED' : 'FULL',
          appId: options.appId
        });
      });

      return await this.findById(orgId);

    } catch (error) {
      throw new Error(`Failed to add member: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Remove member from organization
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID to remove
   * @param {string} removedBy - ID of user removing the member
   * @returns {Promise<Object>} - Updated organization
   */
  async removeMember(orgId, userId, removedBy) {
    const session = await Organization.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Check if user is the owner
        const org = await Organization.findById(orgId);
        if (org.owner.toString() === userId) {
          throw new Error('Cannot remove organization owner');
        }

        // Update membership status
        const membership = await OrgMembership.findOneAndUpdate(
          { org: orgId, user: userId },
          { 
            status: 'REMOVED',
            removedAt: new Date(),
            removedBy
          },
          { session }
        );

        if (!membership) {
          throw new Error('User is not a member of this organization');
        }

        // Remove user from organization members array
        await Organization.findByIdAndUpdate(
          orgId,
          { 
            $pull: { members: userId },
            updatedAt: new Date()
          },
          { session }
        );

        // Clear user's permission caches
        PermissionService.clearUserCaches(userId);

        await auditLog('ORGANIZATION_MEMBER_REMOVED', removedBy, {
          orgId,
          removedUserId: userId,
          previousRole: membership.role
        });
      });

      return await this.findById(orgId);

    } catch (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Update member role
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @param {string} newRole - New role
   * @param {string} updatedBy - ID of user updating the role
   * @returns {Promise<Object>} - Updated organization
   */
  async updateMemberRole(orgId, userId, newRole, updatedBy) {
    try {
      const membership = await OrgMembership.findOne({
        org: orgId,
        user: userId,
        status: 'ACTIVE'
      });

      if (!membership) {
        throw new Error('User is not a member of this organization');
      }

      const oldRole = membership.role;
      
      // Update role and permissions based on new role
      membership.role = newRole;
      
      // Update permissions based on role - INDUSTRY STANDARD: Only admins can create apps
      const rolePermissions = {
        SUPER_ADMIN: { canCreateApps: true, canInviteMembers: true, canManageSettings: true },
        ADMIN: { canCreateApps: true, canInviteMembers: true, canManageSettings: false },
        MEMBER: { canCreateApps: false, canInviteMembers: false, canManageSettings: false }, // REMOVED app creation
        GUEST: { canCreateApps: false, canInviteMembers: false, canManageSettings: false }
      };
      
      membership.metadata = {
        ...membership.metadata,
        permissions: { ...membership.metadata?.permissions, ...rolePermissions[newRole] }
      };
      
      membership.updatedAt = new Date();
      await membership.save();

      // Clear permission caches
      PermissionService.clearUserCaches(userId);

      await auditLog('ORGANIZATION_MEMBER_ROLE_UPDATED', updatedBy, {
        orgId,
        userId,
        oldRole,
        newRole
      });

      return await this.findById(orgId);

    } catch (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }
  }

  /**
   * Add app permission to existing organization member
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @param {string} appId - App ID
   * @param {string} appRole - App role
   * @param {string} grantedBy - Who granted the permission
   * @returns {Promise<Object>} - Updated membership
   */
  async addAppPermission(orgId, userId, appId, appRole, grantedBy) {
    try {
      const membership = await OrgMembership.findOne({
        org: orgId,
        user: userId,
        status: 'ACTIVE'
      });

      if (!membership) {
        throw new Error('User is not a member of this organization');
      }

      await membership.addAppPermission(appId, appRole, grantedBy);

      // Clear permission caches
      PermissionService.clearUserCaches(userId);

      await auditLog('APP_PERMISSION_GRANTED', grantedBy, {
        orgId,
        userId,
        appId,
        appRole
      });

      return membership;

    } catch (error) {
      throw new Error(`Failed to add app permission: ${error.message}`);
    }
  }

  /**
   * Remove app permission from organization member
   * @param {string} orgId - Organization ID
   * @param {string} userId - User ID
   * @param {string} appId - App ID
   * @param {string} revokedBy - Who revoked the permission
   * @returns {Promise<Object>} - Updated membership
   */
  async removeAppPermission(orgId, userId, appId, revokedBy) {
    try {
      const membership = await OrgMembership.findOne({
        org: orgId,
        user: userId,
        status: 'ACTIVE'
      });

      if (!membership) {
        throw new Error('User is not a member of this organization');
      }

      await membership.revokeAppPermission(appId);

      // Clear permission caches
      PermissionService.clearUserCaches(userId);

      await auditLog('APP_PERMISSION_REVOKED', revokedBy, {
        orgId,
        userId,
        appId
      });

      return membership;

    } catch (error) {
      throw new Error(`Failed to remove app permission: ${error.message}`);
    }
  }

  /**
   * Search organizations with pagination and filtering
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise<Object>} - Search results
   */
  async searchOrganizations(criteria, options = {}) {
    const {
      limit = 10,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    const [organizations, total] = await Promise.all([
      Organization.find(criteria)
        .populate('owner', 'username email')
        .sort({ [sortBy]: sortDirection })
        .skip(offset)
        .limit(limit)
        .lean(),
      Organization.countDocuments(criteria)
    ]);

    return {
      organizations,
      total,
      hasNextPage: offset + limit < total,
      hasPreviousPage: offset > 0
    };
  }

  /**
   * Check user permission in organization (legacy compatibility)
   * @param {string} userId - User ID
   * @param {string} orgId - Organization ID
   * @param {Array} requiredRoles - Required roles
   * @returns {Promise<boolean>} - Permission result
   */
  async checkUserPermission(userId, orgId, requiredRoles = []) {
    try {
      // First check if user is the organization owner
      const org = await Organization.findById(orgId).lean();
      if (org && org.owner && org.owner.toString() === userId) {
        return true; // Organization owner has all permissions
      }

      // Then check membership-based permissions
      return await PermissionService.hasOrgAccess(userId, orgId, requiredRoles);
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  }

  /**
   * Get user's role in organization
   * @param {string} userId - User ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<string|null>} - User role or null
   */
  async getUserRole(userId, orgId) {
    return await OrgMembership.getUserOrgRole(userId, orgId);
  }

  /**
   * Delete organization (soft delete)
   * @param {string} orgId - Organization ID
   * @param {string} deletedBy - Who deleted the organization
   * @returns {Promise<boolean>} - Success status
   */
  async deleteOrganization(orgId, deletedBy) {
    const session = await Organization.startSession();
    
    try {
      await session.withTransaction(async () => {
        const org = await Organization.findById(orgId);
        if (!org) {
          throw new Error('Organization not found');
        }

        // Soft delete organization
        await Organization.findByIdAndUpdate(
          orgId,
          {
            status: 'DELETED',
            deletedAt: new Date(),
            deletedBy,
            updatedAt: new Date()
          },
          { session }
        );

        // Mark all memberships as removed
        await OrgMembership.updateMany(
          { org: orgId, status: 'ACTIVE' },
          {
            status: 'REMOVED',
            removedAt: new Date(),
            removedBy: deletedBy
          },
          { session }
        );

        // Clear all member caches
        const memberships = await OrgMembership.find({ org: orgId });
        memberships.forEach(membership => {
          PermissionService.clearUserCaches(membership.user.toString());
        });

        await auditLog('ORGANIZATION_DELETED', deletedBy, { orgId });
      });

      return true;

    } catch (error) {
      throw new Error(`Failed to delete organization: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Update organization general settings
   * @param {string} orgId - Organization ID
   * @param {Object} settingsData - Settings data
   * @param {string} updatedBy - Who updated the settings
   * @returns {Promise<Object>} - Updated organization
   */
  async updateOrganizationSettings(orgId, settingsData, updatedBy) {
    try {
      const cleanData = {};
      
      // Only include defined fields
      if (settingsData.name !== undefined) cleanData.name = settingsData.name;
      if (settingsData.slug !== undefined) cleanData.slug = settingsData.slug;
      if (settingsData.description !== undefined) cleanData.description = settingsData.description;
      if (settingsData.website !== undefined) cleanData.website = settingsData.website;
      if (settingsData.supportEmail !== undefined) cleanData.supportEmail = settingsData.supportEmail;
      if (settingsData.timezone !== undefined) cleanData.timezone = settingsData.timezone;
      if (settingsData.contactName !== undefined) cleanData.contactName = settingsData.contactName;
      if (settingsData.contactEmail !== undefined) cleanData.contactEmail = settingsData.contactEmail;
      if (settingsData.contactPhone !== undefined) cleanData.contactPhone = settingsData.contactPhone;
      if (settingsData.imageUrl !== undefined) cleanData.imageUrl = settingsData.imageUrl;
      
      cleanData.updatedAt = new Date();

      const organization = await Organization.findByIdAndUpdate(
        orgId,
        cleanData,
        { new: true, runValidators: true }
      ).populate('owner', 'username email');

      if (!organization) {
        throw new Error('Organization not found');
      }

      await auditLog('ORGANIZATION_SETTINGS_UPDATED', updatedBy, {
        orgId,
        updatedFields: Object.keys(cleanData),
        values: cleanData
      });

      return organization;

    } catch (error) {
      throw new Error(`Failed to update organization settings: ${error.message}`);
    }
  }

  /**
   * Update organization password policy
   * @param {string} orgId - Organization ID
   * @param {Object} policyData - Password policy data
   * @param {string} updatedBy - Who updated the policy
   * @returns {Promise<Object>} - Updated organization
   */
  async updatePasswordPolicy(orgId, policyData, updatedBy) {
    try {
      const organization = await Organization.findById(orgId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Update password policy
      const passwordPolicy = { ...organization.passwordPolicy.toObject(), ...policyData };
      
      const updatedOrg = await Organization.findByIdAndUpdate(
        orgId,
        { 
          passwordPolicy,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('owner', 'username email');

      await auditLog('PASSWORD_POLICY_UPDATED', updatedBy, {
        orgId,
        updatedFields: Object.keys(policyData),
        values: policyData
      });

      return updatedOrg;

    } catch (error) {
      throw new Error(`Failed to update password policy: ${error.message}`);
    }
  }

  /**
   * Update organization domain settings
   * @param {string} orgId - Organization ID
   * @param {Object} domainData - Domain settings data
   * @param {string} updatedBy - Who updated the settings
   * @returns {Promise<Object>} - Updated organization
   */
  async updateDomainSettings(orgId, domainData, updatedBy) {
    try {
      const organization = await Organization.findById(orgId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Parse array strings if provided
      const processedData = { ...domainData };
      
      if (domainData.allowedCallbackUrls) {
        processedData.allowedCallbackUrls = Array.isArray(domainData.allowedCallbackUrls) 
          ? domainData.allowedCallbackUrls 
          : domainData.allowedCallbackUrls.split('\n').filter(url => url.trim());
      }
      
      if (domainData.allowedLogoutUrls) {
        processedData.allowedLogoutUrls = Array.isArray(domainData.allowedLogoutUrls)
          ? domainData.allowedLogoutUrls
          : domainData.allowedLogoutUrls.split('\n').filter(url => url.trim());
      }
      
      if (domainData.allowedWebOrigins) {
        processedData.allowedWebOrigins = Array.isArray(domainData.allowedWebOrigins)
          ? domainData.allowedWebOrigins
          : domainData.allowedWebOrigins.split('\n').filter(url => url.trim());
      }

      if (domainData.sdkAllowedDomains) {
        processedData.sdkAllowedDomains = Array.isArray(domainData.sdkAllowedDomains)
          ? domainData.sdkAllowedDomains
          : domainData.sdkAllowedDomains.split('\n').filter(url => url.trim());
      }

      // Update domain settings
      const domainSettings = { ...organization.domainSettings.toObject(), ...processedData };
      
      const updatedOrg = await Organization.findByIdAndUpdate(
        orgId,
        { 
          domainSettings,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('owner', 'username email');

      await auditLog('DOMAIN_SETTINGS_UPDATED', updatedBy, {
        orgId,
        updatedFields: Object.keys(domainData),
        values: processedData
      });

      return updatedOrg;

    } catch (error) {
      throw new Error(`Failed to update domain settings: ${error.message}`);
    }
  }

  /**
   * Update organization branding settings
   * @param {string} orgId - Organization ID
   * @param {Object} brandingData - Branding settings data
   * @param {string} updatedBy - Who updated the settings
   * @returns {Promise<Object>} - Updated organization
   */
  async updateBrandingSettings(orgId, brandingData, updatedBy) {
    try {
      const organization = await Organization.findById(orgId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Update branding settings
      const branding = { ...organization.branding.toObject(), ...brandingData };
      
      const updatedOrg = await Organization.findByIdAndUpdate(
        orgId,
        { 
          branding,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('owner', 'username email');

      await auditLog('BRANDING_SETTINGS_UPDATED', updatedBy, {
        orgId,
        updatedFields: Object.keys(brandingData),
        values: brandingData
      });

      return updatedOrg;

    } catch (error) {
      throw new Error(`Failed to update branding settings: ${error.message}`);
    }
  }

  /**
   * Update organization notification settings
   * @param {string} orgId - Organization ID
   * @param {Object} notificationData - Notification settings data
   * @param {string} updatedBy - Who updated the settings
   * @returns {Promise<Object>} - Updated organization
   */
  async updateNotificationSettings(orgId, notificationData, updatedBy) {
    try {
      const organization = await Organization.findById(orgId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Update notification settings
      const notifications = { ...organization.notifications.toObject(), ...notificationData };
      
      const updatedOrg = await Organization.findByIdAndUpdate(
        orgId,
        { 
          notifications,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('owner', 'username email');

      await auditLog('NOTIFICATION_SETTINGS_UPDATED', updatedBy, {
        orgId,
        updatedFields: Object.keys(notificationData),
        values: notificationData
      });

      return updatedOrg;

    } catch (error) {
      throw new Error(`Failed to update notification settings: ${error.message}`);
    }
  }

  /**
   * Update organization analytics settings
   * @param {string} orgId - Organization ID
   * @param {Object} analyticsData - Analytics settings data
   * @param {string} updatedBy - Who updated the settings
   * @returns {Promise<Object>} - Updated organization
   */
  async updateAnalyticsSettings(orgId, analyticsData, updatedBy) {
    try {
      const organization = await Organization.findById(orgId);
      if (!organization) {
        throw new Error('Organization not found');
      }

      // Update analytics settings
      const analytics = { ...organization.analytics.toObject(), ...analyticsData };
      
      const updatedOrg = await Organization.findByIdAndUpdate(
        orgId,
        { 
          analytics,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('owner', 'username email');

      await auditLog('ANALYTICS_SETTINGS_UPDATED', updatedBy, {
        orgId,
        updatedFields: Object.keys(analyticsData),
        values: analyticsData
      });

      return updatedOrg;

    } catch (error) {
      throw new Error(`Failed to update analytics settings: ${error.message}`);
    }
  }
}

module.exports = new OrganizationService(); 