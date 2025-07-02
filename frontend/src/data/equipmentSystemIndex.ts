// Equipment System - Complete Integration Index
// Central exports for all equipment-related functionality

// Core Equipment Data
export {
  type Equipment,
  type EquipmentStats,
  type EquipmentEffect,
  type WeaponType,
  type ArmorType,
  type EquipmentRarity,
  allEquipment,
  weapons,
  armor,
  accessories,
  rarityConfig,
  getEquipmentBySlot,
  getEquipmentByRarity,
  getEquipmentByArchetype,
  canEquip,
  calculateEquipmentStats,
  getRandomEquipment,
  getCharacterSpecificWeapons,
  getCharacterWeaponProgression,
  getAllCharacterWeapons
} from './equipment';

// Historical Weapons
export { historicalWeapons } from './historical_weapons';

// Character Equipment Integration
export {
  type EquippedCharacter,
  type EquipmentEffect as CharacterEquipmentEffect,
  calculateFinalStats,
  getActiveEquipmentEffects,
  equipItem,
  unequipItem,
  canCharacterEquip,
  getEquipmentCompatibility,
  createEquippedCharacter,
  getCharacterPowerLevel,
  simulateEquipmentChange,
  processBattleStartEffects,
  processOnHitEffects,
  processOnCritEffects
} from './characterEquipment';

// Character Initialization
export {
  initializeCharacterWithStartingEquipment,
  getRecommendedEquipmentForCharacter,
  autoEquipCharacterForLevel,
  getAllCharactersWithStartingEquipment,
  validateCharacterEquipment,
  advanceCharacterLevel,
  createDemoCharacterRoster
} from './characterInitialization';

// Battle Integration
export {
  type BattleContext,
  type EquipmentBattleEffect,
  EquipmentBattleManager,
  applyEquipmentEffectsToDamage,
  checkForEquipmentTriggeredEffects,
  createBattleEquipmentSummary
} from './equipmentBattleIntegration';

// Testing & Validation
export {
  type IntegrationTestResult,
  runEquipmentIntegrationTest,
  testEquipmentProgression,
  testCrossEraCompatibility,
  generateEquipmentReport
} from './equipmentIntegrationTest';

// Quick Start Functions
export function quickStartEquipmentSystem() {
  return {
    // Get all characters with starting equipment
    getAllCharacters: getAllCharactersWithStartingEquipment,
    
    // Create a demo roster for testing
    createDemoRoster: createDemoCharacterRoster,
    
    // Run integration tests
    runTests: runEquipmentIntegrationTest,
    
    // Generate comprehensive report
    generateReport: generateEquipmentReport,
    
    // Get weapon progression for character
    getWeaponProgression: getCharacterWeaponProgression,
    
    // Initialize character with equipment
    initializeCharacter: initializeCharacterWithStartingEquipment
  };
}

// Equipment System Summary
export const EQUIPMENT_SYSTEM_SUMMARY = {
  totalCharacters: 17,
  weaponsPerCharacter: 3,
  totalHistoricalWeapons: 51,
  supportedEras: [
    'Ancient Greece (1200 BCE)',
    'Ancient China',
    'Medieval Britain (5th-6th century)',
    'Medieval England',
    'Medieval France',
    'Norse Age (8th-11th century)',
    'Ptolemaic Egypt (69-30 BCE)',
    'Mongol Empire (1162–1227)',
    'Transylvania (15th-19th c.)',
    'Victorian England (1880s-1910s)',
    '19th-century Europe',
    'American Old West (1859–1881)',
    '1920s America (Pulp Noir)',
    'Tesla Era (1856–1943)',
    'Modern/Contemporary (1960s–Present)',
    'Far Future',
    'Extraterrestrial'
  ],
  features: [
    'Era-appropriate weapon progressions',
    'Character-specific effects and abilities',
    'Cross-era compatibility with penalties/bonuses',
    'Progressive difficulty scaling',
    'Battle system integration',
    'Stat calculation and bonuses',
    'Equipment effect processing',
    'Character advancement integration',
    'Comprehensive testing suite'
  ]
};