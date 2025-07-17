import { useCallback, useRef } from 'react';
import { BattleEngine } from '@/systems/battleEngine';
import { PhysicalBattleEngine } from '@/systems/physicalBattleEngine';
import {
  BattleState,
  RoundResult,
  TeamCharacter,
  Team,
  BattleSetup
} from '@/data/teamBattleSystem';
import { BattlePhase, type BattleCharacter, type ExecutedAction, type PlannedAction } from '@/data/battleFlow';
import { type BattleStateData, type BattleStateAction } from '@/hooks/temp/useBattleState';
import {
  initializePsychologyState,
  updatePsychologyState,
  calculateDeviationRisk,
  rollForDeviation,
  calculateStabilityFactors,
  type PsychologyState,
  type DeviationEvent
} from '@/data/characterPsychology';
import { makeJudgeDecision, generateDeviationPrompt, judgePersonalities, type JudgeDecision } from '@/data/aiJudgeSystem';
import { AIJudge, RogueAction, CharacterResponseGenerator } from '@/data/aiJudge';
import { CoachingEngine, CoachingSession } from '@/data/coachingSystem';

interface UseBattleEngineLogicProps {
  state: BattleStateData;
  actions: any; // Using the full actions object from useBattleState
  timeoutManager: {
    setTimeout: (cb: () => void, delay: number) => any;
    clearTimeout: (id: any) => void;
  };
  speak: (text: string) => void;
  announceBattleStart: (team1: string, team2: string) => void;
  announceVictory: (team: string, isFlawless?: boolean) => void;
  announceDefeat: (team: string) => void;
  announceRoundStart: (round: number) => void;
  announceAction: (action: string, delay?: number) => void;
  announceMessage: (message: string, type: string) => void;
  conductTeamHuddle: () => void;
  convertToBattleCharacter: (char: TeamCharacter, morale: number) => BattleCharacter;
  checkForChaos: (attacker?: any, defender?: any, ability?: any, isP1First?: boolean) => any;
  executeCombatRound: () => void;
  calculateBattleRewards: (playerWon?: boolean, character?: any) => void;
  headquartersEffects: any;

  // Coaching System
  conductIndividualCoaching?: (character: any) => void;
  executeCoachingSession?: (focus: string) => void;
  handleStrategyRecommendation?: (type: 'attack' | 'defense' | 'special', strategy: string) => Promise<string>;
  getCharacterOpinion?: (type: string, strategy: string) => Promise<string>;
  insistOnStrategy?: (character: any, strategy: string) => void;
  checkForBerserk?: (character: any) => any;
  handleCharacterStrategyChange?: (characterId: string, category: 'attack' | 'defense' | 'special', strategy: string) => void;
  initializeCharacterStrategies?: () => void;
  areAllCharacterStrategiesComplete?: () => boolean;
  handleAllCharacterStrategiesComplete?: () => void;
  handleTeamChatMessage?: (message: any) => void;
  buildTeamFromCards?: (cards: any[], selectedCards: string[], setShow: (show: boolean) => void, setSelected: (cards: string[]) => void) => void;

  // Card Collection System
  initializeCardCollection?: () => void;
  handleCardSelect?: (card: any) => void;
  handleCardDeselect?: (card: any) => void;
  handleCardsReceived?: (cards: any[]) => void;
  handleCurrencySpent?: (amount: number) => void;

  // UI Presentation
  handleSelectChatCharacter?: (character: any) => void;
  getCurrentPlayerFighter?: () => any;
  getCurrentOpponentFighter?: () => any;
  calculateTeamPower?: (team: any) => number;
  handleTimerExpired?: () => void;
  showModal?: (modalType: string) => void;
  hideModal?: () => void;
  startTimer?: (duration: number) => void;
  stopTimer?: () => void;
  showBattleCries?: (cries: string[]) => void;
  transitionToPhase?: (phase: string, announcement?: string) => void;

  // Battle Simulation
  isOpponentAI?: boolean | (() => boolean);
  handleFastBattleRequest?: () => void;
  startFastBattle?: (battleSetup: any) => void;
  resolveFastBattle?: () => void;
  calculateFastBattleResult?: (battleSetup: any) => any;
}

