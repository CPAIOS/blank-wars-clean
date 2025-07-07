'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, Star, User, BookOpen, Zap, Target, Brain } from 'lucide-react';
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
      displayBondLevel: Math.floor(char.psychStats.mentalHealth / 10)
    };
  });
};

// Generate character-specific skill advice based on actual abilities and stats
const generateSkillAdvice = (character: EnhancedCharacter): string[] => {
  const advice: string[] = [];
  const { traditionalStats, psychStats, abilities, archetype } = character;
  
  // Ability-specific skill development advice
  const attackAbilities = abilities.filter(a => a.type === 'attack');
  const defenseAbilities = abilities.filter(a => a.type === 'defense');
  const specialAbilities = abilities.filter(a => a.type === 'special');
  const supportAbilities = abilities.filter(a => a.type === 'support');
  
  if (attackAbilities.length > 2) {
    advice.push(`Focus on mastering your ${attackAbilities.length} attack abilities for maximum damage`);
  }
  if (defenseAbilities.length > 1) {
    advice.push(`Develop your defensive skill tree to complement your ${defenseAbilities.length} protection abilities`);
  }
  if (specialAbilities.length > 0) {
    advice.push(`Your ${specialAbilities[0].name} special ability needs skill point investment`);
  }
  
  // Stat-based skill recommendations
  if (traditionalStats.strength > 80) {
    advice.push(`Your high strength (${traditionalStats.strength}) should guide physical skill development`);
  }
  if (traditionalStats.intelligence > 80) {
    advice.push(`Your intelligence (${traditionalStats.intelligence}) opens advanced technique paths`);
  }
  if (traditionalStats.dexterity > 80) {
    advice.push(`Your dexterity (${traditionalStats.dexterity}) allows precision skill specialization`);
  }
  if (traditionalStats.speed > 80) {
    advice.push(`Your speed (${traditionalStats.speed}) enables agility-based skill trees`);
  }
  
  // Psychology-based training approach
  if (psychStats.training > 80) {
    advice.push(`Your excellent training discipline (${psychStats.training}) allows complex skill combinations`);
  }
  if (psychStats.training < 50) {
    advice.push(`Your training discipline (${psychStats.training}) needs work before advanced skills`);
  }
  if (psychStats.mentalHealth < 60) {
    advice.push(`Focus on basic skills until your mental health (${psychStats.mentalHealth}) improves`);
  }
  
  // Archetype-specific skill paths
  if (archetype === 'warrior') {
    advice.push('Prioritize combat mastery and weapon specialization skills');
  }
  if (archetype === 'mage') {
    advice.push('Develop your spell power and mana efficiency skill branches');
  }
  if (archetype === 'detective') {
    advice.push('Focus on observation and deduction skill trees');
  }
  
  // Character-specific approaches
  if (character.personalityTraits.includes('Analytical')) {
    advice.push('Your analytical nature suits systematic skill progression');
  }
  if (character.personalityTraits.includes('Impatient')) {
    advice.push('Focus on quick-learning skills that show immediate results');
  }
  if (character.personalityTraits.includes('Perfectionist')) {
    advice.push('Master each skill completely before moving to the next');
  }
  
  // Fallback advice
  if (advice.length === 0) {
    advice.push('Balance offensive and defensive skill development');
    advice.push('Focus on skills that complement your strongest abilities');
    advice.push('Consider cross-training between different skill trees');
  }
  
  return advice.slice(0, 8);
};

interface SkillDevelopmentChatProps {
  selectedCharacterId?: string;
  onCharacterChange?: (characterId: string) => void;
}

