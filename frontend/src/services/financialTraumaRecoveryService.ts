// Financial Trauma Recovery System
// Integrates with existing therapy system to help characters recover from financial trauma

import { FinancialPersonality, FinancialDecision } from '../data/characters';
import GameEventBus from './gameEventBus';
import { FinancialPsychologyService } from './financialPsychologyService';
import FinancialCrisisService, { FinancialCrisis } from './financialCrisisService';

export interface FinancialTrauma {
  id: string;
  characterId: string;
  traumaType: 'crisis' | 'loss' | 'betrayal' | 'spiral' | 'shame' | 'anxiety';
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  triggeredDate: Date;
  description: string;
  originEvent?: string; // Event ID that caused the trauma
  symptoms: FinancialTraumaSymptom[];
  currentIntensity: number; // 0-100, how much it currently affects the character
  healingProgress: number; // 0-100, progress toward recovery
  lastTherapySession?: Date;
  isResolved: boolean;
  resolutionDate?: Date;
  triggers: string[]; // Things that can re-activate this trauma
  copingMechanisms: string[]; // Healthy ways the character deals with it
}

export interface FinancialTraumaSymptom {
  type: 'decision_paralysis' | 'impulsive_spending' | 'extreme_caution' | 'trust_issues' | 'anxiety_attacks' | 'avoidance';
  intensity: number; // 0-100
  affectedAreas: ('decisions' | 'relationships' | 'mood' | 'performance')[];
  description: string;
}

export interface TraumaRecoverySession {
  id: string;
  traumaId: string;
  characterId: string;
  therapistType: 'jung' | 'alien' | 'fairy_godmother';
  sessionDate: Date;
  focusAreas: string[]; // What aspects of trauma were addressed
  techniques: string[]; // Therapeutic techniques used
  breakthroughAchieved: boolean;
  healingGained: number; // 0-100, progress made this session
  intensityReduction: number; // How much current intensity was reduced
  newCopingMechanisms: string[]; // New healthy coping strategies learned
  setbacks: string[]; // Any regression or new issues discovered
  nextSessionRecommendations: string[];
  characterResponse: string; // How the character reacted to the session
}

export interface TraumaRecoveryPlan {
  traumaId: string;
  characterId: string;
  estimatedSessions: number;
  priorityOrder: number; // 1 = highest priority
  recommendedTherapist: 'jung' | 'alien' | 'fairy_godmother';
  proposedTechniques: string[];
  milestones: RecoveryMilestone[];
  riskFactors: string[]; // Things that could slow recovery
  supportStrategies: string[]; // Non-therapy interventions
}

export interface RecoveryMilestone {
  name: string;
  description: string;
  targetIntensityReduction: number;
  estimatedSessions: number;
  requiredCopingMechanisms: string[];
  measurableOutcomes: string[];
}

export class FinancialTraumaRecoveryService {
  private static instance: FinancialTraumaRecoveryService;
  private eventBus: GameEventBus;
  private financialPsychology: FinancialPsychologyService;
  private crisisService: FinancialCrisisService;
  private activeTraumas: Map<string, FinancialTrauma[]> = new Map(); // characterId -> traumas
  private recoveryPlans: Map<string, TraumaRecoveryPlan[]> = new Map(); // characterId -> plans
  private sessionHistory: Map<string, TraumaRecoverySession[]> = new Map(); // traumaId -> sessions

