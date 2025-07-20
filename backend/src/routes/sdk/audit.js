const express = require("express");
const router = express.Router();
const { auditApplicationLog } = require("../../utils/audit");
const { validateSDKToken } = require("../../middleware/authMiddleware");

/**
 * SDK Audit Endpoint
 * Receives authentication events from Webflow and WordPress SDKs
 * and logs them to the APPLICATION tier audit system
 */

// Middleware to authenticate SDK requests
const authenticateSDK = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate the SDK token (app secret key)
    const app = await validateSDKToken(token);
    if (!app) {
      return res.status(401).json({
        success: false,
        error: "Invalid SDK token",
      });
    }

    // Attach app info to request
    req.sdk = {
      appId: app._id,
      customerId: app.organizationId,
      appName: app.name,
    };

    next();
  } catch (error) {
    console.error("SDK authentication error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
};

/**
 * POST /sdk/audit
 * Log authentication events from SDKs
 */
router.post("/audit", authenticateSDK, async (req, res) => {
  try {
    const { eventType, userId, metadata } = req.body;
    const { appId, customerId } = req.sdk;

    // Validate required fields
    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: "eventType is required",
      });
    }

    // Prepare audit log data
    const auditData = {
      eventType,
      customerId,
      applicationId: appId,
      performedBy: userId || null,
      actorType: userId ? "END_USER" : "SYSTEM",
      metadata: {
        ...metadata,
        sdkVersion: metadata?.sdkVersion || "1.0.0",
        platform: metadata?.platform || "unknown",
        timestamp: new Date().toISOString(),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      },
    };

    // Log to APPLICATION tier
    await auditApplicationLog(
      eventType,
      customerId,
      appId,
      userId,
      auditData.metadata
    );

    console.log(`SDK Audit Log: ${eventType} for app ${appId}`, {
      userId,
      platform: metadata?.platform,
      success: metadata?.success,
    });

    res.json({
      success: true,
      message: "Audit event logged successfully",
    });
  } catch (error) {
    console.error("SDK audit logging error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to log audit event",
    });
  }
});

/**
 * GET /sdk/health
 * Health check endpoint for SDKs
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SDK audit endpoint is healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

/**
 * POST /sdk/validate
 * Validate SDK token and return app info
 */
router.post("/validate", authenticateSDK, (req, res) => {
  const { appId, customerId, appName } = req.sdk;

  res.json({
    success: true,
    app: {
      id: appId,
      name: appName,
      customerId,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
