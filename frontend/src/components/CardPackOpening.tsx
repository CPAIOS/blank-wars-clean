'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TradingCard from './TradingCard';
import { TeamCharacter } from '@/data/teamBattleSystem';
import { Sparkles, Gift, X, Star, Zap } from 'lucide-react';
import { packService, PackClaimResult } from '@/services/packService';
import { characterTemplates } from '@/data/characters';

interface CardPack {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  price: number;
  guaranteedRarity?: 'rare' | 'epic' | 'legendary';
  packArt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface CardPackOpeningProps {
  isOpen: boolean;
  onClose: () => void;
  onCardsReceived: (cards: TeamCharacter[]) => void;
  availableCards: TeamCharacter[];
  playerCurrency: number;
  onCurrencySpent: (amount: number) => void;
  onEchoesReceived?: (echoes: { character_id: string; count: number }[]) => void;
}

const CARD_PACKS: CardPack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    description: 'Perfect for beginners. 3 cards with guaranteed rare.',
    cardCount: 3,
    price: 100,
    guaranteedRarity: 'rare',
    packArt: '📦',
    rarity: 'common'
  },
  {
    id: 'warrior',
    name: 'Warrior Pack',
    description: 'Combat-focused characters. 5 cards with guaranteed epic.',
    cardCount: 5,
    price: 250,
    guaranteedRarity: 'epic',
    packArt: '⚔️',
    rarity: 'rare'
  },
  {
    id: 'legendary',
    name: 'Legendary Pack',
    description: 'Premium collection. 7 cards with guaranteed legendary.',
    cardCount: 7,
    price: 500,
    guaranteedRarity: 'legendary',
    packArt: '👑',
    rarity: 'epic'
  },
  {
    id: 'mythic',
    name: 'Mythic Pack',
    description: 'Ultimate collection. 10 cards with multiple legendaries.',
    cardCount: 10,
    price: 1000,
    guaranteedRarity: 'legendary',
    packArt: '🌟',
    rarity: 'legendary'
  }
];

const RARITY_WEIGHTS = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 4,
  mythic: 1
};

