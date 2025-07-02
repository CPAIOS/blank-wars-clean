// Combat Skill Progression System
// Skill advancement through battle performance and combat actions

import { CharacterSkills } from './characterProgression';

export interface CombatAction {
  type: 'attack' | 'defend' | 'special' | 'dodge' | 'critical' | 'heal' | 'buff' | 'debuff';
  success: boolean;
  damage?: number;
  blocked?: number;
  healed?: number;
  skillUsed?: string;
  target: 'self' | 'enemy' | 'ally';
  difficulty: number; // 1-10, based on opponent level difference
}

export interface BattlePerformance {
  characterId: string;
  battleId: string;
  isVictory: boolean;
  battleDuration: number; // seconds
  opponentLevel: number;
  levelDifference: number;
  actions: CombatAction[];
  
  // Performance metrics
  totalDamageDealt: number;
  totalDamageTaken: number;
  criticalHits: number;
  successfulDodges: number;
  perfectBlocks: number;
  abilitiesUsed: number;
  strategicDecisions: number;
  socialInteractions: number; // taunts, intimidation, etc.
  spiritualMoments: number; // meditation, prayer, etc.
  
  // Battle context
  environment: string;
  weatherConditions?: string;
  terrainAdvantage?: boolean;
  outnumbered?: boolean;
  teamBattle?: boolean;
}

export interface SkillGain {
  skill: string;
  experience: number;
  reason: string;
  multiplier: number;
  baseGain: number;
}

export interface CombatSkillReward {
  characterId: string;
  battleId: string;
  skillGains: SkillGain[];
  totalExperience: number;
  skillLevelUps: { skill: string; newLevel: number }[];
  newInteractionsUnlocked: string[];
  performanceRating: 'poor' | 'average' | 'good' | 'excellent' | 'legendary';
}

// Combat Skill Progression Engine
export class CombatSkillEngine {
  
  static calculateSkillProgression(
    performance: BattlePerformance,
    currentSkills: CharacterSkills
  ): CombatSkillReward {
    const skillGains: SkillGain[] = [];
    
    // Base experience multipliers
    const victoryMultiplier = performance.isVictory ? 1.5 : 0.8;
    const difficultyMultiplier = Math.max(0.5, 1 + (performance.levelDifference * 0.1));
    const durationMultiplier = this.getBattleDurationMultiplier(performance.battleDuration);
    
    // Calculate Combat skill progression
    const combatGain = this.calculateCombatSkillGain(performance, victoryMultiplier, difficultyMultiplier);
    if (combatGain.experience > 0) skillGains.push(combatGain);
    
    // Calculate Survival skill progression
    const survivalGain = this.calculateSurvivalSkillGain(performance, victoryMultiplier, difficultyMultiplier);
    if (survivalGain.experience > 0) skillGains.push(survivalGain);
    
    // Calculate Mental skill progression
    const mentalGain = this.calculateMentalSkillGain(performance, victoryMultiplier, difficultyMultiplier);
    if (mentalGain.experience > 0) skillGains.push(mentalGain);
    
    // Calculate Social skill progression
    const socialGain = this.calculateSocialSkillGain(performance, victoryMultiplier, difficultyMultiplier);
    if (socialGain.experience > 0) skillGains.push(socialGain);
    
    // Calculate Spiritual skill progression
    const spiritualGain = this.calculateSpiritualSkillGain(performance, victoryMultiplier, difficultyMultiplier);
    if (spiritualGain.experience > 0) skillGains.push(spiritualGain);
    
    // Apply duration multiplier to all gains
    skillGains.forEach(gain => {
      gain.experience = Math.floor(gain.experience * durationMultiplier);
      gain.multiplier *= durationMultiplier;
    });
    
    // Calculate total experience
    const totalExperience = skillGains.reduce((sum, gain) => sum + gain.experience, 0);
    
    // Check for level ups
    const skillLevelUps = this.checkForLevelUps(skillGains, currentSkills);
    
    // Check for new interactions
    const newInteractionsUnlocked = this.checkForNewInteractions(skillLevelUps, currentSkills);
    
    // Calculate performance rating
    const performanceRating = this.calculatePerformanceRating(performance, totalExperience);
    
    return {
      characterId: performance.characterId,
      battleId: performance.battleId,
      skillGains,
      totalExperience,
      skillLevelUps,
      newInteractionsUnlocked,
      performanceRating
    };
  }
  
