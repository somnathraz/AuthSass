const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');
const Invitation = require('./src/models/Invitation');
const Organization = require('./src/models/Organization');

const GRAPHQL_URL = 'http://localhost:4000/graphql';

async function debugInvitationNetwork() {
  try {
    console.log('🔍 Debugging invitation network issues...\n');

    // Connect to database to create a real invitation
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an organization
    const org = await Organization.findOne();
    if (!org) {
      console.log('❌ No organizations found');
      return;
    }

    console.log('✅ Found organization:', org.name);

    // Create a test invitation for a non-existing user
    const testEmail = 'networktest' + Date.now() + '@example.com';
    const testToken = 'test-token-' + Date.now();
    
    const invitation = new Invitation({
      email: testEmail,
      type: 'ORGANIZATION',
      organization: org._id,
      role: 'MEMBER',
      token: testToken,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      invitedBy: org.owner
    });

    await invitation.save();
    console.log('✅ Created test invitation:', {
      email: testEmail,
      token: testToken,
      type: 'ORGANIZATION'
    });

    // Test 1: Check if the GraphQL endpoint is working
    console.log('\n1. Testing basic GraphQL connectivity...');
    try {
      const basicTest = await axios.post(GRAPHQL_URL, {
        query: 'query { __typename }'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      console.log('✅ Basic GraphQL test passed:', basicTest.data);
    } catch (error) {
      console.error('❌ Basic GraphQL test failed:', error.message);
      return;
    }

    // Test 2: Test the acceptInvite mutation with our test token
    console.log('\n2. Testing acceptInvite mutation...');
    const acceptInviteMutation = `
      mutation AcceptInvite($token: String!, $username: String, $password: String) {
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
          userExists
          email
        }
      }
    `;

    try {
      console.log('📤 Sending acceptInvite request...');
      const response = await axios.post(GRAPHQL_URL, {
        query: acceptInviteMutation,
        variables: {
          token: testToken
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log('✅ AcceptInvite response received:', JSON.stringify(response.data, null, 2));

      if (response.data.errors) {
        console.log('⚠️ GraphQL errors:', response.data.errors);
      }

      if (response.data.data?.acceptInvite) {
        const inviteData = response.data.data.acceptInvite;
        console.log('📊 Invitation data analysis:');
        console.log('  - userExists:', inviteData.userExists);
        console.log('  - requiresUserSetup:', inviteData.requiresUserSetup);
        console.log('  - email:', inviteData.email);
        console.log('  - accessToken:', inviteData.accessToken ? 'Present' : 'Null');
        console.log('  - organizationId:', inviteData.organizationId);

        if (inviteData.userExists === false && inviteData.requiresUserSetup === true) {
          console.log('✅ CORRECT: Should show user setup form');
        } else {
          console.log('❌ INCORRECT: Should show setup form but got different response');
        }
      }

    } catch (error) {
      console.error('❌ AcceptInvite request failed:');
      console.error('  - Error type:', error.constructor.name);
      console.error('  - Message:', error.message);
      console.error('  - Code:', error.code);
      
      if (error.response) {
        console.error('  - Status:', error.response.status);
        console.error('  - Data:', error.response.data);
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.error('  - 🔥 CONNECTION REFUSED: Backend server might not be running on port 4000');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('  - ⏰ TIMEOUT: Request took too long');
      } else if (error.code === 'ENOTFOUND') {
        console.error('  - 🌐 DNS ERROR: Cannot resolve localhost');
      }
    }

    // Test 3: Test with invalid token
    console.log('\n3. Testing with invalid token...');
    try {
      const invalidResponse = await axios.post(GRAPHQL_URL, {
        query: acceptInviteMutation,
        variables: {
          token: 'invalid-token-123'
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      console.log('📤 Invalid token response:', JSON.stringify(invalidResponse.data, null, 2));
    } catch (error) {
      console.error('❌ Invalid token test failed:', error.message);
    }

    console.log('\n4. Testing complete flow with user creation...');
    try {
      console.log('📤 Sending acceptInvite with credentials...');
      const createUserResponse = await axios.post(GRAPHQL_URL, {
        query: acceptInviteMutation,
        variables: { 
          token: invitation.token,
          username: `testuser${Date.now()}`,
          password: 'TestPassword123!'
        }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      const createUserData = createUserResponse.data;
      console.log('✅ User creation response:', JSON.stringify(createUserData, null, 2));
      
      if (createUserData.data?.acceptInvite) {
        const inviteData = createUserData.data.acceptInvite;
        console.log('📊 User creation analysis:');
        console.log(`  - userExists: ${inviteData.userExists}`);
        console.log(`  - requiresUserSetup: ${inviteData.requiresUserSetup}`);
        console.log(`  - organizationId: ${inviteData.organizationId} (type: ${typeof inviteData.organizationId})`);
        console.log(`  - accessToken: ${inviteData.accessToken ? 'Present' : 'Null'}`);
        console.log(`  - user.id: ${inviteData.user?.id}`);
        
        if (typeof inviteData.organizationId === 'string') {
          console.log('✅ FIXED: organizationId is now a string!');
        } else {
          console.log('❌ ERROR: organizationId is still an object');
        }
      }
    } catch (error) {
      console.error('❌ User creation test failed:', error.message);
    }

    // Clean up
    await Invitation.deleteOne({ _id: invitation._id });
    console.log('\n✅ Cleaned up test invitation');

  } catch (error) {
    console.error('❌ Debug test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the debug test
debugInvitationNetwork(); 