-- Blank Wars Database Setup Script
-- PostgreSQL 15+ recommended
-- Run this script to create all tables, indexes, and initial data

-- Create database (run as superuser)
-- CREATE DATABASE blankwars;
-- \c blankwars;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'legendary');
CREATE TYPE character_archetype AS ENUM ('warrior', 'scholar', 'trickster', 'beast', 'leader', 'mystic', 'tank', 'assassin');
CREATE TYPE character_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic');
CREATE TYPE battle_status AS ENUM ('matchmaking', 'active', 'paused', 'completed');
CREATE TYPE battle_strategy AS ENUM ('aggressive', 'defensive', 'balanced');
CREATE TYPE tournament_status AS ENUM ('upcoming', 'registration', 'active', 'completed');
CREATE TYPE tournament_format AS ENUM ('single_elimination', 'swiss', 'round_robin');

-- =====================================================
-- USER SYSTEM TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    oauth_provider VARCHAR(20),
    oauth_id VARCHAR(255),
    
    -- Subscription info
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    stripe_customer_id VARCHAR(255),
    
    -- Play time tracking
    daily_play_seconds INTEGER DEFAULT 0,
    last_play_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- User stats
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    total_battles INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    character_slot_capacity INTEGER DEFAULT 12, -- Default capacity for characters
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_subscription (subscription_tier)
);

-- Refresh tokens for JWT auth
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_refresh_tokens_user (user_id),
    INDEX idx_refresh_tokens_token (token)
);

-- =====================================================
-- CHARACTER SYSTEM TABLES
-- =====================================================

-- Master character registry
CREATE TABLE characters (
    id VARCHAR(20) PRIMARY KEY, -- e.g., 'char_001'
    name VARCHAR(100) NOT NULL,
    title VARCHAR(200),
    archetype character_archetype NOT NULL,
    origin_era VARCHAR(100),
    origin_location VARCHAR(100),
    rarity character_rarity NOT NULL,
    
    -- Base stats
    base_health INTEGER NOT NULL CHECK (base_health > 0),
    base_attack INTEGER NOT NULL CHECK (base_attack > 0),
    base_defense INTEGER NOT NULL CHECK (base_defense > 0),
    base_speed INTEGER NOT NULL CHECK (base_speed > 0),
    base_special INTEGER NOT NULL CHECK (base_special > 0),
    
    -- AI personality (JSONB for flexibility)
    personality_traits JSONB NOT NULL DEFAULT '[]',
    conversation_style VARCHAR(100),
    backstory TEXT,
    emotional_range JSONB DEFAULT '[]',
    conversation_topics JSONB DEFAULT '[]',
    
    -- Dialogue samples
    dialogue_intro TEXT,
    dialogue_victory TEXT,
    dialogue_defeat TEXT,
    dialogue_bonding TEXT,
    
    -- Visual
    avatar_emoji VARCHAR(10),
    artwork_url VARCHAR(500),
    
    -- Abilities (JSONB array)
    abilities JSONB NOT NULL DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes
    INDEX idx_characters_rarity (rarity),
    INDEX idx_characters_archetype (archetype)
);

-- User's character collection
CREATE TABLE user_characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id VARCHAR(20) NOT NULL REFERENCES characters(id),
    nickname VARCHAR(50),
    
    -- Progression
    level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
    experience INTEGER DEFAULT 0,
    bond_level INTEGER DEFAULT 0 CHECK (bond_level >= 0 AND bond_level <= 10),
    total_battles INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    
    -- Current state
    current_health INTEGER NOT NULL,
    max_health INTEGER NOT NULL,
    is_injured BOOLEAN DEFAULT FALSE,
    recovery_time TIMESTAMP,
    
    -- Customization
    equipment JSONB DEFAULT '[]',
    enhancements JSONB DEFAULT '[]',
    skin_id VARCHAR(50),
    
    -- AI memory
    conversation_memory JSONB DEFAULT '[]',
    significant_memories JSONB DEFAULT '[]',
    personality_drift JSONB DEFAULT '{}',
    last_chat_at TIMESTAMP,
    
    -- Metadata
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acquired_from VARCHAR(50), -- 'starter', 'pack', 'qr', 'event', etc.
    last_battle_at TIMESTAMP,
    
    -- Indexes
    INDEX idx_user_characters_user (user_id),
    INDEX idx_user_characters_bond (bond_level),
    
    -- Constraints
    UNIQUE(user_id, character_id)
);

