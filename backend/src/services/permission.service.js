const OrgMembership = require('../models/OrgMembership');
const AppMembership = require('../models/AppMembership');
const App = require('../models/App');
const Organization = require('../models/Organization');
const NodeCache = require('node-cache');

// Cache for 5 minutes with automatic cleanup
const permissionCache = new NodeCache({ 
  stdTTL: 300, 
  checkperiod: 60,
  useClones: false 
});

class PermissionService {
  
  /**
   * Check if user has access to an organization
   * @param {string} userId - User ID
   * @param {string} orgId - Organization ID
   * @param {Array} requiredRoles - Required roles (optional)
   * @returns {Promise<boolean>}
   */
  static async hasOrgAccess(userId, orgId, requiredRoles = []) {
    const cacheKey = `org_access_${userId}_${orgId}_${requiredRoles.join(',')}`;
    
    try {
      // Check cache first
      const cached = permissionCache.get(cacheKey);
      if (cached !== undefined) return cached;

      // First check if user is the organization owner
      const org = await Organization.findById(orgId).lean();
      if (org && org.owner && org.owner.toString() === userId) {
        permissionCache.set(cacheKey, true);
        return true; // Organization owner always has access
      }

      const membership = await OrgMembership.findOne({
        user: userId,
        org: orgId,
        status: 'ACTIVE'
      }).lean();

      if (!membership) {
        permissionCache.set(cacheKey, false);
        return false;
      }

      // If no specific roles required, just check membership
      if (requiredRoles.length === 0) {
        permissionCache.set(cacheKey, true);
        return true;
      }

      // Check if user has required role
      const hasRequiredRole = requiredRoles.includes(membership.role);
      permissionCache.set(cacheKey, hasRequiredRole);
      return hasRequiredRole;

    } catch (error) {
      console.error('Error checking org access:', error);
      return false;
    }
  }

  /**
   * Check if user has access to an app
   * @param {string} userId - User ID
   * @param {string} appId - App ID
   * @param {Array} requiredRoles - Required app roles (optional)
   * @returns {Promise<Object>} - { hasAccess, accessType, role, membership }
   */
  static async hasAppAccess(userId, appId, requiredRoles = []) {
    const cacheKey = `app_access_${userId}_${appId}_${requiredRoles.join(',')}`;
    
    try {
      // Check cache first
      const cached = permissionCache.get(cacheKey);
      if (cached !== undefined) return cached;

      // Get app details
      const app = await App.findById(appId).lean();
      if (!app) {
        const result = { hasAccess: false, accessType: null, role: null };
        permissionCache.set(cacheKey, result);
        return result;
      }

      // Check direct app membership first
      const appMembership = await AppMembership.findOne({
        user: userId,
        app: appId,
        status: 'ACTIVE'
      }).lean();

      if (appMembership) {
        const hasRequiredRole = requiredRoles.length === 0 || 
          requiredRoles.includes(appMembership.role);
        
        const result = {
          hasAccess: hasRequiredRole,
          accessType: 'DIRECT',
          role: appMembership.role,
          membership: appMembership
        };
        
        permissionCache.set(cacheKey, result);
        return result;
      }

      // Check organization membership
      const orgMembership = await OrgMembership.findOne({
        user: userId,
        org: app.organizationId,
        status: 'ACTIVE'
      }).lean();

      if (!orgMembership) {
        const result = { hasAccess: false, accessType: null, role: null };
        permissionCache.set(cacheKey, result);
        return result;
      }

      // Check if user has full org access
      if (orgMembership.hasFullOrgAccess) {
        const hasRequiredRole = requiredRoles.length === 0 || 
          requiredRoles.includes(orgMembership.role);
        
        const result = {
          hasAccess: hasRequiredRole,
          accessType: 'ORGANIZATION',
          role: orgMembership.role,
          membership: orgMembership
        };
        
        permissionCache.set(cacheKey, result);
        return result;
      }

      // Check scoped app permissions for GUEST users
      const appPermission = orgMembership.appPermissions?.find(
        perm => perm.app.toString() === appId && perm.status === 'ACTIVE'
      );

      if (appPermission) {
        const hasRequiredRole = requiredRoles.length === 0 || 
          requiredRoles.includes(appPermission.role);
        
        const result = {
          hasAccess: hasRequiredRole,
          accessType: 'SCOPED',
          role: appPermission.role,
          membership: orgMembership,
          permission: appPermission
        };
        
        permissionCache.set(cacheKey, result);
        return result;
      }

      const result = { hasAccess: false, accessType: null, role: null };
      permissionCache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error checking app access:', error);
      return { hasAccess: false, accessType: null, role: null };
    }
  }

