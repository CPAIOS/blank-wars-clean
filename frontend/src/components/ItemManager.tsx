'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Pill,
  Zap,
  BookOpen,
  Sword,
  Star,
  Plus,
  Minus,
  X,
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  Sparkles,
  ShoppingCart,
  Hammer,
  Info
} from 'lucide-react';
import {
  Item,
  ItemType,
  ItemRarity,
  UsageContext,
  allItems,
  itemRarityConfig,
  getItemsByType,
  getItemsByRarity,
  getUsableItems,
  canUseItem,
  craftingRecipes,
  CraftingRecipe
} from '@/data/items';

import { InventoryItem } from '@/data/inventory';

interface ItemManagerProps {
  characterLevel: number;
  inventory?: InventoryItem[];
  gold?: number;
  context?: UsageContext; // 'battle', 'training', 'anytime'
  onUseItem?: (item: Item, quantity?: number) => void;
  onCraftItem?: (recipe: CraftingRecipe) => void;
  onBuyItem?: (item: Item, quantity: number) => void;
}

export default function ItemManager({
  characterLevel,
  inventory = [],
  gold = 0,
  context = 'anytime',
  onUseItem,
  onCraftItem,
  onBuyItem
}: ItemManagerProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'shop' | 'craft'>('inventory');
  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<ItemRarity | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'rarity' | 'quantity'>('type');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [useQuantity, setUseQuantity] = useState(1);

  // Get available items based on context
  const contextItems = context === 'anytime' ? allItems : getUsableItems(context);

  // Filter and sort inventory
  const filteredInventory = inventory
    .filter(invItem => {
      const item = allItems.find(i => i.id === invItem.itemId);
      if (!item) return false;

      const typeMatch = selectedType === 'all' || item.type === selectedType;
      const rarityMatch = selectedRarity === 'all' || item.rarity === selectedRarity;
      const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const contextMatch = canUseItem(item, characterLevel, context);

      return typeMatch && rarityMatch && searchMatch && contextMatch;
    })
    .sort((a, b) => {
      const itemA = allItems.find(i => i.id === a.itemId);
      const itemB = allItems.find(i => i.id === b.itemId);
      if (!itemA || !itemB) return 0;

      switch (sortBy) {
        case 'name':
          return itemA.name.localeCompare(itemB.name);
        case 'type':
          return itemA.type.localeCompare(itemB.type);
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
          return rarityOrder.indexOf(itemB.rarity) - rarityOrder.indexOf(itemA.rarity);
        case 'quantity':
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });

  // Filter shop items
  const shopItems = contextItems
    .filter(item => {
      const typeMatch = selectedType === 'all' || item.type === selectedType;
      const rarityMatch = selectedRarity === 'all' || item.rarity === selectedRarity;
      const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const obtainMatch = item.obtainMethod === 'shop';

      return typeMatch && rarityMatch && searchMatch && obtainMatch;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Available crafting recipes
  const availableRecipes = craftingRecipes.filter(recipe =>
    !recipe.requiredLevel || characterLevel >= recipe.requiredLevel
  );

  const getTypeIcon = (type: ItemType) => {
    const icons = {
      healing: <Pill className="w-5 h-5" />,
      enhancement: <Zap className="w-5 h-5" />,
      training: <BookOpen className="w-5 h-5" />,
      battle: <Sword className="w-5 h-5" />,
      special: <Star className="w-5 h-5" />,
      material: <Package className="w-5 h-5" />
    };
    return icons[type] || <Package className="w-5 h-5" />;
  };

  const canAfford = (item: Item, quantity: number = 1): boolean => {
    return gold >= item.price * quantity;
  };

  const getInventoryQuantity = (itemId: string): number => {
    const invItem = inventory.find(inv => inv.itemId === itemId);
    return invItem ? invItem.quantity : 0;
  };

  const canCraft = (recipe: CraftingRecipe): boolean => {
    if (gold < recipe.goldCost) return false;

    return recipe.materials.every(material => {
      const available = getInventoryQuantity(material.itemId);
      return available >= material.quantity;
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Package className="w-8 h-8 text-green-400" />
          Item Manager
        </h1>
        <p className="text-gray-400 text-lg">
          Manage your consumables, enhancers, and special items
        </p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-lg">
            <span className="text-2xl">🪙</span>
            <span className="text-yellow-400 font-bold">{gold.toLocaleString()} Gold</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-lg">
            <Package className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-bold">{inventory.length} Items</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-800/50 rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'shop'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Shop</span>
          </button>
          <button
            onClick={() => setActiveTab('craft')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'craft'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Hammer className="w-5 h-5" />
            <span>Craft</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ItemType | 'all')}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="healing">Healing</option>
            <option value="enhancement">Enhancement</option>
            <option value="training">Training</option>
            <option value="battle">Battle</option>
            <option value="special">Special</option>
            <option value="material">Materials</option>
          </select>

          {/* Rarity Filter */}
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value as ItemRarity | 'all')}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Rarities</option>
            {Object.entries(itemRarityConfig).map(([rarity, config]) => (
              <option key={rarity} value={rarity}>{config.icon} {config.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="type">Sort by Type</option>
            <option value="name">Sort by Name</option>
            <option value="rarity">Sort by Rarity</option>
            {activeTab === 'inventory' && <option value="quantity">Sort by Quantity</option>}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        {activeTab === 'inventory' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-green-400" />
              Your Inventory
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((invItem) => {
                const item = allItems.find(i => i.id === invItem.itemId);
                if (!item) return null;

                const rarity = itemRarityConfig[item.rarity];

                return (
                  <motion.div
                    key={item.id}
                    className={`border rounded-lg p-4 transition-all cursor-pointer hover:scale-105 bg-gradient-to-r ${rarity.color}/10 border-gray-600 hover:border-blue-500`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${rarity.textColor}`}>
                              {item.name}
                            </span>
                            <span className="text-xs">{rarity.icon}</span>
                          </div>
                          <div className="text-sm text-gray-400 capitalize">
                            {item.type}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          {invItem.quantity}
                        </div>
                        {item.stackable && (
                          <div className="text-xs text-gray-400">
                            Max: {item.maxStack}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-2">{item.description}</p>

                    {/* Quick Use Button */}
                    {onUseItem && canUseItem(item, characterLevel, context) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUseItem(item, 1);
                        }}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        Use Item
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {filteredInventory.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Items Found</h3>
                <p className="text-gray-500">
                  Your inventory is empty or no items match your filters
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shop' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-purple-400" />
              Item Shop
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shopItems.map((item) => {
                const rarity = itemRarityConfig[item.rarity];
                const affordable = canAfford(item);

                return (
                  <motion.div
                    key={item.id}
                    className={`border rounded-lg p-4 transition-all cursor-pointer hover:scale-105 bg-gradient-to-r ${rarity.color}/10 ${
                      affordable ? 'border-gray-600 hover:border-purple-500' : 'border-gray-700 opacity-50'
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${rarity.textColor}`}>
                              {item.name}
                            </span>
                            <span className="text-xs">{rarity.icon}</span>
                          </div>
                          <div className="text-sm text-gray-400 capitalize">
                            {item.type}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-lg font-bold ${affordable ? 'text-yellow-400' : 'text-red-400'}`}>
                          {item.price} 🪙
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-2">{item.description}</p>

                    {/* Buy Button */}
                    {onBuyItem && affordable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBuyItem(item, 1);
                        }}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        Buy Item
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'craft' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Hammer className="w-6 h-6 text-orange-400" />
              Crafting
            </h2>

            <div className="grid gap-4">
              {availableRecipes.map((recipe) => {
                const resultItem = allItems.find(item => item.id === recipe.resultItem);
                if (!resultItem) return null;

                const canCraftItem = canCraft(recipe);
                const rarity = itemRarityConfig[resultItem.rarity];

                return (
                  <motion.div
                    key={recipe.id}
                    className={`border rounded-lg p-4 ${
                      canCraftItem ? 'border-gray-600 hover:border-orange-500' : 'border-gray-700 opacity-50'
                    } transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{resultItem.icon}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xl font-bold ${rarity.textColor}`}>
                              {resultItem.name}
                            </span>
                            <span className="text-sm">{rarity.icon}</span>
                            <span className="text-gray-400">x{recipe.resultQuantity}</span>
                          </div>
                          <p className="text-gray-400 text-sm">{resultItem.description}</p>
                        </div>
                      </div>

                      {onCraftItem && canCraftItem && (
                        <button
                          onClick={() => onCraftItem(recipe)}
                          className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          Craft
                        </button>
                      )}
                    </div>

                    {/* Materials Required */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <h4 className="text-white font-semibold mb-2">Materials Required:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {recipe.materials.map((material, index) => {
                          const materialItem = allItems.find(item => item.id === material.itemId);
                          const available = getInventoryQuantity(material.itemId);
                          const hasEnough = available >= material.quantity;

                          return (
                            <div key={index} className={`text-sm p-2 rounded ${hasEnough ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                              <div className="font-semibold">{materialItem?.name || material.itemId}</div>
                              <div className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                                {available}/{material.quantity}
                              </div>
                            </div>
                          );
                        })}
                        <div className={`text-sm p-2 rounded ${gold >= recipe.goldCost ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          <div className="font-semibold">Gold</div>
                          <div className={gold >= recipe.goldCost ? 'text-green-400' : 'text-red-400'}>
                            {gold}/{recipe.goldCost}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {availableRecipes.length === 0 && (
              <div className="text-center py-12">
                <Hammer className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Recipes Available</h3>
                <p className="text-gray-500">
                  Level up to unlock crafting recipes
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">Item Details</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className={`p-4 rounded-lg bg-gradient-to-r ${itemRarityConfig[selectedItem.rarity].color}/20 border border-current mb-4`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{selectedItem.icon}</span>
                  <div>
                    <h4 className={`text-xl font-bold ${itemRarityConfig[selectedItem.rarity].textColor}`}>
                      {selectedItem.name}
                    </h4>
                    <div className="text-sm text-gray-400 capitalize">
                      {itemRarityConfig[selectedItem.rarity].name} {selectedItem.type}
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 mb-3">{selectedItem.description}</p>
                <p className="text-sm text-gray-400 italic">&quot;{selectedItem.flavor}&quot;</p>
              </div>

              {/* Effects */}
              {selectedItem.effects.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-white font-semibold mb-2">Effects</h5>
                  <div className="space-y-2">
                    {selectedItem.effects.map((effect, index) => (
                      <div key={index} className="bg-gray-800 rounded p-3">
                        <div className="text-purple-400 font-semibold capitalize">
                          {effect.type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-300">
                          {effect.type === 'heal' && `Restores ${effect.value} HP`}
                          {effect.type === 'stat_boost' && `${effect.value > 0 ? '+' : ''}${effect.value}% ${effect.stat?.toUpperCase()} ${effect.duration ? `for ${effect.duration} turns` : ''}`}
                          {effect.type === 'energy_restore' && `Restores ${effect.value} Energy`}
                          {effect.type === 'xp_boost' && `${effect.value > 1000 ? `+${effect.value} XP` : `+${effect.value}% XP gain`}`}
                          {effect.type === 'training_boost' && `${effect.value}% training effectiveness`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Item Properties */}
              <div className="mb-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400">Usage:</span>
                    <span className="text-white capitalize ml-2">{selectedItem.usageContext}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Stackable:</span>
                    <span className="text-white ml-2">{selectedItem.stackable ? `Yes (${selectedItem.maxStack})` : 'No'}</span>
                  </div>
                  {selectedItem.cooldown && (
                    <div>
                      <span className="text-gray-400">Cooldown:</span>
                      <span className="text-white ml-2">{selectedItem.cooldown} turns</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <span className="text-yellow-400 ml-2">{selectedItem.price} 🪙</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {activeTab === 'inventory' && onUseItem && canUseItem(selectedItem, characterLevel, context) && (
                  <button
                    onClick={() => {
                      onUseItem(selectedItem, useQuantity);
                      setSelectedItem(null);
                    }}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Use Item
                  </button>
                )}

                {activeTab === 'shop' && onBuyItem && canAfford(selectedItem) && (
                  <button
                    onClick={() => {
                      onBuyItem(selectedItem, 1);
                      setSelectedItem(null);
                    }}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Buy Item
                  </button>
                )}

                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
