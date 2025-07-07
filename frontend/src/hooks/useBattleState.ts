import { useReducer, useCallback } from 'react';
import { Team, TeamCharacter, BattleState, createDemoPlayerTeam, createDemoOpponentTeam } from '@/data/teamBattleSystem';
import { BattlePhase } from '@/data/battleFlow';
import { type MatchmakingResult } from '@/data/weightClassSystem';
import { type PsychologyState, type DeviationEvent } from '@/data/characterPsychology';
import { type JudgeDecision, judgePersonalities } from '@/data/aiJudgeSystem';
import { type RogueAction } from '@/data/aiJudge';
import { type CoachingSession } from '@/data/coachingSystem';
import { createBattleStats, BattleStats } from '@/data/combatRewards';
import { type CombatSkillReward } from '@/data/combatSkillProgression';

// Consolidated battle state interface
export interface BattleStateData {
  // Team State
  playerTeam: Team;
  opponentTeam: Team;
  battleState: BattleState | null;
  
  // Match/Round State
  currentRound: number;
  currentMatch: number;
  playerMorale: number;
  opponentMorale: number;
  playerMatchWins: number;
  opponentMatchWins: number;
  playerRoundWins: number;
  opponentRoundWins: number;
  
  // Battle Flow State
  phase: BattlePhase;
  currentAnnouncement: string;
  selectedOpponent: MatchmakingResult | null;
  showMatchmaking: boolean;
  
  // Psychology System State
  characterPsychology: Map<string, PsychologyState>;
  activeDeviations: DeviationEvent[];
  judgeDecisions: JudgeDecision[];
  currentJudge: any;
  
  // Battle Control State
  battleCries: { player1: string; player2: string };
  timer: number | null;
  isTimerActive: boolean;
  showAudioSettings: boolean;
  
  // Coaching System State
  activeCoachingSession: CoachingSession | null;
  showCoachingModal: boolean;
  selectedCharacterForCoaching: TeamCharacter | null;
  coachingMessages: string[];
  characterResponse: string;
  showDisagreement: boolean;
  
  // Judge/Rogue Actions State
  currentRogueAction: RogueAction | null;
  judgeRuling: any;
  
  // Battle Mode State
  isFastBattleMode: boolean;
  fastBattleConsent: { player1: boolean; player2: boolean };
  
  // Strategy State
  selectedStrategies: {
    player1: { general: string; specific: string };
    player2: { general: string; specific: string };
  };
  pendingStrategy: {
    characterId: string;
    strategyType: 'general' | 'specific';
    strategy: string;
  } | null;
  characterStrategies: Map<string, {
    general: string;
    specific: string;
    lastUpdated: number;
  }>;
  
  // Chat State
  chatMessages: string[];
  customMessage: string;
  isCharacterTyping: boolean;
  selectedChatCharacter: TeamCharacter;
  
  // Rewards/Progression State
  showRewards: boolean;
  battleRewards: any;
  showSkillProgression: boolean;
  combatSkillReward: CombatSkillReward | null;
  
  // Card System State
  playerCards: TeamCharacter[];
  showCardCollection: boolean;
  showCardPacks: boolean;
  playerCurrency: number;
  selectedTeamCards: string[];
  
  // Character Battle State
  player1: TeamCharacter;
  player2: TeamCharacter;
  player1BattleStats: BattleStats;
  player2BattleStats: BattleStats;
}

