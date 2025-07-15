'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Star, 
  Zap, 
  Shield, 
  Sword,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Equipment } from '@/data/equipment';
import { Character } from '@/data/characters';
import { 
  getEquipmentCompatibility, 
  simulateEquipmentChange 
} from '@/data/characterEquipment';

interface EquipmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  character?: Character;
  onEquip?: (equipment: Equipment) => void;
  onUnequip?: () => void;
  showComparison?: boolean;
}

const rarityConfig = {
  common: {
    borderColor: 'border-gray-400',
    bgGradient: 'from-gray-50 to-gray-100',
    textColor: 'text-gray-600',
    icon: '⚪'
  },
  uncommon: {
    borderColor: 'border-green-400',
    bgGradient: 'from-green-50 to-green-100',
    textColor: 'text-green-600',
    icon: '🟢'
  },
  rare: {
    borderColor: 'border-blue-400',
    bgGradient: 'from-blue-50 to-blue-100',
    textColor: 'text-blue-600',
    icon: '🔵'
  },
  epic: {
    borderColor: 'border-purple-400',
    bgGradient: 'from-purple-50 to-purple-100',
    textColor: 'text-purple-600',
    icon: '🟣'
  },
  legendary: {
    borderColor: 'border-yellow-400',
    bgGradient: 'from-yellow-50 to-orange-100',
    textColor: 'text-orange-600',
    icon: '🟡'
  },
  mythic: {
    borderColor: 'border-pink-400',
    bgGradient: 'from-pink-50 to-purple-100',
    textColor: 'text-pink-600',
    icon: '🌟'
  }
};

export default function EquipmentDetailsModal({
  isOpen,
  onClose,
  equipment,
  character,
  onEquip,
  onUnequip,
  showComparison = true
}: EquipmentDetailsModalProps) {
  if (!equipment) return null;

  const config = rarityConfig[equipment.rarity] || rarityConfig.common;
  
  // Calculate compatibility if character is provided
  const compatibility = character ? getEquipmentCompatibility(character, equipment) : null;
  const comparison = character && showComparison ? simulateEquipmentChange(character, equipment) : null;

  const StatDisplay = ({ 
    label, 
    value, 
    change, 
    icon 
  }: { 
    label: string; 
    value: number; 
    change?: number;
    icon?: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{value > 0 ? `+${value}` : value}</span>
        {change !== undefined && change !== 0 && (
          <span className={`text-xs font-mono ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            ({change > 0 ? '+' : ''}{change})
          </span>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${config.bgGradient} p-6 border-b ${config.borderColor} border-2`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{equipment.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{equipment.name}</h2>
                      <div className="flex items-center gap-2">
                        <span className={`${config.textColor} text-sm font-medium`}>
                          {config.icon} {equipment.rarity.toUpperCase()}
                        </span>
                        <span className="text-gray-500 text-sm">
                          Level {equipment.requiredLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {equipment.description}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Statistics
              </h3>
              <div className="space-y-2">
                {equipment.stats.atk && (
                  <StatDisplay 
                    label="Attack" 
                    value={equipment.stats.atk}
                    change={comparison?.statChanges.attack}
                    icon={<Sword className="w-4 h-4 text-red-500" />}
                  />
                )}
                {equipment.stats.def && (
                  <StatDisplay 
                    label="Defense" 
                    value={equipment.stats.def}
                    change={comparison?.statChanges.defense}
                    icon={<Shield className="w-4 h-4 text-blue-500" />}
                  />
                )}
                {equipment.stats.spd && (
                  <StatDisplay 
                    label="Speed" 
                    value={equipment.stats.spd}
                    change={comparison?.statChanges.speed}
                    icon={<Zap className="w-4 h-4 text-green-500" />}
                  />
                )}
                {equipment.stats.hp && (
                  <StatDisplay 
                    label="Health" 
                    value={equipment.stats.hp}
                    change={comparison?.statChanges.health}
                    icon={<Shield className="w-4 h-4 text-green-600" />}
                  />
                )}
                {equipment.stats.critRate && (
                  <StatDisplay 
                    label="Critical Rate" 
                    value={equipment.stats.critRate}
                    change={comparison?.statChanges.criticalChance}
                    icon={<Star className="w-4 h-4 text-yellow-500" />}
                  />
                )}
                {equipment.stats.accuracy && (
                  <StatDisplay 
                    label="Accuracy" 
                    value={equipment.stats.accuracy}
                    change={comparison?.statChanges.accuracy}
                    icon={<TrendingUp className="w-4 h-4 text-purple-500" />}
                  />
                )}
              </div>
            </div>

            {/* Effects */}
            {equipment.effects.length > 0 && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Special Effects
                </h3>
                <div className="space-y-3">
                  {equipment.effects.map((effect, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">{effect.name}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {effect.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{effect.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compatibility */}
            {compatibility && character && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Compatibility
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Effectiveness</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full ${
                            compatibility.effectiveness >= 1 ? 'bg-green-500' :
                            compatibility.effectiveness >= 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(compatibility.effectiveness * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono">
                        {Math.round(compatibility.effectiveness * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  {compatibility.restrictions.length > 0 && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-800">Restrictions</span>
                      </div>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        {compatibility.restrictions.map((restriction, index) => (
                          <li key={index}>• {restriction}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Power Level Comparison */}
            {comparison && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Power Level Impact
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Power Change</span>
                  <span className={`font-bold ${
                    comparison.powerChange > 0 ? 'text-green-600' : 
                    comparison.powerChange < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {comparison.powerChange > 0 ? '+' : ''}{comparison.powerChange}
                  </span>
                </div>
              </div>
            )}

            {/* Flavor Text */}
            <div className="p-6 border-b border-gray-200">
              <blockquote className="italic text-gray-600 text-center">
                &quot;{equipment.flavor}&quot;
              </blockquote>
            </div>

            {/* Actions */}
            <div className="p-6 flex gap-3">
              {character && compatibility?.canEquip && onEquip && (
                <button
                  onClick={() => onEquip(equipment)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Equip
                </button>
              )}
              {character?.equippedItems[equipment.slot] && onUnequip && (
                <button
                  onClick={onUnequip}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Unequip Current
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}