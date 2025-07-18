// Headquarters Battle Bonuses Utility
// Calculates and applies headquarters room bonuses to team stats

export interface HeadquartersBonus {
  [key: string]: number; // e.g., { "Strength": 15, "Accuracy": 20 }
}

export interface HeadquartersPenalty {
  [key: string]: number; // e.g., { "All Stats": -10, "Teamwork": -15 }
}

export interface CharacterConflict {
  character1: string;
  character2: string;
  conflictType: 'personality' | 'historical' | 'cultural';
  severity: 'minor' | 'major' | 'severe';
  penalty: number; // Percentage penalty to apply
}

export interface Bed {
  id: string;
  type: 'bed' | 'bunk_bed' | 'couch' | 'air_mattress';
  position: { x: number; y: number };
  capacity: number;
  comfortBonus: number;
  cost?: { coins: number; gems: number };
}

export interface Room {
  id: string;
  name: string;
  theme: string | null;
  assignedCharacters: string[];
  maxCharacters: number;
  beds: Bed[];
}

export interface RoomTheme {
  id: string;
  name: string;
  description: string;
  bonus: string; // "Strength", "Accuracy", "Speed", etc.
  bonusValue: number;
  suitableCharacters: string[];
  cost: { coins: number; gems: number };
  backgroundColor: string;
  textColor: string;
  icon: string;
}

export interface HeadquartersState {
  currentTier: string;
  rooms: Room[];
  currency: { coins: number; gems: number };
  unlockedThemes: string[];
}

// Room themes data - this should match the data in TeamHeadquarters.tsx
export const ROOM_THEMES: RoomTheme[] = [
  {
    id: 'greek_classical',
    name: 'Classical Greek',
    description: 'Marble columns, olive wreaths, and classical Greek architecture',
    bonus: 'Strength',
    bonusValue: 15,
    suitableCharacters: ['achilles', 'odysseus'],
    cost: { coins: 5000, gems: 10 },
    backgroundColor: 'bg-blue-900/20',
    textColor: 'text-blue-300',
    icon: '🏛️'
  },
  {
    id: 'victorian_study',
    name: 'Victorian Study',
    description: 'Dark wood, leather chairs, and intellectual sophistication',
    bonus: 'Intelligence',
    bonusValue: 20,
    suitableCharacters: ['holmes', 'watson'],
    cost: { coins: 4000, gems: 8 },
    backgroundColor: 'bg-amber-900/20',
    textColor: 'text-amber-300',
    icon: '📚'
  },
  {
    id: 'gothic_chamber',
    name: 'Gothic Chamber',
    description: 'Dark tapestries, candles, and mysterious atmosphere',
    bonus: 'Charisma',
    bonusValue: 18,
    suitableCharacters: ['dracula', 'frankenstein_monster'],
    cost: { coins: 6000, gems: 12 },
    backgroundColor: 'bg-purple-900/20',
    textColor: 'text-purple-300',
    icon: '🦇'
  },
  {
    id: 'mystical_sanctuary',
    name: 'Mystical Sanctuary',
    description: 'Crystals, ancient symbols, and magical energies',
    bonus: 'Spirit',
    bonusValue: 25,
    suitableCharacters: ['merlin', 'sun_wukong'],
    cost: { coins: 8000, gems: 15 },
    backgroundColor: 'bg-indigo-900/20',
    textColor: 'text-indigo-300',
    icon: '🔮'
  },
  {
    id: 'royal_quarters',
    name: 'Royal Quarters',
    description: 'Golden accents, silk curtains, and regal luxury',
    bonus: 'Charisma',
    bonusValue: 22,
    suitableCharacters: ['cleopatra', 'genghis_khan'],
    cost: { coins: 10000, gems: 20 },
    backgroundColor: 'bg-yellow-900/20',
    textColor: 'text-yellow-300',
    icon: '👑'
  },
  {
    id: 'medieval_armory',
    name: 'Medieval Armory',
    description: 'Weapons, shields, and knightly heritage',
    bonus: 'Dexterity',
    bonusValue: 16,
    suitableCharacters: ['joan'],
    cost: { coins: 5500, gems: 11 },
    backgroundColor: 'bg-gray-900/20',
    textColor: 'text-gray-300',
    icon: '⚔️'
  },
  {
    id: 'wild_west',
    name: 'Wild West Saloon',
    description: 'Wooden floors, cowboy memorabilia, and frontier spirit',
    bonus: 'Speed',
    bonusValue: 18,
    suitableCharacters: ['billy_the_kid'],
    cost: { coins: 4500, gems: 9 },
    backgroundColor: 'bg-orange-900/20',
    textColor: 'text-orange-300',
    icon: '🤠'
  },
  {
    id: 'futuristic',
    name: 'Tech Lab',
    description: 'Holographic displays, advanced equipment, and cutting-edge technology',
    bonus: 'Accuracy',
    bonusValue: 20,
    suitableCharacters: ['tesla', 'space_cyborg', 'agent_x'],
    cost: { coins: 10000, gems: 25 },
    backgroundColor: 'bg-cyan-900/20',
    textColor: 'text-cyan-300',
    icon: '🤖'
  },
  {
    id: 'sports_den',
    name: 'Sports Den',
    description: 'Baseball memorabilia, trophies, and all-American spirit',
    bonus: 'Stamina',
    bonusValue: 15,
    suitableCharacters: ['sammy_slugger'],
    cost: { coins: 3000, gems: 5 },
    backgroundColor: 'bg-green-900/20',
    textColor: 'text-green-300',
    icon: '⚾'
  },
  {
    id: 'mongolian',
    name: 'Khan\'s Yurt',
    description: 'Traditional Mongolian decorations and symbols of conquest',
    bonus: 'Vitality',
    bonusValue: 20,
    suitableCharacters: ['genghis_khan'],
    cost: { coins: 7000, gems: 14 },
    backgroundColor: 'bg-red-900/20',
    textColor: 'text-red-300',
    icon: '🏹'
  },
  {
    id: 'norse_hall',
    name: 'Norse Mead Hall',
    description: 'Viking shields, drinking horns, and warrior camaraderie',
    bonus: 'Strength',
    bonusValue: 18,
    suitableCharacters: ['ragnar'],
    cost: { coins: 6500, gems: 13 },
    backgroundColor: 'bg-blue-900/20',
    textColor: 'text-blue-300',
    icon: '🐺'
  }
];

