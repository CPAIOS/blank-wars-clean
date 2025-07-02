// Combat Rewards System for _____ Wars

export interface BattleStats {
  damageDealt: number;
  damageTaken: number;
  roundsSurvived: number;
  totalRounds: number;
  skillsUsed: number;
  criticalHits: number;
  perfectBlocks: number;
  comboMoves: number;
}

export interface BattleRewards {
  xpGained: number;
  trainingPoints: number;
  currency: number;
  statBonuses: {
    atk?: number;
    def?: number;
    spd?: number;
    hp?: number;
  };
  bondIncrease: number;
  achievementUnlocked?: string;
  leveledUp?: boolean;
  newLevel?: number;
}

export interface PerformanceMetrics {
  victory: boolean;
  perfectVictory: boolean; // No damage taken
  dominantVictory: boolean; // Won by large margin
  closeVictory: boolean; // Won by small margin
  valiantDefeat: boolean; // Lost but performed well
  quickVictory: boolean; // Won in few rounds
  enduranceVictory: boolean; // Won in many rounds
  stylePoints: number; // Based on skill usage and combos
}

class CombatRewardsCalculator {
  calculateRewards(
    isWinner: boolean,
    characterLevel: number,
    battleStats: BattleStats,
    opponentLevel: number,
    membershipMultiplier: number = 1.0
  ): BattleRewards {
    const performance = this.analyzePerformance(isWinner, battleStats, opponentLevel);
    
    // Base XP calculation
    let baseXP = isWinner ? 100 : 25;
    
    // Level difference modifier
    const levelDiff = opponentLevel - characterLevel;
    const difficultyMultiplier = Math.max(0.5, 1 + (levelDiff * 0.1));
    
    // Performance bonuses
    let performanceXP = 0;
    
    if (performance.victory) {
      if (performance.perfectVictory) performanceXP += 100;
      else if (performance.dominantVictory) performanceXP += 60;
      else if (performance.quickVictory) performanceXP += 40;
      else if (performance.enduranceVictory) performanceXP += 30;
    } else {
      // Defeat bonuses (learning experience)
      if (performance.valiantDefeat) performanceXP += 20;
      performanceXP += Math.floor(battleStats.roundsSurvived * 5);
    }
    
    // Style and skill bonuses
    performanceXP += performance.stylePoints;
    performanceXP += battleStats.skillsUsed * 10;
    performanceXP += battleStats.criticalHits * 15;
    performanceXP += battleStats.perfectBlocks * 10;
    performanceXP += battleStats.comboMoves * 25;
    
    // Calculate final XP
    const totalXP = Math.floor(
      (baseXP + performanceXP) * difficultyMultiplier * membershipMultiplier
    );
    
    // Training Points (for skill learning)
    let trainingPoints = isWinner ? 2 : 1;
    if (performance.perfectVictory) trainingPoints += 2;
    if (battleStats.skillsUsed >= 3) trainingPoints += 1;
    trainingPoints = Math.floor(trainingPoints * membershipMultiplier);
    
    // Currency rewards
    let currency = isWinner ? 50 : 10;
    currency += Math.floor(performanceXP * 0.5);
    currency = Math.floor(currency * membershipMultiplier);
    
    // Stat bonuses based on performance
    const statBonuses = this.calculateStatBonuses(battleStats, performance);
    
    // Bond increase with character
    let bondIncrease = isWinner ? 3 : 1;
    if (performance.perfectVictory) bondIncrease += 2;
    if (battleStats.damageTaken < battleStats.damageDealt * 0.3) bondIncrease += 1;
    
    return {
      xpGained: totalXP,
      trainingPoints,
      currency,
      statBonuses,
      bondIncrease,
      achievementUnlocked: this.checkAchievements(performance, battleStats),
      leveledUp: false, // Will be calculated when applying rewards
      newLevel: characterLevel
    };
  }
  
