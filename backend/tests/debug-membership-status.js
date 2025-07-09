require('dotenv').config();
const mongoose = require('mongoose');
const OrgMembership = require('./src/models/OrgMembership');
const OrganizationService = require('./src/services/organization.service');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Checking Organization Membership Status Issues...\n');

    // Check for null status memberships
    const nullStatusMemberships = await OrgMembership.find({
      $or: [
        { status: null },
        { status: { $exists: false } },
        { status: '' }
      ]
    }).populate('user', 'username email').populate('org', 'name');

    console.log('🔍 Found', nullStatusMemberships.length, 'memberships with null/missing status:');
    nullStatusMemberships.forEach((membership, i) => {
      console.log(`  ${i+1}. User: ${membership.user?.username || 'NULL'} in Org: ${membership.org?.name || 'NULL'} - Status: ${membership.status || 'NULL'}`);
      console.log(`      Membership ID: ${membership._id}`);
    });

    // Fix any null status memberships
    if (nullStatusMemberships.length > 0) {
      console.log('\n🔧 Fixing null status memberships...');
      for (const membership of nullStatusMemberships) {
        await OrgMembership.findByIdAndUpdate(membership._id, {
          status: 'ACTIVE'
        });
        console.log(`✅ Fixed membership ${membership._id}: set status to ACTIVE`);
      }
      console.log(`✅ Fixed ${nullStatusMemberships.length} memberships`);
    }

    // Check all memberships
    const allMemberships = await OrgMembership.find({}).populate('user', 'username email').populate('org', 'name');
    console.log('\n📊 Total memberships:', allMemberships.length);
    
    // Status distribution
    const statusCounts = {};
    allMemberships.forEach(m => {
      const status = m.status || 'NULL';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('📊 Status distribution:', statusCounts);

    // Test the organization service directly
    console.log('\n🧪 Testing OrganizationService.getOrganizationMembers...');
    const orgs = await mongoose.model('Organization').find({ status: 'ACTIVE' }).limit(1);
    if (orgs.length > 0) {
      const testOrgId = orgs[0]._id.toString();
      console.log(`🏢 Testing with organization: ${orgs[0].name} (${testOrgId})`);
      
      try {
        const membersData = await OrganizationService.getOrganizationMembers(testOrgId);
        console.log('✅ OrganizationService test successful');
        console.log(`📊 Returned: ${membersData.total} total members`);
        
        // Check if all members have status
        let allHaveStatus = true;
        membersData.members.forEach((member, i) => {
          if (!member.status) {
            console.log(`❌ Member ${i+1} (${member.user.username}) missing status field`);
            allHaveStatus = false;
          } else {
            console.log(`✅ Member ${i+1} (${member.user.username}) has status: ${member.status}`);
          }
        });
        
        if (allHaveStatus) {
          console.log('✅ All members have valid status fields');
        } else {
          console.log('❌ Some members missing status fields - fix needed');
        }
        
      } catch (error) {
        console.error('❌ OrganizationService test failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
})(); 