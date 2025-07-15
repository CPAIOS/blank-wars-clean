// Battle Financial Service - AI-Driven Financial Wildcard Decisions
// Integrates financial psychology with battle outcomes for dynamic decision-making

import { BattleCharacter, BattleState, MoraleEvent } from '../data/battleFlow';
import { FinancialDecision, FinancialPersonality } from '../data/characters';
import FinancialPsychologyService from './financialPsychologyService';
import GameEventBus from './gameEventBus';

export interface BattleFinancialState {
  characterId: string;
  preEarnings: number;
  currentEarnings: number;
  battlePerformance: BattlePerformanceMetrics;
  emotionalState: BattleEmotionalState;
  wildcardTriggers: WildcardTrigger[];
}

export interface BattlePerformanceMetrics {
  damageDealt: number;
  damageTaken: number;
  criticalHits: number;
  heroicActions: number;
  teamworkScore: number;
  survivalRate: number; // 0-100%
  comebackMoments: number;
  victoryContribution: number; // 0-100%
}

export interface BattleEmotionalState {
  adrenalineLevel: number; // 0-100, affects risk tolerance
  confidence: number; // 0-100, from battle performance
  teamBondFeeling: number; // 0-100, affects generous decisions
  victoryEuphoria: number; // 0-100, affects impulsive spending
  defeatFrustration: number; // 0-100, affects desperate decisions
  prideLevel: number; // 0-100, affects showing off decisions
}

export interface WildcardTrigger {
  triggerType: 'critical_hit' | 'near_death' | 'comeback' | 'victory' | 'defeat' | 'heroic_save' | 'betrayal' | 'ally_down';
  intensity: number; // 0-100, how intense the moment was
  timestamp: Date;
  description: string;
  financialImpact: 'impulsive_spending' | 'conservative_saving' | 'risky_investment' | 'generous_giving' | 'desperate_gamble';
}

export interface WildcardDecision {
  decisionId: string;
  characterId: string;
  triggerEvent: WildcardTrigger;
  decisionType: 'victory_splurge' | 'defeat_desperation' | 'adrenaline_investment' | 'team_celebration' | 'pride_purchase' | 'panic_selling';
  amount: number;
  options: WildcardOption[];
  urgency: 'immediate' | 'post_battle' | 'next_day';
  aiRecommendation?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

export interface WildcardOption {
  id: string;
  name: string;
  description: string;
  amount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  emotionalAppeal: number; // 0-100, how appealing in current emotional state
  logicalScore: number; // 0-100, how logical the choice is
  outcomes: {
    best: { description: string; financialImpact: number; stressImpact: number };
    likely: { description: string; financialImpact: number; stressImpact: number };
    worst: { description: string; financialImpact: number; stressImpact: number };
  };
}

export class BattleFinancialService {
  private static instance: BattleFinancialService;
  private psychologyService: FinancialPsychologyService;
  private eventBus: GameEventBus;
  private battleStates: Map<string, BattleFinancialState> = new Map();

  private constructor() {
    this.psychologyService = FinancialPsychologyService.getInstance();
    this.eventBus = GameEventBus.getInstance();
  }

  static getInstance(): BattleFinancialService {
    if (!BattleFinancialService.instance) {
      BattleFinancialService.instance = new BattleFinancialService();
    }
    return BattleFinancialService.instance;
  }

  /**
   * Initialize financial state tracking for a character entering battle
   */
  initializeBattleFinancialState(character: BattleCharacter): void {
    const state: BattleFinancialState = {
      characterId: character.id,
      preEarnings: character.financials?.wallet || 0,
      currentEarnings: 0,
      battlePerformance: {
        damageDealt: 0,
        damageTaken: 0,
        criticalHits: 0,
        heroicActions: 0,
        teamworkScore: 50,
        survivalRate: 100,
        comebackMoments: 0,
        victoryContribution: 0
      },
      emotionalState: {
        adrenalineLevel: 30,
        confidence: character.psychStats?.mentalHealth || 50,
        teamBondFeeling: character.psychStats?.teamPlayer || 50,
        victoryEuphoria: 0,
        defeatFrustration: 0,
        prideLevel: character.psychStats?.ego || 50
      },
      wildcardTriggers: []
    };

    this.battleStates.set(character.id, state);
  }

