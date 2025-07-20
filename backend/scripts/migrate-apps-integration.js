const mongoose = require("mongoose");
const dotenv = require("dotenv");
const App = require("../src/models/App");

// Load environment variables
dotenv.config();

async function migrateAppsIntegration() {
  try {
    console.log("🔄 Starting app integration migration...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all apps that don't have integrationStatus
    const appsToMigrate = await App.find({
      $or: [
        { integrationStatus: { $exists: false } },
        { "integrationStatus.isConnected": { $exists: false } },
      ],
    });

    console.log(`📊 Found ${appsToMigrate.length} apps to migrate`);

    if (appsToMigrate.length === 0) {
      console.log("✅ No apps need migration");
      return;
    }

    // Update each app with default integration status
    const updatePromises = appsToMigrate.map((app) => {
      return App.findByIdAndUpdate(
        app._id,
        {
          $set: {
            integrationStatus: {
              isConnected: false,
              selectedTechnology: null,
              connectedAt: null,
              lastLoginAttempt: null,
              totalLoginAttempts: 0,
              successfulLogins: 0,
              isCheckingConnection: false,
              checkStartedAt: null,
            },
          },
        },
        { new: true }
      );
    });

    const updatedApps = await Promise.all(updatePromises);

    console.log(`✅ Successfully migrated ${updatedApps.length} apps`);

    // Log some examples
    console.log("\n📋 Migration Summary:");
    updatedApps.slice(0, 3).forEach((app) => {
      console.log(
        `   - ${app.name}: ${app.integrationStatus.isConnected ? "Connected" : "Not Connected"}`
      );
    });

    console.log("\n🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run migration
migrateAppsIntegration();