  /**
   * Get user's organizations with app access details
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Organizations with app access details
   */
  static async getUserOrganizations(userId) {
    const cacheKey = `user_orgs_${userId}`;
    
    try {
      // Check cache first
      const cached = permissionCache.get(cacheKey);
      if (cached !== undefined) return cached;

      const memberships = await OrgMembership.find({
        user: userId,
        status: 'ACTIVE'
      })
      .populate('org', 'name type imageUrl description')
      .populate('appPermissions.app', 'name description');

      const organizations = await Promise.all(
        memberships.map(async (membership) => {
          const org = membership.org;
          
          // Get accessible apps
          let accessibleApps = [];
          
          if (membership.hasFullOrgAccess) {
            // User has access to all apps in org
            accessibleApps = await App.find({
              organizationId: org._id
            }, 'name description createdAt').lean();
            
            accessibleApps = accessibleApps.map(app => ({
              ...app,
              id: app._id.toString(),
              accessType: 'ORGANIZATION',
              role: membership.role
            }));
          } else {
            // User has scoped access to specific apps
            accessibleApps = membership.appPermissions
              .filter(perm => perm.status === 'ACTIVE')
              .map(perm => ({
                ...perm.app.toObject(),
                id: perm.app._id.toString(),
                accessType: 'SCOPED',
                role: perm.role,
                grantedAt: perm.grantedAt,
                grantedBy: perm.grantedBy
              }));
          }

          return {
            id: org._id.toString(),
            name: org.name,
            type: org.type,
            imageUrl: org.imageUrl,
            description: org.description,
            userRole: membership.role,
            accessType: membership.hasFullOrgAccess ? 'FULL' : 'SCOPED',
            joinedAt: membership.joinedAt,
            appCount: accessibleApps.length,
            accessibleApps,
            membership
          };
        })
      );

      permissionCache.set(cacheKey, organizations);
      return organizations;

    } catch (error) {
      console.error('Error getting user organizations:', error);
      return [];
    }
  }

  /**
   * Get user's accessible apps across all organizations
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Accessible apps
   */
  static async getUserApps(userId, filters = {}) {
    const cacheKey = `user_apps_${userId}_${JSON.stringify(filters)}`;
    
    try {
      const cached = permissionCache.get(cacheKey);
      if (cached !== undefined) return cached;

      const organizations = await this.getUserOrganizations(userId);
      
      let allApps = [];
      
      for (const org of organizations) {
        const apps = org.accessibleApps.map(app => ({
          ...app,
          organization: {
            id: org.id,
            name: org.name,
            type: org.type
          },
          userRole: app.role,
          accessType: app.accessType
        }));
        
        allApps.push(...apps);
      }

      // Apply filters
      if (filters.organizationId) {
        allApps = allApps.filter(app => 
          app.organization.id.toString() === filters.organizationId
        );
      }

      if (filters.accessType) {
        allApps = allApps.filter(app => app.accessType === filters.accessType);
      }

      if (filters.role) {
        allApps = allApps.filter(app => app.userRole === filters.role);
      }

      // Sort by most recent access or creation
      allApps.sort((a, b) => {
        const dateA = a.grantedAt || a.createdAt;
        const dateB = b.grantedAt || b.createdAt;
        return new Date(dateB) - new Date(dateA);
      });

      permissionCache.set(cacheKey, allApps);
      return allApps;

    } catch (error) {
      console.error('Error getting user apps:', error);
      return [];
    }
  }

