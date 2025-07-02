'use client';

import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BattleRewards from './BattleRewards';
import CombatSkillProgression from './CombatSkillProgression';
import AudioSettings from './AudioSettings';
import TradingCard from './TradingCard';
import CardCollection from './CardCollection';
import CardPackOpening from './CardPackOpening';
import { combatRewards, createBattleStats, BattleStats } from '@/data/combatRewards';
import { createBattlePerformance, CombatSkillEngine, CombatSkillReward } from '@/data/combatSkillProgression';
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

// Placeholder function for obedience checking
function checkObedience(
  character: any, 
  morale: number, 
  isInjured: boolean, 
  lastRoundWasRogue: boolean
): { willObey: boolean; reason: string } {
  const baseObedience = 0.8;
  const moraleBonus = morale * 0.001;
  const injuryPenalty = isInjured ? -0.2 : 0;
  const roguePenalty = lastRoundWasRogue ? -0.3 : 0;
  
  const obedienceChance = baseObedience + moraleBonus + injuryPenalty + roguePenalty;
  const willObey = Math.random() < obedienceChance;
  
  return {
    willObey,
    reason: willObey ? 'Character follows orders' : 'Character rebels against strategy'
  };
}
import { useBattleAnnouncer } from '@/hooks/useBattleAnnouncer';
import { useBattleWebSocket } from '@/hooks/useBattleWebSocket';
import { useTimeoutManager } from '@/hooks/useTimeoutManager';
import { Shield, Sword, Zap, Heart, MessageCircle, Sparkles, Timer, Volume2, AlertTriangle, Settings, VolumeX, CreditCard, Gift, Users, X, Gavel } from 'lucide-react';

// Import new team battle system
import { 
  TeamCharacter, 
  Team, 
  BattleState, 
  BattleSetup, 
  RoundResult,
  createDemoPlayerTeam,
  createDemoOpponentTeam,
  checkGameplanAdherence,
  getMentalHealthLevel,
  getMoraleModifier
} from '@/data/teamBattleSystem';
import { AIJudge, RogueAction, CharacterResponseGenerator } from '@/data/aiJudge';
import { CoachingEngine, CoachingSession } from '@/data/coachingSystem';

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

