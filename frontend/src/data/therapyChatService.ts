import { io, Socket } from 'socket.io-client';
import { Character } from '../data/characters';
import { ConflictData, TherapyContext, TherapistPromptStyle } from '@/services/ConflictDatabaseService';
import ConflictDatabaseService from '../services/ConflictDatabaseService';
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

    this.socket.on('chat_response', (data) => {
      console.log('📥 Therapy session global response received:', {
        hasMessage: !!data.message,
        hasError: !!data.error
      });
      // Individual response handlers now handle their own responses
    });

    this.socket.on('chat_error', (error) => {
      console.error('❌ Therapy session error:', error);
    });
  }

  /**
   * Start an individual therapy session
   */
  async startIndividualSession(characterId: string, therapistId: string): Promise<TherapySession> {
    const sessionId = `therapy_individual_${Date.now()}_${characterId}`;
    
    const session: TherapySession = {
      id: sessionId,
      type: 'individual',
      therapistId: therapistId,
      participantIds: [characterId],
      stage: 'initial',
      sessionHistory: [],
      startTime: new Date(),
      context: undefined // Will be populated with real conflict data by the dual API
    };

    this.activeSessions.set(sessionId, session);
    
    // Generate opening question using real API (automatically adds to session history)
    await this.generateTherapistQuestion(sessionId);
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
   * Generate therapist question in individual therapy (Step 1 of dual API)
   */
  async generateTherapistQuestion(sessionId: string): Promise<string> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!this.socket?.connected) {
      throw new Error('Socket not connected to backend. Please refresh the page and try again.');
    }

    return new Promise((resolve, reject) => {
      const messageId = `therapy_therapist_${Date.now()}_${session.therapistId}`;
      
      const therapistPrompt = this.buildTherapistPrompt(session);
      
      const requestData = {
        message: 'Generate therapeutic question',
        character: session.therapistId,
        characterData: {
          name: 'Therapist',
          personality: {
            traits: ['empathetic', 'insightful', 'professional'],
            speechStyle: 'Therapeutic and supportive',
            motivations: ['Help patient heal', 'Uncover conflicts'],
            fears: ['Patient withdrawal', 'Therapeutic rupture']
          },
          bondLevel: 5
        },
        promptOverride: therapistPrompt,
        sessionType: 'therapy_therapist',
        sessionId,
        messageId,
        previousMessages: session.sessionHistory.slice(-3).map(msg => ({
          role: msg.speakerType === 'therapist' ? 'assistant' : 'user',
          content: msg.message
        }))
      };
      
      console.log('📤 Sending therapist question request:', {
        sessionId,
        therapistId: session.therapistId,
        messageId,
        promptLength: therapistPrompt.length
      });
      
      this.socket!.emit('chat_message', requestData);

      const timeout = setTimeout(() => {
        console.warn('⏰ Therapist question timeout for:', messageId);
        reject(new Error('Therapist response timeout'));
      }, 30000);

      const responseHandler = (data: any) => {
        if (data.messageId === messageId || data.character === session.therapistId) {
          clearTimeout(timeout);
          this.socket!.off('chat_response', responseHandler);
          
          const therapistMessage: TherapyMessage = {
            id: messageId,
            sessionId,
            speakerId: session.therapistId,
            speakerType: 'therapist',
            message: data.message || 'How are you feeling today?',
            timestamp: new Date(),
            messageType: 'question'
          };
          
          session.sessionHistory.push(therapistMessage);
          resolve(data.message || 'Therapist response unavailable');
        }
      };

      this.socket!.on('chat_response', responseHandler);
    });
  }

  /**
   * Generate patient response in individual therapy (Step 2 of dual API)
   */
  async generatePatientResponse(
    sessionId: string,
    characterId: string,
    therapistQuestion: string
  ): Promise<string> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!this.socket?.connected) {
      throw new Error('Socket not connected to backend. Please refresh the page and try again.');
    }

    return new Promise(async (resolve, reject) => {
      const messageId = `therapy_patient_${Date.now()}_${characterId}`;
      
      const patientPrompt = await this.buildPatientPrompt(session, characterId, therapistQuestion);
      
      const requestData = {
        message: therapistQuestion,
        character: characterId,
        characterData: {
          name: 'Patient',
          personality: {
            traits: ['complex', 'conflicted'],
            speechStyle: 'Authentic to character background',
            motivations: ['Growth', 'Understanding'],
            fears: ['Vulnerability', 'Judgment']
          },
          bondLevel: 1
        },
        promptOverride: patientPrompt,
        sessionType: 'therapy_patient',
        sessionId,
        messageId,
        therapistId: session.therapistId,
        sessionStage: session.stage,
        previousMessages: session.sessionHistory.slice(-5).map(msg => ({
          role: msg.speakerType === 'character' ? 'assistant' : 'user',
          content: msg.message
        }))
      };
      
      console.log('📤 Sending patient response request:', {
        sessionId,
        characterId,
        messageId,
        promptLength: patientPrompt.length,
        therapistQuestion: therapistQuestion.substring(0, 50) + '...'
      });
      
      this.socket!.emit('chat_message', requestData);

      const timeout = setTimeout(() => {
        console.warn('⏰ Patient response timeout for:', messageId);
        reject(new Error('Patient response timeout'));
      }, 30000);

      const responseHandler = (data: any) => {
        if (data.messageId === messageId || data.character === characterId) {
          clearTimeout(timeout);
          this.socket!.off('chat_response', responseHandler);
          
          const patientMessage: TherapyMessage = {
            id: messageId,
            sessionId,
            speakerId: characterId,
            speakerType: 'character',
            message: data.message || 'I prefer not to discuss this.',
            timestamp: new Date(),
            messageType: 'response'
          };
          
          session.sessionHistory.push(patientMessage);
          resolve(data.message || 'Patient response unavailable');
        }
      };

      this.socket!.on('chat_response', responseHandler);
    });
  }

  /**
   * Generate character response in therapy session (DEPRECATED - use dual API methods above)
   */
  async generateCharacterResponse(
    sessionId: string,
    characterId: string,
    trigger?: string,
    characterData?: any
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
      
      // Use common chat API format
      const requestData = {
        message: trigger || 'I want to share something in therapy',
        character: characterId,
        characterData: characterData || {
          name: 'Character',
          personality: {
            traits: ['complex'],
            speechStyle: 'Authentic to character background',
            motivations: ['Growth', 'Understanding'],
            fears: ['Vulnerability', 'Judgment']
          },
          bondLevel: 1
        },
        promptOverride: prompt,
        sessionType: 'therapy_character',
        sessionId,
        messageId,
        therapistId: session.therapistId,
        sessionStage: session.stage,
        previousMessages: session.sessionHistory.slice(-5).map(msg => ({
          role: msg.speakerType === 'character' ? 'assistant' : 'user',
          content: msg.message
        }))
      };
      
      console.log('📤 Sending therapy character request:', {
        sessionId,
        characterId,
        messageId,
        sessionType: session.type,
        promptLength: prompt.length
      });
      
      this.socket!.emit('chat_message', requestData);

      const timeout = setTimeout(() => {
        console.warn('⏰ Therapy character response timeout for:', messageId);
        reject(new Error('Therapy response timeout'));
      }, 30000);

      const responseHandler = (data: any) => {
        console.log('📥 Raw backend response:', data);
        
        // Backend sends responses without messageId matching, so we accept the first response
        clearTimeout(timeout);
        this.socket!.off('chat_response', responseHandler);
        
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
      };

      this.socket!.on('chat_response', responseHandler);
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
      
      // Use common chat API format for therapist
      const requestData = {
        message: interventionType === 'question' ? 'Ask therapeutic question' : 'Make therapeutic intervention',
        character: session.therapistId,
        characterData: {
          name: this.getTherapistName(session.therapistId),
          personality: {
            traits: ['Professional', 'Insightful', 'Caring'],
            speechStyle: 'Therapeutic and supportive',
            motivations: ['Healing', 'Growth', 'Understanding'],
            fears: ['Causing harm', 'Missing important signs']
          },
          bondLevel: 5
        },
        promptOverride: prompt,
        sessionType: 'therapy_therapist',
        sessionId,
        messageId,
        interventionType,
        sessionStage: session.stage,
        previousMessages: session.sessionHistory.slice(-5).map(msg => ({
          role: msg.speakerType === 'therapist' ? 'assistant' : 'user',
          content: msg.message
        }))
      };
      
      console.log('📤 Sending therapist intervention request:', {
        sessionId,
        therapistId: session.therapistId,
        interventionType,
        messageId
      });
      
      this.socket!.emit('chat_message', requestData);

      const timeout = setTimeout(() => {
        console.warn('⏰ Therapist intervention timeout for:', messageId);
        reject(new Error('Therapist intervention timeout'));
      }, 30000);

      const responseHandler = (data: any) => {
        console.log('📥 Raw therapist response:', data);
        
        // Backend sends responses without messageId matching, so we accept the first response
        clearTimeout(timeout);
        this.socket!.off('chat_response', responseHandler);
        
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
      };

      this.socket!.on('chat_response', responseHandler);
    });
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


  /**
   * Build therapist prompt for dual API system
   */
  private buildTherapistPrompt(session: TherapySession): string {
    const THERAPIST_STYLES: Record<string, any> = {
      'seraphina': { name: 'Fairy Godmother Seraphina', style: 'nurturing and magical' },
      'carl_jung': { name: 'Carl Jung', style: 'analytical and depth-oriented' },
      'freud': { name: 'Sigmund Freud', style: 'psychoanalytic and probing' }
    };

    const therapistInfo = THERAPIST_STYLES[session.therapistId] || { name: 'Therapist', style: 'supportive' };
    
    // Get conversation context from recent history
    const recentHistory = session.sessionHistory.slice(-6).map(msg => 
      `${msg.speakerType === 'therapist' ? 'Therapist' : 'Patient'}: ${msg.message}`
    ).join('\n');

    return `
THERAPY SESSION - THERAPIST ROLE

You are ${therapistInfo.name}, a skilled therapist conducting individual therapy. Your therapeutic style is ${therapistInfo.style}.

PATIENT CONTEXT:
The patient is dealing with conflicts related to living in shared quarters with other characters. They have ongoing disputes about kitchen duties, sleeping arrangements, and general roommate tensions.

RECENT CONVERSATION:
${recentHistory || 'Session just beginning'}

SESSION STAGE: ${session.stage || 'initial'}

THERAPEUTIC OBJECTIVES:
1. Ask one thoughtful, therapeutic question
2. Focus on helping the patient explore their conflicts and emotions
3. Use your ${therapistInfo.style} therapeutic approach
4. Guide the patient toward self-discovery and healing
5. Create a safe space for vulnerability

RESPONSE REQUIREMENTS:
- Generate exactly ONE therapeutic question or intervention
- Keep it focused and purposeful
- Match your established therapeutic style
- Don't be preachy - let the patient do the work
${recentHistory ? 
  '- Build on the previous conversation context' : 
  '- This is the opening question - ask what brings them to therapy, using your unique therapeutic style'
}

Remember: You are the THERAPIST asking questions, not the patient sharing problems.
    `.trim();
  }

  /**
   * Build patient prompt for dual API system
   */
  private async buildPatientPrompt(session: TherapySession, characterId: string, therapistQuestion: string): Promise<string> {
    try {
      console.log('🏗️ Building patient prompt for:', characterId, 'with question:', therapistQuestion.substring(0, 50) + '...');
      
      // Use ConflictDatabaseService for authentic patient prompts with real conflicts
      const conflictService = ConflictDatabaseService.getInstance();
      
      // Get therapy context for the character
      const therapyContext = await conflictService.getTherapyContextForCharacter(characterId);
      console.log('🔍 Got therapy context for character:', characterId, 'conflicts:', therapyContext.activeConflicts.length);
      
      // Generate the base patient prompt from ConflictDatabaseService
      const basePrompt = conflictService.generateTherapyPrompt(
        therapyContext,
        session.therapistId,
        session.stage
      );
      
      console.log('✅ Base prompt generated successfully, length:', basePrompt.length);

      // Add the specific therapist question and response context
      const enhancedPrompt = `
${basePrompt}

CURRENT THERAPEUTIC EXCHANGE:
Therapist just asked you: "${therapistQuestion}"

RESPONSE REQUIREMENTS:
1. You are the PATIENT responding to this specific question
2. Answer as your character would, drawing from your real conflicts and experiences
3. Do NOT ask questions back to the therapist - you are receiving therapy, not giving it
4. Share personal struggles, conflicts with roommates, or emotional challenges
5. Show your character's personality while being vulnerable and authentic
6. Keep your response to 2-3 sentences maximum - be concise but authentic
7. Focus on one specific conflict or feeling rather than multiple topics

CRITICAL: Respond TO the therapist's question as a patient sharing personal information. Be brief but meaningful.
      `.trim();

      console.log('✅ Enhanced prompt completed, total length:', enhancedPrompt.length);
      return enhancedPrompt;
      
    } catch (error) {
      console.error('❌ Error building patient prompt:', error);
      // Fallback prompt if ConflictDatabaseService fails
      return `
You are ${characterId} in individual therapy. The therapist just asked: "${therapistQuestion}"

Respond as a patient sharing personal struggles and conflicts with your roommates. Be authentic to your character while being vulnerable in therapy.

CRITICAL: You are the PATIENT, not the therapist. Share your problems, don't ask questions.
      `.trim();
    }
  }

  /**
   * Get therapist display name
   */
  private getTherapistName(therapistId: string): string {
    const names: Record<string, string> = {
      'carl-jung': 'Carl Jung',
      'zxk14bw7': 'Zxk14bW^7',
      'seraphina': 'Fairy Godmother Seraphina'
    };
    return names[therapistId] || 'Therapist';
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

// Export singleton instance
export const therapyChatService = new TherapyChatService();