-- =====================================================
-- BATTLE SYSTEM TABLES
-- =====================================================

-- Battle records
CREATE TABLE battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Players
    player1_id UUID NOT NULL REFERENCES users(id),
    player2_id UUID NOT NULL REFERENCES users(id),
    character1_id UUID NOT NULL REFERENCES user_characters(id),
    character2_id UUID NOT NULL REFERENCES user_characters(id),
    
    -- Battle state
    status battle_status DEFAULT 'matchmaking',
    current_round INTEGER DEFAULT 1 CHECK (current_round >= 1 AND current_round <= 10),
    turn_count INTEGER DEFAULT 0,
    
    -- Strategies
    p1_strategy battle_strategy,
    p2_strategy battle_strategy,
    
    -- Results
    winner_id UUID REFERENCES users(id),
    end_reason VARCHAR(50), -- 'knockout', 'rounds_complete', 'forfeit', 'disconnect'
    
    -- Battle data
    combat_log JSONB DEFAULT '[]',
    chat_logs JSONB DEFAULT '[]',
    
    -- Rewards
    xp_gained INTEGER DEFAULT 0,
    bond_gained INTEGER DEFAULT 0,
    currency_gained INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- Indexes
    INDEX idx_battles_players (player1_id, player2_id),
    INDEX idx_battles_status (status),
    INDEX idx_battles_started (started_at DESC)
);

-- Battle queue for matchmaking
CREATE TABLE battle_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES user_characters(id),
    queue_type VARCHAR(20) DEFAULT 'ranked', -- 'ranked', 'casual', 'tournament'
    rating INTEGER DEFAULT 1000,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_queue_type_rating (queue_type, rating),
    UNIQUE(user_id)
);

-- =====================================================
-- CHAT SYSTEM TABLES
-- =====================================================

-- Chat messages between players and characters
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES user_characters(id) ON DELETE CASCADE,
    battle_id UUID REFERENCES battles(id),
    
    -- Message content
    player_message TEXT NOT NULL,
    character_response TEXT NOT NULL,
    response_type VARCHAR(20) DEFAULT 'template', -- 'template', 'ai', 'cached'
    
    -- Context
    message_context JSONB,
    battle_round INTEGER,
    character_health_percent INTEGER,
    
    -- AI metrics
    model_used VARCHAR(50),
    tokens_used INTEGER,
    response_time_ms INTEGER,
    api_cost_cents DECIMAL(10,4),
    
    -- Bonding
    bond_increase BOOLEAN DEFAULT FALSE,
    memory_saved BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_chat_user_char (user_id, character_id),
    INDEX idx_chat_created (created_at DESC),
    INDEX idx_chat_battle (battle_id)
);

-- =====================================================
-- CARD PACK & QR SYSTEM TABLES
-- =====================================================

-- Card pack definitions
CREATE TABLE card_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_type VARCHAR(50) NOT NULL,
    pack_series VARCHAR(50),
    pack_name VARCHAR(100),
    
    -- Contents
    cards_count INTEGER NOT NULL,
    guaranteed_rarity character_rarity,
    rarity_weights JSONB NOT NULL, -- {"common": 0.6, "uncommon": 0.3, ...}
    
    -- Pricing
    price_usd DECIMAL(10,2),
    price_gems INTEGER,
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    available_from TIMESTAMP,
    available_until TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QR code registry
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number VARCHAR(20) UNIQUE NOT NULL,
    character_id VARCHAR(20) NOT NULL REFERENCES characters(id),
    pack_id UUID REFERENCES card_packs(id),
    
    -- Security
    signature VARCHAR(255) NOT NULL,
    batch_id VARCHAR(50),
    batch_name VARCHAR(100),
    
    -- Redemption
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_by UUID REFERENCES users(id),
    redeemed_at TIMESTAMP,
    
    -- Validity
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '2 years',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_qr_unredeemed (is_redeemed) WHERE is_redeemed = FALSE,
    INDEX idx_qr_serial (serial_number),
    INDEX idx_qr_batch (batch_id)
);

-- =====================================================
-- CARD PACK & GIFTING SYSTEM TABLES
-- =====================================================

-- Claimable Packs (for gifts, special offers, etc.)
CREATE TABLE claimable_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_type VARCHAR(50) NOT NULL, -- e.g., 'standard_starter', 'premium_starter', 'gift_pack_common'
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP
);

