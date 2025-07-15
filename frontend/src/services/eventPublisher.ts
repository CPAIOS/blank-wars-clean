// Event Publisher Service
// Provides easy-to-use methods for different game systems to publish events

import GameEventBus, { GameEvent, EventType, EventSeverity, EventCategory, EventSource } from './gameEventBus';

export interface BattleEventData {
  winnerId: string;
  loserId: string;
  participants: string[];
  battleDuration: number;
  strategyUsed: string;
  mvpPlayer?: string;
  teamworkRating: number;
  battleType: 'arena' | 'tournament' | 'sparring' | 'practice';
}

export interface ChatEventData {
  characterId: string;
  chatType: 'performance' | 'equipment' | 'skills' | 'training' | 'casual';
  message: string;
  coachId?: string;
  outcome?: 'helpful' | 'confusing' | 'breakthrough' | 'resistance';
}

export interface TrainingEventData {
  characterId: string;
  trainerId?: string;
  trainingType: 'strength' | 'agility' | 'endurance' | 'skill' | 'mental';
  intensity: number; // 1-10
  duration: number; // minutes
  improvements: string[];
  fatigueLevel: number; // 1-10
}

export interface SocialEventData {
  initiatorId: string;
  participantIds: string[];
  location: 'kitchen' | 'living_room' | 'training_area' | 'bedroom' | 'common_area';
  eventType: 'conversation' | 'argument' | 'activity' | 'meal' | 'conflict';
  topic?: string;
  outcome: 'positive' | 'negative' | 'neutral' | 'unresolved';
  witnesses?: string[];
}

export interface TherapyEventData {
  characterId: string;
  therapistId: string;
  sessionType: 'individual' | 'group' | 'couples' | 'family';
  stage: 'initial' | 'resistance' | 'breakthrough' | 'maintenance';
  topicsDiscussed: string[];
  insights: string[];
  resistanceLevel: number; // 1-10
  breakthroughAchieved: boolean;
}

export interface ProgressionEventData {
  characterId: string;
  progressType: 'level_up' | 'stat_increase' | 'skill_learned' | 'equipment_change' | 'achievement';
  details: Record<string, any>;
  previousValue?: any;
  newValue?: any;
}

export class EventPublisher {
  private static instance: EventPublisher;
  private eventBus: GameEventBus;

  private constructor() {
    this.eventBus = GameEventBus.getInstance();
  }

  static getInstance(): EventPublisher {
    if (!EventPublisher.instance) {
      EventPublisher.instance = new EventPublisher();
    }
    return EventPublisher.instance;
  }

  // Battle System Events
  async publishBattleStart(data: BattleEventData): Promise<string> {
    return await this.eventBus.publish({
      type: 'battle_start',
      source: 'battle_arena',
      primaryCharacterId: data.winnerId,
      secondaryCharacterIds: data.participants.filter(id => id !== data.winnerId),
      severity: 'medium',
      category: 'battle',
      description: `Battle started: ${data.participants.length} participants using ${data.strategyUsed} strategy`,
      metadata: {
        battleType: data.battleType,
        strategyUsed: data.strategyUsed,
        participants: data.participants,
        expectedDuration: data.battleDuration
      },
      tags: ['battle', 'combat', data.battleType, data.strategyUsed]
    });
  }

