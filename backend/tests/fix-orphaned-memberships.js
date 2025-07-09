const mongoose = require('mongoose');
require('dotenv').config();

async function fixOrphanedMemberships() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Organization = require('./src/models/Organization');
    const OrgMembership = require('./src/models/OrgMembership');
    const User = require('./src/models/User');
    
    console.log('🔧 Fixing orphaned membership records...\n');
    
    // Get all memberships
    const allMemberships = await OrgMembership.find().lean();
    console.log(`📊 Found ${allMemberships.length} total membership records`);
    
    let fixedCount = 0;
    let nullUserCount = 0;
    
    for (const membership of allMemberships) {
      if (!membership.user) {
        nullUserCount++;
        console.log(`❌ Removing membership ${membership._id} with null user reference`);
        await OrgMembership.findByIdAndDelete(membership._id);
        fixedCount++;
        continue;
      }
      
      // Check if user exists
      const user = await User.findById(membership.user);
      if (!user) {
        console.log(`❌ Removing orphaned membership ${membership._id} for non-existent user: ${membership.user}`);
        
        // Also remove from organization members array if present
        if (membership.org) {
          await Organization.findByIdAndUpdate(
            membership.org,
            { $pull: { members: membership.user } }
          );
          console.log(`   ✅ Removed user ${membership.user} from organization ${membership.org} members array`);
        }
        
        await OrgMembership.findByIdAndDelete(membership._id);
        fixedCount++;
      }
    }
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   - Total memberships checked: ${allMemberships.length}`);
    console.log(`   - Null user references removed: ${nullUserCount}`);
    console.log(`   - Orphaned memberships removed: ${fixedCount - nullUserCount}`);
    console.log(`   - Total records fixed: ${fixedCount}`);
    
    if (fixedCount > 0) {
      console.log(`\n✅ Fixed ${fixedCount} problematic membership records!`);
      console.log(`The "Cannot read properties of null (reading '_id')" error should now be resolved.`);
    } else {
      console.log(`\n✅ No orphaned memberships found - data is clean!`);
    }
    
    // Verify the fix by checking again
    console.log('\n🔍 Verifying fix...');
    const remainingMemberships = await OrgMembership.find().lean();
    let remainingIssues = 0;
    
    for (const membership of remainingMemberships) {
      if (!membership.user) {
        remainingIssues++;
        continue;
      }
      
      const user = await User.findById(membership.user);
      if (!user) {
        remainingIssues++;
      }
    }
    
    if (remainingIssues === 0) {
      console.log('✅ Verification passed - all membership records are now valid!');
    } else {
      console.log(`❌ Still found ${remainingIssues} problematic records`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixOrphanedMemberships(); 