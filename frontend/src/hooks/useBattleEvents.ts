import { useCallback } from 'react';
import { type BattleStateData } from '@/hooks/temp/useBattleState';

interface UseBattleEventsProps {
  state: BattleStateData;
  actions: {
    setCurrentAnnouncement: (announcement: string) => void;
    setPhase: (phase: string) => void;
    setCurrentRound: (round: number) => void;
    setBattleRewards: (rewards: any) => void;
    setShowRewards: (show: boolean) => void;
  };
  announceBattleStart: (player1: string, player2: string) => void;
  announceRoundStart: (round: number) => void;
  announceVictory: (winner: string) => void;
  announceDefeat: (loser: string) => void;
  socketRef: any;
}

export const useBattleEvents = ({ 
  state, 
  actions,
  announceBattleStart,
  announceRoundStart,
  announceVictory,
  announceDefeat,
  socketRef
}: UseBattleEventsProps) => {

  // WebSocket event handler for battle start
  const handleBattleStart = useCallback((data: any) => {
    console.log('Battle starting:', data);
    actions.setCurrentAnnouncement(`Battle begins! ${data.player1?.username} vs ${data.player2?.username}`);
    actions.setPhase('pre_battle_huddle');
    announceBattleStart(data.player1?.username || 'Player 1', data.player2?.username || 'Player 2');
  }, [actions, announceBattleStart]);

  // WebSocket event handler for round start
  const handleRoundStart = useCallback((data: any) => {
    console.log('Round starting:', data);
    actions.setCurrentRound(data.round || 1);
    actions.setCurrentAnnouncement(`Round ${data.round || 1} begins!`);
    actions.setPhase('combat');
    announceRoundStart(data.round || 1);
  }, [actions, announceRoundStart]);

  // WebSocket event handler for battle end
  const handleBattleEnd = useCallback((result: any) => {
    console.log('Battle ended:', result);
    actions.setCurrentAnnouncement(result.message || 'Battle completed!');
    actions.setPhase('battle_complete');
    
    if (result.winner === socketRef.current?.currentUser?.id) {
      announceVictory(result.winnerName || 'You');
    } else {
      announceDefeat(result.loserName || 'You');
    }
    
    // Show rewards if available
    if (result.rewards) {
      actions.setBattleRewards(result.rewards);
      actions.setShowRewards(true);
    }
  }, [actions, socketRef, announceVictory, announceDefeat]);

  return {
    handleBattleStart,
    handleRoundStart,
    handleBattleEnd,
  };
};