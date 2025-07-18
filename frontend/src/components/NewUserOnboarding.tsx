'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Star, 
  Trophy, 
  Heart,
  Target,
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';

interface NewUserOnboardingProps {
  onComplete: (starterCharacters: any[]) => void;
  username: string;
}

export default function NewUserOnboarding({ onComplete, username }: NewUserOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: `Welcome to WiseSage, ${username}!`,
      description: "You're about to embark on an epic journey where psychology meets legendary battles.",
      icon: Users,
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🏹</div>
          <p className="text-lg text-gray-300">
            In WiseSage, you don't just command characters - you coach them through their psychological challenges.
          </p>
        </div>
      )
    },
    {
      title: "Your Starter Pack",
      description: "You'll receive 3 legendary characters to begin your journey.",
      icon: Target,
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">📦</div>
          <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-lg p-6">
            <h3 className="text-xl font-bold text-indigo-400 mb-2">Starter Pack Contents</h3>
            <p className="text-lg text-white mb-2">3 Random Characters</p>
            <p className="text-sm text-gray-300">Each with unique abilities and personalities</p>
          </div>
          <p className="text-gray-300">
            Your starter characters will help you learn the psychology system and strategic team building.
          </p>
        </div>
      )
    },
    {
      title: "The Psychology System",
      description: "Guide your characters through mental challenges and watch them grow stronger.",
      icon: Heart,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Heart className="w-5 h-5 text-red-400" />
                <span className="font-semibold">Morale</span>
              </div>
              <p className="text-sm text-gray-400">Keep your team's spirits high through encouragement and strategic decisions.</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-blue-400" />
                <span className="font-semibold">Strategy</span>
              </div>
              <p className="text-sm text-gray-400">Coach characters to overcome their psychological tendencies in battle.</p>
            </div>
          </div>
          <p className="text-center text-gray-300">
            Your starter champions will teach you how different personalities respond to coaching styles.
          </p>
        </div>
      )
    },
    {
      title: "Ready for Adventure!",
      description: "Your starter champions are now in your collection. Time to begin your first campaign!",
      icon: Trophy,
      content: (
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="text-6xl mb-4">✨</div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-0 left-1/2 transform -translate-x-1/2"
            >
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </motion.div>
          </div>
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-green-400">Character Acquired!</span>
            </div>
            <p className="text-green-300">Robin Hood has joined your collection</p>
          </div>
          <p className="text-gray-300">
            Your journey begins in Sherwood Forest, where you'll learn to guide Robin through his first battle.
          </p>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete([]);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full mx-4 p-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/10 to-transparent rounded-full -mr-16 -mt-16" />
        
        {/* Progress indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-green-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-green-600/20 rounded-full p-4">
                <IconComponent className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h2>
            <p className="text-gray-400 mb-6">{currentStepData.description}</p>
            
            <div className="mb-8">
              {currentStepData.content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              currentStep === 0
                ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                : 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white'
            }`}
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {steps.length}
          </span>
          
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>{currentStep === steps.length - 1 ? 'Begin Adventure' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}