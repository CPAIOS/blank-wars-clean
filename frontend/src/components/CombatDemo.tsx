'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sword, Zap, Heart, MessageCircle, Sparkles, Package } from 'lucide-react';

interface Ability {
  name: string;
  type: 'attack' | 'defense' | 'special';
  power: number;
  cooldown: number;
  currentCooldown: number;
  description: string;
  icon: string;
}

interface Item {
  name: string;
  type: 'healing' | 'boost' | 'special';
  effect: string;
  icon: string;
  description: string;
}

interface Character {
  name: string;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  abilities: Ability[];
  items: Item[];
  avatar: string;
  selectedAction?: { type: 'ability' | 'item'; index: number };
}

interface BattleAction {
  round: number;
  attacker: string;
  defender: string;
  action: string;
  damage: number;
  effect?: string;
  description: string;
}

interface GameState {
  round: number;
  phase: 'strategy' | 'action_select' | 'combat' | 'chat' | 'results';
  combatActive: boolean;
  selectedStrategy: string | null;
  player1: Character;
  player2: Character;
  battleLog: BattleAction[];
  currentAction?: BattleAction;
  winner?: string;
}

interface ChatOption {
  text: string;
  type: 'aggressive' | 'defensive' | 'tactical' | 'encouraging';
  effect?: string;
}

