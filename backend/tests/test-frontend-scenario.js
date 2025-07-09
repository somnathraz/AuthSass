const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');

const GRAPHQL_URL = 'http://localhost:4000/graphql';

async function testFrontendScenario() {
  try {
    console.log('🧪 Testing frontend scenario with invalid cookies...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Invitation = require('./src/models/Invitation');

    // Find an existing invitation
    const invitation = await Invitation.findOne({ status: 'PENDING' });
    
    if (!invitation) {
      console.log('❌ No pending invitations found');
      return;
    }

    console.log(`📋 Testing with invitation: ${invitation.email} (${invitation.token.substring(0, 20)}...)`);

    // Test 1: Simulate frontend with invalid cookies (this is the real scenario)
    console.log('\n1. Testing acceptInvite with invalid cookies (frontend scenario)...');
    try {
      const response = await axios.post(GRAPHQL_URL, {
        query: `
          mutation AcceptInvite($token: String!) {
            acceptInvite(token: $token) {
              accessToken
              refreshToken
              user {
                id
                username
                email
              }
              organizationId
              appId
              requiresUserSetup
              userExists
              email
            }
          }
        `,
        variables: { token: invitation.token }
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': 'token=invalid-expired-token; refreshToken=invalid-refresh-token'
        },
        timeout: 10000
      });

      if (response.data.errors) {
        console.log('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      } else {
        console.log('✅ Query successful with invalid cookies!');
        console.log('📊 Response data:', JSON.stringify(response.data.data, null, 2));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ 401 Unauthorized with invalid cookies - This is the problem!');
        console.log('Response headers:', error.response.headers);
        console.log('Response data:', error.response.data);
      } else if (error.response?.data?.errors) {
        console.log('❌ GraphQL Error:', error.response.data.errors[0].message);
      } else {
        console.error('❌ Network/Request Error:', error.message);
      }
    }

    // Test 2: Test with credentials to make sure the full flow works
    console.log('\n2. Testing acceptInvite with credentials and invalid cookies...');
    try {
      const response = await axios.post(GRAPHQL_URL, {
        query: `
          mutation AcceptInvite($token: String!, $username: String, $password: String) {
            acceptInvite(token: $token, username: $username, password: $password) {
              accessToken
              refreshToken
              user {
                id
                username
                email
              }
              organizationId
              appId
              requiresUserSetup
              userExists
              email
            }
          }
        `,
        variables: { 
          token: invitation.token,
          username: 'testuser123',
          password: 'password123'
        }
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': 'token=invalid-expired-token; refreshToken=invalid-refresh-token'
        },
        timeout: 10000
      });

      if (response.data.errors) {
        console.log('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      } else {
        console.log('✅ User creation successful with invalid cookies!');
        console.log('📊 Response data:', JSON.stringify(response.data.data, null, 2));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ 401 Unauthorized during user creation');
      } else if (error.response?.data?.errors) {
        console.log('❌ GraphQL Error during user creation:', error.response.data.errors[0].message);
      } else {
        console.error('❌ Error during user creation:', error.message);
      }
    }

    console.log('\n✅ Frontend scenario test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testFrontendScenario(); 