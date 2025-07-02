'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Target, Clock, Star, TrendingUp, Battery,
  Award, Crown, Zap, Activity, BarChart3
} from 'lucide-react';

export default function TrainingProgressComponent() {
  const [dailyProgress] = useState({
    trainingSessions: { current: 3, max: 5 },
    energyUsed: { current: 75, max: 100 },
    skillsLearned: { current: 2, max: 3 },
    xpGained: 1250,
    trainingPoints: 45
  });

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-400';
    if (percentage >= 60) return 'bg-yellow-400';
    if (percentage >= 40) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const progressItems = [
    {
      icon: Target,
      label: 'Training Sessions',
      current: dailyProgress.trainingSessions.current,
      max: dailyProgress.trainingSessions.max,
      percentage: (dailyProgress.trainingSessions.current / dailyProgress.trainingSessions.max) * 100
    },
    {
      icon: Battery,
      label: 'Energy Used',
      current: dailyProgress.energyUsed.current,
      max: dailyProgress.energyUsed.max,
      percentage: (dailyProgress.energyUsed.current / dailyProgress.energyUsed.max) * 100
    },
    {
      icon: Star,
      label: 'Skills Learned',
      current: dailyProgress.skillsLearned.current,
      max: dailyProgress.skillsLearned.max,
      percentage: (dailyProgress.skillsLearned.current / dailyProgress.skillsLearned.max) * 100
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Training Progress
          </h1>
          <p className="text-gray-300 text-lg">Track your daily training achievements and limits</p>
        </motion.div>

        {/* Daily Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {progressItems.map((item, index) => (
            <motion.div
              key={item.label}
              className="bg-gray-800/50 rounded-xl p-6 border border-green-500/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <item.icon className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold">{item.label}</h3>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold">{item.current}/{item.max}</span>
                  <span className="text-sm text-gray-400">{Math.round(item.percentage)}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(item.percentage)}`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* XP and Training Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-400/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold">Experience Gained Today</h3>
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {dailyProgress.xpGained.toLocaleString()} XP
            </div>
            <p className="text-gray-300">Keep training to level up your characters!</p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-400/50"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-bold">Training Points Earned</h3>
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {dailyProgress.trainingPoints}
            </div>
            <p className="text-gray-300">Use these to unlock new training activities!</p>
          </motion.div>
        </div>

        {/* Weekly Statistics */}
        <motion.div
          className="bg-gray-800/50 rounded-xl p-6 border border-gray-600/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-gray-400" />
            <h3 className="text-xl font-bold">Weekly Overview</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">21</div>
              <div className="text-sm text-gray-400">Sessions This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">8</div>
              <div className="text-sm text-gray-400">Skills Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">15,750</div>
              <div className="text-sm text-gray-400">Total XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">92%</div>
              <div className="text-sm text-gray-400">Goal Achievement</div>
            </div>
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          className="mt-8 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl p-6 border border-yellow-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-bold">Recent Achievements</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
              <Trophy className="w-5 h-5 text-gold" />
              <div>
                <div className="font-medium">Perfect Week</div>
                <div className="text-sm text-gray-400">7 days of training</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
              <Crown className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-medium">Skill Master</div>
                <div className="text-sm text-gray-400">Mastered 5 skills</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
              <Activity className="w-5 h-5 text-green-400" />
              <div>
                <div className="font-medium">Energy Efficient</div>
                <div className="text-sm text-gray-400">Optimal energy usage</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}