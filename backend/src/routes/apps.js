const express = require("express");
const router = express.Router();
const App = require("../models/App");
const AuditLog = require("../models/AuditLog");
const { authMiddleware } = require("../middleware/authMiddleware");

// Check app connection status
router.get("/:appId/connection-status", authMiddleware, async (req, res) => {
  try {
    const { appId } = req.params;

    // Check if app exists
    const app = await App.findById(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: "App not found",
      });
    }

    // Check if there are any authentication requests from this app
    const firstRequest = await AuditLog.findOne({
      applicationId: appId,
      eventType: {
        $in: [
          "USER_LOGIN_ATTEMPT",
          "USER_LOGIN_SUCCESS",
          "USER_SIGNUP_ATTEMPT",
          "USER_SIGNUP_SUCCESS",
          "MAGIC_LINK_SENT",
          "PASSWORD_RESET_REQUEST",
        ],
      },
    }).sort({ createdAt: 1 });

    // Check for recent activity (last 24 hours)
    const recentActivity = await AuditLog.findOne({
      applicationId: appId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    // Count total requests
    const totalRequests = await AuditLog.countDocuments({
      applicationId: appId,
    });

    const isConnected = !!firstRequest;
    const lastRequestAt = firstRequest ? firstRequest.createdAt : null;

    // Update app integration status if connected
    if (isConnected && !app.integrationStatus?.isConnected) {
      await App.findByIdAndUpdate(appId, {
        $set: {
          "integrationStatus.isConnected": true,
          "integrationStatus.connectedAt": firstRequest.createdAt,
          "integrationStatus.lastLoginAttempt":
            recentActivity?.createdAt || firstRequest.createdAt,
          "integrationStatus.totalLoginAttempts": totalRequests,
        },
      });
    }

    res.json({
      success: true,
      isConnected,
      lastRequestAt,
      totalRequests,
      app: {
        id: app._id,
        name: app.name,
        integrationStatus: app.integrationStatus,
      },
    });
  } catch (error) {
    console.error("Error checking app connection status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get app analytics
router.get("/:appId/analytics", authMiddleware, async (req, res) => {
  try {
    const { appId } = req.params;
    const { timeRange = "7d" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case "1h":
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get audit logs for this app in the time range
    const logs = await AuditLog.find({
      applicationId: appId,
      createdAt: { $gte: startDate },
    });

    // Calculate metrics
    const totalEvents = logs.length;
    const successfulLogins = logs.filter(
      (log) => log.eventType === "USER_LOGIN_SUCCESS"
    ).length;
    const failedLogins = logs.filter(
      (log) => log.eventType === "USER_LOGIN_FAILED"
    ).length;
    const signups = logs.filter(
      (log) => log.eventType === "USER_SIGNUP_SUCCESS"
    ).length;
    const magicLinks = logs.filter(
      (log) => log.eventType === "MAGIC_LINK_SENT"
    ).length;

    const successRate =
      totalEvents > 0
        ? Math.round(
            (successfulLogins / (successfulLogins + failedLogins)) * 100
          )
        : 0;

    // Get unique users
    const uniqueUsers = new Set(
      logs.filter((log) => log.actor?.id).map((log) => log.actor.id)
    ).size;

    res.json({
      success: true,
      analytics: {
        totalEvents,
        successfulLogins,
        failedLogins,
        signups,
        magicLinks,
        successRate,
        uniqueUsers,
        timeRange,
      },
    });
  } catch (error) {
    console.error("Error getting app analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update app integration status
router.post("/:appId/integration", authMiddleware, async (req, res) => {
  try {
    const { appId } = req.params;
    const {
      selectedTechnology,
      isCheckingConnection,
      isConnected,
      connectedAt,
      lastLoginAttempt,
      totalLoginAttempts,
    } = req.body;

    // Check if app exists
    const app = await App.findById(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: "App not found",
      });
    }

    // Update integration status
    const updateData = {};

    if (selectedTechnology !== undefined) {
      updateData["integrationStatus.selectedTechnology"] = selectedTechnology;
    }

    if (isCheckingConnection !== undefined) {
      updateData["integrationStatus.isCheckingConnection"] =
        isCheckingConnection;
    }

    if (isConnected !== undefined) {
      updateData["integrationStatus.isConnected"] = isConnected;
    }

    if (connectedAt !== undefined) {
      updateData["integrationStatus.connectedAt"] = connectedAt;
    }

    if (lastLoginAttempt !== undefined) {
      updateData["integrationStatus.lastLoginAttempt"] = lastLoginAttempt;
    }

    if (totalLoginAttempts !== undefined) {
      updateData["integrationStatus.totalLoginAttempts"] = totalLoginAttempts;
    }

    if (isCheckingConnection) {
      updateData["integrationStatus.checkStartedAt"] = new Date();
    }

    await App.findByIdAndUpdate(appId, {
      $set: updateData,
    });

    res.json({
      success: true,
      message: "Integration status updated successfully",
    });
  } catch (error) {
    console.error("Error updating integration status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get app data
router.get("/:appId", authMiddleware, async (req, res) => {
  try {
    const { appId } = req.params;

    // Check if app exists
    const app = await App.findById(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        message: "App not found",
      });
    }

    // Get analytics data directly (avoiding fetch in Node.js)
    let analytics = null;
    try {
      const { timeRange = "7d" } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate;
      switch (timeRange) {
        case "1h":
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case "24h":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get audit logs for this app in the time range
      const logs = await AuditLog.find({
        applicationId: appId,
        createdAt: { $gte: startDate },
      });

      // Calculate metrics
      const totalEvents = logs.length;
      const successfulLogins = logs.filter(
        (log) => log.eventType === "USER_LOGIN_SUCCESS"
      ).length;
      const failedLogins = logs.filter(
        (log) => log.eventType === "USER_LOGIN_FAILED"
      ).length;
      const signups = logs.filter(
        (log) => log.eventType === "USER_SIGNUP_SUCCESS"
      ).length;
      const magicLinks = logs.filter(
        (log) => log.eventType === "MAGIC_LINK_SENT"
      ).length;

      const successRate =
        totalEvents > 0
          ? Math.round(
              (successfulLogins / (successfulLogins + failedLogins)) * 100
            )
          : 0;

      // Get unique users
      const uniqueUsers = new Set(
        logs.filter((log) => log.actor?.id).map((log) => log.actor.id)
      ).size;

      analytics = {
        totalEvents,
        successfulLogins,
        failedLogins,
        signups,
        magicLinks,
        successRate,
        uniqueUsers,
        timeRange,
      };
    } catch (analyticsError) {
      console.error("Error calculating analytics:", analyticsError);
      // Continue without analytics
    }

    // Ensure integration status exists with fallbacks
    const safeIntegrationStatus = {
      isConnected: app.integrationStatus?.isConnected || false,
      selectedTechnology: app.integrationStatus?.selectedTechnology || null,
      connectedAt: app.integrationStatus?.connectedAt || null,
      lastLoginAttempt: app.integrationStatus?.lastLoginAttempt || null,
      totalLoginAttempts: app.integrationStatus?.totalLoginAttempts || 0,
      successfulLogins: app.integrationStatus?.successfulLogins || 0,
      isCheckingConnection:
        app.integrationStatus?.isCheckingConnection || false,
      checkStartedAt: app.integrationStatus?.checkStartedAt || null,
    };

    // Prepare app data with analytics
    const appData = {
      id: app._id,
      name: app.name || "My Awesome App",
      description:
        app.description || "A modern web application with authentication",
      status: app.status || "ACTIVE",
      type: app.type || "WEB",
      apiKey: `auth_sk_${app._id.toString().slice(-12)}`,
      domain: `https://${(app.name || "myapp").toLowerCase().replace(/\s+/g, "-")}.vercel.app`,
      members: app.members ? app.members.length : 0,
      totalUsers: analytics?.uniqueUsers || 0,
      activeUsers: analytics?.successfulLogins || 0,
      successRate: analytics?.successRate || 0,
      integrationStatus: safeIntegrationStatus,
    };

    res.json({
      success: true,
      app: appData,
    });
  } catch (error) {
    console.error("Error fetching app data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