  private analyzePerformance(
    isWinner: boolean,
    stats: BattleStats,
    opponentLevel: number
  ): PerformanceMetrics {
    const damageRatio = stats.damageDealt / Math.max(1, stats.damageTaken);
    const survivalRate = stats.roundsSurvived / stats.totalRounds;
    
    return {
      victory: isWinner,
      perfectVictory: isWinner && stats.damageTaken === 0,
      dominantVictory: isWinner && damageRatio >= 3,
      closeVictory: isWinner && damageRatio < 1.5 && damageRatio >= 1,
      valiantDefeat: !isWinner && (damageRatio >= 0.8 || survivalRate >= 0.7),
      quickVictory: isWinner && stats.totalRounds <= 3,
      enduranceVictory: isWinner && stats.totalRounds >= 8,
      stylePoints: this.calculateStylePoints(stats)
    };
  }
  
  private calculateStylePoints(stats: BattleStats): number {
    let points = 0;
    
    // Skill variety bonus
    if (stats.skillsUsed >= 3) points += 25;
    else if (stats.skillsUsed >= 2) points += 15;
    
    // Combat prowess
    points += stats.criticalHits * 10;
    points += stats.perfectBlocks * 8;
    points += stats.comboMoves * 20;
    
    // Efficiency bonus
    if (stats.damageDealt > stats.damageTaken * 2) points += 15;
    
    return points;
  }
  
  private calculateStatBonuses(
    stats: BattleStats,
    performance: PerformanceMetrics
  ): { atk?: number; def?: number; spd?: number; hp?: number } {
    const bonuses: any = {};
    
    // Attack bonus for damage dealers
    if (stats.damageDealt >= 150 || stats.criticalHits >= 3) {
      bonuses.atk = 1;
    }
    
    // Defense bonus for tanks
    if (stats.perfectBlocks >= 2 || (stats.damageTaken < 50 && stats.roundsSurvived >= 5)) {
      bonuses.def = 1;
    }
    
    // Speed bonus for quick victories or many skills
    if (performance.quickVictory || stats.skillsUsed >= 4) {
      bonuses.spd = 1;
    }
    
    // HP bonus for endurance fights
    if (performance.enduranceVictory || stats.roundsSurvived >= 10) {
      bonuses.hp = 5;
    }
    
    return bonuses;
  }
  
  private checkAchievements(
    performance: PerformanceMetrics,
    stats: BattleStats
  ): string | undefined {
    if (performance.perfectVictory) return "Flawless Victory";
    if (stats.criticalHits >= 5) return "Critical Master";
    if (stats.comboMoves >= 3) return "Combo Artist";
    if (performance.enduranceVictory) return "Endurance Champion";
    if (stats.skillsUsed >= 5) return "Skill Virtuoso";
    
    return undefined;
  }
}

// Singleton instance
export const combatRewards = new CombatRewardsCalculator();

// Helper function for battle tracking
export function createBattleStats(): BattleStats {
  return {
    damageDealt: 0,
    damageTaken: 0,
    roundsSurvived: 0,
    totalRounds: 0,
    skillsUsed: 0,
    criticalHits: 0,
    perfectBlocks: 0,
    comboMoves: 0
  };
}

// Achievement definitions
export const ACHIEVEMENTS = {
  "Flawless Victory": {
    icon: "👑",
    description: "Win a battle without taking damage",
    rarity: "legendary"
  },
  "Critical Master": {
    icon: "💥",
    description: "Land 5+ critical hits in one battle",
    rarity: "epic"
  },
  "Combo Artist": {
    icon: "🎭",
    description: "Execute 3+ combo moves in one battle",
    rarity: "rare"
  },
  "Endurance Champion": {
    icon: "⏰",
    description: "Win a battle lasting 8+ rounds",
    rarity: "rare"
  },
  "Skill Virtuoso": {
    icon: "🎯",
    description: "Use 5+ different skills in one battle",
    rarity: "epic"
  }
} as const;