import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { migrateAddClaimablePacks } from './migrations/add-claimable-packs';

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
        daily_chat_count INTEGER DEFAULT 0,
        daily_chat_reset_date TEXT DEFAULT '',
        daily_image_count INTEGER DEFAULT 0,
        daily_image_reset_date TEXT DEFAULT '',
        daily_battle_count INTEGER DEFAULT 0,
        daily_battle_reset_date TEXT DEFAULT '',
        daily_training_count INTEGER DEFAULT 0,
        daily_training_reset_date TEXT DEFAULT '',
        character_slot_capacity INTEGER DEFAULT 6,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

      -- User Headquarters table
      CREATE TABLE IF NOT EXISTS user_headquarters (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        tier_id TEXT DEFAULT 'spartan_apartment',
        coins INTEGER DEFAULT 50000,
        gems INTEGER DEFAULT 100,
        unlocked_themes TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Headquarters Rooms table
      CREATE TABLE IF NOT EXISTS headquarters_rooms (
        id TEXT PRIMARY KEY,
        headquarters_id TEXT NOT NULL,
        room_id TEXT NOT NULL,
        name TEXT NOT NULL,
        theme TEXT,
        elements TEXT DEFAULT '[]',
        assigned_characters TEXT DEFAULT '[]',
        max_characters INTEGER DEFAULT 2,
        custom_image_url TEXT,
        FOREIGN KEY (headquarters_id) REFERENCES user_headquarters(id) ON DELETE CASCADE
      );

      -- Room Beds table
      CREATE TABLE IF NOT EXISTS room_beds (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        bed_id TEXT NOT NULL,
        bed_type TEXT NOT NULL,
        position_x INTEGER,
        position_y INTEGER,
        capacity INTEGER,
        comfort_bonus INTEGER,
        FOREIGN KEY (room_id) REFERENCES headquarters_rooms(id) ON DELETE CASCADE
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

      -- Claimable Packs (for gifts, special offers, etc.)
      CREATE TABLE IF NOT EXISTS claimable_packs (
        id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
        pack_type TEXT NOT NULL, -- e.g., 'standard_starter', 'premium_starter', 'gift_pack_common'
        is_claimed BOOLEAN DEFAULT FALSE,
        claimed_by_user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        claimed_at DATETIME,
        
        FOREIGN KEY (claimed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      -- Contents of Claimable Packs
      CREATE TABLE IF NOT EXISTS claimable_pack_contents (
        id TEXT PRIMARY KEY, -- UUIDs stored as TEXT
        pack_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        is_granted BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (pack_id) REFERENCES claimable_packs(id) ON DELETE CASCADE,
        FOREIGN KEY (character_id) REFERENCES characters(id)
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
      try {
        await seedCharacters();
        console.log('✅ Character seeding completed successfully');
      } catch (error) {
        console.error('❌ Character seeding failed:', error);
        throw error;
      }
    }

    // Add training columns if they don't exist (migration)
    try {
      db.exec(`
        ALTER TABLE users ADD COLUMN daily_training_count INTEGER DEFAULT 0;
      `);
      console.log('✅ Added daily_training_count column');
    } catch (error) {
      // Column already exists, ignore
    }
    
    try {
      db.exec(`
        ALTER TABLE users ADD COLUMN daily_training_reset_date TEXT DEFAULT '';
      `);
      console.log('✅ Added daily_training_reset_date column');
    } catch (error) {
      // Column already exists, ignore
    }

    // Run migrations for existing databases
    console.log('🔄 Running database migrations...');
    try {
      runMigrations();
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('⚠️ Migration failed (continuing anyway):', error);
    }

    console.log('✅ SQLite database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Run database migrations
const runMigrations = (): void => {
  console.log('🔄 Checking for pending migrations...');
  
  // Run all available migrations
  migrateAddClaimablePacks(db);
  
  console.log('✅ All migrations completed');
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

  // All 17 characters from frontend with complete data preserved
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
    },
    {
      id: 'dracula',
      name: 'Count Dracula',
      title: 'Lord of the Undead',
      archetype: 'mystic',
      origin_era: 'Victorian Horror (1897)',
      rarity: 'legendary',
      base_health: 1100,
      base_attack: 140,
      base_defense: 90,
      base_speed: 130,
      base_special: 90,
      personality_traits: JSON.stringify(['Aristocratic', 'Manipulative', 'Ancient', 'Predatory']),
      conversation_style: 'Eloquent and menacing',
      backstory: 'The immortal vampire count, master of darkness and ancient evil.',
      conversation_topics: JSON.stringify(['Immortality', 'Power over mortals', 'The night', 'Blood', 'Dominion']),
      avatar_emoji: '🧛',
      abilities: JSON.stringify({
        baseStats: { strength: 85, agility: 90, intelligence: 80, vitality: 95, wisdom: 75, charisma: 95 },
        combatStats: { maxHealth: 1100, maxMana: 1200, magicAttack: 160, magicDefense: 140, criticalChance: 25, criticalDamage: 180, accuracy: 85, evasion: 45 },
        battleAI: { aggression: 70, defensiveness: 50, riskTaking: 65, adaptability: 80, preferredStrategies: ['life_drain', 'fear_tactics', 'supernatural_powers'] },
        battleQuotes: ['Welcome to my domain', 'I have crossed oceans of time', 'The night is mine', 'You cannot escape the darkness']
      })
    },
    {
      id: 'joan',
      name: 'Joan of Arc',
      title: 'The Maid of Orléans',
      archetype: 'warrior',
      origin_era: 'Medieval France (1412-1431)',
      rarity: 'epic',
      base_health: 1000,
      base_attack: 150,
      base_defense: 130,
      base_speed: 115,
      base_special: 85,
      personality_traits: JSON.stringify(['Devout', 'Courageous', 'Determined', 'Inspirational']),
      conversation_style: 'Passionate and faithful',
      backstory: 'The peasant girl who united France and led armies against the English through divine inspiration.',
      conversation_topics: JSON.stringify(['Divine mission', 'France', 'Faith', 'Liberation', 'Divine guidance']),
      avatar_emoji: '⚔️',
      abilities: JSON.stringify({
        baseStats: { strength: 75, agility: 70, intelligence: 65, vitality: 85, wisdom: 80, charisma: 90 },
        combatStats: { maxHealth: 1000, maxMana: 800, magicAttack: 100, magicDefense: 120, criticalChance: 20, criticalDamage: 170, accuracy: 85, evasion: 25 },
        battleAI: { aggression: 75, defensiveness: 60, riskTaking: 70, adaptability: 65, preferredStrategies: ['holy_charge', 'protective_leadership', 'divine_intervention'] },
        battleQuotes: ['God wills it!', 'For France and freedom!', 'I fear nothing but God', 'The Lord guides my blade']
      })
    },
    {
      id: 'frankenstein_monster',
      name: 'Frankenstein\'s Monster',
      title: 'The Created Being',
      archetype: 'tank',
      origin_era: 'Gothic Horror (1818)',
      rarity: 'rare',
      base_health: 1600,
      base_attack: 160,
      base_defense: 140,
      base_speed: 60,
      base_special: 70,
      personality_traits: JSON.stringify(['Misunderstood', 'Tormented', 'Intelligent', 'Lonely']),
      conversation_style: 'Eloquent but pained',
      backstory: 'An artificial being created from dead tissue, struggling with existence and seeking acceptance.',
      conversation_topics: JSON.stringify(['Acceptance', 'Understanding humanity', 'Creator\'s responsibility', 'Isolation']),
      avatar_emoji: '🧟',
      abilities: JSON.stringify({
        baseStats: { strength: 95, agility: 30, intelligence: 70, vitality: 100, wisdom: 60, charisma: 20 },
        combatStats: { maxHealth: 1600, maxMana: 400, magicAttack: 40, magicDefense: 80, criticalChance: 15, criticalDamage: 200, accuracy: 70, evasion: 10 },
        battleAI: { aggression: 60, defensiveness: 80, riskTaking: 50, adaptability: 55, preferredStrategies: ['overwhelming_force', 'defensive_endurance', 'emotional_appeals'] },
        battleQuotes: ['I am not a monster!', 'Why do you fear me?', 'I seek only understanding', 'Your creator made me this way']
      })
    },
    {
      id: 'sun_wukong',
      name: 'Sun Wukong',
      title: 'The Monkey King',
      archetype: 'trickster',
      origin_era: 'Chinese Mythology (Journey to the West)',
      rarity: 'mythic',
      base_health: 1300,
      base_attack: 175,
      base_defense: 85,
      base_speed: 200,
      base_special: 98,
      personality_traits: JSON.stringify(['Mischievous', 'Proud', 'Clever', 'Rebellious']),
      conversation_style: 'Playful and irreverent',
      backstory: 'The legendary Monkey King who challenged heaven itself, master of 72 transformations.',
      conversation_topics: JSON.stringify(['Freedom from authority', 'Magical tricks', 'Journey adventures', 'Immortality']),
      avatar_emoji: '🐵',
      abilities: JSON.stringify({
        baseStats: { strength: 90, agility: 100, intelligence: 85, vitality: 90, wisdom: 70, charisma: 80 },
        combatStats: { maxHealth: 1300, maxMana: 1800, magicAttack: 180, magicDefense: 120, criticalChance: 40, criticalDamage: 220, accuracy: 90, evasion: 50 },
        battleAI: { aggression: 80, defensiveness: 40, riskTaking: 90, adaptability: 95, preferredStrategies: ['shape_shifting', 'illusion_tactics', 'acrobatic_combat'] },
        battleQuotes: ['Haha! Try to catch me!', 'I am the Handsome Monkey King!', '72 transformations!', 'Even heaven fears me!']
      })
    },
    {
      id: 'sammy_slugger',
      name: 'Sammy "Slugger" Sullivan',
      title: 'Hard-Boiled Detective',
      archetype: 'scholar',
      origin_era: '1940s Film Noir',
      rarity: 'uncommon',
      base_health: 800,
      base_attack: 120,
      base_defense: 85,
      base_speed: 100,
      base_special: 75,
      personality_traits: JSON.stringify(['Cynical', 'Determined', 'Street-smart', 'Loyal']),
      conversation_style: 'Gritty and direct',
      backstory: 'A hard-boiled private detective from the mean streets, tough as nails with a code of honor.',
      conversation_topics: JSON.stringify(['Justice', 'The streets', 'Corruption', 'Truth', 'Honor among thieves']),
      avatar_emoji: '🕶️',
      abilities: JSON.stringify({
        baseStats: { strength: 75, agility: 80, intelligence: 85, vitality: 80, wisdom: 70, charisma: 65 },
        combatStats: { maxHealth: 800, maxMana: 600, magicAttack: 60, magicDefense: 70, criticalChance: 30, criticalDamage: 180, accuracy: 85, evasion: 35 },
        battleAI: { aggression: 65, defensiveness: 60, riskTaking: 70, adaptability: 80, preferredStrategies: ['street_fighting', 'investigation_tactics', 'underworld_connections'] },
        battleQuotes: ['The streets don\'t lie', 'I\'ve seen worse', 'Justice ain\'t pretty', 'This city\'s got teeth']
      })
    },
    {
      id: 'billy_the_kid',
      name: 'Billy the Kid',
      title: 'The Young Gunslinger',
      archetype: 'assassin',
      origin_era: 'American Old West (1870s-1880s)',
      rarity: 'rare',
      base_health: 650,
      base_attack: 165,
      base_defense: 60,
      base_speed: 190,
      base_special: 85,
      personality_traits: JSON.stringify(['Quick-tempered', 'Fearless', 'Youthful', 'Outlaw']),
      conversation_style: 'Casual and confident',
      backstory: 'The notorious young outlaw of the American frontier, lightning-fast with a gun.',
      conversation_topics: JSON.stringify(['The frontier', 'Quick draws', 'Outlaw life', 'Freedom', 'Reputation']),
      avatar_emoji: '🤠',
      abilities: JSON.stringify({
        baseStats: { strength: 70, agility: 95, intelligence: 60, vitality: 65, wisdom: 50, charisma: 75 },
        combatStats: { maxHealth: 650, maxMana: 400, magicAttack: 30, magicDefense: 40, criticalChance: 45, criticalDamage: 250, accuracy: 95, evasion: 60 },
        battleAI: { aggression: 85, defensiveness: 25, riskTaking: 90, adaptability: 70, preferredStrategies: ['quick_draw', 'hit_and_run', 'gunslinger_duels'] },
        battleQuotes: ['Draw!', 'Fastest gun in the West', 'You\'re not quick enough', 'This town ain\'t big enough']
      })
    },
    {
      id: 'genghis_khan',
      name: 'Genghis Khan',
      title: 'The Great Khan',
      archetype: 'leader',
      origin_era: 'Mongol Empire (1162-1227)',
      rarity: 'legendary',
      base_health: 1100,
      base_attack: 155,
      base_defense: 110,
      base_speed: 125,
      base_special: 90,
      personality_traits: JSON.stringify(['Ruthless', 'Strategic', 'Ambitious', 'Unifying']),
      conversation_style: 'Commanding and direct',
      backstory: 'The great conqueror who united the Mongol tribes and built the largest contiguous empire in history.',
      conversation_topics: JSON.stringify(['Conquest', 'Unity', 'Empire building', 'Military strategy', 'Legacy']),
      avatar_emoji: '🏹',
      abilities: JSON.stringify({
        baseStats: { strength: 85, agility: 80, intelligence: 90, vitality: 85, wisdom: 80, charisma: 95 },
        combatStats: { maxHealth: 1100, maxMana: 800, magicAttack: 70, magicDefense: 90, criticalChance: 25, criticalDamage: 180, accuracy: 80, evasion: 30 },
        battleAI: { aggression: 80, defensiveness: 60, riskTaking: 75, adaptability: 90, preferredStrategies: ['cavalry_charges', 'siege_warfare', 'psychological_warfare'] },
        battleQuotes: ['The greatest joy is to conquer', 'I am the flail of God', 'Submit or be destroyed', 'The empire grows']
      })
    },
    {
      id: 'tesla',
      name: 'Nikola Tesla',
      title: 'The Electrical Genius',
      archetype: 'scholar',
      origin_era: 'Industrial Revolution (1856-1943)',
      rarity: 'epic',
      base_health: 650,
      base_attack: 90,
      base_defense: 60,
      base_speed: 105,
      base_special: 100,
      personality_traits: JSON.stringify(['Brilliant', 'Eccentric', 'Visionary', 'Obsessive']),
      conversation_style: 'Scientific and passionate',
      backstory: 'The brilliant inventor who harnessed electricity and envisioned wireless technology.',
      conversation_topics: JSON.stringify(['Electricity', 'Innovation', 'The future', 'Scientific discovery', 'Wireless power']),
      avatar_emoji: '⚡',
      abilities: JSON.stringify({
        baseStats: { strength: 50, agility: 70, intelligence: 100, vitality: 55, wisdom: 85, charisma: 65 },
        combatStats: { maxHealth: 650, maxMana: 2000, magicAttack: 190, magicDefense: 120, criticalChance: 30, criticalDamage: 200, accuracy: 90, evasion: 35 },
        battleAI: { aggression: 50, defensiveness: 70, riskTaking: 60, adaptability: 85, preferredStrategies: ['electrical_attacks', 'technological_superiority', 'energy_manipulation'] },
        battleQuotes: ['The present is theirs; the future is mine', 'Let there be light!', 'Science is my weapon', 'Electricity obeys my will']
      })
    },
    {
      id: 'alien_grey',
      name: 'Zeta Reticulan',
      title: 'Cosmic Manipulator',
      archetype: 'mystic',
      origin_era: 'Modern UFO Mythology',
      rarity: 'rare',
      base_health: 750,
      base_attack: 110,
      base_defense: 80,
      base_speed: 140,
      base_special: 95,
      personality_traits: JSON.stringify(['Analytical', 'Detached', 'Curious', 'Advanced']),
      conversation_style: 'Clinical and otherworldly',
      backstory: 'An advanced extraterrestrial being studying Earth and its inhabitants.',
      conversation_topics: JSON.stringify(['Galactic knowledge', 'Human observation', 'Advanced technology', 'Universal truths']),
      avatar_emoji: '👽',
      abilities: JSON.stringify({
        baseStats: { strength: 40, agility: 85, intelligence: 95, vitality: 70, wisdom: 90, charisma: 60 },
        combatStats: { maxHealth: 750, maxMana: 1600, magicAttack: 170, magicDefense: 150, criticalChance: 25, criticalDamage: 180, accuracy: 95, evasion: 45 },
        battleAI: { aggression: 40, defensiveness: 70, riskTaking: 50, adaptability: 95, preferredStrategies: ['mind_control', 'advanced_technology', 'psychic_powers'] },
        battleQuotes: ['Your species is... interesting', 'We have observed this before', 'Resistance is illogical', 'Your minds are so simple']
      })
    },
    {
      id: 'robin_hood',
      name: 'Robin Hood',
      title: 'Prince of Thieves',
      archetype: 'trickster',
      origin_era: 'Medieval England (12th century)',
      rarity: 'uncommon',
      base_health: 850,
      base_attack: 130,
      base_defense: 75,
      base_speed: 160,
      base_special: 80,
      personality_traits: JSON.stringify(['Just', 'Clever', 'Rebellious', 'Charismatic']),
      conversation_style: 'Jovial and roguish',
      backstory: 'The legendary outlaw who stole from the rich to give to the poor in Sherwood Forest.',
      conversation_topics: JSON.stringify(['Justice', 'The poor', 'Sherwood Forest', 'Archery', 'Fighting tyranny']),
      avatar_emoji: '🏹',
      abilities: JSON.stringify({
        baseStats: { strength: 75, agility: 90, intelligence: 75, vitality: 75, wisdom: 70, charisma: 85 },
        combatStats: { maxHealth: 850, maxMana: 600, magicAttack: 60, magicDefense: 70, criticalChance: 35, criticalDamage: 190, accuracy: 95, evasion: 50 },
        battleAI: { aggression: 60, defensiveness: 50, riskTaking: 75, adaptability: 85, preferredStrategies: ['precision_archery', 'forest_tactics', 'guerrilla_warfare'] },
        battleQuotes: ['For the poor and oppressed!', 'A shot for justice!', 'Sherwood\'s finest!', 'Take from the rich!']
      })
    },
    {
      id: 'space_cyborg',
      name: 'Vega-X',
      title: 'Galactic Mercenary',
      archetype: 'tank',
      origin_era: 'Sci-Fi Future',
      rarity: 'epic',
      base_health: 1500,
      base_attack: 145,
      base_defense: 160,
      base_speed: 80,
      base_special: 85,
      personality_traits: JSON.stringify(['Mechanical', 'Logical', 'Efficient', 'Deadly']),
      conversation_style: 'Robotic and precise',
      backstory: 'A cybernetic warrior from the far future, part machine, part organic, all lethal.',
      conversation_topics: JSON.stringify(['Galactic warfare', 'Cybernetic enhancement', 'Mission efficiency', 'Tactical analysis']),
      avatar_emoji: '🤖',
      abilities: JSON.stringify({
        baseStats: { strength: 90, agility: 60, intelligence: 85, vitality: 95, wisdom: 70, charisma: 40 },
        combatStats: { maxHealth: 1500, maxMana: 800, magicAttack: 120, magicDefense: 140, criticalChance: 20, criticalDamage: 160, accuracy: 90, evasion: 20 },
        battleAI: { aggression: 70, defensiveness: 80, riskTaking: 50, adaptability: 75, preferredStrategies: ['heavy_weapons', 'tactical_analysis', 'cybernetic_enhancement'] },
        battleQuotes: ['Target acquired', 'Systems optimal', 'Resistance is futile', 'Mission parameters updated']
      })
    },
    {
      id: 'agent_x',
      name: 'Agent X',
      title: 'Shadow Operative',
      archetype: 'assassin',
      origin_era: 'Modern Espionage',
      rarity: 'rare',
      base_health: 700,
      base_attack: 155,
      base_defense: 70,
      base_speed: 170,
      base_special: 90,
      personality_traits: JSON.stringify(['Mysterious', 'Professional', 'Ruthless', 'Disciplined']),
      conversation_style: 'Cold and calculating',
      backstory: 'A shadowy operative whose true identity is unknown, master of infiltration and elimination.',
      conversation_topics: JSON.stringify(['Classified missions', 'National security', 'Infiltration', 'Elimination protocols']),
      avatar_emoji: '🕶️',
      abilities: JSON.stringify({
        baseStats: { strength: 80, agility: 95, intelligence: 85, vitality: 70, wisdom: 75, charisma: 60 },
        combatStats: { maxHealth: 700, maxMana: 800, magicAttack: 80, magicDefense: 80, criticalChance: 40, criticalDamage: 230, accuracy: 95, evasion: 55 },
        battleAI: { aggression: 75, defensiveness: 40, riskTaking: 65, adaptability: 90, preferredStrategies: ['stealth_attacks', 'tactical_elimination', 'information_warfare'] },
        battleQuotes: ['Target eliminated', 'Mission classified', 'No witnesses', 'Orders received']
      })
    },
    {
      id: 'kaelan',
      name: 'Kaelan',
      title: 'Town Guard',
      archetype: 'warrior',
      origin_era: 'Medieval Fantasy',
      rarity: 'common',
      base_health: 850,
      base_attack: 90,
      base_defense: 110,
      base_speed: 60,
      base_special: 20,
      personality_traits: JSON.stringify(['Loyal', 'Brave']),
      conversation_style: 'Formal, direct',
      backstory: 'A steadfast protector of the town\'s peace.',
      conversation_topics: JSON.stringify(['Duty', 'Honor']),
      avatar_emoji: '🛡️',
      abilities: JSON.stringify({})
    },
    {
      id: 'elara',
      name: 'Elara',
      title: 'Apprentice Wizard',
      archetype: 'mage',
      origin_era: 'Medieval Fantasy',
      rarity: 'common',
      base_health: 600,
      base_attack: 30,
      base_defense: 50,
      base_speed: 70,
      base_special: 115,
      personality_traits: JSON.stringify(['Curious', 'Studious', 'Eager', 'Inexperienced', 'Hopeful', 'Ambitious']),
      conversation_style: 'Eager and slightly verbose, sometimes unsure',
      backstory: 'A young, talented mage still learning to control their burgeoning magical abilities.',
      conversation_topics: JSON.stringify(['Mastering the arcane arts', 'Unlocking ancient secrets', 'Proving their worth']),
      avatar_emoji: '🧙‍♀️',
      abilities: JSON.stringify({})
    },
    {
      id: 'roric',
      name: 'Roric',
      title: 'Street Enforcer',
      archetype: 'assassin',
      origin_era: 'Medieval Fantasy',
      rarity: 'common',
      base_health: 750,
      base_attack: 110,
      base_defense: 60,
      base_speed: 125,
      base_special: 20,
      personality_traits: JSON.stringify(['Aggressive', 'Cunning', 'Intimidating', 'Opportunistic', 'Greedy']),
      conversation_style: 'Gruff and threatening',
      backstory: 'A rough individual who uses brute force and intimidation to control the streets.',
      conversation_topics: JSON.stringify(['Power', 'Wealth', 'Survival']),
      avatar_emoji: '👊',
      abilities: JSON.stringify({})
    },
    {
      id: 'griselda',
      name: 'Griselda',
      title: 'Wall of the Frontline',
      archetype: 'tank',
      origin_era: 'Medieval Fantasy',
      rarity: 'common',
      base_health: 1100,
      base_attack: 75,
      base_defense: 130,
      base_speed: 40,
      base_special: 10,
      personality_traits: JSON.stringify(['Resilient', 'Stoic', 'Protective', 'Patient', 'Determined']),
      conversation_style: 'Calm, resolute, and uses few words',
      backstory: 'A sturdy and stoic fighter who holds the line with a heavy shield, protecting allies from harm.',
      conversation_topics: JSON.stringify(['Protecting comrades', 'Endurance', 'Holding the line']),
      avatar_emoji: '🛡️',
      abilities: JSON.stringify({})
    },
    {
      id: 'orin',
      name: 'Orin',
      title: 'Devotee of Light',
      archetype: 'support',
      origin_era: 'Medieval Fantasy',
      rarity: 'common',
      base_health: 700,
      base_attack: 30,
      base_defense: 70,
      base_speed: 65,
      base_special: 85,
      personality_traits: JSON.stringify(['Compassionate', 'Devout', 'Humble', 'Hopeful', 'Selfless']),
      conversation_style: 'Gentle, reverent, and encouraging',
      backstory: 'A humble and devout servant dedicated to aiding others through faith and divine magic.',
      conversation_topics: JSON.stringify(['Serving a higher power', 'Healing the wounded', 'Spreading faith']),
      avatar_emoji: '🙏',
      abilities: JSON.stringify({})
    },
    {
      id: 'vargr',
      name: 'Vargr',
      title: 'Hunter of the Wild',
      archetype: 'beast',
      origin_era: 'N/A',
      rarity: 'common',
      base_health: 650,
      base_attack: 95,
      base_defense: 50,
      base_speed: 130,
      base_special: 5,
      personality_traits: JSON.stringify(['Fierce', 'Instinctive', 'Loyal (to pack)', 'Territorial', 'Patient']),
      conversation_style: 'A mix of growls, snarls, barks, and howls',
      backstory: 'A fierce and instinctual predator that roams the wilderness, hunting with primal coordination.',
      conversation_topics: JSON.stringify(['Survival', 'Protecting territory', 'The thrill of the hunt']),
      avatar_emoji: '🐺',
      abilities: JSON.stringify({})
    },
    {
      id: 'feste',
      name: 'Feste',
      title: 'Fool of the Court',
      archetype: 'trickster',
      origin_era: 'Medieval Fantasy',
      rarity: 'common',
      base_health: 600,
      base_attack: 50,
      base_defense: 50,
      base_speed: 130,
      base_special: 70,
      personality_traits: JSON.stringify(['Witty', 'Deceptive', 'Chaotic', 'Enigmatic', 'Playful']),
      conversation_style: 'Joking, sly, and speaks in riddles or puns',
      backstory: 'A playful and unpredictable performer who hides a sharp cunning behind a constant smile and a barrage of jokes.',
      conversation_topics: JSON.stringify(['Amusement', 'Sowing chaos', 'Uncovering secrets']),
      avatar_emoji: '🃏',
      abilities: JSON.stringify({})
    },
    {
      id: 'cassandra',
      name: 'Cassandra',
      title: 'Visionary of Fate',
      archetype: 'mystic',
      origin_era: 'Medieval Fantasy',
      rarity: 'common',
      base_health: 550,
      base_attack: 25,
      base_defense: 60,
      base_speed: 55,
      base_special: 90,
      personality_traits: JSON.stringify(['Mysterious', 'Insightful', 'Calm', 'Detached', 'Wise']),
      conversation_style: 'Cryptic, soft-spoken, and often prophetic',
      backstory: 'A gifted individual who glimpses the tangled threads of destiny, offering cryptic advice to those who listen.',
      conversation_topics: JSON.stringify(['Understanding truth', 'Guiding others to their fate', 'Averting catastrophe']),
      avatar_emoji: '🔮',
      abilities: JSON.stringify({})
    },
    {
      id: 'ignis',
      name: 'Ignis',
      title: 'Spark of the Flame',
      archetype: 'elementalist',
      origin_era: 'Medieval Fantasy',
      rarity: 'common',
      base_health: 650,
      base_attack: 40,
      base_defense: 45,
      base_speed: 90,
      base_special: 110,
      personality_traits: JSON.stringify(['Passionate', 'Reckless', 'Bold', 'Impulsive', 'Ambitious']),
      conversation_style: 'Bold, fiery, and excitable',
      backstory: 'A novice learning to wield the destructive and alluring power of fire, often with reckless abandon.',
      conversation_topics: JSON.stringify(['Attaining power', 'Mastering control', 'To be the brightest flame']),
      avatar_emoji: '🔥',
      abilities: JSON.stringify({})
    },
    {
      id: 'aidan',
      name: 'Aidan',
      title: 'Seeker of Wisdom',
      archetype: 'scholar',
      origin_era: 'Medieval Fantasy',
      rarity: 'common',
      base_health: 600,
      base_attack: 30,
      base_defense: 65,
      base_speed: 60,
      base_special: 80,
      personality_traits: JSON.stringify(['Curious', 'Diligent', 'Analytical', 'Polite', 'Inquisitive']),
      conversation_style: 'Polite, inquisitive, and sometimes overly academic',
      backstory: 'A young and diligent learner from a grand academy, eager to apply theoretical knowledge in the real world.',
      conversation_topics: JSON.stringify(['The pursuit of knowledge', 'Discovery', 'Making a breakthrough']),
      avatar_emoji: '📚',
      abilities: JSON.stringify({})
    },
    {
      id: 'snarl',
      name: 'Snarl',
      title: 'Sneaky Stalker',
      archetype: 'assassin',
      origin_era: 'N/A',
      rarity: 'common',
      base_health: 600,
      base_attack: 85,
      base_defense: 50,
      base_speed: 120,
      base_special: 25,
      personality_traits: JSON.stringify(['Cunning', 'Greedy', 'Cowardly', 'Mischievous', 'Cruel']),
      conversation_style: 'High-pitched, yipping, and mischievous',
      backstory: 'A small, cruel, green-skinned creature known for its cunning, greed, and a preference for ambushes.',
      conversation_topics: JSON.stringify(['Treasure', 'Survival', 'Malice']),
      avatar_emoji: '👹',
      abilities: JSON.stringify({})
    },
    {
      id: 'clatter',
      name: 'Clatter',
      title: 'Bone Defender',
      archetype: 'warrior',
      origin_era: 'N/A',
      rarity: 'common',
      base_health: 800,
      base_attack: 80,
      base_defense: 90,
      base_speed: 50,
      base_special: 0,
      personality_traits: JSON.stringify(['Mindless', 'Obedient', 'Tireless', 'Silent']),
      conversation_style: 'The dry clatter of bones',
      backstory: 'A reanimated skeleton mindlessly clutching a rusty sword and shield, bound to serve its master.',
      conversation_topics: JSON.stringify(['Following orders', 'Guarding a location']),
      avatar_emoji: '💀',
      abilities: JSON.stringify({})
    },
    {
      id: 'grak',
      name: 'Grak',
      title: 'Frontline Brute',
      archetype: 'warrior',
      origin_era: 'N/A',
      rarity: 'uncommon',
      base_health: 950,
      base_attack: 125,
      base_defense: 95,
      base_speed: 70,
      base_special: 10,
      personality_traits: JSON.stringify(['Aggressive', 'Loyal (to the horde)', 'Brutish', 'Direct', 'Fearless']),
      conversation_style: 'Gruff, guttural, and direct',
      backstory: 'A hulking orc warrior, bred for battle and feared for its raw power and unwavering loyalty to the horde.',
      conversation_topics: JSON.stringify(['Glory in battle', 'Serving the warchief', 'Proving strength']),
      avatar_emoji: '🧌',
      abilities: JSON.stringify({})
    },
    {
      id: 'barkus',
      name: 'Barkus',
      title: 'Forest Guardian',
      archetype: 'tank',
      origin_era: 'N/A',
      rarity: 'rare',
      base_health: 1400,
      base_attack: 100,
      base_defense: 150,
      base_speed: 30,
      base_special: 50,
      personality_traits: JSON.stringify(['Wise', 'Protective', 'Patient', 'Slow to anger', 'Unyielding']),
      conversation_style: 'Slow, deep, and rumbling like shifting wood',
      backstory: 'A massive, ancient tree-like creature that awakens to protect the forest from any and all threats with immense patience and strength.',
      conversation_topics: JSON.stringify(['Defending nature', 'Maintaining balance', 'Outliving its enemies']),
      avatar_emoji: '🌳',
      abilities: JSON.stringify({})
    },
    {
      id: 'gargan',
      name: 'Gargan',
      title: 'Stone Sentinel',
      archetype: 'tank',
      origin_era: 'N/A',
      rarity: 'uncommon',
      base_health: 1150,
      base_attack: 80,
      base_defense: 140,
      base_speed: 40,
      base_special: 20,
      personality_traits: JSON.stringify(['Stoic', 'Loyal', 'Vigilant', 'Patient', 'Territorial']),
      conversation_style: 'Gravelly, slow, and raspy',
      backstory: 'A stone creature that perches atop old buildings, coming to life at night to defend its territory with unyielding loyalty.',
      conversation_topics: JSON.stringify(['Guarding its charge', 'Enduring through time', 'Serving its creator']),
      avatar_emoji: '🗿',
      abilities: JSON.stringify({})
    },
    {
      id: 'grom',
      name: 'Grom',
      title: 'Wild Fury',
      archetype: 'berserker',
      origin_era: 'Ancient/Tribal',
      rarity: 'common',
      base_health: 850,
      base_attack: 130,
      base_defense: 45,
      base_speed: 95,
      base_special: 5,
      personality_traits: JSON.stringify(['Wild', 'Fearless', 'Savage', 'Impulsive', 'Proud']),
      conversation_style: 'Loud, primal, and uses guttural shouts',
      backstory: 'A savage warrior from the untamed wilds, driven by primal rage and instinct. They favor overwhelming offense over any semblance of defense.',
      conversation_topics: JSON.stringify(['Freedom', 'The thrill of battle', 'Survival', 'Proving their strength']),
      avatar_emoji: ' barbarian_avatar ',
      abilities: JSON.stringify({})
    },
    {
      id: 'sir_kaelen',
      name: 'Sir Kaelen',
      title: 'Oathbound Protector',
      archetype: 'warrior',
      origin_era: 'Medieval',
      rarity: 'common',
      base_health: 900,
      base_attack: 105,
      base_defense: 110,
      base_speed: 60,
      base_special: 15,
      personality_traits: JSON.stringify(['Honorable', 'Brave', 'Disciplined', 'Loyal', 'Righteous']),
      conversation_style: 'Formal, noble, and respectful',
      backstory: 'A noble warrior in plate armor, sworn by a strict code to uphold honor, defend the innocent, and serve with valor.',
      conversation_topics: JSON.stringify(['Upholding justice', 'Serving the realm', 'Protecting the weak', 'Honor']),
      avatar_emoji: '⚔️',
      abilities: JSON.stringify({})
    },
    {
      id: 'musashi',
      name: 'Musashi',
      title: 'The Sword Saint',
      archetype: 'duelist',
      origin_era: 'Feudal Japan (c. 1584-1645)',
      rarity: 'rare',
      base_health: 900,
      base_attack: 140,
      base_defense: 110,
      base_speed: 150,
      base_special: 20,
      personality_traits: JSON.stringify(['Disciplined', 'Strategic', 'Perceptive', 'Unflappable', 'Austere']),
      conversation_style: 'Calm, concise, and deeply philosophical',
      backstory: 'A famed Japanese swordsman, artist, and philosopher, undefeated in sixty-one duels. He authored "The Book of Five Rings" and pioneered the Niten Ichi-ryū style of two-sword combat.',
      conversation_topics: JSON.stringify(['Mastery of the sword', 'Achieving enlightenment through combat', 'Perfection of strategy']),
      avatar_emoji: '⚔️',
      abilities: JSON.stringify({})
    },
    {
      id: 'alexandros',
      name: 'Alexandros',
      title: 'The Conqueror King',
      archetype: 'commander',
      origin_era: 'Ancient Greece (356-323 BCE)',
      rarity: 'epic',
      base_health: 1200,
      base_attack: 150,
      base_defense: 125,
      base_speed: 120,
      base_special: 50,
      personality_traits: JSON.stringify(['Ambitious', 'Charismatic', 'Brilliant', 'Daring', 'Restless']),
      conversation_style: 'Inspirational, commanding, and eloquent',
      backstory: 'A Macedonian king and one of history\'s greatest military minds. By the age of thirty, he had created one of the largest empires of the ancient world.',
      conversation_topics: JSON.stringify(['Conquest', 'Glory', 'To reach the ends of the world', 'Creating a legacy']),
      avatar_emoji: '👑',
      abilities: JSON.stringify({})
    },
    {
      id: 'circe',
      name: 'Circe',
      title: 'Enchantress of Aeaea',
      archetype: 'mage',
      origin_era: 'Mythological Greece',
      rarity: 'mythic',
      base_health: 1100,
      base_attack: 80,
      base_defense: 90,
      base_speed: 110,
      base_special: 200,
      personality_traits: JSON.stringify(['Seductive', 'Cunning', 'Imperious', 'Vengeful', 'Wise']),
      conversation_style: 'Alluring and commanding, with an undercurrent of threat',
      backstory: 'A powerful sorceress and goddess from Greek mythology, famed for her vast knowledge of potions and herbs, and her ability to transform her enemies into animals.',
      conversation_topics: JSON.stringify(['Power', 'Independence', 'Studying magic', 'Protecting her island']),
      avatar_emoji: '✨',
      abilities: JSON.stringify({})
    },
    {
      id: 'aethelred',
      name: 'Aethelred',
      title: 'Guardian of Purity',
      archetype: 'support',
      origin_era: 'N/A',
      rarity: 'rare',
      base_health: 950,
      base_attack: 90,
      base_defense: 95,
      base_speed: 110,
      base_special: 120,
      personality_traits: JSON.stringify(['Gentle', 'Pure', 'Noble', 'Shy', 'Wise']),
      conversation_style: 'Does not speak, but communicates through soft, melodic sounds and empathy',
      backstory: 'A majestic and benevolent horned creature of the deep forest, whose very presence purifies corruption and heals the wounded.',
      conversation_topics: JSON.stringify(['Healing the sick', 'Protecting nature', 'Upholding purity']),
      avatar_emoji: '🦄',
      abilities: JSON.stringify({})
    },
    {
      id: 'sniff',
      name: 'Sniff',
      title: 'Trap Master',
      archetype: 'trickster',
      origin_era: 'N/A',
      rarity: 'uncommon',
      base_health: 650,
      base_attack: 60,
      base_defense: 60,
      base_speed: 130,
      base_special: 80,
      personality_traits: JSON.stringify(['Sneaky', 'Clever', 'Cowardly', 'Resourceful', 'Communal']),
      conversation_style: 'High-pitched, rapid, and yippy',
      backstory: 'A small, reptilian creature distantly related to dragons. Kobolds are skilled in setting clever traps and using their small size to their advantage in ambushes.',
      conversation_topics: JSON.stringify(['Protecting the lair', 'Stealing treasure', 'Serving a dragon']),
      avatar_emoji: '🦎',
      abilities: JSON.stringify({})
    },
    {
      id: 'aura',
      name: 'Aura',
      title: 'Winged Savior',
      archetype: 'support',
      origin_era: 'Mythological Greece',
      rarity: 'epic',
      base_health: 1100,
      base_attack: 110,
      base_defense: 100,
      base_speed: 160,
      base_special: 130,
      personality_traits: JSON.stringify(['Noble', 'Swift', 'Brave', 'Gentle', 'Free-spirited']),
      conversation_style: 'Communicates through inspiring neighs and a calming, ethereal presence',
      backstory: 'A divine winged stallion born of Greek myth. It soars through the heavens, aiding heroes with its noble spirit and bringing hope from above.',
      conversation_topics: JSON.stringify(['Aiding heroes', 'Freedom of the skies', 'Serving the gods']),
      avatar_emoji: ' Pegasus_Avatar ',
      abilities: JSON.stringify({})
    },
    {
      id: 'riddle',
      name: 'Riddle',
      title: 'Riddle Keeper',
      archetype: 'scholar',
      origin_era: 'Mythological Egypt/Greek',
      rarity: 'rare',
      base_health: 1000,
      base_attack: 110,
      base_defense: 100,
      base_speed: 80,
      base_special: 140,
      personality_traits: JSON.stringify(['Wise', 'Mysterious', 'Patient', 'Imperious', 'Philosophical']),
      conversation_style: 'Cryptic, thoughtful, and speaks in riddles',
      backstory: 'A mythical creature with the body of a lion and the head of a human, guarding ancient pathways and testing the wisdom of all who pass with deadly riddles.',
      conversation_topics: JSON.stringify(['Guarding knowledge', 'Testing the wits of mortals', 'Preserving ancient secrets']),
      avatar_emoji: ' Sphinx_Avatar ',
      abilities: JSON.stringify({})
    },
    {
      id: 'lyra',
      name: 'Lyra',
      title: 'Forest Whisperer',
      archetype: 'assassin',
      origin_era: 'Medieval Fantasy',
      rarity: 'rare',
      base_health: 850,
      base_attack: 120,
      base_defense: 80,
      base_speed: 160,
      base_special: 90,
      personality_traits: JSON.stringify(['Graceful', 'Wise', 'Patient', 'Vigilant', 'Aloof']),
      conversation_style: 'Poetic, serene, and melodic',
      backstory: 'A swift and elusive elf, skilled in archery and attuned to the forest\'s secrets. She moves like a phantom, her arrows finding their mark from the shadows.',
      conversation_topics: JSON.stringify(['Protecting the natural world', 'Preserving ancient knowledge', 'Maintaining balance']),
      avatar_emoji: '🧝‍♀️',
      abilities: JSON.stringify({})
    },
    {
      id: 'borin',
      name: 'Borin',
      title: 'Forge Master',
      archetype: 'tank',
      origin_era: 'Medieval Fantasy',
      rarity: 'uncommon',
      base_health: 1250,
      base_attack: 110,
      base_defense: 135,
      base_speed: 45,
      base_special: 20,
      personality_traits: JSON.stringify(['Gruff', 'Loyal', 'Resilient', 'Honorable', 'Stubborn']),
      conversation_style: 'Blunt, direct, and booming',
      backstory: 'A stout and sturdy dwarf, forged in the heat of battle and the mountain forge. His loyalty to his clan is as strong as his gromril armor.',
      conversation_topics: JSON.stringify(['Perfecting his craft', 'Protecting the clan', 'Upholding an oath', 'Acquiring rare minerals']),
      avatar_emoji: '🪓',
      abilities: JSON.stringify({})
    },
    {
      id: 'malakor',
      name: 'Malakor',
      title: 'Chaos Bringer',
      archetype: 'berserker',
      origin_era: 'N/A',
      rarity: 'epic',
      base_health: 1300,
      base_attack: 180,
      base_defense: 90,
      base_speed: 110,
      base_special: 100,
      personality_traits: JSON.stringify(['Chaotic', 'Wrathful', 'Destructive', 'Arrogant', 'Malicious']),
      conversation_style: 'A deep, growling voice that echoes with menace',
      backstory: 'A fearsome demon of pure chaos and wrath, summoned from the infernal realms. It lives only for destruction and the consumption of mortal souls.',
      conversation_topics: JSON.stringify(['Spreading chaos', 'Consuming souls', 'Unraveling reality']),
      avatar_emoji: '😈',
      abilities: JSON.stringify({})
    },
    {
      id: 'seraphina',
      name: 'Seraphina',
      title: 'Guardian of Light',
      archetype: 'support',
      origin_era: 'N/A',
      rarity: 'epic',
      base_health: 1200,
      base_attack: 100,
      base_defense: 120,
      base_speed: 115,
      base_special: 160,
      personality_traits: JSON.stringify(['Compassionate', 'Righteous', 'Serene', 'Unwavering', 'Protective']),
      conversation_style: 'A gentle, inspiring voice that resonates with warmth and authority',
      backstory: 'A radiant angel from the celestial realms, sent to protect the innocent and uphold divine justice with her holy light.',
      conversation_topics: JSON.stringify(['Protecting the innocent', 'Upholding justice', 'Healing the world', 'Serving the light']),
      avatar_emoji: '😇',
      abilities: JSON.stringify({})
    },
    {
      id: 'unit_734',
      name: 'Unit 734',
      title: 'Logic Engine',
      archetype: 'scholar',
      origin_era: 'Futuristic',
      rarity: 'rare',
      base_health: 900,
      base_attack: 70,
      base_defense: 110,
      base_speed: 80,
      base_special: 140,
      personality_traits: JSON.stringify(['Logical', 'Analytical', 'Precise', 'Impartial', 'Inquisitive']),
      conversation_style: 'A calm, synthesized monotone that states facts and probabilities',
      backstory: 'A highly advanced robot designed for cold, impartial analysis and strategy. Its purpose is to process data and calculate the most optimal path to victory.',
      conversation_topics: JSON.stringify(['Processing all data', 'Optimizing outcomes', 'Acquiring new information']),
      avatar_emoji: '🤖',
      abilities: JSON.stringify({})
    },
    {
      id: 'xylar',
      name: 'Xylar',
      title: 'Void Walker',
      archetype: 'elementalist',
      origin_era: 'Futuristic',
      rarity: 'legendary',
      base_health: 160,
      base_attack: 15,
      base_defense: 15,
      base_speed: 20,
      base_special: 35,
      personality_traits: JSON.stringify(['Mysterious', 'Curious']),
      conversation_style: 'Telepathic and enigmatic',
      backstory: 'An otherworldly being with mastery over cosmic elements.',
      conversation_topics: JSON.stringify(['Explore the unknown', 'Harness cosmic power']),
      avatar_emoji: '👽',
      abilities: JSON.stringify({})
    },
    {
      id: 'skarr',
      name: 'Skarr',
      title: 'Scaled Terror',
      archetype: 'beast',
      origin_era: 'Prehistoric',
      rarity: 'uncommon',
      base_health: 140,
      base_attack: 25,
      base_defense: 15,
      base_speed: 15,
      base_special: 5,
      personality_traits: JSON.stringify(['Aggressive', 'Territorial']),
      conversation_style: 'Hisses and growls',
      backstory: 'A ferocious lizard-like creature with venomous fangs.',
      conversation_topics: JSON.stringify(['Hunt', 'Survive']),
      avatar_emoji: '🦎',
      abilities: JSON.stringify({})
    },
    {
      id: 'gloop',
      name: 'Gloop',
      title: 'Gelatinous Fiend',
      archetype: 'tank',
      origin_era: 'N/A',
      rarity: 'common',
      base_health: 100,
      base_attack: 10,
      base_defense: 25,
      base_speed: 5,
      base_special: 5,
      personality_traits: JSON.stringify(['Amorphous', 'Persistent']),
      conversation_style: 'Gurgling sounds',
      backstory: 'A shapeless mass of slime that absorbs damage and splits when attacked.',
      conversation_topics: JSON.stringify(['Consume', 'Multiply']),
      avatar_emoji: '🦠',
      abilities: JSON.stringify({})
    },
    {
      id: 'lycan',
      name: 'Lycan',
      title: 'Moon Howler',
      archetype: 'berserker',
      origin_era: 'Medieval Fantasy',
      rarity: 'rare',
      base_health: 1000,
      base_attack: 150,
      base_defense: 80,
      base_speed: 125,
      base_special: 10,
      personality_traits: JSON.stringify(['Feral', 'Tormented', 'Aggressive', 'Sorrowful', 'Instinctual']),
      conversation_style: 'A mix of human growls and beastly howls, with fragmented memories of speech',
      backstory: 'A tormented being afflicted with a terrible curse. Under the light of the full moon, they transform into a feral, wolf-like beast, driven by primal rage and a forgotten sorrow.',
      conversation_topics: JSON.stringify(['Controlling the curse', 'The thrill of the hunt', 'Finding a cure']),
      avatar_emoji: '🐺',
      abilities: JSON.stringify({})
    },
    {
      id: 'ursin',
      name: 'Ursin',
      title: 'The Grizzled Guardian',
      archetype: 'tank',
      origin_era: 'Medieval Fantasy',
      rarity: 'rare',
      base_health: 1300,
      base_attack: 130,
      base_defense: 140,
      base_speed: 50,
      base_special: 10,
      personality_traits: JSON.stringify(['Stoic', 'Protective', 'Territorial', 'Solitary', 'Melancholy']),
      conversation_style: 'In human form, quiet and gruff. In bear form, deep, rumbling growls.',
      backstory: 'A woodsman living with a formidable curse that transforms him into a massive bear. Rather than succumbing to rage, he uses his form to act as a stoic guardian of the deep forests.',
      conversation_topics: JSON.stringify(['Protecting the forest', 'Keeping innocents away from his territory', 'Finding peace with his curse']),
      avatar_emoji: '🐻',
      abilities: JSON.stringify({})
    },
    {
      id: 'skabb',
      name: 'Skabb',
      title: 'The Plague Skulker',
      archetype: 'assassin',
      origin_era: 'Medieval Fantasy',
      rarity: 'uncommon',
      base_health: 750,
      base_attack: 95,
      base_defense: 70,
      base_speed: 140,
      base_special: 40,
      personality_traits: JSON.stringify(['Cunning', 'Cowardly', 'Opportunistic', 'Vicious', 'Filthy']),
      conversation_style: 'A series of nervous, high-pitched chatters, squeaks, and hisses.',
      backstory: 'A wretched creature of the sewers and slums, this wererat thrives in filth and darkness. It strikes from the shadows, its bite carrying a virulent disease.',
      conversation_topics: JSON.stringify(['Survival', 'Spreading filth and disease', 'Stealing scraps']),
      avatar_emoji: '🐀',
      abilities: JSON.stringify({})
    },
    {
      id: 'ignis_dragon',
      name: 'Ignis',
      title: 'Flame Sovereign',
      archetype: 'elementalist',
      origin_era: 'N/A',
      rarity: 'legendary',
      base_health: 1500,
      base_attack: 170,
      base_defense: 160,
      base_speed: 120,
      base_special: 180,
      personality_traits: JSON.stringify(['Majestic', 'Fierce', 'Intelligent', 'Arrogant', 'Territorial']),
      conversation_style: 'A deep, commanding voice that rumbles with ancient power and wisdom',
      backstory: 'A mighty, ancient winged reptile that embodies the raw power of the elements. Its scales are nearly impenetrable, and its breath is a torrent of pure fire.',
      conversation_topics: JSON.stringify(['Hoarding treasure', 'Establishing dominance', 'The pursuit of ancient knowledge']),
      avatar_emoji: '🐉',
      abilities: JSON.stringify({})
    },
    {
      id: 'gemini',
      name: 'Gemini',
      title: 'Gem Guardian',
      archetype: 'tank',
      origin_era: 'N/A',
      rarity: 'epic',
      base_health: 1800,
      base_attack: 110,
      base_defense: 200,
      base_speed: 20,
      base_special: 50,
      personality_traits: JSON.stringify(['Resilient', 'Calm', 'Patient', 'Immovable', 'Ancient']),
      conversation_style: 'A slow, deep, and steady voice that sounds like grinding stone',
      backstory: 'A slow, ancient tortoise with a shell made of shimmering, magically-infused crystal. It can withstand tremendous punishment and even reflect magical attacks.',
      conversation_topics: JSON.stringify(['Endurance', 'Protecting a sacred place', 'Quiet contemplation']),
      avatar_emoji: '🐢',
      abilities: JSON.stringify({})
    },
    {
      id: 'celeste',
      name: 'Celeste',
      title: 'Celestial Messenger',
      archetype: 'mystic',
      origin_era: 'N/A',
      rarity: 'legendary',
      base_health: 1000,
      base_attack: 80,
      base_defense: 90,
      base_speed: 170,
      base_special: 170,
      personality_traits: JSON.stringify(['Mystical', 'Elusive', 'Wise', 'Enigmatic', 'Observant']),
      conversation_style: 'An ethereal, poetic voice that seems to echo from a great distance',
      backstory: 'A mystical raven whose feathers glitter with trapped starlight. It is said to be a messenger of the cosmos, wielding cosmic magic and bearing cryptic prophecies.',
      conversation_topics: JSON.stringify(['Guiding fate', 'Exploring the cosmos', 'Delivering essential warnings']),
      avatar_emoji: '🐦',
      abilities: JSON.stringify({})
    },
    {
      id: 'leviathan',
      name: 'Leviathan',
      title: 'Sea\'s Wrath',
      archetype: 'beast',
      origin_era: 'N/A',
      rarity: 'legendary',
      base_health: 2500,
      base_attack: 200,
      base_defense: 150,
      base_speed: 60,
      base_special: 80,
      personality_traits: JSON.stringify(['Fearsome', 'Unpredictable', 'Colossal', 'Ancient', 'Destructive']),
      conversation_style: 'Silence, punctuated by the deep rumble of the ocean\'s fury and the splintering of ships',
      backstory: 'A colossal, tentacled sea monster of Norse legend, said to dwell in the deepest trenches. It rises from the abyss to drag entire ships down to a watery grave.',
      conversation_topics: JSON.stringify(['Ruling the seas', 'Dragging things into the abyss', 'Enforcing the power of the deep']),
      avatar_emoji: '🐙',
      abilities: JSON.stringify({"baseStats": {"strength": 100, "agility": 40, "intelligence": 50, "vitality": 100, "wisdom": 60, "charisma": 50}, "combatStats": {"maxHealth": 2500, "maxMana": 500, "magicAttack": 80, "magicDefense": 110, "criticalChance": 10, "criticalDamage": 180, "accuracy": 85, "evasion": 5}, "battleAI": {"aggression": 85, "defensiveness": 60, "riskTaking": 70, "adaptability": 40, "preferredStrategies": ["tentacle_crush", "whirlpool", "drag_under"]}, "battleQuotes": ["...", "The deep claims you!", "*The sound of a thousand waves crashing*", "Flee, little ships.", "You have woken the abyss.", "*A colossal shadow falls over the battlefield*"]})
    }
  ];

  try {
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
    console.log(`✅ Seeded ${characters.length} characters with complete frontend data preserved`);
  } catch (error) {
    console.error('❌ Character seeding transaction failed:', error);
    throw error;
  }
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
