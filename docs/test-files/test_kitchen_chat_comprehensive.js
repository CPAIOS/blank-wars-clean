const io = require('socket.io-client');

console.log('🍽️ COMPREHENSIVE KITCHEN CHAT WEBSOCKET TEST');
console.log('===========================================');

// Test Configuration
const BACKEND_URL = 'http://localhost:3006';
const TEST_TIMEOUT = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds

// Test Data
const testScenarios = [
  {
    name: 'Basic Achilles Response',
    data: {
      conversationId: 'test_achilles_' + Date.now(),
      characterId: 'achilles',
      prompt: 'Test prompt for Achilles kitchen conversation',
      trigger: 'Someone is making loud breakfast noises in the cramped kitchen',
      context: {
        teammates: ['sherlock', 'dracula', 'merlin'],
        coach: 'Coach Thompson',
        livingConditions: {
          apartmentTier: 'spartan_apartment',
          roomTheme: null,
          sleepsOnCouch: false,
          sleepsOnFloor: true,
          sleepsUnderTable: false,
          roomOvercrowded: true,
          floorSleeperCount: 2,
          roommateCount: 4
        }
      }
    }
  },
  {
    name: 'Dracula Morning Complaint',
    data: {
      conversationId: 'test_dracula_' + Date.now(),
      characterId: 'dracula',
      prompt: 'Test prompt for Dracula morning complaint',
      trigger: 'Someone opened the curtains during your sleep time',
      context: {
        teammates: ['achilles', 'sherlock', 'cleopatra'],
        coach: 'Coach Thompson',
        livingConditions: {
          apartmentTier: 'spartan_apartment',
          roomTheme: 'gothic',
          sleepsOnCouch: false,
          sleepsOnFloor: false,
          sleepsUnderTable: true,
          roomOvercrowded: true,
          floorSleeperCount: 1,
          roommateCount: 4
        }
      }
    }
  },
  {
    name: 'Coach Direct Message Response',
    data: {
      conversationId: 'test_coach_msg_' + Date.now(),
      characterId: 'sherlock',
      prompt: 'Test prompt for coach response',
      trigger: 'Your coach just said to everyone: "We need to work better as a team in these living conditions." React and respond directly to them.',
      context: {
        teammates: ['achilles', 'dracula', 'tesla'],
        coach: 'Coach Thompson',
        livingConditions: {
          apartmentTier: 'decent_apartment',
          roomTheme: 'modern',
          sleepsOnCouch: false,
          sleepsOnFloor: false,
          sleepsUnderTable: false,
          roomOvercrowded: false,
          floorSleeperCount: 0,
          roommateCount: 3
        }
      }
    }
  }
];

let testResults = [];
let currentTestIndex = 0;

// Connect to backend
console.log(`🔌 Connecting to ${BACKEND_URL}...`);
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  timeout: CONNECTION_TIMEOUT,
  forceNew: true
});

// Track connection
let isConnected = false;
let connectionTimer = null;

// Connection handlers
socket.on('connect', () => {
  console.log('✅ Socket connected successfully!');
  console.log(`🆔 Socket ID: ${socket.id}`);
  isConnected = true;
  
  if (connectionTimer) {
    clearTimeout(connectionTimer);
    connectionTimer = null;
  }
  
  // Start running tests
  runNextTest();
});

socket.on('connect_error', (error) => {
  console.log('❌ Socket connection error:', error.message);
  console.log('🔍 Error details:', error);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Socket disconnected:', reason);
  isConnected = false;
});

// Set connection timeout
connectionTimer = setTimeout(() => {
  if (!isConnected) {
    console.log('❌ Connection timeout - backend may not be running on port 3006');
    console.log('💡 Try running: npm run dev from the backend directory');
    process.exit(1);
  }
}, CONNECTION_TIMEOUT);

