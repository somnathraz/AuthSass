const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  bio: { type: String, maxlength: 500 },
  location: { type: String, maxlength: 100 },
  website: { type: String, maxlength: 200 },
  profileImage: { type: String },
  role: { type: String, required: true, default: "MEMBER" },
  accountType: {
    type: String,
    enum: ["personal", "organizational"],
    default: "personal",
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"],
    default: "PENDING",
  },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  emailVerificationToken: { type: String },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  requirePasswordReset: { type: Boolean, default: false },
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  lastLoginAt: { type: Date },
  lastLoginIP: { type: String },
  lastLoginUserAgent: { type: String },
  lastSeenAt: { type: Date },
  socialProviders: [{ type: String }],
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
      frequency: { type: String, default: 'IMMEDIATE' }
    },
    privacy: {
      profileVisibility: { type: String, default: 'ORGANIZATION' },
      dataSharing: { type: Boolean, default: false },
      analyticsOptOut: { type: Boolean, default: false }
    },
    appearance: {
      theme: { type: String, default: 'AUTO' },
      language: { type: String, default: 'en' },
      dateFormat: { type: String, default: 'MM/DD/YYYY' },
      timeFormat: { type: String, default: 'FORMAT_12' }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date },
  deletedBy: { type: Schema.Types.ObjectId, ref: "User" }
});

// Add method to check if account is locked
UserSchema.methods.isLockedOut = function() {
  return this.lockoutUntil && this.lockoutUntil > new Date();
};

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("User", UserSchema);
