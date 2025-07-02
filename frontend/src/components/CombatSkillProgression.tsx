'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword,
  Shield,
  Brain,
  Users,
  Heart,
  TrendingUp,
  Star,
  Award,
  Zap,
  Target,
  Clock,
  Flame,
  CheckCircle,
  ArrowUp,
  Sparkles,
  Eye,
  Info
} from 'lucide-react';
import {
  CombatSkillReward,
  SkillGain,
  createDemoCombatSkillReward
} from '@/data/combatSkillProgression';

interface CombatSkillProgressionProps {
  characterId: string;
  characterName: string;
  characterAvatar: string;
  skillReward: CombatSkillReward;
  onClose: () => void;
  onContinue: () => void;
}

export default function CombatSkillProgression({
  characterId,
  characterName,
  characterAvatar,
  skillReward,
  onClose,
  onContinue
}: CombatSkillProgressionProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  const skillIcons = {
    combat: Sword,
    survival: Shield,
    mental: Brain,
    social: Users,
    spiritual: Heart
  };

  const skillColors = {
    combat: 'text-red-400 bg-red-500/20 border-red-500/50',
    survival: 'text-green-400 bg-green-500/20 border-green-500/50',
    mental: 'text-blue-400 bg-blue-500/20 border-blue-500/50',
    social: 'text-purple-400 bg-purple-500/20 border-purple-500/50',
    spiritual: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50'
  };

  const performanceColors = {
    poor: 'text-gray-400 bg-gray-500/20',
    average: 'text-blue-400 bg-blue-500/20',
    good: 'text-green-400 bg-green-500/20',
    excellent: 'text-purple-400 bg-purple-500/20',
    legendary: 'text-yellow-400 bg-yellow-500/20'
  };

  const steps = [
    'performance', // Show battle performance rating
    'skills', // Show skill gains
    'levelups', // Show any level ups
    'interactions', // Show new interactions unlocked
    'summary' // Final summary
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setAnimationComplete(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentStep, steps.length]);

  const handleSkipAnimation = () => {
    setCurrentStep(steps.length - 1);
    setAnimationComplete(true);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-gray-900 rounded-xl border border-gray-700 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{characterAvatar}</div>
          <h1 className="text-3xl font-bold text-white mb-2">{characterName}</h1>
          <p className="text-gray-400">Battle Experience Gained</p>
        </div>

        {/* Performance Rating */}
        <AnimatePresence>
          {currentStep >= 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                  <Award className="w-6 h-6 text-yellow-400" />
                  Battle Performance
                </h2>
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 ${performanceColors[skillReward.performanceRating]}`}>
                  <Star className="w-8 h-8" />
                  <span className="text-2xl font-bold capitalize">{skillReward.performanceRating}</span>
                  <Star className="w-8 h-8" />
                </div>
                <p className="text-gray-400 mt-2">Total Experience Gained: {skillReward.totalExperience}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skill Gains */}
        <AnimatePresence>
          {currentStep >= 1 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                Skill Experience Gained
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skillReward.skillGains.map((gain, index) => {
                  const SkillIcon = skillIcons[gain.skill as keyof typeof skillIcons];
                  const skillColorClass = skillColors[gain.skill as keyof typeof skillColors];
                  
                  return (
                    <motion.div
                      key={gain.skill}
                      className={`p-4 rounded-xl border-2 ${skillColorClass} cursor-pointer hover:scale-105 transition-transform`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      onClick={() => setShowDetails(showDetails === gain.skill ? null : gain.skill)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <SkillIcon className="w-6 h-6" />
                        <span className="font-semibold capitalize">{gain.skill}</span>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">+{gain.experience}</div>
                        <div className="text-sm opacity-80">Experience</div>
                        
                        {gain.multiplier > 1 && (
                          <div className="mt-2 text-xs bg-black/20 px-2 py-1 rounded">
                            {gain.multiplier.toFixed(1)}x multiplier
                          </div>
                        )}
                      </div>

                      {/* Detailed breakdown */}
                      <AnimatePresence>
                        {showDetails === gain.skill && (
                          <motion.div
                            className="mt-3 pt-3 border-t border-current/20"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className="text-xs">
                              <div className="font-semibold mb-1">Breakdown:</div>
                              <div>Base: {gain.baseGain} XP</div>
                              <div>Multiplier: {gain.multiplier.toFixed(2)}x</div>
                              <div className="mt-2 text-gray-300">{gain.reason}</div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Ups */}
        <AnimatePresence>
          {currentStep >= 2 && skillReward.skillLevelUps.length > 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-2">
                <ArrowUp className="w-6 h-6 text-yellow-400" />
                Skill Level Ups!
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillReward.skillLevelUps.map((levelUp, index) => {
                  const SkillIcon = skillIcons[levelUp.skill as keyof typeof skillIcons];
                  const skillColorClass = skillColors[levelUp.skill as keyof typeof skillColors];
                  
                  return (
                    <motion.div
                      key={levelUp.skill}
                      className={`p-6 rounded-xl border-2 ${skillColorClass} text-center`}
                      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                    >
                      <SkillIcon className="w-10 h-10 mx-auto mb-3" />
                      <div className="font-bold text-lg capitalize mb-2">{levelUp.skill}</div>
                      <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                        <span>Level {levelUp.newLevel - 1}</span>
                        <ArrowUp className="w-6 h-6" />
                        <span>Level {levelUp.newLevel}</span>
                      </div>
                      <div className="mt-3">
                        <Sparkles className="w-5 h-5 mx-auto text-yellow-400" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Interactions */}
        <AnimatePresence>
          {currentStep >= 3 && skillReward.newInteractionsUnlocked.length > 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-2">
                <Zap className="w-6 h-6 text-purple-400" />
                New Skill Interactions Unlocked!
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillReward.newInteractionsUnlocked.map((interaction, index) => (
                  <motion.div
                    key={interaction}
                    className="p-4 rounded-xl border-2 border-purple-500/50 bg-purple-500/20 text-purple-300 text-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Zap className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold capitalize">{interaction.replace(/_/g, ' ')}</div>
                    <div className="text-sm opacity-80 mt-1">Available in Skill Interactions</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary */}
        <AnimatePresence>
          {currentStep >= 4 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-xl p-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  Combat Experience Complete
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{skillReward.skillGains.length}</div>
                    <div className="text-sm text-gray-400">Skills Improved</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{skillReward.totalExperience}</div>
                    <div className="text-sm text-gray-400">Total XP</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{skillReward.skillLevelUps.length}</div>
                    <div className="text-sm text-gray-400">Level Ups</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{skillReward.newInteractionsUnlocked.length}</div>
                    <div className="text-sm text-gray-400">New Interactions</div>
                  </div>
                </div>
                
                <p className="text-gray-300 mt-4">
                  Your skills have grown through the trials of combat. Continue training and fighting to unlock your character&apos;s true potential!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {!animationComplete && (
            <button
              onClick={handleSkipAnimation}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all"
            >
              Skip Animation
            </button>
          )}
          
          {animationComplete && (
            <>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all"
              >
                View Details
              </button>
              <button
                onClick={onContinue}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
              >
                Continue
              </button>
            </>
          )}
        </div>

        {/* Progress Indicator */}
        {!animationComplete && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index <= currentStep ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Demo component for testing
export function CombatSkillProgressionDemo() {
  const [showProgression, setShowProgression] = useState(true);
  const demoReward = createDemoCombatSkillReward('achilles_demo');

  if (!showProgression) {
    return (
      <div className="p-8 text-center">
        <button
          onClick={() => setShowProgression(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Show Combat Skill Progression Demo
        </button>
      </div>
    );
  }

  return (
    <CombatSkillProgression
      characterId="achilles_demo"
      characterName="Achilles"
      characterAvatar="⚔️"
      skillReward={demoReward}
      onClose={() => console.log('Progression details requested')}
      onContinue={() => setShowProgression(false)}
    />
  );
}