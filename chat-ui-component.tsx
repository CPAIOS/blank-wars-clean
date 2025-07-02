import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, Zap, Clock } from 'lucide-react';

// Import character data (in production, this would come from API)
const SAMPLE_CHARACTER = {
  id: "char_003",
  name: "Achilles",
  title: "Hero of Troy",
  archetype: "warrior",
  avatar: "⚔️",
  stats: {
    health: 85,
    maxHealth: 100,
    bondLevel: 3
  }
};

const CharacterChatUI = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: '⚔️ Chat break! Bond with Achilles between rounds.',
      timestamp: Date.now()
    },
    {
      id: 2,
      type: 'character',
      content: "That wizard's magic stings! But I've faced worse at Troy. Your guidance gives me strength, friend.",
      timestamp: Date.now()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [bondLevel, setBondLevel] = useState(SAMPLE_CHARACTER.stats.bondLevel);
  const [timeRemaining, setTimeRemaining] = useState(28 * 60 + 45); // seconds
  const [chatStats, setChatStats] = useState({
    messagesThisSession: 0,
    bondsGainedThisSession: 0
  });
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          // Show upgrade prompt
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Quick responses based on context
  const getQuickResponses = () => {
    const lastCharacterMessage = [...messages]
      .reverse()
      .find(m => m.type === 'character')?.content || '';
    
    if (lastCharacterMessage.toLowerCase().includes('hurt') || 
        lastCharacterMessage.toLowerCase().includes('pain')) {
      return [
        "Are you okay?",
        "You're so brave!",
        "Let me help you heal",
        "Rest now, warrior"
      ];
    } else if (lastCharacterMessage.toLowerCase().includes('troy')) {
      return [
        "Tell me more!",
        "Were you scared?",
        "Who was strongest?",
        "Miss home?"
      ];
    } else {
      return [
        "How are you?",
        "Great job!",
        "What's our plan?",
        "Tell me a story"
      ];
    }
  };

  // Handle sending messages
  const sendMessage = async (messageText = inputValue) => {
    if (!messageText.trim() || isTyping) return;
    
    const newMessage = {
      id: messages.length + 1,
      type: 'player',
      content: messageText,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);
    setChatStats(prev => ({ ...prev, messagesThisSession: prev.messagesThisSession + 1 }));
    
    // Deduct time for message (3 seconds)
    setTimeRemaining(prev => Math.max(0, prev - 3));
    
    // Simulate AI response
    setTimeout(() => {
      // Generate contextual response
      const responses = getCharacterResponses(messageText);
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      const aiMessage = {
        id: messages.length + 2,
        type: 'character',
        content: response,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      
      // Chance to increase bond
      if (Math.random() < 0.3) {
        increaseBond();
      }
    }, 1000 + Math.random() * 1000);
  };

  // Get contextual responses (simplified version)
  const getCharacterResponses = (playerMessage) => {
    const lower = playerMessage.toLowerCase();
    
    if (lower.includes('how are you') || lower.includes('feeling')) {
      return [
        "The wounds sting, but warriors of Troy endure all!",
        "I've been thinking of our strategy. We can improve!",
        "Your presence gives me strength. I'm ready for battle!"
      ];
    } else if (lower.includes('story') || lower.includes('troy')) {
      return [
        "Ah, Troy! Ten years we laid siege to those mighty walls...",
        "I remember Hector's face before our duel. A worthy foe.",
        "My mother dipped me in the River Styx as a babe. Made me nearly invincible!"
      ];
    } else if (lower.includes('great') || lower.includes('good job')) {
      return [
        "Your faith honors me! Together, we are unstoppable!",
        "Ha! Your words inspire me to fight harder!",
        "With you as my commander, victory is assured!"
      ];
    } else {
      return [
        "An interesting thought, friend. Tell me more.",
        "Your wisdom guides my spear arm well!",
        "Together we'll write legends worthy of Homer himself!"
      ];
    }
  };

  // Increase bond level
  const increaseBond = () => {
    setBondLevel(prev => {
      const newLevel = Math.min(10, prev + 1);
      
      if (newLevel > prev) {
        setMessages(messages => [...messages, {
          id: messages.length + 1,
          type: 'system',
          content: `💝 Bond Level increased to ${newLevel}!`,
          timestamp: Date.now()
        }]);
        
        setChatStats(prev => ({ ...prev, bondsGainedThisSession: prev.bondsGainedThisSession + 1 }));
      }
      
      return newLevel;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header with character info */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-purple-500/30 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl bg-gradient-to-br from-purple-500 to-pink-500 rounded-full w-16 h-16 flex items-center justify-center">
              {SAMPLE_CHARACTER.avatar}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{SAMPLE_CHARACTER.name}</h2>
              <p className="text-sm text-purple-300">{SAMPLE_CHARACTER.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Heart className="w-4 h-4 text-pink-500" />
                <span className="text-sm text-white">Bond Level {bondLevel}</span>
                <div className="flex text-pink-500">
                  {[...Array(Math.min(bondLevel, 5))].map((_, i) => (
                    <Heart key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Timer and stats */}
          <div className="text-right">
            <div className="flex items-center gap-2 text-white mb-1">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(timeRemaining)}</span>
              <span className="text-xs text-purple-300">remaining</span>
            </div>
            <div className="text-xs text-purple-400">
              {chatStats.messagesThisSession} messages • {chatStats.bondsGainedThisSession} bonds gained
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'player' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-2xl ${
                  message.type === 'system'
                    ? 'bg-yellow-500/20 text-yellow-200 text-center w-full text-sm italic'
                    : message.type === 'character'
                    ? 'bg-purple-600/30 text-white border border-purple-500/50'
                    : 'bg-blue-600/30 text-white border border-blue-500/50'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-purple-600/30 text-white px-4 py-2 rounded-2xl border border-purple-500/50">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-black/50 backdrop-blur-sm border-t border-purple-500/30 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Quick responses */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {getQuickResponses().map((response, i) => (
              <button
                key={i}
                onClick={() => sendMessage(response)}
                className="px-3 py-1 text-sm bg-purple-600/30 hover:bg-purple-600/50 text-white rounded-full border border-purple-500/50 transition-all"
                disabled={isTyping || timeRemaining === 0}
              >
                {response}
              </button>
            ))}
          </div>
          
          {/* Main input */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={timeRemaining > 0 ? "Chat with Achilles..." : "Daily limit reached! Upgrade for unlimited chat"}
              className="flex-1 bg-gray-800/50 text-white px-4 py-3 rounded-full border border-purple-500/50 focus:border-purple-400 focus:outline-none placeholder-gray-400"
              disabled={isTyping || timeRemaining === 0}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isTyping || timeRemaining === 0}
              className={`p-3 rounded-full transition-all ${
                inputValue.trim() && !isTyping && timeRemaining > 0
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Character health bar */}
          <div className="mt-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all duration-500"
                style={{ width: `${(SAMPLE_CHARACTER.stats.health / SAMPLE_CHARACTER.stats.maxHealth) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {SAMPLE_CHARACTER.stats.health}/{SAMPLE_CHARACTER.stats.maxHealth} HP
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade prompt overlay */}
      {timeRemaining === 0 && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-8 rounded-2xl max-w-md text-center border border-purple-500">
            <h3 className="text-2xl font-bold text-white mb-4">⏰ Daily Limit Reached!</h3>
            <p className="text-purple-200 mb-6">
              Your warriors need rest... but with Blank Wars Premium, the adventure never ends!
            </p>
            <div className="space-y-2 mb-6 text-left">
              <div className="flex items-center gap-2 text-green-400">
                <span>✓</span> Unlimited playtime
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span>✓</span> Deeper AI conversations
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span>✓</span> Exclusive legendary warriors
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-3 rounded-full font-bold text-lg transition-all transform hover:scale-105">
              Upgrade for $4.99/month
            </button>
            <p className="text-sm text-purple-300 mt-4">See you tomorrow, warrior! 💜</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterChatUI;