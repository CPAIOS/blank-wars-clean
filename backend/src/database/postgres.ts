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
        archetype TEXT CHECK (archetype IN ('warrior', 'scholar', 'trickster', 'beast', 'leader', 'mage', 'mystic', 'tank', 'assassin')),
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

// Import character data from frontend
import { characterTemplates } from '../../frontend/src/data/characters';

// Seed initial character data for PostgreSQL using frontend data
const seedCharacters = async (): Promise<void> => {
  // Convert frontend character templates to database format
  const characters = Object.entries(characterTemplates).map(([templateId, template]) => ({
    id: templateId,
    name: template.name,
    title: template.title || '',
    archetype: template.archetype,
    origin_era: template.historicalPeriod || '',
    rarity: template.rarity,
    base_health: template.combatStats.maxHealth,
    base_attack: template.combatStats.attack,
    base_defense: template.combatStats.defense,
    base_speed: template.combatStats.speed,
    base_special: Math.round((template.combatStats.magicAttack + template.combatStats.magicDefense) / 2),
    personality_traits: JSON.stringify(template.personality.traits),
    conversation_style: template.personality.speechStyle,
    backstory: template.description,
    conversation_topics: JSON.stringify(template.personality.motivations),
    avatar_emoji: template.avatar,
    abilities: JSON.stringify({
      baseStats: template.baseStats,
      combatStats: template.combatStats,
      battleAI: {
        aggression: template.combatAI?.aggression || 50,
        defensiveness: template.combatAI?.defensiveness || 50,
        riskTaking: template.combatAI?.riskTaking || 50,
        adaptability: template.combatAI?.adaptability || 50,
        preferredStrategies: template.combatAI?.preferredStrategies || []
      },
      battleQuotes: template.customization?.battleQuotes || []
    })
  }));

  try {
    for (const char of characters) {
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