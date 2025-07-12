'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, Star, User, TrendingUp, Activity, Target } from 'lucide-react';
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

const loadUserCharacters = async (): Promise<EnhancedCharacter[]> => {
  try {
    const response = await characterAPI.getUserCharacters();
    const characters = response.characters || [];
    
    return characters.map((char: any) => {
      const baseName = char.name?.toLowerCase() || char.id?.split('_')[0] || 'unknown';
      return {
        ...char,
        baseName,
        displayBondLevel: char.bond_level || Math.floor((char.base_health || 80) / 10),
        // Map database fields to component expectations
        baseStats: {
          strength: char.base_attack || 70,
          vitality: char.base_health || 80,
          agility: char.base_speed || 70,
          intelligence: char.base_special || 70,
          wisdom: char.base_defense || 70,
          charisma: char.bond_level || 5
        },
        combatStats: {
          health: char.current_health || char.base_health || 80,
          maxHealth: char.max_health || char.base_health || 80,
          attack: char.base_attack || 70,
          defense: char.base_defense || 70,
          speed: char.base_speed || 70,
          criticalChance: 15,
          accuracy: 85
        },
        level: char.level || 1,
        experience: char.experience || 0,
        abilities: char.abilities || [],
        archetype: char.archetype || 'warrior',
        avatar: char.avatar || '⚔️',
        name: char.name || 'Unknown Character',
        personalityTraits: char.personality_traits || ['Determined'],
        speakingStyle: char.speaking_style || 'Direct',
        decisionMaking: char.decision_making || 'Analytical',
        conflictResponse: char.conflict_response || 'Confrontational'
      };
    });
  } catch (error) {
    console.error('Failed to load user characters:', error);
    return [];
  }
};

