import { useCallback, useEffect } from 'react';
import { TeamCharacter } from '@/data/teamBattleSystem';
import { generateAIResponse } from '@/utils/aiChatResponses';
import { formatCharacterName } from '@/utils/characterUtils';
import { type BattleStateData } from '@/hooks/temp/useBattleState';

interface UseBattleChatProps {
  state: BattleStateData;
  actions: {
    setChatMessages: (messages: string[]) => void;
    addChatMessage: (message: string) => void;
    setCustomMessage: (message: string) => void;
    setIsCharacterTyping: (typing: boolean) => void;
    setSelectedChatCharacter: (character: TeamCharacter) => void;
  };
  wsSocket: any; // WebSocket connection from useBattleWebSocket
  timeoutManager: {
    setTimeout: (cb: () => void, delay: number) => any;
    clearTimeout: (id: any) => void;
  };
}

export const useBattleChat = ({ 
  state, 
  actions, 
  wsSocket, 
  timeoutManager 
}: UseBattleChatProps) => {
  const { setTimeout: safeSetTimeout } = timeoutManager;

  // Set up WebSocket chat listeners (only once)
  useEffect(() => {
    if (wsSocket) {
      const handleChatResponse = (data: any) => {
        const formattedMessage = `${formatCharacterName(data.character)}: ${data.message}`;
        actions.addChatMessage(formattedMessage);
      };

      // Set up listener
      wsSocket.on('chat_response', handleChatResponse);

      // Cleanup listener on unmount or socket change
      return () => {
        wsSocket.off('chat_response', handleChatResponse);
      };
    }
  }, [wsSocket]);

  // Send custom message - FIXED: No longer creates new socket connections
  const handleCustomMessage = useCallback(async () => {
    if (!state.customMessage.trim() || !state.selectedChatCharacter) return;

    const messageToSend = state.customMessage.trim();
    actions.setCustomMessage(''); // Clear input
    actions.setIsCharacterTyping(true);

    try {
      // Add user message to chat
      const userMessage = `You: ${messageToSend}`;
      actions.addChatMessage(userMessage);

      // Simulate thinking delay for realism
      await new Promise(resolve => safeSetTimeout(resolve, 1000 + Math.random() * 1500));
      
      // FIXED: Use existing WebSocket connection instead of creating new ones
      if (wsSocket) {
        wsSocket.emit('chat_message', {
          message: messageToSend,
          character: state.selectedChatCharacter.name.toLowerCase().replace(/\s+/g, '_'),
          characterData: {
            name: state.selectedChatCharacter.name,
            battlePersonality: state.selectedChatCharacter.battlePersonality,
            health: state.selectedChatCharacter.health,
            maxHealth: state.selectedChatCharacter.maxHealth,
            battlePhase: state.phase
          }
        });
      } else {
        // Fallback to local AI response if WebSocket is not available
        await generateLocalAIResponse(messageToSend);
      }
      
    } catch (error) {
      console.error('Error sending chat message:', error);
      actions.addChatMessage('Error: Could not send message. Please try again.');
    } finally {
      actions.setIsCharacterTyping(false);
    }
  }, [state.customMessage, state.selectedChatCharacter, state.phase, wsSocket]);

  // Generate local AI response as fallback
  const generateLocalAIResponse = useCallback(async (userMessage: string) => {
    try {
      const response = await generateAIResponse(
        userMessage,
        state.selectedChatCharacter,
        {
          battlePhase: state.phase,
          currentRound: state.currentRound,
          playerMorale: state.playerMorale,
          recentMessages: state.chatMessages.slice(-5) // Last 5 messages for context
        }
      );

      const aiMessage = `${formatCharacterName(state.selectedChatCharacter.name)}: ${response}`;
      actions.addChatMessage(aiMessage);
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = `${formatCharacterName(state.selectedChatCharacter.name)}: *seems distracted and doesn't respond*`;
      actions.addChatMessage(errorMessage);
    }
  }, [state.selectedChatCharacter, state.phase, state.currentRound, state.playerMorale, state.chatMessages]);

  // Quick chat presets for common interactions
  const sendQuickMessage = useCallback(async (messageType: 'motivation' | 'strategy' | 'taunt' | 'encouragement') => {
    const quickMessages = {
      motivation: "Stay focused! We can do this!",
      strategy: "What's our game plan for this round?",
      taunt: "Is that the best you've got?",
      encouragement: "Great job out there! Keep it up!"
    };

    const message = quickMessages[messageType];
    actions.setCustomMessage(message);
    await handleCustomMessage();
  }, [handleCustomMessage]);

  // Change chat character
  const selectChatCharacter = useCallback((character: TeamCharacter) => {
    actions.setSelectedChatCharacter(character);
    const selectionMessage = `Now chatting with ${formatCharacterName(character.name)}`;
    actions.addChatMessage(selectionMessage);
  }, []);

  // Clear chat history
  const clearChatHistory = useCallback(() => {
    actions.setChatMessages([]);
  }, []);

  // Auto-generate team banter during battle phases
  const generateTeamBanter = useCallback(async (trigger: 'round_start' | 'victory' | 'defeat' | 'critical_hit') => {
    if (state.chatMessages.length > 20) return; // Don't spam if chat is already busy

    try {
      const randomCharacter = state.playerTeam.characters[Math.floor(Math.random() * state.playerTeam.characters.length)];
      
      const banterPrompts = {
        round_start: "Let's show them what we're made of!",
        victory: "Yes! That's how it's done!",
        defeat: "Don't worry, we'll get them next time.",
        critical_hit: "Did you see that move?!"
      };

      const response = await generateAIResponse(
        banterPrompts[trigger],
        randomCharacter,
        {
          battlePhase: state.phase,
          currentRound: state.currentRound,
          playerMorale: state.playerMorale,
          isAutoBanter: true
        }
      );

      const banterMessage = `${formatCharacterName(randomCharacter.name)}: ${response}`;
      actions.addChatMessage(banterMessage);
      
    } catch (error) {
      console.error('Error generating team banter:', error);
    }
  }, [state.playerTeam, state.phase, state.currentRound, state.playerMorale, state.chatMessages.length]);

  // Get chat statistics
  const getChatStats = useCallback(() => {
    const totalMessages = state.chatMessages.length;
    const userMessages = state.chatMessages.filter(msg => msg.startsWith('You:')).length;
    const characterMessages = totalMessages - userMessages;
    
    return {
      totalMessages,
      userMessages,
      characterMessages,
      selectedCharacterName: state.selectedChatCharacter?.name || 'None'
    };
  }, [state.chatMessages, state.selectedChatCharacter]);

  return {
    // Core chat functions
    handleCustomMessage,
    sendQuickMessage,
    selectChatCharacter,
    clearChatHistory,
    generateTeamBanter,
    generateLocalAIResponse,
    
    // Chat state accessors
    getChatStats,
    
    // Computed values
    canSendMessage: state.customMessage.trim().length > 0 && !state.isCharacterTyping,
    isTyping: state.isCharacterTyping,
    chatHistory: state.chatMessages,
    currentMessage: state.customMessage,
    selectedCharacter: state.selectedChatCharacter,
    availableCharacters: state.playerTeam.characters
  };
};