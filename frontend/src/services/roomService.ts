import { HeadquartersState } from '../types/headquarters';
import { ROOM_THEMES, ROOM_ELEMENTS } from '../data/headquartersData';
import { roomImageService } from '../data/roomImageService';

/**
 * Set a room's theme
 */
export const setRoomTheme = (
  roomId: string,
  themeId: string,
  headquarters: HeadquartersState,
  setHeadquarters: (updater: (prev: HeadquartersState) => HeadquartersState) => void
) => {
  const theme = ROOM_THEMES.find(t => t.id === themeId);
  if (!theme) return;

  if (headquarters.currency.coins >= theme.cost.coins && headquarters.currency.gems >= theme.cost.gems) {
    setHeadquarters(prev => ({
      ...prev,
      currency: {
        coins: prev.currency.coins - theme.cost.coins,
        gems: prev.currency.gems - theme.cost.gems
      },
      rooms: prev.rooms.map(room => 
        room.id === roomId ? { ...room, theme: themeId } : room
      ),
      unlockedThemes: [...prev.unlockedThemes, themeId]
    }));
  }
};

/**
 * Add an element to a room
 */
export const addElementToRoom = (
  roomId: string,
  elementId: string,
  headquarters: HeadquartersState,
  setHeadquarters: (updater: (prev: HeadquartersState) => HeadquartersState) => void
) => {
  const element = ROOM_ELEMENTS.find(e => e.id === elementId);
  const room = headquarters.rooms.find(r => r.id === roomId);
  
  if (!element || !room) return;

  // Check element capacity based on tier
  const tierCapacity = {
    'spartan_apartment': 2,
    'basic_house': 3,
    'team_mansion': 5,
    'elite_compound': 10
  };
  
  const maxElements = tierCapacity[headquarters.currentTier as keyof typeof tierCapacity] || 2;
  
  if (room.elements.length >= maxElements) {
    console.warn(`Room is at element capacity (${maxElements})`);
    return;
  }

  // Check if player can afford
  if (headquarters.currency.coins >= element.cost.coins && headquarters.currency.gems >= element.cost.gems) {
    setHeadquarters(prev => ({
      ...prev,
      currency: {
        coins: prev.currency.coins - element.cost.coins,
        gems: prev.currency.gems - element.cost.gems
      },
      rooms: prev.rooms.map(room => 
        room.id === roomId 
          ? { ...room, elements: [...room.elements, elementId] }
          : room
      )
    }));
  }
};

/**
 * Remove an element from a room
 */
export const removeElementFromRoom = (
  roomId: string,
  elementId: string,
  setHeadquarters: (updater: (prev: HeadquartersState) => HeadquartersState) => void
) => {
  setHeadquarters(prev => ({
    ...prev,
    rooms: prev.rooms.map(room => 
      room.id === roomId 
        ? { ...room, elements: room.elements.filter(id => id !== elementId) }
        : room
    )
  }));
};

/**
 * Generate custom room image using DALL-E
 */
export const generateRoomImage = async (
  roomId: string,
  headquarters: HeadquartersState,
  setHeadquarters: (updater: (prev: HeadquartersState) => HeadquartersState) => void,
  setIsGeneratingRoomImage: (isGenerating: boolean) => void
) => {
  const room = headquarters.rooms.find(r => r.id === roomId);
  if (!room || room.elements.length === 0) {
    console.warn('Cannot generate image: room not found or no elements selected');
    return;
  }

  setIsGeneratingRoomImage(true);

  try {
    const roomElements = room.elements.map(elementId => {
      const element = ROOM_ELEMENTS.find(e => e.id === elementId);
      return element ? {
        id: element.id,
        name: element.name,
        category: element.category,
        description: element.description
      } : null;
    }).filter(Boolean) as any[];

    const imageUrl = await roomImageService.generateRoomImage({
      roomName: room.name,
      elements: roomElements,
      style: 'photorealistic reality TV set',
      size: 'medium'
    });

    // Update room with generated image
    setHeadquarters(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => 
        r.id === roomId ? { ...r, customImageUrl: imageUrl } : r
      )
    }));

  } catch (error) {
    console.error('Failed to generate room image:', error);
  } finally {
    setIsGeneratingRoomImage(false);
  }
};