const mongoose = require('mongoose');
require('dotenv').config();

async function testAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = require('./src/models/User');
    const { generateTokens } = require('./src/utils/auth');
    
    // Find a user to test with
    const user = await User.findOne();
    if (!user) {
      console.log('No users found');
      return;
    }
    
    console.log('Testing with user:', user.email);
    
    // Generate a token for this user
    const { accessToken } = await generateTokens(user);
    console.log('Generated token:', accessToken.substring(0, 20) + '...');
    
    // Test the GraphQL query with the token
    const fetch = require('node-fetch');
    
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${accessToken}`
      },
      body: JSON.stringify({
        query: `
          query {
            userOrganizations {
              id
              name
              type
              imageUrl
              description
              userRole
              accessType
              joinedAt
              appCount
            }
          }
        `
      })
    });
    
    const result = await response.json();
    console.log('GraphQL Response:');
    console.log(JSON.stringify(result, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAuth(); 