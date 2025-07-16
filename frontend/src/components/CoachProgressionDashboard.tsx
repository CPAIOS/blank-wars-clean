'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Star, TrendingUp, Brain, Users, Target, 
  Award, BarChart3, Activity, Shield, Zap, Crown,
  ChevronRight, Calendar, Clock, User
} from 'lucide-react';
import { coachProgressionAPI, CoachProgression, CoachBonuses, CoachXPEvent, LeaderboardEntry } from '@/services/coachProgressionAPI';

interface CoachProgressionDashboardProps {
  className?: string;
}

const SkillTree = ({ progression, bonuses }: { progression: CoachProgression; bonuses: CoachBonuses }) => {
  const skillTrees = [
    {
      id: 'psychology_mastery',
      name: 'Psychology Mastery',
      icon: Brain,
      color: 'purple',
      points: progression.psychologySkillPoints,
      description: 'Enhance gameplan adherence and reduce character breakdowns',
      bonuses: [
        `+${bonuses.gameplanAdherenceBonus}% Gameplan Adherence`,
        `-${bonuses.deviationRiskReduction}% Deviation Risk`
      ]
    },
    {
      id: 'battle_strategy',
      name: 'Battle Strategy',
      icon: Target,
      color: 'blue',
      points: progression.battleStrategySkillPoints,
      description: 'Improve battle performance and tactical bonuses',
      bonuses: [
        `${bonuses.battleXPMultiplier}x Battle XP Multiplier`,
        'Enhanced tactical options'
      ]
    },
    {
      id: 'character_development',
      name: 'Character Development',
      icon: Users,
      color: 'green',
      points: progression.characterDevelopmentSkillPoints,
      description: 'Accelerate character growth and development',
      bonuses: [
        `${bonuses.characterDevelopmentMultiplier}x Character Development XP`,
        `+${bonuses.teamChemistryBonus}% Team Chemistry`
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      purple: 'bg-purple-600/20 border-purple-500/50 text-purple-400',
      blue: 'bg-blue-600/20 border-blue-500/50 text-blue-400',
      green: 'bg-green-600/20 border-green-500/50 text-green-400'
    };
    return colors[color as keyof typeof colors] || colors.purple;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {skillTrees.map((tree) => {
        const Icon = tree.icon;
        return (
          <motion.div
            key={tree.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border ${getColorClasses(tree.color)}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <Icon className="w-6 h-6" />
              <h3 className="font-bold text-lg">{tree.name}</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3">{tree.description}</p>
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Skill Points</span>
                <span className="font-bold">{tree.points}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    tree.color === 'purple' ? 'bg-purple-600' :
                    tree.color === 'blue' ? 'bg-blue-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(100, (tree.points / 50) * 100)}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              {tree.bonuses.map((bonus, index) => (
                <div key={index} className="text-xs text-gray-300 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {bonus}
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const XPHistoryFeed = ({ xpHistory }: { xpHistory: CoachXPEvent[] }) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'battle_win': return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'battle_loss': return <Shield className="w-4 h-4 text-gray-400" />;
      case 'psychology_management': return <Brain className="w-4 h-4 text-purple-400" />;
      case 'character_development': return <Users className="w-4 h-4 text-green-400" />;
      default: return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'battle_win': return 'text-yellow-400';
      case 'battle_loss': return 'text-gray-400';
      case 'psychology_management': return 'text-purple-400';
      case 'character_development': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {xpHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Activity className="w-8 h-8 mx-auto mb-2" />
          <p>No XP events yet. Start coaching to see your progress!</p>
        </div>
      ) : (
        xpHistory.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg"
          >
            <div className="mt-1">
              {getEventIcon(event.eventType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white truncate">
                  {event.description}
                </p>
                <span className={`text-sm font-bold ${getEventColor(event.eventType)}`}>
                  +{event.xpGained} XP
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400 capitalize">
                  {event.eventType.replace('_', ' ')}
                </span>
                {event.eventSubtype && (
                  <>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400 capitalize">
                      {event.eventSubtype.replace('_', ' ')}
                    </span>
                  </>
                )}
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-400">
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};

const CoachLeaderboard = ({ leaderboard }: { leaderboard: LeaderboardEntry[] }) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Award className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-400">#{rank}</span>;
    }
  };

  return (
    <div className="space-y-2">
      {leaderboard.map((entry, index) => (
        <motion.div
          key={entry.userId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            {getRankIcon(index + 1)}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{entry.username}</span>
                <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
                  {entry.coachTitle}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Level {entry.coachLevel} • {entry.totalBattlesCoached} battles • {(entry.winRate * 100).toFixed(1)}% win rate
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white">{coachProgressionAPI.formatXP(entry.coachExperience)}</div>
            <div className="text-xs text-gray-400">XP</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default function CoachProgressionDashboard({ className }: CoachProgressionDashboardProps) {
  const [progression, setProgression] = useState<CoachProgression | null>(null);
  const [bonuses, setBonuses] = useState<CoachBonuses | null>(null);
  const [xpHistory, setXpHistory] = useState<CoachXPEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'history' | 'leaderboard'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [progressionData, xpHistoryData, leaderboardData] = await Promise.all([
          coachProgressionAPI.getProgression(),
          coachProgressionAPI.getXPHistory(20),
          coachProgressionAPI.getLeaderboard(10)
        ]);

        setProgression(progressionData.progression);
        setBonuses(progressionData.bonuses);
        setXpHistory(xpHistoryData.history);
        setLeaderboard(leaderboardData.leaderboard);
      } catch (err) {
        setError('Failed to load coach progression data');
        console.error('Error fetching coach progression:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading coach progression...</p>
        </div>
      </div>
    );
  }

  if (error || !progression || !bonuses) {
    return (
      <div className={`${className} text-center py-12`}>
        <p className="text-red-400">{error || 'Failed to load progression data'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const progressPercentage = (progression.progressInCurrentLevel / progression.xpToNextLevel) * 100;

  return (
    <div className={className}>
      {/* Header Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-white">{progression.coachTitle}</h2>
            <p className="text-gray-400">Level {progression.coachLevel} Coach</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">{coachProgressionAPI.formatXP(progression.coachExperience)}</div>
              <div className="text-sm text-gray-400">Total XP</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">{progression.totalWinsCoached}</div>
              <div className="text-sm text-gray-400">Wins Coached</div>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">
              Level {progression.coachLevel} Progress
            </span>
            <span className="text-gray-400">
              {coachProgressionAPI.formatXP(progression.progressInCurrentLevel)} / {coachProgressionAPI.formatXP(progression.xpToNextLevel)} XP
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Battles</span>
            </div>
            <div className="text-xl font-bold text-white">{progression.totalBattlesCoached}</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Psychology</span>
            </div>
            <div className="text-xl font-bold text-white">{progression.psychologyInterventions}</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Team Chemistry</span>
            </div>
            <div className="text-xl font-bold text-white">{progression.teamChemistryImprovements}</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Win Rate</span>
            </div>
            <div className="text-xl font-bold text-white">
              {progression.totalBattlesCoached > 0 ? 
                ((progression.totalWinsCoached / progression.totalBattlesCoached) * 100).toFixed(1) + '%' : 
                '0%'
              }
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'skills', label: 'Skill Trees', icon: Star },
          { id: 'history', label: 'XP History', icon: Clock },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Coach Bonuses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gameplan Adherence</span>
                    <span className="text-green-400 font-bold">+{bonuses.gameplanAdherenceBonus}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deviation Risk Reduction</span>
                    <span className="text-green-400 font-bold">-{bonuses.deviationRiskReduction}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Team Chemistry Bonus</span>
                    <span className="text-green-400 font-bold">+{bonuses.teamChemistryBonus}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Battle XP Multiplier</span>
                    <span className="text-blue-400 font-bold">{bonuses.battleXPMultiplier}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Character Development XP</span>
                    <span className="text-blue-400 font-bold">{bonuses.characterDevelopmentMultiplier}x</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Successful Interventions</span>
                    <span className="text-white font-bold">{progression.successfulInterventions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gameplan Adherence Rate</span>
                    <span className="text-white font-bold">{(progression.gameplanAdherenceRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Character Developments</span>
                    <span className="text-white font-bold">{progression.characterDevelopments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Psychology Actions</span>
                    <span className="text-white font-bold">{progression.psychologyInterventions}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Skill Trees</h3>
              <p className="text-gray-400 mb-6">
                Skill points are automatically distributed as you level up. Higher coach levels unlock powerful bonuses.
              </p>
              <SkillTree progression={progression} bonuses={bonuses} />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-gray-800/30 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Recent XP Events</h3>
            <XPHistoryFeed xpHistory={xpHistory} />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-gray-800/30 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Coach Leaderboard</h3>
            <p className="text-gray-400 mb-6">
              See how you rank against other coaches in the psychology management league.
            </p>
            <CoachLeaderboard leaderboard={leaderboard} />
          </div>
        )}
      </motion.div>
    </div>
  );
}