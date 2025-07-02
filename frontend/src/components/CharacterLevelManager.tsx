'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp,
  Star,
  Zap,
  Award,
  Gift,
  Plus,
  ArrowUp,
  Sparkles,
  Target,
  BarChart,
  Shield,
  Sword,
  Heart,
  Brain,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';
import {
  CharacterExperience,
  ExperienceGain,
  LevelReward,
  addExperience,
  calculateBattleXP,
  calculateTrainingXP,
  levelRequirements,
  ExperienceBonus,
  calculateTotalExperienceMultiplier
} from '@/data/experience';

interface CharacterLevelManagerProps {
  character: {
    id: string;
    name: string;
    avatar: string;
    archetype: string;
  };
  experience: CharacterExperience;
  activeBonuses?: ExperienceBonus[];
  onLevelUp?: (newLevel: number, rewards: LevelReward[]) => void;
  onStatPointsAllocate?: (stats: Record<string, number>) => void;
  isCompact?: boolean;
}

export default function CharacterLevelManager({
  character,
  experience: initialExperience,
  activeBonuses = [],
  onLevelUp,
  onStatPointsAllocate,
  isCompact = false
}: CharacterLevelManagerProps) {
  const [experience, setExperience] = useState(initialExperience);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpRewards, setLevelUpRewards] = useState<LevelReward[]>([]);
  const [showStatAllocation, setShowStatAllocation] = useState(false);
  const [statAllocation, setStatAllocation] = useState({
    atk: 0,
    def: 0,
    spd: 0,
    hp: 0,
    energy: 0
  });
  const [recentGains, setRecentGains] = useState<ExperienceGain[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Calculate progress percentage
  const progressPercentage = (experience.currentXP / experience.xpToNextLevel) * 100;

  // Calculate total XP multiplier
  const totalMultiplier = calculateTotalExperienceMultiplier(activeBonuses);

  // Add experience with animation
  const addExperienceGain = (gain: ExperienceGain) => {
    // Apply active bonuses
    const modifiedGain = {
      ...gain,
      amount: Math.floor(gain.amount * totalMultiplier),
      bonuses: [
        ...gain.bonuses,
        ...activeBonuses.map(bonus => ({
          type: bonus.id,
          multiplier: bonus.multiplier,
          description: bonus.name
        }))
      ]
    };

    const result = addExperience(experience, modifiedGain);
    setExperience(result.updatedCharacter);
    
    // Track recent gains for display
    setRecentGains(prev => [modifiedGain, ...prev.slice(0, 4)]);

    if (result.leveledUp && result.newLevel && result.rewards) {
      setLevelUpRewards(result.rewards);
      setShowLevelUp(true);
      onLevelUp?.(result.newLevel, result.rewards);
      
      // Check if we have stat points to allocate
      if (result.updatedCharacter.statPoints > 0) {
        setTimeout(() => setShowStatAllocation(true), 2000);
      }
    }
  };

  // Simulate gaining XP (for demo)
  const simulateBattleWin = () => {
    const xpGain = calculateBattleXP(
      experience.currentLevel,
      experience.currentLevel + Math.floor(Math.random() * 5) - 2,
      true,
      Math.floor(Math.random() * 180) + 60
    );
    addExperienceGain(xpGain);
  };

  const simulateTraining = () => {
    const xpGain = calculateTrainingXP(
      'strength_training',
      10,
      Math.floor(Math.random() * 4) + 1
    );
    addExperienceGain(xpGain);
  };

  // Allocate stat points
  const allocateStat = (stat: keyof typeof statAllocation, amount: number) => {
    const totalAllocated = Object.values(statAllocation).reduce((sum, val) => sum + val, 0);
    const remaining = experience.statPoints - totalAllocated;
    
    if (amount > 0 && remaining <= 0) return;
    if (amount < 0 && statAllocation[stat] <= 0) return;

    setStatAllocation(prev => ({
      ...prev,
      [stat]: Math.max(0, prev[stat] + amount)
    }));
  };

  const confirmStatAllocation = () => {
    onStatPointsAllocate?.(statAllocation);
    setExperience(prev => ({
      ...prev,
      statPoints: prev.statPoints - Object.values(statAllocation).reduce((sum, val) => sum + val, 0)
    }));
    setStatAllocation({ atk: 0, def: 0, spd: 0, hp: 0, energy: 0 });
    setShowStatAllocation(false);
  };

  const getStatIcon = (stat: string) => {
    const icons = {
      atk: <Sword className="w-4 h-4" />,
      def: <Shield className="w-4 h-4" />,
      spd: <Zap className="w-4 h-4" />,
      hp: <Heart className="w-4 h-4" />,
      energy: <Brain className="w-4 h-4" />
    };
    return icons[stat as keyof typeof icons] || <Star className="w-4 h-4" />;
  };

  const getStatColor = (stat: string) => {
    const colors = {
      atk: 'text-red-400',
      def: 'text-blue-400',
      spd: 'text-yellow-400',
      hp: 'text-green-400',
      energy: 'text-purple-400'
    };
    return colors[stat as keyof typeof colors] || 'text-gray-400';
  };

  // Compact view
  if (isCompact) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{character.avatar}</span>
            <div>
              <div className="font-semibold text-white">{character.name}</div>
              <div className="text-xs text-gray-400">Level {experience.currentLevel}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-yellow-400 font-bold">
              {experience.currentXP}/{experience.xpToNextLevel} XP
            </div>
            {experience.statPoints > 0 && (
              <div className="text-xs text-green-400">
                {experience.statPoints} points available!
              </div>
            )}
          </div>
        </div>
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Character Level Card */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{character.avatar}</div>
            <div>
              <h2 className="text-2xl font-bold text-white">{character.name}</h2>
              <p className="text-gray-400 capitalize">{character.archetype}</p>
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-xl font-bold text-white">Level {experience.currentLevel}</span>
                {experience.currentLevel === 50 && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">MAX</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-400 mb-1">
              {experience.totalXP.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total XP Earned</div>
            {totalMultiplier > 1 && (
              <div className="text-sm text-green-400 mt-1">
                {Math.round((totalMultiplier - 1) * 100)}% XP Boost Active
              </div>
            )}
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progress to Level {Math.min(experience.currentLevel + 1, 50)}</span>
            <span className="text-sm text-white font-semibold">
              {experience.currentXP.toLocaleString()} / {experience.xpToNextLevel.toLocaleString()} XP
            </span>
          </div>
          <div className="relative h-6 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={simulateBattleWin}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Sword className="w-4 h-4" />
            Battle Win (+XP)
          </button>
          
          <button
            onClick={simulateTraining}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Target className="w-4 h-4" />
            Training (+XP)
          </button>
          
          {experience.statPoints > 0 && (
            <button
              onClick={() => setShowStatAllocation(true)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Allocate Points ({experience.statPoints})
            </button>
          )}
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Info className="w-4 h-4" />
            Details
          </button>
        </div>
      </div>

      {/* Active Bonuses */}
      {activeBonuses.length > 0 && (
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Active XP Bonuses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeBonuses.map((bonus) => (
              <div key={bonus.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <div className="flex-1">
                  <div className="font-semibold text-white">{bonus.name}</div>
                  <div className="text-sm text-gray-400">{bonus.description}</div>
                </div>
                <div className="text-green-400 font-bold">
                  +{Math.round((bonus.multiplier - 1) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent XP Gains */}
      {recentGains.length > 0 && (
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Recent XP Gains
          </h3>
          <div className="space-y-2">
            {recentGains.map((gain, index) => (
              <motion.div
                key={gain.timestamp.toISOString()}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-green-400">
                    {gain.source === 'battle' && <Sword className="w-4 h-4" />}
                    {gain.source === 'training' && <Target className="w-4 h-4" />}
                    {gain.source === 'quest' && <Award className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-white capitalize">{gain.source}</div>
                    {gain.bonuses.length > 0 && (
                      <div className="text-xs text-gray-400">
                        {gain.bonuses.map(b => b.description).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-green-400 font-bold">+{gain.amount} XP</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Level Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900/50 rounded-xl border border-gray-700 p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-blue-400" />
              Level Progression Details
            </h3>
            
            <div className="space-y-4">
              {/* Current Level Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{experience.currentLevel}</div>
                  <div className="text-sm text-gray-400">Current Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{experience.statPoints}</div>
                  <div className="text-sm text-gray-400">Stat Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{experience.skillPoints}</div>
                  <div className="text-sm text-gray-400">Skill Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {experience.levelHistory.length - 1}
                  </div>
                  <div className="text-sm text-gray-400">Times Leveled</div>
                </div>
              </div>

              {/* Next Few Levels */}
              <div>
                <h4 className="text-white font-semibold mb-2">Upcoming Rewards</h4>
                <div className="space-y-2">
                  {levelRequirements
                    .filter(req => req.level > experience.currentLevel && req.level <= experience.currentLevel + 3)
                    .map((req) => (
                      <div key={req.level} className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white">Level {req.level}</span>
                          <span className="text-sm text-gray-400">
                            {req.xpRequired.toLocaleString()} XP needed
                          </span>
                        </div>
                        <div className="space-y-1">
                          {req.rewards.map((reward, index) => (
                            <div key={reward.id || `${reward.type}-${reward.description}-${index}`} className="text-sm text-gray-300 flex items-center gap-2">
                              <Gift className="w-3 h-3 text-yellow-400" />
                              {reward.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowLevelUp(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-gray-900 border-2 border-yellow-400 rounded-xl p-8 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, times: [0, 0.7, 1] }}
                  className="inline-block mb-4"
                >
                  <ArrowUp className="w-16 h-16 text-yellow-400" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">Level Up!</h2>
                <p className="text-xl text-yellow-400">
                  You reached Level {experience.currentLevel}!
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {levelUpRewards.map((reward, index) => (
                  <motion.div
                    key={reward.id || `levelup-${reward.type}-${reward.description}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3"
                  >
                    <Gift className="w-5 h-5 text-yellow-400" />
                    <span className="text-white">{reward.description}</span>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => setShowLevelUp(false)}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-bold transition-colors"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat Allocation Modal */}
      <AnimatePresence>
        {showStatAllocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowStatAllocation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-6 h-6 text-yellow-400" />
                Allocate Stat Points
              </h3>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Available Points:</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    {experience.statPoints - Object.values(statAllocation).reduce((sum, val) => sum + val, 0)}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {Object.entries(statAllocation).map(([stat, value]) => (
                  <div key={stat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatIcon(stat)}
                      <span className={`font-semibold ${getStatColor(stat)}`}>
                        {stat.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => allocateStat(stat as keyof typeof statAllocation, -1)}
                        disabled={value === 0}
                        className="w-8 h-8 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded flex items-center justify-center transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-white">{value}</span>
                      <button
                        onClick={() => allocateStat(stat as keyof typeof statAllocation, 1)}
                        disabled={experience.statPoints - Object.values(statAllocation).reduce((sum, val) => sum + val, 0) === 0}
                        className="w-8 h-8 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded flex items-center justify-center transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStatAllocation({ atk: 0, def: 0, spd: 0, hp: 0, energy: 0 });
                    setShowStatAllocation(false);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatAllocation}
                  disabled={Object.values(statAllocation).reduce((sum, val) => sum + val, 0) === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}