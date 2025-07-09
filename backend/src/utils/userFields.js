/**
 * Standard User field selections for GraphQL resolvers
 * Ensures all required fields are included to prevent GraphQL serialization errors
 */

// Required fields based on User GraphQL schema
const USER_REQUIRED_FIELDS = [
  '_id',
  'username',
  'email', 
  'role',
  'status',
  'accountType',
  'requirePasswordReset',
  'isVerified',
  'createdAt',
  'updatedAt',
  'firstName',
  'lastName',
  'profileImage',
  'organizationId'
].join(' ');

// Basic user fields for simple queries
const USER_BASIC_FIELDS = [
  '_id',
  'username',
  'email',
  'role',
  'status',
  'createdAt',
  'updatedAt',
  'firstName',
  'lastName'
].join(' ');

// Extended user fields for detailed queries
const USER_EXTENDED_FIELDS = [
  '_id',
  'username',
  'email',
  'role', 
  'status',
  'accountType',
  'requirePasswordReset',
  'isVerified',
  'createdAt',
  'updatedAt',
  'firstName',
  'lastName',
  'profileImage',
  'organizationId',
  'lastLoginAt',
  'timezone',
  'locale'
].join(' ');

// Minimal fields for performance-critical queries
const USER_MINIMAL_FIELDS = [
  '_id',
  'username',
  'email',
  'role',
  'status',
  'createdAt',
  'updatedAt'
].join(' ');

module.exports = {
  USER_REQUIRED_FIELDS,
  USER_BASIC_FIELDS,
  USER_EXTENDED_FIELDS,
  USER_MINIMAL_FIELDS
}; 