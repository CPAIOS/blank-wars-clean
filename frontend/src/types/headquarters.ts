// Headquarters progression tiers
export interface HeadquartersTier {
  id: string;
  name: string;
  description: string;
  maxRooms: number;
  charactersPerRoom: number;
  cost: { coins: number; gems: number };
  unlockLevel: number;
  roomUpgrades: string[];
}

// Room themes with battle bonuses
export interface RoomTheme {
  id: string;
  name: string;
  description: string;
  bonus: string;
  bonusValue: number;
  suitableCharacters: string[];
  cost: { coins: number; gems: number };
  backgroundColor: string;
  textColor: string;
  icon: string;
}

// Room element categories for multi-element theming
export interface RoomElement {
  id: string;
  name: string;
  category: 'wallDecor' | 'furniture' | 'lighting' | 'accessories' | 'flooring';
  description: string;
  bonus: string;
  bonusValue: number;
  suitableCharacters: string[];
  cost: { coins: number; gems: number };
  backgroundColor: string;
  textColor: string;
  icon: string;
  compatibleWith: string[]; // Other element IDs that synergize well
  incompatibleWith: string[]; // Other element IDs that clash
}

// Bed types and sleep quality
export interface Bed {
  id: string;
  type: 'bed' | 'bunk_bed' | 'couch' | 'air_mattress';
  position: { x: number; y: number }; // For future positioning
  capacity: number; // 1 for bed/couch, 2 for bunk bed
  comfortBonus: number; // Sleep quality bonus
  cost?: { coins: number; gems: number }; // For purchasable beds
}

// Purchasable bed options
export interface PurchasableBed {
  id: string;
  name: string;
  type: 'bunk_bed' | 'air_mattress';
  description: string;
  capacity: number;
  comfortBonus: number;
  cost: { coins: number; gems: number };
  icon: string;
}

// Room instance with bed system
export interface Room {
  id: string;
  name: string;
  theme: string | null; // Legacy single theme support
  elements: string[]; // New multi-element system
  assignedCharacters: string[];
  maxCharacters: number;
  beds: Bed[]; // New bed system
  customImageUrl?: string; // DALL-E generated image
}

// User headquarters state
export interface HeadquartersState {
  currentTier: string;
  rooms: Room[];
  currency: { coins: number; gems: number };
  unlockedThemes: string[];
}