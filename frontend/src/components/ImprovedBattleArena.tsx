'use client';

import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { combatRewards, createBattleStats, BattleStats } from '@/data/combatRewards';
import { BattlePhase } from '@/data/battleFlow';
import { generateAIResponse } from '@/utils/aiChatResponses';
import { createBattlePerformance, CombatSkillEngine, CombatSkillReward } from '@/data/combatSkillProgression';
import { type MatchmakingResult, getTeamWeightClass, calculateWeightClassXP } from '@/data/weightClassSystem';
import { 
  initializePsychologyState, 
  updatePsychologyState, 
  calculateDeviationRisk, 
  rollForDeviation,
  type PsychologyState,
  type DeviationEvent
} from '@/data/characterPsychology';
import { makeJudgeDecision, generateDeviationPrompt, judgePersonalities, type JudgeDecision } from '@/data/aiJudgeSystem';
// import { CharacterSkills } from '@/data/characterProgression'; // Not available
interface CharacterSkills {
  characterId: string;
  coreSkills: Record<string, { level: number; experience: number; maxLevel: number }>;
  signatureSkills?: Record<string, { name: string; level: number; description?: string }>;
  archetypeSkills?: Record<string, { name: string; level: number; description?: string }>;
  passiveAbilities?: Array<{ id: string; name: string; description: string }>;
  activeAbilities?: Array<{ id: string; name: string; description: string; cost?: number }>;
  unlockedNodes?: Array<{ id: string; name: string; type: string }>;
  lastUpdated?: Date;
}

// Removed local function - now using imported checkTeamGameplanAdherence
import { useBattleAnnouncer } from '@/hooks/useBattleAnnouncer';
import { useBattleWebSocket } from '@/hooks/useBattleWebSocket';
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

// Legacy interface for backward compatibility
interface Character {
  name: string;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  level: number;
  xp: number;
  xpToNext: number;
  trainingLevel: number; // 0-100, affects gameplan adherence
  abilities: Ability[];
  items: Item[];
  avatar: string;
  personality?: string;
  speechStyle?: string;
  selectedStrategy?: {
    attack: string;
    defense: string;
    special: string;
  };
  statusEffects: string[];
  specialPowers: SpecialPower[];
  battleStats?: BattleStats;
}

interface SpecialPower {
  name: string;
  type: 'companion' | 'amplifier' | 'resistance';
  description: string;
  effect: string;
  icon: string;
  cooldown: number;
  currentCooldown: number;
}

interface Ability {
  name: string;
  type: 'attack' | 'defense' | 'special';
  power: number;
  cooldown: number;
  currentCooldown: number;
  description: string;
  icon: string;
}

interface Item {
  name: string;
  type: 'healing' | 'boost' | 'special';
  effect: string;
  icon: string;
  description: string;
  uses: number;
}

// BattlePhase type imported from @/data/battleFlow

