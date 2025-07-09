const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
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

async function testResolver(name, query, variables = {}) {
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
      });
      return false;
    } else {
      console.log(`✅ ${name} PASSED`);
      if (result.data) {
        console.log(`   Data:`, JSON.stringify(result.data, null, 2));
      }
      return true;
    }
  } catch (error) {
    console.log(`❌ ${name} FAILED: ${error.message}`);
    return false;
  }
}

async function testProblematicResolvers() {
  console.log('🔧 TESTING FIXED PROBLEMATIC RESOLVERS');
  console.log('======================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: validateToken (fixed schema)
  const test1 = await testResolver(
    'validateToken (Fixed Schema)',
    `query ValidateToken($token: String!) {
      validateToken(token: $token) {
        valid
        user {
          id
          username
          email
        }
        expiresAt
        error
      }
    }`,
    { token: token }
  );
  test1 ? passed++ : failed++;

  // Test 2: userAppAccess (fixed runtime error)
  const test2 = await testResolver(
    'userAppAccess (Fixed Runtime)',
    `query UserAppAccess($appId: ID!) {
      userAppAccess(appId: $appId) {
        hasAccess
        role
        accessType
        permissions {
          canRead
          canWrite
          canDelete
          canInvite
          canManageSettings
        }
      }
    }`,
    { appId: '6832d7f197a2286ea2024c26' }
  );
  test2 ? passed++ : failed++;

  // Test 3: apps (fixed serialization)
  const test3 = await testResolver(
    'apps (Fixed Serialization)',
    `query Apps($limit: Int, $offset: Int) {
      apps(limit: $limit, offset: $offset) {
        apps {
          id
          name
          description
          owner {
            id
            username
            email
          }
          organization {
            id
            name
          }
        }
        total
        hasNextPage
      }
    }`,
    { limit: 5, offset: 0 }
  );
  test3 ? passed++ : failed++;

  // Test 4: createOrganization (fixed enum)
  const test4 = await testResolver(
    'createOrganization (Fixed Enum)',
    `mutation CreateOrganization($input: CreateOrganizationInput!) {
      createOrganization(input: $input) {
        success
        organization {
          id
          name
          type
          description
        }
        errors {
          message
          field
        }
      }
    }`,
    {
      input: {
        name: `Test Org ${Date.now()}`,
        type: 'COMPANY',
        description: 'A test organization for testing fixes'
      }
    }
  );
  test4 ? passed++ : failed++;

  // Test 5: changePassword (fixed validation)
  const test5 = await testResolver(
    'changePassword (Fixed Validation)',
    `mutation ChangePassword($input: ChangePasswordInput!) {
      changePassword(input: $input) {
        success
        message
        errors {
          message
          field
        }
      }
    }`,
    {
      input: {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }
    }
  );
  test5 ? passed++ : failed++;

  // Test 6: updateApp (should work)
  const test6 = await testResolver(
    'updateApp (Should Work)',
    `mutation UpdateApp($id: ID!, $input: UpdateAppInput!) {
      updateApp(id: $id, input: $input) {
        success
        app {
          id
          name
          description
          updatedAt
        }
        errors {
          message
          field
        }
      }
    }`,
    {
      id: '6832d7f197a2286ea2024c26',
      input: {
        description: 'Updated description for testing fixes'
      }
    }
  );
  test6 ? passed++ : failed++;

  console.log('\n📊 PROBLEMATIC RESOLVER FIX RESULTS');
  console.log('====================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 ALL PROBLEMATIC RESOLVERS FIXED!');
  } else {
    console.log('\n⚠️  Some resolvers still need attention.');
  }
}

// Run the tests
testProblematicResolvers().catch(console.error); 