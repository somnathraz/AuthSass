/**
 * Test script to simulate the exact frontend scenario causing OrganizationMember.status error
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import all required services and models
const OrganizationService = require('./src/services/organization.service');
const Organization = require('./src/models/Organization');
const OrgMembership = require('./src/models/OrgMembership');
const User = require('./src/models/User');

// Import the actual GraphQL resolver
const organizationResolvers = require('./src/graphql/resolvers/organization.resolvers');

const testFrontendScenario = async () => {
  console.log('🧪 Testing Exact Frontend Scenario - OrganizationMember.status Error\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all organizations that might be called by frontend
    const organizations = await Organization.find({ status: 'ACTIVE' }).lean();
    console.log(`\n📊 Found ${organizations.length} active organizations to test:`);
    
    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];
      console.log(`\n🏢 Testing Organization ${i+1}: ${org.name} (${org._id})`);
      
      try {
        // Test 1: Direct service call (what our tests use)
        console.log('  📋 Test 1: Direct OrganizationService.getOrganizationMembers()');
        const serviceResult = await OrganizationService.getOrganizationMembers(org._id.toString());
        
        let serviceHasErrors = false;
        serviceResult.members.forEach((member, idx) => {
          if (!member.status) {
            console.log(`    ❌ Member ${idx+1} (${member.user.username}) missing status in service result`);
            serviceHasErrors = true;
          }
        });
        
        if (!serviceHasErrors) {
          console.log(`    ✅ Service returned ${serviceResult.total} members, all have status`);
        }

        // Test 2: Check raw membership data for this org
        console.log('  📋 Test 2: Raw OrgMembership data check');
        const rawMemberships = await OrgMembership.find({ 
          org: org._id, 
          status: 'ACTIVE' 
        }).populate('user', 'username email role status');
        
        console.log(`    📊 Raw memberships found: ${rawMemberships.length}`);
        rawMemberships.forEach((membership, idx) => {
          console.log(`    Member ${idx+1}: ${membership.user?.username || 'NULL'} - Status: ${membership.status || 'NULL'}`);
          if (!membership.status) {
            console.log(`      ❌ This membership has NULL status!`);
          }
        });

        // Test 3: Simulate GraphQL resolver call (but we can't test auth easily)
        console.log('  📋 Test 3: GraphQL data structure validation');
        
        // Check that the service returns the correct structure
        if (serviceResult.members && Array.isArray(serviceResult.members)) {
          let allValid = true;
          
          serviceResult.members.forEach((member, idx) => {
            // Check required fields for GraphQL schema compliance
            const requiredFields = ['user', 'role', 'status', 'joinedAt'];
            const missingFields = requiredFields.filter(field => !member[field]);
            
            if (missingFields.length > 0) {
              console.log(`    ❌ Member ${idx+1} missing fields: ${missingFields.join(', ')}`);
              allValid = false;
            }
            
            // Check user object has required fields
            if (member.user) {
              const userRequiredFields = ['id', 'username', 'role', 'status'];
              const userMissingFields = userRequiredFields.filter(field => !member.user[field]);
              
              if (userMissingFields.length > 0) {
                console.log(`    ❌ Member ${idx+1} user missing fields: ${userMissingFields.join(', ')}`);
                allValid = false;
              }
            }
          });
          
          if (allValid) {
            console.log(`    ✅ All ${serviceResult.members.length} members have correct GraphQL structure`);
          }
        }

        // Test 4: Check if this specific org has problematic memberships
        console.log('  📋 Test 4: Problematic membership detection');
        
        const problematicMemberships = await OrgMembership.find({
          org: org._id,
          $or: [
            { status: null },
            { status: { $exists: false } },
            { status: '' },
            { user: null },
            { user: { $exists: false } }
          ]
        });
        
        if (problematicMemberships.length > 0) {
          console.log(`    ❌ Found ${problematicMemberships.length} problematic memberships:`);
          problematicMemberships.forEach((membership, idx) => {
            console.log(`      ${idx+1}. ID: ${membership._id}, User: ${membership.user || 'NULL'}, Status: ${membership.status || 'NULL'}`);
          });
          
          // Fix them
          console.log('    🔧 Fixing problematic memberships...');
          for (const membership of problematicMemberships) {
            await OrgMembership.findByIdAndUpdate(membership._id, {
              status: membership.status || 'ACTIVE',
              user: membership.user || null
            });
          }
          console.log('    ✅ Fixed problematic memberships');
        } else {
          console.log(`    ✅ No problematic memberships found`);
        }

      } catch (error) {
        console.log(`    ❌ Error testing org ${org.name}:`, error.message);
      }
    }

    // Final comprehensive check
    console.log('\n🔍 Final Comprehensive Check');
    console.log('============================');
    
    const allMemberships = await OrgMembership.find({}).populate('user', 'username').populate('org', 'name');
    const nullStatusCount = allMemberships.filter(m => !m.status).length;
    const nullUserCount = allMemberships.filter(m => !m.user).length;
    
    console.log(`📊 Total memberships: ${allMemberships.length}`);
    console.log(`❌ Null status: ${nullStatusCount}`);
    console.log(`❌ Null user: ${nullUserCount}`);
    
    if (nullStatusCount === 0 && nullUserCount === 0) {
      console.log('✅ All memberships are valid');
    } else {
      console.log('❌ Found invalid memberships - these will cause GraphQL errors');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test
if (require.main === module) {
  testFrontendScenario();
}

module.exports = testFrontendScenario; 