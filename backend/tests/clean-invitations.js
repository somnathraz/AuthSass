const mongoose = require('mongoose');
require('dotenv').config();

async function cleanInvitations() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('🔍 Cleaning up invitation collection...');
    
    // Drop the entire invitations collection to start fresh
    try {
      await mongoose.connection.db.dropCollection('invitations');
      console.log('✅ Dropped invitations collection');
    } catch (error) {
      if (error.message.includes('ns not found')) {
        console.log('Invitations collection does not exist, continuing...');
      } else {
        throw error;
      }
    }
    
    // Import the model to recreate the collection with proper indexes
    const Invitation = require('../src/models/Invitation');
    
    // Check if there are any invitations left
    const count = await Invitation.countDocuments();
    console.log(`📊 Invitations remaining: ${count}`);
    
    console.log('✅ Invitation collection cleaned successfully');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

cleanInvitations(); 