-- Contents of Claimable Packs
CREATE TABLE claimable_pack_contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_id UUID NOT NULL REFERENCES claimable_packs(id) ON DELETE CASCADE,
    character_id VARCHAR(20) NOT NULL REFERENCES characters(id),
    is_granted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CHARACTER ECHO SYSTEM TABLES
-- =====================================================

-- User's Character Echoes (for duplicate characters)
CREATE TABLE user_character_echoes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_template_id VARCHAR(20) NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    echo_count INTEGER DEFAULT 0 CHECK (echo_count >= 0),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, character_template_id)
);

-- =====================================================
-- PAYMENT & ECONOMY TABLES
-- =====================================================

-- User currency balances
CREATE TABLE user_currency (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    gems INTEGER DEFAULT 0 CHECK (gems >= 0),
    essence INTEGER DEFAULT 0 CHECK (essence >= 0), -- From duplicate cards
    battle_tokens INTEGER DEFAULT 0 CHECK (battle_tokens >= 0),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User friendships/social connections
CREATE TABLE user_friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate friendships and self-friending
    UNIQUE(user_id, friend_id),
    CHECK(user_id != friend_id),
    
    -- Indexes for performance
    INDEX idx_friendships_user (user_id),
    INDEX idx_friendships_friend (friend_id),
    INDEX idx_friendships_status (status)
);

-- Purchase history
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Purchase details
    product_type VARCHAR(50) NOT NULL, -- 'subscription', 'pack', 'gems', 'battle_pass'
    product_id VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    
    -- Payment info
    amount_usd DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50), -- 'stripe', 'paypal', 'apple', 'google'
    payment_id VARCHAR(255), -- External payment ID
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_purchases_user (user_id),
    INDEX idx_purchases_created (created_at DESC),
    INDEX idx_purchases_status (status)
);

-- =====================================================
-- TOURNAMENT SYSTEM TABLES
-- =====================================================

-- Tournament definitions
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Rules
    format tournament_format NOT NULL,
    max_participants INTEGER DEFAULT 32,
    character_restrictions JSONB DEFAULT '{}',
    entry_fee_gems INTEGER DEFAULT 0,
    
    -- Schedule
    registration_starts TIMESTAMP,
    registration_ends TIMESTAMP,
    tournament_starts TIMESTAMP,
    tournament_ends TIMESTAMP,
    
    -- State
    status tournament_status DEFAULT 'upcoming',
    current_round INTEGER DEFAULT 0,
    brackets JSONB DEFAULT '{}',
    
    -- Prizes
    prize_pool JSONB DEFAULT '{}', -- {"1st": {"gems": 1000}, "2nd": {...}}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_tournaments_status (status),
    INDEX idx_tournaments_starts (tournament_starts)
);

-- Tournament participants
CREATE TABLE tournament_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    character_id UUID NOT NULL REFERENCES user_characters(id),
    
    -- Progress
    current_round INTEGER DEFAULT 1,
    is_eliminated BOOLEAN DEFAULT FALSE,
    final_placement INTEGER,
    
    -- Stats
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_participants_tournament (tournament_id),
    INDEX idx_participants_user (user_id),
    
    -- Constraints
    UNIQUE(tournament_id, user_id)
);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- Event tracking (partitioned by month)
CREATE TABLE analytics_events (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    
    -- Event data
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50),
    event_data JSONB DEFAULT '{}',
    
    -- Context
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    platform VARCHAR(20), -- 'web', 'ios', 'android'
    app_version VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Partitioning
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create initial partitions
CREATE TABLE analytics_events_2024_11 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
    
CREATE TABLE analytics_events_2024_12 PARTITION OF analytics_events
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- Indexes on partitioned table
CREATE INDEX idx_analytics_user_created ON analytics_events (user_id, created_at);
CREATE INDEX idx_analytics_type_created ON analytics_events (event_type, created_at);

-- =====================================================
-- INITIAL DATA INSERTION
-- =====================================================

-- Insert card pack types
INSERT INTO card_packs (pack_type, pack_series, pack_name, cards_count, guaranteed_rarity, rarity_weights, price_usd, price_gems) VALUES
('starter', 'core', 'Starter Pack', 5, 'uncommon', '{"common": 0.65, "uncommon": 0.30, "rare": 0.05}', 2.99, 100),
('premium', 'core', 'Premium Pack', 8, 'rare', '{"common": 0.45, "uncommon": 0.35, "rare": 0.15, "epic": 0.04, "legendary": 0.01}', 5.99, 500),
('legendary', 'core', 'Legendary Pack', 10, 'epic', '{"common": 0.20, "uncommon": 0.35, "rare": 0.30, "epic": 0.12, "legendary": 0.03}', 12.99, 1000);

