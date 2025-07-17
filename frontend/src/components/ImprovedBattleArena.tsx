'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { characterAPI } from '@/services/apiClient';
import BattleRewards from './BattleRewards';
import CombatSkillProgression from './CombatSkillProgression';
import AudioSettings from './AudioSettings';
import TradingCard from './TradingCard';
import CardCollection from './CardCollection';
import CardPackOpening from './CardPackOpening';
import BattleHUD from './BattleHUD';
import StrategyPanel from './StrategyPanel';
import CharacterSpecificStrategyPanel from './CharacterSpecificStrategyPanel';
import CoachingPanel from './CoachingPanel';
import TeamDisplay from './TeamDisplay';
import TeamOverview from './TeamOverview';
import MatchmakingPanel from './MatchmakingPanel';
import ChaosPanel from './ChaosPanel';
import TeamChatPanel from './TeamChatPanel';
import CompetitiveMatchmaking from './CompetitiveMatchmaking';
import { combatRewards, createBattleStats, BattleStats } from '@/data/combatRewards';
import { type MatchmakingCriteria, type OpponentProfile } from '@/data/competitiveMatchmaking';
import { BattlePhase } from '@/data/battleFlow';
import { createDemoCharacterCollection, type Character } from '@/data/characters';
import { generateAIResponse } from '@/utils/aiChatResponses';
import { createBattlePerformance, CombatSkillEngine, CombatSkillReward } from '@/data/combatSkillProgression';
import { type MatchmakingResult, getTeamWeightClass, calculateWeightClassXP, weightClasses } from '@/data/weightClassSystem';
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
import { CharacterSkills } from '@/data/characterProgression';


// Removed local function - now using imported checkTeamGameplanAdherence
import { useBattleAnnouncer } from '@/hooks/useBattleAnnouncer';
import { useBattleWebSocket } from '@/hooks/useBattleWebSocket';
import { useBattleState } from '@/hooks/useBattleState';
import { useBattleChat } from '@/hooks/useBattleChat';
import { useBattleEngineLogic } from '@/hooks/useBattleEngineLogic';
import { usePsychologySystem } from '@/hooks/usePsychologySystem';
import { useCoachingSystem } from '@/hooks/useCoachingSystem';
import { useCardCollectionSystem } from '@/hooks/useCardCollectionSystem';
import { useUIPresentation } from '@/hooks/useUIPresentation';
import { useBattleSimulation } from '@/hooks/useBattleSimulation';
import { useBattleRewards } from '@/hooks/useBattleRewards';
import { useBattleFlow } from '@/hooks/useBattleFlow';
import { useBattleCommunication } from '@/hooks/useBattleCommunication';
import { useBattleEvents } from '@/hooks/useBattleEvents';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useBattleTimer } from '@/hooks/useBattleTimer';
import { convertToBattleCharacter } from '@/utils/battleCharacterUtils';
import { io } from 'socket.io-client';
import { useTimeoutManager } from '@/hooks/useTimeoutManager';
import { formatCharacterName } from '@/utils/characterUtils';
import { calculateNetHeadquartersEffect } from '@/utils/headquartersUtils';
import { Shield, Sword, Zap, Heart, MessageCircle, Sparkles, Timer, Volume2, AlertTriangle, Settings, VolumeX, CreditCard, Gift, Users, X, Gavel } from 'lucide-react';

// Import new team battle system
import {
  TeamCharacter,
  Team,
  BattleState,
  BattleSetup,
  RoundResult,
  createDemoPlayerTeam,
  createDemoPlayerTeamWithBonuses,
  createDemoOpponentTeam,
  checkGameplanAdherence as checkTeamGameplanAdherence,
  getMentalHealthLevel,
  getMoraleModifier,
  getTeamChemistryModifier,
  updateCoachingPointsAfterBattle,
  getEffectiveStats
} from '@/data/teamBattleSystem';
import { AIJudge, RogueAction, CharacterResponseGenerator } from '@/data/aiJudge';
import { CoachingEngine, CoachingSession } from '@/data/coachingSystem';
import { BattleEngine } from '@/systems/battleEngine';
import { PhysicalBattleEngine } from '@/systems/physicalBattleEngine';
import type { BattleCharacter, ExecutedAction, PlannedAction } from '@/data/battleFlow';



// BattlePhase type imported from @/data/battleFlow

