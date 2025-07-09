// Debug script to check resolver structure
const userResolvers = require('./src/graphql/resolvers/user.resolvers');
const authResolvers = require('./src/graphql/resolvers/auth.resolvers');

console.log('🔍 Debugging Resolver Structure...\n');

console.log('User Resolvers Structure:');
console.log('- Query keys:', Object.keys(userResolvers.Query || {}));
console.log('- Mutation keys:', Object.keys(userResolvers.Mutation || {}));
console.log('- User field resolvers:', Object.keys(userResolvers.User || {}));

console.log('\nAuth Resolvers Structure:');
console.log('- Query keys:', Object.keys(authResolvers.Query || {}));
console.log('- Mutation keys:', Object.keys(authResolvers.Mutation || {}));

console.log('\nUser.accountType resolver:');
console.log(userResolvers.User?.accountType?.toString());

// Test the resolver function directly
if (userResolvers.User?.accountType) {
  const testUser = { accountType: 'personal' };
  const result = userResolvers.User.accountType(testUser);
  console.log('\nDirect resolver test:');
  console.log('Input:', testUser.accountType);
  console.log('Output:', result);
} 