  private traumaTypes = {
    crisis: {
      name: 'Financial Crisis Trauma',
      commonSymptoms: ['anxiety_attacks', 'extreme_caution', 'decision_paralysis'],
      typicalTriggers: ['large_expenses', 'investment_opportunities', 'unexpected_costs'],
      averageRecoveryTime: 45, // days
      complexityFactor: 1.2
    },
    loss: {
      name: 'Financial Loss Trauma', 
      commonSymptoms: ['trust_issues', 'extreme_caution', 'avoidance'],
      typicalTriggers: ['investment_offers', 'risky_decisions', 'financial_advice'],
      averageRecoveryTime: 35,
      complexityFactor: 1.0
    },
    betrayal: {
      name: 'Financial Betrayal Trauma',
      commonSymptoms: ['trust_issues', 'anxiety_attacks', 'avoidance'],
      typicalTriggers: ['coach_advice', 'team_financial_decisions', 'shared_expenses'],
      averageRecoveryTime: 60,
      complexityFactor: 1.5
    },
    spiral: {
      name: 'Financial Spiral Trauma',
      commonSymptoms: ['impulsive_spending', 'decision_paralysis', 'anxiety_attacks'],
      typicalTriggers: ['poor_decisions', 'stress_situations', 'time_pressure'],
      averageRecoveryTime: 50,
      complexityFactor: 1.3
    },
    shame: {
      name: 'Financial Shame Trauma',
      commonSymptoms: ['avoidance', 'anxiety_attacks', 'trust_issues'],
      typicalTriggers: ['public_decisions', 'team_discussions', 'spending_comparisons'],
      averageRecoveryTime: 40,
      complexityFactor: 1.1
    },
    anxiety: {
      name: 'Financial Anxiety Trauma',
      commonSymptoms: ['decision_paralysis', 'anxiety_attacks', 'extreme_caution'],
      typicalTriggers: ['decision_deadlines', 'uncertainty', 'complex_choices'],
      averageRecoveryTime: 30,
      complexityFactor: 0.9
    }
  };

  private constructor() {
    this.eventBus = GameEventBus.getInstance();
    this.financialPsychology = FinancialPsychologyService.getInstance();
    this.crisisService = FinancialCrisisService.getInstance();
    
    this.setupTraumaEventListeners();
  }

  static getInstance(): FinancialTraumaRecoveryService {
    if (!FinancialTraumaRecoveryService.instance) {
      FinancialTraumaRecoveryService.instance = new FinancialTraumaRecoveryService();
    }
    return FinancialTraumaRecoveryService.instance;
  }

  /**
   * Detect and create trauma from significant financial events
   */
  async processFinancialEventForTrauma(
    characterId: string,
    eventType: string,
    eventData: any,
    financialPersonality: FinancialPersonality
  ): Promise<FinancialTrauma | null> {
    
    // Determine if this event should create trauma
    const traumaRisk = this.calculateTraumaRisk(eventType, eventData, financialPersonality);
    
    if (traumaRisk.shouldCreateTrauma) {
      const trauma = await this.createTrauma(
        characterId,
        traumaRisk.traumaType,
        traumaRisk.severity,
        eventData,
        financialPersonality
      );
      
      // Create recovery plan for new trauma
      const recoveryPlan = this.createRecoveryPlan(trauma, financialPersonality);
      
      if (!this.recoveryPlans.has(characterId)) {
        this.recoveryPlans.set(characterId, []);
      }
      this.recoveryPlans.get(characterId)!.push(recoveryPlan);
      
      return trauma;
    }
    
    return null;
  }

