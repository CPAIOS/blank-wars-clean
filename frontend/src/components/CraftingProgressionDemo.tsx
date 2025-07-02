'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Hammer, 
  TrendingUp, 
  Star, 
  Target,
  Users,
  Settings,
  Play,
  CheckCircle
} from 'lucide-react';
import { Character, getAllCharacters } from '@/data/characters';
import CraftingInterface from './CraftingInterface';
import EquipmentProgressionTracker from './EquipmentProgressionTracker';
import { PlayerCrafting } from '@/data/craftingSystem';

// Mock player crafting data
const mockPlayerCrafting: PlayerCrafting = {
  craftingLevel: 15,
  craftingExperience: 2500,
  unlockedRecipes: [
    'craft_iron_sword',
    'upgrade_achilles_spear',
    'craft_sword_cane',
    'upgrade_merlin_staff',
    'smelt_iron'
  ],
  ownedStations: ['basic_forge', 'master_forge'],
  activeCrafts: [
    {
      recipeId: 'upgrade_achilles_spear',
      startTime: new Date(Date.now() - 30 * 60000), // 30 minutes ago
      completionTime: new Date(Date.now() + 30 * 60000), // 30 minutes from now
      stationId: 'master_forge'
    }
  ],
  materials: [
    { materialId: 'iron_ore', quantity: 25 },
    { materialId: 'steel_ingot', quantity: 8 },
    { materialId: 'wood_plank', quantity: 15 },
    { materialId: 'leather_hide', quantity: 6 },
    { materialId: 'mana_crystal', quantity: 3 },
    { materialId: 'rune_stone', quantity: 2 },
    { materialId: 'bronze_ingot', quantity: 12 }
  ]
};

export default function CraftingProgressionDemo() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(getAllCharacters()[0]);
  const [activeTab, setActiveTab] = useState<'crafting' | 'progression'>('crafting');
  const [playerCrafting, setPlayerCrafting] = useState<PlayerCrafting>(mockPlayerCrafting);

  const handleStartCrafting = (recipe: any, stationId?: string) => {
    console.log('Starting crafting:', recipe.name, 'at station:', stationId);
    // In a real app, this would update the player's crafting state
  };

  const handleCompleteCrafting = (craftId: string) => {
    console.log('Completing craft:', craftId);
    // Remove from active crafts and add to inventory
    setPlayerCrafting(prev => ({
      ...prev,
      activeCrafts: prev.activeCrafts.filter(craft => craft.recipeId !== craftId)
    }));
  };

  const handleStartQuest = (questId: string) => {
    console.log('Starting quest:', questId);
  };

  const handleUpgradeEquipment = (equipmentId: string) => {
    console.log('Upgrading equipment:', equipmentId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Hammer className="w-8 h-8 text-orange-600" />
            Equipment Crafting & Progression Demo
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Complete crafting and progression system for {selectedCharacter.name}. 
            Forge equipment, track advancement, and unlock legendary gear through quests.
          </p>
        </motion.div>

        {/* Character selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Character
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {getAllCharacters().slice(0, 6).map(character => (
              <motion.button
                key={character.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCharacter(character)}
                className={`
                  p-3 rounded-lg border-2 transition-all text-center
                  ${selectedCharacter.id === character.id 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                <div className="text-2xl mb-1">{character.avatar}</div>
                <div className="text-sm font-medium">{character.name}</div>
                <div className="text-xs text-gray-500">{character.historicalPeriod}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('crafting')}
              className={`
                flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors
                ${activeTab === 'crafting' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white text-gray-600 hover:text-gray-800'
                }
              `}
            >
              <Hammer className="w-5 h-5" />
              Equipment Crafting
            </button>
            <button
              onClick={() => setActiveTab('progression')}
              className={`
                flex-1 flex items-center justify-center gap-2 py-4 px-6 font-medium transition-colors
                ${activeTab === 'progression' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-gray-600 hover:text-gray-800'
                }
              `}
            >
              <TrendingUp className="w-5 h-5" />
              Equipment Progression
            </button>
          </div>
        </div>

        {/* Current character stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Current Status: {selectedCharacter.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{selectedCharacter.level}</div>
              <div className="text-sm text-gray-600">Character Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{playerCrafting.craftingLevel}</div>
              <div className="text-sm text-gray-600">Crafting Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{playerCrafting.materials.length}</div>
              <div className="text-sm text-gray-600">Materials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{playerCrafting.activeCrafts.length}</div>
              <div className="text-sm text-gray-600">Active Crafts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'crafting' ? (
          <motion.div
            key="crafting"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <CraftingInterface
              character={selectedCharacter}
              playerCrafting={playerCrafting}
              onStartCrafting={handleStartCrafting}
              onCompleteCrafting={handleCompleteCrafting}
              availableStations={playerCrafting.ownedStations}
            />
          </motion.div>
        ) : (
          <motion.div
            key="progression"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <EquipmentProgressionTracker
              character={selectedCharacter}
              onStartQuest={handleStartQuest}
              onUpgradeEquipment={handleUpgradeEquipment}
            />
          </motion.div>
        )}
      </div>

      {/* Features summary */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            System Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Crafting System</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Character-specific recipes and materials</li>
                <li>• Multiple crafting stations with bonuses</li>
                <li>• Real-time crafting progress tracking</li>
                <li>• Success rates and experience rewards</li>
                <li>• Material requirement validation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Progression System</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Equipment unlock trees (basic → rare → legendary)</li>
                <li>• Quest-based progression requirements</li>
                <li>• Character-specific advancement paths</li>
                <li>• Smart recommendations engine</li>
                <li>• Progress tracking and statistics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}