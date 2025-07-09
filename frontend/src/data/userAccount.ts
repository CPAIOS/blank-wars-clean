// User Account and Character Collection System for _____ Wars
// Complete account management with character roster, progress tracking, and collection mechanics

export type SubscriptionTier = 'free' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
export type CharacterRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type AcquisitionMethod = 'starter' | 'pack' | 'quest' | 'event' | 'premium' | 'achievement';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  title: string;
  playerLevel: number;
  totalXP: number;
  joinDate: Date;
  lastActive: Date;
  characterSlotCapacity: number; // New: Dynamic character slot capacity
  
  // Subscription info
  subscriptionTier: SubscriptionTier;
  subscriptionExpiry?: Date;
  isActive: boolean;
  
  // Currency and resources
  currency: PlayerCurrency;
  
  // Settings and preferences
  preferences: UserPreferences;
}

export interface PlayerStats {
  // Battle statistics
  battlesWon: number;
  battlesLost: number;
  battlesDraw: number;
  totalBattles: number;
  winRate: number;
  winStreak: number;
  bestWinStreak: number;
  
  // Training statistics
  trainingSessionsCompleted: number;
  totalTrainingTime: number; // in minutes
  skillPointsEarned: number;
  trainingPointsEarned: number;
  
  // Character collection
  charactersUnlocked: number;
  totalCharacterLevels: number;
  highestCharacterLevel: number;
  
  // Economy
  goldEarned: number;
  goldSpent: number;
  itemsUsed: number;
  equipmentCrafted: number;
  
  // Special achievements
  perfectBattles: number; // won without taking damage
  criticalHitStreak: number;
  abilitiesUnlocked: number;
  
  // Time tracking
  totalPlayTime: number; // in minutes
  dailyPlayStreak: number;
  longestPlayStreak: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: CharacterRarity;
  category: 'battle' | 'training' | 'collection' | 'progression' | 'social' | 'special';
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  completedDate?: Date;
  rewards: AchievementReward[];
}

export interface AchievementReward {
  type: 'gold' | 'xp' | 'character' | 'item' | 'title' | 'cosmetic';
  amount?: number;
  itemId?: string;
  characterId?: string;
}

export interface OwnedCharacter {
  characterId: string;
  characterName: string;
  archetype: string;
  rarity: CharacterRarity;
  acquisitionMethod: AcquisitionMethod;
  acquisitionDate: Date;
  
  // Character progression
  level: number;
  xp: number;
  totalXP: number;
  
  // Battle stats for this character
  wins: number;
  losses: number;
  draws: number;
  
  // Training progress
  trainingLevel: number;
  skillsLearned: string[];
  abilitiesUnlocked: string[];
  abilityProgress: { abilityId: string; rank: number; experience: number }[];
  
  // Equipment and items
  equippedItems: {
    weapon?: string;
    armor?: string;
    accessory?: string;
  };
  favoriteLoadout?: string;
  
  // Customization
  nickname?: string;
  customAvatar?: string;
  isFavorite: boolean;
  isStarter: boolean;
  
  // Metadata
  lastUsed: Date;
  totalBattleTime: number;
  totalTrainingTime: number;
}

export interface PlayerCurrency {
  gold: number;
  gems: number; // Premium currency
  trainingPoints: number;
  battleTokens: number; // Limited battle attempts
  packCredits: number; // For opening character packs
  eventCurrency: number; // Special event currency
}

export interface UserPreferences {
  // Game settings
  battleAnimationSpeed: 'slow' | 'normal' | 'fast';
  soundEnabled: boolean;
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  
  // Display preferences
  theme: 'dark' | 'light' | 'auto';
  language: string;
  timeZone: string;
  
  // Gameplay preferences
  autoSaveEnabled: boolean;
  tutorialCompleted: boolean;
  expertMode: boolean;
  
  // Privacy settings
  profilePublic: boolean;
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;
  
  // Collection preferences
  defaultSortOrder: 'level' | 'rarity' | 'recent' | 'alphabetical';
  showDuplicates: boolean;
  compactView: boolean;
}

