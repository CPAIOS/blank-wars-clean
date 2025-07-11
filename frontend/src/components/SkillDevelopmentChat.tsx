'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, Star, User, BookOpen, Zap, Target, Brain } from 'lucide-react';
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

// Generate character-specific skill advice based on actual abilities and stats
const generateSkillAdvice = (character: EnhancedCharacter): string[] => {
  const advice: string[] = [];
  
  // Safety check to prevent destructuring errors
  if (!character) {
    return ["Focus on basic skill development", "Practice fundamental techniques", "Build core competencies"];
  }
  
  const { baseStats, combatStats, abilities, archetype } = character;
  
  // Ability-specific skill development advice
  if (abilities && abilities.length > 0) {
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
  }
  
  // Stat-based skill recommendations
  if (baseStats?.strength && baseStats.strength > 80) {
    advice.push(`Your high strength (${baseStats.strength}) should guide physical skill development`);
  }
  if (baseStats?.intelligence && baseStats.intelligence > 80) {
    advice.push(`Your intelligence (${baseStats.intelligence}) opens advanced technique paths`);
  }
  if (baseStats?.agility && baseStats.agility > 80) {
    advice.push(`Your agility (${baseStats.agility}) allows precision skill specialization`);
  }
  if (combatStats?.speed && combatStats.speed > 80) {
    advice.push(`Your speed (${combatStats.speed}) enables agility-based skill trees`);
  }
  
  // Combat stat-based training approach
  if (combatStats?.accuracy && combatStats.accuracy > 80) {
    advice.push(`Your excellent accuracy (${combatStats.accuracy}%) allows complex skill combinations`);
  }
  if (combatStats?.accuracy && combatStats.accuracy < 50) {
    advice.push(`Your accuracy (${combatStats.accuracy}%) needs work before advanced skills`);
  }
  if (baseStats?.vitality && baseStats.vitality < 60) {
    advice.push(`Focus on basic skills until your vitality (${baseStats.vitality}) improves`);
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
  if (character.personality?.traits?.includes('Analytical')) {
    advice.push('Your analytical nature suits systematic skill progression');
  }
  if (character.personality?.traits?.includes('Impatient')) {
    advice.push('Focus on quick-learning skills that show immediate results');
  }
  if (character.personality?.traits?.includes('Perfectionist')) {
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
    console.log('🔌 [SkillDevelopment] Connecting to local backend:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      withCredentials: true, // Include cookies for authentication
    });

    socketRef.current.on('connect', () => {
      console.log('✅ SkillDevelopment Socket connected! Waiting for authentication...');
    });

    socketRef.current.on('auth_success', (data: { userId: string; username: string }) => {
      console.log('🔐 SkillDevelopment Socket authenticated!', data);
      setConnected(true);
    });

    socketRef.current.on('auth_error', (error: { error: string }) => {
      console.error('❌ SkillDevelopment Socket authentication failed:', error);
      setConnected(false);
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
        name: selectedCharacter?.name,
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
        baseStats: selectedCharacter.baseStats,
        combatStats: selectedCharacter.combatStats,
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
        conversationContext: `This is a skill development session. The user is the coach who makes skill point allocation decisions for ${selectedCharacter?.name}. 

CURRENT CHARACTER STATUS:
- Base Stats: Strength: ${selectedCharacter.baseStats?.strength}, Vitality: ${selectedCharacter.baseStats?.vitality}, Agility: ${selectedCharacter.baseStats?.agility}, Intelligence: ${selectedCharacter.baseStats?.intelligence}, Wisdom: ${selectedCharacter.baseStats?.wisdom}, Charisma: ${selectedCharacter.baseStats?.charisma}
- Combat Stats: Health: ${selectedCharacter.combatStats?.health}/${selectedCharacter.combatStats?.maxHealth}, Attack: ${selectedCharacter.combatStats?.attack}, Defense: ${selectedCharacter.combatStats?.defense}, Speed: ${selectedCharacter.combatStats?.speed}, Critical Chance: ${selectedCharacter.combatStats?.criticalChance}%, Accuracy: ${selectedCharacter.combatStats?.accuracy}%
- Level: ${selectedCharacter.level}, Archetype: ${selectedCharacter.archetype}
- Current Abilities: ${selectedCharacter.abilities?.length || 0} learned abilities
- Available Training Points: ${Math.floor(selectedCharacter.level * 1.5)}

GAME MECHANICS KNOWLEDGE:
- Base Stats affect combat: Strength (physical damage, carry capacity), Agility (speed, dodge, crit), Intelligence (mana, spell power), Vitality (health, stamina), Wisdom (mana regen, XP gain), Charisma (social abilities, leadership)
- Skill Categories: Core Skills (available to all), Archetype Skills (class-specific), Signature Skills (unique abilities)
- Training Cost: Each skill requires training sessions based on complexity and character level
- Skill Prerequisites: Higher skills require previous skills and minimum levels
- Combat Actions: Attack, defend, special abilities, dodge, critical hits, healing, buffs/debuffs
- Battle Performance affects skill progression: successful actions, critical hits, strategic decisions
- Archetype Synergy: ${selectedCharacter.archetype} characters excel in specific skill trees that match their nature

COACHING ROLE: You should advocate for skill development paths that optimize this character's combat effectiveness, consider their personality traits, and suggest training priorities based on their current weaknesses and strengths. Reference specific game mechanics when explaining why certain skills would benefit them.`,
        skillData: {
          availableSkillPoints: Math.floor(selectedCharacter.level * 1.5),
          currentAbilities: selectedCharacter.abilities.map(a => ({
            name: a.name,
            type: a.type,
            requiresSkillInvestment: a.power < 50
          })),
          statFocusRecommendations: {
            strengthBased: (selectedCharacter.baseStats?.strength || 0) > 75,
            intelligenceBased: (selectedCharacter.baseStats?.intelligence || 0) > 75,
            agilityBased: (selectedCharacter.baseStats?.agility || 0) > 75,
            speedBased: (selectedCharacter.combatStats?.speed || 0) > 90,
            vitalityBased: (selectedCharacter.baseStats?.vitality || 0) > 75
          },
          learningCapacity: {
            currentLevel: selectedCharacter.level,
            experience: selectedCharacter.experience || 0,
            canLearnAdvanced: selectedCharacter.level > 10 && (selectedCharacter.baseStats?.intelligence || 0) > 70,
            preferredLearningStyle: selectedCharacter.personality?.traits?.includes('Analytical') ? 'systematic' :
                                   selectedCharacter.personality?.traits?.includes('Impatient') ? 'quick_results' : 'balanced'
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
    return `Coach, I have ${character.abilities.length} abilities and ${Math.floor(character.level * 1.5)} skill points available. What skill development do you recommend for my ${character.archetype} build?`;
  };

  useEffect(() => {
    if (selectedCharacter) {
      setMessages([
        {
          id: Date.now() + 1,
          type: 'character',
          content: getSkillIntro(selectedCharacter),
          timestamp: new Date(),
        }
      ]);
      // Ensure typing state is cleared when character changes
      setIsTyping(false);
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
        <div className="h-[700px]">
          <div className="flex flex-col h-full">
            <div className="bg-gradient-to-r from-purple-800/30 to-indigo-800/30 p-4 border-b border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedCharacter?.avatar}</div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    Skill Development - {selectedCharacter?.name}
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
                  placeholder={isTyping ? 'Character is thinking about skills...' : `Discuss skills with ${selectedCharacter?.name}...`}
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