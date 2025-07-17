'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package,
  Sword,
  Shield,
  Sparkles,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Lock,
  Heart,
  Trash2,
  ArrowUpDown,
  Plus,
  Minus,
  Eye,
  X,
  Check,
  AlertTriangle,
  Zap,
  Clock,
  Target,
  Settings,
  Save,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Info
} from 'lucide-react';
import {
  CharacterInventory,
  InventoryItem,
  InventoryFilter,
  EquipmentLoadout,
  addItemToInventory,
  removeItemFromInventory,
  equipItem,
  unequipItem,
  setQuickAccessSlot,
  filterInventoryItems,
  sortInventoryItems,
  calculateInventoryStats,
  createLoadout,
  applyLoadout,
  createDemoInventory
} from '@/data/inventory';
import {
  Equipment,
  // Item, // Not exported
  allEquipment,
  // allItems, // Not exported  
  // getEquipmentById, // Not exported
  // getItemById, // Not exported
  // getRarityColor, // Not exported - defined locally instead
  // canEquipItem // Not exported
} from '@/data/equipment';

// Temporary interfaces for missing types
interface Item {
  id: string;
  name: string;
  description: string;
  rarity: string;
  type: string;
}

// Placeholder functions for missing exports
const getEquipmentById = (id: string): Equipment | undefined => allEquipment.find(eq => eq.id === id);
const getItemById = (id: string): Item | undefined => undefined; // No items data available
const canEquipItem = (equipment: Equipment, character: any): boolean => true;

interface InventoryManagerProps {
  character: {
    id: string;
    name: string;
    avatar: string;
    archetype: string;
    level: number;
    stats: Record<string, number>;
  };
  initialInventory?: CharacterInventory;
  onInventoryChange?: (inventory: CharacterInventory) => void;
  onStatsChange?: (newStats: Record<string, number>) => void;
}

// Helper function for rarity colors
const getRarityColor = (rarity: string) => {
  const colors: Record<string, string> = {
    common: 'from-gray-600 to-gray-700',
    uncommon: 'from-green-600 to-green-700',
    rare: 'from-blue-600 to-blue-700',
    epic: 'from-purple-600 to-purple-700',
    legendary: 'from-yellow-600 to-yellow-700'
  };
  return colors[rarity] || colors.common;
};

