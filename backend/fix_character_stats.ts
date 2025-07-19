import { query } from './src/database';

async function fixCharacterStats() {
  try {
    console.log('🔧 Fixing character stats with actual values...');
    
    // Get all characters with their real stats
    const charactersResult = await query('SELECT * FROM characters');
    
    let updated = 0;
    
    for (const character of charactersResult.rows) {
      // Parse abilities to get intelligence
      let intelligence;
      if (character.abilities) {
        try {
          const abilities = JSON.parse(character.abilities);
          intelligence = abilities.baseStats.intelligence;
        } catch (e) {
          console.warn('Failed to parse abilities for', character.name);
          continue; // Skip this character if we can't get the intelligence
        }
      }
      
      // Update the user_characters record with actual stats
      await query(
        `UPDATE user_characters 
         SET 
           health = $1,
           max_health = $2,
           current_health = $3,
           strength = $4,
           vitality = $5,
           speed = $6,
           intelligence = $7,
           psychstats = $8
         WHERE character_id = $9 AND user_id = (SELECT id FROM users WHERE email = 'dev@test.com')`,
        [
          character.base_health,
          character.base_health,
          character.base_health,
          character.base_attack,
          character.base_defense,
          character.base_speed,
          intelligence,
          JSON.stringify({
            training: character.training,
            teamPlayer: character.team_player,
            ego: character.ego,
            mentalHealth: character.mental_health,
            communication: character.communication
          }),
          character.id
        ]
      );
      
      console.log(`✅ Updated ${character.name}: STR=${character.base_attack}, VIT=${character.base_defense}, SPD=${character.base_speed}, INT=${intelligence}, HP=${character.base_health}`);
      updated++;
    }
    
    console.log(`\n🎉 Updated ${updated} characters with correct stats!`);
    process.exit(0);
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

fixCharacterStats();