// Kitchen chat response handler
socket.on('kitchen_conversation_response', (data) => {
  const currentTest = testScenarios[currentTestIndex - 1];
  if (!currentTest) return;
  
  console.log(`📥 Received response for: ${currentTest.name}`);
  console.log(`🆔 Conversation ID: ${data.conversationId}`);
  console.log(`🎭 Character: ${data.characterId}`);
  console.log(`💬 Message: "${data.message}"`);
  console.log(`⏰ Timestamp: ${data.timestamp}`);
  
  if (data.error) {
    console.log(`❌ Error: ${data.error}`);
    if (data.usageLimitReached) {
      console.log('⚠️ Usage limit reached');
    }
  }
  
  // Record test result
  testResults.push({
    testName: currentTest.name,
    conversationId: data.conversationId,
    characterId: data.characterId,
    success: !data.error,
    messageLength: data.message ? data.message.length : 0,
    hasMessage: !!data.message,
    error: data.error || null,
    usageLimitReached: data.usageLimitReached || false,
    responseTime: Date.now() - currentTest.startTime
  });
  
  console.log('---');
  
  // Run next test or finish
  setTimeout(() => {
    runNextTest();
  }, 1000); // 1 second delay between tests
});

// Error handler for kitchen chat
socket.on('kitchen_chat_error', (error) => {
  console.log('❌ Kitchen chat error:', error);
  const currentTest = testScenarios[currentTestIndex - 1];
  if (currentTest) {
    testResults.push({
      testName: currentTest.name,
      conversationId: currentTest.data.conversationId,
      characterId: currentTest.data.characterId,
      success: false,
      messageLength: 0,
      hasMessage: false,
      error: error.error || 'Unknown error',
      usageLimitReached: false,
      responseTime: Date.now() - currentTest.startTime
    });
  }
  
  setTimeout(() => {
    runNextTest();
  }, 1000);
});

function runNextTest() {
  if (currentTestIndex >= testScenarios.length) {
    // All tests completed
    printTestResults();
    process.exit(0);
    return;
  }
  
  const test = testScenarios[currentTestIndex];
  currentTestIndex++;
  
  console.log(`🧪 Running Test ${currentTestIndex}/${testScenarios.length}: ${test.name}`);
  console.log(`📤 Sending kitchen chat request...`);
  console.log(`🎭 Character: ${test.data.characterId}`);
  console.log(`🎬 Trigger: ${test.data.trigger}`);
  
  test.startTime = Date.now();
  
  // Send the kitchen chat request
  socket.emit('kitchen_chat_request', test.data);
  
  // Set timeout for this specific test
  setTimeout(() => {
    const resultIndex = testResults.findIndex(r => r.conversationId === test.data.conversationId);
    if (resultIndex === -1) {
      // No response received - timeout
      console.log(`⏰ Test timeout: ${test.name}`);
      testResults.push({
        testName: test.name,
        conversationId: test.data.conversationId,
        characterId: test.data.characterId,
        success: false,
        messageLength: 0,
        hasMessage: false,
        error: 'Timeout',
        usageLimitReached: false,
        responseTime: TEST_TIMEOUT
      });
      
      setTimeout(() => {
        runNextTest();
      }, 500);
    }
  }, TEST_TIMEOUT);
}

function printTestResults() {
  console.log('\n🏁 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  const successCount = testResults.filter(r => r.success).length;
  const totalCount = testResults.length;
  
  console.log(`✅ Successful tests: ${successCount}/${totalCount}`);
  console.log(`❌ Failed tests: ${totalCount - successCount}/${totalCount}`);
  console.log(`📊 Success rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  testResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.testName}`);
    console.log(`   🎭 Character: ${result.characterId}`);
    console.log(`   ✅ Success: ${result.success}`);
    console.log(`   📝 Has Message: ${result.hasMessage}`);
    console.log(`   📏 Message Length: ${result.messageLength} chars`);
    console.log(`   ⏱️ Response Time: ${result.responseTime}ms`);
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
    if (result.usageLimitReached) {
      console.log(`   ⚠️ Usage Limit Reached: Yes`);
    }
  });
  
  console.log('\n🔧 CONNECTION INFO:');
  console.log(`🌐 Backend URL: ${BACKEND_URL}`);
  console.log(`🆔 Socket ID: ${socket.id}`);
  console.log(`🔌 Connected: ${isConnected}`);
  
  console.log('\n✅ Kitchen Chat WebSocket test completed!');
  
  if (successCount === totalCount) {
    console.log('🎉 All tests passed! Kitchen Chat system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the backend logs and AI service configuration.');
  }
  
  socket.disconnect();
}