import { useCallback, useEffect, useState } from 'react';
import { 
  initializePsychologyState, 
  updatePsychologyState, 
  calculateDeviationRisk, 
  rollForDeviation,
  calculateStabilityFactors,
  type PsychologyState,
  type DeviationEvent
} from '@/data/characterPsychology';
import { makeJudgeDecision, generateDeviationPrompt, type JudgeDecision } from '@/data/aiJudgeSystem';
import { type RogueAction } from '@/data/aiJudge';
import { type BattleStateData } from '@/hooks/temp/useBattleState';
import { TeamCharacter } from '@/data/teamBattleSystem';
import { coachProgressionAPI, type CoachBonuses } from '@/services/coachProgressionAPI';

// Types for the psychology system
type Ability = {
  name: string;
  type: 'attack' | 'defense' | 'special';
  power?: number;
  cooldown?: number;
  description?: string;
};

interface UsePsychologySystemProps {
  state: BattleStateData;
  actions: any; // Full actions object from useBattleState
  timeoutManager: {
    setTimeout: (cb: () => void, delay: number) => any;
    clearTimeout: (id: any) => void;
  };
  speak: (text: string) => void;
  executeAbility: (attacker: TeamCharacter, defender: TeamCharacter, ability: Ability, isAttacker1: boolean) => any;
  headquartersEffects?: any;
}