-- Insert all 17 characters from frontend with complete data preserved
INSERT INTO characters (
    id, name, title, archetype, origin_era, rarity, 
    base_health, base_attack, base_defense, base_speed, base_special,
    personality_traits, conversation_style, backstory, conversation_topics, avatar_emoji, abilities
) VALUES
('achilles', 'Achilles', 'Hero of Troy', 'warrior', 'Ancient Greece (1200 BCE)', 'legendary', 
 1200, 185, 120, 140, 90,
 '["Honorable", "Wrathful", "Courageous", "Prideful"]',
 'Noble and passionate',
 'The greatest warrior of the Trojan War, nearly invincible in combat but driven by rage and honor.',
 '["Glory", "Honor", "Revenge", "Troy", "Combat"]',
 '⚔️',
 '{"baseStats": {"strength": 95, "agility": 85, "intelligence": 60, "vitality": 90, "wisdom": 45, "charisma": 80}, "combatStats": {"maxHealth": 1200, "maxMana": 300, "magicAttack": 50, "magicDefense": 80, "criticalChance": 25, "criticalDamage": 200, "accuracy": 90, "evasion": 20}, "battleAI": {"aggression": 90, "defensiveness": 30, "riskTaking": 80, "adaptability": 60, "preferredStrategies": ["frontal_assault", "berserker_rush", "honor_duel"]}, "battleQuotes": ["For glory and honor!", "Face me if you dare!", "The gods smile upon me!", "None can stand against my might!"]}'),

('merlin', 'Merlin', 'Archmage of Camelot', 'scholar', 'Medieval Britain (5th-6th century)', 'mythic',
 800, 60, 80, 90, 100,
 '["Wise", "Mysterious", "Patient", "Calculating"]',
 'Archaic and profound',
 'The legendary wizard advisor to King Arthur, master of ancient magic and prophecy.',
 '["Knowledge", "Balance", "Protecting the realm", "Magic", "Time"]',
 '🔮',
 '{"baseStats": {"strength": 30, "agility": 50, "intelligence": 98, "vitality": 70, "wisdom": 95, "charisma": 85}, "combatStats": {"maxHealth": 800, "maxMana": 2000, "magicAttack": 200, "magicDefense": 180, "criticalChance": 15, "criticalDamage": 300, "accuracy": 95, "evasion": 25}, "battleAI": {"aggression": 40, "defensiveness": 80, "riskTaking": 30, "adaptability": 95, "preferredStrategies": ["spell_weaving", "defensive_barriers", "elemental_control"]}, "battleQuotes": ["The ancient words have power...", "Magic flows through all things", "By the old ways, I command thee!", "Witness the might of ages past"]}'),

('fenrir', 'Fenrir', 'The Great Wolf', 'beast', 'Norse Age (8th-11th century)', 'legendary',
 1400, 170, 100, 180, 95,
 '["Savage", "Loyal", "Vengeful", "Primal"]',
 'Growling and direct',
 'The monstrous wolf of Norse mythology, prophesied to devour Odin during Ragnarök.',
 '["Freedom", "Vengeance", "Pack loyalty", "The hunt"]',
 '🐺',
 '{"baseStats": {"strength": 90, "agility": 95, "intelligence": 40, "vitality": 95, "wisdom": 30, "charisma": 50}, "combatStats": {"maxHealth": 1400, "maxMana": 200, "magicAttack": 30, "magicDefense": 60, "criticalChance": 30, "criticalDamage": 220, "accuracy": 88, "evasion": 30}, "battleAI": {"aggression": 95, "defensiveness": 20, "riskTaking": 85, "adaptability": 40, "preferredStrategies": ["savage_rush", "pack_tactics", "intimidation"]}, "battleQuotes": ["*Fierce growling*", "The hunt begins!", "*Howls menacingly*", "You smell of fear..."]}'),

