'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  X, 
  BookOpen, 
  Users, 
  Sword, 
  Dumbbell,
  Crown,
  MessageCircle,
  Target,
  Brain,
  Shield,
  Star,
  ArrowLeft,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

interface TutorialSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: TutorialStep[];
}

interface TutorialSystemProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSection?: string;
}

export default function TutorialSystem({ isOpen, onClose, defaultSection = 'basics' }: TutorialSystemProps) {
  const [activeSection, setActiveSection] = useState(defaultSection);
  const [activeStep, setActiveStep] = useState(0);

  const tutorialSections: TutorialSection[] = [
    {
      id: 'basics',
      title: 'Getting Started',
      description: 'Learn the fundamentals of coaching legendary characters',
      icon: BookOpen,
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Blank Wars',
          description: 'Your journey as a coach begins here',
          icon: Star,
          content: (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-4">⚔️</div>
                <p className="text-gray-300 mb-4">
                  In Blank Wars, you're not just commanding characters - you're their coach, guide, and strategist.
                </p>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">Your Role as Coach</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Guide characters through psychological challenges</li>
                  <li>• Develop their skills and equipment</li>
                  <li>• Build team strategies that account for personality types</li>
                  <li>• Help them grow stronger through training and battles</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          id: 'progression',
          title: 'Coach Progression',
          description: 'Advance from Rookie to Grandmaster Coach',
          icon: Crown,
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🥉</div>
                  <h4 className="text-yellow-400 font-semibold">Rookie Coach</h4>
                  <p className="text-xs text-gray-400">Level 1-4 • Learning the basics</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🥈</div>
                  <h4 className="text-blue-400 font-semibold">Advanced Coach</h4>
                  <p className="text-xs text-gray-400">Level 10+ • 25 wins</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🥇</div>
                  <h4 className="text-purple-400 font-semibold">Master Coach</h4>
                  <p className="text-xs text-gray-400">Level 40+ • 300 wins</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">👑</div>
                  <h4 className="text-pink-400 font-semibold">Grandmaster</h4>
                  <p className="text-xs text-gray-400">Level 50+ • 500 wins</p>
                </div>
              </div>
              <p className="text-center text-gray-300 text-sm">
                Your coach level determines which characters you can recruit and what advanced strategies you can use.
              </p>
            </div>
          )
        }
      ]
    },
    {
      id: 'characters',
      title: 'Character Management',
      description: 'Master the art of character development and team building',
      icon: Users,
      steps: [
        {
          id: 'database',
          title: 'Character Database',
          description: 'Discover and recruit legendary characters',
          icon: Users,
          content: (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">📚</div>
                <p className="text-gray-300">Browse hundreds of legendary characters from history and mythology.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">⚔️</span>
                    <div>
                      <h4 className="text-white font-semibold">Achilles</h4>
                      <p className="text-sm text-gray-400">Warrior • Epic Rarity</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300">High attack, vulnerable to pride-based psychological attacks</p>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🧙</span>
                    <div>
                      <h4 className="text-white font-semibold">Merlin</h4>
                      <p className="text-sm text-gray-400">Scholar • Legendary Rarity</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300">Powerful magic abilities, responds well to intellectual challenges</p>
                </div>
              </div>
            </div>
          )
        },
        {
          id: 'progression-char',
          title: 'Character Progression',
          description: 'Level up characters and unlock their potential',
          icon: Target,
          content: (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-gray-700">
                <h4 className="text-blue-400 font-semibold mb-3">Progression Systems</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-400" />
                      <span className="text-white">Experience & Levels</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="text-white">Equipment & Gear</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-white">Skill Trees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-pink-400" />
                      <span className="text-white">Special Abilities</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-300 text-sm">
                  Characters progress through battles, training, and meaningful conversations with you.
                </p>
              </div>
            </div>
          )
        },
        {
          id: 'equipment',
          title: 'Equipment & Gear',
          description: 'Equip characters with legendary weapons and armor',
          icon: Crown,
          content: (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">⚔️</div>
                <p className="text-gray-300">Customize your characters with powerful equipment.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-2">
                    <Sword className="w-6 h-6 text-red-400 mx-auto" />
                  </div>
                  <p className="text-sm text-white font-semibold">Weapons</p>
                  <p className="text-xs text-gray-400">Boost attack power</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-2">
                    <Shield className="w-6 h-6 text-blue-400 mx-auto" />
                  </div>
                  <p className="text-sm text-white font-semibold">Armor</p>
                  <p className="text-xs text-gray-400">Increase defense</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 mb-2">
                    <Star className="w-6 h-6 text-purple-400 mx-auto" />
                  </div>
                  <p className="text-sm text-white font-semibold">Accessories</p>
                  <p className="text-xs text-gray-400">Special effects</p>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'training',
      title: 'Training System',
      description: 'Develop your characters between battles',
      icon: Dumbbell,
      steps: [
        {
          id: 'training-basics',
          title: 'Training Fundamentals',
          description: 'Learn how to improve character skills and mental health',
          icon: Dumbbell,
          content: (
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h4 className="text-green-400 font-semibold mb-3">Training Benefits</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-pink-400" />
                      <span className="text-white">Mental Health</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-white">Skill Development</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-400" />
                      <span className="text-white">Team Building</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-white">Stress Reduction</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-gray-300 text-sm">
                Regular training keeps your characters in peak condition for battles.
              </p>
            </div>
          )
        }
      ]
    },
    {
      id: 'battle',
      title: 'Battle System',
      description: 'Master the psychology-based combat mechanics',
      icon: Sword,
      steps: [
        {
          id: 'battle-basics',
          title: 'Battle Fundamentals',
          description: 'Understanding the unique psychology-based combat',
          icon: Sword,
          content: (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">⚔️</div>
                <p className="text-gray-300">Battles combine traditional RPG mechanics with psychological coaching.</p>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-red-400 font-semibold mb-3">Psychology in Combat</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Characters may deviate from strategy based on personality</li>
                  <li>• Coach them during battle to maintain focus</li>
                  <li>• Different personalities respond to different coaching styles</li>
                  <li>• Team chemistry affects overall performance</li>
                </ul>
              </div>
            </div>
          )
        }
      ]
    }
  ];

  const currentSection = tutorialSections.find(section => section.id === activeSection);
  const currentStepData = currentSection?.steps[activeStep];

  const handleNextStep = () => {
    if (currentSection && activeStep < currentSection.steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setActiveStep(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full h-[600px] flex overflow-hidden"
      >
        {/* Sidebar */}
        <div className="w-1/3 bg-gray-800/50 border-r border-gray-700 p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-400" />
              Tutorial
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {tutorialSections.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;
              
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 border border-blue-500/30'
                      : 'bg-gray-800/30 hover:bg-gray-700/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                    <span className={`font-semibold ${isActive ? 'text-blue-400' : 'text-white'}`}>
                      {section.title}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{section.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {currentStepData && (
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-600/20 rounded-full p-2">
                    <currentStepData.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{currentStepData.title}</h3>
                </div>
                <p className="text-gray-400">{currentStepData.description}</p>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeSection}-${activeStep}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentStepData.content}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="p-6 border-t border-gray-700 flex items-center justify-between">
                <button
                  onClick={handlePrevStep}
                  disabled={activeStep === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeStep === 0
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {currentSection?.steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === activeStep ? 'bg-blue-400' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNextStep}
                  disabled={!currentSection || activeStep >= currentSection.steps.length - 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    !currentSection || activeStep >= currentSection.steps.length - 1
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}