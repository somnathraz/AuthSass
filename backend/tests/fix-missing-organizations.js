const mongoose = require('mongoose');
require('dotenv').config();

async function fixOrganizations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Organization = require('./src/models/Organization');
    const User = require('./src/models/User');
    const OrgMembership = require('./src/models/OrgMembership');
    
    console.log('🔧 Fixing missing organizations...');
    
    const users = await User.find({ organizationId: { $exists: true } });
    
    for (const user of users) {
      console.log(`\nProcessing user: ${user.username}`);
      
      // Check if organization exists
      const existingOrg = await Organization.findById(user.organizationId);
      if (!existingOrg) {
        console.log(`  ❌ Organization ${user.organizationId} not found, creating...`);
        
        // Create the missing personal organization
        const orgData = {
          _id: user.organizationId,
          name: `${user.username}'s Personal Workspace`,
          type: 'PERSONAL',
          owner: user._id,
          members: [user._id],
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const org = await Organization.create(orgData);
        console.log(`  ✅ Created organization: ${org.name}`);
        
        // Check if membership exists
        const existingMembership = await OrgMembership.findOne({
          user: user._id,
          org: org._id
        });
        
        if (!existingMembership) {
          // Create organization membership
          const membershipData = {
            user: user._id,
            org: org._id,
            role: 'ADMIN',
            status: 'ACTIVE',
            joinedAt: new Date()
          };
          
          await OrgMembership.create(membershipData);
          console.log(`  ✅ Created membership for user`);
        } else {
          console.log(`  ✅ Membership already exists`);
        }
      } else {
        console.log(`  ✅ Organization exists: ${existingOrg.name}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Organization fix completed');
  }
}

fixOrganizations(); 