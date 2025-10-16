// Debug script to test September filter functionality on Dashboard
// Run this in the browser console while on the Dashboard page

console.log('🔍 Starting September Dashboard Debug...');

// Function to wait for elements
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Function to simulate month selection
async function selectMonth(monthValue) {
  console.log(`📅 Selecting month: ${monthValue}`);
  
  try {
    // Find the month select element
    const monthSelect = await waitForElement('select[name="mes"], select:has(option[value="setembro"]), select:has(option[value="9"])');
    
    if (!monthSelect) {
      console.error('❌ Month select element not found');
      return false;
    }

    // Set the value
    monthSelect.value = monthValue;
    
    // Dispatch change event
    const changeEvent = new Event('change', { bubbles: true });
    monthSelect.dispatchEvent(changeEvent);
    
    console.log(`✅ Month ${monthValue} selected successfully`);
    return true;
  } catch (error) {
    console.error('❌ Error selecting month:', error);
    return false;
  }
}

// Function to check dashboard state
function checkDashboardState() {
  console.log('🔍 Checking Dashboard state...');
  
  // Check for activity cards
  const activityCards = document.querySelectorAll('[data-testid="activity-card"], .activity-card, .card:has(.activity)');
  console.log(`📊 Found ${activityCards.length} activity cards`);
  
  // Check for "no data" messages
  const noDataMessages = document.querySelectorAll('[data-testid="no-data"], .no-data, .empty-state');
  console.log(`🚫 Found ${noDataMessages.length} "no data" messages`);
  
  // Check for statistics cards
  const statsCards = document.querySelectorAll('[data-testid="stats-card"], .stats-card, .estatisticas');
  console.log(`📈 Found ${statsCards.length} statistics cards`);
  
  // Check for loading states
  const loadingElements = document.querySelectorAll('[data-testid="loading"], .loading, .spinner');
  console.log(`⏳ Found ${loadingElements.length} loading elements`);
  
  // Check for error messages
  const errorMessages = document.querySelectorAll('[data-testid="error"], .error, .alert-error');
  console.log(`❌ Found ${errorMessages.length} error messages`);
  
  return {
    activityCards: activityCards.length,
    noDataMessages: noDataMessages.length,
    statsCards: statsCards.length,
    loadingElements: loadingElements.length,
    errorMessages: errorMessages.length
  };
}

// Function to check console logs for mesComDados debug info
function checkConsoleDebugLogs() {
  console.log('🔍 Looking for mesComDados debug logs...');
  
  // This will show recent console logs that might contain debug info
  // Note: We can't access previous console logs, but we can trigger new ones
  console.log('💡 Tip: Look for debug logs containing "mesComDados", "temDados", "metasDoMes", or "atividadesDoMes"');
}

// Main test function
async function testSeptemberFilter() {
  console.log('🚀 Starting September Filter Test...');
  
  // Initial state check
  console.log('\n1️⃣ Initial Dashboard State:');
  const initialState = checkDashboardState();
  
  // Wait a moment for any initial loading
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Try to select September
  console.log('\n2️⃣ Selecting September...');
  const septemberSelected = await selectMonth('setembro') || await selectMonth('9') || await selectMonth('Setembro');
  
  if (!septemberSelected) {
    console.error('❌ Failed to select September');
    return;
  }
  
  // Wait for data to load
  console.log('\n3️⃣ Waiting for data to load...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check state after September selection
  console.log('\n4️⃣ Dashboard State After September Selection:');
  const septemberState = checkDashboardState();
  
  // Compare states
  console.log('\n5️⃣ State Comparison:');
  console.log('Initial:', initialState);
  console.log('September:', septemberState);
  
  // Check for debug logs
  console.log('\n6️⃣ Debug Logs Check:');
  checkConsoleDebugLogs();
  
  // Test October for comparison
  console.log('\n7️⃣ Testing October for comparison...');
  const octoberSelected = await selectMonth('outubro') || await selectMonth('10') || await selectMonth('Outubro');
  
  if (octoberSelected) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const octoberState = checkDashboardState();
    console.log('October State:', octoberState);
  }
  
  console.log('\n✅ September Filter Test Complete!');
  console.log('📋 Summary:');
  console.log(`- September activities: ${septemberState.activityCards}`);
  console.log(`- September no-data messages: ${septemberState.noDataMessages}`);
  console.log(`- September stats cards: ${septemberState.statsCards}`);
}

// Run the test
testSeptemberFilter().catch(console.error);