import { query } from './src/database';

async function checkCharacterData() {
  try {
    const result = await query('SELECT * FROM characters LIMIT 1');
    console.log('Sample character data:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
    // Check what columns exist
    const columns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'characters'
      ORDER BY ordinal_position
    `);
    
    console.log('\nCharacters table columns:');
    console.table(columns.rows);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkCharacterData();