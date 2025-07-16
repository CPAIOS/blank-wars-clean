// Centralized Event System for Blank Wars
// Handles all game events, character memory, and cross-system communication

export type EventType = 
  // Battle Events
  | 'battle_start' | 'battle_end' | 'battle_victory' | 'battle_defeat'
  | 'critical_hit' | 'strategy_success' | 'strategy_failure'
  | 'team_coordination' | 'individual_heroics' | 'battle_chat_conflict'
  
  // Social/Living Events  
  | 'kitchen_argument' | 'bathroom_conflict' | 'bedroom_dispute'
  | 'meal_sharing' | 'cleaning_conflict' | 'noise_complaint'
  | 'alliance_formed' | 'alliance_broken' | 'gossip_session'
  | 'late_night_conversation' | 'group_activity'
  
  // Therapy Events
  | 'therapy_session_start' | 'therapy_breakthrough' | 'therapy_resistance'
  | 'conflict_revealed' | 'conflict_resolved' | 'emotional_revelation'
  | 'group_therapy_insight' | 'therapist_intervention'
  
  // Training Events
  | 'training_session' | 'skill_improvement' | 'mental_exhaustion'
  | 'training_injury' | 'new_technique_learned' | 'training_milestone'
  | 'sparring_session' | 'meditation_session'
  
  // Equipment/Progression Events
  | 'equipment_equipped' | 'equipment_upgraded' | 'level_up'
  | 'stat_increase' | 'ability_learned' | 'achievement_earned'
  
  // Chat/Communication Events
  | 'performance_coaching' | 'equipment_advice' | 'skill_consultation'
  | 'personal_training' | 'team_meeting' | 'casual_conversation'
  
  // Financial Events - NEW
  | 'earnings_received' | 'financial_decision_pending' | 'financial_decision_made'
  | 'coach_financial_advice' | 'financial_stress_increase' | 'financial_stress_decrease'
  | 'luxury_purchase' | 'investment_made' | 'investment_outcome'
  | 'financial_crisis' | 'debt_incurred' | 'financial_breakthrough'
  | 'spending_spree' | 'financial_trauma' | 'trust_gained' | 'trust_lost'
  | 'financial_goal_set' | 'financial_goal_achieved' | 'financial_milestone'
  // Financial Spiral Events - NEW
  | 'financial_spiral_started' | 'financial_spiral_deepening' | 'financial_spiral_broken'
  | 'financial_intervention_applied' | 'financial_conflict_created'
  // Battle Financial Events - NEW
  | 'financial_wildcard_triggered' | 'battle_financial_decision' | 'adrenaline_investment'
  | 'victory_splurge' | 'defeat_desperation' | 'panic_selling'
  // Judge Evaluation Events - NEW
  | 'judge_financial_evaluation' | 'judge_financial_outcome_assessment' | 'judge_intervention_recommendation';

export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EventCategory = 'battle' | 'social' | 'therapy' | 'training' | 'progression' | 'communication' | 'financial';
export type EventSource = 'battle_arena' | 'kitchen_table' | 'therapy_room' | 'training_grounds' | 'equipment_room' | 'chat_system' | 'financial_advisory' | 'bank' | 'marketplace';

export interface GameEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  source: EventSource;
  primaryCharacterId: string;
  secondaryCharacterIds?: string[];
  severity: EventSeverity;
  category: EventCategory;
  description: string;
  metadata: Record<string, any>;
  tags: string[];
  resolved?: boolean;
  resolutionTimestamp?: Date;
  resolutionMethod?: string;
  emotionalImpact?: {
    characterId: string;
    impact: 'positive' | 'negative' | 'neutral';
    intensity: number; // 1-10
  }[];
  importance?: number; // 1-10, for event cleanup purposes
}

export interface EventFilter {
  timeRange?: '1_hour' | '6_hours' | '1_day' | '3_days' | '1_week' | '2_weeks';
  categories?: EventCategory[];
  severity?: EventSeverity[];
  characterIds?: string[];
  tags?: string[];
  resolved?: boolean;
  limit?: number;
}

