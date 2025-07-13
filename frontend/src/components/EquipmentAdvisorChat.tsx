'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, Star, User, Sword, Shield, Zap } from 'lucide-react';
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

// Generate character-specific equipment advice based on actual gear and stats
const generateEquipmentAdvice = (character: EnhancedCharacter): string[] => {
  const advice: string[] = [];
  
  // Safety check to prevent destructuring errors
  if (!character) {
    return ["Check your equipment regularly", "Upgrade when possible", "Match gear to your fighting style"];
  }
  
  const { baseStats, combatStats, archetype } = character;
  
  // Archetype-specific equipment recommendations
  if (archetype === 'warrior' && baseStats?.strength && baseStats.strength < 80) {
    advice.push(`As a warrior, you need strength-boosting weapons - current strength is only ${baseStats.strength}`);
  }
  if (archetype === 'mage' && baseStats?.intelligence && baseStats.intelligence < 80) {
    advice.push(`Your intelligence (${baseStats.intelligence}) needs magical equipment enhancement`);
  }
  if (archetype === 'assassin' && baseStats?.agility && baseStats.agility < 80) {
    advice.push(`Precision weapons would suit your assassin skills better - agility is ${baseStats.agility}`);
  }
  
  // Defense recommendations based on vitality
  if (baseStats?.vitality && baseStats.vitality < 70) {
    advice.push(`Your vitality (${baseStats.vitality}) is low - consider heavier armor for protection`);
  }
  if (baseStats?.vitality && baseStats.vitality > 90) {
    advice.push(`Your high vitality (${baseStats.vitality}) allows for lighter, faster armor`);
  }
  
  // Speed-based equipment advice
  if (combatStats?.speed && combatStats.speed < 60) {
    advice.push(`Your speed (${combatStats.speed}) needs mobility-enhancing gear`);
  }
  if (combatStats?.speed && combatStats.speed > 85) {
    advice.push(`Your excellent speed (${combatStats.speed}) would benefit from agility-focused equipment`);
  }
  
  // Combat stat-based equipment needs
  if (combatStats?.attack && combatStats.attack < 100) {
    advice.push('Focus on offensive weapons to boost your attack power');
  }
  if (combatStats?.defense && combatStats.defense < 80) {
    advice.push('Invest in defensive gear to improve your survivability');
  }
  if (combatStats?.criticalChance && combatStats.criticalChance < 20) {
    advice.push('Consider crit-boosting accessories to enhance your damage output');
  }
  
  // Mental state equipment considerations
  if (character.psychStats?.mentalHealth && character.psychStats.mentalHealth < 60) {
    advice.push('Choose reliable, simple equipment until your mental health improves');
  }
  if (character.psychStats?.ego && character.psychStats.ego > 80) {
    advice.push('Flashy, prestigious equipment would suit your high ego personality');
  }
  
  // Character-specific recommendations
  if (character.personality?.traits?.includes('Prideful')) {
    advice.push('Your pride demands equipment that makes a statement');
  }
  if (character.personality?.traits?.includes('Honorable')) {
    advice.push('Focus on traditional, well-crafted gear over flashy appearance');
  }
  
  // Fallback advice if nothing specific applies
  if (advice.length === 0) {
    advice.push('Balance offense and defense based on your role');
    advice.push('Consider equipment that enhances your strongest stats');
    advice.push('Upgrade gear that matches your fighting style');
  }
  
  return advice.slice(0, 8);
};

interface EquipmentAdvisorChatProps {
  selectedCharacterId?: string;
  onCharacterChange?: (characterId: string) => void;
}

