const { Schema, model } = require("mongoose");

const auditLogSchema = new Schema(
  {
    // Tier identification - CRITICAL for three-tier system
    logTier: {
      type: String,
      enum: ["PLATFORM", "CUSTOMER", "APPLICATION"],
      required: true,
      default: "APPLICATION",
    },

    // Hierarchical identifiers
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: false, // NULL for platform-tier logs
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "App",
      required: false, // NULL for platform/customer-tier logs
    },

    // Event details
    eventType: {
      type: String,
      required: true,
    }, // Replaces 'action' with more specific naming
    eventCategory: {
      type: String,
      enum: [
        "AUTH",
        "ADMIN",
        "SECURITY",
        "API",
        "SYSTEM",
        "USER_MANAGEMENT",
        "APP_MANAGEMENT",
      ],
      required: true,
      default: "AUTH",
    },

    // Actor information
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    }, // Replaces 'userId' with more specific naming
    actorType: {
      type: String,
      enum: [
        "PLATFORM_ADMIN",
        "CUSTOMER_ADMIN",
        "CUSTOMER_MEMBER",
        "END_USER",
        "SYSTEM",
      ],
      required: true,
      default: "END_USER",
    },

    // Enhanced metadata with structured fields
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    }, // Keep flexible metadata

    // Common audit fields extracted from metadata for better querying
    ipAddress: { type: String },
    userAgent: { type: String },
    location: { type: String }, // Geographic location if available
    sessionId: { type: String },

    // Result information
    success: { type: Boolean, default: true },
    errorCode: { type: String },
    errorMessage: { type: String },

    // Timestamps
    timestamp: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying by tier
auditLogSchema.index({ customerId: 1, logTier: 1, timestamp: -1 });
auditLogSchema.index({ applicationId: 1, logTier: 1, timestamp: -1 });
auditLogSchema.index({ eventType: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1, actorType: 1, timestamp: -1 });
auditLogSchema.index({ logTier: 1, timestamp: -1 });
auditLogSchema.index({ eventCategory: 1, logTier: 1, timestamp: -1 });

// Compound indexes for common query patterns
auditLogSchema.index({ customerId: 1, eventCategory: 1, timestamp: -1 });
auditLogSchema.index({ applicationId: 1, eventType: 1, timestamp: -1 });

// Virtual for backward compatibility
auditLogSchema.virtual("action").get(function () {
  return this.eventType;
});

auditLogSchema.virtual("userId").get(function () {
  return this.performedBy;
});

// Instance method to determine tier automatically
auditLogSchema.methods.determineTier = function () {
  if (this.applicationId && this.customerId) {
    return "APPLICATION";
  } else if (this.customerId && !this.applicationId) {
    return "CUSTOMER";
  } else {
    return "PLATFORM";
  }
};

// Static method for platform logs
auditLogSchema.statics.createPlatformLog = function (
  eventType,
  performedBy,
  metadata = {}
) {
  return this.create({
    logTier: "PLATFORM",
    eventType,
    eventCategory: metadata.category || "SYSTEM",
    performedBy,
    actorType: "PLATFORM_ADMIN",
    metadata,
    ipAddress: metadata.ip,
    userAgent: metadata.userAgent,
  });
};

// Static method for customer logs
auditLogSchema.statics.createCustomerLog = function (
  eventType,
  customerId,
  performedBy,
  metadata = {}
) {
  return this.create({
    logTier: "CUSTOMER",
    customerId,
    eventType,
    eventCategory: metadata.category || "ADMIN",
    performedBy,
    actorType: metadata.actorType || "CUSTOMER_ADMIN",
    metadata,
    ipAddress: metadata.ip,
    userAgent: metadata.userAgent,
  });
};

// Static method for application logs
auditLogSchema.statics.createApplicationLog = function (
  eventType,
  customerId,
  applicationId,
  performedBy,
  metadata = {}
) {
  return this.create({
    logTier: "APPLICATION",
    customerId,
    applicationId,
    eventType,
    eventCategory: metadata.category || "AUTH",
    performedBy,
    actorType: metadata.actorType || "END_USER",
    metadata,
    ipAddress: metadata.ip,
    userAgent: metadata.userAgent,
    success: metadata.success !== undefined ? metadata.success : true,
    errorCode: metadata.errorCode,
    errorMessage: metadata.errorMessage,
    sessionId: metadata.sessionId,
  });
};

module.exports = model("AuditLog", auditLogSchema);
