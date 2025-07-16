// Coach Progression API Client
import { apiClient } from './apiClient';

export interface CoachProgression {
  userId: string;
  coachLevel: number;
  coachExperience: number;
  coachTitle: string;
  psychologySkillPoints: number;
  battleStrategySkillPoints: number;
  characterDevelopmentSkillPoints: number;
  totalBattlesCoached: number;
  totalWinsCoached: number;
  psychologyInterventions: number;
  successfulInterventions: number;
  gameplanAdherenceRate: number;
  teamChemistryImprovements: number;
  characterDevelopments: number;
  progressInCurrentLevel: number;
  xpToNextLevel: number;
  nextLevelXP: number;
  currentLevelXP: number;
}

export interface CoachBonuses {
  gameplanAdherenceBonus: number;
  deviationRiskReduction: number;
  teamChemistryBonus: number;
  battleXPMultiplier: number;
  characterDevelopmentMultiplier: number;
}

export interface CoachProgressionResponse {
  progression: CoachProgression;
  bonuses: CoachBonuses;
  timestamp: string;
}

export interface CoachXPEvent {
  id: string;
  userId: string;
  eventType: 'battle_win' | 'battle_loss' | 'psychology_management' | 'character_development';
  eventSubtype?: string;
  xpGained: number;
  description: string;
  battleId?: string;
  characterId?: string;
  createdAt: Date;
}

export interface CoachSkill {
  id: string;
  userId: string;
  skillTree: 'psychology_mastery' | 'battle_strategy' | 'character_development';
  skillName: string;
  skillLevel: number;
  unlockedAt: Date;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  coachLevel: number;
  coachExperience: number;
  coachTitle: string;
  totalBattlesCoached: number;
  totalWinsCoached: number;
  winRate: number;
}

class CoachProgressionAPI {
  
  // Get coach progression
  async getProgression(): Promise<CoachProgressionResponse> {
    const response = await apiClient.get('/api/coach-progression');
    return response.data;
  }

  // Get XP history
  async getXPHistory(limit: number = 50): Promise<{ history: CoachXPEvent[]; count: number }> {
    const response = await apiClient.get(`/api/coach-progression/xp-history?limit=${limit}`);
    return response.data;
  }

  // Get coach skills
  async getSkills(): Promise<{ skills: CoachSkill[]; count: number }> {
    const response = await apiClient.get('/api/coach-progression/skills');
    return response.data;
  }

  // Get leaderboard
  async getLeaderboard(limit: number = 10): Promise<{ leaderboard: LeaderboardEntry[]; count: number }> {
    const response = await apiClient.get(`/api/coach-progression/leaderboard?limit=${limit}`);
    return response.data;
  }

  // Award battle XP
  async awardBattleXP(
    isWin: boolean,
    battleId: string,
    characterId?: string,
    bonusMultiplier?: number,
    bonusReason?: string
  ): Promise<{ success: boolean; battleResult: string; leveledUp: boolean; newLevel?: number; oldLevel?: number }> {
    const response = await apiClient.post('/api/coach-progression/award-battle-xp', {
      isWin,
      battleId,
      characterId,
      bonusMultiplier,
      bonusReason
    });
    return response.data;
  }

  // Award gameplan adherence XP (includes breakdown prevention)
  async awardGameplanAdherenceXP(
    adherenceRate: number,
    deviationsBlocked: number,
    averageDeviationSeverity: 'minor' | 'moderate' | 'major' | 'extreme',
    battleId: string
  ): Promise<{ success: boolean; adherenceRate: number; deviationsBlocked: number; leveledUp: boolean; newLevel?: number; oldLevel?: number }> {
    const response = await apiClient.post('/api/coach-progression/award-gameplan-adherence-xp', {
      adherenceRate,
      deviationsBlocked,
      averageDeviationSeverity,
      battleId
    });
    return response.data;
  }

  // Award team chemistry XP
  async awardTeamChemistryXP(
    chemistryImprovement: number,
    finalChemistry: number,
    battleId: string
  ): Promise<{ success: boolean; chemistryImprovement: number; finalChemistry: number; leveledUp: boolean; newLevel?: number; oldLevel?: number }> {
    const response = await apiClient.post('/api/coach-progression/award-team-chemistry-xp', {
      chemistryImprovement,
      finalChemistry,
      battleId
    });
    return response.data;
  }

  // Award character development XP
  async awardCharacterDevelopmentXP(
    developmentType: string,
    xpAmount: number,
    description: string,
    characterId?: string
  ): Promise<{ success: boolean; developmentType: string; xpAwarded: number; leveledUp: boolean; newLevel?: number; oldLevel?: number }> {
    const response = await apiClient.post('/api/coach-progression/award-character-development-xp', {
      developmentType,
      xpAmount,
      description,
      characterId
    });
    return response.data;
  }

  // Helper method to calculate XP for level
  calculateXPForLevel(level: number): number {
    return level * 1000 + (level * level * 100);
  }

  // Helper method to get coach title
  getCoachTitle(level: number): string {
    if (level >= 101) return 'Legendary Coach';
    if (level >= 76) return 'Elite Coach';
    if (level >= 51) return 'Master Coach';
    if (level >= 26) return 'Head Coach';
    if (level >= 11) return 'Assistant Coach';
    return 'Rookie Coach';
  }

  // Helper method to get skill tree description
  getSkillTreeDescription(tree: string): string {
    switch (tree) {
      case 'psychology_mastery':
        return 'Enhance gameplan adherence and reduce character breakdowns';
      case 'battle_strategy':
        return 'Improve battle performance and tactical bonuses';
      case 'character_development':
        return 'Accelerate character growth and development';
      default:
        return 'Unknown skill tree';
    }
  }

  // Helper method to format XP numbers
  formatXP(xp: number): string {
    if (xp >= 1000000) {
      return (xp / 1000000).toFixed(1) + 'M';
    } else if (xp >= 1000) {
      return (xp / 1000).toFixed(1) + 'K';
    }
    return xp.toString();
  }
}

export const coachProgressionAPI = new CoachProgressionAPI();