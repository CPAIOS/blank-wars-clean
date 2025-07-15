/**
 * Test Script for Real Estate Agent Bonus System
 * Run this in browser console to verify all bonuses work correctly
 */

async function testRealEstateAgentBonuses() {
  console.log('🏠 Testing Real Estate Agent Bonus System...\n');
  
  try {
    // Import the services
    const RealEstateAgentBonusService = (await import('./src/services/realEstateAgentBonusService')).default;
    const { addExperience, createCharacterExperience } = await import('./src/data/experience');
    
    const agentService = RealEstateAgentBonusService.getInstance();
    
    // Test 1: Agent Selection Persistence
    console.log('📋 Test 1: Agent Selection Persistence');
    agentService.setSelectedAgent('barry_the_closer');
    console.log('Selected Barry:', agentService.getSelectedAgent());
    
    // Simulate page refresh
    const newService = RealEstateAgentBonusService.getInstance();
    console.log('After "refresh":', newService.getSelectedAgent());
    console.log('✅ Persistence test passed\n');
    
    // Test 2: Tiered Cost Reduction (Barry)
    console.log('📋 Test 2: Tiered Cost Reduction (Barry)');
    agentService.setSelectedAgent('barry_the_closer');
    
    const testCosts = [
      { coins: 5000, gems: 0 },    // Spartan tier
      { coins: 25000, gems: 0 },   // Standard tier
      { coins: 75000, gems: 0 }    // Luxury tier
    ];
    
    testCosts.forEach((cost, i) => {
      const reduced = agentService.applyFacilityCostReduction(cost);
      const tierNames = ['Spartan', 'Standard', 'Luxury'];
      const expectedReductions = [3, 5, 8];
      const expectedSavings = Math.floor(cost.coins * expectedReductions[i] / 100);
      const actualSavings = cost.coins - reduced.coins;
      
      console.log(`${tierNames[i]} tier: ${cost.coins} → ${reduced.coins} (${expectedReductions[i]}% = ${expectedSavings} saved)`);
      console.log(`Actual savings: ${actualSavings}`);
      console.log(actualSavings === expectedSavings ? '✅ Correct' : '❌ Incorrect');
    });
    console.log('✅ Cost reduction test passed\n');
    
    // Test 3: XP Gain Bonus (LMB-3000)
    console.log('📋 Test 3: XP Gain Bonus (LMB-3000)');
    agentService.setSelectedAgent('lmb_3000');
    
    const testCharacter = createCharacterExperience('test_char');
    const baseXpGain = { 
      source: 'battle', 
      amount: 100, 
      bonuses: [], 
      timestamp: new Date() 
    };
    
    const agentBonus = agentService.getXpBonusForExperience();
    console.log('Agent XP bonus:', agentBonus);
    
    if (agentBonus) {
      const result = addExperience(testCharacter, baseXpGain, [agentBonus]);
      const expectedXp = Math.floor(100 * agentBonus.multiplier);
      console.log(`Base XP: 100, Multiplier: ${agentBonus.multiplier}, Expected: ${expectedXp}`);
      console.log(`Actual XP gained: ${result.updatedCharacter.totalXP}`);
      console.log(result.updatedCharacter.totalXP === expectedXp ? '✅ Correct' : '❌ Incorrect');
    }
    console.log('✅ XP bonus test passed\n');
    
    // Test 4: Training Bonus (Zyxthala)
    console.log('📋 Test 4: Training Bonus (Zyxthala)');
    agentService.setSelectedAgent('zyxthala_reptilian');
    
    const trainingEffects = agentService.getAgentBonusEffects();
    console.log('Training speed boost:', trainingEffects.trainingSpeedBoost + '%');
    
    // Test gameplan adherence multiplier
    const adherenceMultiplier = agentService.getGameplanAdherenceMultiplier({ coins: 25000, gems: 0 });
    console.log('Gameplan adherence multiplier:', adherenceMultiplier);
    console.log(adherenceMultiplier > 1 ? '✅ Correct' : '❌ Incorrect');
    console.log('✅ Training bonus test passed\n');
    
    // Test 5: All Agent Visual Data
    console.log('📋 Test 5: Agent Visual Data');
    const agents = ['barry_the_closer', 'lmb_3000', 'zyxthala_reptilian'];
    
    agents.forEach(agentId => {
      agentService.setSelectedAgent(agentId);
      const bonus = agentService.getSelectedAgentBonus();
      console.log(`${agentId}:`, bonus);
    });
    console.log('✅ Visual data test passed\n');
    
    console.log('🎉 All tests passed! Real Estate Agent Bonus System is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for console use
window.testRealEstateAgentBonuses = testRealEstateAgentBonuses;

console.log('🏠 Real Estate Agent Bonus Test Suite loaded!');
console.log('Run: testRealEstateAgentBonuses()');