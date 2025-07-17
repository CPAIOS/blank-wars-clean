'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, Star, User, TrendingUp, Activity, Target } from 'lucide-react';
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
  equipment?: any[];
  recentBattles?: any[];
  gameplanAdherence?: number;
  preferredStrategies?: string[];
  // Database fields
  base_attack?: number;
  base_health?: number;
  base_defense?: number;
  base_speed?: number;
  base_special?: number;
  current_health?: number;
  max_health?: number;
  bond_level?: number;
  wins?: number;
  losses?: number;
  character_id?: string;
  battleStats?: {
    totalBattles: number;
    wins: number;
    losses: number;
  };
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
        equipment: char.equipment || [],
        recentBattles: char.recent_battles || [],
        gameplanAdherence: char.gameplan_adherence || 0,
        preferredStrategies: char.preferred_strategies || [],
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

// Generate character-specific coaching advice based on actual stats, equipment, and battle history
const generateCoachingAdvice = (character: EnhancedCharacter): string[] => {
  const advice: string[] = [];

  // Safety check to prevent destructuring errors
  if (!character) {
    return ["Focus on consistent training", "Track your progress", "Stay motivated"];
  }

  const { baseStats, combatStats, level, equipment, abilities, recentBattles, gameplanAdherence } = character;

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

  // Equipment-based advice
  if (equipment && equipment.length > 0) {
    const weaponCount = equipment.filter(item => item.type === 'weapon').length;
    const armorCount = equipment.filter(item => item.type === 'armor').length;

    if (weaponCount === 0) {
      advice.push('Consider equipping a weapon to improve your combat effectiveness');
    }
    if (armorCount === 0) {
      advice.push('Armor could help reduce damage taken in battles');
    }

    // Check for equipment synergies
    const hasFireWeapon = equipment.some(item => item.element === 'fire');
    const hasIceArmor = equipment.some(item => item.element === 'ice');
    if (hasFireWeapon && hasIceArmor) {
      advice.push('Your fire weapon and ice armor create conflicting elements - consider matching your equipment');
    }
  }

  // Ability utilization advice
  if (abilities && abilities.length > 0) {
    const highCooldownAbilities = abilities.filter(ability => ability.cooldown > 3);
    if (highCooldownAbilities.length > 2) {
      advice.push('Consider balancing high-cooldown abilities with faster moves');
    }

    const elementalAbilities = abilities.filter(ability => ability.element);
    if (elementalAbilities.length > 0) {
      advice.push(`Your ${elementalAbilities[0].element} abilities could synergize better with matching equipment`);
    }
  }

  // Battle history analysis
  if (recentBattles && recentBattles.length > 0) {
    const recentLosses = recentBattles.filter(battle => battle.result === 'loss').length;
    const recentWins = recentBattles.filter(battle => battle.result === 'win').length;

    if (recentLosses > recentWins) {
      advice.push('Your recent battle performance suggests we need to adjust your strategy');
    }

    // Analyze common causes of defeat
    const commonProblems = recentBattles
      .filter(battle => battle.result === 'loss')
      .map(battle => battle.primaryCause)
      .reduce((acc, cause) => {
        acc[cause] = (acc[cause] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topProblem = Object.entries(commonProblems)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0];

    if (topProblem) {
      advice.push(`You've been struggling with ${topProblem[0]} - let's work on that together`);
    }
  }

  // Gameplan adherence feedback
  if (gameplanAdherence !== undefined) {
    if (gameplanAdherence < 0.6) {
      advice.push('You\'re not following our battle strategy consistently - let\'s review your gameplan');
    } else if (gameplanAdherence > 0.8) {
      advice.push('Excellent gameplan execution! Your strategy adherence is paying off');
    }
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
    advice.push('Let\'s develop a personalized gameplan for your next battles');
  }

  return advice.slice(0, 10); // Limit to 10 pieces of advice
};

interface PerformanceCoachingChatProps {
  selectedCharacterId?: string;
  onCharacterChange?: (characterId: string) => void;
  selectedCharacter?: EnhancedCharacter;
  availableCharacters?: EnhancedCharacter[];
}

export default function PerformanceCoachingChat({
  selectedCharacterId,
  onCharacterChange,
  selectedCharacter: propSelectedCharacter,
  availableCharacters: propAvailableCharacters
}: PerformanceCoachingChatProps) {
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
        bondIncrease: data.bondIncrease || false,
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

  // Load living context when character changes
  useEffect(() => {
    const loadLivingContext = async () => {
      if (selectedCharacter) {
        try {
          console.log('🏠 Loading living context for:', selectedCharacter.baseName || selectedCharacter.name);
          const context = await conflictService.generateLivingContext(selectedCharacter.baseName || selectedCharacter.name?.toLowerCase() || selectedCharacter.id);
          setLivingContext(context);
          console.log('✅ Living context loaded:', context);
        } catch (error) {
          console.error('❌ Failed to load living context:', error);
          setLivingContext(null);
        }
      }
    };

    loadLivingContext();
  }, [selectedCharacter?.id, conflictService]);

  // Generate coaching advice specific to the selected character
  const performanceQuickMessages = generateCoachingAdvice(selectedCharacter);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping || !connected || !socketRef.current) {
      console.log('❌ Cannot send message:', {
        hasContent: !!content.trim(),
        isTyping,
        connected,
        hasSocket: !!socketRef.current
      });
      return;
    }

    if (!selectedCharacter) {
      console.log('❌ No selected character for message');
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

    // Generate compressed event context
    const characterId = selectedCharacter.baseName || selectedCharacter.name?.toLowerCase() || selectedCharacter.id;
    let eventContext = null;
    try {
      const contextString = await eventContextService.getPerformanceContext(characterId);
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

    // Use real character performance data
    const recentBattles = (selectedCharacter.wins || 0) + (selectedCharacter.losses || 0) || 15;
    const battlesWon = selectedCharacter.wins || 10;
    const battlesLost = selectedCharacter.losses || 5;
    const winRate = recentBattles > 0 ? Math.round((battlesWon / recentBattles) * 100) : 67;

    socketRef.current.emit('chat_message', {
      message: content,
      character: selectedCharacter.baseName || selectedCharacter.name?.toLowerCase() || selectedCharacter.id,
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
        // Add living context for kitchen table conflict awareness
        livingContext: livingContext,
        // Add centralized event context
        eventContext: eventContext,
        // Real combat stats
        baseStats: selectedCharacter.baseStats,
        combatStats: selectedCharacter.combatStats,
        // Current status
        currentHp: selectedCharacter.combatStats?.health || 100,
        maxHp: selectedCharacter.combatStats?.maxHealth || 100,
        injuries: selectedCharacter.injuries,
        bondLevel: selectedCharacter.displayBondLevel,
        // Performance-specific context
        conversationContext: `This is a performance coaching session. You are ${selectedCharacter.name}, speaking to your coach about your combat performance.

IMPORTANT: You MUST reference your actual stats and performance data in conversation. You are aware of your:

CURRENT STATS (reference these specific numbers):
- Level: ${selectedCharacter.level}
- Attack: ${selectedCharacter.base_attack || selectedCharacter.baseStats?.strength || 'N/A'}
- Health: ${selectedCharacter.base_health || selectedCharacter.baseStats?.vitality || 'N/A'}/${selectedCharacter.max_health || selectedCharacter.combatStats?.maxHealth || 'N/A'} (current/max)
- Defense: ${selectedCharacter.base_defense || selectedCharacter.baseStats?.wisdom || 'N/A'}
- Speed: ${selectedCharacter.base_speed || selectedCharacter.baseStats?.agility || 'N/A'}
- Special: ${selectedCharacter.base_special || selectedCharacter.baseStats?.intelligence || 'N/A'}
- Experience: ${selectedCharacter.experience || 0}
- Bond Level: ${selectedCharacter.bond_level || selectedCharacter.displayBondLevel || 'N/A'}
- Archetype: ${selectedCharacter.archetype}

BATTLE RECORD YOU SHOULD MENTION:
- Total Battles: ${(selectedCharacter.wins || 0) + (selectedCharacter.losses || 0)}
- Wins: ${selectedCharacter.wins || 0}
- Losses: ${selectedCharacter.losses || 0}
- Win Rate: ${Math.round(((selectedCharacter.wins || 0) / Math.max((selectedCharacter.wins || 0) + (selectedCharacter.losses || 0), 1)) * 100)}%
- Gameplan Adherence: ${Math.round((selectedCharacter.gameplanAdherence || 0) * 100)}%

EQUIPMENT & COMBAT TOOLS:
- Current Equipment: ${selectedCharacter.equipment?.length || 0} items equipped
- Available Abilities: ${selectedCharacter.abilities?.length || 0} combat abilities
- Preferred Strategies: ${selectedCharacter.preferredStrategies?.join(', ') || 'Adaptive'}

You should naturally reference these numbers when discussing your performance, comparing to previous levels, or talking about areas for improvement. For example: "My attack is at ${selectedCharacter.base_attack || selectedCharacter.baseStats?.strength || 'N/A'} now, which feels stronger than when I was level ${Math.max(1, (selectedCharacter.level || 1) - 1)}" or "I've won ${selectedCharacter.wins || 0} out of my last ${(selectedCharacter.wins || 0) + (selectedCharacter.losses || 0)} battles. My gameplan adherence has been ${Math.round((selectedCharacter.gameplanAdherence || 0) * 100)}%, which ${(selectedCharacter.gameplanAdherence || 0) > 0.7 ? 'shows good discipline' : 'needs improvement'}."`,
        performanceData: {
          recentBattles,
          battlesWon,
          battlesLost,
          winRate: `${winRate}%`,
          currentLevel: selectedCharacter.level,
          currentExperience: selectedCharacter.experience,
          bondLevel: selectedCharacter.bond_level || selectedCharacter.displayBondLevel,
          gameplanAdherence: selectedCharacter.gameplanAdherence || 0,
          // Equipment analysis
          equipment: selectedCharacter.equipment || [],
          equippedWeapons: (selectedCharacter.equipment || []).filter(item => item.type === 'weapon'),
          equippedArmor: (selectedCharacter.equipment || []).filter(item => item.type === 'armor'),
          // Ability analysis
          abilities: selectedCharacter.abilities || [],
          preferredStrategies: selectedCharacter.preferredStrategies || [],
          recentBattleHistory: selectedCharacter.recentBattles || [],
          // Real stat analysis from database
          statWeaknesses: [
            (selectedCharacter.base_attack || 0) < 70 ? `Attack: ${selectedCharacter.base_attack}` : null,
            (selectedCharacter.base_health || 0) < 70 ? `Health: ${selectedCharacter.base_health}` : null,
            (selectedCharacter.base_defense || 0) < 70 ? `Defense: ${selectedCharacter.base_defense}` : null,
            (selectedCharacter.base_speed || 0) < 70 ? `Speed: ${selectedCharacter.base_speed}` : null,
            (selectedCharacter.base_special || 0) < 70 ? `Special: ${selectedCharacter.base_special}` : null
          ].filter(Boolean),
          statStrengths: [
            (selectedCharacter.base_attack || 0) >= 80 ? `Attack: ${selectedCharacter.base_attack}` : null,
            (selectedCharacter.base_health || 0) >= 80 ? `Health: ${selectedCharacter.base_health}` : null,
            (selectedCharacter.base_defense || 0) >= 80 ? `Defense: ${selectedCharacter.base_defense}` : null,
            (selectedCharacter.base_speed || 0) >= 80 ? `Speed: ${selectedCharacter.base_speed}` : null,
            (selectedCharacter.base_special || 0) >= 80 ? `Special: ${selectedCharacter.base_special}` : null
          ].filter(Boolean),
          realCharacterData: {
            id: selectedCharacter.id,
            character_id: selectedCharacter.character_id,
            current_health: selectedCharacter.current_health,
            max_health: selectedCharacter.max_health,
            base_attack: selectedCharacter.base_attack,
            base_defense: selectedCharacter.base_defense,
            base_health: selectedCharacter.base_health,
            base_speed: selectedCharacter.base_speed,
            base_special: selectedCharacter.base_special
          }
        }
      },
      previousMessages: messages.slice(-5).map(m => ({
        role: m.type === 'player' ? 'user' : 'assistant',
        content: m.content
      }))
    });

    // Publish performance coaching event with gameplan adherence boost
    try {
      await eventPublisher.publishChatInteraction({
        characterId,
        chatType: 'performance',
        message: content,
        outcome: 'helpful', // Default, could be determined by AI response
        // metadata: {
        //   gameplanAdherenceBoost: 0.05, // 5% boost for engaging in coaching
        //   sessionType: 'combat_training',
        //   equipmentDiscussed: (selectedCharacter.equipment || []).length > 0,
        //   abilitiesAnalyzed: (selectedCharacter.abilities || []).length > 0
        // }
      });

      // Apply temporary gameplan adherence boost
      if (selectedCharacter.gameplanAdherence !== undefined) {
        const newAdherence = Math.min(1.0, (selectedCharacter.gameplanAdherence || 0) + 0.05);
        console.log(`🎯 Combat training session boosted gameplan adherence from ${Math.round((selectedCharacter.gameplanAdherence || 0) * 100)}% to ${Math.round(newAdherence * 100)}%`);
      }
    } catch (error) {
      console.warn('Could not publish chat event:', error);
    }

  };

  const getPerformanceIntro = (character: EnhancedCharacter): string => {
    const equipmentCount = (character.equipment || []).length;
    const abilitiesCount = (character.abilities || []).length;
    const gameplanAdherence = Math.round(((character.gameplanAdherence || 0) as number) * 100);

    return `Coach, I'm ready for our combat training session. I've got ${equipmentCount} pieces of equipment and ${abilitiesCount} abilities at my disposal. My gameplan adherence has been ${gameplanAdherence}%. Let's work on improving my battle strategy and effectiveness.`;
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
                    1-on-1 Combat - {selectedCharacter?.name}
                  </h3>
                  <p className="text-sm text-orange-200">Analyze combat performance, discuss equipment & abilities, develop battle strategies</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-gray-300">Focus: Strategy & Gameplan Development</span>
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
                {isTyping ? ' ⏳ Developing strategy...' : ' ✅ Ready for combat training'} |
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
                  placeholder={isTyping ? 'Character is analyzing combat strategy...' : `Discuss strategy with ${selectedCharacter?.name}...`}
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
