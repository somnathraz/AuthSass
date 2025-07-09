const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const App = require('./src/models/App');

async function checkNullOrgIds() {
  try {
    console.log('🔍 Checking for apps with null organizationId...\n');
    
    // Find apps with null or undefined organizationId
    const appsWithNullOrgId = await App.find({
      $or: [
        { organizationId: null },
        { organizationId: { $exists: false } }
      ]
    }).lean();
    
    console.log(`Found ${appsWithNullOrgId.length} apps with null/missing organizationId:`);
    
    appsWithNullOrgId.forEach((app, index) => {
      console.log(`  ${index + 1}. ${app.name} (${app._id}) - organizationId: ${app.organizationId}`);
    });
    
    // Also check the first few apps to see their organizationId values
    console.log('\n📋 First 5 apps in database:');
    const firstApps = await App.find({}).limit(5).lean();
    
    firstApps.forEach((app, index) => {
      console.log(`  ${index + 1}. ${app.name} (${app._id})`);
      console.log(`     organizationId: ${app.organizationId}`);
      console.log(`     type: ${typeof app.organizationId}`);
      console.log(`     isNull: ${app.organizationId === null}`);
      console.log(`     isUndefined: ${app.organizationId === undefined}`);
      console.log('     ---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkNullOrgIds(); 