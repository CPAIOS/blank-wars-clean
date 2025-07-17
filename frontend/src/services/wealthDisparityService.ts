// Wealth Disparity Service
// Enhances existing conflict mechanics with sophisticated wealth inequality tracking
import { FinancialPersonality } from '../data/characters';
import GameEventBus from './gameEventBus';
import { FinancialPsychologyService } from './financialPsychologyService';

export interface WealthDisparityData {
  characterId: string;
  currentWallet: number;
  monthlyEarnings: number;
  totalAssets: number;
  wealthPercentile: number; // 0-100 where character ranks among team
  disparityStress: number; // 0-100 how much wealth gaps stress this character
  jealousyLevel: number; // 0-100 jealousy toward wealthier teammates
  guiltLevel: number; // 0-100 guilt about having more than others
  socialPressure: number; // 0-100 pressure from wealth visibility
}

export interface WealthDisparityConflict {
  id: string;
  primaryCharacter: string;
  affectedCharacters: string[];
  conflictType: 'wealth_jealousy' | 'guilt_pressure' | 'spending_shame' | 'lifestyle_tension' | 'financial_exclusion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  disparityAmount: number; // Dollar difference causing the conflict
  description: string;
  triggerEvent: string;
  timestamp: Date;
}

export interface TeamWealthProfile {
  wealthDistribution: {
    highest: number;
    lowest: number;
    average: number;
    median: number;
    giniCoefficient: number; // 0-1 measure of inequality
  };
  disparityMetrics: {
    maxGap: number;
    avgGap: number;
    dangerousGaps: number; // gaps that typically cause conflicts
  };
  riskFactors: {
    overallRisk: number; // 0-100 likelihood of wealth-related conflicts
    highRiskPairs: Array<{char1: string; char2: string; risk: number}>;
  };
}

export class WealthDisparityService {
  private static instance: WealthDisparityService;
  private eventBus: GameEventBus;
  private psychologyService: FinancialPsychologyService;
  private teamWealthData: Map<string, WealthDisparityData> = new Map();
  private lastTeamAnalysis: TeamWealthProfile | null = null;

  private constructor() {
    this.eventBus = GameEventBus.getInstance();
    this.psychologyService = FinancialPsychologyService.getInstance();
    this.setupEventListeners();
  }

  static getInstance(): WealthDisparityService {
    if (!WealthDisparityService.instance) {
      WealthDisparityService.instance = new WealthDisparityService();
    }
    return WealthDisparityService.instance;
  }

  /**
   * Setup event listeners for wealth-related events
   */
  private setupEventListeners(): void {
    // Listen for major financial changes
    this.eventBus.subscribe('financial_decision_made', this.handleFinancialChange.bind(this));
    this.eventBus.subscribe('luxury_purchase_made', this.handleLuxuryPurchase.bind(this));
    this.eventBus.subscribe('financial_windfall', this.handleWindfall.bind(this));
    this.eventBus.subscribe('financial_crisis', this.handleFinancialCrisis.bind(this));
    
    // Listen for earnings changes
    this.eventBus.subscribe('battle_earnings_received', this.handleEarningsChange.bind(this));
    this.eventBus.subscribe('coaching_bonus_received', this.handleEarningsChange.bind(this));
  }

  /**
   * Analyze team wealth distribution and identify disparity risks
   */
  analyzeTeamWealthDistribution(teamCharacters: Array<{
    id: string;
    wallet: number;
    monthlyEarnings: number;
    totalAssets: number;
    personality: FinancialPersonality;
  }>): TeamWealthProfile {
    if (teamCharacters.length === 0) {
      return this.getEmptyTeamProfile();
    }

    // Calculate wealth distribution metrics
    const wealthValues = teamCharacters.map(c => c.totalAssets).sort((a, b) => b - a);
    const earningsValues = teamCharacters.map(c => c.monthlyEarnings).sort((a, b) => b - a);
    
    const wealthDistribution = {
      highest: wealthValues[0],
      lowest: wealthValues[wealthValues.length - 1],
      average: wealthValues.reduce((sum, val) => sum + val, 0) / wealthValues.length,
      median: wealthValues[Math.floor(wealthValues.length / 2)],
      giniCoefficient: this.calculateGiniCoefficient(wealthValues)
    };

    const disparityMetrics = {
      maxGap: wealthDistribution.highest - wealthDistribution.lowest,
      avgGap: wealthDistribution.average - wealthDistribution.lowest,
      dangerousGaps: this.countDangerousGaps(teamCharacters)
    };

    // Calculate individual disparity data
    teamCharacters.forEach(character => {
      const disparityData = this.calculateIndividualDisparityData(character, teamCharacters);
      this.teamWealthData.set(character.id, disparityData);
    });

    // Identify high-risk pairs
    const highRiskPairs = this.identifyHighRiskPairs(teamCharacters);

    const teamProfile: TeamWealthProfile = {
      wealthDistribution,
      disparityMetrics,
      riskFactors: {
        overallRisk: this.calculateOverallDisparityRisk(wealthDistribution, disparityMetrics),
        highRiskPairs
      }
    };

    this.lastTeamAnalysis = teamProfile;
    return teamProfile;
  }

