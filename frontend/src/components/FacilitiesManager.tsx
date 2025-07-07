'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, Crown, Sparkles, TrendingUp, 
  CheckCircle, Lock, AlertCircle, Coins, 
  Gem, Star, ChevronRight, Info
} from 'lucide-react';
import { 
  FACILITIES, 
  Facility, 
  FacilityState, 
  calculateFacilityBonus, 
  getFacilityUpgradeCost, 
  canUnlockFacility 
} from '@/data/facilities';

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
    </div>
  );
}