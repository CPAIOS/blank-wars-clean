import { useCallback } from 'react';
import { TeamCharacter } from '@/data/teamBattleSystem';
import { type BattleStateData } from '@/hooks/temp/useBattleState';

interface UseBattleCommunicationProps {
  state: BattleStateData;
  actions: {
    setCurrentAnnouncement: (announcement: string) => void;
    setBattleCries: (cries: any) => void;
  };
  timeoutManager: {
    setTimeout: (cb: () => void, delay: number) => any;
    clearTimeout: (id: any) => void;
  };
  announceBattleCry: () => void;
}

export const useBattleCommunication = ({ 
  state, 
  actions, 
  timeoutManager,
  announceBattleCry
}: UseBattleCommunicationProps) => {

  // Fetch AI-generated battle cries with API integration and fallback logic
  const fetchBattleCries = useCallback(async () => {
    const { player1, player2 } = state;
    
    // Ensure component is still mounted
    const controller = new AbortController();
    const timeoutId = timeoutManager.setTimeout(() => controller.abort(), 2000);
    
    const announcement = 'The warriors prepare to exchange battle cries...';
    actions.setCurrentAnnouncement(announcement);
    announceBattleCry();
    
    // Set fallback battle cries immediately
    const currentPlayer1 = player1;
    const currentPlayer2 = player2;
    
    actions.setBattleCries({
      player1: `${currentPlayer1.name}: I'll show you the power of ${currentPlayer1.personality || 'determination'}!`,
      player2: `${currentPlayer2.name}: Prepare yourself for ${currentPlayer2.personality || 'battle'}!`
    });
    
    // Try API if available, but don't crash if it fails
    try {
      const [cry1, cry2] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/battle-cry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character: currentPlayer1 }),
          signal: controller.signal
        }).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/battle-cry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character: currentPlayer2 }),
          signal: controller.signal
        }).catch(() => null)
      ]);

      timeoutManager.clearTimeout(timeoutId);

      if (cry1?.ok && cry2?.ok) {
        const data1 = await cry1.json().catch(() => null);
        const data2 = await cry2.json().catch(() => null);
        if (data1 && data2) {
          actions.setBattleCries({
            player1: data1.battleCry || `${currentPlayer1.name}: For glory!`,
            player2: data2.battleCry || `${currentPlayer2.name}: Victory will be mine!`
          });
        }
      }
    } catch (error) {
      console.warn('Battle cry API not available, using fallback cries');
      timeoutManager.clearTimeout(timeoutId);
    }
    
    return () => {
      controller.abort();
      timeoutManager.clearTimeout(timeoutId);
    };
  }, [state.player1, state.player2, actions, timeoutManager, announceBattleCry]);

  return {
    fetchBattleCries,
  };
};