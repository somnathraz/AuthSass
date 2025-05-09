// utils/invite.js
const User = require("../models/User");
const Organization = require("../models/Organization");
const OrgMembership = require("../models/OrgMembership");
const { hashPassword } = require("../utils/auth");

async function findOrCreateUserByEmail(email, { username, password }) {
  // 1) Try existing user
  let user = await User.findOne({ email });
  if (user) return { user, isNew: false };

  // 2) New user → require credentials
  if (!username || !password) {
    throw new Error("Must supply username & password to register.");
  }

  // 3) Create user record
  const passwordHash = await hashPassword(password);
  user = new User({
    username,
    email,
    passwordHash,
    accountType: "personal",
    role: "user",
  });
  await user.save();

  // 4) Ensure single PERSONAL org
  let personalOrg = await Organization.findOne({
    owner: user._id,
    type: "PERSONAL",
  });
  if (!personalOrg) {
    personalOrg = new Organization({
      name: `${username}'s Personal Workspace`,
      owner: user._id,
      members: [user._id],
      type: "PERSONAL",
      createdAt: new Date().toISOString(),
    });
    await personalOrg.save();

    await OrgMembership.create({
      user: user._id,
      org: personalOrg._id,
      role: "admin",
    });
  }

  // 5) Point user at their personal org
  user.organizationId = personalOrg._id;
  await user.save();

  return { user, isNew: true };
}

module.exports = { findOrCreateUserByEmail };
