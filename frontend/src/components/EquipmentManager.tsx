'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, 
  Shield, 
  Gem, 
  TrendingUp, 
  Search,
  X,
  CheckCircle,
  Lock,
  MessageCircle,
  Send,
  User
} from 'lucide-react';
import { 
  Equipment, 
  EquipmentSlot, 
  EquipmentRarity,
  allEquipment,
  rarityConfig,
  canEquip,
  calculateEquipmentStats,
  getEquipmentByArchetype
} from '@/data/equipment';

interface EquippedItems {
  weapon?: Equipment;
  armor?: Equipment;
  accessory?: Equipment;
}

interface EquipmentManagerProps {
  characterName: string;
  characterLevel: number;
  characterArchetype: string;
  equippedItems?: EquippedItems;
  inventory?: Equipment[];
  onEquip?: (equipment: Equipment) => void;
  onUnequip?: (slot: EquipmentSlot) => void;
}

export default function EquipmentManager({
  characterName = "Unknown Character",
  characterLevel = 1,
  characterArchetype = "warrior",
  equippedItems = {},
  inventory = [],
  onEquip,
  onUnequip
}: Partial<EquipmentManagerProps> = {}) {
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<EquipmentRarity | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'rarity' | 'stats'>('level');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showEquippedOnly, setShowEquippedOnly] = useState(false);
  
  // Equipment Chat State
  const [showEquipmentChat, setShowEquipmentChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    sender: 'coach' | 'character';
    message: string;
    timestamp: Date;
    characterName?: string;
  }>>([]);
  const [currentChatMessage, setCurrentChatMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Get all available equipment for this character
  const availableEquipment = allEquipment.filter(item => 
    canEquip(item, characterLevel, characterArchetype)
  );
  
  console.log('🎯 Equipment Manager Debug:', {
    characterName,
    characterLevel,
    characterArchetype,
    totalEquipment: allEquipment.length,
    availableEquipment: availableEquipment.length,
    equippedItems,
    onEquip: !!onEquip,
    onUnequip: !!onUnequip
  });

  // Filter and sort equipment
  const filteredEquipment = availableEquipment
    .filter(item => {
      const slotMatch = selectedSlot === 'all' || item.slot === selectedSlot;
      const rarityMatch = selectedRarity === 'all' || item.rarity === selectedRarity;
      const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const equippedMatch = !showEquippedOnly || Object.values(equippedItems).some(equipped => equipped?.id === item.id);
      
      return slotMatch && rarityMatch && searchMatch && equippedMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'level':
          return b.requiredLevel - a.requiredLevel;
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
          return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        case 'stats':
          const aStats = (a.stats.atk || 0) + (a.stats.def || 0) + (a.stats.spd || 0);
          const bStats = (b.stats.atk || 0) + (b.stats.def || 0) + (b.stats.spd || 0);
          return bStats - aStats;
        default:
          return 0;
      }
    });

  // Calculate total equipment stats
  const totalStats = calculateEquipmentStats(Object.values(equippedItems).filter(Boolean) as Equipment[]);

  const getSlotIcon = (slot: EquipmentSlot) => {
    switch (slot) {
      case 'weapon': return <Sword className="w-5 h-5" />;
      case 'armor': return <Shield className="w-5 h-5" />;
      case 'accessory': return <Gem className="w-5 h-5" />;
    }
  };

  const isEquipped = (equipment: Equipment): boolean => {
    return Object.values(equippedItems).some(equipped => equipped?.id === equipment.id);
  };

  const getStatColor = (stat: string) => {
    const colors = {
      atk: 'text-red-400',
      def: 'text-blue-400',
      spd: 'text-green-400',
      hp: 'text-pink-400',
      critRate: 'text-yellow-400',
      critDamage: 'text-orange-400',
      accuracy: 'text-purple-400',
      evasion: 'text-cyan-400',
      energyRegen: 'text-indigo-400',
      xpBonus: 'text-emerald-400'
    };
    return colors[stat as keyof typeof colors] || 'text-gray-400';
  };

  const getStatIcon = (stat: string) => {
    const icons = {
      atk: '⚔️',
      def: '🛡️',
      spd: '⚡',
      hp: '❤️',
      critRate: '💥',
      critDamage: '🔥',
      accuracy: '🎯',
      evasion: '👤',
      energyRegen: '🔋',
      xpBonus: '⭐'
    };
    return icons[stat as keyof typeof icons] || '📊';
  };

  // Equipment Chat Functions
  const sendEquipmentChatMessage = async () => {
    if (!currentChatMessage.trim() || isChatLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'coach' as const,
      message: currentChatMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentChatMessage('');
    setIsChatLoading(true);

    try {
      // Real API call to equipment coaching service
      const token = localStorage.getItem('accessToken');
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      
      const response = await fetch(`${BACKEND_URL}/coaching/equipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          characterId: characterName.toLowerCase().replace(' ', '_'), // Convert name to ID format
          userMessage: currentChatMessage,
          context: {
            level: characterLevel,
            archetype: characterArchetype,
            currentEquipment: equippedItems,
            availableEquipment: inventory,
            bondLevel: 50,
            previousMessages: chatMessages.slice(-5).map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.message
            }))
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiResponse = {
        id: Date.now() + 1,
        sender: 'character' as const,
        message: data.message,
        timestamp: new Date(),
        characterName: data.character || characterName
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
      setIsChatLoading(false);
    } catch (error) {
      console.error('Equipment chat error:', error);
      const errorResponse = {
        id: Date.now() + 1,
        sender: 'character' as const,
        message: 'I apologize, but I\'m having trouble responding right now. Please try again.',
        timestamp: new Date(),
        characterName: characterName
      };
      setChatMessages(prev => [...prev, errorResponse]);
      setIsChatLoading(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendEquipmentChatMessage();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Sword className="w-8 h-8 text-orange-400" />
          Equipment Manager
        </h1>
        <p className="text-gray-400 text-lg">
          Equip {characterName} with the best gear for battle
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Equipment Slots */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              Equipped Items
            </h2>

            {/* Equipment Slots */}
            <div className="space-y-4 mb-6">
              {['weapon', 'armor', 'accessory'].map((slot) => {
                const equipped = equippedItems[slot as EquipmentSlot];
                const slotName = slot.charAt(0).toUpperCase() + slot.slice(1);

                return (
                  <div key={slot} className="border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSlotIcon(slot as EquipmentSlot)}
                        <span className="text-white font-semibold">{slotName}</span>
                      </div>
                      {equipped && onUnequip && (
                        <button
                          onClick={() => onUnequip(slot as EquipmentSlot)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {equipped ? (
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${rarityConfig[equipped.rarity].color}/20 border border-current`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{equipped.icon}</span>
                          <span className={`font-semibold ${rarityConfig[equipped.rarity].textColor}`}>
                            {equipped.name}
                          </span>
                          <span className="text-xs">{rarityConfig[equipped.rarity].icon}</span>
                        </div>
                        <div className="text-sm text-gray-400">{equipped.description}</div>
                        
                        {/* Stats */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(equipped.stats).map(([stat, value]) => (
                            value && (
                              <span key={stat} className={`text-xs px-2 py-1 rounded bg-gray-700 ${getStatColor(stat)}`}>
                                {getStatIcon(stat)} +{value}
                              </span>
                            )
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border-2 border-dashed border-gray-600 text-center text-gray-500">
                        <span className="text-2xl block mb-1">➕</span>
                        <span className="text-sm">No {slot} equipped</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total Stats */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Total Equipment Bonuses
              </h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(totalStats).map(([stat, value]) => (
                  value && value > 0 && (
                    <div key={stat} className="flex items-center justify-between">
                      <span className="text-gray-400 capitalize">{stat.replace(/([A-Z])/g, ' $1')}</span>
                      <span className={`font-semibold ${getStatColor(stat)}`}>
                        +{value}{stat.includes('Rate') || stat.includes('Bonus') ? '%' : ''}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Browser */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Gem className="w-6 h-6 text-purple-400" />
                Available Equipment
              </h2>
              <div className="text-sm text-gray-400">
                Level {characterLevel} {characterArchetype ? characterArchetype.charAt(0).toUpperCase() + characterArchetype.slice(1) : 'Unknown'}
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Slot Filter */}
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value as EquipmentSlot | 'all')}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Slots</option>
                <option value="weapon">Weapons</option>
                <option value="armor">Armor</option>
                <option value="accessory">Accessories</option>
              </select>

              {/* Rarity Filter */}
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value as EquipmentRarity | 'all')}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Rarities</option>
                {Object.entries(rarityConfig).map(([rarity, config]) => (
                  <option key={rarity} value={rarity}>{config.icon} {config.name}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rarity' | 'attack' | 'defense')}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="level">Sort by Level</option>
                <option value="name">Sort by Name</option>
                <option value="rarity">Sort by Rarity</option>
                <option value="stats">Sort by Stats</option>
              </select>
            </div>

            {/* Equipment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[650px] overflow-y-auto">
              {filteredEquipment.map((equipment) => {
                const equipped = isEquipped(equipment);
                const canEquipItem = canEquip(equipment, characterLevel, characterArchetype);

                return (
                  <motion.div
                    key={equipment.id}
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      equipped
                        ? 'border-green-500 bg-green-500/10'
                        : canEquipItem
                          ? `border-gray-600 hover:border-blue-500 bg-gradient-to-r ${rarityConfig[equipment.rarity].color}/5`
                          : 'border-gray-700 bg-gray-800/20 opacity-50'
                    }`}
                    whileHover={canEquipItem ? { scale: 1.02 } : {}}
                    onClick={() => setSelectedEquipment(equipment)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{equipment.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${rarityConfig[equipment.rarity].textColor}`}>
                              {equipment.name}
                            </span>
                            <span className="text-xs">{rarityConfig[equipment.rarity].icon}</span>
                            {equipped && <CheckCircle className="w-4 h-4 text-green-400" />}
                            {!canEquipItem && <Lock className="w-4 h-4 text-red-400" />}
                          </div>
                          <div className="text-sm text-gray-400">
                            Level {equipment.requiredLevel} • {equipment.slot}
                          </div>
                        </div>
                      </div>
                      
                      {canEquipItem && onEquip && !equipped && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('⚔️ Equip button clicked:', equipment);
                            console.log('⚔️ onEquip function:', onEquip);
                            console.log('⚔️ canEquipItem:', canEquipItem);
                            console.log('⚔️ equipped:', equipped);
                            onEquip(equipment);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          Equip
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-gray-400 mb-2">{equipment.description}</p>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(equipment.stats).map(([stat, value]) => (
                        value && (
                          <span key={stat} className={`text-xs px-2 py-1 rounded bg-gray-700 ${getStatColor(stat)}`}>
                            {getStatIcon(stat)} +{value}
                          </span>
                        )
                      ))}
                    </div>

                    {/* Effects */}
                    {equipment.effects.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-purple-400 font-semibold">Special Effects:</div>
                        {equipment.effects.map((effect, index) => (
                          <div key={effect.id} className="text-xs text-gray-400">
                            • {effect.name}: {effect.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {filteredEquipment.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Equipment Found</h3>
                <p className="text-gray-500">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Equipment Detail Modal */}
      <AnimatePresence>
        {selectedEquipment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEquipment(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">Equipment Details</h3>
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className={`p-4 rounded-lg bg-gradient-to-r ${rarityConfig[selectedEquipment.rarity].color}/20 border border-current mb-4`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{selectedEquipment.icon}</span>
                  <div>
                    <h4 className={`text-xl font-bold ${rarityConfig[selectedEquipment.rarity].textColor}`}>
                      {selectedEquipment.name}
                    </h4>
                    <div className="text-sm text-gray-400">
                      {rarityConfig[selectedEquipment.rarity].name} {selectedEquipment.slot}
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 mb-3">{selectedEquipment.description}</p>
                <p className="text-sm text-gray-400 italic">&quot;{selectedEquipment.flavor}&quot;</p>
              </div>

              {/* Requirements */}
              <div className="mb-4">
                <h5 className="text-white font-semibold mb-2">Requirements</h5>
                <div className="space-y-1 text-sm">
                  <div className={`flex items-center gap-2 ${characterLevel >= selectedEquipment.requiredLevel ? 'text-green-400' : 'text-red-400'}`}>
                    {characterLevel >= selectedEquipment.requiredLevel ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    Level {selectedEquipment.requiredLevel}
                  </div>
                  {selectedEquipment.requiredArchetype && (
                    <div className={`flex items-center gap-2 ${selectedEquipment.requiredArchetype.includes(characterArchetype) ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedEquipment.requiredArchetype.includes(characterArchetype) ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {selectedEquipment.requiredArchetype.join(', ')} only
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mb-4">
                <h5 className="text-white font-semibold mb-2">Stats</h5>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedEquipment.stats).map(([stat, value]) => (
                    value && (
                      <div key={stat} className="flex items-center justify-between">
                        <span className="text-gray-400 capitalize">{stat.replace(/([A-Z])/g, ' $1')}</span>
                        <span className={`font-semibold ${getStatColor(stat)}`}>
                          +{value}{stat.includes('Rate') || stat.includes('Bonus') ? '%' : ''}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Effects */}
              {selectedEquipment.effects.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-white font-semibold mb-2">Special Effects</h5>
                  <div className="space-y-2">
                    {selectedEquipment.effects.map((effect, index) => (
                      <div key={effect.id} className="bg-gray-800 rounded p-3">
                        <div className="text-purple-400 font-semibold">{effect.name}</div>
                        <div className="text-sm text-gray-300">{effect.description}</div>
                        <div className="text-xs text-gray-500 capitalize mt-1">
                          {effect.type} {effect.trigger && `• ${effect.trigger.replace(/_/g, ' ')}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {canEquip(selectedEquipment, characterLevel, characterArchetype) && onEquip && !isEquipped(selectedEquipment) && (
                  <button
                    onClick={() => {
                      onEquip(selectedEquipment);
                      setSelectedEquipment(null);
                    }}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Equip
                  </button>
                )}
                
                {isEquipped(selectedEquipment) && onUnequip && (
                  <button
                    onClick={() => {
                      onUnequip(selectedEquipment.slot);
                      setSelectedEquipment(null);
                    }}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Unequip
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}