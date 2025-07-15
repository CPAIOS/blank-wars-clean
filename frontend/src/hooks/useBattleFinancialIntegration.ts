// Hook for integrating battle events with financial decisions
// Demonstrates how the battle financial system works in practice

import { useState, useCallback, useEffect } from 'react';
import { BattleCharacter, BattleState, MoraleEvent } from '../data/battleFlow';
import BattleFinancialIntegration from '../services/battleFinancialIntegration';
import { WildcardDecision } from '../services/battleFinancialService';

export interface BattleFinancialState {
  pendingDecisions: Map<string, WildcardDecision[]>;
  financialModifiers: Map<string, any>;
  activeWildcards: WildcardDecision[];
  battleEarnings: Map<string, number>;
}

export const useBattleFinancialIntegration = () => {
  const [battleFinancialState, setBattleFinancialState] = useState<BattleFinancialState>({
    pendingDecisions: new Map(),
    financialModifiers: new Map(),
    activeWildcards: [],
    battleEarnings: new Map()
  });

  const [integration] = useState(() => BattleFinancialIntegration.getInstance());

  /**
   * Initialize financial integration for a battle
   */
  const initializeBattleFinancialIntegration = useCallback(async (battleState: BattleState) => {
    try {
      await integration.initializeBattleFinancialState(battleState);
      
      // Calculate initial financial modifiers for all characters
      const newModifiers = new Map();
      const allCharacters = [
        ...battleState.teams.player.characters,
        ...battleState.teams.opponent.characters
      ];

      for (const character of allCharacters) {
        const effects = integration.calculateFinancialStressEffects(character);
        newModifiers.set(character.id, effects);
      }

      setBattleFinancialState(prev => ({
        ...prev,
        financialModifiers: newModifiers,
        pendingDecisions: new Map(),
        activeWildcards: []
      }));

      console.log('Battle financial integration initialized for', allCharacters.length, 'characters');
    } catch (error) {
      console.error('Error initializing battle financial integration:', error);
    }
  }, [integration]);

  /**
   * Process a battle event that might trigger financial decisions
   */
  const processBattleEvent = useCallback(async (
    character: BattleCharacter,
    event: MoraleEvent,
    battleState: BattleState
  ) => {
    try {
      // Process event through integration layer
      await integration.processBattleEvent(character, event, battleState);
      
      // Get updated pending decisions
      const pendingDecisions = integration.getPendingWildcardDecisions(character.id);
      
      // Update state
      setBattleFinancialState(prev => {
        const newPending = new Map(prev.pendingDecisions);
        newPending.set(character.id, pendingDecisions);
        
        return {
          ...prev,
          pendingDecisions: newPending,
          activeWildcards: [...prev.activeWildcards, ...pendingDecisions.filter(d => d.urgency === 'immediate')]
        };
      });

      // Auto-execute immediate decisions
      if (pendingDecisions.some(d => d.urgency === 'immediate')) {
        await integration.executeImmediateWildcardDecisions(character.id);
      }

      console.log(`Processed ${event.eventType} for ${character.name}, ${pendingDecisions.length} decisions pending`);
    } catch (error) {
      console.error('Error processing battle event:', error);
    }
  }, [integration]);

  /**
   * Get enhanced AI ability selection for a character
   */
  const getEnhancedAIAbilitySelection = useCallback((
    character: BattleCharacter,
    availableAbilities: any[],
    battleState: BattleState
  ) => {
    try {
      return integration.enhanceAIAbilitySelection(character, availableAbilities, battleState);
    } catch (error) {
      console.error('Error enhancing AI ability selection:', error);
      return availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
    }
  }, [integration]);

  /**
   * Apply financial stress modifiers to a character
   */
  const applyFinancialStressModifiers = useCallback((character: BattleCharacter): BattleCharacter => {
    try {
      return integration.applyFinancialStressModifiers(character);
    } catch (error) {
      console.error('Error applying financial stress modifiers:', error);
      return character;
    }
  }, [integration]);

  /**
   * Get pending wildcard decisions for a character
   */
  const getPendingWildcardDecisions = useCallback((characterId: string): WildcardDecision[] => {
    return battleFinancialState.pendingDecisions.get(characterId) || [];
  }, [battleFinancialState.pendingDecisions]);

  /**
   * Process a wildcard decision manually (for UI interaction)
   */
  const processWildcardDecision = useCallback(async (
    decision: WildcardDecision,
    selectedOption: any
  ) => {
    try {
      await integration.processWildcardDecision(decision, selectedOption);
      
      // Remove from pending decisions
      setBattleFinancialState(prev => {
        const newPending = new Map(prev.pendingDecisions);
        const characterDecisions = newPending.get(decision.characterId) || [];
        const filteredDecisions = characterDecisions.filter(d => d.decisionId !== decision.decisionId);
        newPending.set(decision.characterId, filteredDecisions);
        
        return {
          ...prev,
          pendingDecisions: newPending,
          activeWildcards: prev.activeWildcards.filter(d => d.decisionId !== decision.decisionId)
        };
      });

      console.log(`Processed wildcard decision ${decision.decisionType} for ${decision.characterId}`);
    } catch (error) {
      console.error('Error processing wildcard decision:', error);
    }
  }, [integration]);

  /**
   * Finalize battle financial state
   */
  const finalizeBattleFinancialState = useCallback(async (battleState: BattleState) => {
    try {
      await integration.finalizeBattleFinancialState(battleState);
      
      // Clear local state
      setBattleFinancialState({
        pendingDecisions: new Map(),
        financialModifiers: new Map(),
        activeWildcards: [],
        battleEarnings: new Map()
      });

      console.log('Battle financial integration finalized');
    } catch (error) {
      console.error('Error finalizing battle financial state:', error);
    }
  }, [integration]);

  /**
   * Get financial effects for a character
   */
  const getFinancialEffects = useCallback((characterId: string) => {
    return battleFinancialState.financialModifiers.get(characterId);
  }, [battleFinancialState.financialModifiers]);

  /**
   * Example usage demonstration
   */
  const demonstrateIntegration = useCallback(async () => {
    console.log('=== Battle Financial Integration Demo ===');
    
    // Mock battle state
    const mockBattleState: Partial<BattleState> = {
      teams: {
        player: {
          characters: [
            {
              id: 'char1',
              name: 'Test Character',
              financials: { wallet: 25000, monthlyEarnings: 3000 },
              financialPersonality: { 
                spendingStyle: 'impulsive', 
                riskTolerance: 75,
                financialWisdom: 40
              },
              psychStats: { mentalHealth: 60, ego: 70, teamPlayer: 50 }
            } as BattleCharacter
          ]
        },
        opponent: { characters: [] }
      }
    };

    // Initialize integration
    await initializeBattleFinancialIntegration(mockBattleState as BattleState);

    // Simulate battle events
    const testCharacter = mockBattleState.teams!.player.characters[0];
    
    // Victory event
    const victoryEvent: MoraleEvent = {
      eventType: 'victory',
      description: 'Character achieved victory!',
      moraleImpact: 30,
      affectedTeam: 'player'
    };
    
    await processBattleEvent(testCharacter, victoryEvent, mockBattleState as BattleState);

    // Critical hit event
    const criticalEvent: MoraleEvent = {
      eventType: 'critical_hit',
      description: 'Landed a critical hit!',
      moraleImpact: 20,
      affectedTeam: 'player'
    };
    
    await processBattleEvent(testCharacter, criticalEvent, mockBattleState as BattleState);

    console.log('Demo completed - check console for integration results');
  }, [initializeBattleFinancialIntegration, processBattleEvent]);

  return {
    // State
    battleFinancialState,
    
    // Core functions
    initializeBattleFinancialIntegration,
    processBattleEvent,
    getEnhancedAIAbilitySelection,
    applyFinancialStressModifiers,
    finalizeBattleFinancialState,
    
    // Decision management
    getPendingWildcardDecisions,
    processWildcardDecision,
    
    // Utilities
    getFinancialEffects,
    demonstrateIntegration
  };
};

export default useBattleFinancialIntegration;