  async publishBattleEnd(data: BattleEventData): Promise<string> {
    const battleEndEvent = await this.eventBus.publish({
      type: 'battle_end',
      source: 'battle_arena',
      primaryCharacterId: data.winnerId,
      secondaryCharacterIds: data.participants.filter(id => id !== data.winnerId),
      severity: 'high',
      category: 'battle',
      description: `Battle ended: ${data.winnerId} victorious over ${data.loserId}`,
      metadata: {
        winnerId: data.winnerId,
        loserId: data.loserId,
        battleDuration: data.battleDuration,
        teamworkRating: data.teamworkRating,
        mvpPlayer: data.mvpPlayer,
        battleType: data.battleType
      },
      tags: ['battle', 'victory', 'defeat', data.battleType],
      emotionalImpact: [
        { characterId: data.winnerId, impact: 'positive', intensity: 8 },
        { characterId: data.loserId, impact: 'negative', intensity: 6 }
      ]
    });

    // Also publish individual victory/defeat events
    await this.eventBus.publish({
      type: 'battle_victory',
      source: 'battle_arena',
      primaryCharacterId: data.winnerId,
      secondaryCharacterIds: [data.loserId],
      severity: 'medium',
      category: 'battle',
      description: `Won battle against ${data.loserId} using ${data.strategyUsed}`,
      metadata: data,
      tags: ['victory', 'combat', 'achievement']
    });

    await this.eventBus.publish({
      type: 'battle_defeat',
      source: 'battle_arena',
      primaryCharacterId: data.loserId,
      secondaryCharacterIds: [data.winnerId],
      severity: 'medium',
      category: 'battle',
      description: `Lost battle to ${data.winnerId} despite ${data.strategyUsed} strategy`,
      metadata: data,
      tags: ['defeat', 'setback', 'learning']
    });

    return battleEndEvent;
  }

  // Alias for backwards compatibility
  async publishBattleEvent(data: BattleEventData): Promise<string> {
    return this.publishBattleEnd(data);
  }

  // Chat System Events
  async publishChatInteraction(data: ChatEventData): Promise<string> {
    const severity: EventSeverity = data.outcome === 'breakthrough' ? 'high' : 
                                   data.outcome === 'resistance' ? 'medium' : 'low';

    return await this.eventBus.publish({
      type: this.getChatEventType(data.chatType),
      source: 'chat_system',
      primaryCharacterId: data.characterId,
      secondaryCharacterIds: data.coachId ? [data.coachId] : [],
      severity,
      category: 'communication',
      description: `${data.chatType} chat session with ${data.outcome || 'neutral'} outcome`,
      metadata: {
        chatType: data.chatType,
        message: data.message.substring(0, 100) + '...', // Truncate for storage
        outcome: data.outcome,
        coachId: data.coachId
      },
      tags: ['communication', data.chatType, data.outcome || 'neutral']
    });
  }

  // Training System Events
  async publishTrainingSession(data: TrainingEventData): Promise<string> {
    const severity: EventSeverity = data.intensity > 8 ? 'high' : 
                                   data.intensity > 5 ? 'medium' : 'low';

    return await this.eventBus.publish({
      type: 'training_session',
      source: 'training_grounds',
      primaryCharacterId: data.characterId,
      secondaryCharacterIds: data.trainerId ? [data.trainerId] : [],
      severity,
      category: 'training',
      description: `${data.trainingType} training session (intensity ${data.intensity}/10)`,
      metadata: {
        trainingType: data.trainingType,
        intensity: data.intensity,
        duration: data.duration,
        improvements: data.improvements,
        fatigueLevel: data.fatigueLevel,
        trainerId: data.trainerId
      },
      tags: ['training', data.trainingType, `intensity_${data.intensity}`],
      emotionalImpact: [{
        characterId: data.characterId,
        impact: data.improvements.length > 0 ? 'positive' : 'neutral',
        intensity: Math.min(data.intensity, data.improvements.length * 2)
      }]
    });
  }

  async publishSkillLearned(characterId: string, skillName: string, skillType: string): Promise<string> {
    return await this.eventBus.publish({
      type: 'new_technique_learned',
      source: 'training_grounds',
      primaryCharacterId: characterId,
      severity: 'medium',
      category: 'training',
      description: `Learned new ${skillType} skill: ${skillName}`,
      metadata: {
        skillName,
        skillType,
        learningMethod: 'training'
      },
      tags: ['skill', 'learning', 'progression', skillType],
      emotionalImpact: [{
        characterId,
        impact: 'positive',
        intensity: 6
      }]
    });
  }

