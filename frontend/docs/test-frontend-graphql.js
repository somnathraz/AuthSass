const { ApolloClient, InMemoryCache, HttpLink, gql } = require('@apollo/client');
const fetch = require('node-fetch');

// Create a simple Apollo Client for testing
const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:4000/graphql',
    credentials: 'include',
  }),
  cache: new InMemoryCache(),
});

const ACCEPT_INVITE_MUTATION = gql`
  mutation AcceptInvite(
    $token: String!
    $username: String
    $password: String
  ) {
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

// Test GraphQL queries from frontend perspective
async function testFrontendGraphQL() {
  console.log('🧪 Testing Frontend GraphQL Queries\n');

  const baseUrl = 'http://localhost:4000/graphql';
  
  // These are example organization IDs - replace with real ones from your database
  const testOrganizations = [
    { id: '683331389617fe54bc139d1d', name: 'Personal Workspace' },
    { id: '68360b86d527fca3c7423b5b', name: 'demo1' },
    { id: '68360bc1d527fca3c7423be1', name: 'demo2' }
  ];

  try {
    // Test the exact query that the frontend GET_ORGANIZATION_APPS uses
    for (const org of testOrganizations) {
      console.log(`🔍 Testing frontend query for "${org.name}" (${org.id})...`);
      
      const frontendQuery = `
        query GetOrganizationApps(
          $organizationId: ID!
          $limit: Int
          $offset: Int
          $search: String
          $type: AppType
          $status: Status
        ) {
          apps(
            filter: {
              organizationId: $organizationId
              search: $search
              type: $type
              status: $status
            }
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

      const variables = {
        organizationId: org.id,
        limit: 20,
        offset: 0
      };

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In real frontend, this would use HTTP-only cookies
          'Cookie': 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODMzMzEzODk2MTdmZTU0YmMxMzlkMWIiLCJlbWFpbCI6InNvbW5hdGhraGFkYW5nYTgxMEBnbWFpbC5jb20iLCJvcmdJZCI6IjY4MzMzMTM4OTYxN2ZlNTRiYzEzOWQxZCIsImlhdCI6MTc0ODM3Mjc1MiwiZXhwIjoxNzQ4MzczNjUyfQ.8AtA5r4-Zd9J2KVNcG3WHMwjGLgJr2EZmy1eKJdEBkY'
        },
        body: JSON.stringify({ 
          query: frontendQuery,
          variables
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        console.log(`   ❌ GraphQL errors:`, data.errors);
        continue;
      }

      const apps = data.data?.apps?.apps || [];
      console.log(`   📱 Found ${apps.length} apps (total: ${data.data?.apps?.total || 0}):`);
      
      if (apps.length === 0) {
        console.log('   ✅ No apps found - correct for empty organizations');
      } else {
        apps.forEach((app, i) => {
          const isCorrectOrg = app.organization.id === org.id;
          const status = isCorrectOrg ? '✅' : '❌ WRONG ORG!';
          console.log(`     ${i + 1}. "${app.name}" in "${app.organization.name}" (${app.organization.id}) ${status}`);
        });
      }
      console.log('');
    }

    // Test without organization filter (should show all user's apps)
    console.log('🔍 Testing query WITHOUT organization filter...');
    
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
            }
          }
          total
        }
      }
    `;

    const allAppsResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODMzMzEzODk2MTdmZTU0YmMxMzlkMWIiLCJlbWFpbCI6InNvbW5hdGhraGFkYW5nYTgxMEBnbWFpbC5jb20iLCJvcmdJZCI6IjY4MzMzMTM4OTYxN2ZlNTRiYzEzOWQxZCIsImlhdCI6MTc0ODM3Mjc1MiwiZXhwIjoxNzQ4MzczNjUyfQ.8AtA5r4-Zd9J2KVNcG3WHMwjGLgJr2EZmy1eKJdEBkY'
      },
      body: JSON.stringify({ query: allAppsQuery })
    });

    const allAppsData = await allAppsResponse.json();
    
    if (allAppsData.errors) {
      console.log('❌ All apps query failed:', allAppsData.errors);
    } else {
      const allApps = allAppsData.data?.apps?.apps || [];
      console.log(`✅ Found ${allApps.length} total apps across all organizations:`);
      allApps.forEach((app, i) => {
        console.log(`   ${i + 1}. "${app.name}" in "${app.organization.name}" (${app.organization.id})`);
      });
    }

    console.log('\n🎯 CONCLUSION:');
    console.log('If the organization-specific queries show the correct apps for each org,');
    console.log('then the backend fix is working and the issue is in frontend caching/state management.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendGraphQL(); 