import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/blankwars.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const db = new Database(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

// Initialize database schema
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🗄️ Initializing SQLite database...');
    
    // Create tables
    db.exec(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'legendary')),
        subscription_expires_at DATETIME,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        total_battles INTEGER DEFAULT 0,
        total_wins INTEGER DEFAULT 0,
        rating INTEGER DEFAULT 1000,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Characters table
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT,
        archetype TEXT CHECK (archetype IN ('warrior', 'scholar', 'trickster', 'beast', 'leader')),
        origin_era TEXT,
        rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
        base_health INTEGER NOT NULL,
        base_attack INTEGER NOT NULL,
        base_defense INTEGER NOT NULL,
        base_speed INTEGER NOT NULL,
        base_special INTEGER NOT NULL,
        personality_traits TEXT, -- JSON string
        conversation_style TEXT,
        backstory TEXT,
        conversation_topics TEXT, -- JSON string
        avatar_emoji TEXT,
        artwork_url TEXT,
        abilities TEXT, -- JSON string
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- User Characters table
      CREATE TABLE IF NOT EXISTS user_characters (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        serial_number TEXT UNIQUE,
        nickname TEXT,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        bond_level INTEGER DEFAULT 0,
        total_battles INTEGER DEFAULT 0,
        total_wins INTEGER DEFAULT 0,
        current_health INTEGER NOT NULL,
        max_health INTEGER NOT NULL,
        is_injured BOOLEAN DEFAULT FALSE,
        recovery_time DATETIME,
        equipment TEXT DEFAULT '[]', -- JSON string
        enhancements TEXT DEFAULT '[]', -- JSON string
        conversation_memory TEXT DEFAULT '[]', -- JSON string
        significant_memories TEXT DEFAULT '[]', -- JSON string
        personality_drift TEXT DEFAULT '{}', -- JSON string
        acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_battle_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (character_id) REFERENCES characters(id)
      );

      -- Battles table
      CREATE TABLE IF NOT EXISTS battles (
        id TEXT PRIMARY KEY,
        player1_id TEXT NOT NULL,
        player2_id TEXT NOT NULL,
        character1_id TEXT NOT NULL,
        character2_id TEXT NOT NULL,
        status TEXT DEFAULT 'matchmaking' CHECK (status IN ('matchmaking', 'active', 'paused', 'completed')),
        current_round INTEGER DEFAULT 1,
        turn_count INTEGER DEFAULT 0,
        p1_strategy TEXT CHECK (p1_strategy IN ('aggressive', 'defensive', 'balanced')),
        p2_strategy TEXT CHECK (p2_strategy IN ('aggressive', 'defensive', 'balanced')),
        winner_id TEXT,
        end_reason TEXT,
        combat_log TEXT DEFAULT '[]', -- JSON string
        chat_logs TEXT DEFAULT '[]', -- JSON string
        xp_gained INTEGER DEFAULT 0,
        bond_gained INTEGER DEFAULT 0,
        currency_gained INTEGER DEFAULT 0,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        FOREIGN KEY (player1_id) REFERENCES users(id),
        FOREIGN KEY (player2_id) REFERENCES users(id),
        FOREIGN KEY (character1_id) REFERENCES user_characters(id),
        FOREIGN KEY (character2_id) REFERENCES user_characters(id),
        FOREIGN KEY (winner_id) REFERENCES users(id)
      );

      -- Chat Messages table
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        battle_id TEXT,
        player_message TEXT NOT NULL,
        character_response TEXT NOT NULL,
        message_context TEXT, -- JSON string
        model_used TEXT,
        tokens_used INTEGER,
        response_time_ms INTEGER,
        bond_increase BOOLEAN DEFAULT FALSE,
        memory_saved BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (character_id) REFERENCES user_characters(id),
        FOREIGN KEY (battle_id) REFERENCES battles(id)
      );

      -- User Currency table
      CREATE TABLE IF NOT EXISTS user_currency (
        user_id TEXT PRIMARY KEY,
        battle_tokens INTEGER DEFAULT 100,
        premium_currency INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating);
      CREATE INDEX IF NOT EXISTS idx_user_characters_user_id ON user_characters(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_characters_character_id ON user_characters(character_id);
      CREATE INDEX IF NOT EXISTS idx_battles_player1 ON battles(player1_id);
      CREATE INDEX IF NOT EXISTS idx_battles_player2 ON battles(player2_id);
      CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_character ON chat_messages(user_id, character_id);
      CREATE INDEX IF NOT EXISTS idx_user_currency_user_id ON user_currency(user_id);
    `);

    // Insert sample characters if none exist
    const characterCount = db.prepare('SELECT COUNT(*) as count FROM characters').get() as { count: number };
    
    if (characterCount.count === 0) {
      console.log('📚 Seeding initial character data...');
      await seedCharacters();
    }

    console.log('✅ SQLite database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Seed initial character data
const seedCharacters = async (): Promise<void> => {
  const insertCharacter = db.prepare(`
    INSERT INTO characters (
      id, name, title, archetype, origin_era, rarity,
      base_health, base_attack, base_defense, base_speed, base_special,
      personality_traits, conversation_style, backstory, conversation_topics,
      avatar_emoji, abilities
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const characters = [
    {
      id: 'char_001',
      name: 'Achilles',
      title: 'Hero of Troy',
      archetype: 'warrior',
      origin_era: 'Ancient Greece',
      rarity: 'epic',
      base_health: 100,
      base_attack: 85,
      base_defense: 70,
      base_speed: 95,
      base_special: 90,
      personality_traits: JSON.stringify(['brave', 'proud', 'loyal', 'hot-tempered']),
      conversation_style: 'formal_ancient',
      backstory: 'Greatest warrior of the Trojan War, nearly invulnerable except for his heel.',
      conversation_topics: JSON.stringify(['Battle tactics', 'Honor and glory', 'Troy', 'Patroclus']),
      avatar_emoji: '⚔️',
      abilities: JSON.stringify([
        { name: 'Spear Thrust', damage_multiplier: 1.5, cooldown: 1 },
        { name: 'Shield Bash', damage_multiplier: 1.2, cooldown: 2 },
        { name: 'Rage of Achilles', damage_multiplier: 2.0, cooldown: 4 },
        { name: 'Invulnerable Stance', damage_multiplier: 0, cooldown: 3, effect: 'defense_boost' }
      ])
    },
    {
      id: 'char_002',
      name: 'Merlin',
      title: 'The Eternal Wizard',
      archetype: 'scholar',
      origin_era: 'Arthurian Legend',
      rarity: 'legendary',
      base_health: 80,
      base_attack: 95,
      base_defense: 50,
      base_speed: 75,
      base_special: 100,
      personality_traits: JSON.stringify(['wise', 'mysterious', 'caring', 'mischievous']),
      conversation_style: 'formal_ancient',
      backstory: 'Legendary wizard and advisor to King Arthur, master of time and magic.',
      conversation_topics: JSON.stringify(['Magic', 'The future', 'Arthur', 'Time']),
      avatar_emoji: '🧙',
      abilities: JSON.stringify([
        { name: 'Fireball', damage_multiplier: 1.8, cooldown: 2 },
        { name: 'Ice Shield', damage_multiplier: 0, cooldown: 3, effect: 'shield' },
        { name: 'Lightning Bolt', damage_multiplier: 2.2, cooldown: 4 },
        { name: 'Time Warp', damage_multiplier: 0, cooldown: 5, effect: 'skip_enemy_turn' }
      ])
    },
    {
      id: 'char_003',
      name: 'Robin Hood',
      title: 'The Forest Outlaw',
      archetype: 'trickster',
      origin_era: 'Medieval England',
      rarity: 'uncommon',
      base_health: 85,
      base_attack: 75,
      base_defense: 60,
      base_speed: 90,
      base_special: 80,
      personality_traits: JSON.stringify(['just', 'clever', 'rebellious', 'charismatic']),
      conversation_style: 'casual_medieval',
      backstory: 'Legendary outlaw who stole from the rich to give to the poor.',
      conversation_topics: JSON.stringify(['Justice', 'Sherwood Forest', 'Archery', 'The poor']),
      avatar_emoji: '🏹',
      abilities: JSON.stringify([
        { name: 'Precise Shot', damage_multiplier: 1.6, cooldown: 1 },
        { name: 'Trick Shot', damage_multiplier: 1.4, cooldown: 2, effect: 'confusion' },
        { name: 'Rain of Arrows', damage_multiplier: 1.8, cooldown: 3 },
        { name: 'Stealth Strike', damage_multiplier: 2.0, cooldown: 4 }
      ])
    },
    {
      id: 'char_004',
      name: 'Cleopatra',
      title: 'The Last Pharaoh',
      archetype: 'leader',
      origin_era: 'Ancient Egypt',
      rarity: 'rare',
      base_health: 90,
      base_attack: 70,
      base_defense: 80,
      base_speed: 75,
      base_special: 95,
      personality_traits: JSON.stringify(['intelligent', 'charismatic', 'ambitious', 'diplomatic']),
      conversation_style: 'regal_ancient',
      backstory: 'Last pharaoh of Egypt, known for her intelligence and political acumen.',
      conversation_topics: JSON.stringify(['Egypt', 'Politics', 'Rome', 'Power']),
      avatar_emoji: '👑',
      abilities: JSON.stringify([
        { name: 'Royal Command', damage_multiplier: 1.3, cooldown: 2, effect: 'intimidate' },
        { name: 'Divine Protection', damage_multiplier: 0, cooldown: 3, effect: 'heal' },
        { name: 'Serpent Strike', damage_multiplier: 1.7, cooldown: 3, effect: 'poison' },
        { name: 'Pharaoh\'s Wrath', damage_multiplier: 2.5, cooldown: 5 }
      ])
    },
    {
      id: 'char_005',
      name: 'Tesla',
      title: 'The Lightning Master',
      archetype: 'scholar',
      origin_era: 'Industrial Age',
      rarity: 'rare',
      base_health: 75,
      base_attack: 85,
      base_defense: 55,
      base_speed: 80,
      base_special: 100,
      personality_traits: JSON.stringify(['genius', 'eccentric', 'visionary', 'obsessive']),
      conversation_style: 'scientific_formal',
      backstory: 'Brilliant inventor and electrical engineer who harnessed the power of lightning.',
      conversation_topics: JSON.stringify(['Electricity', 'Invention', 'Science', 'The future']),
      avatar_emoji: '⚡',
      abilities: JSON.stringify([
        { name: 'Electric Shock', damage_multiplier: 1.4, cooldown: 1, effect: 'stun' },
        { name: 'Tesla Coil', damage_multiplier: 1.9, cooldown: 3 },
        { name: 'Chain Lightning', damage_multiplier: 1.6, cooldown: 2, effect: 'chain' },
        { name: 'Wireless Power', damage_multiplier: 0, cooldown: 4, effect: 'energy_boost' }
      ])
    }
  ];

  const insertMany = db.transaction((characters) => {
    for (const char of characters) {
      insertCharacter.run(
        char.id, char.name, char.title, char.archetype, char.origin_era, char.rarity,
        char.base_health, char.base_attack, char.base_defense, char.base_speed, char.base_special,
        char.personality_traits, char.conversation_style, char.backstory, char.conversation_topics,
        char.avatar_emoji, char.abilities
      );
    }
  });

  insertMany(characters);
  console.log(`✅ Seeded ${characters.length} characters`);
};

// Database query helper
export const query = (sql: string, params?: any[]): any => {
  try {
    if (sql.trim().toLowerCase().startsWith('select')) {
      const stmt = db.prepare(sql);
      return { rows: stmt.all(params || []) };
    } else {
      const stmt = db.prepare(sql);
      const result = stmt.run(params || []);
      return { 
        rows: [{ id: result.lastInsertRowid }],
        rowCount: result.changes 
      };
    }
  } catch (error) {
    console.error('❌ Database query failed:', error);
    throw error;
  }
};

// Export cache service (Redis with in-memory fallback)
import { cacheService } from '../services/cacheService';
export const cache = cacheService;

export { db };