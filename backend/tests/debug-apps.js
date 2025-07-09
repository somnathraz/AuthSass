const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const App = require('./src/models/App');
const AppMembership = require('./src/models/AppMembership');
const User = require('./src/models/User');

async function debugApps() {
  try {
    console.log('🔍 Debugging Apps in Database...\n');
    
    const apps = await App.find({}).lean();
    
    console.log(`Found ${apps.length} apps total\n`);
    
    apps.forEach((app, index) => {
      console.log(`App ${index + 1}:`);
      console.log(`  ID: ${app._id}`);
      console.log(`  Name: ${app.name || 'NO NAME'}`);
      console.log(`  OrganizationId: ${app.organizationId || 'NULL/UNDEFINED'}`);
      console.log(`  Owner: ${app.owner || 'NULL/UNDEFINED'}`);
      console.log(`  Status: ${app.status || 'NO STATUS'}`);
      console.log('---');
    });
    
    // Check for problematic apps
    const appsWithoutOrgId = apps.filter(app => !app.organizationId);
    const appsWithoutName = apps.filter(app => !app.name);
    const appsWithoutOwner = apps.filter(app => !app.owner);
    
    console.log('\n🚨 PROBLEMATIC APPS:');
    console.log(`Apps without organizationId: ${appsWithoutOrgId.length}`);
    console.log(`Apps without name: ${appsWithoutName.length}`);
    console.log(`Apps without owner: ${appsWithoutOwner.length}`);
    
    if (appsWithoutOrgId.length > 0) {
      console.log('\nApps without organizationId:');
      appsWithoutOrgId.forEach(app => {
        console.log(`  - ${app._id}: ${app.name || 'NO NAME'}`);
      });
    }

    console.log('\n=== APP MEMBERSHIPS ===');
    const memberships = await AppMembership.find({}).populate('user', 'username email').populate('app', 'name');
    console.log(`Total app memberships: ${memberships.length}`);
    memberships.forEach((membership, index) => {
      console.log(`  ${index + 1}: {`);
      console.log(`    id: '${membership._id}',`);
      console.log(`    user: '${membership.user?.username || membership.user}',`);
      console.log(`    app: '${membership.app?.name || membership.app}',`);
      console.log(`    role: '${membership.role}',`);
      console.log(`    status: '${membership.status}'`);
      console.log(`  }`);
    });

    console.log('\n=== USER SPECIFIC ===');
    const userMemberships = await AppMembership.find({ user: userId }).populate('app', 'name organizationId');
    console.log(`User app memberships: ${userMemberships.length}`);
    userMemberships.forEach((membership, index) => {
      console.log(`  ${index + 1}: App: ${membership.app?.name}, Role: ${membership.role}, Status: ${membership.status}`);
    });

    const orgApps = await App.find({ organizationId: orgId });
    console.log(`Apps in user's org: ${orgApps.length}`);
    orgApps.forEach((app, index) => {
      console.log(`  ${index + 1}: ${app.name} (${app._id})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

debugApps(); 