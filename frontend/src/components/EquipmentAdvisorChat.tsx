'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, Star, User, Crown, Sword, Shield, Zap } from 'lucide-react';
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

// Generate character-specific equipment advice based on actual gear and stats
const generateEquipmentAdvice = (character: EnhancedCharacter): string[] => {
  const advice: string[] = [];
  const { traditionalStats, abilities, archetype } = character;
  
  // Archetype-specific equipment recommendations
  if (archetype === 'warrior' && traditionalStats.strength < 80) {
    advice.push(`As a warrior, you need strength-boosting weapons - current strength is only ${traditionalStats.strength}`);
  }
  if (archetype === 'mage' && traditionalStats.intelligence < 80) {
    advice.push(`Your intelligence (${traditionalStats.intelligence}) needs magical equipment enhancement`);
  }
  if (archetype === 'detective' && traditionalStats.dexterity < 80) {
    advice.push(`Precision weapons would suit your detective skills better - dexterity is ${traditionalStats.dexterity}`);
  }
  
  // Defense recommendations based on vitality
  if (traditionalStats.vitality < 70) {
    advice.push(`Your vitality (${traditionalStats.vitality}) is low - consider heavier armor for protection`);
  }
  if (traditionalStats.vitality > 90) {
    advice.push(`Your high vitality (${traditionalStats.vitality}) allows for lighter, faster armor`);
  }
  
  // Speed-based equipment advice
  if (traditionalStats.speed < 60) {
    advice.push(`Your speed (${traditionalStats.speed}) needs mobility-enhancing gear`);
  }
  if (traditionalStats.speed > 85) {
    advice.push(`Your excellent speed (${traditionalStats.speed}) would benefit from agility-focused equipment`);
  }
  
  // Ability-specific equipment needs
  const attackAbilities = abilities.filter(a => a.type === 'attack');
  const defenseAbilities = abilities.filter(a => a.type === 'defense');
  const specialAbilities = abilities.filter(a => a.type === 'special');
  
  if (attackAbilities.length > defenseAbilities.length) {
    advice.push('Focus on offensive weapons to complement your attack-heavy ability set');
  }
  if (defenseAbilities.length > attackAbilities.length) {
    advice.push('Invest in defensive gear to synergize with your protective abilities');
  }
  if (specialAbilities.length > 2) {
    advice.push('Consider spirit-boosting accessories to enhance your special abilities');
  }
  
  // Mental state equipment considerations
  if (character.psychStats.mentalHealth < 60) {
    advice.push('Choose reliable, simple equipment until your mental health improves');
  }
  if (character.psychStats.ego > 80) {
    advice.push('Flashy, prestigious equipment would suit your high ego personality');
  }
  
  // Character-specific recommendations
  if (character.personalityTraits.includes('Arrogant')) {
    advice.push('Your arrogance demands equipment that makes a statement');
  }
  if (character.personalityTraits.includes('Practical')) {
    advice.push('Focus on functional gear over flashy appearance');
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
    console.log('🔌 [EquipmentAdvisor] Connecting to local backend:', socketUrl);
    
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
    setIsTyping(true);

    console.log('📤 EquipmentAdvisor message:', content);

    // Generate dynamic equipment context
    const currentGearTier = Math.floor(Math.random() * 5) + 1; // Tier 1-5
    const weaponLevel = Math.floor(Math.random() * 20) + 1;
    const armorLevel = Math.floor(Math.random() * 20) + 1;
    
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
          interests: ['equipment optimization', 'gear synergy', 'weapon mastery', 'armor efficiency']
        },
        // Real combat stats that affect equipment choices
        traditionalStats: selectedCharacter.traditionalStats,
        psychStats: selectedCharacter.psychStats,
        // Current abilities that need equipment synergy
        abilities: selectedCharacter.abilities.map(a => ({
          name: a.name,
          type: a.type,
          power: a.power,
          description: a.description
        })),
        // Current status
        currentHp: selectedCharacter.currentHp,
        maxHp: selectedCharacter.maxHp,
        bondLevel: selectedCharacter.displayBondLevel,
        // Equipment-specific context
        conversationContext: `This is an equipment advisory session. The user is the coach who makes equipment decisions for ${selectedCharacter.name}. The character should advocate for gear choices that fit their archetype (${selectedCharacter.archetype}), stats, and personality. Focus on their actual stats: Strength: ${selectedCharacter.traditionalStats.strength}, Vitality: ${selectedCharacter.traditionalStats.vitality}, Speed: ${selectedCharacter.traditionalStats.speed}, Dexterity: ${selectedCharacter.traditionalStats.dexterity}, Intelligence: ${selectedCharacter.traditionalStats.intelligence}. The character should suggest equipment that enhances their strengths or compensates for weaknesses.`,
        equipmentData: {
          currentWeapon: {
            type: selectedCharacter.archetype === 'warrior' ? 'melee weapon' : 
                  selectedCharacter.archetype === 'mage' ? 'magical staff' : 
                  selectedCharacter.archetype === 'detective' ? 'precision weapon' : 'versatile weapon',
            level: weaponLevel,
            tier: `Tier ${currentGearTier}`,
            statRequirements: selectedCharacter.archetype === 'warrior' ? 'High Strength' :
                             selectedCharacter.archetype === 'mage' ? 'High Intelligence' :
                             selectedCharacter.archetype === 'detective' ? 'High Dexterity' : 'Balanced',
            upgradeAvailable: Math.random() > 0.5
          },
          currentArmor: {
            type: selectedCharacter.traditionalStats.vitality < 70 ? 'needs heavy armor' : 'can use light armor',
            level: armorLevel,
            tier: `Tier ${currentGearTier}`,
            defenseRating: 50 + (armorLevel * 5),
            speedPenalty: selectedCharacter.traditionalStats.speed > 85 ? 'avoid heavy armor' : 'heavy armor acceptable'
          },
          statBasedRecommendations: {
            strengthBased: selectedCharacter.traditionalStats.strength > 80,
            intelligenceBased: selectedCharacter.traditionalStats.intelligence > 80,
            dexterityBased: selectedCharacter.traditionalStats.dexterity > 80,
            speedBased: selectedCharacter.traditionalStats.speed > 80,
            needsVitalityBoost: selectedCharacter.traditionalStats.vitality < 70
          },
          personalityGearPrefs: {
            egotistical: selectedCharacter.psychStats.ego > 80,
            practical: selectedCharacter.personalityTraits.includes('Practical'),
            traditional: selectedCharacter.personalityTraits.includes('Traditional'),
            innovative: selectedCharacter.personalityTraits.includes('Innovative')
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

  const getEquipmentIntro = (character: EnhancedCharacter): string => {
    // Simple intro that lets the AI take over from there
    return `*${character.name} looks over their current equipment*\n\nCoach, I've been thinking about my gear lately. What equipment advice do you have for me?`;
  };

  useEffect(() => {
    if (selectedCharacter) {
      setMessages([
        {
          id: Date.now(),
          type: 'system',
          content: `Equipment consultation started with ${selectedCharacter.name}`,
          timestamp: new Date(),
        },
        {
          id: Date.now() + 1,
          type: 'character',
          content: getEquipmentIntro(selectedCharacter),
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
        className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl backdrop-blur-sm border border-blue-500/30 overflow-hidden"
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
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{character.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{character.name}</div>
                      <div className="text-xs text-gray-400 truncate">{character.title}</div>
                      <div className="text-xs text-blue-400 capitalize">{character.archetype}</div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Crown className="w-3 h-3" />
                      Gear Expertise
                    </div>
                    <div className="bg-gray-600 rounded-full h-1 mt-1">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full h-1 transition-all"
                        style={{ width: `${(character.displayBondLevel / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col">
            <div className="bg-gradient-to-r from-blue-800/30 to-cyan-800/30 p-4 border-b border-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedCharacter.avatar}</div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-blue-400" />
                    Equipment Advisor - {selectedCharacter.name}
                  </h3>
                  <p className="text-sm text-blue-200">Discuss gear choices, weapon preferences, and equipment strategy</p>
                </div>
                <div className="ml-auto flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Sword className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">Weapon Expert</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-gray-300">Armor Specialist</span>
                  </div>
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
                  placeholder={isTyping ? 'Character is considering equipment...' : `Ask ${selectedCharacter.name} about gear...`}
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