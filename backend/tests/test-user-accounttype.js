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

async function testAccountType() {
  console.log('🧪 Testing User AccountType Field Resolver...\n');

  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          query TestAccountType {
            me {
              id
              username
              email
              accountType
            }
          }
        `
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.log('❌ Test FAILED:');
      result.errors.forEach(error => {
        console.log(`   Error: ${error.message}`);
        if (error.path) console.log(`   Path: ${error.path.join(' -> ')}`);
      });
    } else {
      console.log('✅ Test PASSED');
      console.log('Result:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Test FAILED:', error.message);
  }
}

testAccountType(); 