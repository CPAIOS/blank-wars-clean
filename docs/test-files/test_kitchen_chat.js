const axios = require('axios');

async function testKitchenChat() {
  console.log('Testing Kitchen Chat System...\n');
  
  // Test backend health
  try {
    const health = await axios.get('http://localhost:3006/health');
    console.log('✅ Backend is healthy:', health.data);
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return;
  }

  // Test socket connection directly
  const io = require('socket.io-client');
  const socket = io('http://localhost:3006', {
    transports: ['websocket', 'polling'],
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('\n✅ Socket connected successfully!');
    
    // Test kitchen chat request
    const testContext = {
      characterId: 'dracula',
      teammates: ['sherlock_holmes', 'cleopatra'],
      coachName: 'Coach',
      livingConditions: {
        tier: 'cramped',
        draculaSleepsUnderTable: true,
        sharedBathroom: true,
        roomThemes: {
          bedroom1: 'gothic',
          bedroom2: 'egyptian'
        }
      },
      trigger: 'Morning coffee time',
      round: 1
    };

    console.log('\n📤 Sending test kitchen chat request...');
    socket.emit('kitchen_chat_request', testContext, (response) => {
      if (response.error) {
        console.error('❌ Kitchen chat error:', response.error);
      } else {
        console.log('\n✅ Kitchen chat response received!');
        console.log('📝 AI Response:', response.response);
      }
      socket.disconnect();
      process.exit(0);
    });
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
    process.exit(1);
  });

  // Timeout after 10 seconds
  setTimeout(() => {
    console.error('❌ Test timed out after 10 seconds');
    socket.disconnect();
    process.exit(1);
  }, 10000);
}

testKitchenChat();