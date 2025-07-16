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
  spiralRisk: number;        // 0-100, risk of entering decision spiral
  desperationMode: boolean;  // True when in panic mode (80%+ stress)
}

export interface SpiralState {
  isInSpiral: boolean;
  spiralIntensity: number;  // 0-100, how deep in the spiral
  consecutivePoorDecisions: number;
  spiralTrigger?: string;   // What started the spiral
  interventionNeeded: boolean;
  recommendations: string[];
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
    
    // Calculate spiral state first
    const spiralState = this.calculateSpiralState(recentDecisions, financialStress);
    
    // Base quality starts with financial wisdom
    let baseQuality = financialPersonality.financialWisdom;
    
    // Apply spiral penalty if in a downward spiral
    if (spiralState.isInSpiral) {
      baseQuality *= (1 - spiralState.spiralIntensity / 100 * 0.5); // Up to 50% reduction
    }
    
    // Stress heavily impacts decision quality (high stress = poor decisions)
    const stressImpact = Math.max(0, 100 - (financialStress * 1.5));
    
    // Calculate impulsiveness (higher stress + impulsive personality = more impulsive)
    const baseImpulsiveness = this.getSpendingStyleImpulsiveness(financialPersonality.spendingStyle);
    const stressImpulsiveness = financialStress * 0.8;
    const spiralImpulsiveness = spiralState.isInSpiral ? spiralState.spiralIntensity * 0.5 : 0;
    const impulsiveness = Math.min(100, baseImpulsiveness + stressImpulsiveness + spiralImpulsiveness);
    
    // Risk assessment gets worse under stress and spiral
    const riskAssessment = Math.max(5, 
      (financialPersonality.riskTolerance + baseQuality) / 2 - (financialStress * 0.6) - (spiralState.spiralIntensity * 0.4)
    );
    
    // Long-term thinking deteriorates under high stress and spiral
    const longTermThinking = Math.max(3, 
      baseQuality - (financialStress * 0.7) - (impulsiveness * 0.3) - (spiralState.spiralIntensity * 0.5)
    );
    
    // Coach influence based on trust and stress (high stress can make them ignore advice)
    const desperationMode = financialStress >= 80;
    const stressPanic = desperationMode ? 50 : financialStress > 70 ? 30 : 0; // Desperation = major trust issues
    const spiralDistrust = spiralState.isInSpiral ? spiralState.spiralIntensity * 0.2 : 0;
    const coachInfluence = Math.max(0, coachTrust - stressPanic - spiralDistrust);
    
    // Overall quality is average of all factors, weighted by stress and spiral
    const spiralPenalty = spiralState.isInSpiral ? (1 - spiralState.spiralIntensity / 200) : 1;
    const overallQuality = Math.max(3, 
      (riskAssessment + longTermThinking + (100 - impulsiveness) + coachInfluence) / 4 * (stressImpact / 100) * spiralPenalty
    );