('cleopatra', 'Cleopatra VII', 'Last Pharaoh of Egypt', 'mystic', 'Ptolemaic Egypt (69-30 BCE)', 'epic',
 900, 80, 95, 110, 95,
 '["Brilliant", "Charismatic", "Ambitious", "Diplomatic"]',
 'Regal and commanding',
 '["Power", "Legacy", "Egyptian restoration", "Politics"]',
 '👑',
 '{"baseStats": {"strength": 45, "agility": 65, "intelligence": 90, "vitality": 70, "wisdom": 85, "charisma": 98}, "combatStats": {"maxHealth": 900, "maxMana": 1600, "magicAttack": 150, "magicDefense": 160, "criticalChance": 20, "criticalDamage": 150, "accuracy": 80, "evasion": 35}, "battleAI": {"aggression": 50, "defensiveness": 70, "riskTaking": 60, "adaptability": 85, "preferredStrategies": ["strategic_planning", "diplomatic_solutions", "resource_manipulation"]}, "battleQuotes": ["I am the daughter of Ra!", "Egypt\'s glory shall not fade", "Bow before the true pharaoh", "The gods favor the worthy"]}'),

('holmes', 'Sherlock Holmes', 'The Great Detective', 'scholar', 'Victorian England (1880s-1920s)', 'rare',
 700, 85, 70, 120, 100,
 '["Analytical", "Observant", "Eccentric", "Brilliant"]',
 'Precise and deductive',
 '["Truth", "Justice", "Intellectual challenge", "Crime", "Logic"]',
 '🕵️',
 '{"baseStats": {"strength": 60, "agility": 80, "intelligence": 98, "vitality": 55, "wisdom": 90, "charisma": 70}, "combatStats": {"maxHealth": 700, "maxMana": 1400, "magicAttack": 120, "magicDefense": 100, "criticalChance": 35, "criticalDamage": 250, "accuracy": 95, "evasion": 40}, "battleAI": {"aggression": 30, "defensiveness": 60, "riskTaking": 40, "adaptability": 95, "preferredStrategies": ["analytical_combat", "precision_strikes", "enemy_prediction"]}, "battleQuotes": ["Elementary, my dear Watson", "The game is afoot!", "I observe everything", "Logic is my weapon"]}'),

('dracula', 'Count Dracula', 'Lord of the Undead', 'mystic', 'Victorian Horror (1897)', 'legendary',
 1100, 140, 90, 130, 90,
 '["Aristocratic", "Manipulative", "Ancient", "Predatory"]',
 'Eloquent and menacing',
 '["Immortality", "Power over mortals", "The night", "Blood", "Dominion"]',
 '🧛',
 '{"baseStats": {"strength": 85, "agility": 90, "intelligence": 80, "vitality": 95, "wisdom": 75, "charisma": 95}, "combatStats": {"maxHealth": 1100, "maxMana": 1200, "magicAttack": 160, "magicDefense": 140, "criticalChance": 25, "criticalDamage": 180, "accuracy": 85, "evasion": 45}, "battleAI": {"aggression": 70, "defensiveness": 50, "riskTaking": 65, "adaptability": 80, "preferredStrategies": ["life_drain", "fear_tactics", "supernatural_powers"]}, "battleQuotes": ["Welcome to my domain", "I have crossed oceans of time", "The night is mine", "You cannot escape the darkness"]}'),

('joan', 'Joan of Arc', 'The Maid of Orléans', 'warrior', 'Medieval France (1412-1431)', 'epic',
 1000, 150, 130, 115, 85,
 '["Devout", "Courageous", "Determined", "Inspirational"]',
 'Passionate and faithful',
 '["Divine mission", "France", "Faith", "Liberation", "Divine guidance"]',
 '⚔️',
 '{"baseStats": {"strength": 75, "agility": 70, "intelligence": 65, "vitality": 85, "wisdom": 80, "charisma": 90}, "combatStats": {"maxHealth": 1000, "maxMana": 800, "magicAttack": 100, "magicDefense": 120, "criticalChance": 20, "criticalDamage": 170, "accuracy": 85, "evasion": 25}, "battleAI": {"aggression": 75, "defensiveness": 60, "riskTaking": 70, "adaptability": 65, "preferredStrategies": ["holy_charge", "protective_leadership", "divine_intervention"]}, "battleQuotes": ["God wills it!", "For France and freedom!", "I fear nothing but God", "The Lord guides my blade"]}'),

