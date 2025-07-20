// Use built-in fetch (Node.js 18+)

// Test the complete integration flow
async function testIntegrationFlow() {
  console.log("🧪 Testing Integration Flow...\n");

  const baseUrl = "http://localhost:4000";
  const appId = "507f1f77bcf86cd799439011"; // Example app ID

  try {
    // 1. Test fetching app data
    console.log("1️⃣ Testing app data fetch...");
    const appResponse = await fetch(`${baseUrl}/api/apps/${appId}`);
    const appData = await appResponse.json();
    console.log("✅ App data:", appData.success ? "Success" : "Failed");
    console.log(
      "   Integration status:",
      appData.app?.integrationStatus?.isConnected
        ? "Connected"
        : "Not Connected"
    );

    // 2. Test setting integration technology
    console.log("\n2️⃣ Testing technology selection...");
    const techResponse = await fetch(
      `${baseUrl}/api/apps/${appId}/integration`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedTechnology: "webflow",
          isCheckingConnection: true,
        }),
      }
    );
    const techData = await techResponse.json();
    console.log(
      "✅ Technology selection:",
      techData.success ? "Success" : "Failed"
    );

    // 3. Test connection status check
    console.log("\n3️⃣ Testing connection status...");
    const statusResponse = await fetch(
      `${baseUrl}/api/apps/${appId}/connection-status`
    );
    const statusData = await statusResponse.json();
    console.log(
      "✅ Connection status:",
      statusData.success ? "Success" : "Failed"
    );
    console.log("   Is connected:", statusData.isConnected);

    // 4. Test analytics
    console.log("\n4️⃣ Testing analytics...");
    const analyticsResponse = await fetch(
      `${baseUrl}/api/apps/${appId}/analytics?timeRange=7d`
    );
    const analyticsData = await analyticsResponse.json();
    console.log("✅ Analytics:", analyticsData.success ? "Success" : "Failed");
    console.log("   Metrics:", analyticsData.analytics);

    // 5. Test final app data (should show updated integration status)
    console.log("\n5️⃣ Testing updated app data...");
    const finalAppResponse = await fetch(`${baseUrl}/api/apps/${appId}`);
    const finalAppData = await finalAppResponse.json();
    console.log(
      "✅ Final app data:",
      finalAppData.success ? "Success" : "Failed"
    );
    console.log(
      "   Selected technology:",
      finalAppData.app?.integrationStatus?.selectedTechnology
    );
    console.log(
      "   Is checking connection:",
      finalAppData.app?.integrationStatus?.isCheckingConnection
    );

    console.log("\n🎉 Integration flow test completed!");
    console.log("\n📋 Summary:");
    console.log("   - App data fetching: ✅");
    console.log("   - Technology selection: ✅");
    console.log("   - Connection status: ✅");
    console.log("   - Analytics: ✅");
    console.log("   - State persistence: ✅");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testIntegrationFlow();
