'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, Star, User, Sword, Shield, Zap } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { characterAPI } from '../services/apiClient';
import { Character } from '../data/characters';
import ConflictContextService, { LivingContext } from '../services/conflictContextService';
import EventContextService from '../services/eventContextService';
import EventPublisher from '../services/eventPublisher';
import GameEventBus from '../services/gameEventBus';

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
  selectedCharacter?: EnhancedCharacter;
  availableCharacters?: EnhancedCharacter[];
}

export default function EquipmentAdvisorChat({ 
  selectedCharacterId, 
  onCharacterChange,
  selectedCharacter: propSelectedCharacter,
  availableCharacters: propAvailableCharacters
}: EquipmentAdvisorChatProps) {
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
      // Clear messages when character changes
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
    // Determine backend URL based on environment
    let socketUrl: string;
    
    // Check if we're running locally (either in dev or local production build)
    const isLocalhost = typeof window !== 'undefined' && 
                       (window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1');
    
    if (isLocalhost) {
      // Local development or local production build
      socketUrl = 'http://localhost:3006';
    } else {
      // Deployed production
      socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://blank-wars-clean-production.up.railway.app';
    }
    
    console.log('🔌 [EquipmentAdvisor] Connecting to backend:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      withCredentials: true, // Include cookies for authentication
    });

    socketRef.current.on('connect', () => {
      console.log('✅ EquipmentAdvisor Socket connected!');
      setConnected(true);
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
        bondIncrease: data.bondIncrease || false,
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
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  // Load living context when character changes
  useEffect(() => {
    const loadLivingContext = async () => {
      if (selectedCharacter) {
        try {
          console.log('🏠 EquipmentAdvisor loading living context for:', selectedCharacter.baseName || selectedCharacter.name);
          const context = await conflictService.generateLivingContext(selectedCharacter.baseName || 
            selectedCharacter.name?.toLowerCase() || selectedCharacter.id);
          setLivingContext(context);
          console.log('✅ EquipmentAdvisor living context loaded:', context);
        } catch (error) {
          console.error('❌ EquipmentAdvisor failed to load living context:', error);
          setLivingContext(null);
        }
      }
    };

    loadLivingContext();
  }, [selectedCharacter?.id, conflictService]);

  // Generate equipment advice specific to the selected character
  const equipmentQuickMessages = generateEquipmentAdvice(selectedCharacter);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping || !connected || !socketRef.current) {
      console.log('❌ Equipment chat cannot send message:', { 
        hasContent: !!content.trim(), 
        isTyping, 
        connected, 
        hasSocket: !!socketRef.current 
      });
      return;
    }

    if (!selectedCharacter) {
      console.log('❌ Equipment chat: No selected character for message');
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

    // Generate compressed event context
    const characterId = selectedCharacter.baseName || selectedCharacter.name?.toLowerCase() || selectedCharacter.id;
    let eventContext = null;
    try {
      const contextString = await eventContextService.getEquipmentContext(characterId);
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

    // Use real character equipment data instead of fake data
    const currentEquipment = selectedCharacter.equippedItems || selectedCharacter.equipment || {};
    const inventory = selectedCharacter.inventory || [];
    const characterLevel = selectedCharacter.level || 1;
    
    socketRef.current.emit('chat_message', {
      message: content,
      character: selectedCharacter.baseName || selectedCharacter.name?.toLowerCase() || selectedCharacter.id,
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
        conversationContext: `This is an equipment advisory session. You are ${selectedCharacter.name}, speaking to your coach about your equipment and gear.

IMPORTANT: You MUST reference your actual equipment and inventory in conversation. You are fully aware of:

YOUR CURRENT STATS (reference these specific numbers):
- Level: ${selectedCharacter.level}
- Attack: ${selectedCharacter.base_attack}
- Health: ${selectedCharacter.current_health}/${selectedCharacter.max_health} (current/max)
- Defense: ${selectedCharacter.base_defense}
- Speed: ${selectedCharacter.base_speed}
- Special: ${selectedCharacter.base_special}
- Archetype: ${selectedCharacter.archetype}

YOUR CURRENT EQUIPMENT:
${Object.keys(currentEquipment).length > 0 ? 
  Object.entries(currentEquipment).map(([slot, item]) => `- ${slot}: ${item.name} (${item.type})`).join('\n') : 
  '- No equipment currently equipped'
}

YOUR INVENTORY (${inventory.length} items):
${inventory.length > 0 ? 
  inventory.slice(0, 5).map(item => `- ${item.name} (${item.type}) - ${item.description || 'Equipment item'}`).join('\n') : 
  '- No items in inventory'
}

You should naturally reference your current equipment, mention specific items in your inventory, and suggest equipment changes based on your stats. For example: "My attack is ${selectedCharacter.base_attack}, so I think that sword in my inventory would boost my damage" or "I'm currently using ${Object.keys(currentEquipment)[0] || 'basic gear'}, but I noticed that [specific item] might work better for my ${selectedCharacter.archetype} fighting style."`,
        equipmentData: {
          currentEquipment: currentEquipment,
          inventory: inventory,
          characterLevel: characterLevel,
          realCharacterStats: {
            base_attack: selectedCharacter.base_attack,
            base_health: selectedCharacter.base_health,
            base_defense: selectedCharacter.base_defense,
            base_speed: selectedCharacter.base_speed,
            base_special: selectedCharacter.base_special,
            current_health: selectedCharacter.current_health,
            max_health: selectedCharacter.max_health,
            level: selectedCharacter.level,
            archetype: selectedCharacter.archetype
          },
          statBasedRecommendations: {
            strengthBased: selectedCharacter.base_attack > 80,
            speedBased: selectedCharacter.base_speed > 80,
            defenseBased: selectedCharacter.base_defense > 80,
            healthBased: selectedCharacter.base_health > 80,
            specialBased: selectedCharacter.base_special > 80,
            needsAttackBoost: selectedCharacter.base_attack < 60,
            needsHealthBoost: selectedCharacter.base_health < 60,
            needsDefenseBoost: selectedCharacter.base_defense < 60,
            needsSpeedBoost: selectedCharacter.base_speed < 60
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

    // Publish equipment chat event
    try {
      const eventBus = GameEventBus.getInstance();
      await eventBus.publish({
        type: 'equipment_advice_requested',
        source: 'equipment_advisor',
        primaryCharacterId: characterId,
        severity: 'low',
        category: 'equipment',
        description: `${selectedCharacter.name} asked for equipment advice: "${content.substring(0, 100)}..."`,
        metadata: { 
          requestType: 'equipment_advice',
          messageLength: content.length,
          characterLevel: selectedCharacter.level || 1,
          currentArchetype: selectedCharacter.archetype
        },
        tags: ['equipment', 'advice', 'coaching']
      });
    } catch (error) {
      console.warn('Could not publish equipment event:', error);
    }

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