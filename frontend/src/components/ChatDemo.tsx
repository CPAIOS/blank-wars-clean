'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Heart, Star, User } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { createDemoCharacterCollection, Character } from '../data/characters';

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

// Create enhanced character collection with all 17 characters
const createAvailableCharacters = (): EnhancedCharacter[] => {
  return createDemoCharacterCollection().map(char => {
    const baseName = char.id.split('_')[0];
    return {
      ...char,
      baseName,
      displayBondLevel: char.bondLevel || Math.floor(Math.random() * 5) + 1
    };
  });
};

const TEMPLATE_RESPONSES = {
  greeting: [
    "Greetings, noble warrior! Ready for another glorious battle?",
    "Ah, my trusted companion returns! What wisdom do you seek today?",
    "The battlefield awaits, friend. Shall we discuss strategy?",
  ],
  battle: [
    "That last fight reminded me of my battles at Troy - fierce and honorable!",
    "Your tactical mind impresses me. Together, we are unstoppable!",
    "I feel my strength growing with each victory we share.",
  ],
  bonding: [
    "You know, few mortals have earned my respect as you have.",
    "In all my years of war, I've rarely found such a worthy ally.",
    "The bond between us grows stronger than bronze, my friend.",
  ],
  victory: [
    "Another triumph! The gods smile upon our partnership!",
    "Victory tastes sweeter when shared with a true companion!",
    "Together we write legends that will echo through eternity!",
  ],
  defeat: [
    "Even heroes stumble, but we shall rise stronger!",
    "This setback only fuels my desire for the next battle!",
    "Learn from this, as I have learned from many defeats.",
  ]
};

