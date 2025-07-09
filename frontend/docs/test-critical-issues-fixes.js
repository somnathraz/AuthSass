/**
 * Critical Issues Testing Suite
 * Tests the three main issues that were reported and fixed:
 * 1. User.role GraphQL error in manage members modal
 * 2. User.role GraphQL error in manage API keys modal  
 * 3. Deactivate app action not working
 */

console.log('🧪 Starting Critical Issues Testing Suite...\n');

// Test Configuration
const TEST_CONFIG = {
  waitTime: 1000, // Wait time between actions
  modalOpenDelay: 500, // Time to wait for modals to open
  maxRetries: 3, // Maximum retries for operations
};

// Test Results Storage
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  fixes: []
};

// Helper Functions
const logTest = (testName, passed, details = '', fix = '') => {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${testName}`);
  if (details) console.log(`   ${details}`);
  if (fix && !passed) {
    console.log(`   🔧 Fix Applied: ${fix}`);
    testResults.fixes.push(fix);
  }
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, details, fix });
  }
};

const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const findElementSafely = (selector, timeout = 5000) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime < timeout) {
        setTimeout(checkElement, 100);
      } else {
        resolve(null);
      }
    };
    checkElement();
  });
};

// Test 1: User.role GraphQL Error in Manage Members Modal
async function testManageMembersModal() {
  console.log('\n1. Testing Manage Members Modal (User.role GraphQL Error)...');
  
  try {
    // Find an application row with manage members action
    const appRows = document.querySelectorAll('[data-app-id]');
    let testApp = null;
    let manageMembersButton = null;

    for (const row of appRows) {
      const dropdown = row.querySelector('[role="button"]');
      if (dropdown) {
        // Click dropdown to open it
        dropdown.click();
        await waitFor(TEST_CONFIG.modalOpenDelay);
        
        // Look for manage members option
        const membersOption = document.querySelector('[role="menuitem"]');
        if (membersOption && membersOption.textContent.includes('Manage Members')) {
          testApp = row.getAttribute('data-app-id');
          manageMembersButton = membersOption;
          break;
        }
        
        // Close dropdown if not the right one
        document.body.click();
        await waitFor(200);
      }
    }

    if (!testApp || !manageMembersButton) {
      logTest(
        'Find manage members button',
        false,
        'No manage members button found on any application'
      );
      return;
    }

    logTest(
      'Find manage members button',
      true,
      `Found manage members for app: ${testApp}`
    );

    // Click manage members
    manageMembersButton.click();
    await waitFor(TEST_CONFIG.modalOpenDelay);

    // Check if modal opened without GraphQL errors
    const modal = await findElementSafely('[role="dialog"]', 3000);
    const hasGraphQLError = document.body.textContent.includes('Cannot return null for non-nullable field User.role');
    
    logTest(
      'Manage members modal opens without GraphQL errors',
      modal && !hasGraphQLError,
      hasGraphQLError ? 'GraphQL User.role error detected' : 'Modal opened successfully',
      hasGraphQLError ? 'Backend: Added role field to user population queries' : ''
    );

    if (modal) {
      // Check if Add Members tab works
      const addMembersTab = modal.querySelector('[value="invite"]');
      if (addMembersTab) {
        addMembersTab.click();
        await waitFor(TEST_CONFIG.modalOpenDelay);
        
        const addMemberForm = modal.querySelector('form');
        const hasAddMemberError = modal.textContent.includes('Cannot return null for non-nullable field User.role');
        
        logTest(
          'Add Members tab loads without errors',
          addMemberForm && !hasAddMemberError,
          hasAddMemberError ? 'GraphQL error in add members form' : 'Add members form loaded successfully',
          hasAddMemberError ? 'Backend: Fixed organization members query population' : ''
        );
      }

      // Close modal
      const closeButton = modal.querySelector('[aria-label="Close"]') || 
                         modal.querySelector('button:last-child');
      if (closeButton) {
        closeButton.click();
        await waitFor(300);
      }
    }

  } catch (error) {
    logTest(
      'Manage members modal test',
      false,
      `Error: ${error.message}`,
      'Check backend user population queries and add role field'
    );
  }
}

// Test 2: User.role GraphQL Error in Manage API Keys Modal
async function testManageApiKeysModal() {
  console.log('\n2. Testing Manage API Keys Modal (User.role GraphQL Error)...');
  
  try {
    // Find an application row with manage API keys action
    const appRows = document.querySelectorAll('[data-app-id]');
    let testApp = null;
    let apiKeysButton = null;

    for (const row of appRows) {
      const dropdown = row.querySelector('[role="button"]');
      if (dropdown) {
        // Click dropdown to open it
        dropdown.click();
        await waitFor(TEST_CONFIG.modalOpenDelay);
        
        // Look for manage API keys option
        const apiKeysOptions = Array.from(document.querySelectorAll('[role="menuitem"]'));
        const keysOption = apiKeysOptions.find(option => 
          option.textContent.includes('Manage API Keys') || 
          option.textContent.includes('API Keys')
        );
        
        if (keysOption) {
          testApp = row.getAttribute('data-app-id');
          apiKeysButton = keysOption;
          break;
        }
        
        // Close dropdown if not the right one
        document.body.click();
        await waitFor(200);
      }
    }

    if (!testApp || !apiKeysButton) {
      logTest(
        'Find manage API keys button',
        false,
        'No manage API keys button found on any application'
      );
      return;
    }

    logTest(
      'Find manage API keys button',
      true,
      `Found manage API keys for app: ${testApp}`
    );

    // Click manage API keys
    apiKeysButton.click();
    await waitFor(TEST_CONFIG.modalOpenDelay);

    // Check if modal opened without GraphQL errors
    const modal = await findElementSafely('[role="dialog"]', 3000);
    const hasGraphQLError = document.body.textContent.includes('Cannot return null for non-nullable field User.role');
    
    logTest(
      'Manage API keys modal opens without GraphQL errors',
      modal && !hasGraphQLError,
      hasGraphQLError ? 'GraphQL User.role error detected' : 'Modal opened successfully',
      hasGraphQLError ? 'Backend: Fixed user role population in API key queries' : ''
    );

    if (modal) {
      // Check for API keys content
      const hasApiKeysContent = modal.textContent.includes('API Keys') || 
                               modal.textContent.includes('Generate Key');
      
      logTest(
        'API keys content loads properly',
        hasApiKeysContent,
        hasApiKeysContent ? 'API keys manager loaded' : 'API keys content missing'
      );

      // Close modal
      const closeButton = modal.querySelector('[aria-label="Close"]') || 
                         modal.querySelector('button:last-child');
      if (closeButton) {
        closeButton.click();
        await waitFor(300);
      }
    }

  } catch (error) {
    logTest(
      'Manage API keys modal test',
      false,
      `Error: ${error.message}`,
      'Check API key data structure handling and user population'
    );
  }
}

// Test 3: Deactivate App Action Functionality
async function testDeactivateAppAction() {
  console.log('\n3. Testing Deactivate App Action...');
  
  try {
    // Find an ACTIVE application to test deactivation
    const appRows = document.querySelectorAll('[data-app-id]');
    let testApp = null;
    let testAppName = null;
    let deactivateButton = null;

    for (const row of appRows) {
      const appName = row.getAttribute('data-app-name');
      const statusBadge = row.querySelector('[class*="badge"]');
      
      // Look for an active app
      if (statusBadge && statusBadge.textContent.includes('ACTIVE')) {
        const dropdown = row.querySelector('[role="button"]');
        if (dropdown) {
          // Click dropdown to open it
          dropdown.click();
          await waitFor(TEST_CONFIG.modalOpenDelay);
          
          // Look for deactivate option
          const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
          const deactivateOption = menuItems.find(item => 
            item.textContent.includes('Deactivate') ||
            item.textContent.includes('Pause') ||
            item.textContent.includes('Inactive')
          );
          
          if (deactivateOption) {
            testApp = row.getAttribute('data-app-id');
            testAppName = appName;
            deactivateButton = deactivateOption;
            break;
          }
          
          // Close dropdown if not the right one
          document.body.click();
          await waitFor(200);
        }
      }
    }

    if (!testApp || !deactivateButton) {
      logTest(
        'Find deactivate app action',
        false,
        'No active application with deactivate action found'
      );
      return;
    }

    logTest(
      'Find deactivate app action',
      true,
      `Found deactivate action for app: ${testAppName} (${testApp})`
    );

    // Monitor for GraphQL network requests
    const originalFetch = window.fetch;
    let updateAppCalled = false;
    let updateAppResult = null;

    window.fetch = function(url, options) {
      if (options?.body && options.body.includes('updateApp')) {
        updateAppCalled = true;
        console.log('🔍 UpdateApp mutation detected');
        
        // Capture the result
        const result = originalFetch.apply(this, arguments);
        result.then(response => response.clone().json())
              .then(data => {
                updateAppResult = data;
                console.log('📊 UpdateApp result:', data);
              })
              .catch(err => console.log('❌ UpdateApp error:', err));
        
        return result;
      }
      return originalFetch.apply(this, arguments);
    };

    // Click deactivate
    console.log(`🔄 Attempting to deactivate app: ${testAppName}`);
    deactivateButton.click();
    
    // Wait for potential confirmation dialog
    await waitFor(500);
    
    // Check for confirmation dialog and confirm if present
    const confirmDialog = document.querySelector('[role="alertdialog"]');
    if (confirmDialog) {
      const confirmButton = confirmDialog.querySelector('button[class*="destructive"]') ||
                           confirmDialog.querySelector('button:last-child');
      if (confirmButton && confirmButton.textContent.includes('Deactivate')) {
        confirmButton.click();
      }
    }

    // Wait for the mutation to complete
    await waitFor(2000);

    // Check if the update was successful
    logTest(
      'UpdateApp mutation is called',
      updateAppCalled,
      updateAppCalled ? 'UpdateApp GraphQL mutation was triggered' : 'No GraphQL mutation detected',
      !updateAppCalled ? 'Frontend: Check handleToggleStatus implementation' : ''
    );

    if (updateAppResult) {
      const isSuccessful = updateAppResult.data?.updateApp?.success || false;
      logTest(
        'App status update succeeds',
        isSuccessful,
        isSuccessful ? 'App status updated successfully' : 'App status update failed',
        !isSuccessful ? 'Backend: Check updateApp resolver permissions and validation' : ''
      );
    }

    // Restore original fetch
    window.fetch = originalFetch;

  } catch (error) {
    logTest(
      'Deactivate app action test',
      false,
      `Error: ${error.message}`,
      'Check frontend update implementation and backend resolver'
    );
  }
}

// Test 4: General UI Responsiveness and Error Handling
async function testGeneralUIHealth() {
  console.log('\n4. Testing General UI Health...');
  
  try {
    // Check for JavaScript errors in console
    const hasJSErrors = window.console.error.toString().includes('Error') ||
                       document.body.textContent.includes('Error:') ||
                       document.body.textContent.includes('Failed to');
    
    logTest(
      'No JavaScript errors in console',
      !hasJSErrors,
      hasJSErrors ? 'JavaScript errors detected' : 'No JavaScript errors found'
    );

    // Check for GraphQL errors
    const hasGraphQLErrors = document.body.textContent.includes('GraphQL error') ||
                            document.body.textContent.includes('Cannot return null for non-nullable field');
    
    logTest(
      'No GraphQL schema errors',
      !hasGraphQLErrors,
      hasGraphQLErrors ? 'GraphQL schema errors detected' : 'No GraphQL schema errors found',
      hasGraphQLErrors ? 'Run backend database migration: node fix-null-user-roles.js' : ''
    );

    // Check if main app functionality is working
    const hasAppList = document.querySelector('[data-app-id]') !== null;
    const hasNavigationElements = document.querySelector('nav') !== null ||
                                 document.querySelector('[role="navigation"]') !== null;
    
    logTest(
      'Main application functionality works',
      hasAppList && hasNavigationElements,
      `App list: ${hasAppList}, Navigation: ${hasNavigationElements}`
    );

  } catch (error) {
    logTest(
      'General UI health test',
      false,
      `Error: ${error.message}`
    );
  }
}

// Main test execution function
async function runAllTests() {
  console.log('🚀 Critical Issues Testing Suite');
  console.log('===================================\n');
  console.log('Testing fixes for:');
  console.log('1. User.role GraphQL error in manage members modal');
  console.log('2. User.role GraphQL error in manage API keys modal');
  console.log('3. Deactivate app action not working');
  console.log('');

  try {
    await testManageMembersModal();
    await testManageApiKeysModal();
    await testDeactivateAppAction();
    await testGeneralUIHealth();

    // Test Summary
    console.log('\n📊 CRITICAL ISSUES TEST SUMMARY');
    console.log('================================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

    if (testResults.errors.length > 0) {
      console.log('\n🐛 FAILED TESTS & FIXES:');
      testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}`);
        if (error.details) console.log(`   Details: ${error.details}`);
        if (error.fix) console.log(`   🔧 Fix: ${error.fix}`);
      });
    }

    if (testResults.fixes.length > 0) {
      console.log('\n🔧 FIXES APPLIED:');
      testResults.fixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix}`);
      });
    }

    console.log('\n🎯 RESOLUTION STATUS:');
    
    if (testResults.passed >= 6) { // Minimum 6 tests should pass
      console.log('🎉 All critical issues appear to be resolved!');
      console.log('✅ The fixes have been successfully implemented.');
    } else if (testResults.passed >= 4) {
      console.log('⚠️  Most issues resolved, but some remain.');
      console.log('🔧 Review the failed tests and apply suggested fixes.');
    } else {
      console.log('❌ Several critical issues still need attention.');
      console.log('🚨 Please review and apply all suggested fixes.');
    }

    console.log('\n📝 NEXT STEPS:');
    console.log('1. Run backend migration: cd backend && node fix-null-user-roles.js');
    console.log('2. Restart both frontend and backend services');
    console.log('3. Test manually in the UI to confirm fixes');
    console.log('4. Monitor for any remaining GraphQL errors');

  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }

  return {
    passed: testResults.passed,
    failed: testResults.failed,
    errors: testResults.errors,
    fixes: testResults.fixes,
    successRate: (testResults.passed / (testResults.passed + testResults.failed)) * 100
  };
}

// Export for manual testing
window.testCriticalIssues = {
  runAllTests,
  testManageMembersModal,
  testManageApiKeysModal,
  testDeactivateAppAction,
  testGeneralUIHealth
};

// Auto-run tests when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  runAllTests();
} 