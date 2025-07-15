// Financial Psychology Service
// Implements money-stress psychological feedback system for character financial behavior

import { FinancialPersonality, FinancialDecision } from '../data/characters';
import GameEventBus from './gameEventBus';

export interface FinancialStressFactors {
  lowMoney: number;           // Stress from having little money
  debtPressure: number;       // Stress from owing money
  recentLosses: number;       // Stress from recent financial losses
  uncertainty: number;       // Stress from unpredictable income
  socialPressure: number;    // Stress from comparing to others
  goalProgress: number;      // Stress from not reaching financial goals
}

export interface FinancialDecisionQuality {
  impulsiveness: number;     // 0-100, higher = more impulsive decisions
  riskAssessment: number;    // 0-100, higher = better at evaluating risks
  longTermThinking: number;  // 0-100, higher = considers future impact
  coachInfluence: number;    // 0-100, how much coach advice matters
  overallQuality: number;    // 0-100, overall decision-making quality
}

export class FinancialPsychologyService {
  private static instance: FinancialPsychologyService;
  private eventBus: GameEventBus;

  private constructor() {
    this.eventBus = GameEventBus.getInstance();
  }

  static getInstance(): FinancialPsychologyService {
    if (!FinancialPsychologyService.instance) {
      FinancialPsychologyService.instance = new FinancialPsychologyService();
    }
    return FinancialPsychologyService.instance;
  }

  /**
   * Calculate financial stress based on multiple factors
   */
  calculateFinancialStress(
    characterId: string,
    wallet: number,
    monthlyEarnings: number,
    recentDecisions: FinancialDecision[],
    financialPersonality: FinancialPersonality
  ): { stress: number; factors: FinancialStressFactors; recommendations: string[] } {
    
    const factors: FinancialStressFactors = {
      lowMoney: this.calculateLowMoneyStress(wallet, monthlyEarnings),
      debtPressure: this.calculateDebtStress(wallet),
      recentLosses: this.calculateRecentLossStress(recentDecisions),
      uncertainty: this.calculateUncertaintyStress(monthlyEarnings, recentDecisions),
      socialPressure: this.calculateSocialPressureStress(wallet, characterId),
      goalProgress: this.calculateGoalProgressStress(wallet, financialPersonality)
    };

    // Weight factors based on financial personality
    const personalityWeights = this.getPersonalityStressWeights(financialPersonality);
    
    const weightedStress = 
      factors.lowMoney * personalityWeights.moneyAnxiety +
      factors.debtPressure * personalityWeights.debtAnxiety +
      factors.recentLosses * personalityWeights.lossAnxiety +
      factors.uncertainty * personalityWeights.uncertaintyAnxiety +
      factors.socialPressure * personalityWeights.socialAnxiety +
      factors.goalProgress * personalityWeights.goalAnxiety;

    const totalStress = Math.min(100, Math.max(0, weightedStress));

    // Generate stress-reduction recommendations
    const recommendations = this.generateStressRecommendations(factors, financialPersonality);

    return { stress: totalStress, factors, recommendations };
  }

  /**
   * Calculate decision quality based on current stress and personality
   */
  calculateDecisionQuality(
    financialStress: number,
    financialPersonality: FinancialPersonality,
    coachTrust: number,
    recentDecisions: FinancialDecision[]
  ): FinancialDecisionQuality {
    
    // Base quality starts with financial wisdom
    let baseQuality = financialPersonality.financialWisdom;
    
    // Stress heavily impacts decision quality (high stress = poor decisions)
    const stressImpact = Math.max(0, 100 - (financialStress * 1.5));
    
    // Calculate impulsiveness (higher stress + impulsive personality = more impulsive)
    const baseImpulsiveness = this.getSpendingStyleImpulsiveness(financialPersonality.spendingStyle);
    const stressImpulsiveness = financialStress * 0.8;
    const impulsiveness = Math.min(100, baseImpulsiveness + stressImpulsiveness);
    
    // Risk assessment gets worse under stress
    const riskAssessment = Math.max(10, 
      (financialPersonality.riskTolerance + baseQuality) / 2 - (financialStress * 0.6)
    );
    
    // Long-term thinking deteriorates under high stress
    const longTermThinking = Math.max(5, 
      baseQuality - (financialStress * 0.7) - (impulsiveness * 0.3)
    );
    
    // Coach influence based on trust and stress (high stress can make them ignore advice)
    const stressPanic = financialStress > 70 ? 30 : 0; // Panic makes them ignore advice
    const coachInfluence = Math.max(0, coachTrust - stressPanic);
    
    // Overall quality is average of all factors, weighted by stress
    const overallQuality = Math.max(5, 
      (riskAssessment + longTermThinking + (100 - impulsiveness) + coachInfluence) / 4 * (stressImpact / 100)
    );

    return {
      impulsiveness,
      riskAssessment,
      longTermThinking,
      coachInfluence,
      overallQuality
    };
  }

