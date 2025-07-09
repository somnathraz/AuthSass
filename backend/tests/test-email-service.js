require('dotenv').config();
const emailService = require('./src/services/email.service');

async function testEmailService() {
  console.log('🧪 Testing Email Service...');
  console.log('Environment variables:');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
  console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');
  
  try {
    // Test sending an invitation email
    const result = await emailService.sendInvitationEmail(
      'somanathsom11@gmail.com',
      'test-token-123',
      {
        inviterName: 'Somnath',
        organizationName: 'Test Organization',
        role: 'MEMBER',
        isOrgInvite: true
      }
    );
    
    console.log('✅ Email service test successful:', result);
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
  }
}

testEmailService(); 