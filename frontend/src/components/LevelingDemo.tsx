'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Star, Zap, Users, ArrowLeft } from 'lucide-react';
import CharacterLevelManager from './CharacterLevelManager';
import {
  createCharacterExperience,
  experienceBonuses,
  ExperienceBonus
} from '@/data/experience';

export default function LevelingDemo() {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  // Demo characters
  const demoCharacters = [
    {
      id: 'achilles',
      name: 'Achilles',
      avatar: '⚔️',
      archetype: 'warrior',
      experience: {
        ...createCharacterExperience('achilles'),
        currentLevel: 15,
        currentXP: 450,
        totalXP: 12450,
        xpToNextLevel: 850,
        statPoints: 5,
        skillPoints: 2
      }
    },
    {
      id: 'merlin',
      name: 'Merlin',
      avatar: '🔮',
      archetype: 'mage',
      experience: {
        ...createCharacterExperience('merlin'),
        currentLevel: 22,
        currentXP: 234,
        totalXP: 28234,
        xpToNextLevel: 1200,
        statPoints: 8,
        skillPoints: 3
      }
    },
    {
      id: 'fenrir',
      name: 'Fenrir',
      avatar: '🐺',
      archetype: 'beast',
      experience: {
        ...createCharacterExperience('fenrir'),
        currentLevel: 8,
        currentXP: 123,
        totalXP: 4123,
        xpToNextLevel: 567,
        statPoints: 2,
        skillPoints: 0
      }
    },
    {
      id: 'loki',
      name: 'Loki',
      avatar: '🎭',
      archetype: 'trickster',
      experience: {
        ...createCharacterExperience('loki'),
        currentLevel: 35,
        currentXP: 1456,
        totalXP: 67456,
        xpToNextLevel: 2100,
        statPoints: 12,
        skillPoints: 7
      }
    }
  ];

  // Demo active bonuses
  const activeBonuses: ExperienceBonus[] = [
    {
      ...experienceBonuses.firstWinOfDay,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      ...experienceBonuses.guildBonus,
      expiresAt: undefined
    }
  ];

  const selectedCharacterData = selectedCharacter 
    ? demoCharacters.find(char => char.id === selectedCharacter)
    : null;

  if (selectedCharacter && selectedCharacterData) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedCharacter(null)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Character Selection
        </button>
        
        <CharacterLevelManager
          character={selectedCharacterData}
          experience={selectedCharacterData.experience}
          activeBonuses={activeBonuses}
          onLevelUp={(newLevel, rewards) => {
            console.log(`${selectedCharacterData.name} leveled up to ${newLevel}!`, rewards);
          }}
          onStatPointsAllocate={(stats) => {
            console.log(`${selectedCharacterData.name} allocated stats:`, stats);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <TrendingUp className="w-8 h-8 text-green-400" />
          Character Leveling System
        </h1>
        <p className="text-gray-400 text-lg">
          Experience the progression system that makes every battle meaningful
        </p>
      </div>

      {/* System Overview */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-400" />
          How Leveling Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">⚔️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Battle Experience</h3>
            <p className="text-gray-300 text-sm">
              Win battles to earn XP based on opponent difficulty and performance bonuses
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-lg font-semibold text-white mb-2">Progressive Rewards</h3>
            <p className="text-gray-300 text-sm">
              Level up to earn stat points, skill points, and unlock new abilities
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-2">Strategic Growth</h3>
            <p className="text-gray-300 text-sm">
              Customize your character&apos;s development with flexible stat allocation
            </p>
          </div>
        </div>
      </div>

      {/* Active Bonuses Info */}
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Active XP Bonuses
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🏆</div>
            <div>
              <div className="font-semibold text-white">First Win of the Day</div>
              <div className="text-sm text-gray-300">Double XP for your first victory (100% bonus)</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl">👥</div>
            <div>
              <div className="font-semibold text-white">Guild Experience Share</div>
              <div className="text-sm text-gray-300">Guild members get +25% XP from all sources</div>
            </div>
          </div>
        </div>
      </div>

      {/* Character Selection */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          Select a Character to Manage
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoCharacters.map((character) => (
            <motion.div
              key={character.id}
              className="border border-gray-600 rounded-xl p-4 cursor-pointer hover:border-blue-500 transition-all bg-gradient-to-br from-gray-800/50 to-gray-900/50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCharacter(character.id)}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{character.avatar}</div>
                <h3 className="text-lg font-bold text-white mb-1">{character.name}</h3>
                <p className="text-sm text-gray-400 capitalize mb-3">{character.archetype}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Level:</span>
                    <span className="text-yellow-400 font-bold">{character.experience.currentLevel}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total XP:</span>
                    <span className="text-blue-400 font-bold">{character.experience.totalXP.toLocaleString()}</span>
                  </div>
                  
                  <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ 
                        width: `${(character.experience.currentXP / character.experience.xpToNextLevel) * 100}%` 
                      }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {character.experience.currentXP}/{character.experience.xpToNextLevel} XP to next level
                  </div>
                  
                  {character.experience.statPoints > 0 && (
                    <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      {character.experience.statPoints} stat points available!
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Level Progression Preview */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Level Progression Rewards</h2>
        <div className="text-gray-300 space-y-2">
          <p>• <span className="text-green-400">Every Level:</span> 3-5 stat points to customize your character</p>
          <p>• <span className="text-blue-400">Every 2 Levels:</span> 1 skill point for abilities</p>
          <p>• <span className="text-yellow-400">Every 5 Levels:</span> Gem bonus (50-250 gems)</p>
          <p>• <span className="text-purple-400">Every 10 Levels:</span> New ability slot unlock</p>
          <p>• <span className="text-orange-400">Special Milestones:</span> Titles, equipment tiers, prestige mode</p>
        </div>
      </div>
    </div>
  );
}