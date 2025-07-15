'use client';

import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Dumbbell, Sword, Home, ShoppingBag,
  Database, TrendingUp, Package, MessageCircle, 
  Sparkles, Crown, Building, Target, Brain,
  Trophy, ChevronDown, ChevronRight, Activity, Shield,
  BookOpen, Star, User, Eye, EyeOff, BarChart3, DollarSign,
  AlertTriangle
} from 'lucide-react';

import CoachProgressionPage from '@/app/coach/page';

// Import stable components
import TeamHeadquarters from './TeamHeadquarters';
import PerformanceCoachingChat from './PerformanceCoachingChat';
import EquipmentAdvisorChat from './EquipmentAdvisorChat';
import SkillDevelopmentChat from './SkillDevelopmentChat';
import TeamBuildingActivities from './TeamBuildingActivities';

// Import components directly to fix crashes
import TrainingGrounds from './TrainingGrounds';
import ProgressionDashboard from './ProgressionDashboard';
import Clubhouse from './Clubhouse';
import MerchStore from './MerchStore';
import PackOpening from './PackOpening';
import EquipmentManager from './EquipmentManager';
import AbilityManager from './AbilityManager';
import MembershipSelection from './MembershipSelection';
import TrainingFacilitySelector from './TrainingFacilitySelector';
import RealEstateAgentChat from './RealEstateAgentChat';
import FacilitiesManager from './FacilitiesManager';
import SkillTree from './SkillTree';
import AICoach from './AICoach';
import PersonalTrainerChat from './PersonalTrainerChat';
import CharacterDatabase from './CharacterDatabase';
// CoachingInterface is lazy-loaded below
import TeamManagementCoaching from './TeamManagementCoaching';
import TherapyModule from './TherapyModule';
import IndividualSessionsWrapper from './IndividualSessionsWrapper';
import CombinedGroupActivitiesWrapper from './CombinedGroupActivitiesWrapper';
import { createDemoCharacterCollection } from '@/data/characters';
import { characterAPI } from '@/services/apiClient';

// Lazy load non-critical components
const ImprovedBattleArena = lazy(() => import('./ImprovedBattleArena'));
const TeamBuilder = lazy(() => import('./TeamBuilder'));

// Placeholder components for debugging
const PlaceholderComponent = () => (
  <div className="p-8 text-center">
    <h2 className="text-2xl font-bold mb-4">Component Placeholder</h2>
    <p className="text-gray-400">This component is temporarily disabled for debugging.</p>
  </div>
);

// Keep essential types as regular imports
import { OwnedCharacter } from '@/data/userAccount';
import { TeamComposition } from '@/data/teamBuilding';

// Loading component for Suspense fallback
const ComponentLoader = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-400">Loading {name}...</p>
    </div>
  </div>
);

// Dynamic imports for psychology battle components
const CoachingInterface = lazy(() => import('./CoachingInterface'));
const GameplanTracker = lazy(() => import('./GameplanTracker'));

interface SubTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  component: React.ComponentType;
  description?: string;
}

interface MainTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  subTabs: SubTab[];
}

interface MainTabSystemProps {
  initialTab?: string;
  initialSubTab?: string;
}

export default function MainTabSystem({ initialTab = 'characters', initialSubTab }: MainTabSystemProps) {
  const [activeMainTab, setActiveMainTab] = useState(initialTab);
  const [activeSubTab, setActiveSubTab] = useState('progression');
  const [isMainTabExpanded, setIsMainTabExpanded] = useState(true);
  const [globalSelectedCharacterId, setGlobalSelectedCharacterId] = useState('achilles');
  
  
  console.log('🔥 MainTabSystem state:', { activeMainTab, activeSubTab, globalSelectedCharacterId });

  // Demo character data with enhanced training integration
  const demoCharacter = {
    id: 'demo_achilles',
    name: 'Achilles',
    title: 'Hero of Troy',
    avatar: '⚔️',
    archetype: 'warrior' as const,
    rarity: 'legendary' as const,
    level: 18,
    // Enhanced with training bonuses
    trainingBonuses: {
      strength: 8,
      defense: 5,
      speed: 6,
      special: 4
    },
    baseStats: {
      strength: 85 + 8, // Base + training bonus
      agility: 72 + 6,
      intelligence: 58 + 4,
      vitality: 80 + 5,
      wisdom: 45 + 4,
      charisma: 65
    },
    combatStats: {
      health: 1200,
      maxHealth: 1200,
      mana: 300,
      maxMana: 300,
      attack: 185 + 8, // Enhanced by training
      defense: 120 + 5,
      magicAttack: 50 + 4,
      magicDefense: 80 + 5,
      speed: 140 + 6,
      criticalChance: 25,
      criticalDamage: 200,
      accuracy: 90,
      evasion: 20
    },
    // Training-enhanced progression data
    energy: 85,
    maxEnergy: 100,
    trainingLevel: 75,
    trainingPoints: 12, // Available training points for skill learning
    statPoints: 3,
    experience: {
      characterId: 'demo_achilles',
      currentLevel: 18,
      currentXP: 450,
      totalXP: 12450,
      xpToNextLevel: 850,
      statPoints: 3,
      skillPoints: 5,
      milestoneRewards: [],
      levelHistory: [],
      lastUpdated: new Date()
    },
    skills: {
      characterId: 'demo_achilles',
      coreSkills: {
        combat: { level: 22, experience: 450, maxLevel: 100 },
        survival: { level: 18, experience: 320, maxLevel: 100 },
        mental: { level: 16, experience: 380, maxLevel: 100 },
        social: { level: 12, experience: 210, maxLevel: 100 },
        spiritual: { level: 8, experience: 150, maxLevel: 100 }
      },
      signatureSkills: {},
      archetypeSkills: {},
      passiveAbilities: [],
      activeAbilities: [],
      unlockedNodes: [],
      skillPoints: 5,
      lastUpdated: new Date()
    },
    abilities: {
      characterId: 'demo_achilles',
      equipped: { slot1: null, slot2: null, slot3: null, slot4: null },
      available: [],
      cooldowns: {},
      lastUpdated: new Date()
    },
    personality: {
      traits: ['Honorable', 'Wrathful', 'Courageous', 'Prideful'],
      speechStyle: 'Noble and passionate',
      motivations: ['Glory', 'Honor', 'Revenge'],
      fears: ['Dishonor', 'Being forgotten'],
      relationships: []
    },
    progressionTree: { branches: [] },
    equippedItems: {},
    inventory: [],
    unlockedContent: ['basic_training', 'combat_academy'],
    achievements: ['first_victory', 'combat_master'],
    bondLevel: 80,
    fatigue: 20,
    battleAI: {
      aggression: 90,
      defensiveness: 30,
      riskTaking: 80,
      adaptability: 60,
      preferredStrategies: ['frontal_assault', 'berserker_rush', 'honor_duel']
    },
    customization: {
      battleQuotes: [
        'For glory and honor!',
        'Face me if you dare!',
        'The gods smile upon me!',
        'None can stand against my might!'
      ]
    },
    description: 'The greatest warrior of the Trojan War, nearly invincible in combat but driven by rage and honor.',
    historicalPeriod: 'Ancient Greece (1200 BCE)',
    mythology: 'Greek'
  };

  // Component wrappers
  const ProgressionDashboardWrapper = () => {
    const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(true);
    
    // Load real characters from API
    useEffect(() => {
      const loadCharacters = async () => {
        try {
          const response = await characterAPI.getUserCharacters();
          const characters = response.characters || [];
          
          const enhancedCharacters = characters.map((char: any) => {
            const baseName = char.name?.toLowerCase() || char.character_id || char.id;
            return {
              ...char,
              baseName,
              name: char.name,
              level: char.level || 1,
              archetype: char.archetype || 'warrior',
              avatar: char.avatar || '⚔️',
              base_attack: char.base_attack,
              base_health: char.base_health,
              base_defense: char.base_defense,
              base_speed: char.base_speed,
              base_special: char.base_special,
              current_health: char.current_health,
              max_health: char.max_health,
              experience: char.experience,
              bond_level: char.bond_level,
              inventory: char.inventory || [],
              equipment: char.equipment || {},
              abilities: char.abilities || [],
              trainingBonuses: {
                strength: Math.floor((char.level || 1) / 3),
                defense: Math.floor((char.level || 1) / 4),
                speed: Math.floor((char.level || 1) / 3.5),
                special: Math.floor((char.level || 1) / 2.5)
              }
            };
          });
          
          setAvailableCharacters(enhancedCharacters);
          setCharactersLoading(false);
        } catch (error) {
          console.error('Error loading characters:', error);
          setCharactersLoading(false);
        }
      };
      
      loadCharacters();
    }, []);

    const selectedCharacter = useMemo(() => {
      return availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
    }, [availableCharacters, globalSelectedCharacterId]);
    console.log('Progression - Real character data:', selectedCharacter?.name, 'Level:', selectedCharacter?.level, 'Base Attack:', selectedCharacter?.base_attack);
    console.log('Progression - Training bonuses:', selectedCharacter?.trainingBonuses);
    
    if (charactersLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-orange-600/30 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading real character data...</p>
          </div>
        </div>
      );
    }

    return (
    <div className="space-y-6">
      <div className="flex gap-6">
          {/* Character Sidebar */}
          <div className="w-80 bg-gray-800/80 rounded-xl p-4 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Characters
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    console.log('Progression - Clicking character:', character.name, character.baseName);
                    setGlobalSelectedCharacterId(character.baseName);
                  }}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    globalSelectedCharacterId === character.baseName
                      ? 'border-green-500 bg-green-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{character.avatar}</div>
                    <div>
                      <div className="font-semibold">{character.name}</div>
                      <div className="text-xs opacity-75">Lv.{character.level} {character.archetype}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Character Image Display */}
            <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl p-8 text-center mb-8">
              <div className="flex flex-col items-center gap-6">
                {/* Character Image */}
                <div className="w-72 h-72 rounded-xl overflow-hidden border-4 border-gray-600 shadow-2xl">
                  <img 
                    src={(() => {
                      // Map character names to their image file names
                      const characterImageMap: Record<string, string> = {
                        'achilles': 'Achilles 02.png',
                        'agent x': 'Agent X 03.png',
                        'billy the kid': 'Billy the Kid 02.png',
                        'cleopatra': 'Cleopatra 01.png',
                        'cyborg': 'Cyborg 03.png',
                        'dracula': 'Dracula 02.png',
                        'fenrir': 'Fenrir 01.png',
                        'frankenstein': 'Frankenstein 01.png',
                        'frankenstein\'s monster': 'Frankenstein 01.png',
                        'frankensteins monster': 'Frankenstein 01.png', // Without apostrophe
                        'genghis khan': 'Gengas Khan 01.png',
                        'gengas khan': 'Gengas Khan 01.png', // Alternative spelling
                        'joan of arc': 'Joan of ark 01.png',
                        'joan of ark': 'Joan of ark 01.png', // Alternative spelling
                        'merlin': 'Merlin 02.png',
                        'sherlock holmes': 'Sherlock Holmes 01.png',
                        'sun wukong': 'Sun Wukong 02.png',
                        'tesla': 'Tesla 03.png',
                        'nikola tesla': 'Tesla 03.png',
                        'zeta': 'Zeta 01.png',
                        'zeta reticulan': 'Zeta 01.png', // Alternative name
                        'sammy "slugger" sullivan': 'sammy_slugger.png', // Real Sammy image
                        'sammy_slugger': 'sammy_slugger.png', // Underscore version
                        'robin hood': 'robin_hood.png', // Real Robin Hood image
                        'robin_hood': 'robin_hood.png', // Underscore version  
                        'count dracula': 'Dracula 02.png', // Count Dracula variation
                        'cleopatra vii': 'Cleopatra 01.png', // Cleopatra VII variation
                        'vega-x': 'Cyborg 03.png', // Vega-X uses Cyborg image
                      };
                      
                      const characterName = selectedCharacter?.name?.toLowerCase()?.trim();
                      console.log('🖼️ Character Image Debug:', {
                        originalName: selectedCharacter?.name,
                        characterName,
                        hasMapping: !!characterImageMap[characterName || ''],
                        availableKeys: Object.keys(characterImageMap)
                      });
                      
                      // Only use mapped images, no fallback to wrong character
                      if (characterName && characterImageMap[characterName]) {
                        return `/images/Character /Progression/${characterImageMap[characterName]}`;
                      }
                      
                      // Return empty string if no match found - this will trigger alt text instead of wrong image
                      return '';
                    })()}
                    alt={selectedCharacter?.name || 'Character'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('❌ Image failed to load:', e.currentTarget.src);
                      // Hide the image element instead of showing wrong character
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                
                {/* Character Info */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                    <div className="text-3xl">{selectedCharacter?.avatar || '⚔️'}</div>
                    <div>
                      <div>{selectedCharacter?.name || 'Loading...'}</div>
                      <div className="text-sm text-gray-400">Level {selectedCharacter?.level || 1} {selectedCharacter?.archetype || 'warrior'}</div>
                    </div>
                  </h2>
                </div>
              </div>
            </div>

            <ProgressionDashboard
              character={selectedCharacter}
              onAllocateSkillPoint={(skill) => console.log(`${selectedCharacter?.name || 'Character'} allocated skill point to ${skill}`)}
              onAllocateStatPoint={(stat) => console.log(`${selectedCharacter?.name || 'Character'} allocated stat point to ${stat}`)}
              onViewDetails={(section) => console.log(`${selectedCharacter?.name || 'Character'} viewing details for ${section}`)}
            />
            
            {/* Training Enhancement Banner */}
            <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-xl p-4 border border-orange-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300 font-semibold">Training Enhanced Stats for {selectedCharacter?.name || 'Character'}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-red-400 font-bold">+{selectedCharacter?.trainingBonuses?.strength || 0}</div>
                  <div className="text-gray-400">Strength</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 font-bold">+{selectedCharacter?.trainingBonuses?.defense || 0}</div>
                  <div className="text-gray-400">Defense</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-bold">+{selectedCharacter?.trainingBonuses?.speed || 0}</div>
                  <div className="text-gray-400">Speed</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-bold">+{selectedCharacter?.trainingBonuses?.special || 0}</div>
                  <div className="text-gray-400">Special</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-orange-200">
                Training Points Available: {selectedCharacter?.trainingPoints || ((selectedCharacter?.level || 1) * 2)} • Training Level: {selectedCharacter?.trainingLevel || 75}%
              </div>
            </div>
          </div>
        </div>
    </div>
    );
  };

  const EquipmentManagerWrapper = () => {
    const [characterEquipment, setCharacterEquipment] = useState<Record<string, any>>({});
    const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(true);
    
    // Load real characters from API
    useEffect(() => {
      const loadCharacters = async () => {
        try {
          const response = await characterAPI.getUserCharacters();
          const characters = response.characters || [];
          
          const enhancedCharacters = characters.map((char: any) => {
            const baseName = char.name?.toLowerCase() || char.character_id || char.id;
            return {
              ...char,
              baseName,
              name: char.name,
              level: char.level || 1,
              archetype: char.archetype || 'warrior',
              avatar: char.avatar || '⚔️',
              base_attack: char.base_attack,
              base_health: char.base_health,
              base_defense: char.base_defense,
              base_speed: char.base_speed,
              base_special: char.base_special,
              current_health: char.current_health,
              max_health: char.max_health,
              experience: char.experience,
              bond_level: char.bond_level,
              inventory: char.inventory || [],
              equipment: char.equipment || {},
              abilities: char.abilities || [],
              trainingBonuses: {
                strength: Math.floor((char.level || 1) / 3),
                defense: Math.floor((char.level || 1) / 4),
                speed: Math.floor((char.level || 1) / 3.5),
                special: Math.floor((char.level || 1) / 2.5)
              },
              equippedItems: char.equippedItems || char.equipment || {}
            };
          });
          
          setAvailableCharacters(enhancedCharacters);
          setCharactersLoading(false);
        } catch (error) {
          console.error('Error loading characters:', error);
          setCharactersLoading(false);
        }
      };
      
      loadCharacters();
    }, []);

    const selectedCharacter = useMemo(() => {
      return availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
    }, [availableCharacters, globalSelectedCharacterId]);
    console.log('Equipment - Real character data:', selectedCharacter?.name, 'Inventory count:', selectedCharacter?.inventory?.length, 'Equipment:', selectedCharacter?.equipment);
    
    if (charactersLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading real character data...</p>
          </div>
        </div>
      );
    }

    // Handle equipment changes
    const handleEquip = (equipment: any) => {
      console.log('🔧 handleEquip called:', equipment);
      console.log('🔧 Current character:', globalSelectedCharacterId);
      console.log('🔧 Current equipment state:', characterEquipment);
      
      setCharacterEquipment(prev => {
        const updated = {
          ...prev,
          [globalSelectedCharacterId]: {
            ...prev[globalSelectedCharacterId],
            [equipment.slot]: equipment
          }
        };
        console.log('🔧 Updated equipment state:', updated);
        return updated;
      });
    };
    
    const handleUnequip = (slot: string) => {
      setCharacterEquipment(prev => ({
        ...prev,
        [globalSelectedCharacterId]: {
          ...prev[globalSelectedCharacterId],
          [slot]: undefined
        }
      }));
    };
    
    return (
    <div className="space-y-6">
      <div className="flex gap-6">
          {/* Character Sidebar */}
          <div className="w-80 bg-gray-800/80 rounded-xl p-4 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Characters
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    console.log('Clicking character:', character.name, character.baseName);
                    setGlobalSelectedCharacterId(character.baseName);
                  }}
                  className={`w-full p-3 rounded-lg border transition-all text-left cursor-pointer ${
                    globalSelectedCharacterId === character.baseName
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                  }`}
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{character.avatar}</div>
                    <div>
                      <div className="font-semibold">{character.name}</div>
                      <div className="text-xs opacity-75">Lv.{character.level} {character.archetype}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Character Image Display */}
            <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl p-8 text-center mb-8">
              <div className="flex flex-col items-center gap-6">
                {/* Character Image */}
                <div className="w-72 h-72 rounded-xl overflow-hidden border-4 border-gray-600 shadow-2xl">
                  <img 
                    src={(() => {
                      // Map character names to their equipment image file names
                      const characterImageMap: Record<string, string> = {
                        'achilles': 'achilles_equipment.png',
                        'agent x': 'agent_equipment.png',
                        'billy the kid': 'billy_the_kid_equipment.png',
                        'cleopatra': 'cleopatra_equipment.png',
                        'cyborg': 'cyborg_equipment.png',
                        'dracula': 'dracula_equipment.png',
                        'count dracula': 'dracula_equipment.png',
                        'fenrir': 'fenrir_equipment.png',
                        'frankenstein': 'frankenstein_equipment.png',
                        'frankenstein\'s monster': 'frankenstein_equipment.png',
                        'frankensteins monster': 'frankenstein_equipment.png',
                        'genghis khan': 'gengas_khan_equipment.png',
                        'gengas khan': 'gengas_khan_equipment.png',
                        'joan of arc': 'joan_of_arc_equipment.png',
                        'joan of ark': 'joan_of_arc_equipment.png',
                        'merlin': 'merlin_equipment.png',
                        'robin hood': 'robin_hood_equipment.png',
                        'robin_hood': 'robin_hood_equipment.png',
                        'sherlock holmes': 'sherlock_holmes_equipment.png',
                        'sun wukong': 'sun_wukong_equipment.png',
                        'tesla': 'tesla_equipment.png',
                        'nikola tesla': 'tesla_equipment.png',
                        'zeta': 'zeta__equipment.png',
                        'zeta reticulan': 'zeta__equipment.png',
                        'sammy "slugger" sullivan': 'sammy_slugger_equipment.png', // Real Sammy equipment image
                        'sammy_slugger': 'sammy_slugger_equipment.png', // Real Sammy equipment image
                        'cleopatra vii': 'cleopatra_equipment.png',
                        'vega-x': 'cyborg_equipment.png',
                      };
                      
                      const characterName = selectedCharacter?.name?.toLowerCase()?.trim();
                      console.log('🎨 Equipment Image Debug:', {
                        originalName: selectedCharacter?.name,
                        characterName,
                        hasMapping: !!characterImageMap[characterName || ''],
                      });
                      
                      // Only use mapped images, no fallback to wrong character
                      if (characterName && characterImageMap[characterName]) {
                        return `/images/Character /Equipment /${characterImageMap[characterName]}`;
                      }
                      
                      // Return empty string if no match found
                      return '';
                    })()}
                    alt={selectedCharacter?.name || 'Character'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('❌ Equipment image failed to load:', e.currentTarget.src);
                      // Hide the image element instead of showing wrong character
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                
                {/* Character Info */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                    <div className="text-3xl">{selectedCharacter?.avatar || '⚔️'}</div>
                    <div>
                      <div>{selectedCharacter?.name || 'Loading...'}</div>
                      <div className="text-sm text-gray-400">Level {selectedCharacter?.level || 1} {selectedCharacter?.archetype || 'warrior'}</div>
                    </div>
                  </h2>
                </div>
              </div>
            </div>

            {/* Equipment Advisor Chat */}
            <EquipmentAdvisorChat 
              selectedCharacterId={globalSelectedCharacterId}
              onCharacterChange={setGlobalSelectedCharacterId}
              selectedCharacter={selectedCharacter}
              availableCharacters={availableCharacters}
            />
            
            <EquipmentManager
            characterName={selectedCharacter.name}
            characterLevel={selectedCharacter.level}
            characterArchetype={selectedCharacter.archetype}
            equippedItems={characterEquipment[globalSelectedCharacterId] || {}}
            inventory={selectedCharacter.inventory || []}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
          />
          
          {/* Training Equipment Synergy Display */}
          <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-4 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-semibold">Training-Enhanced Equipment Effectiveness for {selectedCharacter?.name || 'Character'}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-red-300 font-semibold">⚔️ Weapon Mastery</div>
                <div className="text-gray-400">Training Bonus: +{selectedCharacter?.trainingBonuses?.strength || 0}</div>
                <div className="text-red-200">Enhanced weapon damage scaling</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-blue-300 font-semibold">🛡️ Armor Proficiency</div>
                <div className="text-gray-400">Training Bonus: +{selectedCharacter?.trainingBonuses?.defense || 0}</div>
                <div className="text-blue-200">Improved defense effectiveness</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-green-300 font-semibold">💨 Agility Training</div>
                <div className="text-gray-400">Training Bonus: +{selectedCharacter?.trainingBonuses?.speed || 0}</div>
                <div className="text-green-200">Faster attack speed with all weapons</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-200">
              💡 {selectedCharacter?.name || 'Character'}'s equipment stats are enhanced by training bonuses
            </div>
          </div>
          </div>
        </div>
    </div>
    );
  };

  const AbilityManagerWrapper = () => {
    const [characterAbilities, setCharacterAbilities] = useState<Record<string, any>>({});
    const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(true);
    
    // Load real characters from API
    useEffect(() => {
      const loadCharacters = async () => {
        try {
          const response = await characterAPI.getUserCharacters();
          const characters = response.characters || [];
          
          const enhancedCharacters = characters.map((char: any) => {
            const baseName = char.name?.toLowerCase() || char.character_id || char.id;
            return {
              ...char,
              baseName,
              name: char.name,
              level: char.level || 1,
              archetype: char.archetype || 'warrior',
              avatar: char.avatar || '⚔️',
              base_attack: char.base_attack,
              base_health: char.base_health,
              base_defense: char.base_defense,
              base_speed: char.base_speed,
              base_special: char.base_special,
              current_health: char.current_health,
              max_health: char.max_health,
              experience: char.experience,
              bond_level: char.bond_level,
              inventory: char.inventory || [],
              equipment: char.equipment || {},
              abilities: char.abilities || [],
              trainingBonuses: {
                strength: Math.floor((char.level || 1) / 3),
                defense: Math.floor((char.level || 1) / 4),
                speed: Math.floor((char.level || 1) / 3.5),
                special: Math.floor((char.level || 1) / 2.5)
              }
            };
          });
          
          setAvailableCharacters(enhancedCharacters);
          setCharactersLoading(false);
        } catch (error) {
          console.error('Error loading characters:', error);
          setCharactersLoading(false);
        }
      };
      
      loadCharacters();
    }, []);

    const selectedCharacter = useMemo(() => {
      return availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
    }, [availableCharacters, globalSelectedCharacterId]);
    const currentTrainingPoints = characterAbilities[globalSelectedCharacterId]?.trainingPoints || (selectedCharacter?.level * 2);
    console.log('Skills - Real character data:', selectedCharacter?.name, 'Abilities count:', selectedCharacter?.abilities?.length, 'Level:', selectedCharacter?.level);
    
    if (charactersLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading real character data...</p>
          </div>
        </div>
      );
    }

    return (
    <div className="space-y-6">
      <div className="flex gap-6">
          {/* Character Sidebar */}
          <div className="w-80 bg-gray-800/80 rounded-xl p-4 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Characters
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    console.log('Abilities - Clicking character:', character.name, character.baseName);
                    setGlobalSelectedCharacterId(character.baseName);
                  }}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    globalSelectedCharacterId === character.baseName
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{character.avatar}</div>
                    <div>
                      <div className="font-semibold">{character.name}</div>
                      <div className="text-xs opacity-75">Lv.{character.level} {character.archetype}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Character Image Display */}
            <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl p-8 text-center mb-8">
              <div className="flex flex-col items-center gap-6">
                {/* Character Image */}
                <div className="w-72 h-72 rounded-xl overflow-hidden border-4 border-gray-600 shadow-2xl">
                  <img 
                    src={(() => {
                      // Map character names to their skills image file names
                      const characterImageMap: Record<string, string> = {
                        'achilles': 'achillies_skills.png',
                        'agent x': 'agent_x_skills.png',
                        'billy the kid': 'billy_the_kid_skills.png',
                        'cleopatra': 'cleopatra_skills.png',
                        'cyborg': 'agent_x_skills.png', // Using Agent X as placeholder
                        'dracula': 'dracula_skills.png',
                        'count dracula': 'dracula_skills.png',
                        'fenrir': 'fenrir_skills.png',
                        'frankenstein': 'frankenstein\'s_monster_skills.png',
                        'frankenstein\'s monster': 'frankenstein\'s_monster_skills.png',
                        'frankensteins monster': 'frankenstein\'s_monster_skills.png',
                        'genghis khan': 'genghis_khan_skills.png',
                        'gengas khan': 'genghis_khan_skills.png',
                        'joan of arc': 'joan_of_arc_skills.png',
                        'joan of ark': 'joan_of_arc_skills.png',
                        'merlin': 'merlin_skills.png',
                        'robin hood': 'robin_hood_skills.png',
                        'robin_hood': 'robin_hood_skills.png',
                        'sherlock holmes': 'sherlock_holmes_skills.png',
                        'sun wukong': 'sun_wukong_skills.png',
                        'tesla': 'tesla_skills.png',
                        'nikola tesla': 'tesla_skills.png',
                        'zeta': 'zeta_skills.png',
                        'zeta reticulan': 'zeta_skills.png',
                        'sammy "slugger" sullivan': 'sammy_slugger_skills.png',
                        'sammy_slugger': 'sammy_slugger_skills.png',
                        'cleopatra vii': 'cleopatra_skills.png',
                        'vega-x': 'vega_x_skills.png',
                      };
                      
                      const characterName = selectedCharacter?.name?.toLowerCase()?.trim();
                      console.log('⚡ Skills Image Debug:', {
                        originalName: selectedCharacter?.name,
                        characterName,
                        hasMapping: !!characterImageMap[characterName || ''],
                      });
                      
                      // Only use mapped images, no fallback to wrong character
                      if (characterName && characterImageMap[characterName]) {
                        return `/images/Character /Skills:Abilities/${characterImageMap[characterName]}`;
                      }
                      
                      // Return empty string if no match found
                      return '';
                    })()}
                    alt={selectedCharacter?.name || 'Character'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('❌ Skills image failed to load:', e.currentTarget.src);
                      // Hide the image element instead of showing wrong character
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                
                {/* Character Info */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                    <div className="text-3xl">{selectedCharacter?.avatar || '⚔️'}</div>
                    <div>
                      <div>{selectedCharacter?.name || 'Loading...'}</div>
                      <div className="text-sm text-gray-400">Level {selectedCharacter?.level || 1} {selectedCharacter?.archetype || 'warrior'}</div>
                    </div>
                  </h2>
                </div>
              </div>
            </div>

            {/* Skill Development Chat */}
            <SkillDevelopmentChat
              selectedCharacterId={globalSelectedCharacterId}
              onCharacterChange={setGlobalSelectedCharacterId}
              selectedCharacter={selectedCharacter}
              availableCharacters={availableCharacters}
            />
            
            <AbilityManager
              characterId={selectedCharacter.id}
              characterName={selectedCharacter.name}
              characterLevel={selectedCharacter.level}
              characterStats={{
                atk: selectedCharacter.combatStats?.attack || 100,
                def: selectedCharacter.combatStats?.defense || 80,
                spd: selectedCharacter.combatStats?.speed || 90,
                energy: selectedCharacter.energy || 50,
                maxEnergy: selectedCharacter.maxEnergy || 100,
                hp: selectedCharacter.combatStats?.health || 200,
                maxHp: selectedCharacter.combatStats?.maxHealth || 200
              }}
              abilityProgress={[]}
              cooldowns={{}}
              onUseAbility={(ability) => console.log(`${selectedCharacter.name} used ability: ${ability.name}`)}
              onUpgradeAbility={(abilityId) => console.log(`${selectedCharacter.name} upgraded ability: ${abilityId}`)}
              context="overview"
            />

            {/* Integrated Skill Tree */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300 font-semibold">Skill Tree Progression for {selectedCharacter.name}</span>
              </div>
              <SkillTree
                characterId={selectedCharacter.id}
                characterName={selectedCharacter.name}
                characterLevel={selectedCharacter.level}
                characterArchetype={selectedCharacter.archetype}
                learnedSkills={selectedCharacter.learnedSkills || []}
                trainingPoints={selectedCharacter.trainingPoints || (selectedCharacter.level * 2)}
                onLearnSkill={(skillId) => console.log(`${selectedCharacter.name} learned skill: ${skillId}`)}
              />
            </div>

            {/* Training Points Display */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-purple-300 font-semibold">Training Points for {selectedCharacter.name}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-400">{currentTrainingPoints}</div>
                <div className="text-gray-400">Available for ability upgrades</div>
              </div>
            </div>
          </div>
        </div>
    </div>
    );
  };

  const OneOnOneCoachingWrapper = () => {
    const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(true);
    
    // Load real characters from API
    useEffect(() => {
      const loadCharacters = async () => {
        try {
          const response = await characterAPI.getUserCharacters();
          const characters = response.characters || [];
          
          const enhancedCharacters = characters.map((char: any) => {
            const baseName = char.name?.toLowerCase() || char.character_id || char.id;
            return {
              ...char,
              baseName,
              name: char.name,
              level: char.level || 1,
              archetype: char.archetype || 'warrior',
              avatar: char.avatar || '⚔️',
              base_attack: char.base_attack,
              base_health: char.base_health,
              base_defense: char.base_defense,
              base_speed: char.base_speed,
              base_special: char.base_special,
              current_health: char.current_health,
              max_health: char.max_health,
              experience: char.experience,
              bond_level: char.bond_level,
              inventory: char.inventory || [],
              equipment: char.equipment || {},
              abilities: char.abilities || []
            };
          });
          
          setAvailableCharacters(enhancedCharacters);
          setCharactersLoading(false);
        } catch (error) {
          console.error('Error loading characters:', error);
          setCharactersLoading(false);
        }
      };
      
      loadCharacters();
    }, []);

    const selectedCharacter = useMemo(() => {
      return availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
    }, [availableCharacters, globalSelectedCharacterId]);
    
    if (charactersLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading real character data...</p>
          </div>
        </div>
      );
    }

    return (
    <div className="space-y-6">
      <div className="flex gap-6">
          {/* Character Sidebar */}
          <div className="w-80 bg-gray-800/80 rounded-xl p-4 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Characters
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    console.log('1-on-1 - Clicking character:', character.name, character.baseName);
                    setGlobalSelectedCharacterId(character.baseName);
                  }}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    globalSelectedCharacterId === character.baseName
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{character.avatar}</div>
                    <div>
                      <div className="font-semibold">{character.name}</div>
                      <div className="text-xs opacity-75">Lv.{character.level} {character.archetype}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Character Image Display */}
            <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-xl p-8 text-center mb-8">
              <div className="flex flex-col items-center gap-6">
                {/* Character Image */}
                <div className="w-72 h-72 rounded-xl overflow-hidden border-4 border-gray-600 shadow-2xl">
                  <img 
                    src={(() => {
                      // Map character names to their 1-on-1 coaching image file names
                      const characterImageMap: Record<string, string> = {
                        'achilles': 'achilles__1-on-1.png',
                        'agent x': 'agent_X_1-on-1.png',
                        'billy the kid': 'billy_the_kid_1-on1.png',
                        'cleopatra': 'cleopatra__1-on-1.png',
                        'cyborg': 'agent_X_1-on-1.png', // Using Agent X as placeholder
                        'dracula': 'dracula_1-on-1.png',
                        'count dracula': 'dracula_1-on-1.png',
                        'fenrir': 'fenrir_1-on-1.png',
                        'frankenstein': 'frankenstein_1-on-1.png',
                        'frankenstein\'s monster': 'frankenstein_1-on-1.png',
                        'frankensteins monster': 'frankenstein_1-on-1.png',
                        'genghis khan': 'genghis_kahn_1-on-1.png',
                        'gengas khan': 'genghis_kahn_1-on-1.png',
                        'joan of arc': 'joan_of_arc__1-on-1.png',
                        'joan of ark': 'joan_of_arc__1-on-1.png',
                        'merlin': 'merlin_1-on-1.png',
                        'robin hood': 'robin_hood_1-on-1.png',
                        'robin_hood': 'robin_hood_1-on-1.png',
                        'sherlock holmes': 'sherlock_holmes_1-on-1.png',
                        'sun wukong': 'sun_wukong__1-on-1.png',
                        'tesla': 'tesla_1-on-1.png',
                        'nikola tesla': 'tesla_1-on-1.png',
                        'zeta': 'zeta__1-on-1.png',
                        'zeta reticulan': 'zeta__1-on-1.png',
                        'sammy "slugger" sullivan': 'sammy_slugger_1-on-1.png',
                        'sammy_slugger': 'sammy_slugger_1-on-1.png',
                        'cleopatra vii': 'cleopatra__1-on-1.png',
                        'vega-x': 'vega_1-on-1.png',
                      };
                      
                      const characterName = selectedCharacter?.name?.toLowerCase()?.trim();
                      console.log('🤝 1-on-1 Coaching Image Debug:', {
                        originalName: selectedCharacter?.name,
                        characterName,
                        hasMapping: !!characterImageMap[characterName || ''],
                      });
                      
                      // Only use mapped images, no fallback to wrong character
                      if (characterName && characterImageMap[characterName]) {
                        return `/images/1-on-1_coaching/${characterImageMap[characterName]}`;
                      }
                      
                      // Return empty string if no match found
                      return '';
                    })()}
                    alt={selectedCharacter?.name || 'Character'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('❌ 1-on-1 coaching image failed to load:', e.currentTarget.src);
                      // Hide the image element instead of showing wrong character
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                
                {/* Character Info */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                    <div className="text-3xl">{selectedCharacter?.avatar || '⚔️'}</div>
                    <div>
                      <div>{selectedCharacter?.name || 'Loading...'}</div>
                      <div className="text-sm text-gray-400">Level {selectedCharacter?.level || 1} {selectedCharacter?.archetype || 'warrior'}</div>
                    </div>
                  </h2>
                </div>
              </div>
            </div>

            {/* Coaching Session Interface */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300 font-semibold">One-on-One Coaching Session with {selectedCharacter?.name}</span>
              </div>
              
              {/* Session Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-purple-300 font-semibold">📅 Session Status</div>
                  <div className="text-white text-lg">Ready to Start</div>
                  <div className="text-gray-400 text-sm">45 min session</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-green-300 font-semibold">🎯 Focus Area</div>
                  <div className="text-white text-lg">Performance Goals</div>
                  <div className="text-gray-400 text-sm">Combat effectiveness</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-blue-300 font-semibold">📊 Bond Level</div>
                  <div className="text-white text-lg">{selectedCharacter?.bond_level || 75}%</div>
                  <div className="text-gray-400 text-sm">Trust & rapport</div>
                </div>
              </div>

              {/* Start Session Button */}
              <div className="text-center">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  Begin Coaching Session
                </button>
                <p className="text-purple-200 text-sm mt-2">
                  Personalized guidance to unlock {selectedCharacter?.name}'s full potential
                </p>
              </div>
            </div>

            {/* Character Development Insights */}
            <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-blue-400" />
                <span className="text-blue-300 font-semibold">Development Insights for {selectedCharacter?.name}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-green-300 font-semibold text-sm">Strengths</div>
                    <div className="text-white">Combat Leadership</div>
                    <div className="text-gray-400 text-sm">Natural battle instincts</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-yellow-300 font-semibold text-sm">Growth Areas</div>
                    <div className="text-white">Team Collaboration</div>
                    <div className="text-gray-400 text-sm">Working with others</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-purple-300 font-semibold text-sm">Recent Progress</div>
                    <div className="text-white">+15% Battle Focus</div>
                    <div className="text-gray-400 text-sm">Last 7 days</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-blue-300 font-semibold text-sm">Next Goals</div>
                    <div className="text-white">Strategic Thinking</div>
                    <div className="text-gray-400 text-sm">Long-term planning</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
    );
  };

  const PersonalTrainerWrapper = () => {
    const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(true);
    
    // Load characters on component mount
    useEffect(() => {
      const loadCharacters = async () => {
        setCharactersLoading(true);
        try {
          const response = await characterAPI.getUserCharacters();
          const characters = response.characters || [];
          
          const mappedCharacters = characters.map((char: any) => {
            const baseName = char.name?.toLowerCase() || char.id?.split('_')[0] || 'unknown';
            return {
              ...char,
              baseName,
              displayBondLevel: char.bond_level || Math.floor((char.base_health || 80) / 10),
              // Map database fields to component expectations
              baseStats: {
                strength: char.base_attack || 70,
                vitality: char.base_health || 80,
                agility: char.base_speed || 70,
                intelligence: char.base_special || 70,
                wisdom: char.base_defense || 70,
                charisma: char.bond_level || 5
              },
              combatStats: {
                health: char.current_health || char.base_health || 80,
                maxHealth: char.max_health || char.base_health || 80,
                attack: char.base_attack || 70,
                defense: char.base_defense || 70,
                speed: char.base_speed || 70,
                criticalChance: 15,
                accuracy: 85
              },
              level: char.level || 1,
              experience: char.experience || 0,
              abilities: char.abilities || [],
              archetype: char.archetype || 'warrior',
              avatar: char.avatar_emoji || char.avatar || '⚔️',
              name: char.name || 'Unknown Character'
            };
          });
          
          setAvailableCharacters(mappedCharacters);
        } catch (error) {
          console.error('❌ Failed to load characters:', error);
          console.error('❌ Error details:', error.response?.data || error.message);
          setAvailableCharacters([]);
        } finally {
          setCharactersLoading(false);
        }
      };
      
      loadCharacters();
    }, []);
    
    const selectedCharacter = useMemo(() => {
      return availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
    }, [availableCharacters, globalSelectedCharacterId]);
    
    return (
      <div className="space-y-6">
        <div className="flex gap-6">
          {/* Character Sidebar */}
          <div className="w-80 bg-gray-800/80 rounded-xl p-4 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Characters
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {charactersLoading ? (
                <div className="text-center text-gray-400 py-4">Loading characters...</div>
              ) : (
                availableCharacters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => {
                      console.log('PersonalTrainer - Clicking character:', character.name, character.baseName);
                      setGlobalSelectedCharacterId(character.baseName);
                    }}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      globalSelectedCharacterId === character.baseName
                        ? 'border-green-500 bg-green-500/20 text-white'
                        : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{character.avatar}</div>
                      <div>
                        <div className="font-semibold">{character.name}</div>
                        <div className="text-xs opacity-75">Lv.{character.level} {character.archetype}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          
          {/* Personal Trainer Chat */}
          <div className="flex-1">
            {selectedCharacter && (
              <PersonalTrainerChat 
                selectedCharacterId={globalSelectedCharacterId}
                onCharacterChange={setGlobalSelectedCharacterId}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const ClubhouseWrapper = () => {
    try {
      console.log('Loading Clubhouse component...');
      return (
        <Clubhouse
          currentUserId="demo_user_001"
          currentUserName="DemoWarrior"
          currentUserAvatar="⚔️"
          currentUserLevel={25}
          currentUserGuild="DEMO"
        />
      );
    } catch (error) {
      console.error('Clubhouse component error:', error);
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Social Tab Error</h2>
          <p className="text-gray-400">The social features are temporarily unavailable.</p>
          <p className="text-sm text-gray-500 mt-2">Error: {(error as Error)?.message || 'Unknown error'}</p>
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-blue-400">Error Details</summary>
            <pre className="text-xs text-gray-300 mt-2 overflow-auto">
              {(error as Error)?.stack || JSON.stringify(error, null, 2)}
            </pre>
          </details>
        </div>
      );
    }
  };

  const MerchStoreWrapper = () => (
    <MerchStore
      currentUserId="demo_user_001"
      userCurrencies={{ gems: 1500, coins: 25000, usd: 50, premium_currency: 100 }}
      userInventory={['avatar_achilles_gold', 'title_arena_champion']}
    />
  );

  // New Coach Section Components
  
  const TeamDashboardWrapper = () => {
    const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
    const [teamStats, setTeamStats] = useState<any>({});
    const [activeConflicts, setActiveConflicts] = useState<any[]>([]);
    
    // Load team data
    useEffect(() => {
      const loadTeamData = async () => {
        try {
          const response = await characterAPI.getUserCharacters();
          const characters = response.characters || [];
          setAvailableCharacters(characters);
          
          // Calculate team stats
          const stats = {
            teamSize: characters.length,
            averageLevel: characters.reduce((sum: number, char: any) => sum + (char.level || 1), 0) / characters.length || 1,
            totalTeamPower: characters.reduce((sum: number, char: any) => sum + (char.base_attack || 0) + (char.base_health || 0), 0),
            teamChemistry: 75 // Placeholder
          };
          setTeamStats(stats);
          
        } catch (error) {
          console.error('Error loading team data:', error);
        }
      };
      
      loadTeamData();
    }, []);
    
    return (
      <div className="space-y-6">
        {/* Team Overview Stats */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Team Dashboard</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{teamStats.teamSize || 0}</div>
              <div className="text-gray-400">Team Members</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{Math.round(teamStats.averageLevel || 1)}</div>
              <div className="text-gray-400">Average Level</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{teamStats.totalTeamPower || 0}</div>
              <div className="text-gray-400">Total Power</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{teamStats.teamChemistry || 0}%</div>
              <div className="text-gray-400">Team Chemistry</div>
            </div>
          </div>
        </div>
        
        {/* Active Issues & Alerts */}
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-xl p-6 border border-red-500/30">
          <h3 className="text-xl font-bold text-white mb-4">Team Issues & Alerts</h3>
          <div className="text-gray-300">
            <p>• No critical conflicts detected</p>
            <p>• Team morale: Stable</p>
            <p>• Financial health: Good</p>
            <p>• Recommended action: Continue current training regimen</p>
          </div>
        </div>
        
        {/* Character Status Grid */}
        <div className="bg-gray-800/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Character Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCharacters.map((character) => (
              <div key={character.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">{character.avatar}</div>
                  <div>
                    <div className="font-semibold text-white">{character.name}</div>
                    <div className="text-sm text-gray-400">Level {character.level}</div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Health:</span>
                    <span className="text-green-400">{character.current_health || character.base_health}/{ character.max_health || character.base_health}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mood:</span>
                    <span className="text-blue-400">Good</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const PerformanceCoachingWrapper = () => {
    const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(true);
    
    // Load characters
    useEffect(() => {
      const loadCharacters = async () => {
        try {
          const response = await characterAPI.getUserCharacters();
          const characters = response.characters || [];
          
          const enhancedCharacters = characters.map((char: any) => {
            const baseName = char.name?.toLowerCase() || char.character_id || char.id;
            return {
              ...char,
              baseName,
              name: char.name,
              level: char.level || 1,
              archetype: char.archetype || 'warrior',
              avatar: char.avatar || '⚔️'
            };
          });
          
          setAvailableCharacters(enhancedCharacters);
          setCharactersLoading(false);
        } catch (error) {
          console.error('Error loading characters:', error);
          setCharactersLoading(false);
        }
      };
      
      loadCharacters();
    }, []);

    const selectedCharacter = useMemo(() => {
      return availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
    }, [availableCharacters, globalSelectedCharacterId]);
    
    if (charactersLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading characters...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex gap-6">
          {/* Character Sidebar */}
          <div className="w-80 bg-gray-800/80 rounded-xl p-4 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Characters
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    console.log('Performance - Clicking character:', character.name, character.baseName);
                    setGlobalSelectedCharacterId(character.baseName);
                  }}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    globalSelectedCharacterId === character.baseName
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{character.avatar}</div>
                    <div>
                      <div className="font-semibold">{character.name}</div>
                      <div className="text-xs opacity-75">Lv.{character.level} {character.archetype}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Performance Coaching Chat - Moved from Characters section */}
            <PerformanceCoachingChat 
              selectedCharacterId={globalSelectedCharacterId}
              onCharacterChange={setGlobalSelectedCharacterId}
              selectedCharacter={selectedCharacter}
              availableCharacters={availableCharacters}
            />
            
            {/* Performance Analytics */}
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-6 border border-green-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-semibold">Performance Analytics for {selectedCharacter?.name}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-green-300 font-semibold">Battle Performance</div>
                  <div className="text-2xl font-bold text-green-400">85%</div>
                  <div className="text-gray-400 text-sm">Win rate this week</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-blue-300 font-semibold">Coaching Response</div>
                  <div className="text-2xl font-bold text-blue-400">92%</div>
                  <div className="text-gray-400 text-sm">Advice compliance</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-purple-300 font-semibold">Improvement Trend</div>
                  <div className="text-2xl font-bold text-purple-400">+12%</div>
                  <div className="text-gray-400 text-sm">Since last month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FinancialAdvisoryWrapper = () => {
    const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(true);
    const [pendingDecisions, setPendingDecisions] = useState<any[]>([]);
    
    // Load characters and their financial data
    useEffect(() => {
      const loadCharacters = async () => {
        try {
          const response = await characterAPI.getUserCharacters();
          const characters = response.characters || [];
          
          const enhancedCharacters = await Promise.all(characters.map(async (char: any) => {
            const baseName = char.name?.toLowerCase() || char.character_id || char.id;
            
            // Use real financial data if character has it, otherwise generate mock data
            const wallet = char.financials?.wallet || Math.floor(Math.random() * 50000) + 10000;
            const monthlyEarnings = char.financials?.monthlyEarnings || Math.floor(Math.random() * 5000) + 2000;
            const recentDecisions = char.financials?.recentDecisions || [];
            const financialPersonality = char.financialPersonality || {
              spendingStyle: ['conservative', 'moderate', 'impulsive', 'strategic'][Math.floor(Math.random() * 4)],
              financialWisdom: 50,
              riskTolerance: 50,
              luxuryDesire: 50,
              generosity: 50,
              moneyMotivations: ['security'],
              financialTraumas: [],
              moneyBeliefs: ['Money provides security']
            };
            
            // Calculate real financial stress using the psychology service
            let calculatedStress = Math.floor(Math.random() * 30); // Fallback
            try {
              const { default: FinancialPsychologyService } = await import('@/services/financialPsychologyService');
              const psychService = FinancialPsychologyService.getInstance();
              const stressAnalysis = psychService.calculateFinancialStress(
                char.id || baseName,
                wallet,
                monthlyEarnings,
                recentDecisions,
                financialPersonality
              );
              calculatedStress = Math.round(stressAnalysis.stress);
            } catch (error) {
              console.warn('Could not calculate financial stress:', error);
            }
            
            const mockFinancialData = {
              wallet,
              monthlyEarnings,
              financialStress: calculatedStress,
              coachTrustLevel: char.financials?.coachFinancialTrust || Math.floor(Math.random() * 40) + 60,
              spendingPersonality: financialPersonality.spendingStyle,
              recentDecisions,
              financialPersonality
            };
            
            return {
              ...char,
              baseName,
              name: char.name,
              level: char.level || 1,
              archetype: char.archetype || 'warrior',
              avatar: char.avatar || '⚔️',
              financials: mockFinancialData
            };
          }));
          
          setAvailableCharacters(enhancedCharacters);
          
          // Generate some mock pending decisions
          const mockDecisions = [
            {
              id: 'decision_1',
              characterId: enhancedCharacters[0]?.id,
              characterName: enhancedCharacters[0]?.name,
              amount: 15000,
              reason: 'Battle victory bonus',
              deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
              options: [
                { id: 'investment', name: 'Index Fund Investment', risk: 'low', coachApproval: 'positive' },
                { id: 'real_estate', name: 'Real Estate Down Payment', risk: 'medium', coachApproval: 'positive' },
                { id: 'sports_car', name: 'Luxury Sports Car', risk: 'high', coachApproval: 'negative' },
                { id: 'party', name: 'Throw Epic Party', risk: 'high', coachApproval: 'negative' },
                { id: 'wildcard', name: 'Let me think of something unique...', risk: 'unknown', coachApproval: 'unknown' }
              ]
            }
          ];
          setPendingDecisions(mockDecisions);
          setCharactersLoading(false);
        } catch (error) {
          console.error('Error loading characters for financial advisory:', error);
          setCharactersLoading(false);
        }
      };
      
      loadCharacters();
    }, []);

    const selectedCharacter = useMemo(() => {
      return availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
    }, [availableCharacters, globalSelectedCharacterId]);
    
    const handleAdviceGiven = async (decisionId: string, advice: string) => {
      console.log(`Coach advised ${advice} for decision ${decisionId}`);
      
      // Find the pending decision and character
      const decision = pendingDecisions.find(d => d.id === decisionId);
      const character = availableCharacters.find(c => c.id === decision?.characterId);
      
      if (decision && character) {
        try {
          // Record advice in the event system
          const { default: GameEventBus } = await import('@/services/gameEventBus');
          const eventBus = GameEventBus.getInstance();
          
          await eventBus.publishFinancialEvent(
            'coach_financial_advice',
            character.id,
            `Coach advised ${advice} for ${decision.reason}`,
            { decisionId, advice, amount: decision.amount, type: 'advice' },
            'medium'
          );
          
          console.log(`Financial advice recorded for ${character.name}`);
        } catch (error) {
          console.error('Error recording financial advice:', error);
        }
      }
    };
    
    const handleDecisionMade = async (decisionId: string, choice: string) => {
      console.log(`Character made decision: ${choice} for ${decisionId}`);
      
      // Find the decision and character
      const decision = pendingDecisions.find(d => d.id === decisionId);
      const character = availableCharacters.find(c => c.id === decision?.characterId);
      
      if (decision && character) {
        try {
          // Use financial psychology service to simulate decision outcome
          const { default: FinancialPsychologyService } = await import('@/services/financialPsychologyService');
          const psychService = FinancialPsychologyService.getInstance();
          
          // Calculate current decision quality
          const decisionQuality = psychService.calculateDecisionQuality(
            character.financials.financialStress,
            character.financials.financialPersonality,
            character.financials.coachTrustLevel,
            character.financials.recentDecisions
          );
          
          // Create a financial decision object
          const financialDecision = {
            id: decisionId,
            characterId: character.id,
            amount: decision.amount,
            decision: choice as any,
            outcome: 'pending' as const,
            coachAdvice: 'Consider carefully', // This would come from the previous advice
            followedAdvice: choice === 'investment' || choice === 'real_estate', // Assume good options were advised
            timestamp: new Date(),
            description: decision.reason,
            financialImpact: 0,
            stressImpact: 0,
            relationshipImpact: 0
          };
          
          // Simulate the outcome
          const outcome = psychService.simulateDecisionOutcome(
            financialDecision,
            decisionQuality,
            character.financials.financialPersonality
          );
          
          // Update character financial state
          const newWallet = character.financials.wallet + outcome.financialImpact;
          const newStress = Math.max(0, Math.min(100, 
            character.financials.financialStress + outcome.stressImpact
          ));
          const newTrust = Math.max(0, Math.min(100,
            character.financials.coachTrustLevel + outcome.trustImpact
          ));
          
          // Publish outcome events
          const { default: GameEventBus } = await import('@/services/gameEventBus');
          const eventBus = GameEventBus.getInstance();
          
          await eventBus.publishFinancialEvent(
            'financial_decision_made',
            character.id,
            `${character.name} ${choice} decision: ${outcome.description}`,
            { 
              decisionId, 
              choice, 
              outcome: outcome.outcome,
              financialImpact: outcome.financialImpact,
              newWallet,
              type: 'decision_outcome'
            },
            outcome.outcome === 'negative' ? 'high' : 'medium'
          );
          
          // Update stress if significant change
          if (Math.abs(outcome.stressImpact) >= 5) {
            await psychService.updateCharacterFinancialStress(
              character.id,
              character.financials.financialStress,
              newStress,
              `${choice} decision outcome`
            );
          }
          
          // Update trust if significant change  
          if (Math.abs(outcome.trustImpact) >= 3) {
            await eventBus.publishTrustChange(
              character.id,
              character.financials.coachTrustLevel,
              newTrust,
              `${choice} decision advice outcome`
            );
          }
          
          console.log(`Decision processed: ${character.name} chose ${choice}, outcome: ${outcome.outcome}`);
          console.log(`Financial impact: $${outcome.financialImpact.toLocaleString()}, Stress: ${outcome.stressImpact >= 0 ? '+' : ''}${outcome.stressImpact}, Trust: ${outcome.trustImpact >= 0 ? '+' : ''}${outcome.trustImpact}`);
          
          // Remove decision from pending list
          setPendingDecisions(prev => prev.filter(d => d.id !== decisionId));
          
        } catch (error) {
          console.error('Error processing financial decision:', error);
        }
      }
    };
    
    if (charactersLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading financial data...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex gap-6">
          {/* Character Financial Status Sidebar */}
          <div className="w-80 bg-gray-800/80 rounded-xl p-4 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Financial Status
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    console.log('Financial - Clicking character:', character.name, character.baseName);
                    setGlobalSelectedCharacterId(character.baseName);
                  }}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    globalSelectedCharacterId === character.baseName
                      ? 'border-green-500 bg-green-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">{character.avatar}</div>
                    <div>
                      <div className="font-semibold">{character.name}</div>
                      <div className="text-xs opacity-75">Lv.{character.level} {character.archetype}</div>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Wallet:</span>
                      <span className="text-green-400">${character.financials?.wallet?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stress:</span>
                      <span className={`${character.financials?.financialStress > 50 ? 'text-red-400' : 'text-blue-400'}`}>
                        {character.financials?.financialStress || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trust:</span>
                      <span className="text-purple-400">{character.financials?.coachTrustLevel || 0}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Financial Advisory Content */}
          <div className="flex-1 space-y-6">
            {/* Financial Advisory Header */}
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-6 border border-green-500/30">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-6 h-6 text-green-400" />
                <h2 className="text-2xl font-bold text-white">Financial Advisory Center</h2>
              </div>
              <p className="text-green-100">
                Guide your team members through important financial decisions. Build trust through good advice, 
                but be careful - poor guidance can damage relationships and lead to financial stress spirals.
              </p>
            </div>

            {/* Financial Stress Analysis */}
            {selectedCharacter && (
              <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl p-6 border border-red-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-bold text-white">Psychological State Analysis</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-red-300 font-semibold">Financial Stress Level</div>
                    <div className={`text-2xl font-bold ${
                      selectedCharacter.financials?.financialStress > 70 ? 'text-red-500' :
                      selectedCharacter.financials?.financialStress > 40 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {selectedCharacter.financials?.financialStress || 0}%
                    </div>
                    <div className="text-gray-400 text-sm">
                      {selectedCharacter.financials?.financialStress > 70 ? 'Critical - Poor decisions likely' :
                       selectedCharacter.financials?.financialStress > 40 ? 'Elevated - Monitor closely' : 'Healthy - Good decision capacity'}
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-blue-300 font-semibold">Decision Quality</div>
                    <div className={`text-2xl font-bold ${
                      selectedCharacter.financials?.financialStress > 70 ? 'text-red-500' :
                      selectedCharacter.financials?.financialStress > 40 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {selectedCharacter.financials?.financialStress > 70 ? 'Poor' :
                       selectedCharacter.financials?.financialStress > 40 ? 'Fair' : 'Good'}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Based on stress and personality
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-purple-300 font-semibold">Spending Style</div>
                    <div className="text-2xl font-bold text-purple-400 capitalize">
                      {selectedCharacter.financials?.spendingPersonality || 'Unknown'}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Core financial personality
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-300">
                  💡 <strong>Psychology Tip:</strong> High financial stress leads to impulsive decisions. 
                  {selectedCharacter.financials?.financialStress > 50 && 
                    ' Consider stress-reduction activities before major financial choices.'
                  }
                </div>
              </div>
            )}
            
            {/* Pending Financial Decisions */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Pending Financial Decisions
              </h3>
              
              {pendingDecisions.length > 0 ? (
                <div className="space-y-4">
                  {pendingDecisions.map((decision) => (
                    <div key={decision.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{availableCharacters.find(c => c.id === decision.characterId)?.avatar || '⚔️'}</div>
                          <div>
                            <div className="font-semibold text-white">{decision.characterName}</div>
                            <div className="text-sm text-gray-400">{decision.reason}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">${decision.amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-400">Needs decision in 3 days</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                        {decision.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleAdviceGiven(decision.id, option.id)}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                              option.coachApproval === 'positive' 
                                ? 'border-green-500 bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                : option.coachApproval === 'negative'
                                ? 'border-red-500 bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                : 'border-purple-500 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                            }`}
                          >
                            <div className="font-semibold">{option.name}</div>
                            <div className="text-xs opacity-75">Risk: {option.risk}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>No pending financial decisions</p>
                  <p className="text-sm mt-2">Characters will come to you when they need financial guidance</p>
                </div>
              )}
            </div>
            
            {/* Financial Influence Progress */}
            {selectedCharacter && (
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-300 font-semibold">Financial Influence with {selectedCharacter.name}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-purple-300 font-semibold">Coach Trust Level</div>
                    <div className="text-2xl font-bold text-purple-400">{selectedCharacter.financials?.coachTrustLevel || 0}%</div>
                    <div className="text-gray-400 text-sm">Financial advice compliance</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-green-300 font-semibold">Financial Health</div>
                    <div className="text-2xl font-bold text-green-400">Good</div>
                    <div className="text-gray-400 text-sm">${selectedCharacter.financials?.wallet?.toLocaleString() || '0'} saved</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-blue-300 font-semibold">Spending Style</div>
                    <div className="text-2xl font-bold text-blue-400 capitalize">{selectedCharacter.financials?.spendingPersonality || 'Unknown'}</div>
                    <div className="text-gray-400 text-sm">Decision pattern</div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-purple-200">
                  💡 Build trust through therapy sessions and good advice to increase financial influence
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Psychology Battle Component Wrappers - Removed legacy component

  const GameplanTrackerWrapper = () => {
    // Create demo characters for the tracker
    const demoCharacters = [demoCharacter].map(char => ({
      character: char,
      currentHealth: char.combatStats.maxHealth,
      currentMana: char.combatStats.maxMana,
      gameplanAdherenceLevel: 75, // Still using this field internally but conceptually it's adherence
      mentalState: {
        currentMentalHealth: 80,
        stress: 25,
        confidence: 70,
        teamTrust: 85,
        battleFocus: 90,
        gameplanDeviationRisk: 15
      },
      relationshipModifiers: [],
      battlePerformance: {
        damageDealt: 0,
        damageTaken: 0,
        abilitiesUsed: 0,
        deviantActions: 0
      }
    }));

    return (
      <GameplanTracker 
        characters={demoCharacters}
        isActive={true}
        onGameplanAlert={(event) => console.log('Gameplan Alert:', event)}
      />
    );
  };

  const TeamBuilderWrapper = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-6 backdrop-blur-sm border border-green-500/20">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Team Builder</h2>
          </div>
          <p className="text-green-100 mb-4">
            Build your ultimate squad with strategic team formations, character synergies, and balanced compositions.
            Create teams that maximize both combat effectiveness and psychological stability.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
            <div className="bg-green-900/40 rounded-lg p-3">
              <div className="text-green-300 font-semibold">⚔️ Strategic Formations</div>
              <div className="text-green-100">Choose from multiple tactical arrangements</div>
            </div>
            <div className="bg-blue-900/40 rounded-lg p-3">
              <div className="text-blue-300 font-semibold">🔗 Character Synergies</div>
              <div className="text-blue-100">Unlock powerful team bonuses</div>
            </div>
            <div className="bg-purple-900/40 rounded-lg p-3">
              <div className="text-purple-300 font-semibold">📊 Team Analytics</div>
              <div className="text-purple-100">Optimize chemistry and balance</div>
            </div>
          </div>
          
          {/* Temporary placeholder while fixing data integration */}
          <div className="bg-yellow-900/30 rounded-lg p-6 border border-yellow-500/30">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-semibold text-yellow-300">Team Builder - Under Development</h3>
            </div>
            <p className="text-yellow-100 mb-4">
              The team builder is being updated to work with your current character roster. 
              In the meantime, you can build teams directly in the Battle Arena.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">📝 Available Features</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• View character synergies</li>
                  <li>• Formation recommendations</li>
                  <li>• Team power calculations</li>
                </ul>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🚧 Coming Soon</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Save custom teams</li>
                  <li>• Quick team deployment</li>
                  <li>• Advanced team analytics</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // New Training Progress component for distinguishing from progression dashboard
  const TrainingProgressComponent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-6 h-6" />
          Training Progress
        </h2>
        
        {/* Daily Training Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">Activities Remaining</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">7/10</div>
            <div className="text-sm text-gray-400">Resets in 14h 32m</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold">Training Points</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">23</div>
            <div className="text-sm text-gray-400">Earned today: +8</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-purple-400" />
              <span className="text-white font-semibold">Membership</span>
            </div>
            <div className="text-xl font-bold text-purple-400">Pro Tier</div>
            <div className="text-sm text-gray-400">+50% XP bonus</div>
          </div>
        </div>

        {/* Character Training Progress */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Character Training Status</h3>
          
          {['Achilles', 'Merlin', 'Loki'].map((name, index) => (
            <div key={name} className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {name === 'Achilles' ? '⚔️' : name === 'Merlin' ? '🔮' : '🎭'}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{name}</div>
                    <div className="text-sm text-gray-400">Level {18 - index}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-semibold">{3 - index} sessions today</div>
                  <div className="text-sm text-gray-400">+{120 + index * 30} XP gained</div>
                </div>
              </div>
              
              {/* Training progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all" 
                  style={{ width: `${70 + index * 10}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Training Efficiency: {70 + index * 10}%</span>
                <span>Fatigue: {20 - index * 5}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );


  const FacilitiesManagerWrapper = () => {
    // Demo facilities state
    const [demoFacilities, setDemoFacilities] = useState([
      { id: 'gym', level: 2, purchaseDate: new Date(), maintenancePaid: true, bonusesActive: true },
      { id: 'medical_bay', level: 1, purchaseDate: new Date(), maintenancePaid: false, bonusesActive: false }
    ]);
    
    const demoCurrency = { coins: 50000, gems: 100 };
    const demoTeamLevel = 12;
    const demoAchievements = ['team_harmony', 'inner_peace', 'tech_pioneer'];
    
    const handlePurchaseFacility = (facilityId: string) => {
      console.log('Purchasing facility:', facilityId);
      setDemoFacilities(prev => [...prev, {
        id: facilityId,
        level: 1,
        purchaseDate: new Date(),
        maintenancePaid: true,
        bonusesActive: true
      }]);
    };
    
    const handleUpgradeFacility = (facilityId: string) => {
      console.log('Upgrading facility:', facilityId);
      setDemoFacilities(prev => prev.map(f => 
        f.id === facilityId ? { ...f, level: f.level + 1 } : f
      ));
    };
    
    const handlePayMaintenance = (facilityId: string) => {
      console.log('Paying maintenance for facility:', facilityId);
      setDemoFacilities(prev => prev.map(f => 
        f.id === facilityId ? { ...f, maintenancePaid: true, bonusesActive: true } : f
      ));
    };
    
    return (
      <FacilitiesManager
        teamLevel={demoTeamLevel}
        currency={demoCurrency}
        unlockedAchievements={demoAchievements}
        ownedFacilities={demoFacilities}
        onPurchaseFacility={handlePurchaseFacility}
        onUpgradeFacility={handleUpgradeFacility}
        onPayMaintenance={handlePayMaintenance}
      />
    );
  };

  const TrainingGroundsWrapper = () => {
    const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(true);
    
    // Load characters on component mount
    useEffect(() => {
      const loadCharacters = async () => {
        setCharactersLoading(true);
        try {
          console.log('🔄 Loading characters from API...');
          console.log('🔄 API URL:', '/api/user/characters');
          const response = await characterAPI.getUserCharacters();
          console.log('📊 API Response:', response);
          
          // Force use the characters if they exist elsewhere
          if (!response.characters || response.characters.length === 0) {
            console.log('❌ No characters in API response, checking for data in response root');
            console.log('📊 Response keys:', Object.keys(response || {}));
            
            // Try to extract characters from different possible locations
            const characters = response.characters || response.data?.characters || response.users || response || [];
            console.log('🔍 Extracted characters:', characters.length);
            
            if (characters.length === 0) {
              console.error('🚨 NO CHARACTERS FOUND - TRAINING REQUIRES REAL API CHARACTERS');
              setAvailableCharacters([]);
              setCharactersLoading(false);
              return;
            }
          }
          
          const characters = response.characters || [];
          console.log('👥 Characters received:', characters.length);
          if (characters.length === 0) {
            console.log('❌ No characters found in response:', response);
          }
          
          const mappedCharacters = characters.map((char: any) => {
            const baseName = char.name?.toLowerCase() || char.id?.split('_')[0];
            return {
              ...char,
              baseName,
              displayBondLevel: char.bond_level,
              baseStats: {
                strength: char.base_attack,
                vitality: char.base_health,
                agility: char.base_speed,
                intelligence: char.base_special,
                wisdom: char.base_defense,
                charisma: char.bond_level
              },
              combatStats: {
                health: char.current_health,
                maxHealth: char.max_health,
                attack: char.base_attack,
                defense: char.base_defense,
                speed: char.base_speed,
                criticalChance: char.critical_chance,
                accuracy: char.accuracy
              },
              level: char.level,
              experience: char.experience,
              abilities: char.abilities,
              archetype: char.archetype,
              avatar: char.avatar_emoji,
              name: char.name,
              trainingBonuses: {
                strength: Math.floor(char.level / 3),
                defense: Math.floor(char.level / 4),
                speed: Math.floor(char.level / 3.5),
                special: Math.floor(char.level / 2.5)
              }
            };
          });
          
          setAvailableCharacters(mappedCharacters);
        } catch (error) {
          console.error('❌ Failed to load characters:', error);
          console.error('❌ Error details:', error.response?.data || error.message);
          setAvailableCharacters([]);
        } finally {
          setCharactersLoading(false);
        }
      };
      
      loadCharacters();
    }, []);
    
    const selectedCharacter = useMemo(() => {
      return availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
    }, [availableCharacters, globalSelectedCharacterId]);
    
    return (
      <div className="space-y-6">
        <div className="flex gap-6">
          {/* Character Sidebar */}
          <div className="w-80 bg-gray-800/80 rounded-xl p-4 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Characters
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {charactersLoading ? (
                <div className="text-center text-gray-400 py-4">Loading characters...</div>
              ) : availableCharacters.length === 0 ? (
                <div className="text-center text-red-400 py-4">
                  <p>❌ No characters loaded from API</p>
                  <p className="text-sm mt-2">Check authentication and backend connection</p>
                </div>
              ) : (
                availableCharacters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => {
                      console.log('Training - Clicking character:', character.name, character.baseName);
                      setGlobalSelectedCharacterId(character.baseName);
                    }}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      globalSelectedCharacterId === character.baseName
                        ? 'border-green-500 bg-green-500/20 text-white'
                        : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{character.avatar}</div>
                      <div>
                        <div className="font-semibold">{character.name}</div>
                        <div className="text-xs opacity-75">Lv.{character.level} {character.archetype}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          
          {/* Training Interface */}
          <div className="flex-1">
            {console.log('🎯 Training render check:', !!selectedCharacter, selectedCharacter?.name)}
            {selectedCharacter ? (
              <TrainingGrounds 
                globalSelectedCharacterId={globalSelectedCharacterId}
                setGlobalSelectedCharacterId={setGlobalSelectedCharacterId}
                selectedCharacter={selectedCharacter}
                availableCharacters={availableCharacters}
              />
            ) : (
              <div className="text-center text-gray-400 py-8">
                No character selected or available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const mainTabs: MainTab[] = [
    {
      id: 'characters',
      label: 'Characters',
      icon: Users,
      color: 'blue',
      subTabs: [
        { id: 'progression', label: 'Progression', icon: TrendingUp, component: ProgressionDashboardWrapper, description: 'Level up, stats, and experience tracking' },
        { id: 'equipment', label: 'Equipment', icon: Crown, component: EquipmentManagerWrapper, description: 'Weapons & armor with equipment advisor chat' },
        { id: 'abilities', label: 'Skills/Abilities', icon: Sparkles, component: AbilityManagerWrapper, description: 'Skills, abilities, skill trees, & skill development chat' },
      ]
    },
    {
      id: 'headquarters',
      label: 'HQ',
      icon: Home,
      color: 'amber',
      subTabs: [
        { id: 'overview', label: 'Team Base', icon: Home, component: TeamHeadquarters, description: 'Manage your team living space and facilities' },
      ]
    },
    {
      id: 'training',
      label: 'Training',
      icon: Dumbbell,
      color: 'green',
      subTabs: [
        { id: 'activities', label: 'Activities', icon: Target, component: TrainingGroundsWrapper, description: 'Daily training sessions' },
        { id: 'progress', label: 'Progress', icon: Trophy, component: TrainingProgressComponent, description: 'Training limits & daily progress' },
        { id: 'membership', label: 'Membership', icon: Crown, component: MembershipSelection, description: 'Training tier subscriptions' },
        { id: 'trainer', label: 'Personal Trainer', icon: Brain, component: PersonalTrainerWrapper, description: 'Training recommendations & guidance' },
      ]
    },
    {
      id: 'battle',
      label: 'Battle',
      icon: Sword,
      color: 'red',
      subTabs: [
        { id: 'team-arena', label: 'Team Battle Arena', icon: Sword, component: ImprovedBattleArena, description: 'The main 3v3 combat arena, where psychology and team chemistry impact physical battles.' },
        { id: 'gameplan', label: 'Strategy Tracker', icon: Activity, component: GameplanTrackerWrapper, description: 'Monitor team adherence to strategy' },
        { id: 'teams', label: 'Teams', icon: Users, component: TeamBuilderWrapper, description: 'Build your squads' },
        { id: 'packs', label: 'Packs', icon: Package, component: PackOpening, description: 'Get new characters' },
      ]
    },
    {
      id: 'social',
      label: 'Social',
      icon: Home,
      color: 'purple',
      subTabs: [
        { id: 'clubhouse', label: 'Clubhouse', icon: Home, component: ClubhouseWrapper, description: 'Community features' },
      ]
    },
    {
      id: 'store',
      label: 'Store',
      icon: ShoppingBag,
      color: 'yellow',
      subTabs: [
        { id: 'merch', label: 'Merch Store', icon: ShoppingBag, component: MerchStoreWrapper, description: 'Purchase items' },
      ]
    },
    {
      id: 'coach',
      label: 'Coach',
      icon: User,
      color: 'purple',
      subTabs: [
        { id: 'profile', label: 'Profile', icon: User, component: CoachProgressionPage, description: 'View your coach profile and progression' },
        { id: 'team-dashboard', label: 'Team Dashboard', icon: BarChart3, component: TeamDashboardWrapper, description: 'Overview of team stats, conflicts, and alerts' },
        { id: 'performance-coaching', label: 'Performance Coaching', icon: Target, component: PerformanceCoachingWrapper, description: 'Battle performance guidance and strategy advice' },
        { id: 'therapy', label: 'Therapy', icon: Brain, component: TherapyModule, description: 'Individual and group therapy sessions with legendary therapists' },
        { id: 'individual-sessions', label: 'Individual Sessions', icon: MessageCircle, component: IndividualSessionsWrapper, description: 'One-on-one coaching with team members' },
        { id: 'one-on-one-coaching', label: '1-on-1 Coaching', icon: User, component: OneOnOneCoachingWrapper, description: 'Personalized coaching sessions with character-specific imagery' },
        { id: 'financial-advisory', label: 'Financial Advisory', icon: DollarSign, component: FinancialAdvisoryWrapper, description: 'Guide your team\'s financial decisions and build trust through money management' },
        { id: 'group-events', label: 'Group Events & Activities', icon: Users, component: CombinedGroupActivitiesWrapper, description: 'Team building, group activities & live multi-participant chat' },
      ]
    }
  ];


  const currentMainTab = mainTabs.find(tab => tab.id === activeMainTab);
  const currentSubTab = currentMainTab?.subTabs.find(tab => tab.id === activeSubTab);
  const ActiveComponent = currentSubTab?.component;
  
  console.log('🔍 Tab Debug:', { 
    activeMainTab, 
    activeSubTab, 
    currentMainTab: currentMainTab?.id,
    currentSubTab: currentSubTab?.id,
    hasComponent: !!currentSubTab?.component,
    availableSubTabs: currentMainTab?.subTabs.map(s => s.id)
  });

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'bg-blue-600 text-white' : 'text-blue-400 hover:bg-blue-600/20',
      green: isActive ? 'bg-green-600 text-white' : 'text-green-400 hover:bg-green-600/20',
      red: isActive ? 'bg-red-600 text-white' : 'text-red-400 hover:bg-red-600/20',
      purple: isActive ? 'bg-purple-600 text-white' : 'text-purple-400 hover:bg-purple-600/20',
      yellow: isActive ? 'bg-yellow-600 text-white' : 'text-yellow-400 hover:bg-yellow-600/20',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Main Tab Navigation */}
      <div className="border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4 ml-32">
              <div className="flex gap-2">
                {mainTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeMainTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveMainTab(tab.id);
                        setActiveSubTab(tab.subTabs[0].id);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${getColorClasses(tab.color, isActive)}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      {currentMainTab && (
        <div className="border-b border-gray-700 bg-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto">
              {currentMainTab.subTabs.map((subTab) => {
                const Icon = subTab.icon;
                const isActive = activeSubTab === subTab.id;
                
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveSubTab(subTab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{subTab.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Sub-tab description */}
            {currentSubTab?.description && (
              <div className="mt-2 text-sm text-gray-400">
                {currentSubTab.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Component */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {ActiveComponent ? (
          <Suspense fallback={<ComponentLoader name={currentSubTab?.label || 'Component'} />}>
            <ActiveComponent />
          </Suspense>
        ) : (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-orange-400">Component Not Found</h2>
            <p className="text-gray-400">The component for "{currentSubTab?.label}" is not available.</p>
            <p className="text-sm text-gray-500 mt-2">Tab: {activeMainTab} / {activeSubTab}</p>
          </div>
        )}
      </div>
    </div>
  );
}