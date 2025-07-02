'use client';

import { useState, useEffect, useRef } from 'react';
import { Sword, Shield, Heart, Zap } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface BattleCharacter {
  id: string;
  name: string;
  avatar: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
}

interface BattleState {
  phase: 'setup' | 'battle' | 'finished';
  currentRound: number;
  winner: string | null;
  playerTeam: BattleCharacter[];
  opponentTeam: BattleCharacter[];
}

const SAMPLE_CHARACTERS: BattleCharacter[] = [
  { id: '1', name: 'Achilles', avatar: '⚔️', health: 100, maxHealth: 100, attack: 85, defense: 70 },
  { id: '2', name: 'Merlin', avatar: '🔮', health: 80, maxHealth: 80, attack: 95, defense: 60 },
  { id: '3', name: 'Cleopatra', avatar: '👑', health: 90, maxHealth: 90, attack: 75, defense: 80 },
];

export default function SimpleBattleArena() {
  const [battleState, setBattleState] = useState<BattleState>({
    phase: 'setup',
    currentRound: 1,
    winner: null,
    playerTeam: [SAMPLE_CHARACTERS[0]],
    opponentTeam: [SAMPLE_CHARACTERS[1]]
  });
  
  const [battleLog, setBattleLog] = useState<string[]>([
    'Welcome to the Battle Arena!',
    'Select your strategy and begin the fight!'
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection using stable patterns from SimpleChatDemo
  useEffect(() => {
    const socketUrl = 'https://blank-wars-demo-3.onrender.com';
    console.log('🔌 Connecting to battle server:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Battle socket connected');
    });

    socketRef.current.on('battle_update', (data: any) => {
      console.log('📨 Battle update:', data);
      
      if (data.battleState) {
        setBattleState(data.battleState);
      }
      
      if (data.logMessage) {
        setBattleLog(prev => [...prev, data.logMessage]);
      }
      
      setIsProcessing(false);
    });

    socketRef.current.on('battle_error', (error: any) => {
      console.error('❌ Battle error:', error);
      setBattleLog(prev => [...prev, `Error: ${error.message || 'Unknown battle error'}`]);
      setIsProcessing(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Auto-scroll battle log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  const startBattle = () => {
    if (!socketRef.current?.connected) {
      setBattleLog(prev => [...prev, 'Not connected to battle server']);
      return;
    }

    setBattleState(prev => ({ ...prev, phase: 'battle' }));
    setBattleLog(prev => [...prev, `Battle begins! ${battleState.playerTeam[0].name} vs ${battleState.opponentTeam[0].name}`]);
    setIsProcessing(true);

    // Send battle start event
    socketRef.current.emit('start_battle', {
      playerTeam: battleState.playerTeam,
      opponentTeam: battleState.opponentTeam,
      battleType: 'simple'
    });

    // Safety timeout
    setTimeout(() => {
      if (isProcessing) {
        console.log('⏰ Battle timeout - resetting');
        setIsProcessing(false);
      }
    }, 15000);
  };

  const performAction = (action: 'attack' | 'defend' | 'special') => {
    if (!socketRef.current?.connected || isProcessing) return;

    setIsProcessing(true);
    setBattleLog(prev => [...prev, `${battleState.playerTeam[0].name} performs ${action}!`]);

    socketRef.current.emit('battle_action', {
      action,
      character: battleState.playerTeam[0],
      round: battleState.currentRound
    });

    // Safety timeout
    setTimeout(() => {
      if (isProcessing) {
        console.log('⏰ Action timeout - resetting');
        setIsProcessing(false);
      }
    }, 10000);
  };

  const resetBattle = () => {
    setBattleState({
      phase: 'setup',
      currentRound: 1,
      winner: null,
      playerTeam: [SAMPLE_CHARACTERS[0]],
      opponentTeam: [SAMPLE_CHARACTERS[1]]
    });
    setBattleLog(['Welcome to the Battle Arena!', 'Select your strategy and begin the fight!']);
    setIsProcessing(false);
  };

  const getHealthPercentage = (character: BattleCharacter) => {
    return (character.health / character.maxHealth) * 100;
  };

  return (
    <div className="max-w-6xl mx-auto bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sword className="w-8 h-8 text-red-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Simple Battle Arena</h2>
              <p className="text-gray-400">Round {battleState.currentRound} • Phase: {battleState.phase}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Status: {socketRef.current?.connected ? '🟢 Connected' : '🔴 Disconnected'} | 
            {isProcessing ? ' ⏳ Processing...' : ' ✅ Ready'}
          </div>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Player Team */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-blue-400">Your Team</h3>
          {battleState.playerTeam.map((character) => (
            <div key={character.id} className="bg-blue-900/30 border-2 border-blue-500 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">{character.avatar}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-white">{character.name}</h4>
                  <div className="text-sm text-gray-300">
                    ATK: {character.attack} • DEF: {character.defense}
                  </div>
                </div>
              </div>
              
              {/* Health Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Health</span>
                  <span>{character.health}/{character.maxHealth}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${getHealthPercentage(character)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Battle Controls & Log */}
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Battle Controls</h3>
            
            {battleState.phase === 'setup' && (
              <button
                onClick={startBattle}
                disabled={!socketRef.current?.connected}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors"
              >
                Start Battle
              </button>
            )}

            {battleState.phase === 'battle' && !battleState.winner && (
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => performAction('attack')}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  <Sword className="w-4 h-4" />
                  Attack
                </button>
                <button
                  onClick={() => performAction('defend')}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Defend
                </button>
                <button
                  onClick={() => performAction('special')}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Special
                </button>
              </div>
            )}

            {(battleState.phase === 'finished' || battleState.winner) && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-400">
                    {battleState.winner ? `${battleState.winner} Wins!` : 'Battle Complete'}
                  </div>
                </div>
                <button
                  onClick={resetBattle}
                  className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold transition-colors"
                >
                  New Battle
                </button>
              </div>
            )}
          </div>

          {/* Battle Log */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Battle Log</h3>
            <div className="h-48 overflow-y-auto space-y-2">
              {battleLog.map((log, index) => (
                <div key={index} className="text-sm text-gray-300 p-2 bg-gray-700/50 rounded">
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Opponent Team */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-red-400">Opponent</h3>
          {battleState.opponentTeam.map((character) => (
            <div key={character.id} className="bg-red-900/30 border-2 border-red-500 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl">{character.avatar}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-white">{character.name}</h4>
                  <div className="text-sm text-gray-300">
                    ATK: {character.attack} • DEF: {character.defense}
                  </div>
                </div>
              </div>
              
              {/* Health Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Health</span>
                  <span>{character.health}/{character.maxHealth}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${getHealthPercentage(character)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}