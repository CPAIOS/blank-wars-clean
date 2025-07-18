'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Star, 
  Crown, 
  Search,
  Grid3X3,
  List,
  Plus,
  Heart,
  Award,
  TrendingUp,
  Calendar,
  X,
  Package
} from 'lucide-react';
import { 
  OwnedCharacter, 
  CharacterRarity,
  characterRarityConfig,
  subscriptionTiers,
  SubscriptionTier,
  getCollectionStats
} from '@/data/userAccount';

interface CharacterCollectionProps {
  characters: OwnedCharacter[];
  subscriptionTier: SubscriptionTier;
  maxSlots: number;
  onSelectCharacter?: (character: OwnedCharacter) => void;
  onUpgradeSubscription?: () => void;
  onOpenPack?: () => void;
  onManageCharacter?: (character: OwnedCharacter) => void;
  activeCharacterId?: string;
}

type SortOption = 'recent' | 'level' | 'rarity' | 'alphabetical' | 'archetype' | 'favorite';
type ViewMode = 'grid' | 'list';

export default function CharacterCollection({
  characters,
  subscriptionTier,
  maxSlots,
  onSelectCharacter,
  onUpgradeSubscription,
  onOpenPack,
  onManageCharacter,
  activeCharacterId
}: CharacterCollectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRarity, setFilterRarity] = useState<CharacterRarity | 'all'>('all');
  const [filterArchetype, setFilterArchetype] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCharacter, setSelectedCharacter] = useState<OwnedCharacter | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Get collection statistics
  const collectionStats = getCollectionStats(characters);
  const availableSlots = maxSlots - characters.length;

  // Get unique archetypes for filtering
  const archetypes = Array.from(new Set(characters.map(c => c.archetype)));

  // Filter and sort characters
  const filteredCharacters = characters
    .filter(char => {
      const nameMatch = char.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (char.nickname && char.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
      const rarityMatch = filterRarity === 'all' || char.rarity === filterRarity;
      const archetypeMatch = filterArchetype === 'all' || char.archetype === filterArchetype;
      const favoriteMatch = !showFavoritesOnly || char.isFavorite;
      
      return nameMatch && rarityMatch && archetypeMatch && favoriteMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        case 'level':
          return b.level - a.level;
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
          return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        case 'alphabetical':
          return a.characterName.localeCompare(b.characterName);
        case 'archetype':
          return a.archetype.localeCompare(b.archetype);
        case 'favorite':
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return 0;
        default:
          return 0;
      }
    });

  const getRarityIcon = (rarity: CharacterRarity) => {
    return characterRarityConfig[rarity].icon;
  };


  const getArchetypeIcon = (archetype: string) => {
    const icons = {
      warrior: '⚔️',
      mage: '🔮',
      trickster: '🎭',
      leader: '👑',
      scholar: '📚',
      beast: '🐺'
    };
    return icons[archetype.toLowerCase() as keyof typeof icons] || '⭐';
  };

  const formatLastUsed = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Users className="w-8 h-8 text-blue-400" />
          Character Collection
        </h1>
        <p className="text-gray-400 text-lg">
          Manage your legendary roster of warriors and champions
        </p>
      </div>

      {/* Collection Overview */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Character Slots */}
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {characters.length}/{maxSlots}
            </div>
            <div className="text-gray-400 text-sm">Character Slots</div>
            <div className={`text-xs mt-1 ${subscriptionTiers[subscriptionTier].color}`}>
              {subscriptionTiers[subscriptionTier].displayName}
            </div>
          </div>

          {/* Collection Stats */}
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-1">
              {collectionStats.averageLevel.toFixed(1)}
            </div>
            <div className="text-gray-400 text-sm">Average Level</div>
            <div className="text-xs text-green-400 mt-1">
              Total: {collectionStats.totalLevels}
            </div>
          </div>

          {/* Rarity Breakdown */}
          <div className="text-center">
            <div className="flex justify-center gap-1 mb-2">
              {Object.entries(collectionStats.byRarity).map(([rarity, count]) => (
                count > 0 && (
                  <span key={rarity} className="text-sm">
                    {getRarityIcon(rarity as CharacterRarity)}{count}
                  </span>
                )
              ))}
            </div>
            <div className="text-gray-400 text-sm">By Rarity</div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {availableSlots > 0 && onOpenPack && (
              <button
                onClick={onOpenPack}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />
                Open Pack
              </button>
            )}
            {availableSlots === 0 && onUpgradeSubscription && (
              <button
                onClick={onUpgradeSubscription}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search characters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Rarity Filter */}
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value as CharacterRarity | 'all')}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Rarities</option>
            {Object.entries(characterRarityConfig).map(([rarity, config]) => (
              <option key={rarity} value={rarity}>
                {config.icon} {config.name}
              </option>
            ))}
          </select>

          {/* Archetype Filter */}
          <select
            value={filterArchetype}
            onChange={(e) => setFilterArchetype(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {archetypes.map(archetype => (
              <option key={archetype} value={archetype}>
                {getArchetypeIcon(archetype)} {archetype.charAt(0).toUpperCase() + archetype.slice(1)}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="recent">Recently Used</option>
            <option value="level">Highest Level</option>
            <option value="rarity">Rarity</option>
            <option value="alphabetical">A-Z</option>
            <option value="archetype">Type</option>
            <option value="favorite">Favorites</option>
          </select>

          {/* View Options */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`p-2 rounded-lg transition-colors ${
                showFavoritesOnly 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Character Grid/List */}
      <div className={`grid gap-4 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {filteredCharacters.map((character) => {
          const rarityConfig = characterRarityConfig[character.rarity];
          const isActive = character.characterId === activeCharacterId;

          return (
            <motion.div
              key={character.characterId}
              className={`border rounded-xl p-4 cursor-pointer transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/50'
                  : `border-gray-600 bg-gradient-to-r ${rarityConfig.color}/5 hover:border-blue-500 hover:${rarityConfig.glowEffect}`
              }`}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelectCharacter?.(character)}
            >
              {viewMode === 'grid' ? (
                // Grid View
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{getArchetypeIcon(character.archetype)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${rarityConfig.textColor}`}>
                            {character.nickname || character.characterName}
                          </span>
                          <span className="text-sm">{rarityConfig.icon}</span>
                          {character.isFavorite && <Heart className="w-4 h-4 text-red-400 fill-current" />}
                        </div>
                        <div className="text-sm text-gray-400 capitalize">
                          {character.archetype}
                        </div>
                      </div>
                    </div>
                    
                    {character.isStarter && (
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                        STARTER
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400">Level {character.level}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">{character.wins}W/{character.losses}L</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-400">{formatLastUsed(character.lastUsed)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-400">{character.abilitiesUnlocked.length} Abilities</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>XP Progress</span>
                      <span>{character.xp}/{character.level * 100}</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${rarityConfig.color} transition-all`}
                        style={{ width: `${(character.xp / (character.level * 100)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onManageCharacter?.(character);
                      }}
                      className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Manage
                    </button>
                  </div>
                </>
              ) : (
                // List View
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{getArchetypeIcon(character.archetype)}</span>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-lg font-bold ${rarityConfig.textColor}`}>
                        {character.nickname || character.characterName}
                      </span>
                      <span>{rarityConfig.icon}</span>
                      {character.isFavorite && <Heart className="w-4 h-4 text-red-400 fill-current" />}
                      {character.isStarter && (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                          STARTER
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 capitalize mb-2">
                      {character.archetype} • Level {character.level} • {formatLastUsed(character.lastUsed)}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400">{character.wins}W/{character.losses}L</span>
                      <span className="text-blue-400">{character.abilitiesUnlocked.length} Abilities</span>
                      <span className="text-purple-400">{character.skillsLearned.length} Skills</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onManageCharacter?.(character);
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Empty Slots */}
        {viewMode === 'grid' && Array.from({ length: Math.min(availableSlots, 4) }).map((_, index) => (
          <motion.div
            key={`empty-${index}`}
            className="border-2 border-dashed border-gray-600 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 min-h-[200px]"
            whileHover={{ scale: 1.02 }}
          >
            <Plus className="w-8 h-8 mb-2" />
            <span className="text-sm font-semibold">Empty Slot</span>
            {onOpenPack && (
              <button
                onClick={onOpenPack}
                className="mt-2 text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full hover:bg-purple-500/30 transition-colors"
              >
                Open Pack
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredCharacters.length === 0 && characters.length > 0 && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Characters Found</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}

      {/* Empty Collection */}
      {characters.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Characters Yet</h3>
          <p className="text-gray-500 mb-4">
            Start your journey by opening your first character pack!
          </p>
          {onOpenPack && (
            <button
              onClick={onOpenPack}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Open Your First Pack
            </button>
          )}
        </div>
      )}

      {/* Character Detail Modal */}
      <AnimatePresence>
        {selectedCharacter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCharacter(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">Character Details</h3>
                <button
                  onClick={() => setSelectedCharacter(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Character details would go here */}
              <div className="text-gray-300">
                <p>Detailed character information, equipment, abilities, and management options would be implemented here.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}