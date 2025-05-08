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
const OrgInvitation = require("../models/OrgInvitation");
const OrgMembership = require("../models/OrgMembership");
const AppMembership = require("../models/AppMembership");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const dummyPassword = process.env.DUMMY_PASSWORD || "defaultDummyPassword123!";

module.exports = {
  JSON: GraphQLJSON,
  Query: {
    me: async (_, __, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      const user = await User.findById(req.userId);
      if (user.organizationId) {
        // fetch their membership in that org
        const membership = await OrgMembership.findOne({
          user: user._id,
          org: user.organizationId,
        });
        // override the returned role
        user.role = membership?.role || user.role;
      }
      return user;
    },
    myInvitations: async (_, __, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // load your user to get their email
      const user = await User.findById(req.userId);

      // find all outstanding invites sent to them, and populate the `appId` ref
      const invites = await Invitation.find({
        email: user.email,
        used: false,
      })
        .sort({ createdAt: -1 })
        .populate("appId"); // ← populate here

      return invites.map((inv) => {
        // inv.appId is now a full App document
        const app = inv.appId;
        return {
          id: inv._id.toString(), // non-nullable ID
          email: inv.email,
          appId: app._id.toString(), // raw ID if you need it
          role: inv.role,
          token: inv.token,
          used: inv.used,
          createdAt: inv.createdAt.toISOString(),
          expiresAt: inv.expiresAt.toISOString(),
          app: {
            id: app._id.toString(),
            name: app.name,
            description: app.description,
            owner: app.owner, // or pick whichever fields you need
            createdAt: app.createdAt.toISOString(),
            // …any other App fields your SDL exposes…
          },
        };
      });
    },
    orgInvitations: async (_, { orgId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // 1) ensure the org exists and you belong
      const org = await Organization.findById(orgId);
      if (!org) throw new Error("Organization not found.");
      if (!org.members.includes(req.userId)) {
        throw new Error("You’re not a member of that org.");
      }

      // 2) load the invites
      const invites = await OrgInvitation.find({ orgId, used: false }).sort({
        createdAt: -1,
      });

      // 3) map into the shape your schema expects (non-nullable fields)
      return invites.map((inv) => ({
        id: inv._id.toString(),
        email: inv.email,
        role: inv.role,
        createdAt: inv.createdAt.toISOString(),
        expiresAt: inv.expiresAt.toISOString(),
      }));
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

      let filter;
      if (orgId === "personal" || !orgId) {
        // personal workspace: anything you own or are a member of
        filter = {
          $or: [
            { owner: req.userId },
            { "members.user": req.userId }, // AppMembership
          ],
        };
      } else {
        // an org-scoped workspace
        const org = await Organization.findById(orgId);
        if (!org) throw new Error("Organization not found.");

        const isOrgMember = org.members.includes(req.userId);
        // also allow if they have an AppMembership *in* that org:
        const invitedViaApp = await AppMembership.exists({
          user: req.userId,
          app: {
            $in: await App.find({ organizationId: orgId }).distinct("_id"),
          },
        });

        if (!isOrgMember && !invitedViaApp) {
          throw new Error("Organization not found or you are not a member.");
        }

        filter = { organizationId: orgId };
      }

      const apps = await App.find(filter)
        .populate("owner")
        .populate("members.user");

      // drop any stale member slots
      apps.forEach((app) => {
        if (Array.isArray(app.members)) {
          app.members = app.members.filter((m) => m.user != null);
        }
      });

      return apps;
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
    orgMembers: async (_, { orgId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");

      // 1) Load the org itself
      const org = await Organization.findById(orgId);
      if (!org) throw new Error("Organization not found.");
      if (!org.members.includes(req.userId))
        throw new Error("You’re not a member of that org.");

      // 2) Fetch the owner once
      const owner = await User.findById(org.owner);

      // 3) Load all memberships for this org
      const memberships = await OrgMembership.find({ org: orgId }).populate(
        "user"
      );

      // 4) Filter out the owner from the membership list
      const members = memberships
        .filter((m) => m.user._id.toString() !== org.owner.toString())
        .map((m) => ({
          user: m.user,
          role: m.role,
        }));

      // 5) Return one owner + the rest of the members
      return { owner, members };
    },

    userOrganizations: async (_, __, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");

      // find all orgs this user belongs to
      const orgs = await Organization.find({ members: req.userId }).populate(
        "owner"
      );

      // for each org, fetch *its* membership rows
      const results = await Promise.all(
        orgs.map(async (org) => {
          // <-- filter by org._id, not req.userId
          const mems = await OrgMembership.find({ org: org._id }).populate(
            "user"
          );

          return {
            id: org._id.toString(),
            name: org.name,
            owner: org.owner,
            createdAt: org.createdAt,
            imageUrl: org.imageUrl,
            members: mems.map((m) => ({
              user: m.user,
              role: m.role,
            })),
          };
        })
      );

      return results;
    },

    // (optional) fetch only the org the user belongs to
  },
  Organization: {
    members: async (org) => {
      // `org` is the Mongoose doc returned by find()
      const mems = await OrgMembership.find({ org: org._id }).populate("user");
      return mems.map((m) => ({
        user: m.user,
        role: m.role,
      }));
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
      await OrgMembership.create({
        user: user._id,
        org: organization._id,
        role: "admin",
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
      // 1) consume the one-time invitation
      const invite = await Invitation.findOneAndUpdate(
        { token, used: false, expiresAt: { $gt: new Date() } },
        { $set: { used: true } },
        { new: true }
      );
      if (!invite) throw new Error("Invalid or expired invitation.");

      // 2) lookup or create the user
      let user = await User.findOne({ email: invite.email });
      if (!user) {
        if (!username || !password) {
          throw new Error("Must supply username and password to sign up.");
        }
        const passwordHash = await hashPassword(password);
        user = await User.create({
          username,
          email: invite.email,
          passwordHash,
          accountType: "personal",
        });

        // create their personal org
        const personalOrg = await Organization.create({
          name: `${username}'s Personal Workspace`,
          owner: user._id,
          members: [user._id],
          createdAt: new Date().toISOString(),
        });
        user.organizationId = personalOrg._id;
        await user.save();

        // record personal org membership
        await OrgMembership.create({
          user: user._id,
          org: personalOrg._id,
          role: "admin",
        });
      }

      // 3) create the app-level membership if needed
      const existingAppMember = await AppMembership.findOne({
        user: user._id,
        app: invite.appId,
      });
      if (!existingAppMember) {
        // a) record it in the AppMembership collection
        await AppMembership.create({
          user: user._id,
          app: invite.appId,
          role: invite.role, // "member" or "admin"
        });

        // b) also mirror it into App.members so queries like .populate("members.user") see it
        await App.findByIdAndUpdate(invite.appId, {
          $addToSet: {
            members: { user: user._id, role: invite.role },
          },
        });
      }

      // 4) look up the app so we can get its true owning org
      const app = await App.findById(invite.appId);
      if (!app) throw new Error("App not found.");

      // 5) find (or recreate) their personal org reference
      const personal = await Organization.findOne({ owner: user._id });
      if (!personal) {
        throw new Error("Personal workspace not found for this user.");
      }
      const personalOrgId = personal._id.toString();

      // 6) issue tokens
      const { accessToken, refreshToken } = await generateTokens(user);
      res.cookie("token", accessToken, { httpOnly: true, path: "/" });
      res.cookie("refreshToken", refreshToken, { httpOnly: true, path: "/" });

      // 7) return payload
      return {
        accessToken,
        refreshToken,
        user,
        appId: invite.appId.toString(),
        organizationId: personalOrgId,
      };
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
        await OrgMembership.create({
          user: user._id,
          org: personalOrg._id,
          role: "admin",
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
      await OrgMembership.create({
        user: req.userId,
        org: organization._id,
        role: "admin",
      });
      // Optionally, update the user's organization reference
      user.organization = organization.id;
      await user.save();

      return organization;
    },
    inviteOrganizationMember: async (_, { orgId, email, role }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      // 1) verify req.userId is admin of orgId
      const org = await Organization.findById(orgId);
      if (!org || org.owner.toString() !== req.userId)
        throw new Error("Only the org owner can invite.");
      const invitee = await User.findOne({ email });
      if (invitee) {
        const existing = await OrgMembership.findOne({
          user: invitee._id,
          org: orgId,
        });
        if (existing)
          throw new Error("This user is already in the organization");
      }
      // 2) create invite
      const token = crypto.randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 48 * 3600 * 1000); // 48h
      const invite = await OrgInvitation.create({
        email: email.toLowerCase(),
        orgId,
        role,
        token,
        expiresAt,
      });

      // 3) send email
      const link = `${process.env.FRONTEND_URL}/accept-org?token=${token}`;
      await sendEmail(
        email,
        "You’ve been invited to join our organization!",
        `Click to accept: ${link}\n\nExpires in 48h.`
      );

      return invite;
    },
    cancelOrgInvitation: async (_, { inviteId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");
      const invite = await OrgInvitation.findById(inviteId);
      if (!invite) throw new Error("Not found.");
      // only owner or same org admin can cancel
      const org = await Organization.findById(invite.orgId);
      if (org.owner.toString() !== req.userId) throw new Error("Not allowed.");
      await invite.remove();
      return "Cancelled";
    },
    acceptOrganizationInvite: async (
      _,
      { token, username, password },
      { req, res }
    ) => {
      // 1) consume the invite
      const invite = await OrgInvitation.findOneAndUpdate(
        { token, used: false, expiresAt: { $gt: new Date() } },
        { $set: { used: true } },
        { new: true }
      );
      if (!invite) throw new Error("Invalid or expired invite token.");

      // 2) lookup or create the user
      let user = await User.findOne({ email: invite.email });
      if (!user) {
        if (!username || !password) {
          throw new Error("Must supply username and password to register.");
        }
        const passwordHash = await hashPassword(password);
        user = await User.create({
          username,
          email: invite.email,
          passwordHash,
          accountType: "personal",
          // you can set a default role here if you like
        });

        // create their personal org
        const personal = await Organization.create({
          name: `${username}'s Organization`,
          owner: user._id,
          members: [user._id],
          createdAt: new Date().toISOString(),
        });

        user.organizationId = personal._id;
        await user.save();

        // record membership
        await OrgMembership.create({
          user: user._id,
          org: personal._id,
          role: "admin",
        });
      }

      // 3) scoped org‐invite membership
      const existing = await OrgMembership.findOne({
        user: user._id,
        org: invite.orgId,
      });
      if (!existing) {
        await OrgMembership.create({
          user: user._id,
          org: invite.orgId,
          role: invite.role,
        });

        // ←─── ensure the Organization.members array includes them ────→
        await Organization.findByIdAndUpdate(invite.orgId, {
          $addToSet: { members: user._id },
        });
      }

      // 4) switch their “current” org to the invited one
      user.organizationId = invite.orgId;
      await user.save();

      // 5) issue tokens & set cookies
      const { accessToken, refreshToken } = await generateTokens(user);
      res.cookie("token", accessToken, { httpOnly: true, path: "/" });
      res.cookie("refreshToken", refreshToken, { httpOnly: true, path: "/" });

      return {
        accessToken,
        refreshToken,
        user,
      };
    },
    removeOrganizationMember: async (_, { orgId, userId }, { req }) => {
      if (!req.userId) throw new Error("Not authenticated!");

      // 1) You can’t remove yourself
      if (userId === req.userId) {
        throw new Error("You cannot remove yourself from the organization.");
      }

      // 2) Verify the caller is an admin of this org
      const callerMembership = await OrgMembership.findOne({
        user: req.userId,
        org: orgId,
      });
      if (!callerMembership || callerMembership.role !== "admin") {
        throw new Error("Only org admins can remove members.");
      }

      // 3) Fetch the target’s membership to see their role
      const targetMembership = await OrgMembership.findOne({
        user: userId,
        org: orgId,
      });
      if (!targetMembership) {
        throw new Error("That user is not a member of this organization.");
      }

      // 4) If they’re an admin, make sure there is at least one other admin
      if (targetMembership.role === "admin") {
        const adminCount = await OrgMembership.countDocuments({
          org: orgId,
          role: "admin",
        });
        if (adminCount <= 1) {
          throw new Error(
            "Cannot remove the last admin — there must be at least one."
          );
        }
      }

      // 5) Now, proceed with removal...
      const organization = await Organization.findById(orgId);
      if (!organization) throw new Error("Organization not found.");

      // • remove from the org.members array
      organization.members = organization.members.filter(
        (m) => m.toString() !== userId
      );
      await organization.save();

      // • delete their membership record
      await OrgMembership.deleteOne({ user: userId, org: orgId });

      // • delete any pending invites for their email
      const memberUser = await User.findById(userId);
      if (memberUser?.email) {
        await OrgInvitation.deleteMany({
          orgId,
          email: memberUser.email.toLowerCase(),
        });
      }

      // • if this was their current org, clear it
      if (memberUser && memberUser.organizationId?.toString() === orgId) {
        memberUser.organizationId = null;
        await memberUser.save();
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
      await AppMembership.create({
        user: req.userId,
        app: newApp._id,
        role: "owner",
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