// Character conflict matrix - defines which characters clash
export const CHARACTER_CONFLICTS: CharacterConflict[] = [
  // Historical Conflicts
  { character1: 'dracula', character2: 'holmes', conflictType: 'personality', severity: 'major', penalty: 15 },
  { character1: 'achilles', character2: 'joan', conflictType: 'historical', severity: 'minor', penalty: 8 },
  { character1: 'genghis_khan', character2: 'cleopatra', conflictType: 'cultural', severity: 'major', penalty: 12 },
  
  // Personality Clashes
  { character1: 'dracula', character2: 'tesla', conflictType: 'personality', severity: 'minor', penalty: 6 },
  { character1: 'holmes', character2: 'sun_wukong', conflictType: 'personality', severity: 'minor', penalty: 7 },
  { character1: 'frankenstein_monster', character2: 'joan', conflictType: 'personality', severity: 'major', penalty: 14 },
  
  // Cultural/Era Conflicts  
  { character1: 'billy_the_kid', character2: 'cleopatra', conflictType: 'cultural', severity: 'minor', penalty: 5 },
  { character1: 'space_cyborg', character2: 'merlin', conflictType: 'cultural', severity: 'minor', penalty: 6 },
  { character1: 'agent_x', character2: 'achilles', conflictType: 'personality', severity: 'minor', penalty: 7 }
];

// Headquarters tier penalties
export const HEADQUARTERS_TIER_PENALTIES: Record<string, HeadquartersPenalty> = {
  'spartan_apartment': {
    'All Stats': -8, // Poor living conditions affect everything
    'Morale': -15,   // Cramped conditions hurt team spirit
    'Teamwork': -10  // Hard to coordinate in small space
  },
  'shared_house': {
    'All Stats': -3, // Slightly better but still cramped
    'Morale': -5
  },
  'team_complex': {
    // No penalties - this is the baseline good housing
  },
  'luxury_compound': {
    // No penalties - luxury housing, could even have small bonuses
  }
};

