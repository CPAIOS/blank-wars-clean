'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Settings, Brain, Users, Activity,
  Target, MessageCircle, Clock, AlertTriangle, Eye, EyeOff
} from 'lucide-react';

// Import our revolutionary psychology UI components
import ImprovedBattleArena from './ImprovedBattleArena';
import CoachingInterface from './CoachingInterface';
import RelationshipDisplay from './RelationshipDisplay';
import GameplanTracker from './GameplanTracker';

// Import the psychology data systems
import { Character, createDemoCharacterCollection } from '@/data/characters';
import { 
  BattleState, 
  BattleFlowManager, 
  PreBattleHuddle, 
  CombatRound,
  CoachingTimeout,
  PostBattleAnalysis,
  BattleCharacter
} from '@/data/battleFlow';
import { BattleEngine } from '@/systems/battleEngine';

interface CoachingAction {
  type: 'motivational_speech' | 'tactical_adjustment' | 'conflict_resolution' | 'confidence_boost' | 'mental_health_support';
  targetCharacters: string[];
  message: string;
  intensity: 'gentle' | 'firm' | 'intense';
}

interface GameplanAdherenceEvent {
  id: string;
  timestamp: Date;
  characterId: string;
  characterName: string;
  gameplanAdherenceLevel: number;
  checkResult: 'adherent' | 'reluctant' | 'deviant' | 'rebellious';
  triggerReason: string;
  mentalFactors: {
    mentalHealth: number;
    stress: number;
    teamTrust: number;
    battleFocus: number;
  };
  consequences: string[];
}

type ActiveView = 'overview' | 'battle' | 'coaching' | 'relationships' | 'gameplan_adherence';

