// Battle Financial Integration Service
// Connects battle events to financial decision-making and AI behavior

import { BattleCharacter, BattleState, MoraleEvent } from '../data/battleFlow';
import BattleFinancialService, { WildcardDecision, BattleFinancialState } from './battleFinancialService';
import FinancialPsychologyService from './financialPsychologyService';
import GameEventBus from './gameEventBus';
import { makeFinancialJudgeDecision, FinancialEventContext } from '../data/aiJudgeSystem';
import { FinancialDecision } from '../data/characters';

export interface BattleFinancialModifiers {
  characterId: string;
  stressModifier: number; // -50 to +50, affects battle performance
  confidenceModifier: number; // -50 to +50, affects ability selection
  riskTolerance: number; // 0-100, affects AI decision making
  teamworkModifier: number; // -25 to +25, affects team synergy
  focusModifier: number; // -25 to +25, affects accuracy
}

export interface FinancialStressEffects {
  statModifiers: {
    strength: number;
    dexterity: number;
    intelligence: number;
    charisma: number;
    vitality: number;
    speed: number;
  };
  mentalEffects: {
    anxiety: number;
    focus: number;
    decisionQuality: number;
  };
  battleBehavior: {
    aggressiveness: number;
    teamwork: number;
    riskTaking: number;
  };
}

export class BattleFinancialIntegration {
  private static instance: BattleFinancialIntegration;
  private battleFinancialService: BattleFinancialService;
  private psychologyService: FinancialPsychologyService;
  private eventBus: GameEventBus;
  private activeDecisions: Map<string, WildcardDecision[]> = new Map();

  private constructor() {
    this.battleFinancialService = BattleFinancialService.getInstance();
    this.psychologyService = FinancialPsychologyService.getInstance();
    this.eventBus = GameEventBus.getInstance();
  }

  static getInstance(): BattleFinancialIntegration {
    if (!BattleFinancialIntegration.instance) {
      BattleFinancialIntegration.instance = new BattleFinancialIntegration();
    }
    return BattleFinancialIntegration.instance;
  }

  /**
   * Initialize financial state for all characters entering battle
   */
  async initializeBattleFinancialState(battleState: BattleState): Promise<void> {
    const allCharacters = [
      ...battleState.teams.player.characters,
      ...battleState.teams.opponent.characters
    ];

    for (const character of allCharacters) {
      // Initialize battle financial state
      this.battleFinancialService.initializeBattleFinancialState(character);
      
      // Initialize active decisions list
      this.activeDecisions.set(character.id, []);
    }
  }

  /**
   * Calculate financial stress effects on battle performance
   */
  calculateFinancialStressEffects(character: BattleCharacter): FinancialStressEffects {
    const financialStress = this.calculateCharacterFinancialStress(character);
    const stressLevel = financialStress / 100; // Normalize to 0-1

    return {
      statModifiers: {
        strength: Math.round(-stressLevel * 15), // High stress reduces physical performance
        dexterity: Math.round(-stressLevel * 10), // Stress affects coordination
        intelligence: Math.round(-stressLevel * 20), // Financial worry clouds judgment
        charisma: Math.round(-stressLevel * 12), // Stress affects social presence
        vitality: Math.round(-stressLevel * 8), // Stress drains energy
        speed: Math.round(-stressLevel * 5), // Slight speed reduction
      },
      mentalEffects: {
        anxiety: Math.round(stressLevel * 40), // 0-40 anxiety points
        focus: Math.round(-stressLevel * 30), // -30 to 0 focus
        decisionQuality: Math.round(-stressLevel * 25), // -25 to 0 decision quality
      },
      battleBehavior: {
        aggressiveness: Math.round(stressLevel * 20), // Stress can make characters more aggressive
        teamwork: Math.round(-stressLevel * 15), // Hard to work with others when stressed
        riskTaking: Math.round(stressLevel * 25), // Desperate behavior
      }
    };
  }

  /**
   * Apply financial stress modifiers to character's effective stats
   */
  applyFinancialStressModifiers(character: BattleCharacter): BattleCharacter {
    const effects = this.calculateFinancialStressEffects(character);
    
    // Apply stat modifiers
    const modifiedCharacter = { ...character };
    
    // Apply temporary stat modifications
    if (modifiedCharacter.temporaryStats) {
      modifiedCharacter.temporaryStats.strength += effects.statModifiers.strength;
      modifiedCharacter.temporaryStats.dexterity += effects.statModifiers.dexterity;
      modifiedCharacter.temporaryStats.intelligence += effects.statModifiers.intelligence;
      modifiedCharacter.temporaryStats.charisma += effects.statModifiers.charisma;
      modifiedCharacter.temporaryStats.vitality += effects.statModifiers.vitality;
      modifiedCharacter.temporaryStats.speed += effects.statModifiers.speed;
    }

    // Apply psychological effects
    if (modifiedCharacter.psychStats) {
      modifiedCharacter.psychStats.mentalHealth = Math.max(0, 
        modifiedCharacter.psychStats.mentalHealth - effects.mentalEffects.anxiety
      );
      modifiedCharacter.psychStats.training = Math.max(0,
        modifiedCharacter.psychStats.training + effects.mentalEffects.focus
      );
    }

    return modifiedCharacter;
  }