// Action types for the reducer
export type BattleStateAction =
  | { type: 'SET_PLAYER_TEAM'; payload: Team }
  | { type: 'SET_OPPONENT_TEAM'; payload: Team }
  | { type: 'SET_BATTLE_STATE'; payload: BattleState | null }
  | { type: 'SET_CURRENT_ROUND'; payload: number }
  | { type: 'SET_CURRENT_MATCH'; payload: number }
  | { type: 'SET_PLAYER_MORALE'; payload: number }
  | { type: 'SET_OPPONENT_MORALE'; payload: number }
  | { type: 'SET_PLAYER_MATCH_WINS'; payload: number }
  | { type: 'SET_OPPONENT_MATCH_WINS'; payload: number }
  | { type: 'SET_PLAYER_ROUND_WINS'; payload: number }
  | { type: 'SET_OPPONENT_ROUND_WINS'; payload: number }
  | { type: 'SET_PHASE'; payload: BattlePhase }
  | { type: 'SET_CURRENT_ANNOUNCEMENT'; payload: string }
  | { type: 'SET_SELECTED_OPPONENT'; payload: MatchmakingResult | null }
  | { type: 'SET_SHOW_MATCHMAKING'; payload: boolean }
  | { type: 'SET_CHARACTER_PSYCHOLOGY'; payload: Map<string, PsychologyState> }
  | { type: 'SET_ACTIVE_DEVIATIONS'; payload: DeviationEvent[] }
  | { type: 'SET_JUDGE_DECISIONS'; payload: JudgeDecision[] }
  | { type: 'SET_CURRENT_JUDGE'; payload: any }
  | { type: 'SET_BATTLE_CRIES'; payload: { player1: string; player2: string } }
  | { type: 'SET_TIMER'; payload: number | null }
  | { type: 'SET_IS_TIMER_ACTIVE'; payload: boolean }
  | { type: 'SET_SHOW_AUDIO_SETTINGS'; payload: boolean }
  | { type: 'SET_ACTIVE_COACHING_SESSION'; payload: CoachingSession | null }
  | { type: 'SET_SHOW_COACHING_MODAL'; payload: boolean }
  | { type: 'SET_SELECTED_CHARACTER_FOR_COACHING'; payload: TeamCharacter | null }
  | { type: 'SET_COACHING_MESSAGES'; payload: string[] }
  | { type: 'SET_CHARACTER_RESPONSE'; payload: string }
  | { type: 'SET_SHOW_DISAGREEMENT'; payload: boolean }
  | { type: 'SET_CURRENT_ROGUE_ACTION'; payload: RogueAction | null }
  | { type: 'SET_JUDGE_RULING'; payload: any }
  | { type: 'SET_IS_FAST_BATTLE_MODE'; payload: boolean }
  | { type: 'SET_FAST_BATTLE_CONSENT'; payload: { player1: boolean; player2: boolean } }
  | { type: 'SET_SELECTED_STRATEGIES'; payload: { player1: { general: string; specific: string }; player2: { general: string; specific: string } } }
  | { type: 'SET_PENDING_STRATEGY'; payload: { characterId: string; strategyType: 'general' | 'specific'; strategy: string } | null }
  | { type: 'SET_CHARACTER_STRATEGIES'; payload: Map<string, { general: string; specific: string; lastUpdated: number }> }
  | { type: 'SET_CHAT_MESSAGES'; payload: string[] }
  | { type: 'ADD_CHAT_MESSAGE'; payload: string }
  | { type: 'SET_CUSTOM_MESSAGE'; payload: string }
  | { type: 'SET_IS_CHARACTER_TYPING'; payload: boolean }
  | { type: 'SET_SELECTED_CHAT_CHARACTER'; payload: TeamCharacter }
  | { type: 'SET_SHOW_REWARDS'; payload: boolean }
  | { type: 'SET_BATTLE_REWARDS'; payload: any }
  | { type: 'SET_SHOW_SKILL_PROGRESSION'; payload: boolean }
  | { type: 'SET_COMBAT_SKILL_REWARD'; payload: CombatSkillReward | null }
  | { type: 'SET_PLAYER_CARDS'; payload: TeamCharacter[] }
  | { type: 'SET_SHOW_CARD_COLLECTION'; payload: boolean }
  | { type: 'SET_SHOW_CARD_PACKS'; payload: boolean }
  | { type: 'SET_PLAYER_CURRENCY'; payload: number }
  | { type: 'SET_SELECTED_TEAM_CARDS'; payload: string[] }
  | { type: 'SET_PLAYER1'; payload: TeamCharacter }
  | { type: 'SET_PLAYER2'; payload: TeamCharacter }
  | { type: 'SET_PLAYER1_BATTLE_STATS'; payload: BattleStats }
  | { type: 'SET_PLAYER2_BATTLE_STATS'; payload: BattleStats }
  | { type: 'RESET_BATTLE_STATE' };

