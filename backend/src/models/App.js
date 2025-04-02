const { Schema, model } = require("mongoose");

const appSchema = new Schema({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  // You can add additional fields like callback URLs, branding info, etc.
});

module.exports = model("App", appSchema);