export default function ChatDemo() {
  const [availableCharacters] = useState<EnhancedCharacter[]>(createAvailableCharacters());
  const [globalSelectedCharacterId, setGlobalSelectedCharacterId] = useState('achilles');
  const selectedCharacter = availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'system',
      content: 'Chat session started with Achilles',
      timestamp: new Date(),
    },
    {
      id: 2,
      type: 'character',
      content: 'Greetings, noble warrior! I sense great potential in you. Ready to forge our legend together?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = 'http://localhost:3006';
    console.log('🔌 [FIXED] Connecting to local backend:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ ChatDemo Socket connected to backend!');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ ChatDemo Socket disconnected');
      setConnected(false);
    });

    socketRef.current.on('chat_response', (data: { character: string; message: string; bondIncrease?: boolean }) => {
      console.log('📨 Received response:', data);
      
      const characterMessage: Message = {
        id: Date.now(),
        type: 'character',
        content: data.message || 'I must gather my thoughts...',
        timestamp: new Date(),
        bondIncrease: data.bondIncrease || Math.random() > 0.7,
      };
      
      setMessages(prev => [...prev, characterMessage]);
      setIsTyping(false);
    });

    socketRef.current.on('chat_error', (error: { message: string }) => {
      console.error('❌ Chat error:', error);
      setIsTyping(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickTestMessages = [
    "How are you feeling?",
    "Tell me about your greatest battle",
    "What&apos;s your fighting strategy?",
    "Do you have any weaknesses?",
    "What do you think of magic users?",
  ];

  const sendMessage = (content: string) => {
    if (!content.trim() || isTyping || !connected || !socketRef.current) {
      console.log('❌ Cannot send message:', { content: content.trim(), isTyping, connected, socket: !!socketRef.current });
      return;
    }

    // Add player message immediately
    const playerMessage: Message = {
      id: Date.now(),
      type: 'player',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, playerMessage]);
    setInputMessage('');
    setIsTyping(true);

    console.log('📤 Sending message:', content);

    // Send to backend with full character data
    socketRef.current.emit('chat_message', {
      message: content,
      character: selectedCharacter.baseName,
      characterData: {
        name: selectedCharacter.name,
        personality: {
          traits: selectedCharacter.personality.traits,
          speechStyle: selectedCharacter.personality.speechStyle,
          motivations: selectedCharacter.personality.motivations,
          fears: selectedCharacter.personality.fears,
          interests: selectedCharacter.personality.traits.includes('Scholar') ? ['Books', 'Knowledge', 'Ancient texts'] : 
                   selectedCharacter.personality.traits.includes('Warrior') ? ['Battle', 'Honor', 'Training'] :
                   selectedCharacter.personality.traits.includes('Mystic') ? ['Magic', 'Mysteries', 'Prophecy'] : 
                   ['Adventure', 'Discovery', 'Stories'],
          quirks: selectedCharacter.personality.traits.includes('Eccentric') ? ['Peculiar habits', 'Unusual interests'] :
                 selectedCharacter.personality.traits.includes('Analytical') ? ['Logical thinking', 'Detail-oriented'] :
                 selectedCharacter.personality.traits.includes('Charismatic') ? ['Natural leadership', 'Inspiring presence'] :
                 ['Unique mannerisms', 'Personal style']
        },
        historicalPeriod: selectedCharacter.historicalPeriod,
        mythology: selectedCharacter.mythology,
        bondLevel: selectedCharacter.displayBondLevel
      },
      previousMessages: messages.slice(-5).map(m => ({
        role: m.type === 'player' ? 'user' : 'assistant',
        content: m.content
      }))
    });

    // Safety timeout
    setTimeout(() => {
      if (isTyping) {
        console.log('⏰ Response timeout - resetting');
        setIsTyping(false);
      }
    }, 15000);
  };

  const generateResponse = (playerMessage: string): { content: string; bondIncrease: boolean } => {
    const lowerMessage = playerMessage.toLowerCase();
    let responseCategory = 'greeting';
    let bondIncrease = false;

    // Simple pattern matching for demo
    if (lowerMessage.includes('battle') || lowerMessage.includes('fight')) {
      responseCategory = 'battle';
      bondIncrease = Math.random() > 0.7;
    } else if (lowerMessage.includes('strategy') || lowerMessage.includes('plan')) {
      responseCategory = 'battle';
      bondIncrease = Math.random() > 0.6;
    } else if (lowerMessage.includes('respect') || lowerMessage.includes('friend') || lowerMessage.includes('trust')) {
      responseCategory = 'bonding';
      bondIncrease = Math.random() > 0.4;
    } else if (lowerMessage.includes('victory') || lowerMessage.includes('win')) {
      responseCategory = 'victory';
      bondIncrease = Math.random() > 0.5;
    } else if (lowerMessage.includes('defeat') || lowerMessage.includes('loss') || lowerMessage.includes('fail')) {
      responseCategory = 'defeat';
      bondIncrease = Math.random() > 0.8; // Being vulnerable increases bond
    }

    const responses = TEMPLATE_RESPONSES[responseCategory as keyof typeof TEMPLATE_RESPONSES];
    const content = responses[Math.floor(Math.random() * responses.length)];

    return { content, bondIncrease };
  };

  // Update messages when character changes
  useEffect(() => {
    if (selectedCharacter) {
      setMessages([
        {
          id: Date.now(),
          type: 'system',
          content: `Chat session started with ${selectedCharacter.name}`,
          timestamp: new Date(),
        },
        {
          id: Date.now() + 1,
          type: 'character',
          content: getCharacterIntro(selectedCharacter),
          timestamp: new Date(),
        }
      ]);
    }
  }, [selectedCharacter?.id]);

  const getCharacterIntro = (character: EnhancedCharacter): string => {
    const intros: Record<string, string> = {
      'Achilles': 'Greetings, noble warrior! I sense great potential in you. Ready to forge our legend together?',
      'Merlin': 'Ah, a new seeker of wisdom approaches. Time flows strangely around you... most intriguing.',
      'Cleopatra VII': 'Welcome to my presence, traveler. Few are granted audience with the Last Pharaoh.',
      'Robin Hood': 'Well met, friend! Care to hear tales of Sherwood Forest and fighting for justice?',
      'Sherlock Holmes': 'Fascinating... You have the look of someone with an interesting problem to solve.',
      'Count Dracula': 'Welcome to my domain, mortal. Few dare to seek audience with the night itself.',
      'Joan of Arc': 'Blessings upon you, friend. I sense a righteous spirit within you.',
      'Frankenstein\'s Monster': 'Another soul approaches... Do you judge me by my appearance, or my actions?',
      'Sun Wukong': 'Hah! Another challenger approaches the Monkey King! Are you here to test your skills?',
      'Sammy "The Slugger" Sullivan': 'Hey there, champ! Ready to talk some baseball and life lessons?',
      'Billy the Kid': 'Well howdy there, partner. Name\'s Billy. What brings you to these parts?',
      'Genghis Khan': 'You dare approach the Great Khan? Speak your purpose, and make it worthwhile.',
      'Nikola Tesla': 'Ah, another curious mind! The future is electric, my friend. Shall we discuss it?',
      'Zyx (Alien Grey)': 'Greetings, human. Your species continues to fascinate our research. Tell me about yourself.',
      'Cyborg Unit X-7': 'Human detected. Initiating social protocol. How may I assist you today?',
      'Agent X': 'Civilian contact established. This conversation never happened. What do you need to know?'
    };
    return intros[character.name] || `Greetings, I am ${character.name}. ${character.description.split('.')[0]}.`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div 
        className="bg-black/40 rounded-xl backdrop-blur-sm border border-gray-700 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 h-[700px]">
          {/* Character Selection Sidebar - Consistent with other tabs */}
          <div className="w-80 bg-gray-800/80 rounded-xl p-4 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Characters
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => setGlobalSelectedCharacterId(character.baseName)}
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
                  
                  {/* Bond Level */}
                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Heart className="w-3 h-3" />
                      Bond Level {character.displayBondLevel}/10
                    </div>
                    <div className="bg-gray-600 rounded-full h-1 mt-1">
                      <div 
                        className="bg-gradient-to-r from-pink-500 to-red-500 rounded-full h-1 transition-all"
                        style={{ width: `${(character.displayBondLevel / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col">
            {/* Chat Header */}
            <div className="bg-gray-800/30 p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedCharacter.avatar}</div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCharacter.name}</h3>
                  <p className="text-sm text-gray-400">{selectedCharacter.title}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-sm text-gray-300">Bond: {selectedCharacter.displayBondLevel}/10</span>
                </div>
              </div>
            </div>

            {/* Quick Test Buttons */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex flex-wrap gap-2">
                {quickTestMessages.map((msg, index) => (
                  <motion.button
                    key={index}
                    onClick={() => sendMessage(msg)}
                    className="bg-gray-700/50 hover:bg-gray-600/50 text-white text-xs px-3 py-1 rounded-full border border-gray-600 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {msg}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Messages */}
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
                      ? 'bg-purple-600 text-white'
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
                        Bond increased!
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
                  <div className="bg-purple-600 text-white px-4 py-2 rounded-lg">
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

            {/* Input Area - Always Visible */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              {/* Debug info */}
              <div className="text-xs text-gray-500 mb-2">
                Status: {socketRef.current?.connected ? '🟢 Connected' : '🔴 Disconnected'} | 
                {isTyping ? ' ⏳ AI Responding...' : ' ✅ Ready'} | 
                Messages: {messages.length}
              </div>
              
              <div className="flex gap-2">
                <input
                  key="chat-input" // Force re-render
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputMessage);
                    }
                  }}
                  placeholder={isTyping ? 'AI is responding...' : `Message ${selectedCharacter.name}...`}
                  disabled={isTyping}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  autoComplete="off"
                />
                <button
                  onClick={() => sendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || isTyping || !socketRef.current?.connected}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-600 disabled:to-gray-500 text-white p-2 rounded-full transition-all"
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