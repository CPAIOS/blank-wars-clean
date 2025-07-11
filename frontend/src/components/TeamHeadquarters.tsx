'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Users,
  TrendingUp,
  Coins,
  Gem,
  Sword,
  Shield,
  Zap,
  Heart,
  Star,
  Crown,
  Bed as BedIcon,
  Sofa,
  ArrowUp,
  Building,
  Castle,
  Sparkles,
  Plus,
  User,
  Coffee,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Video,
  Mic
} from 'lucide-react';
import { createDemoCharacterCollection, Character } from '../data/characters';
import { kitchenChatService } from '../data/kitchenChatService_ORIGINAL';
import { PromptTemplateService } from '../data/promptTemplateService';
import { roomImageService } from '../data/roomImageService';
import { useTutorial } from '../data/useTutorial';
import { teamHeadquartersTutorialSteps } from '../data/tutorialSteps';
import Tutorial from './Tutorial';
import { usageService, UsageStatus } from '../data/usageService';
import BedComponent from './BedComponent';
import CharacterSlotUpgrade from './CharacterSlotUpgrade';
import { PURCHASABLE_BEDS, HEADQUARTERS_TIERS, ROOM_THEMES, ROOM_ELEMENTS } from '../data/headquartersData';
import { HeadquartersTier, RoomTheme, RoomElement, PurchasableBed, Bed, Room, HeadquartersState } from '../types/headquarters';
import { calculateRoomCapacity, calculateSleepingArrangement } from '../utils/roomCalculations';
import { purchaseBed, loadHeadquarters, saveHeadquarters } from '../services/bedService';
import { setRoomTheme, addElementToRoom, removeElementFromRoom, generateRoomImage } from '../services/roomService';
import { assignCharacterToRoom, removeCharacterFromRoom, getUnassignedCharacters } from '../services/characterService';
import { startNewScene, handleCoachMessage, continueScene, KitchenConversation } from '../services/kitchenChatService';
import { clearAllConfessionalTimeouts, startConfessional, pauseConfessional, continueConfessional, generateCharacterResponse, ConfessionalData, ConfessionalMessage } from '../services/confessionalService';
import { getCharacterConflicts, getCharacterHappiness, getThemeCompatibility, getCharacterSuggestedThemes } from '../services/characterHappinessService';
import { getRoomThemeWarnings, calculateMissedBonuses, calculateRoomBonuses } from '../services/roomAnalysisService';
import { calculateTeamChemistry, calculateBattleEffects } from '../services/teamPerformanceService';
import { getElementCapacity } from '../services/headquartersService';




// Bed types and sleep quality - imported from ./types/headquarters.ts

// Purchasable bed options - imported from ./types/headquarters.ts

// Room instance with bed system - imported from ./types/headquarters.ts

// User headquarters state - imported from ./types/headquarters.ts

// Available beds for purchase
// PURCHASABLE_BEDS imported from ./data/headquartersData.ts

// HEADQUARTERS_TIERS imported from ./data/headquartersData.ts

// ROOM_THEMES imported from ./data/headquartersData.ts

// Multi-element room decoration system
// ROOM_ELEMENTS imported from ./data/headquartersData.ts


