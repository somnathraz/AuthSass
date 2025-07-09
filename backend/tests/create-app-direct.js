const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const App = require('../src/models/App');
const AppMembership = require('../src/models/AppMembership');

async function createApp() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const userId = '68321c5edab906b56003f5ad';
    const orgId = '68321c5edab906b56003f5af';

    // Create the app
    const appData = {
      name: 'Direct App Creation',
      description: 'App created directly via MongoDB, bypassing GraphQL',
      type: 'WEB',
      organizationId: orgId,
      owner: userId,
      members: [userId],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Creating app with data:', appData);
    const app = await App.create(appData);
    console.log('App created successfully with ID:', app._id.toString());

    // Create owner membership
    await AppMembership.create({
      user: userId,
      app: app._id,
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: new Date()
    });
    console.log('App membership created successfully');

    console.log('App creation completed successfully');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error creating app:', error);
    await mongoose.disconnect();
  }
}

createApp(); 