  /**
   * Enhance AI ability selection with financial risk assessment
   */
  enhanceAIAbilitySelection(
    character: BattleCharacter,
    availableAbilities: any[],
    battleState: BattleState
  ): any {
    
    const effects = this.calculateFinancialStressEffects(character);
    const riskTolerance = this.calculateRiskTolerance(character, effects);
    
    // Filter abilities based on risk tolerance
    const suitableAbilities = availableAbilities.filter(ability => {
      const abilityRisk = this.calculateAbilityRisk(ability);
      return abilityRisk <= riskTolerance;
    });

    // If no suitable abilities (very low risk tolerance), use safest option
    if (suitableAbilities.length === 0) {
      return this.findSafestAbility(availableAbilities);
    }

    // Weight abilities based on financial psychology
    const weightedAbilities = suitableAbilities.map(ability => ({
      ...ability,
      weight: this.calculateAbilityWeight(ability, character, effects)
    }));

    // Select ability using weighted random selection
    return this.selectWeightedAbility(weightedAbilities);
  }

  /**
   * Process battle events that could trigger financial decisions
   */
  async processBattleEvent(
    character: BattleCharacter,
    event: MoraleEvent,
    battleState: BattleState
  ): Promise<void> {
    
    // Process event through battle financial service
    const wildcardDecision = await this.battleFinancialService.processBattleEvent(
      character,
      event,
      battleState
    );

    if (wildcardDecision) {
      // Add to active decisions
      const characterDecisions = this.activeDecisions.get(character.id) || [];
      characterDecisions.push(wildcardDecision);
      this.activeDecisions.set(character.id, characterDecisions);

      // Publish battle financial decision event
      await this.eventBus.publishFinancialEvent(
        'battle_financial_decision',
        character.id,
        `${character.name} triggered ${wildcardDecision.decisionType} decision from ${event.eventType}`,
        {
          battleEvent: event.eventType,
          decisionType: wildcardDecision.decisionType,
          amount: wildcardDecision.amount,
          urgency: wildcardDecision.urgency,
          riskLevel: wildcardDecision.riskLevel,
          type: 'battle_triggered'
        },
        event.eventType === 'victory' ? 'high' : 'critical'
      );
    }
  }

  /**
   * Auto-execute immediate wildcard decisions using AI
   */
  async executeImmediateWildcardDecisions(characterId: string): Promise<void> {
    const decisions = this.activeDecisions.get(characterId) || [];
    const immediateDecisions = decisions.filter(d => d.urgency === 'immediate');

    for (const decision of immediateDecisions) {
      const selectedOption = await this.selectWildcardOptionUsingAI(decision);
      
      if (selectedOption) {
        await this.processWildcardDecision(decision, selectedOption);
        
        // Remove from active decisions
        const remainingDecisions = decisions.filter(d => d.decisionId !== decision.decisionId);
        this.activeDecisions.set(characterId, remainingDecisions);
      }
    }
  }

  /**
   * Get pending wildcard decisions for a character
   */
  getPendingWildcardDecisions(characterId: string): WildcardDecision[] {
    return this.activeDecisions.get(characterId) || [];
  }

