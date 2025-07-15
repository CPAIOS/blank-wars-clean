import { useCallback } from 'react';
import { type BattleStateData } from '@/hooks/temp/useBattleState';
import EventPublisher from '@/services/eventPublisher';

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
  const eventPublisher = EventPublisher.getInstance();

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
  const handleBattleEnd = useCallback(async (result: any) => {
    console.log('Battle ended:', result);
    actions.setCurrentAnnouncement(result.message || 'Battle completed!');
    actions.setPhase('battle_complete');
    
    // Publish battle event to centralized system
    try {
      await eventPublisher.publishBattleEvent({
        winnerId: result.winnerId || result.winner || 'unknown',
        loserId: result.loserId || result.loser || 'unknown',
        participants: result.participants || [result.winnerId, result.loserId].filter(Boolean),
        battleDuration: result.duration || 0,
        teamworkRating: result.teamworkRating || 50,
        mvpPlayer: result.mvp || result.winnerId,
        battleType: result.battleType || 'arena_battle',
        strategyUsed: result.strategy || 'unknown'
      });
      console.log('✅ Battle event published to centralized system');
    } catch (error) {
      console.warn('❌ Failed to publish battle event:', error);
    }
    
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
  }, [actions, socketRef, announceVictory, announceDefeat, eventPublisher]);

  return {
    handleBattleStart,
    handleRoundStart,
    handleBattleEnd,
  };
};