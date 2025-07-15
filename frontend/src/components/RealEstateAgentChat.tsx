'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Building, MessageCircle, Send, Zap, TrendingUp, 
  Shield, Users, Crown, AlertTriangle, CheckCircle, Clock,
  DollarSign, Star, Trophy
} from 'lucide-react';
import { realEstateAgents } from '../data/realEstateAgents_UPDATED';
import RealEstateAgentBonusService from '../services/realEstateAgentBonusService';
import { RealEstateAgent } from '../data/realEstateAgentTypes';
import { realEstateAgentChatService } from '../services/realEstateAgentChatService';
import { apiClient } from '../services/apiClient';

interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  message: string;
  timestamp: Date;
  isUser?: boolean;
  isCompetitorInterruption?: boolean;
}

interface TeamStats {
  level: number;
  totalCharacters: number;
  currentFacilities: string[];
  budget: number;
}

const FACILITY_TYPES = [
  { id: 'basic_gym', name: 'Basic Gym', cost: 5000, icon: '🏋️', description: 'Standard training equipment' },
  { id: 'advanced_gym', name: 'Advanced Gym', cost: 15000, icon: '💪', description: 'Professional grade equipment' },
  { id: 'castle', name: 'Castle', cost: 100000, icon: '🏰', description: 'Majestic fortress with royal amenities' },
  { id: 'fortress', name: 'Fortress', cost: 80000, icon: '🏛️', description: 'Impenetrable military stronghold' },
  { id: 'yacht', name: 'Luxury Yacht', cost: 120000, icon: '🛥️', description: 'Mobile luxury base on the seas' },
  { id: 'medical_bay', name: 'Medical Bay', cost: 25000, icon: '🏥', description: 'Advanced healing and recovery center' }
];

const AGENT_BONUSES = {
  'barry_the_closer': {
    name: 'Speed Deals',
    effects: ['15% facility cost reduction', '10% training speed boost'],
    icon: '⚡',
    color: 'text-yellow-400'
  },
  'lmb_3000': {
    name: 'Dramatic Ambition',
    effects: ['20% XP gain increase', 'Team "Ambition" trait unlock'],
    icon: '👑',
    color: 'text-purple-400'
  },
  'zyxthala_reptilian': {
    name: 'Optimal Efficiency',
    effects: ['15% energy regeneration', 'Climate immunity for team'],
    icon: '🦎',
    color: 'text-green-400'
  }
};

