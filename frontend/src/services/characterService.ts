import { HeadquartersState } from '../types/headquarters';
import { Character } from '../data/characters';
import { calculateRoomCapacity } from '../utils/roomCalculations';
import { characterAPI } from './apiClient';

/**
 * Assign a character to a room
 */
export const assignCharacterToRoom = (
  characterId: string,
  roomId: string,
  availableCharacters: Character[],
  headquarters: HeadquartersState,
  setHeadquarters: (updater: (prev: HeadquartersState) => HeadquartersState) => void,
  setMoveNotification: (notification: { message: string; type: 'success' | 'warning' } | null) => void,
  setHighlightedRoom: (roomId: string | null) => void,
  notificationTimeout: React.MutableRefObject<NodeJS.Timeout | null>
) => {
  const character = availableCharacters.find(c => c.baseName === characterId);
  const room = headquarters.rooms.find(r => r.id === roomId);
  
  if (!character || !room) return;
  
  // Check if already in this room
  if (room.assignedCharacters.includes(characterId)) {
    // Clear previous notification timeout
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }
    
    setMoveNotification({message: `${character.name} is already in ${room.name}`, type: 'warning'});
    notificationTimeout.current = setTimeout(() => {
      setMoveNotification(null);
      setHighlightedRoom(null);
    }, 3000);
    return;
  }
  
  setHeadquarters(prev => ({
    ...prev,
    rooms: prev.rooms.map(room => {
      if (room.id === roomId) {
        const newAssignments = [...room.assignedCharacters, characterId];
        // Check for overcrowding after the move
        const roomCapacity = calculateRoomCapacity(room);
        const willBeOvercrowded = newAssignments.length > roomCapacity;
        
        return {
          ...room,
          assignedCharacters: newAssignments
        };
      } else {
        // Remove character from other rooms
        return {
          ...room,
          assignedCharacters: room.assignedCharacters.filter(id => id !== characterId)
        };
      }
      return room;
    })
  }));
  
  // Enhanced visual feedback
  const newCount = room.assignedCharacters.length + 1;
  const roomCapacity = calculateRoomCapacity(room);
  const isOvercrowded = newCount > roomCapacity;
  
  if (isOvercrowded) {
    const sleepingOnFloor = newCount - roomCapacity;
    setMoveNotification({
      message: `${character.name} moved to ${room.name}! ⚠️ ${sleepingOnFloor} fighter(s) now sleeping on floor/couches`,
      type: 'warning'
    });
  } else {
    setMoveNotification({
      message: `${character.name} moved to ${room.name}! Room capacity: ${newCount}/${roomCapacity}`,
      type: 'success'
    });
  }
  
  // Clear previous notification timeout
  if (notificationTimeout.current) {
    clearTimeout(notificationTimeout.current);
  }
  
  // Highlight the room briefly
  setHighlightedRoom(roomId);
  notificationTimeout.current = setTimeout(() => {
    setHighlightedRoom(null);
    setMoveNotification(null);
  }, 3000);
};

/**
 * Remove a character from a room
 */
export const removeCharacterFromRoom = (
  characterId: string,
  roomId: string,
  setHeadquarters: (updater: (prev: HeadquartersState) => HeadquartersState) => void
) => {
  setHeadquarters(prev => ({
    ...prev,
    rooms: prev.rooms.map(room => 
      room.id === roomId
        ? { ...room, assignedCharacters: room.assignedCharacters.filter(id => id !== characterId) }
        : room
    )
  }));
};

/**
 * Get unassigned characters for the pool
 */
export const getUnassignedCharacters = (
  availableCharacters: Character[],
  headquarters: HeadquartersState
) => {
  const assignedCharacters = headquarters.rooms.flatMap(room => room.assignedCharacters);
  return availableCharacters.filter(char => !assignedCharacters.includes(char.baseName));
};

/**
 * Character service object with API methods
 */
export const characterService = {
  getUserCharacters: () => characterAPI.getUserCharacters(),
  // Add other character-related API methods here as needed
};