  private static calculateCombatSkillGain(
    performance: BattlePerformance,
    victoryMultiplier: number,
    difficultyMultiplier: number
  ): SkillGain {
    let baseGain = 20; // Base combat experience
    let multiplier = victoryMultiplier * difficultyMultiplier;
    const reasons: string[] = [];
    
    // Damage dealt bonus
    if (performance.totalDamageDealt > 0) {
      const damageBonus = Math.min(50, Math.floor(performance.totalDamageDealt / 50));
      baseGain += damageBonus;
      reasons.push(`+${damageBonus} for dealing ${performance.totalDamageDealt} damage`);
    }
    
    // Critical hits bonus
    if (performance.criticalHits > 0) {
      const critBonus = performance.criticalHits * 10;
      baseGain += critBonus;
      reasons.push(`+${critBonus} for ${performance.criticalHits} critical hits`);
    }
    
    // Successful attacks bonus
    const successfulAttacks = performance.actions.filter(a => 
      a.type === 'attack' && a.success
    ).length;
    if (successfulAttacks > 0) {
      const attackBonus = successfulAttacks * 5;
      baseGain += attackBonus;
      reasons.push(`+${attackBonus} for ${successfulAttacks} successful attacks`);
    }
    
    // Special abilities bonus
    if (performance.abilitiesUsed > 0) {
      const abilityBonus = performance.abilitiesUsed * 8;
      baseGain += abilityBonus;
      reasons.push(`+${abilityBonus} for using ${performance.abilitiesUsed} abilities`);
    }
    
    // Perfect victory bonus
    if (performance.isVictory && performance.totalDamageTaken === 0) {
      baseGain += 30;
      multiplier += 0.5;
      reasons.push('+30 for flawless victory');
    }
    
    return {
      skill: 'combat',
      experience: Math.floor(baseGain * multiplier),
      reason: `Combat experience: ${reasons.join(', ')}`,
      multiplier,
      baseGain
    };
  }
  
  private static calculateSurvivalSkillGain(
    performance: BattlePerformance,
    victoryMultiplier: number,
    difficultyMultiplier: number
  ): SkillGain {
    let baseGain = 15; // Base survival experience
    let multiplier = victoryMultiplier * difficultyMultiplier;
    const reasons: string[] = [];
    
    // Damage mitigation bonus
    if (performance.totalDamageTaken < performance.totalDamageDealt * 0.5) {
      baseGain += 20;
      reasons.push('+20 for taking minimal damage');
    }
    
    // Successful dodges bonus
    if (performance.successfulDodges > 0) {
      const dodgeBonus = performance.successfulDodges * 8;
      baseGain += dodgeBonus;
      reasons.push(`+${dodgeBonus} for ${performance.successfulDodges} successful dodges`);
    }
    
    // Perfect blocks bonus
    if (performance.perfectBlocks > 0) {
      const blockBonus = performance.perfectBlocks * 10;
      baseGain += blockBonus;
      reasons.push(`+${blockBonus} for ${performance.perfectBlocks} perfect blocks`);
    }
    
    // Environmental adaptation bonus
    if (performance.terrainAdvantage === false) {
      baseGain += 15;
      reasons.push('+15 for fighting in adverse terrain');
    }
    
    // Outnumbered survival bonus
    if (performance.outnumbered) {
      baseGain += 25;
      multiplier += 0.3;
      reasons.push('+25 for surviving while outnumbered');
    }
    
    // Long battle endurance bonus
    if (performance.battleDuration > 180) {
      baseGain += 10;
      reasons.push('+10 for enduring long battle');
    }
    
    return {
      skill: 'survival',
      experience: Math.floor(baseGain * multiplier),
      reason: `Survival experience: ${reasons.join(', ')}`,
      multiplier,
      baseGain
    };
  }
  
