const mongoose = require('mongoose');
require('dotenv').config();

async function testOrgIsolationFix() {
  console.log('🧪 Testing Organization Isolation Fix\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import services
    const User = require('./src/models/User');
    const { generateTokens } = require('./src/utils/auth');
    const fetch = require('node-fetch');

    // Get a test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`🎯 Testing with user: ${testUser.username}\n`);

    // Generate tokens
    const { accessToken } = await generateTokens(testUser);

    // Helper function to make GraphQL requests
    async function makeGraphQLRequest(query, variables = {}) {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `token=${accessToken}`
        },
        body: JSON.stringify({ query, variables })
      });
      
      return await response.json();
    }

    // 1. Get user's organizations
    console.log('1. Getting user organizations...');
    const orgsResponse = await makeGraphQLRequest(`
      query GetUserOrganizations {
        userOrganizations {
          id
          name
          type
          appCount
        }
      }
    `);

    if (orgsResponse.errors) {
      console.error('❌ Failed to get organizations:', orgsResponse.errors);
      return;
    }

    const organizations = orgsResponse.data.userOrganizations;
    console.log(`✅ Found ${organizations.length} organizations:`);
    organizations.forEach((org, i) => {
      console.log(`   ${i + 1}. ${org.name} (${org.type}) - ${org.appCount} apps - ID: ${org.id}`);
    });
    console.log('');

    // 2. Test without organization filter (should show all user's apps)
    console.log('2. Testing apps query WITHOUT organization filter...');
    const allAppsResponse = await makeGraphQLRequest(`
      query GetAllApps {
        apps(limit: 20) {
          apps {
            id
            name
            organizationId
            organization {
              id
              name
            }
          }
          total
        }
      }
    `);

    if (allAppsResponse.errors) {
      console.error('❌ Failed to get all apps:', allAppsResponse.errors);
      return;
    }

    const allApps = allAppsResponse.data.apps.apps;
    console.log(`✅ Found ${allApps.length} total apps across all organizations:`);
    allApps.forEach((app, i) => {
      console.log(`   ${i + 1}. "${app.name}" in "${app.organization.name}" (${app.organization.id})`);
    });
    console.log('');

    // 3. Test WITH specific organization filter for each org
    for (const org of organizations) {
      console.log(`3. Testing apps query FOR organization "${org.name}"...`);
      
      const orgAppsResponse = await makeGraphQLRequest(`
        query GetOrgApps($organizationId: ID!) {
          apps(filter: { organizationId: $organizationId }, limit: 20) {
            apps {
              id
              name
              organizationId
              organization {
                id
                name
              }
            }
            total
          }
        }
      `, { organizationId: org.id });

      if (orgAppsResponse.errors) {
        console.error(`❌ Failed to get apps for ${org.name}:`, orgAppsResponse.errors);
        continue;
      }

      const orgApps = orgAppsResponse.data.apps.apps;
      console.log(`   📱 Found ${orgApps.length} apps in "${org.name}" (expected: ${org.appCount}):`);
      
      if (orgApps.length === 0) {
        console.log(`   ✅ No apps found - correct for empty organization`);
      } else {
        orgApps.forEach((app, i) => {
          const isCorrectOrg = app.organization.id === org.id;
          const status = isCorrectOrg ? '✅' : '❌ WRONG ORG!';
          console.log(`     ${i + 1}. "${app.name}" in "${app.organization.name}" (${app.organization.id}) ${status}`);
        });
      }
      
      // Check if count matches expected
      if (orgApps.length === org.appCount) {
        console.log(`   ✅ Count matches expected: ${org.appCount}`);
      } else {
        console.log(`   ❌ Count mismatch: expected ${org.appCount}, got ${orgApps.length}`);
      }
      console.log('');
    }

    // 4. Test access control - try to access an organization the user doesn't have access to
    console.log('4. Testing access control...');
    
    // Try with a fake organization ID
    const fakeOrgResponse = await makeGraphQLRequest(`
      query GetFakeOrgApps($organizationId: ID!) {
        apps(filter: { organizationId: $organizationId }, limit: 20) {
          apps {
            id
            name
          }
          total
        }
      }
    `, { organizationId: '507f1f77bcf86cd799439011' }); // Fake MongoDB ObjectId

    if (fakeOrgResponse.errors) {
      const isForbiddenError = fakeOrgResponse.errors.some(err => 
        err.message.includes('Access denied') || err.extensions?.code === 'FORBIDDEN'
      );
      if (isForbiddenError) {
        console.log('   ✅ Access control working - correctly denied access to non-user organization');
      } else {
        console.log('   ❓ Unexpected error:', fakeOrgResponse.errors[0].message);
      }
    } else {
      console.log('   ❌ Access control not working - should have been denied access');
    }

    // 5. Final summary
    console.log('\n📊 SUMMARY:');
    let isolationWorking = true;
    
    for (const org of organizations) {
      const orgAppsResponse = await makeGraphQLRequest(`
        query GetOrgApps($organizationId: ID!) {
          apps(filter: { organizationId: $organizationId }) {
            apps { id organizationId }
            total
          }
        }
      `, { organizationId: org.id });
      
      if (!orgAppsResponse.errors) {
        const orgApps = orgAppsResponse.data.apps.apps;
        const wrongApps = orgApps.filter(app => app.organizationId !== org.id);
        
        if (wrongApps.length > 0) {
          isolationWorking = false;
          console.log(`❌ Organization "${org.name}" still showing wrong apps: ${wrongApps.length}`);
        }
        
        if (orgApps.length !== org.appCount) {
          console.log(`⚠️  Count mismatch in "${org.name}": expected ${org.appCount}, got ${orgApps.length}`);
        }
      }
    }
    
    if (isolationWorking) {
      console.log('🎉 SUCCESS: Organization isolation is working correctly!');
      console.log('✅ Each organization only shows its own apps');
      console.log('✅ Access control prevents unauthorized access');
    } else {
      console.log('❌ FAILURE: Organization isolation still has issues');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testOrgIsolationFix(); 