// Initial state factory
const createInitialState = (): BattleStateData => {
  const playerTeam = createDemoPlayerTeam();
  return {
    // Team State
    playerTeam,
    opponentTeam: createDemoOpponentTeam(),
    battleState: null,
    
    // Match/Round State
    currentRound: 1,
    currentMatch: 1,
    playerMorale: 75,
    opponentMorale: 75,
    playerMatchWins: 0,
    opponentMatchWins: 0,
    playerRoundWins: 0,
    opponentRoundWins: 0,
    
    // Battle Flow State
    phase: 'pre_battle_huddle' as BattlePhase,
    currentAnnouncement: 'Welcome to the Arena! Choose your opponent to begin battle!',
    selectedOpponent: null,
    showMatchmaking: true,
    
    // Psychology System State
    characterPsychology: new Map(),
    activeDeviations: [],
    judgeDecisions: [],
    currentJudge: judgePersonalities[0],
    
    // Battle Control State
    battleCries: { player1: '', player2: '' },
    timer: null,
    isTimerActive: false,
    showAudioSettings: false,
    
    // Coaching System State
    activeCoachingSession: null,
    showCoachingModal: false,
    selectedCharacterForCoaching: null,
    coachingMessages: [],
    characterResponse: '',
    showDisagreement: false,
    
    // Judge/Rogue Actions State
    currentRogueAction: null,
    judgeRuling: null,
    
    // Battle Mode State
    isFastBattleMode: false,
    fastBattleConsent: { player1: false, player2: false },
    
    // Strategy State
    selectedStrategies: {
      player1: { general: '', specific: '' },
      player2: { general: '', specific: '' }
    },
    pendingStrategy: null,
    characterStrategies: new Map(),
    
    // Chat State
    chatMessages: [],
    customMessage: '',
    isCharacterTyping: false,
    selectedChatCharacter: playerTeam.characters[0],
    
    // Rewards/Progression State
    showRewards: false,
    battleRewards: null,
    showSkillProgression: false,
    combatSkillReward: null,
    
    // Card System State
    playerCards: [],
    showCardCollection: false,
    showCardPacks: false,
    playerCurrency: 1000,
    selectedTeamCards: [],
    
    // Character Battle State
    player1: playerTeam.characters[0],
    player2: playerTeam.characters[1] || playerTeam.characters[0],
    player1BattleStats: createBattleStats(),
    player2BattleStats: createBattleStats(),
  };
};

