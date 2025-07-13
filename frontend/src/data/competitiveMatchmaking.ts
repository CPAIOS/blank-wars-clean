// Competitive Matchmaking System
// Weight class and difficulty-based opponent matching instead of cherry-picking specific opponents

import { TeamCharacter } from './teamBattleSystem';
import { type Character } from './characters';
import { TeamFormation, TeamSynergy } from './teamBuilding';
import { Equipment } from './equipment';

export type WeightClassName = 'featherweight' | 'lightweight' | 'middleweight' | 'heavyweight' | 'super_heavyweight';
export type DifficultyTier = 'novice' | 'amateur' | 'professional' | 'elite' | 'master' | 'legendary';
export type CompetitionType = 'ranked' | 'casual' | 'tournament' | 'championship';

export interface WeightClass {
  id: WeightClassName;
  name: string;
  description: string;
  powerRange: {
    min: number;
    max: number;
  };
  teamLevelRange: {
    min: number;
    max: number;
  };
  restrictions: {
    maxMythicCharacters?: number;
    maxLegendaryCharacters?: number;
    bannedFormations?: string[];
    maxEquipmentTier?: number;
  };
  rewards: {
    experienceMultiplier: number;
    currencyMultiplier: number;
    prestigePoints: number;
  };
}

export interface DifficultyTierInfo {
  id: DifficultyTier;
  name: string;
  description: string;
  unlockRequirements: {
    minPlayerLevel?: number;
    minWins?: number;
    completedChallenges?: string[];
    minRating?: number;
    previousTierMastery?: boolean;
  };
  matchmakingRules: {
    ratingVariance: number;        // How much rating difference is allowed
    crossTierAllowed: boolean;     // Can match with adjacent tiers
    handicapEnabled: boolean;      // Apply handicaps for cross-tier matches
    maxWaitTime: number;          // Max queue time before expanding search
  };
  battleModifiers: {
    experienceBonus: number;       // % bonus experience
    difficultyMultiplier: number;  // AI opponent strength modifier
    specialRules?: string[];       // Special battle conditions
  };
}

export interface TeamPowerCalculation {
  basePower: number;           // Sum of character base stats
  formationBonus: number;      // Formation modifier
  synergyBonus: number;        // Team synergy effects
  equipmentBonus: number;      // Equipment contributions
  levelBonus: number;          // Character level scaling
  totalPower: number;          // Final calculated power
  weightClass: WeightClassName;
}

export interface MatchmakingCriteria {
  weightClass: WeightClassName;
  difficultyTier: DifficultyTier;
  competitionType: CompetitionType;
  allowCrossTier: boolean;
  maxPowerDifference: number;
  preferences: {
    fasterMatching: boolean;     // Accept wider skill gaps for faster matches
    balancedTeams: boolean;      // Prefer similar team compositions
    newPlayerFriendly: boolean;  // Avoid very experienced opponents
  };
}

export interface OpponentProfile {
  teamPower: number;
  weightClass: WeightClassName;
  difficultyTier: DifficultyTier;
  estimatedRating: number;
  teamComposition: {
    formation: string;
    archetypes: string[];
    averageLevel: number;
  };
  expectedMatchDifficulty: 'easy' | 'fair' | 'challenging' | 'hard';
  rewardMultiplier: number;
}

