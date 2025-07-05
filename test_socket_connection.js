const io = require('socket.io-client');

console.log('🔌 Testing socket connection to backend...');

const socket = io('http://localhost:4000', {
  transports: ['websocket', 'polling'],
  timeout: 20000,
});

socket.on('connect', () => {
  console.log('✅ Socket connected successfully!');
  
  // Test kitchen chat request
  const testRequest = {
    conversationId: 'test_' + Date.now(),
    characterId: 'achilles',
    prompt: 'Test prompt for kitchen conversation',
    trigger: 'Someone is making loud breakfast noises',
    context: {
      teammates: ['holmes', 'dracula'],
      coach: 'Coach Thompson',
      livingConditions: {
        apartmentTier: 'spartan_apartment',
        roomTheme: null,
        sleepsOnCouch: false,
        sleepsUnderTable: false
      }
    }
  };
  
  console.log('📤 Sending kitchen chat request:', testRequest.conversationId);
  socket.emit('kitchen_chat_request', testRequest);
  
  // Listen for response
  socket.on('kitchen_conversation_response', (data) => {
    console.log('📥 Received response:', data);
    process.exit(0);
  });
  
  // Timeout after 30 seconds
  setTimeout(() => {
    console.log('❌ Timeout waiting for response');
    process.exit(1);
  }, 30000);
});

socket.on('connect_error', (error) => {
  console.log('❌ Socket connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('🔌 Socket disconnected');
});