/**
 * Calculate battle bonuses from headquarters room themes
 */
export function calculateHeadquartersBonuses(headquarters: HeadquartersState): HeadquartersBonus {
  if (!headquarters?.rooms) {
    return {};
  }
  return headquarters.rooms.reduce((bonuses: HeadquartersBonus, room) => {
    if (room.theme && room.assignedCharacters.length > 0) {
      const theme = ROOM_THEMES.find(t => t.id === room.theme);
      if (theme) {
        // Only apply bonus if characters are actually assigned to the themed room
        bonuses[theme.bonus] = (bonuses[theme.bonus] || 0) + theme.bonusValue;
      }
    }
    return bonuses;
  }, {});
}

/**
 * Convert headquarters bonus names to battle stat names
 */
export function mapBonusToStat(bonusName: string): string {
  const mapping: Record<string, string> = {
    'Strength': 'strength',
    'Intelligence': 'intelligence', 
    'Charisma': 'charisma',
    'Spirit': 'spirit',
    'Dexterity': 'dexterity',
    'Speed': 'speed',
    'Accuracy': 'dexterity', // Accuracy maps to dexterity in battle system
    'Stamina': 'stamina',
    'Vitality': 'vitality'
  };
  return mapping[bonusName] || bonusName.toLowerCase();
}

/**
 * Calculate all penalties from headquarters conditions
 */
export function calculateHeadquartersPenalties(headquarters: HeadquartersState): HeadquartersPenalty {
  const penalties: HeadquartersPenalty = {};

  if (!headquarters?.rooms) {
    return penalties;
  }

  // 1. Overcrowding penalties
  headquarters.rooms.forEach(room => {
    if (room.assignedCharacters.length > room.maxCharacters) {
      const overcrowdAmount = room.assignedCharacters.length - room.maxCharacters;
      const penaltyPerExtraPerson = 5; // -5% per extra person
      const overcrowdingPenalty = overcrowdAmount * penaltyPerExtraPerson;
      
      penalties['All Stats'] = (penalties['All Stats'] || 0) - overcrowdingPenalty;
      penalties['Morale'] = (penalties['Morale'] || 0) - (overcrowdingPenalty * 1.5); // Extra morale hit
    }
  });

  // 2. Character conflict penalties
  headquarters.rooms.forEach(room => {
    const roomCharacters = room.assignedCharacters;
    roomCharacters.forEach((char1, i) => {
      roomCharacters.slice(i + 1).forEach(char2 => {
        const conflict = CHARACTER_CONFLICTS.find(c => 
          (c.character1 === char1 && c.character2 === char2) ||
          (c.character1 === char2 && c.character2 === char1)
        );
        
        if (conflict) {
          penalties['Teamwork'] = (penalties['Teamwork'] || 0) - conflict.penalty;
          if (conflict.severity === 'major' || conflict.severity === 'severe') {
            penalties['Morale'] = (penalties['Morale'] || 0) - (conflict.penalty * 0.7);
          }
        }
      });
    });
  });

  // 3. Housing tier penalties
  const tierPenalties = HEADQUARTERS_TIER_PENALTIES[headquarters.currentTier];
  if (tierPenalties) {
    Object.entries(tierPenalties).forEach(([stat, penalty]) => {
      penalties[stat] = (penalties[stat] || 0) + penalty; // penalty is already negative
    });
  }

  // 4. Unthemed room penalties
  headquarters.rooms.forEach(room => {
    if (!room.theme && room.assignedCharacters.length > 0) {
      const unthemedPenalty = -3; // Small penalty for lack of personalization
      penalties['Morale'] = (penalties['Morale'] || 0) + unthemedPenalty;
    }
  });

  return penalties;
}

/**
 * Get character conflicts in a specific room
 */
export function getRoomConflicts(room: Room): CharacterConflict[] {
  const conflicts: CharacterConflict[] = [];
  const roomCharacters = room.assignedCharacters;
  
  roomCharacters.forEach((char1, i) => {
    roomCharacters.slice(i + 1).forEach(char2 => {
      const conflict = CHARACTER_CONFLICTS.find(c => 
        (c.character1 === char1 && c.character2 === char2) ||
        (c.character1 === char2 && c.character2 === char1)
      );
      
      if (conflict) {
        conflicts.push(conflict);
      }
    });
  });
  
  return conflicts;
}

