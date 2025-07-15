// Comprehensive test for the centralized event system
// Tests event publishing, context generation, and cross-system integration

import GameEventBus from './gameEventBus';
import EventContextService from './eventContextService';
import EventPublisher from './eventPublisher';

export class EventSystemTest {
  private eventBus = GameEventBus.getInstance();
  private eventContext = EventContextService.getInstance();
  private eventPublisher = EventPublisher.getInstance();

  async runFullEventSystemTest(): Promise<{
    success: boolean;
    results: any;
    errors: string[];
  }> {
    const results = {
      eventBusTest: null as any,
      eventPublisherTest: null as any,
      eventContextTest: null as any,
      crossSystemIntegration: null as any,
      chatIntegration: null as any
    };
    const errors: string[] = [];

    console.log('🎯 Starting Centralized Event System Test...');

    try {
      // Test 1: GameEventBus basic functionality
      console.log('1️⃣ Testing GameEventBus...');
      const testEvent = await this.eventBus.publish({
        type: 'kitchen_argument',
        source: 'kitchen_table',
        primaryCharacterId: 'achilles',
        secondaryCharacterIds: ['joan'],
        severity: 'medium',
        category: 'social',
        description: 'Heated argument over dirty dishes',
        metadata: {
          location: 'kitchen',
          trigger: 'unwashed_dishes',
          duration_minutes: 15
        },
        tags: ['kitchen', 'cleanliness', 'responsibility'],
        importance: 6
      });

      results.eventBusTest = {
        eventCreated: !!testEvent,
        eventId: testEvent?.id,
        eventStored: !!this.eventBus.getEvent(testEvent?.id || ''),
        characterIndexed: this.eventBus.getCharacterEvents('achilles').length > 0
      };

      if (!testEvent) {
        errors.push('EventBus: Failed to create event');
      }

      // Test 2: EventPublisher convenience methods
      console.log('2️⃣ Testing EventPublisher...');
      const battleEvent = await this.eventPublisher.publishBattleEvent({
        winnerId: 'achilles',
        loserId: 'joan',
        participants: ['achilles', 'joan', 'holmes'],
        battleDuration: 1200000,
        teamworkRating: 75,
        mvpPlayer: 'achilles',
        battleType: 'arena_battle',
        strategyUsed: 'aggressive_offense'
      });

      const chatEvent = await this.eventPublisher.publishChatInteraction({
        characterId: 'achilles',
        chatType: 'performance',
        message: 'How can I improve my combat technique?',
        outcome: 'helpful'
      });

      results.eventPublisherTest = {
        battleEventCreated: !!battleEvent,
        chatEventCreated: !!chatEvent,
        eventsCount: this.eventBus.getCharacterEvents('achilles').length,
        battleEventHasMetadata: !!battleEvent?.metadata?.battleDuration,
        chatEventTagged: chatEvent?.tags.includes('performance') || false
      };

      // Test 3: EventContextService context generation
      console.log('3️⃣ Testing EventContextService...');
      const performanceContext = await this.eventContext.getPerformanceContext('achilles');
      const equipmentContext = await this.eventContext.getEquipmentContext('achilles');
      const skillContext = await this.eventContext.getSkillContext('achilles');
      const socialContext = await this.eventContext.getSocialContext('achilles');

      results.eventContextTest = {
        performanceContextGenerated: !!performanceContext,
        equipmentContextGenerated: !!equipmentContext,
        skillContextGenerated: !!skillContext,
        socialContextGenerated: !!socialContext,
        performanceContextLength: performanceContext?.length || 0,
        socialContextReferencesEvents: socialContext?.includes('argument') || false
      };

      // Test 4: Cross-system integration
      console.log('4️⃣ Testing cross-system integration...');
      
      // Publish multiple event types and check integration
      await this.eventPublisher.publishTherapyEvent({
        characterId: 'achilles',
        sessionType: 'individual',
        therapistId: 'carl_jung',
        breakthroughs: ['anger_management'],
        conflictsAddressed: ['kitchen_disputes'],
        stage: 'breakthrough'
      });

      await this.eventPublisher.publishTrainingEvent({
        characterId: 'achilles',
        trainingType: 'combat_technique',
        skillsFocused: ['sword_work', 'footwork'],
        improvement: 'significant',
        mentalFatigue: 3,
        partnerCharacterId: 'joan'
      });

      // Check if events are integrated in context
      const integratedContext = await this.eventContext.getComprehensiveContext('achilles', {
        maxTokens: 200,
        domainFocus: 'general',
        includeLivingContext: true,
        includeRelationships: true
      });

      results.crossSystemIntegration = {
        totalEventsForCharacter: this.eventBus.getCharacterEvents('achilles').length,
        therapyEventRecorded: this.eventBus.getCharacterEvents('achilles').some(e => e.type === 'therapy_breakthrough'),
        trainingEventRecorded: this.eventBus.getCharacterEvents('achilles').some(e => e.type === 'training_session'),
        integratedContextGenerated: !!integratedContext,
        contextMentionsMultipleSystems: this.checkMultiSystemMention(integratedContext || '')
      };

      // Test 5: Chat component integration simulation
      console.log('5️⃣ Testing chat component integration...');
      const chatIntegrationTest = await this.simulateChatIntegration('achilles');
      results.chatIntegration = chatIntegrationTest;

      console.log('✅ Centralized Event System Test Complete');
      return {
        success: errors.length === 0,
        results,
        errors
      };

    } catch (error) {
      console.error('❌ Event System Test Failed:', error);
      errors.push(`Critical error: ${error.message}`);
      return {
        success: false,
        results,
        errors
      };
    }
  }

