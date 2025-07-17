'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, Star, User, BookOpen, Zap, Target, Brain } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { characterAPI } from '../services/apiClient';
import { Character } from '../data/characters';
import ConflictContextService, { LivingContext } from '../services/conflictContextService';
import EventContextService from '../services/eventContextService';
import EventPublisher from '../services/eventPublisher';

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
  selectedCharacter?: EnhancedCharacter;
  availableCharacters?: EnhancedCharacter[];
}

export default function SkillDevelopmentChat({ 
  selectedCharacterId, 
  onCharacterChange,
  selectedCharacter: propSelectedCharacter,
  availableCharacters: propAvailableCharacters
}: SkillDevelopmentChatProps) {
  // Use props if available, otherwise fallback to loading
  const [localAvailableCharacters, setLocalAvailableCharacters] = useState<EnhancedCharacter[]>([]);
  const [globalSelectedCharacterId, setGlobalSelectedCharacterId] = useState(selectedCharacterId || 'achilles');
  const [charactersLoading, setCharactersLoading] = useState(!propAvailableCharacters);

  // Only load characters if not provided via props
  useEffect(() => {
    if (!propAvailableCharacters) {
      const loadCharacters = async () => {
        setCharactersLoading(true);
        const characters = await loadUserCharacters();
        setLocalAvailableCharacters(characters);
        setCharactersLoading(false);
      };
      
      loadCharacters();
    } else {
      setCharactersLoading(false);
    }
  }, [propAvailableCharacters]);

  // Update internal state when prop changes and clear messages
  useEffect(() => {
    if (selectedCharacterId && selectedCharacterId !== globalSelectedCharacterId) {
      setGlobalSelectedCharacterId(selectedCharacterId);
      setMessages([]);
      setInputMessage('');
      setIsTyping(false);
    }
  }, [selectedCharacterId, globalSelectedCharacterId]);

  // Use props if available, otherwise use local state
  const availableCharacters = propAvailableCharacters || localAvailableCharacters;
  const selectedCharacter = propSelectedCharacter || availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [livingContext, setLivingContext] = useState<LivingContext | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conflictService = ConflictContextService.getInstance();
  const eventContextService = EventContextService.getInstance();
  const eventPublisher = EventPublisher.getInstance();

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';
    console.log('🔌 [SkillDevelopment] Connecting to backend:', socketUrl);
    
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
        bondIncrease: data.bondIncrease || false,
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

  // Load living context when character changes
  useEffect(() => {
    const loadLivingContext = async () => {
      if (selectedCharacter) {
        try {
          console.log('🏠 SkillDevelopment loading living context for:', selectedCharacter.baseName || selectedCharacter.name);
          const context = await conflictService.generateLivingContext(selectedCharacter.baseName || 
            selectedCharacter.name?.toLowerCase() || selectedCharacter.id);
          setLivingContext(context);
          console.log('✅ SkillDevelopment living context loaded:', context);
        } catch (error) {
          console.error('❌ SkillDevelopment failed to load living context:', error);
          setLivingContext(null);
        }
      }
    };

    loadLivingContext();
  }, [selectedCharacter?.id, conflictService]);

  // Generate skill advice specific to the selected character
  const skillQuickMessages = generateSkillAdvice(selectedCharacter);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping || !connected || !socketRef.current) {
      console.log('❌ Skill chat cannot send message:', { 
        hasContent: !!content.trim(), 
        isTyping, 
        connected, 
        hasSocket: !!socketRef.current 
      });
      return;
    }

    if (!selectedCharacter) {
      console.log('❌ Skill chat: No selected character for message');
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

    // Generate compressed event context
    const characterId = selectedCharacter.baseName || selectedCharacter.name?.toLowerCase() || selectedCharacter.id;
    let eventContext = null;
    try {
      const contextString = await eventContextService.getSkillContext(characterId);
      if (contextString) {
        eventContext = {
          recentEvents: contextString,
          relationships: '',
          emotionalState: '',
          domainSpecific: ''
        };
      }
    } catch (error) {
      console.warn('Could not generate event context:', error);
    }

    console.log('📤 SkillDevelopment message:', content);

    socketRef.current.emit('chat_message', {
      message: content,
      character: selectedCharacter.baseName || selectedCharacter.name?.toLowerCase() || selectedCharacter.id,
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
        abilities: Array.isArray(selectedCharacter.abilities) ? selectedCharacter.abilities.map(a => ({
          name: a.name,
          type: a.type,
          power: a.power,
          cooldown: a.cooldown,
          currentCooldown: a.currentCooldown,
          mentalHealthRequired: a.mentalHealthRequired,
          description: a.description
        })) : [],
        // Current status
        experience: selectedCharacter.experience,
        bondLevel: selectedCharacter.displayBondLevel,
        // Skill-specific context
        conversationContext: `This is a skill development session. You are ${selectedCharacter.name}, speaking to your coach about your skills and abilities.

IMPORTANT: You MUST reference your actual skills, abilities, and training progress in conversation. You are fully aware of:

YOUR CURRENT ABILITIES AND SKILLS:
${selectedCharacter.abilities?.length > 0 ? 
  selectedCharacter.abilities.map(ability => `- ${ability.name}: ${ability.description || 'Special ability'} (Power: ${ability.power}, Cooldown: ${ability.cooldown})`).join('\n') : 
  '- No abilities learned yet'
}

YOUR CURRENT STATS (reference these specific numbers):
- Level: ${selectedCharacter.level}
- Attack: ${selectedCharacter.baseStats?.strength || selectedCharacter.base_attack || 70}
- Health: ${selectedCharacter.baseStats?.vitality || selectedCharacter.base_health || 80}
- Defense: ${selectedCharacter.baseStats?.wisdom || selectedCharacter.base_defense || 70}
- Speed: ${selectedCharacter.baseStats?.agility || selectedCharacter.base_speed || 70}
- Special: ${selectedCharacter.baseStats?.intelligence || selectedCharacter.base_special || 70}
- Experience: ${selectedCharacter.experience}
- Archetype: ${selectedCharacter.archetype}

YOUR TRAINING PROGRESS:
- Training Points Available: ${Math.floor(selectedCharacter.level * 1.5)}
- Bond Level: ${selectedCharacter.bondLevel || selectedCharacter.bond_level || 50}
- Skills Learned: ${selectedCharacter.abilities?.length || 0} abilities

You should naturally reference your current abilities, discuss which skills you want to learn next, and explain how new abilities would improve your combat effectiveness. For example: "I currently have ${selectedCharacter.abilities?.length || 0} abilities, but I think learning a defensive skill would help since my defense is only ${selectedCharacter.baseStats?.wisdom || selectedCharacter.base_defense || 70}" or "My ${selectedCharacter.archetype} archetype suggests I should focus on [specific skill type] abilities."`,
        skillData: {
          availableSkillPoints: Math.floor(selectedCharacter.level * 1.5),
          currentAbilities: selectedCharacter.abilities || [],
          realCharacterStats: {
            base_attack: selectedCharacter.base_attack,
            base_health: selectedCharacter.base_health,
            base_defense: selectedCharacter.base_defense,
            base_speed: selectedCharacter.base_speed,
            base_special: selectedCharacter.base_special,
            current_health: selectedCharacter.current_health,
            max_health: selectedCharacter.max_health,
            level: selectedCharacter.level,
            experience: selectedCharacter.experience,
            bond_level: selectedCharacter.bond_level,
            archetype: selectedCharacter.archetype
          },
          statFocusRecommendations: {
            attackBased: selectedCharacter.base_attack > 75,
            specialBased: selectedCharacter.base_special > 75,
            speedBased: selectedCharacter.base_speed > 75,
            defenseBased: selectedCharacter.base_defense > 75,
            healthBased: selectedCharacter.base_health > 75,
            needsAttackFocus: selectedCharacter.base_attack < 60,
            needsSpeedFocus: selectedCharacter.base_speed < 60,
            needsDefenseFocus: selectedCharacter.base_defense < 60
          },
          learningCapacity: {
            currentLevel: selectedCharacter.level,
            experience: selectedCharacter.experience,
            canLearnAdvanced: selectedCharacter.level > 10 && selectedCharacter.base_special > 70,
            bondLevel: selectedCharacter.bond_level
          },
          archetypeSkillTrees: {
            primary: selectedCharacter.archetype,
            abilityCount: selectedCharacter.abilities?.length || 0
          }
        },
        // Add living context for kitchen table conflict awareness
        livingContext: livingContext,
        // Add centralized event context
        eventContext: eventContext
      },
      previousMessages: messages.slice(-5).map(m => ({
        role: m.type === 'player' ? 'user' : 'assistant',
        content: m.content
      }))
    });

    // Publish skill development chat event
    try {
      await eventPublisher.publishChatInteraction({
        characterId,
        chatType: 'skills',
        message: content,
        outcome: 'helpful' // Default, could be determined by AI response
      });
    } catch (error) {
      console.warn('Could not publish chat event:', error);
    }

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