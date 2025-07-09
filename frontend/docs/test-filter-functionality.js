// Test Filter Functionality
// Run this in the browser console to test the filter dropdowns

function testFilterFunctionality() {
  console.log('🧪 Testing Filter Functionality...');
  
  // Test search functionality
  console.log('\n1. Testing Search Functionality:');
  const searchInput = document.querySelector('input[placeholder*="Search"]');
  if (searchInput) {
    console.log('✅ Search input found');
    
    // Test search input
    searchInput.value = 'test';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Search input test completed');
  } else {
    console.log('❌ Search input not found');
  }
  
  // Test type filter dropdown
  console.log('\n2. Testing Type Filter:');
  const typeFilterTriggers = document.querySelectorAll('[data-radix-collection-item]');
  let typeFilterFound = false;
  
  typeFilterTriggers.forEach((trigger, index) => {
    if (trigger.textContent && trigger.textContent.includes('Filter by type')) {
      console.log('✅ Type filter trigger found');
      typeFilterFound = true;
      
      // Click to open dropdown
      trigger.click();
      
      setTimeout(() => {
        // Check for valid type options
        const typeOptions = document.querySelectorAll('[data-radix-collection-item]');
        const validTypes = ['WEB', 'MOBILE', 'API', 'SERVICE'];
        let validOptionsFound = 0;
        
        typeOptions.forEach(option => {
          if (validTypes.some(type => option.textContent && option.textContent.includes(type))) {
            validOptionsFound++;
            console.log(`✅ Found valid type option: ${option.textContent}`);
          }
        });
        
        if (validOptionsFound > 0) {
          console.log(`✅ Type filter has ${validOptionsFound} valid options`);
        } else {
          console.log('❌ No valid type options found');
        }
        
        // Close dropdown by clicking elsewhere
        document.body.click();
      }, 100);
    }
  });
  
  if (!typeFilterFound) {
    console.log('❌ Type filter trigger not found');
  }
  
  // Test status filter dropdown
  console.log('\n3. Testing Status Filter:');
  setTimeout(() => {
    const statusFilterTriggers = document.querySelectorAll('[data-radix-collection-item]');
    let statusFilterFound = false;
    
    statusFilterTriggers.forEach((trigger) => {
      if (trigger.textContent && trigger.textContent.includes('Filter by status')) {
        console.log('✅ Status filter trigger found');
        statusFilterFound = true;
        
        // Click to open dropdown
        trigger.click();
        
        setTimeout(() => {
          // Check for valid status options
          const statusOptions = document.querySelectorAll('[data-radix-collection-item]');
          const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'];
          const invalidStatuses = ['DEVELOPMENT', 'MAINTENANCE', 'DEPRECATED', 'DELETED'];
          let validOptionsFound = 0;
          let invalidOptionsFound = 0;
          
          statusOptions.forEach(option => {
            if (validStatuses.some(status => option.textContent && option.textContent.includes(status))) {
              validOptionsFound++;
              console.log(`✅ Found valid status option: ${option.textContent}`);
            }
            if (invalidStatuses.some(status => option.textContent && option.textContent.includes(status))) {
              invalidOptionsFound++;
              console.log(`❌ Found invalid status option: ${option.textContent}`);
            }
          });
          
          if (validOptionsFound > 0 && invalidOptionsFound === 0) {
            console.log(`✅ Status filter has ${validOptionsFound} valid options and no invalid ones`);
          } else {
            console.log(`❌ Status filter issues: ${validOptionsFound} valid, ${invalidOptionsFound} invalid`);
          }
          
          // Close dropdown
          document.body.click();
        }, 100);
      }
    });
    
    if (!statusFilterFound) {
      console.log('❌ Status filter trigger not found');
    }
  }, 500);
  
  // Test GraphQL query structure
  console.log('\n4. Testing GraphQL Query Structure:');
  
  // Check if Apollo Client is available
  if (window.__APOLLO_CLIENT__) {
    console.log('✅ Apollo Client found');
    
    // Test a sample query with filters
    const testQuery = `
      query TestAppsQuery($filter: AppFilter) {
        apps(filter: $filter) {
          apps {
            id
            name
            type
            status
          }
          total
        }
      }
    `;
    
    const testVariables = {
      filter: {
        type: 'WEB',
        status: 'ACTIVE'
      }
    };
    
    console.log('📤 Testing GraphQL query with variables:', testVariables);
    
    window.__APOLLO_CLIENT__.query({
      query: window.__APOLLO_CLIENT__.gql(testQuery),
      variables: testVariables,
      errorPolicy: 'all'
    }).then(result => {
      if (result.errors) {
        console.log('❌ GraphQL query errors:', result.errors);
        result.errors.forEach(error => {
          console.log(`   - ${error.message}`);
        });
      } else {
        console.log('✅ GraphQL query successful');
        console.log('📊 Query result:', result.data);
      }
    }).catch(error => {
      console.log('❌ GraphQL query failed:', error.message);
    });
  } else {
    console.log('❌ Apollo Client not found in window.__APOLLO_CLIENT__');
  }
  
  console.log('\n🏁 Filter functionality test completed!');
  console.log('\nExpected Results:');
  console.log('✅ Search input should be functional');
  console.log('✅ Type filter should have: WEB, MOBILE, API, SERVICE');
  console.log('✅ Status filter should have: ACTIVE, INACTIVE, PENDING, SUSPENDED');
  console.log('✅ No invalid status values like DEVELOPMENT, MAINTENANCE, DEPRECATED');
  console.log('✅ GraphQL queries should not produce enum errors');
}

// Auto-run the test
testFilterFunctionality();

// Export for manual testing
window.testFilterFunctionality = testFilterFunctionality; 