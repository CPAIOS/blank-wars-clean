'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Zap, 
  Shield, 
 
  Sword, 
  Crown,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Character } from '@/data/characters';
import { 
  createEquippedCharacter, 
  getCharacterPowerLevel,
 
} from '@/data/characterEquipment';
import { getCharacterWeaponProgression } from '@/data/equipment';

interface CharacterCardWithEquipmentProps {
  character: Character;
  size?: 'small' | 'medium' | 'large';
  showEquipment?: boolean;
  showStats?: boolean;
  showProgression?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onEquipmentClick?: (slot: 'weapon' | 'armor' | 'accessory') => void;
  className?: string;
}

const rarityConfig = {
  common: {
    borderGradient: 'from-gray-400 to-gray-600',
    bgGradient: 'from-gray-50 to-gray-100',
    glowColor: 'shadow-gray-300/50',
    stars: 1,
    rarityColor: 'text-gray-600'
  },
  uncommon: {
    borderGradient: 'from-green-400 to-green-600',
    bgGradient: 'from-green-50 to-green-100',
    glowColor: 'shadow-green-300/50',
    stars: 2,
    rarityColor: 'text-green-600'
  },
  rare: {
    borderGradient: 'from-blue-400 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100',
    glowColor: 'shadow-blue-300/50',
    stars: 3,
    rarityColor: 'text-blue-600'
  },
  epic: {
    borderGradient: 'from-purple-400 to-purple-600',
    bgGradient: 'from-purple-50 to-purple-100',
    glowColor: 'shadow-purple-300/50',
    stars: 4,
    rarityColor: 'text-purple-600'
  },
  legendary: {
    borderGradient: 'from-yellow-400 to-orange-500',
    bgGradient: 'from-yellow-50 to-orange-100',
    glowColor: 'shadow-yellow-300/50',
    stars: 5,
    rarityColor: 'text-orange-600'
  },
  mythic: {
    borderGradient: 'from-red-500 via-pink-500 to-purple-500',
    bgGradient: 'from-red-50 to-purple-100',
    glowColor: 'shadow-pink-300/50',
    stars: 6,
    rarityColor: 'text-pink-600'
  }
};

const sizeConfig = {
  small: {
    cardWidth: 'w-48',
    cardHeight: 'h-64',
    avatarSize: 'text-3xl',
    titleSize: 'text-sm',
    subtitleSize: 'text-xs',
    equipmentSize: 'text-lg',
    padding: 'p-3'
  },
  medium: {
    cardWidth: 'w-64',
    cardHeight: 'h-80',
    avatarSize: 'text-4xl',
    titleSize: 'text-base',
    subtitleSize: 'text-sm',
    equipmentSize: 'text-xl',
    padding: 'p-4'
  },
  large: {
    cardWidth: 'w-80',
    cardHeight: 'h-96',
    avatarSize: 'text-5xl',
    titleSize: 'text-lg',
    subtitleSize: 'text-base',
    equipmentSize: 'text-2xl',
    padding: 'p-6'
  }
};

