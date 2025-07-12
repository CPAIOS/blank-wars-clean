import { io, Socket } from 'socket.io-client';
import { Character } from '../data/characters';
import { ConflictData, TherapyContext, TherapistPromptStyle } from '@/services/ConflictDatabaseService';
import { TherapyPromptTemplateService } from './therapyPromptTemplateService';

interface TherapySession {
  id: string;
  type: 'individual' | 'group';
  therapistId: string;
  participantIds: string[];
  stage: 'initial' | 'resistance' | 'breakthrough';
  sessionHistory: TherapyMessage[];
  startTime: Date;
  context?: TherapyContext;
  groupDynamics?: string[];
}

interface TherapyMessage {
  id: string;
  sessionId: string;
  speakerId: string; // character ID or therapist ID
  speakerType: 'character' | 'therapist';
  message: string;
  timestamp: Date;
  messageType: 'response' | 'question' | 'intervention';
}

interface IndividualTherapyContext {
  character: Character;
  therapistId: string;
  therapyContext: TherapyContext;
  sessionStage: 'initial' | 'resistance' | 'breakthrough';
  previousMessages?: TherapyMessage[];
}

interface GroupTherapyContext {
  characters: Character[];
  therapistId: string;
  groupDynamics: string[];
  sessionStage: 'initial' | 'resistance' | 'breakthrough';
  previousMessages?: TherapyMessage[];
}

export class TherapyChatService {
  private socket: Socket | null = null;
  private activeSessions: Map<string, TherapySession> = new Map();
  private messageHandlers: Map<string, (message: TherapyMessage) => void> = new Map();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    let socketUrl: string;
    
    if (process.env.NODE_ENV === 'production') {
      socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://blank-wars-backend.railway.app';
    } else {
      socketUrl = 'http://localhost:3006';
    }
    
