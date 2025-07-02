// Character Equipment Integration System
// Combines character base stats with equipment bonuses

import { Character, CombatStats } from './characters';
import { Equipment, EquipmentStats, calculateEquipmentStats } from './equipment';

export interface EquippedCharacter extends Character {
  finalStats: CombatStats;
  equipmentBonuses: EquipmentStats;
  activeEffects: EquipmentEffect[];
}

export interface EquipmentEffect {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active' | 'trigger';
  value: number;
  duration?: number;
  remaining?: number;
  source: string; // equipment id
}

export function calculateFinalStats(character: Character): CombatStats {
  const baseStats = character.combatStats;
  const equipment = [
    character.equippedItems.weapon,
    character.equippedItems.armor,
    character.equippedItems.accessory
  ].filter(Boolean) as Equipment[];
  
  const equipmentStats = calculateEquipmentStats(equipment);
  
  return {
    health: baseStats.health + (equipmentStats.hp || 0),
    maxHealth: baseStats.maxHealth + (equipmentStats.hp || 0),
    mana: baseStats.mana,
    maxMana: baseStats.maxMana,
    attack: baseStats.attack + (equipmentStats.atk || 0),
    defense: baseStats.defense + (equipmentStats.def || 0),
    magicAttack: baseStats.magicAttack + (equipmentStats.magicAttack || 0),
    magicDefense: baseStats.magicDefense,
    speed: baseStats.speed + (equipmentStats.spd || 0),
    criticalChance: baseStats.criticalChance + (equipmentStats.critRate || 0),
    criticalDamage: baseStats.criticalDamage + (equipmentStats.critDamage || 0),
    accuracy: baseStats.accuracy + (equipmentStats.accuracy || 0),
    evasion: baseStats.evasion + (equipmentStats.evasion || 0)
  };
}

export function getActiveEquipmentEffects(character: Character): EquipmentEffect[] {
  const effects: EquipmentEffect[] = [];
  const equipment = [
    character.equippedItems.weapon,
    character.equippedItems.armor,
    character.equippedItems.accessory
  ].filter(Boolean) as Equipment[];
  
  equipment.forEach(item => {
    item.effects.forEach(effect => {
      effects.push({
        id: effect.id,
        name: effect.name,
        description: effect.description,
        type: effect.type,
        value: effect.value || 0,
        duration: effect.duration,
        source: item.id
      });
    });
  });
  
  return effects;
}

export function equipItem(character: Character, equipment: Equipment): Character {
  const newCharacter = { ...character };
  
  // Check if character can equip this item
  if (!canCharacterEquip(character, equipment)) {
    throw new Error(`${character.name} cannot equip ${equipment.name}`);
  }
  
  // Equip the item in the appropriate slot
  switch (equipment.slot) {
    case 'weapon':
      newCharacter.equippedItems.weapon = equipment;
      break;
    case 'armor':
      newCharacter.equippedItems.armor = equipment;
      break;
    case 'accessory':
      newCharacter.equippedItems.accessory = equipment;
      break;
  }
  
  return newCharacter;
}

export function unequipItem(character: Character, slot: 'weapon' | 'armor' | 'accessory'): Character {
  const newCharacter = { ...character };
  newCharacter.equippedItems[slot] = undefined;
  return newCharacter;
}

export function canCharacterEquip(character: Character, equipment: Equipment): boolean {
  // Level requirement
  if (character.level < equipment.requiredLevel) {
    return false;
  }
  
  // Archetype requirement
  if (equipment.requiredArchetype && 
      !equipment.requiredArchetype.includes(character.archetype)) {
    return false;
  }
  
  // Preferred character gets no restrictions
  if (equipment.preferredCharacter === character.id) {
    return true;
  }
  
  return true;
}

