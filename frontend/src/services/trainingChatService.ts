import { io, Socket } from 'socket.io-client';
import { Character } from '../data/characters';
import { PromptTemplateService } from './promptTemplateService';

interface TrainingChatContext {
  character: Character;
  teammates: Character[];
  coachName: string;
  trainingEnvironment: {
    facilityTier: string;
    equipment: string[];
    currentActivity?: string;
    energyLevel: number;
    trainingProgress: number;
    trainingPhase?: string;
    sessionDuration?: number;
  };
  recentTrainingEvents: string[];
}

interface TrainingConversation {
  id: string;
  initiator: string;
  topic: string;
  responses: {
    characterId: string;
    message: string;
    timestamp: Date;
  }[];
}

export class TrainingChatService {
  private socket: Socket | null = null;
  private activeConversations: Map<string, TrainingConversation> = new Map();

  // Expose socket for debugging
  get socketConnection() {
    return this.socket;
  }

  constructor() {
    // Only initialize socket on client side
    if (typeof window !== 'undefined') {
      this.initializeSocket();
    }
  }

  private initializeSocket() {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Determine backend URL based on environment
    let socketUrl: string;
    
    // Check if we're running locally (either in dev or local production build)
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      // Local development or local production build
      socketUrl = 'http://localhost:3006';
    } else {
      // Deployed production
      socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://www.blankwars.com:3006';
    }
    
    console.log('🏋️ Training Chat Service initializing with URL:', socketUrl);
    console.log('🏋️ NODE_ENV:', process.env.NODE_ENV);
    console.log('🏋️ Window location:', window.location.href);
    console.log('🏋️ Is localhost?:', window.location.hostname === 'localhost');
    
    try {
      console.log('🔌 Attempting to connect to:', socketUrl);
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        autoConnect: true,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('🏋️ Training chat connected to backend at:', socketUrl);
        console.log('🔗 Socket ID:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('🏋️ Training chat disconnected from backend');
      });

      this.socket.on('training_chat_response', (data) => {
        console.log('🏋️ Received multi-agent training chat response:', data);
        this.handleMultiAgentTrainingChatResponse(data);
      });

      this.socket.on('connect_error', (error) => {
        console.error('🏋️ Training chat connection error:', error);
        console.error('🏋️ Failed to connect to:', socketUrl);
        console.error('🏋️ Error details:', error.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🏋️ Training chat disconnected:', reason);
      });

    } catch (error) {
      console.error('🏋️ Failed to initialize training chat socket:', error);
    }
  }

  private handleMultiAgentTrainingChatResponse(data: any) {
    const { conversationId, multiAgentResponse, characterResponse, error } = data;
    
    if (error) {
      console.error('🏋️ Training chat error:', error);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trainingChatUpdate', {
          detail: { conversationId, error }
        }));
      }
      return;
    }
    
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) return;

    let agents: any[] = [];

    // Handle new multi-agent response format
    if (multiAgentResponse?.agents) {
      agents = multiAgentResponse.agents;
    }
    // Handle old single character response format for backward compatibility
    else if (characterResponse) {
      agents = [{
        agentType: 'character',
        agentName: characterResponse.characterId || 'Character',
        message: characterResponse.message,
        timestamp: characterResponse.timestamp
      }];
    }

    // Add all agent responses to conversation
    agents.forEach((agent: any) => {
      conversation.responses.push({
        characterId: agent.agentType,
        agentType: agent.agentType,
        agentName: agent.agentName,
        message: agent.message,
        timestamp: new Date(agent.timestamp)
      });
    });
    
    // Emit event for UI to update with multi-agent data
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trainingChatUpdate', {
        detail: { 
          conversationId, 
          conversation,
          multiAgentResponse: agents
        }
      }));
    }
  }

  async startTrainingConversation(
    character: Character,
    context: TrainingChatContext,
    userMessage: string,
    isCharacterSelection: boolean = false
  ): Promise<Array<{agentType: string; agentName: string; message: string}>> {
    if (!this.socket?.connected) {
      throw new Error('Training chat service not connected');
    }

    const conversationId = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const requestData = {
      conversationId,
      characterId: character.id,
      characterName: character.name,
      userMessage,
      trainingPhase: context.trainingEnvironment.trainingPhase || 'planning',
      currentActivity: context.trainingEnvironment.currentActivity,
      energyLevel: context.trainingEnvironment.energyLevel,
      trainingProgress: context.trainingEnvironment.trainingProgress,
      sessionDuration: context.trainingEnvironment.sessionDuration || 0,
      isCharacterSelection
    };

    console.log('🏋️ Sending multi-agent training chat request:', {
      conversationId,
      characterName: character.name,
      trainingPhase: requestData.trainingPhase,
      isCharacterSelection,
      userMessage: userMessage.substring(0, 50) + '...'
    });

    // Store conversation
    this.activeConversations.set(conversationId, {
      id: conversationId,
      initiator: context.coachName,
      topic: userMessage.substring(0, 30) + '...',
      responses: []
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Multi-agent training chat request timed out'));
      }, 20000); // Longer timeout for multiple AI calls

      const handleResponse = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail.conversationId === conversationId) {
          clearTimeout(timeout);
          window.removeEventListener('trainingChatUpdate', handleResponse);
          
          if (customEvent.detail.error) {
            reject(new Error(customEvent.detail.error));
            return;
          }
          
          // Return all agent responses
          const agentResponses = customEvent.detail.multiAgentResponse || [];
          resolve(agentResponses);
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('trainingChatUpdate', handleResponse);
      }

      this.socket!.emit('training_chat_request', requestData);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Training-specific prompt template service
