import { ROOM_THEMES, HEADQUARTERS_TIERS } from '../data/headquartersData';
import { calculateRoomCapacity } from '../utils/roomCalculations';

/**
 * Character Happiness Service
 * 
 * This service handles all character mood and compatibility calculations.
 * Extracted from TeamHeadquarters.tsx to improve maintainability and testability.
 */

// getCharacterConflicts function - extracted from TeamHeadquarters.tsx (lines 246-266)
export const getCharacterConflicts = (roomId: string, headquarters: any) => {
  const room = headquarters.rooms.find(r => r.id === roomId);
  if (!room || room.assignedCharacters.length < 2) return [];

  const conflicts = [];
  
  if (room.assignedCharacters.includes('holmes') && room.assignedCharacters.includes('dracula')) {
    conflicts.push('Holmes keeps analyzing Dracula\'s sleeping patterns');
  }
  if (room.assignedCharacters.includes('achilles') && room.assignedCharacters.includes('merlin')) {
    conflicts.push('Achilles thinks Merlin\'s midnight spell practice is too loud');
  }
  if (room.assignedCharacters.includes('cleopatra') && room.assignedCharacters.includes('joan')) {
    conflicts.push('Cleopatra insists on royal treatment, Joan prefers humble quarters');
  }
  if (room.assignedCharacters.includes('frankenstein_monster') && room.assignedCharacters.includes('sun_wukong')) {
    conflicts.push('Sun Wukong\'s energy annoys the contemplative Monster');
  }

  return conflicts;
};

// getCharacterHappiness function - extracted from TeamHeadquarters.tsx (lines 269-311)
export const getCharacterHappiness = (charName: string, roomId: string, headquarters: any) => {
  const room = headquarters.rooms.find(r => r.id === roomId);
  if (!room) return { level: 3, status: 'Content', emoji: '😐' };

  let happiness = 3; // Base happiness (1-5 scale)
  
  // Theme compatibility
  const compatibility = getThemeCompatibility(charName, room.theme);
  if (compatibility.type === 'compatible') {
    happiness += 1;
  } else if (compatibility.type === 'incompatible') {
    happiness -= 1; // Penalty for wrong theme
  }
  
  // Overcrowding penalty
  const roomCapacity = calculateRoomCapacity(room);
  if (room.assignedCharacters.length > roomCapacity) {
    happiness -= 1;
  }
  
  // Character conflicts
  const conflicts = getCharacterConflicts(roomId, headquarters);
  if (conflicts.length > 0) {
    happiness -= 1;
  }
  
  // Tier bonus
  const tierIndex = HEADQUARTERS_TIERS.findIndex(t => t.id === headquarters.currentTier);
  happiness += Math.floor(tierIndex / 2);
  
  // Clamp between 1-5
  happiness = Math.max(1, Math.min(5, happiness));
  
  const statusMap = {
    1: { status: 'Miserable', emoji: '😫' },
    2: { status: 'Unhappy', emoji: '😒' },
    3: { status: 'Content', emoji: '😐' },
    4: { status: 'Happy', emoji: '😊' },
    5: { status: 'Ecstatic', emoji: '🤩' }
  };
  
  return { level: happiness, ...statusMap[happiness as keyof typeof statusMap] };
};

// getThemeCompatibility function - extracted from TeamHeadquarters.tsx (lines 314-328)
export const getThemeCompatibility = (charName: string, themeId: string | null) => {
  if (!themeId) return { compatible: true, type: 'no_theme' };
  
  const theme = ROOM_THEMES.find(t => t.id === themeId);
  if (!theme) return { compatible: true, type: 'no_theme' };
  
  const isCompatible = theme.suitableCharacters.includes(charName);
  return {
    compatible: isCompatible,
    type: isCompatible ? 'compatible' : 'incompatible',
    theme,
    bonusValue: isCompatible ? theme.bonusValue : 0,
    penalty: isCompatible ? 0 : -5 // Small happiness penalty for wrong theme
  };
};

// getCharacterSuggestedThemes function - extracted from TeamHeadquarters.tsx (lines 355-357)
export const getCharacterSuggestedThemes = (charName: string) => {
  return ROOM_THEMES.filter(theme => theme.suitableCharacters.includes(charName));
};