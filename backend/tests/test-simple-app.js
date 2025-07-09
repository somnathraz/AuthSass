const mongoose = require('mongoose');
require('dotenv').config();

const App = require('./src/models/App');

async function testSimpleAppCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const appData = {
      name: 'Test App',
      description: 'A test application',
      type: 'WEB',
      organizationId: '68321c5edab906b56003f5af',
      owner: '68321c5edab906b56003f5ad',
      members: ['68321c5edab906b56003f5ad'],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Creating app with data:', appData);
    const app = await App.create(appData);
    console.log('App created successfully:', app._id);

    // Fetch the app back
    const fetchedApp = await App.findById(app._id).lean();
    console.log('Fetched app:', JSON.stringify(fetchedApp, null, 2));

    // Check the organizationId type
    console.log('organizationId type:', typeof fetchedApp.organizationId);
    console.log('organizationId value:', fetchedApp.organizationId);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
  }
}

testSimpleAppCreation(); 