class TrainingPromptTemplateService {
  
  // Training facility templates
  private static FACILITY_TEMPLATES = {
    community: `TRAINING FACILITY: You're working out in a basic community gym with limited, old equipment. The weights are mismatched, some machines are broken, and it's always crowded. You're making do with what's available, but it's frustrating compared to what a warrior of your caliber deserves.`,
    
    premium: `TRAINING FACILITY: You have access to a well-equipped premium gym with modern equipment, proper weights, and good facilities. The environment is professional and you can focus on serious training. This is more befitting your status as a legendary fighter.`,
    
    elite: `TRAINING FACILITY: You train in an elite facility with cutting-edge equipment, specialized training areas, and everything you could want. The facility rivals the best training grounds from your era, adapted with modern technology. You can push your limits here.`
  };

  // Training context templates
  private static TRAINING_CONTEXT_TEMPLATE = `
CURRENT TRAINING SITUATION:
- Current Activity: {currentActivity}
- Energy Level: {energyLevel}% (affects your mood and responses)
- Available Equipment: {equipment}
- Training Progress Today: {trainingProgress}%

TRAINING MINDSET: You are focused on physical improvement and combat preparation. All conversations should relate to training, workout techniques, combat strategies, physical conditioning, or mental preparation for battle. Stay in character but keep discussions centered around fitness, training methods, and warrior preparation.`;

  // Character core template for training
  private static TRAINING_CHARACTER_TEMPLATE = `
CHARACTER IDENTITY: You are {name} ({title}) from {historicalPeriod}. You have been transported into a fighting league where you must train with modern equipment and methods while maintaining your fighting traditions and personality.

PERSONALITY CORE:
- Traits: {traits}
- Speech Style: {speechStyle}
- Motivations: {motivations}
- Fears: {fears}
- Archetype: {archetype}

TRAINING PHILOSOPHY: Based on your background and personality, you have specific views on training, combat preparation, and physical conditioning. Discuss training from your character's perspective, comparing modern methods to your traditional approaches when relevant.`;

  // Team training context
  private static TEAM_TRAINING_TEMPLATE = `
CURRENT TRAINING TEAM: {teammates}
COACH: {coachName} (your coach who guides training and strategy)

TEAM TRAINING DYNAMICS: You're training alongside diverse fighters from different eras and backgrounds. Some training methods clash with your traditions, others complement them. Consider your relationships with specific teammates when discussing training approaches.`;

  static generateTrainingPrompt(context: {
    character: {
      name: string;
      title: string;
      personality: any;
      historicalPeriod?: string;
      mythology?: string;
      archetype: string;
    };
    facilityTier: string;
    teammates: string[];
    coachName: string;
    trainingContext: {
      currentActivity?: string;
      energyLevel: number;
      equipment: string[];
      trainingProgress: number;
    };
    userMessage: string;
    recentEvents: string[];
  }): string {
    
    const facilityTemplate = this.FACILITY_TEMPLATES[context.facilityTier as keyof typeof this.FACILITY_TEMPLATES] || this.FACILITY_TEMPLATES.community;
    
    const characterTemplate = this.TRAINING_CHARACTER_TEMPLATE
      .replace('{name}', context.character.name)
      .replace('{title}', context.character.title)
      .replace('{historicalPeriod}', context.character.historicalPeriod || 'Unknown Era')
      .replace('{traits}', context.character.personality?.traits?.join(', ') || 'Unknown')
      .replace('{speechStyle}', context.character.personality?.speechStyle || 'Direct')
      .replace('{motivations}', context.character.personality?.motivations?.join(', ') || 'Victory')
      .replace('{fears}', context.character.personality?.fears?.join(', ') || 'Defeat')
      .replace('{archetype}', context.character.archetype);

    const teamTemplate = this.TEAM_TRAINING_TEMPLATE
      .replace('{teammates}', context.teammates.join(', '))
      .replace('{coachName}', context.coachName);

    const trainingContextTemplate = this.TRAINING_CONTEXT_TEMPLATE
      .replace('{currentActivity}', context.trainingContext.currentActivity || 'Free training')
      .replace('{energyLevel}', context.trainingContext.energyLevel.toString())
      .replace('{equipment}', context.trainingContext.equipment.join(', ') || 'Basic gym equipment')
      .replace('{trainingProgress}', context.trainingContext.trainingProgress.toString());

    const recentEventsText = context.recentEvents.length > 0 
      ? `\nRECENT TRAINING EVENTS: ${context.recentEvents.join('; ')}`
      : '';

    return `${characterTemplate}

${facilityTemplate}

${teamTemplate}

${trainingContextTemplate}${recentEventsText}

CONVERSATION GUIDELINES:
- Stay in character with your personality and speech style
- Keep all responses focused on training, workouts, combat preparation, or physical conditioning
- React to the coach's message: "${context.userMessage}"
- Respond as if you're in the middle of or just finished a training session
- Reference your energy level and current training state in your response
- Keep responses conversational but focused on training topics
- Limit response to 1-2 sentences for natural conversation flow

Your response:`;
  }
}

export const trainingChatService = new TrainingChatService();