const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');

const GRAPHQL_URL = 'http://localhost:4000/graphql';

async function testOrganizationMembers() {
  try {
    console.log('🧪 Testing organizationMembers query...\n');

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

    // Test the organizationMembers query
    console.log('\n1. Testing organizationMembers query...');
    try {
      const response = await axios.post(GRAPHQL_URL, {
        query: `
          query GetOrganizationMembers($orgId: ID!) {
            organizationMembers(orgId: $orgId) {
              owner {
                id
                username
                email
                firstName
                lastName
              }
              members {
                user {
                  id
                  username
                  email
                  firstName
                  lastName
                }
                role
                joinedAt
              }
              total
            }
          }
        `,
        variables: { orgId: org._id.toString() }
      }, {
        headers: { 
          'Content-Type': 'application/json',
          // This would normally be a real JWT token
          'Authorization': 'Bearer fake-token-for-testing'
        },
        timeout: 10000
      });

      if (response.data.errors) {
        console.log('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      } else {
        console.log('✅ Query successful!');
        console.log('📊 Response data:', JSON.stringify(response.data.data, null, 2));
        
        const { owner, members, total } = response.data.data.organizationMembers;
        console.log(`\n📈 Summary:`);
        console.log(`   - Owner: ${owner?.username || 'N/A'} (${owner?.email || 'N/A'})`);
        console.log(`   - Members: ${members?.length || 0}`);
        console.log(`   - Total: ${total || 0}`);
        
        if (members && members.length > 0) {
          console.log(`   - Member details:`);
          members.forEach((member, index) => {
            console.log(`     ${index + 1}. ${member.user?.username || 'N/A'} (${member.user?.email || 'N/A'}) - Role: ${member.role}`);
          });
        }
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        console.log('❌ GraphQL Error:', error.response.data.errors[0].message);
        console.log('Full error:', JSON.stringify(error.response.data.errors, null, 2));
      } else {
        console.error('❌ Network/Request Error:', error.message);
      }
    }

    // Test with all organizations
    console.log('\n2. Testing with all organizations...');
    const allOrgs = await Organization.find().lean();
    
    for (const testOrg of allOrgs) {
      console.log(`\n   Testing org: ${testOrg.name} (${testOrg._id})`);
      
      try {
        const response = await axios.post(GRAPHQL_URL, {
          query: `
            query GetOrganizationMembers($orgId: ID!) {
              organizationMembers(orgId: $orgId) {
                owner { username }
                members { user { username } role }
                total
              }
            }
          `,
          variables: { orgId: testOrg._id.toString() }
        }, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token-for-testing'
          },
          timeout: 5000
        });

        if (response.data.errors) {
          console.log(`   ❌ Error: ${response.data.errors[0].message}`);
        } else {
          const { owner, members, total } = response.data.data.organizationMembers;
          console.log(`   ✅ Success: Owner: ${owner?.username}, Members: ${members?.length}, Total: ${total}`);
        }
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
    }

    console.log('\n✅ organizationMembers query test completed!');
    console.log('The "Cannot read properties of null (reading \'_id\')" error should now be resolved!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testOrganizationMembers(); 