'use client';

import { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Dumbbell, Sword, Home, ShoppingBag,
  Database, TrendingUp, Package, MessageCircle, 
  Sparkles, Crown, Building, Target, Brain,
  Trophy, ChevronDown, ChevronRight, Activity, Shield,
  BookOpen, Star, User, Eye, EyeOff
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
import FacilitiesManager from './FacilitiesManager';
import SkillTree from './SkillTree';
import AICoach from './AICoach';
import CharacterDatabase from './CharacterDatabase';
// CoachingInterface is lazy-loaded below
import TeamManagementCoaching from './TeamManagementCoaching';
import { createDemoCharacterCollection } from '@/data/characters';

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
import { OwnedCharacter, TeamComposition } from '@/data/userAccount';

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

export default function MainTabSystem() {
  const [activeMainTab, setActiveMainTab] = useState('characters');
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
    trainingLevel: 75,
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
    const [showPerformanceChat, setShowPerformanceChat] = useState(false);
    
    // Get the real 17 characters from the game
    const availableCharacters = createDemoCharacterCollection().map(char => {
      // Extract base name from the random ID
      const baseName = char.id.split('_')[0];
      return {
        ...char,
        baseName,
        trainingBonuses: {
          strength: Math.floor(char.level / 3),
          defense: Math.floor(char.level / 4),
          speed: Math.floor(char.level / 3.5),
          special: Math.floor(char.level / 2.5)
        }
      };
    });
    
    const selectedCharacter = availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
    console.log('Progression - globalSelectedCharacterId:', globalSelectedCharacterId, 'selectedCharacter:', selectedCharacter?.name);
    
    return (
    <div className="space-y-6">
      {/* Toggle between Progression Dashboard and Performance Chat */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPerformanceChat(false)}
          className={`px-4 py-2 rounded-lg transition-all ${
            !showPerformanceChat 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Progression Dashboard
        </button>
        <button
          onClick={() => setShowPerformanceChat(true)}
          className={`px-4 py-2 rounded-lg transition-all ${
            showPerformanceChat 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Performance Coaching Chat
        </button>
      </div>

      {showPerformanceChat ? (
        <PerformanceCoachingChat 
          selectedCharacterId={globalSelectedCharacterId}
          onCharacterChange={setGlobalSelectedCharacterId}
        />
      ) : (
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
          <div className="flex-1 space-y-6">
            {/* Selected Character Header */}
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="text-3xl">{selectedCharacter.avatar}</div>
                <div>
                  <div>{selectedCharacter.name}</div>
                  <div className="text-sm text-gray-400">Level {selectedCharacter.level} {selectedCharacter.archetype}</div>
                </div>
              </h2>
            </div>

            {/* Training Enhancement Banner */}
            <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-xl p-4 border border-orange-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300 font-semibold">Training Enhanced Stats for {selectedCharacter.name}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-red-400 font-bold">+{selectedCharacter.trainingBonuses.strength}</div>
                  <div className="text-gray-400">Strength</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-400 font-bold">+{selectedCharacter.trainingBonuses.defense}</div>
                  <div className="text-gray-400">Defense</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-bold">+{selectedCharacter.trainingBonuses.speed}</div>
                  <div className="text-gray-400">Speed</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-bold">+{selectedCharacter.trainingBonuses.special}</div>
                  <div className="text-gray-400">Special</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-orange-200">
                Training Points Available: {selectedCharacter.trainingPoints || (selectedCharacter.level * 2)} • Training Level: {selectedCharacter.trainingLevel || 75}%
              </div>
            </div>
            
            <ProgressionDashboard
              character={selectedCharacter}
              onAllocateSkillPoint={(skill) => console.log(`${selectedCharacter.name} allocated skill point to ${skill}`)}
              onAllocateStatPoint={(stat) => console.log(`${selectedCharacter.name} allocated stat point to ${stat}`)}
              onViewDetails={(section) => console.log(`${selectedCharacter.name} viewing details for ${section}`)}
            />
          </div>
        </div>
      )}
    </div>
    );
  };

  const EquipmentManagerWrapper = () => {
    const [characterEquipment, setCharacterEquipment] = useState<Record<string, any>>({});
    const [showEquipmentChat, setShowEquipmentChat] = useState(false);
    
    // Get the real 17 characters from the game
    const availableCharacters = createDemoCharacterCollection().map(char => {
      // Extract base name from the random ID (e.g., "achilles" from "achilles_1751593197366_8ivu34rgc")
      const baseName = char.id.split('_')[0];
      return {
        ...char,
        baseName,
        trainingBonuses: {
          strength: Math.floor(char.level / 3),
          defense: Math.floor(char.level / 4),
          speed: Math.floor(char.level / 3.5),
          special: Math.floor(char.level / 2.5)
        }
      };
    });
    
    const selectedCharacter = availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
    console.log('Equipment - globalSelectedCharacterId:', globalSelectedCharacterId, 'selectedCharacter:', selectedCharacter?.name);
    
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
      {/* Toggle between Equipment Manager and Equipment Chat */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowEquipmentChat(false)}
          className={`px-4 py-2 rounded-lg transition-all ${
            !showEquipmentChat 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Equipment Manager
        </button>
        <button
          onClick={() => setShowEquipmentChat(true)}
          className={`px-4 py-2 rounded-lg transition-all ${
            showEquipmentChat 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Equipment Advisor Chat
        </button>
      </div>

      {showEquipmentChat ? (
        <EquipmentAdvisorChat 
          selectedCharacterId={globalSelectedCharacterId}
          onCharacterChange={setGlobalSelectedCharacterId}
        />
      ) : (
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
          <div className="flex-1 space-y-6">
            {/* Selected Character Header */}
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="text-3xl">{selectedCharacter.avatar}</div>
                <div>
                  <div>{selectedCharacter.name}</div>
                  <div className="text-sm text-gray-400">Level {selectedCharacter.level} {selectedCharacter.archetype}</div>
                </div>
              </h2>
            </div>

            {/* Training Equipment Synergy Display */}
            <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-4 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-semibold">Training-Enhanced Equipment Effectiveness for {selectedCharacter.name}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-red-300 font-semibold">⚔️ Weapon Mastery</div>
                <div className="text-gray-400">Training Bonus: +{selectedCharacter.trainingBonuses.strength}</div>
                <div className="text-red-200">Enhanced weapon damage scaling</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-blue-300 font-semibold">🛡️ Armor Proficiency</div>
                <div className="text-gray-400">Training Bonus: +{selectedCharacter.trainingBonuses.defense}</div>
                <div className="text-blue-200">Improved defense effectiveness</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-green-300 font-semibold">💨 Agility Training</div>
                <div className="text-gray-400">Training Bonus: +{selectedCharacter.trainingBonuses.speed}</div>
                <div className="text-green-200">Faster attack speed with all weapons</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-200">
              💡 {selectedCharacter.name}'s equipment stats are enhanced by training bonuses
            </div>
          </div>
          
          <EquipmentManager
            characterName={selectedCharacter.name}
            characterLevel={selectedCharacter.level}
            characterArchetype={selectedCharacter.archetype}
            equippedItems={characterEquipment[globalSelectedCharacterId] || {}}
            inventory={selectedCharacter.inventory || []}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
          />
          </div>
        </div>
      )}
    </div>
    );
  };

  const AbilityManagerWrapper = () => {
    const [characterAbilities, setCharacterAbilities] = useState<Record<string, any>>({});
    const [showSkillDevelopmentChat, setShowSkillDevelopmentChat] = useState(false);
    
    // Get the real 17 characters from the game
    const availableCharacters = createDemoCharacterCollection().map(char => {
      // Extract base name from the random ID
      const baseName = char.id.split('_')[0];
      return {
        ...char,
        baseName,
        trainingBonuses: {
          strength: Math.floor(char.level / 3),
          defense: Math.floor(char.level / 4),
          speed: Math.floor(char.level / 3.5),
          special: Math.floor(char.level / 2.5)
        }
      };
    });
    
    const selectedCharacter = availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
    const currentTrainingPoints = characterAbilities[globalSelectedCharacterId]?.trainingPoints || (selectedCharacter.level * 2);
    
    return (
    <div className="space-y-6">
      {/* Toggle between Abilities/Skills and Skill Development Chat */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowSkillDevelopmentChat(false)}
          className={`px-4 py-2 rounded-lg transition-all ${
            !showSkillDevelopmentChat 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Skills & Abilities
        </button>
        <button
          onClick={() => setShowSkillDevelopmentChat(true)}
          className={`px-4 py-2 rounded-lg transition-all ${
            showSkillDevelopmentChat 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Skill Development Chat
        </button>
      </div>

      {showSkillDevelopmentChat ? (
        <SkillDevelopmentChat 
          selectedCharacterId={globalSelectedCharacterId}
          onCharacterChange={setGlobalSelectedCharacterId}
        />
      ) : (
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
          <div className="flex-1 space-y-6">
            {/* Selected Character Header */}
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="text-3xl">{selectedCharacter.avatar}</div>
                <div>
                  <div>{selectedCharacter.name}</div>
                  <div className="text-sm text-gray-400">Level {selectedCharacter.level} {selectedCharacter.archetype}</div>
                </div>
              </h2>
            </div>

            {/* Training Points & Skill Learning */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300 font-semibold">Training-Unlocked Abilities for {selectedCharacter.name}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-semibold">Training Points</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{currentTrainingPoints}</div>
                  <div className="text-gray-400">Available for ability upgrades</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-white font-semibold">Special Bonus</span>
                  </div>
                  <div className="text-lg font-bold text-green-400">+{selectedCharacter.trainingBonuses.special}</div>
                  <div className="text-gray-400">Enhanced ability effectiveness</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="bg-green-900/30 rounded p-2 text-green-200">
                  ✨ Combat Training Unlocked: Enhanced weapon abilities
                </div>
                <div className="bg-blue-900/30 rounded p-2 text-blue-200">
                  🎯 Precision Training: +15% critical chance on abilities
                </div>
                <div className="bg-purple-900/30 rounded p-2 text-purple-200">
                  🔥 Advanced Techniques: Signature abilities available
                </div>
              </div>
            </div>
            
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
                characterLevel={selectedCharacter.level}
                characterArchetype={selectedCharacter.archetype}
                availablePoints={selectedCharacter.trainingPoints || (selectedCharacter.level * 2)}
                onSkillUnlock={(skillId) => console.log(`${selectedCharacter.name} unlocked skill: ${skillId}`)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    );
  };

  const PersonalTrainerWrapper = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-6 border border-green-500/30">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-green-400" />
          <span className="text-green-300 font-semibold text-xl">Personal Trainer</span>
        </div>
        <p className="text-green-100 mb-4">
          Your dedicated AI trainer provides personalized recommendations based on your characters' progress and training goals.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-green-900/40 rounded-lg p-3">
            <div className="text-green-300 font-semibold">🎯 Training Recommendations</div>
            <div className="text-green-100">Optimized training plans for each character</div>
          </div>
          <div className="bg-blue-900/40 rounded-lg p-3">
            <div className="text-blue-300 font-semibold">📊 Progress Analysis</div>
            <div className="text-blue-100">Track efficiency and suggest improvements</div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Today's Training Recommendations</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
            <div className="text-2xl">⚔️</div>
            <div>
              <div className="text-white font-semibold">Achilles - Strength Focus</div>
              <div className="text-gray-400 text-sm">Recommended: Elite Combat Training (60% efficiency boost)</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
            <div className="text-2xl">🔮</div>
            <div>
              <div className="text-white font-semibold">Character Recovery</div>
              <div className="text-gray-400 text-sm">2 characters need energy recovery before next session</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
            <div className="text-2xl">⭐</div>
            <div>
              <div className="text-white font-semibold">Skill Unlock Available</div>
              <div className="text-gray-400 text-sm">You have 12 training points ready to spend</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
    const [savedTeams, setSavedTeams] = useState<TeamComposition[]>([]);
    
    // Create demo characters from the character collection
    const demoCharacters = createDemoCharacterCollection();
    
    // Convert characters to OwnedCharacter format
    const ownedCharacters: OwnedCharacter[] = demoCharacters.map(char => ({
      characterId: char.id,
      characterData: char,
      level: char.level || 1,
      experience: char.experience || 0,
      bondLevel: char.bondLevel || 50,
      trainingLevel: char.trainingLevel || 60,
      equipment: char.equipment || {},
      unlockedAbilities: char.abilities || [],
      dateAcquired: new Date(),
      battlesPlayed: 0,
      wins: 0,
      losses: 0
    }));

    const handleSaveTeam = (team: TeamComposition) => {
      console.log('Saving team:', team);
      setSavedTeams(prev => [...prev, { ...team, id: Date.now().toString() }]);
    };

    const handleStartBattle = (team: TeamComposition) => {
      console.log('Starting battle with team:', team);
      // This could integrate with the battle system
    };

    const handleDeleteTeam = (teamId: string) => {
      console.log('Deleting team:', teamId);
      setSavedTeams(prev => prev.filter(team => team.id !== teamId));
    };

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
        </div>
        <TeamBuilder
          characters={ownedCharacters}
          savedTeams={savedTeams}
          onSaveTeam={handleSaveTeam}
          onStartBattle={handleStartBattle}
          onDeleteTeam={handleDeleteTeam}
        />
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

  const TeamBuildingWrapper = () => {
    const sampleTeamMembers = [
      { id: 'char1', name: 'Achilles', avatar: '🛡️', mood: 'Motivated' },
      { id: 'char2', name: 'Joan of Arc', avatar: '⚔️', mood: 'Focused' },
      { id: 'char3', name: 'Tesla', avatar: '⚡', mood: 'Curious' }
    ];

    return (
      <TeamBuildingActivities
        teamBudget={1500}
        teamMembers={sampleTeamMembers}
        onActivityComplete={(result) => {
          console.log('Activity completed:', result);
          // In real implementation, update team stats here
        }}
      />
    );
  };

  const IndividualSessionsWrapper = () => {
    const demoCharacters = createDemoCharacterCollection();
    const baseCharacter = demoCharacters[0];
    
    // Create a BattleCharacter wrapper for the CoachingInterface
    const battleCharacter = {
      character: baseCharacter,
      currentHealth: baseCharacter.hp,
      currentMana: 100,
      physicalDamageDealt: 0,
      physicalDamageTaken: 0,
      statusEffects: [],
      mentalState: {
        stress: 25,
        confidence: 75,
        teamTrust: 80,
        strategicFocus: 'balanced'
      },
      gameplanAdherence: 85,
      teamRole: 'damage',
      performanceRating: 'good',
      keyMoments: []
    };
    
    return (
      <CoachingInterface
        character={battleCharacter}
        isTimeoutActive={false}
        timeRemaining={0}
        onCoachingAction={(action) => console.log('Coaching action:', action)}
        onCloseCoaching={() => console.log('Coaching session closed')}
      />
    );
  };

  const GroupActivitiesWrapper = () => {
    const sampleTeamMembers = [
      { id: 'char1', name: 'Achilles', avatar: '🛡️', mood: 'Motivated' },
      { id: 'char2', name: 'Joan of Arc', avatar: '⚔️', mood: 'Focused' },
      { id: 'char3', name: 'Tesla', avatar: '⚡', mood: 'Curious' }
    ];

    return (
      <TeamBuildingActivities
        teamBudget={1500}
        teamMembers={sampleTeamMembers}
        onActivityComplete={(result) => {
          console.log('Group activity completed:', result);
          // In real implementation, update team stats here
        }}
      />
    );
  };

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

  const mainTabs: MainTab[] = [
    {
      id: 'characters',
      label: 'Characters',
      icon: Users,
      color: 'blue',
      subTabs: [
        { id: 'progression', label: 'Progression', icon: TrendingUp, component: ProgressionDashboardWrapper, description: 'Level up, stats, & performance coaching' },
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
        { id: 'activities', label: 'Activities', icon: Target, component: TrainingGrounds, description: 'Daily training sessions' },
        { id: 'progress', label: 'Progress', icon: Trophy, component: TrainingProgressComponent, description: 'Training limits & daily progress' },
        { id: 'facilities', label: 'Facilities', icon: Building, component: FacilitiesManagerWrapper, description: 'Manage team facilities and upgrades' },
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
        { id: 'team-management', label: 'Team Management', icon: Shield, component: TeamManagementCoaching, description: 'Handle team conflicts, strategy reviews, and leadership decisions' },
        { id: 'individual-sessions', label: 'Individual Sessions', icon: MessageCircle, component: IndividualSessionsWrapper, description: 'One-on-one coaching with team members' },
        { id: 'team-building', label: 'Team Building', icon: Users, component: TeamBuildingWrapper, description: 'Organize dinners, retreats, and activities' },
        { id: 'group-activities', label: 'Group Activities', icon: Activity, component: GroupActivitiesWrapper, description: 'Game nights and group therapy sessions' },
      ]
    }
  ];

  const currentMainTab = mainTabs.find(tab => tab.id === activeMainTab);
  const currentSubTab = currentMainTab?.subTabs.find(tab => tab.id === activeSubTab);
  const ActiveComponent = currentSubTab?.component || CharacterDatabase;

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
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMainTabExpanded(!isMainTabExpanded)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isMainTabExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
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
      <AnimatePresence>
        {isMainTabExpanded && currentMainTab && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-700 bg-gray-800/50"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Component */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={<ComponentLoader name={currentSubTab?.label || 'Component'} />}>
          <ActiveComponent />
        </Suspense>
      </div>
    </div>
  );
}