  /**
   * Process battle events that could trigger financial decisions
   */
  async processBattleEvent(
    character: BattleCharacter,
    event: MoraleEvent,
    battleState: BattleState
  ): Promise<WildcardDecision | null> {
    
    const financialState = this.battleStates.get(character.id);
    if (!financialState) return null;

    // Update emotional state based on event
    this.updateEmotionalState(financialState, event);

    // Check if this event should trigger a wildcard decision
    const wildcardTrigger = this.evaluateWildcardTrigger(event, financialState, character);
    if (!wildcardTrigger) return null;

    // Add trigger to history
    financialState.wildcardTriggers.push(wildcardTrigger);

    // Generate AI-driven wildcard decision
    const wildcardDecision = await this.generateWildcardDecision(
      character,
      wildcardTrigger,
      financialState,
      battleState
    );

    // Publish wildcard decision event
    await this.eventBus.publishFinancialEvent(
      'financial_wildcard_triggered',
      character.id,
      `${character.name} triggered ${wildcardTrigger.triggerType} wildcard decision: ${wildcardDecision.decisionType}`,
      {
        triggerEvent: wildcardTrigger.triggerType,
        decisionType: wildcardDecision.decisionType,
        amount: wildcardDecision.amount,
        riskLevel: wildcardDecision.riskLevel,
        type: 'wildcard_trigger'
      },
      wildcardDecision.riskLevel === 'extreme' ? 'critical' : 'high'
    );

    return wildcardDecision;
  }

  /**
   * Update character's emotional state based on battle events
   */
  private updateEmotionalState(state: BattleFinancialState, event: MoraleEvent): void {
    switch (event.eventType) {
      case 'critical_hit':
        state.emotionalState.adrenalineLevel = Math.min(100, state.emotionalState.adrenalineLevel + 25);
        state.emotionalState.confidence = Math.min(100, state.emotionalState.confidence + 15);
        state.emotionalState.prideLevel = Math.min(100, state.emotionalState.prideLevel + 20);
        break;
        
      case 'near_death':
        state.emotionalState.adrenalineLevel = Math.min(100, state.emotionalState.adrenalineLevel + 40);
        state.emotionalState.confidence = Math.max(0, state.emotionalState.confidence - 20);
        break;
        
      case 'comeback':
        state.emotionalState.adrenalineLevel = Math.min(100, state.emotionalState.adrenalineLevel + 35);
        state.emotionalState.confidence = Math.min(100, state.emotionalState.confidence + 30);
        state.emotionalState.prideLevel = Math.min(100, state.emotionalState.prideLevel + 25);
        break;
        
      case 'victory':
        state.emotionalState.victoryEuphoria = Math.min(100, state.emotionalState.victoryEuphoria + 50);
        state.emotionalState.confidence = Math.min(100, state.emotionalState.confidence + 25);
        state.emotionalState.prideLevel = Math.min(100, state.emotionalState.prideLevel + 20);
        break;
        
      case 'defeat':
        state.emotionalState.defeatFrustration = Math.min(100, state.emotionalState.defeatFrustration + 40);
        state.emotionalState.confidence = Math.max(0, state.emotionalState.confidence - 30);
        break;
        
      case 'heroic_save':
        state.emotionalState.teamBondFeeling = Math.min(100, state.emotionalState.teamBondFeeling + 30);
        state.emotionalState.prideLevel = Math.min(100, state.emotionalState.prideLevel + 25);
        break;
        
      case 'betrayal':
        state.emotionalState.teamBondFeeling = Math.max(0, state.emotionalState.teamBondFeeling - 40);
        state.emotionalState.defeatFrustration = Math.min(100, state.emotionalState.defeatFrustration + 30);
        break;
        
      case 'ally_down':
        state.emotionalState.teamBondFeeling = Math.max(0, state.emotionalState.teamBondFeeling - 20);
        state.emotionalState.confidence = Math.max(0, state.emotionalState.confidence - 15);
        break;
    }
  }

