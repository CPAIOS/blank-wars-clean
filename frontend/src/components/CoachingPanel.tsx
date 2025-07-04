'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PsychStats {
  mentalHealth: number;
  training: number;
  teamPlayer: number;
  ego: number;
}

interface Character {
  name: string;
  avatar: string;
  psychStats: PsychStats;
}

interface CoachingPanelProps {
  isOpen: boolean;
  character: Character | null;
  onClose: () => void;
  onCoachingSession: (type: 'performance' | 'mental_health' | 'team_relations' | 'strategy') => void;
  coachingPoints: number;
}

export default function CoachingPanel({
  isOpen,
  character,
  onClose,
  onCoachingSession,
  coachingPoints
}: CoachingPanelProps) {
  if (!isOpen || !character) return null;

  const getMentalHealthColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 50) return 'text-yellow-400';
    if (value >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-2xl w-full"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
        >
          {/* Character Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{character.avatar}</div>
              <div>
                <h2 className="text-2xl font-bold text-white">{character.name}</h2>
                <p className="text-gray-400">Individual Coaching Session</p>
              </div>
            </div>
            
            {/* Coaching Points Display */}
            <div className="text-center bg-blue-600/20 rounded-lg p-3 border border-blue-500/50">
              <div className="text-2xl font-bold text-blue-400">{coachingPoints}</div>
              <div className="text-xs text-gray-400">Coaching Points</div>
              <div className="text-xs text-gray-500">Cost: 1 per session</div>
            </div>
          </div>

          {/* Current Psychology State */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Current Psychology</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Mental Health:</span>
                <span className={`font-bold ${getMentalHealthColor(character.psychStats.mentalHealth)}`}>
                  {character.psychStats.mentalHealth}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Training:</span>
                <span className="text-blue-400 font-bold">{character.psychStats.training}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Team Player:</span>
                <span className="text-purple-400 font-bold">{character.psychStats.teamPlayer}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ego:</span>
                <span className="text-red-400 font-bold">{character.psychStats.ego}%</span>
              </div>
            </div>
          </div>

          {/* Coaching Options */}
          <div className="space-y-3 mb-6">
            <h3 className="text-lg font-semibold text-white">Choose Coaching Focus:</h3>
            
            <button
              onClick={() => onCoachingSession('performance')}
              disabled={coachingPoints < 1}
              className={`w-full p-4 border rounded-lg text-left transition-all ${
                coachingPoints < 1 
                  ? 'bg-gray-700/20 border-gray-600/50 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600/20 border-blue-500/50 hover:bg-blue-600/30'
              }`}
            >
              <div className={`font-semibold ${coachingPoints < 1 ? 'text-gray-500' : 'text-white'}`}>
                🎯 Performance Coaching <span className="text-blue-400">(+Str, +Dex, +Spd)</span>
              </div>
              <div className="text-gray-400 text-sm">Improve training and combat effectiveness</div>
            </button>

            <button
              onClick={() => onCoachingSession('mental_health')}
              disabled={coachingPoints < 1}
              className={`w-full p-4 border rounded-lg text-left transition-all ${
                coachingPoints < 1 
                  ? 'bg-gray-700/20 border-gray-600/50 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600/20 border-green-500/50 hover:bg-green-600/30'
              }`}
            >
              <div className={`font-semibold ${coachingPoints < 1 ? 'text-gray-500' : 'text-white'}`}>
                🧠 Mental Health Support <span className="text-green-400">(+Vitality, +Spirit)</span>
              </div>
              <div className="text-gray-400 text-sm">Address psychological stress and trauma</div>
            </button>

            <button
              onClick={() => onCoachingSession('team_relations')}
              disabled={coachingPoints < 1}
              className={`w-full p-4 border rounded-lg text-left transition-all ${
                coachingPoints < 1 
                  ? 'bg-gray-700/20 border-gray-600/50 text-gray-500 cursor-not-allowed' 
                  : 'bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30'
              }`}
            >
              <div className={`font-semibold ${coachingPoints < 1 ? 'text-gray-500' : 'text-white'}`}>
                🤝 Team Relations <span className="text-purple-400">(+Charisma)</span>
              </div>
              <div className="text-gray-400 text-sm">Work on cooperation and communication</div>
            </button>

            <button
              onClick={() => onCoachingSession('strategy')}
              disabled={coachingPoints < 1}
              className={`w-full p-4 border rounded-lg text-left transition-all ${
                coachingPoints < 1 
                  ? 'bg-gray-700/20 border-gray-600/50 text-gray-500 cursor-not-allowed' 
                  : 'bg-yellow-600/20 border-yellow-500/50 hover:bg-yellow-600/30'
              }`}
            >
              <div className={`font-semibold ${coachingPoints < 1 ? 'text-gray-500' : 'text-white'}`}>
                📋 Strategy Discussion <span className="text-yellow-400">(+Int, +Stamina)</span>
              </div>
              <div className="text-gray-400 text-sm">Review tactics and battle plans</div>
            </button>
          </div>

          {/* Cancel Button */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}