const { io } = require('socket.io-client');

const socket = io('http://localhost:3006');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  
  socket.emit('kitchen_chat_request', {
    conversationId: 'test_' + Date.now(),
    characterId: 'sherlock_holmes',
    prompt: 'Test prompt',
    trigger: 'Test trigger',
    context: {
      teammates: ['Dracula'],
      coach: 'Coach',
      livingConditions: { apartmentTier: 'spartan_apartment' }
    }
  });
});

socket.on('kitchen_conversation_response', (data) => {
  console.log('Response:', data);
  process.exit(0);
});

setTimeout(() => {
  console.log('Timeout');
  process.exit(1);
}, 10000);