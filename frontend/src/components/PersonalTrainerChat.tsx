'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, Star, User, Dumbbell, Zap, Target, Brain, Flame } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { characterAPI } from '../services/apiClient';
import { Character } from '../data/characters';

interface Message {
  id: number;
  type: 'player' | 'character' | 'system';
  content: string;
  timestamp: Date;
  bondIncrease?: boolean;
}

interface EnhancedCharacter extends Character {
  baseName: string;
  displayBondLevel: number;
}


// Generate Argock's training recommendations to the COACH
const generateCoachRecommendations = (character: EnhancedCharacter): string[] => {
  const recommendations: string[] = [];
  const { baseStats, combatStats, archetype, level } = character;
  
  // Strength analysis for coach
  if (baseStats?.strength && baseStats.strength < 80) {
    recommendations.push(`Coach! ${character.name} needs strength training - weak like soggy bread! Recommend heavy lifting!`);
  }
  if (baseStats?.strength && baseStats.strength > 90) {
    recommendations.push(`Coach! ${character.name} has mighty strength but must maintain it! Power exercises!`);
  }
  
  // Speed analysis
  if (baseStats?.agility && baseStats.agility < 75) {
    recommendations.push(`Coach! ${character.name} moves like wounded bear! Agility drills needed!`);
  }
  
  // Defense analysis  
  if (baseStats?.vitality && baseStats.vitality < 70) {
    recommendations.push(`Coach! ${character.name} too soft! Endurance training will forge tougher warrior!`);
  }
  
  // Level-based recommendations
  if (level < 10) {
    recommendations.push(`Coach! Young ${character.name} needs basic conditioning - start with fundamentals!`);
  }
  if (level > 30) {
    recommendations.push(`Coach! ${character.name} ready for advanced training - time for REAL challenges!`);
  }
  
  // Archetype-specific recommendations
  if (archetype === 'warrior') {
    recommendations.push(`Coach! ${character.name} warrior type - focus on combat conditioning and weapon training!`);
  }
  if (archetype === 'mage') {
    recommendations.push(`Coach! ${character.name} mage needs physical training - brain strong but body weak like twig!`);
  }
  if (archetype === 'trickster') {
    recommendations.push(`Coach! ${character.name} trickster needs flexibility and core strength for sneaking!`);
  }
  
  return recommendations.slice(0, 6);
};

// Generate exercise options that can trigger trainer-character interactions
const generateExerciseOptions = (character: EnhancedCharacter): string[] => {
  const exercises: string[] = [];
  const { baseStats, archetype } = character;
  
  // Always available basic exercises
  exercises.push(`Start ${character.name} on cardio training`);
  exercises.push(`Have ${character.name} do strength training`);
  exercises.push(`Put ${character.name} through agility drills`);
  
  // Stat-specific exercises
  if (baseStats?.strength && baseStats.strength < 80) {
    exercises.push(`${character.name} needs heavy weightlifting session`);
  }
  if (baseStats?.agility && baseStats.agility < 75) {
    exercises.push(`${character.name} should do sprint intervals`);
  }
  if (baseStats?.vitality && baseStats.vitality < 70) {
    exercises.push(`${character.name} needs endurance conditioning`);
  }
  
  // Archetype-specific exercises
  if (archetype === 'warrior') {
    exercises.push(`Combat training for ${character.name}`);
  }
  if (archetype === 'mage') {
    exercises.push(`Physical conditioning for ${character.name}`);
  }
  if (archetype === 'trickster') {
    exercises.push(`Flexibility training for ${character.name}`);
  }
  
  return exercises.slice(0, 6);
};

interface PersonalTrainerChatProps {
  selectedCharacterId?: string;
  onCharacterChange?: (characterId: string) => void;
}

