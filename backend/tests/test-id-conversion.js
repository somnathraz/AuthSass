const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const App = require('./src/models/App');
const { toGraphQLId, sanitizeObjectIds } = require('./src/utils/idHelpers');

async function testIdConversion() {
  try {
    console.log('🔍 Testing ID Conversion...\n');
    
    // Get one app from database
    const app = await App.findOne({}).lean();
    
    if (!app) {
      console.log('No apps found in database');
      return;
    }
    
    console.log('Raw app from database:');
    console.log('  _id:', app._id, '(type:', typeof app._id, ')');
    console.log('  organizationId:', app.organizationId, '(type:', typeof app.organizationId, ')');
    console.log('  organizationId instanceof ObjectId:', app.organizationId instanceof mongoose.Types.ObjectId);
    
    console.log('\nTesting toGraphQLId function:');
    const convertedOrgId = toGraphQLId(app.organizationId);
    console.log('  toGraphQLId(organizationId):', convertedOrgId, '(type:', typeof convertedOrgId, ')');
    
    const convertedId = toGraphQLId(app._id);
    console.log('  toGraphQLId(_id):', convertedId, '(type:', typeof convertedId, ')');
    
    console.log('\nTesting sanitizeObjectIds function:');
    const sanitized = sanitizeObjectIds(app, ['id', '_id', 'organizationId']);
    console.log('  sanitized.id:', sanitized.id, '(type:', typeof sanitized.id, ')');
    console.log('  sanitized.organizationId:', sanitized.organizationId, '(type:', typeof sanitized.organizationId, ')');
    
    console.log('\nFull sanitized object:');
    console.log(JSON.stringify(sanitized, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testIdConversion(); 