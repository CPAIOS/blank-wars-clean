'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioService } from '@/services/audioService';
import { 
  TrendingUp, 
  Award, 
  Crown,
  Gift,
  Trophy,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';
import { 
  levelProgressionData, 
  progressionTiers, 
  getLevelData, 
  getNextMilestone, 
  getTierProgress,
  getBaseStatsForLevel,
} from '@/data/characterProgression';

interface CharacterProgressionProps {
  characterName: string;
  characterAvatar: string;
  archetype: string;
  currentLevel: number;
  currentXP: number;
  totalXP?: number;
  onLevelUp?: (newLevel: number, rewards: unknown) => void;
}

export default function CharacterProgression({
  characterName,
  characterAvatar,
  archetype,
  currentLevel,
  currentXP,
  totalXP = 0,
  onLevelUp
}: CharacterProgressionProps) {
  const [selectedLevel, setSelectedLevel] = useState(currentLevel);
  const [showLevelDetails, setShowLevelDetails] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'stats' | 'milestones' | 'tiers' | null>(null);

  const currentLevelData = getLevelData(currentLevel);
  const selectedLevelData = getLevelData(selectedLevel);
  const nextMilestone = getNextMilestone(currentLevel);
  const tierProgress = getTierProgress(currentLevel);
  const currentStats = getBaseStatsForLevel(currentLevel, archetype);

  const xpProgress = currentLevelData ? (currentXP / currentLevelData.xpToNext) * 100 : 0;

  const getTierColor = (tier: string) => {
    const colors = {
      novice: 'from-gray-500 to-gray-600',
      apprentice: 'from-green-500 to-green-600',
      adept: 'from-blue-500 to-blue-600',
      expert: 'from-purple-500 to-purple-600',
      master: 'from-yellow-500 to-orange-600',
      legend: 'from-pink-500 via-purple-500 to-blue-500'
    };
    return colors[tier as keyof typeof colors] || colors.novice;
  };

  const getTierTextColor = (tier: string) => {
    const colors = {
      novice: 'text-gray-300',
      apprentice: 'text-green-300',
      adept: 'text-blue-300',
      expert: 'text-purple-300',
      master: 'text-yellow-300',
      legend: 'text-pink-300'
    };
    return colors[tier as keyof typeof colors] || colors.novice;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          Character Progression
        </h1>
        <p className="text-gray-400 text-lg">
          Track your journey from novice to legend
        </p>
      </div>

      {/* Character Overview */}
      <motion.div 
        className="bg-gray-900/50 rounded-xl border border-gray-700 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-6 mb-6">
          <div className="text-6xl">{characterAvatar}</div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white">{characterName}</h2>
            <p className="text-gray-400 capitalize mb-2">{archetype} • {currentLevelData?.title}</p>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(tierProgress.currentTier.tier)} text-white font-semibold`}>
              <span className="text-xl">{tierProgress.currentTier.icon}</span>
              <span>{tierProgress.currentTier.name}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white">Level {currentLevel}</div>
            <div className="text-gray-400">Total XP: {totalXP.toLocaleString()}</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Experience Progress</span>
            <span>{currentXP.toLocaleString()} / {currentLevelData?.xpToNext.toLocaleString()} XP</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="text-center text-sm text-gray-400 mt-1">
            {currentLevel < 50 ? `${(100 - xpProgress).toFixed(1)}% to next level` : 'Maximum Level Reached!'}
          </div>
        </div>

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-yellow-400" />
              <div>
                <h4 className="text-yellow-400 font-semibold">Next Milestone: Level {nextMilestone.level}</h4>
                <p className="text-gray-300 text-sm">{nextMilestone.reward.description}</p>
              </div>
              <div className="ml-auto text-2xl">{nextMilestone.reward.icon}</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Expandable Sections */}
      <div className="grid gap-4">
        {/* Current Stats */}
        <motion.div 
          className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => {
              audioService.playSoundEffect('button_click');
              setExpandedSection(expandedSection === 'stats' ? null : 'stats');
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Current Stats & Scaling</h3>
            </div>
            {expandedSection === 'stats' ? 
              <ChevronUp className="w-5 h-5 text-gray-400" /> : 
              <ChevronDown className="w-5 h-5 text-gray-400" />
            }
          </button>

          <AnimatePresence>
            {expandedSection === 'stats' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-700"
              >
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-red-500/10 p-4 rounded-lg text-center">
                      <div className="text-2xl text-red-400 mb-1">❤️</div>
                      <div className="text-2xl font-bold text-white">{currentStats.hp}</div>
                      <div className="text-red-400 text-sm">Health Points</div>
                    </div>
                    <div className="bg-orange-500/10 p-4 rounded-lg text-center">
                      <div className="text-2xl text-orange-400 mb-1">⚔️</div>
                      <div className="text-2xl font-bold text-white">{currentStats.atk}</div>
                      <div className="text-orange-400 text-sm">Attack Power</div>
                    </div>
                    <div className="bg-blue-500/10 p-4 rounded-lg text-center">
                      <div className="text-2xl text-blue-400 mb-1">🛡️</div>
                      <div className="text-2xl font-bold text-white">{currentStats.def}</div>
                      <div className="text-blue-400 text-sm">Defense</div>
                    </div>
                    <div className="bg-green-500/10 p-4 rounded-lg text-center">
                      <div className="text-2xl text-green-400 mb-1">⚡</div>
                      <div className="text-2xl font-bold text-white">{currentStats.spd}</div>
                      <div className="text-green-400 text-sm">Speed</div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      Stat Scaling Information
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Stats increase by 5% per level. {archetype.charAt(0).toUpperCase() + archetype.slice(1)} archetype 
                      gets bonus scaling in their primary attributes and access to specialized training.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tier Progression */}
        <motion.div 
          className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => {
              audioService.playSoundEffect('button_click');
              setExpandedSection(expandedSection === 'tiers' ? null : 'tiers');
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Progression Tiers</h3>
            </div>
            {expandedSection === 'tiers' ? 
              <ChevronUp className="w-5 h-5 text-gray-400" /> : 
              <ChevronDown className="w-5 h-5 text-gray-400" />
            }
          </button>

          <AnimatePresence>
            {expandedSection === 'tiers' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-700"
              >
                <div className="p-6">
                  {/* Current Tier Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold">Current Tier Progress</h4>
                      <span className="text-gray-400 text-sm">
                        Level {tierProgress.currentTier.levelRange[0]} - {tierProgress.currentTier.levelRange[1]}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${getTierColor(tierProgress.currentTier.tier)}`}
                        style={{ width: `${tierProgress.progress * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`font-semibold ${getTierTextColor(tierProgress.currentTier.tier)}`}>
                        {tierProgress.currentTier.icon} {tierProgress.currentTier.name}
                      </span>
                      {tierProgress.nextTier && (
                        <span className="text-gray-400 text-sm">
                          Next: {tierProgress.nextTier.icon} {tierProgress.nextTier.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* All Tiers */}
                  <div className="grid gap-3">
                    {Object.values(progressionTiers).map((tier) => {
                      const isCurrentTier = tier.tier === tierProgress.currentTier.tier;
                      const isUnlocked = currentLevel >= tier.levelRange[0];
                      
                      return (
                        <div 
                          key={tier.tier}
                          className={`p-4 rounded-lg border transition-all ${
                            isCurrentTier 
                              ? `bg-gradient-to-r ${getTierColor(tier.tier)}/20 border-current` 
                              : isUnlocked
                                ? 'bg-gray-800/50 border-gray-600'
                                : 'bg-gray-800/20 border-gray-700 opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{tier.icon}</span>
                            <div>
                              <h5 className={`font-bold ${isCurrentTier ? getTierTextColor(tier.tier) : 'text-white'}`}>
                                {tier.name}
                              </h5>
                              <p className="text-gray-400 text-sm">
                                Levels {tier.levelRange[0]}-{tier.levelRange[1]}
                              </p>
                            </div>
                            {isCurrentTier && (
                              <div className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                CURRENT
                              </div>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{tier.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {tier.benefits.map((benefit, index) => (
                              <span 
                                key={index}
                                className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                              >
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Milestone Rewards */}
        <motion.div 
          className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => {
              audioService.playSoundEffect('button_click');
              setExpandedSection(expandedSection === 'milestones' ? null : 'milestones');
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Milestone Rewards</h3>
            </div>
            {expandedSection === 'milestones' ? 
              <ChevronUp className="w-5 h-5 text-gray-400" /> : 
              <ChevronDown className="w-5 h-5 text-gray-400" />
            }
          </button>

          <AnimatePresence>
            {expandedSection === 'milestones' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-700"
              >
                <div className="p-6">
                  <div className="grid gap-3">
                    {levelProgressionData
                      .filter(data => data.milestoneReward)
                      .map((data) => {
                        const isUnlocked = currentLevel >= data.level;
                        const isCurrent = currentLevel === data.level;
                        const reward = data.milestoneReward!;
                        
                        return (
                          <div 
                            key={data.level}
                            className={`p-4 rounded-lg border transition-all ${
                              isCurrent
                                ? 'bg-yellow-500/20 border-yellow-500'
                                : isUnlocked
                                  ? 'bg-green-500/10 border-green-500'
                                  : 'bg-gray-800/50 border-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-3xl">{reward.icon}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-bold text-white">Level {data.level}: {reward.name}</h5>
                                  {isUnlocked && (
                                    <div className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                      UNLOCKED
                                    </div>
                                  )}
                                </div>
                                <p className="text-gray-400 text-sm">{reward.description}</p>
                                {reward.value && (
                                  <p className="text-blue-400 text-sm mt-1">+{reward.value} {reward.type.replace('_', ' ')}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}