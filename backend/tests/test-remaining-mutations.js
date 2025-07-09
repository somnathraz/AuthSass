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

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  categories: {},
  details: []
};

async function testMutation(name, mutation, variables = {}, category = 'General') {
  try {
    console.log(`🔍 Testing ${name}...`);
    
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: mutation,
        variables
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      const isSchemaError = result.errors.some(error => 
        error.message.includes('Cannot query field') || 
        error.message.includes('Unknown argument') ||
        error.message.includes('Field') && error.message.includes('doesn\'t exist')
      );
      
      if (isSchemaError) {
        console.log(`❌ ${name} - MUTATION DOESN'T EXIST`);
        console.log(`   Schema Error: ${result.errors[0].message}`);
        testResults.failed++;
        if (!testResults.categories[category]) testResults.categories[category] = { passed: 0, failed: 0 };
        testResults.categories[category].failed++;
        testResults.details.push({ name, category, status: 'NOT_EXISTS', error: result.errors[0].message });
        return false;
      } else {
        console.log(`⚠️ ${name} - EXISTS BUT FAILED`);
        console.log(`   Runtime Error: ${result.errors[0].message}`);
        testResults.failed++;
        if (!testResults.categories[category]) testResults.categories[category] = { passed: 0, failed: 0 };
        testResults.categories[category].failed++;
        testResults.details.push({ name, category, status: 'EXISTS_FAILED', error: result.errors[0].message });
        return false;
      }
    } else {
      console.log(`✅ ${name} - EXISTS AND WORKS`);
      if (result.data) {
        const keys = Object.keys(result.data);
        keys.forEach(key => {
          const value = result.data[key];
          if (typeof value === 'object' && value !== null) {
            console.log(`   ${key}: object with ${Object.keys(value).length} fields`);
          } else {
            console.log(`   ${key}: ${value}`);
          }
        });
      }
      
      testResults.passed++;
      if (!testResults.categories[category]) testResults.categories[category] = { passed: 0, failed: 0 };
      testResults.categories[category].passed++;
      testResults.details.push({ name, category, status: 'WORKS' });
      return true;
    }
  } catch (error) {
    console.log(`❌ ${name} - CONNECTION ERROR: ${error.message}`);
    testResults.failed++;
    if (!testResults.categories[category]) testResults.categories[category] = { passed: 0, failed: 0 };
    testResults.categories[category].failed++;
    testResults.details.push({ name, category, status: 'CONNECTION_ERROR', error: error.message });
    return false;
  }
}

