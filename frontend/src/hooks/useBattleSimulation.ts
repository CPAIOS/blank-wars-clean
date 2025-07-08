import { useCallback } from 'react';
import { TeamCharacter, Team, BattleSetup } from '@/data/teamBattleSystem';
import { type BattleStateData } from '@/hooks/temp/useBattleState';
import { combatRewards } from '@/data/combatRewards';

interface UseBattleSimulationProps {
  state: BattleStateData;
  actions: {
    setCurrentAnnouncement: (announcement: string) => void;
    setPhase: (phase: string) => void;
    setCurrentMatch: (match: number | ((prev: number) => number)) => void;
    setCurrentRound: (round: number | ((prev: number) => number)) => void;
    setPlayerMatchWins: (wins: number) => void;
    setOpponentMatchWins: (wins: number) => void;
    setPlayerRoundWins: (wins: number) => void;
    setOpponentRoundWins: (wins: number) => void;
    setBattleState: (state: any) => void;
    announceMessage: (message: string, type?: string) => void;
    checkForChaos: (attacker: TeamCharacter, defender: TeamCharacter, ability: any, isAttacker1: boolean) => any;
    calculateTeamPower: (teamCharacters: TeamCharacter[]) => number;
    setSelectedStrategies?: (strategies: any) => void;
    setCoachingMessages?: (messages: string[]) => void;
    setTimer?: (time: number | null) => void;
    setIsTimerActive?: (active: boolean) => void;
    setIsFastBattleMode: (mode: boolean) => void;
    setFastBattleConsent: (consent: any) => void;
    setPlayer1: (player: any) => void;
    setPlayer2: (player: any) => void;
    setBattleRewards: (rewards: any) => void;
  };
  timeoutManager: {
    setTimeout: (cb: () => void, delay: number) => any;
    clearTimeout: (id: any) => void;
  };
  calculateBattleRewards: (playerWon: boolean, character: TeamCharacter) => void;
  announceAction: (text: string, delay?: number) => void;
}

