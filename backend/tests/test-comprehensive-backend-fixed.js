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

console.log('🧪 COMPREHENSIVE BACKEND FEATURE TESTING');
console.log('==========================================\n');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  categories: {},
  details: []
};

async function testQuery(name, query, variables = {}, category = 'General') {
  try {
    console.log(`🔍 Testing ${name}...`);
    
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
      
      testResults.failed++;
      if (!testResults.categories[category]) testResults.categories[category] = { passed: 0, failed: 0 };
      testResults.categories[category].failed++;
      testResults.details.push({ name, category, status: 'FAILED', error: result.errors[0].message });
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
      
      testResults.passed++;
      if (!testResults.categories[category]) testResults.categories[category] = { passed: 0, failed: 0 };
      testResults.categories[category].passed++;
      testResults.details.push({ name, category, status: 'PASSED' });
      return true;
    }
  } catch (error) {
    console.log(`❌ ${name} FAILED: ${error.message}`);
    testResults.failed++;
    if (!testResults.categories[category]) testResults.categories[category] = { passed: 0, failed: 0 };
    testResults.categories[category].failed++;
    testResults.details.push({ name, category, status: 'FAILED', error: error.message });
    return false;
  }
}

async function runComprehensiveTests() {
  console.log('Starting comprehensive backend testing...\n');

  // ========================================
  // 1. AUTHENTICATION & AUTHORIZATION TESTS
  // ========================================
  console.log('\n🔐 AUTHENTICATION & AUTHORIZATION TESTS');
  console.log('==========================================');

  // Test current user query (using 'me' query)
  await testQuery(
    'Current User (me)',
    `query Me {
      me {
        id
        username
        email
        role
        status
        accountType
        isVerified
        createdAt
        updatedAt
        displayName
        isOnline
        permissions {
          id
          resource
          actions
          scope
        }
      }
    }`,
    {},
    'Authentication'
  );

  // ========================================
  // 2. USER MANAGEMENT TESTS
  // ========================================
  console.log('\n👥 USER MANAGEMENT TESTS');
  console.log('=========================');

  // Test user query
  await testQuery(
    'Get User by ID',
    `query GetUser($id: ID!) {
      user(id: $id) {
        id
        username
        email
        role
        status
        accountType
        createdAt
        updatedAt
        displayName
        isOnline
        fullName
      }
    }`,
    { id: testUser.userId },
    'User Management'
  );

  // Test user stats (admin only)
  await testQuery(
    'User Statistics (Admin)',
    `query UserStats {
      userStats {
        totalUsers
        activeUsers
        newUsersToday
        newUsersThisWeek
        newUsersThisMonth
        usersByRole {
          role
          count
        }
        usersByStatus {
          status
          count
        }
        usersByAccountType {
          accountType
          count
        }
      }
    }`,
    {},
    'User Management'
  );

  // ========================================
  // 3. ORGANIZATION MANAGEMENT TESTS
  // ========================================
  console.log('\n🏢 ORGANIZATION MANAGEMENT TESTS');
  console.log('=================================');

  // Test user organizations
  await testQuery(
    'User Organizations',
    `query UserOrganizations {
      userOrganizations {
        id
        name
        type
        userRole
        accessType
        joinedAt
        appCount
      }
    }`,
    {},
    'Organization Management'
  );

  // Test organization query
  await testQuery(
    'Get Organization',
    `query GetOrganization($id: ID!) {
      organization(id: $id) {
        id
        name
        description
        type
        status
        owner {
          id
          username
          email
        }
        memberCount
        createdAt
        updatedAt
      }
    }`,
    { id: testUser.orgId },
    'Organization Management'
  );

  // ========================================
  // 4. APP MANAGEMENT TESTS
  // ========================================
  console.log('\n📱 APP MANAGEMENT TESTS');
  console.log('========================');

  // Test myApps query
  await testQuery(
    'My Apps',
    `query MyApps {
      myApps {
        id
        name
        description
        type
        status
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
        updatedAt
      }
    }`,
    {},
    'App Management'
  );

  // Test create app mutation
  await testQuery(
    'Create App',
    `mutation CreateApp($input: CreateAppInput!) {
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
        errors {
          message
          field
        }
      }
    }`,
    {
      input: {
        name: 'Comprehensive Test App',
        description: 'Testing all app creation features',
        type: 'WEB',
        organizationId: testUser.orgId
      }
    },
    'App Management'
  );

  // ========================================
  // 5. INVITATION SYSTEM TESTS
  // ========================================
  console.log('\n📧 INVITATION SYSTEM TESTS');
  console.log('===========================');

  // Test my invitations
  await testQuery(
    'My Invitations',
    `query MyInvitations {
      myInvitations {
        id
        email
        type
        status
        role
        invitedBy {
          id
          username
          email
        }
        organization {
          id
          name
        }
        app {
          id
          name
        }
        createdAt
        expiresAt
      }
    }`,
    {},
    'Invitation System'
  );

  // ========================================
  // 6. API KEY MANAGEMENT TESTS
  // ========================================
  console.log('\n🔑 API KEY MANAGEMENT TESTS');
  console.log('============================');

  // Test app API keys
  const appId = '6832d7f197a2286ea2024c26'; // Use one of the created apps
  await testQuery(
    'App API Keys',
    `query AppApiKeys($appId: ID!) {
      appApiKeys(appId: $appId) {
        apiKeys {
          id
          name
          permissions
          lastUsedAt
          createdAt
          expiresAt
        }
        total
      }
    }`,
    { appId },
    'API Key Management'
  );

  // ========================================
  // 7. MUTATION TESTS
  // ========================================
  console.log('\n🔄 MUTATION TESTS');
  console.log('==================');

  // Test update profile
  await testQuery(
    'Update Profile',
    `mutation UpdateProfile($input: UserUpdateInput!) {
      updateProfile(input: $input) {
        success
        user {
          id
          username
          firstName
          lastName
          displayName
          updatedAt
        }
        errors {
          message
          field
        }
      }
    }`,
    {
      input: {
        firstName: 'Somnath',
        lastName: 'Khadanga'
      }
    },
    'User Management'
  );

  // ========================================
  // 8. EMAIL FUNCTIONALITY TESTS
  // ========================================
  console.log('\n📬 EMAIL FUNCTIONALITY TESTS');
  console.log('=============================');

  // Test create invitation (with email)
  await testQuery(
    'Create Invitation (Email)',
    `mutation CreateInvitation($input: CreateInvitationInput!) {
      createInvitation(input: $input) {
        success
        invitation {
          id
          email
          type
          status
          role
          createdAt
          expiresAt
        }
        errors {
          message
          field
        }
      }
    }`,
    {
      input: {
        email: `test.invite.${Date.now()}@example.com`,
        type: 'ORGANIZATION',
        role: 'MEMBER',
        organizationId: testUser.orgId
      }
    },
    'Email Functionality'
  );

  // ========================================
  // FINAL RESULTS
  // ========================================
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('==============================');
  
  console.log(`\n✅ Total Passed: ${testResults.passed}`);
  console.log(`❌ Total Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  console.log('\n📋 Results by Category:');
  Object.entries(testResults.categories).forEach(([category, results]) => {
    const total = results.passed + results.failed;
    const successRate = ((results.passed / total) * 100).toFixed(1);
    console.log(`   ${category}: ${results.passed}/${total} (${successRate}%)`);
  });

  console.log('\n📝 Detailed Results:');
  testResults.details.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    console.log(`   ${status} [${test.category}] ${test.name}`);
    if (test.error) {
      console.log(`      Error: ${test.error}`);
    }
  });

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Backend is fully functional.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.');
  }

  return testResults;
}

// Run the comprehensive tests
runComprehensiveTests().catch(console.error); 