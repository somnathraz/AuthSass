// graphql/resolvers.js
const User = require("../models/User");

const {
  hashPassword,
  comparePassword,
  generateTokens,
} = require("../utils/auth");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const { signupSchema, loginSchema } = require("../utils/validators");
const RefreshToken = require("../models/RefreshToken");
const { sendEmail } = require("../utils/email");
const { checkRole } = require("../utils/authorization");
const { logEvent } = require("../models/logger");
const AuditLog = require("../models/AuditLog");
const { OAuth2Client } = require("google-auth-library");
const GraphQLJSON = require("graphql-type-json");
const crypto = require("crypto");
const ApiKey = require("../models/ApiKey");
const App = require("../models/App");
const Organization = require("../models/Organization");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const dummyPassword = process.env.DUMMY_PASSWORD || "defaultDummyPassword123!";

module.exports = {
  JSON: GraphQLJSON,
  Query: {
    me: async (_, __, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      return await User.findById(req.userId);
    },
    listUsers: async (_, __, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      const currentUser = await User.findById(req.userId);
      checkRole(currentUser, ["admin"]); // Only admin can list users
      return await User.find({});
    },
    auditLogs: async (_, { appId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      const currentUser = await User.findById(req.userId);
      checkRole(currentUser, ["admin"]); // Only admin can view audit logs
      // Filter audit logs by the provided appId and sort by timestamp descending
      return await AuditLog.find({ appId }).sort({ timestamp: -1 });
    },
    myApps: async (_, __, { req }) => {
      // console.log(req.userId, "req.userId");
      if (!req.userId) throw new Error("Not authenticated!");
      return await App.find({ owner: req.userId });
    },
    listApiKeys: async (_, { appId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // Optionally, verify that the app belongs to the user.
      const app = await App.findOne({ _id: appId, owner: req.userId });
      if (!app) throw new Error("App not found or not owned by you.");
      return await ApiKey.find({ appId });
    },
  },

  Mutation: {
    signup: async (_, { username, email, password }, { req, res }) => {
      const { error } = signupSchema.validate({ username, email, password });
      if (error) throw new Error(error.details[0].message);

      const existingUser = await User.findOne({ email });
      if (existingUser) throw new Error("User already exists!");

      const passwordHash = await hashPassword(password);
      const verificationToken = uuidv4();

      // Create user with default accountType "personal" and default role "admin"
      const user = await User.create({
        username,
        email,
        passwordHash,
        verificationToken,
        accountType: "personal",
        role: "admin",
      });

      // Create a personal organization for the user
      const organizationName = `${username}'s Organization`;
      const organization = await Organization.create({
        name: organizationName,
        owner: user._id,
        members: [user._id],
      });

      // Update user with the created organization ID
      user.organizationId = organization._id;
      await user.save();

      // Send verification email
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await sendEmail(
        user.email,
        "Verify Your Email",
        `Click here to verify: ${verificationLink}`
      );

      const { accessToken, refreshToken } = await generateTokens(user);

      res.cookie("token", accessToken, {
        httpOnly: true,
        domain: "localhost",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
        path: "/",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        domain: "localhost",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
        path: "/",
      });

      await logEvent("SIGNUP", user._id, { email });
      return { accessToken, refreshToken, user };
    },
    requestPasswordReset: async (_, { email }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found!");

      const resetToken = uuidv4();
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 min
      await user.save();

      // Send password reset email
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await sendEmail(
        user.email,
        "Reset Your Password",
        `Click here: ${resetLink}`
      );
      await logEvent("REQUEST_PASSWORD_RESET", user ? user._id : null, {
        email,
      });
      return "Password reset email sent.";
    },
    login: async (_, { email, password }, { req, res }) => {
      // 1) Find user
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found!");

      // Validate credentials using the login schema
      const { error } = loginSchema.validate({ email, password });
      if (error) throw new Error(error.details[0].message);

      // 2) Check password
      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) throw new Error("Invalid password!");

      // 3) Generate tokens
      const { accessToken, refreshToken } = await generateTokens(user);

      // 4) Set cookie (e.g., storing the access token)
      res.cookie("token", accessToken, {
        httpOnly: true, // Not accessible via JS, helps with XSS
        secure: process.env.NODE_ENV === "production", // use HTTPS in production
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax", // Adjust as needed
        domain: "localhost",
        path: "/",
      });
      // 4) (Risk management removed)
      // 6) Set the refresh token as an HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
        domain: "localhost",
        path: "/",
      });

      // 5) Return tokens and user data
      await logEvent("LOGIN", { email });
      return { accessToken, refreshToken, user };
    },
    resetPassword: async (_, { token, newPassword }) => {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      });
      if (!user) throw new Error("Invalid or expired reset token.");

      user.passwordHash = await hashPassword(newPassword);
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();
      await logEvent("RESET_PASSWORD", user._id);
      return "Password reset successful. You can now log in.";
    },
    // For exchanging refreshToken -> new access token
    refreshToken: async (_, { refreshToken }, { req }) => {
      // If the refreshToken argument is missing, try reading it from the cookie
      const tokenFromCookie = refreshToken || req.cookies?.refreshToken;
      if (!tokenFromCookie) {
        throw new Error("No refresh token provided.");
      }
      const foundToken = await RefreshToken.findOne({ token: tokenFromCookie });
      if (!foundToken) throw new Error("Invalid refresh token!");
      // Check if expired
      if (foundToken.expiresAt < new Date()) {
        throw new Error("Refresh token expired!");
      }
      // Retrieve user
      const user = await User.findById(foundToken.userId);
      if (!user) throw new Error("User not found!");
      // Generate a fresh access token
      const newAccessToken = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );
      return { accessToken: newAccessToken };
    },

    updateUserRole: async (_, { userId, role }, { req }) => {
      //   console.log(userId, "userid here");

      if (!req.userId) throw new Error("Not authenticated!");
      const currentUser = await User.findById(req.userId);
      checkRole(currentUser, ["admin"]); // Only admin can update roles

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      );
      if (!user) throw new Error("User not found.");
      await logEvent("UPDATE_USER_ROLE", req.userId, {
        targetUserId: userId,
        newRole: role,
      });
      await logEvent("UPDATE_USER_ROLE", req.userId, {
        targetUserId: userId,
        newRole: role,
      });
      return user;
    },
    // Admin-only: Delete a user
    deleteUser: async (_, { userId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      const currentUser = await User.findById(req.userId);
      checkRole(currentUser, ["admin"]); // Only admin can delete users

      await User.findByIdAndDelete(userId);
      await logEvent("DELETE_USER", req.userId, { targetUserId: userId });
      return "User deleted successfully.";
    },
    socialLogin: async (_, { provider, token }, { req, res }) => {
      let payload;
      if (provider === "google") {
        // Verify the token from Google Identity Services
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        throw new Error("Unsupported provider.");
      }

      // Use the payload to find or create a user in your database.
      const email = payload.email;
      let user = await User.findOne({ email });
      if (!user) {
        // Create new user if they don't exist.
        user = await User.create({
          username: payload.name || email.split("@")[0],
          email: email,
          passwordHash: await hashPassword(dummyPassword), // Social login users don't have a password
          role: "user",
          isVerified: true, // They are verified via Google
        });
      }
      // Generate JWT tokens (access & refresh)
      const { accessToken, refreshToken } = await generateTokens(user);
      // Set the access token in an HTTP-only cookie
      // console.log("Access token:", accessToken);
      // console.log(
      //   "Response object:",
      //   res?.cookie ? "OK" : "Missing res.cookie"
      // );

      res.cookie("token", accessToken, {
        httpOnly: true,
        secure: false,
        domain: "localhost",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
        path: "/",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        domain: "localhost",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
        path: "/",
      });
      // Set the refresh token as an HTTP-only cookie as well

      await logEvent("SOCIAL_LOGIN", user._id, { email });
      return { accessToken, refreshToken, user };
    },
    createOrganization: async (_, { name }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      const user = await User.findById(req.userId);
      // Create organization with the current user as owner/admin
      const organization = await Organization.create({
        name,
        owner: req.userId,
        members: [req.userId],
        createdAt: new Date().toISOString(),
      });
      // Optionally, update the user's organization reference
      user.organization = organization.id;
      await user.save();
      return organization;
    },
    addOrganizationMember: async (_, { orgId, memberEmail, role }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");

      // Verify the requester is admin in the organization
      const currentUser = await User.findById(req.userId);
      if (
        !currentUser.organizationId ||
        currentUser.organizationId.toString() !== orgId
      )
        throw new Error("You do not belong to this organization.");
      if (currentUser.role !== "admin")
        throw new Error("Only admin can add members.");

      // Find the user to add
      const memberUser = await User.findOne({ email: memberEmail });
      if (!memberUser) throw new Error("User not found.");

      const organization = await Organization.findById(orgId);
      if (!organization) throw new Error("Organization not found.");

      // Check if the user is already a member
      if (organization.members.includes(memberUser._id))
        throw new Error("User is already a member.");

      organization.members.push(memberUser._id);
      await organization.save();

      // Optionally, update the user's organizationId if they don't have one
      if (!memberUser.organizationId) {
        memberUser.organizationId = orgId;
        // Optionally, update the user's role if needed
        memberUser.role = role || "member";
        await memberUser.save();
      }
      return organization;
    },

    removeOrganizationMember: async (_, { orgId, userId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");

      // Ensure the requester is an admin of the organization
      const currentUser = await User.findById(req.userId);
      if (
        !currentUser.organizationId ||
        currentUser.organizationId.toString() !== orgId
      )
        throw new Error("You do not belong to this organization.");
      if (currentUser.role !== "admin")
        throw new Error("Only admin can remove members.");

      const organization = await Organization.findById(orgId);
      if (!organization) throw new Error("Organization not found.");

      // Remove the member
      organization.members = organization.members.filter(
        (memberId) => memberId.toString() !== userId
      );
      await organization.save();

      // Optionally, update the user's organizationId if it matches
      const member = await User.findById(userId);
      if (
        member &&
        member.organizationId &&
        member.organizationId.toString() === orgId
      ) {
        member.organizationId = null;
        await member.save();
      }
      return organization;
    },
    switchOrganization: async (_, { orgId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");

      // Check if the user is a member of the organization
      const organization = await Organization.findById(orgId);
      if (!organization) throw new Error("Organization not found.");
      if (
        !organization.members.some(
          (memberId) => memberId.toString() === req.userId
        )
      )
        throw new Error("You are not a member of this organization.");

      // Update user's primary organization
      const user = await User.findById(req.userId);
      user.organizationId = orgId;
      await user.save();
      return organization;
    },

    createApiKey: async (_, __, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // Generate a new random API key
      const key = crypto.randomBytes(32).toString("hex");
      const apiKey = await ApiKey.create({ key, userId: req.userId });
      return apiKey;
    },
    revokeApiKey: async (_, { apiKeyId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // Only allow revoking keys that belong to the current user
      const apiKey = await ApiKey.findOne({
        _id: apiKeyId,
        userId: req.userId,
      });
      if (!apiKey) throw new Error("API Key not found or not owned by you.");
      apiKey.revoked = true;
      await apiKey.save();
      return "API Key revoked successfully.";
    },

    addAppMember: async (_, { appId, memberEmail, role }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // Verify that the requester owns the app or is allowed to add members
      const app = await App.findOne({ _id: appId, owner: req.userId });
      if (!app) throw new Error("App not found or not owned by you.");

      // Find the user to add
      const memberUser = await User.findOne({ email: memberEmail });
      if (!memberUser) throw new Error("User not found.");

      // Initialize members if undefined
      if (!app.members) app.members = [];
      // Check if the member is already added
      const exists = app.members.some(
        (m) => m.user.toString() === memberUser._id.toString()
      );
      if (exists) throw new Error("User is already a member of this app.");

      app.members.push({ user: memberUser._id, role: role || "member" });
      await app.save();
      return app;
    },

    createApp: async (_, { name, description, orgId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // If orgId is provided, verify that the current user belongs to that organization
      if (orgId) {
        const org = await Organization.findById(orgId);
        if (!org || !org.members.includes(req.userId)) {
          throw new Error("Organization not found or you are not a member.");
        }
      }
      const newApp = await App.create({
        name,
        description,
        owner: req.userId,
        organization: orgId || null,
      });
      return newApp;
    },
    removeAppMember: async (_, { appId, userId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // Verify requester is the app owner
      const app = await App.findOne({ _id: appId, owner: req.userId });
      if (!app) throw new Error("App not found or not owned by you.");

      if (!app.members) throw new Error("No members in the app.");

      app.members = app.members.filter((m) => m.user.toString() !== userId);
      await app.save();
      return app;
    },
    updateAppMemberRole: async (_, { appId, userId, role }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // Verify requester is the app owner
      const app = await App.findOne({ _id: appId, owner: req.userId });
      if (!app) throw new Error("App not found or not owned by you.");

      if (!app.members) throw new Error("No members in the app.");

      const member = app.members.find((m) => m.user.toString() === userId);
      if (!member) throw new Error("Member not found in this app.");

      member.role = role;
      await app.save();
      return app;
    },

    updateApp: async (_, { appId, name, description }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      const app = await App.findOne({ _id: appId, owner: req.userId });
      if (!app) throw new Error("App not found or not owned by you.");
      if (name) app.name = name;
      if (description) app.description = description;
      await app.save();
      return app;
    },
    deleteApp: async (_, { appId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      const app = await App.findOneAndDelete({ _id: appId, owner: req.userId });
      if (!app) throw new Error("App not found or not owned by you.");
      return "App deleted successfully.";
    },
    createApiKey: async (_, { appId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // Verify the app belongs to the current user
      const app = await App.findOne({ _id: appId, owner: req.userId });
      if (!app) throw new Error("App not found or not owned by you.");
      // Generate a random API key
      const key = crypto.randomBytes(32).toString("hex");
      const apiKey = await ApiKey.create({ key, appId });
      return apiKey;
    },
    revokeApiKey: async (_, { apiKeyId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // Find the API key and ensure its app belongs to the current user
      const apiKey = await ApiKey.findById(apiKeyId);
      if (!apiKey) throw new Error("API Key not found.");
      const app = await App.findOne({ _id: apiKey.appId, owner: req.userId });
      if (!app)
        throw new Error("You do not have permission to revoke this API Key.");
      apiKey.revoked = true;
      await apiKey.save();
      return "API Key revoked successfully.";
    },
  },
};
