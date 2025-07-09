const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("apollo-server-express");
const { PubSub } = require("graphql-subscriptions");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const schema = require("./src/graphql/schema");
const cookieParser = require("cookie-parser");

// Load environment variables first
dotenv.config();

// Startup validation
console.log("🚀 Starting Auth-SaaS Backend...");
console.log("📋 Environment Check:");
console.log("  - NODE_ENV:", process.env.NODE_ENV || "development");
console.log("  - PORT:", process.env.PORT || 4000);
console.log(
  "  - MONGODB_URI:",
  process.env.MONGODB_URI ? "✅ Set" : "❌ Missing"
);
console.log(
  "  - JWT_SECRET:",
  process.env.JWT_SECRET ? "✅ Set" : "❌ Missing"
);
console.log(
  "  - GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing"
);
console.log(
  "  - EMAIL_USER:",
  process.env.EMAIL_USER ? "✅ Set" : "❌ Missing"
);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://studio.apollographql.com",
];
const authMiddleware = require("./src/middleware/authMiddleware");
const {
  loginLimiter,
  resetPasswordLimiter,
} = require("./src/middleware/rateLimiter");
const User = require("./src/models/User");

const startServer = async () => {
  const app = express();
  const pubsub = new PubSub();

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl requests, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
          return callback(null, true);
        } else {
          return callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );
  app.use(cookieParser());
  // Global limiter for all requests (increase overall limit to avoid interfering with normal operations)
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increase overall request limit
    message: "Too many requests. Try again later.",
  });
  app.use(globalLimiter);

  // Apply authentication middleware (attaches req.userId if token is provided)
  app.use(authMiddleware);

  // Apply rate limiters only to specific operations (login and requestPasswordReset)
  app.use("/graphql", (req, res, next) => {
    // Check if the GraphQL operation is 'login'
    if (req.body && req.body.operationName === "login") {
      return loginLimiter(req, res, next);
    }
    // Check if the GraphQL operation is 'requestPasswordReset'
    if (req.body && req.body.operationName === "requestPasswordReset") {
      return resetPasswordLimiter(req, res, next);
    }
    next();
  });

  const server = new ApolloServer({
    schema,
    context: async ({ req, res }) => {
      let user = null;
      if (req.userId) {
        try {
          user = await User.findById(req.userId);
        } catch (error) {
          console.error("Error fetching user for context:", error);
        }
      }
      return { req, res, pubsub, user };
    },
  });

  await server.start();
  server.applyMiddleware({ app, cors: false });

  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("💾 Connected to MongoDB successfully");

      app.listen({ port: process.env.PORT || 4000 }, () => {
        console.log(
          `🚀 Server ready at http://localhost:${process.env.PORT || 4000}${server.graphqlPath}`
        );
        console.log("📡 GraphQL Playground available for testing");
        console.log("🔐 Social login with Google is configured");
        console.log("✨ Backend startup complete!");
      });
    })
    .catch((err) => {
      console.error("❌ Failed to connect to MongoDB:", err.message);
      process.exit(1);
    });
};

startServer();
