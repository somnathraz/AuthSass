const axios = require('axios');

const GRAPHQL_URL = 'http://localhost:4000/graphql';

// Test the new invitation flow
async function testInvitationFlow() {
  try {
    console.log('🧪 Testing new invitation flow...\n');

    // First, let's create an invitation for a non-existing user
    const createInvitationMutation = `
      mutation CreateInvitation($input: CreateInvitationInput!) {
        createInvitation(input: $input) {
          success
          invitation {
            id
            email
            token
            type
            role
          }
          errors {
            message
            code
            field
          }
        }
      }
    `;

    // You'll need to replace these with actual values from your system
    const testEmail = 'newuser@example.com';
    const testOrgId = '6751b8b5b8b5b8b5b8b5b8b5'; // Replace with actual org ID
    
    console.log('1. Creating invitation for new user...');
    const createResponse = await axios.post(GRAPHQL_URL, {
      query: createInvitationMutation,
      variables: {
        input: {
          email: testEmail,
          type: 'ORGANIZATION',
          organizationId: testOrgId,
          role: 'MEMBER',
          message: 'Welcome to our organization!'
        }
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        // Add your auth token here if needed
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });

    if (createResponse.data.errors) {
      console.error('❌ Error creating invitation:', createResponse.data.errors);
      return;
    }

    const invitation = createResponse.data.data.createInvitation.invitation;
    console.log('✅ Invitation created:', {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token.substring(0, 20) + '...',
      type: invitation.type,
      role: invitation.role
    });

    // Now test the acceptInvite mutation without credentials (should return userExists: false)
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

    console.log('\n2. Testing acceptInvite without credentials (should return userExists: false)...');
    const acceptResponse1 = await axios.post(GRAPHQL_URL, {
      query: acceptInviteMutation,
      variables: {
        token: invitation.token
      }
    });

    if (acceptResponse1.data.errors) {
      console.error('❌ Error in first accept attempt:', acceptResponse1.data.errors);
    } else {
      const acceptData = acceptResponse1.data.data.acceptInvite;
      console.log('✅ First accept response:', {
        userExists: acceptData.userExists,
        requiresUserSetup: acceptData.requiresUserSetup,
        email: acceptData.email,
        hasAccessToken: !!acceptData.accessToken,
        hasUser: !!acceptData.user
      });
    }

    // Now test with credentials (should create user and return tokens)
    console.log('\n3. Testing acceptInvite with credentials (should create user)...');
    const acceptResponse2 = await axios.post(GRAPHQL_URL, {
      query: acceptInviteMutation,
      variables: {
        token: invitation.token,
        username: 'newuser123',
        password: 'password123'
      }
    });

    if (acceptResponse2.data.errors) {
      console.error('❌ Error in second accept attempt:', acceptResponse2.data.errors);
    } else {
      const acceptData = acceptResponse2.data.data.acceptInvite;
      console.log('✅ Second accept response:', {
        userExists: acceptData.userExists,
        requiresUserSetup: acceptData.requiresUserSetup,
        hasAccessToken: !!acceptData.accessToken,
        hasUser: !!acceptData.user,
        username: acceptData.user?.username,
        organizationId: acceptData.organizationId
      });
    }

    console.log('\n🎉 Invitation flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testInvitationFlow(); 