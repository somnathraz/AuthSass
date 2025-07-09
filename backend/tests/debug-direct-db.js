const mongoose = require('mongoose');
require('dotenv').config();

async function debugDirectDB() {
  console.log('🔍 Direct Database Debug - App Organization Isolation\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import models
    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');
    const App = require('./src/models/App');
    const OrgMembership = require('./src/models/OrgMembership');

    // 1. Get all users
    console.log('1. Users in database:');
    const users = await User.find({}, 'username email').lean();
    users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.username} (${user.email}) - ID: ${user._id}`);
    });
    console.log('');

    // Focus on the first user for testing
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    const testUser = users[0];
    console.log(`🎯 Testing with user: ${testUser.username} (${testUser._id})\n`);

    // 2. Get organizations for this user
    console.log('2. Organizations for this user:');
    const memberships = await OrgMembership.find({ user: testUser._id })
      .populate('org', 'name type')
      .lean();

    const organizations = [];
    memberships.forEach((membership, i) => {
      const org = membership.org;
      organizations.push(org);
      console.log(`   ${i + 1}. ${org.name} (${org.type}) - Role: ${membership.role} - ID: ${org._id}`);
    });
    console.log('');

    // 3. Get all apps in database
    console.log('3. All apps in database:');
    const allApps = await App.find({}, 'name organizationId owner').populate('organizationId', 'name type').lean();
    allApps.forEach((app, i) => {
      const orgName = app.organizationId ? app.organizationId.name : 'ORPHANED';
      console.log(`   ${i + 1}. "${app.name}" in org "${orgName}" (${app.organizationId?._id || 'NULL'}) - Owner: ${app.owner}`);
    });
    console.log('');

    // 4. Check apps per organization
    console.log('4. Apps per organization:');
    for (const org of organizations) {
      const orgApps = await App.find({ organizationId: org._id }, 'name owner').lean();
      console.log(`   📁 ${org.name} (${org._id}): ${orgApps.length} apps`);
      orgApps.forEach((app, i) => {
        console.log(`     ${i + 1}. "${app.name}" - Owner: ${app.owner}`);
      });
    }
    console.log('');

    // 5. Check for isolation issues
    console.log('5. Organization isolation check:');
    let issuesFound = false;

    for (const org of organizations) {
      const orgApps = await App.find({ organizationId: org._id }).lean();
      
      // Check if any apps in this org don't actually belong to it
      const wrongApps = orgApps.filter(app => app.organizationId.toString() !== org._id.toString());
      if (wrongApps.length > 0) {
        issuesFound = true;
        console.log(`   ❌ Organization "${org.name}" has ${wrongApps.length} apps with wrong organizationId:`);
        wrongApps.forEach(app => {
          console.log(`     - "${app.name}" (organizationId: ${app.organizationId})`);
        });
      } else {
        console.log(`   ✅ Organization "${org.name}" has proper app isolation (${orgApps.length} apps)`);
      }
    }

    // 6. Check for orphaned apps
    console.log('\n6. Checking for orphaned apps:');
    const orgIds = organizations.map(org => org._id);
    const orphanedApps = await App.find({ 
      organizationId: { $nin: orgIds } 
    }, 'name organizationId').lean();

    if (orphanedApps.length > 0) {
      console.log(`   ❌ Found ${orphanedApps.length} orphaned apps (not in user's organizations):`);
      orphanedApps.forEach(app => {
        console.log(`     - "${app.name}" (organizationId: ${app.organizationId})`);
      });
    } else {
      console.log('   ✅ No orphaned apps found');
    }

    // 7. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`- User has access to ${organizations.length} organizations`);
    console.log(`- Total apps in database: ${allApps.length}`);
    console.log(`- Apps user should have access to: ${allApps.filter(app => orgIds.some(id => id.toString() === app.organizationId?._id?.toString())).length}`);
    
    if (!issuesFound && orphanedApps.length === 0) {
      console.log('✅ Database level isolation looks correct');
    } else {
      console.log('❌ Database level isolation issues detected');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Database debug failed:', error);
    process.exit(1);
  }
}

debugDirectDB(); 