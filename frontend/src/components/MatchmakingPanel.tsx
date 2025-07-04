'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sword, Shield, Trophy, Star, AlertTriangle, Target } from 'lucide-react';
import { 
  findMatchmakingOpponents, 
  getTeamWeightClass,
  getWeightClassComparison,
  defaultMatchmakingPreferences,
  aggressiveMatchmakingPreferences,
  conservativeMatchmakingPreferences,
  type MatchmakingPreference,
  type MatchmakingResult,
  type WeightClass
} from '@/data/weightClassSystem';

interface MatchmakingPanelProps {
  playerTeamLevels: number[];
  onSelectOpponent: (result: MatchmakingResult) => void;
  isVisible: boolean;
}

const riskColors = {
  safe: 'from-green-500 to-green-600',
  moderate: 'from-blue-500 to-blue-600', 
  risky: 'from-yellow-500 to-yellow-600',
  extreme: 'from-red-500 to-red-600'
};

const riskIcons = {
  safe: Shield,
  moderate: Target,
  risky: AlertTriangle,
  extreme: Sword
};

export default function MatchmakingPanel({ 
  playerTeamLevels, 
  onSelectOpponent, 
  isVisible 
}: MatchmakingPanelProps) {
  const [selectedPreference, setSelectedPreference] = useState<'default' | 'aggressive' | 'conservative'>('default');
  
  const playerTeamData = useMemo(() => 
    getTeamWeightClass(playerTeamLevels), 
    [playerTeamLevels]
  );
  
  const preferences = useMemo(() => {
    switch (selectedPreference) {
      case 'aggressive': return aggressiveMatchmakingPreferences;
      case 'conservative': return conservativeMatchmakingPreferences;
      default: return defaultMatchmakingPreferences;
    }
  }, [selectedPreference]);
  
  const availableOpponents = useMemo(() => 
    findMatchmakingOpponents(playerTeamData.averageLevel, preferences),
    [playerTeamData.averageLevel, preferences]
  );

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-yellow-400" />
            PvP Matchmaking
          </h2>
          <p className="text-gray-300">
            Your Team: Level {playerTeamData.averageLevel} • {playerTeamData.weightClass.name}
          </p>
        </div>
        
        {/* Preference Selector */}
        <div className="flex gap-2">
          {['default', 'aggressive', 'conservative'].map((pref) => (
            <button
              key={pref}
              onClick={() => setSelectedPreference(pref as any)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPreference === pref
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {pref.charAt(0).toUpperCase() + pref.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Weight Class Info */}
      <div className={`bg-gradient-to-r ${playerTeamData.weightClass.color} p-4 rounded-lg mb-6`}>
        <h3 className="text-white font-bold text-lg">{playerTeamData.weightClass.name}</h3>
        <p className="text-white/90">{playerTeamData.weightClass.description}</p>
        <p className="text-white/80 text-sm mt-1">
          Levels {playerTeamData.weightClass.levelRange[0]}-{playerTeamData.weightClass.levelRange[1]}
        </p>
      </div>

      {/* Available Opponents */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-3">Available Opponents</h3>
        
        {availableOpponents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No opponents found with current preferences</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your matchmaking settings</p>
          </div>
        ) : (
          availableOpponents.map((result, index) => {
            const RiskIcon = riskIcons[result.riskLevel];
            
            return (
              <motion.div
                key={`${result.opponent.teamLevel}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => onSelectOpponent(result)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`bg-gradient-to-r ${result.opponent.weightClass.color} p-2 rounded-lg`}>
                        <Star className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold">
                          Level {result.opponent.teamLevel} Team
                        </h4>
                        <p className="text-gray-400 text-sm">
                          {result.opponent.weightClass.name}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-2">{result.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <RiskIcon className="w-4 h-4" />
                        <span className={`font-medium ${
                          result.riskLevel === 'safe' ? 'text-green-400' :
                          result.riskLevel === 'moderate' ? 'text-blue-400' :
                          result.riskLevel === 'risky' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {result.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="text-yellow-400">
                        <strong>{result.expectedXpMultiplier.toFixed(1)}x</strong> XP
                      </div>
                      
                      <div className="text-gray-400">
                        {getWeightClassComparison(playerTeamData.weightClass, result.opponent.weightClass)}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`bg-gradient-to-r ${riskColors[result.riskLevel]} p-3 rounded-lg ml-4`}>
                    <RiskIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Preference Explanations */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="text-white font-medium mb-3">Matchmaking Strategies:</h4>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-gray-800 p-3 rounded-lg">
            <h5 className="text-blue-400 font-medium">Default</h5>
            <p className="text-gray-400">Balanced matches ±10 levels</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <h5 className="text-red-400 font-medium">Aggressive</h5>
            <p className="text-gray-400">High-risk, high-reward only</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <h5 className="text-green-400 font-medium">Conservative</h5>
            <p className="text-gray-400">Safe matches within ±3 levels</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}