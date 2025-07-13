'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Star, Sparkles, Users, ArrowRight, Loader } from 'lucide-react';
import TradingCard from './TradingCard';
import { TeamCharacter } from '@/data/teamBattleSystem';
import { characterAPI } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';

interface NewUserStarterPackProps {
  isOpen: boolean;
  onComplete: () => void;
  username: string;
}

export default function NewUserStarterPack({ isOpen, onComplete, username }: NewUserStarterPackProps) {
  const [step, setStep] = useState<'welcome' | 'opening' | 'reveal' | 'complete'>('welcome');
  const [starterCharacters, setStarterCharacters] = useState<TeamCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { clearNewUserFlag } = useAuth();

  const fetchStarterCharacters = async (retryCount = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await characterAPI.getUserCharacters();
      console.log('📦 Raw API response:', response);
      
      if (response.success && response.characters && response.characters.length > 0) {
        // Transform raw character data to TeamCharacter format if needed
        const transformedCharacters = response.characters.slice(0, 3).map((char: any) => {
          console.log('🔍 Character data structure:', char);
          
          // Ensure the character has the expected TeamCharacter structure
          return {
            ...char,
            // Add default psychStats if missing
            psychStats: char.psychStats || {
              training: char.training || 75,
              teamPlayer: char.teamPlayer || 75, 
              ego: char.ego || 50,
              mentalHealth: char.mentalHealth || 80,
              communication: char.communication || 75
            },
            // Add default traditionalStats if missing
            traditionalStats: char.traditionalStats || {
              strength: char.strength || 70,
              vitality: char.vitality || 70,
              speed: char.speed || 70,
              dexterity: char.dexterity || 70,
              stamina: char.stamina || 70,
              intelligence: char.intelligence || 70,
              charisma: char.charisma || 70,
              spirit: char.spirit || 70
            },
            // Add other required properties
            currentHp: char.currentHp || char.maxHp || 100,
            maxHp: char.maxHp || 100,
            level: char.level || 1,
            experience: char.experience || 0,
            experienceToNext: char.experienceToNext || 100
          };
        });
        
        console.log('✅ Transformed characters:', transformedCharacters);
        setStarterCharacters(transformedCharacters);
        setStep('reveal');
      } else if (retryCount < 10) {
        // Characters not ready yet, retry after delay
        console.log(`⏳ Characters not ready, retrying in 3 seconds... (attempt ${retryCount + 1}/10)`);
        setTimeout(() => {
          fetchStarterCharacters(retryCount + 1);
        }, 3000);
        return; // Don't setIsLoading(false) yet
      } else {
        throw new Error('Characters are still being prepared. Please try again in a moment.');
      }
    } catch (err) {
      console.error('Error fetching starter characters:', err);
      if (retryCount < 10) {
        setError('Preparing your characters, please wait...');
        setTimeout(() => {
          fetchStarterCharacters(retryCount + 1);
        }, 3000);
        return; // Don't setIsLoading(false) yet
      } else {
        setError('Failed to load your starter characters. Your pack is being prepared - please try refreshing the page in a moment.');
      }
    } finally {
      if (retryCount >= 10) {
        setIsLoading(false);
      }
    }
  };

  const handleOpenPack = async () => {
    setStep('opening');
    // Wait for pack opening animation
    setTimeout(() => {
      fetchStarterCharacters();
    }, 2000);
  };

  const handleComplete = () => {
    clearNewUserFlag();
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-purple-500/30"
      >
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 text-center space-y-6"
            >
              {/* Header */}
              <div className="space-y-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                >
                  <Gift className="w-12 h-12 text-white" />
                </motion.div>
                
                <h1 className="text-4xl font-bold text-white">
                  Welcome to Blank Wars, {username}!
                </h1>
                
                <p className="text-xl text-purple-200">
                  As a new commander, you've been granted a <span className="text-yellow-400 font-semibold">Free Starter Pack</span>!
                </p>
              </div>

              {/* Pack Preview */}
              <div className="bg-black/30 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-center gap-3 text-purple-300">
                  <Sparkles className="w-6 h-6" />
                  <h3 className="text-2xl font-semibold">Starter Pack Contents</h3>
                  <Sparkles className="w-6 h-6" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-purple-800/40 rounded-lg p-4">
                    <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-white font-semibold">3 Characters</p>
                    <p className="text-purple-300 text-sm">Build your first team</p>
                  </div>
                  
                  <div className="bg-purple-800/40 rounded-lg p-4">
                    <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-white font-semibold">Mixed Rarities</p>
                    <p className="text-purple-300 text-sm">Common to Rare heroes</p>
                  </div>
                  
                  <div className="bg-purple-800/40 rounded-lg p-4">
                    <Gift className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-white font-semibold">Absolutely Free</p>
                    <p className="text-purple-300 text-sm">Our gift to you!</p>
                  </div>
                </div>
              </div>

              {/* Open Button */}
              <motion.button
                onClick={handleOpenPack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold text-xl px-12 py-4 rounded-xl shadow-lg transition-all flex items-center gap-3 mx-auto"
              >
                <Gift className="w-6 h-6" />
                Open Your Starter Pack!
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </motion.div>
          )}

          {step === 'opening' && (
            <motion.div
              key="opening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center space-y-8 min-h-[400px] flex flex-col justify-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="mx-auto w-32 h-32 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-16 h-16 text-white" />
              </motion.div>
              
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">Opening your pack...</h2>
                <p className="text-purple-200 text-lg">
                  Summoning legendary heroes to your cause!
                </p>
                
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-purple-300">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Preparing your characters...</span>
                  </div>
                )}
                
                {error && (
                  <div className="text-yellow-300 bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
                    <p>{error}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 'reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 space-y-6"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                  <Star className="w-8 h-8 text-yellow-400" />
                  Your Starter Heroes!
                  <Star className="w-8 h-8 text-yellow-400" />
                </h2>
                <p className="text-purple-200 text-lg">
                  These legendary characters will form your first team
                </p>
              </div>

              {error ? (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-center">
                  <p className="text-red-300">{error}</p>
                  <button
                    onClick={fetchStarterCharacters}
                    className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {/* Character Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {starterCharacters.map((character, index) => (
                      <motion.div
                        key={character.id}
                        initial={{ 
                          opacity: 0, 
                          y: 50,
                          rotateY: 180 
                        }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          rotateY: 0 
                        }}
                        transition={{ 
                          delay: index * 0.3,
                          duration: 0.6,
                          type: "spring",
                          stiffness: 100
                        }}
                        className="perspective-1000"
                      >
                        <TradingCard
                          character={character}
                          isSelected={false}
                          onSelect={() => {}}
                          isOwned={true}
                          showNewBadge={true}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Continue Button */}
                  <div className="text-center">
                    <motion.button
                      onClick={() => setStep('complete')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold text-xl px-12 py-4 rounded-xl shadow-lg transition-all flex items-center gap-3 mx-auto"
                    >
                      Continue to Battle!
                      <ArrowRight className="w-6 h-6" />
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-8 text-center space-y-6"
            >
              <div className="space-y-4">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center"
                >
                  <Users className="w-12 h-12 text-white" />
                </motion.div>
                
                <h1 className="text-4xl font-bold text-white">
                  Ready for Battle!
                </h1>
                
                <p className="text-xl text-purple-200">
                  Your team is assembled and ready to face any challenge.
                </p>
              </div>

              <div className="bg-black/30 rounded-xl p-6 space-y-4">
                <h3 className="text-2xl font-semibold text-white">What's Next?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="bg-purple-800/40 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">🥊 Battle Arena</h4>
                    <p className="text-purple-300 text-sm">Test your team against AI opponents and other players</p>
                  </div>
                  
                  <div className="bg-purple-800/40 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">🏠 Team Headquarters</h4>
                    <p className="text-purple-300 text-sm">Manage your characters and upgrade your facilities</p>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={handleComplete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold text-xl px-12 py-4 rounded-xl shadow-lg transition-all flex items-center gap-3 mx-auto"
              >
                Enter Blank Wars!
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}