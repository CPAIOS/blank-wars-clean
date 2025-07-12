import { HeadquartersState } from '../types/headquarters';
import { Character } from '../data/characters';
import { kitchenChatService } from '../data/kitchenChatService';
import { PromptTemplateService } from '../services/promptTemplateService';
import { usageService, UsageStatus } from '../services/usageService';
import { calculateSleepingArrangement, calculateRoomCapacity } from '../utils/roomCalculations';

// Re-export the original service for backwards compatibility
export { kitchenChatService };

export interface KitchenConversation {
  id: string;
  avatar: string;
  speaker: string;
  message: string;
  isComplaint: boolean;
  timestamp: Date;
  isAI: boolean;
  round: number;
}

/**
 * Start a new kitchen scene with opening conversations
 */
export const startNewScene = async (
  headquarters: HeadquartersState,
  availableCharacters: Character[],
  setIsGeneratingConversation: (generating: boolean) => void,
  setCurrentSceneRound: (round: number) => void,
  setKitchenConversations: (conversations: KitchenConversation[]) => void
) => {
  setIsGeneratingConversation(true);
  setCurrentSceneRound(1);
  setKitchenConversations([]);
  
  try {
    // Wait for socket connection
    const isConnected = await kitchenChatService.waitForConnection();
    if (!isConnected) {
      console.warn('Could not establish socket connection for kitchen chat');
    }
    const sceneType = PromptTemplateService.selectSceneType();
    const allRoommates = availableCharacters.map(c => c.id);
    const participants = PromptTemplateService.selectSceneParticipants(allRoommates, 3);
    const trigger = PromptTemplateService.generateSceneTrigger(sceneType, headquarters.currentTier, headquarters);
    
    console.log('🎬 Starting new scene:', { sceneType, participants, trigger });
    
    const openingConversations = [];
    
    for (const charName of participants) {
      const character = availableCharacters.find(c => c.id === charName);
      if (!character) continue;
      
      const teammates = availableCharacters.filter(c => 
        allRoommates.includes(c.id) && c.id !== charName
      );
      
      // Calculate sleeping arrangement for this character
      const room = headquarters.rooms.find(r => r.assignedCharacters.includes(charName)) || headquarters.rooms[0];
      const sleepingArrangement = calculateSleepingArrangement(room, charName);
      const roomCapacity = calculateRoomCapacity(room);
      const isOvercrowded = room.assignedCharacters.length > roomCapacity;
      
      const context = {
        character,
        teammates,
        coachName: 'Coach',
        livingConditions: {
          apartmentTier: headquarters.currentTier,
          roomTheme: room.theme,
          sleepsOnCouch: sleepingArrangement.sleepsOnCouch,
          sleepsOnFloor: sleepingArrangement.sleepsOnFloor,
          sleepsInBed: sleepingArrangement.sleepsInBed,
          bedType: sleepingArrangement.bedType,
          comfortBonus: sleepingArrangement.comfortBonus,
          sleepsUnderTable: charName === 'dracula' && headquarters.currentTier === 'spartan_apartment',
          roomOvercrowded: isOvercrowded,
          floorSleeperCount: Math.max(0, room.assignedCharacters.length - roomCapacity),
          roommateCount: room.assignedCharacters.length
        },
        recentEvents: [trigger]
      };
      
      try {
        const response = await kitchenChatService.generateKitchenConversation(context, trigger);
        openingConversations.push({
          id: `scene1_${Date.now()}_${charName}`,
          avatar: character.avatar,
          speaker: character.name.split(' ')[0],
          message: response,
          isComplaint: response.includes('!') || response.toLowerCase().includes('annoying'),
          timestamp: new Date(),
          isAI: true,
          round: 1
        });
      } catch (error: any) {
        console.error(`Scene generation failed for ${charName}:`, error);
        
        // More informative error handling
        let errorMessage = `*${character.name.split(' ')[0]} seems lost in thought*`;
        
        if (error.message === 'Socket not connected to backend. Please refresh the page and try again.') {
          errorMessage = `*${character.name.split(' ')[0]} is waiting for the connection to establish...*`;
          console.log('🔌 Socket connection issue detected. Waiting for connection...');
          
          // Try to wait for connection
          const connected = await kitchenChatService.waitForConnection(3000);
          if (connected) {
            console.log('✅ Socket connected! Retrying...');
            // Retry once after connection
            try {
              const response = await kitchenChatService.generateKitchenConversation(context, trigger);
              openingConversations.push({
                id: `scene1_${Date.now()}_${charName}`,
                avatar: character.avatar,
                speaker: character.name.split(' ')[0],
                message: response,
                isComplaint: response.includes('!') || response.toLowerCase().includes('annoying'),
                timestamp: new Date(),
                isAI: true,
                round: 1
              });
              continue; // Skip the fallback
            } catch (retryError) {
              console.error(`Retry failed for ${charName}:`, retryError);
            }
          }
        } else if (error.message === 'USAGE_LIMIT_REACHED') {
          errorMessage = `*${character.name.split(' ')[0]} is conserving energy for later battles*`;
        } else if (error.message?.includes('timeout')) {
          errorMessage = `*${character.name.split(' ')[0]} pauses, gathering their thoughts*`;
        }
        
        openingConversations.push({
          id: `fallback_${Date.now()}_${charName}`,
          avatar: character.avatar,
          speaker: character.name.split(' ')[0],
          message: errorMessage,
          isComplaint: false,
          timestamp: new Date(),
          isAI: false,
          round: 1
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setKitchenConversations(openingConversations);
  } finally {
    setIsGeneratingConversation(false);
  }
};

/**
 * Handle coach message input and generate character responses
 */
export const handleCoachMessage = async (
  coachMessage: string,
  headquarters: HeadquartersState,
  availableCharacters: Character[],
  currentSceneRound: number,
  setKitchenConversations: (fn: (prev: KitchenConversation[]) => KitchenConversation[]) => void,
  setCoachMessage: (message: string) => void,
  setIsGeneratingConversation: (generating: boolean) => void,
  setCurrentSceneRound: (round: number) => void
) => {
  if (!coachMessage.trim()) return;
  
  // Add coach message to conversation
  const coachConversation = {
    id: `coach_${Date.now()}`,
    avatar: '👨‍💼',
    speaker: 'Coach',
    message: coachMessage.trim(),
    isComplaint: false,
    timestamp: new Date(),
    isAI: false,
    round: currentSceneRound
  };
  
  setKitchenConversations(prev => [coachConversation, ...prev]);
  const userMessage = coachMessage.trim();
  setCoachMessage('');
  
  // Wait a bit to ensure coach message is visible before generating responses
  await new Promise(resolve => setTimeout(resolve, 500));
  setIsGeneratingConversation(true);
  
  try {
    // Get characters to respond to the coach's message
    const allRoommates = availableCharacters.map(c => c.id);
    const participants = PromptTemplateService.selectSceneParticipants(allRoommates, 2); // Just 2 characters respond
    
    const responses = [];
    
    for (const charName of participants) {
      const character = availableCharacters.find(c => c.id === charName);
      if (!character) continue;
      
      const teammates = availableCharacters.filter(c => 
        allRoommates.includes(c.id) && c.id !== charName
      );
      
      // Calculate sleeping arrangement for this character
      const room = headquarters.rooms.find(r => r.assignedCharacters.includes(charName)) || headquarters.rooms[0];
      const sleepingArrangement = calculateSleepingArrangement(room, charName);
      const roomCapacity = calculateRoomCapacity(room);
      const isOvercrowded = room.assignedCharacters.length > roomCapacity;
      
      const context = {
        character,
        teammates,
        coachName: 'Coach',
        livingConditions: {
          apartmentTier: headquarters.currentTier,
          roomTheme: room.theme,
          sleepsOnCouch: sleepingArrangement.sleepsOnCouch,
          sleepsOnFloor: sleepingArrangement.sleepsOnFloor,
          sleepsInBed: sleepingArrangement.sleepsInBed,
          bedType: sleepingArrangement.bedType,
          comfortBonus: sleepingArrangement.comfortBonus,
          sleepsUnderTable: charName === 'dracula' && headquarters.currentTier === 'spartan_apartment',
          roomOvercrowded: isOvercrowded,
          floorSleeperCount: Math.max(0, room.assignedCharacters.length - roomCapacity),
          roommateCount: room.assignedCharacters.length
        },
        recentEvents: [userMessage]
      };
      
      try {
        const response = await kitchenChatService.generateKitchenConversation(
          context, 
          `Your coach just said to everyone: "${userMessage}". React and respond directly to them.`
        );
        responses.push({
          id: `response_${Date.now()}_${charName}`,
          avatar: character.avatar,
          speaker: character.name.split(' ')[0],
          message: response,
          isComplaint: response.includes('!') || response.toLowerCase().includes('annoying'),
          timestamp: new Date(),
          isAI: true,
          round: currentSceneRound + 1
        });
        
        // Add delay between responses for natural flow
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (error) {
        console.error(`Response generation failed for ${charName}:`, error);
      }
    }
    
    setKitchenConversations(prev => [...responses, ...prev]);
    setCurrentSceneRound(prev => prev + 1);
  } finally {
    setIsGeneratingConversation(false);
  }
};


// continueScene function - extracted from TeamHeadquarters.tsx (lines 232-374)
export const continueScene = async (
  isGeneratingConversation: boolean,
  setIsGeneratingConversation: React.Dispatch<React.SetStateAction<boolean>>,
  currentSceneRound: number,
  setCurrentSceneRound: React.Dispatch<React.SetStateAction<number>>,
  kitchenConversations: KitchenConversation[],
  setKitchenConversations: React.Dispatch<React.SetStateAction<KitchenConversation[]>>,
  headquarters: any,
  availableCharacters: any[],
  calculateSleepingArrangement: (room: any, charName: string) => any,
  calculateRoomCapacity: (room: any) => number,
  kitchenChatService: any,
  usageService: any,
  setUsageStatus: React.Dispatch<React.SetStateAction<any>>,
  PromptTemplateService: any
) => {
  if (isGeneratingConversation) return;
  
  setIsGeneratingConversation(true);
  setCurrentSceneRound(prev => prev + 1);
  
  try {
    const newRound = currentSceneRound + 1;
    let trigger = '';
    let participants: string[] = [];
    const allRoommates = availableCharacters.map(c => c.id);
    
    if (newRound <= 3) {
      // Non-sequential response selection
      const lastParticipants = [...new Set(kitchenConversations.slice(0, 3).map(c => c.speaker))];
      const availableResponders = allRoommates.filter(name => {
        const char = availableCharacters.find(c => c.id === name);
        return char && lastParticipants.includes(char.name.split(' ')[0]);
      });
      
      // Randomly select 1-2 characters (non-sequential)
      const numResponders = Math.min(Math.random() > 0.5 ? 2 : 1, availableResponders.length);
      participants = availableResponders.sort(() => Math.random() - 0.5).slice(0, numResponders);
      
      const lastMessage = kitchenConversations[0];
      trigger = `Someone responds to ${lastMessage.speaker}'s comment: "${lastMessage.message}". Keep the conversation natural and build on what was said.`;
    } else if (newRound <= 6) {
      const currentParticipants = [...new Set(kitchenConversations.map(c => c.speaker))];
      const availableNewChars = allRoommates.filter(name => {
        const char = availableCharacters.find(c => c.id === name);
        return char && !currentParticipants.includes(char.name.split(' ')[0]);
      });
      
      if (availableNewChars.length > 0) {
        // Random selection of new character
        participants = [availableNewChars[Math.floor(Math.random() * availableNewChars.length)]];
        trigger = `${availableCharacters.find(c => c.id === participants[0])?.name.split(' ')[0]} walks into the kitchen and reacts to what's happening`;
      } else {
        // Random selection from all characters
        participants = allRoommates.sort(() => Math.random() - 0.5).slice(0, 2);
        trigger = 'The conversation takes a new turn';
      }
    } else {
      participants = PromptTemplateService.selectSceneParticipants(allRoommates, 2);
      const chaosEvents = [
        'Coach suddenly walks in and interrupts',
        'The fire alarm starts going off',
        'There is a loud crash from another room',
        'Someone spills something all over the floor'
      ];
      trigger = chaosEvents[Math.floor(Math.random() * chaosEvents.length)];
    }
    
    const newConversations = [];
    
    for (const charName of participants) {
      const character = availableCharacters.find(c => c.id === charName);
      if (!character) continue;
      
      // Calculate sleeping arrangement for this character
      const room = headquarters.rooms.find(r => r.assignedCharacters.includes(charName)) || headquarters.rooms[0];
      const sleepingArrangement = calculateSleepingArrangement(room, charName);
      const roomCapacity = calculateRoomCapacity(room);
      const isOvercrowded = room.assignedCharacters.length > roomCapacity;
      
      const context = {
        character,
        teammates: availableCharacters.filter(c => 
          allRoommates.includes(c.id) && c.id !== charName
        ),
        coachName: 'Coach',
        livingConditions: {
          apartmentTier: headquarters.currentTier,
          roomTheme: room.theme,
          sleepsOnCouch: sleepingArrangement.sleepsOnCouch,
          sleepsOnFloor: sleepingArrangement.sleepsOnFloor,
          sleepsInBed: sleepingArrangement.sleepsInBed,
          bedType: sleepingArrangement.bedType,
          comfortBonus: sleepingArrangement.comfortBonus,
          sleepsUnderTable: charName === 'dracula' && headquarters.currentTier === 'spartan_apartment',
          roomOvercrowded: isOvercrowded,
          floorSleeperCount: Math.max(0, room.assignedCharacters.length - roomCapacity),
          roommateCount: room.assignedCharacters.length
        },
        recentEvents: kitchenConversations.slice(0, 3).map(c => `${c.speaker}: ${c.message}`)
      };
      
      try {
        // Enhanced context with conversation history
        const conversationHistory = kitchenConversations.slice(0, 5).map(c => `${c.speaker}: ${c.message}`).join('\n');
        const enhancedContext = {
          ...context,
          conversationHistory,
          recentEvents: [trigger, ...context.recentEvents]
        };
        
        const response = await kitchenChatService.generateKitchenConversation(enhancedContext, trigger);
        
        // Duplicate detection to prevent repetitive responses
        const recentMessages = kitchenConversations.slice(0, 3).map(c => c.message.toLowerCase());
        const isUnique = response && response.length > 10 && 
          !recentMessages.some(msg => {
            const similarity = msg.includes(response.toLowerCase().substring(0, 15)) || 
                             response.toLowerCase().includes(msg.substring(0, 15));
            return similarity;
          });
        
        if (isUnique) {
          newConversations.push({
            id: `scene${newRound}_${Date.now()}_${charName}`,
            avatar: character.avatar,
            speaker: character.name.split(' ')[0],
            message: response,
            isComplaint: response.includes('!') || response.toLowerCase().includes('annoying'),
            timestamp: new Date(),
            isAI: true,
            round: newRound
          });
        }
      } catch (error) {
        console.error(`Failed to continue scene for ${charName}:`, error);
        if (error instanceof Error && error.message === 'USAGE_LIMIT_REACHED') {
          // Stop trying more characters and refresh usage status
          const loadUsageStatus = async () => {
            try {
              const status = await usageService.getUserUsageStatus();
              setUsageStatus(status);
            } catch (error) {
              console.error('Failed to refresh usage status:', error);
            }
          };
          loadUsageStatus();
          break; // Stop generating more conversations
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setKitchenConversations(prev => [...newConversations, ...prev].slice(0, 25));
  } finally {
    setIsGeneratingConversation(false);
  }
};