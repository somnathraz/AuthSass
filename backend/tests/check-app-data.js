const mongoose = require('mongoose');
require('dotenv').config();

async function checkApps() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const App = require('./src/models/App');
    
    console.log('🔍 Checking apps for null organizationId...');
    const apps = await App.find({}).lean();
    
    console.log(`📊 Total apps: ${apps.length}`);
    
    const nullOrgApps = apps.filter(app => !app.organizationId);
    console.log(`❌ Apps with null organizationId: ${nullOrgApps.length}`);
    
    if (nullOrgApps.length > 0) {
      console.log('🚨 Apps with null organizationId:');
      nullOrgApps.forEach(app => {
        console.log(`  - ${app.name} (ID: ${app._id})`);
      });
    }
    
    const validApps = apps.filter(app => app.organizationId);
    console.log(`✅ Apps with valid organizationId: ${validApps.length}`);
    
    // Check for any other data integrity issues
    const appsWithNullNames = apps.filter(app => !app.name);
    console.log(`❌ Apps with null names: ${appsWithNullNames.length}`);
    
    const appsWithNullOwners = apps.filter(app => !app.owner);
    console.log(`❌ Apps with null owners: ${appsWithNullOwners.length}`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkApps(); 