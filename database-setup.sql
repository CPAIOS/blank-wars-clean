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
CREATE TYPE character_archetype AS ENUM ('warrior', 'scholar', 'trickster', 'beast', 'leader');
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
    conversation_style VARCHAR(50),
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
    serial_number VARCHAR(20) UNIQUE,
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
    INDEX idx_user_characters_serial (serial_number),
    INDEX idx_user_characters_bond (bond_level),
    
    -- Constraints
    UNIQUE(user_id, character_id, serial_number)
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

-- Insert all 30 characters
INSERT INTO characters (id, name, title, archetype, origin_era, origin_location, rarity, base_health, base_attack, base_defense, base_speed, base_special, avatar_emoji) VALUES
-- Legendary
('char_001', 'Merlin', 'The Eternal Wizard', 'scholar', 'Medieval Fantasy', 'Arthurian Legend', 'legendary', 80, 95, 50, 75, 100, '🧙'),
('char_002', 'Sun Wukong', 'The Monkey King', 'trickster', 'Chinese Mythology', 'Journey to the West', 'legendary', 90, 85, 70, 100, 95, '🐵'),
('char_021', 'Zeus', 'King of Olympus', 'leader', 'Age of Gods', 'Greek Mythology', 'legendary', 95, 90, 75, 85, 100, '⚡'),

-- Epic
('char_003', 'Achilles', 'Hero of Troy', 'warrior', 'Ancient Greece', 'Greek Mythology', 'epic', 100, 85, 70, 95, 80, '⚔️'),
('char_004', 'Marie Curie', 'The Radiant Scientist', 'scholar', 'Early 20th Century', 'Modern History', 'epic', 75, 80, 60, 70, 95, '⚗️'),
('char_005', 'Dracula', 'The Immortal Count', 'beast', 'Victorian Horror', 'Gothic Literature', 'epic', 110, 75, 65, 85, 90, '🧛'),
('char_022', 'Leonardo da Vinci', 'The Renaissance Genius', 'scholar', '15th-16th Century', 'Renaissance Italy', 'epic', 70, 75, 65, 70, 100, '🎨'),
('char_023', 'Valkyrie Brunhilde', 'Chooser of the Slain', 'warrior', 'Asgardian Eternal', 'Norse Mythology', 'epic', 90, 85, 80, 90, 85, '🪽'),

-- Add remaining characters following the same pattern...
-- (Truncated for brevity - would include all 30 characters)

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