export interface CharacterRelationship {
  characterId: string;
  targetCharacterId: string;
  trustLevel: number; // -100 to +100
  respectLevel: number; // -100 to +100
  affectionLevel: number; // -100 to +100
  rivalryIntensity: number; // 0 to 100
  sharedExperiences: string[]; // event IDs
  conflicts: string[]; // event IDs
  resolutions: string[]; // event IDs
  relationshipTrajectory: 'improving' | 'declining' | 'stable';
  lastInteraction: Date;
  interactionFrequency: number;
}

export interface CharacterMemory {
  id: string;
  characterId: string;
  eventId: string;
  memoryType: 'battle' | 'social' | 'training' | 'achievement' | 'conflict' | 'bonding' | 'financial';
  content: string;
  emotionalIntensity: number; // 1-10
  emotionalValence: 'positive' | 'negative' | 'neutral';
  importance: number; // 1-10 (affects retention and recall)
  createdAt: Date;
  lastRecalled: Date;
  recallCount: number;
  associatedCharacters: string[];
  tags: string[];
  decayRate: number; // How quickly this memory fades
  // Financial memory specific data
  financialMetadata?: {
    decisionType: 'investment' | 'purchase' | 'advice' | 'crisis' | 'spiral' | 'breakthrough';
    amountInvolved: number;
    outcome: 'success' | 'failure' | 'pending';
    stressImpact: number;
    trustImpact: number;
  };
}

export class GameEventBus {
  private static instance: GameEventBus;
  private events: Map<string, GameEvent> = new Map();
  private eventsByCharacter: Map<string, string[]> = new Map();
  private eventsByType: Map<EventType, string[]> = new Map();
  private eventsByTimeRange: Map<string, string[]> = new Map();
  private eventHandlers: Map<EventType, ((event: GameEvent) => void)[]> = new Map();
  private relationships: Map<string, CharacterRelationship> = new Map();
  private memories: Map<string, CharacterMemory> = new Map();
  private memoriesByCharacter: Map<string, string[]> = new Map();

  private constructor() {
    // Initialize with some time-based event cleanup
    setInterval(() => this.cleanupOldEvents(), 60000); // Clean up every minute
  }

  static getInstance(): GameEventBus {
    if (!GameEventBus.instance) {
      GameEventBus.instance = new GameEventBus();
    }
    return GameEventBus.instance;
  }

