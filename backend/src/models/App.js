const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AppMemberSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, default: "member" }, // e.g., "member", "admin", etc.
});

const AppSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"],
    default: "ACTIVE",
  },
  type: {
    type: String,
    enum: ["WEB", "MOBILE", "API", "SERVICE"],
    required: true,
  },
  settings: { type: Schema.Types.Mixed },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }], // Simplified to just user IDs
  apiKeys: [{ type: Schema.Types.ObjectId, ref: "ApiKey" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add virtual for memberCount
AppSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Ensure virtuals are included when converting to JSON
AppSchema.set('toJSON', { virtuals: true });
AppSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("App", AppSchema);