  /**
   * Process a wildcard decision outcome
   */
  async processWildcardDecision(
    decision: WildcardDecision,
    selectedOption: any
  ): Promise<void> {
    
    // Simulate outcome based on option risk and character state
    const outcome = this.simulateWildcardOutcome(decision, selectedOption);
    
    // Apply financial impact
    await this.applyFinancialImpact(decision.characterId, outcome);
    
    // Create actual FinancialDecision record for judge evaluation
    const actualDecision: FinancialDecision = {
      id: `${decision.decisionId}_outcome`,
      characterId: decision.characterId,
      amount: decision.amount,
      decision: 'wildcard',
      outcome: outcome.result === 'positive' ? 'positive' : outcome.result === 'negative' ? 'negative' : 'neutral',
      coachAdvice: decision.aiRecommendation,
      followedAdvice: false, // Wildcard decisions are emotional, not coach-driven
      timestamp: new Date(),
      description: `${decision.decisionType}: ${selectedOption.name}`,
      financialImpact: outcome.financialImpact,
      stressImpact: outcome.stressImpact,
      relationshipImpact: 0 // May be calculated elsewhere
    };

    // Get current character financial state for accurate stress level
    const battleFinancialState = this.battleFinancialService.getBattleFinancialState(decision.characterId);
    const currentStress = battleFinancialState ? 
      this.calculateStressFromBattleState(battleFinancialState) : 
      50; // Default if state not found

    // Get AI Judge evaluation of the actual outcome
    const context: FinancialEventContext = {
      characterId: decision.characterId,
      eventType: 'outcome',
      financialImpact: outcome.financialImpact,
      stressLevel: currentStress,
      coachInvolvement: !!decision.aiRecommendation,
      battleContext: {
        emotionalState: this.summarizeEmotionalState(battleFinancialState?.emotionalState),
        triggerEvent: decision.decisionType,
        performanceLevel: battleFinancialState ? 
          this.assessPerformanceLevel(battleFinancialState.battlePerformance) : 
          'unknown'
      }
    };

    const judgeEvaluation = makeFinancialJudgeDecision(
      context, 
      actualDecision, 
      {
        success: outcome.result === 'positive',
        actualImpact: outcome.financialImpact,
        stressChange: outcome.stressImpact
      }
    );

    // Publish judge evaluation
    await this.eventBus.publishFinancialEvent(
      'judge_financial_outcome_assessment',
      decision.characterId,
      `AI Judge evaluation: ${judgeEvaluation.ruling}`,
      {
        judgeRuling: judgeEvaluation.ruling,
        judgeCommentary: judgeEvaluation.commentary,
        riskAssessment: judgeEvaluation.riskAssessment,
        coachEvaluation: judgeEvaluation.coachEvaluation,
        interventionRecommendation: judgeEvaluation.interventionRecommendation,
        originalDecision: decision.decisionType,
        selectedOption: selectedOption.name,
        type: 'judge_evaluation'
      },
      judgeEvaluation.riskAssessment === 'catastrophic' ? 'critical' : 
      judgeEvaluation.riskAssessment === 'poor' ? 'high' : 'medium'
    );
    
    // Publish outcome event
    await this.eventBus.publishFinancialEvent(
      decision.decisionType as any,
      decision.characterId,
      `${decision.characterId} executed ${selectedOption.name}: ${outcome.description}`,
      {
        originalDecision: decision.decisionType,
        selectedOption: selectedOption.name,
        financialImpact: outcome.financialImpact,
        stressImpact: outcome.stressImpact,
        outcome: outcome.result,
        type: 'wildcard_outcome'
      },
      outcome.result === 'negative' ? 'high' : 'medium'
    );
  }

  /**
   * Finalize battle financial state
   */
  async finalizeBattleFinancialState(battleState: BattleState): Promise<void> {
    const allCharacters = [
      ...battleState.teams.player.characters,
      ...battleState.teams.opponent.characters
    ];

    for (const character of allCharacters) {
      // Process any remaining post-battle decisions
      await this.processPostBattleDecisions(character.id);
      
      // Clean up battle state
      this.battleFinancialService.finalizeBattleFinancialState(character.id);
      this.activeDecisions.delete(character.id);
    }
  }

  // Private helper methods
  private calculateStressFromBattleState(state: BattleFinancialState): number {
    // Calculate stress based on emotional state
    const adrenaline = state.emotionalState.adrenalineLevel;
    const frustration = state.emotionalState.defeatFrustration;
    const confidence = state.emotionalState.confidence;
    
    // High adrenaline and frustration = high stress, confidence reduces stress
    return Math.max(0, Math.min(100, (adrenaline + frustration) / 2 - confidence / 3));
  }

  private summarizeEmotionalState(emotional?: any): string {
    if (!emotional) return 'neutral';
    
    const states = [];
    if (emotional.adrenalineLevel > 70) states.push('high_adrenaline');
    if (emotional.confidence > 80) states.push('confident');
    if (emotional.defeatFrustration > 60) states.push('frustrated');
    if (emotional.victoryEuphoria > 70) states.push('euphoric');
    if (emotional.prideLevel > 80) states.push('proud');
    
    return states.length > 0 ? states.join('_') : 'neutral';
  }

  private assessPerformanceLevel(performance?: any): string {
    if (!performance) return 'unknown';
    
    const score = (
      performance.victoryContribution * 0.3 +
      performance.teamworkScore * 0.2 +
      performance.criticalHits * 10 +
      performance.heroicActions * 15 +
      (performance.survivalRate / 100) * 25
    );
    
    if (score > 80) return 'excellent';
    if (score > 60) return 'good';
    if (score > 40) return 'average';
    if (score > 20) return 'poor';
    return 'terrible';
  }

  private calculateCharacterFinancialStress(character: BattleCharacter): number {
    if (!character.financials || !character.financialPersonality) return 0;

    const stressAnalysis = this.psychologyService.calculateFinancialStress(
      character.id,
      character.financials.wallet || 0,
      character.financials.monthlyEarnings || 0,
      character.financials.recentDecisions || [],
      character.financialPersonality
    );

    return stressAnalysis.stress;
  }

