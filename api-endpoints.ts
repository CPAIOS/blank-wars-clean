// Blank Wars API Endpoint Specifications
// RESTful API design with JWT authentication

// Base URL: https://api.blankwars.com/v1

// ===== AUTHENTICATION ENDPOINTS =====

interface AuthEndpoints {
  // Register new user
  "POST /auth/register": {
    body: {
      email: string;
      username: string;
      password: string;
    };
    response: {
      user: {
        id: string;
        username: string;
        email: string;
        subscription_tier: "free" | "premium" | "legendary";
      };
      tokens: {
        access_token: string;
        refresh_token: string;
      };
    };
  };

  // Login
  "POST /auth/login": {
    body: {
      email: string;
      password: string;
    };
    response: {
      user: User;
      tokens: {
        access_token: string;
        refresh_token: string;
      };
    };
  };

  // Refresh token
  "POST /auth/refresh": {
    body: {
      refresh_token: string;
    };
    response: {
      access_token: string;
      refresh_token: string;
    };
  };

  // Logout
  "POST /auth/logout": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    response: {
      message: string;
    };
  };

  // Get current user
  "GET /auth/me": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    response: User;
  };
}

// ===== USER ENDPOINTS =====

interface UserEndpoints {
  // Get user profile
  "GET /users/:userId": {
    response: {
      id: string;
      username: string;
      level: number;
      total_battles: number;
      win_rate: number;
      collection_size: number;
      created_at: string;
    };
  };

  // Update user settings
  "PATCH /users/me": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    body: {
      username?: string;
      avatar?: string;
      settings?: {
        notifications?: boolean;
        public_profile?: boolean;
      };
    };
    response: User;
  };

  // Get user's play time
  "GET /users/me/playtime": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    response: {
      daily_limit_seconds: number;
      used_today_seconds: number;
      remaining_seconds: number;
      resets_at: string; // ISO timestamp
      is_unlimited: boolean;
    };
  };
}

// ===== CHARACTER ENDPOINTS =====

interface CharacterEndpoints {
  // Get all available characters
  "GET /characters": {
    query?: {
      rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
      archetype?: "warrior" | "mage" | "trickster" | "beast" | "leader";
      page?: number;
      limit?: number;
    };
    response: {
      characters: Character[];
      total: number;
      page: number;
      pages: number;
    };
  };

  // Get character details
  "GET /characters/:characterId": {
    response: Character;
  };

  // Get user's character collection
  "GET /users/me/characters": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    response: {
      characters: UserCharacter[];
      total: number;
    };
  };

  // Get specific owned character
  "GET /users/me/characters/:userCharacterId": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    response: UserCharacter;
  };

  // Update character (nickname, equipment)
  "PATCH /users/me/characters/:userCharacterId": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    body: {
      nickname?: string;
      equipment?: string[];
    };
    response: UserCharacter;
  };

  // Heal character
  "POST /users/me/characters/:userCharacterId/heal": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    body: {
      use_item?: boolean; // Use healing item for instant heal
    };
    response: {
      character: UserCharacter;
      item_used?: boolean;
      items_remaining?: number;
    };
  };
}

// ===== CHAT ENDPOINTS =====

interface ChatEndpoints {
  // Send chat message
  "POST /chat/:userCharacterId/message": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    body: {
      message: string;
      context?: {
        battle_id?: string;
        health_percent?: number;
        just_won?: boolean;
        just_lost?: boolean;
        round?: number;
      };
    };
    response: {
      message: {
        id: string;
        player_message: string;
        character_response: string;
        response_type: "template" | "ai" | "cached";
        bond_increased: boolean;
        new_bond_level?: number;
        timestamp: string;
      };
      character: {
        bond_level: number;
        mood: string;
      };
    };
  };

  // Get chat history
  "GET /chat/:userCharacterId/history": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    query?: {
      limit?: number;
      before?: string; // Message ID for pagination
    };
    response: {
      messages: ChatMessage[];
      has_more: boolean;
    };
  };

  // Get character memories
  "GET /chat/:userCharacterId/memories": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    response: {
      bond_level: number;
      significant_memories: Memory[];
      conversation_topics_unlocked: string[];
    };
  };
}

