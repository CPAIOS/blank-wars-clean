
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
  Save,
  Image as ImageIcon // Renamed to avoid conflict with HTML ImageElement
} from 'lucide-react';
import CharacterEchoManager from './CharacterEchoManager';
import { echoService, CharacterEcho } from '@/services/echoService';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'achievements' | 'subscription' | 'settings' | 'echoes'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    displayName: userProfile.displayName || userProfile.username, // Use displayName if available
    title: userProfile.title || '',
    avatarUrl: userProfile.avatarUrl || '',
    bio: userProfile.bio || '',
  });
  const [localPreferences, setLocalPreferences] = useState(userProfile.preferences);
  const [echoes, setEchoes] = useState<CharacterEcho[]>([]);
  const [isEchoManagerOpen, setIsEchoManagerOpen] = useState(false);

  const playerLevel = calculatePlayerLevel(userProfile.totalXP);
  const xpRequiredForNext = getXPRequiredForLevel(playerLevel + 1);
  const xpProgress = userProfile.totalXP - getXPRequiredForLevel(playerLevel);

  // Fetch user echoes
  useEffect(() => {
    const fetchEchoes = async () => {
      try {
        const userEchoes = await echoService.getUserEchoes();
        setEchoes(userEchoes);
      } catch (error) {
        console.error('Error fetching echoes:', error);
      }
    };
    fetchEchoes();
  }, []);

  const handleSaveProfile = () => {
    onUpdateProfile?.({
      displayName: editedProfile.displayName,
      title: editedProfile.title,
      avatarUrl: editedProfile.avatarUrl,
      bio: editedProfile.bio,
    });
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
    <div className="max-w-6xl mx-auto space-y-6 p-4 bg-gray-900 text-white min-h-screen font-sans">
      {/* Header */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            {editedProfile.avatarUrl ? (
              <img src={editedProfile.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-5xl font-bold text-white border-4 border-blue-500 shadow-lg">
                {userProfile.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-bold ${getSubscriptionColor(userProfile.subscriptionTier)} bg-gray-800 border border-gray-600 shadow-md`}>
              {subscriptionTiers[userProfile.subscriptionTier].icon}
            </div>
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <ImageIcon className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editedProfile.displayName}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, displayName: e.target.value }))}
                  className="text-3xl font-bold bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-full"
                  placeholder="Display Name"
                />
                <input
                  type="text"
                  value={editedProfile.title}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg text-purple-400 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 w-full"
                  placeholder="Title (optional)"
                />
                <input
                  type="text"
                  value={editedProfile.avatarUrl}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, avatarUrl: e.target.value }))}
                  className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-full"
                  placeholder="Avatar URL (e.g., https://example.com/avatar.png)"
                />
                <textarea
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-full h-24 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                  <h1 className="text-4xl font-bold text-white">{userProfile.displayName || userProfile.username}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors shadow-md"
                    title="Edit Profile"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
                {userProfile.title && (
                  <p className="text-xl text-purple-400 font-semibold mb-3">{userProfile.title}</p>
                )}
                {userProfile.bio && (
                  <p className="text-gray-300 mb-3 leading-relaxed">{userProfile.bio}</p>
                )}
              </>
            )}
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 mt-4 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Joined {formatDate(userProfile.joinDate)}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-400" />
                {formatPlayTime(userProfile.stats.totalPlayTime)} played
              </span>
              <span className={`flex items-center gap-2 ${getSubscriptionColor(userProfile.subscriptionTier)}`}>
                <Crown className="w-5 h-5" />
                {subscriptionTiers[userProfile.subscriptionTier].displayName}
              </span>
            </div>

            {/* Player Level & XP */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-yellow-400 font-semibold text-lg">Player Level {playerLevel}</span>
                <span className="text-sm text-gray-400">{xpProgress}/{xpRequiredForNext - getXPRequiredForLevel(playerLevel)} XP</span>
              </div>
              <div className="bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${(xpProgress / (xpRequiredForNext - getXPRequiredForLevel(playerLevel))) * 100}%` }}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="w-6 h-6" />
                  Save Profile
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProfile({
                      displayName: userProfile.displayName || userProfile.username,
                      title: userProfile.title || '',
                      avatarUrl: userProfile.avatarUrl || '',
                      bio: userProfile.bio || '',
                    });
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <X className="w-6 h-6" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mt-8 mb-6">
        <div className="bg-gray-800/50 rounded-xl p-1 flex gap-2 shadow-xl">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'stats', label: 'Statistics', icon: TrendingUp },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'echoes', label: 'Echoes', icon: Zap },
            { id: 'subscription', label: 'Subscription', icon: Crown },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 text-lg ${
                activeTab === id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-8 shadow-xl">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Account Overview</h2>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-700/70 rounded-lg p-6 text-center shadow-md border border-gray-600">
                <Users className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">{userProfile.charactersOwned.length}</div>
                <div className="text-gray-400 text-lg">Characters</div>
              </div>
              <div className="bg-gray-700/70 rounded-lg p-6 text-center shadow-md border border-gray-600">
                <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">{userProfile.stats.battlesWon}</div>
                <div className="text-gray-400 text-lg">Battles Won</div>
              </div>
              <div className="bg-gray-700/70 rounded-lg p-6 text-center shadow-md border border-gray-600">
                <Star className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">{userProfile.stats.highestCharacterLevel}</div>
                <div className="text-gray-400 text-lg">Highest Level</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">Recent Activity</h3>
              <div className="space-y-3 text-gray-300 text-lg bg-gray-700/70 p-6 rounded-lg shadow-md border border-gray-600">
                <p className="flex items-center gap-2"><Calendar className="w-5 h-5 text-gray-400" /> Last active: {formatDate(userProfile.lastActive)}</p>
                <p className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Current win streak: {userProfile.stats.winStreak} battles</p>
                <p className="flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" /> Daily play streak: {userProfile.stats.dailyPlayStreak} days</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Battle Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Battle Stats */}
              <div className="bg-gray-700/70 rounded-lg p-6 shadow-md border border-gray-600">
                <h3 className="text-2xl font-semibold text-white mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Battle Record</h3>
                <div className="space-y-3 text-lg">
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
              <div className="bg-gray-700/70 rounded-lg p-6 shadow-md border border-gray-600">
                <h3 className="text-2xl font-semibold text-white mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">Training Progress</h3>
                <div className="space-y-3 text-lg">
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
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Achievements</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProfile.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`border rounded-lg p-6 shadow-md ${
                    achievement.isCompleted
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-4xl">{achievement.icon}</span>
                    <div>
                      <h3 className={`font-semibold text-xl ${achievement.isCompleted ? 'text-yellow-400' : 'text-white'}`}>
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-gray-400 capitalize">{achievement.category}</p>
                    </div>
                  </div>
                  <p className="text-base text-gray-300 mb-4">{achievement.description}</p>
                  
                  {!achievement.isCompleted && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="bg-gray-700 rounded-full h-3 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {achievement.isCompleted && achievement.completedDate && (
                    <p className="text-sm text-green-400 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Completed {formatDate(achievement.completedDate)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'echoes' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">Character Echoes</h2>
            
            {/* Echo Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-700/70 rounded-lg p-6 text-center shadow-md border border-gray-600">
                <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">{echoes.reduce((sum, echo) => sum + echo.count, 0)}</div>
                <div className="text-gray-400 text-lg">Total Echoes</div>
              </div>
              <div className="bg-gray-700/70 rounded-lg p-6 text-center shadow-md border border-gray-600">
                <Users className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">{echoes.length}</div>
                <div className="text-gray-400 text-lg">Characters with Echoes</div>
              </div>
              <div className="bg-gray-700/70 rounded-lg p-6 text-center shadow-md border border-gray-600">
                <Star className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">
                  {Math.floor(echoes.reduce((sum, echo) => sum + echo.count, 0) / 3)}
                </div>
                <div className="text-gray-400 text-lg">Potential Ascensions</div>
              </div>
            </div>

            {/* Echo Description */}
            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-6 border border-yellow-600/30">
              <div className="flex items-start gap-4">
                <Zap className="w-8 h-8 text-yellow-400 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">What are Character Echoes?</h3>
                  <p className="text-gray-300 leading-relaxed">
                    When you acquire a character you already own, it transforms into a powerful Echo. 
                    Echoes can be used to ascend your characters, rank up abilities, and unlock new potential. 
                    Each Echo represents the accumulated experience and power of that character.
                  </p>
                </div>
              </div>
            </div>

            {/* Manage Echoes Button */}
            <div className="text-center">
              <button
                onClick={() => setIsEchoManagerOpen(true)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-3 mx-auto"
              >
                <Zap className="w-6 h-6" />
                Manage Character Echoes
                {echoes.length > 0 && (
                  <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                    {echoes.reduce((sum, echo) => sum + echo.count, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Recent Echo Activity */}
            {echoes.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Your Echo Collection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {echoes.slice(0, 6).map((echo) => (
                    <div key={echo.character_id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="w-6 h-6 text-yellow-400" />
                          <div>
                            <div className="text-white font-medium">Character #{echo.character_id}</div>
                            <div className="text-gray-400 text-sm">{echo.count} Echoes</div>
                          </div>
                        </div>
                        <div className="text-yellow-400 font-bold text-lg">{echo.count}x</div>
                      </div>
                    </div>
                  ))}
                </div>
                {echoes.length > 6 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setIsEchoManagerOpen(true)}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      View all {echoes.length} characters with echoes
                    </button>
                  </div>
                )}
              </div>
            )}

            {echoes.length === 0 && (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Echoes Yet</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Open card packs and acquire duplicate characters to start earning powerful Echoes. 
                  Echoes can be used to enhance your existing characters in amazing ways!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Subscription Management</h2>
            
            {/* Current Subscription */}
            <div className="bg-gray-700/70 rounded-lg p-8 shadow-md border border-gray-600">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-white">Current Plan</h3>
                  <p className={`text-xl font-bold ${getSubscriptionColor(userProfile.subscriptionTier)}`}>
                    {subscriptionTiers[userProfile.subscriptionTier].displayName}
                  </p>
                </div>
                <div className="text-5xl">
                  {subscriptionTiers[userProfile.subscriptionTier].icon}
                </div>
              </div>
              
              {userProfile.subscriptionExpiry && (
                <p className="text-gray-400 text-lg mb-6">
                  {userProfile.subscriptionTier === 'free' 
                    ? 'Free account - no expiry' 
                    : `Expires: ${formatDate(userProfile.subscriptionExpiry)}`}
                </p>
              )}

              <div className="mb-6">
                <h4 className="text-xl font-semibold text-white mb-3">Current Benefits:</h4>
                <ul className="space-y-2">
                  {subscriptionTiers[userProfile.subscriptionTier].benefits.map((benefit, index) => (
                    <li key={index} className="text-gray-300 text-lg flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Upgrade Options */}
            {userProfile.subscriptionTier !== 'legendary' && (
              <div>
                <h3 className="text-2xl font-semibold text-white mb-5 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Upgrade Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(subscriptionTiers)
                    .filter(([tier]) => subscriptionTiers[tier as SubscriptionTier].priority > subscriptionTiers[userProfile.subscriptionTier].priority)
                    .map(([tier, config]) => (
                      <div key={tier} className="border border-gray-600 rounded-lg p-6 shadow-md bg-gray-800/50">
                        <div className="text-center mb-5">
                          <div className="text-4xl mb-3">{config.icon}</div>
                          <h4 className={`text-2xl font-bold ${config.color}`}>{config.displayName}</h4>
                          <p className="text-3xl font-bold text-white">${config.price}/month</p>
                        </div>
                        
                        <ul className="space-y-2 mb-6">
                          {config.benefits.slice(0, 3).map((benefit, index) => (
                            <li key={index} className="text-base text-gray-300 flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-400" />
                              {benefit}
                            </li>
                          ))}
                          {config.benefits.length > 3 && (
                            <li className="text-base text-gray-400">
                              +{config.benefits.length - 3} more benefits...
                            </li>
                          )}
                        </ul>
                        
                        <button
                          onClick={() => onUpgradeSubscription?.(tier as SubscriptionTier)}
                          className={`w-full py-3 rounded-lg font-semibold text-lg transition-colors shadow-md bg-gradient-to-r ${config.color.replace('text-', 'from-').replace('-400', '-500')} to-purple-500 text-white hover:opacity-90 transform hover:scale-105`}
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
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Account Settings</h2>
            
            {/* Game Preferences */}
            <div className="bg-gray-700/70 rounded-lg p-8 shadow-md border border-gray-600">
              <h3 className="text-2xl font-semibold text-white mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">Game Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="battleAnimationSpeed" className="block text-gray-300 text-lg font-medium mb-3">Battle Animation Speed</label>
                  <select
                    id="battleAnimationSpeed"
                    value={localPreferences.battleAnimationSpeed}
                    onChange={(e) => setLocalPreferences(prev => ({ 
                      ...prev, 
                      battleAnimationSpeed: e.target.value as any 
                    }))}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-lg"
                  >
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="defaultSortOrder" className="block text-gray-300 text-lg font-medium mb-3">Collection Sort Order</label>
                  <select
                    id="defaultSortOrder"
                    value={localPreferences.defaultSortOrder}
                    onChange={(e) => setLocalPreferences(prev => ({ 
                      ...prev, 
                      defaultSortOrder: e.target.value as any 
                    }))}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 text-lg"
                  >
                    <option value="recent">Recently Used</option>
                    <option value="level">Highest Level</option>
                    <option value="rarity">Rarity</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-8 space-y-5">
                {[
                  { key: 'soundEnabled', label: 'Sound Effects', icon: Bell },
                  { key: 'musicEnabled', label: 'Background Music', icon: Bell },
                  { key: 'notificationsEnabled', label: 'Push Notifications', icon: Bell },
                  { key: 'autoSaveEnabled', label: 'Auto Save Progress', icon: Save },
                  { key: 'expertMode', label: 'Expert Mode', icon: Target }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between bg-gray-900 p-4 rounded-lg shadow-inner border border-gray-700">
                    <div className="flex items-center gap-4">
                      <Icon className="w-6 h-6 text-gray-400" />
                      <span className="text-gray-300 text-lg">{label}</span>
                    </div>
                    <button
                      onClick={() => setLocalPreferences(prev => ({ 
                        ...prev, 
                        [key]: !prev[key as keyof UserPreferences] 
                      }))}
                      className={`relative w-16 h-8 rounded-full transition-colors duration-300 shadow-md ${
                        localPreferences[key as keyof UserPreferences] ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-inner ${
                        localPreferences[key as keyof UserPreferences] ? 'translate-x-8' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleSavePreferences}
                className="mt-8 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Character Echo Manager Modal */}
      <CharacterEchoManager
        echoes={echoes}
        isOpen={isEchoManagerOpen}
        onClose={() => setIsEchoManagerOpen(false)}
        onSpendEchoes={async (characterId: string, amount: number, action: 'ascend' | 'rankUp') => {
          try {
            const result = await echoService.spendEchoes(characterId, amount, action);
            if (result.success) {
              // Refresh echoes
              const updatedEchoes = await echoService.getUserEchoes();
              setEchoes(updatedEchoes);
            }
          } catch (error) {
            console.error('Error spending echoes:', error);
          }
        }}
      />
    </div>
  );
}
