const mongoose = require('mongoose');
const Organization = require('../models/Organization');

/**
 * Fix null values in existing organizations
 * This script ensures all organizations have proper default values
 */
async function fixOrganizationNulls() {
  try {
    console.log('Starting organization null value fixes...');
    
    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-saas');
    }
    
    // Find organizations with null timezone
    const orgsWithNullTimezone = await Organization.find({
      $or: [
        { timezone: null },
        { timezone: { $exists: false } }
      ]
    });
    
    console.log(`Found ${orgsWithNullTimezone.length} organizations with null timezone`);
    
    // Fix timezone nulls
    if (orgsWithNullTimezone.length > 0) {
      const result = await Organization.updateMany(
        {
          $or: [
            { timezone: null },
            { timezone: { $exists: false } }
          ]
        },
        { $set: { timezone: 'UTC' } }
      );
      console.log(`Fixed timezone for ${result.modifiedCount} organizations`);
    }
    
    // Find organizations with null/missing passwordPolicy
    const orgsWithoutPasswordPolicy = await Organization.find({
      $or: [
        { passwordPolicy: null },
        { passwordPolicy: { $exists: false } }
      ]
    });
    
    console.log(`Found ${orgsWithoutPasswordPolicy.length} organizations without password policy`);
    
    // Fix passwordPolicy nulls
    if (orgsWithoutPasswordPolicy.length > 0) {
      const result = await Organization.updateMany(
        {
          $or: [
            { passwordPolicy: null },
            { passwordPolicy: { $exists: false } }
          ]
        },
        {
          $set: {
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSpecialChars: false,
              passwordHistory: 5,
              passwordExpiration: 90,
              maxLoginAttempts: 5,
              lockoutDuration: 30
            }
          }
        }
      );
      console.log(`Fixed password policy for ${result.modifiedCount} organizations`);
    }
    
    // Find organizations with null/missing domainSettings
    const orgsWithoutDomainSettings = await Organization.find({
      $or: [
        { domainSettings: null },
        { domainSettings: { $exists: false } }
      ]
    });
    
    console.log(`Found ${orgsWithoutDomainSettings.length} organizations without domain settings`);
    
    // Fix domainSettings nulls
    if (orgsWithoutDomainSettings.length > 0) {
      const result = await Organization.updateMany(
        {
          $or: [
            { domainSettings: null },
            { domainSettings: { $exists: false } }
          ]
        },
        {
          $set: {
            domainSettings: {
              allowedCallbackUrls: [],
              allowedLogoutUrls: [],
              allowedWebOrigins: [],
              customDomain: null
            }
          }
        }
      );
      console.log(`Fixed domain settings for ${result.modifiedCount} organizations`);
    }
    
    // Find organizations with null/missing branding
    const orgsWithoutBranding = await Organization.find({
      $or: [
        { branding: null },
        { branding: { $exists: false } }
      ]
    });
    
    console.log(`Found ${orgsWithoutBranding.length} organizations without branding`);
    
    // Fix branding nulls
    if (orgsWithoutBranding.length > 0) {
      const result = await Organization.updateMany(
        {
          $or: [
            { branding: null },
            { branding: { $exists: false } }
          ]
        },
        {
          $set: {
            branding: {
              primaryColor: '#4F46E5',
              secondaryColor: '#6B7280',
              logoUrl: null,
              faviconUrl: null,
              customCss: null
            }
          }
        }
      );
      console.log(`Fixed branding for ${result.modifiedCount} organizations`);
    }
    
    // Find organizations with null/missing notifications
    const orgsWithoutNotifications = await Organization.find({
      $or: [
        { notifications: null },
        { notifications: { $exists: false } }
      ]
    });
    
    console.log(`Found ${orgsWithoutNotifications.length} organizations without notifications`);
    
    // Fix notifications nulls
    if (orgsWithoutNotifications.length > 0) {
      const result = await Organization.updateMany(
        {
          $or: [
            { notifications: null },
            { notifications: { $exists: false } }
          ]
        },
        {
          $set: {
            notifications: {
              emailNotifications: true,
              securityAlerts: true,
              marketingEmails: false,
              weeklyReports: true,
              systemUpdates: true
            }
          }
        }
      );
      console.log(`Fixed notifications for ${result.modifiedCount} organizations`);
    }
    
    // Find organizations with null/missing analytics
    const orgsWithoutAnalytics = await Organization.find({
      $or: [
        { analytics: null },
        { analytics: { $exists: false } }
      ]
    });
    
    console.log(`Found ${orgsWithoutAnalytics.length} organizations without analytics`);
    
    // Fix analytics nulls
    if (orgsWithoutAnalytics.length > 0) {
      const result = await Organization.updateMany(
        {
          $or: [
            { analytics: null },
            { analytics: { $exists: false } }
          ]
        },
        {
          $set: {
            analytics: {
              enableTracking: true,
              retentionPeriod: 90,
              exportFormat: 'JSON'
            }
          }
        }
      );
      console.log(`Fixed analytics for ${result.modifiedCount} organizations`);
    }
    
    console.log('Organization null value fixes completed successfully!');
    
  } catch (error) {
    console.error('Error fixing organization null values:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  fixOrganizationNulls()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = fixOrganizationNulls; 