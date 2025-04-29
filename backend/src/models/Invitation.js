// models/Invitation.js
const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  appId: { type: mongoose.Schema.Types.ObjectId, ref: "App", required: true },
  role: { type: String, default: "member" },
  token: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Invitation", invitationSchema);
