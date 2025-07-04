import { io, Socket } from 'socket.io-client';
import { Character } from '../data/characters';
import { PromptTemplateService } from './promptTemplateService';

interface KitchenChatContext {
  character: Character;
  teammates: Character[];
  coachName: string;
  livingConditions: {
    apartmentTier: string;
    roomTheme: string | null;
    sleepsOnCouch: boolean;
    sleepsUnderTable: boolean;
  };
  recentEvents: string[];
}

interface KitchenConversation {
  id: string;
  initiator: string;
  trigger: string;
  responses: {
    characterId: string;
    message: string;
    timestamp: Date;
  }[];
}

export class KitchenChatService {
  private socket: Socket | null = null;
  private activeConversations: Map<string, KitchenConversation> = new Map();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_BACKEND_URL 
      : 'http://localhost:3006';
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Kitchen Chat Service connected to:', socketUrl, 'with ID:', this.socket?.id);
    });

    this.socket.on('kitchen_conversation_response', (data) => {
      this.handleConversationResponse(data);
    });
  }

  /**
   * Generate AI-powered kitchen conversation
   */
  async generateKitchenConversation(
    context: KitchenChatContext,
    trigger: string
  ): Promise<string> {
    const prompt = this.buildCharacterKitchenPrompt(context, trigger);
    
    console.log('🎭 Kitchen Chat Request:', {
      character: context.character.name,
      socketConnected: this.socket?.connected,
      socketId: this.socket?.id
    });
    
    if (!this.socket?.connected) {
      console.warn('Socket not connected, using fallback');
      return this.getFallbackResponse(context.character, trigger);
    }

    return new Promise((resolve, reject) => {
      const conversationId = `kitchen_${Date.now()}_${context.character.id}`;
      
      // Send request to backend
      console.log('📤 Sending kitchen chat request:', conversationId);
      this.socket!.emit('kitchen_chat_request', {
        conversationId,
        characterId: context.character.id,
        prompt,
        trigger,
        context: {
          teammates: context.teammates.map(t => t.name),
          coach: context.coachName,
          livingConditions: context.livingConditions
        }
      });

      // Set timeout for response
      const timeout = setTimeout(() => {
        console.warn('⏰ Kitchen chat timeout for:', conversationId);
        reject(new Error('Kitchen chat timeout'));
      }, 30000);

      // Listen for response
      const responseHandler = (data: any) => {
        console.log('📥 Received kitchen response:', data);
        if (data.conversationId === conversationId) {
          clearTimeout(timeout);
          this.socket!.off('kitchen_conversation_response', responseHandler);
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.message || this.getFallbackResponse(context.character, trigger));
          }
        }
      };

      this.socket!.on('kitchen_conversation_response', responseHandler);
    });
  }

  /**
   * Build character-specific prompt using modular template system
   */
  private buildCharacterKitchenPrompt(context: KitchenChatContext, trigger: string): string {
    const { character, teammates, coachName, livingConditions } = context;
    
    // Determine scene type based on trigger content
    let sceneType: 'mundane' | 'conflict' | 'chaos' = 'mundane';
    if (trigger.toLowerCase().includes('argument') || trigger.toLowerCase().includes('fight') || 
        trigger.toLowerCase().includes('angry') || trigger.toLowerCase().includes('conflict')) {
      sceneType = 'conflict';
    } else if (trigger.toLowerCase().includes('emergency') || trigger.toLowerCase().includes('chaos') ||
               trigger.toLowerCase().includes('alarm') || trigger.toLowerCase().includes('broke')) {
      sceneType = 'chaos';
    }
    
    // Build the prompt context
    const promptContext = {
      character: {
        name: character.name,
        title: character.title || '',
        personality: character.personality,
        historicalPeriod: character.historicalPeriod,
        mythology: character.mythology
      },
      hqTier: livingConditions.apartmentTier,
      roommates: teammates.map(t => t.name),
      coachName,
      sceneType,
      trigger,
      timeOfDay: PromptTemplateService.selectTimeOfDay()
    };
    
    return PromptTemplateService.generatePrompt(promptContext);
  }

  /**
   * Generate conversation triggers based on daily activities
   */
  generateDailyTriggers(apartmentTier: string): string[] {
    const baseTriggers = [
      'Morning coffee brewing (loud noises)',
      'Someone cooking breakfast',
      'Bathroom queue forming',
      'TV remote argument',
      'Thermostat disagreement',
      'Loud phone conversation',
      'Exercise routine in common area',
      'Late night snacking',
      'Alarm clocks going off',
      'Shower time disputes'
    ];

    if (apartmentTier === 'spartan_apartment') {
      return [
        ...baseTriggers,
        'Tripping over coffin under table',
        'Fighting for counter space',
        'Bunk bed disputes',
        'Only one bathroom crisis',
        'Thin walls complaints',
        'Space heater battles'
      ];
    }

    return baseTriggers;
  }

  /**
   * Generate character interactions based on personality conflicts
   */
  generatePersonalityConflicts(characters: Character[]): Array<{trigger: string, involved: string[]}> {
    const conflicts = [];
    
    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        const char1 = characters[i];
        const char2 = characters[j];
        
        // Generate specific conflicts based on personality traits
        if (char1.personality.traits.includes('Analytical') && char2.personality.traits.includes('Aggressive')) {
          conflicts.push({
            trigger: `${char1.name} is analyzing ${char2.name}'s behavior patterns out loud`,
            involved: [char1.id, char2.id]
          });
        }
        
        if (char1.name.includes('Dracula') && char2.personality.traits.includes('Charismatic')) {
          conflicts.push({
            trigger: `${char2.name} is being very social during ${char1.name}'s sleep time`,
            involved: [char1.id, char2.id]
          });
        }
        
        if (char1.personality.traits.includes('Honorable') && char2.personality.traits.includes('Eccentric')) {
          conflicts.push({
            trigger: `${char2.name}'s unusual habits are disrupting ${char1.name}'s sense of order`,
            involved: [char1.id, char2.id]
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Fallback responses for when AI is unavailable
   */
  private getFallbackResponse(character: Character, trigger: string): string {
    const fallbacks = {
      'Achilles': [
        "A warrior adapts to any battlefield... even this cramped apartment.",
        "By Zeus! These living conditions test even my legendary patience!",
        "In Troy, we had better accommodations than this!"
      ],
      'Sherlock Holmes': [
        "I deduce that our living arrangements were designed by someone with a twisted sense of humor.",
        "Elementary - the coach clearly prioritizes their own comfort over team morale.",
        "These circumstances require... creative problem-solving."
      ],
      'Count Dracula': [
        "This modern torture is worse than any wooden stake!",
        "Mortals and their infernal noise during my rest hours...",
        "When I find who designed this accommodation..."
      ],
      'Cleopatra VII': [
        "A pharaoh should not endure such... humble circumstances.",
        "In Alexandria, servants would be flogged for less comfortable quarters.",
        "This is beneath the dignity of Egyptian royalty!"
      ]
    };

    const characterFallbacks = fallbacks[character.name as keyof typeof fallbacks] || [
      "This situation is... challenging.",
      "I never expected to find myself in such circumstances.",
      "We must make the best of this arrangement."
    ];

    return characterFallbacks[Math.floor(Math.random() * characterFallbacks.length)];
  }

  /**
   * Handle conversation responses from backend
   */
  private handleConversationResponse(data: any) {
    const conversation = this.activeConversations.get(data.conversationId);
    if (conversation) {
      conversation.responses.push({
        characterId: data.characterId,
        message: data.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get conversation history for context
   */
  getConversationHistory(limit: number = 10): KitchenConversation[] {
    return Array.from(this.activeConversations.values())
      .sort((a, b) => b.responses[0]?.timestamp.getTime() - a.responses[0]?.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Cleanup old conversations
   */
  cleanupOldConversations() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [id, conversation] of this.activeConversations.entries()) {
      const lastResponse = conversation.responses[conversation.responses.length - 1];
      if (lastResponse && now - lastResponse.timestamp.getTime() > maxAge) {
        this.activeConversations.delete(id);
      }
    }
  }

  /**
   * Wait for socket connection
   */
  async waitForConnection(timeout: number = 5000): Promise<boolean> {
    if (this.socket?.connected) return true;
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.socket?.connected) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, timeout);
    });
  }
  
  disconnect() {
    this.socket?.disconnect();
  }
}

// Export singleton instance
export const kitchenChatService = new KitchenChatService();