  /**
   * Evaluate if a battle event should trigger a wildcard financial decision
   */
  private evaluateWildcardTrigger(
    event: MoraleEvent,
    state: BattleFinancialState,
    character: BattleCharacter
  ): WildcardTrigger | null {
    
    const personality = character.financialPersonality;
    const currentStress = this.calculateCurrentStress(state, personality);
    
    // Base trigger chances for different event types
    const baseTriggerChances = {
      'critical_hit': 0.3,
      'near_death': 0.4,
      'comeback': 0.5,
      'victory': 0.6,
      'defeat': 0.4,
      'heroic_save': 0.3,
      'betrayal': 0.2,
      'ally_down': 0.1
    };
    
    let triggerChance = baseTriggerChances[event.eventType] || 0;
    
    // Personality modifiers
    if (personality?.spendingStyle === 'impulsive') {
      triggerChance *= 1.5;
    } else if (personality?.spendingStyle === 'conservative') {
      triggerChance *= 0.7;
    }
    
    // Emotional state modifiers
    if (state.emotionalState.adrenalineLevel > 70) {
      triggerChance *= 1.3;
    }
    
    if (state.emotionalState.victoryEuphoria > 50) {
      triggerChance *= 1.4;
    }
    
    if (state.emotionalState.defeatFrustration > 60) {
      triggerChance *= 1.2;
    }
    
    // Stress modifiers
    if (currentStress > 70) {
      triggerChance *= 1.2; // High stress = more impulsive
    }
    
    // Random check
    if (Math.random() > triggerChance) return null;
    
    // Determine financial impact type
    const financialImpact = this.determineFinancialImpact(event, state, personality);
    
    return {
      triggerType: event.eventType,
      intensity: this.calculateEventIntensity(event, state),
      timestamp: new Date(),
      description: event.description,
      financialImpact
    };
  }

