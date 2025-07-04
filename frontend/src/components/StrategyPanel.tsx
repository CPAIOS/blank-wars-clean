'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

interface Ability {
  name: string;
  icon: string;
  type: string;
}

interface SpecialPower {
  name: string;
  icon: string;
  description: string;
  currentCooldown: number;
}

interface SelectedStrategies {
  attack: string | null;
  defense: string | null;
  special: string | null;
}

interface StrategyPanelProps {
  currentRound: number;
  selectedStrategies: SelectedStrategies;
  player1: {
    abilities: Ability[];
    specialPowers: SpecialPower[];
  };
  isConnected: boolean;
  isAuthenticated: boolean;
  coachingMessages: string[];
  coachingRef: React.RefObject<HTMLDivElement>;
  showDisagreement: boolean;
  onStrategyRecommendation: (category: 'attack' | 'defense' | 'special', strategyName: string) => void;
  onFinalStrategySelection: (strategy: 'aggressive' | 'defensive' | 'balanced') => void;
  onInsistOnStrategy: () => void;
  onProceedToCombat: () => void;
}

export default function StrategyPanel({
  currentRound,
  selectedStrategies,
  player1,
  isConnected,
  isAuthenticated,
  coachingMessages,
  coachingRef,
  showDisagreement,
  onStrategyRecommendation,
  onFinalStrategySelection,
  onInsistOnStrategy,
  onProceedToCombat
}: StrategyPanelProps) {
  return (
    <motion.div 
      className="bg-gradient-to-r from-green-900/40 to-blue-900/40 rounded-xl p-6 backdrop-blur-sm border border-green-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        {currentRound === 1 ? 'Pre-Battle Strategy Session' : `Strategy Coaching Session - Round ${currentRound}`}
      </h3>

      {/* Strategy Status */}
      <div className="mb-4 p-3 bg-blue-600/20 rounded-lg border border-blue-500">
        <h4 className="text-sm font-bold text-blue-100 mb-2">Strategy Selection (AI will choose unselected categories):</h4>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div className={`p-2 rounded ${selectedStrategies.attack ? 'bg-green-600/30 text-green-100' : 'bg-gray-600/30 text-gray-100'}`}>
            <div className="font-bold">Attack</div>
            <div>{selectedStrategies.attack ? `✓ ${selectedStrategies.attack}` : 'AI will choose'}</div>
          </div>
          <div className={`p-2 rounded ${selectedStrategies.defense ? 'bg-green-600/30 text-green-100' : 'bg-gray-600/30 text-gray-100'}`}>
            <div className="font-bold">Defense</div>
            <div>{selectedStrategies.defense ? `✓ ${selectedStrategies.defense}` : 'AI will choose'}</div>
          </div>
          <div className={`p-2 rounded ${selectedStrategies.special ? 'bg-green-600/30 text-green-100' : 'bg-gray-600/30 text-gray-100'}`}>
            <div className="font-bold">Special</div>
            <div>{selectedStrategies.special ? `✓ ${selectedStrategies.special}` : 'AI will choose'}</div>
          </div>
        </div>
      </div>
      
      {/* Coaching Messages */}
      <div 
        ref={coachingRef}
        className="bg-black/40 rounded-lg p-4 h-64 overflow-y-auto mb-4"
      >
        {coachingMessages.map((msg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`mb-2 p-2 rounded ${
              msg.startsWith('Coach:') ? 'bg-green-600/20 text-green-200' : 
              msg.includes('⚠️') ? 'bg-red-600/20 text-red-200' :
              'bg-blue-600/20 text-blue-200'
            }`}
          >
            {msg}
          </motion.div>
        ))}
      </div>

      {/* Strategy Selection Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h4 className="text-sm font-bold text-gray-100 mb-2">Attack Strategy</h4>
          <div className="space-y-2">
            {player1.abilities.filter(a => a.type === 'attack').map((ability, idx) => (
              <button
                key={idx}
                onClick={() => onStrategyRecommendation('attack', ability.name)}
                className="w-full p-2 bg-red-600/30 hover:bg-red-600/50 rounded text-white text-sm transition-colors"
              >
                {ability.icon} {ability.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-100 mb-2">Defense Strategy</h4>
          <div className="space-y-2">
            {player1.abilities.filter(a => a.type === 'defense').map((ability, idx) => (
              <button
                key={idx}
                onClick={() => onStrategyRecommendation('defense', ability.name)}
                className="w-full p-2 bg-blue-600/30 hover:bg-blue-600/50 rounded text-white text-sm transition-colors"
              >
                {ability.icon} {ability.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-100 mb-2">Special Powers</h4>
          <div className="space-y-2">
            {player1.specialPowers.map((power, idx) => (
              <button
                key={idx}
                onClick={() => onStrategyRecommendation('special', power.name)}
                disabled={power.currentCooldown > 0}
                className={`w-full p-2 rounded text-white text-sm transition-colors ${
                  power.currentCooldown > 0 
                    ? 'bg-gray-600/30 cursor-not-allowed opacity-50' 
                    : 'bg-purple-600/30 hover:bg-purple-600/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{power.icon} {power.name}</span>
                  {power.currentCooldown > 0 && (
                    <span className="text-xs">({power.currentCooldown})</span>
                  )}
                </div>
                <div className="text-xs text-gray-100 mt-1">{power.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* WebSocket Strategy Selection */}
      <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500 rounded-lg">
        <h4 className="text-lg font-bold text-purple-100 mb-3 text-center">Final Strategy Selection</h4>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => onFinalStrategySelection('aggressive')}
            disabled={!isConnected || !isAuthenticated}
            className="p-4 bg-red-600/30 hover:bg-red-600/50 disabled:bg-gray-600/30 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
          >
            <div className="text-2xl mb-2">⚔️</div>
            <div className="text-sm">Aggressive</div>
            <div className="text-xs text-gray-300 mt-1">High risk, high reward</div>
          </button>
          
          <button
            onClick={() => onFinalStrategySelection('balanced')}
            disabled={!isConnected || !isAuthenticated}
            className="p-4 bg-blue-600/30 hover:bg-blue-600/50 disabled:bg-gray-600/30 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
          >
            <div className="text-2xl mb-2">⚖️</div>
            <div className="text-sm">Balanced</div>
            <div className="text-xs text-gray-300 mt-1">Steady and reliable</div>
          </button>
          
          <button
            onClick={() => onFinalStrategySelection('defensive')}
            disabled={!isConnected || !isAuthenticated}
            className="p-4 bg-green-600/30 hover:bg-green-600/50 disabled:bg-gray-600/30 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
          >
            <div className="text-2xl mb-2">🛡️</div>
            <div className="text-sm">Defensive</div>
            <div className="text-xs text-gray-300 mt-1">Safety first approach</div>
          </button>
        </div>
        {(!isConnected || !isAuthenticated) && (
          <div className="text-red-300 text-sm text-center mt-2">
            Must be connected to battle server to select strategy
          </div>
        )}
      </div>

      {/* Disagreement Handler */}
      {showDisagreement && (
        <motion.div 
          className="mt-4 p-4 bg-yellow-600/20 border border-yellow-500 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-yellow-200 mb-3">Your warrior disagrees with your strategy!</p>
          <button
            onClick={onInsistOnStrategy}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-bold transition-colors"
          >
            Insist on Your Strategy
          </button>
        </motion.div>
      )}

      {/* Proceed to Combat Button */}
      {!showDisagreement && (
        <motion.div 
          className="mt-4 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <button
            onClick={onProceedToCombat}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105"
          >
            🚀 Proceed to Combat!
          </button>
          <p className="text-xs text-gray-400 mt-2">AI will choose any unselected strategies</p>
        </motion.div>
      )}
    </motion.div>
  );
}