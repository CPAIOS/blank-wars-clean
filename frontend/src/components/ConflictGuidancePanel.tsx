// ConflictGuidancePanel - provides strategic guidance for conflict engagement
// Integrates with GameBalanceSystem to help players make informed decisions

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, CheckCircle, Info, Target, TrendingUp, 
  Heart, Zap, Users, Clock, Star
} from 'lucide-react';
import GameBalanceSystem from '@/services/gameBalanceSystem';
import ConflictRewardSystem from '@/services/conflictRewardSystem';

interface ConflictOpportunity {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  charactersInvolved: string[];
  description: string;
  timeRemaining?: string;
}

interface ConflictGuidancePanelProps {
  characterId: string;
  availableConflicts: ConflictOpportunity[];
  onConflictSelect?: (conflictId: string, approach: string) => void;
}

export default function ConflictGuidancePanel({ 
  characterId, 
  availableConflicts = [], 
  onConflictSelect 
}: ConflictGuidancePanelProps) {
  const [gameBalance] = useState(() => GameBalanceSystem.getInstance());
  const [conflictReward] = useState(() => ConflictRewardSystem.getInstance());
  const [selectedConflict, setSelectedConflict] = useState<ConflictOpportunity | null>(null);
  const [guidanceData, setGuidanceData] = useState<any>(null);
  const [playerGuidance, setPlayerGuidance] = useState<any>(null);

  useEffect(() => {
    const loadPlayerGuidance = async () => {
      try {
        const guidance = gameBalance.generatePlayerGuidance(characterId);
        setPlayerGuidance(guidance);
      } catch (error) {
        console.error('Failed to load player guidance:', error);
      }
    };

    loadPlayerGuidance();
  }, [characterId, gameBalance]);

  const analyzeConflict = async (conflict: ConflictOpportunity) => {
    try {
      const analysis = gameBalance.analyzeConflictEngagementValue(
        characterId,
        conflict.type,
        conflict.severity
      );
      
      const optimalStrategy = gameBalance.getOptimalStrategy(
        conflict.type,
        conflict.charactersInvolved,
        {} // Current team dynamics would go here
      );

      setGuidanceData({ ...analysis, optimalStrategy });
      setSelectedConflict(conflict);
    } catch (error) {
      console.error('Failed to analyze conflict:', error);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'ENGAGE': return 'text-green-400 bg-green-900/20 border-green-500';
      case 'AVOID': return 'text-red-400 bg-red-900/20 border-red-500';
      case 'NEUTRAL': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'high': return <Zap className="w-4 h-4 text-orange-400" />;
      case 'medium': return <Info className="w-4 h-4 text-yellow-400" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Player Status Overview */}
      {playerGuidance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Strategic Guidance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-300 mb-1">Current Status</div>
              <div className="text-white font-medium">{playerGuidance.currentStatus}</div>
            </div>
            <div>
              <div className="text-sm text-gray-300 mb-1">Next Best Action</div>
              <div className="text-blue-300">{playerGuidance.nextBestAction}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm text-gray-300 mb-1">Long-term Strategy</div>
              <div className="text-purple-300">{playerGuidance.longtermStrategy}</div>
            </div>
          </div>
          
          {playerGuidance.warningFlags.length > 0 && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded">
              <div className="text-sm text-red-300 font-medium mb-2">⚠️ Warnings:</div>
              {playerGuidance.warningFlags.map((warning: string, index: number) => (
                <div key={index} className="text-sm text-red-200">• {warning}</div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Available Conflicts */}
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Available Conflicts
        </h3>
        
        {availableConflicts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <div>No active conflicts. All is peaceful... for now.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {availableConflicts.map((conflict, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 cursor-pointer"
                onClick={() => analyzeConflict(conflict)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(conflict.severity)}
                    <span className="font-medium text-white capitalize">
                      {conflict.type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-400">
                      ({conflict.severity})
                    </span>
                  </div>
                  {conflict.timeRemaining && (
                    <div className="flex items-center text-sm text-yellow-400">
                      <Clock className="w-4 h-4 mr-1" />
                      {conflict.timeRemaining}
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-300 mb-2">
                  {conflict.description}
                </div>
                
                <div className="flex items-center text-sm text-blue-300">
                  <Users className="w-4 h-4 mr-1" />
                  {conflict.charactersInvolved.length} characters involved
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Conflict Analysis */}
      {selectedConflict && guidanceData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Conflict Analysis: {selectedConflict.type.replace('_', ' ')}
          </h3>
          
          {/* Recommendation */}
          <div className={`inline-flex items-center px-4 py-2 rounded-lg border mb-4 ${getRecommendationColor(guidanceData.recommendation)}`}>
            <span className="font-bold mr-2">RECOMMENDATION:</span>
            <span>{guidanceData.recommendation}</span>
          </div>

          {/* Risk vs Reward */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="text-green-300 font-medium mb-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                Engagement Value
              </div>
              <div className="text-2xl font-bold text-green-400">
                {guidanceData.engagementValue}/100
              </div>
            </div>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="text-red-300 font-medium mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Avoidance Value
              </div>
              <div className="text-2xl font-bold text-red-400">
                {guidanceData.avoidanceValue}/100
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="mb-4">
            <div className="text-sm text-gray-300 mb-2">Strategic Reasoning:</div>
            <div className="space-y-1">
              {guidanceData.reasoning.map((reason: string, index: number) => (
                <div key={index} className="text-sm text-gray-200">
                  {reason}
                </div>
              ))}
            </div>
          </div>

          {/* Optimal Strategy */}
          {guidanceData.optimalStrategy && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="text-blue-300 font-medium mb-2">Optimal Approach:</div>
              <div className="text-blue-200 capitalize mb-2">
                {guidanceData.optimalStrategy.recommendedApproach.replace('_', ' ')}
              </div>
              <div className="text-sm text-blue-100">
                {guidanceData.optimalStrategy.expectedOutcome}
              </div>
            </div>
          )}

          {/* Potential Rewards Preview */}
          {guidanceData.potentialRewards && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-yellow-300 font-medium mb-2">Potential Rewards:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-yellow-200">
                  Experience: +{guidanceData.potentialRewards.experienceBonus}
                </div>
                <div className="text-yellow-200">
                  Immediate Rewards: {guidanceData.potentialRewards.immediate.length}
                </div>
                <div className="text-yellow-200">
                  Long-term Benefits: {guidanceData.potentialRewards.longTerm.length}
                </div>
                <div className="text-yellow-200">
                  Relationship Changes: {Object.keys(guidanceData.potentialRewards.relationshipChanges).length}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {onConflictSelect && (
            <div className="flex space-x-3 mt-6">
              {['aggressive', 'diplomatic', 'collaborative', 'avoidant'].map((approach) => (
                <button
                  key={approach}
                  onClick={() => onConflictSelect(selectedConflict.type, approach)}
                  className={`px-4 py-2 rounded transition-colors ${
                    approach === guidanceData.optimalStrategy?.recommendedApproach
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-gray-200'
                  }`}
                >
                  {approach.charAt(0).toUpperCase() + approach.slice(1)}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}