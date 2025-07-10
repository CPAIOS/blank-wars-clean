// Direct test of facilities chat handler
require('dotenv').config();
const { aiChatService } = require('./src/services/aiChatService');

async function testFacilitiesChat() {
  console.log('🧪 Testing facilities chat handler directly...');
  
  const chatContext = {
    characterId: 'vance_velocity',
    characterName: 'Vance "The Closer" Velocity',
    personality: {
      traits: ['Aggressive', 'Fast-talking'],
      speechStyle: 'Rapid-fire, sales clichés',
      motivations: ['Closing deals'],
      fears: ['Lost opportunities']
    },
    conversationContext: 'You are Vance "The Closer" Velocity, a high-octane real estate agent who sees *every single interaction* as a golden opportunity to close a deal.',
    previousMessages: []
  };
  
  const facilitiesContext = {
    teamLevel: 10,
    currency: { coins: 50000, gems: 100 },
    ownedFacilities: [],
    headquarters: {
      currentTier: 'spartan_apartment',
      currentOccupancy: 10,
      totalCapacity: 8
    }
  };
  
  try {
    const response = await aiChatService.generateCharacterResponse(
      chatContext,
      'Hello, I need help choosing facilities for my team',
      'test-user',
      null, // No database for test
      { facilitiesContext }
    );
    
    console.log('✅ AI Response received:');
    console.log(response.message);
    console.log('Bond increase:', response.bondIncrease);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFacilitiesChat();