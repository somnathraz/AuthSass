/**
 * Test SDK Integration
 * Verifies the complete SDK flow from app creation to audit logging
 */

const axios = require("axios");

const API_URL = "http://localhost:4000";
const GRAPHQL_URL = `${API_URL}/graphql`;

// Test data
const testOrg = {
  name: "SDK Test Organization",
  description: "Testing SDK integration",
};

const testApp = {
  name: "SDK Test App",
  description: "Test application for SDK integration",
};

const testUser = {
  email: "sdk-test@example.com",
  password: "TestPassword123!",
  username: "sdktestuser",
};

async function testSDKIntegration() {
  console.log("🧪 Testing SDK Integration...\n");

  try {
    // Step 1: Create organization
    console.log("1️⃣ Creating test organization...");
    const createOrgResponse = await axios.post(
      GRAPHQL_URL,
      {
        query: `
        mutation CreateOrganization($input: CreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
            name
            description
          }
        }
      `,
        variables: {
          input: testOrg,
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const orgId = createOrgResponse.data.data.createOrganization.id;
    console.log(`✅ Organization created: ${orgId}\n`);

    // Step 2: Create application
    console.log("2️⃣ Creating test application...");
    const createAppResponse = await axios.post(
      GRAPHQL_URL,
      {
        query: `
        mutation CreateApp($input: CreateAppInput!) {
          createApp(input: $input) {
            id
            name
            description
            secretKey
            status
          }
        }
      `,
        variables: {
          input: {
            ...testApp,
            orgId: orgId,
          },
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const app = createAppResponse.data.data.createApp;
    console.log(`✅ Application created: ${app.id}`);
    console.log(`🔑 Secret Key: ${app.secretKey}\n`);

    // Step 3: Test SDK audit endpoint
    console.log("3️⃣ Testing SDK audit endpoint...");
    const auditResponse = await axios.post(
      `${API_URL}/api/sdk/audit`,
      {
        eventType: "USER_LOGIN_SUCCESS",
        userId: "test_user_123",
        metadata: {
          method: "email_password",
          platform: "webflow",
          success: true,
          sdkVersion: "1.0.0",
          email: testUser.email,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${app.secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ SDK audit event logged successfully");
    console.log(
      `📊 Response: ${JSON.stringify(auditResponse.data, null, 2)}\n`
    );

    // Step 4: Test SDK validation endpoint
    console.log("4️⃣ Testing SDK validation endpoint...");
    const validateResponse = await axios.post(
      `${API_URL}/api/sdk/validate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${app.secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ SDK token validated successfully");
    console.log(
      `📊 App Info: ${JSON.stringify(validateResponse.data, null, 2)}\n`
    );

    // Step 5: Test SDK health endpoint
    console.log("5️⃣ Testing SDK health endpoint...");
    const healthResponse = await axios.get(`${API_URL}/api/sdk/health`);
    console.log("✅ SDK health check passed");
    console.log(`📊 Health: ${JSON.stringify(healthResponse.data, null, 2)}\n`);

    // Step 6: Test multiple audit events
    console.log("6️⃣ Testing multiple audit events...");
    const events = [
      {
        eventType: "USER_SIGNUP_SUCCESS",
        userId: "user_456",
        metadata: {
          method: "email_password",
          platform: "wordpress",
          success: true,
          sdkVersion: "1.0.0",
        },
      },
      {
        eventType: "USER_LOGIN_FAILED",
        metadata: {
          method: "email_password",
          platform: "webflow",
          success: false,
          error: "Invalid credentials",
          sdkVersion: "1.0.0",
        },
      },
      {
        eventType: "MAGIC_LINK_SENT",
        metadata: {
          method: "magic_link",
          platform: "webflow",
          success: true,
          email: "user@example.com",
          sdkVersion: "1.0.0",
        },
      },
    ];

    for (const event of events) {
      await axios.post(`${API_URL}/api/sdk/audit`, event, {
        headers: {
          Authorization: `Bearer ${app.secretKey}`,
          "Content-Type": "application/json",
        },
      });
      console.log(`✅ Logged event: ${event.eventType}`);
    }

    console.log("\n🎉 All SDK tests passed!");
    console.log("\n📋 Summary:");
    console.log(`   • Organization: ${orgId}`);
    console.log(`   • Application: ${app.id}`);
    console.log(`   • Secret Key: ${app.secretKey}`);
    console.log(`   • Audit Events: 4 logged successfully`);
    console.log(`   • SDK Endpoints: All working`);

    console.log("\n🚀 SDK Integration is ready for production!");
    console.log("\nNext steps:");
    console.log("1. Deploy the SDK files to CDN");
    console.log("2. Update your dashboard to show SDK integration options");
    console.log("3. Create documentation for customers");
    console.log("4. Launch your no-code SDK offering!");
  } catch (error) {
    console.error("❌ SDK test failed:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log(
        "\n💡 Make sure your backend is running and the SDK routes are properly configured."
      );
    }

    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testSDKIntegration();
}

module.exports = { testSDKIntegration };