/**
 * Calculate net effect (bonuses + penalties) for headquarters
 */
export function calculateNetHeadquartersEffect(headquarters: HeadquartersState): { bonuses: HeadquartersBonus, penalties: HeadquartersPenalty } {
  const bonuses = calculateHeadquartersBonuses(headquarters);
  const penalties = calculateHeadquartersPenalties(headquarters);
  
  return { bonuses, penalties };
}

/**
 * Calculate sleep comfort bonus for a character based on their bed assignment
 */
export function calculateSleepComfortBonus(
  character: any,
  room: Room,
  characterId: string
): number {
  const charIndex = room.assignedCharacters.indexOf(characterId);
  if (charIndex === -1) return -10; // Not assigned to any room, severe penalty

  let assignedSlot = 0;
  for (const bed of room.beds) {
    if (charIndex < assignedSlot + bed.capacity) {
      // Character gets this bed's comfort bonus
      return bed.comfortBonus;
    }
    assignedSlot += bed.capacity;
  }

  // Character sleeps on floor (overcrowded)
  return -10;
}

/**
 * Calculate total sleep bonuses for all characters in HQ
 */
export function calculateHQSleepBonuses(headquarters: HeadquartersState): Record<string, number> {
  const sleepBonuses: Record<string, number> = {};

  if (!headquarters?.rooms) {
    return sleepBonuses;
  }

  headquarters.rooms.forEach(room => {
    room.assignedCharacters.forEach((characterId, index) => {
      let assignedSlot = 0;
      let comfortBonus = -10; // Default floor sleeping penalty

      for (const bed of room.beds) {
        if (index < assignedSlot + bed.capacity) {
          comfortBonus = bed.comfortBonus;
          break;
        }
        assignedSlot += bed.capacity;
      }

      sleepBonuses[characterId] = comfortBonus;
    });
  });

  return sleepBonuses;
}

/**
 * Apply headquarters bonuses and penalties to a character's temporary stats
 */
export function applyHeadquartersEffectsToCharacter(
  character: any,
  bonuses: HeadquartersBonus,
  penalties: HeadquartersPenalty,
  characterId: string,
  sleepComfortBonus?: number
): any {
  const enhancedCharacter = { ...character };
  
  // Apply bonuses to temporaryStats
  Object.entries(bonuses).forEach(([bonusName, bonusValue]) => {
    const statName = mapBonusToStat(bonusName);
    if (enhancedCharacter.temporaryStats && enhancedCharacter.temporaryStats[statName] !== undefined) {
      enhancedCharacter.temporaryStats[statName] += bonusValue;
    }
  });
  
  // Apply penalties to temporaryStats
  Object.entries(penalties).forEach(([penaltyName, penaltyValue]) => {
    if (penaltyName === 'All Stats') {
      // Apply to all stats
      Object.keys(enhancedCharacter.temporaryStats).forEach(statName => {
        enhancedCharacter.temporaryStats[statName] += penaltyValue; // penaltyValue is negative
      });
    } else {
      const statName = mapBonusToStat(penaltyName);
      if (enhancedCharacter.temporaryStats && enhancedCharacter.temporaryStats[statName] !== undefined) {
        enhancedCharacter.temporaryStats[statName] += penaltyValue; // penaltyValue is negative
      }
    }
  });
  
  // Apply sleep comfort bonus (affects morale/stamina)
  if (sleepComfortBonus !== undefined && enhancedCharacter.temporaryStats) {
    // Sleep quality affects stamina and morale
    if (enhancedCharacter.temporaryStats.stamina !== undefined) {
      enhancedCharacter.temporaryStats.stamina += Math.floor(sleepComfortBonus * 0.5); // 50% of comfort to stamina
    }
    if (enhancedCharacter.temporaryStats.vitality !== undefined) {
      enhancedCharacter.temporaryStats.vitality += Math.floor(sleepComfortBonus * 0.3); // 30% of comfort to vitality
    }
    
    // Store the sleep comfort for display purposes
    enhancedCharacter.sleepComfort = sleepComfortBonus;
  }
  
  return enhancedCharacter;
}