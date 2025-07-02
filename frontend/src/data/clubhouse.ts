// Clubhouse and Social Features System for _____ Wars
// Community interactions, leaderboards, message boards, and graffiti walls

export type MessageType = 'general' | 'battle' | 'strategy' | 'trade' | 'guild' | 'announcement';
export type GraffitiType = 'tag' | 'character_art' | 'symbol' | 'text' | 'battle_scene' | 'meme';
export type LeaderboardType = 'global_power' | 'battle_wins' | 'win_streak' | 'character_collection' | 'guild_power' | 'monthly_battles';

export interface CommunityMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTitle?: string;
  authorLevel: number;
  content: string;
  type: MessageType;
  timestamp: Date;
  likes: number;
  replies: CommunityReply[];
  tags: string[];
  isSticky?: boolean;
  isPinned?: boolean;
  isModerator?: boolean;
  attachments?: MessageAttachment[];
  characterMentions?: string[];
  guildTag?: string;
}

export interface CommunityReply {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorLevel: number;
  content: string;
  timestamp: Date;
  likes: number;
  parentReplyId?: string; // For nested replies
}

export interface MessageAttachment {
  type: 'image' | 'team_composition' | 'battle_replay' | 'character_showcase';
  data: any;
  preview?: string;
}

export interface GraffitiArt {
  id: string;
  artistId: string;
  artistName: string;
  artistLevel: number;
  type: GraffitiType;
  title: string;
  description?: string;
  artData: GraffitiCanvas;
  position: { x: number; y: number; width: number; height: number };
  timestamp: Date;
  likes: number;
  views: number;
  tags: string[];
  isApproved: boolean;
  isFeature: boolean;
  colorPalette: string[];
  tools: string[];
  timeSpent: number; // minutes
  guildTag?: string;
}

export interface GraffitiCanvas {
  width: number;
  height: number;
  layers: GraffitiLayer[];
  background: string;
  effects: GraffitiEffect[];
}

export interface GraffitiLayer {
  id: string;
  name: string;
  strokes: GraffitiStroke[];
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
  visible: boolean;
}

export interface GraffitiStroke {
  id: string;
  tool: 'brush' | 'spray' | 'marker' | 'chalk' | 'stencil' | 'stamp';
  color: string;
  size: number;
  opacity: number;
  points: { x: number; y: number; pressure?: number }[];
  texture?: string;
}

export interface GraffitiEffect {
  type: 'glow' | 'shadow' | 'outline' | 'drip' | 'fade' | 'distress';
  intensity: number;
  color?: string;
  offset?: { x: number; y: number };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  title?: string;
  guildName?: string;
  guildTag?: string;
  value: number;
  change: number; // change from last period
  trend: 'up' | 'down' | 'same';
  additionalStats: Record<string, any>;
}

export interface Guild {
  id: string;
  name: string;
  tag: string; // 3-4 character tag like [WAR]
  description: string;
  motto: string;
  emblem: string;
  foundedDate: Date;
  leaderName: string;
  memberCount: number;
  maxMembers: number;
  totalPower: number;
  guildLevel: number;
  isRecruiting: boolean;
  requirements: {
    minLevel: number;
    minPower: number;
    applicationRequired: boolean;
  };
  perks: GuildPerk[];
  achievements: string[];
  treasury: number;
  weeklyActivity: number;
}

export interface GuildPerk {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  maxLevel: number;
  effect: {
    type: 'stat_boost' | 'resource_bonus' | 'access_unlock' | 'cosmetic';
    value: number;
    description: string;
  };
}

export interface SocialEvent {
  id: string;
  title: string;
  description: string;
  type: 'tournament' | 'art_contest' | 'guild_war' | 'community_challenge' | 'story_event';
  startDate: Date;
  endDate: Date;
  participants: number;
  maxParticipants?: number;
  rewards: EventReward[];
  requirements?: {
    minLevel: number;
    guildRequired?: boolean;
    charactersNeeded?: number;
  };
  status: 'upcoming' | 'active' | 'completed';
  banner: string;
  rules: string[];
}

