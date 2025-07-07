'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, Star, User, TrendingUp, Activity, Target } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { createDemoCharacterCollection, Character } from '../data/characters';
import { createDemoPlayerTeam, TeamCharacter } from '../data/teamBattleSystem';

interface Message {
  id: number;
  type: 'player' | 'character' | 'system';
  content: string;
  timestamp: Date;
  bondIncrease?: boolean;
}

interface EnhancedCharacter extends TeamCharacter {
  baseName: string;
  displayBondLevel: number;
}

const createAvailableCharacters = (): EnhancedCharacter[] => {
  const demoTeam = createDemoPlayerTeam();
  return demoTeam.characters.map(char => {
    const baseName = char.name.toLowerCase().replace(/[^a-z]/g, '_');
    return {
      ...char,
      baseName,
      displayBondLevel: Math.floor(char.psychStats.mentalHealth / 10) // Use mental health as bond indicator
    };
  });
};

// Generate character-specific coaching advice based on actual stats
const generateCoachingAdvice = (character: EnhancedCharacter): string[] => {
  const advice: string[] = [];
  const { traditionalStats, psychStats, abilities } = character;
  
  // Psychological stat issues
  if (psychStats.ego > 80) {
    advice.push(`Your ego (${psychStats.ego}) is affecting team chemistry - let's work on humility`);
  }
  if (psychStats.teamPlayer < 50) {
    advice.push(`Your teamwork (${psychStats.teamPlayer}) needs improvement for better coordination`);
  }
  if (psychStats.mentalHealth < 60) {
    advice.push(`Your mental health (${psychStats.mentalHealth}) is impacting ability reliability`);
  }
  if (psychStats.communication < 60) {
    advice.push(`Your communication (${psychStats.communication}) is limiting team synergy`);
  }
  
  // Traditional stat weaknesses (below 70)
  if (traditionalStats.strength < 70) {
    advice.push(`Your strength (${traditionalStats.strength}) needs training for better damage output`);
  }
  if (traditionalStats.vitality < 70) {
    advice.push(`Your vitality (${traditionalStats.vitality}) needs work - you're taking too much damage`);
  }
  if (traditionalStats.speed < 70) {
    advice.push(`Your speed (${traditionalStats.speed}) is limiting your turn order advantage`);
  }
  if (traditionalStats.dexterity < 70) {
    advice.push(`Your dexterity (${traditionalStats.dexterity}) is affecting accuracy and crits`);
  }
  
  // Ability-specific advice
  const abilitiesOnCooldown = abilities.filter(a => a.currentCooldown > 0);
  if (abilitiesOnCooldown.length > 0) {
    advice.push(`Manage your cooldowns better - ${abilitiesOnCooldown[0].name} is still recharging`);
  }
  
  const highMentalReqAbilities = abilities.filter(a => a.mentalHealthRequired > psychStats.mentalHealth);
  if (highMentalReqAbilities.length > 0) {
    advice.push(`Your mental health is too low for ${highMentalReqAbilities[0].name} - focus on recovery`);
  }
  
  // Personality-specific advice
  if (character.personalityTraits.includes('Arrogant')) {
    advice.push('Your arrogance is showing in battle - consider more defensive plays');
  }
  if (character.personalityTraits.includes('Impatient')) {
    advice.push('Your impatience is causing rushed decisions - slow down and think');
  }
  
  // Ensure we have at least some generic advice if nothing specific applies
  if (advice.length === 0) {
    advice.push('Focus on your strongest stats and coordinate better with your team');
    advice.push('Work on timing your abilities for maximum impact');
    advice.push('Consider your role in team strategy');
  }
  
  return advice.slice(0, 8); // Limit to 8 pieces of advice
};

interface PerformanceCoachingChatProps {
  selectedCharacterId?: string;
  onCharacterChange?: (characterId: string) => void;
}

