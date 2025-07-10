const { io } = require('socket.io-client');
require('dotenv').config();

console.log('🔌 Testing facilities chat socket connection...');

const socket = io('http://localhost:3006', {
  transports: ['websocket', 'polling'],
  timeout: 10000,
  withCredentials: true
});

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
});

socket.on('auth_success', (data) => {
  console.log('🔐 Auth successful:', data);
  
  // Test facilities chat message
  const testMessage = {
    message: 'Hello, I need help choosing facilities',
    agentId: 'vance_velocity',
    agentData: {
      id: 'vance_velocity',
      name: 'Vance "The Closer" Velocity',
      personality: {
        traits: ['Aggressive', 'Fast-talking'],
        speechStyle: 'Rapid-fire, sales clichés',
        motivations: ['Closing deals'],
        fears: ['Lost opportunities']
      },
      conversationContext: 'You are a high-pressure real estate sales agent.'
    },
    facilitiesContext: {
      teamLevel: 10,
      currency: { coins: 50000, gems: 100 },
      ownedFacilities: []
    },
    previousMessages: []
  };
  
  console.log('📤 Sending test message...');
  socket.emit('facilities_chat_message', testMessage);
});

socket.on('auth_error', (error) => {
  console.error('❌ Auth failed:', error);
});

socket.on('facilities_chat_response', (data) => {
  console.log('📨 Received response:', data);
  process.exit(0);
});

socket.on('disconnect', () => {
  console.log('❌ Socket disconnected');
});

setTimeout(() => {
  console.log('❌ Test timeout - no response received');
  process.exit(1);
}, 15000);