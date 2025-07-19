-- Blank Wars Database Setup Script (SQLite3 Compatible)
-- Run this script to create all tables and initial data for SQLite

-- =====================================================
-- USER SYSTEM TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    oauth_provider TEXT,
    oauth_id TEXT,
    
    -- Subscription info
    subscription_tier TEXT DEFAULT 'free', -- ENUMs stored as TEXT
    subscription_expires_at DATETIME,
    stripe_customer_id TEXT,
    
    -- Play time tracking
    daily_play_seconds INTEGER DEFAULT 0,
    last_play_reset DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- User stats
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    experience INTEGER DEFAULT 0 CHECK (experience >= 0),
    total_battles INTEGER DEFAULT 0 CHECK (total_battles >= 0),
    total_wins INTEGER DEFAULT 0 CHECK (total_wins >= 0),
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    character_slot_capacity INTEGER DEFAULT 12 -- Default capacity for characters
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_subscription ON users (subscription_tier);

-- Refresh tokens for JWT auth
CREATE TABLE refresh_tokens (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens (token);

-- =====================================================
-- CHARACTER SYSTEM TABLES
-- =====================================================

-- Master character registry
CREATE TABLE characters (
    id TEXT PRIMARY KEY, -- e.g., 'char_001'
    name TEXT NOT NULL,
    title TEXT,
    archetype TEXT NOT NULL, -- ENUMs stored as TEXT
    origin_era TEXT,
    origin_location TEXT,
    rarity TEXT NOT NULL, -- ENUMs stored as TEXT
    
    -- Base stats
    base_health INTEGER NOT NULL CHECK (base_health > 0),
    base_attack INTEGER NOT NULL CHECK (base_attack > 0),
    base_defense INTEGER NOT NULL CHECK (base_defense > 0),
    base_speed INTEGER NOT NULL CHECK (base_speed > 0),
    base_special INTEGER NOT NULL CHECK (base_special > 0),
    
    -- AI personality (JSONB for flexibility, stored as TEXT in SQLite)
    personality_traits TEXT NOT NULL DEFAULT '[]',
    conversation_style TEXT,
    backstory TEXT,
    emotional_range TEXT DEFAULT '[]',
    conversation_topics TEXT DEFAULT '[]',
    
    -- Dialogue samples
    dialogue_intro TEXT,
    dialogue_victory TEXT,
    dialogue_defeat TEXT,
    dialogue_bonding TEXT,
    
    -- Visual
    avatar_emoji TEXT,
    artwork_url TEXT,
    
    -- Abilities (JSONB array, stored as TEXT in SQLite)
    abilities TEXT NOT NULL DEFAULT '[]',
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_characters_rarity ON characters (rarity);
CREATE INDEX idx_characters_archetype ON characters (archetype);

-- User's character collection
CREATE TABLE user_characters (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    user_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    nickname TEXT,
    
    -- Progression
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    experience INTEGER DEFAULT 0,
    bond_level INTEGER DEFAULT 0 CHECK (bond_level >= 0 AND bond_level <= 10),
    total_battles INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    
    -- Current state
    current_health INTEGER NOT NULL,
    max_health INTEGER NOT NULL,
    is_injured BOOLEAN DEFAULT FALSE,
    recovery_time DATETIME,
    
    -- Customization
    equipment TEXT DEFAULT '[]', -- JSONB stored as TEXT
    enhancements TEXT DEFAULT '[]', -- JSONB stored as TEXT
    skin_id TEXT,
    
    -- AI memory
    conversation_memory TEXT DEFAULT '[]', -- JSONB stored as TEXT
    significant_memories TEXT DEFAULT '{}', -- JSONB stored as TEXT
    personality_drift TEXT DEFAULT '{}', -- JSONB stored as TEXT
    last_chat_at DATETIME,
    
    -- Metadata
    acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    acquired_from TEXT, -- 'starter', 'pack', 'qr', 'event', etc.
    last_battle_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE INDEX idx_user_characters_user ON user_characters (user_id);
CREATE INDEX idx_user_characters_bond ON user_characters (bond_level);
CREATE UNIQUE INDEX idx_user_characters_unique_char ON user_characters (user_id, character_id);


-- =====================================================
-- BATTLE SYSTEM TABLES
-- =====================================================

-- Battle records
CREATE TABLE battles (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    
    -- Players
    player1_id TEXT NOT NULL,
    player2_id TEXT NOT NULL,
    character1_id TEXT NOT NULL,
    character2_id TEXT NOT NULL,
    
    -- Battle state
    status TEXT DEFAULT 'matchmaking', -- ENUM stored as TEXT
    current_round INTEGER DEFAULT 1 CHECK (current_round >= 1 AND current_round <= 10),
    turn_count INTEGER DEFAULT 0,
    
    -- Strategies
    p1_strategy TEXT, -- ENUM stored as TEXT
    p2_strategy TEXT, -- ENUM stored as TEXT
    
    -- Results
    winner_id TEXT,
    end_reason TEXT, -- 'knockout', 'rounds_complete', 'forfeit', 'disconnect'
    
    -- Battle data
    combat_log TEXT DEFAULT '[]', -- JSONB stored as TEXT
    chat_logs TEXT DEFAULT '[]', -- JSONB stored as TEXT
    
    -- Rewards
    xp_gained INTEGER DEFAULT 0,
    bond_gained INTEGER DEFAULT 0,
    currency_gained INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (character1_id) REFERENCES user_characters(id),
    FOREIGN KEY (character2_id) REFERENCES user_characters(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
);

CREATE INDEX idx_battles_players ON battles (player1_id, player2_id);
CREATE INDEX idx_battles_status ON battles (status);
CREATE INDEX idx_battles_started ON battles (started_at DESC);

-- Battle queue for matchmaking
CREATE TABLE battle_queue (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    user_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    queue_type TEXT DEFAULT 'ranked', -- 'ranked', 'casual', 'tournament'
    rating INTEGER DEFAULT 1000,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES user_characters(id)
);

CREATE INDEX idx_queue_type_rating ON battle_queue (queue_type, rating);
CREATE UNIQUE INDEX idx_battle_queue_user ON battle_queue (user_id);

-- =====================================================
-- CHAT SYSTEM TABLES
-- =====================================================

-- Chat messages between players and characters
CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    user_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    battle_id TEXT,
    
    -- Message content
    player_message TEXT NOT NULL,
    character_response TEXT NOT NULL,
    response_type TEXT DEFAULT 'template', -- 'template', 'ai', 'cached'
    
    -- Context
    message_context TEXT, -- JSONB stored as TEXT
    battle_round INTEGER,
    character_health_percent INTEGER,
    
    -- AI metrics
    model_used TEXT,
    tokens_used INTEGER,
    response_time_ms INTEGER,
    api_cost_cents REAL, -- DECIMAL stored as REAL
    
    -- Bonding
    bond_increase BOOLEAN DEFAULT FALSE,
    memory_saved BOOLEAN DEFAULT FALSE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES user_characters(id) ON DELETE CASCADE,
    FOREIGN KEY (battle_id) REFERENCES battles(id)
);

CREATE INDEX idx_chat_user_char ON chat_messages (user_id, character_id);
CREATE INDEX idx_chat_created ON chat_messages (created_at DESC);
CREATE INDEX idx_chat_battle ON chat_messages (battle_id);

-- =====================================================
-- CARD PACK & GIFTING SYSTEM TABLES
-- =====================================================

-- Card pack definitions
CREATE TABLE card_packs (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    pack_type TEXT NOT NULL,
    pack_series TEXT,
    pack_name TEXT,
    
    -- Contents
    cards_count INTEGER NOT NULL,
    guaranteed_rarity TEXT, -- ENUM stored as TEXT
    rarity_weights TEXT NOT NULL, -- JSONB stored as TEXT
    
    -- Pricing
    price_usd REAL, -- DECIMAL stored as REAL
    price_gems INTEGER,
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    available_from DATETIME,
    available_until DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- QR code registry
CREATE TABLE qr_codes (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    serial_number TEXT UNIQUE NOT NULL,
    character_id TEXT NOT NULL,
    pack_id TEXT,
    
    -- Security
    signature TEXT NOT NULL,
    batch_id TEXT,
    batch_name TEXT,
    
    -- Redemption
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_by TEXT,
    redeemed_at DATETIME,
    
    -- Validity
    valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
    valid_until DATETIME DEFAULT (CURRENT_TIMESTAMP + 2 * 365 * 86400), -- 2 years in seconds
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (character_id) REFERENCES characters(id),
    FOREIGN KEY (pack_id) REFERENCES card_packs(id),
    FOREIGN KEY (redeemed_by) REFERENCES users(id)
);

CREATE INDEX idx_qr_unredeemed ON qr_codes (is_redeemed) WHERE is_redeemed = FALSE;
CREATE INDEX idx_qr_serial ON qr_codes (serial_number);
CREATE INDEX idx_qr_batch ON qr_codes (batch_id);

-- Claimable Packs (for gifts, special offers, etc.)
CREATE TABLE claimable_packs (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    pack_type TEXT NOT NULL, -- e.g., 'standard_starter', 'premium_starter', 'gift_pack_common'
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_by_user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    claimed_at DATETIME,
    
    FOREIGN KEY (claimed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Contents of Claimable Packs
CREATE TABLE claimable_pack_contents (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    pack_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    is_granted BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pack_id) REFERENCES claimable_packs(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- =====================================================
-- CHARACTER ECHO SYSTEM TABLES
-- =====================================================

-- User's Character Echoes (for duplicate characters)
CREATE TABLE user_character_echoes (
    user_id TEXT NOT NULL,
    character_template_id TEXT NOT NULL,
    echo_count INTEGER DEFAULT 0 CHECK (echo_count >= 0),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, character_template_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (character_template_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- =====================================================
-- PAYMENT & ECONOMY TABLES
-- =====================================================

-- User currency balances
CREATE TABLE user_currency (
    user_id TEXT PRIMARY KEY,
    gems INTEGER DEFAULT 0 CHECK (gems >= 0),
    essence INTEGER DEFAULT 0 CHECK (essence >= 0), -- From duplicate cards
    battle_tokens INTEGER DEFAULT 0 CHECK (battle_tokens >= 0),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User friendships/social connections
CREATE TABLE user_friendships (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate friendships and self-friending
    UNIQUE(user_id, friend_id),
    CHECK(user_id != friend_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_friendships_user ON user_friendships (user_id);
CREATE INDEX idx_friendships_friend ON user_friendships (friend_id);
CREATE INDEX idx_friendships_status ON user_friendships (status);

-- Purchase history
CREATE TABLE purchases (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    user_id TEXT NOT NULL,
    
    -- Purchase details
    product_type TEXT NOT NULL, -- 'subscription', 'pack', 'gems', 'battle_pass'
    product_id TEXT,
    quantity INTEGER DEFAULT 1,
    
    -- Payment info
    amount_usd REAL NOT NULL, -- DECIMAL stored as REAL
    currency TEXT DEFAULT 'USD',
    payment_method TEXT, -- 'stripe', 'paypal', 'apple', 'google'
    payment_id TEXT, -- External payment ID
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    completed_at DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_purchases_user ON purchases (user_id);
CREATE INDEX idx_purchases_created ON purchases (created_at DESC);
CREATE INDEX idx_purchases_status ON purchases (status);

-- =====================================================
-- TOURNAMENT SYSTEM TABLES
-- =====================================================

-- Tournament definitions
CREATE TABLE tournaments (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    name TEXT NOT NULL,
    description TEXT,
    
    -- Rules
    format TEXT NOT NULL, -- ENUM stored as TEXT
    max_participants INTEGER DEFAULT 32,
    character_restrictions TEXT DEFAULT '{}', -- JSONB stored as TEXT
    entry_fee_gems INTEGER DEFAULT 0,
    
    -- Schedule
    registration_starts DATETIME,
    registration_ends DATETIME,
    tournament_starts DATETIME,
    tournament_ends DATETIME,
    
    -- State
    status TEXT DEFAULT 'upcoming', -- ENUM stored as TEXT
    current_round INTEGER DEFAULT 0,
    brackets TEXT DEFAULT '{}', -- JSONB stored as TEXT
    
    -- Prizes
    prize_pool TEXT DEFAULT '{}', -- JSONB stored as TEXT
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tournaments_status ON tournaments (status);
CREATE INDEX idx_tournaments_starts ON tournaments (tournament_starts);

-- Tournament participants
CREATE TABLE tournament_participants (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    tournament_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    
    -- Progress
    current_round INTEGER DEFAULT 1,
    is_eliminated BOOLEAN DEFAULT FALSE,
    final_placement INTEGER,
    
    -- Stats
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(tournament_id, user_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (character_id) REFERENCES user_characters(id)
);

CREATE INDEX idx_participants_tournament ON tournament_participants (tournament_id);
CREATE INDEX idx_participants_user ON tournament_participants (user_id);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- Event tracking (simplified for SQLite, no partitioning)
CREATE TABLE analytics_events (
    id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
    user_id TEXT,
    
    -- Event data
    event_type TEXT NOT NULL,
    event_category TEXT,
    event_data TEXT DEFAULT '{}', -- JSONB stored as TEXT
    
    -- Context
    session_id TEXT,
    ip_address TEXT, -- INET stored as TEXT
    user_agent TEXT,
    platform TEXT, -- 'web', 'ios', 'android'
    app_version TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_analytics_user_created ON analytics_events (user_id, created_at);
CREATE INDEX idx_analytics_type_created ON analytics_events (event_type, created_at);

-- =====================================================
-- INITIAL DATA INSERTION
-- =====================================================

-- Insert card pack types
INSERT INTO card_packs (id, pack_type, pack_series, pack_name, cards_count, guaranteed_rarity, rarity_weights, price_usd, price_gems) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'starter', 'core', 'Starter Pack', 5, 'uncommon', '{"common": 0.65, "uncommon": 0.30, "rare": 0.05}', 2.99, 100),
('b1fccb00-0d1c-4ff9-ac7e-7cc0ce491b22', 'premium', 'core', 'Premium Pack', 8, 'rare', '{"common": 0.45, "uncommon": 0.35, "rare": 0.15, "epic": 0.04, "legendary": 0.01}', 5.99, 500),
('c2gddc11-1e2d-4gg0-bd8f-8dd1df502c33', 'legendary', 'core', 'Legendary Pack', 10, 'epic', '{"common": 0.20, "uncommon": 0.35, "rare": 0.30, "epic": 0.12, "legendary": 0.03}', 12.99, 1000);

-- Insert all 17 characters from frontend with complete data preserved
INSERT INTO characters (
    id, name, title, archetype, origin_era, origin_location, rarity, 
    base_health, base_attack, base_defense, base_speed, base_special,
    personality_traits, conversation_style, backstory, emotional_range, conversation_topics, 
    dialogue_intro, dialogue_victory, dialogue_defeat, dialogue_bonding, 
    avatar_emoji, artwork_url, abilities
) VALUES
('achilles', 'Achilles', 'Hero of Troy', 'warrior', 'Ancient Greece (1200 BCE)', 'legendary', 'Greece', 
 1200, 185, 120, 140, 90,
 '["Honorable", "Wrathful", "Courageous", "Prideful"]',
 'Noble and passionate',
 'The greatest warrior of the Trojan War, nearly invincible in combat but driven by rage and honor.',
 '[]', '["Glory", "Honor", "Revenge", "Troy", "Combat"]',
 'For glory and honor!', 'Face me if you dare!', 'The gods smile upon me!', 'None can stand against my might!',
 '⚔️',
 '',
 '{"baseStats": {"strength": 95, "agility": 85, "intelligence": 60, "vitality": 90, "wisdom": 45, "charisma": 80}, "combatStats": {"maxHealth": 1200, "maxMana": 300, "magicAttack": 50, "magicDefense": 80, "criticalChance": 25, "criticalDamage": 200, "accuracy": 90, "evasion": 20}, "battleAI": {"aggression": 90, "defensiveness": 30, "riskTaking": 80, "adaptability": 60, "preferredStrategies": ["frontal_assault", "berserker_rush", "honor_duel"]}, "battleQuotes": ["For glory and honor!", "Face me if you dare!", "The gods smile upon me!", "None can stand against my might!"]}'),

('merlin', 'Merlin', 'Archmage of Camelot', 'scholar', 'Medieval Britain (5th-6th century)', 'mythic', 'Britain',
 800, 60, 80, 90, 100,
 '["Wise", "Mysterious", "Patient", "Calculating"]',
 'Archaic and profound',
 'The legendary wizard advisor to King Arthur, master of ancient magic and prophecy.',
 '[]', '["Knowledge", "Balance", "Protecting the realm", "Magic", "Time"]',
 'The ancient words have power...', 'Magic flows through all things', 'By the old ways, I command thee!', 'Witness the might of ages past!',
 '🔮',
 '',
 '{"baseStats": {"strength": 30, "agility": 50, "intelligence": 98, "vitality": 70, "wisdom": 95, "charisma": 85}, "combatStats": {"maxHealth": 800, "maxMana": 2000, "magicAttack": 200, "magicDefense": 180, "criticalChance": 15, "criticalDamage": 300, "accuracy": 95, "evasion": 25}, "battleAI": {"aggression": 40, "defensiveness": 80, "riskTaking": 30, "adaptability": 95, "preferredStrategies": ["spell_weaving", "defensive_barriers", "elemental_control"]}, "battleQuotes": ["The ancient words have power...", "Magic flows through all things", "By the old ways, I command thee!", "Witness the might of ages past!"]}'),

('fenrir', 'Fenrir', 'The Great Wolf', 'beast', 'Norse Age (8th-11th century)', 'legendary', 'Scandinavia',
 1400, 170, 100, 180, 95,
 '["Savage", "Loyal", "Vengeful", "Primal"]',
 'Growling and direct',
 'The monstrous wolf of Norse mythology, prophesied to devour Odin during Ragnarök.',
 '[]', '["Freedom", "Vengeance", "Pack loyalty", "The hunt"]',
 '*Fierce growling*', 'The hunt begins!', '*Howls menacingly*', 'You smell of fear...',
 '🐺',
 '',
 '{"baseStats": {"strength": 90, "agility": 95, "intelligence": 40, "vitality": 95, "wisdom": 30, "charisma": 50}, "combatStats": {"maxHealth": 1400, "maxMana": 200, "magicAttack": 30, "magicDefense": 60, "criticalChance": 30, "criticalDamage": 220, "accuracy": 88, "evasion": 30}, "battleAI": {"aggression": 95, "defensiveness": 20, "riskTaking": 85, "adaptability": 40, "preferredStrategies": ["savage_rush", "pack_tactics", "intimidation"]}, "battleQuotes": ["*Fierce growling*", "The hunt begins!", "*Howls menacingly*", "You smell of fear..."]}'),

('cleopatra', 'Cleopatra VII', 'Last Pharaoh of Egypt', 'mystic', 'Ptolemaic Egypt (69-30 BCE)', 'epic', 'Egypt',
 900, 80, 95, 110, 95,
 '["Brilliant", "Charismatic", "Ambitious", "Diplomatic"]',
 'Regal and commanding',
 '',
 '[]', '["Power", "Legacy", "Egyptian restoration", "Politics"]',
 'I am the daughter of Ra!', 'Egypt''''s glory shall not fade', 'Bow before the true pharaoh', 'The gods favor the worthy',
 '👑',
 '',
 '{"baseStats": {"strength": 45, "agility": 65, "intelligence": 90, "vitality": 70, "wisdom": 85, "charisma": 98}, "combatStats": {"maxHealth": 900, "maxMana": 1600, "magicAttack": 150, "magicDefense": 160, "criticalChance": 20, "criticalDamage": 150, "accuracy": 80, "evasion": 35}, "battleAI": {"aggression": 50, "defensiveness": 70, "riskTaking": 60, "adaptability": 85, "preferredStrategies": ["strategic_planning", "diplomatic_solutions", "resource_manipulation"]}, "battleQuotes": ["I am the daughter of Ra!", "Egypt''''s glory shall not fade", "Bow before the true pharaoh", "The gods favor the worthy"]}'),

('holmes', 'Sherlock Holmes', 'The Great Detective', 'scholar', 'Victorian England (1880s-1920s)', 'rare', 'England',
 700, 85, 70, 120, 100,
 '["Analytical", "Observant", "Eccentric", "Brilliant"]',
 'Precise and deductive',
 '',
 '[]', '["Truth", "Justice", "Intellectual challenge", "Crime", "Logic"]',
 'Elementary, my dear Watson', 'The game is afoot!', 'I observe everything', 'Logic is my weapon',
 '🕵️',
 '',
 '{"baseStats": {"strength": 60, "agility": 80, "intelligence": 98, "vitality": 55, "wisdom": 90, "charisma": 70}, "combatStats": {"maxHealth": 700, "maxMana": 1400, "magicAttack": 120, "magicDefense": 100, "criticalChance": 35, "criticalDamage": 250, "accuracy": 95, "evasion": 40}, "battleAI": {"aggression": 30, "defensiveness": 60, "riskTaking": 40, "adaptability": 95, "preferredStrategies": ["analytical_combat", "precision_strikes", "enemy_prediction"]}, "battleQuotes": ["Elementary, my dear Watson", "The game is afoot!", "I observe everything", "Logic is my weapon"]}'),

('dracula', 'Count Dracula', 'Lord of the Undead', 'mystic', 'Victorian Horror (1897)', 'legendary', 'Transylvania',
 1100, 140, 90, 130, 90,
 '["Aristocratic", "Manipulative", "Ancient", "Predatory"]',
 'Eloquent and menacing',
 '',
 '[]', '["Immortality", "Power over mortals", "The night", "Blood", "Dominion"]',
 'Welcome to my domain', 'I have crossed oceans of time', 'The night is mine', 'You cannot escape the darkness',
 '🧛',
 '',
 '{"baseStats": {"strength": 85, "agility": 90, "intelligence": 80, "vitality": 95, "wisdom": 75, "charisma": 95}, "combatStats": {"maxHealth": 1100, "maxMana": 1200, "magicAttack": 160, "magicDefense": 140, "criticalChance": 25, "criticalDamage": 180, "accuracy": 85, "evasion": 45}, "battleAI": {"aggression": 70, "defensiveness": 50, "riskTaking": 65, "adaptability": 80, "preferredStrategies": ["life_drain", "fear_tactics", "supernatural_powers"]}, "battleQuotes": ["Welcome to my domain", "I have crossed oceans of time", "The night is mine", "You cannot escape the darkness"]}'),

('joan', 'Joan of Arc', 'The Maid of Orléans', 'warrior', 'Medieval France (1412-1431)', 'epic', 'France',
 1000, 150, 130, 115, 85,
 '["Devout", "Courageous", "Determined", "Inspirational"]',
 'Passionate and faithful',
 '',
 '[]', '["Divine mission", "France", "Faith", "Liberation", "Divine guidance"]',
 'God wills it!', 'For France and freedom!', 'I fear nothing but God', 'The Lord guides my blade',
 '⚔️',
 '',
 '{"baseStats": {"strength": 75, "agility": 70, "intelligence": 65, "vitality": 85, "wisdom": 80, "charisma": 90}, "combatStats": {"maxHealth": 1000, "maxMana": 800, "magicAttack": 100, "magicDefense": 120, "criticalChance": 20, "criticalDamage": 170, "accuracy": 85, "evasion": 25}, "battleAI": {"aggression": 75, "defensiveness": 60, "riskTaking": 70, "adaptability": 65, "preferredStrategies": ["holy_charge", "protective_leadership", "divine_intervention"]}, "battleQuotes": ["God wills it!", "For France and freedom!", "I fear nothing but God", "The Lord guides my blade"]}'),

('frankenstein_monster', 'Frankenstein''''s Monster', 'The Created Being', 'tank', 'Gothic Horror (1818)', 'rare', 'Switzerland',
 1600, 160, 140, 60, 70,
 '["Misunderstood", "Tormented", "Intelligent", "Lonely"]',
 'Eloquent but pained',
 '',
 '[]', '["Acceptance", "Understanding humanity", "Creator''''s responsibility", "Isolation"]',
 'I am not a monster!', 'Why do you fear me?', 'I seek only understanding', 'Your creator made me this way',
 '🧟',
 '',
 '{"baseStats": {"strength": 95, "agility": 30, "intelligence": 70, "vitality": 100, "wisdom": 60, "charisma": 20}, "combatStats": {"maxHealth": 1600, "maxMana": 400, "magicAttack": 40, "magicDefense": 80, "criticalChance": 15, "criticalDamage": 200, "accuracy": 70, "evasion": 10}, "battleAI": {"aggression": 60, "defensiveness": 80, "riskTaking": 50, "adaptability": 55, "preferredStrategies": ["overwhelming_force", "defensive_endurance", "emotional_appeals"]}, "battleQuotes": ["I am not a monster!", "Why do you fear me?", "I seek only understanding", "Your creator made me this way"]}'),

('sun_wukong', 'Sun Wukong', 'The Monkey King', 'trickster', 'Chinese Mythology (Journey to the West)', 'mythic', 'China',
 1300, 175, 85, 200, 98,
 '["Mischievous", "Proud", "Clever", "Rebellious"]',
 'Playful and irreverent',
 '',
 '[]', '["Freedom from authority", "Magical tricks", "Journey adventures", "Immortality"]',
 'Haha! Try to catch me!', 'I am the Handsome Monkey King!', '72 transformations!', 'Even heaven fears me!',
 '🐵',
 '',
 '{"baseStats": {"strength": 90, "agility": 100, "intelligence": 85, "vitality": 90, "wisdom": 70, "charisma": 80}, "combatStats": {"maxHealth": 1300, "maxMana": 1800, "magicAttack": 180, "magicDefense": 120, "criticalChance": 40, "criticalDamage": 220, "accuracy": 90, "evasion": 50}, "battleAI": {"aggression": 80, "defensiveness": 40, "riskTaking": 90, "adaptability": 95, "preferredStrategies": ["shape_shifting", "illusion_tactics", "acrobatic_combat"]}, "battleQuotes": ["Haha! Try to catch me!", "I am the Handsome Monkey King!", "72 transformations!", "Even heaven fears me!"]}'),

('sammy_slugger', 'Sammy "Slugger" Sullivan', 'Hard-Boiled Detective', 'scholar', '1940s Film Noir', 'uncommon', 'USA',
 800, 120, 85, 100, 75,
 '["Cynical", "Determined", "Street-smart", "Loyal"]',
 'Gritty and direct',
 '',
 '[]', '["Justice", "The streets", "Corruption", "Truth", "Honor among thieves"]',
 'The streets don''''t lie', 'I''''ve seen worse', 'Justice ain''''t pretty', 'This city''''s got teeth',
 '🕶️',
 '',
 '{"baseStats": {"strength": 75, "agility": 80, "intelligence": 85, "vitality": 80, "wisdom": 70, "charisma": 65}, "combatStats": {"maxHealth": 800, "maxMana": 600, "magicAttack": 60, "magicDefense": 70, "criticalChance": 30, "criticalDamage": 180, "accuracy": 85, "evasion": 35}, "battleAI": {"aggression": 65, "defensiveness": 60, "riskTaking": 70, "adaptability": 80, "preferredStrategies": ["street_fighting", "investigation_tactics", "underworld_connections"]}, "battleQuotes": ["The streets don''''t lie", "I''''ve seen worse", "Justice ain''''t pretty", "This city''''s got teeth"]}'),

('billy_the_kid', 'Billy the Kid', 'The Young Gunslinger', 'assassin', 'American Old West (1870s-1880s)', 'rare', 'USA',
 650, 165, 60, 190, 85,
 '["Quick-tempered", "Fearless", "Youthful", "Outlaw"]',
 'Casual and confident',
 '',
 '[]', '["The frontier", "Quick draws", "Outlaw life", "Freedom", "Reputation"]',
 'Draw!', 'Fastest gun in the West', 'You''''re not quick enough', 'This town ain''''t big enough',
 '🤠',
 '',
 '{"baseStats": {"strength": 70, "agility": 95, "intelligence": 60, "vitality": 65, "wisdom": 50, "charisma": 75}, "combatStats": {"maxHealth": 650, "maxMana": 400, "magicAttack": 30, "magicDefense": 40, "criticalChance": 45, "criticalDamage": 250, "accuracy": 95, "evasion": 60}, "battleAI": {"aggression": 85, "defensiveness": 25, "riskTaking": 90, "adaptability": 70, "preferredStrategies": ["quick_draw", "hit_and_run", "gunslinger_duels"]}, "battleQuotes": ["Draw!", "Fastest gun in the West", "You''''re not quick enough", "This town ain''''t big enough"]}'),

('genghis_khan', 'Genghis Khan', 'The Great Khan', 'leader', 'Mongol Empire (1162-1227)', 'legendary', 'Mongolia',
 1100, 155, 110, 125, 90,
 '["Ruthless", "Strategic", "Ambitious", "Unifying"]',
 'Commanding and direct',
 '',
 '[]', '["Conquest", "Unity", "Empire building", "Military strategy", "Legacy"]',
 'The greatest joy is to conquer', 'I am the flail of God', 'Submit or be destroyed', 'The empire grows',
 '🏹',
 '',
 '{"baseStats": {"strength": 85, "agility": 80, "intelligence": 90, "vitality": 85, "wisdom": 80, "charisma": 95}, "combatStats": {"maxHealth": 1100, "maxMana": 800, "magicAttack": 70, "magicDefense": 90, "criticalChance": 25, "criticalDamage": 180, "accuracy": 80, "evasion": 30}, "battleAI": {"aggression": 80, "defensiveness": 60, "riskTaking": 75, "adaptability": 90, "preferredStrategies": ["cavalry_charges", "siege_warfare", "psychological_warfare"]}, "battleQuotes": ["The greatest joy is to conquer", "I am the flail of God", "Submit or be destroyed", "The empire grows"]}'),

('tesla', 'Nikola Tesla', 'The Electrical Genius', 'scholar', 'Industrial Revolution (1856-1943)', 'epic', 'Croatia',
 650, 90, 60, 105, 100,
 '["Brilliant", "Eccentric", "Visionary", "Obsessive"]',
 'Scientific and passionate',
 '',
 '[]', '["Electricity", "Innovation", "The future", "Scientific discovery", "Wireless power"]',
 'The present is theirs; the future is mine', 'Let there be light!', 'Science is my weapon', 'Electricity obeys my will',
 '⚡',
 '',
 '{"baseStats": {"strength": 50, "agility": 70, "intelligence": 100, "vitality": 55, "wisdom": 85, "charisma": 65}, "combatStats": {"maxHealth": 650, "maxMana": 2000, "magicAttack": 190, "magicDefense": 120, "criticalChance": 30, "criticalDamage": 200, "accuracy": 90, "evasion": 35}, "battleAI": {"aggression": 50, "defensiveness": 70, "riskTaking": 60, "adaptability": 85, "preferredStrategies": ["electrical_attacks", "technological_superiority", "energy_manipulation"]}, "battleQuotes": ["The present is theirs; the future is mine", "Let there be light!", "Science is my weapon", "Electricity obeys my will"]}'),

('alien_grey', 'Zyx-9', 'The Cosmic Observer', 'mystic', 'Modern UFO Mythology', 'rare', 'Outer Space',
 750, 110, 80, 140, 95,
 '["Analytical", "Detached", "Curious", "Advanced"]',
 'Clinical and otherworldly',
 '',
 '[]', '["Galactic knowledge", "Human observation", "Advanced technology", "Universal truths"]',
 'Your species is... interesting', 'We have observed this before', 'Resistance is illogical', 'Your minds are so simple',
 '👽',
 '',
 '{"baseStats": {"strength": 40, "agility": 85, "intelligence": 95, "vitality": 70, "wisdom": 90, "charisma": 60}, "combatStats": {"maxHealth": 750, "maxMana": 1600, "magicAttack": 170, "magicDefense": 150, "criticalChance": 25, "criticalDamage": 180, "accuracy": 95, "evasion": 45}, "battleAI": {"aggression": 40, "defensiveness": 70, "riskTaking": 50, "adaptability": 95, "preferredStrategies": ["mind_control", "advanced_technology", "psychic_powers"]}, "battleQuotes": ["Your species is... interesting", "We have observed this before", "Resistance is illogical", "Your minds are so simple"]}'),

('robin_hood', 'Robin Hood', 'Prince of Thieves', 'trickster', 'Medieval England (12th century)', 'uncommon', 'England',
 850, 130, 75, 160, 80,
 '["Just", "Clever", "Rebellious", "Charismatic"]',
 'Jovial and roguish',
 '',
 '[]', '["Justice", "The poor", "Sherwood Forest", "Archery", "Fighting tyranny"]',
 'For the poor and oppressed!', 'A shot for justice!', 'Sherwood''''''''s finest!', 'Take from the rich!',
 '🏹',
 '',
 '{"baseStats": {"strength": 75, "agility": 90, "intelligence": 75, "vitality": 75, "wisdom": 70, "charisma": 85}, "combatStats": {"maxHealth": 850, "maxMana": 600, "magicAttack": 60, "magicDefense": 70, "criticalChance": 35, "criticalDamage": 190, "accuracy": 95, "evasion": 50}, "battleAI": {"aggression": 60, "defensiveness": 50, "riskTaking": 75, "adaptability": 85, "preferredStrategies": ["precision_archery", "forest_tactics", "guerrilla_warfare"]}, "battleQuotes": ["For the poor and oppressed!", "A shot for justice!", "Sherwood''''''''s finest!", "Take from the rich!"]}'),

('space_cyborg', 'Space Cyborg', 'Galactic Mercenary', 'tank', 'Sci-Fi Future', 'epic', 'Outer Space',
 1500, 145, 160, 80, 85,
 '["Mechanical", "Logical", "Efficient", "Deadly"]',
 'Robotic and precise',
 '',
 '[]', '["Galactic warfare", "Cybernetic enhancement", "Mission efficiency", "Tactical analysis"]',
 'Target acquired', 'Systems optimal', 'Resistance is futile', 'Mission parameters updated',
 '🤖',
 '',
 '{"baseStats": {"strength": 90, "agility": 60, "intelligence": 85, "vitality": 95, "wisdom": 70, "charisma": 40}, "combatStats": {"maxHealth": 1500, "maxMana": 800, "magicAttack": 120, "magicDefense": 140, "criticalChance": 20, "criticalDamage": 160, "accuracy": 90, "evasion": 20}, "battleAI": {"aggression": 70, "defensiveness": 80, "riskTaking": 50, "adaptability": 75, "preferredStrategies": ["heavy_weapons", "tactical_analysis", "cybernetic_enhancement"]}, "battleQuotes": ["Target acquired", "Systems optimal", "Resistance is futile", "Mission parameters updated"]}'),

('agent_x', 'Agent X', 'Shadow Operative', 'assassin', 'Modern Espionage', 'rare', 'Unknown',
 700, 155, 70, 170, 90,
 '["Mysterious", "Professional", "Ruthless", "Disciplined"]',
 'Cold and calculating',
 '',
 '[]', '["Classified missions", "National security", "Infiltration", "Elimination protocols"]',
 'Mission accomplished.', 'You never saw me.', 'The world''''s always in danger—good thing I am too.', 'Every legend needs a ghost.',
 '🕶️',
 '',
 '{"baseStats": {"strength": 80, "agility": 95, "intelligence": 85, "vitality": 70, "wisdom": 75, "charisma": 60}, "combatStats": {"maxHealth": 700, "maxMana": 800, "magicAttack": 80, "magicDefense": 80, "criticalChance": 40, "criticalDamage": 230, "accuracy": 95, "evasion": 55}, "battleAI": {"aggression": 75, "defensiveness": 40, "riskTaking": 65, "adaptability": 90, "preferredStrategies": ["stealth_attacks", "tactical_elimination", "information_warfare"]}, "battleQuotes": ["Target eliminated", "Mission classified", "No witnesses", "Orders received"]}');