  private checkMultiSystemMention(context: string): boolean {
    const systemKeywords = ['battle', 'kitchen', 'therapy', 'training', 'argument', 'victory'];
    const mentions = systemKeywords.filter(keyword => 
      context.toLowerCase().includes(keyword)
    );
    return mentions.length >= 2; // Context mentions at least 2 different systems
  }

  private async simulateChatIntegration(characterId: string): Promise<any> {
    try {
      // Simulate what a chat component does
      const eventContext = await this.eventContext.getPerformanceContext(characterId);
      
      // Check if event context would be included in a chat request
      const mockChatData = {
        characterId,
        eventContext: eventContext ? {
          recentEvents: eventContext,
          relationships: '',
          emotionalState: '',
          domainSpecific: ''
        } : null
      };

      return {
        simulationSuccessful: true,
        eventContextIncluded: !!mockChatData.eventContext,
        eventContextLength: eventContext?.length || 0,
        wouldSendToBackend: !!mockChatData.eventContext?.recentEvents
      };
    } catch (error) {
      return {
        simulationSuccessful: false,
        error: error.message
      };
    }
  }

  // Quick test for browser console
  async quickEventTest(): Promise<void> {
    console.log('🚀 Quick Event System Test');
    
    try {
      // Publish a test event
      const event = await this.eventPublisher.publishChatInteraction({
        characterId: 'test_character',
        chatType: 'performance',
        message: 'Test message',
        outcome: 'helpful'
      });

      console.log('✅ Event published:', event?.id);

      // Generate context
      const context = await this.eventContext.getPerformanceContext('test_character');
      console.log('✅ Context generated:', context);

      // Check event storage
      const storedEvents = this.eventBus.getCharacterEvents('test_character');
      console.log('✅ Events stored:', storedEvents.length);

      console.log('🎯 Event system working!');
    } catch (error) {
      console.error('❌ Quick test failed:', error);
    }
  }

  // Test relationship tracking
  async testRelationshipSystem(): Promise<void> {
    console.log('💕 Testing Relationship System');
    
    try {
      // Create relationship-affecting events
      await this.eventPublisher.publishSocialEvent({
        eventType: 'kitchen_argument',
        primaryCharacterId: 'achilles',
        secondaryCharacterIds: ['joan'],
        severity: 'medium',
        outcome: 'unresolved',
        location: 'kitchen'
      });

      await this.eventPublisher.publishBattleEvent({
        winnerId: 'achilles',
        loserId: 'enemy_team',
        participants: ['achilles', 'joan', 'holmes'],
        battleDuration: 1000000,
        teamworkRating: 90,
        mvpPlayer: 'achilles',
        battleType: 'arena_battle',
        strategyUsed: 'collaborative'
      });

      // Check relationship summary
      const relationships = this.eventBus.getRelationshipSummary('achilles');
      console.log('📊 Relationships tracked:', relationships.size);

      for (const [characterId, relationship] of relationships.entries()) {
        console.log(`  ${characterId}: Trust ${relationship.trustLevel}, Respect ${relationship.respectLevel}`);
      }

      console.log('✅ Relationship system working!');
    } catch (error) {
      console.error('❌ Relationship test failed:', error);
    }
  }

  // Test memory persistence
  async testMemorySystem(): Promise<void> {
    console.log('🧠 Testing Memory System');
    
    try {
      // Create memorable events
      await this.eventBus.publish({
        type: 'battle_victory',
        source: 'battle_arena',
        primaryCharacterId: 'achilles',
        severity: 'high',
        category: 'battle',
        description: 'Epic victory against overwhelming odds',
        metadata: { epic: true, odds: '3:1' },
        tags: ['epic', 'victory', 'legendary'],
        importance: 9
      });

      // Get character memories
      const memories = this.eventBus.getCharacterMemories('achilles');
      console.log('💭 Memories stored:', memories.length);

      const importantMemories = memories.filter(m => m.importance >= 7);
      console.log('⭐ Important memories:', importantMemories.length);

      if (importantMemories.length > 0) {
        console.log('📖 Sample memory:', importantMemories[0].content);
      }

      console.log('✅ Memory system working!');
    } catch (error) {
      console.error('❌ Memory test failed:', error);
    }
  }
}

// Export for easy testing
export const eventSystemTest = new EventSystemTest();

// Make available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).eventSystemTest = eventSystemTest;
}