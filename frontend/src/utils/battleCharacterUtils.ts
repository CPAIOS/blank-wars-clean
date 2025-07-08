import { TeamCharacter } from '@/data/teamBattleSystem';
import { type BattleCharacter } from '@/data/battleFlow';

// Convert TeamCharacter to BattleCharacter format for battle engine
export const convertToBattleCharacter = (character: TeamCharacter, morale: number): BattleCharacter => {
  return {
    character: {
      id: character.name.toLowerCase().replace(/\s+/g, '_'),
      name: character.name,
      archetype: character.archetype || 'warrior',
      level: character.level,
      experience: character.experience,
      baseStats: {
        health: character.maxHp,
        attack: character.traditionalStats.strength + character.temporaryStats.strength,
        defense: character.traditionalStats.vitality + character.temporaryStats.vitality,
        speed: character.traditionalStats.speed + character.temporaryStats.speed,
        special: 50 + character.temporaryStats.spirit // Assuming spirit contributes to special
      },
      abilities: character.abilities.map(ability => ({
        id: ability.name.toLowerCase().replace(/\s+/g, '_'),
        name: ability.name,
        type: ability.type === 'attack' ? 'offensive' : ability.type === 'defense' ? 'defensive' : 'support',
        description: ability.description || `${ability.name} ability`,
        damage_multiplier: ability.power / 100,
        cooldown: ability.cooldown || 0,
        mana_cost: 10 // Default mana cost for abilities
      })),
      equipment: [], // TeamCharacter doesn't have items
      personalityTraits: character.personalityTraits || [],
      relationshipModifiers: {},
      battleMemories: []
    },
    currentHealth: character.currentHp,
    currentMana: 100, // Default mana
    physicalDamageDealt: 0, // TeamCharacter doesn't track battle stats
    physicalDamageTaken: 0, // TeamCharacter doesn't track battle stats
    statusEffects: character.statusEffects.map(effect => ({
      type: effect,
      duration: 3,
      intensity: 1,
      source: 'unknown'
    })),
    mentalState: {
      confidence: character.psychologyState?.currentPsychology.motivationAnxietyBalance > 0 ? 'high' : 'normal',
      stress_level: character.psychologyState?.currentPsychology.stressLevel || 0,
      morale,
      battle_rhythm: 'normal'
    },
    plannedActions: [],
    actionHistory: []
  };
};