  // Social System Events
  async publishSocialInteraction(data: SocialEventData): Promise<string> {
    const eventType = this.getSocialEventType(data.eventType, data.outcome);
    const severity: EventSeverity = data.eventType === 'conflict' || data.eventType === 'argument' ? 'high' :
                                   data.outcome === 'negative' ? 'medium' : 'low';

    return await this.eventBus.publish({
      type: eventType,
      source: 'kitchen_table',
      primaryCharacterId: data.initiatorId,
      secondaryCharacterIds: data.participantIds,
      severity,
      category: 'social',
      description: `${data.eventType} in ${data.location.replace('_', ' ')}${data.topic ? ` about ${data.topic}` : ''}`,
      metadata: {
        location: data.location,
        eventType: data.eventType,
        topic: data.topic,
        outcome: data.outcome,
        witnesses: data.witnesses,
        duration: Date.now() // Could be passed in
      },
      tags: ['social', data.location, data.eventType, data.outcome],
      resolved: data.outcome === 'positive',
      emotionalImpact: [data.initiatorId, ...data.participantIds].map(characterId => ({
        characterId,
        impact: data.outcome === 'positive' ? 'positive' : 
               data.outcome === 'negative' ? 'negative' : 'neutral',
        intensity: severity === 'high' ? 7 : severity === 'medium' ? 4 : 2
      }))
    });
  }

  // Therapy System Events
  async publishTherapySession(data: TherapyEventData): Promise<string> {
    const eventType: EventType = data.breakthroughAchieved ? 'therapy_breakthrough' :
                                data.resistanceLevel > 7 ? 'therapy_resistance' :
                                'therapy_session_start';

    return await this.eventBus.publish({
      type: eventType,
      source: 'therapy_room',
      primaryCharacterId: data.characterId,
      secondaryCharacterIds: [data.therapistId],
      severity: data.breakthroughAchieved ? 'high' : 'medium',
      category: 'therapy',
      description: `${data.sessionType} therapy session with ${data.stage} stage${data.breakthroughAchieved ? ' breakthrough' : ''}`,
      metadata: {
        therapistId: data.therapistId,
        sessionType: data.sessionType,
        stage: data.stage,
        topicsDiscussed: data.topicsDiscussed,
        insights: data.insights,
        resistanceLevel: data.resistanceLevel,
        breakthroughAchieved: data.breakthroughAchieved
      },
      tags: ['therapy', data.sessionType, data.stage],
      resolved: data.breakthroughAchieved,
      emotionalImpact: [{
        characterId: data.characterId,
        impact: data.breakthroughAchieved ? 'positive' : 
               data.resistanceLevel > 7 ? 'negative' : 'neutral',
        intensity: data.breakthroughAchieved ? 8 : data.resistanceLevel
      }]
    });
  }

  // Progression System Events
  async publishLevelUp(characterId: string, newLevel: number, oldLevel: number): Promise<string> {
    return await this.eventBus.publish({
      type: 'level_up',
      source: 'battle_arena',
      primaryCharacterId: characterId,
      severity: 'medium',
      category: 'progression',
      description: `Leveled up from ${oldLevel} to ${newLevel}`,
      metadata: {
        newLevel,
        oldLevel,
        levelGain: newLevel - oldLevel
      },
      tags: ['progression', 'level_up', 'achievement'],
      emotionalImpact: [{
        characterId,
        impact: 'positive',
        intensity: 7
      }]
    });
  }

  async publishEquipmentChange(characterId: string, action: 'equipped' | 'unequipped' | 'upgraded', itemName: string, itemType: string): Promise<string> {
    return await this.eventBus.publish({
      type: action === 'upgraded' ? 'equipment_upgraded' : 'equipment_equipped',
      source: 'equipment_room',
      primaryCharacterId: characterId,
      severity: 'low',
      category: 'progression',
      description: `${action} ${itemType}: ${itemName}`,
      metadata: {
        action,
        itemName,
        itemType,
        timestamp: new Date()
      },
      tags: ['equipment', action, itemType],
      emotionalImpact: [{
        characterId,
        impact: action === 'upgraded' ? 'positive' : 'neutral',
        intensity: action === 'upgraded' ? 4 : 2
      }]
    });
  }