export default function ImprovedBattleArena() {
  // Get user data for persistent battle state
  const { user } = useAuth();

  // Memory leak prevention with timeout manager
  const timeoutManager = useTimeoutManager();
  const { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout, clearAllTimeouts } = timeoutManager;

  // Ref to store clearQueue function for cleanup
  const clearQueueRef = useRef<(() => void) | null>(null);

  // Battle Announcer Integration with error handling (moved before cleanup effect)
  const battleAnnouncer = useBattleAnnouncer();

  const {
    isAnnouncerSpeaking,
    isEnabled: isAnnouncerEnabled,
    toggleEnabled: toggleAnnouncer,
    announceBattleStart,
    announceRoundStart,
    announceAction,
    announceVictory,
    announceDefeat,
    announcePhaseTransition,
    announceStrategySelection,
    announceBattleCry,
    clearQueue
  } = battleAnnouncer || {
    isAnnouncerSpeaking: false,
    isEnabled: true, // Enable by default even in fallback
    toggleEnabled: (enabled?: boolean) => {
      console.log('Announcer toggle fallback:', enabled);
    },
    announceBattleStart: (p1: string, p2: string) => {
      console.log(`🎤 Battle Start: ${p1} vs ${p2}!`);
    },
    announceRoundStart: (round: number) => {
      console.log(`🎤 Round ${round} begins!`);
    },
    announceAction: (text: string) => {
      console.log(`🎤 ${text}`);
    },
    announceVictory: (winner: string) => {
      console.log(`🎤 Victory to ${winner}!`);
    },
    announceDefeat: (loser: string) => {
      console.log(`🎤 ${loser} has fallen!`);
    },
    announcePhaseTransition: (phase: string) => {
      console.log(`🎤 Phase: ${phase}`);
    },
    announceStrategySelection: () => {
      console.log('🎤 Choose your strategies!');
    },
    announceBattleCry: () => {
      console.log('🎤 Warriors let out their battle cries!');
    },
    clearQueue: () => {
      console.log('🎤 Clearing announcement queue');
    }
  };

  // Store clearQueue function in ref to avoid temporal dead zone
  useEffect(() => {
    if (clearQueue) {
      clearQueueRef.current = clearQueue;
    }
  }, [clearQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('ImprovedBattleArena unmounting - cleaning up');
      clearAllTimeouts();
      // Clear audio announcer queue if available
      if (clearQueueRef.current) {
        clearQueueRef.current();
      }
    };
  }, [clearAllTimeouts]);

  // Load headquarters data from backend
  const [headquarters, setHeadquarters] = useState<any>({
    currentTier: 'spartan_apartment',
    rooms: [],
    currency: { coins: 0, gems: 0 },
    unlockedThemes: []
  });
  const [headquartersError, setHeadquartersError] = useState<string | null>(null);

  useEffect(() => {
    const loadHeadquarters = async () => {
      if (!user?.id) return;

      try {
        const headquartersData = await characterAPI.getHeadquarters(user.id);
        setHeadquarters(headquartersData);
        setHeadquartersError(null);
      } catch (error) {
        console.error('Failed to load headquarters data:', error);
        setHeadquartersError('Unable to load headquarters data. Using default setup.');
        // Clear error after 5 seconds
        setTimeout(() => setHeadquartersError(null), 5000);
      }
    };

    loadHeadquarters();
  }, [user?.id]);

  // Calculate headquarters bonuses AND penalties - memoized to prevent infinite loops
  const headquartersEffects = useMemo(() =>
    calculateNetHeadquartersEffect(headquarters), [headquarters]
  );

  // Use centralized state management instead of individual useState hooks
  const { state, actions } = useBattleState();

  // Team selection state
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [coachRoster, setCoachRoster] = useState<Character[]>([]);
  const [rosterError, setRosterError] = useState<string | null>(null);

  // Load user's character roster
  useEffect(() => {
    const loadCharacterRoster = async () => {
      if (!user?.id) return;

      try {
        const characters = await characterAPI.getUserCharacters();
        setCoachRoster(characters);
        setRosterError(null);
      } catch (error) {
        console.error('Failed to load character roster:', error);
        setRosterError('Unable to load your character roster. Using demo characters.');
        // Fallback to demo collection if API fails
        setCoachRoster(createDemoCharacterCollection());
        // Clear error after 5 seconds
        setTimeout(() => setRosterError(null), 5000);
      }
    };

    loadCharacterRoster();
  }, [user?.id]);

  // Competitive matchmaking state (additional local state not in battle state)
  const [currentOpponent, setCurrentOpponent] = useState<OpponentProfile | null>(null);
  const [matchmakingCriteria, setMatchmakingCriteria] = useState<MatchmakingCriteria | null>(null);

  // Player stats for matchmaking from user profile
  const playerStats = {
    level: user?.level || 1,
    wins: user?.total_wins || 0,
    rating: user?.rating || 1000,
    completedChallenges: user?.completed_challenges || []
  };

  // Helper function to convert Character to TeamCharacter
  const convertCharacterToTeamCharacter = (character: Character): TeamCharacter => ({
    id: character.id,
    name: character.name,
    avatar: character.avatar,
    archetype: character.archetype,
    rarity: character.rarity,
    level: character.level,
    experience: character.experience.currentXP,
    experienceToNext: character.experience.xpToNextLevel,
    traditionalStats: character.traditionalStats,
    currentHp: character.combatStats.health,
    maxHp: character.combatStats.maxHealth,
    psychStats: character.psychStats,
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
    abilities: [
      ...character.abilities.active.map((name: string) => ({
        id: name,
        name,
        type: 'attack' as const,
        power: 10,
        cooldown: 0,
        currentCooldown: 0,
        description: `${name} ability`,
        icon: 'default-icon',
        mentalHealthRequired: 0,
      })),
      ...character.abilities.passive.map((name: string) => ({
        id: name,
        name,
        type: 'support' as const,
        power: 0,
        cooldown: 0,
        currentCooldown: 0,
        description: `${name} ability`,
        icon: 'default-icon',
        mentalHealthRequired: 0,
      })),
      ...character.abilities.signature.map((name: string) => ({
        id: name,
        name,
        type: 'special' as const,
        power: 50,
        cooldown: 5,
        currentCooldown: 0,
        description: `${name} ability`,
        icon: 'default-icon',
        mentalHealthRequired: 0,
      })),
    ],
    specialPowers: [],
    personalityTraits: character.personality.traits,
    speakingStyle: 'formal' as const,
    decisionMaking: 'calculated' as const,
    conflictResponse: 'aggressive' as const,
    statusEffects: [],
    injuries: [],
    restDaysNeeded: 0,
  });

  // Helper function to convert TeamCharacter back to Character format for components that need it
  const convertTeamCharacterToCharacter = (teamChar: TeamCharacter): Character => {
    // Find the original character from the roster to get the full data
    const originalChar = coachRoster.find(char => char.id === teamChar.id);
    if (originalChar) {
      return originalChar;
    }

    // If not found in roster, create a minimal Character object
    // This shouldn't happen in normal flow, but provides a fallback
    throw new Error(`Character with id ${teamChar.id} not found in roster`);
  };

  // Initialize player team with 3 random characters from roster
  useEffect(() => {
    if (state.playerTeam.characters.length === 0) {
      // Select 3 random characters from coach's roster
      const shuffled = [...coachRoster].sort(() => 0.5 - Math.random());
      const randomTeam = shuffled.slice(0, 3);

      // Convert to team format with proper TeamCharacter conversion
      const team = {
        id: 'player_team',
        name: 'Player Team',
        coachName: 'Player',
        characters: randomTeam.map(convertCharacterToTeamCharacter),
        coachingPoints: 3,
        consecutiveLosses: 0,
        teamChemistry: 75,
        teamCulture: 'brotherhood' as const,
        averageLevel: Math.round(randomTeam.reduce((sum, char) => sum + char.level, 0) / randomTeam.length),
        totalPower: randomTeam.reduce((sum, char) => sum + (char.level * 10), 0),
        psychologyScore: 75,
        wins: 0,
        losses: 0,
        battlesPlayed: 0,
        lastBattleDate: new Date()
      };

      actions.setPlayerTeam(team);

      // Set selected team members for the UI
      setSelectedTeamMembers(randomTeam.map(char => char.id));
    }
  }, [state.playerTeam.characters.length]);

  // Destructure state for easier access (maintaining original variable names)
  const {
    playerTeam, opponentTeam, battleState, currentRound, playerMorale, opponentMorale,
    currentMatch, playerMatchWins, opponentMatchWins, playerRoundWins, opponentRoundWins
  } = state;

  // Destructure actions for easier access (maintaining original setter names)
  const {
    setPlayerTeam, setOpponentTeam, setBattleState, setCurrentRound, setPlayerMorale, setOpponentMorale,
    setCurrentMatch, setPlayerMatchWins, setOpponentMatchWins, setPlayerRoundWins, setOpponentRoundWins
  } = actions;

  // Refs to avoid stale closures in async operations
  const battleStateRef = useRef<BattleState | null>(null);
  const currentRoundRef = useRef(1);
  const currentMatchRef = useRef(1);
  const playerMoraleRef = useRef(75);
  const opponentMoraleRef = useRef(75);
  const playerMatchWinsRef = useRef(0);
  const opponentMatchWinsRef = useRef(0);
  const playerRoundWinsRef = useRef(0);
  const opponentRoundWinsRef = useRef(0);

  // Sync refs with state
  useEffect(() => {
    battleStateRef.current = battleState;
    currentRoundRef.current = currentRound;
    currentMatchRef.current = currentMatch;
    playerMoraleRef.current = playerMorale;
    opponentMoraleRef.current = opponentMorale;
    playerMatchWinsRef.current = playerMatchWins;
    opponentMatchWinsRef.current = opponentMatchWins;
    playerRoundWinsRef.current = playerRoundWins;
    opponentRoundWinsRef.current = opponentRoundWins;
  }, [battleState, currentRound, currentMatch, playerMorale, opponentMorale, playerMatchWins, opponentMatchWins, playerRoundWins, opponentRoundWins]);

  // Destructure more state for easier access (maintaining original variable names)
  const {
    phase, currentAnnouncement, selectedOpponent, showMatchmaking,
    characterPsychology, activeDeviations, judgeDecisions, currentJudge,
    battleCries, timer, isTimerActive, showAudioSettings,
    activeCoachingSession, showCoachingModal
  } = state;

  // Destructure more actions for easier access (maintaining original setter names)
  const {
    setPhase, setCurrentAnnouncement, setSelectedOpponent, setShowMatchmaking,
    setCharacterPsychology, setActiveDeviations, setJudgeDecisions, setCurrentJudge,
    setBattleCries, setTimer, setIsTimerActive, setShowAudioSettings,
    setActiveCoachingSession, setShowCoachingModal
  } = actions;

  // Destructure remaining state for easier access (maintaining original variable names)
  const {
    selectedCharacterForCoaching, currentRogueAction, judgeRuling,
    isFastBattleMode, fastBattleConsent
  } = state;

  // Destructure remaining actions for easier access (maintaining original setter names)
  const {
    setSelectedCharacterForCoaching, setCurrentRogueAction, setJudgeRuling,
    setIsFastBattleMode, setFastBattleConsent
  } = actions;

  // WebSocket Battle Integration with ref for stability
  const socketRef = useRef<any>(null);
  const battleWebSocket = useBattleWebSocket({
    onError: (error: string) => {
      console.error('❌ Battle WebSocket error:', error);
      if (error.includes('session has expired') || error.includes('Token expired')) {
        // Token expired - refresh the page to re-authenticate
        window.location.reload();
      }
    }
  });
  socketRef.current = battleWebSocket;

  const {
    isConnected,
    isAuthenticated,
    findMatch,
    joinBattle,
    selectStrategy: wsSelectStrategy,
    sendChat: wsSendChatMessage,
    socket: wsSocket,
    disconnect
  } = battleWebSocket;

  // Fallback values for missing WebSocket properties
  const currentUser = null;
  const wsError = null;

  // Initialize Battle Chat Hook - FIXED: This replaces the problematic handleCustomMessage
  const battleChat = useBattleChat({
    state,
    actions: {
      setChatMessages: actions.setChatMessages,
      addChatMessage: actions.addChatMessage,
      setCustomMessage: actions.setCustomMessage,
      setIsCharacterTyping: actions.setIsCharacterTyping,
      setSelectedChatCharacter: actions.setSelectedChatCharacter,
    },
    wsSocket,
    timeoutManager: { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout }
  });

  // Helper functions for battle engine logic hook
  const speak = (text: string) => {
    if (isAnnouncerEnabled) {
      announceAction(text, 500);
    }
  };

  // convertToBattleCharacter function moved to utils/battleCharacterUtils.ts (simpler version)

  // announceMessage function moved to useUIPresentation hook

  // Helper function for psychology hook
  const executeAbility = (attacker: TeamCharacter, defender: TeamCharacter, ability: any, isAttacker1: boolean) => {
    let damage = 0;
    let description = '';
    let newDefenderHP = defender.currentHp;
    let isCritical = false;

    if (ability.type === 'attack') {
      // Convert to BattleCharacter format for psychology-enhanced combat
      const attackerMorale = isAttacker1 ? playerMorale : opponentMorale;
      const defenderMorale = isAttacker1 ? opponentMorale : playerMorale;

      const battleAttacker = convertToBattleCharacter(attacker, attackerMorale);
      const battleDefender = convertToBattleCharacter(defender, defenderMorale);

      // Simple damage calculation (placeholder)
      const baseDamage = attacker.traditionalStats.strength;
      const defense = defender.traditionalStats.vitality;
      damage = Math.max(1, Math.floor(baseDamage - defense/2));

      newDefenderHP = Math.max(0, defender.currentHp - damage);
      description = `${attacker.name} uses ${ability.name} for ${damage} damage!`;
    }

    return {
      description,
      damage,
      newDefenderHP,
      newAttackerHP: attacker.currentHp,
      isCritical
    };
  };

  // Initialize Psychology System Hook
  const psychologySystem = usePsychologySystem({
    state,
    actions,
    timeoutManager: { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout },
    speak,
    executeAbility,
    headquartersEffects
  });

  // Initialize Battle Flow Hook (needed by coaching system)
  const battleFlow = useBattleFlow({
    state,
    actions
  });

  // Initialize Coaching System Hook
  const coachingSystem = useCoachingSystem({
    state,
    actions: {
      ...actions,
      startStrategySelection: battleFlow.startStrategySelection
    },
    timeoutManager: { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout },
    speak
  });

  // Initialize Card Collection System Hook
  const cardCollectionSystem = useCardCollectionSystem({
    state,
    actions
  });

  // Initialize UI Presentation Hook
  const uiPresentation = useUIPresentation({
    state,
    actions,
    timeoutManager: { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout },
    speak
  });

  // Initialize Battle Rewards Hook (moved here to be available for battleEngineLogic)
  const battleRewardsHook = useBattleRewards({
    state,
    actions,
    timeoutManager: { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout }
  });

  // Initialize Battle Simulation Hook (must be before battleEngineLogic)
  const battleSimulation = useBattleSimulation({
    state,
    actions: {
      ...actions,
      calculateTeamPower: uiPresentation.calculateTeamPower,
      checkForChaos: psychologySystem.checkForChaos,
      announceMessage: uiPresentation.announceMessage
    },
    timeoutManager: { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout },
    calculateBattleRewards: battleRewardsHook.calculateBattleRewards,
    announceAction
  });

  // Initialize Battle Engine Logic Hook
  const battleEngineLogic = useBattleEngineLogic({
    state,
    actions,
    timeoutManager: { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout },
    speak,
    announceBattleStart,
    announceVictory,
    announceDefeat,
    announceRoundStart,
    announceAction,
    announceMessage: uiPresentation.announceMessage,
    conductTeamHuddle: coachingSystem.conductTeamHuddle,
    convertToBattleCharacter,
    checkForChaos: psychologySystem.checkForChaos,
    handleStrategyRecommendation: coachingSystem.handleStrategyRecommendation,
    getCharacterOpinion: coachingSystem.getCharacterOpinion,
    insistOnStrategy: coachingSystem.insistOnStrategy,
    checkForBerserk: coachingSystem.checkForBerserk,
    handleCharacterStrategyChange: coachingSystem.handleCharacterStrategyChange,
    initializeCharacterStrategies: coachingSystem.initializeCharacterStrategies,
    areAllCharacterStrategiesComplete: coachingSystem.areAllCharacterStrategiesComplete,
    handleAllCharacterStrategiesComplete: coachingSystem.handleAllCharacterStrategiesComplete,
    handleTeamChatMessage: coachingSystem.handleTeamChatMessage,
    buildTeamFromCards: coachingSystem.buildTeamFromCards,
    initializeCardCollection: cardCollectionSystem.initializeCardCollection,
    handleCardSelect: cardCollectionSystem.handleCardSelect,
    handleCardDeselect: cardCollectionSystem.handleCardDeselect,
    handleCardsReceived: cardCollectionSystem.handleCardsReceived,
    handleCurrencySpent: cardCollectionSystem.handleCurrencySpent,
    handleSelectChatCharacter: uiPresentation.handleSelectChatCharacter,
    getCurrentPlayerFighter: uiPresentation.getCurrentPlayerFighter,
    getCurrentOpponentFighter: uiPresentation.getCurrentOpponentFighter,
    calculateTeamPower: uiPresentation.calculateTeamPower,
    handleTimerExpired: uiPresentation.handleTimerExpired,
    showModal: uiPresentation.showModal,
    hideModal: uiPresentation.hideModal,
    startTimer: uiPresentation.startTimer,
    stopTimer: uiPresentation.stopTimer,
    showBattleCries: uiPresentation.showBattleCries,
    transitionToPhase: uiPresentation.transitionToPhase,
    executeCombatRound: battleSimulation.executeCombatRound,
    calculateBattleRewards: battleRewardsHook.calculateBattleRewards,
    // Fast Battle System
    isOpponentAI: battleSimulation.isOpponentAI,
    handleFastBattleRequest: battleSimulation.handleFastBattleRequest,
    startFastBattle: battleSimulation.startFastBattle,
    resolveFastBattle: battleSimulation.resolveFastBattle,
    calculateFastBattleResult: battleSimulation.calculateFastBattleResult,
    headquartersEffects
  });

  // Initialize Battle Communication Hook
  const battleCommunication = useBattleCommunication({
    state,
    actions,
    timeoutManager: { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout },
    announceBattleCry
  });


  // Initialize Battle Events Hook
  const battleEvents = useBattleEvents({
    state,
    actions,
    announceBattleStart,
    announceRoundStart,
    announceVictory,
    announceDefeat,
    socketRef
  });

  // Initialize Matchmaking Hook
  const matchmaking = useMatchmaking({
    state,
    actions
  });

  // Auto-select a demo opponent for testing
  useEffect(() => {
    if (!state.selectedOpponent && state.opponentTeam.characters.length > 0) {
      const demoOpponent = {
        opponent: {
          teamLevel: 25,
          weightClass: weightClasses.find(wc => wc.id === 'elite')!,
          levelDifference: 0
        },
        estimatedWaitTime: 0,
        confidence: 95,
        riskLevel: 'moderate' as const,
        expectedXpMultiplier: 1.0,
        description: 'Demo opponent team'
      };
      matchmaking.handleOpponentSelection(demoOpponent);
    }
  }, [state.selectedOpponent, state.opponentTeam.characters.length, matchmaking]);

  // Extract battle functions from hook
  const {
    startTeamBattle,
    executeTeamRound,
    endBattle,
    proceedToRoundCombat,
    handleRoundEnd,
    calculateBattleOutcome
  } = battleEngineLogic;

  // Extract fast battle functions from simulation hook
  const {
    isOpponentAI,
    handleFastBattleRequest,
    startFastBattle,
    resolveFastBattle,
    calculateFastBattleResult
  } = battleSimulation;

  // Initialize Battle Timer Hook
  const battleTimer = useBattleTimer({
    state,
    actions,
    timeoutManager: { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout },
    proceedToRoundCombat
  });

  const matchResult = null;
  const wsBattleState = null;
  const clearError = () => {};
  const onBattleStart = null;
  const onRoundStart = null;
  const onRoundEnd = null;
  const onBattleEnd = null;
  const onChatMessage = null;

  // Destructure coaching and strategy state for easier access (maintaining original variable names)
  const {
    coachingMessages, characterResponse, showDisagreement,
    selectedStrategies, pendingStrategy, characterStrategies,
    chatMessages, customMessage, isCharacterTyping, selectedChatCharacter,
    showRewards, battleRewards
  } = state;

  // Destructure coaching and strategy actions for easier access (maintaining original setter names)
  const {
    setCoachingMessages, setCharacterResponse, setShowDisagreement,
    setSelectedStrategies, setPendingStrategy, setCharacterStrategies,
    setChatMessages, setCustomMessage, setIsCharacterTyping, setSelectedChatCharacter,
    setShowRewards, setBattleRewards
  } = actions;

  // Destructure remaining state for easier access (maintaining original variable names)
  const {
    showSkillProgression, combatSkillReward,
    playerCards, showCardCollection, showCardPacks, playerCurrency, selectedTeamCards
  } = state;

  // Destructure remaining actions for easier access (maintaining original setter names)
  const {
    setShowSkillProgression, setCombatSkillReward,
    setPlayerCards, setShowCardCollection, setShowCardPacks, setPlayerCurrency, setSelectedTeamCards
  } = actions;

  const announcementRef = useRef<HTMLDivElement>(null);
  const coachingRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Convert TeamCharacter to legacy Character interface for UI compatibility


  // Get current active fighter from team (cycles through team members)
  // getCurrentPlayerFighter function moved to useUIPresentation hook
  // getCurrentOpponentFighter function moved to useUIPresentation hook

  // Destructure final state for easier access (maintaining original variable names)
  const { player1, player2, player1BattleStats, player2BattleStats } = state;

  // Destructure final actions for easier access (maintaining original setter names)
  const { setPlayer1, setPlayer2, setPlayer1BattleStats, setPlayer2BattleStats } = actions;

  // Initialize fighters on first load
  useEffect(() => {
    if (!player1.id) {
      setPlayer1(uiPresentation.getCurrentPlayerFighter());
    }
    if (!player2.id) {
      setPlayer2(uiPresentation.getCurrentOpponentFighter());
    }
  }, [player1.id, player2.id]);

  // Update fighters when round changes
  useEffect(() => {
    setPlayer1(uiPresentation.getCurrentPlayerFighter());
    setPlayer2(uiPresentation.getCurrentOpponentFighter());
    // Reset battle stats for new round
    setPlayer1BattleStats(createBattleStats());
    setPlayer2BattleStats(createBattleStats());
  }, [currentRound]);

  // Clear announcement ref when content changes
  useEffect(() => {
    if (announcementRef.current) {
      announcementRef.current.scrollTop = 0;
    }
  }, [currentAnnouncement]);

  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Timer countdown with stable reference
  const handleTimerExpiredRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (isTimerActive && timer !== null && timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer !== null ? timer - 1 : null);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      handleTimerExpiredRef.current?.();
    }
  }, [timer, isTimerActive]);

  // WebSocket Integration Effects
  // Stable WebSocket event handlers using useCallback
  // WebSocket event handlers moved to useBattleEvents hook

  const handleChatMessage = useCallback((message: any) => {
    console.log('Chat message received:', message);
    actions.addChatMessage(`${formatCharacterName(message.character)}: ${message.message}`);
    setIsCharacterTyping(false);
  }, []);

  // WebSocket event setup with proper cleanup
  useEffect(() => {
    // Only set up listeners if the functions exist
    const unsubscribeBattleStart = onBattleStart ? onBattleStart(battleEvents.handleBattleStart) : null;
    const unsubscribeRoundStart = onRoundStart ? onRoundStart(battleEvents.handleRoundStart) : null;
    const unsubscribeRoundEnd = onRoundEnd ? onRoundEnd(handleRoundEnd) : null;
    const unsubscribeBattleEnd = onBattleEnd ? onBattleEnd(battleEvents.handleBattleEnd) : null;
    const unsubscribeChatMessage = onChatMessage ? onChatMessage(handleChatMessage) : null;

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket listeners');
      if (typeof unsubscribeBattleStart === 'function') unsubscribeBattleStart();
      if (typeof unsubscribeRoundStart === 'function') unsubscribeRoundStart();
      if (typeof unsubscribeRoundEnd === 'function') unsubscribeRoundEnd();
      if (typeof unsubscribeBattleEnd === 'function') unsubscribeBattleEnd();
      if (typeof unsubscribeChatMessage === 'function') unsubscribeChatMessage();
    };
  }, [onBattleStart, onRoundStart, onRoundEnd, onBattleEnd, onChatMessage, battleEvents.handleBattleStart, battleEvents.handleRoundStart, handleRoundEnd, battleEvents.handleBattleEnd, handleChatMessage]);

  // Handle WebSocket connection status
  useEffect(() => {
    if (wsError) {
      setCurrentAnnouncement(`Error: ${wsError}`);
    }
  }, [wsError]);

  // Handle match results
  useEffect(() => {
    if (matchResult) {
      if (matchResult.status === 'found' && matchResult.battle_id) {
        setCurrentAnnouncement(`Match found! Joining battle...`);
        joinBattle(matchResult.battle_id);
      } else if (matchResult.status === 'waiting') {
        setCurrentAnnouncement('Searching for opponent...');
      } else if (matchResult.status === 'failed') {
        setCurrentAnnouncement(matchResult.message || 'Failed to find match');
      }
    }
  }, [matchResult, joinBattle]);

  // Handle battle state updates
  useEffect(() => {
    if (wsBattleState) {
      console.log('Battle state updated:', wsBattleState);

      // Update phase based on battle status
      switch (wsBattleState.status) {
        case 'strategy_select':
          setPhase('pre_battle_huddle');
          setCurrentAnnouncement('Select your strategy!');
          setTimer(15); // 15 seconds for strategy selection
          setIsTimerActive(true);
          break;
        case 'round_combat':
          setPhase('combat');
          setCurrentAnnouncement(`Round ${wsBattleState.current_round} in progress...`);
          break;
        case 'chat_break':
          setPhase('coaching_timeout');
          setCurrentAnnouncement('Chat with your character!');
          setTimer(45); // 45 seconds for chat break
          setIsTimerActive(true);
          break;
        case 'completed':
          setPhase('battle_complete');
          break;
      }
    }
  }, [wsBattleState]);

  // handleTimerExpired function moved to useBattleTimer hook

  // Set the ref to the function
  handleTimerExpiredRef.current = battleTimer.handleTimerExpired;

  const allStrategiesSelected = () => {
    return selectedStrategies.attack && selectedStrategies.defense && selectedStrategies.special;
  };

  // handleOpponentSelection function moved to useMatchmaking hook

  // Battle functions extracted above - Fast Battle System Functions moved to useBattleSimulation hook

  // calculateTeamPower function moved to useUIPresentation hook

  // conductTeamHuddle function moved to useCoachingSystem hook

  // startStrategySelection function moved to useBattleFlow hook

  const startRoundCombat = () => {
    if (!battleState) return;

    setPhase('combat');
    const playerFighter = battleState.currentFighters.player;
    const opponentFighter = battleState.currentFighters.opponent;

    // Get next fighters for preview
    const nextPlayerIndex = currentRound % playerTeam.characters.length;
    const nextOpponentIndex = currentRound % opponentTeam.characters.length;
    const nextPlayerFighter = playerTeam.characters[nextPlayerIndex];
    const nextOpponentFighter = opponentTeam.characters[nextOpponentIndex];

    const announcement = `🥊 TEAM BATTLE Round ${currentRound}: ${playerFighter.name} vs ${opponentFighter.name}!
    Next up: ${nextPlayerFighter.name} vs ${nextOpponentFighter.name}`;
    setCurrentAnnouncement(announcement);
    announceRoundStart(currentRound);

    safeSetTimeout(() => {
      executeTeamRound();
    }, 3000);
  };

  // executeTeamRound function moved to useBattleEngineLogic hook

  // endBattle function moved to useBattleEngineLogic hook

  // conductIndividualCoaching function moved to useCoachingSystem hook
  // executeCoachingSession function moved to useCoachingSystem hook

  // announceMessage function moved to useUIPresentation hook

  const startBattle = async () => {
    if (!isConnected || !isAuthenticated) {
      setCurrentAnnouncement('Connecting to battle server...');
      return;
    }

    setCurrentAnnouncement('Searching for a worthy opponent...');
    setPhase('pre_battle_huddle');

    // Use WebSocket to find a match
    findMatch(); // This will use the first available character automatically
  };

  // Handle final strategy selection for WebSocket
  const handleFinalStrategySelection = (strategy: 'aggressive' | 'defensive' | 'balanced') => {
    if (!isConnected || !isAuthenticated) {
      setCurrentAnnouncement('Not connected to battle server');
      return;
    }

    setCurrentAnnouncement(`Strategy selected: ${strategy}`);
    wsSelectStrategy(strategy);

    // Clear timer
    setIsTimerActive(false);
    setTimer(null);
  };

  // fetchBattleCries function moved to useBattleCommunication hook

  // handleStrategyRecommendation function moved to useCoachingSystem hook

  // getCharacterOpinion function moved to useCoachingSystem hook

  // insistOnStrategy function moved to useCoachingSystem hook

  // handleCharacterStrategyChange function moved to useCoachingSystem hook

  // initializeCharacterStrategies function moved to useCoachingSystem hook
  // areAllCharacterStrategiesComplete function moved to useCoachingSystem hook
  // handleAllCharacterStrategiesComplete function moved to useCoachingSystem hook

  // checkForBerserk function moved to useCoachingSystem hook

  // FIXED: Use battleChat hook's selectChatCharacter instead of inline function
  const handleSelectChatCharacter = battleChat.selectChatCharacter;

  // FIXED: handleCustomMessage has been extracted to useBattleChat hook
  // This eliminates the WebSocket resource leak issue

  // Team chat handler
  // handleTeamChatMessage function moved to useCoachingSystem hook

  // proceedToRoundCombat function moved to useBattleEngineLogic hook

  // executeCombatRound function moved to useBattleSimulation hook

  // convertToBattleCharacter function moved to utils/battleCharacterUtils.ts

  // checkForChaos function moved to usePsychologySystem hook

  // handleCharacterDeviation function moved to usePsychologySystem hook

  // applyChaosEffect function moved to usePsychologySystem hook

  // executeAbility function moved to usePsychologySystem hook

  // calculateBattleRewards function moved to useBattleRewards hook

  // resetBattle function moved to useBattleFlow hook

  // Card Collection System Handlers
  // initializeCardCollection function moved to useCardCollectionSystem hook
  // handleCardSelect function moved to useCardCollectionSystem hook
  // handleCardDeselect function moved to useCardCollectionSystem hook
  // handleCardsReceived function moved to useCardCollectionSystem hook
  // handleCurrencySpent function moved to useCardCollectionSystem hook

  // buildTeamFromCards function moved to useCoachingSystem hook

  // Initialize card collection on mount
  useEffect(() => {
    cardCollectionSystem.initializeCardCollection();
  }, []);

  // Competitive Matchmaking Handlers
  const handleMatchFound = (opponent: OpponentProfile, criteria: MatchmakingCriteria) => {
    setCurrentOpponent(opponent);
    setMatchmakingCriteria(criteria);
    setShowMatchmaking(false);

    // Set announcement and start battle preparation
    setCurrentAnnouncement(`Match found! Preparing to face ${criteria.weightClass} opponent (Power: ${opponent.teamPower})`);

    // Generate AI opponent team based on the opponent profile
    // This would normally come from the backend, but we'll generate it locally for now
    const aiOpponentTeam = createDemoOpponentTeam(); // TODO: Create team based on opponent profile
    setOpponentTeam(aiOpponentTeam);

    // Start the battle flow with the matched opponent
    setPhase('pre_battle_huddle');

    setCurrentAnnouncement(`⚔️ Competitive Match Found! Weight Class: ${criteria.weightClass.replace('_', ' ').toUpperCase()}`);
    // Additional announcement for reward info
    setTimeout(() => {
      setCurrentAnnouncement(`🎯 Difficulty: ${criteria.difficultyTier} • Expected Reward: ${opponent.rewardMultiplier.toFixed(1)}x`);
    }, 3000);
  };

  const handleMatchmakingCancel = () => {
    setShowMatchmaking(false);
    setCurrentOpponent(null);
    setMatchmakingCriteria(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Error Messages */}
      {headquartersError && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
          {headquartersError}
        </div>
      )}
      {rosterError && (
        <div className="bg-orange-900/50 border border-orange-500 rounded-lg p-4 text-orange-200">
          {rosterError}
        </div>
      )}

      {/* 1. Current Round Fighters (TOP) - Team Display fighters only */}
      <TeamDisplay
        playerTeam={playerTeam}
        opponentTeam={opponentTeam}
        currentRound={currentRound}
        phase={{ name: phase }}
        battleCries={battleCries}
        chatMessages={chatMessages}
        customMessage={customMessage}
        isCharacterTyping={isCharacterTyping}
        chatContainerRef={chatContainerRef}
        selectedChatCharacter={selectedChatCharacter}
        onCustomMessageChange={setCustomMessage}
        onSendMessage={battleChat.handleCustomMessage}
        playerRoundWins={playerRoundWins}
        opponentRoundWins={opponentRoundWins}
        currentMatch={currentMatch}
        playerMatchWins={playerMatchWins}
        opponentMatchWins={opponentMatchWins}
      />

      {/* AI Chaos Monitor - Shows during combat phases */}
      {(phase === 'round-combat' || phase === 'round-end' || activeDeviations.length > 0) && (
        <ChaosPanel
          characterPsychology={characterPsychology}
          activeDeviations={activeDeviations}
          judgeDecisions={judgeDecisions}
          currentJudge={currentJudge}
          isVisible={true}
        />
      )}

      {/* Character-Specific Strategy Panel */}
      {phase === 'strategy-selection' && (
        <CharacterSpecificStrategyPanel
          currentRound={currentRound}
          currentMatch={currentMatch}
          playerTeam={{ characters: playerTeam.characters as unknown as TeamCharacter[] }}
          characterStrategies={characterStrategies}
          onStrategyChange={coachingSystem.handleCharacterStrategyChange}
          onAllStrategiesComplete={coachingSystem.handleAllCharacterStrategiesComplete}
          coachingMessages={coachingMessages}
          timeRemaining={timer || 0}
          isVisible={true}
        />
      )}

      {/* 2. Team Benches (MIDDLE) - Team Overview */}
      <TeamOverview
        playerTeam={playerTeam}
        playerMorale={playerMorale}
        onCharacterClick={coachingSystem.conductIndividualCoaching}
        onSelectChatCharacter={handleSelectChatCharacter}
      />

      {/* Headquarters Effects Display - Bonuses and Penalties */}
      {(Object.keys(headquartersEffects.bonuses).length > 0 || Object.keys(headquartersEffects.penalties).length > 0) && (
        <div className="mb-4 space-y-3">
          {/* Bonuses */}
          {Object.keys(headquartersEffects.bonuses).length > 0 && (
            <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30">
              <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Headquarters Bonuses
              </h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(headquartersEffects.bonuses).map(([bonus, value]) => (
                  <div key={bonus} className="flex items-center gap-1 text-sm text-green-300">
                    <Sparkles className="w-3 h-3" />
                    +{value} {bonus}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Penalties */}
          {Object.keys(headquartersEffects.penalties).length > 0 && (
            <div className="p-3 bg-red-900/20 rounded-lg border border-red-500/30">
              <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Headquarters Penalties
              </h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(headquartersEffects.penalties).map(([penalty, value]) => (
                  <div key={penalty} className="flex items-center gap-1 text-sm text-red-300">
                    <AlertTriangle className="w-3 h-3" />
                    {value} {penalty}
                  </div>
                ))}
              </div>
              <div className="text-xs text-red-200 mt-2">
                Fix overcrowding, resolve conflicts, and upgrade housing to reduce penalties!
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Compact Battle Communication Hub - Side-by-side Announcer and Team Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Battle Announcer - Extended Height to Match Team Chat */}
        <div className="h-[400px]"> {/* Extended height to match team chat */}
          <BattleHUD
            isAnnouncerEnabled={isAnnouncerEnabled}
            isAnnouncerSpeaking={isAnnouncerSpeaking}
            currentAnnouncement={currentAnnouncement}
            announcementRef={announcementRef}
            isConnected={isConnected}
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            timer={timer}
            isTimerActive={isTimerActive}
            playerCurrency={playerCurrency}
            toggleAnnouncer={toggleAnnouncer}
            onToggleAudioSettings={() => setShowAudioSettings(true)}
            onShowCardCollection={() => setShowCardCollection(true)}
            onShowCardPacks={() => setShowCardPacks(true)}
          />
        </div>

        {/* Team Chat Panel - Always Available (Extended) */}
        <div className="h-[400px]"> {/* Extended height for better chat experience */}
          <TeamChatPanel
            playerTeam={{ characters: playerTeam.characters as unknown as TeamCharacter[] }}
            phase={{ name: phase }}
            currentRound={currentRound}
            currentMatch={currentMatch}
            isVisible={true}
            onSendCoachMessage={coachingSystem.handleTeamChatMessage}
          />
        </div>
      </div>


      {/* Matchmaking Panel */}
      {phase === 'matchmaking' && (
        <MatchmakingPanel
          playerTeamLevels={playerTeam.characters.map(char => char.level)}
          onSelectOpponent={matchmaking.handleOpponentSelection}
          isVisible={showMatchmaking}
        />
      )}

      {/* Battle End - Victory/Restart */}
      {phase === 'battle-end' && (
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-6xl mb-4">
            {player1.currentHp > player2.currentHp ? '🏆' : player2.currentHp > player1.currentHp ? '💀' : '🤝'}
          </div>

          <h2 className="text-4xl font-bold text-white mb-4">
            {player1.currentHp <= 0 ? `${player2.name} Wins!` :
             player2.currentHp <= 0 ? `${player1.name} Wins!` :
             player1.currentHp > player2.currentHp ? `${player1.name} Wins!` :
             `${player2.name} Wins!`}
          </h2>

          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto text-center">
            <div className="bg-blue-600/20 p-4 rounded-lg">
              <h4 className="font-bold text-white">{player1.name}</h4>
              <p className="text-blue-300">{player1.currentHp} HP remaining</p>
            </div>
            <div className="bg-red-600/20 p-4 rounded-lg">
              <h4 className="font-bold text-white">{player2.name}</h4>
              <p className="text-red-300">{player2.currentHp} HP remaining</p>
            </div>
          </div>

          <button
            onClick={battleFlow.resetBattle}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg text-white font-bold text-xl shadow-lg transition-all transform hover:scale-105"
          >
            Fight Again!
          </button>
        </motion.div>
      )}

      {/* Battle Rewards Screen */}
      {showRewards && battleRewards && (
        <BattleRewards
          characterName={battleRewards.characterName}
          characterAvatar={battleRewards.characterAvatar}
          isVictory={battleRewards.isVictory}
          rewards={battleRewards}
          oldLevel={battleRewards.oldLevel}
          newLevel={battleRewards.newLevel}
          oldXP={battleRewards.oldXP}
          newXP={battleRewards.newXP}
          xpToNext={battleRewards.xpToNext}
          onContinue={() => {
            setShowRewards(false);
            setBattleRewards(null);
            // Show skill progression after basic rewards
            if (combatSkillReward) {
              setShowSkillProgression(true);
            }
          }}
        />
      )}

      {/* Combat Skill Progression Screen */}
      {showSkillProgression && combatSkillReward && (
        <CombatSkillProgression
          characterId={combatSkillReward.characterId}
          characterName={battleRewards?.characterName || 'Unknown'}
          characterAvatar={battleRewards?.characterAvatar || '⚔️'}
          skillReward={combatSkillReward}
          onClose={() => {
            console.log('Viewing skill progression details');
          }}
          onContinue={() => {
            setShowSkillProgression(false);
            setCombatSkillReward(null);
          }}
        />
      )}

      {/* Coaching Panel - Extracted Component */}
      <CoachingPanel
        isOpen={showCoachingModal}
        character={selectedCharacterForCoaching}
        onClose={() => setShowCoachingModal(false)}
        onCoachingSession={coachingSystem.executeCoachingSession}
        coachingPoints={playerTeam.coachingPoints}
      />

      {/* Audio Settings Modal */}
      <AudioSettings
        isOpen={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
      />

      {/* Card Collection Modal */}
      {showCardCollection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Card Collection</h2>
                    <p className="text-blue-100">Build your ultimate team</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCardCollection(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <CardCollection
                characters={playerCards}
                selectedCards={selectedTeamCards}
                maxSelection={3}
                onCardSelect={cardCollectionSystem.handleCardSelect}
                onCardDeselect={cardCollectionSystem.handleCardDeselect}
                showSelectionMode={true}
              />
            </div>

            {/* Footer */}
            <div className="border-t bg-gray-50 p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Select 3 characters to build your team
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCardCollection(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => coachingSystem.buildTeamFromCards(
                    playerCards,
                    selectedTeamCards,
                    setShowCardCollection,
                    setSelectedTeamCards
                  )}
                  disabled={selectedTeamCards.length !== 3}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    selectedTeamCards.length === 3
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Build Team ({selectedTeamCards.length}/3)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Card Pack Opening Modal */}
      <CardPackOpening
        isOpen={showCardPacks}
        onClose={() => setShowCardPacks(false)}
        onCardsReceived={cardCollectionSystem.handleCardsReceived}
        availableCards={playerCards}
        playerCurrency={playerCurrency}
        onCurrencySpent={cardCollectionSystem.handleCurrencySpent}
      />

      {/* Team Selection and Battle Controls */}
      <div className="max-w-4xl mx-auto mt-48 mb-8 space-y-6">
          {/* Current Team Display */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Current Team</h3>
              <button
                onClick={() => setShowTeamSelection(!showTeamSelection)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-semibold transition-colors"
              >
                {showTeamSelection ? 'Hide Selection' : 'Change Team'}
              </button>
            </div>

            {/* Current team members */}
            <div className="flex gap-4">
              {playerTeam.characters.slice(0, 3).map((character, index) => (
                <div key={character.id} className="flex-1 bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">{character.avatar}</div>
                  <div className="text-white font-semibold text-sm">{character.name}</div>
                  <div className="text-gray-400 text-xs">Level {character.level}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Selection Panel */}
          {showTeamSelection && (
            <div className="bg-slate-900/80 rounded-lg p-6 border border-slate-700">
              <h4 className="text-white font-bold mb-4">
                Select Team Members ({selectedTeamMembers.length}/3)
              </h4>

              <div className="grid grid-cols-3 gap-3 mb-4 max-h-60 overflow-y-auto">
                {coachRoster.map((character) => {
                  const isSelected = selectedTeamMembers.includes(character.id);
                  const canSelect = !isSelected && selectedTeamMembers.length < 3;

                  return (
                    <button
                      key={character.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTeamMembers(prev => prev.filter(id => id !== character.id));
                        } else if (canSelect) {
                          setSelectedTeamMembers(prev => [...prev, character.id]);
                        }
                      }}
                      disabled={!isSelected && !canSelect}
                      className={`p-3 rounded-lg text-left transition-all text-sm ${
                        isSelected
                          ? 'bg-blue-600/40 border border-blue-500'
                          : canSelect
                          ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600'
                          : 'bg-gray-800/30 border border-gray-700 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{character.avatar}</span>
                        <div>
                          <div className="text-white font-semibold">{character.name}</div>
                          <div className="text-gray-400 text-xs">Level {character.level}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (selectedTeamMembers.length === 3) {
                      // Update team with selected characters
                      const selectedChars = selectedTeamMembers
                        .map(id => coachRoster.find(char => char.id === id))
                        .filter(Boolean);

                      const newTeam = {
                        id: 'player_team',
                        name: 'Player Team',
                        coachName: 'Player',
                        characters: selectedChars.map(convertCharacterToTeamCharacter),
                        coachingPoints: 3,
                        consecutiveLosses: 0,
                        teamChemistry: 75,
                        teamCulture: 'brotherhood' as const,
                        averageLevel: Math.round(selectedChars.reduce((sum, char) => sum + char.level, 0) / selectedChars.length),
                        totalPower: selectedChars.reduce((sum, char) => sum + (char.level * 10), 0),
                        psychologyScore: 75,
                        wins: 0,
                        losses: 0,
                        battlesPlayed: 0,
                        lastBattleDate: new Date()
                      };

                      actions.setPlayerTeam(newTeam);
                      setShowTeamSelection(false);
                    }
                  }}
                  disabled={selectedTeamMembers.length !== 3}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedTeamMembers.length === 3
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Confirm Team
                </button>

                <button
                  onClick={() => setShowTeamSelection(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Battle Buttons */}
          <div className="text-center space-y-4 bg-slate-900/50 rounded-lg p-6 border border-slate-700">
            <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={startBattle}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-bold text-xl shadow-lg transition-all transform hover:scale-105"
            >
              Begin Team Battle!
            </button>

            <button
              onClick={() => setShowMatchmaking(true)}
              className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105"
            >
              🏆 Competitive Match
            </button>

            <button
              onClick={handleFastBattleRequest}
              className="px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
              title="Fast battle mode"
            >
              ⚡ Fast Battle
            </button>
            </div>

            <p className="text-gray-400 text-sm">
              3v3 Team Combat • Quick Battle or Competitive Matchmaking • Psychology & Chemistry Matter
            </p>
          </div>
        </div>

      {/* Competitive Matchmaking Overlay */}
      {showMatchmaking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <CompetitiveMatchmaking
            playerTeam={playerTeam.characters.map(convertTeamCharacterToCharacter)}
            playerStats={playerStats}
            onMatchFound={handleMatchFound}
            onCancel={handleMatchmakingCancel}
          />
        </div>
      )}

    </div>
  );
}