export default function CharacterCardWithEquipment({
  character,
  size = 'medium',
  showEquipment = true,
  showStats = true,
  showProgression = false,
  isHovered = false,
  isSelected = false,
  onClick,
  onEquipmentClick,
  className = ''
}: CharacterCardWithEquipmentProps) {
  const equippedCharacter = createEquippedCharacter(character);
  const powerLevel = getCharacterPowerLevel(character);
  const weaponProgression = getCharacterWeaponProgression(character.id);
  
  const config = rarityConfig[character.rarity];
  const sizeConfig_ = sizeConfig[size];
  
  const renderStars = (count: number) => {
    return Array.from({ length: count }).map((_, i) => (
      <Star key={i} className="w-3 h-3 fill-current" />
    ));
  };

  const EquipmentSlot = ({ 
    slot, 
    equipment, 
    icon: Icon 
  }: { 
    slot: 'weapon' | 'armor' | 'accessory';
    equipment: object | null;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative border-2 rounded-lg p-2 cursor-pointer transition-all
        ${equipment 
          ? `border-${equipment.rarity === 'legendary' ? 'yellow' : equipment.rarity === 'epic' ? 'purple' : equipment.rarity === 'rare' ? 'blue' : 'gray'}-400 bg-gradient-to-br from-white to-gray-50` 
          : 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
        }
      `}
      onClick={() => onEquipmentClick?.(slot)}
      title={equipment ? equipment.name : `Equip ${slot}`}
    >
      {equipment ? (
        <div className="text-center">
          <div className={sizeConfig_.equipmentSize}>{equipment.icon}</div>
          {size !== 'small' && (
            <div className="text-xs text-gray-600 mt-1 truncate">
              {equipment.name}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-400">
          <Icon className={`w-5 h-5 mx-auto`} />
          {size === 'large' && (
            <Plus className="w-3 h-3 mx-auto mt-1" />
          )}
        </div>
      )}
    </motion.div>
  );

  const StatBar = ({ 
    label, 
    value, 
    maxValue, 
    color = 'blue',
    showEquipmentBonus = false,
    equipmentBonus = 0
  }: {
    label: string;
    value: number;
    maxValue: number;
    color?: string;
    showEquipmentBonus?: boolean;
    equipmentBonus?: number;
  }) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    const bonusPercentage = Math.min(((equipmentBonus) / maxValue) * 100, 100);
    
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="w-8 text-gray-600">{label}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2 relative overflow-hidden">
          <div 
            className={`bg-${color}-500 h-full rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
          {showEquipmentBonus && equipmentBonus > 0 && (
            <div 
              className={`bg-${color}-300 h-full rounded-full absolute top-0 transition-all duration-300`}
              style={{ 
                left: `${percentage}%`,
                width: `${bonusPercentage}%` 
              }}
            />
          )}
        </div>
        <span className="w-8 text-right font-mono">
          {value}
          {showEquipmentBonus && equipmentBonus > 0 && (
            <span className="text-green-600">+{equipmentBonus}</span>
          )}
        </span>
      </div>
    );
  };

  return (
    <motion.div
      whileHover={{ scale: isHovered ? 1.02 : 1 }}
      whileTap={{ scale: 0.98 }}
      className={`
        ${sizeConfig_.cardWidth} ${sizeConfig_.cardHeight}
        bg-gradient-to-br ${config.bgGradient}
        border-4 bg-gradient-to-br ${config.borderGradient}
        rounded-xl ${sizeConfig_.padding} cursor-pointer relative overflow-hidden
        ${isSelected ? 'ring-4 ring-blue-400' : ''}
        ${isHovered ? `${config.glowColor} shadow-xl` : 'shadow-lg'}
        transition-all duration-300
        ${className}
      `}
      onClick={onClick}
    >
      {/* Rarity stars */}
      <div className={`absolute top-2 right-2 flex ${config.rarityColor}`}>
        {renderStars(config.stars)}
      </div>

      {/* Character avatar and basic info */}
      <div className="text-center mb-3">
        <div className={`${sizeConfig_.avatarSize} mb-2`}>{character.avatar}</div>
        <h3 className={`${sizeConfig_.titleSize} font-bold text-gray-800 truncate`}>
          {character.name}
        </h3>
        <p className={`${sizeConfig_.subtitleSize} text-gray-600 truncate`}>
          {character.title || character.archetype}
        </p>
        <p className={`text-xs text-gray-500`}>
          Level {character.level} • Power: {powerLevel}
        </p>
      </div>

      {/* Equipment slots */}
      {showEquipment && (
        <div className="mb-3">
          <div className="text-xs text-gray-600 mb-2 font-semibold">Equipment</div>
          <div className="grid grid-cols-3 gap-2">
            <EquipmentSlot 
              slot="weapon" 
              equipment={character.equippedItems.weapon}
              icon={Sword}
            />
            <EquipmentSlot 
              slot="armor" 
              equipment={character.equippedItems.armor}
              icon={Shield}
            />
            <EquipmentSlot 
              slot="accessory" 
              equipment={character.equippedItems.accessory}
              icon={Crown}
            />
          </div>
        </div>
      )}

      {/* Character stats */}
      {showStats && size !== 'small' && (
        <div className="space-y-1">
          <StatBar 
            label="ATK" 
            value={equippedCharacter.finalStats.attack}
            maxValue={200}
            color="red"
            showEquipmentBonus={true}
            equipmentBonus={equippedCharacter.equipmentBonuses.atk || 0}
          />
          <StatBar 
            label="DEF" 
            value={equippedCharacter.finalStats.defense}
            maxValue={150}
            color="blue"
            showEquipmentBonus={true}
            equipmentBonus={equippedCharacter.equipmentBonuses.def || 0}
          />
          <StatBar 
            label="SPD" 
            value={equippedCharacter.finalStats.speed}
            maxValue={180}
            color="green"
            showEquipmentBonus={true}
            equipmentBonus={equippedCharacter.equipmentBonuses.spd || 0}
          />
        </div>
      )}

      {/* Weapon progression indicator */}
      {showProgression && size === 'large' && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600 mb-2">Weapon Progression</div>
          <div className="flex items-center justify-between text-xs">
            <div className={`text-center ${weaponProgression.basic ? 'text-gray-600' : 'text-gray-400'}`}>
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-1">
                {weaponProgression.basic ? '✓' : '○'}
              </div>
              Basic
            </div>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <div className={`text-center ${weaponProgression.elite ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center mx-auto mb-1">
                {weaponProgression.elite ? '✓' : '○'}
              </div>
              Elite
            </div>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <div className={`text-center ${weaponProgression.legendary ? 'text-yellow-600' : 'text-gray-400'}`}>
              <div className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center mx-auto mb-1">
                {weaponProgression.legendary ? '✓' : '○'}
              </div>
              Legend
            </div>
          </div>
        </div>
      )}

      {/* Equipment effects indicator */}
      {equippedCharacter.activeEffects.length > 0 && size !== 'small' && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center gap-1 text-xs text-gray-600 bg-white/80 rounded px-2 py-1">
            <Zap className="w-3 h-3" />
            <span className="truncate">
              {equippedCharacter.activeEffects.length} effect{equippedCharacter.activeEffects.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}