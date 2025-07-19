import { Pool } from 'pg';

// PostgreSQL database connection for all environments
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !databaseUrl.startsWith('postgres')) {
  throw new Error('DATABASE_URL must be a PostgreSQL connection string');
}

console.log('🐘 Using PostgreSQL database');
export const db = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// PostgreSQL query function
export const query = async (sql: string, params?: any[]): Promise<any> => {
  try {
    const result = await db.query(sql, params || []);
    return { 
      rows: result.rows,
      rowCount: result.rowCount 
    };
  } catch (error) {
    console.error('Database query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
};

// Initialize database schema
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🗄️ Initializing database...');
    
    // Create tables with PostgreSQL syntax
    const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'legendary')),
        subscription_expires_at TIMESTAMP,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        injury_severity TEXT DEFAULT 'healthy' CHECK (injury_severity IN ('healthy', 'light', 'moderate', 'severe', 'critical', 'dead')),
        is_dead BOOLEAN DEFAULT FALSE,
        death_timestamp TIMESTAMP,
        recovery_time TIMESTAMP,
        resurrection_available_at TIMESTAMP,
        death_count INTEGER DEFAULT 0,
        pre_death_level INTEGER,
        pre_death_experience INTEGER,
        equipment TEXT DEFAULT '[]',
        enhancements TEXT DEFAULT '[]',
        conversation_memory TEXT DEFAULT '[]',
        significant_memories TEXT DEFAULT '[]',
        personality_drift TEXT DEFAULT '{}',
        wallet INTEGER DEFAULT 0,
        financial_stress INTEGER DEFAULT 0,
        coach_trust_level INTEGER DEFAULT 0,
        acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_battle_at TIMESTAMP,
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
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (character_id) REFERENCES user_characters(id),
        FOREIGN KEY (battle_id) REFERENCES battles(id)
      );

      -- User Currency table
      CREATE TABLE IF NOT EXISTS user_currency (
        user_id TEXT PRIMARY KEY,
        battle_tokens INTEGER DEFAULT 100,
        premium_currency INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Coach Progression table
      CREATE TABLE IF NOT EXISTS coach_progression (
        user_id TEXT PRIMARY KEY,
        coach_level INTEGER DEFAULT 1,
        coach_experience INTEGER DEFAULT 0,
        coach_title TEXT DEFAULT 'Rookie Coach',
        psychology_skill_points INTEGER DEFAULT 0,
        battle_strategy_skill_points INTEGER DEFAULT 0,
        character_development_skill_points INTEGER DEFAULT 0,
        total_battles_coached INTEGER DEFAULT 0,
        total_wins_coached INTEGER DEFAULT 0,
        psychology_interventions INTEGER DEFAULT 0,
        successful_interventions INTEGER DEFAULT 0,
        gameplan_adherence_rate REAL DEFAULT 0.0,
        team_chemistry_improvements INTEGER DEFAULT 0,
        character_developments INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Coach XP Events table (for tracking XP sources)
      CREATE TABLE IF NOT EXISTS coach_xp_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_type TEXT NOT NULL CHECK (event_type IN ('battle_win', 'battle_loss', 'psychology_management', 'character_development')),
        event_subtype TEXT,
        xp_gained INTEGER NOT NULL,
        description TEXT,
        battle_id TEXT,
        character_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (battle_id) REFERENCES battles(id),
        FOREIGN KEY (character_id) REFERENCES user_characters(id)
      );

      -- Coach Skills table (for unlocked abilities)
      CREATE TABLE IF NOT EXISTS coach_skills (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        skill_tree TEXT NOT NULL CHECK (skill_tree IN ('psychology_mastery', 'battle_strategy', 'character_development')),
        skill_name TEXT NOT NULL,
        skill_level INTEGER DEFAULT 1,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Claimable Packs table (for pack system)
      CREATE TABLE IF NOT EXISTS claimable_packs (
        id TEXT PRIMARY KEY,
        pack_type VARCHAR(50) NOT NULL,
        is_claimed BOOLEAN DEFAULT FALSE,
        claimed_by_user_id TEXT REFERENCES users(id),
        claimed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Claimable Pack Contents table (for pack contents)
      CREATE TABLE IF NOT EXISTS claimable_pack_contents (
        id TEXT PRIMARY KEY,
        pack_id TEXT NOT NULL REFERENCES claimable_packs(id) ON DELETE CASCADE,
        character_id TEXT NOT NULL REFERENCES characters(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Healing Facilities table
      CREATE TABLE IF NOT EXISTS healing_facilities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        facility_type TEXT NOT NULL CHECK (facility_type IN ('basic_medical', 'advanced_medical', 'premium_medical', 'resurrection_chamber')),
        healing_rate_multiplier DECIMAL(3,2) DEFAULT 1.0,
        currency_cost_per_hour INTEGER DEFAULT 0,
        premium_cost_per_hour INTEGER DEFAULT 0,
        max_injury_severity TEXT CHECK (max_injury_severity IN ('light', 'moderate', 'severe', 'critical', 'dead')),
        headquarters_tier_required TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Character Healing Sessions table
      CREATE TABLE IF NOT EXISTS character_healing_sessions (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL REFERENCES user_characters(id) ON DELETE CASCADE,
        facility_id TEXT NOT NULL REFERENCES healing_facilities(id),
        session_type TEXT NOT NULL CHECK (session_type IN ('injury_healing', 'resurrection')),
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        estimated_completion_time TIMESTAMP NOT NULL,
        currency_paid INTEGER DEFAULT 0,
        premium_paid INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Execute each CREATE TABLE statement separately for PostgreSQL
    const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement.trim());
      }
    }

    // Add financial columns and character progression tables if they don't exist
    const alterTableStatements = [
      `ALTER TABLE user_characters ADD COLUMN IF NOT EXISTS wallet INTEGER DEFAULT 0`,
      `ALTER TABLE user_characters ADD COLUMN IF NOT EXISTS financial_stress INTEGER DEFAULT 0`,
      `ALTER TABLE user_characters ADD COLUMN IF NOT EXISTS coach_trust_level INTEGER DEFAULT 0`,
      `ALTER TABLE coach_progression ADD COLUMN IF NOT EXISTS financial_advice_given INTEGER DEFAULT 0`,
      `ALTER TABLE coach_progression ADD COLUMN IF NOT EXISTS successful_financial_advice INTEGER DEFAULT 0`,
      `ALTER TABLE coach_progression ADD COLUMN IF NOT EXISTS spirals_prevented INTEGER DEFAULT 0`,
      `ALTER TABLE coach_progression ADD COLUMN IF NOT EXISTS financial_conflicts_resolved INTEGER DEFAULT 0`,
      `ALTER TABLE coach_xp_events DROP CONSTRAINT IF EXISTS coach_xp_events_event_type_check`,
      `ALTER TABLE coach_xp_events ADD CONSTRAINT coach_xp_events_event_type_check CHECK (event_type IN ('battle_win', 'battle_loss', 'psychology_management', 'character_development', 'financial_coaching'))`
    ];

    // Character progression tables
    const characterProgressionTables = [
      `CREATE TABLE IF NOT EXISTS character_progression (
        character_id TEXT PRIMARY KEY REFERENCES user_characters(id) ON DELETE CASCADE,
        stat_points INTEGER DEFAULT 0,
        skill_points INTEGER DEFAULT 0,
        ability_points INTEGER DEFAULT 0,
        tier TEXT DEFAULT 'novice',
        title TEXT DEFAULT 'Novice',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS character_skills (
        id TEXT PRIMARY KEY,
        character_id TEXT REFERENCES user_characters(id) ON DELETE CASCADE,
        skill_id TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        max_level INTEGER DEFAULT 10,
        unlocked BOOLEAN DEFAULT false,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(character_id, skill_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS character_abilities (
        id TEXT PRIMARY KEY,
        character_id TEXT REFERENCES user_characters(id) ON DELETE CASCADE,
        ability_id TEXT NOT NULL,
        ability_name TEXT NOT NULL,
        rank INTEGER DEFAULT 1,
        max_rank INTEGER DEFAULT 5,
        unlocked BOOLEAN DEFAULT false,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(character_id, ability_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS character_experience_log (
        id TEXT PRIMARY KEY,
        character_id TEXT REFERENCES user_characters(id) ON DELETE CASCADE,
        source TEXT NOT NULL CHECK (source IN ('battle', 'training', 'quest', 'achievement', 'daily', 'event')),
        amount INTEGER NOT NULL,
        multiplier DECIMAL(3,2) DEFAULT 1.0,
        description TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const alterSQL of alterTableStatements) {
      try {
        await query(alterSQL);
      } catch (error) {
        // Column might already exist, continue
        console.log('Note: Column might already exist:', error);
      }
    }

    // Create character progression tables
    for (const tableSQL of characterProgressionTables) {
      try {
        await query(tableSQL);
        console.log('✅ Character progression table created/verified');
      } catch (error) {
        console.error('❌ Error creating character progression table:', error);
      }
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating)',
      'CREATE INDEX IF NOT EXISTS idx_user_characters_user_id ON user_characters(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_characters_character_id ON user_characters(character_id)',
      'CREATE INDEX IF NOT EXISTS idx_battles_player1 ON battles(player1_id)',
      'CREATE INDEX IF NOT EXISTS idx_character_skills_character_id ON character_skills(character_id)',
      'CREATE INDEX IF NOT EXISTS idx_character_abilities_character_id ON character_abilities(character_id)',
      'CREATE INDEX IF NOT EXISTS idx_character_experience_log_character_id ON character_experience_log(character_id)',
      'CREATE INDEX IF NOT EXISTS idx_character_experience_log_timestamp ON character_experience_log(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_battles_player2 ON battles(player2_id)',
      'CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status)',
      'CREATE INDEX IF NOT EXISTS idx_chat_messages_user_character ON chat_messages(user_id, character_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_currency_user_id ON user_currency(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_coach_progression_user_id ON coach_progression(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_coach_progression_level ON coach_progression(coach_level)',
      'CREATE INDEX IF NOT EXISTS idx_coach_xp_events_user_id ON coach_xp_events(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_coach_xp_events_type ON coach_xp_events(event_type)',
      'CREATE INDEX IF NOT EXISTS idx_coach_xp_events_battle ON coach_xp_events(battle_id)',
      'CREATE INDEX IF NOT EXISTS idx_coach_skills_user_id ON coach_skills(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_coach_skills_tree ON coach_skills(skill_tree)'
    ];

    for (const indexSQL of indexes) {
      try {
        await query(indexSQL);
      } catch (error) {
        // Index might already exist, continue
      }
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Export cache service (Redis with in-memory fallback)
import { cacheService } from '../services/cacheService';
export const cache = cacheService;

