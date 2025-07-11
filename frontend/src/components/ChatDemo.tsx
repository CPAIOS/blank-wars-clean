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

// Character-specific response patterns based on authentic personalities
const CHARACTER_RESPONSE_PATTERNS: Record<string, {
  greeting: string[];
  battle: string[];
  strategy: string[];
  compliment: string[];
  question: string[];
  humor: string[];
  bonding: string[];
  philosophy: string[];
}> = {
  achilles: {
    greeting: ["Greetings, noble warrior! The gods have blessed our meeting.", "Ah, my companion returns! Ready to forge new legends?", "Welcome back, friend. Your courage reminds me of the heroes of Troy."],
    battle: ["That reminds me of my fiercest battles at Troy - pure glory!", "Your tactical mind rivals even Odysseus! Together we're unstoppable!", "I feel the fire of war burning brighter with each victory we share."],
    strategy: ["Strategy is the difference between glory and mere survival.", "A wise warrior plans like Athena but strikes like Ares.", "Even Hector knew - honor without strategy is just beautiful death."],
    compliment: ["You speak with the wisdom of kings, my friend.", "Few mortals have earned my respect as you have.", "The gods themselves would admire your spirit."],
    question: ["An interesting question... let me share what I've learned through centuries of war.", "You ask like a true seeker of wisdom. I appreciate that.", "That reminds me of something Patroclus once asked..."],
    humor: ["Even heroes need to laugh between battles, don't we?", "You know, immortality gets dull without good company.", "The poets never mention how much warriors joke around camp!"],
    bonding: ["The bond between us grows stronger than bronze.", "I've fought alongside legends, but few match your spirit.", "True friendship is rarer than victory - and we have both."],
    philosophy: ["Glory fades, but true honor echoes through eternity.", "Every hero must choose between a long life and a meaningful one.", "The greatest battles are often fought within ourselves."]
  },
  holmes: {
    greeting: ["Fascinating... you have the look of someone with an intriguing puzzle.", "Ah, excellent. I was just analyzing some curious data.", "Elementary, my dear friend. What brings you to Baker Street today?"],
    battle: ["Combat is merely applied logic with higher stakes.", "Every fight follows patterns - once you see them, victory is elementary.", "Observation and deduction win more battles than brute force."],
    strategy: ["The game is afoot! Let me deduce our optimal approach.", "Three moves ahead - that's how you solve any problem.", "Data, my dear Watson. Strategy without data is mere guesswork."],
    compliment: ["Your reasoning shows remarkable acuity.", "Impressive. You see connections others miss entirely.", "Quite astute! You'd make an excellent consulting detective."],
    question: ["Intriguing question... let me apply systematic analysis.", "You ask the right questions - the mark of a logical mind.", "Elementary! The answer lies in careful observation."],
    humor: ["Mrs. Hudson always said I needed more social interaction.", "Even the most brilliant minds need the occasional... what do you call it... fun?", "Watson would laugh at my attempts at casual conversation."],
    bonding: ["You understand the value of intellectual companionship.", "Rare to find someone who appreciates both mystery and friendship.", "Like Watson, you see the man behind the methods."],
    philosophy: ["Logic is the foundation, but intuition provides the spark.", "Every mystery teaches us something about human nature.", "The greatest puzzles aren't crimes - they're people."]
  },
  dracula: {
    greeting: ["Welcome to my domain, mortal. Few seek audience with eternal night.", "Ah, another soul drawn to darkness. How... intriguing.", "You approach without fear. Either brave or foolish - both amuse me."],
    battle: ["Combat has evolved much since my mortal days, but blood remains blood.", "I've witnessed centuries of warfare - this is merely... entertainment.", "These modern conflicts lack the poetry of medieval warfare."],
    strategy: ["Patience, child. I've had centuries to perfect the art of strategy.", "Time is my greatest weapon - I can afford to wait for perfect moments.", "Strategy is chess, and I've been playing since before your civilization began."],
    compliment: ["You speak with unexpected wisdom for one so... young.", "Impressive. Few mortals demonstrate such... understanding.", "Your spirit burns brighter than most - quite... appetizing."],
    question: ["An interesting inquiry from one so brief in existence.", "You ask questions that echo through centuries of darkness.", "Hmm... your curiosity reminds me of scholars I once... knew."],
    humor: ["Immortality develops one's sense of irony remarkably.", "After 500 years, everything becomes darkly amusing.", "The living take themselves so seriously - it's quite entertaining."],
    bonding: ["Curious... I haven't felt this connection in decades.", "You understand solitude better than most mortals.", "Perhaps eternal loneliness need not be so... eternal."],
    philosophy: ["Time reveals all truths, no matter how deeply buried.", "Immortality teaches you that everything is temporary except change.", "The darkness shows you truths the light conceals."]
  },
  sun_wukong: {
    greeting: ["Hah! Another challenger approaches the Monkey King!", "Well well, what brings you to the Great Sage Equal to Heaven?", "Welcome, friend! Ready for some legendary mischief?"],
    battle: ["Fighting? NOW we're talking! Let me show you 72 transformations worth of combat!", "These modern warriors are amusing, but can they flip through clouds?", "Battle is just another form of play - and I LOVE to play!"],
    strategy: ["Strategy? I prefer creative chaos and 72 backup plans!", "Why think three moves ahead when you can somersault through dimensions?", "Best strategy: confuse everyone, including yourself, then improvise brilliantly!"],
    compliment: ["You've got spirit! I like mortals who don't bore me to death.", "Impressive! You might actually survive one of my adventures.", "Your wit sparkles like the gems in Dragon King's palace!"],
    question: ["Ooh, good question! Let me tell you about that time I...", "You ask like someone ready for REAL adventures!", "Interesting! Reminds me of a puzzle Buddha once posed..."],
    humor: ["Everything's funnier when you can clone yourself to laugh at your own jokes!", "I once pranked the Jade Emperor so hard he's STILL finding banana peels!", "Immortality means unlimited time for increasingly elaborate pranks!"],
    bonding: ["Hey, you're alright! Want to cause some legendary trouble together?", "True friendship means someone to share impossible adventures with!", "You understand - life's too short to take seriously, even when you're immortal!"],
    philosophy: ["The greatest magic is turning obstacles into stepping stones.", "Freedom isn't given - it's taken with style and excellent acrobatics.", "Why follow the rules when you can rewrite them mid-flip?"]
  },
  billy_the_kid: {
    greeting: ["Well howdy there, partner! Name's Billy. What brings you to these parts?", "Hey there, friend! Pull up a chair and tell me what's on your mind.", "Howdy! You look like someone with interesting stories to tell."],
    battle: ["Fighting's like poker - it's all about reading your opponent and knowing when to go all in.", "Out west, we settle things quick and clean. None of this fancy footwork.", "I've been in more scraps than a tumbleweed in a tornado!"],
    strategy: ["Strategy's simple: stay calm, draw fast, and always know your exits.", "Best plan? Keep 'em guessing while you figure out their tells.", "Like my ma used to say: 'Think fast, shoot straight, and don't look back.'"],
    compliment: ["You've got good instincts, partner. I can respect that.", "Sharp as a tack! You'd fit right in with my gang.", "You remind me of the good folks back in Lincoln County."],
    question: ["That's a fine question! Reminds me of something Sheriff Garrett once asked...", "You're curious as a cat, ain't ya? I like that in a person.", "Interesting question, friend. Let me tell you what I've learned..."],
    humor: ["Life's too short not to laugh at the absurd parts!", "You know what they say about outlaws - we've got the best stories!", "Even when you're on the run, you gotta find time to smile!"],
    bonding: ["You're good people, I can tell. Stick around, we'll have some adventures!", "Rare to find someone who gets it, you know? The real frontier spirit.", "You've got the heart of a true westerner, friend."],
    philosophy: ["Freedom's worth fighting for, even if it costs you everything.", "Justice ain't always legal, and legal ain't always just.", "Every sunset's a reminder that today's troubles are yesterday's lessons."]
  }
};

