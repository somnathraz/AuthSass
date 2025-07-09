const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { env } = require('../utils/env');

/**
 * Basic health check endpoint
 */
const healthCheck = async (req, res) => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    node_version: process.version,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
    }
  };

  res.status(200).json(healthInfo);
};

/**
 * Detailed health check with dependencies
 */
const detailedHealthCheck = async (req, res) => {
  const startTime = Date.now();
  const checks = {};
  let overallStatus = 'healthy';

  // Database check
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      0: 'disconnected'
    };

    checks.database = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      state: dbStatus[dbState] || 'unknown',
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };

    if (dbState === 1) {
      // Test database operation
      const dbStart = Date.now();
      await mongoose.connection.db.admin().ping();
      checks.database.responseTime = Date.now() - dbStart;
    }

    if (checks.database.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    }
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error.message
    };
    overallStatus = 'unhealthy';
  }

  // Email service check
  try {
    const emailStart = Date.now();
    const transporter = nodemailer.createTransporter({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === '465',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      }
    });

    await transporter.verify();
    
    checks.email = {
      status: 'healthy',
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      responseTime: Date.now() - emailStart
    };
  } catch (error) {
    checks.email = {
      status: 'unhealthy',
      error: error.message
    };
    // Email service failure shouldn't mark overall system as unhealthy
    // as it's not critical for basic functionality
  }

  // Memory check
  const memoryUsage = process.memoryUsage();
  const memoryThreshold = 1024 * 1024 * 1024; // 1GB threshold
  
  checks.memory = {
    status: memoryUsage.heapUsed < memoryThreshold ? 'healthy' : 'warning',
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024)
  };

  // Disk space check (simplified)
  checks.disk = {
    status: 'healthy' // In production, you'd check actual disk space
  };

  // Response time
  const responseTime = Date.now() - startTime;

  const healthReport = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime,
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthReport);
};

/**
 * Readiness check - checks if app is ready to serve traffic
 */
const readinessCheck = async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'Database not connected'
      });
    }

    // Test database operation
    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      reason: error.message
    });
  }
};

/**
 * Liveness check - checks if app is alive
 */
const livenessCheck = async (req, res) => {
  // Simple check to ensure the process is running
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

/**
 * Metrics endpoint for monitoring
 */
const metricsCheck = async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      rss: process.memoryUsage().rss,
      external: process.memoryUsage().external
    },
    cpu: {
      usage: process.cpuUsage()
    },
    database: {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: env.NODE_ENV
    }
  };

  res.status(200).json(metrics);
};

module.exports = {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck,
  metricsCheck
}; 