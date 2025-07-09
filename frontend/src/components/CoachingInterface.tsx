'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Clock, AlertTriangle, Heart, Brain, 
  Users, Target, CheckCircle, XCircle, Pause, Play,
  TrendingUp, TrendingDown, Activity, Zap
} from 'lucide-react';

import { BattleCharacter, CoachingTimeout, TimeoutAction } from '@/data/battleFlow';

interface CoachingInterfaceProps {
  character: BattleCharacter;
  isTimeoutActive?: boolean;
  timeRemaining?: number;
  onCoachingAction: (action: CoachingAction) => void;
  onCloseCoaching: () => void;
}

interface CoachingAction {
  type: 'motivational_speech' | 'tactical_adjustment' | 'conflict_resolution' | 'confidence_boost' | 'mental_health_support';
  targetCharacters: string[];
  message: string;
  intensity: 'gentle' | 'firm' | 'intense';
}

interface CoachingSessionData {
  coachingMessages: string[];
  characterResponses: string[];
  sessionActive: boolean;
  sessionType: string;
  timeSpent: number;
  effectiveness: number;
}

export default function CoachingInterface({ 
  character, 
  isTimeoutActive = false, 
  timeRemaining = 0,
  onCoachingAction,
  onCloseCoaching 
}: CoachingInterfaceProps) {
  const [sessionData, setSessionData] = useState<CoachingSessionData>({
    coachingMessages: [],
    characterResponses: [],
    sessionActive: false,
    sessionType: '',
    timeSpent: 0,
    effectiveness: 0
  });
  
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedCoachingType, setSelectedCoachingType] = useState<CoachingAction['type'] | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<CoachingAction['intensity']>('gentle');
  const [isCharacterTyping, setIsCharacterTyping] = useState(false);
  const [showEffectivenessMetrics, setShowEffectivenessMetrics] = useState(false);

  // Simulate character response based on their psychology
  const generateCharacterResponse = (coachingType: string, message: string, intensity: string): string => {
    const mental = character.mentalState;
    const personality = character.character.personality;
    
    // High stress characters respond differently
    if (mental.stress > 70) {
      if (intensity === 'intense') {
        return "I can't handle pressure right now! Give me space!";
      } else if (coachingType === 'mental_health_support') {
        return "Thank you... I really needed to hear that.";
      }
    }

    // Low gameplan adherence characters are more resistant
    if (character.gameplanAdherence < 40) {
      if (intensity === 'firm' || intensity === 'intense') {
        return "You can't tell me what to do! I know what I'm doing!";
      } else {
        return "I'll consider it, but I still think my way is better.";
      }
    }

    // High ego characters
    if (personality.traits.includes('Prideful')) {
      if (coachingType === 'confidence_boost') {
        return "Of course I'm great! Tell me something I don't know.";
      } else if (coachingType === 'tactical_adjustment') {
        return "Your strategy is... adequate. I'll make it work.";
      }
    }

    // Default positive responses for well-adjusted characters
    const positiveResponses = [
      "I understand, coach. I'll do my best.",
      "That makes sense. Thanks for the guidance.",
      "You're right. Let me adjust my approach.",
      "I appreciate the coaching. I'll implement that.",
      "Good point. I was getting too caught up in the moment."
    ];

    return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
  };

  const handleCoachingAction = async (type: CoachingAction['type'], message: string) => {
    if (!message.trim()) return;

    // Add coach message
    setSessionData(prev => ({
      ...prev,
      coachingMessages: [...prev.coachingMessages, message],
      sessionActive: true,
      sessionType: type,
      timeSpent: prev.timeSpent + 1
    }));

    setIsCharacterTyping(true);

    // Real API call to individual coaching service
    const sendCoachingRequest = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        
        const response = await fetch(`${BACKEND_URL}/coaching/individual`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            characterId: character.character.id,
            message,
            type,
            intensity: selectedIntensity,
            context: {
              mentalState: character.mentalState,
              bondLevel: character.bondLevel || 50,
              previousMessages: sessionData.characterResponses.slice(-3)
            }
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        setSessionData(prev => ({
          ...prev,
          characterResponses: [...prev.characterResponses, data.message],
          effectiveness: calculateEffectiveness(type, selectedIntensity, character)
        }));

        setIsCharacterTyping(false);
      } catch (error) {
        console.error('Individual coaching error:', error);
        // Fallback to ensure UI doesn't break
        setSessionData(prev => ({
          ...prev,
          characterResponses: [...prev.characterResponses, "I'm having trouble responding right now. Please try again."],
          effectiveness: calculateEffectiveness(type, selectedIntensity, character)
        }));
        setIsCharacterTyping(false);
      }
    };

    sendCoachingRequest();

    // Trigger parent callback
    onCoachingAction({
      type,
      targetCharacters: [character.character.id],
      message,
      intensity: selectedIntensity
    });

    setCurrentMessage('');
  };

  const calculateEffectiveness = (type: string, intensity: string, char: BattleCharacter): number => {
    let effectiveness = 50; // Base effectiveness

    const mental = char.mentalState;
    const gameplanAdherence = char.gameplanAdherence;

    // Adjust based on character state
    if (mental.stress > 70 && type === 'mental_health_support') effectiveness += 30;
    if (mental.currentMentalHealth < 40 && type === 'confidence_boost') effectiveness += 25;
    if (gameplanAdherence < 50 && intensity === 'gentle') effectiveness += 20;
    if (gameplanAdherence > 80 && intensity === 'firm') effectiveness += 15;

    // Adjust based on personality
    if (char.character.personality.traits.includes('Loyal') && type === 'motivational_speech') effectiveness += 20;
    if (char.character.personality.traits.includes('Stubborn') && intensity === 'intense') effectiveness -= 25;
    if (char.character.personality.traits.includes('Analytical') && type === 'tactical_adjustment') effectiveness += 15;

    return Math.max(10, Math.min(100, effectiveness));
  };

  const getCoachingOptions = () => {
    const options = [];
    const mental = character.mentalState;

    // Mental Health Support (always available but more effective when needed)
    options.push({
      type: 'mental_health_support' as const,
      title: '🧠 Mental Health Support',
      description: 'Address psychological stress and trauma',
      urgency: mental.currentMentalHealth < 40 ? 'high' : mental.currentMentalHealth < 70 ? 'medium' : 'low',
      effectiveness: calculateEffectiveness('mental_health_support', selectedIntensity, character)
    });

    // Motivational Speech
    options.push({
      type: 'motivational_speech' as const,
      title: '🎯 Motivational Speech',
      description: 'Boost morale and fighting spirit',
      urgency: mental.confidence < 50 ? 'high' : 'medium',
      effectiveness: calculateEffectiveness('motivational_speech', selectedIntensity, character)
    });

    // Tactical Adjustment
    options.push({
      type: 'tactical_adjustment' as const,
      title: '📋 Tactical Adjustment',
      description: 'Refine strategy and approach',
      urgency: character.battlePerformance.strategyDeviations > 0 ? 'high' : 'medium',
      effectiveness: calculateEffectiveness('tactical_adjustment', selectedIntensity, character)
    });

    // Conflict Resolution (if there are relationship issues)
    const hasConflicts = character.relationshipModifiers.some(rel => rel.strength < -30);
    if (hasConflicts) {
      options.push({
        type: 'conflict_resolution' as const,
        title: '🤝 Conflict Resolution',
        description: 'Address team relationship issues',
        urgency: 'high',
        effectiveness: calculateEffectiveness('conflict_resolution', selectedIntensity, character)
      });
    }

    // Confidence Boost
    options.push({
      type: 'confidence_boost' as const,
      title: '✨ Confidence Boost',
      description: 'Reinforce self-belief and capabilities',
      urgency: mental.confidence < 40 ? 'high' : 'low',
      effectiveness: calculateEffectiveness('confidence_boost', selectedIntensity, character)
    });

    return options.sort((a, b) => {
      const urgencyOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-500/50 bg-red-600/20';
      case 'medium': return 'border-yellow-500/50 bg-yellow-600/20';
      case 'low': return 'border-green-500/50 bg-green-600/20';
      default: return 'border-gray-500/50 bg-gray-600/20';
    }
  };

  const coachingOptions = getCoachingOptions();

  return (
    <motion.div
      className="bg-gradient-to-r from-green-900/40 to-blue-900/40 rounded-xl p-6 backdrop-blur-sm border border-green-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{character.character.avatar}</div>
          <div>
            <h2 className="text-xl font-bold text-white">Coaching: {character.character.name}</h2>
            <p className="text-green-200">
              {isTimeoutActive ? 'Timeout Session' : 'Individual Coaching'}
            </p>
          </div>
        </div>

        {/* Timer and Controls */}
        <div className="flex items-center gap-4">
          {isTimeoutActive && timeRemaining > 0 && (
            <div className="bg-yellow-600 text-white px-3 py-1 rounded-lg font-bold">
              <Clock className="w-4 h-4 inline mr-1" />
              {timeRemaining}s
            </div>
          )}
          
          <button
            onClick={() => setShowEffectivenessMetrics(!showEffectivenessMetrics)}
            className="p-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-lg transition-all"
            title="Toggle Metrics"
          >
            <Activity className="w-4 h-4 text-blue-400" />
          </button>

          <button
            onClick={onCloseCoaching}
            className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-all"
          >
            <XCircle className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Character Psychology Status */}
        <div className="bg-black/40 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Psychology Status
          </h3>
          
          <div className="space-y-3">
            {/* Mental Health */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">Mental Health</span>
                <span className={`text-sm font-bold ${
                  character.mentalState.currentMentalHealth >= 70 ? 'text-green-400' :
                  character.mentalState.currentMentalHealth >= 40 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {character.mentalState.currentMentalHealth}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-full rounded-full transition-all ${
                    character.mentalState.currentMentalHealth >= 70 ? 'bg-green-500' :
                    character.mentalState.currentMentalHealth >= 40 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${character.mentalState.currentMentalHealth}%` }}
                />
              </div>
            </div>

            {/* Stress Level */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">Stress Level</span>
                <span className="text-sm font-bold text-red-400">
                  {character.mentalState.stress}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="h-full rounded-full bg-red-500 transition-all"
                  style={{ width: `${character.mentalState.stress}%` }}
                />
              </div>
            </div>

            {/* Strategy Adherence Level */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">Strategy Adherence</span>
                <span className={`text-sm font-bold ${
                  character.gameplanAdherence >= 70 ? 'text-blue-400' :
                  character.gameplanAdherence >= 40 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {character.gameplanAdherence}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-full rounded-full transition-all ${
                    character.gameplanAdherence >= 70 ? 'bg-blue-500' :
                    character.gameplanAdherence >= 40 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${character.gameplanAdherence}%` }}
                />
              </div>
            </div>

            {/* Team Trust */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">Team Trust</span>
                <span className="text-sm font-bold text-purple-400">
                  {character.mentalState.teamTrust}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${character.mentalState.teamTrust}%` }}
                />
              </div>
            </div>
          </div>

          {/* Personality Traits */}
          <div className="mt-4 pt-4 border-t border-gray-600">
            <h4 className="text-sm font-semibold text-white mb-2">Personality</h4>
            <div className="flex flex-wrap gap-1">
              {character.character.personality.traits.slice(0, 4).map((trait, idx) => (
                <span key={idx} className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded">
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Coaching Options */}
        <div className="bg-black/40 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Coaching Options
          </h3>

          {/* Intensity Selector */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">Coaching Intensity:</label>
            <div className="flex gap-2">
              {['gentle', 'firm', 'intense'].map((intensity) => (
                <button
                  key={intensity}
                  onClick={() => setSelectedIntensity(intensity as CoachingAction['intensity'])}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    selectedIntensity === intensity
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600/50 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Coaching Action Buttons */}
          <div className="space-y-2">
            {coachingOptions.map((option, idx) => (
              <button
                key={option.type}
                onClick={() => setSelectedCoachingType(option.type)}
                className={`w-full p-3 rounded-lg text-left transition-all border ${
                  selectedCoachingType === option.type 
                    ? 'bg-blue-600/30 border-blue-500' 
                    : getUrgencyColor(option.urgency)
                } hover:opacity-80`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="text-white font-medium text-sm">{option.title}</div>
                  <div className="flex items-center gap-1">
                    {option.urgency === 'high' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                    <span className="text-xs text-gray-400">{option.effectiveness}%</span>
                  </div>
                </div>
                <div className="text-gray-400 text-xs">{option.description}</div>
              </button>
            ))}
          </div>

          {/* Custom Message Input */}
          {selectedCoachingType && (
            <motion.div 
              className="mt-4 pt-4 border-t border-gray-600"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <label className="text-sm text-gray-400 mb-2 block">Your Message:</label>
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder={`Type your ${selectedCoachingType.replace('_', ' ')} message...`}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm resize-none"
                rows={3}
              />
              <button
                onClick={() => handleCoachingAction(selectedCoachingType, currentMessage)}
                disabled={!currentMessage.trim() || isCharacterTyping}
                className="w-full mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-all"
              >
                {isCharacterTyping ? 'Character Responding...' : 'Send Coaching Message'}
              </button>
            </motion.div>
          )}
        </div>

        {/* Conversation & Metrics */}
        <div className="bg-black/40 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Session Log
          </h3>

          {/* Effectiveness Metrics */}
          {showEffectivenessMetrics && sessionData.sessionActive && (
            <motion.div 
              className="mb-4 p-3 bg-blue-600/20 rounded border border-blue-500/50"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <h4 className="text-sm font-semibold text-white mb-2">Session Metrics</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Effectiveness:</span>
                  <span className={`font-bold ${
                    sessionData.effectiveness >= 70 ? 'text-green-400' :
                    sessionData.effectiveness >= 40 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {sessionData.effectiveness}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Spent:</span>
                  <span className="text-blue-400">{sessionData.timeSpent}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Messages:</span>
                  <span className="text-purple-400">{sessionData.coachingMessages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-gray-300 capitalize">{sessionData.sessionType.replace('_', ' ')}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Conversation History */}
          <div className="h-64 overflow-y-auto space-y-2">
            {sessionData.coachingMessages.length === 0 ? (
              <div className="text-gray-400 text-center py-8 text-sm">
                Start a coaching conversation...
              </div>
            ) : (
              sessionData.coachingMessages.map((message, idx) => (
                <div key={idx} className="space-y-2">
                  {/* Coach Message */}
                  <motion.div 
                    className="bg-green-600/20 border-l-4 border-green-500 p-2 rounded-r"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="text-xs text-green-400 mb-1">Coach:</div>
                    <div className="text-white text-sm">{message}</div>
                  </motion.div>

                  {/* Character Response */}
                  {sessionData.characterResponses[idx] && (
                    <motion.div 
                      className="bg-blue-600/20 border-l-4 border-blue-500 p-2 rounded-r ml-4"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-xs text-blue-400 mb-1">{character.character.name}:</div>
                      <div className="text-white text-sm">{sessionData.characterResponses[idx]}</div>
                    </motion.div>
                  )}
                </div>
              ))
            )}

            {/* Character Typing Indicator */}
            {isCharacterTyping && (
              <motion.div 
                className="bg-gray-600/20 border-l-4 border-gray-500 p-2 rounded-r ml-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-xs text-gray-400 mb-1">{character.character.name}:</div>
                <div className="text-gray-300 text-sm italic">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}