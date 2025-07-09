/**
 * Database Migration Script: Fix Null User Roles
 * 
 * This script addresses the GraphQL error:
 * "Cannot return null for non-nullable field User.role"
 * 
 * Run this script once to fix existing data inconsistencies.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-saas', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// User model (simplified for migration)
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  role: String,
  status: String,
  accountType: String,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);

// Organization model (simplified for migration)
const organizationSchema = new mongoose.Schema({
  name: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: Date,
  updatedAt: Date
});

const Organization = mongoose.model('Organization', organizationSchema);

// Organization membership model
const orgMembershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  org: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  role: String,
  status: String,
  createdAt: Date
});

const OrgMembership = mongoose.model('OrgMembership', orgMembershipSchema);

// Migration functions
const fixNullUserRoles = async () => {
  console.log('\n🔧 Starting User Role Migration...\n');

  try {
    // Step 1: Find users with null or missing roles
    const usersWithNullRoles = await User.find({
      $or: [
        { role: null },
        { role: undefined },
        { role: { $exists: false } },
        { role: '' }
      ]
    });

    console.log(`📊 Found ${usersWithNullRoles.length} users with null/missing roles`);

    if (usersWithNullRoles.length === 0) {
      console.log('✅ No users with null roles found. Migration not needed.');
      return;
    }

    // Step 2: Log users that will be updated
    console.log('\n👥 Users to be updated:');
    usersWithNullRoles.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - ID: ${user._id}`);
    });

    // Step 3: Determine appropriate roles for each user
    let updatedCount = 0;
    let errors = 0;

    for (const user of usersWithNullRoles) {
      try {
        let newRole = 'MEMBER'; // Default role
        let newStatus = user.status || 'ACTIVE'; // Ensure status is set

        // Check if user owns any organizations
        const ownedOrgs = await Organization.find({ owner: user._id });
        if (ownedOrgs.length > 0) {
          newRole = 'ADMIN'; // Organization owners should be admins
          console.log(`👑 ${user.username} owns ${ownedOrgs.length} organization(s), setting role to ADMIN`);
        } else {
          // Check if user has admin role in any organization
          const adminMemberships = await OrgMembership.find({
            user: user._id,
            role: { $in: ['ADMIN', 'SUPER_ADMIN'] },
            status: 'ACTIVE'
          });

          if (adminMemberships.length > 0) {
            newRole = 'ADMIN';
            console.log(`🛡️ ${user.username} is admin in ${adminMemberships.length} organization(s), setting role to ADMIN`);
          } else {
            console.log(`👤 ${user.username} has no special permissions, setting role to MEMBER`);
          }
        }

        // Update the user
        await User.findByIdAndUpdate(user._id, {
          role: newRole,
          status: newStatus,
          updatedAt: new Date()
        });

        console.log(`✅ Updated ${user.username}: role=${newRole}, status=${newStatus}`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Failed to update user ${user.username}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`✅ Successfully updated: ${updatedCount} users`);
    console.log(`❌ Errors: ${errors} users`);
    console.log(`📊 Total processed: ${usersWithNullRoles.length} users`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

const fixNullUserStatuses = async () => {
  console.log('\n🔧 Fixing User Statuses...\n');

  try {
    // Find users with null or missing status
    const usersWithNullStatus = await User.find({
      $or: [
        { status: null },
        { status: undefined },
        { status: { $exists: false } },
        { status: '' }
      ]
    });

    console.log(`📊 Found ${usersWithNullStatus.length} users with null/missing status`);

    if (usersWithNullStatus.length === 0) {
      console.log('✅ No users with null status found.');
      return;
    }

    // Update all users with null status to ACTIVE
    const result = await User.updateMany(
      {
        $or: [
          { status: null },
          { status: undefined },
          { status: { $exists: false } },
          { status: '' }
        ]
      },
      {
        $set: {
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users with default status ACTIVE`);

  } catch (error) {
    console.error('❌ Status fix failed:', error);
    throw error;
  }
};

const validateFixedData = async () => {
  console.log('\n🔍 Validating Fixed Data...\n');

  try {
    // Check for remaining null roles
    const remainingNullRoles = await User.countDocuments({
      $or: [
        { role: null },
        { role: undefined },
        { role: { $exists: false } },
        { role: '' }
      ]
    });

    // Check for remaining null statuses
    const remainingNullStatuses = await User.countDocuments({
      $or: [
        { status: null },
        { status: undefined },
        { status: { $exists: false } },
        { status: '' }
      ]
    });

    console.log(`📊 Validation Results:`);
    console.log(`🔍 Users with null roles: ${remainingNullRoles}`);
    console.log(`🔍 Users with null statuses: ${remainingNullStatuses}`);

    if (remainingNullRoles === 0 && remainingNullStatuses === 0) {
      console.log('✅ All data validation passed! No null roles or statuses found.');
    } else {
      console.log('⚠️ Some null values still exist. Manual review may be needed.');
    }

    // Show role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Role Distribution:');
    roleDistribution.forEach(role => {
      console.log(`  ${role._id}: ${role.count} users`);
    });

  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
};

/**
 * Fix missing organization membership statuses
 */
const fixNullMembershipStatuses = async () => {
  console.log('\n🔧 Fixing Organization Membership Statuses...');

  try {
    // Find memberships with null/missing status
    const membershipsWithNullStatus = await OrgMembership.find({
      $or: [
        { status: null },
        { status: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${membershipsWithNullStatus.length} memberships with null/missing status`);

    if (membershipsWithNullStatus.length === 0) {
      console.log('✅ No memberships with null status found.');
      return;
    }

    // Fix each membership
    for (const membership of membershipsWithNullStatus) {
      const defaultStatus = 'ACTIVE'; // Most memberships should be active
      
      await OrgMembership.findByIdAndUpdate(membership._id, {
        status: defaultStatus
      });

      console.log(`✅ Fixed membership ${membership._id}: set status to ${defaultStatus}`);
    }

    console.log(`✅ Fixed ${membershipsWithNullStatus.length} organization membership statuses`);

  } catch (error) {
    console.error('❌ Error fixing membership statuses:', error);
    throw error;
  }
};

// Main migration function
const runMigration = async () => {
  console.log('🚀 Starting Database Migration: Fix Null User Roles');
  console.log('================================================\n');

  try {
    await connectDB();

    // Run migration steps
    await fixNullUserRoles();
    await fixNullUserStatuses();
    await validateFixedData();
    await fixNullMembershipStatuses();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Test the manage members modal in the frontend');
    console.log('2. Test the manage API keys functionality');
    console.log('3. Verify no GraphQL "Cannot return null for non-nullable field User.role" errors');

  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Handle script execution
if (require.main === module) {
  // Only run if this script is executed directly
  runMigration();
} else {
  // Export functions for testing
  module.exports = {
    fixNullUserRoles,
    fixNullUserStatuses,
    validateFixedData,
    fixNullMembershipStatuses,
    runMigration
  };
} 