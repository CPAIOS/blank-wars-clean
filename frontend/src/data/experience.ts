// Experience and Leveling System for _____ Wars
// Core character progression mechanics

export interface ExperienceGain {
  source: 'battle' | 'training' | 'quest' | 'achievement' | 'daily' | 'event';
  amount: number;
  bonuses: {
    type: string;
    multiplier: number;
    description: string;
  }[];
  timestamp: Date;
}

export interface LevelRequirement {
  level: number;
  xpRequired: number;
  totalXpRequired: number;
  rewards: LevelReward[];
}

export interface LevelReward {
  type: 'stat_points' | 'skill_points' | 'ability' | 'item' | 'currency' | 'unlock' | 'title';
  id?: string;
  amount?: number;
  description: string;
}

export interface CharacterExperience {
  characterId: string;
  currentLevel: number;
  currentXP: number;
  totalXP: number;
  xpToNextLevel: number;
  statPoints: number;
  skillPoints: number;
  levelHistory: {
    level: number;
    achievedAt: Date;
    timeToLevel: number; // seconds
  }[];
  xpHistory: ExperienceGain[];
}

// XP curve configuration
const XP_CURVE_BASE = 100;
const XP_CURVE_MULTIPLIER = 1.5;
const XP_CURVE_EXPONENT = 1.2;

// Generate level requirements for levels 1-50
export const levelRequirements: LevelRequirement[] = Array.from({ length: 50 }, (_, i) => {
  const level = i + 1;
  
  // Calculate XP required for this level
  const xpRequired = Math.floor(
    XP_CURVE_BASE * Math.pow(level, XP_CURVE_EXPONENT) * XP_CURVE_MULTIPLIER
  );
  
  // Calculate total XP required to reach this level
  const totalXpRequired = Array.from({ length: level - 1 }, (_, j) => {
    const lvl = j + 1;
    return Math.floor(XP_CURVE_BASE * Math.pow(lvl, XP_CURVE_EXPONENT) * XP_CURVE_MULTIPLIER);
  }).reduce((sum, xp) => sum + xp, 0);

  // Define rewards for each level
  const rewards: LevelReward[] = [];

  // Every level gives stat points
  rewards.push({
    type: 'stat_points',
    amount: level <= 10 ? 3 : level <= 25 ? 4 : 5,
    description: `+${level <= 10 ? 3 : level <= 25 ? 4 : 5} stat points to distribute`
  });

  // Every 2 levels gives skill points
  if (level % 2 === 0) {
    rewards.push({
      type: 'skill_points',
      amount: 1,
      description: '+1 skill point for abilities'
    });
  }

  // Milestone rewards
  if (level % 5 === 0) {
    rewards.push({
      type: 'currency',
      id: 'gems',
      amount: level * 10,
      description: `+${level * 10} gems bonus`
    });
  }

  if (level % 10 === 0) {
    rewards.push({
      type: 'unlock',
      id: `ability_slot_${Math.floor(level / 10)}`,
      description: `Unlock ability slot ${Math.floor(level / 10)}`
    });
  }

  // Special milestone rewards
  switch (level) {
    case 5:
      rewards.push({
        type: 'unlock',
        id: 'training_advanced',
        description: 'Unlock advanced training facilities'
      });
      break;
    case 10:
      rewards.push({
        type: 'title',
        id: 'experienced_warrior',
        description: 'Earn "Experienced Warrior" title'
      });
      break;
    case 20:
      rewards.push({
        type: 'ability',
        id: 'signature_ability',
        description: 'Unlock signature ability'
      });
      break;
    case 30:
      rewards.push({
        type: 'unlock',
        id: 'elite_equipment',
        description: 'Unlock elite equipment tier'
      });
      break;
    case 40:
      rewards.push({
        type: 'title',
        id: 'legendary_warrior',
        description: 'Earn "Legendary Warrior" title'
      });
      break;
    case 50:
      rewards.push({
        type: 'unlock',
        id: 'prestige_mode',
        description: 'Unlock Prestige Mode'
      });
      rewards.push({
        type: 'title',
        id: 'max_level_champion',
        description: 'Earn "Max Level Champion" title'
      });
      break;
  }

  return {
    level,
    xpRequired,
    totalXpRequired,
    rewards
  };
});

