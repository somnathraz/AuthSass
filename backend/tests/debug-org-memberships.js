const mongoose = require('mongoose');
require('dotenv').config();

async function debugOrgMemberships() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Organization = require('./src/models/Organization');
    const OrgMembership = require('./src/models/OrgMembership');
    const User = require('./src/models/User');
    
    console.log('\n📋 Checking Organization Memberships...');
    
    // Get all organizations
    const orgs = await Organization.find().lean();
    console.log(`Found ${orgs.length} organizations`);
    
    for (const org of orgs) {
      console.log(`\n🏢 Organization: ${org.name} (${org._id})`);
      console.log(`   Owner: ${org.owner}`);
      console.log(`   Members array: [${org.members.join(', ')}]`);
      
      // Check memberships for this org
      const memberships = await OrgMembership.find({ org: org._id }).lean();
      console.log(`   Found ${memberships.length} membership records:`);
      
      for (const membership of memberships) {
        console.log(`     - User: ${membership.user} | Role: ${membership.role} | Status: ${membership.status}`);
        
        // Check if user exists
        if (membership.user) {
          const user = await User.findById(membership.user);
          if (!user) {
            console.log(`       ❌ USER NOT FOUND: ${membership.user}`);
          } else {
            console.log(`       ✅ User exists: ${user.username} (${user.email})`);
          }
        } else {
          console.log(`       ❌ NULL USER REFERENCE in membership ${membership._id}`);
        }
      }
      
      // Check if owner exists
      if (org.owner) {
        const owner = await User.findById(org.owner);
        if (!owner) {
          console.log(`   ❌ OWNER NOT FOUND: ${org.owner}`);
        } else {
          console.log(`   ✅ Owner exists: ${owner.username} (${owner.email})`);
        }
      } else {
        console.log(`   ❌ NULL OWNER REFERENCE`);
      }
    }
    
    // Check for orphaned memberships
    console.log('\n🔍 Checking for orphaned memberships...');
    const allMemberships = await OrgMembership.find().lean();
    console.log(`Total memberships: ${allMemberships.length}`);
    
    let orphanedCount = 0;
    let nullUserCount = 0;
    
    for (const membership of allMemberships) {
      if (!membership.user) {
        nullUserCount++;
        console.log(`❌ Membership ${membership._id} has null user reference`);
        continue;
      }
      
      const user = await User.findById(membership.user);
      if (!user) {
        orphanedCount++;
        console.log(`❌ Membership ${membership._id} references non-existent user: ${membership.user}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Total memberships: ${allMemberships.length}`);
    console.log(`   - Null user references: ${nullUserCount}`);
    console.log(`   - Orphaned user references: ${orphanedCount}`);
    
    if (nullUserCount > 0 || orphanedCount > 0) {
      console.log(`\n⚠️  Found ${nullUserCount + orphanedCount} problematic membership records!`);
      console.log(`This is likely causing the "Cannot read properties of null (reading '_id')" error.`);
    } else {
      console.log(`\n✅ All membership records look good!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugOrgMemberships(); 