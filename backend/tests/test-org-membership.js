const mongoose = require('mongoose');
require('dotenv').config();

const App = require('./src/models/App');
const AppMembership = require('./src/models/AppMembership');
const Organization = require('./src/models/Organization');
const OrgMembership = require('./src/models/OrgMembership');
const User = require('./src/models/User');

async function testOrgMemberships() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get test users
    const testA = await User.findOne({ email: 'somnathkhadanga810@gmail.com' });
    
    if (!testA) {
      console.log('❌ TestA user not found');
      return;
    }
    
    console.log('\n📊 USER INFORMATION:');
    console.log(`TestA: ${testA.username} (${testA.email}) - ID: ${testA._id}`);

    // Get all organization memberships for TestA
    console.log('\n🏢 ORGANIZATION MEMBERSHIPS FOR TESTA:');
    const orgMemberships = await OrgMembership.find({ user: testA._id })
      .populate('org', 'name type')
      .lean();
    
    if (orgMemberships.length === 0) {
      console.log('❌ No organization memberships found for TestA');
    } else {
      orgMemberships.forEach(membership => {
        console.log(`- Organization: ${membership.org?.name || 'Unknown'}`);
        console.log(`  ID: ${membership.org?._id}`);
        console.log(`  Role: ${membership.role}`);
        console.log(`  Status: ${membership.status}`);
        console.log('');
      });
    }

    // Get demo1 organization specifically
    const demo1 = await Organization.findOne({ name: 'demo1' });
    if (demo1) {
      console.log('\n🎯 DEMO1 ORGANIZATION DETAILS:');
      console.log(`Name: ${demo1.name}`);
      console.log(`ID: ${demo1._id}`);
      console.log(`Owner: ${demo1.owner}`);
      console.log(`Members: ${demo1.members?.length || 0}`);
      console.log(`Members List: ${demo1.members || []}`);
      
      // Check if TestA is in demo1 members
      const isInMembers = demo1.members?.some(memberId => 
        memberId.toString() === testA._id.toString()
      );
      console.log(`TestA in members array: ${isInMembers}`);
      
      // Check for organization membership record
      const demo1Membership = await OrgMembership.findOne({
        user: testA._id,
        org: demo1._id
      });
      
      console.log(`TestA has OrgMembership record: ${!!demo1Membership}`);
      if (demo1Membership) {
        console.log(`  Role: ${demo1Membership.role}`);
        console.log(`  Status: ${demo1Membership.status}`);
      }
    }

    // Get demo1 apps
    console.log('\n📱 DEMO1 APPLICATIONS:');
    const demo1Apps = await App.find({ organizationId: demo1?._id })
      .populate('owner', 'username email')
      .lean();
    
    demo1Apps.forEach(app => {
      console.log(`- ${app.name}`);
      console.log(`  ID: ${app._id}`);
      console.log(`  Owner: ${app.owner?.username} (${app.owner?._id})`);
      console.log('');
    });

    // Test the new userRole resolver logic for demo1 apps
    console.log('\n🧪 TESTING NEW USERROLE RESOLVER FOR DEMO1 APPS:');
    for (const app of demo1Apps) {
      console.log(`\nApp: ${app.name} (${app._id})`);
      
      // Check direct app membership
      const appMembership = await AppMembership.findOne({
        user: testA._id,
        app: app._id,
        status: 'ACTIVE'
      });
      console.log(`  Direct AppMembership: ${appMembership?.role || 'NULL'}`);
      
      // Check if user is owner
      const isOwner = app.owner?._id?.toString() === testA._id.toString();
      console.log(`  Is Owner: ${isOwner}`);
      
      // Check organization membership
      const orgMembership = await OrgMembership.findOne({
        user: testA._id,
        org: app.organizationId,
        status: 'ACTIVE'
      });
      console.log(`  OrgMembership: ${orgMembership?.role || 'NULL'}`);
      
      // Simulate the new userRole resolver
      let resolvedRole = null;
      
      if (appMembership) {
        resolvedRole = appMembership.role;
      } else if (isOwner) {
        resolvedRole = 'OWNER';
      } else if (orgMembership) {
        if (['SUPER_ADMIN', 'ADMIN'].includes(orgMembership.role)) {
          resolvedRole = 'ADMIN';
        } else if (orgMembership.role === 'MEMBER') {
          resolvedRole = 'MEMBER';
        }
      } else if (testA.role === 'ADMIN' || testA.role === 'SUPER_ADMIN') {
        resolvedRole = 'ADMIN';
      }
      
      console.log(`  🎯 RESOLVED ROLE: ${resolvedRole || 'NULL'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testOrgMemberships(); 