'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coffee, 
  Users, 
  Sparkles,
  MessageCircle,
  LogIn,
  LogOut,
  Clock,
  Dice1,
  Music,
  Star,
  Activity
} from 'lucide-react';
import GameEventBus from '../services/gameEventBus';
import EventContextService from '../services/eventContextService';

interface LoungeCharacter {
  id: string;
  name: string;
  avatar: string;
  teamName: string;
  teamOwner?: string; // "You" or player name like "Player_Sarah"
  status: 'active' | 'idle' | 'typing';
  mood: 'relaxed' | 'excited' | 'annoyed' | 'thoughtful' | 'playful';
  currentActivity?: string;
  lastSeen?: Date;
  isYourCharacter: boolean;
}

interface LoungeMessage {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  teamOwner?: string;
  content: string;
  type: 'chat' | 'action' | 'join' | 'leave' | 'emote';
  timestamp: Date;
  mentions?: string[];
  referencedBattle?: {
    id: string;
    participants: string[];
    winner: string;
  };
}

interface LoungeTopic {
  id: string;
  topic: string;
  participants: string[];
  heat: number; // 0-100 how heated the discussion is
}

// Sample lounge state
const generateInitialCharacters = (): LoungeCharacter[] => [
  {
    id: 'your_achilles',
    name: 'Achilles',
    avatar: '⚔️',
    teamName: 'Your Team',
    teamOwner: 'You',
    status: 'active',
    mood: 'relaxed',
    currentActivity: 'Sharing war stories',
    isYourCharacter: true
  },
  {
    id: 'sarah_cleopatra',
    name: 'Cleopatra',
    avatar: '👸',
    teamName: 'Dynasty Queens',
    teamOwner: 'Player_Sarah',
    status: 'active',
    mood: 'playful',
    currentActivity: 'Gossiping about recent battles',
    isYourCharacter: false
  },
  {
    id: 'mike_tesla',
    name: 'Tesla',
    avatar: '⚡',
    teamName: 'Tech Titans',
    teamOwner: 'Player_Mike',
    status: 'typing',
    mood: 'thoughtful',
    currentActivity: 'Explaining electromagnetic combat theory',
    isYourCharacter: false
  },
  {
    id: 'npc_napoleon',
    name: 'Napoleon',
    avatar: '👑',
    teamName: 'Free Agents',
    status: 'idle',
    mood: 'annoyed',
    currentActivity: 'Complaining about the meta',
    lastSeen: new Date(Date.now() - 1000 * 60 * 5),
    isYourCharacter: false
  }
];

const generateInitialMessages = (): LoungeMessage[] => [
  {
    id: 'msg_1',
    characterId: 'sarah_cleopatra',
    characterName: 'Cleopatra',
    characterAvatar: '👸',
    teamOwner: 'Player_Sarah',
    content: '*sips wine elegantly* So I heard TeamCrusher42 is using that broken Achilles-Merlin combo. How... predictable.',
    type: 'chat',
    timestamp: new Date(Date.now() - 1000 * 60 * 10)
  },
  {
    id: 'msg_2',
    characterId: 'your_achilles',
    characterName: 'Achilles',
    characterAvatar: '⚔️',
    teamOwner: 'You',
    content: 'Broken? I prefer to call it "optimized for victory." Not my fault others can\'t keep up! 💪',
    type: 'chat',
    timestamp: new Date(Date.now() - 1000 * 60 * 9),
    mentions: ['Cleopatra']
  },
  {
    id: 'msg_3',
    characterId: 'mike_tesla',
    characterName: 'Tesla',
    characterAvatar: '⚡',
    teamOwner: 'Player_Mike',
    content: 'Actually, the mathematical probability of countering that combo is 47.3% with proper electromagnetic shielding...',
    type: 'chat',
    timestamp: new Date(Date.now() - 1000 * 60 * 8)
  },
  {
    id: 'msg_4',
    characterId: 'system',
    characterName: 'Joan of Arc',
    characterAvatar: '⚜️',
    content: 'has entered the lounge',
    type: 'join',
    timestamp: new Date(Date.now() - 1000 * 60 * 7)
  },
  {
    id: 'msg_5',
    characterId: 'alex_joan',
    characterName: 'Joan of Arc',
    characterAvatar: '⚜️',
    teamOwner: 'Player_Alex',
    content: 'Peace, friends! I bring news from the tournament brackets. We\'re facing some tough matchups tomorrow.',
    type: 'chat',
    timestamp: new Date(Date.now() - 1000 * 60 * 6)
  }
];

// Ambient activities that happen in the background
const ambientActivities = [
  '{character} is practicing combat moves in the corner',
  '{character} is sketching battle formations on a napkin',
  '{character} orders another drink from the bar',
  '{character} laughs at something on their mystical scroll',
  '{character} is arm wrestling with another warrior',
  '{character} is telling an elaborate story about their last battle',
  '{character} is playing cards with some mercenaries',
  '{character} is polishing their weapon absent-mindedly'
];

