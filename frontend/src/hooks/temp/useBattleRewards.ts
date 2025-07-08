import { useCallback } from 'react';
import { TeamCharacter } from '@/data/teamBattleSystem';
import { type BattleStateData } from '@/hooks/temp/useBattleState';
import { combatRewards } from '@/data/combatRewards';
import { calculateWeightClassXP } from '@/data/weightClassSystem';
import { createBattlePerformance, CombatSkillEngine } from '@/data/combatSkillProgression';
import { updateCoachingPointsAfterBattle } from '@/data/teamBattleSystem';

// Define TeamCharacterSkills interface locally (should be moved to shared types)
interface TeamCharacterSkills {
  characterId: string;
  coreSkills: {
    combat: { level: number; experience: number; maxLevel: number };
    survival: { level: number; experience: number; maxLevel: number };
    mental: { level: number; experience: number; maxLevel: number };
    social: { level: number; experience: number; maxLevel: number };
    spiritual: { level: number; experience: number; maxLevel: number };
  };
  signatureSkills: any;
  archetypeSkills: any;
  passiveAbilities: any[];
  activeAbilities: any[];
  unlockedNodes: any[];
  skillPoints: number;
  lastUpdated: Date;
}

interface UseBattleRewardsProps {
  state: BattleStateData;
  actions: {
    setBattleRewards: (rewards: any) => void;
    setCombatSkillReward: (reward: any) => void;
    setShowRewards: (show: boolean) => void;
    setPlayerTeam: (team: any) => void;
    setPlayer1: (player: any) => void;
  };
  timeoutManager: {
    setTimeout: (cb: () => void, delay: number) => any;
    clearTimeout: (id: any) => void;
  };
}

