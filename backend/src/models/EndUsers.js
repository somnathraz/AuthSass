// models/EndUser.js
const mongoose = require("mongoose");

const endUserSchema = new mongoose.Schema(
  {
    appId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "App",
      required: true,
    },
    email: { type: String, required: true },
    username: { type: String },
    signupMethod: {
      type: String,
      enum: ["email", "google", "other"],
      default: "email",
    },
    metadata: {
      type: Object,
      default: {},
    },
    lastLoginAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

endUserSchema.index({ appId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("EndUser", endUserSchema);