export default function SkillDevelopmentChat({ 
  selectedCharacterId, 
  onCharacterChange 
}: SkillDevelopmentChatProps) {
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
    console.log('🔌 [SkillDevelopment] Connecting to local backend:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ SkillDevelopment Socket connected!');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ SkillDevelopment Socket disconnected');
      setConnected(false);
    });

    socketRef.current.on('chat_response', (data: { character: string; message: string; bondIncrease?: boolean }) => {
      console.log('📨 SkillDevelopment response:', data);
      
      const characterMessage: Message = {
        id: Date.now(),
        type: 'character',
        content: data.message || 'Let me think about that skill development...',
        timestamp: new Date(),
        bondIncrease: data.bondIncrease || Math.random() > 0.6,
      };
      
      setMessages(prev => [...prev, characterMessage]);
      setIsTyping(false);
    });

    socketRef.current.on('chat_error', (error: { message: string }) => {
      console.error('❌ SkillDevelopment error:', error);
      setIsTyping(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate skill advice specific to the selected character
  const skillQuickMessages = generateSkillAdvice(selectedCharacter);

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

    console.log('📤 SkillDevelopment message:', content);

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
          interests: ['skill mastery', 'ability development', 'training optimization', 'technique improvement']
        },
        // Real combat stats that influence skill development
        traditionalStats: selectedCharacter.traditionalStats,
        psychStats: selectedCharacter.psychStats,
        // Current abilities and their skill requirements
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
        experience: selectedCharacter.experience,
        bondLevel: selectedCharacter.displayBondLevel,
        // Skill-specific context
        conversationContext: `This is a skill development session. The user is the coach who makes skill point allocation decisions for ${selectedCharacter.name}. The character should advocate for skill development paths that fit their archetype (${selectedCharacter.archetype}), abilities, and personality. Focus on their actual stats: Training: ${selectedCharacter.psychStats.training}, Intelligence: ${selectedCharacter.traditionalStats.intelligence}, their ${selectedCharacter.abilities.length} current abilities, and how different skill trees would benefit their fighting style.`,
        skillData: {
          availableSkillPoints: Math.floor(selectedCharacter.level * 1.5),
          currentAbilities: selectedCharacter.abilities.map(a => ({
            name: a.name,
            type: a.type,
            requiresSkillInvestment: a.power < 50
          })),
          statFocusRecommendations: {
            strengthBased: selectedCharacter.traditionalStats.strength > 75,
            intelligenceBased: selectedCharacter.traditionalStats.intelligence > 75,
            dexterityBased: selectedCharacter.traditionalStats.dexterity > 75,
            speedBased: selectedCharacter.traditionalStats.speed > 75
          },
          learningCapacity: {
            trainingDiscipline: selectedCharacter.psychStats.training,
            mentalHealth: selectedCharacter.psychStats.mentalHealth,
            canLearnAdvanced: selectedCharacter.psychStats.training > 70 && selectedCharacter.psychStats.mentalHealth > 60,
            preferredLearningStyle: selectedCharacter.personalityTraits.includes('Analytical') ? 'systematic' :
                                   selectedCharacter.personalityTraits.includes('Impatient') ? 'quick_results' : 'balanced'
          },
          archetypeSkillTrees: {
            primary: selectedCharacter.archetype === 'warrior' ? 'combat_mastery' :
                    selectedCharacter.archetype === 'mage' ? 'spell_mastery' :
                    selectedCharacter.archetype === 'detective' ? 'investigation_mastery' : 'versatile_skills',
            secondary: 'team_coordination',
            suggested: selectedCharacter.abilities.length > 2 ? 'ability_synergy' : 'foundation_building'
          }
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

  const getSkillIntro = (character: EnhancedCharacter): string => {
    // Simple intro that lets the AI take over from there
    return `*${character.name} reviews their current abilities and skill progress*\n\nCoach, I have ${character.abilities.length} abilities and ${Math.floor(character.level * 1.5)} skill points available. What skill development do you recommend for my ${character.archetype} build?`;
  };

  useEffect(() => {
    if (selectedCharacter) {
      setMessages([
        {
          id: Date.now(),
          type: 'system',
          content: `Skill development session started with ${selectedCharacter.name}`,
          timestamp: new Date(),
        },
        {
          id: Date.now() + 1,
          type: 'character',
          content: getSkillIntro(selectedCharacter),
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
        className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl backdrop-blur-sm border border-purple-500/30 overflow-hidden"
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
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{character.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{character.name}</div>
                      <div className="text-xs text-gray-400 truncate">{character.title}</div>
                      <div className="text-xs text-purple-400 capitalize">{character.archetype}</div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <BookOpen className="w-3 h-3" />
                      Skill Mastery
                    </div>
                    <div className="bg-gray-600 rounded-full h-1 mt-1">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full h-1 transition-all"
                        style={{ width: `${(character.displayBondLevel / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col">
            <div className="bg-gradient-to-r from-purple-800/30 to-indigo-800/30 p-4 border-b border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedCharacter.avatar}</div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    Skill Development - {selectedCharacter.name}
                  </h3>
                  <p className="text-sm text-purple-200">Discuss training methods, skill trees, and ability development</p>
                </div>
                <div className="ml-auto flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300">Mentor</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span className="text-gray-300">Skill Expert</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-purple-500/20 bg-purple-900/10">
              <div className="flex flex-wrap gap-2">
                {skillQuickMessages.map((msg, index) => (
                  <motion.button
                    key={index}
                    onClick={() => sendMessage(msg)}
                    className="bg-purple-700/30 hover:bg-purple-600/40 text-purple-100 text-xs px-3 py-1 rounded-full border border-purple-500/30 transition-all"
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
                      ? 'bg-purple-600 text-white'
                      : message.type === 'character'
                      ? 'bg-indigo-600 text-white'
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
                        Learning bond strengthened!
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
                  <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
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

            <div className="p-4 border-t border-purple-500/30 bg-purple-900/10">
              <div className="text-xs text-purple-300 mb-2">
                Status: {socketRef.current?.connected ? '🟢 Connected' : '🔴 Disconnected'} | 
                {isTyping ? ' ⏳ Contemplating skills...' : ' ✅ Ready for development discussion'} | 
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
                  placeholder={isTyping ? 'Character is thinking about skills...' : `Discuss skills with ${selectedCharacter.name}...`}
                  disabled={isTyping}
                  className="flex-1 bg-gray-700 border border-purple-500/30 rounded-full px-4 py-2 text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-400 disabled:opacity-50"
                  autoComplete="off"
                />
                <button
                  onClick={() => sendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || isTyping || !socketRef.current?.connected}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-500 text-white p-2 rounded-full transition-all"
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