async function testRemainingMutations() {
  console.log('🧪 TESTING REMAINING MUTATION RESOLVERS');
  console.log('========================================');
  console.log('Testing mutation resolvers not covered in basic tests...\n');

  // ========================================
  // 1. USER MUTATIONS
  // ========================================
  console.log('\n👥 USER MUTATIONS');
  console.log('==================');

  await testMutation(
    'Change Password',
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
        newPassword: 'NewPassword123!'
      }
    },
    'User Mutations'
  );

  await testMutation(
    'Update User Status (Admin)',
    `mutation UpdateUserStatus($userId: ID!, $status: Status!) {
      updateUserStatus(userId: $userId, status: $status) {
        success
        user {
          id
          username
          status
        }
        errors {
          message
          field
        }
      }
    }`,
    {
      userId: testUser.userId,
      status: 'ACTIVE'
    },
    'User Mutations'
  );

  await testMutation(
    'Delete User',
    `mutation DeleteUser($userId: ID!) {
      deleteUser(userId: $userId) {
        success
        message
        errors {
          message
          field
        }
      }
    }`,
    { userId: 'dummy_user_id' },
    'User Mutations'
  );

  await testMutation(
    'Request Password Reset',
    `mutation RequestPasswordReset($email: EmailAddress!) {
      requestPasswordReset(email: $email) {
        success
        message
        errors {
          message
          field
        }
      }
    }`,
    { email: 'test.reset@example.com' },
    'User Mutations'
  );

  await testMutation(
    'Reset Password',
    `mutation ResetPassword($token: String!, $newPassword: String!) {
      resetPassword(token: $token, newPassword: $newPassword) {
        success
        message
        errors {
          message
          field
        }
      }
    }`,
    {
      token: 'dummy_reset_token',
      newPassword: 'NewPassword123!'
    },
    'User Mutations'
  );

  await testMutation(
    'Verify Email',
    `mutation VerifyEmail($token: String!) {
      verifyEmail(token: $token) {
        success
        message
        errors {
          message
          field
        }
      }
    }`,
    { token: 'dummy_verification_token' },
    'User Mutations'
  );

  // ========================================
  // 2. ORGANIZATION MUTATIONS
  // ========================================
  console.log('\n🏢 ORGANIZATION MUTATIONS');
  console.log('==========================');

  await testMutation(
    'Create Organization',
    `mutation CreateOrganization($input: CreateOrganizationInput!) {
      createOrganization(input: $input) {
        success
        organization {
          id
          name
          type
          description
          owner {
            id
            username
            email
          }
          memberCount
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
        name: `Test Org ${Date.now()}`,
        type: 'COMPANY',
        description: 'A test organization for mutation testing'
      }
    },
    'Organization Mutations'
  );

  await testMutation(
    'Update Organization',
    `mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
      updateOrganization(id: $id, input: $input) {
        success
        organization {
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
      id: testUser.orgId,
      input: {
        description: 'Updated organization description for testing'
      }
    },
    'Organization Mutations'
  );

  await testMutation(
    'Delete Organization',
    `mutation DeleteOrganization($id: ID!) {
      deleteOrganization(id: $id) {
        success
        message
        errors {
          message
          field
        }
      }
    }`,
    { id: 'dummy_org_id' },
    'Organization Mutations'
  );

  await testMutation(
    'Add Organization Member',
    `mutation AddOrganizationMember($input: AddOrganizationMemberInput!) {
      addOrganizationMember(input: $input) {
        success
        membership {
          id
          user {
            id
            username
            email
          }
          role
          status
        }
        errors {
          message
          field
        }
      }
    }`,
    {
      input: {
        organizationId: testUser.orgId,
        email: 'new.member@example.com',
        role: 'MEMBER'
      }
    },
    'Organization Mutations'
  );

  await testMutation(
    'Remove Organization Member',
    `mutation RemoveOrganizationMember($input: RemoveOrganizationMemberInput!) {
      removeOrganizationMember(input: $input) {
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
        organizationId: testUser.orgId,
        userId: 'dummy_user_id'
      }
    },
    'Organization Mutations'
  );

  await testMutation(
    'Update Member Role',
    `mutation UpdateMemberRole($input: UpdateMemberRoleInput!) {
      updateMemberRole(input: $input) {
        success
        membership {
          id
          role
        }
        errors {
          message
          field
        }
      }
    }`,
    {
      input: {
        organizationId: testUser.orgId,
        userId: 'dummy_user_id',
        role: 'ADMIN'
      }
    },
    'Organization Mutations'
  );

  await testMutation(
    'Switch Organization',
    `mutation SwitchOrganization($orgId: ID!) {
      switchOrganization(orgId: $orgId) {
        success
        user {
          id
          organizationId
        }
        errors {
          message
          field
        }
      }
    }`,
    { orgId: testUser.orgId },
    'Organization Mutations'
  );

  // ========================================
  // 3. APP MUTATIONS
  // ========================================
  console.log('\n📱 APP MUTATIONS');
  console.log('=================');

  await testMutation(
    'Update App',
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
        description: 'Updated app description for mutation testing'
      }
    },
    'App Mutations'
  );

  await testMutation(
    'Delete App',
    `mutation DeleteApp($id: ID!) {
      deleteApp(id: $id) {
        success
        message
        errors {
          message
          field
        }
      }
    }`,
    { id: 'dummy_app_id' },
    'App Mutations'
  );

  await testMutation(
    'Add App Member',
    `mutation AddAppMember($input: AddAppMemberInput!) {
      addAppMember(input: $input) {
        success
        membership {
          id
          user {
            id
            username
            email
          }
          role
          status
        }
        errors {
          message
          field
        }
      }
    }`,
    {
      input: {
        appId: '6832d7f197a2286ea2024c26',
        email: 'app.member@example.com',
        role: 'MEMBER'
      }
    },
    'App Mutations'
  );

  await testMutation(
    'Remove App Member',
    `mutation RemoveAppMember($input: RemoveAppMemberInput!) {
      removeAppMember(input: $input) {
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
        appId: '6832d7f197a2286ea2024c26',
        userId: 'dummy_user_id'
      }
    },
    'App Mutations'
  );

  await testMutation(
    'Update App Member Role',
    `mutation UpdateAppMemberRole($input: UpdateAppMemberRoleInput!) {
      updateAppMemberRole(input: $input) {
        success
        membership {
          id
          role
        }
        errors {
          message
          field
        }
      }
    }`,
    {
      input: {
        appId: '6832d7f197a2286ea2024c26',
        userId: 'dummy_user_id',
        role: 'ADMIN'
      }
    },
    'App Mutations'
  );

  await testMutation(
    'Create API Key',
    `mutation CreateApiKey($input: CreateApiKeyInput!) {
      createApiKey(input: $input) {
        success
        apiKey {
          id
          name
          key
          permissions
          expiresAt
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
        appId: '6832d7f197a2286ea2024c26',
        name: 'Test API Key',
        permissions: ['READ', 'WRITE']
      }
    },
    'App Mutations'
  );

  await testMutation(
    'Revoke API Key',
    `mutation RevokeApiKey($id: ID!) {
      revokeApiKey(id: $id) {
        success
        message
        errors {
          message
          field
        }
      }
    }`,
    { id: 'dummy_api_key_id' },
    'App Mutations'
  );

  await testMutation(
    'Update API Key',
    `mutation UpdateApiKey($id: ID!, $input: UpdateApiKeyInput!) {
      updateApiKey(id: $id, input: $input) {
        success
        apiKey {
          id
          name
          permissions
          updatedAt
        }
        errors {
          message
          field
        }
      }
    }`,
    {
      id: 'dummy_api_key_id',
      input: {
        name: 'Updated API Key Name'
      }
    },
    'App Mutations'
  );

  // ========================================
  // 4. INVITATION MUTATIONS
  // ========================================
  console.log('\n📧 INVITATION MUTATIONS');
  console.log('========================');

  await testMutation(
    'Accept Invite',
    `mutation AcceptInvite($token: String!, $username: String, $password: String) {
      acceptInvite(token: $token, username: $username, password: $password) {
        accessToken
        refreshToken
        user {
          id
          username
          email
        }
        appId
        organizationId
        requiresUserSetup
      }
    }`,
    {
      token: 'dummy_invitation_token',
      username: 'newuser',
      password: 'NewPassword123!'
    },
    'Invitation Mutations'
  );

  await testMutation(
    'Decline Invitation',
    `mutation DeclineInvitation($token: String!) {
      declineInvitation(token: $token) {
        success
        message
        errors {
          message
          field
        }
      }
    }`,
    { token: 'dummy_invitation_token' },
    'Invitation Mutations'
  );

  await testMutation(
    'Cancel Invitation',
    `mutation CancelInvitation($id: ID!) {
      cancelInvitation(id: $id) {
        success
        message
        errors {
          message
          field
        }
      }
    }`,
    { id: 'dummy_invitation_id' },
    'Invitation Mutations'
  );

  await testMutation(
    'Resend Invitation',
    `mutation ResendInvitation($id: ID!) {
      resendInvitation(id: $id) {
        success
        invitation {
          id
          email
          status
          expiresAt
        }
        errors {
          message
          field
        }
      }
    }`,
    { id: 'dummy_invitation_id' },
    'Invitation Mutations'
  );

  // ========================================
  // FINAL RESULTS
  // ========================================
  console.log('\n📊 MUTATION TESTING RESULTS');
  console.log('============================');

  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;

  console.log(`\n✅ Total Working: ${testResults.passed}`);
  console.log(`❌ Total Failed/Missing: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${successRate}%`);

  console.log('\n📋 Results by Category:');
  Object.keys(testResults.categories).forEach(category => {
    const cat = testResults.categories[category];
    const catTotal = cat.passed + cat.failed;
    const catRate = catTotal > 0 ? ((cat.passed / catTotal) * 100).toFixed(1) : 0;
    console.log(`   ${category}: ${cat.passed}/${catTotal} (${catRate}%)`);
  });

  console.log('\n📝 Detailed Results:');
  testResults.details.forEach(test => {
    let status = '';
    switch(test.status) {
      case 'WORKS': status = '✅'; break;
      case 'EXISTS_FAILED': status = '⚠️'; break;
      case 'NOT_EXISTS': status = '❌'; break;
      case 'CONNECTION_ERROR': status = '🔌'; break;
    }
    console.log(`   ${status} [${test.category}] ${test.name}`);
    if (test.error && test.status !== 'WORKS') {
      console.log(`      Error: ${test.error.substring(0, 100)}...`);
    }
  });

  const workingCount = testResults.details.filter(t => t.status === 'WORKS').length;
  const existingButFailingCount = testResults.details.filter(t => t.status === 'EXISTS_FAILED').length;
  const notExistingCount = testResults.details.filter(t => t.status === 'NOT_EXISTS').length;

  console.log('\n🎯 SUMMARY:');
  console.log(`   ✅ Working Mutations: ${workingCount}`);
  console.log(`   ⚠️ Existing but Failing: ${existingButFailingCount}`);
  console.log(`   ❌ Non-Existing: ${notExistingCount}`);

  return testResults;
}

// Run the mutation tests
testRemainingMutations().catch(console.error); 