// Subscription tier configuration
export const subscriptionTiers: Record<SubscriptionTier, {
  name: string;
  displayName: string;
  price: number; // monthly USD
  benefits: string[];
  color: string;
  icon: string;
  priority: number;
}> = {
  free: {
    name: 'free',
    displayName: 'Free Player',
    price: 0,
    benefits: [
      '3 character slots',
      'Basic training facilities',
      'Standard battle rewards',
      'Limited daily energy'
    ],
    color: 'text-gray-400',
    icon: '🆓',
    priority: 0
  },
  bronze: {
    name: 'bronze',
    displayName: 'Bronze Warrior',
    price: 4.99,
    benefits: [
      'Access to Bronze training facilities',
      '+25% XP and gold rewards',
      '50% more daily energy',
      'Priority matchmaking'
    ],
    color: 'text-orange-600',
    icon: '🥉',
    priority: 1
  },
  silver: {
    name: 'silver',
    displayName: 'Silver Champion',
    price: 9.99,
    benefits: [
      'Access to Silver training facilities',
      '+50% XP and gold rewards',
      'Double daily energy',
      'Exclusive Silver characters',
      'Advanced battle analytics'
    ],
    color: 'text-gray-300',
    icon: '🥈',
    priority: 2
  },
  gold: {
    name: 'gold',
    displayName: 'Gold Gladiator',
    price: 19.99,
    benefits: [
      'Access to Gold training facilities',
      '+100% XP and gold rewards',
      'Triple daily energy',
      'Exclusive Gold characters',
      'Custom battle arenas',
      'Priority customer support'
    ],
    color: 'text-yellow-400',
    icon: '🥇',
    priority: 3
  },
  platinum: {
    name: 'platinum',
    displayName: 'Platinum Master',
    price: 39.99,
    benefits: [
      'Access to Elite training facilities',
      '+200% XP and gold rewards',
      'Unlimited daily energy',
      'Exclusive Platinum characters',
      'Early access to new content',
      'Custom character skins',
      'VIP tournament access'
    ],
    color: 'text-blue-300',
    icon: '💎',
    priority: 4
  },
  legendary: {
    name: 'legendary',
    displayName: 'Legendary Hero',
    price: 99.99,
    
    benefits: [
      'Access to Legendary facilities',
      '+500% XP and gold rewards',
      'Unlimited everything',
      'All exclusive characters',
      'Beta testing privileges',
      'Personal account manager',
      'Quarterly exclusive events',
      'Custom ability animations'
    ],
    color: 'text-purple-400',
    icon: '👑',
    priority: 5
  }
};

// Character rarity configuration
export const characterRarityConfig: Record<CharacterRarity, {
  name: string;
  color: string;
  textColor: string;
  packProbability: number; // chance in packs (0-1)
  basePower: number; // stat multiplier
  unlockMethod: string[];
  icon: string;
  glowEffect: string;
}> = {
  common: {
    name: 'Common',
    color: 'from-gray-500 to-gray-600',
    textColor: 'text-gray-300',
    packProbability: 0.6,
    basePower: 1.0,
    unlockMethod: ['starter', 'pack', 'quest'],
    icon: '⚪',
    glowEffect: 'shadow-gray-500/30'
  },
  uncommon: {
    name: 'Uncommon',
    color: 'from-green-500 to-green-600',
    textColor: 'text-green-300',
    packProbability: 0.25,
    basePower: 1.15,
    unlockMethod: ['pack', 'quest', 'achievement'],
    icon: '🟢',
    glowEffect: 'shadow-green-500/50'
  },
  rare: {
    name: 'Rare',
    color: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-300',
    packProbability: 0.1,
    basePower: 1.35,
    unlockMethod: ['pack', 'event', 'premium'],
    icon: '🔵',
    glowEffect: 'shadow-blue-500/50'
  },
  epic: {
    name: 'Epic',
    color: 'from-purple-500 to-purple-600',
    textColor: 'text-purple-300',
    packProbability: 0.04,
    basePower: 1.6,
    unlockMethod: ['pack', 'event', 'premium'],
    icon: '🟣',
    glowEffect: 'shadow-purple-500/50'
  },
  legendary: {
    name: 'Legendary',
    color: 'from-yellow-500 to-orange-600',
    textColor: 'text-yellow-300',
    packProbability: 0.009,
    basePower: 2.0,
    unlockMethod: ['event', 'premium', 'achievement'],
    icon: '🟡',
    glowEffect: 'shadow-yellow-500/70'
  },
  mythic: {
    name: 'Mythic',
    color: 'from-pink-500 via-purple-500 to-blue-500',
    textColor: 'text-pink-300',
    packProbability: 0.001,
    basePower: 2.5,
    unlockMethod: ['event', 'premium'],
    icon: '🌟',
    glowEffect: 'shadow-pink-500/70'
  }
};

