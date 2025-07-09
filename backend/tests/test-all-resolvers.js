const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Test user credentials
const testUser = {
  email: 'somnathkhadanga810@gmail.com',
  userId: '68321c5edab906b56003f5ad',
  orgId: '68321c5edab906b56003f5af'
};

// Generate a test token
const token = jwt.sign(
  { 
    userId: testUser.userId, 
    email: testUser.email,
    orgId: testUser.orgId
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('🧪 Starting Comprehensive Resolver Testing...\n');

async function testQuery(name, query, variables = {}) {
  try {
    console.log(`\n🔍 Testing ${name}...`);
    
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.log(`❌ ${name} FAILED:`);
      result.errors.forEach(error => {
        console.log(`   Error: ${error.message}`);
        if (error.path) console.log(`   Path: ${error.path.join(' -> ')}`);
      });
      return false;
    } else {
      console.log(`✅ ${name} PASSED`);
      if (result.data) {
        const keys = Object.keys(result.data);
        keys.forEach(key => {
          const value = result.data[key];
          if (Array.isArray(value)) {
            console.log(`   ${key}: ${value.length} items`);
          } else if (typeof value === 'object' && value !== null) {
            console.log(`   ${key}: object with ${Object.keys(value).length} fields`);
          } else {
            console.log(`   ${key}: ${value}`);
          }
        });
      }
      return true;
    }
  } catch (error) {
    console.log(`❌ ${name} FAILED: ${error.message}`);
    return false;
  }
}

async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: User Queries
  const userTests = [
    {
      name: 'User Query',
      query: `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            username
            email
            role
            status
            createdAt
            updatedAt
            displayName
            isOnline
          }
        }
      `,
      variables: { id: testUser.userId }
    }
  ];

  // Test 2: App Queries
  const appTests = [
    {
      name: 'MyApps Query',
      query: `
        query MyApps {
          myApps {
            id
            name
            description
            type
            owner {
              id
              username
              email
              role
              createdAt
            }
            memberCount
            userRole
            createdAt
          }
        }
      `
    },
    {
      name: 'Apps Query',
      query: `
        query GetApps($limit: Int, $offset: Int) {
          apps(limit: $limit, offset: $offset) {
            apps {
              id
              name
              description
              owner {
                id
                username
                email
                role
                createdAt
              }
              createdAt
            }
            total
            hasNextPage
          }
        }
      `,
      variables: { limit: 5, offset: 0 }
    }
  ];

  // Test 3: App Mutations
  const appMutationTests = [
    {
      name: 'Create App Mutation',
      query: `
        mutation CreateApp($input: CreateAppInput!) {
          createApp(input: $input) {
            success
            app {
              id
              name
              description
              type
              organizationId
              owner {
                id
                username
                email
                role
                createdAt
              }
              members {
                id
                username
                email
                role
                createdAt
              }
              memberCount
              userRole
              createdAt
            }
            errors
          }
        }
      `,
      variables: {
        input: {
          name: 'Comprehensive Test App',
          description: 'Testing all resolver fields comprehensively',
          type: 'WEB',
          organizationId: testUser.orgId
        }
      }
    }
  ];

  // Run all tests
  const allTests = [
    ...userTests,
    ...appTests,
    ...appMutationTests
  ];

  for (const test of allTests) {
    const passed = await testQuery(test.name, test.query, test.variables);
    results.tests.push({ name: test.name, passed });
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! The GraphQL resolvers are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above for details.');
  }

  return results;
}

// Run the tests
runTests().catch(console.error); 