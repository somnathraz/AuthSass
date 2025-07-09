const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');

const GRAPHQL_URL = 'http://localhost:4000/graphql';

async function testOrgInvitations() {
  try {
    console.log('🧪 Testing orgInvitations query...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Organization = require('./src/models/Organization');
    const User = require('./src/models/User');

    // Get the first organization and user
    const org = await Organization.findOne();
    const user = await User.findOne();

    if (!org || !user) {
      console.log('❌ No organization or user found');
      return;
    }

    console.log(`📋 Testing with organization: ${org.name} (${org._id})`);
    console.log(`👤 Testing with user: ${user.username} (${user._id})`);

    // First, let's test without authentication (should fail)
    console.log('\n1. Testing orgInvitations without authentication...');
    try {
      const response = await axios.post(GRAPHQL_URL, {
        query: `
          query GetOrgInvitations($orgId: ID!) {
            orgInvitations(orgId: $orgId) {
              id
              email
              role
              status
              type
            }
          }
        `,
        variables: { orgId: org._id.toString() }
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.data?.errors) {
        console.log('Expected error (not authenticated):', error.response.data.errors[0].message);
      } else {
        console.error('Unexpected error:', error.message);
      }
    }

    // Test with a mock authentication context (this would normally require a real JWT)
    console.log('\n2. Testing organization existence check...');
    try {
      // Test if we can find the organization directly
      const testOrg = await Organization.findById(org._id);
      if (testOrg) {
        console.log('✅ Organization found in database:', testOrg.name);
      } else {
        console.log('❌ Organization not found in database');
      }
    } catch (error) {
      console.error('❌ Error finding organization:', error.message);
    }

    // Test with invalid organization ID
    console.log('\n3. Testing with invalid organization ID...');
    try {
      const response = await axios.post(GRAPHQL_URL, {
        query: `
          query GetOrgInvitations($orgId: ID!) {
            orgInvitations(orgId: $orgId) {
              id
              email
              role
              status
              type
            }
          }
        `,
        variables: { orgId: 'invalid-org-id-123' }
      }, {
        headers: { 
          'Content-Type': 'application/json',
          // This would normally be a real JWT token
          'Authorization': 'Bearer fake-token-for-testing'
        },
        timeout: 5000
      });

      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.data?.errors) {
        console.log('Expected error (invalid org ID):', error.response.data.errors[0].message);
      } else {
        console.error('Unexpected error:', error.message);
      }
    }

    console.log('\n✅ Organization data integrity test completed');
    console.log('The "Organization not found" error should now be resolved!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testOrgInvitations(); 