// Game Balance System for Conflict Risk/Reward
// Ensures engaging with conflicts is more beneficial than avoiding them

import ConflictRewardSystem, { ConflictReward } from './conflictRewardSystem';
import GameEventBus, { GameEvent } from './gameEventBus';

export interface CharacterProgressionState {
  level: number;
  experience: number;
  stats: Record<string, number>;
  socialSkills: number;
  conflictResolutionStreak: number;
  lastConflictEngagement: Date;
  avoidancePenalties: number;
  unresolvedConflicts: number;
}

export interface GameplayIncentives {
  riskVsReward: 'balanced' | 'risk_heavy' | 'reward_heavy';
  engagementBonus: number;
  avoidancePenalty: number;
  collaborativeMultiplier: number;
}

export class GameBalanceSystem {
  private static instance: GameBalanceSystem;
  private conflictRewardSystem = ConflictRewardSystem.getInstance();
  private eventBus = GameEventBus.getInstance();

  static getInstance(): GameBalanceSystem {
    if (!GameBalanceSystem.instance) {
      GameBalanceSystem.instance = new GameBalanceSystem();
    }
    return GameBalanceSystem.instance;
  }

  // Main function: Calculate if engaging with conflict is worth it
  analyzeConflictEngagementValue(
    characterId: string,
    conflictType: string,
    conflictSeverity: 'low' | 'medium' | 'high' | 'critical'
  ): {
    engagementValue: number; // 0-100 scale
    avoidanceValue: number; // 0-100 scale
    recommendation: 'ENGAGE' | 'AVOID' | 'NEUTRAL';
    reasoning: string[];
    potentialRewards: ConflictReward;
    potentialPenalties: any;
  } {
    const characterState = this.getCharacterState(characterId);
    const potentialRewards = this.conflictRewardSystem.calculateResolutionRewards(
      conflictType,
      'collaborative', // Best case scenario
      conflictSeverity,
      [characterId]
    );
    
    const potentialPenalties = this.conflictRewardSystem.calculateConflictPenalties(
      [{ type: conflictType, severity: conflictSeverity }],
      0
    );

    const engagementValue = this.calculateEngagementValue(
      characterState,
      potentialRewards,
      conflictSeverity
    );

    const avoidanceValue = this.calculateAvoidanceValue(
      characterState,
      potentialPenalties
    );

    const recommendation = engagementValue > avoidanceValue + 10 ? 'ENGAGE' :
                          avoidanceValue > engagementValue + 10 ? 'AVOID' : 'NEUTRAL';

    const reasoning = this.generateRecommendationReasoning(
      engagementValue,
      avoidanceValue,
      characterState,
      conflictSeverity
    );

    return {
      engagementValue,
      avoidanceValue,
      recommendation,
      reasoning,
      potentialRewards,
      potentialPenalties
    };
  }

  private calculateEngagementValue(
    state: CharacterProgressionState,
    rewards: ConflictReward,
    severity: string
  ): number {
    let value = 50; // Base value

    // Experience value (20-40 points)
    const expValue = Math.min(40, rewards.experienceBonus / 10);
    value += expValue;

    // Stat boost value (0-25 points)
    const statBoosts = rewards.immediate.filter(r => r.type === 'stat_boost');
    const statValue = Math.min(25, statBoosts.length * 8);
    value += statValue;

    // Skill unlock value (0-30 points)
    const skillUnlocks = rewards.longTerm.filter(r => r.type === 'skill_unlock');
    const skillValue = skillUnlocks.length * 15;
    value += skillValue;

    // Streak bonus (0-20 points)
    const streakBonus = Math.min(20, state.conflictResolutionStreak * 3);
    value += streakBonus;

    // Severity bonus - higher risk = higher reward (0-15 points)
    const severityBonus = {
      'low': 0,
      'medium': 5,
      'high': 10,
      'critical': 15
    }[severity] || 0;
    value += severityBonus;

    // Relationship improvement value (0-15 points)
    const relationshipValue = Object.values(rewards.relationshipChanges)
      .filter(change => change > 0)
      .reduce((sum, change) => sum + change, 0);
    value += Math.min(15, relationshipValue * 2);

    return Math.min(100, value);
  }

