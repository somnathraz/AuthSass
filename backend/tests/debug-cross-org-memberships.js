const mongoose = require('mongoose');
require('dotenv').config();

async function debugCrossOrgMemberships() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');
    const OrgMembership = require('./src/models/OrgMembership');
    const Invitation = require('./src/models/Invitation');
    
    console.log('\n🔍 Debugging cross-organization memberships...\n');
    
    // Get all users and their memberships
    const users = await User.find({}).lean();
    console.log(`👥 Found ${users.length} users\n`);
    
    for (const user of users) {
      console.log(`👤 User: ${user.username} (${user.email})`);
      console.log(`   Personal Org: ${user.organizationId}`);
      
      // Get all memberships for this user
      const memberships = await OrgMembership.find({
        user: user._id,
        status: 'ACTIVE'
      }).populate('org').lean();
      
      console.log(`   📋 Active memberships: ${memberships.length}`);
      
      for (const membership of memberships) {
        if (membership.org) {
          const isPersonalOrg = membership.org._id.toString() === user.organizationId?.toString();
          const isOwner = membership.org.owner.toString() === user._id.toString();
          
          console.log(`     - ${membership.org.name}`);
          console.log(`       Role: ${membership.role}`);
          console.log(`       Is Personal Org: ${isPersonalOrg}`);
          console.log(`       Is Owner: ${isOwner}`);
          console.log(`       Joined: ${membership.joinedAt}`);
          console.log(`       Invited By: ${membership.invitedBy || 'N/A'}`);
          console.log(`       Invitation Type: ${membership.metadata?.invitationType || 'N/A'}`);
          
          // Check if this is an incorrect membership
          if (!isPersonalOrg && !isOwner) {
            console.log(`       🚨 POTENTIAL ISSUE: User in non-personal org where they're not owner`);
            
            // Check if there are invitations for this user to this org
            const invitations = await Invitation.find({
              email: user.email,
              organizationId: membership.org._id
            }).lean();
            
            console.log(`       📧 Found ${invitations.length} invitations for this org`);
            for (const inv of invitations) {
              console.log(`         - Status: ${inv.status}, Type: ${inv.type}, Role: ${inv.role}`);
            }
          }
        }
      }
      
      console.log('');
    }
    
    // Check for orphaned memberships
    console.log('\n🔍 Checking for orphaned memberships...\n');
    
    const allMemberships = await OrgMembership.find({
      status: 'ACTIVE'
    }).populate('user').populate('org').lean();
    
    for (const membership of allMemberships) {
      if (!membership.user || !membership.org) {
        console.log(`🚨 Orphaned membership: ${membership._id}`);
        console.log(`   User: ${membership.user ? membership.user.username : 'NULL'}`);
        console.log(`   Org: ${membership.org ? membership.org.name : 'NULL'}`);
      }
    }
    
    // Summary of cross-org memberships
    console.log('\n📊 Cross-Organization Membership Summary:\n');
    
    const crossOrgMemberships = allMemberships.filter(membership => {
      if (!membership.user || !membership.org) return false;
      
      const isPersonalOrg = membership.org._id.toString() === membership.user.organizationId?.toString();
      const isOwner = membership.org.owner.toString() === membership.user._id.toString();
      
      return !isPersonalOrg && !isOwner;
    });
    
    console.log(`🚨 Found ${crossOrgMemberships.length} cross-organization memberships:`);
    
    for (const membership of crossOrgMemberships) {
      console.log(`   - ${membership.user.username} → ${membership.org.name} (${membership.role})`);
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugCrossOrgMemberships(); 