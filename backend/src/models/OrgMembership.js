// models/OrgMembership.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrgMembershipSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    org: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    role: {
      type: String,
      enum: ["admin", "member"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrgMembership", OrgMembershipSchema);
