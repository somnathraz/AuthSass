const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./src/models/User');

async function checkUserRoles() {
  try {
    console.log('Checking user data in database...');
    
    const users = await User.find({}).select('username email role firstName lastName').lean();
    
    console.log('Found users:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}`);
      console.log(`  Username: ${user.username || 'MISSING'}`);
      console.log(`  Email: ${user.email || 'MISSING'}`);
      console.log(`  Role: ${user.role || 'MISSING'}`);
      console.log(`  First Name: ${user.firstName || 'MISSING'}`);
      console.log(`  Last Name: ${user.lastName || 'MISSING'}`);
      console.log('');
    });
    
    const usersWithMissingFields = users.filter(user => !user.username || !user.role);
    if (usersWithMissingFields.length > 0) {
      console.log('⚠️  Users with missing required fields:');
      usersWithMissingFields.forEach(user => {
        const missing = [];
        if (!user.username) missing.push('username');
        if (!user.role) missing.push('role');
        console.log(`- ${user.email}: missing ${missing.join(', ')}`);
      });
    } else {
      console.log('✅ All users have required fields set');
    }
    
  } catch (error) {
    console.error('Error checking user data:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUserRoles(); 