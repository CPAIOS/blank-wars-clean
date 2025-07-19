import { query } from './src/database';
import { randomUUID } from 'crypto';

// First, let's get the user ID for dev@test.com
const DEV_EMAIL = 'dev@test.com';

async function populateDevCharacters() {
  try {
    console.log('🎮 Looking up user:', DEV_EMAIL);
    
    // Get the user ID
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [DEV_EMAIL]
    );
    
    if (userResult.rows.length === 0) {
      console.error('❌ User not found with email:', DEV_EMAIL);
      return;
    }
    
    const USER_ID = userResult.rows[0].id;
    console.log('✅ Found user ID:', USER_ID);
    
    // Get all characters from the characters table
    const charactersResult = await query('SELECT * FROM characters');
    console.log('📚 Found', charactersResult.rows.length, 'characters in database');
    
    let added = 0;
    let skipped = 0;
    
    // Insert each character into user_characters
    for (const character of charactersResult.rows) {
      try {
        // Check if already exists
        const existing = await query(
          'SELECT id FROM user_characters WHERE user_id = $1 AND character_id = $2',
          [USER_ID, character.id]
        );
        
        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }
        
        // Parse abilities to get intelligence
        let intelligence = 50; // Default fallback
        if (character.abilities) {
          try {
            const abilities = JSON.parse(character.abilities);
            intelligence = abilities.baseStats?.intelligence || 50;
          } catch (e) {
            console.warn('Failed to parse abilities for', character.name);
          }
        }

        // Insert new user_character with proper stats mapping
        await query(
          `INSERT INTO user_characters 
           (id, user_id, character_id, level, experience, bond_level, psychstats, battle_count, 
            health, max_health, current_health, strength, vitality, speed, intelligence) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            randomUUID(),
            USER_ID,
            character.id,
            1, // Starting level
            0, // Starting experience
            0, // Starting bond level
            JSON.stringify({
              training: character.training,
              teamPlayer: character.team_player,
              ego: character.ego,
              mentalHealth: character.mental_health,
              communication: character.communication
            }),
            0, // Battle count
            character.base_health, // Starting health (use actual base_health)
            character.base_health, // Max health (use actual base_health)
            character.base_health, // Current health (use actual base_health)
            character.base_attack, // Strength (use actual base_attack)
            character.base_defense, // Vitality (use actual base_defense)
            character.base_speed, // Speed (use actual base_speed)
            intelligence // Intelligence (extracted from abilities)
          ]
        );
        
        console.log('✅ Added', character.name);
        added++;
      } catch (error) {
        console.error('❌ Failed to add', character.name, error);
      }
    }
    
    console.log('\n🎉 Development characters populated!');
    console.log('📊 Added:', added, 'characters');
    console.log('⏭️  Skipped:', skipped, 'characters (already owned)');
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
populateDevCharacters();