export interface EventReward {
  rank: string; // '1st', '2nd-5th', 'top 10%', 'participation'
  rewards: {
    type: 'character' | 'currency' | 'item' | 'cosmetic' | 'title';
    id: string;
    amount?: number;
  }[];
}

export interface CommunityStats {
  totalUsers: number;
  activeToday: number;
  messagesPosted: number;
  graffitiCreated: number;
  guildsActive: number;
  battlesCompleted: number;
  topGuilds: string[];
  trendingTags: string[];
  featuredArt: string[];
}

// Sample community data
export const sampleMessages: CommunityMessage[] = [
  {
    id: 'msg_001',
    authorId: 'user_001',
    authorName: 'WarriorKing',
    authorAvatar: '⚔️',
    authorTitle: 'Arena Champion',
    authorLevel: 45,
    content: 'Just discovered that Achilles + Merlin combo is absolutely devastating! The Ancient Legends synergy gives +25% to all stats. Anyone else tried this?',
    type: 'strategy',
    timestamp: new Date('2024-06-25T14:30:00Z'),
    likes: 23,
    replies: [
      {
        id: 'reply_001',
        authorId: 'user_002',
        authorName: 'MageSupreme',
        authorAvatar: '🔮',
        authorLevel: 38,
        content: 'Yes! Add Loki for the full trinity effect. The combination attacks are insane!',
        timestamp: new Date('2024-06-25T14:45:00Z'),
        likes: 12
      }
    ],
    tags: ['strategy', 'synergy', 'achilles', 'merlin'],
    characterMentions: ['achilles', 'merlin'],
    guildTag: 'WAR'
  },
  {
    id: 'msg_002',
    authorId: 'user_003',
    authorName: 'ArtisticSoul',
    authorAvatar: '🎨',
    authorLevel: 22,
    content: 'Check out my new graffiti piece on the north wall! It\'s a tribute to all the beast characters. Took me 3 hours but so worth it! 🐺',
    type: 'general',
    timestamp: new Date('2024-06-25T12:15:00Z'),
    likes: 47,
    replies: [],
    tags: ['art', 'graffiti', 'beast', 'fenrir'],
    attachments: [
      {
        type: 'image',
        data: { url: '/graffiti/beast_tribute.png' },
        preview: 'Amazing wolf art with glowing eyes'
      }
    ]
  },
  {
    id: 'msg_003',
    authorId: 'admin_001',
    authorName: 'GameMaster',
    authorAvatar: '👑',
    authorTitle: 'Community Manager',
    authorLevel: 99,
    content: '🎉 Weekend Tournament starting Friday! Grand prize is a Mythic character pack. Registration opens tomorrow at noon. Good luck warriors!',
    type: 'announcement',
    timestamp: new Date('2024-06-25T09:00:00Z'),
    likes: 156,
    replies: [],
    tags: ['tournament', 'event', 'mythic'],
    isPinned: true,
    isModerator: true
  }
];

