import { query } from './src/database';

async function checkTableStructure() {
  try {
    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_characters'
      ORDER BY ordinal_position
    `);
    
    console.log('user_characters table structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkTableStructure();