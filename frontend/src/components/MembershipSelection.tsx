'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  X, 
  Star, 
  Crown,
  Sparkles,
  Lock,
  Unlock,
  TrendingUp,
  Clock,
  Infinity
} from 'lucide-react';
import { memberships, MembershipTier, facilities } from '@/data/memberships';

interface MembershipSelectionProps {
  currentTier: MembershipTier;
  onSelectTier?: (tier: MembershipTier) => void;
  onPurchase?: (tier: MembershipTier) => void;
}

export default function MembershipSelection({
  currentTier = 'free',
  onSelectTier,
  onPurchase
}: MembershipSelectionProps) {
  const [selectedTier, setSelectedTier] = useState<MembershipTier>(currentTier);
  const [showComparison, setShowComparison] = useState(false);

  const tierOrder: MembershipTier[] = ['free', 'bronze', 'elite', 'legendary'];

  const handleSelectTier = (tier: MembershipTier) => {
    setSelectedTier(tier);
    onSelectTier?.(tier);
  };

  const getTierGradient = (tier: MembershipTier) => {
    switch (tier) {
      case 'free':
        return 'from-gray-600 to-gray-700';
      case 'bronze':
        return 'from-orange-600 to-orange-700';
      case 'elite':
        return 'from-purple-600 to-purple-700';
      case 'legendary':
        return 'from-yellow-500 to-orange-600';
    }
  };

  const getTierBorder = (tier: MembershipTier) => {
    switch (tier) {
      case 'free':
        return 'border-gray-600';
      case 'bronze':
        return 'border-orange-500';
      case 'elite':
        return 'border-purple-500';
      case 'legendary':
        return 'border-yellow-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-4">
          Choose Your Training Path
        </h1>
        <p className="text-xl text-gray-400">
          Unlock your character&apos;s true potential with premium training facilities
        </p>
      </div>

      {/* Membership Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {tierOrder.map((tier) => {
          const membership = memberships[tier];
          const isCurrentTier = tier === currentTier;
          const isSelected = tier === selectedTier;
          const tierIndex = tierOrder.indexOf(tier);
          const currentIndex = tierOrder.indexOf(currentTier);
          const isUpgrade = tierIndex > currentIndex;

          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: tierIndex * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleSelectTier(tier)}
              className={`relative cursor-pointer rounded-2xl border-2 transition-all ${
                isSelected ? getTierBorder(tier) : 'border-gray-700'
              } ${isCurrentTier ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Popular Badge */}
              {tier === 'elite' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className={`p-6 rounded-2xl bg-gradient-to-b ${getTierGradient(tier)} bg-opacity-20`}>
                {/* Tier Icon & Name */}
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">{membership.icon}</div>
                  <h3 className="text-2xl font-bold text-white">{membership.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{membership.tagline}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  {membership.price === 0 ? (
                    <div className="text-3xl font-bold text-white">Free</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-white">
                        ${membership.price}
                        <span className="text-lg text-gray-400">/month</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Key Benefits */}
                <ul className="space-y-3 mb-6">
                  {membership.benefits.slice(0, 4).map((benefit) => (
                    <li key={benefit.id} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-200">{benefit.name}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                {isCurrentTier ? (
                  <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold">
                    Current Plan
                  </button>
                ) : isUpgrade ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPurchase?.(tier);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Upgrade Now
                  </button>
                ) : (
                  <button className="w-full py-3 bg-gray-700 text-gray-400 rounded-lg font-semibold cursor-not-allowed">
                    Downgrade
                  </button>
                )}
              </div>

              {/* Current Plan Indicator */}
              {isCurrentTier && (
                <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  CURRENT
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Comparison Toggle */}
      <div className="text-center mb-8">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
        >
          {showComparison ? 'Hide' : 'Show'} Detailed Comparison
        </button>
      </div>

      {/* Detailed Comparison Table */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-4 text-gray-400">Feature</th>
                {tierOrder.map((tier) => (
                  <th key={tier} className="text-center p-4">
                    <div className="text-white font-semibold">{memberships[tier]?.name || 'Unknown'}</div>
                    <div className="text-2xl mt-1">{memberships[tier]?.icon || '👤'}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Training Sessions */}
              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">Daily Training Sessions</td>
                {tierOrder.map((tier) => (
                  <td key={tier} className="text-center p-4 text-white">
                    {memberships[tier]?.limits?.dailyTrainingSessions === 'unlimited' ? (
                      <div className="flex items-center justify-center gap-1">
                        <Infinity className="w-4 h-4" />
                        <span>Unlimited</span>
                      </div>
                    ) : (
                      memberships[tier]?.limits?.dailyTrainingSessions || 0
                    )}
                  </td>
                ))}
              </tr>

              {/* XP Multiplier */}
              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">XP Multiplier</td>
                {tierOrder.map((tier) => (
                  <td key={tier} className="text-center p-4 text-white">
                    {memberships[tier]?.limits?.xpMultiplier || 1}x
                  </td>
                ))}
              </tr>

              {/* Skill Learning */}
              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">Weekly Skill Learning</td>
                {tierOrder.map((tier) => (
                  <td key={tier} className="text-center p-4 text-white">
                    {memberships[tier]?.limits?.skillLearningSessions === 0 ? (
                      <X className="w-5 h-5 text-red-400 mx-auto" />
                    ) : memberships[tier]?.limits?.skillLearningSessions === 7 ? (
                      'Daily'
                    ) : memberships[tier]?.limits?.skillLearningSessions === 'unlimited' ? (
                      <div className="flex items-center justify-center gap-1">
                        <Infinity className="w-4 h-4" />
                        <span>Unlimited</span>
                      </div>
                    ) : (
                      memberships[tier]?.limits?.skillLearningSessions || 0
                    )}
                  </td>
                ))}
              </tr>

              {/* Facilities */}
              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">Training Facilities</td>
                {tierOrder.map((tier) => {
                  const facilityIcons = (memberships[tier]?.facilities || []).map(f => facilities[f]?.icon || '🏠');
                  return (
                    <td key={tier} className="text-center p-4">
                      <div className="flex justify-center gap-1 text-2xl">
                        {facilityIcons.map((icon, idx) => (
                          <span key={idx}>{icon}</span>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Skill Access */}
              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">Core Skills</td>
                {tierOrder.map((tier) => (
                  <td key={tier} className="text-center p-4">
                    {memberships[tier].skillAccess.coreSkills ? (
                      <Check className="w-5 h-5 text-green-400 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-400 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">Archetype Skills</td>
                {tierOrder.map((tier) => (
                  <td key={tier} className="text-center p-4">
                    {memberships[tier].skillAccess.archetypeSkills ? (
                      <Check className="w-5 h-5 text-green-400 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-400 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-gray-800">
                <td className="p-4 text-gray-300">Signature Skills</td>
                {tierOrder.map((tier) => (
                  <td key={tier} className="text-center p-4">
                    {memberships[tier].skillAccess.signatureSkills ? (
                      <Check className="w-5 h-5 text-green-400 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-400 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-gray-300">Cross-Character Skills</td>
                {tierOrder.map((tier) => (
                  <td key={tier} className="text-center p-4">
                    {memberships[tier].skillAccess.crossCharacterSkills ? (
                      <Check className="w-5 h-5 text-green-400 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-400 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Bottom CTA */}
      <div className="text-center mt-12 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-8 border border-purple-700/50">
        <h3 className="text-2xl font-bold text-white mb-2">
          Ready to Unlock Your Full Potential?
        </h3>
        <p className="text-gray-300 mb-6">
          Join thousands of trainers who have transformed their characters with premium training
        </p>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">2.5M+</div>
            <div className="text-gray-400">Active Trainers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">4.8★</div>
            <div className="text-gray-400">User Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">50K+</div>
            <div className="text-gray-400">Skills Learned Daily</div>
          </div>
        </div>
      </div>
    </div>
  );
}