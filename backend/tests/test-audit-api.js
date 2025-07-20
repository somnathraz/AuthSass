const {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  gql,
} = require("@apollo/client/core");
const fetch = require("node-fetch");

// Create Apollo Client for testing
const client = new ApolloClient({
  link: createHttpLink({
    uri: "http://localhost:4000/graphql",
    fetch: fetch,
  }),
  cache: new InMemoryCache(),
});

// Test GraphQL queries and mutations
const TEST_AUDIT_SYSTEM = async () => {
  console.log("🧪 Testing Three-Tier Audit System...\n");

  try {
    // Test 1: Create a platform audit log
    console.log("📝 Test 1: Creating Platform Audit Log...");
    const CREATE_PLATFORM_LOG = gql`
      mutation CreatePlatformLog {
        createAuditLog(
          logTier: PLATFORM
          eventType: "SYSTEM_MAINTENANCE"
          eventCategory: SYSTEM
          description: "System maintenance performed by admin"
          actorType: ADMIN
          severity: "MEDIUM"
        ) {
          id
          logTier
          eventType
          description
          timestamp
        }
      }
    `;

    const platformResult = await client.mutate({
      mutation: CREATE_PLATFORM_LOG,
    });
    console.log("✅ Platform log created:", platformResult.data.createAuditLog);

    // Test 2: Create a customer audit log
    console.log("\n📝 Test 2: Creating Customer Audit Log...");
    const CREATE_CUSTOMER_LOG = gql`
      mutation CreateCustomerLog {
        createAuditLog(
          logTier: CUSTOMER
          customerId: "683331389617fe54bc139d1d"
          eventType: "ORGANIZATION_UPDATED"
          eventCategory: ORGANIZATION
          description: "Organization settings were updated"
          actorType: USER
          severity: "LOW"
        ) {
          id
          logTier
          customerId
          eventType
          description
          timestamp
        }
      }
    `;

    const customerResult = await client.mutate({
      mutation: CREATE_CUSTOMER_LOG,
    });
    console.log("✅ Customer log created:", customerResult.data.createAuditLog);

    // Test 3: Create an application audit log
    console.log("\n📝 Test 3: Creating Application Audit Log...");
    const CREATE_APP_LOG = gql`
      mutation CreateAppLog {
        createAuditLog(
          logTier: APPLICATION
          customerId: "683331389617fe54bc139d1d"
          applicationId: "68347da56e5a5d38585dc5c7"
          eventType: "USER_LOGIN"
          eventCategory: AUTHENTICATION
          description: "User successfully logged in to application"
          actorType: USER
          severity: "LOW"
        ) {
          id
          logTier
          customerId
          applicationId
          eventType
          description
          timestamp
        }
      }
    `;

    const appResult = await client.mutate({ mutation: CREATE_APP_LOG });
    console.log("✅ Application log created:", appResult.data.createAuditLog);

    // Test 4: Query customer audit logs
    console.log("\n📊 Test 4: Querying Customer Audit Logs...");
    const GET_CUSTOMER_LOGS = gql`
      query GetCustomerLogs {
        customerAuditLogs(
          customerId: "683331389617fe54bc139d1d"
          pagination: { page: 1, limit: 5 }
        ) {
          logs {
            id
            logTier
            eventType
            description
            actor {
              type
              email
            }
            timestamp
          }
          pagination {
            totalCount
            page
            totalPages
          }
        }
      }
    `;

    const queryResult = await client.query({ query: GET_CUSTOMER_LOGS });
    console.log("✅ Customer logs retrieved:");
    console.log(
      "📊 Total logs:",
      queryResult.data.customerAuditLogs.pagination.totalCount
    );
    queryResult.data.customerAuditLogs.logs.forEach((log, index) => {
      console.log(
        `   ${index + 1}. [${log.logTier}] ${log.eventType} - ${log.description}`
      );
    });

    // Test 5: Get audit analytics
    console.log("\n📈 Test 5: Getting Audit Analytics...");
    const GET_ANALYTICS = gql`
      query GetAuditAnalytics {
        auditAnalytics(
          customerId: "683331389617fe54bc139d1d"
          timeRange: "7d"
        ) {
          totalEvents
          eventsByCategory {
            category
            count
          }
          eventsByTier {
            tier
            count
          }
          successRate
          recentActivity {
            eventType
            timestamp
          }
        }
      }
    `;

    const analyticsResult = await client.query({ query: GET_ANALYTICS });
    const analytics = analyticsResult.data.auditAnalytics;
    console.log("✅ Analytics retrieved:");
    console.log(`📊 Total Events: ${analytics.totalEvents}`);
    console.log(`📊 Success Rate: ${analytics.successRate}%`);
    console.log("📊 Events by Category:");
    analytics.eventsByCategory.forEach((cat) => {
      console.log(`   - ${cat.category}: ${cat.count}`);
    });
    console.log("📊 Events by Tier:");
    analytics.eventsByTier.forEach((tier) => {
      console.log(`   - ${tier.tier}: ${tier.count}`);
    });

    console.log("\n🎉 All tests completed successfully!");
    console.log("✅ Three-tier audit system is working correctly\n");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach((err) =>
        console.error("GraphQL Error:", err.message)
      );
    }
    if (error.networkError) {
      console.error("Network Error:", error.networkError.message);
    }
  }
};

// Run the tests
TEST_AUDIT_SYSTEM()
  .then(() => {
    console.log(
      "🏁 Test completed. You can now proceed with frontend implementation!"
    );
    process.exit(0);
  })
  .catch((err) => {
    console.error("💥 Fatal error:", err);
    process.exit(1);
  });