export default function EquipmentAdvisorChat({ 
  selectedCharacterId, 
  onCharacterChange 
}: EquipmentAdvisorChatProps) {
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
    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';
    console.log('🔌 [EquipmentAdvisor] Connecting to backend:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      withCredentials: true, // Include cookies for authentication
    });

    socketRef.current.on('connect', () => {
      console.log('✅ EquipmentAdvisor Socket connected! Waiting for authentication...');
    });

    socketRef.current.on('auth_success', (data: { userId: string; username: string }) => {
      console.log('🔐 EquipmentAdvisor Socket authenticated!', data);
      setConnected(true);
    });

    socketRef.current.on('auth_error', (error: { error: string }) => {
      console.error('❌ EquipmentAdvisor Socket authentication failed:', error);
      setConnected(false);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ EquipmentAdvisor Socket disconnected');
      setConnected(false);
    });

    socketRef.current.on('chat_response', (data: { character: string; message: string; bondIncrease?: boolean }) => {
      console.log('📨 EquipmentAdvisor response:', data);
      
      const characterMessage: Message = {
        id: Date.now(),
        type: 'character',
        content: data.message || 'Let me consider that equipment choice...',
        timestamp: new Date(),
        bondIncrease: data.bondIncrease || Math.random() > 0.6,
      };
      
      setMessages(prev => [...prev, characterMessage]);
      setIsTyping(false);
    });

    socketRef.current.on('chat_error', (error: { message: string }) => {
      console.error('❌ EquipmentAdvisor error:', error);
      setIsTyping(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate equipment advice specific to the selected character
  const equipmentQuickMessages = generateEquipmentAdvice(selectedCharacter);

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

    console.log('📤 EquipmentAdvisor message:', content);

    // Only proceed if connected and socket available
    if (!connected || !socketRef.current) {
      console.log('❌ Cannot send message: not connected to backend');
      return;
    }

    setIsTyping(true);

    // Generate dynamic equipment context
    const currentGearTier = Math.floor(Math.random() * 5) + 1; // Tier 1-5
    const weaponLevel = Math.floor(Math.random() * 20) + 1;
    const armorLevel = Math.floor(Math.random() * 20) + 1;
    
    socketRef.current.emit('chat_message', {
      message: content,
      character: selectedCharacter.baseName,
      characterData: {
        name: selectedCharacter?.name,
        archetype: selectedCharacter.archetype,
        level: selectedCharacter.level,
        personality: selectedCharacter.personality || {
          traits: ['Equipment-focused'],
          speechStyle: 'Direct',
          motivations: ['Excellence', 'Efficiency'],
          fears: ['Inadequate gear'],
          relationships: []
        },
        // Real combat stats that affect equipment choices
        baseStats: selectedCharacter.baseStats,
        combatStats: selectedCharacter.combatStats,
        // Current status
        currentHp: selectedCharacter.combatStats?.health || 100,
        maxHp: selectedCharacter.combatStats?.maxHealth || 100,
        injuries: selectedCharacter.injuries,
        bondLevel: selectedCharacter.displayBondLevel,
        // Equipment-specific context
        conversationContext: `This is an equipment advisory session. The user is the coach who makes equipment decisions for ${selectedCharacter?.name}. The character should advocate for gear choices that fit their archetype (${selectedCharacter.archetype}), stats, and personality. Focus on their actual stats: Base Stats - Strength: ${selectedCharacter.baseStats?.strength || 'Unknown'}, Vitality: ${selectedCharacter.baseStats?.vitality || 'Unknown'}, Agility: ${selectedCharacter.baseStats?.agility || 'Unknown'}, Intelligence: ${selectedCharacter.baseStats?.intelligence || 'Unknown'}. Combat Stats - Attack: ${selectedCharacter.combatStats?.attack || 'Unknown'}, Defense: ${selectedCharacter.combatStats?.defense || 'Unknown'}, Speed: ${selectedCharacter.combatStats?.speed || 'Unknown'}, Critical Chance: ${selectedCharacter.combatStats?.criticalChance || 'Unknown'}%. The character should suggest equipment that enhances their strengths or compensates for weaknesses.`,
        equipmentData: {
          currentWeapon: {
            type: selectedCharacter.archetype === 'warrior' ? 'melee weapon' : 
                  selectedCharacter.archetype === 'mage' ? 'magical staff' : 
                  selectedCharacter.archetype === 'assassin' ? 'precision weapon' : 'versatile weapon',
            level: weaponLevel,
            tier: `Tier ${currentGearTier}`,
            statRequirements: selectedCharacter.archetype === 'warrior' ? 'High Strength' :
                             selectedCharacter.archetype === 'mage' ? 'High Intelligence' :
                             selectedCharacter.archetype === 'assassin' ? 'High Agility' : 'Balanced',
            upgradeAvailable: Math.random() > 0.5
          },
          currentArmor: {
            type: (selectedCharacter.baseStats?.vitality || 70) < 70 ? 'needs heavy armor' : 'can use light armor',
            level: armorLevel,
            tier: `Tier ${currentGearTier}`,
            defenseRating: 50 + (armorLevel * 5),
            speedPenalty: (selectedCharacter.combatStats?.speed || 70) > 85 ? 'avoid heavy armor' : 'heavy armor acceptable'
          },
          statBasedRecommendations: {
            strengthBased: (selectedCharacter.baseStats?.strength || 0) > 80,
            intelligenceBased: (selectedCharacter.baseStats?.intelligence || 0) > 80,
            agilityBased: (selectedCharacter.baseStats?.agility || 0) > 80,
            speedBased: (selectedCharacter.combatStats?.speed || 0) > 80,
            needsVitalityBoost: (selectedCharacter.baseStats?.vitality || 100) < 70
          },
          personalityGearPrefs: {
            egotistical: (selectedCharacter.psychStats?.ego || 0) > 80,
            honorable: selectedCharacter.personality?.traits?.includes('Honorable'),
            prideful: selectedCharacter.personality?.traits?.includes('Prideful'),
            practical: selectedCharacter.personality?.traits?.includes('Practical')
          }
        }
      },
      previousMessages: messages.slice(-5).map(m => ({
        role: m.type === 'player' ? 'user' : 'assistant',
        content: m.content
      }))
    });

  };

  const getEquipmentIntro = (character: EnhancedCharacter): string => {
    // Simple intro that lets the AI take over from there
    return `Coach, I've been thinking about my gear lately. What equipment advice do you have for me?`;
  };

  useEffect(() => {
    if (selectedCharacter) {
      setMessages([
        {
          id: Date.now() + 1,
          type: 'character',
          content: getEquipmentIntro(selectedCharacter),
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
        className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl backdrop-blur-sm border border-blue-500/30 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-[700px]">
          <div className="flex flex-col h-full">
            <div className="bg-gradient-to-r from-blue-800/30 to-cyan-800/30 p-4 border-b border-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedCharacter?.avatar}</div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sword className="w-5 h-5 text-blue-400" />
                    Equipment Advisor - {selectedCharacter?.name}
                  </h3>
                  <p className="text-sm text-blue-200">Discuss gear choices, weapon preferences, and equipment strategy</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Focus: Gear Optimization</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-blue-500/20 bg-blue-900/10">
              <div className="flex flex-wrap gap-2">
                {equipmentQuickMessages.map((msg, index) => (
                  <motion.button
                    key={index}
                    onClick={() => sendMessage(msg)}
                    className="bg-blue-700/30 hover:bg-blue-600/40 text-blue-100 text-xs px-3 py-1 rounded-full border border-blue-500/30 transition-all"
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
                      ? 'bg-blue-600 text-white'
                      : message.type === 'character'
                      ? 'bg-cyan-600 text-white'
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
                        Equipment bond strengthened!
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
                  <div className="bg-cyan-600 text-white px-4 py-2 rounded-lg">
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

            <div className="p-4 border-t border-blue-500/30 bg-blue-900/10">
              <div className="text-xs text-blue-300 mb-2">
                Status: {socketRef.current?.connected ? '🟢 Connected' : '🔴 Disconnected'} | 
                {isTyping ? ' ⏳ Examining equipment...' : ' ✅ Ready for gear discussion'} | 
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
                  placeholder={isTyping ? 'Character is considering equipment...' : `Ask ${selectedCharacter?.name} about gear...`}
                  disabled={isTyping}
                  className="flex-1 bg-gray-700 border border-blue-500/30 rounded-full px-4 py-2 text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400 disabled:opacity-50"
                  autoComplete="off"
                />
                <button
                  onClick={() => sendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || isTyping || !socketRef.current?.connected}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-500 text-white p-2 rounded-full transition-all"
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