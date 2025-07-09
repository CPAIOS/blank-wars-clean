'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, Crown, Sparkles, TrendingUp, 
  CheckCircle, Lock, AlertCircle, Coins, 
  Gem, Star, ChevronRight, Info, Send, User
} from 'lucide-react';
import { 
  FACILITIES, 
  Facility, 
  FacilityState, 
  calculateFacilityBonus, 
  getFacilityUpgradeCost, 
  canUnlockFacility 
} from '@/data/facilities';

// New imports for Real Estate Agent chat
import { io, Socket } from 'socket.io-client';
import { realEstateAgents } from '../data/realEstateAgents';
import { RealEstateAgent } from '../data/realEstateAgentTypes';

// Message interface for chat
interface Message {
  id: number;
  type: 'player' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

interface FacilitiesManagerProps {
  teamLevel: number;
  currency: { coins: number; gems: number };
  unlockedAchievements: string[];
  ownedFacilities: FacilityState[];
  onPurchaseFacility: (facilityId: string) => void;
  onUpgradeFacility: (facilityId: string) => void;
  onPayMaintenance: (facilityId: string) => void;
}

export default function FacilitiesManager({
  teamLevel,
  currency,
  unlockedAchievements,
  ownedFacilities,
  onPurchaseFacility,
  onUpgradeFacility,
  onPayMaintenance
}: FacilitiesManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // New state for Real Estate Agent chat
  const [selectedAgentId, setSelectedAgentId] = useState(realEstateAgents[0].id);
  const selectedAgent = realEstateAgents.find(agent => agent.id === selectedAgentId) || realEstateAgents[0];
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: 'all', label: 'All Facilities', icon: Building },
    { id: 'training', label: 'Training', icon: TrendingUp },
    { id: 'recovery', label: 'Recovery', icon: Sparkles },
    { id: 'support', label: 'Support', icon: Crown },
    { id: 'premium', label: 'Premium', icon: Star }
  ];

  const filteredFacilities = selectedCategory === 'all' 
    ? FACILITIES 
    : FACILITIES.filter(f => f.category === selectedCategory);

  const getFacilityStatus = (facility: Facility) => {
    const owned = ownedFacilities.find(f => f.id === facility.id);
    const canUnlock = canUnlockFacility(
      facility, 
      teamLevel, 
      unlockedAchievements, 
      ownedFacilities.map(f => f.id)
    );
    const canAfford = currency.coins >= facility.cost.coins && currency.gems >= facility.cost.gems;

    if (owned) {
      return {
        type: 'owned',
        level: owned.level,
        canUpgrade: owned.level < facility.maxLevel,
        upgradeCost: getFacilityUpgradeCost(facility, owned.level),
        canAffordUpgrade: owned.level < facility.maxLevel && 
          currency.coins >= getFacilityUpgradeCost(facility, owned.level).coins &&
          currency.gems >= getFacilityUpgradeCost(facility, owned.level).gems,
        maintenanceDue: !owned.maintenancePaid
      };
    }

    return {
      type: canUnlock ? (canAfford ? 'available' : 'affordable') : 'locked',
      canUnlock,
      canAfford
    };
  };

  const openFacilityDetails = (facility: Facility) => {
    setSelectedFacility(facility);
    setShowDetailsModal(true);
  };

  const handlePurchase = (facilityId: string) => {
    onPurchaseFacility(facilityId);
    setShowDetailsModal(false);
  };

  const handleUpgrade = (facilityId: string) => {
    onUpgradeFacility(facilityId);
    setShowDetailsModal(false);
  };

  // --- Real Estate Agent Chat Logic ---
  useEffect(() => {
    const socketUrl = 'http://localhost:3006';
    console.log('🔌 [FacilitiesManager] Connecting to local backend:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ FacilitiesManager Socket connected!');
      setConnected(true);
      // Initial message from the selected agent
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        content: `Greetings, Coach! ${selectedAgent.name} at your service. How can I assist you in optimizing your team's real estate portfolio today?`,
        timestamp: new Date(),
      }]);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ FacilitiesManager Socket disconnected');
      setConnected(false);
    });

    socketRef.current.on('facilities_chat_response', (data: { message: string }) => {
      console.log('📨 FacilitiesManager response:', data);
      
      const agentMessage: Message = {
        id: Date.now(),
        type: 'agent',
        content: data.message || 'Considering your options...',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    });

    socketRef.current.on('chat_error', (error: { message: string }) => {
      console.error('❌ FacilitiesManager error:', error);
      setIsTyping(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [selectedAgent.id]); // Reconnect if agent changes

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (content: string) => {
    if (!content.trim() || isTyping || !connected || !socketRef.current) {
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
    setIsTyping(true);

    console.log('📤 FacilitiesManager message:', content);

    // Prepare comprehensive facilities context data
    const facilitiesContext = {
      teamLevel,
      currency,
      unlockedAchievements,
      
      // Detailed owned facilities with current benefits
      ownedFacilities: ownedFacilities.map(f => {
        const facilityData = FACILITIES.find(facility => facility.id === f.id);
        return {
          id: f.id,
          name: facilityData?.name || f.id,
          category: facilityData?.category || 'unknown',
          level: f.level,
          maxLevel: facilityData?.maxLevel || 1,
          maintenancePaid: f.maintenancePaid,
          currentBonuses: facilityData?.bonuses || [],
          description: facilityData?.description || '',
          benefits: facilityData?.benefits || [],
          upgradeCost: facilityData && f.level < facilityData.maxLevel ? 
            getFacilityUpgradeCost(facilityData, f.level) : null
        };
      }),
      
      // Currently selected facility details
      selectedFacility: selectedFacility ? {
        id: selectedFacility.id,
        name: selectedFacility.name,
        category: selectedFacility.category,
        description: selectedFacility.description,
        cost: selectedFacility.cost,
        benefits: selectedFacility.benefits,
        bonuses: selectedFacility.bonuses,
        unlockRequirements: selectedFacility.unlockRequirements,
        upgradeCosts: selectedFacility.upgradeCosts,
        maxLevel: selectedFacility.maxLevel,
        maintenanceCost: selectedFacility.maintenanceCost,
        battleImpact: selectedFacility.bonuses.filter(b => b.type === 'battle'),
        trainingImpact: selectedFacility.bonuses.filter(b => b.type === 'training'),
        recoveryImpact: selectedFacility.bonuses.filter(b => b.type === 'recovery')
      } : null,
      
      // All available facilities with unlock status
      allFacilities: FACILITIES.map(f => ({
        id: f.id,
        name: f.name,
        category: f.category,
        description: f.description,
        cost: f.cost,
        benefits: f.benefits,
        bonuses: f.bonuses,
        unlockRequirements: f.unlockRequirements,
        isOwned: ownedFacilities.some(owned => owned.id === f.id),
        canAfford: currency.coins >= f.cost.coins && currency.gems >= f.cost.gems,
        canUnlock: canUnlockFacility(f, teamLevel, unlockedAchievements, ownedFacilities.map(o => o.id))
      })),
      
      // Strategic headquarters context (mock data - should come from actual HQ state)
      headquarters: {
        currentTier: 'spartan_apartment', // 2 rooms, 4 characters per room max
        totalCapacity: 8,
        currentOccupancy: 10, // Overcrowded!
        rooms: [
          {
            id: 'room1',
            name: 'Main Room',
            theme: null, // Unthemed = -3 morale penalty
            assignedCharacters: ['achilles', 'holmes', 'dracula', 'joan', 'tesla'],
            beds: [
              { type: 'bunk_bed', capacity: 2, comfortBonus: 5 },
              { type: 'couch', capacity: 1, comfortBonus: 0 }
            ],
            sleepingArrangement: '2 in bunks, 1 on couch, 2 on floor (-10 comfort)',
            conflicts: ['dracula vs holmes (-15% teamwork)', 'achilles vs joan (-8% teamwork)']
          },
          {
            id: 'room2', 
            name: 'Side Room',
            theme: 'greek_classical', // +15 Strength for Achilles if he was here
            assignedCharacters: ['cleopatra', 'genghis_khan', 'merlin', 'sun_wukong', 'billy_the_kid'],
            beds: [
              { type: 'bunk_bed', capacity: 2, comfortBonus: 5 }
            ],
            sleepingArrangement: '2 in bunks, 3 on floor (-10 comfort)',
            conflicts: ['cleopatra vs genghis_khan (-12% teamwork)']
          }
        ],
        penalties: {
          'All Stats': -23, // -8 from spartan apartment, -15 from overcrowding
          'Morale': -20, // -15 from tier, -5 from overcrowding  
          'Teamwork': -35 // -10 from tier, -25 from conflicts
        },
        bonuses: {
          // None currently - no characters in themed rooms that suit them
        }
      },
      
      // Battle performance insights
      battleImpact: {
        currentPenalties: [
          'Spartan Apartment: -8% All Stats, -15% Morale, -10% Teamwork',
          'Overcrowding (10 in 8 capacity): -15% All Stats, -10% Teamwork',
          'Character Conflicts: -35% Teamwork total',
          'Poor Sleep (6 fighters on floor): -10 comfort affecting stamina/vitality',
          'Unthemed Rooms: -3% Morale'
        ],
        facilityBonuses: ownedFacilities.map(f => {
          const facilityData = FACILITIES.find(facility => facility.id === f.id);
          return facilityData?.bonuses.map(b => `${facilityData.name}: ${b.description}`) || [];
        }).flat(),
        strategicRecommendations: [
          'URGENT: Upgrade to Basic House (25,000 coins, 50 gems) to reduce overcrowding penalties',
          'Purchase beds to get fighters off the floor - each floor sleeper loses -10 comfort',
          'Separate conflicting characters (Dracula/Holmes, Achilles/Joan, Cleopatra/Genghis)',
          'Theme rooms for character bonuses - Greek Classical room would give Achilles +15 Strength',
          'Training facilities provide XP bonuses but housing affects base performance'
        ]
      }
    };

    socketRef.current.emit('facilities_chat_message', {
      message: content,
      agentId: selectedAgent.id,
      agentData: selectedAgent, // Pass the full agent data
      facilitiesContext: facilitiesContext,
      previousMessages: messages.slice(-5).map(m => ({
        role: m.type === 'player' ? 'user' : 'assistant',
        content: m.content
      }))
    });

    setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
      }
    }, 15000);
  };
  // --- End Real Estate Agent Chat Logic ---

  const FacilityCard = ({ facility }: { facility: Facility }) => {
    const status = getFacilityStatus(facility);
    
    const getCardStyles = () => {
      switch (status.type) {
        case 'owned':
          return 'border-green-500 bg-green-900/20';
        case 'available':
          return 'border-blue-500 bg-blue-900/20 hover:bg-blue-900/30 cursor-pointer';
        case 'affordable':
          return 'border-yellow-500 bg-yellow-900/20 hover:bg-yellow-900/30 cursor-pointer';
        case 'locked':
          return 'border-gray-600 bg-gray-700/30 opacity-75';
        default:
          return 'border-gray-600 bg-gray-700/30';
      }
    };

    return (
      <motion.div
        layout
        className={`p-4 rounded-lg border transition-all ${getCardStyles()}`}
        onClick={() => openFacilityDetails(facility)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`text-2xl p-2 rounded-lg ${facility.backgroundColor}`}>
              {facility.icon}
            </div>
            <div>
              <h3 className={`font-semibold ${facility.textColor}`}>
                {facility.name}
              </h3>
              <p className="text-sm text-gray-400 capitalize">
                {facility.category} Facility
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {status.type === 'owned' && (
              <div className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Lv.{status.level}</span>
              </div>
            )}
            {status.type === 'locked' && (
              <Lock className="w-4 h-4 text-gray-500" />
            )}
            {status.maintenanceDue && (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-3 line-clamp-2">
          {facility.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-yellow-400">
              <Coins className="w-4 h-4" />
              <span>{facility.cost.coins.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-purple-400">
              <Gem className="w-4 h-4" />
              <span>{facility.cost.gems}</span>
            </div>
          </div>
          
          <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
            <Info className="w-3 h-3" />
            Details
          </button>
        </div>

        {status.type === 'owned' && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-300">Active Bonuses</span>
              <span className="text-green-400">
                +{calculateFacilityBonus(facility, status.level).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const FacilityDetailsModal = () => {
    if (!selectedFacility) return null;
    
    const status = getFacilityStatus(selectedFacility);
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={() => setShowDetailsModal(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-900/50 rounded-xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`text-3xl p-3 rounded-lg ${selectedFacility.backgroundColor}`}>
                {selectedFacility.icon}
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${selectedFacility.textColor}`}>
                  {selectedFacility.name}
                </h2>
                <p className="text-gray-400 capitalize">
                  {selectedFacility.category} Facility
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowDetailsModal(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <p className="text-gray-300 mb-6">{selectedFacility.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Benefits</h3>
              <ul className="space-y-2">
                {selectedFacility.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Bonuses</h3>
              <div className="space-y-2">
                {selectedFacility.bonuses.map((bonus, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{bonus.description}</span>
                    <span className="text-green-400 font-semibold">
                      +{status.type === 'owned' ? 
                        calculateFacilityBonus(selectedFacility, status.level).toFixed(0) : 
                        bonus.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unlock Requirements */}
          {status.type === 'locked' && (
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Unlock Requirements</h3>
              <div className="space-y-2 text-sm">
                {selectedFacility.unlockRequirements.teamLevel && (
                  <div className={`flex items-center gap-2 ${
                    teamLevel >= selectedFacility.unlockRequirements.teamLevel ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <span>Team Level {selectedFacility.unlockRequirements.teamLevel}</span>
                    {teamLevel >= selectedFacility.unlockRequirements.teamLevel && <CheckCircle className="w-4 h-4" />}
                  </div>
                )}
                {selectedFacility.unlockRequirements.achievements?.map((achievement) => (
                  <div key={achievement} className={`flex items-center gap-2 ${
                    unlockedAchievements.includes(achievement) ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <span>Achievement: {achievement}</span>
                    {unlockedAchievements.includes(achievement) && <CheckCircle className="w-4 h-4" />}
                  </div>
                ))}
                {selectedFacility.unlockRequirements.prerequisiteFacilities?.map((facility) => (
                  <div key={facility} className={`flex items-center gap-2 ${
                    ownedFacilities.some(f => f.id === facility) ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <span>Requires: {FACILITIES.find(f => f.id === facility)?.name}</span>
                    {ownedFacilities.some(f => f.id === facility) && <CheckCircle className="w-4 h-4" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {status.type === 'available' && (
              <button
                onClick={() => handlePurchase(selectedFacility.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Purchase for {selectedFacility.cost.coins.toLocaleString()} coins, {selectedFacility.cost.gems} gems
              </button>
            )}
            
            {status.type === 'affordable' && (
              <button
                disabled
                className="flex-1 bg-gray-600 text-gray-300 font-semibold py-3 px-6 rounded-lg"
              >
                Insufficient Funds
              </button>
            )}
            
            {status.type === 'owned' && status.canUpgrade && (
              <button
                onClick={() => handleUpgrade(selectedFacility.id)}
                disabled={!status.canAffordUpgrade}
                className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-colors ${
                  status.canAffordUpgrade
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                Upgrade to Lv.{status.level + 1} for {status.upgradeCost.coins.toLocaleString()} coins, {status.upgradeCost.gems} gems
              </button>
            )}
            
            {status.type === 'owned' && status.maintenanceDue && (
              <button
                onClick={() => onPayMaintenance(selectedFacility.id)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Pay Maintenance
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Team Facilities</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-yellow-400">
              <Coins className="w-5 h-5" />
              <span className="font-semibold text-xl">{currency.coins.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <Gem className="w-5 h-5" />
              <span className="font-semibold text-xl">{currency.gems}</span>
            </div>
          </div>
        </div>
        
        <p className="text-gray-300 mb-4">
          Invest in facilities to enhance your team's training, recovery, and performance. Each facility provides unique bonuses and unlocks new possibilities.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{ownedFacilities.length}</div>
            <div className="text-gray-400">Owned Facilities</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{teamLevel}</div>
            <div className="text-gray-400">Team Level</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {ownedFacilities.reduce((sum, f) => sum + f.level, 0)}
            </div>
            <div className="text-gray-400">Total Levels</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {ownedFacilities.filter(f => !f.maintenancePaid).length}
            </div>
            <div className="text-gray-400">Maintenance Due</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredFacilities.map((facility) => (
            <FacilityCard key={facility.id} facility={facility} />
          ))}
        </AnimatePresence>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && <FacilityDetailsModal />}
      </AnimatePresence>

      {/* Real Estate Agent Chat Interface */}
      <motion.div
        className="bg-gradient-to-br from-gray-900/20 to-gray-800/20 rounded-xl backdrop-blur-sm border border-gray-700/30 overflow-hidden p-6 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-gray-400" />
          Real Estate Agent Advisory
        </h2>
        <p className="text-gray-300">
          Consult with a specialized Real Estate Agent to optimize your team's facilities.
        </p>

        {/* Agent Selection */}
        <div className="mb-4">
          <label htmlFor="agent-select" className="block text-sm font-medium text-gray-400 mb-2">
            Choose your Agent:
          </label>
          <select
            id="agent-select"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="block w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
          >
            {realEstateAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.archetype})
              </option>
            ))}
          </select>
        </div>

        {/* Chat Display */}
        <div className="flex flex-col h-[400px] bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
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
                    : message.type === 'agent'
                    ? 'bg-green-600 text-white'
                    : 'bg-yellow-600 text-white text-sm'
                }`}>
                  <p>{message.content}</p>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-green-600 text-white px-4 py-2 rounded-lg">
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

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/70">
            <div className="text-xs text-gray-400 mb-2">
              Status: {connected ? '🟢 Connected' : '🔴 Disconnected'} |
              {isTyping ? ` ⏳ ${selectedAgent.name} is contemplating a deal...` : ' ✅ Ready for your next inquiry'}
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
                placeholder={isTyping ? 'Agent is typing...' : `Ask ${selectedAgent.name} about facilities...`}
                disabled={isTyping || !connected}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                autoComplete="off"
              />
              <button
                onClick={() => sendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isTyping || !connected}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-500 text-white p-2 rounded-full transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}