  /**
   * Calculate individual character's wealth disparity stress and emotions
   */
  private calculateIndividualDisparityData(
    character: any,
    teamCharacters: any[]
  ): WealthDisparityData {
    const sortedByWealth = teamCharacters.sort((a, b) => b.totalAssets - a.totalAssets);
    const characterIndex = sortedByWealth.findIndex(c => c.id === character.id);
    const wealthPercentile = ((teamCharacters.length - characterIndex) / teamCharacters.length) * 100;

    // Calculate stress factors based on personality and position
    const disparityStress = this.calculateDisparityStress(character, sortedByWealth, characterIndex);
    const jealousyLevel = this.calculateJealousyLevel(character, sortedByWealth, characterIndex);
    const guiltLevel = this.calculateGuiltLevel(character, sortedByWealth, characterIndex);
    const socialPressure = this.calculateSocialPressure(character, sortedByWealth, characterIndex);

    return {
      characterId: character.id,
      currentWallet: character.wallet,
      monthlyEarnings: character.monthlyEarnings,
      totalAssets: character.totalAssets,
      wealthPercentile,
      disparityStress,
      jealousyLevel,
      guiltLevel,
      socialPressure
    };
  }

  /**
   * Calculate how much wealth disparity stresses a character
   */
  private calculateDisparityStress(character: any, sortedByWealth: any[], characterIndex: number): number {
    const personality = character.personality;
    let baseStress = 0;

    // Position-based stress
    if (characterIndex === 0) {
      baseStress = 20; // Stress from being at the top
    } else if (characterIndex === sortedByWealth.length - 1) {
      baseStress = 60; // High stress from being at the bottom
    } else {
      baseStress = 30 + (characterIndex / sortedByWealth.length) * 40; // Middle positions
    }

    // Personality modifiers
    if (personality?.spendingStyle === 'impulsive') {
      baseStress += 15; // Impulsive people stress more about money
    } else if (personality?.spendingStyle === 'strategic') {
      baseStress -= 10; // Strategic people handle disparity better
    }

    if (personality?.riskTolerance && personality.riskTolerance < 30) {
      baseStress += 20; // Risk-averse people stress more about financial inequality
    }

    // Gap size modifier
    const wealthGap = sortedByWealth[0].totalAssets - character.totalAssets;
    const gapMultiplier = Math.min(2, wealthGap / 50000); // Significant gaps increase stress
    
    return Math.min(100, baseStress * gapMultiplier);
  }

  /**
   * Calculate jealousy level toward wealthier teammates
   */
  private calculateJealousyLevel(character: any, sortedByWealth: any[], characterIndex: number): number {
    if (characterIndex === 0) return 0; // Wealthiest has no jealousy

    const personality = character.personality;
    let baseJealousy = 0;

    // Position-based jealousy
    const wealthiestAssets = sortedByWealth[0].totalAssets;
    const gapRatio = (wealthiestAssets - character.totalAssets) / wealthiestAssets;
    baseJealousy = gapRatio * 80; // Up to 80% jealousy based on gap

    // Personality modifiers
    if (personality?.luxuryDesire && personality.luxuryDesire > 70) {
      baseJealousy += 15; // High luxury desire increases jealousy
    }

    if (personality?.socialStatus && personality.socialStatus > 60) {
      baseJealousy += 10; // Status-conscious people get more jealous
    }

    // Recent spending visibility can increase jealousy
    const recentLuxurySpending = this.getRecentLuxurySpending(character.id);
    if (recentLuxurySpending > character.monthlyEarnings * 0.5) {
      baseJealousy += 20; // Others' luxury spending triggers jealousy
    }

    return Math.min(100, baseJealousy);
  }