export const useBattleEngineLogic = ({
  state,
  actions,
  timeoutManager,
  speak,
  announceBattleStart,
  announceVictory,
  announceDefeat,
  announceRoundStart,
  announceAction,
  announceMessage,
  conductTeamHuddle,
  convertToBattleCharacter,
  checkForChaos,
  executeCombatRound,
  calculateBattleRewards,
  headquartersEffects,
  // Optional new properties for now
  conductIndividualCoaching,
  executeCoachingSession,
  handleStrategyRecommendation,
  getCharacterOpinion,
  insistOnStrategy,
  checkForBerserk,
  handleCharacterStrategyChange,
  initializeCharacterStrategies,
  areAllCharacterStrategiesComplete,
  handleAllCharacterStrategiesComplete,
  handleTeamChatMessage,
  buildTeamFromCards,
  initializeCardCollection,
  handleCardSelect,
  handleCardDeselect,
  handleCardsReceived,
  handleCurrencySpent,
  handleSelectChatCharacter,
  getCurrentPlayerFighter,
  getCurrentOpponentFighter,
  calculateTeamPower,
  handleTimerExpired,
  showModal,
  hideModal,
  startTimer,
  stopTimer,
  showBattleCries,
  transitionToPhase,
  isOpponentAI,
  handleFastBattleRequest,
  startFastBattle,
  resolveFastBattle,
  calculateFastBattleResult
}: UseBattleEngineLogicProps) => {
  const { setTimeout: safeSetTimeout } = timeoutManager;

  // Refs to avoid stale closures
  const battleStateRef = useRef<BattleState | null>(null);
  const currentRoundRef = useRef(1);

  // Update refs when state changes
  battleStateRef.current = state.battleState;
  currentRoundRef.current = state.currentRound;

  const startTeamBattle = useCallback(() => {
    // Initialize character psychology for all fighters
    const psychologyMap = new Map<string, PsychologyState>();

    // Initialize player team psychology with headquarters effects and teammates
    state.playerTeam.characters.forEach(char => {
      psychologyMap.set(char.id, initializePsychologyState(char, headquartersEffects, state.playerTeam.characters));
    });

    // Initialize opponent team psychology (no headquarters effects)
    state.opponentTeam.characters.forEach(char => {
      psychologyMap.set(char.id, initializePsychologyState(char));
    });

    actions.setCharacterPsychology(psychologyMap);
    actions.setActiveDeviations([]);
    actions.setJudgeDecisions([]);

    // Randomly select a judge for this battle
    const randomJudge = judgePersonalities[Math.floor(Math.random() * judgePersonalities.length)];
    actions.setCurrentJudge(randomJudge);

    const setup: BattleSetup = {
      playerTeam: state.playerTeam,
      opponentTeam: state.opponentTeam,
      battleType: 'friendly',
      weightClass: 'amateur',
      stakes: 'normal'
    };

    const newBattleState: BattleState = {
      setup,
      currentRound: 1,
      phase: 'pre_battle',
      playerMorale: { currentMorale: state.playerMorale, moraleHistory: [] },
      opponentMorale: { currentMorale: state.opponentMorale, moraleHistory: [] },
      roundResults: [],
      currentFighters: {
        player: state.playerTeam.characters[0],
        opponent: state.opponentTeam.characters[0]
      }
    };

    actions.setBattleState(newBattleState);
    actions.setPhase('pre_battle_huddle');
    announceBattleStart(state.playerTeam.name, state.opponentTeam.name);
    actions.setCurrentAnnouncement(`🏆 3v3 TEAM BATTLE: ${state.playerTeam.name} vs ${state.opponentTeam.name}!
    Your lineup: ${state.playerTeam.characters.map(c => c.name).join(', ')}
    Opponents: ${state.opponentTeam.characters.map(c => c.name).join(', ')}`);

    timeoutManager.setTimeout(() => {
      conductTeamHuddle();
    }, 5000); // Extended to give more time to see team setup
  }, [state.playerTeam, state.opponentTeam, state.playerMorale, state.opponentMorale]);

  const executeTeamRound = useCallback(() => {
    if (!state.battleState) return;

    const playerFighter = state.battleState.currentFighters.player;
    const opponentFighter = state.battleState.currentFighters.opponent;

    // Check if player character will follow the gameplan using sophisticated psychology system
    const battlePlayerFighter = convertToBattleCharacter(playerFighter, state.playerMorale);
    const plannedAction: PlannedAction = {
      type: 'ability',
      actionType: 'ability',
      abilityId: playerFighter.abilities[0]?.name || 'basic_attack',
      targetId: opponentFighter.id,
      coachingInfluence: state.playerMorale / 100 // Convert morale to coaching influence
    };

    const adherenceCheck = PhysicalBattleEngine.performGameplanAdherenceCheck(battlePlayerFighter, plannedAction);

    let roundResult: RoundResult | null = null;

    if (adherenceCheck.checkResult === 'goes_rogue' || adherenceCheck.checkResult === 'improvises') {
      // Character goes rogue!
      const rogueAction = AIJudge.generateRogueAction(
        playerFighter,
        opponentFighter,
        state.playerMorale,
        state.playerMorale > state.opponentMorale ? 'winning' : 'losing'
      );

      const ruling = AIJudge.judgeRogueAction(rogueAction, opponentFighter, state.playerMorale);

      actions.setCurrentRogueAction(rogueAction);
      actions.setJudgeRuling(ruling);

      roundResult = {
        round: state.currentRound,
        attacker: playerFighter,
        defender: opponentFighter,
        attackerAction: 'rogue_action',
        damage: ruling.damage,
        wasStrategyAdherent: false,
        rogueDescription: rogueAction.description,
        moraleImpact: ruling.moraleChange,
        newAttackerHp: playerFighter.currentHp - (ruling.targetDamage || 0),
        newDefenderHp: opponentFighter.currentHp - ruling.damage,
        narrativeDescription: ruling.narrativeDescription
      };

      // Generate coaching response with psychology reasoning
      const coachResponse = AIJudge.generateCoachingResponse(rogueAction, ruling, state.playerTeam.coachName);
      actions.setCurrentAnnouncement(`${coachResponse}\n\n${ruling.narrativeDescription}`);

    } else {
      // Character follows the strategy
      const ability = playerFighter.abilities[Math.floor(Math.random() * playerFighter.abilities.length)];
      const baseAttack = playerFighter.attack + Math.random() * 10;
      const defense = opponentFighter.defense + Math.random() * 5;
      const damage = Math.max(1, Math.floor(baseAttack - defense));

      roundResult = {
        round: state.currentRound,
        attacker: playerFighter,
        defender: opponentFighter,
        attackerAction: ability.name,
        damage: damage,
        wasStrategyAdherent: true,
        moraleImpact: 0,
        newAttackerHp: playerFighter.currentHp,
        newDefenderHp: opponentFighter.currentHp - damage,
        narrativeDescription: `${playerFighter.name} uses ${ability.name} for ${damage} damage!`
      };

      actions.setCurrentAnnouncement(roundResult.narrativeDescription);
    }

    // Update battle state with round results
    const updatedBattleState = {
      ...state.battleState,
      roundResults: [...state.battleState.roundResults, roundResult],
      currentRound: state.currentRound + 1
    };

    actions.setBattleState(updatedBattleState);
    actions.setCurrentRound(state.currentRound + 1);

    // Check if battle is over
    if (roundResult && roundResult.newDefenderHp <= 0) {
      endBattle('player');
    } else if (state.currentRound >= 10) {
      endBattle('draw');
    } else {
      // Continue to next round
      timeoutManager.setTimeout(() => {
        executeTeamRound();
      }, 3000);
    }
  }, [state.battleState, state.currentRound, state.playerTeam, state.opponentTeam, state.playerMorale, state.opponentMorale]);

  const endBattle = useCallback((winner: 'player' | 'opponent' | 'draw') => {
    actions.setPhase('battle_complete');

    let endMessage = '';
    if (winner === 'player') {
      endMessage = `Victory! ${state.playerTeam.name} has triumphed through teamwork and strategy!`;
      announceVictory(state.playerTeam.name, state.playerMorale > 90);
    } else if (winner === 'opponent') {
      endMessage = `Defeat! ${state.opponentTeam.name} has proven superior this day.`;
      announceDefeat(state.playerTeam.name);
    } else {
      endMessage = 'The battle ends in a dramatic draw! Both teams showed incredible heart!';
    }

    actions.setCurrentAnnouncement(endMessage);

    // Show post-battle team chemistry effects
    timeoutManager.setTimeout(() => {
      const newChemistry = Math.max(0, Math.min(100, state.playerTeam.teamChemistry + (winner === 'player' ? 10 : -5)));
      actions.setPlayerTeam({ ...state.playerTeam, teamChemistry: newChemistry });

      const chemistryUpdate = `Post-battle team chemistry: ${Math.round(newChemistry * 10) / 10}% ${newChemistry > state.playerTeam.teamChemistry ? '(+)' : '(-)'}}`;
      actions.setCurrentAnnouncement(chemistryUpdate);
    }, 3000);
  }, [state.playerTeam, state.opponentTeam, state.playerMorale]);

  const proceedToRoundCombat = useCallback(() => {
    actions.setPhase('combat');
    actions.setTimer(null);
    actions.setIsTimerActive(false);
    const announcement = `Round ${state.currentRound} begins! The warriors clash in epic combat!`;
    actions.setCurrentAnnouncement(announcement);
    announceRoundStart(state.currentRound);

    // Execute combat after a brief delay
    timeoutManager.setTimeout(() => {
      executeCombatRound();
    }, 3000);
  }, [state.currentRound]);

  const handleRoundEnd = useCallback((data: any) => {
    // Handle round end data from WebSocket
    if (data.winner) {
      endBattle(data.winner);
    } else {
      // Continue to next round
      actions.setCurrentRound(state.currentRound + 1);
      proceedToRoundCombat();
    }
  }, [state.currentRound]);

  const calculateBattleOutcome = useCallback((playerTeam: Team, opponentTeam: Team) => {
    const playerHP = playerTeam.characters.reduce((sum, char) => sum + char.currentHp, 0);
    const opponentHP = opponentTeam.characters.reduce((sum, char) => sum + char.currentHp, 0);

    if (playerHP <= 0 && opponentHP <= 0) {
      return 'draw';
    } else if (playerHP <= 0) {
      return 'opponent';
    } else if (opponentHP <= 0) {
      return 'player';
    } else {
      // If both teams have HP, determine winner by remaining HP percentage
      const playerHealthPercent = playerHP / playerTeam.characters.reduce((sum, char) => sum + char.maxHp, 0);
      const opponentHealthPercent = opponentHP / opponentTeam.characters.reduce((sum, char) => sum + char.maxHp, 0);

      if (playerHealthPercent > opponentHealthPercent) {
        return 'player';
      } else if (opponentHealthPercent > playerHealthPercent) {
        return 'opponent';
      } else {
        return 'draw';
      }
    }
  }, []);

  const resetBattle = useCallback(() => {
    actions.setBattleState(null);
    actions.setCurrentRound(1);
    actions.setCurrentMatch(1);
    actions.setPlayerMorale(75);
    actions.setOpponentMorale(75);
    actions.setPlayerMatchWins(0);
    actions.setOpponentMatchWins(0);
    actions.setPlayerRoundWins(0);
    actions.setOpponentRoundWins(0);
    actions.setPhase('pre_battle_huddle');
    actions.setCurrentAnnouncement('Welcome to the Arena! Choose your opponent to begin battle!');
  }, []);

  return {
    startTeamBattle,
    executeTeamRound,
    endBattle,
    proceedToRoundCombat,
    handleRoundEnd,
    calculateBattleOutcome,
    resetBattle,
    isInBattle: state.battleState !== null,
    canStartBattle: state.phase === 'pre_battle_huddle' && state.selectedOpponent !== null
  };
};