// Weight Class Definitions
export const WEIGHT_CLASSES: Record<WeightClassName, WeightClass> = {
  featherweight: {
    id: 'featherweight',
    name: 'Featherweight Division',
    description: 'Entry-level competition for developing teams',
    powerRange: { min: 0, max: 250 },
    teamLevelRange: { min: 1, max: 15 },
    restrictions: {
      maxMythicCharacters: 0,
      maxLegendaryCharacters: 1,
      maxEquipmentTier: 2
    },
    rewards: {
      experienceMultiplier: 1.0,
      currencyMultiplier: 1.0,
      prestigePoints: 1
    }
  },
  lightweight: {
    id: 'lightweight',
    name: 'Lightweight Division',
    description: 'Intermediate teams with solid fundamentals',
    powerRange: { min: 251, max: 450 },
    teamLevelRange: { min: 16, max: 30 },
    restrictions: {
      maxMythicCharacters: 1,
      maxLegendaryCharacters: 2,
      maxEquipmentTier: 3
    },
    rewards: {
      experienceMultiplier: 1.15,
      currencyMultiplier: 1.25,
      prestigePoints: 2
    }
  },
  middleweight: {
    id: 'middleweight',
    name: 'Middleweight Division',
    description: 'Competitive teams with advanced strategies',
    powerRange: { min: 451, max: 700 },
    teamLevelRange: { min: 31, max: 50 },
    restrictions: {
      maxMythicCharacters: 2,
      maxLegendaryCharacters: 3,
      maxEquipmentTier: 4
    },
    rewards: {
      experienceMultiplier: 1.35,
      currencyMultiplier: 1.5,
      prestigePoints: 3
    }
  },
  heavyweight: {
    id: 'heavyweight',
    name: 'Heavyweight Division',
    description: 'Elite teams pushing the limits',
    powerRange: { min: 701, max: 1000 },
    teamLevelRange: { min: 51, max: 75 },
    restrictions: {
      maxMythicCharacters: 3,
      bannedFormations: [], // No restrictions
      maxEquipmentTier: 5
    },
    rewards: {
      experienceMultiplier: 1.6,
      currencyMultiplier: 1.85,
      prestigePoints: 5
    }
  },
  super_heavyweight: {
    id: 'super_heavyweight',
    name: 'Super Heavyweight Division',
    description: 'Unlimited power - only for the strongest teams',
    powerRange: { min: 1001, max: 9999 },
    teamLevelRange: { min: 76, max: 100 },
    restrictions: {}, // No restrictions - anything goes
    rewards: {
      experienceMultiplier: 2.0,
      currencyMultiplier: 2.5,
      prestigePoints: 10
    }
  }
};

// Difficulty Tier Definitions
export const DIFFICULTY_TIERS: Record<DifficultyTier, DifficultyTierInfo> = {
  novice: {
    id: 'novice',
    name: 'Novice',
    description: 'Learning the basics of team combat',
    unlockRequirements: {},
    matchmakingRules: {
      ratingVariance: 150,
      crossTierAllowed: false,
      handicapEnabled: true,
      maxWaitTime: 30000 // 30 seconds
    },
    battleModifiers: {
      experienceBonus: 50, // 50% bonus for learning
      difficultyMultiplier: 0.7, // Easier AI opponents
      specialRules: ['coaching_hints', 'extended_strategy_time']
    }
  },
  amateur: {
    id: 'amateur',
    name: 'Amateur',
    description: 'Developing tactical understanding',
    unlockRequirements: {
      minWins: 5,
      minPlayerLevel: 5
    },
    matchmakingRules: {
      ratingVariance: 125,
      crossTierAllowed: true,
      handicapEnabled: true,
      maxWaitTime: 45000
    },
    battleModifiers: {
      experienceBonus: 25,
      difficultyMultiplier: 0.85,
      specialRules: ['basic_psychology_effects']
    }
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Competitive team management',
    unlockRequirements: {
      minWins: 15,
      minPlayerLevel: 15,
      minRating: 1100
    },
    matchmakingRules: {
      ratingVariance: 100,
      crossTierAllowed: true,
      handicapEnabled: false,
      maxWaitTime: 60000
    },
    battleModifiers: {
      experienceBonus: 0,
      difficultyMultiplier: 1.0,
      specialRules: ['full_psychology_system', 'advanced_team_chemistry']
    }
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    description: 'High-level strategic combat',
    unlockRequirements: {
      minWins: 50,
      minPlayerLevel: 35,
      minRating: 1400,
      completedChallenges: ['tournament_finalist', 'weight_class_champion']
    },
    matchmakingRules: {
      ratingVariance: 75,
      crossTierAllowed: true,
      handicapEnabled: false,
      maxWaitTime: 90000
    },
    battleModifiers: {
      experienceBonus: 0,
      difficultyMultiplier: 1.2,
      specialRules: ['judge_system_active', 'environmental_effects', 'advanced_deviations']
    }
  },
  master: {
    id: 'master',
    name: 'Master',
    description: 'Peak competitive performance',
    unlockRequirements: {
      minWins: 150,
      minPlayerLevel: 60,
      minRating: 1700,
      previousTierMastery: true
    },
    matchmakingRules: {
      ratingVariance: 50,
      crossTierAllowed: false,
      handicapEnabled: false,
      maxWaitTime: 120000
    },
    battleModifiers: {
      experienceBonus: 0,
      difficultyMultiplier: 1.4,
      specialRules: ['all_systems_active', 'master_level_ai', 'tournament_pressure']
    }
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary',
    description: 'Ultimate challenge for the greatest coaches',
    unlockRequirements: {
      minWins: 500,
      minPlayerLevel: 80,
      minRating: 2000,
      completedChallenges: ['grand_champion', 'undefeated_streak_50']
    },
    matchmakingRules: {
      ratingVariance: 25,
      crossTierAllowed: false,
      handicapEnabled: false,
      maxWaitTime: 300000 // 5 minutes
    },
    battleModifiers: {
      experienceBonus: 0,
      difficultyMultiplier: 1.8,
      specialRules: ['legendary_ai', 'chaos_events', 'reality_bending']
    }
  }
};

