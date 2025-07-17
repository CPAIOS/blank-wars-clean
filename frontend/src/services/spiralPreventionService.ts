// Downward Spiral Prevention Service
// Uses coaching influence to prevent and break financial decision spirals
import { FinancialPersonality, FinancialDecision } from '../data/characters';
import GameEventBus from './gameEventBus';
import { FinancialPsychologyService, SpiralState } from './financialPsychologyService';

export interface PreventionIntervention {
  id: string;
  characterId: string;
  coachId: string;
  interventionType: 'early_warning' | 'spiral_interruption' | 'recovery_support';
  spiralIntensity: number;
  coachEffectiveness: number;
  interventionMethod: string;
  success: boolean;
  timestamp: Date;
}

export class SpiralPreventionService {
  private static instance: SpiralPreventionService;
  private eventBus: GameEventBus;
  private psychologyService: FinancialPsychologyService;

  private constructor() {
    this.eventBus = GameEventBus.getInstance();
    this.psychologyService = FinancialPsychologyService.getInstance();
  }

  static getInstance(): SpiralPreventionService {
    if (!SpiralPreventionService.instance) {
      SpiralPreventionService.instance = new SpiralPreventionService();
    }
    return SpiralPreventionService.instance;
  }

  /**
   * Monitor character for spiral risk and trigger preventive interventions
   */
  async monitorAndPrevent(
    characterId: string,
    coachId: string,
    recentDecisions: FinancialDecision[],
    coachLevel: number,
    coachTrust: number,
    financialPersonality: FinancialPersonality
  ): Promise<{
    interventionTriggered: boolean;
    intervention?: PreventionIntervention;
    spiralRiskReduction: number;
  }> {
    const spiralState = this.psychologyService.calculateSpiralState(recentDecisions);
    
    // Calculate coach bonuses
    const coachBonuses = this.calculateCoachBonuses(coachLevel);
    const adjustedEffectiveness = coachTrust * (1 + coachBonuses.spiralPreventionBonus / 100);
    
    // Determine intervention threshold based on coach level
    const interventionThreshold = Math.max(30, 60 - coachBonuses.spiralPreventionBonus);
    
    let interventionTriggered = false;
    let intervention: PreventionIntervention | undefined;
    let spiralRiskReduction = 0;

    // Early warning intervention (before spiral starts)
    if (!spiralState.isInSpiral && spiralState.spiralRisk > interventionThreshold) {
      intervention = await this.triggerEarlyWarning(
        characterId, coachId, spiralState, adjustedEffectiveness, financialPersonality
      );
      interventionTriggered = true;
      spiralRiskReduction = this.calculateRiskReduction(intervention);
    }
    
    // Active spiral interruption
    else if (spiralState.isInSpiral && spiralState.spiralIntensity < 80) {
      intervention = await this.triggerSpiralInterruption(
        characterId, coachId, spiralState, adjustedEffectiveness, financialPersonality
      );
      interventionTriggered = true;
      spiralRiskReduction = this.calculateRiskReduction(intervention);
    }

    return {
      interventionTriggered,
      intervention,
      spiralRiskReduction
    };
  }

  /**
   * Early warning intervention before spiral starts
   */
  private async triggerEarlyWarning(
    characterId: string,
    coachId: string,
    spiralState: SpiralState,
    coachEffectiveness: number,
    financialPersonality: FinancialPersonality
  ): Promise<PreventionIntervention> {
    const methods = this.getInterventionMethods('early_warning', financialPersonality);
    const selectedMethod = methods[Math.floor(Math.random() * methods.length)];
    
    const successRate = Math.min(95, coachEffectiveness * 0.8 + 20);
    const success = Math.random() * 100 < successRate;
    
    const intervention: PreventionIntervention = {
      id: `early_${characterId}_${Date.now()}`,
      characterId,
      coachId,
      interventionType: 'early_warning',
      spiralIntensity: spiralState.spiralRisk,
      coachEffectiveness,
      interventionMethod: selectedMethod,
      success,
      timestamp: new Date()
    };

    // Publish intervention event
    this.eventBus.publish(
      'spiral_prevention_intervention',
      characterId,
      `Coach provided early warning intervention: ${selectedMethod}`,
      {
        intervention,
        type: 'early_warning',
        success
      }
    );

    return intervention;
  }

