'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TeamCharacter, getMentalHealthLevel } from '@/data/teamBattleSystem';
import { Star, Zap, Shield, Heart, Brain, Users, MessageCircle, Crown } from 'lucide-react';
import { audioService } from '@/services/audioService';

interface TradingCardProps {
  character: TeamCharacter;
  size?: 'small' | 'medium' | 'large';
  showStats?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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
  rare: {
    borderGradient: 'from-blue-400 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100',
    glowColor: 'shadow-blue-300/50',
    stars: 2,
    rarityColor: 'text-blue-600'
  },
  epic: {
    borderGradient: 'from-purple-400 to-purple-600',
    bgGradient: 'from-purple-50 to-purple-100',
    glowColor: 'shadow-purple-300/50',
    stars: 3,
    rarityColor: 'text-purple-600'
  },
  legendary: {
    borderGradient: 'from-yellow-400 to-orange-500',
    bgGradient: 'from-yellow-50 to-orange-100',
    glowColor: 'shadow-yellow-300/50',
    stars: 4,
    rarityColor: 'text-orange-600'
  },
  mythic: {
    borderGradient: 'from-red-500 via-pink-500 to-purple-500',
    bgGradient: 'from-red-50 to-purple-100',
    glowColor: 'shadow-pink-300/50',
    stars: 5,
    rarityColor: 'text-red-600'
  }
};

const sizeConfig = {
  small: {
    container: 'w-48 h-72',
    avatar: 'text-6xl',
    name: 'text-sm',
    level: 'text-xs',
    stats: 'text-xs',
    padding: 'p-2'
  },
  medium: {
    container: 'w-64 h-96',
    avatar: 'text-8xl',
    name: 'text-base',
    level: 'text-sm',
    stats: 'text-sm',
    padding: 'p-3'
  },
  large: {
    container: 'w-80 h-[30rem]',
    avatar: 'text-9xl',
    name: 'text-lg',
    level: 'text-base',
    stats: 'text-base',
    padding: 'p-4'
  }
};

const archetypeIcons = {
  warrior: '⚔️',
  mage: '🔮',
  trickster: '🃏',
  beast: '🐺',
  leader: '👑',
  detective: '🔍',
  monster: '👹',
  alien: '👽',
  mercenary: '🗡️',
  cowboy: '🤠',
  biker: '🏍️'
};

