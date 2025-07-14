import { Router } from 'express';
import { query } from '../database';

const router = Router();

// Force re-seed characters endpoint (for production debugging)
router.post('/force-reseed-characters', async (req, res) => {
  try {
    console.log('🔄 Force re-seeding characters...');
    
    // Clear existing characters
    await query('DELETE FROM user_characters');
    await query('DELETE FROM characters');
    console.log('🗑️ Cleared existing characters');
    
    // Import seedCharacters function from sqlite.ts
    const { seedCharacters } = await import('../database/sqlite');
    await seedCharacters();
    
    // Verify count
    const result = await query('SELECT COUNT(*) as count FROM characters');
    const count = result.rows[0].count;
    
    console.log(`✅ Re-seeding completed. Character count: ${count}`);
    res.json({ success: true, message: `Re-seeded ${count} characters` });
    
  } catch (error) {
    console.error('❌ Force re-seeding failed:', error);
    res.status(500).json({ error: 'Re-seeding failed', details: error instanceof Error ? error.message : String(error) });
  }
});

// Get character count endpoint
router.get('/character-count', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM characters');
    const characters = await query('SELECT id, name FROM characters ORDER BY name');
    
    res.json({ 
      count: result.rows[0].count, 
      characters: characters.rows 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get character count' });
  }
});

// Update archetype constraints endpoint
router.post('/update-archetype-constraints', async (req, res) => {
  try {
    console.log('🔧 Updating archetype constraints...');
    
    // Test if trickster archetype is supported
    try {
      await query(`
        INSERT INTO characters (id, name, title, archetype, origin_era, rarity, base_health, base_attack, base_defense, base_speed, base_special, personality_traits, conversation_style, backstory, conversation_topics, avatar_emoji, abilities) 
        VALUES ('test_trickster', 'Test', 'Test', 'trickster', 'Test', 'common', 100, 100, 100, 100, 100, '[]', 'Test', 'Test', '[]', '🎭', '{}')
      `);
      
      // Clean up test record
      await query(`DELETE FROM characters WHERE id = 'test_trickster'`);
      console.log('✅ Archetype constraints already support all types');
      return res.json({ success: true, message: 'Archetype constraints already support all types' });
      
    } catch (testError) {
      const errorMessage = testError instanceof Error ? testError.message : String(testError);
      if (errorMessage.includes('CHECK constraint failed: archetype')) {
        console.log('🔧 Need to update archetype constraints');
        
        try {
          // Create backup
          await query(`CREATE TABLE IF NOT EXISTS characters_backup AS SELECT * FROM characters`);
          console.log('📦 Created backup of characters table');
          
          // Drop existing table
          await query(`DROP TABLE characters`);
          console.log('🗑️ Dropped old characters table');
          
          // Recreate with updated constraints
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
              personality_traits TEXT,
              conversation_style TEXT,
              backstory TEXT,
              conversation_topics TEXT,
              avatar_emoji TEXT,
              artwork_url TEXT,
              abilities TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);
          console.log('🆕 Created new characters table with updated constraints');
          
          // Restore data
          await query(`INSERT INTO characters SELECT * FROM characters_backup`);
          console.log('📥 Restored characters from backup');
          
          // Drop backup
          await query(`DROP TABLE characters_backup`);
          console.log('🗑️ Cleaned up backup table');
          
        } catch (migrationError) {
          console.error('❌ Migration failed, attempting to restore from backup:', migrationError);
          try {
            // Try to restore from backup if it exists
            const backupExists = await query(`SELECT name FROM sqlite_master WHERE type='table' AND name='characters_backup'`);
            if (backupExists.rows.length > 0) {
              await query(`DROP TABLE IF EXISTS characters`);
              await query(`ALTER TABLE characters_backup RENAME TO characters`);
              console.log('🔄 Restored from backup after failed migration');
            }
          } catch (restoreError) {
            console.error('❌ Failed to restore from backup:', restoreError);
            throw new Error('Migration failed and could not restore from backup');
          }
          throw migrationError;
        }
        
        res.json({ success: true, message: 'Successfully updated archetype constraints' });
      } else {
        throw testError;
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to update archetype constraints:', error);
    res.status(500).json({ 
      error: 'Failed to update archetype constraints', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

export default router;