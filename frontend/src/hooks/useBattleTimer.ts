import { useCallback, useRef } from 'react';
import { type BattleStateData } from '@/hooks/temp/useBattleState';
import { TeamCharacter } from '@/data/teamBattleSystem';

interface UseBattleTimerProps {
  state: BattleStateData;
  actions: {
    setIsTimerActive: (active: boolean) => void;
    setSelectedStrategies: (strategies: any) => void;
    setCoachingMessages: (messages: string[]) => void;
  };
  timeoutManager: {
    setTimeout: (cb: () => void, delay: number) => any;
    clearTimeout: (id: any) => void;
  };
  proceedToRoundCombat: () => void;
}

export const useBattleTimer = ({ 
  state, 
  actions,
  timeoutManager,
  proceedToRoundCombat
}: UseBattleTimerProps) => {

  // Handle timer expiration - auto-select strategies or proceed
  const handleTimerExpired = useCallback(() => {
    const { phase, selectedStrategies, player1 } = state;
    
    // Auto-select random strategies when timer expires or proceed with current selections
    actions.setIsTimerActive(false);
    if (phase === 'strategy-selection') {
      const finalStrategies = { ...selectedStrategies };
      
      // Auto-select missing strategies (AI chooses)
      if (!finalStrategies.attack) {
        const attackOptions = player1.abilities?.filter((a: any) => a.type === 'attack') || [];
        if (attackOptions.length > 0) {
          finalStrategies.attack = attackOptions[Math.floor(Math.random() * attackOptions.length)].name;
        } else {
          finalStrategies.attack = 'Basic Attack';
        }
      }
      if (!finalStrategies.defense) {
        const defenseOptions = player1.abilities?.filter((a: any) => a.type === 'defense') || [];
        if (defenseOptions.length > 0) {
          finalStrategies.defense = defenseOptions[Math.floor(Math.random() * defenseOptions.length)].name;
        } else {
          finalStrategies.defense = 'Basic Defense';
        }
      }
      if (!finalStrategies.special) {
        const specialOptions = player1.specialPowers || [];
        if (specialOptions.length > 0) {
          finalStrategies.special = specialOptions[Math.floor(Math.random() * specialOptions.length)].name;
        } else {
          finalStrategies.special = 'Focus';
        }
      }
      
      actions.setSelectedStrategies(finalStrategies);
      
      const missingSome = !selectedStrategies.attack || !selectedStrategies.defense || !selectedStrategies.special;
      if (missingSome) {
        actions.setCoachingMessages((prev: string[]) => [...prev, 'Time\'s up! Your warrior chooses their own strategy for missing categories!']);
      } else {
        actions.setCoachingMessages((prev: string[]) => [...prev, 'Time\'s up! Moving to combat with selected strategies!']);
      }
      
      timeoutManager.setTimeout(() => {
        proceedToRoundCombat();
      }, 2000);
    }
  }, [state, actions, timeoutManager, proceedToRoundCombat]);

  return {
    handleTimerExpired,
  };
};