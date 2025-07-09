/**
 * Comprehensive Filtering Solution Test Suite
 * Tests all aspects of the filtering fixes and provides debugging capabilities
 */

console.log('🧪 Starting Comprehensive Filtering Solution Test Suite...\n');

// Test Configuration
const TEST_CONFIG = {
  searchDelay: 350, // Debounce delay + buffer
  validTypes: ['WEB', 'MOBILE', 'API', 'SERVICE'],
  validStatuses: ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'],
  invalidStatuses: ['DEVELOPMENT', 'MAINTENANCE', 'DEPRECATED', 'DELETED']
};

// Test Results Storage
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper Functions
const logTest = (testName, passed, details = '') => {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${testName}`);
  if (details) console.log(`   ${details}`);
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
  }
};

const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: GraphQL Query Parameter Structure
async function testGraphQLQueryStructure() {
  console.log('\n1. Testing GraphQL Query Parameter Structure...');
  
  try {
    // Mock the GraphQL query to see what parameters are actually sent
    const originalFetch = window.fetch;
    let capturedVariables = null;
    
    window.fetch = function(url, options) {
      if (options?.body) {
        try {
          const body = JSON.parse(options.body);
          if (body.query && body.query.includes('GetOrganizationApps')) {
            capturedVariables = body.variables;
            console.log('📤 Captured GraphQL variables:', capturedVariables);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      return originalFetch.apply(this, arguments);
    };
    
    // Trigger a filter change to capture the query
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    const typeFilter = document.querySelector('[data-radix-collection-item]');
    
    if (searchInput) {
      searchInput.value = 'test search';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Wait for debounce
      await waitFor(TEST_CONFIG.searchDelay);
      
      // Check if variables were captured and properly structured
      if (capturedVariables) {
        const hasCorrectStructure = (
          capturedVariables.hasOwnProperty('search') &&
          capturedVariables.hasOwnProperty('type') &&
          capturedVariables.hasOwnProperty('status') &&
          capturedVariables.hasOwnProperty('organizationId') &&
          !capturedVariables.hasOwnProperty('filter') // Should NOT have nested filter
        );
        
        logTest(
          'GraphQL query uses flat parameter structure',
          hasCorrectStructure,
          hasCorrectStructure ? 'Parameters properly destructured' : 'Still using nested filter object'
        );
        
        logTest(
          'Search parameter correctly passed',
          capturedVariables.search === 'test search',
          `Expected: 'test search', Got: '${capturedVariables.search}'`
        );
      } else {
        logTest('GraphQL query capture', false, 'Failed to capture GraphQL variables');
      }
    } else {
      logTest('Search input availability', false, 'Search input element not found');
    }
    
    // Restore original fetch
    window.fetch = originalFetch;
    
  } catch (error) {
    logTest('GraphQL query structure test', false, `Error: ${error.message}`);
  }
}

// Test 2: Debounced Search Implementation
async function testDebouncedSearch() {
  console.log('\n2. Testing Debounced Search Implementation...');
  
  try {
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    
    if (searchInput) {
      // Clear any existing value
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      const startTime = Date.now();
      let queryTriggered = false;
      
      // Monitor for GraphQL requests
      const originalFetch = window.fetch;
      window.fetch = function(url, options) {
        if (options?.body && options.body.includes('GetOrganizationApps')) {
          const timeSinceStart = Date.now() - startTime;
          if (timeSinceStart >= 250) { // Should be debounced
            queryTriggered = true;
            console.log(`📊 Query triggered after ${timeSinceStart}ms`);
          }
        }
        return originalFetch.apply(this, arguments);
      };
      
      // Rapidly type multiple characters
      const testSequence = ['t', 'te', 'tes', 'test'];
      for (let i = 0; i < testSequence.length; i++) {
        searchInput.value = testSequence[i];
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        await waitFor(50); // Type rapidly
      }
      
      // Wait for debounce period
      await waitFor(TEST_CONFIG.searchDelay);
      
      logTest(
        'Search debouncing prevents excessive API calls',
        queryTriggered,
        queryTriggered ? 'Query properly debounced' : 'Debouncing may not be working'
      );
      
      // Restore original fetch
      window.fetch = originalFetch;
    } else {
      logTest('Search input availability', false, 'Search input not found');
    }
  } catch (error) {
    logTest('Debounced search test', false, `Error: ${error.message}`);
  }
}

// Test 3: Filter Dropdown Options Validation
async function testFilterDropdownOptions() {
  console.log('\n3. Testing Filter Dropdown Options...');
  
  try {
    // Test Type Filter
    const typeFilterTriggers = document.querySelectorAll('[role="combobox"]');
    let typeFilterFound = false;
    
    for (const trigger of typeFilterTriggers) {
      const triggerText = trigger.textContent || '';
      if (triggerText.includes('type') || triggerText.includes('Type')) {
        typeFilterFound = true;
        trigger.click();
        
        await waitFor(100);
        
        const typeOptions = document.querySelectorAll('[role="option"]');
        const foundTypes = [];
        const invalidTypes = [];
        
        typeOptions.forEach(option => {
          const optionText = option.textContent || '';
          TEST_CONFIG.validTypes.forEach(validType => {
            if (optionText.includes(validType)) {
              foundTypes.push(validType);
            }
          });
        });
        
        logTest(
          'Type filter has all valid options',
          foundTypes.length === TEST_CONFIG.validTypes.length,
          `Found: ${foundTypes.join(', ')} | Expected: ${TEST_CONFIG.validTypes.join(', ')}`
        );
        
        // Close dropdown
        document.body.click();
        break;
      }
    }
    
    if (!typeFilterFound) {
      logTest('Type filter dropdown', false, 'Type filter dropdown not found');
    }
    
    // Test Status Filter
    await waitFor(200);
    const statusFilterTriggers = document.querySelectorAll('[role="combobox"]');
    let statusFilterFound = false;
    
    for (const trigger of statusFilterTriggers) {
      const triggerText = trigger.textContent || '';
      if (triggerText.includes('status') || triggerText.includes('Status')) {
        statusFilterFound = true;
        trigger.click();
        
        await waitFor(100);
        
        const statusOptions = document.querySelectorAll('[role="option"]');
        const foundStatuses = [];
        const foundInvalidStatuses = [];
        
        statusOptions.forEach(option => {
          const optionText = option.textContent || '';
          
          TEST_CONFIG.validStatuses.forEach(validStatus => {
            if (optionText.includes(validStatus)) {
              foundStatuses.push(validStatus);
            }
          });
          
          TEST_CONFIG.invalidStatuses.forEach(invalidStatus => {
            if (optionText.includes(invalidStatus)) {
              foundInvalidStatuses.push(invalidStatus);
            }
          });
        });
        
        logTest(
          'Status filter has valid options only',
          foundStatuses.length > 0 && foundInvalidStatuses.length === 0,
          `Valid: ${foundStatuses.join(', ')} | Invalid: ${foundInvalidStatuses.join(', ')}`
        );
        
        // Close dropdown
        document.body.click();
        break;
      }
    }
    
    if (!statusFilterFound) {
      logTest('Status filter dropdown', false, 'Status filter dropdown not found or not visible for this variant');
    }
    
  } catch (error) {
    logTest('Filter dropdown options test', false, `Error: ${error.message}`);
  }
}

// Test 4: Image Handling and Fallbacks
async function testImageHandling() {
  console.log('\n4. Testing Image Handling and Fallbacks...');
  
  try {
    const appImages = document.querySelectorAll('img[alt*="app" i], img[alt*="application" i]');
    const avatarElements = document.querySelectorAll('[data-radix-avatar-image], .avatar img');
    const allImages = [...appImages, ...avatarElements];
    
    let imagesWithFallback = 0;
    let brokenImages = 0;
    
    allImages.forEach((img, index) => {
      // Check if image has error handling
      const hasErrorHandler = img.onerror !== null;
      const hasParentFallback = img.closest('[data-radix-avatar-fallback]') !== null;
      
      if (hasErrorHandler || hasParentFallback) {
        imagesWithFallback++;
      }
      
      // Check if image is actually broken (naturalWidth is 0 for broken images)
      if (img.complete && img.naturalWidth === 0) {
        brokenImages++;
        console.log(`🖼️ Broken image detected: ${img.src || 'no src'}`);
      }
    });
    
    logTest(
      'Images have fallback mechanisms',
      imagesWithFallback === allImages.length,
      `${imagesWithFallback}/${allImages.length} images have fallbacks`
    );
    
    logTest(
      'No broken images displayed',
      brokenImages === 0,
      brokenImages > 0 ? `${brokenImages} broken images found` : 'All images load correctly'
    );
    
  } catch (error) {
    logTest('Image handling test', false, `Error: ${error.message}`);
  }
}

// Test 5: Performance and Memory Leaks
async function testPerformanceAndMemory() {
  console.log('\n5. Testing Performance and Memory Usage...');
  
  try {
    // Measure initial memory usage if available
    const initialMemory = performance.memory?.usedJSHeapSize;
    
    // Test rapid filter changes
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
      const startTime = performance.now();
      
      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        searchInput.value = `test${i}`;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        await waitFor(10);
      }
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      logTest(
        'UI remains responsive during rapid input',
        responseTime < 500,
        `Response time: ${responseTime.toFixed(2)}ms`
      );
      
      // Clear input
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Check for memory growth (basic check)
    if (initialMemory) {
      await waitFor(1000); // Wait for potential cleanup
      const finalMemory = performance.memory?.usedJSHeapSize;
      const memoryGrowth = finalMemory - initialMemory;
      
      logTest(
        'No excessive memory growth',
        memoryGrowth < 5 * 1024 * 1024, // Less than 5MB growth
        `Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`
      );
    }
    
  } catch (error) {
    logTest('Performance and memory test', false, `Error: ${error.message}`);
  }
}

// Test 6: Multi-tenant Data Isolation
async function testMultiTenantIsolation() {
  console.log('\n6. Testing Multi-tenant Data Isolation...');
  
  try {
    // Check if organization ID is being properly passed
    const originalFetch = window.fetch;
    let organizationIdCaptured = null;
    
    window.fetch = function(url, options) {
      if (options?.body && options.body.includes('GetOrganizationApps')) {
        try {
          const body = JSON.parse(options.body);
          organizationIdCaptured = body.variables?.organizationId;
        } catch (e) {
          // Ignore parsing errors
        }
      }
      return originalFetch.apply(this, arguments);
    };
    
    // Trigger a query by changing filters
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
      searchInput.value = 'isolation test';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      await waitFor(TEST_CONFIG.searchDelay);
      
      logTest(
        'Organization ID is properly included in queries',
        organizationIdCaptured && organizationIdCaptured !== '__INVALID_ORG_ID__',
        `Organization ID: ${organizationIdCaptured || 'not captured'}`
      );
      
      // Clear input
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Restore original fetch
    window.fetch = originalFetch;
    
  } catch (error) {
    logTest('Multi-tenant isolation test', false, `Error: ${error.message}`);
  }
}

// Main Test Execution
async function runAllTests() {
  console.log('🚀 Comprehensive Filtering Solution Test Suite');
  console.log('================================================\n');
  
  await testGraphQLQueryStructure();
  await testDebouncedSearch();
  await testFilterDropdownOptions();
  await testImageHandling();
  await testPerformanceAndMemory();
  await testMultiTenantIsolation();
  
  // Test Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🐛 FAILED TESTS:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.details}`);
    });
  }
  
  console.log('\n✨ Test suite completed!');
  
  // Return results for programmatic access
  return {
    passed: testResults.passed,
    failed: testResults.failed,
    successRate: (testResults.passed / (testResults.passed + testResults.failed)) * 100,
    errors: testResults.errors
  };
}

// Auto-run the tests
runAllTests().then(results => {
  console.log('\n🎯 RECOMMENDATIONS:');
  
  if (results.successRate === 100) {
    console.log('🎉 All tests passed! The filtering solution is working correctly.');
  } else if (results.successRate >= 80) {
    console.log('👍 Most tests passed. Minor issues may need attention.');
  } else {
    console.log('⚠️  Several tests failed. Review the implementation and fix issues.');
  }
  
  console.log('\n📝 For detailed debugging, check the console logs above.');
  console.log('📋 Run individual test functions for focused debugging.');
});

// Export functions for manual testing
window.testFilteringSolution = {
  runAllTests,
  testGraphQLQueryStructure,
  testDebouncedSearch,
  testFilterDropdownOptions,
  testImageHandling,
  testPerformanceAndMemory,
  testMultiTenantIsolation
}; 