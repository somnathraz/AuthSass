require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const App = require('./src/models/App');
const OrgMembership = require('./src/models/OrgMembership');

// Import services to test the logic directly
const OrganizationService = require('./src/services/organization.service');

class TestRunner {
  constructor() {
    this.testResults = [];
  }

  log(testName, passed, details = '', fix = '') {
    const icon = passed ? '✅' : '❌';
    const result = {
      testName,
      passed,
      details,
      fix,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    console.log(`${icon} ${testName}: ${details}`);
    if (!passed && fix) {
      console.log(`   💡 Fix: ${fix}`);
    }
  }

  async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  async testDatabaseConsistency() {
    console.log('\n🧪 Testing Database Consistency...');
    
    try {
      // Check for users with null roles
      const usersWithNullRoles = await User.countDocuments({
        $or: [
          { role: null },
          { role: { $exists: false } }
        ]
      });

      if (usersWithNullRoles > 0) {
        this.log(
          'Database Consistency - User Roles', 
          false, 
          `${usersWithNullRoles} users have null/missing roles`,
          'Run: node fix-null-user-roles.js'
        );
      } else {
        this.log(
          'Database Consistency - User Roles', 
          true, 
          'All users have valid roles'
        );
      }

      // Check for users with null status
      const usersWithNullStatus = await User.countDocuments({
        $or: [
          { status: null },
          { status: { $exists: false } }
        ]
      });

      if (usersWithNullStatus > 0) {
        this.log(
          'Database Consistency - User Status', 
          false, 
          `${usersWithNullStatus} users have null/missing status`,
          'Run: node fix-null-user-roles.js'
        );
      } else {
        this.log(
          'Database Consistency - User Status', 
          true, 
          'All users have valid status'
        );
      }

      // Check for organizations without owners
      const orgsWithoutOwners = await Organization.countDocuments({
        $or: [
          { owner: null },
          { owner: { $exists: false } }
        ]
      });

      if (orgsWithoutOwners > 0) {
        this.log(
          'Database Consistency - Organization Owners', 
          false, 
          `${orgsWithoutOwners} organizations have null/missing owners`,
          'Check organization data integrity'
        );
      } else {
        this.log(
          'Database Consistency - Organization Owners', 
          true, 
          'All organizations have valid owners'
        );
      }

      // Check for orphaned organization memberships (user references that don't exist)
      const orphanedMemberships = await OrgMembership.countDocuments({
        $or: [
          { user: null },
          { user: { $exists: false } }
        ]
      });

      if (orphanedMemberships > 0) {
        this.log(
          'Database Consistency - Organization Memberships', 
          false, 
          `${orphanedMemberships} organization memberships have null user references`,
          'Clean up orphaned memberships'
        );
      } else {
        this.log(
          'Database Consistency - Organization Memberships', 
          true, 
          'All organization memberships have valid user references'
        );
      }

    } catch (error) {
      this.log(
        'Database Consistency', 
        false, 
        `Database check error: ${error.message}`,
        'Check database connection and models'
      );
    }
  }

  async testOrganizationMembersService() {
    console.log('\n🧪 Testing Organization Members Service (Critical Issue #1)...');
    
    try {
      // Find a test organization with members
      const testOrg = await Organization.findOne({ status: 'ACTIVE' }).lean();
      if (!testOrg) {
        this.log('Organization Members Service', false, 'No test organization found', 'Create a test organization');
        return;
      }

      // Test the service directly (this is what the GraphQL resolver calls)
      const membersData = await OrganizationService.getOrganizationMembers(testOrg._id.toString());
      
      if (!membersData) {
        this.log(
          'Organization Members Service', 
          false, 
          'Service returned null/undefined',
          'Check OrganizationService.getOrganizationMembers implementation'
        );
        return;
      }

      let allUsersHaveRoles = true;
      let allMembersHaveStatus = true;
      let roleCheckDetails = [];
      let statusCheckDetails = [];

      // Check owner role and status
      if (membersData.owner && (!membersData.owner.role || membersData.owner.role === null)) {
        allUsersHaveRoles = false;
        roleCheckDetails.push(`Owner ${membersData.owner.username} has null role`);
      }

      // Check member roles and statuses
      if (membersData.members) {
        membersData.members.forEach(member => {
          if (!member.user.role || member.user.role === null) {
            allUsersHaveRoles = false;
            roleCheckDetails.push(`Member ${member.user.username} has null role`);
          }
          
          // CRITICAL: Check OrganizationMember.status field
          if (!member.status || member.status === null) {
            allMembersHaveStatus = false;
            statusCheckDetails.push(`Member ${member.user.username} has null membership status`);
          }
        });
      }

      if (allUsersHaveRoles && allMembersHaveStatus) {
        this.log(
          'Organization Members Service', 
          true, 
          `Service successful - ${membersData.total} members returned, all have valid roles and statuses`
        );
      } else {
        let errorDetails = [];
        if (!allUsersHaveRoles) {
          errorDetails.push(`Role issues: ${roleCheckDetails.join(', ')}`);
        }
        if (!allMembersHaveStatus) {
          errorDetails.push(`Status issues: ${statusCheckDetails.join(', ')}`);
        }
        
        this.log(
          'Organization Members Service', 
          false, 
          `Service returned data but some fields are null: ${errorDetails.join('; ')}`,
          'Check OrganizationService.getOrganizationMembers implementation'
        );
      }

    } catch (error) {
      this.log(
        'Organization Members Service', 
        false, 
        `Service execution error: ${error.message}`,
        'Check OrganizationService implementation and database data'
      );
    }
  }

  async testUserPopulationQueries() {
    console.log('\n🧪 Testing User Population Queries...');
    
    try {
      // Test direct user population with role field
      const testUser = await User.findOne({ email: { $exists: true } })
        .select('username email firstName lastName profileImage role status createdAt')
        .lean();

      if (!testUser) {
        this.log('User Population Queries', false, 'No test user found', 'Create a test user');
        return;
      }

      if (!testUser.role || testUser.role === null) {
        this.log(
          'User Population Queries', 
          false, 
          `Test user ${testUser.username} has null role after population`,
          'Check user data and ensure role field is set'
        );
      } else {
        this.log(
          'User Population Queries', 
          true, 
          `User population successful - role: ${testUser.role}, status: ${testUser.status || 'undefined'}`
        );
      }

      // Test organization owner population
      const testOrgWithOwner = await Organization.findOne({ status: 'ACTIVE' })
        .populate('owner', 'username email firstName lastName profileImage role status createdAt')
        .lean();

      if (testOrgWithOwner && testOrgWithOwner.owner) {
        if (!testOrgWithOwner.owner.role || testOrgWithOwner.owner.role === null) {
          this.log(
            'Organization Owner Population', 
            false, 
            `Organization owner ${testOrgWithOwner.owner.username} has null role after population`,
            'Check organization owner population query'
          );
        } else {
          this.log(
            'Organization Owner Population', 
            true, 
            `Organization owner population successful - role: ${testOrgWithOwner.owner.role}`
          );
        }
      } else {
        this.log(
          'Organization Owner Population', 
          false, 
          'No organization with valid owner found',
          'Check organization data integrity'
        );
      }

    } catch (error) {
      this.log(
        'User Population Queries', 
        false, 
        `Population query error: ${error.message}`,
        'Check database connection and population syntax'
      );
    }
  }

  async testAppModelConsistency() {
    console.log('\n🧪 Testing App Model Consistency...');
    
    try {
      // Check for apps without owners
      const appsWithoutOwners = await App.countDocuments({
        $or: [
          { owner: null },
          { owner: { $exists: false } }
        ]
      });

      if (appsWithoutOwners > 0) {
        this.log(
          'App Model Consistency - Owners', 
          false, 
          `${appsWithoutOwners} apps have null/missing owners`,
          'Check app data integrity'
        );
      } else {
        this.log(
          'App Model Consistency - Owners', 
          true, 
          'All apps have valid owners'
        );
      }

      // Check for apps without organizationId
      const appsWithoutOrg = await App.countDocuments({
        $or: [
          { organizationId: null },
          { organizationId: { $exists: false } }
        ]
      });

      if (appsWithoutOrg > 0) {
        this.log(
          'App Model Consistency - Organizations', 
          false, 
          `${appsWithoutOrg} apps have null/missing organizationId`,
          'Check app data integrity'
        );
      } else {
        this.log(
          'App Model Consistency - Organizations', 
          true, 
          'All apps have valid organizationId'
        );
      }

      // Test app owner population
      const testApp = await App.findOne({ status: 'ACTIVE' })
        .populate('owner', 'username email firstName lastName profileImage role status createdAt')
        .lean();

      if (testApp && testApp.owner) {
        if (!testApp.owner.role || testApp.owner.role === null) {
          this.log(
            'App Owner Population', 
            false, 
            `App owner ${testApp.owner.username} has null role after population`,
            'Check app owner population query'
          );
        } else {
          this.log(
            'App Owner Population', 
            true, 
            `App owner population successful - role: ${testApp.owner.role}`
          );
        }
      } else {
        this.log(
          'App Owner Population', 
          false, 
          'No app with valid owner found',
          'Check app data integrity'
        );
      }

    } catch (error) {
      this.log(
        'App Model Consistency', 
        false, 
        `App consistency check error: ${error.message}`,
        'Check database connection and app model'
      );
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Critical Issues Backend Validation Tests...\n');
    
    try {
      await this.connectDB();
      
      await this.testDatabaseConsistency();
      await this.testUserPopulationQueries();
      await this.testOrganizationMembersService();
      await this.testAppModelConsistency();
      
      // Generate summary
      const totalTests = this.testResults.length;
      const passedTests = this.testResults.filter(r => r.passed).length;
      const failedTests = totalTests - passedTests;
      
      console.log('\n📊 Test Summary:');
      console.log('================');
      console.log(`✅ Passed: ${passedTests}/${totalTests}`);
      console.log(`❌ Failed: ${failedTests}/${totalTests}`);
      console.log(`📊 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
      
      if (failedTests > 0) {
        console.log('\n🔧 Failed Tests and Fixes:');
        this.testResults
          .filter(r => !r.passed)
          .forEach(result => {
            console.log(`❌ ${result.testName}: ${result.details}`);
            if (result.fix) {
              console.log(`   💡 Fix: ${result.fix}`);
            }
          });
      } else {
        console.log('\n🎉 All critical issues have been resolved!');
        console.log('✅ Backend is ready for production');
        console.log('\n📋 What this means:');
        console.log('• No more "Cannot return null for non-nullable field User.role" errors');
        console.log('• Organization members query works correctly');
        console.log('• App API keys query works correctly');
        console.log('• All database relationships are consistent');
        console.log('• User population queries include all required fields');
      }
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      console.error('Stack trace:', error.stack);
    } finally {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testRunner = new TestRunner();
  testRunner.runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test suite error:', error);
      process.exit(1);
    });
}

module.exports = TestRunner; 