// models/OrgMembership.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

// App permission schema for scoped access
const AppPermissionSchema = new Schema({
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
  grantedAt: { 
    type: Date, 
    default: Date.now 
  },
  grantedBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  status: {
    type: String,
    enum: ["ACTIVE", "SUSPENDED", "REVOKED"],
    default: "ACTIVE"
  }
}, { _id: true });

const OrgMembershipSchema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    org: { 
      type: Schema.Types.ObjectId, 
      ref: "Organization", 
      required: true 
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "MEMBER", "GUEST"],
      required: true,
      default: "MEMBER"
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING", "SUSPENDED", "REMOVED"],
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
    // Scoped app permissions for GUEST users
    appPermissions: [AppPermissionSchema],
    // Metadata for tracking
    metadata: {
      invitationType: {
        type: String,
        enum: ["ORGANIZATION", "APPLICATION", "DIRECT"],
        default: "DIRECT"
      },
      lastActivityAt: Date,
      permissions: {
        canCreateApps: { type: Boolean, default: false },
        canInviteMembers: { type: Boolean, default: false },
        canManageSettings: { type: Boolean, default: false }
      }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
OrgMembershipSchema.index({ user: 1, org: 1 }, { unique: true });
OrgMembershipSchema.index({ org: 1, status: 1 });
OrgMembershipSchema.index({ user: 1, status: 1 });
OrgMembershipSchema.index({ "appPermissions.app": 1 });

// Virtual for checking if user has full org access
OrgMembershipSchema.virtual('hasFullOrgAccess').get(function() {
  return ['SUPER_ADMIN', 'ADMIN', 'MEMBER'].includes(this.role);
});

// Virtual for getting accessible apps
OrgMembershipSchema.virtual('accessibleApps').get(function() {
  if (this.hasFullOrgAccess) {
    return 'ALL'; // Has access to all apps in org
  }
  return this.appPermissions
    .filter(perm => perm.status === 'ACTIVE')
    .map(perm => perm.app);
});

// Instance method to check app access
OrgMembershipSchema.methods.hasAppAccess = function(appId) {
  if (this.hasFullOrgAccess) {
    return true;
  }
  
  return this.appPermissions.some(perm => 
    perm.app.toString() === appId.toString() && 
    perm.status === 'ACTIVE'
  );
};

// Instance method to get app role
OrgMembershipSchema.methods.getAppRole = function(appId) {
  if (this.hasFullOrgAccess) {
    return this.role;
  }
  
  const permission = this.appPermissions.find(perm => 
    perm.app.toString() === appId.toString() && 
    perm.status === 'ACTIVE'
  );
  
  return permission ? permission.role : null;
};

// Instance method to add app permission
OrgMembershipSchema.methods.addAppPermission = function(appId, role, grantedBy) {
  // Remove existing permission if any
  this.appPermissions = this.appPermissions.filter(
    perm => perm.app.toString() !== appId.toString()
  );
  
  // Add new permission
  this.appPermissions.push({
    app: appId,
    role,
    grantedBy,
    grantedAt: new Date(),
    status: 'ACTIVE'
  });
  
  return this.save();
};

// Instance method to revoke app permission
OrgMembershipSchema.methods.revokeAppPermission = function(appId) {
  const permission = this.appPermissions.find(
    perm => perm.app.toString() === appId.toString()
  );
  
  if (permission) {
    permission.status = 'REVOKED';
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static method to find user's organization memberships with app access
OrgMembershipSchema.statics.findUserMembershipsWithApps = async function(userId) {
  return this.find({
    user: userId,
    status: 'ACTIVE'
  })
  .populate('org', 'name type imageUrl')
  .populate('appPermissions.app', 'name description')
  .populate('appPermissions.grantedBy', 'username email')
  .lean();
};

// Static method to check if user has org access
OrgMembershipSchema.statics.hasOrgAccess = async function(userId, orgId) {
  const membership = await this.findOne({
    user: userId,
    org: orgId,
    status: 'ACTIVE'
  });
  
  return !!membership;
};

// Static method to get user's highest role in org
OrgMembershipSchema.statics.getUserOrgRole = async function(userId, orgId) {
  const membership = await this.findOne({
    user: userId,
    org: orgId,
    status: 'ACTIVE'
  });
  
  return membership ? membership.role : null;
};

module.exports = mongoose.model("OrgMembership", OrgMembershipSchema);
