// Financial Crisis Event Generator
// Creates realistic financial emergencies based on character behavior and probability systems

import { FinancialPersonality, FinancialDecision } from '../data/characters';
import GameEventBus from './gameEventBus';
import { FinancialPsychologyService } from './financialPsychologyService';
import LuxuryPurchaseService from './luxuryPurchaseService';

export interface FinancialCrisis {
  id: string;
  type: CrisisType;
  characterId: string;
  triggeredDate: Date;
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
  amount: number; // Financial impact
  description: string;
  triggerFactors: string[]; // What led to this crisis
  timeToResolve: number; // Days
  isResolved: boolean;
  resolutionMethod?: string;
  resolutionDate?: Date;
  psychologicalImpact: {
    stressIncrease: number;
    trustImpact: number;
    traumaLevel: number; // 0-100, creates lasting effects
  };
  ongoingEffects: {
    monthlyStressPenalty: number;
    decisionQualityPenalty: number;
    durationDays: number;
  };
}

export type CrisisType = 
  | 'medical_emergency' | 'job_loss' | 'major_expense' | 'legal_issue'
  | 'family_emergency' | 'market_crash' | 'scam_victim' | 'theft'
  | 'housing_crisis' | 'vehicle_breakdown' | 'tax_audit' | 'debt_call'
  | 'investment_loss' | 'equipment_failure' | 'natural_disaster' | 'fraud';

export interface CrisisTemplate {
  type: CrisisType;
  name: string;
  baseProbability: number; // 0-1, base chance per month
  amountRange: [number, number]; // Min/max financial impact
  severityDistribution: {
    minor: number;
    moderate: number;
    major: number;
    catastrophic: number;
  };
  personalityModifiers: {
    [key: string]: number; // Personality trait -> probability modifier
  };
  behaviorTriggers: {
    luxurySpending: number; // High luxury spending increases risk
    poorDecisions: number; // Recent poor decisions increase risk
    lowSavings: number; // Low emergency fund increases risk
    riskTaking: number; // High risk behavior increases risk
  };
  description: string;
  resolutionTimeRange: [number, number]; // Min/max days to resolve
  traumaFactors: {
    unexpectedness: number; // How unexpected this crisis type is
    controllability: number; // How much control character has
    socialImpact: number; // How much it affects reputation
  };
}

export class FinancialCrisisService {
  private static instance: FinancialCrisisService;
  private eventBus: GameEventBus;
  private financialPsychology: FinancialPsychologyService;
  private luxuryService: LuxuryPurchaseService;
  private activeCrises: Map<string, FinancialCrisis[]> = new Map(); // characterId -> crises
  private crisisCheckInterval: NodeJS.Timeout | null = null;

