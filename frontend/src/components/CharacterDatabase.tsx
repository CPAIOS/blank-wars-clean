'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Search,
  Filter,
  Star,
  Shield,
  Sword,
  Zap,
  Users,
  Crown,
  Book,
  TrendingUp,
  Award,
  Eye,
  ArrowLeft,
  Lock,
  Unlock,
  Target,
  Sparkles,
  GitBranch,
  Heart
} from 'lucide-react';
import {
  Character,
  CharacterArchetype,
  CharacterRarity,
  getAllCharacters,
  calculateCharacterPower,
  getCharacterUnlockRequirements
} from '@/data/characters';
import SkillInteractionManager from './SkillInteractionManager';

interface CharacterDatabaseProps {
  userLevel?: number;
  userAchievements?: string[];
  userCurrencies?: Record<string, number>;
}

export default function CharacterDatabase({
  userLevel = 30,
  userAchievements = ['first_victory', 'beast_master', 'diplomatic_victory'],
  userCurrencies = { gems: 5000, coins: 50000 }
}: CharacterDatabaseProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState<CharacterArchetype | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<CharacterRarity | 'all'>('all');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const allCharacters = getAllCharacters();

  // Filter characters
  const filteredCharacters = allCharacters.filter(character => {
    // Search filter
    if (searchTerm && !character.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !character.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Archetype filter
    if (archetypeFilter !== 'all' && character.archetype !== archetypeFilter) {
      return false;
    }

    // Rarity filter
    if (rarityFilter !== 'all' && character.rarity !== rarityFilter) {
      return false;
    }

    // Unlock filter
    if (showOnlyUnlocked) {
      const templateId = character.id?.split('_')[0] || character.id || 'unknown';
      const requirements = getCharacterUnlockRequirements(templateId);
      const isUnlocked = checkUnlockRequirements(requirements);
      if (!isUnlocked) return false;
    }

    return true;
  });

  function checkUnlockRequirements(requirements: Record<string, unknown>): boolean {
    if (requirements.level && userLevel < (requirements.level as number)) return false;
    if (requirements.achievements && !(requirements.achievements as string[]).every((ach: string) => userAchievements.includes(ach))) return false;
    if (requirements.currency) {
      for (const [currency, amount] of Object.entries(requirements.currency)) {
        if ((userCurrencies[currency] || 0) < (amount as number)) return false;
      }
    }
    return true;
  }

  const rarityColors = {
    common: 'border-gray-500 bg-gray-500/10',
    uncommon: 'border-green-500 bg-green-500/10',
    rare: 'border-blue-500 bg-blue-500/10',
    epic: 'border-purple-500 bg-purple-500/10',
    legendary: 'border-yellow-500 bg-yellow-500/10',
    mythic: 'border-red-500 bg-red-500/10'
  };

  const archetypeIcons = {
    warrior: Sword,
    mage: Sparkles,
    assassin: Target,
    tank: Shield,
    support: Heart,
    beast: Star,
    trickster: Eye,
    mystic: Crown,
    elementalist: Zap,
    berserker: TrendingUp
  };

  if (selectedCharacter) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedCharacter(null)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Character Database
        </button>

        <CharacterDetailView character={selectedCharacter} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Database className="w-8 h-8 text-blue-400" />
          Character Database
        </h1>
        <p className="text-gray-400 text-lg">
          Explore _____ warriors, mages, and beings from _____ times and _____ universes
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search characters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Archetype Filter */}
          <select
            value={archetypeFilter}
            onChange={(e) => setArchetypeFilter(e.target.value as CharacterArchetype | 'all')}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Archetypes</option>
            <option value="warrior">Warrior</option>
            <option value="mage">Mage</option>
            <option value="trickster">Trickster</option>
            <option value="beast">Beast</option>
            <option value="mystic">Mystic</option>
            <option value="assassin">Assassin</option>
          </select>

          {/* Rarity Filter */}
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value as CharacterRarity | 'all')}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Rarities</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
            <option value="mythic">Mythic</option>
          </select>

          {/* Options */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-white text-sm">
              <input
                type="checkbox"
                checked={showOnlyUnlocked}
                onChange={(e) => setShowOnlyUnlocked(e.target.checked)}
                className="rounded"
              />
              Unlocked Only
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-gray-400">
            Showing {filteredCharacters.length} of {allCharacters.length} characters
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Character Grid */}
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
        <AnimatePresence>
          {filteredCharacters.map((character) => {
            const requirements = getCharacterUnlockRequirements(character.id.split('_')[0]);
            const isUnlocked = checkUnlockRequirements(requirements);
            const ArchetypeIcon = archetypeIcons[character.archetype] || Star;

            return (
              <motion.div
                key={character.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${rarityColors[character.rarity]} border-2 rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden ${
                  !isUnlocked ? 'opacity-60' : ''
                }`}
                onClick={() => setSelectedCharacter(character)}
              >
                {/* Unlock Status */}
                <div className="absolute top-2 right-2">
                  {isUnlocked ? (
                    <Unlock className="w-4 h-4 text-green-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-red-400" />
                  )}
                </div>

                {/* Character Avatar */}
                <div className="text-center mb-3">
                  <div className="text-4xl mb-2">{character.avatar}</div>
                  <h3 className="text-lg font-bold text-white">{character.name}</h3>
                  {character.title && (
                    <p className="text-sm text-gray-400">{character.title}</p>
                  )}
                </div>

                {/* Character Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArchetypeIcon className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-300 capitalize">{character.archetype}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${rarityColors[character.rarity].replace('bg-', 'bg-').replace('/10', '/30')}`}>
                      {character.rarity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Power:</span>
                    <span className="text-sm font-bold text-yellow-400">{calculateCharacterPower(character)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Level:</span>
                    <span className="text-sm font-bold text-blue-400">{character.level}</span>
                  </div>

                  {/* Unlock Requirements */}
                  {!isUnlocked && (
                    <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded text-xs">
                      <div className="text-red-400 font-semibold">Unlock Requirements:</div>
                      {requirements.level && userLevel < requirements.level && (
                        <div>• Level {requirements.level} (Currently {userLevel})</div>
                      )}
                      {requirements.achievements && requirements.achievements.some((ach: string) => !userAchievements.includes(ach)) && (
                        <div>• Achievements: {requirements.achievements.filter((ach: string) => !userAchievements.includes(ach)).join(', ')}</div>
                      )}
                      {requirements.currency && Object.entries(requirements.currency).some(([currency, amount]) => (userCurrencies[currency] || 0) < amount) && (
                        <div>• Currency needed</div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredCharacters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">No Characters Found</h3>
          <p className="text-gray-400">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}

// Character Detail View Component
function CharacterDetailView({ character }: { character: Character }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'abilities' | 'interactions' | 'progression'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'stats', label: 'Stats', icon: TrendingUp },
    { id: 'abilities', label: 'Abilities', icon: Zap },
    { id: 'interactions', label: 'Skill Interactions', icon: GitBranch },
    { id: 'progression', label: 'Progression', icon: Award }
  ];

  return (
    <div className="space-y-6">
      {/* Character Header */}
      <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-xl border border-gray-700 p-6">
        <div className="flex items-start gap-6">
          <div className="text-8xl">{character.avatar}</div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-1">{character.name}</h1>
            {character.title && (
              <p className="text-lg text-yellow-400 mb-2">{character.title}</p>
            )}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-blue-400 capitalize">{character.archetype}</span>
              <span className="text-purple-400 capitalize">{character.rarity}</span>
              <span className="text-gray-300">{character.historicalPeriod}</span>
            </div>
            <p className="text-gray-300 leading-relaxed">{character.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">{calculateCharacterPower(character)}</div>
            <div className="text-sm text-gray-400">Power Level</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'stats' | 'abilities' | 'interactions' | 'progression')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        {activeTab === 'overview' && <OverviewTab character={character} />}
        {activeTab === 'stats' && <StatsTab character={character} />}
        {activeTab === 'abilities' && <AbilitiesTab character={character} />}
        {activeTab === 'interactions' && <InteractionsTab character={character} />}
        {activeTab === 'progression' && <ProgressionTab character={character} />}
      </div>
    </div>
  );
}

function OverviewTab({ character }: { character: Character }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-3">Personality</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-400">Traits:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {character.personality.traits.map((trait) => (
                  <span key={trait} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Speech Style:</span>
              <span className="text-white ml-2">{character.personality.speechStyle}</span>
            </div>
            <div>
              <span className="text-gray-400">Motivations:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {character.personality.motivations.map((motivation) => (
                  <span key={motivation} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                    {motivation}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-white mb-3">Battle AI</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Aggression:</span>
              <span className="text-red-400">{character.battleAI.aggression}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Defensiveness:</span>
              <span className="text-blue-400">{character.battleAI.defensiveness}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Risk Taking:</span>
              <span className="text-yellow-400">{character.battleAI.riskTaking}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Adaptability:</span>
              <span className="text-purple-400">{character.battleAI.adaptability}%</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-3">Battle Quotes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {character.customization.battleQuotes.map((quote) => (
            <div key={quote} className="p-3 bg-gray-800/50 rounded-lg border border-gray-600">
              <p className="text-gray-300 italic">&quot;{quote}&quot;</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsTab({ character }: { character: Character }) {
  const statColors = {
    strength: 'text-red-400',
    agility: 'text-green-400',
    intelligence: 'text-blue-400',
    vitality: 'text-yellow-400',
    wisdom: 'text-purple-400',
    charisma: 'text-pink-400'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Base Stats</h3>
        <div className="space-y-3">
          {Object.entries(character.baseStats).map(([stat, value]) => (
            <div key={stat} className="flex items-center justify-between">
              <span className={`capitalize ${statColors[stat as keyof typeof statColors]}`}>
                {stat}:
              </span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-gray-700 rounded-full">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-gray-600 ${statColors[stat as keyof typeof statColors].replace('text-', 'to-')}`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                  />
                </div>
                <span className="text-white font-bold w-8 text-right">{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-4">Combat Stats</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Health:</span>
            <span className="text-red-400">{character.combatStats.maxHealth}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Mana:</span>
            <span className="text-blue-400">{character.combatStats.maxMana}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Attack:</span>
            <span className="text-orange-400">{character.combatStats.attack}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Defense:</span>
            <span className="text-green-400">{character.combatStats.defense}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Magic Attack:</span>
            <span className="text-purple-400">{character.combatStats.magicAttack}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Magic Defense:</span>
            <span className="text-cyan-400">{character.combatStats.magicDefense}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Speed:</span>
            <span className="text-yellow-400">{character.combatStats.speed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Crit Chance:</span>
            <span className="text-pink-400">{character.combatStats.criticalChance}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbilitiesTab({ character }: { character: Character }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Progression Tree Branches</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {character.progressionTree.branches.map((branch) => (
            <div key={branch.name} className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <h4 className="text-lg font-semibold text-white mb-2">{branch.name}</h4>
              <p className="text-gray-300 text-sm mb-3">{branch.description}</p>
              <div className="text-xs text-gray-400">
                {branch.nodes.length} abilities available
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-4">Available Abilities</h3>
        <div className="text-gray-400 text-center py-8">
          <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Abilities will be unlocked through progression and training</p>
        </div>
      </div>
    </div>
  );
}

function ProgressionTab({ character }: { character: Character }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Character Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{character.level}</div>
            <div className="text-gray-400">Current Level</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{character.trainingLevel}%</div>
            <div className="text-gray-400">Training Progress</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{character.bondLevel}%</div>
            <div className="text-gray-400">Bond Level</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-4">Unlocked Content</h3>
        <div className="flex flex-wrap gap-2">
          {character.unlockedContent.map((content) => (
            <span key={content} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              {content.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-4">Achievements</h3>
        {character.achievements.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {character.achievements.map((achievement) => (
              <span key={achievement} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                {achievement}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No achievements yet</p>
        )}
      </div>
    </div>
  );
}

function InteractionsTab({ character }: { character: Character }) {
  // Convert character data to the format expected by SkillInteractionManager
  const skillInteractionCharacter = {
    id: character.id,
    name: character.name,
    avatar: character.avatar,
    archetype: character.archetype as string,
    coreSkills: {},
    signatureSkills: {}
  };

  return (
    <SkillInteractionManager
      character={skillInteractionCharacter}
      onInteractionActivate={(interaction, bonuses) => {
        console.log(`${character.name} activated ${interaction.name}`, bonuses);
      }}
    />
  );
}
