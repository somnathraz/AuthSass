/**
 * Authentication Flow Test
 * 
 * Simple test to verify the new authentication implementation works with the backend
 */

const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client');
const fetch = require('cross-fetch');

// Create Apollo Client
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
  fetch: fetch,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

// Test queries and mutations
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      accessToken
      refreshToken
      user {
        id
        username
        email
        role
        status
        accountType
        organizationId
        organization {
          id
          name
          type
        }
        requirePasswordReset
        isVerified
        profileImage
        firstName
        lastName
        fullName
        createdAt
        updatedAt
      }
      requirePasswordReset
      expiresIn
      tokenType
      errors {
        message
        code
        field
      }
    }
  }
`;

const GET_ME = gql`
  query GetMe {
    me {
      id
      username
      email
      role
      status
      accountType
      organizationId
      organization {
        id
        name
        type
        description
        imageUrl
        website
        status
        memberCount
        userRole
        createdAt
        updatedAt
      }
      requirePasswordReset
      isVerified
      lastLoginAt
      profileImage
      firstName
      lastName
      fullName
      timezone
      locale
      isOnline
      displayName
      createdAt
      updatedAt
    }
  }
`;

const HEALTH_CHECK = gql`
  query HealthCheck {
    healthCheck {
      status
      timestamp
      googleClientConfigured
      message
    }
  }
`;

async function testAuthFlow() {
  console.log('🔐 Testing Authentication Flow...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResult = await client.query({
      query: HEALTH_CHECK,
    });
    
    if (healthResult.data?.healthCheck?.status === 'OK') {
      console.log('✅ Health Check: PASSED');
      console.log(`   Status: ${healthResult.data.healthCheck.status}`);
      console.log(`   Google Client: ${healthResult.data.healthCheck.googleClientConfigured ? 'Configured' : 'Not Configured'}`);
    } else {
      console.log('❌ Health Check: FAILED');
      console.log('   Response:', healthResult.data);
    }

    // Test 2: Login with test credentials
    console.log('\n2️⃣ Testing Login...');
    const loginInput = {
      email: 'testuser@example.com', // Try different test user
      password: 'password123',
      rememberMe: true,
    };

    const loginResult = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: { input: loginInput },
    });

    if (loginResult.data?.login?.success) {
      console.log('✅ Login: PASSED');
      console.log(`   User: ${loginResult.data.login.user.username} (${loginResult.data.login.user.email})`);
      console.log(`   Role: ${loginResult.data.login.user.role}`);
      console.log(`   Organization: ${loginResult.data.login.user.organization?.name || 'None'}`);
      console.log(`   Token Type: ${loginResult.data.login.tokenType}`);
      console.log(`   Expires In: ${loginResult.data.login.expiresIn}s`);

      // Store token for next test
      const accessToken = loginResult.data.login.accessToken;

      // Test 3: Get Me with token
      console.log('\n3️⃣ Testing Get Me (with token)...');
      
      // Create authenticated client
      const authClient = new ApolloClient({
        link: createHttpLink({
          uri: 'http://localhost:4000/graphql',
          fetch: fetch,
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        }),
        cache: new InMemoryCache(),
      });

      const meResult = await authClient.query({
        query: GET_ME,
      });

      if (meResult.data?.me?.id) {
        console.log('✅ Get Me: PASSED');
        console.log(`   User ID: ${meResult.data.me.id}`);
        console.log(`   Username: ${meResult.data.me.username}`);
        console.log(`   Email: ${meResult.data.me.email}`);
        console.log(`   Role: ${meResult.data.me.role}`);
        console.log(`   Status: ${meResult.data.me.status}`);
        console.log(`   Account Type: ${meResult.data.me.accountType}`);
        console.log(`   Verified: ${meResult.data.me.isVerified}`);
        console.log(`   Organization: ${meResult.data.me.organization?.name || 'None'}`);
      } else {
        console.log('❌ Get Me: FAILED');
        console.log('   Response:', meResult.data);
        console.log('   Errors:', meResult.errors);
      }

    } else {
      console.log('❌ Login: FAILED');
      console.log('   Errors:', loginResult.data?.login?.errors);
      console.log('   GraphQL Errors:', loginResult.errors);
      
      // Try alternative credentials
      console.log('\n🔄 Trying alternative credentials...');
      const altLoginInput = {
        email: 'user@example.com',
        password: 'password123',
        rememberMe: true,
      };

      const altLoginResult = await client.mutate({
        mutation: LOGIN_MUTATION,
        variables: { input: altLoginInput },
      });

      if (altLoginResult.data?.login?.success) {
        console.log('✅ Alternative Login: PASSED');
        console.log(`   User: ${altLoginResult.data.login.user.username} (${altLoginResult.data.login.user.email})`);
      } else {
        console.log('❌ Alternative Login: ALSO FAILED');
        console.log('   This suggests no test users exist in the database');
        console.log('   Please create test users or start with a fresh database');
      }
    }

  } catch (error) {
    console.error('❌ Test Failed with Error:', error.message);
    if (error.graphQLErrors) {
      console.error('   GraphQL Errors:', error.graphQLErrors);
    }
    if (error.networkError) {
      console.error('   Network Error:', error.networkError);
    }
  }
}

// Run the test
testAuthFlow()
  .then(() => {
    console.log('\n🎉 Authentication Flow Test Complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test Suite Failed:', error);
    process.exit(1);
  }); 