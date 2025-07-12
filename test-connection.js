const io = require('socket.io-client');

console.log('Testing Socket.IO connection to localhost:3006...');

const socket = io('http://localhost:3006', {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  withCredentials: true,
});

socket.on('connect', () => {
  console.log('✅ Socket.IO connected successfully!');
  console.log('🔌 Socket ID:', socket.id);
  
  // Test facilities chat message
  socket.emit('facilities_chat_message', {
    message: 'Test message',
    agentId: 'barry_the_closer',
    facilitiesContext: { test: true },
    previousMessages: []
  });
});

socket.on('auth_success', (data) => {
  console.log('🔐 Auth success:', data);
});

socket.on('facilities_chat_response', (data) => {
  console.log('🤖 Facilities chat response received:', data);
  process.exit(0);
});

socket.on('disconnect', () => {
  console.log('❌ Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout');
  process.exit(1);
}, 10000);