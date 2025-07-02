'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, Heart, Star } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: number;
  type: 'player' | 'character' | 'system';
  content: string;
  timestamp: Date;
  bondIncrease?: boolean;
}

interface Character {
  id: string;
  name: string;
  title: string;
  avatar: string;
  archetype: string;
  bondLevel: number;
  isSelected: boolean;
}

const SAMPLE_CHARACTERS: Character[] = [
  { id: '1', name: 'Achilles', title: 'Hero of Troy', avatar: '⚔️', archetype: 'warrior', bondLevel: 3, isSelected: true },
  { id: '2', name: 'Merlin', title: 'The Eternal Wizard', avatar: '🧙', archetype: 'scholar', bondLevel: 2, isSelected: false },
  { id: '3', name: 'Cleopatra', title: 'Last Pharaoh', avatar: '👑', archetype: 'leader', bondLevel: 1, isSelected: false },
  { id: '4', name: 'Robin Hood', title: 'Forest Outlaw', avatar: '🏹', archetype: 'trickster', bondLevel: 4, isSelected: false },
];

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
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(SAMPLE_CHARACTERS[0]);
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
  const [socket, setSocket] = useState<Socket | null>(null);

  // Connect to WebSocket on mount
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    console.log('Connecting to WebSocket at:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });

    newSocket.on('connection_established', (data) => {
      console.log('Server confirmed connection:', data);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    newSocket.on('chat_response', (data: { message: string; character: string; bondIncrease?: boolean }) => {
      console.log('Received chat response:', data);
      
      const characterMessage: Message = {
        id: Date.now(),
        type: 'character',
        content: data.message,
        timestamp: new Date(),
        bondIncrease: data.bondIncrease || Math.random() > 0.7,
      };
      
      setMessages(prev => [...prev, characterMessage]);
      setIsTyping(false);
      console.log('Chat response processed, isTyping set to false');
    });

    newSocket.on('chat_error', (error: { error: string }) => {
      console.error('Chat error:', error);
      // Fallback to template response
      const fallbackResponse = TEMPLATE_RESPONSES.greeting[Math.floor(Math.random() * TEMPLATE_RESPONSES.greeting.length)];
      const characterMessage: Message = {
        id: Date.now(),
        type: 'character',
        content: fallbackResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, characterMessage]);
      setIsTyping(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const quickTestMessages = [
    "How are you feeling?",
    "Tell me about your greatest battle",
    "What&apos;s your fighting strategy?",
    "Do you have any weaknesses?",
    "What do you think of magic users?",
  ];

  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    // Add player message
    const playerMessage: Message = {
      id: Date.now(),
      type: 'player',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, playerMessage]);
    setInputMessage('');
    setIsTyping(true);

    console.log('Sending message to AI:', content);
    console.log('Socket connected?', socket.connected);

    // Send to AI backend via WebSocket
    socket.emit('chat_message', {
      message: content,
      character: selectedCharacter.id,
      characterData: {
        name: selectedCharacter.name,
        personality: {
          traits: ['Brave', 'Honorable', 'Fierce'],
          speechStyle: 'Epic and heroic, befitting a legendary warrior',
          motivations: ['Glory', 'Honor', 'Victory'],
          fears: ['Dishonor', 'Weakness', 'Betrayal']
        },
        bondLevel: selectedCharacter.bondLevel
      },
      previousMessages: messages.slice(-5).map(m => ({
        role: m.type === 'player' ? 'user' : 'assistant',
        content: m.content
      }))
    });
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

  const selectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setMessages([
      {
        id: Date.now(),
        type: 'system',
        content: `Chat session started with ${character.name}`,
        timestamp: new Date(),
      },
      {
        id: Date.now() + 1,
        type: 'character',
        content: getCharacterIntro(character),
        timestamp: new Date(),
      }
    ]);
  };

  const getCharacterIntro = (character: Character): string => {
    const intros = {
      'Achilles': 'Greetings, noble warrior! I sense great potential in you. Ready to forge our legend together?',
      'Merlin': 'Ah, a new seeker of wisdom approaches. Time flows strangely around you... most intriguing.',
      'Cleopatra': 'Welcome to my presence, traveler. Few are granted audience with the Last Pharaoh.',
      'Robin Hood': 'Well met, friend! Care to hear tales of Sherwood Forest and fighting for justice?',
    };
    return intros[character.name as keyof typeof intros] || 'Greetings, traveler.';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div 
        className="bg-black/40 rounded-xl backdrop-blur-sm border border-gray-700 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 h-[600px]">
          {/* Character Selection Sidebar */}
          <div className="bg-gray-800/50 p-4 border-r border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-white">Characters</h3>
            <div className="space-y-3">
              {SAMPLE_CHARACTERS.map((character) => (
                <motion.div
                  key={character.id}
                  onClick={() => selectCharacter(character)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedCharacter.id === character.id 
                      ? 'bg-purple-600/30 border-2 border-purple-500' 
                      : 'bg-gray-700/50 border-2 border-transparent hover:border-gray-600'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{character.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate">{character.name}</div>
                      <div className="text-xs text-gray-400 truncate">{character.title}</div>
                      <div className="text-xs text-purple-400 capitalize">{character.archetype}</div>
                    </div>
                  </div>
                  
                  {/* Bond Level */}
                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Heart className="w-3 h-3" />
                      Bond Level {character.bondLevel}/10
                    </div>
                    <div className="bg-gray-600 rounded-full h-1 mt-1">
                      <div 
                        className="bg-gradient-to-r from-pink-500 to-red-500 rounded-full h-1 transition-all"
                        style={{ width: `${(character.bondLevel / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
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
                  <span className="text-sm text-gray-300">Bond: {selectedCharacter.bondLevel}/10</span>
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
            </div>

            {/* Input Area - Always Visible */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              {/* Debug info */}
              <div className="text-xs text-gray-500 mb-2">
                Socket: {socket?.connected ? '✅ Connected' : '❌ Disconnected'} | 
                Typing: {isTyping ? '⏳ AI Responding...' : '✅ Ready'} | 
                Messages: {messages.length} |
                Input: {inputMessage ? `"${inputMessage.substring(0,20)}..."` : 'Empty'}
              </div>
              
              <div className="flex gap-2">
                <input
                  key="chat-input" // Force re-render
                  type="text"
                  value={inputMessage}
                  onChange={(e) => {
                    console.log('Input changed:', e.target.value);
                    setInputMessage(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    console.log('Key pressed:', e.key, 'isTyping:', isTyping);
                    if (e.key === 'Enter' && !isTyping && inputMessage.trim()) {
                      sendMessage(inputMessage);
                    }
                  }}
                  placeholder={isTyping ? 'AI is responding...' : `Message ${selectedCharacter.name}...`}
                  disabled={isTyping}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  autoComplete="off"
                />
                <button
                  onClick={() => {
                    console.log('Send button clicked:', inputMessage);
                    if (inputMessage.trim() && !isTyping) {
                      sendMessage(inputMessage);
                    }
                  }}
                  disabled={!inputMessage.trim() || isTyping || !socket?.connected}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-600 disabled:to-gray-500 text-white p-2 rounded-full transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
                
                {/* Always show emergency controls */}
                <button
                  onClick={() => {
                    console.log('Force reset triggered - isTyping was:', isTyping);
                    setIsTyping(false);
                    setInputMessage('');
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full transition-all text-xs"
                  title="Reset chat state"
                >
                  🔄
                </button>
                
                <button
                  onClick={() => {
                    console.log('Force refresh triggered');
                    window.location.reload();
                  }}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white p-2 rounded-full transition-all text-xs"
                  title="Refresh page"
                >
                  ⚡
                </button>
              </div>
              
              {/* Force visible fallback input */}
              <div className="mt-2 text-xs text-gray-600">
                Emergency input: <input 
                  type="text" 
                  className="bg-gray-900 text-white p-1 rounded text-xs"
                  placeholder="Backup input if main fails"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value;
                      if (value.trim()) {
                        setInputMessage(value);
                        sendMessage(value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}