  /**
   * Update character financial stress and publish events
   */
  async updateCharacterFinancialStress(
    characterId: string,
    oldStress: number,
    newStress: number,
    reason: string
  ): Promise<void> {
    const stressChange = Math.abs(newStress - oldStress);
    
    // Only publish events for significant changes
    if (stressChange >= 5) {
      await this.eventBus.publishFinancialStressChange(characterId, oldStress, newStress, reason);
      
      // Trigger stress-related events for high stress levels
      if (newStress >= 80) {
        await this.eventBus.publishFinancialEvent(
          'financial_crisis',
          characterId,
          `${characterId} is experiencing severe financial stress (${newStress}%)`,
          { stressLevel: newStress, triggerReason: reason, type: 'severe_stress' },
          'critical'
        );
      } else if (newStress >= 60) {
        await this.eventBus.publishFinancialEvent(
          'financial_stress_increase',
          characterId,
          `${characterId} is showing signs of financial anxiety (${newStress}%)`,
          { stressLevel: newStress, triggerReason: reason, type: 'moderate_stress' },
          'high'
        );
      }
    }
  }

  /**
   * Simulate financial decision outcome based on choice quality
   */
  simulateDecisionOutcome(
    decision: FinancialDecision,
    decisionQuality: FinancialDecisionQuality,
    financialPersonality: FinancialPersonality
  ): { 
    financialImpact: number; 
    stressImpact: number; 
    trustImpact: number; 
    outcome: 'positive' | 'negative' | 'neutral';
    description: string;
  } {
    
    // Better decision quality = better outcomes (but still some randomness)
    const qualityBonus = (decisionQuality.overallQuality - 50) / 100; // -0.5 to +0.5
    const randomFactor = (Math.random() - 0.5) * 0.3; // -0.15 to +0.15
    const successChance = 0.5 + qualityBonus + randomFactor;
    
    let financialImpact = 0;
    let stressImpact = 0;
    let trustImpact = 0;
    let outcome: 'positive' | 'negative' | 'neutral' = 'neutral';
    let description = '';

    // Calculate impact based on decision type and quality
    switch (decision.decision) {
      case 'investment':
        if (successChance > 0.6) {
          financialImpact = decision.amount * (0.1 + Math.random() * 0.2); // 10-30% return
          stressImpact = -10; // Reduces stress
          trustImpact = decision.followedAdvice ? 5 : 0;
          outcome = 'positive';
          description = 'Investment performed well, generating solid returns';
        } else if (successChance < 0.3) {
          financialImpact = -decision.amount * (0.05 + Math.random() * 0.15); // 5-20% loss
          stressImpact = 15; // Increases stress
          trustImpact = decision.followedAdvice ? -3 : -10; // Less trust loss if followed advice
          outcome = 'negative';
          description = 'Investment underperformed, resulting in losses';
        } else {
          financialImpact = decision.amount * (-0.02 + Math.random() * 0.06); // -2% to +4%
          stressImpact = Math.random() > 0.5 ? 2 : -2;
          trustImpact = decision.followedAdvice ? 1 : 0;
          outcome = 'neutral';
          description = 'Investment showed modest results';
        }
        break;

      case 'luxury_purchase':
        // Luxury purchases provide immediate happiness but potential regret
        const immediateHappiness = financialPersonality.luxuryDesire / 10;
        if (financialPersonality.spendingStyle === 'impulsive') {
          stressImpact = -immediateHappiness + 10; // Initial joy then regret
          trustImpact = decision.followedAdvice ? 0 : -5; // Coach probably advised against it
          outcome = 'negative';
          description = 'Luxury purchase provided temporary satisfaction but increased financial pressure';
        } else {
          stressImpact = -immediateHappiness + 5; // Less regret if planned
          trustImpact = decision.followedAdvice ? 2 : -2;
          outcome = 'neutral';
          description = 'Luxury purchase was enjoyed but added to expenses';
        }
        financialImpact = -decision.amount; // Money spent
        break;

      case 'real_estate':
        // Real estate is generally safer but requires good timing
        if (successChance > 0.5) {
          financialImpact = decision.amount * (0.05 + Math.random() * 0.15); // 5-20% appreciation
          stressImpact = -15; // Security reduces stress
          trustImpact = decision.followedAdvice ? 8 : 3;
          outcome = 'positive';
          description = 'Real estate investment provided security and appreciation';
        } else {
          financialImpact = -decision.amount * (0.02 + Math.random() * 0.08); // 2-10% loss
          stressImpact = 5; // Some stress from loss
          trustImpact = decision.followedAdvice ? -1 : -5;
          outcome = 'negative';
          description = 'Real estate market conditions were unfavorable';
        }
        break;

      case 'party':
        // Parties boost social but cost money
        financialImpact = -decision.amount;
        stressImpact = -5; // Social activity reduces stress
        trustImpact = decision.followedAdvice ? 0 : -3; // Coach probably advised moderation
        outcome = 'neutral';
        description = 'Party was enjoyable and boosted social connections';
        break;

      case 'wildcard':
        // Wildcard decisions are unpredictable
        const wildSuccess = Math.random();
        if (wildSuccess > 0.8) {
          financialImpact = decision.amount * (0.5 + Math.random()); // 50-150% return
          stressImpact = -20;
          trustImpact = 5; // Lucky outcomes build confidence
          outcome = 'positive';
          description = 'Wildcard decision paid off spectacularly!';
        } else if (wildSuccess < 0.3) {
          financialImpact = -decision.amount * (0.3 + Math.random() * 0.7); // 30-100% loss
          stressImpact = 25;
          trustImpact = -8;
          outcome = 'negative';
          description = 'Wildcard decision backfired significantly';
        } else {
          financialImpact = decision.amount * (-0.1 + Math.random() * 0.3); // -10% to +20%
          stressImpact = Math.random() > 0.5 ? 5 : -5;
          trustImpact = Math.random() > 0.5 ? 2 : -2;
          outcome = 'neutral';
          description = 'Wildcard decision had mixed results';
        }
        break;
    }

    return { financialImpact, stressImpact, trustImpact, outcome, description };
  }

