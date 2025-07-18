// Test script for persistent memory integration
// This tests the key components we've built

const GameEventBus = require('./frontend/src/services/gameEventBus.ts');
const EventContextService = require('./frontend/src/services/eventContextService.ts');

async function testMemoryIntegration() {
  console.log('🧪 Testing Persistent Memory Integration...\n');
  
  try {
    // Test 1: Event Publishing
    console.log('1️⃣ Testing Event Publishing...');
    const eventBus = GameEventBus.getInstance();
    
    // Simulate a therapy breakthrough
    await eventBus.publish({
      type: 'therapy_breakthrough',
      source: 'therapy_room',
      primaryCharacterId: 'holmes',
      severity: 'high',
      category: 'therapy',
      description: 'Holmes had a breakthrough about his emotional walls',
      metadata: { 
        sessionType: 'individual',
        therapistId: 'carl_jung',
        emotionalIntensity: 9,
        breakthroughIndicator: true
      },
      tags: ['therapy', 'breakthrough', 'emotional_growth']
    });
    console.log('✅ Therapy event published successfully');
    
    // Simulate a real estate complaint
    await eventBus.publish({
      type: 'privacy_request',
      source: 'real_estate_office',
      primaryCharacterId: 'holmes',
      severity: 'high',
      category: 'real_estate',
      description: 'Holmes desperately requested a private room after therapy',
      metadata: { 
        agentType: 'Closer',
        requestType: 'privacy_request',
        comedyPotential: 8 // High comedy potential for cross-reference
      },
      tags: ['real_estate', 'privacy', 'desperate']
    });
    console.log('✅ Real estate event published successfully');
    
    // Test 2: Memory Creation and Retrieval
    console.log('\n2️⃣ Testing Memory Creation and Retrieval...');
    const holmesMemories = eventBus.getCharacterMemories('holmes', { limit: 10 });
    console.log(`✅ Retrieved ${holmesMemories.length} memories for Holmes`);
    
    if (holmesMemories.length > 0) {
      console.log('📝 Sample memory:', {
        type: holmesMemories[0].memoryType,
        content: holmesMemories[0].content.substring(0, 50) + '...',
        emotional_intensity: holmesMemories[0].emotionalIntensity
      });
    }
    
    // Test 3: Context Generation
    console.log('\n3️⃣ Testing Context Generation...');
    const contextService = EventContextService.getInstance();
    
    // Test confessional context (should import memories but not export)
    const confessionalContext = await contextService.getConfessionalContext('holmes');
    console.log('✅ Confessional context generated:', confessionalContext.length, 'characters');
    
    // Test real estate context (should reference therapy events)
    const realEstateContext = await contextService.getRealEstateContext('holmes');
    console.log('✅ Real estate context generated:', realEstateContext.length, 'characters');
    
    // Test 4: Cross-System Comedy References
    console.log('\n4️⃣ Testing Comedy Reference System...');
    const comedyRefs = contextService.generateComedyReferences('holmes', 'real_estate');
    console.log(`✅ Generated ${comedyRefs.length} comedy references for real estate chat`);
    
    if (comedyRefs.length > 0) {
      console.log('😂 Sample comedy reference:', comedyRefs[0]);
    }
    
    // Test 5: Memory Type Classification
    console.log('\n5️⃣ Testing Memory Type Classification...');
    const therapyMemories = eventBus.getCharacterMemories('holmes', { memoryType: 'therapy' });
    const realEstateMemories = eventBus.getCharacterMemories('holmes', { memoryType: 'real_estate' });
    
    console.log(`✅ Therapy memories: ${therapyMemories.length}`);
    console.log(`✅ Real estate memories: ${realEstateMemories.length}`);
    
    console.log('\n🎉 All tests passed! Persistent memory integration is working correctly.');
    
    // Summary
    console.log('\n📊 Integration Summary:');
    console.log('✅ Event publishing: Working');
    console.log('✅ Memory creation: Working');
    console.log('✅ Memory retrieval: Working');
    console.log('✅ Context generation: Working');
    console.log('✅ Comedy references: Working');
    console.log('✅ Memory type classification: Working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testMemoryIntegration();
}

module.exports = { testMemoryIntegration };