'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TradingCard from './TradingCard';
import { TeamCharacter } from '@/data/teamBattleSystem';
import { Search, Grid, List, Star, Users, Zap, Crown } from 'lucide-react';

interface CardCollectionProps {
  characters: TeamCharacter[];
  selectedCards?: string[];
  maxSelection?: number;
  onCardSelect?: (characterId: string) => void;
  onCardDeselect?: (characterId: string) => void;
  showSelectionMode?: boolean;
  className?: string;
}

type SortOption = 'name' | 'level' | 'rarity' | 'strength' | 'mentalHealth';
type FilterOption = 'all' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
type ViewMode = 'grid' | 'list';

const rarityOrder = {
  'common': 1,
  'rare': 2,
  'epic': 3,
  'legendary': 4,
  'mythic': 5
};

export default function CardCollection({
  characters,
  selectedCards = [],
  maxSelection = 3,
  onCardSelect,
  onCardDeselect,
  showSelectionMode = false,
  className = ''
}: CardCollectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rarity');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const filteredAndSortedCharacters = useMemo(() => {
    const filtered = characters.filter(char => {
      const matchesSearch = (char.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                           (char.archetype?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchesFilter = filterBy === 'all' || char.rarity === filterBy;
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'level':
          return b.level - a.level;
        case 'rarity':
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        case 'strength':
          return b.traditionalStats.strength - a.traditionalStats.strength;
        case 'mentalHealth':
          return b.psychStats.mentalHealth - a.psychStats.mentalHealth;
        default:
          return 0;
      }
    });
  }, [characters, searchTerm, sortBy, filterBy]);

  const handleCardClick = (character: TeamCharacter) => {
    if (!showSelectionMode) return;

    const isSelected = selectedCards.includes(character.id);
    if (isSelected) {
      onCardDeselect?.(character.id);
    } else if (selectedCards.length < maxSelection) {
      onCardSelect?.(character.id);
    }
  };

  const rarityStats = useMemo(() => {
    const stats = characters.reduce((acc, char) => {
      acc[char.rarity] = (acc[char.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  }, [characters]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header Controls */}
      <div className="mb-6 space-y-4">
        {/* Collection Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Card Collection</h2>
            <p className="text-gray-600">
              {characters.length} cards • {selectedCards.length}/{maxSelection} selected
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search characters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="rarity">Sort by Rarity</option>
            <option value="name">Sort by Name</option>
            <option value="level">Sort by Level</option>
            <option value="strength">Sort by Strength</option>
            <option value="mentalHealth">Sort by Mental Health</option>
          </select>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Rarities</option>
            <option value="common">Common ({rarityStats.common || 0})</option>
            <option value="rare">Rare ({rarityStats.rare || 0})</option>
            <option value="epic">Epic ({rarityStats.epic || 0})</option>
            <option value="legendary">Legendary ({rarityStats.legendary || 0})</option>
            <option value="mythic">Mythic ({rarityStats.mythic || 0})</option>
          </select>
        </div>

        {/* Rarity Distribution */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">Collection:</span>
          {Object.entries(rarityStats).map(([rarity, count]) => (
            <div key={rarity} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${
                rarity === 'common' ? 'bg-gray-400' :
                rarity === 'rare' ? 'bg-blue-400' :
                rarity === 'epic' ? 'bg-purple-400' :
                rarity === 'legendary' ? 'bg-yellow-400' :
                'bg-red-400'
              }`} />
              <span className="capitalize">{rarity}</span>
              <span className="text-gray-500">({count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cards Display */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={
          viewMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            : "space-y-4"
        }
      >
        <AnimatePresence>
          {filteredAndSortedCharacters.map((character) => (
            <motion.div
              key={character.id}
              variants={cardVariants}
              exit={{ opacity: 0, scale: 0.8 }}
              className={viewMode === 'list' ? 'flex items-center gap-4 p-4 bg-white rounded-lg shadow-md' : ''}
            >
              <TradingCard
                character={character}
                size={viewMode === 'list' ? 'small' : 'medium'}
                showStats={viewMode === 'grid'}
                isSelected={selectedCards.includes(character.id)}
                isHovered={hoveredCard === character.id}
                onClick={() => handleCardClick(character)}
                onMouseEnter={() => setHoveredCard(character.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`
                  ${showSelectionMode ? 'cursor-pointer' : ''}
                  ${selectedCards.includes(character.id) ? 'ring-2 ring-blue-500' : ''}
                  ${selectedCards.length >= maxSelection && !selectedCards.includes(character.id) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              />
              
              {viewMode === 'list' && (
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">{character.name}</h3>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: rarityOrder[character.rarity] }, (_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-red-500" />
                      <span>STR: {character.traditionalStats.strength}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-500" />
                      <span>Team: {character.psychStats.teamPlayer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <span>Ego: {character.psychStats.ego}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="capitalize">{character.archetype}</span>
                    <span>•</span>
                    <span>Level {character.level}</span>
                    <span>•</span>
                    <span>{character.currentHp}/{character.maxHp} HP</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredAndSortedCharacters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🃏</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No cards found</h3>
          <p className="text-gray-500">
            {searchTerm || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Your collection is empty. Start collecting cards!'
            }
          </p>
        </div>
      )}

      {/* Selection Status */}
      {showSelectionMode && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="font-semibold">{selectedCards.length}/{maxSelection}</span>
              <span className="text-gray-600"> selected</span>
            </div>
            {selectedCards.length > 0 && (
              <button
                onClick={() => selectedCards.forEach(id => onCardDeselect?.(id))}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}