'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  TrendingUp, 
  Coins, 
  Zap, 
  Heart,
  Crown,
  Sparkles,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { BattleRewards as RewardsData, ACHIEVEMENTS } from '@/data/combatRewards';

interface BattleRewardsProps {
  characterName: string;
  characterAvatar: string;
  isVictory: boolean;
  rewards: RewardsData;
  oldLevel: number;
  newLevel: number;
  oldXP: number;
  newXP: number;
  xpToNext: number;
  onContinue: () => void;
}

export default function BattleRewards({
  characterName,
  characterAvatar,
  isVictory,
  rewards,
  oldLevel,
  newLevel,
  oldXP,
  newXP,
  xpToNext,
  onContinue
}: BattleRewardsProps) {
  const [showRewards, setShowRewards] = useState(false);
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0);
  const [xpAnimationProgress, setXpAnimationProgress] = useState(0);

  const rewardItems = [
    {
      icon: Star,
      label: 'Experience',
      value: `+${rewards.xpGained} XP`,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      icon: Zap,
      label: 'Training Points',
      value: `+${rewards.trainingPoints} TP`,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10'
    },
    {
      icon: Coins,
      label: 'Gold',
      value: `+${rewards.currency}`,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      icon: Heart,
      label: 'Bond',
      value: `+${rewards.bondIncrease}`,
      color: 'text-pink-400',
      bgColor: 'bg-pink-400/10'
    },
    {
      icon: DollarSign,
      label: 'Character Earnings',
      value: `$${rewards.characterEarnings?.totalEarnings?.toLocaleString() || '0'}`,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    }
  ];

  // Add stat bonuses to rewards
  Object.entries(rewards.statBonuses).forEach(([stat, value]) => {
    if (value && value > 0) {
      rewardItems.push({
        icon: TrendingUp,
        label: stat.toUpperCase(),
        value: `+${value}`,
        color: 'text-green-400',
        bgColor: 'bg-green-400/10'
      });
    }
  });

  // Start reward animation sequence
  useEffect(() => {
    const timer = setTimeout(() => setShowRewards(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Animate rewards one by one
  useEffect(() => {
    if (showRewards && currentRewardIndex < rewardItems.length) {
      const timer = setTimeout(() => {
        setCurrentRewardIndex(prev => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showRewards, currentRewardIndex, rewardItems.length]);

  // Animate XP bar
  useEffect(() => {
    if (currentRewardIndex >= rewardItems.length) {
      const timer = setTimeout(() => {
        const startXP = oldXP;
        const endXP = newXP;
        const duration = 2000;
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const currentXP = startXP + (endXP - startXP) * progress;
          
          setXpAnimationProgress(currentXP);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentRewardIndex, rewardItems.length, oldXP, newXP]);

  const leveledUp = newLevel > oldLevel;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl border border-gray-700 max-w-md w-full p-6 text-center"
      >
        {/* Result Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <div className="text-6xl mb-3">
            {isVictory ? '🏆' : '⚔️'}
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${
            isVictory ? 'text-yellow-400' : 'text-blue-400'
          }`}>
            {isVictory ? 'Victory!' : 'Valiant Effort!'}
          </h2>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <span className="text-2xl">{characterAvatar}</span>
            <span className="text-xl">{characterName}</span>
          </div>
        </motion.div>

        {/* Achievement Banner */}
        {rewards.achievementUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-xl"
          >
            <div className="flex items-center justify-center gap-2 text-purple-300">
              <Crown className="w-5 h-5" />
              <span className="font-bold">Achievement Unlocked!</span>
            </div>
            <div className="text-white font-semibold mt-1">
              {ACHIEVEMENTS[rewards.achievementUnlocked as keyof typeof ACHIEVEMENTS]?.icon} {rewards.achievementUnlocked}
            </div>
            <div className="text-gray-400 text-sm mt-1">
              {ACHIEVEMENTS[rewards.achievementUnlocked as keyof typeof ACHIEVEMENTS]?.description}
            </div>
          </motion.div>
        )}

        {/* Rewards List */}
        <div className="space-y-3 mb-6">
          {rewardItems.map((reward, index) => (
            <AnimatePresence key={index}>
              {currentRewardIndex > index && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`flex items-center justify-between p-3 rounded-lg ${reward.bgColor} border border-gray-700`}
                >
                  <div className="flex items-center gap-3">
                    <reward.icon className={`w-5 h-5 ${reward.color}`} />
                    <span className="text-white font-medium">{reward.label}</span>
                  </div>
                  <motion.span 
                    className={`font-bold ${reward.color}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    {reward.value}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* XP Progress & Level Up */}
        {currentRewardIndex >= rewardItems.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {/* Level Display */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Level {oldLevel}</div>
                <div className="text-gray-400 text-sm">Previous</div>
              </div>
              
              {leveledUp && (
                <>
                  <ArrowRight className="w-6 h-6 text-yellow-400" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                      Level {newLevel}
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-yellow-300 text-sm">LEVEL UP!</div>
                  </motion.div>
                </>
              )}
              
              {!leveledUp && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">Level {newLevel}</div>
                  <div className="text-gray-400 text-sm">Current</div>
                </div>
              )}
            </div>

            {/* XP Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Experience</span>
                <span>{Math.floor(xpAnimationProgress)}/{xpToNext}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                  style={{ 
                    width: `${Math.min(100, (xpAnimationProgress / xpToNext) * 100)}%` 
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              
              {leveledUp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center text-yellow-400 text-sm mt-2 font-semibold"
                >
                  🎉 Congratulations! Your character grew stronger! 🎉
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Continue Button */}
        {xpAnimationProgress > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: leveledUp ? 2 : 1 }}
            onClick={onContinue}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105"
          >
            Continue
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}