  /**
   * Conduct a trauma-focused therapy session
   */
  async conductTraumaTherapySession(
    traumaId: string,
    therapistType: 'jung' | 'alien' | 'fairy_godmother',
    financialPersonality: FinancialPersonality
  ): Promise<TraumaRecoverySession> {
    
    const trauma = this.findTraumaById(traumaId);
    if (!trauma) {
      throw new Error(`Trauma ${traumaId} not found`);
    }
    
    // Get previous session history for this trauma
    const previousSessions = this.sessionHistory.get(traumaId) || [];
    const sessionNumber = previousSessions.length + 1;
    
    // Determine session effectiveness based on therapist match and trauma type
    const effectiveness = this.calculateTherapyEffectiveness(
      trauma,
      therapistType,
      sessionNumber,
      financialPersonality
    );
    
    // Apply therapeutic techniques based on therapist type
    const sessionResults = this.applyTherapeuticTechniques(
      trauma,
      therapistType,
      effectiveness,
      financialPersonality
    );
    
    // Create session record
    const session: TraumaRecoverySession = {
      id: `trauma_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      traumaId,
      characterId: trauma.characterId,
      therapistType,
      sessionDate: new Date(),
      focusAreas: sessionResults.focusAreas,
      techniques: sessionResults.techniques,
      breakthroughAchieved: sessionResults.breakthroughAchieved,
      healingGained: sessionResults.healingGained,
      intensityReduction: sessionResults.intensityReduction,
      newCopingMechanisms: sessionResults.newCopingMechanisms,
      setbacks: sessionResults.setbacks,
      nextSessionRecommendations: sessionResults.nextRecommendations,
      characterResponse: sessionResults.characterResponse
    };
    
    // Update trauma progress
    trauma.healingProgress = Math.min(100, trauma.healingProgress + sessionResults.healingGained);
    trauma.currentIntensity = Math.max(0, trauma.currentIntensity - sessionResults.intensityReduction);
    trauma.lastTherapySession = new Date();
    trauma.copingMechanisms.push(...sessionResults.newCopingMechanisms);
    
    // Check if trauma is resolved
    if (trauma.healingProgress >= 85 && trauma.currentIntensity <= 15) {
      trauma.isResolved = true;
      trauma.resolutionDate = new Date();
      
      await this.eventBus.publishEvent({
        type: 'financial_breakthrough',
        source: 'financial_advisory',
        primaryCharacterId: trauma.characterId,
        severity: 'high',
        category: 'financial',
        description: `${trauma.characterId} has recovered from ${trauma.traumaType} trauma through therapy`,
        metadata: {
          traumaId,
          traumaType: trauma.traumaType,
          originalSeverity: trauma.severity,
          sessionsRequired: sessionNumber,
          therapistType
        },
        tags: ['therapy', 'recovery', 'breakthrough', 'trauma']
      });
    }
    
    // Store session
    if (!this.sessionHistory.has(traumaId)) {
      this.sessionHistory.set(traumaId, []);
    }
    this.sessionHistory.get(traumaId)!.push(session);
    
    return session;
  }

  /**
   * Get all active traumas for a character (for therapy system integration)
   */
  getActiveTraumas(characterId: string): FinancialTrauma[] {
    const traumas = this.activeTraumas.get(characterId) || [];
    return traumas.filter(t => !t.isResolved);
  }

  /**
   * Get recovery plans for a character
   */
  getRecoveryPlans(characterId: string): TraumaRecoveryPlan[] {
    return this.recoveryPlans.get(characterId) || [];
  }

  /**
   * Get therapy session history for a trauma
   */
  getSessionHistory(traumaId: string): TraumaRecoverySession[] {
    return this.sessionHistory.get(traumaId) || [];
  }

  /**
   * Calculate how trauma affects current financial decisions
   */
  calculateTraumaImpactOnDecision(
    characterId: string,
    decisionType: string,
    decisionAmount: number
  ): {
    stressPenalty: number;
    decisionQualityPenalty: number;
    triggeredTraumas: FinancialTrauma[];
    copingMechanismsUsed: string[];
  } {
    
    const activeTraumas = this.getActiveTraumas(characterId);
    let totalStressPenalty = 0;
    let totalQualityPenalty = 0;
    const triggeredTraumas: FinancialTrauma[] = [];
    const copingMechanismsUsed: string[] = [];
    
    for (const trauma of activeTraumas) {
      // Check if this decision triggers the trauma
      const isTriggered = trauma.triggers.some(trigger => 
        decisionType.includes(trigger) || 
        (trigger === 'large_amounts' && decisionAmount > 5000)
      );
      
      if (isTriggered) {
        triggeredTraumas.push(trauma);
        
        // Calculate impact based on trauma intensity and type
        const intensityFactor = trauma.currentIntensity / 100;
        
        // Different trauma types affect decisions differently
        switch (trauma.traumaType) {
          case 'crisis':
            totalStressPenalty += intensityFactor * 20;
            totalQualityPenalty += intensityFactor * 15;
            break;
          case 'loss':
            totalQualityPenalty += intensityFactor * 25;
            totalStressPenalty += intensityFactor * 10;
            break;
          case 'betrayal':
            totalQualityPenalty += intensityFactor * 30; // Severe decision impact
            totalStressPenalty += intensityFactor * 15;
            break;
          case 'spiral':
            totalStressPenalty += intensityFactor * 25;
            totalQualityPenalty += intensityFactor * 20;
            break;
          case 'shame':
            totalStressPenalty += intensityFactor * 15;
            totalQualityPenalty += intensityFactor * 10;
            break;
          case 'anxiety':
            totalStressPenalty += intensityFactor * 30; // High stress impact
            totalQualityPenalty += intensityFactor * 20;
            break;
        }
        
        // Apply coping mechanisms to reduce impact
        const applicableCoping = trauma.copingMechanisms.filter(mechanism => 
          this.isCopingMechanismApplicable(mechanism, decisionType)
        );
        
        for (const coping of applicableCoping) {
          copingMechanismsUsed.push(coping);
          totalStressPenalty *= 0.8; // 20% reduction per applicable coping mechanism
          totalQualityPenalty *= 0.8;
        }
      }
    }
    
    return {
      stressPenalty: Math.min(50, totalStressPenalty), // Cap at 50% penalty
      decisionQualityPenalty: Math.min(40, totalQualityPenalty), // Cap at 40% penalty
      triggeredTraumas,
      copingMechanismsUsed
    };
  }

  // Private helper methods

  private calculateTraumaRisk(
    eventType: string,
    eventData: any,
    personality: FinancialPersonality
  ): {
    shouldCreateTrauma: boolean;
    traumaType: keyof typeof this.traumaTypes;
    severity: 'mild' | 'moderate' | 'severe' | 'critical';
  } {
    
    let baseRisk = 0;
    let traumaType: keyof typeof this.traumaTypes = 'anxiety';
    
    // Event-based risk calculation
    switch (eventType) {
      case 'financial_crisis':
        baseRisk = 0.8;
        traumaType = 'crisis';
        break;
      case 'financial_spiral_started':
        baseRisk = 0.7;
        traumaType = 'spiral';
        break;
      case 'trust_lost':
        if (eventData.magnitude > 20) {
          baseRisk = 0.6;
          traumaType = 'betrayal';
        }
        break;
      case 'investment_loss':
        if (eventData.amount > 10000) {
          baseRisk = 0.5;
          traumaType = 'loss';
        }
        break;
      case 'financial_stress_increase':
        if (eventData.newStress > 80) {
          baseRisk = 0.4;
          traumaType = 'anxiety';
        }
        break;
    }
    
    // Personality modifiers
    if (personality.financialWisdom < 40) {
      baseRisk *= 1.3; // Low wisdom = higher trauma risk
    }
    
    if (personality.riskTolerance < 30) {
      baseRisk *= 1.2; // Conservative personalities more prone to trauma
    }
    
    if (personality.financialTraumas.length > 2) {
      baseRisk *= 1.4; // Previous traumas increase vulnerability
    }
    
    // Determine severity
    let severity: 'mild' | 'moderate' | 'severe' | 'critical';
    if (baseRisk > 0.8) severity = 'critical';
    else if (baseRisk > 0.6) severity = 'severe';
    else if (baseRisk > 0.4) severity = 'moderate';
    else severity = 'mild';
    
    return {
      shouldCreateTrauma: Math.random() < baseRisk,
      traumaType,
      severity
    };
  }

  private async createTrauma(
    characterId: string,
    traumaType: keyof typeof this.traumaTypes,
    severity: 'mild' | 'moderate' | 'severe' | 'critical',
    eventData: any,
    personality: FinancialPersonality
  ): Promise<FinancialTrauma> {
    
    const traumaTypeData = this.traumaTypes[traumaType];
    const severityMultipliers = { mild: 0.5, moderate: 0.7, severe: 1.0, critical: 1.3 };
    const multiplier = severityMultipliers[severity];
    
    const trauma: FinancialTrauma = {
      id: `trauma_${Date.now()}_${characterId}`,
      characterId,
      traumaType,
      severity,
      triggeredDate: new Date(),
      description: this.generateTraumaDescription(traumaType, severity, eventData),
      originEvent: eventData.eventId,
      symptoms: this.generateTraumaSymptoms(traumaType, severity),
      currentIntensity: Math.min(100, 40 + (multiplier * 30)), // 40-70 base intensity
      healingProgress: 0,
      isResolved: false,
      triggers: [...traumaTypeData.typicalTriggers],
      copingMechanisms: []
    };
    
    // Add to active traumas
    if (!this.activeTraumas.has(characterId)) {
      this.activeTraumas.set(characterId, []);
    }
    this.activeTraumas.get(characterId)!.push(trauma);
    
    // Publish trauma creation event
    await this.eventBus.publishEvent({
      type: 'financial_trauma',
      source: 'financial_advisory',
      primaryCharacterId: characterId,
      severity: severity === 'critical' ? 'critical' : 'high',
      category: 'financial',
      description: `${characterId} has developed ${traumaType} trauma: ${trauma.description}`,
      metadata: {
        traumaId: trauma.id,
        traumaType,
        severity,
        currentIntensity: trauma.currentIntensity,
        originEvent: eventData.eventId
      },
      tags: ['trauma', 'psychology', traumaType]
    });
    
    return trauma;
  }

  private setupTraumaEventListeners(): void {
    // Listen for events that could create trauma
    this.eventBus.subscribe('financial_crisis', async (event) => {
      // Will be handled by the main financial psychology service
    });
    
    this.eventBus.subscribe('financial_spiral_started', async (event) => {
      // Will be handled by the main financial psychology service  
    });
    
    // Listen for therapy session completion to potentially trigger trauma sessions
    this.eventBus.subscribe('therapy_breakthrough', async (event) => {
      if (event.metadata?.financialTraumaId) {
        // A regular therapy session revealed financial trauma
        const traumaId = event.metadata.financialTraumaId;
        // This would trigger follow-up trauma-specific therapy
      }
    });
  }

  private findTraumaById(traumaId: string): FinancialTrauma | null {
    for (const traumas of this.activeTraumas.values()) {
      const trauma = traumas.find(t => t.id === traumaId);
      if (trauma) return trauma;
    }
    return null;
  }

  private calculateTherapyEffectiveness(
    trauma: FinancialTrauma,
    therapistType: 'jung' | 'alien' | 'fairy_godmother',
    sessionNumber: number,
    personality: FinancialPersonality
  ): number {
    
    let baseEffectiveness = 60; // Base therapy effectiveness
    
    // Therapist type effectiveness for financial trauma
    const therapistEffectiveness = {
      jung: { crisis: 85, loss: 90, betrayal: 95, spiral: 80, shame: 85, anxiety: 75 },
      alien: { crisis: 70, loss: 85, betrayal: 60, spiral: 95, shame: 70, anxiety: 90 },
      fairy_godmother: { crisis: 90, loss: 75, shame: 95, spiral: 85, betrayal: 80, anxiety: 85 }
    };
    
    baseEffectiveness = therapistEffectiveness[therapistType][trauma.traumaType];
    
    // Session number bonus (therapy gets more effective over time)
    const sessionBonus = Math.min(20, sessionNumber * 3);
    
    // Trauma severity affects therapy difficulty
    const severityPenalty = {
      mild: 0, moderate: -10, severe: -20, critical: -30
    }[trauma.severity];
    
    // Personality modifiers
    let personalityModifier = 0;
    if (personality.financialWisdom > 70) personalityModifier += 10;
    if (personality.spendingStyle === 'strategic') personalityModifier += 5;
    
    return Math.max(20, Math.min(95, baseEffectiveness + sessionBonus + severityPenalty + personalityModifier));
  }

  private applyTherapeuticTechniques(
    trauma: FinancialTrauma,
    therapistType: 'jung' | 'alien' | 'fairy_godmother',
    effectiveness: number,
    personality: FinancialPersonality
  ): {
    focusAreas: string[];
    techniques: string[];
    breakthroughAchieved: boolean;
    healingGained: number;
    intensityReduction: number;
    newCopingMechanisms: string[];
    setbacks: string[];
    nextRecommendations: string[];
    characterResponse: string;
  } {
    
    const effectivenessFactor = effectiveness / 100;
    const breakthroughAchieved = Math.random() < (effectivenessFactor * 0.3); // 30% max breakthrough chance
    
    let healingGained = Math.floor(effectivenessFactor * 20); // Up to 20 healing per session
    let intensityReduction = Math.floor(effectivenessFactor * 15); // Up to 15 intensity reduction
    
    if (breakthroughAchieved) {
      healingGained += 15;
      intensityReduction += 20;
    }
    
    // Therapist-specific approaches
    const therapistApproaches = {
      jung: {
        focusAreas: ['unconscious_patterns', 'archetypal_fears', 'shadow_work'],
        techniques: ['dream_analysis', 'active_imagination', 'symbol_exploration'],
        copingMechanisms: ['conscious_awareness', 'ritual_practice', 'symbolic_thinking'],
        characterResponses: {
          breakthrough: "I see the deeper pattern now... this fear has been controlling me unconsciously.",
          progress: "These sessions help me understand why I react this way to money.",
          resistance: "I don't see how old dreams relate to my current financial problems."
        }
      },
      alien: {
        focusAreas: ['logical_analysis', 'pattern_recognition', 'behavioral_modification'],
        techniques: ['data_analysis', 'behavioral_tracking', 'systematic_desensitization'],
        copingMechanisms: ['logical_assessment', 'systematic_planning', 'data_driven_decisions'],
        characterResponses: {
          breakthrough: "The data clearly shows how this trauma has been affecting my decision-making patterns.",
          progress: "Your analytical approach helps me see the logical flaws in my trauma responses.",
          resistance: "This feels too clinical. Money isn't just about logic and data."
        }
      },
      fairy_godmother: {
        focusAreas: ['emotional_healing', 'self_compassion', 'narrative_reframing'],
        techniques: ['guided_visualization', 'emotional_validation', 'story_rewriting'],
        copingMechanisms: ['self_compassion', 'positive_reframing', 'emotional_regulation'],
        characterResponses: {
          breakthrough: "I feel the weight lifting... I can forgive myself for those past decisions now.",
          progress: "Your kindness helps me be gentler with myself about my financial mistakes.",
          resistance: "I don't need sympathy. I need practical solutions to my problems."
        }
      }
    };
    
    const approach = therapistApproaches[therapistType];
    const responseType = breakthroughAchieved ? 'breakthrough' : 
                        effectiveness > 70 ? 'progress' : 'resistance';
    
    return {
      focusAreas: approach.focusAreas,
      techniques: approach.techniques,
      breakthroughAchieved,
      healingGained,
      intensityReduction,
      newCopingMechanisms: breakthroughAchieved ? approach.copingMechanisms : 
                          effectiveness > 60 ? approach.copingMechanisms.slice(0, 1) : [],
      setbacks: effectiveness < 40 ? ['resistance_to_process', 'emotional_overwhelm'] : [],
      nextRecommendations: this.generateNextSessionRecommendations(trauma, therapistType, effectiveness),
      characterResponse: approach.characterResponses[responseType]
    };
  }

  private generateTraumaDescription(
    traumaType: keyof typeof this.traumaTypes,
    severity: string,
    eventData: any
  ): string {
    const descriptions = {
      crisis: `Developed deep anxiety about financial security after experiencing a ${severity} financial crisis`,
      loss: `Traumatized by significant financial losses, creating fear of investment and risk-taking`,
      betrayal: `Trust deeply damaged by financial betrayal, making coach advice and team decisions triggering`,
      spiral: `Scarred by loss of control during financial spiral, creating fear of decision-making`,
      shame: `Overwhelmed by shame about financial mistakes, avoiding financial discussions and decisions`,
      anxiety: `Chronic anxiety about financial decisions, leading to paralysis and avoidance behaviors`
    };
    
    return descriptions[traumaType];
  }

  private generateTraumaSymptoms(
    traumaType: keyof typeof this.traumaTypes,
    severity: 'mild' | 'moderate' | 'severe' | 'critical'
  ): FinancialTraumaSymptom[] {
    
    const traumaTypeData = this.traumaTypes[traumaType];
    const severityMultiplier = { mild: 0.5, moderate: 0.7, severe: 1.0, critical: 1.3 }[severity];
    
    return traumaTypeData.commonSymptoms.map(symptomType => ({
      type: symptomType as FinancialTraumaSymptom['type'],
      intensity: Math.min(100, Math.floor(50 * severityMultiplier + Math.random() * 30)),
      affectedAreas: this.getSymptomAffectedAreas(symptomType as FinancialTraumaSymptom['type']),
      description: this.getSymptomDescription(symptomType as FinancialTraumaSymptom['type'], severity)
    }));
  }

  private getSymptomAffectedAreas(symptomType: FinancialTraumaSymptom['type']): ('decisions' | 'relationships' | 'mood' | 'performance')[] {
    const areaMap = {
      decision_paralysis: ['decisions', 'performance'],
      impulsive_spending: ['decisions', 'mood'],
      extreme_caution: ['decisions', 'relationships'],
      trust_issues: ['relationships', 'decisions'],
      anxiety_attacks: ['mood', 'performance'],
      avoidance: ['decisions', 'relationships']
    };
    
    return areaMap[symptomType];
  }

  private getSymptomDescription(symptomType: FinancialTraumaSymptom['type'], severity: string): string {
    const descriptions = {
      decision_paralysis: `${severity} difficulty making financial decisions, often freezing when faced with money choices`,
      impulsive_spending: `${severity} tendency to make quick financial decisions to avoid anxiety and overthinking`,
      extreme_caution: `${severity} over-conservative approach to money, avoiding all financial risks`,
      trust_issues: `${severity} difficulty trusting financial advice from coaches or teammates`,
      anxiety_attacks: `${severity} panic responses when dealing with significant financial decisions or losses`,
      avoidance: `${severity} tendency to avoid financial discussions, planning, or decision-making entirely`
    };
    
    return descriptions[symptomType];
  }

  private createRecoveryPlan(trauma: FinancialTrauma, personality: FinancialPersonality): TraumaRecoveryPlan {
    const traumaTypeData = this.traumaTypes[trauma.traumaType];
    const complexityFactor = traumaTypeData.complexityFactor;
    const baseSessions = Math.ceil(traumaTypeData.averageRecoveryTime / 7); // Weekly sessions
    
    // Adjust for severity and personality
    let estimatedSessions = Math.ceil(baseSessions * complexityFactor);
    if (trauma.severity === 'critical') estimatedSessions *= 1.5;
    else if (trauma.severity === 'severe') estimatedSessions *= 1.3;
    
    if (personality.financialWisdom > 70) estimatedSessions *= 0.8; // Faster recovery
    if (personality.financialTraumas.length > 2) estimatedSessions *= 1.2; // Slower if multiple traumas
    
    return {
      traumaId: trauma.id,
      characterId: trauma.characterId,
      estimatedSessions: Math.round(estimatedSessions),
      priorityOrder: this.calculateTraumaPriority(trauma),
      recommendedTherapist: this.recommendOptimalTherapist(trauma, personality),
      proposedTechniques: this.getProposedTechniques(trauma, personality),
      milestones: this.createRecoveryMilestones(trauma, estimatedSessions),
      riskFactors: this.identifyRiskFactors(trauma, personality),
      supportStrategies: this.generateSupportStrategies(trauma, personality)
    };
  }

  private calculateTraumaPriority(trauma: FinancialTrauma): number {
    // Higher number = higher priority (1 = highest)
    let priority = 5; // Base priority
    
    if (trauma.severity === 'critical') priority = 1;
    else if (trauma.severity === 'severe') priority = 2;
    else if (trauma.severity === 'moderate') priority = 3;
    else priority = 4;
    
    // Trauma types that severely impact decisions get higher priority
    if (['betrayal', 'spiral'].includes(trauma.traumaType)) {
      priority = Math.max(1, priority - 1);
    }
    
    return priority;
  }

  private recommendOptimalTherapist(trauma: FinancialTrauma, personality: FinancialPersonality): 'jung' | 'alien' | 'fairy_godmother' {
    // Match therapist to trauma type and personality
    if (trauma.traumaType === 'betrayal' || trauma.traumaType === 'shame') {
      return personality.spendingStyle === 'strategic' ? 'jung' : 'fairy_godmother';
    }
    
    if (trauma.traumaType === 'spiral' || trauma.traumaType === 'anxiety') {
      return personality.financialWisdom > 70 ? 'alien' : 'fairy_godmother';
    }
    
    return 'jung'; // Default to Jung for complex cases
  }

  private getProposedTechniques(trauma: FinancialTrauma, personality: FinancialPersonality): string[] {
    const techniques = [];
    
    // Base techniques for trauma type
    if (trauma.traumaType === 'crisis' || trauma.traumaType === 'loss') {
      techniques.push('exposure_therapy', 'cognitive_restructuring');
    }
    
    if (trauma.traumaType === 'betrayal') {
      techniques.push('trust_rebuilding', 'relationship_repair');
    }
    
    if (trauma.traumaType === 'anxiety') {
      techniques.push('relaxation_training', 'systematic_desensitization');
    }
    
    // Personality-based techniques
    if (personality.spendingStyle === 'strategic') {
      techniques.push('logical_analysis', 'behavioral_planning');
    }
    
    if (personality.financialWisdom < 50) {
      techniques.push('psychoeducation', 'skill_building');
    }
    
    return techniques;
  }

  private createRecoveryMilestones(trauma: FinancialTrauma, totalSessions: number): RecoveryMilestone[] {
    const milestones: RecoveryMilestone[] = [];
    
    // Early milestone: Symptom awareness
    milestones.push({
      name: 'Symptom Recognition',
      description: 'Character understands their trauma symptoms and triggers',
      targetIntensityReduction: 10,
      estimatedSessions: Math.ceil(totalSessions * 0.25),
      requiredCopingMechanisms: ['awareness', 'trigger_identification'],
      measurableOutcomes: ['Can identify trauma triggers', 'Understands symptom patterns']
    });
    
    // Middle milestone: Coping development
    milestones.push({
      name: 'Coping Development',
      description: 'Character develops healthy coping mechanisms',
      targetIntensityReduction: 25,
      estimatedSessions: Math.ceil(totalSessions * 0.5),
      requiredCopingMechanisms: ['grounding_techniques', 'emotional_regulation'],
      measurableOutcomes: ['Uses coping strategies effectively', 'Reduced symptom frequency']
    });
    
    // Late milestone: Integration
    milestones.push({
      name: 'Trauma Integration',
      description: 'Character integrates trauma experience and regains confidence',
      targetIntensityReduction: 50,
      estimatedSessions: Math.ceil(totalSessions * 0.8),
      requiredCopingMechanisms: ['meaning_making', 'post_traumatic_growth'],
      measurableOutcomes: ['Makes financial decisions with confidence', 'Trauma no longer controls behavior']
    });
    
    return milestones;
  }

  private identifyRiskFactors(trauma: FinancialTrauma, personality: FinancialPersonality): string[] {
    const riskFactors = [];
    
    if (personality.financialTraumas.length > 2) {
      riskFactors.push('Multiple previous traumas may complicate recovery');
    }
    
    if (personality.riskTolerance < 30) {
      riskFactors.push('Low risk tolerance may slow exposure therapy progress');
    }
    
    if (trauma.severity === 'critical') {
      riskFactors.push('Critical severity may require longer treatment duration');
    }
    
    return riskFactors;
  }

  private generateSupportStrategies(trauma: FinancialTrauma, personality: FinancialPersonality): string[] {
    const strategies = [];
    
    strategies.push('Team support and understanding during recovery process');
    strategies.push('Gradual re-exposure to financial decisions with coach support');
    strategies.push('Regular check-ins to monitor trauma symptoms and progress');
    
    if (trauma.traumaType === 'betrayal') {
      strategies.push('Trust-building exercises with coach and teammates');
    }
    
    if (personality.generosity > 70) {
      strategies.push('Focus on helping others as pathway to healing');
    }
    
    return strategies;
  }

  private generateNextSessionRecommendations(
    trauma: FinancialTrauma,
    therapistType: 'jung' | 'alien' | 'fairy_godmother',
    effectiveness: number
  ): string[] {
    const recommendations = [];
    
    if (effectiveness > 70) {
      recommendations.push('Continue current therapeutic approach, showing good progress');
    } else if (effectiveness < 40) {
      recommendations.push('Consider adjusting therapeutic approach or switching therapists');
    }
    
    if (trauma.currentIntensity > 80) {
      recommendations.push('Focus on symptom stabilization before deeper trauma work');
    }
    
    recommendations.push('Practice coping mechanisms between sessions');
    recommendations.push('Monitor triggers and use grounding techniques as needed');
    
    return recommendations;
  }

  private isCopingMechanismApplicable(mechanism: string, decisionType: string): boolean {
    const applicableMap = {
      'grounding_techniques': ['anxiety', 'stress', 'panic'],
      'logical_assessment': ['investment', 'planning', 'analysis'],
      'emotional_regulation': ['impulse', 'anger', 'fear'],
      'systematic_planning': ['complex', 'major', 'important']
    };
    
    return Object.entries(applicableMap).some(([mech, keywords]) => 
      mechanism.includes(mech) && keywords.some(keyword => decisionType.includes(keyword))
    );
  }
}

export default FinancialTraumaRecoveryService;