export default function PerformanceCoachingChat({ 
  selectedCharacterId, 
  onCharacterChange 
}: PerformanceCoachingChatProps) {
  const [availableCharacters] = useState<EnhancedCharacter[]>(createAvailableCharacters());
  const [globalSelectedCharacterId, setGlobalSelectedCharacterId] = useState(selectedCharacterId || 'achilles');
  const selectedCharacter = availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socketUrl = 'http://localhost:3006';
    console.log('🔌 [PerformanceCoaching] Connecting to local backend:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ PerformanceCoaching Socket connected!');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ PerformanceCoaching Socket disconnected');
      setConnected(false);
    });

    socketRef.current.on('chat_response', (data: { character: string; message: string; bondIncrease?: boolean }) => {
      console.log('📨 PerformanceCoaching response:', data);
      
      const characterMessage: Message = {
        id: Date.now(),
        type: 'character',
        content: data.message || 'Let me think about my performance...',
        timestamp: new Date(),
        bondIncrease: data.bondIncrease || Math.random() > 0.6,
      };
      
      setMessages(prev => [...prev, characterMessage]);
      setIsTyping(false);
    });

    socketRef.current.on('chat_error', (error: { message: string }) => {
      console.error('❌ PerformanceCoaching error:', error);
      setIsTyping(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate coaching advice specific to the selected character
  const performanceQuickMessages = generateCoachingAdvice(selectedCharacter);

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

    console.log('📤 PerformanceCoaching message:', content);

    // Generate dynamic performance data for context
    const recentBattles = Math.floor(Math.random() * 20) + 10;
    const winRate = Math.floor(Math.random() * 30) + 50; // 50-80% win rate
    const battlesWon = Math.floor(recentBattles * (winRate / 100));
    const battlesLost = recentBattles - battlesWon;
    
    socketRef.current.emit('chat_message', {
      message: content,
      character: selectedCharacter.baseName,
      characterData: {
        name: selectedCharacter.name,
        archetype: selectedCharacter.archetype,
        level: selectedCharacter.level,
        personality: {
          traits: selectedCharacter.personalityTraits,
          speechStyle: selectedCharacter.speakingStyle,
          decisionMaking: selectedCharacter.decisionMaking,
          conflictResponse: selectedCharacter.conflictResponse,
          interests: ['combat improvement', 'tactical mastery', 'team coordination', 'skill development']
        },
        // Real combat stats
        traditionalStats: selectedCharacter.traditionalStats,
        psychStats: selectedCharacter.psychStats,
        // Current abilities and their status
        abilities: selectedCharacter.abilities.map(a => ({
          name: a.name,
          type: a.type,
          power: a.power,
          cooldown: a.cooldown,
          currentCooldown: a.currentCooldown,
          mentalHealthRequired: a.mentalHealthRequired,
          description: a.description
        })),
        // Current status
        currentHp: selectedCharacter.currentHp,
        maxHp: selectedCharacter.maxHp,
        statusEffects: selectedCharacter.statusEffects,
        injuries: selectedCharacter.injuries,
        bondLevel: selectedCharacter.displayBondLevel,
        // Performance-specific context
        conversationContext: `This is a performance coaching session. The user is the coach who makes decisions about ${selectedCharacter.name}'s training and tactics. ${selectedCharacter.name} should discuss their recent battle performance, ask for guidance on areas they're struggling with, and advocate for training approaches that fit their fighting style and personality. Focus on their actual stats: Traditional Stats - Strength: ${selectedCharacter.traditionalStats.strength}, Vitality: ${selectedCharacter.traditionalStats.vitality}, Speed: ${selectedCharacter.traditionalStats.speed}, Dexterity: ${selectedCharacter.traditionalStats.dexterity}, Intelligence: ${selectedCharacter.traditionalStats.intelligence}. Psychological Stats - Training: ${selectedCharacter.psychStats.training}, Team Player: ${selectedCharacter.psychStats.teamPlayer}, Ego: ${selectedCharacter.psychStats.ego}, Mental Health: ${selectedCharacter.psychStats.mentalHealth}, Communication: ${selectedCharacter.psychStats.communication}.`,
        performanceData: {
          recentBattles,
          battlesWon,
          battlesLost,
          winRate: `${winRate}%`,
          lastBattleResult: Math.random() > 0.5 ? 'victory' : 'defeat',
          // Identify actual weaknesses based on stats
          statWeaknesses: Object.entries(selectedCharacter.traditionalStats)
            .filter(([_, value]) => value < 70)
            .map(([stat, value]) => `${stat}: ${value}`),
          psychIssues: Object.entries(selectedCharacter.psychStats)
            .filter(([key, value]) => 
              (key === 'ego' && value > 80) || 
              (key !== 'ego' && value < 60)
            )
            .map(([stat, value]) => `${stat}: ${value}`),
          abilitiesOnCooldown: selectedCharacter.abilities
            .filter(a => a.currentCooldown > 0)
            .map(a => `${a.name} (${a.currentCooldown} turns)`),
          mentalHealthBlocks: selectedCharacter.abilities
            .filter(a => a.mentalHealthRequired > selectedCharacter.psychStats.mentalHealth)
            .map(a => a.name)
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

  const getPerformanceIntro = (character: EnhancedCharacter): string => {
    // Simple intro that lets the AI take over from there
    return `*${character.name} approaches for a performance discussion*\n\nCoach, I've been thinking about my recent battles. Can we talk about areas where I might improve, or strategies that could work better for my fighting style?`;
  };

  useEffect(() => {
    if (selectedCharacter) {
      setMessages([
        {
          id: Date.now(),
          type: 'system',
          content: `Performance coaching session started with ${selectedCharacter.name}`,
          timestamp: new Date(),
        },
        {
          id: Date.now() + 1,
          type: 'character',
          content: getPerformanceIntro(selectedCharacter),
          timestamp: new Date(),
        }
      ]);
    }
  }, [selectedCharacter?.id]);

  const handleCharacterChange = (characterId: string) => {
    setGlobalSelectedCharacterId(characterId);
    onCharacterChange?.(characterId);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div 
        className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-xl backdrop-blur-sm border border-orange-500/30 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 h-[700px]">
          <div className="w-80 bg-gray-800/80 rounded-xl p-4 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Characters
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => handleCharacterChange(character.baseName)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    globalSelectedCharacterId === character.baseName
                      ? 'border-orange-500 bg-orange-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{character.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{character.name}</div>
                      <div className="text-xs text-gray-400 truncate">{character.title}</div>
                      <div className="text-xs text-orange-400 capitalize">{character.archetype}</div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <TrendingUp className="w-3 h-3" />
                      Performance Focus
                    </div>
                    <div className="bg-gray-600 rounded-full h-1 mt-1">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full h-1 transition-all"
                        style={{ width: `${(character.displayBondLevel / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col">
            <div className="bg-gradient-to-r from-orange-800/30 to-red-800/30 p-4 border-b border-orange-500/30">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedCharacter.avatar}</div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-400" />
                    Performance Coaching - {selectedCharacter.name}
                  </h3>
                  <p className="text-sm text-orange-200">Discuss battles, analyze performance, and set improvement goals</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-gray-300">Focus: Combat Excellence</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-orange-500/20 bg-orange-900/10">
              <div className="flex flex-wrap gap-2">
                {performanceQuickMessages.map((msg, index) => (
                  <motion.button
                    key={index}
                    onClick={() => sendMessage(msg)}
                    className="bg-orange-700/30 hover:bg-orange-600/40 text-orange-100 text-xs px-3 py-1 rounded-full border border-orange-500/30 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {msg}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'player' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'player'
                      ? 'bg-orange-600 text-white'
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
                        Trust increased!
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

            <div className="p-4 border-t border-orange-500/30 bg-orange-900/10">
              <div className="text-xs text-orange-300 mb-2">
                Status: {socketRef.current?.connected ? '🟢 Connected' : '🔴 Disconnected'} | 
                {isTyping ? ' ⏳ Analyzing performance...' : ' ✅ Ready for feedback'} | 
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
                  placeholder={isTyping ? 'Character is reflecting...' : `Provide feedback to ${selectedCharacter.name}...`}
                  disabled={isTyping}
                  className="flex-1 bg-gray-700 border border-orange-500/30 rounded-full px-4 py-2 text-white placeholder-orange-200/50 focus:outline-none focus:border-orange-400 disabled:opacity-50"
                  autoComplete="off"
                />
                <button
                  onClick={() => sendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || isTyping || !socketRef.current?.connected}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-gray-600 disabled:to-gray-500 text-white p-2 rounded-full transition-all"
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