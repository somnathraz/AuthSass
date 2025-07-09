const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('../src/models/User');

async function makeUserAdmin() {
  try {
    const userId = '68321c5edab906b56003f5ad';
    const email = 'somnathkhadanga810@gmail.com';
    
    console.log('🔍 Making user admin...');
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`Current user: ${user.username} (${user.email})`);
    console.log(`Current role: ${user.role}`);
    
    // Update user role to ADMIN
    const result = await User.findByIdAndUpdate(
      userId,
      { role: 'ADMIN' },
      { new: true }
    );
    
    console.log(`✅ Updated user role to: ${result.role}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

makeUserAdmin(); 