('frankenstein_monster', 'Frankenstein\'s Monster', 'The Created Being', 'tank', 'Gothic Horror (1818)', 'rare',
 1600, 160, 140, 60, 70,
 '["Misunderstood", "Tormented", "Intelligent", "Lonely"]',
 'Eloquent but pained',
 '["Acceptance", "Understanding humanity", "Creator\'s responsibility", "Isolation"]',
 '🧟',
 '{"baseStats": {"strength": 95, "agility": 30, "intelligence": 70, "vitality": 100, "wisdom": 60, "charisma": 20}, "combatStats": {"maxHealth": 1600, "maxMana": 400, "magicAttack": 40, "magicDefense": 80, "criticalChance": 15, "criticalDamage": 200, "accuracy": 70, "evasion": 10}, "battleAI": {"aggression": 60, "defensiveness": 80, "riskTaking": 50, "adaptability": 55, "preferredStrategies": ["overwhelming_force", "defensive_endurance", "emotional_appeals"]}, "battleQuotes": ["I am not a monster!", "Why do you fear me?", "I seek only understanding", "Your creator made me this way"]}'),

('sun_wukong', 'Sun Wukong', 'The Monkey King', 'trickster', 'Chinese Mythology (Journey to the West)', 'mythic',
 1300, 175, 85, 200, 98,
 '["Mischievous", "Proud", "Clever", "Rebellious"]',
 'Playful and irreverent',
 '["Freedom from authority", "Magical tricks", "Journey adventures", "Immortality"]',
 '🐵',
 '{"baseStats": {"strength": 90, "agility": 100, "intelligence": 85, "vitality": 90, "wisdom": 70, "charisma": 80}, "combatStats": {"maxHealth": 1300, "maxMana": 1800, "magicAttack": 180, "magicDefense": 120, "criticalChance": 40, "criticalDamage": 220, "accuracy": 90, "evasion": 50}, "battleAI": {"aggression": 80, "defensiveness": 40, "riskTaking": 90, "adaptability": 95, "preferredStrategies": ["shape_shifting", "illusion_tactics", "acrobatic_combat"]}, "battleQuotes": ["Haha! Try to catch me!", "I am the Handsome Monkey King!", "72 transformations!", "Even heaven fears me!"]}'),

('sammy_slugger', 'Sammy "Slugger" Sullivan', 'Hard-Boiled Detective', 'scholar', '1940s Film Noir', 'uncommon',
 800, 120, 85, 100, 75,
 '["Cynical", "Determined", "Street-smart", "Loyal"]',
 'Gritty and direct',
 '["Justice", "The streets", "Corruption", "Truth", "Honor among thieves"]',
 '🕶️',
 '{"baseStats": {"strength": 75, "agility": 80, "intelligence": 85, "vitality": 80, "wisdom": 70, "charisma": 65}, "combatStats": {"maxHealth": 800, "maxMana": 600, "magicAttack": 60, "magicDefense": 70, "criticalChance": 30, "criticalDamage": 180, "accuracy": 85, "evasion": 35}, "battleAI": {"aggression": 65, "defensiveness": 60, "riskTaking": 70, "adaptability": 80, "preferredStrategies": ["street_fighting", "investigation_tactics", "underworld_connections"]}, "battleQuotes": ["The streets don\'t lie", "I\'ve seen worse", "Justice ain\'t pretty", "This city\'s got teeth"]}'),

('billy_the_kid', 'Billy the Kid', 'The Young Gunslinger', 'assassin', 'American Old West (1870s-1880s)', 'rare',
 650, 165, 60, 190, 85,
 '["Quick-tempered", "Fearless", "Youthful", "Outlaw"]',
 'Casual and confident',
 '["The frontier", "Quick draws", "Outlaw life", "Freedom", "Reputation"]',
 '🤠',
 '{"baseStats": {"strength": 70, "agility": 95, "intelligence": 60, "vitality": 65, "wisdom": 50, "charisma": 75}, "combatStats": {"maxHealth": 650, "maxMana": 400, "magicAttack": 30, "magicDefense": 40, "criticalChance": 45, "criticalDamage": 250, "accuracy": 95, "evasion": 60}, "battleAI": {"aggression": 85, "defensiveness": 25, "riskTaking": 90, "adaptability": 70, "preferredStrategies": ["quick_draw", "hit_and_run", "gunslinger_duels"]}, "battleQuotes": ["Draw!", "Fastest gun in the West", "You\'re not quick enough", "This town ain\'t big enough"]}'),

