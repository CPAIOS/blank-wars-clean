'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Star, Sparkles, RotateCcw, ShoppingCart } from 'lucide-react';
import { paymentAPI } from '../services/apiClient';
import { useRouter, useSearchParams } from 'next/navigation';

interface Card {
  id: string; // Changed to string for character ID
  name: string;
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'; // Added mythic
  avatar: string;
  isNew: boolean;
  serialNumber?: string; // Added serialNumber
  stats?: {
    attack: number;
    defense: number;
    speed: number;
  };
}

interface PackType {
  id: string;
  name: string;
  price: number;
  cardCount: number;
  guaranteed: string;
  avatar: string;
  gradient: string;
}

const PACK_TYPES: PackType[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: 2.99,
    cardCount: 5,
    guaranteed: '1 Guaranteed Uncommon',
    avatar: '📦',
    gradient: 'from-blue-600 to-purple-600'
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    price: 5.99,
    cardCount: 8,
    guaranteed: '1 Guaranteed Rare',
    avatar: '🎁',
    gradient: 'from-purple-600 to-pink-600'
  },
  {
    id: 'legendary',
    name: 'Legendary Pack',
    price: 12.99,
    cardCount: 10,
    guaranteed: '1 Guaranteed Epic',
    avatar: '👑',
    gradient: 'from-yellow-500 to-orange-500'
  }
];



const getRarityColor = (rarity: Card['rarity']) => {
  const colors = {
    common: 'border-gray-500 bg-gray-800',
    uncommon: 'border-green-500 bg-green-900/20',
    rare: 'border-blue-500 bg-blue-900/20',
    epic: 'border-purple-500 bg-purple-900/20',
    legendary: 'border-yellow-500 bg-yellow-900/20'
  };
  return colors[rarity];
};

const getRarityGlow = (rarity: Card['rarity']) => {
  const glows = {
    common: '',
    uncommon: 'shadow-lg shadow-green-500/25',
    rare: 'shadow-lg shadow-blue-500/25',
    epic: 'shadow-lg shadow-purple-500/25 animate-pulse',
    legendary: 'shadow-xl shadow-yellow-500/50 animate-pulse'
  };
  return glows[rarity];
};

