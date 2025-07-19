'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { characterService } from '@/services/characterService';
import { TeamCharacter } from '@/data/teamBattleSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle, Gift, Sparkles } from 'lucide-react';

export default function PostRegistrationFlow() {
  const { user, showOnboarding, setShowOnboarding } = useAuth();
  const [showingPackAnimation, setShowingPackAnimation] = useState(false);
  const [showingPackOpening, setShowingPackOpening] = useState(false);
  const [starterCharacters, setStarterCharacters] = useState<TeamCharacter[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    if (showOnboarding && user) {
      // Start with pack animation
      setShowingPackAnimation(true);
      fetchStarterCharacters();
    }
  }, [showOnboarding, user]);

  const fetchStarterCharacters = async () => {
    try {
      const response = await characterService.getUserCharacters();
      const characters = response.characters || response; // Handle both response formats
      setStarterCharacters(characters.slice(0, 3)); // Show first 3 as starter pack
      
      // After 2 seconds, move to pack opening
      setTimeout(() => {
        setShowingPackAnimation(false);
        setShowingPackOpening(true);
      }, 2000);
    } catch (error) {
      console.error('Failed to fetch starter characters:', error);
      // Complete the flow even if we can't show characters
      completeFlow();
    }
  };

  const handleCardReveal = () => {
    if (currentCardIndex < starterCharacters.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      completeFlow();
    }
  };

  const completeFlow = () => {
    setShowingPackAnimation(false);
    setShowingPackOpening(false);
    setShowOnboarding(false);
  };

  if (!user || !showOnboarding) return null;

  return (
    <>
      {/* Pack Animation */}
      <AnimatePresence>
        {showingPackAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, rotateY: 0 }}
              animate={{ 
                scale: [0.5, 1.2, 1],
                rotateY: [0, 360],
                transition: { duration: 1.5 }
              }}
              className="text-center"
            >
              <div className="text-8xl mb-4">📦</div>
              <h3 className="text-3xl font-bold text-white mb-2">
                Starter Pack
              </h3>
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                <span className="text-xl text-yellow-400">Opening...</span>
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Reveal */}
      <AnimatePresence>
        {showingPackOpening && starterCharacters.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center z-50"
          >
            <div className="text-center">
              <motion.div
                key={currentCardIndex}
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ 
                  scale: 1, 
                  rotateY: 0,
                  transition: { type: "spring", stiffness: 100 }
                }}
                className="mb-8 bg-gray-800 border border-gray-600 rounded-xl p-8 max-w-md mx-auto"
              >
                <div className="text-6xl mb-4">⚔️</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {starterCharacters[currentCardIndex].name}
                </h3>
                <p className="text-gray-400 mb-4 capitalize">
                  {starterCharacters[currentCardIndex].archetype}
                </p>
                <div className="flex justify-center mb-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < (starterCharacters[currentCardIndex].rarity === 'legendary' ? 4 :
                             starterCharacters[currentCardIndex].rarity === 'epic' ? 3 :
                             starterCharacters[currentCardIndex].rarity === 'rare' ? 2 : 1)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-500'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-lg text-gray-300 capitalize mb-4">
                  {starterCharacters[currentCardIndex].rarity}
                </p>
                <div className="bg-green-900/30 border border-green-500/50 rounded p-3">
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-green-400">Added to Your Collection!</span>
                  </div>
                </div>
              </motion.div>

              <div className="text-white mb-4">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handleCardReveal}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    {currentCardIndex < starterCharacters.length - 1 ? 'Next Character' : 'Start Your Adventure!'}
                  </button>
                </div>
              </div>

              <div className="mt-4 text-gray-400">
                Character {currentCardIndex + 1} of {starterCharacters.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}