  // Kitchen Table Specific Events
  async publishKitchenConflict(initiatorId: string, targetId: string, conflictType: string, severity: EventSeverity, description: string): Promise<string> {
    return await this.eventBus.publish({
      type: 'kitchen_argument',
      source: 'kitchen_table',
      primaryCharacterId: initiatorId,
      secondaryCharacterIds: [targetId],
      severity,
      category: 'social',
      description,
      metadata: {
        conflictType,
        location: 'kitchen',
        trigger: conflictType,
        escalationLevel: severity === 'critical' ? 10 : severity === 'high' ? 7 : severity === 'medium' ? 4 : 2,
        resolutionAttempted: false
      },
      tags: ['kitchen', 'conflict', conflictType, severity],
      resolved: false
    });
  }

  async publishConflictResolution(eventId: string, resolutionMethod: string, mediatorId?: string): Promise<string> {
    // Update the original conflict event
    // Note: In a real implementation, you'd want to update the original event
    // For now, we'll create a resolution event

    return await this.eventBus.publish({
      type: 'conflict_resolved',
      source: 'therapy_room',
      primaryCharacterId: mediatorId || 'system',
      severity: 'medium',
      category: 'therapy',
      description: `Conflict resolved through ${resolutionMethod}`,
      metadata: {
        originalEventId: eventId,
        resolutionMethod,
        mediatorId,
        timestamp: new Date()
      },
      tags: ['resolution', 'conflict_management', resolutionMethod],
      resolved: true
    });
  }

  // Helper methods
  private getChatEventType(chatType: string): EventType {
    const typeMap: Record<string, EventType> = {
      'performance': 'performance_coaching',
      'equipment': 'equipment_advice',
      'skills': 'skill_consultation',
      'training': 'personal_training',
      'casual': 'casual_conversation'
    };
    
    return typeMap[chatType] || 'casual_conversation';
  }

  private getSocialEventType(eventType: string, outcome: string): EventType {
    if (eventType === 'conflict' || eventType === 'argument') {
      return 'kitchen_argument';
    }
    if (eventType === 'conversation' && outcome === 'positive') {
      return 'late_night_conversation';
    }
    if (eventType === 'activity') {
      return 'group_activity';
    }
    if (eventType === 'meal') {
      return 'meal_sharing';
    }
    
    return 'casual_conversation';
  }

  // Batch event publishing for complex scenarios
  async publishBattleSequence(battleData: BattleEventData): Promise<string[]> {
    const eventIds: string[] = [];
    
    // Start event
    eventIds.push(await this.publishBattleStart(battleData));
    
    // Individual actions (could be expanded)
    if (battleData.mvpPlayer) {
      eventIds.push(await this.eventBus.publish({
        type: 'individual_heroics',
        source: 'battle_arena',
        primaryCharacterId: battleData.mvpPlayer,
        severity: 'medium',
        category: 'battle',
        description: `Displayed exceptional performance as team MVP`,
        metadata: { battleType: battleData.battleType, mvpReason: 'outstanding_performance' },
        tags: ['mvp', 'heroics', 'leadership']
      }));
    }
    
    // End event
    eventIds.push(await this.publishBattleEnd(battleData));
    
    return eventIds;
  }

  // Event querying helpers
  async getRecentEvents(characterId: string, hours: number = 24): Promise<GameEvent[]> {
    return this.eventBus.getEventHistory(characterId, {
      timeRange: hours <= 1 ? '1_hour' : hours <= 6 ? '6_hours' : '1_day',
      limit: 10
    });
  }

  async getRelationshipEvents(characterId: string, targetCharacterId: string): Promise<GameEvent[]> {
    const allEvents = this.eventBus.getEventHistory(characterId, { timeRange: '2_weeks' });
    return allEvents.filter(event => 
      event.secondaryCharacterIds?.includes(targetCharacterId)
    );
  }

  // Additional alias methods for compatibility
  async publishTherapyEvent(data: TherapyEventData): Promise<string> {
    return this.publishTherapySession(data);
  }

  async publishTrainingEvent(data: TrainingEventData): Promise<string> {
    return this.publishTrainingSession(data);
  }

  async publishSocialEvent(data: SocialEventData): Promise<string> {
    return this.publishSocialInteraction(data);
  }
}

export default EventPublisher;