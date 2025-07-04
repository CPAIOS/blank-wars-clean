'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatCharacterName } from '@/utils/characterUtils';

interface PsychStats {
  mentalHealth: number;
  training: number;
  teamPlayer: number;
  ego: number;
}

interface Character {
  id: string;
  name: string;
  avatar: string;
  level: number;
  archetype: string;
  psychStats: PsychStats;
  restDaysNeeded: number;
}

interface Team {
  name: string;
  teamChemistry: number;
  averageLevel: number;
  wins: number;
  losses: number;
  characters: Character[];
  coachingPoints: number;
}

interface TeamOverviewProps {
  playerTeam: Team;
  playerMorale: number;
  onCharacterClick: (character: Character) => void;
  onSelectChatCharacter: (character: Character) => void;
}

export default function TeamOverview({
  playerTeam,
  playerMorale,
  onCharacterClick,
  onSelectChatCharacter
}: TeamOverviewProps) {
  const getMentalHealthColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 50) return 'text-yellow-400';
    if (value >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      className="bg-gradient-to-r from-gray-900/60 to-gray-800/60 rounded-xl p-6 border border-gray-600 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-bold text-white mb-4 text-center">🏆 {playerTeam.name} 🏆</h2>
      
      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="text-center bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-400">{Math.round(playerTeam.teamChemistry)}%</div>
          <div className="text-sm text-gray-400">Team Chemistry</div>
        </div>
        <div className="text-center bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">{playerMorale}%</div>
          <div className="text-sm text-gray-400">Team Morale</div>
        </div>
        <div className="text-center bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-400">{playerTeam.averageLevel}</div>
          <div className="text-sm text-gray-400">Avg Level</div>
        </div>
        <div className="text-center bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-400">{playerTeam.wins}-{playerTeam.losses}</div>
          <div className="text-sm text-gray-400">W-L Record</div>
        </div>
        <div className="text-center bg-gray-800/50 rounded-lg p-3 border border-orange-500/50">
          <div className="text-2xl font-bold text-orange-400">{playerTeam.coachingPoints}</div>
          <div className="text-sm text-gray-400">Coaching Points</div>
        </div>
      </div>

      {/* Team Members */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {playerTeam.characters.map((character) => (
          <motion.div
            key={character.id}
            className="bg-gray-800/30 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition-all"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">{character.avatar}</div>
              <div>
                <h3 className="text-lg font-bold text-white">{formatCharacterName(character.name)}</h3>
                <p className="text-sm text-gray-400">Level {character.level} {character.archetype}</p>
              </div>
            </div>
            
            {/* Psychology Stats */}
            <div className="space-y-2 text-xs">
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

            {/* Status Indicators */}
            <div className="mt-3 flex gap-1">
              {character.psychStats.mentalHealth < 30 && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Crisis</span>
              )}
              {character.restDaysNeeded > 0 && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">Needs Rest</span>
              )}
              {character.psychStats.ego > 80 && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">High Ego</span>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectChatCharacter(character);
                }}
                className="flex-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs rounded transition-colors"
              >
                💬 Chat
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCharacterClick(character);
                }}
                className="flex-1 px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-xs rounded transition-colors"
              >
                🏃 Coach
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}