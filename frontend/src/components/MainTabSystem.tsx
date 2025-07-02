'use client';

import { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Dumbbell, Sword, Home, ShoppingBag,
  Database, TrendingUp, Package, MessageCircle, 
  Sparkles, Crown, Building, Target, Brain,
  Trophy, ChevronDown, ChevronRight, Activity, Shield
} from 'lucide-react';

// Import stable components
import CharacterDatabase from './CharacterDatabase';
import ChatDemo from './ChatDemo'; // Use full-featured chat with stable patterns
import SimpleBattleArena from './SimpleBattleArena'; // Use stable battle arena

// Lazy load non-critical components
const TrainingGrounds = lazy(() => import('./TrainingGrounds'));
const ProgressionDashboard = lazy(() => import('./ProgressionDashboard'));
const Clubhouse = lazy(() => import('./Clubhouse'));
const MerchStore = lazy(() => import('./MerchStore'));
const PackOpening = lazy(() => import('./PackOpening'));
const EquipmentManager = lazy(() => import('./EquipmentManager'));
const AbilityManager = lazy(() => import('./AbilityManager'));
const AICoach = lazy(() => import('./AICoach'));

// Import the fixed ImprovedBattleArena with all functionality
const ImprovedBattleArena = lazy(() => import('./ImprovedBattleArena'));
const MembershipSelection = lazy(() => import('./MembershipSelection'));
const TrainingFacilitySelector = lazy(() => import('./TrainingFacilitySelector'));
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
import { createDemoCharacterCollection } from '@/data/characters';

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
  const [activeSubTab, setActiveSubTab] = useState('database');
  const [isMainTabExpanded, setIsMainTabExpanded] = useState(true);

  // Demo character data for progression dashboard
  const demoCharacter = {
    id: 'demo_achilles',
    name: 'Achilles',
    title: 'Hero of Troy',
    avatar: '⚔️',
    archetype: 'warrior' as const,
    rarity: 'legendary' as const,
    level: 18,
    baseStats: {
      strength: 85,
      agility: 72,
      intelligence: 58,
      vitality: 80,
      wisdom: 45,
      charisma: 65
    },
    combatStats: {
      health: 1200,
      maxHealth: 1200,
      mana: 300,
      maxMana: 300,
      attack: 185,
      defense: 120,
      magicAttack: 50,
      magicDefense: 80,
      speed: 140,
      criticalChance: 25,
      criticalDamage: 200,
      accuracy: 90,
      evasion: 20
    },
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
  const ProgressionDashboardWrapper = () => (
    <ProgressionDashboard
      character={demoCharacter}
      onAllocateSkillPoint={(skill) => console.log(`Allocated skill point to ${skill}`)}
      onAllocateStatPoint={(stat) => console.log(`Allocated stat point to ${stat}`)}
      onViewDetails={(section) => console.log(`Viewing details for ${section}`)}
    />
  );

  const ClubhouseWrapper = () => (
    <Clubhouse
      currentUserId="demo_user_001"
      currentUserName="DemoWarrior"
      currentUserAvatar="⚔️"
      currentUserLevel={25}
      currentUserGuild="DEMO"
    />
  );

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

  const mainTabs: MainTab[] = [
    {
      id: 'characters',
      label: 'Characters',
      icon: Users,
      color: 'blue',
      subTabs: [
        { id: 'database', label: 'Database', icon: Database, component: CharacterDatabase, description: 'Browse all characters' },
        { id: 'progression', label: 'Progression', icon: TrendingUp, component: ProgressionDashboardWrapper, description: 'Level up & skill trees' },
        { id: 'equipment', label: 'Equipment', icon: Crown, component: EquipmentManager, description: 'Weapons & armor' },
        { id: 'abilities', label: 'Abilities', icon: Sparkles, component: AbilityManager, description: 'Manage special powers' },
        { id: 'chat', label: 'Chat', icon: MessageCircle, component: ChatDemo, description: 'Character conversations' },
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
        { id: 'facilities', label: 'Facilities', icon: Building, component: TrainingFacilitySelector, description: 'Choose training locations' },
        { id: 'membership', label: 'Membership', icon: Crown, component: MembershipSelection, description: 'Training tier subscriptions' },
        { id: 'coach', label: 'AI Coach', icon: Brain, component: AICoach, description: 'Training recommendations' },
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