const mongoose = require('mongoose');
require('dotenv').config();

async function testMyAppsQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('./src/models/User');
    const AppMembership = require('./src/models/AppMembership');
    
    // Find a user
    const user = await User.findOne({}).lean();
    if (!user) {
      console.log('❌ No users found');
      return;
    }
    
    console.log(`👤 Testing with user: ${user.username} (${user._id})`);
    
    // Check app memberships
    const memberships = await AppMembership.find({
      user: user._id,
      status: 'ACTIVE'
    }).populate('app').lean();
    
    console.log(`📱 Found ${memberships.length} app memberships`);
    
    memberships.forEach((membership, index) => {
      console.log(`App ${index + 1}:`, {
        membershipId: membership._id,
        appId: membership.app?._id,
        appName: membership.app?.name,
        appOrgId: membership.app?.organizationId,
        role: membership.role,
        status: membership.status
      });
    });
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testMyAppsQuery(); 