export default function ImprovedBattleArena() {
  // Memory leak prevention with error handling
  let timeoutManager;
  try {
    timeoutManager = useTimeoutManager();
  } catch (error) {
    console.error('TimeoutManager initialization failed:', error);
    timeoutManager = {
      setTimeout: (cb: () => void, delay: number) => setTimeout(cb, delay),
      clearTimeout: (id: any) => clearTimeout(id),
      clearAllTimeouts: () => {}
    };
  }
  
  const { setTimeout: safeSetTimeout, clearTimeout: safeClearTimeout, clearAllTimeouts } = timeoutManager;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('ImprovedBattleArena unmounting - cleaning up');
      clearAllTimeouts();
      clearQueue(); // Clear audio announcer queue
    };
  }, []);
  
  // New Team Battle System State with refs for stability
  // Mock headquarters state for demo - in real app this would come from global state
  const mockHeadquarters = {
    currentTier: 'spartan_apartment', // This gives penalties
    rooms: [
      {
        id: 'room_1',
        name: 'Bunk Room Alpha',
        theme: 'victorian_study', // Intelligence +20
        assignedCharacters: ['holmes', 'dracula', 'achilles', 'joan', 'tesla', 'merlin'], // OVERCROWDED! (6 > 4)
        maxCharacters: 4
      },
      {
        id: 'room_2', 
        name: 'Bunk Room Beta',
        theme: null, // No theme = small penalty
        assignedCharacters: ['genghis_khan', 'cleopatra'], // These two conflict!
        maxCharacters: 4
      }
    ],
    currency: { coins: 50000, gems: 100 },
    unlockedThemes: ['victorian_study', 'greek_classical']
  };

  // Calculate headquarters bonuses AND penalties
  const headquartersEffects = calculateNetHeadquartersEffect(mockHeadquarters);
  
  const [playerTeam, setPlayerTeam] = useState<Team>(() => 
    createDemoPlayerTeamWithBonuses(headquartersEffects.bonuses, headquartersEffects.penalties)
  );
  const [opponentTeam, setOpponentTeam] = useState<Team>(createDemoOpponentTeam());
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [playerMorale, setPlayerMorale] = useState(75);
  const [opponentMorale, setOpponentMorale] = useState(75);
  
  // Match and Round tracking for proper battle structure
  const [currentMatch, setCurrentMatch] = useState(1);
  const [playerMatchWins, setPlayerMatchWins] = useState(0);
  const [opponentMatchWins, setOpponentMatchWins] = useState(0);
  const [playerRoundWins, setPlayerRoundWins] = useState(0); // rounds won in current match
  const [opponentRoundWins, setOpponentRoundWins] = useState(0); // rounds won in current match
  
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
  
  // Legacy battle state (for backward compatibility)
  const [phase, setPhase] = useState<BattlePhase>('pre_battle_huddle');
  const [currentAnnouncement, setCurrentAnnouncement] = useState('Welcome to the Arena! Choose your opponent to begin battle!');
  
  // Matchmaking state
  const [selectedOpponent, setSelectedOpponent] = useState<MatchmakingResult | null>(null);
  const [showMatchmaking, setShowMatchmaking] = useState(true);
  
  // AI Chaos System state
  const [characterPsychology, setCharacterPsychology] = useState<Map<string, PsychologyState>>(new Map());
  const [activeDeviations, setActiveDeviations] = useState<DeviationEvent[]>([]);
  const [judgeDecisions, setJudgeDecisions] = useState<JudgeDecision[]>([]);
  const [currentJudge, setCurrentJudge] = useState(judgePersonalities[0]); // Judge Executioner as default
  const [battleCries, setBattleCries] = useState({ player1: '', player2: '' });
  const [timer, setTimer] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  // Coaching System State
  const [activeCoachingSession, setActiveCoachingSession] = useState<CoachingSession | null>(null);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [selectedCharacterForCoaching, setSelectedCharacterForCoaching] = useState<TeamCharacter | null>(null);
  
  // Rogue Action State
  const [currentRogueAction, setCurrentRogueAction] = useState<RogueAction | null>(null);
  const [judgeRuling, setJudgeRuling] = useState<any>(null);

  // Battle Announcer Integration with error handling
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

  // WebSocket Battle Integration with ref for stability
  const socketRef = useRef<any>(null);
  const battleWebSocket = useBattleWebSocket();
  socketRef.current = battleWebSocket;
  
  const {
    isConnected,
    isAuthenticated,
    findMatch,
    joinBattle,
    selectStrategy: wsSelectStrategy,
    sendChat: wsSendChatMessage,
    disconnect
  } = battleWebSocket;
  
  // Fallback values for missing WebSocket properties
  const currentUser = null;
  const wsError = null;
  const matchResult = null;
  const wsBattleState = null;
  const clearError = () => {};
  const onBattleStart = null;
  const onRoundStart = null;
  const onRoundEnd = null;
  const onBattleEnd = null;
  const onChatMessage = null;
  
  // Chat and AI coaching
  const [coachingMessages, setCoachingMessages] = useState<string[]>([]);
  const [characterResponse, setCharacterResponse] = useState<string>('');
  const [showDisagreement, setShowDisagreement] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState<{
    attack: string | null;
    defense: string | null;
    special: string | null;
  }>({ attack: null, defense: null, special: null });
  const [pendingStrategy, setPendingStrategy] = useState<{
    type: 'attack' | 'defense' | 'special';
    strategy: string;
  } | null>(null);
  
  // New character-specific strategy system
  const [characterStrategies, setCharacterStrategies] = useState<Map<string, {
    characterId: string;
    attack: string | null;
    defense: string | null;
    special: string | null;
    isComplete: boolean;
  }>>(new Map());
  
  // Character Chat
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [isCharacterTyping, setIsCharacterTyping] = useState(false);
  const [selectedChatCharacter, setSelectedChatCharacter] = useState<TeamCharacter>(() => playerTeam.characters[0]);
  const [showRewards, setShowRewards] = useState(false);
  const [battleRewards, setBattleRewards] = useState<any>(null);
  const [showSkillProgression, setShowSkillProgression] = useState(false);
  const [combatSkillReward, setCombatSkillReward] = useState<CombatSkillReward | null>(null);
  
  // Card Collection System State
  const [playerCards, setPlayerCards] = useState<TeamCharacter[]>([]);
  const [showCardCollection, setShowCardCollection] = useState(false);
  const [showCardPacks, setShowCardPacks] = useState(false);
  const [playerCurrency, setPlayerCurrency] = useState(1000);
  const [selectedTeamCards, setSelectedTeamCards] = useState<string[]>([]);
  
  const announcementRef = useRef<HTMLDivElement>(null);
  const coachingRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Convert TeamCharacter to legacy Character interface for UI compatibility
  const convertTeamCharacterToCharacter = (teamChar: TeamCharacter): Character => {
    // Character-specific abilities based on archetype
    const getCharacterAbilities = (name: string, archetype: string) => {
      switch (name) {
        case 'Sherlock Holmes':
          return [
            { name: 'Deduction Strike', type: 'attack', power: 25, cooldown: 1, currentCooldown: 0, description: 'Analyzes weak points', icon: '🔍' },
            { name: 'Defensive Analysis', type: 'defense', power: 0, cooldown: 2, currentCooldown: 0, description: 'Predicts enemy moves', icon: '🧠' },
            { name: 'Elementary!', type: 'special', power: 40, cooldown: 3, currentCooldown: 0, description: 'Brilliant deduction', icon: '💡' }
          ];
        case 'Dracula':
          return [
            { name: 'Blood Drain', type: 'attack', power: 30, cooldown: 1, currentCooldown: 0, description: 'Vampiric attack', icon: '🩸' },
            { name: 'Mist Form', type: 'defense', power: 0, cooldown: 3, currentCooldown: 0, description: 'Become intangible', icon: '🌫️' },
            { name: 'Bat Swarm', type: 'special', power: 35, cooldown: 4, currentCooldown: 0, description: 'Summon bats', icon: '🦇' }
          ];
        case 'Joan of Arc':
          return [
            { name: 'Holy Strike', type: 'attack', power: 28, cooldown: 1, currentCooldown: 0, description: 'Divine blade', icon: '⚔️' },
            { name: 'Divine Shield', type: 'defense', power: 0, cooldown: 2, currentCooldown: 0, description: 'Heavenly protection', icon: '🛡️' },
            { name: 'Rally Cry', type: 'special', power: 20, cooldown: 3, currentCooldown: 0, description: 'Inspire allies', icon: '🏳️' }
          ];
        default:
          return [
            { name: 'Strike', type: 'attack', power: 25, cooldown: 1, currentCooldown: 0, description: 'Basic attack', icon: '⚔️' },
            { name: 'Defend', type: 'defense', power: 0, cooldown: 2, currentCooldown: 0, description: 'Defensive stance', icon: '🛡️' },
            { name: 'Special Move', type: 'special', power: 40, cooldown: 3, currentCooldown: 0, description: 'Character special', icon: '💫' }
          ];
      }
    };

    return {
      name: formatCharacterName(teamChar.name),
      maxHp: teamChar.maxHp,
      hp: teamChar.currentHp,
      atk: getEffectiveStats(teamChar).strength,
      def: getEffectiveStats(teamChar).vitality,
      spd: getEffectiveStats(teamChar).speed,
      level: teamChar.level,
      xp: teamChar.experience,
      xpToNext: teamChar.experienceToNext,
      trainingLevel: teamChar.psychStats.training,
      avatar: teamChar.avatar,
      battleStats: createBattleStats(),
      statusEffects: teamChar.statusEffects || [],
      abilities: getCharacterAbilities(teamChar.name, teamChar.archetype) as any[],
      items: [],
      specialPowers: [
        { name: 'Character Power', type: 'amplifier', description: 'Unique ability', effect: '+20% damage', icon: '✨', cooldown: 3, currentCooldown: 0 }
      ]
    };
  };

  // Get current active fighter from team (cycles through team members)
  const getCurrentPlayerFighter = () => {
    const fighterIndex = (currentRound - 1) % playerTeam.characters.length;
    return playerTeam.characters[fighterIndex];
  };

  const getCurrentOpponentFighter = () => {
    const fighterIndex = (currentRound - 1) % opponentTeam.characters.length;
    return opponentTeam.characters[fighterIndex];
  };

  // Dynamic player1 and player2 based on current round
  const [player1, setPlayer1] = useState<Character>(() => 
    convertTeamCharacterToCharacter(getCurrentPlayerFighter())
  );
  const [player2, setPlayer2] = useState<Character>(() => 
    convertTeamCharacterToCharacter(getCurrentOpponentFighter())
  );

  // Update fighters when round changes
  useEffect(() => {
    setPlayer1(convertTeamCharacterToCharacter(getCurrentPlayerFighter()));
    setPlayer2(convertTeamCharacterToCharacter(getCurrentOpponentFighter()));
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
        setTimer(prev => prev !== null ? prev - 1 : null);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      handleTimerExpiredRef.current?.();
    }
  }, [timer, isTimerActive]);

  // WebSocket Integration Effects
  // Stable WebSocket event handlers using useCallback
  const handleBattleStart = useCallback((data: any) => {
    console.log('Battle starting:', data);
    setCurrentAnnouncement(`Battle begins! ${data.player1?.username} vs ${data.player2?.username}`);
    setPhase({ name: 'strategy-selection' });
    announceBattleStart(data.player1?.username || 'Player 1', data.player2?.username || 'Player 2');
  }, []);

  const handleRoundStart = useCallback((data: any) => {
    console.log('Round starting:', data);
    setCurrentRound(data.round || 1);
    setCurrentAnnouncement(`Round ${data.round || 1} begins!`);
    setPhase({ name: 'round-combat' });
    announceRoundStart(data.round || 1);
  }, []);

  const handleRoundEnd = useCallback((data: any) => {
    console.log('Round ended:', data);
    setCurrentAnnouncement(data.message || 'Round completed!');
    setPhase({ name: 'round-end' });
  }, []);

  const handleBattleEnd = useCallback((result: any) => {
    console.log('Battle ended:', result);
    setCurrentAnnouncement(result.message || 'Battle completed!');
    setPhase({ name: 'battle-end' });
    
    if (result.winner === socketRef.current?.currentUser?.id) {
      announceVictory(result.winnerName || 'You');
    } else {
      announceDefeat(result.loserName || 'You');
    }
    
    // Show rewards if available
    if (result.rewards) {
      setBattleRewards(result.rewards);
      setShowRewards(true);
    }
  }, []);

  const handleChatMessage = useCallback((message: any) => {
    console.log('Chat message received:', message);
    setChatMessages(prev => [...prev, `${formatCharacterName(message.character)}: ${message.message}`]);
    setIsCharacterTyping(false);
  }, []);

  // WebSocket event setup with proper cleanup
  useEffect(() => {
    // Only set up listeners if the functions exist
    const unsubscribeBattleStart = onBattleStart ? onBattleStart(handleBattleStart) : null;
    const unsubscribeRoundStart = onRoundStart ? onRoundStart(handleRoundStart) : null;
    const unsubscribeRoundEnd = onRoundEnd ? onRoundEnd(handleRoundEnd) : null;
    const unsubscribeBattleEnd = onBattleEnd ? onBattleEnd(handleBattleEnd) : null;
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
  }, [onBattleStart, onRoundStart, onRoundEnd, onBattleEnd, onChatMessage, handleBattleStart, handleRoundStart, handleRoundEnd, handleBattleEnd, handleChatMessage]);

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
          setPhase({ name: 'strategy-selection' });
          setCurrentAnnouncement('Select your strategy!');
          setTimer(15); // 15 seconds for strategy selection
          setIsTimerActive(true);
          break;
        case 'round_combat':
          setPhase({ name: 'round-combat' });
          setCurrentAnnouncement(`Round ${wsBattleState.current_round} in progress...`);
          break;
        case 'chat_break':
          setPhase({ name: 'round-end' });
          setCurrentAnnouncement('Chat with your character!');
          setTimer(45); // 45 seconds for chat break
          setIsTimerActive(true);
          break;
        case 'completed':
          setPhase({ name: 'battle-end' });
          break;
      }
    }
  }, [wsBattleState]);

  const handleTimerExpired = () => {
    // Auto-select random strategies when timer expires or proceed with current selections
    setIsTimerActive(false);
    if (phase.name === 'strategy-selection') {
      const finalStrategies = { ...selectedStrategies };
      
      // Auto-select missing strategies (AI chooses)
      if (!finalStrategies.attack) {
        const attackOptions = player1.abilities?.filter(a => a.type === 'attack') || [];
        if (attackOptions.length > 0) {
          finalStrategies.attack = attackOptions[Math.floor(Math.random() * attackOptions.length)].name;
        } else {
          finalStrategies.attack = 'Basic Attack';
        }
      }
      if (!finalStrategies.defense) {
        const defenseOptions = player1.abilities?.filter(a => a.type === 'defense') || [];
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
      
      setSelectedStrategies(finalStrategies);
      
      const missingSome = !selectedStrategies.attack || !selectedStrategies.defense || !selectedStrategies.special;
      if (missingSome) {
        setCoachingMessages(prev => [...prev, 'Time&apos;s up! Your warrior chooses their own strategy for missing categories!']);
      } else {
        setCoachingMessages(prev => [...prev, 'Time&apos;s up! Moving to combat with selected strategies!']);
      }
      
      safeSetTimeout(() => {
        proceedToRoundCombat();
      }, 2000);
    }
  };

  // Set the ref to the function
  handleTimerExpiredRef.current = handleTimerExpired;

  const allStrategiesSelected = () => {
    return selectedStrategies.attack && selectedStrategies.defense && selectedStrategies.special;
  };

  // New Team Battle Functions
  // Handler for selecting an opponent from matchmaking
  const handleOpponentSelection = (opponent: MatchmakingResult) => {
    setSelectedOpponent(opponent);
    setShowMatchmaking(false);
    setPhase({ name: 'pre-battle' });
    setCurrentAnnouncement(`Opponent selected: Level ${opponent.opponent.teamLevel} team. Prepare for battle!`);
    
    // Adjust opponent team stats based on selected level
    const adjustedOpponentTeam = {
      ...opponentTeam,
      characters: opponentTeam.characters.map(char => ({
        ...char,
        level: opponent.opponent.teamLevel,
        // Scale stats based on level difference
        traditionalStats: {
          ...char.traditionalStats,
          strength: Math.max(10, Math.min(100, char.traditionalStats.strength + (opponent.opponent.teamLevel - char.level) * 3)),
          vitality: Math.max(10, Math.min(100, char.traditionalStats.vitality + (opponent.opponent.teamLevel - char.level) * 3)),
          speed: Math.max(10, Math.min(100, char.traditionalStats.speed + (opponent.opponent.teamLevel - char.level) * 2)),
          dexterity: Math.max(10, Math.min(100, char.traditionalStats.dexterity + (opponent.opponent.teamLevel - char.level) * 2)),
        },
        maxHp: Math.max(50, char.maxHp + (opponent.opponent.teamLevel - char.level) * 10),
        currentHp: Math.max(50, char.maxHp + (opponent.opponent.teamLevel - char.level) * 10)
      }))
    };
    
    setOpponentTeam(adjustedOpponentTeam);
  };

  const startTeamBattle = () => {
    // Initialize character psychology for all fighters
    const psychologyMap = new Map<string, PsychologyState>();
    
    // Initialize player team psychology
    playerTeam.characters.forEach(char => {
      psychologyMap.set(char.id, initializePsychologyState(char));
    });
    
    // Initialize opponent team psychology
    opponentTeam.characters.forEach(char => {
      psychologyMap.set(char.id, initializePsychologyState(char));
    });
    
    setCharacterPsychology(psychologyMap);
    setActiveDeviations([]);
    setJudgeDecisions([]);
    
    // Randomly select a judge for this battle
    const randomJudge = judgePersonalities[Math.floor(Math.random() * judgePersonalities.length)];
    setCurrentJudge(randomJudge);
    
    const setup: BattleSetup = {
      playerTeam,
      opponentTeam,
      battleType: 'friendly',
      weightClass: 'amateur',
      stakes: 'normal'
    };

    const newBattleState: BattleState = {
      setup,
      currentRound: 1,
      phase: 'pre_battle',
      playerMorale: { currentMorale: playerMorale, moraleHistory: [] },
      opponentMorale: { currentMorale: opponentMorale, moraleHistory: [] },
      roundResults: [],
      currentFighters: {
        player: playerTeam.characters[0],
        opponent: opponentTeam.characters[0]
      }
    };

    setBattleState(newBattleState);
    setPhase({ name: 'pre-battle' });
    announceBattleStart(playerTeam.name, opponentTeam.name);
    setCurrentAnnouncement(`🏆 3v3 TEAM BATTLE: ${playerTeam.name} vs ${opponentTeam.name}! 
    Your lineup: ${playerTeam.characters.map(c => c.name).join(', ')}
    Opponents: ${opponentTeam.characters.map(c => c.name).join(', ')}`);

    safeSetTimeout(() => {
      conductTeamHuddle();
    }, 5000); // Extended to give more time to see team setup
  };

  const conductTeamHuddle = () => {
    setPhase({ name: 'battle-cry' });
    setCurrentAnnouncement('The teams gather for their pre-battle huddles! Team chemistry and psychology will be tested!');
    announcePhaseTransition('battle-cry');

    // Show team chemistry and psychology info
    const huddleMessages = [
      `Team ${playerTeam.name} - Coach ${playerTeam.coachName} is leading the huddle.`, 
      `Current Team Chemistry: ${Math.round(playerTeam.teamChemistry * 10) / 10}% | Team Morale: ${playerMorale}%`,
      `Your starting lineup: ${playerTeam.characters.map(char => char.name).join(', ')}.`,
      `Review their strengths and weaknesses before battle.`
    ];

    const delay = 2000; // Use const instead of let
    huddleMessages.forEach((msg, index) => {
      const capturedMsg = msg; // Capture message for closure
      safeSetTimeout(() => {
        setCurrentAnnouncement(capturedMsg);
        announceAction(capturedMsg);
      }, delay * (index + 1));
    });

    const totalDelay = delay * huddleMessages.length + 2000; // Capture delay calculation
    safeSetTimeout(() => {
      startStrategySelection(); // Move to strategy selection after huddle
    }, totalDelay); // Use captured delay
  };

  const startStrategySelection = () => {
    setPhase({ name: 'strategy-selection' });
    const announcement = `Strategy Planning Phase - Choose each character's approach for battle!`;
    setCurrentAnnouncement(announcement);
    announceStrategySelection();
    
    // Initialize character-specific strategies
    initializeCharacterStrategies();
    
    setCoachingMessages(prev => [
      ...(currentRound === 1 ? [`Welcome, Coach! This is your pre-battle strategy session. Set individual strategies for each team member.`] : prev),
      `Choose attack, defense, and special strategies for each character!`
    ]);
    setSelectedStrategies({ attack: null, defense: null, special: null });
    setTimer(60); // Increased to 60 seconds for better UX
    setIsTimerActive(true);
  };

  const startRoundCombat = () => {
    if (!battleState) return;

    setPhase({ name: 'round-combat' });
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

  const executeTeamRound = () => {
    if (!battleState) return;

    const playerFighter = battleState.currentFighters.player;
    const opponentFighter = battleState.currentFighters.opponent;

    // Check if player character will follow the gameplan using sophisticated psychology system
    const battlePlayerFighter = convertToBattleCharacter(playerFighter, playerMorale);
    const plannedAction: PlannedAction = {
      type: 'ability',
      actionType: 'ability',
      abilityId: playerFighter.abilities[0]?.name || 'basic_attack',
      targetId: opponentFighter.id,
      coachingInfluence: playerMorale / 100 // Convert morale to coaching influence
    };
    
    const adherenceCheck = PhysicalBattleEngine.performGameplanAdherenceCheck(battlePlayerFighter, plannedAction);

    let roundResult: RoundResult | null = null;

    if (adherenceCheck.checkResult === 'goes_rogue' || adherenceCheck.checkResult === 'improvises') {
      // Character goes rogue!
      const rogueAction = AIJudge.generateRogueAction(
        playerFighter,
        opponentFighter, 
        playerMorale,
        playerMorale > opponentMorale ? 'winning' : 'losing'
      );

      const ruling = AIJudge.judgeRogueAction(rogueAction, opponentFighter, playerMorale);
      
      setCurrentRogueAction(rogueAction);
      setJudgeRuling(ruling);

      roundResult = {
        round: currentRound,
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
      const coachResponse = AIJudge.generateCoachingResponse(rogueAction, ruling, playerTeam.coachName);
      const characterResponse = CharacterResponseGenerator.generateResponse(playerFighter, rogueAction, coachResponse);
      
      // Add psychology reasoning to coaching messages
      const psychologyReasoning = `Psychology Report: ${adherenceCheck.reasoning}`;
      setCoachingMessages(prev => [...prev, psychologyReasoning, coachResponse, `${playerFighter.name}: ${characterResponse}`]);
      
    } else {
      // Character follows gameplan - normal combat
      const baseDamage = playerFighter.traditionalStats.strength;
      const moraleModifier = getMoraleModifier(playerMorale);
      const chemistryModifier = getTeamChemistryModifier(playerTeam.teamChemistry);
      const damage = Math.floor(baseDamage * moraleModifier * chemistryModifier);
      
      roundResult = {
        round: currentRound,
        attacker: playerFighter,
        defender: opponentFighter,
        attackerAction: playerFighter.abilities[0] || 'refused',
        damage,
        wasStrategyAdherent: true,
        moraleImpact: 5, // Small morale boost for following gameplan
        newAttackerHp: playerFighter.currentHp,
        newDefenderHp: opponentFighter.currentHp - damage,
        narrativeDescription: `${playerFighter.name} follows the strategy perfectly and strikes ${opponentFighter.name}! ${adherenceCheck.reasoning}${chemistryModifier > 1.1 ? ' ⚡ Team synergy amplifies the attack!' : chemistryModifier < 0.9 ? ' 💥 Team dysfunction weakens the blow!' : ''}`
      };
    }

    // Update battle state
    if (roundResult) {
      const currentRoundResult = roundResult; // Capture the value to avoid closure issues
      setBattleState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          roundResults: [...prev.roundResults, currentRoundResult]
        };
      });

      // Update morale
      const newPlayerMorale = Math.max(0, Math.min(100, playerMorale + currentRoundResult.moraleImpact));
      setPlayerMorale(newPlayerMorale);

      // Announce the result
      setCurrentAnnouncement(currentRoundResult.narrativeDescription);
      announceAction(currentRoundResult.narrativeDescription);

      // Check for battle end or continue using refs for stability
      const capturedRoundResult = currentRoundResult; // Capture for closure
      safeSetTimeout(() => {
        const currentRoundValue = currentRoundRef.current;
        const currentBattleState = battleStateRef.current;
        
        if (capturedRoundResult.newDefenderHp <= 0) {
          endBattle('player');
        } else if (currentRoundValue >= 3) { // Max 3 rounds for 2-out-of-3 system
          endBattle('draw');
        } else {
          setCurrentRound(prev => prev + 1);
          // Switch fighters for next round using ref values
          const playerTeamLength = currentBattleState?.teams?.player?.characters?.length || 1;
          const opponentTeamLength = currentBattleState?.teams?.opponent?.characters?.length || 1;
          const nextPlayerIndex = currentRoundValue % playerTeamLength;
          const nextOpponentIndex = currentRoundValue % opponentTeamLength;
        
          setBattleState(prev => {
            if (!prev) return null;
            return {
              ...prev,
              currentFighters: {
                player: playerTeam.characters[nextPlayerIndex],
                opponent: opponentTeam.characters[nextOpponentIndex]
              }
            };
          });
          
          safeSetTimeout(() => startRoundCombat(), 2000);
        }
      }, 4000);
    }
  };

  const endBattle = (winner: 'player' | 'opponent' | 'draw') => {
    setPhase({ name: 'battle-end' });
    
    let endMessage = '';
    if (winner === 'player') {
      endMessage = `Victory! ${playerTeam.name} has triumphed through teamwork and strategy!`;
      announceVictory(playerTeam.name, playerMorale > 90);
    } else if (winner === 'opponent') {
      endMessage = `Defeat! ${opponentTeam.name} has proven superior this day.`;
      announceDefeat(playerTeam.name);
    } else {
      endMessage = 'The battle ends in a dramatic draw! Both teams showed incredible heart!';
    }

    setCurrentAnnouncement(endMessage);
    
    // Show post-battle team chemistry effects
    safeSetTimeout(() => {
      const newChemistry = Math.max(0, Math.min(100, playerTeam.teamChemistry + (winner === 'player' ? 10 : -5)));
      setPlayerTeam(prev => ({ ...prev, teamChemistry: newChemistry }));
      
      const chemistryUpdate = `Post-battle team chemistry: ${Math.round(newChemistry * 10) / 10}% ${newChemistry > playerTeam.teamChemistry ? '(+)' : '(-)'}`;
      setCurrentAnnouncement(chemistryUpdate);
    }, 3000);
  };

  const conductIndividualCoaching = (character: TeamCharacter) => {
    setSelectedCharacterForCoaching(character);
    setShowCoachingModal(true);
  };

  const executeCoachingSession = (focus: 'performance' | 'mental_health' | 'team_relations' | 'strategy') => {
    if (!selectedCharacterForCoaching) return;

    const session = CoachingEngine.conductIndividualCoaching(
      selectedCharacterForCoaching,
      playerTeam,
      focus,
      75 // Coach skill level
    );

    setActiveCoachingSession(session);
    
    // Apply the coaching effects
    setPlayerTeam(prev => ({
      ...prev,
      characters: prev.characters.map(char => 
        char.id === selectedCharacterForCoaching.id
          ? {
              ...char,
              psychStats: {
                ...char.psychStats,
                mentalHealth: Math.max(0, Math.min(100, char.psychStats.mentalHealth + session.outcome.mentalHealthChange)),
                training: Math.max(0, Math.min(100, char.psychStats.training + session.outcome.trainingChange)),
                teamPlayer: Math.max(0, Math.min(100, char.psychStats.teamPlayer + session.outcome.teamPlayerChange)),
                ego: Math.max(0, Math.min(100, char.psychStats.ego + session.outcome.egoChange)),
                communication: Math.max(0, Math.min(100, char.psychStats.communication + session.outcome.communicationChange))
              }
            }
          : char
      )
    }));

    setCoachingMessages(prev => [...prev, 
      `Coaching ${selectedCharacterForCoaching.name} on ${focus}:`,
      `${selectedCharacterForCoaching.name}: ${session.outcome.characterResponse}`,
      `Coach Notes: ${session.outcome.coachNotes}`
    ]);

    setShowCoachingModal(false);
  };

  const announceMessage = async (message: string, type: string = 'general') => {
    setCurrentAnnouncement(message);
    
    // Use the new announcer system
    if (type === 'pre-battle') {
      announceBattleStart(player1.name, player2.name);
    } else if (type === 'round-start') {
      announceRoundStart(currentRound);
    } else if (type === 'victory') {
      const winner = player1.hp <= 0 ? player2.name : player1.name;
      const isFlawless = (player1.hp <= 0 && player2.hp === player2.maxHp) || 
                        (player2.hp <= 0 && player1.hp === player1.maxHp);
      announceVictory(winner, isFlawless);
    } else if (type === 'defeat') {
      const loser = player1.hp <= 0 ? player1.name : player2.name;
      announceDefeat(loser);
    } else {
      announceAction(message);
    }
  };

  const startBattle = async () => {
    if (!isConnected || !isAuthenticated) {
      setCurrentAnnouncement('Connecting to battle server...');
      return;
    }

    setCurrentAnnouncement('Searching for a worthy opponent...');
    setPhase({ name: 'pre-battle' });
    
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

  const fetchBattleCries = useCallback(async () => {
    // Ensure component is still mounted
    const controller = new AbortController();
    const timeoutId = safeSetTimeout(() => controller.abort(), 2000);
    
    const announcement = 'The warriors prepare to exchange battle cries...';
    setCurrentAnnouncement(announcement);
    announceBattleCry();
    
    // Set fallback battle cries immediately
    const currentPlayer1 = player1;
    const currentPlayer2 = player2;
    
    setBattleCries({
      player1: `${currentPlayer1.name}: I'll show you the power of ${currentPlayer1.personality || 'determination'}!`,
      player2: `${currentPlayer2.name}: Prepare yourself for ${currentPlayer2.personality || 'battle'}!`
    });
    
    // Try API if available, but don't crash if it fails
    try {
      const [cry1, cry2] = await Promise.all([
        fetch('https://blank-wars-demo-3.onrender.com/api/battle-cry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character: currentPlayer1 }),
          signal: controller.signal
        }).catch(() => null),
        fetch('https://blank-wars-demo-3.onrender.com/api/battle-cry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character: currentPlayer2 }),
          signal: controller.signal
        }).catch(() => null)
      ]);

      safeClearTimeout(timeoutId);

      if (cry1?.ok && cry2?.ok) {
        const data1 = await cry1.json().catch(() => null);
        const data2 = await cry2.json().catch(() => null);
        if (data1 && data2) {
          setBattleCries({
            player1: data1.battleCry || `${currentPlayer1.name}: For glory!`,
            player2: data2.battleCry || `${currentPlayer2.name}: Victory will be mine!`
          });
        }
      }
    } catch (error) {
      console.warn('Battle cry API not available, using fallback cries');
      safeClearTimeout(timeoutId);
    }
    
    return () => {
      controller.abort();
      safeClearTimeout(timeoutId);
    };
  }, [player1, player2, safeSetTimeout, safeClearTimeout]);

  const handleStrategyRecommendation = async (type: 'attack' | 'defense' | 'special', strategy: string) => {
    // Coach recommends a strategy
    setCoachingMessages(prev => [...prev, `Coach: I recommend ${strategy} for ${type}!`]);
    setPendingStrategy({ type, strategy });
    
    // Character may disagree based on training level
    const obedienceRoll = Math.random() * 100;
    const disagreementChance = 100 - player1.trainingLevel;
    
    if (obedienceRoll < disagreementChance) {
      // Character disagrees
      setShowDisagreement(true);
      const response = await getCharacterOpinion(type, strategy);
      setCharacterResponse(response);
      setCoachingMessages(prev => [...prev, `${player1.name}: ${response}`]);
    } else {
      // Character agrees
      setSelectedStrategies(prev => ({ ...prev, [type]: strategy }));
      setCoachingMessages(prev => [...prev, `${player1.name}: Understood, coach!`]);
      setPendingStrategy(null);
    }
  };

  const getCharacterOpinion = async (type: string, strategy: string): Promise<string> => {
    // Generate fallback response based on character personality
    const fallbackResponses = [
      `I think ${strategy} could work, but I prefer my own approach.`,
      `${strategy} for ${type}? I've got a better idea, coach.`,
      `Trust me coach, I know what I'm doing better than that ${strategy} plan.`,
      `I'll consider ${strategy}, but I might improvise based on what I see.`,
      `That ${strategy} strategy might work, but I'm feeling something different.`
    ];
    const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        safeSetTimeout(() => reject(new Error('API timeout')), 2000)
      );
        
      const response = await Promise.race([
        fetch('http://localhost:3006/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character: player1.name,
            message: `Coach wants me to use ${strategy} for ${type}. What do you think?`,
            battleContext: {
              round: currentRound,
              playerHealth: Math.round((player1.hp / player1.maxHp) * 100),
              enemyHealth: Math.round((player2.hp / player2.maxHp) * 100)
            }
          })
        }),
        timeoutPromise
      ]);

      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
    } catch (error) {
      console.warn('Character opinion API not available, using fallback');
    }
    
    return fallback;
  };

  const insistOnStrategy = () => {
    if (!pendingStrategy) return;
    
    // Coach insists - another training check
    const insistRoll = Math.random() * 100;
    const coachingBonus = 20; // Insisting gives a bonus to adherence
    const adherenceBonus = 10; // Base adherence bonus
    
    if (insistRoll < player1.trainingLevel + adherenceBonus) {
      setCoachingMessages(prev => [...prev, 
        'Coach: I insist! Trust me on this!',
        `${player1.name}: Fine... I'll follow your lead, coach.`
      ]);
      setSelectedStrategies(prev => ({ ...prev, [pendingStrategy.type]: pendingStrategy.strategy }));
      setShowDisagreement(false);
      setPendingStrategy(null);
    } else {
      // Character still refuses
      setCoachingMessages(prev => [...prev, 
        'Coach: You must listen to me!',
        `${player1.name}: No! I know what I'm doing!`
      ]);
      checkForBerserk();
    }
  };

  // Character-specific strategy handlers
  const handleCharacterStrategyChange = (characterId: string, category: 'attack' | 'defense' | 'special', strategy: string) => {
    setCharacterStrategies(prev => {
      const newMap = new Map(prev);
      const currentStrategy = newMap.get(characterId) || {
        characterId,
        attack: null,
        defense: null,
        special: null,
        isComplete: false
      };
      
      const updatedStrategy = {
        ...currentStrategy,
        [category]: strategy
      };
      
      // Check if all categories are selected
      updatedStrategy.isComplete = !!(updatedStrategy.attack && updatedStrategy.defense && updatedStrategy.special);
      
      newMap.set(characterId, updatedStrategy);
      return newMap;
    });
  };

  const initializeCharacterStrategies = () => {
    const newMap = new Map<string, any>();
    playerTeam.characters.forEach(character => {
      newMap.set(character.id, {
        characterId: character.id,
        attack: null,
        defense: null,
        special: null,
        isComplete: false
      });
    });
    setCharacterStrategies(newMap);
  };

  const areAllCharacterStrategiesComplete = () => {
    return Array.from(characterStrategies.values()).every(strategy => strategy.isComplete);
  };

  const handleAllCharacterStrategiesComplete = () => {
    if (areAllCharacterStrategiesComplete()) {
      setTimer(null);
      setIsTimerActive(false);
      handleTimerExpired();
    }
  };

  const checkForBerserk = () => {
    // Small chance of going berserk when refusing orders
    const berserkChance = player1.trainingLevel < 50 ? 10 : 2;
    const berserkRoll = Math.random() * 100;
    
    if (berserkRoll < berserkChance) {
      setCoachingMessages(prev => [...prev, 
        `⚠️ ${player1.name} has gone BERSERK! They're fighting on pure instinct!`
      ]);
      player1.statusEffects.push('Berserk');
      announceMessage(`${player1.name} has entered a berserk rage!`, 'special-event');
    }
  };

  const handleSelectChatCharacter = (character: TeamCharacter) => {
    setSelectedChatCharacter(character);
    // Clear chat history when switching characters for fresh conversations
    setChatMessages([`Now chatting with ${character.name} ${character.avatar}`]);
  };

  const handleCustomMessage = async () => {
    if (!customMessage.trim()) return;
    
    const messageToSend = customMessage;
    setChatMessages(prev => [...prev, `You: ${messageToSend}`]);
    setCustomMessage('');
    setIsCharacterTyping(true);

    // Send message via WebSocket if connected
    if (isConnected && isAuthenticated) {
      wsSendChatMessage(messageToSend);
    }
    
    // Generate dynamic AI response based on character and context
    const battleContext = {
      round: currentRound,
      playerHealth: Math.round((player1.hp / player1.maxHp) * 100),
      enemyHealth: Math.round((player2.hp / player2.maxHp) * 100),
      strategy: selectedStrategies,
      phase: phase.name
    };

    // Simulate thinking delay for realism
    await new Promise(resolve => safeSetTimeout(resolve, 1000 + Math.random() * 1500));
    
    // Use WebSocket chat instead of REST API
    // Create direct socket connection for chat (bypassing broken hook)
    const chatSocket = io('http://localhost:3006');
    
    chatSocket.emit('chat_message', {
      message: messageToSend,
      character: selectedChatCharacter.name.toLowerCase().replace(/\s+/g, '_'),
      characterData: {
        name: selectedChatCharacter.name,
        personality: selectedChatCharacter.name === 'Sherlock Holmes' ? {
          traits: ['Analytical', 'Dramatic', 'Passionate about justice', 'Violin player', 'Tobacco connoisseur', 'Witty', 'Sometimes arrogant'],
          speechStyle: 'Precise and deductive, but capable of passion and drama',
          motivations: ['Solving mysteries', 'Intellectual challenges', 'Justice', 'The thrill of deduction'],
          fears: ['Boredom', 'Unsolved cases', 'Mental stagnation'],
          interests: ['Violin music', 'Chemistry', 'Criminal psychology', 'Tobacco varieties', 'Opera'],
          quirks: ['Plays violin when thinking', 'Has strong opinions about cigars', 'Can be quite theatrical']
        } : selectedChatCharacter.name === 'Joan of Arc' ? {
          traits: ['Devout', 'Brave', 'Inspiring', 'Determined', 'Protective of others', 'Strategic minded'],
          speechStyle: 'Passionate and faithful, but also tactical and inspiring',
          motivations: ['Protecting France', 'Following divine calling', 'Liberating the oppressed', 'Leading others'],
          fears: ['Failing in her mission', 'Losing faith', 'Her people suffering'],
          interests: ['Military strategy', 'Prayer and faith', 'Protecting the innocent', 'French independence'],
          quirks: ['Feels the weight of divine responsibility', 'Cares deeply for her soldiers', 'Balances faith with pragmatism']
        } : selectedChatCharacter.name === 'Dracula' ? {
          traits: ['Aristocratic', 'Charming', 'Ancient wisdom', 'Predatory', 'Sophisticated', 'Lonely'],
          speechStyle: 'Eloquent and refined, with underlying menace and old-world charm',
          motivations: ['Power over mortals', 'Eternal existence', 'Sophisticated pleasures', 'Dominion'],
          fears: ['True death', 'Loneliness of immortality', 'Loss of power'],
          interests: ['Fine wine and blood', 'Classical music', 'Art and culture', 'Night creatures'],
          quirks: ['Speaks of centuries past', 'Appreciates beauty and refinement', 'Complex relationship with mortality']
        } : {
          traits: ['Mysterious', 'Wise', 'Thoughtful', 'Complex'],
          speechStyle: 'Thoughtful and measured',
          motivations: ['Knowledge', 'Understanding'],
          fears: ['Ignorance', 'Misunderstanding'],
          interests: ['Learning', 'Philosophy'],
          quirks: ['Speaks thoughtfully', 'Values wisdom']
        }
      },
      battleContext: {
        isInBattle: phase.name === 'round-combat',
        currentHealth: Math.round((player1.hp / player1.maxHp) * 100),
        maxHealth: 100,
        battlePhase: phase.name
      }
    });
    
    // Listen for response
    chatSocket.on('chat_response', (data) => {
      setChatMessages(prev => [...prev, `${formatCharacterName(data.character)}: ${data.message}`]);
      chatSocket.disconnect();
    });
    
    setIsCharacterTyping(false);
  };

  // Team chat handler
  const handleTeamChatMessage = (message: string) => {
    // Add coach message to team chat log
    setChatMessages(prev => [...prev, `Coach: ${message}`]);
    
    // Could trigger team chemistry changes based on message tone
    // TODO: Analyze message sentiment and adjust team morale
  };

  const proceedToRoundCombat = () => {
    setPhase({ name: 'round-combat' });
    setTimer(null);
    setIsTimerActive(false);
    const announcement = `Round ${currentRound} begins! The warriors clash in epic combat!`;
    setCurrentAnnouncement(announcement);
    announceRoundStart(currentRound);
    
    // Execute combat after a brief delay
    safeSetTimeout(() => {
      executeCombatRound();
    }, 3000);
  };

  const executeCombatRound = () => {
    // Determine turn order based on speed
    const p1Speed = player1.spd + Math.random() * 20;
    const p2Speed = player2.spd + Math.random() * 20;
    
    const firstAttacker = p1Speed >= p2Speed ? player1 : player2;
    const secondAttacker = p1Speed >= p2Speed ? player2 : player1;
    const isP1First = p1Speed >= p2Speed;
    
    // First attack
    const ability1 = firstAttacker.abilities[Math.floor(Math.random() * firstAttacker.abilities.length)];
    const action1 = checkForChaos(firstAttacker, secondAttacker, ability1, isP1First);
    
    setCurrentAnnouncement(action1.description);
    announceAction(action1.description, 500);
    
    // Check if battle is over using the returned HP value
    if (action1.newDefenderHP !== undefined && action1.newDefenderHP <= 0) {
      safeSetTimeout(() => {
        // Calculate battle rewards
        calculateBattleRewards(firstAttacker.name === player1.name, secondAttacker.name === player1.name ? player1 : player2);
        setPhase({ name: 'battle-end' });
        const victoryMessage = `Victory! ${firstAttacker.name} has defeated ${secondAttacker.name}!`;
        setCurrentAnnouncement(victoryMessage);
        announceMessage(victoryMessage, 'victory');
      }, 3000);
      return;
    }
    
    // Second attack (if still alive)
    safeSetTimeout(() => {
      const ability2 = secondAttacker.abilities[Math.floor(Math.random() * secondAttacker.abilities.length)];
      const action2 = checkForChaos(secondAttacker, firstAttacker, ability2, !isP1First);
      
      setCurrentAnnouncement(action2.description);
      announceAction(action2.description, 500);
      
      // Check if character dies - Death ends the MATCH immediately
      if (action2.newDefenderHP !== undefined && action2.newDefenderHP <= 0) {
        safeSetTimeout(() => {
          // Determine match winner (survivor wins the match)
          const matchWinner = secondAttacker.name === player1.name ? 'player' : 'opponent';
          const newPlayerMatchWins = matchWinner === 'player' ? playerMatchWins + 1 : playerMatchWins;
          const newOpponentMatchWins = matchWinner === 'opponent' ? opponentMatchWins + 1 : opponentMatchWins;
          
          // Update match wins
          if (matchWinner === 'player') {
            setPlayerMatchWins(newPlayerMatchWins);
          } else {
            setOpponentMatchWins(newOpponentMatchWins);
          }
          
          const victoryMessage = `${secondAttacker.name} kills ${firstAttacker.name}! Match ${currentMatch} goes to ${matchWinner === 'player' ? 'Player' : 'Opponent'}!`;
          setCurrentAnnouncement(victoryMessage);
          announceMessage(victoryMessage, 'victory');
          
          // Check if battle is over (2 out of 3 matches)
          if (newPlayerMatchWins >= 2) {
            calculateBattleRewards(true, secondAttacker.name === player1.name ? player1 : player2);
            setPhase({ name: 'battle-end' });
            setCurrentAnnouncement(`VICTORY! Player wins the battle ${newPlayerMatchWins}-${newOpponentMatchWins}!`);
          } else if (newOpponentMatchWins >= 2) {
            calculateBattleRewards(false, secondAttacker.name === player1.name ? player1 : player2);
            setPhase({ name: 'battle-end' });
            setCurrentAnnouncement(`DEFEAT! Opponent wins the battle ${newOpponentMatchWins}-${newPlayerMatchWins}!`);
          } else {
            // Start next match - reset round tracking, move to next match
            setCurrentMatch(prev => prev + 1);
            setCurrentRound(1);
            setPlayerRoundWins(0);
            setOpponentRoundWins(0);
            setPhase({ name: 'strategy-selection' });
            setCurrentAnnouncement(`Match ${currentMatch + 1} begins! Choose your strategy for the next fighters.`);
          }
        }, 3000);
        return;
      }
      
      // Round end (no death) - determine winner by HP comparison
      safeSetTimeout(() => {
        setPhase({ name: 'round-end' });
        
        // Determine round winner based on remaining HP
        const roundWinner = player1.hp > player2.hp ? 'player' : player1.hp < player2.hp ? 'opponent' : 'tie';
        const roundWinnerName = player1.hp > player2.hp ? player1.name : player1.hp < player2.hp ? player2.name : 'Tie';
        
        // Calculate new round wins immediately
        const newPlayerRoundWins = roundWinner === 'player' ? playerRoundWins + 1 : playerRoundWins;
        const newOpponentRoundWins = roundWinner === 'opponent' ? opponentRoundWins + 1 : opponentRoundWins;
        
        // Update round wins state
        if (roundWinner === 'player') {
          setPlayerRoundWins(newPlayerRoundWins);
        } else if (roundWinner === 'opponent') {
          setOpponentRoundWins(newOpponentRoundWins);
        }
        // If tie, no round wins are awarded
        
        const roundResultText = roundWinner === 'tie' ? `Round ${currentRound} ends in a tie!` : `Round ${currentRound} complete! ${roundWinnerName} wins this round!`;
        setCurrentAnnouncement(`${roundResultText} (Match ${currentMatch}: Player ${newPlayerRoundWins}-${newOpponentRoundWins} Opponent)`);
        
        safeSetTimeout(() => {
          // Check for 2-out-of-3 round victory (wins current match)
          if (newPlayerRoundWins >= 2) {
            // Player wins this match
            const newPlayerMatchWins = playerMatchWins + 1;
            setPlayerMatchWins(newPlayerMatchWins);
            
            if (newPlayerMatchWins >= 2) {
              // Player wins entire battle
              calculateBattleRewards(true, player1);
              setPhase({ name: 'battle-end' });
              setCurrentAnnouncement(`VICTORY! Player wins the battle ${newPlayerMatchWins}-${opponentMatchWins}!`);
            } else {
              // Start next match
              setCurrentMatch(prev => prev + 1);
              setCurrentRound(1);
              setPlayerRoundWins(0);
              setOpponentRoundWins(0);
              setPhase({ name: 'strategy-selection' });
              setCurrentAnnouncement(`Player wins Match ${currentMatch}! Match ${currentMatch + 1} begins - choose your strategy.`);
            }
          } else if (newOpponentRoundWins >= 2) {
            // Opponent wins this match
            const newOpponentMatchWins = opponentMatchWins + 1;
            setOpponentMatchWins(newOpponentMatchWins);
            
            if (newOpponentMatchWins >= 2) {
              // Opponent wins entire battle
              calculateBattleRewards(false, player2);
              setPhase({ name: 'battle-end' });
              setCurrentAnnouncement(`DEFEAT! Opponent wins the battle ${newOpponentMatchWins}-${playerMatchWins}!`);
            } else {
              // Start next match
              setCurrentMatch(prev => prev + 1);
              setCurrentRound(1);
              setPlayerRoundWins(0);
              setOpponentRoundWins(0);
              setPhase({ name: 'strategy-selection' });
              setCurrentAnnouncement(`Opponent wins Match ${currentMatch}! Match ${currentMatch + 1} begins - choose your strategy.`);
            }
          } else {
            // Next round - coaching phase
            setCurrentRound(prev => {
              const newRound = prev + 1;
              // Update battle state with new fighters for team battle
              if (battleState) {
                const nextPlayerIndex = (newRound - 1) % playerTeam.characters.length;
                const nextOpponentIndex = (newRound - 1) % opponentTeam.characters.length;
                
                setBattleState(prevState => {
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
            
            setPhase({ name: 'strategy-selection' });
            setCurrentAnnouncement(`Round ${currentRound + 1} Strategy Selection - Choose your warrior&apos;s approach for this round.`);
            setCoachingMessages([`Round ${currentRound + 1} Preparation - Choose one strategy from each category!`]);
            setSelectedStrategies({ attack: null, defense: null, special: null });
            setTimer(60); // Consistent 60 second timer
            setIsTimerActive(true);
          }
        }, 4000);
      }, 3000);
    }, 4000);
  };

  // Adapter function: Convert ImprovedBattleArena Character to BattleCharacter format
  const convertToBattleCharacter = (character: Character, morale: number): BattleCharacter => {
    return {
      character: {
        id: character.name.toLowerCase().replace(/\s+/g, '_'),
        name: character.name,
        archetype: character.personality || 'balanced',
        level: character.level,
        experience: character.xp,
        baseStats: {
          baseStats: {
          health: teamChar.maxHp,
          attack: teamChar.traditionalStats.strength + teamChar.temporaryStats.strength,
          defense: teamChar.traditionalStats.vitality + teamChar.temporaryStats.vitality,
          speed: teamChar.traditionalStats.speed + teamChar.temporaryStats.speed,
          special: 50 + teamChar.temporaryStats.spirit // Assuming spirit contributes to special
        },
        },
        abilities: character.abilities.map(ability => ({
          id: ability.name.toLowerCase().replace(/\s+/g, '_'),
          name: ability.name,
          type: ability.type === 'attack' ? 'offensive' : ability.type === 'defense' ? 'defensive' : 'support',
          description: ability.description || `${ability.name} ability`,
          damage_multiplier: ability.power / 100,
          cooldown: ability.cooldown || 0,
          mana_cost: 10 // Default mana cost for abilities
        })),
        equipment: character.items.map(item => ({
          id: item.name.toLowerCase().replace(/\s+/g, '_'),
          name: item.name,
          type: 'weapon', // Default type
          rarity: 'common', // Default rarity
          stats: {
            attack: 10, // Default weapon stats
            defense: 0,
            speed: 0
          }
        })),
        personalityTraits: character.personality ? [character.personality] : [],
        relationshipModifiers: {},
        battleMemories: []
      },
      currentHealth: character.hp,
      currentMana: 100, // Default mana
      physicalDamageDealt: character.battleStats?.damageDealt || 0,
      physicalDamageTaken: character.battleStats?.damageTaken || 0,
      statusEffects: character.statusEffects.map(effect => ({
        type: effect,
        duration: 3,
        intensity: 1,
        source: 'unknown'
      })),
      mentalState: {
        confidence: morale >= 75 ? 'high' : morale >= 50 ? 'moderate' : morale >= 25 ? 'low' : 'very_low',
        stress: morale <= 25 ? 'high' : morale <= 50 ? 'moderate' : 'low',
        focus: 'focused',
        mentalHealth: morale >= 60 ? 'excellent' : morale >= 40 ? 'good' : morale >= 20 ? 'fair' : 'poor'
      },
      teamRelationships: {},
      gameplanAdherence: character.trainingLevel / 100, // Convert 0-100 to 0-1
      roundsActive: 1,
      lastAction: null
    };
  };

  // Check for AI character deviation before executing ability
  const checkForChaos = (attacker: Character, defender: Character, ability: Ability, isAttacker1: boolean) => {
    // Get character's current psychology state
    const psychState = characterPsychology.get(attacker.id);
    if (!psychState) {
      // No psychology state, execute normally
      return executeAbility(attacker, defender, ability, isAttacker1);
    }
    
    // Calculate battle context for deviation risk
    const battleContext = {
      recentDamage: Math.max(0, attacker.maxHp - attacker.hp),
      teamPerformance: isAttacker1 ? playerMorale : opponentMorale,
      strategySuccessRate: 75, // TODO: Track actual strategy success
      opponentLevelDifference: defender.level - attacker.level,
      roundsWon: isAttacker1 ? playerRoundWins : opponentRoundWins,
      roundsLost: isAttacker1 ? opponentRoundWins : playerRoundWins
    };
    
    // Update psychology based on current state
    const factors = calculateStabilityFactors(
      // Convert Character to TeamCharacter format
      { 
        ...attacker, 
        id: attacker.id || attacker.name,
        avatar: attacker.avatar || '🥊',
        archetype: (attacker as any).archetype || 'warrior',
        rarity: 'common' as const,
        level: attacker.level,
        experience: 0,
        experienceToNext: 100,
        traditionalStats: {
          strength: attacker.str || 50,
          vitality: attacker.vit || 50,
          speed: attacker.spd || 50,
          dexterity: attacker.dex || 50,
          stamina: 50,
          intelligence: 50,
          charisma: 50,
          spirit: 50
        },
        currentHp: attacker.hp,
        maxHp: attacker.maxHp,
        psychStats: {
          training: 50,
          teamPlayer: 50,
          ego: 50,
          mentalHealth: psychState.mentalStability,
          communication: 50
        },
        temporaryStats: {
          strength: 0, vitality: 0, speed: 0, dexterity: 0,
          stamina: 0, intelligence: 0, charisma: 0, spirit: 0
        },
        abilities: attacker.abilities || [],
        battleStats: attacker.battleStats
      },
      battleContext
    );
    
    // Update psychology state
    const updatedPsychState = updatePsychologyState(psychState, factors);
    const newPsychMap = new Map(characterPsychology);
    newPsychMap.set(attacker.id, updatedPsychState);
    setCharacterPsychology(newPsychMap);
    
    // Calculate deviation risk
    const deviationRisk = calculateDeviationRisk(
      { 
        ...attacker, 
        id: attacker.id || attacker.name,
        avatar: attacker.avatar || '🥊',
        archetype: (attacker as any).archetype || 'warrior',
        rarity: 'common' as const,
        level: attacker.level,
        experience: 0,
        experienceToNext: 100,
        traditionalStats: {
          strength: attacker.str || 50,
          vitality: attacker.vit || 50,
          speed: attacker.spd || 50,
          dexterity: attacker.dex || 50,
          stamina: 50,
          intelligence: 50,
          charisma: 50,
          spirit: 50
        },
        currentHp: attacker.hp,
        maxHp: attacker.maxHp,
        psychStats: {
          training: 50,
          teamPlayer: 50,
          ego: 50,
          mentalHealth: psychState.mentalStability,
          communication: 50
        },
        temporaryStats: {
          strength: 0, vitality: 0, speed: 0, dexterity: 0,
          stamina: 0, intelligence: 0, charisma: 0, spirit: 0
        },
        abilities: attacker.abilities || [],
        battleStats: attacker.battleStats
      },
      updatedPsychState,
      factors
    );
    
    // Roll for deviation
    const deviation = rollForDeviation(deviationRisk);
    
    if (deviation) {
      // Character goes rogue! Handle the chaos
      return handleCharacterDeviation(deviation, attacker, defender, ability, isAttacker1);
    } else {
      // Normal execution
      return executeAbility(attacker, defender, ability, isAttacker1);
    }
  };

  // Handle character going rogue
  const handleCharacterDeviation = (
    deviation: DeviationEvent,
    attacker: Character,
    defender: Character,
    ability: Ability,
    isAttacker1: boolean
  ) => {
    // Add to active deviations
    setActiveDeviations(prev => [...prev, deviation]);
    
    // Get judge decision
    const judgeDecision = makeJudgeDecision(
      deviation,
      { 
        ...attacker, 
        id: attacker.id || attacker.name,
        avatar: attacker.avatar || '🥊',
        archetype: (attacker as any).archetype || 'warrior',
        rarity: 'common' as const,
        level: attacker.level,
        experience: 0,
        experienceToNext: 100,
        traditionalStats: {
          strength: attacker.str || 50,
          vitality: attacker.vit || 50,
          speed: attacker.spd || 50,
          dexterity: attacker.dex || 50,
          stamina: 50,
          intelligence: 50,
          charisma: 50,
          spirit: 50
        },
        currentHp: attacker.hp,
        maxHp: attacker.maxHp,
        psychStats: {
          training: 50,
          teamPlayer: 50,
          ego: 50,
          mentalHealth: 50,
          communication: 50
        },
        temporaryStats: {
          strength: 0, vitality: 0, speed: 0, dexterity: 0,
          stamina: 0, intelligence: 0, charisma: 0, spirit: 0
        },
        abilities: attacker.abilities || [],
        battleStats: attacker.battleStats
      },
      {
        currentRound,
        opponentCharacter: { 
          ...defender, 
          id: defender.id || defender.name,
          avatar: defender.avatar || '🥊',
          archetype: (defender as any).archetype || 'warrior',
          rarity: 'common' as const,
          level: defender.level,
          experience: 0,
          experienceToNext: 100,
          traditionalStats: {
            strength: defender.str || 50,
            vitality: defender.vit || 50,
            speed: defender.spd || 50,
            dexterity: defender.dex || 50,
            stamina: 50,
            intelligence: 50,
            charisma: 50,
            spirit: 50
          },
          currentHp: defender.hp,
          maxHp: defender.maxHp,
          psychStats: {
            training: 50,
            teamPlayer: 50,
            ego: 50,
            mentalHealth: 50,
            communication: 50
          },
          temporaryStats: {
            strength: 0, vitality: 0, speed: 0, dexterity: 0,
            stamina: 0, intelligence: 0, charisma: 0, spirit: 0
          },
          abilities: defender.abilities || [],
          battleStats: defender.battleStats
        },
        arenaCondition: 'pristine' // TODO: Track arena damage
      },
      currentJudge
    );
    
    // Add judge decision
    setJudgeDecisions(prev => [...prev, judgeDecision]);
    
    // Apply the judge's mechanical effect
    return applyChaosEffect(judgeDecision, attacker, defender, ability, isAttacker1);
  };

  // Apply the mechanical effect of chaos
  const applyChaosEffect = (
    judgeDecision: JudgeDecision,
    attacker: Character,
    defender: Character,
    ability: Ability,
    isAttacker1: boolean
  ) => {
    const effect = judgeDecision.mechanicalEffect;
    
    switch (effect.type) {
      case 'damage':
        if (effect.target === 'self') {
          const newAttackerHP = Math.max(0, attacker.hp - (effect.amount || 20));
          if (isAttacker1) {
            setPlayer1(prev => ({ ...prev, hp: newAttackerHP }));
          } else {
            setPlayer2(prev => ({ ...prev, hp: newAttackerHP }));
          }
          return {
            description: `${judgeDecision.narrative} - ${attacker.name} takes ${effect.amount} chaos damage!`,
            newDefenderHP: defender.hp,
            chaosEvent: true
          };
        } else if (effect.target === 'opponent') {
          const newDefenderHP = Math.max(0, defender.hp - (effect.amount || 20));
          if (isAttacker1) {
            setPlayer2(prev => ({ ...prev, hp: newDefenderHP }));
          } else {
            setPlayer1(prev => ({ ...prev, hp: newDefenderHP }));
          }
          return {
            description: `${judgeDecision.narrative} - ${defender.name} takes ${effect.amount} chaos damage!`,
            newDefenderHP,
            chaosEvent: true
          };
        }
        break;
        
      case 'skip_turn':
        return {
          description: `${judgeDecision.narrative} - ${attacker.name} forfeits their turn!`,
          newDefenderHP: defender.hp,
          chaosEvent: true
        };
        
      case 'redirect_attack':
        if (effect.target === 'teammate') {
          // Attack teammate instead - for now, just apply damage to attacker as friendly fire
          const friendlyFireDamage = (effect.amount || 15);
          const newAttackerHP = Math.max(0, attacker.hp - friendlyFireDamage);
          if (isAttacker1) {
            setPlayer1(prev => ({ ...prev, hp: newAttackerHP }));
          } else {
            setPlayer2(prev => ({ ...prev, hp: newAttackerHP }));
          }
          return {
            description: `${judgeDecision.narrative} - Friendly fire deals ${friendlyFireDamage} damage to ${attacker.name}!`,
            newDefenderHP: defender.hp,
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
  };

  const executeAbility = (attacker: Character, defender: Character, ability: Ability, isAttacker1: boolean) => {
    let damage = 0;
    let description = '';
    let newDefenderHP = defender.hp;
    let isCritical = false;

    if (ability.type === 'attack') {
      // Convert to BattleCharacter format for psychology-enhanced combat
      const attackerMorale = isAttacker1 ? playerMorale : opponentMorale;
      const defenderMorale = isAttacker1 ? opponentMorale : playerMorale;
      
      const battleAttacker = convertToBattleCharacter(attacker, attackerMorale);
      const battleDefender = convertToBattleCharacter(defender, defenderMorale);
      
      // Create ExecutedAction for the PhysicalBattleEngine
      const executedAction: ExecutedAction = {
        type: 'ability',
        abilityId: ability.name.toLowerCase().replace(/\s+/g, '_'),
        narrativeDescription: `${attacker.name} uses ${ability.name}`
      };
      
      // Use PhysicalBattleEngine for psychology-enhanced damage calculation
      const baseDamage = PhysicalBattleEngine.calculateBaseDamage(battleAttacker, executedAction);
      const weaponDamage = PhysicalBattleEngine.calculateWeaponDamage(battleAttacker, executedAction);
      const strengthBonus = PhysicalBattleEngine.calculateStrengthBonus(battleAttacker);
      const psychologyMod = PhysicalBattleEngine.calculatePsychologyModifier(battleAttacker, battleDefender, battleState);
      const armorDefense = PhysicalBattleEngine.calculateArmorDefense(battleDefender);
      
      // Combine all damage components with psychology modifiers and team chemistry
      const attackerTeam = isAttacker1 ? playerTeam : opponentTeam;
      const chemistryModifier = getTeamChemistryModifier(attackerTeam.teamChemistry);
      const totalAttack = (baseDamage + weaponDamage + strengthBonus) * psychologyMod * chemistryModifier;
      const finalDamage = Math.max(1, Math.round(totalAttack - armorDefense));
      
      // Check for critical hit (enhanced by psychology)
      const critChance = battleAttacker.mentalState.confidence === 'high' ? 0.15 : 
                        battleAttacker.mentalState.confidence === 'moderate' ? 0.1 : 0.05;
      isCritical = Math.random() < critChance;
      const critMultiplier = isCritical ? 2 : 1;
      
      damage = Math.round(finalDamage * critMultiplier);
      
      // Calculate new HP
      newDefenderHP = Math.max(0, defender.hp - damage);
      
      // Track battle stats
      const attackerStats = attacker.battleStats!;
      const defenderStats = defender.battleStats!;
      
      attackerStats.damageDealt += damage;
      attackerStats.skillsUsed += 1;
      if (isCritical) attackerStats.criticalHits += 1;
      
      defenderStats.damageTaken += damage;
      
      // Apply damage and update stats
      if (isAttacker1) {
        setPlayer1(prev => ({ ...prev, battleStats: attackerStats }));
        setPlayer2(prev => ({ ...prev, hp: newDefenderHP, battleStats: defenderStats }));
      } else {
        setPlayer2(prev => ({ ...prev, battleStats: attackerStats }));
        setPlayer1(prev => ({ ...prev, hp: newDefenderHP, battleStats: defenderStats }));
      }
      
      // Enhanced description with psychology effects
      let psychologyDesc = '';
      if (psychologyMod > 1.1) {
        psychologyDesc = ' [High Confidence Boost!]';
      } else if (psychologyMod < 0.9) {
        psychologyDesc = ' [Affected by stress/low confidence]';
      }
      
      description = `${attacker.name} uses ${ability.name} dealing ${damage} damage to ${defender.name}!${isCritical ? ' CRITICAL HIT!' : ''}${psychologyDesc}`;
    } else if (ability.type === 'defense') {
      description = `${attacker.name} uses ${ability.name} and gains defensive protection!`;
    } else {
      // Special abilities
      if (ability.name.includes('Rage') || ability.name.includes('Inferno')) {
        const specialDamage = Math.round(attacker.atk * 0.6);
        damage = specialDamage;
        newDefenderHP = Math.max(0, defender.hp - damage);
        
        // Track special ability stats
        const attackerStats = attacker.battleStats!;
        const defenderStats = defender.battleStats!;
        
        attackerStats.damageDealt += damage;
        attackerStats.skillsUsed += 1;
        defenderStats.damageTaken += damage;
        
        if (isAttacker1) {
          setPlayer1(prev => ({ ...prev, battleStats: attackerStats }));
          setPlayer2(prev => ({ ...prev, hp: newDefenderHP, battleStats: defenderStats }));
        } else {
          setPlayer2(prev => ({ ...prev, battleStats: attackerStats }));
          setPlayer1(prev => ({ ...prev, hp: newDefenderHP, battleStats: defenderStats }));
        }
        description = `${attacker.name} unleashes ${ability.name}, dealing ${damage} massive damage!`;
      } else {
        const healing = 25;
        const attackerStats = attacker.battleStats!;
        attackerStats.skillsUsed += 1;
        
        if (isAttacker1) {
          setPlayer1(prev => ({ 
            ...prev, 
            hp: Math.min(prev.maxHp, prev.hp + healing),
            battleStats: attackerStats
          }));
        } else {
          setPlayer2(prev => ({ 
            ...prev, 
            hp: Math.min(prev.maxHp, prev.hp + healing),
            battleStats: attackerStats
          }));
        }
        description = `${attacker.name} uses ${ability.name}, restoring ${healing} HP!`;
      }
    }

    return {
      round: currentRound,
      attacker: attacker.name,
      defender: defender.name,
      action: ability.name,
      damage,
      description,
      timestamp: Date.now(),
      newDefenderHP // Return the calculated HP for immediate checking
    };
  };

  const calculateBattleRewards = (player1Won: boolean, winningCharacter: Character) => {
    // Update battle stats with final round and total counts
    const stats = winningCharacter.battleStats!;
    stats.roundsSurvived = currentRound;
    stats.totalRounds = currentRound;
    
    // Calculate base rewards using the combat rewards system
    const baseRewards = combatRewards.calculateRewards(
      player1Won,
      winningCharacter.level,
      stats,
      player1Won ? player2.level : player1.level, // opponent level
      1.0 // membership multiplier (could be dynamic)
    );
    
    // Enhanced XP calculation with weight class bonuses if opponent was selected via matchmaking
    let enhancedXP = baseRewards.xpGained;
    let xpBonusDescription = '';
    
    if (selectedOpponent && player1Won) {
      const playerLevel = winningCharacter.level;
      const opponentLevel = selectedOpponent.opponent.teamLevel;
      const battleDuration = currentRound * 30; // Rough estimate
      
      const weightClassXP = calculateWeightClassXP(playerLevel, opponentLevel, true, battleDuration);
      enhancedXP = weightClassXP.amount;
      
      if (weightClassXP.weightClassBonus && weightClassXP.weightClassBonus > 1) {
        const bonusPercent = Math.round((weightClassXP.weightClassBonus - 1) * 100);
        xpBonusDescription = `Weight Class Bonus: +${bonusPercent}% XP for fighting above your level!`;
      }
    }
    
    const rewards = {
      ...baseRewards,
      xpGained: enhancedXP,
      xpBonusDescription
    };
    
    // Check for level up
    const newXP = winningCharacter.xp + rewards.xpGained;
    const leveledUp = newXP >= winningCharacter.xpToNext;
    
    if (leveledUp) {
      rewards.leveledUp = true;
      rewards.newLevel = winningCharacter.level + 1;
    }
    
    setBattleRewards({
      ...rewards,
      characterName: winningCharacter.name,
      characterAvatar: winningCharacter.avatar,
      isVictory: player1Won,
      oldLevel: winningCharacter.level,
      newLevel: leveledUp ? winningCharacter.level + 1 : winningCharacter.level,
      oldXP: winningCharacter.xp,
      newXP: leveledUp ? newXP - winningCharacter.xpToNext : newXP,
      xpToNext: leveledUp ? Math.floor(winningCharacter.xpToNext * 1.2) : winningCharacter.xpToNext
    });
    
    // Apply coaching points progression based on win/loss
    if (player1Won) {
      setPlayerTeam(prev => updateCoachingPointsAfterBattle(prev, true));
      setPlayer1(prev => ({
        ...prev,
        xp: leveledUp ? newXP - prev.xpToNext : newXP,
        level: leveledUp ? prev.level + 1 : prev.level,
        xpToNext: leveledUp ? Math.floor(prev.xpToNext * 1.2) : prev.xpToNext,
        // Apply stat bonuses
        atk: rewards.statBonuses.atk ? prev.atk + rewards.statBonuses.atk : prev.atk,
        def: rewards.statBonuses.def ? prev.def + rewards.statBonuses.def : prev.def,
        spd: rewards.statBonuses.spd ? prev.spd + rewards.statBonuses.spd : prev.spd,
        maxHp: rewards.statBonuses.hp ? prev.maxHp + rewards.statBonuses.hp : prev.maxHp
      }));
    } else {
      // Handle loss - apply coaching points degradation
      setPlayerTeam(prev => updateCoachingPointsAfterBattle(prev, false));
    }
    
    // Calculate combat skill progression
    const battlePerformance = createBattlePerformance(winningCharacter.name, {
      isVictory: player1Won,
      battleDuration: currentRound * 30, // Estimate based on rounds
      playerLevel: winningCharacter.level,
      opponentLevel: player1Won ? player2.level : player1.level,
      damageDealt: stats.damageDealt,
      damageTaken: stats.damageTaken,
      criticalHits: stats.criticalHits,
      abilitiesUsed: stats.skillsUsed,
      environment: 'arena'
    });

    // Mock character skills for demo
    const demoSkills: CharacterSkills = {
      characterId: winningCharacter.name,
      coreSkills: {
        combat: { level: Math.floor(winningCharacter.level * 0.8), experience: 450, maxLevel: 100 },
        survival: { level: Math.floor(winningCharacter.level * 0.6), experience: 320, maxLevel: 100 },
        mental: { level: Math.floor(winningCharacter.level * 0.7), experience: 380, maxLevel: 100 },
        social: { level: Math.floor(winningCharacter.level * 0.5), experience: 210, maxLevel: 100 },
        spiritual: { level: Math.floor(winningCharacter.level * 0.4), experience: 150, maxLevel: 100 }
      },
      signatureSkills: {},
      archetypeSkills: {},
      passiveAbilities: [],
      activeAbilities: [],
      unlockedNodes: [],
      skillPoints: 5,
      lastUpdated: new Date()
    };

    const skillReward = CombatSkillEngine.calculateSkillProgression(battlePerformance, demoSkills);
    setCombatSkillReward(skillReward);

    // Show rewards screen after a short delay
    safeSetTimeout(() => {
      setShowRewards(true);
    }, 2000);
  };

  const resetBattle = () => {
    setCurrentRound(1);
    setCurrentMatch(1);
    setPlayerMatchWins(0);
    setOpponentMatchWins(0);
    setPlayerRoundWins(0);
    setOpponentRoundWins(0);
    setSelectedOpponent(null);
    setShowMatchmaking(true);
    setPhase({ name: 'matchmaking' });
    setCurrentAnnouncement('Welcome to the Arena! Choose your opponent to begin battle!');
    setBattleCries({ player1: '', player2: '' });
    setTimer(null);
    setIsTimerActive(false);
    setCoachingMessages([]);
    setCharacterResponse('');
    setShowDisagreement(false);
    setSelectedStrategies({ attack: null, defense: null, special: null });
    setPendingStrategy(null);
    setChatMessages([]);
    setCustomMessage('');
    setIsCharacterTyping(false);
    
    // Reset rewards
    setShowRewards(false);
    setBattleRewards(null);
    setShowSkillProgression(false);
    setCombatSkillReward(null);
    
    // Reset character health, battle stats, and status
    setPlayerTeam(prevTeam => ({
      ...prevTeam,
      characters: prevTeam.characters.map(char => ({
        ...char,
        currentHp: char.maxHp,
        statusEffects: [],
        temporaryStats: { strength: 0, vitality: 0, speed: 0, dexterity: 0, stamina: 0, intelligence: 0, charisma: 0, spirit: 0 },
      })),
    }));
    setPlayer1(prev => ({
      ...prev,
      hp: prev.maxHp,
      statusEffects: [],
      battleStats: createBattleStats(),
      abilities: prev.abilities.map(a => ({ ...a, currentCooldown: 0 })),
      specialPowers: prev.specialPowers.map(p => ({ ...p, currentCooldown: 0 }))
    }));
    
    setPlayer2(prev => ({
      ...prev,
      hp: prev.maxHp,
      statusEffects: [],
      battleStats: createBattleStats(),
      abilities: prev.abilities.map(a => ({ ...a, currentCooldown: 0 })),
      specialPowers: prev.specialPowers.map(p => ({ ...p, currentCooldown: 0 }))
    }));
  };

  // Card Collection System Handlers
  const initializeCardCollection = useCallback(() => {
    // Initialize with current team characters and some additional demo cards
    const initialCards = [
      ...playerTeam.characters,
      ...opponentTeam.characters,
    ];
    setPlayerCards(initialCards);
  }, [playerTeam.characters, opponentTeam.characters]);

  const handleCardSelect = (characterId: string) => {
    if (selectedTeamCards.length < 3 && !selectedTeamCards.includes(characterId)) {
      setSelectedTeamCards(prev => [...prev, characterId]);
    }
  };

  const handleCardDeselect = (characterId: string) => {
    setSelectedTeamCards(prev => prev.filter(id => id !== characterId));
  };

  const handleCardsReceived = (newCards: TeamCharacter[]) => {
    setPlayerCards(prev => [...prev, ...newCards]);
    setPlayerCurrency(prev => prev + 100); // Bonus for opening packs
  };

  const handleCurrencySpent = (amount: number) => {
    setPlayerCurrency(prev => Math.max(0, prev - amount));
  };

  const buildTeamFromCards = () => {
    const selectedCards = playerCards.filter(card => selectedTeamCards.includes(card.id));
    if (selectedCards.length === 3) {
      const newTeam: Team = {
        ...playerTeam,
        characters: selectedCards,
        teamChemistry: 50, // Will be recalculated
      };
      setPlayerTeam(newTeam);
      setShowCardCollection(false);
      setSelectedTeamCards([]);
    }
  };

  // Initialize card collection on mount
  useEffect(() => {
    initializeCardCollection();
  }, [initializeCardCollection]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. Current Round Fighters (TOP) - Team Display fighters only */}
      <TeamDisplay
        playerTeam={playerTeam}
        opponentTeam={opponentTeam}
        currentRound={currentRound}
        phase={phase}
        battleCries={battleCries}
        chatMessages={chatMessages}
        customMessage={customMessage}
        isCharacterTyping={isCharacterTyping}
        chatContainerRef={chatContainerRef}
        selectedChatCharacter={selectedChatCharacter}
        onCustomMessageChange={setCustomMessage}
        onSendMessage={handleCustomMessage}
        playerRoundWins={playerRoundWins}
        opponentRoundWins={opponentRoundWins}
        currentMatch={currentMatch}
        playerMatchWins={playerMatchWins}
        opponentMatchWins={opponentMatchWins}
      />

      {/* AI Chaos Monitor - Shows during combat phases */}
      {(phase.name === 'round-combat' || phase.name === 'round-end' || activeDeviations.length > 0) && (
        <ChaosPanel
          characterPsychology={characterPsychology}
          activeDeviations={activeDeviations}
          judgeDecisions={judgeDecisions}
          currentJudge={currentJudge}
          isVisible={true}
        />
      )}

      {/* Character-Specific Strategy Panel */}
      {phase.name === 'strategy-selection' && (
        <CharacterSpecificStrategyPanel
          currentRound={currentRound}
          currentMatch={currentMatch}
          playerTeam={playerTeam}
          characterStrategies={characterStrategies}
          onStrategyChange={handleCharacterStrategyChange}
          onAllStrategiesComplete={handleAllCharacterStrategiesComplete}
          coachingMessages={coachingMessages}
          timeRemaining={timer || 0}
          isVisible={true}
        />
      )}

      {/* 2. Team Benches (MIDDLE) - Team Overview */}
      <TeamOverview
        playerTeam={playerTeam}
        playerMorale={playerMorale}
        onCharacterClick={conductIndividualCoaching}
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
            playerTeam={playerTeam}
            phase={phase}
            currentRound={currentRound}
            currentMatch={currentMatch}
            isVisible={true}
            onSendCoachMessage={handleTeamChatMessage}
          />
        </div>
      </div>

      {/* Matchmaking Panel - Positioned after Team Communication Hub */}
      {phase.name === 'matchmaking' && (
        <MatchmakingPanel
          playerTeamLevels={playerTeam.characters.map(char => char.level)}
          onSelectOpponent={handleOpponentSelection}
          isVisible={showMatchmaking}
        />
      )}


      {/* Start Battle Button */}
      {phase.name === 'pre-battle' && selectedOpponent && (
        <div className="text-center space-y-4">
          <button
            onClick={startTeamBattle}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-bold text-xl shadow-lg transition-all transform hover:scale-105"
          >
            Begin Team Battle!
          </button>
          <p className="text-gray-400 text-sm">
            3v3 Team Combat • Psychology & Chemistry Matter • Coach Wisely
          </p>
        </div>
      )}

      {/* Battle End - Victory/Restart */}
      {phase.name === 'battle-end' && (
        <motion.div 
          className="text-center space-y-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-6xl mb-4">
            {player1.hp > player2.hp ? '🏆' : player2.hp > player1.hp ? '💀' : '🤝'}
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4">
            {player1.hp <= 0 ? `${player2.name} Wins!` : 
             player2.hp <= 0 ? `${player1.name} Wins!` : 
             player1.hp > player2.hp ? `${player1.name} Wins!` : 
             `${player2.name} Wins!`}
          </h2>
          
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto text-center">
            <div className="bg-blue-600/20 p-4 rounded-lg">
              <h4 className="font-bold text-white">{player1.name}</h4>
              <p className="text-blue-300">{player1.hp} HP remaining</p>
            </div>
            <div className="bg-red-600/20 p-4 rounded-lg">
              <h4 className="font-bold text-white">{player2.name}</h4>
              <p className="text-red-300">{player2.hp} HP remaining</p>
            </div>
          </div>

          <button
            onClick={resetBattle}
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
        onCoachingSession={executeCoachingSession}
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
                onCardSelect={handleCardSelect}
                onCardDeselect={handleCardDeselect}
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
                  onClick={buildTeamFromCards}
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
        onCardsReceived={handleCardsReceived}
        availableCards={playerCards}
        playerCurrency={playerCurrency}
        onCurrencySpent={handleCurrencySpent}
      />

    </div>
  );
}