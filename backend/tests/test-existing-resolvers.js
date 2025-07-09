const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Test user credentials
const testUser = {
  email: 'somnathkhadanga810@gmail.com',
  userId: '68321c5edab906b56003f5ad',
  orgId: '68321c5edab906b56003f5af'
};

// Generate a test token
const token = jwt.sign(
  { 
    userId: testUser.userId, 
    email: testUser.email,
    orgId: testUser.orgId
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function testResolver(name, query, variables = {}, category = 'General') {
  try {
    console.log(`🔍 Testing ${name}...`);
    
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      const isSchemaError = result.errors.some(error => 
        error.message.includes('Cannot query field') || 
        error.message.includes('Unknown argument') ||
        error.message.includes('Field') && error.message.includes('doesn\'t exist')
      );
      
      if (isSchemaError) {
        console.log(`❌ ${name} - RESOLVER DOESN'T EXIST`);
        console.log(`   Schema Error: ${result.errors[0].message}`);
        return { exists: false, works: false, error: result.errors[0].message };
      } else {
        console.log(`⚠️ ${name} - EXISTS BUT FAILED`);
        console.log(`   Runtime Error: ${result.errors[0].message}`);
        return { exists: true, works: false, error: result.errors[0].message };
      }
    } else {
      console.log(`✅ ${name} - EXISTS AND WORKS`);
      return { exists: true, works: true };
    }
  } catch (error) {
    console.log(`❌ ${name} - CONNECTION ERROR: ${error.message}`);
    return { exists: false, works: false, error: error.message };
  }
}

async function checkResolverExistence() {
  console.log('🔍 CHECKING RESOLVER EXISTENCE');
  console.log('===============================');
  console.log('Testing which resolvers actually exist in the schema...\n');

  const results = {
    existing: [],
    nonExisting: [],
    workingButFailing: []
  };

  // Test Auth Queries
  console.log('\n🔐 AUTH QUERIES');
  console.log('================');
  
  const authQueries = [
    {
      name: 'validateToken',
      query: `query ValidateToken($token: String!) {
        validateToken(token: $token) {
          valid
        }
      }`,
      variables: { token: 'test' }
    },
    {
      name: 'checkPasswordStrength',
      query: `query CheckPasswordStrength($password: String!) {
        checkPasswordStrength(password: $password) {
          score
        }
      }`,
      variables: { password: 'test' }
    },
    {
      name: 'healthCheck',
      query: `query HealthCheck {
        healthCheck {
          status
        }
      }`
    }
  ];

  for (const test of authQueries) {
    const result = await testResolver(test.name, test.query, test.variables, 'Auth Queries');
    if (result.exists && result.works) {
      results.existing.push(test.name);
    } else if (result.exists && !result.works) {
      results.workingButFailing.push({ name: test.name, error: result.error });
    } else {
      results.nonExisting.push(test.name);
    }
  }

  // Test User Queries
  console.log('\n👥 USER QUERIES');
  console.log('================');
  
  const userQueries = [
    {
      name: 'users',
      query: `query Users($limit: Int) {
        users(limit: $limit) {
          users {
            id
            username
          }
        }
      }`,
      variables: { limit: 5 }
    },
    {
      name: 'userApps',
      query: `query UserApps($input: UserAppsInput) {
        userApps(input: $input) {
          id
          name
        }
      }`,
      variables: { input: { limit: 5 } }
    },
    {
      name: 'userAppAccess',
      query: `query UserAppAccess($appId: ID!) {
        userAppAccess(appId: $appId) {
          hasAccess
        }
      }`,
      variables: { appId: '6832d7f197a2286ea2024c26' }
    },
    {
      name: 'userOrgAccess',
      query: `query UserOrgAccess($orgId: ID!) {
        userOrgAccess(orgId: $orgId) {
          hasAccess
        }
      }`,
      variables: { orgId: testUser.orgId }
    }
  ];

  for (const test of userQueries) {
    const result = await testResolver(test.name, test.query, test.variables, 'User Queries');
    if (result.exists && result.works) {
      results.existing.push(test.name);
    } else if (result.exists && !result.works) {
      results.workingButFailing.push({ name: test.name, error: result.error });
    } else {
      results.nonExisting.push(test.name);
    }
  }

  // Test Organization Queries
  console.log('\n🏢 ORGANIZATION QUERIES');
  console.log('========================');
  
  const orgQueries = [
    {
      name: 'organizations',
      query: `query Organizations($limit: Int) {
        organizations(limit: $limit) {
          organizations {
            id
            name
          }
        }
      }`,
      variables: { limit: 5 }
    },
    {
      name: 'myOrganizations',
      query: `query MyOrganizations {
        myOrganizations {
          id
          name
        }
      }`
    },
    {
      name: 'organizationMembers',
      query: `query OrganizationMembers($orgId: ID!) {
        organizationMembers(orgId: $orgId) {
          id
          role
        }
      }`,
      variables: { orgId: testUser.orgId }
    },
    {
      name: 'allOrganizations',
      query: `query AllOrganizations {
        allOrganizations {
          id
          name
        }
      }`
    }
  ];

  for (const test of orgQueries) {
    const result = await testResolver(test.name, test.query, test.variables, 'Organization Queries');
    if (result.exists && result.works) {
      results.existing.push(test.name);
    } else if (result.exists && !result.works) {
      results.workingButFailing.push({ name: test.name, error: result.error });
    } else {
      results.nonExisting.push(test.name);
    }
  }

  // Test App Queries
  console.log('\n📱 APP QUERIES');
  console.log('===============');
  
  const appQueries = [
    {
      name: 'app',
      query: `query App($id: ID!) {
        app(id: $id) {
          id
          name
        }
      }`,
      variables: { id: '6832d7f197a2286ea2024c26' }
    },
    {
      name: 'apps',
      query: `query Apps($limit: Int) {
        apps(limit: $limit) {
          apps {
            id
            name
          }
        }
      }`,
      variables: { limit: 5 }
    },
    {
      name: 'appMembers',
      query: `query AppMembers($appId: ID!) {
        appMembers(appId: $appId) {
          id
          role
        }
      }`,
      variables: { appId: '6832d7f197a2286ea2024c26' }
    }
  ];

  for (const test of appQueries) {
    const result = await testResolver(test.name, test.query, test.variables, 'App Queries');
    if (result.exists && result.works) {
      results.existing.push(test.name);
    } else if (result.exists && !result.works) {
      results.workingButFailing.push({ name: test.name, error: result.error });
    } else {
      results.nonExisting.push(test.name);
    }
  }

  // Test Invitation Queries
  console.log('\n📧 INVITATION QUERIES');
  console.log('======================');
  
  const invitationQueries = [
    {
      name: 'invitation',
      query: `query Invitation($id: ID!) {
        invitation(id: $id) {
          id
          email
        }
      }`,
      variables: { id: '68321c5edab906b56003f5b0' }
    },
    {
      name: 'invitations',
      query: `query Invitations($limit: Int) {
        invitations(limit: $limit) {
          invitations {
            id
            email
          }
        }
      }`,
      variables: { limit: 5 }
    },
    {
      name: 'sentInvitations',
      query: `query SentInvitations {
        sentInvitations {
          id
          email
        }
      }`
    },
    {
      name: 'pendingInvitations',
      query: `query PendingInvitations {
        pendingInvitations {
          id
          email
        }
      }`
    },
    {
      name: 'orgInvitations',
      query: `query OrgInvitations($orgId: ID!) {
        orgInvitations(orgId: $orgId) {
          id
          email
        }
      }`,
      variables: { orgId: testUser.orgId }
    }
  ];

  for (const test of invitationQueries) {
    const result = await testResolver(test.name, test.query, test.variables, 'Invitation Queries');
    if (result.exists && result.works) {
      results.existing.push(test.name);
    } else if (result.exists && !result.works) {
      results.workingButFailing.push({ name: test.name, error: result.error });
    } else {
      results.nonExisting.push(test.name);
    }
  }

  // Summary
  console.log('\n📊 RESOLVER EXISTENCE SUMMARY');
  console.log('==============================');
  
  console.log(`\n✅ EXISTING AND WORKING (${results.existing.length}):`);
  results.existing.forEach(name => console.log(`   - ${name}`));
  
  console.log(`\n⚠️ EXISTING BUT FAILING (${results.workingButFailing.length}):`);
  results.workingButFailing.forEach(item => {
    console.log(`   - ${item.name}: ${item.error.substring(0, 100)}...`);
  });
  
  console.log(`\n❌ NON-EXISTING (${results.nonExisting.length}):`);
  results.nonExisting.forEach(name => console.log(`   - ${name}`));

  const totalTested = results.existing.length + results.workingButFailing.length + results.nonExisting.length;
  const existingCount = results.existing.length + results.workingButFailing.length;
  
  console.log(`\n📈 STATISTICS:`);
  console.log(`   Total Tested: ${totalTested}`);
  console.log(`   Existing Resolvers: ${existingCount} (${((existingCount/totalTested)*100).toFixed(1)}%)`);
  console.log(`   Working Resolvers: ${results.existing.length} (${((results.existing.length/totalTested)*100).toFixed(1)}%)`);
  console.log(`   Non-Existing: ${results.nonExisting.length} (${((results.nonExisting.length/totalTested)*100).toFixed(1)}%)`);

  return results;
}

// Run the existence check
checkResolverExistence().catch(console.error); 