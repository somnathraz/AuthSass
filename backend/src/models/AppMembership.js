// models/AppMembership.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const AppMembershipSchema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    app: { 
      type: Schema.Types.ObjectId, 
      ref: "App", 
      required: true 
    },
    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
      required: true,
      default: "MEMBER"
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "REMOVED"],
      default: "ACTIVE"
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    },
    invitedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    },
    removedAt: Date,
    removedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    },
    // Permissions within the app
    permissions: {
      canRead: { type: Boolean, default: true },
      canWrite: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canInvite: { type: Boolean, default: false },
      canManageSettings: { type: Boolean, default: false }
    },
    // Metadata
    metadata: {
      invitationType: {
        type: String,
        enum: ["DIRECT", "ORGANIZATION", "APPLICATION"],
        default: "DIRECT"
      },
      lastAccessAt: Date,
      accessCount: { type: Number, default: 0 }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
AppMembershipSchema.index({ user: 1, app: 1 }, { unique: true });
AppMembershipSchema.index({ app: 1, status: 1 });
AppMembershipSchema.index({ user: 1, status: 1 });
AppMembershipSchema.index({ role: 1 });

// Virtual for checking if user is app owner
AppMembershipSchema.virtual('isOwner').get(function() {
  return this.role === 'OWNER';
});

// Virtual for checking if user can admin the app
AppMembershipSchema.virtual('canAdmin').get(function() {
  return ['OWNER', 'ADMIN'].includes(this.role);
});

// Instance method to check specific permission
AppMembershipSchema.methods.hasPermission = function(permission) {
  // Owners and admins have all permissions
  if (['OWNER', 'ADMIN'].includes(this.role)) {
    return true;
  }
  
  // Check role-based permissions
  const rolePermissions = {
    MEMBER: ['canRead', 'canWrite'],
    VIEWER: ['canRead']
  };
  
  const allowedPerms = rolePermissions[this.role] || [];
  return allowedPerms.includes(permission) || this.permissions[permission];
};

// Instance method to update last access
AppMembershipSchema.methods.updateLastAccess = function() {
  this.metadata.lastAccessAt = new Date();
  this.metadata.accessCount += 1;
  return this.save();
};

// Static method to find user's app memberships
AppMembershipSchema.statics.findUserMemberships = async function(userId, options = {}) {
  const query = {
    user: userId,
    status: options.status || 'ACTIVE'
  };
  
  return this.find(query)
    .populate('app', 'name description organizationId')
    .populate('invitedBy', 'username email')
    .sort(options.sort || { joinedAt: -1 })
    .lean();
};

// Static method to find app members
AppMembershipSchema.statics.findAppMembers = async function(appId, options = {}) {
  const query = {
    app: appId,
    status: options.status || 'ACTIVE'
  };
  
  return this.find(query)
    .populate('user', 'username email firstName lastName profileImage')
    .populate('invitedBy', 'username email')
    .sort(options.sort || { role: 1, joinedAt: -1 })
    .lean();
};

// Static method to check if user has app access
AppMembershipSchema.statics.hasAppAccess = async function(userId, appId) {
  const membership = await this.findOne({
    user: userId,
    app: appId,
    status: 'ACTIVE'
  });
  
  return !!membership;
};

// Static method to get user's app role
AppMembershipSchema.statics.getUserAppRole = async function(userId, appId) {
  const membership = await this.findOne({
    user: userId,
    app: appId,
    status: 'ACTIVE'
  });
  
  return membership ? membership.role : null;
};

// Pre-save middleware to set default permissions based on role
AppMembershipSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    const rolePermissions = {
      OWNER: {
        canRead: true,
        canWrite: true,
        canDelete: true,
        canInvite: true,
        canManageSettings: true
      },
      ADMIN: {
        canRead: true,
        canWrite: true,
        canDelete: true,
        canInvite: true,
        canManageSettings: false
      },
      MEMBER: {
        canRead: true,
        canWrite: true,
        canDelete: false,
        canInvite: false,
        canManageSettings: false
      },
      VIEWER: {
        canRead: true,
        canWrite: false,
        canDelete: false,
        canInvite: false,
        canManageSettings: false
      }
    };
    
    this.permissions = { ...this.permissions, ...rolePermissions[this.role] };
  }
  
  next();
});

module.exports = mongoose.model("AppMembership", AppMembershipSchema);
