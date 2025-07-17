#!/usr/bin/env node
const { io } = require('socket.io-client');

console.log('🧪 Kitchen Chat Debug Test');
console.log('===========================');

const BACKEND_URL = 'http://localhost:3006';
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  timeout: 10000,
});

socket.on('connect', () => {
  console.log('✅ Connected to backend with ID:', socket.id);
  
  // Test kitchen chat request
  const testRequest = {
    conversationId: 'test_kitchen_' + Date.now(),
    characterId: 'sherlock_holmes',
    prompt: 'You are Sherlock Holmes living in cramped quarters with other characters. Someone is making coffee loudly in the morning.',
    trigger: 'Morning coffee brewing (loud noises)',
    context: {
      teammates: ['Dracula', 'Achilles'],
      coach: 'Coach',
      livingConditions: {
        apartmentTier: 'spartan_apartment',
        roomTheme: null,
        sleepsOnCouch: false,
        sleepsUnderTable: false
      }
    }
  };
  
  console.log('📤 Sending kitchen chat request...');
  socket.emit('kitchen_chat_request', testRequest);
  
  // Set timeout
  setTimeout(() => {
    console.log('⏰ Timeout - no response received');
    socket.disconnect();
    process.exit(1);
  }, 30000);
});

socket.on('kitchen_conversation_response', (data) => {
  console.log('📥 Received response:', {
    conversationId: data.conversationId,
    hasMessage: !!data.message,
    hasError: !!data.error,
    messageLength: data.message?.length || 0,
    message: data.message?.substring(0, 100) + '...'
  });
  
  if (data.error) {
    console.error('❌ Error:', data.error);
  } else {
    console.log('✅ Success! Message:', data.message);
  }
  
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});