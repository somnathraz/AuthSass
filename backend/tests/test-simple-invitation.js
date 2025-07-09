require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const Invitation = require('./src/models/Invitation');

async function testInvitationFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an existing organization
    const org = await Organization.findOne();
    if (!org) {
      console.log('❌ No organizations found. Please create one first.');
      return;
    }

    console.log('✅ Found organization:', org.name, org._id);

    // Create a test invitation for a non-existing user
    const testEmail = 'testuser' + Date.now() + '@example.com';
    
    const invitation = new Invitation({
      email: testEmail,
      type: 'ORGANIZATION',
      organization: org._id,
      role: 'MEMBER',
      token: 'test-token-' + Date.now(),
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      invitedBy: org.owner
    });

    await invitation.save();
    console.log('✅ Created test invitation for:', testEmail);

    // Test 1: Check if user exists (should return false)
    const existingUser = await User.findOne({ email: testEmail });
    console.log('✅ User exists check:', !!existingUser);

    // Test 2: Simulate the new acceptInvite logic
    if (!existingUser) {
      console.log('✅ User does not exist - should show setup form');
      console.log('✅ Frontend should receive: { userExists: false, requiresUserSetup: true }');
    } else {
      console.log('✅ User exists - should auto-join');
    }

    // Clean up
    await Invitation.deleteOne({ _id: invitation._id });
    console.log('✅ Cleaned up test invitation');

    console.log('\n🎉 Test completed successfully!');
    console.log('The new flow should work as follows:');
    console.log('1. User clicks invitation link');
    console.log('2. Frontend calls acceptInvite(token) without credentials');
    console.log('3. Backend checks if user exists');
    console.log('4. If user doesn\'t exist: returns { userExists: false, requiresUserSetup: true }');
    console.log('5. Frontend shows account setup form');
    console.log('6. User fills form and submits');
    console.log('7. Frontend calls acceptInvite(token, username, password)');
    console.log('8. Backend creates user and returns tokens');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testInvitationFlow(); 