  /**
   * Active spiral interruption
   */
  private async triggerSpiralInterruption(
    characterId: string,
    coachId: string,
    spiralState: SpiralState,
    coachEffectiveness: number,
    financialPersonality: FinancialPersonality
  ): Promise<PreventionIntervention> {
    const methods = this.getInterventionMethods('spiral_interruption', financialPersonality);
    const selectedMethod = methods[Math.floor(Math.random() * methods.length)];
    
    // Harder to interrupt active spirals
    const successRate = Math.min(85, coachEffectiveness * 0.6 + 15);
    const success = Math.random() * 100 < successRate;
    
    const intervention: PreventionIntervention = {
      id: `interrupt_${characterId}_${Date.now()}`,
      characterId,
      coachId,
      interventionType: 'spiral_interruption',
      spiralIntensity: spiralState.spiralIntensity,
      coachEffectiveness,
      interventionMethod: selectedMethod,
      success,
      timestamp: new Date()
    };

    // Publish intervention event
    this.eventBus.publish(
      'spiral_prevention_intervention',
      characterId,
      `Coach interrupted financial spiral: ${selectedMethod}`,
      {
        intervention,
        type: 'spiral_interruption',
        success
      }
    );

    return intervention;
  }

  /**
   * Get appropriate intervention methods based on personality
   */
  private getInterventionMethods(
    type: 'early_warning' | 'spiral_interruption',
    personality: FinancialPersonality
  ): string[] {
    const baseMethods = {
      early_warning: [
        'Gentle reminder about financial goals',
        'Suggestion to review recent spending patterns',
        'Encouragement to stick to the budget',
        'Recommendation for a financial check-in',
        'Advice to pause before major decisions'
      ],
      spiral_interruption: [
        'Strong recommendation to stop current spending',
        'Urgent suggestion for financial timeout',
        'Intervention meeting to reset priorities',
        'Emergency budget review session',
        'Direct challenge of current decision pattern'
      ]
    };

    const methods = [...baseMethods[type]];

    // Personality-specific methods
    if (personality.spendingStyle === 'impulsive') {
      if (type === 'early_warning') {
        methods.push('Implementation of 24-hour rule for purchases');
        methods.push('Setup of automatic savings transfers');
      } else {
        methods.push('Immediate removal of payment methods');
        methods.push('Accountability partner activation');
      }
    } else if (personality.spendingStyle === 'strategic') {
      if (type === 'early_warning') {
        methods.push('Analysis of decision-making framework');
        methods.push('Review of financial strategy alignment');
      } else {
        methods.push('Strategic reassessment of current approach');
        methods.push('Return to structured decision process');
      }
    }

    return methods;
  }

  /**
   * Calculate spiral risk reduction from intervention
   */
  private calculateRiskReduction(intervention: PreventionIntervention): number {
    if (!intervention.success) return 0;

    const baseReduction = {
      early_warning: 30,
      spiral_interruption: 45,
      recovery_support: 25
    }[intervention.interventionType];

    // Effectiveness modifier
    const effectivenessMultiplier = intervention.coachEffectiveness / 100;
    
    return Math.floor(baseReduction * effectivenessMultiplier);
  }

  /**
   * Calculate coach bonuses for spiral prevention
   */
  private calculateCoachBonuses(coachLevel: number): {
    spiralPreventionBonus: number;
    earlyDetectionBonus: number;
    interventionEffectiveness: number;
  } {
    let spiralPreventionBonus = 0;
    let earlyDetectionBonus = 0;
    let interventionEffectiveness = 0;

    // Tier-based bonuses
    if (coachLevel >= 1) {
      spiralPreventionBonus += 25;
      earlyDetectionBonus += 15;
      interventionEffectiveness += 10;
    }
    if (coachLevel >= 26) {
      spiralPreventionBonus += 35;
      earlyDetectionBonus += 20;
      interventionEffectiveness += 15;
    }
    if (coachLevel >= 51) {
      spiralPreventionBonus += 40;
      earlyDetectionBonus += 25;
      interventionEffectiveness += 20;
    }
    if (coachLevel >= 76) {
      spiralPreventionBonus += 50;
      earlyDetectionBonus += 30;
      interventionEffectiveness += 25;
    }
    if (coachLevel >= 101) {
      spiralPreventionBonus += 50; // Total: 200% (triple effectiveness)
      earlyDetectionBonus += 35;   // Total: 125%
      interventionEffectiveness += 30; // Total: 100%
    }

    return {
      spiralPreventionBonus,
      earlyDetectionBonus,
      interventionEffectiveness
    };
  }
}

export default SpiralPreventionService;