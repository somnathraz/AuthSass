/**
 * Test script to verify OrganizationMember.status GraphQL field fix
 * 
 * This addresses the error:
 * "Cannot return null for non-nullable field OrganizationMember.status"
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import services directly
const OrganizationService = require('./src/services/organization.service');

// Import models
const Organization = require('./src/models/Organization');
const User = require('./src/models/User');

const testOrganizationMembersStatus = async () => {
  console.log('🧪 Testing OrganizationMember.status GraphQL field fix...\n');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test organization with members
    const testOrg = await Organization.findOne({ status: 'ACTIVE' });
    if (!testOrg) {
      console.log('❌ No test organization found');
      return;
    }

    console.log(`🏢 Testing with organization: ${testOrg.name}`);
    console.log(`📍 Organization ID: ${testOrg._id}`);

    // Call the organization service that the GraphQL resolver uses
    const membersData = await OrganizationService.getOrganizationMembers(testOrg._id.toString());

    console.log('\n📊 Organization Members Data Structure:');
    console.log('=====================================');

    // Check owner status
    console.log('\n👑 Owner:');
    console.log(`   User ID: ${membersData.owner._id}`);
    console.log(`   Username: ${membersData.owner.username}`);
    console.log(`   Role: ${membersData.owner.role}`);
    console.log(`   Status: ${membersData.owner.status || 'NULL/UNDEFINED'}`);

    // Check members status
    console.log('\n👥 Members:');
    if (membersData.members.length === 0) {
      console.log('   No members found');
    } else {
      membersData.members.forEach((member, index) => {
        console.log(`   Member ${index + 1}:`);
        console.log(`     User ID: ${member.user._id}`);
        console.log(`     Username: ${member.user.username}`);
        console.log(`     User Role: ${member.user.role}`);
        console.log(`     User Status: ${member.user.status || 'NULL/UNDEFINED'}`);
        console.log(`     Membership Role: ${member.role}`);
        console.log(`     Membership Status: ${member.status || 'NULL/UNDEFINED'}`); // THIS IS THE CRITICAL FIELD
        console.log(`     Access Type: ${member.accessType}`);
      });
    }

    // Validate GraphQL schema compliance
    console.log('\n🔍 GraphQL Schema Compliance Check:');
    console.log('==================================');

    let hasErrors = false;

    // Check owner status
    if (!membersData.owner.status) {
      console.log('❌ Owner missing status field (User.status!)');
      hasErrors = true;
    } else {
      console.log('✅ Owner has valid status field');
    }

    if (!membersData.owner.role) {
      console.log('❌ Owner missing role field (User.role!)');
      hasErrors = true;
    } else {
      console.log('✅ Owner has valid role field');
    }

    // Check members status
    for (let i = 0; i < membersData.members.length; i++) {
      const member = membersData.members[i];
      
      if (!member.user.status) {
        console.log(`❌ Member ${i + 1} user missing status field (User.status!)`);
        hasErrors = true;
      } else {
        console.log(`✅ Member ${i + 1} user has valid status field`);
      }

      if (!member.user.role) {
        console.log(`❌ Member ${i + 1} user missing role field (User.role!)`);
        hasErrors = true;
      } else {
        console.log(`✅ Member ${i + 1} user has valid role field`);
      }

      if (!member.status) {
        console.log(`❌ Member ${i + 1} missing membership status field (OrganizationMember.status!)`);
        hasErrors = true;
      } else {
        console.log(`✅ Member ${i + 1} has valid membership status field`);
      }
    }

    // Final verdict
    console.log('\n🎯 Test Results:');
    console.log('===============');
    
    if (hasErrors) {
      console.log('❌ FAILED: GraphQL schema violations found');
      console.log('🔧 The OrganizationMember.status fix needs more work');
    } else {
      console.log('✅ PASSED: All required fields present');
      console.log('🎉 OrganizationMember.status fix successful!');
      console.log('\n📋 This means:');
      console.log('• No more "Cannot return null for non-nullable field OrganizationMember.status" errors');
      console.log('• Manage members modal should work without GraphQL errors');
      console.log('• API keys management should work without GraphQL errors');
    }

    console.log(`\n📊 Summary: ${membersData.total} total members (1 owner + ${membersData.members.length} members)`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test
if (require.main === module) {
  testOrganizationMembersStatus();
}

module.exports = testOrganizationMembersStatus; 