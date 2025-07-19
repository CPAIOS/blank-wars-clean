// Type definitions for Blank Wars

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
  oauth_provider?: string;
  oauth_id?: string;
  subscription_tier: string;
  subscription_expires_at?: Date;
  stripe_customer_id?: string;
  daily_play_seconds: number;
  last_play_reset: Date;
  level: number;
  experience: number;
  total_battles: number;
  total_wins: number;
  rating: number;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_banned: boolean;
  ban_reason?: string;
  character_slot_capacity: number;
  daily_chat_reset_date?: string;
  daily_chat_count?: number;
  daily_image_reset_date?: string;
  daily_image_count?: number;
  daily_battle_reset_date?: string;
  daily_battle_count?: number;
  daily_training_reset_date?: string;
  daily_training_count?: number;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  archetype: 'warrior' | 'scholar' | 'trickster' | 'beast' | 'leader';
  origin_era: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  base_health: number;
  base_attack: number;
  base_defense: number;
  base_speed: number;
  base_special: number;
  personality_traits: string[];
  conversation_style: string;
  backstory: string;
  conversation_topics: string[];
  avatar_emoji: string;
  artwork_url?: string;
  abilities: Ability[];
  created_at: Date;
  training: number;
  team_player: number;
  ego: number;
  mental_health: number;
  communication: number;
}

export interface Ability {
  name: string;
  description: string;
  damage_multiplier: number;
  cooldown: number;
  element?: string;
  effects?: string[];
}

export interface UserCharacter {
  id: string;
  user_id: string;
  character_id: string;
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
  recovery_time?: Date;
  equipment: any[];
  enhancements: any[];
  conversation_memory: ChatMemory[];
  significant_memories: any[];
  personality_drift: any;
  acquired_at: Date;
  last_battle_at?: Date;
  psychstats?: string; // JSONB column stored as string
  battle_count?: number;
  health?: number;
  strength?: number;
  vitality?: number;
  speed?: number;
  intelligence?: number;
  wallet?: number;
  financial_stress?: number;
  coach_trust_level?: number;
}

export interface ChatMemory {
  player_message: string;
  character_response: string;
  timestamp: Date;
  context?: any;
  bond_increase?: boolean;
}

export interface Battle {
  id: string;
  player1_id: string;
  player2_id: string;
  character1_id: string;
  character2_id: string;
  status: 'matchmaking' | 'active' | 'paused' | 'completed';
  current_round: number;
  turn_count: number;
  p1_strategy?: 'aggressive' | 'defensive' | 'balanced';
  p2_strategy?: 'aggressive' | 'defensive' | 'balanced';
  winner_id?: string;
  end_reason?: string;
  combat_log: CombatAction[];
  chat_logs: any[];
  xp_gained: number;
  bond_gained: number;
  currency_gained: number;
  started_at: Date;
  ended_at?: Date;
}

export interface CombatAction {
  round: number;
  turn: number;
  attacker_id: string;
  defender_id: string;
  ability_used: string;
  damage_dealt: number;
  effects_applied?: string[];
  timestamp: Date;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: User;
}

export interface SocketUser {
  userId: string;
  socketId: string;
  currentBattle?: string;
}

export interface UsageLimits {
  [key: string]: any; // Allow dynamic access for subscription tiers
  free: {
    dailyChatLimit: number;
    dailyImageLimit: number;
    dailyBattleLimit: number;
    dailyTrainingLimit: number;
  };
  premium: {
    dailyChatLimit: number;
    dailyImageLimit: number;
    dailyBattleLimit: number;
    dailyTrainingLimit: number;
  };
  legendary: {
    dailyChatLimit: number;
    dailyImageLimit: number;
    dailyBattleLimit: number;
    dailyTrainingLimit: number;
  };
}

export interface UsageStatus {
  canChat: boolean;
  canGenerateImage: boolean;
  canBattle: boolean;
  canTraining: boolean;
  remainingChats: number;
  remainingImages: number;
  remainingBattles: number;
  remainingTraining: number;
  resetTime: string;
}