  private static calculateMentalSkillGain(
    performance: BattlePerformance,
    victoryMultiplier: number,
    difficultyMultiplier: number
  ): SkillGain {
    let baseGain = 12; // Base mental experience
    let multiplier = victoryMultiplier * difficultyMultiplier;
    const reasons: string[] = [];
    
    // Strategic decisions bonus
    if (performance.strategicDecisions > 0) {
      const strategyBonus = performance.strategicDecisions * 15;
      baseGain += strategyBonus;
      reasons.push(`+${strategyBonus} for ${performance.strategicDecisions} strategic decisions`);
    }
    
    // Complex ability usage bonus
    const complexAbilities = performance.actions.filter(a => 
      a.type === 'special' && a.success
    ).length;
    if (complexAbilities > 0) {
      const complexBonus = complexAbilities * 12;
      baseGain += complexBonus;
      reasons.push(`+${complexBonus} for ${complexAbilities} complex abilities`);
    }
    
    // Adaptation bonus (successful actions after failures)
    const adaptationScore = this.calculateAdaptationScore(performance.actions);
    if (adaptationScore > 0) {
      baseGain += adaptationScore;
      reasons.push(`+${adaptationScore} for tactical adaptation`);
    }
    
    // Victory against higher level opponent
    if (performance.isVictory && performance.levelDifference > 0) {
      const levelBonus = performance.levelDifference * 5;
      baseGain += levelBonus;
      reasons.push(`+${levelBonus} for defeating stronger opponent`);
    }
    
    // Efficient victory bonus (quick decisive battles)
    if (performance.isVictory && performance.battleDuration < 60) {
      baseGain += 18;
      reasons.push('+18 for efficient victory');
    }
    
    return {
      skill: 'mental',
      experience: Math.floor(baseGain * multiplier),
      reason: `Mental experience: ${reasons.join(', ')}`,
      multiplier,
      baseGain
    };
  }
  
  private static calculateSocialSkillGain(
    performance: BattlePerformance,
    victoryMultiplier: number,
    difficultyMultiplier: number
  ): SkillGain {
    let baseGain = 8; // Base social experience
    let multiplier = victoryMultiplier * difficultyMultiplier;
    const reasons: string[] = [];
    
    // Social interactions bonus
    if (performance.socialInteractions > 0) {
      const socialBonus = performance.socialInteractions * 12;
      baseGain += socialBonus;
      reasons.push(`+${socialBonus} for ${performance.socialInteractions} social interactions`);
    }
    
    // Team battle coordination bonus
    if (performance.teamBattle) {
      baseGain += 20;
      multiplier += 0.2;
      reasons.push('+20 for team coordination');
    }
    
    // Intimidation success bonus
    const intimidationActions = performance.actions.filter(a => 
      a.type === 'debuff' && a.target === 'enemy' && a.success
    ).length;
    if (intimidationActions > 0) {
      const intimidationBonus = intimidationActions * 10;
      baseGain += intimidationBonus;
      reasons.push(`+${intimidationBonus} for successful intimidation`);
    }
    
    // Leadership in adversity bonus
    if (performance.outnumbered && performance.isVictory) {
      baseGain += 25;
      reasons.push('+25 for leading through adversity');
    }
    
    // Mercy/honor bonus (non-lethal victory)
    if (performance.isVictory && performance.totalDamageDealt < performance.opponentLevel * 20) {
      baseGain += 15;
      reasons.push('+15 for honorable victory');
    }
    
    return {
      skill: 'social',
      experience: Math.floor(baseGain * multiplier),
      reason: `Social experience: ${reasons.join(', ')}`,
      multiplier,
      baseGain
    };
  }
  