  private calculateRiskTolerance(character: BattleCharacter, effects: FinancialStressEffects): number {
    const baseRiskTolerance = character.financialPersonality?.riskTolerance || 50;
    const stressModifier = effects.battleBehavior.riskTaking;
    const confidenceModifier = character.psychStats?.mentalHealth || 50;
    
    return Math.max(0, Math.min(100, baseRiskTolerance + stressModifier + (confidenceModifier - 50) * 0.5));
  }

  private calculateAbilityRisk(ability: any): number {
    // Mock risk calculation - in real implementation, this would be based on ability properties
    if (ability.type === 'aggressive') return 80;
    if (ability.type === 'defensive') return 20;
    if (ability.type === 'balanced') return 50;
    return 40;
  }

  private findSafestAbility(abilities: any[]): any {
    return abilities.reduce((safest, current) => 
      this.calculateAbilityRisk(current) < this.calculateAbilityRisk(safest) ? current : safest
    );
  }

  private calculateAbilityWeight(ability: any, character: BattleCharacter, effects: FinancialStressEffects): number {
    let weight = 1;
    
    // High stress characters prefer aggressive abilities
    if (effects.battleBehavior.aggressiveness > 15 && ability.type === 'aggressive') {
      weight *= 1.5;
    }
    
    // Low teamwork characters avoid team abilities
    if (effects.battleBehavior.teamwork < -10 && ability.type === 'team') {
      weight *= 0.5;
    }
    
    // High risk tolerance characters prefer risky abilities
    const riskTolerance = this.calculateRiskTolerance(character, effects);
    const abilityRisk = this.calculateAbilityRisk(ability);
    
    if (riskTolerance > 70 && abilityRisk > 60) {
      weight *= 1.3;
    }
    
    return weight;
  }

  private selectWeightedAbility(weightedAbilities: any[]): any {
    const totalWeight = weightedAbilities.reduce((sum, ability) => sum + ability.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const ability of weightedAbilities) {
      currentWeight += ability.weight;
      if (random <= currentWeight) {
        return ability;
      }
    }
    
    return weightedAbilities[0]; // Fallback
  }

  private async selectWildcardOptionUsingAI(decision: WildcardDecision): Promise<any> {
    // AI selection based on emotional appeal vs logical score
    const options = decision.options;
    
    // For immediate decisions, AI tends to be more emotional
    const emotionalWeight = decision.urgency === 'immediate' ? 0.7 : 0.3;
    const logicalWeight = 1 - emotionalWeight;
    
    const scoredOptions = options.map(option => ({
      ...option,
      aiScore: (option.emotionalAppeal * emotionalWeight) + (option.logicalScore * logicalWeight)
    }));
    
    // Add some randomness to avoid completely predictable behavior
    const randomizedOptions = scoredOptions.map(option => ({
      ...option,
      finalScore: option.aiScore + (Math.random() - 0.5) * 20
    }));
    
    return randomizedOptions.reduce((best, current) => 
      current.finalScore > best.finalScore ? current : best
    );
  }

  private simulateWildcardOutcome(decision: WildcardDecision, selectedOption: any): any {
    // Simulate outcome based on option risk and random factors
    const random = Math.random();
    
    if (random < 0.2) {
      return {
        result: 'positive',
        description: selectedOption.outcomes.best.description,
        financialImpact: selectedOption.outcomes.best.financialImpact,
        stressImpact: selectedOption.outcomes.best.stressImpact
      };
    } else if (random < 0.8) {
      return {
        result: 'neutral',
        description: selectedOption.outcomes.likely.description,
        financialImpact: selectedOption.outcomes.likely.financialImpact,
        stressImpact: selectedOption.outcomes.likely.stressImpact
      };
    } else {
      return {
        result: 'negative',
        description: selectedOption.outcomes.worst.description,
        financialImpact: selectedOption.outcomes.worst.financialImpact,
        stressImpact: selectedOption.outcomes.worst.stressImpact
      };
    }
  }

  private async applyFinancialImpact(characterId: string, outcome: any): Promise<void> {
    // In a real implementation, this would update the character's financial state
    console.log(`Applied financial impact to ${characterId}:`, outcome);
  }

  private async processPostBattleDecisions(characterId: string): Promise<void> {
    const decisions = this.activeDecisions.get(characterId) || [];
    const postBattleDecisions = decisions.filter(d => d.urgency === 'post_battle');

    for (const decision of postBattleDecisions) {
      const selectedOption = await this.selectWildcardOptionUsingAI(decision);
      if (selectedOption) {
        await this.processWildcardDecision(decision, selectedOption);
      }
    }
  }
}

export default BattleFinancialIntegration;