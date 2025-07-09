const mongoose = require('mongoose');
require('dotenv').config();

async function checkOrganizations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Organization = require('./src/models/Organization');
    const User = require('./src/models/User');
    
    console.log('\n📋 All Organizations:');
    const orgs = await Organization.find().lean();
    orgs.forEach(org => {
      console.log(`  - ID: ${org._id}`);
      console.log(`    Name: ${org.name}`);
      console.log(`    Type: ${org.type}`);
      console.log(`    Owner: ${org.owner}`);
      console.log('');
    });
    
    console.log('👤 All Users with organizationId:');
    const users = await User.find({ organizationId: { $exists: true } }).lean();
    users.forEach(user => {
      console.log(`  - User: ${user.username} (${user.email})`);
      console.log(`    organizationId: ${user.organizationId}`);
      console.log('');
    });
    
    // Check if there are any mismatched organizationIds
    console.log('🔍 Checking for orphaned organizationIds:');
    const orgIds = orgs.map(org => org._id.toString());
    const userOrgIds = users.map(user => user.organizationId?.toString()).filter(Boolean);
    
    const orphanedIds = userOrgIds.filter(id => !orgIds.includes(id));
    if (orphanedIds.length > 0) {
      console.log('❌ Found orphaned organizationIds:');
      orphanedIds.forEach(id => console.log(`  - ${id}`));
    } else {
      console.log('✅ All user organizationIds are valid');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkOrganizations(); 