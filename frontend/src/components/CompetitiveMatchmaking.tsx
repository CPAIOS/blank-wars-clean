'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WEIGHT_CLASSES, 
  DIFFICULTY_TIERS, 
  calculateTeamPower, 
  determineWeightClass,
  getAvailableWeightClasses,
  isPlayerEligibleForTier,
  generateOpponentProfile,
  type WeightClassName,
  type DifficultyTier,
  type CompetitionType,
  type MatchmakingCriteria,
  type OpponentProfile,
  type TeamPowerCalculation
} from '../data/competitiveMatchmaking';
import { TeamCharacter } from '../data/teamBattleSystem';
import { type Character } from '../data/characters';

interface CompetitiveMatchmakingProps {
  playerTeam: Character[];
  playerStats: {
    level: number;
    wins: number;
    rating: number;
    completedChallenges: string[];
  };
  onMatchFound: (opponent: OpponentProfile, criteria: MatchmakingCriteria) => void;
  onCancel: () => void;
}

export default function CompetitiveMatchmaking({
  playerTeam,
  playerStats,
  onMatchFound,
  onCancel
}: CompetitiveMatchmakingProps) {
  const [selectedWeightClass, setSelectedWeightClass] = useState<WeightClassName | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyTier>('amateur');
  const [competitionType, setCompetitionType] = useState<CompetitionType>('ranked');
  const [allowCrossTier, setAllowCrossTier] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [previewOpponent, setPreviewOpponent] = useState<OpponentProfile | null>(null);

  // Calculate team power and determine eligible classes
  const teamPowerCalculation: TeamPowerCalculation = useMemo(() => {
    return calculateTeamPower(playerTeam);
  }, [playerTeam]);

  const availableWeightClasses = useMemo(() => {
    return getAvailableWeightClasses(teamPowerCalculation.totalPower);
  }, [teamPowerCalculation.totalPower]);

  const eligibleTiers = useMemo(() => {
    return (Object.keys(DIFFICULTY_TIERS) as DifficultyTier[]).filter(tier =>
      isPlayerEligibleForTier(tier, playerStats)
    );
  }, [playerStats]);

  // Set default weight class to current class
  useEffect(() => {
    if (!selectedWeightClass) {
      setSelectedWeightClass(teamPowerCalculation.weightClass);
    }
  }, [teamPowerCalculation.weightClass, selectedWeightClass]);

  // Generate preview opponent when criteria change
  useEffect(() => {
    if (selectedWeightClass && !isSearching) {
      const criteria: MatchmakingCriteria = {
        weightClass: selectedWeightClass,
        difficultyTier: selectedDifficulty,
        competitionType,
        allowCrossTier,
        maxPowerDifference: 75,
        preferences: {
          fasterMatching: false,
          balancedTeams: true,
          newPlayerFriendly: selectedDifficulty === 'novice' || selectedDifficulty === 'amateur'
        }
      };
      
      const opponent = generateOpponentProfile(teamPowerCalculation.totalPower, criteria);
      setPreviewOpponent(opponent);
    }
  }, [selectedWeightClass, selectedDifficulty, competitionType, allowCrossTier, teamPowerCalculation.totalPower, isSearching]);

  // Search timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    } else {
      setSearchTime(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleStartSearch = () => {
    if (!selectedWeightClass || !previewOpponent) return;

    setIsSearching(true);
    
    // Simulate matchmaking time (in real implementation, this would be actual matchmaking)
    const searchDuration = DIFFICULTY_TIERS[selectedDifficulty].matchmakingRules.maxWaitTime;
    const mockSearchTime = Math.random() * Math.min(searchDuration, 15000) + 2000; // 2-15 seconds

    setTimeout(() => {
      const criteria: MatchmakingCriteria = {
        weightClass: selectedWeightClass,
        difficultyTier: selectedDifficulty,
        competitionType,
        allowCrossTier,
        maxPowerDifference: 75,
        preferences: {
          fasterMatching: false,
          balancedTeams: true,
          newPlayerFriendly: selectedDifficulty === 'novice' || selectedDifficulty === 'amateur'
        }
      };

      // Generate final opponent (might be different from preview)
      const finalOpponent = generateOpponentProfile(teamPowerCalculation.totalPower, criteria);
      onMatchFound(finalOpponent, criteria);
    }, mockSearchTime);
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
    setSearchTime(0);
  };

  const getPowerBarColor = (power: number, maxPower: number) => {
    const percentage = (power / maxPower) * 100;
    if (percentage < 30) return 'bg-green-500';
    if (percentage < 60) return 'bg-yellow-500';
    if (percentage < 85) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getDifficultyColor = (difficulty: DifficultyTier) => {
    const colors = {
      'novice': 'text-green-400 bg-green-900/30',
      'amateur': 'text-blue-400 bg-blue-900/30',
      'professional': 'text-yellow-400 bg-yellow-900/30',
      'elite': 'text-purple-400 bg-purple-900/30',
      'master': 'text-red-400 bg-red-900/30',
      'legendary': 'text-amber-400 bg-amber-900/30'
    };
    return colors[difficulty] || 'text-gray-400 bg-gray-900/30';
  };

  if (isSearching) {
    return (
      <motion.div 
        className="max-w-2xl mx-auto bg-slate-900/90 rounded-lg p-8 border border-slate-700"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center space-y-6">
          <div className="animate-spin w-16 h-16 mx-auto">
            ⚔️
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Finding Opponent...</h3>
            <p className="text-gray-300">
              Searching in {WEIGHT_CLASSES[selectedWeightClass!].name} - {DIFFICULTY_TIERS[selectedDifficulty].name}
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Search Time</span>
              <span>{Math.floor(searchTime / 60)}:{(searchTime % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${Math.min(100, (searchTime / 30) * 100)}%` 
                }}
              />
            </div>
          </div>

          <button
            onClick={handleCancelSearch}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Cancel Search
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="max-w-4xl mx-auto bg-slate-900/90 rounded-lg p-6 border border-slate-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Team Power & Weight Class Selection */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-xl font-bold text-white mb-4">Your Team Power</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Base Power:</span>
                <span className="text-white">{Math.round(teamPowerCalculation.basePower)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Formation Bonus:</span>
                <span className="text-green-400">+{Math.round(teamPowerCalculation.formationBonus)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Equipment Bonus:</span>
                <span className="text-blue-400">+{Math.round(teamPowerCalculation.equipmentBonus)}</span>
              </div>
              <div className="border-t border-slate-600 pt-2 flex justify-between font-bold">
                <span className="text-gray-200">Total Power:</span>
                <span className="text-yellow-400">{Math.round(teamPowerCalculation.totalPower)}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Current Weight Class</span>
                <span className="text-yellow-400 font-bold">
                  {WEIGHT_CLASSES[teamPowerCalculation.weightClass].name}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${getPowerBarColor(
                    teamPowerCalculation.totalPower, 
                    WEIGHT_CLASSES[teamPowerCalculation.weightClass].powerRange.max
                  )}`}
                  style={{ 
                    width: `${Math.min(100, (teamPowerCalculation.totalPower / WEIGHT_CLASSES[teamPowerCalculation.weightClass].powerRange.max) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-xl font-bold text-white mb-4">Select Weight Class</h3>
            <div className="space-y-2">
              {availableWeightClasses.map(className => {
                const classInfo = WEIGHT_CLASSES[className];
                const isSelected = selectedWeightClass === className;
                const isCurrent = className === teamPowerCalculation.weightClass;
                
                return (
                  <button
                    key={className}
                    onClick={() => setSelectedWeightClass(className)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-900/30' 
                        : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{classInfo.name}</span>
                          {isCurrent && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{classInfo.description}</p>
                        <p className="text-xs text-gray-500">
                          Power Range: {classInfo.powerRange.min} - {classInfo.powerRange.max}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-yellow-400">
                          {classInfo.rewards.experienceMultiplier}x XP
                        </div>
                        <div className="text-xs text-gray-400">
                          {classInfo.rewards.prestigePoints} prestige
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Difficulty & Match Preview */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-xl font-bold text-white mb-4">Difficulty Tier</h3>
            <div className="grid grid-cols-1 gap-2">
              {eligibleTiers.map(tier => {
                const tierInfo = DIFFICULTY_TIERS[tier];
                const isSelected = selectedDifficulty === tier;
                
                return (
                  <button
                    key={tier}
                    onClick={() => setSelectedDifficulty(tier)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-900/30' 
                        : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`font-bold px-2 py-1 rounded text-xs ${getDifficultyColor(tier)}`}>
                          {tierInfo.name.toUpperCase()}
                        </span>
                        <p className="text-sm text-gray-300 mt-1">{tierInfo.description}</p>
                        <p className="text-xs text-gray-500">
                          {tierInfo.battleModifiers.experienceBonus > 0 && 
                            `+${tierInfo.battleModifiers.experienceBonus}% XP`}
                          {tierInfo.battleModifiers.difficultyMultiplier !== 1.0 &&
                            ` • ${tierInfo.battleModifiers.difficultyMultiplier}x Difficulty`}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-xl font-bold text-white mb-4">Competition Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['ranked', 'casual'] as CompetitionType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setCompetitionType(type)}
                  className={`p-3 rounded-lg border capitalize transition-all ${
                    competitionType === type
                      ? 'border-blue-500 bg-blue-900/30 text-white'
                      : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="crossTier"
                checked={allowCrossTier}
                onChange={(e) => setAllowCrossTier(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="crossTier" className="text-sm text-gray-300">
                Allow cross-tier matching (faster queue)
              </label>
            </div>
          </div>

          {previewOpponent && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-4">Expected Opponent</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Team Power:</span>
                  <span className="text-white">{previewOpponent.teamPower}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Difficulty:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(previewOpponent.difficultyTier)}`}>
                    {previewOpponent.expectedMatchDifficulty.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reward Multiplier:</span>
                  <span className="text-yellow-400">{previewOpponent.rewardMultiplier.toFixed(1)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Rating:</span>
                  <span className="text-white">{previewOpponent.estimatedRating}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        
        <button
          onClick={handleStartSearch}
          disabled={!selectedWeightClass || !previewOpponent}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-bold"
        >
          Find Match
        </button>
      </div>
    </motion.div>
  );
}