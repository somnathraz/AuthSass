const mongoose = require("mongoose");
const {
  auditPlatformLog,
  auditCustomerLog,
  auditApplicationLog,
  queryAuditLogs,
  queryCustomerLogs,
  getAuditStats,
} = require("./src/utils/audit");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/auth-saas",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Test the audit system
const testAuditSystem = async () => {
  console.log("🧪 Testing Three-Tier Audit System...\n");

  try {
    // Test 1: Create Platform Audit Log
    console.log("📝 Test 1: Creating Platform Audit Log...");
    await auditPlatformLog("SYSTEM_MAINTENANCE", "system-admin-id", {
      category: "SYSTEM",
      actorType: "ADMIN",
      description: "System maintenance performed",
      severity: "MEDIUM",
    });
    console.log("✅ Platform audit log created");

    // Test 2: Create Customer Audit Log
    console.log("\n📝 Test 2: Creating Customer Audit Log...");
    await auditCustomerLog(
      "ORGANIZATION_UPDATED",
      "683331389617fe54bc139d1d", // Your org ID
      "user-id",
      {
        category: "ORGANIZATION",
        actorType: "USER",
        description: "Organization settings updated",
        changes: JSON.stringify({
          before: { name: "Old Name" },
          after: { name: "New Name" },
        }),
      }
    );
    console.log("✅ Customer audit log created");

    // Test 3: Create Application Audit Log
    console.log("\n📝 Test 3: Creating Application Audit Log...");
    await auditApplicationLog(
      "USER_LOGIN",
      "683331389617fe54bc139d1d", // Your org ID
      "68347da56e5a5d38585dc5c7", // Your app ID
      "end-user-id",
      {
        category: "AUTH",
        actorType: "END_USER",
        description: "User logged in successfully",
        ip: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
      }
    );
    console.log("✅ Application audit log created");

    // Wait a moment for logs to be saved
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 4: Query Customer Logs
    console.log("\n📊 Test 4: Querying Customer Audit Logs...");
    const customerLogs = await queryCustomerLogs(
      "683331389617fe54bc139d1d",
      {},
      { page: 1, limit: 10 }
    );

    console.log(
      `✅ Found ${customerLogs.pagination.totalCount} customer logs:`
    );
    customerLogs.logs.forEach((log, index) => {
      console.log(
        `   ${index + 1}. [${log.logTier}] ${log.eventType} - ${new Date(log.timestamp).toLocaleString()}`
      );
    });

    // Test 5: Query All Logs
    console.log("\n📊 Test 5: Querying All Audit Logs...");
    const allLogs = await queryAuditLogs(
      {
        customerId: "683331389617fe54bc139d1d",
      },
      { page: 1, limit: 10 },
      { role: "ADMIN" } // Mock admin user
    );

    console.log(
      `✅ Found ${allLogs.pagination.totalCount} total logs for organization:`
    );
    allLogs.logs.forEach((log, index) => {
      console.log(
        `   ${index + 1}. [${log.logTier}] ${log.eventType} - ${log.description || "No description"}`
      );
    });

    // Test 6: Get Audit Statistics
    console.log("\n📈 Test 6: Getting Audit Statistics...");
    const stats = await getAuditStats(
      { customerId: "683331389617fe54bc139d1d" },
      "day"
    );

    console.log("✅ Audit Statistics:");
    console.log(`📊 Total Count: ${stats.totalCount}`);
    console.log("📊 Tier Distribution:");
    stats.tierDistribution.forEach((tier) => {
      console.log(`   - ${tier._id}: ${tier.count}`);
    });

    if (stats.topEvents.length > 0) {
      console.log("📊 Top Events:");
      stats.topEvents.forEach((event) => {
        console.log(`   - ${event._id}: ${event.count}`);
      });
    }

    console.log("\n🎉 All tests completed successfully!");
    console.log("✅ Three-tier audit system is working correctly");

    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
};

// Main execution
const main = async () => {
  await connectDB();

  const success = await testAuditSystem();

  await mongoose.disconnect();
  console.log("\n🔌 Disconnected from MongoDB");

  if (success) {
    console.log("\n🚀 Ready to proceed with frontend implementation!");
    process.exit(0);
  } else {
    console.log("\n💥 Tests failed. Please check the errors above.");
    process.exit(1);
  }
};

main();