// Generate character-specific coaching advice based on actual stats
const generateCoachingAdvice = (character: EnhancedCharacter): string[] => {
  const advice: string[] = [];
  
  // Safety check to prevent destructuring errors
  if (!character) {
    return ["Focus on consistent training", "Track your progress", "Stay motivated"];
  }
  
  const { baseStats, combatStats, level } = character;
  
  // Base stat weaknesses (below 70)
  if (baseStats?.strength && baseStats.strength < 70) {
    advice.push(`Your strength (${baseStats.strength}) needs training for better damage output`);
  }
  if (baseStats?.vitality && baseStats.vitality < 70) {
    advice.push(`Your vitality (${baseStats.vitality}) needs work - you're taking too much damage`);
  }
  if (baseStats?.agility && baseStats.agility < 70) {
    advice.push(`Your agility (${baseStats.agility}) is limiting your turn order advantage`);
  }
  if (baseStats?.intelligence && baseStats.intelligence < 70) {
    advice.push(`Your intelligence (${baseStats.intelligence}) is affecting tactical decisions`);
  }
  
  // Combat stat advice
  if (combatStats?.criticalChance && combatStats.criticalChance < 20) {
    advice.push(`Your critical chance (${combatStats.criticalChance}%) needs improvement for better damage`);
  }
  if (combatStats?.accuracy && combatStats.accuracy < 80) {
    advice.push(`Your accuracy (${combatStats.accuracy}%) is causing missed opportunities`);
  }
  
  // Level-based advice
  if (level < 10) {
    advice.push('Focus on basic training fundamentals at your current level');
  } else if (level > 15) {
    advice.push('Your experience should guide newer team members');
  }
  
  // Personality-specific advice
  if (character.personality?.traits?.includes('Honorable')) {
    advice.push('Your honor is admirable, but consider strategic flexibility');
  }
  if (character.personality?.traits?.includes('Wrathful')) {
    advice.push('Channel your anger productively in battle');
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
  const [availableCharacters, setAvailableCharacters] = useState<EnhancedCharacter[]>([]);
  const [globalSelectedCharacterId, setGlobalSelectedCharacterId] = useState(selectedCharacterId || 'achilles');
  const [charactersLoading, setCharactersLoading] = useState(true);

  // Load characters on component mount
  useEffect(() => {
    const loadCharacters = async () => {
      setCharactersLoading(true);
      const characters = await loadUserCharacters();
      setAvailableCharacters(characters);
      setCharactersLoading(false);
    };
    
    loadCharacters();
  }, []);

  // Update internal state when prop changes and clear messages
  useEffect(() => {
    if (selectedCharacterId && selectedCharacterId !== globalSelectedCharacterId) {
      setGlobalSelectedCharacterId(selectedCharacterId);
      // Clear messages when character changes
      setMessages([]);
      setInputMessage('');
      setIsTyping(false);
    }
  }, [selectedCharacterId, globalSelectedCharacterId]);
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
      withCredentials: true, // Include cookies for authentication
    });

    socketRef.current.on('connect', () => {
      console.log('✅ PerformanceCoaching Socket connected! Waiting for authentication...');
    });

    socketRef.current.on('auth_success', (data: { userId: string; username: string }) => {
      console.log('🔐 PerformanceCoaching Socket authenticated!', data);
      setConnected(true);
    });

    socketRef.current.on('auth_error', (error: { error: string }) => {
      console.error('❌ PerformanceCoaching Socket authentication failed:', error);
      setConnected(false);
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

    console.log('📤 PerformanceCoaching message:', content);

    // Only proceed if connected and socket available
    if (!connected || !socketRef.current) {
      console.log('❌ Cannot send message: not connected to backend');
      return;
    }

    setIsTyping(true);

    // Generate dynamic performance data for context
    const recentBattles = Math.floor(Math.random() * 20) + 10;
    const winRate = Math.floor(Math.random() * 30) + 50; // 50-80% win rate
    const battlesWon = Math.floor(recentBattles * (winRate / 100));
    const battlesLost = recentBattles - battlesWon;
    
    socketRef.current.emit('chat_message', {
      message: content,
      character: selectedCharacter.baseName,
      characterData: {
        name: selectedCharacter?.name,
        archetype: selectedCharacter.archetype,
        level: selectedCharacter.level,
        personality: selectedCharacter.personality || {
          traits: ['Combat-focused'],
          speechStyle: 'Direct',
          motivations: ['Victory', 'Honor'],
          fears: ['Defeat'],
          relationships: []
        },
        // Real combat stats
        baseStats: selectedCharacter.baseStats,
        combatStats: selectedCharacter.combatStats,
        // Current status
        currentHp: selectedCharacter.combatStats?.health || 100,
        maxHp: selectedCharacter.combatStats?.maxHealth || 100,
        injuries: selectedCharacter.injuries,
        bondLevel: selectedCharacter.displayBondLevel,
        // Performance-specific context
        conversationContext: `This is a performance coaching session. The user is the coach who makes decisions about ${selectedCharacter?.name}'s training and tactics. ${selectedCharacter?.name} should discuss their recent battle performance, ask for guidance on areas they're struggling with, and advocate for training approaches that fit their fighting style and personality. Focus on their actual stats: Base Stats - Strength: ${selectedCharacter.baseStats?.strength || 'Unknown'}, Vitality: ${selectedCharacter.baseStats?.vitality || 'Unknown'}, Agility: ${selectedCharacter.baseStats?.agility || 'Unknown'}, Intelligence: ${selectedCharacter.baseStats?.intelligence || 'Unknown'}. Combat Stats - Attack: ${selectedCharacter.combatStats?.attack || 'Unknown'}, Defense: ${selectedCharacter.combatStats?.defense || 'Unknown'}, Speed: ${selectedCharacter.combatStats?.speed || 'Unknown'}, Critical Chance: ${selectedCharacter.combatStats?.criticalChance || 'Unknown'}%.`,
        performanceData: {
          recentBattles,
          battlesWon,
          battlesLost,
          winRate: `${winRate}%`,
          lastBattleResult: Math.random() > 0.5 ? 'victory' : 'defeat',
          // Identify actual weaknesses based on stats
          statWeaknesses: selectedCharacter.baseStats ? Object.entries(selectedCharacter.baseStats)
            .filter(([_, value]) => value < 70)
            .map(([stat, value]) => `${stat}: ${value}`) : [],
          recentPerformance: 'Analyzing combat effectiveness and coordination',
          focusAreas: ['Combat tactics', 'Team coordination', 'Skill optimization']
        }
      },
      previousMessages: messages.slice(-5).map(m => ({
        role: m.type === 'player' ? 'user' : 'assistant',
        content: m.content
      }))
    });

  };

  const getPerformanceIntro = (character: EnhancedCharacter): string => {
    // Simple intro that lets the AI take over from there
    return `Coach, I've been thinking about my recent battles. Can we talk about areas where I might improve, or strategies that could work better for my fighting style?`;
  };

  useEffect(() => {
    if (selectedCharacter) {
      setMessages([
        {
          id: Date.now() + 1,
          type: 'character',
          content: getPerformanceIntro(selectedCharacter),
          timestamp: new Date(),
        }
      ]);
      // Ensure typing state is cleared when character changes
      setIsTyping(false);
    }
  }, [selectedCharacter?.id]);


  return (
    <div className="max-w-6xl mx-auto">
      <motion.div 
        className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-xl backdrop-blur-sm border border-orange-500/30 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-[700px]">
          <div className="flex flex-col h-full">
            <div className="bg-gradient-to-r from-orange-800/30 to-red-800/30 p-4 border-b border-orange-500/30">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedCharacter?.avatar}</div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-400" />
                    Performance Coaching - {selectedCharacter?.name}
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
                  placeholder={isTyping ? 'Character is reflecting...' : `Provide feedback to ${selectedCharacter?.name}...`}
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