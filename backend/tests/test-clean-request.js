const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');

const GRAPHQL_URL = 'http://localhost:4000/graphql';

async function testCleanRequest() {
  try {
    console.log('🧪 Testing clean request without any auth headers/cookies...\n');

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

    // Test: Completely clean request (no auth headers, no cookies)
    console.log('\n1. Testing acceptInvite with completely clean request...');
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
          'Content-Type': 'application/json'
          // No Authorization header, no cookies
        },
        timeout: 10000
      });

      if (response.data.errors) {
        console.log('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      } else {
        console.log('✅ Query successful with clean request!');
        console.log('📊 Response data:', JSON.stringify(response.data.data, null, 2));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ 401 Unauthorized with clean request - This should not happen!');
        console.log('Response data:', error.response.data);
      } else if (error.response?.data?.errors) {
        console.log('❌ GraphQL Error:', error.response.data.errors[0].message);
      } else {
        console.error('❌ Network/Request Error:', error.message);
      }
    }

    console.log('\n✅ Clean request test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testCleanRequest(); 