  /**
   * Add user to organization with app access
   * @param {string} userId - User ID
   * @param {string} orgId - Organization ID
   * @param {string} role - Organization role
   * @param {string} appId - App ID (for scoped access)
   * @param {string} appRole - App role
   * @param {string} grantedBy - Who granted the access
   * @returns {Promise<Object>} - Membership details
   */
  static async addUserToOrgWithAppAccess(userId, orgId, role, appId, appRole, grantedBy) {
    try {
      // Check if user already has org membership
      let membership = await OrgMembership.findOne({
        user: userId,
        org: orgId
      });

      if (membership) {
        // User already has org membership, just add app permission
        if (role === 'GUEST' && appId) {
          await membership.addAppPermission(appId, appRole, grantedBy);
        }
        
        // Update status if needed
        if (membership.status !== 'ACTIVE') {
          membership.status = 'ACTIVE';
          await membership.save();
        }
      } else {
        // Create new membership
        const membershipData = {
          user: userId,
          org: orgId,
          role,
          status: 'ACTIVE',
          invitedBy: grantedBy,
          metadata: {
            invitationType: appId ? 'APPLICATION' : 'ORGANIZATION'
          }
        };

        // Add app permission for GUEST users
        if (role === 'GUEST' && appId) {
          membershipData.appPermissions = [{
            app: appId,
            role: appRole,
            grantedBy,
            grantedAt: new Date(),
            status: 'ACTIVE'
          }];
        }

        membership = await OrgMembership.create(membershipData);

        // Add user to organization members array
        await Organization.findByIdAndUpdate(
          orgId,
          { $addToSet: { members: userId } }
        );
      }

      // Clear relevant caches
      this.clearUserCaches(userId);
      
      return membership;

    } catch (error) {
      console.error('Error adding user to org with app access:', error);
      throw error;
    }
  }

  /**
   * Remove user's app access
   * @param {string} userId - User ID
   * @param {string} appId - App ID
   * @param {string} removedBy - Who removed the access
   * @returns {Promise<boolean>} - Success status
   */
  static async removeAppAccess(userId, appId, removedBy) {
    try {
      // Remove direct app membership
      const appMembership = await AppMembership.findOne({
        user: userId,
        app: appId,
        status: 'ACTIVE'
      });

      if (appMembership) {
        appMembership.status = 'REMOVED';
        appMembership.removedAt = new Date();
        appMembership.removedBy = removedBy;
        await appMembership.save();
      }

      // Remove scoped app permission from org membership
      const app = await App.findById(appId);
      if (app) {
        const orgMembership = await OrgMembership.findOne({
          user: userId,
          org: app.organizationId,
          status: 'ACTIVE'
        });

        if (orgMembership && orgMembership.role === 'GUEST') {
          await orgMembership.revokeAppPermission(appId);
          
          // If this was the last app permission, remove org membership
          const activePermissions = orgMembership.appPermissions.filter(
            perm => perm.status === 'ACTIVE'
          );
          
          if (activePermissions.length === 0) {
            orgMembership.status = 'REMOVED';
            await orgMembership.save();
            
            // Remove from org members array
            await Organization.findByIdAndUpdate(
              app.organizationId,
              { $pull: { members: userId } }
            );
          }
        }
      }

      // Clear caches
      this.clearUserCaches(userId);
      
      return true;

    } catch (error) {
      console.error('Error removing app access:', error);
      return false;
    }
  }

  /**
   * Check if user can perform specific action on app
   * @param {string} userId - User ID
   * @param {string} appId - App ID
   * @param {string} action - Action to check
   * @returns {Promise<boolean>} - Permission status
   */
  static async canPerformAppAction(userId, appId, action) {
    try {
      const access = await this.hasAppAccess(userId, appId);
      
      if (!access.hasAccess) return false;

      // Define action requirements
      const actionRequirements = {
        'read': ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'],
        'write': ['MEMBER', 'ADMIN', 'OWNER'],
        'delete': ['ADMIN', 'OWNER'],
        'invite': ['ADMIN', 'OWNER'],
        'manage': ['OWNER']
      };

      const requiredRoles = actionRequirements[action] || [];
      return requiredRoles.includes(access.role);

    } catch (error) {
      console.error('Error checking app action permission:', error);
      return false;
    }
  }

  /**
   * Clear user-specific caches
   * @param {string} userId - User ID
   */
  static clearUserCaches(userId) {
    const keys = permissionCache.keys();
    const userKeys = keys.filter(key => key.includes(userId));
    
    userKeys.forEach(key => {
      permissionCache.del(key);
    });
  }

  /**
   * Clear all caches
   */
  static clearAllCaches() {
    permissionCache.flushAll();
    console.log('✅ All permission caches cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  static getCacheStats() {
    return permissionCache.getStats();
  }
}

module.exports = PermissionService; 