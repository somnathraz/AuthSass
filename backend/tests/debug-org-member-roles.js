const mongoose = require('mongoose');
require('dotenv').config();

async function debugOrgMemberRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');
    const OrgMembership = require('./src/models/OrgMembership');
    
    console.log('\n🔍 Checking organization memberships and roles...\n');
    
    // Get all organizations
    const orgs = await Organization.find({}).lean();
    console.log(`📊 Total organizations: ${orgs.length}\n`);
    
    for (const org of orgs) {
      console.log(`🏢 Organization: ${org.name} (${org._id})`);
      console.log(`   Owner: ${org.owner}`);
      
      // Get memberships for this org
      const memberships = await OrgMembership.find({
        organization: org._id,
        status: 'ACTIVE'
      }).populate('user').lean();
      
      console.log(`   👥 Active memberships: ${memberships.length}`);
      
      for (const membership of memberships) {
        if (membership.user) {
          console.log(`     - ${membership.user.username} (${membership.user._id})`);
          console.log(`       Email: ${membership.user.email}`);
          console.log(`       Role: ${membership.role}`);
          console.log(`       Status: ${membership.status}`);
          console.log(`       Joined: ${membership.joinedAt}`);
        } else {
          console.log(`     - ❌ Missing user data for membership ${membership._id}`);
        }
      }
      
      // Check if owner is also in memberships
      const ownerMembership = memberships.find(m => 
        m.user && m.user._id.toString() === org.owner.toString()
      );
      
      if (ownerMembership) {
        console.log(`   ✅ Owner is in memberships with role: ${ownerMembership.role}`);
      } else {
        console.log(`   ⚠️  Owner is NOT in memberships table`);
      }
      
      console.log('');
    }
    
    // Check for cross-organization issues
    console.log('\n🔍 Checking for users appearing in multiple organizations...\n');
    
    const allMemberships = await OrgMembership.find({
      status: 'ACTIVE'
    }).populate('user').populate('organization').lean();
    
    const userOrgMap = new Map();
    
    for (const membership of allMemberships) {
      if (membership.user && membership.organization) {
        const userId = membership.user._id.toString();
        if (!userOrgMap.has(userId)) {
          userOrgMap.set(userId, []);
        }
        userOrgMap.get(userId).push({
          orgName: membership.organization.name,
          orgId: membership.organization._id.toString(),
          role: membership.role,
          isOwner: membership.organization.owner.toString() === userId
        });
      }
    }
    
    for (const [userId, orgs] of userOrgMap.entries()) {
      if (orgs.length > 1) {
        const user = await User.findById(userId).lean();
        console.log(`👤 User: ${user?.username} (${user?.email})`);
        console.log(`   Appears in ${orgs.length} organizations:`);
        for (const org of orgs) {
          console.log(`     - ${org.orgName}: ${org.role} ${org.isOwner ? '(OWNER)' : ''}`);
        }
        console.log('');
      }
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugOrgMemberRoles(); 