interface BattlePhase {
  name: 'pre-battle' | 'battle-cry' | 'strategy-selection' | 'round-combat' | 'round-end' | 'battle-end';
  subPhase?: string;
}

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
  const [playerTeam, setPlayerTeam] = useState<Team>(createDemoPlayerTeam());
  const [opponentTeam, setOpponentTeam] = useState<Team>(createDemoOpponentTeam());
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [playerMorale, setPlayerMorale] = useState(75);
  const [opponentMorale, setOpponentMorale] = useState(75);
  
  // Refs to avoid stale closures in async operations
  const battleStateRef = useRef<BattleState | null>(null);
  const currentRoundRef = useRef(1);
  const playerMoraleRef = useRef(75);
  const opponentMoraleRef = useRef(75);
  
  // Sync refs with state
  useEffect(() => {
    battleStateRef.current = battleState;
    currentRoundRef.current = currentRound;
    playerMoraleRef.current = playerMorale;
    opponentMoraleRef.current = opponentMorale;
  }, [battleState, currentRound, playerMorale, opponentMorale]);
  
  // Legacy battle state (for backward compatibility)
  const [phase, setPhase] = useState<BattlePhase>({ name: 'pre-battle' });
  const [currentAnnouncement, setCurrentAnnouncement] = useState('Welcome to the Arena! Assemble your team and begin the epic battle!');
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
  let battleAnnouncer;
  try {
    battleAnnouncer = useBattleAnnouncer();
  } catch (error) {
    console.error('BattleAnnouncer initialization failed:', error);
    battleAnnouncer = {
      isAnnouncerSpeaking: false,
      isEnabled: false,
      toggleEnabled: () => {},
      announceBattleStart: () => {},
      announceRoundStart: () => {},
      announceAction: () => {},
      announceVictory: () => {},
      announceDefeat: () => {},
      announcePhaseTransition: () => {},
      announceStrategySelection: () => {},
      announceBattleCry: () => {},
      clearQueue: () => {}
    };
  }
  
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
  } = battleAnnouncer;

  // WebSocket Battle Integration with ref for stability
  const socketRef = useRef<any>(null);
  const battleWebSocket = useBattleWebSocket();
  socketRef.current = battleWebSocket;
  
  const {
    isConnected,
    isAuthenticated,
    currentUser,
    error: wsError,
    matchResult,
    battleState: wsBattleState,
    findMatch,
    joinBattle,
    selectStrategy: wsSelectStrategy,
    sendChatMessage: wsSendChatMessage,
    clearError,
    onBattleStart,
    onRoundStart,
    onRoundEnd,
    onBattleEnd,
    onChatMessage
  } = battleWebSocket;
  
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
  
  // Character Chat
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [isCharacterTyping, setIsCharacterTyping] = useState(false);
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

  const [player1, setPlayer1] = useState<Character>({
    name: 'Achilles',
    maxHp: 100,
    hp: 100,
    atk: 85,
    def: 70,
    spd: 95,
    level: 12,
    xp: 2400,
    xpToNext: 800,
    trainingLevel: 85, // High training = better gameplan adherence
    avatar: '⚔️',
    battleStats: createBattleStats(),
    statusEffects: [],
    abilities: [
      { name: 'Spear Thrust', type: 'attack', power: 25, cooldown: 1, currentCooldown: 0, description: 'A precise spear attack', icon: '🗡️' },
      { name: 'Shield Wall', type: 'defense', power: 0, cooldown: 3, currentCooldown: 0, description: 'Raises defense for 2 turns', icon: '🛡️' },
      { name: 'Rage of Achilles', type: 'special', power: 45, cooldown: 4, currentCooldown: 0, description: 'Devastating berserker attack', icon: '💥' }
    ],
    items: [
      { name: 'Health Potion', type: 'healing', effect: 'Restore 30 HP', icon: '🧪', description: 'Restores health instantly', uses: 2 }
    ],
    specialPowers: [
      { name: 'Divine Protection', type: 'resistance', description: 'Thetis shields her son', effect: '25% magic resistance', icon: '🌊', cooldown: 3, currentCooldown: 0 },
      { name: 'Heroic Inspiration', type: 'amplifier', description: 'Legendary presence boosts allies', effect: '+20% damage when health below 50%', icon: '✨', cooldown: 2, currentCooldown: 0 }
    ]
  });

  const [player2, setPlayer2] = useState<Character>({
    name: 'Dragon',
    maxHp: 120,
    hp: 120,
    atk: 90,
    def: 60,
    spd: 70,
    level: 10,
    xp: 1800,
    xpToNext: 900,
    trainingLevel: 45, // Lower training = more likely to deviate from gameplan
    avatar: '🐉',
    battleStats: createBattleStats(),
    statusEffects: [],
    abilities: [
      { name: 'Fire Breath', type: 'attack', power: 30, cooldown: 2, currentCooldown: 0, description: 'Scorching flames', icon: '🔥' },
      { name: 'Scale Armor', type: 'defense', power: 0, cooldown: 3, currentCooldown: 0, description: 'Hardens scales', icon: '🛡️' },
      { name: 'Inferno', type: 'special', power: 50, cooldown: 5, currentCooldown: 0, description: 'Area of destruction', icon: '💥' }
    ],
    items: [],
    specialPowers: [
      { name: 'Dragon Hoard', type: 'amplifier', description: 'Ancient treasures boost power', effect: '+15% damage per treasure collected', icon: '💎', cooldown: 4, currentCooldown: 0 },
      { name: 'Fire Immunity', type: 'resistance', description: 'Immune to fire-based attacks', effect: '100% fire resistance', icon: '🔥', cooldown: 0, currentCooldown: 0 }
    ]
  });

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
  const handleTimerExpiredRef = useRef<() => void>();
  handleTimerExpiredRef.current = handleTimerExpired;
  
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
    battleAnnouncer.announceBattleStart(data.player1?.username || 'Player 1', data.player2?.username || 'Player 2');
  }, []);

  const handleRoundStart = useCallback((data: any) => {
    console.log('Round starting:', data);
    setCurrentRound(data.round || 1);
    setCurrentAnnouncement(`Round ${data.round || 1} begins!`);
    setPhase({ name: 'round-combat' });
    battleAnnouncer.announceRoundStart(data.round || 1);
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
      battleAnnouncer.announceVictory(result.winnerName || 'You');
    } else {
      battleAnnouncer.announceDefeat(result.loserName || 'You');
    }
    
    // Show rewards if available
    if (result.rewards) {
      setBattleRewards(result.rewards);
      setShowRewards(true);
    }
  }, []);

  const handleChatMessage = useCallback((message: any) => {
    console.log('Chat message received:', message);
    setChatMessages(prev => [...prev, message.text || message.message || 'Message received']);
  }, []);

  // WebSocket event setup with proper cleanup
  useEffect(() => {
    const unsubscribeBattleStart = onBattleStart(handleBattleStart);
    const unsubscribeRoundStart = onRoundStart(handleRoundStart);
    const unsubscribeRoundEnd = onRoundEnd(handleRoundEnd);
    const unsubscribeBattleEnd = onBattleEnd(handleBattleEnd);
    const unsubscribeChatMessage = onChatMessage(handleChatMessage);

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

  const allStrategiesSelected = () => {
    return selectedStrategies.attack && selectedStrategies.defense && selectedStrategies.special;
  };

  // New Team Battle Functions
  const startTeamBattle = () => {
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
    setCurrentAnnouncement(`Team Battle: ${playerTeam.name} vs ${opponentTeam.name}! Prepare for epic 3v3 combat!`);

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
      `Current Team Chemistry: ${playerTeam.teamChemistry}% | Team Morale: ${playerMorale}%`,
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
    const announcement = `Strategy Planning Phase - Choose your team&apos;s approach for battle!`;
    setCurrentAnnouncement(announcement);
    announceStrategySelection();
    setCoachingMessages(prev => [
      ...(currentRound === 1 ? [`Welcome, Coach! This is your pre-battle strategy session. Review your team and select initial strategies.`] : prev),
      `Choose one approach from each category for Round ${currentRound}!`
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
    
    const announcement = `Round ${currentRound}: ${playerFighter.name} vs ${opponentFighter.name}!`;
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

    // Check if player character will obey orders
    const obedienceCheck = checkObedience(
      playerFighter, 
      playerMorale, 
      playerFighter.injuries.length > 0,
      currentRound > 1 && playerMorale < 50
    );

    let roundResult: RoundResult | null = null;

    if (!obedienceCheck.willObey) {
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

      // Generate coaching response
      const coachResponse = AIJudge.generateCoachingResponse(rogueAction, ruling, playerTeam.coachName);
      const characterResponse = CharacterResponseGenerator.generateResponse(playerFighter, rogueAction, coachResponse);
      
      setCoachingMessages(prev => [...prev, coachResponse, `${playerFighter.name}: ${characterResponse}`]);
      
    } else {
      // Character follows orders - normal combat
      const damage = Math.floor(playerFighter.traditionalStats.strength * getMoraleModifier(playerMorale));
      
      roundResult = {
        round: currentRound,
        attacker: playerFighter,
        defender: opponentFighter,
        attackerAction: playerFighter.abilities[0] || 'refused',
        damage,
        wasStrategyAdherent: true,
        moraleImpact: 5, // Small morale boost for gameplan adherence
        newAttackerHp: playerFighter.currentHp,
        newDefenderHp: opponentFighter.currentHp - damage,
        narrativeDescription: `${playerFighter.name} follows the strategy perfectly and strikes ${opponentFighter.name}!`
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
        } else if (currentRoundValue >= 9) { // Max 9 rounds for demo
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
      
      const chemistryUpdate = `Post-battle team chemistry: ${newChemistry}% ${newChemistry > playerTeam.teamChemistry ? '(+)' : '(-)'}`;
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
      playerTeam.coachName,
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
    battleAnnouncer.announceBattleCry();
    
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
        fetch('http://localhost:4000/api/chat', {
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
    const obedienceBonus = 20; // Insisting gives a bonus to obedience
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
    
    try {
      // Call real AI backend
      const battleContext = {
        round: currentRound,
        playerHealth: Math.round((player1.hp / player1.maxHp) * 100),
        enemyHealth: Math.round((player2.hp / player2.maxHp) * 100),
        strategy: selectedStrategies,
        phase: phase.name
      };

      const timeoutPromise = new Promise((_, reject) =>
        safeSetTimeout(() => reject(new Error('API timeout')), 5000) // 5 second timeout
      );

      const response = await Promise.race([
        fetch('http://localhost:4000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            character: player1.name,
            message: messageToSend,
            battleContext
          })
        }),
        timeoutPromise
      ]);

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      if (data.success) {
        setChatMessages(prev => [...prev, `${player1.name}: ${data.response}`]);
      } else {
        setChatMessages(prev => [...prev, `${player1.name}: I hear you, coach.`]);
      }
    } catch (error) {
      console.warn('Chat API not available or timed out, using fallback response.');
      const fallbackResponses = [
        `I hear you, coach. Let&apos;s focus on the battle.`, 
        `Understood. My mind is on the fight.`, 
        `Right, coach. Battle first, talk later.`
      ];
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      setChatMessages(prev => [...prev, `${player1.name}: ${fallback}`]);
    }
    
    setIsCharacterTyping(false);
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
    const action1 = executeAbility(firstAttacker, secondAttacker, ability1, isP1First);
    
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
      const action2 = executeAbility(secondAttacker, firstAttacker, ability2, !isP1First);
      
      setCurrentAnnouncement(action2.description);
      announceAction(action2.description, 500);
      
      // Check if battle is over using the returned HP value
      if (action2.newDefenderHP !== undefined && action2.newDefenderHP <= 0) {
        safeSetTimeout(() => {
          // Calculate battle rewards
          calculateBattleRewards(secondAttacker.name === player1.name, firstAttacker.name === player1.name ? player1 : player2);
          setPhase({ name: 'battle-end' });
          const victoryMessage = `Victory! ${secondAttacker.name} has defeated ${firstAttacker.name}!`;
          setCurrentAnnouncement(victoryMessage);
          announceMessage(victoryMessage, 'victory');
        }, 3000);
        return;
      }
      
      // Round end
      safeSetTimeout(() => {
        setPhase({ name: 'round-end' });
        setCurrentAnnouncement(`Round ${currentRound} complete! Both warriors prepare for the next round.`);
        
        safeSetTimeout(() => {
          if (currentRound >= 5) {
            // Battle end after 5 rounds
            const winner = player1.hp > player2.hp ? player1.name : player2.name;
            const winningCharacter = player1.hp > player2.hp ? player1 : player2;
            // Calculate battle rewards
            calculateBattleRewards(winner === player1.name, winningCharacter);
            setPhase({ name: 'battle-end' });
            setCurrentAnnouncement(`Final Victory! ${winner} wins the epic battle!`);
          } else {
            // Next round - coaching phase
            setCurrentRound(prev => prev + 1);
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

  const executeAbility = (attacker: Character, defender: Character, ability: Ability, isAttacker1: boolean) => {
    let damage = 0;
    let description = '';
    let newDefenderHP = defender.hp;
    let isCritical = false;

    if (ability.type === 'attack') {
      const baseDamage = attacker.atk * (ability.power / 100);
      const defense = defender.def * 0.5;
      const variance = 0.85 + Math.random() * 0.3;
      
      // Check for critical hit (10% chance)
      isCritical = Math.random() < 0.1;
      let critMultiplier = isCritical ? 2 : 1;
      
      damage = Math.max(1, Math.round((baseDamage - defense) * variance * critMultiplier));
      
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
      
      description = `${attacker.name} uses ${ability.name} dealing ${damage} damage to ${defender.name}!${isCritical ? ' CRITICAL HIT!' : ''}`;
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
    
    // Calculate rewards using the combat rewards system
    const rewards = combatRewards.calculateRewards(
      player1Won,
      winningCharacter.level,
      stats,
      player1Won ? player2.level : player1.level, // opponent level
      1.0 // membership multiplier (could be dynamic)
    );
    
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
    
    // Apply rewards to winning character
    if (player1Won) {
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
    setPhase({ name: 'pre-battle' });
    setCurrentAnnouncement('Welcome to the Arena! Click "Begin Epic Battle!" to start.');
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
      {/* Announcer Box */}
      <motion.div 
        className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl p-6 backdrop-blur-sm border border-purple-500"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          {isAnnouncerEnabled ? (
            <Volume2 className={`w-6 h-6 ${isAnnouncerSpeaking ? 'text-yellow-400 animate-pulse' : 'text-purple-300'}`} />
          ) : (
            <VolumeX className="w-6 h-6 text-gray-500" />
          )}
          <h2 className="text-2xl font-bold text-white">Battle Announcer</h2>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className={`text-sm ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {isAuthenticated && currentUser && (
              <span className="text-sm text-blue-300 ml-2">
                Playing as: {currentUser.username}
              </span>
            )}
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => toggleAnnouncer(!isAnnouncerEnabled)}
              className={`p-2 rounded-lg transition-all ${
                isAnnouncerEnabled 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
              title={isAnnouncerEnabled ? 'Disable Voice' : 'Enable Voice'}
            >
              {isAnnouncerEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={() => setShowAudioSettings(true)}
              className="p-2 bg-gray-600 hover:bg-gray-700 text-gray-300 rounded-lg transition-all"
              title="Audio Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            {/* Card Collection Controls */}
            <div className="w-px h-6 bg-gray-500 mx-2" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCardCollection(true)}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                title="Card Collection"
              >
                <CreditCard className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setShowCardPacks(true)}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
                title="Buy Card Packs"
              >
                <Gift className="w-4 h-4" />
              </button>
              
              <div className="text-yellow-400 font-mono text-sm">
                {playerCurrency} 💰
              </div>
            </div>
            
            {timer !== null && (
              <>
                <div className="w-px h-6 bg-gray-500 mx-2" />
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-yellow-400" />
                  <span className="text-xl font-mono text-yellow-400">{timer}s</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div 
          ref={announcementRef}
          className="bg-black/40 rounded-lg p-6 min-h-32 flex items-center justify-center text-white"
        >
          <motion.div
            key={currentAnnouncement}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-lg leading-relaxed"
          >
            {currentAnnouncement}
          </motion.div>
        </div>
      </motion.div>

      {/* Character Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Player 1 */}
        <motion.div 
          className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-blue-500"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="text-center mb-4">
            <div className="text-6xl mb-2">{player1.avatar}</div>
            <h3 className="text-xl font-bold text-white">{player1.name}</h3>
            <div className="text-sm text-gray-200">Training Level: {player1.trainingLevel}/100</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <div className="flex-1 bg-gray-700 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all"
                  style={{ width: `${(player1.hp / player1.maxHp) * 100}%` }}
                />
              </div>
              <span className="text-sm text-white">{player1.hp}/{player1.maxHp}</span>
            </div>
            
            {player1.statusEffects.includes('Berserk') && (
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                <span className="text-sm">BERSERK MODE</span>
              </div>
            )}
          </div>

          {phase.name === 'battle-cry' && battleCries.player1 && (
            <motion.div 
              className="mt-4 p-3 bg-blue-600/30 rounded-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <p className="text-sm italic text-blue-100">&quot;{battleCries.player1}&quot;</p>
            </motion.div>
          )}
        </motion.div>

        {/* AI Judge Visual Representation */}
        <motion.div
          className="bg-gradient-to-r from-gray-700/40 to-gray-900/40 rounded-xl p-4 backdrop-blur-sm border border-gray-600 flex items-center justify-center gap-3 mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Gavel className="w-8 h-8 text-yellow-300 animate-pulse" />
          <h3 className="text-xl font-bold text-white">AI Judge Presiding</h3>
        </motion.div>

        {/* Battle Status */}
        <div className="flex flex-col items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl mb-4"
          >
            ⚔️
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">Round {currentRound}</h2>
          <p className="text-lg text-gray-300">{phase.name.replace('-', ' ').toUpperCase()}</p>
        </div>

        {/* Player 2 */}
        <motion.div 
          className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-red-500"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="text-center mb-4">
            <div className="text-6xl mb-2">{player2.avatar}</div>
            <h3 className="text-xl font-bold text-white">{player2.name}</h3>
            <div className="text-sm text-gray-200">Training Level: {player2.trainingLevel}/100</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <div className="flex-1 bg-gray-700 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all"
                  style={{ width: `${(player2.hp / player2.maxHp) * 100}%` }}
                />
              </div>
              <span className="text-sm text-white">{player2.hp}/{player2.maxHp}</span>
            </div>
          </div>

          {phase.name === 'battle-cry' && battleCries.player2 && (
            <motion.div 
              className="mt-4 p-3 bg-red-600/30 rounded-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <p className="text-sm italic text-red-100">&quot;{battleCries.player2}&quot;</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Character Chat Panel */}
      <motion.div 
        className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-6 backdrop-blur-sm border border-blue-500 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          Chat with {player1.name}
        </h3>
        
        <div 
          ref={chatContainerRef}
          className="bg-black/40 rounded-lg p-4 h-64 overflow-y-auto mb-4"
        >
          {chatMessages.length === 0 ? (
            <div className="text-gray-200 text-center py-8">
              Chat with your warrior! Encourage them, ask about strategy, or just talk.
            </div>
          ) : (
            chatMessages.map((msg, index) => (
              <motion.div 
                key={index} 
                className={`mb-2 ${msg.startsWith('You:') ? 'text-blue-100' : 'text-purple-100'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {msg}
              </motion.div>
            ))
          )}
          {isCharacterTyping && (
            <motion.div 
              className="text-purple-100 italic mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {player1.name} is thinking...
            </motion.div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomMessage()}
            placeholder={`Send a message to ${player1.name}...`}
            className="flex-1 px-4 py-3 bg-black/40 border border-gray-600 rounded text-white placeholder-gray-300 focus:outline-none focus:border-blue-500 text-lg"
            disabled={isCharacterTyping}
          />
          <button
            onClick={handleCustomMessage}
            disabled={isCharacterTyping || !customMessage.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Coaching Interface */}
      {phase.name === 'strategy-selection' && (
        <motion.div 
          className="bg-gradient-to-r from-green-900/40 to-blue-900/40 rounded-xl p-6 backdrop-blur-sm border border-green-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            {currentRound === 1 ? 'Pre-Battle Strategy Session' : `Strategy Coaching Session - Round ${currentRound}`}
          </h3>

          {/* Strategy Status */}
          <div className="mb-4 p-3 bg-blue-600/20 rounded-lg border border-blue-500">
            <h4 className="text-sm font-bold text-blue-100 mb-2">Strategy Selection (AI will choose unselected categories):</h4>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className={`p-2 rounded ${selectedStrategies.attack ? 'bg-green-600/30 text-green-100' : 'bg-gray-600/30 text-gray-100'}`}>
                <div className="font-bold">Attack</div>
                <div>{selectedStrategies.attack ? `✓ ${selectedStrategies.attack}` : 'AI will choose'}</div>
              </div>
              <div className={`p-2 rounded ${selectedStrategies.defense ? 'bg-green-600/30 text-green-100' : 'bg-gray-600/30 text-gray-100'}`}>
                <div className="font-bold">Defense</div>
                <div>{selectedStrategies.defense ? `✓ ${selectedStrategies.defense}` : 'AI will choose'}</div>
              </div>
              <div className={`p-2 rounded ${selectedStrategies.special ? 'bg-green-600/30 text-green-100' : 'bg-gray-600/30 text-gray-100'}`}>
                <div className="font-bold">Special</div>
                <div>{selectedStrategies.special ? `✓ ${selectedStrategies.special}` : 'AI will choose'}</div>
              </div>
            </div>
          </div>
          
          <div 
            ref={coachingRef}
            className="bg-black/40 rounded-lg p-4 h-64 overflow-y-auto mb-4"
          >
            {coachingMessages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`mb-2 p-2 rounded ${
                  msg.startsWith('Coach:') ? 'bg-green-600/20 text-green-200' : 
                  msg.includes('⚠️') ? 'bg-red-600/20 text-red-200' :
                  'bg-blue-600/20 text-blue-200'
                }`}
              >
                {msg}
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-100 mb-2">Attack Strategy</h4>
              <div className="space-y-2">
                {player1.abilities.filter(a => a.type === 'attack').map((ability, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStrategyRecommendation('attack', ability.name)}
                    className="w-full p-2 bg-red-600/30 hover:bg-red-600/50 rounded text-white text-sm transition-colors"
                  >
                    {ability.icon} {ability.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-100 mb-2">Defense Strategy</h4>
              <div className="space-y-2">
                {player1.abilities.filter(a => a.type === 'defense').map((ability, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStrategyRecommendation('defense', ability.name)}
                    className="w-full p-2 bg-blue-600/30 hover:bg-blue-600/50 rounded text-white text-sm transition-colors"
                  >
                    {ability.icon} {ability.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-100 mb-2">Special Powers</h4>
              <div className="space-y-2">
                {player1.specialPowers.map((power, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStrategyRecommendation('special', power.name)}
                    disabled={power.currentCooldown > 0}
                    className={`w-full p-2 rounded text-white text-sm transition-colors ${
                      power.currentCooldown > 0 
                        ? 'bg-gray-600/30 cursor-not-allowed opacity-50' 
                        : 'bg-purple-600/30 hover:bg-purple-600/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{power.icon} {power.name}</span>
                      {power.currentCooldown > 0 && (
                        <span className="text-xs">({power.currentCooldown})</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-100 mt-1">{power.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* WebSocket Strategy Selection */}
          <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500 rounded-lg">
            <h4 className="text-lg font-bold text-purple-100 mb-3 text-center">Final Strategy Selection</h4>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleFinalStrategySelection('aggressive')}
                disabled={!isConnected || !isAuthenticated}
                className="p-4 bg-red-600/30 hover:bg-red-600/50 disabled:bg-gray-600/30 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
              >
                <div className="text-2xl mb-2">⚔️</div>
                <div className="text-sm">Aggressive</div>
                <div className="text-xs text-gray-300 mt-1">High risk, high reward</div>
              </button>
              
              <button
                onClick={() => handleFinalStrategySelection('balanced')}
                disabled={!isConnected || !isAuthenticated}
                className="p-4 bg-blue-600/30 hover:bg-blue-600/50 disabled:bg-gray-600/30 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
              >
                <div className="text-2xl mb-2">⚖️</div>
                <div className="text-sm">Balanced</div>
                <div className="text-xs text-gray-300 mt-1">Steady and reliable</div>
              </button>
              
              <button
                onClick={() => handleFinalStrategySelection('defensive')}
                disabled={!isConnected || !isAuthenticated}
                className="p-4 bg-green-600/30 hover:bg-green-600/50 disabled:bg-gray-600/30 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
              >
                <div className="text-2xl mb-2">🛡️</div>
                <div className="text-sm">Defensive</div>
                <div className="text-xs text-gray-300 mt-1">Safety first approach</div>
              </button>
            </div>
            {(!isConnected || !isAuthenticated) && (
              <div className="text-red-300 text-sm text-center mt-2">
                Must be connected to battle server to select strategy
              </div>
            )}
          </div>

          {showDisagreement && (
            <motion.div 
              className="mt-4 p-4 bg-yellow-600/20 border border-yellow-500 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-yellow-200 mb-3">Your warrior disagrees with your strategy!</p>
              <button
                onClick={insistOnStrategy}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-bold transition-colors"
              >
                Insist on Your Strategy
              </button>
            </motion.div>
          )}

          {/* Proceed to Combat Button */}
          {!showDisagreement && (
            <motion.div 
              className="mt-4 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <button
                onClick={() => {
                  setTimer(null);
                  setIsTimerActive(false);
                  handleTimerExpired(); // This will auto-fill missing strategies and proceed
                }}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105"
              >
                🚀 Proceed to Combat!
              </button>
              <p className="text-xs text-gray-400 mt-2">AI will choose any unselected strategies</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Team Overview & Psychology */}
      <motion.div
        className="bg-gradient-to-r from-gray-900/60 to-gray-800/60 rounded-xl p-6 border border-gray-600 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-white mb-4 text-center">🏆 {playerTeam.name} 🏆</h2>
        
        {/* Team Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center bg-gray-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">{playerTeam.teamChemistry}%</div>
            <div className="text-sm text-gray-400">Team Chemistry</div>
          </div>
          <div className="text-center bg-gray-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">{playerMorale}%</div>
            <div className="text-sm text-gray-400">Team Morale</div>
          </div>
          <div className="text-center bg-gray-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-400">{playerTeam.averageLevel}</div>
            <div className="text-sm text-gray-400">Avg Level</div>
          </div>
          <div className="text-center bg-gray-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-400">{playerTeam.wins}-{playerTeam.losses}</div>
            <div className="text-sm text-gray-400">W-L Record</div>
          </div>
        </div>

        {/* Team Members */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {playerTeam.characters.map((character, index) => (
            <motion.div
              key={character.id}
              className="bg-gray-800/30 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => conductIndividualCoaching(character)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">{character.avatar}</div>
                <div>
                  <h3 className="text-lg font-bold text-white">{character.name}</h3>
                  <p className="text-sm text-gray-400">Level {character.level} {character.archetype}</p>
                </div>
              </div>
              
              {/* Psychology Stats */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Mental Health:</span>
                  <span className={`font-bold ${
                    character.psychStats.mentalHealth >= 80 ? 'text-green-400' :
                    character.psychStats.mentalHealth >= 50 ? 'text-yellow-400' :
                    character.psychStats.mentalHealth >= 25 ? 'text-orange-400' : 'text-red-400'
                  }`}>{character.psychStats.mentalHealth}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Training:</span>
                  <span className="text-blue-400 font-bold">{character.psychStats.training}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Team Player:</span>
                  <span className="text-purple-400 font-bold">{character.psychStats.teamPlayer}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ego:</span>
                  <span className="text-red-400 font-bold">{character.psychStats.ego}%</span>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="mt-3 flex gap-1">
                {character.psychStats.mentalHealth < 30 && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Crisis</span>
                )}
                {character.restDaysNeeded > 0 && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">Needs Rest</span>
                )}
                {character.psychStats.ego > 80 && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">High Ego</span>
                )}
              </div>

              <div className="mt-2 text-xs text-gray-500">Click to coach this character</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Start Battle Button */}
      {phase.name === 'pre-battle' && (
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

      {/* Coaching Modal */}
      <AnimatePresence>
        {showCoachingModal && selectedCharacterForCoaching && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-2xl w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">{selectedCharacterForCoaching.avatar}</div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCharacterForCoaching.name}</h2>
                  <p className="text-gray-400">Individual Coaching Session</p>
                </div>
              </div>

              {/* Current Psychology State */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Current Psychology</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mental Health:</span>
                    <span className={`font-bold ${
                      selectedCharacterForCoaching.psychStats.mentalHealth >= 80 ? 'text-green-400' :
                      selectedCharacterForCoaching.psychStats.mentalHealth >= 50 ? 'text-yellow-400' :
                      selectedCharacterForCoaching.psychStats.mentalHealth >= 25 ? 'text-orange-400' : 'text-red-400'
                    }`}>{selectedCharacterForCoaching.psychStats.mentalHealth}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Training:</span>
                    <span className="text-blue-400 font-bold">{selectedCharacterForCoaching.psychStats.training}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Team Player:</span>
                    <span className="text-purple-400 font-bold">{selectedCharacterForCoaching.psychStats.teamPlayer}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ego:</span>
                    <span className="text-red-400 font-bold">{selectedCharacterForCoaching.psychStats.ego}%</span>
                  </div>
                </div>
              </div>

              {/* Coaching Options */}
              <div className="space-y-3 mb-6">
                <h3 className="text-lg font-semibold text-white">Choose Coaching Focus:</h3>
                
                <button
                  onClick={() => executeCoachingSession('performance')}
                  className="w-full p-4 bg-blue-600/20 border border-blue-500/50 rounded-lg text-left hover:bg-blue-600/30 transition-all"
                >
                  <div className="text-white font-semibold">🎯 Performance Coaching</div>
                  <div className="text-gray-400 text-sm">Improve training and combat effectiveness</div>
                </button>

                <button
                  onClick={() => executeCoachingSession('mental_health')}
                  className="w-full p-4 bg-green-600/20 border border-green-500/50 rounded-lg text-left hover:bg-green-600/30 transition-all"
                >
                  <div className="text-white font-semibold">🧠 Mental Health Support</div>
                  <div className="text-gray-400 text-sm">Address psychological stress and trauma</div>
                </button>

                <button
                  onClick={() => executeCoachingSession('team_relations')}
                  className="w-full p-4 bg-purple-600/20 border border-purple-500/50 rounded-lg text-left hover:bg-purple-600/30 transition-all"
                >
                  <div className="text-white font-semibold">🤝 Team Relations</div>
                  <div className="text-gray-400 text-sm">Work on cooperation and communication</div>
                </button>

                <button
                  onClick={() => executeCoachingSession('strategy')}
                  className="w-full p-4 bg-yellow-600/20 border border-yellow-500/50 rounded-lg text-left hover:bg-yellow-600/30 transition-all"
                >
                  <div className="text-white font-semibold">📋 Strategy Discussion</div>
                  <div className="text-gray-400 text-sm">Review tactics and battle plans</div>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCoachingModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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