// ===== BATTLE ENDPOINTS =====

interface BattleEndpoints {
  // Find match
  "POST /battles/matchmake": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    body: {
      character_id: string;
      mode: "ranked" | "casual" | "tournament";
    };
    response: {
      status: "searching" | "found";
      queue_position?: number;
      estimated_wait?: number;
      match_id?: string;
    };
  };

  // Start battle
  "POST /battles/start": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    body: {
      character_id: string;
      opponent_id?: string; // For friend battles
    };
    response: {
      battle: Battle;
      websocket_url: string; // For real-time updates
    };
  };

  // Set strategy
  "POST /battles/:battleId/strategy": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    body: {
      strategy: "aggressive" | "defensive" | "balanced";
    };
    response: {
      success: boolean;
      round_starting: boolean;
    };
  };

  // Get battle state
  "GET /battles/:battleId": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    response: Battle;
  };

  // Get battle history
  "GET /users/me/battles": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    query?: {
      character_id?: string;
      limit?: number;
      offset?: number;
    };
    response: {
      battles: BattleHistory[];
      total: number;
      stats: {
        total_battles: number;
        wins: number;
        losses: number;
        win_rate: number;
      };
    };
  };
}

// ===== CARD/PACK ENDPOINTS =====

interface CardEndpoints {
  // Open pack
  "POST /packs/open": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    body: {
      pack_type: "starter" | "premium" | "legendary";
      payment_method?: "gems" | "money";
    };
    response: {
      pack_id: string;
      cards: UserCharacter[];
      animation_seed: number; // For consistent pack opening animation
    };
  };

  // Redeem QR code
  "POST /cards/redeem": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    body: {
      qr_data: string; // Scanned QR code data
    };
    response: {
      success: boolean;
      character?: UserCharacter;
      error?: "invalid" | "already_redeemed" | "expired";
    };
  };

  // Get pack prices
  "GET /packs/prices": {
    response: {
      packs: {
        starter: { gems: 100, usd: 2.99 };
        premium: { gems: 500, usd: 5.99 };
        legendary: { gems: 1000, usd: 12.99 };
      };
    };
  };
}

// ===== PAYMENT ENDPOINTS =====

interface PaymentEndpoints {
  // Create checkout session
  "POST /payments/checkout": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    body: {
      product_type: "subscription" | "pack" | "gems" | "battle_pass";
      product_id: string;
      quantity?: number;
    };
    response: {
      checkout_url: string;
      session_id: string;
    };
  };

  // Get subscription status
  "GET /payments/subscription": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    response: {
      tier: "free" | "premium" | "legendary";
      status: "active" | "cancelled" | "expired";
      expires_at?: string;
      next_billing_date?: string;
      cancel_at_period_end: boolean;
    };
  };

  // Cancel subscription
  "POST /payments/subscription/cancel": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    response: {
      success: boolean;
      cancelled_at: string;
      expires_at: string;
    };
  };

  // Get purchase history
  "GET /payments/history": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    response: {
      purchases: Purchase[];
      total_spent: number;
    };
  };
}

// ===== SOCIAL ENDPOINTS =====

interface SocialEndpoints {
  // Get leaderboard
  "GET /leaderboard": {
    query?: {
      type: "global" | "friends" | "character";
      character_id?: string;
      timeframe: "daily" | "weekly" | "alltime";
      limit?: number;
      offset?: number;
    };
    response: {
      rankings: {
        rank: number;
        user_id: string;
        username: string;
        score: number;
        wins: number;
        character_used?: string;
      }[];
      user_rank?: number;
    };
  };

  // Get/join tournaments
  "GET /tournaments": {
    query?: {
      status: "upcoming" | "active" | "completed";
      limit?: number;
    };
    response: {
      tournaments: Tournament[];
      total: number;
    };
  };

  "POST /tournaments/:tournamentId/join": {
    headers: {
      Authorization: "Bearer <access_token>";
    };
    body: {
      character_id: string;
    };
    response: {
      success: boolean;
      entry_id: string;
      bracket_position?: number;
    };
  };
}

