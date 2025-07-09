const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');

const GRAPHQL_URL = 'http://localhost:4000/graphql';

async function testGraphQLMyApps() {
  try {
    console.log('🧪 Testing GraphQL myApps query...\n');

    // Connect to database to get a user
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('./src/models/User');
    const user = await User.findOne({}).lean();
    
    if (!user) {
      console.log('❌ No users found');
      return;
    }

    console.log(`👤 Testing with user: ${user.username} (${user._id})`);

    // Generate a token for this user (simplified)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('🔑 Generated test token');

    // Test the GraphQL myApps query
    console.log('\n1. Testing myApps GraphQL query...');
    try {
      const response = await axios.post(GRAPHQL_URL, {
        query: `
          query GetMyApps {
            myApps {
              id
              name
              description
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
          }
        `
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      });

      if (response.data.errors) {
        console.log('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      } else {
        console.log('✅ Query successful!');
        console.log('📊 Response data:', JSON.stringify(response.data.data, null, 2));
        
        const myApps = response.data.data.myApps;
        console.log(`\n📱 myApps array length: ${myApps ? myApps.length : 'null/undefined'}`);
        console.log(`📱 myApps type: ${typeof myApps}`);
        console.log(`📱 myApps is array: ${Array.isArray(myApps)}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ 401 Unauthorized');
      } else if (error.response?.data?.errors) {
        console.log('❌ GraphQL Error:', error.response.data.errors[0].message);
      } else {
        console.error('❌ Network/Request Error:', error.message);
      }
    }

    console.log('\n✅ GraphQL myApps test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testGraphQLMyApps(); 