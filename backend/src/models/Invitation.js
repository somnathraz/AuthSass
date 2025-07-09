// models/Invitation.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const InvitationSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    lowercase: true,
    trim: true
  },
  
  // Type of invitation
  type: {
    type: String,
    enum: ['ORGANIZATION', 'APPLICATION'],
    required: true
  },
  
  // Role being invited to
  role: { 
    type: String, 
    required: true,
    enum: ['SUPER_ADMIN', 'ADMIN', 'MEMBER', 'VIEWER', 'OWNER', 'GUEST']
  },
  
  // Status of invitation
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELED'],
    default: 'PENDING'
  },
  
  // Who sent the invitation
  invitedBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  // Who was invited (if they exist)
  invitedUser: { 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  },
  
  // Organization (for org invitations or app invitations)
  organization: { 
    type: Schema.Types.ObjectId, 
    ref: "Organization"
  },
  
  // App (for app-specific invitations)
  app: { 
    type: Schema.Types.ObjectId, 
    ref: "App"
  },
  
  // Invitation token for accepting
  token: { 
    type: String, 
    unique: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  
  // Optional message
  message: { 
    type: String 
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  expiresAt: { 
    type: Date, 
    required: true 
  },
  
  // Action timestamps
  acceptedAt: { 
    type: Date 
  },
  
  declinedAt: { 
    type: Date 
  },
  
  canceledAt: { 
    type: Date 
  }
}, {
  timestamps: true // This will automatically handle createdAt and updatedAt
});

// Indexes for performance
InvitationSchema.index({ email: 1, status: 1 });
InvitationSchema.index({ invitedBy: 1 });
InvitationSchema.index({ organization: 1, status: 1 });
InvitationSchema.index({ app: 1, status: 1 });
InvitationSchema.index({ expiresAt: 1 });

// Validation: Either organization or app must be specified
InvitationSchema.pre('validate', function(next) {
  if (this.type === 'ORGANIZATION' && !this.organization) {
    return next(new Error('Organization is required for organization invitations'));
  }
  if (this.type === 'APPLICATION' && !this.app) {
    return next(new Error('App is required for application invitations'));
  }
  next();
});

module.exports = mongoose.model("Invitation", InvitationSchema);
