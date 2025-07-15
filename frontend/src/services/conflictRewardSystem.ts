// Conflict Resolution Rewards System
// Balances risk/reward to incentivize engaging with social conflicts

export interface ConflictResolutionReward {
  type: 'stat_boost' | 'skill_unlock' | 'relationship_bonus' | 'experience_multiplier' | 'special_ability';
  name: string;
  description: string;
  value: number;
  duration?: number; // hours, if temporary
  permanent?: boolean;
}

export interface ConflictReward {
  immediate: ConflictResolutionReward[];
  longTerm: ConflictResolutionReward[];
  relationshipChanges: Record<string, number>;
  experienceBonus: number;
}

export class ConflictRewardSystem {
  private static instance: ConflictRewardSystem;

  static getInstance(): ConflictRewardSystem {
    if (!ConflictRewardSystem.instance) {
      ConflictRewardSystem.instance = new ConflictRewardSystem();
    }
    return ConflictRewardSystem.instance;
  }

  // Calculate rewards based on conflict resolution approach
  calculateResolutionRewards(
    conflictType: string,
    resolutionApproach: 'aggressive' | 'diplomatic' | 'collaborative' | 'avoidant',
    conflictSeverity: 'low' | 'medium' | 'high' | 'critical',
    charactersInvolved: string[]
  ): ConflictReward {
    const baseRewards = this.getBaseRewards(conflictType, resolutionApproach);
    const severityMultiplier = this.getSeverityMultiplier(conflictSeverity);
    const groupSizeBonus = Math.max(1, charactersInvolved.length - 1) * 0.2;

    return {
      immediate: this.calculateImmediateRewards(baseRewards, severityMultiplier, resolutionApproach),
      longTerm: this.calculateLongTermRewards(conflictType, resolutionApproach, severityMultiplier),
      relationshipChanges: this.calculateRelationshipChanges(resolutionApproach, charactersInvolved),
      experienceBonus: Math.round((baseRewards.experience * severityMultiplier * (1 + groupSizeBonus)))
    };
  }

  private getBaseRewards(conflictType: string, approach: string) {
    const rewardTemplates = {
      kitchen_disputes: {
        aggressive: { attack: 2, experience: 50, teamwork: -1 },
        diplomatic: { charisma: 3, experience: 100, teamwork: 2 },
        collaborative: { wisdom: 2, teamwork: 4, experience: 150 },
        avoidant: { experience: 10, stress: 2 }
      },
      sleeping_arrangements: {
        aggressive: { intimidation: 2, experience: 40, stress: 1 },
        diplomatic: { wisdom: 2, social_skills: 2, experience: 120 },
        collaborative: { empathy: 3, team_coordination: 3, experience: 180 },
        avoidant: { experience: 15, fatigue: 1 }
      },
      training_disputes: {
        aggressive: { combat_focus: 3, experience: 80, rivals: 1 },
        diplomatic: { leadership: 2, experience: 140, respect: 2 },
        collaborative: { teaching: 3, team_synergy: 4, experience: 200 },
        avoidant: { experience: 20, isolation: 1 }
      },
      resource_sharing: {
        aggressive: { selfishness: 2, resources: 1, experience: 60 },
        diplomatic: { negotiation: 3, fair_play: 2, experience: 130 },
        collaborative: { generosity: 3, community_bond: 4, experience: 190 },
        avoidant: { experience: 25, social_debt: 1 }
      }
    };

    return rewardTemplates[conflictType]?.[approach] || { experience: 30 };
  }

  private getSeverityMultiplier(severity: string): number {
    const multipliers = {
      low: 1.0,
      medium: 1.5,
      high: 2.2,
      critical: 3.5
    };
    return multipliers[severity] || 1.0;
  }

  private calculateImmediateRewards(
    baseRewards: any,
    multiplier: number,
    approach: string
  ): ConflictResolutionReward[] {
    const rewards: ConflictResolutionReward[] = [];

    // Stat boosts
    if (baseRewards.attack) {
      rewards.push({
        type: 'stat_boost',
        name: 'Combat Confidence',
        description: 'Aggressive resolution built combat confidence',
        value: Math.round(baseRewards.attack * multiplier),
        duration: 48,
        permanent: false
      });
    }

    if (baseRewards.charisma) {
      rewards.push({
        type: 'stat_boost',
        name: 'Silver Tongue',
        description: 'Diplomatic success enhanced social abilities',
        value: Math.round(baseRewards.charisma * multiplier),
        duration: 72,
        permanent: false
      });
    }

    if (baseRewards.wisdom) {
      rewards.push({
        type: 'stat_boost',
        name: 'Emotional Intelligence',
        description: 'Wise conflict resolution increased understanding',
        value: Math.round(baseRewards.wisdom * multiplier),
        duration: 96,
        permanent: false
      });
    }

    // Special collaborative rewards
    if (approach === 'collaborative' && multiplier >= 2.0) {
      rewards.push({
        type: 'special_ability',
        name: 'Team Synergy Boost',
        description: 'All team battles gain +15% effectiveness for 48 hours',
        value: 15,
        duration: 48,
        permanent: false
      });
    }

    return rewards;
  }

