'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home,
  MessageSquare,
  Trophy,
  Palette,
  Users,
  Calendar,
  TrendingUp,
  Heart,
  MessageCircle,
  Award,
  Clock,
  Hash,
  Plus,
  X,
  Coffee
} from 'lucide-react';
import CommunityBoard from './CommunityBoard';
import AIMessageBoard from './AIMessageBoard';
import ClubhouseLounge from './ClubhouseLounge';
import GraffitiWall from './GraffitiWall';
import Leaderboards from './Leaderboards';
import { 
  CommunityMessage,
  GraffitiArt,
  SocialEvent,
  CommunityStats,
  sampleMessages,
  sampleGraffiti,
  activeEvents,
  communityStats,
  formatTimeAgo
} from '@/data/clubhouse';

interface ClubhouseProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  currentUserLevel: number;
  currentUserGuild?: string;
}

export default function Clubhouse({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserLevel,
  currentUserGuild
}: ClubhouseProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'board' | 'ai-board' | 'lounge' | 'wall' | 'leaderboard' | 'events'>('home');
  const [messages, setMessages] = useState<CommunityMessage[]>(sampleMessages);
  const [graffiti, setGraffiti] = useState<GraffitiArt[]>(sampleGraffiti);
  const [stats, setStats] = useState<CommunityStats>(communityStats);
  const [events, setEvents] = useState<SocialEvent[]>(activeEvents);

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new messages and activity
      setStats(prev => ({
        ...prev,
        activeToday: prev.activeToday + Math.floor(Math.random() * 3),
        messagesPosted: prev.messagesPosted + Math.floor(Math.random() * 2)
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleNewMessage = (content: string, type: string, tags: string[]) => {
    const newMessage: CommunityMessage = {
      id: `msg_${Date.now()}`,
      authorId: currentUserId,
      authorName: currentUserName,
      authorAvatar: currentUserAvatar,
      authorLevel: currentUserLevel,
      content,
      type: type as any,
      timestamp: new Date(),
      likes: 0,
      replies: [],
      tags,
      guildTag: currentUserGuild
    };

    setMessages(prev => [newMessage, ...prev]);
    setStats(prev => ({ ...prev, messagesPosted: prev.messagesPosted + 1 }));
  };

  const handleLikeMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, likes: msg.likes + 1 } : msg
    ));
  };

  const handleNewGraffiti = (artData: any) => {
    const newGraffiti: GraffitiArt = {
      id: `graf_${Date.now()}`,
      artistId: currentUserId,
      artistName: currentUserName,
      artistLevel: currentUserLevel,
      type: 'tag',
      title: artData.title || 'Untitled',
      artData: artData.canvas,
      position: artData.position,
      timestamp: new Date(),
      likes: 0,
      views: 1,
      tags: artData.tags || [],
      isApproved: true,
      isFeature: false,
      colorPalette: artData.colors || [],
      tools: artData.tools || [],
      timeSpent: artData.timeSpent || 0,
      guildTag: currentUserGuild
    };

    setGraffiti(prev => [...prev, newGraffiti]);
    setStats(prev => ({ ...prev, graffitiCreated: prev.graffitiCreated + 1 }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Home className="w-8 h-8 text-purple-400" />
          The Clubhouse
        </h1>
        <p className="text-gray-400 text-lg">
          Connect with warriors, share strategies, and showcase your creativity
        </p>
      </div>

      {/* Community Stats Bar */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-green-400">{stats.activeToday.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Active Today</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-400">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Total Warriors</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-400">{stats.messagesPosted.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Messages</div>
          </div>
          <div>
            <div className="text-xl font-bold text-orange-400">{stats.graffitiCreated.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Graffiti Art</div>
          </div>
          <div>
            <div className="text-xl font-bold text-yellow-400">{stats.guildsActive}</div>
            <div className="text-xs text-gray-400">Active Guilds</div>
          </div>
          <div>
            <div className="text-xl font-bold text-red-400">{stats.battlesCompleted.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Battles Today</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-800/50 rounded-xl p-1 flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'board'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Message Board</span>
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {messages.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ai-board')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ai-board'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>AI Drama Board</span>
            <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
              LIVE
            </span>
          </button>
          <button
            onClick={() => setActiveTab('lounge')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'lounge'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Coffee className="w-5 h-5" />
            <span>Social Lounge</span>
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
              CROSS-TEAM
            </span>
          </button>
          <button
            onClick={() => setActiveTab('wall')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'wall'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Palette className="w-5 h-5" />
            <span>Graffiti Wall</span>
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
              {graffiti.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span>Leaderboards</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'events'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Events</span>
            {events.filter(e => e.status === 'active').length > 0 && (
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                {events.filter(e => e.status === 'active').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Welcome & Quick Stats */}
              <div className="lg:col-span-2 space-y-6">
                {/* Welcome Message */}
                <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl">{currentUserAvatar}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Welcome back, {currentUserName}!</h2>
                      <p className="text-gray-400">Level {currentUserLevel} Warrior</p>
                      {currentUserGuild && (
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-400 font-semibold">[{currentUserGuild}] Guild Member</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-300">
                    The community is buzzing with activity! Check out the latest strategies on the message board, 
                    discover amazing art on the graffiti wall, or compete for the top spots on the leaderboards.
                  </p>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    Recent Community Activity
                  </h3>
                  
                  <div className="space-y-4">
                    {(messages || []).slice(0, 3).map((message) => (
                      <div key={message?.id || Math.random()} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                        <div className="text-2xl">{message?.authorAvatar || '👤'}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">{message?.authorName || 'Unknown'}</span>
                            {message?.authorTitle && (
                              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                                {message.authorTitle}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{formatTimeAgo(message?.timestamp || new Date())}</span>
                          </div>
                          <p className="text-gray-300 text-sm">{(message?.content || '').substring(0, 120)}...</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {message.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {message.replies.length}
                            </span>
                            <span className="text-blue-400 capitalize">{message.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setActiveTab('board')}
                    className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    View All Messages
                  </button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Trending Tags */}
                <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Hash className="w-5 h-5 text-purple-400" />
                    Trending Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.trendingTags.map((tag, index) => (
                      <span
                        key={tag}
                        className={`px-3 py-1 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
                          index === 0 ? 'bg-red-500/20 text-red-400' :
                          index === 1 ? 'bg-orange-500/20 text-orange-400' :
                          index === 2 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Active Events */}
                <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-400" />
                    Active Events
                  </h3>
                  <div className="space-y-3">
                    {events.filter(e => e.status === 'active').slice(0, 2).map((event) => (
                      <div key={event.id} className="p-3 bg-gray-800/50 rounded-lg">
                        <h4 className="font-semibold text-white text-sm">{event.title}</h4>
                        <p className="text-xs text-gray-400 mb-2">{event.description.substring(0, 80)}...</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-400">{event.participants} participants</span>
                          <span className="text-gray-400">
                            Ends {formatTimeAgo(event.endDate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="w-full mt-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    View All Events
                  </button>
                </div>

                {/* Featured Graffiti */}
                <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-orange-400" />
                    Featured Art
                  </h3>
                  <div className="space-y-3">
                    {graffiti.filter(art => art.isFeature).slice(0, 2).map((art) => (
                      <div key={art.id} className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🎨</span>
                          <div>
                            <h4 className="font-semibold text-white text-sm">{art.title}</h4>
                            <p className="text-xs text-gray-400">by {art.artistName}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-red-400">
                            <Heart className="w-3 h-3" />
                            {art.likes}
                          </span>
                          <span className="flex items-center gap-1 text-blue-400">
                            <Eye className="w-3 h-3" />
                            {art.views}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('wall')}
                    className="w-full mt-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Visit Graffiti Wall
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'board' && (
          <motion.div
            key="board"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <CommunityBoard
              messages={messages}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              currentUserAvatar={currentUserAvatar}
              currentUserLevel={currentUserLevel}
              onNewMessage={handleNewMessage}
              onLikeMessage={handleLikeMessage}
            />
          </motion.div>
        )}

        {activeTab === 'ai-board' && (
          <motion.div
            key="ai-board"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <AIMessageBoard />
          </motion.div>
        )}

        {activeTab === 'lounge' && (
          <motion.div
            key="lounge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ClubhouseLounge />
          </motion.div>
        )}

        {activeTab === 'wall' && (
          <motion.div
            key="wall"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <GraffitiWall
              graffiti={graffiti}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              currentUserLevel={currentUserLevel}
              onNewGraffiti={handleNewGraffiti}
            />
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Leaderboards />
          </motion.div>
        )}

        {activeTab === 'events' && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-green-400" />
                Community Events
              </h2>
              
              <div className="grid gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`border rounded-xl p-6 ${
                      event.status === 'active' 
                        ? 'border-green-500 bg-green-500/10' 
                        : event.status === 'upcoming'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 bg-gray-800/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{event.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            event.status === 'active' ? 'bg-green-500 text-white' :
                            event.status === 'upcoming' ? 'bg-blue-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                        <p className="text-gray-300">{event.description}</p>
                      </div>
                      <div className="text-3xl">
                        {event.type === 'tournament' ? '🏆' :
                         event.type === 'art_contest' ? '🎨' :
                         event.type === 'guild_war' ? '⚔️' : '🎉'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-gray-400 text-sm">Duration:</span>
                        <div className="text-white font-semibold">
                          {event.startDate.toLocaleDateString()} - {event.endDate.toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Participants:</span>
                        <div className="text-white font-semibold">
                          {event.participants.toLocaleString()}
                          {event.maxParticipants && ` / ${event.maxParticipants.toLocaleString()}`}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Type:</span>
                        <div className="text-white font-semibold capitalize">
                          {event.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    
                    {event.rewards.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-white font-semibold mb-2">Rewards:</h4>
                        <div className="space-y-1">
                          {event.rewards.slice(0, 2).map((reward, index) => (
                            <div key={index} className="text-sm text-gray-300">
                              <span className="text-yellow-400 font-semibold">{reward.rank}:</span> {reward.rewards.map(r => r.type).join(', ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {event.status === 'active' && (
                      <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                        Join Event
                      </button>
                    )}
                    
                    {event.status === 'upcoming' && (
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                        Register
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}