export const useBattleRewards = ({ 
  state, 
  actions, 
  timeoutManager
}: UseBattleRewardsProps) => {

  // Calculate and apply battle rewards, XP, level ups, and skill progression
  const calculateBattleRewards = useCallback((player1Won: boolean, winningCharacter: TeamCharacter) => {
    const { 
      currentRound,
      player1BattleStats, 
      player2BattleStats,
      selectedOpponent,
      player1,
      player2
    } = state;

    // Get the winning character's battle stats
    const stats = player1Won ? player1BattleStats : player2BattleStats;
    // Update battle stats with final round and total counts
    const updatedStats = {
      ...stats,
      roundsSurvived: currentRound,
      totalRounds: currentRound
    };
    
    // Calculate base rewards using the combat rewards system
    const baseRewards = combatRewards.calculateRewards(
      player1Won,
      winningCharacter.level,
      updatedStats,
      player1Won ? player2.level : player1.level, // opponent level
      1.0 // membership multiplier (could be dynamic)
    );
    
    // Enhanced XP calculation with weight class bonuses if opponent was selected via matchmaking
    let enhancedXP = baseRewards.xpGained;
    let xpBonusDescription = '';
    
    if (selectedOpponent && player1Won) {
      const playerLevel = winningCharacter.level;
      const opponentLevel = selectedOpponent.opponent.teamLevel;
      const battleDuration = currentRound * 30; // Rough estimate
      
      const weightClassXP = calculateWeightClassXP(playerLevel, opponentLevel, true, battleDuration);
      enhancedXP = weightClassXP.amount;
      
      if (weightClassXP.weightClassBonus && weightClassXP.weightClassBonus > 1) {
        const bonusPercent = Math.round((weightClassXP.weightClassBonus - 1) * 100);
        xpBonusDescription = `Weight Class Bonus: +${bonusPercent}% XP for fighting above your level!`;
      }
    }
    
    const rewards = {
      ...baseRewards,
      xpGained: enhancedXP,
      xpBonusDescription
    };
    
    // Check for level up
    const newXP = winningCharacter.experience + rewards.xpGained;
    const leveledUp = newXP >= winningCharacter.experienceToNext;
    
    if (leveledUp) {
      rewards.leveledUp = true;
      rewards.newLevel = winningCharacter.level + 1;
    }
    
    actions.setBattleRewards({
      ...rewards,
      characterName: winningCharacter.name,
      characterAvatar: winningCharacter.avatar,
      isVictory: player1Won,
      oldLevel: winningCharacter.level,
      newLevel: leveledUp ? winningCharacter.level + 1 : winningCharacter.level,
      oldXP: winningCharacter.experience,
      newXP: leveledUp ? newXP - winningCharacter.experienceToNext : newXP,
      xpToNext: leveledUp ? Math.floor(winningCharacter.experienceToNext * 1.2) : winningCharacter.experienceToNext
    });
    
    // Apply coaching points progression based on win/loss
    if (player1Won) {
      actions.setPlayerTeam((prev: any) => updateCoachingPointsAfterBattle(prev, true));
      actions.setPlayer1((prev: any) => ({
        ...prev,
        experience: leveledUp ? newXP - prev.experienceToNext : newXP,
        level: leveledUp ? prev.level + 1 : prev.level,
        experienceToNext: leveledUp ? Math.floor(prev.experienceToNext * 1.2) : prev.experienceToNext,
        // Apply stat bonuses to traditionalStats
        traditionalStats: {
          ...prev.traditionalStats,
          strength: rewards.statBonuses.atk ? prev.traditionalStats.strength + rewards.statBonuses.atk : prev.traditionalStats.strength,
          vitality: rewards.statBonuses.def ? prev.traditionalStats.vitality + rewards.statBonuses.def : prev.traditionalStats.vitality,
          speed: rewards.statBonuses.spd ? prev.traditionalStats.speed + rewards.statBonuses.spd : prev.traditionalStats.speed
        },
        maxHp: rewards.statBonuses.hp ? prev.maxHp + rewards.statBonuses.hp : prev.maxHp
      }));
    } else {
      // Handle loss - apply coaching points degradation
      actions.setPlayerTeam((prev: any) => updateCoachingPointsAfterBattle(prev, false));
    }
    
    // Calculate combat skill progression
    const battlePerformance = createBattlePerformance(winningCharacter.name, {
      isVictory: player1Won,
      battleDuration: currentRound * 30, // Estimate based on rounds
      playerLevel: winningCharacter.level,
      opponentLevel: player1Won ? player2.level : player1.level,
      damageDealt: stats.damageDealt,
      damageTaken: stats.damageTaken,
      criticalHits: stats.criticalHits,
      abilitiesUsed: stats.skillsUsed,
      environment: 'arena'
    });

    // Mock character skills for demo
    const demoSkills: TeamCharacterSkills = {
      characterId: winningCharacter.name,
      coreSkills: {
        combat: { level: Math.floor(winningCharacter.level * 0.8), experience: 450, maxLevel: 100 },
        survival: { level: Math.floor(winningCharacter.level * 0.6), experience: 320, maxLevel: 100 },
        mental: { level: Math.floor(winningCharacter.level * 0.7), experience: 380, maxLevel: 100 },
        social: { level: Math.floor(winningCharacter.level * 0.5), experience: 210, maxLevel: 100 },
        spiritual: { level: Math.floor(winningCharacter.level * 0.4), experience: 150, maxLevel: 100 }
      },
      signatureSkills: {},
      archetypeSkills: {},
      passiveAbilities: [],
      activeAbilities: [],
      unlockedNodes: [],
      skillPoints: 5,
      lastUpdated: new Date()
    };

    const skillReward = CombatSkillEngine.calculateSkillProgression(battlePerformance, demoSkills);
    actions.setCombatSkillReward(skillReward);

    // Show rewards screen after a short delay
    timeoutManager.setTimeout(() => {
      actions.setShowRewards(true);
    }, 2000);
  }, [state, actions, timeoutManager]);

  return {
    calculateBattleRewards,
  };
};