// Reducer function
const battleStateReducer = (state: BattleStateData, action: BattleStateAction): BattleStateData => {
  switch (action.type) {
    case 'SET_PLAYER_TEAM':
      return { ...state, playerTeam: action.payload };
    case 'SET_OPPONENT_TEAM':
      return { ...state, opponentTeam: action.payload };
    case 'SET_BATTLE_STATE':
      return { ...state, battleState: action.payload };
    case 'SET_CURRENT_ROUND':
      return { ...state, currentRound: action.payload };
    case 'SET_CURRENT_MATCH':
      return { ...state, currentMatch: action.payload };
    case 'SET_PLAYER_MORALE':
      return { ...state, playerMorale: action.payload };
    case 'SET_OPPONENT_MORALE':
      return { ...state, opponentMorale: action.payload };
    case 'SET_PLAYER_MATCH_WINS':
      return { ...state, playerMatchWins: action.payload };
    case 'SET_OPPONENT_MATCH_WINS':
      return { ...state, opponentMatchWins: action.payload };
    case 'SET_PLAYER_ROUND_WINS':
      return { ...state, playerRoundWins: action.payload };
    case 'SET_OPPONENT_ROUND_WINS':
      return { ...state, opponentRoundWins: action.payload };
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'SET_CURRENT_ANNOUNCEMENT':
      return { ...state, currentAnnouncement: action.payload };
    case 'SET_SELECTED_OPPONENT':
      return { ...state, selectedOpponent: action.payload };
    case 'SET_SHOW_MATCHMAKING':
      return { ...state, showMatchmaking: action.payload };
    case 'SET_CHARACTER_PSYCHOLOGY':
      return { ...state, characterPsychology: action.payload };
    case 'SET_ACTIVE_DEVIATIONS':
      return { ...state, activeDeviations: action.payload };
    case 'SET_JUDGE_DECISIONS':
      return { ...state, judgeDecisions: action.payload };
    case 'SET_CURRENT_JUDGE':
      return { ...state, currentJudge: action.payload };
    case 'SET_BATTLE_CRIES':
      return { ...state, battleCries: action.payload };
    case 'SET_TIMER':
      return { ...state, timer: action.payload };
    case 'SET_IS_TIMER_ACTIVE':
      return { ...state, isTimerActive: action.payload };
    case 'SET_SHOW_AUDIO_SETTINGS':
      return { ...state, showAudioSettings: action.payload };
    case 'SET_ACTIVE_COACHING_SESSION':
      return { ...state, activeCoachingSession: action.payload };
    case 'SET_SHOW_COACHING_MODAL':
      return { ...state, showCoachingModal: action.payload };
    case 'SET_SELECTED_CHARACTER_FOR_COACHING':
      return { ...state, selectedCharacterForCoaching: action.payload };
    case 'SET_COACHING_MESSAGES':
      return { ...state, coachingMessages: action.payload };
    case 'SET_CHARACTER_RESPONSE':
      return { ...state, characterResponse: action.payload };
    case 'SET_SHOW_DISAGREEMENT':
      return { ...state, showDisagreement: action.payload };
    case 'SET_CURRENT_ROGUE_ACTION':
      return { ...state, currentRogueAction: action.payload };
    case 'SET_JUDGE_RULING':
      return { ...state, judgeRuling: action.payload };
    case 'SET_IS_FAST_BATTLE_MODE':
      return { ...state, isFastBattleMode: action.payload };
    case 'SET_FAST_BATTLE_CONSENT':
      return { ...state, fastBattleConsent: action.payload };
    case 'SET_SELECTED_STRATEGIES':
      return { ...state, selectedStrategies: action.payload };
    case 'SET_PENDING_STRATEGY':
      return { ...state, pendingStrategy: action.payload };
    case 'SET_CHARACTER_STRATEGIES':
      return { ...state, characterStrategies: action.payload };
    case 'SET_CHAT_MESSAGES':
      return { ...state, chatMessages: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'SET_CUSTOM_MESSAGE':
      return { ...state, customMessage: action.payload };
    case 'SET_IS_CHARACTER_TYPING':
      return { ...state, isCharacterTyping: action.payload };
    case 'SET_SELECTED_CHAT_CHARACTER':
      return { ...state, selectedChatCharacter: action.payload };
    case 'SET_SHOW_REWARDS':
      return { ...state, showRewards: action.payload };
    case 'SET_BATTLE_REWARDS':
      return { ...state, battleRewards: action.payload };
    case 'SET_SHOW_SKILL_PROGRESSION':
      return { ...state, showSkillProgression: action.payload };
    case 'SET_COMBAT_SKILL_REWARD':
      return { ...state, combatSkillReward: action.payload };
    case 'SET_PLAYER_CARDS':
      return { ...state, playerCards: action.payload };
    case 'SET_SHOW_CARD_COLLECTION':
      return { ...state, showCardCollection: action.payload };
    case 'SET_SHOW_CARD_PACKS':
      return { ...state, showCardPacks: action.payload };
    case 'SET_PLAYER_CURRENCY':
      return { ...state, playerCurrency: action.payload };
    case 'SET_SELECTED_TEAM_CARDS':
      return { ...state, selectedTeamCards: action.payload };
    case 'SET_PLAYER1':
      return { ...state, player1: action.payload };
    case 'SET_PLAYER2':
      return { ...state, player2: action.payload };
    case 'SET_PLAYER1_BATTLE_STATS':
      return { ...state, player1BattleStats: action.payload };
    case 'SET_PLAYER2_BATTLE_STATS':
      return { ...state, player2BattleStats: action.payload };
    case 'RESET_BATTLE_STATE':
      return createInitialState();
    default:
      return state;
  }
};

// Custom hook
export const useBattleState = () => {
  const [state, dispatch] = useReducer(battleStateReducer, undefined, createInitialState);
  
  // Memoized action creators for better performance
  const actions = {
    setPlayerTeam: useCallback((team: Team) => dispatch({ type: 'SET_PLAYER_TEAM', payload: team }), []),
    setOpponentTeam: useCallback((team: Team) => dispatch({ type: 'SET_OPPONENT_TEAM', payload: team }), []),
    setBattleState: useCallback((battleState: BattleState | null) => dispatch({ type: 'SET_BATTLE_STATE', payload: battleState }), []),
    setCurrentRound: useCallback((round: number) => dispatch({ type: 'SET_CURRENT_ROUND', payload: round }), []),
    setCurrentMatch: useCallback((match: number) => dispatch({ type: 'SET_CURRENT_MATCH', payload: match }), []),
    setPlayerMorale: useCallback((morale: number) => dispatch({ type: 'SET_PLAYER_MORALE', payload: morale }), []),
    setOpponentMorale: useCallback((morale: number) => dispatch({ type: 'SET_OPPONENT_MORALE', payload: morale }), []),
    setPlayerMatchWins: useCallback((wins: number) => dispatch({ type: 'SET_PLAYER_MATCH_WINS', payload: wins }), []),
    setOpponentMatchWins: useCallback((wins: number) => dispatch({ type: 'SET_OPPONENT_MATCH_WINS', payload: wins }), []),
    setPlayerRoundWins: useCallback((wins: number) => dispatch({ type: 'SET_PLAYER_ROUND_WINS', payload: wins }), []),
    setOpponentRoundWins: useCallback((wins: number) => dispatch({ type: 'SET_OPPONENT_ROUND_WINS', payload: wins }), []),
    setPhase: useCallback((phase: BattlePhase) => dispatch({ type: 'SET_PHASE', payload: phase }), []),
    setCurrentAnnouncement: useCallback((announcement: string) => dispatch({ type: 'SET_CURRENT_ANNOUNCEMENT', payload: announcement }), []),
    setSelectedOpponent: useCallback((opponent: MatchmakingResult | null) => dispatch({ type: 'SET_SELECTED_OPPONENT', payload: opponent }), []),
    setShowMatchmaking: useCallback((show: boolean) => dispatch({ type: 'SET_SHOW_MATCHMAKING', payload: show }), []),
    setCharacterPsychology: useCallback((psychology: Map<string, PsychologyState>) => dispatch({ type: 'SET_CHARACTER_PSYCHOLOGY', payload: psychology }), []),
    setActiveDeviations: useCallback((deviations: DeviationEvent[]) => dispatch({ type: 'SET_ACTIVE_DEVIATIONS', payload: deviations }), []),
    setJudgeDecisions: useCallback((decisions: JudgeDecision[]) => dispatch({ type: 'SET_JUDGE_DECISIONS', payload: decisions }), []),
    setCurrentJudge: useCallback((judge: any) => dispatch({ type: 'SET_CURRENT_JUDGE', payload: judge }), []),
    setBattleCries: useCallback((cries: { player1: string; player2: string }) => dispatch({ type: 'SET_BATTLE_CRIES', payload: cries }), []),
    setTimer: useCallback((timer: number | null) => dispatch({ type: 'SET_TIMER', payload: timer }), []),
    setIsTimerActive: useCallback((active: boolean) => dispatch({ type: 'SET_IS_TIMER_ACTIVE', payload: active }), []),
    setShowAudioSettings: useCallback((show: boolean) => dispatch({ type: 'SET_SHOW_AUDIO_SETTINGS', payload: show }), []),
    setActiveCoachingSession: useCallback((session: CoachingSession | null) => dispatch({ type: 'SET_ACTIVE_COACHING_SESSION', payload: session }), []),
    setShowCoachingModal: useCallback((show: boolean) => dispatch({ type: 'SET_SHOW_COACHING_MODAL', payload: show }), []),
    setSelectedCharacterForCoaching: useCallback((character: TeamCharacter | null) => dispatch({ type: 'SET_SELECTED_CHARACTER_FOR_COACHING', payload: character }), []),
    setCoachingMessages: useCallback((messages: string[]) => dispatch({ type: 'SET_COACHING_MESSAGES', payload: messages }), []),
    setCharacterResponse: useCallback((response: string) => dispatch({ type: 'SET_CHARACTER_RESPONSE', payload: response }), []),
    setShowDisagreement: useCallback((show: boolean) => dispatch({ type: 'SET_SHOW_DISAGREEMENT', payload: show }), []),
    setCurrentRogueAction: useCallback((action: RogueAction | null) => dispatch({ type: 'SET_CURRENT_ROGUE_ACTION', payload: action }), []),
    setJudgeRuling: useCallback((ruling: any) => dispatch({ type: 'SET_JUDGE_RULING', payload: ruling }), []),
    setIsFastBattleMode: useCallback((fast: boolean) => dispatch({ type: 'SET_IS_FAST_BATTLE_MODE', payload: fast }), []),
    setFastBattleConsent: useCallback((consent: { player1: boolean; player2: boolean }) => dispatch({ type: 'SET_FAST_BATTLE_CONSENT', payload: consent }), []),
    setSelectedStrategies: useCallback((strategies: { player1: { general: string; specific: string }; player2: { general: string; specific: string } }) => dispatch({ type: 'SET_SELECTED_STRATEGIES', payload: strategies }), []),
    setPendingStrategy: useCallback((strategy: { characterId: string; strategyType: 'general' | 'specific'; strategy: string } | null) => dispatch({ type: 'SET_PENDING_STRATEGY', payload: strategy }), []),
    setCharacterStrategies: useCallback((strategies: Map<string, { general: string; specific: string; lastUpdated: number }>) => dispatch({ type: 'SET_CHARACTER_STRATEGIES', payload: strategies }), []),
    setChatMessages: useCallback((messages: string[]) => dispatch({ type: 'SET_CHAT_MESSAGES', payload: messages }), []),
    addChatMessage: useCallback((message: string) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message }), []),
    setCustomMessage: useCallback((message: string) => dispatch({ type: 'SET_CUSTOM_MESSAGE', payload: message }), []),
    setIsCharacterTyping: useCallback((typing: boolean) => dispatch({ type: 'SET_IS_CHARACTER_TYPING', payload: typing }), []),
    setSelectedChatCharacter: useCallback((character: TeamCharacter) => dispatch({ type: 'SET_SELECTED_CHAT_CHARACTER', payload: character }), []),
    setShowRewards: useCallback((show: boolean) => dispatch({ type: 'SET_SHOW_REWARDS', payload: show }), []),
    setBattleRewards: useCallback((rewards: any) => dispatch({ type: 'SET_BATTLE_REWARDS', payload: rewards }), []),
    setShowSkillProgression: useCallback((show: boolean) => dispatch({ type: 'SET_SHOW_SKILL_PROGRESSION', payload: show }), []),
    setCombatSkillReward: useCallback((reward: CombatSkillReward | null) => dispatch({ type: 'SET_COMBAT_SKILL_REWARD', payload: reward }), []),
    setPlayerCards: useCallback((cards: TeamCharacter[]) => dispatch({ type: 'SET_PLAYER_CARDS', payload: cards }), []),
    setShowCardCollection: useCallback((show: boolean) => dispatch({ type: 'SET_SHOW_CARD_COLLECTION', payload: show }), []),
    setShowCardPacks: useCallback((show: boolean) => dispatch({ type: 'SET_SHOW_CARD_PACKS', payload: show }), []),
    setPlayerCurrency: useCallback((currency: number) => dispatch({ type: 'SET_PLAYER_CURRENCY', payload: currency }), []),
    setSelectedTeamCards: useCallback((cards: string[]) => dispatch({ type: 'SET_SELECTED_TEAM_CARDS', payload: cards }), []),
    setPlayer1: useCallback((player: TeamCharacter) => dispatch({ type: 'SET_PLAYER1', payload: player }), []),
    setPlayer2: useCallback((player: TeamCharacter) => dispatch({ type: 'SET_PLAYER2', payload: player }), []),
    setPlayer1BattleStats: useCallback((stats: BattleStats) => dispatch({ type: 'SET_PLAYER1_BATTLE_STATS', payload: stats }), []),
    setPlayer2BattleStats: useCallback((stats: BattleStats) => dispatch({ type: 'SET_PLAYER2_BATTLE_STATS', payload: stats }), []),
    resetBattleState: useCallback(() => dispatch({ type: 'RESET_BATTLE_STATE' }), []),
  };
  
  return { state, actions };
};