// ===== ADMIN ENDPOINTS (protected) =====

interface AdminEndpoints {
  // Generate QR codes
  "POST /admin/qr/generate": {
    headers: {
      Authorization: "Bearer <admin_token>";
    };
    body: {
      character_id: string;
      quantity: number;
      pack_type: string;
      batch_name: string;
    };
    response: {
      batch_id: string;
      qr_codes: {
        serial: string;
        qr_data: string;
        qr_image_url: string;
      }[];
    };
  };

  // Analytics dashboard
  "GET /admin/analytics": {
    headers: {
      Authorization: "Bearer <admin_token>";
    };
    query?: {
      timeframe: "hour" | "day" | "week" | "month";
      metrics: string[]; // ["dau", "revenue", "battles", etc]
    };
    response: {
      metrics: {
        [key: string]: {
          current: number;
          previous: number;
          change_percent: number;
          chart_data: { time: string; value: number }[];
        };
      };
    };
  };

  // User management
  "GET /admin/users": {
    headers: {
      Authorization: "Bearer <admin_token>";
    };
    query?: {
      search?: string;
      subscription?: string;
      sort?: string;
      limit?: number;
      offset?: number;
    };
    response: {
      users: AdminUser[];
      total: number;
    };
  };
}

// ===== TYPE DEFINITIONS =====

interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  experience: number;
  subscription_tier: "free" | "premium" | "legendary";
  subscription_expires_at?: string;
  daily_play_seconds: number;
  last_play_reset: string;
  created_at: string;
  updated_at: string;
}

interface Character {
  id: string;
  name: string;
  title: string;
  archetype: string;
  origin: string;
  era: string;
  rarity: string;
  base_stats: {
    health: number;
    attack: number;
    defense: number;
    speed: number;
    special: number;
  };
  abilities: Ability[];
  personality: {
    traits: string[];
    conversation_style: string;
    emotional_range: string[];
    conversation_topics: string[];
  };
  dialogue: {
    intro: string;
    victory: string;
    defeat: string;
    bonding: string;
  };
}

interface UserCharacter extends Character {
  user_character_id: string;
  serial_number?: string;
  nickname?: string;
  level: number;
  experience: number;
  bond_level: number;
  total_battles: number;
  total_wins: number;
  current_health: number;
  max_health: number;
  is_injured: boolean;
  recovery_time?: string;
  equipment: string[];
  enhancements: string[];
  acquired_at: string;
  last_battle_at?: string;
}

interface Battle {
  id: string;
  player1: BattlePlayer;
  player2: BattlePlayer;
  status: "waiting" | "active" | "completed";
  current_round: number;
  turn_count: number;
  combat_log: CombatEvent[];
  chat_enabled: boolean;
  winner_id?: string;
  end_reason?: string;
  started_at: string;
  ended_at?: string;
}

interface BattlePlayer {
  user_id: string;
  username: string;
  character: UserCharacter;
  strategy?: "aggressive" | "defensive" | "balanced";
  connection_status: "connected" | "disconnected";
}

interface ChatMessage {
  id: string;
  player_message: string;
  character_response: string;
  response_type: "template" | "ai" | "cached";
  bond_level_at_time: number;
  context?: {
    battle_id?: string;
    health_percent?: number;
    mood?: string;
  };
  created_at: string;
}

interface Memory {
  id: string;
  type: string;
  description: string;
  context: any;
  created_at: string;
}

// ===== ERROR RESPONSES =====

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  status: number;
}

// Common error codes:
// - AUTH_REQUIRED: Missing or invalid token
// - INSUFFICIENT_PERMISSIONS: User lacks required permissions
// - RESOURCE_NOT_FOUND: Requested resource doesn't exist
// - VALIDATION_ERROR: Invalid request body/params
// - RATE_LIMITED: Too many requests
// - PAYMENT_REQUIRED: Feature requires subscription
// - INSUFFICIENT_RESOURCES: Not enough gems/currency
// - CHARACTER_INJURED: Character needs healing
// - DAILY_LIMIT_REACHED: Free play time exhausted