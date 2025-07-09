import { Room } from '../types/headquarters';
import { ROOM_ELEMENTS } from '../data/headquartersData';

/**
 * Calculate the total sleeping capacity of a room based on its beds
 */
export const calculateRoomCapacity = (room: Room): number => {
  return room.beds.reduce((total, bed) => total + bed.capacity, 0);
};

/**
 * Calculate sleeping arrangement for a character in a room
 * Returns details about where the character sleeps and comfort bonus
 */
export const calculateSleepingArrangement = (room: Room, characterName: string) => {
  const charIndex = room.assignedCharacters.indexOf(characterName);
  if (charIndex === -1) return { sleepsOnFloor: true, bedType: 'floor', comfortBonus: 0 };

  let assignedSlot = 0;
  for (const bed of room.beds) {
    if (charIndex < assignedSlot + bed.capacity) {
      // Character gets this bed
      return {
        sleepsOnFloor: false,
        bedType: bed.type,
        comfortBonus: bed.comfortBonus,
        sleepsOnCouch: bed.type === 'couch',
        sleepsInBed: bed.type === 'bed' || bed.type === 'bunk_bed'
      };
    }
    assignedSlot += bed.capacity;
  }

  // Character sleeps on floor (overcrowded)
  return {
    sleepsOnFloor: true,
    bedType: 'floor',
    comfortBonus: -10, // Penalty for floor sleeping
    sleepsOnCouch: false,
    sleepsInBed: false
  };
};

/**
 * Calculate room bonuses from elements including synergy bonuses
 */
export const calculateRoomBonuses = (room: Room) => {
  if (!room) return {};

  const bonuses: Record<string, number> = {};
  
  // Base element bonuses
  room.elements.forEach(elementId => {
    const element = ROOM_ELEMENTS.find(e => e.id === elementId);
    if (element) {
      bonuses[element.bonus] = (bonuses[element.bonus] || 0) + element.bonusValue;
    }
  });

  // Synergy bonuses for compatible elements
  room.elements.forEach(elementId => {
    const element = ROOM_ELEMENTS.find(e => e.id === elementId);
    if (element) {
      const compatibleInRoom = element.compatibleWith.filter(compatId => 
        room.elements.includes(compatId)
      );
      
      // Add 25% bonus for each compatible element
      compatibleInRoom.forEach(() => {
        bonuses[element.bonus] = (bonuses[element.bonus] || 0) + Math.floor(element.bonusValue * 0.25);
      });
    }
  });

  return bonuses;
};

/**
 * Get element capacity for current tier
 */
export const getElementCapacity = (currentTier: string): number => {
  const tierCapacity = {
    'spartan_apartment': 2,
    'basic_house': 3,
    'team_mansion': 5,
    'elite_compound': 10
  };
  return tierCapacity[currentTier as keyof typeof tierCapacity] || 2;
};