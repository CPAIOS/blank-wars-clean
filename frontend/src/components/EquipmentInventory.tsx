'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Filter, 
  Search, 
  Grid, 
  List,
  Sword,
  Shield,
  Crown,
  Star,
  ChevronDown,
  SortAsc
} from 'lucide-react';
import { Equipment, EquipmentRarity } from '@/data/equipment';
import { Character } from '@/data/characters';
import { getEquipmentCompatibility } from '@/data/characterEquipment';
import EquipmentDetailsModal from './EquipmentDetailsModal';

interface EquipmentInventoryProps {
  equipment: Equipment[];
  character?: Character;
  onEquip?: (equipment: Equipment) => void;
  showCharacterFilter?: boolean;
  title?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'level' | 'rarity' | 'type';
type FilterSlot = 'all' | 'weapon' | 'armor' | 'accessory';
type FilterRarity = 'all' | EquipmentRarity;

const rarityConfig = {
  common: { color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300' },
  uncommon: { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-300' },
  rare: { color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-300' },
  epic: { color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-300' },
  legendary: { color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-300' },
  mythic: { color: 'text-pink-600', bg: 'bg-pink-100', border: 'border-pink-300' }
};

export default function EquipmentInventory({
  equipment,
  character,
  onEquip,
  showCharacterFilter = true,
  title = 'Equipment Inventory'
}: EquipmentInventoryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [filterSlot, setFilterSlot] = useState<FilterSlot>('all');
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showOnlyCompatible, setShowOnlyCompatible] = useState(false);

  // Filter and sort equipment
  const filteredEquipment = useMemo(() => {
    let filtered = equipment;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Slot filter
    if (filterSlot !== 'all') {
      filtered = filtered.filter(item => item.slot === filterSlot);
    }

    // Rarity filter
    if (filterRarity !== 'all') {
      filtered = filtered.filter(item => item.rarity === filterRarity);
    }

    // Character compatibility filter
    if (showOnlyCompatible && character) {
      filtered = filtered.filter(item => {
        const compatibility = getEquipmentCompatibility(character, item);
        return compatibility.canEquip;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'level':
          return b.requiredLevel - a.requiredLevel;
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
          return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [equipment, searchQuery, filterSlot, filterRarity, showOnlyCompatible, character, sortBy]);

  const EquipmentCard = ({ item }: { item: Equipment }) => {
    const compatibility = character ? getEquipmentCompatibility(character, item) : null;
    const config = rarityConfig[item.rarity];
    
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          bg-white rounded-lg border-2 ${config.border} cursor-pointer overflow-hidden
          hover:shadow-lg transition-all duration-200
          ${!compatibility?.canEquip && character ? 'opacity-60' : ''}
        `}
        onClick={() => setSelectedEquipment(item)}
      >
        <div className={`${config.bg} p-3 border-b ${config.border}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{item.icon}</span>
            <div className="text-right">
              <div className={`text-xs font-medium ${config.color}`}>
                {item.rarity.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">Lv.{item.requiredLevel}</div>
            </div>
          </div>
          <h3 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
        </div>
        
        <div className="p-3">
          {/* Stats preview */}
          <div className="flex flex-wrap gap-1 mb-2">
            {item.stats.atk && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                ATK +{item.stats.atk}
              </span>
            )}
            {item.stats.def && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                DEF +{item.stats.def}
              </span>
            )}
            {item.stats.spd && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                SPD +{item.stats.spd}
              </span>
            )}
          </div>

          {/* Effects preview */}
          {item.effects.length > 0 && (
            <div className="text-xs text-gray-600">
              {item.effects.length} special effect{item.effects.length > 1 ? 's' : ''}
            </div>
          )}

          {/* Compatibility indicator */}
          {character && compatibility && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Compatibility</span>
                <span className={
                  compatibility.effectiveness >= 1 ? 'text-green-600' :
                  compatibility.effectiveness >= 0.8 ? 'text-yellow-600' : 'text-red-600'
                }>
                  {Math.round(compatibility.effectiveness * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const EquipmentListItem = ({ item }: { item: Equipment }) => {
    const compatibility = character ? getEquipmentCompatibility(character, item) : null;
    const config = rarityConfig[item.rarity];
    
    return (
      <motion.div
        whileHover={{ backgroundColor: '#f9fafb' }}
        className="flex items-center gap-4 p-3 border-b border-gray-100 cursor-pointer"
        onClick={() => setSelectedEquipment(item)}
      >
        <span className="text-2xl">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
            <span className={`text-xs px-2 py-1 rounded ${config.bg} ${config.color}`}>
              {item.rarity}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">{item.description}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Level {item.requiredLevel}</div>
          {character && compatibility && (
            <div className="text-xs text-gray-500">
              {Math.round(compatibility.effectiveness * 100)}% compat.
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6" />
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <div className="text-sm opacity-90">
            {filteredEquipment.length} items
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters and controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Slot filter */}
          <select
            value={filterSlot}
            onChange={(e) => setFilterSlot(e.target.value as FilterSlot)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Slots</option>
            <option value="weapon">Weapons</option>
            <option value="armor">Armor</option>
            <option value="accessory">Accessories</option>
          </select>

          {/* Rarity filter */}
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value as FilterRarity)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Rarities</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
            <option value="mythic">Mythic</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="level">Sort by Level</option>
            <option value="rarity">Sort by Rarity</option>
            <option value="type">Sort by Type</option>
          </select>

          {/* Character filter */}
          {character && showCharacterFilter && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showOnlyCompatible}
                onChange={(e) => setShowOnlyCompatible(e.target.checked)}
                className="rounded"
              />
              <span>Compatible only</span>
            </label>
          )}

          {/* View mode */}
          <div className="ml-auto flex items-center gap-1 border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Equipment grid/list */}
      <div className="p-4">
        {filteredEquipment.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No equipment found matching your criteria</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEquipment.map((item) => (
              <EquipmentCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="space-y-0">
            {filteredEquipment.map((item) => (
              <EquipmentListItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Equipment details modal */}
      <EquipmentDetailsModal
        isOpen={selectedEquipment !== null}
        onClose={() => setSelectedEquipment(null)}
        equipment={selectedEquipment}
        character={character}
        onEquip={onEquip}
        showComparison={!!character}
      />
    </div>
  );
}