export function getEquipmentCompatibility(character: Character, equipment: Equipment): {
  canEquip: boolean;
  effectiveness: number;
  restrictions: string[];
} {
  const restrictions: string[] = [];
  let effectiveness = 1.0;
  
  // Level check
  if (character.level < equipment.requiredLevel) {
    restrictions.push(`Requires level ${equipment.requiredLevel}`);
    return { canEquip: false, effectiveness: 0, restrictions };
  }
  
  // Archetype check
  if (equipment.requiredArchetype && 
      !equipment.requiredArchetype.includes(character.archetype)) {
    restrictions.push(`Requires archetype: ${equipment.requiredArchetype.join(' or ')}`);
    effectiveness *= 0.7; // Can still use but less effective
  }
  
  // Preferred character bonus
  if (equipment.preferredCharacter === character.id) {
    effectiveness *= 1.2; // 20% bonus effectiveness
  } else if (equipment.preferredCharacter) {
    effectiveness *= 0.9; // 10% penalty for using another character's weapon
  }
  
  // Era compatibility (simplified)
  const characterPeriod = character.historicalPeriod.toLowerCase();
  const equipmentName = equipment.name.toLowerCase();
  
  // Modern characters using ancient weapons
  if (characterPeriod.includes('modern') || characterPeriod.includes('contemporary')) {
    if (equipmentName.includes('bronze') || equipmentName.includes('ancient')) {
      effectiveness *= 0.8;
      restrictions.push('Unfamiliar with ancient technology');
    }
  }
  
  // Ancient characters using modern weapons
  if (characterPeriod.includes('ancient') || characterPeriod.includes('medieval')) {
    if (equipmentName.includes('gun') || equipmentName.includes('rifle') || 
        equipmentName.includes('pistol') || equipmentName.includes('tommy')) {
      effectiveness *= 0.6;
      restrictions.push('Confused by modern technology');
    }
  }
  
  // Beast characters and weapon restrictions
  if (character.archetype === 'beast') {
    if (equipment.type === 'sword' || equipment.type === 'bow' || 
        equipment.type === 'staff' || equipment.type === 'gun') {
      effectiveness *= 0.5;
      restrictions.push('Difficulty using complex weapons');
    }
  }
  
  return {
    canEquip: true,
    effectiveness,
    restrictions
  };
}

export function createEquippedCharacter(character: Character): EquippedCharacter {
  const finalStats = calculateFinalStats(character);
  const equipment = [
    character.equippedItems.weapon,
    character.equippedItems.armor,
    character.equippedItems.accessory
  ].filter(Boolean) as Equipment[];
  
  const equipmentBonuses = calculateEquipmentStats(equipment);
  const activeEffects = getActiveEquipmentEffects(character);
  
  return {
    ...character,
    finalStats,
    equipmentBonuses,
    activeEffects
  };
}

export function getCharacterPowerLevel(character: Character): number {
  const finalStats = calculateFinalStats(character);
  
  // Calculate overall power based on final stats
  const basePower = (
    finalStats.attack * 2 +
    finalStats.defense +
    finalStats.magicAttack * 1.5 +
    finalStats.speed * 1.2 +
    finalStats.criticalChance * 0.5 +
    finalStats.accuracy * 0.3
  );
  
  // Level multiplier
  const levelMultiplier = 1 + (character.level * 0.1);
  
  // Equipment bonus
  const equipment = [
    character.equippedItems.weapon,
    character.equippedItems.armor,
    character.equippedItems.accessory
  ].filter(Boolean) as Equipment[];
  
  const equipmentBonus = equipment.reduce((bonus, item) => {
    const rarityMultiplier = {
      common: 1.1,
      uncommon: 1.2,
      rare: 1.4,
      epic: 1.7,
      legendary: 2.0,
      mythic: 2.5
    }[item.rarity] || 1.0;
    
    return bonus + (rarityMultiplier * 10);
  }, 0);
  
  return Math.floor(basePower * levelMultiplier + equipmentBonus);
}

export function simulateEquipmentChange(
  character: Character, 
  newEquipment: Equipment
): {
  oldStats: CombatStats;
  newStats: CombatStats;
  statChanges: Partial<CombatStats>;
  powerChange: number;
} {
  const oldStats = calculateFinalStats(character);
  const oldPower = getCharacterPowerLevel(character);
  
  const testCharacter = equipItem(character, newEquipment);
  const newStats = calculateFinalStats(testCharacter);
  const newPower = getCharacterPowerLevel(testCharacter);
  
  const statChanges: Partial<CombatStats> = {};
  (Object.keys(newStats) as (keyof CombatStats)[]).forEach(key => {
    const change = newStats[key] - oldStats[key];
    if (change !== 0) {
      statChanges[key] = change;
    }
  });
  
  return {
    oldStats,
    newStats,
    statChanges,
    powerChange: newPower - oldPower
  };
}

// Battle effect processors
export function processBattleStartEffects(character: EquippedCharacter): EquipmentEffect[] {
  return character.activeEffects.filter(effect => 
    effect.type === 'trigger' && 
    character.equippedItems.weapon?.effects.some(e => 
      e.id === effect.id && e.trigger === 'battle_start'
    )
  );
}

export function processOnHitEffects(character: EquippedCharacter): EquipmentEffect[] {
  return character.activeEffects.filter(effect => 
    effect.type === 'trigger' && 
    character.equippedItems.weapon?.effects.some(e => 
      e.id === effect.id && e.trigger === 'on_hit'
    )
  );
}

export function processOnCritEffects(character: EquippedCharacter): EquipmentEffect[] {
  return character.activeEffects.filter(effect => 
    effect.type === 'trigger' && 
    character.equippedItems.weapon?.effects.some(e => 
      e.id === effect.id && e.trigger === 'on_crit'
    )
  );
}