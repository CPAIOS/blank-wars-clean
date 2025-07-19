import { query } from './src/database';

async function showStats() {
  try {
    const result = await query(
      'SELECT character_id, strength, vitality, speed, intelligence, health FROM user_characters WHERE user_id = (SELECT id FROM users WHERE email = $1) ORDER BY character_id LIMIT 10',
      ['dev@test.com']
    );
    
    console.log('Current user_characters stats:');
    console.table(result.rows);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

showStats();