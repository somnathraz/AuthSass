const mongoose = require('mongoose');
require('dotenv').config();

async function fixMissingOrgMemberships() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');
    const OrgMembership = require('./src/models/OrgMembership');
    
    console.log('\n🔧 Fixing missing organization memberships...\n');
    
    // Get all organizations
    const orgs = await Organization.find({}).lean();
    console.log(`📊 Found ${orgs.length} organizations\n`);
    
    let fixed = 0;
    let errors = 0;
    
    for (const org of orgs) {
      console.log(`🏢 Processing: ${org.name} (${org._id})`);
      console.log(`   Owner: ${org.owner}`);
      
      // Check if owner has a membership record
      const existingMembership = await OrgMembership.findOne({
        user: org.owner,
        org: org._id,
        status: 'ACTIVE'
      });
      
      if (existingMembership) {
        console.log(`   ✅ Owner already has membership with role: ${existingMembership.role}`);
      } else {
        console.log(`   🔧 Creating missing membership for owner...`);
        
        try {
          // Verify the owner user exists
          const ownerUser = await User.findById(org.owner);
          if (!ownerUser) {
            console.log(`   ❌ Owner user not found: ${org.owner}`);
            errors++;
            continue;
          }
          
          // Create membership record for owner
          const membership = new OrgMembership({
            user: org.owner,
            org: org._id,
            role: 'ADMIN', // Organization owners should be ADMIN
            status: 'ACTIVE',
            joinedAt: org.createdAt || new Date(),
            metadata: {
              invitationType: 'DIRECT',
              permissions: {
                canCreateApps: true,
                canInviteMembers: true,
                canManageSettings: true
              }
            }
          });
          
          await membership.save();
          console.log(`   ✅ Created membership with role: ADMIN`);
          fixed++;
          
        } catch (error) {
          console.log(`   ❌ Error creating membership: ${error.message}`);
          errors++;
        }
      }
      
      console.log('');
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixed} missing memberships`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📋 Total organizations: ${orgs.length}`);
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...\n');
    
    for (const org of orgs) {
      const memberships = await OrgMembership.find({
        org: org._id,
        status: 'ACTIVE'
      }).populate('user').lean();
      
      console.log(`🏢 ${org.name}: ${memberships.length} active memberships`);
      for (const membership of memberships) {
        if (membership.user) {
          console.log(`   - ${membership.user.username}: ${membership.role}`);
        }
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixMissingOrgMemberships(); 