  private static calculateSpiritualSkillGain(
    performance: BattlePerformance,
    victoryMultiplier: number,
    difficultyMultiplier: number
  ): SkillGain {
    let baseGain = 6; // Base spiritual experience
    let multiplier = victoryMultiplier * difficultyMultiplier;
    const reasons: string[] = [];
    
    // Spiritual moments bonus
    if (performance.spiritualMoments > 0) {
      const spiritualBonus = performance.spiritualMoments * 20;
      baseGain += spiritualBonus;
      reasons.push(`+${spiritualBonus} for ${performance.spiritualMoments} spiritual moments`);
    }
    
    // Healing actions bonus
    const healingActions = performance.actions.filter(a => 
      a.type === 'heal' && a.success
    ).length;
    if (healingActions > 0) {
      const healingBonus = healingActions * 15;
      baseGain += healingBonus;
      reasons.push(`+${healingBonus} for ${healingActions} healing actions`);
    }
    
    // Buff/support actions bonus
    const supportActions = performance.actions.filter(a => 
      a.type === 'buff' && a.target !== 'enemy' && a.success
    ).length;
    if (supportActions > 0) {
      const supportBonus = supportActions * 12;
      baseGain += supportBonus;
      reasons.push(`+${supportBonus} for ${supportActions} support actions`);
    }
    
    // Spiritual resilience bonus (fighting despite low health)
    if (performance.totalDamageTaken > performance.opponentLevel * 15 && performance.isVictory) {
      baseGain += 20;
      reasons.push('+20 for spiritual resilience');
    }
    
    // Inner peace bonus (calm under pressure)
    if (performance.battleDuration > 120 && performance.actions.filter(a => !a.success).length < 3) {
      baseGain += 15;
      reasons.push('+15 for maintaining composure');
    }
    
    // Connection with nature/environment bonus
    if (performance.environment === 'natural' && performance.terrainAdvantage) {
      baseGain += 10;
      reasons.push('+10 for environmental harmony');
    }
    
    return {
      skill: 'spiritual',
      experience: Math.floor(baseGain * multiplier),
      reason: `Spiritual experience: ${reasons.join(', ')}`,
      multiplier,
      baseGain
    };
  }
  
  private static getBattleDurationMultiplier(duration: number): number {
    if (duration < 30) return 0.7; // Too quick, less learning
    if (duration < 60) return 1.0; // Optimal short battle
    if (duration < 180) return 1.2; // Good learning opportunity
    if (duration < 300) return 1.1; // Extended engagement
    return 0.9; // Overly long battles can be inefficient
  }
  
  private static calculateAdaptationScore(actions: CombatAction[]): number {
    let score = 0;
    let consecutiveFailures = 0;
    
    for (const action of actions) {
      if (!action.success) {
        consecutiveFailures++;
      } else {
        if (consecutiveFailures >= 2) {
          score += Math.min(15, consecutiveFailures * 3);
        }
        consecutiveFailures = 0;
      }
    }
    
    return score;
  }
  
  private static checkForLevelUps(
    skillGains: SkillGain[],
    currentSkills: CharacterSkills
  ): { skill: string; newLevel: number }[] {
    const levelUps: { skill: string; newLevel: number }[] = [];
    
    for (const gain of skillGains) {
      const currentSkill = currentSkills.coreSkills[gain.skill as keyof typeof currentSkills.coreSkills];
      if (currentSkill) {
        const newExperience = currentSkill.experience + gain.experience;
        const experienceNeeded = this.getExperienceForLevel(currentSkill.level + 1);
        
        if (newExperience >= experienceNeeded && currentSkill.level < currentSkill.maxLevel) {
          levelUps.push({
            skill: gain.skill,
            newLevel: currentSkill.level + 1
          });
        }
      }
    }
    
    return levelUps;
  }
  
  private static getExperienceForLevel(level: number): number {
    // Experience required for each level (exponential growth)
    return Math.floor(100 * Math.pow(1.15, level - 1));
  }
  
