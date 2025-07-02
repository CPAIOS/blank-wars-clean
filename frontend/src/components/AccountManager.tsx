'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Users, 
  Package, 
  Crown,
  Sparkles
} from 'lucide-react';
import CharacterCollection from './CharacterCollection';
import UserProfile from './UserProfile';
import { 
  UserProfile as IUserProfile,
  OwnedCharacter,
  SubscriptionTier,
  UserPreferences,
  subscriptionTiers
} from '@/data/userAccount';

interface AccountManagerProps {
  initialUserProfile?: IUserProfile;
  onCharacterSelect?: (character: OwnedCharacter) => void;
  onProfileUpdate?: (profile: IUserProfile) => void;
}

export default function AccountManager({
  initialUserProfile,
  onCharacterSelect,
  onProfileUpdate
}: AccountManagerProps) {
  const [activeTab, setActiveTab] = useState<'collection' | 'profile' | 'packs'>('collection');
  
  // Mock user profile data - in real app this would come from backend
  const [userProfile, setUserProfile] = useState<IUserProfile>(initialUserProfile || {
    id: 'user_001',
    username: 'WarriorMaster',
    email: 'player@example.com',
    avatar: '⚔️',
    title: 'Champion of the Arena',
    playerLevel: 25,
    totalXP: 15000,
    joinDate: new Date('2024-01-15'),
    lastActive: new Date(),
    subscriptionTier: 'silver',
    subscriptionExpiry: new Date('2025-06-01'),
    isActive: true,
    stats: {
      battlesWon: 147,
      battlesLost: 23,
      battlesDraw: 5,
      totalBattles: 175,
      winRate: 84,
      winStreak: 8,
      bestWinStreak: 25,
      trainingSessionsCompleted: 89,
      totalTrainingTime: 1240,
      skillPointsEarned: 156,
      trainingPointsEarned: 89,
      charactersUnlocked: 8,
      totalCharacterLevels: 234,
      highestCharacterLevel: 45,
      goldEarned: 25000,
      goldSpent: 18000,
      itemsUsed: 67,
      equipmentCrafted: 12,
      perfectBattles: 23,
      criticalHitStreak: 15,
      abilitiesUnlocked: 34,
      totalPlayTime: 2100,
      dailyPlayStreak: 12,
      longestPlayStreak: 30
    },
    achievements: [
      {
        id: 'first_victory',
        name: 'First Victory',
        description: 'Win your first battle',
        icon: '🏆',
        rarity: 'common',
        category: 'battle',
        progress: 1,
        maxProgress: 1,
        isCompleted: true,
        completedDate: new Date('2024-01-16'),
        rewards: [{ type: 'gold', amount: 100 }]
      },
      {
        id: 'win_streak_10',
        name: 'Unstoppable',
        description: 'Win 10 battles in a row',
        icon: '🔥',
        rarity: 'rare',
        category: 'battle',
        progress: 10,
        maxProgress: 10,
        isCompleted: true,
        completedDate: new Date('2024-02-01'),
        rewards: [{ type: 'gold', amount: 1000 }]
      },
      {
        id: 'collector_10',
        name: 'Character Collector',
        description: 'Collect 10 different characters',
        icon: '👥',
        rarity: 'uncommon',
        category: 'collection',
        progress: 8,
        maxProgress: 10,
        isCompleted: false,
        rewards: [{ type: 'gold', amount: 500 }]
      }
    ],
    charactersOwned: [
      {
        characterId: 'achilles',
        characterName: 'Achilles',
        archetype: 'warrior',
        rarity: 'legendary',
        acquisitionMethod: 'starter',
        acquisitionDate: new Date('2024-01-15'),
        level: 45,
        xp: 2800,
        totalXP: 25000,
        wins: 89,
        losses: 12,
        draws: 3,
        trainingLevel: 85,
        skillsLearned: ['power_strike', 'defensive_stance', 'berserker_rage'],
        abilitiesUnlocked: ['achilles_wrath', 'shield_bash', 'warrior_instinct'],
        abilityProgress: [
          { abilityId: 'achilles_wrath', rank: 3, experience: 450 },
          { abilityId: 'shield_bash', rank: 2, experience: 200 }
        ],
        equippedItems: {
          weapon: 'excalibur',
          armor: 'plate_mail',
          accessory: 'power_ring'
        },
        nickname: 'The Invincible',
        isFavorite: true,
        isStarter: true,
        lastUsed: new Date(),
        totalBattleTime: 560,
        totalTrainingTime: 240
      },
      {
        characterId: 'merlin',
        characterName: 'Merlin',
        archetype: 'mage',
        rarity: 'epic',
        acquisitionMethod: 'pack',
        acquisitionDate: new Date('2024-01-20'),
        level: 38,
        xp: 1600,
        totalXP: 18000,
        wins: 34,
        losses: 8,
        draws: 1,
        trainingLevel: 72,
        skillsLearned: ['elemental_mastery', 'mana_shield'],
        abilitiesUnlocked: ['arcane_mastery', 'elemental_bolt'],
        abilityProgress: [
          { abilityId: 'arcane_mastery', rank: 2, experience: 300 }
        ],
        equippedItems: {
          weapon: 'elemental_orb',
          armor: 'archmage_robes'
        },
        isFavorite: true,
        isStarter: false,
        lastUsed: new Date(Date.now() - 86400000), // 1 day ago
        totalBattleTime: 420,
        totalTrainingTime: 180
      },
      {
        characterId: 'loki',
        characterName: 'Loki',
        archetype: 'trickster',
        rarity: 'rare',
        acquisitionMethod: 'quest',
        acquisitionDate: new Date('2024-02-10'),
        level: 28,
        xp: 800,
        totalXP: 8000,
        wins: 24,
        losses: 3,
        draws: 1,
        trainingLevel: 45,
        skillsLearned: ['stealth', 'illusion'],
        abilitiesUnlocked: ['shadow_clone', 'cunning'],
        abilityProgress: [],
        equippedItems: {
          weapon: 'shadow_dagger',
          armor: 'assassin_garb'
        },
        isFavorite: false,
        isStarter: false,
        lastUsed: new Date(Date.now() - 172800000), // 2 days ago
        totalBattleTime: 280,
        totalTrainingTime: 120
      }
    ],
    characterSlots: 10,
    maxCharacterSlots: 10,
    currency: {
      gold: 7000,
      gems: 150,
      trainingPoints: 45,
      battleTokens: 12,
      packCredits: 3,
      eventCurrency: 0
    },
    preferences: {
      battleAnimationSpeed: 'normal',
      soundEnabled: true,
      musicEnabled: true,
      notificationsEnabled: true,
      theme: 'dark',
      language: 'en',
      timeZone: 'UTC',
      autoSaveEnabled: true,
      tutorialCompleted: true,
      expertMode: false,
      profilePublic: true,
      showOnlineStatus: true,
      allowFriendRequests: true,
      defaultSortOrder: 'recent',
      showDuplicates: false,
      compactView: false
    }
  });

  const [selectedCharacter, setSelectedCharacter] = useState<OwnedCharacter | null>(null);
  const [showPackOpening, setShowPackOpening] = useState(false);

  // Handle profile updates
  const handleProfileUpdate = (updates: Partial<IUserProfile>) => {
    const updatedProfile = { ...userProfile, ...updates };
    setUserProfile(updatedProfile);
    onProfileUpdate?.(updatedProfile);
  };

  // Handle subscription upgrade
  const handleUpgradeSubscription = (tier: SubscriptionTier) => {
    const tierConfig = subscriptionTiers[tier];
    const updatedProfile = {
      ...userProfile,
      subscriptionTier: tier,
      maxCharacterSlots: tierConfig.characterSlots,
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
    setUserProfile(updatedProfile);
    console.log(`Upgraded to ${tierConfig.displayName} for $${tierConfig.price}/month`);
  };

  // Handle character selection
  const handleCharacterSelect = (character: OwnedCharacter) => {
    setSelectedCharacter(character);
    onCharacterSelect?.(character);
    
    // Update last used time
    const updatedCharacters = userProfile.charactersOwned.map(c =>
      c.characterId === character.characterId 
        ? { ...c, lastUsed: new Date() }
        : c
    );
    
    handleProfileUpdate({ charactersOwned: updatedCharacters });
  };

  // Handle pack opening
  const handleOpenPack = () => {
    if (userProfile.currency.packCredits > 0) {
      setShowPackOpening(true);
      // Simulate pack opening logic here
      // This would normally involve API calls and complex reward generation
      console.log('Opening character pack...');
      
      // Deduct pack credit
      const updatedCurrency = {
        ...userProfile.currency,
        packCredits: userProfile.currency.packCredits - 1
      };
      
      handleProfileUpdate({ currency: updatedCurrency });
    } else {
      console.log('No pack credits available');
    }
  };

  // Handle character management
  const handleManageCharacter = (character: OwnedCharacter) => {
    setSelectedCharacter(character);
    // Could open a detailed management modal or navigate to character details
    console.log('Managing character:', character.characterName);
  };

  // Handle preference updates
  const handleUpdatePreferences = (preferences: UserPreferences) => {
    handleProfileUpdate({ preferences });
  };

  const maxSlots = subscriptionTiers[userProfile.subscriptionTier].characterSlots;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Crown className="w-8 h-8 text-yellow-400" />
          Account Dashboard
        </h1>
        <p className="text-gray-400 text-lg">
          Manage your warriors, track progress, and customize your experience
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-yellow-400">{userProfile.currency.gold.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Gold</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-400">{userProfile.currency.gems}</div>
            <div className="text-xs text-gray-400">Gems</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-400">{userProfile.charactersOwned.length}/{maxSlots}</div>
            <div className="text-xs text-gray-400">Characters</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-400">{userProfile.stats.winStreak}</div>
            <div className="text-xs text-gray-400">Win Streak</div>
          </div>
          <div>
            <div className="text-xl font-bold text-orange-400">{userProfile.playerLevel}</div>
            <div className="text-xs text-gray-400">Player Level</div>
          </div>
          <div>
            <div className="text-xl font-bold text-pink-400">{userProfile.currency.packCredits}</div>
            <div className="text-xs text-gray-400">Pack Credits</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-800/50 rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('collection')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'collection'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Collection</span>
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {userProfile.charactersOwned.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('packs')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'packs'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Packs</span>
            {userProfile.currency.packCredits > 0 && (
              <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                {userProfile.currency.packCredits}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'collection' && (
          <motion.div
            key="collection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <CharacterCollection
              characters={userProfile.charactersOwned}
              subscriptionTier={userProfile.subscriptionTier}
              maxSlots={maxSlots}
              onSelectCharacter={handleCharacterSelect}
              onUpgradeSubscription={() => handleUpgradeSubscription('gold')}
              onOpenPack={handleOpenPack}
              onManageCharacter={handleManageCharacter}
              activeCharacterId={selectedCharacter?.characterId}
            />
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <UserProfile
              userProfile={userProfile}
              onUpdateProfile={handleProfileUpdate}
              onUpgradeSubscription={handleUpgradeSubscription}
              onUpdatePreferences={handleUpdatePreferences}
            />
          </motion.div>
        )}

        {activeTab === 'packs' && (
          <motion.div
            key="packs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="text-center py-12"
          >
            <Package className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Character Packs</h2>
            <p className="text-gray-400 mb-6">
              Open packs to discover new legendary warriors!
            </p>
            
            {userProfile.currency.packCredits > 0 ? (
              <div className="space-y-4">
                <div className="text-lg text-white">
                  You have <span className="text-purple-400 font-bold">{userProfile.currency.packCredits}</span> pack credits available
                </div>
                <button
                  onClick={handleOpenPack}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors flex items-center gap-3 mx-auto"
                >
                  <Sparkles className="w-6 h-6" />
                  Open Character Pack
                  <Sparkles className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-400">No pack credits available</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Pack credits can be earned through:</p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Daily login rewards</li>
                    <li>• Completing achievements</li>
                    <li>• Special events</li>
                    <li>• Subscription benefits</li>
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pack Opening Modal */}
      <AnimatePresence>
        {showPackOpening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPackOpening(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-gray-700 p-8 max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-bold text-white mb-4">Pack Opened!</h2>
              <p className="text-gray-400 mb-6">
                Pack opening system would be implemented here with animations and rewards
              </p>
              <button
                onClick={() => setShowPackOpening(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}