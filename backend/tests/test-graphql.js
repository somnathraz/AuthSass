const mongoose = require('mongoose');
require('dotenv').config();

async function testUserOrganizations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');
    const OrgMembership = require('./src/models/OrgMembership');
    
    // Find a user to test with
    const user = await User.findOne();
    if (!user) {
      console.log('No users found');
      return;
    }
    
    console.log('Testing userOrganizations query for user:', user.email);
    
    // Simulate the GraphQL resolver logic
    const orgs = await Organization.find({ members: user._id }).populate('owner');
    console.log('Found organizations:', orgs.length);
    
    const results = await Promise.all(
      orgs.map(async (org) => {
        const mems = await OrgMembership.find({ org: org._id }).populate('user');
        
        return {
          id: org._id.toString(),
          name: org.name,
          owner: org.owner,
          createdAt: org.createdAt,
          type: org.type,
          imageUrl: org.imageUrl,
          members: mems.map((m) => ({
            user: m.user,
            role: m.role,
          })),
        };
      })
    );
    
    console.log('GraphQL userOrganizations result:');
    console.log(JSON.stringify(results, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testUserOrganizations(); 