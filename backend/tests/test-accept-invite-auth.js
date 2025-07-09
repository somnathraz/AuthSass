const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');

const GRAPHQL_URL = 'http://localhost:4000/graphql';

async function testAcceptInviteAuth() {
  try {
    console.log('🧪 Testing acceptInvite authentication...\n');

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

    // Test 1: acceptInvite without authentication (should work)
    console.log('\n1. Testing acceptInvite without authentication...');
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
          // No Authorization header - should work for invitations
        },
        timeout: 10000
      });

      if (response.data.errors) {
        console.log('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      } else {
        console.log('✅ Query successful!');
        console.log('📊 Response data:', JSON.stringify(response.data.data, null, 2));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ 401 Unauthorized - This is the problem!');
        console.log('Response headers:', error.response.headers);
        console.log('Response data:', error.response.data);
      } else if (error.response?.data?.errors) {
        console.log('❌ GraphQL Error:', error.response.data.errors[0].message);
      } else {
        console.error('❌ Network/Request Error:', error.message);
      }
    }

    // Test 2: Check if the endpoint requires authentication at all
    console.log('\n2. Testing basic GraphQL endpoint access...');
    try {
      const response = await axios.post(GRAPHQL_URL, {
        query: `
          query {
            __schema {
              types {
                name
              }
            }
          }
        `
      }, {
        headers: { 
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data.errors) {
        console.log('❌ Schema introspection failed:', response.data.errors[0].message);
      } else {
        console.log('✅ Schema introspection successful - endpoint is accessible');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ 401 on schema introspection - endpoint requires auth');
      } else {
        console.log('❌ Schema introspection error:', error.message);
      }
    }

    // Test 3: Test with fake auth header
    console.log('\n3. Testing acceptInvite with fake auth header...');
    try {
      const response = await axios.post(GRAPHQL_URL, {
        query: `
          mutation AcceptInvite($token: String!) {
            acceptInvite(token: $token) {
              userExists
              requiresUserSetup
              email
            }
          }
        `,
        variables: { token: invitation.token }
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-token-for-testing'
        },
        timeout: 10000
      });

      if (response.data.errors) {
        console.log('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      } else {
        console.log('✅ Query successful with fake auth!');
        console.log('📊 Response data:', JSON.stringify(response.data.data, null, 2));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ 401 even with fake auth header');
      } else if (error.response?.data?.errors) {
        console.log('❌ GraphQL Error with fake auth:', error.response.data.errors[0].message);
      } else {
        console.error('❌ Error with fake auth:', error.message);
      }
    }

    console.log('\n✅ acceptInvite authentication test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testAcceptInviteAuth(); 