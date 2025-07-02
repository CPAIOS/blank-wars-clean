'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  Clock, 
  Users, 
  Zap, 
  Star, 
  TrendingUp, 
  Lock, 
  Unlock,
  CheckCircle,
  MapPin,
  ChevronRight,
  Crown,
  Sparkles
} from 'lucide-react';
import { facilities, memberships, canAccessFacility, getTrainingMultipliers, FacilityType, MembershipTier } from '@/data/memberships';

interface TrainingFacilitySelectorProps {
  membershipTier?: MembershipTier;
  selectedFacility: FacilityType;
  onSelectFacility: (facility: FacilityType) => void;
  onUpgradeMembership?: () => void;
}

export default function TrainingFacilitySelector({
  membershipTier = 'free',
  selectedFacility,
  onSelectFacility,
  onUpgradeMembership
}: TrainingFacilitySelectorProps) {
  const [expandedFacility, setExpandedFacility] = useState<FacilityType | null>(null);

  const facilityOrder: FacilityType[] = ['community', 'bronze', 'elite', 'legendary'];

  const getEquipmentColor = (equipment: string) => {
    switch (equipment) {
      case 'basic': return 'text-gray-400';
      case 'standard': return 'text-blue-400';
      case 'advanced': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getCrowdIcon = (crowdLevel: string) => {
    switch (crowdLevel) {
      case 'empty': return { icon: '🧘', text: 'Private', color: 'text-green-400' };
      case 'moderate': return { icon: '👥', text: 'Moderate', color: 'text-yellow-400' };
      case 'crowded': return { icon: '👫', text: 'Busy', color: 'text-red-400' };
      default: return { icon: '❓', text: 'Unknown', color: 'text-gray-400' };
    }
  };

  const getAccessibilityInfo = (facilityType: FacilityType) => {
    const canAccess = canAccessFacility(membershipTier, facilityType);
    const facility = facilities[facilityType];
    const multipliers = getTrainingMultipliers(membershipTier, facilityType);

    return {
      canAccess,
      facility,
      multipliers
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Building className="w-8 h-8 text-blue-400" />
          Choose Your Training Facility
        </h2>
        <p className="text-gray-400">
          Different facilities offer unique bonuses and atmospheres for your training
        </p>
      </div>

      {/* Current Membership Info */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{memberships[membershipTier]?.icon || '👤'}</span>
            <div>
              <h3 className="text-white font-semibold">{memberships[membershipTier]?.name || 'Unknown'}</h3>
              <p className="text-gray-400 text-sm">{memberships[membershipTier]?.tagline || 'No membership'}</p>
            </div>
          </div>
          {membershipTier !== 'legendary' && onUpgradeMembership && (
            <button
              onClick={onUpgradeMembership}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition-all flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Facility Grid */}
      <div className="grid gap-4">
        {facilityOrder.map((facilityType) => {
          const { canAccess, facility, multipliers } = getAccessibilityInfo(facilityType);
          const isSelected = selectedFacility === facilityType;
          const isExpanded = expandedFacility === facilityType;
          const crowdInfo = getCrowdIcon(facility.crowdLevel);

          return (
            <motion.div
              key={facilityType}
              className={`border-2 rounded-xl transition-all cursor-pointer ${
                isSelected 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : canAccess 
                    ? 'border-gray-600 hover:border-gray-500 bg-gray-800/30' 
                    : 'border-gray-700 bg-gray-800/10 opacity-60'
              }`}
              whileHover={canAccess ? { scale: 1.02 } : {}}
              onClick={() => {
                if (canAccess) {
                  onSelectFacility(facilityType);
                  setExpandedFacility(isExpanded ? null : facilityType);
                }
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{facility.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {facility.name}
                        {canAccess ? (
                          <Unlock className="w-5 h-5 text-green-400" />
                        ) : (
                          <Lock className="w-5 h-5 text-red-400" />
                        )}
                        {isSelected && <CheckCircle className="w-5 h-5 text-blue-400" />}
                      </h3>
                      <p className="text-gray-400">{facility.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {canAccess ? (
                      <ChevronRight 
                        className={`w-6 h-6 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`} 
                      />
                    ) : (
                      <div className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">
                        Upgrade Required
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-2xl ${getEquipmentColor(facility.equipment)}`}>
                      {facility.equipment === 'basic' ? '🏋️' : 
                       facility.equipment === 'standard' ? '💪' :
                       facility.equipment === 'advanced' ? '⚡' : '✨'}
                    </div>
                    <div className="text-sm text-gray-400">Equipment</div>
                    <div className={`text-sm capitalize ${getEquipmentColor(facility.equipment)}`}>
                      {facility.equipment}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={`text-2xl ${crowdInfo.color}`}>{crowdInfo.icon}</div>
                    <div className="text-sm text-gray-400">Crowd Level</div>
                    <div className={`text-sm ${crowdInfo.color}`}>{crowdInfo.text}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl text-blue-400">
                      <TrendingUp className="w-6 h-6 mx-auto" />
                    </div>
                    <div className="text-sm text-gray-400">XP Bonus</div>
                    <div className="text-sm text-blue-400">+{Math.round((multipliers.xp - 1) * 100)}%</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl text-green-400">
                      <Star className="w-6 h-6 mx-auto" />
                    </div>
                    <div className="text-sm text-gray-400">Stat Bonus</div>
                    <div className="text-sm text-green-400">+{Math.round((multipliers.stat - 1) * 100)}%</div>
                  </div>
                </div>

                {/* Energy Cost Reduction */}
                {facility.energyCostReduction > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-semibold">
                      {Math.round(facility.energyCostReduction * 100)}% Less Energy Cost
                    </span>
                  </div>
                )}

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && canAccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-700 pt-4 mt-4"
                    >
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Facility Features
                      </h4>
                      <div className="grid gap-2">
                        {facility.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Training Effectiveness */}
                      <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                        <h5 className="text-white font-medium mb-2">Training Effectiveness</h5>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">XP Multiplier:</span>
                            <span className="text-blue-400 font-semibold">{multipliers.xp.toFixed(1)}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Stat Multiplier:</span>
                            <span className="text-green-400 font-semibold">{multipliers.stat.toFixed(1)}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Energy Efficiency:</span>
                            <span className="text-yellow-400 font-semibold">
                              {Math.round(multipliers.energyCost * 100)}% cost
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Training Points:</span>
                            <span className="text-purple-400 font-semibold">{multipliers.trainingPoints.toFixed(1)}x</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Locked Facility Upgrade Prompt */}
                {!canAccess && (
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-red-400 font-semibold mb-1">Membership Upgrade Required</p>
                      <p className="text-gray-400 text-sm mb-3">
                        Upgrade to {facility.type === 'bronze' ? 'Bronze' : facility.type === 'elite' ? 'Elite' : 'Legendary'} 
                        {' '}membership to access this facility
                      </p>
                      {onUpgradeMembership && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpgradeMembership();
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition-all text-sm"
                        >
                          Upgrade Membership
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Current Selection Summary */}
      {selectedFacility && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/50"
        >
          <div className="flex items-center gap-4 mb-4">
            <MapPin className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Currently Training At</h3>
              <p className="text-blue-300">{facilities[selectedFacility].name}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <div className="text-blue-400 font-semibold">
                {getTrainingMultipliers(membershipTier, selectedFacility).xp.toFixed(1)}x XP
              </div>
            </div>
            <div className="bg-green-500/10 p-3 rounded-lg">
              <Star className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <div className="text-green-400 font-semibold">
                {getTrainingMultipliers(membershipTier, selectedFacility).stat.toFixed(1)}x Stats
              </div>
            </div>
            <div className="bg-yellow-500/10 p-3 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <div className="text-yellow-400 font-semibold">
                {Math.round(getTrainingMultipliers(membershipTier, selectedFacility).energyCost * 100)}% Energy
              </div>
            </div>
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <div className="text-purple-400 font-semibold">
                {getTrainingMultipliers(membershipTier, selectedFacility).trainingPoints.toFixed(1)}x TP
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}