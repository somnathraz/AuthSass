const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrganizationSchema = new Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["PERSONAL", "ORGANIZATION"],
    default: "PERSONAL",
  },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  imageUrl: String,
});
// ensure each user can have *only one* PERSONAL org
OrganizationSchema.index(
  { owner: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "PERSONAL" },
  }
);

module.exports = mongoose.model("Organization", OrganizationSchema);
