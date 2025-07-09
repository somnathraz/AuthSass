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

console.log('Testing app creation with minimal owner fields...');
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
    name: "Debug App Test",
    description: "Testing app creation with minimal owner fields",
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
    console.log('\n✅ SUCCESS! App created with minimal owner fields');
  } else if (data.errors) {
    console.log('\n❌ ERRORS found:');
    data.errors.forEach(error => {
      console.log(`- ${error.message}`);
      console.log(`  Path: ${error.path ? error.path.join(' -> ') : 'N/A'}`);
    });
  }
})
.catch(error => {
  console.error('Error:', error);
}); 