  private crisisTemplates: CrisisTemplate[] = [
    {
      type: 'medical_emergency',
      name: 'Medical Emergency',
      baseProbability: 0.05, // 5% per month
      amountRange: [2000, 25000],
      severityDistribution: { minor: 0.4, moderate: 0.35, major: 0.2, catastrophic: 0.05 },
      personalityModifiers: {
        riskTolerance: -0.3, // Conservative people plan better for medical
        financialWisdom: -0.2
      },
      behaviorTriggers: {
        luxurySpending: 0.1,
        poorDecisions: 0.05,
        lowSavings: 0.3,
        riskTaking: 0.15
      },
      description: 'Unexpected medical expenses not covered by insurance',
      resolutionTimeRange: [1, 30],
      traumaFactors: { unexpectedness: 0.8, controllability: 0.2, socialImpact: 0.3 }
    },
    {
      type: 'job_loss',
      name: 'Job Loss',
      baseProbability: 0.03, // 3% per month
      amountRange: [5000, 50000], // Lost income over time
      severityDistribution: { minor: 0.2, moderate: 0.4, major: 0.3, catastrophic: 0.1 },
      personalityModifiers: {
        charisma: -0.2, // Charismatic people less likely to be laid off
        financialWisdom: -0.1
      },
      behaviorTriggers: {
        luxurySpending: 0.2, // High spending makes job loss worse
        poorDecisions: 0.1,
        lowSavings: 0.4,
        riskTaking: 0.05
      },
      description: 'Unexpected termination or layoff affecting income',
      resolutionTimeRange: [30, 180],
      traumaFactors: { unexpectedness: 0.7, controllability: 0.3, socialImpact: 0.6 }
    },
    {
      type: 'major_expense',
      name: 'Major Unexpected Expense',
      baseProbability: 0.08, // 8% per month
      amountRange: [1500, 15000],
      severityDistribution: { minor: 0.5, moderate: 0.3, major: 0.15, catastrophic: 0.05 },
      personalityModifiers: {
        financialWisdom: -0.25,
        riskTolerance: 0.1
      },
      behaviorTriggers: {
        luxurySpending: 0.15,
        poorDecisions: 0.2,
        lowSavings: 0.25,
        riskTaking: 0.1
      },
      description: 'Large unexpected expense (appliance breakdown, emergency repairs)',
      resolutionTimeRange: [1, 7],
      traumaFactors: { unexpectedness: 0.6, controllability: 0.4, socialImpact: 0.2 }
    },
    {
      type: 'scam_victim',
      name: 'Financial Scam',
      baseProbability: 0.02, // 2% per month
      amountRange: [500, 20000],
      severityDistribution: { minor: 0.3, moderate: 0.4, major: 0.25, catastrophic: 0.05 },
      personalityModifiers: {
        financialWisdom: -0.4, // Wise people less likely to fall for scams
        riskTolerance: 0.2 // Risk-takers more likely to be targeted
      },
      behaviorTriggers: {
        luxurySpending: 0.1,
        poorDecisions: 0.3, // Poor decision-makers more vulnerable
        lowSavings: 0.1,
        riskTaking: 0.25
      },
      description: 'Fell victim to financial fraud or scam',
      resolutionTimeRange: [1, 90],
      traumaFactors: { unexpectedness: 0.9, controllability: 0.1, socialImpact: 0.7 }
    },
    {
      type: 'market_crash',
      name: 'Investment Loss',
      baseProbability: 0.04, // 4% per month
      amountRange: [1000, 100000],
      severityDistribution: { minor: 0.3, moderate: 0.35, major: 0.25, catastrophic: 0.1 },
      personalityModifiers: {
        riskTolerance: 0.3, // Risk-takers more exposed
        financialWisdom: -0.1
      },
      behaviorTriggers: {
        luxurySpending: 0.05,
        poorDecisions: 0.2,
        lowSavings: 0.1,
        riskTaking: 0.4 // High correlation with risk-taking
      },
      description: 'Significant investment losses due to market volatility',
      resolutionTimeRange: [30, 365],
      traumaFactors: { unexpectedness: 0.5, controllability: 0.3, socialImpact: 0.4 }
    },
    {
      type: 'housing_crisis',
      name: 'Housing Emergency',
      baseProbability: 0.03, // 3% per month
      amountRange: [3000, 30000],
      severityDistribution: { minor: 0.25, moderate: 0.4, major: 0.25, catastrophic: 0.1 },
      personalityModifiers: {
        financialWisdom: -0.2,
        riskTolerance: 0.1
      },
      behaviorTriggers: {
        luxurySpending: 0.2,
        poorDecisions: 0.15,
        lowSavings: 0.35,
        riskTaking: 0.1
      },
      description: 'Major housing issue (eviction, major repairs, rent increase)',
      resolutionTimeRange: [7, 60],
      traumaFactors: { unexpectedness: 0.6, controllability: 0.4, socialImpact: 0.5 }
    }
  ];

  private constructor() {
    this.eventBus = GameEventBus.getInstance();
    this.financialPsychology = FinancialPsychologyService.getInstance();
    this.luxuryService = LuxuryPurchaseService.getInstance();
  }

