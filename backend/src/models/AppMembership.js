// models/AppMembership.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const AppMembershipSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    app: { type: Schema.Types.ObjectId, ref: "App", required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "member", "viewer"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppMembership", AppMembershipSchema);