export const usePsychologySystem = ({ 
  state, 
  actions, 
  timeoutManager, 
  speak,
  executeAbility,
  headquartersEffects
}: UsePsychologySystemProps) => {
  const { setTimeout: safeSetTimeout } = timeoutManager;
  const [coachBonuses, setCoachBonuses] = useState<CoachBonuses | null>(null);

  // Fetch coach bonuses on mount
  useEffect(() => {
    const fetchCoachBonuses = async () => {
      try {
        const response = await coachProgressionAPI.getCoachProgression();
        setCoachBonuses(response.bonuses);
      } catch (error) {
        console.error('Failed to fetch coach bonuses:', error);
        // Use default bonuses if API fails
        setCoachBonuses({
          gameplanAdherenceBonus: 0,
          deviationRiskReduction: 0,
          teamChemistryBonus: 0,
          battleXPMultiplier: 1,
          characterDevelopmentMultiplier: 1
        });
      }
    };
    
    fetchCoachBonuses();
  }, []);

  // Main chaos check function - extracted from component
  const checkForChaos = useCallback((attacker: TeamCharacter, defender: TeamCharacter, ability: Ability, isAttacker1: boolean) => {
    // Get character's current psychology state
    const psychState = state.characterPsychology.get(attacker.id);
    if (!psychState) {
      // No psychology state, execute normally
      return executeAbility(attacker, defender, ability, isAttacker1);
    }
    
    // Calculate battle context for deviation risk
    const battleContext = {
      recentDamage: Math.max(0, attacker.maxHp - attacker.currentHp),
      teamPerformance: isAttacker1 ? state.playerMorale : state.opponentMorale,
      strategySuccessRate: 75, // TODO: Track actual strategy success
      opponentLevelDifference: defender.level - attacker.level,
      roundsWon: isAttacker1 ? state.playerRoundWins : state.opponentRoundWins,
      roundsLost: isAttacker1 ? state.opponentRoundWins : state.playerRoundWins
    };
    
    // Update psychology based on current state
    const factors = calculateStabilityFactors(
      attacker, // attacker is already a TeamCharacter
      battleContext
    );
    
    // Update psychology state
    const updatedPsychState = updatePsychologyState(psychState, factors);
    const newPsychMap = new Map(state.characterPsychology);
    newPsychMap.set(attacker.id, updatedPsychState);
    actions.setCharacterPsychology(newPsychMap);
    
    // Calculate deviation risk with teammates and coach bonuses
    const attackerTeammates = isAttacker1 ? state.playerTeam.characters : state.opponentTeam.characters;
    const deviationRisk = calculateDeviationRisk(
      attacker, // attacker is already a TeamCharacter
      updatedPsychState,
      factors,
      attackerTeammates,
      coachBonuses || undefined
    );
    
    // Roll for deviation
    const deviation = rollForDeviation(deviationRisk);
    
    // Award gameplan adherence XP based on adherence success/failure
    const adherenceRate = deviation ? 0 : 100; // 0% if deviated, 100% if followed plan
    const deviationsBlocked = deviation ? 0 : 1; // 1 deviation blocked if no deviation occurred
    const deviationSeverity = deviation?.severity || 'minor';
    
    // Award XP for psychology management (async, don't block battle)
    if (state.battleId) {
      coachProgressionAPI.awardGameplanAdherenceXP(
        adherenceRate,
        deviationsBlocked,
        deviationSeverity as 'minor' | 'moderate' | 'major' | 'extreme',
        state.battleId
      ).catch(error => console.error('Failed to award gameplan adherence XP:', error));
    }
    
    if (deviation) {
      // Character goes rogue! Handle the chaos
      return handleCharacterDeviation(deviation, attacker, defender, ability, isAttacker1);
    } else {
      // Normal execution
      return executeAbility(attacker, defender, ability, isAttacker1);
    }
  }, [state.characterPsychology, state.playerMorale, state.opponentMorale, state.playerRoundWins, state.opponentRoundWins, state.playerTeam.characters, state.opponentTeam.characters, coachBonuses]);

  // Handle character deviation - extracted from component
  const handleCharacterDeviation = useCallback((
    deviation: DeviationEvent,
    attacker: TeamCharacter,
    defender: TeamCharacter,
    ability: Ability,
    isAttacker1: boolean
  ) => {
    // Add to active deviations
    actions.setActiveDeviations([...state.activeDeviations, deviation]);
    
    // Get judge decision
    const judgeDecision = makeJudgeDecision(
      deviation,
      attacker, // attacker is already a TeamCharacter
      {
        currentRound: state.currentRound,
        opponentCharacter: defender, // defender is already a TeamCharacter
        arenaCondition: 'pristine' // TODO: Track arena damage
      },
      state.currentJudge
    );
    
    // Add judge decision
    actions.setJudgeDecisions([...state.judgeDecisions, judgeDecision]);
    
    // Apply the judge's mechanical effect
    return applyChaosEffect(judgeDecision, attacker, defender, ability, isAttacker1);
  }, [state.activeDeviations, state.currentRound, state.currentJudge, state.judgeDecisions]);

  // Apply chaos effects - extracted from component
  const applyChaosEffect = useCallback((    
    judgeDecision: JudgeDecision,
    attacker: TeamCharacter,
    defender: TeamCharacter,
    ability: Ability,
    isAttacker1: boolean
  ) => {
    const effect = judgeDecision.mechanicalEffect;
    
    switch (effect.type) {
      case 'damage':
        if (effect.target === 'self') {
          const newAttackerHP = Math.max(0, attacker.currentHp - (effect.amount || 20));
          if (isAttacker1) {
            actions.setPlayer1(prev => ({ ...prev, hp: newAttackerHP }));
          } else {
            actions.setPlayer2(prev => ({ ...prev, hp: newAttackerHP }));
          }
          return {
            description: `${judgeDecision.narrative} - ${attacker.name} takes ${effect.amount} chaos damage!`,
            newAttackerHP,
            newDefenderHP: defender.currentHp,
            chaosEvent: true
          };
        } else if (effect.target === 'opponent') {
          const newDefenderHP = Math.max(0, defender.currentHp - (effect.amount || 20));
          if (isAttacker1) {
            actions.setPlayer2(prev => ({ ...prev, hp: newDefenderHP }));
          } else {
            actions.setPlayer1(prev => ({ ...prev, hp: newDefenderHP }));
          }
          return {
            description: `${judgeDecision.narrative} - ${defender.name} takes ${effect.amount} chaos damage!`,
            newAttackerHP: attacker.currentHp,
            newDefenderHP,
            chaosEvent: true
          };
        }
        break;
        
      case 'skip_turn':
        return {
          description: `${judgeDecision.narrative} - ${attacker.name} forfeits their turn!`,
          newAttackerHP: attacker.currentHp,
          newDefenderHP: defender.currentHp,
          chaosEvent: true
        };
        
      case 'redirect_attack':
        if (effect.target === 'teammate') {
          // Attack teammate instead - for now, just apply damage to attacker as friendly fire
          const friendlyFireDamage = (effect.amount || 15);
          const newAttackerHP = Math.max(0, attacker.currentHp - friendlyFireDamage);
          if (isAttacker1) {
            actions.setPlayer1(prev => ({ ...prev, hp: newAttackerHP }));
          } else {
            actions.setPlayer2(prev => ({ ...prev, hp: newAttackerHP }));
          }
          return {
            description: `${judgeDecision.narrative} - Friendly fire deals ${friendlyFireDamage} damage to ${attacker.name}!`,
            newAttackerHP,
            newDefenderHP: defender.currentHp,
            chaosEvent: true
          };
        }
        break;
        
      default:
        // Default chaos - execute normal ability but with chaos flavor
        const normalResult = executeAbility(attacker, defender, ability, isAttacker1);
        return {
          ...normalResult,
          description: `${judgeDecision.narrative} - ${normalResult.description}`,
          chaosEvent: true
        };
    }
    
    // Fallback to normal execution
    const normalResult = executeAbility(attacker, defender, ability, isAttacker1);
    return {
      ...normalResult,
      description: `${judgeDecision.narrative} - ${normalResult.description}`,
      chaosEvent: true
    };
  }, []);

  // Initialize psychology states for all characters
  const initializePsychologyStates = useCallback(() => {
    const newPsychStates = new Map<string, PsychologyState>();
    const allCharacters = [...state.playerTeam.characters, ...state.opponentTeam.characters];
    
    allCharacters.forEach(char => {
      if (!state.characterPsychology.has(char.id)) {
        newPsychStates.set(char.id, initializePsychologyState(char, headquartersEffects, allCharacters));
      } else {
        newPsychStates.set(char.id, state.characterPsychology.get(char.id)!);
      }
    });
    
    if (newPsychStates.size > 0) {
      actions.setCharacterPsychology(newPsychStates);
    }
  }, [state.playerTeam, state.opponentTeam, headquartersEffects]);

  // Auto-initialize when teams change
  useEffect(() => {
    initializePsychologyStates();
  }, [initializePsychologyStates]);

  // Process psychological effects during battle
  const processPsychologicalEffects = useCallback(async (character: TeamCharacter, battleContext: {
    roundNumber: number;
    isWinning: boolean;
    teamMorale: number;
    opponentMorale: number;
  }) => {
    const currentPsychState = state.characterPsychology.get(character.id);
    if (!currentPsychState) return;

    try {
      // Calculate deviation risk
      const deviationRisk = calculateDeviationRisk(
        currentPsychState,
        battleContext.roundNumber,
        battleContext.teamMorale,
        character
      );

      // Roll for potential deviation
      const deviationResult = rollForDeviation(
        currentPsychState,
        deviationRisk,
        battleContext.roundNumber
      );

      if (deviationResult.hasDeviation && deviationResult.deviation) {
        // Add new deviation
        const newDeviations = [...state.activeDeviations, deviationResult.deviation];
        actions.setActiveDeviations(newDeviations);

        // Announce the deviation
        const deviationText = generateDeviationPrompt(deviationResult.deviation, character);
        actions.setCurrentAnnouncement(deviationText);
        speak(deviationText);

        // Trigger judge decision if needed
        if (deviationResult.deviation.severity === 'major') {
          await processJudgeDecision(character, deviationResult.deviation);
        }
      }

      // Update psychology state based on battle events
      const updatedPsychState = updatePsychologyState(
        currentPsychState,
        battleContext.isWinning ? 'victory' : 'defeat',
        {
          roundNumber: battleContext.roundNumber,
          teamMorale: battleContext.teamMorale,
          stressLevel: deviationRisk
        }
      );

      // Update the psychology map
      const updatedPsychMap = new Map(state.characterPsychology);
      updatedPsychMap.set(character.id, updatedPsychState);
      actions.setCharacterPsychology(updatedPsychMap);

    } catch (error) {
      console.error('Error processing psychological effects for', character.name, ':', error);
    }
  }, [state.activeDeviations]);

  // Process judge decision for severe deviations
  const processJudgeDecision = useCallback(async (character: TeamCharacter, deviation: DeviationEvent) => {
    try {
      const judgeDecision = await makeJudgeDecision(
        state.currentJudge,
        character,
        deviation,
        state.currentRound,
        {
          playerMorale: state.playerMorale,
          opponentMorale: state.opponentMorale,
          recentDeviations: state.activeDeviations.slice(-3) // Last 3 deviations for context
        }
      );

      // Add judge decision to history
      const newJudgeDecisions = [...state.judgeDecisions, judgeDecision];
      actions.setJudgeDecisions(newJudgeDecisions);

      // Announce judge ruling
      const rulingText = `Judge ${state.currentJudge.name} rules: ${judgeDecision.ruling}. ${judgeDecision.explanation}`;
      actions.setCurrentAnnouncement(rulingText);
      speak(rulingText);

      // Apply penalties if any
      if (judgeDecision.penalty) {
        await applyJudgePenalty(character, judgeDecision.penalty);
      }

    } catch (error) {
      console.error('Error processing judge decision:', error);
    }
  }, [state.currentJudge, state.currentRound, state.playerMorale, state.opponentMorale, state.activeDeviations, state.judgeDecisions]);

  // Apply judge penalties
  const applyJudgePenalty = useCallback(async (character: TeamCharacter, penalty: any) => {
    // Implementation would depend on the penalty structure
    // This is a placeholder for penalty application logic
    console.log(`Applying penalty to ${character.name}:`, penalty);
    
    const penaltyText = `${character.name} receives a penalty: ${penalty.description}`;
    actions.setCurrentAnnouncement(penaltyText);
    speak(penaltyText);
  }, []);

  // Clear expired deviations
  const clearExpiredDeviations = useCallback(() => {
    const currentRound = state.currentRound;
    const activeDeviations = state.activeDeviations.filter(deviation => 
      deviation.duration === 'permanent' || 
      (deviation.startRound + (deviation.duration === 'temporary' ? 1 : 3)) > currentRound
    );
    
    if (activeDeviations.length !== state.activeDeviations.length) {
      actions.setActiveDeviations(activeDeviations);
    }
  }, [state.currentRound, state.activeDeviations]);

  // Calculate stability factors for a character
  const getCharacterStability = useCallback((characterId: string) => {
    const psychState = state.characterPsychology.get(characterId);
    if (!psychState) return null;

    return calculateStabilityFactors(
      psychState,
      state.currentRound,
      state.activeDeviations.filter(d => d.characterId === characterId)
    );
  }, [state.characterPsychology, state.currentRound, state.activeDeviations]);

  // Get all active deviations for a character
  const getCharacterDeviations = useCallback((characterId: string) => {
    return state.activeDeviations.filter(deviation => deviation.characterId === characterId);
  }, [state.activeDeviations]);

  // Reset psychology system
  const resetPsychologySystem = useCallback(() => {
    actions.setCharacterPsychology(new Map());
    actions.setActiveDeviations([]);
    actions.setJudgeDecisions([]);
    actions.setCurrentRogueAction(null);
    initializePsychologyStates();
  }, [initializePsychologyStates]);

  return {
    // Main exported functions
    checkForChaos,
    handleCharacterDeviation,
    applyChaosEffect,
    initializePsychologyStates,
    processPsychologicalEffects,
    processJudgeDecision,
    clearExpiredDeviations,
    getCharacterStability,
    getCharacterDeviations,
    resetPsychologySystem,
    
    // Computed values
    totalActiveDeviations: state.activeDeviations.length,
    hasActiveRogueAction: state.currentRogueAction !== null,
    psychologyInitialized: state.characterPsychology.size > 0
  };
};