export default function PackOpening() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPack, setSelectedPack] = useState<PackType | null>(null);
  const [phase, setPhase] = useState<'selection' | 'opening' | 'revealing' | 'summary'>('selection');
  const [cards, setCards] = useState<Card[]>([]);
  const [revealedCards, setRevealedCards] = useState<string[]>([]); // Changed to string for serialNumber
  const [packAnimating, setPackAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // In a real app, you'd verify the session server-side
      // For this demo, we'll just assume success and move to opening phase
      setPhase('opening');
      // You might want to fetch the pack details based on the session ID here
      // For now, we'll rely on the user selecting a pack again or having it in state
      router.replace('/pack-opening', undefined, { shallow: true }); // Clean URL
    }
  }, [searchParams, router]);

  const selectPack = async (pack: PackType) => {
    setSelectedPack(pack);
    setPhase('opening');

    try {
      const response = await paymentAPI.purchasePack(pack.id, 1); // Assuming quantity 1
      if (response.url) {
        router.push(response.url); // Redirect to Stripe Checkout
      } else {
        setError('Failed to get Stripe checkout URL.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate purchase.');
    }
  };

  const openPack = async () => {
    if (!selectedPack) return;
    
    setPackAnimating(true);
    setError(null);

    try {
      // In a real scenario, the backend would return the actual cards minted
      const fetchedCards = await paymentAPI.getMintedCards();
      setCards(fetchedCards.map((card: any) => ({
        id: card.character_id,
        name: card.character_name,
        title: '', // You might need to fetch this from a character database on the frontend
        rarity: card.character_rarity,
        avatar: '✨', // Placeholder, replace with actual avatar from character data
        isNew: true, // Assuming newly minted cards are always new
        serialNumber: card.serial_number,
        stats: { attack: 0, defense: 0, speed: 0 } // Placeholder, replace with actual stats
      })));
      
      setTimeout(() => {
        setPhase('revealing');
        setPackAnimating(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to open pack.');
      setPackAnimating(false);
    }
  };

  const revealCard = (serialNumber: string) => {
    if (revealedCards.includes(serialNumber)) return;
    
    setRevealedCards(prev => [...prev, serialNumber]);
    
    // If all cards revealed, show summary
    if (revealedCards.length + 1 === cards.length) {
      setTimeout(() => setPhase('summary'), 1000);
    }
  };

  const resetToSelection = () => {
    setSelectedPack(null);
    setPhase('selection');
    setCards([]);
    setRevealedCards([]);
    setPackAnimating(false);
    setError(null);
  };

  const openAnotherPack = () => {
    setPhase('selection');
    setCards([]);
    setRevealedCards([]);
    setPackAnimating(false);
    setError(null);
  };

  const calculateStats = () => {
    const totalCards = cards.length;
    const newCards = cards.filter(card => card.isNew).length;
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    let bestRarity: Card['rarity'] = 'common';
    
    cards.forEach(card => {
      if (rarities.indexOf(card.rarity) > rarities.indexOf(bestRarity)) {
        bestRarity = card.rarity;
      }
    });
    
    return { totalCards, newCards, bestRarity };
  };

  return (
    <div className="max-w-6xl mx-auto">
      {error && <div className="text-red-500 text-center mb-4">Error: {error}</div>}
      <AnimatePresence mode="wait">
        {/* Pack Selection */}
        {phase === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4 text-white">Choose Your Pack</h2>
              <p className="text-gray-300">Each pack contains legendary warriors waiting to join your collection!</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PACK_TYPES.map((pack) => (
                <motion.div
                  key={pack.id}
                  onClick={() => selectPack(pack)}
                  className="bg-black/40 rounded-xl p-6 border-2 border-gray-700 hover:border-purple-500 cursor-pointer transition-all backdrop-blur-sm"
                  whileHover={{ scale: 1.05, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className={`w-32 h-40 mx-auto mb-4 bg-gradient-to-br ${pack.gradient} rounded-lg flex items-center justify-center text-6xl shadow-lg`}>
                    {pack.avatar}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{pack.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{pack.cardCount} Cards • {pack.guaranteed}</p>
                  <p className="text-2xl font-bold text-green-400">${pack.price}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pack Opening */}
        {phase === 'opening' && selectedPack && (
          <motion.div
            key="opening"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-8 text-white">{selectedPack.name}</h2>
            
            <motion.div
              className={`w-48 h-64 mx-auto mb-8 bg-gradient-to-br ${selectedPack.gradient} rounded-xl flex items-center justify-center text-8xl shadow-2xl cursor-pointer`}
              animate={packAnimating ? { 
                rotateY: 360, 
                scale: [1, 1.2, 0] 
              } : {}}
              transition={{ duration: 2 }}
              onClick={openPack}
            >
              {selectedPack.avatar}
            </motion.div>
            
            {!packAnimating && (
              <motion.button
                onClick={openPack}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-4 px-8 rounded-full text-xl transition-all shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Package className="w-6 h-6 inline mr-2" />
                OPEN PACK!
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Card Revealing */}
        {phase === 'revealing' && (
          <motion.div
            key="revealing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center text-white">Your Cards!</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {cards.map((card, index) => (
                <motion.div
                  key={card.serialNumber || card.id} // Use serialNumber as key
                  initial={{ opacity: 0, y: 50, rotateY: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  <motion.div
                    className={`w-full h-64 rounded-lg cursor-pointer transition-all ${getRarityColor(card.rarity)} ${getRarityGlow(card.rarity)}`}
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: revealedCards.includes(card.serialNumber || '') ? 180 : 0 }}
                    transition={{ duration: 0.8 }}
                    onClick={() => revealCard(card.serialNumber || '')}
                  >
                    {/* Card Back */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border-2 border-purple-500 flex items-center justify-center backface-hidden">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎴</div>
                        <div className="text-sm text-gray-300">Click to reveal!</div>
                      </div>
                    </div>
                    
                    {/* Card Front */}
                    <div 
                      className={`absolute inset-0 w-full h-full rounded-lg border-2 p-4 backface-hidden flex flex-col ${getRarityColor(card.rarity)}`}
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      {card.isNew && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          NEW!
                        </div>
                      )}
                      
                      <div className="text-4xl mb-2 text-center">{card.avatar}</div>
                      <div className="text-sm font-bold text-white text-center mb-1">{card.name}</div>
                      <div className="text-xs text-gray-300 text-center mb-3">{card.title}</div>
                      
                      {card.stats && (
                        <div className="text-xs text-gray-300 space-y-1 flex-1">
                          <div>ATK: {card.stats.attack}</div>
                          <div>DEF: {card.stats.defense}</div>
                          <div>SPD: {card.stats.speed}</div>
                        </div>
                      )}
                      
                      <div className={`text-xs font-bold uppercase text-center py-1 px-2 rounded ${card.rarity === 'legendary' ? 'bg-yellow-600' : card.rarity === 'epic' ? 'bg-purple-600' : card.rarity === 'rare' ? 'bg-blue-600' : card.rarity === 'uncommon' ? 'bg-green-600' : 'bg-gray-600'}`}>
                        {card.rarity}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Summary */}
        {phase === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
          >
            <div className="bg-black/40 rounded-xl p-8 backdrop-blur-sm border border-gray-700">
              <h2 className="text-3xl font-bold mb-6 text-white">Pack Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {(() => {
                  const stats = calculateStats();
                  return (
                    <>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-purple-400">{stats.totalCards}</div>
                        <div className="text-gray-400">Total Cards</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-400">{stats.newCards}</div>
                        <div className="text-gray-400">New Cards</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-yellow-400 capitalize">{stats.bestRarity}</div>
                        <div className="text-gray-400">Best Pull</div>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              <div className="flex justify-center gap-4">
                <motion.button
                  onClick={openAnotherPack}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold py-3 px-6 rounded-full transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Package className="w-5 h-5 inline mr-2" />
                  Open Another Pack!
                </motion.button>
                
                <motion.button
                  onClick={resetToSelection}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-full transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw className="w-5 h-5 inline mr-2" />
                  Back to Packs
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}