  /**
   * Generate AI-driven wildcard decision based on trigger and character state
   */
  private async generateWildcardDecision(
    character: BattleCharacter,
    trigger: WildcardTrigger,
    state: BattleFinancialState,
    battleState: BattleState
  ): Promise<WildcardDecision> {
    
    const personality = character.financialPersonality;
    const currentWallet = character.financials?.wallet || 0;
    const earnings = state.currentEarnings;
    
    // Determine decision type based on trigger and emotional state
    const decisionType = this.determineDecisionType(trigger, state, personality);
    
    // Calculate decision amount based on emotional state and wallet
    const amount = this.calculateDecisionAmount(decisionType, currentWallet, earnings, state);
    
    // Generate options using AI decision-making
    const options = await this.generateWildcardOptions(
      decisionType,
      amount,
      state,
      personality,
      trigger
    );
    
    // Determine urgency
    const urgency = this.determineUrgency(trigger, state);
    
    // Generate AI recommendation
    const aiRecommendation = await this.generateAIRecommendation(
      character,
      trigger,
      options,
      state
    );
    
    return {
      decisionId: `wildcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      characterId: character.id,
      triggerEvent: trigger,
      decisionType,
      amount,
      options,
      urgency,
      aiRecommendation,
      riskLevel: this.calculateOverallRisk(options, state, personality)
    };
  }

  /**
   * Generate wildcard options using AI decision-making
   */
  private async generateWildcardOptions(
    decisionType: WildcardDecision['decisionType'],
    amount: number,
    state: BattleFinancialState,
    personality: FinancialPersonality | undefined,
    trigger: WildcardTrigger
  ): Promise<WildcardOption[]> {
    
    const options: WildcardOption[] = [];
    
    switch (decisionType) {
      case 'victory_splurge':
        options.push(
          this.createWildcardOption(
            'luxury_celebration',
            'Luxury Victory Celebration',
            'Rent a private venue and celebrate with the team in style',
            amount * 0.6,
            'high',
            85, // High emotional appeal after victory
            30, // Low logical score
            state
          ),
          this.createWildcardOption(
            'victory_investment',
            'Victory Investment',
            'Invest the winnings in a high-growth opportunity',
            amount * 0.8,
            'medium',
            65,
            75,
            state
          ),
          this.createWildcardOption(
            'save_winnings',
            'Save Victory Earnings',
            'Put the earnings aside for future needs',
            amount * 0.9,
            'low',
            25,
            90,
            state
          )
        );
        break;
        
      case 'defeat_desperation':
        options.push(
          this.createWildcardOption(
            'desperate_gamble',
            'High-Risk Gamble',
            'Try to win back losses with a risky investment',
            amount * 1.5,
            'extreme',
            75,
            15,
            state
          ),
          this.createWildcardOption(
            'comfort_spending',
            'Comfort Purchase',
            'Buy something to feel better about the loss',
            amount * 0.4,
            'medium',
            60,
            35,
            state
          ),
          this.createWildcardOption(
            'conservative_recovery',
            'Conservative Recovery',
            'Focus on steady income and avoid risks',
            amount * 0.2,
            'low',
            30,
            85,
            state
          )
        );
        break;
        
      case 'adrenaline_investment':
        options.push(
          this.createWildcardOption(
            'high_risk_trade',
            'Adrenaline Trade',
            'Make a bold investment while feeling invincible',
            amount * 1.2,
            'extreme',
            80,
            25,
            state
          ),
          this.createWildcardOption(
            'equipment_upgrade',
            'Battle Equipment',
            'Invest in better gear for future battles',
            amount * 0.7,
            'medium',
            70,
            70,
            state
          ),
          this.createWildcardOption(
            'training_investment',
            'Skill Training',
            'Invest in training to improve performance',
            amount * 0.5,
            'low',
            45,
            85,
            state
          )
        );
        break;
        
      case 'team_celebration':
        options.push(
          this.createWildcardOption(
            'team_party',
            'Team Victory Party',
            'Throw a party for the whole team',
            amount * 0.8,
            'medium',
            90,
            50,
            state
          ),
          this.createWildcardOption(
            'team_gifts',
            'Team Gifts',
            'Buy meaningful gifts for teammates',
            amount * 0.6,
            'low',
            85,
            60,
            state
          ),
          this.createWildcardOption(
            'team_investment',
            'Team Business',
            'Invest in a business venture with teammates',
            amount * 1.0,
            'high',
            70,
            65,
            state
          )
        );
        break;
        
      case 'pride_purchase':
        options.push(
          this.createWildcardOption(
            'status_symbol',
            'Status Symbol',
            'Buy something impressive to show off success',
            amount * 0.9,
            'high',
            85,
            20,
            state
          ),
          this.createWildcardOption(
            'modest_celebration',
            'Modest Celebration',
            'Celebrate success without going overboard',
            amount * 0.3,
            'low',
            40,
            80,
            state
          ),
          this.createWildcardOption(
            'reinvest_success',
            'Reinvest in Success',
            'Use success to fund future opportunities',
            amount * 0.7,
            'medium',
            55,
            75,
            state
          )
        );
        break;
        
      case 'panic_selling':
        options.push(
          this.createWildcardOption(
            'liquidate_assets',
            'Emergency Liquidation',
            'Sell investments to feel more secure',
            amount * 0.8,
            'high',
            70,
            30,
            state
          ),
          this.createWildcardOption(
            'hold_steady',
            'Hold Steady',
            'Resist panic and maintain current investments',
            amount * 0.1,
            'low',
            25,
            85,
            state
          ),
          this.createWildcardOption(
            'diversify_risk',
            'Diversify Portfolio',
            'Spread investments to reduce risk',
            amount * 0.6,
            'medium',
            50,
            70,
            state
          )
        );
        break;
    }
    
    return options;
  }

  /**
   * Create a wildcard option with calculated outcomes
   */
  private createWildcardOption(
    id: string,
    name: string,
    description: string,
    amount: number,
    riskLevel: WildcardOption['riskLevel'],
    emotionalAppeal: number,
    logicalScore: number,
    state: BattleFinancialState
  ): WildcardOption {
    
    // Calculate outcomes based on risk level and emotional state
    const riskMultiplier = {
      'low': 0.1,
      'medium': 0.3,
      'high': 0.6,
      'extreme': 1.0
    }[riskLevel];
    
    const emotionalBonus = state.emotionalState.confidence > 70 ? 0.2 : 0;
    const stressModifier = state.emotionalState.adrenalineLevel > 80 ? 0.5 : 0;
    
    return {
      id,
      name,
      description,
      amount,
      riskLevel,
      emotionalAppeal,
      logicalScore,
      outcomes: {
        best: {
          description: `Best case: ${name} succeeds spectacularly`,
          financialImpact: amount * (0.5 + riskMultiplier + emotionalBonus),
          stressImpact: -10 - (emotionalAppeal * 0.2)
        },
        likely: {
          description: `Most likely: ${name} has moderate results`,
          financialImpact: amount * (0.1 + riskMultiplier * 0.5),
          stressImpact: -5 + (riskMultiplier * 10)
        },
        worst: {
          description: `Worst case: ${name} backfires significantly`,
          financialImpact: -amount * (0.3 + riskMultiplier + stressModifier),
          stressImpact: 15 + (riskMultiplier * 20)
        }
      }
    };
  }

  // Helper methods
  private calculateCurrentStress(state: BattleFinancialState, personality: FinancialPersonality | undefined): number {
    return Math.min(100, 
      (state.emotionalState.adrenalineLevel * 0.3) +
      (state.emotionalState.defeatFrustration * 0.4) +
      ((100 - state.emotionalState.confidence) * 0.3)
    );
  }

  private determineFinancialImpact(
    event: MoraleEvent,
    state: BattleFinancialState,
    personality: FinancialPersonality | undefined
  ): WildcardTrigger['financialImpact'] {
    
    if (event.eventType === 'victory' || event.eventType === 'critical_hit') {
      return state.emotionalState.prideLevel > 70 ? 'impulsive_spending' : 'generous_giving';
    }
    
    if (event.eventType === 'defeat' || event.eventType === 'near_death') {
      return state.emotionalState.defeatFrustration > 60 ? 'desperate_gamble' : 'conservative_saving';
    }
    
    if (event.eventType === 'comeback') {
      return 'risky_investment';
    }
    
    return 'conservative_saving';
  }

  private determineDecisionType(
    trigger: WildcardTrigger,
    state: BattleFinancialState,
    personality: FinancialPersonality | undefined
  ): WildcardDecision['decisionType'] {
    
    if (trigger.triggerType === 'victory') {
      return state.emotionalState.teamBondFeeling > 70 ? 'team_celebration' : 'victory_splurge';
    }
    
    if (trigger.triggerType === 'defeat') {
      return 'defeat_desperation';
    }
    
    if (trigger.triggerType === 'critical_hit' || trigger.triggerType === 'comeback') {
      return state.emotionalState.adrenalineLevel > 80 ? 'adrenaline_investment' : 'pride_purchase';
    }
    
    if (trigger.triggerType === 'heroic_save') {
      return 'team_celebration';
    }
    
    if (trigger.triggerType === 'near_death' || trigger.triggerType === 'ally_down') {
      return 'panic_selling';
    }
    
    return 'pride_purchase';
  }

  private calculateDecisionAmount(
    decisionType: WildcardDecision['decisionType'],
    wallet: number,
    earnings: number,
    state: BattleFinancialState
  ): number {
    
    const availableMoney = wallet + earnings;
    const emotionalMultiplier = (state.emotionalState.adrenalineLevel + state.emotionalState.victoryEuphoria) / 100;
    
    let baseAmount = availableMoney * 0.3; // Default 30% of available money
    
    switch (decisionType) {
      case 'victory_splurge':
        baseAmount = availableMoney * 0.4;
        break;
      case 'defeat_desperation':
        baseAmount = availableMoney * 0.6;
        break;
      case 'adrenaline_investment':
        baseAmount = availableMoney * 0.5;
        break;
      case 'team_celebration':
        baseAmount = availableMoney * 0.25;
        break;
      case 'pride_purchase':
        baseAmount = availableMoney * 0.35;
        break;
      case 'panic_selling':
        baseAmount = availableMoney * 0.8;
        break;
    }
    
    return Math.round(baseAmount * (1 + emotionalMultiplier * 0.5));
  }

  private calculateEventIntensity(event: MoraleEvent, state: BattleFinancialState): number {
    const baseMorale = Math.abs(event.moraleImpact);
    const emotionalAmplifier = (state.emotionalState.adrenalineLevel + state.emotionalState.prideLevel) / 200;
    return Math.min(100, baseMorale * 2 + emotionalAmplifier * 50);
  }

  private determineUrgency(trigger: WildcardTrigger, state: BattleFinancialState): WildcardDecision['urgency'] {
    if (trigger.triggerType === 'critical_hit' || trigger.triggerType === 'near_death') {
      return 'immediate';
    }
    
    if (trigger.triggerType === 'victory' || trigger.triggerType === 'defeat') {
      return 'post_battle';
    }
    
    return 'next_day';
  }

  private async generateAIRecommendation(
    character: BattleCharacter,
    trigger: WildcardTrigger,
    options: WildcardOption[],
    state: BattleFinancialState
  ): Promise<string> {
    
    // Find the most logical option
    const bestLogicalOption = options.reduce((best, option) => 
      option.logicalScore > best.logicalScore ? option : best
    );
    
    // Find the most emotionally appealing option
    const mostEmotionalOption = options.reduce((best, option) => 
      option.emotionalAppeal > best.emotionalAppeal ? option : best
    );
    
    // Generate recommendation based on character state
    if (state.emotionalState.adrenalineLevel > 80) {
      return `Consider waiting until the adrenaline subsides. ${bestLogicalOption.name} would be the wisest choice.`;
    }
    
    if (state.emotionalState.confidence < 30) {
      return `Focus on rebuilding confidence first. ${bestLogicalOption.name} offers the best long-term stability.`;
    }
    
    if (bestLogicalOption.id === mostEmotionalOption.id) {
      return `Both logic and emotion align - ${bestLogicalOption.name} is the clear choice.`;
    }
    
    return `Your heart wants ${mostEmotionalOption.name}, but ${bestLogicalOption.name} would be more strategic.`;
  }

  private calculateOverallRisk(
    options: WildcardOption[],
    state: BattleFinancialState,
    personality: FinancialPersonality | undefined
  ): WildcardDecision['riskLevel'] {
    
    const highRiskOptions = options.filter(o => o.riskLevel === 'high' || o.riskLevel === 'extreme').length;
    const emotionalState = state.emotionalState.adrenalineLevel + state.emotionalState.victoryEuphoria;
    
    if (highRiskOptions >= 2 && emotionalState > 150) {
      return 'extreme';
    }
    
    if (highRiskOptions >= 1 || emotionalState > 120) {
      return 'high';
    }
    
    if (emotionalState > 80) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Clean up battle state after battle ends
   */
  finalizeBattleFinancialState(characterId: string): void {
    this.battleStates.delete(characterId);
  }
}

export default BattleFinancialService;