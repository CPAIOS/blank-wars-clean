'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Star, 
  Heart,
  Search,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react';
import { 
  OwnedCharacter,
  characterRarityConfig
} from '@/data/userAccount';
import { formatCharacterName } from '@/utils/characterUtils';

interface CharacterSelectorProps {
  characters: OwnedCharacter[];
  maxSelections?: number;
  selectedCharacters?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onConfirm?: (selectedCharacters: OwnedCharacter[]) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  mode?: 'single' | 'multiple';
  showStats?: boolean;
  filterByArchetype?: string[];
  minimumLevel?: number;
}

export default function CharacterSelector({
  characters,
  maxSelections = 3,
  selectedCharacters = [],
  onSelectionChange,
  onConfirm,
  onCancel,
  title = 'Select Characters',
  subtitle = 'Choose your warriors for battle',
  mode = 'multiple',
  showStats = true,
  filterByArchetype,
  minimumLevel = 1
}: CharacterSelectorProps) {
  const [selections, setSelections] = useState<string[]>(selectedCharacters);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArchetype, setFilterArchetype] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'level' | 'recent' | 'rarity' | 'favorite'>('level');
  const [currentPage, setCurrentPage] = useState(0);
  
  const charactersPerPage = 6;

  // Filter and sort characters
  const filteredCharacters = characters
    .filter(char => {
      const nameMatch = char.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (char.nickname && char.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
      const archetypeMatch = filterArchetype === 'all' || char.archetype === filterArchetype;
      const levelMatch = char.level >= minimumLevel;
      const allowedArchetype = !filterByArchetype || filterByArchetype.includes(char.archetype);
      
      return nameMatch && archetypeMatch && levelMatch && allowedArchetype;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'level':
          return b.level - a.level;
        case 'recent':
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
          return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        case 'favorite':
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return b.level - a.level;
        default:
          return 0;
      }
    });

  // Paginate characters
  const totalPages = Math.ceil(filteredCharacters.length / charactersPerPage);
  const currentCharacters = filteredCharacters.slice(
    currentPage * charactersPerPage,
    (currentPage + 1) * charactersPerPage
  );

  // Handle selection
  const toggleSelection = (characterId: string) => {
    let newSelections: string[];
    
    if (mode === 'single') {
      newSelections = selections.includes(characterId) ? [] : [characterId];
    } else {
      if (selections.includes(characterId)) {
        newSelections = selections.filter(id => id !== characterId);
      } else if (selections.length < maxSelections) {
        newSelections = [...selections, characterId];
      } else {
        return; // Maximum selections reached
      }
    }
    
    setSelections(newSelections);
    onSelectionChange?.(newSelections);
  };

  // Get selected character objects
  const getSelectedCharacters = (): OwnedCharacter[] => {
    return selections.map(id => characters.find(c => c.characterId === id)!).filter(Boolean);
  };

  // Handle confirm
  const handleConfirm = () => {
    const selectedChars = getSelectedCharacters();
    onConfirm?.(selectedChars);
  };

  // Get archetype icon
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

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    return characterRarityConfig[rarity as keyof typeof characterRarityConfig]?.color || 'from-gray-500 to-gray-600';
  };

  // Calculate team stats
  const selectedStats = getSelectedCharacters().reduce(
    (acc, char) => ({
      totalLevel: acc.totalLevel + char.level,
      totalWins: acc.totalWins + char.wins,
      totalLosses: acc.totalLosses + char.losses,
      archetypes: [...acc.archetypes, char.archetype]
    }),
    { totalLevel: 0, totalWins: 0, totalLosses: 0, archetypes: [] as string[] }
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Users className="w-8 h-8 text-blue-400" />
          {title}
        </h1>
        <p className="text-gray-400">{subtitle}</p>
        
        {mode === 'multiple' && (
          <div className="mt-2 flex items-center justify-center gap-4">
            <span className="text-white">
              Selected: <span className="text-blue-400 font-bold">{selections.length}</span>/{maxSelections}
            </span>
            {selections.length > 0 && showStats && (
              <span className="text-gray-400">
                Avg Level: <span className="text-yellow-400 font-bold">
                  {Math.round(selectedStats.totalLevel / selections.length)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search characters..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Don't reset page to prevent jarring scroll
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Archetype Filter */}
          <select
            value={filterArchetype}
            onChange={(e) => {
              setFilterArchetype(e.target.value);
              // Don't reset page to prevent jarring scroll
            }}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Archetypes</option>
            <option value="warrior">⚔️ Warrior</option>
            <option value="mage">🔮 Mage</option>
            <option value="trickster">🎭 Trickster</option>
            <option value="leader">👑 Leader</option>
            <option value="scholar">📚 Scholar</option>
            <option value="beast">🐺 Beast</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'level' | 'recent' | 'rarity' | 'favorite')}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="level">Highest Level</option>
            <option value="recent">Recently Used</option>
            <option value="rarity">Rarity</option>
            <option value="favorite">Favorites First</option>
          </select>

          {/* Results Info */}
          <div className="flex items-center text-gray-400">
            <span>{filteredCharacters.length} characters found</span>
          </div>
        </div>
      </div>

      {/* Character Grid */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {currentCharacters.map((character) => {
            const isSelected = selections.includes(character.characterId);
            const canSelect = mode === 'single' || selections.length < maxSelections || isSelected;
            const rarityConfig = characterRarityConfig[character.rarity];

            return (
              <motion.div
                key={character.characterId}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/50'
                    : canSelect
                      ? `border-gray-600 hover:border-blue-400 bg-gradient-to-r ${rarityConfig.color}/5 hover:${rarityConfig.glowEffect}`
                      : 'border-gray-700 bg-gray-800/30 opacity-50 cursor-not-allowed'
                }`}
                whileHover={canSelect ? { scale: 1.02 } : {}}
                onClick={() => canSelect && toggleSelection(character.characterId)}
              >
                {/* Selection Indicator */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getArchetypeIcon(character.archetype)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${rarityConfig.textColor}`}>
                          {character.nickname || formatCharacterName(character.characterName)}
                        </span>
                        <span className="text-sm">{rarityConfig.icon}</span>
                        {character.isFavorite && <Heart className="w-4 h-4 text-red-400 fill-current" />}
                        {character.isStarter && (
                          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                            STARTER
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 capitalize">
                        {character.archetype}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500'
                      : canSelect
                        ? 'border-gray-400'
                        : 'border-gray-600'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>

                {/* Character Stats */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400">Level {character.level}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">{character.wins}W/{character.losses}L</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span className="text-purple-400">{character.abilitiesUnlocked.length} Abilities</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-400">{character.skillsLearned.length} Skills</span>
                  </div>
                </div>

                {/* XP Progress */}
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

                {/* Last Used */}
                <div className="text-xs text-gray-500">
                  Last used: {new Date(character.lastUsed).toLocaleDateString()}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`w-8 h-8 rounded-lg transition-colors ${
                    currentPage === index
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* No Results */}
        {filteredCharacters.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Characters Found</h3>
            <p className="text-gray-500">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </div>

      {/* Selected Characters Summary */}
      {selections.length > 0 && showStats && (
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Selected Team Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{selections.length}</div>
              <div className="text-gray-400 text-sm">Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {selections.length > 0 ? Math.round(selectedStats.totalLevel / selections.length) : 0}
              </div>
              <div className="text-gray-400 text-sm">Avg Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {selectedStats.totalWins}
              </div>
              <div className="text-gray-400 text-sm">Total Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {[...new Set(selectedStats.archetypes)].length}
              </div>
              <div className="text-gray-400 text-sm">Archetypes</div>
            </div>
          </div>

          {/* Selected Characters List */}
          <div className="flex flex-wrap gap-2 mb-4">
            {getSelectedCharacters().map((character) => (
              <div
                key={character.characterId}
                className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2"
              >
                <span className="text-lg">{getArchetypeIcon(character.archetype)}</span>
                <span className="text-white font-semibold">
                  {character.nickname || formatCharacterName(character.characterName)}
                </span>
                <span className="text-yellow-400 text-sm">L{character.level}</span>
                <button
                  onClick={() => toggleSelection(character.characterId)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
        )}
        
        <button
          onClick={handleConfirm}
          disabled={selections.length === 0 || (mode === 'multiple' && selections.length < 1)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <Check className="w-5 h-5" />
          Confirm Selection
          {mode === 'multiple' && ` (${selections.length})`}
        </button>
      </div>
    </div>
  );
}