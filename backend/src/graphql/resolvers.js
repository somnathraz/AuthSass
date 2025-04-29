// graphql/resolvers.js
const User = require("../models/User");
const Invitation = require("../models/Invitation");
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
    myInvitations: async (_, __, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // load your user to get their email
      const user = await User.findById(req.userId);
      // find all outstanding invites sent to them
      const invites = await Invitation.find({
        email: user.email,
        used: false,
      }).sort({ createdAt: -1 });

      // populate each invite.app field
      return Promise.all(
        invites.map(async (inv) => {
          await inv.populate("appId"); // or a virtual field: inv.app = await App.findById(inv.appId)
          return {
            ...inv.toObject(),
            app: inv.appId,
          };
        })
      );
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
    myApps: async (_, { orgId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");

      let organizationField;
      if (orgId === "personal" || !orgId) {
        const me = await User.findById(req.userId);
        organizationField = me.organizationId;
      } else {
        const org = await Organization.findById(orgId);
        if (!org || !org.members.includes(req.userId)) {
          throw new Error("Organization not found or you are not a member.");
        }
        organizationField = orgId;
      }

      return await App.find({ organizationId: organizationField })
        .populate("owner") // <— now owner is a full User doc
        .populate("members.user"); // <— and each member.user is a full User doc
    },
    invitations: async (_, { appId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // Optionally, check that req.userId is allowed to invite for this app
      return await Invitation.find({ appId, used: false }).sort({
        createdAt: -1,
      });
    },

    listApiKeys: async (_, { appId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // Optionally, verify that the app belongs to the user.
      const app = await App.findOne({ _id: appId, owner: req.userId });
      if (!app) throw new Error("App not found or not owned by you.");
      return await ApiKey.find({ appId });
    },
    // fetch every organization in the DB
    allOrganizations: async (_, __, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      const currentUser = await User.findById(req.userId);
      checkRole(currentUser, ["admin"]); // Only admin can view audit logs
      return await Organization.find({});
    },
    userOrganizations: async (_, __, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");

      // Find all orgs where the current user is in `members`
      // and populate both `owner` and `members` to full User docs.
      return await Organization.find({ members: req.userId })
        .populate("owner")
        .populate("members");
    },
    // (optional) fetch only the org the user belongs to
    organization: async (_, __, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      const user = await User.findById(req.userId);
      if (!user.organizationId) return null;
      return await Organization.findById(user.organizationId);
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
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
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
      return {
        accessToken,
        refreshToken,
        user,
        requirePasswordReset: user.requirePasswordReset,
      };
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
    adminCreateUser: async (_, { appId, email, role }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // TODO: check req.userId can admin this app

      // generate a random temp password
      const tempPass = crypto.randomBytes(4).toString("hex"); // e.g. 'a1b2c3d4'
      const passwordHash = await hashPassword(tempPass);

      // create user
      // create user (accountType personal)
      const user = await User.create({
        username: email.split("@")[0],
        email,
        passwordHash,
        role: "user",
        accountType: "personal",
        requirePasswordReset: true,
      });

      // create their personal organization
      const personalOrg = await Organization.create({
        name: `${user.username}'s Organization`,
        owner: user._id,
        members: [user._id],
      });
      user.organizationId = personalOrg._id;
      await user.save();
      // add to app
      const app = await App.findById(appId);
      app.members.push({ user: user._id, role });
      await app.save();
      const baseUrl = process.env.FRONTEND_URL;
      const loginLink = `${baseUrl}/login`;
      const resetLink = `${baseUrl}/reset-password`;

      // email them
      await sendEmail(
        email,
        "🎉 Your new account is ready",
        [
          `Hello! An account has been created for you on OurApp.`,
          ``,
          `• Email: ${email}`,
          `• Temporary password: ${tempPass}`,
          ``,
          `Please click here to log in:`,
          `  ${loginLink}`,
          ``,
          `On first login you will be prompted to set a new password.  Or you can go directly to:`,
          `  ${resetLink}`,
          ``,
          `Thanks,`,
          `The OurApp Team`,
        ].join("\n")
      );

      return user;
    },
    changePassword: async (_, { newPassword }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      const user = await User.findById(req.userId);
      user.passwordHash = await hashPassword(newPassword);
      user.requirePasswordReset = false;
      await user.save();
      return "Password changed successfully.";
    },
    // 1) Admin invites someone:
    inviteUser: async (_, { appId, email, role }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // TODO: check that req.userId may administer this app

      // Generate a one-time token:
      const token = crypto.randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      const invite = await Invitation.create({
        email,
        appId,
        role,
        token,
        expiresAt,
      });

      // Send the same magic link whether or not the user exists:
      const baseUrl = process.env.FRONTEND_URL;
      const link = `${baseUrl}/accept-invite?token=${invite.token}`;

      await sendEmail(
        email,
        "You’ve been invited to join OurApp!",
        [
          `Hi there!`,
          ``,
          `You (or someone with this address) have been invited to join OurApp as a ${role}.`,
          `Please click the link below to either sign up or join the app directly:`,
          ``,
          `  ${link}`,
          ``,
          `This link expires in 24 hours.`,
          ``,
          `Cheers,`,
          `The OurApp Team`,
        ].join("\n")
      );

      return invite;
    },
    cancelInvitation: async (_, { inviteId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated");
      const invite = await Invitation.findById(inviteId);
      if (!invite) throw new Error("Invitation not found");
      // optional: check that req.userId is allowed to cancel
      await invite.remove();
      return "Invitation cancelled";
    },
    // 2) Invitee hits link & submits their creds:
    acceptInvite: async (_, { token, username, password }, { req, res }) => {
      const invite = await Invitation.findOne({ token });
      if (!invite || invite.used || invite.expiresAt < new Date()) {
        throw new Error("Invalid or expired invitation.");
      }

      // Check if a User already exists with that email:
      let user = await User.findOne({ email: invite.email });

      if (!user) {
        // a) create new user
        const passwordHash = await hashPassword(password);
        user = await User.create({
          username,
          email: invite.email,
          passwordHash,
          role: "user",
          accountType: "personal",
        });
      }
      // a) create new user (personal account)
      const passwordHash = await hashPassword(password);
      user = await User.create({
        username,
        email: invite.email,
        passwordHash,
        role: "user",
        accountType: "personal",
      });

      // b) create their personal organization
      const personalOrg = await Organization.create({
        name: `${user.username}'s Organization`,
        owner: user._id,
        members: [user._id],
      });
      user.organizationId = personalOrg._id;
      await user.save();
      // b) mark invitation used
      invite.used = true;
      await invite.save();

      // c) attach user to the app if not already a member
      const app = await App.findById(invite.appId).populate("members.user");
      const alreadyMember = app.members.some((m) => m.user.id === user.id);
      if (!alreadyMember) {
        app.members.push({ user: user._id, role: invite.role });
        await app.save();
      }

      // d) issue tokens + cookies
      const { accessToken, refreshToken } = await generateTokens(user);
      res.cookie("token", accessToken, { httpOnly: true, path: "/" });
      res.cookie("refreshToken", refreshToken, { httpOnly: true, path: "/" });

      return { accessToken, refreshToken, user };
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
        // 1) Verify the token from Google
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        throw new Error("Unsupported provider.");
      }

      const email = payload.email;
      const username = payload.name || email.split("@")[0];

      // 2) Find or create the user
      let user = await User.findOne({ email });
      if (!user) {
        // a) create the user
        user = await User.create({
          username,
          email,
          passwordHash: await hashPassword(dummyPassword),
          role: "user",
          isVerified: true,
          accountType: "personal",
        });

        // b) create their “personal” organization
        const personalOrg = await Organization.create({
          name: `${username}'s Personal Workspace`,
          owner: user._id,
          members: [user._id],
          createdAt: new Date().toISOString(),
        });

        // c) save it on the user
        user.organizationId = personalOrg._id;
        await user.save();
      }

      // 3) Generate tokens
      const { accessToken, refreshToken } = await generateTokens(user);

      // 4) Set cookies
      res.cookie("token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        domain: "localhost",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
        path: "/",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        domain: "localhost",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
        path: "/",
      });

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

    // createApp: async (_, { name, description, orgId }, { req }) => {
    //   if (!req.userId) throw new Error("Not authenticated!");
    //   // If orgId is provided, verify that the current user belongs to that organization
    //   if (orgId) {
    //     const org = await Organization.findById(orgId);
    //     if (!org || !org.members.includes(req.userId)) {
    //       throw new Error("Organization not found or you are not a member.");
    //     }
    //   }
    //   const newApp = await App.create({
    //     name,
    //     description,
    //     owner: req.userId,
    //     organization: orgId || null,
    //   });
    //   return newApp;
    // },
    createApp: async (_, { name, description, orgId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");

      // load the user so we can read their personal org
      const user = await User.findById(req.userId);
      if (!user.organizationId) {
        throw new Error("No personal organization found on your account.");
      }

      let organizationField;
      if (orgId === "personal" || !orgId) {
        const me = await User.findById(req.userId);
        if (!me.organizationId) {
          throw new Error("No personal organization found for user.");
        }
        organizationField = me.organizationId;
      } else {
        // org‑scoped
        const org = await Organization.findById(orgId);
        if (!org || !org.members.includes(req.userId)) {
          throw new Error("Organization not found or you are not a member.");
        }
        organizationField = orgId;
      }

      const newApp = await App.create({
        name,
        description,
        owner: req.userId,
        organizationId: organizationField, // <— note the property name
        createdAt: new Date().toISOString(),
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