// Team Power Calculation Functions
export function calculateTeamPower(
  team: Character[], 
  formation?: TeamFormation, 
  synergies?: TeamSynergy[]
): TeamPowerCalculation {
  
  // Base power from character stats
  const basePower = team.reduce((total, character) => {
    // Use the available stats from Character interface
    const baseStats = character.baseStats;
    const combatStats = character.combatStats;
    
    // Calculate stat sum from available stats
    const baseStatSum = baseStats ? 
      (baseStats.strength + baseStats.agility + baseStats.intelligence + 
       baseStats.vitality + baseStats.wisdom + baseStats.charisma) : 0;
    
    const combatStatSum = combatStats ? 
      (combatStats.attack + combatStats.defense + combatStats.speed + 
       combatStats.magicAttack + combatStats.magicDefense) : 0;
    
    const totalStatSum = baseStatSum + combatStatSum;
    const levelMultiplier = 1 + (character.level * 0.1); // 10% per level
    return total + (totalStatSum * levelMultiplier);
  }, 0);

  // Formation bonus (5-25% depending on formation effectiveness)
  const formationBonus = formation ? basePower * 0.15 : 0;

  // Synergy bonus (varies by synergy quality)
  const synergyBonus = synergies ? synergies.reduce((total, synergy) => {
    const multiplier = synergy.rarity === 'legendary' ? 0.2 : 
                      synergy.rarity === 'epic' ? 0.15 :
                      synergy.rarity === 'rare' ? 0.1 : 0.05;
    return total + (basePower * multiplier);
  }, 0) : 0;

  // Equipment bonus (estimated 10-30% of base power)
  const equipmentBonus = basePower * 0.2; // Placeholder - should calculate from actual equipment

  // Level bonus (team average level contributes)
  const averageLevel = team.reduce((sum, char) => sum + char.level, 0) / team.length;
  const levelBonus = averageLevel * 5; // 5 power per average level

  const totalPower = basePower + formationBonus + synergyBonus + equipmentBonus + levelBonus;
  
  // Determine weight class
  const weightClass = determineWeightClass(totalPower);

  return {
    basePower,
    formationBonus,
    synergyBonus,
    equipmentBonus,
    levelBonus,
    totalPower,
    weightClass
  };
}

export function determineWeightClass(totalPower: number): WeightClassName {
  for (const [className, classInfo] of Object.entries(WEIGHT_CLASSES)) {
    if (totalPower >= classInfo.powerRange.min && totalPower <= classInfo.powerRange.max) {
      return className as WeightClassName;
    }
  }
  return 'super_heavyweight'; // Default for very high power
}

