const mongoose = require('mongoose');
require('dotenv').config();

async function getFreshToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = require('../src/models/User');
    const { generateTokens } = require('../src/utils/auth');
    
    // Find a user to test with
    const user = await User.findOne();
    if (!user) {
      console.log('No users found');
      return;
    }
    
    // Generate a token for this user
    const { accessToken } = await generateTokens(user);
    console.log(accessToken);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getFreshToken(); 