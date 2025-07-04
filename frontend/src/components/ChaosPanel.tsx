'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, Gavel, Zap, Skull, Heart, Shield, Target } from 'lucide-react';
import { DeviationEvent, type PsychologyState } from '@/data/characterPsychology';
import { JudgeDecision, type JudgePersonality } from '@/data/aiJudgeSystem';

interface ChaosPanelProps {
  characterPsychology: Map<string, PsychologyState>;
  activeDeviations: DeviationEvent[];
  judgeDecisions: JudgeDecision[];
  currentJudge: JudgePersonality;
  isVisible: boolean;
}

const severityColors = {
  minor: 'from-yellow-500 to-yellow-600',
  moderate: 'from-orange-500 to-orange-600',
  major: 'from-red-500 to-red-600',
  extreme: 'from-purple-500 to-purple-600'
};

const severityIcons = {
  minor: AlertTriangle,
  moderate: Zap,
  major: Skull,
  extreme: Brain
};

const judgeStyleColors = {
  strict: 'from-gray-600 to-gray-700',
  lenient: 'from-blue-500 to-blue-600',
  chaotic: 'from-purple-500 to-pink-600',
  theatrical: 'from-yellow-500 to-orange-600',
  logical: 'from-green-500 to-green-600'
};

export default function ChaosPanel({
  characterPsychology,
  activeDeviations,
  judgeDecisions,
  currentJudge,
  isVisible
}: ChaosPanelProps) {
  if (!isVisible) return null;

  const recentDeviations = activeDeviations.slice(-3); // Show last 3 deviations
  const recentJudgeDecisions = judgeDecisions.slice(-2); // Show last 2 judge decisions

  // Calculate overall chaos level based on active deviations
  const chaosLevel = activeDeviations.length === 0 ? 'stable' :
                    activeDeviations.length <= 2 ? 'minor' :
                    activeDeviations.length <= 4 ? 'moderate' :
                    activeDeviations.length <= 6 ? 'major' : 'extreme';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700 min-w-80"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="text-purple-400" />
          <h3 className="text-lg font-bold text-white">AI Chaos Monitor</h3>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${
          chaosLevel === 'stable' ? 'from-green-500 to-green-600' :
          chaosLevel === 'minor' ? 'from-yellow-500 to-yellow-600' :
          chaosLevel === 'moderate' ? 'from-orange-500 to-orange-600' :
          chaosLevel === 'major' ? 'from-red-500 to-red-600' :
          'from-purple-500 to-purple-600'
        }`}>
          {chaosLevel.toUpperCase()}
        </div>
      </div>

      {/* Current Judge */}
      <div className={`bg-gradient-to-r ${judgeStyleColors[currentJudge.style]} p-3 rounded-lg mb-4`}>
        <div className="flex items-center gap-2 mb-1">
          <Gavel className="w-4 h-4 text-white" />
          <h4 className="text-white font-bold">{currentJudge.name}</h4>
        </div>
        <p className="text-white/90 text-sm">{currentJudge.description}</p>
        <div className="text-white/80 text-xs mt-1">
          Style: {currentJudge.style} • Strictness: {currentJudge.rulingTendencies.strictnessLevel}%
        </div>
      </div>

      {/* Character Mental States */}
      <div className="mb-4">
        <h4 className="text-white font-medium mb-2 flex items-center gap-1">
          <Brain className="w-4 h-4" />
          Mental States
        </h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {Array.from(characterPsychology.entries()).map(([characterId, psychState]) => {
            const stabilityColor = psychState.mentalStability > 70 ? 'text-green-400' :
                                  psychState.mentalStability > 40 ? 'text-yellow-400' : 'text-red-400';
            const riskLevel = psychState.mentalStability < 30 ? 'HIGH RISK' :
                             psychState.mentalStability < 50 ? 'MODERATE' : 'STABLE';
            
            return (
              <div key={characterId} className="bg-gray-800 p-2 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm font-medium">
                    {characterId.length > 10 ? characterId.substring(0, 10) + '...' : characterId}
                  </span>
                  <span className={`text-xs font-bold ${stabilityColor}`}>
                    {riskLevel}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Stability: {Math.round(psychState.mentalStability)}%</span>
                  <span>Stress: {Math.round(psychState.stress)}%</span>
                </div>
                {psychState.mentalStability < 50 && (
                  <div className="text-xs text-red-400 mt-1">
                    ⚠️ Deviation risk increasing!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Deviations */}
      {recentDeviations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-white font-medium mb-2 flex items-center gap-1">
            <Zap className="w-4 h-4 text-red-400" />
            Recent Chaos Events
          </h4>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {recentDeviations.map((deviation, index) => {
                const SeverityIcon = severityIcons[deviation.severity];
                return (
                  <motion.div
                    key={deviation.timestamp.toISOString()}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`bg-gradient-to-r ${severityColors[deviation.severity]} p-3 rounded-lg`}
                  >
                    <div className="flex items-start gap-2">
                      <SeverityIcon className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm">
                          {deviation.type.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-white/90 text-xs mt-1">
                          {deviation.description}
                        </div>
                        <div className="text-white/70 text-xs mt-1">
                          Effect: {deviation.gameplayEffect}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Recent Judge Decisions */}
      {recentJudgeDecisions.length > 0 && (
        <div>
          <h4 className="text-white font-medium mb-2 flex items-center gap-1">
            <Gavel className="w-4 h-4 text-blue-400" />
            Judge Rulings
          </h4>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {recentJudgeDecisions.map((decision, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-gray-800 p-3 rounded-lg border border-gray-600"
                >
                  <div className="text-blue-400 font-medium text-sm mb-1">
                    {currentJudge.name}'s Ruling:
                  </div>
                  <div className="text-white text-xs mb-2">
                    {decision.ruling}
                  </div>
                  <div className="text-gray-400 text-xs">
                    Mechanical Effect: {decision.mechanicalEffect.type}
                    {decision.mechanicalEffect.amount && ` (${decision.mechanicalEffect.amount})`}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* No Chaos State */}
      {activeDeviations.length === 0 && judgeDecisions.length === 0 && (
        <div className="text-center py-6">
          <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-green-400 font-medium">All fighters stable</p>
          <p className="text-gray-400 text-sm">No chaos events detected</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          <div className="mb-1">
            <strong>Risk Levels:</strong> Stable (70%+) • Moderate (40-70%) • High Risk (&lt;40%)
          </div>
          <div>
            <strong>Severity:</strong> Minor → Moderate → Major → Extreme
          </div>
        </div>
      </div>
    </motion.div>
  );
}