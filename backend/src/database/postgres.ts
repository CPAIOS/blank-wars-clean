import { Pool } from 'pg';

// Database connection using environment variable or fallback to SQLite for local development
const databaseUrl = process.env.DATABASE_URL;

let db: any;

if (databaseUrl && databaseUrl.startsWith('postgres')) {
  // Production: Use PostgreSQL
  console.log('🐘 Using PostgreSQL database');
  db = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} else {
  // Development: Use SQLite
  console.log('🗄️ Using SQLite database for development');
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs = require('fs');

  const DB_PATH = path.join(__dirname, '../../data/blankwars.db');
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  db = new Database(DB_PATH);
  db.exec('PRAGMA foreign_keys = ON');
}

// Universal query function that works with both PostgreSQL and SQLite
export const query = async (sql: string, params?: any[]): Promise<any> => {
  try {
    if (databaseUrl && databaseUrl.startsWith('postgres')) {
      // PostgreSQL query
      const result = await db.query(sql, params || []);
      return { 
        rows: result.rows,
        rowCount: result.rowCount 
      };
    } else {
      // SQLite query
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
    }
  } catch (error) {
    console.error('❌ Database query failed:', error);
    throw error;
  }
};

// Initialize database schema
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🗄️ Initializing database...');
    
    // Check if we're using PostgreSQL
    const isPostgres = databaseUrl && databaseUrl.startsWith('postgres');
    
    // Create tables with PostgreSQL/SQLite compatible syntax
    const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'legendary')),
        subscription_expires_at ${isPostgres ? 'TIMESTAMP' : 'DATETIME'},
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        total_battles INTEGER DEFAULT 0,
        total_wins INTEGER DEFAULT 0,
        rating INTEGER DEFAULT 1000,
        daily_chat_count INTEGER DEFAULT 0,
        daily_chat_reset_date TEXT DEFAULT '',
        daily_image_count INTEGER DEFAULT 0,
        daily_image_reset_date TEXT DEFAULT '',
        daily_battle_count INTEGER DEFAULT 0,
        daily_battle_reset_date TEXT DEFAULT '',
        daily_training_count INTEGER DEFAULT 0,
        daily_training_reset_date TEXT DEFAULT '',
        character_slot_capacity INTEGER DEFAULT 6,
        created_at ${isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
        updated_at ${isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'}
      );

      -- Characters table
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT,
        archetype TEXT CHECK (archetype IN ('warrior', 'scholar', 'trickster', 'beast', 'leader', 'mage', 'mystic', 'tank', 'assassin', 'support', 'elementalist')),
        origin_era TEXT,
        rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
        base_health INTEGER NOT NULL,
        base_attack INTEGER NOT NULL,
        base_defense INTEGER NOT NULL,
        base_speed INTEGER NOT NULL,
        base_special INTEGER NOT NULL,
        personality_traits TEXT,
        conversation_style TEXT,
        backstory TEXT,
        conversation_topics TEXT,
        avatar_emoji TEXT,
        artwork_url TEXT,
        abilities TEXT,
        created_at ${isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'}
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
        recovery_time ${isPostgres ? 'TIMESTAMP' : 'DATETIME'},
        equipment TEXT DEFAULT '[]',
        enhancements TEXT DEFAULT '[]',
        conversation_memory TEXT DEFAULT '[]',
        significant_memories TEXT DEFAULT '[]',
        personality_drift TEXT DEFAULT '{}',
        acquired_at ${isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
        last_battle_at ${isPostgres ? 'TIMESTAMP' : 'DATETIME'},
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
        combat_log TEXT DEFAULT '[]',
        chat_logs TEXT DEFAULT '[]',
        xp_gained INTEGER DEFAULT 0,
        bond_gained INTEGER DEFAULT 0,
        currency_gained INTEGER DEFAULT 0,
        started_at ${isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
        ended_at ${isPostgres ? 'TIMESTAMP' : 'DATETIME'},
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
        message_context TEXT,
        model_used TEXT,
        tokens_used INTEGER,
        response_time_ms INTEGER,
        bond_increase BOOLEAN DEFAULT FALSE,
        memory_saved BOOLEAN DEFAULT FALSE,
        created_at ${isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (character_id) REFERENCES user_characters(id),
        FOREIGN KEY (battle_id) REFERENCES battles(id)
      );

      -- User Currency table
      CREATE TABLE IF NOT EXISTS user_currency (
        user_id TEXT PRIMARY KEY,
        battle_tokens INTEGER DEFAULT 100,
        premium_currency INTEGER DEFAULT 0,
        last_updated ${isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    if (isPostgres) {
      // Execute each CREATE TABLE statement separately for PostgreSQL
      const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await query(statement.trim());
        }
      }
    } else {
      // SQLite can handle multiple statements
      db.exec(createTablesSQL);
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating)',
      'CREATE INDEX IF NOT EXISTS idx_user_characters_user_id ON user_characters(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_characters_character_id ON user_characters(character_id)',
      'CREATE INDEX IF NOT EXISTS idx_battles_player1 ON battles(player1_id)',
      'CREATE INDEX IF NOT EXISTS idx_battles_player2 ON battles(player2_id)',
      'CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status)',
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_user_character ON chat_messages(user_id, character_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_currency_user_id ON user_currency(user_id)'
    ];

    for (const indexSQL of indexes) {
      try {
        await query(indexSQL);
      } catch (error) {
        // Index might already exist, continue
      }
    }

    // Seed characters if none exist
    const characterCountResult = await query('SELECT COUNT(*) as count FROM characters');
    const characterCount = parseInt(characterCountResult.rows[0].count);
    
    if (characterCount === 0) {
      console.log('📚 Seeding initial character data...');
      try {
        await seedCharacters();
        console.log('✅ Character seeding completed successfully');
      } catch (error) {
        console.error('❌ Character seeding failed:', error);
        throw error;
      }
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Use existing character data from SQLite seeding
const seedCharacters = async (): Promise<void> => {
  // Get database URL to determine database type
  const databaseUrl = process.env.DATABASE_URL;
  
  // Character data from existing backend seeding
  const characters = [
    {
      id: 'achilles',
      name: 'Achilles',
      title: 'Hero of Troy',
      archetype: 'warrior',
      origin_era: 'Ancient Greece (1200 BCE)',
      rarity: 'legendary',
      base_health: 1200,
      base_attack: 185,
      base_defense: 120,
      base_speed: 140,
      base_special: 90,
      personality_traits: JSON.stringify(['Honorable', 'Wrathful', 'Courageous', 'Prideful']),
      conversation_style: 'Noble and passionate',
      backstory: 'The greatest warrior of the Trojan War, nearly invincible in combat but driven by rage and honor.',
      conversation_topics: JSON.stringify(['Glory', 'Honor', 'Revenge', 'Troy', 'Combat']),
      avatar_emoji: '⚔️',
      abilities: JSON.stringify({
        baseStats: { strength: 95, agility: 85, intelligence: 60, vitality: 90, wisdom: 45, charisma: 80 },
        combatStats: { maxHealth: 1200, maxMana: 300, magicAttack: 50, magicDefense: 80, criticalChance: 25, criticalDamage: 200, accuracy: 90, evasion: 20 },
        battleAI: { aggression: 90, defensiveness: 30, riskTaking: 80, adaptability: 60, preferredStrategies: ['frontal_assault', 'berserker_rush', 'honor_duel'] },
        battleQuotes: ['For glory and honor!', 'Face me if you dare!', 'The gods smile upon me!', 'None can stand against my might!']
      })
    },
    {
      id: 'merlin',
      name: 'Merlin',
      title: 'Archmage of Camelot',
      archetype: 'mage',
      origin_era: 'Medieval Britain (5th-6th century)',
      rarity: 'mythic',
      base_health: 800,
      base_attack: 60,
      base_defense: 80,
      base_speed: 90,
      base_special: 100,
      personality_traits: JSON.stringify(['Wise', 'Mysterious', 'Patient', 'Calculating']),
      conversation_style: 'Archaic and profound',
      backstory: 'The legendary wizard advisor to King Arthur, master of ancient magic and prophecy.',
      conversation_topics: JSON.stringify(['Knowledge', 'Balance', 'Protecting the realm', 'Magic', 'Time']),
      avatar_emoji: '🔮',
      abilities: JSON.stringify({
        baseStats: { strength: 30, agility: 50, intelligence: 98, vitality: 70, wisdom: 95, charisma: 85 },
        combatStats: { maxHealth: 800, maxMana: 2000, magicAttack: 200, magicDefense: 180, criticalChance: 15, criticalDamage: 300, accuracy: 95, evasion: 25 },
        battleAI: { aggression: 40, defensiveness: 80, riskTaking: 30, adaptability: 95, preferredStrategies: ['spell_weaving', 'defensive_barriers', 'elemental_control'] },
        battleQuotes: ['The ancient words have power...', 'Magic flows through all things', 'By the old ways, I command thee!', 'Witness the might of ages past']
      })
    },
    {
      id: 'fenrir',
      name: 'Fenrir',
      title: 'The Great Wolf',
      archetype: 'beast',
      origin_era: 'Norse Age (8th-11th century)',
      rarity: 'legendary',
      base_health: 1400,
      base_attack: 170,
      base_defense: 100,
      base_speed: 180,
      base_special: 95,
      personality_traits: JSON.stringify(['Savage', 'Loyal', 'Vengeful', 'Primal']),
      conversation_style: 'Growling and direct',
      backstory: 'The monstrous wolf of Norse mythology, prophesied to devour Odin during Ragnarök.',
      conversation_topics: JSON.stringify(['Freedom', 'Vengeance', 'Pack loyalty', 'The hunt']),
      avatar_emoji: '🐺',
      abilities: JSON.stringify({
        baseStats: { strength: 90, agility: 95, intelligence: 40, vitality: 95, wisdom: 30, charisma: 50 },
        combatStats: { maxHealth: 1400, maxMana: 200, magicAttack: 30, magicDefense: 60, criticalChance: 30, criticalDamage: 220, accuracy: 88, evasion: 30 },
        battleAI: { aggression: 95, defensiveness: 20, riskTaking: 85, adaptability: 40, preferredStrategies: ['savage_rush', 'pack_tactics', 'intimidation'] },
        battleQuotes: ['*Fierce growling*', 'The hunt begins!', '*Howls menacingly*', 'You smell of fear...']
      })
    },
    {
      id: 'cleopatra',
      name: 'Cleopatra VII',
      title: 'Last Pharaoh of Egypt',
      archetype: 'mystic',
      origin_era: 'Ptolemaic Egypt (69-30 BCE)',
      rarity: 'epic',
      base_health: 900,
      base_attack: 80,
      base_defense: 95,
      base_speed: 110,
      base_special: 95,
      personality_traits: JSON.stringify(['Brilliant', 'Charismatic', 'Ambitious', 'Diplomatic']),
      conversation_style: 'Regal and commanding',
      backstory: 'The brilliant and charismatic final pharaoh of Ancient Egypt, master of politics and ancient mysteries.',
      conversation_topics: JSON.stringify(['Power', 'Legacy', 'Egyptian restoration', 'Politics']),
      avatar_emoji: '👑',
      abilities: JSON.stringify({
        baseStats: { strength: 45, agility: 65, intelligence: 90, vitality: 70, wisdom: 85, charisma: 98 },
        combatStats: { maxHealth: 900, maxMana: 1600, magicAttack: 150, magicDefense: 160, criticalChance: 20, criticalDamage: 150, accuracy: 80, evasion: 35 },
        battleAI: { aggression: 50, defensiveness: 70, riskTaking: 60, adaptability: 85, preferredStrategies: ['strategic_planning', 'diplomatic_solutions', 'resource_manipulation'] },
        battleQuotes: ['I am the daughter of Ra!', 'Egypt\'s glory shall not fade', 'Bow before the true pharaoh', 'The gods favor the worthy']
      })
    },
    {
      id: 'holmes',
      name: 'Sherlock Holmes',
      title: 'The Great Detective',
      archetype: 'scholar',
      origin_era: 'Victorian England (1880s-1920s)',
      rarity: 'rare',
      base_health: 700,
      base_attack: 85,
      base_defense: 70,
      base_speed: 120,
      base_special: 100,
      personality_traits: JSON.stringify(['Analytical', 'Observant', 'Eccentric', 'Brilliant']),
      conversation_style: 'Precise and deductive',
      backstory: 'The world\'s greatest consulting detective, master of observation and logical deduction.',
      conversation_topics: JSON.stringify(['Truth', 'Justice', 'Intellectual challenge', 'Crime', 'Logic']),
      avatar_emoji: '🕵️',
      abilities: JSON.stringify({
        baseStats: { strength: 60, agility: 80, intelligence: 98, vitality: 55, wisdom: 90, charisma: 70 },
        combatStats: { maxHealth: 700, maxMana: 1400, magicAttack: 120, magicDefense: 100, criticalChance: 35, criticalDamage: 250, accuracy: 95, evasion: 40 },
        battleAI: { aggression: 30, defensiveness: 60, riskTaking: 40, adaptability: 95, preferredStrategies: ['analytical_combat', 'precision_strikes', 'enemy_prediction'] },
        battleQuotes: ['Elementary, my dear Watson', 'The game is afoot!', 'I observe everything', 'Logic is my weapon']
      })
    }
  ];

  try {
    // Check if we're using PostgreSQL or SQLite to use correct parameter syntax
    const isPostgres = databaseUrl && databaseUrl.startsWith('postgres');
    
    for (const char of characters) {
      if (isPostgres) {
        // PostgreSQL syntax with $1, $2, etc.
        await query(`
          INSERT INTO characters (
            id, name, title, archetype, origin_era, rarity,
            base_health, base_attack, base_defense, base_speed, base_special,
            personality_traits, conversation_style, backstory, conversation_topics,
            avatar_emoji, abilities
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          char.id, char.name, char.title, char.archetype, char.origin_era, char.rarity,
          char.base_health, char.base_attack, char.base_defense, char.base_speed, char.base_special,
          char.personality_traits, char.conversation_style, char.backstory, char.conversation_topics,
          char.avatar_emoji, char.abilities
        ]);
      } else {
        // SQLite syntax with ? placeholders
        await query(`
          INSERT INTO characters (
            id, name, title, archetype, origin_era, rarity,
            base_health, base_attack, base_defense, base_speed, base_special,
            personality_traits, conversation_style, backstory, conversation_topics,
            avatar_emoji, abilities
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          char.id, char.name, char.title, char.archetype, char.origin_era, char.rarity,
          char.base_health, char.base_attack, char.base_defense, char.base_speed, char.base_special,
          char.personality_traits, char.conversation_style, char.backstory, char.conversation_topics,
          char.avatar_emoji, char.abilities
        ]);
      }
    }
    console.log(`✅ Seeded ${characters.length} characters with complete data`);
  } catch (error) {
    console.error('❌ Character seeding failed:', error);
    throw error;
  }
};

// Export cache service (Redis with in-memory fallback)
import { cacheService } from '../services/cacheService';
export const cache = cacheService;

export { db };