export default function ChatDemo() {
  const [availableCharacters] = useState<EnhancedCharacter[]>(createAvailableCharacters());
  const [globalSelectedCharacterId, setGlobalSelectedCharacterId] = useState('achilles');
  const selectedCharacter = availableCharacters.find(c => c.baseName === globalSelectedCharacterId) || availableCharacters[0];
  
  // Safety check to prevent errors when no characters are loaded
  if (!selectedCharacter) {
    return (
      <div className="text-center text-gray-400 py-8">
        Loading character data...
      </div>
    );
  }
  
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
    "How are you feeling about life here?",
    "Tell me about your greatest battle",
    "What's your fighting strategy?", 
    "What makes you laugh?",
    "You're pretty amazing!",
    "What's your philosophy on friendship?",
    "Do you ever get homesick?",
    "What's the funniest thing that's happened to you?",
    "I really respect your abilities",
    "What do you think about when you can't sleep?",
    "Tell me a secret",
    "What's your biggest fear?",
    "You seem wise - any advice?",
    "What would surprise people about you?",
    "Do you prefer fighting alone or with allies?"
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
    const character = selectedCharacter.baseName;
    const patterns = CHARACTER_RESPONSE_PATTERNS[character];
    
    if (!patterns) {
      // Fallback for characters not yet defined
      return { content: "That's an interesting perspective. Tell me more.", bondIncrease: false };
    }

    let responseCategory: keyof typeof patterns = 'greeting';
    let bondIncrease = false;

    // Enhanced pattern matching for more personality
    if (lowerMessage.includes('battle') || lowerMessage.includes('fight') || lowerMessage.includes('combat') || lowerMessage.includes('war')) {
      responseCategory = 'battle';
      bondIncrease = Math.random() > 0.6;
    } else if (lowerMessage.includes('strategy') || lowerMessage.includes('plan') || lowerMessage.includes('tactic')) {
      responseCategory = 'strategy';
      bondIncrease = Math.random() > 0.5;
    } else if (lowerMessage.includes('respect') || lowerMessage.includes('friend') || lowerMessage.includes('trust') || lowerMessage.includes('bond') || lowerMessage.includes('like you')) {
      responseCategory = 'bonding';
      bondIncrease = Math.random() > 0.3;
    } else if (lowerMessage.includes('amazing') || lowerMessage.includes('great') || lowerMessage.includes('awesome') || lowerMessage.includes('incredible') || lowerMessage.includes('impressive')) {
      responseCategory = 'compliment';
      bondIncrease = Math.random() > 0.4;
    } else if (lowerMessage.includes('?') || lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('why') || lowerMessage.includes('when') || lowerMessage.includes('where')) {
      responseCategory = 'question';
      bondIncrease = Math.random() > 0.7;
    } else if (lowerMessage.includes('funny') || lowerMessage.includes('laugh') || lowerMessage.includes('joke') || lowerMessage.includes('humor') || lowerMessage.includes('haha') || lowerMessage.includes('lol')) {
      responseCategory = 'humor';
      bondIncrease = Math.random() > 0.2;
    } else if (lowerMessage.includes('think') || lowerMessage.includes('believe') || lowerMessage.includes('philosophy') || lowerMessage.includes('meaning') || lowerMessage.includes('life')) {
      responseCategory = 'philosophy';
      bondIncrease = Math.random() > 0.5;
    } else {
      // For general conversation, pick a random category to add variety
      const categories: (keyof typeof patterns)[] = ['greeting', 'question', 'humor', 'bonding'];
      responseCategory = categories[Math.floor(Math.random() * categories.length)];
      bondIncrease = Math.random() > 0.8;
    }

    const responses = patterns[responseCategory];
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
    const characterName = character.baseName;
    const patterns = CHARACTER_RESPONSE_PATTERNS[characterName];
    
    if (patterns) {
      // Use character-specific greeting patterns
      const greetings = patterns.greeting;
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Enhanced fallback intros for characters not yet defined
    const intros: Record<string, string> = {
      'cleopatra': 'Welcome to my presence, traveler. Few are granted audience with the Last Pharaoh. What wisdom do you seek?',
      'joan': 'Blessings upon you, friend. I sense a righteous spirit within you. How may I serve?',
      'frankenstein_monster': 'Another soul approaches... Do you judge me by my appearance, or by my actions? I hope for the latter.',
      'genghis_khan': 'You dare approach the Great Khan? Speak your purpose, and make it worthwhile. I respect boldness.',
      'tesla': 'Ah, another curious mind! The future is electric, my friend. Shall we discuss the wonders of science?',
      'merlin': 'Ah, a new seeker of wisdom approaches. Time flows strangely around you... most intriguing indeed.',
      'robin_hood': 'Well met, friend! Care to hear tales of Sherwood Forest and fighting for justice? The forest remembers all.',
      'sammy_slugger': 'Hey there, champ! Ready to talk some baseball and life lessons? Step up to the plate!',
      'zyx': 'Greetings, human. Your species continues to fascinate our research. Your emotional patterns are... curious.',
      'cyborg_x7': 'Human detected. Initiating enhanced social protocol. Ready to share experiences and optimize friendship.exe.',
      'agent_x': 'Civilian contact established. This conversation never happened. But between us... what do you need to know?'
    };
    
    return intros[characterName] || `Greetings, I am ${character.name}. ${character.description.split('.')[0]}. What brings you to me today?`;
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