export default function InventoryManager({
  character,
  initialInventory,
  onInventoryChange,
  onStatsChange
}: InventoryManagerProps) {
  const [inventory, setInventory] = useState<CharacterInventory>(
    initialInventory || createDemoInventory(character.id)
  );
  const [activeTab, setActiveTab] = useState<'equipment' | 'items' | 'loadouts'>('equipment');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<InventoryFilter>({ type: 'all', rarity: 'all', equipped: 'all' });
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [draggedItem, setDraggedItem] = useState<InventoryItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [loadouts, setLoadouts] = useState<EquipmentLoadout[]>([]);
  const [showLoadoutCreator, setShowLoadoutCreator] = useState(false);
  const [newLoadoutName, setNewLoadoutName] = useState('');
  const [showStats, setShowStats] = useState(true);

  // Calculate inventory stats
  const inventoryStats = calculateInventoryStats(inventory);

  // Get filtered and sorted items
  const getFilteredItems = () => {
    let items = inventory.items;
    
    // Apply tab filter
    if (activeTab === 'equipment') {
      items = items.filter(item => {
        const equipment = getEquipmentById(item.itemId);
        return equipment !== null;
      });
    } else if (activeTab === 'items') {
      items = items.filter(item => {
        const gameItem = getItemById(item.itemId);
        return gameItem !== null;
      });
    }

    // Apply filters
    items = filterInventoryItems(items, filter);
    
    // Apply search
    if (filter.search) {
      items = items.filter(item => {
        const equipment = getEquipmentById(item.itemId);
        const gameItem = getItemById(item.itemId);
        const itemData = equipment || gameItem;
        return itemData?.name.toLowerCase().includes(filter.search!.toLowerCase()) ||
               itemData?.description.toLowerCase().includes(filter.search!.toLowerCase());
      });
    }

    return sortInventoryItems(items, inventory.sortPreference);
  };

  const filteredItems = getFilteredItems();

  // Get item data (equipment or regular item)
  const getItemData = (inventoryItem: InventoryItem): Equipment | Item | null => {
    return getEquipmentById(inventoryItem.itemId) || getItemById(inventoryItem.itemId);
  };

  // Calculate total character stats with equipment
  const calculateTotalStats = () => {
    const baseStats = { ...character.stats };
    
    Object.values(inventory.equipped).forEach(item => {
      if (item) {
        const equipment = getEquipmentById(item.itemId) as Equipment;
        if (equipment?.stats) {
          Object.entries(equipment.stats).forEach(([stat, value]) => {
            baseStats[stat] = (baseStats[stat] || 0) + value;
          });
        }
      }
    });

    return baseStats;
  };

  const totalStats = calculateTotalStats();

  // Drag and drop handlers
  const handleDragStart = (item: InventoryItem) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDrop = (target: string) => {
    if (!draggedItem) return;

    if (target.startsWith('equip_')) {
      const slot = target.replace('equip_', '') as 'weapon' | 'armor' | 'accessory';
      const equipment = getEquipmentById(draggedItem.itemId) as Equipment;
      
      if (equipment && equipment.slot === slot) {
        const result = equipItem(inventory, draggedItem.id, slot);
        if (result.success) {
          setInventory(result.updatedInventory);
          onInventoryChange?.(result.updatedInventory);
        }
      }
    } else if (target.startsWith('quick_')) {
      const slotNumber = parseInt(target.replace('quick_', '')) as 1 | 2 | 3 | 4;
      const result = setQuickAccessSlot(inventory, slotNumber, draggedItem.id);
      if (result.success) {
        setInventory(result.updatedInventory);
        onInventoryChange?.(result.updatedInventory);
      }
    }

    setDraggedItem(null);
    setDropTarget(null);
  };

  // Equipment handlers
  const handleEquipItem = (item: InventoryItem) => {
    const equipment = getEquipmentById(item.itemId) as Equipment;
    if (!equipment) return;

    const result = equipItem(inventory, item.id, equipment.slot);
    if (result.success) {
      setInventory(result.updatedInventory);
      onInventoryChange?.(result.updatedInventory);
      onStatsChange?.(calculateTotalStats());
    }
  };

  const handleUnequipItem = (slot: 'weapon' | 'armor' | 'accessory') => {
    const result = unequipItem(inventory, slot);
    if (result.success) {
      setInventory(result.updatedInventory);
      onInventoryChange?.(result.updatedInventory);
      onStatsChange?.(calculateTotalStats());
    }
  };

  // Item usage
  const handleUseItem = (item: InventoryItem) => {
    const gameItem = getItemById(item.itemId);
    if (!gameItem || gameItem.type !== 'consumable') return;

    // For demo purposes, just remove one
    const result = removeItemFromInventory(inventory, item.id, 1);
    if (result.success) {
      setInventory(result.updatedInventory);
      onInventoryChange?.(result.updatedInventory);
      
      // Apply item effects (demo)
      console.log(`Used ${gameItem.name}: ${gameItem.description}`);
    }
  };

  // Get item icon based on type
  const getItemIcon = (itemData: Equipment | Item) => {
    if ('slot' in itemData) {
      // Equipment
      if (itemData.slot === 'weapon') return '⚔️';
      if (itemData.slot === 'armor') return '🛡️';
      if (itemData.slot === 'accessory') return '💍';
    } else {
      // Item
      if (itemData.type === 'consumable') return '🧪';
      if (itemData.type === 'enhancer') return '⭐';
      if (itemData.type === 'crafting') return '🔧';
      if (itemData.type === 'special') return '✨';
    }
    return '📦';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{character.avatar}</div>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-400" />
              {character.name}&apos;s Inventory
            </h1>
            <p className="text-gray-400">Level {character.level} {character.archetype}</p>
          </div>
        </div>

        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          {showStats ? 'Hide' : 'Show'} Stats
        </button>
      </div>

      {/* Character Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900/50 rounded-xl border border-gray-700 p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Character Stats
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(totalStats).map(([stat, value]) => {
                const baseStat = character.stats[stat] || 0;
                const bonus = value - baseStat;
                
                return (
                  <div key={stat} className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {value}
                      {bonus > 0 && (
                        <span className="text-green-400 text-sm ml-1">+{bonus}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 uppercase">{stat}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory Stats */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-blue-400">{inventoryStats.usedSlots}</div>
            <div className="text-sm text-gray-400">Items Owned</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-400">{inventoryStats.availableSlots}</div>
            <div className="text-sm text-gray-400">Free Slots</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-400">{inventoryStats.equippedItems}</div>
            <div className="text-sm text-gray-400">Equipped</div>
          </div>
          <div>
            <div className="text-xl font-bold text-yellow-400">{inventory.maxSlots}</div>
            <div className="text-sm text-gray-400">Max Capacity</div>
          </div>
        </div>
      </div>

      {/* Equipment Slots */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Equipment Slots
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {(['weapon', 'armor', 'accessory'] as const).map((slot) => {
            const equippedItem = inventory.equipped[slot];
            const itemData = equippedItem ? getItemData(equippedItem) : null;
            
            return (
              <div
                key={slot}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dropTarget === `equip_${slot}` 
                    ? 'border-green-500 bg-green-500/20' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTarget(`equip_${slot}`);
                }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(`equip_${slot}`);
                }}
              >
                <div className="text-4xl mb-2">
                  {equippedItem ? getItemIcon(itemData!) : 
                   slot === 'weapon' ? '⚔️' : 
                   slot === 'armor' ? '🛡️' : '💍'}
                </div>
                
                {equippedItem && itemData ? (
                  <div>
                    <h3 className={`font-bold mb-1 ${getRarityColor(itemData.rarity).replace('from-', 'text-').replace('to-', '').split(' ')[0]}`}>
                      {itemData.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">{itemData.rarity}</p>
                    <button
                      onClick={() => handleUnequipItem(slot)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      Unequip
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-gray-400 mb-1 capitalize">{slot}</h3>
                    <p className="text-sm text-gray-500">Drag item here to equip</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Access Slots */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Quick Access Slots</h3>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((slotNumber) => {
              const slotItem = inventory.quickAccess[`slot${slotNumber}` as keyof typeof inventory.quickAccess];
              const itemData = slotItem ? getItemData(slotItem) : null;
              
              return (
                <div
                  key={slotNumber}
                  className={`border-2 border-dashed rounded-lg p-4 text-center aspect-square flex flex-col items-center justify-center transition-all ${
                    dropTarget === `quick_${slotNumber}` 
                      ? 'border-green-500 bg-green-500/20' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropTarget(`quick_${slotNumber}`);
                  }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(`quick_${slotNumber}`);
                  }}
                >
                  <div className="text-2xl mb-1">
                    {slotItem ? getItemIcon(itemData!) : '📦'}
                  </div>
                  <div className="text-xs">
                    {slotItem && itemData ? (
                      <div>
                        <div className="font-semibold text-white truncate">{itemData.name}</div>
                        <div className="text-gray-400">{slotItem.quantity}</div>
                      </div>
                    ) : (
                      <div className="text-gray-500">Slot {slotNumber}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-800/50 rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'equipment'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Sword className="w-5 h-5" />
            Equipment
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'items'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Package className="w-5 h-5" />
            Items
          </button>
          <button
            onClick={() => setActiveTab('loadouts')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'loadouts'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Save className="w-5 h-5" />
            Loadouts
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      {activeTab !== 'loadouts' && (
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={filter.search || ''}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={filter.rarity}
              onChange={(e) => setFilter({ ...filter, rarity: e.target.value as any })}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
              <option value="mythic">Mythic</option>
            </select>

            <select
              value={filter.equipped}
              onChange={(e) => setFilter({ ...filter, equipped: e.target.value as any })}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Items</option>
              <option value="equipped">Equipped</option>
              <option value="unequipped">Unequipped</option>
            </select>

            <select
              value={inventory.sortPreference}
              onChange={(e) => {
                const newInventory = {
                  ...inventory,
                  sortPreference: e.target.value as any
                };
                setInventory(newInventory);
                onInventoryChange?.(newInventory);
              }}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="type">Sort by Type</option>
              <option value="name">Sort by Name</option>
              <option value="rarity">Sort by Rarity</option>
              <option value="recent">Sort by Recent</option>
            </select>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">{filteredItems.length} items</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Grid/List */}
      {activeTab !== 'loadouts' && (
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' 
              : 'grid-cols-1'
          }`}>
            {filteredItems.map((item) => {
              const itemData = getItemData(item);
              if (!itemData) return null;

              const isEquipment = 'slot' in itemData;
              const canEquip = isEquipment && !item.isEquipped && 
                canEquipItem(itemData as Equipment, character);

              return (
                <motion.div
                  key={item.id}
                  layout
                  className={`border rounded-xl cursor-pointer transition-all ${
                    item.isEquipped 
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-600 hover:border-blue-500'
                  } ${viewMode === 'list' ? 'flex gap-4 p-4' : 'p-3'}`}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onDragEnd={handleDragEnd}
                  whileHover={{ scale: viewMode === 'grid' ? 1.02 : 1 }}
                  onClick={() => {
                    setSelectedItem(item);
                    setShowItemDetails(true);
                  }}
                >
                  <div className={`${viewMode === 'list' ? 'w-16 h-16' : 'aspect-square mb-2'} bg-gradient-to-br ${getRarityColor(itemData.rarity)}/20 rounded-lg flex items-center justify-center relative`}>
                    <div className="text-3xl">{getItemIcon(itemData)}</div>
                    
                    {/* Quantity badge */}
                    {item.quantity > 1 && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full">
                        {item.quantity}
                      </div>
                    )}

                    {/* Status badges */}
                    <div className="absolute top-1 left-1 flex flex-col gap-1">
                      {item.isEquipped && (
                        <div className="bg-green-500 text-white text-xs px-1 py-0.5 rounded">E</div>
                      )}
                      {item.isLocked && (
                        <Lock className="w-3 h-3 text-yellow-400" />
                      )}
                      {item.isFavorite && (
                        <Heart className="w-3 h-3 text-red-400 fill-current" />
                      )}
                    </div>
                  </div>

                  <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <h3 className={`font-bold text-sm ${getRarityColor(itemData.rarity).replace('from-', 'text-').replace('to-', '').split(' ')[0]} mb-1`}>
                      {itemData.name}
                    </h3>
                    <p className="text-xs text-gray-400 capitalize mb-2">{itemData.rarity}</p>
                    
                    {viewMode === 'list' && (
                      <p className="text-xs text-gray-300 mb-2">{itemData.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        {isEquipment && (
                          <span className="text-blue-400 capitalize">{(itemData as Equipment).slot}</span>
                        )}
                        {!isEquipment && (
                          <span className="text-green-400 capitalize">{(itemData as Item).type}</span>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {canEquip && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquipItem(item);
                            }}
                            className="text-green-400 hover:text-green-300 transition-colors"
                          >
                            <Zap className="w-3 h-3" />
                          </button>
                        )}
                        
                        {!isEquipment && (itemData as Item).type === 'consumable' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseItem(item);
                            }}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Target className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Items Found</h3>
              <p className="text-gray-500">
                {filter.search || filter.rarity !== 'all' || filter.equipped !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your inventory is empty'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loadouts Tab */}
      {activeTab === 'loadouts' && (
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Equipment Loadouts</h2>
            <button
              onClick={() => setShowLoadoutCreator(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Loadout
            </button>
          </div>

          {loadouts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadouts.map((loadout) => (
                <div key={loadout.id} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">{loadout.name}</h3>
                    {loadout.isActive && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">ACTIVE</span>
                    )}
                  </div>
                  
                  {loadout.description && (
                    <p className="text-sm text-gray-400 mb-3">{loadout.description}</p>
                  )}

                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => {
                        const result = applyLoadout(inventory, loadout);
                        if (result.success) {
                          setInventory(result.updatedInventory);
                          onInventoryChange?.(result.updatedInventory);
                        }
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-semibold transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => {
                        setLoadouts(loadouts.filter(l => l.id !== loadout.id));
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-gray-500">
                    Created {loadout.createdDate.toLocaleDateString()}
                    {loadout.lastUsed && (
                      <div>Last used {loadout.lastUsed.toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Save className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Loadouts Saved</h3>
              <p className="text-gray-500 mb-4">
                Create loadouts to quickly switch between equipment configurations
              </p>
              <button
                onClick={() => setShowLoadoutCreator(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Create Your First Loadout
              </button>
            </div>
          )}
        </div>
      )}

      {/* Item Details Modal */}
      <AnimatePresence>
        {showItemDetails && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowItemDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const itemData = getItemData(selectedItem);
                if (!itemData) return null;

                const isEquipment = 'slot' in itemData;

                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{itemData.name}</h3>
                      <button
                        onClick={() => setShowItemDetails(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className={`aspect-square w-24 mx-auto bg-gradient-to-br ${getRarityColor(itemData.rarity)}/20 rounded-lg flex items-center justify-center`}>
                        <div className="text-4xl">{getItemIcon(itemData)}</div>
                      </div>

                      <div className="text-center">
                        <div className={`text-lg font-bold ${getRarityColor(itemData.rarity).replace('from-', 'text-').replace('to-', '').split(' ')[0]} mb-1`}>
                          {itemData.rarity.charAt(0).toUpperCase() + itemData.rarity.slice(1)}
                        </div>
                        {isEquipment && (
                          <div className="text-sm text-blue-400 capitalize">{(itemData as Equipment).slot}</div>
                        )}
                        {!isEquipment && (
                          <div className="text-sm text-green-400 capitalize">{(itemData as Item).type}</div>
                        )}
                      </div>

                      <p className="text-gray-300 text-center">{itemData.description}</p>

                      {isEquipment && (itemData as Equipment).stats && (
                        <div>
                          <h4 className="font-semibold text-white mb-2">Stats:</h4>
                          <div className="space-y-1">
                            {Object.entries((itemData as Equipment).stats!).map(([stat, value]) => (
                              <div key={stat} className="flex justify-between">
                                <span className="text-gray-400 capitalize">{stat}:</span>
                                <span className="text-green-400">+{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedItem.quantity > 1 && (
                        <div className="text-center">
                          <span className="text-gray-400">Quantity: </span>
                          <span className="text-white font-bold">{selectedItem.quantity}</span>
                        </div>
                      )}

                      <div className="flex gap-3 pt-4">
                        {isEquipment && !selectedItem.isEquipped && (
                          <button
                            onClick={() => {
                              handleEquipItem(selectedItem);
                              setShowItemDetails(false);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors"
                          >
                            Equip
                          </button>
                        )}
                        
                        {!isEquipment && (itemData as Item).type === 'consumable' && (
                          <button
                            onClick={() => {
                              handleUseItem(selectedItem);
                              setShowItemDetails(false);
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-colors"
                          >
                            Use Item
                          </button>
                        )}
                        
                        <button
                          onClick={() => setShowItemDetails(false)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loadout Creator Modal */}
      <AnimatePresence>
        {showLoadoutCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowLoadoutCreator(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Create Loadout</h3>
                <button
                  onClick={() => setShowLoadoutCreator(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Loadout Name</label>
                  <input
                    type="text"
                    value={newLoadoutName}
                    onChange={(e) => setNewLoadoutName(e.target.value)}
                    placeholder="My Epic Loadout"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="text-sm text-gray-400">
                  This will save your current equipment and quick access configuration.
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowLoadoutCreator(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newLoadoutName.trim()) {
                        const newLoadout = createLoadout(
                          newLoadoutName,
                          'Custom loadout',
                          inventory.equipped,
                          inventory.quickAccess
                        );
                        setLoadouts([...loadouts, newLoadout]);
                        setNewLoadoutName('');
                        setShowLoadoutCreator(false);
                      }
                    }}
                    disabled={!newLoadoutName.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}