// XP gain calculations
export function calculateBattleXP(
  winnerLevel: number,
  loserLevel: number,
  isVictory: boolean,
  battleDuration: number
): ExperienceGain {
  const baseXP = isVictory ? 100 : 30;
  const levelDifference = loserLevel - winnerLevel;
  
  // Level difference multiplier
  let levelMultiplier = 1;
  if (levelDifference > 0) {
    levelMultiplier = 1 + (levelDifference * 0.1); // +10% per level higher
  } else if (levelDifference < -5) {
    levelMultiplier = Math.max(0.1, 1 + (levelDifference * 0.1)); // -10% per level lower, min 10%
  }

  // Quick battle bonus
  const quickBattleBonus = battleDuration < 120 ? 1.2 : 1; // 20% bonus for battles under 2 minutes

  const bonuses: ExperienceGain['bonuses'] = [];
  
  if (levelMultiplier !== 1) {
    bonuses.push({
      type: 'level_difference',
      multiplier: levelMultiplier,
      description: `Level difference (${levelDifference > 0 ? '+' : ''}${levelDifference})`
    });
  }

  if (quickBattleBonus > 1) {
    bonuses.push({
      type: 'quick_battle',
      multiplier: quickBattleBonus,
      description: 'Quick battle bonus'
    });
  }

  const totalMultiplier = levelMultiplier * quickBattleBonus;
  const amount = Math.floor(baseXP * totalMultiplier);

  return {
    source: 'battle',
    amount,
    bonuses,
    timestamp: new Date()
  };
}

export function calculateTrainingXP(
  activityType: string,
  duration: number,
  facilityTier: number
): ExperienceGain {
  const baseXPPerMinute = 10;
  const facilityMultiplier = 1 + (facilityTier * 0.25); // +25% per tier
  
  const bonuses: ExperienceGain['bonuses'] = [{
    type: 'facility_tier',
    multiplier: facilityMultiplier,
    description: `Tier ${facilityTier} facility bonus`
  }];

  const amount = Math.floor((baseXPPerMinute * duration) * facilityMultiplier);

  return {
    source: 'training',
    amount,
    bonuses,
    timestamp: new Date()
  };
}

// Level progression functions
export function getRequiredXPForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > 50) return Infinity;
  
  const requirement = levelRequirements.find(req => req.level === level);
  return requirement?.xpRequired || 0;
}

export function getTotalXPForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > 50) return Infinity;
  
  const requirement = levelRequirements.find(req => req.level === level);
  return requirement?.totalXpRequired || 0;
}

export function calculateLevelFromTotalXP(totalXP: number): { level: number; currentXP: number; xpToNext: number } {
  let level = 1;
  let remainingXP = totalXP;

  for (const req of levelRequirements) {
    if (totalXP >= req.totalXpRequired + req.xpRequired) {
      level = req.level + 1;
    } else if (totalXP >= req.totalXpRequired) {
      level = req.level;
      remainingXP = totalXP - req.totalXpRequired;
      break;
    }
  }

  // Cap at level 50
  if (level > 50) {
    level = 50;
    remainingXP = 0;
  }

  const xpToNext = getRequiredXPForLevel(level) - remainingXP;

  return {
    level: Math.min(level, 50),
    currentXP: remainingXP,
    xpToNext: Math.max(0, xpToNext)
  };
}

export function addExperience(
  character: CharacterExperience,
  gain: ExperienceGain
): { 
  updatedCharacter: CharacterExperience; 
  leveledUp: boolean; 
  newLevel?: number;
  rewards?: LevelReward[];
} {
  const updatedCharacter = { ...character };
  
  // Add XP
  updatedCharacter.currentXP += gain.amount;
  updatedCharacter.totalXP += gain.amount;
  
  // Add to history
  updatedCharacter.xpHistory = [...updatedCharacter.xpHistory, gain];
  
  // Check for level up
  let leveledUp = false;
  let newLevel = updatedCharacter.currentLevel;
  const collectedRewards: LevelReward[] = [];
  
  while (updatedCharacter.currentXP >= getRequiredXPForLevel(updatedCharacter.currentLevel)) {
    const xpRequired = getRequiredXPForLevel(updatedCharacter.currentLevel);
    updatedCharacter.currentXP -= xpRequired;
    updatedCharacter.currentLevel += 1;
    newLevel = updatedCharacter.currentLevel;
    leveledUp = true;
    
    // Get rewards for this level
    const levelReq = levelRequirements.find(req => req.level === newLevel);
    if (levelReq) {
      collectedRewards.push(...levelReq.rewards);
      
      // Apply immediate rewards
      levelReq.rewards.forEach(reward => {
        if (reward.type === 'stat_points' && reward.amount) {
          updatedCharacter.statPoints += reward.amount;
        }
        if (reward.type === 'skill_points' && reward.amount) {
          updatedCharacter.skillPoints += reward.amount;
        }
      });
    }
    
    // Add to level history
    updatedCharacter.levelHistory.push({
      level: newLevel,
      achievedAt: new Date(),
      timeToLevel: 0 // Would calculate from previous level timestamp
    });
    
    // Stop at max level
    if (updatedCharacter.currentLevel >= 50) {
      updatedCharacter.currentLevel = 50;
      updatedCharacter.currentXP = 0;
      break;
    }
  }
  
  // Update XP to next level
  updatedCharacter.xpToNextLevel = getRequiredXPForLevel(updatedCharacter.currentLevel) - updatedCharacter.currentXP;
  
  return {
    updatedCharacter,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    rewards: leveledUp ? collectedRewards : undefined
  };
}