('genghis_khan', 'Genghis Khan', 'The Great Khan', 'leader', 'Mongol Empire (1162-1227)', 'legendary',
 1100, 155, 110, 125, 90,
 '["Ruthless", "Strategic", "Ambitious", "Unifying"]',
 'Commanding and direct',
 '["Conquest", "Unity", "Empire building", "Military strategy", "Legacy"]',
 '🏹',
 '{"baseStats": {"strength": 85, "agility": 80, "intelligence": 90, "vitality": 85, "wisdom": 80, "charisma": 95}, "combatStats": {"maxHealth": 1100, "maxMana": 800, "magicAttack": 70, "magicDefense": 90, "criticalChance": 25, "criticalDamage": 180, "accuracy": 80, "evasion": 30}, "battleAI": {"aggression": 80, "defensiveness": 60, "riskTaking": 75, "adaptability": 90, "preferredStrategies": ["cavalry_charges", "siege_warfare", "psychological_warfare"]}, "battleQuotes": ["The greatest joy is to conquer", "I am the flail of God", "Submit or be destroyed", "The empire grows"]}'),

('tesla', 'Nikola Tesla', 'The Electrical Genius', 'scholar', 'Industrial Revolution (1856-1943)', 'epic',
 650, 90, 60, 105, 100,
 '["Brilliant", "Eccentric", "Visionary", "Obsessive"]',
 'Scientific and passionate',
 '["Electricity", "Innovation", "The future", "Scientific discovery", "Wireless power"]',
 '⚡',
 '{"baseStats": {"strength": 50, "agility": 70, "intelligence": 100, "vitality": 55, "wisdom": 85, "charisma": 65}, "combatStats": {"maxHealth": 650, "maxMana": 2000, "magicAttack": 190, "magicDefense": 120, "criticalChance": 30, "criticalDamage": 200, "accuracy": 90, "evasion": 35}, "battleAI": {"aggression": 50, "defensiveness": 70, "riskTaking": 60, "adaptability": 85, "preferredStrategies": ["electrical_attacks", "technological_superiority", "energy_manipulation"]}, "battleQuotes": ["The present is theirs; the future is mine", "Let there be light!", "Science is my weapon", "Electricity obeys my will"]}'),

('alien_grey', 'Zyx-9', 'The Cosmic Observer', 'mystic', 'Modern UFO Mythology', 'rare',
 750, 110, 80, 140, 95,
 '["Analytical", "Detached", "Curious", "Advanced"]',
 'Clinical and otherworldly',
 '["Galactic knowledge", "Human observation", "Advanced technology", "Universal truths"]',
 '👽',
 '{"baseStats": {"strength": 40, "agility": 85, "intelligence": 95, "vitality": 70, "wisdom": 90, "charisma": 60}, "combatStats": {"maxHealth": 750, "maxMana": 1600, "magicAttack": 170, "magicDefense": 150, "criticalChance": 25, "criticalDamage": 180, "accuracy": 95, "evasion": 45}, "battleAI": {"aggression": 40, "defensiveness": 70, "riskTaking": 50, "adaptability": 95, "preferredStrategies": ["mind_control", "advanced_technology", "psychic_powers"]}, "battleQuotes": ["Your species is... interesting", "We have observed this before", "Resistance is illogical", "Your minds are so simple"]}'),

('robin_hood', 'Robin Hood', 'Prince of Thieves', 'trickster', 'Medieval England (12th century)', 'uncommon',
 850, 130, 75, 160, 80,
 '["Just", "Clever", "Rebellious", "Charismatic"]',
 'Jovial and roguish',
 '["Justice", "The poor", "Sherwood Forest", "Archery", "Fighting tyranny"]',
 '🏹',
 '{"baseStats": {"strength": 75, "agility": 90, "intelligence": 75, "vitality": 75, "wisdom": 70, "charisma": 85}, "combatStats": {"maxHealth": 850, "maxMana": 600, "magicAttack": 60, "magicDefense": 70, "criticalChance": 35, "criticalDamage": 190, "accuracy": 95, "evasion": 50}, "battleAI": {"aggression": 60, "defensiveness": 50, "riskTaking": 75, "adaptability": 85, "preferredStrategies": ["precision_archery", "forest_tactics", "guerrilla_warfare"]}, "battleQuotes": ["For the poor and oppressed!", "A shot for justice!", "Sherwood\'s finest!", "Take from the rich!"]}'),