    console.log('🧠 Therapy Chat Service initializing with URL:', socketUrl);
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Therapy Chat Service connected to:', socketUrl, 'with ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Therapy Chat Service connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔌 Therapy Chat Service disconnected:', reason);
    });

    this.socket.on('therapy_session_response', (data) => {
      console.log('📥 Therapy session response received:', {
        sessionId: data.sessionId,
        speakerId: data.speakerId,
        hasMessage: !!data.message,
        hasError: !!data.error
      });
      this.handleTherapyResponse(data);
    });
  }

  /**
   * Start an individual therapy session
   */
  async startIndividualSession(context: IndividualTherapyContext): Promise<TherapySession> {
    const sessionId = `therapy_individual_${Date.now()}_${context.character.id}`;
    
    const session: TherapySession = {
      id: sessionId,
      type: 'individual',
      therapistId: context.therapistId,
      participantIds: [context.character.id],
      stage: context.sessionStage,
      sessionHistory: [],
      startTime: new Date(),
      context: context.therapyContext
    };

    this.activeSessions.set(sessionId, session);
    
    // Generate therapist opening question
    const openingQuestion = await this.generateTherapistQuestion(context);
    
    const therapistMessage: TherapyMessage = {
      id: `msg_${Date.now()}`,
      sessionId,
      speakerId: context.therapistId,
      speakerType: 'therapist',
      message: openingQuestion,
      timestamp: new Date(),
      messageType: 'question'
    };
    
    session.sessionHistory.push(therapistMessage);
    console.log('🧠 Individual therapy session started:', sessionId);
    
    return session;
  }

  /**
   * Start a group therapy session
   */
  async startGroupSession(context: GroupTherapyContext): Promise<TherapySession> {
    const sessionId = `therapy_group_${Date.now()}_${context.characters.map(c => c.id).join('_')}`;
    
    const session: TherapySession = {
      id: sessionId,
      type: 'group',
      therapistId: context.therapistId,
      participantIds: context.characters.map(c => c.id),
      stage: context.sessionStage,
      sessionHistory: [],
      startTime: new Date(),
      groupDynamics: context.groupDynamics
    };

    this.activeSessions.set(sessionId, session);
    
    // Generate therapist group opening question
    const openingQuestion = await this.generateGroupTherapistQuestion(context);
    
    const therapistMessage: TherapyMessage = {
      id: `msg_${Date.now()}`,
      sessionId,
      speakerId: context.therapistId,
      speakerType: 'therapist',
      message: openingQuestion,
      timestamp: new Date(),
      messageType: 'question'
    };
    
    session.sessionHistory.push(therapistMessage);
    console.log('🧠 Group therapy session started:', sessionId);
    
    return session;
  }

  /**
   * Generate character response in therapy session
   */
  async generateCharacterResponse(
    sessionId: string,
    characterId: string,
    trigger?: string
  ): Promise<string> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!this.socket?.connected) {
      throw new Error('Socket not connected to backend. Please refresh the page and try again.');
    }

    return new Promise((resolve, reject) => {
      const messageId = `therapy_char_${Date.now()}_${characterId}`;
      
      // Build character therapy prompt
      const prompt = this.buildCharacterTherapyPrompt(session, characterId, trigger);
      
      const requestData = {
        sessionId,
        messageId,
        characterId,
        prompt,
        trigger,
        sessionType: session.type,
        therapistId: session.therapistId,
        sessionStage: session.stage
      };
      
      console.log('📤 Sending therapy character request:', {
        sessionId,
        characterId,
        messageId,
        sessionType: session.type,
        promptLength: prompt.length
      });
      
      this.socket!.emit('therapy_character_request', requestData);

      const timeout = setTimeout(() => {
        console.warn('⏰ Therapy character response timeout for:', messageId);
        reject(new Error('Therapy response timeout'));
      }, 30000);

      const responseHandler = (data: any) => {
        if (data.messageId === messageId) {
          clearTimeout(timeout);
          this.socket!.off('therapy_session_response', responseHandler);
          if (data.error) {
            if (data.usageLimitReached) {
              reject(new Error('USAGE_LIMIT_REACHED'));
            } else {
              reject(new Error(data.error));
            }
          } else {
            // Add character message to session history
            const characterMessage: TherapyMessage = {
              id: messageId,
              sessionId,
              speakerId: characterId,
              speakerType: 'character',
              message: data.message || 'AI response unavailable',
              timestamp: new Date(),
              messageType: 'response'
            };
            
            session.sessionHistory.push(characterMessage);
            resolve(data.message || 'AI response unavailable');
          }
        }
      };

      this.socket!.on('therapy_session_response', responseHandler);
    });
  }

  /**
   * Generate therapist intervention or follow-up question
   */
  async generateTherapistIntervention(
    sessionId: string,
    interventionType: 'question' | 'intervention' = 'question'
  ): Promise<string> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!this.socket?.connected) {
      throw new Error('Socket not connected to backend. Please refresh the page and try again.');
    }

    return new Promise((resolve, reject) => {
      const messageId = `therapy_therapist_${Date.now()}_${session.therapistId}`;
      
      // Build therapist intervention prompt
      const prompt = this.buildTherapistInterventionPrompt(session, interventionType);
      
      const requestData = {
        sessionId,
        messageId,
        therapistId: session.therapistId,
        prompt,
        interventionType,
        sessionType: session.type,
        sessionStage: session.stage,
        sessionHistory: session.sessionHistory.slice(-6) // Last 6 messages for context
      };
      
      console.log('📤 Sending therapist intervention request:', {
        sessionId,
        therapistId: session.therapistId,
        interventionType,
        messageId
      });
      
      this.socket!.emit('therapy_therapist_request', requestData);

      const timeout = setTimeout(() => {
        console.warn('⏰ Therapist intervention timeout for:', messageId);
        reject(new Error('Therapist intervention timeout'));
      }, 30000);

      const responseHandler = (data: any) => {
        if (data.messageId === messageId) {
          clearTimeout(timeout);
          this.socket!.off('therapy_session_response', responseHandler);
          if (data.error) {
            reject(new Error(data.error));
          } else {
            // Add therapist message to session history
            const therapistMessage: TherapyMessage = {
              id: messageId,
              sessionId,
              speakerId: session.therapistId,
              speakerType: 'therapist',
              message: data.message || 'Therapist response unavailable',
              timestamp: new Date(),
              messageType: interventionType
            };
            
            session.sessionHistory.push(therapistMessage);
            resolve(data.message || 'Therapist response unavailable');
          }
        }
      };

      this.socket!.on('therapy_session_response', responseHandler);
    });
  }

  /**
   * Generate initial therapist question for individual therapy
   */
  private async generateTherapistQuestion(context: IndividualTherapyContext): Promise<string> {
    const prompt = TherapyPromptTemplateService.generateTherapistPrompt({
      therapistId: context.therapistId,
      sessionType: 'individual',
      character: context.character,
      therapyContext: context.therapyContext,
      sessionStage: context.sessionStage,
      isOpeningQuestion: true
    });

    // For now, return synchronously generated question
    // Later this could also be AI-generated for more variety
    return TherapyPromptTemplateService.generateOpeningQuestion(
      context.therapistId,
      context.therapyContext,
      context.sessionStage
    );
  }

  /**
   * Generate initial therapist question for group therapy
   */
  private async generateGroupTherapistQuestion(context: GroupTherapyContext): Promise<string> {
    return TherapyPromptTemplateService.generateGroupOpeningQuestion(
      context.therapistId,
      context.characters,
      context.groupDynamics,
      context.sessionStage
    );
  }

  /**
   * Build character-specific therapy prompt
   */
  private buildCharacterTherapyPrompt(session: TherapySession, characterId: string, trigger?: string): string {
    if (session.type === 'individual' && session.context) {
      return TherapyPromptTemplateService.generateIndividualTherapyPrompt({
        characterId,
        therapistId: session.therapistId,
        therapyContext: session.context,
        sessionStage: session.stage,
        sessionHistory: session.sessionHistory,
        trigger
      });
    } else if (session.type === 'group') {
      return TherapyPromptTemplateService.generateGroupTherapyPrompt({
        characterId,
        therapistId: session.therapistId,
        participantIds: session.participantIds,
        groupDynamics: session.groupDynamics || [],
        sessionStage: session.stage,
        sessionHistory: session.sessionHistory,
        trigger
      });
    }
    
    return 'Therapy session context unavailable';
  }

  /**
   * Build therapist intervention prompt
   */
  private buildTherapistInterventionPrompt(session: TherapySession, interventionType: 'question' | 'intervention'): string {
    return TherapyPromptTemplateService.generateTherapistInterventionPrompt({
      therapistId: session.therapistId,
      sessionType: session.type,
      sessionStage: session.stage,
      sessionHistory: session.sessionHistory,
      interventionType,
      therapyContext: session.context,
      groupDynamics: session.groupDynamics
    });
  }

  /**
   * Handle therapy responses from backend
   */
  private handleTherapyResponse(data: any) {
    const handler = this.messageHandlers.get(data.sessionId);
    if (handler && data.message) {
      const message: TherapyMessage = {
        id: data.messageId,
        sessionId: data.sessionId,
        speakerId: data.speakerId,
        speakerType: data.speakerType,
        message: data.message,
        timestamp: new Date(),
        messageType: data.messageType || 'response'
      };
      handler(message);
    }
  }

  /**
   * Subscribe to session messages
   */
  subscribeToSession(sessionId: string, handler: (message: TherapyMessage) => void) {
    this.messageHandlers.set(sessionId, handler);
  }

  /**
   * Unsubscribe from session messages
   */
  unsubscribeFromSession(sessionId: string) {
    this.messageHandlers.delete(sessionId);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): TherapySession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * End therapy session
   */
  endSession(sessionId: string) {
    this.activeSessions.delete(sessionId);
    this.messageHandlers.delete(sessionId);
    console.log('🧠 Therapy session ended:', sessionId);
  }

  /**
   * Advance session stage
   */
  advanceSessionStage(sessionId: string): 'initial' | 'resistance' | 'breakthrough' {
    const session = this.activeSessions.get(sessionId);
    if (!session) return 'initial';

    if (session.stage === 'initial') {
      session.stage = 'resistance';
    } else if (session.stage === 'resistance') {
      session.stage = 'breakthrough';
    }
    
    return session.stage;
  }

  /**
   * Get conversation history for session
   */
  getSessionHistory(sessionId: string, limit: number = 20): TherapyMessage[] {
    const session = this.activeSessions.get(sessionId);
    if (!session) return [];
    
    return session.sessionHistory
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-limit);
  }

  /**
   * Wait for socket connection
   */
  async waitForConnection(timeout: number = 5000): Promise<boolean> {
    if (this.socket?.connected) {
      return true;
    }
    
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = timeout / 100;
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (this.socket?.connected) {
          clearInterval(checkInterval);
          resolve(true);
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

// Export singleton instance
export const therapyChatService = new TherapyChatService();