// Achievement definitions
export const achievements: Achievement[] = [
  // Battle achievements
  {
    id: 'first_victory',
    name: 'First Victory',
    description: 'Win your first battle',
    icon: '🏆',
    rarity: 'common',
    category: 'battle',
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    rewards: [
      { type: 'gold', amount: 100 },
      { type: 'xp', amount: 50 }
    ]
  },
  {
    id: 'win_streak_10',
    name: 'Unstoppable',
    description: 'Win 10 battles in a row',
    icon: '🔥',
    rarity: 'rare',
    category: 'battle',
    progress: 0,
    maxProgress: 10,
    isCompleted: false,
    rewards: [
      { type: 'gold', amount: 1000 },
      { type: 'title', itemId: 'unstoppable_warrior' }
    ]
  },
  {
    id: 'perfect_battles_5',
    name: 'Flawless Fighter',
    description: 'Win 5 battles without taking damage',
    icon: '✨',
    rarity: 'epic',
    category: 'battle',
    progress: 0,
    maxProgress: 5,
    isCompleted: false,
    rewards: [
      { type: 'character', characterId: 'special_variant' },
      { type: 'gold', amount: 2500 }
    ]
  },
  
  // Collection achievements
  {
    id: 'collector_10',
    name: 'Character Collector',
    description: 'Collect 10 different characters',
    icon: '👥',
    rarity: 'uncommon',
    category: 'collection',
    progress: 0,
    maxProgress: 10,
    isCompleted: false,
    rewards: [
      { type: 'gold', amount: 500 },
      { type: 'item', itemId: 'character_slot_expansion' }
    ]
  },
  {
    id: 'legendary_collector',
    name: 'Legend Hunter',
    description: 'Collect a Legendary character',
    icon: '🌟',
    rarity: 'legendary',
    category: 'collection',
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    rewards: [
      { type: 'gold', amount: 5000 },
      { type: 'title', itemId: 'legend_hunter' },
      { type: 'cosmetic', itemId: 'golden_frame' }
    ]
  },
  
  // Training achievements
  {
    id: 'training_master',
    name: 'Training Master',
    description: 'Complete 100 training sessions',
    icon: '💪',
    rarity: 'rare',
    category: 'training',
    progress: 0,
    maxProgress: 100,
    isCompleted: false,
    rewards: [
      { type: 'gold', amount: 1500 },
      { type: 'title', itemId: 'training_master' }
    ]
  },
  
  // Progression achievements
  {
    id: 'level_50_character',
    name: 'Master Warrior',
    description: 'Reach level 50 with any character',
    icon: '⭐',
    rarity: 'epic',
    category: 'progression',
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    rewards: [
      { type: 'character', characterId: 'ascended_variant' },
      { type: 'gold', amount: 10000 }
    ]
  },
  {
    id: 'level_75_character',
    name: 'Legendary Hero',
    description: 'Reach level 75 with any character',
    icon: '🌟',
    rarity: 'legendary',
    category: 'progression',
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    rewards: [
      { type: 'gold', amount: 25000 },
      { type: 'gems', amount: 100 }
    ]
  },
  {
    id: 'level_100_character',
    name: 'Mythic Ascendant',
    description: 'Reach level 100 with any character',
    icon: '🔥',
    rarity: 'mythic',
    category: 'progression',
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    rewards: [
      { type: 'gold', amount: 50000 },
      { type: 'gems', amount: 250 },
      { type: 'character', characterId: 'mythic_variant' }
    ]
  },
  {
    id: 'level_150_character',
    name: 'Transcendent Being',
    description: 'Reach level 150 with any character',
    icon: '⚡',
    rarity: 'legendary',
    category: 'progression',
    progress: 0,
    maxProgress: 1,
    isCompleted: false,
    rewards: [
      { type: 'gold', amount: 100000 },
      { type: 'gems', amount: 500 }
    ]
  }
];

