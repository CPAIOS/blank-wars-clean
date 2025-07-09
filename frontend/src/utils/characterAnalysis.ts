import { HeadquartersState } from '../types/headquarters';
import { ROOM_THEMES, HEADQUARTERS_TIERS } from '../data/headquartersData';
import { calculateRoomCapacity } from './roomCalculations';

/**
 * Get character conflicts within a room
 */
export const getCharacterConflicts = (roomId: string, headquarters: HeadquartersState) => {
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

/**
 * Get theme compatibility for a character
 */
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

/**
 * Calculate character happiness in a room
 */
export const getCharacterHappiness = (charName: string, roomId: string, headquarters: HeadquartersState) => {
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

/**
 * Get room theme warnings
 */
export const getRoomThemeWarnings = (roomId: string, headquarters: HeadquartersState) => {
  const room = headquarters.rooms.find(r => r.id === roomId);
  if (!room || !room.theme) return [];
  
  const theme = ROOM_THEMES.find(t => t.id === room.theme);
  if (!theme) return [];
  
  const warnings = [];
  const incompatibleCharacters = room.assignedCharacters.filter(charName => 
    !theme.suitableCharacters.includes(charName)
  );
  
  if (incompatibleCharacters.length > 0) {
    warnings.push({
      type: 'theme_mismatch',
      severity: 'warning',
      characters: incompatibleCharacters,
      message: `${incompatibleCharacters.length} fighter(s) clash with ${theme.name} training environment`,
      suggestion: `Consider moving to ${getCharacterSuggestedThemes(incompatibleCharacters[0]).map(t => t.name).join(' or ')}`
    });
  }
  
  return warnings;
};

/**
 * Get suggested themes for a character
 */
export const getCharacterSuggestedThemes = (charName: string) => {
  return ROOM_THEMES.filter(theme => theme.suitableCharacters.includes(charName));
};

/**
 * Calculate missed bonuses for a room
 */
export const calculateMissedBonuses = (roomId: string, headquarters: HeadquartersState) => {
  const room = headquarters.rooms.find(r => r.id === roomId);
  if (!room) return [];
  
  const missedBonuses = [];
  
  room.assignedCharacters.forEach(charName => {
    const compatibility = getThemeCompatibility(charName, room.theme);
    
    // Only show missed bonuses if character is incompatible or room has no theme
    if (compatibility.type === 'incompatible' || compatibility.type === 'no_theme') {
      const suggestedThemes = getCharacterSuggestedThemes(charName);
      suggestedThemes.forEach(theme => {
        missedBonuses.push({
          character: charName,
          theme: theme.name,
          bonus: `+${theme.bonusValue}% ${theme.bonus}`,
          themeId: theme.id
        });
      });
    }
  });
  
  return missedBonuses;
};

/**
 * Calculate team chemistry penalties from overcrowding
 */
export const calculateTeamChemistry = (headquarters: HeadquartersState) => {
  const totalCharacters = headquarters.rooms.reduce((sum, room) => sum + room.assignedCharacters.length, 0);
  const totalCapacity = headquarters.rooms.reduce((sum, room) => sum + calculateRoomCapacity(room), 0);
  
  let chemistryPenalty = 0;
  if (totalCharacters > totalCapacity) {
    const overflow = totalCharacters - totalCapacity;
    if (overflow >= 4) chemistryPenalty = -35; // 12+ characters in 8-capacity apartment
    else if (overflow >= 2) chemistryPenalty = -25; // 10+ characters
    else chemistryPenalty = -15; // 8+ characters
  }
  
  return { teamCoordination: chemistryPenalty };
};

/**
 * Calculate total battle effects from themes and overcrowding
 */
export const calculateBattleEffects = (headquarters: HeadquartersState) => {
  const effects: Record<string, number> = {};
  
  // Positive bonuses from room themes
  headquarters.rooms.forEach(room => {
    if (room.theme) {
      const theme = ROOM_THEMES.find(t => t.id === room.theme);
      if (theme) {
        room.assignedCharacters.forEach(charName => {
          if (theme.suitableCharacters.includes(charName)) {
            if (!effects[theme.bonus]) effects[theme.bonus] = 0;
            effects[theme.bonus] += theme.bonusValue;
          }
        });
      }
    }
  });
  
  // Negative penalties from overcrowding
  const chemistry = calculateTeamChemistry(headquarters);
  Object.entries(chemistry).forEach(([key, value]) => {
    if (value !== 0) {
      effects[key] = value;
    }
  });

  return effects;
};