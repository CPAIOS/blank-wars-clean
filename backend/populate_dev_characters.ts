import { query } from './src/database';

async function populateDevCharacters() {
  try {
    console.log('🎮 Populating development characters...');
    
    // Get the user ID for the logged in developer
    // You'll need to update this with your actual user ID
    const userEmail = process.env.DEV_USER_EMAIL || 'your-email@example.com';
    
    const userResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [userEmail]
    );
    
    if (userResult.rows.length === 0) {
      console.error('❌ User not found with email:', userEmail);
      console.log('💡 Set DEV_USER_EMAIL environment variable or update the script');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log('👤 Found user:', userId);
    
    // Get all characters from the characters table
    const charactersResult = await query('SELECT * FROM characters');
    console.log('📚 Found', charactersResult.rows.length, 'characters in database');
    
    // Insert each character into user_characters
    for (const character of charactersResult.rows) {
      try {
        // Check if already exists
        const existing = await query(
          'SELECT id FROM user_characters WHERE user_id = $1 AND character_id = $2',
          [userId, character.id]
        );
        
        if (existing.rows.length > 0) {
          console.log('⏭️  Skipping', character.name, '- already owned');
          continue;
        }
        
        // Insert new user_character
        await query(
          `INSERT INTO user_characters 
           (user_id, character_id, level, experience, bond_level, psychstats, battle_count) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
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
            0 // Battle count
          ]
        );
        
        console.log('✅ Added', character.name);
      } catch (error) {
        console.error('❌ Failed to add', character.name, error);
      }
    }
    
    console.log('🎉 Development characters populated!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  populateDevCharacters();
}