// Helper functions
export function getSubscriptionBenefits(tier: SubscriptionTier): string[] {
  return subscriptionTiers[tier].benefits;
}



export function canUpgradeSubscription(currentTier: SubscriptionTier, targetTier: SubscriptionTier): boolean {
  return subscriptionTiers[targetTier].priority > subscriptionTiers[currentTier].priority;
}

export function calculatePlayerLevel(totalXP: number): number {
  // Player level uses different curve than character levels
  if (totalXP < 1000) return 1;
  return Math.floor(Math.log(totalXP / 100) / Math.log(1.1)) + 1;
}

export function getXPRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(1.1, level - 1));
}

export function updateAchievementProgress(
  achievements: Achievement[], 
  achievementId: string, 
  progress: number
): { updatedAchievements: Achievement[]; newlyCompleted: Achievement[] } {
  const updatedAchievements = [...achievements];
  const newlyCompleted: Achievement[] = [];
  
  const achievementIndex = updatedAchievements.findIndex(a => a.id === achievementId);
  if (achievementIndex >= 0) {
    const achievement = updatedAchievements[achievementIndex];
    const oldProgress = achievement.progress;
    
    achievement.progress = Math.min(achievement.maxProgress, progress);
    
    // Check if newly completed
    if (!achievement.isCompleted && achievement.progress >= achievement.maxProgress) {
      achievement.isCompleted = true;
      achievement.completedDate = new Date();
      newlyCompleted.push(achievement);
    }
  }
  
  return { updatedAchievements, newlyCompleted };
}

export function grantAchievementRewards(
  rewards: AchievementReward[], 
  currency: PlayerCurrency
): PlayerCurrency {
  const updatedCurrency = { ...currency };
  
  rewards.forEach(reward => {
    switch (reward.type) {
      case 'gold':
        updatedCurrency.gold += reward.amount || 0;
        break;
      case 'gems':
        updatedCurrency.gems += reward.amount || 0;
        break;
      // Other reward types would be handled by other systems
    }
  });
  
  return updatedCurrency;
}

export function getCollectionStats(characters: OwnedCharacter[]): {
  totalCharacters: number;
  byRarity: Record<CharacterRarity, number>;
  byArchetype: Record<string, number>;
  averageLevel: number;
  totalLevels: number;
} {
  const stats = {
    totalCharacters: characters.length,
    byRarity: {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0
    } as Record<CharacterRarity, number>,
    byArchetype: {} as Record<string, number>,
    averageLevel: 0,
    totalLevels: 0
  };
  
  characters.forEach(char => {
    stats.byRarity[char.rarity]++;
    stats.byArchetype[char.archetype] = (stats.byArchetype[char.archetype] || 0) + 1;
    stats.totalLevels += char.level;
  });
  
  stats.averageLevel = characters.length > 0 ? stats.totalLevels / characters.length : 0;
  
  return stats;
}

export function generatePackContents(packType: 'basic' | 'premium' | 'legendary'): {
  guaranteedRarity?: CharacterRarity;
  characterCount: number;
  bonusRewards: { type: string; amount: number }[];
} {
  const packConfigs = {
    basic: {
      characterCount: 3,
      bonusRewards: [{ type: 'gold', amount: 100 }]
    },
    premium: {
      guaranteedRarity: 'rare' as CharacterRarity,
      characterCount: 5,
      bonusRewards: [
        { type: 'gold', amount: 500 },
        { type: 'gems', amount: 10 }
      ]
    },
    legendary: {
      guaranteedRarity: 'legendary' as CharacterRarity,
      characterCount: 10,
      bonusRewards: [
        { type: 'gold', amount: 2000 },
        { type: 'gems', amount: 50 },
        { type: 'trainingPoints', amount: 100 }
      ]
    }
  };
  
  return packConfigs[packType];
}