  /**
   * Calculate guilt level about having more than others
   */
  private calculateGuiltLevel(character: any, sortedByWealth: any[], characterIndex: number): number {
    if (characterIndex === sortedByWealth.length - 1) return 0; // Poorest has no guilt

    const personality = character.personality;
    let baseGuilt = 0;

    // Position-based guilt
    const poorestAssets = sortedByWealth[sortedByWealth.length - 1].totalAssets;
    const gapRatio = (character.totalAssets - poorestAssets) / character.totalAssets;
    baseGuilt = gapRatio * 60; // Up to 60% guilt based on gap

    // Personality modifiers
    if (personality?.empathy && personality.empathy > 70) {
      baseGuilt += 25; // Empathetic people feel more guilt
    }

    if (personality?.spendingStyle === 'generous') {
      baseGuilt += 15; // Generous people feel guilt about inequality
    }

    // Team harmony importance
    if (personality?.teamHarmony && personality.teamHarmony > 60) {
      baseGuilt += 10; // Team-focused people worry about disparity
    }

    return Math.min(100, baseGuilt);
  }

  /**
   * Calculate social pressure from wealth visibility
   */
  private calculateSocialPressure(character: any, sortedByWealth: any[], characterIndex: number): number {
    const personality = character.personality;
    let basePressure = 0;

    // Visibility pressure increases with wealth
    const wealthPercentile = ((sortedByWealth.length - characterIndex) / sortedByWealth.length) * 100;
    basePressure = (wealthPercentile / 100) * 50; // Up to 50% pressure based on visibility

    // Personality modifiers
    if (personality?.socialStatus && personality.socialStatus > 80) {
      basePressure += 30; // High status consciousness increases pressure
    }

    if (personality?.privacyPreference && personality.privacyPreference > 70) {
      basePressure += 20; // Privacy-loving people feel more pressure when wealth is visible
    }

    return Math.min(100, basePressure);
  }

  /**
   * Generate wealth disparity conflicts based on team dynamics
   */
  async generateWealthDisparityConflict(
    triggerCharacterId: string,
    triggerEvent: string,
    teamCharacters: any[]
  ): Promise<WealthDisparityConflict | null> {
    const teamProfile = this.analyzeTeamWealthDistribution(teamCharacters);
    const triggerData = this.teamWealthData.get(triggerCharacterId);
    
    if (!triggerData || teamProfile.riskFactors.overallRisk < 30) {
      return null; // No conflict if low risk
    }

    const conflictType = this.determineConflictType(triggerData, triggerEvent);
    const affectedCharacters = this.findAffectedCharacters(triggerCharacterId, conflictType, teamCharacters);
    
    if (affectedCharacters.length === 0) {
      return null;
    }

    const severity = this.determineSeverity(triggerData, teamProfile);
    const disparityAmount = this.calculateDisparityAmount(triggerCharacterId, affectedCharacters, teamCharacters);

    const conflict: WealthDisparityConflict = {
      id: `wealth_disparity_${Date.now()}_${triggerCharacterId}`,
      primaryCharacter: triggerCharacterId,
      affectedCharacters,
      conflictType,
      severity,
      disparityAmount,
      description: this.generateConflictDescription(conflictType, triggerCharacterId, affectedCharacters, disparityAmount),
      triggerEvent,
      timestamp: new Date()
    };

    // Publish conflict event
    this.eventBus.publish(
      'wealth_disparity_conflict_created',
      triggerCharacterId,
      `Wealth disparity conflict: ${conflictType}`,
      { conflict, teamProfile }
    );

    return conflict;
  }

  /**
   * Determine conflict type based on character data and trigger
   */
  private determineConflictType(
    characterData: WealthDisparityData,
    triggerEvent: string
  ): WealthDisparityConflict['conflictType'] {
    if (triggerEvent === 'luxury_purchase' && characterData.guiltLevel > 60) {
      return 'guilt_pressure';
    }
    
    if (characterData.jealousyLevel > 70) {
      return 'wealth_jealousy';
    }
    
    if (characterData.socialPressure > 60) {
      return 'lifestyle_tension';
    }
    
    if (characterData.wealthPercentile < 25) {
      return 'financial_exclusion';
    }
    
    return 'spending_shame';
  }

