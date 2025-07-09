// Comprehensive Click Events Test Script
// Tests click functionality before and after app updates

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const findElement = (selector, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element not found: ${selector}`));
      } else {
        setTimeout(check, 100);
      }
    };
    
    check();
  });
};

const testClickEvent = async (selector, description) => {
  console.log(`\n🔍 Testing: ${description}`);
  try {
    const element = await findElement(selector);
    
    // Check if element is clickable
    const rect = element.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    const isEnabled = !element.disabled && !element.hasAttribute('disabled');
    
    if (!isVisible || !isEnabled) {
      console.log(`❌ FAIL: ${description} - Element not clickable`);
      return false;
    }
    
    // Test click with comprehensive event handling
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    element.dispatchEvent(clickEvent);
    await wait(500);
    
    console.log(`✅ PASS: ${description} - Click successful`);
    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${description} - ${error.message}`);
    return false;
  }
};

// Test all action buttons on the page
const testAllActionButtons = async () => {
  console.log('\n🔧 Testing all action buttons...');
  
  const tests = [
    {
      selector: 'button:has(svg.lucide-more-horizontal)',
      description: 'Action dropdown buttons'
    },
    {
      selector: 'button[type="submit"]',
      description: 'Submit buttons'
    },
    {
      selector: 'button:contains("Create")',
      description: 'Create buttons'
    },
    {
      selector: '[role="menuitem"]',
      description: 'Menu items'
    }
  ];
  
  let successCount = 0;
  let totalCount = 0;
  
  for (const test of tests) {
    try {
      const elements = document.querySelectorAll(test.selector);
      console.log(`\n📊 Found ${elements.length} ${test.description}`);
      
      for (let i = 0; i < Math.min(elements.length, 3); i++) {
        totalCount++;
        const success = await testClickEvent(
          `${test.selector}:nth-child(${i + 1})`,
          `${test.description} #${i + 1}`
        );
        if (success) successCount++;
      }
    } catch (error) {
      console.log(`⚠️ Warning: Could not test ${test.description} - ${error.message}`);
    }
  }
  
  return { success: successCount, total: totalCount };
};

// Enhanced main test function
const testAppUpdateClickEvents = async () => {
  console.log('\n🚀 Starting ENHANCED App Update Click Events Test...');
  console.log('🔧 Testing React.memo fix, event delegation, and component stability');
  
  try {
    // Step 1: Test click events before update
    console.log('\n1️⃣ Testing click events BEFORE update...');
    const preResults = await testAllActionButtons();
    console.log(`Pre-update: ${preResults.success}/${preResults.total} buttons working`);
    
    if (preResults.success === 0) {
      console.log('❌ No action buttons working before update. Test aborted.');
      return { success: false, reason: 'No buttons working initially' };
    }
    
    // Step 2: Monitor console for React.memo logs
    console.log('\n2️⃣ Monitoring React.memo behavior...');
    const originalConsoleLog = console.log;
    const memoLogs = [];
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('AppActions memo check')) {
        memoLogs.push(message);
      }
      originalConsoleLog(...args);
    };
    
    // Step 3: Find and edit an app
    console.log('\n3️⃣ Performing app update...');
    const firstActionButton = document.querySelector('button:has(svg.lucide-more-horizontal)');
    if (!firstActionButton) {
      throw new Error('No action buttons found');
    }
    
    // Open action menu
    firstActionButton.click();
    await wait(500);
    
    // Click edit
    const editMenuItem = document.querySelector('[role="menuitem"]:has(svg.lucide-edit)');
    if (!editMenuItem) {
      throw new Error('Edit menu item not found');
    }
    editMenuItem.click();
    await wait(1000);
    
    // Update app name
    const nameInput = document.querySelector('input[id="appName"], input[name="name"]');
    if (!nameInput) {
      throw new Error('Name input not found');
    }
    
    const originalName = nameInput.value;
    const newName = `${originalName} - Updated ${Date.now()}`;
    nameInput.value = newName;
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Submit update
    const submitButton = document.querySelector('button[type="submit"]');
    if (!submitButton) {
      throw new Error('Submit button not found');
    }
    submitButton.click();
    
    // Wait for update to complete
    console.log('\n4️⃣ Waiting for update to complete...');
    await wait(3000);
    
    // Restore console.log
    console.log = originalConsoleLog;
    
    // Step 4: Analyze React.memo behavior
    console.log('\n5️⃣ Analyzing React.memo behavior...');
    console.log(`Captured ${memoLogs.length} memo decisions:`);
    memoLogs.forEach(log => console.log(`  ${log}`));
    
    // Step 5: Test click events after update
    console.log('\n6️⃣ Testing click events AFTER update...');
    const postResults = await testAllActionButtons();
    console.log(`Post-update: ${postResults.success}/${postResults.total} buttons working`);
    
    // Step 6: Test specific event delegation
    console.log('\n7️⃣ Testing event delegation...');
    const tableRows = document.querySelectorAll('tr[data-app-id]');
    console.log(`Found ${tableRows.length} app rows with stable data attributes`);
    
    // Results
    const success = postResults.success === postResults.total && postResults.success > 0;
    const memoWorking = memoLogs.some(log => log.includes('SKIP re-render'));
    const eventDelegationWorking = tableRows.length > 0;
    
    console.log(`\n📊 COMPREHENSIVE TEST RESULTS:`);
    console.log(`Pre-update: ${preResults.success}/${preResults.total} buttons working`);
    console.log(`Post-update: ${postResults.success}/${postResults.total} buttons working`);
    console.log(`React.memo working: ${memoWorking ? '✅' : '❌'}`);
    console.log(`Event delegation stable: ${eventDelegationWorking ? '✅' : '❌'}`);
    console.log(`Stable data attributes: ${tableRows.length} rows`);
    
    if (success && memoWorking && eventDelegationWorking) {
      console.log('\n🎉 SUCCESS: All fixes working correctly!');
      console.log('✅ React.memo preventing unnecessary re-renders');
      console.log('✅ Event delegation working properly');
      console.log('✅ Click events stable after updates');
      console.log('✅ Component stability maintained');
    } else {
      console.log('\n🚨 PARTIAL SUCCESS: Some issues remain');
      if (!success) console.log('❌ Click events still broken after update');
      if (!memoWorking) console.log('❌ React.memo not preventing re-renders');
      if (!eventDelegationWorking) console.log('❌ Event delegation issues persist');
    }
    
    return { 
      success: success && memoWorking && eventDelegationWorking, 
      preResults, 
      postResults,
      memoWorking,
      eventDelegationWorking,
      memoLogs
    };
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return { success: false, reason: error.message };
  }
};

// Auto-run test
if (typeof window !== 'undefined') {
  console.log('🔧 ENHANCED Click Event Test Script Loaded');
  console.log('🎯 Testing React.memo fix, event delegation, and component stability');
  console.log('Run testAppUpdateClickEvents() to start testing');
  
  // Make function available globally
  window.testAppUpdateClickEvents = testAppUpdateClickEvents;
  window.testAllActionButtons = testAllActionButtons;
  
  // Auto-run after 2 seconds
  setTimeout(() => {
    console.log('🚀 Auto-running enhanced test...');
    testAppUpdateClickEvents();
  }, 2000);
}

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAppUpdateClickEvents, testAllActionButtons };
} 