'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, AlertTriangle, TrendingUp, TrendingDown, 
  Brain, Heart, Zap, Shield, Target, Clock,
  Pause, Play, RotateCcw, Eye, EyeOff, Settings
} from 'lucide-react';

import { BattleCharacter, MentalState, GameplanAdherenceCheck } from '@/data/battleFlow';

interface GameplanEvent {
  id: string;
  timestamp: Date;
  characterId: string;
  characterName: string;
  adherenceLevel: number;
  checkResult: 'following_plan' | 'hesitant' | 'going_rogue' | 'completely_off_script';
  triggerReason: string;
  mentalFactors: {
    mentalHealth: number;
    stress: number;
    teamTrust: number;
    battleFocus: number;
  };
  consequences: string[];
}

interface GameplanTrackerProps {
  characters: BattleCharacter[];
  isActive?: boolean;
  updateInterval?: number;
  onGameplanAlert?: (event: GameplanEvent) => void;
}

interface CharacterGameplanData {
  character: BattleCharacter;
  currentAdherence: number;
  adherenceHistory: { timestamp: number; value: number }[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  trends: {
    direction: 'improving' | 'stable' | 'declining';
    magnitude: number;
  };
  lastEvent?: GameplanEvent;
}

function GameplanGauge({ 
  value, 
  size = 80, 
  showLabel = true,
  riskLevel 
}: { 
  value: number;
  size?: number;
  showLabel?: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}) {
  const circumference = 2 * Math.PI * (size / 2 - 8);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  const getColor = () => {
    switch (riskLevel) {
      case 'critical': return '#ef4444'; // red-500
      case 'high': return '#f97316'; // orange-500
      case 'medium': return '#eab308'; // yellow-500
      case 'low': return '#22c55e'; // green-500
      default: return '#6b7280'; // gray-500
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          stroke={getColor()}
          strokeWidth="4"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{value}%</div>
            <div className="text-xs text-gray-400 capitalize">{riskLevel}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function GameplanHistoryChart({ 
  history, 
  character 
}: { 
  history: { timestamp: number; value: number }[];
  character: BattleCharacter;
}) {
  const maxPoints = 20;
  const displayHistory = history.slice(-maxPoints);
  const maxValue = 100;
  const minValue = 0;
  
  if (displayHistory.length < 2) {
    return (
      <div className="h-24 bg-gray-800/30 rounded flex items-center justify-center text-gray-400 text-sm">
        Collecting data...
      </div>
    );
  }

  const width = 200;
  const height = 60;
  const padding = 10;

  const points = displayHistory.map((point, index) => {
    const x = padding + (index / (displayHistory.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((point.value - minValue) / (maxValue - minValue)) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-gray-800/30 rounded p-2">
      <div className="text-xs text-gray-400 mb-1">Gameplan Adherence</div>
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="20" height="15" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 15" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-600" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Zero line */}
        <line 
          x1={padding} 
          y1={height - padding} 
          x2={width - padding} 
          y2={height - padding} 
          stroke="currentColor" 
          strokeWidth="1" 
          className="text-gray-600"
        />
        
        {/* Trend line */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        
        {/* Data points */}
        {displayHistory.map((point, index) => {
          const x = padding + (index / (displayHistory.length - 1)) * (width - 2 * padding);
          const y = height - padding - ((point.value - minValue) / (maxValue - minValue)) * (height - 2 * padding);
          const color = point.value >= 70 ? '#22c55e' : point.value >= 40 ? '#eab308' : '#ef4444';
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              className="drop-shadow-sm"
            />
          );
        })}
      </svg>
    </div>
  );
}

function GameplanAlert({ 
  event, 
  onDismiss 
}: { 
  event: GameplanEvent;
  onDismiss: () => void;
}) {
  const getSeverityColor = (result: string) => {
    switch (result) {
      case 'completely_off_script': return 'from-red-600 to-red-800';
      case 'going_rogue': return 'from-orange-600 to-orange-800';
      case 'hesitant': return 'from-yellow-600 to-yellow-800';
      default: return 'from-blue-600 to-blue-800';
    }
  };

  const getSeverityIcon = (result: string) => {
    switch (result) {
      case 'completely_off_script': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'going_rogue': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'hesitant': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default: return <Activity className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className={`bg-gradient-to-r ${getSeverityColor(event.checkResult)} rounded-lg p-4 border border-white/20 shadow-lg`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getSeverityIcon(event.checkResult)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-bold text-sm">
              {event.characterName} - {event.checkResult.toUpperCase()}
            </h4>
            <span className="text-xs text-white/70">
              {event.timestamp.toLocaleTimeString()}
            </span>
          </div>
          
          <p className="text-white/90 text-sm mb-2">
            {event.triggerReason}
          </p>
          
          <div className="text-xs text-white/70 space-y-1">
            <div>Gameplan Adherence: {event.adherenceLevel}%</div>
            {event.consequences.length > 0 && (
              <div>
                <span className="font-medium">Consequences:</span>
                <ul className="ml-2">
                  {event.consequences.map((consequence, idx) => (
                    <li key={idx}>• {consequence}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <Clock className="w-4 h-4 text-white/70" />
        </button>
      </div>
    </motion.div>
  );
}

export default function GameplanTracker({ 
  characters, 
  isActive = true, 
  updateInterval = 2000,
  onGameplanAlert 
}: GameplanTrackerProps) {
  const [gameplanData, setGameplanData] = useState<Map<string, CharacterGameplanData>>(new Map());
  const [activeAlerts, setActiveAlerts] = useState<GameplanEvent[]>([]);
  const [isTracking, setIsTracking] = useState(isActive);
  const [showDetailed, setShowDetailed] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    enableAlerts: true,
    alertThreshold: 40,
    autoAlert: true
  });

  const updateTimerRef = useRef<NodeJS.Timeout>();

  // Simulate gameplan adherence fluctuations based on character psychology
  const simulateGameplanCheck = (character: BattleCharacter) => {
    const mental = character.mentalState;
    const baseAdherence = character.gameplanAdherence; // Gameplan adherence level
    
    // Add random fluctuations based on psychological state
    const stressImpact = -(mental.stress * 0.3);
    const mentalHealthImpact = (mental.currentMentalHealth - 50) * 0.2;
    const teamTrustImpact = (mental.teamTrust - 50) * 0.1;
    const battleFocusImpact = (mental.battleFocus - 50) * 0.15;
    
    // Random event factor (-10 to +10)
    const randomFactor = (Math.random() - 0.5) * 20;
    
    const finalAdherence = Math.max(0, Math.min(100, 
      baseAdherence + stressImpact + mentalHealthImpact + teamTrustImpact + battleFocusImpact + randomFactor
    ));

    let checkResult: 'following_plan' | 'hesitant' | 'going_rogue' | 'completely_off_script';
    if (finalAdherence >= 80) checkResult = 'following_plan';
    else if (finalAdherence >= 60) checkResult = 'hesitant';
    else if (finalAdherence >= 30) checkResult = 'going_rogue';
    else checkResult = 'completely_off_script';

    const triggers = [];
    if (mental.stress > 70) triggers.push('high stress levels');
    if (mental.currentMentalHealth < 40) triggers.push('poor mental health');
    if (mental.teamTrust < 50) triggers.push('low team trust');
    if (character.battlePerformance.strategyDeviations > 0) triggers.push('previous off-gameplan actions');

    return {
      baseAdherence,
      mentalHealthModifier: mentalHealthImpact,
      teamChemistryModifier: teamTrustImpact,
      relationshipModifier: 0,
      stressModifier: stressImpact,
      finalAdherence,
      checkResult,
      reasoning: triggers.length > 0 ? `Affected by: ${triggers.join(', ')}` : 'Following gameplan'
    };
  };

  const updateGameplanData = useCallback(() => {
    if (!isTracking) return;

    const newData = new Map(gameplanData);
    const newAlerts: GameplanEvent[] = [];

    characters.forEach(character => {
      const gameplanCheck = simulateGameplanCheck(character);
      const existing = newData.get(character.character.id);
      
      const history = existing?.adherenceHistory || [];
      const newHistory = [
        ...history,
        { timestamp: Date.now(), value: gameplanCheck.finalAdherence }
      ].slice(-50); // Keep last 50 data points

      // Calculate trends
      const recentValues = newHistory.slice(-5).map(h => h.value);
      const trend = recentValues.length >= 2 ? 
        recentValues[recentValues.length - 1] - recentValues[0] : 0;
      
      const trendDirection = Math.abs(trend) < 5 ? 'stable' : 
                            trend > 0 ? 'improving' : 'declining';

      // Determine risk level
      const riskLevel = gameplanCheck.finalAdherence >= 70 ? 'low' :
                       gameplanCheck.finalAdherence >= 50 ? 'medium' :
                       gameplanCheck.finalAdherence >= 30 ? 'high' : 'critical';

      // Check for significant changes that warrant alerts
      const shouldAlert = alertSettings.enableAlerts && 
                         (gameplanCheck.finalAdherence <= alertSettings.alertThreshold ||
                          (existing && Math.abs(existing.currentAdherence - gameplanCheck.finalAdherence) >= 20) ||
                          gameplanCheck.checkResult === 'completely_off_script');

      if (shouldAlert) {
        const event: GameplanEvent = {
          id: `${character.character.id}-${Date.now()}`,
          timestamp: new Date(),
          characterId: character.character.id,
          characterName: character.character.name,
          adherenceLevel: gameplanCheck.finalAdherence,
          checkResult: gameplanCheck.checkResult,
          triggerReason: gameplanCheck.reasoning,
          mentalFactors: {
            mentalHealth: character.mentalState.currentMentalHealth,
            stress: character.mentalState.stress,
            teamTrust: character.mentalState.teamTrust,
            battleFocus: character.mentalState.battleFocus
          },
          consequences: gameplanCheck.checkResult === 'completely_off_script' ? 
            ['May abandon team strategy', 'Risk of disrupting coordination', 'Unpredictable actions'] :
            gameplanCheck.checkResult === 'going_rogue' ?
            ['May deviate from plan', 'Reduced team synergy', 'Strategic complications'] :
            ['Uncertain execution', 'Potential timing issues']
        };

        newAlerts.push(event);
        onGameplanAlert?.(event);
      }

      const characterData: CharacterGameplanData = {
        character,
        currentAdherence: gameplanCheck.finalAdherence,
        adherenceHistory: newHistory,
        riskLevel,
        trends: {
          direction: trendDirection,
          magnitude: Math.abs(trend)
        },
        lastEvent: shouldAlert ? newAlerts[newAlerts.length - 1] : existing?.lastEvent
      };

      newData.set(character.character.id, characterData);
    });

    setGameplanData(newData);
    
    if (newAlerts.length > 0) {
      setActiveAlerts(prev => [...prev, ...newAlerts]);
    }
  }, [isTracking, characters, gameplanData, alertSettings, onGameplanAlert]);

  // Update timer
  useEffect(() => {
    if (isTracking) {
      updateTimerRef.current = setInterval(updateGameplanData, updateInterval);
      updateGameplanData(); // Initial update
    } else {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    }

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [isTracking, updateInterval, characters, updateGameplanData]);

  const dismissAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setActiveAlerts([]);
  };

  const resetTracking = () => {
    setGameplanData(new Map());
    setActiveAlerts([]);
  };

  const getOverallRiskLevel = (): 'low' | 'medium' | 'high' | 'critical' => {
    const riskLevels = Array.from(gameplanData.values()).map(data => data.riskLevel);
    if (riskLevels.some(level => level === 'critical')) return 'critical';
    if (riskLevels.some(level => level === 'high')) return 'high';
    if (riskLevels.some(level => level === 'medium')) return 'medium';
    return 'low';
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Strategy Tracker
          </h2>
          <p className="text-gray-400 text-sm">
            Monitor how well your team sticks to the strategy
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tracking Controls */}
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`p-2 rounded-lg transition-all ${
              isTracking 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
            title={isTracking ? 'Pause Tracking' : 'Start Tracking'}
          >
            {isTracking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={resetTracking}
            className="p-2 bg-gray-600 hover:bg-gray-700 text-gray-300 rounded-lg transition-all"
            title="Reset Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowDetailed(!showDetailed)}
            className={`p-2 rounded-lg transition-all ${
              showDetailed 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
            title="Toggle Detailed View"
          >
            {showDetailed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Alert Count */}
          {activeAlerts.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">
                {activeAlerts.length} Alert{activeAlerts.length !== 1 ? 's' : ''}
              </div>
              <button
                onClick={clearAllAlerts}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overall Status */}
      <motion.div
        className="bg-gray-800/30 rounded-lg p-4 border border-gray-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Team Strategy Adherence</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Overall Risk:</span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              getOverallRiskLevel() === 'critical' ? 'bg-red-600 text-white' :
              getOverallRiskLevel() === 'high' ? 'bg-orange-600 text-white' :
              getOverallRiskLevel() === 'medium' ? 'bg-yellow-600 text-black' :
              'bg-green-600 text-white'
            }`}>
              {getOverallRiskLevel().toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {characters.map(character => {
            const data = gameplanData.get(character.character.id);
            if (!data) return null;

            return (
              <motion.div
                key={character.character.id}
                className="bg-black/40 rounded-lg p-3 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl mb-2">{character.character.avatar}</div>
                <div className="text-sm font-medium text-white mb-2">
                  {character.character.name}
                </div>
                
                <GameplanGauge 
                  value={data.currentAdherence}
                  riskLevel={data.riskLevel}
                  size={60}
                />
                
                <div className="mt-2 flex items-center justify-center gap-1 text-xs">
                  {data.trends.direction === 'improving' && (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  )}
                  {data.trends.direction === 'declining' && (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`${
                    data.trends.direction === 'improving' ? 'text-green-400' :
                    data.trends.direction === 'declining' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {data.trends.direction}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Detailed View */}
      {showDetailed && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {Array.from(gameplanData.values()).map(data => (
            <div
              key={data.character.character.id}
              className="bg-gray-800/30 rounded-lg p-4 border border-gray-600"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Character Info */}
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{data.character.character.avatar}</div>
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      {data.character.character.name}
                    </h4>
                    <div className="text-sm text-gray-400">
                      Strategy Adherence: {data.currentAdherence}%
                    </div>
                    <div className={`text-xs font-medium ${
                      data.riskLevel === 'critical' ? 'text-red-400' :
                      data.riskLevel === 'high' ? 'text-orange-400' :
                      data.riskLevel === 'medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      Risk Level: {data.riskLevel.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Strategy Adherence History Chart */}
                <div>
                  <GameplanHistoryChart 
                    history={data.adherenceHistory}
                    character={data.character}
                  />
                </div>

                {/* Psychology Factors */}
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-white">Psychology Factors</h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mental Health:</span>
                      <span className="text-white">{data.character.mentalState.currentMentalHealth}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stress:</span>
                      <span className="text-red-400">{data.character.mentalState.stress}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Team Trust:</span>
                      <span className="text-blue-400">{data.character.mentalState.teamTrust}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Battle Focus:</span>
                      <span className="text-purple-400">{data.character.mentalState.battleFocus}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Active Strategy Alerts
          </h3>
          
          <AnimatePresence>
            {activeAlerts.slice(-5).map(alert => (
              <GameplanAlert
                key={alert.id}
                event={alert}
                onDismiss={() => dismissAlert(alert.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}