    return {
      impulsiveness,
      riskAssessment,
      longTermThinking,
      coachInfluence,
      overallQuality,
      spiralRisk: spiralState.spiralIntensity,
      desperationMode
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

  /**
   * Calculate if character is in a financial decision spiral
   */
  calculateSpiralState(recentDecisions: FinancialDecision[], currentStress: number): SpiralState {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentDecisionsList = recentDecisions.filter(d => d.timestamp > thirtyDaysAgo);
    
    // Count consecutive poor decisions
    let consecutivePoorDecisions = 0;
    let totalLosses = 0;
    let lastGoodDecision = null;
    
    // Check decisions in reverse chronological order
    const sortedDecisions = [...recentDecisionsList].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    for (const decision of sortedDecisions) {
      if (decision.outcome === 'negative' || decision.financialImpact < -1000) {
        consecutivePoorDecisions++;
        totalLosses += Math.abs(decision.financialImpact);
      } else if (decision.outcome === 'positive') {
        lastGoodDecision = decision;
        break; // Stop counting at the first good decision
      }
    }
    
    // Calculate spiral intensity based on multiple factors
    const lossIntensity = Math.min(40, totalLosses / 1000 * 5); // $1k loss = 5 intensity
    const consecutiveIntensity = Math.min(30, consecutivePoorDecisions * 10); // Each poor decision = 10 intensity
    const stressIntensity = currentStress > 70 ? 30 : currentStress > 50 ? 15 : 0;
    
    const spiralIntensity = Math.min(100, lossIntensity + consecutiveIntensity + stressIntensity);
    const isInSpiral = consecutivePoorDecisions >= 3 || (consecutivePoorDecisions >= 2 && currentStress > 60);
    
    // Determine spiral trigger
    let spiralTrigger: string | undefined;
    if (isInSpiral && sortedDecisions.length > 0) {
      const firstPoorDecision = sortedDecisions[consecutivePoorDecisions - 1];
      spiralTrigger = firstPoorDecision.description || 'Initial financial setback';
    }
    
    // Generate intervention recommendations
    const recommendations: string[] = [];
    const interventionNeeded = spiralIntensity > 60 || consecutivePoorDecisions >= 3;
    
    if (interventionNeeded) {
      recommendations.push('Immediate coach intervention required to break negative spiral');
      recommendations.push('Consider therapy session focused on financial anxiety');
      recommendations.push('Implement mandatory cooling-off period before next financial decision');
      
      if (currentStress > 70) {
        recommendations.push('Stress reduction activities needed before any financial choices');
      }
      if (consecutivePoorDecisions >= 4) {
        recommendations.push('Team support intervention - peer assistance can help');
      }
    }
    
    return {
      isInSpiral,
      spiralIntensity,
      consecutivePoorDecisions,
      spiralTrigger,
      interventionNeeded,
      recommendations
    };
  }

  /**
   * Detect and publish spiral events
   */
  async detectAndPublishSpiralEvents(
    characterId: string,
    spiralState: SpiralState,
    previousSpiralState?: SpiralState
  ): Promise<void> {
    // Entering spiral
    if (spiralState.isInSpiral && (!previousSpiralState || !previousSpiralState.isInSpiral)) {
      await this.eventBus.publishFinancialEvent(
        'financial_spiral_started',
        characterId,
        `${characterId} has entered a financial decision spiral after ${spiralState.consecutivePoorDecisions} poor decisions`,
        { 
          spiralIntensity: spiralState.spiralIntensity,
          trigger: spiralState.spiralTrigger,
          consecutivePoorDecisions: spiralState.consecutivePoorDecisions,
          type: 'spiral_start'
        },
        'critical'
      );
    }
    
    // Spiral intensifying
    if (spiralState.isInSpiral && previousSpiralState?.isInSpiral && 
        spiralState.spiralIntensity > previousSpiralState.spiralIntensity + 10) {
      await this.eventBus.publishFinancialEvent(
        'financial_spiral_deepening',
        characterId,
        `${characterId}'s financial spiral is intensifying (${spiralState.spiralIntensity}% intensity)`,
        { 
          oldIntensity: previousSpiralState.spiralIntensity,
          newIntensity: spiralState.spiralIntensity,
          type: 'spiral_deepening'
        },
        'critical'
      );
    }
    
    // Exiting spiral
    if (!spiralState.isInSpiral && previousSpiralState?.isInSpiral) {
      await this.eventBus.publishFinancialEvent(
        'financial_spiral_broken',
        characterId,
        `${characterId} has broken out of their financial decision spiral`,
        { 
          finalIntensity: previousSpiralState.spiralIntensity,
          breakingFactor: 'positive_decision',
          type: 'spiral_broken'
        },
        'high'
      );
    }
  }

  /**
   * Calculate financial trust in coach based on advice outcomes and relationship
   */
  calculateFinancialTrust(
    characterId: string,
    recentDecisions: FinancialDecision[],
    baseCoachTrust: number,
    financialPersonality: FinancialPersonality,
    currentWallet: number,
    monthlyEarnings: number
  ): {
    financialTrust: number;
    trustFactors: {
      adviceSuccess: number;
      recentOutcomes: number;
      personalityMatch: number;
      stressInfluence: number;
    };
    recommendations: string[];
  } {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentFinancialDecisions = recentDecisions.filter(d => d.timestamp > thirtyDaysAgo);
    
    // Calculate advice success rate
    const advisedDecisions = recentFinancialDecisions.filter(d => d.coachAdvice);
    const followedAdvice = advisedDecisions.filter(d => d.followedAdvice);
    const successfulAdvice = followedAdvice.filter(d => d.outcome === 'positive');
    
    const adviceSuccessRate = followedAdvice.length > 0 ? 
      (successfulAdvice.length / followedAdvice.length) * 100 : 50;
    
    // Calculate recent outcomes impact
    const recentOutcomes = recentFinancialDecisions.slice(-5); // Last 5 decisions
    const positiveOutcomes = recentOutcomes.filter(d => d.outcome === 'positive').length;
    const negativeOutcomes = recentOutcomes.filter(d => d.outcome === 'negative').length;
    const outcomeScore = recentOutcomes.length > 0 ? 
      ((positiveOutcomes - negativeOutcomes) / recentOutcomes.length) * 50 + 50 : 50;
    
    // Calculate personality match with coach advice style
    const personalityMatch = this.calculateCoachPersonalityMatch(financialPersonality);
    
    // Calculate stress influence on trust
    const currentStress = this.calculateFinancialStress(
      characterId, 
      currentWallet,
      monthlyEarnings,
      recentDecisions,
      financialPersonality
    ).stress;
    
    const stressInfluence = Math.max(0, 100 - (currentStress * 0.8)); // High stress reduces trust
    
    // Weight the factors
    const trustFactors = {
      adviceSuccess: adviceSuccessRate,
      recentOutcomes: outcomeScore,
      personalityMatch: personalityMatch,
      stressInfluence: stressInfluence
    };
    
    // Calculate weighted financial trust
    const financialTrust = Math.round(
      (baseCoachTrust * 0.3) +           // Base coach relationship
      (trustFactors.adviceSuccess * 0.3) +  // Advice track record
      (trustFactors.recentOutcomes * 0.2) +  // Recent results
      (trustFactors.personalityMatch * 0.1) + // Personality compatibility
      (trustFactors.stressInfluence * 0.1)    // Stress impact
    );
    
    // Generate trust-building recommendations
    const recommendations = this.generateTrustRecommendations(trustFactors, financialTrust);
    
    return {
      financialTrust: Math.max(0, Math.min(100, financialTrust)),
      trustFactors,
      recommendations
    };
  }

  /**
   * Update financial trust based on decision outcome
   */
  async updateFinancialTrust(
    characterId: string,
    decision: FinancialDecision,
    outcome: 'positive' | 'negative' | 'neutral',
    currentTrust: number
  ): Promise<number> {
    let trustChange = 0;
    
    if (decision.coachAdvice) {
      if (decision.followedAdvice) {
        // Character followed coach advice
        switch (outcome) {
          case 'positive':
            trustChange = 8; // Good advice builds strong trust
            break;
          case 'negative':
            trustChange = -5; // Bad advice hurts trust less if followed
            break;
          case 'neutral':
            trustChange = 1; // Neutral outcome maintains trust
            break;
        }
      } else {
        // Character ignored coach advice
        switch (outcome) {
          case 'positive':
            trustChange = -3; // Success without coach hurts trust
            break;
          case 'negative':
            trustChange = 2; // Failure validates coach advice
            break;
          case 'neutral':
            trustChange = 0; // Neutral outcome, no change
            break;
        }
      }
    }
    
    // Publish trust change event
    if (Math.abs(trustChange) >= 3) {
      await this.eventBus.publishTrustChange(
        characterId,
        currentTrust,
        currentTrust + trustChange,
        `Financial decision ${outcome} - ${decision.followedAdvice ? 'followed' : 'ignored'} coach advice`
      );
    }
    
    return Math.max(0, Math.min(100, currentTrust + trustChange));
  }

  /**
   * Apply intervention to help break spiral
   */
  async applyIntervention(
    characterId: string,
    interventionType: 'coach_therapy' | 'team_support' | 'cooling_period' | 'emergency_fund',
    currentStress: number,
    currentSpiralIntensity: number
  ): Promise<{ 
    newStress: number; 
    newSpiralIntensity: number; 
    success: boolean;
    description: string;
  }> {
    let stressReduction = 0;
    let spiralReduction = 0;
    let success = true;
    let description = '';
    
    switch (interventionType) {
      case 'coach_therapy':
        // Therapy sessions are highly effective for stress
        stressReduction = 15 + Math.random() * 10; // 15-25 reduction
        spiralReduction = 20 + Math.random() * 15; // 20-35 reduction
        description = 'Coach therapy session helped process financial anxiety';
        break;
        
      case 'team_support':
        // Peer support helps but less than professional help
        stressReduction = 8 + Math.random() * 7; // 8-15 reduction
        spiralReduction = 10 + Math.random() * 10; // 10-20 reduction
        description = 'Team support provided perspective and reduced isolation';
        break;
        
      case 'cooling_period':
        // Time away from decisions helps
        stressReduction = 5 + Math.random() * 5; // 5-10 reduction
        spiralReduction = 15 + Math.random() * 10; // 15-25 reduction
        description = 'Cooling-off period prevented impulsive decisions';
        break;
        
      case 'emergency_fund':
        // Financial buffer reduces stress significantly
        stressReduction = 20 + Math.random() * 10; // 20-30 reduction
        spiralReduction = 25 + Math.random() * 15; // 25-40 reduction
        description = 'Emergency fund provided financial security and peace of mind';
        break;
    }
    
    // High stress can resist interventions
    if (currentStress > 80) {
      stressReduction *= 0.7; // 30% less effective
      spiralReduction *= 0.6; // 40% less effective
      success = Math.random() > 0.3; // 70% success rate
    }
    
    const newStress = Math.max(0, currentStress - stressReduction);
    const newSpiralIntensity = Math.max(0, currentSpiralIntensity - spiralReduction);
    
    // Publish intervention event
    await this.eventBus.publishFinancialEvent(
      'financial_intervention_applied',
      characterId,
      `${interventionType.replace('_', ' ')} intervention ${success ? 'helped' : 'had limited effect on'} ${characterId}`,
      { 
        interventionType,
        stressReduction,
        spiralReduction,
        success,
        type: 'intervention'
      },
      success ? 'medium' : 'high'
    );
    
    return { newStress, newSpiralIntensity, success, description };
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
    // Get average wealth from team members for comparison
    const averageWealth = this.getTeamAverageWealth(characterId);
    const wealthGap = (averageWealth - wallet) / averageWealth * 100;
    return Math.max(0, Math.min(30, wealthGap));
  }

  private calculateGoalProgressStress(wallet: number, personality: FinancialPersonality): number {
    // Calculate financial goal based on personality traits
    const baseGoal = 10000; // Base financial security goal
    const luxuryMultiplier = personality.luxuryDesire || 1; // 1-10 scale
    const securityMultiplier = personality.financialSecurity || 5; // 1-10 scale
    
    // Goals are higher for luxury-oriented and security-conscious personalities
    const personalGoal = baseGoal * (1 + (luxuryMultiplier / 10) + (securityMultiplier / 20));
    const progressToGoal = wallet / personalGoal * 100;
    
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

  private calculateCoachPersonalityMatch(personality: FinancialPersonality): number {
    // Calculate how well the character's personality matches typical coach advice style
    let matchScore = 50; // Base match
    
    // Conservative coaches match well with conservative personalities
    if (personality.spendingStyle === 'conservative') {
      matchScore += 20;
    }
    
    // Strategic personalities respond well to structured advice
    if (personality.spendingStyle === 'strategic') {
      matchScore += 15;
    }
    
    // Impulsive personalities struggle with coach advice
    if (personality.spendingStyle === 'impulsive') {
      matchScore -= 15;
    }
    
    // High wisdom characters trust coach advice more
    if (personality.financialWisdom > 70) {
      matchScore += 10;
    }
    
    // Low wisdom characters need more coach guidance
    if (personality.financialWisdom < 40) {
      matchScore += 5;
    }
    
    return Math.max(0, Math.min(100, matchScore));
  }

  private generateTrustRecommendations(
    trustFactors: {
      adviceSuccess: number;
      recentOutcomes: number;
      personalityMatch: number;
      stressInfluence: number;
    },
    currentTrust: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (currentTrust < 40) {
      recommendations.push('Build trust through small, low-risk advice wins');
    }
    
    if (trustFactors.adviceSuccess < 50) {
      recommendations.push('Focus on conservative, high-probability recommendations');
    }
    
    if (trustFactors.recentOutcomes < 40) {
      recommendations.push('Address recent financial setbacks through supportive coaching');
    }
    
    if (trustFactors.personalityMatch < 50) {
      recommendations.push('Adapt advice style to match character personality');
    }
    
    if (trustFactors.stressInfluence < 60) {
      recommendations.push('Reduce financial stress before giving major advice');
    }
    
    if (currentTrust > 80) {
      recommendations.push('Leverage high trust for more strategic financial planning');
    }
    
    return recommendations;
  }

  private getTeamAverageWealth(characterId: string): number {
    // For now, return a reasonable baseline
    // In a full implementation, this would query team member data
    // from the character database or team management system
    const baselineWealth = 25000;
    
    // Could be extended to:
    // 1. Query team roster from team management service
    // 2. Get financial data for each team member
    // 3. Calculate actual average
    
    return baselineWealth;
  }
}

export default FinancialPsychologyService;