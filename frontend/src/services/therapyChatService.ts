import { io, Socket } from 'socket.io-client';
import { characterAPI } from './apiClient';
import ConflictDatabaseService, { ConflictData, TherapyContext } from '@/services/ConflictDatabaseService';

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

interface Character {
  id: string;
  name: string;
  archetype: string;
  level: number;
  base_health: number;
  base_attack: number;
  experience: number;
  bond_level: number;
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
      console.log('📥 Therapy session response received:', {
        hasMessage: !!data.message,
        hasError: !!data.error
      });
    });

    this.socket.on('chat_error', (error) => {
      console.error('❌ Therapy session error:', error);
    });
  }

  /**
   * Start an individual therapy session using real user characters
   */
  async startIndividualSession(characterId: string, therapistId: string): Promise<TherapySession> {
    const sessionId = `therapy_individual_${Date.now()}_${characterId}`;
    
    try {
      // Get user's actual characters instead of demo characters
      const response = await characterAPI.getUserCharacters();
      const characters = response.characters || [];
      
      const character = characters.find((c: Character) => c.id === characterId);
      if (!character) {
        throw new Error(`Character ${characterId} not found in user's collection`);
      }

      const session: TherapySession = {
        id: sessionId,
        type: 'individual',
        therapistId,
        participantIds: [characterId],
        stage: 'initial',
        sessionHistory: [],
        startTime: new Date(),
        context: await this.getTherapyContext(character)
      };

      this.activeSessions.set(sessionId, session);
      console.log(`🧠 Started individual therapy session for ${character.name}`);
      
      return session;
    } catch (error) {
      console.error('❌ Failed to start individual therapy session:', error);
      throw error;
    }
  }

  /**
   * Start a group therapy session using real user characters
   */
  async startGroupSession(characterIds: string[], therapistId: string): Promise<TherapySession> {
    const sessionId = `therapy_group_${Date.now()}_${characterIds.join('_')}`;
    
    try {
      // Get user's actual characters
      const response = await characterAPI.getUserCharacters();
      const characters = response.characters || [];
      
      const sessionCharacters = characters.filter((c: Character) => 
        characterIds.includes(c.id)
      );

      if (sessionCharacters.length !== characterIds.length) {
        throw new Error('Some characters not found in user\'s collection');
      }

      const session: TherapySession = {
        id: sessionId,
        type: 'group',
        therapistId,
        participantIds: characterIds,
        stage: 'initial',
        sessionHistory: [],
        startTime: new Date(),
        groupDynamics: this.analyzeGroupDynamics(sessionCharacters)
      };

      this.activeSessions.set(sessionId, session);
      console.log(`🧠 Started group therapy session with ${sessionCharacters.length} characters`);
      
      return session;
    } catch (error) {
      console.error('❌ Failed to start group therapy session:', error);
      throw error;
    }
  }

  /**
   * Send a message in a therapy session
   */
  async sendMessage(sessionId: string, speakerId: string, message: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const therapyMessage: TherapyMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      speakerId,
      speakerType: speakerId === session.therapistId ? 'therapist' : 'character',
      message,
      timestamp: new Date(),
      messageType: speakerId === session.therapistId ? 'question' : 'response'
    };

    session.sessionHistory.push(therapyMessage);
    this.activeSessions.set(sessionId, session);

    // Emit to socket for AI processing
    if (this.socket?.connected) {
      this.socket.emit('therapy_message', {
        sessionId,
        message: therapyMessage,
        sessionContext: session
      });
    }
  }

  /**
   * Register a message handler for a specific session
   */
  onMessage(sessionId: string, handler: (message: TherapyMessage) => void): void {
    this.messageHandlers.set(sessionId, handler);
  }

  /**
   * Remove a message handler
   */
  offMessage(sessionId: string): void {
    this.messageHandlers.delete(sessionId);
  }

  /**
   * End a therapy session
   */
  endSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      console.log(`🧠 Ending therapy session: ${sessionId}`);
      this.activeSessions.delete(sessionId);
      this.messageHandlers.delete(sessionId);
      
      if (this.socket?.connected) {
        this.socket.emit('therapy_session_end', { sessionId });
      }
    }
  }

  /**
   * Get therapy context for a character
   */
  private async getTherapyContext(character: Character): Promise<TherapyContext> {
    // Use ConflictDatabaseService to analyze character needs
    const conflictService = new ConflictDatabaseService();
    const conflictData = await conflictService.analyzeCharacterConflicts(character);
    
    return {
      primaryIssues: conflictData.conflicts.slice(0, 3),
      therapeuticGoals: this.generateTherapeuticGoals(character, conflictData),
      sessionFocus: this.determineSessionFocus(character),
      resistancePatterns: this.identifyResistancePatterns(character)
    };
  }

  /**
   * Analyze group dynamics for group therapy
   */
  private analyzeGroupDynamics(characters: Character[]): string[] {
    const dynamics: string[] = [];
    
    // Analyze archetype combinations
    const archetypes = characters.map(c => c.archetype);
    const uniqueArchetypes = [...new Set(archetypes)];
    
    if (uniqueArchetypes.includes('warrior') && uniqueArchetypes.includes('scholar')) {
      dynamics.push('warrior-scholar_tension');
    }
    
    if (uniqueArchetypes.includes('beast') && characters.length > 2) {
      dynamics.push('beast_socialization_challenge');
    }
    
    // Add more dynamic analysis based on character levels, bond levels, etc.
    const avgLevel = characters.reduce((sum, c) => sum + c.level, 0) / characters.length;
    const avgBond = characters.reduce((sum, c) => sum + c.bond_level, 0) / characters.length;
    
    if (avgBond < 5) {
      dynamics.push('low_group_cohesion');
    }
    
    if (avgLevel > 10) {
      dynamics.push('experienced_group');
    }
    
    return dynamics;
  }

  /**
   * Generate therapeutic goals based on character analysis
   */
  private generateTherapeuticGoals(character: Character, conflictData: ConflictData): string[] {
    const goals: string[] = [];
    
    // Base goals on archetype
    switch (character.archetype) {
      case 'warrior':
        goals.push('anger_management', 'emotional_regulation');
        break;
      case 'scholar':
        goals.push('social_skills', 'emotional_intelligence');
        break;
      case 'beast':
        goals.push('communication_skills', 'impulse_control');
        break;
      case 'trickster':
        goals.push('trust_building', 'authentic_relationships');
        break;
      default:
        goals.push('self_awareness', 'interpersonal_skills');
    }
    
    // Add goals based on conflicts
    if (conflictData.conflicts.some(c => c.includes('authority'))) {
      goals.push('authority_acceptance');
    }
    
    return goals;
  }

  /**
   * Determine session focus based on character state
   */
  private determineSessionFocus(character: Character): string {
    if (character.bond_level < 3) {
      return 'trust_building';
    } else if (character.level < 5) {
      return 'adaptation_support';
    } else {
      return 'performance_optimization';
    }
  }

  /**
   * Identify potential resistance patterns
   */
  private identifyResistancePatterns(character: Character): string[] {
    const patterns: string[] = [];
    
    switch (character.archetype) {
      case 'warrior':
        patterns.push('emotional_avoidance', 'vulnerability_resistance');
        break;
      case 'scholar':
        patterns.push('intellectualization', 'emotional_detachment');
        break;
      case 'beast':
        patterns.push('communication_barriers', 'social_withdrawal');
        break;
      case 'trickster':
        patterns.push('deflection', 'superficial_engagement');
        break;
    }
    
    return patterns;
  }

  /**
   * Get active session
   */
  getSession(sessionId: string): TherapySession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): TherapySession[] {
    return Array.from(this.activeSessions.values());
  }
}

// Create and export singleton instance
export const therapyChatService = new TherapyChatService();