export const sampleGraffiti: GraffitiArt[] = [
  {
    id: 'graf_001',
    artistId: 'user_003',
    artistName: 'ArtisticSoul',
    artistLevel: 22,
    type: 'character_art',
    title: 'Fenrir Pack Leader',
    description: 'Homage to the legendary wolf',
    artData: {
      width: 300,
      height: 200,
      layers: [
        {
          id: 'layer_1',
          name: 'Background',
          strokes: [],
          opacity: 1,
          blendMode: 'normal',
          visible: true
        },
        {
          id: 'layer_2',
          name: 'Wolf',
          strokes: [],
          opacity: 0.9,
          blendMode: 'overlay',
          visible: true
        }
      ],
      background: '#1a1a2e',
      effects: [
        {
          type: 'glow',
          intensity: 0.7,
          color: '#00ffff'
        }
      ]
    },
    position: { x: 150, y: 300, width: 300, height: 200 },
    timestamp: new Date('2024-06-25T10:30:00Z'),
    likes: 89,
    views: 234,
    tags: ['fenrir', 'wolf', 'beast', 'blue', 'glow'],
    isApproved: true,
    isFeature: true,
    colorPalette: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#00ffff'],
    tools: ['brush', 'spray', 'glow'],
    timeSpent: 180,
    guildTag: 'ART'
  },
  {
    id: 'graf_002',
    artistId: 'user_004',
    artistName: 'TagMaster',
    artistLevel: 33,
    type: 'tag',
    title: 'Guild War Victory',
    artData: {
      width: 150,
      height: 100,
      layers: [
        {
          id: 'layer_1',
          name: 'Tag',
          strokes: [],
          opacity: 1,
          blendMode: 'normal',
          visible: true
        }
      ],
      background: 'transparent',
      effects: [
        {
          type: 'drip',
          intensity: 0.3
        }
      ]
    },
    position: { x: 500, y: 150, width: 150, height: 100 },
    timestamp: new Date('2024-06-24T20:15:00Z'),
    likes: 34,
    views: 128,
    tags: ['victory', 'guild', 'war', 'red'],
    isApproved: true,
    isFeature: false,
    colorPalette: ['#ff0000', '#cc0000', '#990000'],
    tools: ['marker', 'spray'],
    timeSpent: 45,
    guildTag: 'WAR'
  }
];

export const leaderboards: Record<LeaderboardType, LeaderboardEntry[]> = {
  global_power: [
    {
      rank: 1,
      userId: 'user_001',
      username: 'WarriorKing',
      avatar: '⚔️',
      title: 'Arena Champion',
      guildName: 'Warriors United',
      guildTag: 'WAR',
      value: 45892,
      change: 234,
      trend: 'up',
      additionalStats: { winRate: 94, totalBattles: 456 }
    },
    {
      rank: 2,
      userId: 'user_002',
      username: 'MageSupreme',
      avatar: '🔮',
      guildName: 'Arcane Circle',
      guildTag: 'ARC',
      value: 44128,
      change: -89,
      trend: 'down',
      additionalStats: { winRate: 91, totalBattles: 378 }
    },
    {
      rank: 3,
      userId: 'user_005',
      username: 'ShadowStrike',
      avatar: '🎭',
      title: 'Master Assassin',
      guildName: 'Silent Blades',
      guildTag: 'SHD',
      value: 43567,
      change: 567,
      trend: 'up',
      additionalStats: { winRate: 89, totalBattles: 423 }
    }
  ],
  battle_wins: [
    {
      rank: 1,
      userId: 'user_006',
      username: 'BattleBeast',
      avatar: '🐺',
      guildName: 'Primal Pack',
      guildTag: 'PAK',
      value: 1247,
      change: 23,
      trend: 'up',
      additionalStats: { winRate: 87, currentStreak: 34 }
    }
  ],
  win_streak: [
    {
      rank: 1,
      userId: 'user_007',
      username: 'Unstoppable',
      avatar: '🔥',
      title: 'Streak Master',
      value: 67,
      change: 3,
      trend: 'up',
      additionalStats: { totalWins: 234, bestStreak: 67 }
    }
  ],
  character_collection: [
    {
      rank: 1,
      userId: 'user_008',
      username: 'Collector',
      avatar: '👑',
      title: 'Master Collector',
      value: 47,
      change: 2,
      trend: 'up',
      additionalStats: { mythicCount: 12, legendaryCount: 23 }
    }
  ],
  guild_power: [
    {
      rank: 1,
      userId: 'guild_001',
      username: 'Warriors United',
      avatar: '⚔️',
      value: 234567,
      change: 1234,
      trend: 'up',
      additionalStats: { members: 48, avgLevel: 34 }
    }
  ],
  monthly_battles: [
    {
      rank: 1,
      userId: 'user_009',
      username: 'WarMachine',
      avatar: '⚡',
      value: 189,
      change: 12,
      trend: 'up',
      additionalStats: { winRate: 76, avgBattleTime: 145 }
    }
  ]
};