export function isPlayerEligibleForTier(
  tier: DifficultyTier, 
  playerStats: {
    level: number;
    wins: number;
    rating: number;
    completedChallenges: string[];
  }
): boolean {
  const tierInfo = DIFFICULTY_TIERS[tier];
  const reqs = tierInfo.unlockRequirements;

  if (reqs.minPlayerLevel && playerStats.level < reqs.minPlayerLevel) return false;
  if (reqs.minWins && playerStats.wins < reqs.minWins) return false;
  if (reqs.minRating && playerStats.rating < reqs.minRating) return false;
  if (reqs.completedChallenges) {
    const hasAllChallenges = reqs.completedChallenges.every(challenge => 
      playerStats.completedChallenges.includes(challenge)
    );
    if (!hasAllChallenges) return false;
  }

  return true;
}

export function generateOpponentProfile(
  playerTeamPower: number,
  criteria: MatchmakingCriteria
): OpponentProfile {
  const weightClass = criteria.weightClass;
  const classInfo = WEIGHT_CLASSES[weightClass];
  const tierInfo = DIFFICULTY_TIERS[criteria.difficultyTier];

  // Generate opponent power within weight class range
  const powerVariance = criteria.maxPowerDifference;
  const minPower = Math.max(classInfo.powerRange.min, playerTeamPower - powerVariance);
  const maxPower = Math.min(classInfo.powerRange.max, playerTeamPower + powerVariance);
  const opponentPower = Math.floor(Math.random() * (maxPower - minPower + 1)) + minPower;

  // Estimate rating based on power and tier
  const baseRating = 1000 + ((opponentPower - 250) * 2); // Rough power-to-rating conversion
  const tierBonus = {
    'novice': -200,
    'amateur': -100,
    'professional': 0,
    'elite': 150,
    'master': 300,
    'legendary': 500
  }[criteria.difficultyTier] || 0;

  const estimatedRating = baseRating + tierBonus;

  // Determine match difficulty
  const powerDifference = opponentPower - playerTeamPower;
  const expectedMatchDifficulty: OpponentProfile['expectedMatchDifficulty'] = 
    powerDifference > 50 ? 'hard' :
    powerDifference > 15 ? 'challenging' :
    powerDifference < -50 ? 'easy' : 'fair';

  // Calculate reward multiplier
  const difficultyMultiplier = {
    'easy': 0.8,
    'fair': 1.0,
    'challenging': 1.3,
    'hard': 1.6
  }[expectedMatchDifficulty];

  const rewardMultiplier = difficultyMultiplier * classInfo.rewards.experienceMultiplier;

  return {
    teamPower: opponentPower,
    weightClass,
    difficultyTier: criteria.difficultyTier,
    estimatedRating,
    teamComposition: {
      formation: 'balanced', // Would be determined by AI
      archetypes: ['warrior', 'mage', 'support'], // Would be generated
      averageLevel: Math.floor(opponentPower / 50) // Rough estimate
    },
    expectedMatchDifficulty,
    rewardMultiplier
  };
}

export function getAvailableWeightClasses(teamPower: number): WeightClassName[] {
  const currentClass = determineWeightClass(teamPower);
  const classNames = Object.keys(WEIGHT_CLASSES) as WeightClassName[];
  const currentIndex = classNames.indexOf(currentClass);
  
  // Allow current class and one above/below if within reasonable power range
  const available = [currentClass];
  
  if (currentIndex > 0) {
    const lowerClass = classNames[currentIndex - 1];
    const lowerRange = WEIGHT_CLASSES[lowerClass].powerRange;
    if (teamPower <= lowerRange.max + 50) { // 50 power buffer
      available.unshift(lowerClass);
    }
  }
  
  if (currentIndex < classNames.length - 1) {
    const upperClass = classNames[currentIndex + 1];
    const upperRange = WEIGHT_CLASSES[upperClass].powerRange;
    if (teamPower >= upperRange.min - 50) { // 50 power buffer
      available.push(upperClass);
    }
  }
  
  return available;
}

export default {
  WEIGHT_CLASSES,
  DIFFICULTY_TIERS,
  calculateTeamPower,
  determineWeightClass,
  isPlayerEligibleForTier,
  generateOpponentProfile,
  getAvailableWeightClasses
};