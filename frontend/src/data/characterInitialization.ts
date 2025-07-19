// Character Initialization with Equipment
// Automatically equips characters with appropriate starting gear

import { Character, characterTemplates } from './characters';
import { getCharacterSpecificWeapons, getCharacterWeaponProgression } from './equipment';
import { equipItem } from './characterEquipment';

export function initializeCharacterWithStartingEquipment(characterId: string, level: number = 1): Character {
  const template = characterTemplates[characterId];
  if (!template) {
    throw new Error(`Character template not found: ${characterId}`);
  }
  
  // Create base character
  const character: Character = {
    id: characterId,
    ...template,
    level,
    experience: {
      currentXP: 0,
      requiredXP: 100,
      totalXP: 0,
      level: level,
      xpMultiplier: 1.0
    },
    skills: {
      combat: 0,
      magic: 0,
      stealth: 0,
      leadership: 0,
      crafting: 0,
      social: 0
    },
    abilities: {
      basic: [],
      advanced: [],
      legendary: [],
      passive: [],
      active: []
    }
  };
  
  // Auto-equip appropriate starting weapon based on level
  const weaponProgression = getCharacterWeaponProgression(characterId);
  
  let startingWeapon = null;
  if (level >= 30 && weaponProgression.legendary) {
    startingWeapon = weaponProgression.legendary;
  } else if (level >= 15 && weaponProgression.elite) {
    startingWeapon = weaponProgression.elite;
  } else if (weaponProgression.basic) {
    startingWeapon = weaponProgression.basic;
  }
  
  if (startingWeapon) {
    character.equippedItems.weapon = startingWeapon;
  }
  
  return character;
}

export function getRecommendedEquipmentForCharacter(
  characterId: string, 
  characterLevel: number
): {
  weapon?: any;
  armor?: any;
  accessory?: any;
  reasoning: string[];
} {
  const reasoning: string[] = [];
  const weaponProgression = getCharacterWeaponProgression(characterId);
  
  let recommendedWeapon = null;
  
  if (characterLevel >= 30 && weaponProgression.legendary) {
    recommendedWeapon = weaponProgression.legendary;
    reasoning.push(`Level ${characterLevel} - Legendary weapon unlocked`);
  } else if (characterLevel >= 15 && weaponProgression.elite) {
    recommendedWeapon = weaponProgression.elite;
    reasoning.push(`Level ${characterLevel} - Elite weapon available`);
  } else if (weaponProgression.basic) {
    recommendedWeapon = weaponProgression.basic;
    reasoning.push(`Starting weapon appropriate for character`);
  }
  
  if (recommendedWeapon) {
    reasoning.push(`${recommendedWeapon.name} matches ${characterId}'s historical period and fighting style`);
  }
  
  return {
    weapon: recommendedWeapon,
    reasoning
  };
}

export function autoEquipCharacterForLevel(character: Character, targetLevel: number): Character {
  let updatedCharacter = { ...character, level: targetLevel };
  
  const recommendations = getRecommendedEquipmentForCharacter(character.id, targetLevel);
  
  if (recommendations.weapon && (!character.equippedItems.weapon || 
      character.equippedItems.weapon.level < recommendations.weapon.level)) {
    updatedCharacter = equipItem(updatedCharacter, recommendations.weapon);
  }
  
  return updatedCharacter;
}

export function getAllCharactersWithStartingEquipment(): Record<string, Character> {
  const characters: Record<string, Character> = {};
  
  Object.keys(characterTemplates).forEach(characterId => {
    characters[characterId] = initializeCharacterWithStartingEquipment(characterId);
  });
  
  return characters;
}

export function validateCharacterEquipment(character: Character): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check if character has appropriate weapon for their level
  const weaponProgression = getCharacterWeaponProgression(character.id);
  const currentWeapon = character.equippedItems.weapon;
  
  if (!currentWeapon) {
    issues.push('Character has no weapon equipped');
    if (weaponProgression.basic) {
      suggestions.push(`Equip ${weaponProgression.basic.name} as starting weapon`);
    }
  } else {
    // Check if weapon is appropriate for level
    if (character.level >= 30 && weaponProgression.legendary && 
        currentWeapon.id !== weaponProgression.legendary.id) {
      suggestions.push(`Consider upgrading to ${weaponProgression.legendary.name} (legendary)`);
    } else if (character.level >= 15 && weaponProgression.elite && 
               currentWeapon.id !== weaponProgression.elite.id &&
               currentWeapon.rarity === 'common') {
      suggestions.push(`Consider upgrading to ${weaponProgression.elite.name} (elite)`);
    }
    
    // Check if weapon is too high level
    if (currentWeapon.requiredLevel > character.level) {
      issues.push(`Weapon requires level ${currentWeapon.requiredLevel}, character is only level ${character.level}`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

// Character advancement with equipment progression
export function advanceCharacterLevel(character: Character, newLevel: number): Character {
  if (newLevel <= character.level) {
    return character;
  }
  
  let advancedCharacter = { ...character, level: newLevel };
  
  // Scale base stats with level
  const statGrowth = newLevel - character.level;
  advancedCharacter.baseStats = {
    strength: character.baseStats.strength + statGrowth,
    agility: character.baseStats.agility + statGrowth,
    intelligence: character.baseStats.intelligence + statGrowth,
    vitality: character.baseStats.vitality + statGrowth,
    wisdom: character.baseStats.wisdom + statGrowth,
    charisma: character.baseStats.charisma + statGrowth
  };
  
  // Scale combat stats
  advancedCharacter.combatStats = {
    ...character.combatStats,
    health: character.combatStats.health + (statGrowth * 10),
    maxHealth: character.combatStats.maxHealth + (statGrowth * 10),
    mana: character.combatStats.mana + (statGrowth * 5),
    maxMana: character.combatStats.maxMana + (statGrowth * 5),
    attack: character.combatStats.attack + (statGrowth * 2),
    defense: character.combatStats.defense + statGrowth,
    magicAttack: character.combatStats.magicAttack + statGrowth,
    magicDefense: character.combatStats.magicDefense + statGrowth,
    speed: character.combatStats.speed + statGrowth
  };
  
  // Auto-upgrade equipment if appropriate
  advancedCharacter = autoEquipCharacterForLevel(advancedCharacter, newLevel);
  
  return advancedCharacter;
}

export function createDemoCharacterRoster(): Character[] {
  // Create a diverse roster for testing
  const demoCharacters = [
    'achilles',
    'merlin', 
    'sherlock_holmes',
    'billy_the_kid',
    'space_cyborg'
  ];
  
  return demoCharacters.map((id, index) => {
    const level = 1 + (index * 7); // Levels 1, 8, 15, 22, 29
    return initializeCharacterWithStartingEquipment(id, level);
  });
}