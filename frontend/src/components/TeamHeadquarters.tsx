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
  Bed,
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
import { kitchenChatService } from '../services/kitchenChatService';
import { PromptTemplateService } from '../services/promptTemplateService';
import { roomImageService } from '../services/roomImageService';
import { useTutorial } from '../hooks/useTutorial';
import { teamHeadquartersTutorialSteps } from '../data/tutorialSteps';
import Tutorial from './Tutorial';
import { usageService, UsageStatus } from '../services/usageService';

// Headquarters progression tiers
interface HeadquartersTier {
  id: string;
  name: string;
  description: string;
  maxRooms: number;
  charactersPerRoom: number;
  cost: { coins: number; gems: number };
  unlockLevel: number;
  roomUpgrades: string[];
}

// Room themes with battle bonuses
interface RoomTheme {
  id: string;
  name: string;
  description: string;
  bonus: string;
  bonusValue: number;
  suitableCharacters: string[];
  cost: { coins: number; gems: number };
  backgroundColor: string;
  textColor: string;
  icon: string;
}

// Room element categories for multi-element theming
interface RoomElement {
  id: string;
  name: string;
  category: 'wallDecor' | 'furniture' | 'lighting' | 'accessories' | 'flooring';
  description: string;
  bonus: string;
  bonusValue: number;
  suitableCharacters: string[];
  cost: { coins: number; gems: number };
  backgroundColor: string;
  textColor: string;
  icon: string;
  compatibleWith: string[]; // Other element IDs that synergize well
  incompatibleWith: string[]; // Other element IDs that clash
}

// Room instance with multi-element support
interface Room {
  id: string;
  name: string;
  theme: string | null; // Legacy single theme support
  elements: string[]; // New multi-element system
  assignedCharacters: string[];
  maxCharacters: number;
  customImageUrl?: string; // DALL-E generated image
}

// User headquarters state
interface HeadquartersState {
  currentTier: string;
  rooms: Room[];
  currency: { coins: number; gems: number };
  unlockedThemes: string[];
}

const HEADQUARTERS_TIERS: HeadquartersTier[] = [
  {
    id: 'spartan_apartment',
    name: 'Spartan Apartment',
    description: 'A cramped 2-room apartment where legendary warriors share bunk beds. Not ideal, but everyone starts somewhere!',
    maxRooms: 2,
    charactersPerRoom: 4,
    cost: { coins: 0, gems: 0 },
    unlockLevel: 1,
    roomUpgrades: ['basic_furniture']
  },
  {
    id: 'basic_house',
    name: 'Basic House',
    description: 'A modest house with individual rooms. Characters finally get some privacy and better sleep!',
    maxRooms: 6,
    charactersPerRoom: 3,
    cost: { coins: 25000, gems: 50 },
    unlockLevel: 10,
    roomUpgrades: ['basic_furniture', 'private_rooms']
  },
  {
    id: 'team_mansion',
    name: 'Team Mansion',
    description: 'A luxurious mansion with themed rooms. Characters can customize their living spaces for battle bonuses!',
    maxRooms: 10,
    charactersPerRoom: 2,
    cost: { coins: 100000, gems: 200 },
    unlockLevel: 25,
    roomUpgrades: ['luxury_furniture', 'themed_rooms', 'common_areas']
  },
  {
    id: 'elite_compound',
    name: 'Elite Compound',
    description: 'The ultimate headquarters with specialized facilities, training rooms, and maximum theme bonuses!',
    maxRooms: 15,
    charactersPerRoom: 1,
    cost: { coins: 500000, gems: 1000 },
    unlockLevel: 50,
    roomUpgrades: ['elite_furniture', 'specialized_facilities', 'max_bonuses']
  }
];

const ROOM_THEMES: RoomTheme[] = [
  {
    id: 'gothic',
    name: 'Gothic Chamber',
    description: 'Dark stone walls, candles, and an ominous atmosphere perfect for creatures of the night',
    bonus: 'Magic Damage',
    bonusValue: 15,
    suitableCharacters: ['dracula', 'frankenstein_monster'],
    cost: { coins: 5000, gems: 10 },
    backgroundColor: 'bg-purple-900/20',
    textColor: 'text-purple-300',
    icon: '🦇'
  },
  {
    id: 'medieval',
    name: 'Medieval Hall',
    description: 'Stone walls, banners, and weapon racks - a warriors paradise',
    bonus: 'Physical Damage',
    bonusValue: 15,
    suitableCharacters: ['achilles', 'joan', 'robin_hood'],
    cost: { coins: 5000, gems: 10 },
    backgroundColor: 'bg-amber-900/20',
    textColor: 'text-amber-300',
    icon: '⚔️'
  },
  {
    id: 'victorian',
    name: 'Victorian Study',
    description: 'Elegant furniture, books, and scientific instruments for the intellectual mind',
    bonus: 'Critical Chance',
    bonusValue: 12,
    suitableCharacters: ['holmes'],
    cost: { coins: 7000, gems: 15 },
    backgroundColor: 'bg-emerald-900/20',
    textColor: 'text-emerald-300',
    icon: '🔍'
  },
  {
    id: 'egyptian',
    name: 'Pharaoh\'s Chamber',
    description: 'Golden decorations, hieroglyphs, and royal splendor fit for a pharaoh',
    bonus: 'Defense',
    bonusValue: 20,
    suitableCharacters: ['cleopatra'],
    cost: { coins: 8000, gems: 20 },
    backgroundColor: 'bg-yellow-900/20',
    textColor: 'text-yellow-300',
    icon: '👑'
  },
  {
    id: 'mystical',
    name: 'Mystical Sanctuary',
    description: 'Magical crystals, ancient symbols, and ethereal energy',
    bonus: 'Mana Regeneration',
    bonusValue: 25,
    suitableCharacters: ['merlin', 'sun_wukong'],
    cost: { coins: 6000, gems: 12 },
    backgroundColor: 'bg-blue-900/20',
    textColor: 'text-blue-300',
    icon: '🔮'
  },
  {
    id: 'wild_west',
    name: 'Saloon Room',
    description: 'Wooden furniture, spittoons, and the spirit of the frontier',
    bonus: 'Speed',
    bonusValue: 18,
    suitableCharacters: ['billy_the_kid'],
    cost: { coins: 4000, gems: 8 },
    backgroundColor: 'bg-orange-900/20',
    textColor: 'text-orange-300',
    icon: '🤠'
  },
  {
    id: 'futuristic',
    name: 'Tech Lab',
    description: 'Holographic displays, advanced equipment, and cutting-edge technology',
    bonus: 'Accuracy',
    bonusValue: 20,
    suitableCharacters: ['tesla', 'space_cyborg', 'agent_x'],
    cost: { coins: 10000, gems: 25 },
    backgroundColor: 'bg-cyan-900/20',
    textColor: 'text-cyan-300',
    icon: '🤖'
  },
  {
    id: 'sports_den',
    name: 'Sports Den',
    description: 'Baseball memorabilia, trophies, and all-American spirit',
    bonus: 'Stamina',
    bonusValue: 15,
    suitableCharacters: ['sammy_slugger'],
    cost: { coins: 3000, gems: 5 },
    backgroundColor: 'bg-green-900/20',
    textColor: 'text-green-300',
    icon: '⚾'
  },
  {
    id: 'mongolian',
    name: 'Khan\'s Yurt',
    description: 'Traditional Mongolian decorations and symbols of conquest',
    bonus: 'Leadership',
    bonusValue: 20,
    suitableCharacters: ['genghis_khan'],
    cost: { coins: 6000, gems: 15 },
    backgroundColor: 'bg-red-900/20',
    textColor: 'text-red-300',
    icon: '🏹'
  },
  {
    id: 'alien_lab',
    name: 'Research Pod',
    description: 'Advanced alien technology and experimental equipment',
    bonus: 'Experience Gain',
    bonusValue: 30,
    suitableCharacters: ['alien_grey'],
    cost: { coins: 15000, gems: 50 },
    backgroundColor: 'bg-indigo-900/20',
    textColor: 'text-indigo-300',
    icon: '🛸'
  },
  {
    id: 'nordic',
    name: 'Viking Lodge',
    description: 'Wooden halls, fur pelts, and the spirit of the wild hunt',
    bonus: 'Berserker Rage',
    bonusValue: 25,
    suitableCharacters: ['fenrir'],
    cost: { coins: 5000, gems: 10 },
    backgroundColor: 'bg-slate-900/20',
    textColor: 'text-slate-300',
    icon: '🐺'
  }
];

