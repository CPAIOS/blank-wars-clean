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

// Production-safe character seeding endpoint
router.post('/prod-seed-characters', async (req, res) => {
  try {
    console.log('🌱 Starting production-safe character seeding...');
    
    // Clear existing characters
    await query('DELETE FROM user_characters', []); 
    await query('DELETE FROM characters', []); 
    console.log('✅ Cleared existing character data');

    // Characters with only supported archetypes: warrior, scholar, beast, mage, mystic
    const productionCharacters = [
      {
        id: 'achilles', name: 'Achilles', title: 'Hero of Troy', archetype: 'warrior', origin_era: 'Ancient Greece (1200 BCE)', rarity: 'legendary',
        base_health: 1200, base_attack: 185, base_defense: 120, base_speed: 140, base_special: 90,
        personality_traits: JSON.stringify(['Honorable', 'Wrathful', 'Courageous', 'Prideful']),
        conversation_style: 'Noble and passionate', backstory: 'The greatest warrior of the Trojan War, nearly invincible in combat but driven by rage and honor.',
        conversation_topics: JSON.stringify(['Glory', 'Honor', 'Revenge', 'Troy', 'Combat']), avatar_emoji: '⚔️',
        abilities: JSON.stringify({ baseStats: { strength: 95, agility: 85, intelligence: 60, vitality: 90, wisdom: 45, charisma: 80 }, combatStats: { maxHealth: 1200, maxMana: 300, magicAttack: 50, magicDefense: 80, criticalChance: 25, criticalDamage: 200, accuracy: 90, evasion: 20 } })
      },
      {
        id: 'merlin', name: 'Merlin', title: 'Archmage of Camelot', archetype: 'mage', origin_era: 'Medieval Britain (5th-6th century)', rarity: 'mythic',
        base_health: 800, base_attack: 60, base_defense: 80, base_speed: 90, base_special: 100,
        personality_traits: JSON.stringify(['Wise', 'Mysterious', 'Patient', 'Calculating']),
        conversation_style: 'Archaic and profound', backstory: 'The legendary wizard advisor to King Arthur, master of ancient magic and prophecy.',
        conversation_topics: JSON.stringify(['Knowledge', 'Balance', 'Protecting the realm', 'Magic', 'Time']), avatar_emoji: '🔮',
        abilities: JSON.stringify({ baseStats: { strength: 30, agility: 50, intelligence: 98, vitality: 70, wisdom: 95, charisma: 85 }, combatStats: { maxHealth: 800, maxMana: 2000, magicAttack: 200, magicDefense: 180, criticalChance: 15, criticalDamage: 300, accuracy: 95, evasion: 25 } })
      },
      {
        id: 'fenrir', name: 'Fenrir', title: 'The Great Wolf', archetype: 'beast', origin_era: 'Norse Age (8th-11th century)', rarity: 'legendary',
        base_health: 1400, base_attack: 170, base_defense: 100, base_speed: 180, base_special: 95,
        personality_traits: JSON.stringify(['Savage', 'Loyal', 'Vengeful', 'Primal']),
        conversation_style: 'Growling and direct', backstory: 'The monstrous wolf of Norse mythology, prophesied to devour Odin during Ragnarök.',
        conversation_topics: JSON.stringify(['Freedom', 'Vengeance', 'Pack loyalty', 'The hunt']), avatar_emoji: '🐺',
        abilities: JSON.stringify({ baseStats: { strength: 90, agility: 95, intelligence: 40, vitality: 95, wisdom: 30, charisma: 50 }, combatStats: { maxHealth: 1400, maxMana: 200, magicAttack: 30, magicDefense: 60, criticalChance: 30, criticalDamage: 220, accuracy: 88, evasion: 30 } })
      },
      {
        id: 'cleopatra', name: 'Cleopatra VII', title: 'Last Pharaoh of Egypt', archetype: 'mystic', origin_era: 'Ptolemaic Egypt (69-30 BCE)', rarity: 'epic',
        base_health: 900, base_attack: 80, base_defense: 95, base_speed: 110, base_special: 95,
        personality_traits: JSON.stringify(['Brilliant', 'Charismatic', 'Ambitious', 'Diplomatic']),
        conversation_style: 'Regal and commanding', backstory: 'The brilliant and charismatic final pharaoh of Ancient Egypt, master of politics and ancient mysteries.',
        conversation_topics: JSON.stringify(['Power', 'Legacy', 'Egyptian restoration', 'Politics']), avatar_emoji: '👑',
        abilities: JSON.stringify({ baseStats: { strength: 50, agility: 70, intelligence: 95, vitality: 80, wisdom: 90, charisma: 98 }, combatStats: { maxHealth: 900, maxMana: 1500, magicAttack: 150, magicDefense: 140, criticalChance: 20, criticalDamage: 180, accuracy: 85, evasion: 25 } })
      },
      {
        id: 'sherlock', name: 'Sherlock Holmes', title: 'Consulting Detective', archetype: 'scholar', origin_era: 'Victorian London (1880s-1910s)', rarity: 'rare',
        base_health: 700, base_attack: 70, base_defense: 60, base_speed: 85, base_special: 98,
        personality_traits: JSON.stringify(['Analytical', 'Observant', 'Eccentric', 'Logical']),
        conversation_style: 'Precise and deductive', backstory: 'The world\'s first consulting detective, master of observation and deductive reasoning.',
        conversation_topics: JSON.stringify(['Mystery', 'Logic', 'Investigation', 'Crime', 'Science']), avatar_emoji: '🔍',
        abilities: JSON.stringify({ baseStats: { strength: 40, agility: 60, intelligence: 98, vitality: 55, wisdom: 85, charisma: 70 }, combatStats: { maxHealth: 700, maxMana: 1200, magicAttack: 120, magicDefense: 100, criticalChance: 35, criticalDamage: 250, accuracy: 95, evasion: 30 } })
      },
      {
        id: 'dracula', name: 'Count Dracula', title: 'Lord of the Undead', archetype: 'mystic', origin_era: 'Gothic Victorian (1897)', rarity: 'legendary',
        base_health: 1100, base_attack: 140, base_defense: 110, base_speed: 120, base_special: 85,
        personality_traits: JSON.stringify(['Aristocratic', 'Cunning', 'Predatory', 'Charismatic']),
        conversation_style: 'Elegant and menacing', backstory: 'The immortal vampire lord of Transylvania, master of dark magic and eternal night.',
        conversation_topics: JSON.stringify(['Immortality', 'Power', 'The hunt', 'Darkness', 'Aristocracy']), avatar_emoji: '🧛',
        abilities: JSON.stringify({ baseStats: { strength: 85, agility: 80, intelligence: 75, vitality: 90, wisdom: 70, charisma: 85 }, combatStats: { maxHealth: 1100, maxMana: 800, magicAttack: 160, magicDefense: 120, criticalChance: 25, criticalDamage: 200, accuracy: 90, evasion: 35 } })
      },
      {
        id: 'joan', name: 'Joan of Arc', title: 'The Maid of Orleans', archetype: 'warrior', origin_era: 'Medieval France (1412-1431)', rarity: 'epic',
        base_health: 1000, base_attack: 130, base_defense: 120, base_speed: 100, base_special: 88,
        personality_traits: JSON.stringify(['Devout', 'Courageous', 'Inspirational', 'Determined']),
        conversation_style: 'Passionate and inspiring', backstory: 'The peasant girl who became a saint, led France to victory against the English through divine visions.',
        conversation_topics: JSON.stringify(['Faith', 'Justice', 'France', 'Leadership', 'Divine calling']), avatar_emoji: '⚡',
        abilities: JSON.stringify({ baseStats: { strength: 80, agility: 75, intelligence: 70, vitality: 85, wisdom: 90, charisma: 95 }, combatStats: { maxHealth: 1000, maxMana: 1000, magicAttack: 140, magicDefense: 130, criticalChance: 20, criticalDamage: 190, accuracy: 88, evasion: 22 } })
      },
      {
        id: 'frankenstein', name: 'Frankenstein\'s Monster', title: 'The Created', archetype: 'warrior', origin_era: 'Gothic Literature (1818)', rarity: 'rare',
        base_health: 1500, base_attack: 160, base_defense: 140, base_speed: 50, base_special: 60,
        personality_traits: JSON.stringify(['Lonely', 'Vengeful', 'Philosophical', 'Tormented']),
        conversation_style: 'Melancholic and profound', backstory: 'The artificial being created by Victor Frankenstein, struggling with existence and seeking acceptance.',
        conversation_topics: JSON.stringify(['Existence', 'Loneliness', 'Creation', 'Revenge', 'Humanity']), avatar_emoji: '⚡',
        abilities: JSON.stringify({ baseStats: { strength: 98, agility: 30, intelligence: 65, vitality: 98, wisdom: 60, charisma: 25 }, combatStats: { maxHealth: 1500, maxMana: 400, magicAttack: 40, magicDefense: 80, criticalChance: 15, criticalDamage: 180, accuracy: 70, evasion: 10 } })
      },
      {
        id: 'sun_wukong', name: 'Sun Wukong', title: 'The Monkey King', archetype: 'beast', origin_era: 'Chinese Mythology', rarity: 'mythic',
        base_health: 1000, base_attack: 150, base_defense: 90, base_speed: 200, base_special: 95,
        personality_traits: JSON.stringify(['Mischievous', 'Rebellious', 'Loyal', 'Proud']),
        conversation_style: 'Playful and irreverent', backstory: 'The immortal Monkey King, master of 72 transformations and legendary troublemaker of Heaven.',
        conversation_topics: JSON.stringify(['Freedom', 'Mischief', 'Immortality', 'Adventure', 'Rebellion']), avatar_emoji: '🐒',
        abilities: JSON.stringify({ baseStats: { strength: 90, agility: 98, intelligence: 80, vitality: 85, wisdom: 75, charisma: 80 }, combatStats: { maxHealth: 1000, maxMana: 1200, magicAttack: 180, magicDefense: 160, criticalChance: 40, criticalDamage: 250, accuracy: 95, evasion: 45 } })
      },
      {
        id: 'billy_kid', name: 'Billy the Kid', title: 'The Outlaw', archetype: 'warrior', origin_era: 'American Old West (1870s-1880s)', rarity: 'common',
        base_health: 650, base_attack: 140, base_defense: 60, base_speed: 160, base_special: 75,
        personality_traits: JSON.stringify(['Quick-tempered', 'Loyal', 'Reckless', 'Charismatic']),
        conversation_style: 'Casual and confident', backstory: 'The notorious young gunslinger of the American frontier, quick on the draw and quicker to anger.',
        conversation_topics: JSON.stringify(['Freedom', 'Justice', 'The frontier', 'Gunfights', 'Loyalty']), avatar_emoji: '🤠',
        abilities: JSON.stringify({ baseStats: { strength: 65, agility: 95, intelligence: 55, vitality: 60, wisdom: 45, charisma: 75 }, combatStats: { maxHealth: 650, maxMana: 300, magicAttack: 20, magicDefense: 40, criticalChance: 45, criticalDamage: 280, accuracy: 98, evasion: 40 } })
      },
      {
        id: 'samurai', name: 'Samurai Warrior', title: 'Honorable Blade', archetype: 'warrior', origin_era: 'Feudal Japan', rarity: 'common',
        base_health: 600, base_attack: 120, base_defense: 80, base_speed: 100, base_special: 70,
        personality_traits: JSON.stringify(['Honorable', 'Disciplined', 'Loyal', 'Stoic']),
        conversation_style: 'Formal and respectful', backstory: 'A disciplined warrior following the way of the sword.',
        conversation_topics: JSON.stringify(['Honor', 'Duty', 'Training', 'Bushido', 'Loyalty']), avatar_emoji: '🗾',
        abilities: JSON.stringify({ baseStats: { strength: 70, agility: 75, intelligence: 60, vitality: 65, wisdom: 80, charisma: 70 }, combatStats: { maxHealth: 600, maxMana: 200, magicAttack: 10, magicDefense: 50, criticalChance: 25, criticalDamage: 180, accuracy: 85, evasion: 20 } })
      },
      {
        id: 'peasant', name: 'Village Peasant', title: 'Common Folk', archetype: 'scholar', origin_era: 'Medieval Times', rarity: 'common',
        base_health: 500, base_attack: 60, base_defense: 50, base_speed: 70, base_special: 80,
        personality_traits: JSON.stringify(['Humble', 'Hardworking', 'Curious', 'Resourceful']),
        conversation_style: 'Simple and earnest', backstory: 'A common villager with surprising wisdom and resilience.',
        conversation_topics: JSON.stringify(['Village life', 'Hard work', 'Simple pleasures', 'Community', 'Survival']), avatar_emoji: '👨‍🌾',
        abilities: JSON.stringify({ baseStats: { strength: 50, agility: 60, intelligence: 70, vitality: 65, wisdom: 75, charisma: 60 }, combatStats: { maxHealth: 500, maxMana: 800, magicAttack: 60, magicDefense: 70, criticalChance: 15, criticalDamage: 140, accuracy: 70, evasion: 15 } })
      }
    ];

    let successCount = 0;
    for (const char of productionCharacters) {
      try {
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
        successCount++;
      } catch (error) {
        console.error(`Failed to insert ${char.name}:`, error);
      }
    }

    const finalCount = await query('SELECT COUNT(*) as count FROM characters', []);
    
    res.json({ 
      success: true, 
      message: `Successfully seeded ${successCount} production-safe characters`,
      total: finalCount.rows[0].count 
    });
    
  } catch (error) {
    console.error('❌ Production seeding failed:', error);
    res.status(500).json({ 
      error: 'Production seeding failed', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

export default router;