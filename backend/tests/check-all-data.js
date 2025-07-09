const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');
    const App = require('./src/models/App');
    const Invitation = require('./src/models/Invitation');
    
    // Check users
    const users = await User.find({}).lean();
    console.log(`👥 Total users: ${users.length}`);
    if (users.length > 0) {
      console.log('Users:');
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.email}) - Org: ${user.organizationId}`);
      });
    }
    
    // Check organizations
    const orgs = await Organization.find({}).lean();
    console.log(`🏢 Total organizations: ${orgs.length}`);
    if (orgs.length > 0) {
      console.log('Organizations:');
      orgs.forEach(org => {
        console.log(`  - ${org.name} (${org._id}) - Type: ${org.type} - Owner: ${org.owner}`);
      });
    }
    
    // Check apps
    const apps = await App.find({}).lean();
    console.log(`📱 Total apps: ${apps.length}`);
    if (apps.length > 0) {
      console.log('Apps:');
      apps.forEach(app => {
        console.log(`  - ${app.name} (${app._id}) - Org: ${app.organizationId} - Owner: ${app.owner}`);
      });
    }
    
    // Check invitations
    const invitations = await Invitation.find({}).lean();
    console.log(`📧 Total invitations: ${invitations.length}`);
    if (invitations.length > 0) {
      console.log('Invitations:');
      invitations.forEach(inv => {
        console.log(`  - ${inv.email} - Status: ${inv.status} - Type: ${inv.type} - Org: ${inv.organizationId}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllData(); 