export default function RealEstateAgentChat() {
  const [selectedAgent, setSelectedAgent] = useState<RealEstateAgent>(() => {
    const agent = realEstateAgents[0];
    // Initialize the bonus service with the default agent
    const bonusService = RealEstateAgentBonusService.getInstance();
    bonusService.setSelectedAgent(agent.id);
    return agent;
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);

  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        const response = await apiClient.get('/user/team-stats');
        setTeamStats(response.data);
      } catch (error) {
        console.error('Failed to fetch team stats:', error);
      }
    };

    fetchTeamStats();
  }, []);

  const competingAgents = realEstateAgents.filter(agent => agent.id !== selectedAgent.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const startConsultation = async () => {
    if (!teamStats) return;

    setIsGenerating(true);
    setHasStarted(true);
    setChatMessages([]);

    try {
      const response = await realEstateAgentChatService.startFacilityConsultation(
        selectedAgent,
        competingAgents,
        teamStats
      );

      const welcomeMessage: ChatMessage = {
        id: `welcome_${Date.now()}`,
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        agentAvatar: selectedAgent.avatar,
        message: response,
        timestamp: new Date(),
        isCompetitorInterruption: false
      };

      setChatMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to start consultation:', error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        agentAvatar: selectedAgent.avatar,
        message: `*${selectedAgent.name.split(' ')[0]} seems to be having connection issues. Please try again in a moment.*`,
        timestamp: new Date(),
        isCompetitorInterruption: false
      };
      setChatMessages([errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendMessage = async () => {
    if (!userMessage.trim() || isGenerating || !teamStats) return;

    const userChatMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      agentId: 'user',
      agentName: 'You',
      agentAvatar: '👤',
      message: userMessage,
      timestamp: new Date(),
      isUser: true
    };

    setChatMessages(prev => [...prev, userChatMessage]);
    const currentMessage = userMessage;
    setUserMessage('');
    setIsGenerating(true);

    try {
      const conversationHistory = chatMessages.map(msg => ({
        agentId: msg.agentId,
        message: msg.message,
        timestamp: msg.timestamp
      }));

      const responses = await realEstateAgentChatService.sendUserMessage(
        selectedAgent,
        competingAgents,
        currentMessage,
        teamStats,
        conversationHistory
      );

      const newMessages: ChatMessage[] = responses.map(response => ({
        id: `response_${Date.now()}_${response.agentId}`,
        agentId: response.agentId,
        agentName: response.agentName,
        agentAvatar: realEstateAgents.find(a => a.id === response.agentId)?.avatar || '🤖',
        message: response.message,
        timestamp: new Date(response.timestamp),
        isCompetitorInterruption: response.isCompetitorInterruption
      }));

      setChatMessages(prev => [...prev, ...newMessages]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        agentAvatar: selectedAgent.avatar,
        message: '*Connection issues detected. Please try again.*',
        timestamp: new Date(),
        isCompetitorInterruption: false
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const switchAgent = (agent: RealEstateAgent) => {
    setSelectedAgent(agent);
    setHasStarted(false);
    setChatMessages([]);
    setSelectedFacility(null);
    
    // Update the bonus service with the selected agent
    const bonusService = RealEstateAgentBonusService.getInstance();
    bonusService.setSelectedAgent(agent.id);
  };

  const getAgentBonus = (agentId: string) => {
    return AGENT_BONUSES[agentId as keyof typeof AGENT_BONUSES];
  };

  return (
    <div className="h-full bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-6">
      <div className="max-w-7xl mx-auto h-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Building className="w-8 h-8" />
            HQ Facilities - Real Estate Consultation
          </h1>
          <p className="text-gray-300">
            Choose your agent and upgrade your team headquarters with permanent bonuses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
          {/* Agent Selection Sidebar */}
          <div className="bg-black/40 rounded-lg p-4 h-full overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Choose Your Agent
            </h2>
            
            <div className="space-y-4">
              {realEstateAgents.map((agent) => {
                const bonus = getAgentBonus(agent.id);
                const isSelected = selectedAgent.id === agent.id;
                
                return (
                  <motion.button
                    key={agent.id}
                    onClick={() => switchAgent(agent)}
                    className={`w-full p-4 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-amber-600/40 border-amber-500'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 border-gray-600'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-3xl">{agent.avatar}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{agent.name}</div>
                        <div className="text-sm text-gray-400">{agent.archetype}</div>
                      </div>
                      {isSelected && <CheckCircle className="w-5 h-5 text-amber-400" />}
                    </div>
                    
                    {bonus && (
                      <div className="bg-black/30 rounded p-3 mt-2">
                        <div className={`font-semibold mb-1 ${bonus.color} flex items-center gap-2`}>
                          <span>{bonus.icon}</span>
                          {bonus.name}
                        </div>
                        <div className="text-xs text-gray-300 space-y-1">
                          {bonus.effects.map((effect, idx) => (
                            <div key={idx}>• {effect}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 text-xs text-gray-400">
                      {agent.personality.traits.slice(0, 3).join(', ')}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Team Stats */}
            <div className="mt-6 bg-black/30 rounded-lg p-3">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Team Status
              </h3>
              {teamStats ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level:</span>
                    <span className="text-white">{teamStats.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Characters:</span>
                    <span className="text-white">{teamStats.totalCharacters}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Budget:</span>
                    <span className="text-green-400">${teamStats.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Facilities:</span>
                    <span className="text-blue-400">{teamStats.currentFacilities.length}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">Loading...</div>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3 bg-black/40 rounded-lg p-4 h-full flex flex-col">
            {!hasStarted ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">{selectedAgent.avatar}</div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedAgent.name}</h2>
                <p className="text-gray-400 mb-4 max-w-md">
                  {selectedAgent.archetype} ready to help you find the perfect headquarters upgrades
                </p>
                
                {/* Active Agent Bonus Display */}
                {(() => {
                  const bonus = getAgentBonus(selectedAgent.id);
                  return bonus ? (
                    <div className="bg-black/50 border border-amber-500/30 rounded-lg p-3 mb-4 max-w-md">
                      <div className={`font-semibold mb-2 ${bonus.color} flex items-center gap-2 justify-center`}>
                        <span>{bonus.icon}</span>
                        Active Bonus: {bonus.name}
                      </div>
                      <div className="text-xs text-gray-300 space-y-1">
                        {bonus.effects.map((effect, idx) => (
                          <div key={idx} className="text-center">• {effect}</div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                
                <button
                  onClick={startConsultation}
                  disabled={isGenerating || !teamStats}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-5 h-5" />
                      Start Consultation
                    </>
                  )}
                </button>

                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl">
                  {FACILITY_TYPES.map((facility) => {
                    const bonusService = RealEstateAgentBonusService.getInstance();
                    const originalCost = { coins: facility.cost, gems: 0 };
                    const discountedCost = bonusService.applyFacilityCostReduction(originalCost);
                    const hasDiscount = discountedCost.coins < originalCost.coins;
                    
                    return (
                      <button
                        key={facility.id}
                        onClick={() => setSelectedFacility(facility.id)}
                        className={`bg-gray-800/50 hover:bg-gray-700/70 border-2 rounded-lg p-3 text-center transition-all cursor-pointer ${
                          selectedFacility === facility.id 
                            ? 'border-amber-500 bg-amber-500/20' 
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="text-2xl mb-1">{facility.icon}</div>
                        <div className="text-sm font-semibold text-white">{facility.name}</div>
                        <div className="text-xs">
                          {hasDiscount ? (
                            <div className="space-y-1">
                              <div className="text-gray-500 line-through">${originalCost.coins.toLocaleString()}</div>
                              <div className="text-green-400 font-semibold">${discountedCost.coins.toLocaleString()}</div>
                              <div className="text-yellow-400 text-[10px]">Agent Discount!</div>
                            </div>
                          ) : (
                            <div className="text-gray-400">${facility.cost.toLocaleString()}</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{facility.description}</div>
                      </button>
                    );
                  })}
                </div>
                
                {selectedFacility && (
                  <div className="mt-6 bg-amber-900/30 border border-amber-500/50 rounded-lg p-4 max-w-md mx-auto">
                    <h3 className="text-amber-300 font-semibold mb-2">Selected Facility</h3>
                    <p className="text-amber-100 text-sm mb-3">
                      {FACILITY_TYPES.find(f => f.id === selectedFacility)?.name} selected. 
                      Start a consultation to discuss purchase options and benefits.
                    </p>
                    <button
                      onClick={() => setSelectedFacility(null)}
                      className="text-amber-400 hover:text-amber-300 text-xs underline"
                    >
                      Clear selection
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  <AnimatePresence>
                    {chatMessages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!message.isUser && (
                          <div className="text-2xl">{message.agentAvatar}</div>
                        )}
                        <div
                          className={`max-w-md p-3 rounded-lg ${
                            message.isUser
                              ? 'bg-amber-600 text-white'
                              : message.isCompetitorInterruption
                              ? 'bg-red-600/30 border border-red-500/50 text-red-100'
                              : 'bg-gray-700 text-gray-100'
                          }`}
                        >
                          {!message.isUser && (
                            <div className="font-semibold text-sm mb-1">
                              {message.agentName}
                              {message.isCompetitorInterruption && (
                                <span className="ml-2 text-xs text-red-400">[INTERRUPTING]</span>
                              )}
                            </div>
                          )}
                          <div className="text-sm">{message.message}</div>
                          <div className="text-xs opacity-60 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        {message.isUser && (
                          <div className="text-2xl">{message.agentAvatar}</div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isGenerating && (
                    <div className="flex gap-3">
                      <div className="text-2xl">{selectedAgent.avatar}</div>
                      <div className="bg-gray-700 text-gray-300 p-3 rounded-lg">
                        <div className="text-sm">{selectedAgent.name.split(' ')[0]} is typing...</div>
                        <div className="flex gap-1 mt-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Ask ${selectedAgent.name.split(' ')[0]} about facilities...`}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
                    disabled={isGenerating}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!userMessage.trim() || isGenerating}
                    className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