export default function CombatDemo() {
  const [gameState, setGameState] = useState<GameState>({
    round: 1,
    phase: 'strategy',
    combatActive: false,
    selectedStrategy: null,
    player1: {
      name: 'Achilles',
      maxHp: 100,
      hp: 100,
      atk: 85,
      def: 70,
      spd: 95,
      abilities: [
        { name: 'Spear Thrust', type: 'attack', power: 80, cooldown: 0, currentCooldown: 0, description: 'Powerful spear attack', icon: '🗡️' },
        { name: 'Shield Bash', type: 'defense', power: 60, cooldown: 2, currentCooldown: 0, description: 'Defensive counter-attack', icon: '🛡️' },
        { name: 'Rage of Achilles', type: 'special', power: 120, cooldown: 4, currentCooldown: 0, description: 'Berserker rage mode', icon: '⚡' },
        { name: 'Invulnerable Stance', type: 'defense', power: 0, cooldown: 5, currentCooldown: 0, description: 'Temporary invulnerability', icon: '✨' }
      ],
      items: [],
      avatar: '⚔️'
    },
    player2: {
      name: 'Merlin',
      maxHp: 80,
      hp: 80,
      atk: 95,
      def: 50,
      spd: 75,
      abilities: [
        { name: 'Fireball', type: 'attack', power: 90, cooldown: 1, currentCooldown: 0, description: 'Magic fire projectile', icon: '🔥' },
        { name: 'Ice Shield', type: 'defense', power: 70, cooldown: 3, currentCooldown: 0, description: 'Magical ice protection', icon: '❄️' },
        { name: 'Lightning Bolt', type: 'attack', power: 110, cooldown: 3, currentCooldown: 0, description: 'Devastating lightning strike', icon: '⚡' },
        { name: 'Time Warp', type: 'special', power: 0, cooldown: 6, currentCooldown: 0, description: 'Manipulate time flow', icon: '🕐' }
      ],
      items: [],
      avatar: '🧙'
    },
    battleLog: []
  });

  const [combatLog, setCombatLog] = useState<string[]>([
    '⚔️ Battle Start! Achilles vs Merlin',
    'Choose your strategy and begin the battle!'
  ]);

  const [showChat, setShowChat] = useState(false);
  const [chatPreview, setChatPreview] = useState<string>('');

  const selectStrategy = (strategy: string) => {
    setGameState(prev => ({ ...prev, selectedStrategy: strategy }));
    addLog(`📋 Strategy selected: ${strategy.charAt(0).toUpperCase() + strategy.slice(1)}`);
  };

  const addLog = (message: string) => {
    setCombatLog(prev => [...prev, message]);
  };

  const startBattle = async () => {
    if (!gameState.selectedStrategy) {
      alert('Please select a strategy first!');
      return;
    }

    setGameState(prev => ({ ...prev, combatActive: true }));
    addLog(`⚔️ Round ${gameState.round} begins!`);

    // Simulate combat with delays
    setTimeout(() => executeAttack('player1'), 500);
    setTimeout(() => executeAttack('player2'), 1500);
    setTimeout(() => checkBattleEnd(), 2500);
  };

  const executeAttack = (attacker: 'player1' | 'player2') => {
    const attackingChar = gameState[attacker];
    const defendingChar = attacker === 'player1' ? gameState.player2 : gameState.player1;
    
    const damage = Math.round((attackingChar.atk - defendingChar.def * 0.5) * (0.8 + Math.random() * 0.4));
    const finalDamage = Math.max(5, damage);
    
    const ability = attackingChar.abilities[Math.floor(Math.random() * attackingChar.abilities.length)];
    
    setGameState(prev => ({
      ...prev,
      [attacker === 'player1' ? 'player2' : 'player1']: {
        ...defendingChar,
        hp: Math.max(0, defendingChar.hp - finalDamage)
      }
    }));

    addLog(`⚔️ ${attackingChar.name} uses ${ability} for ${finalDamage} damage!`);
  };

  const checkBattleEnd = () => {
    if (gameState.player1.hp <= 0 || gameState.player2.hp <= 0) {
      const winner = gameState.player1.hp > 0 ? gameState.player1.name : gameState.player2.name;
      addLog(`🏆 ${winner} wins the battle!`);
    } else if (gameState.round >= 3) {
      const winner = gameState.player1.hp > gameState.player2.hp ? gameState.player1.name : gameState.player2.name;
      addLog(`🏆 ${winner} wins the battle!`);
    } else {
      enterChatPhase();
    }
  };

  const enterChatPhase = () => {
    setGameState(prev => ({ 
      ...prev, 
      round: prev.round + 1, 
      phase: 'chat',
      combatActive: false 
    }));
    setShowChat(true);
    addLog(`💬 Chat break! Talk to your warrior...`);
    
    const messages = [
      "That wizard&apos;s magic stings! But I&apos;ve faced worse at Troy.",
      "Their defenses are weak - I can exploit that next round!",
      "Ha! Is that the best they can do? My shield has weathered stronger storms.",
      "I feel the rage building... shall I unleash it next round?"
    ];
    
    setTimeout(() => {
      const message = messages[Math.floor(Math.random() * messages.length)];
      setChatPreview(`Achilles: "${message}"`);
    }, 1000);
  };

  const continueFromChat = () => {
    setShowChat(false);
    setChatPreview('');
    setGameState(prev => ({ 
      ...prev, 
      phase: 'strategy',
      selectedStrategy: null 
    }));
    addLog("💪 Achilles feels inspired by your words! (+5% to next attack)");
  };

  const resetBattle = () => {
    setGameState({
      round: 1,
      phase: 'strategy',
      combatActive: false,
      selectedStrategy: null,
      player1: { ...gameState.player1, hp: gameState.player1.maxHp },
      player2: { ...gameState.player2, hp: gameState.player2.maxHp },
      battleLog: []
    });
    setCombatLog([
      '⚔️ Battle Start! Achilles vs Merlin',
      'Choose your strategy and begin the battle!'
    ]);
    setShowChat(false);
    setChatPreview('');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div 
        className="bg-black/40 rounded-xl p-8 backdrop-blur-sm border border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Battle Arena */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Player 1 */}
          <motion.div 
            className={`bg-gray-800/50 rounded-lg p-6 border-2 transition-all ${
              gameState.combatActive ? 'border-green-500 shadow-lg shadow-green-500/25' : 'border-gray-600'
            }`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">{gameState.player1.avatar}</div>
              <h3 className="text-xl font-bold text-white">{gameState.player1.name}</h3>
            </div>
            
            <div className="space-y-3">
              {/* Health Bar */}
              <div className="bg-gray-700 rounded-full p-1">
                <motion.div 
                  className="bg-gradient-to-r from-red-500 to-red-400 rounded-full h-5 flex items-center justify-center text-white text-sm font-bold"
                  style={{ width: `${(gameState.player1.hp / gameState.player1.maxHp) * 100}%` }}
                  layoutId="p1-health"
                >
                  HP: {gameState.player1.hp}/{gameState.player1.maxHp}
                </motion.div>
              </div>
              
              <div className="text-sm text-gray-300">
                ATK: {gameState.player1.atk} | DEF: {gameState.player1.def} | SPD: {gameState.player1.spd}
              </div>
              <div className="text-xs text-purple-400">Level 5 Epic Warrior</div>
            </div>
          </motion.div>

          {/* VS Indicator */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">VS</div>
            <div className="text-lg text-gray-300">Round {gameState.round}</div>
          </div>

          {/* Player 2 */}
          <motion.div 
            className="bg-gray-800/50 rounded-lg p-6 border-2 border-gray-600"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">{gameState.player2.avatar}</div>
              <h3 className="text-xl font-bold text-white">{gameState.player2.name}</h3>
            </div>
            
            <div className="space-y-3">
              {/* Health Bar */}
              <div className="bg-gray-700 rounded-full p-1">
                <motion.div 
                  className="bg-gradient-to-r from-red-500 to-red-400 rounded-full h-5 flex items-center justify-center text-white text-sm font-bold"
                  style={{ width: `${(gameState.player2.hp / gameState.player2.maxHp) * 100}%` }}
                  layoutId="p2-health"
                >
                  HP: {gameState.player2.hp}/{gameState.player2.maxHp}
                </motion.div>
              </div>
              
              <div className="text-sm text-gray-300">
                ATK: {gameState.player2.atk} | DEF: {gameState.player2.def} | SPD: {gameState.player2.spd}
              </div>
              <div className="text-xs text-blue-400">Level 6 Legendary Wizard</div>
            </div>
          </motion.div>
        </div>

        {/* Strategy Panel */}
        {gameState.phase === 'strategy' && (
          <motion.div 
            className="bg-gray-800/30 rounded-lg p-6 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className="text-lg font-bold mb-4 text-white">Choose Your Strategy:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'aggressive', icon: Sword, label: 'Aggressive', desc: '+20% ATK, -10% DEF' },
                { id: 'defensive', icon: Shield, label: 'Defensive', desc: '+20% DEF, -10% ATK' },
                { id: 'balanced', icon: Heart, label: 'Balanced', desc: 'No modifiers' }
              ].map((strategy) => {
                const Icon = strategy.icon;
                return (
                  <motion.button
                    key={strategy.id}
                    onClick={() => selectStrategy(strategy.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      gameState.selectedStrategy === strategy.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-gray-600 bg-gray-700/50 hover:border-purple-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-bold">{strategy.label}</div>
                    <div className="text-sm text-gray-400">{strategy.desc}</div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Combat Log */}
        <div className="bg-black/50 rounded-lg p-4 h-48 overflow-y-auto mb-6 font-mono text-sm">
          {combatLog.map((entry, index) => (
            <motion.div 
              key={index}
              className="mb-2 border-l-2 border-green-500 pl-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {entry}
            </motion.div>
          ))}
        </div>

        {/* Chat Preview */}
        {showChat && chatPreview && (
          <motion.div 
            className="bg-blue-900/30 border-2 border-blue-500 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="font-italic text-center">
              <strong>{chatPreview}</strong>
              <br />
              <em className="text-sm text-gray-400">Click &apos;Chat with Achilles&apos; to respond and build your bond!</em>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!showChat ? (
            <motion.button
              onClick={startBattle}
              disabled={!gameState.selectedStrategy || gameState.combatActive}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-bold py-3 px-8 rounded-full transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {gameState.round === 1 ? 'Start Battle' : `Start Round ${gameState.round}`}
            </motion.button>
          ) : (
            <motion.button
              onClick={continueFromChat}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 px-8 rounded-full transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Chat with Achilles
            </motion.button>
          )}
          
          <motion.button
            onClick={resetBattle}
            className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-bold py-3 px-8 rounded-full transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Reset Battle
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}