const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
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

async function testSimpleApps() {
  try {
    console.log('🔍 Testing Simple Apps Query...\n');
    
    // Test 1: Get just one app
    console.log('Test 1: Single app query');
    const singleAppResponse = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `query SingleApp($id: ID!) {
          app(id: $id) {
            id
            name
            organizationId
            organization {
              id
              name
              type
            }
          }
        }`,
        variables: { id: '6832d7f197a2286ea2024c26' }
      })
    });

    const singleResult = await singleAppResponse.json();
    
    if (singleResult.errors) {
      console.log('❌ Single app query FAILED:');
      singleResult.errors.forEach(error => {
        console.log(`   Error: ${error.message}`);
      });
    } else {
      console.log('✅ Single app query PASSED');
      console.log('   Data:', JSON.stringify(singleResult.data, null, 2));
    }

    console.log('\n---\n');

    // Test 2: Get apps with limit 1
    console.log('Test 2: Apps query with limit 1');
    const appsResponse = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `query Apps($limit: Int) {
          apps(limit: $limit) {
            apps {
              id
              name
              organizationId
              organization {
                id
                name
                type
              }
            }
            total
          }
        }`,
        variables: { limit: 1 }
      })
    });

    const appsResult = await appsResponse.json();
    
    if (appsResult.errors) {
      console.log('❌ Apps query FAILED:');
      appsResult.errors.forEach(error => {
        console.log(`   Error: ${error.message}`);
      });
    } else {
      console.log('✅ Apps query PASSED');
      console.log('   Data:', JSON.stringify(appsResult.data, null, 2));
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testSimpleApps(); 