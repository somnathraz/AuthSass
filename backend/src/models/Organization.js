const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrganizationSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ["PERSONAL", "TEAM", "COMPANY", "ENTERPRISE"],
    default: "PERSONAL",
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"],
    default: "ACTIVE",
  },
  imageUrl: { type: String },
  website: { type: String },
  
  // Extended settings for organization configuration
  slug: { type: String, unique: true, sparse: true },
  supportEmail: { type: String },
  timezone: { type: String, default: 'UTC' },
  contactName: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  
  // Security and authentication settings
  passwordPolicy: {
    minLength: { type: Number, default: 8 },
    requireUppercase: { type: Boolean, default: true },
    requireLowercase: { type: Boolean, default: true },
    requireNumbers: { type: Boolean, default: true },
    requireSpecialChars: { type: Boolean, default: false },
    passwordHistory: { type: Number, default: 5 },
    passwordExpiration: { type: Number, default: 90 }, // days
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 30 }, // minutes
    // Enhanced security settings
    enableMFA: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 15 }, // minutes
    allowPasswordReset: { type: Boolean, default: true },
    enforcePasswordComplexity: { type: Boolean, default: false },
  },
  
  // Domain and callback settings
  domainSettings: {
    allowedCallbackUrls: { type: [String], default: [] },
    allowedLogoutUrls: { type: [String], default: [] },
    allowedWebOrigins: { type: [String], default: [] },
    customDomain: { type: String },
    // SDK Whitelist settings
    sdkAllowedDomains: { type: [String], default: [] },
    enableCORS: { type: Boolean, default: true },
    corsMaxAge: { type: Number, default: 86400 }, // seconds
  },
  
  // Branding settings
  branding: {
    primaryColor: { type: String, default: '#4F46E5' },
    secondaryColor: { type: String, default: '#6B7280' },
    logoUrl: { type: String },
    faviconUrl: { type: String },
    customCss: { type: String },
  },
  
  // Notification preferences
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
    weeklyReports: { type: Boolean, default: true },
    systemUpdates: { type: Boolean, default: true },
  },
  
  // Analytics and tracking
  analytics: {
    enableTracking: { type: Boolean, default: true },
    retentionPeriod: { type: Number, default: 90 }, // days
    exportFormat: { type: String, enum: ['JSON', 'CSV'], default: 'JSON' },
  },
  
  // Legacy mixed settings for backward compatibility
  settings: { type: Schema.Types.Mixed },
  
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ensure each user can have *only one* PERSONAL org
OrganizationSchema.index(
  { owner: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "PERSONAL" },
  }
);

// Add virtual for memberCount
OrganizationSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Ensure virtuals are included when converting to JSON
OrganizationSchema.set('toJSON', { virtuals: true });
OrganizationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Organization", OrganizationSchema);
