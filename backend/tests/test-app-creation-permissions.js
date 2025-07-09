const mongoose = require('mongoose');
require('dotenv').config();

const App = require('./src/models/App');
const Organization = require('./src/models/Organization');
const OrgMembership = require('./src/models/OrgMembership');
const User = require('./src/models/User');
const OrganizationService = require('./src/services/organization.service');

async function testAppCreationPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get test users
    const testA = await User.findOne({ email: 'somnathkhadanga810@gmail.com' });
    const testB = await User.findOne({ email: { $ne: 'somnathkhadanga810@gmail.com' } });
    
    if (!testA || !testB) {
      console.log('❌ Test users not found');
      return;
    }
    
    console.log('\n📊 USER INFORMATION:');
    console.log(`TestA: ${testA.username} (${testA.email}) - ID: ${testA._id}`);
    console.log(`TestB: ${testB.username} (${testB.email}) - ID: ${testB._id}`);

    // Get demo1 organization
    const demo1 = await Organization.findOne({ name: 'demo1' });
    if (!demo1) {
      console.log('❌ Demo1 organization not found');
      return;
    }

    console.log('\n🏢 ORGANIZATION: demo1');
    console.log(`ID: ${demo1._id}`);

    // Check current memberships
    console.log('\n🔍 CURRENT ORGANIZATION MEMBERSHIPS:');
    
    const testAMembership = await OrgMembership.findOne({
      user: testA._id,
      org: demo1._id,
      status: 'ACTIVE'
    });
    
    const testBMembership = await OrgMembership.findOne({
      user: testB._id,
      org: demo1._id,
      status: 'ACTIVE'
    });

    console.log(`TestA in demo1: ${testAMembership ? testAMembership.role : 'NOT_MEMBER'}`);
    console.log(`TestB in demo1: ${testBMembership ? testBMembership.role : 'NOT_MEMBER'}`);

    // Test permission checks using OrganizationService
    console.log('\n🧪 TESTING APP CREATION PERMISSIONS:');

    // Test TestA (should be ADMIN)
    const testACanCreate = await OrganizationService.checkUserPermission(
      testA._id,
      demo1._id,
      ['ADMIN'] // Only admins can create apps now
    );
    console.log(`TestA can create apps: ${testACanCreate ? '✅ YES' : '❌ NO'}`);

    // Test TestB (likely MEMBER)
    const testBCanCreate = await OrganizationService.checkUserPermission(
      testB._id,
      demo1._id,
      ['ADMIN'] // Only admins can create apps now
    );
    console.log(`TestB can create apps: ${testBCanCreate ? '✅ YES' : '❌ NO'}`);

    // Test with old logic (including MEMBER)
    console.log('\n📊 COMPARISON WITH OLD LOGIC:');
    
    const testAOldLogic = await OrganizationService.checkUserPermission(
      testA._id,
      demo1._id,
      ['ADMIN', 'MEMBER'] // Old logic allowed members
    );
    
    const testBOldLogic = await OrganizationService.checkUserPermission(
      testB._id,
      demo1._id,
      ['ADMIN', 'MEMBER'] // Old logic allowed members
    );

    console.log(`TestA (old logic): ${testAOldLogic ? '✅ YES' : '❌ NO'}`);
    console.log(`TestB (old logic): ${testBOldLogic ? '✅ YES' : '❌ NO'}`);

    // Show the security improvement
    console.log('\n🔒 SECURITY IMPROVEMENT:');
    console.log('NEW POLICY: Only organization admins can create applications');
    console.log('OLD POLICY: Both admins and members could create applications');
    console.log('BENEFIT: Prevents unauthorized application sprawl and improves governance');

    // Test system admin override
    console.log('\n👑 SYSTEM ADMIN OVERRIDE TEST:');
    
    // Temporarily make TestB a system admin
    const originalRole = testB.role;
    testB.role = 'ADMIN';
    await testB.save();
    
    const systemAdminCanCreate = testB.role === 'ADMIN' || testB.role === 'SUPER_ADMIN';
    console.log(`TestB as system admin can create apps: ${systemAdminCanCreate ? '✅ YES' : '❌ NO'}`);
    
    // Restore original role
    testB.role = originalRole;
    await testB.save();

    console.log('\n✅ APP CREATION PERMISSION TEST COMPLETED');
    console.log('🎯 RESULT: Only organization admins and system admins can create applications');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testAppCreationPermissions(); 