  // Event Publishing
  async publish(event: Omit<GameEvent, 'id' | 'timestamp'>): Promise<string> {
    const gameEvent: GameEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // Store the event
    this.events.set(gameEvent.id, gameEvent);

    // Index by character
    if (!this.eventsByCharacter.has(gameEvent.primaryCharacterId)) {
      this.eventsByCharacter.set(gameEvent.primaryCharacterId, []);
    }
    this.eventsByCharacter.get(gameEvent.primaryCharacterId)!.push(gameEvent.id);

    // Index secondary characters
    if (gameEvent.secondaryCharacterIds) {
      for (const charId of gameEvent.secondaryCharacterIds) {
        if (!this.eventsByCharacter.has(charId)) {
          this.eventsByCharacter.set(charId, []);
        }
        this.eventsByCharacter.get(charId)!.push(gameEvent.id);
      }
    }

    // Index by type
    if (!this.eventsByType.has(gameEvent.type)) {
      this.eventsByType.set(gameEvent.type, []);
    }
    this.eventsByType.get(gameEvent.type)!.push(gameEvent.id);

    // Index by time range
    const timeKey = this.getTimeRangeKey(gameEvent.timestamp);
    if (!this.eventsByTimeRange.has(timeKey)) {
      this.eventsByTimeRange.set(timeKey, []);
    }
    this.eventsByTimeRange.get(timeKey)!.push(gameEvent.id);

    // Create memories for involved characters
    await this.createMemoriesFromEvent(gameEvent);

    // Update relationships
    await this.updateRelationshipsFromEvent(gameEvent);

    // Notify event handlers
    const handlers = this.eventHandlers.get(gameEvent.type) || [];
    handlers.forEach(handler => {
      try {
        handler(gameEvent);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    });

    console.log('📅 Event published:', gameEvent.type, gameEvent.description);
    return gameEvent.id;
  }

  // Event Subscription
  subscribe(eventType: EventType, handler: (event: GameEvent) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  // Event Retrieval
  getEventHistory(characterId: string, filter?: EventFilter): GameEvent[] {
    const characterEventIds = this.eventsByCharacter.get(characterId) || [];
    let events = characterEventIds.map(id => this.events.get(id)!).filter(Boolean);

    // Apply filters
    if (filter) {
      if (filter.timeRange) {
        const cutoff = this.getTimeRangeCutoff(filter.timeRange);
        events = events.filter(event => event.timestamp >= cutoff);
      }

      if (filter.categories) {
        events = events.filter(event => filter.categories!.includes(event.category));
      }

      if (filter.severity) {
        events = events.filter(event => filter.severity!.includes(event.severity));
      }

      if (filter.tags) {
        events = events.filter(event => 
          filter.tags!.some(tag => event.tags.includes(tag))
        );
      }

      if (filter.resolved !== undefined) {
        events = events.filter(event => event.resolved === filter.resolved);
      }

      if (filter.limit) {
        events = events.slice(-filter.limit);
      }
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Memory Management
  private async createMemoriesFromEvent(event: GameEvent): Promise<void> {
    const allCharacters = [event.primaryCharacterId, ...(event.secondaryCharacterIds || [])];

    for (const characterId of allCharacters) {
      const memory: CharacterMemory = {
        id: `memory_${event.id}_${characterId}`,
        characterId,
        eventId: event.id,
        memoryType: this.getMemoryType(event.type),
        content: this.generateMemoryContent(event, characterId),
        emotionalIntensity: this.calculateEmotionalIntensity(event, characterId),
        emotionalValence: this.calculateEmotionalValence(event, characterId),
        importance: this.calculateImportance(event, characterId),
        createdAt: new Date(),
        lastRecalled: new Date(),
        recallCount: 0,
        associatedCharacters: allCharacters.filter(id => id !== characterId),
        tags: event.tags,
        decayRate: this.calculateDecayRate(event.type)
      };

      this.memories.set(memory.id, memory);
      
      if (!this.memoriesByCharacter.has(characterId)) {
        this.memoriesByCharacter.set(characterId, []);
      }
      this.memoriesByCharacter.get(characterId)!.push(memory.id);
    }
  }

  // Relationship Management
  private async updateRelationshipsFromEvent(event: GameEvent): Promise<void> {
    if (!event.secondaryCharacterIds || event.secondaryCharacterIds.length === 0) {
      return;
    }

    const relationshipChanges = this.calculateRelationshipChanges(event);

    for (const secondaryCharId of event.secondaryCharacterIds) {
      const relationshipKey = `${event.primaryCharacterId}_${secondaryCharId}`;
      let relationship = this.relationships.get(relationshipKey);

      if (!relationship) {
        relationship = this.createNewRelationship(event.primaryCharacterId, secondaryCharId);
      }

      // Apply changes
      relationship.trustLevel = this.applyRelationshipChange(relationship.trustLevel, relationshipChanges.trust);
      relationship.respectLevel = this.applyRelationshipChange(relationship.respectLevel, relationshipChanges.respect);
      relationship.affectionLevel = this.applyRelationshipChange(relationship.affectionLevel, relationshipChanges.affection);
      relationship.rivalryIntensity = Math.max(0, Math.min(100, relationship.rivalryIntensity + (relationshipChanges.rivalry || 0)));
      
      relationship.sharedExperiences.push(event.id);
      relationship.lastInteraction = event.timestamp;
      relationship.interactionFrequency++;

      if (event.type.includes('conflict') || event.type.includes('argument')) {
        relationship.conflicts.push(event.id);
      }

      if (event.type.includes('resolved') || event.type.includes('resolution')) {
        relationship.resolutions.push(event.id);
      }

      // Update trajectory
      const recentTrustChange = relationshipChanges.trust || 0;
      const recentRespectChange = relationshipChanges.respect || 0;
      const overallChange = recentTrustChange + recentRespectChange;
      
      if (overallChange > 0) {
        relationship.relationshipTrajectory = 'improving';
      } else if (overallChange < 0) {
        relationship.relationshipTrajectory = 'declining';
      } else {
        relationship.relationshipTrajectory = 'stable';
      }

      this.relationships.set(relationshipKey, relationship);

      // Also create reverse relationship
      const reverseKey = `${secondaryCharId}_${event.primaryCharacterId}`;
      const reverseRelationship = { ...relationship };
      reverseRelationship.characterId = secondaryCharId;
      reverseRelationship.targetCharacterId = event.primaryCharacterId;
      this.relationships.set(reverseKey, reverseRelationship);
    }
  }

  // Helper Methods
  private getMemoryType(eventType: EventType): CharacterMemory['memoryType'] {
    if (eventType.includes('battle')) return 'battle';
    if (eventType.includes('training')) return 'training';
    if (eventType.includes('conflict') || eventType.includes('argument')) return 'conflict';
    if (eventType.includes('alliance') || eventType.includes('conversation')) return 'bonding';
    if (eventType.includes('achievement') || eventType.includes('level')) return 'achievement';
    return 'social';
  }

  private generateMemoryContent(event: GameEvent, characterId: string): string {
    const isPrimary = event.primaryCharacterId === characterId;
    const pronoun = isPrimary ? 'I' : 'We';
    
    return `${pronoun} ${event.description.toLowerCase()}`;
  }

  private calculateEmotionalIntensity(event: GameEvent, characterId: string): number {
    const severityMap = { low: 3, medium: 5, high: 7, critical: 10 };
    const baseIntensity = severityMap[event.severity];
    
    // Primary character experiences higher intensity
    return event.primaryCharacterId === characterId ? baseIntensity : Math.max(1, baseIntensity - 2);
  }

  private calculateEmotionalValence(event: GameEvent, characterId: string): 'positive' | 'negative' | 'neutral' {
    const positiveEvents = ['victory', 'success', 'breakthrough', 'resolved', 'alliance', 'achievement'];
    const negativeEvents = ['defeat', 'failure', 'conflict', 'argument', 'injury', 'exhaustion'];
    
    const eventString = event.type.toLowerCase();
    
    if (positiveEvents.some(word => eventString.includes(word))) return 'positive';
    if (negativeEvents.some(word => eventString.includes(word))) return 'negative';
    return 'neutral';
  }

  private calculateImportance(event: GameEvent, characterId: string): number {
    let importance = 5; // Base importance
    
    // Primary character finds it more important
    if (event.primaryCharacterId === characterId) importance += 2;
    
    // Severity affects importance
    const severityBonus = { low: 0, medium: 1, high: 2, critical: 3 };
    importance += severityBonus[event.severity];
    
    // Certain event types are more important
    if (event.type.includes('victory') || event.type.includes('defeat')) importance += 2;
    if (event.type.includes('breakthrough') || event.type.includes('resolved')) importance += 1;
    
    return Math.min(10, importance);
  }

  private calculateDecayRate(eventType: EventType): number {
    // Different event types decay at different rates
    if (eventType.includes('victory') || eventType.includes('defeat')) return 0.1; // Long-lasting
    if (eventType.includes('breakthrough') || eventType.includes('resolved')) return 0.2;
    if (eventType.includes('conflict') || eventType.includes('argument')) return 0.3;
    return 0.5; // Default decay rate
  }

  private calculateRelationshipChanges(event: GameEvent): {
    trust?: number;
    respect?: number;
    affection?: number;
    rivalry?: number;
  } {
    const changeMap: Record<string, any> = {
      'battle_victory': { trust: 3, respect: 2 },
      'battle_defeat': { trust: -1, respect: -1 },
      'kitchen_argument': { trust: -5, respect: -3, affection: -2, rivalry: 2 },
      'therapy_breakthrough': { trust: 2, respect: 1 },
      'sparring_session': { respect: 4, trust: 1 },
      'meal_sharing': { affection: 1, trust: 1 },
      'late_night_conversation': { trust: 3, affection: 2 },
      'alliance_formed': { trust: 5, respect: 3, affection: 2 },
      'conflict_resolved': { trust: 4, respect: 2, rivalry: -3 },
      'group_activity': { affection: 2, trust: 1 },
      // Financial Events - Impact on relationships
      'coach_financial_advice': { trust: 2, respect: 1 },
      'trust_gained': { trust: 5, respect: 2 },
      'trust_lost': { trust: -8, respect: -3 },
      'financial_breakthrough': { trust: 4, respect: 3, affection: 2 },
      'financial_crisis': { trust: -3, respect: -2, rivalry: 1 },
      'financial_stress_increase': { trust: -2, affection: -1 },
      'financial_stress_decrease': { trust: 1, affection: 1 },
      // Financial Spiral Events - Impact on relationships
      'financial_spiral_started': { trust: -5, respect: -3, affection: -3 },
      'financial_spiral_deepening': { trust: -3, respect: -2, affection: -2, rivalry: 2 },
      'financial_spiral_broken': { trust: 6, respect: 4, affection: 3 },
      'financial_intervention_applied': { trust: 3, respect: 2, affection: 1 },
      // Battle Financial Events - Impact on relationships
      'financial_wildcard_triggered': { trust: -2, respect: -1, affection: -1 },
      'battle_financial_decision': { trust: 1, respect: 1 },
      'adrenaline_investment': { trust: -3, respect: 2, rivalry: 1 },
      'victory_splurge': { trust: -1, respect: -2, affection: 3 },
      'defeat_desperation': { trust: -4, respect: -3, affection: -2 },
      'panic_selling': { trust: -2, respect: -2, affection: -1 }
    };

    return changeMap[event.type] || { trust: 0, respect: 0 };
  }

  private createNewRelationship(characterId: string, targetCharacterId: string): CharacterRelationship {
    return {
      characterId,
      targetCharacterId,
      trustLevel: 0,
      respectLevel: 0,
      affectionLevel: 0,
      rivalryIntensity: 0,
      sharedExperiences: [],
      conflicts: [],
      resolutions: [],
      relationshipTrajectory: 'stable',
      lastInteraction: new Date(),
      interactionFrequency: 0
    };
  }

  private applyRelationshipChange(currentValue: number, change: number): number {
    return Math.max(-100, Math.min(100, currentValue + change));
  }

  private getTimeRangeKey(timestamp: Date): string {
    return timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private getTimeRangeCutoff(timeRange: string): Date {
    const now = new Date();
    const cutoffs = {
      '1_hour': 60 * 60 * 1000,
      '6_hours': 6 * 60 * 60 * 1000,
      '1_day': 24 * 60 * 60 * 1000,
      '3_days': 3 * 24 * 60 * 60 * 1000,
      '1_week': 7 * 24 * 60 * 60 * 1000,
      '2_weeks': 14 * 24 * 60 * 60 * 1000
    };

    return new Date(now.getTime() - cutoffs[timeRange as keyof typeof cutoffs]);
  }

  private cleanupOldEvents(): void {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    for (const eventId of Array.from(this.events.keys())) {
      const event = this.events.get(eventId);
      if (!event) continue;
      if (event.timestamp < twoWeeksAgo && (event.importance || 5) < 7) {
        this.events.delete(eventId);
        
        // Clean up indexes
        const characterEventIds = this.eventsByCharacter.get(event.primaryCharacterId);
        if (characterEventIds) {
          const index = characterEventIds.indexOf(eventId);
          if (index > -1) characterEventIds.splice(index, 1);
        }
      }
    }
  }

  // Public API Methods
  getRelationship(characterId: string, targetCharacterId: string): CharacterRelationship | null {
    return this.relationships.get(`${characterId}_${targetCharacterId}`) || null;
  }

  getCharacterMemories(characterId: string, filter?: {
    memoryType?: CharacterMemory['memoryType'];
    importance?: number;
    limit?: number;
  }): CharacterMemory[] {
    const memoryIds = this.memoriesByCharacter.get(characterId) || [];
    let memories = memoryIds.map(id => this.memories.get(id)!).filter(Boolean);

    if (filter) {
      if (filter.memoryType) {
        memories = memories.filter(memory => memory.memoryType === filter.memoryType);
      }
      if (filter.importance) {
        memories = memories.filter(memory => memory.importance >= filter.importance!);
      }
      if (filter.limit) {
        memories = memories.slice(-filter.limit);
      }
    }

    return memories.sort((a, b) => b.importance - a.importance);
  }

  getRelationshipSummary(characterId: string): Map<string, CharacterRelationship> {
    const relationships = new Map<string, CharacterRelationship>();
    
    for (const relationship of Array.from(this.relationships.values())) {
      if (relationship.characterId === characterId) {
        relationships.set(relationship.targetCharacterId, relationship);
      }
    }
    
    return relationships;
  }

  getEvent(eventId: string): GameEvent | undefined {
    return this.events.get(eventId);
  }

  getCharacterEvents(characterId: string, filters?: EventFilter): GameEvent[] {
    const eventIds = this.eventsByCharacter.get(characterId) || [];
    const events = eventIds
      .map(id => this.events.get(id))
      .filter((event): event is GameEvent => event !== undefined);

    if (!filters) return events;

    return this.filterEvents(events, filters);
  }

  private filterEvents(events: GameEvent[], filters: EventFilter): GameEvent[] {
    let filtered = events;

    if (filters.timeRange) {
      const cutoff = this.getTimeRangeCutoff(filters.timeRange);
      filtered = filtered.filter(event => event.timestamp > cutoff);
    }

    if (filters.categories) {
      filtered = filtered.filter(event => filters.categories!.includes(event.category));
    }

    if (filters.severity) {
      filtered = filtered.filter(event => filters.severity!.includes(event.severity));
    }

    if (filters.tags) {
      filtered = filtered.filter(event => 
        filters.tags!.some(tag => event.tags.includes(tag))
      );
    }

    if (filters.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Financial Event Helper Methods - NEW
  async publishFinancialEvent(
    type: EventType,
    characterId: string,
    description: string,
    metadata: Record<string, any> = {},
    severity: EventSeverity = 'medium'
  ): Promise<string> {
    const eventId = await this.publish({
      type,
      source: 'financial_advisory',
      primaryCharacterId: characterId,
      severity,
      category: 'financial',
      description,
      metadata,
      tags: ['financial', 'money'],
      resolved: false
    });

    // Create financial memory for significant events
    if (this.shouldCreateFinancialMemory(type, severity)) {
      this.addFinancialMemory(eventId, characterId, type, description, metadata, severity);
    }

    return eventId;
  }

  /**
   * Add a financial memory to the existing memory system
   */
  public addFinancialMemory(
    eventId: string,
    characterId: string,
    eventType: EventType,
    description: string,
    metadata: Record<string, any>,
    severity: EventSeverity
  ): void {
    const importance = this.calculateFinancialMemoryImportance(eventType, severity, metadata);
    const emotionalIntensity = this.calculateFinancialEmotionalIntensity(eventType, metadata);
    const emotionalValence = this.calculateFinancialEmotionalValence(eventType, metadata);
    const decisionType = this.mapEventToDecisionType(eventType);
    
    const memory: CharacterMemory = {
      id: `financial_memory_${Date.now()}_${characterId}`,
      characterId,
      eventId,
      memoryType: 'financial',
      content: description,
      emotionalIntensity,
      emotionalValence,
      importance,
      createdAt: new Date(),
      lastRecalled: new Date(),
      recallCount: 0,
      associatedCharacters: [],
      tags: ['financial', 'money', eventType],
      decayRate: this.calculateFinancialMemoryDecayRate(importance, emotionalIntensity),
      financialMetadata: {
        decisionType,
        amountInvolved: metadata.amount || 0,
        outcome: this.determineFinancialOutcome(eventType, metadata),
        stressImpact: metadata.stressChange || 0,
        trustImpact: metadata.trustChange || 0
      }
    };

    this.memories.set(memory.id, memory);
    
    // Add to character's memory list using existing system
    if (!this.memoriesByCharacter.has(characterId)) {
      this.memoriesByCharacter.set(characterId, []);
    }
    this.memoriesByCharacter.get(characterId)!.push(memory.id);
  }

  /**
   * Determine if a financial event should create a memory
   */
  private shouldCreateFinancialMemory(eventType: EventType, severity: EventSeverity): boolean {
    const significantEvents = [
      'financial_decision_made',
      'financial_crisis',
      'financial_breakthrough',
      'financial_spiral_started',
      'financial_spiral_broken',
      'luxury_purchase',
      'investment_outcome',
      'trust_gained',
      'trust_lost',
      'victory_splurge',
      'defeat_desperation'
    ];

    return significantEvents.includes(eventType) || severity === 'high' || severity === 'critical';
  }

  /**
   * Calculate importance of financial memory (1-10)
   */
  private calculateFinancialMemoryImportance(
    eventType: EventType,
    severity: EventSeverity,
    metadata: Record<string, any>
  ): number {
    let importance = 5; // Base importance

    // Adjust based on event type
    const highImportanceEvents = ['financial_crisis', 'financial_breakthrough', 'financial_spiral_started'];
    const mediumImportanceEvents = ['luxury_purchase', 'investment_outcome', 'trust_gained', 'trust_lost'];
    
    if (highImportanceEvents.includes(eventType)) {
      importance += 3;
    } else if (mediumImportanceEvents.includes(eventType)) {
      importance += 2;
    }

    // Adjust based on severity
    const severityBonus = { low: 0, medium: 1, high: 2, critical: 3 };
    importance += severityBonus[severity];

    // Adjust based on amount involved
    const amount = metadata.amount || 0;
    if (amount > 10000) importance += 2;
    else if (amount > 5000) importance += 1;

    return Math.min(10, Math.max(1, importance));
  }

  /**
   * Calculate emotional intensity of financial memory (1-10)
   */
  private calculateFinancialEmotionalIntensity(eventType: EventType, metadata: Record<string, any>): number {
    let intensity = 5;

    // High intensity events
    if (['financial_crisis', 'financial_breakthrough', 'financial_spiral_started'].includes(eventType)) {
      intensity = 8;
    }
    // Medium intensity events
    else if (['luxury_purchase', 'victory_splurge', 'defeat_desperation'].includes(eventType)) {
      intensity = 6;
    }

    // Adjust based on stress/trust changes
    const stressChange = Math.abs(metadata.stressChange || 0);
    const trustChange = Math.abs(metadata.trustChange || 0);
    
    if (stressChange > 20 || trustChange > 20) intensity += 2;
    else if (stressChange > 10 || trustChange > 10) intensity += 1;

    return Math.min(10, Math.max(1, intensity));
  }

  /**
   * Calculate emotional valence of financial memory
   */
  private calculateFinancialEmotionalValence(
    eventType: EventType,
    metadata: Record<string, any>
  ): 'positive' | 'negative' | 'neutral' {
    const positiveEvents = ['financial_breakthrough', 'trust_gained', 'financial_goal_achieved', 'investment_outcome'];
    const negativeEvents = ['financial_crisis', 'financial_spiral_started', 'trust_lost', 'defeat_desperation'];

    if (positiveEvents.includes(eventType)) return 'positive';
    if (negativeEvents.includes(eventType)) return 'negative';

    // Check outcome in metadata
    if (metadata.outcome === 'success') return 'positive';
    if (metadata.outcome === 'failure') return 'negative';

    // Check stress change
    const stressChange = metadata.stressChange || 0;
    if (stressChange > 0) return 'negative';
    if (stressChange < 0) return 'positive';

    return 'neutral';
  }

  /**
   * Map event type to decision type
   */
  private mapEventToDecisionType(eventType: EventType): 'investment' | 'purchase' | 'advice' | 'crisis' | 'spiral' | 'breakthrough' {
    if (eventType.includes('investment')) return 'investment';
    if (eventType.includes('purchase') || eventType.includes('splurge')) return 'purchase';
    if (eventType.includes('advice') || eventType.includes('trust')) return 'advice';
    if (eventType.includes('crisis')) return 'crisis';
    if (eventType.includes('spiral')) return 'spiral';
    if (eventType.includes('breakthrough')) return 'breakthrough';
    return 'advice'; // Default
  }

  /**
   * Determine financial outcome
   */
  private determineFinancialOutcome(eventType: EventType, metadata: Record<string, any>): 'success' | 'failure' | 'pending' {
    if (metadata.outcome) return metadata.outcome;
    
    const successEvents = ['financial_breakthrough', 'trust_gained', 'financial_goal_achieved'];
    const failureEvents = ['financial_crisis', 'financial_spiral_started', 'trust_lost'];
    
    if (successEvents.includes(eventType)) return 'success';
    if (failureEvents.includes(eventType)) return 'failure';
    
    return 'pending';
  }

  /**
   * Calculate memory decay rate based on importance and emotional intensity
   */
  private calculateFinancialMemoryDecayRate(importance: number, emotionalIntensity: number): number {
    // Higher importance and intensity = slower decay
    const baseDecay = 0.1;
    const importanceReduction = (importance - 5) * 0.01;
    const intensityReduction = (emotionalIntensity - 5) * 0.01;
    
    return Math.max(0.01, baseDecay - importanceReduction - intensityReduction);
  }

  async publishEarningsEvent(characterId: string, amount: number, source: string): Promise<string> {
    return this.publishFinancialEvent(
      'earnings_received',
      characterId,
      `${characterId} earned $${amount.toLocaleString()} from ${source}`,
      { amount, source, type: 'earnings' },
      'low'
    );
  }

  async publishFinancialDecision(
    characterId: string,
    decisionType: string,
    amount: number,
    coachAdvice?: string
  ): Promise<string> {
    return this.publishFinancialEvent(
      'financial_decision_pending',
      characterId,
      `${characterId} is considering a ${decisionType} decision involving $${amount.toLocaleString()}`,
      { decisionType, amount, coachAdvice, type: 'decision' },
      'medium'
    );
  }

  async publishFinancialStressChange(
    characterId: string,
    oldStress: number,
    newStress: number,
    reason: string
  ): Promise<string> {
    const eventType = newStress > oldStress ? 'financial_stress_increase' : 'financial_stress_decrease';
    const change = Math.abs(newStress - oldStress);
    const severity: EventSeverity = change > 20 ? 'high' : change > 10 ? 'medium' : 'low';

    return this.publishFinancialEvent(
      eventType,
      characterId,
      `${characterId}'s financial stress ${newStress > oldStress ? 'increased' : 'decreased'} by ${change}% due to ${reason}`,
      { oldStress, newStress, change, reason, type: 'stress' },
      severity
    );
  }

  async publishTrustChange(
    characterId: string,
    oldTrust: number,
    newTrust: number,
    reason: string
  ): Promise<string> {
    const eventType = newTrust > oldTrust ? 'trust_gained' : 'trust_lost';
    const change = Math.abs(newTrust - oldTrust);
    
    return this.publishFinancialEvent(
      eventType,
      characterId,
      `${characterId}'s trust in coach financial advice ${newTrust > oldTrust ? 'increased' : 'decreased'} by ${change}% due to ${reason}`,
      { oldTrust, newTrust, change, reason, type: 'trust' },
      'medium'
    );
  }

  async publishFinancialCrisis(characterId: string, crisisType: string, impact: number): Promise<string> {
    return this.publishFinancialEvent(
      'financial_crisis',
      characterId,
      `${characterId} experienced a ${crisisType} causing $${impact.toLocaleString()} in losses`,
      { crisisType, impact, type: 'crisis' },
      'high'
    );
  }
}

export default GameEventBus;