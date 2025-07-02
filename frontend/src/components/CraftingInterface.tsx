'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hammer, 
  Clock, 
  Star, 
  CheckCircle, 
  XCircle, 
  Package,
  Zap,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Timer
} from 'lucide-react';
import { 
  CraftingRecipe, 
  CraftingMaterial, 
  CraftingStation,
  PlayerCrafting,
  CraftingSystem,
  craftingRecipes,
  craftingMaterials,
  craftingStations
} from '@/data/craftingSystem';
import { Character } from '@/data/characters';

interface CraftingInterfaceProps {
  character: Character;
  playerCrafting: PlayerCrafting;
  onStartCrafting?: (recipe: CraftingRecipe, stationId?: string) => void;
  onCompleteCrafting?: (craftId: string) => void;
  availableStations?: string[];
}

export default function CraftingInterface({
  character,
  playerCrafting,
  onStartCrafting,
  onCompleteCrafting,
  availableStations = ['basic_forge']
}: CraftingInterfaceProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null);
  const [selectedStation, setSelectedStation] = useState<string>(availableStations[0] || '');
  const [filterCategory, setFilterCategory] = useState<'all' | 'weapon' | 'armor' | 'accessory' | 'upgrade'>('all');

  // Filter recipes based on character and category
  const availableRecipes = useMemo(() => {
    let filtered = craftingRecipes.filter(recipe => {
      // Check if recipe is unlocked
      if (!playerCrafting.unlockedRecipes.includes(recipe.id)) {
        return false;
      }
      
      // Filter by category
      if (filterCategory !== 'all' && recipe.category !== filterCategory) {
        return false;
      }
      
      // Check if recipe is relevant to character
      if (recipe.resultEquipmentId.includes(character.id) || 
          recipe.baseEquipmentId?.includes(character.id) ||
          !recipe.resultEquipmentId.includes('_')) {
        return true;
      }
      
      return false;
    });
    
    return filtered;
  }, [playerCrafting.unlockedRecipes, filterCategory, character.id]);

  const getRecipeStatus = (recipe: CraftingRecipe) => {
    return CraftingSystem.canCraftRecipe(recipe, playerCrafting, character.level);
  };

  const getMaterial = (materialId: string): CraftingMaterial | undefined => {
    return craftingMaterials.find(m => m.id === materialId);
  };

  const getStation = (stationId: string): CraftingStation | undefined => {
    return craftingStations.find(s => s.id === stationId);
  };

  const getCurrentMaterialCount = (materialId: string): number => {
    const material = playerCrafting.materials.find(m => m.materialId === materialId);
    return material?.quantity || 0;
  };

  const RecipeCard = ({ recipe }: { recipe: CraftingRecipe }) => {
    const status = getRecipeStatus(recipe);
    const station = selectedStation ? getStation(selectedStation) : null;
    const successRate = CraftingSystem.calculateCraftingSuccess(recipe, selectedStation);
    const craftingTime = CraftingSystem.calculateCraftingTime(recipe, selectedStation);

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          bg-white rounded-lg border-2 cursor-pointer overflow-hidden transition-all duration-200
          ${selectedRecipe?.id === recipe.id ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
          ${!status.canCraft ? 'opacity-60' : ''}
        `}
        onClick={() => setSelectedRecipe(recipe)}
      >
        <div className="p-4">
          {/* Recipe header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-800">{recipe.name}</h3>
              <p className="text-sm text-gray-600">{recipe.description}</p>
            </div>
            <div className="text-right">
              <div className={`text-xs px-2 py-1 rounded font-medium ${
                recipe.category === 'weapon' ? 'bg-red-100 text-red-700' :
                recipe.category === 'armor' ? 'bg-blue-100 text-blue-700' :
                recipe.category === 'accessory' ? 'bg-purple-100 text-purple-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {recipe.category.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Materials required */}
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-2">Materials Required</div>
            <div className="grid grid-cols-2 gap-2">
              {recipe.materials.map((req, index) => {
                const material = getMaterial(req.materialId);
                const owned = getCurrentMaterialCount(req.materialId);
                const hasEnough = owned >= req.quantity;

                return (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className="text-lg">{material?.icon || '❓'}</span>
                    <div className="flex-1">
                      <div className="font-medium">{material?.name || req.materialId}</div>
                      <div className={`${hasEnough ? 'text-green-600' : 'text-red-600'}`}>
                        {owned}/{req.quantity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recipe stats */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-gray-500" />
              <span>{craftingTime}m</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-gray-500" />
              <span>{successRate}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-3 h-3 text-gray-500" />
              <span>{recipe.experienceGained} XP</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-3 h-3 text-gray-500" />
              <span>{recipe.gold}g</span>
            </div>
          </div>

          {/* Status indicator */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            {status.canCraft ? (
              <div className="flex items-center gap-2 text-green-600 text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>Can craft</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 text-xs">
                <XCircle className="w-4 h-4" />
                <span>Missing requirements</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const ActiveCraftItem = ({ craft, index }: { craft: any; index: number }) => {
    const recipe = craftingRecipes.find(r => r.id === craft.recipeId);
    const now = new Date();
    const progress = Math.min((now.getTime() - craft.startTime.getTime()) / (craft.completionTime.getTime() - craft.startTime.getTime()), 1);
    const isComplete = now >= craft.completionTime;

    if (!recipe) return null;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-800">{recipe.name}</h4>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <button
                onClick={() => onCompleteCrafting?.(craft.recipeId)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                Collect
              </button>
            ) : (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Timer className="w-4 h-4" />
                <span>{Math.ceil((craft.completionTime.getTime() - now.getTime()) / 60000)}m</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        
        <div className="text-xs text-gray-600 mt-1">
          {isComplete ? 'Ready to collect!' : `${Math.round(progress * 100)}% complete`}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
        <div className="flex items-center gap-3">
          <Hammer className="w-6 h-6" />
          <h2 className="text-xl font-bold">Equipment Crafting</h2>
        </div>
        <p className="text-orange-100 mt-2">Forge powerful equipment for {character.name}</p>
      </div>

      {/* Active crafts */}
      {playerCrafting.activeCrafts.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Active Crafts ({playerCrafting.activeCrafts.length})
          </h3>
          <div className="space-y-3">
            {playerCrafting.activeCrafts.map((craft, index) => (
              <ActiveCraftItem key={index} craft={craft} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="weapon">Weapons</option>
              <option value="armor">Armor</option>
              <option value="accessory">Accessories</option>
              <option value="upgrade">Upgrades</option>
            </select>
          </div>

          {/* Crafting station */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Crafting Station</label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {availableStations.map(stationId => {
                const station = getStation(stationId);
                return (
                  <option key={stationId} value={stationId}>
                    {station?.name || stationId}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Recipe selection */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Available Recipes ({availableRecipes.length})
        </h3>
        
        {availableRecipes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recipes available for the selected category</p>
            <p className="text-sm mt-2">Complete quests to unlock new recipes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      {/* Recipe details and crafting */}
      {selectedRecipe && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recipe details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recipe Details</h3>
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div>
                  <div className="font-medium text-gray-800">{selectedRecipe.name}</div>
                  <div className="text-sm text-gray-600">{selectedRecipe.description}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Level Required:</span>
                    <span className="ml-2 font-medium">{selectedRecipe.requiredLevel}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Gold Cost:</span>
                    <span className="ml-2 font-medium">{selectedRecipe.gold}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Experience:</span>
                    <span className="ml-2 font-medium">{selectedRecipe.experienceGained} XP</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="ml-2 font-medium">
                      {CraftingSystem.calculateCraftingSuccess(selectedRecipe, selectedStation)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Crafting action */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Start Crafting</h3>
              <div className="bg-white rounded-lg p-4">
                {(() => {
                  const status = getRecipeStatus(selectedRecipe);
                  
                  if (status.canCraft) {
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Ready to craft!</span>
                        </div>
                        
                        <button
                          onClick={() => onStartCrafting?.(selectedRecipe, selectedStation)}
                          className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Hammer className="w-4 h-4" />
                          Start Crafting
                        </button>
                      </div>
                    );
                  } else {
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-medium">Missing requirements</span>
                        </div>
                        
                        <ul className="text-sm text-gray-600 space-y-1">
                          {status.missingRequirements.map((req, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <XCircle className="w-3 h-3 text-red-500" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}