('space_cyborg', 'Space Cyborg', 'Galactic Mercenary', 'tank', 'Sci-Fi Future', 'epic',
 1500, 145, 160, 80, 85,
 '["Mechanical", "Logical", "Efficient", "Deadly"]',
 'Robotic and precise',
 '["Galactic warfare", "Cybernetic enhancement", "Mission efficiency", "Tactical analysis"]',
 '🤖',
 '{"baseStats": {"strength": 90, "agility": 60, "intelligence": 85, "vitality": 95, "wisdom": 70, "charisma": 40}, "combatStats": {"maxHealth": 1500, "maxMana": 800, "magicAttack": 120, "magicDefense": 140, "criticalChance": 20, "criticalDamage": 160, "accuracy": 90, "evasion": 20}, "battleAI": {"aggression": 70, "defensiveness": 80, "riskTaking": 50, "adaptability": 75, "preferredStrategies": ["heavy_weapons", "tactical_analysis", "cybernetic_enhancement"]}, "battleQuotes": ["Target acquired", "Systems optimal", "Resistance is futile", "Mission parameters updated"]}'),

('agent_x', 'Agent X', 'Shadow Operative', 'assassin', 'Modern Espionage', 'rare',
 700, 155, 70, 170, 90,
 '["Mysterious", "Professional", "Ruthless", "Disciplined"]',
 'Cold and calculating',
 '["Classified missions", "National security", "Infiltration", "Elimination protocols"]',
 '🕶️',
 '{"baseStats": {"strength": 80, "agility": 95, "intelligence": 85, "vitality": 70, "wisdom": 75, "charisma": 60}, "combatStats": {"maxHealth": 700, "maxMana": 800, "magicAttack": 80, "magicDefense": 80, "criticalChance": 40, "criticalDamage": 230, "accuracy": 95, "evasion": 55}, "battleAI": {"aggression": 75, "defensiveness": 40, "riskTaking": 65, "adaptability": 90, "preferredStrategies": ["stealth_attacks", "tactical_elimination", "information_warfare"]}, "battleQuotes": ["Target eliminated", "Mission classified", "No witnesses", "Orders received"]}');

-- Create indexes for full-text search
CREATE INDEX idx_characters_name_search ON characters USING gin(to_tsvector('english', name || ' ' || title));

-- Create materialized view for character stats
CREATE MATERIALIZED VIEW character_popularity AS
SELECT 
    c.id,
    c.name,
    c.rarity,
    COUNT(DISTINCT uc.user_id) as owners,
    COUNT(DISTINCT b.id) as total_battles,
    AVG(uc.bond_level) as avg_bond_level,
    SUM(CASE WHEN b.winner_id = uc.user_id THEN 1 ELSE 0 END)::FLOAT / 
        NULLIF(COUNT(DISTINCT b.id), 0) as win_rate
FROM characters c
LEFT JOIN user_characters uc ON c.id = uc.character_id
LEFT JOIN battles b ON (b.character1_id = uc.id OR b.character2_id = uc.id)
GROUP BY c.id, c.name, c.rarity;

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user can play (daily limit)
CREATE OR REPLACE FUNCTION can_user_play(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user users%ROWTYPE;
    v_today DATE;
    v_last_reset DATE;
    v_daily_limit INTEGER := 1800; -- 30 minutes in seconds
BEGIN
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    
    -- Premium users have no limit
    IF v_user.subscription_tier != 'free' THEN
        RETURN TRUE;
    END IF;
    
    v_today := CURRENT_DATE;
    v_last_reset := v_user.last_play_reset::DATE;
    
    -- Reset if new day
    IF v_today > v_last_reset THEN
        UPDATE users 
        SET daily_play_seconds = 0, 
            last_play_reset = CURRENT_TIMESTAMP 
        WHERE id = p_user_id;
        RETURN TRUE;
    END IF;
    
    -- Check remaining time
    RETURN v_user.daily_play_seconds < v_daily_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to open a pack
CREATE OR REPLACE FUNCTION open_card_pack(
    p_user_id UUID,
    p_pack_type VARCHAR
) RETURNS TABLE (
    character_id VARCHAR,
    character_name VARCHAR,
    rarity character_rarity,
    is_new BOOLEAN
) AS $$
-- Implementation would handle pack opening logic
-- Returns the cards received
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Create application role
CREATE ROLE blankwars_app LOGIN PASSWORD 'secure_password_here';

-- Grant permissions
GRANT CONNECT ON DATABASE blankwars TO blankwars_app;
GRANT USAGE ON SCHEMA public TO blankwars_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO blankwars_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO blankwars_app;

-- Restrict certain operations
REVOKE DELETE ON users FROM blankwars_app;
REVOKE DELETE ON purchases FROM blankwars_app;
REVOKE DELETE ON analytics_events FROM blankwars_app;