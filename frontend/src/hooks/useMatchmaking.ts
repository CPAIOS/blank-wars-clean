import { useCallback } from 'react';
import { type BattleStateData } from '@/hooks/temp/useBattleState';
import { type MatchmakingResult } from '@/data/weightClassSystem';
import { type Team } from '@/data/characters';

interface UseMatchmakingProps {
  state: BattleStateData;
  actions: {
    setSelectedOpponent: (opponent: MatchmakingResult | null) => void;
    setShowMatchmaking: (show: boolean) => void;
    setPhase: (phase: string) => void;
    setCurrentAnnouncement: (announcement: string) => void;
    setOpponentTeam: (team: Team) => void;
  };
}

export const useMatchmaking = ({ 
  state, 
  actions
}: UseMatchmakingProps) => {

  // Handler for selecting an opponent from matchmaking
  const handleOpponentSelection = useCallback((opponent: MatchmakingResult) => {
    actions.setSelectedOpponent(opponent);
    actions.setShowMatchmaking(false);
    actions.setPhase('pre_battle_huddle');
    actions.setCurrentAnnouncement(`Opponent selected: Level ${opponent.opponent.teamLevel} team. Prepare for battle!`);
    
    // Adjust opponent team stats based on selected level
    const adjustedOpponentTeam = {
      ...state.opponentTeam,
      characters: state.opponentTeam.characters.map(char => ({
        ...char,
        level: opponent.opponent.teamLevel,
        // Scale stats based on level difference
        traditionalStats: {
          ...char.traditionalStats,
          strength: Math.max(10, Math.min(100, char.traditionalStats.strength + (opponent.opponent.teamLevel - char.level) * 3)),
          vitality: Math.max(10, Math.min(100, char.traditionalStats.vitality + (opponent.opponent.teamLevel - char.level) * 3)),
          speed: Math.max(10, Math.min(100, char.traditionalStats.speed + (opponent.opponent.teamLevel - char.level) * 2)),
          dexterity: Math.max(10, Math.min(100, char.traditionalStats.dexterity + (opponent.opponent.teamLevel - char.level) * 2)),
        },
        maxHp: Math.max(50, char.maxHp + (opponent.opponent.teamLevel - char.level) * 10),
        currentHp: Math.max(50, char.maxHp + (opponent.opponent.teamLevel - char.level) * 10)
      }))
    };
    
    actions.setOpponentTeam(adjustedOpponentTeam);
  }, [actions, state.opponentTeam]);

  return {
    handleOpponentSelection,
  };
};