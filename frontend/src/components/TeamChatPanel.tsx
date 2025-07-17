'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Users, Brain, Target, Shield } from 'lucide-react';
import { TeamCharacter } from '@/data/teamBattleSystem';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  sender: 'coach' | string; // 'coach' or character ID
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: Date;
  messageType: 'strategy' | 'encouragement' | 'concern' | 'general';
}

interface TeamChatPanelProps {
  playerTeam: { characters: TeamCharacter[] };
  phase: { name: string };
  currentRound: number;
  currentMatch: number;
  isVisible: boolean;
  onSendCoachMessage: (message: string) => void;
}

const messageTypeColors = {
  strategy: 'border-blue-500 bg-blue-900/20',
  encouragement: 'border-green-500 bg-green-900/20',
  concern: 'border-yellow-500 bg-yellow-900/20',
  general: 'border-gray-500 bg-gray-800/20'
};

const messageTypeIcons = {
  strategy: Target,
  encouragement: Shield,
  concern: Brain,
  general: MessageCircle
};

export default function TeamChatPanel({
  playerTeam,
  phase,
  currentRound,
  currentMatch,
  isVisible,
  onSendCoachMessage
}: TeamChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [coachMessage, setCoachMessage] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection for AI chat
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
    console.log('🔌 TeamChat connecting to backend:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ TeamChat Socket connected!');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ TeamChat Socket disconnected');
      setConnected(false);
    });

    socketRef.current.on('team_chat_response', (data: { character: string; message: string; characterId: string }) => {
      console.log('📨 Team chat response:', data);
      
      const respondingCharacter = playerTeam.characters.find(c => c.id === data.characterId);
      if (respondingCharacter) {
        const characterMessage: ChatMessage = {
          id: `${data.characterId}-${Date.now()}`,
          sender: data.characterId,
          senderName: respondingCharacter.name,
          senderAvatar: respondingCharacter.avatar,
          message: data.message || 'I must gather my thoughts...',
          timestamp: new Date(),
          messageType: 'general'
        };
        
        setMessages(prev => [...prev, characterMessage]);
      }
      setIsTyping(null);
    });

    socketRef.current.on('team_chat_error', (error: { message?: string; error?: string; usageLimitReached?: boolean }) => {
      console.error('❌ Team chat error:', error);
      setIsTyping(null);
      
      if (error.usageLimitReached) {
        setUsageLimitReached(true);
        // Add a system message about the usage limit
        const limitMessage: ChatMessage = {
          id: `limit-${Date.now()}`,
          sender: 'system',
          senderName: 'System',
          senderAvatar: '⚠️',
          message: error.error || 'Daily AI interaction limit reached. Upgrade to premium for more conversations!',
          timestamp: new Date(),
          messageType: 'concern'
        };
        setMessages(prev => [...prev, limitMessage]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []); // Remove dependency to prevent constant reconnects

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);


  // Add initial team greeting
  useEffect(() => {
    if (phase === 'strategy-selection' && messages.length === 0) {
      const initialMessages: ChatMessage[] = [
        {
          id: 'coach-welcome',
          sender: 'coach',
          senderName: 'Coach',
          senderAvatar: '🧑‍🏫',
          message: `Alright team, this is Match ${currentMatch}, Round ${currentRound}. Let's discuss our strategy and coordinate our approach.`,
          timestamp: new Date(),
          messageType: 'strategy'
        }
      ];

      // Add AI character introductions
      if (connected && socketRef.current) {
        playerTeam.characters.forEach((character, index) => {
          setTimeout(() => {
            socketRef.current?.emit('team_chat_message', {
              message: 'Introduce yourself to the coach for this battle',
              character: character.name,
              characterId: character.id,
              characterData: {
                name: character.name,
                archetype: character.archetype,
                avatar: character.avatar,
                personality: {
                  traits: [character.archetype],
                  speechStyle: character.archetype === 'warrior' ? 'Direct and bold' :
                             character.archetype === 'mage' ? 'Wise and mystical' :
                             character.archetype === 'trickster' ? 'Clever and playful' :
                             character.archetype === 'beast' ? 'Instinctual and loyal' : 'Determined',
                  motivations: [
                    character.archetype === 'warrior' ? 'Protect the team through strength' :
                    character.archetype === 'mage' ? 'Support through magical wisdom' :
                    character.archetype === 'trickster' ? 'Outsmart enemies with cunning' :
                    character.archetype === 'beast' ? 'Hunt as a pack' : 'Fight for victory'
                  ]
                },
                battleContext: {
                  phase: phase,
                  round: currentRound,
                  match: currentMatch,
                  messageType: 'general'
                }
              },
              previousMessages: [],
              isIntroduction: true
            });
          }, (index + 1) * 1000);
        });
      }

      setMessages(initialMessages);
    }
  }, [phase, currentMatch, currentRound, playerTeam.characters]);

  const handleSendCoachMessage = () => {
    if (!coachMessage.trim()) return;
    if (usageLimitReached) return;

    const newMessage: ChatMessage = {
      id: `coach-${Date.now()}`,
      sender: 'coach',
      senderName: 'Coach',
      senderAvatar: '🧑‍🏫',
      message: coachMessage,
      timestamp: new Date(),
      messageType: coachMessage.toLowerCase().includes('strategy') || coachMessage.toLowerCase().includes('plan') ? 'strategy' :
                  coachMessage.toLowerCase().includes('good') || coachMessage.toLowerCase().includes('great') ? 'encouragement' :
                  coachMessage.toLowerCase().includes('worry') || coachMessage.toLowerCase().includes('concern') ? 'concern' :
                  'general'
    };

    setMessages(prev => [...prev, newMessage]);
    onSendCoachMessage(coachMessage);
    setCoachMessage('');

    // Generate AI character responses using real OpenAI
    if (connected && socketRef.current) {
      const respondingCharacters = playerTeam.characters
        .filter(char => Math.random() > 0.3) // 70% chance each character responds
        .slice(0, 2); // Max 2 responses to avoid spam

      respondingCharacters.forEach((character, index) => {
        setIsTyping(character.id);
        
        setTimeout(() => {
          // Send to AI backend with battle context
          socketRef.current?.emit('team_chat_message', {
            message: coachMessage,
            character: character.name,
            characterId: character.id,
            characterData: {
              name: character.name,
              archetype: character.archetype,
              avatar: character.avatar,
              personality: {
                traits: [character.archetype], // Use archetype as main trait
                speechStyle: character.archetype === 'warrior' ? 'Direct and bold' :
                           character.archetype === 'mage' ? 'Wise and mystical' :
                           character.archetype === 'trickster' ? 'Clever and playful' :
                           character.archetype === 'beast' ? 'Instinctual and loyal' : 'Determined',
                motivations: [
                  character.archetype === 'warrior' ? 'Protect the team through strength' :
                  character.archetype === 'mage' ? 'Support through magical wisdom' :
                  character.archetype === 'trickster' ? 'Outsmart enemies with cunning' :
                  character.archetype === 'beast' ? 'Hunt as a pack' : 'Fight for victory'
                ]
              },
              battleContext: {
                phase: phase.name,
                round: currentRound,
                match: currentMatch,
                messageType: newMessage.messageType
              }
            },
            previousMessages: messages.slice(-5).map(m => ({
              role: m.sender === 'coach' ? 'user' : 'assistant',
              content: m.message,
              sender: m.senderName
            }))
          });

          // Retry AI request if no response
          setTimeout(() => {
            if (isTyping === character.id) {
              console.log('⏰ Retrying AI request for', character.name);
              // Retry the AI request
              socketRef.current?.emit('team_chat_message', {
                message: coachMessage,
                character: character.name,
                characterId: character.id,
                characterData: {
                  name: character.name,
                  archetype: character.archetype,
                  avatar: character.avatar,
                  personality: {
                    traits: [character.archetype],
                    speechStyle: character.archetype === 'warrior' ? 'Direct and bold' :
                               character.archetype === 'mage' ? 'Wise and mystical' :
                               character.archetype === 'trickster' ? 'Clever and playful' :
                               character.archetype === 'beast' ? 'Instinctual and loyal' : 'Determined',
                    motivations: [
                      character.archetype === 'warrior' ? 'Protect the team through strength' :
                      character.archetype === 'mage' ? 'Support through magical wisdom' :
                      character.archetype === 'trickster' ? 'Outsmart enemies with cunning' :
                      character.archetype === 'beast' ? 'Hunt as a pack' : 'Fight for victory'
                    ]
                  },
                  battleContext: {
                    phase: phase,
                    round: currentRound,
                    match: currentMatch,
                    messageType: newMessage.messageType
                  }
                },
                previousMessages: messages.slice(-5).map(m => ({
                  role: m.sender === 'coach' ? 'user' : 'assistant',
                  content: m.message,
                  sender: m.senderName
                })),
                retry: true
              });
            }
          }, 15000);
        }, (index + 1) * 1500 + Math.random() * 1000); // Staggered responses
      });
    } else {
      // No connection - retry connection and show error
      console.log('🔄 AI backend offline - attempting to reconnect...');
      socketRef.current?.connect();
      
      setTimeout(() => {
        if (!socketRef.current?.connected) {
          console.log('❌ Failed to reconnect to AI backend');
          setIsTyping(null);
        }
      }, 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCoachMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="text-blue-400" />
        <h3 className="text-lg font-bold text-white">Team Strategy Chat</h3>
        <div className="text-sm text-gray-400">
          ({playerTeam.characters.length + 1} participants)
        </div>
        <div className="ml-auto text-xs">
          {connected ? (
            <span className="text-green-400">🟢 AI Connected</span>
          ) : (
            <span className="text-red-400">🔴 AI Offline</span>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="h-80 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message) => {
            const isCoach = message.sender === 'coach';
            const MessageIcon = messageTypeIcons[message.messageType];
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded-lg border ${messageTypeColors[message.messageType]} ${
                  isCoach ? 'ml-4' : 'mr-4'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="text-xl flex-shrink-0">{message.senderAvatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-sm ${
                        isCoach ? 'text-blue-300' : 'text-white'
                      }`}>
                        {message.senderName}
                      </span>
                      <MessageIcon className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString([], { timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {message.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-gray-400 text-sm italic"
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>{playerTeam.characters.find(c => c.id === isTyping)?.name} is typing...</span>
          </motion.div>
        )}
      </div>

      {/* Quick Response Suggestions */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-2">
          {[
            'Great job everyone!',
            'Stay focused on the strategy',
            'Watch out for their counter-attacks',
            'Trust your training'
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setCoachMessage(suggestion)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={coachMessage}
          onChange={(e) => setCoachMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Coach your team..."
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          maxLength={200}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSendCoachMessage}
          disabled={!coachMessage.trim() || usageLimitReached}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 rounded-lg text-white font-medium transition-colors flex items-center gap-1"
        >
          <Send className="w-4 h-4" />
          {usageLimitReached && <span className="text-xs">Limit reached</span>}
        </motion.button>
      </div>

      {/* Character count */}
      <div className="text-xs text-gray-500 mt-1 text-right">
        {coachMessage.length}/200
      </div>
    </motion.div>
  );
}