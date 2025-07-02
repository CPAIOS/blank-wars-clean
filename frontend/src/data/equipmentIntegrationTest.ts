// Equipment Integration Testing
// Comprehensive tests for character-equipment integration

import { 
  initializeCharacterWithStartingEquipment,
  advanceCharacterLevel,
  validateCharacterEquipment,
  getRecommendedEquipmentForCharacter
} from './characterInitialization';
import { 
  calculateFinalStats,
  getEquipmentCompatibility,
  simulateEquipmentChange,
  getCharacterPowerLevel,
  createEquippedCharacter
} from './characterEquipment';
import { getCharacterSpecificWeapons, getAllCharacterWeapons } from './equipment';

export interface IntegrationTestResult {
  characterId: string;
  characterName: string;
  level: number;
  baseStats: any;
  finalStats: any;
  equippedWeapon: string;
  powerLevel: number;
  weaponsAvailable: number;
  compatibility: any;
  validation: any;
}

export function runEquipmentIntegrationTest(): {
  results: IntegrationTestResult[];
  summary: {
    totalCharacters: number;
    charactersWithWeapons: number;
    averagePowerLevel: number;
    weaponDistribution: Record<string, number>;
  };
} {
  const results: IntegrationTestResult[] = [];
  const weaponDistribution: Record<string, number> = {};
  
  // Test all characters at different levels
  const characterIds = [
    'achilles', 'merlin', 'fenrir', 'cleopatra', 'sherlock_holmes',
    'count_dracula', 'joan_of_arc', 'frankensteins_monster', 'sun_wukong',
    'sammy_slugger', 'billy_the_kid', 'genghis_khan', 'space_cyborg_vega_x',
    'nikola_tesla', 'zeta_reticulan', 'robin_hood', 'agent_x'
  ];
  
  characterIds.forEach(characterId => {
    for (const level of [1, 15, 30]) {
      try {
        // Initialize character with equipment
        const character = initializeCharacterWithStartingEquipment(characterId, level);
        
        // Calculate final stats
        const finalStats = calculateFinalStats(character);
        
        // Get power level
        const powerLevel = getCharacterPowerLevel(character);
        
        // Get available weapons
        const availableWeapons = getCharacterSpecificWeapons(characterId);
        
        // Get equipment compatibility
        const equippedWeapon = character.equippedItems.weapon;
        let compatibility = null;
        if (equippedWeapon) {
          compatibility = getEquipmentCompatibility(character, equippedWeapon);
        }
        
        // Validate equipment
        const validation = validateCharacterEquipment(character);
        
        // Track weapon distribution
        if (equippedWeapon) {
          weaponDistribution[equippedWeapon.rarity] = (weaponDistribution[equippedWeapon.rarity] || 0) + 1;
        }
        
        results.push({
          characterId,
          characterName: character.name,
          level,
          baseStats: character.combatStats,
          finalStats,
          equippedWeapon: equippedWeapon ? equippedWeapon.name : 'None',
          powerLevel,
          weaponsAvailable: availableWeapons.length,
          compatibility,
          validation
        });
        
      } catch (error) {
        console.error(`Error testing ${characterId} at level ${level}:`, error);
      }
    }
  });
  
  // Calculate summary statistics
  const totalCharacters = results.length;
  const charactersWithWeapons = results.filter(r => r.equippedWeapon !== 'None').length;
  const averagePowerLevel = results.reduce((sum, r) => sum + r.powerLevel, 0) / totalCharacters;
  
  return {
    results,
    summary: {
      totalCharacters,
      charactersWithWeapons,
      averagePowerLevel: Math.round(averagePowerLevel),
      weaponDistribution
    }
  };
}

export function testEquipmentProgression(): {
  character: string;
  progressionTest: {
    level: number;
    weapon: string;
    attack: number;
    powerLevel: number;
  }[];
} {
  const characterId = 'achilles';
  const progressionTest: any[] = [];
  
  // Test Achilles progression from level 1 to 30
  for (let level = 1; level <= 30; level += 5) {
    const character = initializeCharacterWithStartingEquipment(characterId, level);
    const finalStats = calculateFinalStats(character);
    const powerLevel = getCharacterPowerLevel(character);
    
    progressionTest.push({
      level,
      weapon: character.equippedItems.weapon?.name || 'None',
      attack: finalStats.attack,
      powerLevel
    });
  }
  
  return {
    character: 'Achilles',
    progressionTest
  };
}

export function testCrossEraCompatibility(): {
  testResults: {
    character: string;
    weapon: string;
    effectiveness: number;
    restrictions: string[];
  }[];
} {
  const testResults: any[] = [];
  
  // Test modern character with ancient weapon
  const holmes = initializeCharacterWithStartingEquipment('sherlock_holmes', 15);
  const achillesWeapons = getCharacterSpecificWeapons('achilles');
  const bronzeSpear = achillesWeapons.find(w => w.name.includes('Bronze'));
  
  if (bronzeSpear) {
    const compatibility = getEquipmentCompatibility(holmes, bronzeSpear);
    testResults.push({
      character: 'Sherlock Holmes',
      weapon: bronzeSpear.name,
      effectiveness: compatibility.effectiveness,
      restrictions: compatibility.restrictions
    });
  }
  
  // Test ancient character with modern weapon
  const achilles = initializeCharacterWithStartingEquipment('achilles', 15);
  const holmesWeapons = getCharacterSpecificWeapons('sherlock_holmes');
  const revolver = holmesWeapons.find(w => w.name.includes('Revolver'));
  
  if (revolver) {
    const compatibility = getEquipmentCompatibility(achilles, revolver);
    testResults.push({
      character: 'Achilles',
      weapon: revolver.name,
      effectiveness: compatibility.effectiveness,
      restrictions: compatibility.restrictions
    });
  }
  
  // Test beast character with complex weapon
  const fenrir = initializeCharacterWithStartingEquipment('fenrir', 15);
  const merlinWeapons = getCharacterSpecificWeapons('merlin');
  const staff = merlinWeapons.find(w => w.name.includes('Staff'));
  
  if (staff) {
    const compatibility = getEquipmentCompatibility(fenrir, staff);
    testResults.push({
      character: 'Fenrir',
      weapon: staff.name,
      effectiveness: compatibility.effectiveness,
      restrictions: compatibility.restrictions
    });
  }
  
  return { testResults };
}

export function generateEquipmentReport(): string {
  const allWeapons = getAllCharacterWeapons();
  const integrationTest = runEquipmentIntegrationTest();
  const progressionTest = testEquipmentProgression();
  const compatibilityTest = testCrossEraCompatibility();
  
  let report = '# Equipment Integration Report\\n\\n';
  
  report += '## Summary\\n';
  report += `- Total Characters Tested: ${integrationTest.summary.totalCharacters}\\n`;
  report += `- Characters with Weapons: ${integrationTest.summary.charactersWithWeapons}\\n`;
  report += `- Average Power Level: ${integrationTest.summary.averagePowerLevel}\\n`;
  report += `- Weapon Rarity Distribution: ${JSON.stringify(integrationTest.summary.weaponDistribution)}\\n\\n`;
  
  report += '## Character Weapon Coverage\\n';
  Object.entries(allWeapons).forEach(([characterId, weapons]) => {
    report += `- ${characterId}: ${weapons.length} weapons (${weapons.map(w => w.rarity).join(', ')})\\n`;
  });
  
  report += '\\n## Progression Test (Achilles)\\n';
  progressionTest.progressionTest.forEach(test => {
    report += `- Level ${test.level}: ${test.weapon} (Attack: ${test.attack}, Power: ${test.powerLevel})\\n`;
  });
  
  report += '\\n## Cross-Era Compatibility\\n';
  compatibilityTest.testResults.forEach(test => {
    report += `- ${test.character} with ${test.weapon}: ${Math.round(test.effectiveness * 100)}% effectiveness\\n`;
    if (test.restrictions.length > 0) {
      report += `  Restrictions: ${test.restrictions.join(', ')}\\n`;
    }
  });
  
  return report;
}