  private calculateLongTermRewards(
    conflictType: string,
    approach: string,
    multiplier: number
  ): ConflictResolutionReward[] {
    const rewards: ConflictResolutionReward[] = [];

    // Permanent skill unlocks for high-value resolutions
    if (multiplier >= 2.2) { // High or Critical severity
      if (approach === 'diplomatic') {
        rewards.push({
          type: 'skill_unlock',
          name: 'Master Negotiator',
          description: 'Unlocks advanced diplomatic dialogue options',
          value: 1,
          permanent: true
        });
      }

      if (approach === 'collaborative') {
        rewards.push({
          type: 'skill_unlock',
          name: 'Team Builder',
          description: 'Can organize group activities that boost entire team',
          value: 1,
          permanent: true
        });
      }

      if (approach === 'aggressive' && conflictType === 'training_disputes') {
        rewards.push({
          type: 'skill_unlock',
          name: 'Alpha Presence',
          description: 'Intimidation attempts in battle have +25% success rate',
          value: 25,
          permanent: true
        });
      }
    }

    // Experience multipliers for sustained good conflict resolution
    if (approach !== 'avoidant') {
      rewards.push({
        type: 'experience_multiplier',
        name: 'Conflict Wisdom',
        description: 'Social experience gains increased by 20% for 1 week',
        value: 20,
        duration: 168, // 1 week
        permanent: false
      });
    }

    return rewards;
  }

  private calculateRelationshipChanges(
    approach: string,
    charactersInvolved: string[]
  ): Record<string, number> {
    const changes: Record<string, number> = {};
    
    const relationshipEffects = {
      aggressive: -2, // Damages relationships but shows strength
      diplomatic: +3, // Builds respect and trust
      collaborative: +5, // Creates strong bonds
      avoidant: -1 // Slight relationship decay from avoiding issues
    };

    const baseChange = relationshipEffects[approach] || 0;

    charactersInvolved.forEach(characterId => {
      changes[characterId] = baseChange;
    });

    return changes;
  }

  // Calculate the penalty for unresolved conflicts
  calculateConflictPenalties(
    unresolvedConflicts: any[],
    daysSinceLastResolution: number
  ): {
    battlePerformance: number;
    trainingEfficiency: number;
    socialPenalties: number;
    stressLevel: number;
  } {
    const conflictCount = unresolvedConflicts.length;
    const timeMultiplier = Math.min(2.0, 1 + (daysSinceLastResolution / 7));
    
    return {
      battlePerformance: Math.round(-5 * conflictCount * timeMultiplier), // -5% per conflict
      trainingEfficiency: Math.round(-3 * conflictCount * timeMultiplier), // -3% per conflict
      socialPenalties: Math.round(-10 * conflictCount), // -10 social points per conflict
      stressLevel: Math.round(conflictCount * 15 * timeMultiplier) // Stress builds over time
    };
  }

  // Special rewards for conflict resolution streaks
  calculateStreakBonuses(
    consecutiveResolutions: number,
    resolutionApproach: string
  ): ConflictResolutionReward[] {
    const rewards: ConflictResolutionReward[] = [];

    if (consecutiveResolutions >= 3) {
      rewards.push({
        type: 'experience_multiplier',
        name: 'Conflict Resolution Streak',
        description: `${consecutiveResolutions} conflicts resolved! +30% experience for 48h`,
        value: 30,
        duration: 48,
        permanent: false
      });
    }

    if (consecutiveResolutions >= 5) {
      rewards.push({
        type: 'stat_boost',
        name: 'Master Mediator',
        description: 'Permanent +2 to all social stats',
        value: 2,
        permanent: true
      });
    }

    if (consecutiveResolutions >= 7 && resolutionApproach === 'collaborative') {
      rewards.push({
        type: 'special_ability',
        name: 'Harmony Aura',
        description: 'Prevents new conflicts from starting for 72 hours',
        value: 1,
        duration: 72,
        permanent: false
      });
    }

    return rewards;
  }
}

export default ConflictRewardSystem;