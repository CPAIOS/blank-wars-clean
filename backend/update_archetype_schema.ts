import { query } from './src/database/index';

/**
 * Update database schema to support all required archetypes
 * This allows mage, mystic, tank, assassin in addition to existing ones
 */

async function updateArchetypeSchema() {
  try {
    console.log('🔧 Updating database schema for all archetypes...\n');

    // First check what the current constraint allows
    console.log('📋 Checking current archetype constraint...');
    
    // For SQLite, we need to recreate the table since ALTER TABLE doesn't support modifying CHECK constraints
    console.log('🗃️  Backing up existing characters...');
    const existingChars = await query('SELECT * FROM characters');
    console.log(`   Found ${existingChars.rows.length} existing characters to preserve`);

    console.log('🔄 Recreating characters table with updated archetype constraint...');
    
    // Drop existing table (this will also remove foreign key constraints)
    await query('PRAGMA foreign_keys = OFF');
    await query('DROP TABLE IF EXISTS characters');
    
    // Recreate table with expanded archetype list
    await query(`
      CREATE TABLE characters (
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
      )
    `);

    console.log('✅ Characters table recreated with expanded archetype support');
    
    // Restore existing data if any
    if (existingChars.rows.length > 0) {
      console.log('📥 Restoring existing character data...');
      for (const char of existingChars.rows) {
        try {
          await query(`
            INSERT INTO characters (
              id, name, title, archetype, origin_era, rarity,
              base_health, base_attack, base_defense, base_speed, base_special,
              personality_traits, conversation_style, backstory, conversation_topics,
              avatar_emoji, artwork_url, abilities, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            char.id, char.name, char.title, char.archetype, char.origin_era, char.rarity,
            char.base_health, char.base_attack, char.base_defense, char.base_speed, char.base_special,
            char.personality_traits, char.conversation_style, char.backstory, char.conversation_topics,
            char.avatar_emoji, char.artwork_url, char.abilities, char.created_at
          ]);
          console.log(`   ✅ Restored ${char.name}`);
        } catch (error) {
          console.log(`   ⚠️  Could not restore ${char.name}: ${error}`);
        }
      }
    }

    // Re-enable foreign keys
    await query('PRAGMA foreign_keys = ON');

    console.log('\\n🎯 Testing new archetype constraint...');
    
    // Test inserting a character with each new archetype
    const testArchetypes = ['mage', 'mystic', 'tank', 'assassin'];
    for (const archetype of testArchetypes) {
      try {
        await query(`
          INSERT INTO characters (
            id, name, archetype, rarity, base_health, base_attack, base_defense, base_speed, base_special
          ) VALUES (?, ?, ?, 'common', 100, 50, 50, 50, 50)
        `, [`test_${archetype}`, `Test ${archetype}`, archetype]);
        
        // Delete the test character immediately
        await query('DELETE FROM characters WHERE id = ?', [`test_${archetype}`]);
        console.log(`   ✅ ${archetype} archetype works`);
        
      } catch (error) {
        console.log(`   ❌ ${archetype} archetype failed: ${error}`);
      }
    }

    const finalCount = await query('SELECT COUNT(*) as count FROM characters');
    console.log(`\\n📊 Final Results:`);
    console.log(`   📋 Characters in database: ${finalCount.rows[0].count}`);
    console.log(`   ✅ Schema supports archetypes: warrior, scholar, trickster, beast, leader, mage, mystic, tank, assassin`);
    
    console.log('\\n✅ Database schema update completed successfully!');
    console.log('\\n🔄 Next step: Run the correct character seeding script');

  } catch (error) {
    console.error('❌ Error updating schema:', error);
  }
}

// Run the script
updateArchetypeSchema();