  /**
   * Find characters affected by the wealth disparity conflict
   */
  private findAffectedCharacters(
    triggerCharacterId: string,
    conflictType: WealthDisparityConflict['conflictType'],
    teamCharacters: any[]
  ): string[] {
    const triggerCharacter = teamCharacters.find(c => c.id === triggerCharacterId);
    if (!triggerCharacter) return [];

    const sortedByWealth = teamCharacters.sort((a, b) => b.totalAssets - a.totalAssets);
    const triggerIndex = sortedByWealth.findIndex(c => c.id === triggerCharacterId);
    
    const affected: string[] = [];

    switch (conflictType) {
      case 'wealth_jealousy':
        // Jealous of wealthier teammates
        for (let i = 0; i < triggerIndex; i++) {
          affected.push(sortedByWealth[i].id);
        }
        break;
        
      case 'guilt_pressure':
        // Feeling guilty toward poorer teammates
        for (let i = triggerIndex + 1; i < sortedByWealth.length; i++) {
          affected.push(sortedByWealth[i].id);
        }
        break;
        
      case 'lifestyle_tension':
        // Conflicts with those at similar wealth levels
        const similarWealth = sortedByWealth.filter(c => 
          c.id !== triggerCharacterId && 
          Math.abs(c.totalAssets - triggerCharacter.totalAssets) < triggerCharacter.totalAssets * 0.3
        );
        affected.push(...similarWealth.map(c => c.id));
        break;
        
      case 'financial_exclusion':
        // Feeling excluded by wealthier teammates
        const wealthierTeammates = sortedByWealth.filter(c => 
          c.totalAssets > triggerCharacter.totalAssets * 1.5
        );
        affected.push(...wealthierTeammates.map(c => c.id));
        break;
        
      case 'spending_shame':
        // Shame about spending in front of others
        affected.push(...teamCharacters.filter(c => c.id !== triggerCharacterId).map(c => c.id));
        break;
    }

    return affected.slice(0, 3); // Limit to 3 affected characters
  }

  /**
   * Helper methods for calculations
   */
  private calculateGiniCoefficient(wealthValues: number[]): number {
    if (wealthValues.length === 0) return 0;
    
    const n = wealthValues.length;
    const sorted = wealthValues.slice().sort((a, b) => a - b);
    let sum = 0;
    
    for (let i = 0; i < n; i++) {
      sum += (2 * (i + 1) - n - 1) * sorted[i];
    }
    
    const meanWealth = sorted.reduce((a, b) => a + b, 0) / n;
    return sum / (n * n * meanWealth);
  }

  private countDangerousGaps(teamCharacters: any[]): number {
    let dangerousGaps = 0;
    const threshold = 25000; // Gap threshold for "dangerous" disparity
    
    for (let i = 0; i < teamCharacters.length; i++) {
      for (let j = i + 1; j < teamCharacters.length; j++) {
        const gap = Math.abs(teamCharacters[i].totalAssets - teamCharacters[j].totalAssets);
        if (gap > threshold) {
          dangerousGaps++;
        }
      }
    }
    
    return dangerousGaps;
  }

  private identifyHighRiskPairs(teamCharacters: any[]): Array<{char1: string; char2: string; risk: number}> {
    const pairs: Array<{char1: string; char2: string; risk: number}> = [];
    
    for (let i = 0; i < teamCharacters.length; i++) {
      for (let j = i + 1; j < teamCharacters.length; j++) {
        const char1 = teamCharacters[i];
        const char2 = teamCharacters[j];
        const risk = this.calculatePairRisk(char1, char2);
        
        if (risk > 60) {
          pairs.push({ char1: char1.id, char2: char2.id, risk });
        }
      }
    }
    
    return pairs.sort((a, b) => b.risk - a.risk).slice(0, 5);
  }

  private calculatePairRisk(char1: any, char2: any): number {
    const wealthGap = Math.abs(char1.totalAssets - char2.totalAssets);
    const gapRisk = Math.min(50, wealthGap / 1000); // Up to 50 risk from gap size
    
    const personality1 = char1.personality;
    const personality2 = char2.personality;
    
    let personalityRisk = 0;
    
    // High jealousy + high wealth = high risk
    if (personality1?.luxuryDesire > 70 && char1.totalAssets < char2.totalAssets) {
      personalityRisk += 30;
    }
    
    // High empathy + wealth disparity = guilt risk
    if (personality2?.empathy > 70 && char2.totalAssets > char1.totalAssets) {
      personalityRisk += 25;
    }
    
    return Math.min(100, gapRisk + personalityRisk);
  }

  private calculateOverallDisparityRisk(
    wealthDistribution: any,
    disparityMetrics: any
  ): number {
    const giniRisk = wealthDistribution.giniCoefficient * 100;
    const gapRisk = Math.min(50, disparityMetrics.maxGap / 1000);
    const dangerousGapRisk = disparityMetrics.dangerousGaps * 10;
    
    return Math.min(100, giniRisk + gapRisk + dangerousGapRisk);
  }

