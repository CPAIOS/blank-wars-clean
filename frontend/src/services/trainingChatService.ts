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
    
    try {
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('🏋️ Training chat connected to backend');
      });

      this.socket.on('disconnect', () => {
        console.log('🏋️ Training chat disconnected from backend');
      });

      this.socket.on('training_chat_response', (data) => {
        console.log('🏋️ Received training chat response:', data);
        this.handleTrainingChatResponse(data);
      });

      this.socket.on('connect_error', (error) => {
        console.error('🏋️ Training chat connection error:', error);
      });

    } catch (error) {
      console.error('🏋️ Failed to initialize training chat socket:', error);
    }
  }

  private handleTrainingChatResponse(data: any) {
    const { conversationId, characterResponse } = data;
    
    const conversation = this.activeConversations.get(conversationId);
    if (conversation) {
      conversation.responses.push({
        characterId: characterResponse.characterId,
        message: characterResponse.message,
        timestamp: new Date()
      });
      
      // Emit event for UI to update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trainingChatUpdate', {
          detail: { conversationId, conversation }
        }));
      }
    }
  }

  async startTrainingConversation(
    character: Character,
    context: TrainingChatContext,
    userMessage: string
  ): Promise<string> {
    if (!this.socket?.connected) {
      throw new Error('Training chat service not connected');
    }

    const conversationId = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate training-specific prompt
    const prompt = TrainingPromptTemplateService.generateTrainingPrompt({
      character: {
        name: character.name,
        title: character.title || '',
        personality: character.personality,
        historicalPeriod: character.historicalPeriod,
        mythology: character.mythology,
        archetype: character.archetype
      },
      facilityTier: context.trainingEnvironment.facilityTier,
      teammates: context.teammates.map(t => t.name),
      coachName: context.coachName,
      trainingContext: {
        currentActivity: context.trainingEnvironment.currentActivity,
        energyLevel: context.trainingEnvironment.energyLevel,
        equipment: context.trainingEnvironment.equipment,
        trainingProgress: context.trainingEnvironment.trainingProgress
      },
      userMessage,
      recentEvents: context.recentTrainingEvents
    });

    const requestData = {
      conversationId,
      characterId: character.id,
      characterName: character.name,
      prompt,
      userMessage,
      maxTokens: 150
    };

    console.log('🏋️ Sending training chat request:', {
      conversationId,
      characterName: character.name,
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
        reject(new Error('Training chat request timed out'));
      }, 15000);

      const handleResponse = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail.conversationId === conversationId) {
          clearTimeout(timeout);
          window.removeEventListener('trainingChatUpdate', handleResponse);
          
          const response = customEvent.detail.conversation.responses[0];
          resolve(response?.message || 'No response received');
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