export default function CompletePsychologyBattleSystem() {
  // Core Battle State
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [preHuddle, setPreHuddle] = useState<PreBattleHuddle | null>(null);
  const [currentRound, setCurrentRound] = useState<CombatRound | null>(null);
  const [coachingTimeout, setCoachingTimeout] = useState<CoachingTimeout | null>(null);
  const [postAnalysis, setPostAnalysis] = useState<PostBattleAnalysis | null>(null);

  // UI State
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [battlePhase, setBattlePhase] = useState<'setup' | 'huddle' | 'combat' | 'timeout' | 'analysis'>('setup');
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<BattleCharacter | null>(null);
  const [showCoaching, setShowCoaching] = useState(false);

  // Psychology Tracking
  const [psychologyEvents, setPsychologyEvents] = useState<string[]>([]);
  const [gameplanAdherenceAlerts, setGameplanAdherenceAlerts] = useState<GameplanAdherenceEvent[]>([]);
  const [teamDynamicsHistory, setTeamDynamicsHistory] = useState<{ timestamp: Date; chemistry: number; morale: number }[]>([]);

  // Demo Characters
  const [availableCharacters] = useState(() => createDemoCharacterCollection());
  const [playerTeam, setPlayerTeam] = useState<Character[]>([]);
  const [opponentTeam, setOpponentTeam] = useState<Character[]>([]);

  // Initialize demo teams
  useEffect(() => {
    if (availableCharacters.length >= 6) {
      setPlayerTeam(availableCharacters.slice(0, 3));
      setOpponentTeam(availableCharacters.slice(3, 6));
    }
  }, [availableCharacters]);

  // Add psychology event to log
  const addPsychologyEvent = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setPsychologyEvents(prev => [`${timestamp}: ${message}`, ...prev].slice(0, 50));
  };

  // Handle coaching actions
  const handleCoachingAction = (action: CoachingAction) => {
    addPsychologyEvent(`Coach used ${action.type} (${action.intensity}) on ${action.targetCharacters.join(', ')}: "${action.message}"`);
    
    // Apply psychological effects to battle state
    if (battleState) {
      // This would normally update the battle state with coaching effects
      // For demo purposes, we'll simulate positive effects
      addPsychologyEvent(`Coaching session completed. Characters responding...`);
    }
  };

  // Handle gameplan adherence alerts
  const handleGameplanAdherenceAlert = (event: GameplanAdherenceEvent) => {
    setGameplanAdherenceAlerts(prev => [event, ...prev].slice(0, 10));
    addPsychologyEvent(`⚠️ Gameplan Adherence Alert: ${event.characterName} is ${event.checkResult} (${event.gameplanAdherenceLevel}%)`);
  };

  // Start the revolutionary psychology battle system
  const startPsychologyBattle = () => {
    if (playerTeam.length === 0 || opponentTeam.length === 0) return;

    // Create battle state using our revolutionary system
    const newBattleState = BattleFlowManager.createBattle(playerTeam, opponentTeam);
    setBattleState(newBattleState);
    
    // Conduct pre-battle huddle with psychology assessment
    const huddle = BattleEngine.conductPreBattleHuddle(newBattleState);
    setPreHuddle(huddle);
    
    setBattlePhase('huddle');
    setIsSystemActive(true);
    setActiveView('battle');
    
    addPsychologyEvent("🚀 Revolutionary Psychology Battle System activated!");
    addPsychologyEvent(`Team Chemistry: ${huddle.teamChemistryCheck.overallChemistry}%`);
    addPsychologyEvent(`Predicted Challenges: ${huddle.teamChemistryCheck.predictedChallenges.length}`);
    
    // Record initial team dynamics
    setTeamDynamicsHistory(prev => [...prev, {
      timestamp: new Date(),
      chemistry: newBattleState.teams.player.teamChemistry,
      morale: newBattleState.globalMorale.player
    }]);
  };

  // Proceed to combat phase
  const proceedToCombat = () => {
    if (!battleState) return;

    setBattlePhase('combat');
    addPsychologyEvent("⚔️ Combat phase initiated - psychology will drive every action!");

    // Execute combat round with AI psychology
    const playerActions: Record<string, { actionType: string; targetId?: string; abilityId?: string }> = {};
    battleState.teams.player.characters.forEach(char => {
      playerActions[char.character.id] = {
        type: 'ability',
        abilityId: 'basic_attack',
        coachingInfluence: 80
      };
    });

    const round = BattleEngine.executeRound(battleState, playerActions);
    setCurrentRound(round);

    // Log psychology-driven combat results
    round.actions.forEach(action => {
      if (action.actionType === 'panicked') {
        addPsychologyEvent(`🚨 ROGUE ACTION: ${action.characterId} went rogue! Psychology breakdown detected.`);
      } else {
        addPsychologyEvent(`✅ ${action.characterId} followed orders (Gameplan Adherence successful)`);
      }
    });

    // Track morale changes
    round.moraleEvents.forEach(event => {
      addPsychologyEvent(`📊 Morale Event: ${event.description} (Impact: ${event.moraleImpact})`);
    });
  };

  // Trigger coaching timeout
  const triggerCoachingTimeout = () => {
    if (!battleState) return;

    const timeout = BattleEngine.triggerCoachingTimeout(battleState, 'player_requested');
    setCoachingTimeout(timeout);
    setBattlePhase('timeout');
    setActiveView('coaching');
    addPsychologyEvent("⏰ Coaching timeout activated - emergency psychology intervention!");
  };

  // End battle and analyze psychology
  const endBattle = () => {
    if (!battleState) return;

    const analysis = BattleEngine.conductPostBattleAnalysis(battleState);
    setPostAnalysis(analysis);
    setBattlePhase('analysis');
    setIsSystemActive(false);
    
    addPsychologyEvent("📋 Battle complete! Analyzing psychological impacts...");
    addPsychologyEvent(`Final Team Chemistry: ${analysis.teamChemistryEvolution.newChemistry}%`);
    addPsychologyEvent(`Psychology Consequences: ${analysis.psychologicalConsequences.length} detected`);
  };

  // Reset the entire system
  const resetSystem = () => {
    setBattleState(null);
    setPreHuddle(null);
    setCurrentRound(null);
    setCoachingTimeout(null);
    setPostAnalysis(null);
    setBattlePhase('setup');
    setIsSystemActive(false);
    setActiveView('overview');
    setSelectedCharacter(null);
    setShowCoaching(false);
    setPsychologyEvents([]);
    setGameplanAdherenceAlerts([]);
    setTeamDynamicsHistory([]);
    
    addPsychologyEvent("🔄 Psychology Battle System reset - ready for new battle!");
  };

  // Get current team chemistry
  const getCurrentTeamChemistry = (): number => {
    return battleState?.teams.player.teamChemistry || 75;
  };

  // Get current team morale
  const getCurrentTeamMorale = (): number => {
    return battleState?.globalMorale.player || 75;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Revolutionary System Header */}
      <motion.div 
        className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl p-6 backdrop-blur-sm border border-purple-500"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              _____ WARS: Revolutionary Psychology Battle System
            </h1>
            <p className="text-purple-200">
              &quot;Can you win the battle before your team loses their minds?&quot;
            </p>
            <p className="text-sm text-purple-300 mt-1">
              Where managing AI personalities with genuine psychological needs IS the core gameplay
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* System Status */}
            <div className="bg-black/40 rounded-lg px-4 py-2">
              <div className="text-sm text-gray-400">System Status</div>
              <div className={`text-lg font-bold ${isSystemActive ? 'text-green-400' : 'text-gray-400'}`}>
                {isSystemActive ? 'ACTIVE' : 'STANDBY'}
              </div>
            </div>
            
            {/* Phase Indicator */}
            <div className="bg-black/40 rounded-lg px-4 py-2">
              <div className="text-sm text-gray-400">Phase</div>
              <div className="text-lg font-bold text-white capitalize">{battlePhase}</div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex gap-2">
              {!isSystemActive ? (
                <button
                  onClick={startPsychologyBattle}
                  disabled={playerTeam.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold transition-all flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Activate Psychology System
                </button>
              ) : (
                <>
                  {battlePhase === 'combat' && (
                    <button
                      onClick={triggerCoachingTimeout}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-semibold transition-all flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Psychology Timeout
                    </button>
                  )}
                  
                  <button
                    onClick={resetSystem}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset System
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="bg-gray-800/30 rounded-xl p-2 backdrop-blur-sm border border-gray-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          {[
            { id: 'overview', label: 'System Overview', icon: Target },
            { id: 'battle', label: 'Battle Interface', icon: Brain },
            { id: 'coaching', label: 'Psychology Coaching', icon: MessageCircle },
            { id: 'relationships', label: 'Team Chemistry', icon: Users },
            { id: 'obedience', label: 'Obedience Tracker', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as ActiveView)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeView === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* System Overview Dashboard */}
      {activeView === 'overview' && (
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-600 text-center">
              <div className="text-2xl font-bold text-blue-400">{getCurrentTeamChemistry()}%</div>
              <div className="text-sm text-gray-400">Team Chemistry</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-600 text-center">
              <div className="text-2xl font-bold text-green-400">{getCurrentTeamMorale()}%</div>
              <div className="text-sm text-gray-400">Team Morale</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-600 text-center">
              <div className="text-2xl font-bold text-yellow-400">{gameplanAdherenceAlerts.length}</div>
              <div className="text-sm text-gray-400">Active Alerts</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-600 text-center">
              <div className="text-2xl font-bold text-purple-400">{psychologyEvents.length}</div>
              <div className="text-sm text-gray-400">Psychology Events</div>
            </div>
          </div>

          {/* Revolutionary Features Showcase */}
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-600">
            <h3 className="text-xl font-bold text-white mb-4">Revolutionary Psychology Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-4">
                <div className="text-lg font-bold text-blue-400 mb-2">🧠 AI Personalities</div>
                <div className="text-sm text-gray-300">
                  17 fully-realized characters with authentic psychological profiles that drive their decisions
                </div>
              </div>
              <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-4">
                <div className="text-lg font-bold text-green-400 mb-2">⚔️ Psychology-Driven Combat</div>
                <div className="text-sm text-gray-300">
                  Characters can refuse orders, attack teammates, or have mental breakdowns based on their psychology
                </div>
              </div>
              <div className="bg-purple-600/20 border border-purple-500/50 rounded-lg p-4">
                <div className="text-lg font-bold text-purple-400 mb-2">👨‍🏫 Real-Time Coaching</div>
                <div className="text-sm text-gray-300">
                  Mid-battle psychological interventions and coaching mechanics that actually affect character behavior
                </div>
              </div>
              <div className="bg-yellow-600/20 border border-yellow-500/50 rounded-lg p-4">
                <div className="text-lg font-bold text-yellow-400 mb-2">📈 Dynamic Relationships</div>
                <div className="text-sm text-gray-300">
                  Character relationships evolve based on battle experiences, creating complex team dynamics
                </div>
              </div>
              <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-4">
                <div className="text-lg font-bold text-red-400 mb-2">🚨 Gameplan Adherence Tracking</div>
                <div className="text-sm text-gray-300">
                  Real-time monitoring of character gameplan adherence with predictive deviant behavior detection
                </div>
              </div>
              <div className="bg-indigo-600/20 border border-indigo-500/50 rounded-lg p-4">
                <div className="text-lg font-bold text-indigo-400 mb-2">🎭 Team Chemistry</div>
                <div className="text-sm text-gray-300">
                  Complex team dynamics where managing psychology is more important than individual stats
                </div>
              </div>
            </div>
          </div>

          {/* Psychology Event Log */}
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-600">
            <h3 className="text-lg font-bold text-white mb-3">Psychology Event Log</h3>
            <div className="bg-black/40 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
              {psychologyEvents.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  Psychology events will appear here as the system operates...
                </div>
              ) : (
                psychologyEvents.map((event, index) => (
                  <motion.div
                    key={index}
                    className="text-gray-200 mb-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {event}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Battle Interface */}
      {activeView === 'battle' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ImprovedBattleArena />
        </motion.div>
      )}

      {/* Coaching Interface */}
      {activeView === 'coaching' && selectedCharacter && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CoachingInterface
            character={selectedCharacter}
            isTimeoutActive={battlePhase === 'timeout'}
            timeRemaining={coachingTimeout?.timeLimit || 0}
            onCoachingAction={handleCoachingAction}
            onCloseCoaching={() => setSelectedCharacter(null)}
          />
        </motion.div>
      )}

      {activeView === 'coaching' && !selectedCharacter && battleState && (
        <motion.div 
          className="bg-gray-800/30 rounded-lg p-6 border border-gray-600 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Brain className="w-12 h-12 mx-auto mb-4 text-blue-400" />
          <h3 className="text-xl font-bold text-white mb-2">Select a Character to Coach</h3>
          <p className="text-gray-400 mb-6">Choose a team member to begin individual psychology coaching</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {battleState.teams.player.characters.map((char) => (
              <button
                key={char.character.id}
                onClick={() => setSelectedCharacter(char)}
                className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-lg p-4 transition-all"
              >
                <div className="text-3xl mb-2">{char.character.avatar}</div>
                <div className="text-white font-medium">{char.character.name}</div>
                <div className="text-sm text-gray-400">Level {char.character.level}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Relationship Display */}
      {activeView === 'relationships' && battleState && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <RelationshipDisplay
            characters={battleState.teams.player.characters}
            teamChemistry={getCurrentTeamChemistry()}
            showDetailed={true}
            onCharacterSelect={setSelectedCharacter}
          />
        </motion.div>
      )}

      {/* Gameplan Adherence Tracker */}
      {activeView === 'gameplan_adherence' && battleState && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GameplanTracker
            characters={battleState.teams.player.characters}
          />
        </motion.div>
      )}

      {/* Getting Started Message */}
      {!battleState && activeView !== 'overview' && (
        <motion.div 
          className="bg-gradient-to-r from-green-900/40 to-blue-900/40 rounded-xl p-8 border border-green-500 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Brain className="w-16 h-16 mx-auto mb-4 text-green-400" />
          <h3 className="text-2xl font-bold text-white mb-4">
            Revolutionary Psychology System Ready
          </h3>
          <p className="text-green-200 mb-6">
            Activate the psychology battle system to experience revolutionary AI character management where psychology drives every decision!
          </p>
          <button
            onClick={() => setActiveView('overview')}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold transition-all"
          >
            View System Overview
          </button>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div 
        className="text-center text-gray-400 text-sm border-t border-gray-700 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p>
          🎮 _____ WARS - Where managing AI psychology IS the game • 
          🧠 Revolutionary character management • 
          ⚔️ &quot;Can you win the battle before your team loses their minds?&quot;
        </p>
      </motion.div>
    </div>
  );
}