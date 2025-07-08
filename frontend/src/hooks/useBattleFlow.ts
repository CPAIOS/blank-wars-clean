import { useCallback } from 'react';
import { type BattleStateData } from '@/hooks/temp/useBattleState';
import { createBattleStats } from '@/data/combatRewards';

interface UseBattleFlowProps {
  state: BattleStateData;
  actions: {
    setCurrentRound: (round: number) => void;
    setCurrentMatch: (match: number) => void;
    setPlayerMatchWins: (wins: number) => void;
    setOpponentMatchWins: (wins: number) => void;
    setPlayerRoundWins: (wins: number) => void;
    setOpponentRoundWins: (wins: number) => void;
    setSelectedOpponent: (opponent: any) => void;
    setShowMatchmaking: (show: boolean) => void;
    setPhase: (phase: string) => void;
    setCurrentAnnouncement: (announcement: string) => void;
    setBattleCries: (cries: any) => void;
    setTimer?: (time: number | null) => void;
    setIsTimerActive?: (active: boolean) => void;
    setCoachingMessages: (messages: string[]) => void;
    setCharacterResponse: (response: string) => void;
    setShowDisagreement: (show: boolean) => void;
    setSelectedStrategies: (strategies: any) => void;
    setPendingStrategy: (strategy: any) => void;
    setChatMessages: (messages: any[]) => void;
    setCustomMessage: (message: string) => void;
    setIsCharacterTyping: (typing: boolean) => void;
    setShowRewards: (show: boolean) => void;
    setBattleRewards: (rewards: any) => void;
    setShowSkillProgression: (show: boolean) => void;
    setCombatSkillReward: (reward: any) => void;
    setPlayerTeam: (team: any) => void;
    setPlayer1: (player: any) => void;
    setPlayer2: (player: any) => void;
  };
}

export const useBattleFlow = ({ 
  state, 
  actions
}: UseBattleFlowProps) => {

  // Comprehensive battle reset - clears all state and returns to opponent selection
  const resetBattle = useCallback(() => {
    // Reset battle progression
    actions.setCurrentRound(1);
    actions.setCurrentMatch(1);
    actions.setPlayerMatchWins(0);
    actions.setOpponentMatchWins(0);
    actions.setPlayerRoundWins(0);
    actions.setOpponentRoundWins(0);
    
    // Reset matchmaking and phase
    actions.setSelectedOpponent(null);
    actions.setShowMatchmaking(true);
    actions.setPhase('pre_battle_huddle');
    actions.setCurrentAnnouncement('Welcome to the Arena! Choose your opponent to begin battle!');
    
    // Reset UI state
    actions.setBattleCries({ player1: '', player2: '' });
    actions.setTimer(null);
    actions.setIsTimerActive(false);
    
    // Reset coaching and strategy state
    actions.setCoachingMessages([]);
    actions.setCharacterResponse('');
    actions.setShowDisagreement(false);
    actions.setSelectedStrategies({ attack: null, defense: null, special: null });
    actions.setPendingStrategy(null);
    
    // Reset chat state
    actions.setChatMessages([]);
    actions.setCustomMessage('');
    actions.setIsCharacterTyping(false);
    
    // Reset rewards
    actions.setShowRewards(false);
    actions.setBattleRewards(null);
    actions.setShowSkillProgression(false);
    actions.setCombatSkillReward(null);
    
    // Reset character health, battle stats, and status
    actions.setPlayerTeam((prevTeam: any) => ({
      ...prevTeam,
      characters: prevTeam.characters.map((char: any) => ({
        ...char,
        currentHp: char.maxHp,
        statusEffects: [],
        temporaryStats: { 
          strength: 0, 
          vitality: 0, 
          speed: 0, 
          dexterity: 0, 
          stamina: 0, 
          intelligence: 0, 
          charisma: 0, 
          spirit: 0 
        },
      })),
    }));
    
    actions.setPlayer1((prev: any) => ({
      ...prev,
      hp: prev.maxHp,
      statusEffects: [],
      battleStats: createBattleStats(),
      abilities: prev.abilities.map((a: any) => ({ ...a, currentCooldown: 0 })),
      specialPowers: prev.specialPowers.map((p: any) => ({ ...p, currentCooldown: 0 }))
    }));
    
    actions.setPlayer2((prev: any) => ({
      ...prev,
      hp: prev.maxHp,
      statusEffects: [],
      battleStats: createBattleStats(),
      abilities: prev.abilities.map((a: any) => ({ ...a, currentCooldown: 0 })),
      specialPowers: prev.specialPowers.map((p: any) => ({ ...p, currentCooldown: 0 }))
    }));
  }, [actions]);

  // Start strategy selection phase with announcement and timer
  const startStrategySelection = useCallback(() => {
    actions.setPhase('pre_battle_huddle');
    const announcement = `Strategy Planning Phase - Choose each character's approach for battle!`;
    actions.setCurrentAnnouncement(announcement);
    
    // Initialize character-specific strategies - this needs to be passed from the coaching system
    actions.setSelectedStrategies({ attack: null, defense: null, special: null });
    if (actions.setTimer) {
      actions.setTimer(60); // Increased to 60 seconds for better UX
    }
    if (actions.setIsTimerActive) {
      actions.setIsTimerActive(true);
    }
  }, [actions]);

  return {
    resetBattle,
    startStrategySelection,
  };
};