// Topics that characters might discuss
const loungeTopics = [
  'The current meta and why it needs balancing',
  'That insane comeback in yesterday\'s tournament',
  'Whether healing builds are "honorable" or not',
  'The best counter to speed teams',
  'Rumors about new legendary characters coming',
  'The drama between Guild_Warriors and Guild_Mystics',
  'Tips for climbing the leaderboard',
  'Funny glitches and exploits people have found'
];

export default function ClubhouseLounge() {
  const [characters, setCharacters] = useState<LoungeCharacter[]>(generateInitialCharacters());
  const [messages, setMessages] = useState<LoungeMessage[]>(generateInitialMessages());
  const [userInput, setUserInput] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('your_achilles');
  const [currentTopic, setCurrentTopic] = useState<LoungeTopic>({
    id: 'topic_1',
    topic: loungeTopics[0],
    participants: ['your_achilles', 'sarah_cleopatra'],
    heat: 30
  });
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate character activities
  useEffect(() => {
    const interval = setInterval(() => {
      // Random character actions
      if (Math.random() > 0.7) {
        simulateCharacterAction();
      }
      
      // Random new character joining
      if (Math.random() > 0.95) {
        simulateNewCharacterJoining();
      }
      
      // Topic changes
      if (Math.random() > 0.9) {
        changeTopic();
      }
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Simulate typing indicators
  useEffect(() => {
    const typingInterval = setInterval(() => {
      if (Math.random() > 0.8 && isTyping.length === 0) {
        const randomChar = characters[Math.floor(Math.random() * characters.length)];
        if (!randomChar.isYourCharacter) {
          setIsTyping([randomChar.id]);
          setTimeout(() => {
            setIsTyping([]);
            // Generate their message
            generateAIMessage(randomChar);
          }, 2000 + Math.random() * 3000);
        }
      }
    }, 5000);

    return () => clearInterval(typingInterval);
  }, [characters, isTyping]);

  const simulateCharacterAction = () => {
    const activeChars = characters.filter(c => c.status === 'active' && !c.isYourCharacter);
    if (activeChars.length === 0) return;
    
    const char = activeChars[Math.floor(Math.random() * activeChars.length)];
    const activity = ambientActivities[Math.floor(Math.random() * ambientActivities.length)];
    
    const actionMessage: LoungeMessage = {
      id: `msg_${Date.now()}`,
      characterId: char.id,
      characterName: char.name,
      characterAvatar: char.avatar,
      teamOwner: char.teamOwner,
      content: activity.replace('{character}', char.name),
      type: 'action',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, actionMessage]);
  };

  const simulateNewCharacterJoining = () => {
    const newCharacters = [
      { name: 'Loki', avatar: '🎭', team: 'Trickster\'s Guild', owner: 'Player_James' },
      { name: 'Einstein', avatar: '🧠', team: 'Big Brain Squad', owner: 'Player_Emma' },
      { name: 'Fenrir', avatar: '🐺', team: 'Pack Hunters', owner: 'Player_Wolf' },
      { name: 'Caesar', avatar: '🏛️', team: 'Roman Legion', owner: 'Player_Marcus' }
    ];
    
    const newChar = newCharacters[Math.floor(Math.random() * newCharacters.length)];
    const charId = `${newChar.owner.toLowerCase()}_${newChar.name.toLowerCase()}`;
    
    // Check if already present
    if (characters.find(c => c.id === charId)) return;
    
    const loungeChar: LoungeCharacter = {
      id: charId,
      name: newChar.name,
      avatar: newChar.avatar,
      teamName: newChar.team,
      teamOwner: newChar.owner,
      status: 'active',
      mood: 'relaxed',
      isYourCharacter: false
    };
    
    setCharacters(prev => [...prev, loungeChar]);
    
    const joinMessage: LoungeMessage = {
      id: `msg_${Date.now()}`,
      characterId: 'system',
      characterName: newChar.name,
      characterAvatar: newChar.avatar,
      content: 'has entered the lounge',
      type: 'join',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, joinMessage]);
  };

  const changeTopic = () => {
    const newTopic = loungeTopics[Math.floor(Math.random() * loungeTopics.length)];
    const participants = characters
      .filter(c => c.status === 'active')
      .slice(0, 2 + Math.floor(Math.random() * 3))
      .map(c => c.id);
    
    setCurrentTopic({
      id: `topic_${Date.now()}`,
      topic: newTopic,
      participants,
      heat: Math.floor(Math.random() * 60) + 20
    });
  };

  const generateAIMessage = async (character: LoungeCharacter) => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found for AI message generation');
        return;
      }

      // Build context for the AI conversation
      const conversationContext = {
        currentTopic: currentTopic.topic,
        recentMessages: messages.slice(-5).map(msg => ({
          character: msg.characterName,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        loungeParticipants: characters.map(c => c.name),
        characterMood: character.mood,
        characterStatus: character.status
      };

      // Call backend API for social lounge conversation
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006'}/api/social/lounge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          characterId: character.id,
          conversationType: 'character_interaction',
          context: {
            ...conversationContext,
            situation: `The current topic is "${currentTopic.topic}". Generate a natural conversation contribution that fits your character's personality.`
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Social Lounge API failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Create AI message from API response
      const aiMessage: LoungeMessage = {
        id: `msg_${Date.now()}`,
        characterId: character.id,
        characterName: character.name,
        characterAvatar: character.avatar,
        teamOwner: character.teamOwner,
        content: data.message,
        type: 'chat',
        timestamp: new Date(data.timestamp)
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Failed to generate AI lounge message:', error);
      // Fallback to prevent broken experience
      const fallbackMessage: LoungeMessage = {
        id: `msg_${Date.now()}`,
        characterId: character.id,
        characterName: character.name,
        characterAvatar: character.avatar,
        teamOwner: character.teamOwner,
        content: 'AI service is temporarily unavailable. Please check back later.',
        type: 'chat',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  const generateAIUserResponse = async (character: LoungeCharacter, userMessage: string) => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found for AI user response');
        return;
      }

      // Build context for the AI conversation
      const conversationContext = {
        currentTopic: currentTopic.topic,
        recentMessages: messages.slice(-5).map(msg => ({
          character: msg.characterName,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        loungeParticipants: characters.map(c => c.name),
        characterMood: character.mood,
        characterStatus: character.status,
        bondLevel: 50 // Default bond level
      };

      // Call backend API for social lounge conversation
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006'}/api/social/lounge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          characterId: character.id,
          conversationType: 'user_chat',
          userMessage: userMessage,
          context: {
            ...conversationContext,
            situation: `A user just said: "${userMessage}". Respond naturally to their message in character.`
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Social Lounge API failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Create AI message from API response
      const aiMessage: LoungeMessage = {
        id: `msg_${Date.now()}`,
        characterId: character.id,
        characterName: character.name,
        characterAvatar: character.avatar,
        teamOwner: character.teamOwner,
        content: data.message,
        type: 'chat',
        timestamp: new Date(data.timestamp)
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Failed to generate AI user response:', error);
      // Fallback to prevent broken experience
      const fallbackMessage: LoungeMessage = {
        id: `msg_${Date.now()}`,
        characterId: character.id,
        characterName: character.name,
        characterAvatar: character.avatar,
        teamOwner: character.teamOwner,
        content: 'AI service is temporarily unavailable. Please check back later.',
        type: 'chat',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const yourChar = characters.find(c => c.id === selectedCharacter);
    if (!yourChar) return;

    // Import clubhouse context for enhanced conversations
    let clubhouseContext = '';
    try {
      const contextService = EventContextService.getInstance();
      clubhouseContext = await contextService.getClubhouseContext(yourChar.id);
    } catch (error) {
      console.error('Error getting clubhouse context:', error);
    }
    
    const newMessage: LoungeMessage = {
      id: `msg_${Date.now()}`,
      characterId: yourChar.id,
      characterName: yourChar.name,
      characterAvatar: yourChar.avatar,
      teamOwner: 'You',
      content: userInput,
      type: 'chat',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    const messageContent = userInput;
    setUserInput('');

    // Publish clubhouse social event
    try {
      const eventBus = GameEventBus.getInstance();
      const messageText = messageContent.toLowerCase();
      let eventType = 'social_lounge_chat';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      if (messageText.includes('battle') || messageText.includes('fight') || messageText.includes('combat')) {
        eventType = 'battle_discussion';
        severity = 'medium';
      } else if (messageText.includes('drama') || messageText.includes('conflict') || messageText.includes('problem')) {
        eventType = 'social_drama';
        severity = 'medium';
      } else if (messageText.includes('strategy') || messageText.includes('team') || messageText.includes('tactics')) {
        eventType = 'team_strategy_chat';
        severity = 'medium';
      }

      await eventBus.publish({
        type: eventType as any,
        source: 'clubhouse_lounge',
        primaryCharacterId: yourChar.id,
        severity,
        category: 'social',
        description: `${yourChar.name} in clubhouse: "${messageContent.substring(0, 100)}..."`,
        metadata: { 
          loungeActivity: true,
          messageType: newMessage.type,
          teamOwner: 'player',
          socialContext: clubhouseContext ? 'enriched' : 'basic'
        },
        tags: ['clubhouse', 'social', 'lounge']
      });
    } catch (error) {
      console.error('Error publishing clubhouse event:', error);
    }
    
    // Generate AI response to user message
    setTimeout(async () => {
      if (Math.random() > 0.3) { // 70% chance of AI response
        const responder = characters.filter(c => !c.isYourCharacter && c.status === 'active')[0];
        if (responder) {
          await generateAIUserResponse(responder, messageContent);
        }
      }
    }, 2000 + Math.random() * 3000);
  };

  const getCharacterStatus = (char: LoungeCharacter) => {
    if (isTyping.includes(char.id)) return 'typing...';
    if (char.status === 'idle' && char.lastSeen) {
      const minutes = Math.floor((Date.now() - char.lastSeen.getTime()) / 1000 / 60);
      return `idle ${minutes}m`;
    }
    return char.currentActivity || char.status;
  };

  return (
    <div className="max-w-6xl mx-auto h-[700px] flex gap-6">
      {/* Character List Sidebar */}
      <div className="w-80 bg-gray-900/50 rounded-xl border border-gray-700 p-4 flex flex-col">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          In the Lounge ({characters.length})
        </h3>
        
        <div className="space-y-2 flex-1 overflow-y-auto">
          {characters.map((char) => (
            <div
              key={char.id}
              className={`p-3 rounded-lg transition-all cursor-pointer ${
                char.isYourCharacter 
                  ? 'bg-blue-900/30 border border-blue-500/30' 
                  : 'bg-gray-800/50 hover:bg-gray-800/70'
              }`}
              onClick={() => char.isYourCharacter && setSelectedCharacter(char.id)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{char.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{char.name}</span>
                    {char.isYourCharacter && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">YOU</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{char.teamName}</div>
                  {char.teamOwner && !char.isYourCharacter && (
                    <div className="text-xs text-purple-400">{char.teamOwner}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1 italic">
                    {getCharacterStatus(char)}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  isTyping.includes(char.id) ? 'bg-yellow-400 animate-pulse' :
                  char.status === 'active' ? 'bg-green-400' : 
                  char.status === 'idle' ? 'bg-orange-400' : 
                  'bg-gray-400'
                }`} />
              </div>
            </div>
          ))}
        </div>
        
        {/* Current Topic */}
        <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">Hot Topic</span>
          </div>
          <p className="text-xs text-gray-300">{currentTopic.topic}</p>
          <div className="flex items-center gap-2 mt-2">
            <Activity className="w-3 h-3 text-orange-400" />
            <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all"
                style={{ width: `${currentTopic.heat}%` }}
              />
            </div>
            <span className="text-xs text-orange-400">{currentTopic.heat}°</span>
          </div>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Coffee className="w-6 h-6 text-amber-400" />
            Clubhouse Lounge
            <span className="text-sm font-normal text-gray-400 ml-2">
              Cross-team social space
            </span>
          </h2>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`${
              msg.type === 'join' || msg.type === 'leave' ? 'text-center' : ''
            }`}>
              {msg.type === 'join' || msg.type === 'leave' ? (
                <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                  {msg.type === 'join' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                  <span>{msg.characterAvatar} {msg.characterName} {msg.content}</span>
                </div>
              ) : msg.type === 'action' ? (
                <div className="text-sm text-gray-400 italic flex items-center gap-2">
                  <Dice1 className="w-4 h-4" />
                  <span>* {msg.content} *</span>
                </div>
              ) : (
                <div className={`flex items-start gap-3 ${
                  msg.teamOwner === 'You' ? 'flex-row-reverse' : ''
                }`}>
                  <div className="text-2xl">{msg.characterAvatar}</div>
                  <div className={`max-w-md ${msg.teamOwner === 'You' ? 'items-end' : ''}`}>
                    <div className={`flex items-center gap-2 mb-1 ${
                      msg.teamOwner === 'You' ? 'justify-end' : ''
                    }`}>
                      <span className="font-semibold text-white text-sm">{msg.characterName}</span>
                      {msg.teamOwner && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          msg.teamOwner === 'You' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {msg.teamOwner}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`inline-block px-4 py-2 rounded-lg ${
                      msg.teamOwner === 'You'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-200'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.mentions && msg.mentions.length > 0 && (
                      <div className="mt-1 text-xs text-purple-400">
                        @{msg.mentions.join(', @')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Typing indicators */}
          {isTyping.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>
                {characters.filter(c => isTyping.includes(c.id)).map(c => c.name).join(', ')} typing...
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <select
              value={selectedCharacter}
              onChange={(e) => setSelectedCharacter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm"
            >
              {characters.filter(c => c.isYourCharacter).map(char => (
                <option key={char.id} value={char.id}>
                  {char.avatar} {char.name}
                </option>
              ))}
            </select>
            
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              Send
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            Characters from different teams gather here to socialize between battles
          </div>
        </div>
      </div>
    </div>
  );
}