  private calculateDisparityAmount(
    triggerCharacterId: string,
    affectedCharacters: string[],
    teamCharacters: any[]
  ): number {
    const triggerCharacter = teamCharacters.find(c => c.id === triggerCharacterId);
    if (!triggerCharacter || affectedCharacters.length === 0) return 0;
    
    const affectedAssets = affectedCharacters.map(id => {
      const char = teamCharacters.find(c => c.id === id);
      return char ? char.totalAssets : 0;
    });
    
    const avgAffectedAssets = affectedAssets.reduce((sum, assets) => sum + assets, 0) / affectedAssets.length;
    return Math.abs(triggerCharacter.totalAssets - avgAffectedAssets);
  }

  private generateConflictDescription(
    conflictType: WealthDisparityConflict['conflictType'],
    triggerCharacterId: string,
    affectedCharacters: string[],
    disparityAmount: number
  ): string {
    const descriptions = {
      wealth_jealousy: `Character ${triggerCharacterId} is experiencing jealousy over teammates' higher wealth ($${disparityAmount.toLocaleString()} disparity)`,
      guilt_pressure: `Character ${triggerCharacterId} feels guilty about their wealth advantage over struggling teammates ($${disparityAmount.toLocaleString()} gap)`,
      spending_shame: `Character ${triggerCharacterId} feels shame about spending money in front of less wealthy teammates`,
      lifestyle_tension: `Character ${triggerCharacterId} is experiencing tension due to lifestyle differences caused by wealth disparity ($${disparityAmount.toLocaleString()})`,
      financial_exclusion: `Character ${triggerCharacterId} feels excluded from team activities due to wealth differences ($${disparityAmount.toLocaleString()} gap)`
    };
    
    return descriptions[conflictType];
  }

  private determineSeverity(
    characterData: WealthDisparityData,
    teamProfile: TeamWealthProfile
  ): 'low' | 'medium' | 'high' | 'critical' {
    const riskScore = Math.max(
      characterData.disparityStress,
      characterData.jealousyLevel,
      characterData.guiltLevel,
      characterData.socialPressure
    );
    
    if (riskScore >= 85) return 'critical';
    if (riskScore >= 70) return 'high';
    if (riskScore >= 50) return 'medium';
    return 'low';
  }

  private getRecentLuxurySpending(characterId: string): number {
    // Placeholder - would integrate with luxury purchase service
    return 0;
  }

  private getEmptyTeamProfile(): TeamWealthProfile {
    return {
      wealthDistribution: { highest: 0, lowest: 0, average: 0, median: 0, giniCoefficient: 0 },
      disparityMetrics: { maxGap: 0, avgGap: 0, dangerousGaps: 0 },
      riskFactors: { overallRisk: 0, highRiskPairs: [] }
    };
  }

  /**
   * Event handlers
   */
  private async handleFinancialChange(data: any): Promise<void> {
    // Recalculate wealth distribution after financial changes
    if (data.characterId && data.amount > 5000) {
      // Significant financial change - check for new disparities
      await this.checkForNewDisparities(data.characterId, 'financial_change');
    }
  }

  private async handleLuxuryPurchase(data: any): Promise<void> {
    // Luxury purchases can trigger wealth disparity conflicts
    if (data.characterId && data.amount > 2000) {
      await this.checkForNewDisparities(data.characterId, 'luxury_purchase');
    }
  }

  private async handleWindfall(data: any): Promise<void> {
    // Windfalls can create sudden wealth disparities
    if (data.characterId && data.amount > 10000) {
      await this.checkForNewDisparities(data.characterId, 'windfall');
    }
  }

  private async handleFinancialCrisis(data: any): Promise<void> {
    // Financial crises can worsen existing disparities
    if (data.characterId) {
      await this.checkForNewDisparities(data.characterId, 'financial_crisis');
    }
  }

  private async handleEarningsChange(data: any): Promise<void> {
    // Earnings changes affect long-term wealth disparity
    if (data.characterId && data.amount > 1000) {
      await this.checkForNewDisparities(data.characterId, 'earnings_change');
    }
  }

  private async checkForNewDisparities(characterId: string, triggerEvent: string): Promise<void> {
    // This would need to be integrated with the actual team data
    // For now, it's a placeholder that would trigger disparity analysis
    console.log(`Checking for wealth disparity conflicts for character ${characterId} due to ${triggerEvent}`);
  }

  /**
   * Get current wealth disparity data for a character
   */
  getCharacterWealthDisparityData(characterId: string): WealthDisparityData | null {
    return this.teamWealthData.get(characterId) || null;
  }

  /**
   * Get team wealth profile
   */
  getTeamWealthProfile(): TeamWealthProfile | null {
    return this.lastTeamAnalysis;
  }
}

export default WealthDisparityService;