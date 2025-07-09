const mongoose = require('mongoose');
require('dotenv').config();

const App = require('./src/models/App');
const AppMembership = require('./src/models/AppMembership');
const Organization = require('./src/models/Organization');
const User = require('./src/models/User');

async function testAppPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get test users and organizations
    const testA = await User.findOne({ email: 'somnathkhadanga810@gmail.com' });
    const testB = await User.findOne({ email: { $ne: 'somnathkhadanga810@gmail.com' } }); // Get another user
    
    if (!testA) {
      console.log('❌ TestA user not found');
      return;
    }
    
    console.log('\n📊 USER INFORMATION:');
    console.log(`TestA: ${testA.username} (${testA.email}) - ID: ${testA._id}`);
    if (testB) {
      console.log(`TestB: ${testB.username} (${testB.email}) - ID: ${testB._id}`);
    }

    // Get organizations
    const orgs = await Organization.find({}).lean();
    console.log('\n🏢 ORGANIZATIONS:');
    orgs.forEach(org => {
      console.log(`- ${org.name} (${org.type}) - ID: ${org._id}`);
      console.log(`  Owner: ${org.owner}, Members: ${org.members?.length || 0}`);
    });

    // Get all apps
    const apps = await App.find({})
      .populate('owner', 'username email')
      .populate('organizationId', 'name type')
      .lean();
    
    console.log('\n📱 ALL APPLICATIONS:');
    apps.forEach(app => {
      console.log(`- ${app.name} (${app.type || 'Unknown'})`);
      console.log(`  ID: ${app._id}`);
      console.log(`  Owner: ${app.owner?.username} (${app.owner?._id})`);
      console.log(`  Organization: ${app.organizationId?.name} (${app.organizationId?._id})`);
      console.log(`  Status: ${app.status}`);
      console.log('');
    });

    // Test app memberships for TestA
    console.log('\n🔑 APP MEMBERSHIPS FOR TESTA:');
    const testAMemberships = await AppMembership.find({ user: testA._id })
      .populate('app', 'name type')
      .lean();
    
    if (testAMemberships.length === 0) {
      console.log('❌ No app memberships found for TestA');
    } else {
      testAMemberships.forEach(membership => {
        console.log(`- App: ${membership.app?.name || 'Unknown'}`);
        console.log(`  Role: ${membership.role}`);
        console.log(`  Status: ${membership.status}`);
        console.log(`  App ID: ${membership.app?._id}`);
        console.log('');
      });
    }

    // Test app memberships for TestB if exists
    if (testB) {
      console.log('\n🔑 APP MEMBERSHIPS FOR TESTB:');
      const testBMemberships = await AppMembership.find({ user: testB._id })
        .populate('app', 'name type')
        .lean();
      
      if (testBMemberships.length === 0) {
        console.log('❌ No app memberships found for TestB');
      } else {
        testBMemberships.forEach(membership => {
          console.log(`- App: ${membership.app?.name || 'Unknown'}`);
          console.log(`  Role: ${membership.role}`);
          console.log(`  Status: ${membership.status}`);
          console.log(`  App ID: ${membership.app?._id}`);
          console.log('');
        });
      }
    }

    // Test the userRole resolution logic
    console.log('\n🧪 TESTING USER ROLE RESOLUTION:');
    for (const app of apps) {
      console.log(`\nApp: ${app.name} (${app._id})`);
      
      // Test for TestA
      const testAMembership = await AppMembership.findOne({
        user: testA._id,
        app: app._id,
        status: 'ACTIVE'
      });
      
      console.log(`  TestA Role: ${testAMembership?.role || 'NULL'}`);
      console.log(`  TestA Is Owner: ${app.owner?._id?.toString() === testA._id.toString()}`);
      
      // Test for TestB
      if (testB) {
        const testBMembership = await AppMembership.findOne({
          user: testB._id,
          app: app._id,
          status: 'ACTIVE'
        });
        
        console.log(`  TestB Role: ${testBMembership?.role || 'NULL'}`);
        console.log(`  TestB Is Owner: ${app.owner?._id?.toString() === testB._id.toString()}`);
      }
    }

    // Test GraphQL query format
    console.log('\n🔄 SIMULATING GRAPHQL USERROLE RESOLVER:');
    for (const app of apps) {
      console.log(`\nApp: ${app.name}`);
      
      // This simulates the current buggy userRole resolver
      const testAMembershipBuggy = await AppMembership.findOne({
        user: testA._id,
        app: app.id, // BUG: using app.id instead of app._id
        status: 'ACTIVE'
      });
      
      // This simulates the correct userRole resolver
      const testAMembershipCorrect = await AppMembership.findOne({
        user: testA._id,
        app: app._id, // CORRECT: using app._id
        status: 'ACTIVE'
      });
      
      console.log(`  TestA Role (Buggy Query): ${testAMembershipBuggy?.role || 'NULL'}`);
      console.log(`  TestA Role (Correct Query): ${testAMembershipCorrect?.role || 'NULL'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testAppPermissions(); 