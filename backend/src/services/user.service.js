const User = require('../models/User');
const Organization = require('../models/Organization');
const OrgMembership = require('../models/OrgMembership');
const { auditLog } = require('../utils/audit');

class UserService {
  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User object
   */
  async findById(userId) {
    if (!userId) {
      console.error('findById called with null/undefined userId');
      return null;
    }

    try {
      const user = await User.findById(userId)
        .select('-passwordHash');
      
      if (!user) {
        return null;
      }
      
      // Convert to plain object and ensure id field is set for GraphQL
      const userObj = user.toObject();
      userObj.id = userObj._id.toString();
      
      // Ensure organizationId is properly formatted as string
      if (userObj.organizationId) {
        userObj.organizationId = userObj.organizationId.toString();
        console.log(`User ${userId} organizationId: ${userObj.organizationId}`);
      } else {
        console.log(`User ${userId} has no organizationId`);
      }
      
      return userObj;
    } catch (err) {
      console.error(`Error in findById(${userId}):`, err.message);
      return null;
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} - User object
   */
  async findByEmail(email) {
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (!user) {
      return null;
    }
    
    // Convert to plain object and ensure proper ID formatting
    const userObj = user.toObject();
    userObj.id = userObj._id.toString();
    
    // Ensure organizationId is properly formatted as string
    if (userObj.organizationId) {
      userObj.organizationId = userObj.organizationId.toString();
      console.log(`User ${userObj.email} organizationId: ${userObj.organizationId}`);
    } else {
      console.log(`User ${userObj.email} has no organizationId`);
    }
    
    return userObj;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object>} - User object
   */
  async findByUsername(username) {
    return await User.findOne({ 
      username: username.toLowerCase().trim() 
    });
  }

  /**
   * Update last seen timestamp
   * @param {string} userId - User ID
   */
  async updateLastSeen(userId) {
    await User.findByIdAndUpdate(userId, {
      lastSeenAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Update login information
   * @param {string} userId - User ID
   * @param {string} ip - IP address
   * @param {string} userAgent - User agent
   */
  async updateLoginInfo(userId, ip, userAgent) {
    await User.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
      lastLoginIP: ip,
      lastLoginUserAgent: userAgent,
      failedLoginAttempts: 0,
      lockoutUntil: undefined,
      updatedAt: new Date()
    });
  }

  /**
   * Increment failed login attempts
   * @param {string} userId - User ID
   */
  async incrementFailedLoginAttempts(userId) {
    const user = await User.findById(userId);
    if (!user) return;

    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    
    // Lock account after 5 failed attempts for 15 minutes
    if (user.failedLoginAttempts >= 5) {
      user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    await user.save();
  }

  /**
   * Reset failed login attempts
   * @param {string} userId - User ID
   */
  async resetFailedLoginAttempts(userId) {
    await User.findByIdAndUpdate(userId, {
      failedLoginAttempts: 0,
      lockoutUntil: undefined,
      updatedAt: new Date()
    });
  }

  /**
   * Update social login information
   * @param {string} userId - User ID
   * @param {string} provider - Social provider
   * @param {Object} socialInfo - Social user info
   */
  async updateSocialInfo(userId, provider, socialInfo) {
    const updateData = {
      updatedAt: new Date()
    };

    // Update profile info if not already set
    if (socialInfo.firstName) updateData.firstName = socialInfo.firstName;
    if (socialInfo.lastName) updateData.lastName = socialInfo.lastName;
    if (socialInfo.picture) updateData.profileImage = socialInfo.picture;

    // Add social provider to array if not already present
    const user = await User.findById(userId);
    if (user && !user.socialProviders?.includes(provider)) {
      updateData.$addToSet = { socialProviders: provider };
    }

    await User.findByIdAndUpdate(userId, updateData);
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated user
   */
  async updateProfile(userId, updateData) {
    const allowedFields = [
      'firstName', 'lastName', 'username', 'profileImage', 
      'bio', 'location', 'website', 'preferences'
    ];

    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    filteredData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      userId, 
      filteredData, 
      { new: true, runValidators: true }
    ).select('-passwordHash');

    await auditLog('PROFILE_UPDATED', userId, { fields: Object.keys(filteredData) });

    return user;
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} newPasswordHash - New password hash
   */
  async changePassword(userId, newPasswordHash) {
    await User.findByIdAndUpdate(userId, {
      passwordHash: newPasswordHash,
      requirePasswordReset: false,
      passwordChangedAt: new Date(),
      updatedAt: new Date()
    });

    await auditLog('PASSWORD_CHANGED', userId);
  }

  /**
   * Update user status
   * @param {string} userId - User ID
   * @param {string} status - New status
   */
  async updateStatus(userId, status) {
    await User.findByIdAndUpdate(userId, {
      status,
      updatedAt: new Date()
    });

    await auditLog('STATUS_CHANGED', userId, { newStatus: status });
  }

  /**
   * Get user organizations with roles
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Organizations with roles
   */
  async getUserOrganizations(userId) {
    const memberships = await OrgMembership.find({ user: userId })
      .populate({
        path: 'org',
        select: 'name type status imageUrl createdAt'
      })
      .lean();

    return memberships.map(membership => ({
      ...membership.org,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt
    }));
  }

  /**
   * Search users
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Search results
   */
  async searchUsers(criteria, options = {}) {
    const {
      limit = 10,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query = User.find(criteria)
      .select('-passwordHash -emailVerificationToken')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(offset)
      .limit(limit);

    const [users, total] = await Promise.all([
      query.exec(),
      User.countDocuments(criteria)
    ]);

    return {
      users,
      total,
      hasNextPage: offset + limit < total,
      hasPreviousPage: offset > 0
    };
  }

  /**
   * Delete user account
   * @param {string} userId - User ID
   * @param {string} deletedBy - ID of user performing deletion
   */
  async deleteUser(userId, deletedBy) {
    const session = await User.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Soft delete user
        await User.findByIdAndUpdate(userId, {
          status: 'DELETED',
          deletedAt: new Date(),
          deletedBy,
          updatedAt: new Date()
        }, { session });

        // Remove from all organizations
        await OrgMembership.deleteMany({ user: userId }, { session });

        await auditLog('USER_DELETED', userId, { deletedBy });
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Verify user email
   * @param {string} userId - User ID
   */
  async verifyEmail(userId) {
    await User.findByIdAndUpdate(userId, {
      isVerified: true,
      emailVerificationToken: undefined,
      status: 'ACTIVE',
      updatedAt: new Date()
    });

    await auditLog('EMAIL_VERIFIED', userId);
  }

  /**
   * Update user's current organization
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Updated user
   */
  async updateCurrentOrganization(userId, organizationId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { organizationId },
      { new: true }
    );
    
    await auditLog('USER_ORGANIZATION_SWITCHED', userId, {
      organizationId
    });
    
    return user;
  }

  /**
   * Get comprehensive user statistics (admin only)
   * @returns {Promise<Object>} - User statistics
   */
  async getUserStats() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get basic counts
      const [
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth
      ] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ status: 'ACTIVE' }),
        User.countDocuments({ createdAt: { $gte: today } }),
        User.countDocuments({ createdAt: { $gte: weekAgo } }),
        User.countDocuments({ createdAt: { $gte: monthAgo } })
      ]);

      // Get users by role
      const usersByRole = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            role: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);

      // Get users by status
      const usersByStatus = await User.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);

      // Get users by account type
      const usersByAccountType = await User.aggregate([
        {
          $group: {
            _id: '$accountType',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            accountType: {
              $switch: {
                branches: [
                  { case: { $eq: ['$_id', 'personal'] }, then: 'PERSONAL' },
                  { case: { $eq: ['$_id', 'organizational'] }, then: 'BUSINESS' }
                ],
                default: 'PERSONAL'
              }
            },
            count: 1,
            _id: 0
          }
        }
      ]);

      return {
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        usersByRole: usersByRole || [],
        usersByStatus: usersByStatus || [],
        usersByAccountType: usersByAccountType || []
      };

    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }
}

module.exports = new UserService(); 