  private static checkForNewInteractions(
    levelUps: { skill: string; newLevel: number }[],
    currentSkills: CharacterSkills
  ): string[] {
    const newInteractions: string[] = [];
    
    // This would integrate with the skill interaction system
    // to check if any new interactions are unlocked
    for (const levelUp of levelUps) {
      if (levelUp.newLevel % 5 === 0) { // Every 5 levels might unlock interactions
        newInteractions.push(`${levelUp.skill}_mastery_${levelUp.newLevel}`);
      }
    }
    
    return newInteractions;
  }
  
  private static calculatePerformanceRating(
    performance: BattlePerformance,
    totalExperience: number
  ): 'poor' | 'average' | 'good' | 'excellent' | 'legendary' {
    let score = 0;
    
    // Victory bonus
    if (performance.isVictory) score += 30;
    
    // Efficiency score
    if (performance.battleDuration < 60) score += 15;
    if (performance.totalDamageDealt > performance.totalDamageTaken * 2) score += 20;
    
    // Skill demonstration
    score += Math.min(20, performance.criticalHits * 3);
    score += Math.min(15, performance.successfulDodges * 2);
    score += Math.min(25, performance.abilitiesUsed * 4);
    score += Math.min(20, performance.strategicDecisions * 5);
    
    // Difficulty bonus
    if (performance.levelDifference > 0) score += performance.levelDifference * 10;
    if (performance.outnumbered) score += 25;
    
    // Experience gained reflects learning
    score += Math.min(30, totalExperience / 5);
    
    if (score >= 150) return 'legendary';
    if (score >= 120) return 'excellent';
    if (score >= 90) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  }
}

// Helper function to create battle performance from battle data
export function createBattlePerformance(
  characterId: string,
  battleData: {
    isVictory: boolean;
    battleDuration: number;
    playerLevel: number;
    opponentLevel: number;
    damageDealt: number;
    damageTaken: number;
    criticalHits: number;
    abilitiesUsed: number;
    environment?: string;
  }
): BattlePerformance {
  return {
    characterId,
    battleId: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    isVictory: battleData.isVictory,
    battleDuration: battleData.battleDuration,
    opponentLevel: battleData.opponentLevel,
    levelDifference: battleData.opponentLevel - battleData.playerLevel,
    actions: [], // Would be populated with actual combat actions
    
    totalDamageDealt: battleData.damageDealt,
    totalDamageTaken: battleData.damageTaken,
    criticalHits: battleData.criticalHits,
    successfulDodges: Math.floor(Math.random() * 3), // Mock data
    perfectBlocks: Math.floor(Math.random() * 2), // Mock data
    abilitiesUsed: battleData.abilitiesUsed,
    strategicDecisions: Math.floor(battleData.abilitiesUsed / 2), // Mock data
    socialInteractions: Math.floor(Math.random() * 2), // Mock data
    spiritualMoments: Math.floor(Math.random() * 1), // Mock data
    
    environment: battleData.environment || 'arena',
    terrainAdvantage: Math.random() > 0.5,
    outnumbered: Math.random() > 0.8,
    teamBattle: false
  };
}

// Demo function for testing
export function createDemoCombatSkillReward(characterId: string): CombatSkillReward {
  const demoPerformance = createBattlePerformance(characterId, {
    isVictory: true,
    battleDuration: 95,
    playerLevel: 15,
    opponentLevel: 17,
    damageDealt: 450,
    damageTaken: 180,
    criticalHits: 3,
    abilitiesUsed: 4,
    environment: 'forest'
  });
  
  const demoSkills: CharacterSkills = {
    characterId,
    coreSkills: {
      combat: { level: 20, experience: 850, maxLevel: 100 },
      survival: { level: 18, experience: 600, maxLevel: 100 },
      mental: { level: 16, experience: 420, maxLevel: 100 },
      social: { level: 12, experience: 250, maxLevel: 100 },
      spiritual: { level: 10, experience: 180, maxLevel: 100 }
    },
    signatureSkills: {},
    archetypeSkills: {},
    passiveAbilities: [],
    activeAbilities: [],
    unlockedNodes: [],
    skillPoints: 5,
    lastUpdated: new Date()
  };
  
  return CombatSkillEngine.calculateSkillProgression(demoPerformance, demoSkills);
}