export default function TradingCard({ 
  character, 
  size = 'medium',
  showStats = true,
  isHovered = false,
  isSelected = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = ''
}: TradingCardProps) {
  const rarity = rarityConfig[character.rarity];
  const sizing = sizeConfig[size];
  const mentalHealthLevel = getMentalHealthLevel(character.psychStats.mentalHealth);
  
  const cardVariants = {
    idle: { 
      rotateY: 0, 
      scale: 1,
      boxShadow: `0 4px 12px rgba(0,0,0,0.15)`
    },
    hover: { 
      rotateY: 5, 
      scale: 1.05,
      boxShadow: `0 8px 25px rgba(0,0,0,0.25)`
    },
    selected: {
      rotateY: 0,
      scale: 1.02,
      boxShadow: `0 0 0 3px #3b82f6, 0 8px 25px rgba(59,130,246,0.3)`
    }
  };

  const getAnimationState = () => {
    if (isSelected) return 'selected';
    if (isHovered) return 'hover';
    return 'idle';
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rarity.stars 
            ? `${rarity.rarityColor} fill-current` 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderStatBar = (value: number, max: number = 100, color: string) => (
    <div className="flex items-center gap-1">
      <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        />
      </div>
      <span className={`${sizing.stats} font-medium text-gray-700 min-w-[2rem]`}>
        {value}
      </span>
    </div>
  );

  const getMentalHealthColor = () => {
    switch (mentalHealthLevel) {
      case 'stable': return 'text-green-600';
      case 'stressed': return 'text-yellow-600';
      case 'troubled': return 'text-orange-600';
      case 'crisis': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <motion.div
      className={`
        ${sizing.container}
        relative cursor-pointer select-none
        bg-gradient-to-br ${rarity.bgGradient}
        rounded-xl overflow-hidden
        border-2 bg-gradient-to-r ${rarity.borderGradient}
        transform-gpu perspective-1000
        ${className}
      `}
      variants={cardVariants}
      animate={getAnimationState()}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        audioService.playSoundEffect('character_select');
        onClick?.();
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: `linear-gradient(135deg, ${rarity.bgGradient.replace('from-', '').replace('to-', '')})`,
        borderImage: `linear-gradient(135deg, ${rarity.borderGradient.replace('from-', '').replace('to-', '')}) 1`
      }}
    >
      {/* Holographic shine effect */}
      <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none" />
      
      {/* Card Header */}
      <div className={`${sizing.padding} pb-1`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            {renderStars()}
          </div>
          <div className={`${sizing.level} ${rarity.rarityColor} font-bold bg-white/80 px-2 py-0.5 rounded-full`}>
            LV.{character.level}
          </div>
        </div>
        
        <h3 className={`${sizing.name} font-bold text-gray-800 leading-tight`}>
          {character.name}
        </h3>
        
        <div className="flex items-center gap-1 mt-1">
          <span className="text-lg">{archetypeIcons[character.archetype]}</span>
          <span className={`${sizing.stats} text-gray-600 capitalize`}>
            {character.archetype}
          </span>
        </div>
      </div>

      {/* Character Avatar */}
      <div className="relative flex-1 flex items-center justify-center bg-gradient-to-b from-white/50 to-transparent">
        <div className={`${sizing.avatar} drop-shadow-lg`}>
          {character.avatar}
        </div>
        
        {/* Level badge overlay */}
        <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-sm rounded-full p-1">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${rarity.borderGradient} flex items-center justify-center`}>
            <span className="text-white font-bold text-xs">{character.level}</span>
          </div>
        </div>

        {/* Mental health indicator */}
        <div className="absolute top-2 left-2">
          <div className={`flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1`}>
            <Brain className={`w-3 h-3 ${getMentalHealthColor()}`} />
            <span className={`${sizing.stats} ${getMentalHealthColor()} font-medium`}>
              {character.psychStats.mentalHealth}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {showStats && (
        <div className={`${sizing.padding} pt-2 bg-white/60 backdrop-blur-sm`}>
          <div className="space-y-1">
            {/* Traditional Combat Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-red-500" />
                <span className={`${sizing.stats} text-gray-600 text-xs`}>STR</span>
                {renderStatBar(character.traditionalStats.strength, 100, 'bg-red-400')}
              </div>
              
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-green-500" />
                <span className={`${sizing.stats} text-gray-600 text-xs`}>VIT</span>
                {renderStatBar(character.traditionalStats.vitality, 100, 'bg-green-400')}
              </div>
              
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-500" />
                <span className={`${sizing.stats} text-gray-600 text-xs`}>SPD</span>
                {renderStatBar(character.traditionalStats.speed, 100, 'bg-blue-400')}
              </div>
              
              <div className="flex items-center gap-1">
                <Brain className="w-3 h-3 text-purple-500" />
                <span className={`${sizing.stats} text-gray-600 text-xs`}>INT</span>
                {renderStatBar(character.traditionalStats.intelligence, 100, 'bg-purple-400')}
              </div>
            </div>

            {/* Psychological Stats */}
            <div className="border-t border-gray-300/50 pt-2 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  <span className={`${sizing.stats} text-gray-600 text-xs`}>EGO</span>
                  {renderStatBar(character.psychStats.ego, 100, 'bg-yellow-400')}
                </div>
                
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-green-500" />
                  <span className={`${sizing.stats} text-gray-600 text-xs`}>TEAM</span>
                  {renderStatBar(character.psychStats.teamPlayer, 100, 'bg-green-400')}
                </div>
                
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-blue-500" />
                  <span className={`${sizing.stats} text-gray-600 text-xs`}>COMM</span>
                  {renderStatBar(character.psychStats.communication, 100, 'bg-blue-400')}
                </div>
                
                <div className="flex items-center gap-1">
                  <Brain className="w-3 h-3 text-purple-500" />
                  <span className={`${sizing.stats} text-gray-600 text-xs`}>TRAIN</span>
                  {renderStatBar(character.psychStats.training, 100, 'bg-purple-400')}
                </div>
              </div>
            </div>

            {/* HP Bar */}
            <div className="border-t border-gray-300/50 pt-2">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <div className="flex-1">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                      style={{ width: `${(character.currentHp / character.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
                <span className={`${sizing.stats} font-bold text-gray-700`}>
                  {character.currentHp}/{character.maxHp}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none">
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}