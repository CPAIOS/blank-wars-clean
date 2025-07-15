'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Heart, Users, Target, Clock, Star, Award,
  Play, TrendingUp,
  TrendingDown, Activity, Zap, Shield, Book, Crown,
  Eye, RotateCcw, ArrowRight
} from 'lucide-react';
import { 
  TrainingSystemManager, 
  TrainingActivity, 
  CharacterTrainingState, 
  TrainingSession,
  trainingActivities 
} from '../systems/trainingSystem';
import EventPublisher from '../services/eventPublisher';

export default function TrainingInterface() {
  const [trainingManager] = useState(() => TrainingSystemManager.loadProgress());
  const [selectedCharacter, setSelectedCharacter] = useState<string>('achilles');
  const eventPublisher = EventPublisher.getInstance();
  const [characterState, setCharacterState] = useState<CharacterTrainingState | null>(null);
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);
  const [recommendations, setRecommendations] = useState<TrainingActivity[]>([]);
  const [showActivityDetails, setShowActivityDetails] = useState<string | null>(null);
  const [sessionTimer, setSessionTimer] = useState<number>(0);

  // Available characters for training
  const availableCharacters = ['achilles', 'sherlock-holmes', 'dracula', 'thor', 'cleopatra'];

  useEffect(() => {
    // Initialize character if not already done
    trainingManager.initializeCharacter(selectedCharacter);
    
    // Update state
    setCharacterState(trainingManager.getCharacterState(selectedCharacter));
    setActiveSession(trainingManager.getActiveSession(selectedCharacter));
    setRecommendations(trainingManager.getRecommendations(selectedCharacter));
  }, [selectedCharacter, trainingManager]);

  useEffect(() => {
    // Timer for active training sessions
    let interval: NodeJS.Timeout;
    
    if (activeSession && !activeSession.completed) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - activeSession.startTime.getTime()) / 1000 / 60; // minutes
        const remaining = Math.max(0, activeSession.duration - elapsed);
        setSessionTimer(remaining);
        
        if (remaining <= 0) {
          handleCompleteTraining();
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession, handleCompleteTraining]);

  const handleStartTraining = (activityId: string) => {
    const session = trainingManager.startTraining(selectedCharacter, activityId);
    if (session) {
      setActiveSession(session);
      setCharacterState(trainingManager.getCharacterState(selectedCharacter));
      trainingManager.saveToStorage();
    }
  };

  const handleCompleteTraining = useCallback(async () => {
    const results = trainingManager.completeTraining(selectedCharacter);
    if (results) {
      setActiveSession(null);
      setCharacterState(trainingManager.getCharacterState(selectedCharacter));
      setRecommendations(trainingManager.getRecommendations(selectedCharacter));
      trainingManager.saveToStorage();
      
      // Publish training event to centralized system
      try {
        await eventPublisher.publishTrainingSession({
          characterId: selectedCharacter,
          trainingType: results.activity?.category || 'general',
          skillsFocused: results.activity ? [results.activity.name] : [],
          improvement: results.statImprovements ? 'significant' : 'minimal',
          mentalFatigue: results.mentalFatigue || 0,
          partnerCharacterId: undefined // Solo training
        });
        console.log('✅ Training event published to centralized system');
      } catch (error) {
        console.warn('❌ Failed to publish training event:', error);
      }
      
      // Show completion notification
      console.log('Training completed:', results);
    }
  }, [trainingManager, selectedCharacter, eventPublisher]);

  const getCharacterIcon = (characterId: string) => {
    switch (characterId) {
      case 'achilles':
        return <Shield className="w-5 h-5 text-red-400" />;
      case 'sherlock-holmes':
        return <Eye className="w-5 h-5 text-blue-400" />;
      case 'dracula':
        return <Crown className="w-5 h-5 text-purple-400" />;
      case 'thor':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'cleopatra':
        return <Star className="w-5 h-5 text-gold" />;
      default:
        return <Users className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mental-health':
        return <Heart className="w-5 h-5 text-pink-400" />;
      case 'therapy':
        return <Brain className="w-5 h-5 text-purple-400" />;
      case 'skill-development':
        return <Target className="w-5 h-5 text-blue-400" />;
      case 'relationship':
        return <Users className="w-5 h-5 text-green-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mental-health':
        return 'border-pink-400/50 bg-pink-900/20';
      case 'therapy':
        return 'border-purple-400/50 bg-purple-900/20';
      case 'skill-development':
        return 'border-blue-400/50 bg-blue-900/20';
      case 'relationship':
        return 'border-green-400/50 bg-green-900/20';
      default:
        return 'border-gray-400/50 bg-gray-900/20';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getHealthColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    if (value >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  if (!characterState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-xl text-gray-300">Loading Training System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent">
            Character Training Center
          </h1>
          <p className="text-gray-300 text-lg">
            Develop your characters between battles through specialized training programs
          </p>
        </motion.div>

        {/* Character Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Select Character</h2>
          <div className="flex gap-4 flex-wrap">
            {availableCharacters.map((characterId) => (
              <motion.button
                key={characterId}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedCharacter === characterId
                    ? 'border-purple-400 bg-purple-900/50'
                    : 'border-gray-600 bg-gray-800/50 hover:border-purple-500'
                }`}
                onClick={() => setSelectedCharacter(characterId)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {getCharacterIcon(characterId)}
                <span className="font-medium capitalize">{characterId.replace('-', ' ')}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Character Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Mental Health Overview */}
          <motion.div 
            className="bg-gray-800/50 rounded-xl p-6 border border-purple-500/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Brain className="text-pink-400" />
              Mental Health Status
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>Mental Health</span>
                  <span className={`font-bold ${getHealthColor(characterState.mentalHealth)}`}>
                    {characterState.mentalHealth}%
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      characterState.mentalHealth >= 80 ? 'bg-green-400' :
                      characterState.mentalHealth >= 60 ? 'bg-yellow-400' :
                      characterState.mentalHealth >= 40 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${characterState.mentalHealth}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>Stress Level</span>
                  <span className={`font-bold ${getHealthColor(100 - characterState.stressLevel)}`}>
                    {characterState.stressLevel}%
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      characterState.stressLevel <= 20 ? 'bg-green-400' :
                      characterState.stressLevel <= 40 ? 'bg-yellow-400' :
                      characterState.stressLevel <= 60 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${characterState.stressLevel}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span>Focus Level</span>
                  <span className={`font-bold ${getHealthColor(characterState.focusLevel)}`}>
                    {characterState.focusLevel}%
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      characterState.focusLevel >= 80 ? 'bg-green-400' :
                      characterState.focusLevel >= 60 ? 'bg-yellow-400' :
                      characterState.focusLevel >= 40 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${characterState.focusLevel}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Training Progress */}
          <motion.div 
            className="bg-gray-800/50 rounded-xl p-6 border border-purple-500/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Award className="text-gold" />
              Training Progress
            </h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{characterState.trainingPoints}</div>
                <div className="text-gray-400">Training Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{characterState.completedSessions}</div>
                <div className="text-gray-400">Completed Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{characterState.specializations.length}</div>
                <div className="text-gray-400">Specializations</div>
              </div>
            </div>
          </motion.div>

          {/* Active Session */}
          <motion.div 
            className="bg-gray-800/50 rounded-xl p-6 border border-purple-500/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="text-orange-400" />
              Current Training
            </h3>
            {activeSession ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {formatTime(sessionTimer)}
                  </div>
                  <div className="text-gray-400">Time Remaining</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">
                    {trainingActivities.find(a => a.id === activeSession.activityId)?.name}
                  </div>
                  <div className="text-sm text-gray-400">In Progress</div>
                </div>
                <button
                  onClick={handleCompleteTraining}
                  className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Complete Early
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active training session</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Star className="text-yellow-400" />
              Recommended Training
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((activity) => (
                <motion.div
                  key={activity.id}
                  className={`rounded-lg p-4 border-2 ${getCategoryColor(activity.category)}`}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(activity.category)}
                    <span className="font-medium">{activity.name}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{activity.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{formatTime(activity.duration)}</span>
                    <button
                      onClick={() => handleStartTraining(activity.id)}
                      disabled={!!activeSession || characterState.trainingPoints < activity.cost}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded text-sm transition-colors"
                    >
                      {activity.cost} pts
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* All Training Activities */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Book className="text-blue-400" />
            All Training Activities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainingActivities
              .filter(activity => characterState.availableActivities.includes(activity.id))
              .map((activity) => (
                <motion.div
                  key={activity.id}
                  className={`rounded-xl p-6 border-2 transition-all cursor-pointer ${getCategoryColor(activity.category)}`}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowActivityDetails(activity.id)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {getCategoryIcon(activity.category)}
                    <div>
                      <h3 className="font-bold">{activity.name}</h3>
                      <p className="text-sm text-gray-400 capitalize">{activity.category.replace('-', ' ')}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-4">{activity.description}</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(activity.duration)}
                    </span>
                    <span className="text-sm text-gray-400">
                      {activity.cost} training points
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartTraining(activity.id);
                    }}
                    disabled={!!activeSession || characterState.trainingPoints < activity.cost}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Training
                  </button>
                </motion.div>
              ))}
          </div>
        </motion.div>

        {/* Activity Details Modal */}
        <AnimatePresence>
          {showActivityDetails && (
            <motion.div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActivityDetails(null)}
            >
              <motion.div
                className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full border border-purple-500/50"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const activity = trainingActivities.find(a => a.id === showActivityDetails);
                  if (!activity) return null;
                  
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        {getCategoryIcon(activity.category)}
                        <h2 className="text-2xl font-bold">{activity.name}</h2>
                      </div>
                      
                      <p className="text-gray-300 mb-6">{activity.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <h3 className="font-semibold mb-2">Training Details</h3>
                          <ul className="space-y-1 text-sm text-gray-300">
                            <li>Duration: {formatTime(activity.duration)}</li>
                            <li>Cost: {activity.cost} training points</li>
                            <li>Category: {activity.category.replace('-', ' ')}</li>
                            <li>Unlock Level: {activity.unlockLevel}</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-2">Training Effects</h3>
                          <ul className="space-y-1 text-sm">
                            {activity.effects.map((effect, index) => (
                              <li key={index} className="flex items-center gap-2">
                                {effect.change > 0 ? (
                                  <TrendingUp className="w-4 h-4 text-green-400" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-400" />
                                )}
                                <span className="text-gray-300">{effect.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <button
                          onClick={() => setShowActivityDetails(null)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            handleStartTraining(activity.id);
                            setShowActivityDetails(null);
                          }}
                          disabled={!!activeSession || characterState.trainingPoints < activity.cost}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
                        >
                          Start Training
                        </button>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}