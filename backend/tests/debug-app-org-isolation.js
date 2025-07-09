const fetch = require('node-fetch');

// Test data - replace with your actual values
const baseUrl = 'http://localhost:4000/graphql';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODMzMzEzODk2MTdmZTU0YmMxMzlkMWIiLCJlbWFpbCI6InNvbW5hdGhra2FkYW5nYTgxMEBnbWFpbC5jb20iLCJvcmdJZCI6IjY4MzMzMTM4OTYxN2ZlNTRiYzEzOWQxZCIsImlhdCI6MTc0ODM3Mjc1MiwiZXhwIjoxNzQ4MzczNjUyfQ.8AtA5r4-Zd9J2KVNcG3WHMwjGLgJr2EZmy1eKJdEBkY';

// Helper function to make GraphQL requests
async function makeGraphQLRequest(query, variables = {}) {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`
    },
    body: JSON.stringify({ query, variables })
  });
  
  return await response.json();
}

async function debugAppIsolation() {
  console.log('🔍 Debugging App Organization Isolation Issue\n');

  try {
    // 1. Get user's organizations first
    console.log('1. Getting user organizations...');
    const orgsQuery = `
      query GetUserOrganizations {
        userOrganizations {
          id
          name
          type
          userRole
          appCount
        }
      }
    `;

    const orgsData = await makeGraphQLRequest(orgsQuery);
    
    if (orgsData.errors) {
      console.error('❌ Organizations query failed:', orgsData.errors);
      return;
    }

    const organizations = orgsData.data.userOrganizations;
    console.log(`✅ Found ${organizations.length} organizations:`);
    organizations.forEach((org, i) => {
      console.log(`   ${i + 1}. ${org.name} (${org.type}) - Role: ${org.userRole} - Apps: ${org.appCount} - ID: ${org.id}`);
    });
    console.log('');

    // 2. Test apps query WITHOUT organization filter (should show all user's apps)
    console.log('2. Getting ALL apps (no org filter)...');
    const allAppsQuery = `
      query GetAllApps {
        apps(limit: 20) {
          apps {
            id
            name
            organizationId
            organization {
              id
              name
              type
            }
            owner {
              id
              username
            }
            userRole
          }
          total
        }
      }
    `;

    const allAppsData = await makeGraphQLRequest(allAppsQuery);
    
    if (allAppsData.errors) {
      console.error('❌ All apps query failed:', allAppsData.errors);
      return;
    }

    const allApps = allAppsData.data.apps.apps;
    console.log(`✅ Found ${allApps.length} total apps:`);
    allApps.forEach((app, i) => {
      console.log(`   ${i + 1}. "${app.name}" in org "${app.organization.name}" (${app.organization.id})`);
    });
    console.log('');

    // 3. Test apps query WITH specific organization filter for each org
    for (const org of organizations) {
      console.log(`3.${organizations.indexOf(org) + 1}. Getting apps for organization "${org.name}" (${org.id})...`);
      
      const orgAppsQuery = `
        query GetOrgApps($organizationId: ID!) {
          apps(filter: { organizationId: $organizationId }, limit: 20) {
            apps {
              id
              name
              organizationId
              organization {
                id
                name
                type
              }
              owner {
                id
                username
              }
              userRole
            }
            total
          }
        }
      `;

      const orgAppsData = await makeGraphQLRequest(orgAppsQuery, { organizationId: org.id });
      
      if (orgAppsData.errors) {
        console.error(`❌ Org apps query failed for ${org.name}:`, orgAppsData.errors);
        continue;
      }

      const orgApps = orgAppsData.data.apps.apps;
      console.log(`   📱 Found ${orgApps.length} apps in "${org.name}" (expected: ${org.appCount}):`);
      
      if (orgApps.length === 0) {
        console.log('   (No apps in this organization)');
      } else {
        orgApps.forEach((app, i) => {
          const isCorrectOrg = app.organization.id === org.id;
          const status = isCorrectOrg ? '✅' : '❌ WRONG ORG!';
          console.log(`     ${i + 1}. "${app.name}" - Org: "${app.organization.name}" (${app.organization.id}) ${status}`);
        });
      }
      
      // Check if count matches expected
      if (orgApps.length !== org.appCount) {
        console.log(`   ⚠️  MISMATCH: Expected ${org.appCount} apps but found ${orgApps.length}`);
      }
      console.log('');
    }

    // 4. Test the same queries that the frontend likely uses (with frontend-style queries)
    console.log('4. Testing frontend-style organization apps queries...');
    
    for (const org of organizations) {
      console.log(`4.${organizations.indexOf(org) + 1}. Frontend query for "${org.name}"...`);
      
      // This is similar to what GET_ORGANIZATION_APPS does
      const frontendQuery = `
        query GetOrganizationApps($organizationId: ID!, $limit: Int, $offset: Int) {
          apps(
            filter: { organizationId: $organizationId }
            limit: $limit
            offset: $offset
          ) {
            apps {
              id
              name
              description
              type
              organizationId
              organization {
                id
                name
                type
              }
              owner {
                id
                username
                email
              }
              userRole
              createdAt
            }
            total
            hasNextPage
            hasPreviousPage
          }
        }
      `;

      const frontendData = await makeGraphQLRequest(frontendQuery, { 
        organizationId: org.id,
        limit: 20,
        offset: 0
      });
      
      if (frontendData.errors) {
        console.error(`❌ Frontend query failed for ${org.name}:`, frontendData.errors);
        continue;
      }

      const frontendApps = frontendData.data.apps.apps;
      console.log(`   🖥️  Frontend found ${frontendApps.length} apps in "${org.name}":`);
      
      frontendApps.forEach((app, i) => {
        const isCorrectOrg = app.organization.id === org.id;
        const status = isCorrectOrg ? '✅' : '❌ WRONG ORG!';
        console.log(`     ${i + 1}. "${app.name}" - Org: "${app.organization.name}" (${app.organization.id}) ${status}`);
      });
      console.log('');
    }

    // 5. Analysis and recommendations
    console.log('📊 FINAL ANALYSIS:');
    
    let issuesFound = false;
    let totalAppsFound = 0;
    
    for (const org of organizations) {
      const orgAppsData = await makeGraphQLRequest(`
        query GetOrgApps($organizationId: ID!) {
          apps(filter: { organizationId: $organizationId }, limit: 50) {
            apps {
              id
              name
              organizationId
              organization { id name }
            }
            total
          }
        }
      `, { organizationId: org.id });
      
      const orgApps = orgAppsData.data?.apps?.apps || [];
      totalAppsFound += orgApps.length;
      
      const wrongApps = orgApps.filter(app => app.organization.id !== org.id);
      if (wrongApps.length > 0) {
        issuesFound = true;
        console.log(`❌ ISOLATION ISSUE: Organization "${org.name}" shows ${wrongApps.length} apps from other organizations:`);
        wrongApps.forEach(app => {
          console.log(`   - "${app.name}" (actually belongs to: ${app.organization.name})`);
        });
      }
      
      if (orgApps.length !== org.appCount) {
        issuesFound = true;
        console.log(`❌ COUNT MISMATCH: "${org.name}" reports ${org.appCount} apps but query returns ${orgApps.length}`);
      }
    }

    console.log(`\n📈 SUMMARY:`);
    console.log(`- Total organizations: ${organizations.length}`);
    console.log(`- Total apps across all orgs: ${totalAppsFound}`);
    console.log(`- Expected total (sum of appCounts): ${organizations.reduce((sum, org) => sum + org.appCount, 0)}`);
    
    if (!issuesFound) {
      console.log('✅ No organization isolation issues detected!');
    } else {
      console.log('❌ Organization isolation issues found! Check the backend app resolver logic.');
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

// Run the debug
debugAppIsolation(); 