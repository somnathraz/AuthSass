const mongoose = require('mongoose');
require('dotenv').config();

async function fixCrossOrgMemberships() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');
    const OrgMembership = require('./src/models/OrgMembership');
    const Invitation = require('./src/models/Invitation');
    
    console.log('\n🔧 Fixing cross-organization memberships...\n');
    
    // Step 1: Identify and remove incorrect cross-org memberships
    console.log('Step 1: Identifying incorrect cross-org memberships...\n');
    
    const allMemberships = await OrgMembership.find({
      status: 'ACTIVE'
    }).populate('user').populate('org').lean();
    
    const incorrectMemberships = [];
    
    for (const membership of allMemberships) {
      if (!membership.user || !membership.org) continue;
      
      const isPersonalOrg = membership.org._id.toString() === membership.user.organizationId?.toString();
      const isOwner = membership.org.owner.toString() === membership.user._id.toString();
      
      // If user is in a non-personal org where they're not the owner, it's likely incorrect
      if (!isPersonalOrg && !isOwner) {
        incorrectMemberships.push(membership);
        console.log(`🚨 Incorrect membership: ${membership.user.username} → ${membership.org.name} (${membership.role})`);
        console.log(`   Invited by: ${membership.invitedBy}`);
        console.log(`   Invitation type: ${membership.metadata?.invitationType}`);
        console.log(`   Joined: ${membership.joinedAt}`);
      }
    }
    
    console.log(`\nFound ${incorrectMemberships.length} incorrect memberships\n`);
    
    // Step 2: Check if these memberships have valid invitations
    console.log('Step 2: Checking for valid invitations...\n');
    
    const membershipsToRemove = [];
    
    for (const membership of incorrectMemberships) {
      // Check for valid invitations
      const validInvitations = await Invitation.find({
        email: membership.user.email,
        organizationId: membership.org._id,
        status: 'ACCEPTED',
        type: 'ORGANIZATION'
      }).lean();
      
      console.log(`👤 ${membership.user.username} → ${membership.org.name}:`);
      console.log(`   Valid invitations found: ${validInvitations.length}`);
      
      if (validInvitations.length === 0) {
        console.log(`   ❌ No valid invitations - marking for removal`);
        membershipsToRemove.push(membership);
      } else {
        console.log(`   ✅ Valid invitation exists - keeping membership`);
      }
    }
    
    console.log(`\n${membershipsToRemove.length} memberships will be removed\n`);
    
    // Step 3: Remove incorrect memberships
    if (membershipsToRemove.length > 0) {
      console.log('Step 3: Removing incorrect memberships...\n');
      
      for (const membership of membershipsToRemove) {
        try {
          await OrgMembership.findByIdAndUpdate(
            membership._id,
            { 
              status: 'REMOVED',
              removedAt: new Date(),
              removedBy: null // System cleanup
            }
          );
          
          console.log(`✅ Removed: ${membership.user.username} from ${membership.org.name}`);
        } catch (error) {
          console.log(`❌ Error removing membership ${membership._id}: ${error.message}`);
        }
      }
    }
    
    // Step 4: Fix invitations with undefined organizationId
    console.log('\nStep 4: Fixing invitations with undefined organizationId...\n');
    
    const brokenInvitations = await Invitation.find({
      organizationId: { $in: [null, undefined] },
      type: 'ORGANIZATION'
    }).lean();
    
    console.log(`Found ${brokenInvitations.length} invitations with undefined organizationId`);
    
    for (const invitation of brokenInvitations) {
      console.log(`📧 Invitation: ${invitation.email} - Status: ${invitation.status}`);
      
      // Since we can't determine the correct org, mark these as invalid
      try {
        await Invitation.findByIdAndUpdate(
          invitation._id,
          { 
            status: 'INVALID',
            updatedAt: new Date()
          }
        );
        console.log(`   ✅ Marked as INVALID`);
      } catch (error) {
        console.log(`   ❌ Error updating invitation: ${error.message}`);
      }
    }
    
    // Step 5: Verify the fix
    console.log('\nStep 5: Verifying the fix...\n');
    
    const remainingCrossOrgMemberships = await OrgMembership.find({
      status: 'ACTIVE'
    }).populate('user').populate('org').lean();
    
    const stillIncorrect = remainingCrossOrgMemberships.filter(membership => {
      if (!membership.user || !membership.org) return false;
      
      const isPersonalOrg = membership.org._id.toString() === membership.user.organizationId?.toString();
      const isOwner = membership.org.owner.toString() === membership.user._id.toString();
      
      return !isPersonalOrg && !isOwner;
    });
    
    console.log(`📊 Remaining cross-org memberships: ${stillIncorrect.length}`);
    
    if (stillIncorrect.length === 0) {
      console.log('✅ All cross-organization membership issues have been resolved!');
    } else {
      console.log('⚠️ Some cross-organization memberships remain:');
      for (const membership of stillIncorrect) {
        console.log(`   - ${membership.user.username} → ${membership.org.name} (${membership.role})`);
      }
    }
    
    // Final summary
    console.log('\n📊 Final Summary:');
    
    const finalMemberships = await OrgMembership.find({
      status: 'ACTIVE'
    }).populate('user').populate('org').lean();
    
    const orgSummary = {};
    
    for (const membership of finalMemberships) {
      if (membership.org && membership.user) {
        if (!orgSummary[membership.org.name]) {
          orgSummary[membership.org.name] = [];
        }
        orgSummary[membership.org.name].push(`${membership.user.username} (${membership.role})`);
      }
    }
    
    for (const [orgName, members] of Object.entries(orgSummary)) {
      console.log(`🏢 ${orgName}: ${members.length} members`);
      for (const member of members) {
        console.log(`   - ${member}`);
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixCrossOrgMemberships(); 