require('dotenv').config();
const mongoose = require('mongoose');
const Invitation = require('../src/models/Invitation');
const Organization = require('../src/models/Organization');

async function createTestInvitation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an organization
    const org = await Organization.findOne();
    if (!org) {
      console.log('❌ No organizations found');
      return;
    }

    console.log('✅ Found organization:', org.name);

    // Create a persistent test invitation
    const testEmail = 'frontend-test@example.com';
    const testToken = 'frontend-test-token-' + Date.now();
    
    // Delete any existing test invitations
    await Invitation.deleteMany({ email: testEmail });
    
    const invitation = new Invitation({
      email: testEmail,
      type: 'ORGANIZATION',
      organization: org._id,
      role: 'MEMBER',
      token: testToken,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      invitedBy: org.owner
    });

    await invitation.save();
    
    console.log('\n🎯 TEST INVITATION CREATED:');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Token:', testToken);
    console.log('🏢 Organization:', org.name);
    console.log('⏰ Expires:', invitation.expiresAt);
    
    console.log('\n🔗 Test URLs:');
    console.log('Organization invite: http://localhost:3000/accept-org?token=' + testToken);
    console.log('App invite: http://localhost:3000/accept-invite?token=' + testToken);
    
    console.log('\n📋 Expected behavior:');
    console.log('1. User clicks link');
    console.log('2. Page shows "Processing Invitation"');
    console.log('3. Auto-join attempt happens');
    console.log('4. Backend returns: userExists=false, requiresUserSetup=true');
    console.log('5. Frontend should show account setup form');
    console.log('6. User fills form and creates account');
    
    console.log('\n💡 To test: Open the URL above in your browser and check the console logs');

  } catch (error) {
    console.error('❌ Failed to create test invitation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createTestInvitation(); 