'use client';

import { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { createDemoCharacterCollection, Character } from '../data/characters';
import { kitchenChatService } from '../services/kitchenChatService';
import { PromptTemplateService } from '../services/promptTemplateService';

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

// Room instance
interface Room {
  id: string;
  name: string;
  theme: string | null;
  assignedCharacters: string[];
  maxCharacters: number;
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


export default function TeamHeadquarters() {
  
  const [availableCharacters] = useState(() => 
    createDemoCharacterCollection().map(char => ({
      ...char,
      baseName: char.id.split('_')[0]
    }))
  );

  const [headquarters, setHeadquarters] = useState<HeadquartersState>({
    currentTier: 'spartan_apartment',
    rooms: [
      {
        id: 'room_1',
        name: 'Bunk Room Alpha',
        theme: null,
        assignedCharacters: ['achilles', 'holmes', 'dracula', 'merlin'],
        maxCharacters: 4
      },
      {
        id: 'room_2', 
        name: 'Bunk Room Beta',
        theme: null,
        assignedCharacters: ['cleopatra', 'joan', 'frankenstein_monster', 'sun_wukong'],
        maxCharacters: 4
      }
    ],
    currency: { coins: 50000, gems: 100 },
    unlockedThemes: []
  });

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'room_detail' | 'upgrade_shop' | 'kitchen_chat'>('overview');
  const [kitchenConversations, setKitchenConversations] = useState<any[]>([]);
  const [isGeneratingConversation, setIsGeneratingConversation] = useState(false);
  const [currentSceneRound, setCurrentSceneRound] = useState(0);
  const [sceneInitialized, setSceneInitialized] = useState(false);
  const [coachMessage, setCoachMessage] = useState('');

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
      const trigger = PromptTemplateService.generateSceneTrigger(sceneType, headquarters.currentTier);
      
      console.log('🎬 Starting new scene:', { sceneType, participants, trigger });
      
      const openingConversations = [];
      
      for (const charName of participants) {
        const character = availableCharacters.find(c => c.baseName === charName);
        if (!character) continue;
        
        const teammates = availableCharacters.filter(c => 
          allRoommates.includes(c.baseName) && c.baseName !== charName
        );
        
        const context = {
          character,
          teammates,
          coachName: 'Coach',
          livingConditions: {
            apartmentTier: headquarters.currentTier,
            roomTheme: headquarters.rooms[0].theme,
            sleepsOnCouch: allRoommates.indexOf(charName) === 2,
            sleepsUnderTable: charName === 'dracula' && headquarters.currentTier === 'spartan_apartment'
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
        } catch (error) {
          console.error(`Scene generation failed for ${charName}:`, error);
          openingConversations.push({
            id: `fallback_${Date.now()}_${charName}`,
            avatar: character.avatar,
            speaker: character.name.split(' ')[0],
            message: `*${character.name.split(' ')[0]} looks around confused* This living situation is... interesting.`,
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
        const lastParticipants = [...new Set(kitchenConversations.slice(0, 3).map(c => c.speaker))];
        participants = headquarters.rooms[0].assignedCharacters.filter(name => {
          const char = availableCharacters.find(c => c.baseName === name);
          return char && lastParticipants.includes(char.name.split(' ')[0]);
        });
        trigger = `The conversation continues - someone responds to what was just said`;
      } else if (newRound <= 6) {
        const currentParticipants = [...new Set(kitchenConversations.map(c => c.speaker))];
        const availableNewChars = headquarters.rooms[0].assignedCharacters.filter(name => {
          const char = availableCharacters.find(c => c.baseName === name);
          return char && !currentParticipants.includes(char.name.split(' ')[0]);
        });
        
        if (availableNewChars.length > 0) {
          participants = [availableNewChars[0]];
          trigger = `${availableCharacters.find(c => c.baseName === availableNewChars[0])?.name.split(' ')[0]} walks into the kitchen and reacts to what's happening`;
        } else {
          participants = headquarters.rooms[0].assignedCharacters.slice(0, 2);
          trigger = 'The situation escalates further';
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
        
        const context = {
          character,
          teammates: availableCharacters.filter(c => 
            headquarters.rooms[0].assignedCharacters.includes(c.baseName) && c.baseName !== charName
          ),
          coachName: 'Coach',
          livingConditions: {
            apartmentTier: headquarters.currentTier,
            roomTheme: headquarters.rooms[0].theme,
            sleepsOnCouch: headquarters.rooms[0].assignedCharacters.indexOf(charName) === 2,
            sleepsUnderTable: charName === 'dracula' && headquarters.currentTier === 'spartan_apartment'
          },
          recentEvents: kitchenConversations.slice(0, 3).map(c => `${c.speaker}: ${c.message}`)
        };
        
        try {
          const response = await kitchenChatService.generateKitchenConversation(context, trigger);
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
        } catch (error) {
          console.error(`Failed to continue scene for ${charName}:`, error);
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
        
        const context = {
          character,
          teammates,
          coachName: 'Coach',
          livingConditions: {
            apartmentTier: headquarters.currentTier,
            roomTheme: headquarters.rooms[0].theme,
            sleepsOnCouch: allRoommates.indexOf(charName) === 2,
            sleepsUnderTable: charName === 'dracula' && headquarters.currentTier === 'spartan_apartment'
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

  // Calculate total battle bonuses
  const calculateBattleBonuses = () => {
    const bonuses: Record<string, number> = {};
    
    headquarters.rooms.forEach(room => {
      if (room.theme) {
        const theme = ROOM_THEMES.find(t => t.id === room.theme);
        if (theme) {
          room.assignedCharacters.forEach(charName => {
            if (theme.suitableCharacters.includes(charName)) {
              if (!bonuses[theme.bonus]) bonuses[theme.bonus] = 0;
              bonuses[theme.bonus] += theme.bonusValue;
            }
          });
        }
      }
    });

    return bonuses;
  };

  const battleBonuses = calculateBattleBonuses();

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
      <div className="flex gap-2">
        {['overview', 'kitchen_chat', 'upgrade_shop'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as any)}
            className={`px-4 py-2 rounded-lg transition-all ${
              viewMode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {mode === 'overview' ? 'Room Overview' : 
             mode === 'kitchen_chat' ? 'Kitchen Table' : 
             'Upgrade Shop'}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
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
                  }`}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedRoom(room.id)}
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

                  {/* Character Avatars */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {room.assignedCharacters.map(charName => {
                      const character = availableCharacters.find(c => c.baseName === charName);
                      return character ? (
                        <div key={charName} className="flex flex-col items-center">
                          <div className="text-lg">{character.avatar}</div>
                          <div className="text-xs text-gray-400 truncate max-w-16">
                            {character.name.split(' ')[0]}
                          </div>
                        </div>
                      ) : null;
                    })}
                    {/* Empty beds */}
                    {Array.from({ length: room.maxCharacters - room.assignedCharacters.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="flex flex-col items-center opacity-30">
                        <Bed className="w-6 h-6 text-gray-500" />
                        <div className="text-xs text-gray-500">Empty</div>
                      </div>
                    ))}
                  </div>

                  {/* Conflicts */}
                  {conflicts.length > 0 && (
                    <div className="text-xs text-orange-400 italic">
                      😤 {conflicts[0]}
                    </div>
                  )}

                  {!theme && headquarters.currentTier !== 'spartan_apartment' && (
                    <div className="text-xs text-blue-400 flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      Click to add theme
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
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
                Kitchen Table Conversations
              </h2>
              <p className="text-gray-400 text-sm">Where legendary warriors discuss their living situation...</p>
            </div>

            {/* Kitchen Table Visual */}
            <div className="bg-gradient-to-b from-amber-900/20 to-amber-800/10 rounded-xl p-6 mb-6 border border-amber-700/30">
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">🍽️</div>
                <div className="text-gray-300 text-sm">The communal kitchen table - ground zero for legendary drama</div>
                {headquarters.currentTier === 'spartan_apartment' && (
                  <div className="text-xs text-purple-400 mt-2">
                    ⚰️ (Dracula's coffin is under here during the day)
                  </div>
                )}
              </div>

              {/* Current Residents */}
              <div className="flex justify-center gap-4 mb-4">
                {headquarters.rooms[0].assignedCharacters.slice(0, 3).map((charName, index) => {
                  const character = availableCharacters.find(c => c.baseName === charName);
                  if (!character) return null;
                  return (
                    <div key={charName} className="text-center">
                      <div className="text-3xl mb-1">{character.avatar}</div>
                      <div className="text-xs text-gray-400">
                        {character.name.split(' ')[0]}
                      </div>
                      {index === 2 && (
                        <div className="text-xs text-orange-400 mt-1">
                          😴 Couch
                        </div>
                      )}
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
              <button
                onClick={continueScene}
                disabled={isGeneratingConversation}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors font-semibold"
              >
                {currentSceneRound === 0 ? '🎬 Start Scene' : '▶️ Continue Scene'}
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
      </AnimatePresence>

      {/* Room Detail Modal */}
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
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Room Management</h2>
              <p className="text-gray-400 mb-4">Detailed room management coming soon!</p>
              <button
                onClick={() => setSelectedRoom(null)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}