  private calculateAvoidanceValue(
    state: CharacterProgressionState,
    penalties: any
  ): number {
    let value = 30; // Base avoidance value (lower than engagement base)

    // Avoid immediate penalties (0-20 points)
    const penaltyAvoidance = Math.abs(penalties.battlePerformance) + 
                            Math.abs(penalties.trainingEfficiency);
    value += Math.min(20, penaltyAvoidance / 2);

    // Short-term peace value (0-15 points)
    if (state.unresolvedConflicts === 0) {
      value += 15; // High value if character has no conflicts
    } else {
      value -= state.unresolvedConflicts * 3; // Diminishing value with existing conflicts
    }

    // Avoidance penalties accumulate over time (-30 to 0 points)
    const daysSinceLastEngagement = Math.floor(
      (Date.now() - state.lastConflictEngagement.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastEngagement > 7) {
      value -= (daysSinceLastEngagement - 7) * 3; // -3 per day after a week
    }

    // Social isolation penalty (-20 to 0 points)
    if (state.socialSkills < 30) {
      value -= (30 - state.socialSkills) / 2;
    }

    return Math.max(0, value);
  }

  private generateRecommendationReasoning(
    engagementValue: number,
    avoidanceValue: number,
    state: CharacterProgressionState,
    severity: string
  ): string[] {
    const reasoning: string[] = [];

    if (engagementValue > avoidanceValue + 10) {
      reasoning.push(`✅ Engagement highly recommended (${engagementValue} vs ${avoidanceValue})`);
      
      if (severity === 'high' || severity === 'critical') {
        reasoning.push('🎯 High-severity conflicts offer the best rewards');
      }
      
      if (state.conflictResolutionStreak >= 2) {
        reasoning.push(`🔥 Streak bonus active (${state.conflictResolutionStreak} resolved)`);
      }
      
      if (state.socialSkills < 50) {
        reasoning.push('📈 Great opportunity to build social skills');
      }
    } else if (avoidanceValue > engagementValue + 10) {
      reasoning.push(`⚠️ Avoidance may be safer (${avoidanceValue} vs ${engagementValue})`);
      
      if (state.unresolvedConflicts === 0) {
        reasoning.push('😌 Character is conflict-free, may want to preserve peace');
      }
      
      if (state.level < 5) {
        reasoning.push('🆙 Consider building basic skills before major conflicts');
      }
    } else {
      reasoning.push(`⚖️ Balanced choice (${engagementValue} vs ${avoidanceValue})`);
      reasoning.push('🎲 Outcome depends on resolution approach');
    }

    // Always show potential missed opportunities for avoidance
    if (avoidanceValue > engagementValue) {
      const daysSinceLastEngagement = Math.floor(
        (Date.now() - state.lastConflictEngagement.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastEngagement > 7) {
        reasoning.push('⏰ Long avoidance period reducing growth potential');
      }
      
      if (state.unresolvedConflicts > 2) {
        reasoning.push('🌪️ Multiple unresolved conflicts creating mounting pressure');
      }
    }

    return reasoning;
  }

  private getCharacterState(characterId: string): CharacterProgressionState {
    // This would integrate with the actual character data system
    // For now, returning mock data structure
    return {
      level: 10,
      experience: 2500,
      stats: { strength: 75, charisma: 45, wisdom: 60 },
      socialSkills: 35,
      conflictResolutionStreak: 2,
      lastConflictEngagement: new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)), // 5 days ago
      avoidancePenalties: 0,
      unresolvedConflicts: 1
    };
  }

  // Key insight: Make collaborative approaches significantly more rewarding
  getOptimalStrategy(
    conflictType: string,
    charactersInvolved: string[],
    currentTeamDynamics: any
  ): {
    recommendedApproach: 'aggressive' | 'diplomatic' | 'collaborative' | 'avoidant';
    expectedOutcome: string;
    rewardPotential: 'low' | 'medium' | 'high' | 'exceptional';
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const groupSize = charactersInvolved.length;
    
    // Collaborative approach becomes exponentially better with more people
    if (groupSize >= 3) {
      return {
        recommendedApproach: 'collaborative',
        expectedOutcome: 'Strong team bonding, skill unlocks, major experience gains',
        rewardPotential: 'exceptional',
        riskLevel: 'low'
      };
    }

    // Diplomatic is usually the safe bet
    if (groupSize === 2) {
      return {
        recommendedApproach: 'diplomatic',
        expectedOutcome: 'Relationship improvement, moderate experience gains',
        rewardPotential: 'medium',
        riskLevel: 'low'
      };
    }

    // Solo conflicts favor aggressive if character is strong
    return {
      recommendedApproach: 'aggressive',
      expectedOutcome: 'Personal strength building, some relationship damage',
      rewardPotential: 'medium',
      riskLevel: 'medium'
    };
  }

  // Generate in-game UI hints for players
  generatePlayerGuidance(characterId: string): {
    currentStatus: string;
    nextBestAction: string;
    longtermStrategy: string;
    warningFlags: string[];
  } {
    const state = this.getCharacterState(characterId);
    const guidance = {
      currentStatus: '',
      nextBestAction: '',
      longtermStrategy: '',
      warningFlags: [] as string[]
    };

    // Current status
    if (state.conflictResolutionStreak >= 3) {
      guidance.currentStatus = `🔥 ON FIRE! ${state.conflictResolutionStreak} conflicts resolved. Keep the streak going!`;
    } else if (state.unresolvedConflicts > 2) {
      guidance.currentStatus = `🌪️ OVERWHELMED: ${state.unresolvedConflicts} unresolved conflicts creating stress`;
    } else if (state.socialSkills > 70) {
      guidance.currentStatus = `😎 SOCIAL MASTER: High social skills opening new opportunities`;
    } else {
      guidance.currentStatus = `🎯 BUILDING: Developing conflict resolution abilities`;
    }

    // Next best action
    if (state.unresolvedConflicts > 0) {
      guidance.nextBestAction = 'Resolve pending conflicts to prevent accumulating penalties';
    } else if (state.conflictResolutionStreak >= 2) {
      guidance.nextBestAction = 'Seek challenging conflicts to maximize streak bonuses';
    } else {
      guidance.nextBestAction = 'Practice diplomatic approaches to build social skills';
    }

    // Long-term strategy
    if (state.socialSkills < 50) {
      guidance.longtermStrategy = 'Focus on collaborative resolutions to unlock advanced social abilities';
    } else {
      guidance.longtermStrategy = 'Balance conflict types to develop well-rounded leadership skills';
    }

    // Warning flags
    const daysSinceLastEngagement = Math.floor(
      (Date.now() - state.lastConflictEngagement.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastEngagement > 7) {
      guidance.warningFlags.push('⏰ Long avoidance period - growth opportunities being missed');
    }

    if (state.unresolvedConflicts > 3) {
      guidance.warningFlags.push('🌪️ Too many unresolved conflicts - battle performance suffering');
    }

    if (state.socialSkills < 25) {
      guidance.warningFlags.push('📉 Low social skills limiting advanced character development');
    }

    return guidance;
  }
}

export default GameBalanceSystem;