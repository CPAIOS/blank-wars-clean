import { useCallback } from 'react';
import { type BattleStateData } from '@/hooks/temp/useBattleState';
import { type MatchmakingResult } from '@/data/weightClassSystem';

interface UseMatchmakingProps {
  state: BattleStateData;
  actions: {
    setSelectedOpponent: (opponent: MatchmakingResult | null) => void;
    setShowMatchmaking: (show: boolean) => void;
    setPhase: (phase: string) => void;
    setCurrentAnnouncement: (announcement: string) => void;
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
  }, [actions]);

  return {
    handleOpponentSelection,
  };
};