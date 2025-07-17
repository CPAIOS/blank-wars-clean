'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, AlertTriangle, TrendingUp, TrendingDown, 
  Users, Shield, Zap, Brain, Target, Activity,
  Clock, Calendar, ChevronRight, User, Crown,
  Wallet, PiggyBank, CreditCard, TrendingDown as Spiral
} from 'lucide-react';
import GameEventBus, { EventFilter, GameEvent } from '@/services/gameEventBus';
import { FinancialPsychologyService } from '@/services/financialPsychologyService';
import { Character } from '@/data/characters';

interface TeamDashboardProps {
  characters: Character[];
  className?: string;
}

interface TeamFinancialMetrics {
  totalTeamWealth: number;
  averageStress: number;
  charactersInSpiral: number;
  highRiskCharacters: string[];
  teamTrustAverage: number;
  recentDecisions: number;
  successRate: number;
  crisisCount: number;
}

interface CharacterFinancialSummary {
  id: string;
  name: string;
  wallet: number;
  stress: number;
  trustLevel: number;
  isInSpiral: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recentDecisions: number;
  lastActivity: Date;
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ characters, className }) => {
  const [teamMetrics, setTeamMetrics] = useState<TeamFinancialMetrics | null>(null);
  const [characterSummaries, setCharacterSummaries] = useState<CharacterFinancialSummary[]>([]);
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1_hour' | '6_hours' | '1_day' | '3_days' | '1_week'>('1_day');

  const eventBus = GameEventBus.getInstance();
  const financialPsychology = FinancialPsychologyService.getInstance();

  useEffect(() => {
    loadTeamFinancialData();
    const interval = setInterval(loadTeamFinancialData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [characters, selectedTimeRange]);

  const loadTeamFinancialData = async () => {
    try {
      setIsLoading(true);
      
      // Get recent financial events
      const eventFilter: EventFilter = {
        timeRange: selectedTimeRange,
        categories: ['financial'],
        limit: 100
      };
      // Get events for all characters
      let events: GameEvent[] = [];
      for (const char of characters) {
        const charEvents = eventBus.getCharacterEvents(char.id, eventFilter);
        events.push(...charEvents);
      }
      setRecentEvents(events);

      // Calculate team metrics and character summaries
      const metrics = await calculateTeamMetrics(events);
      const summaries = await calculateCharacterSummaries(events);
      
      setTeamMetrics(metrics);
      setCharacterSummaries(summaries);
    } catch (error) {
      console.error('Error loading team financial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTeamMetrics = async (events: GameEvent[]): Promise<TeamFinancialMetrics> => {
    const totalWealth = characters.reduce((sum, char) => sum + (char.financials?.wallet || 0), 0);
    const financialDecisions = events.filter(e => e.type === 'financial_decision_made');
    const successfulDecisions = financialDecisions.filter(e => e.metadata.outcome === 'positive');
    const crisisEvents = events.filter(e => e.type === 'financial_crisis');
    
    let totalStress = 0;
    let spiralCount = 0;
    let totalTrust = 0;
    const highRiskChars: string[] = [];

    for (const char of characters) {
      const recentDecisions = financialDecisions
        .filter(e => e.primaryCharacterId === char.id)
        .map(e => e.metadata as any);
      
      const stressData = financialPsychology.calculateFinancialStress(
        char.id,
        char.financials?.wallet || 0,
        char.financials?.monthlyEarnings || 0,
        recentDecisions,
        char.financialPersonality
      );
      
      totalStress += stressData.stress;
      
      if (stressData.stress > 70) {
        highRiskChars.push(char.id);
      }
      
      const spiralState = financialPsychology.calculateSpiralState(recentDecisions, stressData.stress);
      if (spiralState.isInSpiral) {
        spiralCount++;
      }
      
      totalTrust += char.financials?.coachFinancialTrust || 50;
    }

    return {
      totalTeamWealth: totalWealth,
      averageStress: totalStress / characters.length,
      charactersInSpiral: spiralCount,
      highRiskCharacters: highRiskChars,
      teamTrustAverage: totalTrust / characters.length,
      recentDecisions: financialDecisions.length,
      successRate: financialDecisions.length > 0 ? (successfulDecisions.length / financialDecisions.length) * 100 : 0,
      crisisCount: crisisEvents.length
    };
  };

  const calculateCharacterSummaries = async (events: GameEvent[]): Promise<CharacterFinancialSummary[]> => {
    const summaries: CharacterFinancialSummary[] = [];
    
    for (const char of characters) {
      const charEvents = events.filter(e => e.primaryCharacterId === char.id);
      const recentDecisions = charEvents
        .filter(e => e.type === 'financial_decision_made')
        .map(e => e.metadata as any);
      
      const stressData = financialPsychology.calculateFinancialStress(
        char.id,
        char.financials?.wallet || 0,
        char.financials?.monthlyEarnings || 0,
        recentDecisions,
        char.financialPersonality
      );
      
      const spiralState = financialPsychology.calculateSpiralState(recentDecisions, stressData.stress);
      
      const getRiskLevel = (stress: number): 'low' | 'medium' | 'high' | 'critical' => {
        if (stress < 30) return 'low';
        if (stress < 50) return 'medium';
        if (stress < 70) return 'high';
        return 'critical';
      };
      
      summaries.push({
        id: char.id,
        name: char.name,
        wallet: char.financials?.wallet || 0,
        stress: stressData.stress,
        trustLevel: char.financials?.coachFinancialTrust || 50,
        isInSpiral: spiralState.isInSpiral,
        riskLevel: getRiskLevel(stressData.stress),
        recentDecisions: recentDecisions.length,
        lastActivity: charEvents.length > 0 ? charEvents[0].timestamp : new Date()
      });
    }
    
    return summaries.sort((a, b) => b.stress - a.stress); // Sort by stress level
  };

  const getStressColor = (stress: number) => {
    if (stress < 30) return 'text-green-400';
    if (stress < 50) return 'text-yellow-400';
    if (stress < 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRiskBorderColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'border-green-500/50';
      case 'medium': return 'border-yellow-500/50';
      case 'high': return 'border-orange-500/50';
      case 'critical': return 'border-red-500/50';
      default: return 'border-gray-500/50';
    }
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-8 h-8" />
          Team Financial Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="1_hour">Last Hour</option>
            <option value="6_hours">Last 6 Hours</option>
            <option value="1_day">Last Day</option>
            <option value="3_days">Last 3 Days</option>
            <option value="1_week">Last Week</option>
          </select>
        </div>
      </div>

      {/* Team Metrics Overview */}
      {teamMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 p-4 rounded-lg border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-6 h-6 text-green-400" />
              <h3 className="font-semibold text-white">Team Wealth</h3>
            </div>
            <div className="text-2xl font-bold text-green-400">
              ${teamMetrics.totalTeamWealth.toLocaleString()}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 p-4 rounded-lg border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-6 h-6 text-orange-400" />
              <h3 className="font-semibold text-white">Avg Stress</h3>
            </div>
            <div className={`text-2xl font-bold ${getStressColor(teamMetrics.averageStress)}`}>
              {teamMetrics.averageStress.toFixed(1)}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 p-4 rounded-lg border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <Spiral className="w-6 h-6 text-red-400" />
              <h3 className="font-semibold text-white">In Spiral</h3>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {teamMetrics.charactersInSpiral} / {characters.length}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 p-4 rounded-lg border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-blue-400" />
              <h3 className="font-semibold text-white">Success Rate</h3>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {teamMetrics.successRate.toFixed(1)}%
            </div>
          </motion.div>
        </div>
      )}

      {/* Character Financial Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Character List */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Character Status
          </h2>
          <div className="space-y-3">
            {characterSummaries.map((char) => (
              <motion.div
                key={char.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border ${getRiskBorderColor(char.riskLevel)} bg-gray-700/50`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      char.isInSpiral ? 'bg-red-500' : 
                      char.riskLevel === 'critical' ? 'bg-red-400' :
                      char.riskLevel === 'high' ? 'bg-orange-400' :
                      char.riskLevel === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <div>
                      <div className="font-semibold text-white">{char.name}</div>
                      <div className="text-sm text-gray-400">
                        ${char.wallet.toLocaleString()} • {char.recentDecisions} decisions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getStressColor(char.stress)}`}>
                      {char.stress.toFixed(0)}% stress
                    </div>
                    <div className="text-sm text-gray-400">
                      {char.trustLevel.toFixed(0)}% trust
                    </div>
                  </div>
                </div>
                {char.isInSpiral && (
                  <div className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Financial spiral detected - intervention needed
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Financial Events */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Recent Financial Activity
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentEvents.slice(0, 10).map((event) => (
              <div key={event.id} className="p-2 bg-gray-700/50 rounded text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      event.severity === 'critical' ? 'bg-red-500' :
                      event.severity === 'high' ? 'bg-orange-500' :
                      event.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="text-white">{event.description}</span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;