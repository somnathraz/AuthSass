const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const { generateAccessToken } = require("../utils/auth");

/**
 * Validate SDK token (app secret key)
 * Used by Webflow and WordPress SDKs
 */
const validateSDKToken = async (token) => {
  try {
    // Find app by secret key
    const App = require("../models/App");
    const app = await App.findOne({
      secretKey: token,
      status: "ACTIVE",
    }).populate("organizationId");

    if (!app) {
      return null;
    }

    return app;
  } catch (error) {
    console.error("SDK token validation error:", error);
    return null;
  }
};

const authMiddleware = async (req, res, next) => {
  console.log("Cookies:", req.cookies);

  // Check if this is a GraphQL request
  const isGraphQLRequest =
    req.path === "/graphql" || req.url.includes("/graphql");

  let token;
  if (req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
    console.log("Token from header:", token);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("Token from cookie:", token);
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("Decoded token:", decoded);
      req.userId = decoded.userId; // Ensure the token was signed with a `userId` field
      return next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        console.log("🔄 Token expired, attempting to refresh...");
        const refreshToken =
          req.headers["x-refresh-token"] || req.cookies.refreshToken;

        if (!refreshToken) {
          console.log("❌ No refresh token provided.");
          // For GraphQL requests, don't return 401 - let resolvers handle auth
          if (isGraphQLRequest) {
            console.log(
              "🎫 GraphQL request with expired token - allowing resolver to handle auth"
            );
            return next();
          }
          return res.status(401).json({ error: "Refresh token required." });
        }

        try {
          const storedToken = await RefreshToken.findOne({
            token: refreshToken,
          });
          if (!storedToken || storedToken.expiresAt < new Date()) {
            console.log("❌ Invalid or expired refresh token.");
            // For GraphQL requests, don't return 401 - let resolvers handle auth
            if (isGraphQLRequest) {
              console.log(
                "🎫 GraphQL request with invalid refresh token - allowing resolver to handle auth"
              );
              return next();
            }
            return res
              .status(401)
              .json({ error: "Refresh token invalid or expired." });
          }

          const user = await User.findById(storedToken.userId);
          if (!user) {
            console.log("❌ User not found for refresh token.");
            // For GraphQL requests, don't return 401 - let resolvers handle auth
            if (isGraphQLRequest) {
              console.log(
                "🎫 GraphQL request with user not found - allowing resolver to handle auth"
              );
              return next();
            }
            return res.status(401).json({ error: "User not found." });
          }

          const newAccessToken = generateAccessToken(user);
          console.log("✅ New access token generated!");
          res.setHeader("x-new-access-token", newAccessToken);
          // Optionally update the cookie as well:
          res.cookie("token", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: "lax",
            path: "/",
          });
          req.userId = user._id;
          return next();
        } catch (refreshError) {
          console.log("❌ Error during token refresh:", refreshError);
          // For GraphQL requests, don't return 401 - let resolvers handle auth
          if (isGraphQLRequest) {
            console.log(
              "🎫 GraphQL request with refresh error - allowing resolver to handle auth"
            );
            return next();
          }
          return res.status(401).json({ error: "Token refresh failed." });
        }
      }

      console.log("Invalid token:", err);
      // For GraphQL requests, don't return 401 - let resolvers handle auth
      if (isGraphQLRequest) {
        console.log(
          "🎫 GraphQL request with invalid token - allowing resolver to handle auth"
        );
        return next();
      }
      return res.status(401).json({ error: "Invalid token." });
    }
  }

  console.log("No token found");
  next();
};

module.exports = {
  authMiddleware,
  validateSDKToken,
};