  // Private helper methods
  private calculateLowMoneyStress(wallet: number, monthlyEarnings: number): number {
    const monthsOfExpenses = wallet / Math.max(monthlyEarnings, 1000); // Assume $1k minimum expenses
    if (monthsOfExpenses < 1) return 80; // Less than 1 month = high stress
    if (monthsOfExpenses < 3) return 50; // Less than 3 months = moderate stress
    if (monthsOfExpenses < 6) return 20; // Less than 6 months = mild stress
    return 0; // 6+ months = no stress from low money
  }

  private calculateDebtStress(wallet: number): number {
    if (wallet < 0) {
      const debtAmount = Math.abs(wallet);
      return Math.min(90, debtAmount / 1000 * 10); // $1k debt = 10 stress points
    }
    return 0;
  }

  private calculateRecentLossStress(recentDecisions: FinancialDecision[]): number {
    const recentLosses = recentDecisions
      .filter(d => d.financialImpact < 0 && d.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, d) => sum + Math.abs(d.financialImpact), 0);
    
    return Math.min(60, recentLosses / 1000 * 5); // $1k loss = 5 stress points
  }

  private calculateUncertaintyStress(monthlyEarnings: number, recentDecisions: FinancialDecision[]): number {
    const earningsVariability = monthlyEarnings === 0 ? 50 : 0; // No income = high uncertainty
    const recentDecisionCount = recentDecisions.filter(
      d => d.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    
    return Math.min(40, earningsVariability + recentDecisionCount * 3);
  }

  private calculateSocialPressureStress(wallet: number, characterId: string): number {
    // Simplified - in full implementation, compare to other characters
    const averageWealth = 25000; // Mock average
    const wealthGap = (averageWealth - wallet) / averageWealth * 100;
    return Math.max(0, Math.min(30, wealthGap));
  }

  private calculateGoalProgressStress(wallet: number, personality: FinancialPersonality): number {
    // Mock goal comparison - in full implementation, track actual goals
    const impliedGoal = personality.luxuryDesire * 1000; // Higher luxury desire = higher goals
    const progressToGoal = wallet / impliedGoal * 100;
    
    if (progressToGoal < 25) return 25;
    if (progressToGoal < 50) return 15;
    if (progressToGoal < 75) return 5;
    return 0;
  }

  private getPersonalityStressWeights(personality: FinancialPersonality) {
    const baseWeights = {
      moneyAnxiety: 1.0,
      debtAnxiety: 1.0,
      lossAnxiety: 1.0,
      uncertaintyAnxiety: 1.0,
      socialAnxiety: 1.0,
      goalAnxiety: 1.0
    };

    // Adjust weights based on personality
    switch (personality.spendingStyle) {
      case 'conservative':
        return { ...baseWeights, uncertaintyAnxiety: 1.5, lossAnxiety: 1.3 };
      case 'impulsive':
        return { ...baseWeights, moneyAnxiety: 1.4, socialAnxiety: 1.3 };
      case 'strategic':
        return { ...baseWeights, goalAnxiety: 1.3, uncertaintyAnxiety: 0.8 };
      default:
        return baseWeights;
    }
  }

  private getSpendingStyleImpulsiveness(style: string): number {
    switch (style) {
      case 'impulsive': return 85;
      case 'moderate': return 50;
      case 'conservative': return 20;
      case 'strategic': return 15;
      default: return 50;
    }
  }

  private generateStressRecommendations(factors: FinancialStressFactors, personality: FinancialPersonality): string[] {
    const recommendations: string[] = [];
    
    if (factors.lowMoney > 40) {
      recommendations.push('Focus on building emergency fund through consistent battle earnings');
    }
    if (factors.debtPressure > 30) {
      recommendations.push('Prioritize debt reduction over luxury purchases');
    }
    if (factors.recentLosses > 30) {
      recommendations.push('Take a break from high-risk investments to rebuild confidence');
    }
    if (factors.uncertainty > 35) {
      recommendations.push('Establish more predictable income sources through regular training');
    }
    if (factors.socialPressure > 20) {
      recommendations.push('Focus on personal financial goals rather than comparing to others');
    }
    if (factors.goalProgress > 20) {
      recommendations.push('Break down large financial goals into smaller, achievable milestones');
    }

    return recommendations;
  }
}

export default FinancialPsychologyService;