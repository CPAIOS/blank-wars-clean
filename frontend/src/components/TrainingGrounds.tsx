'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Dumbbell, 
  Target, 
  Brain, 
  Zap, 
  Clock, 
  Star, 
  TrendingUp, 
  Play, 
  Pause, 
  Award,
  Coins,
  Battery,
  Heart,
  Sparkles,
  BookOpen,
  MessageCircle,
  Send,
  User,
  Users,
} from 'lucide-react';

interface TrainingGroundsProps {
  globalSelectedCharacterId: string;
  setGlobalSelectedCharacterId: (id: string) => void;
  selectedCharacter: any;
  availableCharacters: any[];
}

export default function TrainingGrounds({ 
  globalSelectedCharacterId, 
  setGlobalSelectedCharacterId, 
  selectedCharacter: globalCharacter, 
  availableCharacters 
}: TrainingGroundsProps) {
  
  // Early return if no character selected
  if (!globalCharacter) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Character Selected</h3>
          <p className="text-gray-500">
            Please select a character from the sidebar to begin training.
          </p>
        </div>
      </div>
    );
  }

  // Local state for training session
  const [isTraining, setIsTraining] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingTimeLeft, setTrainingTimeLeft] = useState(0);
  const [dailyTrainingSessions, setDailyTrainingSessions] = useState(0);
  const [trainingPoints, setTrainingPoints] = useState(0);

  // Basic training activities
  const trainingActivities = [
    {
      id: 'strength_basic',
      name: 'Weapon Mastery',
      description: 'Practice combat techniques to increase attack power',
      type: 'strength',
      duration: 30,
      energyCost: 15,
      xpGain: 50,
      statBonus: 1,
      icon: Dumbbell,
      difficulty: 'easy',
      requirements: { level: 1 }
    },
    {
      id: 'defense_basic',
      name: 'Shield Training',
      description: 'Learn defensive stances and blocking techniques',
      type: 'defense',
      duration: 25,
      energyCost: 12,
      xpGain: 45,
      statBonus: 1,
      icon: Target,
      difficulty: 'easy',
      requirements: { level: 1 }
    },
    {
      id: 'speed_basic',
      name: 'Agility Course',
      description: 'Run through obstacle courses to improve speed',
      type: 'speed',
      duration: 20,
      energyCost: 18,
      xpGain: 40,
      statBonus: 1,
      icon: Zap,
      difficulty: 'easy',
      requirements: { level: 1 }
    },
    {
      id: 'special_basic',
      name: 'Mental Focus',
      description: 'Meditation and concentration exercises',
      type: 'special',
      duration: 35,
      energyCost: 10,
      xpGain: 55,
      statBonus: 1,
      icon: Brain,
      difficulty: 'medium',
      requirements: { level: 5 }
    }
  ];

  // Safe character data access
  const currentCharacter = useMemo(() => {
    if (!globalCharacter) return null;
    
    return {
      id: globalCharacter.baseName || globalCharacter.id,
      name: globalCharacter.name,
      level: globalCharacter.level || 1,
      energy: globalCharacter.energy || 75,
      maxEnergy: globalCharacter.maxEnergy || 100,
      avatar: globalCharacter.avatar,
      archetype: globalCharacter.archetype,
      baseStats: {
        strength: globalCharacter.baseStats?.strength || globalCharacter.base_attack || 50,
        vitality: globalCharacter.baseStats?.vitality || globalCharacter.base_health || 50,
        agility: globalCharacter.baseStats?.agility || globalCharacter.base_speed || 50,
        intelligence: globalCharacter.baseStats?.intelligence || globalCharacter.base_special || 50
      }
    };
  }, [globalCharacter]);

  // Available activities based on character
  const availableActivities = useMemo(() => {
    if (!currentCharacter) return [];
    
    return trainingActivities.filter(activity => {
      const meetsLevel = currentCharacter.level >= activity.requirements.level;
      const hasEnergy = currentCharacter.energy >= activity.energyCost;
      return meetsLevel && hasEnergy;
    });
  }, [currentCharacter, trainingActivities]);

  // Start training function
  const startTraining = useCallback((activity: any) => {
    if (!currentCharacter || currentCharacter.energy < activity.energyCost || isTraining) return;
    
    setCurrentActivity(activity);
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingTimeLeft(activity.duration);
    setDailyTrainingSessions(prev => prev + 1);
  }, [currentCharacter, isTraining]);

  // Complete training function
  const completeTraining = useCallback(() => {
    if (!currentActivity) return;
    
    setTrainingPoints(prev => prev + 10);
    setIsTraining(false);
    setCurrentActivity(null);
    setTrainingProgress(0);
  }, [currentActivity]);

  // Training timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTraining && trainingTimeLeft > 0) {
      interval = setInterval(() => {
        setTrainingTimeLeft(prev => {
          const newTime = prev - 1;
          setTrainingProgress(((currentActivity?.duration || 0) - newTime) / (currentActivity?.duration || 1) * 100);
          return newTime;
        });
      }, 1000);
    } else if (trainingTimeLeft === 0 && isTraining) {
      completeTraining();
    }
    
    return () => clearInterval(interval);
  }, [isTraining, trainingTimeLeft, completeTraining, currentActivity?.duration]);

  // Stop training early
  const stopTraining = () => {
    setIsTraining(false);
    setCurrentActivity(null);
    setTrainingProgress(0);
    setTrainingTimeLeft(0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'hard': return 'text-orange-400 bg-orange-400/10';
      case 'extreme': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Dumbbell className="w-8 h-8 text-orange-400" />
          Training Grounds
          <Dumbbell className="w-8 h-8 text-orange-400" />
        </h1>
        <p className="text-gray-400 text-lg">
          Strengthen your warriors through focused training and unlock their true potential
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Character Info Panel */}
        <div className="lg:col-span-1">
          <motion.div 
            className="bg-gray-900/50 rounded-xl border border-gray-700 p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">{currentCharacter?.avatar}</div>
              <h3 className="text-2xl font-bold text-white">{currentCharacter?.name}</h3>
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <Star className="w-4 h-4" />
                <span>Level {currentCharacter?.level}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Strength</span>
                <span className="text-red-400 font-bold">{currentCharacter?.baseStats?.strength}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Vitality</span>
                <span className="text-blue-400 font-bold">{currentCharacter?.baseStats?.vitality}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Agility</span>
                <span className="text-green-400 font-bold">{currentCharacter?.baseStats?.agility}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Intelligence</span>
                <span className="text-purple-400 font-bold">{currentCharacter?.baseStats?.intelligence}</span>
              </div>
            </div>

            {/* Energy */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span className="flex items-center gap-1">
                  <Battery className="w-4 h-4" />
                  Energy
                </span>
                <span>{currentCharacter?.energy}/{currentCharacter?.maxEnergy}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(currentCharacter?.energy / currentCharacter?.maxEnergy) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Training Stats */}
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-white">
                Sessions Today: {dailyTrainingSessions}
              </div>
              <div className="text-sm text-yellow-400 flex items-center gap-1">
                <Star className="w-3 h-3" />
                Training Points: {trainingPoints}
              </div>
            </div>
          </motion.div>

          {/* Current Training Status */}
          {isTraining && currentActivity && (
            <motion.div 
              className="bg-orange-900/30 border border-orange-500/50 rounded-xl p-6 mt-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-center">
                <div className="text-orange-400 text-xl mb-2">Training in Progress</div>
                <div className="text-white font-bold text-lg mb-3">{currentActivity.name}</div>
                
                {/* Progress Circle */}
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-gray-700"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - trainingProgress / 100)}`}
                      className="text-orange-400 transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold">{Math.round(trainingProgress)}%</span>
                  </div>
                </div>

                <div className="text-gray-300 mb-4">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatTime(trainingTimeLeft)} remaining
                </div>

                <button
                  onClick={stopTraining}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                  <Pause className="w-4 h-4" />
                  Stop Training
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Training Activities */}
        <div className="lg:col-span-3">
          <motion.div 
            className="bg-gray-900/50 rounded-xl border border-gray-700 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              Available Training
            </h2>

            <div className="grid gap-4">
              {availableActivities.map((activity) => {
                const Icon = activity.icon;
                const canStartTraining = !isTraining && currentCharacter && currentCharacter.energy >= activity.energyCost;
                
                return (
                  <motion.div
                    key={activity.id}
                    className={`border rounded-xl p-4 transition-all ${
                      canStartTraining 
                        ? 'border-gray-600 hover:border-blue-500 cursor-pointer' 
                        : 'border-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                    whileHover={canStartTraining ? { scale: 1.02 } : {}}
                    onClick={() => canStartTraining && startTraining(activity)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="bg-gray-700 p-3 rounded-lg">
                          <Icon className="w-6 h-6 text-blue-400" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{activity.name}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getDifficultyColor(activity.difficulty)}`}>
                              {activity.difficulty.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-3">{activity.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-300">{formatTime(activity.duration)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Battery className="w-3 h-3 text-yellow-400" />
                              <span className="text-yellow-400">{activity.energyCost} Energy</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-blue-400" />
                              <span className="text-blue-400">+{activity.xpGain} XP</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-green-400" />
                              <span className="text-green-400">
                                +{activity.statBonus} {activity.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {canStartTraining && (
                        <div className="ml-4">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors">
                            <Play className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {availableActivities.length === 0 && (
              <div className="text-center py-12">
                <Battery className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Training Available</h3>
                <p className="text-gray-500">
                  Your character needs more energy or higher level to access training activities.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}