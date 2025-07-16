/**
 * Headquarters Effects Service
 * 
 * This service calculates the real game impact of headquarters facilities, 
 * room themes, and apartment upgrades on character stats and battle performance.
 */

interface HeadquartersEffects {
  physicalDamageBonus: number;
  magicDamageBonus: number;
  defenseBonus: number;
  speedBonus: number;
  criticalChanceBonus: number;
  teamCoordinationModifier: number;
  healthRegenBonus: number;
  energyBonus: number;
}

interface RoomTheme {
  id: string;
  name: string;
  bonus: string;
  bonusValue: number;
  suitableCharacters: string[];
}

interface HeadquartersData {
  currentTier: string;
  rooms: Array<{
    id: string;
    theme?: string;
    assignedCharacters: string[];
  }>;
  unlockedThemes: string[];
}

const ROOM_THEMES: RoomTheme[] = [
  {
    id: 'gothic',
    name: 'Gothic Chamber',
    bonus: 'Magic Damage',
    bonusValue: 15,
    suitableCharacters: ['dracula', 'frankenstein_monster']
  },
  {
    id: 'medieval',
    name: 'Medieval Hall',
    bonus: 'Physical Damage',
    bonusValue: 15,
    suitableCharacters: ['achilles', 'joan', 'robin_hood']
  },
  {
    id: 'victorian',
    name: 'Victorian Study',
    bonus: 'Critical Chance',
    bonusValue: 12,
    suitableCharacters: ['holmes']
  },
  {
    id: 'egyptian',
    name: 'Pharaoh\'s Chamber',
    bonus: 'Defense',
    bonusValue: 20,
    suitableCharacters: ['cleopatra']
  },
  {
    id: 'mystical',
    name: 'Mystical Sanctuary',
    bonus: 'Magic Damage',
    bonusValue: 18,
    suitableCharacters: ['tesla', 'space_cyborg']
  },
  {
    id: 'saloon',
    name: 'Saloon Room',
    bonus: 'Speed',
    bonusValue: 12,
    suitableCharacters: ['robin_hood', 'wild_west_character']
  }
];

const HEADQUARTERS_TIERS = {
  'spartan_apartment': {
    teamCoordinationPenalty: -25, // Overcrowded conditions hurt teamwork
    healthRegenPenalty: -10,      // Poor living conditions affect recovery
    energyPenalty: -15            // Stress from overcrowding
  },
  'basic_house': {
    teamCoordinationPenalty: 0,   // Normal conditions
    healthRegenPenalty: 0,
    energyPenalty: 0
  },
  'team_mansion': {
    teamCoordinationBonus: 15,    // Luxurious conditions improve teamwork
    healthRegenBonus: 20,         // Great living conditions aid recovery
    energyBonus: 25               // Comfort and space boost morale
  },
  'elite_compound': {
    teamCoordinationBonus: 30,    // Ultimate team facilities
    healthRegenBonus: 35,         // State-of-the-art recovery facilities
    energyBonus: 40               // Peak performance environment
  }
};

/**
 * Calculate headquarters effects for a specific character
 */
export function calculateCharacterHeadquartersEffects(
  characterId: string,
  headquarters: HeadquartersData
): HeadquartersEffects {
  const effects: HeadquartersEffects = {
    physicalDamageBonus: 0,
    magicDamageBonus: 0,
    defenseBonus: 0,
    speedBonus: 0,
    criticalChanceBonus: 0,
    teamCoordinationModifier: 0,
    healthRegenBonus: 0,
    energyBonus: 0
  };

  // Apply apartment tier effects
  const tierEffects = HEADQUARTERS_TIERS[headquarters.currentTier as keyof typeof HEADQUARTERS_TIERS];
  if (tierEffects) {
    // Use type-safe property access
    effects.teamCoordinationModifier += (tierEffects as any).teamCoordinationBonus || (tierEffects as any).teamCoordinationPenalty || 0;
    effects.healthRegenBonus += (tierEffects as any).healthRegenBonus || (tierEffects as any).healthRegenPenalty || 0;
    effects.energyBonus += (tierEffects as any).energyBonus || (tierEffects as any).energyPenalty || 0;
  }

  // Apply room theme bonuses
  headquarters.rooms.forEach(room => {
    if (room.theme && room.assignedCharacters.includes(characterId)) {
      const theme = ROOM_THEMES.find(t => t.id === room.theme);
      if (theme && theme.suitableCharacters.includes(characterId)) {
        switch (theme.bonus) {
          case 'Physical Damage':
            effects.physicalDamageBonus += theme.bonusValue;
            break;
          case 'Magic Damage':
            effects.magicDamageBonus += theme.bonusValue;
            break;
          case 'Defense':
            effects.defenseBonus += theme.bonusValue;
            break;
          case 'Speed':
            effects.speedBonus += theme.bonusValue;
            break;
          case 'Critical Chance':
            effects.criticalChanceBonus += theme.bonusValue;
            break;
        }
      }
    }
  });

  return effects;
}

/**
 * Apply headquarters effects to character battle stats
 */
export function applyHeadquartersEffectsToCharacter(
  character: any,
  headquarters: HeadquartersData
): any {
  const effects = calculateCharacterHeadquartersEffects(character.id || character.character_id, headquarters);
  
  // Apply effects to character stats
  const enhancedCharacter = {
    ...character,
    // Base stats with headquarters bonuses
    effective_attack: character.base_attack + effects.physicalDamageBonus + effects.magicDamageBonus,
    effective_defense: character.base_defense + effects.defenseBonus,
    effective_speed: character.base_speed + effects.speedBonus,
    effective_critical_chance: (character.critical_chance || 10) + effects.criticalChanceBonus,
    
    // Living condition effects
    team_coordination_modifier: effects.teamCoordinationModifier,
    health_regen_modifier: effects.healthRegenBonus,
    energy_modifier: effects.energyBonus,
    
    // Track applied effects for debugging
    headquarters_effects: effects
  };

  console.log(`🏠 Applied headquarters effects to ${character.name}:`, effects);
  
  return enhancedCharacter;
}

/**
 * Get headquarters data for a user (placeholder - will need to integrate with actual headquarters storage)
 */
export async function getHeadquartersData(userId: string): Promise<HeadquartersData | null> {
  // TODO: Integrate with actual headquarters storage system
  // For now, return a basic structure
  return {
    currentTier: 'basic_house',
    rooms: [
      {
        id: 'room_1',
        theme: 'medieval',
        assignedCharacters: ['achilles', 'joan']
      },
      {
        id: 'room_2', 
        theme: 'gothic',
        assignedCharacters: ['dracula', 'frankenstein_monster']
      }
    ],
    unlockedThemes: ['medieval', 'gothic', 'victorian']
  };
}

export { HeadquartersEffects, HeadquartersData };