'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Package, 
  Sword, 
  ArrowRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import CharacterCardWithEquipment from './CharacterCardWithEquipment';
import EquipmentInventory from './EquipmentInventory';
import { 
  initializeCharacterWithStartingEquipment,
  createDemoCharacterRoster 
} from '@/data/characterInitialization';
import { allEquipment, getCharacterSpecificWeapons } from '@/data/equipment';
import { equipItem } from '@/data/characterEquipment';
import { Character } from '@/data/characters';

export default function EquipmentShowcaseDemo() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [demoCharacters, setDemoCharacters] = useState(() => createDemoCharacterRoster());
  const [showInventory, setShowInventory] = useState(false);

  // Initialize first character as selected
  React.useEffect(() => {
    if (demoCharacters.length > 0 && !selectedCharacter) {
      setSelectedCharacter(demoCharacters[0]);
    }
  }, [demoCharacters, selectedCharacter]);

  const handleEquipItem = (equipment: any) => {
    if (!selectedCharacter) return;
    
    try {
      const updatedCharacter = equipItem(selectedCharacter, equipment);
      
      // Update the character in the roster
      setDemoCharacters(prev => 
        prev.map(char => 
          char.id === updatedCharacter.id ? updatedCharacter : char
        )
      );
      
      // Update selected character
      setSelectedCharacter(updatedCharacter);
      
      // Close inventory
      setShowInventory(false);
    } catch (error) {
      console.error('Failed to equip item:', error);
    }
  };

  const refreshDemo = () => {
    const newRoster = createDemoCharacterRoster();
    setDemoCharacters(newRoster);
    setSelectedCharacter(newRoster[0]);
  };

  const getAvailableEquipment = () => {
    if (!selectedCharacter) return allEquipment;
    
    // Get character-specific weapons plus some general equipment
    const characterWeapons = getCharacterSpecificWeapons(selectedCharacter.id);
    const generalEquipment = allEquipment.filter(item => 
      !item.preferredCharacter || item.preferredCharacter === selectedCharacter.id
    );
    
    return [...characterWeapons, ...generalEquipment.slice(0, 20)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Equipment System Showcase
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Interactive demo of character equipment integration with visual displays
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={refreshDemo}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Demo
            </button>
            <button
              onClick={() => setShowInventory(!showInventory)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Package className="w-4 h-4" />
              {showInventory ? 'Hide' : 'Show'} Equipment
            </button>
          </div>
        </motion.div>

        {/* Demo roster */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Demo Character Roster</h2>
              <span className="text-sm text-gray-500">Click to select</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {demoCharacters.map((character) => (
                <CharacterCardWithEquipment
                  key={character.id}
                  character={character}
                  size="small"
                  showEquipment={true}
                  showStats={false}
                  isSelected={selectedCharacter?.id === character.id}
                  onClick={() => setSelectedCharacter(character)}
                  onEquipmentClick={() => setShowInventory(true)}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Selected character detail */}
        {selectedCharacter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Eye className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-800">Character Details</h2>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-blue-600 font-medium">{selectedCharacter.name}</span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Character card */}
                <div className="flex justify-center">
                  <CharacterCardWithEquipment
                    character={selectedCharacter}
                    size="large"
                    showEquipment={true}
                    showStats={true}
                    showProgression={true}
                    onEquipmentClick={() => setShowInventory(true)}
                  />
                </div>
                
                {/* Character info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Character Info</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedCharacter.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Title:</span>
                        <span className="font-medium">{selectedCharacter.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Era:</span>
                        <span className="font-medium">{selectedCharacter.historicalPeriod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Archetype:</span>
                        <span className="font-medium capitalize">{selectedCharacter.archetype}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Level:</span>
                        <span className="font-medium">{selectedCharacter.level}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Equipped Items</h3>
                    <div className="space-y-3">
                      {/* Weapon */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Sword className="w-5 h-5 text-red-500" />
                        <div className="flex-1">
                          <div className="font-medium">
                            {selectedCharacter.equippedItems.weapon?.name || 'No weapon equipped'}
                          </div>
                          {selectedCharacter.equippedItems.weapon && (
                            <div className="text-sm text-gray-600">
                              {selectedCharacter.equippedItems.weapon.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setShowInventory(true)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Change
                        </button>
                      </div>

                      {/* Armor */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-5 h-5 text-blue-500 flex items-center justify-center">🛡️</div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {selectedCharacter.equippedItems.armor?.name || 'No armor equipped'}
                          </div>
                          {selectedCharacter.equippedItems.armor && (
                            <div className="text-sm text-gray-600">
                              {selectedCharacter.equippedItems.armor.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setShowInventory(true)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Change
                        </button>
                      </div>

                      {/* Accessory */}
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-5 h-5 text-yellow-500 flex items-center justify-center">👑</div>
                        <div className="flex-1">
                          <div className="font-medium">
                            {selectedCharacter.equippedItems.accessory?.name || 'No accessory equipped'}
                          </div>
                          {selectedCharacter.equippedItems.accessory && (
                            <div className="text-sm text-gray-600">
                              {selectedCharacter.equippedItems.accessory.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setShowInventory(true)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Equipment inventory */}
        {showInventory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <EquipmentInventory
              equipment={getAvailableEquipment()}
              character={selectedCharacter || undefined}
              onEquip={handleEquipItem}
              showCharacterFilter={true}
              title={`Equipment for ${selectedCharacter?.name || 'Character'}`}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}