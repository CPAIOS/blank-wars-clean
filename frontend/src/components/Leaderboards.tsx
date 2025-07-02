'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy,
  Crown,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Zap,
  Shield,
  Target,
  Clock,
  Award,
  Medal,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Eye,
  Filter,
  Search,
  Calendar
} from 'lucide-react';
import { 
  LeaderboardType,
  LeaderboardEntry,
  leaderboards
} from '@/data/clubhouse';

interface LeaderboardsProps {
  currentUserId?: string;
}

export default function Leaderboards({ currentUserId }: LeaderboardsProps) {
  const [activeLeaderboard, setActiveLeaderboard] = useState<LeaderboardType>('global_power');
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('all_time');
  const [showUserRank, setShowUserRank] = useState(false);

  const currentLeaderboard = leaderboards[activeLeaderboard] || [];

  const getLeaderboardConfig = (type: LeaderboardType) => {
    const configs = {
      global_power: {
        title: 'Global Power Rankings',
        icon: <Crown className="w-6 h-6 text-yellow-400" />,
        description: 'Most powerful warriors across all battles',
        valueLabel: 'Power',
        color: 'from-yellow-500 to-orange-500'
      },
      battle_wins: {
        title: 'Battle Victories',
        icon: <Trophy className="w-6 h-6 text-red-400" />,
        description: 'Warriors with the most battle victories',
        valueLabel: 'Wins',
        color: 'from-red-500 to-pink-500'
      },
      win_streak: {
        title: 'Win Streaks',
        icon: <Zap className="w-6 h-6 text-purple-400" />,
        description: 'Longest consecutive win streaks',
        valueLabel: 'Streak',
        color: 'from-purple-500 to-indigo-500'
      },
      character_collection: {
        title: 'Character Collectors',
        icon: <Star className="w-6 h-6 text-blue-400" />,
        description: 'Warriors with the largest character collections',
        valueLabel: 'Characters',
        color: 'from-blue-500 to-cyan-500'
      },
      guild_power: {
        title: 'Guild Power Rankings',
        icon: <Users className="w-6 h-6 text-green-400" />,
        description: 'Most powerful guilds in the realm',
        valueLabel: 'Guild Power',
        color: 'from-green-500 to-teal-500'
      },
      monthly_battles: {
        title: 'Monthly Activity',
        icon: <Target className="w-6 h-6 text-orange-400" />,
        description: 'Most active warriors this month',
        valueLabel: 'Battles',
        color: 'from-orange-500 to-red-500'
      }
    };

    return configs[type] || configs.global_power;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-400" />;
    return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'same', change: number) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatValue = (value: number, type: LeaderboardType) => {
    if (type === 'global_power' || type === 'guild_power') {
      return value.toLocaleString();
    }
    return value.toString();
  };

  const config = getLeaderboardConfig(activeLeaderboard);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {config.icon}
            <div>
              <h2 className="text-2xl font-bold text-white">{config.title}</h2>
              <p className="text-gray-400">{config.description}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value as any)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
        </div>

        {/* Leaderboard Type Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2">
          {Object.entries(leaderboards).map(([type, _]) => {
            const tabConfig = getLeaderboardConfig(type as LeaderboardType);
            return (
              <button
                key={type}
                onClick={() => setActiveLeaderboard(type as LeaderboardType)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeLeaderboard === type
                    ? `bg-gradient-to-r ${tabConfig.color} text-white shadow-lg`
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {tabConfig.icon}
                <span className="hidden sm:inline">{tabConfig.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          Hall of Champions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {currentLeaderboard.slice(0, 3).map((entry, index) => {
            const position = index + 1;
            const heights = ['h-32', 'h-40', 'h-28']; // 2nd, 1st, 3rd
            const orders = [1, 0, 2]; // Display order: 2nd, 1st, 3rd
            const actualIndex = orders.indexOf(index);
            
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: actualIndex * 0.1 }}
                className={`${heights[index]} relative`}
              >
                <div className={`absolute bottom-0 w-full bg-gradient-to-t ${config.color}/20 border-2 ${
                  position === 1 ? 'border-yellow-400' :
                  position === 2 ? 'border-gray-300' :
                  'border-orange-400'
                } rounded-t-lg p-4 flex flex-col justify-end`}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">{entry.avatar}</div>
                    <div className="flex items-center justify-center mb-2">
                      {getRankIcon(position)}
                    </div>
                    <h4 className="font-bold text-white text-sm">{entry.username}</h4>
                    {entry.title && (
                      <p className="text-xs text-purple-400">{entry.title}</p>
                    )}
                    {entry.guildTag && (
                      <p className="text-xs text-gray-400">[{entry.guildTag}]</p>
                    )}
                    <div className="text-lg font-bold text-white mt-1">
                      {formatValue(entry.value, activeLeaderboard)}
                    </div>
                    <div className="text-xs text-gray-400">{config.valueLabel}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Full Rankings */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Full Rankings</h3>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Updated {timeFrame === 'daily' ? 'every hour' : timeFrame === 'weekly' ? 'daily' : 'weekly'}</span>
          </div>
        </div>

        <div className="space-y-2">
          {currentLeaderboard.map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`border rounded-lg p-4 transition-all ${
                entry.userId === currentUserId
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Rank and User Info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <div className="text-3xl">{entry.avatar}</div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{entry.username}</span>
                      {entry.title && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                          {entry.title}
                        </span>
                      )}
                      {entry.userId === currentUserId && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      {entry.guildName && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {entry.guildName}
                          {entry.guildTag && ` [${entry.guildTag}]`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats and Trend */}
                <div className="flex items-center gap-6">
                  {/* Additional Stats */}
                  <div className="hidden md:flex gap-4 text-sm">
                    {activeLeaderboard === 'global_power' && (
                      <>
                        <div className="text-center">
                          <div className="text-green-400 font-semibold">{entry.additionalStats.winRate}%</div>
                          <div className="text-gray-400 text-xs">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-400 font-semibold">{entry.additionalStats.totalBattles}</div>
                          <div className="text-gray-400 text-xs">Battles</div>
                        </div>
                      </>
                    )}
                    {activeLeaderboard === 'battle_wins' && (
                      <div className="text-center">
                        <div className="text-yellow-400 font-semibold">{entry.additionalStats.currentStreak}</div>
                        <div className="text-gray-400 text-xs">Current Streak</div>
                      </div>
                    )}
                    {activeLeaderboard === 'character_collection' && (
                      <>
                        <div className="text-center">
                          <div className="text-purple-400 font-semibold">{entry.additionalStats.mythicCount}</div>
                          <div className="text-gray-400 text-xs">Mythic</div>
                        </div>
                        <div className="text-center">
                          <div className="text-orange-400 font-semibold">{entry.additionalStats.legendaryCount}</div>
                          <div className="text-gray-400 text-xs">Legendary</div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Main Value */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {formatValue(entry.value, activeLeaderboard)}
                    </div>
                    <div className="text-xs text-gray-400">{config.valueLabel}</div>
                  </div>

                  {/* Trend */}
                  <div className="flex items-center gap-1 min-w-[60px]">
                    {getTrendIcon(entry.trend, entry.change)}
                    <span className={`text-sm font-semibold ${
                      entry.trend === 'up' ? 'text-green-400' :
                      entry.trend === 'down' ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {entry.change > 0 ? '+' : ''}{entry.change}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        {currentLeaderboard.length > 10 && (
          <div className="text-center mt-6">
            <button className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 mx-auto">
              <Eye className="w-4 h-4" />
              View Full Rankings (Top 100)
            </button>
          </div>
        )}
      </div>

      {/* Personal Rank Card */}
      {currentUserId && (
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Your Current Rank</h3>
              <p className="text-gray-300">Keep climbing the leaderboards!</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-400">#42</div>
              <div className="text-sm text-gray-400">Global Power</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-semibold">+5</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}