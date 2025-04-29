const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, default: "admin" }, // For dashboard users, default to "admin"
  accountType: {
    type: String,
    enum: ["personal", "organizational"],
    default: "personal",
  },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  requirePasswordReset: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
