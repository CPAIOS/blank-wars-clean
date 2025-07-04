// Weight Class System for PvP Matchmaking
// Implements risk/reward progression based on level differences

import { calculateBattleXP, type ExperienceGain } from './experience';

export interface WeightClass {
  id: string;
  name: string;
  levelRange: [number, number]; // [min, max] inclusive
  color: string;
  description: string;
  rank: number; // For ordering
}

export const weightClasses: WeightClass[] = [
  {
    id: 'rookie',
    name: 'Rookie Division',
    levelRange: [1, 5],
    color: 'from-green-400 to-green-500',
    description: 'New fighters learning the basics',
    rank: 1
  },
  {
    id: 'amateur',
    name: 'Amateur League',
    levelRange: [6, 10],
    color: 'from-blue-400 to-blue-500',
    description: 'Developing fighters gaining experience',
    rank: 2
  },
  {
    id: 'pro',
    name: 'Professional Circuit',
    levelRange: [11, 20],
    color: 'from-purple-400 to-purple-500',
    description: 'Skilled fighters competing seriously',
    rank: 3
  },
  {
    id: 'elite',
    name: 'Elite Championship',
    levelRange: [21, 35],
    color: 'from-orange-400 to-orange-500',
    description: 'Top-tier fighters with mastery',
    rank: 4
  },
  {
    id: 'legendary',
    name: 'Legendary Masters',
    levelRange: [36, 50],
    color: 'from-red-400 to-red-500',
    description: 'The absolute pinnacle of combat',
    rank: 5
  }
];

export interface MatchmakingPreference {
  allowSameClass: boolean;
  allowClassAbove: boolean;
  allowClassBelow: boolean;
  maxLevelDifference: number;
}

export interface MatchmakingResult {
  opponent: {
    teamLevel: number; // Average level of opponent team
    weightClass: WeightClass;
    levelDifference: number; // negative = lower, positive = higher
  };
  riskLevel: 'safe' | 'moderate' | 'risky' | 'extreme';
  expectedXpMultiplier: number;
  description: string;
}

// Get weight class for a character level
export function getWeightClassForLevel(level: number): WeightClass {
  const weightClass = weightClasses.find(wc => 
    level >= wc.levelRange[0] && level <= wc.levelRange[1]
  );
  return weightClass || weightClasses[weightClasses.length - 1]; // Default to highest if over max
}

// Get team's overall weight class (based on average level)
export function getTeamWeightClass(teamLevels: number[]): { averageLevel: number; weightClass: WeightClass } {
  const averageLevel = Math.round(teamLevels.reduce((sum, level) => sum + level, 0) / teamLevels.length);
  const weightClass = getWeightClassForLevel(averageLevel);
  return { averageLevel, weightClass };
}

// Calculate risk level based on opponent level difference
export function calculateRiskLevel(levelDifference: number): MatchmakingResult['riskLevel'] {
  if (levelDifference <= -3) return 'safe';    // Fighting 3+ levels below
  if (levelDifference <= 0) return 'moderate'; // Same level or 1-2 below
  if (levelDifference <= 3) return 'risky';    // 1-3 levels above
  return 'extreme';                            // 4+ levels above
}

// Enhanced XP calculation with weight class bonuses
export function calculateWeightClassXP(
  playerLevel: number,
  opponentLevel: number,
  isVictory: boolean,
  battleDuration: number
): ExperienceGain & { weightClassBonus?: number } {
  // Use existing battle XP calculation as base
  const baseXpGain = calculateBattleXP(playerLevel, opponentLevel, isVictory, battleDuration);
  
  const levelDifference = opponentLevel - playerLevel;
  let weightClassBonus = 1;
  
  // Additional weight class specific bonuses
  if (levelDifference >= 5) {
    // Fighting significantly higher weight class
    weightClassBonus = 1.5; // +50% bonus
  } else if (levelDifference >= 8) {
    // Fighting way above weight class
    weightClassBonus = 2.0; // +100% bonus
  } else if (levelDifference >= 12) {
    // David vs Goliath scenario
    weightClassBonus = 3.0; // +200% bonus
  }
  
  // Apply weight class bonus if it's better than existing
  let finalAmount = baseXpGain.amount;
  const bonuses = [...baseXpGain.bonuses];
  
  if (weightClassBonus > 1) {
    finalAmount = Math.floor(baseXpGain.amount * weightClassBonus);
    bonuses.push({
      type: 'weight_class',
      multiplier: weightClassBonus,
      description: `Weight class challenge bonus (+${Math.round((weightClassBonus - 1) * 100)}%)`
    });
  }
  
  return {
    ...baseXpGain,
    amount: finalAmount,
    bonuses,
    weightClassBonus
  };
}