export default function CardPackOpening({
  isOpen,
  onClose,
  onCardsReceived,
  availableCards,
  playerCurrency,
  onCurrencySpent,
  onEchoesReceived
}: CardPackOpeningProps) {
  const [selectedPack, setSelectedPack] = useState<CardPack | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [revealedCards, setRevealedCards] = useState<TeamCharacter[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showPackAnimation, setShowPackAnimation] = useState(false);
  const [echoesGained, setEchoesGained] = useState<{ character_id: string; count: number }[]>([]);
  const [showingEchoes, setShowingEchoes] = useState(false);

  const getCharacterFromTemplate = (characterId: string): TeamCharacter | null => {
    const template = characterTemplates[characterId];
    if (!template) return null;
    
    return {
      id: characterId,
      name: template.name,
      archetype: template.archetype,
      rarity: template.rarity,
      health: template.baseStats.health,
      attack: template.baseStats.attack,
      defense: template.baseStats.defense,
      speed: template.baseStats.speed,
      abilities: template.abilities,
      psychologyProfile: template.psychologyProfile,
      equipment: template.equipment || [],
      level: 1,
      experience: 0
    };
  };

  const handlePackPurchase = async (pack: CardPack) => {
    if (playerCurrency < pack.price) return;
    
    setSelectedPack(pack);
    setShowPackAnimation(true);
    onCurrencySpent(pack.price);
    
    try {
      // Generate pack via backend
      const packType = packService.mapPackIdToType(pack.id);
      const generateResult = await packService.generatePack(packType);
      
      // Claim the pack immediately
      const claimResult = await packService.claimPack(generateResult.claimToken);
      
      // Convert character IDs to TeamCharacter objects
      const newCards: TeamCharacter[] = [];
      for (const charId of claimResult.grantedCharacters) {
        const character = getCharacterFromTemplate(charId);
        if (character) {
          newCards.push(character);
        }
      }
      
      setRevealedCards(newCards);
      setEchoesGained(claimResult.echoesGained);
      
      // If we received echoes, show them after cards
      if (claimResult.echoesGained.length > 0 && onEchoesReceived) {
        onEchoesReceived(claimResult.echoesGained);
      }
      
      setTimeout(() => {
        setIsOpening(true);
        setShowPackAnimation(false);
      }, 1500);
    } catch (error) {
      console.error('Error purchasing pack:', error);
      // On error, reset the purchase
      setSelectedPack(null);
      setShowPackAnimation(false);
      // Refund the currency (this is a simple approach)
      onCurrencySpent(-pack.price);
    }
  };

  const handleCardReveal = () => {
    if (currentCardIndex < revealedCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else if (echoesGained.length > 0 && !showingEchoes) {
      // Show echoes after all cards are revealed
      setShowingEchoes(true);
    } else {
      // All cards and echoes revealed
      onCardsReceived(revealedCards);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedPack(null);
    setIsOpening(false);
    setRevealedCards([]);
    setCurrentCardIndex(0);
    setShowPackAnimation(false);
    setEchoesGained([]);
    setShowingEchoes(false);
    onClose();
  };

  const getPackRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Card Packs</h2>
                <p className="text-purple-100">
                  Currency: {playerCurrency} coins
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Pack Animation */}
          <AnimatePresence>
            {showPackAnimation && selectedPack && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-60"
              >
                <motion.div
                  initial={{ scale: 0.5, rotateY: 0 }}
                  animate={{ 
                    scale: [0.5, 1.2, 1],
                    rotateY: [0, 360],
                    transition: { duration: 1.5 }
                  }}
                  className="text-center"
                >
                  <div className={`text-8xl mb-4 filter drop-shadow-lg`}>
                    {selectedPack.packArt}
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {selectedPack.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                    <span className="text-xl text-yellow-400">Opening...</span>
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card Reveal */}
          <AnimatePresence>
            {isOpening && revealedCards.length > 0 && !showingEchoes && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center z-60"
              >
                <div className="text-center">
                  <motion.div
                    key={currentCardIndex}
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ 
                      scale: 1, 
                      rotateY: 0,
                      transition: { type: "spring", stiffness: 100 }
                    }}
                    className="mb-8"
                  >
                    <TradingCard
                      character={revealedCards[currentCardIndex]}
                      size="large"
                      showStats={true}
                    />
                  </motion.div>

                  <div className="text-white mb-4">
                    <h3 className="text-2xl font-bold mb-2">
                      {revealedCards[currentCardIndex].name}
                    </h3>
                    <div className="flex items-center justify-center gap-1 mb-4">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < (revealedCards[currentCardIndex].rarity === 'mythic' ? 5 :
                                 revealedCards[currentCardIndex].rarity === 'legendary' ? 4 :
                                 revealedCards[currentCardIndex].rarity === 'epic' ? 3 :
                                 revealedCards[currentCardIndex].rarity === 'rare' ? 2 : 1)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-500'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-lg text-gray-300 capitalize">
                      {revealedCards[currentCardIndex].rarity} {revealedCards[currentCardIndex].archetype}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleCardReveal}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                    >
                      {currentCardIndex < revealedCards.length - 1 ? 'Next Card' : 
                       echoesGained.length > 0 ? 'View Echoes' : 'Finish'}
                    </button>
                  </div>

                  <div className="mt-4 text-gray-400">
                    Card {currentCardIndex + 1} of {revealedCards.length}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Echo Display */}
          <AnimatePresence>
            {isOpening && showingEchoes && echoesGained.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 flex items-center justify-center z-60"
              >
                <div className="text-center max-w-2xl mx-auto p-8">
                  <motion.div
                    initial={{ scale: 0, y: 50 }}
                    animate={{ 
                      scale: 1, 
                      y: 0,
                      transition: { type: "spring", stiffness: 100 }
                    }}
                    className="mb-8"
                  >
                    <div className="flex items-center justify-center mb-4">
                      <Zap className="w-16 h-16 text-yellow-400 animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-4">
                      Character Echoes Received!
                    </h2>
                    <p className="text-xl text-amber-200 mb-8">
                      You already own these characters, so they've been converted to powerful Echoes!
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {echoesGained.map((echo, index) => {
                      const character = getCharacterFromTemplate(echo.character_id);
                      return (
                        <motion.div
                          key={echo.character_id}
                          initial={{ scale: 0, rotateX: 90 }}
                          animate={{ 
                            scale: 1, 
                            rotateX: 0,
                            transition: { 
                              delay: index * 0.2,
                              type: "spring", 
                              stiffness: 100 
                            }
                          }}
                          className="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-6"
                        >
                          <div className="flex items-center justify-center mb-3">
                            <Zap className="w-8 h-8 text-yellow-400 mr-2" />
                            <span className="text-2xl font-bold text-white">
                              {echo.count}x
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {character?.name || 'Unknown Character'}
                          </h3>
                          <p className="text-amber-200 text-sm">
                            {character?.archetype} Echo{echo.count > 1 ? 's' : ''}
                          </p>
                          <div className="mt-3 text-xs text-amber-300">
                            Use to ascend or upgrade abilities!
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleCardReveal}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                    >
                      Finish
                    </button>
                  </div>

                  <div className="mt-4 text-amber-300">
                    Echoes gained from duplicate characters
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pack Selection */}
          {!selectedPack && !isOpening && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CARD_PACKS.map((pack) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className={`
                    relative overflow-hidden rounded-xl shadow-lg cursor-pointer
                    ${playerCurrency >= pack.price ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}
                  `}
                  onClick={() => playerCurrency >= pack.price && handlePackPurchase(pack)}
                >
                  <div className={`bg-gradient-to-br ${getPackRarityColor(pack.rarity)} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-4xl">{pack.packArt}</div>
                      <div className="text-2xl font-bold">{pack.price} 💰</div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{pack.name}</h3>
                    <p className="text-white/90 mb-4">{pack.description}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>{pack.cardCount} cards</span>
                      {pack.guaranteedRarity && (
                        <span className="bg-white/20 px-2 py-1 rounded-full">
                          Guaranteed {pack.guaranteedRarity}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {playerCurrency < pack.price && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="bg-black/80 text-white px-4 py-2 rounded-lg">
                        Need {pack.price - playerCurrency} more coins
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}