const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Test user credentials
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

console.log('Testing FULL app creation with all previously problematic fields...');
console.log('Generated token:', token.substring(0, 20) + '...');

const mutation = `
  mutation CreateApp($input: CreateAppInput!) {
    createApp(input: $input) {
      success
      app {
        id
        name
        description
        type
        organizationId
        owner {
          id
          username
          email
        }
        members {
          id
          username
          email
        }
        memberCount
        userRole
        createdAt
      }
      errors {
        message
        code
        field
      }
    }
  }
`;

const variables = {
  input: {
    name: "Full Featured App Test",
    description: "Testing all fields that previously caused GraphQL errors",
    type: "WEB",
    organizationId: testUser.orgId
  }
};

fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ 
    query: mutation,
    variables: variables
  })
})
.then(response => response.json())
.then(data => {
  console.log('GraphQL Response:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.data && data.data.createApp && data.data.createApp.success) {
    console.log('\n✅ SUCCESS! All fields are working correctly:');
    console.log('- organizationId:', data.data.createApp.app.organizationId);
    console.log('- owner.id:', data.data.createApp.app.owner.id);
    console.log('- app.id:', data.data.createApp.app.id);
    console.log('\nNo more GraphQL serialization errors! 🎉');
  }
})
.catch(error => {
  console.error('Error:', error);
}); 