// Find available matchmaking opponents based on preferences
export function findMatchmakingOpponents(
  playerTeamLevel: number,
  preferences: MatchmakingPreference
): MatchmakingResult[] {
  const playerWeightClass = getWeightClassForLevel(playerTeamLevel);
  const results: MatchmakingResult[] = [];
  
  // Generate potential opponents within level range
  const minLevel = Math.max(1, playerTeamLevel - preferences.maxLevelDifference);
  const maxLevel = Math.min(50, playerTeamLevel + preferences.maxLevelDifference);
  
  for (let opponentLevel = minLevel; opponentLevel <= maxLevel; opponentLevel++) {
    const opponentWeightClass = getWeightClassForLevel(opponentLevel);
    const levelDifference = opponentLevel - playerTeamLevel;
    
    // Check if this opponent matches preferences
    const sameClass = opponentWeightClass.id === playerWeightClass.id;
    const classAbove = opponentWeightClass.rank > playerWeightClass.rank;
    const classBelow = opponentWeightClass.rank < playerWeightClass.rank;
    
    let allowed = false;
    if (sameClass && preferences.allowSameClass) allowed = true;
    if (classAbove && preferences.allowClassAbove) allowed = true;
    if (classBelow && preferences.allowClassBelow) allowed = true;
    
    if (!allowed) continue;
    
    // Calculate expected XP multiplier
    const mockXpGain = calculateWeightClassXP(playerTeamLevel, opponentLevel, true, 120);
    const baseXp = 100; // Base victory XP
    const expectedMultiplier = mockXpGain.amount / baseXp;
    
    const riskLevel = calculateRiskLevel(levelDifference);
    
    let description = '';
    if (levelDifference === 0) {
      description = 'Even match - balanced risk and reward';
    } else if (levelDifference > 0) {
      description = `Fighting ${levelDifference} level${levelDifference > 1 ? 's' : ''} above - high risk, high reward`;
    } else {
      description = `Fighting ${Math.abs(levelDifference)} level${Math.abs(levelDifference) > 1 ? 's' : ''} below - low risk, standard reward`;
    }
    
    results.push({
      opponent: {
        teamLevel: opponentLevel,
        weightClass: opponentWeightClass,
        levelDifference
      },
      riskLevel,
      expectedXpMultiplier: expectedMultiplier,
      description
    });
  }
  
  // Sort by level difference (closest first, then higher levels)
  return results.sort((a, b) => {
    const aDiff = Math.abs(a.opponent.levelDifference);
    const bDiff = Math.abs(b.opponent.levelDifference);
    if (aDiff !== bDiff) return aDiff - bDiff;
    return b.opponent.levelDifference - a.opponent.levelDifference; // Higher levels first if same distance
  });
}

// Default matchmaking preferences
export const defaultMatchmakingPreferences: MatchmakingPreference = {
  allowSameClass: true,
  allowClassAbove: true,
  allowClassBelow: true,
  maxLevelDifference: 10
};

// Aggressive matchmaking preferences (for risk-takers like you!)
export const aggressiveMatchmakingPreferences: MatchmakingPreference = {
  allowSameClass: true,
  allowClassAbove: true,
  allowClassBelow: false, // No easy fights
  maxLevelDifference: 15  // Willing to fight way above
};

// Conservative matchmaking preferences
export const conservativeMatchmakingPreferences: MatchmakingPreference = {
  allowSameClass: true,
  allowClassAbove: false, // No higher weight classes
  allowClassBelow: true,
  maxLevelDifference: 3   // Stay close to your level
};

// Get readable weight class comparison
export function getWeightClassComparison(playerClass: WeightClass, opponentClass: WeightClass): string {
  if (playerClass.id === opponentClass.id) {
    return `Same weight class (${playerClass.name})`;
  } else if (opponentClass.rank > playerClass.rank) {
    const difference = opponentClass.rank - playerClass.rank;
    return `${difference} weight class${difference > 1 ? 'es' : ''} above (${opponentClass.name})`;
  } else {
    const difference = playerClass.rank - opponentClass.rank;
    return `${difference} weight class${difference > 1 ? 'es' : ''} below (${opponentClass.name})`;
  }
}