'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Crown, 
  Trophy, 
  Star, 
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Zap,
  Target,
  Award,
  Settings,
  CreditCard,
  Shield,
  Bell,
  Palette,
  Globe,
  Eye,
  EyeOff,
  Check,
  X,
  Edit,
  Save
} from 'lucide-react';
import { 
  UserProfile as IUserProfile, 
  SubscriptionTier,
  subscriptionTiers,
  PlayerStats,
  Achievement,
  UserPreferences,
  calculatePlayerLevel,
  getXPRequiredForLevel
} from '@/data/userAccount';

interface UserProfileProps {
  userProfile: IUserProfile;
  onUpdateProfile?: (updates: Partial<IUserProfile>) => void;
  onUpgradeSubscription?: (tier: SubscriptionTier) => void;
  onUpdatePreferences?: (preferences: UserPreferences) => void;
}

export default function UserProfile({
  userProfile,
  onUpdateProfile,
  onUpgradeSubscription,
  onUpdatePreferences
}: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'achievements' | 'subscription' | 'settings'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    username: userProfile.username,
    title: userProfile.title
  });
  const [localPreferences, setLocalPreferences] = useState(userProfile.preferences);

  const playerLevel = calculatePlayerLevel(userProfile.totalXP);
  const xpRequiredForNext = getXPRequiredForLevel(playerLevel + 1);
  const xpProgress = userProfile.totalXP - getXPRequiredForLevel(playerLevel);

  const handleSaveProfile = () => {
    onUpdateProfile?.(editedProfile);
    setIsEditing(false);
  };

  const handleSavePreferences = () => {
    onUpdatePreferences?.(localPreferences);
  };

  const formatPlayTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getWinRate = (stats: PlayerStats): number => {
    if (stats.totalBattles === 0) return 0;
    return (stats.battlesWon / stats.totalBattles) * 100;
  };

  const getSubscriptionColor = (tier: SubscriptionTier): string => {
    return subscriptionTiers[tier].color;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-4xl">
              {userProfile.avatar}
            </div>
            <div className={`absolute -bottom-2 -right-2 px-2 py-1 rounded-full text-xs font-bold ${getSubscriptionColor(userProfile.subscriptionTier)} bg-gray-800 border border-gray-600`}>
              {subscriptionTiers[userProfile.subscriptionTier].icon}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedProfile.username}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, username: e.target.value }))}
                  className="text-2xl font-bold bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={editedProfile.title}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, title: e.target.value }))}
                  className="text-purple-400 bg-gray-800 border border-gray-600 rounded px-3 py-1 focus:outline-none focus:border-blue-500"
                  placeholder="Title (optional)"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{userProfile.username}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                {userProfile.title && (
                  <p className="text-purple-400 font-semibold">{userProfile.title}</p>
                )}
              </>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {formatDate(userProfile.joinDate)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatPlayTime(userProfile.stats.totalPlayTime)} played
              </span>
              <span className={`flex items-center gap-1 ${getSubscriptionColor(userProfile.subscriptionTier)}`}>
                <Crown className="w-4 h-4" />
                {subscriptionTiers[userProfile.subscriptionTier].displayName}
              </span>
            </div>

            {/* Player Level & XP */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-yellow-400 font-semibold">Player Level {playerLevel}</span>
                <span className="text-sm text-gray-400">{xpProgress}/{xpRequiredForNext - getXPRequiredForLevel(playerLevel)} XP</span>
              </div>
              <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                  style={{ width: `${(xpProgress / (xpRequiredForNext - getXPRequiredForLevel(playerLevel))) * 100}%` }}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSaveProfile}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProfile({
                      username: userProfile.username,
                      title: userProfile.title
                    });
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-800/50 rounded-xl p-1 flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'stats', label: 'Statistics', icon: TrendingUp },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'subscription', label: 'Subscription', icon: Crown },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Account Overview</h2>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{userProfile.charactersOwned.length}</div>
                <div className="text-gray-400">Characters</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{userProfile.stats.battlesWon}</div>
                <div className="text-gray-400">Battles Won</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <Star className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{userProfile.stats.highestCharacterLevel}</div>
                <div className="text-gray-400">Highest Level</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Recent Activity</h3>
              <div className="space-y-2 text-gray-300">
                <p>Last active: {formatDate(userProfile.lastActive)}</p>
                <p>Current win streak: {userProfile.stats.winStreak} battles</p>
                <p>Daily play streak: {userProfile.stats.dailyPlayStreak} days</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Battle Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Battle Stats */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Battle Record</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Battles:</span>
                    <span className="text-white font-semibold">{userProfile.stats.totalBattles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Wins:</span>
                    <span className="text-green-400 font-semibold">{userProfile.stats.battlesWon}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Losses:</span>
                    <span className="text-red-400 font-semibold">{userProfile.stats.battlesLost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="text-yellow-400 font-semibold">{getWinRate(userProfile.stats).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Best Streak:</span>
                    <span className="text-purple-400 font-semibold">{userProfile.stats.bestWinStreak}</span>
                  </div>
                </div>
              </div>

              {/* Training Stats */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Training Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sessions:</span>
                    <span className="text-white font-semibold">{userProfile.stats.trainingSessionsCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Training Time:</span>
                    <span className="text-blue-400 font-semibold">{formatPlayTime(userProfile.stats.totalTrainingTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Skills Earned:</span>
                    <span className="text-green-400 font-semibold">{userProfile.stats.skillPointsEarned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Abilities Unlocked:</span>
                    <span className="text-purple-400 font-semibold">{userProfile.stats.abilitiesUnlocked}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Achievements</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProfile.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`border rounded-lg p-4 ${
                    achievement.isCompleted
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <h3 className={`font-semibold ${achievement.isCompleted ? 'text-yellow-400' : 'text-white'}`}>
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-gray-400 capitalize">{achievement.category}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{achievement.description}</p>
                  
                  {!achievement.isCompleted && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="bg-gray-700 rounded-full h-2">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {achievement.isCompleted && achievement.completedDate && (
                    <p className="text-xs text-green-400">
                      Completed {formatDate(achievement.completedDate)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Subscription Management</h2>
            
            {/* Current Subscription */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Current Plan</h3>
                  <p className={`text-lg font-bold ${getSubscriptionColor(userProfile.subscriptionTier)}`}>
                    {subscriptionTiers[userProfile.subscriptionTier].displayName}
                  </p>
                </div>
                <div className="text-4xl">
                  {subscriptionTiers[userProfile.subscriptionTier].icon}
                </div>
              </div>
              
              {userProfile.subscriptionExpiry && (
                <p className="text-gray-400 mb-4">
                  {userProfile.subscriptionTier === 'free' 
                    ? 'Free account - no expiry' 
                    : `Expires: ${formatDate(userProfile.subscriptionExpiry)}`}
                </p>
              )}

              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2">Current Benefits:</h4>
                <ul className="space-y-1">
                  {subscriptionTiers[userProfile.subscriptionTier].benefits.map((benefit, index) => (
                    <li key={index} className="text-gray-300 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Upgrade Options */}
            {userProfile.subscriptionTier !== 'legendary' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Upgrade Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(subscriptionTiers)
                    .filter(([tier]) => subscriptionTiers[tier as SubscriptionTier].priority > subscriptionTiers[userProfile.subscriptionTier].priority)
                    .map(([tier, config]) => (
                      <div key={tier} className="border border-gray-600 rounded-lg p-4">
                        <div className="text-center mb-4">
                          <div className="text-3xl mb-2">{config.icon}</div>
                          <h4 className={`text-lg font-bold ${config.color}`}>{config.displayName}</h4>
                          <p className="text-2xl font-bold text-white">${config.price}/month</p>
                        </div>
                        
                        <ul className="space-y-1 mb-4">
                          {config.benefits.slice(0, 3).map((benefit, index) => (
                            <li key={index} className="text-sm text-gray-300 flex items-center gap-2">
                              <Check className="w-3 h-3 text-green-400" />
                              {benefit}
                            </li>
                          ))}
                          {config.benefits.length > 3 && (
                            <li className="text-sm text-gray-400">
                              +{config.benefits.length - 3} more benefits...
                            </li>
                          )}
                        </ul>
                        
                        <button
                          onClick={() => onUpgradeSubscription?.(tier as SubscriptionTier)}
                          className={`w-full py-2 rounded-lg font-semibold transition-colors bg-gradient-to-r ${config.color.replace('text-', 'from-').replace('-400', '-500')} to-purple-500 text-white hover:opacity-90`}
                        >
                          Upgrade Now
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Account Settings</h2>
            
            {/* Game Preferences */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Game Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2">Battle Animation Speed</label>
                  <select
                    value={localPreferences.battleAnimationSpeed}
                    onChange={(e) => setLocalPreferences(prev => ({ 
                      ...prev, 
                      battleAnimationSpeed: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2">Collection Sort Order</label>
                  <select
                    value={localPreferences.defaultSortOrder}
                    onChange={(e) => setLocalPreferences(prev => ({ 
                      ...prev, 
                      defaultSortOrder: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="recent">Recently Used</option>
                    <option value="level">Highest Level</option>
                    <option value="rarity">Rarity</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                {[
                  { key: 'soundEnabled', label: 'Sound Effects', icon: Bell },
                  { key: 'musicEnabled', label: 'Background Music', icon: Bell },
                  { key: 'notificationsEnabled', label: 'Push Notifications', icon: Bell },
                  { key: 'autoSaveEnabled', label: 'Auto Save Progress', icon: Save },
                  { key: 'expertMode', label: 'Expert Mode', icon: Target }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{label}</span>
                    </div>
                    <button
                      onClick={() => setLocalPreferences(prev => ({ 
                        ...prev, 
                        [key]: !prev[key as keyof UserPreferences] 
                      }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        localPreferences[key as keyof UserPreferences] ? 'bg-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        localPreferences[key as keyof UserPreferences] ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleSavePreferences}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}