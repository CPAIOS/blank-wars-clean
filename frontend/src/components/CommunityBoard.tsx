'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare,
  Heart,
  MessageCircle,
  Share2,
  Pin,
  Search,
  Filter,
  Send,
  ThumbsUp,
  Flag,
  Plus,
  X,
  Hash,
  Clock,
  Star,
  Crown
} from 'lucide-react';
import { 
  CommunityMessage,
  MessageType,
  formatTimeAgo,
  getMessagesByType,
  searchMessages
} from '@/data/clubhouse';

interface CommunityBoardProps {
  messages: CommunityMessage[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  currentUserLevel: number;
  onNewMessage: (content: string, type: string, tags: string[]) => void;
  onLikeMessage: (messageId: string) => void;
}

export default function CommunityBoard({
  messages,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserLevel,
  onNewMessage,
  onLikeMessage
}: CommunityBoardProps) {
  const [activeFilter, setActiveFilter] = useState<MessageType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [newMessageType, setNewMessageType] = useState<MessageType>('general');
  const [newMessageTags, setNewMessageTags] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  // Filter and search messages
  const filteredMessages = messages.filter(msg => {
    const typeMatch = activeFilter === 'all' || msg.type === activeFilter;
    const searchMatch = searchTerm === '' || 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return typeMatch && searchMatch;
  });

  // Sort messages (pinned first, then by timestamp)
  const sortedMessages = filteredMessages.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleSubmitMessage = () => {
    if (!newMessageContent.trim()) return;

    const tags = newMessageTags
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);

    onNewMessage(newMessageContent, newMessageType, tags);
    
    // Reset form
    setNewMessageContent('');
    setNewMessageTags('');
    setShowNewMessage(false);
  };

  const getTypeColor = (type: MessageType) => {
    const colors = {
      general: 'from-gray-500 to-gray-600',
      battle: 'from-red-500 to-red-600',
      strategy: 'from-blue-500 to-blue-600',
      trade: 'from-green-500 to-green-600',
      guild: 'from-purple-500 to-purple-600',
      announcement: 'from-yellow-500 to-orange-500'
    };
    return colors[type] || colors.general;
  };

  const getTypeIcon = (type: MessageType) => {
    const icons = {
      general: '💬',
      battle: '⚔️',
      strategy: '🎯',
      trade: '💰',
      guild: '🏰',
      announcement: '📢'
    };
    return icons[type] || icons.general;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            Community Message Board
          </h2>
          <button
            onClick={() => setShowNewMessage(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Message
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as MessageType | 'all')}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Messages</option>
            <option value="general">💬 General</option>
            <option value="battle">⚔️ Battle</option>
            <option value="strategy">🎯 Strategy</option>
            <option value="trade">💰 Trade</option>
            <option value="guild">🏰 Guild</option>
            <option value="announcement">📢 Announcements</option>
          </select>

          <div className="flex items-center text-gray-400">
            <span>{sortedMessages.length} messages found</span>
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      <AnimatePresence>
        {showNewMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowNewMessage(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">New Message</h3>
                <button
                  onClick={() => setShowNewMessage(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message Type</label>
                  <select
                    value={newMessageType}
                    onChange={(e) => setNewMessageType(e.target.value as MessageType)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="general">💬 General Discussion</option>
                    <option value="battle">⚔️ Battle Reports</option>
                    <option value="strategy">🎯 Strategy & Tips</option>
                    <option value="trade">💰 Trading</option>
                    <option value="guild">🏰 Guild Recruitment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message Content</label>
                  <textarea
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    placeholder="Share your thoughts with the community..."
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newMessageTags}
                    onChange={(e) => setNewMessageTags(e.target.value)}
                    placeholder="strategy, tips, achilles, synergy"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowNewMessage(false)}
                    className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitMessage}
                    disabled={!newMessageContent.trim()}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Post Message
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages List */}
      <div className="space-y-4">
        {sortedMessages.map((message) => (
          <motion.div
            key={message.id}
            layout
            className={`bg-gray-900/50 rounded-xl border p-6 transition-all ${
              message.isPinned ? 'border-yellow-500 bg-yellow-500/5' : 'border-gray-700'
            } ${
              selectedMessage === message.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {/* Message Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{message.authorAvatar}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{message.authorName}</span>
                    {message.authorTitle && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                        {message.authorTitle}
                      </span>
                    )}
                    {message.isModerator && (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className="text-sm text-gray-400">Level {message.authorLevel}</span>
                    {message.guildTag && (
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        [{message.guildTag}]
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-gradient-to-r ${getTypeColor(message.type)} text-white`}>
                      {getTypeIcon(message.type)}
                      {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">{formatTimeAgo(message.timestamp)}</span>
                    {message.isPinned && (
                      <Pin className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                </div>
              </div>
              
              <button className="text-gray-400 hover:text-white transition-colors">
                <Flag className="w-4 h-4" />
              </button>
            </div>

            {/* Message Content */}
            <div className="mb-4">
              <p className="text-gray-300 leading-relaxed">{message.content}</p>
              
              {/* Character mentions */}
              {message.characterMentions && message.characterMentions.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs text-gray-400">Mentioned characters: </span>
                  {message.characterMentions.map((char, index) => (
                    <span key={char} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded mr-1">
                      {char}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Tags */}
              {message.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600 cursor-pointer transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Message Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onLikeMessage(message.id)}
                  className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">{message.likes}</span>
                </button>
                
                <button
                  onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                  className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{message.replies.length}</span>
                </button>
                
                <button className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Helpful</span>
              </div>
            </div>

            {/* Replies Section */}
            <AnimatePresence>
              {selectedMessage === message.id && message.replies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-700 space-y-3"
                >
                  {message.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3 pl-4">
                      <div className="text-lg">{reply.authorAvatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{reply.authorName}</span>
                          <span className="text-xs text-gray-400">Level {reply.authorLevel}</span>
                          <span className="text-xs text-gray-500">{formatTimeAgo(reply.timestamp)}</span>
                        </div>
                        <p className="text-gray-300 text-sm mt-1">{reply.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors">
                            <Heart className="w-3 h-3" />
                            <span className="text-xs">{reply.likes}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {sortedMessages.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Messages Found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || activeFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Be the first to start a conversation!'
            }
          </p>
          {!searchTerm && activeFilter === 'all' && (
            <button
              onClick={() => setShowNewMessage(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create First Message
            </button>
          )}
        </div>
      )}
    </div>
  );
}