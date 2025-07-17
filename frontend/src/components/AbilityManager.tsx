'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Star,
  Crown,
  Target,
  Clock,
  Flame,
  Eye,
  TrendingUp,
  Battery,
  X,
  Lock,
  ArrowUp,
  Award,
  MessageCircle,
  Send,
  User
} from 'lucide-react';
import {
  Ability,
  AbilityType,
  AbilityProgress,
  getAbilitiesForCharacter,
  getAvailableAbilities,
  canUseAbility,
  getExperienceToNextRank
} from '@/data/abilities';

interface AbilityManagerProps {
  characterId?: string;
  characterName?: string;
  characterLevel?: number;
  characterStats?: { atk: number; def: number; spd: number; energy: number; maxEnergy: number; hp: number; maxHp: number };
  abilityProgress?: AbilityProgress[];
  cooldowns?: Record<string, number>;
  onUseAbility?: (ability: Ability) => void;
  onUpgradeAbility?: (abilityId: string) => void;
  context?: 'battle' | 'training' | 'overview';
}

export default function AbilityManager({
  characterId = 'achilles',
  characterName = 'Achilles',
  characterLevel = 1,
  characterStats = { atk: 100, def: 80, spd: 90, energy: 50, maxEnergy: 100, hp: 200, maxHp: 200 },
  abilityProgress = [],
  cooldowns = {},
  onUseAbility,
  onUpgradeAbility,
  context = 'overview'
}: AbilityManagerProps = {}) {
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [filterType, setFilterType] = useState<AbilityType | 'all'>('all');
  const [showLockedAbilities, setShowLockedAbilities] = useState(false);

  // Skill Development Chat State
  const [showSkillChat, setShowSkillChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    sender: 'coach' | 'character';
    message: string;
    timestamp: Date;
    characterName?: string;
  }>>([]);
  const [currentChatMessage, setCurrentChatMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Get all abilities for this character
  const characterAbilities = getAbilitiesForCharacter(characterId || 'achilles');
  const availableAbilities = getAvailableAbilities(characterId || 'achilles', characterLevel || 1);

  // Filter abilities
  const filteredAbilities = characterAbilities.filter(ability => {
    const typeMatch = filterType === 'all' || ability.type === filterType;
    const availabilityMatch = showLockedAbilities || availableAbilities.includes(ability);
    return typeMatch && availabilityMatch;
  });

  const getAbilityProgress = (abilityId: string): AbilityProgress => {
    const existing = abilityProgress.find(p => p.abilityId === abilityId);
    if (existing) return existing;

    return {
      abilityId,
      currentRank: 1,
      experience: 0,
      experienceToNext: getExperienceToNextRank(1)
    };
  };

  const getTypeIcon = (type: AbilityType) => {
    const icons = {
      active: <Zap className="w-5 h-5" />,
      passive: <Eye className="w-5 h-5" />,
      ultimate: <Crown className="w-5 h-5" />,
      combo: <Target className="w-5 h-5" />
    };
    return icons[type] || <Star className="w-5 h-5" />;
  };

  const getTypeColor = (type: AbilityType) => {
    const colors = {
      active: 'from-blue-500 to-cyan-500',
      passive: 'from-green-500 to-emerald-500',
      ultimate: 'from-purple-500 to-pink-500',
      combo: 'from-orange-500 to-red-500'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const isAbilityUsable = (ability: Ability): boolean => {
    return canUseAbility(ability, {
      energy: characterStats?.energy || 0,
      level: characterLevel || 1,
      hp: characterStats?.hp || 100,
      maxHp: characterStats?.maxHp || 100,
      cooldowns
    });
  };

  const isAbilityAvailable = (ability: Ability): boolean => {
    return availableAbilities.includes(ability);
  };

  const getCooldownText = (abilityId: string): string => {
    const remaining = cooldowns[abilityId] || 0;
    return remaining > 0 ? `${remaining} turns` : 'Ready';
  };

  const getRankBonusText = (ability: Ability, rank: number): string[] => {
    const rankBonus = ability.rankBonuses.find(r => r.rank === rank);
    return rankBonus ? rankBonus.improvements : [];
  };

  // Skill Development Chat Functions
  const sendSkillChatMessage = async () => {
    if (!currentChatMessage.trim() || isChatLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'coach' as const,
      message: currentChatMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentChatMessage('');
    setIsChatLoading(true);

    try {
      // Real API call to skills coaching service
      const token = localStorage.getItem('accessToken');
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

      const response = await fetch(`${BACKEND_URL}/coaching/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          characterId: characterName.toLowerCase().replace(' ', '_'), // Convert name to ID format
          userMessage: currentChatMessage,
          context: {
            level: characterLevel,
            currentSkills: availableAbilities.map(ability => ability.id),
            skillFocus: filterType,
            skillPoints: characterLevel || 0,
            bondLevel: 50,
            previousMessages: chatMessages.slice(-5).map(msg => ({
              role: msg.sender === 'coach' ? 'user' : 'assistant',
              content: msg.message
            }))
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const aiResponse = {
        id: Date.now() + 1,
        sender: 'character' as const,
        message: data.message,
        timestamp: new Date(),
        characterName: data.character || characterName
      };

      setChatMessages(prev => [...prev, aiResponse]);
      setIsChatLoading(false);
    } catch (error) {
      console.error('Skill chat error:', error);
      const errorResponse = {
        id: Date.now() + 1,
        sender: 'character' as const,
        message: 'I apologize, but I\'m having trouble responding right now. Please try again.',
        timestamp: new Date(),
        characterName: characterName
      };
      setChatMessages(prev => [...prev, errorResponse]);
      setIsChatLoading(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendSkillChatMessage();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Zap className="w-8 h-8 text-purple-400" />
          {characterName}&apos;s Abilities
        </h1>
        <p className="text-gray-400 text-lg">
          Master your character&apos;s unique powers and devastating abilities
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AbilityType | 'all')}
              className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="active">Active</option>
              <option value="passive">Passive</option>
              <option value="ultimate">Ultimate</option>
              <option value="combo">Combo</option>
            </select>
          </div>

          {/* Show Locked Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLockedAbilities}
              onChange={(e) => setShowLockedAbilities(e.target.checked)}
              className="rounded"
            />
            <span className="text-white">Show locked abilities</span>
          </label>

          {/* Character Stats Summary */}
          <div className="ml-auto flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Battery className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400">{characterStats?.energy || 0}/{characterStats?.maxEnergy || 100}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400">Level {characterLevel || 1}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Abilities Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAbilities.map((ability) => {
          const progress = getAbilityProgress(ability.id);
          const isAvailable = isAbilityAvailable(ability);
          const isUsable = isAbilityUsable(ability);
          const cooldownRemaining = cooldowns[ability.id] || 0;

          return (
            <motion.div
              key={ability.id}
              className={`border rounded-xl p-4 cursor-pointer transition-all ${
                !isAvailable
                  ? 'border-gray-700 bg-gray-800/30 opacity-60'
                  : isUsable && context === 'battle'
                    ? `border-purple-500 bg-gradient-to-r ${getTypeColor(ability.type)}/10 hover:scale-105`
                    : `border-gray-600 bg-gradient-to-r ${getTypeColor(ability.type)}/5 hover:border-purple-500`
              }`}
              whileHover={isAvailable ? { y: -2 } : {}}
              onClick={() => setSelectedAbility(ability)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${getTypeColor(ability.type)}`}>
                    <span className="text-2xl">{ability.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{ability.name}</h3>
                      {!isAvailable && <Lock className="w-4 h-4 text-red-400" />}
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(ability.type)}
                      <span className="text-sm text-gray-400 capitalize">{ability.type}</span>
                    </div>
                  </div>
                </div>

                {/* Rank */}
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-bold">
                      Rank {progress.currentRank}/{ability.maxRank}
                    </span>
                  </div>
                  {progress.currentRank < ability.maxRank && (
                    <div className="text-xs text-gray-400">
                      {progress.experience}/{progress.experienceToNext} XP
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-300 text-sm mb-3">{ability.description}</p>

              {/* Requirements & Costs */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1">
                  <Battery className="w-3 h-3 text-blue-400" />
                  <span className={(characterStats?.energy || 0) >= ability.cost.energy ? 'text-blue-400' : 'text-red-400'}>
                    {ability.cost.energy} Energy
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-yellow-400" />
                  <span className={cooldownRemaining === 0 ? 'text-green-400' : 'text-red-400'}>
                    {getCooldownText(ability.id)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-purple-400" />
                  <span className={(characterLevel || 1) >= ability.unlockLevel ? 'text-green-400' : 'text-red-400'}>
                    Level {ability.unlockLevel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400">
                    {ability.cost.cooldown}T CD
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {progress.currentRank < ability.maxRank && isAvailable && (
                <div className="mb-3">
                  <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getTypeColor(ability.type)} transition-all`}
                      style={{ width: `${(progress.experience / progress.experienceToNext) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {context === 'battle' && isAvailable && isUsable && onUseAbility && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUseAbility(ability);
                    }}
                    className={`flex-1 py-2 bg-gradient-to-r ${getTypeColor(ability.type)} text-white rounded-lg font-semibold transition-colors hover:opacity-90`}
                  >
                    Use Ability
                  </button>
                )}

                {context !== 'battle' && isAvailable && progress.currentRank < ability.maxRank && onUpgradeAbility && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpgradeAbility(ability.id);
                    }}
                    className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowUp className="w-4 h-4" />
                    Upgrade
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredAbilities.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Abilities Found</h3>
          <p className="text-gray-500">
            {showLockedAbilities
              ? "This character has no abilities of the selected type"
              : "Try showing locked abilities or changing the filter"}
          </p>
        </div>
      )}
        </div>

      </div>

      {/* Ability Detail Modal */}
      <AnimatePresence>
        {selectedAbility && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAbility(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">Ability Details</h3>
                <button
                  onClick={() => setSelectedAbility(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className={`p-4 rounded-lg bg-gradient-to-r ${getTypeColor(selectedAbility.type)}/20 border border-current mb-6`}>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{selectedAbility.icon}</span>
                  <div>
                    <h4 className="text-2xl font-bold text-white mb-1">{selectedAbility.name}</h4>
                    <div className="flex items-center gap-2 text-gray-300">
                      {getTypeIcon(selectedAbility.type)}
                      <span className="capitalize">{selectedAbility.type} Ability</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 mb-3">{selectedAbility.description}</p>
                <p className="text-sm text-gray-400 italic">&quot;{selectedAbility.flavor}&quot;</p>
              </div>

              {/* Current Rank & Progress */}
              {(() => {
                const progress = getAbilityProgress(selectedAbility.id);
                return (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-white font-semibold">Rank Progress</h5>
                      <span className="text-yellow-400 font-bold">
                        Rank {progress.currentRank}/{selectedAbility.maxRank}
                      </span>
                    </div>

                    {progress.currentRank < selectedAbility.maxRank && (
                      <div className="mb-2">
                        <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getTypeColor(selectedAbility.type)} transition-all`}
                            style={{ width: `${(progress.experience / progress.experienceToNext) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {progress.experience}/{progress.experienceToNext} XP to next rank
                        </div>
                      </div>
                    )}

                    {/* Next Rank Bonuses */}
                    {progress.currentRank < selectedAbility.maxRank && (
                      <div className="mt-3">
                        <h6 className="text-sm font-semibold text-gray-300 mb-1">
                          Rank {progress.currentRank + 1} Bonuses:
                        </h6>
                        <ul className="text-sm text-green-400 space-y-1">
                          {getRankBonusText(selectedAbility, progress.currentRank + 1).map((bonus, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <ArrowUp className="w-3 h-3" />
                              {bonus}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Effects */}
              <div className="mb-6">
                <h5 className="text-white font-semibold mb-3">Effects</h5>
                <div className="space-y-3">
                  {selectedAbility.effects.map((effect, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-purple-400 font-semibold capitalize">
                          {effect.type.replace('_', ' ')}
                        </span>
                        <span className="text-gray-400 capitalize">{effect.target.replace('_', ' ')}</span>
                      </div>
                      <div className="text-sm text-gray-300">
                        {effect.type === 'damage' && `${effect.value} ${effect.damageType} damage`}
                        {effect.type === 'heal' && `Restores ${effect.value} HP`}
                        {effect.type === 'stat_modifier' &&
                          `${effect.value > 0 ? '+' : ''}${effect.value}% ${effect.stat?.toUpperCase()} ${effect.duration ? `for ${effect.duration} turns` : ''}`}
                        {effect.type === 'status_effect' &&
                          `Applies ${effect.statusEffect} ${effect.duration ? `for ${effect.duration} turns` : ''}`}
                        {effect.type === 'special' && 'Special effect (see ability description)'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements & Costs */}
              <div className="mb-6">
                <h5 className="text-white font-semibold mb-3">Requirements & Costs</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 ${(characterLevel || 1) >= selectedAbility.unlockLevel ? 'text-green-400' : 'text-red-400'}`}>
                      <Star className="w-4 h-4" />
                      Level {selectedAbility.unlockLevel}
                    </div>
                    <div className={`flex items-center gap-2 ${(characterStats?.energy || 0) >= selectedAbility.cost.energy ? 'text-blue-400' : 'text-red-400'}`}>
                      <Battery className="w-4 h-4" />
                      {selectedAbility.cost.energy} Energy
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Clock className="w-4 h-4" />
                      {selectedAbility.cost.cooldown} turns cooldown
                    </div>
                    {selectedAbility.cost.requirements?.hp_threshold && (
                      <div className="flex items-center gap-2 text-red-400">
                        <Flame className="w-4 h-4" />
                        Below {selectedAbility.cost.requirements.hp_threshold}% HP
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {context === 'battle' && isAbilityAvailable(selectedAbility) && isAbilityUsable(selectedAbility) && onUseAbility && (
                  <button
                    onClick={() => {
                      onUseAbility(selectedAbility);
                      setSelectedAbility(null);
                    }}
                    className={`flex-1 py-3 bg-gradient-to-r ${getTypeColor(selectedAbility.type)} text-white rounded-lg font-semibold transition-colors hover:opacity-90`}
                  >
                    Use Ability
                  </button>
                )}

                <button
                  onClick={() => setSelectedAbility(null)}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
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
