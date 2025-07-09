const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Test user credentials (now admin)
const testUser = {
  email: 'somnathkhadanga810@gmail.com',
  userId: '68321c5edab906b56003f5ad',
  orgId: '68321c5edab906b56003f5af'
};

// Generate a test token
const token = jwt.sign(
  { 
    userId: testUser.userId, 
    email: testUser.email,
    orgId: testUser.orgId
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function testInvitationCreation() {
  console.log('🧪 Testing Invitation Creation...\n');

  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          mutation CreateInvitation($input: CreateInvitationInput!) {
            createInvitation(input: $input) {
              success
              invitation {
                id
                email
                type
                status
                role
                createdAt
                expiresAt
              }
              errors {
                message
                field
              }
            }
          }
        `,
        variables: {
          input: {
            email: `test.invite.${Date.now()}@example.com`,
            type: 'ORGANIZATION',
            role: 'MEMBER',
            organizationId: testUser.orgId
          }
        }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.log('❌ Test FAILED:');
      result.errors.forEach(error => {
        console.log(`   Error: ${error.message}`);
        if (error.path) console.log(`   Path: ${error.path.join(' -> ')}`);
        if (error.extensions) console.log(`   Extensions:`, error.extensions);
      });
    } else {
      console.log('✅ Test PASSED');
      console.log('Result:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Test FAILED:', error.message);
  }
}

testInvitationCreation(); 