  static getInstance(): FinancialCrisisService {
    if (!FinancialCrisisService.instance) {
      FinancialCrisisService.instance = new FinancialCrisisService();
    }
    return FinancialCrisisService.instance;
  }

  /**
   * Start the crisis probability system - checks for potential crises periodically
   */
  startCrisisMonitoring(characters: any[]): void {
    if (this.crisisCheckInterval) {
      clearInterval(this.crisisCheckInterval);
    }

    // Check for crises every 6 hours of real time (represents ~1 game day)
    this.crisisCheckInterval = setInterval(() => {
      this.checkForCrises(characters);
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  /**
   * Stop crisis monitoring
   */
  stopCrisisMonitoring(): void {
    if (this.crisisCheckInterval) {
      clearInterval(this.crisisCheckInterval);
      this.crisisCheckInterval = null;
    }
  }

  /**
   * Check for potential financial crises for all characters
   */
  private async checkForCrises(characters: any[]): Promise<void> {
    for (const character of characters) {
      await this.evaluateCrisisRisk(character);
    }
  }

  /**
   * Evaluate crisis risk for a specific character and potentially trigger a crisis
   */
  async evaluateCrisisRisk(character: any): Promise<void> {
    const recentDecisions = character.financialDecisions || [];
    const personality = character.financialPersonality || this.getDefaultPersonality();
    
    for (const template of this.crisisTemplates) {
      const probability = this.calculateCrisisProbability(
        character,
        template,
        recentDecisions,
        personality
      );
      
      // Roll for crisis occurrence
      if (Math.random() < probability) {
        await this.triggerCrisis(character.id, template, recentDecisions, personality);
        // Only trigger one crisis per check to avoid overwhelming the character
        break;
      }
    }
  }

  /**
   * Calculate the probability of a specific crisis type for a character
   */
  calculateCrisisProbability(
    character: any,
    template: CrisisTemplate,
    recentDecisions: FinancialDecision[],
    personality: FinancialPersonality
  ): number {
    let probability = template.baseProbability;
    
    // Apply personality modifiers
    for (const [trait, modifier] of Object.entries(template.personalityModifiers)) {
      const traitValue = (personality as any)[trait] || 50;
      const normalizedValue = traitValue / 100; // 0-1
      probability += modifier * normalizedValue;
    }
    
    // Apply behavior trigger modifiers
    const behaviorScores = this.calculateBehaviorScores(character, recentDecisions, personality);
    
    probability += template.behaviorTriggers.luxurySpending * behaviorScores.luxurySpending;
    probability += template.behaviorTriggers.poorDecisions * behaviorScores.poorDecisions;
    probability += template.behaviorTriggers.lowSavings * behaviorScores.lowSavings;
    probability += template.behaviorTriggers.riskTaking * behaviorScores.riskTaking;
    
    // Apply existing crisis modifier (multiple crises compound stress)
    const existingCrises = this.activeCrises.get(character.id) || [];
    const activeCrisisCount = existingCrises.filter(c => !c.isResolved).length;
    probability *= Math.max(0.1, 1 - (activeCrisisCount * 0.3)); // Reduce probability with active crises
    
    return Math.max(0, Math.min(0.2, probability)); // Cap at 20% per check
  }

  /**
   * Calculate behavior risk scores for crisis probability
   */
  private calculateBehaviorScores(
    character: any,
    recentDecisions: FinancialDecision[],
    personality: FinancialPersonality
  ): {
    luxurySpending: number;
    poorDecisions: number;
    lowSavings: number;
    riskTaking: number;
  } {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDecisionsList = recentDecisions.filter(d => d.timestamp > thirtyDaysAgo);
    
    // Luxury spending score (0-1)
    const luxuryPurchases = recentDecisionsList.filter(d => d.decision === 'luxury_purchase');
    const totalLuxurySpent = luxuryPurchases.reduce((sum, d) => sum + d.amount, 0);
    const luxurySpending = Math.min(1, totalLuxurySpent / 10000); // Normalize to $10k
    
    // Poor decisions score (0-1)
    const negativeDecisions = recentDecisionsList.filter(d => d.outcome === 'negative');
    const poorDecisions = Math.min(1, negativeDecisions.length / 5); // 5+ bad decisions = max score
    
    // Low savings score (0-1) - higher score = lower savings
    const currentWealth = character.wallet || 0;
    const monthlyEarnings = character.monthlyEarnings || 0;
    const emergencyFundRatio = currentWealth / (monthlyEarnings * 3); // 3 months expenses
    const lowSavings = Math.max(0, 1 - emergencyFundRatio); // Inverse relationship
    
    // Risk taking score (0-1)
    const riskTaking = personality.riskTolerance / 100;
    
    return { luxurySpending, poorDecisions, lowSavings, riskTaking };
  }

  /**
   * Trigger a financial crisis for a character
   */
  async triggerCrisis(
    characterId: string,
    template: CrisisTemplate,
    recentDecisions: FinancialDecision[],
    personality: FinancialPersonality
  ): Promise<FinancialCrisis> {
    // Determine severity
    const severityRoll = Math.random();
    let severity: 'minor' | 'moderate' | 'major' | 'catastrophic' = 'minor';
    let cumulativeProbability = 0;
    
    for (const [sev, prob] of Object.entries(template.severityDistribution)) {
      cumulativeProbability += prob;
      if (severityRoll <= cumulativeProbability) {
        severity = sev as any;
        break;
      }
    }
    
    // Calculate crisis amount based on severity
    const [minAmount, maxAmount] = template.amountRange;
    const severityMultipliers = { minor: 0.3, moderate: 0.6, major: 1.0, catastrophic: 1.5 };
    const baseAmount = minAmount + (maxAmount - minAmount) * Math.random();
    const amount = Math.round(baseAmount * severityMultipliers[severity]);
    
    // Calculate psychological impact
    const traumaBase = template.traumaFactors.unexpectedness * 30 +
                      (1 - template.traumaFactors.controllability) * 20 +
                      template.traumaFactors.socialImpact * 25;
    
    const severityImpactMultipliers = { minor: 0.5, moderate: 0.8, major: 1.2, catastrophic: 2.0 };
    const traumaLevel = Math.min(100, traumaBase * severityImpactMultipliers[severity]);
    
    const stressIncrease = traumaLevel * 0.8; // 80% of trauma becomes immediate stress
    const trustImpact = -traumaLevel * 0.3; // Crisis damages trust in financial advice
    
    // Determine resolution time
    const [minTime, maxTime] = template.resolutionTimeRange;
    const timeToResolve = Math.round(minTime + (maxTime - minTime) * Math.random() * severityImpactMultipliers[severity]);
    
    // Generate trigger factors
    const triggerFactors = this.generateTriggerFactors(template, recentDecisions, personality);
    
    const crisis: FinancialCrisis = {
      id: `crisis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      characterId,
      triggeredDate: new Date(),
      severity,
      amount,
      description: this.generateCrisisDescription(template, severity, amount),
      triggerFactors,
      timeToResolve,
      isResolved: false,
      psychologicalImpact: {
        stressIncrease,
        trustImpact,
        traumaLevel
      },
      ongoingEffects: {
        monthlyStressPenalty: traumaLevel * 0.1, // 10% of trauma = ongoing stress
        decisionQualityPenalty: traumaLevel * 0.15, // 15% of trauma = decision impairment
        durationDays: timeToResolve + Math.round(traumaLevel) // Trauma lasts beyond resolution
      }
    };
    
    // Add to active crises
    if (!this.activeCrises.has(characterId)) {
      this.activeCrises.set(characterId, []);
    }
    this.activeCrises.get(characterId)!.push(crisis);
    
    // Publish crisis event
    await this.eventBus.publishEvent({
      type: 'financial_crisis',
      source: 'financial_advisory',
      primaryCharacterId: characterId,
      severity: severity === 'catastrophic' ? 'critical' : severity === 'major' ? 'high' : 'medium',
      category: 'financial',
      description: crisis.description,
      metadata: {
        crisisId: crisis.id,
        crisisType: template.type,
        amount,
        severity,
        triggerFactors,
        timeToResolve,
        traumaLevel,
        stressIncrease,
        trustImpact
      },
      tags: ['crisis', 'emergency', 'trauma', template.type],
      emotionalImpact: [{
        characterId,
        impact: 'negative',
        intensity: Math.min(10, Math.ceil(traumaLevel / 10))
      }]
    });
    
    return crisis;
  }

  /**
   * Generate contextual trigger factors for the crisis
   */
  private generateTriggerFactors(
    template: CrisisTemplate,
    recentDecisions: FinancialDecision[],
    personality: FinancialPersonality
  ): string[] {
    const factors: string[] = [];
    
    // Add personality-based factors
    if (personality.riskTolerance > 70 && template.behaviorTriggers.riskTaking > 0.2) {
      factors.push('High-risk behavior increased vulnerability');
    }
    
    if (personality.financialWisdom < 40) {
      factors.push('Limited financial planning and preparation');
    }
    
    // Add behavior-based factors
    const luxuryPurchases = recentDecisions.filter(d => d.decision === 'luxury_purchase');
    if (luxuryPurchases.length > 3) {
      factors.push('Recent luxury spending reduced emergency reserves');
    }
    
    const poorDecisions = recentDecisions.filter(d => d.outcome === 'negative');
    if (poorDecisions.length > 2) {
      factors.push('Series of poor financial decisions created vulnerability');
    }
    
    return factors;
  }

  /**
   * Generate a detailed crisis description
   */
  private generateCrisisDescription(
    template: CrisisTemplate,
    severity: string,
    amount: number
  ): string {
    const severityDescriptors = {
      minor: 'minor',
      moderate: 'significant',
      major: 'serious',
      catastrophic: 'devastating'
    };
    
    return `${severityDescriptors[severity as keyof typeof severityDescriptors]} ${template.description.toLowerCase()} requiring $${amount.toLocaleString()} to resolve`;
  }

  /**
   * Get active crises for a character
   */
  getActiveCrises(characterId: string): FinancialCrisis[] {
    const crises = this.activeCrises.get(characterId) || [];
    return crises.filter(c => !c.isResolved);
  }

  /**
   * Get all crises (including resolved) for a character
   */
  getAllCrises(characterId: string): FinancialCrisis[] {
    return this.activeCrises.get(characterId) || [];
  }

  /**
   * Resolve a crisis
   */
  async resolveCrisis(
    crisisId: string,
    characterId: string,
    resolutionMethod: string
  ): Promise<void> {
    const crises = this.activeCrises.get(characterId) || [];
    const crisis = crises.find(c => c.id === crisisId);
    
    if (!crisis || crisis.isResolved) {
      return;
    }
    
    crisis.isResolved = true;
    crisis.resolutionMethod = resolutionMethod;
    crisis.resolutionDate = new Date();
    
    await this.eventBus.publishEvent({
      type: 'financial_crisis',
      source: 'financial_advisory',
      primaryCharacterId: characterId,
      severity: 'medium',
      category: 'financial',
      description: `Financial crisis resolved: ${crisis.description}`,
      metadata: {
        crisisId,
        crisisType: crisis.type,
        resolutionMethod,
        originalAmount: crisis.amount,
        resolutionTime: Math.round((Date.now() - crisis.triggeredDate.getTime()) / (1000 * 60 * 60 * 24))
      },
      tags: ['crisis', 'resolution', crisis.type]
    });
  }

  /**
   * Get default personality for characters without one
   */
  private getDefaultPersonality(): FinancialPersonality {
    return {
      spendingStyle: 'moderate',
      moneyMotivations: ['security'],
      financialWisdom: 50,
      riskTolerance: 50,
      luxuryDesire: 50,
      generosity: 50,
      financialTraumas: [],
      moneyBeliefs: []
    };
  }
}

export default FinancialCrisisService;