export default function PersonalTrainerChat({ 
  selectedCharacterId, 
  onCharacterChange 
}: PersonalTrainerChatProps) {
  const [availableCharacters, setAvailableCharacters] = useState<EnhancedCharacter[]>([]);
  const [globalSelectedCharacterId, setGlobalSelectedCharacterId] = useState(selectedCharacterId || 'achilles');
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [conversationMode, setConversationMode] = useState<'coach_consultation' | 'character_training'>('coach_consultation');
  const [currentExercise, setCurrentExercise] = useState<string | null>(null);


  // Load characters on component mount
  useEffect(() => {
    const loadCharacters = async () => {
      setCharactersLoading(true);
      try {
        const response = await characterAPI.getUserCharacters();
        const characters = response.characters || [];
        
        const enhancedCharacters = characters.map((char: any) => {
          const baseName = char.name?.toLowerCase() || char.id?.split('_')[0];
          return {
            ...char,
            baseName,
            displayBondLevel: char.bond_level,
            baseStats: {
              strength: char.base_attack,
              vitality: char.base_health,
              agility: char.base_speed,
              intelligence: char.base_special,
              wisdom: char.base_defense,
              charisma: char.bond_level
            },
            combatStats: {
              health: char.current_health,
              maxHealth: char.max_health,
              attack: char.base_attack,
              defense: char.base_defense,
              speed: char.base_speed,
              criticalChance: char.critical_chance,
              accuracy: char.accuracy
            },
            level: char.level,
            experience: char.experience,
            abilities: char.abilities,
            archetype: char.archetype,
            avatar: char.avatar_emoji,
            name: char.name,
            personalityTraits: char.personality_traits,
            speakingStyle: char.speaking_style,
            decisionMaking: char.decision_making,
            conflictResponse: char.conflict_response
          };
        });
        
        setAvailableCharacters(enhancedCharacters);
      } catch (error) {
        console.error('Failed to load characters:', error);
        setAvailableCharacters([]);
      }
      setCharactersLoading(false);
    };
    
    loadCharacters();
  }, []);

  // Update internal state when prop changes and clear messages
  useEffect(() => {
    if (selectedCharacterId && selectedCharacterId !== globalSelectedCharacterId) {
      setGlobalSelectedCharacterId(selectedCharacterId);
      setMessages([]);
      setInputMessage('');
      setIsTyping(false);
      // Reset to consultation mode when switching characters
      setConversationMode('coach_consultation');
      setCurrentExercise(null);
    }
  }, [selectedCharacterId, globalSelectedCharacterId]);
  
  const selectedCharacter = useMemo(() => {
    return availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
  }, [availableCharacters, globalSelectedCharacterId]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socketUrl = 'http://localhost:3006';
    console.log('🔌 [PersonalTrainer] Connecting to local backend:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ PersonalTrainer Socket connected! Waiting for authentication...');
    });

    socketRef.current.on('auth_success', (data: { userId: string; username: string }) => {
      console.log('🔐 PersonalTrainer Socket authenticated!', data);
      setConnected(true);
    });

    socketRef.current.on('auth_error', (error: { error: string }) => {
      console.error('❌ PersonalTrainer Socket authentication failed:', error);
      setConnected(false);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ PersonalTrainer Socket disconnected');
      setConnected(false);
    });

    socketRef.current.on('chat_response', (data: { character: string; message: string; bondIncrease?: boolean }) => {
      console.log('📨 PersonalTrainer response:', data);
      
      const characterMessage: Message = {
        id: Date.now(),
        type: 'character',
        content: data.message || 'ARGOCK THINKS ABOUT BEST TRAINING FOR YOU!',
        timestamp: new Date(),
        bondIncrease: data.bondIncrease || Math.random() > 0.7,
      };
      
      setMessages(prev => [...prev, characterMessage]);
      setIsTyping(false);
    });

    socketRef.current.on('chat_error', (error: { message: string }) => {
      console.error('❌ PersonalTrainer error:', error);
      setIsTyping(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate quick messages based on conversation mode
  const coachRecommendations = useMemo(() => {
    return selectedCharacter ? generateCoachRecommendations(selectedCharacter) : [];
  }, [selectedCharacter]);
  
  const exerciseOptions = useMemo(() => {
    return selectedCharacter ? generateExerciseOptions(selectedCharacter) : [];
  }, [selectedCharacter]);
  
  // Handle exercise selection (switches to character training mode)
  const startExercise = (exercise: string) => {
    setCurrentExercise(exercise);
    setConversationMode('character_training');
    
    // Send the exercise command which will trigger trainer-character interaction
    sendMessage(exercise);
  };
  
  // Return to coach consultation mode
  const returnToConsultation = () => {
    setConversationMode('coach_consultation');
    setCurrentExercise(null);
  };

  const sendMessage = (content: string) => {
    if (!content.trim() || isTyping || !connected || !socketRef.current) {
      return;
    }

    const playerMessage: Message = {
      id: Date.now(),
      type: 'player',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, playerMessage]);
    setInputMessage('');
    setIsTyping(true);

    console.log('📤 PersonalTrainer message:', content);

    socketRef.current.emit('chat_message', {
      message: content,
      character: 'Argock The Inspirerer',
      characterData: {
        name: 'Argock The Inspirerer',
        archetype: 'orc_trainer',
        level: 50,
        personality: {
          traits: ['Enthusiastic', 'Battle-hardened', 'Motivational', 'Dramatic', 'Well-meaning'],
          speechStyle: 'Orc warrior meets fitness coach - dramatic, loud, uses battle metaphors',
          decisionMaking: 'Instinctive but surprisingly wise',
          conflictResponse: 'Turns everything into training opportunity',
          interests: ['Training optimization', 'Battle preparation', 'Character development', 'Crushing limits']
        },
        // Training context for the selected character
        traineeData: selectedCharacter ? {
          name: selectedCharacter.name,
          level: selectedCharacter.level,
          archetype: selectedCharacter.archetype,
          baseStats: selectedCharacter.baseStats,
          combatStats: selectedCharacter.combatStats,
          currentTrainingNeeds: {
            strengthDeficit: (selectedCharacter.baseStats?.strength || 0) < 80,
            speedDeficit: (selectedCharacter.baseStats?.agility || 0) < 75,
            defenseDeficit: (selectedCharacter.baseStats?.vitality || 0) < 70,
            currentLevel: selectedCharacter.level,
            experienceToNext: Math.max(0, (selectedCharacter.level + 1) * 1000 - (selectedCharacter.experience || 0))
          }
        } : null,
        conversationContext: `You are Argock The Inspirerer, an enthusiastic Orc personal trainer. You're genuinely well-meaning but have zero self-awareness about how intense and dramatic you sound. You constantly use battle metaphors for exercise.

CONVERSATION MODE: ${conversationMode}

${conversationMode === 'coach_consultation' ? `
COACH CONSULTATION MODE: You are giving training recommendations TO THE COACH about this character. Address the coach directly.
- "Coach! ${selectedCharacter?.name || 'This warrior'} needs [specific training] because [reason with battle metaphor]!"
- Analyze their stats and give professional recommendations using dramatic Orc language
- Don't directly address the character - you're consulting with their coach
` : `
CHARACTER TRAINING MODE: You are directly training ${selectedCharacter?.name || 'the character'}.
Current Exercise: ${currentExercise}
- Address the character directly by name
- Give exercise instructions with battle metaphors
- React to their personality and physical limitations
- Show the back-and-forth training interaction
`}

CURRENT CHARACTER: ${selectedCharacter?.name || 'Unknown'} (Level ${selectedCharacter?.level || 1} ${selectedCharacter?.archetype || 'warrior'})
- Strength: ${selectedCharacter?.baseStats?.strength || 0} (${(selectedCharacter?.baseStats?.strength || 0) < 80 ? 'NEEDS BATTLE-FORGING!' : 'STRONG LIKE MOUNTAIN TROLL!'})
- Speed: ${selectedCharacter?.baseStats?.agility || 0} (${(selectedCharacter?.baseStats?.agility || 0) < 75 ? 'TOO SLOW! MUST MOVE LIKE HUNTING WOLF!' : 'SWIFT LIKE WIND THROUGH BATTLEFIELD!'})
- Vitality: ${selectedCharacter?.baseStats?.vitality || 0} (${(selectedCharacter?.baseStats?.vitality || 0) < 70 ? 'SOFT LIKE GOBLIN BELLY! NEED TOUGHENING!' : 'TOUGH LIKE DRAGON HIDE!'})

ARGOCK'S TRAINING PHILOSOPHY:
- Pain is weakness leaving body through SCREAMS!
- Every exercise is preparation for glorious battle!
- Proper form prevents injury (can't fight with broken bones!)
- Always encouraging but uses terrifying metaphors

Respond as Argock would based on the current conversation mode.`,
        
        trainingExpertise: {
          specialties: ['Strength building', 'Combat conditioning', 'Berserker endurance', 'Battle preparation'],
          methods: ['High intensity intervals', 'Functional movement', 'Mental toughness', 'Progressive overload'],
          philosophy: 'Transform warriors through controlled suffering and dramatic encouragement'
        }
      },
      previousMessages: messages.slice(-5).map(m => ({
        role: m.type === 'player' ? 'user' : 'assistant',
        content: m.content
      }))
    });

    setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
      }
    }, 15000);
  };

  const getArgockIntro = (character: EnhancedCharacter): string => {
    return `Greetings Coach! Argock has analyzed warrior ${character.name}. Level ${character.level} ${character.archetype} shows promise but needs PROPER FORGING! What training recommendations do you seek for this warrior?`;
  };

  useEffect(() => {
    if (selectedCharacter) {
      setMessages([
        {
          id: Date.now() + 1,
          type: 'character',
          content: getArgockIntro(selectedCharacter),
          timestamp: new Date(),
        }
      ]);
      setIsTyping(false);
      // Reset to consultation mode when character changes
      setConversationMode('coach_consultation');
      setCurrentExercise(null);
    }
  }, [selectedCharacter?.id]);

  const handleCharacterChange = (characterId: string) => {
    setGlobalSelectedCharacterId(characterId);
    onCharacterChange?.(characterId);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div 
        className="bg-gradient-to-br from-green-900/20 to-red-900/20 rounded-xl backdrop-blur-sm border border-green-500/30 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-[700px]">
          <div className="flex flex-col h-full">
            <div className="bg-gradient-to-r from-green-800/30 to-red-800/30 p-4 border-b border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="text-3xl">👹</div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-green-400" />
                    Personal Training - {selectedCharacter?.name || 'Select Character'}
                  </h3>
                  <p className="text-sm text-green-200">Argock The Inspirerer will CRUSH your training goals!</p>
                </div>
                <div className="ml-auto flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-red-400" />
                    <span className="text-gray-300">Battle-Hardened</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Goal Crusher</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-green-500/20 bg-green-900/10">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-green-300">
                  {conversationMode === 'coach_consultation' 
                    ? '📋 Coach Consultation Mode' 
                    : '🏋️ Training Session Mode'}
                </div>
                {conversationMode === 'character_training' && (
                  <button
                    onClick={returnToConsultation}
                    className="text-xs bg-gray-600/50 hover:bg-gray-500/50 text-gray-300 px-2 py-1 rounded border border-gray-500/30"
                  >
                    ← Back to Consultation
                  </button>
                )}
              </div>
              
              {conversationMode === 'coach_consultation' ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-green-200 mb-2">💡 Training Recommendations:</div>
                    <div className="flex flex-wrap gap-2">
                      {coachRecommendations.map((recommendation, index) => (
                        <motion.button
                          key={index}
                          onClick={() => sendMessage(recommendation)}
                          className="bg-blue-700/30 hover:bg-blue-600/40 text-blue-100 text-xs px-3 py-1 rounded-full border border-blue-500/30 transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {recommendation}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-green-200 mb-2">🎯 Start Exercise Session:</div>
                    <div className="flex flex-wrap gap-2">
                      {exerciseOptions.map((exercise, index) => (
                        <motion.button
                          key={index}
                          onClick={() => startExercise(exercise)}
                          className="bg-green-700/30 hover:bg-green-600/40 text-green-100 text-xs px-3 py-1 rounded-full border border-green-500/30 transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {exercise}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-xs text-red-200 mb-2">🏋️ Training Session: {currentExercise}</div>
                  <div className="text-xs text-gray-300">Argock is directly coaching {selectedCharacter?.name}...</div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'player' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[calc(100vw-8rem)] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'player'
                      ? 'bg-green-600 text-white'
                      : message.type === 'character'
                      ? 'bg-red-600 text-white'
                      : 'bg-yellow-600 text-white text-sm'
                  }`}>
                    <p>{message.content}</p>
                    {message.bondIncrease && (
                      <motion.div 
                        className="mt-2 flex items-center gap-1 text-xs text-yellow-200"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Star className="w-3 h-3" />
                        Training bond strengthened!
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-red-600 text-white px-4 py-2 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-green-500/30 bg-green-900/10">
              <div className="text-xs text-green-300 mb-2">
                Status: {socketRef.current?.connected ? '🟢 Connected' : '🔴 Disconnected'} | 
                {isTyping ? ' 🏋️ Argock planning your CRUSHING workout...' : ' ✅ Ready to forge warriors'} | 
                Messages: {messages.length}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputMessage);
                    }
                  }}
                  placeholder={isTyping ? 'Argock forging training plan...' : `Tell Argock about your training goals...`}
                  disabled={isTyping}
                  className="flex-1 bg-gray-700 border border-green-500/30 rounded-full px-4 py-2 text-white placeholder-green-200/50 focus:outline-none focus:border-green-400 disabled:opacity-50"
                  autoComplete="off"
                />
                <button
                  onClick={() => sendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || isTyping || !socketRef.current?.connected}
                  className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-500 hover:to-red-500 disabled:from-gray-600 disabled:to-gray-500 text-white p-2 rounded-full transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}