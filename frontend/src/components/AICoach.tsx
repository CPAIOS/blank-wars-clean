'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Star,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Users,
  Shield,
  Sparkles,
  RefreshCw,
  Gem,
  Coins
} from 'lucide-react';
import {
  CoachingTip,
  CoachingSession,
  AICoach,
  createDemoCoachingSession
} from '@/data/aiCoaching';
import { Character } from '@/data/characters';

interface AICoachProps {
  character: Character;
  onApplyTip?: (tip: CoachingTip) => void;
  onUpdateFocus?: (focus: CoachingSession['sessionFocus']) => void;
}

export default function AICoachComponent({
  character,
  onApplyTip,
  onUpdateFocus
}: AICoachProps) {
  const [session, setSession] = useState<CoachingSession>(createDemoCoachingSession(character));
  const [selectedTip, setSelectedTip] = useState<CoachingTip | null>(null);
  const [appliedTips, setAppliedTips] = useState<string[]>([]);
  const [sessionFocus, setSessionFocus] = useState<CoachingSession['sessionFocus']>('balanced');
  const [isGenerating, setIsGenerating] = useState(false);

  const regenerateSession = useCallback(async () => {
    setIsGenerating(true);
    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newSession = AICoach.generateCoachingSession(
      character,
      ['Improve overall effectiveness', 'Optimize training efficiency'],
      sessionFocus
    );
    setSession(newSession);
    setIsGenerating(false);
  }, [character, sessionFocus]);

  useEffect(() => {
    regenerateSession();
  }, [sessionFocus, character.id, regenerateSession]);

  const handleApplyTip = (tip: CoachingTip) => {
    setAppliedTips(prev => [...prev, tip.id]);
    onApplyTip?.(tip);
  };

  const priorityColors = {
    critical: 'border-red-500 bg-red-500/10 text-red-300',
    high: 'border-orange-500 bg-orange-500/10 text-orange-300',
    medium: 'border-yellow-500 bg-yellow-500/10 text-yellow-300',
    low: 'border-gray-500 bg-gray-500/10 text-gray-300'
  };

  const categoryIcons = {
    skill_balance: BarChart3,
    interaction_unlock: Zap,
    efficiency: TrendingUp,
    synergy: Users,
    progression: Star,
    resource_management: Gem,
    specialization: Target,
    weakness: Shield
  };

  const focusOptions = [
    { id: 'balanced', label: 'Balanced Development', icon: BarChart3 },
    { id: 'combat', label: 'Combat Focus', icon: Target },
    { id: 'magic', label: 'Magic Focus', icon: Sparkles },
    { id: 'social', label: 'Social Focus', icon: Users },
    { id: 'survival', label: 'Survival Focus', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-blue-400" />
          AI Training Coach
        </h1>
        <p className="text-gray-400">
          Intelligent recommendations to optimize your character&apos;s development
        </p>
      </div>

      {/* Character Overview */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl">{character.avatar}</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{character.name}</h2>
            <p className="text-gray-400 capitalize">{character.archetype} • Level {character.level}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-400">{session.tips.length}</div>
            <div className="text-sm text-gray-400">Active Tips</div>
          </div>
        </div>

        {/* Session Focus Selector */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-300 mb-2 block">Training Focus:</label>
          <div className="flex flex-wrap gap-2">
            {focusOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    setSessionFocus(option.id as CoachingSession['sessionFocus']);
                    onUpdateFocus?.(option.id as CoachingSession['sessionFocus']);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    sessionFocus === option.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Adaptive Insights */}
        {session.adaptiveInsights.length > 0 && (
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Key Insights
            </h3>
            <div className="space-y-1">
              {session.adaptiveInsights.map((insight, index) => (
                <p key={index} className="text-sm text-blue-300">{insight}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coaching Tips */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Recommendations</h2>
          <button
            onClick={regenerateSession}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Analyzing...' : 'Refresh Tips'}
          </button>
        </div>

        <AnimatePresence>
          {session.tips.map((tip, index) => {
            const CategoryIcon = categoryIcons[tip.category];
            const isApplied = appliedTips.includes(tip.id);

            return (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`${priorityColors[tip.priority]} border-2 rounded-xl p-6 relative overflow-hidden ${
                  isApplied ? 'opacity-60' : 'hover:scale-102 cursor-pointer'
                }`}
                onClick={() => !isApplied && setSelectedTip(tip)}
              >
                {/* Priority Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${priorityColors[tip.priority]}`}>
                    {tip.priority}
                  </span>
                </div>

                {/* Applied Badge */}
                {isApplied && (
                  <div className="absolute top-3 left-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                )}

                {/* Content */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-black/20 rounded-lg">
                    <CategoryIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{tip.title}</h3>
                    <p className="text-gray-300 mb-3">{tip.description}</p>
                    
                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{tip.estimatedTimeToResult}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{tip.confidence}% confidence</span>
                      </div>
                      {tip.resourceCost && (
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4" />
                          <span>
                            {tip.resourceCost.coins && `${tip.resourceCost.coins} coins`}
                            {tip.resourceCost.gems && ` ${tip.resourceCost.gems} gems`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Items Preview */}
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-300 mb-2">Action Items:</div>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {tip.actionItems.slice(0, 2).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                    {tip.actionItems.length > 2 && (
                      <li className="text-blue-400">+ {tip.actionItems.length - 2} more actions</li>
                    )}
                  </ul>
                </div>

                {/* Apply Button */}
                {!isApplied && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyTip(tip);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
                  >
                    Apply Recommendation
                  </button>
                )}

                {isApplied && (
                  <div className="w-full py-3 bg-green-600/50 text-green-300 font-semibold rounded-lg text-center">
                    ✓ Applied Successfully
                  </div>
                )}

                {/* Warning Flags */}
                {tip.warningFlags && tip.warningFlags.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded">
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-semibold">Important:</span>
                      <span>{tip.warningFlags[0]}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Detailed Tip Modal */}
      <AnimatePresence>
        {selectedTip && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTip(null)}
          >
            <motion.div
              className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  {React.createElement(categoryIcons[selectedTip.category], { 
                    className: "w-8 h-8 text-blue-400" 
                  })}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedTip.title}</h2>
                  <p className="text-gray-300 mb-3">{selectedTip.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-3 py-1 rounded-full font-semibold capitalize ${priorityColors[selectedTip.priority]}`}>
                      {selectedTip.priority} Priority
                    </span>
                    <span className="text-gray-400">{selectedTip.confidence}% AI Confidence</span>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-400" />
                  AI Analysis
                </h3>
                <p className="text-gray-300 bg-gray-800/50 p-4 rounded-lg">{selectedTip.reasoning}</p>
              </div>

              {/* Action Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Action Plan
                </h3>
                <div className="space-y-2">
                  {selectedTip.actionItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Benefits */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Expected Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedTip.expectedBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Cost */}
              {selectedTip.resourceCost && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Gem className="w-5 h-5 text-purple-400" />
                    Resource Investment
                  </h3>
                  <div className="flex gap-4 text-sm">
                    {selectedTip.resourceCost.coins && (
                      <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-2 rounded">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-300">{selectedTip.resourceCost.coins} Coins</span>
                      </div>
                    )}
                    {selectedTip.resourceCost.gems && (
                      <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-2 rounded">
                        <Gem className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-300">{selectedTip.resourceCost.gems} Gems</span>
                      </div>
                    )}
                    {selectedTip.resourceCost.energy && (
                      <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-2 rounded">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300">{selectedTip.resourceCost.energy} Energy</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    Estimated completion time: {selectedTip.estimatedTimeToResult}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleApplyTip(selectedTip);
                    setSelectedTip(null);
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
                >
                  Apply This Recommendation
                </button>
                <button
                  onClick={() => setSelectedTip(null)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold rounded-lg transition-all"
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