// Experience bonuses
export interface ExperienceBonus {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  source: string;
  duration?: number; // in seconds, null for permanent
  expiresAt?: Date;
  stackable: boolean;
}

export function calculateTotalExperienceMultiplier(bonuses: ExperienceBonus[]): number {
  // Separate stackable and non-stackable bonuses
  const stackableBonuses = bonuses.filter(b => b.stackable);
  const nonStackableBonuses = bonuses.filter(b => !b.stackable);
  
  // For non-stackable, take the highest
  const highestNonStackable = nonStackableBonuses.reduce((max, bonus) => 
    bonus.multiplier > max ? bonus.multiplier : max, 1
  );
  
  // For stackable, multiply them
  const stackableMultiplier = stackableBonuses.reduce((total, bonus) => 
    total * bonus.multiplier, 1
  );
  
  return highestNonStackable * stackableMultiplier;
}

// Daily/Weekly bonuses
export const experienceBonuses = {
  firstWinOfDay: {
    id: 'first_win_daily',
    name: 'First Win of the Day',
    description: 'Double XP for your first victory',
    multiplier: 2,
    source: 'daily_bonus',
    duration: null,
    stackable: false
  },
  weekendBonus: {
    id: 'weekend_bonus',
    name: 'Weekend Warriors',
    description: '+50% XP all weekend',
    multiplier: 1.5,
    source: 'event',
    duration: null,
    stackable: true
  },
  premiumBonus: {
    id: 'premium_member',
    name: 'Premium Membership',
    description: '+100% XP from all sources',
    multiplier: 2,
    source: 'subscription',
    duration: null,
    stackable: true
  },
  guildBonus: {
    id: 'guild_bonus',
    name: 'Guild Experience Share',
    description: '+25% XP when in a guild',
    multiplier: 1.25,
    source: 'guild',
    duration: null,
    stackable: true
  }
};

// Helper to create new character experience
export function createCharacterExperience(characterId: string): CharacterExperience {
  return {
    characterId,
    currentLevel: 1,
    currentXP: 0,
    totalXP: 0,
    xpToNextLevel: getRequiredXPForLevel(1),
    statPoints: 0,
    skillPoints: 0,
    levelHistory: [{
      level: 1,
      achievedAt: new Date(),
      timeToLevel: 0
    }],
    xpHistory: []
  };
}

// Prestige system (for level 50 characters)
export interface PrestigeLevel {
  tier: number;
  name: string;
  color: string;
  bonuses: {
    statMultiplier: number;
    xpMultiplier: number;
    specialRewards: string[];
  };
}

export const prestigeLevels: PrestigeLevel[] = [
  {
    tier: 1,
    name: 'Bronze Prestige',
    color: 'from-orange-600 to-orange-700',
    bonuses: {
      statMultiplier: 1.1,
      xpMultiplier: 1.5,
      specialRewards: ['bronze_frame', 'prestige_1_title']
    }
  },
  {
    tier: 2,
    name: 'Silver Prestige',
    color: 'from-gray-400 to-gray-500',
    bonuses: {
      statMultiplier: 1.2,
      xpMultiplier: 2,
      specialRewards: ['silver_frame', 'prestige_2_title']
    }
  },
  {
    tier: 3,
    name: 'Gold Prestige',
    color: 'from-yellow-400 to-yellow-500',
    bonuses: {
      statMultiplier: 1.3,
      xpMultiplier: 2.5,
      specialRewards: ['gold_frame', 'prestige_3_title', 'legendary_skin']
    }
  }
];