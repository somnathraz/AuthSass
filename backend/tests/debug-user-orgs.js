const mongoose = require('mongoose');
require('dotenv').config();

async function checkUserOrgs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');
    const OrgMembership = require('./src/models/OrgMembership');
    
    // Find a user to test with
    const user = await User.findOne().populate('organizationId');
    if (!user) {
      console.log('No users found');
      return;
    }
    
    console.log('User:', {
      id: user._id.toString(),
      email: user.email,
      organizationId: user.organizationId ? user.organizationId._id.toString() : null
    });
    
    // Check organizations where user is in members array
    const orgsWithMember = await Organization.find({ members: user._id });
    console.log('Organizations with user in members array:', orgsWithMember.length);
    orgsWithMember.forEach(org => {
      console.log('  - Org:', org.name, 'ID:', org._id.toString(), 'Type:', org.type);
    });
    
    // Check organization memberships
    const memberships = await OrgMembership.find({ user: user._id }).populate('org');
    console.log('Organization memberships:', memberships.length);
    memberships.forEach(mem => {
      console.log('  - Membership:', mem.org.name, 'Role:', mem.role, 'OrgID:', mem.org._id.toString());
    });
    
    // Check user's personal organization
    if (user.organizationId) {
      const personalOrg = await Organization.findById(user.organizationId);
      console.log('Personal organization:', {
        name: personalOrg.name,
        id: personalOrg._id.toString(),
        type: personalOrg.type,
        members: personalOrg.members.map(m => m.toString())
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserOrgs(); 