// Multi-element room decoration system
const ROOM_ELEMENTS: RoomElement[] = [
  // Wall Decor
  {
    id: 'gothic_tapestries',
    name: 'Gothic Tapestries',
    category: 'wallDecor',
    description: 'Dark velvet tapestries with mysterious symbols',
    bonus: 'Magic Damage',
    bonusValue: 8,
    suitableCharacters: ['dracula', 'frankenstein_monster'],
    cost: { coins: 2000, gems: 5 },
    backgroundColor: 'bg-purple-900/20',
    textColor: 'text-purple-300',
    icon: '🪶',
    compatibleWith: ['gothic_chandelier', 'stone_floors'],
    incompatibleWith: ['neon_strips', 'holographic_panels']
  },
  {
    id: 'weapon_displays',
    name: 'Weapon Displays',
    category: 'wallDecor',
    description: 'Mounted swords, shields, and battle trophies',
    bonus: 'Physical Damage',
    bonusValue: 8,
    suitableCharacters: ['achilles', 'joan', 'robin_hood'],
    cost: { coins: 2500, gems: 4 },
    backgroundColor: 'bg-amber-900/20',
    textColor: 'text-amber-300',
    icon: '⚔️',
    compatibleWith: ['wooden_furniture', 'torch_lighting'],
    incompatibleWith: ['crystal_displays', 'tech_panels']
  },
  {
    id: 'holographic_panels',
    name: 'Holographic Panels',
    category: 'wallDecor',
    description: 'Advanced tech displays with data streams',
    bonus: 'Accuracy',
    bonusValue: 10,
    suitableCharacters: ['tesla', 'space_cyborg', 'agent_x'],
    cost: { coins: 4000, gems: 12 },
    backgroundColor: 'bg-cyan-900/20',
    textColor: 'text-cyan-300',
    icon: '📱',
    compatibleWith: ['led_lighting', 'metal_floors'],
    incompatibleWith: ['gothic_tapestries', 'wooden_furniture']
  },

  // Furniture
  {
    id: 'throne_chair',
    name: 'Royal Throne',
    category: 'furniture',
    description: 'Ornate golden throne for true royalty',
    bonus: 'Leadership',
    bonusValue: 12,
    suitableCharacters: ['cleopatra', 'genghis_khan'],
    cost: { coins: 3000, gems: 8 },
    backgroundColor: 'bg-yellow-900/20',
    textColor: 'text-yellow-300',
    icon: '👑',
    compatibleWith: ['golden_accents', 'marble_floors'],
    incompatibleWith: ['wooden_furniture', 'tech_stations']
  },
  {
    id: 'wooden_furniture',
    name: 'Rustic Wood Set',
    category: 'furniture',
    description: 'Handcrafted wooden tables and chairs',
    bonus: 'Stamina',
    bonusValue: 8,
    suitableCharacters: ['billy_the_kid', 'robin_hood'],
    cost: { coins: 1500, gems: 3 },
    backgroundColor: 'bg-orange-900/20',
    textColor: 'text-orange-300',
    icon: '🪑',
    compatibleWith: ['weapon_displays', 'torch_lighting'],
    incompatibleWith: ['throne_chair', 'tech_stations']
  },
  {
    id: 'tech_stations',
    name: 'Tech Workstations',
    category: 'furniture',
    description: 'Advanced computer terminals and lab equipment',
    bonus: 'Critical Chance',
    bonusValue: 10,
    suitableCharacters: ['tesla', 'holmes', 'alien_grey'],
    cost: { coins: 5000, gems: 15 },
    backgroundColor: 'bg-blue-900/20',
    textColor: 'text-blue-300',
    icon: '💻',
    compatibleWith: ['holographic_panels', 'led_lighting'],
    incompatibleWith: ['throne_chair', 'wooden_furniture']
  },

  // Lighting
  {
    id: 'gothic_chandelier',
    name: 'Gothic Chandelier',
    category: 'lighting',
    description: 'Ornate iron chandelier with flickering candles',
    bonus: 'Magic Damage',
    bonusValue: 6,
    suitableCharacters: ['dracula', 'frankenstein_monster'],
    cost: { coins: 2000, gems: 6 },
    backgroundColor: 'bg-purple-900/20',
    textColor: 'text-purple-300',
    icon: '🕯️',
    compatibleWith: ['gothic_tapestries', 'stone_floors'],
    incompatibleWith: ['led_lighting', 'neon_strips']
  },
  {
    id: 'led_lighting',
    name: 'LED Strip System',
    category: 'lighting',
    description: 'Color-changing LED lights with smart controls',
    bonus: 'Speed',
    bonusValue: 8,
    suitableCharacters: ['tesla', 'space_cyborg'],
    cost: { coins: 3500, gems: 10 },
    backgroundColor: 'bg-cyan-900/20',
    textColor: 'text-cyan-300',
    icon: '💡',
    compatibleWith: ['holographic_panels', 'tech_stations'],
    incompatibleWith: ['gothic_chandelier', 'torch_lighting']
  },
  {
    id: 'torch_lighting',
    name: 'Medieval Torches',
    category: 'lighting',
    description: 'Classic wall-mounted torches for authentic ambiance',
    bonus: 'Physical Damage',
    bonusValue: 6,
    suitableCharacters: ['achilles', 'joan'],
    cost: { coins: 1000, gems: 2 },
    backgroundColor: 'bg-amber-900/20',
    textColor: 'text-amber-300',
    icon: '🔥',
    compatibleWith: ['weapon_displays', 'wooden_furniture'],
    incompatibleWith: ['led_lighting', 'gothic_chandelier']
  },

  // Accessories
  {
    id: 'crystal_displays',
    name: 'Mystical Crystals',
    category: 'accessories',
    description: 'Glowing crystals with magical properties',
    bonus: 'Mana Regeneration',
    bonusValue: 15,
    suitableCharacters: ['merlin', 'sun_wukong'],
    cost: { coins: 2500, gems: 8 },
    backgroundColor: 'bg-blue-900/20',
    textColor: 'text-blue-300',
    icon: '🔮',
    compatibleWith: ['gothic_chandelier', 'stone_floors'],
    incompatibleWith: ['weapon_displays', 'tech_stations']
  },
  {
    id: 'golden_accents',
    name: 'Golden Decorations',
    category: 'accessories',
    description: 'Luxurious gold trim and ornamental pieces',
    bonus: 'Defense',
    bonusValue: 10,
    suitableCharacters: ['cleopatra', 'genghis_khan'],
    cost: { coins: 4000, gems: 12 },
    backgroundColor: 'bg-yellow-900/20',
    textColor: 'text-yellow-300',
    icon: '✨',
    compatibleWith: ['throne_chair', 'marble_floors'],
    incompatibleWith: ['wooden_furniture', 'metal_floors']
  },

  // Flooring
  {
    id: 'stone_floors',
    name: 'Ancient Stone',
    category: 'flooring',
    description: 'Weathered stone blocks with mystical runes',
    bonus: 'Defense',
    bonusValue: 8,
    suitableCharacters: ['dracula', 'merlin'],
    cost: { coins: 3000, gems: 7 },
    backgroundColor: 'bg-gray-900/20',
    textColor: 'text-gray-300',
    icon: '🗿',
    compatibleWith: ['gothic_tapestries', 'crystal_displays'],
    incompatibleWith: ['metal_floors', 'tech_stations']
  },
  {
    id: 'marble_floors',
    name: 'Royal Marble',
    category: 'flooring',
    description: 'Polished marble with golden veins',
    bonus: 'Leadership',
    bonusValue: 8,
    suitableCharacters: ['cleopatra', 'achilles'],
    cost: { coins: 5000, gems: 15 },
    backgroundColor: 'bg-yellow-900/20',
    textColor: 'text-yellow-300',
    icon: '⬜',
    compatibleWith: ['throne_chair', 'golden_accents'],
    incompatibleWith: ['wooden_furniture', 'stone_floors']
  },
  {
    id: 'metal_floors',
    name: 'Tech Flooring',
    category: 'flooring',
    description: 'Reinforced metal grating with LED strips',
    bonus: 'Speed',
    bonusValue: 8,
    suitableCharacters: ['tesla', 'space_cyborg'],
    cost: { coins: 4000, gems: 10 },
    backgroundColor: 'bg-cyan-900/20',
    textColor: 'text-cyan-300',
    icon: '🔲',
    compatibleWith: ['holographic_panels', 'led_lighting'],
    incompatibleWith: ['stone_floors', 'marble_floors']
  }
];


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
        name: 'Bunk Room Alpha',
        theme: null,
        elements: [], // New multi-element system
        assignedCharacters: ['achilles', 'holmes', 'dracula', 'merlin', 'cleopatra', 'joan'], // Overcrowded!
        maxCharacters: 4
      },
      {
        id: 'room_2', 
        name: 'Bunk Room Beta',
        theme: null,
        elements: [], // New multi-element system
        assignedCharacters: ['frankenstein_monster', 'sun_wukong', 'tesla', 'billy_the_kid', 'genghis_khan'], // Overcrowded!
        maxCharacters: 4
      }
    ],
    currency: { coins: 50000, gems: 100 },
    unlockedThemes: []
  });

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'room_detail' | 'upgrade_shop' | 'kitchen_chat' | 'confessionals'>('overview');
  const [kitchenConversations, setKitchenConversations] = useState<any[]>([]);
  const [isGeneratingConversation, setIsGeneratingConversation] = useState(false);
  
  // Calculate battle bonuses from room themes
  const battleBonuses = headquarters.rooms.reduce((bonuses: Record<string, number>, room) => {
    if (room.theme) {
      const theme = ROOM_THEMES.find(t => t.id === room.theme);
      if (theme && room.assignedCharacters.length > 0) {
        bonuses[theme.bonus] = (bonuses[theme.bonus] || 0) + theme.bonusValue;
      }
    }
    return bonuses;
  }, {});
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

  const startNewScene = async () => {
    setIsGeneratingConversation(true);
    setCurrentSceneRound(1);
    setKitchenConversations([]);
    
    try {
      // Wait for socket connection
      const isConnected = await kitchenChatService.waitForConnection();
      if (!isConnected) {
        console.warn('Could not establish socket connection for kitchen chat');
      }
      const sceneType = PromptTemplateService.selectSceneType();
      const allRoommates = headquarters.rooms[0].assignedCharacters;
      const participants = PromptTemplateService.selectSceneParticipants(allRoommates, 3);
      const trigger = PromptTemplateService.generateSceneTrigger(sceneType, headquarters.currentTier, headquarters);
      
      console.log('🎬 Starting new scene:', { sceneType, participants, trigger });
      
      const openingConversations = [];
      
      for (const charName of participants) {
        const character = availableCharacters.find(c => c.baseName === charName);
        if (!character) continue;
        
        const teammates = availableCharacters.filter(c => 
          allRoommates.includes(c.baseName) && c.baseName !== charName
        );
        
        // Calculate sleeping arrangement for this character
        const room = headquarters.rooms.find(r => r.assignedCharacters.includes(charName)) || headquarters.rooms[0];
        const charIndex = room.assignedCharacters.indexOf(charName);
        const isOvercrowded = room.assignedCharacters.length > room.maxCharacters;
        const sleepsOnFloor = isOvercrowded && charIndex >= room.maxCharacters;
        const sleepsOnCouch = charIndex === 2 && !sleepsOnFloor; // Third person gets couch if not floor
        
        const context = {
          character,
          teammates,
          coachName: 'Coach',
          livingConditions: {
            apartmentTier: headquarters.currentTier,
            roomTheme: room.theme,
            sleepsOnCouch,
            sleepsOnFloor,
            sleepsUnderTable: charName === 'dracula' && headquarters.currentTier === 'spartan_apartment',
            roomOvercrowded: isOvercrowded,
            floorSleeperCount: Math.max(0, room.assignedCharacters.length - room.maxCharacters),
            roommateCount: room.assignedCharacters.length
          },
          recentEvents: [trigger]
        };
        
        try {
          const response = await kitchenChatService.generateKitchenConversation(context, trigger);
          openingConversations.push({
            id: `scene1_${Date.now()}_${charName}`,
            avatar: character.avatar,
            speaker: character.name.split(' ')[0],
            message: response,
            isComplaint: response.includes('!') || response.toLowerCase().includes('annoying'),
            timestamp: new Date(),
            isAI: true,
            round: 1
          });
        } catch (error: any) {
          console.error(`Scene generation failed for ${charName}:`, error);
          
          // More informative error handling
          let errorMessage = `*${character.name.split(' ')[0]} seems lost in thought*`;
          
          if (error.message === 'Socket not connected to backend. Please refresh the page and try again.') {
            errorMessage = `*${character.name.split(' ')[0]} is waiting for the connection to establish...*`;
            console.log('🔌 Socket connection issue detected. Waiting for connection...');
            
            // Try to wait for connection
            const connected = await kitchenChatService.waitForConnection(3000);
            if (connected) {
              console.log('✅ Socket connected! Retrying...');
              // Retry once after connection
              try {
                const response = await kitchenChatService.generateKitchenConversation(context, trigger);
                openingConversations.push({
                  id: `scene1_${Date.now()}_${charName}`,
                  avatar: character.avatar,
                  speaker: character.name.split(' ')[0],
                  message: response,
                  isComplaint: response.includes('!') || response.toLowerCase().includes('annoying'),
                  timestamp: new Date(),
                  isAI: true,
                  round: 1
                });
                continue; // Skip the fallback
              } catch (retryError) {
                console.error(`Retry failed for ${charName}:`, retryError);
              }
            }
          } else if (error.message === 'USAGE_LIMIT_REACHED') {
            errorMessage = `*${character.name.split(' ')[0]} is conserving energy for later battles*`;
          } else if (error.message?.includes('timeout')) {
            errorMessage = `*${character.name.split(' ')[0]} pauses, gathering their thoughts*`;
          }
          
          openingConversations.push({
            id: `fallback_${Date.now()}_${charName}`,
            avatar: character.avatar,
            speaker: character.name.split(' ')[0],
            message: errorMessage,
            isComplaint: false,
            timestamp: new Date(),
            isAI: false,
            round: 1
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      setKitchenConversations(openingConversations);
    } finally {
      setIsGeneratingConversation(false);
    }
  };

  const continueScene = async () => {
    if (isGeneratingConversation) return;
    
    setIsGeneratingConversation(true);
    setCurrentSceneRound(prev => prev + 1);
    
    try {
      const newRound = currentSceneRound + 1;
      let trigger = '';
      let participants: string[] = [];
      
      if (newRound <= 3) {
        // Non-sequential response selection
        const lastParticipants = [...new Set(kitchenConversations.slice(0, 3).map(c => c.speaker))];
        const availableResponders = headquarters.rooms[0].assignedCharacters.filter(name => {
          const char = availableCharacters.find(c => c.baseName === name);
          return char && lastParticipants.includes(char.name.split(' ')[0]);
        });
        
        // Randomly select 1-2 characters (non-sequential)
        const numResponders = Math.min(Math.random() > 0.5 ? 2 : 1, availableResponders.length);
        participants = availableResponders.sort(() => Math.random() - 0.5).slice(0, numResponders);
        
        const lastMessage = kitchenConversations[0];
        trigger = `Someone responds to ${lastMessage.speaker}'s comment: "${lastMessage.message}". Keep the conversation natural and build on what was said.`;
      } else if (newRound <= 6) {
        const currentParticipants = [...new Set(kitchenConversations.map(c => c.speaker))];
        const availableNewChars = headquarters.rooms[0].assignedCharacters.filter(name => {
          const char = availableCharacters.find(c => c.baseName === name);
          return char && !currentParticipants.includes(char.name.split(' ')[0]);
        });
        
        if (availableNewChars.length > 0) {
          // Random selection of new character
          participants = [availableNewChars[Math.floor(Math.random() * availableNewChars.length)]];
          trigger = `${availableCharacters.find(c => c.baseName === participants[0])?.name.split(' ')[0]} walks into the kitchen and reacts to what's happening`;
        } else {
          // Random selection from all characters
          participants = headquarters.rooms[0].assignedCharacters.sort(() => Math.random() - 0.5).slice(0, 2);
          trigger = 'The conversation takes a new turn';
        }
      } else {
        participants = PromptTemplateService.selectSceneParticipants(headquarters.rooms[0].assignedCharacters, 2);
        const chaosEvents = [
          'Coach suddenly walks in and interrupts',
          'The fire alarm starts going off',
          'There is a loud crash from another room',
          'Someone spills something all over the floor'
        ];
        trigger = chaosEvents[Math.floor(Math.random() * chaosEvents.length)];
      }
      
      const newConversations = [];
      
      for (const charName of participants) {
        const character = availableCharacters.find(c => c.baseName === charName);
        if (!character) continue;
        
        // Calculate sleeping arrangement for this character
        const room = headquarters.rooms.find(r => r.assignedCharacters.includes(charName)) || headquarters.rooms[0];
        const charIndex = room.assignedCharacters.indexOf(charName);
        const isOvercrowded = room.assignedCharacters.length > room.maxCharacters;
        const sleepsOnFloor = isOvercrowded && charIndex >= room.maxCharacters;
        const sleepsOnCouch = charIndex === 2 && !sleepsOnFloor;
        
        const context = {
          character,
          teammates: availableCharacters.filter(c => 
            headquarters.rooms[0].assignedCharacters.includes(c.baseName) && c.baseName !== charName
          ),
          coachName: 'Coach',
          livingConditions: {
            apartmentTier: headquarters.currentTier,
            roomTheme: room.theme,
            sleepsOnCouch,
            sleepsOnFloor,
            sleepsUnderTable: charName === 'dracula' && headquarters.currentTier === 'spartan_apartment',
            roomOvercrowded: isOvercrowded,
            floorSleeperCount: Math.max(0, room.assignedCharacters.length - room.maxCharacters),
            roommateCount: room.assignedCharacters.length
          },
          recentEvents: kitchenConversations.slice(0, 3).map(c => `${c.speaker}: ${c.message}`)
        };
        
        try {
          // Enhanced context with conversation history
          const conversationHistory = kitchenConversations.slice(0, 5).map(c => `${c.speaker}: ${c.message}`).join('\n');
          const enhancedContext = {
            ...context,
            conversationHistory,
            recentEvents: [trigger, ...context.recentEvents]
          };
          
          const response = await kitchenChatService.generateKitchenConversation(enhancedContext, trigger);
          
          // Duplicate detection to prevent repetitive responses
          const recentMessages = kitchenConversations.slice(0, 3).map(c => c.message.toLowerCase());
          const isUnique = response && response.length > 10 && 
            !recentMessages.some(msg => {
              const similarity = msg.includes(response.toLowerCase().substring(0, 15)) || 
                               response.toLowerCase().includes(msg.substring(0, 15));
              return similarity;
            });
          
          if (isUnique) {
            newConversations.push({
              id: `scene${newRound}_${Date.now()}_${charName}`,
              avatar: character.avatar,
              speaker: character.name.split(' ')[0],
              message: response,
              isComplaint: response.includes('!') || response.toLowerCase().includes('annoying'),
              timestamp: new Date(),
              isAI: true,
              round: newRound
            });
          }
        } catch (error) {
          console.error(`Failed to continue scene for ${charName}:`, error);
          if (error instanceof Error && error.message === 'USAGE_LIMIT_REACHED') {
            // Stop trying more characters and refresh usage status
            const loadUsageStatus = async () => {
              try {
                const status = await usageService.getUserUsageStatus();
                setUsageStatus(status);
              } catch (error) {
                console.error('Failed to refresh usage status:', error);
              }
            };
            loadUsageStatus();
            break; // Stop generating more conversations
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setKitchenConversations(prev => [...newConversations, ...prev].slice(0, 25));
    } finally {
      setIsGeneratingConversation(false);
    }
  };

  const handleCoachMessage = async () => {
    if (!coachMessage.trim()) return;
    
    // Add coach message to conversation
    const coachConversation = {
      id: `coach_${Date.now()}`,
      avatar: '👨‍💼',
      speaker: 'Coach',
      message: coachMessage.trim(),
      isComplaint: false,
      timestamp: new Date(),
      isAI: false,
      round: currentSceneRound
    };
    
    setKitchenConversations(prev => [coachConversation, ...prev]);
    const userMessage = coachMessage.trim();
    setCoachMessage('');
    
    // Wait a bit to ensure coach message is visible before generating responses
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsGeneratingConversation(true);
    
    try {
      // Get characters to respond to the coach's message
      const allRoommates = headquarters.rooms[0].assignedCharacters;
      const participants = PromptTemplateService.selectSceneParticipants(allRoommates, 2); // Just 2 characters respond
      
      const responses = [];
      
      for (const charName of participants) {
        const character = availableCharacters.find(c => c.baseName === charName);
        if (!character) continue;
        
        const teammates = availableCharacters.filter(c => 
          allRoommates.includes(c.baseName) && c.baseName !== charName
        );
        
        // Calculate sleeping arrangement for this character
        const room = headquarters.rooms.find(r => r.assignedCharacters.includes(charName)) || headquarters.rooms[0];
        const charIndex = room.assignedCharacters.indexOf(charName);
        const isOvercrowded = room.assignedCharacters.length > room.maxCharacters;
        const sleepsOnFloor = isOvercrowded && charIndex >= room.maxCharacters;
        const sleepsOnCouch = charIndex === 2 && !sleepsOnFloor;
        
        const context = {
          character,
          teammates,
          coachName: 'Coach',
          livingConditions: {
            apartmentTier: headquarters.currentTier,
            roomTheme: room.theme,
            sleepsOnCouch,
            sleepsOnFloor,
            sleepsUnderTable: charName === 'dracula' && headquarters.currentTier === 'spartan_apartment',
            roomOvercrowded: isOvercrowded,
            floorSleeperCount: Math.max(0, room.assignedCharacters.length - room.maxCharacters),
            roommateCount: room.assignedCharacters.length
          },
          recentEvents: [userMessage]
        };
        
        try {
          const response = await kitchenChatService.generateKitchenConversation(
            context, 
            `Your coach just said to everyone: "${userMessage}". React and respond directly to them.`
          );
          responses.push({
            id: `response_${Date.now()}_${charName}`,
            avatar: character.avatar,
            speaker: character.name.split(' ')[0],
            message: response,
            isComplaint: response.includes('!') || response.toLowerCase().includes('annoying'),
            timestamp: new Date(),
            isAI: true,
            round: currentSceneRound + 1
          });
          
          // Add delay between responses for natural flow
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
          console.error(`Response generation failed for ${charName}:`, error);
        }
      }
      
      setKitchenConversations(prev => [...responses, ...prev]);
      setCurrentSceneRound(prev => prev + 1);
    } finally {
      setIsGeneratingConversation(false);
    }
  };

  // Auto-start scene when kitchen chat is opened
  useEffect(() => {
    if (viewMode === 'kitchen_chat' && !sceneInitialized) {
      startNewScene();
      setSceneInitialized(true);
    }
  }, [viewMode, sceneInitialized]);

  // Get character conflicts (for humor)
  const getCharacterConflicts = (roomId: string) => {
    const room = headquarters.rooms.find(r => r.id === roomId);
    if (!room || room.assignedCharacters.length < 2) return [];

    const conflicts = [];
    
    if (room.assignedCharacters.includes('holmes') && room.assignedCharacters.includes('dracula')) {
      conflicts.push('Holmes keeps analyzing Dracula\'s sleeping patterns');
    }
    if (room.assignedCharacters.includes('achilles') && room.assignedCharacters.includes('merlin')) {
      conflicts.push('Achilles thinks Merlin\'s midnight spell practice is too loud');
    }
    if (room.assignedCharacters.includes('cleopatra') && room.assignedCharacters.includes('joan')) {
      conflicts.push('Cleopatra insists on royal treatment, Joan prefers humble quarters');
    }
    if (room.assignedCharacters.includes('frankenstein_monster') && room.assignedCharacters.includes('sun_wukong')) {
      conflicts.push('Sun Wukong\'s energy annoys the contemplative Monster');
    }

    return conflicts;
  };

  // Calculate character happiness in room
  const getCharacterHappiness = (charName: string, roomId: string) => {
    const room = headquarters.rooms.find(r => r.id === roomId);
    if (!room) return { level: 3, status: 'Content', emoji: '😐' };

    let happiness = 3; // Base happiness (1-5 scale)
    
    // Theme compatibility
    const compatibility = getThemeCompatibility(charName, room.theme);
    if (compatibility.type === 'compatible') {
      happiness += 1;
    } else if (compatibility.type === 'incompatible') {
      happiness -= 1; // Penalty for wrong theme
    }
    
    // Overcrowding penalty
    if (room.assignedCharacters.length > room.maxCharacters) {
      happiness -= 1;
    }
    
    // Character conflicts
    const conflicts = getCharacterConflicts(roomId);
    if (conflicts.length > 0) {
      happiness -= 1;
    }
    
    // Tier bonus
    const tierIndex = HEADQUARTERS_TIERS.findIndex(t => t.id === headquarters.currentTier);
    happiness += Math.floor(tierIndex / 2);
    
    // Clamp between 1-5
    happiness = Math.max(1, Math.min(5, happiness));
    
    const statusMap = {
      1: { status: 'Miserable', emoji: '😫' },
      2: { status: 'Unhappy', emoji: '😒' },
      3: { status: 'Content', emoji: '😐' },
      4: { status: 'Happy', emoji: '😊' },
      5: { status: 'Ecstatic', emoji: '🤩' }
    };
    
    return { level: happiness, ...statusMap[happiness as keyof typeof statusMap] };
  };

  // Theme compatibility helper functions
  const getThemeCompatibility = (charName: string, themeId: string | null) => {
    if (!themeId) return { compatible: true, type: 'no_theme' };
    
    const theme = ROOM_THEMES.find(t => t.id === themeId);
    if (!theme) return { compatible: true, type: 'no_theme' };
    
    const isCompatible = theme.suitableCharacters.includes(charName);
    return {
      compatible: isCompatible,
      type: isCompatible ? 'compatible' : 'incompatible',
      theme,
      bonusValue: isCompatible ? theme.bonusValue : 0,
      penalty: isCompatible ? 0 : -5 // Small happiness penalty for wrong theme
    };
  };

  const getRoomThemeWarnings = (roomId: string) => {
    const room = headquarters.rooms.find(r => r.id === roomId);
    if (!room || !room.theme) return [];
    
    const theme = ROOM_THEMES.find(t => t.id === room.theme);
    if (!theme) return [];
    
    const warnings = [];
    const incompatibleCharacters = room.assignedCharacters.filter(charName => 
      !theme.suitableCharacters.includes(charName)
    );
    
    if (incompatibleCharacters.length > 0) {
      warnings.push({
        type: 'theme_mismatch',
        severity: 'warning',
        characters: incompatibleCharacters,
        message: `${incompatibleCharacters.length} fighter(s) clash with ${theme.name} training environment`,
        suggestion: `Consider moving to ${getCharacterSuggestedThemes(incompatibleCharacters[0]).map(t => t.name).join(' or ')}`
      });
    }
    
    return warnings;
  };

  const getCharacterSuggestedThemes = (charName: string) => {
    return ROOM_THEMES.filter(theme => theme.suitableCharacters.includes(charName));
  };

  const calculateMissedBonuses = (roomId: string) => {
    const room = headquarters.rooms.find(r => r.id === roomId);
    if (!room) return [];
    
    const missedBonuses = [];
    
    room.assignedCharacters.forEach(charName => {
      const compatibility = getThemeCompatibility(charName, room.theme);
      
      // Only show missed bonuses if character is incompatible or room has no theme
      if (compatibility.type === 'incompatible' || compatibility.type === 'no_theme') {
        const suggestedThemes = getCharacterSuggestedThemes(charName);
        suggestedThemes.forEach(theme => {
          missedBonuses.push({
            character: charName,
            theme: theme.name,
            bonus: `+${theme.bonusValue}% ${theme.bonus}`,
            themeId: theme.id
          });
        });
      }
    });
    
    return missedBonuses;
  };

  // Calculate team chemistry penalties from overcrowding
  const calculateTeamChemistry = () => {
    const totalCharacters = headquarters.rooms.reduce((sum, room) => sum + room.assignedCharacters.length, 0);
    const totalCapacity = headquarters.rooms.reduce((sum, room) => sum + room.maxCharacters, 0);
    
    let chemistryPenalty = 0;
    if (totalCharacters > totalCapacity) {
      const overflow = totalCharacters - totalCapacity;
      if (overflow >= 4) chemistryPenalty = -35; // 12+ characters in 8-capacity apartment
      else if (overflow >= 2) chemistryPenalty = -25; // 10+ characters
      else chemistryPenalty = -15; // 8+ characters
    }
    
    return { teamCoordination: chemistryPenalty };
  };

  // Calculate total battle bonuses and penalties
  const calculateBattleEffects = () => {
    const effects: Record<string, number> = {};
    
    // Positive bonuses from room themes
    headquarters.rooms.forEach(room => {
      if (room.theme) {
        const theme = ROOM_THEMES.find(t => t.id === room.theme);
        if (theme) {
          room.assignedCharacters.forEach(charName => {
            if (theme.suitableCharacters.includes(charName)) {
              if (!effects[theme.bonus]) effects[theme.bonus] = 0;
              effects[theme.bonus] += theme.bonusValue;
            }
          });
        }
      }
    });
    
    // Negative penalties from overcrowding
    const chemistry = calculateTeamChemistry();
    Object.entries(chemistry).forEach(([key, value]) => {
      if (value !== 0) {
        effects[key] = value;
      }
    });

    return effects;
  };

  const battleEffects = calculateBattleEffects();

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
          maxCharacters: tier.charactersPerRoom
        }))
      }));
    }
  };

  const setRoomTheme = (roomId: string, themeId: string) => {
    const theme = ROOM_THEMES.find(t => t.id === themeId);
    if (!theme) return;

    if (headquarters.currency.coins >= theme.cost.coins && headquarters.currency.gems >= theme.cost.gems) {
      setHeadquarters(prev => ({
        ...prev,
        currency: {
          coins: prev.currency.coins - theme.cost.coins,
          gems: prev.currency.gems - theme.cost.gems
        },
        rooms: prev.rooms.map(room => 
          room.id === roomId ? { ...room, theme: themeId } : room
        ),
        unlockedThemes: [...prev.unlockedThemes, themeId]
      }));
    }
  };

  // Room element management functions
  const addElementToRoom = (roomId: string, elementId: string) => {
    const element = ROOM_ELEMENTS.find(e => e.id === elementId);
    const room = headquarters.rooms.find(r => r.id === roomId);
    
    if (!element || !room) return;

    // Check element capacity based on tier
    const tierCapacity = {
      'spartan_apartment': 2,
      'basic_house': 3,
      'team_mansion': 5,
      'elite_compound': 10
    };
    
    const maxElements = tierCapacity[headquarters.currentTier as keyof typeof tierCapacity] || 2;
    
    if (room.elements.length >= maxElements) {
      console.warn(`Room is at element capacity (${maxElements})`);
      return;
    }

    // Check if player can afford
    if (headquarters.currency.coins >= element.cost.coins && headquarters.currency.gems >= element.cost.gems) {
      setHeadquarters(prev => ({
        ...prev,
        currency: {
          coins: prev.currency.coins - element.cost.coins,
          gems: prev.currency.gems - element.cost.gems
        },
        rooms: prev.rooms.map(room => 
          room.id === roomId 
            ? { ...room, elements: [...room.elements, elementId] }
            : room
        )
      }));
    }
  };

  const removeElementFromRoom = (roomId: string, elementId: string) => {
    setHeadquarters(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => 
        room.id === roomId 
          ? { ...room, elements: room.elements.filter(id => id !== elementId) }
          : room
      )
    }));
  };

  // Calculate bonuses from room elements (including synergy bonuses)
  const calculateRoomBonuses = (roomId: string) => {
    const room = headquarters.rooms.find(r => r.id === roomId);
    if (!room) return {};

    const bonuses: Record<string, number> = {};
    
    // Base element bonuses
    room.elements.forEach(elementId => {
      const element = ROOM_ELEMENTS.find(e => e.id === elementId);
      if (element) {
        bonuses[element.bonus] = (bonuses[element.bonus] || 0) + element.bonusValue;
      }
    });

    // Synergy bonuses for compatible elements
    room.elements.forEach(elementId => {
      const element = ROOM_ELEMENTS.find(e => e.id === elementId);
      if (element) {
        const compatibleInRoom = element.compatibleWith.filter(compatId => 
          room.elements.includes(compatId)
        );
        
        // Add 25% bonus for each compatible element
        compatibleInRoom.forEach(() => {
          bonuses[element.bonus] = (bonuses[element.bonus] || 0) + Math.floor(element.bonusValue * 0.25);
        });
      }
    });

    return bonuses;
  };

  // Get element capacity for current tier
  const getElementCapacity = () => {
    const tierCapacity = {
      'spartan_apartment': 2,
      'basic_house': 3,
      'team_mansion': 5,
      'elite_compound': 10
    };
    return tierCapacity[headquarters.currentTier as keyof typeof tierCapacity] || 2;
  };

  // Generate custom room image using DALL-E
  const generateRoomImage = async (roomId: string) => {
    const room = headquarters.rooms.find(r => r.id === roomId);
    if (!room || room.elements.length === 0) {
      console.warn('Cannot generate image: room not found or no elements selected');
      return;
    }

    setIsGeneratingRoomImage(true);

    try {
      const roomElements = room.elements.map(elementId => {
        const element = ROOM_ELEMENTS.find(e => e.id === elementId);
        return element ? {
          id: element.id,
          name: element.name,
          category: element.category,
          description: element.description
        } : null;
      }).filter(Boolean) as any[];

      const imageUrl = await roomImageService.generateRoomImage({
        roomName: room.name,
        elements: roomElements,
        style: 'photorealistic reality TV set',
        size: 'medium'
      });

      // Update room with generated image
      setHeadquarters(prev => ({
        ...prev,
        rooms: prev.rooms.map(r => 
          r.id === roomId ? { ...r, customImageUrl: imageUrl } : r
        )
      }));

    } catch (error) {
      console.error('Failed to generate room image:', error);
    } finally {
      setIsGeneratingRoomImage(false);
    }
  };

  // Character assignment functions
  const assignCharacterToRoom = (characterId: string, roomId: string) => {
    const character = availableCharacters.find(c => c.baseName === characterId);
    const room = headquarters.rooms.find(r => r.id === roomId);
    
    if (!character || !room) return;
    
    // Check if already in this room
    if (room.assignedCharacters.includes(characterId)) {
      // Clear previous notification timeout
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current);
      }
      
      setMoveNotification({message: `${character.name} is already in ${room.name}`, type: 'warning'});
      notificationTimeout.current = setTimeout(() => {
        setMoveNotification(null);
        setHighlightedRoom(null);
      }, 3000);
      return;
    }
    
    setHeadquarters(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => {
        if (room.id === roomId) {
          const newAssignments = [...room.assignedCharacters, characterId];
          // Check for overcrowding after the move
          const willBeOvercrowded = newAssignments.length > room.maxCharacters;
          
          return {
            ...room,
            assignedCharacters: newAssignments
          };
        } else {
          // Remove character from other rooms
          return {
            ...room,
            assignedCharacters: room.assignedCharacters.filter(id => id !== characterId)
          };
        }
        return room;
      })
    }));
    
    // Enhanced visual feedback
    const newCount = room.assignedCharacters.length + 1;
    const isOvercrowded = newCount > room.maxCharacters;
    
    if (isOvercrowded) {
      const sleepingOnFloor = newCount - room.maxCharacters;
      setMoveNotification({
        message: `${character.name} moved to ${room.name}! ⚠️ ${sleepingOnFloor} fighter(s) now sleeping on floor/couches`,
        type: 'warning'
      });
    } else {
      setMoveNotification({
        message: `${character.name} moved to ${room.name}! Room capacity: ${newCount}/${room.maxCharacters}`,
        type: 'success'
      });
    }
    
    // Clear previous notification timeout
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }
    
    // Highlight the room briefly
    setHighlightedRoom(roomId);
    notificationTimeout.current = setTimeout(() => {
      setHighlightedRoom(null);
      setMoveNotification(null);
    }, 3000);
  };

  const removeCharacterFromRoom = (characterId: string, roomId: string) => {
    setHeadquarters(prev => ({
      ...prev,
      rooms: prev.rooms.map(room => 
        room.id === roomId
          ? { ...room, assignedCharacters: room.assignedCharacters.filter(id => id !== characterId) }
          : room
      )
    }));
  };

  // Get unassigned characters for the pool
  const getUnassignedCharacters = () => {
    const assignedCharacters = headquarters.rooms.flatMap(room => room.assignedCharacters);
    return availableCharacters.filter(char => !assignedCharacters.includes(char.baseName));
  };

  // Helper function to clear all confessional timeouts
  const clearAllConfessionalTimeouts = () => {
    confessionalTimeouts.current.forEach(timeout => clearTimeout(timeout));
    confessionalTimeouts.current.clear();
    console.log('🧹 Cleared all confessional timeouts');
  };

  // Confessional Interview Functions
  const startConfessional = async (characterName: string) => {
    console.log('🎬 Starting confessional for:', characterName);
    
    // Immediately clear any existing interviews and timeouts
    clearAllConfessionalTimeouts();
    
    const character = availableCharacters.find(c => c.baseName === characterName);
    console.log('🎭 Found character:', character?.name, 'ID:', character?.id);
    if (!character) return;

    const initialQuestion = `the living arrangements and how you're adjusting to sharing space with the other fighters`;

    // Set new interview data (complete replacement, not updating previous state)
    setConfessionalData({
      activeCharacter: characterName,
      isInterviewing: true,
      isPaused: false,
      questionCount: 1,
      messages: [],
      isLoading: false
    });

    // Automatically generate character's response to the initial question
    const timeoutId = setTimeout(() => {
      generateCharacterResponse(characterName, initialQuestion);
    }, 1500);
    
    confessionalTimeouts.current.add(timeoutId);
  };

  const generateCharacterResponse = async (characterName: string, hostmasterQuestion: string) => {
    console.log('🎪 Generating response for characterName:', characterName);
    const character = availableCharacters.find(c => c.baseName === characterName);
    console.log('🎨 Character found:', character?.name, 'ID:', character?.id);
    if (!character) return;

    // Check if interview is paused or stopped
    if (confessionalData.isPaused || !confessionalData.isInterviewing) {
      return;
    }

    try {
      // First, generate the character's response to the HOSTMASTER question
      const characterContext = {
        characterId: character.id,
        characterName: character.name,
        personality: character.personality,
        historicalPeriod: character.historicalPeriod,
        mythology: character.mythology,
        currentBondLevel: character.bondLevel,
        previousMessages: []
      };

      // Get other characters for context
      const allHousemates = headquarters.rooms.flatMap(room => room.assignedCharacters);
      const otherCharacters = availableCharacters
        .filter(c => allHousemates.includes(c.baseName) && c.baseName !== characterName)
        .map(c => c.name)
        .slice(0, 4); // Limit to 4 for prompt length

      const characterPrompt = `You are ${character.name} in the BLANK WARS reality show confessional booth. An invisible director behind the camera just asked you an inaudible question about: "${hostmasterQuestion}"

🎬 CONFESSIONAL BOOTH SETUP:
- You're alone in the confessional booth, speaking directly to the camera
- The director's voice is inaudible to viewers - only your responses are heard
- You react to their unheard question/prompt and address it naturally
- This creates authentic reality TV confessional footage

🎬 BLANK WARS REALITY SHOW CONTEXT:
- You're competing in a gladiator-style fighting tournament reality show
- Famous warriors/legends from different eras are forced to live together
- You all sleep in cramped ${headquarters.currentTier} quarters with limited privacy
- Current housemates: ${otherCharacters.join(', ')} (and others)
- There's constant drama about who gets the good bed, bathroom time, food, etc.
- Everyone's competing for prize money and trying to avoid elimination
- Alliances form and break constantly - trust no one
- The cameras are always rolling, capturing every argument and breakdown

YOUR CHARACTER ESSENCE:
- Name: ${character.name}
- Personality: ${character.personality.traits.join(', ')}
- Background: ${character.historicalPeriod} - ${character.mythology}
- Speech Style: ${character.personality.speechStyle}
- Core Motivations: ${character.personality.motivations.join(', ')}

INVISIBLE DIRECTOR RESPONSE STYLE:
- Begin your response as if reacting to their inaudible question
- Use phrases like "You want to know about..." or "That's an interesting question..." 
- Reference the topic naturally as if they just asked you about it
- Stay in character with authentic reactions to the invisible prompt
- Keep responses 1-2 sentences but make them memorable and revealing
- Show your historical personality clashing with reality TV dynamics

EXAMPLE RESPONSE PATTERNS:
- "You're asking about the living arrangements? Well, let me tell you..."
- "That's a good question about [topic]. From my perspective..."
- "You want the truth about [situation]? Here's what really happened..."
- "Interesting that you'd ask about that. The reality is..."

Remember: Only YOUR voice is heard. React to the invisible director's question naturally while staying true to your legendary character!`;

      // Generate character response via API
      console.log('🎤 Generating character response for:', character.name);
      console.log('📦 Sending characterContext:', characterContext);
      
      // Set loading state
      setConfessionalData(prev => ({ ...prev, isLoading: true }));
      
      const response = await fetch('http://localhost:3006/api/confessional-character-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterContext,
          prompt: characterPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const characterResponse = await response.json();
      console.log('✅ Character response received:', characterResponse.message?.substring(0, 100) + '...');

      // Add character response to messages
      setConfessionalData(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: Date.now(),
          type: 'character',
          content: characterResponse.message,
          timestamp: new Date()
        }],
        isLoading: false
      }));

      // After character responds, generate next HOSTMASTER question
      const hostmasterTimeoutId = setTimeout(async () => {
        try {
          const interviewContext = {
            characterName: character.name,
            characterPersonality: character.personality,
            livingConditions: headquarters.currentTier,
            previousQuestions: confessionalData.messages.filter(m => m.type === 'hostmaster').map(m => m.content),
            characterResponses: [...confessionalData.messages.filter(m => m.type === 'character').map(m => m.content), characterResponse.message]
          };

          // Set loading state for hostmaster question generation
          setConfessionalData(prev => ({ ...prev, isLoading: true }));
          
          const response = await fetch('http://localhost:3006/api/confessional-interview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              context: interviewContext,
              userResponse: characterResponse.message
            })
          });

          const data = await response.json();
          
          // Increment question count and clear loading state
          setConfessionalData(prev => ({
            ...prev,
            questionCount: prev.questionCount + 1,
            isLoading: false
          }));

          // Only continue automatically for first 3 questions, then pause for user control
          if (confessionalData.questionCount < 3) {
            const continueTimeoutId = setTimeout(() => {
              generateCharacterResponse(characterName, data.hostmasterResponse);
            }, 3000);
            confessionalTimeouts.current.add(continueTimeoutId);
          } else {
            // Pause after 3 questions
            setConfessionalData(prev => ({
              ...prev,
              isPaused: true
            }));
          }

        } catch (error) {
          console.error('Director prompt error:', error);
          const fallbackQuestion = "your thoughts on team dynamics and how you think your teammates would describe your role in the house";
          setConfessionalData(prev => ({
            ...prev,
            isLoading: false
          }));

          const fallbackTimeoutId = setTimeout(() => {
            generateCharacterResponse(characterName, fallbackQuestion);
          }, 3000);
          confessionalTimeouts.current.add(fallbackTimeoutId);
        }
      }, 2000);
      
      confessionalTimeouts.current.add(hostmasterTimeoutId);

    } catch (error) {
      console.error('Character response error:', error);
      setConfessionalData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const pauseConfessional = () => {
    setConfessionalData(prev => ({
      ...prev,
      isPaused: true
    }));
  };

  const continueConfessional = () => {
    if (!confessionalData.activeCharacter) return;
    
    setConfessionalData(prev => ({
      ...prev,
      isPaused: false
    }));

    // Find the last HOSTMASTER question and continue from there
    const lastHostmasterMessage = confessionalData.messages
      .filter(m => m.type === 'hostmaster')
      .pop();
    
    if (lastHostmasterMessage) {
      const continueTimeoutId = setTimeout(() => {
        generateCharacterResponse(confessionalData.activeCharacter!, lastHostmasterMessage.content);
      }, 1000);
      confessionalTimeouts.current.add(continueTimeoutId);
    }
  };

  const endConfessional = () => {
    console.log('🏁 Ending confessional interview');
    clearAllConfessionalTimeouts();
    setConfessionalData({
      activeCharacter: null,
      messages: [],
      isInterviewing: false,
      isPaused: false,
      questionCount: 0
    });
  };

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
          onClick={() => setShowCharacterPool(!showCharacterPool)}
          className={`px-4 py-2 rounded-lg transition-all relative ${
            showCharacterPool
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } ${getUnassignedCharacters().length > 0 ? 'animate-pulse ring-2 ring-blue-400/50' : ''}`}
          data-tutorial="character-pool-button"
        >
          <User className="w-4 h-4 inline mr-2" />
          Available Fighters ({getUnassignedCharacters().length})
          {getUnassignedCharacters().length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
              {getUnassignedCharacters().length}
            </span>
          )}
        </button>
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
                    {headquarters.rooms.reduce((sum, room) => sum + room.assignedCharacters.length, 0)} team members sharing {headquarters.rooms.reduce((sum, room) => sum + room.maxCharacters, 0)} beds
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
              const allWarnings = headquarters.rooms.flatMap(room => getRoomThemeWarnings(room.id));
              const allMissedBonuses = headquarters.rooms.flatMap(room => calculateMissedBonuses(room.id));
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

              {/* Living Quarters Grid */}
              <div 
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                data-tutorial="room-grid"
              >
            {headquarters.rooms.map((room) => {
              const theme = room.theme ? ROOM_THEMES.find(t => t.id === room.theme) : null;
              const conflicts = getCharacterConflicts(room.id);
              
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
                      assignCharacterToRoom(draggedCharacter, room.id);
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
                      {room.assignedCharacters.length}/{room.maxCharacters}
                    </div>
                  </div>

                  {theme && (
                    <div className={`text-xs ${theme.textColor} mb-2`}>
                      {theme.name} (+{theme.bonusValue}% {theme.bonus})
                    </div>
                  )}

                  {/* Character Avatars with Status */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    {room.assignedCharacters.map(charName => {
                      const character = availableCharacters.find(c => c.baseName === charName);
                      const happiness = getCharacterHappiness(charName, room.id);
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
                              removeCharacterFromRoom(charName, room.id);
                            }}
                            className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                    {/* Empty beds or overcrowding indicator */}
                    {room.assignedCharacters.length <= room.maxCharacters ? (
                      Array.from({ length: room.maxCharacters - room.assignedCharacters.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="flex flex-col items-center opacity-30 hover:opacity-50 transition-opacity cursor-pointer">
                          <Bed className="w-6 h-6 text-gray-500" />
                          <div className="text-xs text-gray-500">Available</div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center text-red-400">
                        <Sofa className="w-6 h-6" />
                        <div className="text-xs">
                          +{room.assignedCharacters.length - room.maxCharacters} on couches
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conflicts and Overcrowding Status */}
                  {room.assignedCharacters.length > room.maxCharacters && (
                    <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-2 mb-2">
                      <div className="text-sm text-red-300 font-semibold flex items-center gap-2">
                        🛏️ OVERCROWDED ROOM
                      </div>
                      <div className="text-xs text-red-200">
                        {room.assignedCharacters.length - room.maxCharacters} fighters sleeping on floor/couches
                      </div>
                      <div className="text-xs text-red-200 mt-1">
                        Capacity: {room.assignedCharacters.length}/{room.maxCharacters} (-{Math.round((room.assignedCharacters.length - room.maxCharacters) * 10)}% team morale)
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
                    const warnings = getRoomThemeWarnings(room.id);
                    const missedBonuses = calculateMissedBonuses(room.id);
                    
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
                </motion.div>
              );
            })}
              </div>
            </motion.div>
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
                onClick={continueScene}
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
                      onKeyPress={(e) => e.key === 'Enter' && handleCoachMessage()}
                      disabled={isGeneratingConversation}
                    />
                    <button
                      onClick={handleCoachMessage}
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
                        key={character.baseName}
                        className="flex flex-col items-center p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-purple-600/30 transition-colors"
                        onClick={() => startConfessional(character.baseName)}
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
                        {availableCharacters.find(c => c.baseName === confessionalData.activeCharacter)?.avatar || '👤'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {availableCharacters.find(c => c.baseName === confessionalData.activeCharacter)?.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {availableCharacters.find(c => c.baseName === confessionalData.activeCharacter)?.archetype} • In Confessional
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
                          onClick={continueConfessional}
                          className="text-green-400 hover:text-white px-3 py-1 rounded bg-gray-700 hover:bg-green-600 transition-colors"
                        >
                          Continue
                        </button>
                      ) : (
                        <button
                          onClick={pauseConfessional}
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
                            {availableCharacters.find(c => c.baseName === confessionalData.activeCharacter)?.name.toUpperCase() || 'CHARACTER'}
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

      {/* Character Pool Panel */}
      {viewMode === 'overview' && showCharacterPool && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-gray-800/80 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Available Fighters ({getUnassignedCharacters().length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {getUnassignedCharacters().map(character => (
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
            {getUnassignedCharacters().length === 0 && (
              <div className="col-span-full text-center text-gray-400 py-8">
                All fighters are on set!
              </div>
            )}
          </div>
        </motion.div>
      )}

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

                const elementCapacity = getElementCapacity();
                const roomBonuses = calculateRoomBonuses(selectedRoom);

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
                                onClick={() => generateRoomImage(selectedRoom)}
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
                                    onClick={() => removeElementFromRoom(selectedRoom, elementId)}
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
                                        addElementToRoom(selectedRoom, element.id);
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