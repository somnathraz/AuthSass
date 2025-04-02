const { Schema, model } = require("mongoose");

const apiKeySchema = new Schema({
  key: { type: String, required: true, unique: true },
  appId: { type: Schema.Types.ObjectId, ref: "App", required: true },
  createdAt: { type: Date, default: Date.now },
  revoked: { type: Boolean, default: false },
  // Optionally add fields like name, usage limits, etc.
});

module.exports = model("ApiKey", apiKeySchema);
