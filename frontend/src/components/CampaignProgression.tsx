'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Unlock, Crown, Star, Trophy, Brain,
  Users, Target, CheckCircle,
  Book
} from 'lucide-react';
import { CampaignProgressionManager } from '../systems/campaignProgression';
import { characters } from '../data/characters';

export default function CampaignProgression() {
  const [campaignManager] = useState(() => CampaignProgressionManager.loadProgress());
  const [progress, setProgress] = useState(campaignManager.getProgress());
  const [currentChapter, setCurrentChapter] = useState(campaignManager.getCurrentChapter());
  const [unlockableCharacters, setUnlockableCharacters] = useState(campaignManager.getUnlockableCharacters());
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(campaignManager.getProgress());
      setCurrentChapter(campaignManager.getCurrentChapter());
      setUnlockableCharacters(campaignManager.getUnlockableCharacters());
    }, 1000);

    return () => clearInterval(interval);
  }, [campaignManager]);

  const handleUnlockCharacter = (characterId: string) => {
    if (campaignManager.unlockCharacter(characterId)) {
      setProgress(campaignManager.getProgress());
      setUnlockableCharacters(campaignManager.getUnlockableCharacters());
      setShowUnlockModal(true);
      setSelectedCharacter(characterId);
      campaignManager.saveProgress();
    }
  };

  const getCharacterData = (characterId: string) => {
    return characters.find(c => c.id === characterId);
  };

  const getPsychologyMasteryColor = (level: number) => {
    if (level >= 80) return 'text-green-400';
    if (level >= 60) return 'text-yellow-400';
    if (level >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <motion.h1 
          className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          _____ WARS: Campaign Progression
        </motion.h1>
        <motion.p 
          className="text-center text-gray-300 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Master the psychology of _____ characters through progressive challenges
        </motion.p>
      </div>

      {/* Progress Overview */}
      <div className="max-w-7xl mx-auto mb-8">
        <motion.div 
          className="bg-gray-800/50 rounded-xl p-6 border border-purple-500/30"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="text-gold" />
            Your Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{progress.currentChapter}</div>
              <div className="text-gray-400">Current Chapter</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{progress.unlockedCharacters.length}</div>
              <div className="text-gray-400">Characters Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{progress.totalBattlesWon}</div>
              <div className="text-gray-400">Battles Won</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{progress.totalCoachingActions}</div>
              <div className="text-gray-400">Coaching Actions</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Current Chapter */}
      {currentChapter && (
        <div className="max-w-7xl mx-auto mb-8">
          <motion.div 
            className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 rounded-xl p-6 border border-purple-400/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Book className="text-purple-400" />
              {currentChapter.title}
            </h2>
            <p className="text-gray-300 mb-4">{currentChapter.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Brain className="text-pink-400" />
                  Psychology Focus
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentChapter.psychologyFocus.map((focus) => (
                    <span 
                      key={focus}
                      className="px-3 py-1 bg-pink-500/20 border border-pink-400/30 rounded-full text-sm"
                    >
                      {focus.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Target className="text-green-400" />
                  Objectives
                </h3>
                <ul className="space-y-1">
                  {currentChapter.objectives.map((objective, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Character Unlock Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Users className="text-gold" />
          Character Progression
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Unlocked Characters */}
          {progress.unlockedCharacters.map((characterId) => {
            const character = getCharacterData(characterId);
            if (!character) return null;
            
            return (
              <motion.div
                key={characterId}
                className="bg-green-900/30 border border-green-400/50 rounded-xl p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Unlock className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-400">{character.name}</h3>
                    <p className="text-sm text-gray-400">Unlocked</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-3">{character.mythology}</p>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-pink-400" />
                  <span className="text-sm">Psychology: {character.personality.traits.slice(0, 3).join(', ')}</span>
                </div>
              </motion.div>
            );
          })}

          {/* Unlockable Characters */}
          {unlockableCharacters.map((unlock) => {
            const character = getCharacterData(unlock.characterId);
            if (!character) return null;
            
            return (
              <motion.div
                key={unlock.characterId}
                className="bg-yellow-900/30 border border-yellow-400/50 rounded-xl p-4 cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleUnlockCharacter(unlock.characterId)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-yellow-400">{character.name}</h3>
                    <p className="text-sm text-gray-400">Ready to Unlock!</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-3">{unlock.storyContext}</p>
                <button className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/50 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                  Unlock Character
                </button>
              </motion.div>
            );
          })}

          {/* Locked Characters */}
          {characters
            .filter(char => 
              !progress.unlockedCharacters.includes(char.id) && 
              !unlockableCharacters.some(u => u.characterId === char.id)
            )
            .map((character) => (
              <motion.div
                key={character.id}
                className="bg-gray-800/30 border border-gray-600/50 rounded-xl p-4 opacity-60"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.6, scale: 1 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-400">{character.name}</h3>
                    <p className="text-sm text-gray-500">Locked</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Complete previous chapters to unlock</p>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Psychology Mastery Levels */}
      <div className="max-w-7xl mx-auto mb-8">
        <motion.div 
          className="bg-gray-800/50 rounded-xl p-6 border border-purple-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Brain className="text-pink-400" />
            Psychology Mastery
          </h2>
          {Object.keys(progress.psychologyMasteryLevels).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(progress.psychologyMasteryLevels).map(([skill, level]) => (
                <div key={skill} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{skill.replace('-', ' ')}</span>
                    <span className={`font-bold ${getPsychologyMasteryColor(level)}`}>
                      {level}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        level >= 80 ? 'bg-green-400' :
                        level >= 60 ? 'bg-yellow-400' :
                        level >= 40 ? 'bg-orange-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">Complete battles and coaching actions to develop psychology mastery</p>
          )}
        </motion.div>
      </div>

      {/* Character Unlock Modal */}
      <AnimatePresence>
        {showUnlockModal && selectedCharacter && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUnlockModal(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-purple-800 to-blue-800 rounded-xl p-8 max-w-md w-full border border-gold/50"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-2xl font-bold text-gold mb-2">Character Unlocked!</h3>
                <p className="text-xl font-semibold mb-4">
                  {getCharacterData(selectedCharacter)?.name}
                </p>
                <p className="text-gray-300 mb-6">
                  {getCharacterData(selectedCharacter)?.mythology}
                </p>
                <button
                  onClick={() => setShowUnlockModal(false)}
                  className="bg-gold/20 hover:bg-gold/30 border border-gold/50 rounded-lg px-6 py-3 font-medium transition-colors"
                >
                  Continue Campaign
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}