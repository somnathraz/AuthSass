const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Organization = require('./src/models/Organization');

async function fixOrganizationFields() {
  try {
    console.log('🔍 Checking organizations for missing required fields...');
    
    // Find organizations with missing fields
    const orgsWithMissingFields = await Organization.find({
      $or: [
        { status: { $exists: false } },
        { status: null },
        { updatedAt: { $exists: false } },
        { updatedAt: null }
      ]
    });
    
    console.log(`Found ${orgsWithMissingFields.length} organizations with missing fields`);
    
    if (orgsWithMissingFields.length > 0) {
      console.log('Organizations with missing fields:');
      orgsWithMissingFields.forEach(org => {
        console.log(`- ${org.name} (${org._id}):`);
        console.log(`  status: ${org.status}`);
        console.log(`  updatedAt: ${org.updatedAt}`);
        console.log(`  createdAt: ${org.createdAt}`);
      });
      
      // Update organizations to have required fields
      const now = new Date();
      const result = await Organization.updateMany(
        {
          $or: [
            { status: { $exists: false } },
            { status: null },
            { updatedAt: { $exists: false } },
            { updatedAt: null }
          ]
        },
        { 
          $set: { 
            status: 'ACTIVE',
            updatedAt: now
          }
        }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} organizations with required fields`);
    } else {
      console.log('✅ All organizations have required fields set');
    }
    
    // Check all organizations
    const allOrgs = await Organization.find({}).select('name status type createdAt updatedAt');
    console.log('\n📋 All organizations:');
    allOrgs.forEach(org => {
      console.log(`- ${org.name}:`);
      console.log(`  status: ${org.status}`);
      console.log(`  type: ${org.type}`);
      console.log(`  createdAt: ${org.createdAt}`);
      console.log(`  updatedAt: ${org.updatedAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixOrganizationFields(); 