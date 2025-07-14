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

export default router;