export const communityStats: CommunityStats = {
  totalUsers: 15432,
  activeToday: 3421,
  messagesPosted: 89234,
  graffitiCreated: 5671,
  guildsActive: 234,
  battlesCompleted: 456789,
  topGuilds: ['Warriors United', 'Arcane Circle', 'Silent Blades'],
  trendingTags: ['synergy', 'tournament', 'fenrir', 'strategy', 'graffiti'],
  featuredArt: ['graf_001', 'graf_003', 'graf_007']
};

export const activeEvents: SocialEvent[] = [
  {
    id: 'event_001',
    title: 'Weekend Warriors Tournament',
    description: 'Compete for the ultimate prize - a guaranteed Mythic character!',
    type: 'tournament',
    startDate: new Date('2024-06-28T12:00:00Z'),
    endDate: new Date('2024-06-30T23:59:59Z'),
    participants: 2341,
    maxParticipants: 5000,
    rewards: [
      {
        rank: '1st',
        rewards: [
          { type: 'character', id: 'mythic_pack' },
          { type: 'currency', id: 'gems', amount: 1000 },
          { type: 'title', id: 'tournament_champion' }
        ]
      },
      {
        rank: '2nd-10th',
        rewards: [
          { type: 'character', id: 'legendary_pack' },
          { type: 'currency', id: 'gems', amount: 500 }
        ]
      }
    ],
    requirements: {
      minLevel: 15,
      charactersNeeded: 3
    },
    status: 'upcoming',
    banner: '/events/weekend_warriors.jpg',
    rules: [
      'Best of 5 battles format',
      'No duplicate characters in team',
      'All formations allowed',
      'Fair play required - no exploits'
    ]
  },
  {
    id: 'event_002',
    title: 'Graffiti Art Contest',
    description: 'Show off your artistic skills! Best graffiti wins exclusive cosmetics.',
    type: 'art_contest',
    startDate: new Date('2024-06-26T00:00:00Z'),
    endDate: new Date('2024-07-03T23:59:59Z'),
    participants: 456,
    rewards: [
      {
        rank: '1st',
        rewards: [
          { type: 'cosmetic', id: 'legendary_artist_frame' },
          { type: 'title', id: 'master_artist' },
          { type: 'currency', id: 'gems', amount: 750 }
        ]
      }
    ],
    status: 'active',
    banner: '/events/art_contest.jpg',
    rules: [
      'Original artwork only',
      'No inappropriate content',
      'Must use in-game graffiti tools',
      'Voting by community'
    ]
  }
];

// Helper functions
export function getMessagesByType(messages: CommunityMessage[], type: MessageType): CommunityMessage[] {
  return messages.filter(msg => msg.type === type);
}

export function searchMessages(messages: CommunityMessage[], query: string): CommunityMessage[] {
  const lowercaseQuery = query.toLowerCase();
  return messages.filter(msg => 
    msg.content.toLowerCase().includes(lowercaseQuery) ||
    msg.authorName.toLowerCase().includes(lowercaseQuery) ||
    msg.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function getTrendingTags(messages: CommunityMessage[], limit: number = 10): string[] {
  const tagCounts: Record<string, number> = {};
  
  messages.forEach(msg => {
    msg.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function getGraffitiByTag(graffiti: GraffitiArt[], tag: string): GraffitiArt[] {
  return graffiti.filter(art => art.tags.includes(tag));
}

export function getFeaturedGraffiti(graffiti: GraffitiArt[]): GraffitiArt[] {
  return graffiti
    .filter(art => art.isFeature)
    .sort((a, b) => b.likes - a.likes);
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

export function calculateGuildRank(guild: Guild, allGuilds: Guild[]): number {
  const sortedGuilds = allGuilds.sort((a, b) => b.totalPower - a.totalPower);
  return sortedGuilds.findIndex(g => g.id === guild.id) + 1;
}