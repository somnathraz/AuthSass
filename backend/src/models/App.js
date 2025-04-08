const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AppMemberSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, default: "member" }, // e.g., "member", "admin", etc.
});

const AppSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  members: [AppMemberSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("App", AppSchema);
