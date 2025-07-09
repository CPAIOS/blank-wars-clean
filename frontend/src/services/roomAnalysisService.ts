import { ROOM_THEMES, ROOM_ELEMENTS } from '../data/headquartersData';
import { getThemeCompatibility, getCharacterSuggestedThemes } from './characterHappinessService';

/**
 * Room Analysis Service
 * 
 * This service handles room performance analysis, optimization suggestions,
 * and missed bonus calculations. Extracted from TeamHeadquarters.tsx to 
 * improve maintainability and provide focused room analysis logic.
 */

// getRoomThemeWarnings function - extracted from TeamHeadquarters.tsx (lines 258-280)
export const getRoomThemeWarnings = (roomId: string, headquarters: any) => {
  if (!headquarters?.rooms) return [];
  
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

// calculateMissedBonuses function - extracted from TeamHeadquarters.tsx (lines 257-281)
export const calculateMissedBonuses = (roomId: string, headquarters: any) => {
  if (!headquarters?.rooms) return [];
  
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

// calculateRoomBonuses function - extracted from TeamHeadquarters.tsx (lines 338-368)
export const calculateRoomBonuses = (roomId: string, headquarters: any) => {
  if (!headquarters?.rooms) return {};
  
  const room = headquarters.rooms.find(r => r.id === roomId);
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