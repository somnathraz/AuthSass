// models/OrgInvitation.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrgInvitationSchema = new Schema({
  email: { type: String, required: true },
  orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  role: { type: String, required: true }, // e.g. "member" or "admin"
  token: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

module.exports = mongoose.model("OrgInvitation", OrgInvitationSchema);