export default function TeamHeadquarters() {
  
  const [availableCharacters] = useState(() => 
    createDemoCharacterCollection().map(char => ({
      ...char,
      baseName: char.id.split('_')[0]
    }))
  );

  // Usage tracking state
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  
  // Tutorial system
  const { isFirstTimeUser, startTutorial, isActive: isTutorialActive, resetTutorial } = useTutorial();
  
  // Debug helper for testing (remove in production)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).resetTutorial = resetTutorial;
      (window as any).startTutorial = () => startTutorial(teamHeadquartersTutorialSteps);
    }
  }, [resetTutorial, startTutorial]);

  // Load usage status on component mount
  useEffect(() => {
    const loadUsageStatus = async () => {
      try {
        const status = await usageService.getUserUsageStatus();
        setUsageStatus(status);
      } catch (error) {
        console.error('Failed to load usage status:', error);
      }
    };
    
    loadUsageStatus();
    
    // Refresh usage status every 5 minutes
    const interval = setInterval(loadUsageStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const [headquarters, setHeadquarters] = useState<HeadquartersState>({
    currentTier: 'spartan_apartment',
    rooms: [
      {
        id: 'room_1',
        name: 'Master Bedroom',
        theme: null,
        elements: [],
        assignedCharacters: ['achilles', 'holmes', 'dracula', 'merlin'], // 4 characters: 1 bed + 1 couch + 2 floor
        maxCharacters: 2, // Calculated from beds: 1 bed + 1 couch = 2
        beds: [
          {
            id: 'master_bed_1',
            type: 'bed',
            position: { x: 0, y: 0 },
            capacity: 1,
            comfortBonus: 15 // Best sleep quality
          },
          {
            id: 'master_couch_1',
            type: 'couch',
            position: { x: 1, y: 0 },
            capacity: 1,
            comfortBonus: 5 // Lower comfort than bed
          }
        ]
      },
      {
        id: 'room_2', 
        name: 'Bunk Room',
        theme: null,
        elements: [],
        assignedCharacters: ['frankenstein_monster', 'sun_wukong', 'tesla', 'billy_the_kid', 'genghis_khan'], // 5 characters: 2 bunk + 3 floor
        maxCharacters: 2, // Calculated from beds: 1 bunk bed = 2
        beds: [
          {
            id: 'bunk_1',
            type: 'bunk_bed',
            position: { x: 0, y: 0 },
            capacity: 2,
            comfortBonus: 10 // Decent sleep quality
          }
        ]
      }
    ],
    currency: { coins: 50000, gems: 100 },
    unlockedThemes: []
  });

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'room_detail' | 'upgrade_shop' | 'kitchen_chat' | 'confessionals'>('overview');
  const [kitchenConversations, setKitchenConversations] = useState<any[]>([]);
  const [isGeneratingConversation, setIsGeneratingConversation] = useState(false);
  const [selectedRoomForBeds, setSelectedRoomForBeds] = useState<string | null>(null);
  const [showBedShop, setShowBedShop] = useState(false);

  // calculateRoomCapacity and calculateSleepingArrangement imported from ./utils/roomCalculations.ts

  // purchaseBed function imported from ./services/bedService.ts
  
  // Calculate battle bonuses from room themes
  const battleBonuses = headquarters?.rooms?.reduce((bonuses: Record<string, number>, room) => {
    if (room.theme) {
      const theme = ROOM_THEMES.find(t => t.id === room.theme);
      if (theme && room.assignedCharacters.length > 0) {
        bonuses[theme.bonus] = (bonuses[theme.bonus] || 0) + theme.bonusValue;
      }
    }
    return bonuses;
  }, {}) || {};
  const [currentSceneRound, setCurrentSceneRound] = useState(0);
  const [sceneInitialized, setSceneInitialized] = useState(false);
  const [coachMessage, setCoachMessage] = useState('');
  const [draggedCharacter, setDraggedCharacter] = useState<string | null>(null);
  const [showCharacterPool, setShowCharacterPool] = useState(false);
  
  // Enhanced visual feedback states
  const [moveNotification, setMoveNotification] = useState<{message: string, type: 'success' | 'warning'} | null>(null);
  const [highlightedRoom, setHighlightedRoom] = useState<string | null>(null);
  const notificationTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Confessional Interview State
  const [confessionalData, setConfessionalData] = useState<{
    activeCharacter: string | null;
    messages: Array<{id: number; type: 'hostmaster' | 'character'; content: string; timestamp: Date}>;
    isInterviewing: boolean;
    isPaused: boolean;
    questionCount: number;
    isLoading: boolean;
  }>({
    activeCharacter: null,
    messages: [],
    isInterviewing: false,
    isPaused: false,
    questionCount: 0,
    isLoading: false
  });
  
  // Track active timeouts to prevent multiple interviews
  const confessionalTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());
  const [selectedElementCategory, setSelectedElementCategory] = useState<'wallDecor' | 'furniture' | 'lighting' | 'accessories' | 'flooring' | null>(null);
  const [isGeneratingRoomImage, setIsGeneratingRoomImage] = useState(false);

  // Auto-start tutorial for first-time users
  useEffect(() => {
    if (isFirstTimeUser() && !isTutorialActive) {
      // Small delay to let the component render first
      const timer = setTimeout(() => {
        startTutorial(teamHeadquartersTutorialSteps);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isFirstTimeUser, isTutorialActive, startTutorial]);

  const currentTier = HEADQUARTERS_TIERS.find(tier => tier.id === headquarters.currentTier)!;
  const nextTier = HEADQUARTERS_TIERS.find(tier => HEADQUARTERS_TIERS.indexOf(tier) === HEADQUARTERS_TIERS.indexOf(currentTier) + 1);

  // startNewScene function imported from ./services/kitchenChatService.ts

  // continueScene function imported from ./services/kitchenChatService.ts

  // handleCoachMessage function imported from ./services/kitchenChatService.ts

  // Auto-start scene when kitchen chat is opened
  useEffect(() => {
    if (viewMode === 'kitchen_chat' && !sceneInitialized) {
      startNewScene(headquarters, availableCharacters, setIsGeneratingConversation, setCurrentSceneRound, setKitchenConversations);
      setSceneInitialized(true);
    }
  }, [viewMode, sceneInitialized]);

  // Get character conflicts (for humor)
  // getCharacterConflicts function imported from ./services/characterHappinessService.ts

  // getCharacterHappiness function imported from ./services/characterHappinessService.ts

  // getThemeCompatibility function imported from ./services/characterHappinessService.ts

  // getRoomThemeWarnings function imported from ./services/roomAnalysisService.ts

  // getCharacterSuggestedThemes function imported from ./services/characterHappinessService.ts

  // calculateMissedBonuses function imported from ./services/roomAnalysisService.ts

  // Calculate team chemistry penalties from overcrowding
  // calculateTeamChemistry function imported from ./services/teamPerformanceService.ts

  // calculateBattleEffects function imported from ./services/teamPerformanceService.ts

  const battleEffects = calculateBattleEffects(headquarters);

  const upgradeHeadquarters = (tierId: string) => {
    const tier = HEADQUARTERS_TIERS.find(t => t.id === tierId);
    if (!tier) return;

    if (headquarters.currency.coins >= tier.cost.coins && headquarters.currency.gems >= tier.cost.gems) {
      setHeadquarters(prev => ({
        ...prev,
        currentTier: tierId,
        currency: {
          coins: prev.currency.coins - tier.cost.coins,
          gems: prev.currency.gems - tier.cost.gems
        },
        rooms: Array.from({ length: tier.maxRooms }, (_, i) => ({
          id: `room_${i + 1}`,
          name: `Room ${i + 1}`,
          theme: null,
          elements: [], // New multi-element system
          assignedCharacters: [],
          maxCharacters: tier.charactersPerRoom,
          beds: [
            {
              id: `bed_${i + 1}_1`,
              type: 'bed',
              position: { x: 0, y: 0 },
              capacity: 1,
              comfortBonus: 10
            }
          ]
        }))
      }));
    }
  };

  // setRoomTheme function imported from ./services/roomService.ts

  // addElementToRoom function imported from ./services/roomService.ts

  // removeElementFromRoom function imported from ./services/roomService.ts

  // Calculate bonuses from room elements (including synergy bonuses)
  // calculateRoomBonuses function imported from ./services/roomAnalysisService.ts

  // Get element capacity for current tier
  // getElementCapacity function imported from ./services/headquartersService.ts

  // generateRoomImage function imported from ./services/roomService.ts

  // Character assignment functions imported from ./services/characterService.ts

  // removeCharacterFromRoom function imported from ./services/characterService.ts

  // getUnassignedCharacters function imported from ./services/characterService.ts

  // clearAllConfessionalTimeouts function imported from ./services/confessionalService.ts

  // Confessional Interview Functions
  // startConfessional function imported from ./services/confessionalService.ts

  // generateCharacterResponse function imported from ./services/confessionalService.ts

  // pauseConfessional function imported from ./services/confessionalService.ts

  // continueConfessional function imported from ./services/confessionalService.ts

  const endConfessional = () => {
    console.log('🏁 Ending confessional interview');
    clearAllConfessionalTimeouts(confessionalTimeouts);
    setConfessionalData({
      activeCharacter: null,
      isInterviewing: false,
      isPaused: false,
      questionCount: 0,
      messages: [],
      isLoading: false
    });
  };

  // Add null check for headquarters to prevent runtime errors
  if (!headquarters || !headquarters.rooms) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center text-gray-400">
          Loading headquarters...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        className="bg-gray-800/80 rounded-xl p-6 border border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🏠</div>
            <div>
              <h1 className="text-2xl font-bold text-white">{currentTier.name}</h1>
              <p className="text-gray-400">{currentTier.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Battle Effects Display */}
            {Object.keys(battleEffects).length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {Object.values(battleEffects).some(v => v > 0) && <Sword className="w-4 h-4 text-green-400" />}
                  {Object.values(battleEffects).some(v => v < 0) && <Shield className="w-4 h-4 text-red-400" />}
                </div>
                <div className="text-sm space-y-1">
                  {Object.entries(battleEffects).map(([effect, value]) => (
                    <div key={effect} className={value > 0 ? 'text-green-400' : 'text-red-400'}>
                      {value > 0 ? '+' : ''}{value}% {effect.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <Coins className="w-5 h-5" />
                <span className="font-semibold">{headquarters.currency.coins.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400">
                <Gem className="w-5 h-5" />
                <span className="font-semibold">{headquarters.currency.gems}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Bonuses */}
        {Object.keys(battleBonuses).length > 0 && (
          <div className="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
            <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Active Battle Bonuses
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(battleBonuses).map(([bonus, value]) => (
                <div key={bonus} className="flex items-center gap-1 text-sm text-green-300">
                  <Star className="w-3 h-3" />
                  +{value}% {bonus}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex gap-2 items-center">
        {['overview', 'kitchen_chat', 'confessionals', 'upgrade_shop'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as any)}
            className={`px-4 py-2 rounded-lg transition-all ${
              viewMode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            data-tutorial={mode === 'kitchen_chat' ? 'kitchen-chat-tab' : mode === 'upgrade_shop' ? 'upgrade-tab' : mode === 'confessionals' ? 'confessionals-tab' : undefined}
          >
            {mode === 'overview' ? 'Living Quarters' : 
             mode === 'kitchen_chat' ? 'Kitchen Table' : 
             mode === 'confessionals' ? 'Confessionals' :
             'Facilities'}
          </button>
        ))}
        <button
          onClick={() => startTutorial(teamHeadquartersTutorialSteps)}
          className="px-4 py-2 rounded-lg transition-all bg-purple-600 text-white hover:bg-purple-500"
          title="Restart Tutorial"
        >
          <HelpCircle className="w-4 h-4 inline mr-2" />
          Tutorial
        </button>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'overview' && (
          <>
            {/* Team Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/80 rounded-xl p-6 border border-gray-700 mb-6"
              data-tutorial="team-dashboard"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Fighter Status Monitor
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Team Chemistry */}
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-red-400" />
                    <h3 className="font-semibold text-red-400">Team Performance</h3>
                  </div>
                  <div className="text-2xl font-bold text-red-300 mb-1">
                    {calculateTeamChemistry().teamCoordination}%
                  </div>
                  <div className="text-sm text-red-200">
                    DRAMA OVERLOAD - Viewers love conflict but battles suffer!
                  </div>
                </div>
                
                {/* Personal Stress */}
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <h3 className="font-semibold text-orange-400">Living Conditions</h3>
                  </div>
                  <div className="text-2xl font-bold text-orange-300 mb-1">
                    CRAMPED
                  </div>
                  <div className="text-sm text-orange-200">
                    {headquarters.rooms.reduce((sum, room) => sum + room.assignedCharacters.length, 0)} team members sharing {headquarters.rooms.reduce((sum, room) => sum + calculateRoomCapacity(room), 0)} beds
                  </div>
                </div>
                
                {/* Next Action */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUp className="w-4 h-4 text-blue-400" />
                    <h3 className="font-semibold text-blue-400">Coach's Note</h3>
                  </div>
                  <div className="text-lg font-bold text-blue-300 mb-1">
                    Upgrade Set
                  </div>
                  <div className="text-sm text-blue-200">
                    Need {Math.max(0, 25000 - headquarters.currency.coins).toLocaleString()} more prize money
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Set Design Opportunities Summary */}
            {(() => {
              const allWarnings = headquarters.rooms.flatMap(room => getRoomThemeWarnings(room.id, headquarters));
              const allMissedBonuses = headquarters.rooms.flatMap(room => calculateMissedBonuses(room.id, headquarters));
              const incompatibleCount = headquarters.rooms.reduce((count, room) => {
                return count + room.assignedCharacters.filter(char => {
                  const compat = getThemeCompatibility(char, room.theme);
                  return compat.type === 'incompatible';
                }).length;
              }, 0);

              if (allWarnings.length === 0 && allMissedBonuses.length === 0) return null;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/30 mb-6"
                >
                  <h3 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
                    🏋️ Training Environment Opportunities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-amber-200 font-medium mb-1">Team Issues:</div>
                      <div className="text-amber-100">
                        • {incompatibleCount} fighter(s) in mismatched sets
                        • {allWarnings.length} room(s) with poor theme synergy
                      </div>
                    </div>
                    <div>
                      <div className="text-amber-200 font-medium mb-1">Ratings Boost Available:</div>
                      <div className="text-amber-100">
                        • {allMissedBonuses.length} unused character-set synergies
                        • Up to +{allMissedBonuses.length > 0 ? Math.max(...allMissedBonuses.map(b => parseInt(b.bonus.replace(/[^\d]/g, '')) || 0)) : 0}% performance bonus possible
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
            
            {/* Move Notification */}
            {moveNotification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                  moveNotification.type === 'success' 
                    ? 'bg-green-900/50 border-green-500 text-green-200' 
                    : 'bg-orange-900/50 border-orange-500 text-orange-200'
                }`}
              >
                <div className="text-2xl">
                  {moveNotification.type === 'success' ? '✅' : '⚠️'}
                </div>
                <div className="font-medium">
                  {moveNotification.message}
                </div>
              </motion.div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Bunk Room */}
              <div className="flex-1 space-y-6">
                {/* Front Door & Room Grid */}
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Show Entrance */}
                  <div className="text-center">
                    <div className="inline-block relative">
                      <img 
                        src="/images/front-door.png" 
                        alt="Blank Wars Team Housing Entrance"
                        className="w-48 h-64 object-cover rounded-xl border border-gray-600 shadow-lg"
                      />
                      <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        🏠 Team Housing Entrance
                      </div>
                    </div>
                  </div>

                  {/* Available Fighters Section */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Living Quarters</h3>
                    <button
                      onClick={() => setShowCharacterPool(!showCharacterPool)}
                      className={`px-4 py-2 rounded-lg transition-all relative ${
                        showCharacterPool
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } ${getUnassignedCharacters(availableCharacters, headquarters).length > 0 ? 'animate-pulse ring-2 ring-blue-400/50' : ''}`}
                      data-tutorial="character-pool-button"
                    >
                      <User className="w-4 h-4 inline mr-2" />
                      Available Fighters ({getUnassignedCharacters(availableCharacters, headquarters).length})
                      {getUnassignedCharacters(availableCharacters, headquarters).length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                          {getUnassignedCharacters(availableCharacters, headquarters).length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Character Pool Panel */}
                  {showCharacterPool && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-gray-800/80 rounded-xl p-4 border border-gray-700 mb-6"
                    >
                      <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Available Fighters ({getUnassignedCharacters(availableCharacters, headquarters).length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {getUnassignedCharacters(availableCharacters, headquarters).map(character => (
                          <div
                            key={character.baseName}
                            className="flex flex-col items-center p-3 bg-gray-700/50 rounded-lg cursor-move hover:bg-gray-600/50 transition-colors"
                            draggable
                            onDragStart={(e) => {
                              setDraggedCharacter(character.baseName);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => setDraggedCharacter(null)}
                          >
                            <div className="text-3xl mb-2">{character.avatar}</div>
                            <div className="text-sm text-white text-center">
                              {character.name.split(' ')[0]}
                            </div>
                            <div className="text-xs text-gray-400 text-center">
                              {character.archetype}
                            </div>
                          </div>
                        ))}
                        {getUnassignedCharacters(availableCharacters, headquarters).length === 0 && (
                          <div className="col-span-full text-center text-gray-400 py-8">
                            All fighters are on set!
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-3 text-center">
                        💡 Drag fighters to room cards below to assign them
                      </div>
                    </motion.div>
                  )}

                  {/* Living Quarters Grid */}
                  <div 
                    className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                    data-tutorial="room-grid"
                  >
                {headquarters.rooms.map((room) => {
                  const theme = room.theme ? ROOM_THEMES.find(t => t.id === room.theme) : null;
                  const conflicts = getCharacterConflicts(room.id, headquarters);
                  const roomCapacity = calculateRoomCapacity(room);
                  
                  return (
                    <motion.div
                      key={room.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        theme 
                          ? `${theme.backgroundColor} border-gray-600` 
                          : 'bg-gray-800/50 border-gray-700'
                      } ${draggedCharacter ? 'border-blue-400 border-dashed' : ''} ${
                        highlightedRoom === room.id ? 'ring-2 ring-green-400 border-green-400 bg-green-900/20' : ''
                      }`}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedRoom(room.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-green-400');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-green-400');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-green-400');
                        if (draggedCharacter) {
                          assignCharacterToRoom(draggedCharacter, room.id, availableCharacters, headquarters, setHeadquarters, setMoveNotification, setHighlightedRoom, notificationTimeout);
                          setDraggedCharacter(null);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          <h3 className="font-semibold text-white">{room.name}</h3>
                          {theme && <span className="text-lg">{theme.icon}</span>}
                        </div>
                        <div className="text-xs text-gray-400">
                          {room.assignedCharacters.length}/{calculateRoomCapacity(room)}
                        </div>
                      </div>

                      {theme && (
                        <div className={`text-xs ${theme.textColor} mb-2`}>
                          {theme.name} (+{theme.bonusValue}% {theme.bonus})
                        </div>
                      )}

                      {/* Room Beds */}
                      <div className="mb-3">
                        <div className="text-xs text-gray-400 mb-2">Beds & Furniture:</div>
                        <div className="flex flex-wrap gap-2">
                          {room.beds.map((bed) => {
                            // Calculate how many characters are using this bed
                            const bedStartIndex = room.beds.slice(0, room.beds.indexOf(bed)).reduce((sum, b) => sum + b.capacity, 0);
                            const bedEndIndex = bedStartIndex + bed.capacity;
                            const occupiedSlots = Math.max(0, Math.min(bed.capacity, room.assignedCharacters.length - bedStartIndex));
                            
                            return (
                              <BedComponent
                                key={bed.id}
                                bed={bed}
                                occupiedSlots={occupiedSlots}
                                showDetails={false}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Character Avatars with Status */}
                      <div className="flex flex-wrap gap-3 mb-3">
                        {room.assignedCharacters.map(charName => {
                          const character = availableCharacters.find(c => c.baseName === charName);
                          const happiness = getCharacterHappiness(charName, room.id, headquarters);
                          const themeCompatibility = getThemeCompatibility(charName, room.theme);
                          
                          return character ? (
                            <div 
                              key={charName} 
                              className={`flex flex-col items-center group relative cursor-move ${
                                themeCompatibility.type === 'incompatible' ? 'ring-2 ring-amber-400/50 rounded-lg p-1' : ''
                              }`}
                              draggable
                              onDragStart={(e) => {
                                setDraggedCharacter(charName);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => setDraggedCharacter(null)}
                              data-tutorial="character-avatar"
                            >
                              <div className="relative">
                                <div className="text-xl">{character.avatar}</div>
                                <div className="absolute -top-1 -right-1 text-xs">{happiness.emoji}</div>
                                {/* Theme compatibility indicator */}
                                {themeCompatibility.type === 'incompatible' && (
                                  <div className="absolute -bottom-1 -left-1 text-xs">⚠️</div>
                                )}
                                {themeCompatibility.type === 'compatible' && (
                                  <div className="absolute -bottom-1 -left-1 text-xs">✨</div>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 truncate max-w-16">
                                {character.name.split(' ')[0]}
                              </div>
                              {/* Enhanced tooltip with theme info */}
                              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 max-w-48">
                                <div>{happiness.status}</div>
                                {themeCompatibility.type === 'incompatible' && (
                                  <div className="text-amber-300 mt-1">
                                    ⚠️ Set mismatch (-1 mood level)
                                  </div>
                                )}
                                {themeCompatibility.type === 'compatible' && (
                                  <div className="text-green-300 mt-1">
                                    ✨ Perfect set match (+{themeCompatibility.bonusValue}% {themeCompatibility.theme?.bonus})
                                  </div>
                                )}
                              </div>
                              {/* Remove button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCharacterFromRoom(charName, room.id, setHeadquarters);
                                }}
                                className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          ) : null;
                        })}
                        {/* Empty beds or overcrowding indicator */}
                        {room.assignedCharacters.length <= roomCapacity ? (
                          Array.from({ length: roomCapacity - room.assignedCharacters.length }).map((_, i) => (
                            <div key={`empty-${i}`} className="flex flex-col items-center opacity-30 hover:opacity-50 transition-opacity cursor-pointer">
                              <BedIcon className="w-6 h-6 text-gray-500" />
                              <div className="text-xs text-gray-500">Available</div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center text-red-400">
                            <div className="text-xs">🛏️ {roomCapacity} in beds</div>
                            <div className="text-xs">🌗 {room.assignedCharacters.length - roomCapacity} on floor</div>
                          </div>
                        )}
                      </div>

                      {/* Conflicts and Overcrowding Status */}
                      {room.assignedCharacters.length > roomCapacity && (
                        <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-2 mb-2">
                          <div className="text-sm text-red-300 font-semibold flex items-center gap-2">
                            🛏️ OVERCROWDED ROOM
                          </div>
                          <div className="text-xs text-red-200">
                            {room.assignedCharacters.length - roomCapacity} fighters sleeping on floor
                          </div>
                          <div className="text-xs text-red-200 mt-1">
                            Capacity: {room.assignedCharacters.length}/{roomCapacity} (-{Math.round((room.assignedCharacters.length - roomCapacity) * 10)}% team morale)
                          </div>
                        </div>
                      )}
                      {conflicts.length > 0 && (
                        <div className="text-xs text-orange-400 italic mb-1">
                          😤 {conflicts[0]}
                        </div>
                      )}
                      
                      {/* Theme Compatibility Warnings */}
                      {(() => {
                        const warnings = getRoomThemeWarnings(room.id, headquarters);
                        const missedBonuses = calculateMissedBonuses(room.id, headquarters);
                        
                        if (warnings.length === 0 && missedBonuses.length === 0) return null;
                        
                        return (
                          <div className="space-y-1">
                            {warnings.map((warning, index) => (
                              <div key={index} className="text-xs text-amber-400 italic">
                                ⚠️ {warning.message}
                              </div>
                            ))}
                            
                            {/* Suggestions for better assignments */}
                            {missedBonuses.length > 0 && (
                              <div className="text-xs text-blue-300 italic">
                                💡 Available bonuses: {missedBonuses.slice(0, 2).map(bonus => bonus.bonus).join(', ')}
                                {missedBonuses.length > 2 && ` +${missedBonuses.length - 2} more`}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {!theme && headquarters.currentTier !== 'spartan_apartment' && (
                        <div className="text-xs text-blue-400 flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          Click to add theme
                        </div>
                      )}

                      {/* Buy Beds Button */}
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoomForBeds(room.id);
                            setShowBedShop(true);
                          }}
                          className="w-full px-3 py-2 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 rounded-lg transition-all text-green-300 text-sm flex items-center justify-center gap-2"
                        >
                          <BedIcon className="w-4 h-4" />
                          Buy Beds ({room.beds.length} beds)
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                  </div>
                </motion.div>
              </div>

              {/* Main Area */}
              <div className="w-full lg:w-[450px] flex-shrink-0">
                <div className="space-y-6">
                  {/* Team Dashboard */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/80 rounded-xl p-6 border border-gray-700"
                    data-tutorial="team-dashboard"
                  >
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Fighter Status Monitor
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Team Chemistry */}
                      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-red-400" />
                          <h3 className="font-semibold text-red-400">Team Performance</h3>
                        </div>
                        <div className="text-2xl font-bold text-red-300 mb-1">
                          {calculateTeamChemistry().teamCoordination}%
                        </div>
                        <div className="text-sm text-red-200">
                          DRAMA OVERLOAD - Viewers love conflict but battles suffer!
                        </div>
                      </div>
                      
                      {/* Personal Stress */}
                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-orange-400" />
                          <h3 className="font-semibold text-orange-400">Living Conditions</h3>
                        </div>
                        <div className="text-2xl font-bold text-orange-300 mb-1">
                          CRAMPED
                        </div>
                        <div className="text-sm text-orange-200">
                          {headquarters.rooms.reduce((sum, room) => sum + room.assignedCharacters.length, 0)} team members sharing {headquarters.rooms.reduce((sum, room) => sum + calculateRoomCapacity(room), 0)} beds
                        </div>
                      </div>
                      
                      {/* Next Action */}
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowUp className="w-4 h-4 text-blue-400" />
                          <h3 className="font-semibold text-blue-400">Coach's Note</h3>
                        </div>
                        <div className="text-lg font-bold text-blue-300 mb-1">
                          Upgrade Set
                        </div>
                        <div className="text-sm text-blue-200">
                          Need {Math.max(0, 25000 - headquarters.currency.coins).toLocaleString()} more prize money
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Set Design Opportunities Summary */}
                  {(() => {
                    const allWarnings = headquarters.rooms.flatMap(room => getRoomThemeWarnings(room.id, headquarters));
                    const allMissedBonuses = headquarters.rooms.flatMap(room => calculateMissedBonuses(room.id, headquarters));
                    const incompatibleCount = headquarters.rooms.reduce((count, room) => {
                      return count + room.assignedCharacters.filter(char => {
                        const compat = getThemeCompatibility(char, room.theme);
                        return compat.type === 'incompatible';
                      }).length;
                    }, 0);

                    if (allWarnings.length === 0 && allMissedBonuses.length === 0) return null;

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/30"
                      >
                        <h3 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
                          🏋️ Training Environment Opportunities
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-amber-200 font-medium mb-1">Team Issues:</div>
                            <div className="text-amber-100">
                              • {incompatibleCount} fighter(s) in mismatched sets
                              • {allWarnings.length} room(s) with poor theme synergy
                            </div>
                          </div>
                          <div>
                            <div className="text-amber-200 font-medium mb-1">Ratings Boost Available:</div>
                            <div className="text-amber-100">
                              • {allMissedBonuses.length} unused character-set synergies
                              • Up to +{allMissedBonuses.length > 0 ? Math.max(...allMissedBonuses.map(b => parseInt(b.bonus.replace(/[^\d]/g, '')) || 0)) : 0}% performance bonus possible
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                  
                  {/* Move Notification */}
                  {moveNotification && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                        moveNotification.type === 'success' 
                          ? 'bg-green-900/50 border-green-500 text-green-200' 
                          : 'bg-orange-900/50 border-orange-500 text-orange-200'
                      }`}
                    >
                      <div className="text-2xl">
                        {moveNotification.type === 'success' ? '✅' : '⚠️'}
                      </div>
                      <div className="font-medium">
                        {moveNotification.message}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {viewMode === 'kitchen_chat' && (
          <motion.div
            key="kitchen_chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-gray-800/80 rounded-xl p-6 border border-gray-700"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Coffee className="w-5 h-5" />
                Kitchen Table
              </h2>
              <p className="text-gray-400 text-sm">The show's most popular segment - raw, unfiltered fighter interactions...</p>
            </div>

            {/* Kitchen Table Visual */}
            <div className="bg-gradient-to-b from-amber-900/20 to-amber-800/10 rounded-xl p-6 mb-6 border border-amber-700/30">
              <div className="text-center mb-4">
                <img 
                  src="/images/kitchen-table.png" 
                  alt="Blank Wars Kitchen Table"
                  className="w-64 h-48 object-cover rounded-lg border border-amber-600/50 shadow-lg mx-auto mb-3"
                />
                <div className="text-gray-300 text-sm">The show's main set - where legends become roommates and drama unfolds</div>
                <div className="text-amber-400 text-xs mt-1">All {availableCharacters.length} fighters available for kitchen conversations</div>
              </div>

              {/* All 17 Fighters Available */}
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2 justify-center mb-4 max-w-4xl mx-auto">
                {availableCharacters.map((character) => {
                  return (
                    <div key={character.baseName} className="text-center">
                      <div className="text-3xl mb-1">{character.avatar}</div>
                      <div className="text-xs text-gray-400">
                        {character.name.split(' ')[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scene Controls */}
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <div className="text-sm text-gray-400">
                Scene Round: {currentSceneRound}
              </div>
              {usageStatus && (
                <div className="text-sm text-gray-400 border border-gray-600 rounded px-2 py-1">
                  {usageService.getUsageDisplayText(usageStatus).chatText}
                  {usageStatus.remainingChats > 0 && usageStatus.remainingChats < 5 && (
                    <span className="ml-2 text-orange-400">({usageService.formatTimeUntilReset(usageStatus.resetTime)})</span>
                  )}
                </div>
              )}
              <button
                onClick={() => continueScene(isGeneratingConversation, setIsGeneratingConversation, currentSceneRound, setCurrentSceneRound, kitchenConversations, setKitchenConversations, headquarters, availableCharacters, calculateSleepingArrangement, calculateRoomCapacity, kitchenChatService, usageService, setUsageStatus, PromptTemplateService)}
                disabled={isGeneratingConversation || (usageStatus && !usageStatus.canChat)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors font-semibold"
              >
                {currentSceneRound === 0 ? '🎬 Start Scene' : '▶️ Continue Scene'}
                {usageStatus && !usageStatus.canChat && (
                  <span className="ml-2 text-red-300 text-xs">Limit reached</span>
                )}
              </button>
              <button
                onClick={() => {
                  setSceneInitialized(false);
                  setCurrentSceneRound(0);
                  setKitchenConversations([]);
                }}
                disabled={isGeneratingConversation}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors"
              >
                🔄 New Scene
              </button>
              {isGeneratingConversation && (
                <div className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg flex items-center gap-2">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  AI Generating...
                </div>
              )}
            </div>

            {/* Usage Limit Warning */}
            {usageStatus && !usageStatus.canChat && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <h3 className="font-semibold text-red-400">Daily AI Interaction Limit Reached</h3>
                </div>
                <p className="text-red-200 text-sm mb-3">
                  You've used all your daily AI interactions (character chats, kitchen conversations, team chat). Upgrade to premium for unlimited conversations!
                </p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors font-semibold">
                    ⭐ Upgrade to Premium
                  </button>
                  <div className="px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg">
                    {usageService.formatTimeUntilReset(usageStatus.resetTime)}
                  </div>
                </div>
              </div>
            )}

            {/* Live AI Conversations */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {kitchenConversations.length === 0 && !isGeneratingConversation && (
                <div className="text-center text-gray-400 py-8">
                  <p>Click "Start Scene" to begin a new kitchen conversation!</p>
                  <p className="text-sm mt-2">Characters will automatically start talking based on their personalities and current living situation.</p>
                </div>
              )}
              {kitchenConversations.map((convo, index) => (
                <motion.div
                  key={convo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-700/50 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{convo.avatar}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{convo.speaker}</span>
                        {convo.isComplaint && <AlertCircle className="w-3 h-3 text-orange-400" />}
                        {convo.isAI && <span className="text-xs bg-green-600 px-1 rounded text-white">AI</span>}
                        {convo.round && <span className="text-xs bg-blue-600 px-1 rounded text-white">R{convo.round}</span>}
                      </div>
                      <p className="text-gray-300 text-sm">{convo.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Coach Chat Input */}
            <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center gap-3">
                <div className="text-2xl">👨‍💼</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-blue-400">Coach</span>
                    <span className="text-xs bg-blue-600 px-1 rounded text-white">YOU</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Say something to your team..."
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      value={coachMessage}
                      onChange={(e) => setCoachMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCoachMessage(coachMessage, headquarters, availableCharacters, currentSceneRound, setKitchenConversations, setCoachMessage, setIsGeneratingConversation, setCurrentSceneRound)}
                      disabled={isGeneratingConversation}
                    />
                    <button
                      onClick={() => handleCoachMessage(coachMessage, headquarters, availableCharacters, currentSceneRound, setKitchenConversations, setCoachMessage, setIsGeneratingConversation, setCurrentSceneRound)}
                      disabled={!coachMessage.trim() || isGeneratingConversation}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === 'upgrade_shop' && (
          <motion.div
            key="upgrade_shop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Headquarters Upgrades */}
            <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Headquarters Upgrades
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HEADQUARTERS_TIERS.map((tier) => {
                  const isCurrentTier = headquarters.currentTier === tier.id;
                  const isUpgrade = HEADQUARTERS_TIERS.indexOf(tier) > HEADQUARTERS_TIERS.indexOf(currentTier);
                  const canAfford = headquarters.currency.coins >= tier.cost.coins && 
                                   headquarters.currency.gems >= tier.cost.gems;

                  return (
                    <div
                      key={tier.id}
                      className={`p-4 rounded-lg border transition-all ${
                        isCurrentTier 
                          ? 'border-green-500 bg-green-900/20' 
                          : isUpgrade && canAfford
                          ? 'border-blue-500 bg-blue-900/20 cursor-pointer hover:bg-blue-900/30'
                          : 'border-gray-600 bg-gray-700/30'
                      }`}
                      onClick={() => isUpgrade && canAfford && upgradeHeadquarters(tier.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{tier.name}</h3>
                        {isCurrentTier && <span className="text-green-400 text-sm">Current</span>}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{tier.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-gray-300">
                          {tier.maxRooms} rooms, {tier.charactersPerRoom} per room
                        </div>
                        {tier.cost.coins > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400">{tier.cost.coins.toLocaleString()}</span>
                            <span className="text-purple-400">{tier.cost.gems}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Room Themes */}
            <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Room Themes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ROOM_THEMES.map((theme) => {
                  const canAfford = headquarters.currency.coins >= theme.cost.coins && 
                                   headquarters.currency.gems >= theme.cost.gems;
                  const isUnlocked = headquarters.unlockedThemes.includes(theme.id);

                  return (
                    <div
                      key={theme.id}
                      className={`p-4 rounded-lg border transition-all ${
                        isUnlocked
                          ? 'border-green-500 bg-green-900/20'
                          : canAfford
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-600 bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{theme.icon}</span>
                        <h3 className="font-semibold text-white">{theme.name}</h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{theme.description}</p>
                      <div className="text-sm text-blue-400 mb-2">
                        +{theme.bonusValue}% {theme.bonus}
                      </div>
                      <div className="text-xs text-gray-300 mb-3">
                        Best for: {theme.suitableCharacters.map(name => {
                          const char = availableCharacters.find(c => c.baseName === name);
                          return char?.name.split(' ')[0];
                        }).join(', ')}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-yellow-400">{theme.cost.coins.toLocaleString()}</span>
                          <span className="text-purple-400">{theme.cost.gems}</span>
                        </div>
                        {isUnlocked && <span className="text-green-400 text-xs">Owned</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Character Slot Capacity Upgrade Component */}
            <CharacterSlotUpgrade 
              currency={headquarters.currency}
              onCurrencyUpdate={(coins, gems) => {
                setHeadquarters(prev => ({
                  ...prev,
                  currency: { coins, gems }
                }));
              }}
            />
          </motion.div>
        )}

        {viewMode === 'confessionals' && (
          <motion.div
            key="confessionals"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-gray-800/80 rounded-xl p-6 border border-gray-700"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Confessional Booth
              </h2>
              <p className="text-gray-400 text-sm">Private confessional sessions where fighters respond to invisible director prompts...</p>
            </div>

            {/* Confessional Setup */}
            <div className="bg-gradient-to-b from-purple-900/20 to-purple-800/10 rounded-xl p-6 mb-6 border border-purple-700/30">
              <div className="text-center mb-4">
                <div className="w-32 h-24 bg-gray-700 rounded-lg mx-auto mb-3 flex items-center justify-center border-2 border-purple-500/50">
                  <div className="text-4xl">🎥</div>
                </div>
                <div className="text-gray-300 text-sm">
                  <span className="text-red-400">● REC</span> Confessional Camera - Where fighters spill the tea
                </div>
              </div>

              {/* Invisible Director System */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-600">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">🎬</div>
                  <div>
                    <div className="font-semibold text-purple-400">Invisible Director</div>
                    <div className="text-xs text-gray-400">Reality TV Confessional System</div>
                  </div>
                </div>
                <div className="bg-purple-900/30 rounded p-3 text-sm text-purple-200">
                  <div className="font-mono text-xs text-purple-300 mb-1">[CONFESSIONAL BOOTH - INVISIBLE DIRECTOR ACTIVE]</div>
                  "Behind-the-scenes director prompts guide authentic confessional responses. Only the fighter's voice is heard by viewers, creating realistic reality TV footage."
                </div>
              </div>

              {/* Character Selection for Interview */}
              <div className="mb-4">
                <h3 className="text-purple-300 font-semibold mb-1 flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Select Fighter for Interview
                </h3>
                <p className="text-purple-200 text-xs mb-3">All {availableCharacters.length} fighters available for confessional interviews</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {availableCharacters.map((character) => {
                    
                    return (
                      <div
                        key={character.id}
                        className="flex flex-col items-center p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-purple-600/30 transition-colors"
                        onClick={() => startConfessional(character.id, availableCharacters, confessionalTimeouts, setConfessionalData, headquarters)}
                      >
                        <div className="text-2xl mb-1">{character.avatar}</div>
                        <div className="text-xs text-white text-center">
                          {character.name.split(' ')[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Confessional Interview */}
              {confessionalData.isInterviewing ? (
                <div className="bg-gray-800/80 rounded-lg p-6 border border-purple-500/50">
                  {/* Character Portrait */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-600">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center border-2 border-purple-400">
                      <span className="text-2xl">
                        {availableCharacters.find(c => c.id === confessionalData.activeCharacter)?.avatar || '👤'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {availableCharacters.find(c => c.id === confessionalData.activeCharacter)?.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {availableCharacters.find(c => c.id === confessionalData.activeCharacter)?.archetype} • In Confessional
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${confessionalData.isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                      <span className="text-purple-300 font-semibold">
                        {confessionalData.isPaused ? 'PAUSED' : 'LIVE INTERVIEW'}
                      </span>
                      <span className="text-gray-500 text-sm">
                        (Q{confessionalData.questionCount})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {confessionalData.isPaused ? (
                        <button
                          onClick={() => continueConfessional(confessionalData, confessionalTimeouts, availableCharacters, headquarters, setConfessionalData)}
                          className="text-green-400 hover:text-white px-3 py-1 rounded bg-gray-700 hover:bg-green-600 transition-colors"
                        >
                          Continue
                        </button>
                      ) : (
                        <button
                          onClick={() => pauseConfessional(setConfessionalData)}
                          className="text-yellow-400 hover:text-white px-3 py-1 rounded bg-gray-700 hover:bg-yellow-600 transition-colors"
                        >
                          Pause
                        </button>
                      )}
                      <button
                        onClick={endConfessional}
                        className="text-red-400 hover:text-white px-3 py-1 rounded bg-gray-700 hover:bg-red-600 transition-colors"
                      >
                        End Interview
                      </button>
                    </div>
                  </div>
                  
                  {/* Interview Messages */}
                  <div className="bg-black/50 rounded-lg p-4 max-h-80 overflow-y-auto mb-4 space-y-3">
                    {confessionalData.messages
                      .filter(message => message.type === 'character') // Only show character responses
                      .map((message) => (
                      <div key={message.id} className="flex justify-start">
                        <div className="max-w-md p-3 rounded-lg bg-gray-600/80 text-white">
                          <div className="text-xs opacity-75 mb-1">
                            {availableCharacters.find(c => c.id === confessionalData.activeCharacter)?.name.toUpperCase() || 'CHARACTER'}
                          </div>
                          <div className="text-sm">{message.content}</div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Loading Spinner */}
                    {confessionalData.isLoading && (
                      <div className="flex justify-center">
                        <div className="bg-gray-700/80 text-white p-3 rounded-lg flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
                          <span className="text-sm text-gray-300">Character is responding...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Interview Status */}
                  <div className="text-center text-gray-400 text-sm">
                    {confessionalData.isPaused ? (
                      <span className="text-yellow-400">⏸️ Interview paused - Click "Continue" to resume the confession</span>
                    ) : (
                      <span>🎬 Confessional in progress... The character responds to invisible director prompts behind the camera.</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                  <div className="text-gray-300 mb-2">🎥 Ready for Confessional</div>
                  <div className="text-gray-400 text-sm">
                    Click on a character above to start a live confessional session with invisible director prompts
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Bed Shop Modal */}
      <AnimatePresence>
        {showBedShop && selectedRoomForBeds && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowBedShop(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BedIcon className="w-5 h-5" />
                  Buy Beds for {headquarters.rooms.find(r => r.id === selectedRoomForBeds)?.name}
                </h3>
                <button
                  onClick={() => setShowBedShop(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Your Currency:</span>
                  <span className="text-yellow-400">
                    {headquarters.currency.coins.toLocaleString()} coins, {headquarters.currency.gems} gems
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {PURCHASABLE_BEDS.map((bed) => {
                  const canAfford = headquarters.currency.coins >= bed.cost.coins && 
                                   headquarters.currency.gems >= bed.cost.gems;
                  
                  return (
                    <div key={bed.id} className="border border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{bed.icon}</span>
                          <div>
                            <h4 className="text-white font-semibold">{bed.name}</h4>
                            <p className="text-sm text-gray-400">{bed.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">
                            Sleeps: {bed.capacity} | Comfort: +{bed.comfortBonus}
                          </div>
                          <div className="text-sm text-yellow-400">
                            {bed.cost.coins} coins, {bed.cost.gems} gems
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={async () => {
                          await purchaseBed(selectedRoomForBeds, bed, headquarters, setHeadquarters, setMoveNotification);
                          setShowBedShop(false);
                        }}
                        disabled={!canAfford}
                        className={`w-full py-2 px-4 rounded-lg transition-all ${
                          canAfford 
                            ? 'bg-green-600 hover:bg-green-500 text-white' 
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Purchase' : 'Not enough currency'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-Element Room Theming Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedRoom(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const room = headquarters.rooms.find(r => r.id === selectedRoom);
                if (!room) return null;

                const elementCapacity = getElementCapacity(headquarters.currentTier);
                const roomBonuses = calculateRoomBonuses(selectedRoom, headquarters);

                return (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{room.name}</h2>
                        <p className="text-gray-400">Multi-Element Training Environment</p>
                      </div>
                      <button
                        onClick={() => setSelectedRoom(null)}
                        className="text-gray-400 hover:text-white text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    {/* Room Preview */}
                    <div className="bg-gradient-to-b from-blue-900/20 to-blue-800/10 rounded-xl p-6 mb-6 border border-blue-700/30">
                      <div className="text-center mb-4">
                        {room.customImageUrl ? (
                          <img 
                            src={room.customImageUrl} 
                            alt={`${room.name} custom design`}
                            className="w-full h-48 object-cover rounded-lg border border-gray-600 shadow-lg"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center border-2 border-gray-600">
                            <div className="text-center">
                              <div className="text-6xl mb-2">🏠</div>
                              <div className="text-gray-400">Preview Room Design</div>
                              <button
                                onClick={() => generateRoomImage(selectedRoom, headquarters, setHeadquarters, setIsGeneratingRoomImage)}
                                disabled={isGeneratingRoomImage || room.elements.length === 0}
                                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                              >
                                {isGeneratingRoomImage ? 'Generating...' : 
                                 room.elements.length === 0 ? 'Add elements first' : 
                                 '🎨 Generate Custom Image'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Element Capacity */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-blue-300 font-semibold">Element Capacity</span>
                          <span className="text-blue-200">{room.elements.length}/{elementCapacity}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(room.elements.length / elementCapacity) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Active Bonuses */}
                      {Object.keys(roomBonuses).length > 0 && (
                        <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/30">
                          <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Active Set Bonuses
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(roomBonuses).map(([bonus, value]) => (
                              <div key={bonus} className="text-sm text-green-300 bg-green-900/30 px-2 py-1 rounded">
                                +{value}% {bonus}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Current Elements */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3">Current Set Elements</h3>
                      {room.elements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {room.elements.map(elementId => {
                            const element = ROOM_ELEMENTS.find(e => e.id === elementId);
                            if (!element) return null;

                            return (
                              <div
                                key={elementId}
                                className={`p-3 rounded-lg border ${element.backgroundColor} ${element.textColor}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{element.icon}</span>
                                    <div>
                                      <div className="font-semibold">{element.name}</div>
                                      <div className="text-xs opacity-80">{element.category}</div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeElementFromRoom(selectedRoom, elementId, setHeadquarters)}
                                    className="text-red-400 hover:text-red-300 text-lg"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-600 rounded-lg">
                          No elements selected. Choose from categories below to start designing!
                        </div>
                      )}
                    </div>

                    {/* Element Categories */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3">Add Elements by Category</h3>
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {(['wallDecor', 'furniture', 'lighting', 'accessories', 'flooring'] as const).map(category => (
                          <button
                            key={category}
                            onClick={() => setSelectedElementCategory(category)}
                            className={`px-3 py-2 rounded-lg text-sm transition-all ${
                              selectedElementCategory === category
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {category === 'wallDecor' ? 'Wall Decor' : 
                             category === 'furniture' ? 'Furniture' :
                             category === 'lighting' ? 'Lighting' :
                             category === 'accessories' ? 'Accessories' : 'Flooring'}
                          </button>
                        ))}
                      </div>

                      {/* Elements for Selected Category */}
                      {selectedElementCategory && (
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <h4 className="text-white font-semibold mb-3 capitalize">{selectedElementCategory} Options</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ROOM_ELEMENTS
                              .filter(element => element.category === selectedElementCategory)
                              .map(element => {
                                const isOwned = room.elements.includes(element.id);
                                const canAfford = headquarters.currency.coins >= element.cost.coins && 
                                                 headquarters.currency.gems >= element.cost.gems;
                                const atCapacity = room.elements.length >= elementCapacity;

                                return (
                                  <div
                                    key={element.id}
                                    className={`p-3 rounded-lg border transition-all ${
                                      isOwned 
                                        ? 'border-green-500 bg-green-900/20' 
                                        : canAfford && !atCapacity
                                        ? 'border-blue-500 bg-blue-900/20 cursor-pointer hover:bg-blue-900/30'
                                        : 'border-gray-600 bg-gray-700/30'
                                    }`}
                                    onClick={() => {
                                      if (!isOwned && canAfford && !atCapacity) {
                                        addElementToRoom(selectedRoom, element.id, headquarters, setHeadquarters);
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-3 mb-2">
                                      <span className="text-2xl">{element.icon}</span>
                                      <div className="flex-1">
                                        <div className="font-semibold text-white">{element.name}</div>
                                        <div className="text-sm text-gray-400">{element.description}</div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="text-blue-400">
                                        +{element.bonusValue}% {element.bonus}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-yellow-400">{element.cost.coins}</span>
                                        <span className="text-purple-400">{element.cost.gems}</span>
                                      </div>
                                    </div>

                                    {isOwned && (
                                      <div className="mt-2 text-green-400 text-sm font-semibold">✓ Owned</div>
                                    )}
                                    {!canAfford && !isOwned && (
                                      <div className="mt-2 text-red-400 text-sm">Cannot afford</div>
                                    )}
                                    {atCapacity && !isOwned && (
                                      <div className="mt-2 text-orange-400 text-sm">Room at capacity</div>
                                    )}
                                  </div>
                                );
                              })
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedRoom(null)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg transition-colors font-semibold"
                    >
                      Save Training Setup
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial System */}
      <Tutorial />
    </div>
  );
}