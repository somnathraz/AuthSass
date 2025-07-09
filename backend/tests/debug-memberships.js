const mongoose = require('mongoose');
require('dotenv').config();

async function debugMemberships() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');
    const OrgMembership = require('./src/models/OrgMembership');
    
    // Find a user to test with
    const user = await User.findOne();
    if (!user) {
      console.log('No users found');
      return;
    }
    
    console.log('User:', {
      id: user._id.toString(),
      email: user.email,
      organizationId: user.organizationId ? user.organizationId.toString() : null
    });
    
    // Check OrgMembership records
    const memberships = await OrgMembership.find({ user: user._id })
      .populate('org', 'name type imageUrl description')
      .lean();
    
    console.log('OrgMembership records:', memberships.length);
    memberships.forEach((mem, index) => {
      console.log(`  ${index + 1}:`, {
        id: mem._id.toString(),
        user: mem.user.toString(),
        org: mem.org ? {
          id: mem.org._id.toString(),
          name: mem.org.name,
          type: mem.org.type
        } : 'null',
        role: mem.role,
        status: mem.status,
        hasFullOrgAccess: mem.hasFullOrgAccess,
        joinedAt: mem.joinedAt
      });
    });
    
    // Check organizations where user is in members array
    const orgsWithMember = await Organization.find({ members: user._id });
    console.log('Organizations with user in members array:', orgsWithMember.length);
    orgsWithMember.forEach(org => {
      console.log('  - Org:', org.name, 'ID:', org._id.toString(), 'Type:', org.type);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugMemberships(); 