export const useBattleSimulation = ({ 
  state, 
  actions, 
  timeoutManager,
  calculateBattleRewards,
  announceAction
}: UseBattleSimulationProps) => {

  // Core battle combat round execution
  const executeCombatRound = useCallback(() => {
    const { 
      player1, 
      player2, 
      currentRound, 
      currentMatch, 
      playerMatchWins, 
      opponentMatchWins, 
      playerRoundWins, 
      opponentRoundWins,
      playerTeam,
      opponentTeam,
      battleState
    } = state;

    // Determine turn order based on speed
    const p1Speed = player1.traditionalStats.speed + Math.random() * 20;
    const p2Speed = player2.traditionalStats.speed + Math.random() * 20;
    
    const firstAttacker = p1Speed >= p2Speed ? player1 : player2;
    const secondAttacker = p1Speed >= p2Speed ? player2 : player1;
    const isP1First = p1Speed >= p2Speed;
    
    // First attack
    const ability1 = firstAttacker.abilities[Math.floor(Math.random() * firstAttacker.abilities.length)];
    const action1 = actions.checkForChaos(firstAttacker, secondAttacker, ability1, isP1First);
    
    actions.setCurrentAnnouncement(action1.description);
    announceAction(action1.description, 500);
    
    // Check if battle is over using the returned HP value
    if (action1.newDefenderHP !== undefined && action1.newDefenderHP <= 0) {
      timeoutManager.setTimeout(() => {
        // Calculate battle rewards
        calculateBattleRewards(firstAttacker.name === player1.name, secondAttacker.name === player1.name ? player1 : player2);
        actions.setPhase('battle_complete');
        const victoryMessage = `Victory! ${firstAttacker.name} has defeated ${secondAttacker.name}!`;
        actions.setCurrentAnnouncement(victoryMessage);
        actions.announceMessage(victoryMessage, 'victory');
      }, 3000);
      return;
    }
    
    // Second attack (if still alive)
    timeoutManager.setTimeout(() => {
      const ability2 = secondAttacker.abilities[Math.floor(Math.random() * secondAttacker.abilities.length)];
      const action2 = actions.checkForChaos(secondAttacker, firstAttacker, ability2, !isP1First);
      
      actions.setCurrentAnnouncement(action2.description);
      announceAction(action2.description, 500);
      
      // Check if character dies - Death ends the MATCH immediately
      if (action2.newDefenderHP !== undefined && action2.newDefenderHP <= 0) {
        timeoutManager.setTimeout(() => {
          // Determine match winner (survivor wins the match)
          const matchWinner = secondAttacker.name === player1.name ? 'player' : 'opponent';
          const newPlayerMatchWins = matchWinner === 'player' ? playerMatchWins + 1 : playerMatchWins;
          const newOpponentMatchWins = matchWinner === 'opponent' ? opponentMatchWins + 1 : opponentMatchWins;
          
          // Update match wins
          if (matchWinner === 'player') {
            actions.setPlayerMatchWins(newPlayerMatchWins);
          } else {
            actions.setOpponentMatchWins(newOpponentMatchWins);
          }
          
          const victoryMessage = `${secondAttacker.name} kills ${firstAttacker.name}! Match ${currentMatch} goes to ${matchWinner === 'player' ? 'Player' : 'Opponent'}!`;
          actions.setCurrentAnnouncement(victoryMessage);
          actions.announceMessage(victoryMessage, 'victory');
          
          // Check if battle is over (2 out of 3 matches)
          if (newPlayerMatchWins >= 2) {
            calculateBattleRewards(true, secondAttacker.name === player1.name ? player1 : player2);
            actions.setPhase('battle_complete');
            actions.setCurrentAnnouncement(`VICTORY! Player wins the battle ${newPlayerMatchWins}-${newOpponentMatchWins}!`);
          } else if (newOpponentMatchWins >= 2) {
            calculateBattleRewards(false, secondAttacker.name === player1.name ? player1 : player2);
            actions.setPhase('battle_complete');
            actions.setCurrentAnnouncement(`DEFEAT! Opponent wins the battle ${newOpponentMatchWins}-${newPlayerMatchWins}!`);
          } else {
            // Start next match - reset round tracking, move to next match
            actions.setCurrentMatch(prev => prev + 1);
            actions.setCurrentRound(1);
            actions.setPlayerRoundWins(0);
            actions.setOpponentRoundWins(0);
            actions.setPhase('pre_battle_huddle');
            actions.setCurrentAnnouncement(`Match ${currentMatch + 1} begins! Choose your strategy for the next fighters.`);
          }
        }, 3000);
        return;
      }
      
      // Round end (no death) - determine winner by HP comparison
      timeoutManager.setTimeout(() => {
        actions.setPhase('coaching_timeout');
        
        // Determine round winner based on remaining HP
        const roundWinner = player1.currentHp > player2.currentHp ? 'player' : player1.currentHp < player2.currentHp ? 'opponent' : 'tie';
        const roundWinnerName = player1.currentHp > player2.currentHp ? player1.name : player1.currentHp < player2.currentHp ? player2.name : 'Tie';
        
        // Calculate new round wins immediately
        const newPlayerRoundWins = roundWinner === 'player' ? playerRoundWins + 1 : playerRoundWins;
        const newOpponentRoundWins = roundWinner === 'opponent' ? opponentRoundWins + 1 : opponentRoundWins;
        
        // Update round wins state
        if (roundWinner === 'player') {
          actions.setPlayerRoundWins(newPlayerRoundWins);
        } else if (roundWinner === 'opponent') {
          actions.setOpponentRoundWins(newOpponentRoundWins);
        }
        // If tie, no round wins are awarded
        
        const roundResultText = roundWinner === 'tie' ? `Round ${currentRound} ends in a tie!` : `Round ${currentRound} complete! ${roundWinnerName} wins this round!`;
        actions.setCurrentAnnouncement(`${roundResultText} (Match ${currentMatch}: Player ${newPlayerRoundWins}-${newOpponentRoundWins} Opponent)`);
        
        timeoutManager.setTimeout(() => {
          // Check for 2-out-of-3 round victory (wins current match)
          if (newPlayerRoundWins >= 2) {
            // Player wins this match
            const newPlayerMatchWins = playerMatchWins + 1;
            actions.setPlayerMatchWins(newPlayerMatchWins);
            
            if (newPlayerMatchWins >= 2) {
              // Player wins entire battle
              calculateBattleRewards(true, player1);
              actions.setPhase('battle_complete');
              actions.setCurrentAnnouncement(`VICTORY! Player wins the battle ${newPlayerMatchWins}-${opponentMatchWins}!`);
            } else {
              // Start next match
              actions.setCurrentMatch(prev => prev + 1);
              actions.setCurrentRound(1);
              actions.setPlayerRoundWins(0);
              actions.setOpponentRoundWins(0);
              actions.setPhase('pre_battle_huddle');
              actions.setCurrentAnnouncement(`Player wins Match ${currentMatch}! Match ${currentMatch + 1} begins - choose your strategy.`);
            }
          } else if (newOpponentRoundWins >= 2) {
            // Opponent wins this match
            const newOpponentMatchWins = opponentMatchWins + 1;
            actions.setOpponentMatchWins(newOpponentMatchWins);
            
            if (newOpponentMatchWins >= 2) {
              // Opponent wins entire battle
              calculateBattleRewards(false, player2);
              actions.setPhase('battle_complete');
              actions.setCurrentAnnouncement(`DEFEAT! Opponent wins the battle ${newOpponentMatchWins}-${playerMatchWins}!`);
            } else {
              // Start next match
              actions.setCurrentMatch(prev => prev + 1);
              actions.setCurrentRound(1);
              actions.setPlayerRoundWins(0);
              actions.setOpponentRoundWins(0);
              actions.setPhase('pre_battle_huddle');
              actions.setCurrentAnnouncement(`Opponent wins Match ${currentMatch}! Match ${currentMatch + 1} begins - choose your strategy.`);
            }
          } else {
            // Next round - coaching phase
            actions.setCurrentRound(prev => {
              const newRound = prev + 1;
              // Update battle state with new fighters for team battle
              if (battleState) {
                const nextPlayerIndex = (newRound - 1) % playerTeam.characters.length;
                const nextOpponentIndex = (newRound - 1) % opponentTeam.characters.length;
                
                actions.setBattleState((prevState: any) => {
                  if (!prevState) return null;
                  return {
                    ...prevState,
                    currentRound: newRound,
                    currentFighters: {
                      player: playerTeam.characters[nextPlayerIndex],
                      opponent: opponentTeam.characters[nextOpponentIndex]
                    }
                  };
                });
              }
              return newRound;
            });
            
            actions.setPhase('pre_battle_huddle');
            actions.setCurrentAnnouncement(`Round ${currentRound + 1} Strategy Selection - Choose your warrior's approach for this round.`);
            
            // Optional strategy/timer setters
            if (actions.setCoachingMessages) {
              actions.setCoachingMessages([`Round ${currentRound + 1} Preparation - Choose one strategy from each category!`]);
            }
            if (actions.setSelectedStrategies) {
              actions.setSelectedStrategies({ attack: null, defense: null, special: null });
            }
            if (actions.setTimer) {
              actions.setTimer(60); // Consistent 60 second timer
            }
            if (actions.setIsTimerActive) {
              actions.setIsTimerActive(true);
            }
          }
        }, 4000);
      }, 3000);
    }, 4000);
  }, [
    state,
    actions,
    timeoutManager,
    calculateBattleRewards,
    announceAction
  ]);

  // Fast Battle System - instant battle resolution for PvC mode
  const isOpponentAI = useCallback(() => {
    // Check if opponent is AI-controlled (PvC) or human player (PvP)
    // For now, all opponents are AI-controlled (PvC mode)
    // TODO: Add PvP detection when multiplayer system is implemented
    return true;
  }, []);

  const calculateFastBattleResult = useCallback((battleSetup: BattleSetup) => {
    const { player1, player2 } = state;
    
    // Simplified battle calculation for fast mode
    const playerPower = actions.calculateTeamPower(battleSetup.playerTeam.characters);
    const opponentPower = actions.calculateTeamPower(battleSetup.opponentTeam.characters);
    
    // Add some randomness (±20%)
    const randomFactor = 0.8 + Math.random() * 0.4;
    const adjustedPlayerPower = playerPower * randomFactor;
    
    const winner = adjustedPlayerPower > opponentPower ? 'player' : 'opponent';
    
    // Calculate damage and final stats
    const damageTaken = Math.floor(Math.random() * 300) + 100;
    const finalPlayerStats = winner === 'player' ? 
      { ...player1, currentHp: Math.max(1, player1.currentHp - damageTaken * 0.3) } :
      { ...player1, currentHp: Math.max(1, player1.currentHp - damageTaken) };
    
    const finalOpponentStats = winner === 'opponent' ?
      { ...player2, currentHp: Math.max(1, player2.currentHp - damageTaken * 0.3) } :
      { ...player2, currentHp: Math.max(1, player2.currentHp - damageTaken) };

    return {
      winner,
      finalBattleState: battleSetup,
      finalPlayerStats,
      finalOpponentStats,
      playerRewards: winner === 'player' ? combatRewards.victory : combatRewards.defeat
    };
  }, [state, actions]);

  const resolveFastBattle = useCallback((battleSetup: BattleSetup) => {
    const { playerTeam, opponentTeam } = state;
    
    actions.setCurrentAnnouncement('⚡ Fast Battle Mode Activated! Calculating results...');
    
    // Simulate entire battle with AI strategies
    const battleResult = calculateFastBattleResult(battleSetup);
    
    // Apply results instantly
    timeoutManager.setTimeout(() => {
      actions.setBattleState(battleResult.finalBattleState);
      actions.setPlayer1(battleResult.finalPlayerStats);
      actions.setPlayer2(battleResult.finalOpponentStats);
      actions.setPhase('battle-end');
      
      // Show results
      const winnerName = battleResult.winner === 'player' ? playerTeam.name : opponentTeam.name;
      actions.setCurrentAnnouncement(`⚡ Fast Battle Complete! ${winnerName} Wins!`);
      
      // Apply rewards
      if (battleResult.winner === 'player') {
        actions.setBattleRewards(battleResult.playerRewards);
      }
    }, 2000);
  }, [state, actions, timeoutManager, calculateFastBattleResult]);

  const startFastBattle = useCallback(() => {
    const { playerTeam, opponentTeam, playerMorale, opponentMorale } = state;
    
    actions.setIsFastBattleMode(true);
    
    // Skip strategy selection and use AI defaults
    const fastBattleSetup: BattleSetup = {
      playerTeam,
      opponentTeam,
      playerMorale: { currentMorale: playerMorale, moraleHistory: [] },
      opponentMorale: { currentMorale: opponentMorale, moraleHistory: [] },
      roundResults: [],
      currentFighters: {
        player: playerTeam.characters[0],
        opponent: opponentTeam.characters[0]
      }
    };

    actions.setBattleState(fastBattleSetup);
    
    // Instantly resolve battle
    resolveFastBattle(fastBattleSetup);
  }, [state, actions, resolveFastBattle]);

  const handleFastBattleRequest = useCallback(() => {
    if (isOpponentAI()) {
      // PvC: Instantly start fast battle
      startFastBattle();
    } else {
      // PvP: Request consent from both players
      actions.setFastBattleConsent((prev: any) => ({
        ...prev,
        player1: true
      }));
      // In real implementation, send request to opponent via WebSocket
    }
  }, [isOpponentAI, startFastBattle]);

  return {
    executeCombatRound,
    // Fast Battle System
    isOpponentAI,
    handleFastBattleRequest,
    startFastBattle,
    resolveFastBattle,
    calculateFastBattleResult,
  };
};